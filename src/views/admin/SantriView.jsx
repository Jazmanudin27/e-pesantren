import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Filter, Home, Loader2, Fingerprint } from 'lucide-react';

export default function SantriView() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/santri');
      if (res.data && res.data.success) {
        setSantriList(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
  }, []);

  const filteredSantri = santriList.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      s.nama_wali?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Data Induk Santri & Asrama</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Data tersinkron langsung dengan tabel database <code>santri</code>, <code>asrama</code>, dan <code>kamar_kobong</code>.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchSantri}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <div className="header-search" style={{ width: '100%', maxWidth: '280px' }}>
              <Search size={14} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Cari santri, NIS, asrama..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-success">Total: {santriList.length} Santri</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data santri dari database...
          </div>
        ) : filteredSantri.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            {search ? 'Tidak ada santri yang cocok dengan pencarian.' : 'Belum ada data santri di database.'}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>NIS & Nama Santri</th>
                <th>Gender</th>
                <th>Asrama & Kobong</th>
                <th>PIN Fingerprint</th>
                <th>Status</th>
                <th>Capaian Hafalan</th>
                <th>Wali / Kontak</th>
              </tr>
            </thead>
            <tbody>
              {filteredSantri.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>{s.nama_santri}</div>
                    <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>NIS: {s.nis}</div>
                  </td>
                  <td>
                    <span className={`badge ${s.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {s.jk === 'L' ? 'Ikhwan' : 'Akhwat'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                      <Home size={12} color="#059669" /> {s.nama_asrama || '-'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.nama_kamar || '-'}</div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <Fingerprint size={11} /> PIN: {s.fingerprint_pin || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.status_santri === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                      {s.status_santri}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ fontWeight: 700 }}>
                      {s.capaian_hafalan_juz || 0} Juz
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600 }}>{s.nama_wali || '-'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{s.no_wa_wali || '-'}</div>
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
