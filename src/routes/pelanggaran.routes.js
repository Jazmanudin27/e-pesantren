import express from 'express';
import {
  getPelanggaran, createPelanggaran, updatePelanggaran,
  finishTazir, deletePelanggaran
} from '../controllers/pelanggaran.controller.js';

const router = express.Router();

router.get('/', getPelanggaran);
router.post('/', createPelanggaran);
router.put('/:id', updatePelanggaran);
router.post('/selesai/:id', finishTazir);
router.delete('/:id', deletePelanggaran);

export default router;
