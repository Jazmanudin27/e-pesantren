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
  Smartphone,
  Calendar,
  Save,
  X,
  Filter,
  Printer,
  ChevronRight,
  Share2
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
  const [allKasMasukTrx, setAllKasMasukTrx] = useState([]);
  const [saldoTabunganTotal, setSaldoTabunganTotal] = useState(0);

  // State Modal Detail Rincian Kas Masuk
  const [isDetailKasModalOpen, setIsDetailKasModalOpen] = useState(false);
  const [searchKasMasuk, setSearchKasMasuk] = useState('');
  const [filterSekolahKas, setFilterSekolahKas] = useState('semua');
  const [kuitansiModal, setKuitansiModal] = useState({ isOpen: false, data: null });

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
        const listTrx = res.data.data.transaksiTerakhir || [];
        setAllKasMasukTrx(listTrx);
        setRecentTrx(listTrx.slice(0, 5));
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

          {/* Klik Kas Masuk untuk Rincian */}
          <div
            onClick={() => setIsDetailKasModalOpen(true)}
            style={{ cursor: 'pointer', marginBottom: '8px' }}
            title="Klik untuk melihat rincian kas masuk"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.3px' }}>
                {showBalance ? formatRp(summary.total_kas_masuk_sah || summary.total_nominal_terbayar || 0) : 'Rp •••••••••••'}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#047857',
                background: '#ecfdf5',
                padding: '3px 8px',
                borderRadius: '8px',
                border: '1px solid #a7f3d0'
              }}>
                Lihat Detail ›
              </span>
            </div>
          </div>

          {/* Quick Banner: Buka Rincian Kas Masuk Sah */}
          <button
            onClick={() => setIsDetailKasModalOpen(true)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '12px',
              border: '1px solid #a7f3d0',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              color: '#065f46',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              boxShadow: '0 2px 5px rgba(5, 150, 105, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Receipt size={14} color="#059669" />
              <span>Rincian Transaksi Kas Masuk Sah ({allKasMasukTrx.length || recentTrx.length} Transaksi)</span>
            </div>
            <ArrowRight size={13} color="#059669" />
          </button>

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
                onClick={() => {
                  if (m.id === 'keuangan-rekap') {
                    setIsDetailKasModalOpen(true);
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

        {/* 4. RIWAYAT TRANSAKSI KASIR TERBARU */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '4px', height: '14px', background: '#0284c7', borderRadius: '4px' }} />
              <span>Transaksi Kasir Terbaru</span>
            </div>
            <button
              onClick={() => setIsDetailKasModalOpen(true)}
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
                  onClick={() => setKuitansiModal({ isOpen: true, data: trx })}
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

      {/* 6. MODAL RINCIAN DETAIL KAS MASUK SAH */}
      {isDetailKasModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 99990
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '92vh',
            borderTopLeftRadius: '26px',
            borderTopRightRadius: '26px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -15px 35px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.25s ease',
            overflow: 'hidden'
          }}>
            {/* Header Modal Rincian */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              color: '#ffffff',
              padding: '18px 20px 16px',
              borderTopLeftRadius: '26px',
              borderTopRightRadius: '26px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Receipt size={20} color="#ffffff" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      Rincian Kas Masuk Sah
                    </h3>
                    <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '1px' }}>
                      Penerimaan pembayaran yang sudah lunas &amp; valid
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsDetailKasModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Box Total Nilai */}
              <div style={{
                marginTop: '14px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div>
                  <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>TOTAL PENERIMAAN KAS SAH</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                    {formatRp(summary.total_kas_masuk_sah || summary.total_nominal_terbayar || 0)}
                  </div>
                </div>
                <div style={{
                  background: '#ffffff',
                  color: '#047857',
                  padding: '5px 10px',
                  borderRadius: '10px',
                  fontSize: '0.74rem',
                  fontWeight: 800
                }}>
                  {allKasMasukTrx.length} Transaksi Lunas
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 12px',
                marginBottom: '10px'
              }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari nama santri, NIS, no transaksi..."
                  value={searchKasMasuk}
                  onChange={(e) => setSearchKasMasuk(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.82rem',
                    background: 'transparent'
                  }}
                />
                {searchKasMasuk && (
                  <button
                    onClick={() => setSearchKasMasuk('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Jenjang Sekolah */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'semua', label: 'Semua Sekolah' },
                  { id: 'SMP', label: 'SMP' },
                  { id: 'SMA', label: 'SMA' },
                  { id: 'SMK', label: 'SMK' }
                ].map((f) => {
                  const active = filterSekolahKas === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFilterSekolahKas(f.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: active ? '1px solid #059669' : '1px solid #e2e8f0',
                        background: active ? '#059669' : '#ffffff',
                        color: active ? '#ffffff' : '#64748b',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Transaksi Kas Masuk Sah */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const filtered = allKasMasukTrx.filter((trx) => {
                  if (filterSekolahKas !== 'semua') {
                    const sk = String(trx.nama_sekolah || trx.tingkat_sekolah || '').toUpperCase();
                    if (!sk.includes(filterSekolahKas)) return false;
                  }
                  if (searchKasMasuk.trim()) {
                    const q = searchKasMasuk.toLowerCase();
                    const sName = String(trx.nama_santri || '').toLowerCase();
                    const sNis = String(trx.nis || '').toLowerCase();
                    const sNo = String(trx.nomor_transaksi || trx.nomor_kuitansi || '').toLowerCase();
                    const sItem = String(trx.rincian_item || trx.keterangan || '').toLowerCase();
                    return sName.includes(q) || sNis.includes(q) || sNo.includes(q) || sItem.includes(q);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{
                      padding: '40px 16px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: '16px',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b'
                    }}>
                      <Receipt size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Tidak ada riwayat kas masuk</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {searchKasMasuk ? 'Coba ubah kata kunci pencarian' : 'Belum ada transaksi sah tercatat'}
                      </div>
                    </div>
                  );
                }

                return filtered.map((trx, idx) => {
                  const sekolahLabel = trx.nama_sekolah || (trx.tingkat_sekolah ? `Kelas ${trx.tingkat_sekolah}` : 'Santri NWF');
                  const isSMP = sekolahLabel.toUpperCase().includes('SMP');
                  const isSMA = sekolahLabel.toUpperCase().includes('SMA');
                  const isSMK = sekolahLabel.toUpperCase().includes('SMK');

                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#475569';
                  if (isSMP) { badgeBg = '#e0f2fe'; badgeColor = '#0369a1'; }
                  else if (isSMA) { badgeBg = '#fef3c7'; badgeColor = '#b45309'; }
                  else if (isSMK) { badgeBg = '#f3e8ff'; badgeColor = '#7e22ce'; }

                  return (
                    <div
                      key={trx.id || idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Top Bar Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          #{trx.nomor_transaksi || `TRX-${trx.id}`}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <CheckCircle2 size={11} /> Sah / Lunas
                          </span>
                        </div>
                      </div>

                      {/* Info Santri & Sekolah */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                            {trx.nama_santri || 'Santri'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              NIS: {trx.nis || '-'}
                            </span>
                            <span style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              background: badgeBg,
                              color: badgeColor,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {sekolahLabel}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#047857' }}>
                            {formatRp(trx.total_bayar)}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                            {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                          </div>
                        </div>
                      </div>

                      {/* Rincian Tagihan yang Dibayar */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        color: '#334155',
                        lineHeight: 1.4,
                        border: '1px solid #f1f5f9'
                      }}>
                        <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '2px', fontSize: '0.66rem' }}>
                          ITEM DIBAYAR:
                        </div>
                        <div>
                          {trx.rincian_item || trx.keterangan || 'Pembayaran Tagihan Santri'}
                        </div>
                      </div>

                      {/* Bottom Footer Transaksi: Metode & Tombol Kuitansi */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={12} color="#059669" />
                          <span>{trx.metode_pembayaran || 'Kasir'} {trx.channel_pembayaran ? `(${trx.channel_pembayaran})` : ''}</span>
                        </div>

                        <button
                          onClick={() => setKuitansiModal({ isOpen: true, data: trx })}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#047857',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Receipt size={12} />
                          <span>Lihat Kuitansi</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer Modal */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#ffffff', textAlign: 'center' }}>
              <button
                onClick={() => setIsDetailKasModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL KUITANSI DIGITAL ELEGAN */}
      {kuitansiModal.isOpen && kuitansiModal.data && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '390px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.2s ease-out'
          }}>
            {/* Header Kuitansi */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              color: '#ffffff',
              padding: '20px 16px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Kuitansi Kas Masuk Sah</h3>
              <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '2px' }}>
                Pondok Pesantren Nurul Wafa
              </div>
            </div>

            {/* Rincian Nota */}
            <div style={{ padding: '18px 20px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>No. Kuitansi</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>
                  {kuitansiModal.data.nomor_kuitansi || kuitansiModal.data.nomor_transaksi || `KW-${kuitansiModal.data.id}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Tanggal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {kuitansiModal.data.tanggal_bayar ? new Date(kuitansiModal.data.tanggal_bayar).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Hari ini'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Nama Santri</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{kuitansiModal.data.nama_santri}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>NIS / Sekolah</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {kuitansiModal.data.nis || '-'} • {kuitansiModal.data.nama_sekolah || 'Santri'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
                <span>Metode Pembayaran</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {kuitansiModal.data.metode_pembayaran || 'Kasir'} {kuitansiModal.data.channel_pembayaran ? `(${kuitansiModal.data.channel_pembayaran})` : ''}
                </span>
              </div>

              {/* Rincian Item */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '10px 12px',
                marginBottom: '14px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
                  ALOKASI PEMBAYARAN:
                </div>
                <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.4 }}>
                  {kuitansiModal.data.rincian_item || kuitansiModal.data.keterangan || 'Pembayaran Tagihan Santri'}
                </div>
              </div>

              {/* Total Bayar Sah */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#ecfdf5',
                borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <span style={{ fontWeight: 800, color: '#065f46', fontSize: '0.85rem' }}>TOTAL DITERIMA</span>
                <span style={{ fontWeight: 900, color: '#047857', fontSize: '1.2rem' }}>
                  {formatRp(kuitansiModal.data.total_bayar)}
                </span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setKuitansiModal({ isOpen: false, data: null })}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                <span>Cetak Nota</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

