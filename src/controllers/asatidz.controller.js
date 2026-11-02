import bcrypt from 'bcryptjs';
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
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status, username, password } = req.body;
    const finalUser = (username || nik_niy || '').trim();
    const finalPass = password ? bcrypt.hashSync(String(password).trim(), 10) : bcrypt.hashSync('12345', 10);

    // Coba simpan dengan kolom username & password (jika kolom sudah ada di DB)
    try {
      const [result] = await pool.query(`
        INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status, username, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [nama_asatidz, gelar || '', nik_niy || `AST-${Date.now().toString().slice(-4)}`, jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif', finalUser, finalPass]);
      return sendSuccess(res, 'Data asatidz berhasil ditambahkan', { id: result.insertId }, 201);
    } catch (dbErr) {
      // Fallback jika kolom username/password belum ditambahkan di DB
      const [result] = await pool.query(`
        INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [nama_asatidz, gelar || '', nik_niy || `AST-${Date.now().toString().slice(-4)}`, jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif']);
      return sendSuccess(res, 'Data asatidz berhasil ditambahkan', { id: result.insertId }, 201);
    }
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateAsatidz = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status, username, password } = req.body;
    
    // Coba update dengan username & password
    try {
      if (password && String(password).trim().length > 0) {
        const hashed = bcrypt.hashSync(String(password).trim(), 10);
        await pool.query(`
          UPDATE asatidz SET
            nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, no_hp = ?, email = ?, alamat = ?, status = ?, username = ?, password = ?
          WHERE id = ?
        `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif', username || nik_niy, hashed, id]);
      } else {
        await pool.query(`
          UPDATE asatidz SET
            nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, no_hp = ?, email = ?, alamat = ?, status = ?, username = ?
          WHERE id = ?
        `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif', username || nik_niy, id]);
      }
      return sendSuccess(res, 'Data asatidz berhasil diperbarui');
    } catch (dbErr) {
      // Fallback jika kolom belum ada
      await pool.query(`
        UPDATE asatidz SET
          nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, no_hp = ?, email = ?, alamat = ?, status = ?
        WHERE id = ?
      `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || '', no_hp || '', email || '', alamat || '', status || 'Aktif', id]);
      return sendSuccess(res, 'Data asatidz berhasil diperbarui');
    }
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
