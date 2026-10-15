import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Calendar, 
  Search, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DoorOpen, 
  HeartPulse, 
  ChevronDown, 
  Filter, 
  FileText,
  RotateCw
} from 'lucide-react';

export default function MobileLaporanPresensi() {
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const normalizeDateStr = (raw) => {
    if (!raw) return '';
    if (typeof raw === 'string') {
      const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    return '';
  };

  const simplifyStatus = (statusStr) => {
    if (!statusStr) return 'Hadir';
    const s = String(statusStr).toLowerCase();
    if (s.includes('hadir') || s.includes('tepat') || s.includes('terlambat')) return 'Hadir';
    if (s.includes('sakit')) return 'Sakit';
    if (s.includes('izin')) return 'Izin';
    if (s.includes('alpa') || s.includes('alfa') || s.includes('tanpa') || s.includes('teledor')) return 'Alfa';
    return statusStr;
  };

  const [filterTanggal, setFilterTanggal] = useState(getTodayDateStr);
  const [selectedStatusTab, setSelectedStatusTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [presensiLogs, setPresensiLogs] = useState([]);
  const [perizinanList, setPerizinanList] = useState([]);
  const [santriList, setSantriList] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAbs, resIzin, resSantri] = await Promise.all([
        axios.get('/api/absensi/fingerprint').catch(() => ({ data: { data: [] } })),
        axios.get('/api/perizinan').catch(() => ({ data: { data: [] } })),
        axios.get('/api/santri').catch(() => ({ data: { data: [] } }))
      ]);

      if (resAbs?.data?.data) {
        setPresensiLogs(resAbs.data.data);
      }
      if (resIzin?.data?.data) {
        setPerizinanList(resIzin.data.data);
      }
      if (resSantri?.data?.data) {
        setSantriList(resSantri.data.data);
      }
    } catch (e) {
      console.warn('Gagal load data laporan presensi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter santri yang sedang aktif izin / sakit pada tanggal yang dipilih
  const activePerizinanOnDate = perizinanList.filter(sp => {
    const statusActive = ['Aktif Keluar', 'Disetujui Pengasuh', 'Terlambat Kembali'].includes(sp.status);
    if (!statusActive) return false;

    const tglMulai = normalizeDateStr(sp.tgl_keluar_rencana || sp.tgl_keluar_aktual);
    const tglSelesai = normalizeDateStr(sp.tgl_kembali_rencana || sp.tgl_kembali_aktual);

    if (tglMulai && filterTanggal < tglMulai) return false;
    if (tglSelesai && filterTanggal > tglSelesai && sp.status !== 'Terlambat Kembali') return false;

    return true;
  });

  // Gabungkan logs hari ini dengan active perizinan jika belum tercatat
  const logsForSelectedDate = (() => {
    const list = presensiLogs.filter(l => normalizeDateStr(l.tanggal) === filterTanggal);
    
    // Pastikan santri yang izin/sakit pada tanggal ini ada di list
    activePerizinanOnDate.forEach(sp => {
      const isSakit = (sp.jenis_izin || '').toLowerCase().includes('sakit') ||
                      (sp.jenis_izin || '').toLowerCase().includes('berobat') ||
                      (sp.keperluan || '').toLowerCase().includes('sakit');
      const st = isSakit ? 'Sakit' : 'Izin';

      const exists = list.some(l => l.santri_id === sp.santri_id);
      if (!exists) {
        list.push({
          id: `izin-${sp.id}`,
          santri_id: sp.santri_id,
          nama_santri: sp.nama_santri,
          nis: sp.nis,
          nama_asrama: sp.nama_asrama,
          nama_kamar: sp.nama_kamar,
          tanggal: filterTanggal,
          waktu_scan: '00:00:00',
          status_kehadiran: st,
          status: st,
          metode_scan: 'Perizinan',
          keterangan: `Perizinan ${sp.jenis_izin} (${sp.keperluan || 'Disetujui'})`,
          nama_sesi: 'Semua Kegiatan (Perizinan Pulang/Sakit)',
          is_perizinan_auto: true
        });
      }
    });

    return list;
  })();

  // Hitung KPI
  const countHadir = logsForSelectedDate.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Hadir').length;
  const countSakit = logsForSelectedDate.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Sakit').length;
  const countIzin = logsForSelectedDate.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Izin').length;
  const countAlfa = logsForSelectedDate.filter(l => simplifyStatus(l.status_kehadiran || l.status) === 'Alfa').length;
  const totalTercatat = logsForSelectedDate.length;

  // Filter daftar santri untuk list
  const filteredList = logsForSelectedDate.filter(item => {
    const st = simplifyStatus(item.status_kehadiran || item.status);
    if (selectedStatusTab !== 'Semua' && st.toLowerCase() !== selectedStatusTab.toLowerCase()) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nama = (item.nama_santri || '').toLowerCase();
    const nis = (item.nis || '').toLowerCase();
    const sesi = (item.nama_sesi || item.kegiatan || '').toLowerCase();
    const asrama = (item.nama_asrama || '').toLowerCase();
    return nama.includes(q) || nis.includes(q) || sesi.includes(q) || asrama.includes(q);
  });

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '14px 14px 40px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header Card Rekap Presensi */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #1e40af 100%)',
        borderRadius: '24px',
        padding: '18px 16px',
        color: '#ffffff',
        marginBottom: '14px',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart3 size={18} color="#ffffff" />
            </span>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#bae6fd' }}>
              REKAP PRESENSI HARIAN
            </span>
          </div>
          <button
            onClick={fetchData}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 8px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            Segarkan
          </button>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0' }}>
          Laporan Presensi Santri
        </h2>
        <p style={{ margin: 0, fontSize: '0.76rem', color: '#e0f2fe', lineHeight: 1.4 }}>
          Terintegrasi otomatis dengan perizinan santri (izin pulang / sakit).
        </p>

        {/* Date Filter Picker in Banner */}
        <div style={{
          marginTop: '14px',
          background: 'rgba(255, 255, 255, 0.16)',
          borderRadius: '12px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Tanggal:
          </span>
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            style={{
              background: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '4px 8px',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* 4 KPI Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#a7f3d0', fontWeight: 700 }}>Hadir</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>{countHadir}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#fca5a5', fontWeight: 700 }}>Sakit</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f87171' }}>{countSakit}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 700 }}>Izin</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fbbf24' }}>{countIzin}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#cbd5e1', fontWeight: 700 }}>Alfa</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>{countAlfa}</div>
          </div>
        </div>
      </div>

      {/* Banner Perizinan Terintegrasi (Jika ada santri yang sedang izin/sakit keluar) */}
      {activePerizinanOnDate.length > 0 && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '12px 14px',
          marginBottom: '14px',
          border: '1.5px solid #fde68a',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DoorOpen size={16} color="#d97706" /> Santri Izin & Sakit (Perizinan Aktif)
            </span>
            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '8px'
            }}>
              {activePerizinanOnDate.length} Santri
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activePerizinanOnDate.map((sp) => {
              const isSakit = (sp.jenis_izin || '').toLowerCase().includes('sakit') ||
                              (sp.jenis_izin || '').toLowerCase().includes('berobat');
              return (
                <div key={sp.id} style={{
                  background: isSakit ? '#fff5f5' : '#fffbeb',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  border: isSakit ? '1px solid #fed7d7' : '1px solid #fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      {sp.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      NIS: {sp.nis || '-'} • {sp.jenis_izin}
                    </div>
                    {sp.keperluan && (
                      <div style={{ fontSize: '0.68rem', color: isSakit ? '#c53030' : '#b45309', marginTop: '2px' }}>
                        Ket: {sp.keperluan}
                      </div>
                    )}
                  </div>
                  <span style={{
                    background: isSakit ? '#dc2626' : '#d97706',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase'
                  }}>
                    {isSakit ? 'Sakit' : 'Izin'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Status Pills (Semua, Hadir, Sakit, Izin, Alfa) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
        marginBottom: '10px'
      }}>
        {[
          { key: 'Semua', label: 'Semua', count: totalTercatat },
          { key: 'Hadir', label: 'Hadir', count: countHadir },
          { key: 'Sakit', label: 'Sakit', count: countSakit },
          { key: 'Izin', label: 'Izin', count: countIzin },
          { key: 'Alfa', label: 'Alfa', count: countAlfa }
        ].map(item => {
          const isActive = selectedStatusTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedStatusTab(item.key)}
              style={{
                padding: '6px 2px',
                borderRadius: '10px',
                border: isActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                background: isActive ? '#e0f2fe' : '#ffffff',
                color: isActive ? '#0369a1' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div>{item.label}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800 }}>({item.count})</div>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '12px'
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          type="text"
          placeholder="Cari nama santri, NIS, atau kegiatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.78rem',
            width: '100%',
            color: '#0f172a'
          }}
        />
      </div>

      {/* List Daftar Presensi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredList.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '24px 16px',
            textAlign: 'center',
            color: '#64748b',
            border: '1px dashed #cbd5e1'
          }}>
            <FileText size={24} style={{ margin: '0 auto 6px', color: '#94a3b8' }} />
            <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>Tidak ada data presensi</div>
            <div style={{ fontSize: '0.72rem' }}>Pilih tanggal lain atau sesuaikan filter status.</div>
          </div>
        ) : (
          filteredList.map((log, idx) => {
            const cleanSt = simplifyStatus(log.status_kehadiran || log.status);
            const isHadir = cleanSt === 'Hadir';
            const isSakit = cleanSt === 'Sakit';
            const isIzin = cleanSt === 'Izin';

            const badgeBg = isHadir ? '#ecfdf5' : isSakit ? '#fef2f2' : isIzin ? '#fffbeb' : '#f8fafc';
            const badgeColor = isHadir ? '#059669' : isSakit ? '#dc2626' : isIzin ? '#d97706' : '#64748b';
            const badgeBorder = isHadir ? '#a7f3d0' : isSakit ? '#fecdd3' : isIzin ? '#fde68a' : '#cbd5e1';

            return (
              <div
                key={log.id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {log.nama_santri}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <span>NIS: {log.nis || '-'}</span>
                    {log.nama_asrama && <span>• {log.nama_asrama}</span>}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={10} />
                    <span>{log.nama_sesi || log.kegiatan || 'Sesi Terjadwal'}</span>
                    {log.waktu_scan && log.waktu_scan !== '00:00:00' && (
                      <span>• {log.waktu_scan.substring(0, 5)} WIB</span>
                    )}
                  </div>
                  {log.keterangan && (
                    <div style={{
                      fontSize: '0.66rem',
                      color: badgeColor,
                      background: badgeBg,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      display: 'inline-block'
                    }}>
                      {log.keterangan}
                    </div>
                  )}
                </div>

                <div style={{
                  padding: '4px 8px',
                  borderRadius: '8px',
                  background: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  flexShrink: 0
                }}>
                  {cleanSt}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
