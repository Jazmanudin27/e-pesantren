import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Wallet, 
  DoorOpen, 
  User,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import MobileHome from '../views/mobile/MobileHome';
import MobileTahfidz from '../views/mobile/MobileTahfidz';
import MobileSyahriah from '../views/mobile/MobileSyahriah';
import MobileIzin from '../views/mobile/MobileIzin';

export default function MobileLayout() {
  const [mobileTab, setMobileTab] = useState('home');

  const renderContent = () => {
    switch (mobileTab) {
      case 'home':
        return <MobileHome onChangeTab={setMobileTab} />;
      case 'tahfidz':
        return <MobileTahfidz />;
      case 'syahriah':
        return <MobileSyahriah />;
      case 'izin':
        return <MobileIzin />;
      default:
        return <MobileHome onChangeTab={setMobileTab} />;
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

        {/* Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${mobileTab === 'home' ? 'active' : ''}`}
            onClick={() => setMobileTab('home')}
          >
            <Home size={20} />
            <span>Beranda</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setMobileTab('tahfidz')}
          >
            <BookOpen size={20} />
            <span>Tahfidz</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'syahriah' ? 'active' : ''}`}
            onClick={() => setMobileTab('syahriah')}
          >
            <Wallet size={20} />
            <span>Syahriah</span>
          </button>

          <button 
            className={`mobile-nav-item ${mobileTab === 'izin' ? 'active' : ''}`}
            onClick={() => setMobileTab('izin')}
          >
            <DoorOpen size={20} />
            <span>Izin</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
