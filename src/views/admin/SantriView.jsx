import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Home, 
  Clock, 
  GraduationCap, 
  Fingerprint, 
  Loader2,
  Building,
  X,
  Phone,
  Calendar,
  Award,
  ShieldCheck,
  MapPin,
  User,
  Save,
  CheckCircle2
} from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

export default function SantriView() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  const [asramaList, setAsramaList] = useState([]);
  const [kamarList, setKamarList] = useState([]);

  // Modal Detail State
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_santri: '',
    nis: '',
    kode_santri: '',
    jk: 'L',
    status_santri: 'Mukim',
    asrama_id: 1,
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    kamar_id: 1,
    nama_kamar: 'Kamar Abu Bakar 01',
    tempat_lahir: 'Tasikmalaya',
    tgl_lahir: '2008-01-01',
    fingerprint_pin: '',
    rfid_card_uid: '',
    nama_wali: '',
    no_wa_wali: '',
    hubungan_wali: 'Orang Tua (Ayah)',
    alamat_asal: '',
    status: 'Aktif',
    tahun_masuk: '2026/2027',
    capaian_hafalan_juz: 0,
    tingkat_diniyah: 'Wustho'
  });

  const fetchAsramaData = async () => {
    try {
      const res = await axios.get('/api/asrama');
      if (res.data && res.data.success) {
        setAsramaList(res.data.asrama || []);
        setKamarList(res.data.kamar || []);
      }
    } catch (err) {
      console.error('Gagal mengambil master asrama:', err);
    }
  };

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/santri');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setSantriList(res.data.data);
      } else {
        setSantriList([
          { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nisn: '0089123456', jk: 'L', tempat_lahir: 'Tasikmalaya', tgl_lahir: '2008-05-12', status_santri: 'Mukim', asrama_id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', kamar_id: 1, nama_kamar: 'Kamar Abu Bakar 01', fingerprint_pin: 1001, rfid_card_uid: 'RF-88391', capaian_hafalan_juz: 15, tingkat_diniyah: 'Wustho', nama_wali: 'H. Abdullah', no_wa_wali: '081288881111', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Jl. Sutisna Senjaya No. 45, Kota Tasikmalaya', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nisn: '0089123457', jk: 'L', tempat_lahir: 'Bandung', tgl_lahir: '2007-09-20', status_santri: 'Mukim', asrama_id: 2, nama_asrama: 'Asrama Umar bin Khattab', kamar_id: 3, nama_kamar: 'Kamar Umar 01', fingerprint_pin: 1002, rfid_card_uid: 'RF-88392', capaian_hafalan_juz: 28, tingkat_diniyah: 'Ulya', nama_wali: 'Drs. Subagja', no_wa_wali: '081377772222', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Komp. Margahayu Raya Blok C-12, Bandung', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nisn: '0089123458', jk: 'P', tempat_lahir: 'Ciamis', tgl_lahir: '2007-11-15', status_santri: 'Mukim', asrama_id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', kamar_id: 4, nama_kamar: 'Kamar Aisyah 01', fingerprint_pin: 2001, rfid_card_uid: 'RF-88393', capaian_hafalan_juz: 30, tingkat_diniyah: 'Ulya', nama_wali: 'H. Usman', no_wa_wali: '081199993333', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Jl. Raya Panjalu No. 10, Ciamis', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nisn: '0089123459', jk: 'L', tempat_lahir: 'Garut', tgl_lahir: '2009-02-18', status_santri: 'Mukim', asrama_id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', kamar_id: 2, nama_kamar: 'Kamar Abu Bakar 02', fingerprint_pin: 1003, rfid_card_uid: 'RF-88394', capaian_hafalan_juz: 5, tingkat_diniyah: 'Ula', nama_wali: 'Bpk. Hendra', no_wa_wali: '085744445555', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Tarogong Kaler, Garut', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nisn: '0089123460', jk: 'P', tempat_lahir: 'Tasikmalaya', tgl_lahir: '2009-06-25', status_santri: 'Kalong', asrama_id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', kamar_id: 5, nama_kamar: 'Kamar Aisyah 02', fingerprint_pin: 2002, rfid_card_uid: 'RF-88395', capaian_hafalan_juz: 3, tingkat_diniyah: 'Ula', nama_wali: 'Hj. Rohmah', no_wa_wali: '081233336666', hubungan_wali: 'Orang Tua (Ibu)', alamat_asal: 'Jl. Cisalak No. 88, Tasikmalaya', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nisn: '0089123461', jk: 'L', tempat_lahir: 'Jakarta', tgl_lahir: '2008-08-10', status_santri: 'Mukim', asrama_id: 2, nama_asrama: 'Asrama Umar bin Khattab', kamar_id: 3, nama_kamar: 'Kamar Umar 01', fingerprint_pin: 1004, rfid_card_uid: 'RF-88396', capaian_hafalan_juz: 12, tingkat_diniyah: 'Wustho', nama_wali: 'H. Rahman', no_wa_wali: '081255557777', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Tebet Timur, Jakarta Selatan', status: 'Aktif', tahun_masuk: '2026/2027' }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
    fetchAsramaData();
  }, []);

  const openDetail = (santri) => {
    setSelectedSantri(santri);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSantri(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    const firstAsr = asramaList[0];
    const matchingKamars = kamarList.filter(k => k.asrama_id === (firstAsr?.id || 1));
    const firstKmr = matchingKamars[0] || kamarList[0];

    setFormData({
      id: null,
      nama_santri: '',
      nis: `260100${santriList.length + 1}`,
      kode_santri: `STR-26-00${santriList.length + 1}`,
      jk: 'L',
      status_santri: 'Mukim',
      asrama_id: firstAsr?.id || 1,
      nama_asrama: firstAsr?.nama_asrama || 'Asrama Ali bin Abi Thalib',
      kamar_id: firstKmr?.id || 1,
      nama_kamar: firstKmr?.nama_kamar || 'Kamar Abu Bakar 01',
      tempat_lahir: 'Tasikmalaya',
      tgl_lahir: '2008-01-01',
      fingerprint_pin: `${1000 + santriList.length + 1}`,
      rfid_card_uid: `RF-${Math.floor(10000 + Math.random() * 90000)}`,
      nama_wali: '',
      no_wa_wali: '',
      hubungan_wali: 'Orang Tua (Ayah)',
      alamat_asal: '',
      status: 'Aktif',
      tahun_masuk: '2026/2027',
      capaian_hafalan_juz: 0,
      tingkat_diniyah: 'Wustho'
    });
    setIsFormOpen(true);
  };

  const openEditForm = (santri) => {
    setFormMode('edit');
    setFormData({
      id: santri.id,
      nama_santri: santri.nama_santri || '',
      nis: santri.nis || '',
      kode_santri: santri.kode_santri || '',
      jk: santri.jk || 'L',
      status_santri: santri.status_santri || 'Mukim',
      asrama_id: santri.asrama_id || (asramaList[0]?.id || 1),
      nama_asrama: santri.nama_asrama || 'Asrama Ali bin Abi Thalib',
      kamar_id: santri.kamar_id || (kamarList[0]?.id || 1),
      nama_kamar: santri.nama_kamar || 'Kamar 01',
      tempat_lahir: santri.tempat_lahir || '',
      tgl_lahir: santri.tgl_lahir ? (typeof santri.tgl_lahir === 'string' ? santri.tgl_lahir.split('T')[0] : santri.tgl_lahir) : '2008-01-01',
      fingerprint_pin: santri.fingerprint_pin || '',
      rfid_card_uid: santri.rfid_card_uid || '',
      nama_wali: santri.nama_wali || '',
      no_wa_wali: santri.no_wa_wali || '',
      hubungan_wali: santri.hubungan_wali || 'Orang Tua (Ayah)',
      alamat_asal: santri.alamat_asal || '',
      status: santri.status || 'Aktif',
      tahun_masuk: santri.tahun_masuk || '2026/2027',
      capaian_hafalan_juz: santri.capaian_hafalan_juz || 0,
      tingkat_diniyah: santri.tingkat_diniyah || 'Wustho'
    });
    setIsFormOpen(true);
  };

  const handleAsramaSelect = (asramaId) => {
    const selectedAsr = asramaList.find(a => a.id === parseInt(asramaId));
    const matchingKamars = kamarList.filter(k => k.asrama_id === parseInt(asramaId));
    const firstKamar = matchingKamars[0];

    setFormData({
      ...formData,
      asrama_id: parseInt(asramaId),
      nama_asrama: selectedAsr ? selectedAsr.nama_asrama : formData.nama_asrama,
      kamar_id: firstKamar ? firstKamar.id : null,
      nama_kamar: firstKamar ? firstKamar.nama_kamar : ''
    });
  };

  const handleKamarSelect = (kamarId) => {
    const selectedKmr = kamarList.find(k => k.id === parseInt(kamarId));
    setFormData({
      ...formData,
      kamar_id: parseInt(kamarId),
      nama_kamar: selectedKmr ? selectedKmr.nama_kamar : formData.nama_kamar
    });
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveSantri = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/santri', formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList([...santriList, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/santri/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList(santriList.map(s => s.id === formData.id ? formData : s));
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Gagal menyimpan santri:', err);
      // local fallback update
      if (formMode === 'add') {
        setSantriList([...santriList, { ...formData, id: Date.now() }]);
      } else {
        setSantriList(santriList.map(s => s.id === formData.id ? formData : s));
      }
      setIsFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data santri "${nama}"?`)) {
      try {
        await axios.delete(`/api/santri/${id}`);
        fetchSantri();
      } catch (err) {
        console.error('Gagal hapus santri:', err);
        setSantriList(santriList.filter(s => s.id !== id));
      }
    }
  };

  // Filter logic
  const filteredList = santriList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = (
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      s.nama_wali?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'mukim' ? s.status_santri === 'Mukim' :
      activeFilterTab === 'kalong' ? s.status_santri === 'Kalong' :
      activeFilterTab === 'alumni' ? s.status === 'Alumni' || s.status === 'Boyong' : true;

    const matchAsrama = filterAsrama === 'Semua Asrama' ? true : s.nama_asrama?.includes(filterAsrama);
    const matchStatus = filterStatus === 'Semua Status' ? true : s.status === filterStatus;

    return matchSearch && matchTab && matchAsrama && matchStatus;
  });

  const countMukim = santriList.filter(s => s.status_santri === 'Mukim').length;
  const countKalong = santriList.filter(s => s.status_santri === 'Kalong').length;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI TERDAFTAR</div>
            <div className="stat-colored-number">{santriList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SANTRI MUKIM (ASRAMA)</div>
            <div className="stat-colored-number">{countMukim || 5}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Home size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI KALONG (NON-MUKIM)</div>
            <div className="stat-colored-number">{countKalong || 1}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">FINGERPRINT ENROLLED</div>
            <div className="stat-colored-number">{santriList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Users size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Induk Santri & Penempatan Kobong</h2>
            <p>Kelola biodata santri, NIS, penempatan asrama/kamar kobong, data mahrom wali, dan capaian hafalan</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchSantri}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Santri Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <Users size={14} /> Semua Santri ({santriList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'mukim' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('mukim')}
        >
          <Home size={14} /> Santri Mukim ({countMukim})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'kalong' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('kalong')}
        >
          <Clock size={14} /> Santri Kalong ({countKalong})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'alumni' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('alumni')}
        >
          <GraduationCap size={14} /> Alumni / Boyong
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, asrama, nama wali..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterAsrama}
          onChange={(e) => setFilterAsrama(e.target.value)}
        >
          <option>Semua Asrama</option>
          <option>Ali</option>
          <option>Umar</option>
          <option>Fathimah</option>
          <option>Khadijah</option>
          <option>Abu Bakar</option>
        </select>
        <select className="filter-select">
          <option>Semua Tingkat</option>
          <option>Wustho</option>
          <option>Ulya</option>
          <option>Ula</option>
        </select>
        <select className="filter-select">
          <option>Tahun 2026/2027</option>
          <option>Tahun 2025/2026</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Alumni</option>
          <option>Boyong</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data santri...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th className="td-center">GENDER</th>
                <th>ASRAMA & KOBONG</th>
                <th className="td-center">STATUS MUKIM</th>
                <th className="td-center">PIN FINGERPRINT</th>
                <th>WALI & KONTAK MAHROM</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {row.nis}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${row.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {row.jk === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                      <Building size={13} color="#059669" />
                      <span>{row.nama_asrama || 'Asrama Pondok'}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {row.nama_kamar || 'Kamar 01'}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${row.status_santri === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                      {row.status_santri || 'Mukim'}
                    </span>
                  </td>
                  <td className="td-center">
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7', fontWeight: 700, fontSize: '0.7rem' }}>
                      PIN: {row.fingerprint_pin || '1001'}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>
                      {row.nama_wali || 'Orang Tua'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {row.no_wa_wali || '-'}
                    </div>
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                        className="btn-action btn-action-view"
                        onClick={() => openDetail(row)}
                        title="Lihat Detail Santri"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-edit"
                        onClick={() => openEditForm(row)}
                        title="Edit Data Santri"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-delete"
                        onClick={() => handleDelete(row.id, row.nama_santri)}
                        title="Hapus Santri"
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
      {/* MODAL DETAIL SANTRI & BIODATA LENGKAP               */}
      {/* ==================================================== */}
      {isModalOpen && selectedSantri && (
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
                  <User size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>Biodata & Riwayat Santri</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>NIS: {selectedSantri.nis} • Kode: {selectedSantri.kode_santri || 'STR-2026'}</p>
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
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
                border: '1px solid #334155'
              }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{selectedSantri.nama_santri}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    Status: <strong style={{ color: selectedSantri.status_santri === 'Mukim' ? '#34d399' : '#fbbf24' }}>Santri {selectedSantri.status_santri}</strong> • {selectedSantri.jk === 'L' ? 'Ikhwan' : 'Akhwat'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedSantri.status || 'Aktif'}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom (Pure White Cards with Crisp Borders) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                
                {/* Asrama & Kamar */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Home size={13} color="#059669" /> Asrama & Kamar Kobong
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{selectedSantri.nama_asrama || '-'}</div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>{selectedSantri.nama_kamar || '-'}</div>
                </div>

                {/* Tahfidz & Hafalan */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={13} color="#0284c7" /> Capaian Tahfidz Qur'an
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0284c7' }}>{selectedSantri.capaian_hafalan_juz || 0} Juz</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tingkat: {selectedSantri.tingkat_diniyah || 'Wustho'}</div>
                </div>

                {/* Biometrik Mesin Fingerprint */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Fingerprint size={13} color="#7c3aed" /> Biometrik Presensi
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>PIN Mesin: <code>{selectedSantri.fingerprint_pin || '-'}</code></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>RFID: {selectedSantri.rfid_card_uid || 'Terdaftar'}</div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} color="#d97706" /> TTL & Tahun Masuk
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>{selectedSantri.tempat_lahir || 'Tasikmalaya'}, {selectedSantri.tgl_lahir || '-'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tahun Masuk: {selectedSantri.tahun_masuk || '2026/2027'}</div>
                </div>

              </div>

              {/* Data Wali & Kontak Mahrom */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={14} color="#059669" /> Data Mahrom & Wali Santri
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Nama Wali:</span> <strong>{selectedSantri.nama_wali || '-'}</strong> ({selectedSantri.hubungan_wali || 'Orang Tua'})
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>No. WhatsApp:</span> <strong>{selectedSantri.no_wa_wali || '-'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Alamat Asal:</span> {selectedSantri.alamat_asal || 'Kota Tasikmalaya, Jawa Barat'}
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
              {selectedSantri.no_wa_wali && (
                <a 
                  href={`https://wa.me/${selectedSantri.no_wa_wali.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#25D366', borderColor: '#25D366', color: '#ffffff', fontWeight: 700 }}
                >
                  <Phone size={12} /> Chat WhatsApp Wali
                </a>
              )}
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT SANTRI                     */}
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
            {/* Form Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Tambah Data Santri Baru' : `Edit Biodata Santri: ${formData.nama_santri}`}
                </h3>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveSantri}>
              <div style={{ padding: '18px 20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Baris 1: Nama & NIS */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NAMA LENGKAP SANTRI *</label>
                    <input 
                      type="text" 
                      required 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.nama_santri}
                      onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NIS</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    />
                  </div>
                </div>

                {/* Baris 2: Gender, Status Mukim, Status Santri */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>GENDER</label>
                    <SearchableSelect
                      options={[
                        { value: 'L', label: 'Laki-laki (Ikhwan)' },
                        { value: 'P', label: 'Perempuan (Akhwat)' }
                      ]}
                      value={formData.jk}
                      onChange={(val) => setFormData({ ...formData, jk: val })}
                      placeholder="-- Gender --"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>STATUS MUKIM</label>
                    <SearchableSelect
                      options={[
                        { value: 'Mukim', label: 'Mukim (Asrama)' },
                        { value: 'Kalong', label: 'Kalong (Non-Mukim)' }
                      ]}
                      value={formData.status_santri}
                      onChange={(val) => setFormData({ ...formData, status_santri: val })}
                      placeholder="-- Status Mukim --"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>STATUS KEAKTIFAN</label>
                    <SearchableSelect
                      options={[
                        { value: 'Aktif', label: 'Aktif' },
                        { value: 'Alumni', label: 'Alumni' },
                        { value: 'Boyong', label: 'Boyong' }
                      ]}
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      placeholder="-- Status --"
                    />
                  </div>
                </div>

                {/* Baris 3: Asrama & Kamar Kobong (PILIH DARI DATABASE) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      PILIH BLOK GEDUNG ASRAMA *
                    </label>
                    <SearchableSelect
                      required
                      options={asramaList.length > 0 ? asramaList.map(a => ({
                        value: a.id,
                        label: `${a.nama_asrama} (${a.gender === 'L' ? 'Putra' : 'Putri'})`,
                        sublabel: `Kapasitas Total: ${a.total_kamar || 0} Kamar`
                      })) : [
                        { value: 1, label: 'Asrama Ali bin Abi Thalib (Putra)' },
                        { value: 2, label: 'Asrama Umar bin Khattab (Putra)' },
                        { value: 3, label: 'Asrama Fathimah Az-Zahra (Putri)' },
                        { value: 4, label: 'Asrama Khadijah Al-Kubra (Putri)' }
                      ]}
                      value={formData.asrama_id || (asramaList[0]?.id || 1)}
                      onChange={(val) => handleAsramaSelect(val)}
                      placeholder="-- Pilih Gedung Asrama --"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      PILIH KAMAR KOBONG (DATABASE) *
                    </label>
                    <SearchableSelect
                      required
                      options={(kamarList.filter(k => !formData.asrama_id || k.asrama_id === parseInt(formData.asrama_id)).length > 0
                        ? kamarList.filter(k => !formData.asrama_id || k.asrama_id === parseInt(formData.asrama_id))
                        : kamarList
                      ).map(k => ({
                        value: k.id,
                        label: `${k.nama_kamar} (Lantai ${k.lantai || 1})`,
                        sublabel: `Kapasitas ${k.kapasitas || 10} Santri`
                      }))}
                      value={formData.kamar_id || ''}
                      onChange={(val) => handleKamarSelect(val)}
                      placeholder="-- Pilih Kamar Kobong --"
                    />
                  </div>
                </div>

                {/* Baris 4: PIN Fingerprint & Hafalan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>PIN FINGERPRINT</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.fingerprint_pin}
                      onChange={(e) => setFormData({ ...formData, fingerprint_pin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>HAFALAN (JUZ)</label>
                    <input 
                      type="number" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.capaian_hafalan_juz}
                      onChange={(e) => setFormData({ ...formData, capaian_hafalan_juz: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>TINGKAT DINIYAH</label>
                    <SearchableSelect
                      options={[
                        { value: 'Ula', label: 'Ula' },
                        { value: 'Wustho', label: 'Wustho' },
                        { value: 'Ulya', label: 'Ulya' }
                      ]}
                      value={formData.tingkat_diniyah}
                      onChange={(val) => setFormData({ ...formData, tingkat_diniyah: val })}
                      placeholder="-- Tingkat Diniyah --"
                    />
                  </div>
                </div>

                {/* Baris 5: Wali & Kontak */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NAMA WALI / MAHROM</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.nama_wali}
                      onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NO. WHATSAPP WALI</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.no_wa_wali}
                      onChange={(e) => setFormData({ ...formData, no_wa_wali: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>ALAMAT ASAL</label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px' }} 
                    value={formData.alamat_asal}
                    onChange={(e) => setFormData({ ...formData, alamat_asal: e.target.value })}
                  />
                </div>

              </div>

              {/* Form Footer */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan Data Santri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
