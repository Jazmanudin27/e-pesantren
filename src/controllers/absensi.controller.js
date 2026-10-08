import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAbsensiFingerprint = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT aj.*, s.nama_santri, s.nis, s.fingerprint_pin, a.nama_asrama, k.nama_kamar,
             ks.nama_sesi, ks.kategori, fd.nama_device
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      LEFT JOIN fingerprint_device fd ON aj.device_id = fd.id
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC
      LIMIT 100
    `);
    return sendSuccess(res, 'Data absensi fingerprint berhasil diambil', { data: rows });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createAbsensiFingerprint = async (req, res) => {
  try {
    const { santri_id, sesi_id, device_id, status_kehadiran, keteledoran_keterangan, waktu_scan, mnt_keterlambatan, metode_scan } = req.body;
    const tgl = new Date().toISOString().split('T')[0];
    const scanTime = waktu_scan || new Date().toTimeString().split(' ')[0];

    const [result] = await pool.query(`
      INSERT INTO absensi_jamaah_mengaji (
        santri_id, sesi_id, device_id, tanggal, waktu_scan, mnt_keterlambatan, status_kehadiran, keteledoran_keterangan, metode_scan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [santri_id || 1, sesi_id || 1, device_id || 1, tgl, scanTime, mnt_keterlambatan || 0, status_kehadiran || 'Hadir Tepat Waktu', keteledoran_keterangan || '', metode_scan || 'Fingerprint']);
    return sendSuccess(res, 'Presensi berhasil dicatat', { id: result.insertId }, 201);
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
