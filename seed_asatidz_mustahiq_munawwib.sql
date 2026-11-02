-- ==============================================================================
-- MIGRATION: SEED DATA ASATIDZ (MUSTAHIQ & MUNAWWIB)
-- ==============================================================================

-- 1. Tambah kolom kategori_asatidz jika belum ada
ALTER TABLE `asatidz` 
ADD COLUMN IF NOT EXISTS `kategori_asatidz` VARCHAR(50) DEFAULT 'Mustahiq' AFTER `tugas_utama`;

-- 2. Data Mustahiq (27 Orang)
INSERT INTO `asatidz` (`nama_asatidz`, `gelar`, `jk`, `tugas_utama`, `kategori_asatidz`, `status`) VALUES
('Iis F.S', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Imas Masripah', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Laelatul Fauziah', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Fatia', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Nurul', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Siti Luthfiah', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Indri Lesatari', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Mr. Ardiana Firdaus', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Najiyah F.N', 'Ustadzah', 'P', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Syahrul H', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Hapid Usman', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Asep Nasrulloh', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('M Hayatul Fauzi', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Muqoddas M.S.I', 'M.S.I', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('M Raya Nizar', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Rapin FN', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Hilmi Nursyamsi', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Rahwan', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Tanzilurrohman', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Isyam M Noor', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Kanza S.M', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Amin Ma`ruf', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Wahyu Ramdhani', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Sandi Nursya`ban', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('M Hikam M.H', 'M.H', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('M Busrol Karim', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif'),
('Lili Abdul Jalil', 'Ustadz', 'L', 'Mustahiq', 'Mustahiq', 'Aktif');

-- 3. Data Munawwib (32 Orang)
INSERT INTO `asatidz` (`nama_asatidz`, `gelar`, `jk`, `tugas_utama`, `kategori_asatidz`, `status`) VALUES
('Fadilah', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Neng Gina', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Neng Nafis', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Lia Farida', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Reva', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Rika', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Yeyen', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Imel', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Siti Maryam', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Syifa Q', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Nafisa', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Fatimah', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Wardah', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Regina', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Dinar', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Putri Marwah', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Delia', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Nurul Ba Hasna', 'Ustadzah', 'P', 'Munawwib', 'Munawwib', 'Aktif'),
('Abdillah Azhar', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Ilham Yasin', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Ifham', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Helmi Ali Akbar', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Ragyad', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Marzan', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Habiburrahman', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Akesa', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('M. Nizar', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Fabregas', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Abdul Kodir', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Dede Maulana', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('M Fadly Ibrahim', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif'),
('Ridwannurulloh', 'Ustadz', 'L', 'Munawwib', 'Munawwib', 'Aktif');

