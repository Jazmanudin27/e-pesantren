import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Sparkles, 
  Search, 
  X, 
  User, 
  Calendar 
} from 'lucide-react';

export default function TabTahfidzWali({ santri = {}, tahfidz = [], rawSantriName = 'Santri', displayNisn = '-', onBack }) {
  const [tahfidzFilter, setTahfidzFilter] = useState('Semua'); // 'Semua' | 'Ziyadah' | 'Muroja\'ah'
  const [tahfidzSearch, setTahfidzSearch] = useState('');

  const totalJuz = Number(santri.capaian_hafalan_juz || 0);
  const progressPercent = Math.min(100, Math.round((totalJuz / 30) * 100));
  const countZiyadah = tahfidz.filter(t => (t.jenis_setoran || '').toLowerCase().includes('ziyadah')).length;
  const countMurojaah = tahfidz.filter(t => (t.jenis_setoran || '').toLowerCase().includes('muroja') || (t.jenis_setoran || '').toLowerCase().includes('muraja')).length;

  const filteredTahfidz = tahfidz.filter(row => {
    const st = (row.jenis_setoran || '').toLowerCase();
    if (tahfidzFilter === 'Ziyadah' && !st.includes('ziyadah')) return false;
    if (tahfidzFilter === "Muroja'ah" && (!st.includes('muroja') && !st.includes('muraja'))) return false;

    if (tahfidzSearch.trim()) {
      const q = tahfidzSearch.toLowerCase();
      const surat = `${row.surat_mulai || ''} ${row.surat_selesai || ''}`.toLowerCase();
      const penyimak = (row.nama_penyimak || '').toLowerCase();
      const catatan = (row.catatan || '').toLowerCase();
      const juzStr = `juz ${row.juz || ''}`.toLowerCase();
      if (!surat.includes(q) && !penyimak.includes(q) && !catatan.includes(q) && !juzStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

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
                Tahfidz & Muroja'ah Al-Qur'an
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                Santri: {rawSantriName} (NISN: {displayNisn})
              </div>
            </div>
          </div>

          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <BookOpen size={18} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* GRAND HERO CARD: ISLAMIC LUXURY INDIGO GRADIENT */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
          borderRadius: '22px',
          padding: '18px 18px 16px',
          color: '#ffffff',
          boxShadow: '0 12px 28px -4px rgba(49, 46, 129, 0.38)',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          {/* Subtle Background Glow Circle */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, rgba(251, 191, 36, 0) 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(251, 191, 36, 0.18)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#fef08a',
                padding: '3px 9px',
                borderRadius: '999px',
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                <Sparkles size={11} color="#fef08a" />
                <span>Program Tahfidz Mukim</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff', lineHeight: 1.1 }}>
                  {totalJuz}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fef08a' }}>
                  / 30 Juz
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: '#c7d2fe', marginTop: '4px', fontWeight: 600 }}>
                {totalJuz >= 30 ? 'Alhamdulillah Khatam 30 Juz Al-Qur\'an' : `${30 - totalJuz} Juz menuju Khatam 30 Juz`}
              </div>
            </div>

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1.5px solid rgba(251, 191, 36, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fef08a',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '1.4rem' }}>📖</span>
              <span style={{ fontSize: '0.52rem', fontWeight: 900, marginTop: '1px', letterSpacing: '0.02em', color: '#ffffff' }}>MUTQIN</span>
            </div>
          </div>

          {/* 30 JUZ PROGRESS BAR */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'rgba(255,255,255,0.85)', marginBottom: '5px', fontWeight: 700 }}>
              <span>Progres Pencapaian</span>
              <span style={{ color: '#fef08a', fontWeight: 800 }}>{progressPercent}% Selesai</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              borderRadius: '999px',
              background: 'rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              padding: '1.5px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* 3 MINI GLASS COUNTERS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '8px',
            borderRadius: '14px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fef08a' }}>{tahfidz.length}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Total Setoran</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#4ade80' }}>{countZiyadah}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Ziyadah Baru</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#60a5fa' }}>{countMurojaah}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Muroja'ah</div>
            </div>
          </div>
        </div>

        {/* SEARCH BOX TAHFIDZ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '8px 12px',
          border: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <Search size={16} color="#6366f1" />
          <input
            type="text"
            placeholder="Cari surat, juz, atau ustadz penyimak..."
            value={tahfidzSearch}
            onChange={(e) => setTahfidzSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#0f172a',
              width: '100%',
              background: 'transparent'
            }}
          />
          {tahfidzSearch && (
            <button
              type="button"
              onClick={() => setTahfidzSearch('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* FILTER SEGMENT PILLS */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '14px' }}>
          {[
            { id: 'Semua', count: tahfidz.length, color: '#4338ca' },
            { id: 'Ziyadah', count: countZiyadah, color: '#059669' },
            { id: "Muroja'ah", count: countMurojaah, color: '#0284c7' }
          ].map(tab => {
            const active = tahfidzFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTahfidzFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: active ? `1.5px solid ${tab.color}` : '1px solid #e2e8f0',
                  background: active ? tab.color : '#ffffff',
                  color: active ? '#ffffff' : '#64748b',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? '0 3px 8px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.id}</span>
                <span style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: active ? '#ffffff' : '#64748b'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* LIST RIWAYAT SETORAN TAHFIDZ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTahfidz.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ffffff', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '1.5rem'
              }}>
                📖
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                {tahfidzSearch || tahfidzFilter !== 'Semua' ? 'Tidak Ada Setoran Ditemukan' : 'Belum Ada Riwayat Setoran'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', maxWidth: '280px', marginInline: 'auto' }}>
                Setoran hafalan baru (Ziyadah) dan pengulangan (Muroja'ah) yang disimak oleh asatidz pembina akan tampil lengkap di sini.
              </div>
            </div>
          ) : (
            filteredTahfidz.map((row, idx) => {
              const isZiyadah = (row.jenis_setoran || '').toLowerCase().includes('ziyadah');
              const predikat = row.predikat || (row.nilai_akhir >= 90 ? 'Mumtaz' : row.nilai_akhir >= 80 ? 'Jayyid Jiddan' : 'Jayyid');
              const nilai = row.nilai_akhir || row.nilai_kelancaran || 95;

              return (
                <div
                  key={row.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    borderLeft: isZiyadah ? '4px solid #10b981' : '4px solid #3b82f6',
                    padding: '14px 14px 12px',
                    boxShadow: '0 3px 12px -2px rgba(15, 23, 42, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  {/* TOP CARD ROW: JUZ & JENIS + PREDIKAT */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: isZiyadah ? '#ecfdf5' : '#eff6ff',
                        color: isZiyadah ? '#059669' : '#1d4ed8',
                        border: isZiyadah ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>📖</span>
                        <span>Juz {row.juz || 1}</span>
                      </span>

                      <span style={{
                        background: isZiyadah ? '#f0fdf4' : '#f0f9ff',
                        color: isZiyadah ? '#166534' : '#0369a1',
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '8px'
                      }}>
                        {isZiyadah ? 'Ziyadah (Baru)' : 'Muroja\'ah'}
                      </span>
                    </div>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#fefce8',
                      border: '1px solid #fef08a',
                      color: '#854d0e',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}>
                      <span>⭐</span>
                      <span>{predikat} ({nilai})</span>
                    </div>
                  </div>

                  {/* MIDDLE CARD ROW: SURAT & AYAT RANGE */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: '1px solid #f1f5f9'
                  }}>
                    <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Materi Hafalan / Surat Disetor:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                        {row.surat_mulai || 'Surat Al-Baqarah'}
                      </span>
                      {row.ayat_mulai && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '6px' }}>
                          Ayat {row.ayat_mulai}
                        </span>
                      )}
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>&rarr;</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                        {row.surat_selesai || row.surat_mulai || '-'}
                      </span>
                      {row.ayat_selesai && (
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '6px' }}>
                          Ayat {row.ayat_selesai}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* PENYIMAK & TANGGAL */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={13} color="#6366f1" />
                      <span>Penyimak: <strong style={{ color: '#334155' }}>{row.nama_penyimak || 'Ust. Pembina Tahfidz'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} color="#64748b" />
                      <span>{formatDate(row.tanggal)}</span>
                    </div>
                  </div>

                  {/* ASATIDZ NOTE / CATATAN */}
                  {row.catatan && (
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#475569',
                      lineHeight: 1.35,
                      fontStyle: 'italic',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px'
                    }}>
                      <span>💬</span>
                      <div>"{row.catatan}"</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
