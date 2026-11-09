import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createWaliNotification } from './notifikasi.controller.js';

let isInformasiTableReady = false;

export const KATEGORI_PENGUMUMAN_RESMI = [
  'Pengumuman Pesantren',
  'Informasi Kegiatan',
  'Jadwal Kegiatan',
  'Liburan & Kepulangan Santri',
  'Informasi Penting Lainnya'
];

/**
 * Pastikan tabel pesantren_informasi_kegiatan beserta kolom tgl_kadaluarsa & is_popup tersedia
 */
export const ensureInformasiTable = async () => {
  if (isInformasiTableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pesantren_informasi_kegiatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        judul VARCHAR(255) NOT NULL,
        kategori VARCHAR(100) NOT NULL DEFAULT 'Pengumuman Pesantren',
        ringkasan VARCHAR(500) DEFAULT NULL,
        konten TEXT NOT NULL,
        foto_url LONGTEXT DEFAULT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        penulis VARCHAR(150) DEFAULT 'Humas Pondok Pesantren',
        tanggal_publikasi DATE NOT NULL,
        tgl_kadaluarsa DATE DEFAULT NULL,
        is_pinned TINYINT(1) DEFAULT 0,
        is_popup TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'pesantren_informasi_kegiatan' AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = (cols || []).map(c => c.COLUMN_NAME.toLowerCase());

    if (!colNames.includes('tgl_kadaluarsa')) {
      try {
        await pool.query(`ALTER TABLE pesantren_informasi_kegiatan ADD COLUMN tgl_kadaluarsa DATE DEFAULT NULL AFTER tanggal_publikasi`);
      } catch (e) {}
    }

    if (!colNames.includes('is_popup')) {
      try {
        await pool.query(`ALTER TABLE pesantren_informasi_kegiatan ADD COLUMN is_popup TINYINT(1) DEFAULT 1 AFTER is_pinned`);
      } catch (e) {}
    }

    try {
      await pool.query(`ALTER TABLE pesantren_informasi_kegiatan MODIFY COLUMN foto_url LONGTEXT DEFAULT NULL`);
    } catch (e) {}

    isInformasiTableReady = true;
  } catch (err) {
    console.warn('[INFORMASI DB INIT NOTICE]', err.message);
  }
};

/**
 * Mengambil Daftar Linimasa / Feed Informasi & Pengumuman Pesantren
 * Jika query active_only=1 dikirim (misal untuk Modal Pengumuman Orang Tua),
 * otomatis memfilter hanya pengumuman yang belum kadaluarsa (tgl_kadaluarsa IS NULL atau >= hari ini).
 */
export const getFeedInformasi = async (req, res) => {
  try {
    await ensureInformasiTable();
    const { kategori, search, limit, active_only } = req.query;

    let sql = `
      SELECT * FROM pesantren_informasi_kegiatan 
      WHERE 1=1
    `;
    const params = [];

    if (String(active_only) === '1' || String(active_only) === 'true') {
      sql += ` AND (tgl_kadaluarsa IS NULL OR DATE(tgl_kadaluarsa) >= CURDATE())`;
      sql += ` AND (is_popup IS NULL OR is_popup = 1)`;
    }

    if (kategori && kategori !== 'Semua') {
      sql += ' AND kategori = ?';
      params.push(kategori);
    }

    if (search && search.trim() !== '') {
      sql += ' AND (judul LIKE ? OR konten LIKE ? OR ringkasan LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY is_pinned DESC, tanggal_publikasi DESC, id DESC';
    sql += ` LIMIT ${parseInt(limit) || 50}`;

    const [rows] = await pool.query(sql, params);

    // Ambil daftar kategori unik + gabungkan dengan 5 kategori resmi
    const [kategoriRows] = await pool.query(`
      SELECT DISTINCT kategori FROM pesantren_informasi_kegiatan ORDER BY kategori ASC
    `).catch(() => [[]]);

    const mergedKategori = Array.from(
      new Set([
        ...KATEGORI_PENGUMUMAN_RESMI,
        ...(kategoriRows || []).map(k => k.kategori).filter(Boolean)
      ])
    );

    return sendSuccess(res, 'Feed informasi & pengumuman pesantren berhasil diambil', {
      feed: rows || [],
      kategoriList: ['Semua', ...mergedKategori]
    });
  } catch (err) {
    return sendError(res, `Gagal memuat informasi: ${err.message}`, 500);
  }
};

/**
 * Admin: Terbitkan Pengumuman / Informasi Baru + Broadcast Notifikasi ke Orang Tua
 */
export const createInformasi = async (req, res) => {
  try {
    await ensureInformasiTable();
    const {
      judul,
      kategori,
      ringkasan,
      konten,
      foto_url,
      video_url,
      penulis,
      tanggal_publikasi,
      tgl_kadaluarsa,
      is_pinned,
      is_popup
    } = req.body;

    if (!judul || !konten) {
      return sendError(res, 'Judul dan Isi Konten Pengumuman wajib diisi', 400);
    }

    const tgl = tanggal_publikasi || new Date().toISOString().slice(0, 10);
    const expDate = tgl_kadaluarsa && String(tgl_kadaluarsa).trim() !== '' ? tgl_kadaluarsa : null;
    const author = penulis || 'Humas Pondok Pesantren';
    const finalKategori = kategori || 'Pengumuman Pesantren';
    const popupFlag = is_popup === undefined ? 1 : (is_popup ? 1 : 0);

    const [result] = await pool.query(
      `INSERT INTO pesantren_informasi_kegiatan 
       (judul, kategori, ringkasan, konten, foto_url, video_url, penulis, tanggal_publikasi, tgl_kadaluarsa, is_pinned, is_popup)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        judul.trim(),
        finalKategori,
        ringkasan || null,
        konten,
        foto_url || null,
        video_url || null,
        author,
        tgl,
        expDate,
        is_pinned ? 1 : 0,
        popupFlag
      ]
    );

    // Broadcast notifikasi real-time ke seluruh Orang Tua / Wali Santri
    createWaliNotification({
      santri_id: null, // Broadcast ke semua wali santri
      kategori: 'pengumuman',
      judul: `📢 ${finalKategori}: ${judul.trim()}`,
      pesan: ringkasan || String(konten || '').replace(/\s+/g, ' ').slice(0, 160),
      target_tab: 'pengumuman'
    });

    return sendSuccess(res, 'Pengumuman berhasil diterbitkan & notifikasi telah dikirim ke Orang Tua', {
      id: result.insertId
    });
  } catch (err) {
    return sendError(res, `Gagal membuat pengumuman: ${err.message}`, 500);
  }
};

/**
 * Admin: Ubah / Edit Pengumuman
 */
export const updateInformasi = async (req, res) => {
  try {
    await ensureInformasiTable();
    const { id } = req.params;
    const {
      judul,
      kategori,
      ringkasan,
      konten,
      foto_url,
      video_url,
      penulis,
      tanggal_publikasi,
      tgl_kadaluarsa,
      is_pinned,
      is_popup,
      kirim_notif_ulang
    } = req.body;

    if (!judul || !konten) {
      return sendError(res, 'Judul dan Isi Konten Pengumuman wajib diisi', 400);
    }

    const tgl = tanggal_publikasi || new Date().toISOString().slice(0, 10);
    const expDate = tgl_kadaluarsa && String(tgl_kadaluarsa).trim() !== '' ? tgl_kadaluarsa : null;
    const author = penulis || 'Humas Pondok Pesantren';
    const finalKategori = kategori || 'Pengumuman Pesantren';
    const popupFlag = is_popup === undefined ? 1 : (is_popup ? 1 : 0);

    await pool.query(
      `UPDATE pesantren_informasi_kegiatan 
       SET judul = ?, kategori = ?, ringkasan = ?, konten = ?, foto_url = ?, video_url = ?,
           penulis = ?, tanggal_publikasi = ?, tgl_kadaluarsa = ?, is_pinned = ?, is_popup = ?
       WHERE id = ?`,
      [
        judul.trim(),
        finalKategori,
        ringkasan || null,
        konten,
        foto_url || null,
        video_url || null,
        author,
        tgl,
        expDate,
        is_pinned ? 1 : 0,
        popupFlag,
        id
      ]
    );

    if (kirim_notif_ulang) {
      createWaliNotification({
        santri_id: null,
        kategori: 'pengumuman',
        judul: `📢 [Update] ${finalKategori}: ${judul.trim()}`,
        pesan: ringkasan || String(konten || '').replace(/\s+/g, ' ').slice(0, 160),
        target_tab: 'pengumuman'
      });
    }

    return sendSuccess(res, 'Pengumuman berhasil diperbarui');
  } catch (err) {
    return sendError(res, `Gagal memperbarui pengumuman: ${err.message}`, 500);
  }
};

/**
 * Admin: Hapus Pengumuman
 */
export const deleteInformasi = async (req, res) => {
  try {
    await ensureInformasiTable();
    const { id } = req.params;
    await pool.query('DELETE FROM pesantren_informasi_kegiatan WHERE id = ?', [id]);
    return sendSuccess(res, 'Pengumuman berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
