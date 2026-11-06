import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, 
  RotateCw, 
  Search, 
  Pin, 
  Calendar, 
  Share2, 
  ArrowLeft,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock
} from 'lucide-react';

// Tema warna & ikon per kategori kegiatan
const KATEGORI_THEME = {
  pengajian:       { emoji: '📖', grad: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', soft: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  tahfidz:         { emoji: '🕌', grad: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', soft: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  ibadah:          { emoji: '🤲', grad: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)', soft: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
  ekstrakurikuler: { emoji: '🏆', grad: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)', soft: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  pengumuman:      { emoji: '📢', grad: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)', soft: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  libur:           { emoji: '🏖️', grad: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)', soft: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
  kesehatan:       { emoji: '🩺', grad: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)', soft: '#fff1f2', text: '#be123c', border: '#fecdd3' },
  default:         { emoji: '✨', grad: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)', soft: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }
};

const getTheme = (kategori = '') => {
  const k = String(kategori).toLowerCase();
  if (k.includes('ngaji') || k.includes('kitab') || k.includes('kajian')) return KATEGORI_THEME.pengajian;
  if (k.includes('tahfidz') || k.includes('quran') || k.includes('qur')) return KATEGORI_THEME.tahfidz;
  if (k.includes('ibadah') || k.includes('sholat') || k.includes('shalat')) return KATEGORI_THEME.ibadah;
  if (k.includes('ekstra') || k.includes('lomba') || k.includes('olahraga')) return KATEGORI_THEME.ekstrakurikuler;
  if (k.includes('umum') || k.includes('info')) return KATEGORI_THEME.pengumuman;
  if (k.includes('libur') || k.includes('pulang')) return KATEGORI_THEME.libur;
  if (k.includes('sehat') || k.includes('klinik')) return KATEGORI_THEME.kesehatan;
  return KATEGORI_THEME.default;
};

const getFoto = (post) => post.foto_url || post.lampiran_url || '';

const formatTanggal = (tgl) => {
  if (!tgl) return '-';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return String(tgl);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatRelatif = (tgl) => {
  if (!tgl) return '';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const menit = Math.floor(diffMs / 60000);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return formatTanggal(tgl);
};

export default function TabInformasiKegiatan({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/informasi-kegiatan/feed?kategori=${encodeURIComponent(selectedKategori)}&search=${encodeURIComponent(searchQuery)}`);
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

  const pinnedPosts = feed.filter(p => Number(p.is_pinned) === 1);
  const regularPosts = feed.filter(p => Number(p.is_pinned) !== 1);
  const featured = pinnedPosts[0] || null;
  const otherPinned = pinnedPosts.slice(1);
  const listPosts = [...otherPinned, ...regularPosts];

  const totalFoto = feed.filter(p => getFoto(p)).length;
  const postMingguIni = feed.filter(p => {
    const d = new Date(p.tanggal_publikasi);
    return !isNaN(d.getTime()) && (Date.now() - d.getTime()) < 7 * 24 * 3600 * 1000;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      
      {/* ================= HEADER ================= */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 22px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-14px', fontSize: '6rem', opacity: 0.08, pointerEvents: 'none', userSelect: 'none' }}>
          🕌
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', position: 'relative' }}>
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
                Kegiatan Pesantren
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '2px' }}>
                Dokumentasi harian & pengumuman pondok
              </div>
            </div>
          </div>

          <button 
            onClick={fetchFeed}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Segarkan"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Mini Stats Glass */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.18)',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '8px',
          borderRadius: '14px',
          marginBottom: '12px',
          position: 'relative'
        }}>
          {[
            { val: feed.length, label: 'Postingan', color: '#ffffff' },
            { val: postMingguIni, label: 'Minggu Ini', color: '#fde68a' },
            { val: totalFoto, label: 'Dokumentasi', color: '#a7f3d0' }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.78)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Cari kegiatan, pengumuman, libur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 36px 10px 36px',
              borderRadius: '12px',
              border: 'none',
              background: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setTimeout(fetchFeed, 0); }}
              style={{ position: 'absolute', right: '8px', top: '7px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={13} />
            </button>
          )}
        </form>
      </div>

      {/* ================= KATEGORI PILLS ================= */}
      <div style={{ padding: '14px 16px 2px', display: 'flex', gap: '7px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {kategoriList.map(kat => {
          const isActive = selectedKategori === kat;
          const th = kat === 'Semua' ? { emoji: '📋', text: '#047857', soft: '#ecfdf5', border: '#059669' } : getTheme(kat);
          return (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              style={{
                padding: '7px 13px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 800,
                border: isActive ? `1.5px solid ${th.text}` : '1px solid #e2e8f0',
                background: isActive ? th.soft : '#ffffff',
                color: isActive ? th.text : '#64748b',
                boxShadow: isActive ? '0 3px 10px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{th.emoji}</span>
              <span>{kat}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ================= SKELETON LOADING ================= */}
        {loading && feed.length === 0 && [1, 2].map(i => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ height: '150px', background: 'linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)' }} />
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '12px', width: '40%', background: '#e2e8f0', borderRadius: '6px' }} />
              <div style={{ height: '14px', width: '85%', background: '#e2e8f0', borderRadius: '6px' }} />
              <div style={{ height: '10px', width: '70%', background: '#f1f5f9', borderRadius: '6px' }} />
            </div>
          </div>
        ))}

        {/* ================= FEATURED / PINNED HERO ================= */}
        {featured && (() => {
          const th = getTheme(featured.kategori);
          const foto = getFoto(featured);
          return (
            <div
              onClick={() => setExpandedId(expandedId === featured.id ? null : featured.id)}
              style={{
                position: 'relative',
                borderRadius: '22px',
                overflow: 'hidden',
                minHeight: '210px',
                background: foto ? `url(${foto}) center/cover no-repeat` : th.grad,
                boxShadow: '0 12px 28px -6px rgba(15, 23, 42, 0.35)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}
            >
              {!foto && (
                <div style={{ position: 'absolute', right: '-6px', top: '-10px', fontSize: '7rem', opacity: 0.14, pointerEvents: 'none' }}>
                  {th.emoji}
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.85) 100%)' }} />

              {/* Badges */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.64rem', fontWeight: 900, padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(245, 158, 11, 0.5)' }}>
                  <Pin size={11} /> SOROTAN UTAMA
                </span>
                <span style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)', color: '#ffffff', fontSize: '0.64rem', fontWeight: 800, padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.3)' }}>
                  {th.emoji} {featured.kategori || 'Kegiatan'}
                </span>
              </div>

              <div style={{ position: 'relative', padding: '16px', color: '#ffffff' }}>
                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, margin: 0, lineHeight: 1.3, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {featured.judul}
                </h3>
                <p style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.88)',
                  margin: '6px 0 10px',
                  lineHeight: 1.5,
                  ...(expandedId === featured.id ? {} : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' })
                }}>
                  {featured.konten}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {formatRelatif(featured.tanggal_publikasi)} • {featured.penulis || 'Humas Pesantren'}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(featured); }}
                    style={{ background: '#25d366', border: 'none', color: '#ffffff', padding: '6px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 3px 10px rgba(37, 211, 102, 0.45)' }}
                  >
                    <Share2 size={12} /> Bagikan
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================= SECTION LABEL ================= */}
        {listPosts.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', marginTop: featured ? '2px' : 0 }}>
            <span style={{ width: '4px', height: '15px', background: '#059669', borderRadius: '4px' }} />
            Linimasa Terbaru
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>{listPosts.length} postingan</span>
          </div>
        )}

        {/* ================= FEED CARDS ================= */}
        {listPosts.map(post => {
          const th = getTheme(post.kategori);
          const foto = getFoto(post);
          const isExpanded = expandedId === post.id;
          const isLong = String(post.konten || '').length > 140;
          const isPinned = Number(post.is_pinned) === 1;

          return (
            <div
              key={post.id}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: isPinned ? '1.5px solid #fbbf24' : '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 6px 18px -6px rgba(15, 23, 42, 0.12)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Visual Banner */}
              <div
                onClick={() => foto && setPreviewImg(foto)}
                style={{
                  position: 'relative',
                  height: foto ? '180px' : '92px',
                  background: foto ? `url(${foto}) center/cover no-repeat` : th.grad,
                  cursor: foto ? 'zoom-in' : 'default',
                  overflow: 'hidden'
                }}
              >
                {!foto && (
                  <>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '3.6rem', opacity: 0.22 }}>
                      {th.emoji}
                    </div>
                    <Sparkles size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', right: '78px', top: '14px' }} />
                  </>
                )}
                {foto && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />}

                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                  <span style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', color: '#ffffff', fontSize: '0.64rem', fontWeight: 800, padding: '4px 9px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.25)' }}>
                    {th.emoji} {post.kategori || 'Kegiatan'}
                  </span>
                  {isPinned && (
                    <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.62rem', fontWeight: 900, padding: '4px 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Pin size={10} /> PIN
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '13px 14px 12px' }}>
                {/* Author Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px',
                    flexShrink: 0
                  }}>
                    <img src="/nwf.png" alt="NWF" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
                      {post.penulis || 'Humas Pesantren'}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={10} /> {formatTanggal(post.tanggal_publikasi)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: th.text, background: th.soft, border: `1px solid ${th.border}`, padding: '2px 7px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                    {formatRelatif(post.tanggal_publikasi)}
                  </span>
                </div>

                <h3 style={{ fontSize: '0.96rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.35, letterSpacing: '-0.2px' }}>
                  {post.judul}
                </h3>

                <p style={{
                  fontSize: '0.8rem',
                  color: '#475569',
                  lineHeight: 1.55,
                  margin: 0,
                  whiteSpace: 'pre-line',
                  ...(isExpanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' })
                }}>
                  {post.konten}
                </p>

                {isLong && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    style={{ background: 'none', border: 'none', padding: 0, marginTop: '6px', color: th.text, fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    {isExpanded ? <>Tutup <ChevronUp size={13} /></> : <>Baca selengkapnya <ChevronDown size={13} /></>}
                  </button>
                )}

                {/* Action Bar */}
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '11px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 600 }}>
                    Info resmi Pondok Pesantren
                  </span>
                  <button
                    onClick={() => handleShare(post)}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '6px 11px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <Share2 size={12} /> Bagikan WA
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* ================= EMPTY STATE ================= */}
        {!loading && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '2rem' }}>
              🕌
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
              {searchQuery ? 'Tidak Ada Hasil Pencarian' : 'Belum Ada Kegiatan'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>
              {searchQuery
                ? `Kegiatan dengan kata kunci "${searchQuery}" tidak ditemukan.`
                : 'Dokumentasi agenda & kegiatan santri akan dipublikasikan di sini.'}
            </div>
            {(searchQuery || selectedKategori !== 'Semua') && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedKategori('Semua'); setTimeout(fetchFeed, 0); }}
                style={{ marginTop: '12px', background: '#059669', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Tampilkan Semua Kegiatan
              </button>
            )}
          </div>
        )}
      </div>

      {/* ================= IMAGE PREVIEW (LIGHTBOX) ================= */}
      {previewImg && (
        <div
          onClick={() => setPreviewImg(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <button
            onClick={() => setPreviewImg(null)}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
          <img src={previewImg} alt="Dokumentasi" style={{ maxWidth: '100%', maxHeight: '88vh', borderRadius: '14px', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
