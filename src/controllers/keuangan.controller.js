import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { canAccessKeuangan } from '../utils/authRole.util.js';
import { createBniVirtualAccount } from '../services/bni.service.js';
import { createIpaymuTransaction } from '../services/ipaymu.service.js';
import { chargeMidtransDirect, createMidtransSnapToken, checkMidtransTransactionStatus } from '../services/midtrans.service.js';
import { createWaliNotification } from './notifikasi.controller.js';
import { ensureSekolahTablesAndMapping, RINCIAN_AWAL_MASUK_MASTER } from './sekolah.controller.js';

let isSiklusSppTableInitialized = false;

/**
 * Pastikan tabel keuangan_siklus_spp tersedia
 */
export const ensureSiklusSppTable = async () => {
  if (isSiklusSppTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_siklus_spp\` (
        \`id\` INT PRIMARY KEY DEFAULT 1,
        \`tgl_terbit_spp\` INT NOT NULL DEFAULT 5,
        \`tgl_jatuh_tempo_spp\` INT NOT NULL DEFAULT 10,
        \`keterangan\` VARCHAR(255) DEFAULT 'Tagihan terbit per tgl 5, batas akhir tgl 10. Lewat tgl 10 otomatis berstatus tunggakan.',
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [rows] = await pool.query('SELECT id FROM keuangan_siklus_spp WHERE id = 1');
    if (!rows || rows.length === 0) {
      await pool.query(`
        INSERT INTO keuangan_siklus_spp (id, tgl_terbit_spp, tgl_jatuh_tempo_spp)
        VALUES (1, 5, 10)
      `);
    }
    isSiklusSppTableInitialized = true;
    await ensureSekolahTablesAndMapping();
    ensureKeuanganIndexes();
  } catch (err) {
    console.warn('[SIKLUS SPP DB INIT NOTICE]', err.message);
  }
};

const normalizeMetodePembayaran = (rawMetode = '', rawChannel = '') => {
  const combined = `${rawChannel || ''} ${rawMetode || ''}`.toLowerCase();
  if (combined.includes('qris')) return 'QRIS';
  if (combined.includes('tunai') || combined.includes('cash') || combined.includes('kasir')) return 'Tunai';
  if (combined.includes('transfer') || /\btf\b/.test(combined)) return 'Transfer';
  if (combined.includes('virtual') || /\bva\b/.test(combined)) return 'Virtual Account';
  return 'Tunai';
};

export const resolveStatusDanaForSuccess = (metode = '', channel = '', snapToken = null) => {
  const mNorm = normalizeMetodePembayaran(metode, channel);
  const chLower = String(channel || '').toLowerCase();
  if (
    snapToken ||
    mNorm === 'QRIS' ||
    mNorm === 'Virtual Account' ||
    chLower.includes('midtrans') ||
    chLower.includes('qris') ||
    chLower.includes('snap')
  ) {
    return 'Mengendap di Midtrans';
  }
  if (mNorm === 'Transfer' || chLower.includes('transfer')) {
    return 'Di Rekening Bank';
  }
  return 'Di Kas Tunai';
};

let isIndexesEnsured = false;
export const ensureKeuanganIndexes = async () => {
  if (isIndexesEnsured) return;
  try {
    // 1. Pastikan kolom metode_pembayaran, status_pembayaran & kolom kantong saldo tersedia
    const alters = [
      "ALTER TABLE keuangan_transaksi_pembayaran MODIFY COLUMN metode_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Tunai'",
      "ALTER TABLE keuangan_transaksi_pembayaran MODIFY COLUMN status_pembayaran VARCHAR(50) NOT NULL DEFAULT 'Pending'",
      "ALTER TABLE keuangan_transaksi_pembayaran ADD COLUMN nominal_pokok DECIMAL(15,2) NULL DEFAULT NULL",
      "ALTER TABLE keuangan_transaksi_pembayaran ADD COLUMN nominal_fee_gateway DECIMAL(15,2) NOT NULL DEFAULT 0.00",
      "ALTER TABLE keuangan_transaksi_pembayaran ADD COLUMN status_dana VARCHAR(50) NULL DEFAULT NULL",
      "ALTER TABLE keuangan_transaksi_pembayaran ADD COLUMN tanggal_cair_bank DATETIME NULL DEFAULT NULL",
      "ALTER TABLE keuangan_transaksi_pembayaran ADD COLUMN buku_kas_pencairan_id INT NULL DEFAULT NULL"
    ];
    for (const sql of alters) {
      try {
        await pool.query(sql);
      } catch (_) {}
    }

    // 2. Pastikan tabel keuangan_buku_kas (Pengeluaran, Pemasukan Lain, Setor Tunai, Tarik Tunai, Pencairan Midtrans) tersedia
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`keuangan_buku_kas\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`kode_mutasi\` VARCHAR(60) NOT NULL,
        \`tanggal\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`jenis_transaksi\` VARCHAR(50) NOT NULL COMMENT 'Pengeluaran | Pemasukan Lain | Setor Tunai ke Bank | Tarik Tunai dari Bank | Pencairan Midtrans ke Bank',
        \`kategori\` VARCHAR(100) DEFAULT 'Operasional',
        \`kantong_sumber\` VARCHAR(50) DEFAULT NULL COMMENT 'Kas Tunai | Rekening Bank | Midtrans',
        \`kantong_tujuan\` VARCHAR(50) DEFAULT NULL COMMENT 'Kas Tunai | Rekening Bank',
        \`nominal\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        \`biaya_admin\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        \`keterangan\` VARCHAR(500) NOT NULL,
        \`penanggung_jawab\` VARCHAR(120) DEFAULT 'Bendahara',
        \`jumlah_trx_dicairkan\` INT DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_buku_kas_tanggal\` (\`tanggal\`),
        INDEX \`idx_buku_kas_jenis\` (\`jenis_transaksi\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Backfill otomatis nominal_pokok & status_dana pada transaksi lama yang belum memiliki nilai
    try {
      await pool.query(`
        UPDATE keuangan_transaksi_pembayaran p
        LEFT JOIN (
          SELECT transaksi_id, SUM(nominal_alokasi) as sum_alokasi
          FROM keuangan_transaksi_detail
          GROUP BY transaksi_id
        ) d ON p.id = d.transaksi_id
        SET p.nominal_pokok = COALESCE(NULLIF(d.sum_alokasi, 0), p.total_bayar),
            p.nominal_fee_gateway = GREATEST(0, p.total_bayar - COALESCE(NULLIF(d.sum_alokasi, 0), p.total_bayar))
        WHERE p.nominal_pokok IS NULL
      `);
    } catch (_) {}

    try {
      await pool.query(`
        UPDATE keuangan_transaksi_pembayaran
        SET status_dana = CASE
          WHEN status_pembayaran != 'Berhasil' THEN 'Menunggu Pembayaran'
          WHEN snap_token IS NOT NULL
               OR metode_pembayaran IN ('QRIS', 'Virtual Account')
               OR LOWER(COALESCE(channel_pembayaran, '')) LIKE '%midtrans%'
               OR LOWER(COALESCE(channel_pembayaran, '')) LIKE '%qris%'
            THEN 'Mengendap di Midtrans'
          WHEN metode_pembayaran = 'Transfer'
               OR LOWER(COALESCE(channel_pembayaran, '')) LIKE '%transfer%'
            THEN 'Di Rekening Bank'
          ELSE 'Di Kas Tunai'
        END
        WHERE status_dana IS NULL OR status_dana = ''
      `);
    } catch (_) {}

    const indexes = [
      'CREATE INDEX idx_tagihan_santri_status ON keuangan_tagihan(santri_id, status)',
      'CREATE INDEX idx_tagihan_status ON keuangan_tagihan(status)',
      'CREATE INDEX idx_transaksi_status_tgl ON keuangan_transaksi_pembayaran(status_pembayaran, tanggal_bayar)',
      'CREATE INDEX idx_transaksi_santri ON keuangan_transaksi_pembayaran(santri_id)',
      'CREATE INDEX idx_transaksi_status_dana ON keuangan_transaksi_pembayaran(status_pembayaran, status_dana)',
      'CREATE INDEX idx_trx_detail_transaksi ON keuangan_transaksi_detail(transaksi_id)',
      'CREATE INDEX idx_trx_detail_tagihan ON keuangan_transaksi_detail(tagihan_id)'
    ];
    for (const sql of indexes) {
      try {
        await pool.query(sql);
      } catch (_) {
        // ignore jika index sudah ada
      }
    }
    isIndexesEnsured = true;
  } catch (err) {
    // ignore
  }
};

/**
 * Menghitung posisi 3 Kantong Saldo (Kas Tunai, Rekening Bank, Mengendap Midtrans)
 * serta akumulasi Buku Kas (Pemasukan Lain, Pengeluaran, Setor Tunai, Tarik Tunai, Pencairan Midtrans)
 */
export const getRingkasanKantongKas = async () => {
  await ensureKeuanganIndexes();
  try {
    const [
      [trxRows],
      [bukuRows]
    ] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(CASE
            WHEN COALESCE(status_dana, '') = 'Di Kas Tunai'
              OR (COALESCE(status_dana, '') = '' AND metode_pembayaran = 'Tunai')
            THEN COALESCE(NULLIF(nominal_pokok, 0), total_bayar)
            ELSE 0
          END), 0) as masuk_tagihan_tunai,

          COALESCE(SUM(CASE
            WHEN COALESCE(status_dana, '') = 'Mengendap di Midtrans'
            THEN COALESCE(NULLIF(nominal_pokok, 0), total_bayar)
            ELSE 0
          END), 0) as saldo_mengendap_midtrans,

          COUNT(CASE WHEN COALESCE(status_dana, '') = 'Mengendap di Midtrans' THEN 1 END) as jumlah_trx_mengendap_midtrans,

          COALESCE(SUM(CASE
            WHEN COALESCE(status_dana, '') = 'Di Rekening Bank'
              AND (snap_token IS NOT NULL OR metode_pembayaran IN ('QRIS', 'Virtual Account') OR LOWER(COALESCE(channel_pembayaran, '')) LIKE '%midtrans%')
            THEN COALESCE(NULLIF(nominal_pokok, 0), total_bayar)
            ELSE 0
          END), 0) as total_midtrans_sudah_cair,

          COALESCE(SUM(CASE
            WHEN COALESCE(status_dana, '') = 'Di Rekening Bank'
              AND NOT (snap_token IS NOT NULL OR metode_pembayaran IN ('QRIS', 'Virtual Account') OR LOWER(COALESCE(channel_pembayaran, '')) LIKE '%midtrans%')
            THEN COALESCE(NULLIF(nominal_pokok, 0), total_bayar)
            ELSE 0
          END), 0) as masuk_tagihan_transfer,

          COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as total_tagihan_pokok_sah,
          COALESCE(SUM(total_bayar), 0) as total_gross_pembayaran,
          COALESCE(SUM(COALESCE(nominal_fee_gateway, 0)), 0) as total_fee_midtrans
        FROM keuangan_transaksi_pembayaran
        WHERE status_pembayaran = 'Berhasil'
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pemasukan Lain' AND kantong_tujuan = 'Kas Tunai' THEN nominal ELSE 0 END), 0) as pemasukan_lain_tunai,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pemasukan Lain' AND kantong_tujuan = 'Rekening Bank' THEN nominal ELSE 0 END), 0) as pemasukan_lain_bank,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pengeluaran' AND kantong_sumber = 'Kas Tunai' THEN (nominal + COALESCE(biaya_admin, 0)) ELSE 0 END), 0) as pengeluaran_tunai,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pengeluaran' AND kantong_sumber = 'Rekening Bank' THEN (nominal + COALESCE(biaya_admin, 0)) ELSE 0 END), 0) as pengeluaran_bank,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Setor Tunai ke Bank' THEN nominal ELSE 0 END), 0) as setor_tunai_ke_bank,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Setor Tunai ke Bank' THEN COALESCE(biaya_admin, 0) ELSE 0 END), 0) as biaya_admin_setor,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Tarik Tunai dari Bank' THEN nominal ELSE 0 END), 0) as tarik_tunai_dari_bank,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Tarik Tunai dari Bank' THEN COALESCE(biaya_admin, 0) ELSE 0 END), 0) as biaya_admin_tarik,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pencairan Midtrans ke Bank' THEN nominal ELSE 0 END), 0) as mutasi_pencairan_midtrans,
          COALESCE(SUM(CASE WHEN jenis_transaksi = 'Pencairan Midtrans ke Bank' THEN COALESCE(biaya_admin, 0) ELSE 0 END), 0) as biaya_admin_pencairan_midtrans,
          COUNT(*) as total_catatan_buku_kas
        FROM keuangan_buku_kas
      `)
    ]);

    const t = trxRows?.[0] || {};
    const b = bukuRows?.[0] || {};

    const masukTagihanTunai = Number(t.masuk_tagihan_tunai || 0);
    const masukTagihanTransfer = Number(t.masuk_tagihan_transfer || 0);
    const saldoMengendapMidtrans = Number(t.saldo_mengendap_midtrans || 0);
    const jumlahTrxMengendapMidtrans = Number(t.jumlah_trx_mengendap_midtrans || 0);
    const totalMidtransSudahCair = Number(t.total_midtrans_sudah_cair || 0);
    const totalTagihanPokokSah = Number(t.total_tagihan_pokok_sah || 0);
    const totalGrossPembayaran = Number(t.total_gross_pembayaran || 0);
    const totalFeeMidtrans = Number(t.total_fee_midtrans || 0);

    const pemasukanLainTunai = Number(b.pemasukan_lain_tunai || 0);
    const pemasukanLainBank = Number(b.pemasukan_lain_bank || 0);
    const totalPemasukanLain = pemasukanLainTunai + pemasukanLainBank;

    const pengeluaranTunai = Number(b.pengeluaran_tunai || 0);
    const pengeluaranBank = Number(b.pengeluaran_bank || 0);
    const biayaAdminSetor = Number(b.biaya_admin_setor || 0);
    const biayaAdminTarik = Number(b.biaya_admin_tarik || 0);
    const biayaAdminPencairanMidtrans = Number(b.biaya_admin_pencairan_midtrans || 0);
    const totalPengeluaran =
      pengeluaranTunai +
      pengeluaranBank +
      biayaAdminSetor +
      biayaAdminTarik +
      biayaAdminPencairanMidtrans;

    const setorTunaiKeBank = Number(b.setor_tunai_ke_bank || 0);
    const tarikTunaiDariBank = Number(b.tarik_tunai_dari_bank || 0);

    // Posisi Riil 3 Kantong
    const saldoKasTunai =
      masukTagihanTunai +
      pemasukanLainTunai -
      setorTunaiKeBank +
      tarikTunaiDariBank -
      pengeluaranTunai -
      biayaAdminSetor;

    const saldoRekeningBank =
      masukTagihanTransfer +
      totalMidtransSudahCair +
      pemasukanLainBank +
      setorTunaiKeBank -
      tarikTunaiDariBank -
      pengeluaranBank -
      biayaAdminTarik -
      biayaAdminPencairanMidtrans;

    const saldoSiapPakai = saldoKasTunai + saldoRekeningBank;
    const totalPenerimaanSemua = totalTagihanPokokSah + totalPemasukanLain;

    return {
      saldo_kas_tunai: saldoKasTunai,
      saldo_rekening_bank: saldoRekeningBank,
      saldo_mengendap_midtrans: saldoMengendapMidtrans,
      jumlah_trx_mengendap_midtrans: jumlahTrxMengendapMidtrans,
      saldo_siap_pakai: saldoSiapPakai,
      masuk_tagihan_tunai: masukTagihanTunai,
      masuk_tagihan_transfer: masukTagihanTransfer,
      total_midtrans_sudah_cair: totalMidtransSudahCair,
      total_tagihan_pokok_sah: totalTagihanPokokSah,
      total_gross_pembayaran: totalGrossPembayaran,
      total_fee_midtrans: totalFeeMidtrans,
      pemasukan_lain_tunai: pemasukanLainTunai,
      pemasukan_lain_bank: pemasukanLainBank,
      total_pemasukan_lain: totalPemasukanLain,
      pengeluaran_tunai: pengeluaranTunai,
      pengeluaran_bank: pengeluaranBank,
      total_pengeluaran: totalPengeluaran,
      setor_tunai_ke_bank: setorTunaiKeBank,
      tarik_tunai_dari_bank: tarikTunaiDariBank,
      biaya_admin_pencairan_midtrans: biayaAdminPencairanMidtrans,
      total_penerimaan_semua: totalPenerimaanSemua,
      total_catatan_buku_kas: Number(b.total_catatan_buku_kas || 0)
    };
  } catch (err) {
    console.warn('[RINGKASAN KANTONG KAS NOTICE]', err.message);
    return {
      saldo_kas_tunai: 0,
      saldo_rekening_bank: 0,
      saldo_mengendap_midtrans: 0,
      jumlah_trx_mengendap_midtrans: 0,
      saldo_siap_pakai: 0,
      masuk_tagihan_tunai: 0,
      masuk_tagihan_transfer: 0,
      total_midtrans_sudah_cair: 0,
      total_tagihan_pokok_sah: 0,
      total_gross_pembayaran: 0,
      total_fee_midtrans: 0,
      pemasukan_lain_tunai: 0,
      pemasukan_lain_bank: 0,
      total_pemasukan_lain: 0,
      pengeluaran_tunai: 0,
      pengeluaran_bank: 0,
      total_pengeluaran: 0,
      setor_tunai_ke_bank: 0,
      tarik_tunai_dari_bank: 0,
      biaya_admin_pencairan_midtrans: 0,
      total_penerimaan_semua: 0,
      total_catatan_buku_kas: 0
    };
  }
};

/**
 * Mengambil pengaturan tanggal siklus & jatuh tempo SPP
 */
export const getSiklusSppData = async () => {
  await ensureSiklusSppTable();
  try {
    const [rows] = await pool.query('SELECT * FROM keuangan_siklus_spp WHERE id = 1 LIMIT 1');
    return rows[0] || { tgl_terbit_spp: 5, tgl_jatuh_tempo_spp: 10 };
  } catch (e) {
    return { tgl_terbit_spp: 5, tgl_jatuh_tempo_spp: 10 };
  }
};

/**
 * GET /api/keuangan/siklus-spp
 */
export const getSiklusSpp = async (req, res) => {
  try {
    const data = await getSiklusSppData();
    return sendSuccess(res, 'Pengaturan siklus SPP berhasil diambil', data);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * POST /api/keuangan/siklus-spp
 * Menyimpan tanggal terbit dan batas akhir pembayaran (jatuh tempo) SPP
 * dan otomatis mengupdate tagihan yang belum lunas
 */
export const updateSiklusSpp = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await ensureSiklusSppTable();
    const { tgl_terbit_spp, tgl_jatuh_tempo_spp, apply_to_existing = true } = req.body;
    
    const terbit = Math.max(1, Math.min(28, parseInt(tgl_terbit_spp) || 5));
    const tempo = Math.max(1, Math.min(28, parseInt(tgl_jatuh_tempo_spp) || 10));

    await connection.beginTransaction();

    await connection.query(`
      UPDATE keuangan_siklus_spp SET
        tgl_terbit_spp = ?,
        tgl_jatuh_tempo_spp = ?,
        keterangan = CONCAT('Tagihan terbit per tgl ', ?, ', batas akhir tgl ', ?, '. Lewat tgl ', ?, ' berstatus tunggakan.'),
        updated_at = NOW()
      WHERE id = 1
    `, [terbit, tempo, terbit, tempo, tempo]);

    let affectedCount = 0;
    if (apply_to_existing) {
      const padTempo = String(tempo).padStart(2, '0');
      const [upRes] = await connection.query(`
        UPDATE keuangan_tagihan
        SET jatuh_tempo = CONCAT(DATE_FORMAT(jatuh_tempo, '%Y-%m-'), ?)
        WHERE kategori = 'Bulanan' 
          AND status != 'Lunas' 
          AND jatuh_tempo IS NOT NULL
      `, [padTempo]);
      affectedCount = upRes.affectedRows || 0;
    }

    await connection.commit();
    return sendSuccess(res, `Pengaturan siklus SPP berhasil disimpan: Terbit tgl ${terbit}, Jatuh Tempo tgl ${tempo}. (${affectedCount} tagihan berjalan otomatis disesuaikan).`, {
      tgl_terbit_spp: terbit,
      tgl_jatuh_tempo_spp: tempo,
      tagihan_updated: affectedCount
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal menyimpan siklus SPP: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Helper Internal: Generate Auto Tagihan (SPP Bulanan Okt 2026 - Jun 2027 + Tagihan Bebas Non-Bulanan) untuk 1 Santri
 */
/**
 * Helper Internal: Generate Auto Tagihan Berdasarkan Sekolah (SMP: 505rb, SMA: 565rb, SMK: 565rb)
 */
const ensureAutoTagihanForSantri = async (santriId, connectionOrPool = pool) => {
  // Ambil data sekolah & jenjang santri
  let jenjang = 'SMP';
  let namaSekolah = 'SMP Nurul Wafa';
  try {
    const [sRows] = await connectionOrPool.query(`
      SELECT s.id, s.nama_santri, s.nama_kelas, s.sekolah_id, s.nama_sekolah, s.tingkat_sekolah, sk.jenjang
      FROM santri s
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      WHERE s.id = ?
    `, [santriId]);
    if (sRows && sRows.length > 0) {
      const s = sRows[0];
      if (s.jenjang) {
        jenjang = s.jenjang;
        namaSekolah = s.nama_sekolah || `${jenjang} Nurul Wafa`;
      } else if (String(s.nama_sekolah || '').toUpperCase().includes('SMA')) {
        jenjang = 'SMA';
        namaSekolah = 'SMA Nurul Wafa';
      } else if (String(s.nama_sekolah || '').toUpperCase().includes('SMK')) {
        jenjang = 'SMK';
        namaSekolah = 'SMK Nurul Wafa';
      } else if (String(s.nama_sekolah || '').toUpperCase().includes('SMP')) {
        jenjang = 'SMP';
        namaSekolah = 'SMP Nurul Wafa';
      } else {
        const kStr = String(s.nama_kelas || '');
        if (kStr.includes('1 Wustho') || kStr.includes('2 Wustho') || kStr.includes('3 Wustho') || kStr.includes('Kelas 1') || kStr.includes('Kelas 2') || kStr.includes('Kelas 3')) {
          jenjang = 'SMP';
          namaSekolah = 'SMP Nurul Wafa';
        } else {
          jenjang = 'SMA';
          namaSekolah = 'SMA Nurul Wafa';
        }
      }
    }
  } catch (e) {}

  // Tarif Resmi Sesuai Jenjang Sekolah
  // SMP: SPP Rp 505.000 | Biaya Awal Rp 1.890.000
  // SMA: SPP Rp 565.000 | Biaya Awal Rp 2.040.000
  // SMK: SPP Rp 565.000 | Biaya Awal Rp 2.400.000
  const nominalSpp = jenjang === 'SMP' ? 505000 : 565000;
  const nominalAwal = jenjang === 'SMP' ? 1890000 : jenjang === 'SMA' ? 2040000 : 2400000;
  const judulSpp = `SPP Bulanan ${jenjang}`;
  const judulAwal = `Biaya Awal Masuk ${jenjang} (Adm Sekolah & Pesantren)`;

  // Cari komponen ID di keuangan_komponen_biaya
  let [kompRows] = await connectionOrPool.query('SELECT * FROM keuangan_komponen_biaya WHERE is_active = 1');
  let kompBulanan = (kompRows || []).find(k => k.kategori === 'Bulanan' && String(k.nama_komponen || '').includes(jenjang)) ||
                    (kompRows || []).find(k => k.kategori === 'Bulanan');
  let kompBebas = (kompRows || []).find(k => k.kategori !== 'Bulanan' && String(k.nama_komponen || '').includes(jenjang)) ||
                  (kompRows || []).find(k => k.kategori !== 'Bulanan');

  const bulananId = kompBulanan?.id || 1;
  const bebasId = kompBebas?.id || 2;

  const siklus = await getSiklusSppData();
  const padTempo = String(siklus.tgl_jatuh_tempo_spp || 10).padStart(2, '0');

  const periodeBulananList = [
    { bulan: 'Oktober 2026', jatuhTempo: `2026-10-${padTempo}`, prefix: '2610' },
    { bulan: 'November 2026', jatuhTempo: `2026-11-${padTempo}`, prefix: '2611' },
    { bulan: 'Desember 2026', jatuhTempo: `2026-12-${padTempo}`, prefix: '2612' },
    { bulan: 'Januari 2027', jatuhTempo: `2027-01-${padTempo}`, prefix: '2701' },
    { bulan: 'Februari 2027', jatuhTempo: `2027-02-${padTempo}`, prefix: '2702' },
    { bulan: 'Maret 2027', jatuhTempo: `2027-03-${padTempo}`, prefix: '2703' },
    { bulan: 'April 2027', jatuhTempo: `2027-04-${padTempo}`, prefix: '2704' },
    { bulan: 'Mei 2027', jatuhTempo: `2027-05-${padTempo}`, prefix: '2705' },
    { bulan: 'Juni 2027', jatuhTempo: `2027-06-${padTempo}`, prefix: '2706' }
  ];

  const [existingRows] = await connectionOrPool.query(
    'SELECT id, kategori, periode_bulan FROM keuangan_tagihan WHERE santri_id = ?',
    [santriId]
  );

  let insertedCount = 0;

  // 1. Generate 9 Bulan SPP Rutin (Oktober 2026 - Juni 2027) Sesuai Tarif Sekolah
  for (let i = 0; i < periodeBulananList.length; i++) {
    const p = periodeBulananList[i];
    const alreadyExists = (existingRows || []).some(
      r => r.kategori === 'Bulanan' && String(r.periode_bulan || '').toLowerCase() === p.bulan.toLowerCase()
    );
    if (!alreadyExists) {
      const invCode = `INV-${p.prefix}${String(santriId).padStart(2, '0')}${i + 1}`;
      await connectionOrPool.query(`
        INSERT INTO keuangan_tagihan
        (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
        VALUES (?, ?, ?, ?, 'Bulanan', ?, ?, 0.00, ?, 'Belum Dibayar', ?)
      `, [invCode, santriId, bulananId, judulSpp, p.bulan, nominalSpp, nominalSpp, p.jatuhTempo]);
      insertedCount++;
    }
  }

  // 2. Generate Tagihan Biaya Masuk Awal Sesuai Jenjang Sekolah
  const bebasExists = (existingRows || []).some(r => r.kategori !== 'Bulanan');
  if (!bebasExists) {
    const invBebas = `INV-2699${String(santriId).padStart(3, '0')}`;
    await connectionOrPool.query(`
      INSERT INTO keuangan_tagihan
      (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
      VALUES (?, ?, ?, ?, 'Biaya Masuk', 'TA 2026/2027 (Awal Masuk)', ?, 0.00, ?, 'Belum Dibayar', '2027-06-30')
    `, [invBebas, santriId, bebasId, judulAwal, nominalAwal, nominalAwal]);
    insertedCount++;
  }

  return insertedCount;
};

/**
 * Mengambil Ringkasan Dashboard Keuangan & Rincian Tagihan Santri (Khusus Wali Santri & Kasir Admin)
 */
export const getDashboardKeuanganWali = async (req, res) => {
  try {
    let santriId = req.params?.santriId || req.params?.santri_id || req.query?.santri_id || (req.user && (req.user.santri_id || req.user.id));

    if (!santriId) {
      const [first] = await pool.query('SELECT id FROM santri ORDER BY id ASC LIMIT 1');
      if (first && first.length > 0) {
        santriId = first[0].id;
      }
    }

    if (!santriId) {
      return sendError(res, 'Santri ID tidak ditemukan', 404);
    }

    // Ambil Data Santri Beserta Sekolah
    const [santriRows] = await pool.query(`
      SELECT s.id, s.kode_santri, s.nis, s.nama_santri, s.nama_wali, s.no_wa_wali, s.status_santri, 
             s.sekolah_id, COALESCE(sk.nama_sekolah, s.nama_sekolah) as nama_sekolah, s.tingkat_sekolah, sk.jenjang as sekolah_jenjang,
             a.nama_asrama, k.nama_kamar
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      WHERE s.id = ? LIMIT 1
    `, [santriId]);

    const santri = santriRows[0] || {};
    const jenjangSantri = santri.sekolah_jenjang || (santri.nama_sekolah?.includes('SMA') ? 'SMA' : santri.nama_sekolah?.includes('SMK') ? 'SMK' : 'SMP');

    // Otomatis pecah/unpack tagihan gelondongan lama yang belum dibayar menjadi rincian item satuan
    try {
      const [lumpRows] = await pool.query(`
        SELECT * FROM keuangan_tagihan 
        WHERE santri_id = ? 
          AND status = 'Belum Dibayar' 
          AND sudah_dibayar = 0
          AND (
            judul_tagihan LIKE 'Adm Pesantren%' OR 
            judul_tagihan LIKE 'Adm Sekolah%' OR 
            judul_tagihan LIKE 'Biaya Awal Masuk%'
          )
      `, [santriId]);

      if (lumpRows && lumpRows.length > 0) {
        let jKey = jenjangSantri.toUpperCase();
        if (jKey.includes('SMA')) jKey = 'SMA';
        else if (jKey.includes('SMK')) jKey = 'SMK';
        else jKey = 'SMP';

        const [liveDbItems] = await pool.query(
          'SELECT * FROM sekolah_rincian_biaya WHERE jenjang = ? ORDER BY kategori_komponen ASC, urutan ASC',
          [jKey]
        );

        const staticMaster = RINCIAN_AWAL_MASUK_MASTER[jKey] || RINCIAN_AWAL_MASUK_MASTER.SMP;
        let sekItems = (liveDbItems || []).filter(i => i.kategori_komponen === 'Adm Sekolah');
        let pesItems = (liveDbItems || []).filter(i => i.kategori_komponen === 'Adm Pesantren');

        if (sekItems.length === 0) {
          sekItems = (staticMaster.adm_sekolah || []).map(i => ({ ...i, kategori_komponen: 'Adm Sekolah' }));
        }
        if (pesItems.length === 0) {
          pesItems = (staticMaster.adm_pesantren || []).map(i => ({ ...i, kategori_komponen: 'Adm Pesantren' }));
        }

        const [allKomp] = await pool.query('SELECT id, nama_komponen, kategori FROM keuangan_komponen_biaya');
        const getKompId = (judul) => {
          let m = null;
          if (judul.toLowerCase().includes('pesantren')) {
            m = (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('pesantren'));
          } else {
            m = (allKomp || []).find(k => k.nama_komponen && k.nama_komponen.toLowerCase().includes('sekolah'));
          }
          return m?.id || allKomp?.[0]?.id || 1;
        };

        for (const lump of lumpRows) {
          const isPesantren = lump.judul_tagihan.toLowerCase().includes('pesantren');
          const isSekolah = lump.judul_tagihan.toLowerCase().includes('sekolah');
          const isBoth = lump.judul_tagihan.toLowerCase().includes('awal masuk');

          const itemsToCreate = [];
          if (isPesantren || isBoth) itemsToCreate.push(...pesItems);
          if (isSekolah || isBoth) itemsToCreate.push(...sekItems);

          if (itemsToCreate.length > 0) {
            await pool.query('DELETE FROM keuangan_tagihan WHERE id = ?', [lump.id]);

            for (const item of itemsToCreate) {
              const itemJudul = `${item.uraian} (${item.kategori_komponen})`;
              const kId = getKompId(itemJudul);
              const kodeTagihan = `TGH-${santriId}-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;

              const [exists] = await pool.query(
                'SELECT id FROM keuangan_tagihan WHERE santri_id = ? AND judul_tagihan = ? LIMIT 1',
                [santriId, itemJudul]
              );

              if (!exists || exists.length === 0) {
                await pool.query(`
                  INSERT INTO keuangan_tagihan
                  (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
                  VALUES (?, ?, ?, ?, 'Biaya Masuk', ?, ?, 0, ?, 'Belum Dibayar', '2026-07-10')
                `, [kodeTagihan, santriId, kId, itemJudul, lump.periode_bulan || 'TA 2026/2027', item.biaya, item.biaya]);
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[UNPACK GELONDONGAN NOTICE]', e.message);
    }

    // Pastikan master komponen minimal tersedia di database
    const [kompCheck] = await pool.query('SELECT COUNT(*) as total FROM keuangan_komponen_biaya');
    if (!kompCheck[0] || kompCheck[0].total === 0) {
      await pool.query(`
        INSERT INTO keuangan_komponen_biaya (kode_komponen, nama_komponen, kategori, nominal_default, deskripsi, is_active)
        VALUES
          ('SPP-BLN', 'SPP Bulanan', 'Bulanan', 350000, 'Tagihan SPP & Syahriah Rutin Bulanan', 1),
          ('DSP-MSK', 'Uang Pangkal & Daftar Ulang', 'Biaya Masuk', 1500000, 'Tagihan Tipe Bebas Non-Bulanan (Bisa Dicicil)', 1)
      `);
    }

    // 1. Ambil Seluruh Tagihan Santri
    const [tagihanRows] = await pool.query(`
      SELECT 
        t.*,
        k.nama_komponen,
        k.deskripsi as deskripsi_komponen
      FROM keuangan_tagihan t
      LEFT JOIN keuangan_komponen_biaya k ON t.komponen_id = k.id
      WHERE t.santri_id = ?
      ORDER BY t.jatuh_tempo ASC, t.id ASC
    `, [santriId]);

    // Rincian per Kategori
    const tagihanBulanan = tagihanRows.filter(t => t.kategori === 'Bulanan');
    const biayaAwalMasuk = tagihanRows.filter(t => t.kategori === 'Biaya Masuk');
    const tagihanLainnya = tagihanRows.filter(t => t.kategori !== 'Bulanan' && t.kategori !== 'Biaya Masuk');

    // Perhitungan Akumulasi Otomatis
    let totalTagihanBulanan = 0;
    let totalBulananLunas = 0;
    tagihanBulanan.forEach(t => {
      totalTagihanBulanan += parseFloat(t.sisa_tagihan || 0);
      totalBulananLunas += parseFloat(t.sudah_dibayar || 0);
    });

    let totalBiayaMasukKeseluruhan = 0;
    let totalBiayaMasukSudahDibayar = 0;
    let totalSisaBiayaMasuk = 0;
    biayaAwalMasuk.forEach(t => {
      totalBiayaMasukKeseluruhan += parseFloat(t.total_tagihan || 0);
      totalBiayaMasukSudahDibayar += parseFloat(t.sudah_dibayar || 0);
      totalSisaBiayaMasuk += parseFloat(t.sisa_tagihan || 0);
    });

    const totalTagihanBelumBayar = totalTagihanBulanan + totalSisaBiayaMasuk + 
      tagihanLainnya.reduce((acc, t) => acc + parseFloat(t.sisa_tagihan || 0), 0);

    // 2. Ambil Riwayat Pembayaran Digital & Kuitansi
    const [riwayatRows] = await pool.query(`
      SELECT 
        p.*,
        (SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
         FROM keuangan_transaksi_detail d
         JOIN keuangan_tagihan t ON d.tagihan_id = t.id
         WHERE d.transaksi_id = p.id
        ) as item_dibayar
      FROM keuangan_transaksi_pembayaran p
      WHERE p.santri_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [santriId]);

    // 3. Ambil Transaksi Aktif yang Masih Pending (Menunggu Pembayaran dalam 24 jam terakhir)
    const [pendingTrxRows] = await pool.query(`
      SELECT 
        p.*,
        (SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
         FROM keuangan_transaksi_detail d
         JOIN keuangan_tagihan t ON d.tagihan_id = t.id
         WHERE d.transaksi_id = p.id
        ) as item_dibayar
      FROM keuangan_transaksi_pembayaran p
      WHERE p.santri_id = ? 
        AND p.status_pembayaran = 'Pending'
        AND p.created_at >= NOW() - INTERVAL 1 DAY
      ORDER BY p.id DESC LIMIT 1
    `, [santriId]);

    const transaksiPending = pendingTrxRows && pendingTrxRows.length > 0 ? pendingTrxRows[0] : null;

    return sendSuccess(res, 'Dashboard keuangan wali berhasil dimuat', {
      santri,
      summary: {
        totalTagihanBelumBayar,
        totalTagihanBulanan,
        totalBulananLunas,
        totalSisaBiayaMasuk,
        totalBiayaMasukKeseluruhan,
        totalBiayaMasukSudahDibayar,
        formattedTotalBelumBayar: `Rp ${totalTagihanBelumBayar.toLocaleString('id-ID')}`,
        formattedBulanan: `Rp ${totalTagihanBulanan.toLocaleString('id-ID')}`,
        formattedSisaBiayaMasuk: `Rp ${totalSisaBiayaMasuk.toLocaleString('id-ID')}`
      },
      tagihanBulanan,
      biayaAwalMasuk,
      tagihanLainnya,
      transaksiPending,
      riwayatTransaksi: riwayatRows || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat keuangan wali: ${err.message}`, 500);
  }
};

/**
 * Membuat Transaksi Pembayaran Baru (Generate QRIS Dinamis atau Nomor Virtual Account)
 */
export const buatTransaksiPembayaran = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { santri_id, items, metode_pembayaran, channel_pembayaran } = req.body;

    if (!santri_id || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Pilih minimal satu tagihan untuk dibayar', 400);
    }

    await connection.beginTransaction();

    let totalBayar = 0;
    const itemsValid = [];

    // Validasi setiap tagihan yang ingin dibayar
    for (const item of items) {
      const [tghRows] = await connection.query(`
        SELECT id, kode_tagihan, judul_tagihan, sisa_tagihan, status 
        FROM keuangan_tagihan 
        WHERE id = ? AND santri_id = ? FOR UPDATE
      `, [item.tagihan_id, santri_id]);

      if (tghRows.length === 0) {
        await connection.rollback();
        return sendError(res, `Tagihan ID ${item.tagihan_id} tidak valid`, 404);
      }

      const tagihan = tghRows[0];
      const sisa = parseFloat(tagihan.sisa_tagihan);

      if (sisa <= 0 || tagihan.status === 'Lunas') {
        await connection.rollback();
        return sendError(res, `Tagihan "${tagihan.judul_tagihan}" sudah lunas`, 400);
      }

      let nominal = parseFloat(item.nominal || sisa);
      if (nominal > sisa) nominal = sisa;
      if (nominal <= 0) {
        await connection.rollback();
        return sendError(res, `Nominal pembayaran untuk "${tagihan.judul_tagihan}" tidak boleh 0`, 400);
      }

      totalBayar += nominal;
      itemsValid.push({
        tagihan_id: tagihan.id,
        judul_tagihan: tagihan.judul_tagihan,
        nominal_alokasi: nominal
      });
    }

    if (totalBayar <= 0) {
      await connection.rollback();
      return sendError(res, 'Total nominal pembayaran tidak valid', 400);
    }

    const nomorTransaksi = `TRX-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const metode = (metode_pembayaran === 'Virtual Account') ? 'Virtual Account' : 'QRIS';
    const channel = channel_pembayaran || 'Midtrans Snap';

    let vaNumber = null;
    let qrisData = null;

    let santriNama = 'Santri';
    let noWaWali = '081234567890';
    try {
      const [sRows] = await connection.query('SELECT nama_santri, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
      if (sRows && sRows.length > 0) {
        santriNama = sRows[0].nama_santri || 'Santri';
        noWaWali = sRows[0].no_wa_wali || '081234567890';
      }
    } catch (e) {}

    let snapToken = null;
    let paymentUrl = null;
    let finalTotalBayar = totalBayar;

    // 1. Buat Snap Token Midtrans (Otomatis dinamis per channel, dengan fallback flat fee)
    try {
      const snapRes = await createMidtransSnapToken({
        nomorTransaksi,
        totalBayar,
        santriNama,
        noWaWali,
        items: itemsValid
      });
      if (snapRes && snapRes.success) {
        snapToken = snapRes.token;
        paymentUrl = snapRes.redirect_url;
        if (snapRes.total_gross) {
          finalTotalBayar = snapRes.total_gross;
        }
      } else {
        await connection.rollback();
        return sendError(res, `Gagal memuat gateway Midtrans: ${snapRes?.error || 'Kredensial atau parameter tidak valid'}`, 400);
      }
    } catch (snapErr) {
      await connection.rollback();
      return sendError(res, `Error gateway Midtrans: ${snapErr.message}`, 500);
    }

    // Fallback nomor VA jika offline simulasi
    if (metode === 'Virtual Account' && !vaNumber) {
      const prefixMap = {
        'BCA': '80777',
        'Mandiri': '88908',
        'BNI': '98812',
        'BRI': '12800',
        'BSI': '90022'
      };
      let bankCode = '98812';
      for (const [key, val] of Object.entries(prefixMap)) {
        if (channel.toUpperCase().includes(key)) {
          bankCode = val;
          break;
        }
      }
      vaNumber = `${bankCode}${String(santri_id).padStart(4, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
    } else if (metode !== 'Virtual Account' && !qrisData) {
      // Dynamic QRIS String Mock (NMID Pesantren Nurul Wafa)
      qrisData = `00020101021226590014ID.LINKAJA.WWW01189360099900000100010208${nomorTransaksi}520458125303360540${finalTotalBayar}5802ID5925PP NURUL WAFA TASIKMALAYA6011TASIKMALAYA61054611162230119${nomorTransaksi}6304`;
    }

    // Simpan Transaksi Induk (simpan snap_token, nominal_pokok, nominal_fee_gateway & status_dana)
    await ensureKeuanganIndexes();
    const nominalFeeGateway = Math.max(0, finalTotalBayar - totalBayar);
    let trxResult = null;
    try {
      const [resWithSnap] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran 
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, va_number, qris_data, snap_token, total_bayar, nominal_pokok, nominal_fee_gateway, status_pembayaran, status_dana, keterangan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Menunggu Pembayaran', ?)
      `, [nomorTransaksi, santri_id, metode, channel, vaNumber, qrisData, snapToken, finalTotalBayar, totalBayar, nominalFeeGateway, `Pembayaran ${itemsValid.length} item tagihan (Fee Midtrans ditanggung pengirim)`]);
      trxResult = resWithSnap;
    } catch (insertErr) {
      const [resFallback] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran 
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, va_number, qris_data, total_bayar, status_pembayaran, keterangan)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      `, [nomorTransaksi, santri_id, metode, channel, vaNumber, qrisData, finalTotalBayar, `Pembayaran ${itemsValid.length} item tagihan (Fee Midtrans ditanggung pengirim)`]);
      trxResult = resFallback;
    }

    const transaksiId = trxResult.insertId;

    // Simpan Detail Alokasi Tagihan
    for (const validItem of itemsValid) {
      await connection.query(`
        INSERT INTO keuangan_transaksi_detail (transaksi_id, tagihan_id, nominal_alokasi)
        VALUES (?, ?, ?)
      `, [transaksiId, validItem.tagihan_id, validItem.nominal_alokasi]);
    }

    await connection.commit();

    return sendSuccess(res, 'Instruksi pembayaran digital berhasil dibuat', {
      transaksi_id: transaksiId,
      nomor_transaksi: nomorTransaksi,
      metode_pembayaran: metode,
      channel_pembayaran: channel,
      total_bayar: finalTotalBayar,
      formatted_total: `Rp ${finalTotalBayar.toLocaleString('id-ID')}`,
      va_number: vaNumber,
      qris_data: qrisData,
      snap_token: snapToken,
      payment_url: paymentUrl,
      status: 'Pending',
      items: itemsValid,
      expired_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal membuat transaksi: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Batalkan Transaksi Pembayaran Pending (Agar Wali Santri Bisa Ganti Metode Pembayaran)
 */
export const batalkanTransaksiPembayaran = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { transaksi_id, nomor_transaksi } = req.body;
    if (!transaksi_id && !nomor_transaksi) {
      return sendError(res, 'ID atau Nomor Transaksi wajib diisi', 400);
    }

    const [trx] = await connection.query(`
      SELECT id, nomor_transaksi, status_pembayaran 
      FROM keuangan_transaksi_pembayaran 
      WHERE ${transaksi_id ? 'id = ?' : 'nomor_transaksi = ?'} LIMIT 1
    `, [transaksi_id || nomor_transaksi]);

    if (!trx || trx.length === 0) {
      return sendError(res, 'Transaksi tidak ditemukan', 404);
    }

    if (trx[0].status_pembayaran === 'Berhasil') {
      return sendError(res, 'Transaksi sudah berhasil dibayar dan tidak dapat dibatalkan', 400);
    }

    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Batal',
          keterangan = CONCAT(COALESCE(keterangan, ''), ' [Dibatalkan Wali / Ganti Metode]'),
          updated_at = NOW()
      WHERE id = ?
    `, [trx[0].id]);

    return sendSuccess(res, 'Transaksi berhasil dibatalkan. Anda dapat memilih metode pembayaran baru.');
  } catch (err) {
    return sendError(res, `Gagal membatalkan transaksi: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Lanjutkan Pembayaran Pending (Ambil atau Buat Ulang Snap Token jika Belum Ada)
 */
export const lanjutkanPembayaran = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nomor_transaksi, transaksi_id } = req.body;
    if (!nomor_transaksi && !transaksi_id) {
      return sendError(res, 'Nomor atau ID transaksi wajib diisi', 400);
    }

    const [trxRows] = await connection.query(`
      SELECT p.*, s.nama_santri, s.no_wa_wali 
      FROM keuangan_transaksi_pembayaran p
      LEFT JOIN santri s ON p.santri_id = s.id
      WHERE ${transaksi_id ? 'p.id = ?' : 'p.nomor_transaksi = ?'} LIMIT 1
    `, [transaksi_id || nomor_transaksi]);

    if (!trxRows || trxRows.length === 0) {
      return sendError(res, 'Transaksi tidak ditemukan', 404);
    }

    const trx = trxRows[0];
    if (trx.status_pembayaran !== 'Pending') {
      return sendError(res, `Status transaksi saat ini adalah ${trx.status_pembayaran}`, 400);
    }

    // 1. Jika snap_token sudah tersimpan, langsung kembalikan
    if (trx.snap_token) {
      return sendSuccess(res, 'Token transaksi ditemukan', {
        snap_token: trx.snap_token,
        nomor_transaksi: trx.nomor_transaksi,
        total_bayar: trx.total_bayar
      });
    }

    // 2. Jika snap_token kosong (transaksi lama sebelum migrasi kolom), buat token baru on-the-fly
    // Tambahkan suffix baru agar tidak bentrok 'order_id has already been taken' di Midtrans
    const newOrderId = `${trx.nomor_transaksi.split('-R')[0]}-R${Date.now().toString().slice(-4)}`;

    const [detailRows] = await connection.query(`
      SELECT d.tagihan_id, d.nominal_alokasi, t.judul_tagihan 
      FROM keuangan_transaksi_detail d
      JOIN keuangan_tagihan t ON d.tagihan_id = t.id
      WHERE d.transaksi_id = ?
    `, [trx.id]);

    const itemsValid = detailRows.map(d => ({
      tagihan_id: d.tagihan_id,
      nominal_alokasi: d.nominal_alokasi,
      judul_tagihan: d.judul_tagihan
    }));

    const snapRes = await createMidtransSnapToken({
      nomorTransaksi: newOrderId,
      totalBayar: trx.total_bayar,
      santriNama: trx.nama_santri || 'Santri',
      noWaWali: trx.no_wa_wali || '081234567890',
      items: itemsValid
    });

    if (snapRes && snapRes.success && snapRes.token) {
      try {
        await connection.query('UPDATE keuangan_transaksi_pembayaran SET nomor_transaksi = ?, snap_token = ? WHERE id = ?', [newOrderId, snapRes.token, trx.id]);
      } catch (upErr) {}

      return sendSuccess(res, 'Token transaksi berhasil dimuat', {
        snap_token: snapRes.token,
        payment_url: snapRes.redirect_url,
        nomor_transaksi: newOrderId,
        total_bayar: trx.total_bayar
      });
    } else {
      return sendError(res, `Gagal memuat token Midtrans: ${snapRes?.error || 'Tidak dapat membuat snap token'}`, 400);
    }
  } catch (err) {
    return sendError(res, `Gagal melanjutkan pembayaran: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Verifikasi / Simulasi Konfirmasi Pembayaran Berhasil
 * Dapat dipanggil oleh webhook payment gateway atau tombol bayar instant di prototype
 */
export const konfirmasiPembayaranBerhasil = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { transaksi_id, nomor_transaksi } = req.body;

    if (!transaksi_id && !nomor_transaksi) {
      return sendError(res, 'ID atau Nomor Transaksi wajib diisi', 400);
    }

    await connection.beginTransaction();

    // 1. Ambil data transaksi
    const [trxRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_pembayaran 
      WHERE ${transaksi_id ? 'id = ?' : 'nomor_transaksi = ?'} FOR UPDATE
    `, [transaksi_id || nomor_transaksi]);

    if (trxRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Transaksi tidak ditemukan', 404);
    }

    const trx = trxRows[0];

    // Cek idempoten / pembayaran ganda
    if (trx.status_pembayaran === 'Berhasil') {
      await connection.rollback();
      return sendSuccess(res, 'Pembayaran ini sudah terverifikasi sebelumnya', {
        transaksi: trx,
        kuitansi_nomor: trx.kuitansi_nomor
      });
    }

    const kuitansiNomor = `KWT-NW-${new Date().toISOString().slice(0,7).replace(/-/g,'')}-${String(trx.id).padStart(4, '0')}`;
    const tanggalBayar = new Date();

    // 2. Ambil detail alokasi tagihan
    const [detailRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_detail WHERE transaksi_id = ?
    `, [trx.id]);

    // 3. Potong sisa tagihan secara akurat
    let sumAlokasi = 0;
    for (const d of detailRows) {
      sumAlokasi += parseFloat(d.nominal_alokasi || 0);
      const [tghRows] = await connection.query(`
        SELECT id, total_tagihan, sudah_dibayar, sisa_tagihan 
        FROM keuangan_tagihan WHERE id = ? FOR UPDATE
      `, [d.tagihan_id]);

      if (tghRows.length > 0) {
        const t = tghRows[0];
        const newSudah = parseFloat(t.sudah_dibayar) + parseFloat(d.nominal_alokasi);
        const newSisa = Math.max(0, parseFloat(t.total_tagihan) - newSudah);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Sebagian';

        await connection.query(`
          UPDATE keuangan_tagihan 
          SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [newSudah, newSisa, newStatus, t.id]);
      }
    }

    // 4. Update status transaksi jadi Berhasil, set status_dana & terbitkan kuitansi
    const statusDanaBaru = resolveStatusDanaForSuccess(trx.metode_pembayaran, trx.channel_pembayaran, trx.snap_token);
    const nomPokok = sumAlokasi > 0 ? sumAlokasi : parseFloat(trx.nominal_pokok || trx.total_bayar || 0);
    const nomFee = Math.max(0, parseFloat(trx.total_bayar || 0) - nomPokok);

    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
          status_dana = ?,
          nominal_pokok = COALESCE(NULLIF(nominal_pokok, 0), ?),
          nominal_fee_gateway = ?,
          tanggal_bayar = ?, 
          kuitansi_nomor = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [statusDanaBaru, nomPokok, nomFee, tanggalBayar, kuitansiNomor, trx.id]);

    await connection.commit();

    const fmtBayar = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(trx.total_bayar || 0);
    createWaliNotification({
      santri_id: trx.santri_id,
      kategori: 'keuangan',
      judul: `Pembayaran Berhasil: ${fmtBayar}`,
      pesan: `Alhamdulillah, pembayaran tagihan sebesar ${fmtBayar} (Kuitansi: ${kuitansiNomor}) telah terverifikasi.`,
      target_tab: 'tagihan'
    });

    return sendSuccess(res, 'Pembayaran berhasil diverifikasi secara otomatis! Tagihan telah lunas/berkurang.', {
      transaksi_id: trx.id,
      nomor_transaksi: trx.nomor_transaksi,
      status: 'Berhasil',
      status_dana: statusDanaBaru,
      kuitansi_nomor: kuitansiNomor,
      tanggal_bayar: tanggalBayar,
      total_dibayar: trx.total_bayar
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal memverifikasi pembayaran: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Mengambil Rincian Kuitansi Digital Pembayaran
 */
export const getKuitansiPembayaran = async (req, res) => {
  try {
    const { nomor_kuitansi, transaksi_id } = req.query;

    const [trxRows] = await pool.query(`
      SELECT 
        p.*,
        s.nama_santri,
        s.nis,
        s.kode_santri,
        s.nama_wali,
        s.no_wa_wali,
        a.nama_asrama,
        k.nama_kamar
      FROM keuangan_transaksi_pembayaran p
      JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE ${nomor_kuitansi ? 'p.kuitansi_nomor = ?' : 'p.id = ?'}
      LIMIT 1
    `, [nomor_kuitansi || transaksi_id]);

    if (trxRows.length === 0) {
      return sendError(res, 'Kuitansi tidak ditemukan', 404);
    }

    const transaksi = trxRows[0];

    const [detailRows] = await pool.query(`
      SELECT 
        d.nominal_alokasi,
        t.judul_tagihan,
        t.kategori,
        t.periode_bulan,
        t.total_tagihan,
        t.sisa_tagihan,
        t.status as status_tagihan_sekarang
      FROM keuangan_transaksi_detail d
      JOIN keuangan_tagihan t ON d.tagihan_id = t.id
      WHERE d.transaksi_id = ?
    `, [transaksi.id]);

    return sendSuccess(res, 'Kuitansi pembayaran berhasil diambil', {
      transaksi,
      items: detailRows || []
    });
  } catch (err) {
    return sendError(res, `Gagal mengambil kuitansi: ${err.message}`, 500);
  }
};

/**
 * Admin: Ringkasan Cepat Dashboard Beranda (Ultra-Fast < 50ms)
 * Hanya memuat ringkasan angka & transaksi terbaru tanpa payload besar
 */
export const getHomeKeuanganSummary = async (req, res) => {
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const [
      [summaryRows],
      [kasMasukRows],
      [tabunganRows],
      [transaksiTerakhir],
      siklusSpp,
      kantong
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COALESCE(SUM(total_tagihan), 0) as total_nominal_tagihan,
          COALESCE(SUM(sudah_dibayar), 0) as total_terbayar,
          COALESCE(SUM(sisa_tagihan), 0) as total_tunggakan,
          COUNT(CASE WHEN status != 'Lunas' THEN 1 END) as jumlah_tagihan_tertunggak,
          COUNT(CASE WHEN status = 'Lunas' THEN 1 END) as jumlah_tagihan_lunas
        FROM keuangan_tagihan
      `),
      pool.query(`
        SELECT COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as total_kas_masuk_sah
        FROM keuangan_transaksi_pembayaran
        WHERE status_pembayaran = 'Berhasil'
      `),
      pool.query(`
        SELECT COALESCE(SUM(saldo), 0) as total_saldo_tabungan
        FROM santri_tabungan
      `).catch(() => [[{ total_saldo_tabungan: 0 }]]),
      pool.query(`
        SELECT 
          p.id,
          p.santri_id,
          p.nomor_transaksi,
          p.total_bayar,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok,
          COALESCE(p.nominal_fee_gateway, 0) as nominal_fee_gateway,
          p.metode_pembayaran,
          p.channel_pembayaran,
          p.status_dana,
          p.tanggal_bayar,
          p.status_pembayaran,
          p.created_at,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis,
          COALESCE(s.nama_sekolah, 'SMP') as nama_sekolah,
          COALESCE(s.tingkat_sekolah, '-') as tingkat_sekolah,
          a.nama_asrama,
          k.nama_kamar
        FROM keuangan_transaksi_pembayaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        WHERE p.status_pembayaran = 'Berhasil'
        ORDER BY p.tanggal_bayar DESC, p.id DESC
        LIMIT 25
      `),
      getSiklusSppData(),
      getRingkasanKantongKas()
    ]);

    const summary = summaryRows[0] || {};
    const kasMasukRiil = kasMasukRows[0]?.total_kas_masuk_sah != null ? Number(kasMasukRows[0].total_kas_masuk_sah) : 0;
    const totalTabungan = tabunganRows[0]?.total_saldo_tabungan != null ? Number(tabunganRows[0].total_saldo_tabungan) : 0;

    return sendSuccess(res, 'Ringkasan beranda keuangan berhasil dimuat', {
      summary: {
        ...summary,
        total_kas_masuk_sah: kasMasukRiil,
        total_saldo_tabungan: totalTabungan,
        tgl_terbit_spp: siklusSpp.tgl_terbit_spp || 5,
        tgl_jatuh_tempo_spp: siklusSpp.tgl_jatuh_tempo_spp || 10,
        ...kantong
      },
      kantong,
      siklusSpp,
      transaksiTerakhir: transaksiTerakhir || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat ringkasan beranda: ${err.message}`, 500);
  }
};

/**
 * Admin / Mobile: Halaman Khusus Rincian Kas Masuk Sah (Ultra Cepat + Filter Periode, Kelas & Sekolah)
 * Menampilkan transaksi yang sudah lunas dan rincian itemnya
 */
export const getKasMasukSahList = async (req, res) => {
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const {
      limit = 1000,
      tanggal_dari = '',
      tanggal_sampai = '',
      kelas = '',
      sekolah = ''
    } = req.query;

    const whereClauses = [`p.status_pembayaran = 'Berhasil'`];
    const whereParams = [];

    const fromClean = String(tanggal_dari || '').trim();
    const toClean = String(tanggal_sampai || '').trim();
    if (fromClean && toClean) {
      const [startDate, endDate] = fromClean <= toClean ? [fromClean, toClean] : [toClean, fromClean];
      whereClauses.push(`DATE(COALESCE(p.tanggal_bayar, p.created_at)) BETWEEN ? AND ?`);
      whereParams.push(startDate, endDate);
    } else if (fromClean) {
      whereClauses.push(`DATE(COALESCE(p.tanggal_bayar, p.created_at)) >= ?`);
      whereParams.push(fromClean);
    } else if (toClean) {
      whereClauses.push(`DATE(COALESCE(p.tanggal_bayar, p.created_at)) <= ?`);
      whereParams.push(toClean);
    }

    const sekolahClean = String(sekolah || '').trim();
    if (sekolahClean && sekolahClean.toLowerCase() !== 'semua') {
      whereClauses.push(`(
        LOWER(COALESCE(NULLIF(TRIM(sk.nama_sekolah), ''), NULLIF(TRIM(s.nama_sekolah), ''), '')) = LOWER(?)
        OR LOWER(COALESCE(sk.jenjang, '')) = LOWER(?)
        OR LOWER(COALESCE(NULLIF(TRIM(sk.nama_sekolah), ''), NULLIF(TRIM(s.nama_sekolah), ''), '')) LIKE LOWER(?)
      )`);
      whereParams.push(sekolahClean, sekolahClean, `%${sekolahClean}%`);
    }

    const kelasClean = String(kelas || '').trim();
    if (kelasClean && kelasClean.toLowerCase() !== 'semua') {
      whereClauses.push(`LOWER(TRIM(COALESCE(NULLIF(TRIM(s.nama_kelas), ''), kl.nama_kelas, ''))) = LOWER(TRIM(?))`);
      whereParams.push(kelasClean);
    }

    const whereSql = whereClauses.join(' AND ');
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 1000, 10), 5000);

    const baseJoinSql = `
      FROM keuangan_transaksi_pembayaran p
      LEFT JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      LEFT JOIN kelas kl ON s.kelas_id = kl.id
    `;

    const [
      [totalRows],
      [listTrx],
      kantong,
      [bukuKasRows]
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COALESCE(SUM(COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar)), 0) as total_kas_masuk_sah,
          COALESCE(SUM(p.total_bayar), 0) as total_gross_pembayaran,
          COUNT(*) as total_transaksi
        ${baseJoinSql}
        WHERE ${whereSql}
      `, whereParams),
      pool.query(`
        SELECT 
          p.*,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok_efektif,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis,
          s.nama_wali,
          s.no_wa_wali,
          COALESCE(NULLIF(TRIM(s.nama_kelas), ''), NULLIF(TRIM(kl.nama_kelas), ''), '') as nama_kelas,
          COALESCE(NULLIF(TRIM(sk.nama_sekolah), ''), NULLIF(TRIM(s.nama_sekolah), ''), '') as nama_sekolah,
          COALESCE(NULLIF(TRIM(sk.jenjang), ''), NULLIF(TRIM(s.tingkat_sekolah), ''), '-') as tingkat_sekolah,
          a.nama_asrama,
          k.nama_kamar,
          (
            SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        ${baseJoinSql}
        WHERE ${whereSql}
        ORDER BY p.tanggal_bayar DESC, p.id DESC
        LIMIT ?
      `, [...whereParams, limitNum]),
      getRingkasanKantongKas(),
      pool.query(`
        SELECT * FROM keuangan_buku_kas
        ORDER BY tanggal DESC, id DESC
        LIMIT 300
      `).catch(() => [[]])
    ]);

    return sendSuccess(res, 'Data kas masuk sah berhasil dimuat', {
      summary: {
        ...(totalRows[0] || { total_kas_masuk_sah: 0, total_transaksi: 0 }),
        ...kantong
      },
      kantong,
      bukuKas: bukuKasRows || [],
      transaksi: (listTrx || []).map((r) => ({
        ...r,
        nominal_pokok: Number(r.nominal_pokok_efektif || r.nominal_pokok || r.total_bayar || 0),
        nominal_fee_gateway: Number(r.nominal_fee_gateway || 0),
        status_dana: r.status_dana || resolveStatusDanaForSuccess(r.metode_pembayaran, r.channel_pembayaran, r.snap_token),
        metode_pembayaran: normalizeMetodePembayaran(r.metode_pembayaran, r.channel_pembayaran)
      }))
    });
  } catch (err) {
    return sendError(res, `Gagal memuat kas masuk sah: ${err.message}`, 500);
  }
};

/**
 * Admin / Mobile: Halaman Khusus Tunggakan SPP Bulanan
 * Hanya menampilkan santri yang memiliki tunggakan SPP bulanan yang telah melewati tanggal jatuh tempo (default tgl 10).
 * Tagihan biasa / non-bulanan / awal masuk tidak dimasukkan.
 */
export const getTunggakanSppBulananList = async (req, res) => {
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const siklusSpp = await getSiklusSppData();
    const tglTempo = siklusSpp.tgl_jatuh_tempo_spp || 10;

    const [rows] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nis,
        s.nisn,
        s.nama_santri,
        s.nama_wali,
        s.no_wa_wali,
        COALESCE(s.nama_kelas, kl.nama_kelas, s.tingkat_sekolah, '-') as nama_kelas,
        COALESCE(s.tingkat_sekolah, kl.nama_kelas, s.nama_kelas, '-') as tingkat_sekolah,
        COALESCE(sk.nama_sekolah, s.nama_sekolah, 'SMP Nurul Wafa') as nama_sekolah,
        COALESCE(sk.jenjang, 'SMP') as sekolah_jenjang,
        a.nama_asrama,
        k.nama_kamar,
        COUNT(t.id) as jumlah_bulan_nunggak,
        COALESCE(SUM(t.sisa_tagihan), 0) as total_nominal_tunggakan,
        GROUP_CONCAT(
          CONCAT(
            COALESCE(t.periode_bulan, t.judul_tagihan), 
            '|', 
            t.sisa_tagihan,
            '|',
            COALESCE(DATE_FORMAT(t.jatuh_tempo, '%d/%m/%Y'), '-')
          ) 
          ORDER BY COALESCE(t.jatuh_tempo, t.id) ASC 
          SEPARATOR ';;'
        ) as rincian_tunggakan_raw
      FROM keuangan_tagihan t
      JOIN santri s ON t.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      LEFT JOIN kelas kl ON (s.kelas_id = kl.id OR s.nama_kelas = kl.nama_kelas)
      WHERE t.kategori = 'Bulanan'
        AND t.status != 'Lunas'
        AND (
          (t.jatuh_tempo IS NOT NULL AND t.jatuh_tempo <= CURDATE())
          OR 
          (t.jatuh_tempo IS NULL AND (
            STR_TO_DATE(CONCAT('01 ', t.periode_bulan), '%d %M %Y') < DATE_FORMAT(CURDATE(), '%Y-%m-01')
            OR (
              DATE_FORMAT(STR_TO_DATE(CONCAT('01 ', t.periode_bulan), '%d %M %Y'), '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
              AND DAY(CURDATE()) > ?
            )
          ))
        )
      GROUP BY s.id, s.nis, s.nisn, s.nama_santri, s.nama_wali, s.no_wa_wali, 
               s.nama_kelas, kl.nama_kelas, s.tingkat_sekolah, sk.nama_sekolah, 
               s.nama_sekolah, sk.jenjang, a.nama_asrama, k.nama_kamar
      HAVING total_nominal_tunggakan > 0
      ORDER BY total_nominal_tunggakan DESC, jumlah_bulan_nunggak DESC
    `, [tglTempo]);

    const santriTunggakan = rows.map((row) => {
      const items = (row.rincian_tunggakan_raw || '')
        .split(';;')
        .filter(Boolean)
        .map((it) => {
          const [judul, sisa, tempoStr] = it.split('|');
          return {
            bulan: judul || 'SPP Bulanan',
            nominal: parseFloat(sisa) || 0,
            jatuh_tempo: tempoStr || '-'
          };
        });

      return {
        santri_id: row.santri_id,
        nis: row.nis || '-',
        nama_santri: row.nama_santri,
        nama_wali: row.nama_wali || 'Wali Santri',
        no_wa_wali: row.no_wa_wali || '',
        nama_kelas: row.nama_kelas,
        tingkat_sekolah: row.tingkat_sekolah,
        nama_sekolah: row.nama_sekolah,
        nama_asrama: row.nama_asrama || '-',
        nama_kamar: row.nama_kamar || '-',
        jumlah_bulan_nunggak: row.jumlah_bulan_nunggak,
        total_nominal_tunggakan: parseFloat(row.total_nominal_tunggakan) || 0,
        rincian_spp: items
      };
    });

    const totalTunggakanSemua = santriTunggakan.reduce((sum, item) => sum + item.total_nominal_tunggakan, 0);

    return sendSuccess(res, 'Daftar tunggakan SPP bulanan berhasil dimuat', {
      summary: {
        total_nominal_tunggakan: totalTunggakanSemua,
        total_santri_menunggak: santriTunggakan.length,
        tgl_jatuh_tempo_spp: tglTempo
      },
      siklusSpp,
      santri: santriTunggakan
    });
  } catch (err) {
    return sendError(res, `Gagal memuat tunggakan SPP: ${err.message}`, 500);
  }
};

/**
 * Admin: Rekap Seluruh Keuangan, Komponen, dan Tunggakan
 * Dioptimalkan dengan query paralel Promise.all dan subquery agregasi efisien
 */
export const getRekapKeuanganAdmin = async (req, res) => {
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const [
      [summaryRows],
      [kasMasukRows],
      [transaksiTerakhir],
      [transaksiPending],
      [transaksiMidtrans],
      [tunggakanSantri],
      [komponenBiaya],
      [semuaTagihan],
      siklusSpp,
      kantong,
      [bukuKasRows]
    ] = await Promise.all([
      // 1. Ringkasan Global
      pool.query(`
        SELECT 
          COALESCE(SUM(total_tagihan), 0) as total_nominal_tagihan,
          COALESCE(SUM(sudah_dibayar), 0) as total_terbayar,
          COALESCE(SUM(sisa_tagihan), 0) as total_tunggakan,
          COUNT(CASE WHEN status != 'Lunas' THEN 1 END) as jumlah_tagihan_tertunggak,
          COUNT(CASE WHEN status = 'Lunas' THEN 1 END) as jumlah_tagihan_lunas
        FROM keuangan_tagihan
      `),

      // 1b. Kas Masuk Riil dari Transaksi Berhasil
      pool.query(`
        SELECT COALESCE(SUM(COALESCE(NULLIF(nominal_pokok, 0), total_bayar)), 0) as total_kas_masuk_sah
        FROM keuangan_transaksi_pembayaran
        WHERE status_pembayaran = 'Berhasil'
      `),

      // 2. Transaksi Kas Masuk Terakhir (Hanya yang BERHASIL / LUNAS)
      pool.query(`
        SELECT 
          p.*,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok_efektif,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis,
          COALESCE(s.nama_sekolah, 'SMP') as nama_sekolah,
          COALESCE(s.tingkat_sekolah, '-') as tingkat_sekolah,
          a.nama_asrama,
          k.nama_kamar,
          (
            SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        FROM keuangan_transaksi_pembayaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        WHERE p.status_pembayaran = 'Berhasil'
        ORDER BY p.tanggal_bayar DESC, p.id DESC
        LIMIT 100
      `),

      // 2b. Transaksi Menunggu Pembayaran (Pending)
      pool.query(`
        SELECT 
          p.*,
          s.nama_santri,
          s.nis,
          COALESCE(NULLIF(TRIM(s.nama_kelas), ''), '') as nama_kelas,
          a.nama_asrama,
          k.nama_kamar,
          (
            SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        FROM keuangan_transaksi_pembayaran p
        JOIN santri s ON p.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        WHERE p.status_pembayaran = 'Pending'
        ORDER BY p.created_at DESC
        LIMIT 200
      `),

      // 2c. Seluruh Histori Transaksi Gateway Midtrans
      pool.query(`
        SELECT 
          p.*,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok_efektif,
          s.nama_santri,
          s.nis,
          s.nama_wali,
          s.no_wa_wali,
          a.nama_asrama,
          k.nama_kamar,
          (
            SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        FROM keuangan_transaksi_pembayaran p
        JOIN santri s ON p.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        WHERE p.snap_token IS NOT NULL 
           OR p.nomor_transaksi LIKE 'TRX-%' 
           OR p.metode_pembayaran IN ('QRIS', 'Virtual Account')
        ORDER BY p.id DESC
        LIMIT 100
      `),

      // 3. Daftar Santri dengan Rekap Tunggakan (Pre-aggregated subquery cepat)
      pool.query(`
        SELECT 
          s.id as santri_id,
          s.nis,
          s.nama_santri,
          s.nama_wali,
          s.no_wa_wali,
          s.nama_sekolah,
          s.tingkat_sekolah,
          a.nama_asrama,
          k.nama_kamar,
          t.tunggakan_bulanan,
          t.tunggakan_biaya_masuk,
          t.total_tunggakan
        FROM (
          SELECT 
            santri_id,
            COALESCE(SUM(CASE WHEN kategori = 'Bulanan' THEN sisa_tagihan ELSE 0 END), 0) as tunggakan_bulanan,
            COALESCE(SUM(CASE WHEN kategori = 'Biaya Masuk' THEN sisa_tagihan ELSE 0 END), 0) as tunggakan_biaya_masuk,
            COALESCE(SUM(sisa_tagihan), 0) as total_tunggakan
          FROM keuangan_tagihan
          WHERE status != 'Lunas'
          GROUP BY santri_id
          HAVING total_tunggakan > 0
          ORDER BY total_tunggakan DESC
          LIMIT 100
        ) t
        JOIN santri s ON t.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      `),

      // 4. Master Komponen Biaya
      pool.query(`SELECT * FROM keuangan_komponen_biaya ORDER BY id ASC`),

      // 5. Semua Daftar Tagihan Santri
      pool.query(`
        SELECT 
          t.*,
          s.nama_santri,
          s.nis,
          s.nama_wali,
          s.no_wa_wali,
          s.nama_sekolah,
          s.tingkat_sekolah,
          a.nama_asrama,
          k.nama_kamar,
          kb.nama_komponen
        FROM keuangan_tagihan t
        JOIN santri s ON t.santri_id = s.id
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        LEFT JOIN keuangan_komponen_biaya kb ON t.komponen_id = kb.id
        ORDER BY t.id DESC
        LIMIT 100
      `),

      // Siklus SPP
      getSiklusSppData(),

      // 3 Kantong Saldo & Mutasi
      getRingkasanKantongKas(),

      // Buku Kas Operasional & Mutasi
      pool.query(`
        SELECT * FROM keuangan_buku_kas
        ORDER BY tanggal DESC, id DESC
        LIMIT 300
      `).catch(() => [[]])
    ]);

    const summary = summaryRows[0] || {};
    const kasMasukRiil = kasMasukRows[0]?.total_kas_masuk_sah != null ? Number(kasMasukRows[0].total_kas_masuk_sah) : 0;

    return sendSuccess(res, 'Rekap keuangan admin berhasil dimuat', {
      summary: {
        ...summary,
        total_kas_masuk_sah: kasMasukRiil,
        tgl_terbit_spp: siklusSpp.tgl_terbit_spp || 5,
        tgl_jatuh_tempo_spp: siklusSpp.tgl_jatuh_tempo_spp || 10,
        ...kantong
      },
      kantong,
      bukuKas: bukuKasRows || [],
      siklusSpp,
      transaksiTerakhir: (transaksiTerakhir || []).map((r) => ({
        ...r,
        nominal_pokok: Number(r.nominal_pokok_efektif || r.nominal_pokok || r.total_bayar || 0),
        nominal_fee_gateway: Number(r.nominal_fee_gateway || 0),
        status_dana: r.status_dana || resolveStatusDanaForSuccess(r.metode_pembayaran, r.channel_pembayaran, r.snap_token)
      })),
      transaksiPending: transaksiPending || [],
      transaksiMidtrans: (transaksiMidtrans || []).map((r) => ({
        ...r,
        nominal_pokok: Number(r.nominal_pokok_efektif || r.nominal_pokok || r.total_bayar || 0),
        nominal_fee_gateway: Number(r.nominal_fee_gateway || 0),
        status_dana:
          r.status_pembayaran !== 'Berhasil'
            ? 'Menunggu Pembayaran'
            : r.status_dana || 'Mengendap di Midtrans'
      })),
      tunggakanSantri: tunggakanSantri || [],
      komponenBiaya: komponenBiaya || [],
      semuaTagihan: semuaTagihan || []
    });
  } catch (err) {
    return sendError(res, `Gagal memuat rekap admin: ${err.message}`, 500);
  }
};

/**
 * Admin: Buat Tagihan Baru untuk Santri
 */
export const createTagihanAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const {
      santri_id,
      komponen_id,
      judul_tagihan,
      total_tagihan,
      sudah_dibayar,
      periode_bulan,
      jatuh_tempo,
      metode_pembayaran
    } = req.body;

    if (!santri_id || !komponen_id || !total_tagihan) {
      return sendError(res, 'Santri, Komponen, dan Nominal Tagihan wajib diisi', 400);
    }

    await connection.beginTransaction();

    const [kompRows] = await connection.query('SELECT kategori, nama_komponen FROM keuangan_komponen_biaya WHERE id = ?', [komponen_id]);
    const komp = kompRows[0] || { kategori: 'Lainnya', nama_komponen: 'Tagihan' };

    const kodeTagihan = `TGH-${santri_id}-${Date.now().toString().slice(-6)}`;
    const judul = (judul_tagihan && judul_tagihan.trim())
      ? judul_tagihan.trim()
      : `${komp.nama_komponen}${periode_bulan ? ` - ${periode_bulan}` : ''}`.trim();

    const nominal = Math.max(0, parseFloat(total_tagihan) || 0);
    const dibayar = Math.min(nominal, Math.max(0, parseFloat(sudah_dibayar) || 0));
    const sisa = Math.max(0, nominal - dibayar);
    const finalStatus = sisa <= 0 ? 'Lunas' : dibayar > 0 ? 'Cicilan' : 'Belum Dibayar';

    const [insRes] = await connection.query(`
      INSERT INTO keuangan_tagihan 
      (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [kodeTagihan, santri_id, komponen_id, judul, komp.kategori, periode_bulan || null, nominal, dibayar, sisa, finalStatus, jatuh_tempo || null]);

    const tagihanId = insRes.insertId;

    // Jika langsung ada pembayaran (Cicilan / Lunas), catat ke Log Transaksi & Kuitansi
    if (dibayar > 0) {
      await ensureKeuanganIndexes();
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const nomorTrx = `TRX-${datePart}-${rand4}`;
      const kuitansiNo = `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
      const metodeRaw = metode_pembayaran || 'Tunai / Kasir';
      const metodeNorm = normalizeMetodePembayaran(metodeRaw, metodeRaw);
      const statusDana = resolveStatusDanaForSuccess(metodeNorm, metodeRaw, null);

      const [trxRes] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, nominal_pokok, nominal_fee_gateway, status_pembayaran, status_dana, tanggal_bayar, kuitansi_nomor, keterangan)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'Berhasil', ?, NOW(), ?, ?)
      `, [nomorTrx, santri_id, metodeNorm, metodeRaw, dibayar, dibayar, statusDana, kuitansiNo, `Pembayaran ${finalStatus}: ${judul}`]);

      await connection.query(`
        INSERT INTO keuangan_transaksi_detail (transaksi_id, tagihan_id, nominal_alokasi)
        VALUES (?, ?, ?)
      `, [trxRes.insertId, tagihanId, dibayar]);
    }

    await connection.commit();
    return sendSuccess(res, 'Tagihan santri berhasil diterbitkan', { kode_tagihan: kodeTagihan, id: tagihanId });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal membuat tagihan: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Admin: Update Tagihan Santri (Termasuk Tambah Cicilan / Pelunasan)
 */
export const updateTagihanAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      santri_id,
      komponen_id,
      judul_tagihan,
      total_tagihan,
      sudah_dibayar,
      periode_bulan,
      jatuh_tempo,
      metode_pembayaran
    } = req.body;

    await connection.beginTransaction();

    const [existingRows] = await connection.query('SELECT * FROM keuangan_tagihan WHERE id = ? FOR UPDATE', [id]);
    if (!existingRows || existingRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Tagihan tidak ditemukan', 404);
    }
    const existing = existingRows[0];

    let kategori = existing.kategori;
    let namaKomponen = existing.judul_tagihan;
    if (komponen_id) {
      const [kompRows] = await connection.query('SELECT kategori, nama_komponen FROM keuangan_komponen_biaya WHERE id = ?', [komponen_id]);
      if (kompRows && kompRows.length > 0) {
        kategori = kompRows[0].kategori;
        namaKomponen = kompRows[0].nama_komponen;
      }
    }

    const periodeVal = periode_bulan !== undefined ? periode_bulan : existing.periode_bulan;
    const autoJudul = (judul_tagihan && judul_tagihan.trim())
      ? judul_tagihan.trim()
      : `${namaKomponen}${periodeVal ? ` - ${periodeVal}` : ''}`.trim();

    const total = total_tagihan !== undefined ? Math.max(0, parseFloat(total_tagihan) || 0) : parseFloat(existing.total_tagihan);
    const dibayar = sudah_dibayar !== undefined ? Math.min(total, Math.max(0, parseFloat(sudah_dibayar) || 0)) : parseFloat(existing.sudah_dibayar || 0);
    const sisa = Math.max(0, total - dibayar);
    const finalStatus = sisa <= 0 ? 'Lunas' : dibayar > 0 ? 'Cicilan' : 'Belum Dibayar';

    await connection.query(`
      UPDATE keuangan_tagihan SET
        santri_id = ?,
        komponen_id = ?,
        judul_tagihan = ?,
        kategori = ?,
        periode_bulan = ?,
        total_tagihan = ?,
        sudah_dibayar = ?,
        sisa_tagihan = ?,
        status = ?,
        jatuh_tempo = ?
      WHERE id = ?
    `, [
      santri_id || existing.santri_id,
      komponen_id || existing.komponen_id,
      autoJudul,
      kategori,
      periodeVal,
      total,
      dibayar,
      sisa,
      finalStatus,
      jatuh_tempo !== undefined ? (jatuh_tempo || null) : existing.jatuh_tempo,
      id
    ]);

    // Jika ada penambahan pembayaran baru (cicilan baru / pelunasan), catat ke Log Transaksi
    const prevDibayar = parseFloat(existing.sudah_dibayar || 0);
    const selisihBayar = dibayar - prevDibayar;
    if (selisihBayar > 0) {
      await ensureKeuanganIndexes();
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const nomorTrx = `TRX-${datePart}-${rand4}`;
      const kuitansiNo = `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
      const metodeRaw = metode_pembayaran || 'Tunai / Kasir';
      const metodeNorm = normalizeMetodePembayaran(metodeRaw, metodeRaw);
      const statusDana = resolveStatusDanaForSuccess(metodeNorm, metodeRaw, null);

      const [trxRes] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, nominal_pokok, nominal_fee_gateway, status_pembayaran, status_dana, tanggal_bayar, kuitansi_nomor, keterangan)
        VALUES (?, ?, ?, ?, ?, ?, 0, 'Berhasil', ?, NOW(), ?, ?)
      `, [
        nomorTrx,
        santri_id || existing.santri_id,
        metodeNorm,
        metodeRaw,
        selisihBayar,
        selisihBayar,
        statusDana,
        kuitansiNo,
        `Pembayaran ${finalStatus}: ${autoJudul}`
      ]);

      await connection.query(`
        INSERT INTO keuangan_transaksi_detail (transaksi_id, tagihan_id, nominal_alokasi)
        VALUES (?, ?, ?)
      `, [trxRes.insertId, id, selisihBayar]);
    }

    await connection.commit();
    return sendSuccess(res, 'Tagihan berhasil diperbarui');
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal memperbarui tagihan: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Admin: Hapus Tagihan Santri
 */
export const deleteTagihanAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM keuangan_tagihan WHERE id = ?', [id]);
    return sendSuccess(res, 'Tagihan berhasil dihapus');
  } catch (err) {
    return sendError(res, `Gagal menghapus tagihan: ${err.message}`, 500);
  }
};

/**
 * Admin: CRUD Master Komponen Biaya
 */
export const createKomponenAdmin = async (req, res) => {
  try {
    const { kode_komponen, nama_komponen, kategori, nominal_default, deskripsi } = req.body;
    if (!nama_komponen || !nominal_default) {
      return sendError(res, 'Nama komponen dan nominal default wajib diisi', 400);
    }
    const kode = kode_komponen || `KMP-${Date.now().toString().slice(-5)}`;
    const [result] = await pool.query(`
      INSERT INTO keuangan_komponen_biaya (kode_komponen, nama_komponen, kategori, nominal_default, deskripsi, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [kode, nama_komponen.trim(), kategori || 'Bulanan', parseFloat(nominal_default), deskripsi || null]);

    return sendSuccess(res, 'Komponen biaya berhasil ditambahkan', { id: result.insertId }, 201);
  } catch (err) {
    return sendError(res, `Gagal menambah komponen biaya: ${err.message}`, 500);
  }
};

export const updateKomponenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_komponen, kategori, nominal_default, deskripsi } = req.body;
    if (!nama_komponen || !nominal_default) {
      return sendError(res, 'Nama komponen dan nominal default wajib diisi', 400);
    }
    await pool.query(`
      UPDATE keuangan_komponen_biaya SET
        nama_komponen = ?,
        kategori = ?,
        nominal_default = ?,
        deskripsi = ?
      WHERE id = ?
    `, [nama_komponen.trim(), kategori || 'Bulanan', parseFloat(nominal_default), deskripsi || null, id]);

    return sendSuccess(res, 'Komponen biaya berhasil diperbarui');
  } catch (err) {
    return sendError(res, `Gagal memperbarui komponen biaya: ${err.message}`, 500);
  }
};

export const deleteKomponenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM keuangan_komponen_biaya WHERE id = ?', [id]);
    return sendSuccess(res, 'Komponen biaya berhasil dihapus');
  } catch (err) {
    return sendError(res, `Gagal menghapus komponen biaya: ${err.message}`, 500);
  }
};

/**
 * Admin: Auto-Generate Tagihan SPP Bulanan / Custom Periode (Looping Rentang Bulan atau Single Bulan)
 */
export const generateAutoTagihanAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      komponen_id,
      mode_generasi = 'looping', // 'looping' | 'single'
      bulan_mulai = 7,
      tahun_mulai = 2026,
      bulan_selesai = 6,
      tahun_selesai = 2027,
      filter_kamar = '', // '' = Semua Kamar/Asrama (Semua Santri Aktif), atau nama_asrama, atau 'SANTRI:<id>'
      filter_sekolah = '', // '' = Semua Sekolah, atau nama_sekolah/jenjang 'SMP', 'SMA', 'SMK'
      santri_id
    } = req.body;

    await connection.beginTransaction();

    // Fallback jika dipanggil tanpa komponen_id: cari komponen SPP Bulanan aktif
    let activeKompId = komponen_id;
    if (!activeKompId) {
      const [defaultKompRows] = await connection.query(
        "SELECT id FROM keuangan_komponen_biaya WHERE kategori = 'Bulanan' OR nama_komponen LIKE '%SPP%' ORDER BY id ASC LIMIT 1"
      );
      if (defaultKompRows && defaultKompRows.length > 0) {
        activeKompId = defaultKompRows[0].id;
      }
    }

    if (!activeKompId) {
      let totalGenerated = 0;
      if (!santri_id) {
        const [allSantri] = await connection.query('SELECT id FROM santri ORDER BY id ASC');
        for (const s of allSantri) {
          totalGenerated += await ensureAutoTagihanForSantri(s.id, connection);
        }
      } else {
        totalGenerated += await ensureAutoTagihanForSantri(santri_id, connection);
      }
      await connection.commit();
      return sendSuccess(res, `Auto-Generate Tagihan selesai (${totalGenerated} tagihan baru diterbitkan)`, {
        total_generated: totalGenerated,
        total_skipped: 0
      });
    }

    // 1. Ambil Detail Pos & Tarif Pembayaran
    const [kompRows] = await connection.query('SELECT * FROM keuangan_komponen_biaya WHERE id = ? LIMIT 1', [activeKompId]);
    if (!kompRows || kompRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Pos & Tarif Pembayaran tidak ditemukan', 404);
    }
    const komp = kompRows[0];
    const nominal = parseFloat(komp.nominal_default || 0);

    // 2. Bangun daftar periode bulan yang akan di-generate
    const NAMA_BULAN = [
      '',
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ];

    const siklus = await getSiklusSppData();
    const padTempo = String(siklus.tgl_jatuh_tempo_spp || 10).padStart(2, '0');

    const daftarPeriode = [];
    const bMulai = Math.min(12, Math.max(1, parseInt(bulan_mulai) || 7));
    const tMulai = parseInt(tahun_mulai) || 2026;
    const bSelesai = Math.min(12, Math.max(1, parseInt(bulan_selesai) || 6));
    const tSelesai = parseInt(tahun_selesai) || 2027;

    if (mode_generasi === 'single') {
      const namaBln = NAMA_BULAN[bMulai];
      daftarPeriode.push({
        periode_bulan: `${namaBln} ${tMulai}`,
        jatuh_tempo: `${tMulai}-${String(bMulai).padStart(2, '0')}-${padTempo}`,
        prefix: `${String(tMulai).slice(-2)}${String(bMulai).padStart(2, '0')}`
      });
    } else {
      // Looping dari (tMulai, bMulai) s/d (tSelesai, bSelesai) maksimal 36 bulan
      let curY = tMulai;
      let curM = bMulai;
      let safety = 0;
      while ((curY < tSelesai || (curY === tSelesai && curM <= bSelesai)) && safety < 36) {
        const namaBln = NAMA_BULAN[curM];
        daftarPeriode.push({
          periode_bulan: `${namaBln} ${curY}`,
          jatuh_tempo: `${curY}-${String(curM).padStart(2, '0')}-${padTempo}`,
          prefix: `${String(curY).slice(-2)}${String(curM).padStart(2, '0')}`
        });
        curM++;
        if (curM > 12) {
          curM = 1;
          curY++;
        }
        safety++;
      }
    }

    if (daftarPeriode.length === 0) {
      await connection.rollback();
      return sendError(res, 'Rentang bulan tidak valid (Bulan/Tahun mulai harus sebelum atau sama dengan Bulan/Tahun selesai)', 400);
    }

    // 3. Ambil daftar santri target sesuai filter kamar/kelas
    let santriQuery = `
      SELECT s.id, s.nama_santri, s.nama_sekolah, s.tingkat_sekolah, sk.jenjang, a.nama_asrama, k.nama_kamar
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (santri_id) {
      santriQuery += ' AND s.id = ?';
      queryParams.push(santri_id);
    } else if (filter_kamar && String(filter_kamar).startsWith('SANTRI:')) {
      const sId = String(filter_kamar).replace('SANTRI:', '');
      santriQuery += ' AND s.id = ?';
      queryParams.push(sId);
    } else if (filter_kamar && filter_kamar.trim() !== '') {
      santriQuery += ' AND (a.nama_asrama = ? OR k.nama_kamar = ?)';
      queryParams.push(filter_kamar.trim(), filter_kamar.trim());
    }

    if (filter_sekolah && filter_sekolah !== 'Semua' && String(filter_sekolah).trim() !== '') {
      const isNum = !isNaN(Number(filter_sekolah)) && String(filter_sekolah).trim() !== '';
      if (isNum) {
        santriQuery += ' AND s.sekolah_id = ?';
        queryParams.push(Number(filter_sekolah));
      } else {
        santriQuery += ' AND (UPPER(COALESCE(sk.jenjang, "")) = UPPER(?) OR UPPER(COALESCE(s.nama_sekolah, "")) LIKE UPPER(?) OR UPPER(COALESCE(sk.nama_sekolah, "")) LIKE UPPER(?))';
        queryParams.push(filter_sekolah, `%${filter_sekolah}%`, `%${filter_sekolah}%`);
      }
    }

    santriQuery += ' ORDER BY s.id ASC';
    const [targetSantri] = await connection.query(santriQuery, queryParams);

    if (!targetSantri || targetSantri.length === 0) {
      await connection.rollback();
      return sendError(res, 'Tidak ada santri aktif yang sesuai dengan filter tersebut', 404);
    }

    // 4. Loop setiap santri & setiap periode bulan -> lewati yang sudah ada (anti duplikat)
    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const s of targetSantri) {
      const [existingRows] = await connection.query(
        'SELECT id, komponen_id, judul_tagihan, periode_bulan FROM keuangan_tagihan WHERE santri_id = ?',
        [s.id]
      );

      for (let i = 0; i < daftarPeriode.length; i++) {
        const p = daftarPeriode[i];
        const isDuplicate = (existingRows || []).some(
          (r) =>
            (String(r.komponen_id) === String(komp.id) ||
              String(r.judul_tagihan || '').toLowerCase() === String(komp.nama_komponen || '').toLowerCase()) &&
            String(r.periode_bulan || '').toLowerCase() === p.periode_bulan.toLowerCase()
        );

        if (isDuplicate) {
          totalSkipped++;
          continue;
        }

        const randSuffix = String(s.id).padStart(2, '0') + String(i + 1).padStart(2, '0');
        const invCode = `INV-${p.prefix}${randSuffix}`;

        let targetNominal = nominal;
        let targetJudul = komp.nama_komponen;
        if (komp.kategori === 'Bulanan' && String(komp.nama_komponen).toLowerCase().includes('spp')) {
          const isSmp = s.jenjang === 'SMP' || String(s.nama_sekolah || '').toUpperCase().includes('SMP');
          targetNominal = isSmp ? 505000 : 565000;
          targetJudul = isSmp ? 'SPP Bulanan SMP' : (s.jenjang === 'SMK' ? 'SPP Bulanan SMK' : 'SPP Bulanan SMA');
        }

        await connection.query(
          `INSERT INTO keuangan_tagihan
           (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'Belum Dibayar', ?)`,
          [
            invCode,
            s.id,
            komp.id,
            targetJudul,
            komp.kategori || 'Bulanan',
            p.periode_bulan,
            targetNominal,
            targetNominal,
            p.jatuh_tempo
          ]
        );
        totalGenerated++;
      }
    }

    await connection.commit();
    return sendSuccess(
      res,
      `Berhasil menerbitkan ${totalGenerated} tagihan baru untuk ${targetSantri.length} santri (${totalSkipped} duplikat dilewati).`,
      {
        total_generated: totalGenerated,
        total_skipped: totalSkipped,
        total_santri: targetSantri.length,
        periode_count: daftarPeriode.length
      }
    );
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal generate auto tagihan: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Admin Kasir: Proses Pembayaran Langsung (Cash langsung Sah; Transfer default Pending sampai dikonfirmasi)
 */
export const bayarTagihanLangsungAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      santri_id,
      items,
      metode_pembayaran,
      channel_pembayaran,
      status_pembayaran
    } = req.body;
    if (!santri_id || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Pilih minimal satu tagihan yang akan dibayar', 400);
    }

    await connection.beginTransaction();

    const metode = normalizeMetodePembayaran(metode_pembayaran, channel_pembayaran);
    const channel = channel_pembayaran || (metode === 'Tunai' ? 'Cash / Tunai' : metode === 'Transfer' ? 'Transfer Bank (TF)' : metode);

    // Jika status eksplisit Pending, atau metode Transfer tanpa verifikasi eksplisit 'Berhasil', catat sebagai Pending (belum masuk kas)
    const isPending =
      String(status_pembayaran || '').toLowerCase() === 'pending' ||
      (metode === 'Transfer' && String(status_pembayaran || '').toLowerCase() !== 'berhasil');
    const finalTrxStatus = isPending ? 'Pending' : 'Berhasil';

    let totalBayar = 0;
    const validItems = [];

    for (const it of items) {
      const [rows] = await connection.query(
        'SELECT * FROM keuangan_tagihan WHERE id = ? AND santri_id = ? FOR UPDATE',
        [it.tagihan_id, santri_id]
      );
      if (!rows || rows.length === 0) continue;
      const tgh = rows[0];
      const sisaLama = parseFloat(tgh.sisa_tagihan || 0);
      if (sisaLama <= 0) continue;

      let nomBayar = parseFloat(it.nominal || sisaLama);
      if (isNaN(nomBayar) || nomBayar <= 0) continue;
      if (nomBayar > sisaLama) nomBayar = sisaLama;

      // Hanya potong tagihan jika transaksi benar-benar SAH / Berhasil (Cash atau Transfer terkonfirmasi)
      if (!isPending) {
        const sudahBaru = parseFloat(tgh.sudah_dibayar || 0) + nomBayar;
        const sisaBaru = Math.max(0, parseFloat(tgh.total_tagihan || 0) - sudahBaru);
        const statusBaru = sisaBaru <= 0 ? 'Lunas' : 'Cicilan';

        await connection.query(
          `UPDATE keuangan_tagihan
           SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?
           WHERE id = ?`,
          [sudahBaru, sisaBaru, statusBaru, tgh.id]
        );
      }

      totalBayar += nomBayar;
      validItems.push({
        tagihan_id: tgh.id,
        judul_tagihan: tgh.judul_tagihan,
        nominal_alokasi: nomBayar
      });
    }

    if (validItems.length === 0 || totalBayar <= 0) {
      await connection.rollback();
      return sendError(res, 'Tidak ada nominal pembayaran valid untuk diproses', 400);
    }

    await ensureKeuanganIndexes();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const nomorTrx = `TRX-${datePart}-${rand4}`;
    const kuitansiNo = isPending
      ? null
      : `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
    const statusDana = isPending
      ? 'Menunggu Pembayaran'
      : resolveStatusDanaForSuccess(metode, channel, null);

    const [trxRes] = await connection.query(
      `INSERT INTO keuangan_transaksi_pembayaran
       (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, nominal_pokok, nominal_fee_gateway, status_pembayaran, status_dana, tanggal_bayar, kuitansi_nomor, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ${isPending ? 'NULL' : 'NOW()'}, ?, ?)`,
      [
        nomorTrx,
        santri_id,
        metode,
        channel,
        totalBayar,
        totalBayar,
        finalTrxStatus,
        statusDana,
        kuitansiNo,
        `${isPending ? 'Menunggu Transfer' : 'Pembayaran'} ${validItems.length} tagihan (${validItems.map(v => v.judul_tagihan).join(', ')})`
      ]
    );

    for (const v of validItems) {
      await connection.query(
        `INSERT INTO keuangan_transaksi_detail (transaksi_id, tagihan_id, nominal_alokasi)
         VALUES (?, ?, ?)`,
        [trxRes.insertId, v.tagihan_id, v.nominal_alokasi]
      );
    }

    await connection.commit();
    return sendSuccess(
      res,
      isPending
        ? `Transfer Rp ${totalBayar.toLocaleString('id-ID')} dicatat sebagai Pending (belum masuk kas sebelum dikonfirmasi).`
        : `Pembayaran sejumlah Rp ${totalBayar.toLocaleString('id-ID')} berhasil disimpan!`,
      {
        transaksi_id: trxRes.insertId,
        nomor_transaksi: nomorTrx,
        kuitansi_nomor: kuitansiNo,
        status_pembayaran: finalTrxStatus,
        status_dana: statusDana,
        metode_pembayaran: metode,
        channel_pembayaran: channel,
        total_bayar: totalBayar,
        nominal_pokok: totalBayar
      }
    );
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal memproses pembayaran: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Webhook Callback Resmi BNI Direct API / BNI e-Collection
 * Dipanggil secara otomatis oleh server BNI saat pembayaran VA berhasil dilakukan
 */
export const webhookBniHandler = async (req, res) => {
  const payload = req.body || {};
  console.log('[BNI WEBHOOK RECEIVED]', JSON.stringify(payload));

  // Ambil identifier transaksi & VA dari berbagai kemungkinan format payload BNI
  const virtualAccount = payload.virtual_account || payload.virtualAccount || payload.va_number || payload.data?.virtual_account;
  const trxId = payload.trx_id || payload.trxId || payload.nomor_transaksi || payload.data?.trx_id;
  const paymentAmount = payload.payment_amount || payload.trx_amount || payload.amount || payload.data?.trx_amount;

  if (!virtualAccount && !trxId) {
    console.warn('[BNI WEBHOOK] Payload tidak memiliki virtual_account atau trx_id');
    return res.status(400).json({
      status: '999',
      message: 'Invalid payload: missing virtual_account or trx_id'
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cari transaksi berdasarkan VA Number atau Nomor Transaksi
    const [trxRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_pembayaran 
      WHERE (va_number IS NOT NULL AND va_number = ?) 
         OR (nomor_transaksi IS NOT NULL AND nomor_transaksi = ?) 
      ORDER BY id DESC LIMIT 1 FOR UPDATE
    `, [virtualAccount || '', trxId || '']);

    if (!trxRows || trxRows.length === 0) {
      await connection.rollback();
      console.warn('[BNI WEBHOOK] Transaksi tidak ditemukan untuk VA:', virtualAccount, 'Trx:', trxId);
      return res.status(404).json({
        status: '001',
        message: 'Transaction not found in pesantren database'
      });
    }

    const trx = trxRows[0];

    // Jika sudah pernah berhasil (idempoten), langsung balas 000 sukses
    if (trx.status_pembayaran === 'Berhasil') {
      await connection.rollback();
      return res.status(200).json({
        status: '000',
        message: 'Payment already verified previously'
      });
    }

    const kuitansiNomor = `KWT-BNI-${new Date().toISOString().slice(0,7).replace(/-/g,'')}-${String(trx.id).padStart(4, '0')}`;
    const tanggalBayar = new Date();

    // Ambil detail alokasi tagihan dan update status tagihan
    const [detailRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_detail WHERE transaksi_id = ?
    `, [trx.id]);

    for (const d of detailRows) {
      const [tghRows] = await connection.query(`
        SELECT id, total_tagihan, sudah_dibayar, sisa_tagihan 
        FROM keuangan_tagihan WHERE id = ? FOR UPDATE
      `, [d.tagihan_id]);

      if (tghRows && tghRows.length > 0) {
        const t = tghRows[0];
        const newSudah = parseFloat(t.sudah_dibayar) + parseFloat(d.nominal_alokasi);
        const newSisa = Math.max(0, parseFloat(t.total_tagihan) - newSudah);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Sebagian';

        await connection.query(`
          UPDATE keuangan_tagihan 
          SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [newSudah, newSisa, newStatus, t.id]);
      }
    }

    // Update status transaksi pembayaran jadi Berhasil
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
          status_dana = 'Di Rekening Bank',
          tanggal_bayar = ?, 
          kuitansi_nomor = ?,
          keterangan = CONCAT(COALESCE(keterangan, ''), ' [BNI Direct Webhook Auto-Settled]'),
          updated_at = NOW()
      WHERE id = ?
    `, [tanggalBayar, kuitansiNomor, trx.id]);

    await connection.commit();
    console.log(`[BNI WEBHOOK SUCCESS] Transaksi ${trx.nomor_transaksi} (VA: ${trx.va_number}) sukses dilunasi!`);

    // Format respon resmi sesuai standar BNI Direct API
    return res.status(200).json({
      status: '000',
      message: 'Payment successfully processed'
    });
  } catch (err) {
    await connection.rollback();
    console.error('[BNI WEBHOOK ERROR]', err);
    return res.status(500).json({
      status: '999',
      message: `Internal error: ${err.message}`
    });
  } finally {
    connection.release();
  }
};

/**
 * Webhook Callback Resmi iPaymu (notifyUrl)
 * Otomatis melunasi tagihan saat iPaymu mendeteksi pembayaran berhasil
 */
export const webhookIpaymuHandler = async (req, res) => {
  // iPaymu bisa mengirim data lewat req.body (POST) atau req.query (GET)
  const data = Object.keys(req.body || {}).length > 0 ? req.body : req.query;
  console.log('[IPAYMU WEBHOOK RECEIVED]', JSON.stringify(data));

  const trxId = data.trx_id || data.id;
  const referenceId = data.reference_id || data.referenceId || data.trx_id;
  const vaNumber = data.va;
  const status = String(data.status || '').toLowerCase();
  const statusCode = String(data.status_code || '');

  // iPaymu status 'berhasil' atau status_code '1' menandakan pembayaran lunas
  const isPaid = status === 'berhasil' || status === 'paid' || statusCode === '1';

  if (!isPaid) {
    console.log(`[IPAYMU WEBHOOK] Status pembayaran ${referenceId} masih: ${status || statusCode}`);
    return res.status(200).send('OK');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cari transaksi berdasarkan Nomor Transaksi (referenceId) atau VA Number
    const [trxRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_pembayaran 
      WHERE (nomor_transaksi IS NOT NULL AND nomor_transaksi = ?) 
         OR (va_number IS NOT NULL AND va_number = ?)
      ORDER BY id DESC LIMIT 1 FOR UPDATE
    `, [referenceId || '', vaNumber || '']);

    if (!trxRows || trxRows.length === 0) {
      await connection.rollback();
      console.warn('[IPAYMU WEBHOOK] Transaksi tidak ditemukan untuk Ref:', referenceId, 'VA:', vaNumber);
      return res.status(200).send('Transaction Not Found');
    }

    const trx = trxRows[0];

    // Idempoten: Jika sudah berhasil sebelumnya, return OK
    if (trx.status_pembayaran === 'Berhasil') {
      await connection.rollback();
      return res.status(200).send('OK (Already Processed)');
    }

    const kuitansiNomor = `KWT-IPM-${new Date().toISOString().slice(0,7).replace(/-/g,'')}-${String(trx.id).padStart(4, '0')}`;
    const tanggalBayar = new Date();

    // Potong & lunasi tagihan terkait di tabel keuangan_tagihan
    const [detailRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_detail WHERE transaksi_id = ?
    `, [trx.id]);

    for (const d of detailRows) {
      const [tghRows] = await connection.query(`
        SELECT id, total_tagihan, sudah_dibayar, sisa_tagihan 
        FROM keuangan_tagihan WHERE id = ? FOR UPDATE
      `, [d.tagihan_id]);

      if (tghRows && tghRows.length > 0) {
        const t = tghRows[0];
        const newSudah = parseFloat(t.sudah_dibayar) + parseFloat(d.nominal_alokasi);
        const newSisa = Math.max(0, parseFloat(t.total_tagihan) - newSudah);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Sebagian';

        await connection.query(`
          UPDATE keuangan_tagihan 
          SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [newSudah, newSisa, newStatus, t.id]);
      }
    }

    // Update status transaksi pembayaran jadi Berhasil
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
          status_dana = 'Di Rekening Bank',
          tanggal_bayar = ?, 
          kuitansi_nomor = ?,
          keterangan = CONCAT(COALESCE(keterangan, ''), ' [iPaymu Webhook Auto-Settled: Trx ID ', ?, ']'),
          updated_at = NOW()
      WHERE id = ?
    `, [tanggalBayar, kuitansiNomor, trxId || '', trx.id]);

    await connection.commit();
    console.log(`[IPAYMU WEBHOOK SUCCESS] Transaksi ${trx.nomor_transaksi} otomatis lunas terverifikasi!`);

    return res.status(200).send('OK');
  } catch (err) {
    await connection.rollback();
    console.error('[IPAYMU WEBHOOK ERROR]', err);
    return res.status(500).send(`Error: ${err.message}`);
  } finally {
    connection.release();
  }
};

/**
 * Webhook Callback Resmi Midtrans (HTTP Notification)
 * Menangani notifikasi status pembayaran settlement/capture secara real-time
 */
export const webhookMidtransHandler = async (req, res) => {
  const payload = req.body || {};
  console.log('[MIDTRANS NOTIFICATION RECEIVED]', JSON.stringify(payload));

  const orderId = payload.order_id;
  const transactionStatus = String(payload.transaction_status || '').toLowerCase();
  const fraudStatus = String(payload.fraud_status || '').toLowerCase();

  if (!orderId) {
    return res.status(400).json({ status: 'BAD_REQUEST', message: 'Missing order_id' });
  }

  // Tentukan apakah pembayaran sukses
  const isSettled = transactionStatus === 'settlement' || 
                    (transactionStatus === 'capture' && (fraudStatus === 'accept' || !fraudStatus));

  if (!isSettled) {
    console.log(`[MIDTRANS WEBHOOK] Status order ${orderId} adalah: ${transactionStatus} (Belum settlement)`);
    return res.status(200).json({ status: 'OK', message: `Order status is ${transactionStatus}` });
  }

  const connection = await pool.getConnection();
  try {
    // 1. Handle Top Up Saldo Tabungan via Midtrans
    if (orderId.startsWith('TOPUP-') || orderId.startsWith('TB-')) {
      const parts = orderId.split('-');
      const targetSantriId = parseInt(parts[1]);
      const grossAmount = parseFloat(payload.gross_amount || 0);

      if (targetSantriId && grossAmount > 0) {
        await connection.beginTransaction();
        await connection.query('INSERT IGNORE INTO santri_tabungan (santri_id, saldo) VALUES (?, 0.00)', [targetSantriId]);
        const [tRows] = await connection.query('SELECT id, saldo FROM santri_tabungan WHERE santri_id = ? FOR UPDATE', [targetSantriId]);
        const saldoSebelum = parseFloat(tRows[0]?.saldo || 0);
        const saldoSesudah = saldoSebelum + grossAmount;

        // Idempoten
        const [existingLog] = await connection.query('SELECT id FROM santri_tabungan_transaksi WHERE kode_transaksi = ?', [orderId]);
        if (existingLog && existingLog.length > 0) {
          await connection.rollback();
          return res.status(200).json({ status: 'OK', message: 'Top up tabungan already settled' });
        }

        await connection.query(
          `INSERT INTO santri_tabungan_transaksi 
           (tabungan_id, santri_id, kode_transaksi, jenis_transaksi, nominal, saldo_sebelum, saldo_sesudah, keterangan, tanggal_transaksi, admin_nama)
           VALUES (?, ?, ?, 'masuk', ?, ?, ?, ?, CURDATE(), ?)`,
          [tRows[0].id, targetSantriId, orderId, grossAmount, saldoSebelum, saldoSesudah, 'Isi Saldo Tabungan via Midtrans Online', 'Midtrans Webhook']
        );
        await connection.query('UPDATE santri_tabungan SET saldo = ? WHERE id = ?', [saldoSesudah, tRows[0].id]);
        await connection.commit();
        console.log(`[MIDTRANS TOPUP SETTLED] Santri ID ${targetSantriId} bertambah saldo Rp ${grossAmount}`);
        return res.status(200).json({ status: 'OK', message: 'Top up successfully processed' });
      }
    }

    // 2. Handle Pembayaran Tagihan Rutin Santri
    await connection.beginTransaction();

    const [trxRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_pembayaran 
      WHERE nomor_transaksi = ? OR ? LIKE CONCAT(nomor_transaksi, '%')
      ORDER BY id DESC LIMIT 1 FOR UPDATE
    `, [orderId, orderId]);

    if (!trxRows || trxRows.length === 0) {
      await connection.rollback();
      console.warn('[MIDTRANS WEBHOOK] Transaksi tidak ditemukan untuk Order ID:', orderId);
      return res.status(200).json({ status: 'OK', message: 'Order not found in DB' });
    }

    const trx = trxRows[0];

    // Cek idempoten
    if (trx.status_pembayaran === 'Berhasil') {
      await connection.rollback();
      return res.status(200).json({ status: 'OK', message: 'Already marked as Berhasil' });
    }

    const kuitansiNomor = `KWT-MID-${new Date().toISOString().slice(0,7).replace(/-/g,'')}-${String(trx.id).padStart(4, '0')}`;
    const tanggalBayar = new Date();

    // Lunasi tagihan di keuangan_tagihan
    const [detailRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_detail WHERE transaksi_id = ?
    `, [trx.id]);

    for (const d of detailRows) {
      const [tghRows] = await connection.query(`
        SELECT id, total_tagihan, sudah_dibayar, sisa_tagihan 
        FROM keuangan_tagihan WHERE id = ? FOR UPDATE
      `, [d.tagihan_id]);

      if (tghRows && tghRows.length > 0) {
        const t = tghRows[0];
        const newSudah = parseFloat(t.sudah_dibayar) + parseFloat(d.nominal_alokasi);
        const newSisa = Math.max(0, parseFloat(t.total_tagihan) - newSudah);
        const newStatus = newSisa <= 0 ? 'Lunas' : 'Sebagian';

        await connection.query(`
          UPDATE keuangan_tagihan 
          SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?, updated_at = NOW()
          WHERE id = ?
        `, [newSudah, newSisa, newStatus, t.id]);
      }
    }

    // Update status transaksi pembayaran jadi Berhasil (Dana masuk ke kantong Mengendap di Midtrans sampai dicairkan ke Bank)
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
          status_dana = 'Mengendap di Midtrans',
          tanggal_bayar = ?, 
          kuitansi_nomor = ?,
          keterangan = CONCAT(COALESCE(keterangan, ''), ' [Midtrans Auto-Settled: ', ?, ']'),
          updated_at = NOW()
      WHERE id = ?
    `, [tanggalBayar, kuitansiNomor, payload.payment_type || 'Payment', trx.id]);

    await connection.commit();
    console.log(`[MIDTRANS WEBHOOK SUCCESS] Transaksi ${orderId} otomatis lunas!`);

    return res.status(200).json({ status: 'OK', message: 'Payment successfully settled' });
  } catch (err) {
    await connection.rollback();
    console.error('[MIDTRANS WEBHOOK ERROR]', err);
    return res.status(500).json({ status: 'ERROR', message: err.message });
  } finally {
    connection.release();
  }
};

/**
 * Admin: Cek & Sinkronkan Status Transaksi Midtrans ke Database
 */
export const cekStatusMidtransAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { nomor_transaksi, transaksi_id } = req.body;
    if (!nomor_transaksi && !transaksi_id) {
      return sendError(res, 'Nomor atau ID transaksi diperlukan', 400);
    }

    const [trxRows] = await connection.query(`
      SELECT * FROM keuangan_transaksi_pembayaran 
      WHERE ${transaksi_id ? 'id = ?' : 'nomor_transaksi = ?'} LIMIT 1
    `, [transaksi_id || nomor_transaksi]);

    if (!trxRows || trxRows.length === 0) {
      return sendError(res, 'Transaksi tidak ditemukan di database lokal', 404);
    }

    const trx = trxRows[0];
    const midRes = await checkMidtransTransactionStatus(trx.nomor_transaksi);

    if (!midRes.success) {
      return sendError(res, `Gagal cek status ke Midtrans: ${midRes.error}`, 400);
    }

    const midData = midRes.data;
    const trxStatus = String(midData.transaction_status || '').toLowerCase();
    const fraudStatus = String(midData.fraud_status || '').toLowerCase();

    const isSettled = trxStatus === 'settlement' || 
                      (trxStatus === 'capture' && (fraudStatus === 'accept' || !fraudStatus));

    if (isSettled && trx.status_pembayaran !== 'Berhasil') {
      await connection.beginTransaction();

      const kuitansiNomor = `KWT-MID-${new Date().toISOString().slice(0,7).replace(/-/g,'')}-${String(trx.id).padStart(4, '0')}`;
      const tanggalBayar = new Date();

      const [detailRows] = await connection.query(`
        SELECT * FROM keuangan_transaksi_detail WHERE transaksi_id = ?
      `, [trx.id]);

      for (const d of detailRows) {
        const [tghRows] = await connection.query(`
          SELECT id, total_tagihan, sudah_dibayar, sisa_tagihan 
          FROM keuangan_tagihan WHERE id = ? FOR UPDATE
        `, [d.tagihan_id]);

        if (tghRows && tghRows.length > 0) {
          const t = tghRows[0];
          const newSudah = parseFloat(t.sudah_dibayar) + parseFloat(d.nominal_alokasi);
          const newSisa = Math.max(0, parseFloat(t.total_tagihan) - newSudah);
          const newStatus = newSisa <= 0 ? 'Lunas' : 'Sebagian';

          await connection.query(`
            UPDATE keuangan_tagihan 
            SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?, updated_at = NOW()
            WHERE id = ?
          `, [newSudah, newSisa, newStatus, t.id]);
        }
      }

      await connection.query(`
        UPDATE keuangan_transaksi_pembayaran 
        SET status_pembayaran = 'Berhasil', 
            status_dana = 'Mengendap di Midtrans',
            tanggal_bayar = ?, 
            kuitansi_nomor = ?,
            keterangan = CONCAT(COALESCE(keterangan, ''), ' [Manual Check Settled: ', ?, ']'),
            updated_at = NOW()
        WHERE id = ?
      `, [tanggalBayar, kuitansiNomor, midData.payment_type || 'Midtrans', trx.id]);

      await connection.commit();

      return sendSuccess(res, 'Status Midtrans terverifikasi: Pembayaran Berhasil & Tagihan Lunas!', {
        status: 'Berhasil',
        midtrans_status: trxStatus,
        kuitansi_nomor: kuitansiNomor,
        total_bayar: trx.total_bayar
      });
    } else if (['expire', 'cancel', 'deny'].includes(trxStatus)) {
      await connection.query(`
        UPDATE keuangan_transaksi_pembayaran 
        SET status_pembayaran = 'Batal', updated_at = NOW() 
        WHERE id = ?
      `, [trx.id]);

      return sendSuccess(res, `Status transaksi di Midtrans: ${trxStatus.toUpperCase()} (Telah dibatalkan/kadaluarsa)`, {
        status: 'Batal',
        midtrans_status: trxStatus
      });
    }

    return sendSuccess(res, `Status di Midtrans saat ini: ${trxStatus.toUpperCase()} (Menunggu pembayaran)`, {
      status: trx.status_pembayaran,
      midtrans_status: trxStatus,
      raw: midData
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal memproses sinkronisasi Midtrans: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Endpoint Khusus Admin / Bendahara: Bersihkan Semua Transaksi Fake / Dummy / Tanpa Rincian
 */
export const bersihkanFakeDataKeuangan = async (req, res) => {
  try {
    let deletedCount = 0;

    // 1. Hapus transaksi pembayaran fake/orphan yang tidak memiliki santri valid
    const [del1] = await pool.query(`
      DELETE FROM keuangan_transaksi_pembayaran 
      WHERE santri_id IS NULL 
         OR santri_id NOT IN (SELECT id FROM santri)
         OR nomor_transaksi LIKE '%DUMMY%' 
         OR nomor_transaksi LIKE '%TEST%'
    `);
    deletedCount += (del1.affectedRows || 0);

    // 2. Hapus transaksi yang tidak memiliki detail rincian tagihan sama sekali
    const [del2] = await pool.query(`
      DELETE p FROM keuangan_transaksi_pembayaran p
      LEFT JOIN keuangan_transaksi_detail d ON p.id = d.transaksi_id
      WHERE d.id IS NULL
    `);
    deletedCount += (del2.affectedRows || 0);

    // 3. Reset tagihan yang sudah_dibayar jika tidak ada transaksi yang mencatatnya
    const [upd] = await pool.query(`
      UPDATE keuangan_tagihan t
      SET sudah_dibayar = 0, sisa_tagihan = total_tagihan, status = 'Belum Dibayar'
      WHERE t.sudah_dibayar > 0
        AND t.id NOT IN (
          SELECT d.tagihan_id 
          FROM keuangan_transaksi_detail d
          JOIN keuangan_transaksi_pembayaran p ON d.transaksi_id = p.id
          WHERE p.status_pembayaran = 'Berhasil'
        )
    `);

    return sendSuccess(res, `Pembersihan berhasil. ${deletedCount} transaksi fake tanpa rincian dihapus, ${upd.affectedRows || 0} tagihan disinkronkan.`, {
      deleted_transactions: deletedCount,
      reset_tagihan: upd.affectedRows || 0
    });
  } catch (err) {
    return sendError(res, `Gagal membersihkan data fake: ${err.message}`, 500);
  }
};

/**
 * Pencarian Cepat Santri Kasir (Ultra Ringan, Tanpa Base64 Foto Berat)
 * Mengurangi ukuran payload dari 21 MB menjadi ~35 KB (600x lebih cepat)
 */
export const getSantriKasirSearch = async (req, res) => {
  try {
    const { q = '', limit = 200 } = req.query;
    let querySql = `
      SELECT 
        s.id, 
        s.nis, 
        s.nisn, 
        s.nama_santri, 
        s.nama_wali, 
        s.no_wa_wali, 
        COALESCE(s.nama_kelas, kl.nama_kelas, s.tingkat_sekolah, '-') as nama_kelas,
        COALESCE(s.tingkat_sekolah, kl.nama_kelas, s.nama_kelas, '-') as tingkat_sekolah, 
        COALESCE(sk.nama_sekolah, s.nama_sekolah, 'SMP Nurul Wafa') as nama_sekolah, 
        COALESCE(sk.jenjang, 'SMP') as sekolah_jenjang,
        a.nama_asrama, 
        k.nama_kamar,
        CASE 
          WHEN s.foto IS NOT NULL AND s.foto LIKE 'http%' THEN s.foto
          WHEN s.foto IS NOT NULL AND s.foto LIKE '/uploads%' THEN s.foto
          WHEN s.foto IS NOT NULL AND LENGTH(s.foto) < 255 THEN CONCAT('/uploads/santri/', s.foto)
          ELSE NULL 
        END as foto_url
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
      LEFT JOIN kelas kl ON s.kelas_id = kl.id
    `;
    const params = [];

    if (q && String(q).trim() !== '') {
      const term = `%${String(q).trim()}%`;
      querySql += `
        WHERE (
          s.nama_santri LIKE ? OR 
          s.nis LIKE ? OR 
          s.nisn LIKE ? OR 
          s.nama_wali LIKE ? OR 
          s.nama_kelas LIKE ? OR 
          a.nama_asrama LIKE ? OR 
          k.nama_kamar LIKE ?
        )
      `;
      params.push(term, term, term, term, term, term, term);
    }

    querySql += ` ORDER BY s.nama_santri ASC LIMIT ?`;
    params.push(q ? parseInt(limit) : 1000);

    const [rows] = await pool.query(querySql, params);

    return sendSuccess(res, 'Data santri kasir berhasil dimuat', rows || []);
  } catch (err) {
    return sendError(res, `Gagal mencari santri kasir: ${err.message}`, 500);
  }
};

/**
 * GET /api/keuangan/buku-kas (dan /api/keuangan/admin/buku-kas)
 * Mengambil posisi 3 Kantong Saldo, Daftar Transaksi Midtrans yang Mengendap (Unsettled),
 * dan Riwayat Buku Kas (Pengeluaran, Pemasukan Lain, Setor Tunai, Tarik Tunai, Pencairan Midtrans)
 */
export const getBukuKasAndKantong = async (req, res) => {
  try {
    await ensureKeuanganIndexes();
    const {
      tanggal_dari = '',
      tanggal_sampai = '',
      jenis_transaksi = '',
      kantong = '',
      limit = 500
    } = req.query;

    const whereClauses = ['1=1'];
    const whereParams = [];

    const fromClean = String(tanggal_dari || '').trim();
    const toClean = String(tanggal_sampai || '').trim();
    if (fromClean && toClean) {
      const [startDate, endDate] = fromClean <= toClean ? [fromClean, toClean] : [toClean, fromClean];
      whereClauses.push(`DATE(tanggal) BETWEEN ? AND ?`);
      whereParams.push(startDate, endDate);
    } else if (fromClean) {
      whereClauses.push(`DATE(tanggal) >= ?`);
      whereParams.push(fromClean);
    } else if (toClean) {
      whereClauses.push(`DATE(tanggal) <= ?`);
      whereParams.push(toClean);
    }

    const jenisClean = String(jenis_transaksi || '').trim();
    if (jenisClean && jenisClean.toLowerCase() !== 'semua') {
      whereClauses.push(`jenis_transaksi = ?`);
      whereParams.push(jenisClean);
    }

    const kantongClean = String(kantong || '').trim();
    if (kantongClean && kantongClean.toLowerCase() !== 'semua') {
      whereClauses.push(`(kantong_sumber = ? OR kantong_tujuan = ?)`);
      whereParams.push(kantongClean, kantongClean);
    }

    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 500, 10), 2000);

    const [
      kantongSummary,
      [unsettledMidtransRows],
      [settledMidtransRows],
      [bukuKasRows],
      [pembayaranKantongRows]
    ] = await Promise.all([
      getRingkasanKantongKas(),
      pool.query(`
        SELECT 
          p.id,
          p.nomor_transaksi,
          p.kuitansi_nomor,
          p.santri_id,
          p.metode_pembayaran,
          p.channel_pembayaran,
          p.total_bayar,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok,
          COALESCE(p.nominal_fee_gateway, 0) as nominal_fee_gateway,
          p.status_pembayaran,
          p.status_dana,
          p.tanggal_bayar,
          p.created_at,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis,
          COALESCE(NULLIF(TRIM(s.nama_kelas), ''), '') as nama_kelas,
          COALESCE(NULLIF(TRIM(sk.nama_sekolah), ''), NULLIF(TRIM(s.nama_sekolah), ''), '') as nama_sekolah,
          (
            SELECT GROUP_CONCAT(CONCAT(t.judul_tagihan, ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')') SEPARATOR ', ')
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        FROM keuangan_transaksi_pembayaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        LEFT JOIN sekolah sk ON s.sekolah_id = sk.id
        WHERE p.status_pembayaran = 'Berhasil'
          AND COALESCE(p.status_dana, '') = 'Mengendap di Midtrans'
        ORDER BY p.tanggal_bayar ASC, p.id ASC
        LIMIT 500
      `),
      pool.query(`
        SELECT 
          p.id,
          p.nomor_transaksi,
          p.kuitansi_nomor,
          p.santri_id,
          p.metode_pembayaran,
          p.channel_pembayaran,
          p.total_bayar,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok,
          COALESCE(p.nominal_fee_gateway, 0) as nominal_fee_gateway,
          p.status_dana,
          p.tanggal_bayar,
          p.tanggal_cair_bank,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis
        FROM keuangan_transaksi_pembayaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        WHERE p.status_pembayaran = 'Berhasil'
          AND COALESCE(p.status_dana, '') = 'Di Rekening Bank'
          AND (p.snap_token IS NOT NULL OR p.metode_pembayaran IN ('QRIS', 'Virtual Account') OR LOWER(COALESCE(p.channel_pembayaran, '')) LIKE '%midtrans%')
        ORDER BY COALESCE(p.tanggal_cair_bank, p.tanggal_bayar) DESC, p.id DESC
        LIMIT 100
      `),
      pool.query(`
        SELECT *
        FROM keuangan_buku_kas
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY tanggal DESC, id DESC
        LIMIT ?
      `, [...whereParams, limitNum]),
      pool.query(`
        SELECT 
          p.id,
          p.nomor_transaksi,
          p.kuitansi_nomor,
          p.santri_id,
          p.metode_pembayaran,
          p.channel_pembayaran,
          p.snap_token,
          p.total_bayar,
          COALESCE(NULLIF(p.nominal_pokok, 0), p.total_bayar) as nominal_pokok,
          COALESCE(p.nominal_fee_gateway, 0) as nominal_fee_gateway,
          p.status_dana,
          p.tanggal_bayar,
          p.keterangan as catatan_pembayaran,
          COALESCE(s.nama_santri, p.keterangan, 'Santri NWF') as nama_santri,
          COALESCE(s.nis, '-') as nis,
          (
            SELECT GROUP_CONCAT(
              CONCAT(
                t.judul_tagihan,
                IF(t.periode_bulan IS NOT NULL AND t.periode_bulan != '', CONCAT(' - ', t.periode_bulan), ''),
                ' (Rp ', FORMAT(d.nominal_alokasi, 0, 'id_ID'), ')'
              ) SEPARATOR ', '
            )
            FROM keuangan_transaksi_detail d
            JOIN keuangan_tagihan t ON d.tagihan_id = t.id
            WHERE d.transaksi_id = p.id
          ) as rincian_item
        FROM keuangan_transaksi_pembayaran p
        LEFT JOIN santri s ON p.santri_id = s.id
        WHERE p.status_pembayaran = 'Berhasil'
        ORDER BY p.tanggal_bayar DESC, p.id DESC
        LIMIT 500
      `)
    ]);

    const mappedManualBukuKas = (bukuKasRows || []).map((b) => ({
      ...b,
      nominal: Number(b.nominal || 0),
      biaya_admin: Number(b.biaya_admin || 0),
      is_pembayaran_santri: false
    }));

    const mappedPembayaranKantong = (pembayaranKantongRows || []).map((r) => {
      const isMidtrans =
        Boolean(r.snap_token) ||
        ['QRIS', 'Virtual Account'].includes(r.metode_pembayaran) ||
        String(r.channel_pembayaran || '').toLowerCase().includes('midtrans') ||
        r.status_dana === 'Mengendap di Midtrans';
      const isTransferBank =
        !isMidtrans &&
        (r.status_dana === 'Di Rekening Bank' || r.metode_pembayaran === 'Transfer');

      const kantongTujuan = isMidtrans
        ? 'Midtrans'
        : isTransferBank
          ? 'Rekening Bank'
          : 'Kas Tunai';

      const jenisLabel = isMidtrans
        ? r.status_dana === 'Di Rekening Bank'
          ? 'Pembayaran Midtrans (Sudah Cair)'
          : 'Pembayaran Midtrans (Mengendap)'
        : isTransferBank
          ? 'Kas Masuk Tagihan (Transfer)'
          : 'Kas Masuk Tagihan (Tunai)';

      const rincianText = r.rincian_item || r.catatan_pembayaran || 'Pembayaran Tagihan';

      return {
        id: `trx-${r.id}`,
        transaksi_pembayaran_id: r.id,
        kode_mutasi: r.kuitansi_nomor || r.nomor_transaksi || `TRX-${r.id}`,
        tanggal: r.tanggal_bayar,
        jenis_transaksi: jenisLabel,
        kategori: 'Pembayaran Santri',
        kantong_sumber: isMidtrans ? 'Midtrans' : null,
        kantong_tujuan: kantongTujuan,
        nominal: Number(r.nominal_pokok || r.total_bayar || 0),
        biaya_admin: 0,
        keterangan: `${r.nama_santri} — ${rincianText}`,
        penanggung_jawab: 'Kasir',
        is_pembayaran_santri: true,
        status_dana: r.status_dana,
        metode_pembayaran: r.metode_pembayaran
      };
    });

    const combinedBukuKas = [...mappedManualBukuKas, ...mappedPembayaranKantong].sort(
      (a, b) => new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime()
    );

    return sendSuccess(res, 'Data kantong saldo & buku kas berhasil dimuat', {
      kantong: kantongSummary,
      unsettledMidtrans: (unsettledMidtransRows || []).map((r) => ({
        ...r,
        nominal_pokok: Number(r.nominal_pokok || r.total_bayar || 0),
        nominal_fee_gateway: Number(r.nominal_fee_gateway || 0),
        total_bayar: Number(r.total_bayar || 0)
      })),
      settledMidtrans: (settledMidtransRows || []).map((r) => ({
        ...r,
        nominal_pokok: Number(r.nominal_pokok || r.total_bayar || 0),
        nominal_fee_gateway: Number(r.nominal_fee_gateway || 0),
        total_bayar: Number(r.total_bayar || 0)
      })),
      bukuKas: combinedBukuKas
    });
  } catch (err) {
    return sendError(res, `Gagal memuat buku kas & kantong saldo: ${err.message}`, 500);
  }
};

/**
 * POST /api/keuangan/buku-kas (dan /api/keuangan/admin/buku-kas)
 * Mencatat transaksi Buku Kas baru:
 * - Pengeluaran (dari Kas Tunai atau Rekening Bank)
 * - Pemasukan Lain (ke Kas Tunai atau Rekening Bank)
 * - Setor Tunai ke Bank (dari Kas Tunai -> ke Rekening Bank)
 * - Tarik Tunai dari Bank (dari Rekening Bank -> ke Kas Tunai)
 */
export const createBukuKasEntry = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    await ensureKeuanganIndexes();

    const {
      jenis_transaksi = 'Pengeluaran',
      kategori = 'Operasional',
      kantong_sumber = '',
      kantong_tujuan = '',
      nominal = 0,
      biaya_admin = 0,
      keterangan = '',
      tanggal = '',
      penanggung_jawab = ''
    } = req.body;

    const nominalNum = Math.round(parseFloat(nominal) || 0);
    const biayaAdminNum = Math.max(0, Math.round(parseFloat(biaya_admin) || 0));

    if (nominalNum <= 0) {
      return sendError(res, 'Nominal transaksi harus lebih dari Rp 0', 400);
    }

    if (!String(keterangan || '').trim()) {
      return sendError(res, 'Keterangan / uraian transaksi wajib diisi', 400);
    }

    let finalSumber = null;
    let finalTujuan = null;
    let finalKategori = String(kategori || 'Operasional').trim();

    if (jenis_transaksi === 'Pengeluaran') {
      finalSumber = kantong_sumber === 'Rekening Bank' ? 'Rekening Bank' : 'Kas Tunai';
      finalTujuan = null;
    } else if (jenis_transaksi === 'Pemasukan Lain') {
      finalSumber = null;
      finalTujuan = kantong_tujuan === 'Rekening Bank' ? 'Rekening Bank' : 'Kas Tunai';
      if (!kategori || kategori === 'Operasional') finalKategori = 'Pemasukan Lainnya';
    } else if (jenis_transaksi === 'Setor Tunai ke Bank') {
      finalSumber = 'Kas Tunai';
      finalTujuan = 'Rekening Bank';
      finalKategori = 'Setoran Bank';
    } else if (jenis_transaksi === 'Tarik Tunai dari Bank') {
      finalSumber = 'Rekening Bank';
      finalTujuan = 'Kas Tunai';
      finalKategori = 'Tarik Tunai Bank';
    } else {
      return sendError(res, `Jenis transaksi "${jenis_transaksi}" tidak valid`, 400);
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const prefix =
      jenis_transaksi === 'Pengeluaran'
        ? 'OUT'
        : jenis_transaksi === 'Pemasukan Lain'
          ? 'IN'
          : jenis_transaksi === 'Setor Tunai ke Bank'
            ? 'STR'
            : 'TRK';
    const kodeMutasi = `${prefix}-${datePart}-${rand4}`;

    const tglVal = tanggal && String(tanggal).trim()
      ? (String(tanggal).trim().length === 10 ? `${String(tanggal).trim()} ${new Date().toTimeString().slice(0, 8)}` : String(tanggal).trim())
      : new Date();

    const pjNama = String(penanggung_jawab || req.user?.nama || req.user?.username || 'Bendahara').trim();

    await connection.beginTransaction();

    const [insRes] = await connection.query(`
      INSERT INTO keuangan_buku_kas
      (kode_mutasi, tanggal, jenis_transaksi, kategori, kantong_sumber, kantong_tujuan, nominal, biaya_admin, keterangan, penanggung_jawab)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      kodeMutasi,
      tglVal,
      jenis_transaksi,
      finalKategori,
      finalSumber,
      finalTujuan,
      nominalNum,
      biayaAdminNum,
      String(keterangan).trim(),
      pjNama
    ]);

    await connection.commit();

    const kantongSummary = await getRingkasanKantongKas();

    return sendSuccess(res, `${jenis_transaksi} sebesar Rp ${nominalNum.toLocaleString('id-ID')} berhasil dicatat ke Buku Kas!`, {
      id: insRes.insertId,
      kode_mutasi: kodeMutasi,
      kantong: kantongSummary
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal mencatat buku kas: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * POST /api/keuangan/cairkan-midtrans (dan /api/keuangan/admin/cairkan-midtrans)
 * Mencairkan (Settlement / Payout) saldo mengendap di Midtrans ke Rekening Bank Pesantren
 */
export const cairkanSaldoMidtransKeBank = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    await ensureKeuanganIndexes();

    const {
      transaksi_ids = [],
      cairkan_semua = false,
      biaya_admin = 0,
      keterangan = '',
      tanggal = '',
      penanggung_jawab = ''
    } = req.body;

    await connection.beginTransaction();

    let targetRows = [];
    if (cairkan_semua || !Array.isArray(transaksi_ids) || transaksi_ids.length === 0) {
      const [rows] = await connection.query(`
        SELECT id, nomor_transaksi, total_bayar, COALESCE(NULLIF(nominal_pokok, 0), total_bayar) as nominal_pokok_efektif
        FROM keuangan_transaksi_pembayaran
        WHERE status_pembayaran = 'Berhasil'
          AND COALESCE(status_dana, '') = 'Mengendap di Midtrans'
        FOR UPDATE
      `);
      targetRows = rows || [];
    } else {
      const cleanIds = transaksi_ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id) && id > 0);
      if (cleanIds.length === 0) {
        await connection.rollback();
        return sendError(res, 'Pilih minimal satu transaksi Midtrans yang akan dicairkan', 400);
      }
      const placeholders = cleanIds.map(() => '?').join(',');
      const [rows] = await connection.query(`
        SELECT id, nomor_transaksi, total_bayar, COALESCE(NULLIF(nominal_pokok, 0), total_bayar) as nominal_pokok_efektif
        FROM keuangan_transaksi_pembayaran
        WHERE id IN (${placeholders})
          AND status_pembayaran = 'Berhasil'
          AND COALESCE(status_dana, '') = 'Mengendap di Midtrans'
        FOR UPDATE
      `, cleanIds);
      targetRows = rows || [];
    }

    if (!targetRows || targetRows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Tidak ada saldo transaksi Midtrans yang sedang mengendap untuk dicairkan', 400);
    }

    const totalPokokCair = targetRows.reduce(
      (sum, r) => sum + Math.round(parseFloat(r.nominal_pokok_efektif || r.total_bayar || 0)),
      0
    );
    const biayaAdminNum = Math.max(0, Math.round(parseFloat(biaya_admin) || 0));
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const kodeMutasi = `MID-BANK-${datePart}-${rand4}`;

    const tglVal = tanggal && String(tanggal).trim()
      ? (String(tanggal).trim().length === 10 ? `${String(tanggal).trim()} ${new Date().toTimeString().slice(0, 8)}` : String(tanggal).trim())
      : new Date();

    const pjNama = String(penanggung_jawab || req.user?.nama || req.user?.username || 'Bendahara').trim();
    const ketFinal = String(keterangan || '').trim() ||
      `Pencairan (Settlement/Payout) ${targetRows.length} transaksi Midtrans ke Rekening Bank Pesantren`;

    // 1. Catat ke keuangan_buku_kas
    const [bukuRes] = await connection.query(`
      INSERT INTO keuangan_buku_kas
      (kode_mutasi, tanggal, jenis_transaksi, kategori, kantong_sumber, kantong_tujuan, nominal, biaya_admin, keterangan, penanggung_jawab, jumlah_trx_dicairkan)
      VALUES (?, ?, 'Pencairan Midtrans ke Bank', 'Pencairan Midtrans', 'Midtrans', 'Rekening Bank', ?, ?, ?, ?, ?)
    `, [
      kodeMutasi,
      tglVal,
      totalPokokCair,
      biayaAdminNum,
      ketFinal,
      pjNama,
      targetRows.length
    ]);

    const bukuKasId = bukuRes.insertId;
    const idsToUpdate = targetRows.map((r) => r.id);
    const idPlaceholders = idsToUpdate.map(() => '?').join(',');

    // 2. Pindahkan status_dana transaksi Midtrans menjadi 'Di Rekening Bank'
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran
      SET status_dana = 'Di Rekening Bank',
          tanggal_cair_bank = ?,
          buku_kas_pencairan_id = ?,
          updated_at = NOW()
      WHERE id IN (${idPlaceholders})
    `, [tglVal, bukuKasId, ...idsToUpdate]);

    await connection.commit();

    const kantongSummary = await getRingkasanKantongKas();

    return sendSuccess(
      res,
      `Berhasil mencairkan ${targetRows.length} transaksi Midtrans senilai Rp ${totalPokokCair.toLocaleString('id-ID')} ke Rekening Bank Pesantren!`,
      {
        buku_kas_id: bukuKasId,
        kode_mutasi: kodeMutasi,
        jumlah_trx_dicairkan: targetRows.length,
        total_dicairkan: totalPokokCair,
        biaya_admin: biayaAdminNum,
        kantong: kantongSummary
      }
    );
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal mencairkan saldo Midtrans: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/keuangan/buku-kas/:id (dan /api/keuangan/admin/buku-kas/:id)
 * Menghapus catatan Buku Kas (dan jika itu Pencairan Midtrans, otomatis mengembalikan transaksi ke Mengendap di Midtrans)
 */
export const deleteBukuKasEntry = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const { id } = req.params;
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT * FROM keuangan_buku_kas WHERE id = ? FOR UPDATE', [id]);
    if (!rows || rows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Catatan buku kas tidak ditemukan', 404);
    }

    const entry = rows[0];

    // Jika yang dihapus adalah Pencairan Midtrans ke Bank, kembalikan status_dana transaksi terkait ke 'Mengendap di Midtrans'
    if (entry.jenis_transaksi === 'Pencairan Midtrans ke Bank') {
      await connection.query(`
        UPDATE keuangan_transaksi_pembayaran
        SET status_dana = 'Mengendap di Midtrans',
            tanggal_cair_bank = NULL,
            buku_kas_pencairan_id = NULL,
            updated_at = NOW()
        WHERE buku_kas_pencairan_id = ?
      `, [entry.id]);
    }

    await connection.query('DELETE FROM keuangan_buku_kas WHERE id = ?', [entry.id]);
    await connection.commit();

    const kantongSummary = await getRingkasanKantongKas();

    return sendSuccess(res, 'Catatan buku kas berhasil dihapus dan posisi saldo telah diperbarui.', {
      deleted_id: entry.id,
      kantong: kantongSummary
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal menghapus catatan buku kas: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/keuangan/buku-kas/:id (dan /api/keuangan/admin/buku-kas/:id)
 * Mengedit catatan Buku Kas (Pengeluaran, Pemasukan Lain, Setor Tunai, Tarik Tunai, atau Pencairan Midtrans)
 */
export const updateBukuKasEntry = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const { id } = req.params;
    const {
      jenis_transaksi,
      kategori = 'Operasional',
      kantong_sumber = null,
      kantong_tujuan = null,
      nominal,
      biaya_admin = 0,
      keterangan,
      tanggal,
      penanggung_jawab
    } = req.body;

    const nominalNum = Math.round(parseFloat(nominal) || 0);
    const biayaAdminNum = Math.max(0, Math.round(parseFloat(biaya_admin) || 0));

    if (nominalNum <= 0) {
      return sendError(res, 'Nominal harus lebih besar dari Rp 0', 400);
    }
    if (!keterangan || !String(keterangan).trim()) {
      return sendError(res, 'Keterangan / keperluan wajib diisi', 400);
    }

    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT * FROM keuangan_buku_kas WHERE id = ? FOR UPDATE', [id]);
    if (!rows || rows.length === 0) {
      await connection.rollback();
      return sendError(res, 'Catatan buku kas tidak ditemukan', 404);
    }

    const existing = rows[0];
    const finalJenis = jenis_transaksi || existing.jenis_transaksi;

    let finalSumber = existing.kantong_sumber;
    let finalTujuan = existing.kantong_tujuan;
    let finalKategori = String(kategori || existing.kategori || 'Operasional').trim();

    if (finalJenis === 'Pengeluaran') {
      finalSumber = kantong_sumber === 'Rekening Bank' ? 'Rekening Bank' : 'Kas Tunai';
      finalTujuan = null;
    } else if (finalJenis === 'Pemasukan Lain') {
      finalSumber = null;
      finalTujuan = kantong_tujuan === 'Rekening Bank' ? 'Rekening Bank' : 'Kas Tunai';
    } else if (finalJenis === 'Setor Tunai ke Bank') {
      finalSumber = 'Kas Tunai';
      finalTujuan = 'Rekening Bank';
      finalKategori = 'Setoran Bank';
    } else if (finalJenis === 'Tarik Tunai dari Bank') {
      finalSumber = 'Rekening Bank';
      finalTujuan = 'Kas Tunai';
      finalKategori = 'Tarik Tunai Bank';
    } else if (finalJenis === 'Pencairan Midtrans ke Bank') {
      finalSumber = 'Midtrans';
      finalTujuan = 'Rekening Bank';
      finalKategori = 'Pencairan Midtrans';
    }

    const tglVal = tanggal && String(tanggal).trim()
      ? (String(tanggal).trim().length === 10 ? `${String(tanggal).trim()} ${new Date().toTimeString().slice(0, 8)}` : String(tanggal).trim())
      : existing.tanggal;

    const pjNama = String(penanggung_jawab || existing.penanggung_jawab || req.user?.nama || 'Bendahara').trim();

    await connection.query(`
      UPDATE keuangan_buku_kas
      SET tanggal = ?,
          jenis_transaksi = ?,
          kategori = ?,
          kantong_sumber = ?,
          kantong_tujuan = ?,
          nominal = ?,
          biaya_admin = ?,
          keterangan = ?,
          penanggung_jawab = ?
      WHERE id = ?
    `, [
      tglVal,
      finalJenis,
      finalKategori,
      finalSumber,
      finalTujuan,
      nominalNum,
      biayaAdminNum,
      String(keterangan).trim(),
      pjNama,
      id
    ]);

    await connection.commit();

    const kantongSummary = await getRingkasanKantongKas();

    return sendSuccess(res, 'Catatan buku kas berhasil diperbarui!', {
      id: Number(id),
      kantong: kantongSummary
    });
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal memperbarui buku kas: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};





