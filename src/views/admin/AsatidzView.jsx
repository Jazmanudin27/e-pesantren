import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, Plus, Loader2, Phone, Mail } from 'lucide-react';

export default function AsatidzView() {
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAsatidz = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asatidz');
      if (res.data && res.data.success) {
        setAsatidzList(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data asatidz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsatidz();
  }, []);

  return (
    <div>
      <div className="page-title-strip">
        <div className="page-title-left">
          <GraduationCap size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Asatidz & Pengasuh</h2>
            <p>Kelola profil pengajar diniyah, musyrif tahfidz, dan pembina asrama pesantren</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} /> Tambah Asatidz
        </button>
      </div>

      <div className="table-container-card">
        <div className="card-header">
          <h3>📋 Daftar Asatidz & Musyrif Pesantren</h3>
          <span className="badge badge-info">Total: {asatidzList.length} Asatidz</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data asatidz...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '50px' }}>NO</th>
                <th>NAMA ASATIDZ & GELAR</th>
                <th className="td-center">GENDER</th>
                <th>TUGAS UTAMA / AMANAH</th>
                <th>KONTAK HP</th>
                <th className="td-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {asatidzList.map((ast, idx) => (
                <tr key={ast.id || idx}>
                  <td className="td-center" style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ast.nama_asatidz}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Gelar: {ast.gelar || '-'} | NIK: {ast.nik_niy || '-'}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {ast.jk === 'L' ? 'Ustadz (L)' : 'Ustadzah (P)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{ast.tugas_utama || 'Pengajar'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem' }}>{ast.no_hp || '-'}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`}>
                      {ast.status}
                    </span>
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
