import pool from '../src/config/database.js';

const KEGIATAN_LIST = [
  { nama: 'Pegon', kategori: 'Bahasa & Penulisan', deskripsi: 'Pelajaran aksara Arab Pegon' },
  { nama: 'Tajwid', kategori: 'Tajwid & Al-Qur\'an', deskripsi: 'Ilmu kaidah tajwid bacaan Al-Qur\'an' },
  { nama: 'Safinah', kategori: 'Fiqih', deskripsi: 'Kitab Safinatun Najah (dasar fiqih)' },
  { nama: 'Ta\'lim', kategori: 'Akhlak & Adab', deskripsi: 'Kitab Ta\'limul Muta\'allim (adab menuntut ilmu)' },
  { nama: 'Akhlaqul Banain jilid 1', kategori: 'Akhlak & Adab', deskripsi: 'Kitab Akhlaqul Banin Jilid 1' },
  { nama: 'Praktek Ibadah', kategori: 'Praktek & Ubudiyah', deskripsi: 'Praktek wudhu, shalat fardhu dan sunnah' },
  { nama: 'Al - Qur\'an', kategori: 'Tajwid & Al-Qur\'an', deskripsi: 'Tilawah dan tadarus Al-Qur\'an' },
  { nama: 'Bahasa Inggris', kategori: 'Bahasa & Umum', deskripsi: 'Pelajaran bahasa Inggris santri' },
  { nama: 'Penulisan Patokan', kategori: 'Bahasa & Penulisan', deskripsi: 'Kaidah penulisan patokan/rumus' },
  { nama: 'Al - I\'lal', kategori: 'Nahwu & Shorof', deskripsi: 'Kaidah perubahan huruf illat dalam shorof' },
  { nama: 'Mufrodatu alfadzi taqrib', kategori: 'Fiqih', deskripsi: 'Kosakata dan istilah matan Taqrib' },
  { nama: 'Bajuri Jilid 1', kategori: 'Fiqih', deskripsi: 'Hasyiyah Al-Bajuri ala Fathil Qorib Jilid 1' },
  { nama: 'Sulam Taufik', kategori: 'Fiqih', deskripsi: 'Kitab Sullamut Taufiq (fiqih dan tauhid)' },
  { nama: 'Jurumiyah', kategori: 'Nahwu & Shorof', deskripsi: 'Kitab Matan Al-Ajurumiyyah' },
  { nama: 'Tijan', kategori: 'Aqidah & Tauhid', deskripsi: 'Kitab Tijan Ad-Darori (ilmu tauhid)' },
  { nama: 'Yaqulu', kategori: 'Nahwu & Shorof', deskripsi: 'Nadzom Maqshud / Yaqulu (kaidah shorof)' },
  { nama: 'Tafrijul qurob', kategori: 'Doa & Wirid', deskripsi: 'Kitab wirid dan doa Tafrijul Qurob' },
  { nama: 'Muhafadzoh Jurumiyah', kategori: 'Muhafadzoh (Hafalan)', deskripsi: 'Setoran hafalan nadzom/matan Jurumiyah' },
  { nama: 'Tasrifan', kategori: 'Nahwu & Shorof', deskripsi: 'Hafalan dan praktek tashrif istilahi & lughawi' },
  { nama: 'Al qur\'an', kategori: 'Tajwid & Al-Qur\'an', deskripsi: 'Tahsin dan hafalan ayat-ayat Al-Qur\'an' },
  { nama: 'Bajuri Jilid 2', kategori: 'Fiqih', deskripsi: 'Hasyiyah Al-Bajuri ala Fathil Qorib Jilid 2' },
  { nama: 'Riyadhul Badi\'ah', kategori: 'Fiqih', deskripsi: 'Kitab Riyadhul Badi\'ah fi Fiqhis Syafi\'i' },
  { nama: 'Al - Kaelani', kategori: 'Nahwu & Shorof', deskripsi: 'Kitab Kailani (syarah Izzi ilmu shorof)' },
  { nama: 'Muhafadzoh I\'mrithi', kategori: 'Muhafadzoh (Hafalan)', deskripsi: 'Setoran hafalan Nadzom Imrithi' },
  { nama: 'Munadzoroh', kategori: 'Bahtsul Masail & Diskusi', deskripsi: 'Praktek adab diskusi dan munadzarah ilmiah' },
  { nama: 'I\'anah Jilid 1', kategori: 'Fiqih', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 1' },
  { nama: 'I\'mrithi', kategori: 'Nahwu & Shorof', deskripsi: 'Kitab Nadzom Al-Imrithi' },
  { nama: 'Al - Burdah', kategori: 'Sholawat & Sastra', deskripsi: 'Qoshidah Burdah Imam Al-Bushiri' },
  { nama: 'Waroqot', kategori: 'Ushul Fiqih', deskripsi: 'Kitab Al-Waraqat Imam Al-Haramain' },
  { nama: 'Muhafadzoh Waroqot', kategori: 'Muhafadzoh (Hafalan)', deskripsi: 'Setoran hafalan matan Al-Waraqat' },
  { nama: 'Baca Kosongan', kategori: 'Qiroatul Kitab', deskripsi: 'Praktek membaca kitab gundul / tanpa harakat' },
  { nama: 'I\'anah Jilid 2', kategori: 'Fiqih', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 2' },
  { nama: 'Lathoif', kategori: 'Ushul Fiqih', deskripsi: 'Kitab Lathaiful Isyarat / Al-Asybah' },
  { nama: 'Mutammimah', kategori: 'Nahwu & Shorof', deskripsi: 'Kitab Mutammimah Al-Ajurumiyyah' },
  { nama: 'Bidayatul Hidayah', kategori: 'Tasawwuf & Adab', deskripsi: 'Kitab Bidayatul Hidayah Hujjatul Islam Al-Ghazali' },
  { nama: 'Tafsir', kategori: 'Tafsir & Ulumul Quran', deskripsi: 'Kajian Tafsir Jalalain / Al-Ibriz' },
  { nama: 'Muhafadzoh Alfiyah', kategori: 'Muhafadzoh (Hafalan)', deskripsi: 'Setoran hafalan bait Nadzom Alfiyah Ibnu Malik' },
  { nama: 'Khataman Qur`an', kategori: 'Tajwid & Al-Qur\'an', deskripsi: 'Kegiatan khataman dan wisuda Al-Qur\'an' },
  { nama: 'I\'anah Jilid 3', kategori: 'Fiqih', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 3' }
];

async function seedKegiatan() {
  console.log('--- SEED 39 KEGIATAN & PEMBELAJARAN KITAB ---');
  try {
    // 1. Pastikan tabel materi_hafalan ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materi_hafalan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_materi VARCHAR(191) NOT NULL,
        kategori VARCHAR(100) DEFAULT 'Kitab Kuning',
        target_hafalan VARCHAR(191) NULL,
        deskripsi TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_nama_materi (nama_materi)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    let inserted = 0;
    let skipped = 0;

    for (const item of KEGIATAN_LIST) {
      const [existing] = await pool.query(
        'SELECT id FROM materi_hafalan WHERE LOWER(TRIM(nama_materi)) = LOWER(TRIM(?))',
        [item.nama]
      );

      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO materi_hafalan (nama_materi, kategori, target_hafalan, deskripsi) VALUES (?, ?, ?, ?)',
          [item.nama, item.kategori, item.deskripsi || null, item.deskripsi || null]
        );
        inserted++;
        console.log(`[+] Ditambahkan: ${item.nama} (${item.kategori})`);
      } else {
        // Update kategori & deskripsi jika belum lengkap
        await pool.query(
          'UPDATE materi_hafalan SET kategori = ?, deskripsi = COALESCE(deskripsi, ?) WHERE id = ?',
          [item.kategori, item.deskripsi, existing[0].id]
        );
        skipped++;
        console.log(`[=] Diperbarui/Sudah ada: ${item.nama}`);
      }
    }

    console.log(`\nSELESAI! Ditambahkan: ${inserted}, Diperbarui: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Gagal seed kegiatan:', err);
    process.exit(1);
  }
}

seedKegiatan();

