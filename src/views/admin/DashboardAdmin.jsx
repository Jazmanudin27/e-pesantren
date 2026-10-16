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
  RotateCw
} from 'lucide-react';

export default function DashboardAdmin() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { total_santri: 0, total_halaqah: 0, total_izin_aktif: 0, avg_juz: '0' },
    recentSetoran: [],
    activeIzin: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats');
      if (res.data && res.data.success) {
        setData({
          stats: {
            total_santri: res.data.stats?.total_santri || 0,
            total_halaqah: res.data.stats?.total_halaqah || 0,
            total_izin_aktif: res.data.stats?.total_izin_aktif || 0,
            avg_juz: res.data.stats?.avg_juz || '0'
          },
          recentSetoran: Array.isArray(res.data.recentSetoran) ? res.data.recentSetoran : [],
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
          <RotateCw size={12} /> Refresh Data
        </button>
      </div>

      {/* 2. TOP 4 COLORED STATS CARDS (CLEAN WITHOUT SUBTEXT) */}
      <div className="top-stats-grid">
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
            <div className="stat-colored-title">HALAQAH TAHFIDZ</div>
            <div className="stat-colored-number">{data.stats.total_halaqah}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
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

      {/* 3. 2 COLUMNS GRID */}
      <div className="dashboard-content-grid">
        
        {/* Setoran Tahfidz Card */}
        <div className="card">
          <div className="card-header">
            <h3>📖 Setoran Tahfidz Qur'an Terbaru</h3>
            <span className="badge badge-info">Data Real-Time</span>
          </div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={18} className="animate-spin" /> Memuat data...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SANTRI & KAMAR</th>
                  <th>MATERI / SURAT</th>
                  <th>NILAI</th>
                  <th>PENGUJI</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSetoran.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{row.nama_asrama || '-'} ({row.nama_kamar || '-'})</div>
                    </td>
                    <td>
                      <span className="badge badge-info">Juz {row.juz}: {row.surat_mulai}</span>
                    </td>
                    <td>
                      <span className={`badge ${row.kualitas_tajwid?.includes('Mumtaz') ? 'badge-success' : 'badge-warning'}`}>
                        {row.kualitas_tajwid || 'Lulus'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.74rem' }}>{row.nama_asatidz || '-'}</div>
                      <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                        {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
