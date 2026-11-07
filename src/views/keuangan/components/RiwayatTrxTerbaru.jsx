import React from 'react';
import { RotateCw, Receipt, CheckCircle2 } from 'lucide-react';

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
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '-0.2px' }}>
          <div style={{ width: '4px', height: '14px', background: '#0d766e', borderRadius: '4px' }} />
          <span>Transaksi Kasir Terbaru</span>
        </div>
        <button
          onClick={onOpenDetailKas}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0d766e', fontSize: '0.74rem', fontWeight: 700 }}
        >
          Lihat Semua &rsaquo;
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
            <RotateCw size={18} className="animate-spin" style={{ margin: '0 auto 6px', color: '#059669' }} />
            <div>Memuat transaksi...</div>
          </div>
        ) : recentTrx.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem' }}>
            <Receipt size={24} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
            <div>Belum ada transaksi hari ini</div>
          </div>
        ) : (
          recentTrx.map((trx) => (
            <div
              key={trx.id}
              onClick={() => onOpenKuitansi(trx)}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                    {trx.nama_santri || 'Santri'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {trx.nomor_transaksi || `TRX-${trx.id}`} • {trx.metode_pembayaran || 'Kasir'}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#059669' }}>
                  {formatRp(trx.total_bayar)}
                </div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '1px' }}>
                  {trx.tanggal_bayar ? String(trx.tanggal_bayar).slice(0, 10) : 'Hari ini'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

