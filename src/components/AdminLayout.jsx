import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Wallet, 
  DoorOpen, 
  GraduationCap, 
  Calendar, 
  BookMarked, 
  ShieldAlert, 
  Settings, 
  Bell, 
  Search, 
  LogOut,
  Building2
} from 'lucide-react';
import DashboardAdmin from '../views/admin/DashboardAdmin';
import SantriView from '../views/admin/SantriView';
import TahfidzView from '../views/admin/TahfidzView';
import SyahriahView from '../views/admin/SyahriahView';
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
      case 'syahriah':
        return <SyahriahView />;
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
            <Building2 size={24} />
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
            <LayoutDashboard size={18} /> Dashboard Pondok
          </button>

          <div className="menu-category">Kepesantrenan & Santri</div>
          <button 
            className={`nav-link ${activeTab === 'santri' ? 'active' : ''}`}
            onClick={() => setActiveTab('santri')}
          >
            <Users size={18} /> Data Santri & Asrama
          </button>
          <button 
            className={`nav-link ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setActiveTab('tahfidz')}
          >
            <BookOpen size={18} /> Tahfidz & Muroja'ah
          </button>
          <button 
            className={`nav-link ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perizinan')}
          >
            <DoorOpen size={18} /> Perizinan Santri
          </button>
          <button className="nav-link" onClick={() => setActiveTab('diniyah')}>
            <BookMarked size={18} /> Madrasah Diniyah / Kitab
          </button>
          <button className="nav-link" onClick={() => setActiveTab('asatidz')}>
            <GraduationCap size={18} /> Asatidz & Pengasuh
          </button>

          <div className="menu-category">Keuangan & Administrasi</div>
          <button 
            className={`nav-link ${activeTab === 'syahriah' ? 'active' : ''}`}
            onClick={() => setActiveTab('syahriah')}
          >
            <Wallet size={18} /> Syahriah & SPP
          </button>
          <button className="nav-link" onClick={() => setActiveTab('tata-tertib')}>
            <ShieldAlert size={18} /> Pelanggaran / Ta'zir
          </button>
          <button className="nav-link" onClick={() => setActiveTab('kalender')}>
            <Calendar size={18} /> Kalender Hijriah / Kegiatan
          </button>
          <button className="nav-link" onClick={() => setActiveTab('pengaturan')}>
            <Settings size={18} /> Pengaturan Pesantren
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} color="#94a3b8" />
            <input type="text" placeholder="Cari santri, nomor kamar, tagihan..." />
          </div>

          <div className="header-user">
            <button className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%' }}>
              <Bell size={18} />
            </button>
            <div className="user-avatar">AD</div>
            <div style={{ fontSize: '0.88rem' }}>
              <div style={{ fontWeight: 700 }}>Ust. Administrator</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Pengasuh Pondok</div>
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
