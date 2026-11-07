import React from 'react';
import {
  CreditCard,
  DollarSign,
  Wallet,
  BarChart3,
  Heart,
  Users,
  Receipt,
  AlertTriangle,
  Building2,
  Smartphone,
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
  userSelect: 'none'
};

const menuLabelStyle = {
  fontSize: '0.67rem',
  fontWeight: 700,
  color: '#334155',
  lineHeight: 1.2,
  maxWidth: '68px',
  display: 'block'
};

export default function MenuLayananKeuangan({
  onChangeTab,
  onOpenDetailKas,
  onRefresh,
  loading
}) {
  const menuList = [
    {
      id: 'keuangan-kasir',
      name: 'Kasir Loket',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: '0 6px 16px -2px rgba(16, 185, 129, 0.38)',
      icon: <CreditCard size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-spp',
      name: 'Tagihan SPP',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: '0 6px 16px -2px rgba(59, 130, 246, 0.38)',
      icon: <DollarSign size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-masuk',
      name: 'Biaya Masuk',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: '0 6px 16px -2px rgba(245, 158, 11, 0.38)',
      icon: <Building2 size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-rekap',
      name: 'Rekap Kas',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadow: '0 6px 16px -2px rgba(139, 92, 246, 0.38)',
      icon: <BarChart3 size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'tabungan',
      name: 'Tabungan',
      gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      shadow: '0 6px 16px -2px rgba(20, 184, 166, 0.38)',
      icon: <Wallet size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'laporan-infak',
      name: 'Infak Ponpes',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      shadow: '0 6px 16px -2px rgba(236, 72, 153, 0.38)',
      icon: <Heart size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'whatsapp-gateway',
      name: 'Broadcast WA',
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      shadow: '0 6px 16px -2px rgba(34, 197, 94, 0.38)',
      icon: <Smartphone size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-transaksi',
      name: 'QRIS & VA',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
      shadow: '0 6px 16px -2px rgba(6, 182, 212, 0.38)',
      icon: <Receipt size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'keuangan-tunggakan',
      name: 'Tunggakan',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadow: '0 6px 16px -2px rgba(239, 68, 68, 0.38)',
      icon: <AlertTriangle size={23} strokeWidth={2.3} color="#ffffff" />
    },
    {
      id: 'master-santri',
      name: 'Data Santri',
      gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      shadow: '0 6px 16px -2px rgba(100, 116, 139, 0.38)',
      icon: <Users size={23} strokeWidth={2.3} color="#ffffff" />
    }
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      padding: '14px 12px',
      boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)',
      marginBottom: '18px'
    }}>
      {/* Header Menu Layanan */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px'
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
            fontWeight: 700
          }}
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Grid Menu Icons Persis Style Orang Tua */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px 4px',
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
