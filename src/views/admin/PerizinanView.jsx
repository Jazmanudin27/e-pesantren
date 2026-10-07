import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, QrCode, Loader2 } from 'lucide-react';

export default function PerizinanView() {
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerizinan = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/perizinan');
      if (res.data && res.data.success) {
        setIzinList(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data perizinan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await axios.post('/api/perizinan/checkin', {
        id,
        satpam: 'Petugas Pos Gerbang'
      });
      fetchPerizinan();
    } catch (err) {
      alert('Gagal check-in santri: ' + err.message);
    }
  };

  useEffect(() => {
    fetchPerizinan();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Perizinan Keluar / Pulang Santri</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Data validasi gerbang pos satpam & status kepulangan langsung dari database.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchPerizinan}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🚪 Riwayat & Status Perizinan Santri</h3>
          <span className="badge badge-purple">Total: {izinList.length} Izin</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data perizinan...
          </div>
        ) : izinList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada permohonan izin santri di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Kode Barcode</th>
                <th>Nama Santri</th>
                <th>Jenis Izin</th>
                <th>Rentang Waktu</th>
                <th>Penjemput / Mahrom</th>
                <th>Status</th>
                <th>Aksi Satpam</th>
              </tr>
            </thead>
            <tbody>
              {izinList.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.76rem' }}>
                      <QrCode size={12} /> {row.barcode}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.nama_asrama || '-'} ({row.nama_kamar || '-'})</div>
                  </td>
                  <td><span className="badge badge-info">{row.jenis_izin}</span></td>
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>
                      Keluar: {row.tgl_keluar_rencana ? new Date(row.tgl_keluar_rencana).toLocaleDateString('id-ID') : '-'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>
                      Kembali: {row.tgl_kembali_rencana ? new Date(row.tgl_kembali_rencana).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.76rem' }}>{row.nama_penjemput_mahrom}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{row.no_hp_penjemput}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      row.status.includes('Tepat') ? 'badge-success' : 
                      row.status.includes('Aktif') ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    {row.status === 'Aktif Keluar' || row.status === 'Disetujui Pengasuh' ? (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleCheckIn(row.id)}
                      >
                        <CheckCircle size={12} /> Check-In Masuk
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Selesai</span>
                    )}
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
