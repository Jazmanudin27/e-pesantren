import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Camera,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
  Save
} from 'lucide-react';
import { toastSuccess, showError } from '../utils/alert.util';
import SearchableSelect from './SearchableSelect';
import {
  initFaceApiModels,
  detectFaceDescriptor,
  matchFaceDescriptor,
  isFaceModelReady
} from '../utils/faceApi.util';

export default function FaceScanPengembanganModal({
  isOpen,
  onClose,
  gender = 'L',
  masterKategori = [],
  santriList = [],
  defaultKategoriId = '',
  tanggalEvaluasi = new Date().toISOString().slice(0, 10),
  onSuccess
}) {
  // Step: 'scan' | 'form'
  const [step, setStep] = useState('scan');
  const [faceFacingMode, setFaceFacingMode] = useState('user');
  const [faceStatusText, setFaceStatusText] = useState('Menghubungkan kamera...');
  const [faceCameraError, setFaceCameraError] = useState('');
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [matchedSantriPreview, setMatchedSantriPreview] = useState(null);
  const [manualSantriId, setManualSantriId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [evalForm, setEvalForm] = useState({
    santri_id: '',
    santriObj: null,
    kategori_id: defaultKategoriId || (masterKategori[0]?.id ? String(masterKategori[0].id) : ''),
    tanggal: tanggalEvaluasi,
    status_kelulusan: 'Lulus',
    permasalahan: [],
    penyebab: [],
    tindakan: [],
    catatan_tambahan: ''
  });

  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const isMatchedCooldownRef = useRef(false);
  const santriListRef = useRef(santriList);

  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  useEffect(() => {
    initFaceApiModels().catch(() => {});
    return () => {
      stopFaceCamera();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep('scan');
      setManualSantriId('');
      setTimeout(() => {
        startFaceCamera(faceFacingMode);
      }, 200);
    } else {
      stopFaceCamera();
    }
  }, [isOpen]);

  const playSuccessSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const startFaceCamera = async (facing = faceFacingMode) => {
    setFaceCameraError('');
    setFaceStatusText('Menghubungkan ke kamera...');
    setMatchedSantriPreview(null);
    setIsFaceDetected(false);
    isMatchedCooldownRef.current = false;

    try {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach((t) => t.stop());
        faceStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      faceStreamRef.current = stream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.onloadedmetadata = () => {
          faceVideoRef.current.play().catch(() => {});
          startFaceDetectionLoop();
        };
        faceVideoRef.current.play().catch(() => {});
        startFaceDetectionLoop();
      }
    } catch (err) {
      setFaceCameraError('Kamera tidak ditemukan / izin ditolak. Silakan pilih santri langsung di bawah.');
      setFaceStatusText('Kamera tidak aktif');
    }
  };

  const stopFaceCamera = () => {
    if (faceLoopIntervalRef.current) {
      clearInterval(faceLoopIntervalRef.current);
      faceLoopIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setIsFaceDetected(false);
  };

  const toggleFaceFacingMode = () => {
    const nextMode = faceFacingMode === 'user' ? 'environment' : 'user';
    setFaceFacingMode(nextMode);
    stopFaceCamera();
    setTimeout(() => startFaceCamera(nextMode), 200);
  };

  const startFaceDetectionLoop = () => {
    if (faceLoopIntervalRef.current) clearInterval(faceLoopIntervalRef.current);

    let laserY = 0;
    let laserDir = 1;
    let tick = 0;

    faceLoopIntervalRef.current = setInterval(async () => {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      const ctx = canvas.getContext('2d');
      const w = (canvas.width = video.videoWidth || 640);
      const h = (canvas.height = video.videoHeight || 480);
      ctx.clearRect(0, 0, w, h);

      const boxW = Math.min(w * 0.6, 260);
      const boxH = Math.min(h * 0.72, 280);
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      laserY += 4 * laserDir;
      if (laserY > boxH) {
        laserDir = -1;
        laserY = boxH;
      }
      if (laserDir < 0 && laserY < 0) {
        laserDir = 1;
        laserY = 0;
      }

      ctx.strokeStyle = isMatchedCooldownRef.current ? '#10b981' : '#0284c7';
      ctx.lineWidth = 3;
      const corner = 24;

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = isMatchedCooldownRef.current ? 'rgba(16, 185, 129, 0.85)' : 'rgba(2, 132, 199, 0.75)';
      ctx.lineWidth = 2;
      ctx.moveTo(boxX + 4, boxY + laserY);
      ctx.lineTo(boxX + boxW - 4, boxY + laserY);
      ctx.stroke();

      if (isMatchedCooldownRef.current) return;

      tick++;
      if (tick % 3 !== 0) return;
      if (isDetectingRef.current) return;

      isDetectingRef.current = true;
      try {
        let registeredMap = {};
        try {
          registeredMap = JSON.parse(localStorage.getItem('epesantren_face_profiles') || '{}');
        } catch (e) {}
        
        const registeredList = [];
        const seenIds = new Set();

        (santriListRef.current || []).forEach((s) => {
          let desc = null;
          if (s.face_descriptor) {
            try {
              desc = typeof s.face_descriptor === 'string' ? JSON.parse(s.face_descriptor) : s.face_descriptor;
            } catch (e) {}
          }
          if (!desc && registeredMap[s.id]?.descriptor) {
            desc = registeredMap[s.id].descriptor;
          }
          if (desc) {
            registeredList.push({
              santri_id: s.id,
              id: s.id,
              nama_santri: s.nama_santri,
              nama: s.nama_santri,
              nis: s.nis,
              descriptor: desc,
              foto: s.foto || s.foto_santri
            });
            seenIds.add(String(s.id));
          }
        });

        Object.values(registeredMap).forEach((p) => {
          const pId = String(p.santri_id || p.id || '');
          if (pId && !seenIds.has(pId) && p.descriptor) {
            registeredList.push(p);
            seenIds.add(pId);
          }
        });

        if (isFaceModelReady()) {
          const faceRes = await detectFaceDescriptor(video);
          if (!faceRes) {
            setIsFaceDetected(false);
            setFaceStatusText('Arahkan wajah santri ke kamera...');
            return;
          }

          setIsFaceDetected(true);
          const matched = matchFaceDescriptor(faceRes.descriptor, registeredList, 0.70);

          if (matched && !matched.error && (matched.santri_id || matched.id)) {
            const fullSantri =
              (santriListRef.current || []).find(
                (s) => String(s.santri_id || s.id) === String(matched.santri_id || matched.id)
              ) || matched;
            const displayName = fullSantri.nama_santri || matched.nama;
            handleSantriSelected(fullSantri, displayName);
          } else {
            const distInfo = (matched && typeof matched.bestDistance === 'number' && matched.bestDistance < 900)
              ? ` (Jarak: ${matched.bestDistance.toFixed(2)} | Target: < 0.70)`
              : '';
            setFaceStatusText(`⛔ Belum Cocok${distInfo}`);
          }
        } else {
          setFaceStatusText('Memuat model pengenalan wajah AI...');
        }
      } catch (e) {
      } finally {
        isDetectingRef.current = false;
      }
    }, 150);
  };

  const handleSantriSelected = (santriObj, displayName) => {
    isMatchedCooldownRef.current = true;
    setMatchedSantriPreview(santriObj);
    setFaceStatusText(`✅ Santri Dikenali: ${displayName}`);
    playSuccessSound();

    setTimeout(() => {
      stopFaceCamera();
      const sId = santriObj.santri_id || santriObj.id;
      const defaultKat =
        defaultKategoriId || (masterKategori[0]?.id ? String(masterKategori[0].id) : '');
      setEvalForm({
        santri_id: sId,
        santriObj: santriObj,
        kategori_id: defaultKat,
        tanggal: tanggalEvaluasi || new Date().toISOString().slice(0, 10),
        status_kelulusan: santriObj.status_kelulusan || 'Lulus',
        permasalahan: Array.isArray(santriObj.permasalahan_list) ? santriObj.permasalahan_list : [],
        penyebab: Array.isArray(santriObj.penyebab_list) ? santriObj.penyebab_list : [],
        tindakan: Array.isArray(santriObj.tindakan_list) ? santriObj.tindakan_list : [],
        catatan_tambahan: santriObj.catatan_tambahan || ''
      });
      setStep('form');
      toastSuccess(`Santri Terpilih: ${displayName}`);
    }, 550);
  };

  const activeKatObj =
    masterKategori.find((k) => String(k.id) === String(evalForm.kategori_id)) ||
    masterKategori[0] ||
    null;

  const handleToggleChecklist = (tipe, teks) => {
    setEvalForm((prev) => {
      const currentArr = prev[tipe] || [];
      const exists = currentArr.includes(teks);
      return {
        ...prev,
        [tipe]: exists ? currentArr.filter((t) => t !== teks) : [...currentArr, teks]
      };
    });
  };

  const handleSubmitEvaluasi = async (e) => {
    e.preventDefault();
    if (!evalForm.santri_id || !evalForm.kategori_id) {
      showError('Validasi Gagal', 'Pastikan santri dan bidang pengembangan sudah dipilih.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        kategori_id: parseInt(evalForm.kategori_id),
        kelas_id: evalForm.santriObj?.nama_asrama || 'Semua',
        tanggal: evalForm.tanggal,
        evaluasi: [
          {
            santri_id: evalForm.santri_id,
            status_kelulusan: evalForm.status_kelulusan,
            permasalahan: evalForm.status_kelulusan === 'Tidak Lulus' ? evalForm.permasalahan : [],
            penyebab: evalForm.status_kelulusan === 'Tidak Lulus' ? evalForm.penyebab : [],
            tindakan: evalForm.status_kelulusan === 'Tidak Lulus' ? evalForm.tindakan : [],
            catatan_tambahan: evalForm.catatan_tambahan || ''
          }
        ]
      };

      const res = await axios.post('/api/perkembangan-ikhwan/evaluasi-batch', payload);
      if (res.data?.success) {
        toastSuccess('Evaluasi pengembangan santri berhasil disimpan');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: step === 'scan' ? '480px' : '740px',
          maxHeight: '92vh',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            background: gender === 'P' ? '#9d174d' : '#0284c7',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={18} />
            <div>
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800 }}>
                {step === 'scan'
                  ? `Langkah 1: Scan Wajah Santri (${gender === 'P' ? 'Akhwat' : 'Ikhwan'})`
                  : `Langkah 2: Pilih Bidang & Status Kelulusan`}
              </h3>
              <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                Alur: Scan Wajah ➔ Pilih Bidang Pengembangan ➔ Lulus / Tidak Lulus (Checklist Diagnostik)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopFaceCamera();
              onClose();
            }}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* STEP 1: SCAN WAJAH */}
        {step === 'scan' && (
          <div>
            <div style={{ position: 'relative', background: '#000000', height: '330px', overflow: 'hidden' }}>
              <video
                ref={faceVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: faceFacingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />
              <canvas
                ref={faceCanvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              />

              <button
                type="button"
                onClick={toggleFaceFacingMode}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(15,23,42,0.75)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={13} /> Ganti Kamera
              </button>

              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  background: matchedSantriPreview
                    ? 'rgba(16,185,129,0.92)'
                    : isFaceDetected
                    ? 'rgba(2,132,199,0.9)'
                    : 'rgba(15,23,42,0.82)',
                  color: '#ffffff',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                {faceCameraError || faceStatusText}
              </div>
            </div>

            <div style={{ padding: '14px 18px', background: '#f8fafc' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Atau pilih santri langsung jika kamera tidak tersedia / wajah belum terdaftar:
              </div>
              <SearchableSelect
                options={santriList.map((s) => ({
                  value: s.santri_id || s.id,
                  label: `${s.nama_santri} (NIS: ${s.nis || '-'}) - ${s.nama_asrama || 'Asrama'}`
                }))}
                value={manualSantriId}
                onChange={(val) => {
                  setManualSantriId(val);
                  const found = santriList.find((s) => String(s.santri_id || s.id) === String(val));
                  if (found) {
                    handleSantriSelected(found, found.nama_santri);
                  }
                }}
                placeholder="Cari nama atau NIS santri..."
              />
            </div>
          </div>
        )}

        {/* STEP 2: PILIH BIDANG -> LULUS / TIDAK LULUS -> CHECKLIST DIAGNOSTIK */}
        {step === 'form' && (
          <form
            onSubmit={handleSubmitEvaluasi}
            style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* Baris Info Santri */}
            <div
              style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7' }}>SANTRI TERDETEKSI</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                  {evalForm.santriObj?.nama_santri}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  NIS: <strong>{evalForm.santriObj?.nis}</strong> • {evalForm.santriObj?.nama_asrama || 'Asrama'} ({evalForm.santriObj?.nama_kamar || 'Kobong'})
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('scan');
                  setTimeout(() => startFaceCamera(faceFacingMode), 200);
                }}
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Camera size={14} /> Scan Santri Lain
              </button>
            </div>

            {/* Pilih Bidang Pengembangan */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                1. Pilih Bidang Pengembangan *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                {masterKategori.map((kat) => {
                  const selected = String(evalForm.kategori_id) === String(kat.id);
                  return (
                    <button
                      key={kat.id}
                      type="button"
                      onClick={() =>
                        setEvalForm((prev) => ({
                          ...prev,
                          kategori_id: String(kat.id),
                          permasalahan: [],
                          penyebab: [],
                          tindakan: []
                        }))
                      }
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: selected ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: selected ? '#e0f2fe' : '#ffffff',
                        color: selected ? '#0369a1' : '#334155',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{kat.nama_kategori}</span>
                      {selected && <CheckCircle2 size={14} color="#0284c7" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pilih Status Kelulusan */}
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                2. Status Kelulusan Evaluasi *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEvalForm((prev) => ({ ...prev, status_kelulusan: 'Lulus' }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: evalForm.status_kelulusan === 'Lulus' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: evalForm.status_kelulusan === 'Lulus' ? '#10b981' : '#ffffff',
                    color: evalForm.status_kelulusan === 'Lulus' ? '#ffffff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> LULUS
                </button>
                <button
                  type="button"
                  onClick={() => setEvalForm((prev) => ({ ...prev, status_kelulusan: 'Tidak Lulus' }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: evalForm.status_kelulusan === 'Tidak Lulus' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    background: evalForm.status_kelulusan === 'Tidak Lulus' ? '#ef4444' : '#ffffff',
                    color: evalForm.status_kelulusan === 'Tidak Lulus' ? '#ffffff' : '#475569',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} /> TIDAK LULUS
                </button>
              </div>
            </div>

            {/* Checklist Diagnostik saat Tidak Lulus */}
            {evalForm.status_kelulusan === 'Tidak Lulus' && activeKatObj && (
              <div
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={15} /> 3. Checklist Diagnostik ({activeKatObj.nama_kategori})
                </div>

                {/* (A) Permasalahan */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b91c1c', marginBottom: '6px' }}>
                    (A.) Butir Permasalahan:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
                    {(activeKatObj.permasalahan || []).map((p, idx) => {
                      const checked = evalForm.permasalahan.includes(p.teks);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: checked ? '#fee2e2' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: checked ? '1px solid #f87171' : '1px solid #e2e8f0',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleChecklist('permasalahan', p.teks)}
                            style={{ accentColor: '#dc2626', marginTop: '2px' }}
                          />
                          <span>
                            <strong>{p.kode || String.fromCharCode(97 + idx)}.</strong> {p.teks}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* (B) Penyebab */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c2410c', marginBottom: '6px' }}>
                    (B.) Faktor Penyebab:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
                    {(activeKatObj.penyebab || []).map((c, idx) => {
                      const checked = evalForm.penyebab.includes(c.teks);
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: checked ? '#ffedd5' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: checked ? '1px solid #fb923c' : '1px solid #e2e8f0',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleChecklist('penyebab', c.teks)}
                            style={{ accentColor: '#ea580c', marginTop: '2px' }}
                          />
                          <span>
                            <strong>{c.kode || String.fromCharCode(97 + idx)}.</strong> {c.teks}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* (C) Tindakan */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#047857', marginBottom: '6px' }}>
                    (C.) Tindakan / Solusi:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
                    {(activeKatObj.tindakan || []).map((t, idx) => {
                      const checked = evalForm.tindakan.includes(t.teks);
                      return (
                        <label
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: checked ? '#d1fae5' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: checked ? '1px solid #34d399' : '1px solid #e2e8f0',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleChecklist('tindakan', t.teks)}
                            style={{ accentColor: '#059669', marginTop: '2px' }}
                          />
                          <span>
                            <strong>{t.kode || String.fromCharCode(97 + idx)}.</strong> {t.teks}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Catatan Tambahan */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                Catatan Tambahan Asatidz (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Catatan khusus perkembangan santri..."
                value={evalForm.catatan_tambahan}
                onChange={(e) => setEvalForm((prev) => ({ ...prev, catatan_tambahan: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Save size={14} /> {submitting ? 'Menyimpan...' : 'Simpan Evaluasi Santri'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

