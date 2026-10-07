import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Sparkles, Plus, BookOpen } from 'lucide-react';

export default function TahfidzView() {
  const [halaqahList, setHalaqahList] = useState([]);
  const [setoranList, setSetoranList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTahfidzData = async () => {
    try {
      setLoading(true);
      const [resHalaqah, resSetoran] = await Promise.all([
        axios.get('/api/tahfidz/halaqah'),
        axios.get('/api/tahfidz/setoran')
      ]);

      if (resHalaqah.data && resHalaqah.data.success) {
        setHalaqahList(resHalaqah.data.data || []);
      }
      if (resSetoran.data && resSetoran.data.success) {
        setSetoranList(resSetoran.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data tahfidz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahfidzData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Manajemen Tahfidz & Muroja'ah Qur'an</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Data halaqah & riwayat setoran mutaba'ah langsung dari database MySQL.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchTahfidzData}>
            Refresh
          </button>
        </div>
      </div>

      {/* Halaqah Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#64748b' }}>
            <Loader2 size={18} className="animate-spin" /> Memuat data halaqah...
          </div>
        ) : halaqahList.length === 0 ? (
          <div className="card" style={{ padding: '16px', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada kelompok halaqah terdaftar di database.
          </div>
        ) : (
          halaqahList.map((h) => (
            <div className="card" key={h.id} style={{ padding: '14px', borderTop: '3px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#064e3b' }}>{h.nama_halaqah}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{h.nama_asatidz || 'Musyrif'}</div>
                </div>
                <span className="badge badge-success">{h.gender === 'L' ? 'Ikhwan' : 'Akhwat'}</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem', marginBottom: '10px' }}>
                <div style={{ color: '#475569', marginBottom: '2px' }}><strong>Fokus:</strong> {h.target_program}</div>
                <div style={{ color: '#64748b' }}><strong>Waktu:</strong> {h.waktu_halaqah}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabel Mutaba'ah Terkini */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Riwayat Setoran Mutaba'ah Real-Time</h3>
          <span className="badge badge-info">Total: {setoranList.length} Catatan</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat riwayat setoran...
          </div>
        ) : setoranList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada data setoran tahfidz di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Santri</th>
                <th>Jenis Setoran</th>
                <th>Surat & Ayat</th>
                <th>Tajwid & Nilai</th>
                <th>Status</th>
                <th>Asatidz Penguji</th>
              </tr>
            </thead>
            <tbody>
              {setoranList.map((st) => (
                <tr key={st.id}>
                  <td>
                    {st.tanggal ? new Date(st.tanggal).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.8rem' }}>{st.nama_santri}</strong>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>NIS: {st.nis}</div>
                  </td>
                  <td>
                    <span className={`badge ${st.jenis_setoran === 'Ziyadah' ? 'badge-success' : 'badge-warning'}`}>
                      {st.jenis_setoran}
                    </span>
                  </td>
                  <td>
                    <strong>Juz {st.juz}</strong>: {st.surat_mulai} ({st.ayat_mulai} - {st.ayat_selesai})
                  </td>
                  <td>
                    <span className={`badge ${st.kualitas_tajwid?.includes('Mumtaz') ? 'badge-success' : 'badge-warning'}`}>
                      {st.kualitas_tajwid}
                    </span>
                  </td>
                  <td>{st.status}</td>
                  <td>{st.nama_asatidz || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
