import express from 'express';
import { 
  getDashboardKeuanganWali, 
  buatTransaksiPembayaran, 
  batalkanTransaksiPembayaran,
  lanjutkanPembayaran,
  konfirmasiPembayaranBerhasil, 
  getKuitansiPembayaran,
  getRekapKeuanganAdmin,
  getHomeKeuanganSummary,
  getKasMasukSahList,
  getTunggakanSppBulananList,
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
  bersihkanFakeDataKeuangan,
  getSantriKasirSearch,
  getBukuKasAndKantong,
  createBukuKasEntry,
  updateBukuKasEntry,
  cairkanSaldoMidtransKeBank,
  deleteBukuKasEntry,
  batalTransaksiTunaiBukuKas,
  updateTransaksiTunaiBukuKas
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
router.get('/kasir/santri-search', getSantriKasirSearch);
router.get('/admin/santri-search', getSantriKasirSearch);
router.get('/wali/dashboard', getDashboardKeuanganWali);
router.get('/tagihan/:santriId', getDashboardKeuanganWali);
router.get('/santri/:santriId', getDashboardKeuanganWali);
router.post('/wali/bayar', buatTransaksiPembayaran);
router.post('/wali/lanjutkan', lanjutkanPembayaran);
router.post('/wali/batal', batalkanTransaksiPembayaran);
router.post('/wali/verifikasi', konfirmasiPembayaranBerhasil);
router.get('/wali/kuitansi', getKuitansiPembayaran);

// Endpoint Admin Desktop & Beranda Cepat
router.get('/admin/home-summary', getHomeKeuanganSummary);
router.get('/home-summary', getHomeKeuanganSummary);
router.get('/admin/kas-masuk-sah', getKasMasukSahList);
router.get('/kas-masuk-sah', getKasMasukSahList);
router.get('/admin/tunggakan-spp', getTunggakanSppBulananList);
router.get('/tunggakan-spp', getTunggakanSppBulananList);
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

// Endpoint 3 Kantong Saldo, Pencairan Midtrans & Buku Kas Operasional
router.get('/buku-kas', getBukuKasAndKantong);
router.get('/admin/buku-kas', getBukuKasAndKantong);
router.post('/buku-kas', createBukuKasEntry);
router.post('/admin/buku-kas', createBukuKasEntry);
router.put('/buku-kas/:id', updateBukuKasEntry);
router.put('/admin/buku-kas/:id', updateBukuKasEntry);
router.post('/cairkan-midtrans', cairkanSaldoMidtransKeBank);
router.post('/admin/cairkan-midtrans', cairkanSaldoMidtransKeBank);
router.delete('/buku-kas/:id', deleteBukuKasEntry);
router.delete('/admin/buku-kas/:id', deleteBukuKasEntry);
router.put('/transaksi-tunai/:id', updateTransaksiTunaiBukuKas);
router.put('/admin/transaksi-tunai/:id', updateTransaksiTunaiBukuKas);
router.delete('/transaksi-tunai/:id', batalTransaksiTunaiBukuKas);
router.delete('/admin/transaksi-tunai/:id', batalTransaksiTunaiBukuKas);

export default router;

