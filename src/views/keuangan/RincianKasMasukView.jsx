import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Receipt,
  Search,
  ArrowLeft,
  RotateCw,
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Building,
  GraduationCap,
  Calendar,
  Share2
} from 'lucide-react';
import ModalKuitansi from './components/ModalKuitansi';
import { toastSuccess, toastError, showConfirm } from '../../utils/alert.util';

export default function RincianKasMasukView({ onBackToHome, onChangeTab }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_kas_masuk_sah: 0,
    total_transaksi: 0
  });
  const [transaksiList, setTransaksiList] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('semua');

  // Modal Kuitansi
  const [kuitansiModal, setKuitansiModal] = useState({
    isOpen: false,
    data: null
  });

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  const fetchKasMasuk = async () => {
    try {
      setLoading(true);
      const res = await axios
        .get('/api/keuangan/admin/kas-masuk-sah')
        .catch(() => axios.get('/api/keuangan/admin/rekap'));

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.summary) {
          setSummary({
            total_kas_masuk_sah: d.summary.total_kas_masuk_sah || d.summary.total_nominal_terbayar || 0,
            total_transaksi: d.summary.total_transaksi || (d.transaksi || d.transaksiTerakhir || []).length
          });
        }
        setTransaksiList(d.transaksi || d.transaksiTerakhir || []);
      }
    } catch (err) {
      console.warn('Gagal memuat rincian kas masuk sah:', err);
      toastError('Gagal memuat data kas masuk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKasMasuk();
  }, []);

  // Filter List Transaksi
  const filteredTrx = React.useMemo(() => {
    return (transaksiList || []).filter((trx) => {
      if (filterSekolah !== 'semua') {
        const sk = String(trx.nama_sekolah || trx.tingkat_sekolah || '').toUpperCase();
        if (!sk.includes(filterSekolah)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const sName = String(trx.nama_santri || '').toLowerCase();
        const sNis = String(trx.nis || '').toLowerCase();
        const sNo = String(trx.nomor_transaksi || trx.nomor_kuitansi || '').toLowerCase();
        const sItem = String(trx.rincian_item || trx.keterangan || '').toLowerCase();
        return sName.includes(q) || sNis.includes(q) || sNo.includes(q) || sItem.includes(q);
      }
      return true;
    });
  }, [transaksiList, filterSekolah, search]);

  const handleSendWaKuitansi = (kData) => {
    if (!kData?.no_wa_wali) {
      alert('Nomor WhatsApp wali santri belum terdaftar.');
      return;
    }
    let phone = String(kData.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const dateStr = kData.tanggal_bayar
      ? new Date(kData.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const text =
      `*KUITANSI PEMBAYARAN RESMI*\n` +
      `*Pondok Pesantren Nurul Wafa*\n` +
      `-----------------------------------------\n` +
      `*No. Kuitansi:* ${kData.nomor_kuitansi || kData.nomor_transaksi || `KW-${kData.id}`}\n` +
      `*Nama Santri:* ${kData.nama_santri}\n` +
      `*NIS:* ${kData.nis || '-'}\n` +
      `*Tanggal:* ${dateStr}\n` +
      `*Metode:* ${kData.metode_pembayaran || 'Tunai / Kasir'}\n` +
      `*Status:* Lunas / Berhasil\n` +
      `-----------------------------------------\n` +
      `*Rincian Pembayaran:*\n` +
      `  • ${kData.rincian_item || kData.keterangan || 'Pembayaran Administrasi'}\n` +
      `-----------------------------------------\n` +
      `*TOTAL DIBAYAR: ${formatRp(kData.total_bayar)}*\n\n` +
      `_Terima kasih atas pembayaran yang telah dilakukan. Syukron Katsiiron._\n` +
      `*Bendahara Pesantren Nurul Wafa*`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. TOP CURVED HEADER CARD (PERSIS TABUNGAN SANTRI) */}
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
                <span>Rincian Kas Masuk Sah</span>
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '2px' }}>
                Penerimaan Pembayaran Lunas Terverifikasi
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchKasMasuk}
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
          <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Kas Masuk Diterima
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
            {formatRp(summary.total_kas_masuk_sah)}
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
            <div style={{ fontSize: '0.74rem', color: '#ecfdf5', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>{filteredTrx.length} Transaksi Sah Terdaftar</span>
            </div>
            {onChangeTab && (
              <button
                type="button"
                onClick={() => onChangeTab('keuangan-kasir')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                + Buka Kasir
              </button>
            )}
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
            placeholder="Cari santri, NIS, no kuitansi, atau item..."
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

        {/* Filter Pills Sekolah */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'semua', label: 'Semua Sekolah' },
            { id: 'SMP', label: 'SMP Nurul Wafa' },
            { id: 'SMA', label: 'SMA Nurul Wafa' },
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
      </div>

      {/* 3. LIST KARTU TRANSAKSI KAS MASUK */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading && transaksiList.length === 0 ? (
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
            <div>Memuat seluruh kas masuk sah...</div>
          </div>
        ) : filteredTrx.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '36px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <Receipt size={36} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
              Tidak Ada Transaksi Ditemukan
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>
              Coba sesuaikan kata kunci atau filter sekolah.
            </div>
          </div>
        ) : (
          filteredTrx.map((trx) => {
            const dateStr = trx.tanggal_bayar
              ? new Date(trx.tanggal_bayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-';

            return (
              <div
                key={trx.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                {/* Header Card: Avatar + Nama Santri + Nominal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                      boxShadow: '0 3px 8px rgba(5, 150, 105, 0.25)'
                    }}>
                      {(trx.nama_santri || 'S').slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.25 }}>
                        {trx.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>NIS: {trx.nis || '-'}</span>
                        {trx.nama_sekolah && (
                          <>
                            <span>•</span>
                            <span style={{ fontWeight: 700, color: '#047857' }}>{trx.nama_sekolah}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.96rem', color: '#047857' }}>
                      {formatRp(trx.total_bayar)}
                    </div>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      color: '#059669',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      marginTop: '3px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <CheckCircle2 size={10} />
                      <span>Lunas</span>
                    </span>
                  </div>
                </div>

                {/* Rincian Item yang Dibayar */}
                <div style={{
                  marginTop: '10px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  fontSize: '0.74rem',
                  color: '#334155',
                  lineHeight: 1.35
                }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                    ITEM DIBAYAR:
                  </div>
                  <div>
                    {trx.rincian_item || trx.keterangan || 'Pembayaran Tagihan Santri'}
                  </div>
                </div>

                {/* Footer Info: No Kuitansi, Tanggal, Metode & Tombol Aksi */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.68rem',
                  color: '#64748b'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>
                      {trx.nomor_kuitansi || trx.nomor_transaksi || `KW-${trx.id}`}
                    </span>
                    <span style={{ margin: '0 4px' }}>•</span>
                    <span>{dateStr}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setKuitansiModal({ isOpen: true, data: trx })}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Receipt size={12} color="#059669" />
                      <span>Kuitansi</span>
                    </button>

                    {trx.no_wa_wali && (
                      <button
                        type="button"
                        onClick={() => handleSendWaKuitansi(trx)}
                        style={{
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                        title="Kirim ke WhatsApp Wali"
                      >
                        <Share2 size={12} />
                        <span>WA</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL KUITANSI DIGITAL */}
      <ModalKuitansi
        isOpen={kuitansiModal.isOpen}
        data={kuitansiModal.data}
        onClose={() => setKuitansiModal({ isOpen: false, data: null })}
        formatRp={formatRp}
      />
    </div>
  );
}

