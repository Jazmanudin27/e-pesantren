import express from 'express';
import { 
  getMaintenanceStatus, 
  getAllMaintenanceSettings, 
  updateMaintenanceSetting 
} from '../controllers/maintenance.controller.js';

const router = express.Router();

// Public: Cek status maintenance tiap role untuk blocking frontend & routing
router.get('/status', getMaintenanceStatus);

// Admin: Ambil semua pengaturan detail maintenance
router.get('/settings', getAllMaintenanceSettings);

// Admin: Toggle atau update pesan maintenance per role
router.post('/toggle', updateMaintenanceSetting);
router.post('/settings', updateMaintenanceSetting);

export default router;
