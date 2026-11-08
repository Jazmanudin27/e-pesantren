// ========================================================
// FACE-API.JS AI ENGINE UTILITY (Client-Side Deep Learning)
// Menggunakan @vladmandic/face-api via jsDelivr CDN
// ========================================================

const SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js';
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/';

let isScriptLoaded = false;
let isModelsLoaded = false;
let loadPromise = null;

// 1. Muat Script Library face-api.js
export const loadFaceApiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.faceapi && isScriptLoaded) return resolve(window.faceapi);

    if (window.faceapi) {
      isScriptLoaded = true;
      return resolve(window.faceapi);
    }

    const existing = document.getElementById('face-api-cdn');
    if (existing) {
      existing.addEventListener('load', () => {
        isScriptLoaded = true;
        resolve(window.faceapi);
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'face-api-cdn';
    script.src = SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      isScriptLoaded = true;
      resolve(window.faceapi);
    };
    script.onerror = () => reject(new Error('Gagal mengunduh script face-api.js dari CDN'));
    document.body.appendChild(script);
  });
};

// 2. Muat Pre-trained Neural Net Models (Tiny Face Detector + Landmarks + 128-D Recognition)
export const initFaceApiModels = async (onProgress = null) => {
  if (isModelsLoaded && window.faceapi) return window.faceapi;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      if (onProgress) onProgress('Memuat script AI face-api...');
      const faceapi = await loadFaceApiScript();

      if (onProgress) onProgress('Mengunduh model deteksi wajah (TinyFaceDetector)...');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

      if (onProgress) onProgress('Mengunduh model struktur wajah (FaceLandmarks)...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

      if (onProgress) onProgress('Mengunduh model pengenalan biometrik (FaceRecognition)...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      isModelsLoaded = true;
      if (onProgress) onProgress('Model AI Wajah Siap Digunakan');
      return faceapi;
    } catch (err) {
      loadPromise = null;
      console.warn('Face-api load error:', err);
      throw err;
    }
  })();

  return loadPromise;
};

// 3. Status Model Loaded
export const isFaceModelReady = () => isModelsLoaded && !!window.faceapi;

// 4. Deteksi Wajah & Ambil 128-D Feature Descriptor dari Video / Canvas / Image
export const detectFaceDescriptor = async (mediaElement) => {
  if (!isFaceModelReady() || !mediaElement) return null;

  try {
    const faceapi = window.faceapi;
    // InputSize 416 menghasilkan ekstraksi fitur wajah yang jauh lebih presisi dibanding 320
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.35
    });

    const detection = await faceapi
      .detectSingleFace(mediaElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.detection || detection.detection.score < 0.35) return null;

    return {
      box: detection.detection.box, // { x, y, width, height }
      score: detection.detection.score,
      descriptor: Array.from(detection.descriptor), // 128 float array
      rawDetection: detection
    };
  } catch (e) {
    console.warn('Detect descriptor error:', e);
    return null;
  }
};

// 4b. Validasi apakah array merupakan vektor biometrik L2-normalized 128-D yang valid
export const isValidDescriptor = (arr) => {
  if (!arr) return false;
  let target = arr;
  if (typeof target === 'string') {
    try { target = JSON.parse(target); } catch (e) { return false; }
  }
  if (typeof target === 'string') {
    try { target = JSON.parse(target); } catch (e) { return false; }
  }
  // Toleransi objek serialisasi Float32Array {"0": -0.21, "1": ...}
  if (target && typeof target === 'object' && !Array.isArray(target) && !(target instanceof Float32Array)) {
    const vals = Object.values(target);
    if (vals.length === 128) target = vals;
  }
  if (!Array.isArray(target) && !(target instanceof Float32Array)) return false;
  if (target.length !== 128) return false;
  let sumSq = 0;
  let allZero = true;
  for (let i = 0; i < 128; i++) {
    const v = Number(target[i]);
    if (isNaN(v)) return false;
    if (v !== 0) allZero = false;
    sumSq += v * v;
  }
  if (allZero) return false;
  return sumSq > 0.05;
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

// 4c. Pure JavaScript Euclidean Distance (100% aman tanpa ketergantungan tipe data)
export const computeEuclideanDistance = (a, b) => {
  if (!a || !b) return 999;
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = (Number(a[i]) || 0) - (Number(b[i]) || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

// 5. Ekstraksi Descriptor dari Image Data URL (Untuk Foto Terdaftar)
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

// 6. Pencocokan Vektor Biometrik (Euclidean Distance dengan Ambang Batas 0.70 Toleran Webcam/Indoor)
// Standar face-api: distance < 0.70 = orang yang sama; distance >= 0.70 = orang berbeda / tolak
export const matchFaceDescriptor = (liveDescriptor, registeredProfilesList, threshold = 0.70) => {
  if (!liveDescriptor || !registeredProfilesList) return null;
  if (!isValidDescriptor(liveDescriptor)) return null;

  const matchThreshold = Math.min(Math.max(Number(threshold) || 0.70, 0.40), 0.75);
  let bestMatch = null;
  let minDistance = 999;
  let secondMinDistance = 999;
  let bestSantriId = null;
  let validCount = 0;

  for (const prof of registeredProfilesList) {
    if (!prof) continue;
    let targetDescriptor = prof.descriptor || prof.faceDescriptor || prof.face_descriptor;
    if (typeof targetDescriptor === 'string') {
      try { targetDescriptor = JSON.parse(targetDescriptor); } catch (e) {}
    }
    if (isValidDescriptor(targetDescriptor)) {
      validCount++;
      const dist = computeEuclideanDistance(liveDescriptor, targetDescriptor);
      const profId = String(prof.santri_id || prof.id || '');
      if (dist < minDistance) {
        if (bestSantriId && bestSantriId !== profId) {
          secondMinDistance = minDistance;
        }
        minDistance = dist;
        bestSantriId = profId;
        bestMatch = { ...prof, descriptor: targetDescriptor };
      } else if (profId !== bestSantriId && dist < secondMinDistance) {
        secondMinDistance = dist;
      }
    }
  }

  if (validCount === 0) {
    return { error: 'no_profiles', validCount: 0 };
  }

  // Jika jarak lebih besar dari ambang batas toleransi
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

