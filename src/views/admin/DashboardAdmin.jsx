import React from 'react';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  Sparkles,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';

export default function DashboardAdmin() {
  const stats = [
    { title: 'Total Santri Mukim', value: '648', sub: '+12 santri', icon: Users, color: 'icon-emerald' },
    { title: 'Halaqah & Tahfidz', value: '32 Kelompok', sub: 'Rata 8.4 Juz', icon: BookOpen, color: 'icon-amber' },
    { title: 'Presensi Shubuh (Finger)', value: '98.2%', sub: '636 Hadir', icon: Fingerprint, color: 'icon-blue' },
    { title: 'Santri Izin Gerbang', value: '18 Santri', sub: '6 kembali hari ini', icon: DoorOpen, color: 'icon-purple' },
  ];

  const recentSetoran = [
    { nama: 'Ahmad Faiz Al-Hafidz', kamar: 'Ali / 04', juz: 'Juz 15 (Al-Isra: 1-25)', nilai: 'Mumtaz (A)', ustadz: 'Ust. Hamdan', waktu: '06:15' },
    { nama: 'Zaidan Muhammad', kamar: 'Umar / 02', juz: 'Juz 28 (Al-Mujadilah)', nilai: 'Jayyid (B+)', ustadz: 'Ust. Nurul Huda', waktu: '06:30' },
    { nama: 'Fatimah Az-Zahra', kamar: 'Fathimah / 01', juz: 'Juz 30 (An-Naba - An-Nas)', nilai: 'Mumtaz (A)', ustadz: 'Usth. Salma', waktu: '06:45' },
    { nama: 'Muhammad Rifqi', kamar: 'Abu Bakar / 06', juz: 'Juz 5 (An-Nisa: 50-80)', nilai: 'Jayyid (B)', ustadz: 'Ust. Hamdan', waktu: '07:00' },
  ];

  const activeIzin = [
    { nama: 'Bilal Abdurrahman', kamar: 'Utsman / 03', keperluan: 'Acara Keluarga / Walimah', penjemput: 'H. Rahman (Ayah)', kembali: '10 Okt 2026', status: 'Izin Aktif' },
    { nama: 'Syifa Nurul Izzah', kamar: 'Khadijah / 02', keperluan: 'Berobat / Kontrol Dokter', penjemput: 'Ibu Aminah (Ibu)', kembali: '08 Okt 2026', status: 'Perlu Kembali' },
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
          <p style={{ color: '#a7f3d0', fontSize: '0.74rem' }}>Pantau hafalan Qur'an, perizinan gerbang & presensi fingerprint shalat santri.</p>
        </div>
        <button className="btn btn-gold btn-sm">
          <Sparkles size={13} /> Input Setoran
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
            <h3>📖 Setoran Tahfidz Qur'an Hari Ini</h3>
            <span className="badge badge-success">Ba'da Shubuh</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Santri & Kamar</th>
                <th>Materi / Juz</th>
                <th>Nilai</th>
                <th>Penguji</th>
              </tr>
            </thead>
            <tbody>
              {recentSetoran.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{row.nama}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{row.kamar}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{row.juz}</span>
                  </td>
                  <td>
                    <span className={`badge ${row.nilai.includes('Mumtaz') ? 'badge-success' : 'badge-warning'}`}>
                      {row.nilai}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>{row.ustadz}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{row.waktu}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card Perizinan Santri */}
        <div className="card">
          <div className="card-header">
            <h3>🚪 Santri Izin Keluar / Pulang</h3>
            <span className="badge badge-purple">Pos Gerbang</span>
          </div>
          <div style={{ padding: '10px 12px' }}>
            {activeIzin.map((iz, i) => (
              <div key={i} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 10px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{iz.nama}</span>
                  <span className={`badge ${iz.status === 'Izin Aktif' ? 'badge-success' : 'badge-danger'}`}>
                    {iz.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '2px' }}>
                  <strong>Keperluan:</strong> {iz.keperluan}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Wali: {iz.penjemput}</span>
                  <span>Kembali: <strong>{iz.kembali}</strong></span>
                </div>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '4px' }}>
              Lihat Semua Perizinan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
