import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, Plus, Loader2, Wifi, Server } from 'lucide-react';

export default function FingerprintDeviceView() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/fingerprint/devices');
      if (res.data && res.data.success) {
        setDevices(res.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data perangkat fingerprint:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div>
      <div className="page-title-strip">
        <div className="page-title-left">
          <Fingerprint size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Perangkat Mesin Fingerprint</h2>
            <p>Konfigurasi koneksi IP address, port 4370, nomor seri, dan lokasi penempatan mesin</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} /> Tambah Mesin
        </button>
      </div>

      <div className="table-container-card">
        <div className="card-header">
          <h3>📋 Daftar Mesin Biometric Fingerprint</h3>
          <span className="badge badge-info">Total: {devices.length} Unit</span>
        </div>
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data mesin...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '50px' }}>NO</th>
                <th>NAMA PERANGKAT</th>
                <th>SERIAL NUMBER (SN)</th>
                <th>IP & PORT</th>
                <th>LOKASI PENEMPATAN</th>
                <th className="td-center">PERUNTUKAN</th>
                <th className="td-center">STATUS KONEKSI</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d, idx) => (
                <tr key={d.id || idx}>
                  <td className="td-center" style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.nama_device}</div>
                  </td>
                  <td>
                    <code>{d.sn_device}</code>
                  </td>
                  <td>
                    <strong>{d.ip_address}</strong>:{d.port}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.lokasi}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${d.peruntukan === 'Ikhwan' ? 'badge-info' : d.peruntukan === 'Akhwat' ? 'badge-purple' : 'badge-success'}`}>
                      {d.peruntukan}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${d.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                      <Wifi size={10} /> {d.status_koneksi}
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
