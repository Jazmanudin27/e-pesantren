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

// REST API Router (E-Sekolah Architecture)
app.use('/api', apiRoutes);

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

// Start HTTP Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[E-PESANTREN] Server aktif & rapi di http://0.0.0.0:${PORT}`);
});
