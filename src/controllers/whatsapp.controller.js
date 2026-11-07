import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import {
  ensureWhatsAppTables,
  getWhatsAppConfig,
  sendWhatsApp,
  formatPhoneNumber
} from '../services/whatsapp.service.js';

/**
 * GET /api/whatsapp/settings
 * Mengambil pengaturan konfigurasi WhatsApp dan statistik pengiriman
 */
export const getSettings = async (req, res) => {
  try {
    await ensureWhatsAppTables();
    const config = await getWhatsAppConfig();

    // Masking token untuk keamanan tampilan (tampilkan 4 digit awal & 4 digit akhir)
    let maskedToken = '';
    if (config.api_token) {
      const t = config.api_token.trim();
      maskedToken = t.length > 8 ? `${t.slice(0, 4)}••••••••${t.slice(-4)}` : '••••••••';
    }

    // Statistik log
    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as total_sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_total,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'sent' THEN 1 ELSE 0 END) as today_sent
      FROM whatsapp_logs
    `).catch(() => [[{ total_logs: 0, total_sent: 0, total_failed: 0, today_total: 0, today_sent: 0 }]]);

    return sendSuccess(res, 'Pengaturan WhatsApp berhasil diambil', {
      settings: {
        ...config,
        has_token: !!config.api_token,
        masked_token: maskedToken
      },
      stats: stats || {}
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/whatsapp/settings
 * Memperbarui pengaturan WhatsApp
 */
export const updateSettings = async (req, res) => {
  try {
    await ensureWhatsAppTables();
    const {
      provider,
      api_token,
      server_url,
      sender_number,
      is_active,
      auto_sakit,
      auto_izin,
      auto_alfa,
      auto_tazir,
      auto_perizinan,
      delay_seconds,
      footer_text
    } = req.body;

    const current = await getWhatsAppConfig();
    const newToken = api_token !== undefined && !String(api_token).includes('••••') 
      ? api_token.trim() 
      : current.api_token;

    await pool.query(`
      UPDATE whatsapp_settings SET
        provider = ?,
        api_token = ?,
        server_url = ?,
        sender_number = ?,
        is_active = ?,
        auto_sakit = ?,
        auto_izin = ?,
        auto_alfa = ?,
        auto_tazir = ?,
        auto_perizinan = ?,
        delay_seconds = ?,
        footer_text = ?,
        updated_at = NOW()
      WHERE id = 1
    `, [
      provider || current.provider || 'fonnte',
      newToken,
      server_url !== undefined ? server_url : current.server_url,
      sender_number !== undefined ? sender_number : current.sender_number,
      is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
      auto_sakit !== undefined ? (auto_sakit ? 1 : 0) : current.auto_sakit,
      auto_izin !== undefined ? (auto_izin ? 1 : 0) : current.auto_izin,
      auto_alfa !== undefined ? (auto_alfa ? 1 : 0) : current.auto_alfa,
      auto_tazir !== undefined ? (auto_tazir ? 1 : 0) : current.auto_tazir,
      auto_perizinan !== undefined ? (auto_perizinan ? 1 : 0) : current.auto_perizinan,
      delay_seconds !== undefined ? parseInt(delay_seconds) || 2 : current.delay_seconds,
      footer_text !== undefined ? footer_text : current.footer_text
    ]);

    return sendSuccess(res, 'Pengaturan WhatsApp berhasil disimpan');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/whatsapp/test
 * Kirim pesan tes ke nomor admin
 */
export const testSend = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) {
      return sendError(res, 'Nomor WhatsApp tujuan wajib diisi', 400);
    }

    const testMsg = message || `*TES KONEKSI WHATSAPP GATEWAY*\n\nAlhamdulillah, koneksi sistem E-Pesantren Nurul Wafa ke WhatsApp Gateway berhasil aktif dan terhubung dengan baik.\n\nWaktu: ${new Date().toLocaleString('id-ID')}`;

    const result = await sendWhatsApp({
      target: phone,
      message: testMsg,
      target_nama: 'Admin / Pengurus (Tes)',
      kategori: 'test'
    });

    if (!result.success) {
      return sendError(res, `Gagal mengirim WhatsApp tes: ${result.message || 'Periksa API Token / Provider'}`, 400);
    }

    return sendSuccess(res, 'Pesan tes WhatsApp berhasil dikirim!', result);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/whatsapp/tunggakan
 * Mengambil daftar santri yang memiliki tunggakan / belum melunasi tagihan
 */
export const getTunggakanList = async (req, res) => {
  try {
    const { periode_bulan, kelas_id, search } = req.query;

    let whereClause = "WHERE t.status IN ('Belum Dibayar', 'Dicicil', 'Sebagian') AND t.sisa_tagihan > 0";
    const params = [];

    if (periode_bulan && periode_bulan !== 'Semua') {
      whereClause += " AND t.periode_bulan = ?";
      params.push(periode_bulan);
    }

    if (kelas_id && kelas_id !== 'Semua') {
      whereClause += " AND (s.kelas_id = ? OR s.nama_kelas = ?)";
      params.push(kelas_id, kelas_id);
    }

    if (search && String(search).trim() !== '') {
      whereClause += " AND (s.nama_santri LIKE ? OR s.nis LIKE ? OR s.nama_wali LIKE ? OR s.no_wa_wali LIKE ?)";
      const q = `%${String(search).trim()}%`;
      params.push(q, q, q, q);
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nis,
        s.nama_santri,
        s.nama_kelas,
        s.nama_wali,
        s.no_wa_wali,
        COUNT(t.id) as jumlah_tagihan,
        SUM(t.sisa_tagihan) as total_tunggakan,
        GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (', t.periode_bulan, '): Rp ', FORMAT(t.sisa_tagihan, 0)) SEPARATOR '\n') as rincian_tagihan,
        MIN(t.jatuh_tempo) as jatuh_tempo_terdekat
      FROM keuangan_tagihan t
      JOIN santri s ON t.santri_id = s.id
      ${whereClause}
      GROUP BY s.id, s.nis, s.nama_santri, s.nama_kelas, s.nama_wali, s.no_wa_wali
      ORDER BY total_tunggakan DESC, s.nama_santri ASC
    `, params);

    // Ambil daftar periode bulan unik untuk dropdown filter
    const [periodeList] = await pool.query(`
      SELECT DISTINCT periode_bulan 
      FROM keuangan_tagihan 
      WHERE periode_bulan IS NOT NULL AND periode_bulan != ''
      ORDER BY id DESC
    `).catch(() => [[]]);

    return sendSuccess(res, 'Daftar tunggakan berhasil diambil', {
      total_santri: rows.length,
      total_nominal: rows.reduce((acc, r) => acc + parseFloat(r.total_tunggakan || 0), 0),
      santri_list: rows,
      periode_list: (periodeList || []).map(p => p.periode_bulan)
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/whatsapp/broadcast-tagihan
 * Mengirim broadcast tagihan ke daftar santri yang dipilih
 */
export const broadcastTagihan = async (req, res) => {
  try {
    const { santri_ids, template_pesan, delay_seconds } = req.body;

    if (!Array.isArray(santri_ids) || santri_ids.length === 0) {
      return sendError(res, 'Pilih minimal 1 santri untuk dikirimkan broadcast tagihan', 400);
    }

    const config = await getWhatsAppConfig();
    if (!config.api_token) {
      return sendError(res, 'API Token WhatsApp belum disetel. Buka tab Pengaturan Gateway.', 400);
    }

    // Ambil rincian data santri & total tunggakan mereka
    const [santriList] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nis,
        s.nama_santri,
        s.nama_kelas,
        s.nama_wali,
        s.no_wa_wali,
        SUM(t.sisa_tagihan) as total_tunggakan,
        GROUP_CONCAT(CONCAT('- ', t.judul_tagihan, ' (', t.periode_bulan, '): Rp ', FORMAT(t.sisa_tagihan, 0, 'id_ID')) SEPARATOR '\n') as rincian_tagihan
      FROM santri s
      JOIN keuangan_tagihan t ON s.id = t.santri_id
      WHERE s.id IN (?) AND t.status IN ('Belum Dibayar', 'Dicicil', 'Sebagian') AND t.sisa_tagihan > 0
      GROUP BY s.id, s.nis, s.nama_santri, s.nama_kelas, s.nama_wali, s.no_wa_wali
    `, [santri_ids]);

    if (!santriList || santriList.length === 0) {
      return sendError(res, 'Tidak ditemukan tagihan aktif untuk santri terpilih', 400);
    }

    // Jalankan pengiriman di background agar request API langsung respon cepat
    const delayMs = Math.max(1000, (parseInt(delay_seconds) || config.delay_seconds || 2) * 1000);

    // Kirim respons balik ke UI dulu (Fire-and-Forget queue)
    sendSuccess(res, `Pengiriman broadcast tagihan untuk ${santriList.length} santri sedang diproses di background.`, {
      total_target: santriList.length,
      estimasi_selesai_detik: Math.round((santriList.length * delayMs) / 1000)
    });

    // Proses pengiriman berurutan dengan jeda aman
    (async () => {
      console.log(`[WA BROADCAST] Memulai pengiriman batch ke ${santriList.length} nomor...`);
      for (let i = 0; i < santriList.length; i++) {
        const item = santriList[i];
        const waNumber = item.no_wa_wali;

        if (!waNumber || String(waNumber).trim() === '' || String(waNumber).trim() === '-') {
          console.warn(`[WA BROADCAST SKIP] Santri ${item.nama_santri} tidak memiliki no WA wali valid.`);
          continue;
        }

        const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.total_tunggakan || 0);

        // Buat susunan pesan
        let msg = template_pesan || `Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Wali dari *{nama_santri}* (Kelas {nama_kelas})
Pondok Pesantren Nurul Wafa

Menginformasikan rekapitulasi kewajiban administrasi/SPP ananda yang tercatat pada sistem kami:

*Rincian Tagihan:*
{rincian_tagihan}

*Total Belum Lunas:* {total_tagihan}

Pembayaran dapat dilakukan melalui loket kantor pesantren atau via transfer/QRIS melalui aplikasi Portal Wali Santri.

Atas perhatian dan kerjasamanya, kami haturkan terima kasih.
Wassalamu'alaikum Wr. Wb.
_Biro Administrasi & Keuangan Pesantren_`;

        msg = msg
          .replace(/{nama_santri}/g, item.nama_santri || 'Santri')
          .replace(/{nama_kelas}/g, item.nama_kelas || '-')
          .replace(/{nama_wali}/g, item.nama_wali || 'Bapak/Ibu')
          .replace(/{rincian_tagihan}/g, item.rincian_tagihan || 'Tagihan Rutin')
          .replace(/{total_tagihan}/g, totalFormatted);

        try {
          await sendWhatsApp({
            target: waNumber,
            message: msg,
            santri_id: item.santri_id,
            target_nama: item.nama_wali || item.nama_santri,
            kategori: 'tagihan'
          });
        } catch (e) {
          console.warn(`[WA BROADCAST ERROR] Target ${item.nama_santri}:`, e.message);
        }

        // Delay antar pesan agar tidak diblokir WA
        if (i < santriList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      console.log(`[WA BROADCAST] Selesai memproses batch ${santriList.length} pesan.`);
    })();

  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/whatsapp/logs
 * Mengambil daftar riwayat pengiriman pesan WhatsApp
 */
export const getLogs = async (req, res) => {
  try {
    await ensureWhatsAppTables();
    const { kategori, status, limit = 50, page = 1 } = req.query;

    const limitNum = Math.min(200, Math.max(10, parseInt(limit) || 50));
    const offset = (Math.max(1, parseInt(page) || 1) - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (kategori && kategori !== 'semua') {
      whereClause += ' AND kategori = ?';
      params.push(kategori);
    }

    if (status && status !== 'semua') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM whatsapp_logs ${whereClause}`,
      params
    );

    const [rows] = await pool.query(`
      SELECT 
        l.*,
        s.nama_santri,
        s.nis,
        s.nama_kelas
      FROM whatsapp_logs l
      LEFT JOIN santri s ON l.santri_id = s.id
      ${whereClause}
      ORDER BY l.id DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    return sendSuccess(res, 'Log WhatsApp berhasil diambil', {
      total,
      limit: limitNum,
      page: parseInt(page) || 1,
      logs: rows
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

