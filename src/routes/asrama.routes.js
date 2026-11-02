import express from 'express';
import { getAsramaAndKamar, createAsrama, createKamar, updateKamar, deleteKamar } from '../controllers/asrama.controller.js';

const router = express.Router();

router.get('/asrama', getAsramaAndKamar);
router.post('/asrama', createAsrama);

router.post('/kamar', createKamar);
router.put('/kamar/:id', updateKamar);
router.delete('/kamar/:id', deleteKamar);

export default router;
