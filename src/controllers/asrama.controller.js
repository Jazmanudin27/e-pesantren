import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAsramaAndKamar = async (req, res) => {
  try {
    const [asramaRows] = await pool.query(`
      SELECT a.id, a.kode_asrama, a.nama_asrama, a.gender, a.lokasi_gedung, a.pembina_asatidz_id, a.created_at,
             ast.nama_asatidz as pembina,
             (SELECT COUNT(*) FROM santri s WHERE s.asrama_id = a.id) as total_santri,
             (SELECT COUNT(*) FROM kamar_kobong k WHERE k.asrama_id = a.id) as total_kamar
      FROM asrama a
      LEFT JOIN asatidz ast ON a.pembina_asatidz_id = ast.id
      ORDER BY a.id ASC
    `);

    const [kamarRows] = await pool.query(`
      SELECT k.*, a.nama_asrama, a.gender as asrama_gender,
             (SELECT COUNT(*) FROM santri s WHERE s.kamar_id = k.id) as terisi
      FROM kamar_kobong k
      JOIN asrama a ON k.asrama_id = a.id
      ORDER BY k.asrama_id ASC, k.id ASC
    `);

    return sendSuccess(res, 'Data asrama dan kamar berhasil diambil', { asrama: asramaRows, kamar: kamarRows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createAsrama = async (req, res) => {
  try {
    const { nama_asrama, kode_asrama, gender, lokasi_gedung, pembina_asatidz_id } = req.body;
    const [result] = await pool.query(`
      INSERT INTO asrama (nama_asrama, kode_asrama, gender, lokasi_gedung, pembina_asatidz_id)
      VALUES (?, ?, ?, ?, ?)
    `, [
      nama_asrama, 
      kode_asrama || `ASR-${Date.now().toString().slice(-3)}`, 
      gender || 'L', 
      lokasi_gedung || '', 
      pembina_asatidz_id || null
    ]);
    return sendSuccess(res, 'Data asrama berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createKamar = async (req, res) => {
  try {
    const { asrama_id, kode_kamar, nama_kamar, lantai, kapasitas, ketua_kamar, status } = req.body;
    const [result] = await pool.query(`
      INSERT INTO kamar_kobong (asrama_id, kode_kamar, nama_kamar, lantai, kapasitas, ketua_kamar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [asrama_id || 1, kode_kamar || `KMR-${Date.now().toString().slice(-3)}`, nama_kamar, lantai || 1, kapasitas || 10, ketua_kamar || '', status || 'Tersedia']);
    return sendSuccess(res, 'Data kamar kobong berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateKamar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kamar, kode_kamar, asrama_id, lantai, kapasitas, ketua_kamar } = req.body;
    await pool.query(`
      UPDATE kamar_kobong SET
        nama_kamar = ?, kode_kamar = ?, asrama_id = ?, lantai = ?, kapasitas = ?, ketua_kamar = ?
      WHERE id = ?
    `, [nama_kamar, kode_kamar, asrama_id || 1, lantai || 1, kapasitas || 10, ketua_kamar || '', id]);
    return sendSuccess(res, 'Data kamar kobong berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteKamar = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kamar_kobong WHERE id = ?', [id]);
    return sendSuccess(res, 'Data kamar kobong berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
