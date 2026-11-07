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
  Pin, 
  Image, 
  Calendar, 
  User, 
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Send
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

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

  const activeCount = feed.filter(p => !isExpired(p.tgl_kadaluarsa)).length;
  const expiredCount = feed.filter(p => isExpired(p.tgl_kadaluarsa)).length;

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
    <div className="admin-content-inner" style={{ padding: '20px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d766e, #059669)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(13, 118, 110, 0.3)'
          }}>
            <Megaphone size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Informasi &amp; Pengumuman Resmi Pesantren
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '3px 0 0' }}>
              Kelola pengumuman pesantren, jadwal kegiatan, info liburan/kepulangan santri, serta popup modal otomatis di Portal Orang Tua
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
            Aktif Tayang: {activeCount}
          </span>
          {expiredCount > 0 && (
            <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
              Kadaluarsa: {expiredCount}
            </span>
          )}
          <button 
            onClick={fetchFeed}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}
          >
            <RotateCw size={14} /> Refresh
          </button>
          <button 
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0d766e, #059669)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 800, boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)' }}
          >
            <Plus size={16} /> Buat Pengumuman Baru
          </button>
        </div>
      </div>

      {/* Search & Kategori Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', flex: 1 }}>
          {['Semua', ...KATEGORI_RESMI].map(kat => (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: selectedKategori === kat ? 'none' : '1px solid #e2e8f0',
                background: selectedKategori === kat ? '#0d766e' : '#ffffff',
                color: selectedKategori === kat ? '#ffffff' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: selectedKategori === kat ? '0 4px 10px rgba(13, 118, 110, 0.25)' : 'none'
              }}
            >
              {kat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Cari judul atau isi pengumuman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.8rem',
              background: '#ffffff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Daftar Pengumuman Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredFeed.map(post => {
          const expired = isExpired(post.tgl_kadaluarsa);
          const catStyle = getCategoryStyle(post.kategori);

          return (
            <div 
              key={post.id}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: expired ? '1px dashed #cbd5e1' : post.is_pinned ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                position: 'relative',
                opacity: expired ? 0.78 : 1
              }}
            >
              {/* Status Badges Top Right */}
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
                  {expired ? 'Kadaluarsa (Sembunyi)' : 'Aktif di Modal Ortu'}
                </span>
              </div>

              {/* Banner Visual */}
              {post.foto_url ? (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden', background: '#f1f5f9' }}>
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
                  padding: '22px 18px 16px',
                  background: catStyle.gradient,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Megaphone size={20} color="#ffffff" />
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.95 }}>
                    {post.kategori || 'Pengumuman Pesantren'}
                  </div>
                </div>
              )}

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
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
                    Posting: {post.tanggal_publikasi ? new Date(post.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
                  {post.judul}
                </h3>

                <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.5, flex: 1, whiteSpace: 'pre-line' }}>
                  {post.konten}
                </p>

                {/* Info Tanggal Kadaluarsa */}
                <div style={{
                  background: expired ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${expired ? '#fecdd3' : '#e2e8f0'}`,
                  borderRadius: '10px',
                  padding: '7px 10px',
                  fontSize: '0.7rem',
                  color: expired ? '#dc2626' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontWeight: 600
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} />
                    Batas Tayang (Kadaluarsa):
                  </span>
                  <strong>
                    {post.tgl_kadaluarsa
                      ? new Date(post.tgl_kadaluarsa).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Tanpa Batas Waktu'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <User size={12} /> {post.penulis || 'Humas Pesantren'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(post)}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleHapus(post)}
                      style={{ background: '#fef2f2', border: '1px solid #fecdd3', color: '#dc2626', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFeed.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            <Megaphone size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>Belum Ada Pengumuman pada Kategori Ini</div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Klik tombol "Buat Pengumuman Baru" untuk menerbitkan pengumuman resmi ke orang tua santri.</div>
          </div>
        )}
      </div>

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
