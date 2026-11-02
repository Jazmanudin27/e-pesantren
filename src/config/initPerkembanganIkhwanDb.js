import pool from './database.js';

export async function initPerkembanganIkhwanDb() {
  try {
    // 1. TABEL MASTER KATEGORI PERKEMBANGAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`perkembangan_kategori\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nama_kategori\` VARCHAR(150) NOT NULL UNIQUE,
        \`deskripsi\` VARCHAR(255) NULL,
        \`gender\` ENUM('L', 'P', 'Semua') NOT NULL DEFAULT 'L',
        \`urutan\` INT DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. TABEL MASTER ITEM (PERMASALAHAN, PENYEBAB, TINDAKAN)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`perkembangan_master_item\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kategori_id\` INT NOT NULL,
        \`tipe\` ENUM('permasalahan', 'penyebab', 'tindakan') NOT NULL,
        \`kode\` VARCHAR(20) NULL,
        \`teks\` TEXT NOT NULL,
        \`urutan\` INT DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_pmi_kat_tipe\` (\`kategori_id\`, \`tipe\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. TABEL EVALUASI PERKEMBANGAN SANTRI
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`perkembangan_evaluasi_santri\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`kategori_id\` INT NOT NULL,
        \`kelas_id\` VARCHAR(50) NULL,
        \`tanggal\` DATE NOT NULL,
        \`status_kelulusan\` ENUM('Lulus', 'Tidak Lulus') NOT NULL DEFAULT 'Lulus',
        \`permasalahan_ids\` TEXT NULL,
        \`penyebab_ids\` TEXT NULL,
        \`tindakan_ids\` TEXT NULL,
        \`catatan_tambahan\` TEXT NULL,
        \`asatidz_pencatat\` VARCHAR(150) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`uq_eval_santri_kat_tgl\` (\`santri_id\`, \`kategori_id\`, \`tanggal\`),
        INDEX \`idx_pes_santri\` (\`santri_id\`),
        INDEX \`idx_pes_kat\` (\`kategori_id\`),
        INDEX \`idx_pes_tgl\` (\`tanggal\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. PASTIKAN KOLOM KELAS DI TABEL SANTRI TERSEDIA
    try {
      const [cols] = await pool.query("SHOW COLUMNS FROM santri LIKE 'kelas'");
      if (!cols || cols.length === 0) {
        await pool.query("ALTER TABLE santri ADD COLUMN kelas VARCHAR(100) NULL DEFAULT NULL");
      }
    } catch (e) {
      console.warn('[INIT PERKEMBANGAN DB] Note check santri.kelas:', e.message);
    }

    // SEED 8 KATEGORI DAN MASTER ITEM JIKA MASIH KOSONG
    const [countKat] = await pool.query('SELECT COUNT(*) as cnt FROM perkembangan_kategori');
    if (countKat[0].cnt === 0) {
      const initialData = [
        {
          nama: 'Praktik Ibadah',
          permasalahan: [
            'Santri melakukan kesalahan dalam gerakan sholat',
            'Santri belum hafal pada bacaan sholat',
            'Santri belum mampu membaca bacaan sholat dengan benar',
            'Santri melakukan gerakan sholat dengan terburu-buru'
          ],
          penyebab: [
            'Kurangnya pemahaman tentang tata cara sholat dan belum terbiasa mempraktikannya dengan benar',
            'Kurangnya pengulangan latihan mandiri dan kurangnya pendampingan dalam menghafal bacaan',
            'Kurangnya penguasaan makhroj huruf, pelafalan terhadap teks bacaan, dan terlalu cepat dalam pembacaannya',
            'Belum memahami pentingnya Tuma’ninah, dan terbiasa meniru gerakan tanpa memahami ketentuannya',
            'Buku catatan hilang atau tidak kumplit',
            'Banyak becanda ketika pembelajaran berlangsung'
          ],
          tindakan: [
            'Pengajar memperagakan setiap gerakan sholat, kemudian membimbing santri untuk menirukan dan memperbaiki gerakan yang belum tepat',
            'Melakukan latihan bacaan secara bertahap dan berulang',
            'Pengajar memberikan contoh pelafalan yang benar dan mengoreksi kesalahan secara langsung',
            'Memberikan contoh gerakan yang disertai Tuma’ninah',
            'Santri wajib menuliskan gerakan/bacaan yang salah pada buku catatan khusus',
            'Pengajar memberikan hukuman (berdiri) kepada santri yang selalu becanda/mengobrol',
            'Pengajar mengecek kembali buku catatan praktik ibadah'
          ]
        },
        {
          nama: 'Baca Qur\'an',
          permasalahan: [
            'Santri kesulitan membaca ayat yang panjang',
            'Santri belum mampu menerapkan hukum tajwid dalam bacaan Al-qur\'an',
            'Santri membaca dengan terburu-buru sehingga kaidah tajwid terabaikan',
            'Santri belum tepat menerapkan hukum mad pada bacaannya',
            'Santri belum mampu membaca mokhorijul huruf dengan benar',
            'Santri masih terbata-bata ketika membaca Al-Qur\'an',
            'Santri masih Iqro',
            'Paham terhadap materi tapi tidak bisa mengamalkan dalam bacaan (sebaliknya)',
            'Tidur/mengantuk ketika menunggu bagian di tes',
            'Belum konsisten benar dalam membaca Al-quran',
            'Santri masih ada yang sering datang terlambat pada kegiatan Sorogan Quran dan Sebagian jarang mengikuti kegiatan Sorogan Quran',
            'Santri belum memahami sepenuhnya terhadap materi tajwid'
          ],
          penyebab: [
            'Kurangnya waktu Sorogan Quran',
            'Kurangnya membaca Quran dan muroja\'ah',
            'Kurangnya fokus saat membaca Quran',
            'Belum memahami dan belum terbiasa menerapkan ilmu tajwid',
            'Kurangnya kesadaran dan kepercayaan diri dan jarang mengulang bagian bacaan yang masih salah',
            'Sering lupa dalam pemahaman materi tajwid',
            'Belum menguasai tanda waqof',
            'Ingin cepat-cepat menyelesaikan bacaannya',
            'Belum menguasai pelafalan huruf hijaiyah dengan baik dan benar'
          ],
          tindakan: [
            'Mengenal tanda-tanda waqof dan membimbing santri menggabungkan potongan bacaan secara bertahap',
            'Menggabungkan pembelajaran teori dengan praktik membaca ayat dan memberikan koreksi secara langsung',
            'Membiasakan membaca Quran secara tartil',
            'Memberikan contoh bacaan (latihan pengucapan)',
            'Terus menerus berlatih/menyorog kembali bagi santri yang belum lancar',
            'Memberi tugas/target supaya membaca 3 halaman/hari',
            'Memberikan pengarahan dan motivasi',
            'Menuliskan bacaan yang salah dan mempelajari kembali',
            'Mengulang kembali materi tajwid',
            'Menghukum santri yang tidur',
            'Menjadwalkan sorogan tambahan',
            'Melakukan evaluasi ulang setelah latihan'
          ]
        },
        {
          nama: 'MUHAFADZOH DAN TASRIPAN',
          permasalahan: [
            'Menghafal di tempat (ketika waktu setor)',
            'Hafalan sebelumnya lupa',
            'Tidak lancar ketika setoran hafalan',
            'Telat masuk kelas',
            'Jarang menyetorkan hafalan',
            'Kurangnya minat menghafal',
            'Pemahaman dan kecepatan talarannya lambat',
            'Jarang menghafal di kobong',
            'Sering gonta-ganti majmu\'',
            'Target hafalan belum tercapai',
            'Beberapa santri kehilangan buku catatan Muhafadzoh'
          ],
          penyebab: [
            'Kurang menghafal di kobong',
            'Tidak hadir saat kegiatan Muhafadzoh',
            'Kehadiran yang terputus karena sering izin piket/sakit',
            'Catatan target hafalan kurang teratur',
            'Sering izin ke wc supaya tidak berdiri lama',
            'Kurangnya kesadaran',
            'Sering diingatkan atau harus diawasi lafalz pertamanya',
            'Tidak fokus saat jam kegiatan berlangsung'
          ],
          tindakan: [
            'Bimbingan khusus/penguatan mandiri',
            'Mengevaluasi hasil dari pertemuan sebelumnya',
            'Metode berpasangan (saling mengoreksi satu sama lain)',
            'Memberikan pengarahan dan motivasi',
            'Memberikan hukuman/peringatan bagi santri yang tidak mencapai target/tidak setor hafalan',
            'Sistem penyetaran berbeda',
            'Adanya waktu tambahan/jadwal tambahan',
            'Menetapkan target hafalan',
            'Membuat catatan capaian setoran',
            'Memberi apresiasi kepada santri yang tamat talarannya/konsisten dalam menghafal'
          ]
        },
        {
          nama: 'ABSENSI',
          permasalahan: [
            'Masih ada yang telat masuk kelas',
            'Tidak hadir tanpa keterangan yang jelas (alpa)',
            'Tidak mengikuti pengajian karna sakit, izin dll.',
            'Kehadiran belum konsisten',
            'Masih ada yang pura-pura sakit'
          ],
          penyebab: [
            'Kurangnya kesadaran/kurang minat belajar',
            'Sering lalai (berleha-leha) ketika masuk kelas',
            'Sering sakit yang perlu memerlukan waktu untuk beristirahat',
            'Izin pulang /izin keperluan tertentu',
            'Menjalankan tugas resmi di pesantren yang tidak bisa ditinggalkan',
            'Tidak bisa mengatur waktu',
            'Susah di bangunkan',
            'Kurang semangat',
            'Lupa membawa alat mengaji'
          ],
          tindakan: [
            'Diberi hukuman lari',
            'Diberi hukuman kendong',
            'Berdiri',
            'Memberikan pengarahan + motivasi',
            'Diberi hukuman bersih-bersih kelas',
            'Koordinasi dengan pengurus',
            'Mengarahkan santri untuk menyusul materi yang tertinggal'
          ]
        },
        {
          nama: 'AKHLAQ',
          permasalahan: [
            'Berprilaku yang kurang sopan',
            'Kurang menjaga adab saat di hadapan mustahik',
            'Bicara kurang sopan saat bersama teman-teman',
            'Mengambil barang milik teman (tanpa izin)',
            'Malas belajar',
            'Kurang disiplin waktu',
            'Bercanda/ngobrol ketika pengajian berlangsung',
            'Tidur ketika pengajian berlangsung',
            'Belikan',
            'Santri memotong pembicaraan/penjelasan guru ketika pengajian berlangsung',
            'Tidak mencatat ketika mustahik menjelaskan',
            'Ketika pengajian harus disusul'
          ],
          penyebab: [
            'Terpengaruh oleh teman dekat',
            'Kurang membiasakan disiplin dan tanggung jawab',
            'Belum bisa memahami dampak perilaku',
            'Tidur terlalu malam',
            'Merasa jenuh',
            'Belum bisa mengatur waktu antara serius belajar dan bercanda',
            'Santri merasa sangat penasaran terhadap hal yang ingin ditanyakan',
            'Kurangnya kesadaran',
            'Belum membiasakan berbicara bahasa inggris sebagaimana mestinya',
            'Kurangnya pengamalan kitab yang dipelajari',
            'Belum terbentuk kebiasaan baik'
          ],
          tindakan: [
            'Memberikan pengarahan dan motivasi serta bimbingan',
            'Memberikan teguran',
            'Memberikan hukuman bagi santri yang bermasalah',
            'Menyediakan waktu khusus untuk interaksi yang positif (sharing)',
            'Bersifat tegas terhadap santri',
            'Berkoordinasi dengan pihak yang bertanggung jawab'
          ]
        },
        {
          nama: 'KEMANDIRIAN + MENJAGA BARANG',
          permasalahan: [
            'Sering hilang alat-alat pengajian',
            'Tidak mempersiapkan sebelumnya peralatan yang akan dipakai mengaji',
            'Kurang berinisiatif merapikan barang dan menyiapkan kebutuhan sendiri',
            'Belum konsisten terhadap tanggung jawab menjaga barang',
            'Acuh terhadap orang lain',
            'Kurang disiplin dalam mengikuti kegiatan',
            'Kurang semangat belajar',
            'Sering merasa cemas',
            'Selalu melimpahkan tugas/tanggung jawabnya kepada orang lain (menyaruh-nyuruh)',
            'Sering menunda-nunda tugas pribadinya'
          ],
          penyebab: [
            'Belum terbiasa merapikan perlengkapan setiap selesai belajar',
            'Belum konsisten menempatkan barang pada tempat semestinya',
            'Kurangnya kesadaran/kepedulian',
            'Merasa kehilangan merupakan hal biasa di pesantren (menganggap spele)',
            'Kurangnya pengarahan dari pengurus',
            'Mudah bosan',
            'Belum terciptanya percaya diri'
          ],
          tindakan: [
            'Berkoordinasi dengan para pengurus agar terus membina dan melatih agar bisa hidup mandiri',
            'Mengevaluasi perkembangan secara rutin',
            'Meminta kepada kedua orang tua agar sama-sama ikut memberikan pengarahan dan motivasi terhadap santrinya',
            'Memberikan peringatan/teguran',
            'Memberikan pemahaman',
            'Memberikan pembiasaan secara konsisten dan mengurangi ketergantungan pada perintah pengurus',
            'Adanya pergeseran barang berkala'
          ]
        },
        {
          nama: 'PEMAHAMAN ILMU NAWU',
          permasalahan: [
            'Masih banyak yang belum paham terhadap materi',
            'Belum bisa dalam penerapannya',
            'Masih ada yang terlihat bingung dalam memahami materi',
            'Kurangnya semangat belajar',
            'Kurangnya minat belajar',
            'Masih ada yang tidur/mengantuk ketika pembelajaran berlangsung',
            'Belum mampu menjelaskan kembali inti materi yang disampaikan/sering lupa',
            'Belum konsisten hasil latihan di kitab',
            'Kurang keaktifan di kelas',
            'Belum konsisten terlaksananya kegiatan sorogan',
            'Kurang fokus/konsentrasi pada saat mustahik menjelaskan',
            'Karena beda-bedanya kemampuan belajar santri',
            'Tidak mencatat/melogat',
            'Sering becanda/mengobrol saat pembelajaran berlangsung',
            'Sering tidak masuk kelas'
          ],
          penyebab: [
            'Kurangnya menghafal',
            'Kurangnya kesadaran',
            'Hilangnya alat-alat pengajian',
            'Tidur yang tidak teratur',
            'Kurangnya penegasan dari pengurus',
            'Merasa jenuh'
          ],
          tindakan: [
            'Menulis materi yang tertinggal',
            'Memberikan tugas tambahan/target/latihan',
            'Menanyakan materi yang tidak paham/tertinggal kepada mustahik/teman sekelas',
            'Memberikan pengarahan dan motivasi serta bimbingan',
            'Memberikan sanksi/hukuman (berdiri/lari dll)',
            'Menyuruh untuk membasuh muka dulu',
            'Menjelaskan kembali materi yang belum dipahami',
            'Menjadwalkan jam tambahan (sorogan)',
            'Menilai pemahaman melalui keaktifan di kelas',
            'Memaksimalkan pendekatan terhadap santri',
            'Menyampaikan materi pembelajaran disesuaikan dengan kemampuan santri',
            'Memberikan apresiasi terhadap santri yang benar-benar aktif di kelas',
            'Menginformasikan perkembangan pemahaman kepada orang tua dengan seutuhnya',
            'Koordinasi dengan oppm dan Rois',
            'Menambahkan jadwal kegiatan cek logatan dan catatan diluar jam mengajar'
          ]
        },
        {
          nama: 'PEMAHAMAN ILMU FIKIH',
          permasalahan: [
            'Belum ada peningkatan',
            'Belum bisa dalam penerapannya',
            'Masih ada yang terlihat bingung dalam memahami materi',
            'Kurangnya semangat belajar',
            'Kurangnya minat belajar',
            'Masih ada yang tidur/mengantuk ketika pembelajaran berlangsung',
            'Belum mampu menjelaskan kembali inti materi yang disampaikan',
            'Belum bisa konsisten hasil latihan-latihan kitab',
            'Kurang keaktifan di kelas',
            'Belum konsisten terlaksananya kegiatan sorogan',
            'Kurang fokus/konsentrasi pada saat mustahik menjelaskan',
            'Karena beda-bedanya kemampuan belajar santri',
            'Tidak mencatat/melogat',
            'Sering becanda/mengobrol saat pembelajaran berlangsung',
            'Sering tidak masuk kelas'
          ],
          penyebab: [
            'Kurangnya menghafal/mutholaah',
            'Kurangnya kesadaran',
            'Hilangnya alat-alat pengajian',
            'Tidur yang tidak teratur',
            'Kurangnya penegasan dari pengurus',
            'Merasa jenuh'
          ],
          tindakan: [
            'Menulis materi yang tertinggal',
            'Memberikan tugas tambahan / target / Latihan-latihan',
            'Menanyakan materi yang tidak paham / tertinggal kepada mustahik / teman sekelas',
            'Memberikan pengarahan dan motivasi serta bimbingan',
            'Memberi sanksi / hukuman (berdiri, lari dll)',
            'Menyuruh untuk membasuh muka dulu',
            'Menjelaskan kembali materi yang belum dipahami',
            'Menjadwalkan jam tambahan (sorogan)',
            'Menilai pemahaman melalui keaktifan di kelas',
            'Memaksimalkan pendekatan terhadap santri (penyederhanaan materi)',
            'Menyampaikan materi pembelajaran disesuaikan dengan kemampuan santri',
            'Memberikan apresiasi terhadap santri yang benar-benar aktif di kelas',
            'Menginformasikan perkembangan pemahaman kepada orang tua dengan seutuhnya',
            'Koordinasi dengan OPPN dan Rois',
            'Menambahkan jadwal kegiatan cek logatan dan catatan di luar jam mengajar'
          ]
        }
      ];

      for (let i = 0; i < initialData.length; i++) {
        const item = initialData[i];
        const [resKat] = await pool.query(`
          INSERT INTO perkembangan_kategori (nama_kategori, deskripsi, gender, urutan)
          VALUES (?, ?, 'L', ?)
        `, [item.nama, `Kategori diagnostik perkembangan santri ikhwan: ${item.nama}`, i + 1]);

        const katId = resKat.insertId;

        // Insert Permasalahan
        for (let p = 0; p < item.permasalahan.length; p++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'permasalahan', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + p), item.permasalahan[p], p + 1]);
        }

        // Insert Penyebab
        for (let c = 0; c < item.penyebab.length; c++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'penyebab', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + c), item.penyebab[c], c + 1]);
        }

        // Insert Tindakan
        for (let t = 0; t < item.tindakan.length; t++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'tindakan', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + t), item.tindakan[t], t + 1]);
        }
      }

      console.log('[E-PESANTREN DB] Seed Master Perkembangan Santri Laki-Laki (8 Kategori) berhasil dibuat.');
    }

    // CEK DAN SEED MASTER KATEGORI SANTRI PEREMPUAN (AKHWAT)
    try {
      const [idxRows] = await pool.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'perkembangan_kategori' 
          AND INDEX_NAME = 'nama_kategori'
      `);
      if (idxRows && idxRows.length > 0) {
        await pool.query('ALTER TABLE perkembangan_kategori DROP INDEX `nama_kategori`');
      }
    } catch (e) {
      console.warn('[E-PESANTREN DB] Drop index nama_kategori note:', e.message);
    }

    try {
      const [idxUq] = await pool.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'perkembangan_kategori' 
          AND INDEX_NAME = 'uq_kat_gender'
      `);
      if (!idxUq || idxUq.length === 0) {
        await pool.query('ALTER TABLE perkembangan_kategori ADD UNIQUE KEY `uq_kat_gender` (`nama_kategori`, `gender`)');
      }
    } catch (e) {
      console.warn('[E-PESANTREN DB] Add index uq_kat_gender note:', e.message);
    }

    const [countKatPutri] = await pool.query("SELECT COUNT(*) as cnt FROM perkembangan_kategori WHERE gender = 'P'");
    if (countKatPutri[0].cnt === 0) {
      const initialDataPutri = [
        {
          nama: 'Praktek Ibadah',
          permasalahan: [
            'Masih terdapat santri yang salah dalam membaca bacaan sholat.',
            'Gerakan sholat masih belum sempurna benar',
            'Masih terdapat santri yang kurang fokus saat praktek',
            'Belum hafal bacaan sholat'
          ],
          penyebab: [
            'Santri masih kurang menghafal',
            'Masih kurang teliti saat membaca',
            'Kurangnya santri dalam latihan dan pengamalan',
            'Masih terdapat santri yang terburu-buru',
            'Terdapat santri yang mengantuk',
            'Kurang fokus mengikuti kegiatan',
            'Banyak catatan santri yang belum kumplit',
            'Terdapat santri yang merasa bosan'
          ],
          tindakan: [
            'Mengadakan kegiatan sorogan dan bimbingan khusus',
            'Menindak santri yang kurang fokus',
            'Memberikan tugas untuk mencatat kesalahan-kesalahan dalam praktek',
            'Diberikan arahan dan motivasi',
            'Menyuruh santri untuk mencuci muka saat mengantuk',
            'Mengadakan evaluasi perkembangan santri'
          ]
        },
        {
          nama: 'Baca Quran',
          permasalahan: [
            'Bacaan belum lancar',
            'Masih terdapat bacaan yang belum benar',
            'Masih terdapat santri yang masih iqro',
            'Masih belum konsisten benar',
            'Masih terdapat santri yang belum bisa menerapkan',
            'Terdapat santri yang selalu membaca panjang di akhir kalimat',
            'Masih keliru dan kurang jelas dalam melafalkan bacaan',
            'Masih terlambat masuk kelas',
            'Materi yang masih belum faham',
            'Sering tidak mengikuti kegiatan',
            'Masih sering menyambungkan',
            'Bisa membaca tetapi materi tidak tahu'
          ],
          penyebab: [
            'Kurang latihan membaca Qur\'an',
            'Kurang kesadaran diri untuk bisa membaca Qur\'an',
            'Jarang mengikuti Sorogan',
            'Kurang menghafal materi',
            'Terdapat Santri Yang lupa materi',
            'Kurangnya penguasaan kaidah ilmu tajwid'
          ],
          tindakan: [
            'Mengadakan kegiatan Sorogan diluar jam yang ditentukan',
            'Diberi arahan dan bimbingan',
            'Diberi tugas untuk belajar',
            'Diberikan motivasi agar minat dan kesadaran untuk benar dalam membaca Qur\'an meningkat',
            'Menjelaskan kembali materi yang tidak difahami',
            'Memberikan contoh pembacaan yang benar'
          ]
        },
        {
          nama: 'ABSENSI',
          permasalahan: [
            'Terlambat mengikuti pengajian',
            'Terlambat mengikuti berjamaah',
            'Sering izin tidak mengikuti kegiatan',
            'Pura-pura sakit',
            'Sering minta izin ke kamar mandi saat pembelajaran',
            'Tidak mengikuti kegiatan tanpa keterangan'
          ],
          penyebab: [
            'Tidak ada persiapan sebelum pengajian dimulai',
            'Persiapan pengajian yang lelet',
            'Susah bangun tidur',
            'Izin piket',
            'Males-malesan',
            'Kurang cekatan',
            'Mengontrol anggota kobong dulu',
            'Belum bisa disiplin waktu'
          ],
          tindakan: [
            'Memberikan arahan dan motivasi',
            'Memberikan teguran dan konsekuensi',
            'Berkoordinasi dengan Pengurus OPPN dan Rois'
          ]
        },
        {
          nama: 'KEMANDIRIAN & TANGGUNG JAWAB',
          permasalahan: [
            'Buku catatan tidak rapih dan tidak lengkap',
            'Barang milik pribadi sering hilang',
            'Masih telat datang saat pengajian',
            'Kurang rapih saat berpakaian',
            'Santri masih kurang mandiri dalam menjalankan kewajiban santri',
            'Masih kurang menjaga kerapihan kobong dan lemari',
            'Masih perlu diingatkan untuk menjalankan kewajiban santri',
            'Cucian masih berserakan dan tidak diambil kembali',
            'Masih kurang tanggung jawab dalam menjalankan kewajiban santri',
            'Sering lupa menyimpan barang',
            'Terkadang memakai pakaian yang terlihat tidak menutupi aurat',
            'Terkadang masih menggunakan barang milik orang lain tanpa izin terlebih dahulu'
          ],
          penyebab: [
            'Masih perlu adaptasi terhadap lingkungan / kebiasaan baik',
            'Masih kurangnya kesadaran dalam menjaga barang pribadi',
            'Kurang teratur dalam menyimpan barang',
            'Belum mampu menghargai barang milik orang lain',
            'Belum mampu mengatur waktu secara optimal',
            'Tidak memberi tanda khusus pada barang milik pribadi',
            'Barang milik pribadi tidak terkontrol',
            'Masih kekanak-kanakan'
          ],
          tindakan: [
            'Diberi arahan',
            'Diberi motivasi dan teguran',
            'Memberikan pantauan dan evaluasi dengan Pengurus',
            'Melakukan pengontrolan kebersihan lemari dan kobong',
            'Diadakan kegiatan pengecekan barang pribadi',
            'Diberi tanda khusus pada barang pribadi supaya tidak tertukar'
          ]
        },
        {
          nama: 'AKHLAK',
          permasalahan: [
            'Masih terdapat santri yang belum mematuhi aturan dan arahan',
            'Masih terdapat santri yang mengambil barang yang bukan haknya',
            'Masih belum bisa menjaga kebersihan diri dan pakaian',
            'Masih terdapat santri yang menerima lapang dada saat diberi teguran',
            'Berbicara kurang sopan',
            'Suka mengobrol saat pengajian berlangsung',
            'Kurangnya menghargai orang lain',
            'Masih suka berbohong'
          ],
          penyebab: [
            'Tidak teraturnya jadwal tidur malam',
            'Masih suka ngobrol',
            'Tingkat kesadaran masih rendah',
            'Belum mampu berkomunikasi dengan baik',
            'Belum mengetahui cara bertatakrama dan berbicara yang baik',
            'Emosi masih tidak stabil',
            'Merasa jenuh',
            'Masih suka meniru pergaulan yang kurang baik',
            'Kurangnya introspeksi diri pada saat menerima teguran'
          ],
          tindakan: [
            'Diberikan nasehat, arahan dan bimbingan',
            'Berkoordinasi dengan pengurus',
            'Memberikan teguran',
            'Melakukan pemantauan dan evaluasi dengan pengurus',
            'Mengadakan pendekatan secara khusus'
          ]
        },
        {
          nama: 'Muhafadzoh dan Tasrifan',
          permasalahan: [
            'Menghafal dijadwal setor hafalan',
            'Sering lupa kembali hafalan sebelumnya',
            'Tidak menyetorkan hafalan',
            'Semangat menghafal masih kurang',
            'Tertinggal jauh dari target hafalan',
            'Lambat dalam menghafal',
            'Hafalan masih belum sesuai dengan ketentuan',
            'Terlambat datang',
            'Jarang menghafal diluar jam talaran',
            'Buku catatan muhafadzoh hilang',
            'Setor hafal tapi tidak memenuhi target capaian'
          ],
          penyebab: [
            'Jarang menghafal kembali',
            'Kurangnya kesadaran untuk menghafal',
            'Masih banyak mengobrol',
            'Merasa cepat lelah',
            'Sering izin tidak mengikuti kegiatan'
          ],
          tindakan: [
            'Diberikan arahan dan motivasi',
            'Diberikan jadwal tambahan menghafal',
            'Diberikan tugas',
            'Diberikan hukuman'
          ]
        },
        {
          nama: 'PEMAHAMAN',
          permasalahan: [
            'Nilai latihan-latihan menurun',
            'Kurangnya minat belajar',
            'Melogat kitab masih bolong-bolong',
            'Sering ketiduran saat pengajian',
            'Fokus dan konsentrasi masih kurang',
            'Masih terdapat santri yang ngobrol saat pengajian berlangsung',
            'Materi yang tertinggal masih malas untuk Sorogan',
            'Penulisan pegon masih terhitung kebesaran',
            'Penulisan pegon belum lancar',
            'Masih keliru saat membaca pegon',
            'Tidak berani bertanya saat tidak faham',
            'Merasa bosan',
            'Masih terdapat santri yang kesulitan memahami materi',
            'Logatannya hanya terbaca saat selesai melogat kitab saja',
            'Belum bisa menerapkan pemahaman pada contoh / kalimat lain',
            'Belum bisa memahami dengan baik materi yang disampaikan',
            'Belum bisa membuat contoh lain pada permasalahan',
            'Kurangnya muthalaah materi pembelajaran',
            'Masih jarang mencatat materi yang dijelaskan',
            'Kurangnya interaksi saat pengajian',
            'Sering izin tidak mengikuti kegiatan'
          ],
          penyebab: [
            'Jadwal tidur malam kurang teratur',
            'Perlengkapan pengajian ada yang hilang',
            'Kurangnya kesadaran untuk memahami materi',
            'Catatan pengajian hilang',
            'Emosional diri belum stabil',
            'Kurangnya muthalaah',
            'Buku catatan pengajian tidak kumplit',
            'Malu untuk menanyakan materi yang tertinggal',
            'Sering izin tidak mengikuti kegiatan',
            'Melogat kitab belum lancar',
            'Kurangnya latihan secara mandiri di kobong',
            'Terlambat datang pengajian',
            'Kurang memperhatikan dengan baik saat pengajian berlangsung',
            'Hanya menghafal materi yang tercatat dibuku saja'
          ],
          tindakan: [
            'Memberikan teguran / sanksi',
            'Membuat jadwal sorogan khusus',
            'Memberikan arahan dan bimbingan',
            'Memberikan contoh yang variatif saat pengajian',
            'Memberikan tugas tambahan',
            'Melakukan koordinasi dengan pengurus',
            'Memberikan latihan mandiri',
            'Memberikan kesempatan untuk bertanya',
            'Mengadakan evaluasi mingguan'
          ]
        }
      ];

      for (let i = 0; i < initialDataPutri.length; i++) {
        const item = initialDataPutri[i];
        const [resKat] = await pool.query(`
          INSERT INTO perkembangan_kategori (nama_kategori, deskripsi, gender, urutan)
          VALUES (?, ?, 'P', ?)
        `, [item.nama, `Kategori diagnostik perkembangan santri putri (akhwat): ${item.nama}`, i + 1]);

        const katId = resKat.insertId;

        // Insert Permasalahan
        for (let p = 0; p < item.permasalahan.length; p++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'permasalahan', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + p), item.permasalahan[p], p + 1]);
        }

        // Insert Penyebab
        for (let c = 0; c < item.penyebab.length; c++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'penyebab', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + c), item.penyebab[c], c + 1]);
        }

        // Insert Tindakan
        for (let t = 0; t < item.tindakan.length; t++) {
          await pool.query(`
            INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
            VALUES (?, 'tindakan', ?, ?, ?)
          `, [katId, String.fromCharCode(97 + t), item.tindakan[t], t + 1]);
        }
      }

      console.log('[E-PESANTREN DB] Seed Master Perkembangan Santri Perempuan (7 Kategori) berhasil dibuat.');
    }

    return true;
  } catch (err) {
    console.warn('[E-PESANTREN DB] Init Perkembangan Ikhwan Error:', err.message);
    return false;
  }
}

