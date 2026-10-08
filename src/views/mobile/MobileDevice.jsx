import React from 'react';
import { HardDrive, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MobileDevice() {
  const devices = [
    { id: 1, nama: 'Mesin Fingerprint Masjid Utama (Putra)', sn: 'FP-MSJ-PUTRA-01', ip: '192.168.1.201', lokasi: 'Pintu Masuk Masjid Utama', peruntukan: 'Ikhwan', status: 'Online', enrolled: 120 },
    { id: 2, nama: 'Mesin Fingerprint Musholla Putri', sn: 'FP-MSH-PUTRI-02', ip: '192.168.1.202', lokasi: 'Pintu Masuk Musholla', peruntukan: 'Akhwat', status: 'Online', enrolled: 60 },
    { id: 3, nama: 'Mesin Fingerprint Aula Mengaji', sn: 'FP-AULA-TAKLIM-03', ip: '192.168.1.203', lokasi: 'Aula Pengajian Syaikh Nawawi', peruntukan: 'Semua', status: 'Online', enrolled: 180 }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Fingerprint */}
      <div style={{
        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(71, 85, 105, 0.25)'
      }}>
        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Hardware Biometrik</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Mesin Fingerprint</div>
        <div style={{ fontSize: '0.8rem', color: '#f1f5f9' }}>3 Perangkat Online & Terhubung</div>
      </div>

      {/* List Device Card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {devices.map((d) => (
          <div key={d.id} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700 }}>SN: {d.sn}</span>
              <span className="badge badge-success">🟢 {d.status}</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '6px' }}>{d.nama}</div>

            <div style={{ fontSize: '0.76rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>📍 <strong>Lokasi:</strong> {d.lokasi}</div>
              <div>🌐 <strong>IP Address:</strong> {d.ip}</div>
              <div>👤 <strong>Enrolled:</strong> {d.enrolled} User (PIN & Sidik Jari)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
