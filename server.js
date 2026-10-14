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
    } catch (migErr) {
      console.warn('[E-PESANTREN SESI MIGRATE NOTICE]', migErr.message);
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
