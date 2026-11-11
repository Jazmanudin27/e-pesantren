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
  X,
  Printer
} from 'lucide-react';
import { toastSuccess, toastError, showConfirm } from '../../utils/alert.util';

export default function TabunganSantriAdminView() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_saldo: 0,
    total_masuk: 0,
    total_keluar: 0,
    total_santri_terdaftar: 0
  });
  const [santriList, setSantriList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Santri for Side Drawer / Detail View
  const [selectedSantriId, setSelectedSantriId] = useState(null);
  const [santriDetail, setSantriDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Action: 'setor' | 'tarik' | null
  const [trxModalType, setTrxModalType] = useState(null);
  const [submittingTrx, setSubmittingTrx] = useState(false);
  const [formData, setFormData] = useState({
    nominal: '',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: ''
  });

  const getAdminNama = () => {
    try {
      const sess = JSON.parse(localStorage.getItem('desktop_session') || sessionStorage.getItem('desktop_session') || '{}');
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
        params: { search: searchTerm, limit: 100 }
      });
      if (res.data?.success) {
        setSummary(res.data.data.summary || {});
        setSantriList(res.data.data.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat tabungan:', err);
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

  const handleSelectSantri = (sId) => {
    setSelectedSantriId(sId);
    fetchSantriDetail(sId);
  };

  // 3. Open Modal Action
  const handleOpenTrxModal = (type) => {
    setTrxModalType(type);
    setFormData({
      nominal: '',
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: type === 'setor' ? 'Penambahan Saldo' : 'Pengambilan Uang Saku'
    });
  };

  // 4. Submit Transaction
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    const nom = parseRibuanInput(formData.nominal);
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
        setTrxModalType(null);
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

  // 5. Batal Transaksi
  const handleBatalTransaksi = async (trxId, jenis, nominal) => {
    const ok = await showConfirm(
      'Batalkan Transaksi?',
      `Batalkan transaksi ${jenis === 'masuk' ? 'Uang Masuk' : 'Pengambilan'} sebesar ${formatRupiah(nominal)}? Saldo akan dikembalikan secara otomatis.`,
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
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Title & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Saldo & Buku Tabungan Santri
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
            Pencatatan penambahan saldo awal, uang masuk, dan pengambilan saku santri secara real-time
          </p>
        </div>
        <button
          onClick={fetchTabunganList}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '10px' }}
        >
          <RotateCcw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL SALDO TABUNGAN</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f766e', marginTop: '6px' }}>
            {formatRupiah(summary.total_saldo)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Dari seluruh {summary.total_santri_terdaftar} santri terdaftar
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL UANG MASUK</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>
            +{formatRupiah(summary.total_masuk)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Setoran & penambahan saldo
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL PENGAMBILAN</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#dc2626', marginTop: '6px' }}>
            -{formatRupiah(summary.total_keluar)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Pengambilan uang saku / jajan
          </div>
        </div>
      </div>

      {/* Main Content Layout: Table on Left + Detail Drawer on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSantriId ? '1fr 450px' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* Table List of Santri */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Daftar Saldo Santri
              </h3>
              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                {santriList.length} Santri
              </span>
            </div>

            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1', padding: '0 10px', width: '280px' }}>
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Cari nama, NIS, wali..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 8px', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.8rem' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>SANTRI</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>KELAS / ASRAMA</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>TOTAL MASUK</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>PENGAMBILAN</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569' }}>SALDO SAAT INI</th>
                  <th style={{ padding: '10px 12px', fontWeight: 800, color: '#475569', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <RotateCcw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0d766e' }} />
                      <div>Memuat data tabungan...</div>
                    </td>
                  </tr>
                ) : santriList.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Tidak ada data santri ditemukan.
                    </td>
                  </tr>
                ) : (
                  santriList.map((s) => {
                    const isSelected = selectedSantriId === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => handleSelectSantri(s.id)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isSelected ? '#f0fdf4' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.nama_santri}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NIS: {s.nis || '-'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#334155' }}>{s.nama_kelas || 'Kelas -'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.nama_asrama || '-'}</div>
                        </td>
                        <td style={{ padding: '12px', color: '#16a34a', fontWeight: 700 }}>
                          +{formatRupiah(s.total_masuk)}
                        </td>
                        <td style={{ padding: '12px', color: '#dc2626', fontWeight: 700 }}>
                          -{formatRupiah(s.total_keluar)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              fontWeight: 900,
                              fontSize: '0.92rem',
                              color: s.saldo > 0 ? '#0f766e' : '#64748b',
                              background: s.saldo > 0 ? '#ccfbf1' : '#f1f5f9',
                              padding: '3px 10px',
                              borderRadius: '8px',
                            }}
                          >
                            {formatRupiah(s.saldo)}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectSantri(s.id);
                            }}
                            className="btn btn-outline"
                            style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: '6px' }}
                          >
                            Buku Tabungan &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail & History Drawer on Right */}
        {selectedSantriId && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={20} color="#0d766e" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                  Buku Tabungan
                </h3>
              </div>
              <button
                onClick={() => setSelectedSantriId(null)}
                style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <RotateCcw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0d766e' }} />
                <div>Memuat buku tabungan...</div>
              </div>
            ) : santriDetail ? (
              <div>
                {/* Santri Card */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>
                    {santriDetail.santri.nama_santri}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    NIS: {santriDetail.santri.nis || '-'} • {santriDetail.santri.nama_kelas || 'Kelas -'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    Wali: {santriDetail.santri.nama_wali || '-'} ({santriDetail.santri.no_hp_wali || '-'})
                  </div>
                </div>

                {/* Saldo Saat Ini Display */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0d766e 0%, #064e3b 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#ffffff',
                    marginBottom: '16px',
                    boxShadow: '0 4px 14px rgba(13, 118, 110, 0.25)',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a7f3d0', textTransform: 'uppercase' }}>
                    SALDO SAAT INI
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                    {formatRupiah(santriDetail.saldo_saat_ini)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: '#a7f3d0' }}>TOTAL MASUK</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>+{formatRupiah(santriDetail.total_masuk)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', color: '#fecaca' }}>PENGAMBILAN</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>-{formatRupiah(santriDetail.total_keluar)}</div>
                    </div>
                  </div>
                </div>

                {/* Two Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => handleOpenTrxModal('setor')}
                    style={{
                      background: '#059669',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={16} /> Tambah Saldo
                  </button>
                  <button
                    onClick={() => handleOpenTrxModal('tarik')}
                    style={{
                      background: '#dc2626',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '10px',
                      padding: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Minus size={16} /> Catat Ambil
                  </button>
                </div>

                {/* Transaction History */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Riwayat Transaksi ({santriDetail.riwayat_transaksi?.length || 0})
                  </div>

                  {santriDetail.riwayat_transaksi?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                      Belum ada transaksi tercatat.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {santriDetail.riwayat_transaksi.map((t) => {
                        const isMasuk = t.jenis_transaksi === 'masuk';
                        return (
                          <div
                            key={t.id}
                            style={{
                              background: '#f8fafc',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                                {t.keterangan || (isMasuk ? 'Penambahan Saldo' : 'Pengambilan')}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                                {formatDateIndo(t.tanggal_transaksi)} • Saldo: {formatRupiah(t.saldo_sebelum)} &rarr;{' '}
                                <span style={{ fontWeight: 700, color: '#0f766e' }}>{formatRupiah(t.saldo_sesudah)}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 900, fontSize: '0.88rem', color: isMasuk ? '#16a34a' : '#dc2626' }}>
                                {isMasuk ? '+' : '-'}{formatRupiah(t.nominal)}
                              </div>
                              <button
                                onClick={() => handleBatalTransaksi(t.id, t.jenis_transaksi, t.nominal)}
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.62rem', cursor: 'pointer', padding: '2px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                title="Batal Transaksi"
                              >
                                <Trash2 size={10} /> Batal
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
        )}
      </div>

      {/* Transaction Form Modal */}
      {trxModalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setTrxModalType(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                {trxModalType === 'setor' ? 'Tambah Saldo Tabungan' : 'Catat Pengambilan Tabungan'}
              </h4>
              <button onClick={() => setTrxModalType(null)} style={{ background: '#f1f5f9', border: 'none', padding: '4px', borderRadius: '50%', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nominal (Rp) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Contoh: 100.000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: formatRibuanInput(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '1rem', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>

              {/* Quick Nominal */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[10000, 20000, 50000, 100000, 250000, 500000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      const cur = parseRibuanInput(formData.nominal);
                      setFormData({ ...formData, nominal: formatRibuanInput(cur + chip) });
                    }}
                    style={{
                      background: '#f1f5f9',
                      color: '#0f766e',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 9px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    +{chip / 1000} Rb
                  </button>
                ))}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tanggal Transaksi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Keterangan Transaksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder={trxModalType === 'setor' ? 'Contoh: Saldo awal / Kiriman orang tua' : 'Contoh: Pengambilan saku / Beli kitab'}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setTrxModalType(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 14px', borderRadius: '8px' }}
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
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: submittingTrx ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingTrx ? 'Menyimpan...' : trxModalType === 'setor' ? 'Simpan Tambah Saldo' : 'Konfirmasi Ambil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

