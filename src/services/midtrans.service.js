import axios from 'axios';
import crypto from 'crypto';

/**
 * Konfigurasi Akun Midtrans (Sandbox / Production)
 */
export const getMidtransConfig = () => {
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return {
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-oRFj2p6jrFzxUVGwO6Tj6w8B',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-gtkZiSrCZjZHYwwZ',
    isProd,
    snapUrl: isProd 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions',
    coreApiUrl: isProd
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2'
  };
};

/**
 * Hitung Biaya Admin Gateway Midtrans + PPN 11% yang dibebankan ke Orang Tua / Wali Santri
 * - Virtual Account (Bank Transfer): Rp 4.000 + PPN 11% (Rp 440) = Rp 4.440
 * - QRIS / E-Wallet: 0.7% + PPN 11% (0.777%) dibulatkan ke atas
 */
export function hitungBiayaAdminMidtransPlusPpn({
  nominalPokok = 0,
  metode = 'Virtual Account',
  biayaVaFlat = 4440,
  biayaQrisPersen = 0.78
}) {
  const pokok = Math.max(0, Math.round(Number(nominalPokok) || 0));
  const mUpper = String(metode || '').toUpperCase();
  if (mUpper.includes('QRIS') || mUpper.includes('GOPAY') || mUpper.includes('SHOPEEPAY')) {
    const persen = Number(biayaQrisPersen) > 0 ? Number(biayaQrisPersen) : 0.78;
    // Rumus gross-up / langsung: agar setelah dipotong MDR QRIS + PPN 11%, pokok tetap utuh
    const feeQris = Math.ceil((pokok * (persen / 100)) / (1 - (persen / 100)));
    return Math.max(500, feeQris);
  }
  // Default Virtual Account: Rp 4.000 + PPN 11% (Rp 440) = Rp 4.440
  const flatVa = Number(biayaVaFlat) > 0 ? Math.round(Number(biayaVaFlat)) : 4440;
  return flatVa;
}

/**
 * Buat Transaksi Snap / Payment Gateway Pop-up Midtrans
 * Otomatis membebankan Biaya Admin + PPN 11% ke Orang Tua / Wali Santri
 */
export async function createMidtransSnapToken({
  nomorTransaksi,
  totalBayar,
  santriNama = 'Santri',
  noWaWali = '081234567890',
  items = [],
  metode = 'Virtual Account',
  biayaVaFlat = 4440,
  biayaQrisPersen = 0.78,
  bebankanFeeKeOrtu = true
}) {
  const config = getMidtransConfig();
  const authHeader = Buffer.from(`${config.serverKey}:`).toString('base64');

  let baseItemDetails = [];
  let sum = 0;

  if (items && items.length > 0) {
    baseItemDetails = items.map((it, idx) => {
      const price = Math.round(Number(it.nominal_alokasi || 0));
      sum += price;
      const cleanName = String(it.judul_tagihan || `Item ${idx + 1}`)
        .replace(/[^\w\s.,\-()&]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 45) || 'Tagihan Santri';

      return {
        id: String(it.tagihan_id || idx + 1),
        price: price,
        quantity: 1,
        name: cleanName
      };
    });

    if (sum !== Math.round(totalBayar)) {
      sum = Math.round(totalBayar);
      baseItemDetails = [{
        id: nomorTransaksi,
        price: sum,
        quantity: 1,
        name: 'Pembayaran Tagihan Santri'
      }];
    }
  } else {
    sum = Math.round(totalBayar);
    baseItemDetails = [{
      id: nomorTransaksi,
      price: sum,
      quantity: 1,
      name: 'Pembayaran Tagihan Santri'
    }];
  }

  const cleanFirstName = String(santriNama || 'Santri')
    .replace(/[^\w\s]/gi, '')
    .trim()
    .substring(0, 25) || 'Santri';

  const cleanPhone = String(noWaWali || '081234567890')
    .replace(/[^0-9]/g, '')
    .slice(0, 15) || '081234567890';

  const biayaAdminPpn = bebankanFeeKeOrtu
    ? hitungBiayaAdminMidtransPlusPpn({
        nominalPokok: sum,
        metode,
        biayaVaFlat,
        biayaQrisPersen
      })
    : 0;

  const isQris = String(metode || '').toUpperCase().includes('QRIS');
  const feeLabel = isQris
    ? 'Biaya Layanan QRIS + PPN 11%'
    : 'Biaya Admin VA + PPN 11%';

  const finalItems = biayaAdminPpn > 0
    ? [
        ...baseItemDetails,
        {
          id: 'FEE-ADMIN-PPN',
          price: biayaAdminPpn,
          quantity: 1,
          name: feeLabel
        }
      ]
    : baseItemDetails;

  const grossWithAdmin = sum + biayaAdminPpn;

  const snapPayload = {
    transaction_details: {
      order_id: nomorTransaksi,
      gross_amount: grossWithAdmin
    },
    customer_details: {
      first_name: cleanFirstName,
      phone: cleanPhone,
      email: 'wali@nurulwafa.sch.id'
    },
    item_details: finalItems,
    callbacks: {
      finish: 'https://mnurulwafa.ruangtech.com/#tagihan'
    }
  };

  try {
    const res = await axios.post(config.snapUrl, snapPayload, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      token: res.data?.token,
      redirect_url: res.data?.redirect_url,
      fee_mode: 'customer_borne_ppn',
      biaya_admin: biayaAdminPpn,
      total_gross: grossWithAdmin
    };
  } catch (err) {
    const errMsg = err.response?.data?.error_messages?.join(', ') || err.response?.data?.message || err.message;
    console.warn('[MIDTRANS SNAP ERROR]', errMsg);
    return {
      success: false,
      error: errMsg
    };
  }
}

/**
 * Direct Charge VA / QRIS Midtrans Core API (Dapat nomor VA / QRIS langsung tanpa keluar aplikasi)
 */
export async function chargeMidtransDirect({
  nomorTransaksi,
  totalBayar,
  santriId,
  santriNama = 'Santri',
  noWaWali = '081234567890',
  metode = 'Virtual Account',
  channel = 'BNI'
}) {
  const config = getMidtransConfig();
  const authHeader = Buffer.from(`${config.serverKey}:`).toString('base64');

  const channelUpper = String(channel || '').toUpperCase();
  let paymentType = 'bank_transfer';
  let bankName = 'bni';

  if (metode === 'QRIS' || channelUpper.includes('QRIS')) {
    paymentType = 'qris';
  } else {
    paymentType = 'bank_transfer';
    if (channelUpper.includes('BCA')) bankName = 'bca';
    else if (channelUpper.includes('BRI')) bankName = 'bri';
    else if (channelUpper.includes('MANDIRI')) bankName = 'echannel';
    else if (channelUpper.includes('PERMATA')) bankName = 'permata';
    else bankName = 'bni'; // Default BNI
  }

  const payload = {
    payment_type: paymentType,
    transaction_details: {
      order_id: nomorTransaksi,
      gross_amount: Math.round(totalBayar)
    },
    customer_details: {
      first_name: santriNama.substring(0, 25),
      phone: String(noWaWali || '081234567890').replace(/[^0-9]/g, ''),
      email: 'wali@nurulwafa.sch.id'
    }
  };

  if (paymentType === 'bank_transfer') {
    if (bankName === 'echannel') {
      payload.echannel = {
        bill_info1: 'Pembayaran:',
        bill_info2: 'Tagihan Santri'
      };
    } else if (bankName === 'permata') {
      payload.bank_transfer = { bank: 'permata' };
    } else {
      payload.bank_transfer = { bank: bankName };
    }
  } else if (paymentType === 'qris') {
    payload.qris = { acquirer: 'gopay' };
  }

  try {
    const res = await axios.post(`${config.coreApiUrl}/charge`, payload, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const data = res.data;
    let vaNumber = null;
    let qrisData = null;

    if (data.va_numbers && data.va_numbers.length > 0) {
      vaNumber = data.va_numbers[0].va_number;
    } else if (data.bill_key && data.biller_code) {
      vaNumber = `${data.biller_code} - ${data.bill_key}`;
    } else if (data.permata_va_number) {
      vaNumber = data.permata_va_number;
    }

    if (data.qr_string || (data.actions && data.actions.length > 0)) {
      const qrAction = data.actions?.find(a => a.name === 'generate-qr-code');
      qrisData = data.qr_string || qrAction?.url || null;
    }

    return {
      success: true,
      va_number: vaNumber,
      qris_data: qrisData,
      transaction_id: data.transaction_id,
      payment_type: data.payment_type,
      raw: data
    };
  } catch (err) {
    console.warn('[MIDTRANS DIRECT CHARGE NOTICE]', err.response?.data || err.message);
    return {
      success: false,
      error: err.response?.data?.message || err.message
    };
  }
}

/**
 * Validasi Signature Key Notifikasi Webhook Midtrans
 * Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(payload) {
  const config = getMidtransConfig();
  const rawString = `${payload.order_id}${payload.status_code}${payload.gross_amount}${config.serverKey}`;
  const calculated = crypto.createHash('sha512').update(rawString).digest('hex');
  return calculated.toLowerCase() === String(payload.signature_key || '').toLowerCase();
}

/**
 * Cek Status Transaksi Langsung ke Server Midtrans
 */
export async function checkMidtransTransactionStatus(orderId) {
  const config = getMidtransConfig();
  const authHeader = Buffer.from(`${config.serverKey}:`).toString('base64');
  try {
    const res = await axios.get(`${config.coreApiUrl}/${orderId}/status`, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    return { success: true, data: res.data };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.status_message || err.message,
      statusCode: err.response?.status
    };
  }
}


