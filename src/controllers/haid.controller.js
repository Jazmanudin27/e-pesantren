import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { ensureAbsensiTablesAndColumns } from './absensi.controller.js';

let isHaidTableChecked = false;

/**
 * Pastikan tabel santri_haid dan kolom pendukung di santri tersedia
 */
export const ensureHaidTablesAndColumns = async () => {
  if (isHaidTableChecked) return;
  try {
    // 1. Buat tabel santri_haid
    await pool.query(`
      CREATE TABLE IF NOT EXISTS santri_haid (
        id INT AUTO_INCREMENT PRIMARY KEY,
        santri_id INT NOT NULL,
        tgl_mulai DATE NOT NULL,
        waktu_mulai TIME DEFAULT NULL,
        tgl_selesai DATE DEFAULT NULL,
        waktu_selesai TIME DEFAULT NULL,
        status ENUM('aktif', 'selesai') DEFAULT 'aktif',
        keterangan VARCHAR(255) DEFAULT NULL,
        dicatat_oleh VARCHAR(100) DEFAULT NULL,
        dinonaktifkan_oleh VARCHAR(100) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_santri_status (santri_id, status),
        INDEX idx_status (status),
        INDEX idx_tgl_mulai (tgl_mulai)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Tambah kolom is_haid dan tgl_haid_mulai pada tabel santri jika belum ada
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'santri' AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = (cols || []).map(c => c.COLUMN_NAME.toLowerCase());

    if (!colNames.includes('is_haid')) {
      try {
        await pool.query(`ALTER TABLE santri ADD COLUMN is_haid TINYINT(1) DEFAULT 0 AFTER status_santri`);
      } catch (e) {}
    }
    if (!colNames.includes('tgl_haid_mulai')) {
      try {
        await pool.query(`ALTER TABLE santri ADD COLUMN tgl_haid_mulai DATE NULL AFTER is_haid`);
      } catch (e) {}
    }

    isHaidTableChecked = true;
  } catch (err) {
    console.warn('[HAID DB INIT NOTICE]', err.message);
  }
};

/**
 * Otomatis nonaktifkan status haid santriwati
 * Dipanggil saat santriwati input/scan absensi berjamaah di mesin atau aplikasi
 */
export const deactivateHaidForSantri = async (santriId, triggerSource = 'Auto Scan') => {
  try {
    await ensureHaidTablesAndColumns();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = now.toTimeString().split(' ')[0];

    // Tutup record aktif di santri_haid
    await pool.query(`
      UPDATE santri_haid
      SET status = 'selesai',
          tgl_selesai = COALESCE(tgl_selesai, ?),
          waktu_selesai = COALESCE(waktu_selesai, ?),
          dinonaktifkan_oleh = ?
      WHERE santri_id = ? AND status = 'aktif'
    `, [todayStr, timeStr, triggerSource, santriId]);

    // Update flag di tabel santri
    await pool.query(`
      UPDATE santri
      SET is_haid = 0, tgl_haid_mulai = NULL
      WHERE id = ?
    `, [santriId]);

    console.log(`[HAID] Status haid santri ID ${santriId} dinonaktifkan otomatis oleh: ${triggerSource}`);
    return true;
  } catch (err) {
    console.warn('[HAID DEACTIVATE NOTICE]', err.message);
    return false;
  }
};

/**
 * Otomatis sinkronisasi santriwati yang sedang aktif haid
 * ke tabel absensi_jamaah_mengaji untuk seluruh sesi Shalat Berjamaah hari ini.
 * Santriwati yang sedang haid otomatis berstatus 'Haid'.
 */
export const syncActiveHaidToAbsensi = async () => {
  try {
    await ensureHaidTablesAndColumns();
    await ensureAbsensiTablesAndColumns();

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Ambil semua santriwati (P) yang sedang haid aktif
    const [activeHaids] = await pool.query(`
      SELECT s.id as santri_id, s.nama_santri, s.nis, COALESCE(s.tgl_haid_mulai, sh.tgl_mulai) as tgl_mulai, sh.id as haid_id, sh.keterangan
      FROM santri s
      LEFT JOIN santri_haid sh ON s.id = sh.santri_id AND sh.status = 'aktif'
      WHERE LOWER(COALESCE(s.jk, '')) IN ('p', 'perempuan', 'putri', 'akhwat')
        AND (s.is_haid = 1 OR sh.id IS NOT NULL)
    `).catch(() => [[]]);

    if (!activeHaids || activeHaids.length === 0) return;

    // 2. Ambil sesi Shalat Berjamaah aktif
    const [sesiRows] = await pool.query(`
      SELECT id, nama_sesi, kategori, jam_target
      FROM kegiatan_sesi
      WHERE is_active = 1
        AND (
          kategori REGEXP 'shalat|sholat|berjamaah|ibadah'
          OR nama_sesi REGEXP 'shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|jumat'
        )
    `).catch(() => [[]]);

    let shalatSessions = [];
    if (sesiRows && sesiRows.length > 0) {
      shalatSessions = sesiRows.map(s => ({
        sesi_id: s.id,
        nama_kegiatan: s.nama_sesi,
        tipe_presensi: 'Berjamaah',
        waktu_scan: s.jam_target ? String(s.jam_target).substring(0, 8) : '05:00:00'
      }));
    } else {
      // Fallback sesi shalat standar jika kegiatan_sesi kosong
      shalatSessions = [
        { sesi_id: 1, nama_kegiatan: 'Shalat Subuh', tipe_presensi: 'Berjamaah', waktu_scan: '04:45:00' },
        { sesi_id: 2, nama_kegiatan: 'Shalat Dzuhur', tipe_presensi: 'Berjamaah', waktu_scan: '12:00:00' },
        { sesi_id: 3, nama_kegiatan: 'Shalat Ashar', tipe_presensi: 'Berjamaah', waktu_scan: '15:15:00' },
        { sesi_id: 4, nama_kegiatan: 'Shalat Maghrib', tipe_presensi: 'Berjamaah', waktu_scan: '18:00:00' },
        { sesi_id: 5, nama_kegiatan: 'Shalat Isya', tipe_presensi: 'Berjamaah', waktu_scan: '19:15:00' }
      ];
    }

    // 3. Ambil log absensi hari ini agar tidak overwrite log yang sudah Hadir (misal sudah suci & scan)
    const [existingToday] = await pool.query(`
      SELECT santri_id, nama_kegiatan, sesi_id, status
      FROM absensi_jamaah_mengaji
      WHERE tanggal = ?
    `, [todayStr]).catch(() => [[]]);

    const existingMap = new Map();
    (existingToday || []).forEach(r => {
      const key = `${r.santri_id}__${String(r.nama_kegiatan || '').trim().toLowerCase()}`;
      existingMap.set(key, r.status);
    });

    // 4. Periksa juga absensi_deleted_logs
    const [deletedToday] = await pool.query(`
      SELECT santri_id, nama_kegiatan
      FROM absensi_deleted_logs
      WHERE tanggal = ?
    `, [todayStr]).catch(() => [[]]);

    const deletedSet = new Set(
      (deletedToday || []).map(r => `${r.santri_id}__${String(r.nama_kegiatan || '').trim().toLowerCase()}`)
    );

    // 5. Masukkan absensi Haid untuk setiap sesi Shalat Berjamaah
    for (const h of activeHaids) {
      for (const sess of shalatSessions) {
        const key = `${h.santri_id}__${sess.nama_kegiatan.trim().toLowerCase()}`;
        if (deletedSet.has(key)) continue;

        const currentStatus = existingMap.get(key);
        // Jika sudah ada status Hadir/Sakit/Izin (bukan Haid dan bukan kosong), jangan ganggu
        if (currentStatus && !currentStatus.toLowerCase().includes('haid')) continue;

        if (!currentStatus) {
          await pool.query(`
            INSERT INTO absensi_jamaah_mengaji (
              santri_id, sesi_id, tanggal, waktu_scan, status, metode_presensi, nama_kegiatan, tipe_presensi, keterangan, musyrif_verifikator, nama_ustadz
            ) VALUES (?, ?, ?, ?, 'Haid', 'Sistem Haid', ?, 'Berjamaah', 'Sedang Haid (Udzur Syar\'i)', 'Sistem Haid', 'Sistem Haid')
          `, [
            h.santri_id,
            sess.sesi_id,
            todayStr,
            sess.waktu_scan,
            sess.nama_kegiatan
          ]).catch(() => {});

          existingMap.set(key, 'Haid');
        }
      }
    }
  } catch (eHaidSync) {
    console.warn('[AUTO SYNC HAID -> ABSENSI NOTICE]:', eHaidSync.message);
  }
};

/**
 * 1. GET /api/haid/santriwati
 * Mengambil daftar santriwati (P) dengan status haid terkini & ringkasan statistik
 */
export const getSantriwatiHaidList = async (req, res) => {
  try {
    await ensureHaidTablesAndColumns();
    // Sinkronisasi status haid ke absensi secara asynchronous tanpa menahan response HTTP
    syncActiveHaidToAbsensi().catch(() => {});

    const { search = '', tab = 'semua', kelas_id, asrama_id } = req.query;

    const where = [`LOWER(COALESCE(s.jk, '')) IN ('p', 'perempuan', 'putri', 'akhwat')`];
    const params = [];

    if (search && String(search).trim() !== '') {
      const q = `%${String(search).trim()}%`;
      where.push(`(s.nama_santri LIKE ? OR s.nis LIKE ? OR s.nama_kelas LIKE ? OR a.nama_asrama LIKE ?)`);
      params.push(q, q, q, q);
    }

    if (kelas_id) {
      where.push('s.kelas_id = ?');
      params.push(kelas_id);
    }

    if (asrama_id) {
      where.push('s.asrama_id = ?');
      params.push(asrama_id);
    }

    // Tab filter
    if (tab === 'haid' || tab === 'aktif') {
      where.push(`(s.is_haid = 1 OR sh.id IS NOT NULL)`);
    } else if (tab === 'suci') {
      where.push(`(COALESCE(s.is_haid, 0) = 0 AND sh.id IS NULL)`);
    }

    const sql = `
      SELECT 
        s.id,
        s.nama_santri,
        s.nis,
        s.jk,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama,
        COALESCE(k.nama_kamar, '') as nama_kamar,
        CASE WHEN (s.is_haid = 1 OR sh.id IS NOT NULL) THEN 1 ELSE 0 END as is_haid,
        sh.id as active_haid_id,
        DATE_FORMAT(COALESCE(sh.tgl_mulai, s.tgl_haid_mulai), '%Y-%m-%d') as tgl_mulai,
        sh.waktu_mulai,
        DATEDIFF(CURDATE(), COALESCE(sh.tgl_mulai, s.tgl_haid_mulai)) + 1 as hari_ke,
        sh.keterangan as haid_keterangan,
        sh.dicatat_oleh
      FROM santri s
      LEFT JOIN santri_haid sh ON s.id = sh.santri_id AND sh.status = 'aktif'
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE ${where.join(' AND ')}
      ORDER BY is_haid DESC, s.nama_santri ASC
    `;
    `;

    const [rows] = await pool.query(sql, params);

    // Hitung ringkasan statistik akhwat
    const [[summary]] = await pool.query(`
      SELECT 
        COUNT(*) as total_santriwati,
        SUM(CASE WHEN (s.is_haid = 1 OR sh.id IS NOT NULL) THEN 1 ELSE 0 END) as sedang_haid,
        SUM(CASE WHEN (COALESCE(s.is_haid, 0) = 0 AND sh.id IS NULL) THEN 1 ELSE 0 END) as suci
      FROM santri s
      LEFT JOIN santri_haid sh ON s.id = sh.santri_id AND sh.status = 'aktif'
      WHERE LOWER(COALESCE(s.jk, '')) IN ('p', 'perempuan', 'putri', 'akhwat')
    `);

    return sendSuccess(res, 'Data Haid Santriwati berhasil dimuat', {
      summary: {
        total_santriwati: Number(summary?.total_santriwati || 0),
        sedang_haid: Number(summary?.sedang_haid || 0),
        suci: Number(summary?.suci || 0)
      },
      santriwati: rows || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat data haid santriwati: ${err.message}`, 500);
  }
};

/**
 * 2. POST /api/haid/mulai
 * Mengaktifkan status Haid untuk seorang santriwati
 */
export const startHaid = async (req, res) => {
  try {
    await ensureHaidTablesAndColumns();
    const { santri_id, tgl_mulai, keterangan } = req.body;

    if (!santri_id) {
      return sendError(res, 'Santri ID wajib diisi', 400);
    }

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startDate = tgl_mulai || localDateStr;
    const startTime = now.toTimeString().split(' ')[0];
    const loggedBy = req.user?.nama || req.user?.nama_asatidz || req.user?.username || 'Ustadzah';

    // 1. Tutup status aktif sebelumnya jika ada yang menggantung
    await pool.query(`
      UPDATE santri_haid 
      SET status = 'selesai', tgl_selesai = ?, waktu_selesai = ?, dinonaktifkan_oleh = 'Digantikan Sesi Baru'
      WHERE santri_id = ? AND status = 'aktif'
    `, [startDate, startTime, santri_id]).catch(() => {});

    // 2. Buat record haid baru yang aktif
    const [insRes] = await pool.query(`
      INSERT INTO santri_haid (
        santri_id, tgl_mulai, waktu_mulai, status, keterangan, dicatat_oleh
      ) VALUES (?, ?, ?, 'aktif', ?, ?)
    `, [santri_id, startDate, startTime, keterangan || 'Mulai Haid (Udzur Syar\'i)', loggedBy]);

    // 3. Perbarui flag pada tabel santri
    await pool.query(`
      UPDATE santri 
      SET is_haid = 1, tgl_haid_mulai = ? 
      WHERE id = ?
    `, [startDate, santri_id]);

    // 4. Sinkronisasikan langsung ke absensi sholat berjamaah hari ini
    await syncActiveHaidToAbsensi().catch(() => {});

    return sendSuccess(res, 'Status Haid santriwati berhasil diaktifkan. Absensi shalat berjamaah otomatis disesuaikan.', {
      id: insRes.insertId,
      santri_id,
      tgl_mulai: startDate,
      status: 'aktif'
    });
  } catch (err) {
    return sendError(res, `Gagal mengaktifkan status haid: ${err.message}`, 500);
  }
};

/**
 * 3. POST /api/haid/selesai
 * Menonaktifkan status Haid secara manual (santriwati telah bersuci)
 */
export const stopHaid = async (req, res) => {
  try {
    await ensureHaidTablesAndColumns();
    const { santri_id, tgl_selesai } = req.body;

    if (!santri_id) {
      return sendError(res, 'Santri ID wajib diisi', 400);
    }

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const endDate = tgl_selesai || localDateStr;
    const endTime = now.toTimeString().split(' ')[0];
    const loggedBy = req.user?.nama || req.user?.nama_asatidz || req.user?.username || 'Manual Ustadzah';

    // 1. Selesaikan di tabel santri_haid
    await pool.query(`
      UPDATE santri_haid
      SET status = 'selesai',
          tgl_selesai = ?,
          waktu_selesai = ?,
          dinonaktifkan_oleh = ?
      WHERE santri_id = ? AND status = 'aktif'
    `, [endDate, endTime, loggedBy, santri_id]);

    // 2. Set flag is_haid = 0
    await pool.query(`
      UPDATE santri
      SET is_haid = 0, tgl_haid_mulai = NULL
      WHERE id = ?
    `, [santri_id]);

    return sendSuccess(res, 'Status Haid berhasil dinonaktifkan (santriwati telah suci). Presensi shalat kembali normal.', {
      santri_id,
      tgl_selesai: endDate,
      status: 'selesai'
    });
  } catch (err) {
    return sendError(res, `Gagal menyelesaikan status haid: ${err.message}`, 500);
  }
};

/**
 * 4. GET /api/haid/riwayat
 * Melihat daftar riwayat siklus haid
 */
export const getHaidHistory = async (req, res) => {
  try {
    await ensureHaidTablesAndColumns();
    const { santri_id, limit = 50 } = req.query;

    const where = [];
    const params = [];

    if (santri_id) {
      where.push('sh.santri_id = ?');
      params.push(santri_id);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT 
        sh.id,
        sh.santri_id,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        DATE_FORMAT(sh.tgl_mulai, '%Y-%m-%d') as tgl_mulai,
        sh.waktu_mulai,
        DATE_FORMAT(sh.tgl_selesai, '%Y-%m-%d') as tgl_selesai,
        sh.waktu_selesai,
        sh.status,
        CASE 
          WHEN sh.status = 'aktif' THEN DATEDIFF(CURDATE(), sh.tgl_mulai) + 1
          ELSE DATEDIFF(COALESCE(sh.tgl_selesai, CURDATE()), sh.tgl_mulai) + 1
        END as durasi_hari,
        sh.keterangan,
        sh.dicatat_oleh,
        sh.dinonaktifkan_oleh,
        sh.created_at
      FROM santri_haid sh
      JOIN santri s ON sh.santri_id = s.id
      ${whereSql}
      ORDER BY sh.id DESC
      LIMIT ?
    `;

    params.push(Math.max(1, parseInt(limit) || 50));
    const [rows] = await pool.query(sql, params);

    return sendSuccess(res, 'Riwayat haid berhasil dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat riwayat haid: ${err.message}`, 500);
  }
};

