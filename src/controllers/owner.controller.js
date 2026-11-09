import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * Otomatis membuat akun default Owner jika belum ada di database
 * Default login: username = 'owner', password = 'password'
 */
export const ensureOwnerAccount = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, role FROM users WHERE LOWER(TRIM(username)) = 'owner' OR LOWER(TRIM(role)) = 'owner' LIMIT 1"
    );
    if (!rows || rows.length === 0) {
      const hashed = bcrypt.hashSync('password', 10);
      try {
        await pool.query(`
          INSERT INTO users (name, username, email, password, role, status, phone)
          VALUES ('Owner / Yayasan', 'owner', 'owner@pesantren.id', ?, 'Owner', 'Active', '08123456789')
        `, [hashed]);
        console.log('[E-PESANTREN DB] Akun Owner otomatis dibuat: Username "owner", Password "password"');
      } catch (ePhone) {
        await pool.query(`
          INSERT INTO users (name, username, email, password, role, status)
          VALUES ('Owner / Yayasan', 'owner', 'owner@pesantren.id', ?, 'Owner', 'Active')
        `, [hashed]);
        console.log('[E-PESANTREN DB] Akun Owner otomatis dibuat: Username "owner", Password "password"');
      }
    } else {
      // Pastikan akun owner yang sudah ada dipastikan role = 'Owner' & status = 'Active'
      try {
        await pool.query("UPDATE users SET role = 'Owner', status = 'Active' WHERE LOWER(TRIM(username)) = 'owner'");
      } catch (eUpd) {}
    }
  } catch (err) {
    console.warn('[E-PESANTREN DB] ensureOwnerAccount notice:', err.message);
  }
};

/**
 * Helper: Ambil rentang tanggal berdasarkan filter periode ('hari_ini', 'bulan_ini', 'tahun_ini')
 */
const getPeriodeDateCondition = (periode, dateColumn = 'tanggal') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (periode === 'hari_ini') {
    return {
      sql: `AND DATE(${dateColumn}) = ?`,
      params: [todayStr]
    };
  } else if (periode === 'tahun_ini') {
    return {
      sql: `AND YEAR(${dateColumn}) = ?`,
      params: [y]
    };
  } else {
    // Default: bulan_ini
    return {
      sql: `AND YEAR(${dateColumn}) = ? AND MONTH(${dateColumn}) = ?`,
      params: [y, now.getMonth() + 1]
    };
  }
};

/**
 * 1. GET /api/owner/summary
 * Executive High-Level KPI Summary
 */
export const getOwnerSummary = async (req, res) => {
  try {
    const [[santriStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_santri,
        SUM(CASE WHEN LOWER(COALESCE(jenis_kelamin, tipe_santri, '')) IN ('l', 'laki-laki', 'putra', 'ikhwan') THEN 1 ELSE 0 END) as santri_putra,
        SUM(CASE WHEN LOWER(COALESCE(jenis_kelamin, tipe_santri, '')) IN ('p', 'perempuan', 'putri', 'akhwat') THEN 1 ELSE 0 END) as santri_putri
      FROM santri 
      WHERE status = 'Aktif'
    `);

    // Izin Aktif Keluar
    const [[izinStats]] = await pool.query(`
      SELECT COUNT(*) as total_izin_aktif 
      FROM santri_perizinan 
      WHERE status = 'Aktif Keluar'
    `).catch(() => [[{ total_izin_aktif: 0 }]]);

    // Keuangan: Total Kas Masuk Berhasil & Total Piutang Tunggakan
    const [[keuStats]] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_bayar), 0) as total_kas_masuk
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil'
    `).catch(() => [[{ total_kas_masuk: 0 }]]);

    const [[tunggakanStats]] = await pool.query(`
      SELECT 
        COALESCE(SUM(sisa_tagihan), 0) as total_piutang
      FROM keuangan_tagihan
      WHERE status IN ('Belum Dibayar', 'Sebagian')
    `).catch(() => [[{ total_piutang: 0 }]]);

    // Infak Masuk
    const [[infakStats]] = await pool.query(`
      SELECT COALESCE(SUM(nominal), 0) as total_infak
      FROM pesantren_infak_transaksi
      WHERE status = 'Berhasil' OR status = 'Lunas'
    `).catch(() => [[{ total_infak: 0 }]]);

    // Presensi Hari Ini
    const [absensiRows] = await pool.query(`
      SELECT 
        status,
        COUNT(*) as jml
      FROM absensi_jamaah_mengaji
      WHERE tanggal = CURDATE()
      GROUP BY status
    `).catch(() => [[]]);

    let absHadir = 0;
    let absSakit = 0;
    let absIzin = 0;
    let absAlfa = 0;

    for (const r of absensiRows) {
      const st = String(r.status || '').toLowerCase();
      if (st.includes('hadir')) absHadir += Number(r.jml);
      else if (st.includes('sakit')) absSakit += Number(r.jml);
      else if (st.includes('izin')) absIzin += Number(r.jml);
      else if (st.includes('alfa') || st.includes('alpha')) absAlfa += Number(r.jml);
      else absHadir += Number(r.jml);
    }

    const totalAbsen = absHadir + absSakit + absIzin + absAlfa;
    const persenHadir = totalAbsen > 0 ? Math.round((absHadir / totalAbsen) * 100) : 0;

    return sendSuccess(res, 'Owner Summary Berhasil Dimuat', {
      totalSantri: santriStats?.total_santri || 0,
      santriPutra: santriStats?.santri_putra || 0,
      santriPutri: santriStats?.santri_putri || 0,
      totalIzinAktif: izinStats?.total_izin_aktif || 0,
      totalKasMasuk: Number(keuStats?.total_kas_masuk || 0),
      totalPiutang: Number(tunggakanStats?.total_piutang || 0),
      totalInfak: Number(infakStats?.total_infak || 0),
      presensiHariIni: {
        total: totalAbsen,
        hadir: absHadir,
        sakit: absSakit,
        izin: absIzin,
        alfa: absAlfa,
        persenHadir
      }
    });
  } catch (err) {
    return sendError(res, `Gagal memuat owner summary: ${err.message}`, 500);
  }
};

/**
 * 2. GET /api/owner/keuangan
 * Laporan Khusus Keuangan Kas, Transaksi, Piutang & Infak (Read-Only)
 */
export const getOwnerKeuangan = async (req, res) => {
  try {
    const periode = req.query.periode || 'bulan_ini';
    const dateCond = getPeriodeDateCondition(periode, 'tanggal_bayar');

    // 1. Ringkasan Kas Periode
    const [[kasPeriode]] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_bayar), 0) as kas_periode,
        COUNT(*) as total_transaksi
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil' ${dateCond.sql}
    `, dateCond.params).catch(() => [[{ kas_periode: 0, total_transaksi: 0 }]]);

    // 2. Total Kas Sepanjang Waktu
    const [[kasAll]] = await pool.query(`
      SELECT COALESCE(SUM(total_bayar), 0) as total_semua_kas
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil'
    `).catch(() => [[{ total_semua_kas: 0 }]]);

    // 3. Total Tunggakan / Piutang Belum Lunas
    const [[piutangAll]] = await pool.query(`
      SELECT 
        COALESCE(SUM(sisa_tagihan), 0) as total_piutang,
        COUNT(DISTINCT santri_id) as total_santri_menunggak
      FROM keuangan_tagihan
      WHERE status IN ('Belum Dibayar', 'Sebagian')
    `).catch(() => [[{ total_piutang: 0, total_santri_menunggak: 0 }]]);

    const limitNum = Math.min(Math.max(parseInt(req.query.limit, 10) || 1000, 10), 5000);

    // 4. Log Transaksi Pembayaran Kas Terakhir (Filtered by selected periode)
    const tpDateCond = getPeriodeDateCondition(periode, 'tp.tanggal_bayar');
    const [transaksiRows] = await pool.query(`
      SELECT 
        tp.id,
        tp.nomor_transaksi,
        tp.santri_id,
        tp.total_bayar,
        tp.metode_pembayaran,
        DATE_FORMAT(tp.tanggal_bayar, '%Y-%m-%d %H:%i') as tanggal_bayar,
        tp.kuitansi_nomor,
        tp.status_pembayaran,
        tp.keterangan,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas
      FROM keuangan_transaksi_pembayaran tp
      JOIN santri s ON tp.santri_id = s.id
      WHERE tp.status_pembayaran = 'Berhasil' ${tpDateCond.sql}
      ORDER BY tp.tanggal_bayar DESC, tp.id DESC
      LIMIT ?
    `, [...tpDateCond.params, limitNum]).catch(() => [[]]);

    // 5. Rekap Santri Penunggak (Seluruh santri yang menunggak tanpa batas 100)
    const [tunggakanRows] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        s.nama_wali,
        s.no_wa_wali,
        COUNT(t.id) as jumlah_tagihan,
        SUM(t.sisa_tagihan) as total_tunggakan
      FROM keuangan_tagihan t
      JOIN santri s ON t.santri_id = s.id
      WHERE t.status IN ('Belum Dibayar', 'Sebagian')
      GROUP BY s.id, s.nama_santri, s.nis, s.nama_kelas, s.nama_wali, s.no_wa_wali
      ORDER BY total_tunggakan DESC
    `).catch(() => [[]]);

    // 6. Rekap Infak & Sedekah (Filtered by selected periode)
    const itDateCond = getPeriodeDateCondition(periode, 'it.tanggal');
    const [infakRows] = await pool.query(`
      SELECT 
        it.id,
        it.nama_donatur,
        it.nominal,
        it.metode_pembayaran,
        DATE_FORMAT(it.tanggal, '%Y-%m-%d %H:%i') as tanggal,
        it.status,
        it.keterangan,
        pi.nama_program
      FROM pesantren_infak_transaksi it
      LEFT JOIN pesantren_program_infak pi ON it.program_id = pi.id
      WHERE (it.status = 'Berhasil' OR it.status = 'Lunas') ${itDateCond.sql}
      ORDER BY it.tanggal DESC, it.id DESC
      LIMIT ?
    `, [...itDateCond.params, limitNum]).catch(() => [[]]);

    return sendSuccess(res, 'Data Laporan Keuangan Owner Berhasil Dimuat', {
      periode,
      kasPeriode: Number(kasPeriode?.kas_periode || 0),
      transaksiPeriode: Number(kasPeriode?.total_transaksi || 0),
      totalSemuaKas: Number(kasAll?.total_semua_kas || 0),
      totalPiutang: Number(piutangAll?.total_piutang || 0),
      totalSantriMenunggak: Number(piutangAll?.total_santri_menunggak || 0),
      transaksiTerakhir: (transaksiRows || []).map((r) => ({
        ...r,
        total_bayar: Math.round(Number(r.total_bayar || 0))
      })),
      tunggakanSantri: (tunggakanRows || []).map((r) => ({
        ...r,
        total_tunggakan: Math.round(Number(r.total_tunggakan || 0)),
        jumlah_tagihan: Number(r.jumlah_tagihan || 0)
      })),
      riwayatInfak: (infakRows || []).map((r) => ({
        ...r,
        nominal: Math.round(Number(r.nominal || 0))
      }))
    });
  } catch (err) {
    return sendError(res, `Gagal memuat keuangan owner: ${err.message}`, 500);
  }
};

/**
 * 3. GET /api/owner/presensi
 * Laporan Presensi Shalat Berjamaah & Kegiatan Mengaji (Read-Only)
 */
export const getOwnerPresensi = async (req, res) => {
  try {
    const periode = req.query.periode || 'hari_ini';
    const tipe = req.query.tipe || 'semua';
    const dateCond = getPeriodeDateCondition(periode, 'aj.tanggal');

    let tipeFilterSql = '';
    if (tipe === 'mengaji') {
      tipeFilterSql = ` AND (
        LOWER(COALESCE(aj.tipe_presensi, '')) LIKE '%mengaji%' 
        OR LOWER(COALESCE(aj.tipe_presensi, '')) LIKE '%kegiatan%'
        OR (LOWER(COALESCE(aj.nama_kegiatan, '')) NOT REGEXP 'subuh|dzuhur|ashar|maghrib|isya|dhuha' AND LOWER(COALESCE(ks.nama_sesi, '')) NOT REGEXP 'subuh|dzuhur|ashar|maghrib|isya|dhuha')
      )`;
    } else if (tipe === 'berjamaah') {
      tipeFilterSql = ` AND (
        LOWER(COALESCE(aj.tipe_presensi, '')) LIKE '%berjamaah%' 
        OR LOWER(COALESCE(aj.nama_kegiatan, '')) REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya|dhuha|berjamaah'
        OR LOWER(COALESCE(ks.nama_sesi, '')) REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya|dhuha|berjamaah'
      )`;
    }

    // 1. Rekap Status Presensi
    const [statusSummary] = await pool.query(`
      SELECT 
        aj.status,
        COUNT(*) as jml
      FROM absensi_jamaah_mengaji aj
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      WHERE 1=1 ${dateCond.sql} ${tipeFilterSql}
      GROUP BY aj.status
    `, dateCond.params).catch(() => [[]]);

    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    for (const r of statusSummary) {
      const st = String(r.status || '').toLowerCase();
      if (st.includes('hadir')) hadir += Number(r.jml);
      else if (st.includes('sakit')) sakit += Number(r.jml);
      else if (st.includes('izin')) izin += Number(r.jml);
      else if (st.includes('alfa') || st.includes('alpha')) alfa += Number(r.jml);
      else hadir += Number(r.jml);
    }
    const total = hadir + sakit + izin + alfa;
    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

    // 2. Rekap Per Sesi & Kegiatan
    const [rekapPerSesi] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as nama_kegiatan,
        COALESCE(aj.tipe_presensi, 'Berjamaah') as tipe_presensi,
        COUNT(*) as total_presensi,
        SUM(CASE WHEN LOWER(aj.status) LIKE '%hadir%' THEN 1 ELSE 0 END) as jml_hadir,
        SUM(CASE WHEN LOWER(aj.status) LIKE '%sakit%' THEN 1 ELSE 0 END) as jml_sakit,
        SUM(CASE WHEN LOWER(aj.status) LIKE '%izin%' THEN 1 ELSE 0 END) as jml_izin,
        SUM(CASE WHEN LOWER(aj.status) LIKE '%alfa%' THEN 1 ELSE 0 END) as jml_alfa
      FROM absensi_jamaah_mengaji aj
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      WHERE 1=1 ${dateCond.sql} ${tipeFilterSql}
      GROUP BY nama_kegiatan, tipe_presensi
      ORDER BY total_presensi DESC
    `, dateCond.params).catch(() => [[]]);

    // 3. Log 100 Rekaman Presensi Terbaru
    const [logPresensi] = await pool.query(`
      SELECT 
        aj.id,
        DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
        aj.waktu_scan,
        aj.status,
        COALESCE(aj.metode_presensi, aj.metode_scan, 'Fingerprint') as metode_presensi,
        COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as nama_kegiatan,
        COALESCE(aj.tipe_presensi, 'Berjamaah') as tipe_presensi,
        aj.keterangan,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        a.nama_asrama
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      WHERE 1=1 ${dateCond.sql} ${tipeFilterSql}
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC, aj.id DESC
      LIMIT 100
    `, dateCond.params).catch(() => [[]]);

    return sendSuccess(res, 'Data Laporan Presensi Owner Berhasil Dimuat', {
      periode,
      tipe,
      summary: {
        total,
        hadir,
        sakit,
        izin,
        alfa,
        persen
      },
      rekapPerSesi,
      logPresensi
    });
  } catch (err) {
    return sendError(res, `Gagal memuat presensi owner: ${err.message}`, 500);
  }
};

/**
 * 4. GET /api/owner/perizinan
 * Laporan Perizinan & Kedisiplinan Santri (Read-Only)
 */
export const getOwnerPerizinan = async (req, res) => {
  try {
    // 1. Santri Sedang Izin Keluar Aktif Saat Ini
    const [izinAktifRows] = await pool.query(`
      SELECT 
        sp.id,
        sp.kode_izin,
        sp.jenis_izin,
        DATE_FORMAT(sp.tgl_keluar_rencana, '%Y-%m-%d %H:%i') as tgl_keluar_rencana,
        DATE_FORMAT(sp.tgl_kembali_rencana, '%Y-%m-%d %H:%i') as tgl_kembali_rencana,
        sp.keperluan,
        sp.status,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        a.nama_asrama,
        k.nama_kamar
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE sp.status = 'Aktif Keluar'
      ORDER BY sp.tgl_kembali_rencana ASC
    `).catch(() => [[]]);

    // 2. Riwayat 50 Izin Selesai Terakhir
    const [riwayatIzinRows] = await pool.query(`
      SELECT 
        sp.id,
        sp.kode_izin,
        sp.jenis_izin,
        DATE_FORMAT(sp.tgl_keluar_rencana, '%Y-%m-%d') as tgl_keluar,
        DATE_FORMAT(sp.tgl_kembali_rencana, '%Y-%m-%d') as tgl_kembali_rencana,
        DATE_FORMAT(sp.tgl_kembali_realisasi, '%Y-%m-%d %H:%i') as tgl_kembali_realisasi,
        sp.keperluan,
        sp.status,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      ORDER BY sp.id DESC
      LIMIT 75
    `).catch(() => [[]]);

    return sendSuccess(res, 'Data Laporan Perizinan Owner Berhasil Dimuat', {
      totalAktifKeluar: izinAktifRows.length,
      santriAktifKeluar: izinAktifRows,
      riwayatIzin: riwayatIzinRows
    });
  } catch (err) {
    return sendError(res, `Gagal memuat perizinan owner: ${err.message}`, 500);
  }
};

/**
 * 6. GET /api/owner/santri
 * Laporan Data Lengkap Santri & Sebaran Asrama (Read-Only)
 */
export const getOwnerSantri = async (req, res) => {
  try {
    // 1. Demografi Gender & Status
    const [[genderStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_santri,
        SUM(CASE WHEN LOWER(COALESCE(jenis_kelamin, tipe_santri, '')) IN ('l', 'laki-laki', 'putra', 'ikhwan') THEN 1 ELSE 0 END) as santri_putra,
        SUM(CASE WHEN LOWER(COALESCE(jenis_kelamin, tipe_santri, '')) IN ('p', 'perempuan', 'putri', 'akhwat') THEN 1 ELSE 0 END) as santri_putri
      FROM santri
      WHERE status = 'Aktif'
    `).catch(() => [[{ total_santri: 0, santri_putra: 0, santri_putri: 0 }]]);

    // 2. Data Lengkap Seluruh Santri Aktif
    const [santriRows] = await pool.query(`
      SELECT 
        s.id,
        s.nama_santri,
        s.nis,
        s.nisn,
        COALESCE(s.nama_kelas, kl.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama,
        COALESCE(k.nama_kamar, '') as nama_kamar,
        COALESCE(s.jenis_kelamin, s.tipe_santri, 'L') as jenis_kelamin,
        s.status,
        s.nama_wali,
        COALESCE(s.no_wa_wali, s.no_hp_wali, '') as no_wa_wali,
        DATE_FORMAT(s.tanggal_masuk, '%Y-%m-%d') as tanggal_masuk
      FROM santri s
      LEFT JOIN kelas kl ON s.kelas_id = kl.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE s.status = 'Aktif'
      ORDER BY s.nama_santri ASC
    `).catch(() => [[]]);

    // 3. Sebaran per Asrama
    const [asramaRows] = await pool.query(`
      SELECT 
        a.id,
        a.nama_asrama,
        a.pembina,
        COUNT(s.id) as total_santri
      FROM asrama a
      LEFT JOIN santri s ON s.asrama_id = a.id AND s.status = 'Aktif'
      GROUP BY a.id, a.nama_asrama, a.pembina
      ORDER BY a.nama_asrama ASC
    `).catch(() => [[]]);

    return sendSuccess(res, 'Data Santri Owner Berhasil Dimuat', {
      demografi: {
        total: Number(genderStats?.total_santri || 0),
        putra: Number(genderStats?.santri_putra || 0),
        putri: Number(genderStats?.santri_putri || 0)
      },
      daftarSantri: santriRows || [],
      sebaranAsrama: asramaRows || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat data santri owner: ${err.message}`, 500);
  }
};

/**
 * 7. GET /api/owner/perkembangan
 * Laporan Perkembangan Santri (Akademik, Karakter & Catatan Ustadz)
 */
export const getOwnerPerkembangan = async (req, res) => {
  try {
    const search = req.query.search || '';
    let sql = `
      SELECT 
        l.id,
        l.santri_id,
        l.periode,
        DATE_FORMAT(l.tanggal_laporan, '%Y-%m-%d') as tanggal_laporan,
        l.nilai_akademik,
        l.catatan_akademik,
        l.catatan_hafalan,
        l.catatan_perilaku,
        l.catatan_ibadah,
        l.catatan_ustadz,
        l.nama_penulis,
        l.status_publikasi,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama,
        COALESCE(k.nama_kamar, '') as nama_kamar
      FROM santri_laporan_perkembangan l
      JOIN santri s ON l.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      sql += ' AND (s.nama_santri LIKE ? OR s.nis LIKE ? OR l.periode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY l.tanggal_laporan DESC, l.id DESC LIMIT 100';

    const [rows] = await pool.query(sql, params).catch(() => [[]]);

    const [[kpi]] = await pool.query(`
      SELECT 
        COUNT(*) as total_laporan,
        COUNT(DISTINCT santri_id) as total_santri_terlapor
      FROM santri_laporan_perkembangan
    `).catch(() => [[{ total_laporan: 0, total_santri_terlapor: 0 }]]);

    return sendSuccess(res, 'Laporan Perkembangan Owner Berhasil Dimuat', {
      totalLaporan: Number(kpi?.total_laporan || 0),
      totalSantriTerlapor: Number(kpi?.total_santri_terlapor || 0),
      laporanList: rows || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat perkembangan owner: ${err.message}`, 500);
  }
};

