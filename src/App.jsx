import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import MobileLayout from './components/MobileLayout';
import MobileKeuanganLayout from './components/MobileKeuanganLayout';
import PortalWaliSantri from './views/wali/PortalWaliSantri';
import SplashScreen from './components/SplashScreen';
import PWAInstallModal from './components/PWAInstallModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const getMode = () => {
    const hostname = window.location.hostname.toLowerCase();
    const hash = window.location.hash;
    const pathname = window.location.pathname;

    // Domain khusus Mobile: mnurulwafa.ruangtech.com / mpesantren
    const isMobileDomain = 
      hostname === 'mnurulwafa.ruangtech.com' ||
      hostname === 'm.nurulwafa.ruangtech.com' ||
      hostname.startsWith('mnurulwafa.') ||
      hostname.startsWith('m.') ||
      hostname === 'mpesantren.aspartech.com' ||
      hostname.startsWith('mpesantren.') ||
      hostname.includes('mpesantren');

    // Cek apakah user sedang login sebagai Wali Santri / URL mengarah ke portal wali
    try {
      const desktopSess = JSON.parse(localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session') || '{}');
      const mobileSess = JSON.parse(localStorage.getItem('mobile_session') || '{}');
      const role = String(desktopSess.role || mobileSess.role || '').toLowerCase();
      if (role === 'wali' || role === 'wali santri' || hash.startsWith('#wali') || pathname.startsWith('/wali')) {
        return 'wali';
      }

      // Cek apakah user adalah Akun Bendahara / Keuangan di perangkat mobile
      const rMob = String(mobileSess.role || mobileSess.userType || mobileSess.username || '').toLowerCase();
      const rDesk = String(desktopSess.role || desktopSess.userType || desktopSess.username || '').toLowerCase();
      const isBendahara = rMob.includes('bendahara') || rMob.includes('keuangan') || rDesk.includes('bendahara') || rDesk.includes('keuangan');
      if (isBendahara && (isMobileDomain || hash.startsWith('#mobile') || pathname.startsWith('/mobile') || !hash || hash === '#')) {
        return 'keuangan-mobile';
      }
    } catch (e) {}

    if (isMobileDomain || hash.startsWith('#mobile') || pathname.startsWith('/mobile')) {
      return 'mobile';
    }
    return 'admin';
  };

  const [mode, setMode] = useState(getMode);

  useEffect(() => {
    const handleLocationChange = () => {
      const currentMode = getMode();
      setMode(currentMode);
      if (currentMode === 'mobile' || currentMode === 'wali' || currentMode === 'keuangan-mobile') {
        document.title = 'NWF Mobile';
      } else {
        document.title = 'NWF Pesantren';
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <PWAInstallModal />
      {mode === 'wali' ? (
        <PortalWaliSantri onLogout={() => { window.location.hash = '#login'; setMode(getMode()); }} />
      ) : mode === 'keuangan-mobile' ? (
        <MobileKeuanganLayout />
      ) : mode === 'mobile' ? (
        <MobileLayout />
      ) : (
        <AdminLayout />
      )}
    </>
  );
}
