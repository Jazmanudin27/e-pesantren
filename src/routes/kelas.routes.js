import express from 'express';
import { getKelas, createKelas, updateKelas, deleteKelas } from '../controllers/kelas.controller.js';

const router = express.Router();

router.get('/', getKelas);
router.post('/', createKelas);
router.put('/:id', updateKelas);
router.delete('/:id', deleteKelas);

export default router;
