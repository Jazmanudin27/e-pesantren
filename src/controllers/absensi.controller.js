import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

let isAbsensiTablesChecked = false;
export const ensureAbsensiTablesAndColumns = async () => {
  if (isAbsensiTablesChecked) return;
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'absensi_jamaah_mengaji' AND TABLE_SCHEMA = DATABASE()
    `);
    const colNames = (cols || []).map(c => c.COLUMN_NAME.toLowerCase());

    // 1. Tambah kolom nama_kegiatan jika belum ada
    if (!colNames.includes('nama_kegiatan')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN nama_kegiatan VARCHAR(150) NULL AFTER sesi_id`);
        console.log('[ABSENSI DB] Kolom nama_kegiatan berhasil ditambahkan');
      } catch (e) {}
    }

    // 2. Tambah kolom tipe_presensi ('Berjamaah' vs 'Kegiatan')
    if (!colNames.includes('tipe_presensi')) {
      try {
        await pool.query(`ALTER TABLE absensi_jamaah_mengaji ADD COLUMN tipe_presensi VARCHAR(50) DEFAULT 'Berjamaah' AFTER nama_kegiatan`);
        console.log('[ABSENSI DB] Kolom tipe_presensi berhasil ditambahkan');
      } catch (e) {}
    }

    // 3. Pastikan kolom sesi_id boleh NULL (agar kegiatan mobile non-shalat tidak error)
    try {
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji MODIFY COLUMN sesi_id INT NULL`);
    } catch (e) {}

    // 4. Pastikan kolom metode_presensi VARCHAR (bisa simpan Wajah AI, QR Code, Fingerprint, dll)
    try {
      await pool.query(`ALTER TABLE absensi_jamaah_mengaji MODIFY COLUMN metode_presensi VARCHAR(100) DEFAULT 'Fingerprint'`);
    } catch (e) {}

    // 5. Normalisasi data lama yang nama_kegiatan masih null
    try {
      await pool.query(`
        UPDATE absensi_jamaah_mengaji aj
        LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
        SET aj.nama_kegiatan = COALESCE(ks.nama_sesi, 'Shalat Berjamaah'),
            aj.tipe_presensi = CASE 
              WHEN COALESCE(ks.nama_sesi, '') REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya' THEN 'Berjamaah'
              ELSE 'Kegiatan'
            END
        WHERE aj.nama_kegiatan IS NULL OR aj.nama_kegiatan = ''
      `);
    } catch (e) {}

    isAbsensiTablesChecked = true;
  } catch (err) {
    console.warn('[ABSENSI DB INIT NOTICE]', err.message);
  }
};

export const getAbsensiFingerprint = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const tipeParam = (req.query.tipe || req.query.type || '').toLowerCase(); // 'berjamaah' | 'kegiatan' | ''

    const [rows] = await pool.query(`
      SELECT aj.*, 
             DATE_FORMAT(aj.tanggal, '%Y-%m-%d') as tanggal,
             aj.status as status_kehadiran,
             aj.metode_presensi as metode_scan,
             COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as nama_sesi,
             COALESCE(NULLIF(aj.nama_kegiatan, ''), ks.nama_sesi, 'Kegiatan Santri') as kegiatan,
             COALESCE(aj.tipe_presensi, CASE 
               WHEN COALESCE(aj.nama_kegiatan, ks.nama_sesi, '') REGEXP 'shalat|sholat|subuh|dzuhur|ashar|maghrib|isya' THEN 'Berjamaah'
               ELSE 'Kegiatan'
             END) as tipe_presensi,
             s.nama_santri, s.nis, s.fingerprint_pin, a.nama_asrama, k.nama_kamar,
             ks.kategori, fd.nama_device
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      LEFT JOIN fingerprint_device fd ON aj.device_id = fd.id
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC
      LIMIT 1000
    `);

    // Otomatis sinkronkan santri yang memiliki izin aktif / sakit pulang dari santri_perizinan
    let izinAutoLogs = [];
    try {
      const [izinRows] = await pool.query(`
        SELECT sp.*,
               DATE_FORMAT(COALESCE(sp.tgl_keluar_aktual, sp.tgl_keluar_rencana), '%Y-%m-%d') as tgl_mulai,
               DATE_FORMAT(COALESCE(sp.tgl_kembali_aktual, sp.tgl_kembali_rencana), '%Y-%m-%d') as tgl_selesai,
               s.nama_santri, s.nis, s.fingerprint_pin, a.nama_asrama, k.nama_kamar
        FROM santri_perizinan sp
        JOIN santri s ON sp.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        WHERE sp.status NOT IN ('Ditolak', 'Dibatalkan', 'Menunggu Persetujuan')
          AND COALESCE(sp.tgl_kembali_aktual, sp.tgl_kembali_rencana) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY sp.id DESC
      `);

      if (izinRows && izinRows.length > 0) {
        const today = new Date();
        izinRows.forEach(sp => {
          const isSakit = (sp.jenis_izin || '').toLowerCase().includes('sakit') ||
                          (sp.jenis_izin || '').toLowerCase().includes('berobat') ||
                          (sp.keperluan || '').toLowerCase().includes('sakit');
          const finalStatus = isSakit ? 'Sakit' : 'Izin';
          const ket = `Perizinan ${sp.jenis_izin || 'Pulang'}${sp.keperluan ? `: ${sp.keperluan}` : ''}`;

          if (!sp.tgl_mulai) return;
          const startDate = new Date(sp.tgl_mulai);
          const endDate = sp.tgl_selesai ? new Date(sp.tgl_selesai) : today;
          const limitEnd = endDate < today ? endDate : today;

          for (let d = new Date(startDate); d <= limitEnd; d.setDate(d.getDate() + 1)) {
            const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const alreadyLogged = rows.some(r => r.santri_id === sp.santri_id && r.tanggal === dStr);
            const alreadyAuto = izinAutoLogs.some(r => r.santri_id === sp.santri_id && r.tanggal === dStr);

            if (!alreadyLogged && !alreadyAuto) {
              izinAutoLogs.push({
                id: `izin-${sp.id}-${dStr}`,
                santri_id: sp.santri_id,
                sesi_id: null,
                device_id: null,
                tanggal: dStr,
                waktu_scan: '00:00:00',
                status_kehadiran: finalStatus,
                status: finalStatus,
                metode_scan: 'Perizinan Otomatis',
                metode_presensi: 'Perizinan Otomatis',
                keterangan: ket,
                keteledoran_keterangan: ket,
                nama_santri: sp.nama_santri,
                nis: sp.nis,
                fingerprint_pin: sp.fingerprint_pin,
                nama_asrama: sp.nama_asrama,
                nama_kamar: sp.nama_kamar,
                nama_sesi: 'Semua Kegiatan (Perizinan)',
                kegiatan: 'Semua Kegiatan (Perizinan)',
                tipe_presensi: 'Semua',
                kategori: 'Perizinan',
                nama_device: 'Sistem Perizinan',
                is_perizinan_auto: true
              });
            }
          }
        });
      }
    } catch (eIzin) {
      console.warn('Sync perizinan to absensi log error:', eIzin.message);
    }

    let combined = [...izinAutoLogs, ...rows];

    if (tipeParam === 'berjamaah') {
      combined = combined.filter(item => item.tipe_presensi === 'Berjamaah' || item.is_perizinan_auto);
    } else if (tipeParam === 'kegiatan') {
      combined = combined.filter(item => item.tipe_presensi === 'Kegiatan' || item.is_perizinan_auto);
    }

    return sendSuccess(res, 'Data absensi fingerprint berhasil diambil', { data: combined });
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
    await ensureAbsensiTablesAndColumns();
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
      tanggal,
      kegiatan,
      nama_sesi,
      tipe_presensi
    } = req.body;

    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tgl = tanggal || localDateStr;
    const scanTime = waktu_scan || now.toTimeString().split(' ')[0];

    // Simpan metode presensi asli yang deskriptif (Wajah AI, QR Code, Fingerprint, Manual Musyrif)
    let rawMetode = metode_presensi || metode_scan || 'Manual Musyrif';
    let finalMetode = rawMetode;
    if (rawMetode.includes('Wajah') || rawMetode.includes('Face') || rawMetode.includes('AI')) {
      finalMetode = 'Wajah AI';
    } else if (rawMetode.includes('QR') || rawMetode.includes('Barcode')) {
      finalMetode = 'QR Code';
    } else if (rawMetode.includes('Finger') || rawMetode.includes('Sidik')) {
      finalMetode = 'Fingerprint';
    } else if (rawMetode.includes('Perizinan')) {
      finalMetode = 'Perizinan';
    } else {
      finalMetode = 'Manual Musyrif';
    }

    const finalStatus = status || status_kehadiran || 'Hadir';
    const finalSantriId = parseInt(santri_id) || 1;
    const finalKegiatan = kegiatan || nama_sesi || 'Kegiatan Pesantren';
    const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(finalKegiatan);
    const finalTipe = tipe_presensi || (isShalat ? 'Berjamaah' : 'Kegiatan');
    const finalKet = keterangan || keteledoran_keterangan || (metode_presensi || 'Scan Presensi');
    
    // finalSesiId hanya di-assign integer jika memang shalat/valid di kegiatan_sesi
    let parsedSesiId = parseInt(sesi_id);
    if (isNaN(parsedSesiId) || parsedSesiId <= 0) {
      parsedSesiId = isShalat ? 1 : null;
    }

    // 1. CEK APAKAH SUDAH ADA RECORD (HARI YANG SAMA + KEGIATAN YANG SAMA + SANTRI YANG SAMA)
    const [existing] = await pool.query(`
      SELECT id FROM absensi_jamaah_mengaji 
      WHERE tanggal = ? AND santri_id = ? AND (
        (nama_kegiatan IS NOT NULL AND nama_kegiatan = ?) OR 
        (nama_kegiatan IS NULL AND sesi_id IS NOT NULL AND sesi_id = ?)
      )
      ORDER BY id DESC LIMIT 1
    `, [tgl, finalSantriId, finalKegiatan, parsedSesiId]).catch(() => [[]]);

    if (existing && existing.length > 0) {
      const existingId = existing[0].id;
      // UPDATE status record yang ada, JANGAN buat baru (cegah duplikasi)
      await pool.query(`
        UPDATE absensi_jamaah_mengaji 
        SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?, nama_kegiatan = ?, tipe_presensi = ?
        WHERE id = ?
      `, [finalStatus, scanTime, finalMetode, finalKet, finalKegiatan, finalTipe, existingId]).catch(async () => {
        // Fallback jika kolom nama_kegiatan belum terindeks
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?
          WHERE id = ?
        `, [finalStatus, scanTime, finalMetode, finalKet, existingId]);
      });
      return sendSuccess(res, 'Presensi berhasil diperbarui (tidak duplikat)', { id: existingId, metode_presensi: finalMetode });
    }

    // 2. JIKA BELUM ADA, INSERT BARU
    let insertResult;
    try {
      const [resInsert] = await pool.query(`
        INSERT INTO absensi_jamaah_mengaji (
          tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [tgl, parsedSesiId, finalKegiatan, finalTipe, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet]);
      insertResult = resInsert;
    } catch (errIns) {
      // Fallback
      const [resInsert] = await pool.query(`
        INSERT INTO absensi_jamaah_mengaji (
          tanggal, sesi_id, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [tgl, parsedSesiId || 1, finalSantriId, scanTime, finalStatus, device_id || 1, finalMetode, finalKet]);
      insertResult = resInsert;
    }

    return sendSuccess(res, 'Presensi berhasil dicatat', { id: insertResult.insertId, metode_presensi: finalMetode }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// Batch Sinkronisasi Log dari NWF Mobile (localStorage) ke Server MySQL
export const syncMobileAbsensi = async (req, res) => {
  try {
    await ensureAbsensiTablesAndColumns();
    const items = Array.isArray(req.body) ? req.body : (req.body?.items || []);
    if (!items.length) {
      return sendSuccess(res, 'Tidak ada data untuk disinkron', { synced: 0 });
    }

    let syncedCount = 0;
    for (const item of items) {
      if (!item.santri_id) continue;
      const tgl = item.tanggal || new Date().toISOString().split('T')[0];
      const scanTime = item.waktu_scan || '07:00:00';
      const kegiatanName = item.kegiatan || item.nama_sesi || 'Kegiatan Pesantren';
      const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(kegiatanName);
      const tipe = item.tipe_presensi || (isShalat ? 'Berjamaah' : 'Kegiatan');
      const st = item.status || item.status_kehadiran || 'Hadir';
      const mt = item.metode_presensi || item.metode_scan || 'Wajah AI';
      const ket = item.keterangan || `NWF Mobile: ${kegiatanName}`;

      const [existing] = await pool.query(`
        SELECT id FROM absensi_jamaah_mengaji 
        WHERE tanggal = ? AND santri_id = ? AND nama_kegiatan = ?
        LIMIT 1
      `, [tgl, item.santri_id, kegiatanName]).catch(() => [[]]);

      if (existing && existing.length > 0) {
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, metode_presensi = ?, keterangan = ?, tipe_presensi = ?
          WHERE id = ?
        `, [st, scanTime, mt, ket, tipe, existing[0].id]).catch(() => {});
      } else {
        await pool.query(`
          INSERT INTO absensi_jamaah_mengaji (
            tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan
          ) VALUES (?, NULL, ?, ?, ?, ?, ?, 1, ?, ?)
        `, [tgl, kegiatanName, tipe, item.santri_id, scanTime, st, mt, ket]).catch(() => {});
      }
      syncedCount++;
    }

    return sendSuccess(res, `${syncedCount} log presensi NWF Mobile berhasil disinkronkan ke server`, { synced: syncedCount });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateAbsensiFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, status_kehadiran, keterangan, keteledoran_keterangan, metode_presensi, metode_scan } = req.body;
    const finalSt = status || status_kehadiran || 'Hadir Tepat Waktu';
    const finalMt = metode_presensi || metode_scan || 'Fingerprint';
    const finalKt = keterangan || keteledoran_keterangan || '';

    await pool.query(`
      UPDATE absensi_jamaah_mengaji SET
        status = ?, metode_presensi = ?, keterangan = ?
      WHERE id = ?
    `, [finalSt, finalMt, finalKt, id]);
    return sendSuccess(res, 'Presensi berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteAbsensiFingerprint = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, 'ID presensi tidak valid', 400);
    }
    if (String(id).startsWith('izin-')) {
      return sendError(res, 'Presensi ini sinkronisasi otomatis dari modul Perizinan. Hapus perizinan santri pada menu Perizinan.', 400);
    }
    const [result] = await pool.query('DELETE FROM absensi_jamaah_mengaji WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return sendError(res, 'Data presensi tidak ditemukan atau sudah dihapus', 404);
    }
    return sendSuccess(res, 'Presensi berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const getFingerprintDevices = async (req, res) => {
  try {
    // Mesin dianggap Online jika ada aktivitas/heartbeat ADMS dalam 3 menit terakhir
    try {
      await pool.query(`
        UPDATE fingerprint_device 
        SET status_koneksi = 'Offline' 
        WHERE (updated_at IS NULL OR updated_at < NOW() - INTERVAL 3 MINUTE)
      `);
    } catch (eHeartbeat) {}

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

    try {
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

      return sendSuccess(res, 'Kegiatan berhasil ditambahkan', { id: result.insertId }, 201);
    } catch (insertErr) {
      // Fallback jika tabel di database belum memiliki kolom baru (tipe_peserta/keterangan/peserta_santri_ids)
      console.warn('Fallback insert kegiatan_sesi:', insertErr.message);
      const [result] = await pool.query(`
        INSERT INTO kegiatan_sesi (
          kode_sesi, nama_sesi, kategori, 
          jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi, 
          hari_aktif, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalKode, nama_sesi, kategori || 'Shalat Berjamaah',
        jam_mulai_presensi || '04:15:00', jam_target || '04:40:00',
        jam_toleransi_telat || '04:45:00', jam_tutup_presensi || '05:15:00',
        hari_aktif || 'Semua', is_active !== undefined ? is_active : 1
      ]);

      return sendSuccess(res, 'Kegiatan berhasil ditambahkan', { id: result.insertId }, 201);
    }
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

    try {
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
    } catch (updateErr) {
      // Fallback jika tabel hanya memiliki kolom dasar
      console.warn('Fallback update kegiatan_sesi:', updateErr.message);
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
          is_active = COALESCE(?, is_active)
        WHERE id = ?
      `, [
        kode_sesi, nama_sesi, kategori,
        jam_mulai_presensi, jam_target, jam_toleransi_telat, jam_tutup_presensi,
        hari_aktif, is_active, id
      ]);
    }

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

