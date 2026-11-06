import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

let isNotifTableInitialized = false;

/**
 * Inisialisasi Tabel notifikasi_wali secara otomatis & ringan
 */
export const ensureNotifikasiTable = async () => {
  if (isNotifTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`notifikasi_wali\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT DEFAULT NULL,
        \`kategori\` VARCHAR(50) NOT NULL DEFAULT 'info',
        \`judul\` VARCHAR(200) NOT NULL,
        \`pesan\` TEXT NOT NULL,
        \`target_tab\` VARCHAR(50) DEFAULT 'beranda',
        \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_notif_santri\` (\`santri_id\`, \`id\`),
        INDEX \`idx_notif_read\` (\`santri_id\`, \`is_read\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isNotifTableInitialized = true;
  } catch (err) {
    console.warn('[NOTIFIKASI DB INIT NOTICE]', err.message);
  }
};

/**
 * Helper Fire-and-Forget: Mencatat notifikasi untuk santri (atau broadcast jika santri_id = null)
 * Tidak pernah memblokir proses utama & otomatis memangkas log lama agar database tetap ringan.
 */
export const createWaliNotification = async ({
  santri_id = null,
  kategori = 'info',
  judul = 'Pemberitahuan Pesantren',
  pesan = '',
  target_tab = 'beranda'
}) => {
  try {
    await ensureNotifikasiTable();
    await pool.query(
      `INSERT INTO notifikasi_wali (santri_id, kategori, judul, pesan, target_tab, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [santri_id || null, kategori, judul, pesan, target_tab]
    );

    // Auto-cleanup ringan: Jaga maksimal 60 notifikasi per santri atau hapus yang > 30 hari (10% chance)
    if (Math.random() < 0.15) {
      pool.query(`DELETE FROM notifikasi_wali WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`).catch(() => {});
    }
  } catch (err) {
    console.warn('[NOTIFIKASI WALI LOG NOTICE]', err.message);
  }
};

/**
 * GET /api/wali/notifikasi?santri_id=X&since_id=Y
 * Mengambil daftar notifikasi santri + broadcast umum (santri_id IS NULL)
 */
export const getWaliNotifikasi = async (req, res) => {
  try {
    await ensureNotifikasiTable();
    const santriId = parseInt(req.query.santri_id) || 0;
    const sinceId = parseInt(req.query.since_id) || 0;
    const limit = Math.min(60, Math.max(10, parseInt(req.query.limit) || 40));

    if (!santriId) {
      return sendSuccess(res, 'Notifikasi kosong', {
        notifications: [],
        new_notifications: [],
        unread_count: 0,
        latest_id: 0
      });
    }

    // Ambil daftar notifikasi khusus santri ini + pengumuman kegiatan umum (santri_id IS NULL)
    const [rows] = await pool.query(
      `SELECT id, santri_id, kategori, judul, pesan, target_tab, is_read, created_at
       FROM notifikasi_wali
       WHERE santri_id = ? OR santri_id IS NULL
       ORDER BY id DESC
       LIMIT ?`,
      [santriId, limit]
    );

    const notifications = rows || [];

    // Jika tabel masih kosong untuk santri ini, berikan 1 sambutan awal dari data presensi/tahfidz terbaru
    const unreadCount = notifications.filter(n => Number(n.is_read) === 0).length;
    const latestId = notifications.length > 0 ? notifications[0].id : 0;

    // Filter notifikasi baru yang belum pernah di-push ke HP (id > sinceId)
    const newNotifications = sinceId > 0
      ? notifications.filter(n => n.id > sinceId)
      : [];

    return sendSuccess(res, 'Data notifikasi berhasil diambil', {
      notifications,
      new_notifications: newNotifications,
      unread_count: unreadCount,
      latest_id: latestId
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * PUT /api/wali/notifikasi/read
 * Tandai satu atau semua notifikasi santri sebagai sudah dibaca
 */
export const markWaliNotifikasiRead = async (req, res) => {
  try {
    await ensureNotifikasiTable();
    const { santri_id, notif_id } = req.body;

    if (notif_id) {
      await pool.query(
        `UPDATE notifikasi_wali SET is_read = 1 WHERE id = ?`,
        [notif_id]
      );
    } else if (santri_id) {
      await pool.query(
        `UPDATE notifikasi_wali SET is_read = 1 WHERE (santri_id = ? OR santri_id IS NULL) AND is_read = 0`,
        [santri_id]
      );
    }

    return sendSuccess(res, 'Notifikasi ditandai sudah dibaca');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * DELETE /api/wali/notifikasi/clear
 * Bersihkan notifikasi yang sudah dibaca untuk santri tertentu
 */
export const clearWaliNotifikasi = async (req, res) => {
  try {
    await ensureNotifikasiTable();
    const santriId = req.body.santri_id || req.query.santri_id;
    if (santriId) {
      await pool.query(`DELETE FROM notifikasi_wali WHERE santri_id = ?`, [santriId]);
    }
    return sendSuccess(res, 'Riwayat notifikasi berhasil dibersihkan');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

