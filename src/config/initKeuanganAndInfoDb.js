import pool from './database.js';

/**
 * Otomatis membuat tabel-tabel Keuangan, Pembayaran Digital, Laporan Perkembangan Santri,
 * dan Informasi/Kegiatan Pesantren jika belum ada di database, beserta seed data awal.
 */
export async function initKeuanganAndInfoDb() {
  try {
    // Pastikan kolom metode_presensi dan status di absensi_jamaah_mengaji fleksibel untuk Wajah & Kegiatan
    try {
      await pool.query(`
        ALTER TABLE \`absensi_jamaah_mengaji\` 
        MODIFY COLUMN \`metode_presensi\` VARCHAR(100) NOT NULL DEFAULT 'Manual_Musyrif',
        MODIFY COLUMN \`status\` VARCHAR(100) NOT NULL DEFAULT 'Hadir';
      `);
    } catch (eAbs) {}

    // Pastikan kolom-kolom opsional di tabel santri sudah tersedia
    try {
      await pool.query("ALTER TABLE `santri` ADD COLUMN `tempat_lahir` VARCHAR(100) NULL AFTER `jk`");
    } catch (eT) {}
    try {
      await pool.query("ALTER TABLE `santri` ADD COLUMN `tgl_lahir` DATE NULL AFTER `tempat_lahir`");
    } catch (eTgl) {}
    try {
      await pool.query("ALTER TABLE `santri` ADD COLUMN `capaian_hafalan_juz` INT DEFAULT 0 AFTER `kamar_id`");
    } catch (eHaf) {}
    try {
      await pool.query("ALTER TABLE `santri` ADD COLUMN `tingkat_diniyah` VARCHAR(50) DEFAULT 'Wustho' AFTER `capaian_hafalan_juz`");
    } catch (eDin) {}
    try {
      await pool.query("ALTER TABLE `santri` ADD COLUMN `foto` LONGTEXT NULL AFTER `nama_santri`");
    } catch (eFoto) {}

    // 1. TABEL MASTER KOMPONEN BIAYA
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_komponen_biaya\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nama_komponen\` VARCHAR(150) NOT NULL,
        \`kategori\` ENUM('Biaya Masuk', 'Bulanan', 'Lainnya') NOT NULL DEFAULT 'Biaya Masuk',
        \`jenjang\` VARCHAR(50) DEFAULT 'Semua',
        \`nominal_default\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`deskripsi\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. TABEL TAGIHAN SANTRI
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_tagihan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_tagihan\` VARCHAR(50) NOT NULL UNIQUE,
        \`santri_id\` INT NOT NULL,
        \`komponen_id\` INT NOT NULL,
        \`judul_tagihan\` VARCHAR(150) NOT NULL,
        \`kategori\` ENUM('Bulanan', 'Biaya Masuk', 'Lainnya') NOT NULL DEFAULT 'Bulanan',
        \`periode_bulan\` VARCHAR(50) NULL,
        \`tahun_ajaran\` VARCHAR(20) DEFAULT '2026/2027',
        \`total_tagihan\` DECIMAL(12,2) NOT NULL,
        \`sudah_dibayar\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`sisa_tagihan\` DECIMAL(12,2) NOT NULL,
        \`status\` ENUM('Belum Dibayar', 'Sebagian', 'Lunas', 'Batal') DEFAULT 'Belum Dibayar',
        \`jatuh_tempo\` DATE NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_tagihan_santri\` (\`santri_id\`),
        INDEX \`idx_tagihan_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. TABEL TRANSAKSI PEMBAYARAN DIGITAL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_transaksi_pembayaran\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nomor_transaksi\` VARCHAR(50) NOT NULL UNIQUE,
        \`santri_id\` INT NOT NULL,
        \`metode_pembayaran\` ENUM('QRIS', 'Virtual Account', 'Transfer Bank', 'Tunai/Kasir') NOT NULL DEFAULT 'QRIS',
        \`channel_pembayaran\` VARCHAR(100) DEFAULT 'QRIS Dinamis',
        \`va_number\` VARCHAR(50) NULL,
        \`qris_data\` TEXT NULL,
        \`total_bayar\` DECIMAL(12,2) NOT NULL,
        \`status_pembayaran\` ENUM('Pending', 'Berhasil', 'Kedaluwarsa', 'Gagal') DEFAULT 'Pending',
        \`tanggal_bayar\` DATETIME NULL,
        \`kuitansi_nomor\` VARCHAR(50) UNIQUE NULL,
        \`keterangan\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_transaksi_santri\` (\`santri_id\`),
        INDEX \`idx_transaksi_status\` (\`status_pembayaran\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. TABEL DETAIL TRANSAKSI KE TAGIHAN (ALLOCATION)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_transaksi_detail\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`transaksi_id\` INT NOT NULL,
        \`tagihan_id\` INT NOT NULL,
        \`nominal_alokasi\` DECIMAL(12,2) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_detail_transaksi\` (\`transaksi_id\`),
        INDEX \`idx_detail_tagihan\` (\`tagihan_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. TABEL LAPORAN PERKEMBANGAN SANTRI
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`santri_laporan_perkembangan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`periode\` VARCHAR(100) NOT NULL,
        \`tanggal_laporan\` DATE NOT NULL,
        \`nilai_akademik\` TEXT NULL,
        \`catatan_akademik\` TEXT NULL,
        \`catatan_hafalan\` TEXT NULL,
        \`catatan_perilaku\` TEXT NULL,
        \`catatan_ibadah\` TEXT NULL,
        \`catatan_ustadz\` TEXT NOT NULL,
        \`nama_penulis\` VARCHAR(150) DEFAULT 'Ust. Hamdan S.Th.I',
        \`status_publikasi\` ENUM('Draft', 'Diterbitkan') DEFAULT 'Diterbitkan',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_laporan_santri\` (\`santri_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. TABEL INFORMASI & KEGIATAN PESANTREN (FEED / TIMELINE)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`pesantren_informasi_kegiatan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`judul\` VARCHAR(255) NOT NULL,
        \`kategori\` VARCHAR(100) NOT NULL DEFAULT 'Kegiatan Santri',
        \`ringkasan\` TEXT NULL,
        \`konten\` LONGTEXT NOT NULL,
        \`foto_url\` VARCHAR(500) NULL,
        \`video_url\` VARCHAR(500) NULL,
        \`penulis\` VARCHAR(150) DEFAULT 'Humas Pondok Pesantren',
        \`tanggal_publikasi\` DATE NOT NULL,
        \`is_pinned\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_info_tgl\` (\`tanggal_publikasi\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // SEED MASTER KOMPONEN BIAYA
    const [existingKomponen] = await pool.query('SELECT COUNT(*) as cnt FROM keuangan_komponen_biaya');
    if (existingKomponen[0].cnt === 0) {
      await pool.query(`
        INSERT INTO \`keuangan_komponen_biaya\` (\`id\`, \`nama_komponen\`, \`kategori\`, \`jenjang\`, \`nominal_default\`, \`deskripsi\`) VALUES
        (1, 'Administrasi Bulanan (SPP / Syahriah)', 'Bulanan', 'Semua', 300000.00, 'Iuran bulanan operasional pendidikan & asrama santri'),
        (2, 'Infak Pembangunan & Sarana', 'Biaya Masuk', 'Semua', 1000000.00, 'Dana wakaf & infak pembangunan sarana prasarana pondok'),
        (3, 'Kaos Rayon & Seragam Pesantren', 'Biaya Masuk', 'Semua', 450000.00, 'Paket seragam harian santri, kaos rayon, dan atribut'),
        (4, 'Uang Makan & Dapur Asrama', 'Biaya Masuk', 'Semua', 350000.00, 'Alokasi awal perlengkapan makan & logistik santri'),
        (5, 'Biaya Listrik & Air Bersih', 'Biaya Masuk', 'Semua', 150000.00, 'Penyediaan fasilitas listrik kobong dan air bersih'),
        (6, 'Buku Panduan & Raport Pesantren', 'Biaya Masuk', 'Semua', 150000.00, 'Buku raport mutaba\\'ah, tahfidz, dan tata tertib santri')
      `);
      console.log('[E-PESANTREN DB] Seed keuangan_komponen_biaya berhasil.');
    }

    // SEED TAGIHAN SESUAI CONTOH PROMPT:
    // Administrasi bulanan: Rp 600.000 (2 bulan @ 300.000)
    // Sisa biaya awal masuk: Rp 850.000 (total 2.100.000, sudah dibayar 1.250.000)
    // Total belum dibayar: Rp 1.450.000
    const [existingTagihan] = await pool.query('SELECT COUNT(*) as cnt FROM keuangan_tagihan');
    if (existingTagihan[0].cnt === 0) {
      // Ambil ID santri pertama atau ID 1
      const [santriRows] = await pool.query('SELECT id FROM santri ORDER BY id ASC LIMIT 5');
      for (const s of santriRows) {
        const sId = s.id;
        await pool.query(`
          INSERT INTO \`keuangan_tagihan\` (\`kode_tagihan\`, \`santri_id\`, \`komponen_id\`, \`judul_tagihan\`, \`kategori\`, \`periode_bulan\`, \`tahun_ajaran\`, \`total_tagihan\`, \`sudah_dibayar\`, \`sisa_tagihan\`, \`status\`, \`jatuh_tempo\`) VALUES
          ('TGH-${sId}-SPP-09', ${sId}, 1, 'Administrasi Bulanan (September 2026)', 'Bulanan', 'September 2026', '2026/2027', 300000.00, 0.00, 300000.00, 'Belum Dibayar', '2026-09-10'),
          ('TGH-${sId}-SPP-10', ${sId}, 1, 'Administrasi Bulanan (Oktober 2026)', 'Bulanan', 'Oktober 2026', '2026/2027', 300000.00, 0.00, 300000.00, 'Belum Dibayar', '2026-10-10'),
          ('TGH-${sId}-MSK-INF', ${sId}, 2, 'Infak Pembangunan Pesantren', 'Biaya Masuk', NULL, '2026/2027', 1000000.00, 600000.00, 400000.00, 'Sebagian', '2026-12-31'),
          ('TGH-${sId}-MSK-SRG', ${sId}, 3, 'Kaos Rayon & Seragam Pesantren', 'Biaya Masuk', NULL, '2026/2027', 450000.00, 200000.00, 250000.00, 'Sebagian', '2026-12-31'),
          ('TGH-${sId}-MSK-MKN', ${sId}, 4, 'Uang Makan & Dapur Asrama', 'Biaya Masuk', NULL, '2026/2027', 350000.00, 350000.00, 0.00, 'Lunas', '2026-12-31'),
          ('TGH-${sId}-MSK-LST', ${sId}, 5, 'Biaya Listrik & Air Bersih', 'Biaya Masuk', NULL, '2026/2027', 150000.00, 50000.00, 100000.00, 'Sebagian', '2026-12-31'),
          ('TGH-${sId}-MSK-RPT', ${sId}, 6, 'Buku Raport & Buku Panduan', 'Biaya Masuk', NULL, '2026/2027', 150000.00, 50000.00, 100000.00, 'Sebagian', '2026-12-31')
        `);
      }
      console.log('[E-PESANTREN DB] Seed keuangan_tagihan berhasil dibuat.');
    }

    // SEED SAMPLE TRANSAKSI LALU & KUITANSI
    const [existingTrx] = await pool.query('SELECT COUNT(*) as cnt FROM keuangan_transaksi_pembayaran');
    if (existingTrx[0].cnt === 0) {
      await pool.query(`
        INSERT INTO \`keuangan_transaksi_pembayaran\` (\`id\`, \`nomor_transaksi\`, \`santri_id\`, \`metode_pembayaran\`, \`channel_pembayaran\`, \`total_bayar\`, \`status_pembayaran\`, \`tanggal_bayar\`, \`kuitansi_nomor\`, \`keterangan\`) VALUES
        (1, 'TRX-20260815-001', 1, 'Virtual Account', 'BCA Virtual Account (807770001001)', 1250000.00, 'Berhasil', '2026-08-15 10:30:00', 'KWT-NW-202608-001', 'Pembayaran Tahap 1 Biaya Masuk Awal Santri Baru')
      `);
      console.log('[E-PESANTREN DB] Seed sample transaksi berhasil.');
    }

    // SEED LAPORAN PERKEMBANGAN SANTRI
    const [existingLaporan] = await pool.query('SELECT COUNT(*) as cnt FROM santri_laporan_perkembangan');
    if (existingLaporan[0].cnt === 0) {
      await pool.query(`
        INSERT INTO \`santri_laporan_perkembangan\` (\`santri_id\`, \`periode\`, \`tanggal_laporan\`, \`nilai_akademik\`, \`catatan_akademik\`, \`catatan_hafalan\`, \`catatan_perilaku\`, \`catatan_ibadah\`, \`catatan_ustadz\`, \`nama_penulis\`, \`status_publikasi\`) VALUES
        (1, 'Bulan Oktober 2026', '2026-10-28', 
        '{"Nahwu": 88, "Sharaf": 85, "Fiqih": 92, "Tauhid": 90, "Bahasa Arab": 86, "Tajwid": 95}',
        'Santri sangat aktif dalam muthola\\'ah kitab Jurumiyyah dan Fiqih Fathul Qorib.',
        'Hafalan bertambah 1 Juz mutqin (Juz 15), kelancaran tajwid dan makhorijul huruf Mumtaz.',
        'Berakhlak sopan, disiplin dalam jadwal piket kobong asrama, tidak memiliki poin pelanggaran.',
        'Selalu mengikuti shalat fardhu berjamaah di masjid tepat waktu dan aktif qiyamul lail.',
        'Alhamdulillah ananda menunjukkan peningkatan luar biasa dalam muroja\\'ah dan adab harian. Pertahankan semangat belajar.',
        'Ust. Hamdan S.Th.I (Musyrif Asrama)', 'Diterbitkan')
      `);
      console.log('[E-PESANTREN DB] Seed santri_laporan_perkembangan berhasil.');
    }

    // SEED INFORMASI & KEGIATAN PESANTREN (FEED)
    const [existingInfo] = await pool.query('SELECT COUNT(*) as cnt FROM pesantren_informasi_kegiatan');
    if (existingInfo[0].cnt === 0) {
      await pool.query(`
        INSERT INTO \`pesantren_informasi_kegiatan\` (\`judul\`, \`kategori\`, \`ringkasan\`, \`konten\`, \`foto_url\`, \`penulis\`, \`tanggal_publikasi\`, \`is_pinned\`) VALUES
        ('Khotmil Qur\\'an & Tasmi\\' Bil-Ghoib 30 Juz Santri Berprestasi', 'Kegiatan Santri', 
        'Pelaksanaan wisuda tasmi sekali duduk juz 1-30 berjalan khidmat disaksikan segenap asatidz.',
        'Alhamdulillah telah berlangsung agenda akbar Khotmil Qur\\'an dan Ujian Tasmi\\' Bil-Ghoib 30 Juz sekali duduk. Kegiatan ini diikuti oleh para santri pilihan yang telah menyelesaikan mutqin hafalan. Kami mengundang doa restu dari para wali santri agar ilmunya berkah dan istiqomah dalam menjaga kalamullah.',
        'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=800&q=80',
        'Biro Kepengasuhan & Tahfidz', '2026-10-30', 1),

        ('Pengumuman Jadwal Kepulangan Santri Libur Akhir Semester Ganjil', 'Pengumuman Liburan',
        'Informasi resmi alur penjemputan santri dan batas waktu izin pulang ke rumah.',
        'Diberitahukan kepada seluruh Bapak/Ibu Wali Santri bahwa kepulangan santri libur semester ganjil akan dimulai pada hari Ahad, 20 Desember 2026. Penjemputan wajib melapor pada pos keamanan dan menunjukkan kartu identitas atau QR barcode perizinan santri.',
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
        'Sekretariat Pesantren', '2026-10-25', 0),

        ('Kajian Kitab Kuning Mingguan & Pelatihan Praktek Fiqih Jenazah', 'Pengajian & Ibadah',
        'Pembekalan keterampilan fardhu kifayah bagi santri tingkat wustho dan ulya.',
        'Seluruh santri mengikuti praktek pemulasaraan jenazah mulai dari memandikan, mengafani hingga mensholatkan sesuai tuntunan madzhab Syafi\\'i yang dibimbing langsung oleh dewan asatidz sepuh pesantren.',
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
        'Humas & Dakwah Pondok', '2026-10-20', 0)
      `);
      console.log('[E-PESANTREN DB] Seed pesantren_informasi_kegiatan berhasil.');
    }

    // 7. PENYESUAIAN ROLE USERS (MEMISAHKAN ADMIN KEUANGAN DARI ADMIN ABSEN)
    try {
      await pool.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT 'Super Admin'`);
    } catch (e) {}

    // Pastikan Akun Admin Keuangan (Bendahara) Tersedia
    const [keuanganUser] = await pool.query(`SELECT id FROM users WHERE username = 'bendahara' OR username = 'keuangan' LIMIT 1`);
    if (keuanganUser.length === 0) {
      await pool.query(`
        INSERT INTO users (name, username, email, password, role, status)
        VALUES ('Hj. Siti Fatimah (Bendahara)', 'bendahara', 'bendahara@epesantren.sch.id', '123456', 'Admin Keuangan', 'Active')
      `);
      console.log('[E-PESANTREN DB] Akun Bendahara (Admin Keuangan) berhasil ditambahkan.');
    }

    // Pastikan Akun Admin Absen Tersedia (Tidak bisa lihat keuangan)
    const [absenUser] = await pool.query(`SELECT id FROM users WHERE username = 'admin_absen' OR username = 'admin.absen' LIMIT 1`);
    if (absenUser.length === 0) {
      await pool.query(`
        INSERT INTO users (name, username, email, password, role, status)
        VALUES ('Ahmad Fauzi (Petugas Presensi)', 'admin_absen', 'absen@epesantren.sch.id', '123456', 'Admin Absen', 'Active')
      `);
      console.log('[E-PESANTREN DB] Akun Admin Absen (Operasional) berhasil ditambahkan.');
    }

    return true;
  } catch (err) {
    console.warn('[E-PESANTREN DB] Init Keuangan & Info Error:', err.message);
    return false;
  }
}

