import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

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
      // Fallback query if table structure is simple
      [rows] = await pool.query('SELECT * FROM praktek_ibadah ORDER BY id DESC');
    }

    return sendSuccess(res, 'Data praktek ibadah berhasil diambil', { data: rows });
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

    return sendSuccess(res, 'Detail penilaian praktek ditemukan', { data: rows[0] });
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
      nilai_gerakan,
      nilai_bacaan,
      nilai_adab,
      nama_penguji,
      catatan_perbaikan,
      tanggal_ujian
    } = req.body;

    if (!santri_id || !nama_praktek) {
      return sendError(res, 'Santri dan Nama Praktek wajib diisi', 400);
    }

    const nGerakan = Number(nilai_gerakan) || 80;
    const nBacaan = Number(nilai_bacaan) || 80;
    const nAdab = Number(nilai_adab) || 80;
    const nAkhir = Math.round((nGerakan + nBacaan + nAdab) / 3);

    let predikat = 'Mumtaz (A)';
    let status = 'Lulus';

    if (nAkhir >= 90) {
      predikat = 'Mumtaz (A)';
    } else if (nAkhir >= 80) {
      predikat = 'Jayyid Jiddan (B+)';
    } else if (nAkhir >= 70) {
      predikat = 'Jayyid (B)';
    } else if (nAkhir >= 60) {
      predikat = 'Maqbul (C)';
    } else {
      predikat = 'Mengulang / Rasib';
      status = 'Remedial';
    }

    const tgl = tanggal_ujian || new Date().toISOString().split('T')[0];

    const [result] = await pool.query(`
      INSERT INTO praktek_ibadah (
        santri_id,
        kategori,
        nama_praktek,
        nilai_gerakan,
        nilai_bacaan,
        nilai_adab,
        nilai_akhir,
        predikat,
        status,
        nama_penguji,
        catatan_perbaikan,
        tanggal_ujian
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      kategori || 'Sholat Fardhu',
      nama_praktek,
      nGerakan,
      nBacaan,
      nAdab,
      nAkhir,
      predikat,
      status,
      nama_penguji || 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan || '-',
      tgl
    ]);

    return sendSuccess(res, 'Penilaian praktek berhasil disimpan', { id: result.insertId, nilai_akhir: nAkhir, predikat, status }, 201);
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
      nilai_gerakan,
      nilai_bacaan,
      nilai_adab,
      nama_penguji,
      catatan_perbaikan,
      tanggal_ujian
    } = req.body;

    const nGerakan = Number(nilai_gerakan) || 80;
    const nBacaan = Number(nilai_bacaan) || 80;
    const nAdab = Number(nilai_adab) || 80;
    const nAkhir = Math.round((nGerakan + nBacaan + nAdab) / 3);

    let predikat = 'Mumtaz (A)';
    let status = 'Lulus';

    if (nAkhir >= 90) {
      predikat = 'Mumtaz (A)';
    } else if (nAkhir >= 80) {
      predikat = 'Jayyid Jiddan (B+)';
    } else if (nAkhir >= 70) {
      predikat = 'Jayyid (B)';
    } else if (nAkhir >= 60) {
      predikat = 'Maqbul (C)';
    } else {
      predikat = 'Mengulang / Rasib';
      status = 'Remedial';
    }

    await pool.query(`
      UPDATE praktek_ibadah SET
        santri_id = COALESCE(?, santri_id),
        kategori = ?,
        nama_praktek = ?,
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
      nGerakan,
      nBacaan,
      nAdab,
      nAkhir,
      predikat,
      status,
      nama_penguji || 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan || '-',
      tanggal_ujian || new Date().toISOString().split('T')[0],
      id
    ]);

    return sendSuccess(res, 'Penilaian praktek berhasil diperbarui', { nilai_akhir: nAkhir, predikat, status });
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
