import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Global HTTP timeout agar request yang menggantung setelah idle / sleep tidak membuat loading muter selamanya
axios.defaults.timeout = 15000;

const safeChunkReload = () => {
  if (typeof window.__safeChunkReload === 'function') {
    window.__safeChunkReload();
    return;
  }
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem('nwf_chunk_reload_at') || '0');
    if (last && now - last < 15000) return;
    sessionStorage.setItem('nwf_chunk_reload_at', String(now));
  } catch (e) {}
  window.location.reload();
};

// Bersihkan penanda reload setelah aplikasi berhasil render normal
setTimeout(() => {
  try {
    sessionStorage.removeItem('nwf_chunk_reload_at');
  } catch (e) {}
}, 5000);

// 1. Tangani Vite chunk load failure (saat ada deployment/build baru di server, dengan cooldown 15s)
window.addEventListener('vite:preloadError', () => {
  console.warn('[VITE] Versi baru terdeteksi atau chunk gagal dimuat, auto-refresh aplikasi...');
  safeChunkReload();
});

// 2. Tangani error MIME type mismatch atau chunk 404 pada dynamic import
window.addEventListener('error', (event) => {
  const msg = String(event?.message || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('Strict MIME type checking')
  ) {
    console.warn('[SPA] Chunk versi lama terdeteksi, merefresh aplikasi secara otomatis...');
    safeChunkReload();
  }
});

// 3. Tangani Promise rejection chunk failure
window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event?.reason?.message || event?.reason || '');
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script') ||
    msg.includes('Strict MIME type checking')
  ) {
    event.preventDefault();
    console.warn('[SPA] Unhandled rejection chunk error, auto-refresh...');
    safeChunkReload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
