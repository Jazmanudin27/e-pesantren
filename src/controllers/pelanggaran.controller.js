import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { sendWANotification } from '../utils/whatsapp.util.js';
import { createWaliNotification } from './notifikasi.controller.js';

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

    if (!santri_id) {
      return sendError(res, 'Santri wajib dipilih', 400);
    }
    if (!jenis_pelanggaran || String(jenis_pelanggaran).trim() === '') {
      return sendError(res, 'Jenis pelanggaran wajib diisi', 400);
    }

    const [result] = await pool.query(`
      INSERT INTO tata_tertib_pelanggaran (
        santri_id, tanggal, kategori, jenis_pelanggaran, poin_pelanggaran,
        bentuk_tazir, status_tazir, musyrif_pencatat, wa_notif_wali
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      tanggal || new Date().toISOString().split('T')[0],
      kategori || 'Ringan',
      String(jenis_pelanggaran).trim(),
      parseInt(poin_pelanggaran, 10) || 0,
      bentuk_tazir ? String(bentuk_tazir).trim() : '-',
      status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat ? String(musyrif_pencatat).trim() : (req.user?.nama || 'Petugas'),
      wa_notif_wali !== undefined ? wa_notif_wali : 1
    ]);

    // Send WA Notification to Wali if enabled
    if (wa_notif_wali !== 0) {
      try {
        const [[santri]] = await pool.query('SELECT nama_santri, nama_wali, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
        if (santri && santri.no_wa_wali) {
          const msg = `*PEMBERITAHUAN KEDISIPLINAN & TATA TERTIB*
_Pondok Pesantren Nurul Wafa_

Assalamu'alaikum Wr. Wb.
Yth. Bapak/Ibu Wali dari *${santri.nama_santri}*,

Diberitahukan bahwa ananda tercatat dalam pembinaan tata tertib pesantren:
• Kategori: *${kategori || 'Ringan'}* (${poin_pelanggaran || 0} Poin)
• Catatan: ${jenis_pelanggaran}
• Bentuk Pembinaan/Ta'zir: *${bentuk_tazir || '-'}*
• Status Ta'zir: ${status_tazir || 'Sedang Dalam Pembinaan'}

Pemberitahuan ini bertujuan agar pihak keluarga dan dewan pengasuh dapat bersama-sama membimbing ananda menjadi pribadi yang lebih berakhlak dan disiplin.

Wassalamu'alaikum Wr. Wb.
_Biro Pengasuhan & Keamanan Santri_`;

          sendWANotification(santri.no_wa_wali, msg, {
            santri_id,
            target_nama: santri.nama_wali || santri.nama_santri,
            kategori: 'tazir'
          });
        }
      } catch (e) {
        console.warn('Gagal kirim WA pelanggaran:', e.message);
      }
    }

    createWaliNotification({
      santri_id,
      kategori: 'pelanggaran',
      judul: `Catatan Kedisiplinan (${kategori || 'Ringan'})`,
      pesan: `Ananda tercatat melakukan pelanggaran: "${jenis_pelanggaran}". Pembinaan/Ta'zir: ${bentuk_tazir || '-'}.`,
      target_tab: 'pelanggaran'
    });

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

    if (!santri_id || !jenis_pelanggaran) {
      return sendError(res, 'Santri dan jenis pelanggaran wajib diisi', 400);
    }

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
      String(jenis_pelanggaran).trim(),
      parseInt(poin_pelanggaran, 10) || 0,
      bentuk_tazir ? String(bentuk_tazir).trim() : '-',
      status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat ? String(musyrif_pencatat).trim() : '',
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
    const [[record]] = await pool.query('SELECT status_tazir FROM tata_tertib_pelanggaran WHERE id = ?', [id]);
    if (record && record.status_tazir === "Selesai Ta'zir") {
      return sendError(res, 'Pelanggaran yang sudah selesai ta\'zir tidak boleh dihapus!', 400);
    }
    await pool.query('DELETE FROM tata_tertib_pelanggaran WHERE id = ?', [id]);
    return sendSuccess(res, 'Catatan pelanggaran berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
