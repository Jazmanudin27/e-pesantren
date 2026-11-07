import express from 'express';
import {
  getDaftarSekolah,
  getRincianBiayaSekolah,
  assignSantriSekolah
} from '../controllers/sekolah.controller.js';

const router = express.Router();

router.get('/', getDaftarSekolah);
router.get('/rincian-biaya', getRincianBiayaSekolah);
router.post('/assign-santri', assignSantriSekolah);

export default router;

