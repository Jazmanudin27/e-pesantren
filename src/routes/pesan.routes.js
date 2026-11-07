import express from 'express';
import {
  getPesanWali,
  sendPesanFromWali,
  getAdminPesanThreads,
  getAdminPesanDetail,
  sendReplyFromAdmin
} from '../controllers/pesan.controller.js';

const router = express.Router();

// Endpoint Orang Tua / Wali Santri
router.get('/wali/:santri_id', getPesanWali);
router.post('/wali', sendPesanFromWali);

// Endpoint Admin Pesantren
router.get('/admin/threads', getAdminPesanThreads);
router.get('/admin/messages/:santri_id', getAdminPesanDetail);
router.post('/admin/reply', sendReplyFromAdmin);

export default router;

