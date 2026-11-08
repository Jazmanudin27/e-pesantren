import express from 'express';
import pool from '../config/database.js';
import { getAllSantri, createSantri, updateSantri, deleteSantri, importSantri } from '../controllers/santri.controller.js';

const router = express.Router();

router.get('/', getAllSantri);

// 1. Endpoint Cepat: Ambil semua santri yang memiliki face_descriptor di MySQL (Hanya Biometrik Vektor, Tanpa Base64 Foto)
router.get('/with-face', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(
      "SELECT id, nis, nama_santri, face_descriptor FROM santri WHERE face_descriptor IS NOT NULL AND face_descriptor != ''"
    );
    const cleaned = rows.map(r => {
      let desc = r.face_descriptor;
      if (typeof desc === 'string') {
        try { desc = JSON.parse(desc); } catch (e) {}
      }
      if (desc && typeof desc === 'string') {
        try { desc = JSON.parse(desc); } catch (e) {}
      }
      if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
        desc = Object.values(desc);
      }
      return {
        id: r.id,
        nis: r.nis,
        nama_santri: r.nama_santri,
        face_descriptor: desc,
        has_face: Array.isArray(desc) && desc.length === 128
      };
    });
    return res.json({ success: true, total: cleaned.length, data: cleaned });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Endpoint Super Ringan & Cepat untuk Halaman Daftar Wajah Mobile (Tanpa Base64 Raksasa)
router.get('/for-face-registration', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        s.nama_kelas, 
        s.kelas_id, 
        COALESCE(s.nama_asrama, a.nama_asrama, '') as nama_asrama, 
        CASE 
          WHEN (s.face_descriptor IS NOT NULL AND s.face_descriptor != '') OR (s.foto IS NOT NULL AND s.foto != '') THEN 1 
          ELSE 0 
        END AS has_face_descriptor
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      ORDER BY s.id ASC
    `);
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Endpoint Image Thumbnail Ringan & Ter-cache (Hanya kirim biner gambar saat card tampil di layar)
router.get('/:id/photo-thumb', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT foto FROM santri WHERE id = ?', [id]);
    if (!rows.length || !rows[0].foto) {
      return res.status(404).send('No photo');
    }
    const rawFoto = rows[0].foto;
    if (typeof rawFoto === 'string' && rawFoto.startsWith('data:image/')) {
      const parts = rawFoto.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const imgBuffer = Buffer.from(parts[1], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(imgBuffer);
    } else if (typeof rawFoto === 'string' && (rawFoto.startsWith('http://') || rawFoto.startsWith('https://'))) {
      return res.redirect(rawFoto);
    } else {
      return res.status(404).send('Invalid photo format');
    }
  } catch (err) {
    return res.status(500).send('Server error');
  }
});

// 1d. Endpoint Cepat & Ringan untuk Presensi Mobile (Tanpa Base64 Foto Raksasa, ~150 KB vs 50 MB)
router.get('/for-presensi', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        s.kelas_id, 
        s.nama_kelas, 
        s.asrama_id, 
        COALESCE(s.nama_asrama, a.nama_asrama, '') as nama_asrama,
        s.kamar_id,
        COALESCE(s.nama_kamar, k.nama_kamar, '') as nama_kamar,
        s.face_descriptor
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      ORDER BY s.id ASC
    `);
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Endpoint Cek Status Biometrik 1 Santri Tertentu
router.get('/:id/face-status', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, nis, nama_santri, foto, face_descriptor FROM santri WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan' });
    const r = rows[0];
    let desc = r.face_descriptor;
    if (typeof desc === 'string') {
      try { desc = JSON.parse(desc); } catch (e) {}
    }
    if (desc && typeof desc === 'string') {
      try { desc = JSON.parse(desc); } catch (e) {}
    }
    if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
      desc = Object.values(desc);
    }
    const hasDesc = Array.isArray(desc) && desc.length === 128;
    return res.json({
      success: true,
      santri: {
        id: r.id,
        nis: r.nis,
        nama_santri: r.nama_santri,
        foto: r.foto,
        has_face: hasDesc,
        face_descriptor: hasDesc ? desc : null,
        descriptor_length: desc ? (desc.length || Object.keys(desc).length) : 0
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/', createSantri);
router.post('/import', importSantri);
router.patch('/:id/foto', async (req, res) => {
  try {
    const { id } = req.params;
    const { foto, foto_santri, descriptor, face_descriptor, clear_face } = req.body;
    const finalFoto = foto !== undefined ? foto : (foto_santri !== undefined ? foto_santri : null);
    
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
    } catch (e) {}

    // Jika clear_face true atau foto dikirim null/kosong: hapus foto DAN biometrik sekaligus!
    if (clear_face || finalFoto === null || finalFoto === '') {
      await pool.query("UPDATE santri SET foto = NULL, face_descriptor = NULL WHERE id = ?", [id]);
      return res.json({ 
        success: true, 
        message: 'Foto wajah dan biometrik santri berhasil dihapus dari database' 
      });
    }

    let rawDesc = face_descriptor || descriptor;
    let finalDescriptor = null;
    if (rawDesc) {
      finalDescriptor = typeof rawDesc === 'string' ? rawDesc : JSON.stringify(rawDesc);
    }

    if (finalDescriptor !== null) {
      await pool.query("UPDATE santri SET foto = COALESCE(?, foto), face_descriptor = ? WHERE id = ?", [finalFoto, finalDescriptor, id]);
    } else {
      await pool.query("UPDATE santri SET foto = ? WHERE id = ?", [finalFoto, id]);
    }

    return res.json({ 
      success: true, 
      message: 'Foto wajah & biometrik santri berhasil disimpan ke database' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

// Endpoint Spesifik: Hapus Biometrik & Foto Wajah Santri
const deleteFaceHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE santri SET face_descriptor = NULL, foto = NULL WHERE id = ?", [id]);
    return res.json({ 
      success: true, 
      message: `Data biometrik & foto wajah santri ID ${id} berhasil dihapus dari database` 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.delete('/:id/face-descriptor', deleteFaceHandler);
router.delete('/:id/foto', deleteFaceHandler);
router.delete('/:id/face', deleteFaceHandler);

router.post('/:id/face-descriptor', async (req, res) => {
  try {
    const { id } = req.params;
    const { face_descriptor, descriptor, foto } = req.body;
    const desc = face_descriptor || descriptor;
    if (!desc && (!foto || foto === null)) {
      await pool.query("UPDATE santri SET face_descriptor = NULL, foto = NULL WHERE id = ?", [id]);
      return res.json({ success: true, message: 'Biometrik dan foto wajah berhasil dihapus' });
    }
    const strDesc = typeof desc === 'string' ? desc : JSON.stringify(desc);
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
    } catch (e) {}
    if (foto) {
      await pool.query("UPDATE santri SET face_descriptor = ?, foto = COALESCE(?, foto) WHERE id = ?", [strDesc, foto, id]);
    } else {
      await pool.query("UPDATE santri SET face_descriptor = ? WHERE id = ?", [strDesc, id]);
    }
    const [rows] = await pool.query("SELECT id, nama_santri, nis, face_descriptor FROM santri WHERE id = ?", [id]);
    return res.json({ 
      success: true, 
      message: `Biometrik wajah santri ID ${id} (${rows[0]?.nama_santri || 'Santri'}) berhasil disimpan di database MySQL`, 
      santri: rows[0] 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.put('/:id', updateSantri);
router.delete('/:id', deleteSantri);

export default router;
