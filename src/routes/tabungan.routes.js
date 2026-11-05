import express from 'express';
import {
  getTabunganList,
  getSantriTabunganDetail,
  tambahSaldoSantri,
  tarikSaldoSantri,
  batalTransaksiTabungan
} from '../controllers/tabungan.controller.js';

const router = express.Router();

// GET /api/tabungan - List semua tabungan & ringkasan
router.get('/', getTabunganList);

// GET /api/tabungan/santri/:id - Rincian tabungan & histori transaksi per santri
router.get('/santri/:id', getSantriTabunganDetail);

// POST /api/tabungan/setor - Penambahan saldo / Saldo Awal (Admin)
router.post('/setor', tambahSaldoSantri);

// POST /api/tabungan/tarik - Pengambilan saldo tabungan (Admin)
router.post('/tarik', tarikSaldoSantri);

// DELETE /api/tabungan/transaksi/:id - Pembatalan / rollback transaksi (Admin)
router.delete('/transaksi/:id', batalTransaksiTabungan);

export default router;

