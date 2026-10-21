import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  ShieldAlert, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Key, 
  User, 
  Phone, 
  Home, 
  Award, 
  Clock, 
  FileText, 
  Sparkles, 
  Save, 
  Eye, 
  EyeOff, 
  Building, 
  Calendar,
  Lock,
  ChevronRight,
  Fingerprint,
  QrCode,
  Bell,
  Check,
  Building2,
  Layers,
  UserCheck,
  HeartHandshake,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  Shield,
  CheckCircle
} from 'lucide-react';
import { showConfirm, toastSuccess, showError, showSuccess } from '../../utils/alert.util';

export default function PortalWaliSantri({ onLogout, customSantriId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
      return customSantriId || sess.santri_id || sess.id || null;
    } catch (e) {
      return customSantriId || null;
    }
  });

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'santri' | 'asrama' | 'kelas' | 'kitab' | 'guru' | 'perizinan' | 'pelanggaran' | 'absensi' | 'hafalan' | 'praktek' | 'keamanan' | 'notifikasi'
  const [absensiStatusFilter, setAbsensiStatusFilter] = useState('Hadir'); // 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [searchModalText, setSearchModalText] = useState('');

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    username_baru: '',
    password_baru: '',
    konfirmasi_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Live Clock & Greeting
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      
      let greet = 'Selamat Malam,';
      if (hours >= 4 && hours < 11) greet = 'Selamat Pagi,';
      else if (hours >= 11 && hours < 15) greet = 'Selamat Siang,';
      else if (hours >= 15 && hours < 18) greet = 'Selamat Sore,';
      setGreeting(greet);

      const dStr = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(now);
      setCurrentDateStr(dStr);

      const timeFormatted = now.toTimeString().split(' ')[0] + ' WIB';
      setCurrentTimeStr(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambil data monitoring wali santri
  const fetchWaliData = async (targetId = selectedSantriId) => {
    try {
      setLoading(true);
      const url = targetId ? `/api/wali/santri?santri_id=${targetId}` : '/api/wali/santri';
      const res = await axios.get(url);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        if (res.data.data.santri?.id) {
          setSelectedSantriId(res.data.data.santri.id);
          setPasswordForm(prev => ({
            ...prev,
            username_baru: res.data.data.santri.username || res.data.data.santri.nis || ''
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data portal wali:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ambil daftar santri jika wali ingin berganti santri (misal wali punya lebih dari 1 anak)
  const fetchSantriList = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWaliData();
    fetchSantriList();
  }, []);

  const handleSantriChange = (newId) => {
    setSelectedSantriId(newId);
    fetchWaliData(newId);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.password_baru) {
      showError('Validasi Gagal', 'Password baru wajib diisi.');
      return;
    }
    if (passwordForm.password_baru.length < 4) {
      showError('Validasi Gagal', 'Password minimal 4 karakter.');
      return;
    }
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      showError('Validasi Gagal', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await axios.put('/api/wali/password', {
        santri_id: selectedSantriId,
        password_baru: passwordForm.password_baru,
        username_baru: passwordForm.username_baru
      });
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Kredensial login akun orang tua santri berhasil disimpan.');
        setPasswordForm({
          username_baru: passwordForm.username_baru,
          password_baru: '',
          konfirmasi_password: ''
        });
        setActiveModal(null);
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengubah password');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleLogoutAction = () => {
    showConfirm('Keluar Akun?', 'Apakah Bapak/Ibu ingin keluar dari Portal Orang Tua Santri?', () => {
      localStorage.removeItem('desktop_session');
      localStorage.removeItem('mobile_session');
      sessionStorage.removeItem('desktop_session');
      if (onLogout) {
        onLogout();
      } else {
        window.location.hash = '#login';
        window.location.reload();
      }
    });
  };

  const santri = data?.santri || {};
  const tahfidz = data?.tahfidzSetoran || [];
  const praktek = data?.praktekIbadah || [];
  const presensi = data?.presensiJamaah || [];
  const perizinan = data?.perizinan || [];
  const pelanggaran = data?.pelanggaran || [];
  const stats = data?.statistik || {};

  // Hitung status absensi santri
  const countHadir = presensi.filter(p => (p.status || '').toLowerCase().includes('hadir')).length;
  const countSakit = presensi.filter(p => (p.status || '').toLowerCase().includes('sakit')).length;
  const countIzin = perizinan.length || presensi.filter(p => (p.status || '').toLowerCase().includes('izin')).length;
  const countAlfa = presensi.filter(p => (p.status || '').toLowerCase().includes('alfa') || (p.status || '').toLowerCase().includes('absen')).length;

  const rawSantriName = santri.nama_santri || 'Santri Nurul Wafa';
  const initial = rawSantriName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'AD';

  const openStatusModal = (status) => {
    setAbsensiStatusFilter(status);
    setSearchModalText('');
    setActiveModal('absensi');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Mobile Frame Container: 100% on phone, max 430px on desktop with clean shadow */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100vh',
        background: '#f8fafc',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '84px',
        boxSizing: 'border-box'
      }}>
        
        {/* =========================================================================
            1. TOP ROYAL BLUE GRADIENT BANNER
        ========================================================================= */}
        <div style={{
          background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 40%, #1e40af 100%)',
          padding: '16px 16px 36px',
          color: '#ffffff',
          borderBottomLeftRadius: '28px',
          borderBottomRightRadius: '28px',
          position: 'relative'
        }}>
          {/* Top Bar Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px'
          }}>
            {/* Logo Brand */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px'
              }}>
                <img src="/logo-pesantren.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => { e.target.src = '/logo.png'; }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.98rem', letterSpacing: '-0.3px' }}>
                Ruang Ponpes
              </span>
              <span style={{
                background: '#f59e0b',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '999px',
                letterSpacing: '0.04em'
              }}>
                PRO
              </span>
            </div>

            {/* Top 3 Round Action Buttons (Cyan Key, Blue Bell, Red Logout) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Key Button (Cyan) - Ganti PIN / Password */}
              <button
                onClick={() => setActiveModal('keamanan')}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#06b6d4',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(6, 182, 212, 0.4)'
                }}
                title="Pengaturan Akun Wali"
              >
                <Key size={17} />
              </button>

              {/* Notification Bell (Blue with Red Dot) */}
              <button
                onClick={() => setActiveModal('notifikasi')}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)'
                }}
                title="Pemberitahuan Pesantren"
              >
                <Bell size={17} />
                <span style={{
                  position: 'absolute',
                  top: '5px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1.5px solid #ffffff'
                }} />
              </button>

              {/* Logout (Red) */}
              <button
                onClick={handleLogoutAction}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.4)'
                }}
                title="Keluar"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>

          {/* User Profile Card & Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar Box with Green Status Indicator */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                border: '2.5px solid rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#ffffff',
                boxShadow: '0 8px 18px rgba(0, 0, 0, 0.25)'
              }}>
                {initial}
              </div>
              {/* Green Online Dot */}
              <div style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2.5px solid #0369a1',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)'
              }} />
            </div>

            {/* User Details & Date Pill */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', color: '#e0f2fe', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🌅</span>
                <span>{greeting}</span>
              </div>
              <div style={{
                fontSize: '1.22rem',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.25,
                marginTop: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {rawSantriName}
              </div>

              {/* Subtext Wali & Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.7rem', color: '#bae6fd', fontWeight: 600 }}>
                  Wali: {santri.nama_wali || 'Orang Tua Santri'}
                </span>
                {santriList.length > 1 && (
                  <select
                    value={selectedSantriId || ''}
                    onChange={(e) => handleSantriChange(Number(e.target.value))}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '0.66rem',
                      padding: '1px 6px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {santriList.map(s => (
                      <option key={s.id} value={s.id} style={{ color: '#0f172a' }}>
                        Ganti: {s.nama_santri}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Date & Time Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(8px)',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.68rem',
                color: '#f8fafc',
                fontWeight: 600,
                marginTop: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span>📅</span>
                <span>{currentDateStr || 'Rab, 21 Okt 2026'}</span>
                <span>•</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span>{currentTimeStr || '09:58:21 WIB'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. REKAP ABSENSI SANTRI (ELEVATED WHITE CARD DENGAN 4 SQUIRCLE)
        ========================================================================= */}
        <div style={{ padding: '0 16px', marginTop: '-20px' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            border: '2px solid #0284c7',
            padding: '16px 14px',
            boxShadow: '0 12px 28px -6px rgba(2, 132, 199, 0.22), 0 2px 8px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            zIndex: 10
          }}>
            {/* 4 Status Badges (Hadir, Sakit, Izin, Alfa) */}
            <div className="mobile-rekap-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {/* 1. HADIR */}
              <div
                onClick={() => openStatusModal('Hadir')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 8px 18px -4px rgba(16, 185, 129, 0.45)'
                }}>
                  <Check size={28} strokeWidth={2.8} />
                  {countHadir > 0 && (
                    <span style={countBadgeStyle}>{countHadir}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                  Hadir
                </span>
              </div>

              {/* 2. SAKIT */}
              <div
                onClick={() => openStatusModal('Sakit')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 8px 20px -2px rgba(239, 68, 68, 0.45)'
                }}>
                  <Building2 size={26} strokeWidth={2.4} />
                  {countSakit > 0 && (
                    <span style={countBadgeStyle}>{countSakit}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                  Sakit
                </span>
              </div>

              {/* 3. IZIN */}
              <div
                onClick={() => openStatusModal('Izin')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 8px 18px -4px rgba(245, 158, 11, 0.45)'
                }}>
                  <FileText size={26} strokeWidth={2.2} />
                  {countIzin > 0 && (
                    <span style={countBadgeStyle}>{countIzin}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                  Izin
                </span>
              </div>

              {/* 4. ALFA */}
              <div
                onClick={() => openStatusModal('Alfa')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: '#0d9488',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 8px 18px -4px rgba(13, 148, 136, 0.45)'
                }}>
                  <Clock size={26} strokeWidth={2.4} />
                  {countAlfa > 0 && (
                    <span style={countBadgeStyle}>{countAlfa}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                  Alfa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SQUIRCLE GRID MENU (4 KOLOM TEMA MODERN PESANTREN)
        ========================================================================= */}
        <div className="mobile-squircle-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px 8px',
          padding: '24px 14px 14px'
        }}>
          {/* 1. Santri */}
          <div onClick={() => setActiveModal('santri')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.35)' }}>
              <Users size={26} />
            </div>
            <span style={menuLabelStyle}>Santri</span>
          </div>

          {/* 2. Asrama */}
          <div onClick={() => setActiveModal('asrama')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 16px -2px rgba(99, 102, 241, 0.35)' }}>
              <Building size={26} />
            </div>
            <span style={menuLabelStyle}>Asrama</span>
          </div>

          {/* 3. Kelas */}
          <div onClick={() => setActiveModal('kelas')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 16px -2px rgba(245, 158, 11, 0.35)' }}>
              <Layers size={26} />
            </div>
            <span style={menuLabelStyle}>Kelas</span>
          </div>

          {/* 4. Kitab */}
          <div onClick={() => setActiveModal('kitab')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 16px -2px rgba(5, 150, 105, 0.35)' }}>
              <BookOpen size={26} />
            </div>
            <span style={menuLabelStyle}>Kitab</span>
          </div>

          {/* 5. Guru */}
          <div onClick={() => setActiveModal('guru')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 8px 16px -2px rgba(13, 148, 136, 0.35)' }}>
              <UserCheck size={26} />
            </div>
            <span style={menuLabelStyle}>Guru</span>
          </div>

          {/* 6. Perizinan */}
          <div onClick={() => setActiveModal('perizinan')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 8px 16px -2px rgba(234, 88, 12, 0.35)' }}>
              <DoorOpen size={26} />
            </div>
            <span style={menuLabelStyle}>Perizinan</span>
          </div>

          {/* 7. Pelanggaran */}
          <div onClick={() => setActiveModal('pelanggaran')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 8px 16px -2px rgba(225, 29, 72, 0.35)' }}>
              <ShieldAlert size={26} />
            </div>
            <span style={menuLabelStyle}>Pelanggaran</span>
          </div>

          {/* 8. Absensi */}
          <div onClick={() => setActiveModal('absensi')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 8px 16px -2px rgba(2, 132, 199, 0.35)' }}>
              <Fingerprint size={26} />
            </div>
            <span style={menuLabelStyle}>Absensi</span>
          </div>

          {/* 9. Hafalan */}
          <div onClick={() => setActiveModal('hafalan')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 16px -2px rgba(139, 92, 246, 0.35)' }}>
              <Sparkles size={26} />
            </div>
            <span style={menuLabelStyle}>Hafalan</span>
          </div>

          {/* 10. Praktek */}
          <div onClick={() => setActiveModal('praktek')} style={menuCardStyle}>
            <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #10b981, #047857)', boxShadow: '0 8px 16px -2px rgba(16, 185, 129, 0.35)' }}>
              <HeartHandshake size={26} />
            </div>
            <span style={menuLabelStyle}>Praktek</span>
          </div>
        </div>

        {/* Quick Refresh Info Banner */}
        <div style={{ padding: '8px 16px', marginTop: 'auto' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>Sinkronisasi Data Realtime</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Status presensi & ibadah santri otomatis terupdate</div>
              </div>
            </div>
            <button
              onClick={() => fetchWaliData(selectedSantriId)}
              style={{
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Segarkan
            </button>
          </div>
        </div>

        {/* =========================================================================
            4. ELEVATED FLOATING WHITE BOTTOM NAVIGATION BAR
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${activeModal === null ? 'active' : ''}`}
            onClick={() => setActiveModal(null)}
          >
            <div className={`nav-icon-wrapper ${activeModal === null ? 'active' : ''}`}>
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          <button 
            className={`mobile-nav-item ${activeModal === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveModal('perizinan')}
          >
            <div className={`nav-icon-wrapper ${activeModal === 'perizinan' ? 'active' : ''}`}>
              <DoorOpen size={20} />
            </div>
            <span>Izin</span>
          </button>

          {/* Prominent Center Floating Fingerprint Action Button */}
          <button 
            className="mobile-fab-center"
            onClick={() => setActiveModal('absensi')}
            title="Presensi Fingerprint Santri"
          >
            <div className="fab-inner-glow">
              <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
            </div>
          </button>

          <button 
            className={`mobile-nav-item ${activeModal === 'hafalan' ? 'active' : ''}`}
            onClick={() => setActiveModal('hafalan')}
          >
            <div className={`nav-icon-wrapper ${activeModal === 'hafalan' ? 'active' : ''}`}>
              <BookOpen size={20} />
            </div>
            <span>Tahfidz</span>
          </button>

          <button 
            className={`mobile-nav-item ${activeModal === 'santri' ? 'active' : ''}`}
            onClick={() => setActiveModal('santri')}
          >
            <div className={`nav-icon-wrapper ${activeModal === 'santri' ? 'active' : ''}`}>
              <User size={20} />
            </div>
            <span>Profile</span>
          </button>
        </nav>

        {/* =========================================================================
            5. DETAIL BOTTOM SHEETS / MODALS
        ========================================================================= */}
        {activeModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}>
            <div style={{
              width: '100%',
              maxWidth: '430px',
              background: '#ffffff',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* Modal Top Bar */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {activeModal === 'santri' && <Users size={20} />}
                    {activeModal === 'asrama' && <Building size={20} />}
                    {activeModal === 'kelas' && <Layers size={20} />}
                    {activeModal === 'kitab' && <BookOpen size={20} />}
                    {activeModal === 'guru' && <UserCheck size={20} />}
                    {activeModal === 'perizinan' && <DoorOpen size={20} />}
                    {activeModal === 'pelanggaran' && <ShieldAlert size={20} />}
                    {activeModal === 'absensi' && <Fingerprint size={20} />}
                    {activeModal === 'hafalan' && <Sparkles size={20} />}
                    {activeModal === 'praktek' && <HeartHandshake size={20} />}
                    {activeModal === 'keamanan' && <Key size={20} />}
                    {activeModal === 'notifikasi' && <Bell size={20} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      {activeModal === 'santri' && 'Biodata Lengkap Santri'}
                      {activeModal === 'asrama' && 'Informasi Asrama & Kobong'}
                      {activeModal === 'kelas' && 'Tingkat Kelas & Diniyah'}
                      {activeModal === 'kitab' && 'Kurikulum & Kajian Kitab'}
                      {activeModal === 'guru' && 'Asatidz & Pembina Kobong'}
                      {activeModal === 'perizinan' && 'Riwayat Perizinan Santri'}
                      {activeModal === 'pelanggaran' && 'Catatan Kedisiplinan Santri'}
                      {activeModal === 'absensi' && 'Presensi Sholat & Kegiatan'}
                      {activeModal === 'hafalan' && "Capaian Tahfidz Al-Qur'an"}
                      {activeModal === 'praktek' && 'Ujian Praktek Ibadah'}
                      {activeModal === 'keamanan' && 'Keamanan & Password Akun'}
                      {activeModal === 'notifikasi' && 'Pemberitahuan Pesantren'}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                      Santri: {santri.nama_santri || 'Ahmad Dani'} (NIS: {santri.nis || '-'})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Contents */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                
                {/* 1. SANTRI BIODATA */}
                {activeModal === 'santri' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
                        color: '#ffffff',
                        fontSize: '1.6rem',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        boxShadow: '0 8px 20px rgba(2, 132, 199, 0.3)'
                      }}>
                        {initial}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{santri.nama_santri || '-'}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#64748b' }}>NIS: <strong>{santri.nis || '-'}</strong> • Kode: <strong>{santri.kode_santri || '-'}</strong></p>
                    </div>

                    <div style={infoCardBox}>
                      <div style={infoRow}>
                        <span style={infoLabel}>Status Santri:</span>
                        <span className="badge badge-success">{santri.status || 'Aktif'} ({santri.status_santri || 'Mukim'})</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Jenis Kelamin:</span>
                        <span style={infoValue}>{santri.jk === 'P' ? 'Akhwat (Perempuan)' : 'Ikhwan (Laki-laki)'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Tahun Masuk:</span>
                        <span style={infoValue}>Tahun Ajaran {santri.tahun_masuk || '2026/2027'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Orang Tua / Wali:</span>
                        <span style={infoValue}>{santri.nama_wali || '-'} ({santri.hubungan_wali || 'Orang Tua'})</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Nomor WhatsApp Wali:</span>
                        <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_wa_wali || '-'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Alamat Rumah Asal:</span>
                        <span style={infoValue}>{santri.alamat_asal || 'Tasikmalaya, Jawa Barat'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ASRAMA & KOBONG */}
                {activeModal === 'asrama' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={infoCardBox}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} /> Kobong & Penempatan Asrama
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Gedung Asrama:</span>
                        <span style={{ ...infoValue, fontWeight: 800 }}>{santri.nama_asrama || 'Asrama Nurul Wafa'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Kamar Kobong:</span>
                        <span style={infoValue}>{santri.nama_kamar || 'Kamar 01'} ({santri.kode_kamar || 'K01'})</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Asatidz Pembina Kobong:</span>
                        <span style={{ ...infoValue, color: '#0284c7', fontWeight: 700 }}>{santri.pembina_asrama || 'Ust. Pembina Kobong'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Kontak WhatsApp Pembina:</span>
                        <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_hp_pembina || '+62 821-2345-6789'}</span>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '0.76rem', color: '#64748b', lineHeight: 1.5 }}>
                      💡 <strong>Catatan Wali:</strong> Jika ada keperluan mendesak atau hendak mengirim barang titipan untuk ananda, silakan berkoordinasi terlebih dahulu dengan Pembina Kobong.
                    </div>
                  </div>
                )}

                {/* 3. KELAS & DINIYAH */}
                {activeModal === 'kelas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={infoCardBox}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={14} /> Jenjang Madrasah Diniyah
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Tingkat Diniyah:</span>
                        <span style={{ ...infoValue, fontWeight: 800, color: '#d97706' }}>{santri.tingkat_diniyah || 'Wustho (Tingkat Menengah)'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Wali Kelas Diniyah:</span>
                        <span style={infoValue}>{santri.wali_kelas || 'Ust. Miftahurrahman, M.Pd'}</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Waktu Taklim / Belajar:</span>
                        <span style={infoValue}>Bada Subuh & Bada Maghrib</span>
                      </div>
                      <div style={infoRow}>
                        <span style={infoLabel}>Target Hafalan:</span>
                        <span style={infoValue}>30 Juz & Mutun Ilmiyyah</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. KITAB KUNING */}
                {activeModal === 'kitab' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                      Kajian kitab kuning & buku pegangan santri di pondok:
                    </div>
                    {[
                      { judul: 'Safinatun Najah', bidang: 'Fiqih Ibadah', status: 'Khatam Juz 1' },
                      { judul: 'Jurumiyyah', bidang: 'Gramatika Bahasa Arab', status: 'Bab Kalam s/d I\'rab' },
                      { judul: 'Taqrib / Fathul Qorib', bidang: 'Fiqih Lanjutan', status: 'Sedang Berjalan' },
                      { judul: 'Arbain Nawawiyah', bidang: 'Hadits Pilihan', status: 'Hafalan 20 Hadits' },
                      { judul: 'Aqidatul Awam', bidang: 'Tauhid & Aqidah', status: 'Khatam Mandiri' }
                    ].map((k, idx) => (
                      <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{k.judul}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{k.bidang}</div>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{k.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. GURU & ASATIDZ */}
                {activeModal === 'guru' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                      Dewan Asatidz & Ustadz Pembimbing santri di asrama:
                    </div>
                    {[
                      { nama: santri.pembina_asrama || 'Ust. Ahmad Fauzan, S.Pd.I', peran: 'Pembina Kobong & Asrama', hp: santri.no_hp_pembina || '+62 821-2345-6789' },
                      { nama: 'Ust. Ridwan Kamil, Al-Hafidz', peran: 'Musyrif Tahfidz Al-Qur\'an', hp: '+62 812-9876-5432' },
                      { nama: 'Ust. Zaenal Muttaqin', peran: 'Pengajar Nahwu & Shorof', hp: '+62 857-1122-3344' },
                      { nama: 'Ust. H. Abdurrahman', peran: 'Musyrif Keamanan & Kedisiplinan', hp: '+62 813-4455-6677' }
                    ].map((g, idx) => (
                      <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{g.nama}</div>
                          <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>{g.peran}</div>
                        </div>
                        <a
                          href={`https://wa.me/${g.hp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ecfdf5',
                            color: '#059669',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textDecoration: 'none'
                          }}
                        >
                          <Phone size={13} /> Chat WA
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. PERIZINAN SANTRI */}
                {activeModal === 'perizinan' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {perizinan.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <DoorOpen size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>Belum Ada Riwayat Perizinan</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Santri saat ini berada di dalam lingkungan pondok pesantren.</div>
                      </div>
                    ) : (
                      perizinan.map((row, idx) => (
                        <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0284c7' }}>{row.kode_izin || `IZN-${idx + 1}`}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{row.jenis_izin || 'Izin Pulang'}</div>
                            </div>
                            <span className={`badge ${row.status === 'Kembali Tepat Waktu' ? 'badge-success' : (row.status === 'Aktif Keluar' ? 'badge-warning' : 'badge-info')}`}>
                              {row.status || 'Disetujui'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#334155', marginBottom: '6px' }}>
                            <strong>Keperluan:</strong> {row.keperluan || 'Keperluan keluarga'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                            <div>Keluar: <strong>{row.tgl_keluar_rencana ? String(row.tgl_keluar_rencana).split('T')[0] : '-'}</strong></div>
                            <div>Kembali: <strong>{row.tgl_kembali_rencana ? String(row.tgl_kembali_rencana).split('T')[0] : '-'}</strong></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 7. PELANGGARAN & DISIPLIN */}
                {activeModal === 'pelanggaran' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pelanggaran.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0' }}>
                        <CheckCircle size={36} color="#059669" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#065f46' }}>Alhamdulillah, Catatan Bersih!</div>
                        <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '4px' }}>Santri selalu tertib dan disiplin mengikuti tata tertib pesantren.</div>
                      </div>
                    ) : (
                      pelanggaran.map((row, idx) => (
                        <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className={`badge ${row.kategori === 'Berat' ? 'badge-danger' : 'badge-warning'}`}>
                              Kategori: {row.kategori || 'Ringan'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 700, marginBottom: '4px' }}>
                            Bentuk Ta'zir Mendidik:
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#475569', background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                            {row.bentuk_tazir || 'Membaca Al-Qur\'an di Masjid pondok'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                            <span>Status: <strong style={{ color: '#059669' }}>{row.status_tazir || 'Selesai Ta\'zir'}</strong></span>
                            <span>Musyrif: {row.musyrif_pencatat || 'Musyrif Keamanan'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 8. ABSENSI & PRESENSI SHOLAT */}
                {activeModal === 'absensi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Status Pill Switcher */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {['Semua', 'Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                        <button
                          key={st}
                          onClick={() => setAbsensiStatusFilter(st)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: absensiStatusFilter === st ? '#0284c7' : '#f1f5f9',
                            color: absensiStatusFilter === st ? '#ffffff' : '#475569'
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    {presensi.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <Fingerprint size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155' }}>Belum Ada Data Presensi</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Data scan mesin fingerprint sholat berjamaah akan otomatis muncul di sini.</div>
                      </div>
                    ) : (
                      presensi
                        .filter(row => {
                          if (absensiStatusFilter === 'Semua') return true;
                          return (row.status || '').toLowerCase().includes(absensiStatusFilter.toLowerCase());
                        })
                        .map((row, idx) => (
                          <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>{row.nama_sesi || 'Shalat Subuh Berjamaah'}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</span>
                                <span>•</span>
                                <span style={{ color: '#059669', fontWeight: 600 }}>{row.waktu_scan || 'Tepat Waktu'}</span>
                              </div>
                            </div>
                            <span className={`badge ${String(row.status).includes('Hadir') ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                              {row.status || 'Hadir'}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* 9. HAFALAN TAHFIDZ */}
                {activeModal === 'hafalan' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: '#ffffff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>TOTAL CAPAIAN HAFALAN</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{santri.capaian_hafalan_juz || 0} Juz Al-Qur'an</div>
                      </div>
                      <Sparkles size={32} opacity={0.8} />
                    </div>

                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>Riwayat Setoran Ziyadah & Muroja'ah:</div>
                    {tahfidz.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Belum ada catatan setoran tahfidz untuk santri ini.</div>
                      </div>
                    ) : (
                      tahfidz.map((row, idx) => (
                        <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span className="badge badge-purple" style={{ fontWeight: 800 }}>Juz {row.juz || 1} • {row.jenis_setoran || 'Ziyadah'}</span>
                            <span className="badge badge-success" style={{ fontWeight: 800 }}>{row.nilai_akhir ? `Nilai: ${row.nilai_akhir}` : (row.predikat || 'Mumtaz')}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                            {row.surat_mulai || 'Surat Al-Baqarah'} s/d {row.surat_selesai || '-'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                            Penyimak: {row.nama_penyimak || 'Ust. Pembina Tahfidz'} • {row.tanggal ? String(row.tanggal).split('T')[0] : '-'}
                          </div>
                          {row.catatan && (
                            <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', marginTop: '6px' }}>
                              "{row.catatan}"
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 10. UJIAN PRAKTEK IBADAH */}
                {activeModal === 'praktek' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                      Hasil evaluasi praktek ibadah praktis santri:
                    </div>
                    {praktek.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Belum ada hasil ujian praktek ibadah santri.</div>
                      </div>
                    ) : (
                      praktek.map((row, idx) => {
                        const isLulus = row.status === 'Lulus';
                        return (
                          <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>{row.kategori || row.nama_praktek || 'Praktek Sholat Fardhu'}</span>
                              <span className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                                {isLulus ? 'LULUS' : 'MENGULANG'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                              {row.deskripsi || row.catatan_perbaikan || 'Sesuai kaifiyah dan sunnah yang diajarkan di pondok.'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px' }}>
                              Penguji: {row.nama_penguji || 'Ust. Penguji'} • {row.tanggal_ujian ? String(row.tanggal_ujian).split('T')[0] : '-'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* 11. KEAMANAN & PASSWORD WALI */}
                {activeModal === 'keamanan' && (
                  <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px 12px', fontSize: '0.74rem', color: '#166534', lineHeight: 1.4 }}>
                      🔒 Atur username dan password khusus untuk Bapak/Ibu Wali Santri agar login lebih mudah dan aman.
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Username Login Wali
                      </label>
                      <input
                        type="text"
                        value={passwordForm.username_baru}
                        onChange={(e) => setPasswordForm({ ...passwordForm, username_baru: e.target.value })}
                        style={inputFieldStyle}
                        placeholder="Contoh: waliahmad"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Password Baru
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={passwordForm.password_baru}
                          onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                          style={inputFieldStyle}
                          placeholder="Minimal 4 karakter"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={passwordForm.konfirmasi_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                        style={inputFieldStyle}
                        placeholder="Ulangi password baru"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingPass}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <Save size={16} />
                      {updatingPass ? 'Menyimpan...' : 'Simpan Kredensial Akun'}
                    </button>
                  </form>
                )}

                {/* 12. NOTIFIKASI PESANTREN */}
                {activeModal === 'notifikasi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { judul: 'Presensi Subuh Berjamaah', pesan: 'Alhamdulillah, presensi shalat Subuh berjamaah santri telah diverifikasi asatidz pembina.', waktu: 'Hari ini • 05:15 WIB' },
                      { judul: 'Maklumat Kepulangan Santri', pesan: 'Bagi santri yang mengajukan izin kepulangan akhir bulan, mohon konfirmasi melalui pembina kobong.', waktu: 'Kemarin • 14:00 WIB' },
                      { judul: 'Setoran Tahfidz Ziyadah', pesan: 'Ananda berhasil menyelesaikan ziyadah hafalan Al-Qur\'an dengan nilai Mumtaz.', waktu: '2 hari lalu' }
                    ].map((n, idx) => (
                      <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{n.judul}</span>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{n.waktu}</span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                          {n.pesan}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <button
                  onClick={() => setActiveModal(null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tutup Tampilan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Inline Styles & Helpers
const countBadgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: '#ef4444',
  color: '#ffffff',
  fontSize: '0.66rem',
  fontWeight: 800,
  minWidth: '18px',
  height: '18px',
  borderRadius: '9px',
  padding: '0 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ffffff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
};

const menuCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  userSelect: 'none'
};

const squircleIconStyle = {
  width: '58px',
  height: '58px',
  borderRadius: '20px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease'
};

const menuLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#334155',
  textAlign: 'center',
  lineHeight: 1.2,
  maxWidth: '74px',
  wordBreak: 'break-word',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const infoCardBox = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
};

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.78rem',
  gap: '8px'
};

const infoLabel = {
  color: '#64748b',
  fontWeight: 500
};

const infoValue = {
  color: '#0f172a',
  fontWeight: 700,
  textAlign: 'right'
};

const inputFieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box'
};
