import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ==========================================
// 1. KELOLA KATEGORI PRAKTEK (CUSTOM MASTER)
// ==========================================
export const getKategoriPraktek = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query('SELECT * FROM kategori_praktek ORDER BY id ASC');
    } catch (e) {
      rows = [
        { id: 1, nama_kategori: 'Sholat Fardhu', deskripsi: 'Praktek kaifiyah dan bacaan sholat lima waktu' },
        { id: 2, nama_kategori: 'Wudhu & Tayammum', deskripsi: 'Tata cara bersuci wudhu dan tayammum sunnah' },
        { id: 3, nama_kategori: 'Sholat Jenazah', deskripsi: 'Praktek tata cara sholat jenazah 4 takbir' },
        { id: 4, nama_kategori: 'Adzan & Iqomah', deskripsi: 'Keterampilan adzan, tarhim dan iqomah' },
        { id: 5, nama_kategori: 'Dzikir & Doa', deskripsi: 'Wirid ba\'da sholat fardhu dan doa harian' },
        { id: 6, nama_kategori: 'Mandi Wajib', deskripsi: 'Rukun dan niat thaharah mandi junub' },
        { id: 7, nama_kategori: 'Khutbah & Ceramah', deskripsi: 'Kultum, ceramah dan rukun khutbah Jum\'at' }
      ];
    }
    return sendSuccess(res, 'Daftar kategori praktek berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createKategoriPraktek = async (req, res) => {
  try {
    const { nama_kategori, deskripsi } = req.body;
    if (!nama_kategori || !nama_kategori.trim()) {
      return sendError(res, 'Nama kategori praktek wajib diisi', 400);
    }

    const [result] = await pool.query(
      'INSERT INTO kategori_praktek (nama_kategori, deskripsi) VALUES (?, ?)',
      [nama_kategori.trim(), deskripsi ? deskripsi.trim() : null]
    );

    return sendSuccess(res, 'Kategori praktek baru berhasil ditambahkan', {
      id: result.insertId,
      nama_kategori: nama_kategori.trim(),
      deskripsi: deskripsi ? deskripsi.trim() : null
    }, 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Kategori praktek dengan nama ini sudah ada', 400);
    }
    return sendError(res, err.message, 500);
  }
};

export const deleteKategoriPraktek = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kategori_praktek WHERE id = ?', [id]);
    return sendSuccess(res, 'Kategori praktek berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// ==========================================
// 2. PENILAIAN PRAKTEK IBADAH (LULUS / MENGULANG & DESKRIPSI)
// ==========================================
export const getPraktek = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query(`
        SELECT 
          p.*,
          s.nama_santri,
          s.nis,
          s.jk,
          a.nama_asrama,
          k.nama_kamar
        FROM praktek_ibadah p
        LEFT JOIN santri s ON p.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        ORDER BY p.tanggal_ujian DESC, p.id DESC
      `);
    } catch (dbErr) {
      [rows] = await pool.query('SELECT * FROM praktek_ibadah ORDER BY id DESC');
    }

    // Normalisasi status Remedial menjadi Mengulang jika ada data lama
    const normalized = (rows || []).map(r => ({
      ...r,
      status: (r.status === 'Remedial' || r.status === 'Mengulang') ? 'Mengulang' : 'Lulus'
    }));

    return sendSuccess(res, 'Data praktek ibadah berhasil diambil', { data: normalized });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getPraktekById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        s.nama_santri,
        s.nis,
        s.jk,
        a.nama_asrama,
        k.nama_kamar
      FROM praktek_ibadah p
      LEFT JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (!rows || rows.length === 0) {
      return sendError(res, 'Data penilaian praktek tidak ditemukan', 404);
    }

    const item = {
      ...rows[0],
      status: (rows[0].status === 'Remedial' || rows[0].status === 'Mengulang') ? 'Mengulang' : 'Lulus'
    };

    return sendSuccess(res, 'Detail penilaian praktek ditemukan', { data: item });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createPraktek = async (req, res) => {
  try {
    const {
      santri_id,
      kategori,
      nama_praktek,
      deskripsi,
      status,
      nama_penguji,
      catatan_perbaikan,
      tanggal_ujian
    } = req.body;

    if (!santri_id || !nama_praktek) {
      return sendError(res, 'Santri dan Nama Praktek wajib diisi', 400);
    }

    // Status disederhanakan: 'Lulus' atau 'Mengulang'
    const finalStatus = (status === 'Mengulang' || status === 'Remedial') ? 'Mengulang' : 'Lulus';
    const nAkhir = finalStatus === 'Lulus' ? 85 : 55;
    const predikat = finalStatus === 'Lulus' ? 'Lulus' : 'Mengulang';
    const tgl = tanggal_ujian || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO praktek_ibadah (
        santri_id,
        kategori,
        nama_praktek,
        deskripsi,
        nilai_gerakan,
        nilai_bacaan,
        nilai_adab,
        nilai_akhir,
        predikat,
        status,
        nama_penguji,
        catatan_perbaikan,
        tanggal_ujian
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      kategori || 'Sholat Fardhu',
      nama_praktek,
      deskripsi || catatan_perbaikan || '',
      nAkhir,
      nAkhir,
      nAkhir,
      nAkhir,
      predikat,
      finalStatus,
      nama_penguji || 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan || deskripsi || '',
      tgl
    ]);

    return sendSuccess(res, 'Penilaian praktek berhasil disimpan', { 
      id: result.insertId, 
      status: finalStatus, 
      deskripsi: deskripsi || '' 
    }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updatePraktek = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      santri_id,
      kategori,
      nama_praktek,
      deskripsi,
      status,
      nama_penguji,
      catatan_perbaikan,
      tanggal_ujian
    } = req.body;

    const finalStatus = (status === 'Mengulang' || status === 'Remedial') ? 'Mengulang' : 'Lulus';
    const nAkhir = finalStatus === 'Lulus' ? 85 : 55;
    const predikat = finalStatus === 'Lulus' ? 'Lulus' : 'Mengulang';

    await pool.query(`
      UPDATE praktek_ibadah SET
        santri_id = COALESCE(?, santri_id),
        kategori = ?,
        nama_praktek = ?,
        deskripsi = ?,
        nilai_gerakan = ?,
        nilai_bacaan = ?,
        nilai_adab = ?,
        nilai_akhir = ?,
        predikat = ?,
        status = ?,
        nama_penguji = ?,
        catatan_perbaikan = ?,
        tanggal_ujian = ?
      WHERE id = ?
    `, [
      santri_id,
      kategori || 'Sholat Fardhu',
      nama_praktek,
      deskripsi || catatan_perbaikan || '',
      nAkhir,
      nAkhir,
      nAkhir,
      nAkhir,
      predikat,
      finalStatus,
      nama_penguji || 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan || deskripsi || '',
      tanggal_ujian || new Date().toISOString().split('T')[0],
      id
    ]);

    return sendSuccess(res, 'Penilaian praktek berhasil diperbarui', { 
      status: finalStatus,
      deskripsi: deskripsi || ''
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deletePraktek = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM praktek_ibadah WHERE id = ?', [id]);
    return sendSuccess(res, 'Data penilaian praktek berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
