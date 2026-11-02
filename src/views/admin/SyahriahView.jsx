import React from 'react';
import { Wallet, CheckCircle, CreditCard, DollarSign, Download, Filter } from 'lucide-react';

export default function SyahriahView() {
  const invoiceList = [
    { no: 'INV-PSN-2610-001', santri: 'Ahmad Faiz Al-Hafidz', kamar: 'Ali / 04', pos: 'Syahriah & Uang Makan', nominal: 'Rp 650.000', terbayar: 'Rp 650.000', status: 'LUNAS', metode: 'Transfer VA BSI' },
    { no: 'INV-PSN-2610-002', santri: 'Zaidan Muhammad', kamar: 'Umar / 02', pos: 'Syahriah & Uang Makan', nominal: 'Rp 650.000', terbayar: 'Rp 650.000', status: 'LUNAS', metode: 'Tunai Kasir' },
    { no: 'INV-PSN-2610-003', santri: 'Muhammad Rifqi', kamar: 'Abu Bakar / 06', pos: 'Syahriah & Uang Makan', nominal: 'Rp 650.000', terbayar: 'Rp 0', status: 'BELUM BAYAR', metode: '-' },
    { no: 'INV-PSN-2610-004', santri: 'Aisyah Humaira', kamar: 'Khadijah (Non-Mukim)', pos: 'Syahriah Kalong & Kitab', nominal: 'Rp 300.000', terbayar: 'Rp 300.000', status: 'LUNAS', metode: 'QRIS' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Keuangan Syahriah & Kas Pesantren</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Kelola pembayaran SPP Syahriah santri, uang makan asrama, kitab, dan infaq jariyah.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline">
            <Download size={16} /> Export Laporan
          </button>
          <button className="btn btn-primary">
            <CreditCard size={16} /> Transaksi Kasir TU
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h4>Total Tagihan Bulan Ini</h4>
            <div className="stat-value">Rp 155.000.000</div>
            <div className="stat-sub">Periode Oktober 2026</div>
          </div>
          <div className="stat-icon icon-emerald"><DollarSign size={24} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h4>Penerimaan Syahriah Masuk</h4>
            <div className="stat-value" style={{ color: '#059669' }}>Rp 142.800.000</div>
            <div className="stat-sub" style={{ color: '#059669' }}>92.1% Terbayar</div>
          </div>
          <div className="stat-icon icon-blue"><Wallet size={24} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <h4>Tunggakan Syahriah</h4>
            <div className="stat-value" style={{ color: '#dc2626' }}>Rp 12.200.000</div>
            <div className="stat-sub" style={{ color: '#dc2626' }}>32 Santri</div>
          </div>
          <div className="stat-icon icon-amber"><Filter size={24} /></div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card">
        <div className="card-header">
          <h3>🧾 Daftar Tagihan & Status Pembayaran Santri</h3>
          <span className="badge badge-info">Bulan Oktober 2026</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Invoice</th>
              <th>Nama Santri & Kobong</th>
              <th>Komponen Biaya</th>
              <th>Nominal Tagihan</th>
              <th>Status</th>
              <th>Metode Bayar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoiceList.map((inv, i) => (
              <tr key={i}>
                <td><span style={{ fontWeight: 600, color: '#475569' }}>{inv.no}</span></td>
                <td>
                  <div style={{ fontWeight: 700 }}>{inv.santri}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{inv.kamar}</div>
                </td>
                <td>{inv.pos}</td>
                <td><strong>{inv.nominal}</strong></td>
                <td>
                  <span className={`badge ${inv.status === 'LUNAS' ? 'badge-success' : 'badge-danger'}`}>
                    {inv.status}
                  </span>
                </td>
                <td><span className="badge badge-info">{inv.metode}</span></td>
                <td>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                    Kwitansi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
