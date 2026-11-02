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
  getRekapEvaluasi
} from '../controllers/perkembanganIkhwan.controller.js';

const router = express.Router();

// Master Data & Kustomisasi
router.get('/master', getMasterPerkembangan);
router.post('/kategori', createKategori);
router.put('/kategori/:id', updateKategori);
router.delete('/kategori/:id', deleteKategori);

router.post('/item', createMasterItem);
router.put('/item/:id', updateMasterItem);
router.delete('/item/:id', deleteMasterItem);

// Form Input Perkembangan Santri (Pilih Kategori & Kelas)
router.get('/santri-kelas', getSantriIkhwanByKelas);
router.post('/evaluasi-batch', saveEvaluasiBatch);

// Rekap & Riwayat Evaluasi
router.get('/rekap', getRekapEvaluasi);

export default router;

