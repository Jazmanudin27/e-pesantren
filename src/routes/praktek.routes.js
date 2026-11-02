import express from 'express';
import {
  getPraktek,
  getPraktekById,
  createPraktek,
  updatePraktek,
  deletePraktek,
  getKategoriPraktek,
  createKategoriPraktek,
  updateKategoriPraktek,
  deleteKategoriPraktek
} from '../controllers/praktek.controller.js';

const router = express.Router();

// Master Kategori Praktek
router.get('/kategori', getKategoriPraktek);
router.post('/kategori', createKategoriPraktek);
router.put('/kategori/:id', updateKategoriPraktek);
router.delete('/kategori/:id', deleteKategoriPraktek);

// Penilaian Praktek Ibadah
router.get('/', getPraktek);
router.get('/:id', getPraktekById);
router.post('/', createPraktek);
router.put('/:id', updatePraktek);
router.delete('/:id', deletePraktek);

export default router;
