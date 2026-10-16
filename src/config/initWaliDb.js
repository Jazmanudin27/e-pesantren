import pool from './database.js';

/**
 * Otomatis memastikan kolom username dan password tersedia di tabel santri
 * Default username = NIS santri
 * Default password = NIS santri (atau 123456 jika NIS kosong)
 */
export async function ensureSantriCredentialsColumns() {
  try {
    // 1. Cek kolom yang sudah ada di tabel santri
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'santri' AND TABLE_SCHEMA = DATABASE()
    `);

    const colNames = (columns || []).map(c => c.COLUMN_NAME.toLowerCase());

    // 2. Tambahkan kolom username jika belum ada
    if (!colNames.includes('username')) {
      try {
        await pool.query(`
          ALTER TABLE santri 
          ADD COLUMN username VARCHAR(100) NULL UNIQUE AFTER nisn
        `);
        console.log('[E-PESANTREN DB] Kolom santri.username berhasil ditambahkan');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          console.warn('[E-PESANTREN DB] Gagal tambah santri.username:', err.message);
        }
      }
    }

    // 3. Tambahkan kolom password jika belum ada
    if (!colNames.includes('password')) {
      try {
        await pool.query(`
          ALTER TABLE santri 
          ADD COLUMN password VARCHAR(255) NULL AFTER username
        `);
        console.log('[E-PESANTREN DB] Kolom santri.password berhasil ditambahkan');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          console.warn('[E-PESANTREN DB] Gagal tambah santri.password:', err.message);
        }
      }
    }

    // 4. Sinkronisasi username & password default dari NIS untuk data santri yang masih kosong
    try {
      await pool.query(`
        UPDATE santri 
        SET username = nis 
        WHERE (username IS NULL OR TRIM(username) = '') 
          AND nis IS NOT NULL AND TRIM(nis) != ''
      `);

      await pool.query(`
        UPDATE santri 
        SET password = nis 
        WHERE (password IS NULL OR TRIM(password) = '') 
          AND nis IS NOT NULL AND TRIM(nis) != ''
      `);
    } catch (syncErr) {
      console.warn('[E-PESANTREN DB] Sinkronisasi kredensial santri:', syncErr.message);
    }

    return true;
  } catch (err) {
    // Database connection might not be available during offline build
    console.warn('[E-PESANTREN DB] Init santri credentials skipped:', err.message);
    return false;
  }
}
