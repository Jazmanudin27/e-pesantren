import express from 'express';
import { 
  getFeedInformasi, 
  createInformasi, 
  deleteInformasi 
} from '../controllers/informasiKegiatan.controller.js';

const router = express.Router();

// Endpoint Feed Publik & Wali Santri
router.get('/feed', getFeedInformasi);

// Endpoint Admin Desktop
router.post('/admin', createInformasi);
router.delete('/admin/:id', deleteInformasi);

export default router;

