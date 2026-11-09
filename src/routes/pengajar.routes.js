import express from 'express';
import {
  getPengajarDashboard,
  getPengajarSantri,
  getSesiMengajiList,
  getAbsenMengaji,
  saveAbsenMengajiBatch,
  getAbsenMengajiHistory,
  getTeguranList,
  createTeguran,
  updateStatusTazir,
  getPraktekList,
  savePraktek,
  getPerkembanganList,
  savePerkembangan
} from '../controllers/pengajar.controller.js';

const router = express.Router();

// 1. Dashboard Utama Pengajar
router.get('/dashboard', getPengajarDashboard);

// 2. Daftar Santri untuk Seleksi
router.get('/santri', getPengajarSantri);

// 2b. Daftar Sesi Kegiatan Mengaji & Kitab Kuning
router.get('/sesi-mengaji', getSesiMengajiList);

// 3. Absen Mengaji
router.get('/absen-mengaji', getAbsenMengaji);
router.post('/absen-mengaji', saveAbsenMengajiBatch);
router.get('/absen-mengaji/history', getAbsenMengajiHistory);

// 4. Teguran & Ta'zir Santri
router.get('/teguran', getTeguranList);
router.post('/teguran', createTeguran);
router.put('/teguran/:id/status', updateStatusTazir);

// 5. Evaluasi Praktek Ibadah
router.get('/praktek', getPraktekList);
router.post('/praktek', savePraktek);

// 6. Laporan Perkembangan Santri
router.get('/perkembangan', getPerkembanganList);
router.post('/perkembangan', savePerkembangan);

export default router;

