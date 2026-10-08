import React, { useState, useEffect } from 'react';
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
  Grid
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
  // Get initial tab from URL hash or localStorage
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    const stored = localStorage.getItem('epesantren_tab');
    if (stored) return stored;
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Tab switcher with URL Hash and LocalStorage sync
  const changeTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    localStorage.setItem('epesantren_tab', tab);
  };

  // Listen to hash changes (back/forward browser buttons) & keep master dropdown open
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveTab(hash);
        localStorage.setItem('epesantren_tab', hash);
        if (['master-santri', 'master-asrama', 'master-kelas', 'master-asatidz', 'master-device'].includes(hash)) {
          setIsMasterOpen(true);
        }
        if (['laporan-presensi', 'laporan-tahfidz'].includes(hash)) {
          setIsLaporanOpen(true);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    if (!window.location.hash) {
      window.location.hash = activeTab;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

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
          className={`nav-link ${isMasterActive ? 'active' : ''}`}
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
          className={`nav-link ${isLaporanActive ? 'active' : ''}`}
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
            <div className="tenant-name">PP. AL-HIKMAH</div>
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
                <div className="tenant-name">PP. AL-HIKMAH</div>
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
          </div>

          <div className="header-right">
            {/* Direct Link to Mobile Santri App */}
            <a 
              href="#mobile" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: 'linear-gradient(135deg, #059669, #047857)', 
                color: '#ffffff', 
                padding: '5px 10px', 
                borderRadius: '6px', 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                textDecoration: 'none' 
              }}
              title="Buka Tampilan Mobile Santri App"
            >
              📱 App Santri Mobile
            </a>

            {/* Realtime Clock Pill */}
            <div className="header-time-pill">
              <Clock size={13} color="#64748b" />
              <span>{currentTime || '8 Oktober 2026 • 05:22:53'}</span>
            </div>

            {/* Notification Button */}
            <div className="header-notif-btn">
              <Bell size={15} />
              <div className="header-notif-badge">3</div>
            </div>

            {/* School / Tenant Dropdown Pill */}
            <div className="header-tenant-selector">
              <div className="header-tenant-logo">🕌</div>
              <span>PONDOK PESANTREN AL-HIKMAH</span>
              <ChevronDown size={14} color="#64748b" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-container">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => changeTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => changeTab('presensi')}
        >
          <Fingerprint size={18} />
          <span>Presensi</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'tahfidz' ? 'active' : ''}`}
          onClick={() => changeTab('tahfidz')}
        >
          <BookOpen size={18} />
          <span>Tahfidz</span>
        </button>

        <button 
          className={`mobile-nav-btn ${activeTab === 'perizinan' ? 'active' : ''}`}
          onClick={() => changeTab('perizinan')}
        >
          <DoorOpen size={18} />
          <span>Perizinan</span>
        </button>

        <button 
          className={`mobile-nav-btn ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Grid size={18} />
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
}
