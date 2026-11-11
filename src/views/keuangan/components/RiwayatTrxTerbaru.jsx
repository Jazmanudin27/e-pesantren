import React from 'react';
import { RotateCw, Receipt, CheckCircle2, Calendar, Wallet, CreditCard, QrCode } from 'lucide-react';

const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateId = (val) => {
  if (!val) return 'Hari ini';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function RiwayatTrxTerbaru({
  recentTrx,
  loading,
  formatRp,
  onOpenDetailKas,
  onOpenKuitansi
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.2px' }}>
          <div style={{ width: '4px', height: '15px', background: '#0d766e', borderRadius: '4px' }} />
          <span>Transaksi Kasir Terbaru</span>
        </div>
        <button
          onClick={onOpenDetailKas}
          style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', padding: '3px 10px', cursor: 'pointer', color: '#047857', fontSize: '0.7rem', fontWeight: 800 }}
        >
          Lihat Semua &rsaquo;
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
            <RotateCw size={18} className="animate-spin" style={{ margin: '0 auto 6px', color: '#059669' }} />
            <div>Memuat transaksi...</div>
          </div>
        ) : recentTrx.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
            <Receipt size={24} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
            <div>Belum ada transaksi hari ini</div>
          </div>
        ) : (
          recentTrx.map((trx) => {
            const rawMethod = `${trx.channel_pembayaran || ''} ${trx.metode_pembayaran || ''}`.toLowerCase();
            const isQris = rawMethod.includes('qris') || rawMethod.includes('midtrans');
            const isTransfer = rawMethod.includes('transfer') || rawMethod.includes('virtual') || rawMethod.includes('va');
            const accent = isQris ? '#7c3aed' : isTransfer ? '#0284c7' : '#10b981';
            const color = isQris ? '#6d28d9' : isTransfer ? '#0369a1' : '#047857';
            const bg = isQris ? '#f5f3ff' : isTransfer ? '#f0f9ff' : '#ecfdf5';
            const borderCol = isQris ? '#ddd6fe' : isTransfer ? '#bae6fd' : '#bbf7d0';
            const MethodIcon = isQris ? QrCode : isTransfer ? CreditCard : Wallet;
            const methodLabel = isQris ? 'QRIS / Midtrans' : isTransfer ? 'Transfer Bank' : 'Kas Tunai';

            return (
              <div
                key={trx.id}
                onClick={() => onOpenKuitansi(trx)}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '14px',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${accent}`,
                  boxShadow: '0 4px 14px -4px rgba(15, 23, 42, 0.05)',
                  cursor: 'pointer'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '9px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      background: bg,
                      color,
                      border: `1px solid ${borderCol}`,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getInitials(trx.nama_santri)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trx.nama_santri || 'Santri'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} />
                          {formatDateId(trx.tanggal_bayar || trx.created_at)}
                        </span>
                        <span>• #{trx.nomor_transaksi || `TRX-${trx.id}`}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#047857' }}>
                      + {formatRp(trx.nominal_pokok || trx.total_bayar)}
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: bg,
                      color,
                      border: `1px solid ${borderCol}`
                    }}>
                      <MethodIcon size={10} />
                      {methodLabel}
                    </span>
                  </div>
                </div>

                {/* Soft Box Rincian */}
                {(trx.rincian_item || trx.keterangan) && (
                  <div style={{
                    fontSize: '0.73rem',
                    color: '#334155',
                    background: bg,
                    border: `1px solid ${borderCol}`,
                    padding: '8px 10px',
                    borderRadius: '11px',
                    marginBottom: '8px',
                    lineHeight: 1.35,
                    fontWeight: 600
                  }}>
                    {trx.rincian_item || trx.keterangan}
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px'
                }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    Pembayaran Sah
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#334155',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '4px 9px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Receipt size={12} /> Kuitansi
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

