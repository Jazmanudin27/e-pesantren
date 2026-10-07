import React from 'react';
import { BookOpen, CheckCircle, Award, Sparkles, ChevronRight } from 'lucide-react';

export default function MobileTahfidz() {
  const riwayat = [
    { tgl: '07 Okt 2026', jenis: 'Ziyadah', surat: 'QS. Al-Isra\': 1-25', nilai: 'Mumtaz (A)', ustadz: 'Ust. Hamdan S.Th.I' },
    { tgl: '06 Okt 2026', jenis: 'Muroja\'ah', surat: 'QS. An-Nahl: 1-60', nilai: 'Jayyid Jiddan (B+)', ustadz: 'Ust. Hamdan S.Th.I' },
    { tgl: '05 Okt 2026', jenis: 'Ziyadah', surat: 'QS. An-Nahl: 80-128', nilai: 'Mumtaz (A)', ustadz: 'Ust. Hamdan S.Th.I' },
    { tgl: '04 Okt 2026', jenis: 'Sabqi', surat: 'Juz 14 Full', nilai: 'Mumtaz (A)', ustadz: 'Ust. Hamdan S.Th.I' },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Header Info */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 8px 16px rgba(6, 78, 59, 0.2)'
      }}>
        <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Target Program Tahfidz 30 Juz</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 10px' }}>Total 15 Juz Mutqin</div>
        <div style={{ background: 'rgba(255,255,255,0.2)', height: '8px', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ background: '#fef08a', width: '50%', height: '100%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px', color: '#e2e8f0' }}>
          <span>Juz 1 - 15 Selesai</span>
          <span>Sisa 15 Juz</span>
        </div>
      </div>

      {/* Riwayat Setoran */}
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px', color: '#0f172a' }}>
        📜 Riwayat Setoran & Mutaba'ah
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {riwayat.map((r, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.tgl}</span>
              <span className={`badge ${r.jenis === 'Ziyadah' ? 'badge-success' : 'badge-info'}`}>{r.jenis}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{r.surat}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>Nilai: {r.nilai}</span>
              <span style={{ color: '#64748b' }}>{r.ustadz}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
