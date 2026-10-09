import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Award, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  X, 
  User, 
  Building, 
  Calendar, 
  Save 
} from 'lucide-react';

import SearchableSelect from '../../components/SearchableSelect';
import { SURAH_LIST } from '../../utils/quranSurah.util';

export default function TahfidzView() {
  const [setoranList, setSetoranList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [halaqahList, setHalaqahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterTajwid, setFilterTajwid] = useState('Semua Tajwid');
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
    halaqah_id: '',
    asatidz_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis_setoran: 'Ziyadah',
    juz: 1,
    surat_mulai: 'Al-Baqarah',
    ayat_mulai: 1,
    surat_selesai: 'Al-Baqarah',
    ayat_selesai: 20,
    kualitas_tajwid: 'Mumtaz (A)',
    status: 'Lulus',
    catatan: 'Bacaan tartil, makharijul huruf fasih, dengung tajwid tepat.'
  });

  const DEFAULT_SANTRI = [
    { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib' },
    { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab' },
    { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' },
    { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib' },
    { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra' },
    { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab' }
  ];

  const DEFAULT_ASATIDZ = [
    { id: 1, nama_asatidz: 'Ust. Hamdan', gelar: 'S.Th.I, Al-Hafidz', tugas_utama: 'Musyrif Tahfidz Ikhwan' },
    { id: 2, nama_asatidz: 'Ust. Nurul Huda', gelar: 'Al-Hafidz', tugas_utama: 'Musyrif Pengasuhan Putra' },
    { id: 3, nama_asatidz: 'Usth. Salma', gelar: 'M.Pd, Al-Hafidzah', tugas_utama: 'Musyrifah Asrama Putri' },
    { id: 4, nama_asatidz: 'Ust. Ahmad Fauzi', gelar: 'S.Pd.I, Al-Hafidz', tugas_utama: 'Kepala Bagian Tahfidz' }
  ];

  const DEFAULT_HALAQAH = [
    { id: 1, nama_halaqah: "Halaqah Imam Nafi' (Putra)", gender: 'L' },
    { id: 2, nama_halaqah: "Halaqah Imam Ashim (Putra)", gender: 'L' },
    { id: 3, nama_halaqah: "Halaqah Fathimah (Putri)", gender: 'P' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSetoran, resSantri, resAsatidz, resHalaqah] = await Promise.all([
        axios.get('/api/tahfidz/setoran'),
        axios.get('/api/santri'),
        axios.get('/api/asatidz'),
        axios.get('/api/tahfidz/halaqah')
      ]);

      if (resSetoran.data && resSetoran.data.success) {
        setSetoranList(resSetoran.data.data || []);
      }
      if (resSantri.data && resSantri.data.success && resSantri.data.data && resSantri.data.data.length > 0) {
        setSantriList(resSantri.data.data);
      } else {
        setSantriList(DEFAULT_SANTRI);
      }
      if (resAsatidz.data && resAsatidz.data.success && resAsatidz.data.data && resAsatidz.data.data.length > 0) {
        setAsatidzList(resAsatidz.data.data);
      } else {
        setAsatidzList(DEFAULT_ASATIDZ);
      }
      if (resHalaqah.data && resHalaqah.data.success && resHalaqah.data.data && resHalaqah.data.data.length > 0) {
        setHalaqahList(resHalaqah.data.data);
      } else {
        setHalaqahList(DEFAULT_HALAQAH);
      }
    } catch (err) {
      console.error('Gagal memuat data tahfidz:', err);
      setSantriList(DEFAULT_SANTRI);
      setAsatidzList(DEFAULT_ASATIDZ);
      setHalaqahList(DEFAULT_HALAQAH);
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
    const firstAsatidz = asatidzList[0];
    const firstHalaqah = halaqahList[0];
    setFormData({
      id: null,
      santri_id: firstSantri?.id || '',
      halaqah_id: firstHalaqah?.id || '',
      asatidz_id: firstAsatidz?.id || '',
      tanggal: new Date().toISOString().split('T')[0],
      jenis_setoran: 'Ziyadah',
      juz: 1,
      surat_mulai: 'Al-Baqarah',
      ayat_mulai: 1,
      surat_selesai: 'Al-Baqarah',
      ayat_selesai: 20,
      kualitas_tajwid: 'Mumtaz (A)',
      status: 'Lulus',
      catatan: 'Bacaan tartil, makharijul huruf fasih, dengung tajwid tepat.'
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      halaqah_id: item.halaqah_id || '',
      asatidz_id: item.asatidz_id || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
      jenis_setoran: item.jenis_setoran || 'Ziyadah',
      juz: item.juz || 1,
      surat_mulai: item.surat_mulai || '',
      ayat_mulai: item.ayat_mulai || 1,
      surat_selesai: item.surat_selesai || '',
      ayat_selesai: item.ayat_selesai || 1,
      kualitas_tajwid: item.kualitas_tajwid || 'Mumtaz (A)',
      status: item.status || 'Lulus',
      catatan: item.catatan || ''
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
        const res = await axios.post('/api/tahfidz/setoran', formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/tahfidz/setoran/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan data setoran: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus riwayat setoran "${nama}"?`)) {
      try {
        await axios.delete(`/api/tahfidz/setoran/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Stats calculation
  const totalSetoran = setoranList.length;
  const countZiyadah = setoranList.filter(s => s.jenis_setoran === 'Ziyadah').length;
  const countMurojaah = setoranList.filter(s => s.jenis_setoran === "Muroja'ah").length;
  const countMumtaz = setoranList.filter(s => s.kualitas_tajwid?.includes('Mumtaz')).length;

  const filteredList = setoranList.filter((st) => {
    const q = search.toLowerCase();
    const matchSearch = (
      st.nama_santri?.toLowerCase().includes(q) ||
      st.nis?.toLowerCase().includes(q) ||
      st.surat_mulai?.toLowerCase().includes(q) ||
      st.surat_selesai?.toLowerCase().includes(q) ||
      st.nama_asatidz?.toLowerCase().includes(q) ||
      st.nama_asrama?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ziyadah' ? st.jenis_setoran === 'Ziyadah' :
      activeFilterTab === 'murojaah' ? st.jenis_setoran === "Muroja'ah" :
      activeFilterTab === 'sabqi' ? st.jenis_setoran === 'Sabqi' :
      activeFilterTab === 'tasmi' ? st.jenis_setoran?.includes('Tasmi') : true;

    const matchTajwid = filterTajwid === 'Semua Tajwid' ? true : st.kualitas_tajwid === filterTajwid;
    const matchStatus = filterStatus === 'Semua Status' ? true : st.status === filterStatus;

    return matchSearch && matchTab && matchTajwid && matchStatus;
  });

  const santriOptions = santriList.map((s) => ({
    value: s.id,
    label: s.nama_santri,
    sublabel: s.nis ? `NIS: ${s.nis}${s.nama_asrama ? ' • ' + s.nama_asrama : ''}` : (s.nama_asrama || null)
  }));

  const asatidzOptions = asatidzList.map((a) => ({
    value: a.id,
    label: `${a.nama_asatidz} ${a.gelar || ''}`.trim(),
    sublabel: a.tugas_utama || 'Asatidz Penguji'
  }));

  const halaqahOptions = [
    { value: '', label: '-- Tanpa Kelompok Khusus --', sublabel: null },
    ...halaqahList.map((h) => ({
      value: h.id,
      label: h.nama_halaqah,
      sublabel: h.gender === 'L' ? 'Ikhwan' : 'Akhwat'
    }))
  ];

  const jenisSetoranOptions = [
    { value: 'Ziyadah', label: 'Ziyadah (Hafalan Baru)' },
    { value: "Muroja'ah", label: "Muroja'ah (Pengulangan Mutqin)" },
    { value: 'Sabqi', label: 'Sabqi (Sambung Hafalan)' },
    { value: "Tasmi' Bil-Ghoib", label: "Tasmi' Bil-Ghoib (Ujian Sekali Duduk)" }
  ];

  const tajwidOptions = [
    { value: 'Mumtaz (A)', label: 'Mumtaz (A - Sangat Baik)' },
    { value: 'Jayyid Jiddan (B+)', label: 'Jayyid Jiddan (B+ - Baik Sekali)' },
    { value: 'Jayyid (B)', label: 'Jayyid (B - Baik)' },
    { value: 'Maqbul (C)', label: 'Maqbul (C - Cukup)' },
    { value: 'Rombak/Ulang', label: 'Rombak/Ulang (Mengulang Tajwid)' }
  ];

  const statusOptions = [
    { value: 'Lulus', label: 'Lulus (Diterima)' },
    { value: 'Perlu Pengulangan', label: 'Perlu Pengulangan' },
    { value: 'Mengulang', label: 'Mengulang Penuh' }
  ];

  const surahOptions = SURAH_LIST.map(s => ({ value: s, label: s }));

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL MUTABA'AH SETORAN</div>
            <div className="stat-colored-number">{totalSetoran}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SETORAN ZIYADAH</div>
            <div className="stat-colored-number">{countZiyadah}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SETORAN MUROJA'AH</div>
            <div className="stat-colored-number">{countMurojaah}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Layers size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">PREDIKAT MUMTAZ (A)</div>
            <div className="stat-colored-number">{countMumtaz}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Tahfidz & Muroja'ah Al-Qur'an</h2>
            <p>Pencatatan mutaba'ah setoran harian santri, penilaian tajwid, juz, dan riwayat bimbingan asatidz</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> + Input Setoran Santri
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <BookOpen size={14} /> Semua Setoran ({setoranList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'ziyadah' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ziyadah')}
        >
          <Sparkles size={14} /> Ziyadah ({countZiyadah})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'murojaah' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('murojaah')}
        >
          <Layers size={14} /> Muroja'ah ({countMurojaah})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'sabqi' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('sabqi')}
        >
          <Award size={14} /> Sabqi ({setoranList.filter(s => s.jenis_setoran === 'Sabqi').length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'tasmi' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('tasmi')}
        >
          <CheckCircle2 size={14} /> Tasmi' Bil-Ghoib
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, surat, atau nama asatidz..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '160px' }}>
          <SearchableSelect
            options={['Semua Tajwid', 'Mumtaz (A)', 'Jayyid Jiddan (B+)', 'Jayyid (B)', 'Maqbul (C)', 'Rombak/Ulang']}
            value={filterTajwid}
            onChange={(val) => setFilterTajwid(val || 'Semua Tajwid')}
            placeholder="Semua Tajwid"
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <SearchableSelect
            options={['Semua Status', 'Lulus', 'Perlu Pengulangan', 'Mengulang']}
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
            <Loader2 size={24} className="animate-spin" /> Memuat data setoran tahfidz...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada data setoran tahfidz di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th className="td-center" style={{ width: '90px' }}>TANGGAL</th>
                <th>NAMA SANTRI & ASRAMA</th>
                <th className="td-center">JENIS SETORAN</th>
                <th>CAPAIAN AYAT & SURAT</th>
                <th className="td-center" style={{ width: '65px' }}>JUZ</th>
                <th className="td-center">KUALITAS TAJWID</th>
                <th className="td-center">STATUS</th>
                <th>ASATIDZ PENGUJI</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td className="td-center" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                    {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                      NIS: {row.nis || '-'} • {row.nama_asrama || 'Asrama'} ({row.nama_kamar || '-'})
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${
                      row.jenis_setoran === 'Ziyadah' ? 'badge-success' :
                      row.jenis_setoran === "Muroja'ah" ? 'badge-info' :
                      row.jenis_setoran === 'Sabqi' ? 'badge-warning' : 'badge-purple'
                    }`}>
                      {row.jenis_setoran}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                      QS. {row.surat_mulai} ({row.ayat_mulai}) - QS. {row.surat_selesai} ({row.ayat_selesai})
                    </div>
                  </td>
                  <td className="td-center">
                    <span className="badge badge-info" style={{ fontWeight: 800 }}>
                      Juz {row.juz}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${
                      row.kualitas_tajwid?.includes('Mumtaz') ? 'badge-success' :
                      row.kualitas_tajwid?.includes('Jayyid Jiddan') ? 'badge-info' :
                      row.kualitas_tajwid?.includes('Jayyid') ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {row.kualitas_tajwid}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${row.status === 'Lulus' ? 'badge-success' : 'badge-danger'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                      {row.nama_asatidz || 'Musyrif'}
                    </div>
                    {row.nama_halaqah && (
                      <div style={{ fontSize: '0.68rem', color: '#059669' }}>
                        {row.nama_halaqah}
                      </div>
                    )}
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                        className="btn-action btn-action-view"
                        onClick={() => openDetail(row)}
                        title="Lihat Detail Setoran"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-edit"
                        onClick={() => openEditForm(row)}
                        title="Edit Setoran"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-delete"
                        onClick={() => handleDelete(row.id, `${row.nama_santri} - Juz ${row.juz}`)}
                        title="Hapus Setoran"
                      >
                        <Trash2 size={15} />
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
      {/* MODAL DETAIL TAHFIDZ                                */}
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
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Detail Mutaba'ah Setoran Tahfidz</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'} • Jenis: {selectedItem.jenis_setoran}
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
              {/* Profile Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #334155'
              }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{selectedItem.nama_santri}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    NIS: {selectedItem.nis || '-'} • {selectedItem.nama_asrama || 'Asrama'} ({selectedItem.nama_kamar || '-'})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedItem.status || 'Lulus'}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Posisi Juz & Jenis Setoran
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#059669' }}>Juz {selectedItem.juz}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Jenis: {selectedItem.jenis_setoran}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Kualitas Tajwid & Fashohah
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{selectedItem.kualitas_tajwid}</div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>Penguji: {selectedItem.nama_asatidz || 'Musyrif'}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Rincian Surat & Ayat Yang Disetorkan
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                    QS. {selectedItem.surat_mulai} (Ayat {selectedItem.ayat_mulai}) s/d QS. {selectedItem.surat_selesai} (Ayat {selectedItem.ayat_selesai})
                  </div>
                </div>
              </div>

              {/* Catatan Bimbingan */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                  Catatan Evaluasi / Bimbingan Ustadz
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  {selectedItem.catatan || 'Tidak ada catatan khusus.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
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
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {formMode === 'add' ? 'Input Setoran Tahfidz Santri' : 'Edit Riwayat Setoran Tahfidz'}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                    Catat capaian hafalan Al-Qur'an secara teliti dan akurat.
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
                
                {/* Santri & Musyrif Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#0284c7" /> SANTRI & ASATIDZ PENGUJI
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Pilih Santri *</label>
                      <SearchableSelect
                        options={santriOptions}
                        value={formData.santri_id}
                        onChange={(val) => setFormData({ ...formData, santri_id: val })}
                        placeholder="-- Cari & Pilih Santri dari Database --"
                        searchPlaceholder="Ketik nama santri atau NIS..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Asatidz Penguji *</label>
                      <SearchableSelect
                        options={asatidzOptions}
                        value={formData.asatidz_id}
                        onChange={(val) => setFormData({ ...formData, asatidz_id: val })}
                        placeholder="-- Cari & Pilih Asatidz --"
                        searchPlaceholder="Ketik nama ustadz..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Kelompok Halaqah</label>
                      <SearchableSelect
                        options={halaqahOptions}
                        value={formData.halaqah_id}
                        onChange={(val) => setFormData({ ...formData, halaqah_id: val })}
                        placeholder="-- Pilih Halaqah (Opsional) --"
                        searchPlaceholder="Ketik nama halaqah..."
                      />
                    </div>
                  </div>
                </div>

                {/* Mutaba'ah Rincian Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BookOpen size={14} color="#059669" /> MUTABA'AH AYAT & JUZ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Tanggal Setoran *</label>
                      <input 
                        type="date"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Jenis Setoran *</label>
                      <SearchableSelect
                        options={jenisSetoranOptions}
                        value={formData.jenis_setoran}
                        onChange={(val) => setFormData({ ...formData, jenis_setoran: val })}
                        placeholder="-- Pilih Jenis Setoran --"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Juz Ke- *</label>
                      <input 
                        type="number"
                        min="1"
                        max="30"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.juz}
                        onChange={(e) => setFormData({ ...formData, juz: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Kualitas Tajwid *</label>
                      <SearchableSelect
                        options={tajwidOptions}
                        value={formData.kualitas_tajwid}
                        onChange={(val) => setFormData({ ...formData, kualitas_tajwid: val })}
                        placeholder="-- Kualitas Tajwid --"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Surat Mulai *</label>
                      <SearchableSelect
                        options={surahOptions}
                        value={formData.surat_mulai}
                        onChange={(val) => setFormData({ ...formData, surat_mulai: val })}
                        placeholder="-- Pilih Surat Mulai --"
                        searchPlaceholder="Cari Surah (1 - 114)..."
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Ayat Mulai *</label>
                      <input 
                        type="number"
                        min="1"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.ayat_mulai}
                        onChange={(e) => setFormData({ ...formData, ayat_mulai: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Surat Selesai *</label>
                      <SearchableSelect
                        options={surahOptions}
                        value={formData.surat_selesai}
                        onChange={(val) => setFormData({ ...formData, surat_selesai: val })}
                        placeholder="-- Pilih Surat Selesai --"
                        searchPlaceholder="Cari Surah (1 - 114)..."
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Ayat Selesai *</label>
                      <input 
                        type="number"
                        min="1"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.ayat_selesai}
                        onChange={(e) => setFormData({ ...formData, ayat_selesai: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Catatan */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={14} color="#7c3aed" /> STATUS & CATATAN MUSYRIF
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Status Kelulusan *</label>
                    <SearchableSelect
                      options={statusOptions}
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      placeholder="-- Status Kelulusan --"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Catatan Bimbingan</label>
                    <textarea 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                      rows="2"
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    />
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
                  <span>{formMode === 'add' ? 'Simpan Setoran' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
