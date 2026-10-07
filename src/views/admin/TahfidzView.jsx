import React from 'react';
import { BookOpen, Award, CheckCircle, Plus, Sparkles, Filter } from 'lucide-react';

export default function TahfidzView() {
  const halaqahList = [
    { nama: 'Halaqah Imam Nafi\'', ustadz: 'Ust. Hamdan Al-Hafidz', jumlah: '16 Santri', target: 'Saba\' / Sabqi (Juz 15-20)', waktu: 'Ba\'da Shubuh & Maghrib' },
    { nama: 'Halaqah Imam Ashim', ustadz: 'Ust. Nurul Huda Al-Hafidz', jumlah: '18 Santri', target: 'Muroja\'ah Mutqin (Juz 25-30)', waktu: 'Ba\'da Shubuh & Ashar' },
    { nama: 'Halaqah Fathimah (Putri)', ustadz: 'Usth. Salma M.Pd', jumlah: '20 Santriwati', target: 'Ziyadah Juz 1-5', waktu: 'Ba\'da Shubuh & Isya' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Manajemen Tahfidz & Muroja'ah Qur'an</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Monitoring halaqah setoran hafalan Ziyadah, Sabqi, dan Muroja'ah santri.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-gold btn-sm">
            <Sparkles size={13} /> Setoran Baru
          </button>
          <button className="btn btn-primary btn-sm">
            <Plus size={13} /> Buat Halaqah
          </button>
        </div>
      </div>

      {/* Halaqah Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {halaqahList.map((h, i) => (
          <div className="card" key={i} style={{ padding: '14px', borderTop: '3px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#064e3b' }}>{h.nama}</h3>
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{h.ustadz}</div>
              </div>
              <span className="badge badge-success">{h.jumlah}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem', marginBottom: '10px' }}>
              <div style={{ color: '#475569', marginBottom: '2px' }}><strong>Fokus:</strong> {h.target}</div>
              <div style={{ color: '#64748b' }}><strong>Jadwal:</strong> {h.waktu}</div>
            </div>
            <button className="btn btn-outline btn-sm" style={{ width: '100%' }}>
              Buka Mutaba'ah
            </button>
          </div>
        ))}
      </div>

      {/* Tabel Mutaba'ah Terkini */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Riwayat Setoran Mutaba'ah Terbaru</h3>
          <span className="badge badge-info">Oktober 2026</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nama Santri</th>
              <th>Jenis Setoran</th>
              <th>Surat & Ayat</th>
              <th>Tajwid</th>
              <th>Status</th>
              <th>Penguji</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>07/10/2026</td>
              <td><strong>Ahmad Faiz Al-Hafidz</strong></td>
              <td><span className="badge badge-success">Ziyadah</span></td>
              <td>QS. Al-Isra': 1 - 25</td>
              <td><span className="badge badge-success">Mumtaz (A)</span></td>
              <td>Lulus Ziyadah</td>
              <td>Ust. Hamdan S.Th.I</td>
            </tr>
            <tr>
              <td>07/10/2026</td>
              <td><strong>Muhammad Rifqi</strong></td>
              <td><span className="badge badge-warning">Muroja'ah</span></td>
              <td>QS. An-Nisa': 50 - 80</td>
              <td><span className="badge badge-warning">Jayyid (B)</span></td>
              <td>Perlu Ulang Ayat 64</td>
              <td>Ust. Hamdan S.Th.I</td>
            </tr>
            <tr>
              <td>06/10/2026</td>
              <td><strong>Fatimah Az-Zahra</strong></td>
              <td><span className="badge badge-purple">Tasmi' 5 Juz</span></td>
              <td>Juz 26 s/d 30 (Bil-Ghoib)</td>
              <td><span className="badge badge-success">Mumtaz (A+)</span></td>
              <td>Syahadah Diberikan</td>
              <td>Usth. Salma M.Pd</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
