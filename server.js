import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/routes/index.js';
import { ensureSantriCredentialsColumns } from './src/config/initWaliDb.js';
import { ensurePraktekTables } from './src/controllers/praktek.controller.js';
import { ensureAbsensiTablesAndColumns } from './src/controllers/absensi.controller.js';
import { ensureTabunganTables } from './src/controllers/tabungan.controller.js';
import { ensureNotifikasiTable } from './src/controllers/notifikasi.controller.js';
import { ensureInfakTables } from './src/controllers/infak.controller.js';
import { ensurePesanTable } from './src/controllers/pesan.controller.js';
import { ensureInformasiTable } from './src/controllers/informasiKegiatan.controller.js';
import { ensureWhatsAppTables } from './src/services/whatsapp.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5011;

// Global Middlewares
app.use(cors());
app.use(express.text({ type: ['text/*', 'application/octet-stream', 'text/plain'], limit: '10mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Build (Vite /dist) & Public PWA Assets first (agar /manifest.json & /sw.js tidak tertahan router)
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(distPath));
app.use(express.static(publicPath));

// REST API Router (E-Sekolah Architecture - Handles both /api and Nginx stripped paths)
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Fallback route for dynamic PWA icons before Service Worker claims the client
app.get(['/pwa-icon-192.png', '/pwa-icon-512.png', '/pwa-icon-maskable-512.png'], (req, res) => {
  res.sendFile(path.join(publicPath, 'nwf.png'));
});

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

// Start HTTP Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[E-PESANTREN] Server aktif & rapi di http://0.0.0.0:${PORT}`);
  try {
    await ensureSantriCredentialsColumns();
    await ensurePraktekTables();
    await ensureAbsensiTablesAndColumns();
    await ensureTabunganTables();
    await ensureNotifikasiTable();
    await ensureInfakTables();
    await ensurePesanTable();
    await ensureInformasiTable();
    await ensureWhatsAppTables();
  } catch (e) {
    console.warn('[E-PESANTREN] Init DB notice:', e.message);
  }
});

