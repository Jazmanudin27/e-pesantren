import React, { useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import AdminLayout from './components/AdminLayout';
import MobileLayout from './components/MobileLayout';

export default function App() {
  const [viewMode, setViewMode] = useState('admin'); // 'admin' | 'mobile'

  return (
    <div>
      {/* Floating Top Mode Switcher */}
      <div className="mode-switcher-bar">
        <button 
          className={`mode-btn ${viewMode === 'admin' ? 'active' : ''}`}
          onClick={() => setViewMode('admin')}
        >
          <Monitor size={15} /> Admin Desktop
        </button>
        <button 
          className={`mode-btn ${viewMode === 'mobile' ? 'active' : ''}`}
          onClick={() => setViewMode('mobile')}
        >
          <Smartphone size={15} /> Mobile Santri / Wali
        </button>
      </div>

      {/* Render Template */}
      {viewMode === 'admin' ? <AdminLayout /> : <MobileLayout />}
    </div>
  );
}
