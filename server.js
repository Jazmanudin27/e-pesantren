import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/routes/index.js';

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

import pool from './src/config/database.js';
import bcrypt from 'bcryptjs';

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

    const defaultHash = bcrypt.hashSync('12345', 10);
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

  } catch (err) {
    console.warn('[E-PESANTREN AUTO-MIGRATE NOTICE]', err.message);
  }
}

// Start HTTP Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[E-PESANTREN] Server aktif & rapi di http://0.0.0.0:${PORT}`);
  autoMigrateDatabase();
});
