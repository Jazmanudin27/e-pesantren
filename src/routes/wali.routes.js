import express from 'express';
import { getWaliSantriData, updateWaliPassword } from '../controllers/wali.controller.js';

const router = express.Router();

// Endpoint monitoring orang tua / wali santri
router.get('/santri', getWaliSantriData);
router.get('/dashboard', getWaliSantriData);
router.put('/password', updateWaliPassword);

export default router;
