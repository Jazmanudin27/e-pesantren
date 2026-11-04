import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Camera,
  Search,
  Check,
  X,
  RotateCcw,
  UserCheck,
  Smile,
  Upload,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertCircle,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady
} from '../../utils/faceApi.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function MobileDaftarWajah() {
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unregistered' | 'registered'
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' | 'list'

  // Selected santri for enrollment
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [snapshot, setSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [detectedExistingSantri, setDetectedExistingSantri] = useState(null); // Real-time duplicate detected

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);

  // Registered face profiles map from localStorage
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('epesantren_face_profiles') || '{}');
    } catch (e) {
      return {};
    }
  });

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const [resSantri, resKelas] = await Promise.all([
        axios.get('/api/santri?all=true'),
        axios.get('/api/kelas').catch(() => ({ data: { data: [] } }))
      ]);

      if (resKelas.data?.data && Array.isArray(resKelas.data.data)) {
        setKelasList(resKelas.data.data);
      }

      if (resSantri.data?.data && Array.isArray(resSantri.data.data)) {
        setSantriList(resSantri.data.data);

        // Sinkronisasi otomatis data foto yang sudah ada di database & bersihkan data dummy lawas
        const updated = { ...registeredFaces };
        const validIds = new Set(resSantri.data.data.map((s) => String(s.id)));
        let changed = false;

        // Hapus profil wajah lama yang tidak ada di database santri
        Object.keys(updated).forEach((idKey) => {
          const prof = updated[idKey];
          const pId = String(prof?.santri_id || idKey);
          if (!validIds.has(pId)) {
            delete updated[idKey];
            changed = true;
          }
        });

        resSantri.data.data.forEach((s) => {
          const photo = s.foto || s.foto_santri;
          if (photo && (!updated[s.id] || !updated[s.id].foto)) {
            updated[s.id] = {
              santri_id: s.id,
              nama: s.nama_santri,
              nis: s.nis,
              asrama: s.nama_asrama || '',
              kamar: s.nama_kamar || '',
              foto: photo,
              descriptor: null,
              registered_at: new Date().toISOString()
            };
            changed = true;
          }
        });
        if (changed) {
          setRegisteredFaces(updated);
          localStorage.setItem('epesantren_face_profiles', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.warn('Gagal ambil santri:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
    initFaceApiModels().catch(() => {});
  }, []);

  const startCamera = async (facing = facingMode) => {
    setCameraError('');
    setIsCameraActive(true);
    setSnapshot(null);
    setDetectedExistingSantri(null);

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        startLiveDuplicateCheck();
      }
    } catch (err) {
      console.warn('Camera error:', err);
      setCameraError('Kamera tidak dapat diakses atau izin belum diberikan.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setDetectedExistingSantri(null);
  };

  // Real-time live detection saat kamera aktif: Deteksi jika wajah sudah milik santri lain
  const startLiveDuplicateCheck = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !video.videoWidth) return;
      if (isDetectingRef.current || !isFaceModelReady()) return;

      isDetectingRef.current = true;
      try {
        const faceRes = await detectFaceDescriptor(video);
        if (!faceRes) {
          setDetectedExistingSantri(null);
          return;
        }

        const otherProfiles = Object.values(registeredFaces).filter(
          (p) => String(p.santri_id) !== String(selectedSantri?.id) && (p.descriptor || p.foto)
        );

        if (otherProfiles.length > 0) {
          const match = matchFaceDescriptor(faceRes.descriptor, otherProfiles, 0.52);
          if (match) {
            setDetectedExistingSantri(match);
          } else {
            setDetectedExistingSantri(null);
          }
        }
      } catch (e) {
      } finally {
        isDetectingRef.current = false;
      }
    }, 400);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const toggleFacingMode = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(next), 200);
    }
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;

    const canvas = document.createElement('canvas');
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const size = Math.min(vW, vH);
    const sX = (vW - size) / 2;
    const sY = (vH - size) / 2;

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sX, sY, size, size, 0, 0, 300, 300);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setSnapshot(dataUrl);
    stopCamera();
    return dataUrl;
  };

  const handleOpenEnrollModal = (santri) => {
    setSelectedSantri(santri);
    setSnapshot(registeredFaces[santri.id]?.foto || santri.foto || santri.foto_santri || null);
    startCamera(facingMode);
  };

  const handleCloseModal = () => {
    stopCamera();
    setSelectedSantri(null);
    setSnapshot(null);
  };

  const handleSaveFace = async () => {
    if (!selectedSantri) return;
    if (!snapshot) {
      showError('Foto Kosong', 'Silakan ambil foto wajah terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      // 1. Ekstraksi descriptor wajah yang baru dipotret
      let descriptor = null;
      if (isFaceModelReady()) {
        try {
          descriptor = await extractDescriptorFromDataUrl(snapshot);
        } catch (e) {}
      }

      if (!descriptor) {
        showError(
          'Wajah Tidak Terdeteksi Jelas',
          'Pastikan santri menghadap tegak ke kamera di tempat terang, lalu ambil foto ulang.'
        );
        setSaving(false);
        return;
      }

      // 2. Ambil semua profil santri lain dan pastikan descriptor terisi
      const otherProfiles = Object.values(registeredFaces).filter(
        (p) => String(p.santri_id) !== String(selectedSantri.id) && (p.descriptor || p.foto)
      );

      // Pastikan santri lain yang hanya punya URL foto diproses descriptor-nya
      for (const other of otherProfiles) {
        if (!other.descriptor && other.foto) {
          try {
            other.descriptor = await extractDescriptorFromDataUrl(other.foto);
          } catch (eDesc) {}
        }
      }

      // 3. Validasi pencocokan anti duplikasi (threshold 0.55 untuk keamanan ekstra)
      const matchedOther = matchFaceDescriptor(descriptor, otherProfiles, 0.55);
      if (matchedOther) {
        showError(
          'Pendaftaran Wajah Ditolak!',
          `Wajah ini terdeteksi sudah terdaftar atas nama "${matchedOther.nama || matchedOther.nama_santri}". Wajah yang sama tidak boleh didaftarkan ke santri lain!`
        );
        setSaving(false);
        return;
      }

      const updated = {
        ...registeredFaces,
        [selectedSantri.id]: {
          santri_id: selectedSantri.id,
          nama: selectedSantri.nama_santri,
          nis: selectedSantri.nis,
          asrama: selectedSantri.nama_asrama || '',
          kamar: selectedSantri.nama_kamar || '',
          foto: snapshot,
          descriptor: descriptor,
          registered_at: new Date().toISOString()
        }
      };

      setRegisteredFaces(updated);
      localStorage.setItem('epesantren_face_profiles', JSON.stringify(updated));

      // Simpan foto wajah langsung ke backend santri
      try {
        await axios.patch(`/api/santri/${selectedSantri.id}/foto`, { foto: snapshot });
      } catch (errPatch) {
        // Fallback jika patch gagal, gunakan put dengan payload foto
        await axios.put(`/api/santri/${selectedSantri.id}`, { foto: snapshot }).catch(() => {});
      }

      // Update state santriList lokal
      setSantriList((prev) =>
        prev.map((s) => (s.id === selectedSantri.id ? { ...s, foto: snapshot } : s))
      );

      toastSuccess(`Wajah ${selectedSantri.nama_santri} berhasil didaftarkan!`);
      handleCloseModal();
    } catch (err) {
      showError('Gagal Menyimpan', 'Terjadi kesalahan saat memproses data wajah.');
    } finally {
      setSaving(false);
    }
  };

  // Fitur Hapus Foto & Profil Wajah Santri
  const handleDeleteFace = async (santri) => {
    const ok = await showConfirm(
      'Hapus Wajah Santri?',
      `Yakin ingin menghapus foto wajah "${santri.nama_santri}"? Santri ini tidak akan bisa presensi wajah sebelum didaftarkan kembali.`,
      'Ya, Hapus',
      'Batal'
    );
    if (!ok) return;

    try {
      // 1. Hapus di localStorage
      const updated = { ...registeredFaces };
      delete updated[santri.id];
      setRegisteredFaces(updated);
      localStorage.setItem('epesantren_face_profiles', JSON.stringify(updated));

      // 2. Hapus foto di database santri
      try {
        await axios.patch(`/api/santri/${santri.id}/foto`, { foto: null });
      } catch (ePatch) {
        await axios.put(`/api/santri/${santri.id}`, { foto: null }).catch(() => {});
      }

      // 3. Update state lokal
      setSantriList((prev) =>
        prev.map((s) => (s.id === santri.id ? { ...s, foto: null, foto_santri: null } : s))
      );

      toastSuccess(`Foto wajah ${santri.nama_santri} berhasil dihapus.`);
    } catch (e) {
      showError('Gagal Menghapus', 'Terjadi kendala saat menghapus foto wajah.');
    }
  };

  const combinedKelasOptions = React.useMemo(() => {
    const list = [...kelasList];
    santriList.forEach((s) => {
      const kName = s.nama_kelas;
      if (kName && !list.some((k) => k.nama_kelas === kName || String(k.id) === String(s.kelas_id))) {
        list.push({ id: s.kelas_id || kName, nama_kelas: kName });
      }
    });
    return list;
  }, [kelasList, santriList]);

  // Saring santri berdasarkan kelas
  const classFilteredSantri = santriList.filter((s) => {
    if (selectedKelas !== 'Semua') {
      const matchKelas =
        String(s.kelas_id) === String(selectedKelas) ||
        String(s.nama_kelas) === String(selectedKelas);
      if (!matchKelas) return false;
    }
    return true;
  });

  const totalRegisteredInClass = classFilteredSantri.filter(
    (s) => !!(registeredFaces[s.id]?.foto || s.foto || s.foto_santri)
  ).length;

  const filteredSantri = classFilteredSantri.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      s.nama_kelas?.toLowerCase().includes(q);

    if (!matchSearch) return false;
    const isEnrolled = !!(registeredFaces[s.id]?.foto || s.foto || s.foto_santri);
    if (filterMode === 'unregistered') return !isEnrolled;
    if (filterMode === 'registered') return isEnrolled;
    return true;
  });

  const totalRegistered = santriList.filter(
    (s) => !!(registeredFaces[s.id]?.foto || s.foto || s.foto_santri)
  ).length;

  return (
    <div style={{ padding: '14px', background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Info Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
        borderRadius: '20px',
        padding: '16px 18px',
        color: '#ffffff',
        marginBottom: '14px',
        boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Smile size={18} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.94rem', fontWeight: 800 }}>Pendaftaran Wajah Santri</span>
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.22)',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 800
          }}>
            {selectedKelas === 'Semua' 
              ? `${totalRegistered} / ${santriList.length} Terdaftar`
              : `${totalRegisteredInClass} / ${classFilteredSantri.length} Terdaftar`}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.74rem', color: '#e0f2fe', lineHeight: 1.4 }}>
          Daftarkan foto wajah santri di sini untuk digunakan pada kamera Presensi Wajah AI otomatis.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        {/* Search */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '6px 12px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Search size={16} color="#0284c7" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, asrama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#1e293b'
            }}
          />
          {search && (
            <X size={15} color="#94a3b8" onClick={() => setSearch('')} style={{ cursor: 'pointer' }} />
          )}
        </div>

        {/* Filter Kelas Santri */}
        <div>
          <SearchableSelect
            options={[
              { value: 'Semua', label: 'Semua Kelas' },
              ...combinedKelasOptions.map((k) => ({
                value: String(k.id || k.nama_kelas),
                label: k.nama_kelas || `Kelas ${k.id}`,
                sublabel: k.tingkat ? `Tingkat: ${k.tingkat}` : ''
              }))
            ]}
            value={selectedKelas}
            onChange={(val) => setSelectedKelas(val || 'Semua')}
            placeholder="Filter Berdasarkan Kelas..."
            searchPlaceholder="Cari kelas..."
            triggerStyle={{
              background: '#ffffff',
              border: selectedKelas !== 'Semua' ? '1.5px solid #0284c7' : '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '8px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: selectedKelas !== 'Semua' ? '#0284c7' : '#334155'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: filterMode === 'all' ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
              background: filterMode === 'all' ? '#0284c7' : '#ffffff',
              color: filterMode === 'all' ? '#ffffff' : '#64748b',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Semua ({classFilteredSantri.length})
          </button>
          <button
            onClick={() => setFilterMode('unregistered')}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: filterMode === 'unregistered' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
              background: filterMode === 'unregistered' ? '#fff7ed' : '#ffffff',
              color: filterMode === 'unregistered' ? '#ea580c' : '#64748b',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Belum Foto ({classFilteredSantri.length - totalRegisteredInClass})
          </button>
          <button
            onClick={() => setFilterMode('registered')}
            style={{
              flex: 1,
              padding: '7px 4px',
              borderRadius: '10px',
              border: filterMode === 'registered' ? '1.5px solid #059669' : '1px solid #e2e8f0',
              background: filterMode === 'registered' ? '#ecfdf5' : '#ffffff',
              color: filterMode === 'registered' ? '#059669' : '#64748b',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Sudah Ada ({totalRegisteredInClass})
          </button>
        </div>

        {/* Layout Switcher & Total Found */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
            Menampilkan <strong style={{ color: '#0284c7' }}>{filteredSantri.length}</strong> santri
          </span>
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            borderRadius: '10px',
            padding: '2px',
            gap: '2px'
          }}>
            <button
              onClick={() => setViewLayout('grid')}
              title="Tampilan Grid"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '8px',
                border: 'none',
                background: viewLayout === 'grid' ? '#ffffff' : 'transparent',
                color: viewLayout === 'grid' ? '#0284c7' : '#64748b',
                boxShadow: viewLayout === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 800
              }}
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewLayout('list')}
              title="Tampilan List"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '8px',
                border: 'none',
                background: viewLayout === 'list' ? '#ffffff' : 'transparent',
                color: viewLayout === 'list' ? '#0284c7' : '#64748b',
                boxShadow: viewLayout === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 800
              }}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Santri Cards Container (Grid or List) */}
      {filteredSantri.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          border: '1.5px dashed #cbd5e1',
          margin: '10px 0'
        }}>
          <Users size={38} color="#cbd5e1" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#475569', marginBottom: '4px' }}>
            Tidak ada santri ditemukan
          </div>
          <div style={{ fontSize: '0.74rem' }}>
            Coba sesuaikan kata kunci pencarian atau pilih kelas lain.
          </div>
        </div>
      ) : viewLayout === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          paddingBottom: '80px'
        }}>
          {filteredSantri.map((santri) => {
            const registered = registeredFaces[santri.id];
            const photo = registered?.foto || santri.foto || santri.foto_santri;
            const isEnrolled = !!photo;

            return (
              <div
                key={santri.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '12px 10px',
                  border: isEnrolled ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: isEnrolled
                    ? '0 4px 14px -2px rgba(16, 185, 129, 0.15)'
                    : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Status Badge Tag */}
                <div style={{
                  position: 'absolute',
                  top: '9px',
                  left: '9px',
                  background: isEnrolled ? '#ecfdf5' : '#f8fafc',
                  color: isEnrolled ? '#059669' : '#94a3b8',
                  border: isEnrolled ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                  borderRadius: '999px',
                  padding: '2px 6px',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  {isEnrolled ? (
                    <>
                      <CheckCircle2 size={10} color="#059669" />
                      <span>Ada Foto</span>
                    </>
                  ) : (
                    <span>Belum</span>
                  )}
                </div>

                {/* Hapus Foto Action */}
                {isEnrolled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFace(santri);
                    }}
                    title="Hapus Foto Wajah"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      background: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                {/* Avatar / Photo */}
                <div
                  onClick={() => handleOpenEnrollModal(santri)}
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: isEnrolled ? '#d1fae5' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '18px',
                    marginBottom: '8px',
                    border: isEnrolled ? '2.5px solid #10b981' : '2px dashed #cbd5e1',
                    boxShadow: isEnrolled ? '0 4px 10px rgba(16, 185, 129, 0.2)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={santri.nama_santri}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Camera size={26} color="#94a3b8" />
                  )}
                </div>

                {/* Name */}
                <span
                  title={santri.nama_santri}
                  style={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    lineHeight: 1.25,
                    marginBottom: '4px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.1em'
                  }}
                >
                  {santri.nama_santri}
                </span>

                {/* NIS & Kelas */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '0.66rem',
                  color: '#64748b',
                  marginBottom: '10px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontWeight: 600 }}>{santri.nis || '-'}</span>
                  {santri.nama_kelas && (
                    <span style={{
                      background: '#f0f9ff',
                      color: '#0284c7',
                      padding: '1px 5px',
                      borderRadius: '5px',
                      fontWeight: 700,
                      fontSize: '0.62rem'
                    }}>
                      {santri.nama_kelas}
                    </span>
                  )}
                </div>

                {/* Button Ambil/Ubah Foto */}
                <button
                  onClick={() => handleOpenEnrollModal(santri)}
                  style={{
                    width: '100%',
                    marginTop: 'auto',
                    padding: '7px 6px',
                    borderRadius: '11px',
                    background: isEnrolled ? '#f0fdf4' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: isEnrolled ? '#059669' : '#ffffff',
                    border: isEnrolled ? '1.5px solid #a7f3d0' : 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: isEnrolled ? 'none' : '0 3px 8px rgba(2, 132, 199, 0.22)'
                  }}
                >
                  <Camera size={13} />
                  <span>{isEnrolled ? 'Ubah' : 'Ambil Foto'}</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '70px' }}>
          {filteredSantri.map((santri) => {
            const registered = registeredFaces[santri.id];
            const photo = registered?.foto || santri.foto || santri.foto_santri;
            const isEnrolled = !!photo;

            return (
              <div
                key={santri.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '12px 14px',
                  border: isEnrolled ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Photo / Avatar */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: isEnrolled ? '#d1fae5' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: isEnrolled ? '1.5px solid #059669' : '1px solid #cbd5e1'
                }}>
                  {photo ? (
                    <img src={photo} alt={santri.nama_santri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Smile size={24} color="#94a3b8" />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {santri.nama_santri}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>NIS: {santri.nis || '-'}</span>
                    {santri.nama_kelas && (
                      <>
                        <span>•</span>
                        <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {santri.nama_kelas}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{santri.nama_asrama || 'Asrama'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {isEnrolled && (
                    <button
                      onClick={() => handleDeleteFace(santri)}
                      title="Hapus Wajah Santri"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #fecdd3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEnrollModal(santri)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '10px',
                      background: isEnrolled ? '#f0fdf4' : '#0284c7',
                      color: isEnrolled ? '#059669' : '#ffffff',
                      border: isEnrolled ? '1px solid #a7f3d0' : 'none',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Camera size={13} />
                    <span>{isEnrolled ? 'Ubah' : 'Ambil Foto'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ambil Foto / Daftarkan Wajah Santri */}
      {selectedSantri && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#0f172a' }}>
                  Daftarkan Wajah Santri
                </h3>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>
                  {selectedSantri.nama_santri} (NIS: {selectedSantri.nis})
                </p>
              </div>
              <button onClick={handleCloseModal} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Viewport */}
            <div style={{ padding: '16px' }}>
              <div style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#090d16',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                {snapshot ? (
                  <img src={snapshot} alt="Preview Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                    }}
                  />
                )}

                {/* Reticle guide frame */}
                {!snapshot && (
                  <div style={{
                    position: 'absolute',
                    width: '68%',
                    height: '68%',
                    border: detectedExistingSantri
                      ? '3px solid #ef4444'
                      : '2px dashed rgba(255,255,255,0.7)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    boxShadow: detectedExistingSantri ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
                    transition: 'all 0.2s ease'
                  }} />
                )}

                {/* Banner Peringatan Wajah Sudah Terdaftar (Real-Time) */}
                {detectedExistingSantri && !snapshot && (
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    right: '12px',
                    background: 'rgba(239, 68, 68, 0.95)',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10
                  }}>
                    ⛔ Wajah Terdaftar: {detectedExistingSantri.nama || detectedExistingSantri.nama_santri}
                    <div style={{ fontSize: '0.66rem', fontWeight: 600, color: '#fee2e2' }}>
                      Wajah sudah terdaftar. Tidak dapat didaftarkan lagi!
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons inside modal */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {!snapshot ? (
                  <>
                    <button
                      onClick={toggleFacingMode}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#0284c7',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={14} /> Putar Kamera
                    </button>
                    <button
                      onClick={() => {
                        if (detectedExistingSantri) {
                          showError(
                            'Wajah Sudah Terdaftar!',
                            `Wajah di depan kamera terdeteksi sudah terdaftar atas nama "${detectedExistingSantri.nama || detectedExistingSantri.nama_santri}". Tidak dapat mengambil foto untuk santri lain.`
                          );
                          return;
                        }
                        captureSnapshot();
                      }}
                      style={{
                        flex: 1,
                        padding: '9px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: detectedExistingSantri ? '#94a3b8' : '#0284c7',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: detectedExistingSantri ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Camera size={16} /> Ambil Foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startCamera(facingMode)}
                      style={{
                        flex: 1,
                        padding: '9px 14px',
                        borderRadius: '10px',
                        border: '1px solid #fecdd3',
                        background: '#fff1f2',
                        color: '#e11d48',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ambil Ulang
                    </button>
                    <button
                      disabled={saving}
                      onClick={handleSaveFace}
                      style={{
                        flex: 1.5,
                        padding: '9px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} /> {saving ? 'Menyimpan...' : 'Simpan Wajah'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

