import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// Default presets 39 Kegiatan & Pembelajaran Kitab
const DEFAULT_PRESETS = [
  { id: 1, nama_materi: 'Pegon', kategori: 'Bahasa & Penulisan', target_hafalan: 'Pelajaran aksara Arab Pegon', deskripsi: 'Pelajaran aksara Arab Pegon' },
  { id: 2, nama_materi: 'Tajwid', kategori: 'Tajwid & Al-Qur\'an', target_hafalan: 'Ilmu tajwid Al-Qur\'an', deskripsi: 'Ilmu kaidah tajwid bacaan Al-Qur\'an' },
  { id: 3, nama_materi: 'Safinah', kategori: 'Fiqih', target_hafalan: 'Matan Safinatun Najah', deskripsi: 'Kitab Safinatun Najah (dasar fiqih)' },
  { id: 4, nama_materi: 'Ta\'lim', kategori: 'Akhlak & Adab', target_hafalan: 'Ta\'limul Muta\'allim', deskripsi: 'Kitab Ta\'limul Muta\'allim (adab menuntut ilmu)' },
  { id: 5, nama_materi: 'Akhlaqul Banain jilid 1', kategori: 'Akhlak & Adab', target_hafalan: 'Akhlaqul Banin Jilid 1', deskripsi: 'Kitab Akhlaqul Banin Jilid 1' },
  { id: 6, nama_materi: 'Praktek Ibadah', kategori: 'Praktek & Ubudiyah', target_hafalan: 'Wudhu & Shalat', deskripsi: 'Praktek wudhu, shalat fardhu dan sunnah' },
  { id: 7, nama_materi: 'Al - Qur\'an', kategori: 'Tajwid & Al-Qur\'an', target_hafalan: 'Tilawah & Tadarus', deskripsi: 'Tilawah dan tadarus Al-Qur\'an' },
  { id: 8, nama_materi: 'Bahasa Inggris', kategori: 'Bahasa & Umum', target_hafalan: 'Vocabulary & Grammar', deskripsi: 'Pelajaran bahasa Inggris santri' },
  { id: 9, nama_materi: 'Penulisan Patokan', kategori: 'Bahasa & Penulisan', target_hafalan: 'Patokan Kaidah', deskripsi: 'Kaidah penulisan patokan/rumus' },
  { id: 10, nama_materi: 'Al - I\'lal', kategori: 'Nahwu & Shorof', target_hafalan: 'Qawaidul I\'lal', deskripsi: 'Kaidah perubahan huruf illat dalam shorof' },
  { id: 11, nama_materi: 'Mufrodatu alfadzi taqrib', kategori: 'Fiqih', target_hafalan: 'Mufrodat Taqrib', deskripsi: 'Kosakata dan istilah matan Taqrib' },
  { id: 12, nama_materi: 'Bajuri Jilid 1', kategori: 'Fiqih', target_hafalan: 'Fathul Qorib & Bajuri 1', deskripsi: 'Hasyiyah Al-Bajuri ala Fathil Qorib Jilid 1' },
  { id: 13, nama_materi: 'Sulam Taufik', kategori: 'Fiqih', target_hafalan: 'Sullamut Taufiq', deskripsi: 'Kitab Sullamut Taufiq (fiqih dan tauhid)' },
  { id: 14, nama_materi: 'Jurumiyah', kategori: 'Nahwu & Shorof', target_hafalan: 'Matan Al-Ajurumiyyah', deskripsi: 'Kitab Matan Al-Ajurumiyyah' },
  { id: 15, nama_materi: 'Tijan', kategori: 'Aqidah & Tauhid', target_hafalan: 'Tijan Ad-Darori', deskripsi: 'Kitab Tijan Ad-Darori (ilmu tauhid)' },
  { id: 16, nama_materi: 'Yaqulu', kategori: 'Nahwu & Shorof', target_hafalan: 'Nadzom Maqshud / Yaqulu', deskripsi: 'Nadzom Maqshud / Yaqulu (kaidah shorof)' },
  { id: 17, nama_materi: 'Tafrijul qurob', kategori: 'Doa & Wirid', target_hafalan: 'Wirid & Doa', deskripsi: 'Kitab wirid dan doa Tafrijul Qurob' },
  { id: 18, nama_materi: 'Muhafadzoh Jurumiyah', kategori: 'Muhafadzoh (Hafalan)', target_hafalan: 'Setoran Bait/Matan Jurumiyah', deskripsi: 'Setoran hafalan nadzom/matan Jurumiyah' },
  { id: 19, nama_materi: 'Tasrifan', kategori: 'Nahwu & Shorof', target_hafalan: 'Tashrif Istilahi & Lughawi', deskripsi: 'Hafalan dan praktek tashrif istilahi & lughawi' },
  { id: 20, nama_materi: 'Al qur\'an', kategori: 'Tajwid & Al-Qur\'an', target_hafalan: 'Tahsin & Hafalan', deskripsi: 'Tahsin dan hafalan ayat-ayat Al-Qur\'an' },
  { id: 21, nama_materi: 'Bajuri Jilid 2', kategori: 'Fiqih', target_hafalan: 'Fathul Qorib & Bajuri 2', deskripsi: 'Hasyiyah Al-Bajuri ala Fathil Qorib Jilid 2' },
  { id: 22, nama_materi: 'Riyadhul Badi\'ah', kategori: 'Fiqih', target_hafalan: 'Riyadhul Badi\'ah', deskripsi: 'Kitab Riyadhul Badi\'ah fi Fiqhis Syafi\'i' },
  { id: 23, nama_materi: 'Al - Kaelani', kategori: 'Nahwu & Shorof', target_hafalan: 'Kitab Kailani', deskripsi: 'Kitab Kailani (syarah Izzi ilmu shorof)' },
  { id: 24, nama_materi: 'Muhafadzoh I\'mrithi', kategori: 'Muhafadzoh (Hafalan)', target_hafalan: 'Setoran Bait Imrithi', deskripsi: 'Setoran hafalan Nadzom Imrithi' },
  { id: 25, nama_materi: 'Munadzoroh', kategori: 'Bahtsul Masail & Diskusi', target_hafalan: 'Adab Munadzarah', deskripsi: 'Praktek adab diskusi dan munadzarah ilmiah' },
  { id: 26, nama_materi: 'I\'anah Jilid 1', kategori: 'Fiqih', target_hafalan: 'I\'anatuth Tholibin 1', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 1' },
  { id: 27, nama_materi: 'I\'mrithi', kategori: 'Nahwu & Shorof', target_hafalan: 'Nadzom Al-Imrithi 254 Bait', deskripsi: 'Kitab Nadzom Al-Imrithi' },
  { id: 28, nama_materi: 'Al - Burdah', kategori: 'Sholawat & Sastra', target_hafalan: 'Qoshidah Burdah', deskripsi: 'Qoshidah Burdah Imam Al-Bushiri' },
  { id: 29, nama_materi: 'Waroqot', kategori: 'Ushul Fiqih', target_hafalan: 'Matan Al-Waraqat', deskripsi: 'Kitab Al-Waraqat Imam Al-Haramain' },
  { id: 30, nama_materi: 'Muhafadzoh Waroqot', kategori: 'Muhafadzoh (Hafalan)', target_hafalan: 'Setoran Matan Al-Waraqat', deskripsi: 'Setoran hafalan matan Al-Waraqat' },
  { id: 31, nama_materi: 'Baca Kosongan', kategori: 'Qiroatul Kitab', target_hafalan: 'Baca Kitab Kuning Gundul', deskripsi: 'Praktek membaca kitab gundul / tanpa harakat' },
  { id: 32, nama_materi: 'I\'anah Jilid 2', kategori: 'Fiqih', target_hafalan: 'I\'anatuth Tholibin 2', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 2' },
  { id: 33, nama_materi: 'Lathoif', kategori: 'Ushul Fiqih', target_hafalan: 'Lathaiful Isyarat', deskripsi: 'Kitab Lathaiful Isyarat / Al-Asybah' },
  { id: 34, nama_materi: 'Mutammimah', kategori: 'Nahwu & Shorof', target_hafalan: 'Mutammimah Al-Ajurumiyyah', deskripsi: 'Kitab Mutammimah Al-Ajurumiyyah' },
  { id: 35, nama_materi: 'Bidayatul Hidayah', kategori: 'Tasawwuf & Adab', target_hafalan: 'Bidayatul Hidayah', deskripsi: 'Kitab Bidayatul Hidayah Hujjatul Islam Al-Ghazali' },
  { id: 36, nama_materi: 'Tafsir', kategori: 'Tafsir & Ulumul Quran', target_hafalan: 'Tafsir Quran', deskripsi: 'Kajian Tafsir Jalalain / Al-Ibriz' },
  { id: 37, nama_materi: 'Muhafadzoh Alfiyah', kategori: 'Muhafadzoh (Hafalan)', target_hafalan: 'Setoran Bait Alfiyah Ibnu Malik', deskripsi: 'Setoran hafalan bait Nadzom Alfiyah Ibnu Malik' },
  { id: 38, nama_materi: 'Khataman Qur`an', kategori: 'Tajwid & Al-Qur\'an', target_hafalan: 'Wisuda Khataman Al-Qur\'an', deskripsi: 'Kegiatan khataman dan wisuda Al-Qur\'an' },
  { id: 39, nama_materi: 'I\'anah Jilid 3', kategori: 'Fiqih', target_hafalan: 'I\'anatuth Tholibin 3', deskripsi: 'Hasyiyah I\'anatuth Tholibin Jilid 3' }
];

// GET /api/materi-hafalan
export const getMateriHafalan = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query('SELECT * FROM materi_hafalan ORDER BY id ASC');
      if (!rows || rows.length === 0) {
        rows = DEFAULT_PRESETS;
      }
    } catch (dbErr) {
      rows = DEFAULT_PRESETS;
    }
    return sendSuccess(res, 'Daftar materi hafalan berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// POST /api/materi-hafalan
export const createMateriHafalan = async (req, res) => {
  try {
    const { nama_materi, kategori, target_hafalan, deskripsi } = req.body;
    if (!nama_materi || !nama_materi.trim()) {
      return sendError(res, 'Nama materi hafalan / kitab wajib diisi', 400);
    }

    const cleanNama = nama_materi.trim();
    const cleanKat = (kategori && kategori.trim()) || 'Kitab Kuning';
    const cleanTarget = target_hafalan ? target_hafalan.trim() : null;
    const cleanDesk = deskripsi ? deskripsi.trim() : null;

    const [result] = await pool.query(
      'INSERT INTO materi_hafalan (nama_materi, kategori, target_hafalan, deskripsi) VALUES (?, ?, ?, ?)',
      [cleanNama, cleanKat, cleanTarget, cleanDesk]
    );

    return sendSuccess(res, 'Materi hafalan baru berhasil ditambahkan ke database', {
      id: result.insertId,
      nama_materi: cleanNama,
      kategori: cleanKat,
      target_hafalan: cleanTarget,
      deskripsi: cleanDesk
    }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Materi hafalan dengan nama tersebut sudah ada di database', 400);
    }
    return sendError(res, err.message, 500);
  }
};

// PUT /api/materi-hafalan/:id
export const updateMateriHafalan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_materi, kategori, target_hafalan, deskripsi } = req.body;

    if (!nama_materi || !nama_materi.trim()) {
      return sendError(res, 'Nama materi hafalan / kitab wajib diisi', 400);
    }

    const cleanNama = nama_materi.trim();
    const cleanKat = (kategori && kategori.trim()) || 'Kitab Kuning';
    const cleanTarget = target_hafalan ? target_hafalan.trim() : null;
    const cleanDesk = deskripsi ? deskripsi.trim() : null;

    await pool.query(
      'UPDATE materi_hafalan SET nama_materi = ?, kategori = ?, target_hafalan = ?, deskripsi = ? WHERE id = ?',
      [cleanNama, cleanKat, cleanTarget, cleanDesk, id]
    );

    return sendSuccess(res, 'Data materi hafalan berhasil diperbarui', {
      id: Number(id),
      nama_materi: cleanNama,
      kategori: cleanKat,
      target_hafalan: cleanTarget,
      deskripsi: cleanDesk
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Materi hafalan dengan nama tersebut sudah ada di database', 400);
    }
    return sendError(res, err.message, 500);
  }
};

// DELETE /api/materi-hafalan/:id
export const deleteMateriHafalan = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM materi_hafalan WHERE id = ?', [id]);
    return sendSuccess(res, 'Materi hafalan berhasil dihapus dari database');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
