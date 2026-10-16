import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAllSantri = async (req, res) => {
  try {
    const { asrama_id } = req.query;
    let sql = `
      SELECT s.*, a.nama_asrama, a.gender as asrama_gender, k.nama_kamar
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
    `;
    const params = [];
    if (asrama_id) {
      sql += ` WHERE s.asrama_id = ? `;
      params.push(asrama_id);
    }
    sql += ` ORDER BY s.id ASC `;

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Data santri berhasil diambil', { data: rows || [] });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createSantri = async (req, res) => {
  try {
    const {
      kode_santri, nis, nisn, nama_santri, jk, tempat_lahir, tgl_lahir,
      status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
      nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk,
      username, password
    } = req.body;

    const finalNis = nis || Date.now().toString().slice(-6);
    const finalUsername = username ? String(username).trim() : finalNis;
    const finalPassword = password ? String(password).trim() : finalNis;

    const [result] = await pool.query(`
      INSERT INTO santri (
        kode_santri, nis, nisn, username, password, nama_santri, jk, tempat_lahir, tgl_lahir,
        status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
        nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kode_santri || `STR-${Date.now().toString().slice(-4)}`,
      finalNis,
      nisn || null,
      finalUsername,
      finalPassword,
      nama_santri,
      jk || 'L',
      tempat_lahir || '',
      tgl_lahir || null,
      status_santri || 'Mukim',
      asrama_id || null,
      kamar_id || null,
      fingerprint_pin || null,
      rfid_card_uid || null,
      nama_wali || '',
      no_wa_wali || '',
      hubungan_wali || 'Orang Tua (Ayah)',
      alamat_asal || '',
      status || 'Aktif',
      tahun_masuk || '2026/2027'
    ]);

    return sendSuccess(res, 'Data santri berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode_santri, nis, nisn, nama_santri, jk, tempat_lahir, tgl_lahir,
      status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
      nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk,
      capaian_hafalan_juz, tingkat_diniyah, username, password
    } = req.body;

    let updateFields = `
      kode_santri = ?, nis = ?, nisn = ?, nama_santri = ?, jk = ?,
      tempat_lahir = ?, tgl_lahir = ?, status_santri = ?, asrama_id = ?,
      kamar_id = ?, fingerprint_pin = ?, rfid_card_uid = ?, nama_wali = ?,
      no_wa_wali = ?, hubungan_wali = ?, alamat_asal = ?, status = ?,
      tahun_masuk = ?, capaian_hafalan_juz = ?, tingkat_diniyah = ?
    `;

    const params = [
      kode_santri, nis, nisn, nama_santri, jk,
      tempat_lahir, tgl_lahir, status_santri, asrama_id, kamar_id,
      fingerprint_pin, rfid_card_uid, nama_wali, no_wa_wali,
      hubungan_wali, alamat_asal, status, tahun_masuk,
      capaian_hafalan_juz || 0, tingkat_diniyah || 'Wustho'
    ];

    if (username !== undefined && String(username).trim() !== '') {
      updateFields += `, username = ?`;
      params.push(String(username).trim());
    }

    if (password !== undefined && String(password).trim() !== '') {
      updateFields += `, password = ?`;
      params.push(String(password).trim());
    }

    params.push(id);

    await pool.query(`UPDATE santri SET ${updateFields} WHERE id = ?`, params);

    return sendSuccess(res, 'Data santri berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteSantri = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM santri WHERE id = ?', [id]);
    return sendSuccess(res, 'Data santri berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
