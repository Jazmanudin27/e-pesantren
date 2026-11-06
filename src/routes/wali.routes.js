import express from 'express';
import { getWaliSantriData, updateWaliPassword } from '../controllers/wali.controller.js';
import {
  getWaliNotifikasi,
  markWaliNotifikasiRead,
  clearWaliNotifikasi
} from '../controllers/notifikasi.controller.js';

const router = express.Router();

// Endpoint monitoring orang tua / wali santri
router.get('/santri', getWaliSantriData);
router.get('/dashboard', getWaliSantriData);
router.put('/password', updateWaliPassword);

// Endpoint Notifikasi Real-time Wali Santri (Push & In-App)
router.get('/notifikasi', getWaliNotifikasi);
router.put('/notifikasi/read', markWaliNotifikasiRead);
router.delete('/notifikasi/clear', clearWaliNotifikasi);

export default router;
