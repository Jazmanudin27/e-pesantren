import express from 'express';
import {
  getSettings,
  updateSettings,
  testSend,
  getTunggakanList,
  broadcastTagihan,
  getLogs
} from '../controllers/whatsapp.controller.js';

const router = express.Router();

router.get('/settings', getSettings);
router.post('/settings', updateSettings);
router.post('/test', testSend);
router.get('/tunggakan', getTunggakanList);
router.post('/broadcast-tagihan', broadcastTagihan);
router.get('/logs', getLogs);

export default router;

