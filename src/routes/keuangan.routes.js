import express from 'express';
import { 
  getDashboardKeuanganWali, 
  buatTransaksiPembayaran, 
  konfirmasiPembayaranBerhasil, 
  getKuitansiPembayaran,
  getRekapKeuanganAdmin,
  createTagihanAdmin
} from '../controllers/keuangan.controller.js';

const router = express.Router();

// Endpoint Khusus Wali Santri (Mobile)
router.get('/wali/dashboard', getDashboardKeuanganWali);
router.post('/wali/bayar', buatTransaksiPembayaran);
router.post('/wali/verifikasi', konfirmasiPembayaranBerhasil);
router.get('/wali/kuitansi', getKuitansiPembayaran);

// Endpoint Admin Desktop
router.get('/admin/rekap', getRekapKeuanganAdmin);
router.post('/admin/tagihan', createTagihanAdmin);

export default router;

