import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Check,
  ShieldCheck,
  HelpCircle,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { showError, showSuccess, toastSuccess } from '../../utils/alert.util';

export default function MobileLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Load remembered username if exists
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('pesantren_remember_username');
      const savedRemember = localStorage.getItem('pesantren_remember_me');
      if (savedUser && savedRemember === 'true') {
        setUsername(savedUser);
        setRememberMe(true);
      }
    } catch (e) {}
  }, []);

  // Detect Caps Lock state
  const handleKeyDown = (e) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      const msg = 'Username dan Password wajib diisi.';
      setError(msg);
      showError('Validasi Gagal', msg);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/login', { username: cleanUser, password: cleanPass });
      if (res.data && res.data.success) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }

        // Handle Remember Me
        try {
          if (rememberMe) {
            localStorage.setItem('pesantren_remember_username', cleanUser);
            localStorage.setItem('pesantren_remember_me', 'true');
          } else {
            localStorage.removeItem('pesantren_remember_username');
            localStorage.setItem('pesantren_remember_me', 'false');
          }
        } catch (err) {}

        const userObj = res.data.user || {};
        const detectedRole = res.data.role || userObj.role || 'asatidz';
        const detectedType = res.data.userType || userObj.userType || 
          (detectedRole === 'asatidz' ? 'Ustadz / Guru' : (detectedRole === 'admin' ? 'Administrator' : 'Asrama'));

        const sessionData = {
          token: res.data.token,
          role: detectedRole,
          userType: detectedType,
          nama: res.data.nama || userObj.nama_asatidz || userObj.nama || userObj.name || cleanUser,
          nama_asatidz: res.data.nama_asatidz || userObj.nama_asatidz || cleanUser,
          asrama_id: res.data.asrama_id || userObj.asrama_id || 1,
          nama_asrama: res.data.nama_asrama || userObj.nama_asrama || '',
          pembina: res.data.pembina || userObj.pembina || userObj.nama_asatidz || '',
          username: cleanUser,
          loginTime: new Date().toISOString()
        };

        localStorage.setItem('mobile_session', JSON.stringify(sessionData));
        setLoading(false);
        toastSuccess(`Selamat datang, ${sessionData.nama}`);
        if (onLoginSuccess) onLoginSuccess(sessionData);
        return;
      } else {
        const msg = res.data?.error || res.data?.message || 'Login gagal. Periksa data Anda.';
        setError(msg);
        showError('Login Gagal', msg);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      let displayMsg = 'Login gagal. Periksa username dan password Anda.';
      if (serverMsg) {
        displayMsg = serverMsg;
      } else if (err.code === 'ERR_NETWORK') {
        displayMsg = 'Koneksi ke database terputus. Pastikan server aktif.';
      }
      setError(displayMsg);
      showError('Login Gagal', displayMsg);
    }
  };

  const handleForgotPassword = () => {
    showSuccess(
      'Bantuan Lupa Kata Sandi',
      'Untuk mereset password akun Ustadz / Admin, silakan hubungi Administrator Sistem atau Sekretariat Pesantren Nurul Wafa.'
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #064e3b 0%, #047857 40%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Box Container */}
      <div style={{
        width: '100%',
        maxWidth: '390px',
        background: '#ffffff',
        borderRadius: '26px',
        padding: '30px 22px 24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15)',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {/* Top Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <span style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            color: '#065f46',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            border: '1px solid #a7f3d0',
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={12} color="#059669" />
            PORTAL MOBILE RESMI
          </span>
        </div>

        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 12px 24px -6px rgba(5, 150, 105, 0.45)',
            border: '2px solid rgba(255, 255, 255, 0.8)'
          }}>
            <Building size={34} strokeWidth={2.2} />
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            Pondok Pesantren Nurul Wafa
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            Masuk ke akun Ustadz, Musyrif, atau Admin
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            color: '#be123c',
            borderRadius: '14px',
            padding: '10px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* USERNAME INPUT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Username / NIK
            </label>
            <div style={{
              position: 'relative',
              borderRadius: '14px',
              transition: 'all 0.15s ease',
              boxShadow: focusedField === 'user' ? '0 0 0 3px rgba(5, 150, 105, 0.2)' : 'none'
            }}>
              <User 
                size={18} 
                color={focusedField === 'user' ? '#059669' : '#94a3b8'} 
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.15s ease' }} 
              />
              <input 
                type="text"
                placeholder="Username akun Anda..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('user')}
                onBlur={() => setFocusedField(null)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                style={{
                  width: '100%',
                  padding: '12px 38px 12px 40px',
                  borderRadius: '14px',
                  border: focusedField === 'user' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              />
              {username && (
                <button
                  type="button"
                  onClick={() => setUsername('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0
                  }}
                  title="Hapus"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                Password
              </label>
              {capsLockActive && (
                <span style={{ fontSize: '0.68rem', color: '#ea580c', fontWeight: 700 }}>
                  ⚠️ Caps Lock Aktif
                </span>
              )}
            </div>
            <div style={{
              position: 'relative',
              borderRadius: '14px',
              transition: 'all 0.15s ease',
              boxShadow: focusedField === 'pass' ? '0 0 0 3px rgba(5, 150, 105, 0.2)' : 'none'
            }}>
              <Lock 
                size={18} 
                color={focusedField === 'pass' ? '#059669' : '#94a3b8'} 
                style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.15s ease' }} 
              />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                required
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 40px',
                  borderRadius: '14px',
                  border: focusedField === 'pass' ? '1.5px solid #059669' : '1.5px solid #e2e8f0',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              />
              {/* Show / Hide Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? '#059669' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease'
                }}
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* REMEMBER ME & LUPA PASSWORD ROW */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '2px'
          }}>
            {/* Checkbox Ingatkan Saya */}
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '0.78rem',
              color: '#475569',
              fontWeight: 600
            }}>
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  setRememberMe(!rememberMe);
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '6px',
                  border: rememberMe ? '2px solid #059669' : '2px solid #cbd5e1',
                  background: rememberMe ? '#059669' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {rememberMe && <Check size={13} color="#ffffff" strokeWidth={3} />}
              </div>
              <span>Ingatkan saya</span>
            </label>

            {/* Bantuan Lupa Password */}
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <HelpCircle size={13} />
              <span>Lupa sandi?</span>
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '13px',
              borderRadius: '14px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: loading ? 'none' : '0 8px 18px -3px rgba(5, 150, 105, 0.45)',
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Security Reassurance Footer */}
        <div style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#64748b',
          fontSize: '0.72rem'
        }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Akses Terenkripsi & Terlindungi</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} Pondok Pesantren Nurul Wafa
        </div>
      </div>
    </div>
  );
}
