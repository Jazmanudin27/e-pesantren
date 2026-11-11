import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createMidtransSnapToken } from '../services/midtrans.service.js';
import { createWaliNotification } from './notifikasi.controller.js';

let isTabunganTablesInitialized = false;

/**
 * Inisialisasi Tabel Tabungan Santri dan Riwayat Transaksi secara Otomatis
 */
export const ensureTabunganTables = async () => {
  if (isTabunganTablesInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`santri_tabungan\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT NOT NULL UNIQUE,
        \`saldo\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_tabungan_santri\` (\`santri_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`santri_tabungan_transaksi\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tabungan_id\` INT DEFAULT NULL,
        \`santri_id\` INT NOT NULL,
        \`kode_transaksi\` VARCHAR(50) NOT NULL UNIQUE,
        \`jenis_transaksi\` ENUM('masuk', 'keluar') NOT NULL,
        \`nominal\` DECIMAL(15, 2) NOT NULL,
        \`saldo_sebelum\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        \`saldo_sesudah\` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        \`keterangan\` VARCHAR(255) NOT NULL,
        \`tanggal_transaksi\` DATE NOT NULL,
        \`admin_id\` INT DEFAULT NULL,
        \`admin_nama\` VARCHAR(100) DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_trx_santri\` (\`santri_id\`),
        INDEX \`idx_trx_tgl\` (\`tanggal_transaksi\`),
        INDEX \`idx_trx_jenis\` (\`jenis_transaksi\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isTabunganTablesInitialized = true;
    console.log('[TABUNGAN DB] Tabel santri_tabungan & riwayat transaksi siap.');
  } catch (err) {
    console.warn('[TABUNGAN DB INIT NOTICE]', err.message);
  }
};

/**
 * Helper: Ambil atau Buat Akun Tabungan Santri
 */
const getOrCreateTabunganRow = async (santriId, connection = pool) => {
  await ensureTabunganTables();
  const [rows] = await connection.query(
    'SELECT * FROM santri_tabungan WHERE santri_id = ?',
    [santriId]
  );
  if (rows && rows.length > 0) {
    return rows[0];
  }

  // Buat baru jika belum ada
  await connection.query(
    'INSERT IGNORE INTO santri_tabungan (santri_id, saldo) VALUES (?, 0.00)',
    [santriId]
  );
  const [newRows] = await connection.query(
    'SELECT * FROM santri_tabungan WHERE santri_id = ?',
    [santriId]
  );
  return newRows[0];
};

/**
 * 1. GET /api/tabungan - Daftar Semua Tabungan Santri & Ringkasan Global
 */
export const getTabunganList = async (req, res) => {
  try {
    await ensureTabunganTables();
    const { search = '', kelas_id, asrama_id, limit = 500, page = 1 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 500);
    const offset = (pageNum - 1) * limitNum;

    // Conditions
    const where = ["(s.status IS NULL OR s.status NOT IN ('Alumni', 'Boyong'))"];
    const params = [];

    if (search && String(search).trim() !== '') {
      const q = `%${String(search).trim()}%`;
      where.push('(s.nama_santri LIKE ? OR s.nis LIKE ? OR s.nama_wali LIKE ?)');
      params.push(q, q, q);
    }

    if (kelas_id) {
      where.push('s.kelas_id = ?');
      params.push(kelas_id);
    }

    if (asrama_id) {
      where.push('s.asrama_id = ?');
      params.push(asrama_id);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Total Count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM santri s ${whereClause}`,
      params
    );
    const totalRecords = countRows[0]?.total || 0;

    // Santri List dengan Saldo & Total Transaksi
    const [santriRows] = await pool.query(
      `
      SELECT 
        s.*,
        s.no_wa_wali as no_hp_wali,
        COALESCE(s.nama_kelas, kl.nama_kelas) as nama_kelas,
        sk.nama_sekolah,
        a.nama_asrama,
        k.nama_kamar,
        COALESCE(t.saldo, 0.00) as saldo,
        t.updated_at as terakhir_update,
        COALESCE(trx.total_masuk, 0.00) as total_masuk,
        COALESCE(trx.total_keluar, 0.00) as total_keluar,
        COALESCE(trx.jumlah_transaksi, 0) as jumlah_transaksi
      FROM santri s
      LEFT JOIN santri_tabungan t ON s.id = t.santri_id
      LEFT JOIN kelas kl ON s.kelas_id = kl.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN (
        SELECT 
          santri_id,
          SUM(CASE WHEN jenis_transaksi = 'masuk' THEN nominal ELSE 0 END) as total_masuk,
          SUM(CASE WHEN jenis_transaksi = 'keluar' THEN nominal ELSE 0 END) as total_keluar,
          COUNT(*) as jumlah_transaksi
        FROM santri_tabungan_transaksi
        GROUP BY santri_id
      ) trx ON s.id = trx.santri_id
      ${whereClause}
      ORDER BY COALESCE(t.saldo, 0) DESC, s.nama_santri ASC
      LIMIT ? OFFSET ?
      `,
      [...params, limitNum, offset]
    );

    // Global Statistics
    const [globalStats] = await pool.query(`
      SELECT 
        COALESCE(SUM(saldo), 0.00) as total_saldo,
        COUNT(DISTINCT santri_id) as total_akun_aktif
      FROM santri_tabungan
    `);

    const [globalTrx] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN jenis_transaksi = 'masuk' THEN nominal ELSE 0 END), 0.00) as total_masuk,
        COALESCE(SUM(CASE WHEN jenis_transaksi = 'keluar' THEN nominal ELSE 0 END), 0.00) as total_keluar,
        COUNT(*) as total_transaksi
      FROM santri_tabungan_transaksi
    `);

    const [recentTrxRows] = await pool.query(`
      SELECT 
        tr.id,
        tr.santri_id,
        tr.kode_transaksi,
        tr.jenis_transaksi,
        tr.nominal,
        tr.saldo_sebelum,
        tr.saldo_sesudah,
        tr.keterangan,
        tr.tanggal_transaksi,
        tr.admin_nama,
        tr.created_at,
        s.nama_santri,
        s.nis,
        COALESCE(s.nama_kelas, kl.nama_kelas) as nama_kelas,
        sk.nama_sekolah
      FROM santri_tabungan_transaksi tr
      LEFT JOIN santri s ON tr.santri_id = s.id
      LEFT JOIN kelas kl ON s.kelas_id = kl.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      ORDER BY tr.tanggal_transaksi DESC, tr.id DESC
      LIMIT 100
    `);

    return sendSuccess(res, 'Berhasil memuat daftar tabungan santri', {
      summary: {
        total_saldo: parseFloat(globalStats[0]?.total_saldo || 0),
        total_masuk: parseFloat(globalTrx[0]?.total_masuk || 0),
        total_keluar: parseFloat(globalTrx[0]?.total_keluar || 0),
        total_transaksi: globalTrx[0]?.total_transaksi || 0,
        total_santri_terdaftar: totalRecords
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum)
      },
      riwayat_terbaru: (recentTrxRows || []).map(t => ({
        ...t,
        nominal: parseFloat(t.nominal || 0),
        saldo_sebelum: parseFloat(t.saldo_sebelum || 0),
        saldo_sesudah: parseFloat(t.saldo_sesudah || 0)
      })),
      data: santriRows.map(r => ({
        ...r,
        saldo: parseFloat(r.saldo || 0),
        total_masuk: parseFloat(r.total_masuk || 0),
        total_keluar: parseFloat(r.total_keluar || 0),
      }))
    });
  } catch (err) {
    console.error('[GET TABUNGAN LIST ERROR]', err);
    return sendError(res, 'Gagal memuat daftar tabungan santri: ' + err.message);
  }
};

/**
 * 2. GET /api/tabungan/santri/:id - Rincian Saldo & Seluruh Riwayat Transaksi 1 Santri
 */
export const getSantriTabunganDetail = async (req, res) => {
  try {
    await ensureTabunganTables();
    const { id } = req.params;

    // Ambil data santri
    const [santriRows] = await pool.query(
      `
      SELECT 
        s.*,
        s.no_wa_wali as no_hp_wali,
        a.nama_asrama,
        k.nama_kamar,
        COALESCE(t.saldo, 0.00) as saldo,
        t.updated_at as terakhir_update
      FROM santri s
      LEFT JOIN santri_tabungan t ON s.id = t.santri_id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE s.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!santriRows || santriRows.length === 0) {
      return sendError(res, 'Santri tidak ditemukan', 404);
    }

    const santri = santriRows[0];
    const currentSaldo = parseFloat(santri.saldo || 0);

    // Ambil Seluruh Riwayat Transaksi Santri (Terbaru ke Terlama)
    const [trxRows] = await pool.query(
      `
      SELECT 
        id,
        kode_transaksi,
        jenis_transaksi,
        nominal,
        saldo_sebelum,
        saldo_sesudah,
        keterangan,
        tanggal_transaksi,
        admin_nama,
        created_at
      FROM santri_tabungan_transaksi
      WHERE santri_id = ?
      ORDER BY tanggal_transaksi DESC, id DESC
      `,
      [id]
    );

    // Hitung total masuk dan keluar
    let totalMasuk = 0;
    let totalKeluar = 0;
    const history = (trxRows || []).map(t => {
      const nom = parseFloat(t.nominal || 0);
      if (t.jenis_transaksi === 'masuk') totalMasuk += nom;
      else if (t.jenis_transaksi === 'keluar') totalKeluar += nom;

      return {
        id: t.id,
        kode_transaksi: t.kode_transaksi,
        jenis_transaksi: t.jenis_transaksi, // 'masuk' | 'keluar'
        nominal: nom,
        saldo_sebelum: parseFloat(t.saldo_sebelum || 0),
        saldo_sesudah: parseFloat(t.saldo_sesudah || 0),
        keterangan: t.keterangan,
        tanggal_transaksi: t.tanggal_transaksi,
        admin_nama: t.admin_nama || 'Admin',
        created_at: t.created_at
      };
    });

    return sendSuccess(res, 'Berhasil memuat rincian tabungan santri', {
      santri: {
        id: santri.id,
        nama_santri: santri.nama_santri,
        nis: santri.nis,
        jk: santri.jk,
        nama_kelas: santri.nama_kelas,
        nama_asrama: santri.nama_asrama,
        nama_kamar: santri.nama_kamar,
        nama_wali: santri.nama_wali,
        no_hp_wali: santri.no_hp_wali
      },
      saldo_saat_ini: currentSaldo,
      total_masuk: totalMasuk,
      total_keluar: totalKeluar,
      jumlah_transaksi: history.length,
      terakhir_update: santri.terakhir_update,
      riwayat_transaksi: history
    });
  } catch (err) {
    console.error('[GET SANTRI TABUNGAN DETAIL ERROR]', err);
    return sendError(res, 'Gagal memuat rincian tabungan: ' + err.message);
  }
};

/**
 * 3. POST /api/tabungan/setor - Penambahan Saldo Tabungan (Uang Masuk / Saldo Awal)
 */
export const tambahSaldoSantri = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await ensureTabunganTables();
    const {
      santri_id,
      nominal,
      keterangan = 'Penambahan Saldo',
      tanggal_transaksi,
      admin_nama = 'Admin'
    } = req.body;

    if (!santri_id) {
      return sendError(res, 'santri_id wajib diisi', 400);
    }

    const nom = parseFloat(nominal);
    if (isNaN(nom) || nom <= 0) {
      return sendError(res, 'Nominal setor harus lebih besar dari 0', 400);
    }

    const tgl = tanggal_transaksi || new Date().toISOString().slice(0, 10);
    const cleanKet = String(keterangan || 'Penambahan Saldo').trim();

    await connection.beginTransaction();

    // Pastikan akun tabungan ada & lock row for update
    await connection.query(
      'INSERT IGNORE INTO santri_tabungan (santri_id, saldo) VALUES (?, 0.00)',
      [santri_id]
    );

    const [tabRows] = await connection.query(
      'SELECT id, saldo FROM santri_tabungan WHERE santri_id = ? FOR UPDATE',
      [santri_id]
    );

    const tabungan = tabRows[0];
    const saldoSebelum = parseFloat(tabungan?.saldo || 0);
    const saldoSesudah = saldoSebelum + nom;

    // Generate kode transaksi unik
    const prefix = 'TB-IN';
    const timestamp = Date.now().toString().slice(-6);
    const kodeTransaksi = `${prefix}-${santri_id}-${timestamp}`;

    // Insert log transaksi
    const [trxResult] = await connection.query(
      `
      INSERT INTO santri_tabungan_transaksi 
      (tabungan_id, santri_id, kode_transaksi, jenis_transaksi, nominal, saldo_sebelum, saldo_sesudah, keterangan, tanggal_transaksi, admin_nama)
      VALUES (?, ?, ?, 'masuk', ?, ?, ?, ?, ?, ?)
      `,
      [tabungan.id, santri_id, kodeTransaksi, nom, saldoSebelum, saldoSesudah, cleanKet, tgl, admin_nama]
    );

    // Update Saldo Tabungan
    await connection.query(
      'UPDATE santri_tabungan SET saldo = ? WHERE id = ?',
      [saldoSesudah, tabungan.id]
    );

    await connection.commit();

    const fmtNom = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nom);
    const fmtSaldo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(saldoSesudah);
    createWaliNotification({
      santri_id,
      kategori: 'tabungan',
      judul: `Tabungan Masuk: +${fmtNom}`,
      pesan: `Saldo tabungan ananda bertambah ${fmtNom} (${cleanKet}). Total saldo saat ini: ${fmtSaldo}.`,
      target_tab: 'tabungan'
    });

    return sendSuccess(res, 'Saldo tabungan berhasil ditambahkan', {
      transaksi_id: trxResult.insertId,
      kode_transaksi: kodeTransaksi,
      santri_id,
      jenis_transaksi: 'masuk',
      nominal: nom,
      saldo_sebelum: saldoSebelum,
      saldo_akhir: saldoSesudah,
      keterangan: cleanKet,
      tanggal_transaksi: tgl
    });
  } catch (err) {
    await connection.rollback();
    console.error('[TAMBAH SALDO TABUNGAN ERROR]', err);
    return sendError(res, 'Gagal menambah saldo tabungan: ' + err.message);
  } finally {
    connection.release();
  }
};

/**
 * 4. POST /api/tabungan/tarik - Pengambilan Tabungan (Uang Keluar)
 */
export const tarikSaldoSantri = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await ensureTabunganTables();
    const {
      santri_id,
      nominal,
      keterangan = 'Pengambilan Tabungan',
      tanggal_transaksi,
      admin_nama = 'Admin'
    } = req.body;

    if (!santri_id) {
      return sendError(res, 'santri_id wajib diisi', 400);
    }

    const nom = parseFloat(nominal);
    if (isNaN(nom) || nom <= 0) {
      return sendError(res, 'Nominal penarikan harus lebih besar dari 0', 400);
    }

    const tgl = tanggal_transaksi || new Date().toISOString().slice(0, 10);
    const cleanKet = String(keterangan || 'Pengambilan Tabungan').trim();

    await connection.beginTransaction();

    // Lock row
    const [tabRows] = await connection.query(
      'SELECT id, saldo FROM santri_tabungan WHERE santri_id = ? FOR UPDATE',
      [santri_id]
    );

    if (!tabRows || tabRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Akun tabungan santri belum memiliki saldo', 400);
    }

    const tabungan = tabRows[0];
    const saldoSebelum = parseFloat(tabungan.saldo || 0);

    // Validasi saldo cukup
    if (saldoSebelum < nom) {
      await connection.rollback();
      const formatRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(saldoSebelum);
      return sendError(res, `Saldo tidak mencukupi untuk penarikan. Saldo saat ini hanya ${formatRupiah}`, 400);
    }

    const saldoSesudah = saldoSebelum - nom;

    // Generate kode transaksi unik
    const prefix = 'TB-OUT';
    const timestamp = Date.now().toString().slice(-6);
    const kodeTransaksi = `${prefix}-${santri_id}-${timestamp}`;

    // Insert log transaksi
    const [trxResult] = await connection.query(
      `
      INSERT INTO santri_tabungan_transaksi 
      (tabungan_id, santri_id, kode_transaksi, jenis_transaksi, nominal, saldo_sebelum, saldo_sesudah, keterangan, tanggal_transaksi, admin_nama)
      VALUES (?, ?, ?, 'keluar', ?, ?, ?, ?, ?, ?)
      `,
      [tabungan.id, santri_id, kodeTransaksi, nom, saldoSebelum, saldoSesudah, cleanKet, tgl, admin_nama]
    );

    // Update Saldo Tabungan
    await connection.query(
      'UPDATE santri_tabungan SET saldo = ? WHERE id = ?',
      [saldoSesudah, tabungan.id]
    );

    await connection.commit();

    const fmtNom = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nom);
    const fmtSaldo = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(saldoSesudah);
    createWaliNotification({
      santri_id,
      kategori: 'tabungan',
      judul: `Pengambilan Tabungan: -${fmtNom}`,
      pesan: `Tercatat penarikan tabungan sebesar ${fmtNom} (${cleanKet}). Sisa saldo saat ini: ${fmtSaldo}.`,
      target_tab: 'tabungan'
    });

    return sendSuccess(res, 'Pengambilan tabungan berhasil dicatat', {
      transaksi_id: trxResult.insertId,
      kode_transaksi: kodeTransaksi,
      santri_id,
      jenis_transaksi: 'keluar',
      nominal: nom,
      saldo_sebelum: saldoSebelum,
      saldo_akhir: saldoSesudah,
      keterangan: cleanKet,
      tanggal_transaksi: tgl
    });
  } catch (err) {
    await connection.rollback();
    console.error('[TARIK SALDO TABUNGAN ERROR]', err);
    return sendError(res, 'Gagal mencatat pengambilan tabungan: ' + err.message);
  } finally {
    connection.release();
  }
};

/**
 * 5. DELETE /api/tabungan/transaksi/:id - Pembatalan Transaksi Tabungan (Rollback Saldo Otomatis)
 */
export const batalTransaksiTabungan = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [trxRows] = await connection.query(
      'SELECT * FROM santri_tabungan_transaksi WHERE id = ? FOR UPDATE',
      [id]
    );

    if (!trxRows || trxRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Transaksi tidak ditemukan', 404);
    }

    const trx = trxRows[0];
    const nom = parseFloat(trx.nominal || 0);

    // Ambil tabungan santri
    const [tabRows] = await connection.query(
      'SELECT id, saldo FROM santri_tabungan WHERE santri_id = ? FOR UPDATE',
      [trx.santri_id]
    );

    if (!tabRows || tabRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Akun tabungan tidak ditemukan', 404);
    }

    const currentSaldo = parseFloat(tabRows[0].saldo || 0);
    let newSaldo = currentSaldo;

    if (trx.jenis_transaksi === 'masuk') {
      // Jika membatalkan uang masuk, kurangi saldo
      if (currentSaldo < nom) {
        await connection.rollback();
        return sendError(res, 'Gagal membatalkan: Saldo santri saat ini lebih kecil dari nominal yang ingin dibatalkan', 400);
      }
      newSaldo = currentSaldo - nom;
    } else if (trx.jenis_transaksi === 'keluar') {
      // Jika membatalkan penarikan uang keluar, kembalikan saldo
      newSaldo = currentSaldo + nom;
    }

    // Hapus record transaksi
    await connection.query('DELETE FROM santri_tabungan_transaksi WHERE id = ?', [id]);

    // Update saldo
    await connection.query('UPDATE santri_tabungan SET saldo = ? WHERE id = ?', [newSaldo, tabRows[0].id]);

    await connection.commit();

    return sendSuccess(res, 'Transaksi berhasil dibatalkan dan saldo telah disesuaikan', {
      transaksi_id: id,
      saldo_sekarang: newSaldo
    });
  } catch (err) {
    await connection.rollback();
    console.error('[BATAL TRANSAKSI TABUNGAN ERROR]', err);
    return sendError(res, 'Gagal membatalkan transaksi: ' + err.message);
  } finally {
    connection.release();
  }
};

/**
 * 6. POST /api/tabungan/topup-midtrans - Generate Midtrans Snap Token untuk Top Up Saldo Tabungan
 */
export const topupMidtransTabungan = async (req, res) => {
  try {
    await ensureTabunganTables();
    const { santri_id, nominal, keterangan = '' } = req.body;
    const nom = parseFloat(nominal);

    if (!santri_id) {
      return sendError(res, 'santri_id wajib diisi', 400);
    }
    if (isNaN(nom) || nom < 5000) {
      return sendError(res, 'Nominal pengisian minimal Rp 5.000', 400);
    }

    const [santriRows] = await pool.query(
      'SELECT id, nama_santri, nama_wali, no_wa_wali FROM santri WHERE id = ?',
      [santri_id]
    );
    if (!santriRows || santriRows.length === 0) {
      return sendError(res, 'Santri tidak ditemukan', 404);
    }

    const santri = santriRows[0];
    const timestamp = Date.now();
    const nomorTransaksi = `TOPUP-${santri_id}-${timestamp}`;

    // Buat snap token resmi Midtrans
    const snapResult = await createMidtransSnapToken({
      nomorTransaksi,
      totalBayar: nom,
      santriNama: santri.nama_santri || 'Santri',
      noWaWali: santri.no_wa_wali || '081234567890',
      items: [{
        tagihan_id: 99999,
        judul_tagihan: `Isi Saldo Tabungan ${santri.nama_santri || ''}`.substring(0, 45),
        nominal_alokasi: nom
      }]
    });

    return sendSuccess(res, 'Snap token pembayaran Midtrans berhasil dibuat', {
      nomor_transaksi: nomorTransaksi,
      snap_token: snapResult.token,
      payment_url: snapResult.redirect_url,
      nominal: nom,
      santri_id
    });
  } catch (err) {
    console.error('[TOPUP MIDTRANS TABUNGAN ERROR]', err);
    return sendError(res, 'Gagal membuat sesi pembayaran Midtrans: ' + err.message, 500);
  }
};


