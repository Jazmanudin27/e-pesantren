import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  CreditCard,
  Wallet,
  BarChart3,
  FileText,
  AlertTriangle,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  X,
  ChevronRight,
  ArrowLeft,
  RotateCw,
  Zap,
  Building,
  UserCheck,
  Check,
  Share2,
  DollarSign,
  Calendar
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function MobileKeuangan({ initialSubTab = 'kasir', onBackToHome }) {
  // Sub-tabs: 'kasir' | 'laporan'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialSubTab === 'keuangan-rekap' || initialSubTab === 'laporan' || initialSubTab === 'rekap') return 'laporan';
    return 'kasir';
  });

  // Data Global Keuangan
  const [loading, setLoading] = useState(false);
  const [rekapData, setRekapData] = useState({
    summary: {},
    transaksiTerakhir: [],
    tunggakanSantri: [],
    komponenBiaya: [],
    semuaTagihan: []
  });

  // State Santri & Kasir
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [santriTagihan, setSantriTagihan] = useState({ bulanan: [], bebas: [], riwayat: [] });
  const [loadingTagihan, setLoadingTagihan] = useState(false);

  // State Checklist Pembayaran Kasir: { [tagihan_id]: nominal_bayar }
  const [selectedPayMap, setSelectedPayMap] = useState({});
  const [metodeBayar, setMetodeBayar] = useState('Tunai / Kasir');
  const [processingPay, setProcessingPay] = useState(false);

  // Modal Kuitansi Sukses
  const [kuitansiModal, setKuitansiModal] = useState({
    isOpen: false,
    data: null
  });

  // Filter List SPP & Transaksi & Laporan
  const [sppFilter, setSppFilter] = useState('semua'); // 'semua' | 'nunggak' | 'lunas'
  const [sppSearch, setSppSearch] = useState('');
  const [filterTrxTab, setFilterTrxTab] = useState('Berhasil'); // 'Berhasil' | 'Pending'
  const [midtransFilter, setMidtransFilter] = useState('semua'); // 'semua' | 'Berhasil' | 'Pending' | 'Batal'
  const [checkingMidtransId, setCheckingMidtransId] = useState(null);
  const [laporanSearch, setLaporanSearch] = useState('');
  const [laporanFilterSekolah, setLaporanFilterSekolah] = useState('semua');

  // Sync initial tab jika berubah dari luar: hanya kasir atau laporan
  useEffect(() => {
    if (initialSubTab === 'keuangan-rekap' || initialSubTab === 'laporan' || initialSubTab === 'rekap') {
      setActiveTab('laporan');
    } else {
      setActiveTab('kasir');
    }
  }, [initialSubTab]);

  // Load Santri & Rekap
  const fetchRekapAndSantri = async () => {
    setLoading(true);
    try {
      const [resRekap, resSantri] = await Promise.all([
        axios.get('/api/keuangan/admin/rekap').catch(() => null),
        axios.get('/api/santri').catch(() => null)
      ]);

      if (resRekap?.data?.success && resRekap.data.data) {
        setRekapData(resRekap.data.data);
      }

      if (resSantri?.data?.data && Array.isArray(resSantri.data.data)) {
        setSantriList(resSantri.data.data);
      } else if (resRekap?.data?.data?.santriList) {
        setSantriList(resRekap.data.data.santriList);
      }
    } catch (e) {
      console.warn('Gagal memuat rekap mobile keuangan:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekapAndSantri();
  }, []);

  // Fetch Tagihan saat Santri dipilih
  const fetchTagihanSantri = async (santriId) => {
    setLoadingTagihan(true);
    setSelectedPayMap({});
    try {
      const res = await axios.get(`/api/keuangan/tagihan/${santriId}`);
      if (res.data?.success && res.data.data) {
        setSantriTagihan({
          bulanan: res.data.data.tagihanBulanan || [],
          bebas: res.data.data.biayaAwalMasuk || res.data.data.tagihanBebas || [],
          riwayat: res.data.data.riwayatTransaksi || []
        });
      }
    } catch (err) {
      console.warn('Gagal memuat tagihan santri:', err);
    } finally {
      setLoadingTagihan(false);
    }
  };

  const handleSelectSantri = (santri) => {
    setSelectedSantri(santri);
    setSantriSearch('');
    setIsSearching(false);
    fetchTagihanSantri(santri.id);
  };

  // Toggle Checkbox Tagihan
  const handleTogglePay = (tagihanId, sisaNominal) => {
    setSelectedPayMap((prev) => {
      const copy = { ...prev };
      if (copy[tagihanId] !== undefined) {
        delete copy[tagihanId];
      } else {
        copy[tagihanId] = sisaNominal;
      }
      return copy;
    });
  };

  // Hitung Total Bayar yang Dicentang
  const selectedIds = Object.keys(selectedPayMap);
  const totalBayar = selectedIds.reduce((sum, id) => sum + (parseFloat(selectedPayMap[id]) || 0), 0);

  // Proses Pembayaran Kasir
  const handleProsesBayar = async () => {
    if (!selectedSantri) {
      showError('Santri Belum Dipilih', 'Silakan pilih santri terlebih dahulu.');
      return;
    }
    if (selectedIds.length === 0 || totalBayar <= 0) {
      showError('Pilih Tagihan', 'Centang minimal 1 tagihan untuk dibayarkan.');
      return;
    }

    const ok = await showConfirm(
      'Konfirmasi Pembayaran Kasir',
      `Terima pembayaran untuk ${selectedSantri.nama_santri} sebesar Rp ${totalBayar.toLocaleString('id-ID')} via ${metodeBayar}?`,
      'Ya, Bayar Sekarang',
      'Batal'
    );
    if (!ok) return;

    setProcessingPay(true);
    try {
      const itemsPayload = selectedIds.map((id) => ({
        tagihan_id: parseInt(id),
        nominal: parseFloat(selectedPayMap[id]) || 0
      }));

      const res = await axios.post('/api/keuangan/admin/bayar-langsung', {
        santri_id: parseInt(selectedSantri.id),
        metode_pembayaran: metodeBayar.includes('QRIS') ? 'QRIS' : 'Virtual Account',
        channel_pembayaran: metodeBayar,
        items: itemsPayload
      });

      if (res.data?.success) {
        toastSuccess('Pembayaran Berhasil!', `Kuitansi: ${res.data.data?.kuitansi_nomor || 'Lunas'}`);
        // Tampilkan modal kuitansi digital
        setKuitansiModal({
          isOpen: true,
          data: {
            ...res.data.data,
            nama_santri: selectedSantri.nama_santri,
            nis: selectedSantri.nis,
            no_wa_wali: selectedSantri.no_wa_wali,
            asrama: selectedSantri.nama_asrama || '-',
            total_bayar: totalBayar,
            items: itemsPayload
          }
        });

        setSelectedPayMap({});
        fetchTagihanSantri(selectedSantri.id);
        fetchRekapAndSantri();
      }
    } catch (err) {
      showError('Gagal Bayar', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  // Kirim WhatsApp Kuitansi
  const handleSendWaKuitansi = (kData) => {
    if (!kData?.no_wa_wali) {
      showError('Nomor Tidak Ada', 'Nomor WhatsApp wali santri belum terdaftar di data santri.');
      return;
    }
    let phone = String(kData.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const message = `*KUITANSI PEMBAYARAN RESMI PESANTREN NURUL WAFA*\n\n` +
      `Alhamdulillah, pembayaran telah diterima dan tercatat di sistem:\n\n` +
      `• *No. Kuitansi*: ${kData.kuitansi_nomor || '-'}\n` +
      `• *Santri*: ${kData.nama_santri} (NIS: ${kData.nis || '-'})\n` +
      `• *Tanggal*: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `• *Metode*: ${metodeBayar}\n` +
      `• *Total Dibayar*: Rp ${Number(kData.total_bayar || 0).toLocaleString('id-ID')}\n` +
      `• *Status*: LUNAS ✅\n\n` +
      `Jazakumullah Khairan Katsiran atas kepercayaannya.\n_Sistem Keuangan E-Pesantren_`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Kirim WhatsApp Penagihan Santri Menunggak
  const handleSendWaTunggakan = (item) => {
    if (!item.no_wa_wali) {
      showError('Nomor Tidak Ada', 'Nomor WhatsApp wali santri belum terdaftar.');
      return;
    }
    let phone = String(item.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const message = `*INFORMASI TAGIHAN SYAHRIAH & BIAYA PESANTREN NURUL WAFA*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Wali dari Ananda *${item.nama_santri}* (NIS: ${item.nis || '-'}),\n\n` +
      `Kami menginformasikan rincian kewajiban administrasi pesantren yang saat ini tercatat:\n` +
      `• SPP Bulanan: Rp ${Number(item.tunggakan_bulanan || 0).toLocaleString('id-ID')}\n` +
      (item.tunggakan_biaya_masuk > 0 ? `• Biaya Masuk/Lainnya: Rp ${Number(item.tunggakan_biaya_masuk || 0).toLocaleString('id-ID')}\n` : '') +
      `• *Total Tunggakan*: *Rp ${Number(item.total_tunggakan || 0).toLocaleString('id-ID')}*\n\n` +
      `Pembayaran dapat dilakukan melalui loket Bendahara Pesantren atau transfer online melalui Portal Wali Santri.\n\n` +
      `Jazakumullah Khairan Katsiran.\n_Admin Keuangan E-Pesantren_`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filter daftar santri saat pencarian di tab Kasir
  const filteredSearchSantri = santriSearch.trim()
    ? santriList.filter((s) => {
        const q = santriSearch.toLowerCase();
        return (
          (s.nama_santri || '').toLowerCase().includes(q) ||
          (s.nis || '').toLowerCase().includes(q) ||
          (s.nama_asrama || '').toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  // Cek Status Transaksi Langsung ke Gateway Midtrans
  const handleCekStatusMidtrans = async (trx) => {
    setCheckingMidtransId(trx.id);
    try {
      const res = await axios.post('/api/keuangan/admin/cek-status-midtrans', {
        nomor_transaksi: trx.nomor_transaksi,
        transaksi_id: trx.id
      });
      if (res.data?.success) {
        toastSuccess('Status Midtrans', res.data.message || 'Status berhasil diperbarui');
        fetchRekapAndSantri();
      } else {
        showError('Midtrans Notice', res.data?.message || 'Gagal cek status');
      }
    } catch (e) {
      showError('Gagal Cek Status', e.response?.data?.message || e.message);
    } finally {
      setCheckingMidtransId(null);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      paddingBottom: activeTab === 'kasir' && selectedSantri ? '100px' : '36px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Top Header Terpadu Emerald Green (Persis Header Ortu / Wali: Cuma Back & Title Saja) */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }}>
              {activeTab === 'laporan' ? 'Laporan Kas' : 'Kasir'}
            </h2>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: KASIR BAYAR MOBILE (POS MODERN)
      ========================================================================= */}
      {activeTab === 'kasir' && (
        <div style={{ padding: '16px 14px' }}>
          {/* Card Santri Selector */}
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px -2px rgba(0,0,0,0.05)',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
              Santri yang Melakukan Pembayaran
            </div>

            {/* Input Search Santri */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '10px 14px'
              }}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari Nama Santri / NIS / Asrama..."
                  value={santriSearch}
                  onChange={(e) => {
                    setSantriSearch(e.target.value);
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    width: '100%',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
                {santriSearch && (
                  <button
                    onClick={() => {
                      setSantriSearch('');
                      setIsSearching(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSearching && filteredSearchSantri.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: '#ffffff',
                  borderRadius: '16px',
                  marginTop: '6px',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                  border: '1px solid #e2e8f0',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  {filteredSearchSantri.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSantri(s)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                          {s.nama_santri}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          NIS: {s.nis || '-'} • {s.nama_asrama || '-'} • <b style={{ color: '#0369a1' }}>{s.nama_sekolah || 'SMP'} ({s.tingkat_sekolah || '-'})</b>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profil Santri Terpilih */}
            {selectedSantri ? (
              <div style={{
                marginTop: '14px',
                padding: '12px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {selectedSantri.nama_santri.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#065f46' }}>
                      {selectedSantri.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#047857' }}>
                      NIS: {selectedSantri.nis || '-'} • {selectedSantri.nama_asrama || 'Asrama'} • <b>{selectedSantri.nama_sekolah || 'SMP Nurul Wafa'} ({selectedSantri.tingkat_sekolah || '-'})</b>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSantri(null);
                    setSantriTagihan({ bulanan: [], bebas: [], riwayat: [] });
                    setSelectedPayMap({});
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    color: '#ef4444',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Pilih Santri ({santriList.length})
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    Klik 'Bayar' untuk buka tagihan
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '58vh', overflowY: 'auto' }}>
                  {(santriList || [])
                    .filter((s) => {
                      if (!santriSearch.trim()) return true;
                      const q = santriSearch.toLowerCase();
                      return (
                        (s.nama_santri || '').toLowerCase().includes(q) ||
                        (s.nis || '').toLowerCase().includes(q) ||
                        (s.nama_asrama || '').toLowerCase().includes(q) ||
                        (s.nama_sekolah || '').toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 40)
                    .map((s) => (
                      <div
                        key={s.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                            {s.nama_santri}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            NIS: {s.nis || '-'} • Asrama: {s.nama_asrama || '-'} • <b style={{ color: '#059669' }}>{s.nama_sekolah || 'SMP'} ({s.tingkat_sekolah || '-'})</b>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectSantri(s)}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#047857',
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <span>Bayar</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Rincian Tagihan Santri */}
          {selectedSantri && (
            <>
              {loadingTagihan ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                  <RotateCw size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                  Memuat rincian tagihan santri...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Metode Pembayaran Card */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '14px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Pilih Metode Kasir
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {['Tunai / Kasir', 'Transfer Bank', 'QRIS Dinamis'].map((m) => {
                        const isSel = metodeBayar === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setMetodeBayar(m)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: '10px',
                              border: isSel ? '1.5px solid #059669' : '1px solid #e2e8f0',
                              background: isSel ? '#ecfdf5' : '#f8fafc',
                              color: isSel ? '#065f46' : '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: isSel ? 800 : 600,
                              cursor: 'pointer'
                            }}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1. Tagihan SPP Bulanan */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="#059669" />
                        <span>SPP Bulanan Rutin</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {santriTagihan.bulanan.filter((t) => t.status === 'Lunas').length} / {santriTagihan.bulanan.length} Lunas
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {santriTagihan.bulanan.map((t) => {
                        const isLunas = t.status === 'Lunas';
                        const isChecked = selectedPayMap[t.id] !== undefined;
                        const sisa = parseFloat(t.sisa_tagihan || t.total_tagihan || 0);

                        return (
                          <div
                            key={t.id}
                            onClick={() => !isLunas && handleTogglePay(t.id, sisa)}
                            style={{
                              padding: '12px',
                              borderRadius: '12px',
                              border: isChecked ? '1.5px solid #059669' : '1px solid #e2e8f0',
                              background: isChecked ? '#f0fdf4' : isLunas ? '#f8fafc' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: isLunas ? 'default' : 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {!isLunas && (
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '6px',
                                  border: isChecked ? 'none' : '1.5px solid #94a3b8',
                                  background: isChecked ? '#059669' : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff'
                                }}>
                                  {isChecked && <Check size={14} strokeWidth={3} />}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isLunas ? '#64748b' : '#0f172a' }}>
                                  {t.periode_bulan || t.judul_tagihan}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                  Rp {Number(t.total_tagihan || 0).toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isLunas ? (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}>
                                  LUNAS
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: isChecked ? '#059669' : '#e11d48'
                                }}>
                                  Rp {sisa.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {santriTagihan.bulanan.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Tidak ada tagihan bulanan tercatat.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Biaya Bebas / Non-Bulanan (Biaya Masuk, Seragam, dll) */}
                  {santriTagihan.bebas.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={16} color="#d97706" />
                        <span>Biaya Masuk & Non-Bulanan (Bisa Dicicil)</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {santriTagihan.bebas.map((t) => {
                          const isLunas = t.status === 'Lunas';
                          const sisa = parseFloat(t.sisa_tagihan || t.total_tagihan || 0);
                          const isChecked = selectedPayMap[t.id] !== undefined;

                          return (
                            <div
                              key={t.id}
                              style={{
                                padding: '12px',
                                borderRadius: '14px',
                                border: isChecked ? '1.5px solid #d97706' : '1px solid #e2e8f0',
                                background: isChecked ? '#fffbeb' : '#ffffff'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>
                                  {t.judul_tagihan}
                                </div>
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: isLunas ? '#dcfce7' : '#fef3c7',
                                  color: isLunas ? '#15803d' : '#b45309',
                                  padding: '2px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {t.status}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '8px' }}>
                                <span>Total: Rp {Number(t.total_tagihan || 0).toLocaleString('id-ID')}</span>
                                <span style={{ fontWeight: 700, color: '#e11d48' }}>Sisa: Rp {sisa.toLocaleString('id-ID')}</span>
                              </div>

                              {!isLunas && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    onClick={() => handleTogglePay(t.id, sisa)}
                                    style={{
                                      flex: 1,
                                      padding: '7px 10px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      background: isChecked ? '#d97706' : '#f1f5f9',
                                      color: isChecked ? '#ffffff' : '#334155',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isChecked ? '✓ Lunas Penuh Dicocokkan' : 'Lunasi Sisa Ini'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sticky Checkout Bottom Bar */}
          {selectedSantri && (
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 90,
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              padding: '12px 16px 20px',
              boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
              maxWidth: '430px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  {selectedIds.length} Tagihan Dipilih
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                  Rp {totalBayar.toLocaleString('id-ID')}
                </div>
              </div>

              <button
                onClick={handleProsesBayar}
                disabled={processingPay || selectedIds.length === 0}
                style={{
                  background: selectedIds.length > 0 ? 'linear-gradient(135deg, #059669, #047857)' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: selectedIds.length > 0 ? '0 6px 16px rgba(5, 150, 105, 0.4)' : 'none'
                }}
              >
                {processingPay ? (
                  <>
                    <RotateCw size={16} className="spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Bayar Sekarang</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: LAPORAN KAS & REKAP KEUANGAN
      ========================================================================= */}
      {activeTab === 'laporan' && (
        <div style={{ padding: '16px 14px' }}>
          {/* 3 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Kas Masuk Sah (Lunas)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#065f46', marginTop: '4px' }}>
                Rp {Number(rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #fecdd3'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} /> Total Piutang / Tunggakan
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#9f1239', marginTop: '4px' }}>
                Rp {Number(rekapData.summary?.total_tunggakan || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Realisasi Tagihan Bar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>Realisasi Penerimaan SPP</span>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>
                {rekapData.summary?.total_nominal_tagihan > 0
                  ? `${Math.round(((rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0) / rekapData.summary.total_nominal_tagihan) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                width: rekapData.summary?.total_nominal_tagihan > 0
                  ? `${Math.min(100, Math.round(((rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0) / rekapData.summary.total_nominal_tagihan) * 100))}%`
                  : '0%'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: '8px' }}>
              <span>Lunas Terbayar: {rekapData.summary?.jumlah_tagihan_lunas || 0} Tagihan</span>
              <span>Sisa Tertunggak: {rekapData.summary?.jumlah_tagihan_tertunggak || 0} Tagihan</span>
            </div>

            {/* Catatan Transaksi Pending */}
            {(rekapData.transaksiPending || []).length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#fffbeb',
                borderRadius: '10px',
                border: '1px solid #fef3c7',
                fontSize: '0.7rem',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⏳ {(rekapData.transaksiPending || []).length} transaksi online berstatus pending (belum transfer)</span>
                <button
                  onClick={() => {
                    setFilterTrxTab('Pending');
                    setActiveTab('transaksi');
                  }}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Lihat &gt;
                </button>
              </div>
            )}
          </div>

          {/* Quick Action: Buka Kasir */}
          <button
            onClick={() => setActiveTab('kasir')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              marginBottom: '20px'
            }}
          >
            <CreditCard size={18} />
            <span>Buka Loket Kasir Pembayaran</span>
          </button>

          {/* Rincian Transaksi Kas Masuk Sah */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={18} color="#059669" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  Rincian Transaksi Kas Masuk Sah
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                {(rekapData.transaksiTerakhir || []).length} Transaksi Sah
              </span>
            </div>

            {/* Filter & Search Bar */}
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
                placeholder="Cari santri, NIS, no kuitansi..."
                value={laporanSearch}
                onChange={(e) => setLaporanSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem' }}
              />
              {laporanSearch && (
                <button
                  onClick={() => setLaporanSearch('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Sekolah */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'semua', label: 'Semua Sekolah' },
                { id: 'SMP', label: 'SMP' },
                { id: 'SMA', label: 'SMA' },
                { id: 'SMK', label: 'SMK' }
              ].map((f) => {
                const active = laporanFilterSekolah === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setLaporanFilterSekolah(f.id)}
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

            {/* Daftar Transaksi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const list = (rekapData.transaksiTerakhir || []).filter((trx) => {
                  if (laporanFilterSekolah !== 'semua') {
                    const sk = String(trx.nama_sekolah || trx.tingkat_sekolah || '').toUpperCase();
                    if (!sk.includes(laporanFilterSekolah)) return false;
                  }
                  if (laporanSearch.trim()) {
                    const q = laporanSearch.toLowerCase();
                    const sName = String(trx.nama_santri || '').toLowerCase();
                    const sNis = String(trx.nis || '').toLowerCase();
                    const sNo = String(trx.nomor_transaksi || trx.nomor_kuitansi || '').toLowerCase();
                    const sItem = String(trx.rincian_item || trx.keterangan || '').toLowerCase();
                    return sName.includes(q) || sNis.includes(q) || sNo.includes(q) || sItem.includes(q);
                  }
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}>
                      <Receipt size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <div>Belum ada transaksi kas masuk sah yang sesuai filter.</div>
                    </div>
                  );
                }

                return list.map((trx, idx) => {
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

                      {/* Info Santri & Nominal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
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
                            Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                            {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                          </div>
                        </div>
                      </div>

                      {/* Rincian Tagihan */}
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

                      {/* Footer: Metode & Kuitansi */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={12} color="#059669" />
                          <span>{trx.metode_pembayaran || 'Kasir'} {trx.channel_pembayaran ? `(${trx.channel_pembayaran})` : ''}</span>
                        </div>

                        <button
                          onClick={() => setKuitansiModal({
                            isOpen: true,
                            data: {
                              ...trx,
                              kuitansi_nomor: trx.nomor_kuitansi || trx.nomor_transaksi || `KW-${trx.id}`,
                              total_dibayar: trx.total_bayar,
                              santri: { nama_santri: trx.nama_santri, nis: trx.nis, kelas: trx.nama_sekolah || trx.tingkat_sekolah },
                              items_dibayar: [{ judul: trx.rincian_item || trx.keterangan || 'Pembayaran Kasir', nominal: trx.total_bayar }]
                            }
                          })}
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
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STATUS SPP BULANAN SANTRI
      ========================================================================= */}
      {activeTab === 'spp' && (
        <div style={{ padding: '16px 14px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '8px 12px'
            }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={sppSearch}
                onChange={(e) => setSppSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* List Santri SPP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(santriList || [])
              .filter((s) => {
                if (!sppSearch.trim()) return true;
                const q = sppSearch.toLowerCase();
                return (s.nama_santri || '').toLowerCase().includes(q) || (s.nis || '').includes(q);
              })
              .slice(0, 30)
              .map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                      {s.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      NIS: {s.nis || '-'} • Asrama: {s.nama_asrama || '-'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectSantri(s);
                      setActiveTab('kasir');
                    }}
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Bayar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REKAP TUNGGAKAN SANTRI
      ========================================================================= */}
      {activeTab === 'tunggakan' && (
        <div style={{ padding: '16px 14px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#be123c', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} />
            <span>Santri dengan Piutang / Tunggakan Aktif</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(rekapData.tunggakanSantri || []).map((t, idx) => (
              <div
                key={t.santri_id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 2px 6px rgba(190, 18, 60, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                      {t.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      NIS: {t.nis || '-'} • {t.nama_asrama || 'Asrama'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#be123c' }}>
                      Rp {Number(t.total_tunggakan || 0).toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#9f1239' }}>Total Belum Lunas</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    onClick={() => {
                      const found = santriList.find((s) => s.id === t.santri_id);
                      if (found) handleSelectSantri(found);
                      else handleSelectSantri({ id: t.santri_id, nama_santri: t.nama_santri, nis: t.nis, nama_asrama: t.nama_asrama });
                      setActiveTab('kasir');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Bayar di Kasir</span>
                  </button>

                  <button
                    onClick={() => handleSendWaTunggakan(t)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #22c55e',
                      background: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    title="Kirim Tagihan via WhatsApp"
                  >
                    <Send size={13} />
                    <span>Tagih WA</span>
                  </button>
                </div>
              </div>
            ))}

            {(!rekapData.tunggakanSantri || rekapData.tunggakanSantri.length === 0) && (
              <div style={{ padding: '30px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.8rem' }}>
                🎉 Luar biasa! Tidak ada santri yang memiliki tunggakan saat ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Histori Pembayaran Selesai (Semua Selesai: Offline & Online, Bukan Pending) */}
      {activeTab === 'transaksi' && (
        <div style={{ padding: '16px 14px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
              Histori Pembayaran Selesai
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
              Semua transaksi kas masuk yang sah & lunas (Tunai Kasir & Midtrans Selesai)
            </div>
          </div>

          {/* List Transaksi Selesai */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(!rekapData.transaksiTerakhir || rekapData.transaksiTerakhir.length === 0) ? (
              <div style={{
                padding: '36px 16px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '0.8rem'
              }}>
                <Receipt size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <div>Belum ada transaksi kas masuk yang berstatus lunas/berhasil.</div>
              </div>
            ) : (
              rekapData.transaksiTerakhir.map((trx, idx) => (
                <div
                  key={trx.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                        {trx.nama_santri || 'Santri'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                        NIS: {trx.nis || '-'} • #{trx.nomor_transaksi}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#059669' }}>
                        Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        color: '#15803d',
                        marginTop: '2px'
                      }}>
                        ✓ SELESAI
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed #f1f5f9',
                    fontSize: '0.68rem',
                    color: '#64748b'
                  }}>
                    <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      💳 {trx.metode_pembayaran || 'Tunai / Kasir'}
                    </span>
                    <span>
                      {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Histori Gateway Midtrans Lengkap (QRIS & VA - Selesai, Pending, Batal) */}
      {activeTab === 'midtrans' && (
        <div style={{ padding: '16px 14px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
              Histori Gateway Midtrans (QRIS & VA)
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
              Status real-time seluruh transaksi pembayaran digital online
            </div>
          </div>

          {/* Filter Status Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '14px',
            scrollbarWidth: 'none'
          }}>
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'Berhasil', label: 'Selesai' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Batal', label: 'Batal / Expire' }
            ].map(f => {
              const isSelected = midtransFilter === f.id;
              const count = (rekapData.transaksiMidtrans || []).filter(t => {
                if (f.id === 'semua') return true;
                if (f.id === 'Batal') return t.status_pembayaran === 'Batal' || t.status_pembayaran === 'Expired';
                return t.status_pembayaran === f.id;
              }).length;

              return (
                <button
                  key={f.id}
                  onClick={() => setMidtransFilter(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSelected ? '#0891b2' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#64748b',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 2px 6px rgba(8, 145, 178, 0.3)' : 'none'
                  }}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          {/* List Transaksi Midtrans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              const filteredList = (rekapData.transaksiMidtrans || []).filter(t => {
                if (midtransFilter === 'semua') return true;
                if (midtransFilter === 'Batal') return t.status_pembayaran === 'Batal' || t.status_pembayaran === 'Expired';
                return t.status_pembayaran === midtransFilter;
              });

              if (filteredList.length === 0) {
                return (
                  <div style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontSize: '0.8rem'
                  }}>
                    <Zap size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div>Tidak ada histori transaksi Midtrans pada kategori ini.</div>
                  </div>
                );
              }

              return filteredList.map((trx, idx) => {
                const isSuccess = trx.status_pembayaran === 'Berhasil' || trx.status_pembayaran === 'settlement';
                const isPending = trx.status_pembayaran === 'Pending';
                const isChecking = checkingMidtransId === trx.id;

                let statusBg = '#fee2e2';
                let statusColor = '#991b1b';
                let statusText = trx.status_pembayaran || 'Batal';

                if (isSuccess) {
                  statusBg = '#dcfce7';
                  statusColor = '#15803d';
                  statusText = 'Selesai (Settled)';
                } else if (isPending) {
                  statusBg = '#fef3c7';
                  statusColor = '#b45309';
                  statusText = 'Pending (Menunggu)';
                }

                return (
                  <div
                    key={trx.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      border: isPending ? '1.5px dashed #fcd34d' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {trx.nama_santri || 'Santri'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                          #{trx.nomor_transaksi}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: isSuccess ? '#059669' : (isPending ? '#d97706' : '#64748b') }}>
                          Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: statusBg,
                          color: statusColor,
                          marginTop: '2px'
                        }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px dashed #f1f5f9',
                      fontSize: '0.68rem',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2', padding: '2px 6px', borderRadius: '5px', fontWeight: 700 }}>
                          ⚡ {trx.channel_pembayaran || trx.metode_pembayaran || 'Midtrans'}
                        </span>
                      </div>
                      <span>
                        {trx.created_at ? new Date(trx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>

                    {/* Action Khusus Transaksi Pending: Cek Status Langsung ke Midtrans */}
                    {isPending && (
                      <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
                        <button
                          onClick={() => handleCekStatusMidtrans(trx)}
                          disabled={isChecking}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #fed7aa',
                            background: '#fff7ed',
                            color: '#c2410c',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: isChecking ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <RotateCw size={13} className={isChecking ? 'spin' : ''} />
                          <span>{isChecking ? 'Mengecek ke Midtrans...' : 'Cek Status Pembayaran ke Midtrans'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KUITANSI DIGITAL ELEGAN
      ========================================================================= */}
      {kuitansiModal.isOpen && kuitansiModal.data && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '380px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.2s ease-out'
          }}>
            {/* Header Nota */}
            <div style={{
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              padding: '20px 16px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#ffffff',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Pembayaran Berhasil!</h3>
              <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>
                Kuitansi Resmi Pesantren Nurul Wafa
              </div>
            </div>

            {/* Rincian Struk */}
            <div style={{ padding: '20px 18px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>No. Kuitansi</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{kuitansiModal.data.kuitansi_nomor || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Santri</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{kuitansiModal.data.nama_santri}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
                <span>Metode Bayar</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>{metodeBayar}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', color: '#64748b' }}>
                <span>Tanggal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div style={{
                borderTop: '1.5px dashed #cbd5e1',
                paddingTop: '12px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>Total Dibayar</span>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#059669' }}>
                  Rp {Number(kuitansiModal.data.total_bayar || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleSendWaKuitansi(kuitansiModal.data)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#22c55e',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={16} />
                  <span>Kirim Kuitansi ke WA Wali</span>
                </button>

                <button
                  onClick={() => setKuitansiModal({ isOpen: false, data: null })}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
