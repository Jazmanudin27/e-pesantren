-- ==============================================================================
-- MIGRASI: TAMBAH USERNAME & PASSWORD PADA TABEL SANTRI UNTUK AKUN ORANG TUA/WALI
-- Jalankan file ini langsung di phpMyAdmin / MySQL Terminal di server
-- ==============================================================================

-- 1. Tambah kolom username jika belum ada
SET @col_exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'santri' AND COLUMN_NAME = 'username' AND TABLE_SCHEMA = DATABASE());
SET @query := IF(@col_exist = 0, 'ALTER TABLE santri ADD COLUMN username VARCHAR(100) NULL UNIQUE AFTER nisn', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tambah kolom password jika belum ada
SET @col_exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'santri' AND COLUMN_NAME = 'password' AND TABLE_SCHEMA = DATABASE());
SET @query := IF(@col_exist = 0, 'ALTER TABLE santri ADD COLUMN password VARCHAR(255) NULL AFTER username', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Isi default username = nis untuk santri yang masih kosong
UPDATE santri 
SET username = nis 
WHERE (username IS NULL OR TRIM(username) = '') 
  AND nis IS NOT NULL AND TRIM(nis) != '';

-- 4. Isi default password = nis untuk santri yang masih kosong
UPDATE santri 
SET password = nis 
WHERE (password IS NULL OR TRIM(password) = '') 
  AND nis IS NOT NULL AND TRIM(nis) != '';

-- Cek hasil
SELECT id, nis, nama_santri, username, password FROM santri LIMIT 10;
