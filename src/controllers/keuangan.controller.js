import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { canAccessKeuangan } from '../utils/authRole.util.js';
import { createBniVirtualAccount } from '../services/bni.service.js';
import { createIpaymuTransaction } from '../services/ipaymu.service.js';
import { chargeMidtransDirect, createMidtransSnapToken, checkMidtransTransactionStatus } from '../services/midtrans.service.js';
import { createWaliNotification } from './notifikasi.controller.js';
import { ensureSekolahTablesAndMapping } from './sekolah.controller.js';

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
  } catch (err) {
    console.warn('[SIKLUS SPP DB INIT NOTICE]', err.message);
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
    let santriId = req.query.santri_id || (req.user && (req.user.santri_id || req.user.id));

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

    // Simpan Transaksi Induk (simpan snap_token untuk restore saat refresh)
    let trxResult = null;
    try {
      const [resWithSnap] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran 
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, va_number, qris_data, snap_token, total_bayar, status_pembayaran, keterangan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      `, [nomorTransaksi, santri_id, metode, channel, vaNumber, qrisData, snapToken, finalTotalBayar, `Pembayaran ${itemsValid.length} item tagihan (Fee Midtrans ditanggung pengirim)`]);
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
    for (const d of detailRows) {
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

    // 4. Update status transaksi jadi Berhasil & terbitkan kuitansi
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
          tanggal_bayar = ?, 
          kuitansi_nomor = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [tanggalBayar, kuitansiNomor, trx.id]);

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
 * Admin: Rekap Seluruh Keuangan, Komponen, dan Tunggakan
 */
export const getRekapKeuanganAdmin = async (req, res) => {
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    // 1. Ringkasan Global
    const [summary] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_tagihan), 0) as total_nominal_tagihan,
        COALESCE(SUM(sudah_dibayar), 0) as total_terbayar,
        COALESCE(SUM(sisa_tagihan), 0) as total_tunggakan,
        COUNT(CASE WHEN status != 'Lunas' THEN 1 END) as jumlah_tagihan_tertunggak,
        COUNT(CASE WHEN status = 'Lunas' THEN 1 END) as jumlah_tagihan_lunas
      FROM keuangan_tagihan
    `);

    // 1b. Kas Masuk Riil dari Transaksi Berhasil (Hanya Pembayaran Sah)
    const [kasMasukRiil] = await pool.query(`
      SELECT COALESCE(SUM(total_bayar), 0) as total_kas_masuk_sah
      FROM keuangan_transaksi_pembayaran
      WHERE status_pembayaran = 'Berhasil'
    `);

    // 2. Transaksi Kas Masuk Terakhir (Hanya yang BERHASIL / LUNAS, PENDING TIDAK MASUK LAPORAN KAS)
    const [transaksiTerakhir] = await pool.query(`
      SELECT 
        p.*,
        s.nama_santri,
        s.nis,
        s.nama_sekolah,
        s.tingkat_sekolah,
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
      WHERE p.status_pembayaran = 'Berhasil'
      ORDER BY p.tanggal_bayar DESC, p.id DESC
      LIMIT 150
    `);

    // 2b. Transaksi Menunggu Pembayaran (Pending) - Terpisah dari Laporan Kas
    const [transaksiPending] = await pool.query(`
      SELECT 
        p.*,
        s.nama_santri,
        s.nis,
        a.nama_asrama,
        k.nama_kamar
      FROM keuangan_transaksi_pembayaran p
      JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE p.status_pembayaran = 'Pending'
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    // 2c. Seluruh Histori Transaksi Gateway Midtrans (Selesai, Pending, Batal/Expired)
    const [transaksiMidtrans] = await pool.query(`
      SELECT 
        p.*,
        s.nama_santri,
        s.nis,
        s.nama_wali,
        s.no_wa_wali,
        a.nama_asrama,
        k.nama_kamar
      FROM keuangan_transaksi_pembayaran p
      JOIN santri s ON p.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      WHERE p.snap_token IS NOT NULL 
         OR p.nomor_transaksi LIKE 'TRX-%' 
         OR p.metode_pembayaran IN ('QRIS', 'Virtual Account')
      ORDER BY p.id DESC
      LIMIT 100
    `);

    // 3. Daftar Santri dengan Rekap Tunggakan
    const [tunggakanSantri] = await pool.query(`
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
        COALESCE(SUM(CASE WHEN t.kategori = 'Bulanan' THEN t.sisa_tagihan ELSE 0 END), 0) as tunggakan_bulanan,
        COALESCE(SUM(CASE WHEN t.kategori = 'Biaya Masuk' THEN t.sisa_tagihan ELSE 0 END), 0) as tunggakan_biaya_masuk,
        COALESCE(SUM(t.sisa_tagihan), 0) as total_tunggakan
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN keuangan_tagihan t ON s.id = t.santri_id AND t.status != 'Lunas'
      GROUP BY s.id, s.nis, s.nama_santri, s.nama_wali, s.no_wa_wali, s.nama_sekolah, s.tingkat_sekolah, a.nama_asrama, k.nama_kamar
      HAVING total_tunggakan > 0
      ORDER BY total_tunggakan DESC
      LIMIT 100
    `);

    // 4. Master Komponen Biaya
    const [komponenBiaya] = await pool.query(`
      SELECT * FROM keuangan_komponen_biaya ORDER BY id ASC
    `);

    // 5. Semua Daftar Tagihan Santri
    const [semuaTagihan] = await pool.query(`
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
      LIMIT 150
    `);

    const siklusSpp = await getSiklusSppData();

    return sendSuccess(res, 'Rekap keuangan admin berhasil dimuat', {
      summary: {
        ...summary[0],
        total_kas_masuk_sah: kasMasukRiil[0]?.total_kas_masuk_sah != null ? Number(kasMasukRiil[0].total_kas_masuk_sah) : 0,
        tgl_terbit_spp: siklusSpp.tgl_terbit_spp || 5,
        tgl_jatuh_tempo_spp: siklusSpp.tgl_jatuh_tempo_spp || 10
      },
      siklusSpp,
      transaksiTerakhir: transaksiTerakhir || [],
      transaksiPending: transaksiPending || [],
      transaksiMidtrans: transaksiMidtrans || [],
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
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const nomorTrx = `TRX-${datePart}-${rand4}`;
      const kuitansiNo = `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
      const metode = metode_pembayaran || 'Tunai / Kasir';

      const [trxRes] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, status_pembayaran, tanggal_bayar, kuitansi_nomor, keterangan)
        VALUES (?, ?, ?, ?, ?, 'Berhasil', NOW(), ?, ?)
      `, [nomorTrx, santri_id, metode.includes('QRIS') ? 'QRIS' : 'Virtual Account', metode, dibayar, kuitansiNo, `Pembayaran ${finalStatus}: ${judul}`]);

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
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand4 = Math.floor(1000 + Math.random() * 9000);
      const nomorTrx = `TRX-${datePart}-${rand4}`;
      const kuitansiNo = `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
      const metode = metode_pembayaran || 'Tunai / Kasir';

      const [trxRes] = await connection.query(`
        INSERT INTO keuangan_transaksi_pembayaran
        (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, status_pembayaran, tanggal_bayar, kuitansi_nomor, keterangan)
        VALUES (?, ?, ?, ?, ?, 'Berhasil', NOW(), ?, ?)
      `, [
        nomorTrx,
        santri_id || existing.santri_id,
        metode.includes('QRIS') ? 'QRIS' : 'Virtual Account',
        metode,
        selisihBayar,
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

    // Fallback jika dipanggil tanpa komponen_id
    if (!komponen_id) {
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
    const [kompRows] = await connection.query('SELECT * FROM keuangan_komponen_biaya WHERE id = ? LIMIT 1', [komponen_id]);
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

    if (filter_sekolah && filter_sekolah !== 'Semua' && filter_sekolah.trim() !== '') {
      santriQuery += ' AND (s.sekolah_id = ? OR s.nama_sekolah LIKE ? OR sk.jenjang = ?)';
      queryParams.push(filter_sekolah, `%${filter_sekolah}%`, filter_sekolah);
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
 * Admin Kasir: Proses Pembayaran Langsung (Pelunasan Sekaligus / Cicilan Multi-Item)
 */
export const bayarTagihanLangsungAdmin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { santri_id, items, metode_pembayaran, channel_pembayaran } = req.body;
    if (!santri_id || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Pilih minimal satu tagihan yang akan dibayar', 400);
    }

    await connection.beginTransaction();

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

      const sudahBaru = parseFloat(tgh.sudah_dibayar || 0) + nomBayar;
      const sisaBaru = Math.max(0, parseFloat(tgh.total_tagihan || 0) - sudahBaru);
      const statusBaru = sisaBaru <= 0 ? 'Lunas' : 'Cicilan';

      await connection.query(
        `UPDATE keuangan_tagihan
         SET sudah_dibayar = ?, sisa_tagihan = ?, status = ?
         WHERE id = ?`,
        [sudahBaru, sisaBaru, statusBaru, tgh.id]
      );

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

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand4 = Math.floor(1000 + Math.random() * 9000);
    const nomorTrx = `TRX-${datePart}-${rand4}`;
    const kuitansiNo = `KWT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${rand4}`;
    const metode = metode_pembayaran === 'QRIS' ? 'QRIS' : 'Virtual Account';
    const channel = channel_pembayaran || metode_pembayaran || 'Tunai / Kasir Pesantren';

    const [trxRes] = await connection.query(
      `INSERT INTO keuangan_transaksi_pembayaran
       (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, total_bayar, status_pembayaran, tanggal_bayar, kuitansi_nomor, keterangan)
       VALUES (?, ?, ?, ?, ?, 'Berhasil', NOW(), ?, ?)`,
      [
        nomorTrx,
        santri_id,
        metode,
        channel,
        totalBayar,
        kuitansiNo,
        `Pembayaran ${validItems.length} tagihan (${validItems.map(v => v.judul_tagihan).join(', ')})`
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
    return sendSuccess(res, `Pembayaran sejumlah Rp ${totalBayar.toLocaleString('id-ID')} berhasil disimpan!`, {
      transaksi_id: trxRes.insertId,
      nomor_transaksi: nomorTrx,
      kuitansi_nomor: kuitansiNo,
      total_bayar: totalBayar
    });
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

    // Update status transaksi pembayaran jadi Berhasil
    await connection.query(`
      UPDATE keuangan_transaksi_pembayaran 
      SET status_pembayaran = 'Berhasil', 
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



