import React from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';

const TabBukuTabunganWali = ({
  tabunganData = {},
  loadingTabungan = false,
  fetchSantriTabungan,
  selectedSantriId,
  formatRp = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`,
  onOpenTopUp,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '85px' }}>
      {/* Top Header Bar Terpadu Emerald Green - Compact */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '12px 14px 14px',
        color: '#ffffff',
        borderBottomLeftRadius: '18px',
        borderBottomRightRadius: '18px',
        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.2)',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={onBack}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                Buku Tabungan Santri
              </h2>
            </div>
          </div>

          <button 
            onClick={() => fetchSantriTabungan && fetchSantriTabungan(selectedSantriId)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Segarkan Saldo"
          >
            <RotateCw size={14} className={loadingTabungan ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        {/* HERO STAT CARD TABUNGAN (COMPACT LUXURY FINTECH GRADIENT) */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)',
          borderRadius: '16px',
          padding: '12px 14px 10px',
          color: '#ffffff',
          border: '1px solid rgba(167, 243, 208, 0.45)',
          boxShadow: '0 8px 18px -4px rgba(5, 150, 105, 0.35)',
          marginBottom: '10px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.25s ease'
        }}>
          {/* Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-25px',
            right: '-25px',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(110, 231, 183, 0.25)',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }} />

          {/* Watermark */}
          <div style={{
            position: 'absolute',
            right: '-4px',
            bottom: '-8px',
            fontSize: '4rem',
            opacity: 0.1,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            💰
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 800,
                color: '#a7f3d0',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}>
                SALDO TABUNGAN SANTRI
              </div>
              <div style={{ fontSize: '1.28rem', fontWeight: 900, color: '#ffffff', marginTop: '1px', letterSpacing: '-0.3px', textShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>
                {formatRp(tabunganData?.saldo_saat_ini || 0)}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>
                Uang saku santri terkelola aman & amanah
              </div>
            </div>

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.2rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              💰
            </div>
          </div>

          {/* 2 Mini Counters with Crisp White Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              background: '#ffffff',
              padding: '6px 10px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', textTransform: 'uppercase' }}>
                <ArrowDownLeft size={10} color="#059669" strokeWidth={2.5} /> Total Masuk
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                +{formatRp(tabunganData?.total_masuk || 0)}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '6px 10px',
              borderRadius: '10px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px', textTransform: 'uppercase' }}>
                <ArrowUpRight size={10} color="#e11d48" strokeWidth={2.5} /> Total Ambil
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 900, color: '#e11d48', marginTop: '2px' }}>
                -{formatRp(tabunganData?.total_keluar || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON: ISI SALDO TABUNGAN (TOP UP) - COMPACT */}
        <button
          type="button"
          onClick={onOpenTopUp}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '9px 14px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 3px 10px rgba(5, 150, 105, 0.28)',
            cursor: 'pointer',
            marginBottom: '10px',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={15} strokeWidth={2.8} />
          <span>Isi Saldo Tabungan (Top Up)</span>
        </button>

        {/* Petunjuk Pengiriman Uang Saku - Compact */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
          padding: '8px 10px',
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <CheckCircle2 size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '0.66rem', color: '#166534', lineHeight: 1.35 }}>
            <strong>Info Tabungan:</strong> Uang saku dikelola bendahara / asrama pondok. Santri dapat mengambil saku harian/mingguan untuk kebutuhan jajan, kitab, dan keperluan pondok.
          </div>
        </div>

        {/* Riwayat Mutasi Transaksi */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a' }}>
              Riwayat Mutasi Tabungan ({tabunganData?.riwayat_transaksi?.length || 0})
            </span>
            <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
              Real-time
            </span>
          </div>

          {loadingTabungan ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.72rem' }}>
              Memuat riwayat mutasi...
            </div>
          ) : !tabunganData?.riwayat_transaksi || tabunganData.riwayat_transaksi.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '18px 14px',
              textAlign: 'center',
              border: '1px dashed #cbd5e1',
              color: '#94a3b8',
              fontSize: '0.72rem'
            }}>
              Belum ada transaksi tabungan yang tercatat untuk santri ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tabunganData.riwayat_transaksi.map((t) => {
                const isMasuk = t.jenis_transaksi === 'masuk';
                return (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '9px 11px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: isMasuk ? '#ecfdf5' : '#fef2f2',
                        color: isMasuk ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isMasuk ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {t.keterangan || (isMasuk ? 'Penambahan Saldo' : 'Pengambilan')}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '1px' }}>
                          {t.tanggal_transaksi} • Saldo: {formatRp(t.saldo_sebelum)} &rarr;{' '}
                          <span style={{ fontWeight: 700, color: '#0f766e' }}>{formatRp(t.saldo_sesudah)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <div style={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: isMasuk ? '#059669' : '#dc2626'
                      }}>
                        {isMasuk ? '+' : '-'}{formatRp(t.nominal)}
                      </div>
                      <div style={{ fontSize: '0.56rem', color: '#94a3b8', marginTop: '1px' }}>
                        {t.kode_transaksi}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabBukuTabunganWali;

