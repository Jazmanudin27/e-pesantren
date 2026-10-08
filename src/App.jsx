import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import MobileLayout from './components/MobileLayout';

export default function App() {
  const getMode = () => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    if (hash.startsWith('#mobile') || pathname.startsWith('/mobile')) {
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

  if (mode === 'mobile') {
    return <MobileLayout />;
  }

  return <AdminLayout />;
}
