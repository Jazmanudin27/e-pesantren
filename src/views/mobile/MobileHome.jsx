import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Fingerprint,
  BookOpen, 
  DoorOpen, 
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  Clock,
  Key,
  Bell,
  LogOut,
  Check,
  Building2,
  Calendar,
  Send,
  UserCheck,
  Award,
  Layers,
  Sparkles,
  PieChart,
  User,
  HeartPulse,
  AlertTriangle,
  HeartHandshake,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  Filter
} from 'lucide-react';
import { showSuccess, showConfirm } from '../../utils/alert.util';

export default function MobileHome({ onChangeTab, onLogout }) {
  const [stats, setStats] = useState({
    total_santri: 0,
    total_halaqah: 0,
    total_izin_aktif: 0
  });

  const [rekapAbsensi, setRekapAbsensi] = useState({
    hadir: 0,
    sakit: 0,
    izin: 0,
    alfa: 0,
    total: 0
  });

  // Modal State untuk Detail Absensi Hari Ini
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState('Hadir'); // 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [selectedKegiatan, setSelectedKegiatan] = useState('Semua'); // 'Semua' | nama_sesi
  const [sesiList, setSesiList] = useState([]);
  const [todayAbsensiList, setTodayAbsensiList] = useState([]);
  const [searchModalText, setSearchModalText] = useState('');

  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const rawName = sessionData.nama || sessionData.username || 'Dina Saparinda, S.Kom';
  const displayName = rawName.includes('_') ? rawName.replace('_', ' ') : rawName;
  const initial = displayName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'DS';

  // Live Clock & Greeting
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

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const normalizeDateStr = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'string') {
      const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  };

  const simplifyStatus = (st) => {
    if (!st) return 'Hadir';
    const s = String(st).toLowerCase();
    if (s.includes('hadir') || s.includes('tepat') || s.includes('terlambat')) return 'Hadir';
    if (s.includes('sakit')) return 'Sakit';
    if (s.includes('izin')) return 'Izin';
    if (s.includes('alpa') || s.includes('alfa') || s.includes('tanpa') || s.includes('teledor')) return 'Alfa';
    return 'Hadir';
  };

  // Fetch real data (Dashboard Stats & Absensi Hari Ini)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resStats, resAbs, resSesi, resIzin] = await Promise.all([
          axios.get('/api/dashboard/stats').catch(() => null),
          axios.get('/api/absensi/fingerprint').catch(() => null),
          axios.get('/api/absensi/sesi').catch(() => null),
          axios.get('/api/perizinan').catch(() => null)
        ]);

        if (resSesi?.data?.data && Array.isArray(resSesi.data.data)) {
          setSesiList(resSesi.data.data);
        }

        let combinedTodayLogs = [];
        const todayStr = getTodayDateStr();

        // 1. Data dari endpoint dashboard stats
        if (resStats?.data?.success) {
          if (resStats.data.stats) setStats(resStats.data.stats);
          if (Array.isArray(resStats.data.absensi_today_list)) {
            combinedTodayLogs = [...resStats.data.absensi_today_list];
          }
        }

        // 2. Data dari endpoint absensi fingerprint jika ada
        if (resAbs?.data?.data && Array.isArray(resAbs.data.data)) {
          const absToday = resAbs.data.data.filter(l => normalizeDateStr(l.tanggal) === todayStr);
          absToday.forEach(item => {
            const exists = combinedTodayLogs.some(ex => 
              (ex.id && ex.id === item.id) || 
              (ex.santri_id === item.santri_id && ex.sesi_id === item.sesi_id)
            );
            if (!exists) {
              combinedTodayLogs.push(item);
            }
          });
        }

        // 3. Gabung dengan localStorage jika offline/mock
        try {
          const localLogs = JSON.parse(localStorage.getItem('mobile_presensi_logs') || '[]');
          const localToday = localLogs.filter(l => normalizeDateStr(l.tanggal) === todayStr);
          localToday.forEach(item => {
            const exists = combinedTodayLogs.some(ex => 
              (ex.id && ex.id === item.id) || 
              (ex.santri_id === item.santri_id && ex.sesi_id === item.sesi_id)
            );
            if (!exists) {
              combinedTodayLogs.push(item);
            }
          });
        } catch (e) {}

        // 4. Sinkronkan santri dengan izin aktif/kembali hari ini dari perizinan
        try {
          let izinItems = [];
          if (resIzin?.data?.data && Array.isArray(resIzin.data.data)) {
            izinItems = [...resIzin.data.data];
          }
          const localIzin = JSON.parse(localStorage.getItem('mobile_izin_list') || '[]');
          if (Array.isArray(localIzin)) {
            localIzin.forEach(item => {
              const exists = izinItems.some(ex => ex.id === item.id || (ex.santri_id === item.santri_id && ex.tgl_keluar_rencana === item.tgl_keluar_rencana));
              if (!exists) izinItems.push(item);
            });
          }

          izinItems.forEach(sp => {
            const st = String(sp.status || '').toLowerCase();
            if (st.includes('tolak') || st.includes('batal')) return;

            const tglMulai = normalizeDateStr(sp.tgl_keluar_aktual || sp.tgl_keluar_rencana);
            const isReturned = st.includes('kembali') && !st.includes('terlambat');
            const tglSelesai = normalizeDateStr(
              (isReturned && sp.tgl_kembali_aktual) ? sp.tgl_kembali_aktual : (sp.tgl_kembali_rencana || sp.tgl_kembali_aktual)
            );

            if (tglMulai && todayStr < tglMulai) return;
            if (tglSelesai && todayStr > tglSelesai && !st.includes('terlambat')) return;

            const isSakit = (sp.jenis_izin || '').toLowerCase().includes('sakit') ||
                            (sp.jenis_izin || '').toLowerCase().includes('berobat') ||
                            (sp.keperluan || '').toLowerCase().includes('sakit');
            const finalStatus = isSakit ? 'Sakit' : 'Izin';

            const existingIdx = combinedTodayLogs.findIndex(l => 
              (l.santri_id && l.santri_id === sp.santri_id) || 
              (l.nama_santri && sp.nama_santri && l.nama_santri.toLowerCase() === sp.nama_santri.toLowerCase())
            );

            const izinObj = {
              id: `izin-${sp.id}`,
              santri_id: sp.santri_id,
              nama_santri: sp.nama_santri,
              nis: sp.nis,
              nama_asrama: sp.nama_asrama || '-',
              nama_kamar: sp.nama_kamar || '-',
              tanggal: todayStr,
              waktu_scan: '00:00:00',
              status_kehadiran: finalStatus,
              status: finalStatus,
              metode_scan: 'Perizinan',
              metode_presensi: 'Perizinan',
              keterangan: `Perizinan ${sp.jenis_izin || 'Pulang'} (${sp.keperluan || sp.status || 'Disetujui'})`,
              nama_sesi: 'Semua Kegiatan (Perizinan Pulang/Sakit)',
              kategori: 'Perizinan',
              is_perizinan_auto: true
            };

            if (existingIdx === -1) {
              combinedTodayLogs.push(izinObj);
            } else {
              const cur = simplifyStatus(combinedTodayLogs[existingIdx].status_kehadiran || combinedTodayLogs[existingIdx].status);
              if (cur !== 'Izin' && cur !== 'Sakit') {
                combinedTodayLogs[existingIdx] = { ...combinedTodayLogs[existingIdx], ...izinObj };
              }
            }
          });
        } catch (e) {}

        setTodayAbsensiList(combinedTodayLogs);

        // Hitung count hari ini
        const hadirCount = combinedTodayLogs.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Hadir').length;
        const sakitCount = combinedTodayLogs.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Sakit').length;
        const izinCount = combinedTodayLogs.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Izin').length;
        const alfaCount = combinedTodayLogs.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Alfa').length;

        if (combinedTodayLogs.length > 0) {
          setRekapAbsensi({
            hadir: hadirCount,
            sakit: sakitCount,
            izin: izinCount,
            alfa: alfaCount,
            total: hadirCount + sakitCount + izinCount + alfaCount
          });
        } else if (resStats?.data?.rekap_absensi) {
          setRekapAbsensi(resStats.data.rekap_absensi);
        }
      } catch (e) {
        console.warn('Dashboard loadData fallback:', e);
      }
    };
    loadData();
  }, []);

  const handleOpenStatusModal = (status) => {
    setSelectedStatusTab(status);
    setSelectedKegiatan('Semua');
    setSearchModalText('');
    setIsDetailModalOpen(true);
  };

  const handleOpenNotice = () => {
    showSuccess(
      'Pemberitahuan Pesantren',
      'Seluruh kegiatan santri terpantau realtime. Presensi jamaah Subuh telah ditutup otomatis.'
    );
  };

  const handleOpenAccountInfo = () => {
    showSuccess(
      'Informasi Akun',
      `Login: ${sessionData.username || 'admin'} • Peran: ${sessionData.userType || 'Ustadz / Guru'}`
    );
  };

  // Daftar semua nama kegiatan yang tersedia hari ini
  const availableKegiatanList = Array.from(new Set([
    ...todayAbsensiList.map(item => item.nama_sesi || item.kegiatan).filter(Boolean),
    ...sesiList.map(s => s.nama_sesi).filter(Boolean)
  ]));

  // Data terfilter berdasarkan sesi kegiatan yang dipilih di modal
  const logsForSelectedKegiatan = selectedKegiatan === 'Semua'
    ? todayAbsensiList
    : todayAbsensiList.filter(item => (item.nama_sesi || item.kegiatan || '').toLowerCase() === selectedKegiatan.toLowerCase());

  // Count dinamis pada tab status sesuai filter kegiatan
  const modalHadirCount = logsForSelectedKegiatan.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Hadir').length;
  const modalSakitCount = logsForSelectedKegiatan.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Sakit').length;
  const modalIzinCount = logsForSelectedKegiatan.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Izin').length;
  const modalAlfaCount = logsForSelectedKegiatan.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Alfa').length;

  // Filter daftar santri untuk modal berdasarkan status tab, kegiatan, dan search keyword
  const filteredModalList = logsForSelectedKegiatan.filter(item => {
    const itemStatus = simplifyStatus(item.status_kehadiran || item.status);
    if (itemStatus.toLowerCase() !== selectedStatusTab.toLowerCase()) return false;

    if (!searchModalText.trim()) return true;
    const q = searchModalText.toLowerCase();
    const nama = (item.nama_santri || '').toLowerCase();
    const nis = (item.nis || '').toLowerCase();
    const asrama = (item.nama_asrama || '').toLowerCase();
    const kamar = (item.nama_kamar || '').toLowerCase();
    const sesi = (item.nama_sesi || item.kegiatan || '').toLowerCase();
    return nama.includes(q) || nis.includes(q) || asrama.includes(q) || kamar.includes(q) || sesi.includes(q);
  });

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      paddingBottom: '28px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* =========================================================================
          TOP ROYAL BLUE GRADIENT BANNER
      ========================================================================= */}
      <div style={{
        background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 40%, #1e40af 100%)',
        padding: '16px 16px 36px',
        color: '#ffffff',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        position: 'relative'
      }}>
        {/* Top App Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
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
              <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
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
            {/* Key Button (Cyan) */}
            <button
              onClick={handleOpenAccountInfo}
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
              title="Informasi Kunci"
            >
              <Key size={17} />
            </button>

            {/* Notification Bell (Blue with Red Dot) */}
            <button
              onClick={handleOpenNotice}
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
              title="Notifikasi"
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
              onClick={onLogout}
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

        {/* Profile Card & Greeting */}
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
              {displayName}
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
              <span>{currentDateStr || 'Jumat, 9 Okt 2026'}</span>
              <span>•</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span>{currentTimeStr || '09:30:28 WIB'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REKAP ABSENSI SANTRI: HADIR, SAKIT, IZIN, ALFA (ELEVATED WHITE CARD)
          (Mirip Screenshot E-Sekolah, tanpa banner Absen Masuk/Pulang)
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
              onClick={() => handleOpenStatusModal('Hadir')}
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
                {/* Count badge top-right */}
                {rekapAbsensi.hadir > 0 && (
                  <span style={countBadgeStyle}>
                    {rekapAbsensi.hadir}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Hadir
              </span>
            </div>

            {/* 2. SAKIT */}
            <div
              onClick={() => handleOpenStatusModal('Sakit')}
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
                {rekapAbsensi.sakit > 0 && (
                  <span style={countBadgeStyle}>
                    {rekapAbsensi.sakit}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Sakit
              </span>
            </div>

            {/* 3. IZIN */}
            <div
              onClick={() => handleOpenStatusModal('Izin')}
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
                {rekapAbsensi.izin > 0 && (
                  <span style={countBadgeStyle}>
                    {rekapAbsensi.izin}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                Izin
              </span>
            </div>

            {/* 4. ALFA */}
            <div
              onClick={() => handleOpenStatusModal('Alfa')}
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
                {rekapAbsensi.alfa > 0 && (
                  <span style={countBadgeStyle}>
                    {rekapAbsensi.alfa}
                  </span>
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
          SQUIRCLE GRID MENU: FITUR RESMI RUANG SANTRI
          (Santri, Asrama, Kelas, Kitab, Guru, Perizinan, Pelanggaran, Absensi Kegiatan, Hafalan)
          4 Kolom responsif, tema pesantren elegan & dinamis
      ========================================================================= */}
      <div className="mobile-squircle-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px 8px',
        padding: '24px 14px 14px'
      }}>
        {/* 1. Santri */}
        <div onClick={() => onChangeTab('master-santri')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 8px 16px -2px rgba(37, 99, 235, 0.35)' }}>
            <Users size={26} />
          </div>
          <span style={menuLabelStyle}>Santri</span>
        </div>

        {/* 2. Asrama */}
        <div onClick={() => onChangeTab('master-asrama')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 8px 16px -2px rgba(99, 102, 241, 0.35)' }}>
            <Building size={26} />
          </div>
          <span style={menuLabelStyle}>Asrama</span>
        </div>

        {/* 3. Kelas */}
        <div onClick={() => onChangeTab('master-kelas')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 16px -2px rgba(245, 158, 11, 0.35)' }}>
            <Layers size={26} />
          </div>
          <span style={menuLabelStyle}>Kelas</span>
        </div>

        {/* 4. Kitab */}
        <div onClick={() => onChangeTab('kitab')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 8px 16px -2px rgba(5, 150, 105, 0.35)' }}>
            <BookOpen size={26} />
          </div>
          <span style={menuLabelStyle}>Kitab</span>
        </div>

        {/* 5. Guru (Asatidz) */}
        <div onClick={() => onChangeTab('master-asatidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0d9488, #0f766e)', boxShadow: '0 8px 16px -2px rgba(13, 148, 136, 0.35)' }}>
            <UserCheck size={26} />
          </div>
          <span style={menuLabelStyle}>Guru</span>
        </div>

        {/* 6. Perizinan */}
        <div onClick={() => onChangeTab('perizinan')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #ea580c, #c2410c)', boxShadow: '0 8px 16px -2px rgba(234, 88, 12, 0.35)' }}>
            <DoorOpen size={26} />
          </div>
          <span style={menuLabelStyle}>Perizinan</span>
        </div>

        {/* 7. Pelanggaran (Tata Tertib & Ta'zir) */}
        <div onClick={() => onChangeTab('tata-tertib')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #e11d48, #be123c)', boxShadow: '0 8px 16px -2px rgba(225, 29, 72, 0.35)' }}>
            <ShieldAlert size={26} />
          </div>
          <span style={menuLabelStyle}>Pelanggaran</span>
        </div>

        {/* 8. Absensi (Berjamaah, Mengaji, dll) */}
        <div onClick={() => onChangeTab('presensi')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 8px 16px -2px rgba(2, 132, 199, 0.35)' }}>
            <Fingerprint size={26} />
          </div>
          <span style={menuLabelStyle}>Absensi</span>
        </div>

        {/* 9. Hafalan (Tahfidz & Muroja'ah) */}
        <div onClick={() => onChangeTab('tahfidz')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 8px 16px -2px rgba(139, 92, 246, 0.35)' }}>
            <Sparkles size={26} />
          </div>
          <span style={menuLabelStyle}>Hafalan</span>
        </div>

        {/* 10. Praktek (Sholat, Wudhu, Doa) */}
        <div onClick={() => onChangeTab('praktek-ibadah')} style={menuCardStyle}>
          <div style={{ ...squircleIconStyle, background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 16px -2px rgba(16, 185, 129, 0.35)' }}>
            <HeartHandshake size={26} />
          </div>
          <span style={menuLabelStyle}>Praktek</span>
        </div>
      </div>

      {/* =========================================================================
          MODAL DETAIL PRESENSI SANTRI HARI INI (HADIR, SAKIT, IZIN, ALFA)
      ========================================================================= */}
      {isDetailModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          padding: 0
        }}>
          {/* Backdrop click to close */}
          <div 
            onClick={() => setIsDetailModalOpen(false)}
            style={{ position: 'absolute', inset: 0 }}
          />

          {/* Modal Bottom Sheet Container */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '430px',
            width: '100%',
            maxHeight: '86vh',
            background: '#ffffff',
            borderTopLeftRadius: '26px',
            borderTopRightRadius: '26px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden'
          }}>
            {/* Top Drag Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '4px' }} />
            </div>

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 18px 12px',
              borderBottom: '1px solid #f1f5f9'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Santri {selectedStatusTab} Hari Ini
                </h3>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={13} color="#0284c7" />
                  <span>{currentDateStr || 'Hari ini'}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>
                    {filteredModalList.length} Santri
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Pills Selector inside modal */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              padding: '10px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              {[
                { key: 'Hadir', count: modalHadirCount, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
                { key: 'Sakit', count: modalSakitCount, color: '#ef4444', bg: '#fef2f2', border: '#fecdd3' },
                { key: 'Izin', count: modalIzinCount, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                { key: 'Alfa', count: modalAlfaCount, color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' }
              ].map(st => {
                const isActive = selectedStatusTab === st.key;
                return (
                  <button
                    key={st.key}
                    onClick={() => setSelectedStatusTab(st.key)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '12px',
                      border: isActive ? `2px solid ${st.color}` : '1px solid #e2e8f0',
                      background: isActive ? st.bg : '#ffffff',
                      color: isActive ? st.color : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 800 : 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{st.key}</span>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: isActive ? st.color : '#0f172a'
                    }}>
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Bar: Dropdown Filter Kegiatan & Search Input */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Dropdown Filter Sesi Kegiatan */}
              <div style={{
                position: 'relative',
                background: selectedKegiatan === 'Semua' ? '#f8fafc' : '#eff6ff',
                borderRadius: '12px',
                border: selectedKegiatan === 'Semua' ? '1.5px solid #e2e8f0' : '1.5px solid #0284c7',
                transition: 'all 0.15s ease'
              }}>
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 34px 9px 12px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: selectedKegiatan === 'Semua' ? '#334155' : '#0369a1',
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Semua">🕌 Semua Sesi Kegiatan ({todayAbsensiList.length} Santri)</option>
                  {availableKegiatanList.map((kg) => {
                    const countInKg = todayAbsensiList.filter(l => (l.nama_sesi || l.kegiatan || '').toLowerCase() === kg.toLowerCase()).length;
                    return (
                      <option key={kg} value={kg}>
                        {kg} ({countInKg} santri)
                      </option>
                    );
                  })}
                </select>
                <ChevronDown
                  size={15}
                  color={selectedKegiatan === 'Semua' ? '#64748b' : '#0284c7'}
                  style={{
                    position: 'absolute',
                    right: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                />
              </div>

              {/* Search Filter Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '8px 12px'
              }}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder={`Cari nama, NIS, atau asrama santri ${selectedStatusTab}...`}
                  value={searchModalText}
                  onChange={(e) => setSearchModalText(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.78rem',
                    width: '100%',
                    color: '#0f172a'
                  }}
                />
                {searchModalText && (
                  <button
                    onClick={() => setSearchModalText('')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} color="#94a3b8" />
                  </button>
                )}
              </div>
            </div>

            {/* List Santri */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '220px'
            }}>
              {filteredModalList.length === 0 ? (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    color: '#64748b'
                  }}>
                    <Users size={22} />
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Belum Ada Santri {selectedStatusTab} Hari Ini
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', maxWidth: '280px', margin: '0 auto' }}>
                    Data presensi otomatis diperbarui saat musyrif mencatat kehadiran santri.
                  </div>
                </div>
              ) : (
                filteredModalList.map((santri, idx) => {
                  const initial = (santri.nama_santri || 'Santri')
                    .replace(/[^a-zA-Z]/g, '')
                    .slice(0, 2)
                    .toUpperCase() || 'ST';

                  const badgeColor = selectedStatusTab === 'Hadir' ? '#059669' :
                    selectedStatusTab === 'Sakit' ? '#dc2626' :
                    selectedStatusTab === 'Izin' ? '#d97706' : '#0f766e';

                  const badgeBg = selectedStatusTab === 'Hadir' ? '#ecfdf5' :
                    selectedStatusTab === 'Sakit' ? '#fef2f2' :
                    selectedStatusTab === 'Izin' ? '#fffbeb' : '#f0fdfa';

                  const badgeBorder = selectedStatusTab === 'Hadir' ? '#a7f3d0' :
                    selectedStatusTab === 'Sakit' ? '#fecdd3' :
                    selectedStatusTab === 'Izin' ? '#fde68a' : '#99f6e4';

                  return (
                    <div
                      key={santri.id || idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: badgeBg,
                          color: badgeColor,
                          border: `1.5px solid ${badgeBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.84rem',
                          flexShrink: 0
                        }}>
                          {initial}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {santri.nama_santri || 'Nama Santri'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {santri.nis && <span>NIS: {santri.nis}</span>}
                            {santri.nama_asrama && (
                              <>
                                <span>•</span>
                                <span>{santri.nama_asrama}</span>
                              </>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} color="#94a3b8" />
                            <span>{santri.nama_sesi || santri.kegiatan || 'Sesi Terjadwal'}</span>
                            {santri.waktu_scan && (
                              <span>• {santri.waktu_scan} WIB</span>
                            )}
                          </div>
                          {(santri.keterangan || santri.keteledoran_keterangan) && (
                            <div style={{
                              fontSize: '0.68rem',
                              color: badgeColor,
                              background: badgeBg,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              marginTop: '4px',
                              display: 'inline-block'
                            }}>
                              Ket: {santri.keterangan || santri.keteledoran_keterangan}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '10px',
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        flexShrink: 0
                      }}>
                        {selectedStatusTab}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onChangeTab('presensi');
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <span>Kelola di Menu Absensi</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Style Reusable Helpers
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
