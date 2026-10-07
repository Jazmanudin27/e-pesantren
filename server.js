import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5011;

app.use(cors());
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'pesantren',
  password: process.env.DB_PASSWORD || 'Jazman@271998',
  database: process.env.DB_NAME || 'pesantren',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Connection
pool.getConnection()
  .then((conn) => {
    console.log(`[DB] Terhubung ke MySQL database: ${process.env.DB_NAME || 'pesantren'}`);
    conn.release();
  })
  .catch((err) => {
    console.error('[DB Error] Gagal koneksi ke database:', err.message);
  });

// -------------------------------------------------------------
// API ENDPOINTS (DATA DARI DATABASE)
// -------------------------------------------------------------

// 1. Health check & profil pesantren
app.get('/api/pesantren/profil', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pesantren_profil LIMIT 1');
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Dashboard Stats & Recent Data
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [[{ total_santri }]] = await pool.query("SELECT COUNT(*) as total_santri FROM santri WHERE status = 'Aktif'");
    const [[{ total_halaqah }]] = await pool.query("SELECT COUNT(*) as total_halaqah FROM tahfidz_halaqah WHERE is_active = 1");
    const [[{ total_izin_aktif }]] = await pool.query("SELECT COUNT(*) as total_izin_aktif FROM santri_perizinan WHERE status = 'Aktif Keluar'");
    const [[{ avg_juz }]] = await pool.query("SELECT AVG(capaian_hafalan_juz) as avg_juz FROM santri WHERE status = 'Aktif'");

    // Setoran terbaru
    const [recentSetoran] = await pool.query(`
      SELECT ts.id, ts.tanggal, ts.juz, ts.surat_mulai, ts.ayat_mulai, ts.surat_selesai, ts.ayat_selesai, 
             ts.kualitas_tajwid, ts.status, ts.created_at,
             s.nama_santri, a.nama_asrama, k.nama_kamar, ast.nama_asatidz
      FROM tahfidz_setoran ts
      JOIN santri s ON ts.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN asatidz ast ON ts.asatidz_id = ast.id
      ORDER BY ts.tanggal DESC, ts.id DESC
      LIMIT 5
    `);

    // Perizinan aktif
    const [activeIzin] = await pool.query(`
      SELECT sp.id, sp.kode_izin, sp.barcode, sp.jenis_izin, sp.tgl_keluar_rencana, sp.tgl_kembali_rencana,
             sp.nama_penjemput_mahrom, sp.keperluan, sp.status,
             s.nama_santri, a.nama_asrama, k.nama_kamar
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY sp.id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      stats: {
        total_santri,
        total_halaqah,
        total_izin_aktif,
        avg_juz: parseFloat(avg_juz || 0).toFixed(1)
      },
      recentSetoran,
      activeIzin
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Data Santri
app.get('/api/santri', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, a.nama_asrama, a.gender as asrama_gender, k.nama_kamar
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY s.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Data Tahfidz & Halaqah
app.get('/api/tahfidz/halaqah', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, ast.nama_asatidz,
             (SELECT COUNT(*) FROM tahfidz_halaqah_santri hs WHERE hs.halaqah_id = h.id) as total_santri
      FROM tahfidz_halaqah h
      LEFT JOIN asatidz ast ON h.asatidz_id = ast.id
      ORDER BY h.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/tahfidz/setoran', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ts.*, s.nama_santri, s.nis, a.nama_asrama, k.nama_kamar, ast.nama_asatidz
      FROM tahfidz_setoran ts
      JOIN santri s ON ts.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN asatidz ast ON ts.asatidz_id = ast.id
      ORDER BY ts.tanggal DESC, ts.id DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Data Perizinan Santri
app.get('/api/perizinan', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sp.*, s.nama_santri, s.nis, a.nama_asrama, k.nama_kamar
      FROM santri_perizinan sp
      JOIN santri s ON sp.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY sp.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Check-in santri perizinan
app.post('/api/perizinan/checkin', async (req, res) => {
  try {
    const { id, satpam } = req.body;
    await pool.query(`
      UPDATE santri_perizinan 
      SET status = 'Kembali Tepat Waktu', tgl_kembali_aktual = NOW(), satpam_kembali = ?
      WHERE id = ?
    `, [satpam || 'Petugas Gerbang', id]);
    res.json({ success: true, message: 'Santri berhasil check-in kembali ke pesantren' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Data Absensi Fingerprint Shalat & Mengaji
app.get('/api/absensi-fingerprint', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT aj.*, s.nama_santri, s.nis, s.fingerprint_pin, a.nama_asrama, k.nama_kamar,
             ks.nama_sesi, ks.kategori, fd.nama_device
      FROM absensi_jamaah_mengaji aj
      JOIN santri s ON aj.santri_id = s.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      JOIN kegiatan_sesi ks ON aj.sesi_id = ks.id
      LEFT JOIN fingerprint_device fd ON aj.device_id = fd.id
      ORDER BY aj.tanggal DESC, aj.waktu_scan DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Data Master Mesin Fingerprint & Sesi Kegiatan
app.get('/api/fingerprint/devices', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM fingerprint_device ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fingerprint/sesi', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kegiatan_sesi ORDER BY jam_mulai_presensi ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Data Asatidz / Musyrif
app.get('/api/asatidz', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM asatidz ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// SERVE STATIC PRODUCTION BUILD (Vite /dist)
// -------------------------------------------------------------
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[E-PESANTREN] Server aktif di http://0.0.0.0:${PORT}`);
});
