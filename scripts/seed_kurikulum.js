import pool from '../src/config/database.js';
import { initKurikulumTable } from '../src/controllers/kurikulum.controller.js';

async function runSeedKurikulum() {
  console.log('--- SEEDING KURIKULUM PENGAJIAN KE DATABASE ---');
  try {
    await initKurikulumTable();

    const [rows] = await pool.query('SELECT COUNT(*) as total FROM kurikulum_pengajian');
    console.log(`[✓] Berhasil! Total ${rows[0]?.total} mata pelajaran / kitab kurikulum sudah tersimpan di tabel "kurikulum_pengajian".`);

    // Tampilkan sampel isi
    const [sample] = await pool.query(`
      SELECT tingkat_kelas, urutan, nama_kitab 
      FROM kurikulum_pengajian 
      ORDER BY urutan ASC, tingkat_kelas ASC 
      LIMIT 12
    `);
    console.log('\nSampel Data Kurikulum:');
    console.table(sample);

    process.exit(0);
  } catch (err) {
    console.error('Gagal seed kurikulum:', err);
    process.exit(1);
  }
}

runSeedKurikulum();

