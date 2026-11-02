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
    const { foto, foto_santri } = req.body;
    const finalFoto = foto || foto_santri || null;
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e) {}
    await pool.query("UPDATE santri SET foto = ? WHERE id = ?", [finalFoto, id]);
    return res.json({ 
      success: true, 
      message: finalFoto ? 'Foto wajah santri berhasil disimpan' : 'Foto wajah santri berhasil dihapus dari database' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});
router.put('/:id', updateSantri);
router.delete('/:id', deleteSantri);

export default router;
