import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Megaphone,
  Bell, 
  Plus, 
  RotateCw, 
  Search, 
  Trash2, 
  Edit3,
  Eye,
  Pin, 
  Image, 
  Calendar, 
  User, 
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Send,
  Loader2,
  Sparkles,
  LayoutList,
  Grid
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const KATEGORI_RESMI = [
  'Pengumuman Pesantren',
  'Informasi Kegiatan',
  'Jadwal Kegiatan',
  'Liburan & Kepulangan Santri',
  'Informasi Penting Lainnya'
];

export default function InformasiKegiatanAdminView() {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const getDefaultExpireDate = () => {
    const d = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };

  const initialForm = {
    id: null,
    judul: '',
    kategori: 'Pengumuman Pesantren',
    ringkasan: '',
    konten: '',
    foto_url: '',
    penulis: 'Humas Pondok Pesantren',
    tanggal_publikasi: new Date().toISOString().slice(0, 10),
    tgl_kadaluarsa: getDefaultExpireDate(),
    is_pinned: false,
    is_popup: true,
    kirim_notif_ulang: false
  };

  const [formPost, setFormPost] = useState(initialForm);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/informasi-kegiatan/feed`);
      if (res.data?.success) {
        setFeed(res.data.data.feed || []);
      }
    } catch (err) {
      console.warn('Gagal memuat pengumuman:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const isExpired = (tglKadaluarsa) => {
    if (!tglKadaluarsa) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    const expStr = String(tglKadaluarsa).slice(0, 10);
    return expStr < todayStr;
  };

  const openAddModal = () => {
    setFormMode('add');
    setFormPost({
      ...initialForm,
      tanggal_publikasi: new Date().toISOString().slice(0, 10),
      tgl_kadaluarsa: getDefaultExpireDate()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (post) => {
    setFormMode('edit');
    setFormPost({
      id: post.id,
      judul: post.judul || '',
      kategori: post.kategori || 'Pengumuman Pesantren',
      ringkasan: post.ringkasan || '',
      konten: post.konten || '',
      foto_url: post.foto_url || '',
      penulis: post.penulis || 'Humas Pondok Pesantren',
      tanggal_publikasi: post.tanggal_publikasi ? String(post.tanggal_publikasi).slice(0, 10) : new Date().toISOString().slice(0, 10),
      tgl_kadaluarsa: post.tgl_kadaluarsa ? String(post.tgl_kadaluarsa).slice(0, 10) : '',
      is_pinned: Boolean(Number(post.is_pinned) === 1),
      is_popup: post.is_popup === undefined ? true : Boolean(Number(post.is_popup) === 1),
      kirim_notif_ulang: false
    });
    setIsModalOpen(true);
  };

  const openPreviewModal = (post) => {
    setSelectedPreview(post);
    setPreviewModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormPost(prev => ({ ...prev, foto_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!formPost.judul.trim() || !formPost.konten.trim()) {
      showError('Validasi Gagal', 'Judul dan Isi Pengumuman wajib diisi');
      return;
    }
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/informasi-kegiatan/admin', formPost);
        if (res.data?.success) {
          toastSuccess('Diterbitkan!', 'Pengumuman berhasil diterbitkan & notifikasi telah dikirim ke Orang Tua');
          setIsModalOpen(false);
          fetchFeed();
        }
      } else {
        const res = await axios.put(`/api/informasi-kegiatan/admin/${formPost.id}`, formPost);
        if (res.data?.success) {
          toastSuccess('Diperbarui!', 'Data pengumuman berhasil diperbarui');
          setIsModalOpen(false);
          fetchFeed();
        }
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapus = async (post) => {
    const confirmed = await showConfirm(
      'Hapus Pengumuman?',
      `Yakin ingin menghapus pengumuman "${post.judul}"?`
    );
    if (!confirmed) return;
    try {
      await axios.delete(`/api/informasi-kegiatan/admin/${post.id}`);
      toastSuccess('Berhasil', 'Pengumuman berhasil dihapus');
      fetchFeed();
    } catch (e) {
      showError('Gagal', e.message);
    }
  };

  const filteredFeed = feed.filter(item => {
    if (selectedKategori !== 'Semua' && item.kategori !== selectedKategori) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (item.judul || '').toLowerCase().includes(q) ||
        (item.konten || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCount = feed.length;
  const activeCount = feed.filter(p => !isExpired(p.tgl_kadaluarsa)).length;
  const expiredCount = feed.filter(p => isExpired(p.tgl_kadaluarsa)).length;
  const popupCount = feed.filter(p => !isExpired(p.tgl_kadaluarsa) && (p.is_popup === true || Number(p.is_popup) === 1)).length;
  const pinnedCount = feed.filter(p => Number(p.is_pinned) === 1).length;

  const getCategoryStyle = (kat = '') => {
    const k = kat.toLowerCase();
    if (k.includes('libur') || k.includes('pulang')) {
      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', gradient: 'linear-gradient(135deg, #d97706, #b45309)' };
    }
    if (k.includes('jadwal')) {
      return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', gradient: 'linear-gradient(135deg, #0284c7, #0369a1)' };
    }
    if (k.includes('penting')) {
      return { bg: '#ffe4e6', color: '#be123c', border: '#fecdd3', gradient: 'linear-gradient(135deg, #e11d48, #be123c)' };
    }
    if (k.includes('kegiatan')) {
      return { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' };
    }
    return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', gradient: 'linear-gradient(135deg, #059669, #0d766e)' };
  };

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL INFORMASI & PENGUMUMAN</div>
            <div className="stat-colored-number">{totalCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Megaphone size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">AKTIF TAYANG RESMI</div>
            <div className="stat-colored-number">{activeCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">POPUP MODAL ORTU</div>
            <div className="stat-colored-number">{popupCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Bell size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">PRIORITAS / PINNED</div>
            <div className="stat-colored-number">{pinnedCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Pin size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Megaphone size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Informasi & Pengumuman Pesantren</h2>
            <p>Kelola pengumuman resmi, jadwal kegiatan, info liburan/kepulangan santri, serta broadcast popup otomatis ke orang tua</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchFeed}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={14} /> Buat Pengumuman Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        {[
          { id: 'Semua', label: `Semua Info (${totalCount})` },
          ...KATEGORI_RESMI.map(kat => ({
            id: kat,
            label: kat
          }))
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${selectedKategori === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedKategori(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. FILTER SEARCH BOX */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari judul, ringkasan, atau isi pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <SearchableSelect
          style={{ minWidth: '220px', flex: '1 1 200px', maxWidth: '300px' }}
          value={selectedKategori}
          onChange={(val) => setSelectedKategori(val || 'Semua')}
          placeholder="Semua Kategori"
          options={[
            { value: 'Semua', label: 'Semua Kategori Informasi' },
            ...KATEGORI_RESMI.map(k => ({ value: k, label: k }))
          ]}
        />

        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            title="Tampilan Tabel"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'table' ? '#fff' : 'transparent',
              color: viewMode === 'table' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <LayoutList size={14} /> Tabel
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            title="Tampilan Kartu / Grid"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'cards' ? '#fff' : 'transparent',
              color: viewMode === 'cards' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Grid size={14} /> Kartu
          </button>
        </div>
      </div>

      {/* 5. DATA TABLE & CONTAINER CARD */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
            Memuat data pengumuman & informasi kegiatan...
          </div>
        ) : filteredFeed.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Megaphone size={36} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Tidak Ada Informasi</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Belum ada pengumuman yang sesuai dengan pencarian atau kategori ini.</div>
          </div>
        ) : viewMode === 'cards' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '16px' }}>
            {filteredFeed.map(post => {
              const expired = isExpired(post.tgl_kadaluarsa);
              const catStyle = getCategoryStyle(post.kategori);

              return (
                <div 
                  key={post.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: expired ? '1px dashed #cbd5e1' : post.is_pinned ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    position: 'relative',
                    opacity: expired ? 0.78 : 1
                  }}
                >
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 2 }}>
                    {Number(post.is_pinned) === 1 && (
                      <span style={{
                        background: '#f59e0b',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        <Pin size={11} /> PRIORITAS
                      </span>
                    )}
                    <span style={{
                      background: expired ? '#ef4444' : '#10b981',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      {expired ? 'Kadaluarsa' : 'Aktif'}
                    </span>
                  </div>

                  {post.foto_url ? (
                    <div style={{ width: '100%', height: '150px', overflow: 'hidden', background: '#f1f5f9' }}>
                      <img 
                        src={post.foto_url} 
                        alt={post.judul} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%',
                      padding: '20px 16px',
                      background: catStyle.gradient,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <Megaphone size={20} color="#ffffff" />
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {post.kategori || 'Pengumuman Pesantren'}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{
                        background: catStyle.bg,
                        color: catStyle.color,
                        border: `1px solid ${catStyle.border}`,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px'
                      }}>
                        {post.kategori}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        {post.tanggal_publikasi ? new Date(post.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.35 }}>
                      {post.judul}
                    </h3>

                    <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0 0 10px', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-line' }}>
                      {post.konten ? (post.konten.length > 120 ? `${post.konten.slice(0, 120)}...` : post.konten) : '-'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                        👤 {post.penulis || 'Humas'}
                      </span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn-action btn-action-view"
                          onClick={() => openPreviewModal(post)}
                          title="Lihat Detail"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          className="btn-action btn-action-edit"
                          onClick={() => openEditModal(post)}
                          title="Edit"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          onClick={() => handleHapus(post)}
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>JUDUL INFORMASI & PENULIS</th>
                <th>KATEGORI</th>
                <th>PUBLIKASI & KADALUARSA</th>
                <th>STATUS TAYANG</th>
                <th>MODAL ORTU</th>
                <th className="td-center" style={{ width: '120px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeed.map((post, index) => {
                const expired = isExpired(post.tgl_kadaluarsa);
                const catStyle = getCategoryStyle(post.kategori);

                return (
                  <tr key={post.id || index}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        {post.foto_url ? (
                          <img
                            src={post.foto_url}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            background: catStyle.bg,
                            color: catStyle.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: `1px solid ${catStyle.border}`
                          }}>
                            <Megaphone size={16} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {post.judul}
                            {Number(post.is_pinned) === 1 && (
                              <span style={{
                                background: '#f59e0b',
                                color: '#fff',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                PINNED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span>Penulis: <strong>{post.penulis || 'Humas Pesantren'}</strong></span>
                            {post.ringkasan && (
                              <span style={{ color: '#475569' }}>• {post.ringkasan.slice(0, 45)}{post.ringkasan.length > 45 ? '...' : ''}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: catStyle.bg,
                          color: catStyle.color,
                          border: `1px solid ${catStyle.border}`,
                          fontWeight: 700
                        }}
                      >
                        {post.kategori || 'Pengumuman'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.74rem', color: '#0f172a', fontWeight: 600 }}>
                        {post.tanggal_publikasi ? new Date(post.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: expired ? '#dc2626' : '#64748b', fontWeight: expired ? 700 : 500 }}>
                        Kadaluarsa: {post.tgl_kadaluarsa ? new Date(post.tgl_kadaluarsa).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selamanya'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${expired ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 700 }}>
                        {expired ? 'Kadaluarsa' : 'Aktif Tayang'}
                      </span>
                    </td>
                    <td>
                      {post.is_popup && !expired ? (
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          🔔 Pop-up Aktif
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontWeight: 600 }}>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="td-center">
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          className="btn-action btn-action-view"
                          onClick={() => openPreviewModal(post)}
                          title="Lihat Detail"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-edit"
                          onClick={() => openEditModal(post)}
                          title="Edit Pengumuman"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          onClick={() => handleHapus(post)}
                          title="Hapus Pengumuman"
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
        )}
      </div>

      {/* Detail Preview Modal */}
      {previewModalOpen && selectedPreview && (
        <div
          onClick={() => setPreviewModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '580px',
              borderRadius: '20px',
              padding: '22px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="badge"
                  style={{
                    ...getCategoryStyle(selectedPreview.kategori),
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  {selectedPreview.kategori}
                </span>
                {Number(selectedPreview.is_pinned) === 1 && (
                  <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                    PRIORITAS
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {selectedPreview.foto_url && (
              <div style={{ width: '100%', maxHeight: '240px', overflow: 'hidden', borderRadius: '12px', marginBottom: '14px', background: '#f8fafc' }}>
                <img src={selectedPreview.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
              {selectedPreview.judul}
            </h2>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#64748b', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span>👤 {selectedPreview.penulis || 'Humas Pesantren'}</span>
              <span>📅 {selectedPreview.tanggal_publikasi ? new Date(selectedPreview.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
              <span>⏰ Exp: {selectedPreview.tgl_kadaluarsa ? new Date(selectedPreview.tgl_kadaluarsa).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanpa batas'}</span>
            </div>

            {selectedPreview.ringkasan && (
              <div style={{ fontSize: '0.78rem', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px', fontWeight: 600 }}>
                💡 <em>Ringkasan:</em> {selectedPreview.ringkasan}
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {selectedPreview.konten}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalOpen(false);
                  openEditModal(selectedPreview);
                }}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.78rem' }}
              >
                <Edit3 size={13} /> Edit Pengumuman
              </button>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.78rem' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengumuman */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '560px',
              borderRadius: '22px',
              padding: '22px',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    {formMode === 'add' ? 'Terbitkan Pengumuman Resmi Baru' : 'Ubah Pengumuman Pesantren'}
                  </h2>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Tampil di Modal Pengumuman &amp; kirim notifikasi ke Orang Tua Santri
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Judul Pengumuman / Informasi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Kepulangan & Libur Semester Santri"
                  value={formPost.judul}
                  onChange={(e) => setFormPost({ ...formPost, judul: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                    Kategori Informasi *
                  </label>
                  <select
                    value={formPost.kategori}
                    onChange={(e) => setFormPost({ ...formPost, kategori: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
                  >
                    {KATEGORI_RESMI.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                    Bagian / Penulis
                  </label>
                  <input
                    type="text"
                    value={formPost.penulis}
                    onChange={(e) => setFormPost({ ...formPost, penulis: e.target.value })}
                    placeholder="Humas Pondok Pesantren"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Tanggal Posting
                  </label>
                  <input
                    type="date"
                    value={formPost.tanggal_publikasi}
                    onChange={(e) => setFormPost({ ...formPost, tanggal_publikasi: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#0d766e', marginBottom: '4px' }}>
                    Tanggal Kadaluarsa (Otomatis Hilang)
                  </label>
                  <input
                    type="date"
                    value={formPost.tgl_kadaluarsa}
                    onChange={(e) => setFormPost({ ...formPost, tgl_kadaluarsa: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #99f6e4', fontSize: '0.8rem', background: '#fff' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', fontSize: '0.68rem', color: '#64748b' }}>
                  * Setelah melewati <strong>Tanggal Kadaluarsa</strong>, pengumuman ini otomatis berhenti muncul di Modal Popup Orang Tua.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Ringkasan Singkat (Tampil di Notifikasi HP Orang Tua)
                </label>
                <input
                  type="text"
                  placeholder="Ringkasan 1 kalimat untuk preview notifikasi..."
                  value={formPost.ringkasan}
                  onChange={(e) => setFormPost({ ...formPost, ringkasan: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Isi Lengkap Pengumuman / Jadwal *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi detail pengumuman resmi, jadwal kegiatan, atau ketentuan kepulangan santri..."
                  value={formPost.konten}
                  onChange={(e) => setFormPost({ ...formPost, konten: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.83rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '5px' }}>
                  Gambar / Poster Pengumuman (Opsional)
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ fontSize: '0.75rem', flex: 1 }}
                  />
                  {formPost.foto_url && (
                    <button
                      type="button"
                      onClick={() => setFormPost({ ...formPost, foto_url: '' })}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecdd3', padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Hapus Gambar
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f0fdf4', padding: '10px 12px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#065f46', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formPost.is_pinned}
                    onChange={(e) => setFormPost({ ...formPost, is_pinned: e.target.checked })}
                  />
                  Sematkan di Urutan Pertama (Pengumuman Penting / Prioritas)
                </label>

                {formMode === 'edit' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formPost.kirim_notif_ulang}
                      onChange={(e) => setFormPost({ ...formPost, kirim_notif_ulang: e.target.checked })}
                    />
                    Kirim Ulang Notifikasi Perubahan ke HP Orang Tua
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0d766e, #059669)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)' }}
                >
                  <Send size={15} />
                  {submitting ? 'Menyimpan...' : formMode === 'add' ? 'Terbitkan & Kirim Notif Ortu' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
