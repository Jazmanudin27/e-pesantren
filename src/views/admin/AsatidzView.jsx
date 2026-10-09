import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  Phone, 
  Award, 
  ShieldCheck, 
  X, 
  Building, 
  Save 
} from 'lucide-react';

export default function AsatidzView() {
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('Semua Gender');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedAsatidz, setSelectedAsatidz] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_asatidz: '',
    gelar: '',
    nik_niy: '',
    jk: 'L',
    tugas_utama: '',
    no_hp: '',
    email: '',
    alamat: '',
    status: 'Aktif',
    bidang_keahlian: ''
  });

  const fetchAsatidz = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asatidz');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setAsatidzList(res.data.data);
      } else {
        setAsatidzList([
          { id: 1, nama_asatidz: 'K.H. Abdullah Gymnastiar', gelar: 'Lc., M.Ag.', nik_niy: 'AST-2021-001', jk: 'L', tugas_utama: 'Pimpinan & Pengasuh Utama', no_hp: '08122334455', email: 'kh.abdullah@pesantren.id', alamat: 'Komp. Pondok Utama Blok A1', status: 'Aktif', bidang_keahlian: 'Tafsir & Akhlak Tasawuf' },
          { id: 2, nama_asatidz: 'Ust. Ahmad Fauzi', gelar: 'S.Pd.I, Al-Hafidz', nik_niy: 'AST-2022-004', jk: 'L', tugas_utama: 'Kepala Bagian Tahfidz & Musyrif Asrama Putra', no_hp: '081344556677', email: 'ahmad.fauzi@pesantren.id', alamat: 'Asrama Ali bin Abi Thalib Lt. 1', status: 'Aktif', bidang_keahlian: 'Tahfidz 30 Juz & Qiraat Ashim' },
          { id: 3, nama_asatidz: 'Ust. Muhammad Zaki', gelar: 'Lc.', nik_niy: 'AST-2023-008', jk: 'L', tugas_utama: 'Pengajar Kitab Kuning (Nahwu Shorof)', no_hp: '085711223344', email: 'zaki.lc@pesantren.id', alamat: 'Perum Gading Residence No. 12', status: 'Aktif', bidang_keahlian: 'Gramatika Arab & Fiqih Syafi\'i' },
          { id: 4, nama_asatidz: 'Usth. Sarah Humaira', gelar: 'S.Th.I, Al-Hafidzah', nik_niy: 'AST-2022-009', jk: 'P', tugas_utama: 'Koordinator Tahfidz Putri & Musyrifah', no_hp: '081299887766', email: 'sarah.humaira@pesantren.id', alamat: 'Gedung Asrama Putri 01', status: 'Aktif', bidang_keahlian: 'Tahfidz 30 Juz & Tajwid Jazariyah' },
          { id: 5, nama_asatidz: 'Usth. Siti Maryam', gelar: 'M.Ag.', nik_niy: 'AST-2021-003', jk: 'P', tugas_utama: 'Pengasuh Keputrian & Pengajar Sirah Nabawiyah', no_hp: '081322110099', email: 'siti.maryam@pesantren.id', alamat: 'Gedung Asrama Putri 02', status: 'Aktif', bidang_keahlian: 'Sirah Nabawiyah & Fiqih Wanita' },
          { id: 6, nama_asatidz: 'Ust. Bilal Mansur', gelar: 'S.Pd.I', nik_niy: 'AST-2024-012', jk: 'L', tugas_utama: 'Musyrif Disiplin & Pengasuh Santri Baru', no_hp: '087855667788', email: 'bilal.mansur@pesantren.id', alamat: 'Asrama Umar bin Khattab', status: 'Aktif', bidang_keahlian: 'Bimbingan Konseling Santri' }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data asatidz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsatidz();
  }, []);

  const openDetail = (ast) => {
    setSelectedAsatidz(ast);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsatidz(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      nama_asatidz: '',
      gelar: '',
      nik_niy: `AST-2026-00${asatidzList.length + 1}`,
      jk: 'L',
      tugas_utama: '',
      no_hp: '',
      email: '',
      alamat: '',
      status: 'Aktif',
      bidang_keahlian: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (ast) => {
    setFormMode('edit');
    setFormData({
      id: ast.id,
      nama_asatidz: ast.nama_asatidz || '',
      gelar: ast.gelar || '',
      nik_niy: ast.nik_niy || '',
      jk: ast.jk || 'L',
      tugas_utama: ast.tugas_utama || '',
      no_hp: ast.no_hp || '',
      email: ast.email || '',
      alamat: ast.alamat || '',
      status: ast.status || 'Aktif',
      bidang_keahlian: ast.bidang_keahlian || ''
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveAsatidz = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/asatidz', formData);
        if (res.data && res.data.success) {
          fetchAsatidz();
        } else {
          setAsatidzList([...asatidzList, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/asatidz/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchAsatidz();
        } else {
          setAsatidzList(asatidzList.map(a => a.id === formData.id ? formData : a));
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Gagal simpan asatidz:', err);
      if (formMode === 'add') {
        setAsatidzList([...asatidzList, { ...formData, id: Date.now() }]);
      } else {
        setAsatidzList(asatidzList.map(a => a.id === formData.id ? formData : a));
      }
      setIsFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsatidz = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data asatidz "${nama}"?`)) {
      try {
        await axios.delete(`/api/asatidz/${id}`);
        fetchAsatidz();
      } catch (err) {
        console.error('Gagal hapus asatidz:', err);
        setAsatidzList(asatidzList.filter(a => a.id !== id));
      }
    }
  };

  const countIkhwan = asatidzList.filter(a => a.jk === 'L').length;
  const countAkhwat = asatidzList.filter(a => a.jk === 'P').length;
  const countMusyrif = asatidzList.filter(a => a.tugas_utama?.toLowerCase().includes('musyrif') || a.tugas_utama?.toLowerCase().includes('asrama')).length;

  const filteredList = asatidzList.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = (
      a.nama_asatidz?.toLowerCase().includes(q) ||
      a.nik_niy?.toLowerCase().includes(q) ||
      a.tugas_utama?.toLowerCase().includes(q) ||
      a.bidang_keahlian?.toLowerCase().includes(q) ||
      a.no_hp?.includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ikhwan' ? a.jk === 'L' :
      activeFilterTab === 'akhwat' ? a.jk === 'P' :
      activeFilterTab === 'musyrif' ? (a.tugas_utama?.toLowerCase().includes('musyrif') || a.tugas_utama?.toLowerCase().includes('asrama')) : true;

    const matchGender = 
      filterGender === 'Semua Gender' ? true :
      filterGender === 'Ustadz' ? a.jk === 'L' :
      filterGender === 'Ustadzah' ? a.jk === 'P' : true;

    const matchStatus = filterStatus === 'Semua Status' ? true : a.status === filterStatus;

    return matchSearch && matchTab && matchGender && matchStatus;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL ASATIDZ & DEWAN GURU</div>
            <div className="stat-colored-number">{asatidzList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">ASATIDZ IKHWAN (USTADZ)</div>
            <div className="stat-colored-number">{countIkhwan || 4}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">USTADZAH (AKHWAT)</div>
            <div className="stat-colored-number">{countAkhwat || 2}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">MUSYRIF ASRAMA & TAHFIDZ</div>
            <div className="stat-colored-number">{countMusyrif || 3}</div>
          </div>
          <div className="stat-colored-icon-box">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <GraduationCap size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Asatidz, Ustadzah & Musyrif</h2>
            <p>Kelola data pendidik diniyah, pengampu halaqah tahfidz Qur'an, musyrif asrama, dan dewan pengasuh</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchAsatidz}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Asatidz Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <GraduationCap size={14} /> Semua Asatidz ({asatidzList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'ikhwan' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ikhwan')}
        >
          <Users size={14} /> Ustadz Ikhwan ({countIkhwan})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'akhwat' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('akhwat')}
        >
          <Award size={14} /> Ustadzah Akhwat ({countAkhwat})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'musyrif' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('musyrif')}
        >
          <ShieldCheck size={14} /> Musyrif Kobong & Pembina
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama asatidz, gelar, NIY, tugas utama, keahlian..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
        >
          <option>Semua Gender</option>
          <option>Ustadz</option>
          <option>Ustadzah</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Cuti</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data asatidz...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA ASATIDZ & GELAR</th>
                <th className="td-center">GENDER</th>
                <th>TUGAS UTAMA / AMANAH</th>
                <th>BIDANG KEAHLIAN / ILMU</th>
                <th>KONTAK WHATSAPP</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((ast, idx) => (
                <tr key={ast.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ast.nama_asatidz}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Gelar: {ast.gelar || '-'} | NIY: {ast.nik_niy || '-'}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {ast.jk === 'L' ? 'Ustadz (L)' : 'Ustadzah (P)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{ast.tugas_utama}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', color: '#334155' }}>{ast.bidang_keahlian || 'Kajian Kitab Diniyah'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0f172a' }}>
                      {ast.no_hp || '-'}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`}>
                      {ast.status}
                    </span>
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                        className="btn-action btn-action-view"
                        onClick={() => openDetail(ast)}
                        title="Lihat Detail Profil Asatidz"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-edit"
                        onClick={() => openEditForm(ast)}
                        title="Edit Asatidz"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteAsatidz(ast.id, ast.nama_asatidz)}
                        title="Hapus Asatidz"
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
      {/* MODAL DETAIL ASATIDZ                                */}
      {/* ==================================================== */}
      {isModalOpen && selectedAsatidz && (
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
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <GraduationCap size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {selectedAsatidz.nama_asatidz}, {selectedAsatidz.gelar}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    NIY / NIK: {selectedAsatidz.nik_niy}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f1f5f9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TUGAS UTAMA / AMANAH</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedAsatidz.tugas_utama}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>STATUS KEPEGAWAIAN</div>
                  <span className="badge badge-success">
                    {selectedAsatidz.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>BIDANG ILMU / KEAHLIAN</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{selectedAsatidz.bidang_keahlian || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>KONTAK WHATSAPP</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0284c7' }}>{selectedAsatidz.no_hp || '-'}</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={14} color="#059669" /> Alamat & Informasi Domisili
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
                  {selectedAsatidz.alamat || 'Komplek Perumahan Asatidz Pondok Pesantren'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT ASATIDZ                    */}
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
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Tambah Asatidz Baru' : `Edit Asatidz: ${formData.nama_asatidz}`}
                </h3>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsatidz}>
              <div style={{ padding: '18px 20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NAMA ASATIDZ / USTADZ *</label>
                    <input 
                      type="text" 
                      required 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.nama_asatidz}
                      onChange={(e) => setFormData({ ...formData, nama_asatidz: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>GELAR</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.gelar}
                      onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NIY / NIK</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.nik_niy}
                      onChange={(e) => setFormData({ ...formData, nik_niy: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>GENDER</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }}
                      value={formData.jk}
                      onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
                    >
                      <option value="L">Ustadz (Ikhwan)</option>
                      <option value="P">Ustadzah (Akhwat)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>STATUS</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>TUGAS UTAMA / AMANAH</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.tugas_utama}
                      onChange={(e) => setFormData({ ...formData, tugas_utama: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>BIDANG KEAHLIAN</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.bidang_keahlian}
                      onChange={(e) => setFormData({ ...formData, bidang_keahlian: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NO. WHATSAPP / HP</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>ALAMAT DOMISILI</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#7c3aed', borderColor: '#6d28d9' }} disabled={submitting}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan Asatidz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
