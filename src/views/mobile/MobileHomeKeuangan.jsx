import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  Wallet,
  BarChart3,
  Heart,
  Send,
  Users,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  Smartphone
} from 'lucide-react';
import { showConfirm, toastSuccess } from '../../utils/alert.util';

export default function MobileHomeKeuangan({ onChangeTab, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [summary, setSummary] = useState({
    total_kas_masuk_sah: 0,
    total_nominal_terbayar: 0,
    total_nominal_tertunggak: 0,
    jumlah_tagihan_lunas: 0,
    jumlah_tagihan_tertunggak: 0
  });
  const [recentTrx, setRecentTrx] = useState([]);
  const [saldoTabunganTotal, setSaldoTabunganTotal] = useState(0);

  // State Pengaturan Siklus Tagihan SPP
  const [siklusSpp, setSiklusSpp] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10
  });
  const [isSiklusModalOpen, setIsSiklusModalOpen] = useState(false);
  const [siklusForm, setSiklusForm] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    apply_to_existing: true
  });
  const [savingSiklus, setSavingSiklus] = useState(false);

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const fetchKeuanganSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/keuangan/rekap');
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data.summary || {});
        setRecentTrx((res.data.data.transaksiTerakhir || []).slice(0, 5));
        if (res.data.data.siklusSpp) {
          setSiklusSpp(res.data.data.siklusSpp);
          setSiklusForm({
            tgl_terbit_spp: res.data.data.siklusSpp.tgl_terbit_spp || 5,
            tgl_jatuh_tempo_spp: res.data.data.siklusSpp.tgl_jatuh_tempo_spp || 10,
            apply_to_existing: true
          });
        }
      }

      // Ambil juga total saldo tabungan jika ada
      try {
        const tabRes = await axios.get('/api/tabungan');
        if (tabRes.data?.success && tabRes.data.data) {
          const list = tabRes.data.data.santri_tabungan || tabRes.data.data || [];
          if (Array.isArray(list)) {
            const tot = list.reduce((acc, cur) => acc + (parseFloat(cur.saldo) || 0), 0);
            setSaldoTabunganTotal(tot);
          }
        }
      } catch (_) {}

    } catch (err) {
      console.warn('Gagal memuat rekap keuangan beranda:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSiklus = async (e) => {
    e?.preventDefault();
    try {
      setSavingSiklus(true);
      const res = await axios.post('/api/keuangan/siklus-spp', siklusForm);
      if (res.data?.success) {
        toastSuccess('Siklus Disimpan', res.data.message || 'Pengaturan siklus SPP berhasil disimpan.');
        setIsSiklusModalOpen(false);
        fetchKeuanganSummary();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan siklus SPP');
    } finally {
      setSavingSiklus(false);
    }
  };

  useEffect(() => {
    fetchKeuanganSummary();
  }, []);

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  const handleLogoutClick = async () => {
    const ok = await showConfirm(
      'Konfirmasi Keluar',
      'Keluar dari akun bendahara pesantren?',
      'Ya, Keluar',
      'Batal'
    );
    if (ok && onLogout) {
      onLogout();
    }
  };

  // 10 Menu Layanan Khusus Keuangan
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
    <div style={{ paddingBottom: '32px' }}>
      {/* 1. TOP CURVED HEADER KHUSUS BENDAHARA */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
        padding: '20px 18px 26px',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        boxShadow: '0 10px 25px -4px rgba(6, 78, 59, 0.4)',
        color: '#ffffff'
      }}>
        {/* Top Info Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#ffffff',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}>
              <img src="/nwf.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.96rem', fontWeight: 800, letterSpacing: '0.2px' }}>NWF Keuangan</span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '1px 6px',
                  borderRadius: '6px'
                }}>
                  BENDAHARA
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', opacity: 0.9, fontWeight: 500 }}>
                {sessionData.nama || 'Petugas Administrasi & Kasir'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Keluar Akun"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Hero Card: Kas Masuk Sah & Tunggakan */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.97)',
          borderRadius: '20px',
          padding: '16px 18px',
          color: '#0f172a',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Kas Masuk Sah
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 600
              }}
            >
              {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showBalance ? 'Sembunyikan' : 'Tampilkan'}</span>
            </button>
          </div>

          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.3px', marginBottom: '12px' }}>
            {showBalance ? formatRp(summary.total_kas_masuk_sah || summary.total_nominal_terbayar || 0) : 'Rp •••••••••••'}
          </div>

          {/* Sub Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ background: '#fef2f2', padding: '10px 12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700 }}>Total Piutang / Tunggakan</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                {showBalance ? formatRp(summary.total_nominal_tertunggak || 0) : 'Rp ••••••'}
              </div>
            </div>

            <div style={{ background: '#f0fdfa', padding: '10px 12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: '#0f766e', fontWeight: 700 }}>Kas Tabungan Santri</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0d9488', marginTop: '2px' }}>
                {showBalance ? formatRp(saldoTabunganTotal || 0) : 'Rp ••••••'}
              </div>
            </div>
          </div>
        </div>

        {/* Siklus Tagihan SPP Card & Setting Shortcut */}
        <div style={{
          marginTop: '12px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '14px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#a7f3d0" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                Siklus SPP: Terbit tgl {siklusSpp.tgl_terbit_spp || 5} • Batas Bayar: tgl {siklusSpp.tgl_jatuh_tempo_spp || 10}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>
                Lewat tgl {siklusSpp.tgl_jatuh_tempo_spp || 10} otomatis berstatus Tunggakan
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsSiklusModalOpen(true)}
            style={{
              background: '#ffffff',
              color: '#047857',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            Atur
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div style={{ padding: '16px' }}>
        {/* Action Button: Buka Kasir Pembayaran */}
        <button
          onClick={() => onChangeTab('keuangan-kasir')}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#fff" />
            </div>
            <span>Buka Kasir Pembayaran Santri</span>
          </div>
          <ArrowRight size={18} />
        </button>

        {/* 3. MENU LAYANAN KEUANGAN (10 MENU GRID) */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '4px', height: '14px', background: '#059669', borderRadius: '4px' }} />
              <span>Menu Layanan Keuangan</span>
            </div>
            <button
              onClick={fetchKeuanganSummary}
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
                onClick={() => onChangeTab(m.id)}
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

        {/* 4. RIWAYAT TRANSAKSI KASIR TERBARU */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '4px', height: '14px', background: '#0284c7', borderRadius: '4px' }} />
              <span>Transaksi Kasir Terbaru</span>
            </div>
            <button
              onClick={() => onChangeTab('keuangan-rekap')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0284c7', fontSize: '0.74rem', fontWeight: 700 }}
            >
              Lihat Semua &rsaquo;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
                <RotateCw size={18} className="animate-spin" style={{ margin: '0 auto 6px', color: '#059669' }} />
                <div>Memuat transaksi...</div>
              </div>
            ) : recentTrx.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
                <Receipt size={24} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                <div>Belum ada transaksi hari ini</div>
              </div>
            ) : (
              recentTrx.map((trx) => (
                <div
                  key={trx.id}
                  onClick={() => onChangeTab('keuangan-rekap')}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                        {trx.nama_santri || 'Santri'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {trx.nomor_transaksi || `TRX-${trx.id}`} • {trx.metode_pembayaran || 'Kasir'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#059669' }}>
                      {formatRp(trx.total_bayar)}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                      {trx.tanggal_bayar ? String(trx.tanggal_bayar).slice(0, 10) : 'Hari ini'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL ATUR SIKLUS TAGIHAN SPP & JATUH TEMPO */}
      {isSiklusModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '480px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '24px 20px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.25s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Atur Siklus Tagihan SPP
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Tanggal terbit bulanan &amp; batas maksimal bayar
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSiklusModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSiklus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tanggal Terbit Tagihan (Setiap Bulan)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Setiap Tanggal</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={siklusForm.tgl_terbit_spp}
                    onChange={(e) => setSiklusForm({ ...siklusForm, tgl_terbit_spp: parseInt(e.target.value) || 5 })}
                    style={{
                      width: '70px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>tiap bulan</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                  Mulai tanggal ini, tagihan bulan berjalan mulai ditagihkan ke wali santri.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tanggal Maksimal Pembayaran (Batas Jatuh Tempo)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>Maksimal Tanggal</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={siklusForm.tgl_jatuh_tempo_spp}
                    onChange={(e) => setSiklusForm({ ...siklusForm, tgl_jatuh_tempo_spp: parseInt(e.target.value) || 10 })}
                    style={{
                      width: '70px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #ef4444',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: '#dc2626',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>tiap bulan</span>
                </div>
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginTop: '6px',
                  fontSize: '0.72rem',
                  color: '#991b1b',
                  lineHeight: 1.4
                }}>
                  ⚠️ <strong>Ketentuan Tunggakan:</strong> Pembayaran yang dilakukan setelah tanggal <strong>{siklusForm.tgl_jatuh_tempo_spp}</strong> otomatis tercatat resmi sebagai <strong>Tunggakan</strong>.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={siklusForm.apply_to_existing}
                  onChange={(e) => setSiklusForm({ ...siklusForm, apply_to_existing: e.target.checked })}
                  style={{ accentColor: '#059669', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                  Terapkan juga ke seluruh tagihan berjalan yang belum lunas
                </span>
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsSiklusModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSiklus}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {savingSiklus ? 'Menyimpan...' : 'Simpan Pengaturan Siklus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

