import React from 'react';
import { FileText, Award, Sparkles, BookOpen } from 'lucide-react';

export default function MobileLaporanTahfidz() {
  const tasmiLogs = [
    { tgl: '01 Okt 2026', jenis: 'Tasmi\' 5 Juz Sekali Duduk', juz: 'Juz 11 - 15', ustadz: 'Ust. Hamdan S.Th.I', nilai: 'Mumtaz (A)', predikat: 'Lulus Sanad' },
    { tgl: '15 Sep 2026', jenis: 'Tasmi\' 5 Juz Sekali Duduk', juz: 'Juz 6 - 10', ustadz: 'Ust. Nurul Huda', nilai: 'Mumtaz (A)', predikat: 'Lulus Sanad' },
    { tgl: '01 Agu 2026', jenis: 'Tasmi\' 5 Juz Sekali Duduk', juz: 'Juz 1 - 5', ustadz: 'Ust. Ahmad Fauzi', nilai: 'Jayyid Jiddan (B+)', predikat: 'Lulus Sanad' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Laporan Tahfidz */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(2, 132, 199, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#bae6fd' }}>Laporan Evaluasi & Ujian Tasmi'</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Laporan Tahfidz & Tasmi'</div>
        <div style={{ fontSize: '0.8rem', color: '#e0f2fe' }}>Capaian Akumulasi: <strong>15 Juz Mutqin</strong></div>
      </div>

      {/* List Ujian Tasmi Card */}
      <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '10px', color: '#0f172a' }}>
        📜 Sertifikasi & Riwayat Ujian Tasmi'
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasmiLogs.map((t, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{t.tgl}</span>
              <span className="badge badge-success">{t.predikat}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{t.jenis}</div>
            <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, margin: '4px 0' }}>Cakupan: {t.juz}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.76rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>Nilai: {t.nilai}</span>
              <span style={{ color: '#64748b' }}>Penguji: {t.ustadz}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
