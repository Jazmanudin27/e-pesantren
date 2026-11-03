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
  const handleLanjutkanBayar = (pendingTrx) => {
    if (pendingTrx?.snap_token && window.snap) {
      window.snap.pay(pendingTrx.snap_token, {
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
    } else if (pendingTrx?.payment_url) {
      window.open(pendingTrx.payment_url, '_blank');
    } else {
      showError('Gagal', 'Token transaksi tidak ditemukan.');
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
      
      {/* Top Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 24px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
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
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                Santri: {data?.santri?.nama_santri || 'Santri Nurul Wafa'} (NIS: {data?.santri?.nis || '-'})
              </div>
            </div>
          </div>

          <button 
            onClick={fetchKeuangan}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Refresh Tagihan"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* 3 SUMMARY CARDS - SESUAI CONTOH PROMPT */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(10px)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '16px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e6fffa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL SELURUH TAGIHAN BELUM DIBAYAR
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 12px', letterSpacing: '-0.5px' }}>
            {summary.formattedTotalBelumBayar || 'Rp 0'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 600 }}>Tunggakan SPP Bulanan</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {summary.formattedBulanan || 'Rp 0'}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0', fontWeight: 600 }}>Sisa Biaya Awal Masuk</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {summary.formattedSisaBiayaMasuk || 'Rp 0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Sub-Tabs */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveSubTab('tagihan')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'tagihan' ? '#059669' : '#e2e8f0',
            color: activeSubTab === 'tagihan' ? '#fff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <CreditCard size={15} /> Tagihan Belum Lunas
        </button>

        <button
          onClick={() => setActiveSubTab('riwayat')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            background: activeSubTab === 'riwayat' ? '#059669' : '#e2e8f0',
            color: activeSubTab === 'riwayat' ? '#fff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <FileText size={15} /> Riwayat & Kuitansi
        </button>
      </div>

      {/* SUB-TAB 1: TAGIHAN AKTIF */}
      {activeSubTab === 'tagihan' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* BANNER TRANSAKSI PENDING (MENUNGGU PEMBAYARAN) */}
          {data?.transaksiPending && (
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#fff',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <Clock size={13} /> Menunggu Pembayaran
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  #{data.transaksiPending.nomor_transaksi}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total yang Harus Ditransfer:</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                    {formatRp(data.transaksiPending.total_bayar)}
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1', textAlign: 'right', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.transaksiPending.item_dibayar || 'Tagihan Santri'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleLanjutkanBayar(data.transaksiPending)}
                  disabled={processing}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff',
                    border: 'none',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <CreditCard size={15} /> Lanjutkan Bayar
                </button>

                <button
                  type="button"
                  onClick={() => handleBatalkanTransaksi(data.transaksiPending)}
                  disabled={processing}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Ganti Metode / Batal
                </button>
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

