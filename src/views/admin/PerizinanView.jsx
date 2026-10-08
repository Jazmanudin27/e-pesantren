import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DoorOpen, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  QrCode, 
  CheckCircle2, 
  LogOut, 
  LogIn, 
  Loader2, 
  X, 
  User, 
  Building, 
  Calendar, 
  Clock, 
  Save, 
  Phone 
} from 'lucide-react';

import SearchableSelect from '../../components/SearchableSelect';

export default function PerizinanView() {
  const [izinList, setIzinList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua Jenis');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    santri_id: '',
    jenis_izin: 'Izin Pulang',
    keperluan: 'Kepentingan keluarga / libur pondok',
    tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
    tgl_kembali_rencana: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    nama_penjemput_mahrom: '',
    no_hp_penjemput: '',
    hubungan_mahrom: 'Orang Tua (Ayah)',
    status: 'Disetujui Pengasuh',
    disetujui_oleh: 'KH. Ahmad Fauzan (Pengasuh)'
  });

  const DEFAULT_SANTRI = [
    { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib' },
    { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab' },
    { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' },
    { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib' },
    { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra' },
    { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resIzin, resSantri] = await Promise.all([
        axios.get('/api/perizinan'),
        axios.get('/api/santri')
      ]);

      if (resIzin.data && resIzin.data.success) {
        setIzinList(resIzin.data.data || []);
      }
      if (resSantri.data && resSantri.data.success && resSantri.data.data && resSantri.data.data.length > 0) {
        setSantriList(resSantri.data.data);
      } else {
        setSantriList(DEFAULT_SANTRI);
      }
    } catch (err) {
      console.error('Gagal mengambil data perizinan:', err);
      setSantriList(DEFAULT_SANTRI);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDetail = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    const firstSantri = santriList[0];
    setFormData({
      id: null,
      santri_id: firstSantri?.id || '',
      jenis_izin: 'Izin Pulang',
      keperluan: 'Kepentingan keluarga / libur pondok',
      tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      nama_penjemput_mahrom: firstSantri ? firstSantri.nama_wali || '' : '',
      no_hp_penjemput: firstSantri ? firstSantri.no_wa_wali || '' : '',
      hubungan_mahrom: firstSantri ? firstSantri.hubungan_wali || 'Orang Tua (Ayah)' : 'Orang Tua (Ayah)',
      status: 'Disetujui Pengasuh',
      disetujui_oleh: 'KH. Ahmad Fauzan (Pengasuh)'
    });
    setIsFormOpen(true);
  };

  const handleSantriSelectChange = (santriId) => {
    const s = santriList.find(item => item.id.toString() === santriId.toString());
    if (s) {
      setFormData(prev => ({
        ...prev,
        santri_id: santriId,
        nama_penjemput_mahrom: s.nama_wali || prev.nama_penjemput_mahrom,
        no_hp_penjemput: s.no_wa_wali || prev.no_hp_penjemput,
        hubungan_mahrom: s.hubungan_wali || prev.hubungan_mahrom
      }));
    } else {
      setFormData(prev => ({ ...prev, santri_id: santriId }));
    }
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      jenis_izin: item.jenis_izin || 'Izin Pulang',
      keperluan: item.keperluan || '',
      tgl_keluar_rencana: item.tgl_keluar_rencana ? item.tgl_keluar_rencana.slice(0, 16) : new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: item.tgl_kembali_rencana ? item.tgl_kembali_rencana.slice(0, 16) : new Date().toISOString().slice(0, 16),
      nama_penjemput_mahrom: item.nama_penjemput_mahrom || '',
      no_hp_penjemput: item.no_hp_penjemput || '',
      hubungan_mahrom: item.hubungan_mahrom || 'Orang Tua',
      status: item.status || 'Menunggu Persetujuan',
      disetujui_oleh: item.disetujui_oleh || 'Dewan Pengasuh'
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      alert('Pilih santri terlebih dahulu!');
      return;
    }
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/perizinan', formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/perizinan/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan perizinan: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, barcode) => {
    if (window.confirm(`Yakin ingin menghapus surat izin "${barcode}"?`)) {
      try {
        await axios.delete(`/api/perizinan/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleGateCheckout = async (id) => {
    if (window.confirm('Verifikasi santri keluar gerbang pondok sekarang?')) {
      try {
        await axios.post('/api/perizinan/checkout', { id, satpam: 'Petugas Pos Gerbang' });
        fetchData();
      } catch (err) {
        alert('Gagal check-out: ' + err.message);
      }
    }
  };

  const handleGateCheckin = async (id) => {
    if (window.confirm('Verifikasi santri telah tiba dan masuk kembali ke pondok?')) {
      try {
        await axios.post('/api/perizinan/checkin', { id, satpam: 'Petugas Pos Gerbang' });
        fetchData();
      } catch (err) {
        alert('Gagal check-in: ' + err.message);
      }
    }
  };

  // Stats calculation
  const totalIzin = izinList.length;
  const countAktifKeluar = izinList.filter(i => i.status === 'Aktif Keluar').length;
  const countTepatWaktu = izinList.filter(i => i.status === 'Kembali Tepat Waktu').length;
  const countTerlambat = izinList.filter(i => i.status === 'Terlambat Kembali' || i.status === 'Menunggu Persetujuan').length;

  const filteredList = izinList.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch = (
      row.nama_santri?.toLowerCase().includes(q) ||
      row.nis?.toLowerCase().includes(q) ||
      row.barcode?.toLowerCase().includes(q) ||
      row.kode_izin?.toLowerCase().includes(q) ||
      row.nama_penjemput_mahrom?.toLowerCase().includes(q) ||
      row.keperluan?.toLowerCase().includes(q) ||
      row.nama_asrama?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'disetujui' ? row.status === 'Disetujui Pengasuh' :
      activeFilterTab === 'keluar' ? row.status === 'Aktif Keluar' :
      activeFilterTab === 'selesai' ? (row.status === 'Kembali Tepat Waktu' || row.status === 'Terlambat Kembali') : true;

    const matchJenis = filterJenis === 'Semua Jenis' ? true : row.jenis_izin === filterJenis;
    const matchStatus = filterStatus === 'Semua Status' ? true : row.status === filterStatus;

    return matchSearch && matchTab && matchJenis && matchStatus;
  });

  const santriOptions = santriList.map((s) => ({
    value: s.id,
    label: s.nama_santri,
    sublabel: `NIS: ${s.nis} • ${s.nama_asrama || 'Asrama'}`
  }));

  const jenisIzinOptions = [
    { value: 'Izin Pulang', label: 'Izin Pulang' },
    { value: 'Izin Berobat', label: 'Izin Berobat' },
    { value: 'Izin Keluar Komplek', label: 'Izin Keluar Komplek' },
    { value: 'Izin Khusus', label: 'Izin Khusus' }
  ];

  const statusIzinOptions = [
    { value: 'Disetujui Pengasuh', label: 'Disetujui Pengasuh (Siap Keluar)' },
    { value: 'Menunggu Persetujuan', label: 'Menunggu Persetujuan' },
    { value: 'Aktif Keluar', label: 'Aktif Keluar (Sudah di Luar)' },
    { value: 'Kembali Tepat Waktu', label: 'Kembali Tepat Waktu' },
    { value: 'Terlambat Kembali', label: 'Terlambat Kembali' }
  ];

  const hubunganMahromOptions = [
    { value: 'Orang Tua (Ayah)', label: 'Orang Tua (Ayah)' },
    { value: 'Orang Tua (Ibu)', label: 'Orang Tua (Ibu)' },
    { value: 'Kakak Kandung', label: 'Kakak Kandung' },
    { value: 'Paman / Bibi (Mahrom)', label: 'Paman / Bibi (Mahrom)' },
    { value: 'Kakek / Nenek', label: 'Kakek / Nenek' },
    { value: 'Wali Resmi', label: 'Wali Resmi' }
  ];

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL PENGAJUAN IZIN</div>
            <div className="stat-colored-number">{totalIzin}</div>
          </div>
          <div className="stat-colored-icon-box">
            <DoorOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI AKTIF DI LUAR</div>
            <div className="stat-colored-number">{countAktifKeluar}</div>
          </div>
          <div className="stat-colored-icon-box">
            <LogOut size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">KEMBALI TEPAT WAKTU</div>
            <div className="stat-colored-number">{countTepatWaktu}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">MENUNGGU / TERLAMBAT</div>
            <div className="stat-colored-number">{countTerlambat}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <DoorOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Perizinan Santri & Validasi Gerbang Satpam</h2>
            <p>Kelola surat izin santri, barcode digital gate pass, data mahrom penjemput, dan kepulangan santri</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> + Buat Surat Izin Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <DoorOpen size={14} /> Semua Permohonan ({izinList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'disetujui' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('disetujui')}
        >
          <CheckCircle2 size={14} /> Siap Keluar ({izinList.filter(i => i.status === 'Disetujui Pengasuh').length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'keluar' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('keluar')}
        >
          <LogOut size={14} /> Aktif di Luar ({countAktifKeluar})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'selesai' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('selesai')}
        >
          <LogIn size={14} /> Selesai / Tiba ({countTepatWaktu + izinList.filter(i => i.status === 'Terlambat Kembali').length})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari barcode, nama santri, NIS, atau nama penjemput..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '160px' }}>
          <SearchableSelect
            options={['Semua Jenis', 'Izin Pulang', 'Izin Berobat', 'Izin Keluar Komplek', 'Izin Khusus']}
            value={filterJenis}
            onChange={(val) => setFilterJenis(val || 'Semua Jenis')}
            placeholder="Semua Jenis"
          />
        </div>
        <div style={{ minWidth: '170px' }}>
          <SearchableSelect
            options={['Semua Status', 'Disetujui Pengasuh', 'Menunggu Persetujuan', 'Aktif Keluar', 'Kembali Tepat Waktu', 'Terlambat Kembali']}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || 'Semua Status')}
            placeholder="Semua Status"
          />
        </div>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data perizinan...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada data perizinan santri di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th className="td-center" style={{ width: '135px' }}>BARCODE & KODE</th>
                <th>NAMA SANTRI & ASRAMA</th>
                <th className="td-center">JENIS IZIN</th>
                <th>RENCANA JADWAL</th>
                <th>PENJEMPUT / MAHROM</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '130px' }}>POS GERBANG</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                      <QrCode size={13} />
                      <span>{row.barcode || 'PSN-IZN'}</span>
                    </div>
                    <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                      {row.kode_izin}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                      NIS: {row.nis || '-'} • {row.nama_asrama || 'Asrama'} ({row.nama_kamar || '-'})
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${
                      row.jenis_izin === 'Izin Pulang' ? 'badge-primary' :
                      row.jenis_izin === 'Izin Berobat' ? 'badge-danger' :
                      row.jenis_izin === 'Izin Keluar Komplek' ? 'badge-warning' : 'badge-purple'
                    }`}>
                      {row.jenis_izin}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.72rem', color: '#334155' }}>
                      <strong>Keluar:</strong> {row.tgl_keluar_rencana ? new Date(row.tgl_keluar_rencana).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>
                      <strong>Kembali:</strong> {row.tgl_kembali_rencana ? new Date(row.tgl_kembali_rencana).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.76rem' }}>
                      {row.nama_penjemput_mahrom || '-'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {row.hubungan_mahrom} {row.no_hp_penjemput ? `• ${row.no_hp_penjemput}` : ''}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${
                      row.status === 'Kembali Tepat Waktu' ? 'badge-success' :
                      row.status === 'Aktif Keluar' ? 'badge-danger' :
                      row.status === 'Disetujui Pengasuh' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="td-center">
                    {row.status === 'Disetujui Pengasuh' && (
                      <button 
                        className="btn btn-warning btn-sm"
                        style={{ fontSize: '0.68rem', padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        onClick={() => handleGateCheckout(row.id)}
                        title="Santri Keluar Gerbang"
                      >
                        <LogOut size={11} /> Keluar Gerbang
                      </button>
                    )}

                    {row.status === 'Aktif Keluar' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.68rem', padding: '3px 7px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        onClick={() => handleGateCheckin(row.id)}
                        title="Santri Masuk / Tiba Kembali"
                      >
                        <LogIn size={11} /> Check-In Masuk
                      </button>
                    )}

                    {row.status === 'Kembali Tepat Waktu' && (
                      <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={12} /> Tuntas
                      </span>
                    )}

                    {row.status === 'Menunggu Persetujuan' && (
                      <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>
                        Menunggu ACC
                      </span>
                    )}
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => openDetail(row)}
                        title="Lihat Pass & Detail"
                      >
                        <Eye size={12} />
                      </button>
                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => openEditForm(row)}
                        title="Edit Izin"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(row.id, row.barcode || row.kode_izin)}
                        title="Hapus Izin"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL PERIZINAN & DIGITAL GATE PASS          */}
      {/* ==================================================== */}
      {isModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Digital Gate Pass & Surat Izin</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Barcode: {selectedItem.barcode} • Kode: {selectedItem.kode_izin}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px', background: '#f1f5f9' }}>
              
              {/* Barcode Banner Card */}
              <div style={{
                background: '#ffffff',
                border: '2px dashed #0284c7',
                borderRadius: '8px',
                padding: '12px 16px',
                textAlign: 'center',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '1px' }}>
                  VALIDASI DIGITAL GERBANG UTAMA
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284c7', margin: '4px 0', letterSpacing: '2px' }}>
                  {selectedItem.barcode}
                </div>
                <span className={`badge ${selectedItem.status === 'Kembali Tepat Waktu' ? 'badge-success' : selectedItem.status === 'Aktif Keluar' ? 'badge-danger' : 'badge-info'}`}>
                  Status: {selectedItem.status}
                </span>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Nama Santri
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{selectedItem.nama_santri}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>NIS: {selectedItem.nis || '-'}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Asrama & Kobong
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{selectedItem.nama_asrama || '-'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>{selectedItem.nama_kamar || '-'}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Keperluan & Jenis Izin
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0284c7', marginBottom: '2px' }}>{selectedItem.jenis_izin}</div>
                  <div style={{ fontSize: '0.78rem', color: '#334155' }}>{selectedItem.keperluan}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Rencana Keluar Pondok
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.76rem', color: '#0f172a' }}>
                    {selectedItem.tgl_keluar_rencana ? new Date(selectedItem.tgl_keluar_rencana).toLocaleString('id-ID') : '-'}
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#dc2626', fontWeight: 700, marginBottom: '4px' }}>
                    Batas Maksimal Kembali
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#dc2626' }}>
                    {selectedItem.tgl_kembali_rencana ? new Date(selectedItem.tgl_kembali_rencana).toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              </div>

              {/* Data Mahrom Card */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} color="#059669" /> Data Penjemput Mahrom Sah & Persetujuan
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Nama Penjemput:</span> <strong>{selectedItem.nama_penjemput_mahrom || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Hubungan Mahrom:</span> <strong>{selectedItem.hubungan_mahrom || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>No. HP / WA:</span> <strong>{selectedItem.no_hp_penjemput || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Disetujui Oleh:</span> <strong>{selectedItem.disetujui_oleh || 'Dewan Pengasuh'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              {selectedItem.status === 'Disetujui Pengasuh' && (
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    handleGateCheckout(selectedItem.id);
                    closeModal();
                  }}
                >
                  <LogOut size={13} /> Santri Keluar Gerbang
                </button>
              )}

              {selectedItem.status === 'Aktif Keluar' && (
                <button 
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    handleGateCheckin(selectedItem.id);
                    closeModal();
                  }}
                >
                  <LogIn size={13} /> Check-In Masuk
                </button>
              )}

              <button className="btn btn-outline" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM (ADD & EDIT)                             */}
      {/* ==================================================== */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <DoorOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {formMode === 'add' ? 'Buat Surat Izin Santri Baru' : 'Edit Surat Izin Santri'}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                    Pastikan penjemput mahrom sah dan jadwal kepulangan tervalidasi.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '5px', borderRadius: '6px' }}
                title="Tutup Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding: '18px', background: '#f1f5f9' }}>
                
                {/* Santri & Keperluan Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#0284c7" /> SANTRI & JENIS PERMOHONAN
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Pilih Santri Pemohon *</label>
                      <SearchableSelect
                        options={santriOptions}
                        value={formData.santri_id}
                        onChange={(val) => handleSantriSelectChange(val)}
                        placeholder="-- Cari & Pilih Santri dari Database --"
                        searchPlaceholder="Ketik nama santri atau NIS..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Jenis Izin *</label>
                      <SearchableSelect
                        options={jenisIzinOptions}
                        value={formData.jenis_izin}
                        onChange={(val) => setFormData({ ...formData, jenis_izin: val })}
                        placeholder="-- Jenis Izin --"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Status Persetujuan *</label>
                      <SearchableSelect
                        options={statusIzinOptions}
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val })}
                        placeholder="-- Status Persetujuan --"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Keperluan / Alasan Izin *</label>
                      <textarea 
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        rows="2"
                        placeholder="Alasan kepulangan / keluar pondok..."
                        value={formData.keperluan}
                        onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Jadwal Waktu Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} color="#d97706" /> RENCANA WAKTU KELUAR & KEMBALI
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Rencana Keluar *</label>
                      <input 
                        type="datetime-local"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.tgl_keluar_rencana}
                        onChange={(e) => setFormData({ ...formData, tgl_keluar_rencana: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Rencana Kembali (Batas) *</label>
                      <input 
                        type="datetime-local"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.tgl_kembali_rencana}
                        onChange={(e) => setFormData({ ...formData, tgl_kembali_rencana: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Mahrom & Approval Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={14} color="#059669" /> PENJEMPUT MAHROM & APPROVAL
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Nama Penjemput Mahrom *</label>
                      <input 
                        type="text"
                        placeholder="Nama penjemput sah"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.nama_penjemput_mahrom}
                        onChange={(e) => setFormData({ ...formData, nama_penjemput_mahrom: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Hubungan Mahrom *</label>
                      <SearchableSelect
                        options={hubunganMahromOptions}
                        value={formData.hubungan_mahrom}
                        onChange={(val) => setFormData({ ...formData, hubungan_mahrom: val })}
                        placeholder="-- Hubungan Mahrom --"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>No. HP / WA Penjemput *</label>
                      <input 
                        type="text"
                        placeholder="08123456789"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.no_hp_penjemput}
                        onChange={(e) => setFormData({ ...formData, no_hp_penjemput: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Disetujui Oleh</label>
                      <input 
                        type="text"
                        placeholder="KH. Ahmad Fauzan (Pengasuh)"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.disetujui_oleh}
                        onChange={(e) => setFormData({ ...formData, disetujui_oleh: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '12px 18px',
                borderTop: '1px solid #cbd5e1',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button type="button" className="btn btn-outline" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{formMode === 'add' ? 'Terbitkan Surat Izin' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
