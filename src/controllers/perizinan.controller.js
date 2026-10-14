import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { sendWANotification } from '../utils/whatsapp.util.js';

const VALID_STATUSES = [
  'Menunggu Persetujuan',
  'Disetujui Pengasuh',
  'Aktif Keluar',
  'Kembali Tepat Waktu',
  'Terlambat Kembali',
  'Ditolak'
];

const VALID_JENIS = [
  'Izin Pulang',
  'Izin Berobat',
  'Izin Keluar Komplek',
  'Izin Khusus'
];

const normalizeStatus = (st) => {
  if (!st) return 'Aktif Keluar';
  if (VALID_STATUSES.includes(st)) return st;
  const s = String(st).toLowerCase();
  if (s.includes('terlambat')) return 'Terlambat Kembali';
  if (s.includes('kembali') || s.includes('tepat')) return 'Kembali Tepat Waktu';
  if (s.includes('tolak')) return 'Ditolak';
  if (s.includes('tunggu')) return 'Menunggu Persetujuan';
  if (s.includes('keluar') || s.includes('luar') || s.includes('setuju')) return 'Aktif Keluar';
  return 'Aktif Keluar';
};

const normalizeJenis = (j) => {
  if (!j) return 'Izin Pulang';
  if (VALID_JENIS.includes(j)) return j;
  if (j === 'Izin Mendesak') return 'Izin Khusus';
  return 'Izin Pulang';
};

const formatSqlDate = (d) => {
  if (!d) return null;
  if (typeof d === 'string') {
    const clean = d.replace('T', ' ');
    return clean.length === 16 ? clean + ':00' : clean;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const getPerizinan = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sp.*, s.nama_santri, s.nis, s.no_wa_wali, a.nama_asrama, k.nama_kamar
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY sp.id DESC
    `);
    return sendSuccess(res, 'Data perizinan berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createPerizinan = async (req, res) => {
  try {
    const {
      santri_id, jenis_izin, keperluan, tgl_keluar_rencana, tgl_kembali_rencana,
      nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, status, disetujui_oleh
    } = req.body;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const kode_izin = `IZN-${Date.now().toString().slice(-4)}-${randomSuffix}`;
    const barcode = `PSN-IZN-${Date.now().toString().slice(-6)}`;

    const cleanJenis = normalizeJenis(jenis_izin);
    const cleanStatus = normalizeStatus(status);
    const sqlKeluarRencana = formatSqlDate(tgl_keluar_rencana) || formatSqlDate(new Date());
    const sqlKembaliRencana = formatSqlDate(tgl_kembali_rencana) || formatSqlDate(new Date());
    const sqlKeluarAktual = (cleanStatus === 'Aktif Keluar') ? formatSqlDate(new Date()) : null;

    const [result] = await pool.query(`
      INSERT INTO santri_perizinan (
        kode_izin, barcode, santri_id, jenis_izin, tgl_keluar_rencana, tgl_kembali_rencana, tgl_keluar_aktual,
        nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, keperluan, status, disetujui_oleh
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kode_izin,
      barcode,
      santri_id,
      cleanJenis,
      sqlKeluarRencana,
      sqlKembaliRencana,
      sqlKeluarAktual,
      nama_penjemput_mahrom || '',
      no_hp_penjemput || '',
      hubungan_mahrom || 'Orang Tua',
      keperluan || '',
      cleanStatus,
      disetujui_oleh || 'Dewan Pengasuh'
    ]);

    // Send WA Notification to Wali
    try {
      const [[santri]] = await pool.query('SELECT nama_santri, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
      if (santri && santri.no_wa_wali) {
        const msg = `[RUANG PONPES NOTIFIKASI IZIN]\n\nYth. Wali Santri ${santri.nama_santri},\nPermohonan ${cleanJenis} telah *${cleanStatus}*.\n\nKode Izin: ${kode_izin}\nPenjemput: ${nama_penjemput_mahrom || '-'}\nRencana Pulang: ${tgl_keluar_rencana}\nRencana Kembali: ${tgl_kembali_rencana}\n\nTerima kasih.`;
        sendWANotification(santri.no_wa_wali, msg);
      }
    } catch (e) {
      console.warn('Gagal kirim WA perizinan:', e.message);
    }

    return sendSuccess(res, 'Izin santri berhasil dibuat', { id: result.insertId, barcode, kode_izin, status: cleanStatus }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updatePerizinan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      santri_id, jenis_izin, keperluan, tgl_keluar_rencana, tgl_kembali_rencana,
      nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, status, disetujui_oleh,
      satpam_keluar, satpam_kembali
    } = req.body;

    const cleanJenis = normalizeJenis(jenis_izin);
    const cleanStatus = normalizeStatus(status);
    const sqlKeluarRencana = formatSqlDate(tgl_keluar_rencana);
    const sqlKembaliRencana = formatSqlDate(tgl_kembali_rencana);

    await pool.query(`
      UPDATE santri_perizinan SET
        santri_id = ?, jenis_izin = ?, tgl_keluar_rencana = ?, tgl_kembali_rencana = ?,
        nama_penjemput_mahrom = ?, no_hp_penjemput = ?, hubungan_mahrom = ?, keperluan = ?,
        status = ?, disetujui_oleh = ?, satpam_keluar = ?, satpam_kembali = ?
      WHERE id = ?
    `, [
      santri_id, cleanJenis, sqlKeluarRencana, sqlKembaliRencana,
      nama_penjemput_mahrom || '', no_hp_penjemput || '', hubungan_mahrom || 'Orang Tua',
      keperluan || '', cleanStatus, disetujui_oleh || 'Dewan Pengasuh',
      satpam_keluar || null, satpam_kembali || null, id
    ]);

    return sendSuccess(res, 'Data perizinan berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deletePerizinan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM santri_perizinan WHERE id = ?', [id]);
    return sendSuccess(res, 'Data perizinan berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const checkoutPerizinan = async (req, res) => {
  try {
    const { id, satpam } = req.body;
    await pool.query(`
      UPDATE santri_perizinan 
      SET status = 'Aktif Keluar', tgl_keluar_aktual = NOW(), satpam_keluar = ?
      WHERE id = ?
    `, [satpam || 'Petugas Pos Gerbang', id]);
    return sendSuccess(res, 'Santri tercatat keluar gerbang');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const checkinPerizinan = async (req, res) => {
  try {
    const { id, satpam, tgl_kembali_aktual } = req.body;
    const [[izin]] = await pool.query('SELECT tgl_kembali_rencana FROM santri_perizinan WHERE id = ?', [id]);
    
    const waktuKembali = tgl_kembali_aktual ? new Date(tgl_kembali_aktual) : new Date();
    let statusKembali = 'Kembali Tepat Waktu';
    
    if (izin && izin.tgl_kembali_rencana) {
      const rencana = new Date(izin.tgl_kembali_rencana);
      if (waktuKembali > rencana) {
        statusKembali = 'Terlambat Kembali';
      }
    }

    const sqlKembaliAktual = formatSqlDate(waktuKembali) || formatSqlDate(new Date());

    await pool.query(`
      UPDATE santri_perizinan 
      SET status = ?, tgl_kembali_aktual = ?, satpam_kembali = ?
      WHERE id = ?
    `, [statusKembali, sqlKembaliAktual, satpam || 'Pengurus Pesantren', id]);

    return sendSuccess(res, `Santri tercatat kembali ke pesantren (${statusKembali})`, { status: statusKembali });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
