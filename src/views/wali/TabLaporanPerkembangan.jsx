import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  RotateCw, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Calendar, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  ArrowLeft,
  HeartHandshake,
  Clock,
  Printer,
  AlertTriangle,
  XCircle,
  HelpCircle
} from 'lucide-react';

export default function TabLaporanPerkembangan({ santriId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [evaluasiIkhwanList, setEvaluasiIkhwanList] = useState([]);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const url = santriId ? `/api/laporan-perkembangan/wali?santri_id=${santriId}` : '/api/laporan-perkembangan/wali';
      const res = await axios.get(url);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan perkembangan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluasiIkhwan = async () => {
    try {
      const url = santriId ? `/api/perkembangan-ikhwan/rekap?santri_id=${santriId}` : '/api/perkembangan-ikhwan/rekap';
      const res = await axios.get(url);
      if (res.data?.success) {
        setEvaluasiIkhwanList(res.data.data || []);
      }
    } catch (e) {
      console.warn('Gagal memuat evaluasi ikhwan:', e.message);
    }
  };

  useEffect(() => {
    fetchLaporan();
    fetchEvaluasiIkhwan();
  }, [santriId]);

  const laporanList = data?.laporanList || [];
  const laporanAktif = laporanList[selectedIdx] || null;
  const metrik = data?.metrikRingkas || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      
      {/* Top Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 24px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && (
              <button 
                onClick={onBack}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Laporan Perkembangan Santri
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                Santri: {santri.nama_santri || 'Santri'} (NISN: {santri.nisn || santri.nis || '-'})
              </div>
            </div>
          </div>

          <button 
            onClick={fetchLaporan}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* 4 Quick Stat Pills */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.16)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
              {metrik.tahfidz?.juz_tertinggi ?? 0}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#e0f2fe' }}>Juz Mutqin</div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ade80' }}>
              {metrik.absensi?.hadir ?? 0}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#e0f2fe' }}>Hadir Sholat</div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fde047' }}>
              {metrik.praktek?.lulus ?? 0}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#e0f2fe' }}>Praktek Lulus</div>
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
              {metrik.pelanggaran?.total_poin ?? 0}
            </div>
            <div style={{ fontSize: '0.66rem', color: '#e0f2fe' }}>Poin Ta'zir</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Periode Selector Dropdown if multiple reports exist */}
        {laporanList.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {laporanList.map((lap, idx) => (
              <button
                key={lap.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  border: selectedIdx === idx ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: selectedIdx === idx ? '#e0f2fe' : '#ffffff',
                  color: selectedIdx === idx ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {lap.periode}
              </button>
            ))}
          </div>
        )}

        {laporanAktif ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* CARD 1: NILAI AKADEMIK & DINIYAH */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#0284c7" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    Capaian Akademik & Kitab Kuning
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {laporanAktif.periode}
                </span>
              </div>

              {/* Grid Nilai Mata Pelajaran */}
              {laporanAktif.nilai_akademik_parsed ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {Object.entries(laporanAktif.nilai_akademik_parsed).map(([mapel, nilai]) => (
                    <div key={mapel} style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{mapel}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: parseInt(nilai) >= 85 ? '#059669' : '#0284c7', marginTop: '2px' }}>
                        {nilai}
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: parseInt(nilai) >= 85 ? '#166534' : '#0369a1' }}>
                        {parseInt(nilai) >= 90 ? 'MUMTAZ (A)' : (parseInt(nilai) >= 80 ? 'JAYYID JIDDAN (B+)' : 'JAYYID (B)')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {laporanAktif.catatan_akademik && (
                <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #bae6fd', fontSize: '0.76rem', color: '#0369a1', lineHeight: 1.4 }}>
                  <strong>Catatan Pembelajaran:</strong> {laporanAktif.catatan_akademik}
                </div>
              )}
            </div>

            {/* CARD 2: PERKEMBANGAN HAFALAN & TAHFIDZ */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Sparkles size={18} color="#8b5cf6" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Perkembangan Hafalan Al-Qur'an
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                {laporanAktif.catatan_hafalan || 'Santri rutin menyetorkan ziyadah dan muroja\'ah setiap ba\'da Shubuh dan Maghrib dengan kelancaran tajwid yang baik.'}
              </div>
            </div>

            {/* CARD 3: KEDISIPLINAN, PERILAKU & IBADAH */}
            <div style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '16px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Kedisiplinan & Perilaku Santri
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, marginBottom: '10px' }}>
                {laporanAktif.catatan_perilaku || 'Ananda senantiasa menjaga adab terhadap asatidz, rukun dengan rekan sekobong, dan disiplin dalam mematuhi tata tertib pesantren.'}
              </div>

              {laporanAktif.catatan_ibadah && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  <strong>Aktivitas Ibadah:</strong> {laporanAktif.catatan_ibadah}
                </div>
              )}
            </div>

            {/* CARD 4: PESAN & CATATAN KHUSUS PENGASUH / USTADZ */}
            <div style={{
              background: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)',
              borderRadius: '18px',
              border: '1px solid #fde047',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <HeartHandshake size={18} color="#b45309" />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400e' }}>
                  Nasihat & Pesan Khusus untuk Orang Tua
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.6, margin: '0 0 12px' }}>
                "{laporanAktif.catatan_ustadz}"
              </p>

              <div style={{ borderTop: '1px solid #fef08a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400e' }}>
                    {laporanAktif.nama_penulis || 'Ust. Hamdan S.Th.I'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#a16207' }}>
                    Musyrif Asrama & Pengasuhan
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: '#a16207' }}>
                    Diterbitkan: {laporanAktif.tanggal_laporan ? new Date(laporanAktif.tanggal_laporan).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 5: EVALUASI PERKEMBANGAN & PEMBINAAN KHUSUS IKHWAN */}
            {evaluasiIkhwanList.length > 0 && (
              <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color="#059669" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Catatan Evaluasi & Pembinaan Santri
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    {evaluasiIkhwanList.length} Aspek Dinilai
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evaluasiIkhwanList.map((ev) => {
                    const isLulus = ev.status === 'Lulus';
                    return (
                      <div key={ev.id} style={{
                        background: isLulus ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${isLulus ? '#bbf7d0' : '#fde68a'}`,
                        borderRadius: '14px',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1rem' }}>{ev.kategori_icon || '📋'}</span>
                            <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{ev.kategori_nama}</strong>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '20px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: isLulus ? '#dcfce7' : '#fee2e2',
                            color: isLulus ? '#15803d' : '#b91c1c'
                          }}>
                            {isLulus ? '✓ Lulus / Tuntas' : '⚠️ Perlu Pembinaan'}
                          </span>
                        </div>

                        {!isLulus && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', marginTop: '6px' }}>
                            {ev.permasalahan_list && ev.permasalahan_list.length > 0 && (
                              <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                                <strong style={{ color: '#991b1b', display: 'block', marginBottom: '2px' }}>Permasalahan Teridentifikasi:</strong>
                                <ul style={{ margin: 0, paddingLeft: '16px', color: '#7f1d1d' }}>
                                  {ev.permasalahan_list.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>
                            )}

                            {ev.penyebab_list && ev.penyebab_list.length > 0 && (
                              <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>Faktor Penyebab:</strong>
                                <ul style={{ margin: 0, paddingLeft: '16px', color: '#78350f' }}>
                                  {ev.penyebab_list.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            )}

                            {ev.tindakan_list && ev.tindakan_list.length > 0 && (
                              <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                                <strong style={{ color: '#065f46', display: 'block', marginBottom: '2px' }}>Tindakan / Solusi Pengasuh:</strong>
                                <ul style={{ margin: 0, paddingLeft: '16px', color: '#064e3b' }}>
                                  {ev.tindakan_list.map((t, i) => <li key={i}>{t}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {ev.catatan_khusus && (
                          <div style={{ marginTop: '6px', fontSize: '0.72rem', fontStyle: 'italic', color: '#64748b' }}>
                            Catatan: {ev.catatan_khusus}
                          </div>
                        )}
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                          Tanggal: {ev.tanggal ? new Date(ev.tanggal).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => window.print()}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Printer size={16} /> Cetak / Unduh Rapor Santri
            </button>
          </div>
        ) : (
          <div>
            {evaluasiIkhwanList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#059669" />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                        Catatan Evaluasi & Pembinaan Santri
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {evaluasiIkhwanList.length} Aspek Dinilai
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {evaluasiIkhwanList.map((ev) => {
                      const isLulus = ev.status === 'Lulus';
                      return (
                        <div key={ev.id} style={{
                          background: isLulus ? '#f0fdf4' : '#fffbeb',
                          border: `1px solid ${isLulus ? '#bbf7d0' : '#fde68a'}`,
                          borderRadius: '14px',
                          padding: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '1rem' }}>{ev.kategori_icon || '📋'}</span>
                              <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{ev.kategori_nama}</strong>
                            </div>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '20px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              background: isLulus ? '#dcfce7' : '#fee2e2',
                              color: isLulus ? '#15803d' : '#b91c1c'
                            }}>
                              {isLulus ? '✓ Lulus / Tuntas' : '⚠️ Perlu Pembinaan'}
                            </span>
                          </div>

                          {!isLulus && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', marginTop: '6px' }}>
                              {ev.permasalahan_list && ev.permasalahan_list.length > 0 && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                                  <strong style={{ color: '#991b1b', display: 'block', marginBottom: '2px' }}>Permasalahan Teridentifikasi:</strong>
                                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#7f1d1d' }}>
                                    {ev.permasalahan_list.map((p, i) => <li key={i}>{p}</li>)}
                                  </ul>
                                </div>
                              )}

                              {ev.penyebab_list && ev.penyebab_list.length > 0 && (
                                <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                  <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>Faktor Penyebab:</strong>
                                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#78350f' }}>
                                    {ev.penyebab_list.map((c, i) => <li key={i}>{c}</li>)}
                                  </ul>
                                </div>
                              )}

                              {ev.tindakan_list && ev.tindakan_list.length > 0 && (
                                <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '8px 10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                                  <strong style={{ color: '#065f46', display: 'block', marginBottom: '2px' }}>Tindakan / Solusi Pengasuh:</strong>
                                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#064e3b' }}>
                                    {ev.tindakan_list.map((t, i) => <li key={i}>{t}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {ev.catatan_khusus && (
                            <div style={{ marginTop: '6px', fontSize: '0.72rem', fontStyle: 'italic', color: '#64748b' }}>
                              Catatan: {ev.catatan_khusus}
                            </div>
                          )}
                          <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
                            Tanggal: {ev.tanggal ? new Date(ev.tanggal).toLocaleDateString('id-ID') : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px', background: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <FileText size={36} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>Belum Ada Laporan Diterbitkan</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Laporan perkembangan berkala akan diterbitkan oleh asatidz pengasuh di sini.
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

