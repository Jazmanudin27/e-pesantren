import React, { useState } from 'react';
import axios from 'axios';
import { 
  Building, 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  GraduationCap, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

export default function LoginAdmin({ onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('admin'); // 'admin' | 'ustadz'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanU = username.trim();
    const cleanP = password.trim();

    if (!cleanU || !cleanP) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/login', {
        username: cleanU,
        password: cleanP
      });

      if (res.data && res.data.success) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        const userObj = res.data.user || {};
        const sessionData = {
          token: res.data.token || 'tok_' + Date.now(),
          role: res.data.role || userObj.role || (roleTab === 'ustadz' ? 'asatidz' : 'admin'),
          userType: res.data.userType || userObj.userType || (roleTab === 'ustadz' ? 'Ustadz / Guru' : 'Administrator'),
          nama: res.data.nama || userObj.nama_asatidz || userObj.nama || cleanU,
          username: cleanU,
          loginTime: new Date().toISOString()
        };

        if (rememberMe) {
          localStorage.setItem('desktop_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('desktop_session', JSON.stringify(sessionData));
        }

        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(sessionData);
        return;
      } else {
        setError(res.data?.error || res.data?.message || 'Gagal login. Kredensial tidak valid.');
        setLoading(false);
      }
    } catch (err) {
      const isNetwork = !err.response || err.code === 'ERR_NETWORK';
      
      // Standalone / offline fallback mode
      if (isNetwork) {
        const sessionData = {
          token: 'offline_desktop_token_' + Date.now(),
          role: roleTab === 'ustadz' ? 'asatidz' : 'admin',
          userType: roleTab === 'ustadz' ? 'Ustadz / Guru' : 'Administrator',
          nama: roleTab === 'ustadz' ? (cleanU || 'Ust. Ahmad Fauzi') : 'Administrator Nurul Wafa',
          username: cleanU,
          loginTime: new Date().toISOString()
        };
        if (rememberMe) {
          localStorage.setItem('desktop_session', JSON.stringify(sessionData));
        } else {
          sessionStorage.setItem('desktop_session', JSON.stringify(sessionData));
        }
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(sessionData);
        return;
      }

      setLoading(false);
      setError(err.response?.data?.error || err.response?.data?.message || 'Login gagal. Periksa username dan password.');
    }
  };

  const handleQuickFill = (type) => {
    setError('');
    if (type === 'admin') {
      setRoleTab('admin');
      setUsername('admin');
      setPassword('admin123');
    } else {
      setRoleTab('ustadz');
      setUsername('ustadz');
      setPassword('ustadz123');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Decorative Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.3) 0%, rgba(5, 150, 105, 0) 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header Header */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          padding: '32px 28px 28px',
          textAlign: 'center',
          color: '#ffffff',
          position: 'relative'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <Building size={34} color="#ffffff" strokeWidth={2.2} />
          </div>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            margin: '0 0 6px',
            letterSpacing: '-0.3px',
            color: '#ffffff'
          }}>
            Pondok Pesantren Nurul Wafa
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#d1fae5',
            margin: 0,
            fontWeight: 500
          }}>
            Sistem Informasi Manajemen & Administrasi Terpadu
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {/* Role Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: '#f1f5f9',
            padding: '5px',
            borderRadius: '14px',
            marginBottom: '22px'
          }}>
            <button
              type="button"
              onClick={() => { setRoleTab('admin'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: roleTab === 'admin' ? '#ffffff' : 'transparent',
                color: roleTab === 'admin' ? '#047857' : '#64748b',
                boxShadow: roleTab === 'admin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <ShieldCheck size={16} />
              <span>Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => { setRoleTab('ustadz'); setError(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: roleTab === 'ustadz' ? '#ffffff' : 'transparent',
                color: roleTab === 'ustadz' ? '#047857' : '#64748b',
                boxShadow: roleTab === 'ustadz' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <GraduationCap size={16} />
              <span>Ustadz / Guru</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 14px',
              color: '#dc2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username / NIP Field */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '7px'
              }}>
                {roleTab === 'admin' ? 'Username / Email Admin' : 'NIK / NIY / No. HP / Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={roleTab === 'admin' ? 'Masukkan username admin...' : 'Masukkan NIK/NIY atau No. HP...'}
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    background: '#f8fafc'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#059669';
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '7px'
              }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155'
                }}>
                  Password
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Akses Desktop
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    borderRadius: '12px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    background: '#f8fafc'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#059669';
                    e.target.style.background = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.background = '#f8fafc';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '22px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: '#059669',
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                Ingat sesi di komputer ini
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(5, 150, 105, 0.4)',
                transition: 'all 0.2s',
                marginBottom: '20px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk ke Dashboard Desktop</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div style={{
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            marginBottom: '18px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '10px'
            }}>
              <Sparkles size={14} color="#059669" />
              <span>Akses Cepat Pengujian:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>Admin Utama</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ustadz')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <GraduationCap size={14} color="#059669" />
                <span>Ust. Fauzi</span>
              </button>
            </div>
          </div>

          {/* Mobile Switcher link */}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <a
              href="https://mnurulwafa.ruangtech.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                color: '#059669',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <span>Beralih ke Portal Mobile (mnurulwafa.ruangtech.com)</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Card Footer */}
        <div style={{
          background: '#f8fafc',
          padding: '14px 20px',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '11.5px',
          color: '#94a3b8'
        }}>
          &copy; {new Date().getFullYear()} Nurul Wafa &bull; Seluruh hak cipta dilindungi
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
