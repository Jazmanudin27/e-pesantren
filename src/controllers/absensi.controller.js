import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createWaliNotification, buildAbsensiNotifText } from './notifikasi.controller.js';
import { triggerAutoPresensiWA } from '../services/whatsapp.service.js';

let isAbsensiTablesChecked = false;
export const ensureAbsensiTablesAndColumns = async () => {
  if (isAbsensiTablesChecked) return;
  try {
    // 0. Buat tabel absensi_deleted_logs jika belum ada (mencegah mesin ADMS MP340 re-push log yang sudah dihapus Admin)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS absensi_deleted_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          santri_id INT NOT NULL,
          tanggal DATE NOT NULL,
          waktu_scan VARCHAR(50) DEFAULT NULL,
          sesi_id INT DEFAULT NULL,
          nama_kegiatan VARCHAR(150) DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_santri_tgl (santri_id, tanggal)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (eDelTable) {}

    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'absensi_jamaah_mengaji' AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = (cols || []).map(c => c.COLUMN_NAME.toLowerCase());

    // 1. Tambah kolom nama_kegiatan jika belum ada
    if (!colNames.includes('nama_kegiatan')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN nama_kegiatan VARCHAR(150) NULL AFTER sesi_id`);
        console.log('[ABSENSI DB] Kolom nama_kegiatan berhasil ditambahkan');
      } catch (e) {}
    }

    // 2. Tambah kolom tipe_presensi ('Berjamaah' vs 'Kegiatan')
    if (!colNames.includes('tipe_presensi')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN tipe_presensi VARCHAR(50) DEFAULT 'Berjamaah' AFTER nama_kegiatan`);
        console.log('[ABSENSI DB] Kolom tipe_presensi berhasil ditambahkan');
      } catch (e) {}
    }

    // 2b. Tambah kolom musyrif_verifikator dan nama_ustadz jika belum ada
    if (!colNames.includes('musyrif_verifikator')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN musyrif_verifikator VARCHAR(100) NULL AFTER metode_presensi`);
        console.log('[ABSENSI DB] Kolom musyrif_verifikator berhasil ditambahkan');
      } catch (e) {}
    }
    if (!colNames.includes('nama_ustadz')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN nama_ustadz VARCHAR(100) NULL AFTER musyrif_verifikator`);
      } catch (e) {}
    }

    // 3. Pastikan kolom sesi_id boleh NULL (agar kegiatan mobile non-shalat tidak error)
    try {
      const [fks] = await pool.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'absensi_jamaah_mengaji' 
          AND COLUMN_NAME = 'sesi_id' 
          AND REFERENCED_TABLE_NAME IS NOT NULL 
          AND TABLE_SCHEMA = DATABASE()
      `);
      for (const fk of fks || []) {
        if (fk.CONSTRAINT_NAME) {
          await pool.query(`ALTER TABLE absensi_jamaah_mengaji DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
        }
      }
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji MODIFY COLUMN sesi_id INT NULL`);
    } catch (e) {}

    // 3b. Ubah kolom status dari ENUM terbatas menjadi VARCHAR(100) agar 'Hadir' dan 'Alfa' tidak terpotong menjadi '' (kosong)
    try {
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'Hadir'`);
    } catch (e) {}

    // 3c. Hapus UNIQUE KEY lama uq_absensi_sesi_santri (tanggal, sesi_id, santri_id) agar multi-sesi di hari yang sama tidak bentrok Duplicate Entry
    try {
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji DROP INDEX uq_absensi_sesi_santri`);
    } catch (e) {}

    // 3d. Pulihkan baris absensi yang status-nya sempat kosong ('') akibat ENUM lama
    try {
      await pool.query(`
        UPDATE absensi_jamaah_mengaji
        SET status = 'Hadir'
        WHERE status IS NULL OR TRIM(status) = ''
      `);
    } catch (e) {}

    // 4. Pastikan kolom metode_presensi VARCHAR (bisa simpan Wajah AI, QR Code, Fingerprint, dll)
    try {
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji MODIFY COLUMN metode_presensi VARCHAR(100) DEFAULT 'Fingerprint'`);
    } catch (e) {}

    // 5. Normalisasi data lama yang nama_kegiatan masih null
    try {
      await pool.query(`
        UPDATE absensi_jamaah_mengaji aj
        LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
        SET aj.nama_kegiatan = COALESCE(ks.nama_sesi, CASE WHEN aj.tipe_presensi = 'Kegiatan' THEN 'Pegon' ELSE 'Shalat Berjamaah' END),
            aj.tipe_presensi = CASE 
              WHEN COALESCE(ks.nama_sesi, '') REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya|dhuha' THEN 'Berjamaah'
              WHEN aj.tipe_presensi = 'Kegiatan' THEN 'Kegiatan'
              ELSE 'Berjamaah'
            END
        WHERE aj.nama_kegiatan IS NULL OR aj.nama_kegiatan = ''
      `);
    } catch (e) {}

    // 5b. Normalisasi data lama yang sesi_id masih NULL (isi id dari materi_hafalan atau kegiatan_sesi)
    try {
      await pool.query(`
        UPDATE absensi_jamaah_mengaji aj
        JOIN materi_hafalan mh ON LOWER(TRIM(aj.nama_kegiatan)) = LOWER(TRIM(mh.nama_materi))
        SET aj.sesi_id = mh.id
        WHERE aj.sesi_id IS NULL OR aj.sesi_id <= 0
      `);
      await pool.query(`
        UPDATE absensi_jamaah_mengaji aj
        JOIN kegiatan_sesi ks ON LOWER(TRIM(aj.nama_kegiatan)) = LOWER(TRIM(ks.nama_sesi))
        SET aj.sesi_id = ks.id
        WHERE aj.sesi_id IS NULL OR aj.sesi_id <= 0
      `);
      await pool.query(`
        UPDATE absensi_jamaah_mengaji
        SET sesi_id = 1
        WHERE sesi_id IS NULL OR sesi_id <= 0
      `);
    } catch (eFixNullSesi) {}

    // 6. Pastikan tabel kegiatan_sesi ada dan strukturnya lengkap
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS kegiatan_sesi (
          id INT AUTO_INCREMENT PRIMARY KEY,
          kode_sesi VARCHAR(50) NOT NULL UNIQUE,
          nama_sesi VARCHAR(150) NOT NULL,
          kategori VARCHAR(100) NOT NULL DEFAULT 'Shalat Berjamaah',
          jam_mulai_presensi TIME NOT NULL,
          jam_target TIME NOT NULL,
          jam_toleransi_telat TIME NOT NULL,
          jam_tutup_presensi TIME NOT NULL,
          hari_aktif VARCHAR(100) DEFAULT 'Setiap Hari',
          tipe_peserta VARCHAR(100) DEFAULT 'Wajib Semua Santri',
          target_gender VARCHAR(50) DEFAULT 'Semua',
          target_tipe_santri VARCHAR(50) DEFAULT 'Semua',
          peserta_santri_ids TEXT NULL,
          is_active TINYINT(1) DEFAULT 1,
          keterangan TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (eTableSesi) {}

    // Ubah kolom kategori menjadi VARCHAR agar bebas simpan jenis kegiatan tanpa batasan ENUM
    try {
      await pool.query(`ALTER TABLE kegiatan_sesi MODIFY COLUMN kategori VARCHAR(100) DEFAULT 'Shalat Berjamaah'`);
    } catch (eModKat) {}

    // Pastikan kolom-kolom baru ada di kegiatan_sesi
    try {
      const [sesiCols] = await pool.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'kegiatan_sesi' AND TABLE_SCHEMA = DATABASE()
      `);
      const sColNames = (sesiCols || []).map(c => c.COLUMN_NAME.toLowerCase());
      if (!sColNames.includes('tipe_peserta')) {
        try { await pool.query(`ALTER TABLE kegiatan_sesi ADD COLUMN tipe_peserta VARCHAR(100) DEFAULT 'Wajib Semua Santri'`); } catch(e){}
      }
      if (!sColNames.includes('target_gender')) {
        try { await pool.query(`ALTER TABLE kegiatan_sesi ADD COLUMN target_gender VARCHAR(50) DEFAULT 'Semua'`); } catch(e){}
      }
      if (!sColNames.includes('target_tipe_santri')) {
        try { await pool.query(`ALTER TABLE kegiatan_sesi ADD COLUMN target_tipe_santri VARCHAR(50) DEFAULT 'Semua'`); } catch(e){}
      }
      if (!sColNames.includes('peserta_santri_ids')) {
        try { await pool.query(`ALTER TABLE kegiatan_sesi ADD COLUMN peserta_santri_ids TEXT NULL`); } catch(e){}
      }
      if (!sColNames.includes('keterangan')) {
        try { await pool.query(`ALTER TABLE kegiatan_sesi ADD COLUMN keterangan TEXT NULL`); } catch(e){}
      }
    } catch (eCols) {}

    // 7. Bersihkan data fake/dummy sesi jika ada
    try {
      await pool.query(`
        DELETE FROM kegiatan_sesi 
        WHERE kode_sesi IN (
          'SHLT-SBH', 'SHLT-DZH', 'SHLT-ASH', 'SHLT-MGB', 'SHLT-ISY', 
          'IBD-DHU', 'KJN-SRG', 'KJN-BDG', 'KJN-THF', 'KJN-TKL', 'KJN-JRM',
          'MNGJ-01', 'MNGJ-02', 'MNGJ-03', 'MNGJ-04'
        )
      `);
    } catch (eClean) {}

    isAbsensiTablesChecked = true;
  } catch (err) {
    console.warn('[ABSENSI DB INIT NOTICE]', err.message);
  }
};

/**
 * Otomatis sinkronisasi santri yang sedang Izin Pulang / Sakit aktif hari ini
 * ke tabel absensi_jamaah_mengaji untuk seluruh sesi Berjamaah & Kegiatan Mengaji.
 * Dengan demikian musyrif tidak perlu menginput absensi manual bagi santri yang sedang pulang.
 */
export const syncActivePerizinanToAbsensi = async () => {
  try {
    await ensureAbsensiTablesAndColumns();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. Ambil semua santri yang izin keluar/pulang dan sampai hari ini belum kembali
    const [activeIzins] = await pool.query(`
      SELECT sp.*
      FROM santri_perizinan sp
      WHERE (
          sp.tgl_kembali_aktual IS NULL 
          OR sp.status IN ('Aktif Keluar', 'Terlambat Kembali', 'Disetujui Pengasuh')
        )
        AND sp.status NOT IN ('Kembali Tepat Waktu', 'Ditolak', 'Dibatalkan', 'Selesai')
        AND DATE(COALESCE(sp.tgl_keluar_aktual, sp.tgl_keluar_rencana, sp.created_at)) <= ?
    `, [todayStr]).catch(() => [[]]);

    if (!activeIzins || activeIzins.length === 0) return;

    // 2. Ambil daftar sesi kegiatan aktif (Shalat Berjamaah & Kegiatan Mengaji)
    const [sesiRows] = await pool.query(`
      SELECT id, nama_sesi, kategori, jam_target
      FROM kegiatan_sesi
      WHERE is_active = 1
    `).catch(() => [[]]);

    const [materiRows] = await pool.query(`
      SELECT id, nama_materi, kategori
      FROM materi_hafalan
    `).catch(() => [[]]);

    const allSessions = [];
    const seenNames = new Set();

    (sesiRows || []).forEach(s => {
      if (!s.nama_sesi) return;
      const key = s.nama_sesi.trim().toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(s.nama_sesi) || /shalat|sholat/i.test(s.kategori || '');
      allSessions.push({
        sesi_id: s.id,
        nama_kegiatan: s.nama_sesi,
        tipe_presensi: isShalat ? 'Berjamaah' : 'Kegiatan',
        waktu_scan: s.jam_target ? String(s.jam_target).substring(0, 8) : '05:00:00'
      });
    });

    (materiRows || []).forEach(m => {
      if (!m.nama_materi) return;
      const key = m.nama_materi.trim().toLowerCase();
      if (seenNames.has(key)) return;
      seenNames.add(key);
      const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(m.nama_materi);
      if (!isShalat) {
        allSessions.push({
          sesi_id: m.id,
          nama_kegiatan: m.nama_materi,
          tipe_presensi: 'Kegiatan',
          waktu_scan: '07:00:00'
        });
      }
    });

    if (allSessions.length === 0) return;

    // 3. Ambil log absensi hari ini agar tidak insert duplikat
    const [existingToday] = await pool.query(`
      SELECT santri_id, nama_kegiatan, sesi_id
      FROM absensi_jamaah_mengaji
      WHERE tanggal = ?
    `, [todayStr]).catch(() => [[]]);

    const existingSet = new Set(
      (existingToday || []).map(
        r => `${r.santri_id}__${String(r.nama_kegiatan || '').trim().toLowerCase()}`
      )
    );

    // Cek juga absensi_deleted_logs agar yang sengaja dihapus tidak dibuat ulang
    const [deletedToday] = await pool.query(`
      SELECT santri_id, nama_kegiatan
      FROM absensi_deleted_logs
      WHERE tanggal = ?
    `, [todayStr]).catch(() => [[]]);

    const deletedSet = new Set(
      (deletedToday || []).map(
        r => `${r.santri_id}__${String(r.nama_kegiatan || '').trim().toLowerCase()}`
      )
    );

    for (const izin of activeIzins) {
      const jenisLower = String(izin.jenis_izin || '').toLowerCase();
      const kepLower = String(izin.keperluan || '').toLowerCase();
      const isSakit = jenisLower.includes('sakit') || jenisLower.includes('berobat') || kepLower.includes('sakit') || kepLower.includes('berobat');
      const statusAbsen = isSakit ? 'Sakit' : 'Izin';
      const ketText = `${izin.jenis_izin || 'Izin Pulang'}${izin.keperluan ? ': ' + izin.keperluan : ''} (Belum Kembali)`;

      for (const sess of allSessions) {
        const key = `${izin.santri_id}__${sess.nama_kegiatan.trim().toLowerCase()}`;
        if (existingSet.has(key) || deletedSet.has(key)) continue;

        await pool.query(`
          INSERT INTO absensi_jamaah_mengaji (
            santri_id, sesi_id, tanggal, waktu_scan, status, metode_presensi, nama_kegiatan, tipe_presensi, keterangan, musyrif_verifikator, nama_ustadz
          ) VALUES (?, ?, ?, ?, ?, 'Perizinan', ?, ?, ?, 'Sistem Perizinan', 'Sistem Perizinan')
        `, [
          izin.santri_id,
          sess.sesi_id,
          todayStr,
          sess.waktu_scan,
          statusAbsen,
          sess.nama_kegiatan,
          sess.tipe_presensi,
          ketText
        ]).catch(() => {});

        existingSet.add(key);
      }
    }
  } catch (eSync) {
    console.warn('[AUTO SYNC PERIZINAN -> ABSENSI NOTICE]:', eSync.message);
  }
};

export const getAbsensiFingerprint = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    // Sinkronisasi santri yang sedang izin pulang / sakit sebelum query
    await syncActivePerizinanToAbsensi().catch(() => {});

    const tipeParam = (req.query.tipe || req.query.type || '').toLowerCase(); // 'berjamaah' | 'kegiatan' | ''
    const isToday = req.query.today === 'true' || req.query.hari_ini === 'true';
    const tanggalParam = req.query.tanggal;

    let dateWhere = "";
    const params = [];
    if (tanggalParam) {
      dateWhere = "AND aj.tanggal = ?";
      params.push(tanggalParam);
    } else if (isToday) {
      dateWhere = "AND aj.tanggal = CURDATE()";
    }

    const [rows] = await pool.query(`
      SELECT aj.id,
             aj.santri_id,
             aj.sesi_id,
             aj.device_id,
             aj.waktu_scan,
             aj.status,
             aj.keterangan,
             aj.nama_kegiatan,
             DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
             aj.status as status_kehadiran,
             aj.metode_presensi as metode_scan,
             COALESCE(aj.musyrif_verifikator, aj.nama_ustadz, '') as musyrif_verifikator,
             COALESCE(aj.nama_ustadz, aj.musyrif_verifikator, '') as nama_ustadz,
             COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as nama_sesi,
             COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as kegiatan,
             CASE 
               WHEN COALESCE(aj.nama_kegiatan, ks.nama_sesi, '') REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya|dhuha' THEN 'Berjamaah'
               WHEN aj.tipe_presensi = 'Kegiatan' THEN 'Kegiatan'
               WHEN aj.nama_kegiatan IS NOT NULL AND aj.nama_kegiatan != '' THEN 'Kegiatan'
               ELSE COALESCE(aj.tipe_presensi, 'Berjamaah')
             END as tipe_presensi,
             s.nama_santri, s.nis, s.fingerprint_pin, s.tipe_santri,
             COALESCE(s.nama_kelas, '') as nama_kelas,
             a.nama_asrama, k.nama_kamar,
             ks.kategori, fd.nama_device
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      LEFT JOIN fingerprint_device fd ON aj.device_id = fd.id
      LEFT JOIN absensi_deleted_logs adl ON (
        adl.santri_id = aj.santri_id 
        AND adl.tanggal = aj.tanggal
        AND (
          (adl.sesi_id IS NOT NULL AND aj.sesi_id IS NOT NULL AND adl.sesi_id = aj.sesi_id)
          OR (adl.nama_kegiatan IS NOT NULL AND aj.nama_kegiatan IS NOT NULL AND LOWER(TRIM(adl.nama_kegiatan)) = LOWER(TRIM(aj.nama_kegiatan)))
        )
      )
      WHERE adl.id IS NULL ${dateWhere}
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC
      LIMIT 1000
    `, params);

    let finalRows = rows || [];

    if (tipeParam === 'berjamaah') {
      finalRows = finalRows.filter(item => item.tipe_presensi === 'Berjamaah');
    } else if (tipeParam === 'kegiatan') {
      finalRows = finalRows.filter(item => item.tipe_presensi === 'Kegiatan');
    }

    return sendSuccess(res, 'Data absensi murni database berhasil diambil', { data: finalRows });
  } catch (err) {
    try {
      const [rows] = await pool.query(`
        SELECT aj.*, 
               DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
               s.nama_santri, s.nis 
        FROM absensi_jamaah_mengaji aj 
        JOIN santri s ON aj.santri_id = s.id 
        ORDER BY aj.id DESC LIMIT 500
      `);
      return sendSuccess(res, 'Data absensi berhasil diambil', { data: rows });
    } catch (e2) {
      return sendError(res, err.message, 500);
    }
  }
};

/**
 * Helper: Konversi jam "HH:mm:ss" atau "HH:mm" menjadi menit sejak 00:00
 */
const parseTimeStrToMinutes = (tStr) => {
  if (!tStr) return null;
  const parts = String(tStr).trim().split(':').map(Number);
  if (parts.length === 0 || isNaN(parts[0])) return null;
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

/**
 * Helper: Otomatis cari sesi Shalat Berjamaah aktif dari tabel kegiatan_sesi
 * berdasarkan jam scan (waktuScan) pada Setting Jadwal Shalat Berjamaah.
 */
export const resolveActiveShalatBerjamaahSesi = async (waktuScanStr) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const [sesiRows] = await pool.query(`
      SELECT id, kode_sesi, nama_sesi, kategori,
             jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi,
             hari_aktif
      FROM kegiatan_sesi
      WHERE is_active = 1
        AND (
          kategori REGEXP 'shalat|sholat|berjamaah|ibadah'
          OR nama_sesi REGEXP 'shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|jumat'
        )
      ORDER BY jam_mulai_presensi ASC
    `);

    if (!sesiRows || sesiRows.length === 0) {
      return {
        id: 1,
        nama_sesi: 'Shalat Berjamaah',
        kategori: 'Shalat Berjamaah',
        tipe_presensi: 'Berjamaah',
        jam_toleransi_telat: null
      };
    }

    const now = new Date();
    const curMin =
      parseTimeStrToMinutes(waktuScanStr) ??
      now.getHours() * 60 + now.getMinutes();

    const isWithinRange = (val, start, end) => {
      if (start === null || end === null) return false;
      if (start <= end) return val >= start && val <= end;
      return val >= start || val <= end;
    };

    // 1. Prioritas Utama: Jam scan masuk tepat di antara jam_mulai_presensi s/d jam_tutup_presensi
    let matched = sesiRows.find((s) => {
      const start = parseTimeStrToMinutes(s.jam_mulai_presensi);
      const end = parseTimeStrToMinutes(
        s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target
      );
      return isWithinRange(curMin, start, end);
    });

    // 2. Prioritas Kedua: Toleransi buffer 30 menit sebelum jam_mulai s/d 45 menit setelah jam_tutup
    if (!matched) {
      matched = sesiRows.find((s) => {
        const start = parseTimeStrToMinutes(s.jam_mulai_presensi);
        const end = parseTimeStrToMinutes(
          s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target
        );
        if (start === null || end === null) return false;
        const bufStart = Math.max(0, start - 30);
        const bufEnd = Math.min(1439, end + 45);
        return isWithinRange(curMin, bufStart, bufEnd);
      });
    }

    // 3. Prioritas Ketiga: Pilih jadwal Shalat Berjamaah dengan jarak waktu terdekat dari jam scan saat ini
    if (!matched) {
      let bestDist = Infinity;
      for (const s of sesiRows) {
        const start = parseTimeStrToMinutes(s.jam_mulai_presensi) ?? 0;
        const target = parseTimeStrToMinutes(s.jam_target) ?? start;
        const end =
          parseTimeStrToMinutes(
            s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target
          ) ?? target;
        const distToWindow =
          curMin < start
            ? start - curMin
            : curMin > end
            ? curMin - end
            : 0;
        const dist = Math.min(distToWindow, Math.abs(curMin - target));
        if (dist < bestDist) {
          bestDist = dist;
          matched = s;
        }
      }
    }

    const chosen = matched || sesiRows[0];
    return {
      id: chosen.id,
      nama_sesi: chosen.nama_sesi || 'Shalat Berjamaah',
      kategori: chosen.kategori || 'Shalat Berjamaah',
      tipe_presensi: 'Berjamaah',
      jam_mulai_presensi: chosen.jam_mulai_presensi,
      jam_target: chosen.jam_target,
      jam_toleransi_telat: chosen.jam_toleransi_telat,
      jam_tutup_presensi: chosen.jam_tutup_presensi
    };
  } catch (err) {
    return {
      id: 1,
      nama_sesi: 'Shalat Berjamaah',
      kategori: 'Shalat Berjamaah',
      tipe_presensi: 'Berjamaah',
      jam_toleransi_telat: null
    };
  }
};

export const createAbsensiFingerprint = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const { 
      santri_id, 
      sesi_id, 
      device_id, 
      status_kehadiran, 
      status,
      keteledoran_keterangan, 
      keterangan,
      waktu_scan, 
      metode_scan, 
      metode_presensi,
      tanggal,
      kegiatan,
      nama_sesi,
      nama_kegiatan,
      tipe_presensi,
      musyrif_verifikator,
      nama_ustadz
    } = req.body;

    const finalMusyrif = musyrif_verifikator || nama_ustadz || req.user?.nama || req.user?.nama_asatidz || req.user?.username || null;

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tgl = tanggal || localDateStr;
    const scanTime = waktu_scan || now.toTimeString().split(' ')[0];

    // Simpan metode presensi asli yang deskriptif (Wajah AI, QR Code, Fingerprint, Manual Musyrif)
    let rawMetode = metode_presensi || metode_scan || 'Manual Musyrif';
    let finalMetode = rawMetode;
    if (rawMetode.includes('Wajah') || rawMetode.includes('Face') || rawMetode.includes('AI')) {
      finalMetode = 'Wajah AI';
    } else if (rawMetode.includes('QR') || rawMetode.includes('Barcode')) {
      finalMetode = 'QR Code';
    } else if (rawMetode.includes('Finger') || rawMetode.includes('Sidik')) {
      finalMetode = 'Fingerprint';
    } else if (rawMetode.includes('Perizinan')) {
      finalMetode = 'Perizinan';
    } else {
      finalMetode = 'Manual Musyrif';
    }

    const finalStatus = status || status_kehadiran || 'Hadir';
    const finalSantriId = parseInt(santri_id) || 1;

    // OTOMATIS PILIH JADWAL SHALAT BERJAMAAH SAAT SCAN FINGERPRINT MAUPUN SCAN WAJAH AI (HANYA JIKA BUKAN MENGAJI)
    const isAutoBerjamaahScan =
      (finalMetode === 'Fingerprint' || finalMetode === 'Wajah AI' || req.body?.auto_jadwal_berjamaah === true) &&
      tipe_presensi !== 'Kegiatan' &&
      req.body?.auto_jadwal_berjamaah !== false;

    let finalKegiatan = kegiatan || nama_sesi || nama_kegiatan || req.body?.nama_kegiatan || '';
    
    // VALIDASI KETAT: Jika presensi Kegiatan Mengaji, nama kegiatan WAJIB ada!
    if (tipe_presensi === 'Kegiatan') {
      if (!finalKegiatan || !String(finalKegiatan).trim() || finalKegiatan === 'Kegiatan Pesantren') {
        return sendError(res, 'Nama kegiatan mengaji wajib dipilih sebelum mencatat presensi.', 400);
      }
    }

    if (!finalKegiatan) {
      finalKegiatan = 'Kegiatan Pesantren';
    }

    let finalTipe = tipe_presensi;
    let parsedSesiId = null;
    if (sesi_id !== undefined && sesi_id !== null && sesi_id !== '') {
      const numOnly = String(sesi_id).replace(/\D/g, '');
      if (numOnly) parsedSesiId = parseInt(numOnly, 10);
    }

    if (isAutoBerjamaahScan) {
      const autoSesi = await resolveActiveShalatBerjamaahSesi(scanTime);
      if (autoSesi) {
        parsedSesiId = autoSesi.id;
        finalKegiatan = autoSesi.nama_sesi;
        finalTipe = 'Berjamaah';
      }
    }

    const isShalat = /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(finalKegiatan);
    finalTipe = isShalat ? 'Berjamaah' : 'Kegiatan';
    const finalKet = keterangan || keteledoran_keterangan || (metode_presensi || 'Scan Presensi');
    
    // Pastikan sesi_id selalu terisi integer valid (tidak NULL)
    if ((!parsedSesiId || isNaN(parsedSesiId) || parsedSesiId <= 0) && finalKegiatan) {
      try {
        const [kegRows] = await pool.query("SELECT id FROM kegiatan_sesi WHERE LOWER(TRIM(nama_sesi)) = LOWER(TRIM(?)) LIMIT 1", [finalKegiatan]);
        if (kegRows && kegRows.length > 0) {
          parsedSesiId = kegRows[0].id;
        } else {
          const [matRows] = await pool.query("SELECT id FROM materi_hafalan WHERE LOWER(TRIM(nama_materi)) = LOWER(TRIM(?)) LIMIT 1", [finalKegiatan]);
          if (matRows && matRows.length > 0) {
            parsedSesiId = matRows[0].id;
          }
        }
      } catch (eLookup) {}
    }

    if (!parsedSesiId || isNaN(parsedSesiId) || parsedSesiId <= 0) {
      parsedSesiId = 1;
    }

    // 1. CEK APAKAH SUDAH ADA RECORD (HARI YANG SAMA + KEGIATAN YANG SAMA + SANTRI YANG SAMA)
    const [existing] = await pool.query(`
      SELECT id FROM absensi_jamaah_mengaji 
      WHERE tanggal = ? AND santri_id = ? AND (
        LOWER(TRIM(COALESCE(nama_kegiatan, ''))) = LOWER(TRIM(?))
        OR (nama_kegiatan IS NULL AND sesi_id IS NOT NULL AND sesi_id = ?)
      )
      ORDER BY id DESC LIMIT 1
    `, [tgl, finalSantriId, finalKegiatan, parsedSesiId]).catch(() => [[]]);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      // UPDATE status record yang ada, JANGAN buat baru (cegah duplikasi)
      await pool.query(`
        UPDATE absensi_jamaah_mengaji 
        SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?, nama_kegiatan = ?, tipe_presensi = ?, sesi_id = ?,
            musyrif_verifikator = COALESCE(?, musyrif_verifikator),
            nama_ustadz = COALESCE(?, nama_ustadz)
        WHERE id = ?
      `, [finalStatus, scanTime, finalMetode, finalKet, finalKegiatan, finalTipe, parsedSesiId, finalMusyrif, finalMusyrif, existingId]).catch(async () => {
        // Fallback jika kolom nama_kegiatan belum terindeks
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?, sesi_id = ?,
              musyrif_verifikator = COALESCE(?, musyrif_verifikator),
              nama_ustadz = COALESCE(?, nama_ustadz)
          WHERE id = ?
        `, [finalStatus, scanTime, finalMetode, finalKet, parsedSesiId, finalMusyrif, finalMusyrif, existingId]);
      });

      // Hapus log pencegahan dari absensi_deleted_logs jika santri ini dicatat kembali
      await pool.query(
        `DELETE FROM absensi_deleted_logs 
         WHERE santri_id = ? AND tanggal = ? AND (sesi_id = ? OR nama_kegiatan = ? OR sesi_id IS NULL)`,
        [finalSantriId, tgl, parsedSesiId, finalKegiatan]
      ).catch(() => {});

      // Perbarui juga notifikasi wali santri jika status dikoreksi (misal salah klik Sakit -> Izin)
      const notifCopy = buildAbsensiNotifText({
        namaSantri: req.body?.nama_santri || 'Ananda',
        kegiatan: finalKegiatan,
        status: finalStatus,
        waktu: scanTime
      });
      createWaliNotification({
        santri_id: finalSantriId,
        kategori: 'absensi',
        judul: notifCopy.judul,
        pesan: notifCopy.pesan,
        target_tab: 'absensi',
        replaceRecentSameCategory: true
      });

      // Kirim Notifikasi WA ke Orang Tua (Sakit / Izin / Alfa) secara asinkron
      triggerAutoPresensiWA({
        santri_id: finalSantriId,
        nama_santri: req.body?.nama_santri,
        kegiatan: finalKegiatan,
        status: finalStatus,
        waktu: scanTime
      }).catch(() => {});

      return sendSuccess(res, 'Presensi berhasil diperbarui (tidak duplikat)', {
        id: existingId,
        metode_presensi: finalMetode,
        sesi_id: parsedSesiId,
        nama_sesi: finalKegiatan,
        kegiatan: finalKegiatan,
        tipe_presensi: finalTipe
      });
    }

    // 2. JIKA BELUM ADA, INSERT BARU
    let insertResult;
    try {
      const [resInsert] = await pool.query(`
        INSERT INTO absensi_jamaah_mengaji (
          tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan, musyrif_verifikator, nama_ustadz
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [tgl, parsedSesiId, finalKegiatan, finalTipe, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet, finalMusyrif, finalMusyrif]);
      insertResult = resInsert;
    } catch (errIns) {
      console.warn('[createAbsensiFingerprint Insert 1 Failed, Retrying with parsedSesiId fallback...]', errIns?.message);
      try {
        const [resInsert] = await pool.query(`
          INSERT INTO absensi_jamaah_mengaji (
            tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan, musyrif_verifikator, nama_ustadz
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tgl, parsedSesiId || 1, finalKegiatan, finalTipe, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet, finalMusyrif, finalMusyrif]);
        insertResult = resInsert;
      } catch (errIns2) {
        // Fallback versi skema minimal
        console.warn('[createAbsensiFingerprint Insert 2 Failed, Falling back to minimal columns...]', errIns2?.message);
        const [resInsert] = await pool.query(`
          INSERT INTO absensi_jamaah_mengaji (
            tanggal, sesi_id, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan, nama_kegiatan, tipe_presensi, musyrif_verifikator, nama_ustadz
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tgl, parsedSesiId || 1, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet, finalKegiatan, finalTipe, finalMusyrif, finalMusyrif]);
        insertResult = resInsert;
      }
    }

    // Hapus log pencegahan dari absensi_deleted_logs jika santri ini dicatat kembali
    await pool.query(
      `DELETE FROM absensi_deleted_logs 
       WHERE santri_id = ? AND tanggal = ? AND (sesi_id = ? OR nama_kegiatan = ? OR sesi_id IS NULL)`,
      [finalSantriId, tgl, parsedSesiId, finalKegiatan]
    ).catch(() => {});

    // Catat notifikasi profesional ke HP Orang Tua / Wali Santri
    const notifCopy = buildAbsensiNotifText({
      namaSantri: req.body?.nama_santri || 'Ananda',
      kegiatan: finalKegiatan,
      status: finalStatus,
      waktu: scanTime
    });
    createWaliNotification({
      santri_id: finalSantriId,
      kategori: 'absensi',
      judul: notifCopy.judul,
      pesan: notifCopy.pesan,
      target_tab: 'absensi'
    });

    // Kirim Notifikasi WA ke Orang Tua (Sakit / Izin / Alfa) secara asinkron
    triggerAutoPresensiWA({
      santri_id: finalSantriId,
      nama_santri: req.body?.nama_santri,
      kegiatan: finalKegiatan,
      status: finalStatus,
      waktu: scanTime
    }).catch(() => {});

    return sendSuccess(res, 'Presensi berhasil dicatat', {
      id: insertResult.insertId,
      metode_presensi: finalMetode,
      sesi_id: parsedSesiId,
      nama_sesi: finalKegiatan,
      kegiatan: finalKegiatan,
      tipe_presensi: finalTipe
    }, 201);
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

// Batch Sinkronisasi Log dari NWF Mobile (localStorage) ke Server MySQL
export const syncMobileAbsensi = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const items = Array.isArray(req.body) ? req.body : (req.body?.items || []);
    if (!items.length) {
      return sendSuccess(res, 'Tidak ada data untuk disinkron', { synced: 0 });
    }

    let syncedCount = 0;
    for (const item of items) {
      if (!item.santri_id) continue;
      const tgl = item.tanggal || new Date().toISOString().split('T')[0];

      // Abaikan jika data presensi santri pada tanggal ini sudah pernah dihapus oleh Admin
      const [isDeleted] = await pool.query(`
        SELECT id FROM absensi_deleted_logs 
        WHERE santri_id = ? AND tanggal = ? 
        LIMIT 1
      `, [item.santri_id, tgl]).catch(() => [[]]);
      if (isDeleted && isDeleted.length > 0) {
        continue;
      }

      const scanTime = item.waktu_scan || '07:00:00';
      const mt = item.metode_presensi || item.metode_scan || 'Wajah AI';
      const isAutoBerjamaah = /wajah|face|ai|finger|sidik/i.test(String(mt || ''));
      let kegiatanName = item.kegiatan || item.nama_sesi || 'Kegiatan Pesantren';
      let sesiId = null;
      if (item.sesi_id !== undefined && item.sesi_id !== null && item.sesi_id !== '') {
        const numOnly = String(item.sesi_id).replace(/\D/g, '');
        if (numOnly) sesiId = parseInt(numOnly, 10);
      }
      let tipe = item.tipe_presensi;

      if (isAutoBerjamaah) {
        const autoSesi = await resolveActiveShalatBerjamaahSesi(scanTime);
        if (autoSesi) {
          sesiId = autoSesi.id;
          kegiatanName = autoSesi.nama_sesi;
          tipe = 'Berjamaah';
        }
      }

      const isShalat = /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(kegiatanName);
      tipe = tipe || (isShalat ? 'Berjamaah' : 'Kegiatan');

      if ((!sesiId || isNaN(sesiId) || sesiId <= 0) && kegiatanName) {
        try {
          const [kegRows] = await pool.query("SELECT id FROM kegiatan_sesi WHERE LOWER(TRIM(nama_sesi)) = LOWER(TRIM(?)) LIMIT 1", [kegiatanName]);
          if (kegRows && kegRows.length > 0) {
            sesiId = kegRows[0].id;
          } else {
            const [matRows] = await pool.query("SELECT id FROM materi_hafalan WHERE LOWER(TRIM(nama_materi)) = LOWER(TRIM(?)) LIMIT 1", [kegiatanName]);
            if (matRows && matRows.length > 0) {
              sesiId = matRows[0].id;
            }
          }
        } catch (eLookup) {}
      }
      if (!sesiId || isNaN(sesiId) || sesiId <= 0) {
        sesiId = 1;
      }

      const st = item.status || item.status_kehadiran || 'Hadir';
      const ket = item.keterangan || `NWF Mobile: ${kegiatanName}`;
      const itemMusyrif = item.musyrif_verifikator || item.nama_ustadz || null;

      const [existing] = await pool.query(`
        SELECT id FROM absensi_jamaah_mengaji 
        WHERE tanggal = ? AND santri_id = ? AND (nama_kegiatan = ? OR (sesi_id IS NOT NULL AND sesi_id = ?))
        LIMIT 1
      `, [tgl, item.santri_id, kegiatanName, sesiId]).catch(() => [[]]);

      if (existing && existing.length > 0) {
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?, nama_kegiatan = ?, tipe_presensi = ?, sesi_id = ?,
              musyrif_verifikator = COALESCE(?, musyrif_verifikator),
              nama_ustadz = COALESCE(?, nama_ustadz)
          WHERE id = ?
        `, [st, scanTime, mt, ket, kegiatanName, tipe, sesiId, itemMusyrif, itemMusyrif, existing[0].id]).catch(() => {});
      } else {
        await pool.query(`
          INSERT INTO absensi_jamaah_mengaji (
            tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan, musyrif_verifikator, nama_ustadz
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
        `, [tgl, sesiId, kegiatanName, tipe, item.santri_id, scanTime, st, mt, ket, itemMusyrif, itemMusyrif]).catch(() => {});

        const notifCopy = buildAbsensiNotifText({
          namaSantri: item.nama_santri || 'Ananda',
          kegiatan: kegiatanName,
          status: st,
          waktu: scanTime
        });
        createWaliNotification({
          santri_id: item.santri_id,
          kategori: 'absensi',
          judul: notifCopy.judul,
          pesan: notifCopy.pesan,
          target_tab: 'absensi'
        });

        triggerAutoPresensiWA({
          santri_id: item.santri_id,
          nama_santri: item.nama_santri,
          kegiatan: kegiatanName,
          status: st,
          waktu: scanTime
        }).catch(() => {});
      }
      syncedCount++;
    }

    return sendSuccess(res, `${syncedCount} log presensi NWF Mobile berhasil disinkronkan ke server`, { synced: syncedCount });
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const updateAbsensiFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_kehadiran, keterangan, keteledoran_keterangan, metode_presensi, metode_scan } = req.body;
    const finalSt = status || status_kehadiran || 'Hadir Tepat Waktu';
    const finalMt = metode_presensi || metode_scan || 'Fingerprint';
    const finalKt = keterangan || keteledoran_keterangan || '';

    await pool.query(`
      UPDATE absensi_jamaah_mengaji SET
        status = ?, metode_presensi = ?, keterangan = ?
      WHERE id = ?
    `, [finalSt, finalMt, finalKt, id]);
    return sendSuccess(res, 'Presensi berhasil diperbarui');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const deleteAbsensiFingerprint = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const { id } = req.params;
    const bodySantriId = req.body?.santri_id || req.query?.santri_id;
    const bodyTanggal = req.body?.tanggal || req.query?.tanggal;
    const bodyWaktuScan = req.body?.waktu_scan || req.query?.waktu_scan || req.body?.jam_scan;

    if (!id && !bodySantriId) {
      return sendError(res, 'ID atau santri_id presensi wajib disertakan', 400);
    }
    if (String(id).startsWith('izin-')) {
      return sendError(res, 'Presensi ini sinkronisasi otomatis dari modul Perizinan. Hapus perizinan santri pada menu Perizinan.', 400);
    }

    // 1. Ambil baris data yang ingin dihapus untuk disimpan ke absensi_deleted_logs
    let targetRows = [];
    if (id && !isNaN(Number(id))) {
      const [f1] = await pool.query('SELECT * FROM absensi_jamaah_mengaji WHERE id = ?', [id]).catch(() => [[]]);
      if (f1 && f1.length > 0) targetRows = f1;
    }
    if (targetRows.length === 0 && bodySantriId && bodyTanggal) {
      const [f2] = await pool.query('SELECT * FROM absensi_jamaah_mengaji WHERE santri_id = ? AND tanggal = ?', [bodySantriId, bodyTanggal]).catch(() => [[]]);
      if (f2 && f2.length > 0) targetRows = f2;
    }

    // 2. Catat ke absensi_deleted_logs agar mesin MP340 & ADMS tidak otomatis menginsert ulang log ini
    for (const row of targetRows) {
      await pool.query(`
        INSERT INTO absensi_deleted_logs (santri_id, tanggal, waktu_scan, sesi_id, nama_kegiatan)
        VALUES (?, ?, ?, ?, ?)
      `, [row.santri_id, row.tanggal, row.waktu_scan || bodyWaktuScan, row.sesi_id, row.nama_kegiatan]).catch(() => {});
    }

    if (targetRows.length === 0 && bodySantriId && bodyTanggal) {
      await pool.query(`
        INSERT INTO absensi_deleted_logs (santri_id, tanggal, waktu_scan, sesi_id, nama_kegiatan)
        VALUES (?, ?, ?, NULL, 'Dihapus Admin')
      `, [bodySantriId, bodyTanggal, bodyWaktuScan || null]).catch(() => {});
    }

    // 3. Eksekusi Hapus dari tabel absensi_jamaah_mengaji
    let deletedCount = 0;
    if (id && !isNaN(Number(id))) {
      const [delRes] = await pool.query('DELETE FROM absensi_jamaah_mengaji WHERE id = ?', [id]).catch(() => [{ affectedRows: 0 }]);
      deletedCount += (delRes?.affectedRows || 0);
    }

    if (bodySantriId && bodyTanggal) {
      const [delRes2] = await pool.query('DELETE FROM absensi_jamaah_mengaji WHERE santri_id = ? AND tanggal = ?', [bodySantriId, bodyTanggal]).catch(() => [{ affectedRows: 0 }]);
      deletedCount += (delRes2?.affectedRows || 0);
    }

    return sendSuccess(res, 'Presensi berhasil dihapus permanen dari database');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const getFingerprintDevices = async (req, res) => {
  try {
    // Mesin dianggap Online jika ada aktivitas/heartbeat ADMS dalam 3 menit terakhir
    try {
      await pool.query(`
        UPDATE fingerprint_device 
        SET status_koneksi = 'Offline' 
        WHERE (updated_at IS NULL OR updated_at < NOW() - INTERVAL 3 MINUTE)
      `);
    } catch (eHeartbeat) {}

    const [rows] = await pool.query('SELECT * FROM fingerprint_device ORDER BY id ASC');
    return sendSuccess(res, 'Data perangkat fingerprint berhasil diambil', { data: rows });
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const createFingerprintDevice = async (req, res) => {
  try {
    const { nama_device, sn_device, ip_address, port, lokasi, peruntukan, status_koneksi } = req.body;
    const [result] = await pool.query(`
      INSERT INTO fingerprint_device (nama_device, sn_device, ip_address, port, lokasi, peruntukan, status_koneksi)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nama_device, sn_device, ip_address, port || 4370, lokasi, peruntukan || 'Semua', status_koneksi || 'Online']);
    return sendSuccess(res, 'Mesin fingerprint berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const updateFingerprintDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_device, sn_device, ip_address, port, lokasi, peruntukan, status_koneksi } = req.body;
    await pool.query(`
      UPDATE fingerprint_device SET
        nama_device = ?, sn_device = ?, ip_address = ?, port = ?, lokasi = ?, peruntukan = ?, status_koneksi = ?
      WHERE id = ?
    `, [nama_device, sn_device, ip_address, port || 4370, lokasi, peruntukan || 'Semua', status_koneksi || 'Online', id]);
    return sendSuccess(res, 'Mesin fingerprint berhasil diperbarui');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const deleteFingerprintDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fingerprint_device WHERE id = ?', [id]);
    return sendSuccess(res, 'Mesin fingerprint berhasil dihapus');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const getFingerprintSesi = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const [rows] = await pool.query('SELECT * FROM kegiatan_sesi ORDER BY jam_mulai_presensi ASC');
    return sendSuccess(res, 'Sesi presensi berhasil diambil', { data: rows });
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const createFingerprintSesi = async (req, res) => {
  try {
    const { 
      kode_sesi, 
      nama_sesi, 
      kategori, 
      jam_mulai_presensi, 
      jam_target, 
      jam_toleransi_telat, 
      jam_tutup_presensi, 
      hari_aktif, 
      tipe_peserta, 
      target_gender, 
      target_tipe_santri, 
      peserta_santri_ids, 
      is_active, 
      keterangan 
    } = req.body;

    const finalKode = kode_sesi || `SESI-${Date.now()}`;
    const finalPesertaIds = typeof peserta_santri_ids === 'object' ? JSON.stringify(peserta_santri_ids) : (peserta_santri_ids || null);

    try {
      const [result] = await pool.query(`
        INSERT INTO kegiatan_sesi (
          kode_sesi, nama_sesi, kategori, 
          jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi, 
          hari_aktif, tipe_peserta, target_gender, target_tipe_santri, 
          peserta_santri_ids, is_active, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalKode, nama_sesi, kategori || 'Shalat Berjamaah',
        jam_mulai_presensi || '04:15:00', jam_target || '04:40:00',
        jam_toleransi_telat || '04:45:00', jam_tutup_presensi || '05:15:00',
        hari_aktif || 'Semua', tipe_peserta || 'Wajib Semua Santri',
        target_gender || 'Semua', target_tipe_santri || 'Semua',
        finalPesertaIds, is_active !== undefined ? is_active : 1, keterangan || ''
      ]);

      return sendSuccess(res, 'Kegiatan berhasil ditambahkan', { id: result.insertId }, 201);
    } catch (insertErr) {
      // Fallback jika tabel di database belum memiliki kolom baru (tipe_peserta/keterangan/peserta_santri_ids)
      console.warn('Fallback insert kegiatan_sesi:', insertErr.message);
      const [result] = await pool.query(`
        INSERT INTO kegiatan_sesi (
          kode_sesi, nama_sesi, kategori, 
          jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi, 
          hari_aktif, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalKode, nama_sesi, kategori || 'Shalat Berjamaah',
        jam_mulai_presensi || '04:15:00', jam_target || '04:40:00',
        jam_toleransi_telat || '04:45:00', jam_tutup_presensi || '05:15:00',
        hari_aktif || 'Semua', is_active !== undefined ? is_active : 1
      ]);

      return sendSuccess(res, 'Kegiatan berhasil ditambahkan', { id: result.insertId }, 201);
    }
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const updateFingerprintSesi = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      kode_sesi, 
      nama_sesi, 
      kategori, 
      jam_mulai_presensi, 
      jam_target, 
      jam_toleransi_telat, 
      jam_tutup_presensi, 
      hari_aktif, 
      tipe_peserta, 
      target_gender, 
      target_tipe_santri, 
      peserta_santri_ids, 
      is_active, 
      keterangan 
    } = req.body;

    const finalPesertaIds = typeof peserta_santri_ids === 'object' ? JSON.stringify(peserta_santri_ids) : (peserta_santri_ids || null);

    try {
      await pool.query(`
        UPDATE kegiatan_sesi SET 
          kode_sesi = COALESCE(?, kode_sesi),
          nama_sesi = COALESCE(?, nama_sesi),
          kategori = COALESCE(?, kategori),
          jam_mulai_presensi = COALESCE(?, jam_mulai_presensi),
          jam_target = COALESCE(?, jam_target),
          jam_toleransi_telat = COALESCE(?, jam_toleransi_telat),
          jam_tutup_presensi = COALESCE(?, jam_tutup_presensi),
          hari_aktif = COALESCE(?, hari_aktif),
          tipe_peserta = COALESCE(?, tipe_peserta),
          target_gender = COALESCE(?, target_gender),
          target_tipe_santri = COALESCE(?, target_tipe_santri),
          peserta_santri_ids = ?,
          is_active = COALESCE(?, is_active),
          keterangan = COALESCE(?, keterangan)
        WHERE id = ?
      `, [
        kode_sesi, nama_sesi, kategori,
        jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi,
        hari_aktif, tipe_peserta, target_gender, target_tipe_santri,
        finalPesertaIds, is_active, keterangan, id
      ]);
    } catch (updateErr) {
      // Fallback jika tabel hanya memiliki kolom dasar
      console.warn('Fallback update kegiatan_sesi:', updateErr.message);
      await pool.query(`
        UPDATE kegiatan_sesi SET 
          kode_sesi = COALESCE(?, kode_sesi),
          nama_sesi = COALESCE(?, nama_sesi),
          kategori = COALESCE(?, kategori),
          jam_mulai_presensi = COALESCE(?, jam_mulai_presensi),
          jam_target = COALESCE(?, jam_target),
          jam_toleransi_telat = COALESCE(?, jam_toleransi_telat),
          jam_tutup_presensi = COALESCE(?, jam_tutup_presensi),
          hari_aktif = COALESCE(?, hari_aktif),
          is_active = COALESCE(?, is_active)
        WHERE id = ?
      `, [
        kode_sesi, nama_sesi, kategori,
        jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi,
        hari_aktif, is_active, id
      ]);
    }

    return sendSuccess(res, 'Kegiatan berhasil diperbarui');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

export const deleteFingerprintSesi = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kegiatan_sesi WHERE id = ?', [id]);
    return sendSuccess(res, 'Kegiatan berhasil dihapus');
  } catch (err) {
    console.error('[createAbsensiFingerprint Error]', err);
    return sendError(res, err.message, 500);
  }
};

