import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { sendWANotification } from '../utils/whatsapp.util.js';

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

    const [result] = await pool.query(`
      INSERT INTO santri_perizinan (
        kode_izin, barcode, santri_id, jenis_izin, tgl_keluar_rencana, tgl_kembali_rencana,
        nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, keperluan, status, disetujui_oleh
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kode_izin,
      barcode,
      santri_id,
      jenis_izin || 'Izin Pulang',
      tgl_keluar_rencana || new Date(),
      tgl_kembali_rencana || new Date(),
      nama_penjemput_mahrom || '',
      no_hp_penjemput || '',
      hubungan_mahrom || 'Orang Tua',
      keperluan || '',
      status || 'Disetujui Pengasuh',
      disetujui_oleh || 'Dewan Pengasuh'
    ]);

    // Send WA Notification to Wali
    try {
      const [[santri]] = await pool.query('SELECT nama_santri, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
      if (santri && santri.no_wa_wali) {
        const msg = `[E-PESANTREN NOTIFIKASI IZIN]\n\nYth. Wali Santri ${santri.nama_santri},\nPermohonan ${jenis_izin || 'Izin'} telah *${status || 'Disetujui'}*.\n\nKode Izin: ${kode_izin}\nPenjemput: ${nama_penjemput_mahrom || '-'}\nRencana Pulang: ${tgl_keluar_rencana}\nRencana Kembali: ${tgl_kembali_rencana}\n\nTerima kasih.`;
        sendWANotification(santri.no_wa_wali, msg);
      }
    } catch (e) {
      console.warn('Gagal kirim WA perizinan:', e.message);
    }

    return sendSuccess(res, 'Izin santri berhasil dibuat', { id: result.insertId, barcode, kode_izin }, 201);
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

    await pool.query(`
      UPDATE santri_perizinan SET
        santri_id = ?, jenis_izin = ?, tgl_keluar_rencana = ?, tgl_kembali_rencana = ?,
        nama_penjemput_mahrom = ?, no_hp_penjemput = ?, hubungan_mahrom = ?, keperluan = ?,
        status = ?, disetujui_oleh = ?, satpam_keluar = ?, satpam_kembali = ?
      WHERE id = ?
    `, [
      santri_id, jenis_izin || 'Izin Pulang', tgl_keluar_rencana, tgl_kembali_rencana,
      nama_penjemput_mahrom || '', no_hp_penjemput || '', hubungan_mahrom || 'Orang Tua',
      keperluan || '', status || 'Menunggu Persetujuan', disetujui_oleh || 'Dewan Pengasuh',
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
    const { id, satpam } = req.body;
    await pool.query(`
      UPDATE santri_perizinan 
      SET status = 'Kembali Tepat Waktu', tgl_kembali_aktual = NOW(), satpam_kembali = ?
      WHERE id = ?
    `, [satpam || 'Petugas Pos Gerbang', id]);
    return sendSuccess(res, 'Santri berhasil check-in kembali ke pesantren');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
