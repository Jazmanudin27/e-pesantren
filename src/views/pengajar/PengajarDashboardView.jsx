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
  ChevronLeft,
  Building2, 
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Sparkles,
  Wallet,
  CreditCard,
  Heart
} from 'lucide-react';
import { showConfirm, toastSuccess } from '../../utils/alert.util';
import PengajarAbsenMengaji from './PengajarAbsenMengaji';
import PengajarTeguranView from './PengajarTeguranView';
import PengajarPraktekView from './PengajarPraktekView';
import PengajarPerkembanganView from './PengajarPerkembanganView';
import OwnerLaporanPresensi from '../owner/OwnerLaporanPresensi';
import OwnerLaporanSantri from '../owner/OwnerLaporanSantri';
import OwnerLaporanPerizinan from '../owner/OwnerLaporanPerizinan';
import HaidSantriwatiView from '../haid/HaidSantriwatiView';

const squircleIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "6px",
  transition: "transform 0.15s ease",
  cursor: "pointer",
};

const menuCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
  userSelect: "none",
};

const menuLabelStyle = {
  fontSize: "0.67rem",
  fontWeight: 700,
  color: "#334155",
  lineHeight: 1.2,
  maxWidth: "72px",
  display: "block",
};

export default function PengajarDashboardView({ onLogout }) {
  const [activeTab, setActiveTab] = useState('beranda'); // 'beranda' | 'absen-mengaji' | 'laporan-berjamaah' | 'teguran' | 'praktek' | 'perkembangan' | 'santri' | 'perizinan'
  const [loading, setLoading] = useState(true);
  const [presensiFilter, setPresensiFilter] = useState("Semua");
  const [activityActiveTab, setActivityActiveTab] = useState("kehadiran"); // 'kehadiran' | 'kedisiplinan'
  const [dashboardData, setDashboardData] = useState({
    totalSantri: 0,
    presensiHariIni: { total: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0, persenHadir: 0 },
    totalTeguranBulanIni: 0,
    totalPraktekBulanIni: 0,
    totalPerkembangan: 0,
    daftarSesi: []
  });

  const handleOpenPresensiWithStatus = (status) => {
    setPresensiFilter(status);
    setActiveTab("laporan-berjamaah");
  };

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
                    onClick={() => setActiveTab('laporan-berjamaah')}
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
                    Rincian <ChevronRight size={12} />
                  </button>
                </div>

                {/* 4 Cards Grid (Pastel Touchable Badges Identik Owner) */}
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
                    onClick={() => handleOpenPresensiWithStatus('Hadir')}
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
                    onClick={() => handleOpenPresensiWithStatus('Sakit')}
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
                    onClick={() => handleOpenPresensiWithStatus('Izin')}
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
                    onClick={() => handleOpenPresensiWithStatus('Alfa')}
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

            {/* 2. CARD RINGKASAN AKTIVITAS ASATIDZ (EXACT LUXURY GREEN FINTECH GRADIENT IDENTIK OWNER) */}
            <div
              style={{
                padding: "8px 14px 0",
                position: "relative",
                zIndex: 11,
              }}
            >
              <div
                style={{
                  background:
                    activityActiveTab === "kehadiran"
                      ? "linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)"
                      : "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #0f172a 100%)",
                  borderRadius: "18px",
                  padding: "12px 14px 12px",
                  border:
                    activityActiveTab === "kehadiran"
                      ? "1px solid rgba(167, 243, 208, 0.45)"
                      : "1px solid rgba(191, 219, 254, 0.45)",
                  boxShadow:
                    activityActiveTab === "kehadiran"
                      ? "0 10px 25px -4px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)"
                      : "0 10px 25px -4px rgba(30, 58, 138, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)",
                  position: "relative",
                  overflow: "hidden",
                  color: "#ffffff",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Ambient Glow Accent */}
                <div
                  style={{
                    position: "absolute",
                    top: "-30px",
                    right: "-30px",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    background:
                      activityActiveTab === "kehadiran"
                        ? "rgba(110, 231, 183, 0.22)"
                        : "rgba(147, 197, 253, 0.22)",
                    filter: "blur(25px)",
                    pointerEvents: "none",
                  }}
                />

                {/* Switcher Pill: Kehadiran & Kedisiplinan */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                    background: "rgba(0, 0, 0, 0.25)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    padding: "3px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActivityActiveTab("kehadiran")}
                    style={{
                      border: "none",
                      background:
                        activityActiveTab === "kehadiran" ? "#ffffff" : "transparent",
                      color:
                        activityActiveTab === "kehadiran"
                          ? "#047857"
                          : "rgba(255, 255, 255, 0.85)",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      padding: "4px 8px",
                      borderRadius: "9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      boxShadow:
                        activityActiveTab === "kehadiran"
                          ? "0 2px 6px rgba(0,0,0,0.18)"
                          : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Fingerprint
                      size={13}
                      strokeWidth={2.4}
                      color={
                        activityActiveTab === "kehadiran"
                          ? "#047857"
                          : "rgba(255, 255, 255, 0.85)"
                      }
                    />
                    <span>Kehadiran Santri</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivityActiveTab("kedisiplinan")}
                    style={{
                      border: "none",
                      background:
                        activityActiveTab === "kedisiplinan"
                          ? "#ffffff"
                          : "transparent",
                      color:
                        activityActiveTab === "kedisiplinan"
                          ? "#1d4ed8"
                          : "rgba(255, 255, 255, 0.85)",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      padding: "4px 8px",
                      borderRadius: "9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      boxShadow:
                        activityActiveTab === "kedisiplinan"
                          ? "0 2px 6px rgba(0,0,0,0.18)"
                          : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ShieldAlert
                      size={13}
                      strokeWidth={2.4}
                      color={
                        activityActiveTab === "kedisiplinan"
                          ? "#1d4ed8"
                          : "rgba(255, 255, 255, 0.85)"
                      }
                    />
                    <span>Disiplin &amp; Ujian</span>
                  </button>
                </div>

                {/* Content Active Switcher */}
                {activityActiveTab === "kehadiran" ? (
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            color: "#a7f3d0",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            lineHeight: 1.1,
                          }}
                        >
                          TINGKAT KEHADIRAN HARI INI
                        </div>
                        <div
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 900,
                            color: "#ffffff",
                            letterSpacing: "-0.3px",
                            lineHeight: 1.15,
                            marginTop: "3px",
                            textShadow: "0 2px 8px rgba(0,0,0,0.18)",
                          }}
                        >
                          {p.persenHadir || 0}% Kehadiran
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("laporan-berjamaah")}
                        title="Buka Laporan Presensi Lengkap"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.2)",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: "8px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <Fingerprint size={16} strokeWidth={2.4} />
                      </div>
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255, 255, 255, 0.16)",
                        margin: "8px 0 7px",
                      }}
                    />

                    {/* Sub Metrics: Crisp White Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          TOTAL HADIR
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#059669",
                            marginTop: "2px",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          +{p.hadir || 0} Santri
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          TIDAK HADIR
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#e11d48",
                            marginTop: "2px",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          -{(p.sakit || 0) + (p.izin || 0) + (p.alfa || 0)} Santri
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Kedisiplinan Content */
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            color: "#bae6fd",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            lineHeight: 1.1,
                          }}
                        >
                          TEGURAN BULAN INI
                        </div>
                        <div
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 900,
                            color: "#ffffff",
                            letterSpacing: "-0.3px",
                            lineHeight: 1.15,
                            marginTop: "3px",
                            textShadow: "0 2px 8px rgba(0,0,0,0.18)",
                          }}
                        >
                          {dashboardData.totalTeguranBulanIni || 0} Kasus
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("teguran")}
                        title="Buka Catatan Teguran"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.2)",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: "8px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        }}
                      >
                        <ShieldAlert size={16} strokeWidth={2.4} />
                      </div>
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255, 255, 255, 0.16)",
                        margin: "8px 0 7px",
                      }}
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          PRAKTEK IBADAH
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#1d4ed8",
                            marginTop: "2px",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {dashboardData.totalPraktekBulanIni || 0} Ujian
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          LAPORAN KARAKTER
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#7c3aed",
                            marginTop: "2px",
                            letterSpacing: "-0.2px",
                          }}
                        >
                          {dashboardData.totalPerkembangan || 0} Laporan
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SECTION MENU LAYANAN ASATIDZ (8 SQUIRCLE ICONS IN 2X4 GRID IDENTIK OWNER) */}
            <div style={{ padding: "0 14px", marginTop: "12px", marginBottom: "20px" }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 12px 14px",
                  boxShadow:
                    "0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    letterSpacing: "-0.2px",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "14px",
                      background: "#0d766e",
                      borderRadius: "4px",
                    }}
                  />
                  Menu Layanan Asatidz &amp; Pengajar
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "14px 4px",
                    justifyItems: "center",
                  }}
                >
                  {/* 1. Absen Mengaji */}
                  <div
                    onClick={() => setActiveTab("absen-mengaji")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                        boxShadow: "0 6px 16px -2px rgba(13, 148, 136, 0.38)",
                      }}
                    >
                      <BookOpen size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Presensi Mengaji</span>
                  </div>

                  {/* 2. Laporan Berjamaah */}
                  <div
                    onClick={() => setActiveTab("laporan-berjamaah")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                        boxShadow: "0 6px 16px -2px rgba(6, 182, 212, 0.38)",
                      }}
                    >
                      <Fingerprint
                        size={23}
                        strokeWidth={2.3}
                        color="#ffffff"
                      />
                    </div>
                    <span style={menuLabelStyle}>Lap. Berjamaah</span>
                  </div>

                  {/* 3. Catatan Teguran */}
                  <div
                    onClick={() => setActiveTab("teguran")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        boxShadow: "0 6px 16px -2px rgba(239, 68, 68, 0.38)",
                      }}
                    >
                      <ShieldAlert size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Catatan Teguran</span>
                  </div>

                  {/* 4. Praktek Ibadah */}
                  <div
                    onClick={() => setActiveTab("praktek")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.38)",
                      }}
                    >
                      <Award size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Praktek Ibadah</span>
                  </div>

                  {/* 5. Perkembangan / Karakter */}
                  <div
                    onClick={() => setActiveTab("perkembangan")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                        boxShadow: "0 6px 16px -2px rgba(139, 92, 246, 0.38)",
                      }}
                    >
                      <FileText size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Karakter Santri</span>
                  </div>

                  {/* 6. Data Santri */}
                  <div
                    onClick={() => setActiveTab("santri")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        boxShadow: "0 6px 16px -2px rgba(59, 130, 246, 0.38)",
                      }}
                    >
                      <Users size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Data Santri</span>
                  </div>

                  {/* 7. Perizinan */}
                  <div
                    onClick={() => setActiveTab("perizinan")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        boxShadow: "0 6px 16px -2px rgba(249, 115, 22, 0.38)",
                      }}
                    >
                      <Clock size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Perizinan</span>
                  </div>

                  {/* 8. Haid Santriwati */}
                  <div
                    onClick={() => setActiveTab("haid")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                        boxShadow: "0 6px 16px -2px rgba(219, 39, 119, 0.38)",
                      }}
                    >
                      <Heart size={23} strokeWidth={2.3} color="#ffffff" fill="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Haid Santri</span>
                  </div>

                  {/* 9. Segarkan Data */}
                  <div
                    onClick={fetchDashboard}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: "0 6px 16px -2px rgba(16, 185, 129, 0.38)",
                      }}
                    >
                      <Sparkles size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Segarkan Data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW SUB-TAB: HEADER SUBVIEW (IDENTIK HEADER SUBVIEW OWNER)
          ========================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Mobile Header Subview Identik Owner */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
                color: '#ffffff',
                padding: '12px 14px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 6px 18px rgba(0,0,0,0.16)',
                borderBottomLeftRadius: '18px',
                borderBottomRightRadius: '18px',
                marginBottom: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('beranda')}
                aria-label="Kembali ke Beranda"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.8} />
              </button>

              <div
                style={{
                  textAlign: 'center',
                  flex: 1,
                  padding: '0 8px',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    letterSpacing: '-0.2px',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#ffffff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  }}
                >
                  {activeTab === 'absen-mengaji' && 'Presensi Mengaji Santri'}
                  {activeTab === 'laporan-berjamaah' && 'Laporan Presensi Berjamaah'}
                  {activeTab === 'teguran' && 'Catatan Pelanggaran & Ta\'zir'}
                  {activeTab === 'praktek' && 'Evaluasi Praktek Ibadah'}
                  {activeTab === 'perkembangan' && 'Laporan Perkembangan Santri'}
                  {activeTab === 'santri' && 'Data & Demografi Santri'}
                  {activeTab === 'perizinan' && 'Laporan Perizinan Santri'}
                  {activeTab === 'haid' && 'Pencatatan Haid Santriwati'}
                </span>
                <span
                  style={{
                    fontSize: '0.58rem',
                    color: '#a7f3d0',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                    marginTop: '1px',
                  }}
                >
                  PORTAL ASATIDZ / PENGAJAR
                </span>
              </div>

              {/* Spacer kanan agar judul tetap di tengah simetris */}
              <div style={{ width: '36px', height: '36px', flexShrink: 0 }} />
            </div>

            {/* Subview Content Container */}
            <div style={{ padding: activeTab === 'absen-mengaji' ? 0 : '0 14px 20px', flex: 1 }}>
              {activeTab === 'absen-mengaji' && <PengajarAbsenMengaji />}
              {activeTab === 'laporan-berjamaah' && <OwnerLaporanPresensi initialStatus={presensiFilter} />}
              {activeTab === 'teguran' && <PengajarTeguranView />}
              {activeTab === 'praktek' && <PengajarPraktekView />}
              {activeTab === 'perkembangan' && <PengajarPerkembanganView />}
              {activeTab === 'santri' && <OwnerLaporanSantri />}
              {activeTab === 'perizinan' && <OwnerLaporanPerizinan />}
              {activeTab === 'haid' && <HaidSantriwatiView />}
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

          {/* 3. Laporan Berjamaah */}
          <button
            type="button"
            onClick={() => setActiveTab('laporan-berjamaah')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'laporan-berjamaah' ? '#34d399' : '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '0.62rem',
              fontWeight: activeTab === 'laporan-berjamaah' ? 800 : 500,
              gap: '2px',
              flex: 1
            }}
          >
            <Fingerprint size={19} strokeWidth={activeTab === 'laporan-berjamaah' ? 2.5 : 2} />
            <span>Berjamaah</span>
          </button>

          {/* 4. Teguran */}
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

          {/* 5. Praktek */}
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
        </nav>
      </div>
    </div>
  );
}
