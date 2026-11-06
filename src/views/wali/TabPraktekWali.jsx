import React from 'react';
import { ArrowLeft, HeartHandshake } from 'lucide-react';

const TabPraktekWali = ({ praktek = [], onBack }) => {
  const countLulus = praktek.filter(r => (r.status || '').toLowerCase().includes('lulus')).length;
  const countMengulang = praktek.filter(r => (r.status || '').toLowerCase().includes('ulang')).length;

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
                Ujian Praktek Ibadah
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
            <HeartHandshake size={18} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* HERO STAT CARD PRAKTEK */}
        <div style={{
          background: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
          borderRadius: '20px',
          padding: '16px 16px 14px',
          color: '#ffffff',
          boxShadow: '0 8px 24px -4px rgba(194, 65, 12, 0.35)',
          marginBottom: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#fed7aa',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                EVALUASI KAIFIYAH IBADAH
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {countLulus} Materi Lulus
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                Ujian wudhu, sholat fardhu, & doa harian pondok
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
              🤲
            </div>
          </div>

          {/* 3 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '8px',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4ade80' }}>{countLulus}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Lulus</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fca5a5' }}>{countMengulang}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Mengulang</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fed7aa' }}>{praktek.length}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Total Ujian</div>
            </div>
          </div>
        </div>

        {/* List Praktek */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {praktek.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <HeartHandshake size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Belum Ada Hasil Ujian Praktek</div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Evaluasi wudhu, sholat, dan kaifiyah ibadah santri akan ditampilkan di sini.</div>
            </div>
          ) : (
            praktek.map((row, idx) => {
              const isLulus = (row.status || '').toLowerCase().includes('lulus');
              return (
                <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{row.kategori || row.nama_praktek || 'Praktek Sholat Fardhu'}</span>
                    <span className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                      {isLulus ? 'LULUS' : 'MENGULANG'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                    {row.deskripsi || row.catatan_perbaikan || 'Sesuai kaifiyah dan sunnah yang diajarkan di pondok.'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
                    Penguji: <strong style={{ color: '#0284c7' }}>{row.nama_penguji || 'Ust. Penguji'}</strong> • {row.tanggal_ujian ? String(row.tanggal_ujian).split('T')[0] : '-'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TabPraktekWali;
