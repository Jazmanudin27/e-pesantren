import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, Check } from 'lucide-react';

export default function PWAInstallModal() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah running dalam mode standalone / sudah diinstall
    const checkStandalone = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://') ||
        urlParams.get('source') === 'pwa';
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // 2. Deteksi device iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 3. Listener untuk Android / Chrome PWA prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Cek apakah user pernah dismiss di sesi ini
      const dismissed = sessionStorage.getItem('nwf_pwa_dismissed');
      if (!dismissed) {
        // Tampilkan modal setelah jeda 1.5 detik agar halaman selesai render
        setTimeout(() => setIsOpen(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Jika iOS dan belum standalone, tampilkan panduan setelah 2 detik
    if (isIOSDevice) {
      const dismissed = sessionStorage.getItem('nwf_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => setIsOpen(true), 2000);
      }
    }

    // Listener saat aplikasi sukses di-install
    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setIsOpen(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('PWA Install error:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('nwf_pwa_dismissed', 'true');
  };

  // Jangan render jika sudah standalone (sudah dibuka via aplikasi install)
  if (isStandalone) return null;

  return (
    <>
      {/* FLOATING ACTION PILL KECIL (JIKA MODAL DITUTUP SEMENTARA) */}
      {!isOpen && (isInstallable || isIOS) && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            top: '12px',
            right: '12px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 4px 16px rgba(5, 150, 105, 0.45)',
            padding: '6px 12px',
            borderRadius: '24px',
            fontSize: '0.72rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            animation: 'bounce 2s infinite'
          }}
        >
          <Download size={13} strokeWidth={2.8} />
          <span>Install Aplikasi</span>
        </button>
      )}

      {/* POPUP MODAL INSTALL APLIKASI */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '430px',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '24px 20px 28px',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Tombol Tutup X */}
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            {/* Header: Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                flexShrink: 0
              }}>
                <img 
                  src="/nwf.png" 
                  alt="NWF Logo" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
              </div>

              <div>
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  NWF Mobile
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '2px 6px',
                    borderRadius: '6px'
                  }}>
                    Resmi
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Pondok Pesantren Nurul Wafa
                </div>
              </div>
            </div>

            {/* Keunggulan Pasang Aplikasi */}
            <div style={{
              background: '#f0fdf4',
              borderRadius: '16px',
              border: '1px solid #bbf7d0',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#059669" /> Keuntungan Pasang Aplikasi di HP:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem', color: '#15803d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#16a34a" /> Layar penuh fullscreen seperti aplikasi native (tanpa bilah URL)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#16a34a" /> 1-Sentuhan buka langsung dari Layar Utama HP
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={13} color="#16a34a" /> Loading jauh lebih cepat & hemat kuota
                </div>
              </div>
            </div>

            {/* KONTEN INSTALL: JIKA ANDROID / CHROME */}
            {!isIOS ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleInstallClick}
                  disabled={!isInstallable && !deferredPrompt}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                    cursor: 'pointer'
                  }}
                >
                  <Download size={18} />
                  <span>Pasang Aplikasi Sekarang</span>
                </button>

                <button
                  onClick={handleDismiss}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#64748b',
                    border: 'none',
                    padding: '8px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Nanti Saja (Buka Lewat Web)
                </button>
              </div>
            ) : (
              /* KONTEN PANDUAN: JIKA PENGGUNA IPHONE / IOS (SAFARI) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                    Panduan Pasang di iPhone / iPad (Safari):
                  </div>

                  {/* Step 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: '#334155' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      flexShrink: 0,
                      fontSize: '0.74rem'
                    }}>
                      1
                    </div>
                    <div>
                      Ketuk tombol <strong>Bagikan / Share</strong> (<Share size={12} style={{ display: 'inline' }} />) di bilah bawah Safari.
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: '#334155' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      flexShrink: 0,
                      fontSize: '0.74rem'
                    }}>
                      2
                    </div>
                    <div>
                      Gulir ke bawah, pilih <strong>"Tambahkan ke Layar Utama"</strong> (<PlusSquare size={12} style={{ display: 'inline' }} /> <em>Add to Home Screen</em>).
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: '#334155' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      flexShrink: 0,
                      fontSize: '0.74rem'
                    }}>
                      3
                    </div>
                    <div>
                      Ketuk <strong>"Tambah"</strong> di pojok kanan atas. Selesai!
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Saya Mengerti
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

