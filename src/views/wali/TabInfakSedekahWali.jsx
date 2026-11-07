import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  Heart,
  QrCode,
  CreditCard,
  CheckCircle2,
  Sparkles,
  History,
  Copy,
  Check,
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { toastSuccess, showError, showSuccess } from '../../utils/alert.util';

const PRESET_NOMINAL = [25000, 50000, 100000, 250000, 500000, 1000000];

export default function TabInfakSedekahWali({
  santriId,
  santriName = 'Santri',
  waliName = 'Orang Tua Santri',
  formatRp = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`,
  onBack
}) {
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [totalInfakKeluarga, setTotalInfakKeluarga] = useState(0);

  // Form Infak State
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [nominalInput, setNominalInput] = useState('50.000');
  const [metodeBayar, setMetodeBayar] = useState('QRIS'); // 'QRIS' | 'Virtual Account BNI' | 'Virtual Account BSI' | 'Virtual Account BRI'
  const [doaPesan, setDoaPesan] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal Instruksi Pembayaran QRIS / VA (Jika Snap.js diblokir jaringan atau user memilih instruksi langsung)
  const [activePaymentSession, setActivePaymentSession] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const fetchInfakData = async () => {
    if (!santriId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/infak/santri/${santriId}`);
      if (res.data?.success && res.data.data) {
        const progs = res.data.data.programs || [];
        setPrograms(progs);
        setRiwayat(res.data.data.riwayat || []);
        setTotalInfakKeluarga(res.data.data.total_infak_keluarga || 0);
        if (!selectedProgram && progs.length > 0) {
          setSelectedProgram(progs[0]);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat data infak:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfakData();
  }, [santriId]);

  const parseRawNominal = (str) => {
    return parseInt(String(str || '').replace(/\D/g, ''), 10) || 0;
  };

  const handleSelectPresetNominal = (num) => {
    setNominalInput(num.toLocaleString('id-ID'));
  };

  const handleNominalChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setNominalInput('');
      return;
    }
    setNominalInput(parseInt(raw, 10).toLocaleString('id-ID'));
  };

  const handleConfirmSuccess = async (paymentData) => {
    try {
      setConfirmingPayment(true);
      await axios.post('/api/infak/confirm-payment', {
        id: paymentData.id,
        kode_transaksi: paymentData.kode_transaksi
      });
      setActivePaymentSession(null);
      setDoaPesan('');
      showSuccess(
        'Jazakumullahu Khairan Katsiran',
        `Alhamdulillah, infak/sedekah sebesar ${formatRp(paymentData.nominal)} untuk "${paymentData.nama_program}" telah berhasil tercatat.`
      );
      fetchInfakData();
    } catch (err) {
      showError('Gagal Konfirmasi', err.response?.data?.message || err.message);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleSubmitInfak = async (e) => {
    e.preventDefault();
    const cleanNominal = parseRawNominal(nominalInput);
    if (cleanNominal < 5000) {
      showError('Nominal Kurang', 'Nominal infak/sedekah minimal Rp 5.000');
      return;
    }
    if (!selectedProgram) {
      showError('Pilih Program', 'Silakan pilih tujuan program infak terlebih dahulu');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/infak/create-payment', {
        santri_id: santriId,
        nama_santri: santriName,
        nama_donatur: waliName || `Wali ${santriName}`,
        is_anonim: isAnonim,
        program_id: selectedProgram.id,
        nama_program: selectedProgram.nama_program,
        nominal: cleanNominal,
        metode_pembayaran: metodeBayar,
        doa_pesan: doaPesan
      });

      if (res.data?.success && res.data.data) {
        const payData = res.data.data;

        // Jika Midtrans Snap tersedia di browser dan snap_token berhasil dibuat
        if (payData.snap_token && typeof window !== 'undefined' && window.snap && typeof window.snap.pay === 'function') {
          window.snap.pay(payData.snap_token, {
            onSuccess: () => handleConfirmSuccess(payData),
            onPending: () => setActivePaymentSession(payData),
            onError: () => setActivePaymentSession(payData),
            onClose: () => {}
          });
        } else {
          // Tampilkan Modal Pembayaran QRIS / Virtual Account Terintegrasi
          setActivePaymentSession(payData);
        }
      }
    } catch (err) {
      showError('Gagal Membuat Pembayaran', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc', paddingBottom: '90px' }}>
      {/* Top Header Bar Terpadu Emerald Green (Disamakan dengan Tab Lain) */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={onBack}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Infak, Wakaf &amp; Sedekah
              </h2>
            </div>
          </div>

          <button 
            onClick={fetchInfakData}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Segarkan Data"
          >
            <RotateCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Container Body with Consistent 16px Padding */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* HERO STAT CARD INFAK (DESAIN LUXURY FINTECH GRADIENT DENGAN AMBIENT GLOW) */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)',
          borderRadius: '22px',
          padding: '18px 18px 16px',
          color: '#ffffff',
          border: '1px solid rgba(167, 243, 208, 0.45)',
          boxShadow: '0 12px 28px -4px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.25s ease'
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(110, 231, 183, 0.25)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }} />

          {/* Watermark Icon */}
          <div style={{
            position: 'absolute',
            right: '-8px',
            bottom: '-12px',
            fontSize: '5.5rem',
            opacity: 0.1,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            ❤️
          </div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TOTAL AMAL INFAK KELUARGA ANDA
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px', marginTop: '3px', lineHeight: 1.15 }}>
              {formatRp(totalInfakKeluarga)}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#d1fae5', marginTop: '4px', fontWeight: 500 }}>
              * Pencatatan khusus amal jariyah (terpisah 100% dari tagihan SPP)
            </div>
          </div>
        </div>
        {/* 1. PILIH PROGRAM / TUJUAN INFAK */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} color="#059669" />
            <span>1. Pilih Program atau Tujuan Infak</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {programs.map((prog) => {
              const isSelected = selectedProgram?.id === prog.id;
              return (
                <div
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog)}
                  style={{
                    padding: '11px 12px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          color: '#047857',
                          background: '#d1fae5',
                          padding: '2px 7px',
                          borderRadius: '999px'
                        }}
                      >
                        {prog.kategori || 'Program Infak'}
                      </span>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {prog.nama_program}
                      </div>
                      {prog.deskripsi && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>
                          {prog.deskripsi}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isSelected ? '#059669' : '#f1f5f9',
                        color: isSelected ? '#ffffff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <Check size={13} strokeWidth={3} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', fontSize: '0.68rem', color: '#475569' }}>
                    <span>Terkumpul: <strong style={{ color: '#059669' }}>{formatRp(prog.terkumpul || 0)}</strong></span>
                    <span>{prog.jumlah_donatur || 0} Muhsinin</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. TENTUKAN NOMINAL & METODE PEMBAYARAN (QRIS / VIRTUAL ACCOUNT) */}
        <form
          onSubmit={handleSubmitInfak}
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
            2. Tentukan Nominal Infak / Sedekah
          </div>

          {/* Pilihan Nominal Cepat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '7px' }}>
            {PRESET_NOMINAL.map((nom) => {
              const isSel = parseRawNominal(nominalInput) === nom;
              return (
                <button
                  key={nom}
                  type="button"
                  onClick={() => handleSelectPresetNominal(nom)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '10px',
                    border: isSel ? '1.5px solid #059669' : '1px solid #cbd5e1',
                    background: isSel ? '#ecfdf5' : '#f8fafc',
                    color: isSel ? '#047857' : '#334155',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Rp {nom.toLocaleString('id-ID')}
                </button>
              );
            })}
          </div>

          {/* Input Nominal Bebas */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Atau Masukkan Nominal Lainnya (Rp)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', fontWeight: 800, color: '#059669', fontSize: '0.9rem' }}>
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={nominalInput}
                onChange={handleNominalChange}
                placeholder="50.000"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '12px',
                  border: '1.5px solid #059669',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 3. Pilih Metode Pembayaran (QRIS / Virtual Account) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              3. Metode Pembayaran (QRIS / Virtual Account)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'QRIS', label: 'QRIS Instan', sub: 'Gopay, OVO, Dana, M-Banking', icon: QrCode },
                { id: 'Virtual Account BNI', label: 'Virtual Account BNI', sub: 'Cek Otomatis 24 Jam', icon: CreditCard },
                { id: 'Virtual Account BSI', label: 'Virtual Account BSI', sub: 'Bank Syariah Indonesia', icon: CreditCard },
                { id: 'Virtual Account BRI', label: 'Virtual Account BRI', sub: 'BRIVA Otomatis', icon: CreditCard }
              ].map((m) => {
                const IconComp = m.icon;
                const isSel = metodeBayar === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetodeBayar(m.id)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '12px',
                      border: isSel ? '1.5px solid #0d766e' : '1px solid #e2e8f0',
                      background: isSel ? '#f0fdfa' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.73rem', fontWeight: 800, color: isSel ? '#0d766e' : '#1e293b' }}>
                      <IconComp size={14} />
                      <span>{m.label}</span>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{m.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doa / Pesan & Anonim */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              Doa / Hajat Keluarga (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Semoga menjadi amal jariyah dan keberkahan ilmu bagi ananda..."
              value={doaPesan}
              onChange={(e) => setDoaPesan(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAnonim}
              onChange={(e) => setIsAnonim(e.target.checked)}
            />
            Sembunyikan nama saya (Tampilkan sebagai <strong>Hamba Allah</strong>)
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #059669 0%, #0d766e 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '13px',
              borderRadius: '14px',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.45)'
            }}
          >
            {submitting ? <Loader2 size={17} className="animate-spin" /> : <Heart size={17} />}
            <span>Tunaikan Infak &amp; Sedekah Sekarang</span>
          </button>
        </form>

        {/* 4. RIWAYAT INFAK & SEDEKAH KELUARGA */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '14px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={15} color="#0d766e" />
            <span>Riwayat Infak &amp; Sedekah Anda ({riwayat.length})</span>
          </div>

          {riwayat.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '0.76rem' }}>
              Belum ada riwayat transaksi infak &amp; sedekah.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {riwayat.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.nama_program}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                      {item.metode_pembayaran} • {new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#059669' }}>
                      {formatRp(item.nominal)}
                    </div>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '999px',
                        background: item.status === 'Berhasil' ? '#dcfce7' : '#fef3c7',
                        color: item.status === 'Berhasil' ? '#15803d' : '#b45309'
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PEMBAYARAN QRIS / VIRTUAL ACCOUNT */}
      {activePaymentSession && (
        <div
          onClick={() => setActivePaymentSession(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '380px',
              borderRadius: '24px',
              padding: '20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                Instruksi Pembayaran Infak
              </div>
              <button
                onClick={() => setActivePaymentSession(null)}
                style={{ width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '12px', textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700 }}>
                {activePaymentSession.nama_program}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#064e3b', marginTop: '2px' }}>
                {formatRp(activePaymentSession.nominal)}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#047857', marginTop: '2px' }}>
                Kode: {activePaymentSession.kode_transaksi}
              </div>
            </div>

            {String(activePaymentSession.metode_pembayaran).includes('QRIS') ? (
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                  Scan QRIS Pondok Pesantren Nurul Wafa
                </div>
                <div style={{ width: '170px', height: '170px', margin: '0 auto', padding: '12px', background: '#fff', border: '2px solid #059669', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activePaymentSession.kode_transaksi)}`}
                    alt="QRIS Infak"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '8px' }}>
                  Mendukung semua aplikasi Mobile Banking, GoPay, OVO, DANA, ShopeePay, dan LinkAja.
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                  Nomor {activePaymentSession.metode_pembayaran}:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
                    {activePaymentSession.nomor_va}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(activePaymentSession.nomor_va);
                      toastSuccess('Disalin', 'Nomor Virtual Account berhasil disalin');
                    }}
                    style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={12} /> Salin
                  </button>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
                  a.n. <strong>Yayasan Pondok Pesantren Nurul Wafa (Infak)</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={confirmingPayment}
              onClick={() => handleConfirmSuccess(activePaymentSession)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669, #0d766e)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{confirmingPayment ? 'Memverifikasi...' : 'Saya Sudah Membayar (Konfirmasi)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

