import React from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Shield, 
  DoorOpen, 
  Clock, 
  CheckCircle, 
  Check, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

export default function TabPerizinanWali({
  perizinan = [],
  santri = {},
  onBack,
  onOpenAjukanIzin
}) {
  const countMenunggu = perizinan.filter(p => (p.status || '').toLowerCase().includes('menunggu')).length;
  const countDisetujui = perizinan.filter(p => (p.status || '').toLowerCase().includes('disetujui')).length;
  const countAktif = perizinan.filter(p => (p.status || '').toLowerCase().includes('aktif')).length;
  const isKeluar = countAktif > 0;

  const formatDateStr = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      return dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(d).split('T')[0];
    }
  };

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
                Perizinan Santri
              </h2>
            </div>
          </div>

          <button
            onClick={onOpenAjukanIzin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ffffff',
              color: '#047857',
              border: 'none',
              padding: '6px 11px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Plus size={13} strokeWidth={2.8} /> Ajukan Izin
          </button>
        </div>
      </div>

      <div style={{ padding: '0 12px' }}>
        {/* HERO STAT CARD PERIZINAN - COMPACT */}
        <div style={{
          background: isKeluar 
            ? 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)' 
            : 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
          borderRadius: '16px',
          padding: '12px 14px 10px',
          color: '#ffffff',
          boxShadow: isKeluar 
            ? '0 6px 18px -4px rgba(124, 45, 18, 0.35)' 
            : '0 6px 18px -4px rgba(67, 56, 202, 0.35)',
          marginBottom: '10px',
          transition: 'all 0.25s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                color: isKeluar ? '#fed7aa' : '#c7d2fe',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}>
                STATUS KEBERADAAN SANTRI
              </div>
              <div style={{ fontSize: '1.18rem', fontWeight: 900, color: '#ffffff', marginTop: '1px', letterSpacing: '-0.2px' }}>
                {isKeluar ? 'Sedang Izin Keluar' : 'Di Lingkungan Pesantren'}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>
                {isKeluar ? 'Santri sedang berada di luar lingkungan pondok' : 'Santri berada di asrama & mengikuti taklim pondok'}
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
              🚪
            </div>
          </div>

          {/* 4 Mini Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '6px',
            borderRadius: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fbbf24' }}>{countMenunggu}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Menunggu</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#60a5fa' }}>{countDisetujui}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Disetujui</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#c084fc' }}>{countAktif}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Aktif Izin</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#4ade80' }}>{perizinan.length}</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Total Izin</div>
            </div>
          </div>
        </div>

        {/* Info Banner - Compact */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '8px 10px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <Shield size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.66rem', color: '#166534', lineHeight: 1.35 }}>
            <strong>Prosedur:</strong> Izin wali santri diverifikasi Dewan Pengasuh. Santri wajib lapor ke Pos Keamanan gerbang saat keluar & kembali ke pondok.
          </div>
        </div>

        {/* List Perizinan - Compact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {perizinan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 14px', background: '#ffffff', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
              <DoorOpen size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Belum Ada Riwayat Izin</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '3px', maxWidth: '280px', marginInline: 'auto' }}>
                Santri saat ini berada di lingkungan pesantren. Klik tombol <strong>+ Ajukan Izin</strong> jika ingin mengajukan izin pulang atau berobat.
              </div>
              <button
                onClick={onOpenAjukanIzin}
                style={{
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '9px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Ajukan Izin Sekarang
              </button>
            </div>
          ) : (
            perizinan.map((row, idx) => {
              const st = row.status || 'Menunggu Persetujuan';
              let badgeBg = '#f1f5f9';
              let badgeColor = '#475569';
              let badgeBorder = '#e2e8f0';
              let badgeIcon = <Clock size={11} />;

              if (st === 'Menunggu Persetujuan') {
                badgeBg = '#fffbeb';
                badgeColor = '#b45309';
                badgeBorder = '#fde68a';
                badgeIcon = <Clock size={11} />;
              } else if (st === 'Disetujui Pengasuh') {
                badgeBg = '#eff6ff';
                badgeColor = '#1d4ed8';
                badgeBorder = '#bfdbfe';
                badgeIcon = <CheckCircle size={11} />;
              } else if (st === 'Aktif Keluar') {
                badgeBg = '#f5f3ff';
                badgeColor = '#6d28d9';
                badgeBorder = '#ddd6fe';
                badgeIcon = <DoorOpen size={11} />;
              } else if (st === 'Kembali Tepat Waktu') {
                badgeBg = '#f0fdf4';
                badgeColor = '#15803d';
                badgeBorder = '#bbf7d0';
                badgeIcon = <Check size={11} />;
              } else if (st === 'Terlambat Kembali') {
                badgeBg = '#fef2f2';
                badgeColor = '#b91c1c';
                badgeBorder = '#fecaca';
                badgeIcon = <AlertTriangle size={11} />;
              } else if (st === 'Ditolak') {
                badgeBg = '#fef2f2';
                badgeColor = '#991b1b';
                badgeBorder = '#fecaca';
                badgeIcon = <XCircle size={11} />;
              }

              return (
                <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '13px', padding: '11px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0284c7' }}>
                        {row.kode_izin || `IZN-${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', marginTop: '1px' }}>
                        {row.jenis_izin || 'Izin Pulang'}
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                      padding: '3px 8px',
                      borderRadius: '16px',
                      fontSize: '0.64rem',
                      fontWeight: 700
                    }}>
                      {badgeIcon}
                      {st}
                    </span>
                  </div>

                  {/* Keperluan */}
                  <div style={{ fontSize: '0.72rem', color: '#1e293b', marginBottom: '8px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #0284c7' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1px' }}>Alasan / Keperluan:</div>
                    {row.keperluan || 'Keperluan keluarga'}
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '6px 8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Rencana Keluar:</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                        {formatDateStr(row.tgl_keluar_rencana)}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '6px 8px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Rencana Kembali:</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
                        {formatDateStr(row.tgl_kembali_rencana)}
                      </div>
                    </div>
                  </div>

                  {/* Penjemput & Petugas */}
                  <div style={{ fontSize: '0.64rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '5px', borderTop: '1px solid #f1f5f9' }}>
                    <div>Penjemput: <strong style={{ color: '#334155' }}>{row.nama_penjemput_mahrom || santri?.nama_wali || 'Orang Tua / Wali'}</strong> ({row.hubungan_mahrom || 'Mahrom'})</div>
                    {row.no_hp_penjemput && (
                      <div>Kontak: <strong style={{ color: '#334155' }}>{row.no_hp_penjemput}</strong></div>
                    )}
                    {row.disetujui_oleh && (
                      <div>Verifikator: <strong style={{ color: '#0284c7' }}>{row.disetujui_oleh}</strong></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

