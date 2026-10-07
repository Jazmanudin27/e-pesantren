import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  DoorOpen, 
  GraduationCap, 
  ShieldAlert, 
  Settings, 
  Bell, 
  Search, 
  Fingerprint,
  Building2
} from 'lucide-react';
import DashboardAdmin from '../views/admin/DashboardAdmin';
import SantriView from '../views/admin/SantriView';
import TahfidzView from '../views/admin/TahfidzView';
import PerizinanView from '../views/admin/PerizinanView';

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardAdmin />;
      case 'santri':
        return <SantriView />;
      case 'tahfidz':
        return <TahfidzView />;
      case 'perizinan':
        return <PerizinanView />;
      default:
        return <DashboardAdmin />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar Desktop */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Building2 size={18} />
          </div>
          <div className="brand-info">
            <h2>E-PESANTREN</h2>
            <p>Pondok Pesantren Terpadu</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-category">Utama</div>
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={15} /> Dashboard
          </button>

          <div className="menu-category">Kepesantrenan & Santri</div>
          <button 
            className={`nav-link ${activeTab === 'santri' ? 'active' : ''}`}
            onClick={() => setActiveTab('santri')}
          >
            <Users size={15} /> Data Santri & Asrama
          </button>
          <button 
            className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setActiveTab('tahfidz')}
          >
            <BookOpen size={15} /> Tahfidz & Muroja'ah
          </button>
          <button 
            className={`nav-link ${activeTab === 'absensi-fp' ? 'active' : ''}`}
            onClick={() => setActiveTab('absensi-fp')}
          >
            <Fingerprint size={15} /> Absensi Fingerprint Shalat
          </button>
          <button 
            className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perizinan')}
          >
            <DoorOpen size={15} /> Perizinan Gerbang
          </button>
          <button className="nav-link" onClick={() => setActiveTab('asatidz')}>
            <GraduationCap size={15} /> Asatidz & Musyrif
          </button>

          <div className="menu-category">Kedisiplinan & Sistem</div>
          <button className="nav-link" onClick={() => setActiveTab('tata-tertib')}>
            <ShieldAlert size={15} /> Pelanggaran & Ta'zir
          </button>
          <button className="nav-link" onClick={() => setActiveTab('pengaturan')}>
            <Settings size={15} /> Pengaturan Mesin FP
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-search">
            <Search size={14} color="#94a3b8" />
            <input type="text" placeholder="Cari santri, kobong, perizinan..." />
          </div>

          <div className="header-user">
            <button className="btn btn-outline btn-sm" style={{ padding: '4px', borderRadius: '50%' }}>
              <Bell size={14} />
            </button>
            <div className="user-avatar">AD</div>
            <div style={{ fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 700 }}>Ust. Administrator</div>
              <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>Pengasuh Pondok</div>
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
