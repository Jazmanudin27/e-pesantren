import React from 'react';
import { AlertTriangle, X, CreditCard, Calendar, Clock } from 'lucide-react';

/**
 * Modal Notifikasi Tagihan Lewat Jatuh Tempo (Portal Wali Santri)
 */
export default function ModalTagihanJatuhTempo({
  open = false,
  tagihanList = [],
  santriNama = 'Santri',
  formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID'),
  onClose,
  onBayar
}) {
  if (!open || tagihanList.length === 0) return null;

  const totalTunggakan = tagihanList.reduce((acc, t) => acc + parseFloat(t.sisa_tagihan || 0), 0);

  const hitungTelat = (tgl) => {
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - d) / 86400000));
  };

  const formatTgl = (tgl) => {
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99998,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '380px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        animation: 'slideUp 0.25s ease-out'
      }}>
        {/* Header Merah Peringatan */}
        <div style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
          padding: '18px 18px 16px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-14px', fontSize: '6rem', opacity: 0.12, pointerEvents: 'none' }}>
            ⏰
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#ffffff',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '15px',
            background: 'rgba(255,255,255,0.2)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px'
          }}>
            <AlertTriangle size={24} strokeWidth={2.4} />
          </div>

          <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.3px' }}>
            Tagihan Lewat Jatuh Tempo
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fecaca', marginTop: '3px', lineHeight: 1.4 }}>
            Ananda <strong style={{ color: '#ffffff' }}>{santriNama}</strong> memiliki {tagihanList.length} tagihan yang telah melewati batas pembayaran.
          </div>

          {/* Total Tunggakan */}
          <div style={{
            marginTop: '12px',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#fecaca', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Tunggakan
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
              {formatRp(totalTunggakan)}
            </span>
          </div>
        </div>

        {/* Daftar Tagihan */}
        <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tagihanList.map((t) => {
            const telat = hitungTelat(t.jatuh_tempo);
            return (
              <div
                key={t.id}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.judul_tagihan || t.nama_komponen || 'Tagihan Santri'}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} /> Jatuh tempo {formatTgl(t.jatuh_tempo)}
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    marginTop: '4px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '6px'
                  }}>
                    <Clock size={9} /> Telat {telat} hari
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#b91c1c', whiteSpace: 'nowrap' }}>
                  {formatRp(t.sisa_tagihan)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={onBayar}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px',
              borderRadius: '14px',
              fontSize: '0.88rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 6px 16px rgba(220, 38, 38, 0.35)'
            }}
          >
            <CreditCard size={17} /> Bayar Sekarang
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              background: '#f8fafc',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              padding: '10px',
              borderRadius: '14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Ingatkan Nanti
          </button>
        </div>
      </div>
    </div>
  );
}

