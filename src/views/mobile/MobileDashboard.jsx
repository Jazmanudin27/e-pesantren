import React from 'react';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  Fingerprint, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function MobileDashboard() {
  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Ringkasan Dashboard */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(2, 132, 199, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#bae6fd' }}>Ringkasan Portal Pesantren</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 8px' }}>Dashboard Sistem Mobile</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#e0f2fe' }}>
          <ShieldCheck size={14} color="#38bdf8" /> Sistem Aktif • Status Realtime Pesantren
        </div>
      </div>

      {/* Grid Stats Card 2 Kolom */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', marginBottom: '6px' }}>
            <Users size={18} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Total Santri</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>180</div>
          <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>175 Mukim • 5 Kalong</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '6px' }}>
            <BookOpen size={18} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Rata Hafalan</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>15.4 Juz</div>
          <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>+1.2 Juz Bulan Ini</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', marginBottom: '6px' }}>
            <Fingerprint size={18} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Kehadiran Shalat</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>98.2%</div>
          <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600, marginTop: '2px' }}>Presensi Fingerprint</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '6px' }}>
            <DoorOpen size={18} />
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Izin Aktif</span>
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>8 Santri</div>
          <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>Izin Pulang Resmi</div>
        </div>
      </div>

      {/* Aktivitas Terbaru Card */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '12px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="#0284c7" /> Activity Stream Pesantren
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <BookOpen size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Setoran Tahfidz Ziyadah</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Ahmad Faiz • QS. Al-Isra' (Juz 15)</div>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>10 mnt lalu</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <Fingerprint size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Presensi Shalat Shubuh</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Zaidan Muhammad • Tepat Waktu</div>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>04:42 WIB</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              <DoorOpen size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Scan Gerbang Perizinan</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Fatimah Az-Zahra • Gate In Kembali</div>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kemarin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
