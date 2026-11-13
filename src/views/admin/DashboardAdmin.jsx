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
  Building2,
  Check,
  FileText,
  ChevronRight,
  User,
  CheckCircle2
} from 'lucide-react';

export default function DashboardAdmin({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { total_santri: 0, total_kelas: 0, total_izin_aktif: 0 },
    rekap_absensi: { hadir: 0, sakit: 0, izin: 0, alfa: 0, total: 0, persen_hadir: 0 },
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

      {/* 2. TOP STATS CARDS */}
      <div className="top-stats-grid" style={{ marginTop: '16px', marginBottom: '16px' }}>
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
