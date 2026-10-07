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
import AbsensiFingerprintView from '../views/admin/AbsensiFingerprintView';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMasterOpen, setIsMasterOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

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
        return <AbsensiFingerprintView />;
      case 'tahfidz':
        return <TahfidzView />;
      case 'perizinan':
        return <PerizinanView />;
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
      {/* Sidebar Desktop (Dark Navy Aspartech Style) */}
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">P</div>
          <div className="brand-title">
            <h2>PORTAL</h2>
            <p>PESANTREN SYSTEM</p>
          </div>
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
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="nav-link-left">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'presensi' ? 'active' : ''}`}
            onClick={() => setActiveTab('presensi')}
          >
            <div className="nav-link-left">
              <Fingerprint size={15} />
              <span>Presensi & Absensi</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setActiveTab('tahfidz')}
          >
            <div className="nav-link-left">
              <BookOpen size={15} />
              <span>Tahfidz & Muroja'ah</span>
            </div>
          </button>

          <button 
            className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perizinan')}
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
                onClick={() => setActiveTab('master-santri')}
              >
                <span>Data Santri</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-asrama' ? 'active' : ''}`}
                onClick={() => setActiveTab('master-asrama')}
              >
                <span>Data Asrama & Kobong</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-kelas' ? 'active' : ''}`}
                onClick={() => setActiveTab('master-kelas')}
              >
                <span>Data Kelas & Halaqah</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-asatidz' ? 'active' : ''}`}
                onClick={() => setActiveTab('master-asatidz')}
              >
                <span>Data Asatidz & Musyrif</span>
              </button>

              <button 
                className={`nav-sublink ${activeTab === 'master-device' ? 'active' : ''}`}
                onClick={() => setActiveTab('master-device')}
              >
                <span>Data Mesin Fingerprint</span>
              </button>
            </div>
          )}

          <div className="menu-category">KEPESANTRENAN</div>
          <button className="nav-link" onClick={() => setActiveTab('perizinan')}>
            <div className="nav-link-left">
              <ShieldAlert size={15} />
              <span>Tata Tertib & Ta'zir</span>
            </div>
          </button>

          <div className="menu-category">LAPORAN & REKAP</div>
          <button className="nav-link" onClick={() => setActiveTab('presensi')}>
            <div className="nav-link-left">
              <BarChart3 size={15} />
              <span>Rekap Presensi Harian</span>
            </div>
          </button>

          <button className="nav-link" onClick={() => setActiveTab('tahfidz')}>
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
            <button className="btn-hamburger">
              <Menu size={16} />
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
    </div>
  );
}
