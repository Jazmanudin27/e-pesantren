import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Users,
  History
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
  const [recentTrxList, setRecentTrxList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSekolah, setSelectedSekolah] = useState('Semua');
  const [activeViewTab, setActiveViewTab] = useState('santri'); // 'santri' | 'riwayat'

  // Selected Santri Detail Modal
  const [selectedSantriId, setSelectedSantriId] = useState(null);
  const [santriDetail, setSantriDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form Modal: 'setor' (tambah saldo) | 'tarik' (pengambilan) | null
  const [trxModalType, setTrxModalType] = useState(null);
  const [trxTargetSantri, setTrxTargetSantri] = useState(null); // santri object { id, nama_santri, nis, nama_kelas, saldo }
  const [lockSantriSelection, setLockSantriSelection] = useState(false);
  const [santriPickerSearch, setSantriPickerSearch] = useState('');
  const [santriPickerSekolah, setSantriPickerSekolah] = useState('Semua');
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

  const formatRibuanInput = (rawVal) => {
    const digits = String(rawVal || '').replace(/\D/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
  };

  const parseRibuanInput = (val) => {
    const digits = String(val || '').replace(/\D/g, '');
    return digits ? Number(digits) : 0;
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
        params: { limit: 1000 }
      });
      if (res.data?.success) {
        const listData = res.data.data?.data || [];
        setSummary(res.data.data?.summary || {});
        setRecentTrxList(res.data.data?.riwayat_terbaru || []);
        if (listData.length > 0) {
          setSantriList(listData);
        } else {
          // Fallback jika endpoint belum direstart dan mengembalikan 0 baris
          const fbRes = await axios
            .get('/api/keuangan/admin/kasir-santri-search?limit=1000')
            .catch(() => axios.get('/api/santri'));
          const fbRows = fbRes?.data?.data?.santri || fbRes?.data?.data || [];
          if (Array.isArray(fbRows) && fbRows.length > 0) {
            setSantriList(
              fbRows.map((s) => ({
                ...s,
                saldo: Number(s.saldo || 0),
                total_masuk: Number(s.total_masuk || 0),
                total_keluar: Number(s.total_keluar || 0)
              }))
            );
          } else {
            setSantriList([]);
          }
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar tabungan:', err);
      try {
        const fbRes = await axios
          .get('/api/keuangan/admin/kasir-santri-search?limit=1000')
          .catch(() => axios.get('/api/santri'));
        const fbRows = fbRes?.data?.data?.santri || fbRes?.data?.data || [];
        if (Array.isArray(fbRows) && fbRows.length > 0) {
          setSantriList(
            fbRows.map((s) => ({
              ...s,
              saldo: Number(s.saldo || 0),
              total_masuk: Number(s.total_masuk || 0),
              total_keluar: Number(s.total_keluar || 0)
            }))
          );
        }
      } catch (_) {
        toastError('Gagal memuat data tabungan');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabunganList();
  }, []);

  // Filtered Santri List on Main Page
  const filteredSantriList = useMemo(() => {
    return (santriList || []).filter((s) => {
      if (selectedSekolah !== 'Semua') {
        const sek = String(s.nama_sekolah || s.nama_kelas || '').toUpperCase();
        if (!sek.includes(selectedSekolah.toUpperCase())) return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchNama = String(s.nama_santri || '').toLowerCase().includes(q);
        const matchNis = String(s.nis || '').toLowerCase().includes(q);
        const matchWali = String(s.nama_wali || '').toLowerCase().includes(q);
        const matchKelas = String(s.nama_kelas || '').toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchWali && !matchKelas) return false;
      }
      return true;
    });
  }, [santriList, selectedSekolah, searchTerm]);

  // Filtered Recent Transactions on Main Page
  const filteredRecentTrx = useMemo(() => {
    return (recentTrxList || []).filter((t) => {
      if (selectedSekolah !== 'Semua') {
        const sek = String(t.nama_sekolah || t.nama_kelas || '').toUpperCase();
        if (!sek.includes(selectedSekolah.toUpperCase())) return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchNama = String(t.nama_santri || '').toLowerCase().includes(q);
        const matchKode = String(t.kode_transaksi || '').toLowerCase().includes(q);
        const matchKet = String(t.keterangan || '').toLowerCase().includes(q);
        if (!matchNama && !matchKode && !matchKet) return false;
      }
      return true;
    });
  }, [recentTrxList, selectedSekolah, searchTerm]);

  // Filtered Santri inside Input Modal Picker
  const pickerSantriList = useMemo(() => {
    return (santriList || []).filter((s) => {
      if (santriPickerSekolah !== 'Semua') {
        const sek = String(s.nama_sekolah || s.nama_kelas || '').toUpperCase();
        if (!sek.includes(santriPickerSekolah.toUpperCase())) return false;
      }
      if (santriPickerSearch.trim() !== '') {
        const q = santriPickerSearch.toLowerCase();
        const matchNama = String(s.nama_santri || '').toLowerCase().includes(q);
        const matchNis = String(s.nis || '').toLowerCase().includes(q);
        const matchKelas = String(s.nama_kelas || '').toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchKelas) return false;
      }
      return true;
    }).slice(0, 60);
  }, [santriList, santriPickerSekolah, santriPickerSearch]);

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

  // 3. Open Trx Modal (either from Global Main Screen or for a Specific Santri)
  const handleOpenTrxModal = (type, preselectedSantri = null, lockSantri = false) => {
    setTrxModalType(type || 'setor');
    if (preselectedSantri) {
      setTrxTargetSantri({
        id: preselectedSantri.id,
        nama_santri: preselectedSantri.nama_santri,
        nis: preselectedSantri.nis,
        nama_kelas: preselectedSantri.nama_kelas,
        saldo: Number(preselectedSantri.saldo ?? preselectedSantri.saldo_saat_ini ?? 0)
      });
      setLockSantriSelection(Boolean(lockSantri));
    } else if (santriDetail?.santri) {
      setTrxTargetSantri({
        id: santriDetail.santri.id,
        nama_santri: santriDetail.santri.nama_santri,
        nis: santriDetail.santri.nis,
        nama_kelas: santriDetail.santri.nama_kelas,
        saldo: Number(santriDetail.saldo_saat_ini || 0)
      });
      setLockSantriSelection(true);
    } else {
      setTrxTargetSantri(null);
      setLockSantriSelection(false);
    }
    setSantriPickerSearch('');
    setSantriPickerSekolah('Semua');
    setFormData({
      nominal: '',
      metode_pembayaran: 'Tunai',
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: (type || 'setor') === 'setor' ? 'Setor Tabungan Tunai' : 'Pengambilan Uang Saku'
    });
  };

  const handleSwitchTrxType = (newType) => {
    setTrxModalType(newType);
    setFormData((prev) => ({
      ...prev,
      keterangan:
        newType === 'setor'
          ? prev.keterangan === 'Pengambilan Uang Saku' || !prev.keterangan
            ? 'Setor Tabungan Tunai'
            : prev.keterangan
          : prev.keterangan === 'Setor Tabungan Tunai' || !prev.keterangan
          ? 'Pengambilan Uang Saku'
          : prev.keterangan
    }));
  };

  const handleCloseTrxModal = () => {
    setTrxModalType(null);
    setTrxTargetSantri(null);
    setLockSantriSelection(false);
  };

  // Current Saldo of target santri in modal
  const currentTargetSaldo = useMemo(() => {
    if (!trxTargetSantri) return 0;
    const found = santriList.find((s) => Number(s.id) === Number(trxTargetSantri.id));
    if (found) return Number(found.saldo || 0);
    return Number(trxTargetSantri.saldo || 0);
  }, [trxTargetSantri, santriList]);

  // 4. Submit Transaction (Setor / Tarik)
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    if (!trxTargetSantri?.id) {
      toastError('Pilih santri terlebih dahulu!');
      return;
    }

    const nom = parseRibuanInput(formData.nominal);
    if (!nom || nom <= 0) {
      toastError('Masukkan nominal yang valid');
      return;
    }

    if (trxModalType === 'tarik') {
      if (nom > currentTargetSaldo) {
        toastError(`Saldo tidak mencukupi! Saldo ${trxTargetSantri.nama_santri} saat ini hanya ${formatRupiah(currentTargetSaldo)}`);
        return;
      }
    }

    setSubmittingTrx(true);
    try {
      const endpoint = trxModalType === 'setor' ? '/api/tabungan/setor' : '/api/tabungan/tarik';
      const res = await axios.post(endpoint, {
        santri_id: trxTargetSantri.id,
        nominal: nom,
        metode_pembayaran: formData.metode_pembayaran || 'Tunai',
        keterangan: formData.keterangan,
        tanggal_transaksi: formData.tanggal,
        admin_nama: getAdminNama()
      });

      if (res.data?.success) {
        toastSuccess(
          trxModalType === 'setor'
            ? `Berhasil mencatat setoran tabungan ${trxTargetSantri.nama_santri} sebesar ${formatRupiah(nom)}`
            : `Berhasil mencatat pengambilan tabungan ${trxTargetSantri.nama_santri} sebesar ${formatRupiah(nom)}`
        );
        const savedSantriId = trxTargetSantri.id;
        handleCloseTrxModal();
        if (selectedSantriId && Number(selectedSantriId) === Number(savedSantriId)) {
          fetchSantriDetail(selectedSantriId);
        }
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
      `Apakah Anda yakin ingin membatalkan transaksi ${jenis === 'masuk' ? 'Setor Tabungan' : 'Pengambilan Tabungan'} sebesar ${formatRupiah(nominal)}? Saldo santri akan disesuaikan secara otomatis.`,
      'Ya, Batalkan',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/tabungan/transaksi/${trxId}`);
      if (res.data?.success) {
        toastSuccess('Transaksi berhasil dibatalkan');
        if (selectedSantriId) {
          fetchSantriDetail(selectedSantriId);
        }
        fetchTabunganList();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      toastError(msg || 'Gagal membatalkan transaksi');
    }
  };

  const keteranganPresets = trxModalType === 'setor'
    ? ['Setor Tabungan Tunai', 'Titipan Uang Saku Wali', 'Transfer Wali Santri', 'Saldo Awal Tabungan']
    : ['Pengambilan Uang Saku', 'Beli Kitab / Buku', 'Keperluan Kesehatan / Obat', 'Pulang / Perizinan'];

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

      {/* Mode Switcher: Saldo Santri vs Riwayat Mutasi */}
      <div style={{ padding: '12px 14px 4px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            background: '#e2e8f0',
            padding: '4px',
            borderRadius: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveViewTab('santri')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              border: 'none',
              background: activeViewTab === 'santri' ? '#ffffff' : 'transparent',
              color: activeViewTab === 'santri' ? '#0f766e' : '#475569',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: activeViewTab === 'santri' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Users size={15} />
            <span>Saldo Santri ({filteredSantriList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('riwayat')}
            style={{
              padding: '8px 10px',
              borderRadius: '9px',
              border: 'none',
              background: activeViewTab === 'riwayat' ? '#ffffff' : 'transparent',
              color: activeViewTab === 'riwayat' ? '#0f766e' : '#475569',
              fontWeight: 800,
              fontSize: '0.76rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: activeViewTab === 'riwayat' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <History size={15} />
            <span>Riwayat Mutasi ({filteredRecentTrx.length})</span>
          </button>
        </div>
      </div>

      {/* Search Input & Sekolah Filter */}
      <div style={{ padding: '10px 14px 6px' }}>
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
            placeholder={
              activeViewTab === 'santri'
                ? 'Cari nama santri, NIS, kelas, atau wali...'
                : 'Cari nama santri, kode bukti, atau keterangan...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 10px',
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

      {/* TAB 1: DAFTAR SALDO SANTRI */}
      {activeViewTab === 'santri' && (
        <div style={{ padding: '6px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
              Daftar Santri ({filteredSantriList.length})
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              Klik santri untuk detail / tombol cepat
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <RotateCcw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0d766e' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Memuat data tabungan santri...</div>
            </div>
          ) : filteredSantriList.length === 0 ? (
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
              {filteredSantriList.map((s) => (
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
                        <span>{s.nama_kelas || s.nama_sekolah || 'Kelas -'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Saldo & Direct Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '8px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>Saldo Tabungan</div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          color: s.saldo > 0 ? '#0f766e' : '#64748b',
                          marginTop: '1px',
                        }}
                      >
                        {formatRupiah(s.saldo)}
                      </div>
                    </div>

                    <div
                      style={{ display: 'flex', gap: '5px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenTrxModal('setor', s, true)}
                        title="Input Setor Tabungan"
                        style={{
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          borderRadius: '9px',
                          padding: '6px 8px',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        <Plus size={13} strokeWidth={2.8} />
                        <span>Nabung</span>
                      </button>
                      {s.saldo > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenTrxModal('tarik', s, true)}
                          title="Input Ambil Tabungan"
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '9px',
                            padding: '6px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={13} strokeWidth={2.8} />
                          <span>Ambil</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT MUTASI TABUNGAN TERBARU */}
      {activeViewTab === 'riwayat' && (
        <div style={{ padding: '6px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
              Riwayat Mutasi Tabungan ({filteredRecentTrx.length})
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <RotateCcw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0d766e' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Memuat riwayat mutasi...</div>
            </div>
          ) : filteredRecentTrx.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                Belum ada mutasi tabungan
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredRecentTrx.map((t) => {
                const isMasuk = t.jenis_transaksi === 'masuk';
                return (
                  <div
                    key={t.id}
                    onClick={() => t.santri_id && handleOpenSantri(t.santri_id)}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
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
                            fontSize: '0.83rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.nama_santri || 'Santri'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, marginTop: '1px' }}>
                          {t.keterangan || (isMasuk ? 'Setor Tabungan' : 'Pengambilan')}
                        </div>
                        <div
                          style={{
                            fontSize: '0.66rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '2px',
                          }}
                        >
                          <span>{formatDateIndo(t.tanggal_transaksi)}</span>
                          <span>•</span>
                          <span>#{t.kode_transaksi}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 900,
                          color: isMasuk ? '#059669' : '#dc2626',
                        }}
                      >
                        {isMasuk ? '+' : '-'}{formatRupiah(t.nominal)}
                      </div>
                      <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '1px' }}>
                        Saldo: {formatRupiah(t.saldo_sesudah)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBatalTransaksi(t.id, t.jenis_transaksi, t.nominal)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 4px',
                          cursor: 'pointer',
                          marginTop: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
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
      )}

      {/* Floating Action Button (+) for Fast Tabungan Input */}
      <button
        type="button"
        onClick={() => handleOpenTrxModal('setor', null, false)}
        title="Input Tabungan Santri"
        style={{
          position: 'fixed',
          bottom: '86px',
          right: 'max(18px, calc(50% - 210px))',
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0d766e 0%, #059669 100%)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.35)',
          boxShadow: '0 8px 22px rgba(13, 118, 110, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

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
                    onClick={() =>
                      handleOpenTrxModal(
                        'setor',
                        { ...santriDetail.santri, saldo: santriDetail.saldo_saat_ini },
                        true
                      )
                    }
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
                    onClick={() =>
                      handleOpenTrxModal(
                        'tarik',
                        { ...santriDetail.santri, saldo: santriDetail.saldo_saat_ini },
                        true
                      )
                    }
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
                        Klik "Tambah Saldo" di atas untuk mencatat setoran tabungan
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
                                  color: '#ef4444',
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
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
          MODAL INPUT TRANSAKSI TABUNGAN SANTRI (SETOR / AMBIL)
      ========================================================================= */}
      {trxModalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={handleCloseTrxModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: trxModalType === 'setor' ? '#ecfdf5' : '#fef2f2',
                    color: trxModalType === 'setor' ? '#059669' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {trxModalType === 'setor' ? <Plus size={20} strokeWidth={2.8} /> : <Minus size={20} strokeWidth={2.8} />}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
                    {trxModalType === 'setor' ? 'Input Setor Tabungan Santri' : 'Input Ambil Tabungan Santri'}
                  </h4>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Pencatatan Tabungan Bagian Keuangan
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseTrxModal}
                style={{
                  background: '#e2e8f0',
                  border: 'none',
                  padding: '7px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form
              onSubmit={handleSubmitTransaction}
              style={{ padding: '16px 18px 22px', overflowY: 'auto', flex: 1 }}
            >
              {/* Toggle Jenis Transaksi: Setor vs Ambil */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '14px',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchTrxType('setor')}
                  style={{
                    padding: '9px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    background: trxModalType === 'setor' ? '#059669' : 'transparent',
                    color: trxModalType === 'setor' ? '#ffffff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <Plus size={15} strokeWidth={2.8} />
                  <span>Setor (Nabung)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTrxType('tarik')}
                  style={{
                    padding: '9px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    background: trxModalType === 'tarik' ? '#dc2626' : 'transparent',
                    color: trxModalType === 'tarik' ? '#ffffff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <Minus size={15} strokeWidth={2.8} />
                  <span>Ambil (Tarik)</span>
                </button>
              </div>

              {/* STEP 1: PILIH SANTRI */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  Santri *
                </label>

                {trxTargetSantri ? (
                  <div
                    style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      borderRadius: '14px',
                      padding: '11px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#064e3b' }}>
                        {trxTargetSantri.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '2px' }}>
                        NIS: {trxTargetSantri.nis || '-'} • {trxTargetSantri.nama_kelas || 'Kelas -'}
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>
                        Saldo Saat Ini: {formatRupiah(currentTargetSaldo)}
                      </div>
                    </div>

                    {!lockSantriSelection && (
                      <button
                        type="button"
                        onClick={() => setTrxTargetSantri(null)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          borderRadius: '9px',
                          padding: '6px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Ganti Santri
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '10px',
                      background: '#f8fafc',
                    }}
                  >
                    {/* Search Santri Input */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#ffffff',
                        borderRadius: '10px',
                        padding: '0 10px',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      <Search size={16} color="#94a3b8" />
                      <input
                        type="text"
                        placeholder="Ketik nama santri atau NIS..."
                        value={santriPickerSearch}
                        onChange={(e) => setSantriPickerSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 8px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '0.8rem',
                          background: 'transparent',
                        }}
                      />
                      {santriPickerSearch && (
                        <button
                          type="button"
                          onClick={() => setSantriPickerSearch('')}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Scrollable Santri Picker List */}
                    <div
                      style={{
                        maxHeight: '175px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px',
                        marginTop: '8px',
                      }}
                    >
                      {pickerSantriList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '14px', fontSize: '0.75rem', color: '#64748b' }}>
                          Santri tidak ditemukan
                        </div>
                      ) : (
                        pickerSantriList.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setTrxTargetSantri(s)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '10px',
                              padding: '8px 10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                                {s.nama_santri}
                              </div>
                              <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                                NIS: {s.nis || '-'} • {s.nama_kelas || s.nama_sekolah || '-'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Saldo</div>
                              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f766e' }}>
                                {formatRupiah(s.saldo)}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: NOMINAL TRANSAKSI (WITH THOUSAND DOTS) */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155' }}>
                    Nominal {trxModalType === 'setor' ? 'Setoran' : 'Pengambilan'} (Rp) *
                  </label>
                  {formData.nominal && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nominal: '' })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Reset Nominal
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    padding: '0 12px',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#64748b', marginRight: '6px' }}>
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={formData.nominal}
                    onChange={(e) =>
                      setFormData({ ...formData, nominal: formatRibuanInput(e.target.value) })
                    }
                    style={{
                      width: '100%',
                      padding: '11px 0',
                      border: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      outline: 'none',
                      background: 'transparent',
                    }}
                  />
                </div>
              </div>

              {/* Additive Quick Nominal Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {[10000, 20000, 50000, 100000, 250000, 500000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const currentVal = parseRibuanInput(formData.nominal);
                      const nextVal = currentVal + chip;
                      setFormData({ ...formData, nominal: formatRibuanInput(nextVal) });
                    }}
                    style={{
                      background: '#f1f5f9',
                      color: '#0f766e',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '5px 9px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    +{chip / 1000} Rb
                  </button>
                ))}
              </div>

              {/* STEP 3: KANTONG KAS & TANGGAL TRANSAKSI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    {trxModalType === 'setor' ? 'Masuk ke Kantong *' : 'Ambil dari Kantong *'}
                  </label>
                  <select
                    value={formData.metode_pembayaran || 'Tunai'}
                    onChange={(e) => setFormData({ ...formData, metode_pembayaran: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Tunai">Kas Tunai</option>
                    <option value="Transfer Bank">Rekening Bank</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* STEP 4: KETERANGAN TRANSAKSI */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                  Keterangan / Catatan *
                </label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {keteranganPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, keterangan: preset })}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '999px',
                        border: formData.keterangan === preset ? '1px solid #0d766e' : '1px solid #e2e8f0',
                        background: formData.keterangan === preset ? '#ecfdf5' : '#f8fafc',
                        color: formData.keterangan === preset ? '#0f766e' : '#475569',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    trxModalType === 'setor'
                      ? 'Contoh: Setor tabungan tunai / Kiriman orang tua'
                      : 'Contoh: Pengambilan uang saku / Beli kitab'
                  }
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
              {trxTargetSantri && parseRibuanInput(formData.nominal) > 0 && (
                <div
                  style={{
                    background:
                      trxModalType === 'setor'
                        ? '#ecfdf5'
                        : parseRibuanInput(formData.nominal) > currentTargetSaldo
                        ? '#fef2f2'
                        : '#f8fafc',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
                    Estimasi Saldo Akhir:
                  </span>
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 900,
                      color:
                        trxModalType === 'setor'
                          ? '#059669'
                          : parseRibuanInput(formData.nominal) > currentTargetSaldo
                          ? '#dc2626'
                          : '#0f766e',
                    }}
                  >
                    {trxModalType === 'setor'
                      ? formatRupiah(currentTargetSaldo + parseRibuanInput(formData.nominal))
                      : formatRupiah(currentTargetSaldo - parseRibuanInput(formData.nominal))}
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
                    borderRadius: '11px',
                    padding: '11px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingTrx}
                  style={{
                    flex: 1,
                    background: trxModalType === 'setor' ? '#059669' : '#dc2626',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '11px',
                    padding: '11px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    cursor: submittingTrx ? 'not-allowed' : 'pointer',
                    opacity: submittingTrx ? 0.7 : 1,
                  }}
                >
                  {submittingTrx
                    ? 'Menyimpan...'
                    : trxModalType === 'setor'
                    ? 'Simpan Setoran Tabungan'
                    : 'Simpan Pengambilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
