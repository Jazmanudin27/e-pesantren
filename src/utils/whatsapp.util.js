import axios from 'axios';

const WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://localhost:5000/send-message';
const WA_API_KEY = process.env.WA_API_KEY || '';

/**
 * Send WhatsApp notification message to wali / santri
 * @param {string} to - Phone number (e.g. 08123456789 or 628123456789)
 * @param {string} message - Text message content
 */
export const sendWANotification = async (to, message) => {
  try {
    if (!to || !message) return false;
    let formattedPhone = String(to).trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    const payload = {
      phone: formattedPhone,
      number: formattedPhone,
      message: message,
      text: message
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (WA_API_KEY) {
      headers['Authorization'] = `Bearer ${WA_API_KEY}`;
      headers['x-api-key'] = WA_API_KEY;
    }

    const response = await axios.post(WA_GATEWAY_URL, payload, { headers, timeout: 5000 });
    return response.data;
  } catch (err) {
    console.warn('[WA Gateway Warning] Gagal mengirim WhatsApp:', err.message);
    return false;
  }
};
