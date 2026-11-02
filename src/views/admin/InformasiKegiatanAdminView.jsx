import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  Plus, 
  RotateCw, 
  Search, 
  Trash2, 
  Pin, 
  Image, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink 
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function InformasiKegiatanAdminView() {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formPost, setFormPost] = useState({
    judul: '',
    kategori: 'Kegiatan Santri',
    ringkasan: '',
    konten: '',
    foto_url: '',
    penulis: 'Humas Pondok Pesantren',
    tanggal_publikasi: new Date().toISOString().slice(0, 10),
    is_pinned: false
  });

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/informasi-kegiatan/feed?kategori=${selectedKategori}`);
      if (res.data?.success) {
        setFeed(res.data.data.feed || []);
        setKategoriList(res.data.data.kategoriList || ['Semua']);
      }
    } catch (err) {
      console.warn('Gagal memuat feed informasi:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedKategori]);

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!formPost.judul || !formPost.konten) {
      showError('Validasi Gagal', 'Judul dan Isi Berita wajib diisi');
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post('/api/informasi-kegiatan/admin', formPost);
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Postingan informasi kegiatan berhasil diterbitkan ke Portal Orang Tua');
        setIsModalOpen(false);
        setFormPost({
          judul: '',
          kategori: 'Kegiatan Santri',
          ringkasan: '',
          konten: '',
          foto_url: '',
          penulis: 'Humas Pondok Pesantren',
          tanggal_publikasi: new Date().toISOString().slice(0, 10),
          is_pinned: false
        });
        fetchFeed();
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapus = (id) => {
    showConfirm('Hapus Postingan?', 'Apakah Anda yakin ingin menghapus postingan informasi ini?', async () => {
      try {
        await axios.delete(`/api/informasi-kegiatan/admin/${id}`);
        toastSuccess('Berhasil', 'Postingan berhasil dihapus');
        fetchFeed();
      } catch (e) {
        showError('Gagal', e.message);
      }
    });
  };

  return (
    <div className="admin-content-inner" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={26} color="#d97706" />
            <span>Informasi & Linimasa Kegiatan Pesantren</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Publikasikan dokumentasi kegiatan harian santri, pengumuman liburan, dan agenda ke linimasa wali santri
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchFeed}
            className="btn-refresh" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <RotateCw size={15} /> Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#d97706', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} /> Buat Postingan Baru
          </button>
        </div>
      </div>

      {/* Filter Kategori Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {kategoriList.map(kat => (
          <button
            key={kat}
            onClick={() => setSelectedKategori(kat)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: selectedKategori === kat ? '1px solid #d97706' : '1px solid #e2e8f0',
              background: selectedKategori === kat ? '#fef3c7' : '#fff',
              color: selectedKategori === kat ? '#b45309' : '#64748b',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Feed Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {feed.map(post => (
          <div 
            key={post.id}
            style={{
              background: '#fff',
              borderRadius: '16px',
              border: post.is_pinned ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
              position: 'relative'
            }}
          >
            {post.is_pinned === 1 && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#f59e0b',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                <Pin size={12} /> PINNED
              </div>
            )}

            {/* Photo Preview if available */}
            {post.foto_url ? (
              <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#f1f5f9' }}>
                <img 
                  src={post.foto_url} 
                  alt={post.judul} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image size={32} color="#ffffff88" />
              </div>
            )}

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {post.kategori}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  {new Date(post.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
                {post.judul}
              </h3>

              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5, flex: 1 }}>
                {post.konten}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> {post.penulis || 'Humas'}
                </span>
                <button
                  onClick={() => handleHapus(post.id)}
                  style={{ background: '#fef2f2', border: 'none', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600 }}
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}

        {feed.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
            Belum ada postingan informasi kegiatan. Klik "Buat Postingan Baru" untuk menerbitkan berita.
          </div>
        )}
      </div>

      {/* MODAL BUAT POSTINGAN */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px 20px', background: '#d97706', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>Buat Postingan Informasi Pesantren</div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Judul Informasi / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Khotmil Qur'an & Tasmi' Bil-Ghoib 30 Juz"
                  value={formPost.judul}
                  onChange={(e) => setFormPost({ ...formPost, judul: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Kategori Informasi *
                  </label>
                  <select
                    value={formPost.kategori}
                    onChange={(e) => setFormPost({ ...formPost, kategori: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Kegiatan Santri">Kegiatan Santri</option>
                    <option value="Pengajian & Ibadah">Pengajian & Ibadah</option>
                    <option value="Pengumuman Liburan">Pengumuman Liburan</option>
                    <option value="Administrasi">Administrasi</option>
                    <option value="Prestasi Santri">Prestasi Santri</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Tanggal Publikasi
                  </label>
                  <input
                    type="date"
                    value={formPost.tanggal_publikasi}
                    onChange={(e) => setFormPost({ ...formPost, tanggal_publikasi: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  URL Foto Dokumentasi (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/foto-kegiatan.jpg"
                  value={formPost.foto_url}
                  onChange={(e) => setFormPost({ ...formPost, foto_url: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Isi Konten / Deskripsi Lengkap *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan detail berita, agenda kegiatan, atau informasi penting untuk wali santri..."
                  value={formPost.konten}
                  onChange={(e) => setFormPost({ ...formPost, konten: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="chk-pin"
                  checked={formPost.is_pinned}
                  onChange={(e) => setFormPost({ ...formPost, is_pinned: e.target.checked })}
                />
                <label htmlFor="chk-pin" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  Sematkan di paling atas (Pin to top)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#d97706', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Postingan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

