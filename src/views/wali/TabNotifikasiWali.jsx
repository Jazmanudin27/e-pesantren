import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';

const TabNotifikasiWali = ({ rawSantriName = '', displayNisn = '', onBack }) => {
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
                Pemberitahuan Pesantren
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                Santri: {rawSantriName} (NISN: {displayNisn})
              </div>
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
            <Bell size={18} />
          </div>
        </div>
      </div>

      {/* Notifikasi List */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { judul: 'Presensi Subuh Berjamaah Terverifikasi', pesan: 'Alhamdulillah, presensi shalat Subuh berjamaah santri telah diverifikasi oleh musyrif kobong.', waktu: 'Hari ini • 05:15 WIB' },
          { judul: 'Maklumat Izin Kepulangan Santri', pesan: 'Bagi santri yang berencana izin kepulangan akhir bulan, mohon konfirmasi dan verifikasi melalui pembina asrama.', waktu: 'Kemarin • 14:00 WIB' },
          { judul: 'Capaian Ziyadah Tahfidz Qur\'an', pesan: 'Alhamdulillah, ananda berhasil menyelesaikan setoran hafalan Al-Qur\'an dengan predikat Mumtaz.', waktu: '2 hari lalu' }
        ].map((n, idx) => (
          <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{n.judul}</span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{n.waktu}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
              {n.pesan}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabNotifikasiWali;
