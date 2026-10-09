import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Animate progress bar
    const p1 = setTimeout(() => setProgress(55), 250);
    const p2 = setTimeout(() => setProgress(90), 650);
    const p3 = setTimeout(() => setProgress(100), 1050);

    // Fade out
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1250);

    // Complete and remove
    const removeTimer = setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 1650);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(145deg, #0284c7 0%, #0369a1 35%, #064e3b 85%, #022c22 100%)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#ffffff',
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: fading ? 0 : 1,
      transform: fading ? 'scale(1.04)' : 'scale(1)',
      pointerEvents: fading ? 'none' : 'auto',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Decorative radial glows */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0) 70%)',
        top: '25%',
        pointerEvents: 'none'
      }} />

      {/* Main Center Box */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Animated Emblem Icon */}
        <div style={{
          width: '92px',
          height: '92px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '2.5px solid rgba(255, 255, 255, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 35px rgba(52, 211, 153, 0.3)',
          marginBottom: '22px',
          animation: 'splashPulse 2s ease-in-out infinite'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 18px rgba(0,0,0,0.2)'
          }}>
            <GraduationCap size={36} strokeWidth={2.4} />
          </div>
        </div>

        {/* Title & Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            E-Pesantren
          </h1>
          <span style={{
            background: '#f59e0b',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 900,
            padding: '3px 9px',
            borderRadius: '999px',
            boxShadow: '0 4px 10px rgba(245, 158, 11, 0.5)',
            letterSpacing: '0.05em'
          }}>
            PRO
          </span>
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '0.94rem',
          fontWeight: 700,
          color: '#a7f3d0',
          marginBottom: '4px',
          letterSpacing: '0.01em'
        }}>
          Pondok Pesantren Nurul Wafa
        </div>

        <p style={{
          margin: 0,
          fontSize: '0.76rem',
          color: '#cbd5e1',
          maxWidth: '260px',
          lineHeight: 1.4,
          marginBottom: '32px'
        }}>
          Sistem Informasi & Administrasi Terpadu
        </p>

        {/* Progress Bar Container */}
        <div style={{
          width: '200px',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.18)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '12px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #38bdf8 0%, #34d399 100%)',
            borderRadius: '999px',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 10px rgba(52, 211, 153, 0.8)'
          }} />
        </div>

        {/* Loading text */}
        <div style={{
          fontSize: '0.72rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={12} color="#34d399" />
          <span>Memuat sistem pesantren...</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        textAlign: 'center',
        fontSize: '0.68rem',
        color: '#64748b'
      }}>
        v2.6.0 &bull; Powered by Nurul Wafa Tech
      </div>

      <style>{`
        @keyframes splashPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4), 0 0 35px rgba(52, 211, 153, 0.3);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 24px 45px -8px rgba(0, 0, 0, 0.45), 0 0 45px rgba(52, 211, 153, 0.55);
          }
        }
      `}</style>
    </div>
  );
}
