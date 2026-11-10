import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Plus,
  Minus,
  Calendar,
  Clock,
  User,
  ChevronRight,
  X,
  RotateCcw,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  GraduationCap,
  Trash2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { toastSuccess, toastError, showConfirm } from '../../utils/alert.util';

export default function MobileTabungan({ onBackToHome }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_saldo: 0,
    total_masuk: 0,
    total_keluar: 0,
    total_santri_terdaftar: 0
  });
  const [santriList, setSantriList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Santri Detail Modal
  const [selectedSantriId, setSelectedSantriId] = useState(null);
  const [santriDetail, setSantriDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form Modal: 'setor' (tambah saldo) | 'tarik' (pengambilan) | null
  const [trxModalType, setTrxModalType] = useState(null);
  const [submittingTrx, setSubmittingTrx] = useState(false);
  const [formData, setFormData] = useState({
    nominal: '',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: ''
  });

  // Current session admin
  const getAdminNama = () => {
    try {
      const sess = JSON.parse(localStorage.getItem('mobile_session') || '{}');
      return sess.nama || sess.username || 'Admin';
    } catch (e) {
      return 'Admin';
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  // 1. Fetch Global List & Summary
  const fetchTabunganList = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tabungan', {
        params: { search: searchTerm, limit: 100 }
      });
      if (res.data?.success) {
        setSummary(res.data.data.summary || {});
        setSantriList(res.data.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar tabungan:', err);
      toastError('Gagal memuat data tabungan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabunganList();
  }, [searchTerm]);

  // 2. Fetch Single Santri Tabungan Detail
  const fetchSantriDetail = async (santriId) => {
    if (!santriId) return;
    setLoadingDetail(true);
    try {
      const res = await axios.get(`/api/tabungan/santri/${santriId}`);
      if (res.data?.success) {
        setSantriDetail(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil rincian tabungan:', err);
      toastError('Gagal memuat rincian tabungan santri');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenSantri = (santriId) => {
    setSelectedSantriId(santriId);
    fetchSantriDetail(santriId);
  };

  const handleCloseDetail = () => {
    setSelectedSantriId(null);
    setSantriDetail(null);
  };

  // 3. Open Trx Modal
  const handleOpenTrxModal = (type) => {
    setTrxModalType(type);
    setFormData({
      nominal: '',
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: type === 'setor' ? 'Penambahan Saldo' : 'Pengambilan Uang Saku'
    });
  };

  const handleCloseTrxModal = () => {
    setTrxModalType(null);
  };

  // 4. Submit Transaction (Setor / Tarik)
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    const nom = parseFloat(formData.nominal);
    if (!nom || nom <= 0) {
      toastError('Masukkan nominal yang valid');
      return;
    }

    if (trxModalType === 'tarik') {
      const currentSaldo = santriDetail?.saldo_saat_ini || 0;
      if (nom > currentSaldo) {
        toastError(`Saldo tidak mencukupi! Saldo saat ini hanya ${formatRupiah(currentSaldo)}`);
        return;
      }
    }

    setSubmittingTrx(true);
    try {
      const endpoint = trxModalType === 'setor' ? '/api/tabungan/setor' : '/api/tabungan/tarik';
      const res = await axios.post(endpoint, {
        santri_id: selectedSantriId,
        nominal: nom,
        keterangan: formData.keterangan,
        tanggal_transaksi: formData.tanggal,
        admin_nama: getAdminNama()
      });

      if (res.data?.success) {
        toastSuccess(
          trxModalType === 'setor'
            ? `Berhasil menambah saldo ${formatRupiah(nom)}`
            : `Berhasil mencatat pengambilan ${formatRupiah(nom)}`
        );
        handleCloseTrxModal();
        // Refresh detail santri & list global
        fetchSantriDetail(selectedSantriId);
        fetchTabunganList();
      }
    } catch (err) {
      console.error('Gagal memproses transaksi:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toastError(msg || 'Gagal memproses transaksi');
    } finally {
      setSubmittingTrx(false);
    }
  };

  // 5. Batal / Rollback Transaksi
  const handleBatalTransaksi = async (trxId, jenis, nominal) => {
    const ok = await showConfirm(
      'Batalkan Transaksi?',
      `Apakah Anda yakin ingin membatalkan transaksi ${jenis === 'masuk' ? 'Uang Masuk' : 'Pengambilan'} sebesar ${formatRupiah(nominal)}? Saldo santri akan disesuaikan secara otomatis.`,
      'Ya, Batalkan',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/tabungan/transaksi/${trxId}`);
      if (res.data?.success) {
        toastSuccess('Transaksi berhasil dibatalkan');
        fetchSantriDetail(selectedSantriId);
        fetchTabunganList();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toastError(msg || 'Gagal membatalkan transaksi');
    }
  };

  return (
    <div style={{ paddingBottom: '90px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Hero Summary Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d766e 0%, #064e3b 100%)',
          padding: '16px',
          margin: '0 14px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(13, 118, 110, 0.25)',
          borderRadius: '20px',
        }}
      >

        {/* Global Total Saldo Card */}
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
          <div style={{ fontSize: '0.72rem', color: '#bae6fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Dana Tabungan Santri
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
            {formatRupiah(summary.total_saldo)}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.62rem', color: '#a7f3d0', fontWeight: 700 }}>TOTAL UANG MASUK</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ecfdf5', marginTop: '2px' }}>
                +{formatRupiah(summary.total_masuk)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: '#fecaca', fontWeight: 700 }}>TOTAL PENGAMBILAN</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fee2e2', marginTop: '2px' }}>
                -{formatRupiah(summary.total_keluar)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ padding: '14px 14px 6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '14px',
            padding: '0 12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
          }}
        >
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, atau wali..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 10px',
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              background: 'transparent',
              color: '#1e293b'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Santri List */}
      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
            Daftar Santri ({santriList.length})
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Klik santri untuk lihat riwayat
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <RotateCcw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0d766e' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Memuat data tabungan santri...</div>
          </div>
        ) : santriList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Wallet size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
              Tidak ada data santri ditemukan
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
              Coba gunakan kata kunci pencarian yang lain
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {santriList.map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpenSantri(s.id)}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: s.jk === 'P' ? '#fdf2f8' : '#eff6ff',
                      color: s.jk === 'P' ? '#db2777' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    {s.nama_santri ? s.nama_santri.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {s.nama_santri}
                    </div>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '2px',
                      }}
                    >
                      <span>NIS: {s.nis || '-'}</span>
                      <span>•</span>
                      <span>{s.nama_kelas || 'Kelas -'}</span>
                    </div>
                  </div>
                </div>

                {/* Saldo Pill */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>Saldo Tabungan</div>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 900,
                      color: s.saldo > 0 ? '#0f766e' : '#64748b',
                      marginTop: '1px',
                    }}
                  >
                    {formatRupiah(s.saldo)}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '1px' }}>
                    {s.jumlah_transaksi || 0}x transaksi
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          FULL-SCREEN DETAIL MODAL: SALDO & SELURUH RIWAYAT TRANSAKSI SANTRI
      ========================================================================= */}
      {selectedSantriId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#f8fafc',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Top Modal App Bar */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0d766e 0%, #064e3b 100%)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleCloseDetail}
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
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  Buku Tabungan Santri
                </h3>
                <div style={{ fontSize: '0.7rem', color: '#a7f3d0', marginTop: '1px' }}>
                  {santriDetail?.santri?.nama_santri || 'Memuat...'}
                </div>
              </div>
            </div>

            <button
              onClick={() => fetchSantriDetail(selectedSantriId)}
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
                cursor: 'pointer',
              }}
              title="Refresh Riwayat"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <RotateCcw size={32} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0d766e' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Memuat rincian tabungan santri...</div>
              </div>
            ) : santriDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Santri Info Banner */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: santriDetail.santri.jk === 'P' ? '#fdf2f8' : '#eff6ff',
                      color: santriDetail.santri.jk === 'P' ? '#db2777' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    {santriDetail.santri.nama_santri?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                      {santriDetail.santri.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      NIS: {santriDetail.santri.nis || '-'} • {santriDetail.santri.nama_kelas || 'Kelas -'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                      Wali: {santriDetail.santri.nama_wali || '-'} ({santriDetail.santri.no_hp_wali || '-'})
                    </div>
                  </div>
                </div>

                {/* Big Saldo Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #042f2e 100%)',
                    borderRadius: '20px',
                    padding: '18px 20px',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px -4px rgba(15, 118, 110, 0.35)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Saldo Tabungan Saat Ini
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.5px' }}>
                        {formatRupiah(santriDetail.saldo_saat_ini)}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Wallet size={24} color="#a7f3d0" />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#a7f3d0', fontWeight: 700 }}>TOTAL UANG MASUK</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ecfdf5', marginTop: '2px' }}>
                        +{formatRupiah(santriDetail.total_masuk)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: '#fecaca', fontWeight: 700 }}>TOTAL PENGAMBILAN</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fee2e2', marginTop: '2px' }}>
                        -{formatRupiah(santriDetail.total_keluar)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons for Admin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenTrxModal('setor')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Tambah Saldo</span>
                  </button>

                  <button
                    onClick={() => handleOpenTrxModal('tarik')}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <Minus size={18} strokeWidth={2.5} />
                    <span>Ambil Saldo</span>
                  </button>
                </div>

                {/* History Section */}
                <div style={{ marginTop: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                      Riwayat Transaksi ({santriDetail.riwayat_transaksi?.length || 0})
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Otomatis Terupdate
                    </div>
                  </div>

                  {santriDetail.riwayat_transaksi?.length === 0 ? (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '30px 20px',
                        textAlign: 'center',
                        border: '1px dashed #cbd5e1',
                      }}
                    >
                      <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>
                        Belum ada riwayat transaksi
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                        Klik "Tambah Saldo" di atas untuk mencatat saldo awal
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {santriDetail.riwayat_transaksi.map((t) => {
                        const isMasuk = t.jenis_transaksi === 'masuk';
                        return (
                          <div
                            key={t.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '14px',
                              padding: '12px 14px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '10px',
                                  background: isMasuk ? '#ecfdf5' : '#fef2f2',
                                  color: isMasuk ? '#059669' : '#dc2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {isMasuk ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {t.keterangan || (isMasuk ? 'Penambahan Saldo' : 'Pengambilan')}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.68rem',
                                    color: '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '2px',
                                  }}
                                >
                                  <span>{formatDateIndo(t.tanggal_transaksi)}</span>
                                  <span>•</span>
                                  <span>{t.kode_transaksi}</span>
                                </div>
                                {/* Saldo Running: Sebelum -> Sesudah */}
                                <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
                                  Saldo: {formatRupiah(t.saldo_sebelum)} &rarr;{' '}
                                  <span style={{ fontWeight: 700, color: '#334155' }}>
                                    {formatRupiah(t.saldo_sesudah)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                              <div
                                style={{
                                  fontSize: '0.92rem',
                                  fontWeight: 900,
                                  color: isMasuk ? '#059669' : '#dc2626',
                                }}
                              >
                                {isMasuk ? '+' : '-'}{formatRupiah(t.nominal)}
                              </div>
                              <button
                                onClick={() => handleBatalTransaksi(t.id, t.jenis_transaksi, t.nominal)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  fontSize: '0.62rem',
                                  padding: '2px 4px',
                                  cursor: 'pointer',
                                  marginTop: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                }}
                                title="Batalkan transaksi ini"
                              >
                                <Trash2 size={11} />
                                <span>Batal</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* =========================================================================
          FORM MODAL: TAMBAH SALDO / AMBIL SALDO
      ========================================================================= */}
      {trxModalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={handleCloseTrxModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '380px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: trxModalType === 'setor' ? '#ecfdf5' : '#fef2f2',
                    color: trxModalType === 'setor' ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {trxModalType === 'setor' ? <Plus size={18} /> : <Minus size={18} />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    {trxModalType === 'setor' ? 'Tambah Saldo Tabungan' : 'Catat Pengambilan'}
                  </h4>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    {santriDetail?.santri?.nama_santri}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseTrxModal}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction}>
              {/* Saldo Saat Ini Reference */}
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Saldo Saat Ini:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e' }}>
                  {formatRupiah(santriDetail?.saldo_saat_ini || 0)}
                </span>
              </div>

              {/* Nominal Input */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nominal Transaksi (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 100000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Quick Nominal Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[20000, 50000, 100000, 200000, 500000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setFormData({ ...formData, nominal: chip.toString() })}
                    style={{
                      background: formData.nominal === chip.toString() ? '#0d766e' : '#f1f5f9',
                      color: formData.nominal === chip.toString() ? '#ffffff' : '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {formatRupiah(chip)}
                  </button>
                ))}
              </div>

              {/* Tanggal Transaksi */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Keterangan Transaksi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Keterangan Transaksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder={trxModalType === 'setor' ? 'Contoh: Saldo awal / Kiriman orang tua' : 'Contoh: Pengambilan uang saku / Beli kitab'}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Sisa Saldo Preview */}
              {formData.nominal && !isNaN(parseFloat(formData.nominal)) && (
                <div
                  style={{
                    background: trxModalType === 'setor' ? '#ecfdf5' : (parseFloat(formData.nominal) > (santriDetail?.saldo_saat_ini || 0) ? '#fef2f2' : '#f8fafc'),
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Estimasi Saldo Akhir:</span>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: trxModalType === 'setor'
                        ? '#059669'
                        : (parseFloat(formData.nominal) > (santriDetail?.saldo_saat_ini || 0) ? '#dc2626' : '#0f766e'),
                    }}
                  >
                    {trxModalType === 'setor'
                      ? formatRupiah((santriDetail?.saldo_saat_ini || 0) + parseFloat(formData.nominal))
                      : formatRupiah((santriDetail?.saldo_saat_ini || 0) - parseFloat(formData.nominal))}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseTrxModal}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    color: '#475569',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTrx}
                  style={{
                    background: trxModalType === 'setor' ? '#059669' : '#dc2626',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: submittingTrx ? 'not-allowed' : 'pointer',
                    opacity: submittingTrx ? 0.7 : 1,
                  }}
                >
                  {submittingTrx ? 'Menyimpan...' : trxModalType === 'setor' ? 'Simpan Setoran' : 'Konfirmasi Ambil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

