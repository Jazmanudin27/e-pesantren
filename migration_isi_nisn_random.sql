-- ==============================================================================
-- MIGRASI: GENERATE NISN RANDOM 10-DIGIT, USERNAME = NISN, PASSWORD = 123456
-- Jalankan di MySQL Terminal / phpMyAdmin di server
-- ==============================================================================

-- 1. Tambah kolom nisn jika belum ada
SET @col_exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'santri' AND COLUMN_NAME = 'nisn' AND TABLE_SCHEMA = DATABASE());
SET @query := IF(@col_exist = 0, 'ALTER TABLE santri ADD COLUMN nisn VARCHAR(50) NULL AFTER nis', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Tambah kolom username jika belum ada
SET @col_exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'santri' AND COLUMN_NAME = 'username' AND TABLE_SCHEMA = DATABASE());
SET @query := IF(@col_exist = 0, 'ALTER TABLE santri ADD COLUMN username VARCHAR(100) NULL UNIQUE AFTER nisn', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Tambah kolom password jika belum ada
SET @col_exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'santri' AND COLUMN_NAME = 'password' AND TABLE_SCHEMA = DATABASE());
SET @query := IF(@col_exist = 0, 'ALTER TABLE santri ADD COLUMN password VARCHAR(255) NULL AFTER username', 'SELECT 1');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Generate NISN acak 10-digit (format 00 + 8 digit angka unik teratur)
UPDATE santri 
SET nisn = CONCAT('00', LPAD(FLOOR(10000000 + (id * 13749) % 89999999), 8, '0'))
WHERE nisn IS NULL OR TRIM(nisn) = '';

-- 5. Set username = NISN untuk semua santri
UPDATE santri 
SET username = nisn
WHERE (username IS NULL OR TRIM(username) = '' OR username = nis)
  AND nisn IS NOT NULL AND TRIM(nisn) != '';

-- 6. Set password default = 123456 untuk semua santri yang masih kosong
UPDATE santri 
SET password = '123456'
WHERE password IS NULL OR TRIM(password) = '';

-- Cek rincian 10 data santri pertama
SELECT id, nis, nisn, nama_santri, username, password FROM santri LIMIT 10;

