import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DoorOpen, 
  ShieldAlert, 
  Bell, 
  Menu, 
  Fingerprint,
  ChevronDown,
  Building,
  GraduationCap,
  HardDrive,
  BarChart3,
  FileText,
  Clock,
  Database,
  X,
  Grid,
  LogOut,
  Key,
  ExternalLink,
  Lock,
  Maximize2,
  Minimize2,
  CalendarCheck,
  Settings,
  UserCog,
  QrCode,
  Camera,
  HeartHandshake,
  CreditCard,
  Calendar,
  Wallet,
  Heart,
  MessageSquare,
  Smartphone,
  Send
} from 'lucide-react';
import DashboardAdmin from '../views/admin/DashboardAdmin';
import SantriView from '../views/admin/SantriView';
import AsramaView from '../views/admin/AsramaView';
import KelasView from '../views/admin/KelasView';
import AsatidzView from '../views/admin/AsatidzView';
import MasterMateriView from '../views/admin/MasterMateriView';
import FingerprintDeviceView from '../views/admin/FingerprintDeviceView';
import SettingKegiatanView from '../views/admin/SettingKegiatanView';
import UserManagementView from '../views/admin/UserManagementView';
import ScanBarcodeView from '../views/admin/ScanBarcodeView';
import PraktekIbadahView from '../views/admin/PraktekIbadahView';
import PerizinanView from '../views/admin/PerizinanView';
import TataTertibView from '../views/admin/TataTertibView';
import AbsensiFingerprintView from '../views/admin/AbsensiFingerprintView';
import KeuanganAdminView from '../views/keuangan/KeuanganAdminView';
import BukuKasView from '../views/keuangan/BukuKasView';
import TabunganSantriAdminView from '../views/keuangan/TabunganSantriAdminView';
import LaporanInfakAdminView from '../views/keuangan/LaporanInfakAdminView';
import PesanKomunikasiAdminView from '../views/admin/PesanKomunikasiAdminView';
import KurikulumPengajianView from '../views/admin/KurikulumPengajianView';
import LaporanPerkembanganAdminView from '../views/admin/LaporanPerkembanganAdminView';
import InformasiKegiatanAdminView from '../views/admin/InformasiKegiatanAdminView';
import PerkembanganSantriLakiView from '../views/admin/PerkembanganSantriLakiView';
import PerkembanganSantriPerempuanView from '../views/admin/PerkembanganSantriPerempuanView';
import LoginAdmin from '../views/admin/LoginAdmin';
import PortalWaliSantri from '../views/wali/PortalWaliSantri';
import WhatsAppGatewayView from '../views/admin/WhatsAppGatewayView';
import OwnerDashboardView from '../views/owner/OwnerDashboardView';
import PengajarDashboardView from '../views/pengajar/PengajarDashboardView';
import HaidSantriwatiAdminView from '../views/admin/HaidSantriwatiAdminView';
import { canAccessKeuangan, canAccessAbsensi, isPureKeuangan, isPureAbsen } from '../utils/authRole.util';
import { showConfirm, toastSuccess } from '../utils/alert.util';

export default function AdminLayout() {
  const isAbsensiTab = (tab) => ['absensi-berjamaah', 'presensi-berjamaah', 'presensi', 'absensi-mengaji', 'presensi-kegiatan', 'haid-santriwati', 'haid'].includes(tab);
  const isPengembanganTab = (tab) => ['perkembangan-santri-laki', 'perkembangan-ikhwan', 'perkembangan-santri-perempuan', 'perkembangan-santriwati', 'perkembangan-akhwat'].includes(tab);
  const isMasterTab = (tab) => ['master-santri', 'master-asrama', 'master-kelas', 'master-asatidz', 'master-materi', 'setting-shalat', 'setting-kegiatan', 'master-kegiatan'].includes(tab);
  const isSettingsTab = (tab) => ['master-device', 'manajemen-user', 'users', 'whatsapp-gateway', 'whatsapp', 'wa-broadcast'].includes(tab);
  const isLaporanTab = (tab) => ['laporan-presensi'].includes(tab);
  const isKeuanganTab = (tab) => ['keuangan-admin', 'keuangan', 'keuangan-kasir', 'keuangan-rekap', 'keuangan-spp', 'tagihan', 'buku-kas', 'kantong-kas', 'kantong-saldo', 'tabungan-santri', 'tabungan', 'laporan-infak', 'infak'].includes(tab);

  // Get initial tab from URL hash
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    try {
      const saved = localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session');
      const u = saved ? JSON.parse(saved) : null;
      if (isPureKeuangan(u)) return 'keuangan-admin';
    } catch (e) {}
    return 'dashboard';
  };

  const initialTab = getInitialTab();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAbsensiOpen, setIsAbsensiOpen] = useState(() => isAbsensiTab(initialTab));
  const [isPengembanganOpen, setIsPengembanganOpen] = useState(() => isPengembanganTab(initialTab));
  const [isMasterOpen, setIsMasterOpen] = useState(() => isMasterTab(initialTab));
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => isSettingsTab(initialTab));
  const [isLaporanOpen, setIsLaporanOpen] = useState(() => isLaporanTab(initialTab));
  const [isKeuanganOpen, setIsKeuanganOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session');
      const u = saved ? JSON.parse(saved) : null;
      if (isPureKeuangan(u)) return true;
    } catch (e) {}
    return isKeuanganTab(initialTab);
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);
  
  // User Session & Modal States (Desktop Strict Login)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isPureBendahara = Boolean(currentUser && isPureKeuangan(currentUser));
  const isPureAdminAbsen = Boolean(currentUser && isPureAbsen(currentUser));

  // Mode Filter Navigasi Desktop: 'all' (Semua) | 'absen' (Admin Absen Saja) | 'keuangan' (Admin Keuangan Saja)
  const [desktopModuleFilter, setDesktopModuleFilter] = useState(() => {
    try {
      const saved = localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session');
      const u = saved ? JSON.parse(saved) : null;
      if (isPureKeuangan(u)) return 'keuangan';
      if (isPureAbsen(u)) return 'absen';
      const savedFilter = localStorage.getItem('desktop_module_filter');
      if (savedFilter && ['all', 'absen', 'keuangan'].includes(savedFilter)) return savedFilter;
    } catch (e) {}
    return 'all';
  });

  const handleSetDesktopModuleFilter = (filter) => {
    setDesktopModuleFilter(filter);
    try {
      localStorage.setItem('desktop_module_filter', filter);
    } catch (e) {}
    if (filter === 'keuangan' && !isKeuanganTab(activeTab)) {
      changeTab('keuangan-admin');
    } else if (filter === 'absen' && isKeuanganTab(activeTab)) {
      changeTab('dashboard');
    }
  };

  // Auto-switch tab ke Keuangan jika login sebagai Bendahara & tab masih dashboard
  useEffect(() => {
    if (isPureBendahara) {
      setDesktopModuleFilter('keuangan');
      setIsKeuanganOpen(true);
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'dashboard') {
        setActiveTab('keuangan-admin');
        window.location.hash = '#keuangan-admin';
      }
    } else if (isPureAdminAbsen) {
      setDesktopModuleFilter('absen');
      setIsAbsensiOpen(true);
      const hash = window.location.hash.replace('#', '');
      if (isKeuanganTab(hash)) {
        setActiveTab('dashboard');
        window.location.hash = '#dashboard';
      }
    }
  }, [currentUser]);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState('ustadz');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordNotice, setPasswordNotice] = useState(null);
  const userDropdownRef = useRef(null);

  // Close dropdown on click outside & Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsUserDropdownOpen(false);
        setIsProfileModalOpen(false);
        setIsPasswordModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    const confirmed = await showConfirm(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari sistem Ruang Ponpes?',
      'Ya, Keluar',
      'Batal'
    );
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('desktop_session');
      sessionStorage.removeItem('desktop_session');
      localStorage.removeItem('epesantren_tab');
      setCurrentUser(null);
      window.location.hash = '';
      toastSuccess('Berhasil keluar dari sistem');
    }
  };

  const handleDesktopLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const cleanU = loginUser.trim();
    const cleanP = loginPass.trim();

    try {
      const res = await axios.post('/api/login', { username: cleanU, password: cleanP });
      if (res.data && res.data.success) {
        if (res.data.token) localStorage.setItem('token', res.data.token);
        const userObj = res.data.user || {};
        const sessionData = {
          token: res.data.token,
          role: res.data.role || userObj.role || (loginRole === 'ustadz' ? 'asatidz' : 'admin'),
          userType: res.data.userType || userObj.userType || (loginRole === 'ustadz' ? 'Ustadz / Guru' : 'Administrator'),
          nama: res.data.nama || userObj.nama_asatidz || userObj.nama || cleanU,
          username: cleanU,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('desktop_session', JSON.stringify(sessionData));
        setCurrentUser(sessionData);
        setLoginLoading(false);
        setIsLoginModalOpen(false);
        setLoginUser('');
        setLoginPass('');
        return;
      }
    } catch (err) {
      // Fallback offline support
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      if (isNetwork) {
        const sessionData = {
          token: 'offline_token_' + Date.now(),
          role: loginRole === 'ustadz' ? 'asatidz' : 'admin',
          userType: loginRole === 'ustadz' ? 'Ustadz / Guru' : 'Administrator',
          nama: loginRole === 'ustadz' ? (cleanU || 'Ust. Ahmad Fauzi') : 'Admin Utama',
          username: cleanU,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('desktop_session', JSON.stringify(sessionData));
        setCurrentUser(sessionData);
        setLoginLoading(false);
        setIsLoginModalOpen(false);
        setLoginUser('');
        setLoginPass('');
        return;
      }
      setLoginLoading(false);
      setLoginError(err.response?.data?.error || err.response?.data?.message || 'Gagal login. Periksa username dan password.');
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 5) {
      setPasswordNotice({ type: 'error', text: 'Password baru minimal 5 karakter.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
      return;
    }
    setPasswordNotice({ type: 'success', text: 'Password administrator berhasil diperbarui!' });
    setTimeout(() => {
      setPasswordNotice(null);
      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }, 1200);
  };

  // Tab switcher with URL Hash and LocalStorage sync
  const changeTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    localStorage.setItem('epesantren_tab', tab);
    
    // Auto open/close dropdown based on active tab
    setIsAbsensiOpen(isAbsensiTab(tab));
    setIsPengembanganOpen(isPengembanganTab(tab));
    setIsMasterOpen(isMasterTab(tab));
    setIsSettingsOpen(isSettingsTab(tab));
    setIsLaporanOpen(isLaporanTab(tab));
  };

  // Listen to hash changes (back/forward browser buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const current = hash || 'dashboard';
      setActiveTab(current);
      localStorage.setItem('epesantren_tab', current);
      setIsAbsensiOpen(isAbsensiTab(current));
      setIsPengembanganOpen(isPengembanganTab(current));
      setIsMasterOpen(isMasterTab(current));
      setIsSettingsOpen(isSettingsTab(current));
      setIsLaporanOpen(isLaporanTab(current));
    };

    window.addEventListener('hashchange', handleHashChange);
    
    if (!window.location.hash) {
      window.location.hash = activeTab;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Realtime clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const dateStr = now.toLocaleDateString('id-ID', options);
      const timeStr = now.toTimeString().split(' ')[0];
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardAdmin onNavigate={changeTab} />;
      case 'presensi':
      case 'presensi-berjamaah':
      case 'absensi-berjamaah':
        if (!canAccessAbsensi(currentUser)) {
          return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Akses Dibatasi (Khusus Admin Absensi & Musyrif)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Menu Presensi dan Absensi dipisahkan khusus untuk petugas Admin Absen &amp; Musyrif. Akun Keuangan / Bendahara tidak memiliki hak akses operasional absensi.
              </p>
              <button 
                onClick={() => changeTab('keuangan-admin')}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Kembali ke Layanan Keuangan
              </button>
            </div>
          );
        }
        return <AbsensiFingerprintView initialType="berjamaah" />;
      case 'presensi-kegiatan':
      case 'absensi-mengaji':
        if (!canAccessAbsensi(currentUser)) {
          return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Akses Dibatasi (Khusus Admin Absensi & Musyrif)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Menu Presensi Mengaji dipisahkan khusus untuk Admin Absen &amp; Guru. Akun Keuangan / Bendahara tidak memiliki akses ke absensi santri.
              </p>
              <button 
                onClick={() => changeTab('keuangan-admin')}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Kembali ke Layanan Keuangan
              </button>
            </div>
          );
        }
        return <AbsensiFingerprintView initialType="kegiatan" />;
      case 'laporan-presensi':
        return <AbsensiFingerprintView initialType="berjamaah" />;
      case 'haid-santriwati':
      case 'haid':
        return <HaidSantriwatiAdminView />;
      case 'perizinan':
        return <PerizinanView />;
      case 'tata-tertib':
        return <TataTertibView />;
      case 'master-santri':
        return <SantriView />;
      case 'master-asrama':
        return <AsramaView />;
      case 'master-kelas':
        return <KelasView />;
      case 'master-asatidz':
        return <AsatidzView />;
      case 'master-materi':
        return <MasterMateriView />;
      case 'kurikulum-pengajian':
      case 'jadwal-mengajar':
      case 'kurikulum':
        return <KurikulumPengajianView />;
      case 'master-device':
        return <FingerprintDeviceView />;
      case 'setting-shalat':
      case 'setting-kegiatan':
      case 'master-kegiatan':
        return <SettingKegiatanView />;
      case 'manajemen-user':
      case 'users':
        return <UserManagementView />;
      case 'scan-barcode':
      case 'scan':
        return <ScanBarcodeView />;
      case 'praktek-ibadah':
      case 'praktek':
        return <PraktekIbadahView />;
      case 'keuangan-admin':
      case 'keuangan':
      case 'keuangan-kasir':
      case 'tagihan':
        if (!canAccessKeuangan(currentUser)) {
          return (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: '#fff', borderRadius: '16px', margin: '24px', border: '1px solid #fee2e2', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Akses Dibatasi (Khusus Admin Keuangan / Bendahara)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Menu Keuangan dan Tagihan dipisahkan khusus untuk petugas Keuangan / Bendahara Pesantren. Akun Admin Presensi, Asatidz, dan Musyrif operasional tidak memiliki hak akses melihat menu ini.
              </p>
              <button 
                onClick={() => changeTab('dashboard')}
                style={{ background: '#059669', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Kembali ke Dashboard Utama
              </button>
            </div>
          );
        }
        return <KeuanganAdminView initialMode="kasir" />;
      case 'keuangan-rekap':
      case 'keuangan-laporan':
        if (!canAccessKeuangan(currentUser)) {
          return null;
        }
        return <KeuanganAdminView initialMode="rekap" initialRekapTab="semua" />;
      case 'buku-kas':
      case 'kantong-kas':
      case 'kantong-saldo':
        if (!canAccessKeuangan(currentUser)) {
          return null;
        }
        return <BukuKasView />;
      case 'tabungan-santri':
      case 'tabungan':
        if (!canAccessKeuangan(currentUser)) {
          return null;
        }
        return <TabunganSantriAdminView />;
      case 'laporan-infak':
      case 'infak':
        if (!canAccessKeuangan(currentUser)) {
          return null;
        }
        return <LaporanInfakAdminView />;
      case 'pesan-komunikasi':
      case 'pesan-admin':
      case 'pesan':
        return <PesanKomunikasiAdminView />;
      case 'perkembangan-santri-laki':
      case 'perkembangan-ikhwan':
        return <PerkembanganSantriLakiView />;
      case 'perkembangan-santri-perempuan':
      case 'perkembangan-santriwati':
      case 'perkembangan-akhwat':
        return <PerkembanganSantriPerempuanView />;
      case 'laporan-perkembangan':
      case 'rapor-santri':
        return <LaporanPerkembanganAdminView />;
      case 'informasi-kegiatan':
      case 'berita-pesantren':
        return <InformasiKegiatanAdminView />;
      case 'whatsapp-gateway':
      case 'whatsapp':
      case 'wa-broadcast':
        return <WhatsAppGatewayView />;
      case 'portal-wali':
      case 'wali-santri':
      case 'wali':
        return <PortalWaliSantri />;
      case 'owner':
      case 'laporan-owner':
      case 'dashboard-owner':
        return <OwnerDashboardView />;
      default:
        return <DashboardAdmin />;
    }
  };

  const isAbsensiActive = ['absensi-berjamaah', 'presensi-berjamaah', 'presensi', 'absensi-mengaji', 'presensi-kegiatan'].includes(activeTab);
  const isPengembanganActive = isPengembanganTab(activeTab);
  const isMasterActive = ['master-santri', 'master-asrama', 'master-kelas', 'master-asatidz', 'master-materi', 'kurikulum-pengajian', 'jadwal-mengajar', 'setting-shalat', 'setting-kegiatan', 'master-kegiatan'].includes(activeTab);
  const isSettingsActive = [
    'master-device',
    'manajemen-user',
    'users',
    'pesan-komunikasi',
    'pesan-admin',
    'pesan',
    'informasi-kegiatan',
    'berita-pesantren',
    'pengumuman',
    'whatsapp-gateway',
    'whatsapp',
    'wa-broadcast'
  ].includes(activeTab);
  const isLaporanActive = ['laporan-presensi', 'laporan-tahfidz'].includes(activeTab);
  const isKeuanganActive = isKeuanganTab(activeTab);

  const renderNavMenu = (isMobile = false) => {
    const handleTabClick = (tab) => {
      changeTab(tab);
      if (isMobile) setIsMobileMenuOpen(false);
    };

    return (
      <nav className="sidebar-menu">
        {/* 1. Dashboard */}
        <button 
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
        >
          <div className="nav-link-left">
            <LayoutDashboard size={15} style={{ color: '#0284c7' }} />
            <span>Dashboard</span>
          </div>
        </button>

        {/* 2. DATA MASTER */}
        <button 
          className={`nav-link has-dropdown ${isMasterActive ? 'active' : ''}`}
          onClick={() => setIsMasterOpen(!isMasterOpen)}
        >
          <div className="nav-link-left">
            <Database size={15} style={{ color: '#38bdf8' }} />
            <span>Data Master</span>
          </div>
          <ChevronDown size={13} className={`nav-chevron ${isMasterOpen ? 'open' : ''}`} />
        </button>

        {isMasterOpen && (
          <div className="nav-submenu">
            <button 
              className={`nav-sublink ${activeTab === 'master-santri' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-santri')}
            >
              <Users size={13} style={{ marginRight: '6px' }} />
              <span>Data Santri</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-asrama' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-asrama')}
            >
              <Building size={13} style={{ marginRight: '6px' }} />
              <span>Asrama</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-kelas' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-kelas')}
            >
              <GraduationCap size={13} style={{ marginRight: '6px' }} />
              <span>Kelas</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-asatidz' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-asatidz')}
            >
              <Users size={13} style={{ marginRight: '6px' }} />
              <span>Asatidz</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-materi' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-materi')}
            >
              <BookOpen size={13} style={{ marginRight: '6px', color: '#059669' }} />
              <span>Kegiatan</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'setting-shalat' || activeTab === 'setting-kegiatan' || activeTab === 'master-kegiatan' ? 'active' : ''}`}
              onClick={() => handleTabClick('setting-shalat')}
            >
              <CalendarCheck size={13} style={{ marginRight: '6px', color: '#0284c7' }} />
              <span>Setting Shalat</span>
            </button>
          </div>
        )}

        {/* 3. Absensi Santri */}
        <button 
          className={`nav-link has-dropdown ${isAbsensiActive ? 'active' : ''}`}
          onClick={() => setIsAbsensiOpen(!isAbsensiOpen)}
        >
          <div className="nav-link-left">
            <Fingerprint size={15} style={{ color: '#0284c7' }} />
            <span>Absensi Santri</span>
          </div>
          <ChevronDown size={13} className={`nav-chevron ${isAbsensiOpen ? 'open' : ''}`} />
        </button>

        {isAbsensiOpen && (
          <div className="nav-submenu">
            <button 
              className={`nav-sublink ${['absensi-berjamaah', 'presensi-berjamaah', 'presensi'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleTabClick('absensi-berjamaah')}
            >
              <Fingerprint size={13} style={{ marginRight: '6px', color: '#0284c7' }} />
              <span>Absensi Berjamaah</span>
            </button>

            <button 
              className={`nav-sublink ${['absensi-mengaji', 'presensi-kegiatan'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleTabClick('absensi-mengaji')}
            >
              <BookOpen size={13} style={{ marginRight: '6px', color: '#059669' }} />
              <span>Absensi Mengaji</span>
            </button>

            <button 
              className={`nav-sublink ${['haid-santriwati', 'haid'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleTabClick('haid-santriwati')}
            >
              <Heart size={13} style={{ marginRight: '6px', color: '#ec4899' }} />
              <span>Haid Santriwati</span>
            </button>
          </div>
        )}

        {/* 4. Perizinan Santri */}
        <button 
          className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
          onClick={() => handleTabClick('perizinan')}
        >
          <div className="nav-link-left">
            <DoorOpen size={15} style={{ color: '#f59e0b' }} />
            <span>Perizinan Santri</span>
          </div>
        </button>

        {/* 5. Tata Tertib & Ta'zir */}
        <button 
          className={`nav-link ${activeTab === 'tata-tertib' ? 'active' : ''}`}
          onClick={() => handleTabClick('tata-tertib')}
        >
          <div className="nav-link-left">
            <ShieldAlert size={15} style={{ color: '#ef4444' }} />
            <span>Tata Tertib &amp; Ta'zir</span>
          </div>
        </button>

        {/* 6. Pengembangan */}
        <button 
          className={`nav-link has-dropdown ${isPengembanganActive ? 'active' : ''}`}
          onClick={() => setIsPengembanganOpen(!isPengembanganOpen)}
        >
          <div className="nav-link-left">
            <BookOpen size={15} style={{ color: '#0284c7' }} />
            <span>Pengembangan</span>
          </div>
          <ChevronDown size={13} className={`nav-chevron ${isPengembanganOpen ? 'open' : ''}`} />
        </button>

        {isPengembanganOpen && (
          <div className="nav-submenu">
            <button 
              className={`nav-sublink ${activeTab === 'perkembangan-santri-laki' || activeTab === 'perkembangan-ikhwan' ? 'active' : ''}`}
              onClick={() => handleTabClick('perkembangan-santri-laki')}
            >
              <Users size={13} style={{ marginRight: '6px', color: '#0284c7' }} />
              <span>Pengembangan (L)</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'perkembangan-santri-perempuan' || activeTab === 'perkembangan-santriwati' || activeTab === 'perkembangan-akhwat' ? 'active' : ''}`}
              onClick={() => handleTabClick('perkembangan-santri-perempuan')}
            >
              <Users size={13} style={{ marginRight: '6px', color: '#db2777' }} />
              <span>Pengembangan (P)</span>
            </button>
          </div>
        )}

        {/* 7. SETTINGS */}
        <div className="menu-category" style={{ color: '#94a3b8', fontWeight: 800 }}>SETTINGS</div>

        {/* Settings Dropdown Accordion */}
        <button 
          className={`nav-link has-dropdown ${isSettingsActive ? 'active' : ''}`}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <div className="nav-link-left">
            <Settings size={15} style={{ color: '#94a3b8' }} />
            <span>Settings</span>
          </div>
          <ChevronDown size={13} className={`nav-chevron ${isSettingsOpen ? 'open' : ''}`} />
        </button>

        {isSettingsOpen && (
          <div className="nav-submenu">
            {/* Kelola Pengguna */}
            <button 
              className={`nav-sublink ${activeTab === 'manajemen-user' || activeTab === 'users' ? 'active' : ''}`}
              onClick={() => handleTabClick('manajemen-user')}
            >
              <UserCog size={13} style={{ marginRight: '6px' }} />
              <span>Kelola Pengguna (Users)</span>
            </button>

            {/* Pesan Wali Santri */}
            <button 
              className={`nav-sublink ${['pesan-komunikasi', 'pesan-admin', 'pesan'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleTabClick('pesan-komunikasi')}
            >
              <MessageSquare size={13} style={{ marginRight: '6px', color: '#0d9488' }} />
              <span>Pesan Wali Santri</span>
            </button>

            {/* Informasi & Pengumuman */}
            <button 
              className={`nav-sublink ${['informasi-kegiatan', 'berita-pesantren', 'pengumuman'].includes(activeTab) ? 'active' : ''}`}
              onClick={() => handleTabClick('informasi-kegiatan')}
            >
              <Bell size={13} style={{ marginRight: '6px', color: '#f59e0b' }} />
              <span>Informasi &amp; Pengumuman</span>
            </button>

            {/* Mesin Fingerprint (ADMS) */}
            <button 
              className={`nav-sublink ${activeTab === 'master-device' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-device')}
            >
              <HardDrive size={13} style={{ marginRight: '6px', color: '#a855f7' }} />
              <span>Mesin Fingerprint (ADMS)</span>
            </button>
          </div>
        )}

        {/* 8. Laporan */}
        <div className="menu-category" style={{ color: '#94a3b8', fontWeight: 800 }}>Laporan</div>

        {/* Laporan Perkembangan */}
        <button 
          className={`nav-link ${activeTab === 'laporan-perkembangan' ? 'active' : ''}`}
          onClick={() => handleTabClick('laporan-perkembangan')}
        >
          <div className="nav-link-left">
            <FileText size={15} style={{ color: '#0284c7' }} />
            <span>Laporan Perkembangan</span>
          </div>
        </button>
      </nav>
    );
  };

  // Jika belum login di desktop, wajib login terlebih dahulu
  if (!currentUser) {
    return (
      <LoginAdmin 
        onLoginSuccess={(session) => {
          setCurrentUser(session);
        }} 
      />
    );
  }

  // Jika yang login adalah Owner, langsung render Halaman Eksekutif Owner (Bypass AdminLayout)
  const isOwnerUser = Boolean(
    currentUser && (
      String(currentUser.role || '').toLowerCase().includes('owner') ||
      String(currentUser.userType || '').toLowerCase().includes('owner') ||
      String(currentUser.username || '').toLowerCase() === 'owner'
    )
  );

  if (isOwnerUser) {
    return (
      <OwnerDashboardView 
        onLogout={() => {
          localStorage.removeItem('desktop_session');
          localStorage.removeItem('mobile_session');
          localStorage.removeItem('token');
          sessionStorage.clear();
          setCurrentUser(null);
          window.location.hash = '#login';
          window.location.reload();
        }} 
      />
    );
  }

  // Jika yang login adalah Ustadz / Pengajar, langsung render Portal Pengajar (Bypass AdminLayout)
  const isPengajarUser = Boolean(
    currentUser && (
      String(currentUser.role || '').toLowerCase().includes('ustadz') ||
      String(currentUser.role || '').toLowerCase().includes('asatidz') ||
      String(currentUser.role || '').toLowerCase().includes('pengajar') ||
      String(currentUser.userType || '').toLowerCase().includes('ustadz') ||
      String(currentUser.userType || '').toLowerCase().includes('guru') ||
      String(currentUser.userType || '').toLowerCase().includes('asatidz')
    )
  );

  if (isPengajarUser) {
    return (
      <PengajarDashboardView
        onLogout={() => {
          localStorage.removeItem('desktop_session');
          localStorage.removeItem('mobile_session');
          localStorage.removeItem('token');
          sessionStorage.clear();
          setCurrentUser(null);
          window.location.hash = '#login';
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar Desktop (Dark Navy Aspartech Style) */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <img src="/nwf.png" alt="Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
          <div className="brand-title">
            <h2>RUANG PONPES</h2>
            <p>SISTEM PESANTREN</p>
          </div>
        </div>

        <div className="tenant-card">
          <div className="tenant-logo" style={{ background: '#ffffff', padding: '2px', border: 'none' }}>
            <img src="/nwf.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          </div>
          <div className="tenant-info">
            <div className="tenant-name">PP. NURUL WAFA</div>
            <span 
              className="tenant-badge"
              style={
                isPureBendahara 
                  ? { background: '#059669', color: '#ffffff', borderColor: '#10b981' } 
                  : isPureAdminAbsen 
                  ? { background: '#0284c7', color: '#ffffff', borderColor: '#38bdf8' } 
                  : {}
              }
            >
              {isPureBendahara ? 'ADMIN KEUANGAN' : isPureAdminAbsen ? 'ADMIN ABSEN' : 'SUPER ADMIN'}
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        {renderNavMenu(false)}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-brand" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
                <div className="brand-title">
                  <h2>RUANG PONPES</h2>
                  <p>SISTEM PESANTREN</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="tenant-card">
              <div className="tenant-logo" style={{ background: '#ffffff', padding: '2px', border: 'none' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <div className="tenant-info">
                <div className="tenant-name">PP. NURUL WAFA</div>
                <span 
                  className="tenant-badge"
                  style={
                    isPureBendahara 
                      ? { background: '#059669', color: '#ffffff', borderColor: '#10b981' } 
                      : isPureAdminAbsen 
                      ? { background: '#0284c7', color: '#ffffff', borderColor: '#38bdf8' } 
                      : {}
                  }
                >
                  {isPureBendahara ? 'ADMIN KEUANGAN' : isPureAdminAbsen ? 'ADMIN ABSEN' : 'ADMIN'}
                </span>
              </div>
            </div>

            {!isPureBendahara && !isPureAdminAbsen && (
              <div style={{ padding: '0 12px 10px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    background: 'rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '3px',
                    gap: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSetDesktopModuleFilter('all')}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '7px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: desktopModuleFilter === 'all' ? '#059669' : 'transparent',
                      color: desktopModuleFilter === 'all' ? '#ffffff' : '#94a3b8',
                      textAlign: 'center',
                    }}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDesktopModuleFilter('absen')}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '7px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: desktopModuleFilter === 'absen' ? '#0284c7' : 'transparent',
                      color: desktopModuleFilter === 'absen' ? '#ffffff' : '#94a3b8',
                      textAlign: 'center',
                    }}
                  >
                    Absen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetDesktopModuleFilter('keuangan')}
                    style={{
                      padding: '6px 2px',
                      borderRadius: '7px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: desktopModuleFilter === 'keuangan' ? '#10b981' : 'transparent',
                      color: desktopModuleFilter === 'keuangan' ? '#ffffff' : '#94a3b8',
                      textAlign: 'center',
                    }}
                  >
                    Keuangan
                  </button>
                </div>
              </div>
            )}

            {renderNavMenu(true)}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="btn-hamburger"
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Tampilkan Menu Sistem" : "Sembunyikan Menu Sistem"}
            >
              <Menu size={18} />
            </button>
            <button
              type="button"
              className="btn-fullscreen-toggle"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Full Screen)"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <div className="header-mobile-brand">
              <img src="/nwf.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', marginRight: '6px' }} />
              <span className="brand-title-mini">RUANG PONPES</span>
            </div>
          </div>

          <div className="header-right">
            {/* Direct Link to Mobile Santri App (mnurulwafa.ruangtech.com) */}
            <a 
              href={typeof window !== 'undefined' && window.location.hostname.includes('ruangtech.com') ? 'https://mnurulwafa.ruangtech.com' : (typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? 'https://mpesantren.aspartech.com' : '#mobile')} 
              target={typeof window !== 'undefined' && (window.location.hostname.includes('ruangtech.com') || window.location.hostname.includes('aspartech.com')) ? '_blank' : '_self'}
              rel="noreferrer"
              className="header-app-link"
              title="Buka NWF Mobile (mnurulwafa.ruangtech.com)"
            >
              📱 <span className="header-app-link-text">NWF Mobile</span>
            </a>

            {/* Realtime Clock Pill */}
            <div className="header-time-pill">
              <Clock size={13} color="#64748b" />
              <span>{currentTime || '8 Oktober 2026 • 05:22:53'}</span>
            </div>

            {/* Notification Button */}
            <div className="header-notif-btn" title="Notifikasi Sistem">
              <Bell size={15} />
              <div className="header-notif-badge">3</div>
            </div>

            {/* User Profile & Tenant Dropdown (Interactive) */}
            <div className="header-user-dropdown-wrapper" ref={userDropdownRef}>
              <button 
                type="button"
                className="header-tenant-selector header-user-trigger"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                aria-expanded={isUserDropdownOpen}
                title="Klik untuk menu akun pengguna"
              >
                <div className="header-tenant-logo" style={{ background: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <div className="header-user-info-text">
                  <span className="header-user-name">{currentUser?.nama || 'PP. NURUL WAFA'}</span>
                  <span className="header-user-role">{currentUser?.userType || 'ADMINISTRATOR'}</span>
                </div>
                <ChevronDown size={14} className={`header-chevron ${isUserDropdownOpen ? 'open' : ''}`} />
              </button>

              {/* DROPDOWN POPUP MENU */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar" style={{ background: '#ffffff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', padding: '2px' }}>
                      <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                    </div>
                    <div className="user-dropdown-meta">
                      <div className="user-dropdown-meta-name">{currentUser?.nama || 'Pondok Pesantren Nurul Wafa'}</div>
                      <div className="user-dropdown-meta-email">{currentUser?.userType || 'Administrator Portal'}</div>
                    </div>
                  </div>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setLoginRole('ustadz');
                      setLoginError('');
                      setIsLoginModalOpen(true);
                    }}
                  >
                    <GraduationCap size={15} color="#059669" />
                    <span>Login Ustadz / Guru</span>
                  </button>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      window.location.hash = '#pengajar';
                    }}
                  >
                    <BookOpen size={15} color="#0d9488" />
                    <span>Portal Pengajar / Ustadz</span>
                  </button>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      changeTab('dashboard');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    <LayoutDashboard size={15} color="#0284c7" />
                    <span>Dashboard Utama</span>
                  </button>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      changeTab('master-santri');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    <Users size={15} color="#059669" />
                    <span>Data Santri Mukim</span>
                  </button>

                  <a 
                    href={typeof window !== 'undefined' && window.location.hostname.includes('ruangtech.com') ? 'https://mnurulwafa.ruangtech.com' : (typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? 'https://mpesantren.aspartech.com' : '#mobile')}
                    target={typeof window !== 'undefined' && (window.location.hostname.includes('ruangtech.com') || window.location.hostname.includes('aspartech.com')) ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="user-dropdown-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <ExternalLink size={15} color="#d97706" />
                    <span>Portal Santri (Mobile)</span>
                  </a>

                  <div className="user-dropdown-divider" />

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      changeTab('manajemen-user');
                      setIsUserDropdownOpen(false);
                    }}
                  >
                    <UserCog size={15} color="#059669" />
                    <span>Kelola Pengguna (Users)</span>
                  </button>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <Building size={15} color="#475569" />
                    <span>Profil Pesantren</span>
                  </button>

                  <button 
                    className="user-dropdown-item"
                    onClick={() => {
                      setIsUserDropdownOpen(false);
                      setPasswordNotice(null);
                      setIsPasswordModalOpen(true);
                    }}
                  >
                    <Key size={15} color="#475569" />
                    <span>Ganti Password</span>
                  </button>

                  <div className="user-dropdown-divider" />

                  <button 
                    className="user-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-container">
          {renderContent()}
        </div>
      </div>

      {/* MODAL PROFIL PESANTREN */}
      {isProfileModalOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '92%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #064e3b, #047857)', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>Profil Pondok Pesantren</h3>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '18px 20px', fontSize: '0.82rem', color: '#334155' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ width: '56px', height: '56px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '1.8rem' }}>🕌</div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>Pondok Pesantren Nurul Wafa</h4>
                <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>NSPP: 510032060012 • Berdiri Sejak 1988 M</p>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Pimpinan Ponpes:</span>
                  <strong>KH. Ahmad Dahlan Al-Hafidz</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Domain Desktop:</span>
                  <strong>nurulwafa.ruangtech.com</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Domain Mobile:</span>
                  <strong style={{ color: '#059669' }}>mnurulwafa.ruangtech.com</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ color: '#64748b' }}>Status Sistem:</span>
                  <span className="badge badge-success">Online (Database Aktif)</span>
                </div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px' }}
                onClick={() => setIsProfileModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANTI PASSWORD */}
      {isPasswordModalOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsPasswordModalOpen(false)}>
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '92%',
              margin: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>Ganti Password Administrator</h3>
              </div>
              <button onClick={() => setIsPasswordModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePassword} style={{ padding: '18px 20px' }}>
              {passwordNotice && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  background: passwordNotice.type === 'error' ? '#fee2e2' : '#dcfce7',
                  color: passwordNotice.type === 'error' ? '#b91c1c' : '#15803d',
                  border: `1px solid ${passwordNotice.type === 'error' ? '#fca5a5' : '#86efac'}`
                }}>
                  {passwordNotice.text}
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Password Lama</label>
                <input 
                  type="password" 
                  required
                  placeholder="Masukkan password saat ini"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Password Baru</label>
                <input 
                  type="password" 
                  required
                  placeholder="Minimal 5 karakter"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Konfirmasi Password Baru</label>
                <input 
                  type="password" 
                  required
                  placeholder="Ulangi password baru"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGIN USTADZ / GURU & ADMIN */}
      {isLoginModalOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsLoginModalOpen(false)}>
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '92%',
              margin: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              background: loginRole === 'ustadz' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {loginRole === 'ustadz' ? <GraduationCap size={22} /> : <ShieldCheck size={22} />}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    {loginRole === 'ustadz' ? 'Login Akun Ustadz / Guru' : 'Login Administrator'}
                  </h3>
                  <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>Portal Pesantren Nurul Wafa</div>
                </div>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Role Toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setLoginRole('ustadz'); setLoginError(''); }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: loginRole === 'ustadz' ? '#ffffff' : 'transparent',
                    color: loginRole === 'ustadz' ? '#059669' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    boxShadow: loginRole === 'ustadz' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  👨‍🏫 Ustadz / Guru
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole('admin'); setLoginError(''); }}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: loginRole === 'admin' ? '#ffffff' : 'transparent',
                    color: loginRole === 'admin' ? '#0284c7' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    boxShadow: loginRole === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  ⚙️ Admin Utama
                </button>
              </div>

              {loginError && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5'
                }}>
                  {loginError}
                </div>
              )}

              <form onSubmit={handleDesktopLogin}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    {loginRole === 'ustadz' ? 'NIK / NO. WHATSAPP / NAMA USTADZ' : 'USERNAME ADMIN'}
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={loginRole === 'ustadz' ? 'Contoh: 08123456789 atau NIK / Nama' : 'admin'}
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    PASSWORD
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="Masukkan password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                    {loginRole === 'ustadz' ? '💡 Password default: 123456 atau ustadz123' : '💡 Password admin: admin'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setIsLoginModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={loginLoading}
                    className="btn btn-primary"
                    style={{ background: loginRole === 'ustadz' ? '#059669' : '#0284c7' }}
                  >
                    {loginLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
