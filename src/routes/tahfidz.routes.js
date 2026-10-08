import express from 'express';
import {
  getHalaqah, createHalaqah, updateHalaqah, deleteHalaqah,
  getSetoran, createSetoran, updateSetoran, deleteSetoran
} from '../controllers/tahfidz.controller.js';

const router = express.Router();

router.get('/halaqah', getHalaqah);
router.post('/halaqah', createHalaqah);
router.put('/halaqah/:id', updateHalaqah);
router.delete('/halaqah/:id', deleteHalaqah);

router.get('/setoran', getSetoran);
router.post('/setoran', createSetoran);
router.put('/setoran/:id', updateSetoran);
router.delete('/setoran/:id', deleteSetoran);

export default router;
