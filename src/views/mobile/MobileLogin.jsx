import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Lock, User, LogIn, AlertCircle } from 'lucide-react';

export default function MobileLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbAsramaList, setDbAsramaList] = useState([]);

  useEffect(() => {
    // Fetch real database asrama list
    const loadAsramaData = async () => {
      try {
        const res = await axios.get('/api/asrama');
        if (res.data && res.data.success && res.data.asrama && res.data.asrama.length) {
          setDbAsramaList(res.data.asrama);
        } else {
          const saved = JSON.parse(localStorage.getItem('master_asrama_list') || '[]');
          setDbAsramaList(saved);
        }
      } catch (err) {
        const saved = JSON.parse(localStorage.getItem('master_asrama_list') || '[]');
        setDbAsramaList(saved);
      }
    };

    loadAsramaData();
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send login request to real database API endpoint /api/login
      const res = await axios.post('/api/login', { username, password });
      if (res.data && res.data.success) {
        const sessionData = {
          role: res.data.role || 'asrama',
          asrama_id: res.data.asrama_id || 1,
          nama_asrama: res.data.nama_asrama || (res.data.user?.nama || 'Asrama'),
          pembina: res.data.pembina || 'Musyrif Asrama',
          username: username.trim(),
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('mobile_session', JSON.stringify(sessionData));
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(sessionData);
      } else {
        setLoading(false);
        setError(res.data?.error || 'Username atau password salah!');
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || err.message || 'Gagal terhubung ke server database.';
      setError(errMsg);
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
      padding: '24px 16px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '28px 22px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        boxSizing: 'border-box'
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 10px 20px -5px rgba(5, 150, 105, 0.4)'
          }}>
            <Building size={30} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            Login Mobile E-Pesantren
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            Masuk dengan Akun Musyrif / Pembina Asrama
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
            fontSize: '0.76rem',
            fontWeight: 700,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              USERNAME AKUN ASRAMA
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Masukkan username asrama"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              PASSWORD AKUN
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
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
              padding: '12px',
              borderRadius: '14px',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            <LogIn size={18} /> {loading ? 'Memverifikasi...' : 'Masuk Aplikasi Mobile'}
          </button>
        </form>
      </div>
    </div>
  );
}
