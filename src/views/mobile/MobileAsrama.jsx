import React from 'react';
import { Building, Users, Home, ShieldCheck } from 'lucide-react';

export default function MobileAsrama() {
  const asramaList = [
    { id: 1, nama: 'Asrama Ali bin Abi Thalib', gender: 'Ikhwan', pembina: 'Ust. Hamdan S.Th.I', kamarCount: 6, santriCount: 68, terisi: '85%' },
    { id: 2, nama: 'Asrama Umar bin Khattab', gender: 'Ikhwan', pembina: 'Ust. Nurul Huda', kamarCount: 6, santriCount: 62, terisi: '78%' },
    { id: 3, nama: 'Asrama Fathimah Az-Zahra', gender: 'Akhwat', pembina: 'Usth. Salma M.Pd', kamarCount: 5, santriCount: 50, terisi: '100%' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Asrama */}
      <div style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(217, 119, 6, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#fef3c7' }}>Gedung & Kamar Kobong</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Data Asrama Santri</div>
        <div style={{ fontSize: '0.8rem', color: '#fffbeb' }}>4 Blok Gedung • 17 Kamar Kobong</div>
      </div>

      {/* List Asrama Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {asramaList.map((a) => (
          <div key={a.id} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className={`badge ${a.gender === 'Ikhwan' ? 'badge-info' : 'badge-purple'}`}>{a.gender}</span>
              <span style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 700 }}>Terisi: {a.terisi}</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>{a.nama}</div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px' }}>Pembina: <strong>{a.pembina}</strong></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem' }}>
              <span>🏢 {a.kamarCount} Kamar Kobong</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>👥 {a.santriCount} Santri</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
