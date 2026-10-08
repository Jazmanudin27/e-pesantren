import React from 'react';
import { BarChart3, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

export default function MobileLaporanPresensi() {
  const rekapBulan = [
    { kegiatan: 'Shalat Shubuh Berjamaah', totalSesi: 30, hadir: 29, telat: 1, ghaib: 0, persen: '96.7%' },
    { kegiatan: 'Halaqah Tahfidz Pagi', totalSesi: 30, hadir: 30, telat: 0, ghaib: 0, persen: '100%' },
    { kegiatan: 'Shalat Dzuhur Berjamaah', totalSesi: 30, hadir: 28, telat: 2, ghaib: 0, persen: '93.3%' },
    { kegiatan: 'Shalat Ashar Berjamaah', totalSesi: 30, hadir: 30, telat: 0, ghaib: 0, persen: '100%' },
    { kegiatan: 'Shalat Maghrib & Isya', totalSesi: 60, hadir: 59, telat: 1, ghaib: 0, persen: '98.3%' }
  ];

  return (
    <div style={{ padding: '16px' }}>

      {/* Card Rekap List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rekapBulan.map((r, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{r.kegiatan}</span>
              <span className="badge badge-success">{r.persen}</span>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: '0.76rem' }}>
              <div><div style={{ color: '#64748b' }}>Hadir</div><strong style={{ color: '#16a34a' }}>{r.hadir}</strong></div>
              <div><div style={{ color: '#64748b' }}>Telat</div><strong style={{ color: '#d97706' }}>{r.telat}</strong></div>
              <div><div style={{ color: '#64748b' }}>Ghaib</div><strong style={{ color: '#dc2626' }}>{r.ghaib}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
