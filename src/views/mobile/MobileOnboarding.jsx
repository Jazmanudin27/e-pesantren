import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Wifi, 
  Battery, 
  Signal, 
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
  const [currentTime, setCurrentTime] = useState('');
  const [showPendaftaranModal, setShowPendaftaranModal] = useState(false);

  // Update real-time clock for mobile status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      minHeight: '100vh',
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
        maxHeight: '932px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
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
          backgroundPosition: 'center 22%',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }} />

        {/* Subtle Dark Vignette & Top Gradient for Status Bar Legibility */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '140px',
          background: 'linear-gradient(to bottom, rgba(2, 21, 31, 0.65) 0%, rgba(2, 21, 31, 0.25) 55%, transparent 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* BOTTOM GRADIENT OVERLAY (Matching user screenshot style: deep gradient starting from santri waist down) */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62%',
          background: 'linear-gradient(to bottom, rgba(2, 21, 31, 0) 0%, rgba(2, 25, 37, 0.42) 20%, rgba(2, 28, 42, 0.88) 45%, #021a27 75%, #01121b 100%)',
          zIndex: 2,
          pointerEvents: 'none'
        }} />

        {/* ----------------- TOP BAR SECTION ----------------- */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '12px 18px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Simulated Mobile Status Bar (Time, Camera Notch, Wifi/Battery) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 700,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            padding: '2px 4px'
          }}>
            <span>{currentTime || '15:58'}</span>
            
            {/* Camera Punch-hole */}
            <div style={{
              width: '12px',
              height: '12px',
              background: '#000000',
              borderRadius: '50%',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.15)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Signal size={14} />
              <Wifi size={14} />
              <Battery size={16} />
            </div>
          </div>

          {/* Header Badges: Brand Pill (Left) & Status Badge (Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '4px'
          }}>
            {/* Left Brand Badge */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '6px 14px 6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}>
              <img 
                src="/logo.png" 
                alt="Logo Ponpes" 
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  objectFit: 'contain' 
                }} 
              />
              <span style={{
                color: '#064e3b',
                fontWeight: 900,
                fontSize: '0.78rem',
                letterSpacing: '0.04em'
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
              padding: '6px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }} />
              <span style={{
                color: '#e2e8f0',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.03em'
              }}>
                PP. NURUL WAFA
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- CENTER FLOATING CHIP ----------------- */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 'auto',
          marginBottom: '16px'
        }}>
          <div style={{
            background: 'rgba(6, 78, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(52, 211, 153, 0.45)',
            borderRadius: '999px',
            padding: '7px 18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            <Sparkles size={15} color="#34d399" />
            <span style={{
              color: '#ffffff',
              fontSize: '0.76rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              Santri Berakhlak & Terampil Digital
            </span>
          </div>
        </div>

        {/* ----------------- BOTTOM CONTENT SHEET ----------------- */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          padding: '0 24px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          {/* Main Headline */}
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.22,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.65)'
          }}>
            Melaju Lebih Percaya Diri Bersama Santri
          </h1>

          {/* Subtitle / Tagline */}
          <div style={{
            color: '#34d399',
            fontSize: '0.92rem',
            fontWeight: 800,
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <GraduationCap size={18} color="#34d399" />
            <span>Pendidikan Terpadu & Kualitas Terbaik</span>
          </div>

          {/* Description Paragraph */}
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            color: '#cbd5e1',
            lineHeight: 1.55,
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)'
          }}>
            Rasakan ekosistem digital pesantren terdepan. Pantau presensi santri, setoran tahfidz Qur'an, mutaba'ah asrama, dan syahriah dengan mudah, transparan, dan terpercaya.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {/* Big Primary Button ("Mulai Sekarang ->") */}
            <button
              id="btn-onboarding-start"
              onClick={onStart}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#064e3b',
                border: 'none',
                padding: '15px 22px',
                borderRadius: '999px',
                fontSize: '0.98rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -4px rgba(255, 255, 255, 0.35), 0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -4px rgba(255, 255, 255, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(255, 255, 255, 0.35)';
              }}
            >
              <span>Mulai Sekarang</span>
              <ArrowRight size={19} color="#064e3b" strokeWidth={3} />
            </button>

            {/* Quick Secondary Links */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '4px'
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
                  padding: '10px 8px',
                  borderRadius: '14px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s ease'
                }}
              >
                <HeartHandshake size={14} color="#6ee7b7" />
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
                  padding: '10px 8px',
                  borderRadius: '14px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
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
