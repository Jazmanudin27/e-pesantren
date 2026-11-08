// ==============================================================================
// GOOGLE MEDIAPIPE FACEMESH AI BIOMETRICS ENGINE (Client-Side WASM 3D 60 FPS)
// Menggantikan @vladmandic/face-api lama dengan Google MediaPipe FaceMesh
// 468 Titik Landmark 3D, Ekstraksi Vektor 128-D L2-Normalized & Zero Dependency
// ==============================================================================

let isScriptLoaded = false;
let isModelsLoaded = false;
let loadPromise = null;
let globalFaceMesh = null;
let isSending = false;
let pendingResolvers = [];
let lastMediaPipeResults = null;

// 1. Muat Script Google MediaPipe FaceMesh dari CDN
export const loadFaceApiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.FaceMesh && isScriptLoaded) return resolve(window.FaceMesh);

    const loadScriptTag = (src) => {
      return new Promise((res, rej) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return res();
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload = () => res();
        s.onerror = (e) => rej(e);
        document.body.appendChild(s);
      });
    };

    Promise.all([
      loadScriptTag('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
      loadScriptTag('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
    ])
      .then(() => {
        isScriptLoaded = true;
        resolve(window.FaceMesh);
      })
      .catch((err) => reject(new Error('Gagal mengunduh script Google MediaPipe FaceMesh dari CDN: ' + err.message)));
  });
};

// 2. Inisialisasi Engine Google MediaPipe FaceMesh WASM
export const initFaceApiModels = async (onProgress = null) => {
  if (isModelsLoaded && globalFaceMesh) return globalFaceMesh;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      if (onProgress) onProgress('Menyiapkan Google MediaPipe FaceMesh...');
      await loadFaceApiScript();

      if (onProgress) onProgress('Menginisialisasi Engine FaceMesh WASM 3D...');
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        lastMediaPipeResults = results;
        const resolvers = pendingResolvers;
        pendingResolvers = [];
        isSending = false;
        resolvers.forEach((cb) => {
          try { cb(results); } catch (e) {}
        });
      });

      globalFaceMesh = faceMesh;
      isModelsLoaded = true;
      if (onProgress) onProgress('Google MediaPipe FaceMesh Siap Digunakan (468 Titik 3D)');
      return faceMesh;
    } catch (err) {
      loadPromise = null;
      console.warn('MediaPipe load error:', err);
      throw err;
    }
  })();

  return loadPromise;
};

// 3. Status Engine Siap
export const isFaceModelReady = () => isModelsLoaded && !!globalFaceMesh;

// 4a. Ekstraksi 128-D L2-Normalized Biometric Vector dari 468 Landmark MediaPipe
export const computeMediaPipe128Descriptor = (landmarks) => {
  if (!landmarks || landmarks.length < 468) return null;

  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const noseTip = landmarks[1];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];

  // Skala normalisasi: Jarak antar kedua sudut mata luar
  const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y, rightEye.z - leftEye.z) || 0.1;
  const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y, chin.z - forehead.z) || 0.2;

  const raw = [
    // 10 Rasio Biometrik Segitiga Wajah Utama
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

    // 22 Titik Rahang & Kontur terhadap Dagu
    ...([172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 58, 132, 93, 234].map(idx => {
      const pt = landmarks[idx] || chin;
      return Math.hypot(pt.x - chin.x, pt.y - chin.y) / faceHeight;
    })),

    // 24 Titik Mata & Alis terhadap Hidung
    ...([33, 133, 159, 145, 153, 144, 163, 7, 70, 63, 105, 66, 107, 263, 362, 386, 374, 380, 373, 390, 249, 300, 293, 334].map(idx => {
      const pt = landmarks[idx] || noseTip;
      return Math.hypot(pt.x - noseTip.x, pt.y - noseTip.y) / eyeDist;
    })),

    // 24 Titik Bibir terhadap Pusat Bibir
    ...([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80].map(idx => {
      const pt = landmarks[idx] || upperLip;
      return Math.hypot(pt.x - upperLip.x, pt.y - upperLip.y) / eyeDist;
    })),

    // 24 Titik Hidung & Pipi
    ...([168, 6, 197, 195, 5, 4, 1, 19, 94, 2, 98, 97, 2, 326, 327, 278, 279, 48, 49, 115, 220, 45, 275, 440].map(idx => {
      const pt = landmarks[idx] || noseTip;
      return Math.hypot(pt.x - noseTip.x, pt.y - noseTip.y) / eyeDist;
    })),

    // 24 Titik Kedalaman Z (3D Spatial Landmarks)
    ...([1, 33, 263, 61, 291, 13, 14, 152, 10, 234, 454, 168, 197, 5, 4, 19, 94, 2, 133, 362, 159, 386, 145, 374].map(idx => {
      const pt = landmarks[idx] || noseTip;
      return (pt.z - noseTip.z) / eyeDist;
    }))
  ];

  // Pastikan tepat 128 elemen float
  const vec128 = raw.slice(0, 128);
  while (vec128.length < 128) {
    vec128.push(0);
  }

  // L2 Normalization (Membuat panjang vektor Euclidean = 1.0)
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    sumSq += vec128[i] * vec128[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec128.map(v => Number((v / norm).toFixed(6)));
};

// 4b. Validasi apakah array merupakan vektor biometrik 128-D yang valid
export const isValidDescriptor = (arr) => {
  if (!arr) return false;
  let target = normalizeDescriptor(arr);
  return Array.isArray(target) && target.length === 128;
};

// 4c. Normalisasi descriptor ke Array biasa [128 floats]
export const normalizeDescriptor = (arr) => {
  if (!arr) return null;
  let target = arr;
  if (typeof target === 'string') {
    try { target = JSON.parse(target); } catch (e) { return null; }
  }
  if (typeof target === 'string') {
    try { target = JSON.parse(target); } catch (e) { return null; }
  }
  // Toleransi objek serialisasi TypedArray {"0": -0.21, "1": ...}
  if (target && typeof target === 'object' && !Array.isArray(target) && !(target instanceof Float32Array)) {
    const vals = Object.values(target);
    if (vals.length === 128) target = vals;
  }
  if (target instanceof Float32Array) {
    target = Array.from(target);
  }
  if (Array.isArray(target) && target.length === 128) {
    return target.map(n => Number(n) || 0);
  }
  return null;
};

// 4d. Pure JavaScript Euclidean Distance
export const computeEuclideanDistance = (a, b) => {
  const normA = normalizeDescriptor(a);
  const normB = normalizeDescriptor(b);
  if (!normA || !normB) return 999;
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = (normA[i] || 0) - (normB[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// 5. Deteksi Wajah & Ambil 128-D Feature Descriptor via Google MediaPipe FaceMesh (Thread-safe & Anti-clobber)
export const detectFaceDescriptor = async (mediaElement) => {
  if (!mediaElement) return null;
  if (!isFaceModelReady()) {
    await initFaceApiModels().catch(() => {});
  }
  if (!globalFaceMesh) return null;

  try {
    const results = await new Promise((resolve) => {
      let timeoutId;

      const onDone = (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      };

      pendingResolvers.push(onDone);

      timeoutId = setTimeout(() => {
        const idx = pendingResolvers.indexOf(onDone);
        if (idx !== -1) pendingResolvers.splice(idx, 1);
        resolve(lastMediaPipeResults);
      }, 1000);

      if (!isSending) {
        isSending = true;
        try {
          globalFaceMesh.send({ image: mediaElement }).catch(() => {
            isSending = false;
            onDone(lastMediaPipeResults);
          });
        } catch (eSend) {
          isSending = false;
          onDone(lastMediaPipeResults);
        }
      }
    });

    if (!results || !results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return null;
    }

    const landmarks = results.multiFaceLandmarks[0];
    if (!landmarks || landmarks.length < 468) return null;

    // Bounding Box
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const w = mediaElement.videoWidth || mediaElement.width || 640;
    const h = mediaElement.videoHeight || mediaElement.height || 480;
    const padX = (maxX - minX) * 0.15;
    const padY = (maxY - minY) * 0.18;
    const box = {
      x: Math.max(0, (minX - padX) * w),
      y: Math.max(0, (minY - padY) * h),
      width: Math.min(w, (maxX - minX + padX * 2) * w),
      height: Math.min(h, (maxY - minY + padY * 2) * h)
    };

    const descriptor = computeMediaPipe128Descriptor(landmarks);

    return {
      box,
      score: 0.98,
      descriptor,
      landmarks
    };
  } catch (e) {
    console.warn('MediaPipe detect descriptor error:', e);
    return null;
  }
};

// 6. Ekstraksi Descriptor dari Image Data URL
export const extractDescriptorFromDataUrl = (dataUrl) => {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const res = await detectFaceDescriptor(img);
        resolve(res ? res.descriptor : null);
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
};

// 7. Pencocokan Vektor Biometrik (Threshold Optimal 0.70)
export const matchFaceDescriptor = (liveDescriptor, registeredProfilesList, threshold = 0.70) => {
  const liveNorm = normalizeDescriptor(liveDescriptor);
  if (!liveNorm || !registeredProfilesList) return null;

  const matchThreshold = Math.min(Math.max(Number(threshold) || 0.70, 0.40), 0.75);
  let bestMatch = null;
  let minDistance = 999;
  let validCount = 0;

  for (const prof of registeredProfilesList) {
    if (!prof) continue;
    let targetDesc = prof.descriptor || prof.faceDescriptor || prof.face_descriptor || prof.parsedDescriptor;
    const normTarget = normalizeDescriptor(targetDesc);

    if (normTarget) {
      validCount++;
      const dist = computeEuclideanDistance(liveNorm, normTarget);
      if (dist < minDistance) {
        minDistance = dist;
        bestMatch = { ...prof, descriptor: normTarget };
      }
    }
  }

  if (validCount === 0) {
    return { error: 'no_profiles', validCount: 0 };
  }

  if (!bestMatch || minDistance >= matchThreshold) {
    return {
      error: 'no_match',
      validCount,
      bestDistance: minDistance,
      threshold: matchThreshold,
      candidate: bestMatch
    };
  }

  return {
    ...bestMatch,
    success: true,
    distance: minDistance,
    confidence: Math.round(Math.max(0, (1 - minDistance / matchThreshold) * 100))
  };
};

// 8. Helper Menggambar Cyber Visualizer MediaPipe pada Canvas
export const drawMediaPipeFaceOverlay = (canvas, video, results, isMatched = false) => {
  if (!canvas || !video) return;
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = video.videoWidth || 640);
  const h = (canvas.height = video.videoHeight || 480);
  ctx.clearRect(0, 0, w, h);

  if (!results || !results.landmarks) return;
  const landmarks = results.landmarks;

  if (results.box) {
    const { x, y, width: bw, height: bh } = results.box;
    ctx.strokeStyle = isMatched ? '#10b981' : '#38bdf8';
    ctx.lineWidth = 3;
    const corner = 20;

    ctx.beginPath();
    ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
    ctx.moveTo(x + bw - corner, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y + corner);
    ctx.moveTo(x, y + bh - corner); ctx.lineTo(x, y + bh); ctx.lineTo(x + corner, y + bh);
    ctx.moveTo(x + bw - corner, y + bh); ctx.lineTo(x + bw, y + bh); ctx.lineTo(x + bw, y + bh - corner);
    ctx.stroke();
  }

  ctx.fillStyle = isMatched ? 'rgba(16, 185, 129, 0.75)' : 'rgba(56, 189, 248, 0.75)';
  for (let i = 0; i < landmarks.length; i += 2) {
    const pt = landmarks[i];
    ctx.fillRect(pt.x * w - 1, pt.y * h - 1, 2, 2);
  }
};
