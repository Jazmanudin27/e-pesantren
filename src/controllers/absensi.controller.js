import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAbsensiFingerprint = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT aj.*, 
             DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
             COALESCE(aj.status, aj.status_kehadiran, 'Hadir Tepat Waktu') as status_kehadiran,
             COALESCE(aj.metode_presensi, aj.metode_scan, 'Manual_Musyrif') as metode_scan,
             s.nama_santri, s.nis, s.fingerprint_pin, a.nama_asrama, k.nama_kamar,
             ks.nama_sesi, ks.kategori, fd.nama_device
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      LEFT JOIN fingerprint_device fd ON aj.device_id = fd.id
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC
      LIMIT 500
    `);
    return sendSuccess(res, 'Data absensi fingerprint berhasil diambil', { data: rows });
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

export const createAbsensiFingerprint = async (req, res) => {
  try {
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
      tanggal
    } = req.body;

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tgl = tanggal || localDateStr;
    const scanTime = waktu_scan || now.toTimeString().split(' ')[0];
    const finalStatus = status_kehadiran || status || 'Hadir Tepat Waktu';
    const finalMetode = metode_presensi || metode_scan || 'Manual_Musyrif';
    const finalKet = keterangan || keteledoran_keterangan || '';
    const finalSantriId = parseInt(santri_id) || 1;
    const finalSesiId = parseInt(sesi_id) || 1;

    // 1. CEK APAKAH SUDAH ADA RECORD (HARI YANG SAMA + KEGIATAN YANG SAMA + SANTRI YANG SAMA)
    const [existing] = await pool.query(`
      SELECT id FROM absensi_jamaah_mengaji 
      WHERE tanggal = ? AND sesi_id = ? AND santri_id = ? 
      ORDER BY id DESC LIMIT 1
    `, [tgl, finalSesiId, finalSantriId]).catch(() => [[]]);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      // UPDATE status record yang ada, JANGAN buat baru (cegah duplikasi)
      try {
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?
          WHERE id = ?
        `, [finalStatus, scanTime, finalMetode, finalKet, existingId]);
      } catch (errUp) {
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status_kehadiran = ?, waktu_scan = ?, metode_scan = ?
          WHERE id = ?
        `, [finalStatus, scanTime, finalMetode, existingId]);
      }
      return sendSuccess(res, 'Presensi berhasil diperbarui (tidak duplikat)', { id: existingId });
    }

    // 2. JIKA BELUM ADA, INSERT BARU
    try {
      const [result] = await pool.query(`
        INSERT INTO absensi_jamaah_mengaji (
          tanggal, sesi_id, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [tgl, finalSesiId, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet]);
      return sendSuccess(res, 'Presensi berhasil dicatat', { id: result.insertId }, 201);
    } catch (err1) {
      // Fallback jika tabel menggunakan nama kolom alternatif
      const [result] = await pool.query(`
        INSERT INTO absensi_jamaah_mengaji (
          santri_id, sesi_id, device_id, tanggal, waktu_scan, status_kehadiran, metode_scan
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [finalSantriId, finalSesiId, device_id || 1, tgl, scanTime, finalStatus, finalMetode]);
      return sendSuccess(res, 'Presensi berhasil dicatat', { id: result.insertId }, 201);
    }
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateAbsensiFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_kehadiran, mnt_keterlambatan, keteledoran_keterangan, metode_scan } = req.body;
    await pool.query(`
      UPDATE absensi_jamaah_mengaji SET
        status_kehadiran = ?, mnt_keterlambatan = ?, keteledoran_keterangan = ?, metode_scan = ?
      WHERE id = ?
    `, [status_kehadiran || 'Hadir Tepat Waktu', mnt_keterlambatan || 0, keteledoran_keterangan || '', metode_scan || 'Fingerprint', id]);
    return sendSuccess(res, 'Presensi berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteAbsensiFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM absensi_jamaah_mengaji WHERE id = ?', [id]);
    return sendSuccess(res, 'Presensi berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getFingerprintDevices = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fingerprint_device ORDER BY id ASC');
    return sendSuccess(res, 'Data perangkat fingerprint berhasil diambil', { data: rows });
  } catch (err) {
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
    return sendError(res, err.message, 500);
  }
};

export const deleteFingerprintDevice = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM fingerprint_device WHERE id = ?', [id]);
    return sendSuccess(res, 'Mesin fingerprint berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getFingerprintSesi = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kegiatan_sesi ORDER BY jam_mulai_presensi ASC');
    return sendSuccess(res, 'Sesi presensi berhasil diambil', { data: rows });
  } catch (err) {
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

    return sendSuccess(res, 'Kegiatan berhasil ditambahkan', { id: result.insertId });
  } catch (err) {
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

    return sendSuccess(res, 'Kegiatan berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteFingerprintSesi = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kegiatan_sesi WHERE id = ?', [id]);
    return sendSuccess(res, 'Kegiatan berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

