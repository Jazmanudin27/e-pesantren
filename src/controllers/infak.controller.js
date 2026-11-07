import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { createMidtransSnapToken } from '../services/midtrans.service.js';
import { createWaliNotification } from './notifikasi.controller.js';

let isInfakTablesReady = false;

/**
 * Inisialisasi Tabel Program Infak & Transaksi Infak/Sedekah
 * Terpisah 100% dari tabel keuangan_tagihan (administrasi/SPP) agar pencatatan tidak tercampur.
 */
export const ensureInfakTables = async () => {
  if (isInfakTablesReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pesantren_program_infak (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode_program VARCHAR(50) NOT NULL,
        nama_program VARCHAR(150) NOT NULL,
        kategori VARCHAR(100) DEFAULT 'Infak Pesantren',
        deskripsi TEXT DEFAULT NULL,
        target_dana DECIMAL(15, 2) DEFAULT 0.00,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pesantren_infak_transaksi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode_transaksi VARCHAR(60) NOT NULL UNIQUE,
        santri_id INT DEFAULT NULL,
        nama_santri VARCHAR(150) DEFAULT NULL,
        nama_donatur VARCHAR(150) NOT NULL,
        is_anonim TINYINT(1) DEFAULT 0,
        program_id INT DEFAULT NULL,
        nama_program VARCHAR(150) NOT NULL,
        nominal DECIMAL(15, 2) NOT NULL,
        metode_pembayaran VARCHAR(80) DEFAULT 'QRIS',
        nomor_va VARCHAR(60) DEFAULT NULL,
        doa_pesan TEXT DEFAULT NULL,
        status VARCHAR(40) DEFAULT 'Berhasil',
        snap_token VARCHAR(255) DEFAULT NULL,
        payment_url VARCHAR(500) DEFAULT NULL,
        tanggal_transaksi DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_infak_santri (santri_id),
        INDEX idx_infak_program (program_id),
        INDEX idx_infak_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed program infak resmi jika masih kosong
    const [cnt] = await pool.query(`SELECT COUNT(*) AS total FROM pesantren_program_infak`);
    if (cnt && cnt[0].total === 0) {
      const seeds = [
        [
          'INF-MASJID',
          'Pembangunan & Perluasan Masjid Pesantren',
          'Wakaf & Pembangunan',
          'Program jariyah pembangunan serta perawatan sarana ibadah Masjid Jami dan asrama santri.',
          150000000
        ],
        [
          'INF-YATIM',
          'Beasiswa Santri Yatim & Dhuafa',
          'Beasiswa Pendidikan',
          'Membantu biaya makan, kitab, dan pendidikan bagi santri yatim piatu dan kurang mampu.',
          75000000
        ],
        [
          'WKF-QURAN',
          'Wakaf Mushaf Al-Qur\'an & Kitab Kuning',
          'Wakaf Ilmu',
          'Pengadaan mushaf Al-Qur\'an dan kitab turots untuk kegiatan mengaji dan muhafadzoh santri.',
          35000000
        ],
        [
          'SDK-JUMAT',
          'Sedekah Jumat Berkah & Buka Puasa Sunnah',
          'Sedekah Konsumsi',
          'Hidangan makan bersama santri pada hari Jumat dan buka puasa sunnah Senin-Kamis.',
          25000000
        ],
        [
          'INF-UMUM',
          'Infak & Sedekah Operasional Dakwah Pesantren',
          'Infak Umum',
          'Dukungan umum kegiatan dakwah, kebersihan, kesehatan santri, dan fasilitas pondok pesantren.',
          50000000
        ]
      ];

      for (const s of seeds) {
        await pool.query(
          `INSERT INTO pesantren_program_infak (kode_program, nama_program, kategori, deskripsi, target_dana, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          s
        ).catch(() => {});
      }
    }

    isInfakTablesReady = true;
  } catch (err) {
    console.warn('[INFAK DB INIT NOTICE]', err.message);
  }
};

/**
 * GET /api/infak/program
 * Daftar Program Infak beserta total dana terkumpul
 */
export const getProgramInfak = async (req, res) => {
  try {
    await ensureInfakTables();
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN t.status = 'Berhasil' THEN t.nominal ELSE 0 END), 0) AS terkumpul,
        COUNT(CASE WHEN t.status = 'Berhasil' THEN t.id ELSE NULL END) AS jumlah_donatur
      FROM pesantren_program_infak p
      LEFT JOIN pesantren_infak_transaksi t ON p.id = t.program_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    return sendSuccess(res, 'Daftar program infak berhasil diambil', { programs: rows || [] });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/infak/program (Admin menambah program infak baru)
 */
export const createProgramInfak = async (req, res) => {
  try {
    await ensureInfakTables();
    const { nama_program, kategori, deskripsi, target_dana } = req.body;
    if (!nama_program || !nama_program.trim()) {
      return sendError(res, 'Nama program infak wajib diisi', 400);
    }

    const kode = `INF-${Date.now().toString().slice(-4)}`;
    const [result] = await pool.query(
      `INSERT INTO pesantren_program_infak (kode_program, nama_program, kategori, deskripsi, target_dana, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [kode, nama_program.trim(), kategori || 'Infak Pesantren', deskripsi || '', parseFloat(target_dana) || 0]
    );

    return sendSuccess(res, 'Program infak berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * DELETE /api/infak/program/:id
 */
export const deleteProgramInfak = async (req, res) => {
  try {
    await ensureInfakTables();
    const { id } = req.params;
    await pool.query(`UPDATE pesantren_program_infak SET is_active = 0 WHERE id = ?`, [id]);
    return sendSuccess(res, 'Program infak berhasil dinonaktifkan');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/infak/santri/:santri_id
 * Data program infak + riwayat infak keluarga santri untuk Portal Orang Tua
 */
export const getInfakWaliData = async (req, res) => {
  try {
    await ensureInfakTables();
    const { santri_id } = req.params;

    const [programs] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN t.status = 'Berhasil' THEN t.nominal ELSE 0 END), 0) AS terkumpul,
        COUNT(CASE WHEN t.status = 'Berhasil' THEN t.id ELSE NULL END) AS jumlah_donatur
      FROM pesantren_program_infak p
      LEFT JOIN pesantren_infak_transaksi t ON p.id = t.program_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const [riwayat] = await pool.query(
      `SELECT * FROM pesantren_infak_transaksi 
       WHERE santri_id = ? 
       ORDER BY id DESC LIMIT 40`,
      [santri_id]
    );

    const totalInfakKeluarga = (riwayat || [])
      .filter(r => r.status === 'Berhasil')
      .reduce((acc, r) => acc + parseFloat(r.nominal || 0), 0);

    return sendSuccess(res, 'Data infak & sedekah wali berhasil diambil', {
      programs: programs || [],
      riwayat: riwayat || [],
      total_infak_keluarga: totalInfakKeluarga
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/infak/create-payment
 * Membuat transaksi Infak/Sedekah via QRIS atau Virtual Account (Midtrans Snap + Virtual Account Generator)
 */
export const createInfakPayment = async (req, res) => {
  try {
    await ensureInfakTables();
    const {
      santri_id,
      nama_santri,
      nama_donatur,
      is_anonim,
      program_id,
      nama_program,
      nominal,
      metode_pembayaran = 'QRIS',
      doa_pesan = ''
    } = req.body;

    const nom = parseFloat(nominal);
    if (isNaN(nom) || nom < 5000) {
      return sendError(res, 'Nominal infak/sedekah minimal Rp 5.000', 400);
    }

    const kodeTransaksi = `INFAK-${santri_id || 'WALI'}-${Date.now()}`;
    const cleanDonatur = is_anonim ? 'Hamba Allah' : (nama_donatur || `Wali dari ${nama_santri || 'Santri'}`);
    const cleanProgram = nama_program || 'Infak & Sedekah Pesantren';
    const nomorVa = `9881056${String(santri_id || 100).padStart(3, '0')}${String(Date.now()).slice(-6)}`;

    let snapToken = null;
    let paymentUrl = null;

    try {
      const snapRes = await createMidtransSnapToken({
        nomorTransaksi: kodeTransaksi,
        totalBayar: nom,
        santriNama: cleanDonatur,
        noWaWali: '081234567890',
        items: [
          {
            tagihan_id: program_id || 88888,
            judul_tagihan: `Infak: ${cleanProgram}`.substring(0, 45),
            nominal_alokasi: nom
          }
        ]
      });
      snapToken = snapRes?.token || null;
      paymentUrl = snapRes?.redirect_url || null;
    } catch (snapErr) {
      console.warn('[INFAK MIDTRANS FALLBACK]', snapErr.message);
    }

    const [result] = await pool.query(
      `INSERT INTO pesantren_infak_transaksi
       (kode_transaksi, santri_id, nama_santri, nama_donatur, is_anonim, program_id, nama_program, nominal, metode_pembayaran, nomor_va, doa_pesan, status, snap_token, payment_url, tanggal_transaksi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, NOW())`,
      [
        kodeTransaksi,
        santri_id || null,
        nama_santri || null,
        cleanDonatur,
        is_anonim ? 1 : 0,
        program_id || null,
        cleanProgram,
        nom,
        metode_pembayaran,
        nomorVa,
        doa_pesan || null,
        snapToken,
        paymentUrl
      ]
    );

    return sendSuccess(res, 'Sesi pembayaran infak & sedekah berhasil dibuat', {
      id: result.insertId,
      kode_transaksi: kodeTransaksi,
      nominal: nom,
      nama_program: cleanProgram,
      metode_pembayaran,
      nomor_va: nomorVa,
      snap_token: snapToken,
      payment_url: paymentUrl
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/infak/confirm-payment
 * Konfirmasi pembayaran infak berhasil & kirim notifikasi terima kasih ke Orang Tua
 */
export const confirmInfakPayment = async (req, res) => {
  try {
    await ensureInfakTables();
    const { id, kode_transaksi } = req.body;

    let [rows] = await pool.query(
      `SELECT * FROM pesantren_infak_transaksi WHERE id = ? OR kode_transaksi = ? LIMIT 1`,
      [id || 0, kode_transaksi || '']
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 'Data transaksi infak tidak ditemukan', 404);
    }

    const trx = rows[0];
    await pool.query(
      `UPDATE pesantren_infak_transaksi SET status = 'Berhasil', tanggal_transaksi = NOW() WHERE id = ?`,
      [trx.id]
    );

    const fmtNom = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(parseFloat(trx.nominal || 0));

    if (trx.santri_id) {
      createWaliNotification({
        santri_id: trx.santri_id,
        kategori: 'infak',
        judul: `Jazakumullahu Khairan • Infak ${fmtNom}`,
        pesan: `Alhamdulillah, penerimaan infak/sedekah sebesar ${fmtNom} untuk program "${trx.nama_program}" melalui ${trx.metode_pembayaran} telah berhasil dicatat. Semoga menjadi amal jariyah yang penuh keberkahan.`,
        target_tab: 'infak'
      });
    }

    return sendSuccess(res, 'Alhamdulillah, pembayaran infak & sedekah berhasil tercatat!', {
      id: trx.id,
      kode_transaksi: trx.kode_transaksi,
      status: 'Berhasil'
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * GET /api/infak/laporan
 * Laporan Penerimaan Infak & Sedekah untuk Admin (Terpisah dari Tagihan Administrasi)
 */
export const getLaporanInfakAdmin = async (req, res) => {
  try {
    await ensureInfakTables();
    const { program_id, status, search, tgl_dari, tgl_sampai } = req.query;

    let sql = `SELECT * FROM pesantren_infak_transaksi WHERE 1=1`;
    const params = [];

    if (program_id && program_id !== 'Semua') {
      sql += ` AND program_id = ?`;
      params.push(program_id);
    }
    if (status && status !== 'Semua') {
      sql += ` AND status = ?`;
      params.push(status);
    } else {
      // Secara default tampilkan yang Berhasil dan Pending
    }
    if (tgl_dari) {
      sql += ` AND DATE(tanggal_transaksi) >= ?`;
      params.push(tgl_dari);
    }
    if (tgl_sampai) {
      sql += ` AND DATE(tanggal_transaksi) <= ?`;
      params.push(tgl_sampai);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (nama_donatur LIKE ? OR nama_santri LIKE ? OR nama_program LIKE ? OR kode_transaksi LIKE ?)`;
      params.push(q, q, q, q);
    }

    sql += ` ORDER BY id DESC LIMIT 200`;
    const [transaksi] = await pool.query(sql, params);

    const [programs] = await pool.query(`
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN t.status = 'Berhasil' THEN t.nominal ELSE 0 END), 0) AS terkumpul,
        COUNT(CASE WHEN t.status = 'Berhasil' THEN t.id ELSE NULL END) AS jumlah_donatur
      FROM pesantren_program_infak p
      LEFT JOIN pesantren_infak_transaksi t ON p.id = t.program_id
      WHERE p.is_active = 1
      GROUP BY p.id
      ORDER BY p.id ASC
    `);

    const [summaryRows] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'Berhasil' THEN nominal ELSE 0 END), 0) AS total_terkumpul,
        COUNT(CASE WHEN status = 'Berhasil' THEN id ELSE NULL END) AS total_transaksi_berhasil,
        COUNT(CASE WHEN status = 'Pending' THEN id ELSE NULL END) AS total_transaksi_pending
      FROM pesantren_infak_transaksi
    `);

    return sendSuccess(res, 'Laporan penerimaan infak & sedekah berhasil diambil', {
      summary: summaryRows?.[0] || { total_terkumpul: 0, total_transaksi_berhasil: 0, total_transaksi_pending: 0 },
      programs: programs || [],
      transaksi: transaksi || []
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * DELETE /api/infak/transaksi/:id
 */
export const deleteTransaksiInfak = async (req, res) => {
  try {
    await ensureInfakTables();
    const { id } = req.params;
    await pool.query(`DELETE FROM pesantren_infak_transaksi WHERE id = ?`, [id]);
    return sendSuccess(res, 'Data transaksi infak berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

