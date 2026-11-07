import React from 'react';
import {
  CreditCard,
  Receipt,
  Wallet,
  Heart,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

const squircleIconStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '6px',
  transition: 'transform 0.15s ease'
};

const menuCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
  userSelect: 'none',
  outline: 'none',
  WebkitTapHighlightColor: 'transparent'
};

const menuLabelStyle = {
  fontSize: '0.68rem',
  fontWeight: 700,
  color: '#334155',
  lineHeight: 1.25,
  maxWidth: '72px',
  display: 'block'
};

export default function MenuLayananKeuangan({
  onChangeTab,
  onOpenDetailKas,
  onRefresh,
  loading
}) {
  // Hanya 5 Menu Resmi: Kasir, Histori, Tabungan, Infak Ponpes, Tunggakan
  const menuList = [
    {
      id: 'keuangan-kasir',
      name: 'Kasir',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: '0 6px 16px -2px rgba(16, 185, 129, 0.38)',
      icon: <CreditCard size={22} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-rekap',
      name: 'Histori',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: '0 6px 16px -2px rgba(59, 130, 246, 0.38)',
      icon: <Receipt size={22} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'tabungan',
      name: 'Tabungan',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      shadow: '0 6px 16px -2px rgba(20, 184, 166, 0.38)',
      icon: <Wallet size={22} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'laporan-infak',
      name: 'Infak Ponpes',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      shadow: '0 6px 16px -2px rgba(236, 72, 153, 0.38)',
      icon: <Heart size={22} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-tunggakan',
      name: 'Tunggakan',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadow: '0 6px 16px -2px rgba(239, 68, 68, 0.38)',
      icon: <AlertTriangle size={22} strokeWidth={2.3} color="#ffffff" />
    }
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      padding: '14px 10px',
      boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)',
      marginBottom: '18px'
    }}>
      {/* Header Menu Layanan */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '0 4px'
      }}>
        <div style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          letterSpacing: '-0.2px'
        }}>
          <span style={{
            width: '4px',
            height: '14px',
            background: '#0d766e',
            borderRadius: '4px'
          }} />
          <span>Menu Layanan Keuangan</span>
        </div>

        <button
          onClick={onRefresh}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#0d766e',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.74rem',
            fontWeight: 700,
            outline: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Grid 4 Kolom Menu Layanan (Kasir, Histori, Tabungan, Infak Ponpes, Tunggakan) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px 6px',
        justifyItems: 'center'
      }}>
        {menuList.map((m) => (
          <div
            key={m.id}
            onClick={() => {
              if (m.id === 'keuangan-rekap') {
                onOpenDetailKas();
              } else {
                onChangeTab(m.id);
              }
            }}
            style={menuCardStyle}
          >
            <div style={{
              ...squircleIconStyle,
              background: m.gradient,
              boxShadow: m.shadow
            }}>
              {m.icon}
            </div>
            <span style={menuLabelStyle}>
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
