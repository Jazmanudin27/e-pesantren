import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building, Users, Home, Plus, Edit3, Trash2, X, Save, Loader2, Key } from 'lucide-react';

export default function MobileAsrama() {
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_asrama: '',
    kode_asrama: '',
    gender: 'L',
    lokasi_gedung: '',
    pembina: 'Ust. Ahmad Fauzi',
    username: '',
    password: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultAsrama = [
    { id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', gender: 'L', pembina: 'Ust. Ahmad Fauzi, S.Pd.I', kamarCount: 8, santriCount: 64, username: 'asrama_ali', password: 'ali123' },
    { id: 2, nama_asrama: 'Asrama Umar bin Khattab', gender: 'L', pembina: 'Ust. Ridwan Kamil, Lc.', kamarCount: 8, santriCount: 60, username: 'asrama_umar', password: 'umar123' },
    { id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', gender: 'P', pembina: 'Usth. Siti Maryam, M.Ag.', kamarCount: 10, santriCount: 80, username: 'asrama_fathimah', password: 'fathimah123' },
    { id: 4, nama_asrama: 'Asrama Khadijah Al-Kubra', gender: 'P', pembina: 'Usth. Nur Aini, S.Pd.', kamarCount: 6, santriCount: 45, username: 'asrama_khadijah', password: 'khadijah123' }
  ];

  const fetchAsrama = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asrama');
      if (res.data && res.data.success && res.data.asrama && res.data.asrama.length) {
        setAsramaList(res.data.asrama);
      } else {
        const saved = JSON.parse(localStorage.getItem('master_asrama_list') || 'null');
        setAsramaList(saved || defaultAsrama);
      }
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('master_asrama_list') || 'null');
      setAsramaList(saved || defaultAsrama);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsrama();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    const suffix = Date.now().toString().slice(-3);
    setFormData({
      ...initialForm,
      kode_asrama: `ASR-${suffix}`,
      username: `asrama_${suffix}`,
      password: '123'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a) => {
    setFormMode('edit');
    setFormData({
      id: a.id,
      nama_asrama: a.nama_asrama || a.nama || '',
      kode_asrama: a.kode_asrama || `ASR-${a.id}`,
      gender: a.gender || 'L',
      lokasi_gedung: a.lokasi_gedung || 'Gedung Asrama',
      pembina: a.pembina || 'Musyrif Asrama',
      username: a.username || `asrama_${a.id}`,
      password: a.password || '123456'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/asrama', formData);
      }
      // Update local state and localStorage
      setAsramaList(prev => {
        let next;
        if (formMode === 'add') {
          next = [...prev, { ...formData, id: Date.now() }];
        } else {
          next = prev.map(item => item.id === formData.id ? { ...item, ...formData } : item);
        }
        localStorage.setItem('master_asrama_list', JSON.stringify(next));
        return next;
      });
      fetchAsrama();
      setIsModalOpen(false);
    } catch (err) {
      setAsramaList(prev => {
        let next;
        if (formMode === 'add') {
          next = [...prev, { ...formData, id: Date.now() }];
        } else {
          next = prev.map(item => item.id === formData.id ? { ...item, ...formData } : item);
        }
        localStorage.setItem('master_asrama_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data asrama "${nama}"?`)) {
      setAsramaList(prev => {
        const next = prev.filter(a => a.id !== id);
        localStorage.setItem('master_asrama_list', JSON.stringify(next));
        return next;
      });
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner Header Asrama */}
      <div style={{
        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(217, 119, 6, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#fef3c7' }}>Master Gedung Asrama</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0' }}>Data Asrama</div>
          <div style={{ fontSize: '0.76rem', color: '#fffbeb' }}>{asramaList.length} Blok Gedung Active</div>
        </div>
      </div>

      {/* List Asrama Card */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '0.84rem' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Memuat data asrama...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {asramaList.map((a) => {
            const nama = a.nama_asrama || a.nama;
            const gender = a.gender === 'P' || a.gender === 'Akhwat' ? 'Akhwat' : 'Ikhwan';
            const pembina = a.pembina || 'Musyrif Asrama';

            return (
              <div key={a.id} style={{
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
                      onClick={() => handleOpenEdit(a)}
                      style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
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

                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a', marginBottom: '4px' }}>{nama}</div>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px' }}>Pembina: <strong>{pembina}</strong></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={14} color="#d97706" />
                    <span>User: <strong>{a.username || `asrama_${a.id}`}</strong></span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#047857' }}>Pass: {a.password || '123'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT ASRAMA */}
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
                {formMode === 'add' ? '➕ Tambah Gedung Asrama' : '✏️ Edit Gedung Asrama'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NAMA ASRAMA / GEDUNG</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Asrama Ali bin Abi Thalib"
                  value={formData.nama_asrama}
                  onChange={(e) => setFormData({ ...formData, nama_asrama: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>KODE ASRAMA</label>
                  <input 
                    type="text" 
                    required
                    value={formData.kode_asrama}
                    onChange={(e) => setFormData({ ...formData, kode_asrama: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>GENDER</label>
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
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>PEMBINA / MUSYRIF</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nama Ustadz Pembina"
                  value={formData.pembina}
                  onChange={(e) => setFormData({ ...formData, pembina: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>USERNAME (LOGIN MOBILE)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="asrama_ali"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>PASSWORD LOGIN</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ali123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
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
                <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Data Asrama'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) Warna Biru Gaya Live Chat */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Asrama Baru"
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
