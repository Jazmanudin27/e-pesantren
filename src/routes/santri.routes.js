import express from 'express';
import { getAllSantri, createSantri, updateSantri, deleteSantri } from '../controllers/santri.controller.js';

const router = express.Router();

router.get('/', getAllSantri);
router.post('/', createSantri);
router.put('/:id', updateSantri);
router.delete('/:id', deleteSantri);

export default router;
