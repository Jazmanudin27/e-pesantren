import express from 'express';
import {
  getSantriwatiHaidList,
  startHaid,
  stopHaid,
  getHaidHistory,
  deleteHaidRecord
} from '../controllers/haid.controller.js';

const router = express.Router();

// 1. Ambil daftar santriwati + status haid saat ini & KPI
router.get('/santriwati', getSantriwatiHaidList);

// 2. Mulai status haid
router.post('/mulai', startHaid);

// 3. Selesaikan status haid (manual suci)
router.post('/selesai', stopHaid);

// 4. Riwayat siklus haid
router.get('/riwayat', getHaidHistory);

// 5. Hapus record haid
router.delete('/:id', deleteHaidRecord);

export default router;

