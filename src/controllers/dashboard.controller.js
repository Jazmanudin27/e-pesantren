import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_santri }]] = await pool.query("SELECT COUNT(*) as total_santri FROM santri WHERE status = 'Aktif'");
    const [[{ total_halaqah }]] = await pool.query("SELECT COUNT(*) as total_halaqah FROM tahfidz_halaqah WHERE is_active = 1");
    const [[{ total_izin_aktif }]] = await pool.query("SELECT COUNT(*) as total_izin_aktif FROM santri_perizinan WHERE status = 'Aktif Keluar'");
    const [[{ avg_juz }]] = await pool.query("SELECT AVG(capaian_hafalan_juz) as avg_juz FROM santri WHERE status = 'Aktif'");

    // Setoran terbaru
    const [recentSetoran] = await pool.query(`
      SELECT ts.id, ts.tanggal, ts.juz, ts.surat_mulai, ts.ayat_mulai, ts.surat_selesai, ts.ayat_selesai, 
             ts.kualitas_tajwid, ts.status, ts.created_at,
             s.nama_santri, a.nama_asrama, k.nama_kamar, ast.nama_asatidz
      FROM tahfidz_setoran ts
      JOIN santri s ON ts.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN asatidz ast ON ts.asatidz_id = ast.id
      ORDER BY ts.tanggal DESC, ts.id DESC
      LIMIT 5
    `);

    // Perizinan aktif
    const [activeIzin] = await pool.query(`
      SELECT sp.id, sp.kode_izin, sp.barcode, sp.jenis_izin, sp.tgl_keluar_rencana, sp.tgl_kembali_rencana,
             sp.nama_penjemput_mahrom, sp.keperluan, sp.status,
             s.nama_santri, a.nama_asrama, k.nama_kamar
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY sp.id DESC
      LIMIT 5
    `);

    // Rekap Absensi Santri Hari Ini (Hadir, Sakit, Izin, Alfa)
    let rekap_absensi = { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: total_santri || 0 };
    let absensi_today_list = [];
    try {
      const now = new Date();
      const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const [todayDetailRows] = await pool.query(`
        SELECT aj.*, 
               DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
               COALESCE(aj.status, aj.status_kehadiran, 'Hadir Tepat Waktu') as status_kehadiran,
               COALESCE(aj.metode_presensi, aj.metode_scan, 'Manual_Musyrif') as metode_scan,
               s.nama_santri, s.nis, a.nama_asrama, k.nama_kamar,
               ks.nama_sesi, ks.kategori
        FROM absensi_jamaah_mengaji aj
        JOIN santri s ON aj.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
        WHERE DATE_FORMAT(aj.tanggal, '%Y-%m-%d') = ? OR DATE_FORMAT(aj.tanggal, '%Y-%m-%d') = CURDATE()
        ORDER BY aj.waktu_scan DESC, aj.id DESC
      `, [localDateStr]);

      absensi_today_list = todayDetailRows || [];

      if (absensi_today_list.length > 0) {
        absensi_today_list.forEach(r => {
          const st = (r.status_kehadiran || '').toLowerCase();
          if (st.includes('sakit')) rekap_absensi.sakit += 1;
          else if (st.includes('izin')) rekap_absensi.izin += 1;
          else if (st.includes('alfa') || st.includes('alpa') || st.includes('teledor')) rekap_absensi.alfa += 1;
          else rekap_absensi.hadir += 1;
        });
      }
    } catch (e) {
      console.warn('Dashboard absensi query fallback:', e.message);
    }

    return sendSuccess(res, 'Dashboard stats retrieved', {
      stats: {
        total_santri: total_santri || 0,
        total_halaqah: total_halaqah || 0,
        total_izin_aktif: total_izin_aktif || 0,
        avg_juz: parseFloat(avg_juz || 0).toFixed(1)
      },
      rekap_absensi,
      absensi_today_list,
      recentSetoran,
      activeIzin
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
