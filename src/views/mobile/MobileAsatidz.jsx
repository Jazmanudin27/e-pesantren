import React from 'react';
import { Users, Phone, Mail, Award, GraduationCap } from 'lucide-react';

export default function MobileAsatidz() {
  const asatidzList = [
    { id: 1, nama: 'K.H. Abdullah Gymnastiar', gelar: 'Lc., M.Ag.', nik: 'AST-2021-001', tugas: 'Pimpinan & Pengasuh Utama', keahlian: 'Tafsir & Akhlak Tasawuf', hp: '08122334455' },
    { id: 2, nama: 'Ust. Ahmad Fauzi', gelar: 'S.Pd.I, Al-Hafidz', nik: 'AST-2022-004', tugas: 'Kepala Bagian Tahfidz', keahlian: 'Tahfidz 30 Juz & Qiraat', hp: '081344556677' },
    { id: 3, nama: 'Ust. Hamdan', gelar: 'S.Th.I, Al-Hafidz', nik: 'AS-2026-001', tugas: 'Musyrif Tahfidz Ikhwan', keahlian: 'Tahfidz & Tajwid', hp: '081299990001' },
    { id: 4, nama: 'Usth. Sarah Humaira', gelar: 'S.Th.I, Al-Hafidzah', nik: 'AST-2022-009', tugas: 'Koordinator Tahfidz Putri', keahlian: 'Tahfidz 30 Juz & Jazariyah', hp: '081299887766' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Asatidz */}
      <div style={{
        background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(147, 51, 234, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#f3e8ff' }}>Dewan Guru & Pengasuh</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Data Asatidz & Musyrif</div>
        <div style={{ fontSize: '0.8rem', color: '#faf5ff' }}>12 Ustadz & Musyrif Terdaftar</div>
      </div>

      {/* List Asatidz Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {asatidzList.map((a) => (
          <div key={a.id} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>{a.nama} {a.gelar}</div>
                <div style={{ fontSize: '0.74rem', color: '#9333ea', fontWeight: 700 }}>NIY: {a.nik}</div>
              </div>
              <span className="badge badge-purple">Aktif</span>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#334155', margin: '8px 0', padding: '8px', background: '#faf5ff', borderRadius: '10px' }}>
              <div>📋 <strong>Tugas:</strong> {a.tugas}</div>
              <div>📖 <strong>Bidang:</strong> {a.keahlian}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748b' }}>
              <span>📞 {a.hp}</span>
              <span style={{ color: '#9333ea', fontWeight: 700 }}>Kontak WA →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
