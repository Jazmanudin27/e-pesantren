import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Search, 
  RotateCw, 
  X, 
  User, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  HeartHandshake, 
  MessageSquare 
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';

export default function PengajarPerkembanganView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    santri_id: '',
    periode: 'Bulan Ini',
    tanggal_laporan: new Date().toISOString().split('T')[0],
    catatan_akademik: 'Pemahaman materi nahwu & sharaf sangat baik.',
    catatan_hafalan: 'Kelancaran hafalan juz 30 lancar tanpa kendala.',
    catatan_perilaku: 'Sopan santun kepada asatidz dan rukun sesama santri di asrama.',
    catatan_ibadah: 'Selalu disiplin shalat berjamaah 5 waktu di masjid.',
    catatan_ustadz: 'Pertahankan kedisiplinan dan terus istiqomah dalam menuntut ilmu.',
    nama_penulis: 'Ustadz Pembina'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPerkembangan, resSantri] = await Promise.all([
        axios.get('/api/pengajar/perkembangan'),
        axios.get('/api/pengajar/santri')
      ]);

      if (resPerkembangan.data?.success) {
        setList(resPerkembangan.data.data || []);
      }
      if (resSantri.data?.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (e) {
      toastError('Gagal memuat catatan perkembangan santri');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      toastError('Pilih santri terlebih dahulu!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/pengajar/perkembangan', formData);
      if (res.data?.success) {
        toastSuccess('Laporan perkembangan santri berhasil diterbitkan!');
        setShowForm(false);
        fetchData();
      }
    } catch (err) {
      toastError('Gagal menyimpan laporan perkembangan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = list.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.periode || '').toLowerCase().includes(q) ||
      (item.nama_kelas || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. TOP HEADER & TOMBOL INPUT */}
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
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Perkembangan &amp; Karakter Santri</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Catatan akhlak, ibadah, hafalan &amp; bimbingan ustadz</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
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
            boxShadow: '0 4px 12px rgba(13, 118, 110, 0.25)'
          }}
        >
          <Plus size={15} /> Buat Catatan Perkembangan
        </button>
      </div>

      {/* 2. SEARCH BOX */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri / periode..."
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

      {/* 3. MODAL FORM INPUT CATATAN PERKEMBANGAN */}
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
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Buat Catatan Perkembangan Santri</div>
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
                    PERIODE
                  </label>
                  <input
                    type="text"
                    value={formData.periode}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="Contoh: November 2026"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    TANGGAL
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_laporan}
                    onChange={(e) => setFormData({ ...formData, tanggal_laporan: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  CATATAN AKADEMIK &amp; KITAB KUNING
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_akademik}
                  onChange={(e) => setFormData({ ...formData, catatan_akademik: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  CATATAN PERILAKU &amp; AKHLAK SANTRI
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_perilaku}
                  onChange={(e) => setFormData({ ...formData, catatan_perilaku: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  PESAN &amp; NASEHAT USTADZ
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_ustadz}
                  onChange={(e) => setFormData({ ...formData, catatan_ustadz: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
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
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0d766e', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submitting ? 'Menerbitkan...' : 'Terbitkan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DAFTAR RIWAYAT PERKEMBANGAN SANTRI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#0d766e" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat riwayat perkembangan...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Belum ada catatan perkembangan santri.
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                    {item.nama_santri}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#64748b', marginLeft: '6px' }}>
                    ({item.nama_kelas || 'Santri'})
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  {item.periode || 'Bulan Ini'}
                </span>
              </div>

              {item.catatan_akademik && (
                <div style={{ fontSize: '0.68rem', color: '#334155' }}>
                  <strong>Kitab/Akademik:</strong> {item.catatan_akademik}
                </div>
              )}

              {item.catatan_perilaku && (
                <div style={{ fontSize: '0.68rem', color: '#334155' }}>
                  <strong>Akhlak:</strong> {item.catatan_perilaku}
                </div>
              )}

              {item.catatan_ustadz && (
                <div style={{ fontSize: '0.64rem', color: '#0d766e', fontStyle: 'italic', background: '#f0fdfa', padding: '6px 8px', borderRadius: '6px', border: '1px solid #ccfbf1' }}>
                  "{item.catatan_ustadz}"
                </div>
              )}

              <div style={{ fontSize: '0.58rem', color: '#94a3b8', textAlign: 'right' }}>
                Tgl: {item.tanggal_laporan} • Oleh: {item.nama_penulis || 'Ustadz Pembina'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

