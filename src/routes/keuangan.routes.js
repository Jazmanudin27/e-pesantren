import express from 'express';
import { 
  getDashboardKeuanganWali, 
  buatTransaksiPembayaran, 
  batalkanTransaksiPembayaran,
  lanjutkanPembayaran,
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
  cekStatusMidtransAdmin,
  webhookBniHandler,
  webhookIpaymuHandler,
  webhookMidtransHandler,
  getSiklusSpp,
  updateSiklusSpp,
  bersihkanFakeDataKeuangan
} from '../controllers/keuangan.controller.js';

const router = express.Router();

// Webhook Resmi Midtrans Payment Callback (Notification URL)
router.post('/webhook/midtrans', webhookMidtransHandler);
router.get('/webhook/midtrans', (req, res) => res.json({ status: 'OK', message: 'Midtrans Webhook Endpoint Ready' }));

// Webhook Resmi iPaymu Payment Callback (Live Production)
router.post('/webhook/ipaymu', webhookIpaymuHandler);
router.get('/webhook/ipaymu', webhookIpaymuHandler);

// Webhook Resmi BNI Direct API / Virtual Account Payment Callback
router.post('/webhook/bni', webhookBniHandler);
router.get('/webhook/bni', (req, res) => res.json({ status: '000', message: 'BNI Webhook Endpoint Ready' }));

// Endpoint Khusus Wali Santri (Mobile) & Kasir Tagihan
router.get('/wali/dashboard', getDashboardKeuanganWali);
router.get('/tagihan/:santriId', getDashboardKeuanganWali);
router.get('/santri/:santriId', getDashboardKeuanganWali);
router.post('/wali/bayar', buatTransaksiPembayaran);
router.post('/wali/lanjutkan', lanjutkanPembayaran);
router.post('/wali/batal', batalkanTransaksiPembayaran);
router.post('/wali/verifikasi', konfirmasiPembayaranBerhasil);
router.get('/wali/kuitansi', getKuitansiPembayaran);

// Endpoint Admin Desktop
router.get('/admin/rekap', getRekapKeuanganAdmin);
router.get('/rekap', getRekapKeuanganAdmin);
router.get('/siklus-spp', getSiklusSpp);
router.post('/siklus-spp', updateSiklusSpp);
router.get('/admin/siklus-spp', getSiklusSpp);
router.post('/admin/siklus-spp', updateSiklusSpp);
router.post('/admin/tagihan', createTagihanAdmin);
router.put('/admin/tagihan/:id', updateTagihanAdmin);
router.delete('/admin/tagihan/:id', deleteTagihanAdmin);
router.delete('/tagihan/:id', deleteTagihanAdmin);
router.post('/admin/generate-auto', generateAutoTagihanAdmin);
router.post('/admin/bayar-langsung', bayarTagihanLangsungAdmin);
router.post('/admin/cek-status-midtrans', cekStatusMidtransAdmin);
router.post('/admin/bersihkan-fake-data', bersihkanFakeDataKeuangan);

// Endpoint Master Komponen Biaya
router.post('/admin/komponen', createKomponenAdmin);
router.put('/admin/komponen/:id', updateKomponenAdmin);
router.delete('/admin/komponen/:id', deleteKomponenAdmin);

export default router;

