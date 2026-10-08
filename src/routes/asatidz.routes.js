import express from 'express';
import { getAsatidz, createAsatidz, updateAsatidz, deleteAsatidz } from '../controllers/asatidz.controller.js';

const router = express.Router();

router.get('/', getAsatidz);
router.post('/', createAsatidz);
router.put('/:id', updateAsatidz);
router.delete('/:id', deleteAsatidz);

export default router;
