import React, { useState } from 'react';
import { 
  Fingerprint, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Sparkles
} from 'lucide-react';

export default function MobilePresensi() {
  const [activeFilter, setActiveFilter] = useState('semua');

  const presensiLogs = [
    { tgl: '08 Okt 2026', jam: '04:38 WIB', kegiatan: 'Shalat Shubuh Berjamaah', tempat: 'Masjid Utama', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' },
    { tgl: '08 Okt 2026', jam: '05:35 WIB', kegiatan: 'Mengaji Qur\'an / Halaqah Pagi', tempat: 'Aula Mengaji', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' },
    { tgl: '07 Okt 2026', jam: '19:38 WIB', kegiatan: 'Shalat Isya Berjamaah', tempat: 'Masjid Utama', status: 'Terlambat 8 Mnt', verify: 'PIN Kode' },
    { tgl: '07 Okt 2026', jam: '18:05 WIB', kegiatan: 'Shalat Maghrib Berjamaah', tempat: 'Masjid Utama', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' },
    { tgl: '07 Okt 2026', jam: '15:22 WIB', kegiatan: 'Shalat Ashar Berjamaah', tempat: 'Masjid Utama', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Presensi */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(124, 58, 237, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#ddd6fe' }}>Presensi Realtime Fingerprint</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 6px' }}>Kehadiran Shalat & Ngaji</div>
        <div style={{ fontSize: '0.8rem', color: '#ede9fe' }}>
          Tingkat Kehadiran Bulan Ini: <strong>98.4% (Disiplin Tinggi)</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => setActiveFilter('semua')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'semua' ? '#7c3aed' : '#ffffff', color: activeFilter === 'semua' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Semua Kegiatan
        </button>
        <button 
          onClick={() => setActiveFilter('shalat')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'shalat' ? '#7c3aed' : '#ffffff', color: activeFilter === 'shalat' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Shalat Berjamaah
        </button>
        <button 
          onClick={() => setActiveFilter('halaqah')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'halaqah' ? '#7c3aed' : '#ffffff', color: activeFilter === 'halaqah' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Halaqah Qur'an
        </button>
      </div>

      {/* List Presensi Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {presensiLogs.map((log, idx) => (
          <div key={idx} style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>{log.tgl} • {log.jam}</span>
              <span className={`badge ${log.status.includes('Tepat') ? 'badge-success' : 'badge-warning'}`}>
                {log.status}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{log.kegiatan}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.76rem', color: '#64748b' }}>
              <span>📍 {log.tempat}</span>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>{log.verify}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
