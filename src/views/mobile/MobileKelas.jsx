import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GraduationCap, Users, Clock, Plus, Edit3, Trash2, X, Save, Loader2, BookOpen } from 'lucide-react';

export default function MobileKelas() {
  const [halaqahList, setHalaqahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_halaqah: '',
    kode_halaqah: '',
    pengampu: 'Ust. Ahmad Fauzi',
    target_program: 'Saba\' / Sabqi (Juz 1-5)',
    waktu_halaqah: 'Ba\'da Shubuh & Maghrib',
    lokasi_halaqah: 'Masjid Utama',
    gender: 'L',
    total_santri: 12
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultHalaqah = [
    { id: 1, nama_halaqah: "Halaqah Imam Nafi' (Putra)", pengampu: 'Ust. Ahmad Fauzi', target_program: 'Saba\' / Sabqi (Juz 15-20)', waktu_halaqah: 'Ba\'da Shubuh & Maghrib', lokasi_halaqah: 'Masjid Utama', total_santri: 12, gender: 'L' },
    { id: 2, nama_halaqah: "Halaqah Imam Ashim (Putra)", pengampu: 'Ust. Ridwan Kamil', target_program: 'Muroja\'ah Mutqin (Juz 25-30)', waktu_halaqah: 'Ba\'da Shubuh & Ashar', lokasi_halaqah: 'Aula Pengajian', total_santri: 15, gender: 'L' },
    { id: 3, nama_halaqah: "Halaqah Fathimah (Putri)", pengampu: 'Usth. Siti Maryam', target_program: 'Ziyadah Juz 1-5 & Mutaba\'ah', waktu_halaqah: 'Ba\'da Shubuh & Isya', lokasi_halaqah: 'Musholla Putri', total_santri: 12, gender: 'P' }
  ];

  const fetchHalaqah = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tahfidz/halaqah');
      if (res.data && res.data.success && res.data.data && res.data.data.length) {
        setHalaqahList(res.data.data);
      } else {
        setHalaqahList(defaultHalaqah);
      }
    } catch (err) {
      setHalaqahList(defaultHalaqah);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalaqah();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    const suffix = Date.now().toString().slice(-3);
    setFormData({
      ...initialForm,
      kode_halaqah: `HLQ-${suffix}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h) => {
    setFormMode('edit');
    setFormData({
      id: h.id,
      nama_halaqah: h.nama_halaqah || h.nama || '',
      kode_halaqah: h.kode_halaqah || `HLQ-${h.id}`,
      pengampu: h.nama_asatidz || h.pengampu || 'Ust. Ahmad Fauzi',
      target_program: h.target_program || h.target || 'Ziyadah Juz',
      waktu_halaqah: h.waktu_halaqah || h.waktu || 'Ba\'da Shubuh',
      lokasi_halaqah: h.lokasi_halaqah || 'Masjid Utama',
      gender: h.gender || 'L',
      total_santri: h.total_santri || h.total || 10
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        const res = await axios.post('/api/tahfidz/halaqah', formData);
        if (res.data && res.data.success) {
          fetchHalaqah();
        } else {
          setHalaqahList(prev => [...prev, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/tahfidz/halaqah/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchHalaqah();
        } else {
          setHalaqahList(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } : item));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      if (formMode === 'add') {
        setHalaqahList(prev => [...prev, { ...formData, id: Date.now() }]);
      } else {
        setHalaqahList(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } : item));
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus halaqah/kelas "${nama}"?`)) {
      try {
        await axios.delete(`/api/tahfidz/halaqah/${id}`);
        fetchHalaqah();
      } catch (err) {
        setHalaqahList(prev => prev.filter(h => h.id !== id));
      }
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* List Halaqah Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '0.84rem' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Memuat data halaqah & kelas...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {halaqahList.map((h) => {
            const nama = h.nama_halaqah || h.nama;
            const pengampu = h.nama_asatidz || h.pengampu || 'Ust. Ahmad Fauzi';
            const gender = h.gender === 'P' || h.gender === 'Akhwat' ? 'Akhwat' : 'Ikhwan';
            const target = h.target_program || h.target || 'Ziyadah Juz';
            const waktu = h.waktu_halaqah || h.waktu || 'Ba\'da Shubuh';
            const total = h.total_santri || h.total || 10;

            return (
              <div key={h.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge ${gender === 'Ikhwan' ? 'badge-info' : 'badge-purple'}`}>{gender}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(h)}
                      style={{ background: '#cffaff', color: '#0891b2', border: '1px solid #a5f3fc', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(h.id, nama)}
                      style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>

                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>{nama}</div>
                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginBottom: '8px' }}>Pengampu: {pengampu}</div>

                <div style={{ fontSize: '0.76rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>🎯 <strong>Target:</strong> {target}</div>
                  <div>⏰ <strong>Jadwal:</strong> {waktu}</div>
                  <div>👥 <strong>Kapasitas:</strong> {total} Santri Binaan</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT HALAQAH */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                {formMode === 'add' ? '➕ Tambah Kelas / Halaqah' : '✏️ Edit Kelas / Halaqah'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NAMA HALAQAH / KELAS</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Halaqah Imam Nafi' (Putra)"
                  value={formData.nama_halaqah}
                  onChange={(e) => setFormData({ ...formData, nama_halaqah: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>KODE HALAQAH</label>
                  <input 
                    type="text" 
                    required
                    value={formData.kode_halaqah}
                    onChange={(e) => setFormData({ ...formData, kode_halaqah: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>GENDER SANTRI</label>
                  <select 
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  >
                    <option value="L">Ikhwan (Putra)</option>
                    <option value="P">Akhwat (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>USTADZ PENGAMPU</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nama Ustadz Pengampu"
                  value={formData.pengampu}
                  onChange={(e) => setFormData({ ...formData, pengampu: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>TARGET PROGRAM HAFALAN</label>
                <input 
                  type="text" 
                  placeholder="Saba' / Sabqi (Juz 1-5)"
                  value={formData.target_program}
                  onChange={(e) => setFormData({ ...formData, target_program: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>JADWAL & WAKTU</label>
                <input 
                  type="text" 
                  placeholder="Ba'da Shubuh & Maghrib"
                  value={formData.waktu_halaqah}
                  onChange={(e) => setFormData({ ...formData, waktu_halaqah: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Data Kelas'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) Warna Biru Gaya Live Chat */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Kelas Baru"
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
