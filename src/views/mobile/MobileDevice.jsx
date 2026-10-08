import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HardDrive, Wifi, Plus, Edit3, Trash2, X, Save, Loader2, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MobileDevice() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_device: '',
    sn_device: '',
    ip_address: '192.168.1.201',
    port: 4370,
    lokasi: '',
    peruntukan: 'Semua',
    status_koneksi: 'Online'
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultDevices = [
    { id: 1, nama_device: 'Mesin Fingerprint Masjid Utama (Putra)', sn_device: 'FP-MSJ-PUTRA-01', ip_address: '192.168.1.201', port: 4370, lokasi: 'Pintu Masuk Masjid Utama', peruntukan: 'Ikhwan', status_koneksi: 'Online' },
    { id: 2, nama_device: 'Mesin Fingerprint Musholla Putri', sn_device: 'FP-MSH-PUTRI-02', ip_address: '192.168.1.202', port: 4370, lokasi: 'Pintu Masuk Musholla', peruntukan: 'Akhwat', status_koneksi: 'Online' },
    { id: 3, nama_device: 'Mesin Fingerprint Aula Mengaji', sn_device: 'FP-AULA-TAKLIM-03', ip_address: '192.168.1.203', port: 4370, lokasi: 'Aula Pengajian Syaikh Nawawi', peruntukan: 'Semua', status_koneksi: 'Online' }
  ];

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/fingerprint/devices');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setDevices(res.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('master_device_list') || 'null');
        setDevices(saved || defaultDevices);
      }
    } catch (err) {
      console.warn('API error, falling back to local devices:', err);
      const saved = JSON.parse(localStorage.getItem('master_device_list') || 'null');
      setDevices(saved || defaultDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    const randNum = Math.floor(100 + Math.random() * 900);
    setFormData({
      ...initialForm,
      nama_device: 'Mesin Fingerprint Baru',
      sn_device: `FP-DEV-${randNum}`,
      ip_address: `192.168.1.${randNum}`,
      lokasi: 'Gedung Utama'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      nama_device: item.nama_device || item.nama || '',
      sn_device: item.sn_device || item.sn || '',
      ip_address: item.ip_address || item.ip || '192.168.1.201',
      port: item.port || 4370,
      lokasi: item.lokasi || '',
      peruntukan: item.peruntukan || 'Semua',
      status_koneksi: item.status_koneksi || item.status || 'Online'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/fingerprint/devices', formData);
      } else {
        await axios.put(`/api/fingerprint/devices/${formData.id}`, formData);
      }
      
      setDevices(prev => {
        let next;
        if (formMode === 'add') {
          next = [...prev, { ...formData, id: Date.now() }];
        } else {
          next = prev.map(item => item.id === formData.id ? { ...item, ...formData } : item);
        }
        localStorage.setItem('master_device_list', JSON.stringify(next));
        return next;
      });

      fetchDevices();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API error during save, updating local state:', err);
      setDevices(prev => {
        let next;
        if (formMode === 'add') {
          next = [...prev, { ...formData, id: Date.now() }];
        } else {
          next = prev.map(item => item.id === formData.id ? { ...item, ...formData } : item);
        }
        localStorage.setItem('master_device_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus mesin fingerprint ini?')) return;
    try {
      await axios.delete(`/api/fingerprint/devices/${id}`);
      setDevices(prev => {
        const next = prev.filter(item => item.id !== id);
        localStorage.setItem('master_device_list', JSON.stringify(next));
        return next;
      });
      fetchDevices();
    } catch (err) {
      console.warn('API error during delete, fallback local:', err);
      setDevices(prev => {
        const next = prev.filter(item => item.id !== id);
        localStorage.setItem('master_device_list', JSON.stringify(next));
        return next;
      });
    }
  };

  const filteredDevices = devices.filter(d => {
    const q = searchQuery.toLowerCase();
    const nama = (d.nama_device || d.nama || '').toLowerCase();
    const sn = (d.sn_device || d.sn || '').toLowerCase();
    const ip = (d.ip_address || d.ip || '').toLowerCase();
    const lokasi = (d.lokasi || '').toLowerCase();
    return nama.includes(q) || sn.includes(q) || ip.includes(q) || lokasi.includes(q);
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>

      {/* Input Cari */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari mesin, SN, IP, atau lokasi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '0.85rem',
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div>Memuat data mesin fingerprint...</div>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <HardDrive size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Mesin Fingerprint Tidak Ditemukan</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Coba ubah kata kunci pencarian atau tambah mesin baru</div>
        </div>
      ) : (
        /* List Device Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredDevices.map((d) => {
            const isOnline = (d.status_koneksi || d.status || 'Online') === 'Online';
            return (
              <div key={d.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700 }}>
                    SN: {d.sn_device || d.sn}
                  </span>
                  <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`} style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: isOnline ? '#dcfce7' : '#fee2e2',
                    color: isOnline ? '#15803d' : '#b91c1c'
                  }}>
                    {isOnline ? '🟢 Online' : '🔴 Offline'}
                  </span>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a', marginBottom: '6px' }}>
                  {d.nama_device || d.nama}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                  <div>📍 <strong>Lokasi:</strong> {d.lokasi || '-'}</div>
                  <div>🌐 <strong>IP Address:</strong> {d.ip_address || d.ip || '-'}:{d.port || 4370}</div>
                  <div>👥 <strong>Peruntukan:</strong> {d.peruntukan || 'Semua'}</div>
                </div>

                {/* Tombol Aksi Mobile */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleOpenEdit(d)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxHeight: '90vh',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px',
            overflowY: 'auto',
            boxShadow: '0 -10px 25px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {formMode === 'add' ? '➕ Tambah Mesin Fingerprint' : '✏️ Edit Mesin Fingerprint'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nama Mesin Fingerprint *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mesin Fingerprint Masjid Utama"
                  value={formData.nama_device}
                  onChange={(e) => setFormData({ ...formData, nama_device: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Serial Number (SN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: FP-MSJ-01"
                    value={formData.sn_device}
                    onChange={(e) => setFormData({ ...formData, sn_device: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Peruntukan
                  </label>
                  <select
                    value={formData.peruntukan}
                    onChange={(e) => setFormData({ ...formData, peruntukan: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', background: '#ffffff' }}
                  >
                    <option value="Ikhwan">Ikhwan (Putra)</option>
                    <option value="Akhwat">Akhwat (Putri)</option>
                    <option value="Semua">Semua (Umum)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    IP Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.201"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Port
                  </label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 4370 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Lokasi Pemasangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pintu Masuk Masjid Utama"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Status Koneksi
                </label>
                <select
                  value={formData.status_koneksi}
                  onChange={(e) => setFormData({ ...formData, status_koneksi: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', background: '#ffffff' }}
                >
                  <option value="Online">🟢 Online</option>
                  <option value="Offline">🔴 Offline</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#334155',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) Warna Biru Gaya Live Chat */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Mesin Fingerprint Baru"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '80px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999
        }}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
