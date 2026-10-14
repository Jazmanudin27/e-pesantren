import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getKelas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT k.*,
             (SELECT COUNT(*) FROM santri s WHERE s.kelas = k.nama_kelas OR s.kelas = k.id) as total_santri
      FROM kelas k
      ORDER BY k.id ASC
    `);
    return sendSuccess(res, 'Data kelas berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createKelas = async (req, res) => {
  try {
    const { id, kode_kelas, nama_kelas, tingkat, gender } = req.body;
    const finalGender = gender || (nama_kelas?.toUpperCase().includes('GIRL') ? 'P' : 'L');
    const finalTingkat = tingkat || (nama_kelas?.startsWith('1') ? 'Kelas 1' : nama_kelas?.startsWith('2') ? 'Kelas 2' : nama_kelas?.startsWith('3') ? 'Kelas 3' : 'Kelas 4');

    const [result] = await pool.query(`
      INSERT INTO kelas (id, kode_kelas, nama_kelas, tingkat, gender)
      VALUES (?, ?, ?, ?, ?)
    `, [id || null, kode_kelas || nama_kelas, nama_kelas, finalTingkat, finalGender]);

    return sendSuccess(res, 'Kelas berhasil ditambahkan', { id: result.insertId || id }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateKelas = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode_kelas, nama_kelas, tingkat, gender } = req.body;
    await pool.query(`
      UPDATE kelas SET 
        kode_kelas = COALESCE(?, kode_kelas),
        nama_kelas = COALESCE(?, nama_kelas),
        tingkat = COALESCE(?, tingkat),
        gender = COALESCE(?, gender)
      WHERE id = ?
    `, [kode_kelas, nama_kelas, tingkat, gender, id]);

    return sendSuccess(res, 'Data kelas berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteKelas = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kelas WHERE id = ?', [id]);
    return sendSuccess(res, 'Kelas berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
