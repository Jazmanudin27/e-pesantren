import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getHalaqah = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, ast.nama_asatidz,
             (SELECT COUNT(*) FROM tahfidz_halaqah_santri hs WHERE hs.halaqah_id = h.id) as total_santri
      FROM tahfidz_halaqah h
      LEFT JOIN asatidz ast ON h.asatidz_id = ast.id
      ORDER BY h.id ASC
    `);
    return sendSuccess(res, 'Data halaqah berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createHalaqah = async (req, res) => {
  try {
    const { nama_halaqah, kode_halaqah, asatidz_id, gender, target_program, waktu_halaqah, lokasi_halaqah } = req.body;
    const [result] = await pool.query(`
      INSERT INTO tahfidz_halaqah (nama_halaqah, kode_halaqah, asatidz_id, gender, target_program, waktu_halaqah, lokasi_halaqah, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [nama_halaqah, kode_halaqah || `HLQ-${Date.now().toString().slice(-3)}`, asatidz_id || null, gender || 'L', target_program || '', waktu_halaqah || '', lokasi_halaqah || '']);
    return sendSuccess(res, 'Halaqah berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateHalaqah = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_halaqah, asatidz_id, gender, target_program, waktu_halaqah, lokasi_halaqah } = req.body;
    await pool.query(`
      UPDATE tahfidz_halaqah SET
        nama_halaqah = ?, asatidz_id = ?, gender = ?, target_program = ?, waktu_halaqah = ?, lokasi_halaqah = ?
      WHERE id = ?
    `, [nama_halaqah, asatidz_id || null, gender || 'L', target_program || '', waktu_halaqah || '', lokasi_halaqah || '', id]);
    return sendSuccess(res, 'Halaqah berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteHalaqah = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tahfidz_halaqah WHERE id = ?', [id]);
    return sendSuccess(res, 'Halaqah berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getSetoran = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ts.*, s.nama_santri, s.nis, a.nama_asrama, k.nama_kamar, ast.nama_asatidz, th.nama_halaqah
      FROM tahfidz_setoran ts
      JOIN santri s ON ts.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN asatidz ast ON ts.asatidz_id = ast.id
      LEFT JOIN tahfidz_halaqah th ON ts.halaqah_id = th.id
      ORDER BY ts.tanggal DESC, ts.id DESC
    `);
    return sendSuccess(res, 'Data setoran tahfidz berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createSetoran = async (req, res) => {
  try {
    const {
      santri_id, halaqah_id, asatidz_id, tanggal, jenis_setoran, juz,
      surat_mulai, ayat_mulai, surat_selesai, ayat_selesai, kualitas_tajwid,
      status, catatan
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO tahfidz_setoran (
        santri_id, halaqah_id, asatidz_id, tanggal, jenis_setoran, juz,
        surat_mulai, ayat_mulai, surat_selesai, ayat_selesai, kualitas_tajwid,
        status, catatan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      halaqah_id || null,
      asatidz_id || 1,
      tanggal || new Date().toISOString().split('T')[0],
      jenis_setoran || 'Ziyadah',
      juz || 1,
      surat_mulai || 'Al-Baqarah',
      ayat_mulai || 1,
      surat_selesai || 'Al-Baqarah',
      ayat_selesai || 10,
      kualitas_tajwid || 'Mumtaz (A)',
      status || 'Lulus',
      catatan || ''
    ]);

    if (santri_id && juz && status === 'Lulus') {
      await pool.query(`
        UPDATE santri SET capaian_hafalan_juz = GREATEST(capaian_hafalan_juz, ?) WHERE id = ?
      `, [juz, santri_id]);
    }

    return sendSuccess(res, 'Setoran tahfidz berhasil dicatat', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateSetoran = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      santri_id, halaqah_id, asatidz_id, tanggal, jenis_setoran, juz,
      surat_mulai, ayat_mulai, surat_selesai, ayat_selesai, kualitas_tajwid,
      status, catatan
    } = req.body;

    await pool.query(`
      UPDATE tahfidz_setoran SET
        santri_id = ?, halaqah_id = ?, asatidz_id = ?, tanggal = ?, jenis_setoran = ?,
        juz = ?, surat_mulai = ?, ayat_mulai = ?, surat_selesai = ?, ayat_selesai = ?,
        kualitas_tajwid = ?, status = ?, catatan = ?
      WHERE id = ?
    `, [
      santri_id, halaqah_id || null, asatidz_id || 1, tanggal, jenis_setoran || 'Ziyadah',
      juz || 1, surat_mulai || '', ayat_mulai || 1, surat_selesai || '', ayat_selesai || 1,
      kualitas_tajwid || 'Mumtaz (A)', status || 'Lulus', catatan || '', id
    ]);

    return sendSuccess(res, 'Data setoran tahfidz berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteSetoran = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tahfidz_setoran WHERE id = ?', [id]);
    return sendSuccess(res, 'Data setoran berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
