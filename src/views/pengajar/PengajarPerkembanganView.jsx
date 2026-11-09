import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Search, 
  RotateCw, 
  X, 
  User, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  HeartHandshake, 
  MessageSquare,
  Calendar,
  Award,
  Users,
  Camera,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';
import {
  initFaceApiModels,
  detectFaceDescriptor,
  matchFaceDescriptor
} from '../../utils/faceApi.util';

export default function PengajarPerkembanganView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Face Scan State
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [faceModelStatus, setFaceModelStatus] = useState('loading');
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [formData, setFormData] = useState({
    santri_id: '',
    periode: 'Bulan Ini',
    tanggal_laporan: new Date().toISOString().split('T')[0],
    catatan_akademik: 'Pemahaman materi nahwu & sharaf sangat baik.',
    catatan_hafalan: 'Kelancaran hafalan juz 30 lancar tanpa kendala.',
    catatan_perilaku: 'Sopan santun kepada asatidz dan rukun sesama santri di asrama.',
    catatan_ibadah: 'Selalu disiplin shalat berjamaah 5 waktu di masjid.',
    catatan_ustadz: 'Pertahankan kedisiplinan dan terus istiqomah dalam menuntut ilmu.',
    nama_penulis: 'Ustadz Pembina'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPerkembangan, resSantri] = await Promise.all([
        axios.get('/api/pengajar/perkembangan'),
        axios.get('/api/pengajar/santri')
      ]);

      if (resPerkembangan.data?.success) {
        setList(resPerkembangan.data.data || []);
      }
      if (resSantri.data?.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (e) {
      toastError('Gagal memuat catatan perkembangan santri');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Google MediaPipe Face Scanner for Quick Santri Selection
  const startCamera = async (mode = facingMode) => {
    setCameraError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError('Izin kamera ditolak atau kamera tidak tersedia.');
    }
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startDetectionLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = setInterval(async () => {
      if (isDetectingRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        isDetectingRef.current = true;
        const descriptor = await detectFaceDescriptor(videoRef.current);

        if (descriptor && Array.isArray(descriptor) && descriptor.length > 0) {
          const candidates = santriList
            .filter(s => s.face_descriptor)
            .map(s => {
              let parsed = null;
              try {
                parsed = typeof s.face_descriptor === 'string'
                  ? JSON.parse(s.face_descriptor)
                  : s.face_descriptor;
              } catch (e) {}
              return {
                id: s.id,
                nama: s.nama_santri,
                descriptor: parsed
              };
            })
            .filter(c => Array.isArray(c.descriptor) && c.descriptor.length > 0);

          if (candidates.length > 0) {
            const match = matchFaceDescriptor(descriptor, candidates, 0.62);
            if (match && match.santri) {
              const matchedSantri = match.santri;
              setFormData(prev => ({ ...prev, santri_id: String(matchedSantri.id) }));
              toastSuccess(`Santri Terdeteksi: ${matchedSantri.nama}`);
              setShowFaceModal(false);
            }
          }
        }
      } catch (err) {
        // silent loop
      } finally {
        isDetectingRef.current = false;
      }
    }, 400);
  };

  useEffect(() => {
    if (showFaceModal) {
      setFaceModelStatus('loading');
      initFaceApiModels()
        .then(() => {
          setFaceModelStatus('ready');
          startCamera(facingMode);
          startDetectionLoop();
        })
        .catch(() => {
          setFaceModelStatus('error');
          setCameraError('Gagal memuat Google MediaPipe FaceMesh AI.');
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showFaceModal]);

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      toastError('Pilih santri terlebih dahulu!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/pengajar/perkembangan', formData);
      if (res.data?.success) {
        toastSuccess('Catatan perkembangan santri berhasil diterbitkan!');
        setShowForm(false);
        setFormData({
          santri_id: '',
          periode: 'Bulan Ini',
          tanggal_laporan: new Date().toISOString().split('T')[0],
          catatan_akademik: 'Pemahaman materi nahwu & sharaf sangat baik.',
          catatan_hafalan: 'Kelancaran hafalan juz 30 lancar tanpa kendala.',
          catatan_perilaku: 'Sopan santun kepada asatidz dan rukun sesama santri di asrama.',
          catatan_ibadah: 'Selalu disiplin shalat berjamaah 5 waktu di masjid.',
          catatan_ustadz: 'Pertahankan kedisiplinan dan terus istiqomah dalam menuntut ilmu.',
          nama_penulis: 'Ustadz Pembina'
        });
        fetchData();
      }
    } catch (err) {
      toastError('Gagal menerbitkan catatan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalLaporan = list.length;
  const santriUnik = new Set(list.map(i => i.santri_id)).size;
  const bulanIniCount = list.filter(i => {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return String(i.tanggal_laporan || '').startsWith(`${y}-${m}`);
  }).length;
  const nasehatCount = list.filter(i => (i.catatan_ustadz || '').trim().length > 0).length;

  const filteredList = list.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.periode || '').toLowerCase().includes(q) ||
      (item.nama_kelas || '').toLowerCase().includes(q) ||
      (item.catatan_ustadz || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. TOP EXECUTIVE CARD: JUDUL & TOMBOL BUAT LAPORAN */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ddd6fe',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.15)'
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.2px' }}>
              Perkembangan &amp; Karakter
            </div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
              Akhlak santri, hafalan, ibadah &amp; nasehat ustadz
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
            border: 'none',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 12px rgba(13, 118, 110, 0.28)'
          }}
        >
          <Plus size={15} /> Buat Catatan
        </button>
      </div>

      {/* 2. STATS 4 BADGES COUNTER (LUXURY EXECUTIVE STYLE IDENTIK OWNER) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}
      >
        {/* Total Laporan */}
        <div
          style={{
            background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <FileText size={14} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d', marginTop: '3px', lineHeight: 1 }}>
            {totalLaporan}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
            Total Laporan
          </div>
        </div>

        {/* Santri Dievaluasi */}
        <div
          style={{
            background: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Users size={13} strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1d4ed8', marginTop: '3px', lineHeight: 1 }}>
            {santriUnik}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>
            Santri Unik
          </div>
        </div>

        {/* Bulan Ini */}
        <div
          style={{
            background: 'linear-gradient(145deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '1px solid #ddd6fe',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(124, 58, 237, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#7c3aed',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)'
            }}
          >
            <Calendar size={13} strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#6d28d9', marginTop: '3px', lineHeight: 1 }}>
            {bulanIniCount}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#5b21b6', marginTop: '2px' }}>
            Bulan Ini
          </div>
        </div>

        {/* Nasehat Terbit */}
        <div
          style={{
            background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
            border: '1px solid #99f6e4',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#0d9488',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)'
            }}
          >
            <MessageSquare size={13} strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f766e', marginTop: '3px', lineHeight: 1 }}>
            {nasehatCount}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#115e59', marginTop: '2px' }}>
            Nasehat
          </div>
        </div>
      </div>

      {/* 3. SEARCH BOX */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri, periode, atau pesan ustadz..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '0.75rem',
            outline: 'none',
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 4. MODAL FORM INPUT CATATAN PERKEMBANGAN (DILENGKAPI SCAN WAJAH) */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px'
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
              boxShadow: '0 25px 35px -5px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} />
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0f172a' }}>
                  Buat Catatan Perkembangan Santri
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155' }}>
                    PILIH SANTRI *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFaceModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)'
                    }}
                  >
                    <Camera size={11} /> Scan Wajah AI
                  </button>
                </div>

                <select
                  required
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri} ({s.nama_kelas || 'Santri'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    PERIODE EVALUASI
                  </label>
                  <input
                    type="text"
                    value={formData.periode}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="Contoh: November 2026"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    TANGGAL LAPORAN
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_laporan}
                    onChange={(e) => setFormData({ ...formData, tanggal_laporan: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  CATATAN AKADEMIK &amp; KITAB KUNING
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_akademik}
                  onChange={(e) => setFormData({ ...formData, catatan_akademik: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  CATATAN PERILAKU, AKHLAK &amp; ASRAMA
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_perilaku}
                  onChange={(e) => setFormData({ ...formData, catatan_perilaku: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  PESAN &amp; NASEHAT USTADZ
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_ustadz}
                  onChange={(e) => setFormData({ ...formData, catatan_ustadz: e.target.value })}
                  placeholder="Nasehat khusus dari pengajar untuk santri..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 118, 110, 0.3)'
                  }}
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL SCAN WAJAH UNTUK PILIH SANTRI
      ========================================================================= */}
      {showFaceModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px'
          }}
          onClick={() => setShowFaceModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '420px',
              width: '100%',
              padding: '16px',
              boxShadow: '0 25px 40px -10px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>Scan Wajah Santri</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Arahkan kamera untuk otomatis pilih santri</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 8px', fontSize: '0.65rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  <RotateCcw size={12} />
                </button>
                <button
                  onClick={() => setShowFaceModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '240px',
                background: '#0f172a',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  width: '150px',
                  height: '190px',
                  border: '2px dashed rgba(255, 255, 255, 0.7)',
                  borderRadius: '80px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                  pointerEvents: 'none'
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} color="#34d399" />
                {faceModelStatus === 'loading' && 'Memuat AI MediaPipe...'}
                {faceModelStatus === 'ready' && 'MediaPipe 3D Aktif'}
                {faceModelStatus === 'error' && 'Gagal Memuat AI'}
              </div>

              {cameraError && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f87171', padding: '16px', textAlign: 'center', fontSize: '0.75rem' }}>
                  <AlertCircle size={24} style={{ marginBottom: '6px' }} />
                  {cameraError}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.66rem', color: '#64748b' }}>
              Saat wajah santri cocok, sistem otomatis memilih nama santri ke formulir.
            </div>
          </div>
        </div>
      )}

      {/* 5. LIST DAFTAR PERKEMBANGAN SANTRI (EXECUTIVE CARD) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#0d766e" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat catatan perkembangan...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Belum ada catatan perkembangan santri.
          </div>
        ) : (
          filteredList.map((item) => {
            const initial = (item.nama_santri || 'S').charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Header: Avatar Monogram + Nama Santri + Periode Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: '#ecfdf5',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        border: '1px solid #a7f3d0',
                        flexShrink: 0
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                        {item.nama_kelas || 'Santri Binaan'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: '#f0fdfa',
                      color: '#0d9488',
                      border: '1px solid #99f6e4',
                      flexShrink: 0
                    }}
                  >
                    {item.periode || 'Bulan Ini'}
                  </span>
                </div>

                {/* Bagian Akademik & Kitab */}
                {item.catatan_akademik && (
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      border: '1px solid #f1f5f9',
                      fontSize: '0.68rem',
                      color: '#334155'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BookOpen size={12} color="#0d9488" /> Kitab &amp; Akademik
                    </div>
                    {item.catatan_akademik}
                  </div>
                )}

                {/* Bagian Akhlak & Perilaku */}
                {item.catatan_perilaku && (
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      border: '1px solid #f1f5f9',
                      fontSize: '0.68rem',
                      color: '#334155'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HeartHandshake size={12} color="#2563eb" /> Akhlak &amp; Kedisiplinan
                    </div>
                    {item.catatan_perilaku}
                  </div>
                )}

                {/* Nasehat Ustadz (Glowing Emerald Frosted Box) */}
                {item.catatan_ustadz && (
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #f0fdfa 0%, #ecfdf5 100%)',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      border: '1px solid #a7f3d0',
                      fontSize: '0.66rem',
                      color: '#065f46',
                      fontStyle: 'italic',
                      lineHeight: 1.4
                    }}
                  >
                    <div style={{ fontWeight: 800, fontStyle: 'normal', color: '#047857', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={12} color="#059669" /> Nasehat Ustadz:
                    </div>
                    "{item.catatan_ustadz}"
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.58rem', color: '#94a3b8' }}>
                  <span>Tgl: {item.tanggal_laporan}</span>
                  <span>Oleh: {item.nama_penulis || 'Ustadz Pembina'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
