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
  RefreshCw, 
  Check, 
  Clock, 
  Users, 
  ChevronRight, 
  Building2, 
  ArrowLeft,
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

  const pengajarName = pengajarSession.nama || pengajarSession.nama_asatidz || pengajarSession.username || 'Ust. Pengajar';

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

  const p = dashboardData.presensiHariIni || { hadir: 0, sakit: 0, izin: 0, alfa: 0, persenHadir: 0 };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f1f5f9',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(13, 118, 110, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15, 23, 42, 0.06) 0px, transparent 50%)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 0,
        margin: 0
      }}
    >
      {/* MOBILE CONTAINER WRAPPER (Max 440px desktop, full-width on mobile) */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.18)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '82px',
          boxSizing: 'border-box'
        }}
      >
        {/* =========================================================================
            HEADER KONTEN SESUAI TAB (BERANDA vs SUBVIEW)
        ========================================================================= */}
        {activeTab === 'beranda' ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 1. TOP MODERN TEAL GRADIENT BANNER (IDENTIK OWNER DASHBOARD) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
                padding: '16px 16px 36px',
                color: '#ffffff',
                borderBottomLeftRadius: '24px',
                borderBottomRightRadius: '24px',
                position: 'relative'
              }}
            >
              {/* Header Top Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {/* Brand Logo: NWF Asatidz + Subtitle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    userSelect: 'none'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(167,243,208,0.15) 100%)',
                      border: '1.5px solid rgba(255, 255, 255, 0.42)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3.5px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
                      flexShrink: 0
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '10px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4.5px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <img
                        src="/nwf.png"
                        alt="NWF Logo"
                        onError={(e) => { e.target.src = '/logo.png'; }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '3px'
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: '1.45rem',
                          letterSpacing: '-0.5px',
                          color: '#ffffff',
                          lineHeight: 1,
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        NWF
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          fontStyle: 'italic',
                          letterSpacing: '-0.2px',
                          color: '#a7f3d0',
                          lineHeight: 1,
                          textShadow: '0 2px 6px rgba(11, 107, 96, 0.35)'
                        }}
                      >
                        Asatidz
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.85)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                        lineHeight: 1
                      }}
                    >
                      PORTAL USTADZ &amp; PENGAJAR
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons (Refresh & Logout) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={fetchDashboard}
                    title="Muat Ulang Data"
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
                    <RefreshCw
                      size={17}
                      className={loading ? 'animate-spin' : ''}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Keluar Akun"
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
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. OVERLAPPING WHITE CARD: PROFIL USTADZ & REKAP PASTEL BADGES (IDENTIK OWNER) */}
            <div
              style={{
                padding: '0 14px',
                marginTop: '-24px',
                position: 'relative',
                zIndex: 12
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  padding: '12px 12px 10px',
                  boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)'
                }}
              >
                {/* Header Profile Info: Nama Ustadz Pengajar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      flex: 1,
                      paddingRight: '8px'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          letterSpacing: '-0.2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {pengajarName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          color: '#64748b',
                          lineHeight: 1.1,
                          marginTop: '1px'
                        }}
                      >
                        Status: Asatidz Aktif • {dashboardData.totalSantri || 613} Santri
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('absen-mengaji')}
                    style={{
                      background: 'rgba(13, 148, 136, 0.08)',
                      border: '1px solid rgba(13, 148, 136, 0.2)',
                      borderRadius: '8px',
                      color: '#0d9488',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '4px 8px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Presensi <ChevronRight size={12} />
                  </button>
                </div>

                {/* 4 Cards Grid (Pastel Touchable Badges) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px'
                  }}
                >
                  {/* Hadir */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('absen-mengaji')}
                    style={{
                      background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #bbf7d0',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '10px',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px -1px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Check size={16} strokeWidth={2.8} />
                    </div>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#15803d',
                        marginTop: '4px',
                        lineHeight: 1
                      }}
                    >
                      {p.hadir}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
                      Hadir
                    </span>
                  </button>

                  {/* Sakit */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('absen-mengaji')}
                    style={{
                      background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #fecaca',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '10px',
                        background: '#ef4444',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px -1px rgba(239, 68, 68, 0.35)'
                      }}
                    >
                      <Building2 size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#b91c1c',
                        marginTop: '4px',
                        lineHeight: 1
                      }}
                    >
                      {p.sakit}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', marginTop: '2px' }}>
                      Sakit
                    </span>
                  </button>

                  {/* Izin */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('absen-mengaji')}
                    style={{
                      background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #fde68a',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '10px',
                        background: '#f59e0b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px -1px rgba(245, 158, 11, 0.35)'
                      }}
                    >
                      <FileText size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#b45309',
                        marginTop: '4px',
                        lineHeight: 1
                      }}
                    >
                      {p.izin}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>
                      Izin
                    </span>
                  </button>

                  {/* Alfa */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('absen-mengaji')}
                    style={{
                      background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #99f6e4',
                      cursor: 'pointer',
                      outline: 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '10px',
                        background: '#0d9488',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 8px -1px rgba(13, 148, 136, 0.35)'
                      }}
                    >
                      <Clock size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: '#0f766e',
                        marginTop: '4px',
                        lineHeight: 1
                      }}
                    >
                      {p.alfa}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#115e59', marginTop: '2px' }}>
                      Alfa
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. MENU SHORTCUT 4 MODUL UTAMA PENGAJAR (GAYA EKSEKUTIF) */}
            <div style={{ padding: '16px 14px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', letterSpacing: '-0.2px' }}>
                Layanan Asatidz &amp; Pengajar
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* 1. Absen Mengaji */}
                <div
                  onClick={() => setActiveTab('absen-mengaji')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Absen Mengaji</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Presensi kajian &amp; kitab</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0d766e', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    Buka Absen <ArrowRight size={12} />
                  </div>
                </div>

                {/* 2. Teguran & Ta'zir */}
                <div
                  onClick={() => setActiveTab('teguran')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca' }}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Teguran Santri</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Catatan ta'zir &amp; disiplin</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    {dashboardData.totalTeguranBulanIni} Bulan Ini <ArrowRight size={12} />
                  </div>
                </div>

                {/* 3. Praktek Ibadah */}
                <div
                  onClick={() => setActiveTab('praktek')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                    <Award size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Praktek Ibadah</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Ujian shalat, wudhu, doa</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    {dashboardData.totalPraktekBulanIni} Ujian <ArrowRight size={12} />
                  </div>
                </div>

                {/* 4. Perkembangan Santri */}
                <div
                  onClick={() => setActiveTab('perkembangan')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd6fe' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>Perkembangan</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Karakter &amp; nasehat</div>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    {dashboardData.totalPerkembangan} Laporan <ArrowRight size={12} />
                  </div>
                </div>
              </div>

              {/* 4. JADWAL SESI KEGIATAN AKTIF DARI DATABASE */}
              {dashboardData.daftarSesi && dashboardData.daftarSesi.length > 0 && (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Sesi Kegiatan Pesantren Terjadwal
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
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW SUB-TAB: HEADER SUBVIEW (IDENTIK HEADER SUBVIEW OWNER)
          ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
                padding: '12px 14px',
                color: '#ffffff',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                boxShadow: '0 4px 14px rgba(13, 118, 110, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('beranda')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    flexShrink: 0
                  }}
                >
                  <ArrowLeft size={14} /> Beranda
                </button>

                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {activeTab === 'absen-mengaji' && 'Presensi Mengaji Santri'}
                    {activeTab === 'teguran' && 'Catatan Pelanggaran & Ta\'zir'}
                    {activeTab === 'praktek' && 'Evaluasi Praktek Ibadah'}
                    {activeTab === 'perkembangan' && 'Laporan Perkembangan Santri'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.58rem',
                      color: '#a7f3d0',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginTop: '1px'
                    }}
                  >
                    {pengajarName} • PORTAL ASATIDZ
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Keluar"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Subview Content Container */}
            <div style={{ padding: activeTab === 'absen-mengaji' ? 0 : '0 14px 20px', flex: 1 }}>
              {activeTab === 'absen-mengaji' && <PengajarAbsenMengaji />}
              {activeTab === 'teguran' && <PengajarTeguranView />}
              {activeTab === 'praktek' && <PengajarPraktekView />}
              {activeTab === 'perkembangan' && <PengajarPerkembanganView />}
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM NAVIGATION BAR PORTAL PENGAJAR (ELEVATED DARK TEAL IDENTIK OWNER)
        ========================================================================= */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '440px',
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
          {/* 1. Beranda */}
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
            <Home size={19} strokeWidth={activeTab === 'beranda' ? 2.5 : 2} />
            <span>Beranda</span>
          </button>

          {/* 2. Absen Mengaji */}
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
            <BookOpen size={19} strokeWidth={activeTab === 'absen-mengaji' ? 2.5 : 2} />
            <span>Mengaji</span>
          </button>

          {/* 3. Teguran */}
          <button
            type="button"
            onClick={() => setActiveTab('teguran')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'teguran' ? '#34d399' : '#94a3b8',
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
            <ShieldAlert size={19} strokeWidth={activeTab === 'teguran' ? 2.5 : 2} />
            <span>Teguran</span>
          </button>

          {/* 4. Praktek */}
          <button
            type="button"
            onClick={() => setActiveTab('praktek')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'praktek' ? '#34d399' : '#94a3b8',
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
            <Award size={19} strokeWidth={activeTab === 'praktek' ? 2.5 : 2} />
            <span>Praktek</span>
          </button>

          {/* 5. Perkembangan */}
          <button
            type="button"
            onClick={() => setActiveTab('perkembangan')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'perkembangan' ? '#34d399' : '#94a3b8',
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
            <FileText size={19} strokeWidth={activeTab === 'perkembangan' ? 2.5 : 2} />
            <span>Karakter</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
