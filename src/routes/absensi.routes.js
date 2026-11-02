import express from 'express';
import {
  getAbsensiFingerprint, createAbsensiFingerprint, updateAbsensiFingerprint, deleteAbsensiFingerprint,
  getFingerprintDevices, createFingerprintDevice, updateFingerprintDevice, deleteFingerprintDevice,
  getFingerprintSesi, createFingerprintSesi, updateFingerprintSesi, deleteFingerprintSesi
} from '../controllers/absensi.controller.js';

const router = express.Router();

router.get('/fingerprint', getAbsensiFingerprint);
router.post('/fingerprint', createAbsensiFingerprint);
router.put('/fingerprint/:id', updateAbsensiFingerprint);
router.delete('/fingerprint/:id', deleteAbsensiFingerprint);

router.get('/devices', getFingerprintDevices);
router.post('/devices', createFingerprintDevice);
router.put('/devices/:id', updateFingerprintDevice);
router.delete('/devices/:id', deleteFingerprintDevice);

router.get('/sesi', getFingerprintSesi);
router.post('/sesi', createFingerprintSesi);
router.put('/sesi/:id', updateFingerprintSesi);
router.delete('/sesi/:id', deleteFingerprintSesi);

export default router;
