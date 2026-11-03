import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  HeartHandshake, 
  GraduationCap,
  X,
  PhoneCall,
  Info,
  CheckCircle2
} from 'lucide-react';

export default function MobileOnboarding({ onStart, onOpenWali }) {
  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100dvh',
      background: '#02151f',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Mobile Device Frame Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '430px',
        height: '100%',
        maxHeight: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#02151f'
      }}>
        {/* Fullscreen Hero Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/onboarding-santri.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 6%',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }} />

        {/* Subtle Dark Vignette & Top Gradient for Status Bar Legibility */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(to bottom, rgba(2, 21, 31, 0.6) 0%, rgba(2, 21, 31, 0.1) 60%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* BOTTOM GRADIENT OVERLAY (Hanya di bagian bawah agar wajah & karakter santri tidak tertutup) */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '42%',
          background: 'linear-gradient(to bottom, rgba(2, 21, 31, 0) 0%, rgba(2, 25, 37, 0.45) 25%, rgba(2, 28, 42, 0.92) 55%, #021a27 80%, #01121b 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* ----------------- TOP BAR SECTION ----------------- */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '12px 16px 0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header Badges: Brand Pill (Left) & Status Badge (Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Left Brand Badge */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '5px 12px 5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}>
              <img 
                src="/logo.png" 
                alt="Logo Ponpes" 
                style={{ 
                  width: '22px', 
                  height: '22px', 
                  objectFit: 'contain' 
                }} 
              />
              <span style={{
                color: '#064e3b',
                fontWeight: 900,
                fontSize: '0.74rem',
                letterSpacing: '0.03em'
              }}>
                RUANG PONPES
              </span>
            </div>

            {/* Right Status Pill */}
            <div style={{
              background: 'rgba(9, 38, 59, 0.72)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '999px',
              padding: '5px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }} />
              <span style={{
                color: '#e2e8f0',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.03em'
              }}>
                PP. NURUL WAFA
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- BOTTOM CONTENT SHEET ----------------- */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          boxSizing: 'border-box'
        }}>
          {/* Tag Pill */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(6, 78, 59, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(52, 211, 153, 0.45)',
              borderRadius: '999px',
              padding: '2px 9px',
              color: '#34d399',
              fontSize: '0.64rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={11} color="#34d399" />
              <span>Santri Berakhlak & Terampil Digital</span>
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)'
          }}>
            Tumbuh Percaya Diri Bersama Santri
          </h1>

          {/* Subtitle / Tagline */}
          <div style={{
            color: '#6ee7b7',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <GraduationCap size={13} color="#34d399" />
            <span>Pendidikan Terpadu & Kualitas Terbaik</span>
          </div>

          {/* Description Paragraph */}
          <p style={{
            margin: '0 0 2px 0',
            fontSize: '0.68rem',
            color: '#cbd5e1',
            lineHeight: 1.35,
            fontWeight: 500,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)'
          }}>
            Pantau presensi santri, setoran tahfidz Qur'an, mutaba'ah asrama, dan syahriah dengan mudah & transparan.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Big Primary Button ("Mulai Sekarang ->") */}
            <button
              id="btn-onboarding-start"
              onClick={onStart}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#064e3b',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '999px',
                fontSize: '0.86rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 6px 16px -2px rgba(255, 255, 255, 0.35)',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 20px -2px rgba(255, 255, 255, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(255, 255, 255, 0.35)';
              }}
            >
              <span>Mulai Sekarang</span>
              <ArrowRight size={16} color="#064e3b" strokeWidth={3} />
            </button>

            {/* Quick Secondary Links */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}>
              {/* Button Portal Wali */}
              <button
                type="button"
                onClick={onOpenWali}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '7px 6px',
                  borderRadius: '11px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'background 0.2s ease'
                }}
              >
                <HeartHandshake size={13} color="#6ee7b7" />
                <span>Portal Orang Tua</span>
              </button>

              {/* Button Info Pendaftaran / Santri Baru */}
              <button
                type="button"
                onClick={() => setShowPendaftaranModal(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '7px 6px',
                  borderRadius: '11px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'background 0.2s ease'
                }}
              >
                <BookOpen size={14} color="#93c5fd" />
                <span>Daftar / Info Santri</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL INFO PENDAFTARAN / SANTRI ----------------- */}
      {showPendaftaranModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px 20px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowPendaftaranModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px'
              }}>
                <GraduationCap size={30} />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Pendaftaran & Akun Santri
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                PP. Nurul Wafa Sukarame Tasikmalaya
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Akun Santri & Asatidz:</strong>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Diberikan langsung oleh Sekretariat Ponpes. Gunakan NIS santri atau username dari Admin.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Pendaftaran Santri Baru (PSB):</strong>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Pendaftaran tahun ajaran baru dibuka secara online melalui sekretariat ponpes.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowPendaftaranModal(false);
                  onStart();
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Lanjut ke Halaman Login
              </button>

              <button
                onClick={() => setShowPendaftaranModal(false)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
