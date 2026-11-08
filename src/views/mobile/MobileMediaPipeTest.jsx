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
  Maximize2,
  Database,
  Check,
  X
} from 'lucide-react';
import {
  initFaceApiModels,
  detectFaceDescriptor,
  computeEuclideanDistance,
  isValidDescriptor,
  normalizeDescriptor,
  isFaceModelReady
} from '../../utils/faceApi.util';

export default function MobileMediaPipeTest({ onBackToHome }) {
  const [facingMode, setFacingMode] = useState('user');
  const [activeMode, setActiveMode] = useState('match'); // 'match' | 'mesh' | 'features'
  const [loadingMediaPipe, setLoadingMediaPipe] = useState(true);
  const [loadStatus, setLoadStatus] = useState('Menyiapkan Engine MediaPipe & Biometrik...');
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

  // Santri matching test state (Database MySQL face_descriptor)
  const [santriList, setSantriList] = useState([]);
  const [santriWithBiometrics, setSantriWithBiometrics] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('all');
  const [evaluatingDescriptor, setEvaluatingDescriptor] = useState(false);
  const [descriptorResult, setDescriptorResult] = useState(null);

  // Target Pendaftaran ID Santri (Default: 41)
  const [targetRegisterId, setTargetRegisterId] = useState('41');
  const [registeringFace, setRegisteringFace] = useState(false);
  const [registerMessage, setRegisterMessage] = useState('');

  // Custom baseline test state
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

  // 1. Muat Script MediaPipe dari CDN & Model Biometrik
  useEffect(() => {
    let isMounted = true;

    const loadEngines = async () => {
      try {
        setLoadStatus('Menyiapkan Google MediaPipe FaceMesh...');
        if (!window.FaceMesh) {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        }

        if (!isMounted) return;

        // Inisialisasi FaceMesh WASM
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

        // Inisialisasi Model Biometrik 128-D Face-API paralel
        setLoadStatus('Memuat model biometrik 128-D...');
        await initFaceApiModels().catch(() => {});

        if (!isMounted) return;

        setLoadingMediaPipe(false);
        setLoadStatus('Google MediaPipe & Biometrik Siap!');
        startCamera(facingMode);
      } catch (err) {
        console.error('Gagal memuat engine:', err);
        if (isMounted) {
          setLoadStatus('Gagal memuat library MediaPipe dari CDN. Periksa koneksi internet.');
          setLoadingMediaPipe(false);
        }
      }
    };

    loadEngines();
    fetchBiometricsData(targetRegisterId);

    return () => {
      isMounted = false;
      stopCamera();
      if (faceMeshRef.current) {
        try { faceMeshRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Sinkronisasi Biometrik MySQL & LocalStorage
  const fetchBiometricsData = async (targetId = targetRegisterId) => {
    try {
      // 1. Ambil data santri yang punya biometrik langsung dari endpoint MySQL cepat
      const resWithFace = await axios.get(`/api/santri/with-face?_t=${Date.now()}`).catch(() => ({ data: { data: [] } }));
      const dbList = resWithFace.data?.data || [];

      // 2. Ambil cache lokal
      let localMap = {};
      try {
        localMap = JSON.parse(localStorage.getItem('epesantren_face_profiles') || '{}');
      } catch (e) {}

      // 3. Ambil status santri target secara spesifik
      const resSingle = await axios.get(`/api/santri/${targetId}/face-status?_t=${Date.now()}`).catch(() => null);
      const singleSantri = resSingle?.data?.santri;

      const mergedList = [];
      const seenIds = new Set();

      // Prioritas 1: Dari endpoint MySQL /with-face
      dbList.forEach(s => {
        const norm = normalizeDescriptor(s.face_descriptor);
        if (norm) {
          mergedList.push({
            id: s.id,
            nama_santri: s.nama_santri,
            nis: s.nis,
            foto: s.foto,
            parsedDescriptor: norm,
            face_descriptor: norm,
            source: 'mysql'
          });
          seenIds.add(String(s.id));
        }
      });

      // Prioritas 2: Dari single santri query
      if (singleSantri && singleSantri.has_face && !seenIds.has(String(singleSantri.id))) {
        const norm = normalizeDescriptor(singleSantri.face_descriptor);
        if (norm) {
          mergedList.push({
            id: singleSantri.id,
            nama_santri: singleSantri.nama_santri,
            nis: singleSantri.nis,
            foto: singleSantri.foto,
            parsedDescriptor: norm,
            face_descriptor: norm,
            source: 'mysql'
          });
          seenIds.add(String(singleSantri.id));
        }
      }

      // Prioritas 3: Dari localStorage jika di DB belum sinkron
      Object.values(localMap).forEach(p => {
        const pId = String(p.santri_id || p.id || '');
        if (pId && !seenIds.has(pId)) {
          const norm = normalizeDescriptor(p.descriptor || p.face_descriptor);
          if (norm) {
            mergedList.push({
              id: pId,
              nama_santri: p.nama || p.nama_santri,
              nis: p.nis,
              foto: p.foto,
              parsedDescriptor: norm,
              face_descriptor: norm,
              source: 'local'
            });
            seenIds.add(pId);
          }
        }
      });

      setSantriWithBiometrics(mergedList);
      if (mergedList.length > 0 && (selectedSantriId === 'all' || !mergedList.some(s => String(s.id) === String(selectedSantriId)))) {
        const matchTarget = mergedList.find(s => String(s.id) === String(targetId));
        setSelectedSantriId(matchTarget ? String(matchTarget.id) : String(mergedList[0].id));
      }

      // Ambil juga master list nama santri untuk dropdown
      if (santriList.length === 0) {
        axios.get(`/api/santri?limit=100&_t=${Date.now()}`).then(r => {
          setSantriList(r.data?.data || []);
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Gagal memuat biometrik:', e);
    }
  };

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
  const computeGeometricVector = (landmarks) => {
    if (!landmarks || landmarks.length < 468) return null;

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

    const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y, rightEye.z - leftEye.z) || 1;

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
      ...([172, 136, 150, 149, 176, 148, 152, 377, 400, 378].map(idx => {
        const pt = landmarks[idx] || chin;
        return Math.hypot(pt.x - chin.x, pt.y - chin.y) / eyeDist;
      })),
      ...([33, 133, 159, 145, 153, 263, 362, 386, 374, 380].map(idx => {
        const pt = landmarks[idx] || noseTip;
        return Math.hypot(pt.x - noseTip.x, pt.y - noseTip.y) / eyeDist;
      }))
    ];

    return vector;
  };

  const computeCosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
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

      // Hitung vektor dan komparasi acuan custom
      const currentVector = computeGeometricVector(landmarks);
      if (registeredEmbedding && currentVector) {
        const similarity = computeCosineSimilarity(registeredEmbedding, currentVector);
        setLiveSimilarity(similarity);
        if (similarity >= 0.94) {
          setMatchStatusText(`✅ Wajah Cocok! Kemiripan Geometrik: ${(similarity * 100).toFixed(1)}%`);
        } else {
          setMatchStatusText(`⛔ Belum Cocok. Kemiripan: ${(similarity * 100).toFixed(1)}% (Target: ≥ 94%)`);
        }
      }

      drawVisualization(ctx, landmarks, canvas.width, canvas.height);
    } else {
      setFaceDetected(false);
      setLiveSimilarity(null);
      setMatchStatusText('Arahkan wajah santri tegak ke kamera...');
    }
  };

  // 6. Visualizer Canvas
  const drawVisualization = (ctx, landmarks, w, h) => {
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

    const isMatchSuccess = descriptorResult?.success || (registeredEmbedding && liveSimilarity >= 0.94);
    ctx.strokeStyle = isMatchSuccess ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    const corner = 20;

    // Corner brackets
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

    // Tampilkan Mesh Wajah
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      ctx.fillRect(pt.x * w - 1, pt.y * h - 1, 2, 2);
    }

    // Sorot Titik Kunci (Hidung, Mata, Bibir, Dagu)
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
  };

  // 7. INTI PENGUJIAN: Uji Deteksi Wajah Live terhadap face_descriptor Database MySQL
  const handleTestDatabaseFaceDescriptor = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setLoadStatus('Kamera belum siap');
      return;
    }

    setEvaluatingDescriptor(true);
    setLoadStatus('📸 Mengambil snapshot & mencocokkan biometrik database...');

    try {
      // 1. Ekstrak descriptor 128-D dari frame video saat ini
      const faceRes = await detectFaceDescriptor(video);
      if (!faceRes || !faceRes.descriptor) {
        setDescriptorResult({
          status: 'no_face',
          message: 'Wajah tidak terdeteksi oleh sensor biometrik. Posisikan wajah tepat di tengah kamera.'
        });
        setEvaluatingDescriptor(false);
        setLoadStatus('Wajah tidak terdeteksi');
        return;
      }

      const liveDescriptor = faceRes.descriptor;

      // 2. Tentukan target santri pembanding
      let candidates = santriWithBiometrics;
      if (selectedSantriId !== 'all') {
        const single = santriWithBiometrics.find(s => String(s.id) === String(selectedSantriId));
        candidates = single ? [single] : santriWithBiometrics;
      }

      if (candidates.length === 0) {
        setDescriptorResult({
          status: 'empty_db',
          message: 'Belum ada data face_descriptor di database MySQL. Daftarkan santri terlebih dahulu di menu Daftar Wajah.'
        });
        setEvaluatingDescriptor(false);
        setLoadStatus('Tidak ada data biometrik di database');
        return;
      }

      // 3. Hitung Jarak Euclidean terhadap vektor yang tersimpan di MySQL
      let bestMatch = null;
      let minDistance = 999;

      candidates.forEach(santri => {
        const dbDesc = santri.parsedDescriptor;
        if (isValidDescriptor(dbDesc)) {
          const dist = computeEuclideanDistance(liveDescriptor, dbDesc);
          if (dist < minDistance) {
            minDistance = dist;
            bestMatch = santri;
          }
        }
      });

      const threshold = 0.70;
      const isMatch = bestMatch && minDistance < threshold;

      setDescriptorResult({
        status: isMatch ? 'matched' : 'not_matched',
        success: isMatch,
        distance: minDistance,
        threshold: threshold,
        santri: bestMatch,
        confidence: Math.round(Math.max(0, (1 - minDistance / threshold) * 100)),
        liveDescriptorSnippet: liveDescriptor.slice(0, 5),
        dbDescriptorSnippet: bestMatch?.parsedDescriptor ? bestMatch.parsedDescriptor.slice(0, 5) : []
      });

      if (isMatch) {
        setLoadStatus(`✅ COCOK! Wajah Sesuai: ${bestMatch.nama_santri} (Jarak: ${minDistance.toFixed(2)})`);
      } else {
        setLoadStatus(`⛔ BELUM COCOK (Jarak: ${minDistance.toFixed(2)} | Target: < ${threshold})`);
      }
    } catch (err) {
      console.error('Error matching descriptor:', err);
      setDescriptorResult({
        status: 'error',
        message: 'Terjadi kesalahan saat memproses vektor biometrik.'
      });
    } finally {
      setEvaluatingDescriptor(false);
    }
  };

  // 8. DAFTARKAN WAJAH LANGSUNG KE SANTRI MYSQL DATABASE (ID SANTRI: MISAL 41)
  const handleRegisterFaceToDatabase = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setRegisterMessage('⚠️ Kamera belum siap. Arahkan wajah ke kamera.');
      return;
    }

    setRegisteringFace(true);
    setRegisterMessage(`📸 Memindai wajah & menyimpan biometrik ke Santri ID ${targetRegisterId}...`);

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = video.videoWidth || 640;
      snapCanvas.height = video.videoHeight || 480;
      const ctx = snapCanvas.getContext('2d');
      if (facingMode === 'user') {
        ctx.translate(snapCanvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      const photoDataUrl = snapCanvas.toDataURL('image/jpeg', 0.85);

      const faceRes = await detectFaceDescriptor(snapCanvas);
      if (!faceRes || !faceRes.descriptor) {
        setRegisterMessage('❌ Wajah tidak terdeteksi. Posisikan wajah tegak & terang menghadap kamera.');
        setRegisteringFace(false);
        return;
      }

      const descriptorArray = Array.from(faceRes.descriptor);

      const res = await axios.post(`/api/santri/${targetRegisterId}/face-descriptor`, {
        face_descriptor: descriptorArray,
        foto: photoDataUrl
      });

      if (res.data?.success) {
        const santriInfo = res.data.santri || santriList.find(s => String(s.id) === String(targetRegisterId)) || { id: Number(targetRegisterId), nama_santri: `Santri #${targetRegisterId}` };
        setRegisterMessage(`✅ SUKSES! Wajah tersimpan ke Database MySQL untuk: ${santriInfo.nama_santri} (ID: ${targetRegisterId})`);

        const newEntry = {
          id: Number(targetRegisterId),
          nama_santri: santriInfo.nama_santri,
          nis: santriInfo.nis || '',
          face_descriptor: descriptorArray,
          parsedDescriptor: descriptorArray,
          foto: photoDataUrl
        };

        setSantriWithBiometrics(prev => {
          const filtered = prev.filter(s => String(s.id) !== String(targetRegisterId));
          return [newEntry, ...filtered];
        });
        setSelectedSantriId(String(targetRegisterId));

        await fetchBiometricsData(targetRegisterId);
        setTimeout(() => {
          handleTestDatabaseFaceDescriptor();
        }, 400);
      } else {
        setRegisterMessage(`❌ Gagal: ${res.data?.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error registering face:', err);
      setRegisterMessage(`❌ Gagal menyimpan: ${err.response?.data?.message || err.message}`);
    } finally {
      setRegisteringFace(false);
    }
  };

  // Daftarkan Acuan Wajah Custom
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
              <span style={{ background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 800, padding: '2px 5px', borderRadius: '4px' }}>WASM + DB</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              Uji Deteksi Wajah & face_descriptor MySQL
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
          maxHeight: '430px',
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

          {/* Badge Status Realtime */}
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
            background: descriptorResult?.success
              ? 'rgba(16, 185, 129, 0.92)'
              : 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.18)',
            padding: '9px 12px',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#ffffff'
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
            { id: 'match', label: '🧬 Uji face_descriptor', desc: 'MySQL Database' },
            { id: 'mesh', label: '🌟 3D Mesh', desc: '468 Titik' },
            { id: 'features', label: '🎯 Kontur Fitur', desc: 'Mata/Bibir' }
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
              <div style={{ fontSize: '0.74rem', fontWeight: 800 }}>{m.label}</div>
              <div style={{ fontSize: '0.6rem', color: activeMode === m.id ? '#e0f2fe' : '#94a3b8' }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* =========================================================================
            PANEL UTAMA: UJI DETEKSI TERHADAP face_descriptor DATABASE
        ========================================================================= */}
        <div style={{
          marginTop: '14px',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '14px'
        }}>
          {activeMode === 'match' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* SECTION 1: DAFTARKAN WAJAH SEKARANG KE SANTRI MYSQL */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid #10b981',
                borderRadius: '14px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={16} /> 1. Daftarkan Wajah ke MySQL Santri
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ID Santri:</span>
                    <input
                      type="number"
                      value={targetRegisterId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetRegisterId(val);
                        if (val) fetchBiometricsData(val);
                      }}
                      style={{
                        width: '55px',
                        background: '#1e293b',
                        color: '#ffffff',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        padding: '3px 6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>

                {/* Info Santri Target */}
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', background: 'rgba(2, 6, 23, 0.6)', padding: '7px 10px', borderRadius: '8px' }}>
                  Target: <strong>{santriList.find(s => String(s.id) === String(targetRegisterId))?.nama_santri || `Santri #${targetRegisterId}`}</strong>
                  {santriList.find(s => String(s.id) === String(targetRegisterId))?.nis && ` • NIS: ${santriList.find(s => String(s.id) === String(targetRegisterId))?.nis}`}
                  {santriWithBiometrics.some(s => String(s.id) === String(targetRegisterId)) ? (
                    <span style={{ color: '#34d399', marginLeft: '6px', fontWeight: 700 }}>✓ Sudah ada di DB</span>
                  ) : (
                    <span style={{ color: '#f59e0b', marginLeft: '6px', fontWeight: 700 }}>⚠️ Belum ada di DB</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={registeringFace}
                  onClick={handleRegisterFaceToDatabase}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Camera size={15} />
                  {registeringFace ? 'Menyimpan Biometrik ke MySQL...' : `DAFTARKAN WAJAH KE SANTRI ID ${targetRegisterId} (SIMPAN MYSQL)`}
                </button>

                {registerMessage && (
                  <div style={{
                    fontSize: '0.72rem',
                    color: registerMessage.includes('✅') ? '#34d399' : '#fca5a5',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontWeight: 600
                  }}>
                    {registerMessage}
                  </div>
                )}
              </div>

              {/* SECTION 2: UJI DETEKSI & COCOKKAN FACE_DESCRIPTOR */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1.5px solid #0284c7',
                borderRadius: '14px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Database size={16} /> 2. Uji Deteksi & Cocokkan face_descriptor
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    {santriWithBiometrics.length} Terdaftar di DB
                  </span>
                </div>

                {/* Pilih Target Santri Pembanding */}
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Pilih Data Santri dari MySQL Database:
                  </label>
                  <select
                    value={selectedSantriId}
                    onChange={(e) => {
                      setSelectedSantriId(e.target.value);
                      setDescriptorResult(null);
                    }}
                    style={{
                      width: '100%',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: '1.5px solid #38bdf8',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option value="all">🔍 Scan Otomatis (Cari di Semua Santri Terdaftar)</option>
                    {santriWithBiometrics.map(s => (
                      <option key={s.id} value={s.id}>
                        ✓ [{s.id}] {s.nama_santri} (NIS: {s.nis || '-'}) - {s.nama_kelas || 'Kelas'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tombol Eksekusi Snapshot Biometrik */}
                <button
                  type="button"
                  disabled={evaluatingDescriptor}
                  onClick={handleTestDatabaseFaceDescriptor}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                >
                  <Camera size={16} />
                  {evaluatingDescriptor ? 'Menganalisis Biometrik 128-D...' : '📸 UJI DETEKSI FACE_DESCRIPTOR SEKARANG'}
                </button>

                {/* Hasil Pencocokan Biometrik */}
                {descriptorResult && (
                  <div style={{
                    background: descriptorResult.success
                      ? 'rgba(6, 78, 59, 0.7)'
                      : 'rgba(127, 29, 29, 0.65)',
                    border: descriptorResult.success
                      ? '1.5px solid #10b981'
                      : '1.5px solid #ef4444',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: descriptorResult.success ? '#34d399' : '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {descriptorResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {descriptorResult.success ? 'WAJAH COCOK (MATCHED)' : 'BELUM COCOK'}
                      </div>
                      {typeof descriptorResult.distance === 'number' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>
                          Jarak: {descriptorResult.distance.toFixed(3)}
                        </span>
                      )}
                    </div>

                    {descriptorResult.santri && (
                      <div style={{ fontSize: '0.74rem', color: '#f1f5f9', lineHeight: 1.4 }}>
                        <div>Santri: <strong>{descriptorResult.santri.nama_santri}</strong> (NIS: {descriptorResult.santri.nis})</div>
                        <div>Ambang Batas (Threshold): <strong>&lt; {descriptorResult.threshold}</strong> | Tingkat Keyakinan: <strong>{descriptorResult.confidence}%</strong></div>
                      </div>
                    )}

                    {descriptorResult.message && (
                      <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                        {descriptorResult.message}
                      </div>
                    )}

                    {/* Vektor snippet inspeksi teknis */}
                    {descriptorResult.dbDescriptorSnippet?.length > 0 && (
                      <div style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '0.62rem',
                        fontFamily: 'monospace',
                        color: '#94a3b8',
                        overflowX: 'auto'
                      }}>
                        <div>DB Vector [0..4]: [{descriptorResult.dbDescriptorSnippet.map(n => Number(n).toFixed(3)).join(', ')}, ...]</div>
                        <div>Live Vector [0..4]: [{descriptorResult.liveDescriptorSnippet?.map(n => Number(n).toFixed(3)).join(', ')}, ...]</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeMode === 'mesh' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} /> Analisis Realtime MediaPipe 3D Mesh
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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Uji Biometrik Geometri Wajah MediaPipe
              </div>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.4 }}>
                Daftarkan acuan wajah baru langsung melalui kamera untuk menguji normalisasi spasial 32 koordinat MediaPipe.
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
          )}
        </div>

        {/* =========================================================================
            INFO CARD
        ========================================================================= */}
        <div style={{
          marginTop: '12px',
          background: 'rgba(2, 132, 199, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '14px',
          padding: '12px'
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
            ℹ️ Cara Kerja Uji `face_descriptor` di Sini:
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <li>Kamera diproses secara ultra-cepat oleh <strong>Google MediaPipe WASM 3D</strong> (468 titik).</li>
            <li>Saat tombol <strong>UJI DETEKSI</strong> diklik, sistem mengekstrak vektor biometrik 128-D dari wajah Anda dan menghitung jarak matematis Euclidean langsung terhadap kolom <code>face_descriptor</code> di MySQL.</li>
            <li>Jika jarak biometrik &lt; 0.70, sistem menyatakan <strong>COCOK</strong> dan menampilkan nama santri terdaftar.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
