import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Plus, Edit3, Trash2, X, Save, Loader2, Search, CheckCircle, Award } from 'lucide-react';

export default function MobileTahfidz() {
  const [setoranList, setSetoranList] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    santri_id: 1,
    jenis_setoran: 'Ziyadah',
    juz: 15,
    surat_mulai: 'Al-Isra\'',
    ayat_mulai: 1,
    surat_selesai: 'Al-Isra\'',
    ayat_selesai: 25,
    kualitas_tajwid: 'Mumtaz (A)',
    status: 'Lulus',
    catatan: '',
    tanggal: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultSetoran = [
    { id: 1, santri_id: 1, nama_santri: 'Muhammad Al-Fatih', jenis_setoran: 'Ziyadah', juz: 15, surat_mulai: 'Al-Isra\'', ayat_mulai: 1, surat_selesai: 'Al-Isra\'', ayat_selesai: 25, kualitas_tajwid: 'Mumtaz (A)', status: 'Lulus', tanggal: '2026-10-07' },
    { id: 2, santri_id: 2, nama_santri: 'Ahmad Dahlan', jenis_setoran: 'Muroja\'ah', juz: 14, surat_mulai: 'An-Nahl', ayat_mulai: 1, surat_selesai: 'An-Nahl', ayat_selesai: 60, kualitas_tajwid: 'Jayyid Jiddan (B+)', status: 'Lulus', tanggal: '2026-10-06' },
    { id: 3, santri_id: 3, nama_santri: 'Khadijah Az-Zahra', jenis_setoran: 'Sabqi', juz: 14, surat_mulai: 'Juz 14', ayat_mulai: 1, surat_selesai: 'Juz 14 Full', ayat_selesai: 99, kualitas_tajwid: 'Mumtaz (A)', status: 'Lulus', tanggal: '2026-10-05' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSetoran, resSantri] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/santri')
      ]);

      if (resSantri.data && resSantri.data.data) {
        setSantriOptions(resSantri.data.data);
      }

      if (resSetoran.data && resSetoran.data.recentSetoran && resSetoran.data.recentSetoran.length > 0) {
        setSetoranList(resSetoran.data.recentSetoran);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_tahfidz_list') || 'null');
        setSetoranList(saved || defaultSetoran);
      }
    } catch (err) {
      console.warn('API error, falling back to local tahfidz:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_tahfidz_list') || 'null');
      setSetoranList(saved || defaultSetoran);
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
      tanggal: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || 1,
      jenis_setoran: item.jenis_setoran || 'Ziyadah',
      juz: item.juz || 1,
      surat_mulai: item.surat_mulai || '',
      ayat_mulai: item.ayat_mulai || 1,
      surat_selesai: item.surat_selesai || '',
      ayat_selesai: item.ayat_selesai || 1,
      kualitas_tajwid: item.kualitas_tajwid || 'Mumtaz (A)',
      status: item.status || 'Lulus',
      catatan: item.catatan || '',
      tanggal: item.tanggal ? String(item.tanggal).split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/tahfidz/setoran', formData);
      } else {
        await axios.put(`/api/tahfidz/setoran/${formData.id}`, formData);
      }

      setSetoranList(prev => {
        let next;
        const selectedSantri = santriOptions.find(s => s.id === parseInt(formData.santri_id));
        const itemObj = {
          ...formData,
          nama_santri: selectedSantri ? selectedSantri.nama_santri : 'Santri'
        };

        if (formMode === 'add') {
          next = [itemObj, ...prev];
        } else {
          next = prev.map(i => i.id === formData.id ? itemObj : i);
        }
        localStorage.setItem('mobile_tahfidz_list', JSON.stringify(next));
        return next;
      });

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API save fallback local:', err);
      setSetoranList(prev => {
        let next;
        const selectedSantri = santriOptions.find(s => s.id === parseInt(formData.santri_id));
        const itemObj = {
          ...formData,
          nama_santri: selectedSantri ? selectedSantri.nama_santri : 'Santri',
          id: Date.now()
        };

        if (formMode === 'add') {
          next = [itemObj, ...prev];
        } else {
          next = prev.map(i => i.id === formData.id ? itemObj : i);
        }
        localStorage.setItem('mobile_tahfidz_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data setoran ini?')) return;
    try {
      await axios.delete(`/api/tahfidz/setoran/${id}`);
      setSetoranList(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_tahfidz_list', JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.warn('API delete fallback local:', err);
      setSetoranList(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_tahfidz_list', JSON.stringify(next));
        return next;
      });
    }
  };

  const filteredList = setoranList.filter(s => {
    const q = searchQuery.toLowerCase();
    const nama = (s.nama_santri || '').toLowerCase();
    const surat = (s.surat_mulai || '').toLowerCase();
    const jenis = (s.jenis_setoran || '').toLowerCase();
    return nama.includes(q) || surat.includes(q) || jenis.includes(q);
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Header Info */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 16px rgba(6, 78, 59, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>Mutaba'ah & Setoran Qur'an</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Tahfidz Mobile</div>
          <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{setoranList.length} Record Setoran Terdaftar</div>
        </div>
      </div>

      {/* Input Cari */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri, surat, jenis setoran..."
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

      {/* List Setoran Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div>Memuat riwayat setoran...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <BookOpen size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Tidak Ada Setoran Hafalan</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tekan tombol "Input Setoran" untuk menambahkan record baru</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((r) => (
            <div key={r.id} style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {r.tanggal ? String(r.tanggal).split('T')[0] : '-'}
                </span>
                <span className={`badge ${r.jenis_setoran === 'Ziyadah' ? 'badge-success' : 'badge-info'}`}>
                  {r.jenis_setoran || 'Ziyadah'}
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a', marginBottom: '2px' }}>
                👤 {r.nama_santri || 'Santri'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 700, marginBottom: '6px' }}>
                📖 Juz {r.juz || 1} • {r.surat_mulai} ({r.ayat_mulai}) s/d {r.surat_selesai} ({r.ayat_selesai})
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                <span style={{ color: '#059669', fontWeight: 700 }}>Nilai: {r.kualitas_tajwid || 'Mumtaz (A)'}</span>
                <span style={{ color: '#0369a1', fontWeight: 600 }}>Status: {r.status || 'Lulus'}</span>
              </div>

              {/* Tombol Aksi */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <button
                  onClick={() => handleOpenEdit(r)}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
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
                {formMode === 'add' ? '➕ Input Setoran Tahfidz' : '✏️ Edit Setoran Tahfidz'}
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Jenis Setoran</label>
                  <select
                    value={formData.jenis_setoran}
                    onChange={(e) => setFormData({ ...formData, jenis_setoran: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                    <option value="Muroja'ah">Muroja'ah (Mengulang)</option>
                    <option value="Sabqi">Sabqi (Setoran Terdekat)</option>
                    <option value="Tasmi' Bil-Ghoib">Tasmi' Bil-Ghoib</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Juz *</label>
                  <input
                    type="number" required min={1} max={30}
                    value={formData.juz}
                    onChange={(e) => setFormData({ ...formData, juz: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Surat Mulai *</label>
                  <input
                    type="text" required placeholder="Contoh: Al-Isra'"
                    value={formData.surat_mulai}
                    onChange={(e) => setFormData({ ...formData, surat_mulai: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Ayat Mulai</label>
                  <input
                    type="number" required min={1}
                    value={formData.ayat_mulai}
                    onChange={(e) => setFormData({ ...formData, ayat_mulai: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Surat Selesai *</label>
                  <input
                    type="text" required placeholder="Contoh: Al-Isra'"
                    value={formData.surat_selesai}
                    onChange={(e) => setFormData({ ...formData, surat_selesai: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Ayat Selesai</label>
                  <input
                    type="number" required min={1}
                    value={formData.ayat_selesai}
                    onChange={(e) => setFormData({ ...formData, ayat_selesai: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Kualitas Tajwid</label>
                  <select
                    value={formData.kualitas_tajwid}
                    onChange={(e) => setFormData({ ...formData, kualitas_tajwid: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Mumtaz (A)">Mumtaz (A)</option>
                    <option value="Jayyid Jiddan (B+)">Jayyid Jiddan (B+)</option>
                    <option value="Jayyid (B)">Jayyid (B)</option>
                    <option value="Maqbul (C)">Maqbul (C)</option>
                    <option value="Rombak/Ulang">Rombak/Ulang</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Tanggal Setoran</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#064e3b', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
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
        title="Input Setoran Tahfidz Baru"
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
