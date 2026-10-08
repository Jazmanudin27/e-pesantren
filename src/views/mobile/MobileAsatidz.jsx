import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Phone, Mail, Award, GraduationCap, Plus, Edit3, Trash2, X, Save, Loader2 } from 'lucide-react';

export default function MobileAsatidz() {
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_asatidz: '',
    gelar: 'S.Pd.I',
    nik_niy: '',
    jk: 'L',
    tugas_utama: 'Musyrif & Pengajar Tahfidz',
    no_hp: '',
    email: '',
    alamat: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultAsatidz = [
    { id: 1, nama_asatidz: 'K.H. Abdullah Gymnastiar', gelar: 'Lc., M.Ag.', nik_niy: 'AST-2021-001', tugas_utama: 'Pimpinan & Pengasuh Utama', no_hp: '08122334455', email: 'kh.abdullah@pesantren.com' },
    { id: 2, nama_asatidz: 'Ust. Ahmad Fauzi', gelar: 'S.Pd.I, Al-Hafidz', nik_niy: 'AST-2022-004', tugas_utama: 'Kepala Bagian Tahfidz', no_hp: '081344556677', email: 'ahmad.fauzi@pesantren.com' },
    { id: 3, nama_asatidz: 'Ust. Hamdan', gelar: 'S.Th.I, Al-Hafidz', nik_niy: 'AS-2026-001', tugas_utama: 'Musyrif Tahfidz Ikhwan', no_hp: '081299990001', email: 'hamdan@pesantren.com' },
    { id: 4, nama_asatidz: 'Usth. Sarah Humaira', gelar: 'S.Th.I, Al-Hafidzah', nik_niy: 'AST-2022-009', tugas_utama: 'Koordinator Tahfidz Putri', no_hp: '081299887766', email: 'sarah.h@pesantren.com' }
  ];

  const fetchAsatidz = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asatidz');
      if (res.data && res.data.success && res.data.data && res.data.data.length) {
        setAsatidzList(res.data.data);
      } else {
        setAsatidzList(defaultAsatidz);
      }
    } catch (err) {
      setAsatidzList(defaultAsatidz);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsatidz();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    const suffix = Date.now().toString().slice(-4);
    setFormData({
      ...initialForm,
      nik_niy: `AST-2026-${suffix}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setFormMode('edit');
    setFormData({
      id: a.id,
      nama_asatidz: a.nama_asatidz || a.nama || '',
      gelar: a.gelar || '',
      nik_niy: a.nik_niy || a.nik || `AST-${a.id}`,
      jk: a.jk || 'L',
      tugas_utama: a.tugas_utama || a.tugas || 'Pengajar',
      no_hp: a.no_hp || a.hp || '',
      email: a.email || '',
      alamat: a.alamat || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        const res = await axios.post('/api/asatidz', formData);
        if (res.data && res.data.success) {
          fetchAsatidz();
        } else {
          setAsatidzList(prev => [...prev, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/asatidz/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchAsatidz();
        } else {
          setAsatidzList(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } : item));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      if (formMode === 'add') {
        setAsatidzList(prev => [...prev, { ...formData, id: Date.now() }]);
      } else {
        setAsatidzList(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } : item));
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data ustadz/musyrif "${nama}"?`)) {
      try {
        await axios.delete(`/api/asatidz/${id}`);
        fetchAsatidz();
      } catch (err) {
        setAsatidzList(prev => prev.filter(a => a.id !== id));
      }
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Asatidz */}
      <div style={{
        background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(147, 51, 234, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#f3e8ff' }}>Dewan Guru & Musyrif</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0' }}>Data Asatidz</div>
          <div style={{ fontSize: '0.76rem', color: '#faf5ff' }}>{asatidzList.length} Pengajar Active</div>
        </div>

        <button 
          onClick={handleOpenAdd}
          style={{
            background: '#ffffff',
            color: '#7e22ce',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          <Plus size={16} /> Tambah Guru
        </button>
      </div>

      {/* List Asatidz Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '0.84rem' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Memuat data asatidz...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {asatidzList.map((a) => {
            const nama = a.nama_asatidz || a.nama;
            const gelar = a.gelar || '';
            const nik = a.nik_niy || a.nik || `AST-${a.id}`;
            const tugas = a.tugas_utama || a.tugas || 'Pengajar';
            const hp = a.no_hp || a.hp || '-';

            return (
              <div key={a.id} style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>{nama} {gelar}</div>
                    <div style={{ fontSize: '0.74rem', color: '#9333ea', fontWeight: 700 }}>NIY: {nik}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(a)}
                      style={{ background: '#f3e8ff', color: '#9333ea', border: '1px solid #e9d5ff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(a.id, nama)}
                      style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155', margin: '8px 0', padding: '8px', background: '#faf5ff', borderRadius: '10px' }}>
                  <div>📋 <strong>Tugas Utama:</strong> {tugas}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748b' }}>
                  <span>📞 WA/HP: {hp}</span>
                  <span style={{ color: '#9333ea', fontWeight: 700 }}>Pengurus Active</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT ASATIDZ */}
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
                {formMode === 'add' ? '➕ Tambah Data Asatidz' : '✏️ Edit Data Asatidz'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NAMA LENGKAP USTADZ / USTADZAH</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Ust. Ahmad Fauzi"
                  value={formData.nama_asatidz}
                  onChange={(e) => setFormData({ ...formData, nama_asatidz: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>GELAR</label>
                  <input 
                    type="text" 
                    placeholder="S.Pd.I, Al-Hafidz"
                    value={formData.gelar}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NIY / NIK</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nik_niy}
                    onChange={(e) => setFormData({ ...formData, nik_niy: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>TUGAS UTAMA / JABATAN</label>
                <input 
                  type="text" 
                  required
                  placeholder="Musyrif Kobong & Pengajar Tahfidz"
                  value={formData.tugas_utama}
                  onChange={(e) => setFormData({ ...formData, tugas_utama: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NO WA / HP</label>
                  <input 
                    type="text" 
                    placeholder="08123456789"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>JENIS KELAMIN</label>
                  <select 
                    value={formData.jk}
                    onChange={(e) => setFormData({ ...formData, jk: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
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
                <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Data Asatidz'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
