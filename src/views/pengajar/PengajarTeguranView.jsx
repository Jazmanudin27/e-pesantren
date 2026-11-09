import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  User, 
  AlertTriangle,
  X,
  Send
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';

export default function PengajarTeguranView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    santri_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Ringan',
    jenis_pelanggaran: '',
    poin_pelanggaran: 5,
    bentuk_tazir: 'Membaca Surat Yasin & Istighfar',
    status_tazir: 'Belum Dikerjakan',
    musyrif_pencatat: 'Ustadz Pengajar'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTeguran, resSantri] = await Promise.all([
        axios.get('/api/pengajar/teguran'),
        axios.get('/api/pengajar/santri')
      ]);

      if (resTeguran.data?.success) {
        setList(resTeguran.data.data || []);
      }
      if (resSantri.data?.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (e) {
      toastError('Gagal memuat catatan teguran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.jenis_pelanggaran) {
      toastError('Pilih santri dan isi jenis pelanggaran!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/pengajar/teguran', formData);
      if (res.data?.success) {
        toastSuccess('Catatan teguran santri berhasil disimpan!');
        setShowForm(false);
        setFormData({
          santri_id: '',
          tanggal: new Date().toISOString().split('T')[0],
          kategori: 'Ringan',
          jenis_pelanggaran: '',
          poin_pelanggaran: 5,
          bentuk_tazir: 'Membaca Surat Yasin & Istighfar',
          status_tazir: 'Belum Dikerjakan',
          musyrif_pencatat: 'Ustadz Pengajar'
        });
        fetchData();
      }
    } catch (err) {
      toastError('Gagal menyimpan teguran: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/pengajar/teguran/${id}/status`, { status_tazir: newStatus });
      if (res.data?.success) {
        toastSuccess('Status ta\'zir berhasil diperbarui!');
        setList(prev => prev.map(item => item.id === id ? { ...item, status_tazir: newStatus } : item));
      }
    } catch (e) {
      toastError('Gagal memperbarui status ta\'zir');
    }
  };

  const filteredList = list.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.jenis_pelanggaran || '').toLowerCase().includes(q) ||
      (item.nama_kelas || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. TOP HEADER & TOMBOL TAMBAH TEGURAN */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Catatan Teguran &amp; Ta'zir</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Kedisiplinan, adab mengaji &amp; pembinaan santri</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            border: 'none',
            color: '#ffffff',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
          }}
        >
          <Plus size={15} /> Tambah Teguran
        </button>
      </div>

      {/* 2. SEARCH BOX */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari nama santri / jenis teguran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px 8px 34px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            fontSize: '0.75rem',
            outline: 'none',
            background: '#ffffff',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 3. MODAL FORM INPUT TEGURAN */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px'
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Input Teguran Santri Baru</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  PILIH SANTRI *
                </label>
                <select
                  required
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri} ({s.nama_kelas || 'Santri'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    TANGGAL
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    KATEGORI
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  >
                    <option value="Ringan">Ringan (5 Poin)</option>
                    <option value="Sedang">Sedang (10 Poin)</option>
                    <option value="Berat">Berat (25 Poin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  JENIS TEGURAN / PELANGGARAN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Terlambat mengaji maghrib / mengantuk"
                  value={formData.jenis_pelanggaran}
                  onChange={(e) => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  BENTUK TA'ZIR / PEMBINAAN
                </label>
                <input
                  type="text"
                  value={formData.bentuk_tazir}
                  onChange={(e) => setFormData({ ...formData, bentuk_tazir: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Teguran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. LIST RIWAYAT TEGURAN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#dc2626" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat riwayat teguran...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Alhamdulillah, belum ada catatan teguran santri.
          </div>
        ) : (
          filteredList.map((item) => {
            const isDone = item.status_tazir === 'Selesai Dikerjakan' || item.status_tazir === 'Selesai';
            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  border: isDone ? '1px solid #e2e8f0' : '1px solid #fecaca',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.nama_santri}
                    </span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                      }}
                    >
                      +{item.poin_pelanggaran || 5} Poin
                    </span>
                  </div>

                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                    {item.jenis_pelanggaran}
                  </div>

                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>
                    Ta'zir: <strong>{item.bentuk_tazir || '-'}</strong> • Tgl: {item.tanggal}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {isDone ? (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: '#059669',
                        background: '#ecfdf5',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <CheckCircle2 size={12} /> Selesai
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'Selesai Dikerjakan')}
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: '#dc2626',
                        background: '#fef2f2',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        cursor: 'pointer'
                      }}
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

