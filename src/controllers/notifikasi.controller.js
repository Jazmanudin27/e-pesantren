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
 * Helper menyusun kalimat notifikasi presensi yang sopan, etis, dan profesional
 * berdasarkan status kehadiran (Hadir, Terlambat, Sakit, Izin, Alfa).
 * Tanpa menyertakan istilah teknis seperti "(Manual Musyrif)" atau "(Wajah AI)".
 */
export const buildAbsensiNotifText = ({
  namaSantri = 'Ananda',
  kegiatan = 'Kegiatan Pesantren',
  status = 'Hadir',
  waktu = ''
}) => {
  const st = String(status || 'Hadir').trim();
  const stLower = st.toLowerCase();
  const jamStr = waktu ? ` pukul ${String(waktu).slice(0, 5)} WIB` : '';
  const sapaan = namaSantri && namaSantri !== 'Ananda' ? `ananda ${namaSantri}` : 'ananda';

  if (stLower.includes('sakit')) {
    return {
      judul: `Informasi Kesehatan • ${kegiatan}`,
      pesan: `Diberitahukan bahwa ${sapaan} hari ini berhalangan mengikuti ${kegiatan} dikarenakan sedang kurang sehat (Sakit). Mohon doa dari Bapak/Ibu agar ananda lekas diberikan kesembuhan.`
    };
  }

  if (stLower.includes('izin')) {
    return {
      judul: `Keterangan Izin • ${kegiatan}`,
      pesan: `Diberitahukan bahwa ${sapaan} tercatat Izin pada kegiatan ${kegiatan}${jamStr} sesuai keterangan yang terdaftar di kepengurusan pondok.`
    };
  }

  if (stLower.includes('alfa') || stLower.includes('alpa') || stLower.includes('tanpa')) {
    return {
      judul: `Pemberitahuan Kehadiran • ${kegiatan}`,
      pesan: `Diberitahukan bahwa ${sapaan} tercatat belum hadir (Alfa) pada kegiatan ${kegiatan}${jamStr}. Pengurus asrama sedang melakukan pemantauan dan pembinaan.`
    };
  }

  if (stLower.includes('terlambat') || stLower.includes('telat')) {
    return {
      judul: `Kehadiran ${kegiatan} • Terlambat`,
      pesan: `Diberitahukan bahwa ${sapaan} telah hadir mengikuti kegiatan ${kegiatan}${jamStr} dengan catatan sedikit terlambat dari jadwal.`
    };
  }

  // Default: Hadir / Hadir Tepat Waktu
  return {
    judul: `Kehadiran ${kegiatan} • Hadir`,
    pesan: `Alhamdulillah, ${sapaan} telah tercatat hadir mengikuti kegiatan ${kegiatan}${jamStr} dengan tertib.`
  };
};

/**
 * Helper Fire-and-Forget: Mencatat notifikasi untuk santri (atau broadcast jika santri_id = null)
 * Jika dalam 15 menit terakhir sudah ada notifikasi dengan santri & kategori yang sama (misal ralat klik Sakit -> Izin),
 * maka otomatis meng-update notifikasi tersebut agar rapi dan memicu banner ulang.
 */
export const createWaliNotification = async ({
  santri_id = null,
  kategori = 'info',
  judul = 'Pemberitahuan Pesantren',
  pesan = '',
  target_tab = 'beranda',
  replaceRecentSameCategory = false
}) => {
  try {
    await ensureNotifikasiTable();

    if (replaceRecentSameCategory && santri_id) {
      // Hapus notif sebelumnya di kategori yang sama yang baru dibuat < 10 menit lalu (saat musyrif salah klik status)
      await pool.query(
        `DELETE FROM notifikasi_wali 
         WHERE santri_id = ? AND kategori = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         ORDER BY id DESC LIMIT 1`,
        [santri_id, kategori]
      ).catch(() => {});
    }

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

