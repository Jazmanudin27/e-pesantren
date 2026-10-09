-- ==============================================================================
-- DATABASE SCHEMA E-PESANTREN (TAHFIDZ, ASRAMA, PERIZINAN & ABSENSI FINGERPRINT)
-- Target Database: epesantren (atau sesuai .env)
-- Kompatibilitas: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Engine: InnoDB | Charset: utf8mb4 | Collate: utf8mb4_unicode_ci
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- ------------------------------------------------------------------------------
-- 1. TABEL PROFIL PESANTREN / PONDOK
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pesantren_profil` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_pesantren` VARCHAR(50) NOT NULL UNIQUE,
  `nama_pesantren` VARCHAR(255) NOT NULL DEFAULT 'Pondok Pesantren Nurul Wafa',
  `nsp` VARCHAR(50) DEFAULT '510032780001',
  `pengasuh_kiai` VARCHAR(150) DEFAULT 'KH. M. Syukron Ma\'mun, Lc., M.A.',
  `alamat` TEXT NULL,
  `kota` VARCHAR(100) DEFAULT 'Tasikmalaya',
  `no_hp` VARCHAR(30) DEFAULT '081288881111',
  `email` VARCHAR(100) DEFAULT 'info@epesantren.sch.id',
  `wa_provider` VARCHAR(50) DEFAULT 'fonnte',
  `wa_api_token` VARCHAR(255) DEFAULT NULL,
  `wa_auto_absen` TINYINT(1) DEFAULT 1,
  `wa_auto_tahfidz` TINYINT(1) DEFAULT 1,
  `wa_auto_izin` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABEL PENGGUNA SISTEM / USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Super Admin', 'Pengasuh', 'Ustadz', 'Musyrif', 'Keamanan', 'Wali Santri') NOT NULL DEFAULT 'Super Admin',
  `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABEL MASTER ASATIDZ, PENGASUH & MUSYRIF
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asatidz` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nik_niy` VARCHAR(50) DEFAULT '-',
  `nama_asatidz` VARCHAR(150) NOT NULL,
  `gelar` VARCHAR(50) DEFAULT 'S.Pd.I',
  `jk` ENUM('L', 'P') DEFAULT 'L',
  `no_hp` VARCHAR(30) DEFAULT '-',
  `email` VARCHAR(100) DEFAULT '-',
  `tugas_utama` VARCHAR(100) DEFAULT 'Musyrif Asrama & Tahfidz',
  `status` ENUM('Aktif', 'Cuti', 'Nonaktif') DEFAULT 'Aktif',
  `user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_asatidz_status` (`status`),
  INDEX `idx_asatidz_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABEL MASTER ASRAMA & KAMAR KOBONG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asrama` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_asrama` VARCHAR(50) NOT NULL UNIQUE,
  `nama_asrama` VARCHAR(150) NOT NULL,
  `gender` ENUM('L', 'P') NOT NULL DEFAULT 'L',
  `pembina_asatidz_id` INT DEFAULT NULL,
  `lokasi_gedung` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_asrama_gender` (`gender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `kamar_kobong` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asrama_id` INT NOT NULL,
  `kode_kamar` VARCHAR(50) NOT NULL,
  `nama_kamar` VARCHAR(100) NOT NULL,
  `kapasitas` INT NOT NULL DEFAULT 10,
  `ketua_kamar` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_asrama_kamar` (`asrama_id`, `kode_kamar`),
  INDEX `idx_kamar_asrama` (`asrama_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABEL MASTER SANTRI (MAPPING FINGERPRINT & KOBONG)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `santri` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_santri` VARCHAR(50) NOT NULL UNIQUE,
  `nis` VARCHAR(50) NOT NULL UNIQUE,
  `nisn` VARCHAR(50) DEFAULT NULL,
  `fingerprint_pin` INT DEFAULT NULL UNIQUE, -- User ID di Mesin Fingerprint
  `rfid_card_uid` VARCHAR(50) DEFAULT NULL, -- Opsional kartu RFID tap
  `nama_santri` VARCHAR(150) NOT NULL,
  `jk` ENUM('L', 'P') NOT NULL DEFAULT 'L',
  `status_santri` ENUM('Mukim', 'Kalong', 'Non-Mukim') NOT NULL DEFAULT 'Mukim',
  `asrama_id` INT DEFAULT NULL,
  `kamar_id` INT DEFAULT NULL,
  `capaian_hafalan_juz` INT DEFAULT 0,
  `nama_wali` VARCHAR(150) NOT NULL,
  `no_wa_wali` VARCHAR(30) NOT NULL,
  `hubungan_wali` VARCHAR(50) DEFAULT 'Orang Tua (Ayah)',
  `alamat_asal` TEXT DEFAULT NULL,
  `status` ENUM('Aktif', 'Alumni', 'Boyong', 'Mutasi') NOT NULL DEFAULT 'Aktif',
  `tahun_masuk` VARCHAR(20) DEFAULT '2026/2027',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_santri_nis` (`nis`),
  INDEX `idx_santri_fp` (`fingerprint_pin`),
  INDEX `idx_santri_asrama` (`asrama_id`),
  INDEX `idx_santri_kamar` (`kamar_id`),
  INDEX `idx_santri_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABEL TAHFIDZ, HALAQAH & MUTABA'AH QUR'AN
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tahfidz_halaqah` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_halaqah` VARCHAR(150) NOT NULL,
  `asatidz_id` INT NOT NULL,
  `target_program` VARCHAR(150) DEFAULT 'Ziyadah & Muroja\'ah',
  `waktu_halaqah` VARCHAR(100) DEFAULT 'Ba\'da Shubuh & Maghrib',
  `gender` ENUM('L', 'P') NOT NULL DEFAULT 'L',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_halaqah_asatidz` (`asatidz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tahfidz_halaqah_santri` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `halaqah_id` INT NOT NULL,
  `santri_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_halaqah_santri` (`halaqah_id`, `santri_id`),
  INDEX `idx_hs_halaqah` (`halaqah_id`),
  INDEX `idx_hs_santri` (`santri_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tahfidz_setoran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `santri_id` INT NOT NULL,
  `halaqah_id` INT DEFAULT NULL,
  `asatidz_id` INT NOT NULL,
  `tanggal` DATE NOT NULL,
  `jenis_setoran` ENUM('Ziyadah', 'Sabqi', 'Muroja\'ah', 'Tasmi\' Bil-Ghoib') NOT NULL DEFAULT 'Ziyadah',
  `juz` INT NOT NULL,
  `surat_mulai` VARCHAR(100) NOT NULL,
  `ayat_mulai` INT NOT NULL,
  `surat_selesai` VARCHAR(100) NOT NULL,
  `ayat_selesai` INT NOT NULL,
  `kualitas_tajwid` ENUM('Mumtaz (A)', 'Jayyid Jiddan (B+)', 'Jayyid (B)', 'Maqbul (C)', 'Rombak/Ulang') NOT NULL DEFAULT 'Mumtaz (A)',
  `status` ENUM('Lulus', 'Perlu Pengulangan', 'Mengulang') NOT NULL DEFAULT 'Lulus',
  `catatan` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_setoran_santri` (`santri_id`),
  INDEX `idx_setoran_tgl` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tahfidz_ujian_tasmi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `santri_id` INT NOT NULL,
  `kategori_juz` VARCHAR(50) NOT NULL,
  `tanggal_ujian` DATE NOT NULL,
  `penguji_asatidz_id` INT NOT NULL,
  `nilai_fashohah` DECIMAL(5,2) DEFAULT 0.00,
  `nilai_tajwid` DECIMAL(5,2) DEFAULT 0.00,
  `nilai_kelancaran` DECIMAL(5,2) DEFAULT 0.00,
  `nilai_akhir` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `predikat` VARCHAR(50) DEFAULT 'Mumtaz Syaraf',
  `syahadah_diterbitkan` TINYINT(1) DEFAULT 0,
  `nomor_syahadah` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tasmi_santri` (`santri_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABEL PERIZINAN SANTRI & VALIDASI MAHROM GERBANG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `santri_perizinan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_izin` VARCHAR(50) NOT NULL UNIQUE,
  `barcode` VARCHAR(50) NOT NULL UNIQUE,
  `santri_id` INT NOT NULL,
  `jenis_izin` ENUM('Izin Pulang', 'Izin Berobat', 'Izin Keluar Komplek', 'Izin Khusus') NOT NULL DEFAULT 'Izin Pulang',
  `tgl_keluar_rencana` DATETIME NOT NULL,
  `tgl_kembali_rencana` DATETIME NOT NULL,
  `tgl_keluar_aktual` DATETIME DEFAULT NULL,
  `tgl_kembali_aktual` DATETIME DEFAULT NULL,
  `nama_penjemput_mahrom` VARCHAR(150) NOT NULL,
  `no_hp_penjemput` VARCHAR(30) NOT NULL,
  `hubungan_mahrom` VARCHAR(50) DEFAULT 'Orang Tua',
  `keperluan` TEXT NOT NULL,
  `status` ENUM('Menunggu Persetujuan', 'Disetujui Pengasuh', 'Aktif Keluar', 'Kembali Tepat Waktu', 'Terlambat Kembali', 'Ditolak') NOT NULL DEFAULT 'Menunggu Persetujuan',
  `disetujui_oleh` VARCHAR(150) DEFAULT NULL,
  `satpam_keluar` VARCHAR(100) DEFAULT NULL,
  `satpam_kembali` VARCHAR(100) DEFAULT NULL,
  `catatan_satpam` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_izin_santri` (`santri_id`),
  INDEX `idx_izin_status` (`status`),
  INDEX `idx_izin_barcode` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABEL KEDISIPLINAN, PELANGGARAN & TA'ZIR SANTRI
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tata_tertib_pelanggaran` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `santri_id` INT NOT NULL,
  `tanggal` DATE NOT NULL,
  `kategori` ENUM('Ringan', 'Sedang', 'Berat') NOT NULL DEFAULT 'Ringan',
  `jenis_pelanggaran` VARCHAR(255) NOT NULL,
  `poin_pelanggaran` INT NOT NULL DEFAULT 5,
  `bentuk_tazir` TEXT NOT NULL,
  `status_tazir` ENUM('Belum Dikerjakan', 'Sedang Proses', 'Selesai Ta\'zir') NOT NULL DEFAULT 'Belum Dikerjakan',
  `musyrif_pencatat` VARCHAR(150) NOT NULL,
  `wa_notif_wali` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pelanggaran_santri` (`santri_id`),
  INDEX `idx_pelanggaran_tgl` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABEL MESIN FINGERPRINT (PERANGKAT & LOKASI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fingerprint_device` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_device` VARCHAR(100) NOT NULL, -- Contoh: 'Fingerprint Masjid Putra', 'Fingerprint Aula Putri'
  `sn_device` VARCHAR(100) NOT NULL UNIQUE,
  `ip_address` VARCHAR(50) NOT NULL DEFAULT '192.168.1.201',
  `port` INT NOT NULL DEFAULT 4370,
  `comm_key` VARCHAR(50) DEFAULT '0',
  `lokasi` VARCHAR(150) NOT NULL DEFAULT 'Masjid Utama',
  `peruntukan` ENUM('Ikhwan', 'Akhwat', 'Semua') NOT NULL DEFAULT 'Semua',
  `status_koneksi` ENUM('Online', 'Offline') NOT NULL DEFAULT 'Online',
  `last_sync_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABEL MASTER SESI KEGIATAN (SHALAT BERJAMAAH & MENGAJI)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `kegiatan_sesi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `kode_sesi` VARCHAR(30) NOT NULL UNIQUE,
  `nama_sesi` VARCHAR(100) NOT NULL, -- Contoh: 'Shalat Shubuh Berjamaah', 'Mengaji Ba\'da Ashar'
  `kategori` ENUM('Shalat Berjamaah', 'Pengajian / Taklim', 'Halaqah Qur\'an', 'Kegiatan Asrama') NOT NULL DEFAULT 'Shalat Berjamaah',
  `jam_mulai_presensi` TIME NOT NULL, -- Jam buka scan fingerprint
  `jam_target` TIME NOT NULL,         -- Jam pelaksanaan shalat / mengaji
  `jam_toleransi_telat` TIME NOT NULL,-- Batas akhir sebelum dianggap terlambat
  `jam_tutup_presensi` TIME NOT NULL, -- Batas akhir scan ditutup
  `hari_aktif` VARCHAR(50) DEFAULT 'Semua', -- 'Semua' / 'Senin-Jumat'
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABEL ABSENSI BERJAMAAH & MENGAJI (REKAP DATA SCAN FINGERPRINT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `absensi_jamaah_mengaji` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tanggal` DATE NOT NULL,
  `sesi_id` INT NOT NULL,
  `santri_id` INT NOT NULL,
  `waktu_scan` TIME DEFAULT NULL,
  `status` ENUM('Hadir Tepat Waktu', 'Terlambat', 'Izin', 'Sakit', 'Ghoib/Masbuq', 'Alpha') NOT NULL DEFAULT 'Alpha',
  `device_id` INT DEFAULT NULL,
  `metode_presensi` ENUM('Fingerprint', 'RFID_Card', 'Manual_Musyrif') NOT NULL DEFAULT 'Fingerprint',
  `musyrif_verifikator` VARCHAR(150) DEFAULT NULL,
  `keterangan` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_absensi_sesi_santri` (`tanggal`, `sesi_id`, `santri_id`),
  INDEX `idx_abs_tgl_sesi` (`tanggal`, `sesi_id`),
  INDEX `idx_abs_santri` (`santri_id`),
  INDEX `idx_abs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. TABEL RAW LOG SCAN FINGERPRINT (LOG MENTAH DARI MESIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fingerprint_raw_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `device_id` INT NOT NULL,
  `fingerprint_pin` INT NOT NULL, -- ID User di Mesin
  `scan_timestamp` DATETIME NOT NULL,
  `verify_mode` INT DEFAULT 1,    -- 1: Finger, 2: PIN, 3: Card
  `is_processed` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_raw_device_pin` (`device_id`, `fingerprint_pin`),
  INDEX `idx_raw_timestamp` (`scan_timestamp`),
  INDEX `idx_raw_processed` (`is_processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- 1. SEED PROFIL PESANTREN
INSERT INTO `pesantren_profil` (`id`, `kode_pesantren`, `nama_pesantren`, `nsp`, `pengasuh_kiai`, `alamat`, `kota`, `no_hp`, `email`)
VALUES (1, 'PSN001', 'Pondok Pesantren Nurul Wafa', '510032780001', 'KH. M. Syukron Ma\'mun, Lc., M.A.', 'Jl. Pesantren No. 99, Sukarame', 'Tasikmalaya', '081288881111', 'info@epesantren.sch.id')
ON DUPLICATE KEY UPDATE `nama_pesantren` = VALUES(`nama_pesantren`);

-- 2. SEED USERS
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `status`) VALUES
(1, 'Super Administrator', 'admin', 'admin@epesantren.sch.id', '123456', 'Super Admin', 'Active'),
(2, 'KH. M. Syukron Ma\'mun (Pengasuh)', 'pengasuh', 'pengasuh@epesantren.sch.id', '123456', 'Pengasuh', 'Active'),
(3, 'Ust. Hamdan Al-Hafidz', 'ust.hamdan', 'hamdan@epesantren.sch.id', '123456', 'Ustadz', 'Active'),
(4, 'Pos Keamanan & Satpam Gerbang', 'satpam', 'keamanan@epesantren.sch.id', '123456', 'Keamanan', 'Active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. SEED ASATIDZ / MUSYRIF
INSERT INTO `asatidz` (`id`, `nik_niy`, `nama_asatidz`, `gelar`, `jk`, `no_hp`, `tugas_utama`, `status`) VALUES
(1, 'AS-2026-001', 'Ust. Hamdan S.Th.I', 'S.Th.I, Al-Hafidz', 'L', '081299990001', 'Musyrif Tahfidz Ikhwan', 'Aktif'),
(2, 'AS-2026-002', 'Ust. Nurul Huda Al-Hafidz', 'Al-Hafidz', 'L', '081299990002', 'Musyrif Pengasuhan Putra', 'Aktif'),
(3, 'AS-2026-003', 'Usth. Salma M.Pd', 'M.Pd, Al-Hafidzah', 'P', '081299990003', 'Musyrifah Asrama Putri', 'Aktif')
ON DUPLICATE KEY UPDATE `nama_asatidz` = VALUES(`nama_asatidz`);

-- 4. SEED ASRAMA & KAMAR KOBONG
INSERT INTO `asrama` (`id`, `kode_asrama`, `nama_asrama`, `gender`, `pembina_asatidz_id`, `lokasi_gedung`) VALUES
(1, 'ASR-IKH-01', 'Asrama Ali bin Abi Thalib', 'L', 1, 'Gedung Asrama Putra Blok A'),
(2, 'ASR-IKH-02', 'Asrama Umar bin Khattab', 'L', 2, 'Gedung Asrama Putra Blok B'),
(3, 'ASR-AKH-01', 'Asrama Fathimah Az-Zahra', 'P', 3, 'Gedung Asrama Putri Blok A'),
(4, 'ASR-AKH-02', 'Asrama Khadijah Al-Kubra', 'P', 3, 'Gedung Asrama Putri Blok B')
ON DUPLICATE KEY UPDATE `nama_asrama` = VALUES(`nama_asrama`);

INSERT INTO `kamar_kobong` (`id`, `asrama_id`, `kode_kamar`, `nama_kamar`, `kapasitas`, `ketua_kamar`) VALUES
(1, 1, 'K-ALI-04', 'Kamar 04', 12, 'Ahmad Faiz Al-Hafidz'),
(2, 2, 'K-UMR-02', 'Kamar 02', 12, 'Zaidan Muhammad'),
(3, 3, 'K-FAT-01', 'Kamar 01', 10, 'Fatimah Az-Zahra'),
(4, 4, 'K-KHD-03', 'Kamar 03', 10, 'Aisyah Humaira')
ON DUPLICATE KEY UPDATE `nama_kamar` = VALUES(`nama_kamar`);

-- 5. SEED DATA SANTRI (DILENGKAPI PIN FINGERPRINT)
INSERT INTO `santri` (`id`, `kode_santri`, `nis`, `nisn`, `fingerprint_pin`, `nama_santri`, `jk`, `status_santri`, `asrama_id`, `kamar_id`, `capaian_hafalan_juz`, `nama_wali`, `no_wa_wali`, `hubungan_wali`, `status`) VALUES
(1, 'STR-26-001', '2601001', '0089123456', 1001, 'Ahmad Faiz Al-Hafidz', 'L', 'Mukim', 1, 1, 15, 'H. Abdullah', '081288881111', 'Orang Tua (Ayah)', 'Aktif'),
(2, 'STR-26-002', '2601002', '0089123457', 1002, 'Zaidan Muhammad', 'L', 'Mukim', 2, 2, 28, 'Drs. Subagja', '081377772222', 'Orang Tua (Ayah)', 'Aktif'),
(3, 'STR-26-003', '2602001', '0089123458', 2001, 'Fatimah Az-Zahra', 'P', 'Mukim', 3, 3, 30, 'H. Usman', '081199993333', 'Orang Tua (Ayah)', 'Aktif'),
(4, 'STR-26-004', '2601003', '0089123459', 1003, 'Muhammad Rifqi', 'L', 'Mukim', 1, 1, 5, 'Bpk. Hendra', '085744445555', 'Orang Tua (Ayah)', 'Aktif'),
(5, 'STR-26-005', '2602002', '0089123460', 2002, 'Aisyah Humaira', 'P', 'Kalong', 4, 4, 3, 'Hj. Rohmah', '081233336666', 'Orang Tua (Ibu)', 'Aktif')
ON DUPLICATE KEY UPDATE `nama_santri` = VALUES(`nama_santri`);

-- 6. SEED HALAQAH TAHFIDZ
INSERT INTO `tahfidz_halaqah` (`id`, `nama_halaqah`, `asatidz_id`, `target_program`, `waktu_halaqah`, `gender`) VALUES
(1, 'Halaqah Imam Nafi\' (Putra)', 1, 'Saba\' / Sabqi (Juz 15-20)', 'Ba\'da Shubuh & Maghrib', 'L'),
(2, 'Halaqah Imam Ashim (Putra)', 2, 'Muroja\'ah Mutqin (Juz 25-30)', 'Ba\'da Shubuh & Ashar', 'L'),
(3, 'Halaqah Fathimah (Putri)', 3, 'Ziyadah Juz 1-5 & Mutaba\'ah', 'Ba\'da Shubuh & Isya', 'P')
ON DUPLICATE KEY UPDATE `nama_halaqah` = VALUES(`nama_halaqah`);

-- 7. SEED MESIN FINGERPRINT
INSERT INTO `fingerprint_device` (`id`, `nama_device`, `sn_device`, `ip_address`, `port`, `lokasi`, `peruntukan`, `status_koneksi`) VALUES
(1, 'Mesin Fingerprint Masjid Utama (Putra)', 'FP-MSJ-PUTRA-01', '192.168.1.201', 4370, 'Pintu Masuk Masjid Utama', 'Ikhwan', 'Online'),
(2, 'Mesin Fingerprint Musholla Putri', 'FP-MSH-PUTRI-02', '192.168.1.202', 4370, 'Pintu Masuk Musholla Khadijah', 'Akhwat', 'Online'),
(3, 'Mesin Fingerprint Aula Mengaji', 'FP-AULA-TAKLIM-03', '192.168.1.203', 4370, 'Aula Pengajian Syaikh Nawawi', 'Semua', 'Online')
ON DUPLICATE KEY UPDATE `nama_device` = VALUES(`nama_device`);

-- 8. SEED SESI KEGIATAN SHALAT & MENGAJI
INSERT INTO `kegiatan_sesi` (`id`, `kode_sesi`, `nama_sesi`, `kategori`, `jam_mulai_presensi`, `jam_target`, `jam_toleransi_telat`, `jam_tutup_presensi`) VALUES
(1, 'SHALAT-SHUBUH', 'Shalat Shubuh Berjamaah', 'Shalat Berjamaah', '04:15:00', '04:40:00', '04:45:00', '05:15:00'),
(2, 'NGAJI-PAGI', 'Mengaji Qur\'an / Halaqah Pagi', 'Halaqah Qur\'an', '05:15:00', '05:30:00', '05:40:00', '06:30:00'),
(3, 'SHALAT-DZUHUR', 'Shalat Dzuhur Berjamaah', 'Shalat Berjamaah', '11:45:00', '12:05:00', '12:15:00', '12:45:00'),
(4, 'SHALAT-ASHAR', 'Shalat Ashar Berjamaah', 'Shalat Berjamaah', '15:00:00', '15:20:00', '15:30:00', '16:00:00'),
(5, 'NGAJI-SORE', 'Kajian Kitab / Mengaji Sore', 'Pengajian / Taklim', '16:00:00', '16:15:00', '16:25:00', '17:30:00'),
(6, 'SHALAT-MAGHRIB', 'Shalat Maghrib Berjamaah', 'Shalat Berjamaah', '17:45:00', '18:00:00', '18:10:00', '18:35:00'),
(7, 'NGAJI-MALAM', 'Mudzakarah / Mengaji Malam', 'Pengajian / Taklim', '18:35:00', '18:45:00', '18:55:00', '19:15:00'),
(8, 'SHALAT-ISYA', 'Shalat Isya Berjamaah', 'Shalat Berjamaah', '19:15:00', '19:30:00', '19:40:00', '20:15:00')
ON DUPLICATE KEY UPDATE `nama_sesi` = VALUES(`nama_sesi`);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- END OF SCRIPT
-- ==============================================================================
