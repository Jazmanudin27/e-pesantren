import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAsatidz = async (req, res) => {
  try {
    // Pastikan kolom kategori_asatidz dan tipe password panjang untuk hash SHA-256 / SHA-512 / Bcrypt
    try {
      await pool.query(`ALTER TABLE asatidz ADD COLUMN IF NOT EXISTS kategori_asatidz VARCHAR(50) DEFAULT 'Mustahiq' AFTER tugas_utama`);
      await pool.query(`ALTER TABLE asatidz MODIFY COLUMN password VARCHAR(255) DEFAULT NULL`);
    } catch (e) {}

    // Auto-isi username & password dengan enkripsi SHA-256 / SHA-512 jika masih NULL
    try {
      await pool.query(`
        UPDATE asatidz 
        SET 
          username = COALESCE(NULLIF(TRIM(username), ''), LOWER(REPLACE(COALESCE(nik_niy, CONCAT('ustadz', id)), ' ', ''))),
          password = COALESCE(NULLIF(TRIM(password), ''), SHA2('123456', 256))
        WHERE username IS NULL OR TRIM(username) = '' OR password IS NULL OR TRIM(password) = ''
      `);
    } catch (e) {}

    const [rows] = await pool.query('SELECT * FROM asatidz ORDER BY id ASC');
    return sendSuccess(res, 'Data asatidz berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createAsatidz = async (req, res) => {
  try {
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, kategori_asatidz, no_hp, email, alamat, status, username, password } = req.body;
    const finalUser = (username || nik_niy || '').trim();
    const finalPass = password ? bcrypt.hashSync(String(password).trim(), 10) : bcrypt.hashSync('12345', 10);
    const finalKat = kategori_asatidz || tugas_utama || 'Mustahiq';

    // Coba simpan dengan kolom kategori_asatidz, username & password
    try {
      const [result] = await pool.query(`
        INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, kategori_asatidz, no_hp, email, alamat, status, username, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [nama_asatidz, gelar || '', nik_niy || `AST-${Date.now().toString().slice(-4)}`, jk || 'L', tugas_utama || finalKat, finalKat, no_hp || '', email || '', alamat || '', status || 'Aktif', finalUser, finalPass]);
      return sendSuccess(res, 'Data asatidz berhasil ditambahkan', { id: result.insertId }, 201);
    } catch (dbErr) {
      const [result] = await pool.query(`
        INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, no_hp, email, alamat, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [nama_asatidz, gelar || '', nik_niy || `AST-${Date.now().toString().slice(-4)}`, jk || 'L', tugas_utama || finalKat, no_hp || '', email || '', alamat || '', status || 'Aktif']);
      return sendSuccess(res, 'Data asatidz berhasil ditambahkan', { id: result.insertId }, 201);
    }
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateAsatidz = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_asatidz, gelar, nik_niy, jk, tugas_utama, kategori_asatidz, no_hp, email, alamat, status, username, password } = req.body;
    const finalKat = kategori_asatidz || tugas_utama || 'Mustahiq';
    
    // Coba update dengan kategori_asatidz, username & password
    try {
      if (password && String(password).trim().length > 0) {
        const hashed = bcrypt.hashSync(String(password).trim(), 10);
        await pool.query(`
          UPDATE asatidz SET
            nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, kategori_asatidz = ?, no_hp = ?, email = ?, alamat = ?, status = ?, username = ?, password = ?
          WHERE id = ?
        `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || finalKat, finalKat, no_hp || '', email || '', alamat || '', status || 'Aktif', username || nik_niy, hashed, id]);
      } else {
        await pool.query(`
          UPDATE asatidz SET
            nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, kategori_asatidz = ?, no_hp = ?, email = ?, alamat = ?, status = ?, username = ?
          WHERE id = ?
        `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || finalKat, finalKat, no_hp || '', email || '', alamat || '', status || 'Aktif', username || nik_niy, id]);
      }
      return sendSuccess(res, 'Data asatidz berhasil diperbarui');
    } catch (dbErr) {
      await pool.query(`
        UPDATE asatidz SET
          nama_asatidz = ?, gelar = ?, nik_niy = ?, jk = ?, tugas_utama = ?, no_hp = ?, email = ?, alamat = ?, status = ?
        WHERE id = ?
      `, [nama_asatidz, gelar || '', nik_niy || '', jk || 'L', tugas_utama || finalKat, no_hp || '', email || '', alamat || '', status || 'Aktif', id]);
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
