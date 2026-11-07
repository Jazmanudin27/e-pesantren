import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

let isSekolahDbInitialized = false;

// Data Rincian Awal Masuk 2026/2027 Sesuai Dokumen Resmi Pesantren Nurul Wafa
export const RINCIAN_AWAL_MASUK_MASTER = {
  SMP: {
    jenjang: 'SMP',
    nama_sekolah: 'SMP Nurul Wafa',
    nominal_spp: 505000,
    total_adm_sekolah: 890000,
    total_adm_pesantren: 1000000,
    total_masuk_juli: 2395000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 505000 }
  },
  SMA: {
    jenjang: 'SMA',
    nama_sekolah: 'SMA Nurul Wafa',
    nominal_spp: 565000,
    total_adm_sekolah: 1040000,
    total_adm_pesantren: 1000000,
    total_masuk_juli: 2605000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Almamater', biaya: 150000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 565000 }
  },
  SMK: {
    jenjang: 'SMK',
    nama_sekolah: 'SMK Nurul Wafa',
    nominal_spp: 565000,
    total_adm_sekolah: 1400000,
    total_adm_pesantren: 1000000,
    total_masuk_juli: 2965000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Almamater', biaya: 150000 },
      { uraian: 'Baju Praktek', biaya: 110000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Alat Praktek', biaya: 250000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 565000 }
  }
};

/**
 * Pastikan tabel sekolah, tabel komponen rincian, dan kolom sekolah di santri tersedia
 */
export const ensureSekolahTablesAndMapping = async () => {
  if (isSekolahDbInitialized) return;
  try {
    // 1. Buat Tabel Master Sekolah
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`sekolah\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_sekolah\` VARCHAR(50) NOT NULL UNIQUE,
        \`nama_sekolah\` VARCHAR(150) NOT NULL,
        \`jenjang\` ENUM('SMP', 'SMA', 'SMK') NOT NULL DEFAULT 'SMP',
        \`nominal_spp\` DECIMAL(12,2) NOT NULL DEFAULT 500000.00,
        \`nominal_adm_sekolah\` DECIMAL(12,2) NOT NULL DEFAULT 1000000.00,
        \`nominal_adm_pesantren\` DECIMAL(12,2) NOT NULL DEFAULT 1000000.00,
        \`total_masuk\` DECIMAL(12,2) NOT NULL DEFAULT 2500000.00,
        \`keterangan\` VARCHAR(255) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_sekolah_jenjang\` (\`jenjang\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Buat Tabel Rincian Komponen Awal Masuk (Per Item)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`sekolah_rincian_biaya\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`sekolah_id\` INT NOT NULL,
        \`jenjang\` ENUM('SMP', 'SMA', 'SMK') NOT NULL,
        \`kategori_komponen\` ENUM('Adm Sekolah', 'Adm Pesantren', 'SPP') NOT NULL,
        \`uraian\` VARCHAR(150) NOT NULL,
        \`biaya\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`urutan\` INT NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_srb_jenjang\` (\`jenjang\`),
        INDEX \`idx_srb_sekolah\` (\`sekolah_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tambah Kolom Sekolah di Tabel Santri jika belum ada
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN sekolah_id INT NULL AFTER status_santri");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN nama_sekolah VARCHAR(100) NULL AFTER sekolah_id");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN tingkat_sekolah VARCHAR(50) NULL AFTER nama_sekolah");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD INDEX idx_santri_sekolah (sekolah_id)");
    } catch (e) {}

    // 4. Seed Data Master Sekolah (SMP, SMA, SMK)
    const [existingSekolah] = await pool.query('SELECT COUNT(*) as cnt FROM sekolah');
    if (!existingSekolah[0] || existingSekolah[0].cnt === 0) {
      await pool.query(`
        INSERT INTO sekolah (id, kode_sekolah, nama_sekolah, jenjang, nominal_spp, nominal_adm_sekolah, nominal_adm_pesantren, total_masuk, keterangan)
        VALUES
          (1, 'SMP-NWF', 'SMP Nurul Wafa', 'SMP', 505000.00, 890000.00, 1000000.00, 2395000.00, 'Sekolah Menengah Pertama Islam Terpadu Nurul Wafa'),
          (2, 'SMA-NWF', 'SMA Nurul Wafa', 'SMA', 565000.00, 1040000.00, 1000000.00, 2605000.00, 'Sekolah Menengah Atas Nurul Wafa'),
          (3, 'SMK-NWF', 'SMK Nurul Wafa', 'SMK', 565000.00, 1400000.00, 1000000.00, 2965000.00, 'Sekolah Menengah Kejuruan Nurul Wafa')
        ON DUPLICATE KEY UPDATE 
          nominal_spp = VALUES(nominal_spp),
          nominal_adm_sekolah = VALUES(nominal_adm_sekolah),
          nominal_adm_pesantren = VALUES(nominal_adm_pesantren),
          total_masuk = VALUES(total_masuk);
      `);
    }

    // 5. Seed Rincian Biaya Item Masuk jika masih kosong
    const [countRincian] = await pool.query('SELECT COUNT(*) as cnt FROM sekolah_rincian_biaya');
    if (!countRincian[0] || countRincian[0].cnt === 0) {
      const [sekolahRows] = await pool.query('SELECT id, jenjang FROM sekolah');
      const sekolahMap = {};
      (sekolahRows || []).forEach(s => { sekolahMap[s.jenjang] = s.id; });

      for (const [jenjangKey, data] of Object.entries(RINCIAN_AWAL_MASUK_MASTER)) {
        const sId = sekolahMap[jenjangKey] || 1;
        let urut = 1;
        for (const item of data.adm_sekolah) {
          await pool.query(
            'INSERT INTO sekolah_rincian_biaya (sekolah_id, jenjang, kategori_komponen, uraian, biaya, urutan) VALUES (?, ?, ?, ?, ?, ?)',
            [sId, jenjangKey, 'Adm Sekolah', item.uraian, item.biaya, urut++]
          );
        }
        for (const item of data.adm_pesantren) {
          await pool.query(
            'INSERT INTO sekolah_rincian_biaya (sekolah_id, jenjang, kategori_komponen, uraian, biaya, urutan) VALUES (?, ?, ?, ?, ?, ?)',
            [sId, jenjangKey, 'Adm Pesantren', item.uraian, item.biaya, urut++]
          );
        }
      }
    }

    // Bersihkan SPP Juli dari tabel rincian awal masuk jika sebelumnya sempat terisi
    try {
      await pool.query("DELETE FROM sekolah_rincian_biaya WHERE kategori_komponen = 'SPP' OR uraian LIKE '%Makan dan SPP%'");
    } catch (e) {}

    // 6. Mapping Santri ke Sekolah & Kelas Formal Sesuai Aturan User:
    // - Kelas ngaji 1, 2, 3 -> Masuk ke SMP (Kelas 7, 8, 9)
    // - Kelas 4 -> Masuk ke Kelas 10 SMA
    // - Kelas 5 -> Masuk ke Kelas 11 SMA
    // - Sisa lainnya -> Masuk ke Kelas 12 SMA
    const [smpRows] = await pool.query("SELECT id FROM sekolah WHERE jenjang = 'SMP' LIMIT 1");
    const [smaRows] = await pool.query("SELECT id FROM sekolah WHERE jenjang = 'SMA' LIMIT 1");
    const smpId = smpRows[0]?.id || 1;
    const smaId = smaRows[0]?.id || 2;

    // a. Kelas 1 Ngaji / 1 Wustho -> SMP Kelas 7
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMP Nurul Wafa', tingkat_sekolah = 'Kelas 7'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
        AND (nama_kelas LIKE '%1 Wustho%' OR nama_kelas LIKE '%Kelas 1 %' OR nama_kelas = 'Kelas 1' OR nama_kelas LIKE '%1W%')
    `, [smpId]);

    // b. Kelas 2 Ngaji / 2 Wustho -> SMP Kelas 8
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMP Nurul Wafa', tingkat_sekolah = 'Kelas 8'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
        AND (nama_kelas LIKE '%2 Wustho%' OR nama_kelas LIKE '%Kelas 2 %' OR nama_kelas = 'Kelas 2' OR nama_kelas LIKE '%2W%')
    `, [smpId]);

    // c. Kelas 3 Ngaji / 3 Wustho -> SMP Kelas 9
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMP Nurul Wafa', tingkat_sekolah = 'Kelas 9'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
        AND (nama_kelas LIKE '%3 Wustho%' OR nama_kelas LIKE '%Kelas 3 %' OR nama_kelas = 'Kelas 3' OR nama_kelas LIKE '%3W%')
    `, [smpId]);

    // d. Kelas 4 Ngaji / 1 Ulya -> SMA Kelas 10
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMA Nurul Wafa', tingkat_sekolah = 'Kelas 10'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
        AND (nama_kelas LIKE '%1 Ulya%' OR nama_kelas LIKE '%Kelas 4%' OR nama_kelas LIKE '%10%' OR nama_kelas LIKE '%1U%')
    `, [smaId]);

    // e. Kelas 5 Ngaji / 2 Ulya -> SMA Kelas 11
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMA Nurul Wafa', tingkat_sekolah = 'Kelas 11'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
        AND (nama_kelas LIKE '%2 Ulya%' OR nama_kelas LIKE '%Kelas 5%' OR nama_kelas LIKE '%11%' OR nama_kelas LIKE '%2U%')
    `, [smaId]);

    // f. Sisa Santri Lainnya -> SMA Kelas 12
    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = 'SMA Nurul Wafa', tingkat_sekolah = 'Kelas 12'
      WHERE (sekolah_id IS NULL OR nama_sekolah IS NULL OR nama_sekolah = '')
    `, [smaId]);

    // g. Pastikan semua master komponen biaya per jenjang tersedia di keuangan_komponen_biaya
    try {
      const [existingKomp] = await pool.query('SELECT nama_komponen FROM keuangan_komponen_biaya');
      const kompNames = new Set((existingKomp || []).map(k => (k.nama_komponen || '').toLowerCase()));

      const standardComponents = [
        { nama: 'SPP Bulanan SMP', kat: 'Bulanan', nom: 505000, desc: 'SPP & Makan Santri Jenjang SMP (Rp 505.000 / bln)' },
        { nama: 'SPP Bulanan SMA', kat: 'Bulanan', nom: 565000, desc: 'SPP & Makan Santri Jenjang SMA (Rp 565.000 / bln)' },
        { nama: 'SPP Bulanan SMK', kat: 'Bulanan', nom: 565000, desc: 'SPP & Makan Santri Jenjang SMK (Rp 565.000 / bln)' },
        { nama: 'Biaya Awal Masuk SMP', kat: 'Biaya Masuk', nom: 1890000, desc: 'Adm Sekolah (890rb) + Adm Pesantren (1jt) Jenjang SMP' },
        { nama: 'Biaya Awal Masuk SMA', kat: 'Biaya Masuk', nom: 2040000, desc: 'Adm Sekolah (1.04jt) + Adm Pesantren (1jt) Jenjang SMA' },
        { nama: 'Biaya Awal Masuk SMK', kat: 'Biaya Masuk', nom: 2400000, desc: 'Adm Sekolah (1.4jt) + Adm Pesantren (1jt) Jenjang SMK' },
        { nama: 'Adm Pesantren', kat: 'Biaya Masuk', nom: 1000000, desc: 'Adm Pesantren Nurul Wafa (Rp 1.000.000)' },
        { nama: 'Adm Sekolah SMP', kat: 'Biaya Masuk', nom: 890000, desc: 'Adm Sekolah SMP Nurul Wafa (Rp 890.000)' },
        { nama: 'Adm Sekolah SMA', kat: 'Biaya Masuk', nom: 1040000, desc: 'Adm Sekolah SMA Nurul Wafa (Rp 1.040.000)' },
        { nama: 'Adm Sekolah SMK', kat: 'Biaya Masuk', nom: 1400000, desc: 'Adm Sekolah SMK Nurul Wafa (Rp 1.400.000)' }
      ];

      for (const c of standardComponents) {
        if (!kompNames.has(c.nama.toLowerCase())) {
          await pool.query(`
            INSERT INTO keuangan_komponen_biaya (nama_komponen, kategori, nominal_default, deskripsi, is_active)
            VALUES (?, ?, ?, ?, 1)
          `, [c.nama, c.kat, c.nom, c.desc]);
        }
      }
    } catch (e) {
      console.warn('[KOMP BIAYA SEED NOTICE]', e.message);
    }

    isSekolahDbInitialized = true;
    console.log('[SEKOLAH DB INIT] Tabel sekolah, rincian biaya, dan mapping santri berhasil disiapkan.');
  } catch (err) {
    console.warn('[SEKOLAH DB INIT ERROR]', err.message);
  }
};

/**
 * GET /api/sekolah
 * Mengambil daftar sekolah beserta rekap santri
 */
export const getDaftarSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const [rows] = await pool.query(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM santri sn WHERE sn.sekolah_id = s.id) as total_santri,
        (SELECT COUNT(*) FROM santri sn WHERE sn.sekolah_id = s.id AND sn.jk = 'L') as total_santri_putra,
        (SELECT COUNT(*) FROM santri sn WHERE sn.sekolah_id = s.id AND sn.jk = 'P') as total_santri_putri
      FROM sekolah s
      ORDER BY s.id ASC
    `);

    return sendSuccess(res, 'Daftar sekolah berhasil diambil', rows);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/sekolah/rincian-biaya
 * Mengambil rincian biaya awal masuk 2026/2027 lengkap per jenjang (SMP, SMA, SMK)
 */
export const getRincianBiayaSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const { jenjang } = req.query;

    const [items] = await pool.query(`
      SELECT srb.*, s.nama_sekolah, s.nominal_spp, s.total_masuk
      FROM sekolah_rincian_biaya srb
      JOIN sekolah s ON srb.sekolah_id = s.id
      ${jenjang ? 'WHERE srb.jenjang = ?' : ''}
      ORDER BY srb.jenjang ASC, srb.kategori_komponen ASC, srb.urutan ASC
    `, jenjang ? [jenjang.toUpperCase()] : []);

    return sendSuccess(res, 'Rincian biaya awal masuk berhasil diambil', {
      master: RINCIAN_AWAL_MASUK_MASTER,
      items: items
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/sekolah/assign-santri
 * Memperbarui sekolah dan kelas formal seorang santri atau bulk santri
 */
export const assignSantriSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const { santri_id, sekolah_id, tingkat_sekolah } = req.body;

    if (!santri_id || !sekolah_id) {
      return sendError(res, 'santri_id dan sekolah_id wajib diisi', 400);
    }

    const [sekRows] = await pool.query('SELECT nama_sekolah, jenjang FROM sekolah WHERE id = ?', [sekolah_id]);
    if (!sekRows || sekRows.length === 0) {
      return sendError(res, 'Sekolah tidak ditemukan', 404);
    }

    const { nama_sekolah } = sekRows[0];

    await pool.query(`
      UPDATE santri 
      SET sekolah_id = ?, nama_sekolah = ?, tingkat_sekolah = ?
      WHERE id = ?
    `, [sekolah_id, nama_sekolah, tingkat_sekolah || null, santri_id]);

    return sendSuccess(res, `Santri berhasil dimasukkan ke ${nama_sekolah} (${tingkat_sekolah || '-'})`);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * Helper: Hitung Ulang Total Biaya per Jenjang Sekolah dan Sync ke Tabel Sekolah & Master Komponen
 */
export const recalculateSekolahTotals = async (jenjang, connection = pool) => {
  try {
    const [sekolahRows] = await connection.query('SELECT id FROM sekolah WHERE jenjang = ? LIMIT 1', [jenjang]);
    const sekolahId = sekolahRows[0]?.id;
    if (!sekolahId) return;

    const [sumRows] = await connection.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN kategori_komponen = 'Adm Sekolah' THEN biaya ELSE 0 END), 0) as total_adm_sekolah,
        COALESCE(SUM(CASE WHEN kategori_komponen = 'Adm Pesantren' THEN biaya ELSE 0 END), 0) as total_adm_pesantren,
        COALESCE(SUM(CASE WHEN kategori_komponen = 'SPP' THEN biaya ELSE 0 END), 0) as total_spp
      FROM sekolah_rincian_biaya
      WHERE jenjang = ?
    `, [jenjang]);

    const total_adm_sekolah = parseFloat(sumRows[0]?.total_adm_sekolah || 0);
    const total_adm_pesantren = parseFloat(sumRows[0]?.total_adm_pesantren || 0);
    const total_spp = parseFloat(sumRows[0]?.total_spp || 0);
    const total_masuk = total_adm_sekolah + total_adm_pesantren + total_spp;

    await connection.query(`
      UPDATE sekolah 
      SET nominal_adm_sekolah = ?, nominal_adm_pesantren = ?, nominal_spp = IF(? > 0, ?, nominal_spp), total_masuk = ?
      WHERE id = ?
    `, [total_adm_sekolah, total_adm_pesantren, total_spp, total_spp, total_masuk, sekolahId]);

    // Update master komponen biaya di keuangan jika ada
    try {
      await connection.query(`
        UPDATE keuangan_komponen_biaya 
        SET nominal_default = ? 
        WHERE nama_komponen LIKE ?
      `, [total_adm_sekolah + total_adm_pesantren, `%Awal Masuk%${jenjang}%`]);

      if (total_spp > 0) {
        await connection.query(`
          UPDATE keuangan_komponen_biaya 
          SET nominal_default = ? 
          WHERE nama_komponen LIKE ?
        `, [total_spp, `%SPP%${jenjang}%`]);
      }
    } catch (e) {}
  } catch (err) {
    console.warn('[RECALCULATE TOTALS NOTICE]', err.message);
  }
};

/**
 * POST /api/sekolah/rincian-biaya
 * Tambah Item Rincian Biaya Baru ke Database
 */
export const tambahRincianBiayaSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const { jenjang, kategori_komponen, uraian, biaya } = req.body;
    if (!jenjang || !kategori_komponen || !uraian) {
      return sendError(res, 'Jenjang, kategori, dan uraian wajib diisi', 400);
    }

    const [sekRows] = await pool.query('SELECT id FROM sekolah WHERE jenjang = ? LIMIT 1', [jenjang]);
    const sekolah_id = sekRows[0]?.id || 1;

    const [maxUrutan] = await pool.query(
      'SELECT COALESCE(MAX(urutan), 0) + 1 as next_urutan FROM sekolah_rincian_biaya WHERE jenjang = ? AND kategori_komponen = ?',
      [jenjang, kategori_komponen]
    );

    const [result] = await pool.query(`
      INSERT INTO sekolah_rincian_biaya (sekolah_id, jenjang, kategori_komponen, uraian, biaya, urutan)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [sekolah_id, jenjang, kategori_komponen, uraian.trim(), parseFloat(biaya) || 0, maxUrutan[0]?.next_urutan || 1]);

    await recalculateSekolahTotals(jenjang);

    return sendSuccess(res, 'Item rincian biaya berhasil ditambahkan ke database', { id: result.insertId });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * PUT /api/sekolah/rincian-biaya/:id
 * Edit Item Rincian Biaya di Database
 */
export const updateRincianBiayaSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const { id } = req.params;
    const { uraian, biaya, kategori_komponen } = req.body;

    const [existing] = await pool.query('SELECT jenjang FROM sekolah_rincian_biaya WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Item rincian tidak ditemukan', 404);
    }
    const jenjang = existing[0].jenjang;

    await pool.query(`
      UPDATE sekolah_rincian_biaya 
      SET uraian = COALESCE(?, uraian),
          biaya = COALESCE(?, biaya),
          kategori_komponen = COALESCE(?, kategori_komponen)
      WHERE id = ?
    `, [uraian !== undefined ? uraian.trim() : null, biaya !== undefined ? parseFloat(biaya) : null, kategori_komponen || null, id]);

    await recalculateSekolahTotals(jenjang);

    return sendSuccess(res, 'Item rincian biaya berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * DELETE /api/sekolah/rincian-biaya/:id
 * Hapus Item Rincian Biaya dari Database
 */
export const hapusRincianBiayaSekolah = async (req, res) => {
  try {
    await ensureSekolahTablesAndMapping();
    const { id } = req.params;
    const [existing] = await pool.query('SELECT jenjang, uraian FROM sekolah_rincian_biaya WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Item rincian tidak ditemukan', 404);
    }
    const jenjang = existing[0].jenjang;

    await pool.query('DELETE FROM sekolah_rincian_biaya WHERE id = ?', [id]);
    await recalculateSekolahTotals(jenjang);

    return sendSuccess(res, `Item "${existing[0].uraian}" berhasil dihapus dari database`);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/sekolah/generate-tagihan-masuk
 * Generate tagihan awal masuk resmi sesuai rincian database (SMP/SMA/SMK) ke tabel keuangan_tagihan
 */
export const generateTagihanAwalMasukSekolah = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await ensureSekolahTablesAndMapping();
    const {
      jenjang = 'SMP', // 'SMP' | 'SMA' | 'SMK' | 'SEMUA'
      tahun_ajaran = '2026/2027',
      mode = 'rincian', // 'rincian' (per item rincian satuan) | 'paket' (Adm Sekolah & Adm Pesantren) | 'total' (1 tagihan total)
      kategori = 'semua', // 'semua' | 'sekolah' | 'pesantren'
      santri_id
    } = req.body;

    await connection.beginTransaction();

    let sqlSantri = `
      SELECT s.id, s.nama_santri, s.nis, s.nama_sekolah, s.tingkat_sekolah, sk.jenjang
      FROM santri s
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      WHERE 1=1
    `;
    const params = [];
    if (santri_id) {
      sqlSantri += ' AND s.id = ?';
      params.push(santri_id);
    } else if (jenjang && jenjang !== 'SEMUA') {
      sqlSantri += ' AND (sk.jenjang = ? OR s.nama_sekolah LIKE ?)';
      params.push(jenjang.toUpperCase(), `%${jenjang}%`);
    }

    const [targetSantri] = await connection.query(sqlSantri, params);
    if (!targetSantri || targetSantri.length === 0) {
      await connection.rollback();
      return sendError(res, 'Tidak ada santri yang sesuai dengan filter sekolah tersebut', 404);
    }

    // Ambil data rincian live dari database untuk kalkulasi tepat
    const [liveItems] = await connection.query('SELECT * FROM sekolah_rincian_biaya ORDER BY jenjang ASC, kategori_komponen ASC, urutan ASC');

    const getTotalsForJenjang = (jKey) => {
      const itemsForJ = liveItems.filter(i => i.jenjang === jKey);
      if (itemsForJ.length > 0) {
        let admSek = 0, admPes = 0, spp = 0;
        itemsForJ.forEach(i => {
          const val = parseFloat(i.biaya) || 0;
          if (i.kategori_komponen === 'Adm Sekolah') admSek += val;
          else if (i.kategori_komponen === 'Adm Pesantren') admPes += val;
          else if (i.kategori_komponen === 'SPP') spp += val;
        });
        return {
          total_adm_sekolah: admSek,
          total_adm_pesantren: admPes,
          nominal_spp: spp,
          total_masuk_juli: admSek + admPes + spp
        };
      }
      return RINCIAN_AWAL_MASUK_MASTER[jKey] || RINCIAN_AWAL_MASUK_MASTER.SMP;
    };

    let totalGenerated = 0;
    let totalSkipped = 0;

    // Ambil master komponen biaya untuk mengisi kolom komponen_id di keuangan_tagihan
    let [allKomp] = await connection.query('SELECT id, nama_komponen, kategori FROM keuangan_komponen_biaya');
    if (!allKomp || allKomp.length === 0) {
      const [insRes] = await connection.query(`
        INSERT INTO keuangan_komponen_biaya (nama_komponen, kategori, nominal_default, is_active)
        VALUES ('Biaya Awal Masuk', 'Biaya Masuk', 1000000, 1)
      `);
      allKomp = [{ id: insRes.insertId, nama_komponen: 'Biaya Awal Masuk', kategori: 'Biaya Masuk' }];
    }

    const getKomponenIdForItem = (itemJudul, jKey) => {
      const jLower = (jKey || '').toLowerCase();
      let match = null;
      if (itemJudul.toLowerCase().includes('pesantren')) {
        match = (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('pesantren'));
      } else if (itemJudul.toLowerCase().includes('adm sekolah')) {
        match = (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('adm sekolah') && k.nama_komponen.toLowerCase().includes(jLower)) ||
                (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('adm sekolah'));
      } else if (itemJudul.toLowerCase().includes('awal masuk')) {
        match = (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('awal masuk') && k.nama_komponen.toLowerCase().includes(jLower)) ||
                (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('awal masuk'));
      }
      if (match) return match.id;
      const fallbackKomp = (allKomp || []).find(k => k.kategori !== 'Bulanan') || allKomp[0];
      return fallbackKomp?.id || 1;
    };

    for (const santri of targetSantri) {
      const jKey = (santri.jenjang || (santri.nama_sekolah?.includes('SMA') ? 'SMA' : santri.nama_sekolah?.includes('SMK') ? 'SMK' : 'SMP')).toUpperCase();
      const master = getTotalsForJenjang(jKey);

      // Jika mode rincian, bersihkan tagihan paket gelondongan lama yang belum dibayar agar tidak menduplikasi tagihan
      if (mode === 'rincian') {
        if (kategori === 'pesantren') {
          await connection.query(`
            DELETE FROM keuangan_tagihan 
            WHERE santri_id = ? AND status = 'Belum Dibayar' AND sudah_dibayar = 0 
              AND (judul_tagihan LIKE 'Adm Pesantren%' OR judul_tagihan LIKE 'Biaya Awal Masuk%')
          `, [santri.id]);
        } else if (kategori === 'sekolah') {
          await connection.query(`
            DELETE FROM keuangan_tagihan 
            WHERE santri_id = ? AND status = 'Belum Dibayar' AND sudah_dibayar = 0 
              AND (judul_tagihan LIKE 'Adm Sekolah%' OR judul_tagihan LIKE 'Biaya Awal Masuk%')
          `, [santri.id]);
        } else {
          await connection.query(`
            DELETE FROM keuangan_tagihan 
            WHERE santri_id = ? AND status = 'Belum Dibayar' AND sudah_dibayar = 0 
              AND (judul_tagihan LIKE 'Adm Pesantren%' OR judul_tagihan LIKE 'Adm Sekolah%' OR judul_tagihan LIKE 'Biaya Awal Masuk%')
          `, [santri.id]);
        }
      }

      const billItems = [];
      const totalMasukTanpaSpp = master.total_adm_sekolah + master.total_adm_pesantren;

      if (mode === 'rincian') {
        // Mode Rincian Item: Generate setiap rincian (Pendaftaran, Kaos, K. Mahrom, Infaq, dll) jadi 1 tagihan
        let itemsForJ = liveItems.filter(i => i.jenjang === jKey && (
          kategori === 'semua' ? (i.kategori_komponen === 'Adm Sekolah' || i.kategori_komponen === 'Adm Pesantren') :
          kategori === 'sekolah' ? i.kategori_komponen === 'Adm Sekolah' :
          kategori === 'pesantren' ? i.kategori_komponen === 'Adm Pesantren' : false
        ));

        if (!itemsForJ || itemsForJ.length === 0) {
          const staticMaster = RINCIAN_AWAL_MASUK_MASTER[jKey] || RINCIAN_AWAL_MASUK_MASTER.SMP;
          const fallbackList = [];
          if (kategori === 'semua' || kategori === 'sekolah') {
            (staticMaster.adm_sekolah || []).forEach(it => fallbackList.push({ ...it, kategori_komponen: 'Adm Sekolah' }));
          }
          if (kategori === 'semua' || kategori === 'pesantren') {
            (staticMaster.adm_pesantren || []).forEach(it => fallbackList.push({ ...it, kategori_komponen: 'Adm Pesantren' }));
          }
          itemsForJ = fallbackList;
        }

        for (const it of itemsForJ) {
          billItems.push({
            judul: `${it.uraian} (${it.kategori_komponen})`,
            kategori: 'Biaya Masuk',
            periode: `TA ${tahun_ajaran}`,
            total: parseFloat(it.biaya) || 0
          });
        }
      } else if (kategori === 'sekolah') {
        billItems.push({
          judul: `Adm Sekolah ${jKey} ${tahun_ajaran}`,
          kategori: 'Biaya Masuk',
          periode: `TA ${tahun_ajaran}`,
          total: master.total_adm_sekolah
        });
      } else if (kategori === 'pesantren') {
        billItems.push({
          judul: `Adm Pesantren ${tahun_ajaran}`,
          kategori: 'Biaya Masuk',
          periode: `TA ${tahun_ajaran}`,
          total: master.total_adm_pesantren
        });
      } else {
        if (mode === 'total') {
          billItems.push({
            judul: `Biaya Awal Masuk ${jKey} ${tahun_ajaran}`,
            kategori: 'Biaya Masuk',
            periode: `TA ${tahun_ajaran}`,
            total: totalMasukTanpaSpp
          });
        } else {
          billItems.push({
            judul: `Adm Sekolah ${jKey} ${tahun_ajaran}`,
            kategori: 'Biaya Masuk',
            periode: `TA ${tahun_ajaran}`,
            total: master.total_adm_sekolah
          });
          billItems.push({
            judul: `Adm Pesantren ${tahun_ajaran}`,
            kategori: 'Biaya Masuk',
            periode: `TA ${tahun_ajaran}`,
            total: master.total_adm_pesantren
          });
        }
      }

      for (const item of billItems) {
        // Cek anti duplikat persis per judul tagihan
        const [existing] = await connection.query(`
          SELECT id FROM keuangan_tagihan 
          WHERE santri_id = ? AND judul_tagihan = ?
          LIMIT 1
        `, [santri.id, item.judul]);

        if (existing && existing.length > 0) {
          totalSkipped++;
          continue;
        }

        const targetKomponenId = getKomponenIdForItem(item.judul, jKey);
        const kodeTagihan = `TGH-${santri.id}-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
        await connection.query(`
          INSERT INTO keuangan_tagihan 
          (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'Belum Dibayar', '2026-07-10')
        `, [kodeTagihan, santri.id, targetKomponenId, item.judul, item.kategori, item.periode, item.total, item.total]);

        totalGenerated++;
      }
    }

    await connection.commit();
    return sendSuccess(res, `Berhasil generate ${totalGenerated} tagihan awal masuk (${totalSkipped} dilewati karena sudah ada)`, {
      total_generated: totalGenerated,
      total_skipped: totalSkipped,
      total_santri: targetSantri.length
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal generate tagihan: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

