import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  GraduationCap, 
  X, 
  Sparkles, 
  Save,
  UserCheck
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function KelasView() {
  const [kelasList, setKelasList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('Semua Gender');
  const [filterTingkat, setFilterTingkat] = useState('Semua Tingkat');

  // Modal Detail State
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_kelas: '',
    kode_kelas: '',
    mustahiq: '',
    munawwib: '',
    tingkat: 'Wustho',
    gender: 'L',
  });

  const fetchAsatidz = async () => {
    try {
      const res = await axios.get('/api/asatidz');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAsatidzList(res.data.data);
      }
    } catch (e) {
      console.warn('Gagal memuat asatidz:', e);
    }
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const resKelas = await axios.get('/api/kelas');
      if (resKelas.data?.success && Array.isArray(resKelas.data.data)) {
        setKelasList(resKelas.data.data);
      } else {
        setKelasList([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data kelas:', err);
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchAsatidz();
  }, []);

  const openDetail = (k) => {
    setSelectedKelas(k);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKelas(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    const suffix = Date.now().toString().slice(-4);
    setFormData({
      id: null,
      nama_kelas: '',
      kode_kelas: `KLS-${suffix}`,
      mustahiq: asatidzList[0]?.nama_asatidz || '',
      munawwib: '',
      tingkat: 'Wustho',
      gender: 'L',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (k) => {
    setFormMode('edit');
    setFormData({
      id: k.id,
      nama_kelas: k.nama_kelas || '',
      kode_kelas: k.kode_kelas || `KLS-${k.id}`,
      mustahiq: k.mustahiq || '',
      munawwib: k.munawwib || '',
      tingkat: k.tingkat || 'Wustho',
      gender: k.gender || 'L',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveKelas = async (e) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim()) return;
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/kelas', formData);
        if (res.data?.success) {
          toastSuccess(`Kelas "${formData.nama_kelas}" berhasil ditambahkan`);
          fetchKelas();
          setIsFormOpen(false);
        } else {
          showError('Gagal', res.data?.message || 'Gagal menambah kelas');
        }
      } else {
        const res = await axios.put(`/api/kelas/${formData.id}`, formData);
        if (res.data?.success) {
          toastSuccess(`Kelas "${formData.nama_kelas}" berhasil diperbarui`);
          fetchKelas();
          setIsFormOpen(false);
        } else {
          showError('Gagal', res.data?.message || 'Gagal memperbarui kelas');
        }
      }
    } catch (err) {
      console.error('Gagal simpan kelas:', err);
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKelas = async (id, nama) => {
    const confirmed = await showConfirm(
      'Konfirmasi Hapus', 
      `Apakah Anda yakin ingin menghapus kelas "${nama}" dari database?`,
      'Ya, Hapus Kelas',
      'Batal'
    );
    if (!confirmed) return;
    try {
      const res = await axios.delete(`/api/kelas/${id}`);
      if (res.data?.success) {
        toastSuccess(`Kelas "${nama}" berhasil dihapus`);
        fetchKelas();
      } else {
        showError('Gagal', res.data?.message || 'Gagal menghapus kelas');
      }
    } catch (err) {
      console.error('Gagal hapus kelas:', err);
      showError('Gagal Menghapus', err.response?.data?.message || err.message);
    }
  };

  const totalSantriInKelas = kelasList.reduce((acc, k) => acc + (parseInt(k.total_santri) || 0), 0);
  const countIkhwan = kelasList.filter(k => k.gender === 'L').length;
  const countAkhwat = kelasList.filter(k => k.gender === 'P').length;

  const filteredList = kelasList.filter((k) => {
    const q = search.toLowerCase();
    const matchSearch = (
      k.nama_kelas?.toLowerCase().includes(q) ||
      k.mustahiq?.toLowerCase().includes(q) ||
      k.munawwib?.toLowerCase().includes(q) ||
      k.tingkat?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ikhwan' ? k.gender === 'L' :
      activeFilterTab === 'akhwat' ? k.gender === 'P' : true;

    const matchGender = 
      filterGender === 'Semua Gender' ? true :
      filterGender === 'Ikhwan' ? k.gender === 'L' :
      filterGender === 'Akhwat' ? k.gender === 'P' : true;

    const matchTingkat = 
      filterTingkat === 'Semua Tingkat' ? true :
      k.tingkat?.toLowerCase().includes(filterTingkat.toLowerCase());

    return matchSearch && matchTab && matchGender && matchTingkat;
  });

  const asatidzOptions = asatidzList.map((a) => {
    const gelar = a.gelar ? `, ${a.gelar}` : '';
    const label = `${a.nama_asatidz}${gelar}`;
    return {
      value: a.nama_asatidz,
      label: label,
      sublabel: a.tugas_utama || a.kategori_asatidz || 'Asatidz',
    };
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL KELAS</div>
            <div className="stat-colored-number">{kelasList.length}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">KELAS IKHWAN (PUTRA)</div>
            <div className="stat-colored-number">{countIkhwan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">KELAS AKHWAT (PUTRI)</div>
            <div className="stat-colored-number">{countAkhwat}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI AKTIF</div>
            <div className="stat-colored-number">{totalSantriInKelas}</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Kelas</h2>
            <p>Kelola kelas santri, mustahiq (asatidz pengampu), munawwib (badal/pengganti), dan tingkat diniyah</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchKelas}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Kelas Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <BookOpen size={14} /> Semua Kelas ({kelasList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'ikhwan' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ikhwan')}
        >
          <Users size={14} /> Kelas Ikhwan ({countIkhwan})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'akhwat' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('akhwat')}
        >
          <Sparkles size={14} /> Kelas Akhwat ({countAkhwat})
        </button>
      </div>

      {/* 4. SEARCH & DROPDOWN FILTER BAR (DESKTOP OPTIMIZED) */}
      <div className="filter-search-box" style={{ 
        background: '#ffffff', 
        border: '1px solid #cbd5e1', 
        borderRadius: '8px', 
        padding: '8px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '14px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        flexWrap: 'wrap'
      }}>
        <div className="filter-search-input" style={{ flex: '1 1 260px', minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama kelas, kode, mustahiq, munawwib, tingkat..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.8rem', color: '#0f172a', background: 'transparent' }}
          />
          {search && (
            <button 
              type="button" 
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ width: '160px', flexShrink: 0 }}>
          <SearchableSelect
            options={[
              { value: 'Semua Gender', label: 'Semua Gender' },
              { value: 'Ikhwan', label: 'Ikhwan (Putra)' },
              { value: 'Akhwat', label: 'Akhwat (Putri)' },
            ]}
            value={filterGender}
            onChange={(val) => setFilterGender(val || 'Semua Gender')}
            placeholder="Semua Gender"
            searchPlaceholder="Cari gender..."
          />
        </div>

        <div style={{ width: '180px', flexShrink: 0 }}>
          <SearchableSelect
            options={[
              { value: 'Semua Tingkat', label: 'Semua Tingkat' },
              { value: '1', label: 'Tingkat 1' },
              { value: '2', label: 'Tingkat 2' },
              { value: '3', label: 'Tingkat 3' },
              { value: '4', label: 'Tingkat 4' },
              { value: '5', label: 'Tingkat 5' },
              { value: '6', label: 'Tingkat 6' },
              { value: 'Takhoshus', label: 'Takhoshus' },
              { value: 'Ula', label: 'Ula' },
              { value: 'Wustho', label: 'Wustho' },
              { value: 'Ulya', label: 'Ulya' },
            ]}
            value={filterTingkat}
            onChange={(val) => setFilterTingkat(val || 'Semua Tingkat')}
            placeholder="Semua Tingkat"
            searchPlaceholder="Cari tingkat..."
          />
        </div>
      </div>

      {/* 5. DATA TABLE (DESKTOP EXPANDED & CRISP) */}
      <div className="table-container-card" style={{ 
        background: '#ffffff', 
        borderRadius: '8px', 
        border: '1px solid #cbd5e1', 
        overflow: 'hidden', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0284c7' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Memuat data kelas...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                <tr>
                  <th className="td-center" style={{ width: '45px', fontSize: '0.74rem', padding: '10px 8px' }}>NO</th>
                  <th style={{ fontSize: '0.74rem', padding: '10px 12px' }}>NAMA KELAS</th>
                  <th className="td-center" style={{ width: '100px', fontSize: '0.74rem', padding: '10px 8px' }}>TINGKAT</th>
                  <th className="td-center" style={{ width: '130px', fontSize: '0.74rem', padding: '10px 8px' }}>GENDER</th>
                  <th style={{ fontSize: '0.74rem', padding: '10px 12px' }}>MUSTAHIQ (PENGAMPU)</th>
                  <th style={{ fontSize: '0.74rem', padding: '10px 12px' }}>MUNAWWIB (BADAL)</th>
                  <th className="td-center" style={{ width: '130px', fontSize: '0.74rem', padding: '10px 8px' }}>TOTAL SANTRI</th>
                  <th className="td-center" style={{ width: '120px', fontSize: '0.74rem', padding: '10px 8px' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                      <BookOpen size={40} style={{ margin: '0 auto 10px', opacity: 0.35, color: '#0284c7' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#334155' }}>Tidak ada data kelas ditemukan</div>
                      <div style={{ fontSize: '0.76rem', marginTop: '4px', color: '#94a3b8' }}>
                        {search || filterGender !== 'Semua Gender' || filterTingkat !== 'Semua Tingkat' 
                          ? 'Coba sesuaikan kata kunci pencarian atau reset filter di atas.' 
                          : 'Silakan klik tombol "Tambah Kelas Baru" untuk menambahkan kelas.'}
                      </div>
                      {(search || filterGender !== 'Semua Gender' || filterTingkat !== 'Semua Tingkat') && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: '12px' }}
                          onClick={() => {
                            setSearch('');
                            setFilterGender('Semua Gender');
                            setFilterTingkat('Semua Tingkat');
                            setActiveFilterTab('semua');
                          }}
                        >
                          Reset Filter Pencarian
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredList.map((k, idx) => (
                    <tr 
                      key={k.id || idx}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b', fontSize: '0.76rem' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>{k.nama_kelas}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                          {k.kode_kelas || k.nama_kelas}
                        </div>
                      </td>
                      <td className="td-center" style={{ padding: '9px 8px' }}>
                        <span className="badge" style={{ 
                          background: '#f1f5f9', 
                          color: '#334155', 
                          fontWeight: 700, 
                          fontSize: '0.72rem',
                          border: '1px solid #e2e8f0',
                          padding: '3px 8px'
                        }}>
                          {k.tingkat || '-'}
                        </span>
                      </td>
                      <td className="td-center" style={{ padding: '9px 8px' }}>
                        <span className={`badge ${k.gender === 'L' ? 'badge-info' : 'badge-purple'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {k.gender === 'L' ? 'Boys (Putra)' : 'Girls (Putri)'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {k.mustahiq && k.mustahiq !== '-' ? (
                          <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <UserCheck size={13} style={{ flexShrink: 0 }} />
                            <span>{k.mustahiq}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {k.munawwib && k.munawwib !== '-' ? (
                          <div style={{ fontWeight: 600, color: '#0284c7', fontSize: '0.76rem' }}>
                            {k.munawwib}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontStyle: 'italic' }}>-</span>
                        )}
                      </td>
                      <td className="td-center" style={{ padding: '9px 8px' }}>
                        <span className="badge badge-success" style={{ 
                          fontWeight: 800, 
                          fontSize: '0.72rem', 
                          padding: '3px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Users size={11} />
                          <span>{k.total_santri || 0} Santri</span>
                        </span>
                      </td>
                      <td className="td-center" style={{ padding: '9px 8px' }}>
                        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            className="btn-action btn-action-view"
                            onClick={() => openDetail(k)}
                            title="Lihat Detail Kelas"
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-edit"
                            onClick={() => openEditForm(k)}
                            title="Edit Kelas"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-delete"
                            onClick={() => handleDeleteKelas(k.id, k.nama_kelas)}
                            title="Hapus Kelas"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL KELAS                                  */}
      {/* ==================================================== */}
      {isModalOpen && selectedKelas && (
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
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
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
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {selectedKelas.nama_kelas}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Tingkat: {selectedKelas.tingkat || '-'}
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
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#ffffff', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>MUSTAHIQ</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedKelas.mustahiq || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>MUNAWWIB (BADAL)</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0284c7' }}>{selectedKelas.munawwib || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TINGKAT</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{selectedKelas.tingkat || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>GENDER</div>
                  <span className={`badge ${selectedKelas.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                    {selectedKelas.gender === 'L' ? 'Ikhwan (Putra)' : 'Akhwat (Putri)'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL SANTRI</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedKelas.total_santri || 0} Santri</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>KODE KELAS</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#475569' }}>{selectedKelas.kode_kelas || '-'}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT KELAS                      */}
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
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column'
          }}>
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
                <BookOpen size={18} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Tambah Kelas Baru' : `Edit Kelas: ${formData.nama_kelas}`}
                </h3>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKelas}>
              <div style={{ padding: '18px 20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    NAMA KELAS *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Kelas 1 Ula, Kelas 2 Wustho, dll"
                    className="filter-select" 
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                    value={formData.nama_kelas}
                    onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      TINGKAT *
                    </label>
                    <SearchableSelect 
                      options={[
                        { value: 'Ula', label: 'Ula' },
                        { value: 'Wustho', label: 'Wustho' },
                        { value: 'Ulya', label: 'Ulya' },
                        { value: 'Kelas 1', label: 'Kelas 1' },
                        { value: 'Kelas 2', label: 'Kelas 2' },
                        { value: 'Kelas 3', label: 'Kelas 3' },
                        { value: 'Kelas 4', label: 'Kelas 4' },
                        { value: 'Reguler', label: 'Reguler' },
                      ]}
                      value={formData.tingkat}
                      onChange={(val) => setFormData({ ...formData, tingkat: val })}
                      placeholder="-- Pilih Tingkat --"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      GENDER SANTRI *
                    </label>
                    <SearchableSelect 
                      options={[
                        { value: 'L', label: 'Ikhwan (Putra)' },
                        { value: 'P', label: 'Akhwat (Putri)' },
                        { value: 'Semua', label: 'Semua (Campur)' },
                      ]}
                      value={formData.gender}
                      onChange={(val) => setFormData({ ...formData, gender: val })}
                      placeholder="-- Pilih Gender --"
                    />
                  </div>
                </div>

                {/* Mustahiq (Ambil dari Asatidz) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    MUSTAHIQ (DARI ASATIDZ) *
                  </label>
                  <SearchableSelect 
                    options={asatidzOptions}
                    value={formData.mustahiq}
                    onChange={(val) => setFormData({ ...formData, mustahiq: val })}
                    placeholder="-- Pilih Asatidz Mustahiq --"
                    searchPlaceholder="Cari nama asatidz..."
                  />
                </div>

                {/* Munawwib (Badal / Asatidz Pengganti) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                    MUNAWWIB (BADAL / ASATIDZ PENGGANTI)
                  </label>
                  <SearchableSelect 
                    options={[
                      { value: '', label: '-- Tidak Ada / Kosong --' },
                      ...asatidzOptions,
                    ]}
                    value={formData.munawwib}
                    onChange={(val) => setFormData({ ...formData, munawwib: val })}
                    placeholder="-- Pilih Asatidz Munawwib (Opsional) --"
                    searchPlaceholder="Cari nama asatidz munawwib..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  <Save size={13} /> {submitting ? 'Menyimpan...' : 'Simpan Data Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
