import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { canAccessKeuangan } from '../utils/authRole.util.js';

/**
 * Mengambil Ringkasan Dashboard Keuangan & Rincian Tagihan Santri (Khusus Wali Santri)
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

    // Ambil Data Santri
    const [santriRows] = await pool.query(`
      SELECT id, kode_santri, nis, nama_santri, nama_wali, no_wa_wali, status_santri
      FROM santri WHERE id = ? LIMIT 1
    `, [santriId]);

    const santri = santriRows[0] || {};

    // 1. Ambil Seluruh Tagihan Santri
    const [tagihanRows] = await pool.query(`
      SELECT 
        t.*,
        k.nama_komponen,
        k.deskripsi as deskripsi_komponen
      FROM keuangan_tagihan t
      LEFT JOIN keuangan_komponen_biaya k ON t.komponen_id = k.id
      WHERE t.santri_id = ?
      ORDER BY 
        CASE WHEN t.status = 'Belum Dibayar' THEN 1 WHEN t.status = 'Sebagian' THEN 2 ELSE 3 END,
        t.jatuh_tempo ASC, t.id ASC
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
    const metode = metode_pembayaran === 'Virtual Account' ? 'Virtual Account' : 'QRIS';
    const channel = channel_pembayaran || (metode === 'Virtual Account' ? 'BCA Virtual Account' : 'QRIS Dinamis');

    let vaNumber = null;
    let qrisData = null;

    if (metode === 'Virtual Account') {
      const prefixMap = {
        'BCA': '80777',
        'Mandiri': '88908',
        'BNI': '98812',
        'BRI': '12800',
        'BSI': '90022'
      };
      let bankCode = '80777';
      for (const [key, val] of Object.entries(prefixMap)) {
        if (channel.toUpperCase().includes(key)) {
          bankCode = val;
          break;
        }
      }
      vaNumber = `${bankCode}${String(santri_id).padStart(4, '0')}${Math.floor(10000 + Math.random() * 90000)}`;
    } else {
      // Dynamic QRIS String Mock (NMID Pesantren Nurul Wafa)
      qrisData = `00020101021226590014ID.LINKAJA.WWW01189360099900000100010208${nomorTransaksi}520458125303360540${totalBayar}5802ID5925PP NURUL WAFA TASIKMALAYA6011TASIKMALAYA61054611162230119${nomorTransaksi}6304`;
    }

    // Simpan Transaksi Induk
    const [trxResult] = await connection.query(`
      INSERT INTO keuangan_transaksi_pembayaran 
      (nomor_transaksi, santri_id, metode_pembayaran, channel_pembayaran, va_number, qris_data, total_bayar, status_pembayaran, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [nomorTransaksi, santri_id, metode, channel, vaNumber, qrisData, totalBayar, `Pembayaran ${itemsValid.length} item tagihan`]);

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
      total_bayar: totalBayar,
      formatted_total: `Rp ${totalBayar.toLocaleString('id-ID')}`,
      va_number: vaNumber,
      qris_data: qrisData,
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

    // 2. Transaksi Terakhir
    const [transaksiTerakhir] = await pool.query(`
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
      ORDER BY p.created_at DESC
      LIMIT 50
    `);

    // 3. Daftar Santri dengan Rekap Tunggakan
    const [tunggakanSantri] = await pool.query(`
      SELECT 
        s.id as santri_id,
        s.nis,
        s.nama_santri,
        s.nama_wali,
        s.no_wa_wali,
        a.nama_asrama,
        k.nama_kamar,
        COALESCE(SUM(CASE WHEN t.kategori = 'Bulanan' THEN t.sisa_tagihan ELSE 0 END), 0) as tunggakan_bulanan,
        COALESCE(SUM(CASE WHEN t.kategori = 'Biaya Masuk' THEN t.sisa_tagihan ELSE 0 END), 0) as tunggakan_biaya_masuk,
        COALESCE(SUM(t.sisa_tagihan), 0) as total_tunggakan
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN keuangan_tagihan t ON s.id = t.santri_id AND t.status != 'Lunas'
      GROUP BY s.id, s.nis, s.nama_santri, s.nama_wali, s.no_wa_wali, a.nama_asrama, k.nama_kamar
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

    return sendSuccess(res, 'Rekap keuangan admin berhasil dimuat', {
      summary: summary[0],
      transaksiTerakhir: transaksiTerakhir || [],
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
  try {
    if (req.user && !canAccessKeuangan(req.user)) {
      return sendError(res, 'Akses Ditolak: Fitur keuangan khusus untuk Admin Keuangan / Bendahara.', 403);
    }

    const { santri_id, komponen_id, judul_tagihan, total_tagihan, periode_bulan, jatuh_tempo } = req.body;

    if (!santri_id || !komponen_id || !total_tagihan) {
      return sendError(res, 'Santri, Komponen, dan Nominal Tagihan wajib diisi', 400);
    }

    const [kompRows] = await pool.query('SELECT kategori, nama_komponen FROM keuangan_komponen_biaya WHERE id = ?', [komponen_id]);
    const komp = kompRows[0] || { kategori: 'Lainnya', nama_komponen: 'Tagihan' };

    const kodeTagihan = `TGH-${santri_id}-${Date.now().toString().slice(-6)}`;
    const judul = judul_tagihan || `${komp.nama_komponen} ${periode_bulan || ''}`.trim();
    const nominal = parseFloat(total_tagihan);

    await pool.query(`
      INSERT INTO keuangan_tagihan 
      (kode_tagihan, santri_id, komponen_id, judul_tagihan, kategori, periode_bulan, total_tagihan, sudah_dibayar, sisa_tagihan, status, jatuh_tempo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, ?, 'Belum Dibayar', ?)
    `, [kodeTagihan, santri_id, komponen_id, judul, komp.kategori, periode_bulan || null, nominal, nominal, jatuh_tempo || null]);

    return sendSuccess(res, 'Tagihan santri berhasil diterbitkan', { kode_tagihan: kodeTagihan });
  } catch (err) {
    return sendError(res, `Gagal membuat tagihan: ${err.message}`, 500);
  }
};

/**
 * Admin: Update Tagihan Santri
 */
export const updateTagihanAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { santri_id, komponen_id, judul_tagihan, total_tagihan, sudah_dibayar, periode_bulan, jatuh_tempo, status } = req.body;

    const [existingRows] = await pool.query('SELECT * FROM keuangan_tagihan WHERE id = ?', [id]);
    if (!existingRows || existingRows.length === 0) {
      return sendError(res, 'Tagihan tidak ditemukan', 404);
    }
    const existing = existingRows[0];

    let kategori = existing.kategori;
    let namaKomponen = existing.judul_tagihan;
    if (komponen_id) {
      const [kompRows] = await pool.query('SELECT kategori, nama_komponen FROM keuangan_komponen_biaya WHERE id = ?', [komponen_id]);
      if (kompRows && kompRows.length > 0) {
        kategori = kompRows[0].kategori;
        namaKomponen = kompRows[0].nama_komponen;
      }
    }

    const total = total_tagihan !== undefined ? parseFloat(total_tagihan) : parseFloat(existing.total_tagihan);
    const dibayar = sudah_dibayar !== undefined ? parseFloat(sudah_dibayar) : parseFloat(existing.sudah_dibayar || 0);
    const sisa = Math.max(0, total - dibayar);
    const finalStatus = status || (sisa <= 0 ? 'Lunas' : dibayar > 0 ? 'Sebagian' : 'Belum Dibayar');

    await pool.query(`
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
      judul_tagihan || namaKomponen,
      kategori,
      periode_bulan !== undefined ? periode_bulan : existing.periode_bulan,
      total,
      dibayar,
      sisa,
      finalStatus,
      jatuh_tempo !== undefined ? (jatuh_tempo || null) : existing.jatuh_tempo,
      id
    ]);

    return sendSuccess(res, 'Tagihan berhasil diperbarui');
  } catch (err) {
    return sendError(res, `Gagal memperbarui tagihan: ${err.message}`, 500);
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

