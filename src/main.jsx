import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Tangani Vite chunk load failure (saat ada deployment/build baru di server)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[VITE] Versi baru terdeteksi atau chunk gagal dimuat, auto-refresh aplikasi...');
  window.location.reload();
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
    window.location.reload();
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
    console.warn('[SPA] Unhandled rejection chunk error, auto-refresh...');
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
