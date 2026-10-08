import React, { useState } from 'react';
import { Building, Lock, User, LogIn, Key, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MobileLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List akun asrama (default / fallback)
  const defaultAsramaAccounts = [
    { id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', pembina: 'Ust. Ahmad Fauzi, S.Pd.I', username: 'asrama_ali', password: 'ali123' },
    { id: 2, nama_asrama: 'Asrama Umar bin Khattab', pembina: 'Ust. Ridwan Kamil, Lc.', username: 'asrama_umar', password: 'umar123' },
    { id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', pembina: 'Usth. Siti Maryam, M.Ag.', username: 'asrama_fathimah', password: 'fathimah123' },
    { id: 4, nama_asrama: 'Asrama Khadijah Al-Kubra', pembina: 'Usth. Nur Aini, S.Pd.', username: 'asrama_khadijah', password: 'khadijah123' }
  ];

  const handleLogin = (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Check saved accounts in localStorage or fallback
      const savedAsramaList = JSON.parse(localStorage.getItem('master_asrama_list') || 'null') || defaultAsramaAccounts;
      
      const matched = savedAsramaList.find(
        (a) => a.username?.toLowerCase() === username.trim().toLowerCase() && a.password === password.trim()
      );

      if (matched) {
        const sessionData = {
          role: 'asrama',
          asrama_id: matched.id,
          nama_asrama: matched.nama_asrama,
          pembina: matched.pembina,
          username: matched.username,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('mobile_session', JSON.stringify(sessionData));
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(sessionData);
      } else if (username === 'admin' && password === 'admin123') {
        const adminSession = {
          role: 'admin',
          nama_asrama: 'Semua Asrama (Admin)',
          pembina: 'Administrator Utama',
          username: 'admin',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem('mobile_session', JSON.stringify(adminSession));
        setLoading(false);
        if (onLoginSuccess) onLoginSuccess(adminSession);
      } else {
        setLoading(false);
        setError('Username atau Password Asrama salah! Silakan periksa kembali.');
      }
    }, 400);
  };

  const handleQuickLogin = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
    
    const sessionData = {
      role: 'asrama',
      asrama_id: acc.id,
      nama_asrama: acc.nama_asrama,
      pembina: acc.pembina,
      username: acc.username,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem('mobile_session', JSON.stringify(sessionData));
    if (onLoginSuccess) onLoginSuccess(sessionData);
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
                placeholder="Contoh: asrama_ali"
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

        {/* Quick Demo Login Accounts Section */}
        <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
            🔑 Pilihan Login Cepat Asrama (Demo)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {defaultAsramaAccounts.map((acc) => (
              <button 
                key={acc.id}
                onClick={() => handleQuickLogin(acc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>{acc.nama_asrama}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Username: <strong>{acc.username}</strong> • Pass: {acc.password}</div>
                </div>
                <Key size={14} color="#059669" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
