import React, { useState, useEffect } from 'react';
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
  CheckCircle2, 
  Sparkles,
  Phone
} from 'lucide-react';
import { showError, toastSuccess } from '../../utils/alert.util';

export default function MobileLogin({ onLoginSuccess }) {
  const [roleTab, setRoleTab] = useState('ustadz'); // 'ustadz' | 'asrama' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [asatidzList, setAsatidzList] = useState([]);
  const [asramaList, setAsramaList] = useState([]);

  // Fetch lists for quick login shortcuts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAst = await axios.get('/api/asatidz');
        if (resAst.data?.success && resAst.data?.data?.length) {
          setAsatidzList(resAst.data.data);
        } else {
          setAsatidzList([
            { id: 1, nama_asatidz: 'Ust. Ahmad Fauzi, Al-Hafidz', nik_niy: 'AST-2022-004', no_hp: '081344556677' },
            { id: 2, nama_asatidz: 'Ust. Hamdan Syafi\'i', nik_niy: 'AST-2021-002', no_hp: '081233445566' },
            { id: 3, nama_asatidz: 'Usth. Siti Maryam, S.Pd.', nik_niy: 'AST-2023-010', no_hp: '081299887766' }
          ]);
        }
      } catch (e) {
        setAsatidzList([
          { id: 1, nama_asatidz: 'Ust. Ahmad Fauzi, Al-Hafidz', nik_niy: 'AST-2022-004', no_hp: '081344556677' },
          { id: 2, nama_asatidz: 'Ust. Hamdan Syafi\'i', nik_niy: 'AST-2021-002', no_hp: '081233445566' },
          { id: 3, nama_asatidz: 'Usth. Siti Maryam, S.Pd.', nik_niy: 'AST-2023-010', no_hp: '081299887766' }
        ]);
      }

      try {
        const resAsr = await axios.get('/api/asrama');
        if (resAsr.data?.success && resAsr.data?.asrama?.length) {
          setAsramaList(resAsr.data.asrama);
        }
      } catch (e) {}
    };

    fetchData();
  }, []);

  // Quick fill handler
  const handleSelectQuickAccount = (account) => {
    if (roleTab === 'ustadz') {
      setUsername(account.no_hp || account.nik_niy || account.nama_asatidz);
      setPassword('123456');
    } else if (roleTab === 'asrama') {
      setUsername(account.username || account.kode_asrama);
      setPassword('123456');
    }
    setError('');
  };

  const handleRoleChange = (newRole) => {
    setRoleTab(newRole);
    setError('');
    if (newRole === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    try {
      const res = await axios.post('/api/login', { username: cleanUser, password: cleanPass });
      if (res.data && res.data.success) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        const userObj = res.data.user || {};
        const sessionData = {
          token: res.data.token,
          role: res.data.role || userObj.role || (roleTab === 'ustadz' ? 'asatidz' : roleTab),
          userType: res.data.userType || userObj.userType || (roleTab === 'ustadz' ? 'Ustadz / Guru' : (roleTab === 'admin' ? 'Admin' : 'Asrama')),
          nama: res.data.nama || userObj.nama_asatidz || userObj.nama || userObj.name || cleanUser,
          nama_asatidz: res.data.nama_asatidz || userObj.nama_asatidz || (roleTab === 'ustadz' ? cleanUser : ''),
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
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '24px 20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        boxSizing: 'border-box'
      }}>
        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '62px',
            height: '62px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 10px 20px -5px rgba(5, 150, 105, 0.4)'
          }}>
            {roleTab === 'ustadz' ? <GraduationCap size={32} /> : (roleTab === 'asrama' ? <Building size={30} /> : <ShieldCheck size={30} />)}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
            {roleTab === 'ustadz' ? 'Login Ustadz & Guru' : (roleTab === 'asrama' ? 'Login Musyrif Asrama' : 'Login Administrator')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            Pondok Pesantren Nurul Wafa
          </p>
        </div>

        {/* ROLE SELECTOR TABS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => handleRoleChange('ustadz')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: roleTab === 'ustadz' ? '#ffffff' : 'transparent',
              color: roleTab === 'ustadz' ? '#059669' : '#64748b',
              fontWeight: roleTab === 'ustadz' ? 800 : 600,
              fontSize: '0.72rem',
              boxShadow: roleTab === 'ustadz' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <GraduationCap size={16} />
            <span>Ustadz/Guru</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('asrama')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: roleTab === 'asrama' ? '#ffffff' : 'transparent',
              color: roleTab === 'asrama' ? '#0284c7' : '#64748b',
              fontWeight: roleTab === 'asrama' ? 800 : 600,
              fontSize: '0.72rem',
              boxShadow: roleTab === 'asrama' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Building size={16} />
            <span>Musyrif</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              background: roleTab === 'admin' ? '#ffffff' : 'transparent',
              color: roleTab === 'admin' ? '#7c3aed' : '#64748b',
              fontWeight: roleTab === 'admin' ? 800 : 600,
              fontSize: '0.72rem',
              boxShadow: roleTab === 'admin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={16} />
            <span>Admin</span>
          </button>
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

        {/* Form Login */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              {roleTab === 'ustadz' ? 'NIK / NO. HP / NAMA USTADZ' : (roleTab === 'asrama' ? 'KODE / USERNAME ASRAMA' : 'USERNAME ADMINISTRATOR')}
            </label>
            <div style={{ position: 'relative' }}>
              {roleTab === 'ustadz' ? (
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              ) : roleTab === 'asrama' ? (
                <Building size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              ) : (
                <ShieldCheck size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              )}
              <input 
                type="text"
                placeholder={roleTab === 'ustadz' ? 'Contoh: 08123456789 atau NIK/Nama' : (roleTab === 'asrama' ? 'Contoh: asrama1 atau ali' : 'admin')}
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
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password akun"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 38px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
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
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '5px' }}>
              {roleTab === 'ustadz' 
                ? '💡 Password default: 123456 atau ustadz123'
                : (roleTab === 'asrama' ? '💡 Password default: 123456' : '💡 Password admin: admin')}
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: roleTab === 'ustadz' 
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                : (roleTab === 'asrama' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'),
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
              marginTop: '4px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
            }}
          >
            <LogIn size={18} /> {loading ? 'Memverifikasi...' : `Masuk Sebagai ${roleTab === 'ustadz' ? 'Ustadz / Guru' : (roleTab === 'asrama' ? 'Musyrif' : 'Admin')}`}
          </button>
        </form>

        {/* Quick Demo Fill Chips (Pilih Akun Cepat) */}
        {roleTab === 'ustadz' && asatidzList.length > 0 && (
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
              Pilih Nama Ustadz / Guru:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {asatidzList.slice(0, 3).map((ast) => (
                <button
                  key={ast.id}
                  type="button"
                  onClick={() => handleSelectQuickAccount(ast)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.74rem',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{ast.nama_asatidz}</span>
                  <span style={{ fontSize: '0.66rem', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                    Isi Otomatis
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
