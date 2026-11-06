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
        {/* HERO STAT CARD TABUNGAN */}
        <div style={{
          background: 'linear-gradient(135deg, #0d766e 0%, #044e42 100%)',
          borderRadius: '20px',
          padding: '16px 16px 14px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(13, 118, 110, 0.35)',
          marginBottom: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#99f6e4',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                SALDO TABUNGAN SANTRI
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {formatRp(tabunganData?.saldo_saat_ini || 0)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                Uang saku santri terkelola aman & amanah
              </div>
            </div>

            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.16)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.4rem'
            }}>
              💰
            </div>
          </div>

          {/* 2 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '10px 12px',
            borderRadius: '14px'
          }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ArrowDownLeft size={11} color="#4ade80" /> Total Uang Masuk
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4ade80', marginTop: '2px' }}>
                +{formatRp(tabunganData?.total_masuk || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ArrowUpRight size={11} color="#fca5a5" /> Total Pengambilan
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fca5a5', marginTop: '2px' }}>
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

