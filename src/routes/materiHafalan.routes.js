import express from 'express';
import {
  getMateriHafalan,
  createMateriHafalan,
  updateMateriHafalan,
  deleteMateriHafalan
} from '../controllers/materiHafalan.controller.js';

const router = express.Router();

router.get('/', getMateriHafalan);
router.post('/', createMateriHafalan);
router.put('/:id', updateMateriHafalan);
router.delete('/:id', deleteMateriHafalan);

export default router;
