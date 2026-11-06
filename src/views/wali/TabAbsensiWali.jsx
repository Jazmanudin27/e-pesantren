import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Fingerprint, 
  Calendar 
} from 'lucide-react';

export default function TabAbsensiWali({
  presensi = [],
  absensiTglDari,
  setAbsensiTglDari,
  absensiTglSampai,
  setAbsensiTglSampai,
  getCurrentMonthRange,
  onBack
}) {
  const [absensiSubTab, setAbsensiSubTab] = useState('berjamaah'); // 'berjamaah' | 'mengaji'
  const [absensiStatusFilter, setAbsensiStatusFilter] = useState('Semua');

  const isMengaji = (r) => {
    const kat = String(r.kategori_sesi || '').toLowerCase();
    const name = String(r.nama_sesi || '').toLowerCase();
    return kat.includes('ngaji') || kat.includes('pengajian') || kat.includes('taklim') || kat.includes('halaqah') ||
           name.includes('ngaji') || name.includes('kitab') || name.includes('sorogan') || name.includes('diniyah') || 
           name.includes('bandongan') || name.includes('taklim') || name.includes('materi');
  };

  const normalizeRowDate = (tgl) => {
    if (!tgl) return '';
    if (typeof tgl === 'string') {
      const m = tgl.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
    const d = new Date(tgl);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return String(tgl).split('T')[0];
  };

  // Filter tanggal 'dari' - 'sampai'
  const dateFilteredPresensi = presensi.filter(r => {
    const itemDate = normalizeRowDate(r.tanggal);
    if (absensiTglDari && itemDate && itemDate < absensiTglDari) return false;
    if (absensiTglSampai && itemDate && itemDate > absensiTglSampai) return false;
    return true;
  });

  const listBerjamaah = dateFilteredPresensi.filter(r => !isMengaji(r));
  const listMengaji = dateFilteredPresensi.filter(r => isMengaji(r));

  const currentList = absensiSubTab === 'berjamaah' ? listBerjamaah : listMengaji;

  // Hitung statistik untuk subtab aktif
  const totalHadir = currentList.filter(r => (r.status || '').toLowerCase().includes('hadir') || (r.status || '').toLowerCase().includes('tepat')).length;
  const totalSakit = currentList.filter(r => (r.status || '').toLowerCase().includes('sakit')).length;
  const totalIzin = currentList.filter(r => (r.status || '').toLowerCase().includes('izin')).length;
  const totalAlfa = currentList.filter(r => (r.status || '').toLowerCase().includes('alfa') || (r.status || '').toLowerCase().includes('absen')).length;

  const filteredList = currentList.filter(row => {
    if (absensiStatusFilter === 'Semua') return true;
    return (row.status || '').toLowerCase().includes(absensiStatusFilter.toLowerCase());
  });

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
                Absensi Berjamaah & Mengaji
              </h2>
            </div>
          </div>

          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Fingerprint size={18} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* HERO STAT CARD */}
        <div style={{
          background: absensiSubTab === 'berjamaah'
            ? 'linear-gradient(135deg, #0d766e 0%, #044e42 100%)'
            : 'linear-gradient(135deg, #0369a1 0%, #1e3a8a 100%)',
          borderRadius: '20px',
          padding: '16px 16px 14px',
          color: '#ffffff',
          boxShadow: absensiSubTab === 'berjamaah'
            ? '0 8px 24px -4px rgba(13, 118, 110, 0.35)'
            : '0 8px 24px -4px rgba(3, 105, 161, 0.35)',
          marginBottom: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: absensiSubTab === 'berjamaah' ? '#99f6e4' : '#bae6fd',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {absensiSubTab === 'berjamaah' ? 'Presensi Berjamaah' : 'Presensi Mengaji'}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {totalHadir} Sesi Hadir
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)', marginTop: '2px' }}>
                Total {currentList.length} sesi presensi tercatat sistem
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
              fontSize: '1.4rem'
            }}>
              {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
            </div>
          </div>

          {/* 4 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.18)',
            padding: '8px',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>{totalHadir}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Hadir</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f87171' }}>{totalSakit}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sakit</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fbbf24' }}>{totalIzin}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Izin</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#2dd4bf' }}>{totalAlfa}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Alfa</div>
            </div>
          </div>
        </div>

        {/* CARD FILTER TANGGAL DARI - SAMPAI (OTOMATIS PER BULAN) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '12px 14px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: '#0f766e' }}>
              <Calendar size={15} />
              <span>Filter Tanggal (Otomatis Per Bulan)</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  if (getCurrentMonthRange) {
                    const r = getCurrentMonthRange();
                    setAbsensiTglDari(r.dari);
                    setAbsensiTglSampai(r.sampai);
                  }
                }}
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  color: '#047857',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  const y = lastMonthDate.getFullYear();
                  const m = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
                  const lDay = new Date(y, lastMonthDate.getMonth() + 1, 0).getDate();
                  setAbsensiTglDari(`${y}-${m}-01`);
                  setAbsensiTglSampai(`${y}-${m}-${String(lDay).padStart(2, '0')}`);
                }}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '0.64rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Bulan Lalu
              </button>
              {(absensiTglDari || absensiTglSampai) && (
                <button
                  type="button"
                  onClick={() => {
                    setAbsensiTglDari('');
                    setAbsensiTglSampai('');
                  }}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Semua
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.64rem', fontWeight: 700, color: '#64748b', marginBottom: '3px' }}>
                Dari Tanggal
              </label>
              <input
                type="date"
                value={absensiTglDari}
                onChange={(e) => setAbsensiTglDari(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 8px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.64rem', fontWeight: 700, color: '#64748b', marginBottom: '3px' }}>
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={absensiTglSampai}
                onChange={(e) => setAbsensiTglSampai(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '7px 8px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 2 SEGMENT TABS: BERJAMAAH & MENGAJI */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: '#e2e8f0',
          padding: '3px',
          borderRadius: '14px',
          marginBottom: '12px'
        }}>
          <button
            type="button"
            onClick={() => { setAbsensiSubTab('berjamaah'); setAbsensiStatusFilter('Semua'); }}
            style={{
              border: 'none',
              background: absensiSubTab === 'berjamaah' ? '#ffffff' : 'transparent',
              color: absensiSubTab === 'berjamaah' ? '#0d766e' : '#64748b',
              fontWeight: 800,
              fontSize: '0.8rem',
              padding: '9px 8px',
              borderRadius: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: absensiSubTab === 'berjamaah' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🕌</span>
            <span>Berjamaah</span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              background: absensiSubTab === 'berjamaah' ? '#ccfbf1' : 'rgba(0,0,0,0.06)',
              color: absensiSubTab === 'berjamaah' ? '#0f766e' : '#64748b',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {listBerjamaah.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setAbsensiSubTab('mengaji'); setAbsensiStatusFilter('Semua'); }}
            style={{
              border: 'none',
              background: absensiSubTab === 'mengaji' ? '#ffffff' : 'transparent',
              color: absensiSubTab === 'mengaji' ? '#0284c7' : '#64748b',
              fontWeight: 800,
              fontSize: '0.8rem',
              padding: '9px 8px',
              borderRadius: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: absensiSubTab === 'mengaji' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📖</span>
            <span>Mengaji</span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              background: absensiSubTab === 'mengaji' ? '#e0f2fe' : 'rgba(0,0,0,0.06)',
              color: absensiSubTab === 'mengaji' ? '#0369a1' : '#64748b',
              padding: '1px 6px',
              borderRadius: '10px'
            }}>
              {listMengaji.length}
            </span>
          </button>
        </div>

        {/* FILTER STATUS PILLS */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
          {[
            { id: 'Semua', count: currentList.length, color: '#0d766e' },
            { id: 'Hadir', count: totalHadir, color: '#16a34a' },
            { id: 'Sakit', count: totalSakit, color: '#dc2626' },
            { id: 'Izin', count: totalIzin, color: '#d97706' },
            { id: 'Alfa', count: totalAlfa, color: '#0d9488' }
          ].map(st => {
            const isActive = absensiStatusFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setAbsensiStatusFilter(st.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '10px',
                  border: isActive ? `1.5px solid ${st.color}` : '1px solid #e2e8f0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isActive ? st.color : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease'
                }}
              >
                <span>{st.id}</span>
                <span style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* PRESENSI LIST ITEMS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ffffff', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: '#f1f5f9',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '1.5rem'
              }}>
                {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                {absensiStatusFilter !== 'Semua' 
                  ? `Tidak ada data dengan status "${absensiStatusFilter}"`
                  : absensiSubTab === 'berjamaah'
                    ? 'Belum Ada Riwayat Berjamaah'
                    : 'Belum Ada Riwayat Mengaji'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', maxWidth: '280px', marginInline: 'auto' }}>
                {absensiSubTab === 'berjamaah'
                  ? 'Data scan sidik jari sholat fardhu & tahajud di Masjid Pesantren akan tercatat realtime di sini.'
                  : 'Data presensi halaqah Al-Qur\'an, sorogan kitab kuning & madrasah diniyah akan muncul di sini.'}
              </div>
            </div>
          ) : (
            filteredList.map((row, idx) => {
              const st = (row.status || '').toLowerCase();
              const isHadir = st.includes('hadir') || st.includes('tepat');
              const isSakit = st.includes('sakit');
              const isIzin = st.includes('izin');
              const isTerlambat = st.includes('terlambat') || st.includes('masbuq');

              let borderLeftColor = '#10b981';
              let badgeBg = '#ecfdf5';
              let badgeColor = '#065f46';
              let badgeText = row.status || 'Hadir';

              if (isSakit) {
                borderLeftColor = '#ef4444';
                badgeBg = '#fef2f2';
                badgeColor = '#991b1b';
              } else if (isIzin) {
                borderLeftColor = '#f59e0b';
                badgeBg = '#fffbeb';
                badgeColor = '#92400e';
              } else if (isTerlambat) {
                borderLeftColor = '#f97316';
                badgeBg = '#fff7ed';
                badgeColor = '#9a3412';
              } else if (!isHadir) {
                borderLeftColor = '#0d9488';
                badgeBg = '#f0fdfa';
                badgeColor = '#115e59';
              }

              const formatDate = (tgl) => {
                if (!tgl) return '-';
                try {
                  const d = new Date(tgl);
                  if (isNaN(d.getTime())) return String(tgl).split('T')[0];
                  return d.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                } catch (e) {
                  return String(tgl).split('T')[0];
                }
              };

              return (
                <div
                  key={row.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #f1f5f9',
                    borderLeft: `4px solid ${borderLeftColor}`,
                    padding: '12px 14px',
                    boxShadow: '0 3px 10px -2px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.88rem' }}>
                        {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
                      </span>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {row.nama_sesi || (absensiSubTab === 'berjamaah' ? 'Berjamaah' : 'Mengaji')}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.7rem',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      <span>{formatDate(row.tanggal)}</span>
                      <span>•</span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: '#0369a1',
                        background: '#f0f9ff',
                        padding: '1px 6px',
                        borderRadius: '6px'
                      }}>
                        {row.waktu_scan ? row.waktu_scan.slice(0, 5) + ' WIB' : '04:30 WIB'}
                      </span>
                    </div>

                    {row.keterangan && (
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', fontStyle: 'italic' }}>
                        {row.keterangan}
                      </div>
                    )}
                  </div>

                  <span style={{
                    background: badgeBg,
                    color: badgeColor,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '5px 10px',
                    borderRadius: '12px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    {badgeText}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
