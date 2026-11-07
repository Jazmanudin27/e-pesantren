import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';

export default function ModalKuitansi({ isOpen, data, onClose, formatRp }) {
  if (!isOpen || !data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '390px',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.2s ease-out'
      }}>
        {/* Header Kuitansi */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
          color: '#ffffff',
          padding: '20px 16px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: '#ffffff',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            <CheckCircle2 size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Kuitansi Kas Masuk Sah</h3>
          <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '2px' }}>
            Pondok Pesantren Nurul Wafa
          </div>
        </div>

        {/* Rincian Nota */}
        <div style={{ padding: '18px 20px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
            <span>No. Kuitansi</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>
              {data.nomor_kuitansi || data.nomor_transaksi || `KW-${data.id}`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
            <span>Tanggal</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {data.tanggal_bayar ? new Date(data.tanggal_bayar).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Hari ini'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
            <span>Nama Santri</span>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>{data.nama_santri}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#64748b' }}>
            <span>NIS / Sekolah</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>
              {data.nis || '-'} • {data.nama_sekolah || 'Santri'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
            <span>Metode Pembayaran</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>
              {data.metode_pembayaran || 'Kasir'} {data.channel_pembayaran ? `(${data.channel_pembayaran})` : ''}
            </span>
          </div>

          {/* Rincian Item */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '14px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', marginBottom: '4px' }}>
              ALOKASI PEMBAYARAN:
            </div>
            <div style={{ fontSize: '0.74rem', color: '#1e293b', lineHeight: 1.4 }}>
              {data.rincian_item || data.keterangan || 'Pembayaran Tagihan Santri'}
            </div>
          </div>

          {/* Total Bayar Sah */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: '#ecfdf5',
            borderRadius: '12px',
            border: '1px solid #a7f3d0'
          }}>
            <span style={{ fontWeight: 800, color: '#065f46', fontSize: '0.85rem' }}>TOTAL DITERIMA</span>
            <span style={{ fontWeight: 900, color: '#047857', fontSize: '1.2rem' }}>
              {formatRp(data.total_bayar)}
            </span>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div style={{ padding: '0 20px 20px', display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>
          <button
            onClick={() => window.print()}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Cetak Nota</span>
          </button>
        </div>
      </div>
    </div>
  );
}

