import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Home, Users, Plus, Loader2, Building } from 'lucide-react';

export default function AsramaView() {
  const [data, setData] = useState({ asrama: [], kamar: [] });
  const [loading, setLoading] = useState(true);

  const fetchAsrama = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asrama');
      if (res.data && res.data.success) {
        setData({
          asrama: res.data.asrama || [],
          kamar: res.data.kamar || []
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data asrama:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsrama();
  }, []);

  return (
    <div>
      <div className="page-title-strip">
        <div className="page-title-left">
          <Building size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Asrama & Kamar Kobong</h2>
            <p>Kelola blok gedung asrama putra/putri, kamar kobong, kapasitas, dan pembina asrama</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} /> Tambah Asrama
        </button>
      </div>

      {/* Grid Asrama */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#64748b' }}>
            <Loader2 size={20} className="animate-spin" /> Memuat data asrama...
          </div>
        ) : (
          data.asrama.map((a) => (
            <div className="card" key={a.id} style={{ padding: '14px', borderTop: `3px solid ${a.gender === 'L' ? '#0284c7' : '#9333ea'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{a.nama_asrama}</h3>
                <span className={`badge ${a.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                  {a.gender === 'L' ? 'Putra' : 'Putri'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '8px' }}>
                Lokasi: {a.lokasi_gedung || '-'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px' }}>
                <span>Total Kamar: <strong>{a.total_kamar || 0}</strong></span>
                <span>Santri Mukim: <strong style={{ color: '#059669' }}>{a.total_santri || 0}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabel Kamar Kobong */}
      <div className="table-container-card">
        <div className="card-header">
          <h3>📋 Daftar Kamar Kobong & Kapasitas</h3>
          <span className="badge badge-info">Total: {data.kamar.length} Kamar</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat daftar kamar...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '50px' }}>NO</th>
                <th>KODE & NAMA KAMAR</th>
                <th>ASRAMA</th>
                <th className="td-center">KAPASITAS</th>
                <th className="td-center">TERISI</th>
                <th>KETUA KAMAR</th>
              </tr>
            </thead>
            <tbody>
              {data.kamar.map((k, idx) => (
                <tr key={k.id || idx}>
                  <td className="td-center" style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{k.nama_kamar}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Kode: {k.kode_kamar}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{k.nama_asrama}</div>
                    <span className={`badge ${k.asrama_gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {k.asrama_gender === 'L' ? 'Ikhwan' : 'Akhwat'}
                    </span>
                  </td>
                  <td className="td-center" style={{ fontWeight: 600 }}>{k.kapasitas || 10} Santri</td>
                  <td className="td-center">
                    <span className="badge badge-success">{k.terisi || 0} Terisi</span>
                  </td>
                  <td>{k.ketua_kamar || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
