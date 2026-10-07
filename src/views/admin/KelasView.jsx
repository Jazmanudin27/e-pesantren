import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Users, Plus, Loader2 } from 'lucide-react';

export default function KelasView() {
  const [halaqahList, setHalaqahList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHalaqah = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tahfidz/halaqah');
      if (res.data && res.data.success) {
        setHalaqahList(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data halaqah/kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalaqah();
  }, []);

  return (
    <div>
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Kelas & Halaqah Qur'an</h2>
            <p>Kelola pembagian kelompok halaqah santri, asatidz pengampu, dan target pembelajaran</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} /> Tambah Halaqah
        </button>
      </div>

      <div className="table-container-card">
        <div className="card-header">
          <h3>📋 Daftar Kelompok Halaqah & Kelas Diniyah</h3>
          <span className="badge badge-info">Total: {halaqahList.length} Kelompok</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data halaqah/kelas...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '50px' }}>NO</th>
                <th>NAMA HALAQAH / KELAS</th>
                <th>ASATIDZ PENGAMPU</th>
                <th>TARGET PROGRAM</th>
                <th>JADWAL WAKTU</th>
                <th className="td-center">PERUNTUKAN</th>
                <th className="td-center">TOTAL SANTRI</th>
              </tr>
            </thead>
            <tbody>
              {halaqahList.map((h, idx) => (
                <tr key={h.id || idx}>
                  <td className="td-center" style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.nama_halaqah}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{h.nama_asatidz || 'Musyrif'}</div>
                  </td>
                  <td>{h.target_program}</td>
                  <td>{h.waktu_halaqah}</td>
                  <td className="td-center">
                    <span className={`badge ${h.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {h.gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className="badge badge-success">{h.total_santri || 0} Santri</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
