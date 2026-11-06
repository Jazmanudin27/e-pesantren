import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle } from 'lucide-react';

const TabTataTertibWali = ({ pelanggaran = [], onBack }) => {
  const countRingan = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'ringan').length;
  const countSedang = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'sedang').length;
  const countBerat = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'berat').length;
  const isClean = pelanggaran.length === 0;

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
                Catatan Kedisiplinan & Tata Tertib
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
            <ShieldAlert size={18} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* HERO STAT CARD KEDISIPLINAN */}
        <div style={{
          background: isClean 
            ? 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' 
            : 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
          borderRadius: '20px',
          padding: '16px 16px 14px',
          color: '#ffffff',
          boxShadow: isClean 
            ? '0 8px 24px -4px rgba(5, 150, 105, 0.35)' 
            : '0 8px 24px -4px rgba(225, 29, 72, 0.35)',
          marginBottom: '14px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isClean ? '#a7f3d0' : '#fecdd3',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                STATUS KEDISIPLINAN SANTRI
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {isClean ? 'Catatan Disiplin Bersih' : `${pelanggaran.length} Catatan Ta'zir`}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                {isClean ? 'Alhamdulillah, santri tertib & taat aturan pondok' : 'Bimbingan akhlak & kepatuhan tata tertib pesantren'}
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
              {isClean ? '🛡️' : '⚠️'}
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
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countRingan > 0 ? '#fde047' : '#ffffff' }}>{countRingan}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Ringan</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countSedang > 0 ? '#fdba74' : '#ffffff' }}>{countSedang}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sedang</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countBerat > 0 ? '#fca5a5' : '#4ade80' }}>{countBerat}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Berat</div>
            </div>
          </div>
        </div>

        {/* List Pelanggaran */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pelanggaran.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ecfdf5', borderRadius: '18px', border: '1px solid #a7f3d0' }}>
              <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#065f46' }}>Alhamdulillah, Catatan Bersih!</div>
              <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '4px' }}>Santri selalu tertib dan disiplin mengikuti tata tertib pesantren.</div>
            </div>
          ) : (
            pelanggaran.map((row, idx) => (
              <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge ${row.kategori === 'Berat' ? 'badge-danger' : 'badge-warning'}`}>
                    Kategori: {row.kategori || 'Ringan'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, marginBottom: '4px' }}>
                  Bentuk Ta'zir Mendidik:
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569', background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                  {row.bentuk_tazir || 'Membaca Al-Qur\'an di Masjid pondok'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                  <span>Status: <strong style={{ color: '#059669' }}>{row.status_tazir || 'Selesai Ta\'zir'}</strong></span>
                  <span>Musyrif: {row.musyrif_pencatat || 'Musyrif Keamanan'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TabTataTertibWali;

