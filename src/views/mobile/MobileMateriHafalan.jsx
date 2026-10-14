import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  RotateCw,
  Sparkles,
  Layers,
  BookmarkCheck,
  CheckCircle2
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const KATEGORI_MOBILE_OPTIONS = [
  { value: "Al-Qur'an", label: "Al-Qur'an", sublabel: 'Tahfidz 30 Juz & Juz Amma' },
  { value: 'Nahwu & Shorof', label: 'Nahwu & Shorof', sublabel: 'Jurumiyah, Imrithi, Alfiyah' },
  { value: "Fiqih Syafi'i", label: "Fiqih Syafi'i", sublabel: 'Taqrib, Safinah, Fathul Qorib' },
  { value: 'Hadits Nabawi', label: 'Hadits Nabawi', sublabel: 'Arbain Nawawi, Riyadhis Shalihin' },
  { value: 'Aqidah & Tauhid', label: 'Aqidah & Tauhid', sublabel: 'Aqidatul Awam, Sanusiyah' },
  { value: 'Akhlak & Adab', label: 'Akhlak & Adab', sublabel: 'Taisirul Khalaq, Ta\'lim' },
  { value: 'Tajwid', label: 'Tajwid', sublabel: 'Hidayatus Shibyan, Jazariyah' },
  { value: 'Kitab Kuning Lainnya', label: 'Kitab Kuning Lainnya', sublabel: 'Materi Hafalan Lain' }
];

export default function MobileMateriHafalan() {
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKat, setSelectedKat] = useState('Semua');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_materi: '',
    kategori: "Nahwu & Shorof",
    target_hafalan: '',
    deskripsi: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/materi-hafalan');
      if (res.data && res.data.success && res.data.data) {
        setMateriList(res.data.data);
      }
    } catch (e) {
      console.warn('Gagal ambil materi:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setFormMode('add');
    setFormData({
      id: null,
      nama_materi: '',
      kategori: 'Nahwu & Shorof',
      target_hafalan: '',
      deskripsi: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      nama_materi: item.nama_materi || '',
      kategori: item.kategori || 'Kitab Kuning Lainnya',
      target_hafalan: item.target_hafalan || '',
      deskripsi: item.deskripsi || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama_materi.trim()) {
      showError('Perhatian', 'Nama materi hafalan / kitab wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/materi-hafalan', formData);
        if (res.data && res.data.success) {
          toastSuccess('Materi hafalan baru berhasil disimpan!');
        }
      } else {
        const res = await axios.put(`/api/materi-hafalan/${formData.id}`, formData);
        if (res.data && res.data.success) {
          toastSuccess('Data materi hafalan berhasil diperbarui!');
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm(
      'Hapus Materi',
      `Yakin hapus "${item.nama_materi}" dari database?`,
      'Ya, Hapus',
      'Batal'
    );
    if (ok) {
      try {
        await axios.delete(`/api/materi-hafalan/${item.id}`);
        toastSuccess(`Materi "${item.nama_materi}" telah dihapus`);
        fetchData();
      } catch (err) {
        showError('Gagal Menghapus', err.message);
      }
    }
  };

  const filteredList = materiList.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = (
      (item.nama_materi || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q) ||
      (item.target_hafalan || '').toLowerCase().includes(q) ||
      (item.deskripsi || '').toLowerCase().includes(q)
    );

    const matchKat = selectedKat === 'Semua' ? true : item.kategori === selectedKat;
    return matchSearch && matchKat;
  });

  const getKatColor = (kat = '') => {
    const lower = kat.toLowerCase();
    if (lower.includes('qur')) return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    if (lower.includes('nahwu')) return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    if (lower.includes('fiqih')) return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    if (lower.includes('hadits')) return { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
    return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '12px 14px 90px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Top Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 60%, #064e3b 100%)',
        borderRadius: '16px',
        padding: '16px',
        color: '#ffffff',
        marginBottom: '14px',
        boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.66rem',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '999px',
              marginBottom: '6px',
              letterSpacing: '0.04em'
            }}>
              DATA MASTER PONPES
            </span>
            <h2 style={{ fontSize: '1.12rem', fontWeight: 800, margin: '0 0 2px', color: '#ffffff' }}>
              Materi Hafalan & Kitab
            </h2>
            <p style={{ fontSize: '0.74rem', color: '#d1fae5', margin: 0 }}>
              Daftar kitab & Al-Qur'an untuk mutaba'ah santri
            </p>
          </div>

          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            <BookOpen size={24} />
          </div>
        </div>

        {/* Counter Pill */}
        <div style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.74rem'
        }}>
          <span style={{ color: '#d1fae5' }}>Total Master Tersimpan:</span>
          <span style={{ fontWeight: 800, background: '#ffffff', color: '#047857', padding: '1px 8px', borderRadius: '10px' }}>
            {materiList.length} Materi
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari materi kitab / nadzom..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            fontSize: '0.84rem',
            boxSizing: 'border-box',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        />
      </div>

      {/* Filter Horizontal Category Chips */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '10px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {['Semua', "Al-Qur'an", 'Nahwu & Shorof', "Fiqih Syafi'i", 'Hadits Nabawi', 'Aqidah & Tauhid', 'Tajwid'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedKat(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: selectedKat === cat ? '1px solid #059669' : '1px solid #e2e8f0',
              background: selectedKat === cat ? '#059669' : '#ffffff',
              color: selectedKat === cat ? '#ffffff' : '#475569',
              fontSize: '0.74rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: selectedKat === cat ? '0 2px 6px rgba(5, 150, 105, 0.3)' : 'none',
              flexShrink: 0
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List Card Materi */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
          <p style={{ fontSize: '0.82rem' }}>Memuat daftar materi hafalan...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '36px 16px',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <BookOpen size={36} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>Tidak ada materi ditemukan</div>
          <p style={{ fontSize: '0.76rem', margin: '4px 0 0' }}>Tekan tombol (+) untuk menambahkan materi baru</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredList.map((item) => {
            const badge = getKatColor(item.kategori);
            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  padding: '14px',
                  boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                      {item.nama_materi}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '5px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {item.kategori || 'Kitab Kuning'}
                      </span>
                      {item.target_hafalan && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          background: '#f1f5f9',
                          color: '#475569',
                          border: '1px solid #e2e8f0'
                        }}>
                          🎯 {item.target_hafalan}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => openEdit(item)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        cursor: 'pointer'
                      }}
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        cursor: 'pointer'
                      }}
                      title="Hapus"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {item.deskripsi && (
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9'
                  }}>
                    {item.deskripsi}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) (+) */}
      <button
        onClick={openAdd}
        style={{
          position: 'fixed',
          bottom: '82px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px -2px rgba(5, 150, 105, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90,
          transition: 'transform 0.15s ease'
        }}
        title="Tambah Materi Hafalan Baru"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      {/* MODAL FORM BOTTOM-SHEET / OVERLAY */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderTopLeftRadius: '22px',
            borderTopRightRadius: '22px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)',
            padding: '18px 18px 26px',
            boxSizing: 'border-box'
          }}>
            {/* Sheet Handle */}
            <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '4px', margin: '0 auto 14px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="#059669" />
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {formMode === 'add' ? 'Tambah Materi Hafalan' : 'Edit Materi Hafalan'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Nama Materi / Kitab <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_materi}
                  onChange={(e) => setFormData({ ...formData, nama_materi: e.target.value })}
                  placeholder="Contoh: Nadzom Al-Jurumiyah, Matan Taqrib..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Kategori Keilmuan <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <SearchableSelect
                  options={KATEGORI_MOBILE_OPTIONS}
                  value={formData.kategori}
                  onChange={(val) => setFormData({ ...formData, kategori: val })}
                  placeholder="-- Pilih Kategori --"
                  searchPlaceholder="Cari kategori..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Target Hafalan
                </label>
                <input
                  type="text"
                  value={formData.target_hafalan}
                  onChange={(e) => setFormData({ ...formData, target_hafalan: e.target.value })}
                  placeholder="Contoh: 60 Bait, 30 Juz, 42 Hadits..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Keterangan / Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Catatan tambahan materi hafalan..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.84rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{formMode === 'add' ? 'Simpan Materi' : 'Perbarui'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
