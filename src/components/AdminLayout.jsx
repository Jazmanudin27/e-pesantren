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
  ChevronRight,
  ChevronDown,
  FileText,
  BarChart3,
  Clock
} from 'lucide-react';
import DashboardAdmin from '../views/admin/DashboardAdmin';
import SantriView from '../views/admin/SantriView';
import TahfidzView from '../views/admin/TahfidzView';
import PerizinanView from '../views/admin/PerizinanView';
import AbsensiFingerprintView from '../views/admin/AbsensiFingerprintView';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('presensi');
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
      case 'santri':
        return <SantriView />;
      case 'tahfidz':
        return <TahfidzView />;
      case 'perizinan':
        return <PerizinanView />;
      default:
        return <AbsensiFingerprintView />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Desktop (Exact Dark Navy Aspartech Style) */}
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
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <button 
            className={`nav-link ${activeTab === 'presensi' ? 'active' : ''}`}
            onClick={() => setActiveTab('presensi')}
          >
            <div className="nav-link-left">
              <Fingerprint size={15} />
              <span>Presensi & Absensi</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <button 
            className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setActiveTab('tahfidz')}
          >
            <div className="nav-link-left">
              <BookOpen size={15} />
              <span>Tahfidz & Muroja'ah</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <div className="menu-category">KEPESANTRENAN & SANTRI</div>
          <button 
            className={`nav-link ${activeTab === 'santri' ? 'active' : ''}`}
            onClick={() => setActiveTab('santri')}
          >
            <div className="nav-link-left">
              <Users size={15} />
              <span>Data Santri & Asrama</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <button 
            className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perizinan')}
          >
            <div className="nav-link-left">
              <DoorOpen size={15} />
              <span>Perizinan & Gerbang</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <button className="nav-link" onClick={() => setActiveTab('tata-tertib')}>
            <div className="nav-link-left">
              <ShieldAlert size={15} />
              <span>Tata Tertib & Ta'zir</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <div className="menu-category">LAPORAN & REKAP</div>
          <button className="nav-link" onClick={() => setActiveTab('presensi')}>
            <div className="nav-link-left">
              <BarChart3 size={15} />
              <span>Rekap Presensi Harian</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
          </button>

          <button className="nav-link" onClick={() => setActiveTab('perizinan')}>
            <div className="nav-link-left">
              <FileText size={15} />
              <span>Laporan Perizinan</span>
            </div>
            <ChevronRight size={13} className="nav-chevron" />
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
              <span>{currentTime || '7 Oktober 2026 • 22:53:43'}</span>
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
