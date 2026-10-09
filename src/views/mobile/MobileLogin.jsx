import React, { useState } from 'react';
import axios from 'axios';
import { 
  Building, 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { showError, toastSuccess } from '../../utils/alert.util';

export default function MobileLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      showError('Validasi Gagal', 'Username dan Password wajib diisi.');
      setError('Username dan Password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('/api/login', { username: cleanUser, password: cleanPass });
      if (res.data && res.data.success) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 16px',
      fontFamily: "'Inter', -apple-system, sans-serif",
      boxSizing: 'border-box'
    }}>
      {/* Box Container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px 22px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        boxSizing: 'border-box'
      }}>
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 10px 20px -5px rgba(5, 150, 105, 0.4)'
          }}>
            <Building size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Pondok Pesantren Nurul Wafa
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Sistem Informasi Mobile Terpadu
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#ffe4e6',
            border: '1px solid #fecdd3',
            color: '#be123c',
            borderRadius: '12px',
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
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Username, NIK, atau No. HP..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 38px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 38px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            <LogIn size={18} /> {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.72rem', color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} Pondok Pesantren Nurul Wafa
        </div>
      </div>
    </div>
  );
}
