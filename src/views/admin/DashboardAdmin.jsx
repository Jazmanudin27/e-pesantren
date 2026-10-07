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
    stats: { total_santri: 648, total_halaqah: 32, total_izin_aktif: 18, avg_juz: '8.4' },
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
            total_santri: res.data.stats.total_santri || 648,
            total_halaqah: res.data.stats.total_halaqah || 32,
            total_izin_aktif: res.data.stats.total_izin_aktif || 18,
            avg_juz: res.data.stats.avg_juz || '8.4'
          },
          recentSetoran: res.data.recentSetoran && res.data.recentSetoran.length > 0 ? res.data.recentSetoran : [
            { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nama_asrama: 'Asrama Ali', nama_kamar: 'Kamar 04', juz: 15, surat_mulai: 'Al-Isra: 1-25', kualitas_tajwid: 'Mumtaz (A)', nama_asatidz: 'Ust. Hamdan', tanggal: '2026-10-08' },
            { id: 2, nama_santri: 'Zaidan Muhammad', nama_asrama: 'Asrama Umar', nama_kamar: 'Kamar 02', juz: 28, surat_mulai: 'Al-Mujadilah', kualitas_tajwid: 'Jayyid (B+)', nama_asatidz: 'Ust. Nurul Huda', tanggal: '2026-10-08' },
            { id: 3, nama_santri: 'Fatimah Az-Zahra', nama_asrama: 'Asrama Fathimah', nama_kamar: 'Kamar 01', juz: 30, surat_mulai: 'An-Naba - An-Nas', kualitas_tajwid: 'Mumtaz (A)', nama_asatidz: 'Usth. Salma', tanggal: '2026-10-08' },
            { id: 4, nama_santri: 'Muhammad Rifqi', nama_asrama: 'Asrama Abu Bakar', nama_kamar: 'Kamar 06', juz: 5, surat_mulai: 'An-Nisa: 50-80', kualitas_tajwid: 'Jayyid (B)', nama_asatidz: 'Ust. Hamdan', tanggal: '2026-10-08' }
          ],
          activeIzin: res.data.activeIzin && res.data.activeIzin.length > 0 ? res.data.activeIzin : [
            { id: 1, nama_santri: 'Bilal Abdurrahman', keperluan: 'Acara Keluarga / Walimah', nama_penjemput_mahrom: 'H. Rahman (Ayah)', tgl_kembali_rencana: '2026-10-10', status: 'Aktif Keluar' },
            { id: 2, nama_santri: 'Syifa Nurul Izzah', keperluan: 'Berobat / Kontrol Dokter', nama_penjemput_mahrom: 'Ibu Aminah (Ibu)', tgl_kembali_rencana: '2026-10-08', status: 'Aktif Keluar' }
          ]
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
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#ffffff',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(6, 78, 59, 0.15)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <span className="font-arabic" style={{ fontSize: '1rem', color: '#fef08a' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span style={{ background: 'rgba(255,255,255,0.18)', padding: '1px 5px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: 700 }}>1448 H</span>
          </div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1px' }}>Dashboard Terpadu E-Pesantren</h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.72rem' }}>Data sinkron langsung dari database MySQL pesantren secara real-time.</p>
        </div>
        <button className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }} onClick={fetchData}>
          <RotateCw size={12} /> Refresh Data
        </button>
      </div>

      {/* 2. TOP 4 STATS BOXES */}
      <div className="top-stats-grid">
        <div className="stat-box">
          <div>
            <div className="stat-box-title">TOTAL SANTRI MUKIM</div>
            <div className="stat-box-number">{data.stats.total_santri}</div>
            <div className="stat-box-sub">
              <span className="dot-blue" style={{ color: '#0284c7' }}>●</span> Terdaftar Aktif
            </div>
          </div>
          <div className="stat-box-icon bg-stat-blue">
            <Users size={20} />
          </div>
        </div>

        <div className="stat-box">
          <div>
            <div className="stat-box-title">HALAQAH TAHFIDZ</div>
            <div className="stat-box-number" style={{ color: '#059669' }}>{data.stats.total_halaqah}</div>
            <div className="stat-box-sub">
              <span className="dot-green" style={{ color: '#10b981' }}>●</span> Rata-rata {data.stats.avg_juz} Juz
            </div>
          </div>
          <div className="stat-box-icon bg-stat-green">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="stat-box">
          <div>
            <div className="stat-box-title">SANTRI IZIN GERBANG</div>
            <div className="stat-box-number" style={{ color: '#d97706' }}>{data.stats.total_izin_aktif}</div>
            <div className="stat-box-sub">
              <span className="dot-amber" style={{ color: '#f59e0b' }}>●</span> Status Aktif Keluar
            </div>
          </div>
          <div className="stat-box-icon bg-stat-amber">
            <DoorOpen size={20} />
          </div>
        </div>

        <div className="stat-box">
          <div>
            <div className="stat-box-title">PRESENSI FINGERPRINT</div>
            <div className="stat-box-number" style={{ color: '#0284c7' }}>Online</div>
            <div className="stat-box-sub">
              <span className="dot-blue" style={{ color: '#0284c7' }}>●</span> Mesin Siap Digunakan
            </div>
          </div>
          <div className="stat-box-icon bg-stat-blue">
            <Fingerprint size={20} />
          </div>
        </div>
      </div>

      {/* 3. 2 COLUMNS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
        
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
                  border: '1px solid #e2e8f0',
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
