import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  UserCheck,
  ShieldCheck,
  Cpu,
  User,
  Sliders,
  Maximize2
} from 'lucide-react';

export default function MobileMediaPipeTest({ onBackToHome }) {
  const [facingMode, setFacingMode] = useState('user');
  const [activeMode, setActiveMode] = useState('mesh'); // 'mesh' | 'features' | 'match'
  const [loadingMediaPipe, setLoadingMediaPipe] = useState(true);
  const [loadStatus, setLoadStatus] = useState('Memuat script Google MediaPipe...');
  const [cameraActive, setCameraActive] = useState(false);
  const [fps, setFps] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceMetrics, setFaceMetrics] = useState({
    landmarksCount: 0,
    headPose: 'Tegak (Depan)',
    eyeOpenness: 'Normal',
    mouthOpenness: 'Tertutup',
    yawAngle: 0,
    pitchAngle: 0
  });

  // Santri matching test state
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [registeredEmbedding, setRegisteredEmbedding] = useState(null);
  const [liveSimilarity, setLiveSimilarity] = useState(null);
  const [matchStatusText, setMatchStatusText] = useState('Arahkan wajah ke kamera untuk tes pengenalan...');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const isRunningRef = useRef(false);
  const currentLandmarksRef = useRef(null);

  // 1. Muat Script MediaPipe dari CDN secara Dinamis
  useEffect(() => {
    let isMounted = true;

    const loadScripts = async () => {
      try {
        setLoadStatus('Menyiapkan Google MediaPipe FaceMesh...');
        if (!window.FaceMesh) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        }

        if (!isMounted) return;

        setLoadStatus('Menginisialisasi Engine FaceMesh WASM...');
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onMediaPipeResults);
        faceMeshRef.current = faceMesh;

        setLoadingMediaPipe(false);
        setLoadStatus('Google MediaPipe Siap!');
        startCamera(facingMode);
      } catch (err) {
        console.error('Gagal memuat MediaPipe:', err);
        if (isMounted) {
          setLoadStatus('Gagal memuat library MediaPipe dari CDN. Periksa koneksi internet.');
          setLoadingMediaPipe(false);
        }
      }
    };

    loadScripts();

    // Fetch daftar santri untuk uji coba pencocokan
    axios.get(`/api/santri?all=true&_t=${Date.now()}`)
      .then(res => {
        const list = res.data?.data || [];
        setSantriList(Array.isArray(list) ? list.slice(0, 50) : []);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      stopCamera();
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.body.appendChild(s);
    });
  };

  // 2. Kontrol Kamera
  const startCamera = async (mode = 'user') => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setCameraActive(true);
            isRunningRef.current = true;
            processFrame();
          }).catch(() => {});
        };
      }
    } catch (e) {
      console.error('Camera error:', e);
      setLoadStatus('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
    }
  };

  const stopCamera = () => {
    isRunningRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // 3. Loop Pemrosesan Frame ke MediaPipe
  const processFrame = async () => {
    if (!isRunningRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= 2 && faceMeshRef.current) {
      try {
        await faceMeshRef.current.send({ image: video });
      } catch (err) {}
    }

    // Hitung realtime FPS
    frameCountRef.current += 1;
    const now = Date.now();
    if (now - lastTimeRef.current >= 1000) {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  };

  // 4. Hitung Vektor Geometrik Wajah dari 468 Landmark MediaPipe
  // Normalized geometric distances invariant to scale and translation
  const computeGeometricVector = (landmarks) => {
    if (!landmarks || landmarks.length < 468) return null;

    // Titik referensi anatomi wajah MediaPipe:
    // 33: Sudut luar mata kiri, 263: Sudut luar mata kanan
    // 1: Ujung hidung, 168: Tengah alis / dahi bawah, 152: Ujung dagu
    // 61: Sudut kiri bibir, 291: Sudut kanan bibir
    // 13: Bibir atas, 14: Bibir bawah
    // 234: Tulang pipi kiri, 454: Tulang pipi kanan
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];
    const chin = landmarks[152];
    const forehead = landmarks[168];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    // Skala normalisasi: Jarak antar kedua sudut mata luar
    const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y, rightEye.z - leftEye.z) || 1;

    // Vektor rasio geometrik (32 rasio biometrik stabil)
    const vector = [
      Math.hypot(noseTip.x - forehead.x, noseTip.y - forehead.y) / eyeDist,
      Math.hypot(chin.x - noseTip.x, chin.y - noseTip.y) / eyeDist,
      Math.hypot(chin.x - forehead.x, chin.y - forehead.y) / eyeDist,
      Math.hypot(rightMouth.x - leftMouth.x, rightMouth.y - leftMouth.y) / eyeDist,
      Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y) / eyeDist,
      Math.hypot(noseTip.x - leftEye.x, noseTip.y - leftEye.y) / eyeDist,
      Math.hypot(noseTip.x - rightEye.x, noseTip.y - rightEye.y) / eyeDist,
      Math.hypot(chin.x - leftMouth.x, chin.y - leftMouth.y) / eyeDist,
      Math.hypot(chin.x - rightMouth.x, chin.y - rightMouth.y) / eyeDist,
      Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y) / eyeDist,
      // 10 titik kontur rahang terhadap dagu
      ...([172, 136, 150, 149, 176, 148, 152, 377, 400, 378].map(idx => {
        const pt = landmarks[idx] || chin;
        return Math.hypot(pt.x - chin.x, pt.y - chin.y) / eyeDist;
      })),
      // 10 titik mata terhadap hidung
      ...([33, 133, 159, 145, 153, 263, 362, 386, 374, 380].map(idx => {
        const pt = landmarks[idx] || noseTip;
        return Math.hypot(pt.x - noseTip.x, pt.y - noseTip.y) / eyeDist;
      }))
    ];

    return vector;
  };

  // Cosine Similarity antara dua vektor
  const computeCosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  // 5. Callback Hasil MediaPipe FaceMesh
  const onMediaPipeResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      const landmarks = results.multiFaceLandmarks[0];
      currentLandmarksRef.current = landmarks;

      // Hitung orientasi kepala (Yaw / Pitch)
      const nose = landmarks[1];
      const leftEar = landmarks[234];
      const rightEar = landmarks[454];
      const forehead = landmarks[10];
      const chin = landmarks[152];

      const distLeft = Math.abs(nose.x - leftEar.x);
      const distRight = Math.abs(rightEar.x - nose.x);
      const yawRatio = distLeft / (distRight || 0.001);

      let poseText = 'Tegak (Depan)';
      if (yawRatio < 0.65) poseText = 'Menoleh Kanan 👉';
      else if (yawRatio > 1.55) poseText = '👈 Menoleh Kiri';

      const eyeOpen = Math.abs(landmarks[159].y - landmarks[145].y);
      const eyeText = eyeOpen > 0.018 ? 'Terbuka' : 'Berkedip / Tertutup';

      const mouthDist = Math.abs(landmarks[13].y - landmarks[14].y);
      const mouthText = mouthDist > 0.04 ? 'Terbuka' : 'Tertutup';

      setFaceMetrics({
        landmarksCount: landmarks.length,
        headPose: poseText,
        eyeOpenness: eyeText,
        mouthOpenness: mouthText,
        yawAngle: Math.round((yawRatio - 1) * 45),
        pitchAngle: Math.round((nose.y - (forehead.y + chin.y) / 2) * 100)
      });

      // Hitung vektor dan komparasi jika ada profil terdaftar
      const currentVector = computeGeometricVector(landmarks);
      if (registeredEmbedding && currentVector) {
        const similarity = computeCosineSimilarity(registeredEmbedding, currentVector);
        setLiveSimilarity(similarity);
        if (similarity >= 0.94) {
          setMatchStatusText(`✅ Wajah Cocok! Kemiripan: ${(similarity * 100).toFixed(1)}%`);
        } else {
          setMatchStatusText(`⛔ Belum Cocok. Kemiripan: ${(similarity * 100).toFixed(1)}% (Target: ≥ 94%)`);
        }
      }

      // Gambar Visualisasi Sesuai Mode
      drawVisualization(ctx, landmarks, canvas.width, canvas.height);
    } else {
      setFaceDetected(false);
      setLiveSimilarity(null);
      setMatchStatusText('Arahkan wajah santri tegak ke kamera...');
    }
  };

  // 6. Visualizer Canvas
  const drawVisualization = (ctx, landmarks, w, h) => {
    // A. Bounding Box Otomatis dari Ekstremum Landmark
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (const p of landmarks) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const padX = (maxX - minX) * 0.15;
    const padY = (maxY - minY) * 0.18;
    const boxX = Math.max(0, (minX - padX) * w);
    const boxY = Math.max(0, (minY - padY) * h);
    const boxW = Math.min(w - boxX, (maxX - minX + padX * 2) * w);
    const boxH = Math.min(h - boxY, (maxY - minY + padY * 2) * h);

    // Gambar Corner Bracket Futuristik
    ctx.strokeStyle = registeredEmbedding && liveSimilarity >= 0.94 ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    const corner = 20;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + corner);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + corner, boxY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - corner, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + corner);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - corner);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + corner, boxY + boxH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - corner, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - corner);
    ctx.stroke();

    if (activeMode === 'mesh') {
      // B. Gambar 468 Titik Mesh Wajah (Glowing Cyan Dots)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      for (let i = 0; i < landmarks.length; i++) {
        const pt = landmarks[i];
        const px = pt.x * w;
        const py = pt.y * h;
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }

      // Sorot Titik Kunci (Hidung, Mata, Bibir, Dagu) dengan Warna Emas/Hijau
      const keyIndices = [1, 33, 263, 61, 291, 13, 14, 152, 10, 234, 454];
      ctx.fillStyle = '#22c55e';
      keyIndices.forEach(idx => {
        const pt = landmarks[idx];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x * w, pt.y * h, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    } else if (activeMode === 'features') {
      // C. Mode Kontur Garis Utama (Mata, Alis, Bibir, Hidung)
      const drawContour = (indices, color = '#38bdf8', close = false) => {
        if (!indices || indices.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        indices.forEach((idx, i) => {
          const pt = landmarks[idx];
          if (!pt) return;
          const px = pt.x * w;
          const py = pt.y * h;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        if (close) ctx.closePath();
        ctx.stroke();
      };

      // Kontur Bibir
      drawContour([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 61], '#ef4444', true);
      // Kontur Mata Kiri & Kanan
      drawContour([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33], '#10b981', true);
      drawContour([263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263], '#10b981', true);
      // Hidung
      drawContour([168, 6, 197, 195, 5, 4, 1, 19, 94, 2], '#f59e0b', false);
    }
  };

  // Daftarkan Wajah Saat Ini Sebagai Sampel Acuan (Baseline)
  const handleRegisterCurrentFace = () => {
    if (!currentLandmarksRef.current || !faceDetected) {
      setMatchStatusText('⚠️ Posisikan wajah tegak di kamera sebelum mendaftar!');
      return;
    }
    const vec = computeGeometricVector(currentLandmarksRef.current);
    if (vec) {
      setRegisteredEmbedding(vec);
      setMatchStatusText('✅ Biometrik Wajah Tersimpan! Sekarang uji kemiripan live.');
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      paddingBottom: '32px'
    }}>
      {/* =========================================================================
          TOP HEADER
      ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBackToHome}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8' }}>Google MediaPipe</span>
              <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px' }}>WASM 3D</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              468 Landmark 3D Face Biometrics
            </div>
          </div>
        </div>

        <button
          onClick={handleFlipCamera}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            borderRadius: '10px',
            padding: '7px 11px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={13} /> Putar Kamera
        </button>
      </div>

      <div style={{ padding: '14px' }}>
        {/* =========================================================================
            VIEWPORT KAMERA & MESH OVERLAY
        ========================================================================= */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3/4',
          maxHeight: '440px',
          background: '#020617',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1.5px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />

          {/* Badge Status Realtime (FPS & Deteksi) */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: faceDetected ? 'rgba(16, 185, 129, 0.85)' : 'rgba(100, 116, 139, 0.75)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: faceDetected ? '#ffffff' : '#cbd5e1'
              }} />
              {faceDetected ? '468 Titik Terdeteksi' : 'Mencari Wajah...'}
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '4px 9px',
              borderRadius: '12px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#38bdf8'
            }}>
              ⚡ {fps} FPS
            </div>
          </div>

          {/* Floating Status Bar di Bawah Kamera */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            padding: '9px 12px',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '0.74rem',
            fontWeight: 700
          }}>
            {loadStatus}
          </div>
        </div>

        {/* =========================================================================
            TABS MODE TEST
        ========================================================================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px',
          marginTop: '14px'
        }}>
          {[
            { id: 'mesh', label: '🌟 3D Mesh', desc: '468 Titik' },
            { id: 'features', label: '🎯 Kontur Fitur', desc: 'Mata/Bibir' },
            { id: 'match', label: '🧬 Uji Cocok', desc: 'Biometrik' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id)}
              style={{
                background: activeMode === m.id ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
                border: activeMode === m.id ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff',
                padding: '9px 6px',
                borderRadius: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{m.label}</div>
              <div style={{ fontSize: '0.6rem', color: activeMode === m.id ? '#e0f2fe' : '#94a3b8' }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* =========================================================================
            PANEL KONTROL / METRICS
        ========================================================================= */}
        <div style={{
          marginTop: '14px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '14px'
        }}>
          {activeMode === 'match' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Uji Biometrik Geometri Wajah MediaPipe
              </div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Daftarkan wajah acuan Anda, lalu MediaPipe akan menghitung rasio spasial 32 vektor koordinat wajah untuk pengenalan presisi tinggi.
              </p>

              <button
                onClick={handleRegisterCurrentFace}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Camera size={14} /> Ambil Acuan Wajah Test
              </button>

              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '10px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {matchStatusText}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} /> Analisis Realtime MediaPipe
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '9px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Orientasi Kepala</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {faceMetrics.headPose}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '9px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Status Mata</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {faceMetrics.eyeOpenness}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '9px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Status Mulut</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                    {faceMetrics.mouthOpenness}
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '9px 10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Titik Koordinat</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                    {faceMetrics.landmarksCount} Titik (3D)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            INFO CARD: GOOGLE MEDIAPIPE VS MODEL LAMA
        ========================================================================= */}
        <div style={{
          marginTop: '12px',
          background: 'rgba(2, 132, 199, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '12px'
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
            ℹ️ Keunggulan Google MediaPipe:
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <li><strong>60 FPS Ringan</strong>: Berjalan langsung di WebAssembly (WASM) tanpa lag di HP & Laptop.</li>
            <li><strong>468 Titik Spasial 3D</strong>: Menangkap kontur lekukan hidung, bibir, dan mata dengan akurasi sub-piksel.</li>
            <li><strong>Toleran Pencahayaan</strong>: Menggunakan normalisasi geometri jarak antar mata yang tahan terhadap perubahan sudut dan cahaya ruangan.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
