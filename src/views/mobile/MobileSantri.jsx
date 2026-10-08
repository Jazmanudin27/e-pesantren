import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Phone, 
  Building, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function MobileSantri() {
  const [search, setSearch] = useState('');

  const santriData = [
    { id: 1, nama: 'Ahmad Faiz Al-Hafidz', nis: '2601001', asrama: 'Asrama Ali bin Abi Thalib', kamar: 'Kamar 04', status: 'Mukim', juz: 15, wali: 'H. Abdullah' },
    { id: 2, nama: 'Zaidan Muhammad', nis: '2601002', asrama: 'Asrama Umar bin Khattab', kamar: 'Kamar 01', status: 'Mukim', juz: 28, wali: 'Drs. Subagja' },
    { id: 3, nama: 'Fatimah Az-Zahra', nis: '2602001', asrama: 'Asrama Fathimah Az-Zahra', kamar: 'Kamar 01', status: 'Mukim', juz: 30, wali: 'H. Usman' },
    { id: 4, nama: 'Muhammad Rifqi', nis: '2601003', asrama: 'Asrama Ali bin Abi Thalib', kamar: 'Kamar 02', status: 'Mukim', juz: 5, wali: 'Bpk. Hendra' },
    { id: 5, nama: 'Aisyah Humaira', nis: '2602002', asrama: 'Asrama Fathimah Az-Zahra', kamar: 'Kamar 02', status: 'Kalong', juz: 3, wali: 'Hj. Rohmah' }
  ];

  const filtered = santriData.filter(s => 
    s.nama.toLowerCase().includes(search.toLowerCase()) || 
    s.nis.includes(search)
  );

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Data Santri */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(13, 148, 136, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#ccfbf1' }}>Database Direktori Santri</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Data Santri Pesantren</div>
        <div style={{ fontSize: '0.8rem', color: '#e6fffa' }}>Total 180 Santri Aktif Terdata</div>
      </div>

      {/* Input Search */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <input 
          type="text" 
          placeholder="Cari nama santri atau NIS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 38px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '0.82rem',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* List Card Santri */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((s) => (
          <div key={s.id} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{s.nama}</div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>NIS: {s.nis}</div>
              </div>
              <span className={`badge ${s.status === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                {s.status}
              </span>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#334155', margin: '8px 0', padding: '6px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
              <div>🏢 {s.asrama} ({s.kamar})</div>
              <div>📖 Capaian Tahfidz: <strong>{s.juz} Juz</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
              <span>Wali: {s.wali}</span>
              <span style={{ color: '#0d9488', fontWeight: 700 }}>Detail Santri →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
