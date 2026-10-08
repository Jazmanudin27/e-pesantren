import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DoorOpen, Plus, QrCode, Clock, CheckCircle, Edit3, Trash2, X, Save, Loader2, Search, ArrowRightLeft } from 'lucide-react';

export default function MobileIzin() {
  const [izinList, setIzinList] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    santri_id: 1,
    jenis_izin: 'Izin Pulang',
    keperluan: 'Acara Keluarga & Walimah',
    nama_penjemput_mahrom: 'H. Rahman (Ayah)',
    no_hp_penjemput: '081234567890',
    hubungan_mahrom: 'Orang Tua (Ayah)',
    tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
    tgl_kembali_rencana: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    status: 'Disetujui Pengasuh'
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultIzin = [
    { id: 1, santri_id: 1, nama_santri: 'Muhammad Al-Fatih', kode_izin: 'IZN-9982-1204', barcode: 'PSN-IZN-88391', jenis_izin: 'Izin Pulang', status: 'Disetujui Pengasuh', keperluan: 'Acara Keluarga & Walimah', nama_penjemput_mahrom: 'H. Rahman (Ayah)', tgl_keluar_rencana: '2026-10-05 08:00', tgl_kembali_rencana: '2026-10-10 17:00' },
    { id: 2, santri_id: 2, nama_santri: 'Ahmad Dahlan', kode_izin: 'IZN-7712-3041', barcode: 'PSN-IZN-44102', jenis_izin: 'Izin Berobat', status: 'Aktif Keluar', keperluan: 'Pemeriksaan Gigi ke RSUD', nama_penjemput_mahrom: 'Siti Aminah (Ibu)', tgl_keluar_rencana: '2026-10-07 09:00', tgl_kembali_rencana: '2026-10-08 15:00' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resIzin, resSantri] = await Promise.all([
        axios.get('/api/perizinan'),
        axios.get('/api/santri')
      ]);

      if (resSantri.data && resSantri.data.data) {
        setSantriOptions(resSantri.data.data);
      }

      if (resIzin.data && resIzin.data.data && resIzin.data.data.length > 0) {
        setIzinList(resIzin.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_izin_list') || 'null');
        setIzinList(saved || defaultIzin);
      }
    } catch (err) {
      console.warn('API error, falling back to local perizinan:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_izin_list') || 'null');
      setIzinList(saved || defaultIzin);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      ...initialForm,
      santri_id: santriOptions[0]?.id || 1,
      tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || 1,
      jenis_izin: item.jenis_izin || 'Izin Pulang',
      keperluan: item.keperluan || '',
      nama_penjemput_mahrom: item.nama_penjemput_mahrom || '',
      no_hp_penjemput: item.no_hp_penjemput || '081234567890',
      hubungan_mahrom: item.hubungan_mahrom || 'Orang Tua',
      tgl_keluar_rencana: item.tgl_keluar_rencana ? String(item.tgl_keluar_rencana).replace(' ', 'T').slice(0, 16) : new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: item.tgl_kembali_rencana ? String(item.tgl_kembali_rencana).replace(' ', 'T').slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: item.status || 'Disetujui Pengasuh'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/perizinan', formData);
      } else {
        await axios.put(`/api/perizinan/${formData.id}`, formData);
      }

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API save fallback local:', err);
      setIzinList(prev => {
        let next;
        const selectedSantri = santriOptions.find(s => s.id === parseInt(formData.santri_id));
        const itemObj = {
          ...formData,
          nama_santri: selectedSantri ? selectedSantri.nama_santri : 'Santri',
          barcode: `PSN-IZN-${Date.now().toString().slice(-5)}`,
          kode_izin: `IZN-${Date.now().toString().slice(-4)}`,
          id: Date.now()
        };

        if (formMode === 'add') {
          next = [itemObj, ...prev];
        } else {
          next = prev.map(i => i.id === formData.id ? { ...i, ...itemObj } : i);
        }
        localStorage.setItem('mobile_izin_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus surat izin ini?')) return;
    try {
      await axios.delete(`/api/perizinan/${id}`);
      fetchData();
    } catch (err) {
      console.warn('API delete fallback local:', err);
      setIzinList(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_izin_list', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      if (newStatus === 'Aktif Keluar') {
        await axios.post('/api/perizinan/checkout', { id: item.id, satpam: 'Satpam Gerbang Mobile' });
      } else if (newStatus === 'Kembali Tepat Waktu') {
        await axios.post('/api/perizinan/checkin', { id: item.id, satpam: 'Satpam Gerbang Mobile' });
      } else {
        await axios.put(`/api/perizinan/${item.id}`, { ...item, status: newStatus });
      }
      fetchData();
    } catch (err) {
      setIzinList(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    }
  };

  const filteredList = izinList.filter(item => {
    const q = searchQuery.toLowerCase();
    const nama = (item.nama_santri || '').toLowerCase();
    const jenis = (item.jenis_izin || '').toLowerCase();
    const barcode = (item.barcode || '').toLowerCase();
    return nama.includes(q) || jenis.includes(q) || barcode.includes(q);
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Input Cari */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri, jenis izin, barcode..."
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

      {/* List Izin */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div>Memuat data perizinan santri...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <DoorOpen size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Tidak Ada Data Perizinan</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Klik "Ajukan Izin" untuk membuat perizinan baru</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredList.map((item) => (
            <div key={item.id} style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 3px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, color: '#0f766e', fontSize: '0.92rem' }}>
                  {item.jenis_izin}
                </span>
                <span className={`badge ${item.status.includes('Disetujui') || item.status.includes('Kembali') ? 'badge-success' : item.status.includes('Keluar') ? 'badge-warning' : 'badge-info'}`}>
                  {item.status}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>
                👤 {item.nama_santri || 'Santri'}
              </div>

              {/* Barcode Display */}
              <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px dashed #e2e8f0', borderTop: '1px dashed #e2e8f0', margin: '10px 0', background: '#fafafa', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>Scan Barcode Pos Satpam Gerbang</div>
                <div style={{ background: '#ffffff', display: 'inline-flex', padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <QrCode size={64} color="#0f766e" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0d9488', marginTop: '4px' }}>
                  KODE: {item.barcode || 'PSN-IZN-1234'}
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                <div>📝 <strong>Keperluan:</strong> {item.keperluan}</div>
                <div>🚗 <strong>Penjemput / Mahrom:</strong> {item.nama_penjemput_mahrom || '-'}</div>
                <div>📅 <strong>Waktu Rencana:</strong> {String(item.tgl_keluar_rencana).split('T')[0]} s/d {String(item.tgl_kembali_rencana).split('T')[0]}</div>
              </div>

              {/* Quick Action Checkout / Checkin */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  onClick={() => handleStatusChange(item, 'Aktif Keluar')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  🚪 Tap Keluar Gerbang
                </button>
                <button
                  onClick={() => handleStatusChange(item, 'Kembali Tepat Waktu')}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#166534', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}
                >
                  ✅ Tap Kembali Masuk
                </button>
              </div>

              {/* Tombol Edit / Delete */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <button
                  onClick={() => handleOpenEdit(item)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#b91c1c', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxHeight: '90vh',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '20px', overflowY: 'auto', boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                {formMode === 'add' ? '➕ Ajukan Permohonan Izin' : '✏️ Edit Permohonan Izin'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Pilih Santri *</label>
                <select
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                >
                  {santriOptions.length > 0 ? (
                    santriOptions.map(s => <option key={s.id} value={s.id}>{s.nama_santri} (NIS: {s.nis})</option>)
                  ) : (
                    <option value={1}>Muhammad Al-Fatih</option>
                  )}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Jenis Izin</label>
                  <select
                    value={formData.jenis_izin}
                    onChange={(e) => setFormData({ ...formData, jenis_izin: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Izin Pulang">Izin Pulang</option>
                    <option value="Izin Berobat">Izin Berobat</option>
                    <option value="Izin Keluar Komplek">Izin Keluar Komplek</option>
                    <option value="Izin Khusus">Izin Khusus</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Status Persetujuan</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                    <option value="Disetujui Pengasuh">Disetujui Pengasuh</option>
                    <option value="Aktif Keluar">Aktif Keluar</option>
                    <option value="Kembali Tepat Waktu">Kembali Tepat Waktu</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Keperluan / Alasan Izin *</label>
                <textarea
                  required rows={2} placeholder="Contoh: Acara keluarga dan walimah pernikahan saudara"
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Nama Penjemput (Mahrom)</label>
                  <input
                    type="text" placeholder="Contoh: H. Rahman (Ayah)"
                    value={formData.nama_penjemput_mahrom}
                    onChange={(e) => setFormData({ ...formData, nama_penjemput_mahrom: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>No WA Penjemput</label>
                  <input
                    type="text" placeholder="081234567890"
                    value={formData.no_hp_penjemput}
                    onChange={(e) => setFormData({ ...formData, no_hp_penjemput: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Rencana Keluar *</label>
                  <input
                    type="datetime-local" required
                    value={formData.tgl_keluar_rencana}
                    onChange={(e) => setFormData({ ...formData, tgl_keluar_rencana: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Rencana Kembali *</label>
                  <input
                    type="datetime-local" required
                    value={formData.tgl_kembali_rencana}
                    onChange={(e) => setFormData({ ...formData, tgl_kembali_rencana: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#0f766e', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) Warna Biru Gaya Live Chat */}
      <button
        onClick={handleOpenAdd}
        title="Ajukan Izin Santri Baru"
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
