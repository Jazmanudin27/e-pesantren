import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * Pastikan tabel-tabel esensial untuk Pengajar tersedia
 */
export const ensurePengajarTables = async () => {
  try {
    // 1. Sesi Kegiatan Mengaji Default
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`kegiatan_sesi\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_sesi\` VARCHAR(50) DEFAULT NULL,
        \`nama_sesi\` VARCHAR(150) NOT NULL,
        \`kategori\` VARCHAR(50) DEFAULT 'Mengaji',
        \`jam_mulai_presensi\` TIME DEFAULT '05:00:00',
        \`jam_target\` TIME DEFAULT '05:30:00',
        \`jam_toleransi_telat\` TIME DEFAULT '05:45:00',
        \`jam_tutup_presensi\` TIME DEFAULT '06:15:00',
        \`is_active\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Pastikan kolom-kolom standar kegiatan_sesi tersedia jika tabel lama sudah ada
    try {
      await pool.query(`ALTER TABLE \`kegiatan_sesi\` ADD COLUMN IF NOT EXISTS \`jam_mulai_presensi\` TIME DEFAULT '05:00:00'`);
      await pool.query(`ALTER TABLE \`kegiatan_sesi\` ADD COLUMN IF NOT EXISTS \`jam_tutup_presensi\` TIME DEFAULT '06:15:00'`);
      await pool.query(`ALTER TABLE \`kegiatan_sesi\` ADD COLUMN IF NOT EXISTS \`kode_sesi\` VARCHAR(50) DEFAULT NULL`);
      // Hapus data fake sesi yang sempat terbuat otomatis
      await pool.query("DELETE FROM `kegiatan_sesi` WHERE `kode_sesi` IN ('MNGJ-01', 'MNGJ-02', 'MNGJ-03', 'MNGJ-04')");
    } catch (eCol) {}

    // 2. Tabel Presensi Jamaah & Mengaji
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`absensi_jamaah_mengaji\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`sesi_id\` INT DEFAULT NULL,
        \`nama_kegiatan\` VARCHAR(150) DEFAULT 'Mengaji',
        \`tanggal\` DATE NOT NULL,
        \`waktu_scan\` TIME DEFAULT '00:00:00',
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'Hadir',
        \`status_kehadiran\` VARCHAR(50) DEFAULT 'Hadir',
        \`metode_presensi\` VARCHAR(50) DEFAULT 'Manual_Ustadz',
        \`keterangan\` VARCHAR(255) DEFAULT NULL,
        \`nama_ustadz\` VARCHAR(150) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_pengajar_tgl_sesi\` (\`tanggal\`, \`sesi_id\`),
        INDEX \`idx_pengajar_santri\` (\`santri_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabel Teguran / Pelanggaran
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`tata_tertib_pelanggaran\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`tanggal\` DATE NOT NULL,
        \`kategori\` VARCHAR(50) DEFAULT 'Ringan',
        \`jenis_pelanggaran\` VARCHAR(255) NOT NULL,
        \`poin_pelanggaran\` INT DEFAULT 5,
        \`bentuk_tazir\` VARCHAR(255) DEFAULT 'Membaca Surat Yasin',
        \`status_tazir\` VARCHAR(50) DEFAULT 'Belum Dikerjakan',
        \`musyrif_pencatat\` VARCHAR(150) DEFAULT 'Ustadz Pengajar',
        \`wa_notif_wali\` TINYINT(1) DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_pelanggaran_santri\` (\`santri_id\`),
        INDEX \`idx_pelanggaran_tgl\` (\`tanggal\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabel Praktek Ibadah
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`praktek_ibadah\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`kategori\` VARCHAR(150) NOT NULL,
        \`nama_praktek\` VARCHAR(150) DEFAULT NULL,
        \`deskripsi\` TEXT DEFAULT NULL,
        \`nilai_gerakan\` DECIMAL(5,2) DEFAULT 0,
        \`nilai_bacaan\` DECIMAL(5,2) DEFAULT 0,
        \`nilai_adab\` DECIMAL(5,2) DEFAULT 0,
        \`nilai_akhir\` DECIMAL(5,2) DEFAULT 0,
        \`predikat\` VARCHAR(50) DEFAULT 'Lulus',
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'Lulus',
        \`nama_penguji\` VARCHAR(150) DEFAULT 'Ustadz Penguji',
        \`catatan_perbaikan\` TEXT DEFAULT NULL,
        \`tanggal_ujian\` DATE NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_praktek_santri\` (\`santri_id\`),
        INDEX \`idx_praktek_kategori\` (\`kategori\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tabel Perkembangan Santri
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`santri_laporan_perkembangan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL,
        \`periode\` VARCHAR(100) NOT NULL,
        \`tanggal_laporan\` DATE NOT NULL,
        \`nilai_akademik\` TEXT DEFAULT NULL,
        \`catatan_akademik\` TEXT DEFAULT NULL,
        \`catatan_hafalan\` TEXT DEFAULT NULL,
        \`catatan_perilaku\` TEXT DEFAULT NULL,
        \`catatan_ibadah\` TEXT DEFAULT NULL,
        \`catatan_ustadz\` TEXT DEFAULT NULL,
        \`nama_penulis\` VARCHAR(150) DEFAULT 'Ustadz Pembina',
        \`status_publikasi\` VARCHAR(50) DEFAULT 'Diterbitkan',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_perkembangan_santri\` (\`santri_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Auto-generate Username & Password untuk semua Asatidz yang masih NULL / Kosong (SHA-256 Aman)
    try {
      await pool.query(`ALTER TABLE asatidz MODIFY COLUMN password VARCHAR(255) DEFAULT NULL`);
      await pool.query(`
        UPDATE asatidz 
        SET 
          username = COALESCE(NULLIF(TRIM(username), ''), LOWER(REPLACE(COALESCE(nik_niy, CONCAT('ustadz', id)), ' ', ''))),
          password = COALESCE(NULLIF(TRIM(password), ''), SHA2('123456', 256))
        WHERE username IS NULL OR TRIM(username) = '' OR password IS NULL OR TRIM(password) = ''
      `);
    } catch (uErr) {
      console.warn('[AUTOGEN ASATIDZ CREDENTIALS]', uErr.message);
    }
  } catch (err) {
    console.warn('[PENGAJAR DB INIT NOTICE]', err.message);
  }
};

/**
 * 1. GET /api/pengajar/dashboard
 * Dashboard Utama Ustadz / Pengajar
 */
export const getPengajarDashboard = async (req, res) => {
  await ensurePengajarTables();
  try {
    const [[santriStat]] = await pool.query("SELECT COUNT(*) as total_santri FROM santri WHERE status = 'Aktif'");
    
    // Presensi Mengaji Hari Ini
    const [presensiRows] = await pool.query(`
      SELECT 
        COALESCE(status, status_kehadiran, 'Hadir') as st,
        COUNT(*) as jml
      FROM absensi_jamaah_mengaji
      WHERE tanggal = CURDATE()
      GROUP BY COALESCE(status, status_kehadiran, 'Hadir')
    `).catch(() => [[]]);

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;

    for (const r of presensiRows) {
      const s = String(r.st || '').toLowerCase();
      if (s.includes('sakit')) sakit += Number(r.jml);
      else if (s.includes('izin')) izin += Number(r.jml);
      else if (s.includes('alfa') || s.includes('alpha') || s.includes('teledor')) alfa += Number(r.jml);
      else hadir += Number(r.jml);
    }

    const totalAbsen = hadir + sakit + izin + alfa;
    const persenHadir = totalAbsen > 0 ? Math.round((hadir / totalAbsen) * 100) : 0;

    // Total Teguran Bulan Ini
    const [[teguranStat]] = await pool.query(`
      SELECT COUNT(*) as total_teguran 
      FROM tata_tertib_pelanggaran 
      WHERE MONTH(tanggal) = MONTH(CURDATE()) AND YEAR(tanggal) = YEAR(CURDATE())
    `).catch(() => [[{ total_teguran: 0 }]]);

    // Total Praktek Ibadah Bulan Ini
    const [[praktekStat]] = await pool.query(`
      SELECT COUNT(*) as total_praktek 
      FROM praktek_ibadah 
      WHERE MONTH(tanggal_ujian) = MONTH(CURDATE()) AND YEAR(tanggal_ujian) = YEAR(CURDATE())
    `).catch(() => [[{ total_praktek: 0 }]]);

    // Total Laporan Perkembangan
    const [[perkembanganStat]] = await pool.query(`
      SELECT COUNT(*) as total_perkembangan 
      FROM santri_laporan_perkembangan
    `).catch(() => [[{ total_perkembangan: 0 }]]);

    // Sesi Mengaji Aktif Asli dari Database
    let sesiRows = [];
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, 
          nama_sesi, 
          COALESCE(jam_mulai_presensi, '00:00:00') as jam_mulai, 
          COALESCE(jam_tutup_presensi, jam_target, '00:00:00') as jam_selesai, 
          kategori 
        FROM kegiatan_sesi 
        WHERE is_active = 1 
        ORDER BY id ASC
      `);
      sesiRows = rows || [];
    } catch (e) {
      sesiRows = [];
    }

    return sendSuccess(res, 'Dashboard Pengajar Berhasil Dimuat', {
      totalSantri: Number(santriStat?.total_santri || 0),
      presensiHariIni: {
        total: totalAbsen,
        hadir,
        sakit,
        izin,
        alfa,
        persenHadir
      },
      totalTeguranBulanIni: Number(teguranStat?.total_teguran || 0),
      totalPraktekBulanIni: Number(praktekStat?.total_praktek || 0),
      totalPerkembangan: Number(perkembanganStat?.total_perkembangan || 0),
      daftarSesi: sesiRows || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat dashboard pengajar: ${err.message}`, 500);
  }
};

/**
 * 2. GET /api/pengajar/santri
 * Daftar Santri Aktif untuk Pilihan Input Pengajar
 */
export const getPengajarSantri = async (req, res) => {
  try {
    const search = req.query.search || '';
    let sql = `
      SELECT 
        s.id,
        s.nama_santri,
        s.nis,
        s.nisn,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama,
        COALESCE(k.nama_kamar, '') as nama_kamar,
        COALESCE(s.jk, 'L') as jenis_kelamin,
        s.face_descriptor,
        s.foto
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE s.status = 'Aktif'
    `;
    const params = [];
    if (search) {
      sql += ' AND (s.nama_santri LIKE ? OR s.nis LIKE ? OR s.nama_kelas LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY s.nama_santri ASC';

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Data Santri Pengajar Berhasil Dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat santri: ${err.message}`, 500);
  }
};

/**
 * 3. GET & POST /api/pengajar/absen-mengaji
 * Presensi Mengaji Santri
 */
export const getAbsenMengaji = async (req, res) => {
  await ensurePengajarTables();
  try {
    const tanggal = req.query.tanggal || new Date().toISOString().split('T')[0];
    const sesiId = req.query.sesi_id ? parseInt(req.query.sesi_id, 10) : null;
    const kelasFilter = req.query.kelas || '';

    // Ambil data santri aktif
    let santriSql = `
      SELECT s.id, s.nama_santri, s.nis, COALESCE(s.nama_kelas, '') as nama_kelas,
             COALESCE(a.nama_asrama, '') as nama_asrama,
             COALESCE(s.jk, 'L') as jenis_kelamin,
             s.face_descriptor,
             s.foto
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      WHERE s.status = 'Aktif'
    `;
    const santriParams = [];
    if (kelasFilter) {
      santriSql += ' AND s.nama_kelas = ?';
      santriParams.push(kelasFilter);
    }
    santriSql += ' ORDER BY s.nama_santri ASC';

    const [santriRows] = await pool.query(santriSql, santriParams);

    // Ambil absensi yang sudah tercatat
    let absSql = `
      SELECT id, santri_id, status, status_kehadiran, keterangan, waktu_scan, nama_ustadz
      FROM absensi_jamaah_mengaji
      WHERE tanggal = ?
    `;
    const absParams = [tanggal];
    if (sesiId) {
      absSql += ' AND sesi_id = ?';
      absParams.push(sesiId);
    }

    const [absRows] = await pool.query(absSql, absParams).catch(() => [[]]);
    const absMap = new Map();
    (absRows || []).forEach(r => absMap.set(r.santri_id, r));

    // Gabungkan data: default Hadir jika belum diabsen
    const list = santriRows.map(s => {
      const existing = absMap.get(s.id);
      return {
        santri_id: s.id,
        nama_santri: s.nama_santri,
        nis: s.nis,
        nama_kelas: s.nama_kelas,
        nama_asrama: s.nama_asrama,
        jenis_kelamin: s.jenis_kelamin,
        face_descriptor: s.face_descriptor,
        foto: s.foto,
        status: existing ? (existing.status || existing.status_kehadiran || 'Hadir') : 'Hadir',
        keterangan: existing?.keterangan || '',
        waktu_scan: existing?.waktu_scan || '-',
        nama_ustadz: existing?.nama_ustadz || '',
        is_recorded: Boolean(existing)
      };
    });

    return sendSuccess(res, 'Presensi Mengaji Berhasil Dimuat', {
      tanggal,
      sesi_id: sesiId,
      totalSantri: list.length,
      list
    });
  } catch (err) {
    return sendError(res, `Gagal memuat absen mengaji: ${err.message}`, 500);
  }
};

export const saveAbsenMengajiBatch = async (req, res) => {
  await ensurePengajarTables();
  const connection = await pool.getConnection();
  try {
    const { tanggal, sesi_id, nama_sesi, nama_ustadz, items, metode_presensi } = req.body;
    if (!tanggal || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Data presensi tidak lengkap', 400);
    }

    await connection.beginTransaction();

    const tgl = tanggal;
    const sId = sesi_id || null;
    const ustadz = nama_ustadz || 'Ustadz Pengajar';
    const kegiatan = nama_sesi || 'Mengaji & Kajian Kitab';

    for (const item of items) {
      const statusFinal = item.status || 'Hadir';
      const ket = item.keterangan || '';
      const metode = item.metode_presensi || metode_presensi || 'Manual_Ustadz';
      
      // Cek apakah sudah ada catatan
      const [existing] = await connection.query(`
        SELECT id FROM absensi_jamaah_mengaji 
        WHERE santri_id = ? AND tanggal = ? ${sId ? 'AND sesi_id = ?' : ''}
        LIMIT 1
      `, sId ? [item.santri_id, tgl, sId] : [item.santri_id, tgl]);

      if (existing && existing.length > 0) {
        await connection.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, status_kehadiran = ?, metode_presensi = ?, keterangan = ?, nama_ustadz = ?, waktu_scan = CURTIME(), updated_at = NOW()
          WHERE id = ?
        `, [statusFinal, statusFinal, metode, ket, ustadz, existing[0].id]);
      } else {
        await connection.query(`
          INSERT INTO absensi_jamaah_mengaji 
          (santri_id, sesi_id, nama_kegiatan, tanggal, waktu_scan, status, status_kehadiran, metode_presensi, keterangan, nama_ustadz)
          VALUES (?, ?, ?, ?, CURTIME(), ?, ?, ?, ?, ?)
        `, [item.santri_id, sId, kegiatan, tgl, statusFinal, statusFinal, metode, ket, ustadz]);
      }
    }

    await connection.commit();
    return sendSuccess(res, `Berhasil menyimpan presensi mengaji untuk ${items.length} santri`);
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal menyimpan presensi: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * 3b. GET /api/pengajar/absen-mengaji/history
 * Riwayat Histori Presensi Mengaji
 */
export const getAbsenMengajiHistory = async (req, res) => {
  await ensurePengajarTables();
  try {
    const { tanggal, sesi_id, kelas, limit = 100 } = req.query;
    let sql = `
      SELECT 
        a.id,
        a.santri_id,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        DATE_FORMAT(a.tanggal, '%Y-%m-%d') as tanggal,
        a.sesi_id,
        COALESCE(ks.nama_sesi, a.nama_kegiatan, 'Mengaji') as nama_sesi,
        COALESCE(a.status, a.status_kehadiran, 'Hadir') as status,
        DATE_FORMAT(a.waktu_scan, '%H:%i') as waktu_scan,
        a.metode_presensi,
        a.keterangan,
        a.nama_ustadz
      FROM absensi_jamaah_mengaji a
      JOIN santri s ON a.santri_id = s.id
      LEFT JOIN kegiatan_sesi ks ON a.sesi_id = ks.id
      WHERE 1=1
    `;
    const params = [];
    if (tanggal) {
      sql += ' AND a.tanggal = ?';
      params.push(tanggal);
    }
    if (sesi_id) {
      sql += ' AND a.sesi_id = ?';
      params.push(sesi_id);
    }
    if (kelas && kelas !== 'Semua') {
      sql += ' AND s.nama_kelas = ?';
      params.push(kelas);
    }
    sql += ' ORDER BY a.tanggal DESC, a.waktu_scan DESC, a.id DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 100);

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Histori Presensi Mengaji Berhasil Dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat histori: ${err.message}`, 500);
  }
};

/**
 * 4. GET & POST /api/pengajar/teguran
 * Catatan Teguran & Ta'zir Santri
 */
export const getTeguranList = async (req, res) => {
  await ensurePengajarTables();
  try {
    const [rows] = await pool.query(`
      SELECT 
        tp.*,
        DATE_FORMAT(tp.tanggal, '%Y-%m-%d') as tanggal,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama,
        COALESCE(k.nama_kamar, '') as nama_kamar
      FROM tata_tertib_pelanggaran tp
      JOIN santri s ON tp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY tp.tanggal DESC, tp.id DESC
      LIMIT 100
    `);
    return sendSuccess(res, 'Daftar Teguran Santri Berhasil Dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat teguran: ${err.message}`, 500);
  }
};

export const createTeguran = async (req, res) => {
  await ensurePengajarTables();
  try {
    const {
      santri_id, tanggal, kategori = 'Ringan', jenis_pelanggaran,
      poin_pelanggaran = 5, bentuk_tazir = 'Membaca Surat Yasin',
      status_tazir = 'Belum Dikerjakan', musyrif_pencatat = 'Ustadz Pengajar'
    } = req.body;

    if (!santri_id || !jenis_pelanggaran) {
      return sendError(res, 'Santri dan jenis pelanggaran wajib diisi', 400);
    }

    const [resInsert] = await pool.query(`
      INSERT INTO tata_tertib_pelanggaran
      (santri_id, tanggal, kategori, jenis_pelanggaran, poin_pelanggaran, bentuk_tazir, status_tazir, musyrif_pencatat, wa_notif_wali)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      santri_id,
      tanggal || new Date().toISOString().split('T')[0],
      kategori,
      jenis_pelanggaran,
      parseInt(poin_pelanggaran, 10) || 5,
      bentuk_tazir,
      status_tazir,
      musyrif_pencatat
    ]);

    return sendSuccess(res, 'Catatan teguran berhasil disimpan', { id: resInsert.insertId });
  } catch (err) {
    return sendError(res, `Gagal menyimpan teguran: ${err.message}`, 500);
  }
};

export const updateStatusTazir = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_tazir = 'Selesai Dikerjakan' } = req.body;
    await pool.query('UPDATE tata_tertib_pelanggaran SET status_tazir = ? WHERE id = ?', [status_tazir, id]);
    return sendSuccess(res, 'Status ta\'zir berhasil diperbarui');
  } catch (err) {
    return sendError(res, `Gagal mengupdate ta'zir: ${err.message}`, 500);
  }
};

/**
 * 5. GET & POST /api/pengajar/praktek
 * Evaluasi Ujian & Praktek Ibadah
 */
export const getPraktekList = async (req, res) => {
  await ensurePengajarTables();
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        DATE_FORMAT(p.tanggal_ujian, '%Y-%m-%d') as tanggal_ujian,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama
      FROM praktek_ibadah p
      JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      ORDER BY p.tanggal_ujian DESC, p.id DESC
      LIMIT 100
    `);
    return sendSuccess(res, 'Daftar Praktek Ibadah Berhasil Dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat praktek ibadah: ${err.message}`, 500);
  }
};

export const savePraktek = async (req, res) => {
  await ensurePengajarTables();
  try {
    const {
      santri_id, kategori = 'Shalat Fardhu', nama_praktek = 'Praktek Shalat',
      nilai_gerakan = 80, nilai_bacaan = 80, nilai_adab = 85,
      nama_penguji = 'Ustadz Penguji', catatan_perbaikan = '',
      tanggal_ujian
    } = req.body;

    if (!santri_id) {
      return sendError(res, 'Santri wajib dipilih', 400);
    }

    const nG = parseFloat(nilai_gerakan) || 0;
    const nB = parseFloat(nilai_bacaan) || 0;
    const nA = parseFloat(nilai_adab) || 0;
    const nilaiAkhir = Math.round(((nG + nB + nA) / 3) * 100) / 100;
    const predikat = nilaiAkhir >= 85 ? 'Sangat Baik (Mumtaz)' : nilaiAkhir >= 75 ? 'Baik (Jayyid)' : 'Perlu Bimbingan';
    const status = nilaiAkhir >= 70 ? 'Lulus' : 'Remedial';

    const [insertRes] = await pool.query(`
      INSERT INTO praktek_ibadah
      (santri_id, kategori, nama_praktek, nilai_gerakan, nilai_bacaan, nilai_adab, nilai_akhir, predikat, status, nama_penguji, catatan_perbaikan, tanggal_ujian)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      santri_id,
      kategori,
      nama_praktek,
      nG,
      nB,
      nA,
      nilaiAkhir,
      predikat,
      status,
      nama_penguji,
      catatan_perbaikan,
      tanggal_ujian || new Date().toISOString().split('T')[0]
    ]);

    return sendSuccess(res, 'Evaluasi praktek ibadah berhasil disimpan', {
      id: insertRes.insertId,
      nilaiAkhir,
      predikat,
      status
    });
  } catch (err) {
    return sendError(res, `Gagal menyimpan praktek: ${err.message}`, 500);
  }
};

/**
 * 6. GET & POST /api/pengajar/perkembangan
 * Laporan Perkembangan Karakter & Ibadah Santri
 */
export const getPerkembanganList = async (req, res) => {
  await ensurePengajarTables();
  try {
    const [rows] = await pool.query(`
      SELECT 
        l.*,
        DATE_FORMAT(l.tanggal_laporan, '%Y-%m-%d') as tanggal_laporan,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama
      FROM santri_laporan_perkembangan l
      JOIN santri s ON l.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      ORDER BY l.tanggal_laporan DESC, l.id DESC
      LIMIT 100
    `);
    return sendSuccess(res, 'Daftar Laporan Perkembangan Berhasil Dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal memuat perkembangan: ${err.message}`, 500);
  }
};

export const savePerkembangan = async (req, res) => {
  await ensurePengajarTables();
  try {
    const {
      santri_id, periode = 'Bulan Ini', tanggal_laporan,
      catatan_akademik = '', catatan_hafalan = '', catatan_perilaku = '',
      catatan_ibadah = '', catatan_ustadz = '', nama_penulis = 'Ustadz Pembina'
    } = req.body;

    if (!santri_id) {
      return sendError(res, 'Santri wajib dipilih', 400);
    }

    const [insertRes] = await pool.query(`
      INSERT INTO santri_laporan_perkembangan
      (santri_id, periode, tanggal_laporan, catatan_akademik, catatan_hafalan, catatan_perilaku, catatan_ibadah, catatan_ustadz, nama_penulis, status_publikasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Diterbitkan')
    `, [
      santri_id,
      periode,
      tanggal_laporan || new Date().toISOString().split('T')[0],
      catatan_akademik,
      catatan_hafalan,
      catatan_perilaku,
      catatan_ibadah,
      catatan_ustadz,
      nama_penulis
    ]);

    return sendSuccess(res, 'Catatan perkembangan santri berhasil disimpan', { id: insertRes.insertId });
  } catch (err) {
    return sendError(res, `Gagal menyimpan perkembangan: ${err.message}`, 500);
  }
};

