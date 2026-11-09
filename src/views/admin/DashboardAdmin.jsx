import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  Sparkles, 
  Fingerprint, 
  Loader2, 
  CheckCircle, 
  Clock, 
  RotateCw, 
  GraduationCap, 
  ShieldCheck, 
  Building,
  Check,
  FileText,
  ChevronRight,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function DashboardAdmin({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [filterPresensiStatus, setFilterPresensiStatus] = useState('Semua'); // 'Semua' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [searchPresensi, setSearchPresensi] = useState('');
  const [data, setData] = useState({
    stats: { total_santri: 0, total_kelas: 0, total_izin_aktif: 0 },
    rekap_absensi: { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0, persen_hadir: 0 },
    absensi_today_list: [],
    activeIzin: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats');
      if (res.data && res.data.success) {
        const rekap = res.data.rekap_absensi || { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0 };
        const totalAbsen = (rekap.hadir || 0) + (rekap.sakit || 0) + (rekap.izin || 0) + (rekap.alfa || 0);
        const persen = totalAbsen > 0 ? Math.round(((rekap.hadir || 0) / totalAbsen) * 100) : (rekap.persen_hadir || 0);

        setData({
          stats: {
            total_santri: res.data.stats?.total_santri || 0,
            total_kelas: res.data.stats?.total_kelas || 0,
            total_izin_aktif: res.data.stats?.total_izin_aktif || 0
          },
          rekap_absensi: {
            ...rekap,
            persen_hadir: persen
          },
          absensi_today_list: Array.isArray(res.data.absensi_today_list) ? res.data.absensi_today_list : [],
          activeIzin: Array.isArray(res.data.activeIzin) ? res.data.activeIzin : []
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGoToAbsensi = () => {
    if (onNavigate) {
      onNavigate('absensi-berjamaah');
    } else {
      window.location.hash = '#absensi-berjamaah';
    }
  };

  const filteredAbsensiList = (data.absensi_today_list || []).filter((item) => {
    const st = String(item.status_kehadiran || item.status || '').toLowerCase();
    const q = searchPresensi.toLowerCase();
    const matchSearch = 
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.nama_sesi || '').toLowerCase().includes(q) ||
      (item.nama_asrama || '').toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (filterPresensiStatus === 'Semua') return true;
    if (filterPresensiStatus === 'Hadir') return st.includes('hadir');
    if (filterPresensiStatus === 'Sakit') return st.includes('sakit');
    if (filterPresensiStatus === 'Izin') return st.includes('izin');
    if (filterPresensiStatus === 'Alfa') return st.includes('alfa') || st.includes('alpha') || st.includes('teledor');
    return true;
  });

  return (
    <div>
      {/* 1. BANNER SAMBUTAN ISLAMI */}
      <div className="dashboard-welcome-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span className="font-arabic" style={{ fontSize: '1rem', color: '#fef08a' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span style={{ background: 'rgba(255,255,255,0.18)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700 }}>1448 H</span>
          </div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1px' }}>Dashboard Terpadu Ruang Ponpes</h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.72rem' }}>Data sinkron langsung dari database MySQL pesantren secara real-time.</p>
        </div>
        <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={fetchData}>
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* 2. REKAP PRESENSI REALTIME BERJALAN (IDENTIK DENGAN PORTAL OWNER) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0',
          marginBottom: '16px'
        }}
      >
        {/* Header Row: Live indicator + Title + Kehadiran Rate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)'
              }}
            />
            <div>
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.2px',
                  lineHeight: 1.1
                }}
              >
                Presensi Berjamaah Realtime
              </div>
              <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px' }}>
                Hari Ini, {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '99px',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={13} strokeWidth={3} />
              {data.rekap_absensi?.persen_hadir || 0}% Kehadiran
            </span>

            <button
              type="button"
              onClick={handleGoToAbsensi}
              style={{
                background: 'rgba(13, 148, 136, 0.08)',
                border: '1px solid rgba(13, 148, 136, 0.25)',
                borderRadius: '8px',
                color: '#0d9488',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                transition: 'all 0.15s ease'
              }}
            >
              Rincian Presensi <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Sub Info Bar: Fingerprint ADMS Realtime */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            padding: '8px 12px',
            borderRadius: '12px',
            marginBottom: '14px',
            border: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: '#0d766e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Fingerprint size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                Monitoring Presensi Pesantren
              </div>
              <div style={{ fontSize: '0.64rem', fontWeight: 600, color: '#64748b', marginTop: '1px' }}>
                Status: Cloud ADMS Terhubung • {data.stats.total_santri || 0} Santri Mukim
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              color: '#059669',
              background: '#ecfdf5',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #a7f3d0'
            }}
          >
            ● ADMS Online
          </span>
        </div>

        {/* 4 Cards Grid (Pastel Touchable Badges Sesuai Portal Owner) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '12px'
          }}
        >
          {/* Hadir */}
          <div
            onClick={() => setFilterPresensiStatus(filterPresensiStatus === 'Hadir' ? 'Semua' : 'Hadir')}
            style={{
              background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '14px',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: filterPresensiStatus === 'Hadir' ? '2px solid #059669' : '1px solid #bbf7d0',
              cursor: 'pointer',
              boxShadow: filterPresensiStatus === 'Hadir' ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none',
              transition: 'all 0.18s ease',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Check size={17} strokeWidth={2.8} />
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#15803d',
                marginTop: '4px',
                lineHeight: 1
              }}
            >
              {data.rekap_absensi?.hadir || 0}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', marginTop: '3px' }}>
              Hadir
            </span>
          </div>

          {/* Sakit */}
          <div
            onClick={() => setFilterPresensiStatus(filterPresensiStatus === 'Sakit' ? 'Semua' : 'Sakit')}
            style={{
              background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
              borderRadius: '14px',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: filterPresensiStatus === 'Sakit' ? '2px solid #dc2626' : '1px solid #fecaca',
              cursor: 'pointer',
              boxShadow: filterPresensiStatus === 'Sakit' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
              transition: 'all 0.18s ease',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Building size={16} strokeWidth={2.6} />
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#b91c1c',
                marginTop: '4px',
                lineHeight: 1
              }}
            >
              {data.rekap_absensi?.sakit || 0}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991b1b', marginTop: '3px' }}>
              Sakit
            </span>
          </div>

          {/* Izin */}
          <div
            onClick={() => setFilterPresensiStatus(filterPresensiStatus === 'Izin' ? 'Semua' : 'Izin')}
            style={{
              background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
              borderRadius: '14px',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: filterPresensiStatus === 'Izin' ? '2px solid #d97706' : '1px solid #fde68a',
              cursor: 'pointer',
              boxShadow: filterPresensiStatus === 'Izin' ? '0 4px 12px rgba(217, 119, 6, 0.25)' : 'none',
              transition: 'all 0.18s ease',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(245, 158, 11, 0.35)'
              }}
            >
              <FileText size={16} strokeWidth={2.6} />
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#b45309',
                marginTop: '4px',
                lineHeight: 1
              }}
            >
              {data.rekap_absensi?.izin || 0}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400e', marginTop: '3px' }}>
              Izin
            </span>
          </div>

          {/* Alfa */}
          <div
            onClick={() => setFilterPresensiStatus(filterPresensiStatus === 'Alfa' ? 'Semua' : 'Alfa')}
            style={{
              background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
              borderRadius: '14px',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: filterPresensiStatus === 'Alfa' ? '2px solid #0d9488' : '1px solid #99f6e4',
              cursor: 'pointer',
              boxShadow: filterPresensiStatus === 'Alfa' ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
              transition: 'all 0.18s ease',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '10px',
                background: '#0d9488',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px -1px rgba(13, 148, 136, 0.35)'
              }}
            >
              <Clock size={16} strokeWidth={2.6} />
            </div>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#0f766e',
                marginTop: '4px',
                lineHeight: 1
              }}
            >
              {data.rekap_absensi?.alfa || 0}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#115e59', marginTop: '3px' }}>
              Alfa
            </span>
          </div>
        </div>

        {/* Realtime Scan Log Preview Hari Ini */}
        <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>
              Aktivitas Presensi Hari Ini ({filteredAbsensiList.length} Santri {filterPresensiStatus !== 'Semua' ? `[${filterPresensiStatus}]` : ''})
            </span>
            <div style={{ position: 'relative', width: '180px' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '7px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Cari santri..."
                value={searchPresensi}
                onChange={(e) => setSearchPresensi(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 24px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.68rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {filteredAbsensiList.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', background: '#f8fafc', borderRadius: '8px' }}>
              Tidak ada data presensi {filterPresensiStatus !== 'Semua' ? `berstatus ${filterPresensiStatus}` : 'hari ini'}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {filteredAbsensiList.slice(0, 15).map((item, idx) => {
                const st = String(item.status_kehadiran || item.status || '').toLowerCase();
                const isHadir = st.includes('hadir');
                const isSakit = st.includes('sakit');
                const isIzin = st.includes('izin');
                const badgeBg = isHadir ? '#ecfdf5' : isSakit ? '#fef2f2' : isIzin ? '#fffbeb' : '#f0fdfa';
                const badgeColor = isHadir ? '#059669' : isSakit ? '#dc2626' : isIzin ? '#d97706' : '#0d9488';

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.72rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: badgeBg,
                          color: badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isHadir ? <Check size={13} strokeWidth={3} /> : isSakit ? <Building size={12} /> : isIzin ? <FileText size={12} /> : <Clock size={12} />}
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nama_santri}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                          {item.nama_asrama ? `${item.nama_asrama} • ` : ''}{item.nama_sesi || 'Berjamaah'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: badgeBg,
                          color: badgeColor
                        }}
                      >
                        {item.status_kehadiran || item.status || 'Hadir'}
                      </span>
                      <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '1px' }}>
                        {item.waktu_scan && item.waktu_scan !== '00:00:00' ? item.waktu_scan : 'Tercatat'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. TOP STATS CARDS */}
      <div className="top-stats-grid" style={{ marginBottom: '16px' }}>
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI MUKIM</div>
            <div className="stat-colored-number">{data.stats.total_santri}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">KEHADIRAN HARI INI</div>
            <div className="stat-colored-number">{data.rekap_absensi?.persen_hadir || 0}%</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI IZIN GERBANG</div>
            <div className="stat-colored-number">{data.stats.total_izin_aktif}</div>
          </div>
          <div className="stat-colored-icon-box">
            <DoorOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">PRESENSI FINGERPRINT</div>
            <div className="stat-colored-number">Online</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>
      </div>

      {/* 4. 2 COLUMNS GRID (STATUS OPERASIONAL & SANTRI IZIN) */}
      <div className="dashboard-content-grid">
        
        {/* Status Operasional Pesantren Card */}
        <div className="card">
          <div className="card-header">
            <h3>🏢 Status Operasional Pesantren</h3>
            <span className="badge badge-success">Aktif Normal</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>KBM &amp; Shalat Berjamaah Terpantau</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Seluruh jadwal shalat fardhu dan pengajian kitab berlangsung lancar.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Fingerprint size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>Mesin Fingerprint &amp; Wajah AI Terhubung</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Cloud ADMS sinkronisasi presensi otomatis realtime.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Santri Izin Card */}
        <div className="card">
          <div className="card-header">
            <h3>🚪 Santri Izin Keluar / Pulang</h3>
            <span className="badge badge-purple">Pos Gerbang</span>
          </div>
          <div style={{ padding: '10px 12px' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={18} className="animate-spin" /> Memuat data...
              </div>
            ) : data.activeIzin.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                Tidak ada santri yang sedang berstatus izin keluar saat ini.
              </div>
            ) : (
              data.activeIzin.map((iz) => (
                <div key={iz.id} style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{iz.nama_santri}</span>
                    <span className="badge badge-danger">
                      {iz.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '2px' }}>
                    <strong>Keperluan:</strong> {iz.keperluan}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'flex-end' }}>
                    <span>Kembali: <strong>{iz.tgl_kembali_rencana ? new Date(iz.tgl_kembali_rencana).toLocaleDateString('id-ID') : '-'}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
