import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Home, CheckCircle2 } from 'lucide-react';

export default function SantriView() {
  const [santriList] = useState([
    { id: 'STR-2026-001', nama: 'Ahmad Faiz Al-Hafidz', nis: '2601001', gender: 'L', asrama: 'Ali bin Abi Thalib', kamar: 'Kamar 04', status: 'Mukim', hafalan: '15 Juz', wali: 'H. Abdullah (0812-8888-1111)' },
    { id: 'STR-2026-002', nama: 'Zaidan Muhammad', nis: '2601002', gender: 'L', asrama: 'Umar bin Khattab', kamar: 'Kamar 02', status: 'Mukim', hafalan: '28 Juz', wali: 'Drs. Subagja (0813-7777-2222)' },
    { id: 'STR-2026-003', nama: 'Fatimah Az-Zahra', nis: '2602001', gender: 'P', asrama: 'Fathimah Az-Zahra', kamar: 'Kamar 01', status: 'Mukim', hafalan: '30 Juz (Mutqin)', wali: 'H. Usman (0811-9999-3333)' },
    { id: 'STR-2026-004', nama: 'Muhammad Rifqi', nis: '2601003', gender: 'L', asrama: 'Abu Bakar Ash-Shiddiq', kamar: 'Kamar 06', status: 'Mukim', hafalan: '5 Juz', wali: 'Bpk. Hendra (0857-4444-5555)' },
    { id: 'STR-2026-005', nama: 'Aisyah Humaira', nis: '2602002', gender: 'P', asrama: 'Khadijah Al-Kubra', kamar: 'Kamar 03', status: 'Kalong (Non-Mukim)', hafalan: '3 Juz', wali: 'Hj. Rohmah (0812-3333-6666)' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Data Induk Santri & Asrama</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Kelola biodata santri, penempatan kamar kobong, dan capaian hafalan.</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={14} /> Tambah Santri
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <div className="header-search" style={{ width: '100%', maxWidth: '280px' }}>
              <Search size={14} color="#94a3b8" />
              <input type="text" placeholder="Cari santri, NIS, asrama..." />
            </div>
            <button className="btn btn-outline btn-sm">
              <Filter size={13} /> Filter
            </button>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-success">Total: 648 Santri</span>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>NIS & Nama Santri</th>
              <th>Gender</th>
              <th>Asrama & Kobong</th>
              <th>Status</th>
              <th>Hafalan</th>
              <th>Wali / Mahrom</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {santriList.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{s.nama}</div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>NIS: {s.nis}</div>
                </td>
                <td>
                  <span className={`badge ${s.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                    {s.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                    <Home size={12} color="#059669" /> {s.asrama}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.kamar}</div>
                </td>
                <td>
                  <span className={`badge ${s.status === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <span className="badge badge-info" style={{ fontWeight: 700 }}>
                    {s.hafalan}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: '0.76rem' }}>{s.wali}</div>
                </td>
                <td>
                  <button className="btn btn-outline btn-sm">
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
