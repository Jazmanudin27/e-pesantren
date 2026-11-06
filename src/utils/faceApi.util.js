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
    // InputSize 320 + scoreThreshold 0.60 menghasilkan deteksi landmark wajah presisi tinggi & menolak wajah buram
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 320,
      scoreThreshold: 0.60
    });

    const detection = await faceapi
      .detectSingleFace(mediaElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection || !detection.detection || detection.detection.score < 0.60) return null;

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
  if (!Array.isArray(arr) && !(arr instanceof Float32Array)) return false;
  if (arr.length !== 128) return false;
  let sumSq = 0;
  let allZero = true;
  for (let i = 0; i < 128; i++) {
    const v = arr[i];
    if (typeof v !== 'number' || isNaN(v)) return false;
    if (v !== 0) allZero = false;
    sumSq += v * v;
  }
  if (allZero) return false;
  // Unit vector ter-normalisasi face-api memiliki panjang kuadrat ~ 1.0 (antara 0.6 s/d 1.4)
  return sumSq > 0.6 && sumSq < 1.4;
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

// 6. Pencocokan Vektor Biometrik (Euclidean Distance Ketat + Validasi Anti-Bocor / Runner-Up Margin)
// Ambang batas ketat: distance < 0.40 = orang yang sama; distance >= 0.40 = orang berbeda / tolak
export const matchFaceDescriptor = (liveDescriptor, registeredProfilesList, threshold = 0.40) => {
  if (!liveDescriptor || !registeredProfilesList || !window.faceapi) return null;
  if (!isValidDescriptor(liveDescriptor)) return null;

  const faceapi = window.faceapi;
  const strictThreshold = Math.min(Number(threshold) || 0.40, 0.40);
  let bestMatch = null;
  let minDistance = 999;
  let secondMinDistance = 999;
  let bestSantriId = null;

  for (const prof of registeredProfilesList) {
    if (!prof) continue;
    const targetDescriptor = prof.descriptor || prof.faceDescriptor;
    if (isValidDescriptor(targetDescriptor)) {
      const dist = faceapi.euclideanDistance(liveDescriptor, targetDescriptor);
      const profId = String(prof.santri_id || prof.id || '');
      if (dist < minDistance) {
        if (bestSantriId && bestSantriId !== profId) {
          secondMinDistance = minDistance;
        }
        minDistance = dist;
        bestSantriId = profId;
        bestMatch = prof;
      } else if (profId !== bestSantriId && dist < secondMinDistance) {
        secondMinDistance = dist;
      }
    }
  }

  if (!bestMatch || minDistance >= strictThreshold) return null;

  // Anti-bocor: jika jarak di area batas (0.34 - 0.40) dan selisih dengan kandidat santri lain terlalu tipis (< 0.025), tolak agar tidak salah orang
  if (minDistance > 0.34 && secondMinDistance < 999 && (secondMinDistance - minDistance) < 0.025) {
    return null;
  }

  return {
    ...bestMatch,
    distance: minDistance,
    confidence: Math.round(Math.max(0, (1 - minDistance / strictThreshold) * 100))
  };
};

