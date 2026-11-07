import pool from '../config/database.js';
import axios from 'axios';

let isWhatsAppTableInitialized = false;

/**
 * Pastikan tabel whatsapp_settings dan whatsapp_logs selalu tersedia
 */
export const ensureWhatsAppTables = async () => {
  if (isWhatsAppTableInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`whatsapp_settings\` (
        \`id\` INT PRIMARY KEY DEFAULT 1,
        \`provider\` VARCHAR(50) NOT NULL DEFAULT 'fonnte',
        \`api_token\` VARCHAR(255) DEFAULT '',
        \`server_url\` VARCHAR(255) DEFAULT '',
        \`sender_number\` VARCHAR(50) DEFAULT '',
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`auto_sakit\` TINYINT(1) NOT NULL DEFAULT 1,
        \`auto_izin\` TINYINT(1) NOT NULL DEFAULT 1,
        \`auto_alfa\` TINYINT(1) NOT NULL DEFAULT 1,
        \`auto_tazir\` TINYINT(1) NOT NULL DEFAULT 1,
        \`auto_perizinan\` TINYINT(1) NOT NULL DEFAULT 1,
        \`delay_seconds\` INT NOT NULL DEFAULT 2,
        \`footer_text\` VARCHAR(255) DEFAULT 'Pondok Pesantren Nurul Wafa',
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Pastikan minimal ada 1 baris config default
    const [rows] = await pool.query('SELECT id FROM whatsapp_settings WHERE id = 1');
    if (!rows || rows.length === 0) {
      await pool.query(`
        INSERT INTO whatsapp_settings (id, provider, api_token, server_url, is_active, auto_sakit, auto_izin, auto_alfa, auto_tazir, auto_perizinan)
        VALUES (1, 'fonnte', '', 'https://api.fonnte.com/send', 1, 1, 1, 1, 1, 1)
      `);
    }

    // Tabel riwayat pengiriman pesan WhatsApp (Log)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`whatsapp_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`santri_id\` INT DEFAULT NULL,
        \`target_phone\` VARCHAR(30) NOT NULL,
        \`target_nama\` VARCHAR(150) DEFAULT '',
        \`kategori\` VARCHAR(50) NOT NULL DEFAULT 'info',
        \`pesan\` TEXT NOT NULL,
        \`status\` ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
        \`response_info\` VARCHAR(255) DEFAULT '',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_wa_phone\` (\`target_phone\`),
        INDEX \`idx_wa_kategori\` (\`kategori\`),
        INDEX \`idx_wa_created\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    isWhatsAppTableInitialized = true;
  } catch (err) {
    console.warn('[WA DB INIT NOTICE]', err.message);
  }
};

/**
 * Format nomor telepon lokal (08... / 8...) menjadi format internasional (628...)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '628' + cleaned.slice(1);
  }
  return cleaned;
};

/**
 * Mengambil konfigurasi WhatsApp aktif
 */
export const getWhatsAppConfig = async () => {
  await ensureWhatsAppTables();
  try {
    const [rows] = await pool.query('SELECT * FROM whatsapp_settings WHERE id = 1 LIMIT 1');
    return rows[0] || {
      provider: 'fonnte',
      api_token: '',
      server_url: 'https://api.fonnte.com/send',
      is_active: 0,
      auto_sakit: 1,
      auto_izin: 1,
      auto_alfa: 1,
      auto_tazir: 1,
      auto_perizinan: 1,
      delay_seconds: 2,
      footer_text: 'Pondok Pesantren Nurul Wafa'
    };
  } catch (e) {
    return {
      provider: 'fonnte',
      api_token: '',
      server_url: 'https://api.fonnte.com/send',
      is_active: 0,
      delay_seconds: 2
    };
  }
};

/**
 * Kirim pesan WhatsApp tunggal (Non-blocking / Background safe)
 */
export const sendWhatsApp = async ({
  target,
  message,
  santri_id = null,
  target_nama = '',
  kategori = 'info'
}) => {
  try {
    await ensureWhatsAppTables();
    const config = await getWhatsAppConfig();

    if (!config.is_active && kategori !== 'test') {
      return { success: false, message: 'WhatsApp Gateway nonaktif di pengaturan' };
    }

    if (!config.api_token) {
      return { success: false, message: 'API Token WhatsApp belum diisi' };
    }

    const formattedTarget = formatPhoneNumber(target);
    if (!formattedTarget || formattedTarget.length < 9) {
      return { success: false, message: 'Nomor WhatsApp tidak valid' };
    }

    const provider = String(config.provider || 'fonnte').toLowerCase();
    let isSuccess = false;
    let responseText = '';

    if (provider === 'fonnte') {
      // Provider FONNTE (https://docs.fonnte.com)
      const endpoint = config.server_url || 'https://api.fonnte.com/send';
      const res = await axios.post(
        endpoint,
        {
          target: formattedTarget,
          message: message,
          countryCode: '62'
        },
        {
          headers: {
            Authorization: config.api_token.trim()
          },
          timeout: 10000
        }
      );

      isSuccess = res.data?.status === true || res.data?.status === 'true' || res.status === 200;
      responseText = JSON.stringify(res.data || '').slice(0, 250);

    } else if (provider === 'wablas') {
      // Provider WABLAS (https://wablas.com)
      const baseUrl = (config.server_url || 'https://kudus.wablas.com').replace(/\/+$/, '');
      const endpoint = `${baseUrl}/api/send-message`;
      const res = await axios.post(
        endpoint,
        {
          phone: formattedTarget,
          message: message
        },
        {
          headers: {
            Authorization: config.api_token.trim(),
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      isSuccess = res.data?.status === true || res.data?.status === 'success' || res.status === 200;
      responseText = JSON.stringify(res.data || '').slice(0, 250);

    } else {
      // Custom Generic Webhook / Gateway
      const endpoint = config.server_url;
      if (!endpoint) throw new Error('Server URL custom gateway belum ditentukan');

      const res = await axios.post(
        endpoint,
        {
          phone: formattedTarget,
          number: formattedTarget,
          message: message,
          target: formattedTarget
        },
        {
          headers: {
            Authorization: `Bearer ${config.api_token.trim()}`,
            'x-api-key': config.api_token.trim(),
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      isSuccess = res.status >= 200 && res.status < 300;
      responseText = JSON.stringify(res.data || '').slice(0, 250);
    }

    // Catat log pengiriman
    await pool.query(`
      INSERT INTO whatsapp_logs (santri_id, target_phone, target_nama, kategori, pesan, status, response_info, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      santri_id || null,
      formattedTarget,
      target_nama || '',
      kategori,
      message,
      isSuccess ? 'sent' : 'failed',
      responseText
    ]).catch(() => {});

    return {
      success: isSuccess,
      phone: formattedTarget,
      info: responseText
    };

  } catch (err) {
    const errText = err.response?.data?.reason || err.response?.data?.message || err.message;
    console.warn(`[WA GATEWAY ERROR] Gagal kirim ke ${target}:`, errText);

    try {
      const formattedTarget = formatPhoneNumber(target);
      await pool.query(`
        INSERT INTO whatsapp_logs (santri_id, target_phone, target_nama, kategori, pesan, status, response_info, created_at)
        VALUES (?, ?, ?, ?, ?, 'failed', ?, NOW())
      `, [
        santri_id || null,
        formattedTarget || String(target),
        target_nama || '',
        kategori,
        message,
        String(errText).slice(0, 250)
      ]);
    } catch (_) {}

    return {
      success: false,
      message: errText
    };
  }
};

/**
 * Otomatis kirim WA ke wali saat santri Sakit, Izin, atau Alfa (jika diaktifkan di pengaturan)
 */
export const triggerAutoPresensiWA = async ({ santri_id, nama_santri, kegiatan, status, waktu }) => {
  try {
    const config = await getWhatsAppConfig();
    if (!config.is_active || !config.api_token) return;

    const st = String(status || '').toLowerCase();
    const isSakit = st.includes('sakit');
    const isIzin = st.includes('izin');
    const isAlfa = st.includes('alfa') || st.includes('alpa') || st.includes('tanpa');

    if (!((isSakit && config.auto_sakit) || (isIzin && config.auto_izin) || (isAlfa && config.auto_alfa))) {
      return;
    }

    const [rows] = await pool.query('SELECT nama_santri, nama_wali, no_wa_wali FROM santri WHERE id = ?', [santri_id]);
    if (!rows || rows.length === 0) return;
    const s = rows[0];
    if (!s.no_wa_wali || String(s.no_wa_wali).trim() === '' || String(s.no_wa_wali).trim() === '-') return;

    const sapaan = s.nama_santri || nama_santri || 'ananda';
    const jamStr = waktu ? ` pukul ${String(waktu).slice(0, 5)} WIB` : '';

    let judul = 'Pemberitahuan Presensi';
    let isi = '';
    let kat = 'absensi';

    if (isSakit) {
      judul = `Informasi Kesehatan Santri`;
      isi = `Diberitahukan bahwa ananda *${sapaan}* hari ini berhalangan mengikuti kegiatan *${kegiatan}* dikarenakan sedang kurang sehat (*Sakit*).\n\nMohon sambung doa dari Bapak/Ibu agar ananda lekas diberikan kesembuhan dan afiat.`;
      kat = 'sakit';
    } else if (isIzin) {
      judul = `Keterangan Izin Santri`;
      isi = `Diberitahukan bahwa ananda *${sapaan}* tercatat *Izin* pada kegiatan *${kegiatan}*${jamStr} sesuai keterangan di kepengurusan pondok.`;
      kat = 'izin';
    } else if (isAlfa) {
      judul = `Pemberitahuan Kehadiran`;
      isi = `Diberitahukan bahwa ananda *${sapaan}* tercatat belum hadir (*Alfa*) pada kegiatan *${kegiatan}*${jamStr}. Pengurus asrama sedang melakukan pemantauan dan pembinaan.`;
      kat = 'alfa';
    }

    const fullMsg = `*${judul.toUpperCase()}*\n_Pondok Pesantren Nurul Wafa_\n\nAssalamu'alaikum Wr. Wb.\nYth. Bapak/Ibu Wali dari *${sapaan}*,\n\n${isi}\n\nWassalamu'alaikum Wr. Wb.\n_Pengurus Pondok Pesantren Nurul Wafa_`;

    await sendWhatsApp({
      target: s.no_wa_wali,
      message: fullMsg,
      santri_id,
      target_nama: s.nama_wali || s.nama_santri,
      kategori: kat
    });
  } catch (e) {
    console.warn('[AUTO WA PRESENSI NOTICE]', e.message);
  }
};

