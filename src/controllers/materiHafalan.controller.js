import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// GET /api/materi-hafalan
export const getMateriHafalan = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materi_hafalan ORDER BY id ASC');
    return sendSuccess(res, 'Daftar materi hafalan berhasil diambil', { data: rows || [] });
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
