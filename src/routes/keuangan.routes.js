import express from 'express';
import { 
  getDashboardKeuanganWali, 
  buatTransaksiPembayaran, 
  konfirmasiPembayaranBerhasil, 
  getKuitansiPembayaran,
  getRekapKeuanganAdmin,
  createTagihanAdmin,
  updateTagihanAdmin,
  deleteTagihanAdmin,
  createKomponenAdmin,
  updateKomponenAdmin,
  deleteKomponenAdmin,
  generateAutoTagihanAdmin,
  bayarTagihanLangsungAdmin,
  webhookBniHandler,
  webhookIpaymuHandler
} from '../controllers/keuangan.controller.js';

const router = express.Router();

// Webhook Resmi iPaymu Payment Callback (Live Production)
router.post('/webhook/ipaymu', webhookIpaymuHandler);
router.get('/webhook/ipaymu', webhookIpaymuHandler);

// Webhook Resmi BNI Direct API / Virtual Account Payment Callback
router.post('/webhook/bni', webhookBniHandler);
router.get('/webhook/bni', (req, res) => res.json({ status: '000', message: 'BNI Webhook Endpoint Ready' }));

// Endpoint Khusus Wali Santri (Mobile)
router.get('/wali/dashboard', getDashboardKeuanganWali);
router.post('/wali/bayar', buatTransaksiPembayaran);
router.post('/wali/verifikasi', konfirmasiPembayaranBerhasil);
router.get('/wali/kuitansi', getKuitansiPembayaran);

// Endpoint Admin Desktop
router.get('/admin/rekap', getRekapKeuanganAdmin);
router.post('/admin/tagihan', createTagihanAdmin);
router.put('/admin/tagihan/:id', updateTagihanAdmin);
router.delete('/admin/tagihan/:id', deleteTagihanAdmin);
router.post('/admin/generate-auto', generateAutoTagihanAdmin);
router.post('/admin/bayar-langsung', bayarTagihanLangsungAdmin);

// Endpoint Master Komponen Biaya
router.post('/admin/komponen', createKomponenAdmin);
router.put('/admin/komponen/:id', updateKomponenAdmin);
router.delete('/admin/komponen/:id', deleteKomponenAdmin);

export default router;

