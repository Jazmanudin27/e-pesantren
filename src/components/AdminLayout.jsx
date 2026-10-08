import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DoorOpen, 
  ShieldAlert, 
  Bell, 
  Menu, 
  X,
  Fingerprint,
  ChevronDown,
  Building,
  GraduationCap,
  HardDrive,
  BarChart3,
  FileText,
  Clock,
  Database
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Tab switcher with URL Hash and LocalStorage sync
  const changeTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    localStorage.setItem('epesantren_tab', tab);
    setIsMobileMenuOpen(false);
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
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Auto set hash if empty
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

  return (
    <div className="admin-layout">
      {/* Overlay Backdrop for Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">P</div>
          <div className="brand-title">
            <h2>PORTAL</h2>
            <p>PESANTREN SYSTEM</p>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
            title="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tenant Profile Card */}
        <div className="tenant-card">
          <div className="tenant-logo">🕌</div>
          <div className="tenant-info">
            <div className="tenant-name">PP. AL-HIKMAH</div>
            <span className="tenant-badge">ADMIN</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          <div className="menu-category">MAIN MENU</div>
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => changeTab('dashboard')}
          >
            <div className="nav-link-left">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'presensi' ? 'active' : ''}`}
            onClick={() => changeTab('presensi')}
          >
            <div className="nav-link-left">
              <Fingerprint size={15} />
              <span>Presensi & Absensi</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => changeTab('tahfidz')}
          >
            <div className="nav-link-left">
              <BookOpen size={15} />
              <span>Tahfidz & Muroja'ah</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => changeTab('perizinan')}
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
                onClick={() => changeTab('master-santri')}
              >
                <span>Data Santri</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-asrama' ? 'active' : ''}`}
                onClick={() => changeTab('master-asrama')}
              >
                <span>Data Asrama & Kobong</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-kelas' ? 'active' : ''}`}
                onClick={() => changeTab('master-kelas')}
              >
                <span>Data Kelas & Halaqah</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-asatidz' ? 'active' : ''}`}
                onClick={() => changeTab('master-asatidz')}
              >
                <span>Data Asatidz & Musyrif</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-device' ? 'active' : ''}`}
                onClick={() => changeTab('master-device')}
              >
                <span>Data Mesin Fingerprint</span>
              </button>
            </div>
          )}

          <div className="menu-category">KEPESANTRENAN</div>
          <button 
            className={`nav-link ${activeTab === 'tata-tertib' ? 'active' : ''}`}
            onClick={() => changeTab('tata-tertib')}
          >
            <div className="nav-link-left">
              <ShieldAlert size={15} />
              <span>Tata Tertib & Ta'zir</span>
            </div>
          </button>

          <div className="menu-category">LAPORAN & REKAP</div>
          <button 
            className={`nav-link ${activeTab === 'laporan-presensi' ? 'active' : ''}`}
            onClick={() => changeTab('laporan-presensi')}
          >
            <div className="nav-link-left">
              <BarChart3 size={15} />
              <span>Rekap Presensi Harian</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'laporan-tahfidz' ? 'active' : ''}`}
            onClick={() => changeTab('laporan-tahfidz')}
          >
            <div className="nav-link-left">
              <FileText size={15} />
              <span>Laporan Tahfidz & Tasmi'</span>
            </div>
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <button 
              className="btn-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu Navigasi"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <div className="header-right">
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

      {/* Mobile Bottom Navigation Dock */}
      <nav className="mobile-bottom-nav">
        <button 
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => changeTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'presensi' || activeTab === 'laporan-presensi' ? 'active' : ''}`}
          onClick={() => changeTab('presensi')}
        >
          <Fingerprint size={18} />
          <span>Presensi</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'tahfidz' || activeTab === 'laporan-tahfidz' ? 'active' : ''}`}
          onClick={() => changeTab('tahfidz')}
        >
          <BookOpen size={18} />
          <span>Tahfidz</span>
        </button>

        <button 
          className={`mobile-nav-item ${activeTab === 'perizinan' ? 'active' : ''}`}
          onClick={() => changeTab('perizinan')}
        >
          <DoorOpen size={18} />
          <span>Perizinan</span>
        </button>

        <button 
          className={`mobile-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu size={18} />
          <span>Semua Menu</span>
        </button>
      </nav>
    </div>
  );
}
