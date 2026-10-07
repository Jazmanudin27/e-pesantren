import React from 'react';
import { DoorOpen, CheckCircle, XCircle, Clock, QrCode, Plus } from 'lucide-react';

export default function PerizinanView() {
  const izinList = [
    { id: 'IZN-2610-001', santri: 'Bilal Abdurrahman', kamar: 'Utsman / 03', jenis: 'Izin Pulang', tglKeluar: '05 Okt 2026', tglKembali: '10 Okt 2026', mahrom: 'H. Rahman (Ayah Kandung)', status: 'Aktif Keluar', barcode: 'BC-88391' },
    { id: 'IZN-2610-002', santri: 'Syifa Nurul Izzah', kamar: 'Khadijah / 02', jenis: 'Izin Berobat', tglKeluar: '07 Okt 2026', tglKembali: '08 Okt 2026', mahrom: 'Ibu Aminah (Ibu)', status: 'Perlu Kembali Hari Ini', barcode: 'BC-88392' },
    { id: 'IZN-2610-003', santri: 'Fajar Shiddiq', kamar: 'Ali / 02', jenis: 'Izin Keluar Komplek', tglKeluar: '07 Okt 2026 (14:00)', tglKembali: '07 Okt 2026 (17:00)', mahrom: 'Mandiri (Keperluan Kitab)', status: 'Menunggu Approval Pengasuh', barcode: 'BC-88393' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Perizinan Keluar / Pulang Santri</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Sistem keamanan terintegrasi gerbang pos satpam pesantren, validasi mahrom & barcode digital.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={16} /> Buat Surat Izin Santri
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>🚪 Riwayat & Status Perizinan Santri</h3>
          <span className="badge badge-purple">Scan Barcode Gerbang</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Kode Izin</th>
              <th>Nama Santri</th>
              <th>Jenis Izin</th>
              <th>Rentang Waktu</th>
              <th>Penjemput / Mahrom</th>
              <th>Status</th>
              <th>Aksi Satpam / TU</th>
            </tr>
          </thead>
          <tbody>
            {izinList.map((row) => (
              <tr key={row.id}>
                <td>
                  <span style={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <QrCode size={14} /> {row.barcode}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{row.santri}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{row.kamar}</div>
                </td>
                <td><span className="badge badge-info">{row.jenis}</span></td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>Keluar: {row.tglKeluar}</div>
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>Kembali: {row.tglKembali}</div>
                </td>
                <td>{row.mahrom}</td>
                <td>
                  <span className={`badge ${
                    row.status.includes('Aktif') ? 'badge-success' : 
                    row.status.includes('Perlu') ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                      <CheckCircle size={14} /> Check-In Masuk
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
