import express from 'express';
import {
  getProgramInfak,
  createProgramInfak,
  deleteProgramInfak,
  getInfakWaliData,
  createInfakPayment,
  confirmInfakPayment,
  getLaporanInfakAdmin,
  deleteTransaksiInfak
} from '../controllers/infak.controller.js';

const router = express.Router();

// Program Infak
router.get('/program', getProgramInfak);
router.post('/program', createProgramInfak);
router.delete('/program/:id', deleteProgramInfak);

// Portal Orang Tua (Wali Santri)
router.get('/santri/:santri_id', getInfakWaliData);
router.post('/create-payment', createInfakPayment);
router.post('/confirm-payment', confirmInfakPayment);

// Laporan Admin
router.get('/laporan', getLaporanInfakAdmin);
router.delete('/transaksi/:id', deleteTransaksiInfak);

export default router;

