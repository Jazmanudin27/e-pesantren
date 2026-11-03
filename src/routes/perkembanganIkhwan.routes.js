import express from 'express';
import {
  getMasterPerkembangan,
  createKategori,
  updateKategori,
  deleteKategori,
  createMasterItem,
  updateMasterItem,
  deleteMasterItem,
  getSantriIkhwanByKelas,
  saveEvaluasiBatch,
  getRekapEvaluasi,
  deleteEvaluasi
} from '../controllers/perkembanganIkhwan.controller.js';

const router = express.Router();

// Master Data & Kustomisasi
router.get('/master', getMasterPerkembangan);
router.post('/sync-master', async (req, res) => {
  try {
    const { initPerkembanganIkhwanDb } = await import('../config/initPerkembanganIkhwanDb.js');
    await initPerkembanganIkhwanDb();
    res.json({ success: true, message: 'Master perkembangan santri berhasil disinkronkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/kategori', createKategori);
router.put('/kategori/:id', updateKategori);
router.delete('/kategori/:id', deleteKategori);

router.post('/item', createMasterItem);
router.put('/item/:id', updateMasterItem);
router.delete('/item/:id', deleteMasterItem);

// Form Input Perkembangan Santri (Pilih Kategori & Kelas)
router.get('/santri-kelas', getSantriIkhwanByKelas);
router.post('/evaluasi-batch', saveEvaluasiBatch);
router.delete('/evaluasi/:id', deleteEvaluasi);

// Rekap & Riwayat Evaluasi
router.get('/rekap', getRekapEvaluasi);

export default router;

