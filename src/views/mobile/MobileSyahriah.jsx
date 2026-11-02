import React from 'react';
import { Wallet, CheckCircle2, CreditCard, ChevronRight, QrCode } from 'lucide-react';

export default function MobileSyahriah() {
  const tagihan = [
    { bulan: 'Oktober 2026', pos: 'Syahriah & Uang Makan', nominal: 'Rp 650.000', status: 'LUNAS', tglBayar: '02 Okt 2026' },
    { bulan: 'September 2026', pos: 'Syahriah & Uang Makan', nominal: 'Rp 650.000', status: 'LUNAS', tglBayar: '03 Sep 2026' },
    { bulan: 'Agustus 2026', pos: 'Uang Kitab & Atribut', nominal: 'Rp 450.000', status: 'LUNAS', tglBayar: '15 Agu 2026' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Saldo VA / Status Bulan Ini */}
      <div style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 8px 16px rgba(217, 119, 6, 0.25)'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#fef3c7' }}>Status Pembayaran Bulan Ini</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 6px' }}>Lunas (Oktober 2026)</div>
        <div style={{ fontSize: '0.82rem', color: '#fef3c7' }}>Tidak ada tunggakan pembayaran syahriah aktif.</div>
      </div>

      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px', color: '#0f172a' }}>
        💳 Riwayat Pembayaran Syahriah
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tagihan.map((t, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.bulan}</span>
              <span className="badge badge-success">{t.status}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>{t.pos}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.82rem' }}>
              <span style={{ fontWeight: 800, color: '#059669' }}>{t.nominal}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t.tglBayar}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}