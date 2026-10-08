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
  Wifi,
  Battery,
  Signal,
  ArrowLeft
} from 'lucide-react';
import MobileHome from '../views/mobile/MobileHome';
import MobileTahfidz from '../views/mobile/MobileTahfidz';
import MobileSyahriah from '../views/mobile/MobileSyahriah';
import MobileIzin from '../views/mobile/MobileIzin';
import MobileDashboard from '../views/mobile/MobileDashboard';
import MobilePresensi from '../views/mobile/MobilePresensi';
import MobileSantri from '../views/mobile/MobileSantri';
import MobileAsrama from '../views/mobile/MobileAsrama';
import MobileKelas from '../views/mobile/MobileKelas';
import MobileAsatidz from '../views/mobile/MobileAsatidz';
import MobileDevice from '../views/mobile/MobileDevice';
import MobileTataTertib from '../views/mobile/MobileTataTertib';
import MobileLaporanPresensi from '../views/mobile/MobileLaporanPresensi';
import MobileLaporanTahfidz from '../views/mobile/MobileLaporanTahfidz';

export default function MobileLayout() {
  const [mobileTab, setMobileTab] = useState('home');
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  const handleSelectTab = (tab) => {
    setMobileTab(tab);
    setIsMenuDrawerOpen(false);
  };

  const getSubmenuTitle = () => {
    switch (mobileTab) {
      case 'dashboard': return 'Dashboard System';
      case 'presensi': return 'Presensi & Absensi';
      case 'tahfidz': return 'Tahfidz & Muroja\'ah';
      case 'perizinan':
      case 'izin': return 'Perizinan & Gerbang';
      case 'master-santri': return 'Data Santri';
      case 'master-asrama': return 'Data Asrama & Kobong';
      case 'master-kelas': return 'Data Kelas & Halaqah';
      case 'master-asatidz': return 'Data Asatidz & Musyrif';
      case 'master-device': return 'Data Mesin Fingerprint';
      case 'tata-tertib': return 'Tata Tertib & Ta\'zir';
      case 'laporan-presensi': return 'Rekap Presensi Harian';
      case 'laporan-tahfidz': return 'Laporan Tahfidz & Tasmi\'';
      case 'syahriah': return 'Syahriah & Uang Saku';
      default: return '';
    }
  };

  const isOtherMenuActive = [
    'dashboard', 'master-santri', 'master-asrama', 'master-kelas', 
    'master-asatidz', 'master-device', 'tata-tertib', 
    'laporan-presensi', 'laporan-tahfidz', 'syahriah'
  ].includes(mobileTab);

  const renderContent = () => {
    switch (mobileTab) {
      case 'home':
        return <MobileHome onChangeTab={handleSelectTab} />;
      case 'dashboard':
        return <MobileDashboard />;
      case 'presensi':
        return <MobilePresensi />;
      case 'tahfidz':
        return <MobileTahfidz />;
      case 'perizinan':
      case 'izin':
        return <MobileIzin />;
      case 'master-santri':
        return <MobileSantri />;
      case 'master-asrama':
        return <MobileAsrama />;
      case 'master-kelas':
        return <MobileKelas />;
      case 'master-asatidz':
        return <MobileAsatidz />;
      case 'master-device':
        return <MobileDevice />;
      case 'tata-tertib':
        return <MobileTataTertib />;
      case 'laporan-presensi':
        return <MobileLaporanPresensi />;
      case 'laporan-tahfidz':
        return <MobileLaporanTahfidz />;
      case 'syahriah':
        return <MobileSyahriah />;
      default:
        return <MobileHome onChangeTab={handleSelectTab} />;
    }
  };

  return (
    <div className="mobile-wrapper">
      <div className="mobile-app-container">
        {/* Sub-Menu Top Navigation Header (Excludes Beranda/Home) */}
        {mobileTab !== 'home' && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            position: 'sticky',
            top: 0,
            zIndex: 20
          }}>
            <button 
              onClick={() => handleSelectTab('home')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                padding: '5px 9px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 700
              }}
            >
              <ArrowLeft size={15} /> Beranda
            </button>

            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', textAlign: 'center', flex: 1, margin: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {getSubmenuTitle()}
            </span>

            <div style={{ width: '75px' }} />
          </div>
        )}

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
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>Daftar Semua Menu Mobile</span>
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
                    <button onClick={() => handleSelectTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'dashboard' ? '#e0f2fe' : '#f8fafc', border: mobileTab === 'dashboard' ? '1px solid #0284c7' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <LayoutDashboard size={16} color="#0284c7" /> Dashboard
                    </button>
                    <button onClick={() => handleSelectTab('presensi')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'presensi' ? '#f3e8ff' : '#f8fafc', border: mobileTab === 'presensi' ? '1px solid #7c3aed' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Fingerprint size={16} color="#7c3aed" /> Presensi
                    </button>
                    <button onClick={() => handleSelectTab('tahfidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'tahfidz' ? '#dcfce7' : '#f8fafc', border: mobileTab === 'tahfidz' ? '1px solid #059669' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <BookOpen size={16} color="#059669" /> Tahfidz
                    </button>
                    <button onClick={() => handleSelectTab('perizinan')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: (mobileTab === 'perizinan' || mobileTab === 'izin') ? '#dbeafe' : '#f8fafc', border: (mobileTab === 'perizinan' || mobileTab === 'izin') ? '1px solid #2563eb' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <DoorOpen size={16} color="#2563eb" /> Perizinan
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                    DATA MASTER
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => handleSelectTab('master-santri')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'master-santri' ? '#ccfbf1' : '#f8fafc', border: mobileTab === 'master-santri' ? '1px solid #0d9488' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Users size={16} color="#0d9488" /> Data Santri
                    </button>
                    <button onClick={() => handleSelectTab('master-asrama')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'master-asrama' ? '#fef3c7' : '#f8fafc', border: mobileTab === 'master-asrama' ? '1px solid #d97706' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Building size={16} color="#d97706" /> Data Asrama
                    </button>
                    <button onClick={() => handleSelectTab('master-kelas')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'master-kelas' ? '#cffaff' : '#f8fafc', border: mobileTab === 'master-kelas' ? '1px solid #0891b2' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <GraduationCap size={16} color="#0891b2" /> Data Kelas
                    </button>
                    <button onClick={() => handleSelectTab('master-asatidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'master-asatidz' ? '#f3e8ff' : '#f8fafc', border: mobileTab === 'master-asatidz' ? '1px solid #9333ea' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Users size={16} color="#9333ea" /> Data Asatidz
                    </button>
                    <button onClick={() => handleSelectTab('master-device')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'master-device' ? '#e2e8f0' : '#f8fafc', border: mobileTab === 'master-device' ? '1px solid #475569' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <HardDrive size={16} color="#475569" /> Fingerprint
                    </button>
                    <button onClick={() => handleSelectTab('tata-tertib')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'tata-tertib' ? '#ffe4e6' : '#f8fafc', border: mobileTab === 'tata-tertib' ? '1px solid #be123c' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <ShieldAlert size={16} color="#be123c" /> Tata Tertib
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '8px' }}>
                    LAPORAN & KEUANGAN
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <button onClick={() => handleSelectTab('laporan-presensi')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'laporan-presensi' ? '#ffedd5' : '#f8fafc', border: mobileTab === 'laporan-presensi' ? '1px solid #ea580c' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <BarChart3 size={16} color="#ea580c" /> Rekap Absen
                    </button>
                    <button onClick={() => handleSelectTab('laporan-tahfidz')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'laporan-tahfidz' ? '#e0f2fe' : '#f8fafc', border: mobileTab === 'laporan-tahfidz' ? '1px solid #0284c7' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <FileText size={16} color="#0284c7" /> Laporan Tahfidz
                    </button>
                    <button onClick={() => handleSelectTab('syahriah')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: mobileTab === 'syahriah' ? '#fef3c7' : '#f8fafc', border: mobileTab === 'syahriah' ? '1px solid #d97706' : '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                      <Wallet size={16} color="#d97706" /> Syahriah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
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
            className={`mobile-nav-item ${(mobileTab === 'perizinan' || mobileTab === 'izin') ? 'active' : ''}`}
            onClick={() => handleSelectTab('perizinan')}
          >
            <DoorOpen size={19} />
            <span>Perizinan</span>
          </button>

          <button 
            className={`mobile-nav-item ${(isMenuDrawerOpen || isOtherMenuActive) ? 'active' : ''}`}
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
