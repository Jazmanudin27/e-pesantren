-- ==============================================================================
-- SCRIPT PENGHAPUSAN FITUR TAHFIDZ (DATABASE E-PESANTREN)
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Hapus Semua Tabel Tahfidz
DROP TABLE IF EXISTS `tahfidz_ujian_tasmi`;
DROP TABLE IF EXISTS `tahfidz_setoran`;
DROP TABLE IF EXISTS `tahfidz_halaqah_santri`;
DROP TABLE IF EXISTS `tahfidz_halaqah`;

-- 2. Hapus Kolom Terkait Tahfidz pada Tabel Santri (Jika ada)
SET @exist_col := (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'santri' 
    AND COLUMN_NAME = 'capaian_hafalan_juz'
);
SET @sql_stmt := IF(@exist_col > 0, 'ALTER TABLE `santri` DROP COLUMN `capaian_hafalan_juz`', 'SELECT 1');
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Hapus Kolom Terkait Tahfidz pada Tabel Pesantren Profil (Jika ada)
SET @exist_col2 := (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pesantren_profil' 
    AND COLUMN_NAME = 'wa_auto_tahfidz'
);
SET @sql_stmt2 := IF(@exist_col2 > 0, 'ALTER TABLE `pesantren_profil` DROP COLUMN `wa_auto_tahfidz`', 'SELECT 1');
PREPARE stmt2 FROM @sql_stmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Semua tabel dan kolom Tahfidz berhasil dihapus dari database!' as status;

