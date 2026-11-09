import express from 'express';
import {
  getOwnerSummary,
  getOwnerKeuangan,
  getOwnerPresensi,
  getOwnerPerizinan,
  getOwnerSantri,
  getOwnerPerkembangan,
  getOwnerNotifikasi
} from '../controllers/owner.controller.js';

const router = express.Router();

// 1. Executive Summary High-Level KPIs
router.get('/summary', getOwnerSummary);

// 2. Notifikasi Realtime Arus Kas & Aktivitas Owner
router.get('/notifikasi', getOwnerNotifikasi);

// 2. Menu Laporan Keuangan (Kas Masuk, Transaksi, Tunggakan, Infak)
router.get('/keuangan', getOwnerKeuangan);

// 3. Menu Laporan Presensi (Berjamaah & Mengaji)
router.get('/presensi', getOwnerPresensi);

// 4. Menu Laporan Perizinan (Santri Izin & Disiplin)
router.get('/perizinan', getOwnerPerizinan);

// 5. Menu Laporan Data Santri & Sebaran Asrama
router.get('/santri', getOwnerSantri);

// 6. Menu Laporan Perkembangan Santri
router.get('/perkembangan', getOwnerPerkembangan);

export default router;

