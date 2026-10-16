-- ==============================================================================
-- MIGRATION: Hapus / Bersihkan Data Penjemput Mahrom dari santri_perizinan
-- Jalankan query ini di MySQL / phpMyAdmin database pesantren
-- ==============================================================================

-- 1. Ubah kolom penjemput menjadi NULLABLE agar tidak wajib diisi
ALTER TABLE `santri_perizinan` 
  MODIFY COLUMN `nama_penjemput_mahrom` VARCHAR(150) NULL DEFAULT NULL,
  MODIFY COLUMN `no_hp_penjemput` VARCHAR(30) NULL DEFAULT NULL,
  MODIFY COLUMN `hubungan_mahrom` VARCHAR(50) NULL DEFAULT NULL;

-- 2. Bersihkan seluruh data penjemput yang sebelumnya tersimpan
UPDATE `santri_perizinan` 
SET 
  `nama_penjemput_mahrom` = NULL,
  `no_hp_penjemput` = NULL,
  `hubungan_mahrom` = NULL;
