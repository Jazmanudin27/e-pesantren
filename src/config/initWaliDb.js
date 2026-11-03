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

    // 1.5 Tambahkan kolom nisn jika belum ada
    if (!colNames.includes('nisn')) {
      try {
        await pool.query(`
          ALTER TABLE santri 
          ADD COLUMN nisn VARCHAR(50) NULL AFTER nis
        `);
        console.log('[E-PESANTREN DB] Kolom santri.nisn berhasil ditambahkan');
      } catch (err) {
        if (!err.message.includes('Duplicate column')) {
          console.warn('[E-PESANTREN DB] Gagal tambah santri.nisn:', err.message);
        }
      }
    }

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

    // 4. Generate NISN Random 10-Digit & Sinkronisasi Username = NISN, Password = 123456
    try {
      // Isi NISN acak 10 digit (format 00 + 8 digit acak unik) untuk santri yang masih kosong
      await pool.query(`
        UPDATE santri 
        SET nisn = CONCAT('00', LPAD(FLOOR(10000000 + (id * 13749) % 89999999), 8, '0'))
        WHERE nisn IS NULL OR TRIM(nisn) = ''
      `);

      // Set username = NISN untuk semua santri
      await pool.query(`
        UPDATE santri 
        SET username = nisn
        WHERE (username IS NULL OR TRIM(username) = '' OR username = nis) 
          AND nisn IS NOT NULL AND TRIM(nisn) != ''
      `);

      // Set default password = 123456 untuk semua santri yang masih kosong
      await pool.query(`
        UPDATE santri 
        SET password = '123456'
        WHERE (password IS NULL OR TRIM(password) = '')
      `);
    } catch (syncErr) {
      console.warn('[E-PESANTREN DB] Sinkronisasi NISN & Kredensial santri:', syncErr.message);
    }

    return true;
  } catch (err) {
    // Database connection might not be available during offline build
    console.warn('[E-PESANTREN DB] Init santri credentials skipped:', err.message);
    return false;
  }
}
