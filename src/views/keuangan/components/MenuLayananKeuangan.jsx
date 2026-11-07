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
      desc: 'Bayar SPP',
      color: '#059669',
      bg: '#ecfdf5',
      icon: <CreditCard size={22} color="#059669" />
    },
    {
      id: 'keuangan-spp',
      name: 'Tagihan SPP',
      desc: 'Rutin Bulanan',
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: <DollarSign size={22} color="#0284c7" />
    },
    {
      id: 'keuangan-masuk',
      name: 'Biaya Masuk',
      desc: 'DSP & Pangkal',
      color: '#d97706',
      bg: '#fffbeb',
      icon: <Building2 size={22} color="#d97706" />
    },
    {
      id: 'keuangan-rekap',
      name: 'Rekap Kas',
      desc: 'Laporan Masuk',
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: <BarChart3 size={22} color="#7c3aed" />
    },
    {
      id: 'tabungan',
      name: 'Tabungan',
      desc: 'Uang Saku',
      color: '#0d9488',
      bg: '#f0fdfa',
      icon: <Wallet size={22} color="#0d9488" />
    },
    {
      id: 'laporan-infak',
      name: 'Infak Sedekah',
      desc: 'Donasi Ponpes',
      color: '#ec4899',
      bg: '#fdf2f8',
      icon: <Heart size={22} color="#ec4899" />
    },
    {
      id: 'whatsapp-gateway',
      name: 'Broadcast WA',
      desc: 'Kirim Tagihan',
      color: '#10b981',
      bg: '#ecfdf5',
      icon: <Smartphone size={22} color="#10b981" />
    },
    {
      id: 'keuangan-transaksi',
      name: 'QRIS & VA',
      desc: 'Mutasi Online',
      color: '#2563eb',
      bg: '#eff6ff',
      icon: <Receipt size={22} color="#2563eb" />
    },
    {
      id: 'keuangan-tunggakan',
      name: 'Tunggakan',
      desc: 'Santri Piutang',
      color: '#dc2626',
      bg: '#fef2f2',
      icon: <AlertTriangle size={22} color="#dc2626" />
    },
    {
      id: 'master-santri',
      name: 'Data Santri',
      desc: 'Biodata & Wali',
      color: '#475569',
      bg: '#f8fafc',
      icon: <Users size={22} color="#475569" />
    }
  ];

  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '4px', height: '14px', background: '#059669', borderRadius: '4px' }} />
          <span>Menu Layanan Keuangan</span>
        </div>
        <button
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700 }}
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
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
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '12px 6px',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '84px',
              transition: '0.2s'
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: m.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px'
            }}>
              {m.icon}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
              {m.name}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>
              {m.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

