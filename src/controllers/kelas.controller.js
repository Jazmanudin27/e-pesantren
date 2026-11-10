import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

let isKelasTableChecked = false;

export const ensureKelasColumns = async () => {
  if (isKelasTableChecked) return;
  try {
    // 1. Pastikan tabel kelas ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`kelas\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_kelas\` VARCHAR(50) NULL,
        \`nama_kelas\` VARCHAR(100) NOT NULL,
        \`mustahiq\` VARCHAR(150) NULL,
        \`munawwib\` VARCHAR(150) NULL,
        \`tingkat\` VARCHAR(100) NULL,
        \`gender\` ENUM('L', 'P', 'Semua') DEFAULT 'Semua',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Cek kolom yang ada
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'kelas' AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = (cols || []).map(c => c.COLUMN_NAME.toLowerCase());

    if (!colNames.includes('mustahiq')) {
      try {
        await pool.query(`ALTER TABLE \`kelas\` ADD COLUMN \`mustahiq\` VARCHAR(150) NULL AFTER \`nama_kelas\``);
      } catch (e) {}
    }
    if (!colNames.includes('munawwib')) {
      try {
        await pool.query(`ALTER TABLE \`kelas\` ADD COLUMN \`munawwib\` VARCHAR(150) NULL AFTER \`mustahiq\``);
      } catch (e) {}
    }
    if (!colNames.includes('tingkat')) {
      try {
        await pool.query(`ALTER TABLE \`kelas\` ADD COLUMN \`tingkat\` VARCHAR(100) NULL AFTER \`munawwib\``);
      } catch (e) {}
    }
    if (!colNames.includes('gender')) {
      try {
        await pool.query(`ALTER TABLE \`kelas\` ADD COLUMN \`gender\` ENUM('L', 'P', 'Semua') DEFAULT 'Semua' AFTER \`tingkat\``);
      } catch (e) {}
    }

    // 3. Migrasikan data pengampu/wali_kelas lama ke mustahiq jika ada
    if (colNames.includes('pengampu')) {
      try {
        await pool.query(`UPDATE \`kelas\` SET \`mustahiq\` = \`pengampu\` WHERE (\`mustahiq\` IS NULL OR \`mustahiq\` = '') AND \`pengampu\` IS NOT NULL`);
      } catch (e) {}
    }
    if (colNames.includes('wali_kelas')) {
      try {
        await pool.query(`UPDATE \`kelas\` SET \`mustahiq\` = \`wali_kelas\` WHERE (\`mustahiq\` IS NULL OR \`mustahiq\` = '') AND \`wali_kelas\` IS NOT NULL`);
      } catch (e) {}
    }

    isKelasTableChecked = true;
  } catch (err) {
    console.warn('[KELAS CONTROLLER] Note ensure columns:', err.message);
  }
};

export const getKelas = async (req, res) => {
  try {
    await ensureKelasColumns();

    // Query data kelas murni dari database beserta total santri terkini
    const [rows] = await pool.query(`
      SELECT k.*,
        COALESCE(k.mustahiq, '') as mustahiq,
        COALESCE(k.munawwib, '') as munawwib,
        COALESCE(k.tingkat, '') as tingkat,
        (SELECT COUNT(*) FROM santri s WHERE s.nama_kelas = k.nama_kelas OR s.kelas_id = k.id) as total_santri
      FROM kelas k 
      ORDER BY k.id ASC
    `);

    return sendSuccess(res, 'Data kelas berhasil diambil', { data: rows || [], kelas: rows || [] });
  } catch (err) {
    return sendError(res, `Gagal memuat kelas: ${err.message}`, 500);
  }
};

export const createKelas = async (req, res) => {
  try {
    await ensureKelasColumns();
    const { id, kode_kelas, nama_kelas, mustahiq, munawwib, tingkat, gender } = req.body;
    const finalGender = gender || (nama_kelas?.toUpperCase().includes('GIRL') ? 'P' : 'L');
    const finalTingkat = tingkat || (nama_kelas?.startsWith('1') ? 'Kelas 1' : nama_kelas?.startsWith('2') ? 'Kelas 2' : nama_kelas?.startsWith('3') ? 'Kelas 3' : 'Kelas 4');

    const [result] = await pool.query(`
      INSERT INTO kelas (id, kode_kelas, nama_kelas, mustahiq, munawwib, tingkat, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id || null, 
      kode_kelas || `KLS-${Date.now().toString().slice(-4)}`, 
      nama_kelas, 
      mustahiq || null, 
      munawwib || null, 
      finalTingkat, 
      finalGender
    ]);

    return sendSuccess(res, 'Kelas berhasil ditambahkan', { id: result.insertId || id }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateKelas = async (req, res) => {
  try {
    await ensureKelasColumns();
    const { id } = req.params;
    const { kode_kelas, nama_kelas, mustahiq, munawwib, tingkat, gender } = req.body;

    await pool.query(`
      UPDATE kelas SET 
        kode_kelas = COALESCE(?, kode_kelas),
        nama_kelas = COALESCE(?, nama_kelas),
        mustahiq = ?,
        munawwib = ?,
        tingkat = COALESCE(?, tingkat),
        gender = COALESCE(?, gender)
      WHERE id = ?
    `, [kode_kelas, nama_kelas, mustahiq || null, munawwib || null, tingkat, gender, id]);

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
