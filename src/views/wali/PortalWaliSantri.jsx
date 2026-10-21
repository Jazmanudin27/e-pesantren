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
  ChevronLeft,
  Shield,
  CheckCircle,
  MessageCircle,
  GraduationCap
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

  // Tab State: 'beranda' | 'perizinan' | 'absensi' | 'hafalan' | 'profile' | 'praktek' | 'pelanggaran' | 'notifikasi'
  const [currentTab, setCurrentTab] = useState('beranda');
  const [absensiStatusFilter, setAbsensiStatusFilter] = useState('Semua'); // 'Semua' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [profileSection, setProfileSection] = useState('semua'); // 'semua' | 'biodata' | 'asrama' | 'diniyah' | 'kitab' | 'asatidz' | 'keamanan'

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

  // Ambil daftar santri jika wali punya lebih dari 1 anak
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

  // Hitung status absensi santri
  const countHadir = presensi.filter(p => (p.status || '').toLowerCase().includes('hadir')).length;
  const countSakit = presensi.filter(p => (p.status || '').toLowerCase().includes('sakit')).length;
  const countIzin = perizinan.length || presensi.filter(p => (p.status || '').toLowerCase().includes('izin')).length;
  const countAlfa = presensi.filter(p => (p.status || '').toLowerCase().includes('alfa') || (p.status || '').toLowerCase().includes('absen')).length;

  const rawSantriName = santri.nama_santri || 'Santri Nurul Wafa';
  const initial = rawSantriName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'SW';

  const openAbsensiWithFilter = (status) => {
    setAbsensiStatusFilter(status);
    setCurrentTab('absensi');
  };

  // Kurikulum Kitab Kuning
  const kitabList = [
    { judul: 'Safinatun Najah', bidang: 'Fiqih Ibadah Praktis', status: 'Khatam Juz 1', badge: 'badge-success' },
    { judul: 'Jurumiyyah', bidang: 'Gramatika Bahasa Arab', status: 'Bab Kalam s/d I\'rab', badge: 'badge-info' },
    { judul: 'Taqrib / Fathul Qorib', bidang: 'Fiqih Lanjutan', status: 'Sedang Berjalan', badge: 'badge-warning' },
    { judul: 'Arbain Nawawiyah', bidang: 'Hadits Pilihan', status: 'Hafalan 20 Hadits', badge: 'badge-purple' },
    { judul: 'Aqidatul Awam', bidang: 'Tauhid & Aqidah Dasar', status: 'Khatam Mandiri', badge: 'badge-success' }
  ];

  // Dewan Asatidz Pembina
  const asatidzList = [
    { 
      nama: santri.pembina_asrama || 'Ust. Ahmad Fauzan, S.Pd.I', 
      peran: 'Pembina Kobong & Asrama', 
      hp: santri.no_hp_pembina || '+62 821-2345-6789' 
    },
    { 
      nama: santri.wali_kelas || 'Ust. Miftahurrahman, M.Pd', 
      peran: 'Wali Kelas Madrasah Diniyah', 
      hp: '+62 812-9876-5432' 
    },
    { 
      nama: 'Ust. Ridwan Kamil, Al-Hafidz', 
      peran: 'Musyrif Tahfidz Al-Qur\'an', 
      hp: '+62 857-1122-3344' 
    },
    { 
      nama: 'Ust. H. Abdurrahman', 
      peran: 'Musyrif Keamanan & Kedisiplinan', 
      hp: '+62 813-4455-6677' 
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Mobile Frame Container: 100% on phone, max 430px on desktop */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100vh',
        background: '#f8fafc',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '80px',
        boxSizing: 'border-box'
      }}>

        {/* =========================================================================
            1. BERANDA TAB (HOME VIEW)
        ========================================================================= */}
        {currentTab === 'beranda' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Royal Blue Gradient Banner */}
            <div style={{
              background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 40%, #1e40af 100%)',
              padding: '16px 16px 36px',
              color: '#ffffff',
              borderBottomLeftRadius: '28px',
              borderBottomRightRadius: '28px',
              position: 'relative'
            }}>
              {/* Header Top Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px'
              }}>
                {/* Brand Logo */}
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
                    WALI
                  </span>
                </div>

                {/* Top Action Buttons (Profile Shortcut, Notification, Logout) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Shortcut to Profile/Keamanan */}
                  <button
                    onClick={() => {
                      setProfileSection('keamanan');
                      setCurrentTab('profile');
                    }}
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
                    title="Pengaturan Kredensial Akun"
                  >
                    <Key size={17} />
                  </button>

                  {/* Notification Bell */}
                  <button
                    onClick={() => setCurrentTab('notifikasi')}
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

                  {/* Logout Button */}
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
                    title="Keluar Akun"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>

              {/* Santri Profile Summary Card */}
              <div 
                onClick={() => setCurrentTab('profile')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '16px',
                  transition: 'background 0.2s'
                }}
                title="Klik untuk membuka Profil Lengkap"
              >
                {/* Big Avatar */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '62px',
                    height: '62px',
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
                  {/* Status Indicator Dot */}
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

                {/* Details */}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#bae6fd', fontWeight: 600 }}>
                      Wali: {santri.nama_wali || 'Orang Tua Santri'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#e0f2fe', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '6px' }}>
                      Buka Profil &gt;
                    </span>
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

            {/* Rekap Absensi 4 Squircle Badges */}
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {/* Hadir */}
                  <div
                    onClick={() => openAbsensiWithFilter('Hadir')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
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
                      {countHadir > 0 && <span style={countBadgeStyle}>{countHadir}</span>}
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>Hadir</span>
                  </div>

                  {/* Sakit */}
                  <div
                    onClick={() => openAbsensiWithFilter('Sakit')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
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
                      {countSakit > 0 && <span style={countBadgeStyle}>{countSakit}</span>}
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>Sakit</span>
                  </div>

                  {/* Izin */}
                  <div
                    onClick={() => openAbsensiWithFilter('Izin')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
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
                      {countIzin > 0 && <span style={countBadgeStyle}>{countIzin}</span>}
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>Izin</span>
                  </div>

                  {/* Alfa */}
                  <div
                    onClick={() => openAbsensiWithFilter('Alfa')}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
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
                      {countAlfa > 0 && <span style={countBadgeStyle}>{countAlfa}</span>}
                    </div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>Alfa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Cepat Monitoring Beranda (6 Menu Operasional Harian) */}
            <div style={{ padding: '24px 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  Monitoring Aktivitas Santri
                </span>
                <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, cursor: 'pointer' }} onClick={() => setCurrentTab('profile')}>
                  Lihat Profil &gt;
                </span>
              </div>

              {/* Grid 3 Kolom Modern & Rapi */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px 10px'
              }}>
                {/* 1. Absensi Jamaah */}
                <div onClick={() => setCurrentTab('absensi')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 8px 16px -2px rgba(2, 132, 199, 0.35)' }}>
                    <Fingerprint size={26} />
                  </div>
                  <span style={menuLabelStyle}>Presensi Sholat</span>
                </div>

                {/* 2. Tahfidz Qur'an */}
                <div onClick={() => setCurrentTab('hafalan')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 16px -2px rgba(139, 92, 246, 0.35)' }}>
                    <Sparkles size={26} />
                  </div>
                  <span style={menuLabelStyle}>Tahfidz Qur'an</span>
                </div>

                {/* 3. Ujian Praktek */}
                <div onClick={() => setCurrentTab('praktek')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #10b981, #047857)', boxShadow: '0 8px 16px -2px rgba(16, 185, 129, 0.35)' }}>
                    <HeartHandshake size={26} />
                  </div>
                  <span style={menuLabelStyle}>Praktek Ibadah</span>
                </div>

                {/* 4. Perizinan */}
                <div onClick={() => setCurrentTab('perizinan')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 8px 16px -2px rgba(234, 88, 12, 0.35)' }}>
                    <DoorOpen size={26} />
                  </div>
                  <span style={menuLabelStyle}>Perizinan</span>
                </div>

                {/* 5. Catatan Disiplin / Pelanggaran */}
                <div onClick={() => setCurrentTab('pelanggaran')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 8px 16px -2px rgba(225, 29, 72, 0.35)' }}>
                    <ShieldAlert size={26} />
                  </div>
                  <span style={menuLabelStyle}>Kedisiplinan</span>
                </div>

                {/* 6. Pemberitahuan Pesantren */}
                <div onClick={() => setCurrentTab('notifikasi')} style={menuCardStyle}>
                  <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', boxShadow: '0 8px 16px -2px rgba(59, 130, 246, 0.35)' }}>
                    <Bell size={26} />
                  </div>
                  <span style={menuLabelStyle}>Pemberitahuan</span>
                </div>
              </div>
            </div>

            {/* Card Ringkasan Capaian Tahfidz & Kehadiran Terakhir */}
            <div style={{ padding: '8px 16px 12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                borderRadius: '18px',
                border: '1px solid #bbf7d0',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Capaian Tahfidz Terkini
                  </div>
                  <div style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    {santri.capaian_hafalan_juz || 0} Juz Al-Qur'an
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {tahfidz[0] ? `Setoran: ${tahfidz[0].surat_mulai || 'Juz'} (${tahfidz[0].predikat || 'Mumtaz'})` : 'Penyetoran rutin bada Subuh & Ashar'}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('hafalan')}
                  style={{
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Detail
                </button>
              </div>
            </div>

            {/* Quick Refresh Info Banner */}
            <div style={{ padding: '0 16px 16px' }}>
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

          </div>
        )}

        {/* =========================================================================
            2. PROFILE TAB (HALAMAN LENGKAP: BIODATA, ASRAMA, KELAS, KITAB, GURU, KEAMANAN)
        ========================================================================= */}
        {currentTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            
            {/* Top Navigation Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Kembali
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Profil Lengkap Santri
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            {/* Profile Santri Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
              borderRadius: '24px',
              padding: '20px 18px',
              color: '#ffffff',
              boxShadow: '0 10px 24px -4px rgba(2, 132, 199, 0.4)',
              marginBottom: '16px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '24px',
                background: '#ffffff',
                color: '#0284c7',
                fontSize: '1.6rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }}>
                {initial}
              </div>

              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                {santri.nama_santri || 'Ahmad Dani'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#bae6fd' }}>
                NIS: <strong>{santri.nis || '-'}</strong> • Kode: <strong>{santri.kode_santri || '-'}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: '999px' }}>
                  {santri.status || 'Aktif'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.22)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                  {santri.status_santri || 'Mukim di Pesantren'}
                </span>
              </div>

              {/* Santri Switcher Dropdown (bila wali punya anak lebih dari 1) */}
              {santriList.length > 1 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
                  <label style={{ fontSize: '0.7rem', color: '#e0f2fe', display: 'block', marginBottom: '4px' }}>
                    Ganti Santri yang Dipantau:
                  </label>
                  <select
                    value={selectedSantriId || ''}
                    onChange={(e) => handleSantriChange(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.25)',
                      border: '1px solid rgba(255,255,255,0.4)',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    {santriList.map(s => (
                      <option key={s.id} value={s.id} style={{ color: '#0f172a' }}>
                        {s.nama_santri} (NIS: {s.nis})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Section Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
              {[
                { id: 'semua', label: 'Semua Data' },
                { id: 'biodata', label: 'Biodata Santri' },
                { id: 'asrama', label: 'Asrama & Kobong' },
                { id: 'diniyah', label: 'Madrasah Diniyah' },
                { id: 'kitab', label: 'Kitab Kuning' },
                { id: 'asatidz', label: 'Dewan Asatidz' },
                { id: 'keamanan', label: 'Keamanan Akun' }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setProfileSection(pill.id)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: profileSection === pill.id ? '#0284c7' : '#ffffff',
                    color: profileSection === pill.id ? '#ffffff' : '#64748b',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* ===================================================================
                SECTION 1: BIODATA SANTRI & WALI
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'biodata') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} /> Biodata Santri & Orang Tua / Wali
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Nama Lengkap:</span>
                  <span style={infoValue}>{santri.nama_santri || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>NIS / Kode:</span>
                  <span style={infoValue}>{santri.nis || '-'} / {santri.kode_santri || '-'}</span>
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
                  <span style={infoLabel}>Nama Orang Tua / Wali:</span>
                  <span style={{ ...infoValue, color: '#0f172a', fontWeight: 800 }}>{santri.nama_wali || '-'} ({santri.hubungan_wali || 'Orang Tua'})</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>No. WhatsApp Wali:</span>
                  <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_wa_wali || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Alamat Rumah Asal:</span>
                  <span style={infoValue}>{santri.alamat_asal || 'Tasikmalaya, Jawa Barat'}</span>
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 2: PENEMPATAN ASRAMA & KOBONG
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'asrama') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} /> Penempatan Asrama & Kobong Santri
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
                  <span style={{ ...infoValue, color: '#0284c7', fontWeight: 700 }}>{santri.pembina_asrama || 'Ust. Ahmad Fauzan, S.Pd.I'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Kontak WhatsApp Pembina:</span>
                  <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_hp_pembina || '+62 821-2345-6789'}</span>
                </div>
                {/* Direct Action Button WhatsApp Pembina */}
                <a
                  href={`https://wa.me/${String(santri.no_hp_pembina || '6282123456789').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: '4px'
                  }}
                >
                  <MessageCircle size={15} /> Hubungi Pembina Kobong via WhatsApp
                </a>
              </div>
            )}

            {/* ===================================================================
                SECTION 3: TINGKAT MADRASAH DINIYAH & KELAS
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'diniyah') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={15} /> Jenjang Madrasah Diniyah & Kelas
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
                  <span style={infoLabel}>Jadwal Taklim & Belajar:</span>
                  <span style={infoValue}>Bada Subuh & Bada Maghrib</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Target Hafalan:</span>
                  <span style={infoValue}>30 Juz & Mutun Ilmiyyah</span>
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 4: KURIKULUM & KAJIAN KITAB KUNING
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'kitab') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} /> Kurikulum & Kajian Kitab Kuning
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {kitabList.map((k, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{k.judul}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{k.bidang}</div>
                      </div>
                      <span className={`badge ${k.badge}`} style={{ fontSize: '0.66rem' }}>{k.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 5: DEWAN ASATIDZ & MUSYRIF PEMBINA
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'asatidz') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} /> Dewan Asatidz & Musyrif Pembina
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {asatidzList.map((g, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{g.nama}</div>
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
                          padding: '5px 9px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={12} /> Chat WA
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 6: KEAMANAN & KREDENSIAL LOGIN WALI
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'keamanan') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} /> Pengaturan Kredensial Login Wali Santri
                </div>

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 10px', fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
                    🔒 Ganti username dan password khusus untuk Bapak/Ibu Wali Santri agar login lebih mudah dan aman.
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
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
                      borderRadius: '10px',
                      padding: '11px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Save size={15} />
                    {updatingPass ? 'Menyimpan...' : 'Simpan Kredensial Akun'}
                  </button>
                </form>
              </div>
            )}

            {/* Logout Button in Profile */}
            <button
              onClick={handleLogoutAction}
              style={{
                width: '100%',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Keluar dari Portal Wali Santri
            </button>

          </div>
        )}

        {/* =========================================================================
            3. PERIZINAN TAB
        ========================================================================= */}
        {currentTab === 'perizinan' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            {/* Header with Back */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Riwayat Perizinan
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {perizinan.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <DoorOpen size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Belum Ada Riwayat Perizinan</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Santri saat ini berada di dalam lingkungan pondok pesantren.</div>
                </div>
              ) : (
                perizinan.map((row, idx) => (
                  <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
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
          </div>
        )}

        {/* =========================================================================
            4. ABSENSI TAB (FINGERPRINT PRESENSI SHOLAT)
        ========================================================================= */}
        {currentTab === 'absensi' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            {/* Header with Back */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Presensi Sholat & Jamaah
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
              {['Semua', 'Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                <button
                  key={st}
                  onClick={() => setAbsensiStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: absensiStatusFilter === st ? '#0284c7' : '#ffffff',
                    color: absensiStatusFilter === st ? '#ffffff' : '#64748b',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Presensi List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {presensi.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <Fingerprint size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Belum Ada Data Presensi</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Data scan mesin fingerprint sholat berjamaah akan otomatis muncul di sini.</div>
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
                        <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>{row.nama_sesi || 'Shalat Berjamaah'}</div>
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
          </div>
        )}

        {/* =========================================================================
            5. TAHFIDZ TAB (HAFALAN AL-QUR'AN)
        ========================================================================= */}
        {currentTab === 'hafalan' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            {/* Header with Back */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Capaian Tahfidz Al-Qur'an
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            {/* Total Capaian Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>TOTAL CAPAIAN HAFALAN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{santri.capaian_hafalan_juz || 0} Juz Al-Qur'an</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>Penyimak Pembina Tahfidz</div>
              </div>
              <Sparkles size={36} opacity={0.8} />
            </div>

            {/* Setoran List */}
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
              Riwayat Setoran Ziyadah & Muroja'ah:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tahfidz.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Belum ada catatan setoran tahfidz untuk santri ini.</div>
                </div>
              ) : (
                tahfidz.map((row, idx) => (
                  <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-purple" style={{ fontWeight: 800 }}>Juz {row.juz || 1} • {row.jenis_setoran || 'Ziyadah'}</span>
                      <span className="badge badge-success" style={{ fontWeight: 800 }}>{row.nilai_akhir ? `Nilai: ${row.nilai_akhir}` : (row.predikat || 'Mumtaz')}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
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
          </div>
        )}

        {/* =========================================================================
            6. PRAKTEK IBADAH TAB
        ========================================================================= */}
        {currentTab === 'praktek' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Ujian Praktek Ibadah
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {praktek.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <HeartHandshake size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Belum Ada Hasil Ujian Praktek</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Evaluasi wudhu, sholat, dan kaifiyah ibadah santri akan ditampilkan di sini.</div>
                </div>
              ) : (
                praktek.map((row, idx) => {
                  const isLulus = row.status === 'Lulus';
                  return (
                    <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{row.kategori || row.nama_praktek || 'Praktek Sholat Fardhu'}</span>
                        <span className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                          {isLulus ? 'LULUS' : 'MENGULANG'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
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
          </div>
        )}

        {/* =========================================================================
            7. PELANGGARAN TAB (KEDISIPLINAN)
        ========================================================================= */}
        {currentTab === 'pelanggaran' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Catatan Kedisiplinan
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pelanggaran.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ecfdf5', borderRadius: '18px', border: '1px solid #a7f3d0' }}>
                  <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#065f46' }}>Alhamdulillah, Catatan Bersih!</div>
                  <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '4px' }}>Santri selalu tertib dan disiplin mengikuti tata tertib pesantren.</div>
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
                    <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, marginBottom: '4px' }}>
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
          </div>
        )}

        {/* =========================================================================
            8. NOTIFIKASI TAB (PEMBERITAHUAN PESANTREN)
        ========================================================================= */}
        {currentTab === 'notifikasi' && (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setCurrentTab('beranda')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Beranda
              </button>
              <h2 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                Pemberitahuan Pesantren
              </h2>
              <div style={{ width: '40px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { judul: 'Presensi Subuh Berjamaah Terverifikasi', pesan: 'Alhamdulillah, presensi shalat Subuh berjamaah santri telah diverifikasi oleh musyrif kobong.', waktu: 'Hari ini • 05:15 WIB' },
                { judul: 'Maklumat Izin Kepulangan Santri', pesan: 'Bagi santri yang berencana izin kepulangan akhir bulan, mohon konfirmasi dan verifikasi melalui pembina asrama.', waktu: 'Kemarin • 14:00 WIB' },
                { judul: 'Capaian Ziyadah Tahfidz Qur\'an', pesan: 'Alhamdulillah, ananda berhasil menyelesaikan setoran hafalan Al-Qur\'an dengan predikat Mumtaz.', waktu: '2 hari lalu' }
              ].map((n, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
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
          </div>
        )}

        {/* =========================================================================
            9. ELEVATED FLOATING WHITE BOTTOM NAVIGATION BAR
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          {/* 1. Beranda */}
          <button 
            className={`mobile-nav-item ${['beranda', 'praktek', 'pelanggaran', 'notifikasi'].includes(currentTab) ? 'active' : ''}`}
            onClick={() => setCurrentTab('beranda')}
          >
            <div className={`nav-icon-wrapper ${['beranda', 'praktek', 'pelanggaran', 'notifikasi'].includes(currentTab) ? 'active' : ''}`}>
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Izin */}
          <button 
            className={`mobile-nav-item ${currentTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('perizinan')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'perizinan' ? 'active' : ''}`}>
              <DoorOpen size={20} />
            </div>
            <span>Izin</span>
          </button>

          {/* 3. Center Floating Fingerprint FAB */}
          <button 
            className="mobile-fab-center"
            onClick={() => setCurrentTab('absensi')}
            title="Presensi Sholat Santri"
          >
            <div className="fab-inner-glow">
              <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
            </div>
          </button>

          {/* 4. Tahfidz */}
          <button 
            className={`mobile-nav-item ${currentTab === 'hafalan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('hafalan')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'hafalan' ? 'active' : ''}`}>
              <BookOpen size={20} />
            </div>
            <span>Tahfidz</span>
          </button>

          {/* 5. Profile */}
          <button 
            className={`mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'profile' ? 'active' : ''}`}>
              <User size={20} />
            </div>
            <span>Profile</span>
          </button>
        </nav>

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
  maxWidth: '82px',
  wordBreak: 'break-word',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const infoCardBox = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  padding: '16px',
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
