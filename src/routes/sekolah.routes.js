import express from 'express';
import {
  getDaftarSekolah,
  getRincianBiayaSekolah,
  tambahRincianBiayaSekolah,
  updateRincianBiayaSekolah,
  hapusRincianBiayaSekolah,
  assignSantriSekolah,
  generateTagihanAwalMasukSekolah
} from '../controllers/sekolah.controller.js';

const router = express.Router();

router.get('/', getDaftarSekolah);
router.get('/rincian-biaya', getRincianBiayaSekolah);
router.post('/rincian-biaya', tambahRincianBiayaSekolah);
router.put('/rincian-biaya/:id', updateRincianBiayaSekolah);
router.delete('/rincian-biaya/:id', hapusRincianBiayaSekolah);
router.post('/assign-santri', assignSantriSekolah);
router.post('/generate-tagihan-masuk', generateTagihanAwalMasukSekolah);

export default router;

