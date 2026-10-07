import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, Loader2, RefreshCw, CheckCircle, Wifi, Clock } from 'lucide-react';

export default function AbsensiFingerprintView() {
  const [absensiList, setAbsensiList] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFingerprintData = async () => {
    try {
      setLoading(true);
      const [resAbs, resDev, resSesi] = await Promise.all([
        axios.get('/api/absensi-fingerprint'),
        axios.get('/api/fingerprint/devices'),
        axios.get('/api/fingerprint/sesi')
      ]);

      if (resAbs.data && resAbs.data.success) {
        setAbsensiList(resAbs.data.data || []);
      }
      if (resDev.data && resDev.data.success) {
        setDevices(resDev.data.data || []);
      }
      if (resSesi.data && resSesi.data.success) {
        setSesiList(resSesi.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data absensi fingerprint:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFingerprintData();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Monitoring Absensi Fingerprint Shalat & Mengaji</h2>
          <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Data sinkronisasi presensi biometric mesin fingerprint dari database MySQL.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchFingerprintData}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Device Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {devices.map((d) => (
          <div className="card" key={d.id} style={{ padding: '12px', borderLeft: '4px solid #059669' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '0.82rem' }}>{d.nama_device}</strong>
              <span className={`badge ${d.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                <Wifi size={10} /> {d.status_koneksi}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              IP: <code>{d.ip_address}:{d.port}</code> | SN: {d.sn_device}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
              Lokasi: {d.lokasi} ({d.peruntukan})
            </div>
          </div>
        ))}
      </div>

      {/* Tabel Log Presensi Fingerprint */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Rekap Presensi Fingerprint Terkini</h3>
          <span className="badge badge-info">Total: {absensiList.length} Rekap</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data presensi fingerprint...
          </div>
        ) : absensiList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada log scan fingerprint tercatat di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tanggal & Waktu Scan</th>
                <th>Nama Santri</th>
                <th>Sesi Kegiatan</th>
                <th>PIN Mesin</th>
                <th>Status</th>
                <th>Perangkat Mesin</th>
              </tr>
            </thead>
            <tbody>
              {absensiList.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                      {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={11} /> {row.waktu_scan || '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>NIS: {row.nis}</div>
                  </td>
                  <td>
                    <span className="badge badge-info">{row.nama_sesi}</span>
                  </td>
                  <td>
                    <code>PIN: {row.fingerprint_pin || '-'}</code>
                  </td>
                  <td>
                    <span className={`badge ${
                      row.status.includes('Tepat') ? 'badge-success' : 
                      row.status.includes('Terlambat') ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>{row.nama_device || 'Mesin Fingerprint'}</div>
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
