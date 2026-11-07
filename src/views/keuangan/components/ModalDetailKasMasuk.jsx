import React, { useState } from 'react';
import { Receipt, X, Search, CheckCircle2, CreditCard } from 'lucide-react';

export default function ModalDetailKasMasuk({
  isOpen,
  onClose,
  summary,
  allKasMasukTrx,
  formatRp,
  onOpenKuitansi
}) {
  const [searchKasMasuk, setSearchKasMasuk] = useState('');
  const [filterSekolahKas, setFilterSekolahKas] = useState('semua');

  if (!isOpen) return null;

  const filtered = allKasMasukTrx.filter((trx) => {
    if (filterSekolahKas !== 'semua') {
      const sk = String(trx.nama_sekolah || trx.tingkat_sekolah || '').toUpperCase();
      if (!sk.includes(filterSekolahKas)) return false;
    }
    if (searchKasMasuk.trim()) {
      const q = searchKasMasuk.toLowerCase();
      const sName = String(trx.nama_santri || '').toLowerCase();
      const sNis = String(trx.nis || '').toLowerCase();
      const sNo = String(trx.nomor_transaksi || trx.nomor_kuitansi || '').toLowerCase();
      const sItem = String(trx.rincian_item || trx.keterangan || '').toLowerCase();
      return sName.includes(q) || sNis.includes(q) || sNo.includes(q) || sItem.includes(q);
    }
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 99990
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '92vh',
        borderTopLeftRadius: '26px',
        borderTopRightRadius: '26px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -15px 35px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.25s ease',
        overflow: 'hidden'
      }}>
        {/* Header Modal Rincian */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
          color: '#ffffff',
          padding: '18px 20px 16px',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={20} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  Rincian Kas Masuk Sah
                </h3>
                <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '1px' }}>
                  Penerimaan pembayaran yang sudah lunas &amp; valid
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Box Total Nilai */}
          <div style={{
            marginTop: '14px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 600 }}>TOTAL PENERIMAAN KAS SAH</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {formatRp(summary.total_kas_masuk_sah || summary.total_nominal_terbayar || 0)}
              </div>
            </div>
            <div style={{
              background: '#ffffff',
              color: '#047857',
              padding: '5px 10px',
              borderRadius: '10px',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {allKasMasukTrx.length} Transaksi Lunas
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '8px 12px',
            marginBottom: '10px'
          }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, no transaksi..."
              value={searchKasMasuk}
              onChange={(e) => setSearchKasMasuk(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.82rem',
                background: 'transparent'
              }}
            />
            {searchKasMasuk && (
              <button
                onClick={() => setSearchKasMasuk('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Jenjang Sekolah */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'semua', label: 'Semua Sekolah' },
              { id: 'SMP', label: 'SMP' },
              { id: 'SMA', label: 'SMA' },
              { id: 'SMK', label: 'SMK' }
            ].map((f) => {
              const active = filterSekolahKas === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterSekolahKas(f.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: active ? '1px solid #059669' : '1px solid #e2e8f0',
                    background: active ? '#059669' : '#ffffff',
                    color: active ? '#ffffff' : '#64748b',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Transaksi Kas Masuk Sah */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: '40px 16px',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              color: '#64748b'
            }}>
              <Receipt size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Tidak ada riwayat kas masuk</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                {searchKasMasuk ? 'Coba ubah kata kunci pencarian' : 'Belum ada transaksi sah tercatat'}
              </div>
            </div>
          ) : (
            filtered.map((trx, idx) => {
              const sekolahLabel = trx.nama_sekolah || (trx.tingkat_sekolah ? `Kelas ${trx.tingkat_sekolah}` : 'Santri NWF');
              const isSMP = sekolahLabel.toUpperCase().includes('SMP');
              const isSMA = sekolahLabel.toUpperCase().includes('SMA');
              const isSMK = sekolahLabel.toUpperCase().includes('SMK');

              let badgeBg = '#f1f5f9';
              let badgeColor = '#475569';
              if (isSMP) { badgeBg = '#e0f2fe'; badgeColor = '#0369a1'; }
              else if (isSMA) { badgeBg = '#fef3c7'; badgeColor = '#b45309'; }
              else if (isSMK) { badgeBg = '#f3e8ff'; badgeColor = '#7e22ce'; }

              return (
                <div
                  key={trx.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* Top Bar Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                      #{trx.nomor_transaksi || `TRX-${trx.id}`}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <CheckCircle2 size={11} /> Sah / Lunas
                      </span>
                    </div>
                  </div>

                  {/* Info Santri & Sekolah */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                        {trx.nama_santri || 'Santri'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          NIS: {trx.nis || '-'}
                        </span>
                        <span style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          background: badgeBg,
                          color: badgeColor,
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          {sekolahLabel}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#047857' }}>
                        {formatRp(trx.total_bayar)}
                      </div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                        {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                      </div>
                    </div>
                  </div>

                  {/* Rincian Tagihan yang Dibayar */}
                  <div style={{
                    background: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    color: '#334155',
                    lineHeight: 1.4,
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '2px', fontSize: '0.66rem' }}>
                      ITEM DIBAYAR:
                    </div>
                    <div>
                      {trx.rincian_item || trx.keterangan || 'Pembayaran Tagihan Santri'}
                    </div>
                  </div>

                  {/* Bottom Footer Transaksi: Metode & Tombol Kuitansi */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} color="#059669" />
                      <span>{trx.metode_pembayaran || 'Kasir'} {trx.channel_pembayaran ? `(${trx.channel_pembayaran})` : ''}</span>
                    </div>

                    <button
                      onClick={() => onOpenKuitansi(trx)}
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Receipt size={12} />
                      <span>Lihat Kuitansi</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Modal */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: '#ffffff', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '12px',
              background: '#f1f5f9',
              border: 'none',
              color: '#334155',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}

