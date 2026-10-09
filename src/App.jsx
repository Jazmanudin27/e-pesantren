import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import MobileLayout from './components/MobileLayout';
import SplashScreen from './components/SplashScreen';

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

    if (isMobileDomain || hash.startsWith('#mobile') || pathname.startsWith('/mobile')) {
      return 'mobile';
    }
    return 'admin';
  };

  const [mode, setMode] = useState(getMode);

  useEffect(() => {
    const handleLocationChange = () => {
      setMode(getMode());
    };

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
      {mode === 'mobile' ? <MobileLayout /> : <AdminLayout />}
    </>
  );
}
