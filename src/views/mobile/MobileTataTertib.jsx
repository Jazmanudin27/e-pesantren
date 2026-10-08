import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Plus, Edit3, Trash2, X, Save, Loader2, Search, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function MobileTataTertib() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    santri_id: 1,
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Ringan',
    jenis_pelanggaran: 'Terlambat Berjamaah Shalat',
    poin_pelanggaran: 5,
    bentuk_tazir: 'Membaca Surat Yasin di Depan Asrama',
    status_tazir: 'Belum Dikerjakan',
    musyrif_pencatat: 'Ust. Ahmad Fauzi (Musyrif)',
    wa_notif_wali: 1
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultPelanggaran = [
    { id: 1, santri_id: 1, nama_santri: 'Muhammad Al-Fatih', tanggal: '2026-10-04', jenis_pelanggaran: 'Terlambat Berjamaah Shalat', kategori: 'Ringan', poin_pelanggaran: 5, bentuk_tazir: 'Membaca Juz 30 di Depan Asrama', status_tazir: 'Sudah Dikerjakan' },
    { id: 2, santri_id: 2, nama_santri: 'Ahmad Dahlan', tanggal: '2026-09-28', jenis_pelanggaran: 'Lupa Membawa Kartu Santri', kategori: 'Ringan', poin_pelanggaran: 2, bentuk_tazir: 'Pembersihan Area Wudhu', status_tazir: 'Sudah Dikerjakan' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resP, resS] = await Promise.all([
        axios.get('/api/pelanggaran'),
        axios.get('/api/santri')
      ]);

      if (resS.data && resS.data.data) {
        setSantriOptions(resS.data.data);
      }

      if (resP.data && resP.data.data && resP.data.data.length > 0) {
        setPelanggaranList(resP.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_pelanggaran_list') || 'null');
        setPelanggaranList(saved || defaultPelanggaran);
      }
    } catch (err) {
      console.warn('API error, fallback local:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_pelanggaran_list') || 'null');
      setPelanggaranList(saved || defaultPelanggaran);
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
      tanggal: item.tanggal ? String(item.tanggal).split('T')[0] : new Date().toISOString().split('T')[0],
      kategori: item.kategori || 'Ringan',
      jenis_pelanggaran: item.jenis_pelanggaran || '',
      poin_pelanggaran: item.poin_pelanggaran || 5,
      bentuk_tazir: item.bentuk_tazir || '',
      status_tazir: item.status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat: item.musyrif_pencatat || 'Musyrif',
      wa_notif_wali: item.wa_notif_wali !== undefined ? item.wa_notif_wali : 1
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await axios.post('/api/pelanggaran', formData);
      } else {
        await axios.put(`/api/pelanggaran/${formData.id}`, formData);
      }

      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API save fallback local:', err);
      setPelanggaranList(prev => {
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
          next = prev.map(i => i.id === formData.id ? { ...i, ...itemObj } : i);
        }
        localStorage.setItem('mobile_pelanggaran_list', JSON.stringify(next));
        return next;
      });
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan pelanggaran ini?')) return;
    try {
      await axios.delete(`/api/pelanggaran/${id}`);
      fetchData();
    } catch (err) {
      console.warn('API delete fallback local:', err);
      setPelanggaranList(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_pelanggaran_list', JSON.stringify(next));
        return next;
      });
    }
  };

  const handleMarkDone = async (id) => {
    try {
      await axios.post(`/api/pelanggaran/selesai/${id}`);
      fetchData();
    } catch (err) {
      setPelanggaranList(prev => prev.map(i => i.id === id ? { ...i, status_tazir: "Selesai Ta'zir" } : i));
    }
  };

  const filteredList = pelanggaranList.filter(item => {
    const q = searchQuery.toLowerCase();
    const nama = (item.nama_santri || '').toLowerCase();
    const jenis = (item.jenis_pelanggaran || '').toLowerCase();
    const tazir = (item.bentuk_tazir || '').toLowerCase();
    return nama.includes(q) || jenis.includes(q) || tazir.includes(q);
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '80px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #be123c 0%, #9f1239 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '16px',
        boxShadow: '0 8px 18px rgba(190, 18, 60, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#fecdd3' }}>Biro Kedisiplinan & Keamanan</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 4px' }}>Tata Tertib & Ta'zir</div>
          <div style={{ fontSize: '0.8rem', color: '#ffe4e6' }}>{pelanggaranList.length} Catatan Pelanggaran</div>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            background: '#ffffff',
            color: '#be123c',
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
      <div style={{ position: 'relative', marginBottom: '14px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri, jenis pelanggaran, ta'zir..."
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

      {/* List Pelanggaran */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          <div>Memuat catatan kedisiplinan...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <ShieldCheck size={36} style={{ color: '#059669', marginBottom: '8px' }} />
          <div style={{ fontWeight: 700, color: '#334155' }}>Kedisiplinan Terjaga Baik</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>Tidak ditemukan catatan pelanggaran santri</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((item) => (
            <div key={item.id} style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {item.tanggal ? String(item.tanggal).split('T')[0] : '-'}
                </span>
                <span className="badge badge-danger">
                  +{item.poin_pelanggaran || 5} Poin ({item.kategori || 'Ringan'})
                </span>
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a', marginBottom: '4px' }}>
                👤 {item.nama_santri || 'Santri'}
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#be123c', marginBottom: '6px' }}>
                🚨 {item.jenis_pelanggaran}
              </div>

              <div style={{ fontSize: '0.78rem', color: '#334155', background: '#fff1f2', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px' }}>
                ⚖️ <strong>Ta'zir:</strong> {item.bentuk_tazir || '-'}
                <div style={{ fontSize: '0.72rem', color: '#9f1239', marginTop: '2px', fontWeight: 600 }}>
                  Status: {item.status_tazir || 'Belum Dikerjakan'}
                </div>
              </div>

              {/* Tombol Selesai Ta'zir + Edit/Delete */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                {item.status_tazir !== "Selesai Ta'zir" && (
                  <button
                    onClick={() => handleMarkDone(item.id)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#15803d', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✓ Selesai Ta'zir
                  </button>
                )}
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
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
                {formMode === 'add' ? '➕ Catat Pelanggaran Santri' : '✏️ Edit Catatan Pelanggaran'}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Jenis Pelanggaran *</label>
                <input
                  type="text" required placeholder="Contoh: Terlambat Berjamaah Shalat Shubuh"
                  value={formData.jenis_pelanggaran}
                  onChange={(e) => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Berat">Berat</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Poin Pelanggaran</label>
                  <input
                    type="number" required min={1} max={100}
                    value={formData.poin_pelanggaran}
                    onChange={(e) => setFormData({ ...formData, poin_pelanggaran: parseInt(e.target.value) || 5 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Bentuk Ta'zir (Hukuman) *</label>
                <textarea
                  required rows={2} placeholder="Contoh: Membaca Surat Yasin & Kebersihan Halaman"
                  value={formData.bentuk_tazir}
                  onChange={(e) => setFormData({ ...formData, bentuk_tazir: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Status Ta'zir</label>
                  <select
                    value={formData.status_tazir}
                    onChange={(e) => setFormData({ ...formData, status_tazir: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff' }}
                  >
                    <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                    <option value="Sedang Proses">Sedang Proses</option>
                    <option value="Selesai Ta'zir">Selesai Ta'zir</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Tanggal Pelanggaran</label>
                  <input
                    type="date" required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#be123c', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
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
