import React from 'react';
import { Sparkles } from 'lucide-react';

export default function MobileLoadingState({
  title = "Memuat Data...",
  subtitle = "Mohon tunggu sebentar, sistem sedang menyiapkan data...",
  iconColor = "#0284c7",
  cardCount = 3
}) {
  return (
    <div style={{
      padding: '24px 14px 40px',
      minHeight: '65vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Animated Center Card */}
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '26px 20px',
        maxWidth: '320px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Accent */}
        <div style={{
          position: 'absolute',
          top: '-25px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140px',
          height: '70px',
          background: `radial-gradient(circle, ${iconColor}22 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        {/* Spinner & Icon */}
        <div style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Rotating Ring */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${iconColor}20`,
            borderTopColor: iconColor,
            animation: 'spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite'
          }} />
          
          {/* Inner Badge */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: `${iconColor}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color={iconColor} style={{ animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Texts */}
        <h4 style={{
          margin: '0 0 5px',
          fontSize: '0.94rem',
          fontWeight: 800,
          color: '#0f172a'
        }}>
          {title}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.74rem',
          color: '#64748b',
          lineHeight: 1.4
        }}>
          {subtitle}
        </p>

        {/* Live Pulse Bar */}
        <div style={{
          marginTop: '16px',
          width: '100%',
          height: '4px',
          background: '#f1f5f9',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            height: '100%',
            width: '45%',
            background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)`,
            borderRadius: '999px',
            animation: 'shimmer 1.3s ease-in-out infinite'
          }} />
        </div>
      </div>

      {/* Skeleton Preview Cards beneath */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        marginTop: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: 0.55
      }}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#e2e8f0',
              animation: 'pulse 1.2s ease-in-out infinite'
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                height: '12px',
                width: i === 0 ? '60%' : i === 1 ? '75%' : '50%',
                background: '#e2e8f0',
                borderRadius: '6px',
                animation: 'pulse 1.2s ease-in-out infinite'
              }} />
              <div style={{
                height: '9px',
                width: '35%',
                background: '#f1f5f9',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Global Keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { left: -45%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

