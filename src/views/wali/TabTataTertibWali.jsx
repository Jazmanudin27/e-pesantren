import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle } from 'lucide-react';

const TabTataTertibWali = ({ pelanggaran = [], onBack }) => {
  const countRingan = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'ringan').length;
  const countSedang = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'sedang').length;
  const countBerat = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'berat').length;
  const isClean = pelanggaran.length === 0;

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
                Catatan Kedisiplinan &amp; Tata Tertib
              </h2>
            </div>
          </div>

          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <ShieldAlert size={15} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        {/* HERO STAT CARD KEDISIPLINAN - COMPACT */}
        <div style={{
          background: isClean 
            ? 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' 
            : 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
          borderRadius: '16px',
          padding: '12px 14px 10px',
          color: '#ffffff',
          boxShadow: isClean 
            ? '0 6px 18px -4px rgba(5, 150, 105, 0.35)' 
            : '0 6px 18px -4px rgba(225, 29, 72, 0.35)',
          marginBottom: '10px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                color: isClean ? '#a7f3d0' : '#fecdd3',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}>
                STATUS KEDISIPLINAN SANTRI
              </div>
              <div style={{ fontSize: '1.18rem', fontWeight: 900, color: '#ffffff', marginTop: '1px', letterSpacing: '-0.2px' }}>
                {isClean ? 'Catatan Disiplin Bersih' : `${pelanggaran.length} Catatan Ta'zir`}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>
                {isClean ? 'Alhamdulillah, santri tertib & taat aturan pondok' : 'Bimbingan akhlak & kepatuhan tata tertib pesantren'}
              </div>
            </div>

            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.16)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.2rem'
            }}>
              {isClean ? '🛡️' : '⚠️'}
            </div>
          </div>

          {/* 3 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '6px',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: countRingan > 0 ? '#fde047' : '#ffffff' }}>{countRingan}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Ringan</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: countSedang > 0 ? '#fdba74' : '#ffffff' }}>{countSedang}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sedang</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: countBerat > 0 ? '#fca5a5' : '#4ade80' }}>{countBerat}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Berat</div>
            </div>
          </div>
        </div>

        {/* List Pelanggaran */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pelanggaran.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 14px', background: '#ecfdf5', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
              <CheckCircle size={32} color="#059669" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#065f46' }}>Alhamdulillah, Catatan Bersih!</div>
              <div style={{ fontSize: '0.68rem', color: '#047857', marginTop: '2px' }}>Santri selalu tertib dan disiplin mengikuti tata tertib pesantren.</div>
            </div>
          ) : (
            pelanggaran.map((row, idx) => (
              <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '12px', padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: row.kategori === 'Berat' ? '#fee2e2' : '#fef3c7',
                    color: row.kategori === 'Berat' ? '#991b1b' : '#92400e'
                  }}>
                    Kategori: {row.kategori || 'Ringan'}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#64748b' }}>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#1e293b', fontWeight: 700, marginBottom: '3px' }}>
                  Bentuk Ta'zir Mendidik:
                </div>
                <div style={{ fontSize: '0.7rem', color: '#475569', background: '#fffbeb', padding: '6px 8px', borderRadius: '7px', marginBottom: '6px' }}>
                  {row.bentuk_tazir || 'Membaca Al-Qur\'an di Masjid pondok'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: '#64748b' }}>
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

