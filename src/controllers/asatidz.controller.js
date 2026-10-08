import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAsatidz = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asatidz ORDER BY id ASC');
    return sendSuccess(res, 'Data asatidz berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createAsatidz = async (req, res) => {
  try {
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status } = req.body;
    const [result] = await pool.query(`
      INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nama_asatidz, gelar || '', nik_niy || `AST-${Date.now().toString().slice(-4)}`, jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif']);
    return sendSuccess(res, 'Data asatidz berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateAsatidz = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status } = req.body;
    await pool.query(`
      UPDATE asatidz SET
        nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, no_hp = ?, email = ?, alamat = ?, status = ?
      WHERE id = ?
    `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif', id]);
    return sendSuccess(res, 'Data asatidz berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteAsatidz = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM asatidz WHERE id = ?', [id]);
    return sendSuccess(res, 'Data asatidz berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
