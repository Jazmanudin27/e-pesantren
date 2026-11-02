-- ==============================================================================
-- SCRIPT INSERT DATA ASRAMA & KELAS (E-PESANTREN)
-- ==============================================================================

-- 1. PASTIKAN TABEL KELAS TERSEDIA JIKA BELUM ADA
CREATE TABLE IF NOT EXISTS `kelas` (
  `id` INT NOT NULL PRIMARY KEY,
  `kode_kelas` VARCHAR(50) NOT NULL,
  `nama_kelas` VARCHAR(100) NOT NULL,
  `tingkat` VARCHAR(20) DEFAULT NULL,
  `gender` ENUM('L', 'P') NOT NULL DEFAULT 'L',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_kelas_gender` (`gender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INSERT / UPDATE DATA ASRAMA (17 ASRAMA)
INSERT INTO `asrama` (`id`, `kode_asrama`, `nama_asrama`, `gender`, `lokasi_gedung`) VALUES
(1, '1', 'GRITANIA I', 'L', 'Komplek Asrama Putra'),
(2, '2', 'GRITANIA II', 'L', 'Komplek Asrama Putra'),
(3, '3', 'GRITANIA III', 'L', 'Komplek Asrama Putra'),
(4, '4', 'GRITANIA IV', 'L', 'Komplek Asrama Putra'),
(5, '5', 'GRITANIA V', 'L', 'Komplek Asrama Putra'),
(6, '6', 'GRITANIA VI', 'L', 'Komplek Asrama Putra'),
(7, '7', 'SANTINIKETAN I', 'L', 'Komplek Asrama Putra'),
(8, '8', 'SANTINIKETAN II', 'L', 'Komplek Asrama Putra'),
(9, '9', 'RAYON I GIRL', 'P', 'Komplek Asrama Putri'),
(10, '10', 'RAYON II GIRL', 'P', 'Komplek Asrama Putri'),
(11, '11', 'RAYON III GIRL', 'P', 'Komplek Asrama Putri'),
(12, '12', 'RAYON IV GIRL', 'P', 'Komplek Asrama Putri'),
(13, '13', 'RAYON V GIRL', 'P', 'Komplek Asrama Putri'),
(14, '14', 'RAYON VI GIRL', 'P', 'Komplek Asrama Putri'),
(15, '15', 'RAYON VII GIRL', 'P', 'Komplek Asrama Putri'),
(16, '16', 'RAYON VIII GIRL', 'P', 'Komplek Asrama Putri'),
(17, '17', 'RAYON OPPN', 'L', 'Gedung Pengurus Santri')
ON DUPLICATE KEY UPDATE 
  `nama_asrama` = VALUES(`nama_asrama`),
  `gender` = VALUES(`gender`);

-- 3. INSERT / UPDATE DATA KELAS (45 KELAS)
INSERT INTO `kelas` (`id`, `kode_kelas`, `nama_kelas`, `tingkat`, `gender`) VALUES
(1, '1', '3 A BOY', 'Kelas 3', 'L'),
(2, '2', '3 C BOY', 'Kelas 3', 'L'),
(3, '3', '3 B BOY', 'Kelas 3', 'L'),
(4, '4', '3 F BOY', 'Kelas 3', 'L'),
(5, '5', '1 D BOY', 'Kelas 1', 'L'),
(6, '6', '3 D BOY', 'Kelas 3', 'L'),
(7, '7', '3 H GIRL', 'Kelas 3', 'P'),
(8, '8', '4 A BOY', 'Kelas 4', 'L'),
(9, '9', '4 B BOY', 'Kelas 4', 'L'),
(10, '10', '4 C BOY', 'Kelas 4', 'L'),
(11, '11', '4 C GIRL', 'Kelas 4', 'P'),
(12, '12', '1 A BOY', 'Kelas 1', 'L'),
(13, '13', '1 C BOY', 'Kelas 1', 'L'),
(14, '14', '1 E BOY', 'Kelas 1', 'L'),
(15, '15', '1 B BOY', 'Kelas 1', 'L'),
(16, '16', '3 F GIRL', 'Kelas 3', 'P'),
(17, '17', '3 B BOY', 'Kelas 3', 'L'),
(18, '18', '3 B GIRL', 'Kelas 3', 'P'),
(19, '19', '3 G GIRL', 'Kelas 3', 'P'),
(20, '20', '3 E GIRL', 'Kelas 3', 'P'),
(21, '21', '3 D GIRL', 'Kelas 3', 'P'),
(22, '22', '1 D GIRL', 'Kelas 1', 'P'),
(23, '23', '3 C BOY', 'Kelas 3', 'L'),
(24, '24', '1 F BOY', 'Kelas 1', 'L'),
(25, '25', '1 G BOY', 'Kelas 1', 'L'),
(26, '26', '2 A BOY', 'Kelas 2', 'L'),
(27, '27', '3 E BOY', 'Kelas 3', 'L'),
(28, '28', '3 A BOY', 'Kelas 3', 'L'),
(29, '29', '2 C BOY', 'Kelas 2', 'L'),
(30, '30', '2 B BOY', 'Kelas 2', 'L'),
(31, '31', '3 I GIRL', 'Kelas 3', 'P'),
(32, '32', '4 A GIRL', 'Kelas 4', 'P'),
(33, '33', '4 B GIRL', 'Kelas 4', 'P'),
(34, '34', '4 D GIRL', 'Kelas 4', 'P'),
(35, '35', '1 A GIRL', 'Kelas 1', 'P'),
(36, '36', '2 C GIRL', 'Kelas 2', 'P'),
(37, '37', '3 A GIRL', 'Kelas 3', 'P'),
(38, '38', '1 C GIRL', 'Kelas 1', 'P'),
(39, '39', '1 H GIRL', 'Kelas 1', 'P'),
(40, '40', '2 A GIRL', 'Kelas 2', 'P'),
(41, '41', '1 E GIRL', 'Kelas 1', 'P'),
(42, '42', '1 G GIRL', 'Kelas 1', 'P'),
(43, '43', '1 F GIRL', 'Kelas 1', 'P'),
(44, '44', '2 B GIRL', 'Kelas 2', 'P'),
(45, '45', '1 B GIRL', 'Kelas 1', 'P')
ON DUPLICATE KEY UPDATE 
  `nama_kelas` = VALUES(`nama_kelas`),
  `tingkat` = VALUES(`tingkat`),
  `gender` = VALUES(`gender`);
