import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Search,
  ArrowLeft,
  RotateCw,
  X,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  Share2,
  Users,
  Settings,
  ChevronRight,
  UserCheck,
  Building
} from 'lucide-react';
import ModalSiklusSpp from './components/ModalSiklusSpp';
import { toastSuccess, toastError, showConfirm } from '../../utils/alert.util';

export default function TunggakanSppView({ onBackToHome, onChangeTab }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_nominal_tunggakan: 0,
    total_santri_menunggak: 0,
    tgl_jatuh_tempo_spp: 10
  });
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('semua');
  const [filterBulanCount, setFilterBulanCount] = useState('semua');

  // Modal Atur Siklus SPP
  const [isSiklusModalOpen, setIsSiklusModalOpen] = useState(false);
  const [siklusForm, setSiklusForm] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    apply_to_existing: true
  });
  const [savingSiklus, setSavingSiklus] = useState(false);

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  const fetchTunggakan = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/keuangan/admin/tunggakan-spp');
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setSummary(d.summary || {});
        setSantriList(d.santri || []);
        if (d.siklusSpp) {
          setSiklusForm({
            tgl_terbit_spp: d.siklusSpp.tgl_terbit_spp || 5,
            tgl_jatuh_tempo_spp: d.siklusSpp.tgl_jatuh_tempo_spp || 10,
            apply_to_existing: true
          });
        }
      }
    } catch (err) {
      console.warn('Gagal memuat tunggakan SPP:', err);
      toastError('Gagal memuat data tunggakan SPP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTunggakan();
  }, []);

  const handleSaveSiklus = async (e) => {
    e?.preventDefault();
    try {
      setSavingSiklus(true);
      const res = await axios.post('/api/keuangan/siklus-spp', siklusForm);
      if (res.data?.success) {
        toastSuccess('Siklus Disimpan', res.data.message || 'Pengaturan siklus SPP berhasil disimpan.');
        setIsSiklusModalOpen(false);
        fetchTunggakan();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Gagal menyimpan pengaturan siklus SPP');
    } finally {
      setSavingSiklus(false);
    }
  };

  // Navigasi ke Kasir dengan Santri yang dipilih
  const handleBayarDiKasir = (santri) => {
    localStorage.setItem(
      'selected_kasir_santri',
      JSON.stringify({
        id: santri.santri_id,
        nama_santri: santri.nama_santri,
        nis: santri.nis,
        nama_sekolah: santri.nama_sekolah,
        tingkat_sekolah: santri.tingkat_sekolah,
        nama_kelas: santri.nama_kelas,
        nama_asrama: santri.nama_asrama,
        nama_kamar: santri.nama_kamar,
        nama_wali: santri.nama_wali,
        no_wa_wali: santri.no_wa_wali
      })
    );
    if (onChangeTab) {
      onChangeTab('keuangan-kasir');
    } else {
      window.location.hash = 'keuangan-kasir';
    }
  };

  // Kirim Pengingat WhatsApp Resmi ke Wali Santri
  const handleSendWaReminder = (s) => {
    if (!s.no_wa_wali) {
      alert('Nomor WhatsApp wali santri belum terdaftar di data profil santri.');
      return;
    }
    let phone = String(s.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const rincianText = (s.rincian_spp || [])
      .map((it, idx) => `  ${idx + 1}. *${it.bulan}*: ${formatRp(it.nominal)} _(Jatuh tempo: ${it.jatuh_tempo})_`)
      .join('\n');

    const text =
      `*PEMBERITAHUAN TUNGGAKAN SPP BULANAN*\n` +
      `*Pondok Pesantren Nurul Wafa*\n` +
      `-----------------------------------------\n` +
      `Yth. Bapak/Ibu Wali dari:\n` +
      `*Nama Santri:* ${s.nama_santri}\n` +
      `*NIS:* ${s.nis}\n` +
      `*Kelas/Jenjang:* ${s.nama_kelas || s.tingkat_sekolah} - ${s.nama_sekolah}\n` +
      `*Asrama:* ${s.nama_asrama} (Kamar ${s.nama_kamar})\n` +
      `-----------------------------------------\n` +
      `Diberitahukan bahwa terdapat tagihan SPP Bulanan yang telah melewati batas tanggal jatuh tempo (tgl ${summary.tgl_jatuh_tempo_spp || 10}):\n\n` +
      `${rincianText || '  • Tagihan SPP Bulanan'}\n\n` +
      `*TOTAL TUNGGAKAN: ${formatRp(s.total_nominal_tunggakan)}*\n` +
      `-----------------------------------------\n` +
      `Pembayaran dapat diselesaikan langsung di loket Kasir Pesantren atau melalui Portal Wali Santri secara online.\n\n` +
      `_Abaikan pemberitahuan ini apabila pembayaran telah diselesaikan. Jazakumullahu Khayran._\n` +
      `*Bendahara Pesantren Nurul Wafa*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filter Santri Menunggak
  const filteredSantri = React.useMemo(() => {
    return (santriList || []).filter((s) => {
      // Filter Sekolah
      if (filterSekolah !== 'semua') {
        const sk = String(s.nama_sekolah || s.sekolah_jenjang || s.tingkat_sekolah || '').toUpperCase();
        if (!sk.includes(filterSekolah.toUpperCase())) return false;
      }
      // Filter Jumlah Bulan
      if (filterBulanCount === '1') {
        if (s.jumlah_bulan_nunggak !== 1) return false;
      } else if (filterBulanCount === '2+') {
        if (s.jumlah_bulan_nunggak < 2) return false;
      } else if (filterBulanCount === '3+') {
        if (s.jumlah_bulan_nunggak < 3) return false;
      }
      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const sName = String(s.nama_santri || '').toLowerCase();
        const sNis = String(s.nis || '').toLowerCase();
        const sWali = String(s.nama_wali || '').toLowerCase();
        const sAsrama = String(s.nama_asrama || '').toLowerCase();
        const sKls = String(s.nama_kelas || s.tingkat_sekolah || '').toLowerCase();
        return sName.includes(q) || sNis.includes(q) || sWali.includes(q) || sAsrama.includes(q) || sKls.includes(q);
      }
      return true;
    });
  }, [santriList, filterSekolah, filterBulanCount, search]);

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. TOP CURVED HEADER CARD */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d766e 0%, #064e3b 100%)',
          padding: '20px 16px 28px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(13, 118, 110, 0.25)',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                style={{
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: 'none',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Tunggakan SPP Bulanan</span>
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '2px' }}>
                Lewat Batas Jatuh Tempo (Setiap Tgl {summary.tgl_jatuh_tempo_spp || 10})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsSiklusModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                padding: '7px 10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Atur Tanggal Jatuh Tempo SPP"
            >
              <Settings size={14} />
              <span>Siklus</span>
            </button>

            <button
              type="button"
              onClick={fetchTunggakan}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Refresh Data"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Global Total Saldo Glassmorphism Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '14px 16px',
            marginTop: '8px',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#fecaca', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} color="#f87171" />
            <span>Total Piutang Tunggakan SPP Bulanan</span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#fee2e2', marginTop: '4px', letterSpacing: '-0.5px' }}>
            {formatRp(summary.total_nominal_tunggakan)}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.74rem', color: '#fee2e2', fontWeight: 800 }}>
              {filteredSantri.length} Santri Belum Bayar
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fef08a', fontWeight: 700, background: 'rgba(0,0,0,0.18)', padding: '2px 8px', borderRadius: '6px' }}>
              Batas Akhir: Tgl {summary.tgl_jatuh_tempo_spp || 10} Tiap Bulan
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER SECTION */}
      <div style={{ padding: '14px 14px 8px' }}>
        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '14px',
            padding: '0 12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            marginBottom: '10px'
          }}
        >
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, wali, asrama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 10px',
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              color: '#1e293b',
              background: 'transparent'
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Pills: Sekolah */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
          {[
            { id: 'semua', label: 'Semua Sekolah' },
            { id: 'SMP', label: 'SMP' },
            { id: 'SMA', label: 'SMA' },
            { id: 'SMK', label: 'SMK' }
          ].map((f) => {
            const active = filterSekolah === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterSekolah(f.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: active ? '1px solid #059669' : '1px solid #cbd5e1',
                  background: active ? '#ecfdf5' : '#ffffff',
                  color: active ? '#059669' : '#64748b',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Filter Pills: Jumlah Bulan Nunggak */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'semua', label: 'Semua Bulan' },
            { id: '1', label: '1 Bulan' },
            { id: '2+', label: '≥ 2 Bulan' },
            { id: '3+', label: '≥ 3 Bulan' }
          ].map((f) => {
            const active = filterBulanCount === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterBulanCount(f.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  border: active ? '1px solid #dc2626' : '1px solid #e2e8f0',
                  background: active ? '#fef2f2' : '#ffffff',
                  color: active ? '#dc2626' : '#64748b',
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

      {/* 3. LIST SANTRI DENGAN RINCIAN SPP YANG MENUNGGAK */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && santriList.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '0.8rem'
          }}>
            <RotateCw size={22} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
            <div>Memeriksa tunggakan SPP bulanan...</div>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
              Tidak Ada Tunggakan SPP!
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
              Seluruh santri telah menyelesaikan pembayaran SPP bulanan atau belum melewati tanggal jatuh tempo ({summary.tgl_jatuh_tempo_spp || 10}).
            </div>
          </div>
        ) : (
          filteredSantri.map((s) => {
            return (
              <div
                key={s.santri_id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '14px',
                  border: '1px solid #fee2e2',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)'
                }}
              >
                {/* Header Card: Avatar + Nama Santri + Total Tunggakan */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                      boxShadow: '0 3px 8px rgba(220, 38, 38, 0.25)'
                    }}>
                      {(s.nama_santri || 'S').slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.25 }}>
                        {s.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>NIS: {s.nis}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 700, color: '#b91c1c' }}>{s.nama_kelas || s.tingkat_sekolah}</span>
                        <span>•</span>
                        <span>{s.nama_sekolah}</span>
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '1px' }}>
                        Asrama: {s.nama_asrama} (Kamar {s.nama_kamar})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#dc2626' }}>
                      {formatRp(s.total_nominal_tunggakan)}
                    </div>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#b91c1c',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      marginTop: '3px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Clock size={10} />
                      <span>{s.jumlah_bulan_nunggak} Bulan SPP</span>
                    </span>
                  </div>
                </div>

                {/* Rincian Bulan Mana Saja yang Belum Dibayar */}
                <div style={{
                  marginTop: '10px',
                  background: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  borderRadius: '12px',
                  padding: '9px 12px'
                }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', marginBottom: '5px' }}>
                    BULAN SPP YANG BELUM DIBAYAR:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {s.rincian_spp.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.74rem',
                          color: '#4c0519'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e11d48' }} />
                          <span style={{ fontWeight: 700 }}>{item.bulan}</span>
                          <span style={{ fontSize: '0.64rem', color: '#9f1239' }}>(Tempo: {item.jatuh_tempo})</span>
                        </div>
                        <span style={{ fontWeight: 800 }}>{formatRp(item.nominal)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info: Wali & Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Wali: <span style={{ fontWeight: 700, color: '#334155' }}>{s.nama_wali}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Tombol Bayar di Kasir */}
                    <button
                      type="button"
                      onClick={() => handleBayarDiKasir(s)}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      <CreditCard size={12} />
                      <span>Bayar di Kasir</span>
                    </button>

                    {/* Tombol Kirim Tagihan WA */}
                    {s.no_wa_wali && (
                      <button
                        type="button"
                        onClick={() => handleSendWaReminder(s)}
                        style={{
                          background: '#25d366',
                          border: 'none',
                          color: '#ffffff',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)'
                        }}
                        title="Kirim Tagihan via WhatsApp"
                      >
                        <Share2 size={12} />
                        <span>Tagih WA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL ATUR SIKLUS SPP */}
      <ModalSiklusSpp
        isOpen={isSiklusModalOpen}
        onClose={() => setIsSiklusModalOpen(false)}
        siklusForm={siklusForm}
        setSiklusForm={setSiklusForm}
        savingSiklus={savingSiklus}
        onSaveSiklus={handleSaveSiklus}
      />
    </div>
  );
}

