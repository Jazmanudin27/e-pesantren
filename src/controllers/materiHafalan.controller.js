import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// Default presets fallback saat offline / database belum terhubung
const DEFAULT_PRESETS = [
  { id: 1, nama_materi: "Al-Qur'an 30 Juz", kategori: "Al-Qur'an", target_hafalan: '30 Juz (114 Surat)', deskripsi: "Hafalan ayat-ayat suci Al-Qur'an Al-Karim" },
  { id: 2, nama_materi: "Juz 'Amma (Juz 30)", kategori: "Al-Qur'an", target_hafalan: '37 Surat Pendek', deskripsi: 'Hafalan surat-surat juz ke-30 an-Naba s/d an-Naas' },
  { id: 3, nama_materi: 'Nadzom Al-Jurumiyah', kategori: 'Nahwu & Shorof', target_hafalan: '60 Bait', deskripsi: 'Kaidah dasar ilmu nahwu tata bahasa Arab' },
  { id: 4, nama_materi: 'Nadzom Al-Imrithi', kategori: 'Nahwu & Shorof', target_hafalan: '254 Bait', deskripsi: "Sya'ir pendalaman kaidah nahwu tingkat menengah" },
  { id: 5, nama_materi: 'Nadzom Alfiyah Ibnu Malik', kategori: 'Nahwu & Shorof', target_hafalan: '1002 Bait', deskripsi: 'Master gramatika bahasa Arab dan nahwu shorof' },
  { id: 6, nama_materi: 'Matan Taqrib (Ghayah wat Taqrib)', kategori: "Fiqih Syafi'i", target_hafalan: 'Seluruh Bab Fiqih', deskripsi: "Matan fiqih pokok madzhab Imam Asy-Syafi'i" },
  { id: 7, nama_materi: "Hadits Al-Arba'in An-Nawawiyah", kategori: 'Hadits Nabawi', target_hafalan: '42 Hadits Pokok', deskripsi: 'Kumpulan hadits pokok ajaran Islam pilihan Imam Nawawi' },
  { id: 8, nama_materi: 'Aqidatul Awam', kategori: 'Aqidah & Tauhid', target_hafalan: '57 Bait', deskripsi: 'Hafalan pokok-pokok aqidah tauhid ahlussunnah wal jama\'ah' },
  { id: 9, nama_materi: 'Hidayatus Shibyan', kategori: 'Tajwid', target_hafalan: '40 Bait', deskripsi: "Nadzom kaidah ilmu tajwid bacaan Al-Qur'an" },
  { id: 10, nama_materi: 'Taisirul Khalaq', kategori: 'Akhlak & Adab', target_hafalan: 'Seluruh Fasal', deskripsi: 'Kitab akhlak budi pekerti dan adab santri mukim' }
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
