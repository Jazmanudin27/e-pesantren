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
  Sparkles,
  Star,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function PengajarPraktekView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
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

  const calculatedScore = Math.round(
    (parseInt(formData.nilai_gerakan || 0, 10) * 0.35) +
    (parseInt(formData.nilai_bacaan || 0, 10) * 0.40) +
    (parseInt(formData.nilai_adab || 0, 10) * 0.25)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.nama_praktek) {
      toastError('Pilih santri dan materi praktek!');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/pengajar/praktek', formData);
      if (res.data?.success) {
        toastSuccess('Nilai evaluasi praktek berhasil disimpan!');
        setShowForm(false);
        setFormData({
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
        fetchData();
      }
    } catch (err) {
      toastError('Gagal menyimpan nilai praktek: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalDiuji = list.length;
  const avgScore = totalDiuji > 0 
    ? (list.reduce((acc, i) => acc + (parseFloat(i.nilai_akhir) || 0), 0) / totalDiuji).toFixed(1)
    : '0';
  const countLulus = list.filter(i => (parseFloat(i.nilai_akhir) >= 75) || i.status === 'Lulus').length;
  const countBimbingan = list.filter(i => (parseFloat(i.nilai_akhir) < 75) && i.status !== 'Lulus').length;

  const filteredList = list.filter(item => {
    if (kategoriFilter !== 'Semua' && item.kategori !== kategoriFilter) return false;
    const q = search.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nama_praktek || '').toLowerCase().includes(q) ||
      (item.nama_kelas || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. TOP EXECUTIVE CARD: JUDUL & TOMBOL INPUT */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bfdbfe',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)'
            }}
          >
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.2px' }}>
              Evaluasi Praktek Ibadah
            </div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
              Shalat fardhu, wudhu, dzikir, doa &amp; adab
            </div>
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
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
          }}
        >
          <Plus size={15} /> Uji Santri
        </button>
      </div>

      {/* 2. STATS 4 BADGES COUNTER (LUXURY EXECUTIVE STYLE IDENTIK OWNER) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}
      >
        {/* Total Diuji */}
        <div
          style={{
            background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <GraduationCap size={14} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#15803d', marginTop: '3px', lineHeight: 1 }}>
            {totalDiuji}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
            Total Ujian
          </div>
        </div>

        {/* Nilai Rata-Rata */}
        <div
          style={{
            background: 'linear-gradient(145deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Star size={13} fill="#ffffff" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1d4ed8', marginTop: '3px', lineHeight: 1 }}>
            {avgScore}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#1e40af', marginTop: '2px' }}>
            Rata-Rata
          </div>
        </div>

        {/* Lulus Mumtaz */}
        <div
          style={{
            background: 'linear-gradient(145deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
            }}
          >
            <CheckCircle2 size={14} strokeWidth={2.8} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857', marginTop: '3px', lineHeight: 1 }}>
            {countLulus}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#065f46', marginTop: '2px' }}>
            Lulus
          </div>
        </div>

        {/* Perlu Bimbingan */}
        <div
          style={{
            background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '8px 4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)'
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
            }}
          >
            <Clock size={13} strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#b45309', marginTop: '3px', lineHeight: 1 }}>
            {countBimbingan}
          </div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>
            Remidi
          </div>
        </div>
      </div>

      {/* 3. SEARCH & KATEGORI FILTER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari santri / jenis materi praktek..."
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

        {/* Kategori Quick Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['Semua', 'Shalat Fardhu', 'Wudhu & Tayammum', 'Shalat Jenazah', 'Doa Harian & Dzikir'].map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKategoriFilter(k)}
              style={{
                padding: '4px 9px',
                borderRadius: '8px',
                fontSize: '0.65rem',
                fontWeight: 700,
                border: kategoriFilter === k ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: kategoriFilter === k ? '#eff6ff' : '#ffffff',
                color: kategoriFilter === k ? '#1d4ed8' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* 4. MODAL FORM EVALUASI PRAKTEK (EXECUTIVE GLASS) */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
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
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
              boxShadow: '0 25px 35px -5px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={16} />
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0f172a' }}>
                  Input Evaluasi Praktek Ibadah
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  PILIH SANTRI *
                </label>
                <SearchableSelect
                  options={santriList.map((s) => ({
                    value: s.id,
                    label: s.nama_santri,
                    sublabel: s.nama_kelas ? `Kelas: ${s.nama_kelas}` : null,
                  }))}
                  value={formData.santri_id}
                  onChange={(val) =>
                    setFormData({ ...formData, santri_id: val })
                  }
                  placeholder="-- Pilih Santri yang Diuji --"
                  searchPlaceholder="Cari nama santri atau kelas..."
                  triggerStyle={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.78rem',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    KATEGORI
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.78rem' }}
                  >
                    <option value="Shalat Fardhu">Shalat Fardhu</option>
                    <option value="Wudhu & Tayammum">Wudhu &amp; Tayammum</option>
                    <option value="Shalat Jenazah">Shalat Jenazah</option>
                    <option value="Doa Harian & Dzikir">Doa Harian &amp; Dzikir</option>
                    <option value="Adab & Akhlak">Adab &amp; Akhlak</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    TANGGAL UJIAN
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_ujian}
                    onChange={(e) => setFormData({ ...formData, tanggal_ujian: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.78rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  MATERI PRAKTEK
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Shalat Shubuh, Qunut & Dzikir Ba'da Shalat"
                  value={formData.nama_praktek}
                  onChange={(e) => setFormData({ ...formData, nama_praktek: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>

              {/* Komponen Nilai & Live Preview */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a' }}>Komponen Penilaian</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb' }}>
                    Perkiraan Nilai: {calculatedScore}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                      GERAKAN (35%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_gerakan}
                      onChange={(e) => setFormData({ ...formData, nilai_gerakan: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                      BACAAN (40%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_bacaan}
                      onChange={(e) => setFormData({ ...formData, nilai_bacaan: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 800 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                      ADAB (25%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_adab}
                      onChange={(e) => setFormData({ ...formData, nilai_adab: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', textAlign: 'center', fontWeight: 800 }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                  CATATAN PERBAIKAN / BIMBINGAN
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_perbaikan}
                  onChange={(e) => setFormData({ ...formData, catatan_perbaikan: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: submitting ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. LIST EVALUASI PRAKTEK (EXECUTIVE CARD) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#2563eb" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat evaluasi praktek...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Belum ada data evaluasi praktek ibadah santri.
          </div>
        ) : (
          filteredList.map((item) => {
            const score = parseFloat(item.nilai_akhir) || 0;
            const isLulus = score >= 75 || item.status === 'Lulus';
            const initial = (item.nama_santri || 'S').charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Header: Avatar Santri + Info + Nilai Akhir Glowing Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.86rem',
                        border: '1px solid #bfdbfe',
                        flexShrink: 0
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                        {item.nama_kelas || 'Santri Binaan'} • {item.kategori}
                      </div>
                    </div>
                  </div>

                  {/* Nilai Akhir Badge */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        color: isLulus ? '#059669' : '#dc2626',
                        lineHeight: 1
                      }}
                    >
                      {item.nilai_akhir || 0}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '2px',
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isLulus ? '#ecfdf5' : '#fef2f2',
                        color: isLulus ? '#059669' : '#dc2626',
                        border: `1px solid ${isLulus ? '#a7f3d0' : '#fecaca'}`
                      }}
                    >
                      {item.predikat || (isLulus ? 'Lulus' : 'Remidi')}
                    </span>
                  </div>
                </div>

                {/* Materi Praktek */}
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1e293b' }}>
                  {item.nama_praktek || 'Ujian Praktek Ibadah'}
                </div>

                {/* Nilai Breakdown (Mini Pills) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '4px',
                    background: '#f8fafc',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    fontSize: '0.62rem'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b' }}>Gerakan: </span>
                    <strong style={{ color: '#0f172a' }}>{item.nilai_gerakan ?? '-'}</strong>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Bacaan: </span>
                    <strong style={{ color: '#0f172a' }}>{item.nilai_bacaan ?? '-'}</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b' }}>Adab: </span>
                    <strong style={{ color: '#0f172a' }}>{item.nilai_adab ?? '-'}</strong>
                  </div>
                </div>

                {/* Catatan Perbaikan */}
                {item.catatan_perbaikan && (
                  <div
                    style={{
                      fontSize: '0.64rem',
                      color: '#475569',
                      fontStyle: 'italic',
                      background: '#eff6ff',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: '1px solid #dbeafe'
                    }}
                  >
                    "{item.catatan_perbaikan}"
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.58rem', color: '#94a3b8' }}>
                  <span>Tgl: {item.tanggal_ujian}</span>
                  <span>Penguji: {item.nama_penguji || 'Ustadz Penguji'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
