import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Fingerprint,
  BookOpen, 
  DoorOpen, 
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  Clock,
  Key,
  Bell,
  LogOut,
  Check,
  Building2,
  Calendar,
  Send,
  UserCheck,
  Award,
  Layers,
  Sparkles,
  PieChart,
  User,
  HeartPulse,
  AlertTriangle
} from 'lucide-react';
import { showSuccess, showConfirm } from '../../utils/alert.util';

export default function MobileHome({ onChangeTab, onLogout }) {
  const [stats, setStats] = useState({
    total_santri: 0,
    total_halaqah: 0,
    total_izin_aktif: 0
  });

  const [rekapAbsensi, setRekapAbsensi] = useState({
    hadir: 25,
    sakit: 1,
    izin: 1,
    alfa: 1,
    total: 28
  });

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const rawName = sessionData.nama || sessionData.username || 'Dina Saparinda, S.Kom';
  const displayName = rawName.includes('_') ? rawName.replace('_', ' ') : rawName;
  const initial = displayName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'DS';

  // Live Clock & Greeting
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      
      let greet = 'Selamat Malam,';
      if (hours >= 4 && hours < 11) greet = 'Selamat Pagi,';
      else if (hours >= 11 && hours < 15) greet = 'Selamat Siang,';
      else if (hours >= 15 && hours < 18) greet = 'Selamat Sore,';
      setGreeting(greet);

      const dStr = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(now);
      setCurrentDateStr(dStr);

      const timeFormatted = now.toTimeString().split(' ')[0] + ' WIB';
      setCurrentTimeStr(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real data
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        if (res.data && res.data.success) {
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.rekap_absensi) setRekapAbsensi(res.data.rekap_absensi);
        }
      } catch (e) {}
    };
    loadData();
  }, []);

  const handleOpenNotice = () => {
    showSuccess(
      'Pemberitahuan Pesantren',
      'Seluruh kegiatan santri terpantau realtime. Presensi jamaah Subuh telah ditutup otomatis.'
    );
  };

  const handleOpenAccountInfo = () => {
    showSuccess(
      'Informasi Akun',
      `Login: ${sessionData.username || 'admin'} • Peran: ${sessionData.userType || 'Ustadz / Guru'}`
    );
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      paddingBottom: '28px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* =========================================================================
          TOP ROYAL BLUE GRADIENT BANNER
      ========================================================================= */}
      <div style={{
        background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 40%, #1e40af 100%)',
        padding: '16px 16px 36px',
        color: '#ffffff',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        position: 'relative'
      }}>
        {/* Top App Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          {/* Logo Brand */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.16)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={16} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.3px' }}>
              E-Pesantren
            </span>
            <span style={{
              background: '#f59e0b',
              color: '#ffffff',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              PRO
            </span>
          </div>

          {/* Top 3 Round Action Buttons (Cyan Key, Blue Bell, Red Logout) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Key Button (Cyan) */}
            <button
              onClick={handleOpenAccountInfo}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#06b6d4',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(6, 182, 212, 0.4)'
              }}
              title="Informasi Kunci"
            >
              <Key size={17} />
            </button>

            {/* Notification Bell (Blue with Red Dot) */}
            <button
              onClick={handleOpenNotice}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#3b82f6',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)'
              }}
              title="Notifikasi"
            >
              <Bell size={17} />
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '6px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                border: '1.5px solid #ffffff'
              }} />
            </button>

            {/* Logout (Red) */}
            <button
              onClick={onLogout}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)'
              }}
              title="Keluar"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Profile Card & Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Avatar Box with Green Status Indicator */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              border: '2.5px solid rgba(255, 255, 255, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#ffffff',
              boxShadow: '0 8px 18px rgba(0, 0, 0, 0.25)'
            }}>
              {initial}
            </div>
            {/* Green Online Dot */}
            <div style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2.5px solid #0369a1',
              boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)'
            }} />
          </div>

          {/* User Details & Date Pill */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', color: '#e0f2fe', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🌅</span>
              <span>{greeting}</span>
            </div>
            <div style={{
              fontSize: '1.22rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {displayName}
            </div>

            {/* Date & Time Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(8px)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.68rem',
              color: '#f8fafc',
              fontWeight: 600,
              marginTop: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
              <span>📅</span>
              <span>{currentDateStr || 'Jumat, 9 Okt 2026'}</span>
              <span>•</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span>{currentTimeStr || '09:30:28 WIB'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REKAP ABSENSI SANTRI: HADIR, SAKIT, IZIN, ALFA (ELEVATED WHITE CARD)
          (Mirip Screenshot E-Sekolah, tanpa banner Absen Masuk/Pulang)
      ========================================================================= */}
      <div style={{ padding: '0 16px', marginTop: '-20px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '16px 14px',
          boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          zIndex: 10
        }}>
          {/* 4 Status Badges (Hadir, Sakit, Izin, Alfa) */}
          <div className="mobile-rekap-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}>
            {/* 1. HADIR */}
            <div
              onClick={() => onChangeTab('presensi')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 8px 18px -4px rgba(16, 185, 129, 0.45)'
              }}>
                <Check size={28} strokeWidth={2.8} />
                {/* Count badge top-right */}
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}>
                  {rekapAbsensi.hadir}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Hadir
              </span>
            </div>

            {/* 2. SAKIT */}
            <div
              onClick={() => onChangeTab('presensi')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 8px 20px -2px rgba(239, 68, 68, 0.45)'
              }}>
                <Building2 size={26} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Sakit
              </span>
            </div>

            {/* 3. IZIN */}
            <div
              onClick={() => onChangeTab('perizinan')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px -4px rgba(245, 158, 11, 0.45)'
              }}>
                <FileText size={26} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Izin
              </span>
            </div>

            {/* 4. ALFA */}
            <div
              onClick={() => onChangeTab('laporan-presensi')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px -4px rgba(13, 148, 136, 0.45)'
              }}>
                <Clock size={26} strokeWidth={2.4} />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Alfa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SQUIRCLE GRID MENU (IDENTIK DENGAN SCREENSHOT E-SEKOLAH)
          4 Kolom, warna solid vibran, rounded squircle halus & bayangan lembut
      ========================================================================= */}
      <div className="mobile-squircle-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px 10px',
        padding: '24px 16px 14px'
      }}>
        {/* ROW 1 */}
        {/* 1. Siswa / Santri */}
        <div onClick={() => onChangeTab('master-santri')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.35)' }}>
            <GraduationCap size={26} />
          </div>
          <span style={menuLabelStyle}>Siswa</span>
        </div>

        {/* 2. Guru / Asatidz */}
        <div onClick={() => onChangeTab('master-asatidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 16px -2px rgba(5, 150, 105, 0.35)' }}>
            <Users size={26} />
          </div>
          <span style={menuLabelStyle}>Guru</span>
        </div>

        {/* 3. Kelas / Halaqah (Mapel) */}
        <div onClick={() => onChangeTab('master-kelas')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 16px -2px rgba(245, 158, 11, 0.35)' }}>
            <BookOpen size={26} />
          </div>
          <span style={menuLabelStyle}>Mapel</span>
        </div>

        {/* 4. Riwayat / History */}
        <div onClick={() => onChangeTab('laporan-presensi')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 8px 16px -2px rgba(225, 29, 72, 0.35)' }}>
            <Clock size={26} />
          </div>
          <span style={menuLabelStyle}>History</span>
        </div>

        {/* ROW 2 */}
        {/* 5. Asrama / Jadwal */}
        <div onClick={() => onChangeTab('master-asrama')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 16px -2px rgba(139, 92, 246, 0.35)' }}>
            <Calendar size={26} />
          </div>
          <span style={menuLabelStyle}>Jadwal</span>
        </div>

        {/* 6. Tahfidz / Kalender */}
        <div onClick={() => onChangeTab('tahfidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 8px 16px -2px rgba(13, 148, 136, 0.35)' }}>
            <Building size={26} />
          </div>
          <span style={menuLabelStyle}>Kalender</span>
        </div>

        {/* 7. Perizinan (Izin) */}
        <div onClick={() => onChangeTab('perizinan')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 8px 16px -2px rgba(234, 88, 12, 0.35)' }}>
            <Send size={24} />
          </div>
          <span style={menuLabelStyle}>Izin</span>
        </div>

        {/* 8. Absen Siswa */}
        <div onClick={() => onChangeTab('presensi')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ec4899, #db2777)', boxShadow: '0 8px 16px -2px rgba(236, 72, 153, 0.35)' }}>
            <UserCheck size={26} />
          </div>
          <span style={menuLabelStyle}>Absen Siswa</span>
        </div>

        {/* ROW 3 */}
        {/* 9. Tata Tertib (Absen Mapel) */}
        <div onClick={() => onChangeTab('tata-tertib')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 16px -2px rgba(59, 130, 246, 0.35)' }}>
            <BookOpen size={26} />
          </div>
          <span style={menuLabelStyle}>Absen Mapel</span>
        </div>

        {/* 10. Rekap Siswa */}
        <div onClick={() => onChangeTab('laporan-presensi')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #d97706, #b45309)', boxShadow: '0 8px 16px -2px rgba(217, 119, 6, 0.35)' }}>
            <BarChart3 size={26} />
          </div>
          <span style={menuLabelStyle}>Rekap Siswa</span>
        </div>

        {/* 11. Rekap Mapel */}
        <div onClick={() => onChangeTab('laporan-tahfidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 8px 16px -2px rgba(6, 182, 212, 0.35)' }}>
            <PieChart size={26} />
          </div>
          <span style={menuLabelStyle}>Rekap Mapel</span>
        </div>

        {/* 12. Rekap Guru */}
        <div onClick={() => onChangeTab('master-asatidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #be123c, #9f1239)', boxShadow: '0 8px 16px -2px rgba(190, 18, 60, 0.35)' }}>
            <Award size={26} />
          </div>
          <span style={menuLabelStyle}>Rekap Guru</span>
        </div>

        {/* ROW 4 */}
        {/* 13. Mesin Fingerprint */}
        <div onClick={() => onChangeTab('master-device')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 16px -2px rgba(139, 92, 246, 0.35)' }}>
            <HardDrive size={26} />
          </div>
          <span style={menuLabelStyle}>Perangkat</span>
        </div>

        {/* 14. Kamar Kobong */}
        <div onClick={() => onChangeTab('master-asrama')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 16px -2px rgba(5, 150, 105, 0.35)' }}>
            <Building size={26} />
          </div>
          <span style={menuLabelStyle}>Kobong</span>
        </div>

        {/* 15. Setoran Qur'an */}
        <div onClick={() => onChangeTab('tahfidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 8px 16px -2px rgba(2, 132, 199, 0.35)' }}>
            <FileText size={26} />
          </div>
          <span style={menuLabelStyle}>Setoran</span>
        </div>

        {/* 16. Profil Pengguna */}
        <div onClick={() => onChangeTab('profil')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 8px 16px -2px rgba(234, 88, 12, 0.35)' }}>
            <User size={26} />
          </div>
          <span style={menuLabelStyle}>Profil</span>
        </div>
      </div>
    </div>
  );
}

// Inline Style Reusable Helpers
const menuCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  userSelect: 'none'
};

const squircleIconStyle = {
  width: '58px',
  height: '58px',
  borderRadius: '20px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease'
};

const menuLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#334155',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '68px'
};
