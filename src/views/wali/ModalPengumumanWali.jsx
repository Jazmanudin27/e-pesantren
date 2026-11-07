import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Pin,
  User,
  Sparkles
} from 'lucide-react';

export default function ModalPengumumanWali({
  isOpen,
  onClose,
  pengumumanList = [],
  onViewAll
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen || !Array.isArray(pengumumanList) || pengumumanList.length === 0) {
    return null;
  }

  const total = pengumumanList.length;
  const safeIndex = Math.min(currentIndex, total - 1);
  const item = pengumumanList[safeIndex] || pengumumanList[0];

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 42 && total > 1) {
      if (diff > 0) {
        // Geser ke kiri -> Slide berikutnya
        setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
      } else {
        // Geser ke kanan -> Slide sebelumnya
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const getHeaderGradient = (kat = '') => {
    const k = String(kat).toLowerCase();
    if (k.includes('libur') || k.includes('pulang')) {
      return 'linear-gradient(135deg, #b45309 0%, #d97706 55%, #f59e0b 100%)';
    }
    if (k.includes('jadwal')) {
      return 'linear-gradient(135deg, #0369a1 0%, #0284c7 55%, #0ea5e9 100%)';
    }
    if (k.includes('penting')) {
      return 'linear-gradient(135deg, #9f1239 0%, #e11d48 55%, #f43f5e 100%)';
    }
    return 'linear-gradient(135deg, #064e3b 0%, #0d766e 55%, #059669 100%)';
  };

  const formatTanggal = (tgl) => {
    if (!tgl) return '-';
    try {
      return new Date(tgl).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return String(tgl).slice(0, 10);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'rgba(15, 23, 42, 0.74)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        animation: 'pengumumanFadeIn 0.22s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '395px',
          borderRadius: '26px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.48), 0 0 0 1px rgba(255, 255, 255, 0.16)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
          userSelect: 'none',
          animation: 'pengumumanPopUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* TOP HEADER BANNER */}
        <div
          style={{
            background: getHeaderGradient(item.kategori),
            padding: '18px 18px 16px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {/* Decorative Circle */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-30px',
              width: '130px',
              height: '130px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none'
            }}
          />

          {/* Tombol Tutup X */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 30,
              width: '34px',
              height: '34px',
              padding: 0,
              lineHeight: 0,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Tutup Pengumuman"
            aria-label="Tutup Pengumuman"
          >
            <X size={16} strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
          </button>

          {/* Baris Identitas Pengumuman */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2, paddingRight: '36px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1.5px solid rgba(255, 255, 255, 0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 14px rgba(0, 0, 0, 0.16)'
              }}
            >
              <Megaphone size={23} color="#ffffff" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    background: 'rgba(255, 255, 255, 0.22)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {item.kategori || 'Pengumuman Resmi'}
                </span>

                {total > 1 && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: 'rgba(0, 0, 0, 0.26)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    {safeIndex + 1} / {total}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.96rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  marginTop: '4px',
                  lineHeight: 1.2
                }}
              >
                Papan Pengumuman Pesantren
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontWeight: 600,
                  marginTop: '1px'
                }}
              >
                Pondok Pesantren Nurul Wafa
              </div>
            </div>
          </div>
        </div>

        {/* GAMBAR BANNER PENGUMUMAN (OPSIONAL) */}
        {item.foto_url && (
          <div
            style={{
              width: '100%',
              maxHeight: '175px',
              overflow: 'hidden',
              background: '#f1f5f9',
              flexShrink: 0
            }}
          >
            <img
              src={item.foto_url}
              alt={item.judul}
              style={{ width: '100%', height: '175px', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* ISI KONTEN PENGUMUMAN (SCROLLABLE) */}
        <div
          style={{
            padding: '18px 18px 14px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Meta Tanggal Posting & Prioritas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '8px'
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Calendar size={12} color="#0d766e" />
              Diterbitkan: {formatTanggal(item.tanggal_publikasi)}
            </span>

            {Number(item.is_pinned) === 1 && (
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#b45309',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Pin size={10} /> PENTING
              </span>
            )}
          </div>

          {/* Judul Pengumuman */}
          <h3
            style={{
              fontSize: '1.04rem',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 10px',
              lineHeight: 1.35,
              letterSpacing: '-0.2px'
            }}
          >
            {item.judul}
          </h3>

          {/* Isi Pengumuman */}
          <div
            style={{
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px'
            }}
          >
            {item.konten}
          </div>

          {/* Info Penulis & Tanggal Berlaku */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '12px',
              fontSize: '0.68rem',
              color: '#64748b',
              fontWeight: 600
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} color="#0d766e" />
              {item.penulis || 'Humas Pondok Pesantren'}
            </span>

            {item.tgl_kadaluarsa && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#0d766e',
                  background: '#f0fdfa',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid #ccfbf1'
                }}
              >
                <Clock size={11} />
                Berlaku s/d {formatTanggal(item.tgl_kadaluarsa)}
              </span>
            )}
          </div>
        </div>

        {/* SLIDER CONTROLS & FOOTER */}
        <div
          style={{
            padding: '12px 18px 16px',
            borderTop: '1px solid #f1f5f9',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0
          }}
        >
          {/* Navigasi Geser jika Pengumuman > 1 */}
          {total > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={15} /> Sebelumnya
              </button>

              {/* Dots Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {pengumumanList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    style={{
                      width: idx === safeIndex ? '20px' : '7px',
                      height: '7px',
                      borderRadius: '999px',
                      border: 'none',
                      padding: 0,
                      background: idx === safeIndex ? '#0d766e' : '#cbd5e1',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                style={{
                  background: '#f0fdfa',
                  border: '1px solid #99f6e4',
                  color: '#0d766e',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                Selanjutnya <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Tombol Tutup / Mengerti */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0d766e 0%, #059669 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '11px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 6px 16px -3px rgba(13, 118, 110, 0.4)'
            }}
          >
            Tutup Pengumuman
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pengumumanFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pengumumanPopUp {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

