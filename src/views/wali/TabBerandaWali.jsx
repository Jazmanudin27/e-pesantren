import React from 'react';
import { 
  Bell, 
  LogOut, 
  User, 
  ChevronRight, 
  Check, 
  Building2, 
  FileText, 
  Clock, 
  Wallet, 
  CreditCard, 
  Fingerprint, 
  BookOpen, 
  HeartHandshake, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  Calendar, 
  RotateCw 
} from 'lucide-react';

const squircleIconStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '6px',
  transition: 'transform 0.15s ease'
};

const menuCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  textAlign: 'center',
  width: '100%',
  userSelect: 'none'
};

const menuLabelStyle = {
  fontSize: '0.67rem',
  fontWeight: 700,
  color: '#334155',
  lineHeight: 1.2,
  maxWidth: '68px',
  display: 'block'
};

const TabBerandaWali = ({
  santri = {},
  santriList = [],
  selectedSantriId,
  setSelectedSantriId,
  rawSantriName = '',
  displayNisn = '',
  presensiList = [],
  tabunganData = {},
  keuanganSummary = {},
  financeActiveTab = 'tabungan',
  setFinanceActiveTab,
  latestFeed = [],
  transaksiPending = null,
  isPendingModalOpen = false,
  setIsPendingModalOpen,
  processingPending = false,
  handleLanjutkanBayar,
  handleBatalkanTransaksi,
  formatRp = (n) => `Rp ${(n || 0).toLocaleString('id-ID')}`,
  onNavigateTab,
  handleLogoutAction
}) => {
  // Hitung akumulasi presensi santri
  const countHadir = presensiList.filter(p => (p.status || '').toLowerCase() === 'hadir').length;
  const countSakit = presensiList.filter(p => (p.status || '').toLowerCase() === 'sakit').length;
  const countIzin = presensiList.filter(p => (p.status || '').toLowerCase() === 'izin').length;
  const countAlfa = presensiList.filter(p => ['alfa', 'tanpa keterangan', 'absen'].includes((p.status || '').toLowerCase())).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Modern Teal Gradient Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
        padding: '16px 16px 34px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        position: 'relative'
      }}>
        {/* Header Top Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Brand Logo: NWF Mobile */}
          <div 
            onClick={() => onNavigateTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
              flexShrink: 0
            }}>
              <img 
                src="/nwf.png" 
                alt="NWF Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain'
                }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                <span style={{
                  fontWeight: 900,
                  fontSize: '1.45rem',
                  letterSpacing: '-0.5px',
                  color: '#ffffff',
                  lineHeight: 1,
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  NWF
                </span>
                <span style={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  fontStyle: 'italic',
                  letterSpacing: '-0.2px',
                  color: '#a7f3d0',
                  lineHeight: 1,
                  textShadow: '0 2px 6px rgba(11, 107, 96, 0.35)'
                }}>
                  Mobile
                </span>
              </div>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.85)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginTop: '2px',
                lineHeight: 1
              }}>
                Portal Orang Tua Santri
              </span>
            </div>
          </div>

          {/* Top Action Buttons (Bell, Logout) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onNavigateTab('notifikasi')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '10px',
                position: 'relative'
              }}
              title="Pemberitahuan Pesantren"
            >
              <Bell size={18} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#ef4444'
              }} />
            </button>

            <button
              onClick={handleLogoutAction}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '7px',
                borderRadius: '10px'
              }}
              title="Keluar Akun"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Switcher Santri jika Wali memiliki > 1 anak santri */}
        {santriList && santriList.length > 1 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.66rem', color: '#a7f3d0', fontWeight: 700, marginBottom: '6px' }}>
              PILIH SANTRI:
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {santriList.map((s) => {
                const isSelected = String(s.id) === String(selectedSantriId);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSantriId(s.id)}
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.18)',
                      color: isSelected ? '#0d766e' : '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '6px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{s.nama_santri}</span>
                    {isSelected && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 1. REKAP STATUS KEHADIRAN & IBADAH */}
      <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 12 }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '12px 12px 10px',
          boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Header Mini Status: Nama Santri */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={15} strokeWidth={2.5} />
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {rawSantriName}
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color: '#64748b',
                  lineHeight: 1.1,
                  marginTop: '1px'
                }}>
                  NISN: {displayNisn} {santri.nama_kamar ? `• ${santri.nama_kamar}` : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('absensi')}
              style={{
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                borderRadius: '8px',
                color: '#0d9488',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px 8px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              Rincian <ChevronRight size={12} />
            </button>
          </div>

          {/* 4 Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px'
          }}>
            {/* Hadir */}
            <div style={{
              background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '14px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #bbf7d0',
              userSelect: 'none'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(16, 185, 129, 0.35)'
              }}>
                <Check size={16} strokeWidth={2.8} />
              </div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#15803d',
                marginTop: '4px',
                lineHeight: 1
              }}>
                {countHadir}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
                Hadir
              </span>
            </div>

            {/* Sakit */}
            <div style={{
              background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '14px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #fecaca',
              userSelect: 'none'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(239, 68, 68, 0.35)'
              }}>
                <Building2 size={16} strokeWidth={2.6} />
              </div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#b91c1c',
                marginTop: '4px',
                lineHeight: 1
              }}>
                {countSakit}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', marginTop: '2px' }}>
                Sakit
              </span>
            </div>

            {/* Izin */}
            <div style={{
              background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
              borderRadius: '14px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #fde68a',
              userSelect: 'none'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(245, 158, 11, 0.35)'
              }}>
                <FileText size={16} strokeWidth={2.6} />
              </div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#b45309',
                marginTop: '4px',
                lineHeight: 1
              }}>
                {countIzin}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>
                Izin
              </span>
            </div>

            {/* Alfa */}
            <div style={{
              background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
              borderRadius: '14px',
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: '1px solid #99f6e4',
              userSelect: 'none'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '10px',
                background: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(13, 148, 136, 0.35)'
              }}>
                <Clock size={16} strokeWidth={2.6} />
              </div>
              <div style={{
                fontSize: '1.05rem',
                fontWeight: 900,
                color: '#0f766e',
                marginTop: '4px',
                lineHeight: 1
              }}>
                {countAlfa}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#115e59', marginTop: '2px' }}>
                Alfa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD TABUNGAN SANTRI & KEUANGAN SPP (DESAIN LUXURY FINTECH GRADIENT) */}
      <div style={{ padding: '8px 14px 0', position: 'relative', zIndex: 11 }}>
        <div
          style={{
            background: financeActiveTab === 'tabungan'
              ? 'linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #172554 100%)',
            borderRadius: '18px',
            padding: '12px 14px 12px',
            border: financeActiveTab === 'tabungan'
              ? '1px solid rgba(167, 243, 208, 0.45)'
              : '1px solid rgba(191, 219, 254, 0.45)',
            boxShadow: financeActiveTab === 'tabungan'
              ? '0 10px 25px -4px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)'
              : '0 10px 25px -4px rgba(37, 99, 235, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)',
            position: 'relative',
            overflow: 'hidden',
            color: '#ffffff',
            transition: 'all 0.25s ease'
          }}
        >
          {/* Ambient Glow Accent */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: financeActiveTab === 'tabungan' ? 'rgba(110, 231, 183, 0.22)' : 'rgba(147, 197, 253, 0.22)',
            filter: 'blur(25px)',
            pointerEvents: 'none'
          }} />

          {/* Watermark Icon */}
          <div style={{
            position: 'absolute',
            right: '-8px',
            bottom: '-12px',
            fontSize: '5rem',
            opacity: 0.1,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            {financeActiveTab === 'tabungan' ? '💰' : '💳'}
          </div>

          {/* Tab Switcher: Tabungan & Tagihan (Frosted Glass Pill) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '3px',
            borderRadius: '12px',
            marginBottom: '10px',
            position: 'relative',
            zIndex: 2
          }}>
            <button
              type="button"
              onClick={() => setFinanceActiveTab('tabungan')}
              style={{
                border: 'none',
                background: financeActiveTab === 'tabungan' ? '#ffffff' : 'transparent',
                color: financeActiveTab === 'tabungan' ? '#047857' : 'rgba(255, 255, 255, 0.85)',
                fontWeight: 800,
                fontSize: '11.5px',
                padding: '4px 8px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: financeActiveTab === 'tabungan' ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Wallet size={13} strokeWidth={2.4} color={financeActiveTab === 'tabungan' ? '#047857' : 'rgba(255, 255, 255, 0.85)'} />
              <span>Tabungan</span>
            </button>

            <button
              type="button"
              onClick={() => setFinanceActiveTab('tagihan')}
              style={{
                border: 'none',
                background: financeActiveTab === 'tagihan' ? '#ffffff' : 'transparent',
                color: financeActiveTab === 'tagihan' ? '#1d4ed8' : 'rgba(255, 255, 255, 0.85)',
                fontWeight: 800,
                fontSize: '11.5px',
                padding: '4px 8px',
                borderRadius: '9px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: financeActiveTab === 'tagihan' ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <CreditCard size={13} strokeWidth={2.4} color={financeActiveTab === 'tagihan' ? '#1d4ed8' : 'rgba(255, 255, 255, 0.85)'} />
              <span>Tagihan</span>
              {(keuanganSummary?.totalBelumBayar || 0) > 0 && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)'
                }} />
              )}
            </button>
          </div>

          {/* TABUNGAN SANTRI CONTENT */}
          {financeActiveTab === 'tabungan' && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: '#a7f3d0',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.1
                  }}>
                    SALDO TABUNGAN SANTRI
                  </div>
                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.3px',
                    lineHeight: 1.15,
                    marginTop: '3px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.18)'
                  }}>
                    {formatRp(tabunganData?.saldo_saat_ini || 0)}
                  </div>
                </div>

                <div
                  onClick={() => onNavigateTab('tabungan')}
                  title="Buka Buku Kas"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <Wallet size={16} strokeWidth={2.4} />
                </div>
              </div>

              {/* Garis Tipis Halus */}
              <div style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.16)',
                margin: '8px 0 7px'
              }} />

              {/* Sub Metrics: Glass Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: '#a7f3d0',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}>
                    TOTAL UANG MASUK
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#4ade80',
                    marginTop: '2px',
                    letterSpacing: '-0.2px'
                  }}>
                    +{formatRp(tabunganData?.total_masuk || 0)}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: '#fecdd3',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}>
                    TOTAL PENGAMBILAN
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#fca5a5',
                    marginTop: '2px',
                    letterSpacing: '-0.2px'
                  }}>
                    -{formatRp(tabunganData?.total_keluar || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAGIHAN KEUANGAN CONTENT */}
          {financeActiveTab === 'tagihan' && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: '#bae6fd',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.1
                  }}>
                    TOTAL TAGIHAN KEUANGAN
                  </div>
                  <div style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.3px',
                    lineHeight: 1.15,
                    marginTop: '3px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.18)'
                  }}>
                    {keuanganSummary?.formattedTotalBelumBayar || 'Rp 0'}
                  </div>
                </div>

                <div
                  onClick={() => onNavigateTab('tagihan')}
                  title="Buka Rincian Tagihan"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: '8px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <CreditCard size={16} strokeWidth={2.4} />
                </div>
              </div>

              {/* Garis Tipis Halus */}
              <div style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.16)',
                margin: '8px 0 7px'
              }} />

              {/* Sub Metrics: Glass Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: '#bae6fd',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}>
                    SPP BULANAN
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginTop: '2px',
                    letterSpacing: '-0.2px'
                  }}>
                    {keuanganSummary?.formattedBulanan || 'Rp 0'}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 0, 0, 0.22)',
                  backdropFilter: 'blur(4px)',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <div style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: '#fed7aa',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase'
                  }}>
                    SISA BIAYA MASUK
                  </div>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    color: '#fef08a',
                    marginTop: '2px',
                    letterSpacing: '-0.2px'
                  }}>
                    {keuanganSummary?.formattedSisaBiayaMasuk || 'Rp 0'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION MENU LAYANAN SANTRI */}
      <div style={{ padding: '0 14px', marginTop: '12px' }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '12px 12px 12px',
          boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '-0.2px'
          }}>
            <span style={{
              width: '4px',
              height: '14px',
              background: '#0d766e',
              borderRadius: '4px'
            }} />
            Menu Layanan Santri
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px 4px',
            justifyItems: 'center'
          }}>
            {/* 1. Tabungan Santri */}
            <div onClick={() => onNavigateTab('tabungan')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 6px 16px -2px rgba(16, 185, 129, 0.38)'
              }}>
                <Wallet size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Tabungan</span>
            </div>

            {/* 2. Bayar SPP / Tagihan */}
            <div onClick={() => onNavigateTab('tagihan')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 6px 16px -2px rgba(59, 130, 246, 0.38)'
              }}>
                <CreditCard size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Bayar SPP</span>
            </div>

            {/* 3. Presensi Sholat / Berjamaah */}
            <div onClick={() => onNavigateTab('absensi')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                boxShadow: '0 6px 16px -2px rgba(6, 182, 212, 0.38)'
              }}>
                <Fingerprint size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Berjamaah</span>
            </div>

            {/* 4. Tahfidz */}
            <div onClick={() => onNavigateTab('hafalan')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                boxShadow: '0 6px 16px -2px rgba(168, 85, 247, 0.38)'
              }}>
                <BookOpen size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Tahfidz</span>
            </div>

            {/* 5. Perizinan Pulang */}
            <div onClick={() => onNavigateTab('perizinan')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                boxShadow: '0 6px 16px -2px rgba(249, 115, 22, 0.38)'
              }}>
                <Clock size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Perizinan</span>
            </div>

            {/* 6. Praktek Ibadah */}
            <div onClick={() => onNavigateTab('praktek')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                boxShadow: '0 6px 16px -2px rgba(20, 184, 166, 0.38)'
              }}>
                <HeartHandshake size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Praktek</span>
            </div>

            {/* 7. Perkembangan Santri */}
            <div onClick={() => onNavigateTab('laporan')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                boxShadow: '0 6px 16px -2px rgba(2, 132, 199, 0.38)'
              }}>
                <Award size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Perkembangan</span>
            </div>

            {/* 8. Tata Tertib */}
            <div onClick={() => onNavigateTab('pelanggaran')} style={menuCardStyle}>
              <div style={{
                ...squircleIconStyle,
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                boxShadow: '0 6px 16px -2px rgba(244, 63, 94, 0.38)'
              }}>
                <ShieldAlert size={23} strokeWidth={2.3} color="#ffffff" />
              </div>
              <span style={menuLabelStyle}>Tata Tertib</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SLIDER KEGIATAN & AGENDA PESANTREN */}
      <div style={{ padding: '12px 14px 4px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '-0.2px'
          }}>
            <span style={{
              width: '4px',
              height: '15px',
              background: '#059669',
              borderRadius: '4px'
            }} />
            Kegiatan Pesantren
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('informasi')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#059669',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: 0
            }}
          >
            Lihat Semua <ChevronRight size={13} />
          </button>
        </div>

        {/* Horizontal Scroll Carousel */}
        <div style={{
          display: 'flex',
          gap: '10px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch'
        }}>
          {(latestFeed && latestFeed.length > 0 ? latestFeed : [
            {
              id: 'fb-1',
              judul: "Kajian Kitab Kuning & Sorogan Santri",
              kategori: 'Pengajian',
              konten: "Kajian fiqih ibadah & nahwu ba'da Subuh dan Maghrib bersama dewan asatidz.",
              tanggal_publikasi: 'Harian'
            },
            {
              id: 'fb-2',
              judul: "Setoran Tahfidz & Tasmi' Al-Qur'an",
              kategori: 'Tahfidz',
              konten: "Muroja'ah rutin santri dan evaluasi mutqin hafalan bersama musyrif asrama.",
              tanggal_publikasi: 'Mingguan'
            },
            {
              id: 'fb-3',
              judul: "Muhadhoroh & Latihan Khitobah 3 Bahasa",
              kategori: 'Ekstrakurikuler',
              konten: "Pembinaan public speaking santri dalam Bahasa Arab, Inggris, dan Indonesia.",
              tanggal_publikasi: 'Kamis Malam'
            },
            {
              id: 'fb-4',
              judul: "Disiplin Presensi Sholat Berjamaah",
              kategori: 'Ibadah',
              konten: "Pemantauan kehadiran sholat fardhu & tahajud di Masjid Jami' Pesantren.",
              tanggal_publikasi: 'Wajib'
            }
          ]).map((item, idx) => {
            // Tema warna + emoji per kategori
            const kat = String(item.kategori || '').toLowerCase();
            let theme = { emoji: '✨', grad: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)' };
            if (kat.includes('ngaji') || kat.includes('kitab') || kat.includes('kajian')) theme = { emoji: '📖', grad: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' };
            else if (kat.includes('tahfidz') || kat.includes('qur')) theme = { emoji: '🕌', grad: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)' };
            else if (kat.includes('ibadah') || kat.includes('sholat')) theme = { emoji: '🤲', grad: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)' };
            else if (kat.includes('ekstra') || kat.includes('lomba')) theme = { emoji: '🏆', grad: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)' };
            else if (kat.includes('umum') || kat.includes('info')) theme = { emoji: '📢', grad: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)' };
            else if (kat.includes('libur') || kat.includes('pulang')) theme = { emoji: '🏖️', grad: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)' };

            const foto = item.foto_url || item.lampiran_url || '';
            const tglLabel = item.tanggal_publikasi
              ? (typeof item.tanggal_publikasi === 'string' && item.tanggal_publikasi.includes('-')
                  ? new Date(item.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                  : item.tanggal_publikasi)
              : 'Pesantren';

            return (
              <div
                key={item.id || idx}
                onClick={() => onNavigateTab('informasi')}
                style={{
                  flex: '0 0 230px',
                  height: '158px',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: foto ? `url(${foto}) center/cover no-repeat` : theme.grad,
                  boxShadow: '0 8px 20px -6px rgba(15, 23, 42, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#ffffff'
                }}
              >
                {/* Watermark emoji (tanpa foto) */}
                {!foto && (
                  <div style={{ position: 'absolute', right: '-6px', top: '-8px', fontSize: '5.2rem', opacity: 0.16, pointerEvents: 'none', userSelect: 'none' }}>
                    {theme.emoji}
                  </div>
                )}

                {/* Overlay gelap bawah agar teks terbaca */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.78) 100%)' }} />

                {/* Top Badges */}
                <div style={{ position: 'relative', padding: '10px 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#ffffff',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '999px'
                  }}>
                    {theme.emoji} {item.kategori || 'Kegiatan'}
                  </span>
                  {Number(item.is_pinned) === 1 ? (
                    <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.56rem', fontWeight: 900, padding: '3px 7px', borderRadius: '999px' }}>
                      📌 PIN
                    </span>
                  ) : (
                    <Sparkles size={14} style={{ opacity: 0.85 }} />
                  )}
                </div>

                {/* Bottom Info */}
                <div style={{ position: 'relative', padding: '0 11px 10px' }}>
                  <div style={{
                    fontSize: '0.84rem',
                    fontWeight: 900,
                    lineHeight: 1.25,
                    textShadow: '0 2px 6px rgba(0,0,0,0.45)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.judul}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)',
                    marginTop: '6px'
                  }}>
                    <Calendar size={11} />
                    <span>{tglLabel}</span>
                    <span style={{
                      marginLeft: 'auto',
                      background: '#ffffff',
                      color: '#0f172a',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: '0.6rem',
                      fontWeight: 800
                    }}>
                      Lihat →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REMINDER PILL JIKA POPUP DITUTUP SEMENTARA */}
      {transaksiPending && !isPendingModalOpen && (
        <div style={{ padding: '8px 16px 0' }}>
          <button
            type="button"
            onClick={() => setIsPendingModalOpen(true)}
            style={{
              width: '100%',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              color: '#b45309',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.78rem',
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.1)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> 1 Transaksi Menunggu Pembayaran
            </span>
            <span style={{ fontWeight: 800, color: '#92400e' }}>Buka Pop-up &gt;</span>
          </button>
        </div>
      )}

      {/* POPUP MODAL TRANSAKSI PENDING DI BERANDA */}
      {isPendingModalOpen && transaksiPending && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}>
            {/* Header Popup */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#fff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Menunggu Pembayaran</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    #{transaksiPending.nomor_transaksi}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPendingModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#fff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL YANG HARUS DIBAYAR</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                  {formatRp(transaksiPending.total_bayar)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px', fontWeight: 600 }}>
                  {transaksiPending.item_dibayar || 'Tagihan Santri'}
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                Transaksi pembayaran ini masih aktif. Anda dapat melanjutkan pembayaran atau membatalkannya untuk memilih metode lain.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleLanjutkanBayar && handleLanjutkanBayar(transaksiPending)}
                  disabled={processingPending}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                    opacity: processingPending ? 0.7 : 1
                  }}
                >
                  <CreditCard size={16} /> {processingPending ? 'Memproses...' : 'Lanjutkan Bayar'}
                </button>

                <button
                  type="button"
                  onClick={() => handleBatalkanTransaksi && handleBatalkanTransaksi(transaksiPending)}
                  disabled={processingPending}
                  style={{
                    width: '100%',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    padding: '11px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: processingPending ? 0.7 : 1
                  }}
                >
                  <RotateCw size={14} /> Ganti Metode / Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TabBerandaWali;

