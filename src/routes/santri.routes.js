import express from 'express';
import pool from '../config/database.js';
import { getAllSantri, createSantri, updateSantri, deleteSantri, importSantri } from '../controllers/santri.controller.js';

const router = express.Router();

router.get('/', getAllSantri);
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
router.put('/:id', updateSantri);
router.delete('/:id', deleteSantri);

export default router;
