import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const getAllSantri = async (req, res) => {
  try {
    const { asrama_id } = req.query;
    let sql = `
      SELECT s.*, 
             a.nama_asrama, 
             a.gender as asrama_gender, 
             k.nama_kamar,
             COALESCE(kl.mustahiq, s.mustahiq) as mustahiq,
             COALESCE(kl.munawwib, s.munawwib) as munawwib
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN kelas kl ON (s.kelas_id = kl.id OR s.nama_kelas = kl.nama_kelas)
    `;
    const params = [];
    if (asrama_id) {
      sql += ` WHERE s.asrama_id = ? `;
      params.push(asrama_id);
    }
    sql += ` ORDER BY s.id ASC `;

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Data santri berhasil diambil', { data: rows || [] });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const createSantri = async (req, res) => {
  try {
    const {
      kode_santri, nis, nisn, nama_santri, jk, tempat_lahir, tgl_lahir,
      status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
      nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk,
      capaian_hafalan_juz, tingkat_diniyah, foto, foto_santri, username, password
    } = req.body;

    const finalNis = nis || Date.now().toString().slice(-6);
    const finalUsername = username ? String(username).trim() : finalNis;
    const finalPassword = password ? String(password).trim() : finalNis;
    const finalFoto = foto || foto_santri || null;

    // Pastikan kolom-kolom baru tersedia di database secara dinamis
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tempat_lahir VARCHAR(100) NULL AFTER jk");
    } catch (e1) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tgl_lahir DATE NULL AFTER tempat_lahir");
    } catch (e2) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e3) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN capaian_hafalan_juz INT DEFAULT 0 AFTER kamar_id");
    } catch (e4) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tingkat_diniyah VARCHAR(50) DEFAULT 'Wustho' AFTER capaian_hafalan_juz");
    } catch (e5) {}

    // Dapatkan daftar kolom yang benar-benar ada di tabel santri
    const [existingCols] = await pool.query("SHOW COLUMNS FROM santri");
    const colNames = new Set((existingCols || []).map(c => c.Field));

    const insertCols = ['kode_santri', 'nis'];
    const insertVals = [kode_santri || `STR-${Date.now().toString().slice(-4)}`, finalNis];

    const addCol = (col, val) => {
      if (colNames.has(col)) {
        insertCols.push(col);
        insertVals.push(val);
      }
    };

    addCol('nisn', nisn || null);
    addCol('username', finalUsername);
    addCol('password', finalPassword);
    addCol('nama_santri', nama_santri);
    addCol('foto', finalFoto);
    addCol('jk', jk || 'L');
    addCol('tempat_lahir', tempat_lahir || '');
    addCol('tgl_lahir', tgl_lahir || null);
    addCol('status_santri', status_santri || 'Mukim');
    addCol('asrama_id', asrama_id || null);
    addCol('kamar_id', kamar_id || null);
    addCol('capaian_hafalan_juz', capaian_hafalan_juz || 0);
    addCol('tingkat_diniyah', tingkat_diniyah || 'Wustho');
    addCol('fingerprint_pin', fingerprint_pin || null);
    addCol('rfid_card_uid', rfid_card_uid || null);
    addCol('nama_wali', nama_wali || '');
    addCol('no_wa_wali', no_wa_wali || '');
    addCol('hubungan_wali', hubungan_wali || 'Orang Tua (Ayah)');
    addCol('alamat_asal', alamat_asal || '');
    addCol('status', status || 'Aktif');
    addCol('tahun_masuk', tahun_masuk || '2026/2027');

    const placeholders = insertCols.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO santri (${insertCols.join(', ')}) VALUES (${placeholders})`,
      insertVals
    );

    return sendSuccess(res, 'Data santri berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const updateSantri = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode_santri, nis, nisn, nama_santri, jk, tempat_lahir, tgl_lahir,
      status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
      nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk,
      capaian_hafalan_juz, tingkat_diniyah, foto, foto_santri, username, password
    } = req.body;

    const finalFoto = foto || foto_santri;

    // Pastikan kolom-kolom baru tersedia di database secara dinamis
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tempat_lahir VARCHAR(100) NULL AFTER jk");
    } catch (e1) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tgl_lahir DATE NULL AFTER tempat_lahir");
    } catch (e2) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e3) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN capaian_hafalan_juz INT DEFAULT 0 AFTER kamar_id");
    } catch (e4) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tingkat_diniyah VARCHAR(50) DEFAULT 'Wustho' AFTER capaian_hafalan_juz");
    } catch (e5) {}

    // Dapatkan daftar kolom yang benar-benar ada di tabel santri
    const [existingCols] = await pool.query("SHOW COLUMNS FROM santri");
    const colNames = new Set((existingCols || []).map(c => c.Field));

    const fieldsToUpdate = [];
    const params = [];

    const addIfColExists = (col, val) => {
      if (colNames.has(col)) {
        fieldsToUpdate.push(`${col} = ?`);
        params.push(val);
      }
    };

    if (kode_santri !== undefined) addIfColExists('kode_santri', kode_santri);
    if (nis !== undefined) addIfColExists('nis', nis);
    if (nisn !== undefined) addIfColExists('nisn', nisn);
    if (nama_santri !== undefined) addIfColExists('nama_santri', nama_santri);
    if (jk !== undefined) addIfColExists('jk', jk);
    if (tempat_lahir !== undefined) addIfColExists('tempat_lahir', tempat_lahir);
    if (tgl_lahir !== undefined) addIfColExists('tgl_lahir', tgl_lahir || null);
    if (status_santri !== undefined) addIfColExists('status_santri', status_santri);
    if (asrama_id !== undefined) addIfColExists('asrama_id', asrama_id);
    if (kamar_id !== undefined) addIfColExists('kamar_id', kamar_id);
    if (fingerprint_pin !== undefined) addIfColExists('fingerprint_pin', fingerprint_pin);
    if (rfid_card_uid !== undefined) addIfColExists('rfid_card_uid', rfid_card_uid);
    if (nama_wali !== undefined) addIfColExists('nama_wali', nama_wali);
    if (no_wa_wali !== undefined) addIfColExists('no_wa_wali', no_wa_wali);
    if (hubungan_wali !== undefined) addIfColExists('hubungan_wali', hubungan_wali);
    if (alamat_asal !== undefined) addIfColExists('alamat_asal', alamat_asal);
    if (status !== undefined) addIfColExists('status', status);
    if (tahun_masuk !== undefined) addIfColExists('tahun_masuk', tahun_masuk);
    if (capaian_hafalan_juz !== undefined) addIfColExists('capaian_hafalan_juz', capaian_hafalan_juz || 0);
    if (tingkat_diniyah !== undefined) addIfColExists('tingkat_diniyah', tingkat_diniyah || 'Wustho');

    if (finalFoto !== undefined) addIfColExists('foto', finalFoto);
    if (username !== undefined && String(username).trim() !== '') addIfColExists('username', String(username).trim());
    if (password !== undefined && String(password).trim() !== '') addIfColExists('password', String(password).trim());

    if (fieldsToUpdate.length > 0) {
      params.push(id);
      await pool.query(`UPDATE santri SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, params);
    }

    return sendSuccess(res, 'Data santri berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const deleteSantri = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM santri WHERE id = ?', [id]);
    return sendSuccess(res, 'Data santri berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

export const importSantri = async (req, res) => {
  try {
    const { santriList } = req.body;
    if (!Array.isArray(santriList) || santriList.length === 0) {
      return sendError(res, 'Data santri kosong atau format tidak sesuai', 400);
    }

    // Ambil master asrama & kamar untuk auto-mapping nama -> id
    let asramaMap = {};
    let kamarMap = {};
    try {
      const [asramas] = await pool.query('SELECT id, nama_asrama FROM asrama');
      (asramas || []).forEach(a => { 
        if (a.nama_asrama) asramaMap[a.nama_asrama.toLowerCase().trim()] = a.id; 
      });
      const [kamars] = await pool.query('SELECT id, nama_kamar FROM kamar_kobong');
      (kamars || []).forEach(k => { 
        if (k.nama_kamar) kamarMap[k.nama_kamar.toLowerCase().trim()] = k.id; 
      });
    } catch (e) {
      console.warn('[IMPORT SANTRI] Note asrama/kamar mapping:', e.message);
    }

    // Cek kolom kelas di tabel santri secara dinamis
    let hasKelasCol = false;
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM santri LIKE 'kelas'`);
      hasKelasCol = cols && cols.length > 0;
      if (!hasKelasCol) {
        await pool.query("ALTER TABLE santri ADD COLUMN kelas VARCHAR(100) NULL AFTER status_santri");
        hasKelasCol = true;
      }
    } catch (e) {}

    let inserted = 0;
    let updated = 0;
    const errors = [];

    for (let i = 0; i < santriList.length; i++) {
      const row = santriList[i];
      const nama = String(row.nama_santri || row.nama || row.Nama || row['Nama Santri'] || '').trim();
      if (!nama) continue; // Lewati baris kosong

      let nis = String(row.nis || row.NIS || row['No Induk'] || '').trim();
      if (!nis) {
        nis = `2601${String(Date.now()).slice(-5)}${i + 1}`;
      }

      const nisn = String(row.nisn || row.NISN || '').trim() || null;
      const kodeSantri = String(row.kode_santri || row['Kode Santri'] || `STR-${nis}`).trim();
      const username = String(row.username || nis).trim();
      const password = String(row.password || nis).trim();

      // Normalisasi Gender (L/P)
      const rawJk = String(row.jk || row.gender || row['Jenis Kelamin'] || 'L').toUpperCase().trim();
      const jk = (rawJk.startsWith('P') || rawJk.includes('PEREMPUAN') || rawJk.includes('AKHWAT') || rawJk.includes('WANITA')) ? 'P' : 'L';

      // Normalisasi Status Santri
      const rawStatusSantri = String(row.status_santri || row['Status Santri'] || 'Mukim').trim();
      const statusSantri = rawStatusSantri.toLowerCase().includes('kalong') ? 'Kalong' : 
                           rawStatusSantri.toLowerCase().includes('non') ? 'Non-Mukim' : 'Mukim';

      // Auto-mapping Asrama & Kamar
      let asramaId = row.asrama_id ? parseInt(row.asrama_id) : null;
      const asramaNama = String(row.nama_asrama || row.asrama || row['Asrama'] || '').toLowerCase().trim();
      if (!asramaId && asramaNama && asramaMap[asramaNama]) {
        asramaId = asramaMap[asramaNama];
      }

      let kamarId = row.kamar_id ? parseInt(row.kamar_id) : null;
      const kamarNama = String(row.nama_kamar || row.kamar || row['Kamar'] || row['Kobong'] || '').toLowerCase().trim();
      if (!kamarId && kamarNama && kamarMap[kamarNama]) {
        kamarId = kamarMap[kamarNama];
      }

      const tempatLahir = String(row.tempat_lahir || row['Tempat Lahir'] || 'Tasikmalaya').trim();
      
      // Parse tanggal lahir ke YYYY-MM-DD
      let tglLahir = row.tgl_lahir || row['Tanggal Lahir'] || null;
      if (tglLahir) {
        const dmyMatch = String(tglLahir).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dmyMatch) {
          tglLahir = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        }
      }

      const namaWali = String(row.nama_wali || row['Nama Wali'] || row['Wali'] || 'Wali Santri').trim();
      const noWaWali = String(row.no_wa_wali || row['No WA'] || row['No HP Wali'] || row['WhatsApp'] || '-').replace(/[^0-9+]/g, '');
      const hubunganWali = String(row.hubungan_wali || row['Hubungan'] || 'Orang Tua').trim();
      const alamatAsal = String(row.alamat_asal || row.alamat || row['Alamat'] || '-').trim();
      const status = String(row.status || 'Aktif').trim();
      const tahunMasuk = String(row.tahun_masuk || row['Tahun Masuk'] || '2026/2027').trim();
      const kelas = String(row.kelas || row['Kelas'] || '').trim();
      const fingerprintPin = row.fingerprint_pin || row['PIN Fingerprint'] || null;
      const rfidCardUid = row.rfid_card_uid || row['RFID'] || null;

      try {
        // Cek apakah NIS atau kode_santri sudah ada di DB
        const [existing] = await pool.query('SELECT id FROM santri WHERE nis = ? OR kode_santri = ? LIMIT 1', [nis, kodeSantri]);

        if (existing && existing.length > 0) {
          const existingId = existing[0].id;
          if (hasKelasCol) {
            await pool.query(`
              UPDATE santri SET
                nama_santri = ?, jk = ?, status_santri = ?, asrama_id = COALESCE(?, asrama_id),
                kamar_id = COALESCE(?, kamar_id), tempat_lahir = ?, tgl_lahir = COALESCE(?, tgl_lahir),
                nama_wali = ?, no_wa_wali = ?, hubungan_wali = ?, alamat_asal = ?,
                status = ?, tahun_masuk = ?, kelas = COALESCE(?, kelas)
              WHERE id = ?
            `, [
              nama, jk, statusSantri, asramaId, kamarId, tempatLahir, tglLahir,
              namaWali, noWaWali, hubunganWali, alamatAsal, status, tahunMasuk, kelas || null, existingId
            ]);
          } else {
            await pool.query(`
              UPDATE santri SET
                nama_santri = ?, jk = ?, status_santri = ?, asrama_id = COALESCE(?, asrama_id),
                kamar_id = COALESCE(?, kamar_id), tempat_lahir = ?, tgl_lahir = COALESCE(?, tgl_lahir),
                nama_wali = ?, no_wa_wali = ?, hubungan_wali = ?, alamat_asal = ?,
                status = ?, tahun_masuk = ?
              WHERE id = ?
            `, [
              nama, jk, statusSantri, asramaId, kamarId, tempatLahir, tglLahir,
              namaWali, noWaWali, hubunganWali, alamatAsal, status, tahunMasuk, existingId
            ]);
          }
          updated++;
        } else {
          if (hasKelasCol) {
            await pool.query(`
              INSERT INTO santri (
                kode_santri, nis, nisn, username, password, nama_santri, jk, tempat_lahir, tgl_lahir,
                status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
                nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk, kelas
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              kodeSantri, nis, nisn, username, password, nama, jk, tempatLahir, tglLahir,
              statusSantri, asramaId, kamarId, fingerprintPin, rfidCardUid,
              namaWali, noWaWali, hubunganWali, alamatAsal, status, tahunMasuk, kelas || null
            ]);
          } else {
            await pool.query(`
              INSERT INTO santri (
                kode_santri, nis, nisn, username, password, nama_santri, jk, tempat_lahir, tgl_lahir,
                status_santri, asrama_id, kamar_id, fingerprint_pin, rfid_card_uid,
                nama_wali, no_wa_wali, hubungan_wali, alamat_asal, status, tahun_masuk
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              kodeSantri, nis, nisn, username, password, nama, jk, tempatLahir, tglLahir,
              statusSantri, asramaId, kamarId, fingerprintPin, rfidCardUid,
              namaWali, noWaWali, hubunganWali, alamatAsal, status, tahunMasuk
            ]);
          }
          inserted++;
        }
      } catch (rowErr) {
        console.error(`[IMPORT SANTRI ERROR] Baris ${i + 1} (${nama}):`, rowErr.message);
        errors.push({ baris: i + 1, nama, error: rowErr.message });
      }
    }

    return sendSuccess(res, `Import data santri selesai: ${inserted} baru ditambahkan, ${updated} diperbarui.`, {
      inserted,
      updated,
      total: santriList.length,
      errors
    });
  } catch (err) {
    return sendError(res, `Gagal memproses import data santri: ${err.message}`, 500);
  }
};
