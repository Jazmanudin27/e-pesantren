import pool from '../config/database.js';

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
  const table = (req.query.table || '').toUpperCase();
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  console.log(`[ADMS PUSH] Mesin ${sn} mengirim data tabel: ${table || 'DEFAULT'}`);

  // Jika bukan ATTLOG (misal OPERLOG atau config), balas OK
  if (table && table !== 'ATTLOG') {
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
  } catch (eDev) {}

  // Parse baris log absensi
  // Format baris tab-separated: PIN \t YYYY-MM-DD HH:mm:ss \t VerifyMode \t InOutStatus \t WorkCode
  const lines = rawBody.split(/\r?\n/).filter(l => l.trim().length > 0);
  let processedCount = 0;

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 2) continue;

    const pin = cols[0].trim();
    const timestampStr = cols[1].trim(); // contoh: '2026-11-04 18:35:12'
    const parts = timestampStr.split(' ');
    const tanggalScan = parts[0] || new Date().toISOString().split('T')[0];
    const waktuScan = parts[1] || '00:00:00';

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
        console.warn(`[ADMS] PIN ${pin} dari mesin ${sn} tidak cocok dengan santri manapun.`);
        continue;
      }

      const santri = santriRows[0];

      // 2. Tentukan Sesi Kegiatan Berdasarkan Jam Scan
      const [sesiRows] = await pool.query(`
        SELECT id, nama_sesi, jam_target, jam_toleransi_telat, jam_mulai_presensi, jam_tutup_presensi
        FROM kegiatan_sesi 
        WHERE is_active = 1
        ORDER BY 
          (CASE 
            WHEN ? BETWEEN jam_mulai_presensi AND jam_tutup_presensi THEN 0 
            WHEN ? <= jam_tutup_presensi THEN 1
            ELSE 2 
          END),
          jam_mulai_presensi ASC
        LIMIT 1
      `, [waktuScan, waktuScan]);

      const sesi = (sesiRows && sesiRows.length > 0) ? sesiRows[0] : null;
      const sesiId = sesi ? sesi.id : 1;

      // Hitung status: Hadir atau Terlambat
      let statusKehadiran = 'Hadir';
      if (sesi && sesi.jam_toleransi_telat && waktuScan > sesi.jam_toleransi_telat) {
        statusKehadiran = 'Terlambat';
      }

      // 3. Simpan atau Update ke Tabel absensi_jamaah_mengaji (Idempoten / Cegah Duplikat)
      const [existingLog] = await pool.query(`
        SELECT id FROM absensi_jamaah_mengaji 
        WHERE tanggal = ? AND sesi_id = ? AND santri_id = ? 
        LIMIT 1
      `, [tanggalScan, sesiId, santri.id]);

      const keterangan = `Scan Fingerprint Mesin MP340 (SN: ${sn})`;

      if (existingLog && existingLog.length > 0) {
        await pool.query(`
          UPDATE absensi_jamaah_mengaji 
          SET status = ?, waktu_scan = ?, device_id = ?, metode_presensi = 'Fingerprint', keterangan = ?
          WHERE id = ?
        `, [statusKehadiran, waktuScan, deviceId, keterangan, existingLog[0].id]);
      } else {
        await pool.query(`
          INSERT INTO absensi_jamaah_mengaji 
          (tanggal, sesi_id, santri_id, waktu_scan, status, device_id, metode_presensi, keterangan)
          VALUES (?, ?, ?, ?, ?, ?, 'Fingerprint', ?)
        `, [tanggalScan, sesiId, santri.id, waktuScan, statusKehadiran, deviceId, keterangan]);
      }

      processedCount++;
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
    const { sn_device, santri_id, jenis_kelamin } = req.body;

    // Filter santri aktif (bisa filter per gender jika mesin dipisah Ikhwan / Akhwat)
    let query = `SELECT id, nis, nama_santri, fingerprint_pin, jenis_kelamin FROM santri WHERE status_santri = 'Aktif'`;
    const params = [];
    if (santri_id) {
      query += ` AND id = ?`;
      params.push(santri_id);
    }
    if (jenis_kelamin) {
      query += ` AND jenis_kelamin = ?`;
      params.push(jenis_kelamin);
    }

    const [santriList] = await pool.query(query, params);
    if (!santriList || santriList.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada data santri aktif untuk dikirim' });
    }

    // Tentukan target Serial Number mesin (bisa spesifik 1 mesin, atau semua mesin yang terdaftar)
    let targetSNs = [];
    if (sn_device) {
      targetSNs = [sn_device];
    } else {
      const [devs] = await pool.query(`
        SELECT DISTINCT sn_device 
        FROM fingerprint_device 
        WHERE sn_device IS NOT NULL AND sn_device != ''
      `);
      if (devs && devs.length > 0) {
        targetSNs = devs.map(d => d.sn_device);
      } else {
        targetSNs = [null]; // Broadcast jika belum ada SN terdaftar
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

