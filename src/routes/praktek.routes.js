import express from 'express';
import {
  getPraktek,
  getPraktekById,
  createPraktek,
  updatePraktek,
  deletePraktek
} from '../controllers/praktek.controller.js';

const router = express.Router();

router.get('/', getPraktek);
router.get('/:id', getPraktekById);
router.post('/', createPraktek);
router.put('/:id', updatePraktek);
router.delete('/:id', deletePraktek);

export default router;
