import React, { useState } from 'react';
import ScanBarcodeView from '../admin/ScanBarcodeView';
import AbsensiFingerprintView from '../admin/AbsensiFingerprintView';
import { Camera, BookOpen } from 'lucide-react';

export default function PengajarAbsenMengaji() {
  // 'scan' (Kamera Wajah & Barcode Scanner) | 'rekap' (Data Absensi Mengaji Admin)
  const [activeMode, setActiveMode] = useState('scan');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Switcher Tab Murni Admin: Scanner vs Rekap Absensi */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
          padding: '6px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('scan')}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '10px',
            border: 'none',
            background:
              activeMode === 'scan'
                ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)'
                : 'transparent',
            color: activeMode === 'scan' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            boxShadow:
              activeMode === 'scan'
                ? '0 2px 8px rgba(13, 148, 136, 0.28)'
                : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Camera size={16} />
          <span>Kamera Scanner (Wajah AI &amp; Barcode)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('rekap')}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '10px',
            border: 'none',
            background:
              activeMode === 'rekap'
                ? 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)'
                : 'transparent',
            color: activeMode === 'rekap' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            boxShadow:
              activeMode === 'rekap'
                ? '0 2px 8px rgba(13, 118, 110, 0.25)'
                : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <BookOpen size={16} />
          <span>Data Rekap Absensi Mengaji</span>
        </button>
      </div>

      {/* Render Komponen Murni Admin */}
      <div style={{ width: '100%', minHeight: '500px' }}>
        {activeMode === 'scan' ? (
          <ScanBarcodeView />
        ) : (
          <AbsensiFingerprintView initialType="kegiatan" />
        )}
      </div>
    </div>
  );
}
