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
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      {/* Top Header Bar Terpadu Emerald Green */}
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
                Buku Tabungan Santri
              </h2>
            </div>
          </div>

          <button 
            onClick={() => fetchSantriTabungan && fetchSantriTabungan(selectedSantriId)}
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
            title="Segarkan Saldo"
          >
            <RotateCw size={17} className={loadingTabungan ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* HERO STAT CARD TABUNGAN (LUXURY FINTECH GRADIENT) */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)',
          borderRadius: '22px',
          padding: '18px 18px 16px',
          color: '#ffffff',
          border: '1px solid rgba(167, 243, 208, 0.45)',
          boxShadow: '0 12px 28px -4px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)',
          marginBottom: '16px',
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

          {/* Watermark */}
          <div style={{
            position: 'absolute',
            right: '-8px',
            bottom: '-12px',
            fontSize: '5.5rem',
            opacity: 0.1,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            💰
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#a7f3d0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                SALDO TABUNGAN SANTRI
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {formatRp(tabunganData?.saldo_saat_ini || 0)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.88)', marginTop: '2px' }}>
                Uang saku santri terkelola aman & amanah
              </div>
            </div>

            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              💰
            </div>
          </div>

          {/* 2 Mini Counters with Crisp White Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            position: 'relative',
            zIndex: 2
          }}>
            <div style={{
              background: '#ffffff',
              padding: '9px 12px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                <ArrowDownLeft size={12} color="#059669" strokeWidth={2.5} /> Total Uang Masuk
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#059669', marginTop: '3px' }}>
                +{formatRp(tabunganData?.total_masuk || 0)}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              padding: '9px 12px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.14)',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
                <ArrowUpRight size={12} color="#e11d48" strokeWidth={2.5} /> Total Pengambilan
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#e11d48', marginTop: '3px' }}>
                -{formatRp(tabunganData?.total_keluar || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTON: ISI SALDO TABUNGAN (TOP UP) */}
        <button
          type="button"
          onClick={onOpenTopUp}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '16px',
            fontWeight: 800,
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
            cursor: 'pointer',
            marginBottom: '14px',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={18} strokeWidth={2.8} />
          <span>Isi Saldo Tabungan (Top Up)</span>
        </button>

        {/* Petunjuk Pengiriman Uang Saku */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '14px',
          border: '1px solid #bbf7d0',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
            <strong>Informasi Tabungan Santri:</strong> Uang saku yang disetor dikelola oleh bendahara / wali asrama pondok. Santri dapat mengambil uang saku harian/mingguan untuk kebutuhan jajan, kitab, dan keperluan pesantren.
          </div>
        </div>

        {/* Riwayat Mutasi Transaksi */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
              Riwayat Mutasi Tabungan ({tabunganData?.riwayat_transaksi?.length || 0})
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Real-time
            </span>
          </div>

          {loadingTabungan ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.8rem' }}>
              Memuat riwayat mutasi...
            </div>
          ) : !tabunganData?.riwayat_transaksi || tabunganData.riwayat_transaksi.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              border: '1px dashed #cbd5e1',
              color: '#94a3b8',
              fontSize: '0.78rem'
            }}>
              Belum ada transaksi tabungan yang tercatat untuk santri ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tabunganData.riwayat_transaksi.map((t) => {
                const isMasuk = t.jenis_transaksi === 'masuk';
                return (
                  <div
                    key={t.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isMasuk ? '#ecfdf5' : '#fef2f2',
                        color: isMasuk ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isMasuk ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {t.keterangan || (isMasuk ? 'Penambahan Saldo' : 'Pengambilan')}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                          {t.tanggal_transaksi} • Saldo: {formatRp(t.saldo_sebelum)} &rarr;{' '}
                          <span style={{ fontWeight: 700, color: '#0f766e' }}>{formatRp(t.saldo_sesudah)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 900,
                        color: isMasuk ? '#059669' : '#dc2626'
                      }}>
                        {isMasuk ? '+' : '-'}{formatRp(t.nominal)}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '1px' }}>
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

