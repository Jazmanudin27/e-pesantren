-- ==============================================================================
-- RESET & SEED DATA SANTRI (645 DATA), KELAS NGAJI, SEKOLAH & KELAS SEKOLAH
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. BERSIHKAN DATA SEBELUMNYA
TRUNCATE TABLE santri;
TRUNCATE TABLE kelas;
DELETE FROM fingerprint_device_users;
DELETE FROM adms_command_queue;
DELETE FROM santri_fingerprint_templates;

SET FOREIGN_KEY_CHECKS = 1;

-- 2. MASTER SEKOLAH
INSERT INTO sekolah (id, kode_sekolah, nama_sekolah, jenjang, nominal_spp, nominal_adm_sekolah, nominal_adm_pesantren, total_masuk, keterangan)
VALUES 
  (1, 'SMP-NWF', 'SMP Nurul Wafa', 'SMP', 505000.00, 890000.00, 1000000.00, 2395000.00, 'SMP Islam Terpadu Nurul Wafa'),
  (2, 'SMA-NWF', 'SMA Nurul Wafa', 'SMA', 565000.00, 1040000.00, 1000000.00, 2605000.00, 'SMA Nurul Wafa'),
  (3, 'SMK-NWF', 'SMK Nurul Wafa', 'SMK', 565000.00, 1400000.00, 1000000.00, 2965000.00, 'SMK Nurul Wafa'),
  (4, 'PT-NWF', 'Perguruan Tinggi / Mahasiswa', 'SMP', 0.00, 0.00, 1000000.00, 1000000.00, 'Santri Kuliah / Takhoshus')
ON DUPLICATE KEY UPDATE 
  nama_sekolah = VALUES(nama_sekolah),
  jenjang = VALUES(jenjang);

-- 3. MASTER KELAS NGAJI
INSERT INTO kelas (nama_kelas, tingkat, gender) VALUES
  ('1A Boys', '1', 'L'),
  ('1A Girls', '1', 'P'),
  ('1B Boys', '1', 'L'),
  ('1B Girls', '1', 'P'),
  ('1C Boys', '1', 'L'),
  ('1C Girls', '1', 'P'),
  ('1D Boys', '1', 'L'),
  ('1D Girls', '1', 'P'),
  ('1E Boys', '1', 'L'),
  ('1E Girls', '1', 'P'),
  ('1F Boys', '1', 'L'),
  ('2A Boys', '2', 'L'),
  ('2A Girls', '2', 'P'),
  ('2B Boys', '2', 'L'),
  ('2B Girls', '2', 'P'),
  ('2C Boys', '2', 'L'),
  ('2C Girls', '2', 'P'),
  ('2D Boys', '2', 'L'),
  ('2D Girls', '2', 'P'),
  ('2E Girls', '2', 'P'),
  ('3A Boys', '3', 'L'),
  ('3A Girls', '3', 'P'),
  ('3B Boys', '3', 'L'),
  ('3B Girls', '3', 'P'),
  ('4 Boys', '4', 'L'),
  ('4 Girls', '4', 'P'),
  ('5 Boys', '5', 'L'),
  ('5 Girls', '5', 'P'),
  ('6 Boys', '6', 'L'),
  ('6 Girls', '6', 'P'),
  ('Takhoshus 1 Boys', 'Takhoshus', 'L'),
  ('Takhoshus 2 Boys', 'Takhoshus', 'L'),
  ('Takhoshus 3 Boys', 'Takhoshus', 'L'),
  ('Takhosus 1 Girls', 'Takhoshus', 'P');

-- 4. INSERT 645 DATA SANTRI
INSERT INTO santri (
  id, kode_santri, nis, nisn, username, password, nama_santri, jk, status_santri, 
  status, nama_kelas, kelas, nama_sekolah, tingkat_sekolah, sekolah_id, fingerprint_pin, tahun_masuk
) VALUES
  (1, 'NWF-0001', '260001', '0010012347', '260001', '123456', 'Ahmad Rofi rebriana', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260001', '2026/2027'),
  (2, 'NWF-0002', '260002', '0010024694', '260002', '123456', 'Arthur Bumiputra A.S', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260002', '2026/2027'),
  (3, 'NWF-0003', '260003', '0010037041', '260003', '123456', 'Dava Ardiansyah', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260003', '2026/2027'),
  (4, 'NWF-0004', '260004', '0010049388', '260004', '123456', 'Dimas Rangga', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260004', '2026/2027'),
  (5, 'NWF-0005', '260005', '0010061735', '260005', '123456', 'Febri Muhamad Azka', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260005', '2026/2027'),
  (6, 'NWF-0006', '260006', '0010074082', '260006', '123456', 'Hibban Saefudzaky', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260006', '2026/2027'),
  (7, 'NWF-0007', '260007', '0010086429', '260007', '123456', 'M Nizar Datul-kahfi', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260007', '2026/2027'),
  (8, 'NWF-0008', '260008', '0010098776', '260008', '123456', 'M. Abdulloh syafi''i', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260008', '2026/2027'),
  (9, 'NWF-0009', '260009', '0010111123', '260009', '123456', 'M. Arrafi''ul A''la Fauzan', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260009', '2026/2027'),
  (10, 'NWF-0010', '260010', '0010123470', '260010', '123456', 'M. Azka Almuzakki', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '2600010', '2026/2027'),
  (11, 'NWF-0011', '260011', '0010135817', '260011', '123456', 'M. bidzi abdilah putra p', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260011', '2026/2027'),
  (12, 'NWF-0012', '260012', '0010148164', '260012', '123456', 'M. Gabriel Abdu D G', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260012', '2026/2027'),
  (13, 'NWF-0013', '260013', '0010160511', '260013', '123456', 'Muhamad Danial Hamdi', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260013', '2026/2027'),
  (14, 'NWF-0014', '260014', '0010172858', '260014', '123456', 'Muhammad fajar sidik', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260014', '2026/2027'),
  (15, 'NWF-0015', '260015', '0010185205', '260015', '123456', 'Nadzirul asyrofi', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260015', '2026/2027'),
  (16, 'NWF-0016', '260016', '0010197552', '260016', '123456', 'Naufal M Naser', 'L', 'Mukim', 'Aktif', '1A Boys', '1A Boys', 'SMP Nurul Wafa', 'VII', 1, '260016', '2026/2027'),
  (17, 'NWF-0017', '260017', '0010209899', '260017', '123456', 'Afsah  Khaerunisa', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VI', 1, '260017', '2026/2027'),
  (18, 'NWF-0018', '260018', '0010222246', '260018', '123456', 'Afsah khaerunisa', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260018', '2026/2027'),
  (19, 'NWF-0019', '260019', '0010234593', '260019', '123456', 'Aisah marwah', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260019', '2026/2027'),
  (20, 'NWF-0020', '260020', '0010246940', '260020', '123456', 'Ayla Nurita', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260020', '2026/2027'),
  (21, 'NWF-0021', '260021', '0010259287', '260021', '123456', 'Azkiya sri humaira', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260021', '2026/2027'),
  (22, 'NWF-0022', '260022', '0010271634', '260022', '123456', 'Bilqis Noviana Ajmatun', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260022', '2026/2027'),
  (23, 'NWF-0023', '260023', '0010283981', '260023', '123456', 'De Syifa El Zakira', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260023', '2026/2027'),
  (24, 'NWF-0024', '260024', '0010296328', '260024', '123456', 'Dhevira juliasila', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260024', '2026/2027'),
  (25, 'NWF-0025', '260025', '0010308675', '260025', '123456', 'Dira nurazmi', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260025', '2026/2027'),
  (26, 'NWF-0026', '260026', '0010321022', '260026', '123456', 'Dzahra Yulia Ulfah', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260026', '2026/2027'),
  (27, 'NWF-0027', '260027', '0010333369', '260027', '123456', 'Elsa karisa', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260027', '2026/2027'),
  (28, 'NWF-0028', '260028', '0010345716', '260028', '123456', 'Isma nuratikah', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260028', '2026/2027'),
  (29, 'NWF-0029', '260029', '0010358063', '260029', '123456', 'Kayla Nazila Rahma', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260029', '2026/2027'),
  (30, 'NWF-0030', '260030', '0010370410', '260030', '123456', 'Liyana zahirah', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260030', '2026/2027'),
  (31, 'NWF-0031', '260031', '0010382757', '260031', '123456', 'Lulu maknuni', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260031', '2026/2027'),
  (32, 'NWF-0032', '260032', '0010395104', '260032', '123456', 'Maura desviani', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260032', '2026/2027'),
  (33, 'NWF-0033', '260033', '0010407451', '260033', '123456', 'Nadia salma', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260033', '2026/2027'),
  (34, 'NWF-0034', '260034', '0010419798', '260034', '123456', 'Neng Ashri Alicia T', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260034', '2026/2027'),
  (35, 'NWF-0035', '260035', '0010432145', '260035', '123456', 'Riska Dhea Navalia', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260035', '2026/2027'),
  (36, 'NWF-0036', '260036', '0010444492', '260036', '123456', 'Syahla noer syaida', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260036', '2026/2027'),
  (37, 'NWF-0037', '260037', '0010456839', '260037', '123456', 'Widya Salsa Bila', 'P', 'Mukim', 'Aktif', '1A Girls', '1A Girls', 'SMP Nurul Wafa', 'VII', 1, '260037', '2026/2027'),
  (38, 'NWF-0038', '260038', '0010469186', '260038', '123456', 'Abdul Ghani Ma''rup', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VIII', 1, '260038', '2026/2027'),
  (39, 'NWF-0039', '260039', '0010481533', '260039', '123456', 'Alfin Prasetya', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260039', '2026/2027'),
  (40, 'NWF-0040', '260040', '0010493880', '260040', '123456', 'Arya Sidik Nugraha', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260040', '2026/2027'),
  (41, 'NWF-0041', '260041', '0010506227', '260041', '123456', 'Dimas Pratama', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260041', '2026/2027'),
  (42, 'NWF-0042', '260042', '0010518574', '260042', '123456', 'Dzikya Fawwaz Haikal', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260042', '2026/2027'),
  (43, 'NWF-0043', '260043', '0010530921', '260043', '123456', 'Fathir Alriza Sidiq', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260043', '2026/2027'),
  (44, 'NWF-0044', '260044', '0010543268', '260044', '123456', 'M. Arfa Febriansyah', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260044', '2026/2027'),
  (45, 'NWF-0045', '260045', '0010555615', '260045', '123456', 'M. Ghibran Mahardika', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260045', '2026/2027'),
  (46, 'NWF-0046', '260046', '0010567962', '260046', '123456', 'M. Ihsan Maulidan', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260046', '2026/2027'),
  (47, 'NWF-0047', '260047', '0010580309', '260047', '123456', 'M. Malik Bahij M', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260047', '2026/2027'),
  (48, 'NWF-0048', '260048', '0010592656', '260048', '123456', 'M. syakirul fawwaz', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260048', '2026/2027'),
  (49, 'NWF-0049', '260049', '0010605003', '260049', '123456', 'Mujib Rahman A', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260049', '2026/2027'),
  (50, 'NWF-0050', '260050', '0010617350', '260050', '123456', 'Naufal Faeyza A', 'L', 'Mukim', 'Aktif', '1B Boys', '1B Boys', 'SMP Nurul Wafa', 'VII', 1, '260050', '2026/2027')
ON DUPLICATE KEY UPDATE nama_santri = VALUES(nama_santri);

-- 5. RELASI KELAS_ID SANTRI
UPDATE santri s
JOIN kelas k ON s.nama_kelas = k.nama_kelas
SET s.kelas_id = k.id;
