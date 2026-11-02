import pool from '../src/config/database.js';

// DATA MAPPING KELAS, GENDER, MUSTAHIQ, DAN MUNAWWIB
const KELAS_DATA = [
  // --- BOYS (LAKI-LAKI) ---
  { nama_kelas: '1A Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. M Raya Nizar', munawwib: 'Mr. Abdillah Azhar' },
  { nama_kelas: '1B Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. Rapin FN', munawwib: 'Mr. Ilham Yasin' },
  { nama_kelas: '1C Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. Hilmi Nursyamsi', munawwib: 'Mr. Ifham' },
  { nama_kelas: '1D Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. Rahwan', munawwib: 'Mr. Helmi Ali Akbar' },
  { nama_kelas: '1E Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. Tanzilurrohman', munawwib: 'Mr. Ragyad' },
  { nama_kelas: '1F Boys', tingkat: 'Kelas 1', gender: 'L', mustahiq: 'Mr. Isyam M Noor', munawwib: 'Mr. Marzan' },
  { nama_kelas: '2A Boys', tingkat: 'Kelas 2', gender: 'L', mustahiq: 'Mr. Kanza S.M', munawwib: 'Mr. Habiburrahman' },
  { nama_kelas: '2B Boys', tingkat: 'Kelas 2', gender: 'L', mustahiq: 'Mr. Amin Ma`ruf', munawwib: 'Mr. Akesa' },
  { nama_kelas: '2C Boys', tingkat: 'Kelas 2', gender: 'L', mustahiq: 'Mr. Wahyu Ramdhani', munawwib: 'Mr. M. Nizar' },
  { nama_kelas: '2D Boys', tingkat: 'Kelas 2', gender: 'L', mustahiq: 'Mr. Sandi Nursya`ban', munawwib: 'Mr. Fabregas' },
  { nama_kelas: '3A Boys', tingkat: 'Kelas 3', gender: 'L', mustahiq: 'Mr. M Hikam M.H', munawwib: 'Mr. Abdul Kodir' },
  { nama_kelas: '3B Boys', tingkat: 'Kelas 3', gender: 'L', mustahiq: 'Mr. M Busrol Karim', munawwib: 'Mr. Dede Maulana' },
  { nama_kelas: '4 Boys', tingkat: 'Kelas 4', gender: 'L', mustahiq: 'Mr. Lili Abdul Jalil', munawwib: 'Mr. M Fadly Ibrahim' },
  { nama_kelas: '5 Boys', tingkat: 'Kelas 5', gender: 'L', mustahiq: 'Mr. Muqoddas M.S.I', munawwib: 'Mr. Ridwannurulloh' },
  { nama_kelas: '6 Boys', tingkat: 'Kelas 6', gender: 'L', mustahiq: '', munawwib: '' },
  { nama_kelas: 'Takhoshus 1 Boys', tingkat: 'Takhoshus', gender: 'L', mustahiq: '', munawwib: '' },
  { nama_kelas: 'Takhoshus 2 Boys', tingkat: 'Takhoshus', gender: 'L', mustahiq: '', munawwib: '' },
  { nama_kelas: 'Takhoshus 3 Boys', tingkat: 'Takhoshus', gender: 'L', mustahiq: '', munawwib: '' },

  // --- GIRLS (PEREMPUAN) ---
  { nama_kelas: '1A Girls', tingkat: 'Kelas 1', gender: 'P', mustahiq: 'Miss. Iis F.S', munawwib: 'Miss. Fadilah' },
  { nama_kelas: '1B Girls', tingkat: 'Kelas 1', gender: 'P', mustahiq: 'Miss. Imas Masripah', munawwib: 'Miss. Neng Gina' },
  { nama_kelas: '1C Girls', tingkat: 'Kelas 1', gender: 'P', mustahiq: 'Miss. Laelatul Fauziah', munawwib: 'Miss. Neng Nafis' },
  { nama_kelas: '1D Girls', tingkat: 'Kelas 1', gender: 'P', mustahiq: 'Miss. Fatia', munawwib: 'Miss. Lia Farida' },
  { nama_kelas: '1E Girls', tingkat: 'Kelas 1', gender: 'P', mustahiq: 'Miss. Nurul', munawwib: 'Miss. Reva' },
  { nama_kelas: '2A Girls', tingkat: 'Kelas 2', gender: 'P', mustahiq: 'Miss. Siti Luthfiah', munawwib: 'Miss. Rika' },
  { nama_kelas: '2B Girls', tingkat: 'Kelas 2', gender: 'P', mustahiq: 'Miss. Indri Lesatari', munawwib: 'Miss. Yeyen' },
  { nama_kelas: '2C Girls', tingkat: 'Kelas 2', gender: 'P', mustahiq: 'Mr. Ardiana Firdaus', munawwib: 'Miss. Imel & Miss. Dinar' },
  { nama_kelas: '2D Girls', tingkat: 'Kelas 2', gender: 'P', mustahiq: 'Miss. Najiyah F.N', munawwib: 'Miss. Siti Maryam' },
  { nama_kelas: '2E Girls', tingkat: 'Kelas 2', gender: 'P', mustahiq: 'Mr. Syahrul H', munawwib: 'Miss. Syifa Q' },
  { nama_kelas: '3A Girls', tingkat: 'Kelas 3', gender: 'P', mustahiq: 'Mr. Hapid Usman', munawwib: 'Miss. Nafisa' },
  { nama_kelas: '3B Girls', tingkat: 'Kelas 3', gender: 'P', mustahiq: 'Mr. Asep Nasrulloh', munawwib: 'Miss. Fatimah , Miss. Putri Marwah & Miss. Delia' },
  { nama_kelas: '4 Girls', tingkat: 'Kelas 4', gender: 'P', mustahiq: 'Mr. M Hayatul Fauzi', munawwib: 'Miss. Wardah & Miss. Nurul Ba Hasna' },
  { nama_kelas: '5 Girls', tingkat: 'Kelas 5', gender: 'P', mustahiq: 'Mr. Muqoddas M.S.I', munawwib: 'Miss. Regina' }
];

// Helper: Nama kelas format baru (contoh: '1A' + 'L' => '1A Boys', '1A' + 'P' => '1A Girls')
function getFormattedClassName(rawClass, jk) {
  const clean = String(rawClass || '').trim();
  const suffix = jk === 'P' ? 'Girls' : 'Boys';
  if (clean.toLowerCase().includes('boys') || clean.toLowerCase().includes('girls')) {
    return clean;
  }
  return `${clean} ${suffix}`;
}

async function seedMasterKelasDanSantri() {
  console.log('--- SEEDING MASTER KELAS (DENGAN MUSTAHIQ & MUNAWWIB) & 619 SANTRI ---');
  try {
    // 1. Tambah kolom mustahiq & munawwib di tabel kelas jika belum ada
    try {
      await pool.query("ALTER TABLE kelas ADD COLUMN mustahiq VARCHAR(191) NULL AFTER gender");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE kelas ADD COLUMN munawwib VARCHAR(191) NULL AFTER mustahiq");
    } catch (e) {}

    // Pastikan tabel santri kolomnya aman
    const alterSantri = [
      "ALTER TABLE santri MODIFY COLUMN nama_wali VARCHAR(100) NULL DEFAULT ''",
      "ALTER TABLE santri MODIFY COLUMN no_wa_wali VARCHAR(50) NULL DEFAULT ''",
      "ALTER TABLE santri MODIFY COLUMN hubungan_wali VARCHAR(50) NULL DEFAULT 'Orang Tua'",
      "ALTER TABLE santri MODIFY COLUMN alamat_asal TEXT NULL",
      "ALTER TABLE santri MODIFY COLUMN tempat_lahir VARCHAR(100) NULL DEFAULT ''",
      "ALTER TABLE santri MODIFY COLUMN tgl_lahir DATE NULL",
      "ALTER TABLE santri MODIFY COLUMN foto LONGTEXT NULL",
      "ALTER TABLE santri MODIFY COLUMN capaian_hafalan_juz INT DEFAULT 0",
      "ALTER TABLE santri MODIFY COLUMN tingkat_diniyah VARCHAR(50) DEFAULT 'Wustho'",
      "ALTER TABLE santri ADD COLUMN nama_kelas VARCHAR(50) NULL AFTER tingkat_diniyah",
      "ALTER TABLE santri ADD COLUMN kelas_id INT NULL AFTER nama_kelas"
    ];
    for (const q of alterSantri) {
      try { await pool.query(q); } catch (e) {}
    }

    // 2. Kosongkan & Input Data Master Kelas
    console.log('[1/3] Memperbarui tabel kelas...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    try { await pool.query('TRUNCATE TABLE kelas'); } catch (e) { await pool.query('DELETE FROM kelas'); }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const kelasMap = {}; // nama_kelas => id
    for (const k of KELAS_DATA) {
      const kode_kelas = k.nama_kelas.replace(/\s+/g, '-').toUpperCase();
      const [resK] = await pool.query(`
        INSERT INTO kelas (kode_kelas, nama_kelas, tingkat, gender, mustahiq, munawwib)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [kode_kelas, k.nama_kelas, k.tingkat, k.gender, k.mustahiq || null, k.munawwib || null]);
      
      kelasMap[k.nama_kelas] = resK.insertId;
    }
    console.log(`[✓] Berhasil menyimpan ${KELAS_DATA.length} Kelas lengkap dengan Mustahiq & Munawwib.`);

    // 3. Kosongkan & Input 619 Santri
    console.log('[2/3] Mengosongkan data santri lama...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    try { await pool.query('TRUNCATE TABLE santri'); } catch (e) { await pool.query('DELETE FROM santri'); }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Load RAW_SANTRI dari script lama
    const { RAW_SANTRI } = await import('./seed_santri_full.js');

    let defaultAsramaL = 1;
    let defaultAsramaP = 2;
    try {
      const [asrs] = await pool.query('SELECT id, gender FROM asrama');
      const l = asrs.find(a => a.gender === 'L');
      const p = asrs.find(a => a.gender === 'P');
      if (l) defaultAsramaL = l.id;
      if (p) defaultAsramaP = p.id;
    } catch (e) {}

    console.log('[3/3] Memasukkan 619 santri...');
    let count = 0;
    for (let i = 0; i < RAW_SANTRI.length; i++) {
      const s = RAW_SANTRI[i];
      const nisNum = 2601001 + i;
      const nis = String(nisNum);
      const kode_santri = `STR-26-${String(i + 1).padStart(4, '0')}`;
      const asrama_id = s.jk === 'L' ? defaultAsramaL : defaultAsramaP;
      
      // Kelas baru dengan Boys / Girls (contoh: '1A Boys' / '1B Girls')
      const finalKelasName = getFormattedClassName(s.kelas, s.jk);
      const kelas_id = kelasMap[finalKelasName] || null;
      const tingkat_diniyah = finalKelasName.includes('1') || finalKelasName.includes('2') || finalKelasName.includes('3') ? 'Wustho' : 'Ulya';

      await pool.query(`
        INSERT INTO santri (
          kode_santri, nis, username, password, nama_santri, jk, status_santri,
          asrama_id, tingkat_diniyah, nama_kelas, kelas_id, status, tahun_masuk,
          nama_wali, no_wa_wali, hubungan_wali, alamat_asal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        kode_santri,
        nis,
        nis,
        nis,
        s.nama.trim(),
        s.jk,
        'Mukim',
        asrama_id,
        tingkat_diniyah,
        finalKelasName,
        kelas_id,
        'Aktif',
        '2026/2027',
        'Orang Tua Santri',
        '-',
        'Orang Tua',
        'Pondok Pesantren Nurul Wafa'
      ]);

      count++;
    }

    console.log(`\n[✓] SELESAI SEMUA!`);
    console.log(`1. Master Kelas: ${KELAS_DATA.length} Kelas tersimpan dengan data MUSTAHIQ & MUNAWWIB.`);
    console.log(`2. Data Santri: ${count} Santri tersimpan dengan nama kelas terpisah Boys / Girls (contoh: 1A Boys, 1B Girls).`);
    process.exit(0);
  } catch (err) {
    console.error('Gagal seed kelas dan santri:', err);
    process.exit(1);
  }
}

seedMasterKelasDanSantri();

