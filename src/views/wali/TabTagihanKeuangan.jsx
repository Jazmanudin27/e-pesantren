import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'qrcode';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  ChevronRight, 
  Copy, 
  RotateCw, 
  Check, 
  ExternalLink, 
  Download, 
  Printer, 
  ArrowLeft,
  Building,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { toastSuccess, showError, showSuccess } from '../../utils/alert.util';

export default function TabTagihanKeuangan({ santriId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('tagihan'); // 'tagihan' | 'riwayat'

  // Selected Items for Payment Checkout
  // Format: { [tagihanId]: { selected: boolean, nominal: number } }
  const [selectedItems, setSelectedItems] = useState({});

  // Checkout State
  const [processing, setProcessing] = useState(false);
  const [activeTrx, setActiveTrx] = useState(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(true);

  // Kuitansi Modal State
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false);
  const [kuitansiData, setKuitansiData] = useState(null);
  const [loadingKuitansi, setLoadingKuitansi] = useState(false);

  const fetchKeuangan = async () => {
    try {
      setLoading(true);
      const url = santriId ? `/api/keuangan/wali/dashboard?santri_id=${santriId}` : '/api/keuangan/wali/dashboard';
      const res = await axios.get(url);
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.data?.transaksiPending) {
          setIsPendingModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat keuangan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeuangan();
  }, [santriId]);

  // Toggle selection for a tagihan
  const handleToggleItem = (tagihan) => {
    const sisa = parseFloat(tagihan.sisa_tagihan || 0);
    if (sisa <= 0) return;

    setSelectedItems(prev => {
      const isSelected = prev[tagihan.id]?.selected;
      if (isSelected) {
        const next = { ...prev };
        delete next[tagihan.id];
        return next;
      } else {
        return {
          ...prev,
          [tagihan.id]: {
            selected: true,
            nominal: sisa,
            judul: tagihan.judul_tagihan,
            kategori: tagihan.kategori,
            sisa_tagihan: sisa
          }
        };
      }
    });
  };

  // Select all monthly bills (SPP)
  const handleSelectAllBulanan = () => {
    const bulananItems = data?.tagihanBulanan?.filter(t => parseFloat(t.sisa_tagihan) > 0) || [];
    const allSelected = bulananItems.every(t => selectedItems[t.id]?.selected);

    setSelectedItems(prev => {
      const next = { ...prev };
      bulananItems.forEach(t => {
        if (allSelected) {
          delete next[t.id];
        } else {
          next[t.id] = {
            selected: true,
            nominal: parseFloat(t.sisa_tagihan),
            judul: t.judul_tagihan,
            kategori: t.kategori,
            sisa_tagihan: parseFloat(t.sisa_tagihan)
          };
        }
      });
      return next;
    });
  };

  // Calculate total selected
  const totalSelectedBayar = Object.values(selectedItems).reduce((acc, curr) => acc + (curr.nominal || 0), 0);
  const countSelected = Object.keys(selectedItems).length;

  // Start Checkout Process
  const handleMulaiCheckout = async () => {
    if (countSelected === 0 || totalSelectedBayar <= 0) {
      showError('Pilih Tagihan', 'Silakan centang minimal satu tagihan atau komponen biaya yang ingin dibayar.');
      return;
    }

    try {
      setProcessing(true);
      const itemsPayload = Object.entries(selectedItems).map(([tId, val]) => ({
        tagihan_id: parseInt(tId),
        nominal: val.nominal
      }));

      const res = await axios.post('/api/keuangan/wali/bayar', {
        santri_id: santriId || data?.santri?.id,
        items: itemsPayload,
        metode_pembayaran: 'QRIS',
        channel_pembayaran: 'Midtrans Snap'
      });

      if (res.data?.success) {
        const trx = res.data.data;
        setActiveTrx(trx);

        // Langsung luncurkan popup resmi Midtrans Snap tanpa modal tambahan
        if (trx.snap_token && window.snap) {
          window.snap.pay(trx.snap_token, {
            onSuccess: function (result) {
              toastSuccess('Pembayaran Berhasil!', 'Pembayaran via Midtrans berhasil.');
              setSelectedItems({});
              fetchKeuangan();
            },
            onPending: function (result) {
              toastSuccess('Menunggu Pembayaran', 'Silakan selesaikan pembayaran sesuai petunjuk Midtrans.');
              fetchKeuangan();
            },
            onError: function (result) {
              showError('Pembayaran Gagal', result?.status_message || 'Transaksi gagal.');
            },
            onClose: function () {
              fetchKeuangan();
            }
          });
        } else if (trx.payment_url) {
          window.open(trx.payment_url, '_blank');
        } else {
          showError('Gagal', 'Token pembayaran Midtrans tidak ditemukan.');
        }
      }
    } catch (err) {
      showError('Gagal Membuat Transaksi', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Lanjutkan Pembayaran yang masih Pending
  const handleLanjutkanBayar = async (pendingTrx) => {
    try {
      setProcessing(true);
      let snapToken = pendingTrx?.snap_token;
      let paymentUrl = pendingTrx?.payment_url;

      // Jika snap_token belum ada di memori lokal, minta backend cari/buatkan tokennya
      if (!snapToken) {
        const res = await axios.post('/api/keuangan/wali/lanjutkan', {
          nomor_transaksi: pendingTrx.nomor_transaksi,
          transaksi_id: pendingTrx.id
        });
        if (res.data?.success && res.data?.data?.snap_token) {
          snapToken = res.data.data.snap_token;
          paymentUrl = res.data.data.payment_url;
        } else {
          showError('Gagal Memuat Transaksi', res.data?.message || 'Token pembayaran tidak tersedia.');
          return;
        }
      }

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function () {
            toastSuccess('Pembayaran Berhasil!', 'Pembayaran via Midtrans berhasil diverifikasi.');
            setSelectedItems({});
            fetchKeuangan();
          },
          onPending: function () {
            toastSuccess('Menunggu Pembayaran', 'Selesaikan pembayaran sebelum batas waktu berakhir.');
            fetchKeuangan();
          },
          onError: function (result) {
            showError('Pembayaran Gagal', result?.status_message || 'Transaksi gagal.');
          },
          onClose: function () {
            fetchKeuangan();
          }
        });
      } else if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        showError('Gagal', 'Sistem pop-up Midtrans belum siap.');
      }
    } catch (err) {
      showError('Gagal Melanjutkan Pembayaran', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Batalkan Transaksi Pending agar bisa Ganti Metode / Mulai Ulang
  const handleBatalkanTransaksi = async (pendingTrx) => {
    if (!window.confirm('Batalkan transaksi pending ini untuk mengganti metode pembayaran?')) return;
    try {
      setProcessing(true);
      const res = await axios.post('/api/keuangan/wali/batal', {
        nomor_transaksi: pendingTrx.nomor_transaksi,
        transaksi_id: pendingTrx.id
      });
      if (res.data?.success) {
        toastSuccess('Transaksi Dibatalkan', 'Silakan pilih tagihan dan bayar kembali.');
        fetchKeuangan();
      }
    } catch (err) {
      showError('Gagal Membatalkan', err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Open Receipt
  const handleBukaKuitansi = async (kuitansiNomor, trxId = null) => {
    try {
      setLoadingKuitansi(true);
      setIsKuitansiOpen(true);
      const res = await axios.get(`/api/keuangan/wali/kuitansi?${kuitansiNomor ? `nomor_kuitansi=${kuitansiNomor}` : `transaksi_id=${trxId}`}`);
      if (res.data?.success) {
        setKuitansiData(res.data.data);
      }
    } catch (err) {
      showError('Gagal Memuat Kuitansi', err.response?.data?.message || err.message);
    } finally {
      setLoadingKuitansi(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toastSuccess('Disalin!', 'Nomor Virtual Account berhasil disalin ke clipboard.');
  };

  const formatRp = (val) => `Rp ${parseFloat(val || 0).toLocaleString('id-ID')}`;

  const summary = data?.summary || {};
  const tagihanBulanan = data?.tagihanBulanan || [];
  const biayaAwalMasuk = data?.biayaAwalMasuk || [];
  const riwayat = data?.riwayatTransaksi || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      
      {/* Top Header Bar Terpadu Emerald Green (Persis Absensi) */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Tagihan & Pembayaran
              </h2>
            </div>
          </div>

          <button 
            onClick={fetchKeuangan}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Segarkan Data Tagihan"
          >
            <RotateCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* HERO STAT CARD */}
        <div style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
          borderRadius: '20px',
          padding: '16px 16px 14px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.35)',
          marginBottom: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#bae6fd',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                TOTAL SELURUH TAGIHAN
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {summary.formattedTotalBelumBayar || 'Rp 0'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                SPP bulanan, uang masuk & administrasi santri
              </div>
            </div>

            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.16)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.4rem'
            }}>
              💳
            </div>
          </div>

          {/* 2 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '10px 12px',
            borderRadius: '14px'
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Tunggakan SPP Bulanan</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#7dd3fc', marginTop: '2px' }}>
                {summary.formattedBulanan || 'Rp 0'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sisa Biaya Awal Masuk</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fef08a', marginTop: '2px' }}>
                {summary.formattedSisaBiayaMasuk || 'Rp 0'}
              </div>
            </div>
          </div>
        </div>

        {/* 2 SEGMENT TABS: TAGIHAN AKTIF & RIWAYAT PEMBAYARAN */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: '#e2e8f0',
          padding: '3px',
          borderRadius: '14px',
          marginBottom: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('tagihan')}
            style={{
              padding: '9px 12px',
              borderRadius: '11px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'tagihan' ? 800 : 600,
              cursor: 'pointer',
              background: activeSubTab === 'tagihan' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'tagihan' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'tagihan' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={14} color={activeSubTab === 'tagihan' ? '#0284c7' : '#64748b'} />
            Tagihan Belum Lunas
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('riwayat')}
            style={{
              padding: '9px 12px',
              borderRadius: '11px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === 'riwayat' ? 800 : 600,
              cursor: 'pointer',
              background: activeSubTab === 'riwayat' ? '#ffffff' : 'transparent',
              color: activeSubTab === 'riwayat' ? '#0f172a' : '#64748b',
              boxShadow: activeSubTab === 'riwayat' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} color={activeSubTab === 'riwayat' ? '#0284c7' : '#64748b'} />
            Riwayat & Kuitansi
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: TAGIHAN AKTIF */}
      {activeSubTab === 'tagihan' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* REMINDER PILL JIKA POPUP DITUTUP SEMENTARA */}
          {data?.transaksiPending && !isPendingModalOpen && (
            <button
              onClick={() => setIsPendingModalOpen(true)}
              style={{
                width: '100%',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                color: '#b45309',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.78rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> 1 Transaksi Menunggu Pembayaran
              </span>
              <span style={{ fontWeight: 800, color: '#92400e' }}>Buka Pop-up &gt;</span>
            </button>
          )}

          {/* POPUP MODAL TRANSAKSI PENDING */}
          {isPendingModalOpen && data?.transaksiPending && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 99999,
              padding: '16px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '380px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}>
                {/* Header Popup */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                  color: '#fff',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={18} color="#f59e0b" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Menunggu Pembayaran</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        #{data.transaksiPending.nomor_transaksi}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPendingModalOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: 'none',
                      color: '#fff',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Content Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL YANG HARUS DIBAYAR</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                      {formatRp(data.transaksiPending.total_bayar)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px', fontWeight: 600 }}>
                      {data.transaksiPending.item_dibayar || 'Tagihan Santri'}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                    Transaksi pembayaran ini masih aktif. Anda dapat melanjutkan pembayaran atau membatalkannya untuk memilih metode lain.
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleLanjutkanBayar(data.transaksiPending)}
                      disabled={processing}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        color: '#fff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                      }}
                    >
                      <CreditCard size={16} /> Lanjutkan Bayar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBatalkanTransaksi(data.transaksiPending)}
                      disabled={processing}
                      style={{
                        width: '100%',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '11px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      Ganti Metode / Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* SECTION 1: ADMINISTRASI BULANAN (SPP / SYAHRIAH) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Administrasi Bulanan (SPP)
                </span>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Pilih 1 bulan, beberapa bulan, atau lunasi semua
                </div>
              </div>

              {tagihanBulanan.length > 0 && (
                <button
                  onClick={handleSelectAllBulanan}
                  style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Pilih Semua
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tagihanBulanan.map(t => {
                const sisa = parseFloat(t.sisa_tagihan);
                const isLunas = sisa <= 0 || t.status === 'Lunas';
                const isSelected = !!selectedItems[t.id]?.selected;

                return (
                  <div
                    key={t.id}
                    onClick={() => !isLunas && handleToggleItem(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0fdf4' : (isLunas ? '#f8fafc' : '#ffffff'),
                      cursor: isLunas ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        disabled={isLunas}
                        checked={isSelected || isLunas}
                        onChange={() => {}}
                        style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: isLunas ? 'default' : 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isLunas ? '#94a3b8' : '#0f172a' }}>
                          {t.judul_tagihan}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Jatuh Tempo: {t.jatuh_tempo ? new Date(t.jatuh_tempo).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isLunas ? '#059669' : '#0f172a' }}>
                        {formatRp(t.total_tagihan)}
                      </div>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: isLunas ? '#dcfce7' : '#fee2e2',
                        color: isLunas ? '#166534' : '#991b1b'
                      }}>
                        {isLunas ? 'LUNAS' : 'BELUM BAYAR'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {tagihanBulanan.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Tidak ada tagihan bulanan tercatat.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: BIAYA AWAL MASUK PESANTREN (BERTARAF / CICILAN) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Biaya Awal Masuk Pesantren
              </span>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Dapat dicicil per komponen (misal: bayar kaos rayon / seragam terlebih dahulu)
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {biayaAwalMasuk.map(item => {
                const sisa = parseFloat(item.sisa_tagihan);
                const isLunas = sisa <= 0 || item.status === 'Lunas';
                const isSelected = !!selectedItems[item.id]?.selected;
                const sudahBayar = parseFloat(item.sudah_dibayar || 0);

                return (
                  <div
                    key={item.id}
                    onClick={() => !isLunas && handleToggleItem(item)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0fdf4' : (isLunas ? '#f8fafc' : '#ffffff'),
                      cursor: isLunas ? 'default' : 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          disabled={isLunas}
                          checked={isSelected || isLunas}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: isLunas ? 'default' : 'pointer' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: isLunas ? '#94a3b8' : '#0f172a' }}>
                            {item.judul_tagihan}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Total Biaya: {formatRp(item.total_tagihan)}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isLunas ? '#059669' : '#dc2626' }}>
                          {isLunas ? 'Lunas' : `Sisa ${formatRp(sisa)}`}
                        </div>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: isLunas ? '#dcfce7' : (sudahBayar > 0 ? '#fef3c7' : '#fee2e2'),
                          color: isLunas ? '#166534' : (sudahBayar > 0 ? '#92400e' : '#991b1b')
                        }}>
                          {isLunas ? 'LUNAS' : (sudahBayar > 0 ? `TERBAYAR ${formatRp(sudahBayar)}` : 'BELUM BAYAR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RIWAYAT PEMBAYARAN & KUITANSI */}
      {activeSubTab === 'riwayat' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {riwayat.map(trx => (
            <div
              key={trx.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID') : '-'}
                </span>
                <span style={{
                  background: trx.status_pembayaran === 'Berhasil' ? '#ecfdf5' : '#fef3c7',
                  color: trx.status_pembayaran === 'Berhasil' ? '#059669' : '#d97706',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  {trx.status_pembayaran}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                    {trx.item_dibayar || trx.keterangan || 'Pembayaran Tagihan'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                    {trx.channel_pembayaran || trx.metode_pembayaran}
                  </div>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>
                  {formatRp(trx.total_bayar)}
                </div>
              </div>

              {trx.kuitansi_nomor && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    No: {trx.kuitansi_nomor}
                  </span>
                  <button
                    onClick={() => handleBukaKuitansi(trx.kuitansi_nomor)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileText size={13} /> Lihat Kuitansi
                  </button>
                </div>
              )}
            </div>
          ))}

          {riwayat.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', background: '#fff', borderRadius: '16px' }}>
              Belum ada riwayat transaksi pembayaran.
            </div>
          )}
        </div>
      )}

      {/* FLOATING BOTTOM CHECKOUT ACTION BAR */}
      {activeSubTab === 'tagihan' && countSelected > 0 && !data?.transaksiPending && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '430px',
          padding: '10px 16px',
          boxSizing: 'border-box',
          zIndex: 40
        }}>
          <div style={{
            background: '#0f172a',
            color: '#fff',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {countSelected} tagihan (+ Biaya Admin)
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                {formatRp(totalSelectedBayar)}
              </div>
            </div>

            <button
              onClick={handleMulaiCheckout}
              disabled={processing}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
              }}
            >
              <CreditCard size={16} /> Bayar Sekarang
            </button>
          </div>
        </div>
      )}

      {/* MODAL KUITANSI PEMBAYARAN RESMI */}
      {isKuitansiOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            position: 'relative',
            boxSizing: 'border-box'
          }}>
            {loadingKuitansi || !kuitansiData ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RotateCw size={24} className="spin" /> Memuat Kuitansi...
              </div>
            ) : (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Kop Kuitansi */}
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '14px' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '4px' }}>
                    PONDOK PESANTREN NURUL WAFA
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Sistem Pembayaran Digital • Bukti Kuitansi Sah
                  </div>
                </div>

                {/* Badge Status Lunas */}
                <div style={{
                  background: '#ecfdf5',
                  border: '1.5px solid #059669',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#059669',
                  fontWeight: 800,
                  fontSize: '0.86rem'
                }}>
                  <CheckCircle size={18} /> PEMBAYARAN BERHASIL (LUNAS)
                </div>

                {/* Info Identitas Santri & Kuitansi */}
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>No. Kuitansi:</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0284c7' }}>{kuitansiData.transaksi?.kuitansi_nomor}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Tanggal:</span>
                    <span style={{ fontWeight: 600 }}>{new Date(kuitansiData.transaksi?.tanggal_bayar || kuitansiData.transaksi?.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Nama Santri:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{kuitansiData.transaksi?.nama_santri}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>NIS / Asrama:</span>
                    <span style={{ fontWeight: 600 }}>{kuitansiData.transaksi?.nis} • {kuitansiData.transaksi?.nama_asrama || 'Asrama'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Metode Bayar:</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{kuitansiData.transaksi?.channel_pembayaran || kuitansiData.transaksi?.metode_pembayaran}</span>
                  </div>
                </div>

                {/* Rincian Item Tagihan yang Dibayar */}
                <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '10px 0' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>RINCIAN PEMBAYARAN:</div>
                  {(kuitansiData.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                      <span style={{ color: '#334155' }}>{it.judul_tagihan}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRp(it.nominal_alokasi)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 900, color: '#059669', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                    <span>TOTAL DIBAYAR</span>
                    <span>{formatRp(kuitansiData.transaksi?.total_bayar)}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.4 }}>
                  Kuitansi digital ini diterbitkan secara resmi oleh sistem Ruang Ponpes dan sah tanpa tanda tangan basah.
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Printer size={14} /> Cetak
                  </button>
                  <button
                    onClick={() => setIsKuitansiOpen(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#059669',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    Tutup Kuitansi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

