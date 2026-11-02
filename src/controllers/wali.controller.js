import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import bcrypt from 'bcryptjs';

/**
 * Mengambil seluruh data monitoring santri untuk Orang Tua / Wali Santri
 */
export const getWaliSantriData = async (req, res) => {
  try {
    let santriId = req.query.santri_id || (req.user && (req.user.santri_id || req.user.id));

    // Jika santriId belum ada, cari santri pertama sebagai fallback
    if (!santriId) {
      const [first] = await pool.query('SELECT id FROM santri ORDER BY id ASC LIMIT 1');
      if (first && first.length > 0) {
        santriId = first[0].id;
      }
    }

    if (!santriId) {
      return sendError(res, 'ID Santri tidak ditemukan', 404);
    }

    // 1. Data Profil Lengkap Santri
    const [santriRows] = await pool.query(`
      SELECT 
        s.id,
        s.kode_santri,
        s.nis,
        s.nisn,
        s.nama_santri,
        s.jk,
        s.tempat_lahir,
        s.tgl_lahir,
        s.status_santri,
        s.asrama_id,
        s.kamar_id,
        s.fingerprint_pin,
        s.rfid_card_uid,
        s.capaian_hafalan_juz,
        s.tingkat_diniyah,
        s.nama_wali,
        s.no_wa_wali,
        s.hubungan_wali,
        s.alamat_asal,
        s.status,
        s.tahun_masuk,
        s.username,
        a.nama_asrama,
        a.lokasi_gedung,
        k.nama_kamar,
        k.kode_kamar,
        ast.nama_asatidz as pembina_asrama,
        ast.no_hp as no_hp_pembina
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN asatidz ast ON a.pembina_asatidz_id = ast.id
      WHERE s.id = ?
      LIMIT 1
    `, [santriId]);

    if (!santriRows || santriRows.length === 0) {
      return sendError(res, 'Data santri tidak ditemukan', 404);
    }

    const santri = santriRows[0];

    // 2. Data Tahfidz Qur'an (Setoran Ziyadah & Muroja'ah)
    let tahfidzSetoran = [];
    try {
      const [tRows] = await pool.query(`
        SELECT 
          ts.*,
          ast.nama_asatidz as nama_penyimak
        FROM tahfidz_setoran ts
        LEFT JOIN asatidz ast ON ts.asatidz_id = ast.id
        WHERE ts.santri_id = ?
        ORDER BY ts.tanggal DESC, ts.id DESC
        LIMIT 30
      `, [santriId]);
      tahfidzSetoran = tRows || [];
    } catch (e) {
      tahfidzSetoran = [];
    }

    // 3. Data Ujian Praktek Ibadah (Sholat, Wudhu, Jenazah, dll)
    let praktekIbadah = [];
    try {
      const [pRows] = await pool.query(`
        SELECT *
        FROM praktek_ibadah
        WHERE santri_id = ?
        ORDER BY tanggal_ujian DESC, id DESC
      `, [santriId]);
      praktekIbadah = (pRows || []).map(r => ({
        ...r,
        status: (r.status === 'Remedial' || r.status === 'Mengulang') ? 'Mengulang' : 'Lulus'
      }));
    } catch (e) {
      praktekIbadah = [];
    }

    // 4. Data Presensi Berjamaah & Mengaji (Fingerprint)
    let presensiJamaah = [];
    try {
      const [absRows] = await pool.query(`
        SELECT 
          a.*,
          ks.nama_sesi,
          ks.kategori as kategori_sesi,
          ks.jam_target
        FROM absensi_jamaah_mengaji a
        LEFT JOIN kegiatan_sesi ks ON a.sesi_id = ks.id
        WHERE a.santri_id = ?
        ORDER BY a.tanggal DESC, a.waktu_scan DESC, a.id DESC
        LIMIT 30
      `, [santriId]);
      presensiJamaah = absRows || [];
    } catch (e) {
      presensiJamaah = [];
    }

    // 5. Data Perizinan Pulang & Keluar Pondok
    let perizinan = [];
    try {
      const [izRows] = await pool.query(`
        SELECT *
        FROM santri_perizinan
        WHERE santri_id = ?
        ORDER BY tgl_keluar_rencana DESC, id DESC
        LIMIT 20
      `, [santriId]);
      perizinan = izRows || [];
    } catch (e) {
      perizinan = [];
    }

    // 6. Data Pelanggaran Disiplin & Ta'zir
    let pelanggaran = [];
    try {
      const [plRows] = await pool.query(`
        SELECT *
        FROM tata_tertib_pelanggaran
        WHERE santri_id = ?
        ORDER BY tanggal DESC, id DESC
        LIMIT 20
      `, [santriId]);
      pelanggaran = plRows || [];
    } catch (e) {
      pelanggaran = [];
    }

    // Statistik Ringkasan Khusus Wali
    const totalSetoran = tahfidzSetoran.length;
    const totalPraktekLulus = praktekIbadah.filter(p => p.status === 'Lulus').length;
    const totalPraktekMengulang = praktekIbadah.filter(p => p.status === 'Mengulang').length;
    const izinAktif = perizinan.find(iz => iz.status === 'Aktif Keluar' || iz.status === 'Menunggu Persetujuan');

    return sendSuccess(res, 'Data monitoring wali santri berhasil diambil', {
      santri,
      tahfidzSetoran,
      praktekIbadah,
      presensiJamaah,
      perizinan,
      pelanggaran,
      statistik: {
        capaianJuz: santri.capaian_hafalan_juz || 0,
        totalSetoran,
        totalPraktekLulus,
        totalPraktekMengulang,
        totalIzin: perizinan.length,
        totalPelanggaran: pelanggaran.length,
        izinAktif: izinAktif || null
      }
    });
  } catch (err) {
    return sendError(res, `Error mengambil data wali santri: ${err.message}`, 500);
  }
};

/**
 * Orang Tua Santri mengganti password login akunnya sendiri
 */
export const updateWaliPassword = async (req, res) => {
  try {
    const santriId = req.body.santri_id || (req.user && (req.user.santri_id || req.user.id));
    const { password_baru, username_baru } = req.body;

    if (!santriId) {
      return sendError(res, 'ID Santri tidak ditemukan', 400);
    }

    if (!password_baru || password_baru.trim().length < 4) {
      return sendError(res, 'Password baru minimal 4 karakter', 400);
    }

    const updates = ['password = ?'];
    const params = [password_baru.trim()];

    if (username_baru && username_baru.trim() !== '') {
      updates.push('username = ?');
      params.push(username_baru.trim().toLowerCase());
    }

    params.push(santriId);

    await pool.query(
      `UPDATE santri SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return sendSuccess(res, 'Password akun orang tua santri berhasil diperbarui');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return sendError(res, 'Username tersebut sudah digunakan oleh santri lain', 400);
    }
    return sendError(res, err.message, 500);
  }
};
