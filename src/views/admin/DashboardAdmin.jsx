import React from 'react';
import { 
  Users, 
  BookOpen, 
  Wallet, 
  DoorOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function DashboardAdmin() {
  const stats = [
    { title: 'Total Santri Mukim', value: '648', sub: '+12 santri baru', icon: Users, color: 'icon-emerald' },
    { title: 'Halaqah & Tahfidz', value: '32 Kelompok', sub: 'Rata-rata 8.4 Juz', icon: BookOpen, color: 'icon-amber' },
    { title: 'Syahriah Terkumpul', value: 'Rp 142.800.000', sub: '92% Lunas Bulan Ini', icon: Wallet, color: 'icon-blue' },
    { title: 'Santri Izin Keluar/Pulang', value: '18 Santri', sub: '6 kembali hari ini', icon: DoorOpen, color: 'icon-purple' },
  ];

  const recentSetoran = [
    { nama: 'Ahmad Faiz Al-Hafidz', kamar: 'Ali bin Abi Thalib / 04', juz: 'Juz 15 (Al-Isra: 1-25)', nilai: 'Mumtaz (A)', ustadz: 'Ust. Hamdan S.Th.I', waktu: '06:15 WIB' },
    { nama: 'Zaidan Muhammad', kamar: 'Umar bin Khattab / 02', juz: 'Juz 28 (Al-Mujadilah)', nilai: 'Jayyid Jiddan (B+)', ustadz: 'Ust. Nurul Huda', waktu: '06:30 WIB' },
    { nama: 'Fatimah Az-Zahra', kamar: 'Fathimah / 01 (Putri)', juz: 'Juz 30 (An-Naba - An-Nas)', nilai: 'Mumtaz (A)', ustadz: 'Usth. Salma M.Pd', waktu: '06:45 WIB' },
    { nama: 'Muhammad Rifqi', kamar: 'Abu Bakar / 06', juz: 'Juz 5 (An-Nisa: 50-80)', nilai: 'Jayyid (B)', ustadz: 'Ust. Hamdan S.Th.I', waktu: '07:00 WIB' },
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
        borderRadius: '16px',
        padding: '24px 32px',
        color: '#ffffff',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="font-arabic" style={{ fontSize: '1.4rem', color: '#fef08a' }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>1448 H</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>Dashboard Sistem Terpadu E-Pesantren</h1>
          <p style={{ color: '#a7f3d0', fontSize: '0.9rem' }}>Pantau perkembangan hafalan, kedisiplinan asrama, serta tata kelola keuangan pesantren secara real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-gold" style={{ boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)' }}>
            <Sparkles size={16} /> Input Setoran Tahfidz
          </button>
        </div>
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
                  <ArrowUpRight size={14} /> {st.sub}
                </div>
              </div>
              <div className={`stat-icon ${st.color}`}>
                <Icon size={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Columns Grid: Setoran Qur'an & Perizinan */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        
        {/* Card Setoran Terkini */}
        <div className="card">
          <div className="card-header">
            <h3>📖 Setoran Tahfidz Qur'an Hari Ini</h3>
            <span className="badge badge-success">Sesi Ba'da Shubuh</span>
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
                    <div style={{ fontWeight: 700 }}>{row.nama}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.kamar}</div>
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
                    <div style={{ fontSize: '0.85rem' }}>{row.ustadz}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.waktu}</div>
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
            <span className="badge badge-purple">Pos Keamanan</span>
          </div>
          <div style={{ padding: '16px' }}>
            {activeIzin.map((iz, i) => (
              <div key={i} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{iz.nama}</span>
                  <span className={`badge ${iz.status === 'Izin Aktif' ? 'badge-success' : 'badge-danger'}`}>
                    {iz.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '4px' }}>
                  <strong>Keperluan:</strong> {iz.keperluan}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Wali: {iz.penjemput}</span>
                  <span>Kembali: <strong>{iz.kembali}</strong></span>
                </div>
              </div>
            ))}
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }}>
              Lihat Semua Perizinan Asrama
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
