import React from 'react';
import { GraduationCap, Users, Clock, BookOpen } from 'lucide-react';

export default function MobileKelas() {
  const halaqahList = [
    { id: 1, nama: "Halaqah Imam Nafi' (Putra)", pengampu: 'Ust. Hamdan S.Th.I', target: 'Saba\' / Sabqi (Juz 15-20)', waktu: 'Ba\'da Shubuh & Maghrib', total: 12, gender: 'Ikhwan' },
    { id: 2, nama: "Halaqah Imam Ashim (Putra)", pengampu: 'Ust. Nurul Huda', target: 'Muroja\'ah Mutqin (Juz 25-30)', waktu: 'Ba\'da Shubuh & Ashar', total: 15, gender: 'Ikhwan' },
    { id: 3, nama: "Halaqah Fathimah (Putri)", pengampu: 'Usth. Salma M.Pd', target: 'Ziyadah Juz 1-5 & Mutaba\'ah', waktu: 'Ba\'da Shubuh & Isya', total: 12, gender: 'Akhwat' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Kelas */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(8, 145, 178, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#cffaff' }}>Kelompok Mengaji & Diniyah</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Halaqah Tahfidz & Kelas</div>
        <div style={{ fontSize: '0.8rem', color: '#ecfeff' }}>6 Kelompok Halaqah Active</div>
      </div>

      {/* List Halaqah Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {halaqahList.map((h) => (
          <div key={h.id} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className={`badge ${h.gender === 'Ikhwan' ? 'badge-info' : 'badge-purple'}`}>{h.gender}</span>
              <span style={{ fontSize: '0.74rem', color: '#0891b2', fontWeight: 700 }}>👥 {h.total} Santri</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>{h.nama}</div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginBottom: '8px' }}>Pengampu: {h.pengampu}</div>

            <div style={{ fontSize: '0.76rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>🎯 <strong>Target:</strong> {h.target}</div>
              <div>⏰ <strong>Jadwal:</strong> {h.waktu}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
