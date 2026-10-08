import express from 'express';
import {
  getPerizinan, createPerizinan, updatePerizinan, deletePerizinan,
  checkoutPerizinan, checkinPerizinan
} from '../controllers/perizinan.controller.js';

const router = express.Router();

router.get('/', getPerizinan);
router.post('/', createPerizinan);
router.put('/:id', updatePerizinan);
router.delete('/:id', deletePerizinan);

router.post('/checkout', checkoutPerizinan);
router.post('/checkin', checkinPerizinan);

export default router;
