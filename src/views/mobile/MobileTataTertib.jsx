import React from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function MobileTataTertib() {
  const pelanggaranList = [
    { tgl: '04 Okt 2026', jenis: 'Terlambat Berjamaah', poin: 5, tazir: 'Membaca Juz 30 di Depan Asrama', status: 'Sudah Dikerjakan' },
    { tgl: '28 Sep 2026', jenis: 'Lupa Membawa Kartu Santri', poin: 2, tazir: 'Pembersihan Area Wudhu', status: 'Sudah Dikerjakan' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Tata Tertib */}
      <div style={{
        background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(190, 18, 60, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#fecdd3' }}>Biro Kedisiplinan & Keamanan</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Tata Tertib & Ta'zir</div>
        <div style={{ fontSize: '0.8rem', color: '#ffe4e6' }}>Total Poin Pelanggaran: <strong>7 Poin (Kategori Ringan)</strong></div>
      </div>

      {/* Status Kedisiplinan */}
      <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>Status Disiplin Baik</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tidak ada hukuman / ta'zir aktif berproses.</div>
        </div>
      </div>

      {/* Riwayat Pelanggaran Card */}
      <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '10px', color: '#0f172a' }}>
        📋 Catatan Pelanggaran & Ta'zir
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pelanggaranList.map((p, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.tgl}</span>
              <span className="badge badge-danger">+{p.poin} Poin</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{p.jenis}</div>
            <div style={{ fontSize: '0.76rem', color: '#be123c', background: '#fff1f2', padding: '8px', borderRadius: '8px', marginTop: '8px' }}>
              ⚖️ <strong>Ta'zir:</strong> {p.tazir} ({p.status})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
