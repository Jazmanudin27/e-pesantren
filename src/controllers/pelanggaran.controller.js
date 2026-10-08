import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { sendWANotification } from '../utils/whatsapp.util.js';

export const getPelanggaran = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT tp.*, s.nama_santri, s.nis, s.no_wa_wali, a.nama_asrama, k.nama_kamar
      FROM tata_tertib_pelanggaran tp
      JOIN santri s ON tp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY tp.tanggal DESC, tp.id DESC
    `);
    return sendSuccess(res, 'Data pelanggaran berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createPelanggaran = async (req, res) => {
  try {
    const {
      santri_id, tanggal, kategori, jenis_pelanggaran, poin_pelanggaran,
      bentuk_tazir, status_tazir, musyrif_pencatat, wa_notif_wali
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO tata_tertib_pelanggaran (
        santri_id, tanggal, kategori, jenis_pelanggaran, poin_pelanggaran,
        bentuk_tazir, status_tazir, musyrif_pencatat, wa_notif_wali
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      tanggal || new Date().toISOString().split('T')[0],
      kategori || 'Ringan',
      jenis_pelanggaran || 'Terlambat Berjamaah',
      poin_pelanggaran || 5,
      bentuk_tazir || 'Membaca Surat Yasin',
      status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat || 'Biro Keamanan & Disiplin',
      wa_notif_wali !== undefined ? wa_notif_wali : 1
    ]);

    // Send WA Notification to Wali if enabled
    if (wa_notif_wali !== 0) {
      try {
        const [[santri]] = await pool.query('SELECT nama_santri, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
        if (santri && santri.no_wa_wali) {
          const msg = `[E-PESANTREN DISIPLIN]\n\nYth. Wali Santri ${santri.nama_santri},\nDiberitahukan bahwa santri tercatat melakukan pelanggaran:\n- Kategori: ${kategori || 'Ringan'}\n- Pelanggaran: ${jenis_pelanggaran}\n- Poin: +${poin_pelanggaran || 5}\n- Ta'zir: ${bentuk_tazir}\n\nMohon bimbingan dan kerja samanya. Terima kasih.`;
          sendWANotification(santri.no_wa_wali, msg);
        }
      } catch (e) {
        console.warn('Gagal kirim WA pelanggaran:', e.message);
      }
    }

    return sendSuccess(res, 'Catatan pelanggaran berhasil disimpan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updatePelanggaran = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      santri_id, tanggal, kategori, jenis_pelanggaran, poin_pelanggaran,
      bentuk_tazir, status_tazir, musyrif_pencatat, wa_notif_wali
    } = req.body;

    await pool.query(`
      UPDATE tata_tertib_pelanggaran SET
        santri_id = ?, tanggal = ?, kategori = ?, jenis_pelanggaran = ?,
        poin_pelanggaran = ?, bentuk_tazir = ?, status_tazir = ?,
        musyrif_pencatat = ?, wa_notif_wali = ?
      WHERE id = ?
    `, [
      santri_id,
      tanggal || new Date().toISOString().split('T')[0],
      kategori || 'Ringan',
      jenis_pelanggaran || '',
      poin_pelanggaran || 5,
      bentuk_tazir || '',
      status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat || '',
      wa_notif_wali !== undefined ? wa_notif_wali : 1,
      id
    ]);

    return sendSuccess(res, 'Catatan pelanggaran berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const finishTazir = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`
      UPDATE tata_tertib_pelanggaran SET status_tazir = 'Selesai Ta''zir' WHERE id = ?
    `, [id]);
    return sendSuccess(res, 'Ta\'zir telah dinyatakan selesai');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deletePelanggaran = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tata_tertib_pelanggaran WHERE id = ?', [id]);
    return sendSuccess(res, 'Catatan pelanggaran berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
