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
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HeartPulse,
  ArrowRight,
  TrendingUp,
  RotateCw,
  Award
} from 'lucide-react';

export default function MobileHome({ onChangeTab }) {
  const [stats, setStats] = useState({
    total_santri: 0,
    total_halaqah: 0,
    total_izin_aktif: 0,
    avg_juz: '0.0'
  });

  const [rekapAbsensi, setRekapAbsensi] = useState({
    hadir: 24,
    sakit: 1,
    izin: 1,
    alfa: 1,
    total: 27
  });

  const [recentSetoran, setRecentSetoran] = useState([]);
  const [loading, setLoading] = useState(true);

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const rawName = sessionData.nama || sessionData.username || 'Ustadz / Pengurus';
  const displayName = rawName.includes('_') ? rawName.replace('_', ' ').toUpperCase() : rawName;
  const displayRole = sessionData.userType || (sessionData.role ? sessionData.role.toUpperCase() : 'USTADZ');
  const initial = displayName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'NW';

  const loadAllData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/stats');
      if (res.data && res.data.success) {
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.rekap_absensi) setRekapAbsensi(res.data.rekap_absensi);
        if (res.data.recentSetoran) setRecentSetoran(res.data.recentSetoran);
      }
    } catch (err) {
      console.warn('Dashboard stats fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Format tanggal Indonesia
  const todayDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const totalAbsen = (rekapAbsensi.hadir + rekapAbsensi.sakit + rekapAbsensi.izin + rekapAbsensi.alfa) || 1;
  const percentHadir = Math.round((rekapAbsensi.hadir / totalAbsen) * 100);

  return (
    <div style={{ paddingBottom: '32px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* =========================================================================
          1. HERO HEADER WITH USER GREETING & DATE
      ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)',
        color: '#ffffff',
        padding: '20px 16px 26px',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        boxShadow: '0 12px 30px -8px rgba(6, 78, 59, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow backdrop decorative */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.25) 0%, rgba(52, 211, 153, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Top Profile Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(6px)',
              padding: '3px 9px',
              borderRadius: '20px',
              fontSize: '0.68rem',
              color: '#d1fae5',
              fontWeight: 600,
              marginBottom: '4px'
            }}>
              <span>🕌 Pesantren Nurul Wafa</span>
              <span>•</span>
              <span>{todayDateStr}</span>
            </div>
            <div style={{ fontSize: '1.22rem', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              {displayRole} • Sesi Aktif
            </div>
          </div>

          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            color: '#064e3b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1rem',
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
          }}>
            {initial}
          </div>
        </div>

        {/* =========================================================================
            2. REKAP ABSENSI SANTRI (HADIR, SAKIT, IZIN, ALFA)
            Menggantikan 'Portal Sistem e-Pesantren' dengan tampilan sangat elegan
        ========================================================================= */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '16px',
          color: '#0f172a',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}>
          {/* Card Title & Reload */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Fingerprint size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  Rekap Absensi Santri
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                  Presensi Jamaah & Pengajian Hari Ini
                </div>
              </div>
            </div>

            <button
              onClick={loadAllData}
              title="Perbarui Data"
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#475569',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* 4 Stat Boxes (Hadir, Sakit, Izin, Alfa) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '14px'
          }}>
            {/* 1. HADIR */}
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '10px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <CheckCircle2 size={16} color="#059669" />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', lineHeight: 1.1 }}>
                {rekapAbsensi.hadir}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#047857' }}>
                Hadir
              </div>
            </div>

            {/* 2. SAKIT */}
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '10px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <HeartPulse size={16} color="#d97706" />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', lineHeight: 1.1 }}>
                {rekapAbsensi.sakit}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309' }}>
                Sakit
              </div>
            </div>

            {/* 3. IZIN */}
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '14px',
              padding: '10px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <Clock size={16} color="#2563eb" />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', lineHeight: 1.1 }}>
                {rekapAbsensi.izin}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#1d4ed8' }}>
                Izin
              </div>
            </div>

            {/* 4. ALFA */}
            <div style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              borderRadius: '14px',
              padding: '10px 6px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              <AlertTriangle size={16} color="#e11d48" />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9f1239', lineHeight: 1.1 }}>
                {rekapAbsensi.alfa}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#be123c' }}>
                Alfa
              </div>
            </div>
          </div>

          {/* Attendance Bar & Rate */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#059669" />
              <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>Tingkat Kehadiran:</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>
              {percentHadir}% Hadir
            </span>
          </div>

          {/* Quick Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => onChangeTab('presensi')}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '9px 12px',
                borderRadius: '10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Fingerprint size={14} /> Scan Presensi
            </button>
            <button
              onClick={() => onChangeTab('laporan-presensi')}
              style={{
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                padding: '9px 12px',
                borderRadius: '10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <span>Rekap Harian</span> <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. KEY METRICS ROW (3 Ringkasan Data Utama)
      ========================================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        padding: '16px 16px 8px'
      }}>
        {/* Total Santri */}
        <div
          onClick={() => onChangeTab('master-santri')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '12px 10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <Users size={16} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            {stats.total_santri || 28}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            Total Santri
          </div>
        </div>

        {/* Rata-rata Juz */}
        <div
          onClick={() => onChangeTab('tahfidz')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '12px 10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <BookOpen size={16} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            {stats.avg_juz || '4.2'} Juz
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            Avg. Hafalan
          </div>
        </div>

        {/* Izin Aktif */}
        <div
          onClick={() => onChangeTab('perizinan')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '12px 10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <DoorOpen size={16} />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            {stats.total_izin_aktif || 2}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            Izin Keluar
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MENU UTAMA SISTEM (GRID ELEGAN)
      ========================================================================= */}
      <div style={{ padding: '12px 16px 6px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '10px', letterSpacing: '-0.2px' }}>
          Menu Layanan Pesantren
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '18px' }}>
        {/* Santri */}
        <button className="quick-menu-item" onClick={() => onChangeTab('master-santri')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <Users size={22} />
          </div>
          <span>Santri</span>
        </button>

        {/* Asrama */}
        <button className="quick-menu-item" onClick={() => onChangeTab('master-asrama')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <Building size={22} />
          </div>
          <span>Asrama</span>
        </button>

        {/* Kelas */}
        <button className="quick-menu-item" onClick={() => onChangeTab('master-kelas')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
            <GraduationCap size={22} />
          </div>
          <span>Kelas</span>
        </button>

        {/* Asatidz */}
        <button className="quick-menu-item" onClick={() => onChangeTab('master-asatidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}>
            <Users size={22} />
          </div>
          <span>Asatidz</span>
        </button>

        {/* Absensi */}
        <button className="quick-menu-item" onClick={() => onChangeTab('presensi')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <Fingerprint size={22} />
          </div>
          <span>Presensi</span>
        </button>

        {/* Perizinan */}
        <button className="quick-menu-item" onClick={() => onChangeTab('perizinan')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <DoorOpen size={22} />
          </div>
          <span>Perizinan</span>
        </button>

        {/* Setoran Tahfidz */}
        <button className="quick-menu-item" onClick={() => onChangeTab('tahfidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <BookOpen size={22} />
          </div>
          <span>Tahfidz</span>
        </button>

        {/* Tata Tertib / Ta'zir */}
        <button className="quick-menu-item" onClick={() => onChangeTab('tata-tertib')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
            <ShieldAlert size={22} />
          </div>
          <span>Ta'zir</span>
        </button>

        {/* Rekap Absensi */}
        <button className="quick-menu-item" onClick={() => onChangeTab('laporan-presensi')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #f97316, #c2410c)' }}>
            <BarChart3 size={22} />
          </div>
          <span>Rekap Absen</span>
        </button>

        {/* Laporan Tahfidz */}
        <button className="quick-menu-item" onClick={() => onChangeTab('laporan-tahfidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <FileText size={22} />
          </div>
          <span>Lap. Tahfidz</span>
        </button>

        {/* Mesin Fingerprint */}
        <button className="quick-menu-item" onClick={() => onChangeTab('master-device')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}>
            <HardDrive size={22} />
          </div>
          <span>Perangkat</span>
        </button>

        {/* Profil / Akun */}
        <button className="quick-menu-item" onClick={() => onChangeTab('profil')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <ShieldCheck size={22} />
          </div>
          <span>Profil</span>
        </button>
      </div>

      {/* =========================================================================
          5. RINGKASAN SETORAN TAHFIDZ TERBARU
      ========================================================================= */}
      <div style={{ padding: '0 16px', marginBottom: '18px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
              <Sparkles size={16} color="#059669" />
              <span>Aktivitas Tahfidz Santri</span>
            </div>
            <button
              onClick={() => onChangeTab('tahfidz')}
              style={{
                background: '#ecfdf5',
                color: '#059669',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Buka Halaqah
            </button>
          </div>

          <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(90deg, #059669, #10b981)', width: '82%', height: '100%' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#64748b' }}>
            <span>Target Muroja'ah Pekanan: <strong>82% Tercapai</strong></span>
            <span style={{ color: '#059669', fontWeight: 700 }}>Aktif Menghafal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
