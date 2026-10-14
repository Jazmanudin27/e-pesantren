import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Users, 
  RotateCw, 
  Search, 
  Trash2, 
  Calendar, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Building, 
  ArrowRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';

export default function ScanBarcodeView() {
  const [santriList, setSantriList] = useState([]);
  const [sesiList, setSesiList] = useState([
    { id: 1, kode: 'SHALAT-SHUBUH', nama: 'Shalat Shubuh Berjamaah', jam_target: '04:40', jam_toleransi: '04:45' },
    { id: 2, kode: 'NGAJI-PAGI', nama: 'Mengaji Qur\'an / Halaqah Pagi', jam_target: '05:30', jam_toleransi: '05:40' },
    { id: 3, kode: 'SHALAT-DZUHUR', nama: 'Shalat Dzuhur Berjamaah', jam_target: '12:05', jam_toleransi: '12:15' },
    { id: 4, kode: 'SHALAT-ASHAR', nama: 'Shalat Ashar Berjamaah', jam_target: '15:20', jam_toleransi: '15:30' },
    { id: 5, kode: 'NGAJI-SORE', nama: 'Kajian Kitab / Mengaji Sore', jam_target: '16:15', jam_toleransi: '16:25' },
    { id: 6, kode: 'SHALAT-MAGHRIB', nama: 'Shalat Maghrib Berjamaah', jam_target: '18:00', jam_toleransi: '18:10' },
    { id: 7, kode: 'NGAJI-MALAM', nama: 'Mudzakarah / Mengaji Malam', jam_target: '18:45', jam_toleransi: '18:55' },
    { id: 8, kode: 'SHALAT-ISYA', nama: 'Shalat Isya Berjamaah', jam_target: '19:30', jam_toleransi: '19:40' },
    { id: 9, kode: 'PRESENSI-ASRAMA', nama: 'Apel Malam & Jam Malam Asrama', jam_target: '21:30', jam_toleransi: '21:45' }
  ]);

  // Determine current active session based on hour
  const detectCurrentSesi = () => {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();

    if (curMinutes >= 240 && curMinutes < 315) return 'SHALAT-SHUBUH';
    if (curMinutes >= 315 && curMinutes < 420) return 'NGAJI-PAGI';
    if (curMinutes >= 700 && curMinutes < 800) return 'SHALAT-DZUHUR';
    if (curMinutes >= 900 && curMinutes < 980) return 'SHALAT-ASHAR';
    if (curMinutes >= 980 && curMinutes < 1060) return 'NGAJI-SORE';
    if (curMinutes >= 1060 && curMinutes < 1115) return 'SHALAT-MAGHRIB';
    if (curMinutes >= 1115 && curMinutes < 1155) return 'NGAJI-MALAM';
    if (curMinutes >= 1155 && curMinutes < 1260) return 'SHALAT-ISYA';
    return 'PRESENSI-ASRAMA';
  };

  const [selectedSesiKode, setSelectedSesiKode] = useState(detectCurrentSesi);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Live scan feedback
  const [lastScanned, setLastScanned] = useState(null);
  const [flashStatus, setFlashStatus] = useState(null); // 'success' | 'warning' | 'error'

  // Scan logs today
  const [scanLogs, setScanLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('epesantren_live_scan_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const barcodeInputRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const cooldownRef = useRef(false);

  // Play synthetic audio beep
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {}
  };

  // Fetch Santri master
  const fetchSantriData = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSantriList(res.data.data);
      } else {
        setSantriList([
          { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar Abu Bakar 01', capaian_hafalan_juz: 15 },
          { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar Umar 01', capaian_hafalan_juz: 28 },
          { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar Aisyah 01', capaian_hafalan_juz: 30 },
          { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar Abu Bakar 02', capaian_hafalan_juz: 5 },
          { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar Aisyah 02', capaian_hafalan_juz: 3 },
          { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar Umar 01', capaian_hafalan_juz: 12 }
        ]);
      }
    } catch (e) {
      // Fallback
      setSantriList([
        { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar Abu Bakar 01', capaian_hafalan_juz: 15 },
        { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar Umar 01', capaian_hafalan_juz: 28 },
        { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar Aisyah 01', capaian_hafalan_juz: 30 },
        { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar Abu Bakar 02', capaian_hafalan_juz: 5 },
        { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar Aisyah 02', capaian_hafalan_juz: 3 },
        { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar Umar 01', capaian_hafalan_juz: 12 }
      ]);
    }
  };

  useEffect(() => {
    fetchSantriData();
    // Keep focus on input for USB gun barcode reader
    barcodeInputRef.current?.focus();
  }, []);

  // Save logs to localStorage helper
  const saveLogs = (newLogs) => {
    setScanLogs(newLogs);
    try {
      localStorage.setItem('epesantren_live_scan_logs', JSON.stringify(newLogs));
    } catch (e) {}
  };

  // Process Scanned Code (both from USB gun & Webcam)
  const processBarcodeValue = (rawCode, source = 'Barcode Gun') => {
    if (!rawCode || cooldownRef.current) return;
    const clean = String(rawCode).trim().toUpperCase();
    if (!clean) return;

    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
      barcodeInputRef.current?.focus();
    }, 1500);

    // Cari santri berdasarkan NIS, kode_santri, atau ID
    const found = santriList.find(
      (s) =>
        String(s.nis).toUpperCase() === clean ||
        String(s.kode_santri).toUpperCase() === clean ||
        String(s.nisn).toUpperCase() === clean ||
        clean.includes(String(s.nis).toUpperCase()) ||
        String(s.id) === clean
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const dateStr = now.toISOString().split('T')[0];

    const currentSesiObj = sesiList.find((s) => s.kode === selectedSesiKode) || sesiList[0];

    // Cek keterlambatan
    let statusPresensi = 'Tepat Waktu';
    if (currentSesiObj.jam_toleransi) {
      const [tolHour, tolMin] = currentSesiObj.jam_toleransi.split(':').map(Number);
      const tolTime = tolHour * 60 + tolMin;
      const curTime = now.getHours() * 60 + now.getMinutes();
      if (curTime > tolTime) {
        statusPresensi = 'Terlambat';
      }
    }

    if (found) {
      playBeep(true);
      setFlashStatus(statusPresensi === 'Tepat Waktu' ? 'success' : 'warning');

      const logItem = {
        id: Date.now(),
        santri_id: found.id,
        nama_santri: found.nama_santri,
        nis: found.nis,
        asrama: found.nama_asrama || 'Asrama Pusat',
        kamar: found.nama_kamar || '-',
        sesi_nama: currentSesiObj.nama,
        sesi_kode: currentSesiObj.kode,
        waktu: timeStr,
        tanggal: dateStr,
        status: statusPresensi,
        metode: source,
        barcode: clean
      };

      setLastScanned(logItem);
      const updated = [logItem, ...scanLogs.filter((l) => !(l.santri_id === found.id && l.sesi_kode === currentSesiObj.kode && l.tanggal === dateStr))];
      saveLogs(updated);

      // Kirim ke backend presensi (async)
      axios.post('/api/absensi/fingerprint', {
        santri_id: found.id,
        nis: found.nis,
        metode: source,
        status: statusPresensi,
        kegiatan: currentSesiObj.nama,
        jam_masuk: now.toTimeString().split(' ')[0]
      }).catch(() => {});
    } else {
      playBeep(false);
      setFlashStatus('error');
      setLastScanned({
        id: Date.now(),
        nama_santri: 'Santri Tidak Dikenali',
        nis: clean,
        asrama: '-',
        kamar: '-',
        sesi_nama: currentSesiObj.nama,
        waktu: timeStr,
        status: 'Tidak Ditemukan',
        metode: source,
        barcode: clean,
        isError: true
      });
    }

    setBarcodeInput('');
    setTimeout(() => setFlashStatus(null), 1800);
  };

  // Handle Form Submit from USB Barcode Gun (press enter)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeValue(barcodeInput, 'USB Gun / Input');
    }
  };

  // Start Html5Qrcode webcam
  const startCameraScanner = () => {
    setCameraError('');
    setIsCameraActive(true);

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = () => resolve(window.Html5Qrcode);
        script.onerror = () => reject(new Error('Gagal memuat library kamera.'));
        document.body.appendChild(script);
      });
    };

    loadScript().then((Html5QrcodeClass) => {
      const qrReader = new Html5QrcodeClass('desktop-webcam-reader');
      qrInstanceRef.current = qrReader;

      qrReader.start(
        { facingMode: 'user' },
        { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          processBarcodeValue(decodedText, 'Webcam Scan');
        },
        () => {}
      ).catch((err) => {
        setCameraError('Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain.');
        setIsCameraActive(false);
      });
    }).catch((e) => {
      setCameraError(e.message);
      setIsCameraActive(false);
    });
  };

  const stopCameraScanner = () => {
    if (qrInstanceRef.current) {
      try {
        qrInstanceRef.current.stop().then(() => {
          qrInstanceRef.current.clear();
          qrInstanceRef.current = null;
        }).catch(() => {});
      } catch (e) {}
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleClearLogs = async () => {
    const ok = await showConfirm(
      'Hapus Riwayat Live Scan',
      'Apakah Anda yakin ingin mengosongkan riwayat scan hari ini?'
    );
    if (ok) {
      saveLogs([]);
      setLastScanned(null);
      toastSuccess('Dibersihkan', 'Riwayat scan hari ini telah dikosongkan.');
    }
  };

  // Stats calculation
  const totalScannedToday = scanLogs.length;
  const tepatWaktuCount = scanLogs.filter((l) => l.status === 'Tepat Waktu').length;
  const terlambatCount = scanLogs.filter((l) => l.status === 'Terlambat').length;

  return (
    <div className="view-container" style={{ padding: '20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ================= HEADER STRIP ================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
        padding: '20px 24px',
        borderRadius: '14px',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(6, 78, 59, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <QrCode size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Scan Barcode & Presensi Santri
              </h1>
              <span style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}>
                LIVE DESKTOP
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.88)' }}>
              Scan otomatis dengan USB Barcode Scanner gun atau kamera webcam laptop untuk presensi kegiatan santri.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: soundEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(239, 68, 68, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Suara ON' : 'Suara MUTE'}</span>
          </button>
        </div>
      </div>

      {/* ================= SESSION BAR & SETTINGS ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 350px' }}>
          <Clock size={18} color="#059669" />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
            Kegiatan Aktif:
          </span>
          <select
            value={selectedSesiKode}
            onChange={(e) => setSelectedSesiKode(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: '#064e3b',
              background: '#ecfdf5',
              outline: 'none',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {sesiList.map((s) => (
              <option key={s.kode} value={s.kode}>
                {s.nama} ({s.jam_target} WIB)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Toleransi Telat:{' '}
            <strong style={{ color: '#0f172a' }}>
              {sesiList.find((s) => s.kode === selectedSesiKode)?.jam_toleransi || '04:45'} WIB
            </strong>
          </div>
          <div style={{ height: '18px', width: '1px', background: '#cbd5e1' }} />
          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
            Total Santri Terdaftar: <strong style={{ color: '#059669' }}>{santriList.length} Santri</strong>
          </div>
        </div>
      </div>

      {/* ================= MAIN SCANNER WORKSPACE ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(360px, 1.2fr)', gap: '20px', marginBottom: '22px' }}>
        {/* LEFT COLUMN: SCANNER INPUTS (USB GUN + WEBCAM) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* USB Scanner Gun Active Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #059669',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#059669',
              color: '#ffffff',
              fontSize: '0.66rem',
              fontWeight: 800,
              padding: '3px 12px',
              borderRadius: '0 0 0 10px',
              letterSpacing: '0.04em'
            }}>
              SIAP TEMBAK SCANNER GUN
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Input Scanner Barcode (USB / Keyboard)
                </h3>
                <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
                  Arahkan barcode scanner gun ke kartu santri, input otomatis terproses.
                </p>
              </div>
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Tembakkan barcode kartu / ketik NIS santri..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '2px solid #cbd5e1',
                  fontSize: '0.94rem',
                  fontWeight: 700,
                  outline: 'none',
                  color: '#0f172a',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#059669')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: '#059669',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Proses</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          {/* Webcam Scanner Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#0284c7" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Kamera Webcam Scanner
                </h3>
              </div>
              {isCameraActive ? (
                <button
                  onClick={stopCameraScanner}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <CameraOff size={14} />
                  <span>Matikan Kamera</span>
                </button>
              ) : (
                <button
                  onClick={startCameraScanner}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={14} />
                  <span>Aktifkan Kamera</span>
                </button>
              )}
            </div>

            {/* Kamera Viewport Container */}
            <div style={{
              background: '#0f172a',
              borderRadius: '8px',
              minHeight: '220px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {isCameraActive ? (
                <div id="desktop-webcam-reader" style={{ width: '100%', height: '100%' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                  <Camera size={36} color="#64748b" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: '0 0 6px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Kamera webcam saat ini nonaktif
                  </p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                    Klik "Aktifkan Kamera" di atas jika ingin scan menggunakan webcam laptop/PC.
                  </p>
                </div>
              )}

              {cameraError && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  padding: '6px 10px',
                  borderRadius: '6px'
                }}>
                  {cameraError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGHLIGHT CARD HASIL SCAN BARU */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Result Card */}
          <div style={{
            background: flashStatus === 'success' 
              ? '#ecfdf5' 
              : (flashStatus === 'warning' ? '#fffbeb' : (flashStatus === 'error' ? '#fef2f2' : '#ffffff')),
            border: `2px solid ${
              flashStatus === 'success' 
                ? '#10b981' 
                : (flashStatus === 'warning' ? '#f59e0b' : (flashStatus === 'error' ? '#ef4444' : '#e2e8f0'))
            }`,
            borderRadius: '14px',
            padding: '20px',
            transition: 'all 0.25s ease',
            minHeight: '260px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                  HASIL SCAN TERAKHIR
                </span>
                {lastScanned && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: lastScanned.status === 'Tepat Waktu' ? '#dcfce7' : (lastScanned.status === 'Terlambat' ? '#fef3c7' : '#fee2e2'),
                    color: lastScanned.status === 'Tepat Waktu' ? '#15803d' : (lastScanned.status === 'Terlambat' ? '#b45309' : '#b91c1c')
                  }}>
                    {lastScanned.status}
                  </span>
                )}
              </div>

              {lastScanned ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: lastScanned.isError ? '#fecaca' : 'linear-gradient(135deg, #059669, #0d9488)',
                      color: lastScanned.isError ? '#dc2626' : '#ffffff',
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {lastScanned.isError ? '!' : (lastScanned.nama_santri || 'S').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                        {lastScanned.nama_santri}
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        NIS: <strong style={{ color: '#047857' }}>{lastScanned.nis}</strong> • Barcode: {lastScanned.barcode}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    padding: '12px 14px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>ASRAMA & KOBONG</span>
                      <strong style={{ color: '#0f172a' }}>{lastScanned.asrama}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>KEGIATAN PRESENSI</span>
                      <strong style={{ color: '#059669' }}>{lastScanned.sesi_nama}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>WAKTU TERCATAT</span>
                      <strong style={{ color: '#0284c7' }}>{lastScanned.waktu}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>METODE SCAN</span>
                      <span style={{ color: '#475569', fontWeight: 600 }}>{lastScanned.metode}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                  <QrCode size={48} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ margin: '0 0 4px', color: '#64748b', fontSize: '0.94rem' }}>
                    Belum Ada Santri yang Di-scan
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem' }}>
                    Tembakkan barcode kartu santri dengan scanner gun atau arahkan ke kamera webcam.
                  </p>
                </div>
              )}
            </div>

            {/* Mini Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '10px',
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>TOTAL HADIR</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{totalScannedToday}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#16a34a', display: 'block' }}>TEPAT WAKTU</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>{tepatWaktuCount}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#d97706', display: 'block' }}>TERLAMBAT</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>{terlambatCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SCAN LOGS TABLE ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#059669" />
            <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Riwayat Live Scan Presensi Hari Ini
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>({scanLogs.length} Data)</span>
          </div>

          {scanLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#dc2626',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={13} />
              <span>Bersihkan Riwayat Hari Ini</span>
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, width: '40px' }}>No</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Nama Santri</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>NIS & Barcode</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Asrama / Kobong</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Kegiatan</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Waktu Scan</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 14px', fontWeight: 700 }}>Metode</th>
              </tr>
            </thead>
            <tbody>
              {scanLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data scan presensi untuk hari ini.
                  </td>
                </tr>
              ) : (
                scanLogs.map((log, index) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>{index + 1}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{log.nama_santri}</td>
                    <td style={{ padding: '10px 14px', color: '#047857', fontWeight: 700 }}>{log.nis}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{log.asrama}</td>
                    <td style={{ padding: '10px 14px', color: '#0284c7', fontWeight: 600 }}>{log.sesi_nama}</td>
                    <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 700 }}>{log.waktu}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: log.status === 'Tepat Waktu' ? '#dcfce7' : '#fef3c7',
                        color: log.status === 'Tepat Waktu' ? '#15803d' : '#b45309'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.76rem' }}>{log.metode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
