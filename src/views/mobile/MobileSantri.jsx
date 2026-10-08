import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building,
  GraduationCap,
  BookOpen
} from 'lucide-react';

export default function MobileSantri() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_santri: '',
    nis: '',
    jk: 'L',
    status_santri: 'Mukim',
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    nama_kamar: 'Kamar Abu Bakar 01',
    capaian_hafalan_juz: 5,
    nama_wali: '',
    no_wa_wali: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const session = JSON.parse(localStorage.getItem('mobile_session') || '{}');
  const userAsramaId = session?.asrama_id;
  const isAsramaUser = session?.role === 'asrama' || session?.userType === 'Asrama';

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const url = (isAsramaUser && userAsramaId) ? `/api/santri?asrama_id=${userAsramaId}` : '/api/santri';
      const res = await axios.get(url);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        let list = res.data.data;
        if (isAsramaUser && userAsramaId) {
          list = list.filter(s => String(s.asrama_id) === String(userAsramaId) || (s.nama_asrama && session.nama_asrama && s.nama_asrama.toLowerCase().includes(session.nama_asrama.toLowerCase())));
        }
        setSantriList(list);
      } else {
        setSantriList(filterDefaultByAsrama(defaultSantri));
      }
    } catch (err) {
      setSantriList(filterDefaultByAsrama(defaultSantri));
    } finally {
      setLoading(false);
    }
  };

  const filterDefaultByAsrama = (list) => {
    if (!isAsramaUser || !userAsramaId) return list;
    return list.filter(s => String(s.asrama_id || 1) === String(userAsramaId) || (s.nama_asrama && session.nama_asrama && s.nama_asrama.toLowerCase().includes(session.nama_asrama.toLowerCase())));
  };

  const defaultSantri = [
    { id: 1, asrama_id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 04', capaian_hafalan_juz: 15, nama_wali: 'H. Abdullah', no_wa_wali: '081288881111' },
    { id: 2, asrama_id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 01', capaian_hafalan_juz: 28, nama_wali: 'Drs. Subagja', no_wa_wali: '081377772222' },
    { id: 3, asrama_id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', jk: 'P', status_santri: 'Mukim', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar 01', capaian_hafalan_juz: 30, nama_wali: 'H. Usman', no_wa_wali: '081199993333' },
    { id: 4, asrama_id: 1, nama_santri: 'Muhammad Rifqi', nis: '2601003', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 02', capaian_hafalan_juz: 5, nama_wali: 'Bpk. Hendra', no_wa_wali: '085744445555' },
    { id: 5, asrama_id: 4, nama_santri: 'Aisyah Humaira', nis: '2602002', jk: 'P', status_santri: 'Kalong', nama_asrama: 'Asrama Khadijah Al-Kubra', nama_kamar: 'Kamar 02', capaian_hafalan_juz: 3, nama_wali: 'Hj. Rohmah', no_wa_wali: '081233336666' }
  ];

  useEffect(() => {
    fetchSantri();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      ...initialForm,
      nis: `${Date.now().toString().slice(-6)}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (santri) => {
    setFormMode('edit');
    setFormData({
      id: santri.id,
      nama_santri: santri.nama_santri || santri.nama || '',
      nis: santri.nis || '',
      jk: santri.jk || 'L',
      status_santri: santri.status_santri || santri.status || 'Mukim',
      nama_asrama: santri.nama_asrama || santri.asrama || 'Asrama Ali bin Abi Thalib',
      nama_kamar: santri.nama_kamar || santri.kamar || 'Kamar 01',
      capaian_hafalan_juz: santri.capaian_hafalan_juz || santri.juz || 0,
      nama_wali: santri.nama_wali || santri.wali || '',
      no_wa_wali: santri.no_wa_wali || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        const res = await axios.post('/api/santri', formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList(prev => [...prev, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/santri/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList(prev => prev.map(s => s.id === formData.id ? { ...s, ...formData } : s));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      if (formMode === 'add') {
        setSantriList(prev => [...prev, { ...formData, id: Date.now() }]);
      } else {
        setSantriList(prev => prev.map(s => s.id === formData.id ? { ...s, ...formData } : s));
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus data santri "${nama}"?`)) {
      try {
        await axios.delete(`/api/santri/${id}`);
        fetchSantri();
      } catch (err) {
        setSantriList(prev => prev.filter(s => s.id !== id));
      }
    }
  };

  const filtered = santriList.filter(s => {
    const q = search.toLowerCase();
    const nameStr = (s.nama_santri || s.nama || '').toLowerCase();
    const nisStr = (s.nis || '').toString();
    const asramaStr = (s.nama_asrama || s.asrama || '').toLowerCase();
    return nameStr.includes(q) || nisStr.includes(q) || asramaStr.includes(q);
  });

  return (
    <div style={{ padding: '16px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(13, 148, 136, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#ccfbf1' }}>Database Master Santri</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0' }}>Data Santri</div>
          <div style={{ fontSize: '0.76rem', color: '#e6fffa' }}>{santriList.length} Santri Terdaftar</div>
        </div>
      </div>

      {/* Input Search */}
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <input 
          type="text" 
          placeholder="Cari nama santri, NIS, atau asrama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px 11px 38px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '0.82rem',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      {/* List Card Santri */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b', fontSize: '0.84rem' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Memuat data santri...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((s) => {
            const nama = s.nama_santri || s.nama;
            const status = s.status_santri || s.status || 'Mukim';
            const asrama = s.nama_asrama || s.asrama || 'Asrama Ali bin Abi Thalib';
            const kamar = s.nama_kamar || s.kamar || 'Kamar 01';
            const juz = s.capaian_hafalan_juz || s.juz || 0;
            const wali = s.nama_wali || s.wali || '-';

            return (
              <div key={s.id} style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{nama}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>NIS: {s.nis || '-'}</div>
                  </div>
                  <span className={`badge ${status === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                    {status}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: '#334155', margin: '8px 0', padding: '6px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                  <div>🏢 {asrama} ({kamar})</div>
                  <div>📖 Capaian Tahfidz: <strong>{juz} Juz</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '4px' }}>
                  <div style={{ color: '#475569', fontSize: '0.74rem' }}>
                    Wali: <strong>{wali}</strong> {s.no_wa_wali && (
                      <a 
                        href={`https://wa.me/${String(s.no_wa_wali).replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: '#059669', fontWeight: 700, textDecoration: 'none', marginLeft: '6px' }}
                      >
                        📱 {s.no_wa_wali}
                      </a>
                    )}
                  </div>

                  {/* Actions CRUD buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleOpenEdit(s)}
                      style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id, nama)}
                      style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT SANTRI */}
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
                {formMode === 'add' ? '➕ Tambah Data Santri Baru' : '✏️ Edit Data Santri'}
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NAMA LENGKAP SANTRI</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Muhammad Ali"
                  value={formData.nama_santri}
                  onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NIS SANTRI</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>STATUS SANTRI</label>
                  <select 
                    value={formData.status_santri}
                    onChange={(e) => setFormData({ ...formData, status_santri: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  >
                    <option value="Mukim">Mukim (Tinggal)</option>
                    <option value="Kalong">Kalong (Pulang)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>ASRAMA</label>
                <select 
                  value={formData.nama_asrama}
                  onChange={(e) => setFormData({ ...formData, nama_asrama: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                >
                  <option value="Asrama Ali bin Abi Thalib">Asrama Ali bin Abi Thalib</option>
                  <option value="Asrama Umar bin Khattab">Asrama Umar bin Khattab</option>
                  <option value="Asrama Fathimah Az-Zahra">Asrama Fathimah Az-Zahra</option>
                  <option value="Asrama Khadijah Al-Kubra">Asrama Khadijah Al-Kubra</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>CAPAIAN TAHFIDZ (JUZ)</label>
                <input 
                  type="number" 
                  min="0" max="30"
                  value={formData.capaian_hafalan_juz}
                  onChange={(e) => setFormData({ ...formData, capaian_hafalan_juz: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NAMA WALI SANTRI</label>
                  <input 
                    type="text" 
                    placeholder="Nama Orang Tua / Wali"
                    value={formData.nama_wali}
                    onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>NO. HP / WA WALI</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 08123456789"
                    value={formData.no_wa_wali}
                    onChange={(e) => setFormData({ ...formData, no_wa_wali: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
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
                <Save size={16} /> {submitting ? 'Menyimpan...' : 'Simpan Data Santri'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) Warna Biru Gaya Live Chat */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Data Santri"
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
