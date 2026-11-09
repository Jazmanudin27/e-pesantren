import pool from './database.js';

let isIndexesOptimized = false;

/**
 * Helper membuat Index MySQL jika belum ada di database
 */
const addIndexIfNotExists = async (table, indexName, columns) => {
  try {
    const [rows] = await pool.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND INDEX_NAME = ? 
      LIMIT 1
    `, [table, indexName]);

    if (!rows || rows.length === 0) {
      await pool.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
      console.log(`[DB SPEED OPTIMIZATION] Index dibuat: ${table}.${indexName}`);
    }
  } catch (err) {
    // Abaikan jika tabel atau kolom belum dibuat
  }
};

/**
 * Mengoptimalkan seluruh tabel MySQL dengan Indexing agar query besar tidak lemot
 */
export const ensureDatabaseIndexes = async () => {
  if (isIndexesOptimized) return;
  try {
    // 1. TABEL PRESENSI (absensi_jamaah_mengaji) - Sering ditarik ribuan baris
    await addIndexIfNotExists('absensi_jamaah_mengaji', 'idx_ajm_tgl_status', '`tanggal`, `status`');
    await addIndexIfNotExists('absensi_jamaah_mengaji', 'idx_ajm_santri_tgl', '`santri_id`, `tanggal`');
    await addIndexIfNotExists('absensi_jamaah_mengaji', 'idx_ajm_tipe_tgl', '`tipe_presensi`, `tanggal`');
    await addIndexIfNotExists('absensi_jamaah_mengaji', 'idx_ajm_sesi_tgl', '`sesi_id`, `tanggal`');
    await addIndexIfNotExists('absensi_jamaah_mengaji', 'idx_ajm_kegiatan', '`nama_kegiatan`');

    // 2. TABEL TRANSAKSI KEUANGAN KAS (keuangan_transaksi_pembayaran)
    await addIndexIfNotExists('keuangan_transaksi_pembayaran', 'idx_ktp_status_tgl', '`status_pembayaran`, `tanggal_bayar`');
    await addIndexIfNotExists('keuangan_transaksi_pembayaran', 'idx_ktp_santri', '`santri_id`');
    await addIndexIfNotExists('keuangan_transaksi_pembayaran', 'idx_ktp_nomor', '`nomor_transaksi`');
    await addIndexIfNotExists('keuangan_transaksi_pembayaran', 'idx_ktp_metode', '`metode_pembayaran`');

    // 3. TABEL TAGIHAN SPP & KEUANGAN (keuangan_tagihan)
    await addIndexIfNotExists('keuangan_tagihan', 'idx_kt_santri_status', '`santri_id`, `status`');
    await addIndexIfNotExists('keuangan_tagihan', 'idx_kt_status_sisa', '`status`, `sisa_tagihan`');
    await addIndexIfNotExists('keuangan_tagihan', 'idx_kt_kategori_tempo', '`kategori`, `jatuh_tempo`');

    // 4. TABEL DETAIL TRANSAKSI
    await addIndexIfNotExists('keuangan_transaksi_detail', 'idx_ktd_transaksi', '`transaksi_id`');
    await addIndexIfNotExists('keuangan_transaksi_detail', 'idx_ktd_tagihan', '`tagihan_id`');

    // 5. TABEL INFAK & WAKAF (pesantren_infak_transaksi)
    await addIndexIfNotExists('pesantren_infak_transaksi', 'idx_pit_status_tgl', '`status`, `tanggal`');
    await addIndexIfNotExists('pesantren_infak_transaksi', 'idx_pit_program', '`program_id`');

    // 6. TABEL SANTRI
    await addIndexIfNotExists('santri', 'idx_santri_status', '`status`');
    await addIndexIfNotExists('santri', 'idx_santri_nama', '`nama_santri`');
    await addIndexIfNotExists('santri', 'idx_santri_nis', '`nis`');
    await addIndexIfNotExists('santri', 'idx_santri_nisn', '`nisn`');
    await addIndexIfNotExists('santri', 'idx_santri_kelas', '`kelas_id`');
    await addIndexIfNotExists('santri', 'idx_santri_asrama', '`asrama_id`');
    await addIndexIfNotExists('santri', 'idx_santri_kamar', '`kamar_id`');
    await addIndexIfNotExists('santri', 'idx_santri_gender', '`jenis_kelamin`');

    // 7. TABEL PERIZINAN SANTRI (santri_perizinan)
    await addIndexIfNotExists('santri_perizinan', 'idx_sp_status', '`status`');
    await addIndexIfNotExists('santri_perizinan', 'idx_sp_santri_status', '`santri_id`, `status`');
    await addIndexIfNotExists('santri_perizinan', 'idx_sp_tgl_kembali', '`tgl_kembali_rencana`');
    await addIndexIfNotExists('santri_perizinan', 'idx_sp_tgl_keluar', '`tgl_keluar_rencana`');

    // 8. TABEL LAPORAN PERKEMBANGAN (santri_laporan_perkembangan)
    await addIndexIfNotExists('santri_laporan_perkembangan', 'idx_slp_santri_pub', '`santri_id`, `status_publikasi`');
    await addIndexIfNotExists('santri_laporan_perkembangan', 'idx_slp_tgl', '`tanggal_laporan`');
    await addIndexIfNotExists('santri_laporan_perkembangan', 'idx_slp_periode', '`periode`');

    // 9. TABEL PELANGGARAN & TATA TERTIB (santri_pelanggaran)
    await addIndexIfNotExists('santri_pelanggaran', 'idx_spl_santri', '`santri_id`');
    await addIndexIfNotExists('santri_pelanggaran', 'idx_spl_tgl', '`tanggal`');
    await addIndexIfNotExists('santri_pelanggaran', 'idx_spl_status', '`status`');

    // 10. TABEL BUKU TABUNGAN SANTRI
    await addIndexIfNotExists('tabungan_transaksi', 'idx_tt_santri_tgl', '`santri_id`, `tanggal`');
    await addIndexIfNotExists('buku_tabungan_santri', 'idx_bts_santri', '`santri_id`');

    // 11. TABEL USERS & OTENTIKASI
    await addIndexIfNotExists('users', 'idx_users_user_role', '`username`, `role`');
    await addIndexIfNotExists('users', 'idx_users_role_status', '`role`, `status`');

    // 12. TABEL PERANGKAT MESIN (fingerprint_device)
    await addIndexIfNotExists('fingerprint_device', 'idx_fd_status', '`status_koneksi`');
    await addIndexIfNotExists('fingerprint_device', 'idx_fd_sn', '`sn_device`');

    isIndexesOptimized = true;
    console.log('[DB SPEED OPTIMIZATION] Seluruh Index MySQL Pesantren Berhasil Diperiksa & Dioptimasi');
  } catch (err) {
    console.warn('[DB SPEED OPTIMIZATION NOTICE]', err.message);
  }
};

