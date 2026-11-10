import pool from '../config/database.js';
import { ensureAbsensiTablesAndColumns } from '../controllers/absensi.controller.js';

const SHALAT_REGEX_SQL =
  'shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah';

let santriSchemaCache = null;
const getSantriSchema = async () => {
  if (santriSchemaCache) return santriSchemaCache;
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM santri');
    const colSet = new Set((cols || []).map((c) => String(c.Field).toLowerCase()));
    santriSchemaCache = {
      hasNamaKelas: colSet.has('nama_kelas'),
      hasKelasId: colSet.has('kelas_id'),
      hasAsramaId: colSet.has('asrama_id'),
      hasJk: colSet.has('jk'),
      hasJenisKelamin: colSet.has('jenis_kelamin'),
      hasTipeSantri: colSet.has('tipe_santri'),
      hasStatusSantri: colSet.has('status_santri'),
      hasStatus: colSet.has('status'),
    };
  } catch (e) {
    santriSchemaCache = {
      hasNamaKelas: true,
      hasKelasId: true,
      hasAsramaId: true,
      hasJk: true,
      hasJenisKelamin: false,
      hasTipeSantri: false,
      hasStatusSantri: true,
      hasStatus: true,
    };
  }
  return santriSchemaCache;
};

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
 * Ekstrak nama kelas dari keterangan jika kolom kelas kosong (mis. "Kelas: 7A")
 */
const extractKelasFromKeterangan = (ket = '') => {
  const m = String(ket || '').match(/kelas\s*:\s*([^•|\n]+)/i);
  return m && m[1] ? m[1].trim() : '';
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
 * Ambil laporan presensi lengkap dengan perhitungan otomatis ALFA:
 * - Untuk Mengaji: evaluasi seluruh santri aktif di kelas yang melaksanakan absensi (mis. kelas 31 santri, absen 19 -> sisanya 12 minus izin masuk Alfa).
 * - Untuk Shalat Berjamaah: evaluasi seluruh santri aktif sesuai aturan sesi (gender/peserta), cek izin/sakit/haid, sisanya masuk Alfa.
 */
export const getPresensiReportWithAutoAlfa = async ({
  dateCond = { sql: '', params: [] },
  tipe = 'semua',
  limitNum = 3000,
  includeLogs = true,
}) => {
  await ensureAbsensiTablesAndColumns().catch(() => {});
  const schema = await getSantriSchema();

  const kelasJoinSql = schema.hasKelasId
    ? 'LEFT JOIN kelas kl ON s.kelas_id = kl.id'
    : schema.hasNamaKelas
      ? 'LEFT JOIN kelas kl ON LOWER(TRIM(s.nama_kelas)) = LOWER(TRIM(kl.nama_kelas))'
      : '';
  const kelasSelectExpr = schema.hasNamaKelas
    ? `COALESCE(NULLIF(TRIM(kl.nama_kelas), ''), NULLIF(TRIM(s.nama_kelas), ''), '')`
    : schema.hasKelasId
      ? `COALESCE(NULLIF(TRIM(kl.nama_kelas), ''), '')`
      : `''`;
  const asramaJoinSql = schema.hasAsramaId ? 'LEFT JOIN asrama a ON s.asrama_id = a.id' : '';
  const asramaSelectExpr = schema.hasAsramaId ? "COALESCE(a.nama_asrama, '')" : "''";
  const jkExpr = schema.hasJk
    ? "LOWER(COALESCE(s.jk, ''))"
    : schema.hasJenisKelamin
      ? "LOWER(COALESCE(s.jenis_kelamin, ''))"
      : "''";
  const tipeSantriExpr = schema.hasTipeSantri
    ? "LOWER(COALESCE(s.tipe_santri, ''))"
    : schema.hasStatusSantri
      ? "LOWER(COALESCE(s.status_santri, ''))"
      : "''";
  const activeStatusWhere = schema.hasStatus ? "WHERE LOWER(COALESCE(s.status, 'Aktif')) = 'aktif'" : '';

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
        ${kelasSelectExpr} as nama_kelas,
        ${asramaSelectExpr} as nama_asrama
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      ${kelasJoinSql}
      ${asramaJoinSql}
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
          ${kelasSelectExpr} as nama_kelas,
          ${asramaSelectExpr} as nama_asrama,
          ${jkExpr} as jk,
          ${tipeSantriExpr} as tipe_santri
        FROM santri s
        ${kelasJoinSql}
        ${asramaJoinSql}
        ${activeStatusWhere}
        ORDER BY s.nama_santri ASC
      `
      )
      .catch((err) => {
        console.warn('[PRESENSI ACTIVE SANTRI ERROR]:', err.message);
        return [[]];
      }),
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
        actualRecordedCount: 0,
        recordedKelasSet: new Set(),
        hadir: 0,
        sakit: 0,
        izin: 0,
        haid: 0,
        alfa: 0,
      });
    }

    const bucket = sessionMap.get(sessKey);
    const metodeLow = String(row.metode_presensi || '').toLowerCase();
    const isAutoSyncRow =
      metodeLow.includes('perizinan') || metodeLow.includes('sistem haid');

    if (!isAutoSyncRow) {
      bucket.actualRecordedCount += 1;
      const kelasName =
        String(row.nama_kelas || '').trim() || extractKelasFromKeterangan(row.keterangan);
      if (kelasName) {
        bucket.recordedKelasSet.add(kelasName.toLowerCase());
      }
    }

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
    if (sess.actualRecordedCount === 0) return;

    const sessKey = `${sess.tanggal}__${sess.kegLower}`;
    const sesiMeta = sesiMetaMap.get(sess.kegLower) || null;
    const isBerjamaahSess =
      String(sess.tipe_presensi || '').toLowerCase().includes('berjamaah') ||
      /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(
        sess.nama_kegiatan
      );
    const shouldExpand = includeLogs && sIdx < MAX_EXPANDED_SESSIONS;

    // Untuk Mengaji: hanya evaluasi santri di kelas yang melaksanakan absen pada sesi tersebut
    const filterByRecordedKelas = !isBerjamaahSess && sess.recordedKelasSet.size > 0;

    for (const santri of activeSantri || []) {
      if (filterByRecordedKelas) {
        const sKelasLow = String(santri.nama_kelas || '').trim().toLowerCase();
        if (!sKelasLow || !sess.recordedKelasSet.has(sKelasLow)) continue;
      } else {
        if (!isSantriEligibleForSession(santri, sesiMeta)) continue;
      }

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
