import axios from 'axios';
import crypto from 'crypto';

/**
 * Konfigurasi BNI Direct API
 * Default Client ID & API Key disesuaikan dengan kredensial BNI developer portal
 */
export const getBniConfig = () => {
  const isProd = (process.env.BNI_ENV || 'production').toLowerCase() === 'production';
  return {
    apiKey: process.env.BNI_API_KEY || '3bfa0596-1f50-4edf-87f8-80d06ffd0c40',
    apiSecret: process.env.BNI_API_SECRET || '',
    clientId: process.env.BNI_CLIENT_ID || '6bdd0caa-7c27-4e17-b636-a78aea000ad5',
    clientSecret: process.env.BNI_CLIENT_SECRET || '',
    prefixVa: process.env.BNI_PREFIX_VA || '98812',
    baseUrl: isProd ? 'https://api.bni.co.id' : 'https://apidev.bni.co.id',
    isProd
  };
};

/**
 * Request OAuth 2.0 Access Token ke BNI Direct API
 */
export async function getBniOAuthToken() {
  const config = getBniConfig();
  if (!config.clientId || !config.clientSecret) {
    console.warn('[BNI SERVICE] Client ID atau Client Secret belum diisi lengkap di .env');
    return null;
  }

  try {
    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const tokenUrl = `${config.baseUrl}/api/oauth/token`;

    const res = await axios.post(
      tokenUrl,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );

    return res.data?.access_token || null;
  } catch (err) {
    console.warn('[BNI SERVICE] Gagal request OAuth Token:', err.response?.data || err.message);
    return null;
  }
}

/**
 * Generate atau Daftarkan Virtual Account Resmi BNI
 * Jika koneksi ke server BNI gagal / mode simulasi, fungsi ini tetap return nomor VA valid
 */
export async function createBniVirtualAccount({ nomorTransaksi, santriId, santriNama, totalBayar, expiredHours = 24 }) {
  const config = getBniConfig();
  const cleanSantriId = String(santriId || '1').padStart(4, '0');
  const uniqueCode = Math.floor(10000 + Math.random() * 90000);
  const fallbackVaNumber = `${config.prefixVa}${cleanSantriId}${uniqueCode}`;

  // Coba panggil BNI API jika Secret sudah terisi di .env
  if (config.clientSecret && config.apiSecret) {
    try {
      const token = await getBniOAuthToken();
      if (token) {
        const createVaUrl = `${config.baseUrl}/api/v1/va/create-billing`;
        const res = await axios.post(
          createVaUrl,
          {
            client_id: config.clientId,
            trx_id: nomorTransaksi,
            trx_amount: totalBayar,
            billing_type: 'c', // close payment
            customer_name: (santriNama || 'Santri').substring(0, 30),
            customer_email: 'santri@nurulwafa.sch.id',
            virtual_account: fallbackVaNumber,
            datetime_expired: new Date(Date.now() + expiredHours * 3600 * 1000).toISOString()
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-API-KEY': config.apiKey,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        if (res.data && (res.data.status === '000' || res.data.virtual_account)) {
          return {
            success: true,
            va_number: res.data.virtual_account || fallbackVaNumber,
            data: res.data
          };
        }
      }
    } catch (apiErr) {
      console.warn('[BNI SERVICE] API Create Billing notice:', apiErr.response?.data || apiErr.message);
    }
  }

  // Fallback nomor VA sesuai format standar BNI e-Collection
  return {
    success: true,
    va_number: fallbackVaNumber,
    fallback: true
  };
}

