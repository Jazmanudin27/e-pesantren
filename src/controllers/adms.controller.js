import pool from '../config/database.js';
import { createWaliNotification, buildAbsensiNotifText } from './notifikasi.controller.js';
import { resolveActiveShalatBerjamaahSesi } from './absensi.controller.js';

/**
 * Controller Resmi untuk Integrasi Mesin Fingerprint (Protokol ADMS / Cloud Server ZKTeco & Solution)
 * Mendukung Mesin Solution MP340, X100C, Fingerspot, dan mesin ZKTeco OEM lainnya.
 */

// Ensure tabel antrean perintah ADMS
export const ensureAdmsTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS adms_command_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sn_device VARCHAR(50) DEFAULT NULL,
        command TEXT NOT NULL,
        status ENUM('PENDING', 'SENT', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
        return_code INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_sn (sn_device)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err) {
    console.warn('[ADMS] Init table queue notice:', err.message);
  }
};

// 1. Handshake & Inisialisasi Opsi Mesin
export const handleAdmsHandshake = async (req, res) => {
  await ensureAdmsTables();
  const sn = req.query.SN || req.query.sn || 'UNKNOWN';
  console.log(`[ADMS CLOUD] Handshake diterima dari mesin SN: ${sn}`);

  // Catat atau perbarui status mesin di database
  try {
    const [existing] = await pool.query('SELECT id, nama_device FROM fingerprint_device WHERE sn_device = ?', [sn]);
    if (existing.length === 0) {
      const [countRows] = await pool.query('SELECT COUNT(*) as total FROM fingerprint_device');
      const urutan = (countRows[0]?.total || 0) + 1;
      await pool.query(`
        INSERT INTO fingerprint_device (nama_device, sn_device, ip_address, port, lokasi, peruntukan, status_koneksi)
        VALUES (?, ?, ?, 80, 'Lokasi Pesantren', 'Semua', 'Online')
      `, [`Mesin MP340 #${urutan} (${sn})`, sn, req.ip || 'Cloud ADMS']);
    } else {
      await pool.query(`
        UPDATE fingerprint_device 
        SET status_koneksi = 'Online', updated_at = NOW() 
        WHERE id = ?
      `, [existing[0].id]);
    }
  } catch (err) {
    console.warn('[ADMS] Notice check device:', err.message);
  }

  // Response spesifikasi standar ZKTeco ADMS Push Protocol
  const responseText = 
`GET OPTION FROM: ${sn}
ATTLOGStamp=None
OPERLOGStamp=None
ATTPHOTOStamp=None
ErrorDelay=30
Delay=10
TransTimes=00:00;14:05
TransInterval=1
TransFlag=TransData AttLog\tOpLog\tAttPhoto\tEnrollUser\tChgUser\tEnrollFP\tChgFP\tFPImag\tFACE\tUserPic
Realtime=1
Encrypt=0
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send(responseText);
};

// 2. Menerima Log Absensi Realtime dari Mesin (Tabel ATTLOG)
export const handleAdmsPushData = async (req, res) => {
  const sn = req.query.SN || req.query.sn || 'UNKNOWN';
  const table = (req.query.table || req.query.tablename || req.query.TableName || '').toUpperCase();

  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
  } else if (req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    if (keys.length > 0 && req.body[keys[0]] === '') {
      rawBody = keys.join('\n');
    } else {
      rawBody = Object.entries(req.body).map(([k, v]) => v ? `${k}\t${v}` : k).join('\n');
    }
  }

  console.log(`[ADMS PUSH] Mesin ${sn} mengirim data (Tabel: ${table || 'DEFAULT'}, Length: ${rawBody.length})`);

  // Jika eksplisit bukan ATTLOG (misal OPERLOG/config), balas OK
  if (table && !table.includes('ATTLOG')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send('OK\n');
  }

  if (!rawBody || rawBody.trim() === '') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send('OK\n');
  }

  // Ambil ID Device
  let deviceId = 1;
  try {
    const [devRows] = await pool.query('SELECT id FROM fingerprint_device WHERE sn_device = ? LIMIT 1', [sn]);
    if (devRows && devRows.length > 0) {
      deviceId = devRows[0].id;
    }
    // Update status mesin jadi Online
    await pool.query("UPDATE fingerprint_device SET status_koneksi = 'Online', updated_at = NOW() WHERE sn_device = ?", [sn]).catch(() => {});
  } catch (eDev) {}

  // Parse baris log absensi
  const lines = rawBody.split(/\r?\n/).filter(l => l.trim().length > 0);
  let processedCount = 0;

  for (const line of lines) {
    let pin = '';
    let tanggalScan = '';
    let waktuScan = '';

    // Regex mencocokkan format: PIN (angka/teks) lalu Tanggal (YYYY-MM-DD) lalu Jam (HH:mm:ss)
    const match = line.match(/(\S+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
    if (match) {
      pin = match[1].trim();
      tanggalScan = match[2].trim();
      waktuScan = match[3].trim();
    } else {
      const cols = line.split(/[\t\s]+/);
      if (cols.length >= 3 && cols[1].includes('-') && cols[2].includes(':')) {
        pin = cols[0].trim();
        tanggalScan = cols[1].trim();
        waktuScan = cols[2].trim();
      } else {
        continue;
      }
    }

    if (!pin) continue;

    try {
      // 1. Cari santri berdasarkan fingerprint_pin, NIS, atau ID
      const [santriRows] = await pool.query(`
        SELECT id, nama_santri, nis, fingerprint_pin 
        FROM santri 
        WHERE fingerprint_pin = ? OR nis = ? OR id = ? 
        LIMIT 1
      `, [pin, pin, pin]);

      if (!santriRows || santriRows.length === 0) {
        console.warn(`[ADMS] PIN ${pin} dari mesin ${sn} tidak cocok dengan santri manapun di database.`);
        continue;
      }

      const santri = santriRows[0];

      // 2. Otomatis Pilih Sesi Shalat Berjamaah Berdasarkan Jam Scan & Setting Jadwal Shalat Berjamaah
      const autoSesi = await resolveActiveShalatBerjamaahSesi(waktuScan);
      const sesiId = autoSesi?.id || 1;
      const namaSesiAktif = autoSesi?.nama_sesi || 'Shalat Berjamaah';
      const tipePresensi = 'Berjamaah';
      let statusKehadiran = 'Hadir';
      if (autoSesi?.jam_toleransi_telat && waktuScan > String(autoSesi.jam_toleransi_telat)) {
        statusKehadiran = 'Hadir';
      }

      // 3. Cek apakah log untuk santri & tanggal ini sudah pernah dihapus oleh Admin
      const [isDeleted] = await pool.query(`
        SELECT id FROM absensi_deleted_logs 
        WHERE santri_id = ? AND tanggal = ? 
        LIMIT 1
      `, [santri.id, tanggalScan]).catch(() => [[]]);

      if (isDeleted && isDeleted.length > 0) {
        console.log(`[ADMS SKIP] Log ${santri.nama_santri} (PIN: ${pin}) tanggal ${tanggalScan} jam ${waktuScan} dilewati karena telah dihapus oleh Admin.`);
        continue;
      }

      // 4. Simpan atau Update ke Tabel absensi_jamaah_mengaji dengan Kategori Berjamaah Otomatis (Idempoten)
      const [existingLog] = await pool.query(`
        SELECT id FROM absensi_jamaah_mengaji 
        WHERE tanggal = ? AND santri_id = ? AND (
          sesi_id = ? OR LOWER(TRIM(COALESCE(nama_kegiatan, ''))) = LOWER(TRIM(?))
        )
        LIMIT 1
      `, [tanggalScan, santri.id, sesiId, namaSesiAktif]);

      const keterangan = `Scan Fingerprint Mesin MP340 (SN: ${sn}) - ${namaSesiAktif}`;

      if (existingLog && existingLog.length > 0) {
        try {
          await pool.query(`
            UPDATE absensi_jamaah_mengaji 
            SET status = ?, waktu_scan = ?, device_id = ?, metode_presensi = 'Fingerprint', nama_kegiatan = ?, tipe_presensi = ?, keterangan = ?
            WHERE id = ?
          `, [statusKehadiran, waktuScan, deviceId, namaSesiAktif, tipePresensi, keterangan, existingLog[0].id]);
        } catch (errUp) {
          await pool.query(`
            UPDATE absensi_jamaah_mengaji 
            SET status = ?, waktu_scan = ?, device_id = ?, keterangan = ?
            WHERE id = ?
          `, [statusKehadiran, waktuScan, deviceId, keterangan, existingLog[0].id]);
        }
      } else {
        try {
          await pool.query(`
            INSERT INTO absensi_jamaah_mengaji 
            (tanggal, sesi_id, nama_kegiatan, tipe_presensi, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Fingerprint', ?)
          `, [tanggalScan, sesiId, namaSesiAktif, tipePresensi, santri.id, waktuScan, statusKehadiran, deviceId, keterangan]);
        } catch (errIns) {
          await pool.query(`
            INSERT INTO absensi_jamaah_mengaji 
            (tanggal, sesi_id, santri_id, waktu_scan, status, device_id, keterangan)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [tanggalScan, sesiId, santri.id, waktuScan, statusKehadiran, deviceId, keterangan]);
        }
      }

      processedCount++;
      const notifCopy = buildAbsensiNotifText({
        namaSantri: santri.nama_santri,
        kegiatan: namaSesiAktif,
        status: statusKehadiran,
        waktu: waktuScan
      });
      createWaliNotification({
        santri_id: santri.id,
        kategori: 'absensi',
        judul: notifCopy.judul,
        pesan: notifCopy.pesan,
        target_tab: 'absensi',
        replaceRecentSameCategory: true
      });
      console.log(`[ADMS SUCCESS] ${santri.nama_santri} (PIN: ${pin}) berhasil presensi jam ${waktuScan}!`);
    } catch (lineErr) {
      console.error(`[ADMS ERROR] Gagal proses baris "${line}":`, lineErr.message);
    }
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send(`OK: ${processedCount}\n`);
};

// 3. Heartbeat & Polling Perintah Mesin (Server kirim perintah / data santri ke mesin)
export const handleAdmsGetRequest = async (req, res) => {
  const sn = req.query.SN || req.query.sn || '';
  try {
    await ensureAdmsTables();
    if (sn) {
      await pool.query("UPDATE fingerprint_device SET status_koneksi = 'Online', updated_at = NOW() WHERE sn_device = ?", [sn]).catch(() => {});
    }
    // Ambil antrean perintah pending untuk SN ini atau broadcast
    const [pendingCmds] = await pool.query(`
      SELECT id, command FROM adms_command_queue 
      WHERE status = 'PENDING' AND (sn_device = ? OR sn_device IS NULL OR sn_device = '')
      ORDER BY id ASC LIMIT 5
    `, [sn]);

    if (pendingCmds && pendingCmds.length > 0) {
      let responseBody = '';
      const ids = [];
      for (const cmd of pendingCmds) {
        responseBody += `C:${cmd.id}:${cmd.command}\n`;
        ids.push(cmd.id);
      }
      await pool.query(`UPDATE adms_command_queue SET status = 'SENT' WHERE id IN (?)`, [ids]);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(responseBody);
    }
  } catch (err) {
    console.error('[ADMS GETREQUEST ERR]', err.message);
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('OK\n');
};

// 4. Konfirmasi Penerimaan & Eksekusi Perintah oleh Mesin
export const handleAdmsDeviceCmd = async (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  try {
    await ensureAdmsTables();
    const params = new URLSearchParams(rawBody.trim());
    const cmdId = params.get('ID');
    const retCode = params.get('Return');
    if (cmdId) {
      const status = (retCode === '0' || retCode === 0) ? 'SUCCESS' : 'FAILED';
      await pool.query(`
        UPDATE adms_command_queue 
        SET status = ?, return_code = ?, updated_at = NOW() 
        WHERE id = ?
      `, [status, retCode || 0, cmdId]);
      console.log(`[ADMS CMD ACK] Perintah ID ${cmdId} dieksekusi mesin dengan status: ${status} (Code: ${retCode})`);
    }
  } catch (e) {
    console.error('[ADMS DEVICECMD ERR]', e.message);
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('OK\n');
};

// 5. REST API: Antrekan Sinkronisasi Data Santri dari Server ke Mesin (Multi-Mesin / Banyak Mesin)
export const queuePushSantriToDevice = async (req, res) => {
  try {
    await ensureAdmsTables();
    const { sn_device, santri_id, jk } = req.body;

    // Filter santri aktif (kolom jenis kelamin di database adalah 'jk' (L/P), status aktif adalah status != 'Alumni'/'Boyong')
    let query = `
      SELECT id, nis, nama_santri, fingerprint_pin, jk 
      FROM santri 
      WHERE (status = 'Aktif' OR status IS NULL OR status = '')
        AND (status NOT IN ('Alumni', 'Boyong'))
    `;
    const params = [];
    if (santri_id) {
      query += ` AND id = ?`;
      params.push(santri_id);
    }
    if (jk) {
      query += ` AND jk = ?`;
      params.push(jk);
    }

    const [santriList] = await pool.query(query, params);
    if (!santriList || santriList.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data santri aktif untuk dikirim' });
    }

    // Tentukan target Serial Number mesin (prioritaskan mesin yang berstatus Online)
    let targetSNs = [];
    if (sn_device) {
      targetSNs = [sn_device];
    } else {
      const [onlineDevs] = await pool.query(`
        SELECT DISTINCT sn_device 
        FROM fingerprint_device 
        WHERE sn_device IS NOT NULL AND sn_device != ''
          AND status_koneksi = 'Online'
      `);
      if (onlineDevs && onlineDevs.length > 0) {
        targetSNs = onlineDevs.map(d => d.sn_device);
      } else {
        const [allDevs] = await pool.query(`
          SELECT DISTINCT sn_device 
          FROM fingerprint_device 
          WHERE sn_device IS NOT NULL AND sn_device != ''
        `);
        targetSNs = allDevs.length > 0 ? allDevs.map(d => d.sn_device) : [null];
      }
    }

    let queuedCount = 0;
    for (const targetSN of targetSNs) {
      for (const s of santriList) {
        const pin = s.fingerprint_pin || s.nis || String(s.id);
        const cleanName = (s.nama_santri || 'Santri').replace(/[\t\r\n]/g, '').substring(0, 24);
        const command = `DATA USER PIN=${pin}\tName=${cleanName}\tPri=0\tPasswd=\tCard=\tGrp=1\tTZ=1`;

        await pool.query(`
          INSERT INTO adms_command_queue (sn_device, command, status)
          VALUES (?, ?, 'PENDING')
        `, [targetSN, command]);
        queuedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Berhasil mengantrekan ${santriList.length} santri ke ${targetSNs.length} mesin (${queuedCount} total perintah)`,
      santri_count: santriList.length,
      device_count: targetSNs.length,
      queued: queuedCount
    });
  } catch (err) {
    console.error('[ADMS QUEUE USERS ERR]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 6. REST API: Cek Status Antrean Perintah Mesin
export const getAdmsQueueStatus = async (req, res) => {
  try {
    await ensureAdmsTables();
    const [rows] = await pool.query(`
      SELECT id, sn_device, command, status, return_code, created_at, updated_at 
      FROM adms_command_queue 
      ORDER BY id DESC LIMIT 50
    `);
    const [stats] = await pool.query(`
      SELECT status, COUNT(*) as total 
      FROM adms_command_queue 
      GROUP BY status
    `);
    return res.status(200).json({
      success: true,
      stats,
      data: rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Registry Mesin
export const handleAdmsRegistry = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('RegistryCode=12345\nRegistryState=1\n');
};

// 6. Ping / Keep-Alive
export const handleAdmsPing = async (req, res) => {
  const sn = req.query.SN || req.query.sn || '';
  if (sn) {
    await pool.query("UPDATE fingerprint_device SET status_koneksi = 'Online', updated_at = NOW() WHERE sn_device = ?", [sn]).catch(() => {});
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.status(200).send('OK\n');
};

