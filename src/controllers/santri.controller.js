import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

let hasCheckedFaceDescriptorCol = false;

export const getAllSantri = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (!hasCheckedFaceDescriptorCol) {
      try {
        await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
      } catch (eCol) {}
      hasCheckedFaceDescriptorCol = true;
    }

    const { 
      page = 1, 
      limit = 25, 
      search = '', 
      tab = 'semua', 
      asrama_id, 
      asrama,
      status, 
      tingkat, 
      tahun,
      kelas_id,
      kelas,
      sekolah_id,
      sekolah,
      jenjang,
      all = 'false'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 25);
    const offset = (pageNum - 1) * limitNum;

    // Conditions
    const whereConditions = [];
    const params = [];

    // Search query across fields (nama, nis, kelas, wali, asrama, kamar)
    if (search && String(search).trim() !== '') {
      const q = `%${String(search).trim()}%`;
      whereConditions.push(`(
        s.nama_santri LIKE ? OR 
        s.nis LIKE ? OR 
        s.nama_kelas LIKE ? OR 
        s.nama_wali LIKE ? OR 
        a.nama_asrama LIKE ? OR 
        k.nama_kamar LIKE ?
      )`);
      params.push(q, q, q, q, q, q);
    }

    // Tab Filter
    if (tab === 'boys' || tab === 'L') {
      whereConditions.push("s.jk = 'L'");
    } else if (tab === 'girls' || tab === 'P') {
      whereConditions.push("s.jk = 'P'");
    } else if (tab === 'mukim') {
      whereConditions.push("s.status_santri = 'Mukim'");
    } else if (tab === 'kalong') {
      whereConditions.push("s.status_santri = 'Kalong'");
    } else if (tab === 'alumni') {
      whereConditions.push("s.status IN ('Alumni', 'Boyong')");
    }

    // Asrama filter
    if (asrama_id) {
      whereConditions.push("s.asrama_id = ?");
      params.push(asrama_id);
    } else if (asrama && asrama !== 'Semua Asrama') {
      whereConditions.push("a.nama_asrama LIKE ?");
      params.push(`%${asrama}%`);
    }

    // Status filter
    if (status && status !== 'Semua Status') {
      whereConditions.push("s.status = ?");
      params.push(status);
    }

    // Tingkat filter
    if (tingkat && tingkat !== 'Semua Tingkat') {
      whereConditions.push("s.tingkat_diniyah = ?");
      params.push(tingkat);
    }

    // Tahun masuk filter
    if (tahun && tahun !== 'Semua Tahun' && !String(tahun).includes('Tahun 2026/2027')) {
      whereConditions.push("s.tahun_masuk LIKE ?");
      params.push(`%${String(tahun).replace('Tahun ', '').trim()}%`);
    }

    // Kelas filter
    if (kelas_id && kelas_id !== 'Semua') {
      whereConditions.push("(s.kelas_id = ? OR s.nama_kelas = ?)");
      params.push(kelas_id, kelas_id);
    } else if (kelas && kelas !== 'Semua Kelas' && kelas !== 'Semua') {
      whereConditions.push("(s.nama_kelas LIKE ? OR kl.nama_kelas LIKE ?)");
      params.push(`%${kelas}%`, `%${kelas}%`);
    }

    // Sekolah filter
    if (sekolah_id && sekolah_id !== 'Semua') {
      whereConditions.push("s.sekolah_id = ?");
      params.push(sekolah_id);
    } else if (sekolah && sekolah !== 'Semua Sekolah' && sekolah !== 'Semua') {
      whereConditions.push("(s.nama_sekolah LIKE ? OR sk.nama_sekolah LIKE ? OR sk.jenjang = ?)");
      params.push(`%${sekolah}%`, `%${sekolah}%`, sekolah);
    } else if (jenjang && jenjang !== 'Semua') {
      whereConditions.push("(sk.jenjang = ? OR s.nama_sekolah LIKE ?)");
      params.push(jenjang, `%${jenjang}%`);
    }

    const whereClause = whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')} ` : '';

    // Count filtered records
    const countSql = `
      SELECT COUNT(*) as total
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      ${whereClause}
    `;
    const [countRows] = await pool.query(countSql, params);
    const totalFiltered = countRows[0]?.total || 0;

    // Base data query
    let dataSql = `
      SELECT s.*, 
             a.nama_asrama, 
             a.gender as asrama_gender, 
             k.nama_kamar,
             COALESCE(kl.mustahiq, s.mustahiq) as mustahiq,
             COALESCE(kl.munawwib, s.munawwib) as munawwib,
             COALESCE(sk.nama_sekolah, s.nama_sekolah) as nama_sekolah,
             sk.jenjang as sekolah_jenjang
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN kelas kl ON (s.kelas_id = kl.id OR s.nama_kelas = kl.nama_kelas)
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      ${whereClause}
      ORDER BY s.id ASC
    `;

    let dataParams = [...params];
    if (all !== 'true' && limit !== 'all') {
      dataSql += ` LIMIT ? OFFSET ? `;
      dataParams.push(limitNum, offset);
    }

    const [rows] = await pool.query(dataSql, dataParams);

    const sanitizedRows = (rows || []).map(r => {
      const rawAlamat = r.alamat_asal ? String(r.alamat_asal).trim() : '';
      const isDummyAlamat = ['pondok pesantren nurul wafa', 'pp nurul wafa', 'pp. nurul wafa', '-'].includes(rawAlamat.toLowerCase());
      const rawWali = r.nama_wali ? String(r.nama_wali).trim() : '';
      const isDummyWali = ['wali santri', '-'].includes(rawWali.toLowerCase());
      const rawWa = r.no_wa_wali ? String(r.no_wa_wali).trim() : '';
      return {
        ...r,
        alamat_asal: isDummyAlamat ? '' : rawAlamat,
        nama_wali: isDummyWali ? '' : rawWali,
        no_wa_wali: rawWa === '-' ? '' : rawWa
      };
    });

    // Global Stats for top cards & tab counts
    const [statsRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalAll,
        COALESCE(SUM(CASE WHEN jk = 'L' THEN 1 ELSE 0 END), 0) as totalBoys,
        COALESCE(SUM(CASE WHEN jk = 'P' THEN 1 ELSE 0 END), 0) as totalGirls,
        COALESCE(SUM(CASE WHEN status_santri = 'Mukim' THEN 1 ELSE 0 END), 0) as totalMukim,
        COALESCE(SUM(CASE WHEN status_santri = 'Kalong' THEN 1 ELSE 0 END), 0) as totalKalong,
        COALESCE(SUM(CASE WHEN status IN ('Alumni', 'Boyong') THEN 1 ELSE 0 END), 0) as totalAlumni
      FROM santri
    `);

    const stats = statsRows[0] || {
      totalAll: 0,
      totalBoys: 0,
      totalGirls: 0,
      totalMukim: 0,
      totalKalong: 0,
      totalAlumni: 0
    };

    return sendSuccess(res, 'Data santri berhasil diambil', { 
      data: sanitizedRows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limitNum) || 1
      },
      stats
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

const toIntOrNull = (val) => {
  if (val === undefined || val === null || String(val).trim() === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
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
    const finalUsername = username ? String(username).trim() : (nisn ? String(nisn).trim() : finalNis);
    const finalPassword = password ? String(password).trim() : '123456';
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
    addCol('asrama_id', toIntOrNull(asrama_id));
    addCol('kamar_id', toIntOrNull(kamar_id));
    addCol('capaian_hafalan_juz', toIntOrNull(capaian_hafalan_juz) || 0);
    addCol('tingkat_diniyah', tingkat_diniyah || 'Wustho');
    addCol('nama_kelas', req.body.nama_kelas || null);
    addCol('kelas_id', toIntOrNull(req.body.kelas_id));
    addCol('sekolah_id', toIntOrNull(req.body.sekolah_id));
    addCol('nama_sekolah', req.body.nama_sekolah || null);
    addCol('tingkat_sekolah', req.body.tingkat_sekolah || null);
    addCol('fingerprint_pin', toIntOrNull(fingerprint_pin));
    addCol('rfid_card_uid', rfid_card_uid ? String(rfid_card_uid).trim() : null);
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
    if (asrama_id !== undefined) addIfColExists('asrama_id', toIntOrNull(asrama_id));
    if (kamar_id !== undefined) addIfColExists('kamar_id', toIntOrNull(kamar_id));
    if (fingerprint_pin !== undefined) addIfColExists('fingerprint_pin', toIntOrNull(fingerprint_pin));
    if (rfid_card_uid !== undefined) addIfColExists('rfid_card_uid', rfid_card_uid ? String(rfid_card_uid).trim() : null);
    if (nama_wali !== undefined) addIfColExists('nama_wali', nama_wali);
    if (no_wa_wali !== undefined) addIfColExists('no_wa_wali', no_wa_wali);
    if (hubungan_wali !== undefined) addIfColExists('hubungan_wali', hubungan_wali);
    if (alamat_asal !== undefined) addIfColExists('alamat_asal', alamat_asal);
    if (status !== undefined) addIfColExists('status', status);
    if (tahun_masuk !== undefined) addIfColExists('tahun_masuk', tahun_masuk);
    if (capaian_hafalan_juz !== undefined) addIfColExists('capaian_hafalan_juz', toIntOrNull(capaian_hafalan_juz) || 0);
    if (tingkat_diniyah !== undefined) addIfColExists('tingkat_diniyah', tingkat_diniyah || 'Wustho');
    if (req.body.nama_kelas !== undefined) addIfColExists('nama_kelas', req.body.nama_kelas);
    if (req.body.kelas_id !== undefined) addIfColExists('kelas_id', toIntOrNull(req.body.kelas_id));
    if (req.body.sekolah_id !== undefined) addIfColExists('sekolah_id', toIntOrNull(req.body.sekolah_id));
    if (req.body.nama_sekolah !== undefined) addIfColExists('nama_sekolah', req.body.nama_sekolah);
    if (req.body.tingkat_sekolah !== undefined) addIfColExists('tingkat_sekolah', req.body.tingkat_sekolah);

    if (req.body.clear_face === true) {
      addIfColExists('foto', null);
      addIfColExists('face_descriptor', null);
    } else if (foto !== undefined || foto_santri !== undefined) {
      const targetFoto = foto !== undefined ? foto : foto_santri;
      addIfColExists('foto', targetFoto);
      if (targetFoto === null || targetFoto === '') {
        addIfColExists('face_descriptor', null);
      }
    }
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
      const username = String(row.username || nisn || nis).trim();
      const password = String(row.password || '123456').trim();

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

      const tempatLahir = String(row.tempat_lahir || row['Tempat Lahir'] || '').trim();
      
      // Parse tanggal lahir ke YYYY-MM-DD
      let tglLahir = row.tgl_lahir || row['Tanggal Lahir'] || null;
      if (tglLahir) {
        const dmyMatch = String(tglLahir).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dmyMatch) {
          tglLahir = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
        }
      }

      const rawNamaWali = String(row.nama_wali || row['Nama Wali'] || row['Wali'] || '').trim();
      const namaWali = (rawNamaWali === '-' || rawNamaWali.toLowerCase() === 'wali santri') ? '' : rawNamaWali;
      const noWaWali = String(row.no_wa_wali || row['No WA'] || row['No HP Wali'] || row['WhatsApp'] || '').replace(/[^0-9+]/g, '');
      const hubunganWali = String(row.hubungan_wali || row['Hubungan'] || '').trim();
      const rawAlamatAsal = String(row.alamat_asal || row.alamat || row['Alamat'] || '').trim();
      const alamatAsal = (rawAlamatAsal === '-' || rawAlamatAsal.toLowerCase() === 'pondok pesantren nurul wafa') ? '' : rawAlamatAsal;
      const status = String(row.status || 'Aktif').trim();
      const tahunMasuk = String(row.tahun_masuk || row['Tahun Masuk'] || '').trim();
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
