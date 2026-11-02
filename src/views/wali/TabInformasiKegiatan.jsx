import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  RotateCw, 
  Search, 
  Pin, 
  Calendar, 
  User, 
  Share2, 
  ArrowLeft,
  Image,
  Tag
} from 'lucide-react';
import { toastSuccess } from '../../utils/alert.util';

export default function TabInformasiKegiatan({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/informasi-kegiatan/feed?kategori=${selectedKategori}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data?.success) {
        setFeed(res.data.data.feed || []);
        setKategoriList(res.data.data.kategoriList || ['Semua']);
      }
    } catch (err) {
      console.warn('Gagal memuat feed kegiatan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedKategori]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFeed();
  };

  const handleShare = (post) => {
    const text = `*${post.judul}*\n\n${post.konten}\n\n_Informasi resmi Pondok Pesantren Nurul Wafa (Ruang Ponpes)_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      
      {/* Top Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(217, 119, 6, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Informasi & Kegiatan
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#fef3c7', marginTop: '2px' }}>
                Dokumentasi Harian & Pengumuman Pesantren
              </div>
            </div>
          </div>

          <button 
            onClick={fetchFeed}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Cari kegiatan, pengumuman liburan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          />
        </form>
      </div>

      {/* Filter Kategori Chips */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {kategoriList.map(kat => (
          <button
            key={kat}
            onClick={() => setSelectedKategori(kat)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              border: selectedKategori === kat ? '1.5px solid #d97706' : '1px solid #e2e8f0',
              background: selectedKategori === kat ? '#fef3c7' : '#ffffff',
              color: selectedKategori === kat ? '#b45309' : '#64748b',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Linimasa Feed Postings */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {feed.map(post => (
          <div
            key={post.id}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: post.is_pinned === 1 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header Feed: Penulis & Tanggal */}
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  NW
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                    {post.penulis || 'Humas Pesantren'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {new Date(post.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {post.is_pinned === 1 && (
                <span style={{
                  background: '#fef3c7',
                  color: '#b45309',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Pin size={11} /> PINNED
                </span>
              )}
            </div>

            {/* Foto Kegiatan if available */}
            {post.foto_url && (
              <div style={{ width: '100%', height: '220px', overflow: 'hidden', background: '#f1f5f9' }}>
                <img
                  src={post.foto_url}
                  alt={post.judul}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Konten Linimasa */}
            <div style={{ padding: '16px' }}>
              <span style={{
                background: '#eff6ff',
                color: '#1e40af',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                {post.kategori}
              </span>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px', lineHeight: 1.35 }}>
                {post.judul}
              </h3>

              <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.55, margin: '0 0 14px' }}>
                {post.konten}
              </p>

              {/* Action Buttons: Bagikan via WhatsApp */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleShare(post)}
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Share2 size={13} /> Bagikan ke Keluarga (WhatsApp)
                </button>
              </div>
            </div>
          </div>
        ))}

        {feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <Bell size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>Belum Ada Postingan Informasi</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              Informasi agenda dan kegiatan santri akan dipublikasikan di sini.
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

