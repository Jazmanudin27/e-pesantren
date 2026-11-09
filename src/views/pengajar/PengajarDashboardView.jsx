import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Home, 
  BookOpen, 
  ShieldAlert, 
  Award, 
  FileText, 
  LogOut, 
  User, 
  RotateCw, 
  Check, 
  Clock, 
  Users, 
  ChevronRight, 
  Building2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { showConfirm, toastSuccess } from '../../utils/alert.util';
import PengajarAbsenMengaji from './PengajarAbsenMengaji';
import PengajarTeguranView from './PengajarTeguranView';
import PengajarPraktekView from './PengajarPraktekView';
import PengajarPerkembanganView from './PengajarPerkembanganView';

export default function PengajarDashboardView({ onLogout }) {
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'absen-mengaji' | 'teguran' | 'praktek' | 'perkembangan'
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalSantri: 0,
    presensiHariIni: { total: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0, persenHadir: 0 },
    totalTeguranBulanIni: 0,
    totalPraktekBulanIni: 0,
    totalPerkembangan: 0,
    daftarSesi: []
  });

  const pengajarSession = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('desktop_session') ||
        sessionStorage.getItem('desktop_session') ||
        localStorage.getItem('mobile_session') ||
        '{}'
      );
    } catch (e) {
      return {};
    }
  })();

  const pengajarName = pengajarSession.nama || pengajarSession.name || 'Ust. Pembina & Pengajar';

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/pengajar/dashboard');
      if (res.data?.success && res.data.data) {
        setDashboardData(res.data.data);
      }
    } catch (e) {
      console.warn('Gagal memuat dashboard pengajar:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      'Konfirmasi Keluar',
      'Apakah Anda ingin keluar dari Portal Ustadz / Pengajar?',
      'Ya, Keluar',
      'Batal'
    );
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('desktop_session');
      localStorage.removeItem('mobile_session');
      sessionStorage.clear();
      if (onLogout) {
        onLogout();
      } else {
        window.location.hash = '#login';
        window.location.reload();
      }
      toastSuccess('Berhasil keluar');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 0,
        margin: 0
      }}
    >
      {/* MOBILE CONTAINER WRAPPER (Max 480px on desktop, full-width on mobile) */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.14)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '84px',
          boxSizing: 'border-box'
        }}
      >
        {/* =========================================================================
            HEADER GRADIENT HIJAU TEAL KHAS ASATIDZ / PENGAJAR
        ========================================================================= */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
            padding: '14px 16px 22px',
            color: '#ffffff',
            borderBottomLeftRadius: '20px',
            borderBottomRightRadius: '20px',
            position: 'relative',
            boxShadow: '0 6px 20px rgba(13, 118, 110, 0.22)'
          }}
        >
          {/* Header Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1.5px solid rgba(255, 255, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}
              >
                <BookOpen size={20} color="#ffffff" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.3px', color: '#ffffff' }}>
                    Portal Ustadz
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                    PENGAJAR
                  </span>
                </div>
                <div style={{ fontSize: '0.66rem', color: '#a7f3d0', fontWeight: 600, marginTop: '1px' }}>
                  PP. Nurul Wafa • Binaan Santri
                </div>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Keluar"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '10px'
              }}
            >
              <LogOut size={17} />
            </button>
          </div>

          {/* User info greeting card inside banner */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(6px)',
              borderRadius: '12px',
              padding: '8px 12px',
              marginTop: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ffffff', color: '#0d766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                <User size={15} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pengajarName}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#a7f3d0' }}>
                  Bimbingan Ibadah, Mengaji &amp; Akhlak
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.64rem',
                fontWeight: 700
              }}
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* =========================================================================
            BODY CONTENT AREA SESUAI TAB
        ========================================================================= */}
        <div style={{ padding: '14px 14px 20px', flex: 1 }}>
          {activeTab === 'beranda' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. KARTU PRESENSI MENGAJI HARI INI */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Presensi Mengaji Hari Ini</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '99px', border: '1px solid #a7f3d0' }}>
                    {dashboardData.presensiHariIni.persenHadir}% Kehadiran
                  </span>
                </div>

                {/* 4 Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d' }}>{dashboardData.presensiHariIni.hadir}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#166534' }}>Hadir</div>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#b91c1c' }}>{dashboardData.presensiHariIni.sakit}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#991b1b' }}>Sakit</div>
                  </div>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#b45309' }}>{dashboardData.presensiHariIni.izin}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#92400e' }}>Izin</div>
                  </div>
                  <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f766e' }}>{dashboardData.presensiHariIni.alfa}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#115e59' }}>Alfa</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('absen-mengaji')}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0d766e',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <BookOpen size={14} /> Buka Lembar Absen Mengaji
                </button>
              </div>

              {/* 2. 4 SHORTCUT MENU UTAMA PENGAJAR */}
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginTop: '4px' }}>
                Menu Layanan Asatidz &amp; Pengajar
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* 1. Absen Mengaji */}
                <div
                  onClick={() => setActiveTab('absen-mengaji')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Absen Mengaji</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Halaqah &amp; kajian kitab</div>
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0d766e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    Buka Absensi <ArrowRight size={11} />
                  </div>
                </div>

                {/* 2. Teguran & Ta'zir */}
                <div
                  onClick={() => setActiveTab('teguran')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Teguran Santri</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Catatan ta'zir &amp; disiplin</div>
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {dashboardData.totalTeguranBulanIni} Bulan Ini <ArrowRight size={11} />
                  </div>
                </div>

                {/* 3. Praktek Ibadah */}
                <div
                  onClick={() => setActiveTab('praktek')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Praktek Ibadah</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Shalat, wudhu &amp; doa</div>
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {dashboardData.totalPraktekBulanIni} Ujian <ArrowRight size={11} />
                  </div>
                </div>

                {/* 4. Perkembangan Santri */}
                <div
                  onClick={() => setActiveTab('perkembangan')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Perkembangan</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Karakter &amp; nasehat ustadz</div>
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {dashboardData.totalPerkembangan} Laporan <ArrowRight size={11} />
                  </div>
                </div>
              </div>

              {/* 3. JADWAL SESI MENGAJI HARI INI */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  marginTop: '4px'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Jadwal Sesi Kegiatan Pesantren
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dashboardData.daftarSesi.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        fontSize: '0.74rem'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#334155' }}>{s.nama_sesi}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0d766e', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                        {String(s.jam_mulai || '').slice(0, 5)} - {String(s.jam_selesai || '').slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'absen-mengaji' ? (
            <PengajarAbsenMengaji />
          ) : activeTab === 'teguran' ? (
            <PengajarTeguranView />
          ) : activeTab === 'praktek' ? (
            <PengajarPraktekView />
          ) : (
            <PengajarPerkembanganView />
          )}
        </div>

        {/* =========================================================================
            BOTTOM NAVIGATION BAR PORTAL PENGAJAR (STICKY ELEVATED)
        ========================================================================= */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '480px',
            height: '64px',
            backgroundColor: '#042f2e',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 999,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box',
            padding: '0 4px'
          }}
        >
          {/* Beranda */}
          <button
            type="button"
            onClick={() => setActiveTab('beranda')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'beranda' ? '#34d399' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'beranda' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <Home size={18} />
            <span>Beranda</span>
          </button>

          {/* Absen Mengaji */}
          <button
            type="button"
            onClick={() => setActiveTab('absen-mengaji')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'absen-mengaji' ? '#34d399' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'absen-mengaji' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <BookOpen size={18} />
            <span>Mengaji</span>
          </button>

          {/* Teguran */}
          <button
            type="button"
            onClick={() => setActiveTab('teguran')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'teguran' ? '#f87171' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'teguran' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <ShieldAlert size={18} />
            <span>Teguran</span>
          </button>

          {/* Praktek */}
          <button
            type="button"
            onClick={() => setActiveTab('praktek')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'praktek' ? '#60a5fa' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'praktek' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <Award size={18} />
            <span>Praktek</span>
          </button>

          {/* Perkembangan */}
          <button
            type="button"
            onClick={() => setActiveTab('perkembangan')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'perkembangan' ? '#c084fc' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'perkembangan' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <FileText size={18} />
            <span>Karakter</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

