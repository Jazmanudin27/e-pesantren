import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createWaliNotification } from './notifikasi.controller.js';

let isPesanTableReady = false;

/**
 * Inisialisasi Tabel Pesan / Komunikasi Dua Arah (Wali Santri <-> Admin Pesantren)
 */
export const ensurePesanTable = async () => {
  if (isPesanTableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pesantren_pesan_komunikasi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        santri_id INT NOT NULL,
        nama_santri VARCHAR(150) DEFAULT NULL,
        nama_wali VARCHAR(150) DEFAULT NULL,
        topik VARCHAR(100) DEFAULT 'Pertanyaan Umum',
        pengirim_role ENUM('wali', 'admin') NOT NULL DEFAULT 'wali',
        pengirim_nama VARCHAR(150) NOT NULL,
        isi_pesan TEXT NOT NULL,
        is_read_wali TINYINT(1) DEFAULT 0,
        is_read_admin TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pesan_santri (santri_id, id),
        INDEX idx_pesan_unread_admin (is_read_admin, pengirim_role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isPesanTableReady = true;
  } catch (err) {
    console.warn('[PESAN DB INIT NOTICE]', err.message);
  }
};

/**
 * GET /api/pesan/wali/:santri_id
 * Mengambil seluruh percakapan antara Wali Santri tersebut dengan Admin Pesantren
 * serta menandai pesan dari Admin sebagai sudah dibaca oleh Wali.
 */
export const getPesanWali = async (req, res) => {
  try {
    await ensurePesanTable();
    const { santri_id } = req.params;
    if (!santri_id) {
      return sendError(res, 'santri_id wajib disertakan', 400);
    }

    // Tandai pesan balasan dari admin untuk santri ini sebagai sudah dibaca oleh wali
    await pool.query(
      `UPDATE pesantren_pesan_komunikasi 
       SET is_read_wali = 1 
       WHERE santri_id = ? AND pengirim_role = 'admin' AND is_read_wali = 0`,
      [santri_id]
    ).catch(() => {});

    const [rows] = await pool.query(
      `SELECT * FROM pesantren_pesan_komunikasi 
       WHERE santri_id = ? 
       ORDER BY id ASC LIMIT 250`,
      [santri_id]
    );

    return sendSuccess(res, 'Riwayat pesan komunikasi berhasil diambil', {
      messages: rows || []
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/pesan/wali
 * Wali Santri mengirim pesan / pertanyaan ke Admin Pesantren
 */
export const sendPesanFromWali = async (req, res) => {
  try {
    await ensurePesanTable();
    const { santri_id, nama_santri, nama_wali, topik, isi_pesan } = req.body;

    if (!santri_id || !isi_pesan || !String(isi_pesan).trim()) {
      return sendError(res, 'Isi pesan wajib diisi', 400);
    }

    let cleanSantri = nama_santri || '';
    let cleanWali = nama_wali || '';

    if (!cleanSantri || !cleanWali) {
      const [sRows] = await pool.query(
        `SELECT nama_santri, nama_wali FROM santri WHERE id = ? LIMIT 1`,
        [santri_id]
      ).catch(() => [[]]);
      if (sRows && sRows[0]) {
        cleanSantri = cleanSantri || sRows[0].nama_santri || 'Santri';
        cleanWali = cleanWali || sRows[0].nama_wali || `Wali ${cleanSantri}`;
      }
    }

    const finalWaliName = cleanWali || `Orang Tua ${cleanSantri || 'Santri'}`;
    const finalTopik = topik || 'Pertanyaan Umum';

    const [result] = await pool.query(
      `INSERT INTO pesantren_pesan_komunikasi
       (santri_id, nama_santri, nama_wali, topik, pengirim_role, pengirim_nama, isi_pesan, is_read_wali, is_read_admin, created_at)
       VALUES (?, ?, ?, ?, 'wali', ?, ?, 1, 0, NOW())`,
      [
        santri_id,
        cleanSantri || 'Santri',
        finalWaliName,
        finalTopik,
        finalWaliName,
        String(isi_pesan).trim()
      ]
    );

    return sendSuccess(res, 'Pesan berhasil dikirim ke Admin Pesantren', {
      id: result.insertId
    }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/pesan/admin/threads
 * Daftar seluruh percakapan Wali Santri untuk Admin Pesantren
 */
export const getAdminPesanThreads = async (req, res) => {
  try {
    await ensurePesanTable();

    const [threads] = await pool.query(`
      SELECT 
        p.santri_id,
        COALESCE(s.nama_santri, MAX(p.nama_santri), 'Santri') AS nama_santri,
        COALESCE(s.nis, '-') AS nis,
        COALESCE(s.nama_wali, MAX(p.nama_wali), 'Wali Santri') AS nama_wali,
        COALESCE(a.nama_asrama, '-') AS nama_asrama,
        MAX(p.id) AS last_message_id,
        MAX(p.created_at) AS last_time,
        SUM(CASE WHEN p.pengirim_role = 'wali' AND p.is_read_admin = 0 THEN 1 ELSE 0 END) AS unread_count,
        (SELECT p2.isi_pesan FROM pesantren_pesan_komunikasi p2 WHERE p2.id = MAX(p.id) LIMIT 1) AS last_message,
        (SELECT p2.topik FROM pesantren_pesan_komunikasi p2 WHERE p2.id = MAX(p.id) LIMIT 1) AS last_topik,
        (SELECT p2.pengirim_role FROM pesantren_pesan_komunikasi p2 WHERE p2.id = MAX(p.id) LIMIT 1) AS last_sender_role
      FROM pesantren_pesan_komunikasi p
      LEFT JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      GROUP BY p.santri_id, s.nama_santri, s.nis, s.nama_wali, a.nama_asrama
      ORDER BY unread_count DESC, last_message_id DESC
    `);

    return sendSuccess(res, 'Daftar percakapan wali santri berhasil diambil', {
      threads: threads || []
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/pesan/admin/messages/:santri_id
 * Admin membuka isi percakapan dengan Wali Santri tertentu & menandai sudah dibaca oleh Admin
 */
export const getAdminPesanDetail = async (req, res) => {
  try {
    await ensurePesanTable();
    const { santri_id } = req.params;

    await pool.query(
      `UPDATE pesantren_pesan_komunikasi 
       SET is_read_admin = 1 
       WHERE santri_id = ? AND pengirim_role = 'wali' AND is_read_admin = 0`,
      [santri_id]
    ).catch(() => {});

    const [messages] = await pool.query(
      `SELECT * FROM pesantren_pesan_komunikasi 
       WHERE santri_id = ? 
       ORDER BY id ASC LIMIT 250`,
      [santri_id]
    );

    return sendSuccess(res, 'Detail percakapan berhasil diambil', {
      messages: messages || []
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/pesan/admin/reply
 * Admin membalas pesan Wali Santri + Kirim Notifikasi Real-time ke HP Orang Tua
 */
export const sendReplyFromAdmin = async (req, res) => {
  try {
    await ensurePesanTable();
    const { santri_id, isi_pesan, topik, admin_nama } = req.body;

    if (!santri_id || !isi_pesan || !String(isi_pesan).trim()) {
      return sendError(res, 'santri_id dan isi balasan wajib diisi', 400);
    }

    const [sRows] = await pool.query(
      `SELECT nama_santri, nama_wali FROM santri WHERE id = ? LIMIT 1`,
      [santri_id]
    ).catch(() => [[]]);

    const namaSantri = sRows?.[0]?.nama_santri || 'Santri';
    const namaWali = sRows?.[0]?.nama_wali || `Wali ${namaSantri}`;
    const senderAdmin = admin_nama || 'Admin Pondok Pesantren';
    const cleanPesan = String(isi_pesan).trim();

    const [result] = await pool.query(
      `INSERT INTO pesantren_pesan_komunikasi
       (santri_id, nama_santri, nama_wali, topik, pengirim_role, pengirim_nama, isi_pesan, is_read_wali, is_read_admin, created_at)
       VALUES (?, ?, ?, ?, 'admin', ?, ?, 0, 1, NOW())`,
      [
        santri_id,
        namaSantri,
        namaWali,
        topik || 'Balasan Admin',
        senderAdmin,
        cleanPesan
      ]
    );

    // Tandai semua pesan wali di thread ini sudah dibaca admin
    await pool.query(
      `UPDATE pesantren_pesan_komunikasi SET is_read_admin = 1 WHERE santri_id = ? AND pengirim_role = 'wali'`,
      [santri_id]
    ).catch(() => {});

    // Kirim Notifikasi Real-Time ke HP Orang Tua
    createWaliNotification({
      santri_id,
      kategori: 'pesan',
      judul: `💬 Balasan Pesan dari ${senderAdmin}`,
      pesan: cleanPesan.slice(0, 160),
      target_tab: 'pesan'
    });

    return sendSuccess(res, 'Balasan berhasil dikirim ke Orang Tua Santri', {
      id: result.insertId
    }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

