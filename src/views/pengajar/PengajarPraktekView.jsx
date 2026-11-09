import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, 
  Plus, 
  Search, 
  CheckCircle2, 
  RotateCw, 
  X, 
  Check, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';

export default function PengajarPraktekView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    santri_id: '',
    kategori: 'Shalat Fardhu',
    nama_praktek: 'Praktek Shalat Subuh (Qunut & Adab)',
    nilai_gerakan: 85,
    nilai_bacaan: 80,
    nilai_adab: 85,
    nama_penguji: 'Ustadz Penguji',
    catatan_perbaikan: 'Tajwid dan tuma\'ninah gerakan dijaga lebih tenang.',
    tanggal_ujian: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPraktek, resSantri] = await Promise.all([
        axios.get('/api/pengajar/praktek'),
        axios.get('/api/pengajar/santri')
      ]);

      if (resPraktek.data?.success) {
        setList(resPraktek.data.data || []);
      }
      if (resSantri.data?.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (e) {
      toastError('Gagal memuat evaluasi praktek');
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
      const res = await axios.post('/api/pengajar/praktek', formData);
      if (res.data?.success) {
        toastSuccess('Evaluasi praktek ibadah berhasil disimpan!');
        setShowForm(false);
        fetchData();
      }
    } catch (err) {
      toastError('Gagal menyimpan evaluasi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = list.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q) ||
      (item.nama_praktek || '').toLowerCase().includes(q)
    );
  });

  const nG = parseFloat(formData.nilai_gerakan) || 0;
  const nB = parseFloat(formData.nilai_bacaan) || 0;
  const nA = parseFloat(formData.nilai_adab) || 0;
  const nilaiAkhirPreview = Math.round(((nG + nB + nA) / 3) * 10) / 10;

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
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Praktek &amp; Ujian Ibadah</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Wudhu, shalat fardhu, doa harian &amp; dzikir</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={15} /> Input Nilai Praktek
        </button>
      </div>

      {/* 2. SEARCH BOX */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Cari santri / jenis praktek..."
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

      {/* 3. MODAL FORM EVALUASI PRAKTEK */}
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
              <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Input Evaluasi Praktek Ibadah</div>
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
                    KATEGORI PRAKTEK
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  >
                    <option value="Shalat Fardhu">Shalat Fardhu</option>
                    <option value="Wudhu & Tayammum">Wudhu &amp; Tayammum</option>
                    <option value="Shalat Jenazah">Shalat Jenazah</option>
                    <option value="Doa Harian & Dzikir">Doa Harian &amp; Dzikir</option>
                    <option value="Adab & Akhlak">Adab &amp; Akhlak</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    TANGGAL UJIAN
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_ujian}
                    onChange={(e) => setFormData({ ...formData, tanggal_ujian: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  NAMA PRAKTEK / MATERI
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Shalat Maghrib & Doa Qunut Subuh"
                  value={formData.nama_praktek}
                  onChange={(e) => setFormData({ ...formData, nama_praktek: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>

              {/* Nilai Gerakan, Bacaan, Adab */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                    GERAKAN (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.nilai_gerakan}
                    onChange={(e) => setFormData({ ...formData, nilai_gerakan: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                    BACAAN (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.nilai_bacaan}
                    onChange={(e) => setFormData({ ...formData, nilai_bacaan: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                    ADAB (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.nilai_adab}
                    onChange={(e) => setFormData({ ...formData, nilai_adab: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', textAlign: 'center', fontWeight: 800 }}
                  />
                </div>
              </div>

              {/* Preview Nilai Akhir */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46' }}>Nilai Akhir Rata-rata:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>{nilaiAkhirPreview} / 100</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  CATATAN PERBAIKAN USTADZ
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan kelebihan dan bagian yang perlu diperbaiki santri..."
                  value={formData.catatan_perbaikan}
                  onChange={(e) => setFormData({ ...formData, catatan_perbaikan: e.target.value })}
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
                  style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DAFTAR RIWAYAT PRAKTEK IBADAH */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat riwayat praktek...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Belum ada data evaluasi praktek ibadah santri.
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
                  <span style={{ fontSize: '0.6rem', color: '#64748b' }}>
                    ({item.nama_kelas || 'Santri'})
                  </span>
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginTop: '2px' }}>
                  {item.kategori}: {item.nama_praktek || 'Ujian Praktek'}
                </div>

                {item.catatan_perbaikan && (
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                    "{item.catatan_perbaikan}"
                  </div>
                )}
                
                <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '2px' }}>
                  Tgl: {item.tanggal_ujian} • Penguji: {item.nama_penguji || 'Ustadz'}
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669' }}>
                  {item.nilai_akhir || 0}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '2px',
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: item.status === 'Lulus' ? '#ecfdf5' : '#fef2f2',
                    color: item.status === 'Lulus' ? '#059669' : '#dc2626',
                    border: `1px solid ${item.status === 'Lulus' ? '#a7f3d0' : '#fecaca'}`
                  }}
                >
                  {item.predikat || item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

