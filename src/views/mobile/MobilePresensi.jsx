import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, Clock, Plus, Edit3, Trash2, X, Save, Loader2, Search, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export default function MobilePresensi() {
  const [presensiLogs, setPresensiLogs] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    santri_id: 1,
    sesi_id: 1,
    device_id: 1,
    status_kehadiran: 'Hadir Tepat Waktu',
    mnt_keterlambatan: 0,
    metode_scan: 'Fingerprint',
    keteledoran_keterangan: '',
    waktu_scan: new Date().toTimeString().split(' ')[0]
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultLogs = [
    { id: 1, santri_id: 1, nama_santri: 'Muhammad Al-Fatih', tgl: '2026-10-08', jam: '04:38 WIB', kegiatan: 'Shalat Shubuh Berjamaah', tempat: 'Masjid Utama', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' },
    { id: 2, santri_id: 2, nama_santri: 'Ahmad Dahlan', tgl: '2026-10-08', jam: '05:35 WIB', kegiatan: 'Mengaji Qur\'an / Halaqah Pagi', tempat: 'Aula Mengaji', status: 'Hadir Tepat Waktu', verify: 'Fingerprint' },
    { id: 3, santri_id: 3, nama_santri: 'Khadijah Az-Zahra', tgl: '2026-10-07', jam: '19:38 WIB', kegiatan: 'Shalat Isya Berjamaah', tempat: 'Masjid Utama', status: 'Terlambat 8 Mnt', verify: 'PIN Kode' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAbs, resSantri] = await Promise.all([
        axios.get('/api/absensi-fingerprint'),
        axios.get('/api/santri')
      ]);

      if (resSantri.data && resSantri.data.data) {
        setSantriOptions(resSantri.data.data);
      }

      if (resAbs.data && resAbs.data.data && resAbs.data.data.length > 0) {
        setPresensiLogs(resAbs.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_presensi_list') || 'null');
        setPresensiLogs(saved || defaultLogs);
      }
    } catch (err) {
      console.warn('API error, fallback local:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_presensi_list') || 'null');
      setPresensiLogs(saved || defaultLogs);
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
      waktu_scan: new Date().toTimeString().split(' ')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || 1,
      sesi_id: item.sesi_id || 1,
      device_id: item.device_id || 1,
      status_kehadiran: item.status_kehadiran || item.status || 'Hadir Tepat Waktu',
      mnt_keterlambatan: item.mnt_keterlambatan || 0,
      metode_scan: item.metode_scan || item.verify || 'Fingerprint',
      keteledoran_keterangan: item.keteledoran_keterangan || '',
      waktu_scan: item.waktu_scan || new Date().toTimeString().split(' ')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/absensi-fingerprint', formData);
      } else {
        await axios.put(`/api/absensi-fingerprint/${formData.id}`, formData);
      }

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API save fallback local:', err);
      setPresensiLogs(prev => {
        let next;
        const selectedSantri = santriOptions.find(s => s.id === parseInt(formData.santri_id));
        const itemObj = {
          ...formData,
          nama_santri: selectedSantri ? selectedSantri.nama_santri : 'Santri',
          kegiatan: 'Shalat / Ngaji Berjamaah',
          tempat: 'Masjid / Aula',
          tgl: new Date().toISOString().split('T')[0],
          jam: `${formData.waktu_scan} WIB`,
          status: formData.status_kehadiran,
          verify: formData.metode_scan,
          id: Date.now()
        };

        if (formMode === 'add') {
          next = [itemObj, ...prev];
        } else {
          next = prev.map(i => i.id === formData.id ? { ...i, ...itemObj } : i);
        }
        localStorage.setItem('mobile_presensi_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus record presensi ini?')) return;
    try {
      await axios.delete(`/api/absensi-fingerprint/${id}`);
      fetchData();
    } catch (err) {
      console.warn('API delete fallback local:', err);
      setPresensiLogs(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_presensi_list', JSON.stringify(next));
        return next;
      });
    }
  };

  const filteredLogs = presensiLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const nama = (log.nama_santri || '').toLowerCase();
    const kegiatan = (log.kegiatan || log.nama_sesi || '').toLowerCase();
    const status = (log.status_kehadiran || log.status || '').toLowerCase();
    const matchesQuery = nama.includes(q) || kegiatan.includes(q) || status.includes(q);

    if (activeFilter === 'shalat') {
      return matchesQuery && (kegiatan.includes('shalat') || (log.kategori && log.kategori.toLowerCase().includes('shalat')));
    }
    if (activeFilter === 'halaqah') {
      return matchesQuery && (kegiatan.includes('ngaji') || kegiatan.includes('halaqah') || (log.kategori && log.kategori.toLowerCase().includes('mengaji')));
    }
    return matchesQuery;
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(124, 58, 237, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#ddd6fe' }}>Presensi Realtime Fingerprint</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Kehadiran Shalat & Ngaji</div>
          <div style={{ fontSize: '0.8rem', color: '#ede9fe' }}>{presensiLogs.length} Record Presensi Log</div>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            background: '#ffffff',
            color: '#6d28d9',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 14px',
            fontWeight: 800,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          <Plus size={16} /> Catat
        </button>
      </div>

      {/* Input Cari */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri, kegiatan, status..."
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

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveFilter('semua')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'semua' ? '#7c3aed' : '#ffffff', color: activeFilter === 'semua' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Semua Kegiatan
        </button>
        <button
          onClick={() => setActiveFilter('shalat')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'shalat' ? '#7c3aed' : '#ffffff', color: activeFilter === 'shalat' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Shalat Berjamaah
        </button>
        <button
          onClick={() => setActiveFilter('halaqah')}
          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeFilter === 'halaqah' ? '#7c3aed' : '#ffffff', color: activeFilter === 'halaqah' ? '#ffffff' : '#64748b', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
        >
          Halaqah Qur'an
        </button>
      </div>

      {/* List Presensi Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div>Memuat log presensi...</div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Fingerprint size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Tidak Ada Log Presensi</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tekan "Catat" untuk menginput presensi manual</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredLogs.map((log) => {
            const statusStr = log.status_kehadiran || log.status || 'Hadir Tepat Waktu';
            const isOk = statusStr.includes('Tepat') || statusStr.includes('Hadir');
            return (
              <div key={log.id} style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                    {log.tanggal ? String(log.tanggal).split('T')[0] : log.tgl} • {log.waktu_scan || log.jam}
                  </span>
                  <span className={`badge ${isOk ? 'badge-success' : 'badge-warning'}`}>
                    {statusStr}
                  </span>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>
                  👤 {log.nama_santri || 'Santri'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#6d28d9', marginBottom: '6px' }}>
                  📌 {log.kegiatan || log.nama_sesi || 'Shalat & Mengaji'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                  <span>📍 {log.nama_device || log.tempat || 'Masjid Utama'}</span>
                  <span style={{ color: '#7c3aed', fontWeight: 700 }}>{log.metode_scan || log.verify || 'Fingerprint'}</span>
                </div>

                {/* Tombol Edit / Delete */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <button
                    onClick={() => handleOpenEdit(log)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#b91c1c', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
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
                {formMode === 'add' ? '➕ Input Presensi Santri' : '✏️ Edit Presensi Santri'}
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Status Kehadiran</label>
                  <select
                    value={formData.status_kehadiran}
                    onChange={(e) => setFormData({ ...formData, status_kehadiran: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Hadir Tepat Waktu">🟢 Hadir Tepat Waktu</option>
                    <option value="Terlambat">🟡 Terlambat</option>
                    <option value="Izin">🔵 Izin</option>
                    <option value="Sakit">🟣 Sakit</option>
                    <option value="Alpa / Tanpa Keterangan">🔴 Alpa / Tanpa Keterangan</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Metode Verifikasi</label>
                  <select
                    value={formData.metode_scan}
                    onChange={(e) => setFormData({ ...formData, metode_scan: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Fingerprint">Fingerprint</option>
                    <option value="PIN Kode">PIN Kode</option>
                    <option value="Manual Musyrif">Manual Musyrif</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Waktu Scan</label>
                  <input
                    type="text" required placeholder="04:38:00"
                    value={formData.waktu_scan}
                    onChange={(e) => setFormData({ ...formData, waktu_scan: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Keterlambatan (Menit)</label>
                  <input
                    type="number" min={0}
                    value={formData.mnt_keterlambatan}
                    onChange={(e) => setFormData({ ...formData, mnt_keterlambatan: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Catatan / Keterangan</label>
                <input
                  type="text" placeholder="Catatan tambahan (opsional)"
                  value={formData.keteledoran_keterangan}
                  onChange={(e) => setFormData({ ...formData, keteledoran_keterangan: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#7c3aed', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
