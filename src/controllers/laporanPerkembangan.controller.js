import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * Mengambil Laporan Perkembangan Santri Khusus Akun Wali
 */
export const getLaporanWali = async (req, res) => {
  try {
    let santriId = req.query.santri_id || (req.user && (req.user.santri_id || req.user.id));

    if (!santriId) {
      const [first] = await pool.query('SELECT id FROM santri ORDER BY id ASC LIMIT 1');
      if (first && first.length > 0) {
        santriId = first[0].id;
      }
    }

    if (!santriId) {
      return sendError(res, 'Santri ID tidak ditemukan', 404);
    }

    // 1. Data Riwayat Laporan Resmi dari Asatidz / Pengasuh
    const [laporanRows] = await pool.query(`
      SELECT 
        l.*,
        s.nama_santri,
        s.nis,
        s.kode_santri
      FROM santri_laporan_perkembangan l
      JOIN santri s ON l.santri_id = s.id
      WHERE l.santri_id = ? AND l.status_publikasi = 'Diterbitkan'
      ORDER BY l.tanggal_laporan DESC, l.id DESC
    `, [santriId]);

    // Parse JSON nilai_akademik jika ada
    const laporanList = (laporanRows || []).map(row => {
      let nilaiParsed = null;
      try {
        if (row.nilai_akademik && typeof row.nilai_akademik === 'string') {
          nilaiParsed = JSON.parse(row.nilai_akademik);
        }
      } catch (e) {
        nilaiParsed = null;
      }
      return {
        ...row,
        nilai_akademik_parsed: nilaiParsed
      };
    });

    // 2. Data Statistik Pendukung Terkini (Tahfidz, Absensi, Praktek, Disiplin)
    const [tahfidzStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_setoran,
        COALESCE(MAX(juz), 0) as juz_tertinggi
      FROM tahfidz_setoran WHERE santri_id = ?
    `, [santriId]);

    const [absensiStats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status LIKE '%Hadir%' THEN 1 END) as hadir,
        COUNT(CASE WHEN status LIKE '%Sakit%' THEN 1 END) as sakit,
        COUNT(CASE WHEN status LIKE '%Izin%' THEN 1 END) as izin,
        COUNT(CASE WHEN status LIKE '%Alpha%' OR status LIKE '%Ghoib%' THEN 1 END) as alfa
      FROM absensi_jamaah_mengaji WHERE santri_id = ?
    `, [santriId]);

    const [praktekStats] = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status != 'Remedial' AND status != 'Mengulang' THEN 1 END) as lulus,
        COUNT(CASE WHEN status = 'Remedial' OR status = 'Mengulang' THEN 1 END) as mengulang
      FROM praktek_ibadah WHERE santri_id = ?
    `, [santriId]);

    const [pelanggaranStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_kasus,
        COALESCE(SUM(poin_pelanggaran), 0) as total_poin
      FROM tata_tertib_pelanggaran WHERE santri_id = ?
    `, [santriId]);

    return sendSuccess(res, 'Laporan perkembangan santri berhasil dimuat', {
      laporanList,
      laporanTerkini: laporanList[0] || null,
      metrikRingkas: {
        tahfidz: tahfidzStats[0] || { total_setoran: 0, juz_tertinggi: 0 },
        absensi: absensiStats[0] || { hadir: 0, sakit: 0, izin: 0, alfa: 0 },
        praktek: praktekStats[0] || { lulus: 0, mengulang: 0 },
        pelanggaran: pelanggaranStats[0] || { total_kasus: 0, total_poin: 0 }
      }
    });
  } catch (err) {
    return sendError(res, `Gagal memuat laporan wali: ${err.message}`, 500);
  }
};

/**
 * Admin: Ambil Semua Laporan Perkembangan Santri
 */
export const getAllLaporanAdmin = async (req, res) => {
  try {
    const { santri_id, periode } = req.query;
    let sql = `
      SELECT 
        l.*,
        s.nama_santri,
        s.nis,
        s.kode_santri,
        a.nama_asrama,
        k.nama_kamar
      FROM santri_laporan_perkembangan l
      JOIN santri s ON l.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE 1=1
    `;
    const params = [];

    if (santri_id) {
      sql += ' AND l.santri_id = ?';
      params.push(santri_id);
    }
    if (periode) {
      sql += ' AND l.periode LIKE ?';
      params.push(`%${periode}%`);
    }

    sql += ' ORDER BY l.tanggal_laporan DESC, l.id DESC LIMIT 50';

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Daftar laporan perkembangan santri', rows || []);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * Admin: Terbitkan / Simpan Laporan Perkembangan Santri
 */
export const createLaporanAdmin = async (req, res) => {
  try {
    const {
      santri_id,
      periode,
      tanggal_laporan,
      nilai_akademik,
      catatan_akademik,
      catatan_hafalan,
      catatan_perilaku,
      catatan_ibadah,
      catatan_ustadz,
      nama_penulis,
      status_publikasi
    } = req.body;

    if (!santri_id || !periode || !catatan_ustadz) {
      return sendError(res, 'Santri, Periode, dan Catatan Ustadz wajib diisi', 400);
    }

    const tgl = tanggal_laporan || new Date().toISOString().slice(0, 10);
    const penulis = nama_penulis || 'Ust. Hamdan S.Th.I';
    const status = status_publikasi || 'Diterbitkan';

    let jsonNilai = null;
    if (typeof nilai_akademik === 'object' && nilai_akademik !== null) {
      jsonNilai = JSON.stringify(nilai_akademik);
    } else if (typeof nilai_akademik === 'string' && nilai_akademik.trim() !== '') {
      jsonNilai = nilai_akademik.trim();
    }

    const [result] = await pool.query(`
      INSERT INTO santri_laporan_perkembangan 
      (santri_id, periode, tanggal_laporan, nilai_akademik, catatan_akademik, catatan_hafalan, catatan_perilaku, catatan_ibadah, catatan_ustadz, nama_penulis, status_publikasi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [santri_id, periode, tgl, jsonNilai, catatan_akademik || null, catatan_hafalan || null, catatan_perilaku || null, catatan_ibadah || null, catatan_ustadz, penulis, status]);

    return sendSuccess(res, 'Laporan perkembangan santri berhasil diterbitkan', { id: result.insertId });
  } catch (err) {
    return sendError(res, `Gagal membuat laporan: ${err.message}`, 500);
  }
};

/**
 * Admin: Hapus Laporan
 */
export const deleteLaporanAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM santri_laporan_perkembangan WHERE id = ?', [id]);
    return sendSuccess(res, 'Laporan berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

