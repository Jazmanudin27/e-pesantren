import express from 'express';
import pool from '../config/database.js';
import { getAllSantri, createSantri, updateSantri, deleteSantri, importSantri } from '../controllers/santri.controller.js';

const router = express.Router();

router.get('/', getAllSantri);

// 1. Endpoint Cepat: Ambil semua santri yang memiliki face_descriptor di MySQL
router.get('/with-face', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(
      "SELECT id, nis, nama_santri, foto, face_descriptor FROM santri WHERE face_descriptor IS NOT NULL AND face_descriptor != ''"
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
        foto: r.foto,
        face_descriptor: desc,
        has_face: Array.isArray(desc) && desc.length === 128
      };
    });
    return res.json({ success: true, total: cleaned.length, data: cleaned });
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
    const { foto, foto_santri, descriptor, face_descriptor } = req.body;
    const finalFoto = foto || foto_santri || null;
    
    let rawDesc = face_descriptor || descriptor;
    let finalDescriptor = null;
    if (rawDesc) {
      finalDescriptor = typeof rawDesc === 'string' ? rawDesc : JSON.stringify(rawDesc);
    }

    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
    } catch (e) {}

    if (finalDescriptor !== null) {
      await pool.query("UPDATE santri SET foto = COALESCE(?, foto), face_descriptor = ? WHERE id = ?", [finalFoto, finalDescriptor, id]);
    } else {
      await pool.query("UPDATE santri SET foto = ? WHERE id = ?", [finalFoto, id]);
    }

    return res.json({ 
      success: true, 
      message: finalFoto ? 'Foto wajah & biometrik santri berhasil disimpan ke database' : 'Foto wajah santri berhasil dihapus' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});
router.post('/:id/face-descriptor', async (req, res) => {
  try {
    const { id } = req.params;
    const { face_descriptor, descriptor, foto } = req.body;
    const desc = face_descriptor || descriptor;
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
