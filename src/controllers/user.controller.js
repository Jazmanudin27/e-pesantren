import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getUsers = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, name, username, email, role, status, phone, created_at, updated_at FROM users ORDER BY id ASC'
      );
    } catch (colErr) {
      // Fallback if phone column not yet added
      [rows] = await pool.query(
        'SELECT id, name, username, email, role, status, created_at, updated_at FROM users ORDER BY id ASC'
      );
    }
    return sendSuccess(res, 'Data pengguna sistem berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name, username, email, role, status, phone, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows || rows.length === 0) {
      return sendError(res, 'Pengguna tidak ditemukan', 404);
    }
    return sendSuccess(res, 'Detail pengguna ditemukan', { data: rows[0] });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, username, email, password, role, status, phone } = req.body;

    if (!name || !username || !password) {
      return sendError(res, 'Nama, Username, dan Password wajib diisi', 400);
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@pesantren.id`;
    const cleanRole = role || 'Ustadz';
    const cleanStatus = status || 'Active';
    const cleanPhone = phone ? String(phone).trim() : '-';

    // Cek username duplikat
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE LOWER(TRIM(username)) = ? LIMIT 1',
      [cleanUsername]
    );
    if (existing && existing.length > 0) {
      return sendError(res, `Username "${cleanUsername}" sudah digunakan oleh pengguna lain. Silakan pilih username lain.`, 409);
    }

    const hashedPassword = bcrypt.hashSync(String(password).trim(), 10);

    try {
      const [result] = await pool.query(
        `INSERT INTO users (name, username, email, password, role, status, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name.trim(), cleanUsername, cleanEmail, hashedPassword, cleanRole, cleanStatus, cleanPhone]
      );
      return sendSuccess(res, 'Pengguna baru berhasil ditambahkan', { id: result.insertId }, 201);
    } catch (insertErr) {
      // Fallback jika kolom phone belum ada
      const [result] = await pool.query(
        `INSERT INTO users (name, username, email, password, role, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name.trim(), cleanUsername, cleanEmail, hashedPassword, cleanRole, cleanStatus]
      );
      return sendSuccess(res, 'Pengguna baru berhasil ditambahkan', { id: result.insertId }, 201);
    }
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, email, password, role, status, phone } = req.body;

    if (!name || !username) {
      return sendError(res, 'Nama dan Username wajib diisi', 400);
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@pesantren.id`;
    const cleanRole = role || 'Ustadz';
    const cleanStatus = status || 'Active';
    const cleanPhone = phone ? String(phone).trim() : '-';

    // Cek apakah username dipakai oleh akun lain
    const [duplicateCheck] = await pool.query(
      'SELECT id FROM users WHERE LOWER(TRIM(username)) = ? AND id != ? LIMIT 1',
      [cleanUsername, id]
    );
    if (duplicateCheck && duplicateCheck.length > 0) {
      return sendError(res, `Username "${cleanUsername}" sudah dipakai oleh pengguna lain.`, 409);
    }

    // Jika password diisi, update beserta password baru
    if (password && String(password).trim().length > 0) {
      const hashedPassword = bcrypt.hashSync(String(password).trim(), 10);
      try {
        await pool.query(
          `UPDATE users SET name = ?, username = ?, email = ?, password = ?, role = ?, status = ?, phone = ? WHERE id = ?`,
          [name.trim(), cleanUsername, cleanEmail, hashedPassword, cleanRole, cleanStatus, cleanPhone, id]
        );
      } catch (colErr) {
        await pool.query(
          `UPDATE users SET name = ?, username = ?, email = ?, password = ?, role = ?, status = ? WHERE id = ?`,
          [name.trim(), cleanUsername, cleanEmail, hashedPassword, cleanRole, cleanStatus, id]
        );
      }
    } else {
      // Tanpa ganti password
      try {
        await pool.query(
          `UPDATE users SET name = ?, username = ?, email = ?, role = ?, status = ?, phone = ? WHERE id = ?`,
          [name.trim(), cleanUsername, cleanEmail, cleanRole, cleanStatus, cleanPhone, id]
        );
      } catch (colErr) {
        await pool.query(
          `UPDATE users SET name = ?, username = ?, email = ?, role = ?, status = ? WHERE id = ?`,
          [name.trim(), cleanUsername, cleanEmail, cleanRole, cleanStatus, id]
        );
      }
    }

    return sendSuccess(res, 'Data pengguna berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Proteksi akun superadmin pertama
    if (String(id) === '1') {
      return sendError(res, 'Akun Administrator Utama tidak boleh dihapus demi keamanan sistem!', 403);
    }

    const [target] = await pool.query('SELECT username FROM users WHERE id = ? LIMIT 1', [id]);
    if (!target || target.length === 0) {
      return sendError(res, 'Pengguna tidak ditemukan', 404);
    }

    if (target[0].username === 'admin') {
      return sendError(res, 'Akun "admin" adalah akun induk sistem dan tidak dapat dihapus!', 403);
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return sendSuccess(res, `Pengguna "${target[0].username}" berhasil dihapus.`);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Inactive', 'Suspended'].includes(status)) {
      return sendError(res, 'Status tidak valid. Pilihan: Active, Inactive, Suspended', 400);
    }

    // Hindari menonaktifkan akun root id 1
    if (String(id) === '1' && status !== 'Active') {
      return sendError(res, 'Akun Administrator Utama tidak dapat dinonaktifkan!', 403);
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    return sendSuccess(res, `Status pengguna berhasil diubah menjadi ${status}`);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const finalPass = new_password && String(new_password).trim().length >= 4 
      ? String(new_password).trim() 
      : '123456';

    const hashedPassword = bcrypt.hashSync(finalPass, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    return sendSuccess(res, `Password berhasil direset. Password baru: ${finalPass}`);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
