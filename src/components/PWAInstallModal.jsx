import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check, MoreVertical, ShieldCheck, Zap, Bell } from 'lucide-react';

export default function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => (typeof window !== 'undefined' ? window.__deferredPwaPrompt || null : null));
  const [isInstallable, setIsInstallable] = useState(() => Boolean(typeof window !== 'undefined' && window.__deferredPwaPrompt));
  const [isIOS, setIsIOS] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showChromeManualGuide, setShowChromeManualGuide] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah running dalam mode standalone / sudah diinstall sebagai aplikasi
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 2. Deteksi device iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 3. Sinkronisasi prompt yang mungkin sudah tertangkap di index.html sebelum React mount
    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
      setIsInstallable(true);
    }

    const openModalAutomatically = (delayMs = 1300) => {
      setTimeout(() => {
        if (!checkStandalone()) {
          setIsOpen(true);
        }
      }, delayMs);
    };

    // 4. Listener untuk Android / Chrome PWA prompt
    const handleBeforeInstallPrompt = (e) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      const promptEvent = e?.detail || e;
      if (promptEvent && typeof promptEvent.prompt === 'function') {
        window.__deferredPwaPrompt = promptEvent;
        setDeferredPrompt(promptEvent);
        setIsInstallable(true);
        setShowChromeManualGuide(false);
      }
      openModalAutomatically(800);
    };

    const handleInstalled = () => {
      window.__deferredPwaPrompt = null;
      setIsInstallable(false);
      setIsOpen(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pwa-app-installed', handleInstalled);

    // 5. Selalu tampilkan modal otomatis saat buka link di Chrome / Safari (setelah SplashScreen selesai)
    openModalAutomatically(1350);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pwa-app-installed', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPwaPrompt : null);
    if (activePrompt && typeof activePrompt.prompt === 'function') {
      try {
        activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          window.__deferredPwaPrompt = null;
          setIsInstallable(false);
          setIsOpen(false);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('PWA Install error:', err);
      }
    }
    // Jika Chrome belum mengirim event beforeinstallprompt (misal kena cooldown atau browser in-app), tampilkan panduan 1-2-3 Chrome
    setShowChromeManualGuide(true);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setShowChromeManualGuide(false);
    sessionStorage.setItem('nwf_pwa_dismissed_v2', 'true');
  };

  // Jangan render jika sudah standalone (sudah dibuka via aplikasi terinstall)
  if (isStandalone) return null;

  return (
    <>
      {/* FLOATING ACTION PILL ELEGAN DI POJOK KANAN ATAS (SAAT MODAL DITUTUP) */}
      {!isOpen && (
        <button
          onClick={() => {
            setShowChromeManualGuide(false);
            setIsOpen(true);
          }}
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 9998,
            background: 'linear-gradient(135deg, #064e3b 0%, #0d766e 55%, #059669 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(167, 243, 208, 0.55)',
            boxShadow: '0 6px 20px rgba(6, 78, 59, 0.42), 0 0 0 3px rgba(16, 185, 129, 0.14)',
            padding: '5px 12px 5px 6px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          {/* Mini Icon Badge Proporsional (Tidak Kepotong) */}
          <span
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3.5px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
              flexShrink: 0
            }}
          >
            <img
              src="/nwf.png"
              alt="NWF"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </span>
          <span>Install Aplikasi</span>
          <Download size={12} strokeWidth={2.8} color="#a7f3d0" />
        </button>
      )}

      {/* POPUP MODAL INSTALL APLIKASI (DESAIN LUXURY EMERALD & PROPORSIONAL) */}
      {isOpen && (
        <div
          onClick={handleDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            animation: 'pwaFadeIn 0.22s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '390px',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(2, 44, 34, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
              position: 'relative',
              animation: 'pwaPopUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* TOP LUXURY EMERALD BANNER */}
            <div
              style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #0d766e 52%, #059669 100%)',
                padding: '22px 20px 20px',
                position: 'relative',
                overflow: 'hidden',
                color: '#ffffff'
              }}
            >
              {/* Decorative Radial Glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-45px',
                  right: '-35px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(167, 243, 208, 0.26) 0%, rgba(167, 243, 208, 0) 70%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Tombol Tutup X */}
              <button
                onClick={handleDismiss}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Tutup"
              >
                <X size={15} />
              </button>

              {/* App Icon Frame + Brand Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 2 }}>
                {/* Double-Layered Luxury Squircle Icon (Logo Proporsional, Tidak Terlalu Besar & Tidak Ketutup) */}
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(167,243,208,0.15) 100%)',
                    border: '1.5px solid rgba(255, 255, 255, 0.45)',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 24px rgba(2, 44, 34, 0.35)',
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '14px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '9px',
                      boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.18), 0 4px 10px rgba(0, 0, 0, 0.12)',
                      boxSizing: 'border-box'
                    }}
                  >
                    <img
                      src="/nwf.png"
                      alt="NWF Mobile Icon"
                      style={{
                        width: '36px',
                        height: '36px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  </div>
                </div>

                {/* App Title & Verified Badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '1.18rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '-0.3px',
                        lineHeight: 1.15
                      }}
                    >
                      NWF Mobile
                    </span>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        color: '#064e3b',
                        background: 'linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%)',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}
                    >
                      <ShieldCheck size={10} strokeWidth={2.8} /> Resmi
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.88)',
                      marginTop: '3px'
                    }}
                  >
                    Pondok Pesantren Nurul Wafa
                  </div>

                  {/* Mini App Store Rating & Size Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '7px',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#d1fae5'
                    }}
                  >
                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: '6px' }}>
                      ★ 5.0
                    </span>
                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: '6px' }}>
                      Ringan &amp; Cepat
                    </span>
                    <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 7px', borderRadius: '6px' }}>
                      Android &amp; iOS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '18px 18px 20px' }}>
              {/* 3 Highlight Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Smartphone size={14} />
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#064e3b' }}>Layar Penuh</div>
                  <div style={{ fontSize: '0.58rem', color: '#15803d', lineHeight: 1.2 }}>Tanpa bar URL browser</div>
                </div>

                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Zap size={14} />
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1e3a8a' }}>Akses 1-Klik</div>
                  <div style={{ fontSize: '0.58rem', color: '#1d4ed8', lineHeight: 1.2 }}>Tampil di menu utama HP</div>
                </div>

                <div
                  style={{
                    background: '#fefce8',
                    border: '1px solid #fde047',
                    borderRadius: '14px',
                    padding: '10px 8px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Bell size={14} />
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#78350f' }}>Real-Time</div>
                  <div style={{ fontSize: '0.58rem', color: '#b45309', lineHeight: 1.2 }}>Update info &amp; presensi</div>
                </div>
              </div>

              {/* KONTEN INSTALL: ANDROID / CHROME */}
              {!isIOS ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!showChromeManualGuide ? (
                    <button
                      onClick={handleInstallClick}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #059669 0%, #0d766e 50%, #047857 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '13px 16px',
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.5)',
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={17} strokeWidth={2.5} />
                      <span>Pasang Aplikasi Sekarang</span>
                    </button>
                  ) : (
                    /* PANDUAN LANGSUNG CHROME JIKA PROMPT OTOMATIS BELUM TERSEDIA */
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '16px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '9px'
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="#059669" /> Cara Install Cepat di Google Chrome:
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>1</span>
                        <span>
                          Ketuk ikon <strong>Titik Tiga</strong> (<MoreVertical size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />) di pojok kanan atas Chrome.
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>2</span>
                        <span>
                          Pilih menu <strong>"Install aplikasi"</strong> atau <strong>"Tambahkan ke Layar utama"</strong>.
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>3</span>
                        <span>
                          Ketuk <strong>"Install"</strong> — ikon NWF Mobile siap di layar HP Anda!
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleDismiss}
                    style={{
                      width: '100%',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {showChromeManualGuide ? 'Mengerti, Tutup Panduan' : 'Nanti Saja (Lanjut di Browser)'}
                  </button>
                </div>
              ) : (
                /* KONTEN PANDUAN: IPHONE / IOS (SAFARI) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                      Cara Pasang di iPhone / iPad (Safari):
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>1</span>
                      <span>
                        Ketuk tombol <strong>Bagikan / Share</strong> (<Share size={12} style={{ display: 'inline' }} />) di bilah bawah Safari.
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>2</span>
                      <span>
                        Pilih <strong>"Tambahkan ke Layar Utama"</strong> (<PlusSquare size={12} style={{ display: 'inline' }} />).
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.72rem', color: '#334155' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.68rem', flexShrink: 0 }}>3</span>
                      <span>
                        Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Selesai!
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleDismiss}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '11px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Saya Mengerti
                  </button>
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes pwaFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes pwaPopUp {
              from { opacity: 0; transform: translateY(18px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
