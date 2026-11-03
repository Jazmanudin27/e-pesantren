import pool from '../src/config/database.js';
import { initPerkembanganIkhwanDb } from '../src/config/initPerkembanganIkhwanDb.js';

async function main() {
  console.log('--- Memulai Sinkronisasi Master Perkembangan Santri Putri (Akhwat) ---');
  try {
    const success = await initPerkembanganIkhwanDb();
    if (success) {
      const [kat] = await pool.query("SELECT id, nama_kategori, gender FROM perkembangan_kategori WHERE gender = 'P' ORDER BY urutan ASC, id ASC");
      console.log(`Berhasil! Ditemukan ${kat.length} kategori perkembangan putri:`);
      for (const k of kat) {
        const [items] = await pool.query("SELECT tipe, count(*) as c FROM perkembangan_master_item WHERE kategori_id = ? GROUP BY tipe", [k.id]);
        const counts = items.map(it => `${it.tipe}: ${it.c}`).join(', ');
        console.log(`- [${k.id}] ${k.nama_kategori} (${counts})`);
      }
    } else {
      console.error('Gagal menjalankan sinkronisasi master perkembangan.');
    }
  } catch (err) {
    console.error('Error saat sinkronisasi:', err.message);
  } finally {
    process.exit(0);
  }
}

main();

