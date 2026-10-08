import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Wallet, 
  DoorOpen, 
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  LayoutDashboard,
  Fingerprint,
  Grid,
  X,
  ChevronRight,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import MobileHome from '../views/mobile/MobileHome';
import MobileTahfidz from '../views/mobile/MobileTahfidz';
import MobileSyahriah from '../views/mobile/MobileSyahriah';
import MobileIzin from '../views/mobile/MobileIzin';
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

export default function MobileLayout() {
  const [mobileTab, setMobileTab] = useState('home');
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  const handleSelectTab = (tab) => {
    setMobileTab(tab);
    setIsMenuDrawerOpen(false);
  };

  const renderContent = () => {
    switch (mobileTab) {
      case 'home':
        return <MobileHome onChangeTab={handleSelectTab} />;
      case 'dashboard':
        return <DashboardAdmin />;
      case 'presensi':
      case 'laporan-presensi':
        return <AbsensiFingerprintView />;
      case 'tahfidz':
      case 'laporan-tahfidz':
        return <TahfidzView />;
      case 'perizinan':
      case 'izin':
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
      case 'syahriah':
        return <MobileSyahriah />;
      default:
        return <MobileHome onChangeTab={handleSelectTab} />;
    }
  };

  return (
    <div className="mobile-wrapper">
      <div className="mobile-frame">
        {/* Status Bar Mobile */}
        <div className="mobile-status-bar">
          <span>09:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Signal size={14} />
            <Wifi size={14} />
            <Battery size={16} />
          </div>
        </div>

        {/* Switch to Admin Link Bar */}
        <div style={{ background: '#047857', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 600 }}>App Mobile Santri Portal</span>
          <a href="#dashboard" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textDecoration: 'none' }}>
            💻 Portal Admin
          </a>
        </div>

        {/* Dynamic Mobile Content */}
        <div className="mobile-content">
          {renderContent()}
        </div>

        {/* Mobile Menu Sheet Drawer */}
        {isMenuDrawerOpen && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
            onClick={() => setIsMenuDrawerOpen(false)}
          >
            <div 
              style={{
                background: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '20px 16px 30px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Grid size={18} color="#059669" />
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Daftar Semua Menu Sistem</span>
                </div>
                <button 
                  onClick={() => setIsMenuDrawerOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '4px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                    MAIN MENU
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => handleSelectTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <LayoutDashboard size={16} color="#0284c7" /> Dashboard
                    </button>
                    <button onClick={() => handleSelectTab('presensi')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Fingerprint size={16} color="#7c3aed" /> Presensi
                    </button>
                    <button onClick={() => handleSelectTab('tahfidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <BookOpen size={16} color="#059669" /> Tahfidz
                    </button>
                    <button onClick={() => handleSelectTab('perizinan')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <DoorOpen size={16} color="#2563eb" /> Perizinan
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                    DATA MASTER
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => handleSelectTab('master-santri')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Users size={16} color="#0d9488" /> Data Santri
                    </button>
                    <button onClick={() => handleSelectTab('master-asrama')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Building size={16} color="#d97706" /> Data Asrama
                    </button>
                    <button onClick={() => handleSelectTab('master-kelas')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <GraduationCap size={16} color="#0891b2" /> Data Kelas
                    </button>
                    <button onClick={() => handleSelectTab('master-asatidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Users size={16} color="#9333ea" /> Data Asatidz
                    </button>
                    <button onClick={() => handleSelectTab('master-device')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <HardDrive size={16} color="#475569" /> Fingerprint
                    </button>
                    <button onClick={() => handleSelectTab('tata-tertib')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <ShieldAlert size={16} color="#e11d48" /> Tata Tertib
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                    LAPORAN & REKAP
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => handleSelectTab('laporan-presensi')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <BarChart3 size={16} color="#f97316" /> Rekap Absen
                    </button>
                    <button onClick={() => handleSelectTab('laporan-tahfidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <FileText size={16} color="#0284c7" /> Laporan Tahfidz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${mobileTab === 'home' ? 'active' : ''}`}
            onClick={() => handleSelectTab('home')}
          >
            <Home size={19} />
            <span>Beranda</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => handleSelectTab('tahfidz')}
          >
            <BookOpen size={19} />
            <span>Tahfidz</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'presensi' ? 'active' : ''}`}
            onClick={() => handleSelectTab('presensi')}
          >
            <Fingerprint size={19} />
            <span>Presensi</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => handleSelectTab('perizinan')}
          >
            <DoorOpen size={19} />
            <span>Perizinan</span>
          </button>

          <button 
            className={`mobile-nav-item ${isMenuDrawerOpen ? 'active' : ''}`}
            onClick={() => setIsMenuDrawerOpen(!isMenuDrawerOpen)}
          >
            <Grid size={19} />
            <span>Semua Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
