import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createWaliNotification } from './notifikasi.controller.js';

/**
 * Mengambil Daftar Linimasa / Feed Informasi & Dokumentasi Kegiatan Pesantren
 */
export const getFeedInformasi = async (req, res) => {
  try {
    const { kategori, search, limit } = req.query;

    let sql = `
      SELECT * FROM pesantren_informasi_kegiatan 
      WHERE 1=1
    `;
    const params = [];

    if (kategori && kategori !== 'Semua') {
      sql += ' AND kategori = ?';
      params.push(kategori);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (judul LIKE ? OR konten LIKE ? OR ringkasan LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY is_pinned DESC, tanggal_publikasi DESC, id DESC';
    sql += ` LIMIT ${parseInt(limit) || 30}`;

    const [rows] = await pool.query(sql, params);

    // Ambil daftar kategori unik untuk filter tab
    const [kategoriRows] = await pool.query(`
      SELECT DISTINCT kategori FROM pesantren_informasi_kegiatan ORDER BY kategori ASC
    `);

    return sendSuccess(res, 'Feed informasi pesantren berhasil diambil', {
      feed: rows || [],
      kategoriList: ['Semua', ...(kategoriRows || []).map(k => k.kategori)]
    });
  } catch (err) {
    return sendError(res, `Gagal memuat informasi: ${err.message}`, 500);
  }
};

/**
 * Admin: Terbitkan Berita / Pengumuman Baru
 */
export const createInformasi = async (req, res) => {
  try {
    const { judul, kategori, ringkasan, konten, foto_url, video_url, penulis, tanggal_publikasi, is_pinned } = req.body;

    if (!judul || !konten) {
      return sendError(res, 'Judul dan Isi Konten Informasi wajib diisi', 400);
    }

    const tgl = tanggal_publikasi || new Date().toISOString().slice(0, 10);
    const author = penulis || 'Humas Pondok Pesantren';

    const [result] = await pool.query(`
      INSERT INTO pesantren_informasi_kegiatan 
      (judul, kategori, ringkasan, konten, foto_url, video_url, penulis, tanggal_publikasi, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [judul, kategori || 'Kegiatan Santri', ringkasan || null, konten, foto_url || null, video_url || null, author, tgl, is_pinned ? 1 : 0]);

    createWaliNotification({
      santri_id: null, // Broadcast ke semua wali santri
      kategori: 'kegiatan',
      judul: `Info Kegiatan: ${judul}`,
      pesan: ringkasan || String(konten || '').slice(0, 140),
      target_tab: 'informasi'
    });

    return sendSuccess(res, 'Informasi kegiatan berhasil diterbitkan ke linimasa', { id: result.insertId });
  } catch (err) {
    return sendError(res, `Gagal membuat informasi: ${err.message}`, 500);
  }
};

/**
 * Admin: Hapus Informasi
 */
export const deleteInformasi = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pesantren_informasi_kegiatan WHERE id = ?', [id]);
    return sendSuccess(res, 'Informasi berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

