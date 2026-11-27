import React, { useState } from 'react';
import axios from 'axios';
import { 
  Wrench, 
  RotateCw, 
  AlertTriangle, 
  Clock, 
  LogOut, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquare,
  Building
} from 'lucide-react';

export default function MaintenanceScreen({ 
  roleKey = 'wali',
  roleName = 'Orang Tua / Wali Santri',
  message,
  estimatedTime,
  onRefresh,
  onLogout 
}) {
  const [checking, setChecking] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  const defaultMsg = message || `Mohon maaf, layanan untuk ${roleName} saat ini sedang dalam pemeliharaan atau perbaikan sistem. Fitur sementara tidak dapat digunakan demi peningkatan kualitas layanan.`;

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      setStatusNotice(null);
      const res = await axios.get('/api/maintenance/status');
      if (res.data?.success && res.data.data) {
        const roleStatus = res.data.data[roleKey];
        if (!roleStatus || !roleStatus.is_maintenance) {
          setStatusNotice({
            type: 'success',
            text: 'Alhamdulillah, sistem sudah kembali normal! Memuat ulang halaman...'
          });
          setTimeout(() => {
            if (typeof onRefresh === 'function') {
              onRefresh();
            } else {
              window.location.reload();
            }
          }, 1200);
          return;
        } else {
          setStatusNotice({
            type: 'warning',
            text: 'Perbaikan sistem masih berlangsung. Silakan cek kembali beberapa saat lagi.'
          });
        }
      }
    } catch (e) {
      setStatusNotice({
        type: 'warning',
        text: 'Belum dapat terhubung ke server. Silakan coba kembali.'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLogoutAction = () => {
    if (typeof onLogout === 'function') {
      onLogout();
    } else {
      try {
        localStorage.removeItem('desktop_session');
        localStorage.removeItem('mobile_session');
        localStorage.removeItem('token');
        sessionStorage.clear();
      } catch (e) {}
      window.location.hash = '#login';
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Background Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.18) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '28px',
          padding: '28px 24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(12px)',
          boxSizing: 'border-box',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Animated Badge Icon Header */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            margin: '0 auto 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: '#fef2f2',
              border: '2px dashed #fca5a5',
              animation: 'spin 18s linear infinite'
            }}
          />
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 24px -4px rgba(239, 68, 68, 0.5)',
              position: 'relative',
              zIndex: 2
            }}
          >
            <Wrench size={32} strokeWidth={2.4} />
          </div>
        </div>

        {/* Pill Tag Status */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '4px 12px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
          Sistem Sedang Diperbaiki
        </div>

        {/* Title */}
        <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Pemeliharaan Layanan
        </h2>

        {/* Role Sub-badge */}
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: '8px', display: 'inline-block', marginBottom: '14px' }}>
          Role: {roleName}
        </div>

        {/* Message Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px 16px',
            color: '#334155',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            textAlign: 'left',
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} color="#d97706" /> Pemberitahuan Resmi:
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
            {defaultMsg}
          </p>
          {estimatedTime && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              <Clock size={13} color="#059669" />
              <span>Estimasi Selesai: <strong style={{ color: '#059669' }}>{estimatedTime}</strong></span>
            </div>
          )}
        </div>

        {/* Status Notice (Feedback saat klik tombol Cek) */}
        {statusNotice && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: statusNotice.type === 'success' ? '#ecfdf5' : '#fffbeb',
              color: statusNotice.type === 'success' ? '#065f46' : '#92400e',
              border: `1px solid ${statusNotice.type === 'success' ? '#a7f3d0' : '#fde68a'}`
            }}
          >
            {statusNotice.type === 'success' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: checking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(13, 148, 136, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCw size={16} className={checking ? 'animate-spin' : ''} />
            <span>{checking ? 'Memeriksa Status...' : 'Cek Status / Muat Ulang'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogoutAction}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '14px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={15} />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>

        {/* Footer Pesantren */}
        <div style={{ marginTop: '18px', fontSize: '0.7rem', color: '#94a3b8' }}>
          Pondok Pesantren Nurul Wafa • Sistem Terpadu
        </div>
      </div>
    </div>
  );
}
