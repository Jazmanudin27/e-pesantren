import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAllSantri = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, a.nama_asrama, a.gender as asrama_gender, k.nama_kamar
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY s.id ASC
    `);
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
      nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO santri (
        kode_santri, nis, nisn, nama_santri, jk, tempat_lahir, tgl_lahir,
        status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
        nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kode_santri || `STR-${Date.now().toString().slice(-4)}`,
      nis || Date.now().toString().slice(-6),
      nisn || null,
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
      capaian_hafalan_juz, tingkat_diniyah
    } = req.body;

    await pool.query(`
      UPDATE santri SET
        kode_santri = ?, nis = ?, nisn = ?, nama_santri = ?, jk = ?,
        tempat_lahir = ?, tgl_lahir = ?, status_santri = ?, asrama_id = ?,
        kamar_id = ?, fingerprint_pin = ?, rfid_card_uid = ?, nama_wali = ?,
        no_wa_wali = ?, hubungan_wali = ?, alamat_asal = ?, status = ?,
        tahun_masuk = ?, capaian_hafalan_juz = ?, tingkat_diniyah = ?
      WHERE id = ?
    `, [
      kode_santri, nis, nisn, nama_santri, jk,
      tempat_lahir, tgl_lahir, status_santri, asrama_id, kamar_id,
      fingerprint_pin, rfid_card_uid, nama_wali, no_wa_wali,
      hubungan_wali, alamat_asal, status, tahun_masuk,
      capaian_hafalan_juz || 0, tingkat_diniyah || 'Wustho', id
    ]);

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
