import express from 'express';
import {
  getKurikulumMatriks,
  saveKurikulumMatriks,
  getJadwalMengajar,
  createJadwalMengajar,
  updateJadwalMengajar,
  deleteJadwalMengajar
} from '../controllers/kurikulum.controller.js';

const router = express.Router();

// Kurikulum Pengajian (Matriks Kelas 1 - 6)
router.get('/matriks', getKurikulumMatriks);
router.post('/matriks', saveKurikulumMatriks);

// Jadwal Mengajar Asatidz
router.get('/jadwal', getJadwalMengajar);
router.post('/jadwal', createJadwalMengajar);
router.put('/jadwal/:id', updateJadwalMengajar);
router.delete('/jadwal/:id', deleteJadwalMengajar);

export default router;

