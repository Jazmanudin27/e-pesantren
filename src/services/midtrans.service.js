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
 * Buat Transaksi Snap / Payment Gateway Pop-up Midtrans
 */
export async function createMidtransSnapToken({
  nomorTransaksi,
  totalBayar,
  santriNama = 'Santri',
  noWaWali = '081234567890',
  items = []
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
      baseItemDetails = [{
        id: nomorTransaksi,
        price: Math.round(totalBayar),
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

  // Percobaan 1: Fitur Resmi Midtrans Dynamic Fee (Otomatis beda-beda per channel: QRIS 0.7%, VA flat)
  const dynamicPayload = {
    transaction_details: {
      order_id: nomorTransaksi,
      gross_amount: Math.round(totalBayar)
    },
    customer_imposed_payment_fee: {
      enable: true,
      payment_fee_configs: [
        { payment_type: 'gopay', customer_percentage: 100 },
        { payment_type: 'qris', customer_percentage: 100 },
        { payment_type: 'shopeepay', customer_percentage: 100 },
        { payment_type: 'bca_va', customer_percentage: 100 },
        { payment_type: 'bni_va', customer_percentage: 100 },
        { payment_type: 'bri_va', customer_percentage: 100 },
        { payment_type: 'echannel', customer_percentage: 100 },
        { payment_type: 'permata_va', customer_percentage: 100 },
        { payment_type: 'cimb_va', customer_percentage: 100 },
        { payment_type: 'other_va', customer_percentage: 100 }
      ]
    },
    customer_details: {
      first_name: cleanFirstName,
      phone: cleanPhone,
      email: 'wali@nurulwafa.sch.id'
    },
    item_details: baseItemDetails,
    callbacks: {
      finish: 'https://mnurulwafa.ruangtech.com/#tagihan'
    }
  };

  try {
    const res = await axios.post(config.snapUrl, dynamicPayload, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (res.data?.token) {
      return {
        success: true,
        token: res.data?.token,
        redirect_url: res.data?.redirect_url,
        fee_mode: 'dynamic'
      };
    }
  } catch (dynErr) {
    console.warn('[MIDTRANS DYNAMIC FEE UNAVAILABLE IN THIS ACCOUNT, APPLYING FLAT ADMIN FEE ITEM]');
  }

  // Percobaan 2 (Fallback): Pasang Biaya Admin ke Item Details agar pasti muncul di Midtrans
  const biayaAdminFlat = parseInt(process.env.MIDTRANS_BIAYA_ADMIN || '4000', 10);
  const fallbackItems = [
    ...baseItemDetails,
    {
      id: 'FEE-ADMIN',
      price: biayaAdminFlat,
      quantity: 1,
      name: 'Biaya Admin Gateway'
    }
  ];
  const grossWithAdmin = Math.round(totalBayar) + biayaAdminFlat;

  const fallbackPayload = {
    transaction_details: {
      order_id: nomorTransaksi,
      gross_amount: grossWithAdmin
    },
    customer_details: {
      first_name: cleanFirstName,
      phone: cleanPhone,
      email: 'wali@nurulwafa.sch.id'
    },
    item_details: fallbackItems,
    callbacks: {
      finish: 'https://mnurulwafa.ruangtech.com/#tagihan'
    }
  };

  try {
    const res = await axios.post(config.snapUrl, fallbackPayload, {
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
      fee_mode: 'flat',
      biaya_admin: biayaAdminFlat,
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

