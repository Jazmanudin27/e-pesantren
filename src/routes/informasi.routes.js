import express from 'express';
import { 
  getFeedInformasi, 
  createInformasi, 
  updateInformasi,
  deleteInformasi 
} from '../controllers/informasiKegiatan.controller.js';

const router = express.Router();

// Endpoint Feed Publik & Wali Santri
router.get('/feed', getFeedInformasi);

// Endpoint Admin Desktop & Mobile
router.post('/admin', createInformasi);
router.put('/admin/:id', updateInformasi);
router.delete('/admin/:id', deleteInformasi);

export default router;
