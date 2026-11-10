import React, { useState, useEffect } from 'react';
import {
  Home,
  CreditCard,
  FileText,
  BarChart3,
  User,
  Wallet,
  Heart,
  Send,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  Receipt,
  Menu,
  X,
  LogOut,
  Smartphone,
  Settings
} from 'lucide-react';
import MobileHomeKeuangan from '../views/keuangan/MobileHomeKeuangan';
import MobileKeuangan from '../views/mobile/MobileKeuangan';
import MobileTabungan from '../views/mobile/MobileTabungan';
import MobileProfil from '../views/mobile/MobileProfil';
import MobileSantri from '../views/mobile/MobileSantri';
import MobileLogin from '../views/mobile/MobileLogin';
import LaporanInfakAdminView from '../views/keuangan/LaporanInfakAdminView';
import RincianKasMasukView from '../views/keuangan/RincianKasMasukView';
import BukuKasView from '../views/keuangan/BukuKasView';
import TunggakanSppView from '../views/keuangan/TunggakanSppView';
import WhatsAppGatewayView from '../views/admin/WhatsAppGatewayView';

export default function MobileKeuanganLayout() {
  const [session, setSession] = useState(() => {
    try {
      const s = localStorage.getItem('mobile_session') || localStorage.getItem('desktop_session');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== 'mobile' && hash !== 'home' && hash !== 'keuangan-spp') return hash;
    return 'home';
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'mobile' && hash !== 'home') {
        setActiveTab(hash);
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    setIsDrawerOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('mobile_session');
    localStorage.removeItem('desktop_session');
    localStorage.removeItem('token');
    setSession(null);
    window.location.hash = '';
    window.location.reload();
  };

  if (!session) {
    return (
      <MobileLogin
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          setActiveTab('home');
          window.location.hash = '';
        }}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileHomeKeuangan onChangeTab={handleSelectTab} onLogout={handleLogout} />;
      case 'rincian-kas':
      case 'kas-masuk':
      case 'rincian-kas-masuk':
        return <RincianKasMasukView onBackToHome={() => handleSelectTab('home')} onChangeTab={handleSelectTab} />;
      case 'buku-kas':
      case 'kantong-kas':
      case 'kantong-saldo':
        return <BukuKasView onBackToHome={() => handleSelectTab('home')} />;
      case 'keuangan-spp':
      case 'spp':
      case 'keuangan-kasir':
      case 'kasir':
      case 'keuangan-generate':
      case 'generate':
        return <MobileKeuangan initialSubTab="kasir" onBackToHome={() => handleSelectTab('home')} />;
      case 'keuangan-rekap':
      case 'laporan':
      case 'rekap':
        return <MobileKeuangan initialSubTab="laporan" onBackToHome={() => handleSelectTab('home')} />;
      case 'keuangan-masuk':
      case 'biaya-masuk':
        return <MobileKeuangan initialSubTab="masuk" onBackToHome={() => handleSelectTab('home')} />;
      case 'keuangan-tunggakan':
      case 'tunggakan':
        return <TunggakanSppView onBackToHome={() => handleSelectTab('home')} onChangeTab={handleSelectTab} />;
      case 'keuangan-transaksi':
      case 'transaksi':
        return <MobileKeuangan initialSubTab="transaksi" onBackToHome={() => handleSelectTab('home')} />;
      case 'tabungan':
        return <MobileTabungan onBackToHome={() => handleSelectTab('home')} />;
      case 'laporan-infak':
      case 'infak':
        return <LaporanInfakAdminView onBackToHome={() => handleSelectTab('home')} />;
      case 'whatsapp-gateway':
      case 'whatsapp':
        return <WhatsAppGatewayView onBackToHome={() => handleSelectTab('home')} />;
      case 'master-santri':
      case 'santri':
        return <MobileSantri onBackToHome={() => handleSelectTab('home')} />;
      case 'profil':
      case 'setting':
      case 'settings':
        return <MobileProfil onChangeTab={handleSelectTab} onLogout={handleLogout} />;
      default:
        return <MobileHomeKeuangan onChangeTab={handleSelectTab} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="mobile-wrapper" style={{ background: '#064e3b', minHeight: '100vh' }}>
      <div className="mobile-app-container" style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative', paddingBottom: '76px' }}>
        
        {/* Main View Body */}
        {renderContent()}

        {/* Floating White Bottom Navigation Bar Khusus Keuangan */}
        <nav className="mobile-bottom-nav" style={{ zIndex: 100 }}>
          {/* 1. Beranda */}
          <button
            className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleSelectTab('home')}
            style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`nav-icon-wrapper ${activeTab === 'home' ? 'active' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Kasir Pembayaran */}
          <button
            className={`mobile-nav-item ${(activeTab === 'keuangan-kasir' || activeTab === 'kasir' || activeTab === 'keuangan-spp' || activeTab === 'spp') ? 'active' : ''}`}
            onClick={() => handleSelectTab('keuangan-kasir')}
            style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`nav-icon-wrapper ${(activeTab === 'keuangan-kasir' || activeTab === 'kasir' || activeTab === 'keuangan-spp' || activeTab === 'spp') ? 'active' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
              <CreditCard size={20} />
            </div>
            <span>Kasir</span>
          </button>

          {/* 3. Buku Kas & 3 Kantong */}
          <button
            className={`mobile-nav-item ${(activeTab === 'buku-kas' || activeTab === 'kantong-kas' || activeTab === 'kantong-saldo') ? 'active' : ''}`}
            onClick={() => handleSelectTab('buku-kas')}
            style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`nav-icon-wrapper ${(activeTab === 'buku-kas' || activeTab === 'kantong-kas' || activeTab === 'kantong-saldo') ? 'active' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
              <Wallet size={20} />
            </div>
            <span>Buku Kas</span>
          </button>

          {/* 4. Laporan Rekap */}
          <button
            className={`mobile-nav-item ${(activeTab === 'keuangan-rekap' || activeTab === 'laporan' || activeTab === 'rekap') ? 'active' : ''}`}
            onClick={() => handleSelectTab('keuangan-rekap')}
            style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`nav-icon-wrapper ${(activeTab === 'keuangan-rekap' || activeTab === 'laporan' || activeTab === 'rekap') ? 'active' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
              <BarChart3 size={20} />
            </div>
            <span>Laporan</span>
          </button>

          {/* 5. Setting */}
          <button
            className={`mobile-nav-item ${(activeTab === 'profil' || activeTab === 'setting' || activeTab === 'settings') ? 'active' : ''}`}
            onClick={() => handleSelectTab('setting')}
            style={{ outline: 'none', border: 'none', boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`nav-icon-wrapper ${(activeTab === 'profil' || activeTab === 'setting' || activeTab === 'settings') ? 'active' : ''}`} style={{ outline: 'none', border: 'none', boxShadow: 'none' }}>
              <Settings size={20} />
            </div>
            <span>Setting</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

