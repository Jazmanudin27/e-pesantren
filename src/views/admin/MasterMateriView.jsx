import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  RotateCw, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Sparkles, 
  Save,
  CheckCircle2,
  BookmarkCheck,
  Layers,
  ScrollText,
  FileSpreadsheet
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const KATEGORI_OPTIONS = [
  { value: "Al-Qur'an", label: "Al-Qur'an", sublabel: 'Juz & Surat Al-Qur\'an' },
  { value: 'Nahwu & Shorof', label: 'Nahwu & Shorof', sublabel: 'Jurumiyah, Imrithi, Alfiyah' },
  { value: "Fiqih Syafi'i", label: "Fiqih Syafi'i", sublabel: 'Taqrib, Fathul Qorib, Safinah' },
  { value: 'Hadits Nabawi', label: 'Hadits Nabawi', sublabel: 'Arbain, Bulughul Maram' },
  { value: 'Aqidah & Tauhid', label: 'Aqidah & Tauhid', sublabel: 'Aqidatul Awam, Tijan Darori' },
  { value: 'Akhlak & Adab', label: 'Akhlak & Adab', sublabel: 'Taisirul Khalaq, Ta\'lim Muta\'allim' },
  { value: 'Tajwid', label: 'Tajwid', sublabel: 'Hidayatus Shibyan, Jazariyah' },
  { value: 'Kitab Kuning Lainnya', label: 'Kitab Kuning Lainnya', sublabel: 'Materi Hafalan Tambahan' }
];

export default function MasterMateriView() {
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_materi: '',
    kategori: "Nahwu & Shorof",
    target_hafalan: '',
    deskripsi: ''
  });

  const fetchMateri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/materi-hafalan');
      if (res.data && res.data.success && res.data.data) {
        setMateriList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch /api/materi-hafalan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateri();
  }, []);

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      nama_materi: '',
      kategori: 'Nahwu & Shorof',
      target_hafalan: '',
      deskripsi: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      nama_materi: item.nama_materi || '',
      kategori: item.kategori || 'Kitab Kuning Lainnya',
      target_hafalan: item.target_hafalan || '',
      deskripsi: item.deskripsi || ''
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama_materi.trim()) {
      showError('Validasi Gagal', 'Nama materi hafalan / kitab wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/materi-hafalan', formData);
        if (res.data && res.data.success) {
          toastSuccess('Materi hafalan baru berhasil ditambahkan ke database');
        }
      } else {
        const res = await axios.put(`/api/materi-hafalan/${formData.id}`, formData);
        if (res.data && res.data.success) {
          toastSuccess('Data materi hafalan berhasil diperbarui');
        }
      }
      setIsFormOpen(false);
      fetchMateri();
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm(
      'Hapus Materi Hafalan',
      `Apakah Anda yakin ingin menghapus "${item.nama_materi}" dari master database?`,
      'Ya, Hapus',
      'Batal'
    );
    if (ok) {
      try {
        await axios.delete(`/api/materi-hafalan/${item.id}`);
        toastSuccess(`Materi "${item.nama_materi}" berhasil dihapus.`);
        fetchMateri();
      } catch (err) {
        showError('Gagal Menghapus', err.message);
      }
    }
  };

  // Filter list
  const filteredList = materiList.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = (
      (item.nama_materi || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q) ||
      (item.target_hafalan || '').toLowerCase().includes(q) ||
      (item.deskripsi || '').toLowerCase().includes(q)
    );

    const matchKat = filterKategori === 'semua' ? true : item.kategori === filterKategori;
    return matchSearch && matchKat;
  });

  // Kategori badge color mapping
  const getBadgeStyle = (kat = '') => {
    const lower = kat.toLowerCase();
    if (lower.includes('qur')) return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    if (lower.includes('nahwu')) return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    if (lower.includes('fiqih')) return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    if (lower.includes('hadits')) return { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
    if (lower.includes('aqidah')) return { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' };
    if (lower.includes('tajwid')) return { bg: '#ccfbf1', color: '#115e59', border: '#99f6e4' };
    if (lower.includes('akhlak')) return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
    return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
  };

  // Stats calculation
  const totalMateri = materiList.length;
  const countQuran = materiList.filter(m => (m.kategori || '').includes("Qur'an")).length;
  const countNahwu = materiList.filter(m => (m.kategori || '').toLowerCase().includes('nahwu')).length;
  const countFiqihHadits = materiList.filter(m => {
    const k = (m.kategori || '').toLowerCase();
    return k.includes('fiqih') || k.includes('hadits');
  }).length;

  return (
    <div style={{ padding: '4px', maxWidth: '100%', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Master Materi Hafalan & Kitab Kuning
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                DATABASE RESMI
              </span>
            </h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
              Kelola daftar hafalan Al-Qur'an, Nadzom Nahwu, Matan Fiqih, Hadits, dan Kitab Kuning untuk mutaba'ah setoran santri
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchMateri}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
            title="Refresh Data"
          >
            <RotateCw size={15} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openAddForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.28)'
            }}
          >
            <Plus size={16} />
            <span>+ Tambah Materi / Kitab</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Card 1: Total */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL MATERI</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{totalMateri}</div>
            <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: '2px' }}>Tersimpan di Sistem</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} />
          </div>
        </div>

        {/* Card 2: Al-Qur'an */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>AL-QUR'AN & TAHFIDZ</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>{countQuran}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Juz & Surat Pilihan</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#d1fae5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookmarkCheck size={20} />
          </div>
        </div>

        {/* Card 3: Nahwu & Shorof */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>NAHWU & SHOROF</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{countNahwu}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Jurumiyah, Imrithi, Alfiyah</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScrollText size={20} />
          </div>
        </div>

        {/* Card 4: Fiqih & Hadits */}
        <div style={{
          background: '#ffffff',
          borderRadius: '10px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>FIQIH & HADITS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>{countFiqihHadits}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Taqrib, Arbain, dll</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '14px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Filter Tabs by Kategori */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: '100%', paddingBottom: '4px' }}>
          {[
            { id: 'semua', label: 'Semua Kategori' },
            { id: "Al-Qur'an", label: "Al-Qur'an" },
            { id: 'Nahwu & Shorof', label: 'Nahwu & Shorof' },
            { id: "Fiqih Syafi'i", label: "Fiqih Syafi'i" },
            { id: 'Hadits Nabawi', label: 'Hadits Nabawi' },
            { id: 'Aqidah & Tauhid', label: 'Aqidah & Tauhid' },
            { id: 'Tajwid', label: 'Tajwid' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterKategori(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: filterKategori === tab.id ? '1px solid #059669' : '1px solid #cbd5e1',
                background: filterKategori === tab.id ? '#ecfdf5' : '#ffffff',
                color: filterKategori === tab.id ? '#065f46' : '#475569',
                fontSize: '0.76rem',
                fontWeight: filterKategori === tab.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari materi, kitab, atau bait..."
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.8rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* TABLE DATA MASTER MATERI */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#059669' }} />
            <p style={{ fontSize: '0.85rem' }}>Memuat master data materi hafalan & kitab...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <BookOpen size={36} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#334155', margin: '0 0 4px' }}>Tidak Ada Data Materi</h3>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>Belum ada materi hafalan yang cocok dengan pencarian / filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <th style={{ padding: '12px 16px', width: '48px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '12px 16px' }}>Nama Materi / Kitab</th>
                  <th style={{ padding: '12px 16px' }}>Kategori Bidang</th>
                  <th style={{ padding: '12px 16px' }}>Target Capaian</th>
                  <th style={{ padding: '12px 16px' }}>Keterangan & Deskripsi</th>
                  <th style={{ padding: '12px 16px', width: '120px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => {
                  const badge = getBadgeStyle(item.kategori);
                  return (
                    <tr 
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                          {item.nama_materi}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '1px' }}>
                          ID Master: #{item.id}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {item.kategori || 'Kitab Kuning'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #e2e8f0'
                        }}>
                          🎯 {item.target_hafalan || 'Sesuai Kurikulum'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.78rem', maxWidth: '300px' }}>
                        {item.deskripsi || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openEditForm(item)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600
                            }}
                            title="Edit Materi"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Hapus Materi"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT MATERI HAFALAN */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    {formMode === 'add' ? 'Tambah Materi Hafalan / Kitab Baru' : 'Edit Master Materi Hafalan'}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#d1fae5', margin: '2px 0 0' }}>
                    Data tersimpan di tabel database dan langsung muncul di pilihan setoran
                  </p>
                </div>
              </div>
              <button
                onClick={closeForm}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Nama Materi / Kitab */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nama Materi / Kitab Kuning <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_materi}
                    onChange={(e) => setFormData({ ...formData, nama_materi: e.target.value })}
                    placeholder="Contoh: Nadzom Al-Jurumiyah, Matan Taqrib, Juz 30..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Kategori Bidang */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Kategori Bidang Keilmuan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <SearchableSelect
                    options={KATEGORI_OPTIONS}
                    value={formData.kategori}
                    onChange={(val) => setFormData({ ...formData, kategori: val })}
                    placeholder="-- Pilih Kategori Bidang --"
                    searchPlaceholder="Cari kategori..."
                  />
                </div>

                {/* Target Capaian (Bait / Halaman / Juz) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Target Hafalan / Satuan Capaian
                  </label>
                  <input
                    type="text"
                    value={formData.target_hafalan}
                    onChange={(e) => setFormData({ ...formData, target_hafalan: e.target.value })}
                    placeholder="Contoh: 60 Bait, 30 Juz, 42 Hadits, 1002 Bait..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Keterangan & Deskripsi */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Deskripsi & Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Catatan tambahan mengenai materi hafalan, jenjang kelas yang wajib menghafal, dll..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>{formMode === 'add' ? 'Simpan ke Database' : 'Perbarui Data'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
