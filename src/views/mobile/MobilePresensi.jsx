import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  QrCode, 
  UserCheck, 
  Search, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Loader2, 
  Sparkles,
  Users,
  Building,
  Volume2,
  ChevronDown,
  UploadCloud,
  FileCheck,
  Check,
  AlertTriangle,
  History,
  ClipboardList,
  Filter
} from 'lucide-react';
import { showSuccess, showError, toastSuccess } from '../../utils/alert.util';

const DAFTAR_KEGIATAN = [
  { id: 1, nama: 'Shalat Shubuh Berjamaah', kategori: 'shalat', waktu: '04:30 - 05:30', tempat: 'Masjid Jami Utama' },
  { id: 2, nama: "Mengaji Qur'an / Halaqah Pagi", kategori: 'mengaji', waktu: '05:30 - 06:30', tempat: 'Aula Tahfidz' },
  { id: 3, nama: 'Shalat Dzuhur Berjamaah', kategori: 'shalat', waktu: '12:00 - 12:45', tempat: 'Masjid Jami Utama' },
  { id: 4, nama: 'Shalat Ashar Berjamaah', kategori: 'shalat', waktu: '15:15 - 16:00', tempat: 'Masjid Jami Utama' },
  { id: 5, nama: 'Kajian Kitab Kuning Sore', kategori: 'mengaji', waktu: '16:00 - 17:30', tempat: 'Serambi Masjid' },
  { id: 6, nama: 'Shalat Maghrib Berjamaah', kategori: 'shalat', waktu: '18:00 - 18:45', tempat: 'Masjid Jami Utama' },
  { id: 7, nama: 'Shalat Isya Berjamaah', kategori: 'shalat', waktu: '19:15 - 20:00', tempat: 'Masjid Jami Utama' },
  { id: 8, nama: 'Halaqah Mengaji Malam', kategori: 'mengaji', waktu: '20:00 - 21:30', tempat: 'Kamar Asrama & Aula' }
];

export default function MobilePresensi() {
  // Mode Utama: 'qr', 'manual', atau 'riwayat'
  const [activeMode, setActiveMode] = useState('qr');
  const [selectedKegiatan, setSelectedKegiatan] = useState(DAFTAR_KEGIATAN[0]);
  
  // Data State
  const [santriList, setSantriList] = useState([]);
  const [presensiLogs, setPresensiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchManual, setSearchManual] = useState('');

  // Riwayat State
  const [searchRiwayat, setSearchRiwayat] = useState('');
  const [filterStatusRiwayat, setFilterStatusRiwayat] = useState('Semua');
  
  // QR Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [lastScannedSantri, setLastScannedSantri] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const qrInstanceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sound Beep Generator (Web Audio API)
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  // Fetch Santri & Presensi Logs
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSantri, resAbs] = await Promise.all([
        axios.get('/api/santri'),
        axios.get('/api/absensi/fingerprint').catch(() => ({ data: { data: [] } }))
      ]);

      if (resSantri.data && resSantri.data.data) {
        setSantriList(resSantri.data.data);
      }

      if (resAbs.data && resAbs.data.data && resAbs.data.data.length > 0) {
        setPresensiLogs(resAbs.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_presensi_logs') || '[]');
        setPresensiLogs(saved);
      }
    } catch (err) {
      console.warn('Fallback data lokal:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_presensi_logs') || '[]');
      setPresensiLogs(saved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Script Loader untuk Html5Qrcode
  const loadHtml5QrcodeScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
      const existing = document.getElementById('html5-qrcode-cdn');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Html5Qrcode));
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.id = 'html5-qrcode-cdn';
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => resolve(window.Html5Qrcode);
      script.onerror = () => reject(new Error('Gagal memuat library QR Code'));
      document.body.appendChild(script);
    });
  };

  // Start Camera QR Scanner
  const startScanner = async () => {
    setCameraError('');
    try {
      const Html5QrcodeClass = await loadHtml5QrcodeScript();
      if (!Html5QrcodeClass) throw new Error('Library kamera tidak tersedia.');

      if (qrInstanceRef.current) {
        try {
          await qrInstanceRef.current.stop();
        } catch (e) {}
      }

      const html5QrCode = new Html5QrcodeClass('mobile-qr-reader');
      qrInstanceRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => handleQrDecoded(decodedText),
        () => {} // suppress frame drop errors
      );

      setScannerActive(true);
    } catch (err) {
      console.error('Kamera Error:', err);
      setCameraError('Izin kamera belum aktif atau tidak ditemukan. Gunakan tombol upload QR atau presensi manual.');
      setScannerActive(false);
    }
  };

  // Stop Camera Scanner
  const stopScanner = async () => {
    if (qrInstanceRef.current) {
      try {
        await qrInstanceRef.current.stop();
        qrInstanceRef.current.clear();
      } catch (e) {}
      qrInstanceRef.current = null;
    }
    setScannerActive(false);
  };

  // Toggle mode tab
  useEffect(() => {
    if (activeMode === 'qr') {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [activeMode]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Process decoded QR text
  const handleQrDecoded = (decodedText) => {
    if (scanCooldown) return;

    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 2200);

    const raw = String(decodedText).trim();
    let matchedSantri = null;

    // 1. Coba cocokkan dengan NIS
    matchedSantri = santriList.find(s => String(s.nis).trim() === raw);

    // 2. Coba cocokkan dengan ID jika format angka
    if (!matchedSantri) {
      matchedSantri = santriList.find(s => String(s.id) === raw);
    }

    // 3. Coba parse JSON jika barcode bawa payload objek
    if (!matchedSantri && (raw.startsWith('{') || raw.includes('nis'))) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.nis) matchedSantri = santriList.find(s => String(s.nis).trim() === String(parsed.nis).trim());
        if (!matchedSantri && parsed.id) matchedSantri = santriList.find(s => s.id === parsed.id);
      } catch (e) {}
    }

    // 4. Coba cocokkan dengan nama
    if (!matchedSantri) {
      matchedSantri = santriList.find(s => s.nama_santri.toLowerCase().includes(raw.toLowerCase()));
    }

    if (matchedSantri) {
      playBeep();
      setLastScannedSantri(matchedSantri);
      recordAttendance(matchedSantri, 'Hadir Tepat Waktu', 'QR Code');
      toastSuccess(`Presensi Masuk: ${matchedSantri.nama_santri}`);
    } else {
      showError('QR Code Tidak Dikenali', `Konten QR: "${raw}". Data santri tidak ditemukan.`);
    }
  };

  // Handle Scan from Image File
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const Html5QrcodeClass = await loadHtml5QrcodeScript();
      const html5QrCode = new Html5QrcodeClass('mobile-qr-reader-temp');
      const result = await html5QrCode.scanFile(file, true);
      handleQrDecoded(result);
    } catch (err) {
      showError('Gagal Baca QR', 'Gambar tidak memuat QR Code yang jelas.');
    }
  };

  // Simpan record presensi ke backend & localStorage
  const recordAttendance = async (santri, status = 'Hadir Tepat Waktu', metode = 'QR Code', ket = '') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    const payload = {
      santri_id: santri.id,
      sesi_id: selectedKegiatan.id,
      device_id: 1,
      tanggal: dateStr,
      waktu_scan: timeStr,
      status: status,
      status_kehadiran: status,
      metode_presensi: metode,
      metode_scan: metode,
      keterangan: ket,
      nama_santri: santri.nama_santri,
      kegiatan: selectedKegiatan.nama,
      tempat: selectedKegiatan.tempat
    };

    // Optimistic UI update
    const newRecord = {
      id: Date.now(),
      ...payload
    };

    setPresensiLogs(prev => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('mobile_presensi_logs', JSON.stringify(updated));
      return updated;
    });

    try {
      await axios.post('/api/absensi/fingerprint', payload);
    } catch (e) {
      // Data tetap tersimpan di lokal
    }
  };

  // Quick Action Manual Presensi per Santri
  const handleQuickManualAction = (santri, status) => {
    playBeep();
    recordAttendance(santri, status, 'Manual Musyrif');
    toastSuccess(`${santri.nama_santri}: ${status}`);
  };

  // Hapus log presensi
  const handleDeleteLog = (id) => {
    if (!window.confirm('Hapus riwayat presensi ini?')) return;
    setPresensiLogs(prev => {
      const updated = prev.filter(i => i.id !== id);
      localStorage.setItem('mobile_presensi_logs', JSON.stringify(updated));
      return updated;
    });
    axios.delete(`/api/absensi/fingerprint/${id}`).catch(() => {});
  };

  // Filter santri untuk tab manual
  const filteredSantri = santriList.filter(s => {
    const q = searchManual.toLowerCase();
    return s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q);
  });

  // Filter riwayat untuk tab riwayat
  const filteredRiwayat = presensiLogs.filter(log => {
    const q = searchRiwayat.toLowerCase();
    const matchSearch = (log.nama_santri || '').toLowerCase().includes(q) ||
      (log.kegiatan || '').toLowerCase().includes(q) ||
      (log.nis || '').toLowerCase().includes(q);

    const statusStr = String(log.status_kehadiran || log.status || 'Hadir');
    const matchStatus = 
      filterStatusRiwayat === 'Semua' ? true :
      statusStr.toLowerCase().includes(filterStatusRiwayat.toLowerCase());

    return matchSearch && matchStatus;
  });

  // Perhitungan statistik
  const countHadir = presensiLogs.filter(l => (l.status_kehadiran || l.status || '').toLowerCase().includes('hadir')).length;
  const countSakit = presensiLogs.filter(l => (l.status_kehadiran || l.status || '').toLowerCase().includes('sakit')).length;
  const countIzin = presensiLogs.filter(l => (l.status_kehadiran || l.status || '').toLowerCase().includes('izin')).length;
  const countAlpa = presensiLogs.filter(l => (l.status_kehadiran || l.status || '').toLowerCase().includes('alpa') || (l.status_kehadiran || l.status || '').toLowerCase().includes('alpha')).length;

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '14px 14px 40px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Hidden container for temp file scan */}
      <div id="mobile-qr-reader-temp" style={{ display: 'none' }} />

      {/* HEADER: Pemilih Kegiatan Pesantren */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e40af 100%)',
        borderRadius: '20px',
        padding: '16px',
        color: '#ffffff',
        marginBottom: '14px',
        boxShadow: '0 8px 22px -4px rgba(2, 132, 199, 0.4)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            letterSpacing: '0.04em'
          }}>
            SESI KEGIATAN AKTIF
          </span>
          <span style={{ fontSize: '0.72rem', color: '#bae6fd', fontWeight: 600 }}>
            {selectedKegiatan.waktu}
          </span>
        </div>

        {/* Dropdown Kegiatan */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedKegiatan.id}
            onChange={(e) => {
              const k = DAFTAR_KEGIATAN.find(x => x.id === parseInt(e.target.value));
              if (k) setSelectedKegiatan(k);
            }}
            style={{
              width: '100%',
              padding: '10px 36px 10px 12px',
              borderRadius: '12px',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 800,
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          >
            {DAFTAR_KEGIATAN.map(k => (
              <option key={k.id} value={k.id} style={{ color: '#0f172a', fontWeight: 700 }}>
                {k.nama} ({k.waktu})
              </option>
            ))}
          </select>
          <ChevronDown size={18} color="#ffffff" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#e0f2fe', marginTop: '8px' }}>
          <span>📍 {selectedKegiatan.tempat}</span>
          <span>•</span>
          <span>Santri: {santriList.length} Terdaftar</span>
        </div>
      </div>

      {/* 3 OPSI MODE PRESENSI (TAB TOGGLE: SCAN QR, MANUAL, RIWAYAT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        background: '#e2e8f0',
        borderRadius: '16px',
        padding: '4px',
        marginBottom: '16px',
        gap: '4px'
      }}>
        {/* Tab 1: Scan QR */}
        <button
          onClick={() => setActiveMode('qr')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 4px',
            borderRadius: '12px',
            border: 'none',
            background: activeMode === 'qr' ? '#ffffff' : 'transparent',
            color: activeMode === 'qr' ? '#0284c7' : '#64748b',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeMode === 'qr' ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <QrCode size={16} />
          <span>Scan QR</span>
        </button>

        {/* Tab 2: Manual */}
        <button
          onClick={() => setActiveMode('manual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 4px',
            borderRadius: '12px',
            border: 'none',
            background: activeMode === 'manual' ? '#ffffff' : 'transparent',
            color: activeMode === 'manual' ? '#059669' : '#64748b',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeMode === 'manual' ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <UserCheck size={16} />
          <span>Manual</span>
        </button>

        {/* Tab 3: Riwayat */}
        <button
          onClick={() => setActiveMode('riwayat')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '9px 4px',
            borderRadius: '12px',
            border: 'none',
            background: activeMode === 'riwayat' ? '#ffffff' : 'transparent',
            color: activeMode === 'riwayat' ? '#7c3aed' : '#64748b',
            fontWeight: 800,
            fontSize: '0.78rem',
            cursor: 'pointer',
            boxShadow: activeMode === 'riwayat' ? '0 4px 10px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease',
            position: 'relative',
            whiteSpace: 'nowrap'
          }}
        >
          <History size={16} />
          <span>Riwayat</span>
          {presensiLogs.length > 0 && (
            <span style={{
              background: activeMode === 'riwayat' ? '#7c3aed' : '#94a3b8',
              color: '#ffffff',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '999px',
              marginLeft: '2px'
            }}>
              {presensiLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SCAN QR CODE SANTRI
      ========================================================================= */}
      {activeMode === 'qr' && (
        <div>
          {/* Viewport Scanner Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '16px',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.06)',
            border: '1.5px solid #e2e8f0',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  Arahkan Kamera ke QR Santri
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Otomatis bersuara "beep" & menyimpan kehadiran
                </span>
              </div>
              <button
                onClick={startScanner}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  color: '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} /> Muat Ulang
              </button>
            </div>

            {/* Video Container */}
            <div style={{
              width: '100%',
              minHeight: '260px',
              borderRadius: '18px',
              overflow: 'hidden',
              background: '#0f172a',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div id="mobile-qr-reader" style={{ width: '100%' }} />

              {/* Laser overlay animation when active */}
              {scannerActive && (
                <div style={{
                  position: 'absolute',
                  top: '15%',
                  left: '10%',
                  right: '10%',
                  bottom: '15%',
                  border: '2px solid rgba(56, 189, 248, 0.65)',
                  borderRadius: '16px',
                  boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
                  pointerEvents: 'none'
                }} />
              )}
            </div>

            {cameraError && (
              <div style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginTop: '12px',
                textAlign: 'left'
              }}>
                {cameraError}
              </div>
            )}

            {/* Actions under camera */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={16} />
                <span>Upload QR / Foto</span>
              </button>

              {/* Simulator Test Scan button */}
              <button
                onClick={() => {
                  if (santriList.length > 0) {
                    const random = santriList[Math.floor(Math.random() * santriList.length)];
                    handleQrDecoded(random.nis || String(random.id));
                  } else {
                    handleQrDecoded('2024001');
                  }
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.3)'
                }}
              >
                <Sparkles size={16} />
                <span>Test Scan Santri</span>
              </button>
            </div>
          </div>

          {/* Last Scanned Santri Highlight Card */}
          {lastScannedSantri && (
            <div style={{
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: '18px',
              padding: '14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={28} strokeWidth={3} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', letterSpacing: '0.04em' }}>
                  BERHASIL DIABSEN (SCAN QR)
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#064e3b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lastScannedSantri.nama_santri}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#059669' }}>
                  NIS: {lastScannedSantri.nis} • {lastScannedSantri.nama_asrama || 'Asrama Pusat'}
                </div>
              </div>
            </div>
          )}

          {/* Quick link ke tab riwayat */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              onClick={() => setActiveMode('riwayat')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0284c7',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <History size={14} />
              <span>Lihat Rekap Seluruh Presensi di Tab Riwayat &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRESENSI MANUAL SANTRI (CEPAT & CHECKLIST)
      ========================================================================= */}
      {activeMode === 'manual' && (
        <div>
          {/* Search Bar Santri */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '2px 12px',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, atau asrama..."
              value={searchManual}
              onChange={(e) => setSearchManual(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
            {searchManual && (
              <X size={16} color="#94a3b8" onClick={() => setSearchManual('')} style={{ cursor: 'pointer' }} />
            )}
          </div>

          {/* List Santri dengan Quick Button Hadir, Sakit, Izin, Alfa */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {filteredSantri.map((santri) => {
              // Cek apakah santri ini sudah absen pada kegiatan ini hari ini
              const existingLog = presensiLogs.find(l => 
                (l.santri_id === santri.id || l.nama_santri === santri.nama_santri) &&
                (l.sesi_id === selectedKegiatan.id || l.kegiatan === selectedKegiatan.nama)
              );

              return (
                <div
                  key={santri.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1.5px solid #f1f5f9',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                        {santri.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        NIS: {santri.nis || '-'} • {santri.nama_asrama || 'Mukim'} • {santri.kelas_halaqah || 'Diniyah'}
                      </div>
                    </div>

                    {existingLog && (
                      <span style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0'
                      }}>
                        {existingLog.status_kehadiran || existingLog.status || 'Hadir'}
                      </span>
                    )}
                  </div>

                  {/* 4 Quick Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    <button
                      onClick={() => handleQuickManualAction(santri, 'Hadir Tepat Waktu')}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Hadir
                    </button>
                    <button
                      onClick={() => handleQuickManualAction(santri, 'Sakit')}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#8b5cf6',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Sakit
                    </button>
                    <button
                      onClick={() => handleQuickManualAction(santri, 'Izin')}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#f59e0b',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Izin
                    </button>
                    <button
                      onClick={() => handleQuickManualAction(santri, 'Alpa / Tanpa Keterangan')}
                      style={{
                        padding: '7px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Alpa
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredSantri.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                Santri tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: RIWAYAT PRESENSI LENGKAP (FITUR BARU)
      ========================================================================= */}
      {activeMode === 'riwayat' && (
        <div>
          {/* 4 Summary Mini Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '14px'
          }}>
            <div style={{ background: '#ffffff', padding: '10px 6px', borderRadius: '14px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>{presensiLogs.length}</div>
              <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700 }}>Total</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '10px 6px', borderRadius: '14px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>{countHadir}</div>
              <div style={{ fontSize: '0.64rem', color: '#047857', fontWeight: 700 }}>Hadir</div>
            </div>
            <div style={{ background: '#f5f3ff', padding: '10px 6px', borderRadius: '14px', textAlign: 'center', border: '1px solid #ddd6fe' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed' }}>{countSakit}</div>
              <div style={{ fontSize: '0.64rem', color: '#6d28d9', fontWeight: 700 }}>Sakit</div>
            </div>
            <div style={{ background: '#fef2f2', padding: '10px 6px', borderRadius: '14px', textAlign: 'center', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>{countIzin + countAlpa}</div>
              <div style={{ fontSize: '0.64rem', color: '#b91c1c', fontWeight: 700 }}>Izin/Alpa</div>
            </div>
          </div>

          {/* Search Box Riwayat */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '2px 12px',
            border: '1.5px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Cari di riwayat presensi..."
              value={searchRiwayat}
              onChange={(e) => setSearchRiwayat(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
            {searchRiwayat && (
              <X size={16} color="#94a3b8" onClick={() => setSearchRiwayat('')} style={{ cursor: 'pointer' }} />
            )}
          </div>

          {/* Filter Pills Status */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
            {['Semua', 'Hadir', 'Sakit', 'Izin', 'Alpa'].map(st => {
              const active = filterStatusRiwayat === st;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatusRiwayat(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: 'none',
                    background: active ? '#7c3aed' : '#ffffff',
                    color: active ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: active ? '0 3px 8px rgba(124, 58, 237, 0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* List Kartu Riwayat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRiwayat.map((log) => {
              const isQr = String(log.metode_scan || log.metode_presensi || '').toLowerCase().includes('qr');
              const statusStr = String(log.status_kehadiran || log.status || 'Hadir');
              const isHadir = statusStr.toLowerCase().includes('hadir');
              const isSakit = statusStr.toLowerCase().includes('sakit');
              const isIzin = statusStr.toLowerCase().includes('izin');

              const statusColor = isHadir ? '#059669' : (isSakit ? '#7c3aed' : (isIzin ? '#d97706' : '#dc2626'));
              const statusBg = isHadir ? '#ecfdf5' : (isSakit ? '#f5f3ff' : (isIzin ? '#fffbeb' : '#fef2f2'));

              return (
                <div
                  key={log.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    border: '1.5px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                        {log.nama_santri || 'Santri'}
                      </span>
                      <span style={{
                        background: isQr ? '#dbeafe' : '#f1f5f9',
                        color: isQr ? '#1d4ed8' : '#475569',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px'
                      }}>
                        {isQr ? '📷 QR Code' : '📝 Manual'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {log.kegiatan || selectedKegiatan.nama}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '1px' }}>
                      📅 {log.tanggal ? String(log.tanggal).split('T')[0] : 'Hari ini'} • ⏰ {log.waktu_scan || 'Barusan'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: statusColor,
                      background: statusBg,
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      {statusStr}
                    </span>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px',
                        color: '#b91c1c',
                        cursor: 'pointer'
                      }}
                      title="Hapus Record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRiwayat.length === 0 && (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '36px 16px',
                textAlign: 'center',
                color: '#94a3b8',
                border: '1.5px dashed #cbd5e1'
              }}>
                <ClipboardList size={38} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#475569' }}>
                  Tidak Ada Data Riwayat
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Belum ada presensi yang cocok dengan filter pencarian.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
