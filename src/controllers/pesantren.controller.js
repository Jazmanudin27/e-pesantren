import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getProfilPesantren = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pesantren_profil LIMIT 1');
    return sendSuccess(res, 'Profil pesantren berhasil diambil', { data: rows[0] || null });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
