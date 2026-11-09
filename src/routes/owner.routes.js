import express from 'express';
import {
  getOwnerSummary,
  getOwnerKeuangan,
  getOwnerPresensi,
  getOwnerPerizinan,
  getOwnerSantri
} from '../controllers/owner.controller.js';

const router = express.Router();

// 1. Executive Summary High-Level KPIs
router.get('/summary', getOwnerSummary);

// 2. Menu Laporan Keuangan (Kas Masuk, Transaksi, Tunggakan, Infak)
router.get('/keuangan', getOwnerKeuangan);

// 3. Menu Laporan Presensi (Berjamaah & Mengaji)
router.get('/presensi', getOwnerPresensi);

// 4. Menu Laporan Perizinan (Santri Izin & Disiplin)
router.get('/perizinan', getOwnerPerizinan);

// 5. Menu Laporan Demografi Santri & Rombel Kelas
router.get('/santri', getOwnerSantri);

export default router;

