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
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224, // 224x224 ideal untuk mobile FPS dan akurasi tinggi
      scoreThreshold: 0.45
    });

    const detection = await faceapi
      .detectSingleFace(mediaElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

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

// 6. Pencocokan Vektor Biometrik (Euclidean Distance)
// Standar face-api.js: distance < 0.52 = orang yang sama; distance > 0.55 = orang berbeda
export const matchFaceDescriptor = (liveDescriptor, registeredProfilesList, threshold = 0.52) => {
  if (!liveDescriptor || !registeredProfilesList || !window.faceapi) return null;

  const faceapi = window.faceapi;
  let bestMatch = null;
  let minDistance = 999;

  for (const prof of registeredProfilesList) {
    const targetDescriptor = prof.descriptor || prof.faceDescriptor;
    if (targetDescriptor && (targetDescriptor.length === 128 || targetDescriptor.length === 68)) {
      const dist = faceapi.euclideanDistance(liveDescriptor, targetDescriptor);
      if (dist < threshold && dist < minDistance) {
        minDistance = dist;
        bestMatch = {
          ...prof,
          distance: dist,
          confidence: Math.round((1 - dist) * 100)
        };
      }
    }
  }

  return bestMatch;
};

