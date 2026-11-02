import express from 'express';
import { 
  getLaporanWali, 
  getAllLaporanAdmin, 
  createLaporanAdmin, 
  updateLaporanAdmin,
  deleteLaporanAdmin 
} from '../controllers/laporanPerkembangan.controller.js';

const router = express.Router();

// Endpoint Khusus Wali Santri (Mobile)
router.get('/wali', getLaporanWali);

// Endpoint Admin Desktop
router.get('/admin', getAllLaporanAdmin);
router.post('/admin', createLaporanAdmin);
router.put('/admin/:id', updateLaporanAdmin);
router.delete('/admin/:id', deleteLaporanAdmin);

export default router;

