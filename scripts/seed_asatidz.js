import pool from './src/config/database.js';

const MUSTAHIQ = [
  { nama: 'Iis F.S', jk: 'P' },
  { nama: 'Imas Masripah', jk: 'P' },
  { nama: 'Laelatul Fauziah', jk: 'P' },
  { nama: 'Fatia', jk: 'P' },
  { nama: 'Nurul', jk: 'P' },
  { nama: 'Siti Luthfiah', jk: 'P' },
  { nama: 'Indri Lesatari', jk: 'P' },
  { nama: 'Mr. Ardiana Firdaus', jk: 'L' },
  { nama: 'Najiyah F.N', jk: 'P' },
  { nama: 'Syahrul H', jk: 'L' },
  { nama: 'Hapid Usman', jk: 'L' },
  { nama: 'Asep Nasrulloh', jk: 'L' },
  { nama: 'M Hayatul Fauzi', jk: 'L' },
  { nama: 'Muqoddas M.S.I', jk: 'L' },
  { nama: 'M Raya Nizar', jk: 'L' },
  { nama: 'Rapin FN', jk: 'L' },
  { nama: 'Hilmi Nursyamsi', jk: 'L' },
  { nama: 'Rahwan', jk: 'L' },
  { nama: 'Tanzilurrohman', jk: 'L' },
  { nama: 'Isyam M Noor', jk: 'L' },
  { nama: 'Kanza S.M', jk: 'L' },
  { nama: 'Amin Ma`ruf', jk: 'L' },
  { nama: 'Wahyu Ramdhani', jk: 'L' },
  { nama: 'Sandi Nursya`ban', jk: 'L' },
  { nama: 'M Hikam M.H', jk: 'L' },
  { nama: 'M Busrol Karim', jk: 'L' },
  { nama: 'Lili Abdul Jalil', jk: 'L' }
];

const MUNAWWIB = [
  { nama: 'Fadilah', jk: 'P' },
  { nama: 'Neng Gina', jk: 'P' },
  { nama: 'Neng Nafis', jk: 'P' },
  { nama: 'Lia Farida', jk: 'P' },
  { nama: 'Reva', jk: 'P' },
  { nama: 'Rika', jk: 'P' },
  { nama: 'Yeyen', jk: 'P' },
  { nama: 'Imel', jk: 'P' },
  { nama: 'Siti Maryam', jk: 'P' },
  { nama: 'Syifa Q', jk: 'P' },
  { nama: 'Nafisa', jk: 'P' },
  { nama: 'Fatimah', jk: 'P' },
  { nama: 'Wardah', jk: 'P' },
  { nama: 'Regina', jk: 'P' },
  { nama: 'Dinar', jk: 'P' },
  { nama: 'Putri Marwah', jk: 'P' },
  { nama: 'Delia', jk: 'P' },
  { nama: 'Nurul Ba Hasna', jk: 'P' },
  { nama: 'Abdillah Azhar', jk: 'L' },
  { nama: 'Ilham Yasin', jk: 'L' },
  { nama: 'Ifham', jk: 'L' },
  { nama: 'Helmi Ali Akbar', jk: 'L' },
  { nama: 'Ragyad', jk: 'L' },
  { nama: 'Marzan', jk: 'L' },
  { nama: 'Habiburrahman', jk: 'L' },
  { nama: 'Akesa', jk: 'L' },
  { nama: 'M. Nizar', jk: 'L' },
  { nama: 'Fabregas', jk: 'L' },
  { nama: 'Abdul Kodir', jk: 'L' },
  { nama: 'Dede Maulana', jk: 'L' },
  { nama: 'M Fadly Ibrahim', jk: 'L' },
  { nama: 'Ridwannurulloh', jk: 'L' }
];

async function run() {
  try {
    // 1. Kolom
    try {
      await pool.query(`ALTER TABLE asatidz ADD COLUMN IF NOT EXISTS kategori_asatidz VARCHAR(50) DEFAULT 'Mustahiq' AFTER tugas_utama`);
    } catch (e) {}

    let totalInserted = 0;

    // Mustahiq
    for (let i = 0; i < MUSTAHIQ.length; i++) {
      const a = MUSTAHIQ[i];
      const gelar = a.nama.includes('M.S.I') ? 'M.S.I' : a.nama.includes('M.H') ? 'M.H' : a.jk === 'L' ? 'Ustadz' : 'Ustadzah';
      const niy = `MST-${String(i + 1).padStart(3, '0')}`;
      const [existing] = await pool.query('SELECT id FROM asatidz WHERE nama_asatidz = ?', [a.nama.trim()]);
      if (!existing || existing.length === 0) {
        await pool.query(`
          INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, kategori_asatidz, status)
          VALUES (?, ?, ?, ?, 'Mustahiq', 'Mustahiq', 'Aktif')
        `, [a.nama.trim(), gelar, niy, a.jk]);
        totalInserted++;
      }
    }

    // Munawwib
    for (let i = 0; i < MUNAWWIB.length; i++) {
      const a = MUNAWWIB[i];
      const gelar = a.jk === 'L' ? 'Ustadz' : 'Ustadzah';
      const niy = `MNW-${String(i + 1).padStart(3, '0')}`;
      const [existing] = await pool.query('SELECT id FROM asatidz WHERE nama_asatidz = ?', [a.nama.trim()]);
      if (!existing || existing.length === 0) {
        await pool.query(`
          INSERT INTO asatidz (nama_asatidz, gelar, nik_niy, jk, tugas_utama, kategori_asatidz, status)
          VALUES (?, ?, ?, ?, 'Munawwib', 'Munawwib', 'Aktif')
        `, [a.nama.trim(), gelar, niy, a.jk]);
        totalInserted++;
      }
    }

    console.log(`Sukses menambahkan ${totalInserted} data Asatidz (Mustahiq & Munawwib).`);
    process.exit(0);
  } catch (err) {
    console.error('Gagal:', err.message);
    process.exit(1);
  }
}

run();

