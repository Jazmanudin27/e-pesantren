import { sendWhatsApp } from '../services/whatsapp.service.js';

/**
 * Universal wrapper kirim notifikasi WhatsApp ke wali santri / pengurus
 * Otomatis terhubung dengan pengaturan Fonnte / Wablas dan tercatat di Log
 */
export const sendWANotification = async (to, message, meta = {}) => {
  return await sendWhatsApp({
    target: to,
    message: message,
    santri_id: meta.santri_id || null,
    target_nama: meta.target_nama || '',
    kategori: meta.kategori || 'info'
  });
};
