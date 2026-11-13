import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { syncActiveHaidToAbsensi } from './haid.controller.js';
import { syncActivePerizinanToAbsensi } from './absensi.controller.js';
import { getPresensiReportWithAutoAlfa } from '../utils/presensiReport.util.js';
import { getRingkasanKantongKas, resolveStatusDanaForSuccess } from './keuangan.controller.js';

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
 * Helper: Ambil rentang tanggal berdasarkan filter periode atau parameter rentang tanggal/bulan/tahun
 */
const getPeriodeDateCondition = (queryOrPeriode, dateColumn = 'tanggal') => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const q = typeof queryOrPeriode === 'string'
    ? { periode: queryOrPeriode }
    : (queryOrPeriode || {});

  // 1. Range Hari (tanggal_dari & tanggal_sampai)
  if (q.tanggal_dari || q.tanggal_sampai) {
    const start = q.tanggal_dari || q.tanggal_sampai;
    const end = q.tanggal_sampai || q.tanggal_dari;
    const [from, to] = start <= end ? [start, end] : [end, start];
    return {
      sql: `AND DATE(${dateColumn}) BETWEEN ? AND ?`,
      params: [from, to]
    };
  }

  // 2. Single Tanggal (legacy)
  if (q.tanggal) {
    return {
      sql: `AND DATE(${dateColumn}) = ?`,
      params: [q.tanggal]
    };
  }

  // 3. Range Bulan (bulan_dari & bulan_sampai, format YYYY-MM)
  if (q.bulan_dari || q.bulan_sampai) {
    const startYm = q.bulan_dari || q.bulan_sampai;
    const endYm = q.bulan_sampai || q.bulan_dari;
    const [fromYm, toYm] = startYm <= endYm ? [startYm, endYm] : [endYm, startYm];

    const startDate = `${fromYm}-01`;
    const [toYearStr, toMonthStr] = toYm.split('-');
    const lastDay = new Date(Number(toYearStr), Number(toMonthStr), 0).getDate();
    const endDate = `${toYm}-${String(lastDay).padStart(2, '0')}`;
    return {
      sql: `AND DATE(${dateColumn}) BETWEEN ? AND ?`,
      params: [startDate, endDate]
    };
  }

  // 4. Filter Tahun tunggal (tahun, format YYYY)
  if (q.tahun && /^\d{4}$/.test(String(q.tahun))) {
    return {
      sql: `AND YEAR(${dateColumn}) = ?`,
      params: [Number(q.tahun)]
    };
  }

  // 5. Fallback legacy periode ('hari_ini', 'tahun_ini', 'bulan_ini')
  const periode = q.periode || 'bulan_ini';
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
        SUM(CASE WHEN LOWER(COALESCE(jk, tipe_santri, '')) IN ('l', 'laki-laki', 'putra', 'ikhwan') THEN 1 ELSE 0 END) as santri_putra,
        SUM(CASE WHEN LOWER(COALESCE(jk, tipe_santri, '')) IN ('p', 'perempuan', 'putri', 'akhwat') THEN 1 ELSE 0 END) as santri_putri
      FROM santri 
      WHERE status = 'Aktif'
    `);

    // Izin Aktif Keluar
    const [[izinStats]] = await pool.query(`
      SELECT COUNT(*) as total_izin_aktif 
      FROM santri_perizinan 
      WHERE status = 'Aktif Keluar'
    `).catch(() => [[{ total_izin_aktif: 0 }]]);

    // Keuangan: Total Kas Masuk Sah (pokok efektif), Tabungan & Total Piutang Tunggakan
    const [
      [keuStats],
      [tabStats],
      [tunggakanStats],
      [infakStats],
      kantong
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as total_kas_masuk
        FROM keuangan_transaksi_pembayaran
        WHERE status_pembayaran = 'Berhasil'
      `).catch(() => [[{ total_kas_masuk: 0 }]]),
      pool.query(`
        SELECT COALESCE(SUM(saldo), 0) as total_saldo_tabungan
        FROM santri_tabungan
      `).catch(() => [[{ total_saldo_tabungan: 0 }]]),
      pool.query(`
        SELECT 
          COALESCE(SUM(sisa_tagihan), 0) as total_piutang
        FROM keuangan_tagihan
        WHERE status IN ('Belum Dibayar', 'Sebagian')
          AND sisa_tagihan > 0
          AND (
            (jatuh_tempo IS NOT NULL AND DATE(jatuh_tempo) <= CURDATE())
            OR (jatuh_tempo IS NULL AND DATE(COALESCE(tanggal_tagihan, created_at, NOW())) <= CURDATE())
          )
      `).catch(() => [[{ total_piutang: 0 }]]),
      pool.query(`
        SELECT COALESCE(SUM(nominal), 0) as total_infak
        FROM pesantren_infak_transaksi
        WHERE status = 'Berhasil' OR status = 'Lunas'
      `).catch(() => [[{ total_infak: 0 }]]),
      getRingkasanKantongKas().catch(() => ({}))
    ]);

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
      totalKasMasuk: Number(keuStats?.[0]?.total_kas_masuk || 0),
      totalSaldoTabungan: Number(tabStats?.[0]?.total_saldo_tabungan || 0),
      totalPiutang: Number(tunggakanStats?.[0]?.total_piutang || 0),
      totalInfak: Number(infakStats?.[0]?.total_infak || 0),
      kantong: kantong || {},
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
    const keuQuery = { periode, ...req.query };
    const dateCond = getPeriodeDateCondition(keuQuery, 'tanggal_bayar');

    // 1. Ringkasan Kas Periode
    const [[kasPeriode]] = await pool.query(`
      SELECT 
        COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as kas_periode,
        COUNT(*) as total_transaksi
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil' ${dateCond.sql}
    `, dateCond.params).catch(() => [[{ kas_periode: 0, total_transaksi: 0 }]]);

    // 2. Total Kas Sepanjang Waktu
    const [[kasAll]] = await pool.query(`
      SELECT COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as total_semua_kas
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil'
    `).catch(() => [[{ total_semua_kas: 0 }]]);

    // 3. Total Tunggakan Belum Lunas yang Sudah Jatuh Tempo (Lewat Tgl Batas Akhir)
    const [[piutangAll]] = await pool.query(`
      SELECT 
        COALESCE(SUM(sisa_tagihan), 0) as total_piutang,
        COUNT(DISTINCT santri_id) as total_santri_menunggak
      FROM keuangan_tagihan
      WHERE status IN ('Belum Dibayar', 'Sebagian')
        AND sisa_tagihan > 0
        AND (
          (jatuh_tempo IS NOT NULL AND DATE(jatuh_tempo) <= CURDATE())
          OR (jatuh_tempo IS NULL AND DATE(COALESCE(tanggal_tagihan, created_at, NOW())) <= CURDATE())
        )
    `).catch(() => [[{ total_piutang: 0, total_santri_menunggak: 0 }]]);

    const limitNum = Math.min(Math.max(parseInt(req.query.limit, 10) || 1000, 10), 5000);

    // 4. Log Transaksi Pembayaran Kas Terakhir (Filtered by selected periode)
    const tpDateCond = getPeriodeDateCondition(keuQuery, 'tp.tanggal_bayar');
    const [transaksiRows] = await pool.query(`
      SELECT 
        tp.id,
        tp.nomor_transaksi,
        tp.santri_id,
        tp.total_bayar,
        COALESCE(NULLIF(tp.nominal_pokok, 0), tp.total_bayar) as nominal_pokok,
        COALESCE(tp.nominal_fee_gateway, 0) as nominal_fee_gateway,
        tp.metode_pembayaran,
        tp.channel_pembayaran,
        tp.snap_token,
        tp.status_dana,
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

    // 4b. Ringkasan 3 Kantong Saldo & Buku Kas Operasional
    const bkDateCond = getPeriodeDateCondition(keuQuery, 'tanggal');
    const [kantong, [bukuKasRows]] = await Promise.all([
      getRingkasanKantongKas(),
      pool.query(`
        SELECT *
        FROM keuangan_buku_kas
        WHERE 1=1 ${bkDateCond.sql}
        ORDER BY tanggal DESC, id DESC
        LIMIT 300
      `, bkDateCond.params).catch(() => [[]])
    ]);

    // 5. Rekap Santri Penunggak (Khusus tagihan yang sudah jatuh tempo / lewat batas akhir tgl 10)
    const [tunggakanRows] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        s.nama_wali,
        s.no_wa_wali,
        COUNT(t.id) as jumlah_tagihan,
        SUM(t.sisa_tagihan) as total_tunggakan,
        GROUP_CONCAT(COALESCE(t.periode_bulan, t.judul_tagihan) ORDER BY t.jatuh_tempo ASC SEPARATOR ', ') as rincian_bulan
      FROM keuangan_tagihan t
      JOIN santri s ON t.santri_id = s.id
      WHERE t.status IN ('Belum Dibayar', 'Sebagian')
        AND t.sisa_tagihan > 0
        AND (
          (t.jatuh_tempo IS NOT NULL AND DATE(t.jatuh_tempo) <= CURDATE())
          OR (t.jatuh_tempo IS NULL AND DATE(COALESCE(t.tanggal_tagihan, t.created_at, NOW())) <= CURDATE())
        )
      GROUP BY s.id, s.nama_santri, s.nis, s.nama_kelas, s.nama_wali, s.no_wa_wali
      ORDER BY total_tunggakan DESC
    `).catch(() => [[]]);

    // 6. Rekap Infak & Sedekah (Filtered by selected periode)
    const itDateCond = getPeriodeDateCondition(keuQuery, 'it.tanggal');
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
      kantong,
      bukuKas: (bukuKasRows || []).map((b) => ({
        ...b,
        nominal: Math.round(Number(b.nominal || 0)),
        biaya_admin: Math.round(Number(b.biaya_admin || 0))
      })),
      transaksiTerakhir: (transaksiRows || []).map((r) => ({
        ...r,
        total_bayar: Math.round(Number(r.total_bayar || 0)),
        nominal_pokok: Math.round(Number(r.nominal_pokok || r.total_bayar || 0)),
        nominal_fee_gateway: Math.round(Number(r.nominal_fee_gateway || 0)),
        status_dana: r.status_dana || resolveStatusDanaForSuccess(r.metode_pembayaran, r.channel_pembayaran, r.snap_token)
      })),
      tunggakanSantri: (tunggakanRows || []).map((r) => ({
        ...r,
        total_tunggakan: Math.round(Number(r.total_tunggakan || 0)),
        jumlah_tagihan: Number(r.jumlah_tagihan || 0),
        rincian_bulan: r.rincian_bulan || ''
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
    await syncActivePerizinanToAbsensi().catch(() => {});
    await syncActiveHaidToAbsensi().catch(() => {});
    const periode = req.query.periode || 'hari_ini';
    const tipe = req.query.tipe || 'semua';
    const limitNum = Math.min(Math.max(Number(req.query.limit) || 3000, 10), 10000);

    const dateCond = getPeriodeDateCondition({ periode, ...req.query }, 'aj.tanggal');

    const report = await getPresensiReportWithAutoAlfa({
      dateCond,
      tipe,
      limitNum,
      includeLogs: true,
    });

    return sendSuccess(res, 'Data Laporan Presensi Owner Berhasil Dimuat', {
      periode,
      tipe,
      summary: report.summary,
      rekapPerSesi: report.rekapPerSesi,
      logPresensi: report.logPresensi,
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

/**
 * 8. GET /api/owner/notifikasi
 * Feed Notifikasi Realtime untuk Owner (Uang Masuk, Infak, Perizinan)
 */
export const getOwnerNotifikasi = async (req, res) => {
  try {
    // 1. Transaksi Kas/Uang Masuk Terakhir
    const [transaksiRows] = await pool.query(`
      SELECT 
        tp.id,
        tp.nomor_transaksi,
        tp.total_bayar,
        tp.metode_pembayaran,
        tp.tanggal_bayar,
        DATE_FORMAT(tp.tanggal_bayar, '%Y-%m-%d %H:%i') as waktu_str,
        (DATE(tp.tanggal_bayar) = CURDATE()) as is_today,
        s.nama_santri,
        COALESCE(s.nama_kelas, '') as nama_kelas
      FROM keuangan_transaksi_pembayaran tp
      JOIN santri s ON tp.santri_id = s.id
      WHERE tp.status_pembayaran = 'Berhasil'
      ORDER BY tp.tanggal_bayar DESC, tp.id DESC
      LIMIT 35
    `).catch(() => [[]]);

    // 2. Infak Masuk Terakhir
    const [infakRows] = await pool.query(`
      SELECT 
        it.id,
        it.nama_donatur,
        it.nominal,
        it.metode_pembayaran,
        it.tanggal,
        DATE_FORMAT(it.tanggal, '%Y-%m-%d %H:%i') as waktu_str,
        (DATE(it.tanggal) = CURDATE()) as is_today,
        pi.nama_program
      FROM pesantren_infak_transaksi it
      LEFT JOIN pesantren_program_infak pi ON it.program_id = pi.id
      WHERE (it.status = 'Berhasil' OR it.status = 'Lunas')
      ORDER BY it.tanggal DESC, it.id DESC
      LIMIT 20
    `).catch(() => [[]]);

    // 3. Perizinan Santri Terakhir
    const [izinRows] = await pool.query(`
      SELECT 
        sp.id,
        sp.kode_izin,
        sp.jenis_izin,
        sp.keperluan,
        sp.status,
        COALESCE(sp.tgl_keluar_rencana, sp.created_at) as waktu,
        DATE_FORMAT(COALESCE(sp.tgl_keluar_rencana, sp.created_at), '%Y-%m-%d %H:%i') as waktu_str,
        (DATE(COALESCE(sp.tgl_keluar_rencana, sp.created_at)) = CURDATE()) as is_today,
        s.nama_santri,
        COALESCE(s.nama_kelas, '') as nama_kelas
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      ORDER BY sp.id DESC
      LIMIT 20
    `).catch(() => [[]]);

    const notifItems = [];

    for (const t of (transaksiRows || [])) {
      const nominal = Math.round(Number(t.total_bayar || 0));
      const metode = String(t.metode_pembayaran || 'Tunai').replace(/Virtual\s*Account/gi, 'VA');
      notifItems.push({
        id: `uang_${t.id}`,
        tipe: 'uang_masuk',
        judul: 'Uang Masuk Diterima',
        subjudul: `${t.nama_santri}${t.nama_kelas ? ' • ' + t.nama_kelas : ''}`,
        deskripsi: `Pembayaran kas via ${metode}`,
        nominal,
        waktu: t.tanggal_bayar,
        waktu_str: t.waktu_str,
        is_today: Boolean(t.is_today),
        target_tab: 'keuangan',
        sub_tab: 'transaksi'
      });
    }

    for (const i of (infakRows || [])) {
      const nominal = Math.round(Number(i.nominal || 0));
      const donatur = i.nama_donatur || 'Hamba Allah';
      const program = i.nama_program ? ` (${i.nama_program})` : '';
      notifItems.push({
        id: `infak_${i.id}`,
        tipe: 'infak_masuk',
        judul: 'Infak / Donasi Masuk',
        subjudul: `${donatur}${program}`,
        deskripsi: `Donasi kas masuk berhasil dicatat`,
        nominal,
        waktu: i.tanggal,
        waktu_str: i.waktu_str,
        is_today: Boolean(i.is_today),
        target_tab: 'keuangan',
        sub_tab: 'infak'
      });
    }

    for (const z of (izinRows || [])) {
      notifItems.push({
        id: `izin_${z.id}`,
        tipe: 'perizinan',
        judul: z.status === 'Aktif Keluar' ? 'Santri Keluar Pondok' : 'Status Perizinan Santri',
        subjudul: `${z.nama_santri}${z.nama_kelas ? ' • ' + z.nama_kelas : ''}`,
        deskripsi: `${z.keperluan || z.jenis_izin || 'Izin'} [${z.status}]`,
        nominal: 0,
        waktu: z.waktu,
        waktu_str: z.waktu_str,
        is_today: Boolean(z.is_today),
        target_tab: 'perizinan',
        sub_tab: 'aktif'
      });
    }

    notifItems.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());

    const totalHariIni = notifItems.filter((n) => n.is_today).length;
    const totalUangMasukHariIni = notifItems
      .filter((n) => n.is_today && (n.tipe === 'uang_masuk' || n.tipe === 'infak_masuk'))
      .reduce((acc, curr) => acc + (curr.nominal || 0), 0);

    return sendSuccess(res, 'Notifikasi Owner Berhasil Dimuat', {
      totalNotif: notifItems.length,
      totalHariIni,
      totalUangMasukHariIni,
      items: notifItems
    });
  } catch (err) {
    return sendError(res, `Gagal memuat notifikasi owner: ${err.message}`, 500);
  }
};


