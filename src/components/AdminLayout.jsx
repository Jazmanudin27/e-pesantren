import React, { useState, useEffect, useRef } from 'react';
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
  Lock
} from 'lucide-react';
import DashboardAdmin from '../views/admin/DashboardAdmin';
import SantriView from '../views/admin/SantriView';
import AsramaView from '../views/admin/AsramaView';
import KelasView from '../views/admin/KelasView';
import AsatidzView from '../views/admin/AsatidzView';
import FingerprintDeviceView from '../views/admin/FingerprintDeviceView';
import TahfidzView from '../views/admin/TahfidzView';
import PerizinanView from '../views/admin/PerizinanView';
import TataTertibView from '../views/admin/TataTertibView';
import AbsensiFingerprintView from '../views/admin/AbsensiFingerprintView';

export default function AdminLayout() {
  const isMasterTab = (tab) => ['master-santri', 'master-asrama', 'master-kelas', 'master-asatidz', 'master-device'].includes(tab);
  const isLaporanTab = (tab) => ['laporan-presensi', 'laporan-tahfidz'].includes(tab);

  // Get initial tab from URL hash
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'dashboard';
  };

  const initialTab = getInitialTab();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMasterOpen, setIsMasterOpen] = useState(() => isMasterTab(initialTab));
  const [isLaporanOpen, setIsLaporanOpen] = useState(() => isLaporanTab(initialTab));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // User Dropdown & Modal States
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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

  const handleLogout = () => {
    setIsUserDropdownOpen(false);
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem Admin E-Pesantren?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('mobile_session');
      localStorage.removeItem('epesantren_tab');
      window.location.hash = '';
      window.location.reload();
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
    setIsMasterOpen(isMasterTab(tab));
    setIsLaporanOpen(isLaporanTab(tab));
  };

  // Listen to hash changes (back/forward browser buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const current = hash || 'dashboard';
      setActiveTab(current);
      localStorage.setItem('epesantren_tab', current);
      setIsMasterOpen(isMasterTab(current));
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
        return <DashboardAdmin />;
      case 'presensi':
      case 'laporan-presensi':
        return <AbsensiFingerprintView />;
      case 'tahfidz':
      case 'laporan-tahfidz':
        return <TahfidzView />;
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
      case 'master-device':
        return <FingerprintDeviceView />;
      default:
        return <DashboardAdmin />;
    }
  };

  const isMasterActive = ['master-santri', 'master-asrama', 'master-kelas', 'master-asatidz', 'master-device'].includes(activeTab);
  const isLaporanActive = ['laporan-presensi', 'laporan-tahfidz'].includes(activeTab);

  const renderNavMenu = (isMobile = false) => {
    const handleTabClick = (tab) => {
      changeTab(tab);
      if (isMobile) setIsMobileMenuOpen(false);
    };

    return (
      <nav className="sidebar-menu">
        <div className="menu-category">MAIN MENU</div>
        <button 
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('dashboard')}
        >
          <div className="nav-link-left">
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </div>
        </button>

        <button 
          className={`nav-link ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => handleTabClick('presensi')}
        >
          <div className="nav-link-left">
            <Fingerprint size={15} />
            <span>Presensi & Absensi</span>
          </div>
        </button>

        <button 
          className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
          onClick={() => handleTabClick('tahfidz')}
        >
          <div className="nav-link-left">
            <BookOpen size={15} />
            <span>Tahfidz & Muroja'ah</span>
          </div>
        </button>

        <button 
          className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
          onClick={() => handleTabClick('perizinan')}
        >
          <div className="nav-link-left">
            <DoorOpen size={15} />
            <span>Perizinan & Gerbang</span>
          </div>
        </button>

        {/* DATA MASTER DROPDOWN / ACCORDION */}
        <div className="menu-category">DATA MASTER</div>
        <button 
          className={`nav-link has-dropdown ${isMasterActive ? 'active' : ''}`}
          onClick={() => setIsMasterOpen(!isMasterOpen)}
        >
          <div className="nav-link-left">
            <Database size={15} />
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
              <span>Data Asrama & Kobong</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-kelas' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-kelas')}
            >
              <GraduationCap size={13} style={{ marginRight: '6px' }} />
              <span>Data Kelas & Halaqah</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-asatidz' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-asatidz')}
            >
              <Users size={13} style={{ marginRight: '6px' }} />
              <span>Data Asatidz & Musyrif</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'master-device' ? 'active' : ''}`}
              onClick={() => handleTabClick('master-device')}
            >
              <HardDrive size={13} style={{ marginRight: '6px' }} />
              <span>Data Mesin Fingerprint</span>
            </button>
          </div>
        )}

        <div className="menu-category">KEPESANTRENAN</div>
        <button 
          className={`nav-link ${activeTab === 'tata-tertib' ? 'active' : ''}`}
          onClick={() => handleTabClick('tata-tertib')}
        >
          <div className="nav-link-left">
            <ShieldAlert size={15} />
            <span>Tata Tertib & Ta'zir</span>
          </div>
        </button>

        <div className="menu-category">LAPORAN & REKAP</div>
        <button 
          className={`nav-link has-dropdown ${isLaporanActive ? 'active' : ''}`}
          onClick={() => setIsLaporanOpen(!isLaporanOpen)}
        >
          <div className="nav-link-left">
            <BarChart3 size={15} />
            <span>Laporan & Rekap</span>
          </div>
          <ChevronDown size={13} className={`nav-chevron ${isLaporanOpen ? 'open' : ''}`} />
        </button>

        {isLaporanOpen && (
          <div className="nav-submenu">
            <button 
              className={`nav-sublink ${activeTab === 'laporan-presensi' ? 'active' : ''}`}
              onClick={() => handleTabClick('laporan-presensi')}
            >
              <BarChart3 size={13} style={{ marginRight: '6px' }} />
              <span>Rekap Presensi Harian</span>
            </button>

            <button 
              className={`nav-sublink ${activeTab === 'laporan-tahfidz' ? 'active' : ''}`}
              onClick={() => handleTabClick('laporan-tahfidz')}
            >
              <FileText size={13} style={{ marginRight: '6px' }} />
              <span>Laporan Tahfidz & Tasmi'</span>
            </button>
          </div>
        )}
      </nav>
    );
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Desktop (Dark Navy Aspartech Style) */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-box">P</div>
          <div className="brand-title">
            <h2>PORTAL</h2>
            <p>PESANTREN SYSTEM</p>
          </div>
        </div>

        <div className="tenant-card">
          <div className="tenant-logo">🕌</div>
          <div className="tenant-info">
            <div className="tenant-name">PP. NURUL WAFA</div>
            <span className="tenant-badge">ADMIN</span>
          </div>
        </div>

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
                <div className="brand-icon-box">P</div>
                <div className="brand-title">
                  <h2>PORTAL</h2>
                  <p>PESANTREN SYSTEM</p>
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
              <div className="tenant-logo">🕌</div>
              <div className="tenant-info">
                <div className="tenant-name">PP. NURUL WAFA</div>
                <span className="tenant-badge">ADMIN</span>
              </div>
            </div>

            {renderNavMenu(true)}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="btn-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu Sistem"
            >
              <Menu size={18} />
            </button>
            <div className="header-mobile-brand">
              <span className="brand-logo-mini">P</span>
              <span className="brand-title-mini">E-PESANTREN</span>
            </div>
          </div>

          <div className="header-right">
            {/* Direct Link to Mobile Santri App (mpesantren.aspartech.com) */}
            <a 
              href={typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? 'https://mpesantren.aspartech.com' : '#mobile'} 
              target={typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? '_blank' : '_self'}
              rel="noreferrer"
              className="header-app-link"
              title="Buka Tampilan Mobile Santri (mpesantren.aspartech.com)"
            >
              📱 <span className="header-app-link-text">App Santri Mobile</span>
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
                <div className="header-tenant-logo">🕌</div>
                <div className="header-user-info-text">
                  <span className="header-user-name">PP. NURUL WAFA</span>
                  <span className="header-user-role">ADMINISTRATOR</span>
                </div>
                <ChevronDown size={14} className={`header-chevron ${isUserDropdownOpen ? 'open' : ''}`} />
              </button>

              {/* DROPDOWN POPUP MENU */}
              {isUserDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar">🕌</div>
                    <div className="user-dropdown-meta">
                      <div className="user-dropdown-meta-name">Pondok Pesantren Nurul Wafa</div>
                      <div className="user-dropdown-meta-email">admin@pesantren.aspartech.com</div>
                    </div>
                  </div>

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
                    href={typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? 'https://mpesantren.aspartech.com' : '#mobile'}
                    target={typeof window !== 'undefined' && window.location.hostname.includes('aspartech.com') ? '_blank' : '_self'}
                    rel="noreferrer"
                    className="user-dropdown-item"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <ExternalLink size={15} color="#d97706" />
                    <span>Portal Santri (mpesantren)</span>
                  </a>

                  <div className="user-dropdown-divider" />

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
                  <strong>pesantren.aspartech.com</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Domain Mobile:</span>
                  <strong style={{ color: '#059669' }}>mpesantren.aspartech.com</strong>
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
    </div>
  );
}
