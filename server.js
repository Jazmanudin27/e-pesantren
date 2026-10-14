import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/routes/index.js';
import pool from './src/config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5011;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Router (E-Sekolah Architecture - Handles both /api and Nginx stripped paths)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Serve Static Frontend Build (Vite /dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[E-PESANTREN SERVER ERROR]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    message: err.message || 'Internal Server Error'
  });
});

// Auto-migrate database table columns
async function autoMigrateDatabase() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM `asatidz` LIKE 'username'");
    if (!cols || cols.length === 0) {
      console.log('[E-PESANTREN] Migrasi database: menambah kolom username & password ke tabel asatidz...');
      await pool.query(`
        ALTER TABLE \`asatidz\`
        ADD COLUMN \`username\` VARCHAR(100) NULL AFTER \`nama_asatidz\`,
        ADD COLUMN \`password\` VARCHAR(255) NULL AFTER \`username\`
      `);
      console.log('[E-PESANTREN] Sukses menambah kolom username & password di tabel asatidz!');
    }

    const defaultHash = '$2y$10$E468yHLUZBwtBS7lZe5o3..jCD6UO1NdkCkQi1SaN5lUnjANLlD9m';
    await pool.query(`
      UPDATE \`asatidz\` 
      SET \`username\` = 'hamdan', \`password\` = ? 
      WHERE \`id\` = 1 AND (\`username\` IS NULL OR \`username\` = '')
    `, [defaultHash]).catch(() => {});

    await pool.query(`
      UPDATE \`asatidz\` 
      SET \`username\` = 'huda', \`password\` = ? 
      WHERE \`id\` = 2 AND (\`username\` IS NULL OR \`username\` = '')
    `, [defaultHash]).catch(() => {});

    await pool.query(`
      UPDATE \`asatidz\` 
      SET \`username\` = 'salma', \`password\` = ? 
      WHERE \`id\` = 3 AND (\`username\` IS NULL OR \`username\` = '')
    `, [defaultHash]).catch(() => {});

    // Auto-migrate kegiatan_sesi table and columns
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`kegiatan_sesi\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`kode_sesi\` VARCHAR(60) NOT NULL UNIQUE,
          \`nama_sesi\` VARCHAR(150) NOT NULL,
          \`kategori\` VARCHAR(100) NOT NULL DEFAULT 'Shalat Berjamaah',
          \`jam_mulai_presensi\` TIME NOT NULL,
          \`jam_target\` TIME NOT NULL,
          \`jam_toleransi_telat\` TIME NOT NULL,
          \`jam_tutup_presensi\` TIME NOT NULL,
          \`hari_aktif\` VARCHAR(255) DEFAULT 'Setiap Hari',
          \`tipe_peserta\` VARCHAR(50) DEFAULT 'Wajib Semua Santri',
          \`target_gender\` VARCHAR(20) DEFAULT 'Semua',
          \`target_tipe_santri\` VARCHAR(20) DEFAULT 'Semua',
          \`peserta_santri_ids\` LONGTEXT NULL,
          \`keterangan\` TEXT NULL,
          \`is_active\` TINYINT(1) DEFAULT 1,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});

      const [sesiCols] = await pool.query("SHOW COLUMNS FROM `kegiatan_sesi` LIKE 'tipe_peserta'");
      if (!sesiCols || sesiCols.length === 0) {
        console.log('[E-PESANTREN] Migrasi database: menambah kolom tipe_peserta & peserta_santri_ids ke kegiatan_sesi...');
        await pool.query(`
          ALTER TABLE \`kegiatan_sesi\`
          ADD COLUMN \`tipe_peserta\` VARCHAR(50) DEFAULT 'Wajib Semua Santri' AFTER \`hari_aktif\`,
          ADD COLUMN \`target_gender\` VARCHAR(20) DEFAULT 'Semua' AFTER \`tipe_peserta\`,
          ADD COLUMN \`target_tipe_santri\` VARCHAR(20) DEFAULT 'Semua' AFTER \`target_gender\`,
          ADD COLUMN \`peserta_santri_ids\` LONGTEXT NULL AFTER \`target_tipe_santri\`,
          ADD COLUMN \`keterangan\` TEXT NULL AFTER \`peserta_santri_ids\`
        `);
        console.log('[E-PESANTREN] Sukses migrasi kolom kegiatan_sesi!');
      }

      // Pastikan data kegiatan terisi dari database (jika masih kosong, isi template resmi pondok)
      const [existingSesi] = await pool.query("SELECT COUNT(*) AS total FROM `kegiatan_sesi`");
      if (existingSesi[0]?.total === 0) {
        console.log('[E-PESANTREN] Inisialisasi data master sesi kegiatan dari database...');
        await pool.query(`
          INSERT INTO \`kegiatan_sesi\` (\`id\`, \`kode_sesi\`, \`nama_sesi\`, \`kategori\`, \`jam_mulai_presensi\`, \`jam_target\`, \`jam_toleransi_telat\`, \`jam_tutup_presensi\`, \`hari_aktif\`, \`tipe_peserta\`) VALUES
          (1, 'SHALAT-SHUBUH', 'Shalat Shubuh Berjamaah', 'Shalat Berjamaah', '04:15:00', '04:40:00', '04:45:00', '05:15:00', 'Setiap Hari', 'Wajib Semua Santri'),
          (2, 'NGAJI-PAGI', 'Mengaji Qur\\'an / Halaqah Pagi', 'Halaqah Qur\\'an', '05:15:00', '05:30:00', '05:40:00', '06:30:00', 'Setiap Hari', 'Santri Tertentu / Terpilih'),
          (3, 'SHALAT-DZUHUR', 'Shalat Dzuhur Berjamaah', 'Shalat Berjamaah', '11:45:00', '12:05:00', '12:15:00', '12:45:00', 'Setiap Hari', 'Wajib Semua Santri'),
          (4, 'SHALAT-ASHAR', 'Shalat Ashar Berjamaah', 'Shalat Berjamaah', '15:00:00', '15:20:00', '15:30:00', '16:00:00', 'Setiap Hari', 'Wajib Semua Santri'),
          (5, 'NGAJI-SORE', 'Kajian Kitab / Mengaji Sore', 'Pengajian / Taklim', '16:00:00', '16:15:00', '16:25:00', '17:30:00', 'Setiap Hari', 'Santri Tertentu / Terpilih'),
          (6, 'SHALAT-MAGHRIB', 'Shalat Maghrib Berjamaah', 'Shalat Berjamaah', '17:45:00', '18:00:00', '18:10:00', '18:35:00', 'Setiap Hari', 'Wajib Semua Santri'),
          (7, 'NGAJI-MALAM', 'Mudzakarah / Mengaji Malam', 'Pengajian / Taklim', '18:35:00', '18:45:00', '18:55:00', '19:15:00', 'Setiap Hari', 'Santri Tertentu / Terpilih'),
          (8, 'SHALAT-ISYA', 'Shalat Isya Berjamaah', 'Shalat Berjamaah', '19:15:00', '19:30:00', '19:40:00', '20:15:00', 'Setiap Hari', 'Wajib Semua Santri')
          ON DUPLICATE KEY UPDATE \`nama_sesi\` = VALUES(\`nama_sesi\`);
        `);
      }
    } catch (sesiErr) {
      console.warn('[E-PESANTREN SESI MIGRATE NOTICE]', sesiErr.message);
    }

    // Auto-migrate users table & default admin
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(150) NOT NULL,
          \`username\` VARCHAR(100) NOT NULL UNIQUE,
          \`email\` VARCHAR(150) NOT NULL,
          \`password\` VARCHAR(255) NOT NULL,
          \`role\` ENUM('Super Admin', 'Pengasuh', 'Ustadz', 'Musyrif', 'Keamanan', 'Wali Santri') NOT NULL DEFAULT 'Super Admin',
          \`status\` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
          \`phone\` VARCHAR(30) NULL DEFAULT '-',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_users_role\` (\`role\`),
          INDEX \`idx_users_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});

      const [userPhoneCol] = await pool.query("SHOW COLUMNS FROM `users` LIKE 'phone'");
      if (!userPhoneCol || userPhoneCol.length === 0) {
        await pool.query("ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(30) NULL DEFAULT '-' AFTER `status`").catch(() => {});
      }

      const [existingUsers] = await pool.query("SELECT COUNT(*) AS total FROM `users`");
      if (existingUsers[0]?.total === 0) {
        console.log('[E-PESANTREN] Inisialisasi akun pengguna default di tabel users...');
        const adminPassHash = '$2a$10$tZlhQYwY8.G9lqO4hU47h.18uRfZL/L7jYwXG3rZ7O6E09lZ9jS4G'; // 12345
        await pool.query(`
          INSERT INTO \`users\` (\`id\`, \`name\`, \`username\`, \`email\`, \`password\`, \`role\`, \`status\`, \`phone\`) VALUES
          (1, 'Administrator Ponpes', 'admin', 'admin@nurulwafa.sch.id', ?, 'Super Admin', 'Active', '081288881111'),
          (2, 'KH. M. Syukron Ma\\'mun', 'pengasuh', 'pengasuh@nurulwafa.sch.id', ?, 'Pengasuh', 'Active', '081288882222'),
          (3, 'Ust. Hamdan S.Pd.I', 'hamdan', 'hamdan@nurulwafa.sch.id', ?, 'Ustadz', 'Active', '081399993333'),
          (4, 'Ust. M. Huda Al-Hafidz', 'huda', 'huda@nurulwafa.sch.id', ?, 'Musyrif', 'Active', '085788884444')
          ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
        `, [adminPassHash, adminPassHash, adminPassHash, adminPassHash]).catch(() => {});
        console.log('[E-PESANTREN] Sukses membuat akun pengguna default (admin / 12345)!');
      }
    } catch (userMigErr) {
      console.warn('[E-PESANTREN USERS MIGRATE NOTICE]', userMigErr.message);
    }

    // Auto-migrate kategori_praktek table & seed
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`kategori_praktek\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`nama_kategori\` VARCHAR(100) NOT NULL UNIQUE,
          \`deskripsi\` VARCHAR(255) NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});

      const [existingKat] = await pool.query("SELECT COUNT(*) AS total FROM \`kategori_praktek\`").catch(() => [[{ total: 0 }]]);
      if (existingKat[0]?.total === 0) {
        await pool.query(`
          INSERT INTO \`kategori_praktek\` (\`nama_kategori\`, \`deskripsi\`) VALUES
          ('Sholat Fardhu', 'Praktek kaifiyah dan bacaan sholat lima waktu'),
          ('Wudhu & Tayammum', 'Tata cara bersuci wudhu dan tayammum sunnah'),
          ('Sholat Jenazah', 'Praktek tata cara sholat jenazah 4 takbir'),
          ('Adzan & Iqomah', 'Keterampilan adzan, tarhim dan iqomah'),
          ('Dzikir & Doa', 'Wirid ba\\'da sholat fardhu dan doa harian'),
          ('Mandi Wajib', 'Rukun dan niat thaharah mandi junub'),
          ('Khutbah & Ceramah', 'Kultum, ceramah dan rukun khutbah Jum\\'at')
          ON DUPLICATE KEY UPDATE \`nama_kategori\` = VALUES(\`nama_kategori\`);
        `).catch(() => {});
      }
    } catch (katErr) {
      console.warn('[E-PESANTREN KATEGORI PRAKTEK MIGRATE NOTICE]', katErr.message);
    }

    // Auto-migrate praktek_ibadah table & seed
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`praktek_ibadah\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`santri_id\` INT NOT NULL,
          \`kategori\` VARCHAR(100) NOT NULL DEFAULT 'Sholat Fardhu',
          \`nama_praktek\` VARCHAR(150) NOT NULL,
          \`deskripsi\` TEXT NULL,
          \`nilai_gerakan\` INT DEFAULT 85,
          \`nilai_bacaan\` INT DEFAULT 85,
          \`nilai_adab\` INT DEFAULT 85,
          \`nilai_akhir\` INT DEFAULT 85,
          \`predikat\` VARCHAR(50) NOT NULL DEFAULT 'Mumtaz (A)',
          \`status\` VARCHAR(50) NOT NULL DEFAULT 'Lulus',
          \`penguji_asatidz_id\` INT NULL,
          \`nama_penguji\` VARCHAR(150) DEFAULT 'Ust. Hamdan S.Pd.I',
          \`catatan_perbaikan\` TEXT NULL,
          \`tanggal_ujian\` DATE NOT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX \`idx_praktek_santri\` (\`santri_id\`),
          INDEX \`idx_praktek_kategori\` (\`kategori\`),
          INDEX \`idx_praktek_status\` (\`status\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `).catch(() => {});

      // Pastikan kolom deskripsi ada jika tabel sudah terlanjur dibuat sebelumnya
      const [colDeskripsi] = await pool.query("SHOW COLUMNS FROM `praktek_ibadah` LIKE 'deskripsi'").catch(() => [[]]);
      if (!colDeskripsi || colDeskripsi.length === 0) {
        await pool.query("ALTER TABLE `praktek_ibadah` ADD COLUMN `deskripsi` TEXT NULL AFTER `nama_praktek`").catch(() => {});
      }

      const [existingPraktek] = await pool.query("SELECT COUNT(*) AS total FROM \`praktek_ibadah\`");
      if (existingPraktek[0]?.total === 0) {
        console.log('[E-PESANTREN] Inisialisasi data master praktek ibadah santri...');
        await pool.query(`
          INSERT INTO \`praktek_ibadah\` (
            \`id\`, \`santri_id\`, \`kategori\`, \`nama_praktek\`, \`deskripsi\`, \`nilai_gerakan\`, \`nilai_bacaan\`, \`nilai_adab\`, \`nilai_akhir\`, \`predikat\`, \`status\`, \`nama_penguji\`, \`catatan_perbaikan\`, \`tanggal_ujian\`
          ) VALUES
          (1, 1, 'Sholat Fardhu', 'Praktek Sholat Shubuh + Qunut', 'Ujian kesempurnaan rukun dan bacaan sholat shubuh beserta qunut subuh.', 95, 96, 92, 94, 'Mumtaz (A)', 'Lulus', 'Ust. Hamdan S.Pd.I', 'Makhraj huruf fashih, gerakan ruku dan sujud sempurna sesuai sunnah.', CURDATE()),
          (2, 1, 'Wudhu & Tayammum', 'Praktek Wudhu Sempurna & Doa', 'Ujian rukun wudhu, doa sebelum dan sesudah wudhu.', 90, 92, 90, 91, 'Mumtaz (A)', 'Lulus', 'Ust. Hamdan S.Pd.I', 'Rukun dan sunnah wudhu terlaksana tertib.', CURDATE()),
          (3, 2, 'Sholat Fardhu', 'Praktek Sholat Maghrib & Dzikir Ba\\'da Sholat', 'Ujian praktek sholat maghrib dan wirid dzikir lisan.', 88, 85, 87, 87, 'Jayyid Jiddan (B+)', 'Lulus', 'Ust. M. Huda Al-Hafidz', 'Tuma\\'ninah ruku perlu sedikit diperpanjang.', CURDATE()),
          (4, 3, 'Sholat Jenazah', 'Praktek Sholat Jenazah (4 Takbir)', 'Praktek lengkap sholat jenazah takbir 1 s.d 4.', 92, 90, 94, 92, 'Mumtaz (A)', 'Lulus', 'Usth. Salma M.Pd', 'Hafalan doa takbir ke-3 dan ke-4 sangat lancar.', CURDATE()),
          (5, 4, 'Wudhu & Tayammum', 'Praktek Wudhu & Thaharah', 'Praktek basuhan tertib wudhu sesuai fiqih.', 65, 60, 62, 62, 'Maqbul (C)', 'Mengulang', 'Ust. Hamdan S.Pd.I', 'Basuhan kedua telinga dan tertib rukun belum sempurna, mengulang pekan depan.', CURDATE()),
          (6, 5, 'Adzan & Iqomah', 'Praktek Adzan Shubuh & Tarhim', 'Praktek lafadz tartil adzan shubuh.', 86, 88, 85, 86, 'Jayyid Jiddan (B+)', 'Lulus', 'Ust. M. Huda Al-Hafidz', 'Vokal lantang, tajwid lafadz adzan benar.', CURDATE())
          ON DUPLICATE KEY UPDATE \`nama_praktek\` = VALUES(\`nama_praktek\`);
        `).catch(() => {});
      }
    } catch (praktekMigErr) {
      console.warn('[E-PESANTREN PRAKTEK MIGRATE NOTICE]', praktekMigErr.message);
    }


    // Auto-migrate tahfidz_setoran kolom materi & capaian hafalan (Al-Qur'an, Jurumiah, dll)
    try {
      const [hafalanCols] = await pool.query("SHOW COLUMNS FROM `tahfidz_setoran` LIKE 'materi_hafalan'").catch(() => [[]]);
      if (!hafalanCols || hafalanCols.length === 0) {
        console.log('[E-PESANTREN] Migrasi database: menambah kolom materi_hafalan, capaian_hafalan, nilai_kelancaran ke tahfidz_setoran...');
        await pool.query(`
          ALTER TABLE \`tahfidz_setoran\`
          ADD COLUMN \`materi_hafalan\` VARCHAR(150) DEFAULT 'Al-Qur\\'an' AFTER \`tanggal\`,
          ADD COLUMN \`capaian_hafalan\` VARCHAR(255) NULL AFTER \`materi_hafalan\`,
          ADD COLUMN \`nilai_kelancaran\` VARCHAR(50) DEFAULT 'Mumtaz (A)' AFTER \`capaian_hafalan\`
        `).catch(() => {});
      }
    } catch (hafalanErr) {
      console.warn('[E-PESANTREN HAFALAN MIGRATE NOTICE]', hafalanErr.message);
    }

  } catch (err) {
    console.warn('[E-PESANTREN AUTO-MIGRATE NOTICE]', err.message);
  }
}

// Start HTTP Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[E-PESANTREN] Server aktif & rapi di http://0.0.0.0:${PORT}`);
  autoMigrateDatabase();
});
