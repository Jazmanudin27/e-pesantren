import express from 'express';
import {
  handleAdmsHandshake,
  handleAdmsPushData,
  handleAdmsGetRequest,
  handleAdmsDeviceCmd,
  handleAdmsRegistry,
  handleAdmsPing,
  queuePushSantriToDevice,
  getAdmsQueueStatus
} from '../controllers/adms.controller.js';

const router = express.Router();

// 1. Handshake & Ambil Opsi Mesin
router.get('/cdata', handleAdmsHandshake);

// 2. Menerima Push Data Log Absensi Real-time dari Mesin
router.post('/cdata', handleAdmsPushData);

// 3. Polling Perintah Mesin
router.get('/getrequest', handleAdmsGetRequest);

// 4. Konfirmasi Eksekusi Perintah
router.post('/devicecmd', handleAdmsDeviceCmd);

// 5. Registrasi Mesin
router.get('/registry', handleAdmsRegistry);

// 6. Ping / Status Koneksi
router.get('/ping', handleAdmsPing);
router.post('/ping', handleAdmsPing);

// 7. REST API Admin: Kirim data nama & NIS santri ke mesin
router.post('/sync-santri', queuePushSantriToDevice);
router.get('/queue-status', getAdmsQueueStatus);

export default router;

