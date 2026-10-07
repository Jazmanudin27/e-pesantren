import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  Sparkles,
  ArrowUpRight,
  Fingerprint,
  Loader2
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
          stats: res.data.stats,
          recentSetoran: res.data.recentSetoran || [],
          activeIzin: res.data.activeIzin || []
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

  const stats = [
    { title: 'Total Santri Mukim', value: `${data.stats.total_santri} Santri`, sub: 'Terdaftar Aktif', icon: Users, color: 'icon-emerald' },
    { title: 'Halaqah Tahfidz', value: `${data.stats.total_halaqah} Kelompok`, sub: `Rata-rata ${data.stats.avg_juz} Juz`, icon: BookOpen, color: 'icon-amber' },
    { title: 'Santri Izin Gerbang', value: `${data.stats.total_izin_aktif} Santri`, sub: 'Status Aktif Keluar', icon: DoorOpen, color: 'icon-purple' },
    { title: 'Presensi Fingerprint', value: 'Online', sub: 'Mesin Siap Digunakan', icon: Fingerprint, color: 'icon-blue' },
  ];

  return (
    <div>
      {/* Banner Sambutan Islami */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        borderRadius: '10px',
        padding: '14px 18px',
        color: '#ffffff',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="font-arabic" style={{ fontSize: '1.1rem', color: '#fef08a' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>1448 H</span>
          </div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '2px' }}>Dashboard Terpadu E-Pesantren</h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.74rem' }}>Data sinkron langsung dari database MySQL pesantren secara real-time.</p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={fetchData}>
          <Sparkles size={13} /> {loading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div className="stat-card" key={idx}>
              <div className="stat-info">
                <h4>{st.title}</h4>
                <div className="stat-value">{st.value}</div>
                <div className="stat-sub">
                  <ArrowUpRight size={12} /> {st.sub}
                </div>
              </div>
              <div className={`stat-icon ${st.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Columns Grid: Setoran Qur'an & Perizinan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        
        {/* Card Setoran Terkini */}
        <div className="card">
          <div className="card-header">
            <h3>📖 Setoran Tahfidz Qur'an Terbaru</h3>
            <span className="badge badge-success">Data Real-Time</span>
          </div>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={20} className="animate-spin" /> Memuat data setoran...
            </div>
          ) : data.recentSetoran.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
              Belum ada riwayat setoran tahfidz tercatat di database.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Santri & Kamar</th>
                  <th>Materi / Surat</th>
                  <th>Tajwid & Nilai</th>
                  <th>Penguji</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSetoran.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{row.nama_santri}</div>
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
                      <div style={{ fontSize: '0.75rem' }}>{row.nama_asatidz || '-'}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Card Perizinan Santri */}
        <div className="card">
          <div className="card-header">
            <h3>🚪 Santri Izin Keluar / Pulang</h3>
            <span className="badge badge-purple">Pos Gerbang</span>
          </div>
          <div style={{ padding: '10px 12px' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={20} className="animate-spin" /> Memuat data izin...
              </div>
            ) : data.activeIzin.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                Tidak ada santri yang sedang berstatus izin keluar saat ini.
              </div>
            ) : (
              data.activeIzin.map((iz) => (
                <div key={iz.id} style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{iz.nama_santri}</span>
                    <span className={`badge ${iz.status === 'Aktif Keluar' ? 'badge-danger' : 'badge-warning'}`}>
                      {iz.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '2px' }}>
                    <strong>Keperluan:</strong> {iz.keperluan}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Wali: {iz.nama_penjemput_mahrom}</span>
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
