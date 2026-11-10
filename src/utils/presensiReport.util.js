import pool from '../config/database.js';
import { ensureAbsensiTablesAndColumns } from '../controllers/absensi.controller.js';

const SHALAT_REGEX_SQL =
  'shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah';

/**
 * Normalisasi tanggal ke format YYYY-MM-DD
 */
const toDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') {
    const m = val.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
};

/**
 * Filter SQL tipe presensi ('mengaji' | 'berjamaah' | 'semua')
 */
export const buildPresensiTipeFilterSql = (tipe = 'semua', ajAlias = 'aj', ksAlias = 'ks') => {
  if (tipe === 'mengaji') {
    return ` AND (
      LOWER(COALESCE(${ajAlias}.tipe_presensi, '')) LIKE '%mengaji%'
      OR LOWER(COALESCE(${ajAlias}.tipe_presensi, '')) LIKE '%kegiatan%'
      OR (
        LOWER(COALESCE(${ajAlias}.nama_kegiatan, '')) NOT REGEXP '${SHALAT_REGEX_SQL}'
        AND LOWER(COALESCE(${ksAlias}.nama_sesi, '')) NOT REGEXP '${SHALAT_REGEX_SQL}'
      )
    )`;
  }
  if (tipe === 'berjamaah') {
    return ` AND (
      LOWER(COALESCE(${ajAlias}.nama_kegiatan, '')) REGEXP '${SHALAT_REGEX_SQL}'
      OR LOWER(COALESCE(${ksAlias}.nama_sesi, '')) REGEXP '${SHALAT_REGEX_SQL}'
      OR (
        LOWER(COALESCE(${ajAlias}.tipe_presensi, '')) LIKE '%berjamaah%'
        AND COALESCE(NULLIF(TRIM(${ajAlias}.nama_kegiatan), ''), '') = ''
      )
    )`;
  }
  return '';
};

/**
 * Cek kelayakan santri mengikuti sesi berdasarkan konfigurasi target di kegiatan_sesi
 */
const isSantriEligibleForSession = (santri, sesiMeta) => {
  if (!sesiMeta) return true;

  if (sesiMeta.tipe_peserta === 'Santri Khusus' && sesiMeta.peserta_santri_ids) {
    try {
      const ids =
        typeof sesiMeta.peserta_santri_ids === 'string'
          ? JSON.parse(sesiMeta.peserta_santri_ids)
          : sesiMeta.peserta_santri_ids;
      if (Array.isArray(ids) && ids.length > 0) {
        return ids.map(Number).includes(Number(santri.id));
      }
    } catch (e) {}
  }

  const tg = String(sesiMeta.target_gender || 'Semua').toLowerCase();
  if (tg && tg !== 'semua') {
    const jk = String(santri.jk || santri.tipe_santri || '').toLowerCase();
    const isPutra =
      jk === 'l' || jk.includes('laki') || jk.includes('putra') || jk.includes('ikhwan');
    const isPutri =
      jk === 'p' || jk.includes('perempuan') || jk.includes('putri') || jk.includes('akhwat');
    if (tg.includes('putra') || tg.includes('ikhwan') || tg === 'l') {
      if (!isPutra) return false;
    } else if (tg.includes('putri') || tg.includes('akhwat') || tg === 'p') {
      if (!isPutri) return false;
    }
  }

  const tt = String(sesiMeta.target_tipe_santri || 'Semua').toLowerCase();
  if (tt && tt !== 'semua') {
    const stTipe = String(santri.tipe_santri || '').toLowerCase();
    if (stTipe && !stTipe.includes(tt)) return false;
  }

  return true;
};

/**
 * Ambil laporan presensi lengkap dengan perhitungan otomatis ALFA
 * bagi santri aktif yang tidak melakukan absen dan tidak punya inputan izin/sakit/haid.
 */
export const getPresensiReportWithAutoAlfa = async ({
  dateCond = { sql: '', params: [] },
  tipe = 'semua',
  limitNum = 2000,
  includeLogs = true,
}) => {
  await ensureAbsensiTablesAndColumns().catch(() => {});

  const tipeFilterSql = buildPresensiTipeFilterSql(tipe, 'aj', 'ks');

  // 1. Ambil semua log presensi yang tercatat sesuai filter tanggal & tipe
  const [recordedRows] = await pool
    .query(
      `
      SELECT
        aj.id,
        aj.santri_id,
        aj.sesi_id,
        DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
        aj.waktu_scan,
        COALESCE(NULLIF(TRIM(aj.status), ''), 'Hadir') as status,
        COALESCE(aj.metode_presensi, 'Fingerprint') as metode_presensi,
        COALESCE(NULLIF(TRIM(aj.nama_kegiatan), ''), ks.nama_sesi, 'Kegiatan Santri') as nama_kegiatan,
        COALESCE(aj.tipe_presensi, 'Berjamaah') as tipe_presensi,
        aj.keterangan,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, '') as nama_kelas,
        COALESCE(a.nama_asrama, '') as nama_asrama
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      WHERE 1=1 ${dateCond.sql} ${tipeFilterSql}
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC, aj.id DESC
    `,
      dateCond.params
    )
    .catch((err) => {
      console.warn('[PRESENSI REPORT SQL ERROR]:', err.message);
      return [[]];
    });

  // 2. Ambil daftar santri aktif, sesi metadata, perizinan, dan data haid secara paralel
  const [[activeSantri], [sesiList], [izinRows], [haidRows]] = await Promise.all([
    pool
      .query(
        `
        SELECT
          s.id,
          s.nama_santri,
          s.nis,
          COALESCE(s.nama_kelas, '') as nama_kelas,
          COALESCE(a.nama_asrama, '') as nama_asrama,
          LOWER(COALESCE(s.jk, '')) as jk,
          LOWER(COALESCE(s.tipe_santri, '')) as tipe_santri
        FROM santri s
        LEFT JOIN asrama a ON s.asrama_id = a.id
        WHERE s.status = 'Aktif'
        ORDER BY s.nama_santri ASC
      `
      )
      .catch(() => [[]]),
    pool
      .query(
        `
        SELECT id, nama_sesi, kategori, tipe_peserta, target_gender, target_tipe_santri, peserta_santri_ids
        FROM kegiatan_sesi
      `
      )
      .catch(async () =>
        pool.query(`SELECT id, nama_sesi, kategori FROM kegiatan_sesi`).catch(() => [[]])
      ),
    pool
      .query(
        `
        SELECT
          sp.santri_id,
          sp.jenis_izin,
          sp.keperluan,
          sp.status,
          DATE_FORMAT(COALESCE(sp.tgl_keluar_aktual, sp.tgl_keluar_rencana, sp.created_at), '%Y-%m-%d') as tgl_mulai,
          DATE_FORMAT(COALESCE(sp.tgl_kembali_aktual, sp.tgl_kembali_rencana), '%Y-%m-%d') as tgl_selesai,
          sp.tgl_kembali_aktual
        FROM santri_perizinan sp
        WHERE sp.status NOT IN ('Ditolak', 'Dibatalkan')
      `
      )
      .catch(() => [[]]),
    pool
      .query(
        `
        SELECT
          santri_id,
          DATE_FORMAT(tgl_mulai, '%Y-%m-%d') as tgl_mulai,
          DATE_FORMAT(tgl_selesai, '%Y-%m-%d') as tgl_selesai,
          status
        FROM santri_haid
      `
      )
      .catch(() => [[]]),
  ]);

  const sesiMetaMap = new Map();
  (sesiList || []).forEach((s) => {
    if (s.nama_sesi) sesiMetaMap.set(s.nama_sesi.trim().toLowerCase(), s);
  });

  // Kelompokkan log tercatat per sesi-tanggal: key = `${tanggal}__${namaKegiatanLower}`
  const sessionMap = new Map();
  const recordedKeySet = new Set();

  for (const row of recordedRows || []) {
    const tgl = toDateStr(row.tanggal);
    const kegName = String(row.nama_kegiatan || 'Kegiatan Santri').trim();
    const kegLower = kegName.toLowerCase();
    const sessKey = `${tgl}__${kegLower}`;

    recordedKeySet.add(`${sessKey}__${row.santri_id}`);

    if (!sessionMap.has(sessKey)) {
      sessionMap.set(sessKey, {
        tanggal: tgl,
        nama_kegiatan: kegName,
        kegLower,
        tipe_presensi: row.tipe_presensi || 'Berjamaah',
        hadir: 0,
        sakit: 0,
        izin: 0,
        haid: 0,
        alfa: 0,
      });
    }

    const bucket = sessionMap.get(sessKey);
    const st = String(row.status || '').toLowerCase();
    if (st.includes('sakit')) bucket.sakit += 1;
    else if (st.includes('haid')) bucket.haid += 1;
    else if (st.includes('izin')) bucket.izin += 1;
    else if (st.includes('alfa') || st.includes('alpha') || st.includes('absen')) bucket.alfa += 1;
    else bucket.hadir += 1;
  }

  // Helper cek perizinan & haid pada tanggal D
  const getIzinStatusOnDate = (santriId, dateStr) => {
    for (const iz of izinRows || []) {
      if (Number(iz.santri_id) !== Number(santriId)) continue;
      if (iz.tgl_mulai && dateStr < iz.tgl_mulai) continue;

      const isActiveOpen =
        !iz.tgl_kembali_aktual &&
        ['Aktif Keluar', 'Terlambat Kembali', 'Disetujui Pengasuh'].includes(iz.status);
      if (!isActiveOpen && iz.tgl_selesai && dateStr > iz.tgl_selesai) continue;

      const j = `${iz.jenis_izin || ''} ${iz.keperluan || ''}`.toLowerCase();
      return j.includes('sakit') || j.includes('berobat') ? 'Sakit' : 'Izin';
    }
    return null;
  };

  const isHaidOnDate = (santriId, dateStr) => {
    for (const h of haidRows || []) {
      if (Number(h.santri_id) !== Number(santriId)) continue;
      if (h.tgl_mulai && dateStr < h.tgl_mulai) continue;
      if (h.status === 'aktif' || (h.tgl_selesai && dateStr <= h.tgl_selesai)) {
        return true;
      }
    }
    return false;
  };

  // Hitung santri tanpa absen & tanpa izin -> masuk Alfa (atau Sakit/Izin/Haid jika punya inputan izin)
  const syntheticLogs = [];
  const sessionsSorted = Array.from(sessionMap.values()).sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal)
  );
  const MAX_EXPANDED_SESSIONS = 20;

  sessionsSorted.forEach((sess, sIdx) => {
    const sessKey = `${sess.tanggal}__${sess.kegLower}`;
    const sesiMeta = sesiMetaMap.get(sess.kegLower) || null;
    const isBerjamaahSess =
      String(sess.tipe_presensi || '').toLowerCase().includes('berjamaah') ||
      /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(
        sess.nama_kegiatan
      );
    const shouldExpand = includeLogs && sIdx < MAX_EXPANDED_SESSIONS;

    for (const santri of activeSantri || []) {
      if (!isSantriEligibleForSession(santri, sesiMeta)) continue;
      if (recordedKeySet.has(`${sessKey}__${santri.id}`)) continue;

      const izinType = getIzinStatusOnDate(santri.id, sess.tanggal);
      if (izinType) {
        if (izinType === 'Sakit') sess.sakit += 1;
        else sess.izin += 1;

        if (shouldExpand) {
          syntheticLogs.push({
            id: `auto-${izinType.toLowerCase()}-${sess.tanggal}-${santri.id}-${sIdx}`,
            santri_id: santri.id,
            tanggal: sess.tanggal,
            waktu_scan: '-',
            status: izinType,
            metode_presensi: 'Perizinan',
            nama_kegiatan: sess.nama_kegiatan,
            tipe_presensi: sess.tipe_presensi,
            keterangan: `${izinType} (Inputan Perizinan)`,
            nama_santri: santri.nama_santri,
            nis: santri.nis,
            nama_kelas: santri.nama_kelas,
            nama_asrama: santri.nama_asrama,
          });
        }
        continue;
      }

      if (isBerjamaahSess && isHaidOnDate(santri.id, sess.tanggal)) {
        sess.haid += 1;
        if (shouldExpand) {
          syntheticLogs.push({
            id: `auto-haid-${sess.tanggal}-${santri.id}-${sIdx}`,
            santri_id: santri.id,
            tanggal: sess.tanggal,
            waktu_scan: '-',
            status: 'Haid',
            metode_presensi: 'Sistem Haid',
            nama_kegiatan: sess.nama_kegiatan,
            tipe_presensi: sess.tipe_presensi,
            keterangan: "Sedang Haid (Udzur Syar'i)",
            nama_santri: santri.nama_santri,
            nis: santri.nis,
            nama_kelas: santri.nama_kelas,
            nama_asrama: santri.nama_asrama,
          });
        }
        continue;
      }

      // Tidak absen & tidak ada izin -> ALFA
      sess.alfa += 1;
      if (shouldExpand) {
        syntheticLogs.push({
          id: `auto-alfa-${sess.tanggal}-${santri.id}-${sIdx}`,
          santri_id: santri.id,
          tanggal: sess.tanggal,
          waktu_scan: '-',
          status: 'Alfa',
          metode_presensi: 'Tanpa Keterangan',
          nama_kegiatan: sess.nama_kegiatan,
          tipe_presensi: sess.tipe_presensi,
          keterangan: 'Tidak melakukan presensi & tanpa izin',
          nama_santri: santri.nama_santri,
          nis: santri.nis,
          nama_kelas: santri.nama_kelas,
          nama_asrama: santri.nama_asrama,
        });
      }
    }
  });

  // Agregasi Summary & Rekap Per Sesi (gabung lintas tanggal untuk nama kegiatan yang sama)
  let hadir = 0;
  let sakit = 0;
  let izin = 0;
  let haid = 0;
  let alfa = 0;

  const rekapAggMap = new Map();
  for (const sess of sessionsSorted) {
    hadir += sess.hadir;
    sakit += sess.sakit;
    izin += sess.izin;
    haid += sess.haid;
    alfa += sess.alfa;

    const rKey = `${sess.kegLower}__${sess.tipe_presensi}`;
    if (!rekapAggMap.has(rKey)) {
      rekapAggMap.set(rKey, {
        nama_kegiatan: sess.nama_kegiatan,
        tipe_presensi: sess.tipe_presensi,
        total_presensi: 0,
        jml_hadir: 0,
        jml_sakit: 0,
        jml_izin: 0,
        jml_haid: 0,
        jml_alfa: 0,
      });
    }
    const rAgg = rekapAggMap.get(rKey);
    rAgg.jml_hadir += sess.hadir;
    rAgg.jml_sakit += sess.sakit;
    rAgg.jml_izin += sess.izin;
    rAgg.jml_haid += sess.haid;
    rAgg.jml_alfa += sess.alfa;
    rAgg.total_presensi += sess.hadir + sess.sakit + sess.izin + sess.haid + sess.alfa;
  }

  const rekapPerSesi = Array.from(rekapAggMap.values()).sort(
    (a, b) => b.total_presensi - a.total_presensi
  );

  const total = hadir + sakit + izin + haid + alfa;
  const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

  // Gabungkan log tercatat di urutan atas, lalu log auto (Izin/Haid/Alfa)
  const combinedLogs = includeLogs
    ? [...(recordedRows || []), ...syntheticLogs].slice(0, limitNum)
    : [];

  return {
    summary: {
      total,
      hadir,
      sakit,
      izin,
      haid,
      alfa,
      persen,
    },
    rekapPerSesi,
    logPresensi: combinedLogs,
  };
};

