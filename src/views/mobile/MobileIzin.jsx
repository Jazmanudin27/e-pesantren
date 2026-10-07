import React from 'react';
import { DoorOpen, Plus, QrCode, Clock, CheckCircle } from 'lucide-react';

export default function MobileIzin() {
  return (
    <div style={{ padding: '16px' }}>
      {/* Tombol Ajukan Izin */}
      <button className="btn btn-primary" style={{ width: '100%', marginBottom: '20px', padding: '14px', borderRadius: '14px', fontSize: '0.95rem' }}>
        <Plus size={18} /> Ajukan Izin Pulang / Keluar
      </button>

      {/* Kartu Izin Terkini dengan Barcode Gerbang */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 800, color: '#064e3b', fontSize: '0.95rem' }}>Surat Izin Pulang Aktif</span>
          <span className="badge badge-success">Disetujui Pengasuh</span>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px dashed #e2e8f0', borderTop: '1px dashed #e2e8f0', margin: '10px 0' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Tunjukkan barcode ini ke Pos Satpam Gerbang</div>
          <div style={{ background: '#f8fafc', display: 'inline-flex', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <QrCode size={90} color="#064e3b" />
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669', marginTop: '6px' }}>KODE: BC-88391</div>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div><strong>Keperluan:</strong> Acara Keluarga & Walimah</div>
          <div><strong>Penjemput / Mahrom:</strong> H. Rahman (Ayah Kandung)</div>
          <div><strong>Waktu Izin:</strong> 05 Okt 2026 s/d 10 Okt 2026</div>
        </div>
      </div>
    </div>
  );
}
