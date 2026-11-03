import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  RotateCw, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Sparkles, 
  Save,
  CheckCircle2,
  BookmarkCheck,
  Layers,
  ScrollText,
  FileSpreadsheet
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const KATEGORI_OPTIONS = [
  { value: "Nahwu & Shorof", label: "Nahwu & Shorof", sublabel: 'Jurumiyah, Imrithi, Alfiyah, Kailani, I\'lal, Tasrifan' },
  { value: "Fiqih", label: "Fiqih", sublabel: 'Safinah, Bajuri, Sulam Taufik, I\'anah, Riyadhul Badi\'ah' },
  { value: "Tajwid & Al-Qur'an", label: "Tajwid & Al-Qur'an", sublabel: 'Tajwid, Al-Qur\'an, Khataman Qur\'an' },
  { value: "Muhafadzoh (Hafalan)", label: "Muhafadzoh (Hafalan)", sublabel: 'Setoran Jurumiyah, Imrithi, Alfiyah, Waroqot' },
  { value: "Akhlak & Adab", label: "Akhlak & Adab", sublabel: 'Ta\'lim, Akhlaqul Banin' },
  { value: "Aqidah & Tauhid", label: "Aqidah & Tauhid", sublabel: 'Tijan Ad-Darori' },
  { value: "Ushul Fiqih", label: "Ushul Fiqih", sublabel: 'Waroqot, Lathoif' },
  { value: "Tasawwuf & Adab", label: "Tasawwuf & Adab", sublabel: 'Bidayatul Hidayah' },
  { value: "Tafsir & Ulumul Quran", label: "Tafsir & Ulumul Quran", sublabel: 'Kajian Tafsir' },
  { value: "Praktek & Ubudiyah", label: "Praktek & Ubudiyah", sublabel: 'Praktek Ibadah' },
  { value: "Bahasa & Penulisan", label: "Bahasa & Penulisan", sublabel: 'Pegon, Penulisan Patokan, Bahasa Inggris' },
  { value: "Qiroatul Kitab", label: "Qiroatul Kitab", sublabel: 'Baca Kosongan' },
  { value: "Bahtsul Masail & Diskusi", label: "Bahtsul Masail & Diskusi", sublabel: 'Munadzoroh' },
  { value: "Doa & Wirid", label: "Doa & Wirid", sublabel: 'Tafrijul Qurob, Al-Burdah' },
  { value: "Kitab Kuning Lainnya", label: "Kitab Kuning Lainnya", sublabel: 'Kegiatan Pembelajaran Lainnya' }
];

export default function MasterMateriView() {
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_materi: '',
    kategori: "Nahwu & Shorof",
    target_hafalan: '',
    deskripsi: ''
  });

  const fetchMateri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/materi-hafalan');
      if (res.data && res.data.success && res.data.data) {
        setMateriList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch /api/materi-hafalan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateri();
  }, []);

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      nama_materi: '',
      kategori: 'Nahwu & Shorof',
      target_hafalan: '',
      deskripsi: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      nama_materi: item.nama_materi || '',
      kategori: item.kategori || 'Kitab Kuning Lainnya',
      target_hafalan: item.target_hafalan || '',
      deskripsi: item.deskripsi || ''
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama_materi.trim()) {
      showError('Validasi Gagal', 'Nama materi hafalan / kitab wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/materi-hafalan', formData);
        if (res.data && res.data.success) {
          toastSuccess('Materi hafalan baru berhasil ditambahkan ke database');
        }
      } else {
        const res = await axios.put(`/api/materi-hafalan/${formData.id}`, formData);
        if (res.data && res.data.success) {
          toastSuccess('Data materi hafalan berhasil diperbarui');
        }
      }
      setIsFormOpen(false);
      fetchMateri();
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const ok = await showConfirm(
      'Hapus Materi Hafalan',
      `Apakah Anda yakin ingin menghapus "${item.nama_materi}" dari master database?`,
      'Ya, Hapus',
      'Batal'
    );
    if (ok) {
      try {
        await axios.delete(`/api/materi-hafalan/${item.id}`);
        toastSuccess(`Materi "${item.nama_materi}" berhasil dihapus.`);
        fetchMateri();
      } catch (err) {
        showError('Gagal Menghapus', err.message);
      }
    }
  };

  // Filter list
  const filteredList = materiList.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = (
      (item.nama_materi || '').toLowerCase().includes(q) ||
      (item.kategori || '').toLowerCase().includes(q) ||
      (item.target_hafalan || '').toLowerCase().includes(q) ||
      (item.deskripsi || '').toLowerCase().includes(q)
    );

    const matchKat = filterKategori === 'semua' ? true : item.kategori === filterKategori;
    return matchSearch && matchKat;
  });

  // Kategori badge color mapping
  const getBadgeStyle = (kat = '') => {
    const lower = kat.toLowerCase();
    if (lower.includes('qur')) return { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    if (lower.includes('nahwu')) return { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' };
    if (lower.includes('fiqih')) return { bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
    if (lower.includes('hadits')) return { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
    if (lower.includes('aqidah')) return { bg: '#fce7f3', color: '#9d174d', border: '#fbcfe8' };
    if (lower.includes('tajwid')) return { bg: '#ccfbf1', color: '#115e59', border: '#99f6e4' };
    if (lower.includes('akhlak')) return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
    return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
  };

  // Stats calculation
  const totalMateri = materiList.length;
  const countQuran = materiList.filter(m => (m.kategori || '').includes("Qur'an")).length;
  const countNahwu = materiList.filter(m => (m.kategori || '').toLowerCase().includes('nahwu')).length;
  const countFiqihHadits = materiList.filter(m => {
    const k = (m.kategori || '').toLowerCase();
    return k.includes('fiqih') || k.includes('hadits');
  }).length;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (PERSIS MASTER SANTRI) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL KEGIATAN & KITAB</div>
            <div className="stat-colored-number">{totalMateri}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">FIQIH & USHUL FIQIH</div>
            <div className="stat-colored-number">{countFiqihHadits}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Layers size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">NAHWU, SHOROF & MUHAFADZOH</div>
            <div className="stat-colored-number">{countNahwu}</div>
          </div>
          <div className="stat-colored-icon-box">
            <ScrollText size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">AL-QUR'AN, TAJWID & LAINNYA</div>
            <div className="stat-colored-number">{countQuran}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookmarkCheck size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP (PERSIS MASTER SANTRI) */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Kegiatan & Pembelajaran Kitab</h2>
            <p>Kelola daftar 39 kegiatan pembelajaran kitab, muhafadzoh, tajwid, nahwu & shorof, dan praktek ibadah</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchMateri}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Kegiatan / Kitab Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR (PERSIS MASTER SANTRI) */}
      <div className="tab-filter-bar">
        {[
          { id: 'semua', label: `Semua Kegiatan (${totalMateri})` },
          { id: 'Nahwu & Shorof', label: 'Nahwu & Shorof' },
          { id: 'Fiqih', label: 'Fiqih' },
          { id: 'Muhafadzoh (Hafalan)', label: 'Muhafadzoh' },
          { id: "Tajwid & Al-Qur'an", label: "Tajwid & Al-Qur'an" },
          { id: 'Akhlak & Adab', label: 'Akhlak & Adab' },
          { id: 'Ushul Fiqih', label: 'Ushul Fiqih' },
          { id: 'Bahasa & Penulisan', label: 'Bahasa' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${filterKategori === tab.id ? 'active' : ''}`}
            onClick={() => setFilterKategori(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. FILTER SEARCH BAR STRIP (PERSIS MASTER SANTRI) */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama materi, kitab, atau bait..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <SearchableSelect
          style={{ minWidth: '220px', flex: '1 1 200px', maxWidth: '300px' }}
          value={filterKategori}
          onChange={(val) => setFilterKategori(val || 'semua')}
          placeholder="Semua Kategori Bidang"
          options={[
            { value: 'semua', label: 'Semua Kategori Bidang' },
            ...KATEGORI_OPTIONS
          ]}
        />
      </div>

      {/* 5. DATA TABLE (PERSIS MASTER SANTRI) */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
            Memuat data master materi hafalan & kitab...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <BookOpen size={36} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>Tidak Ada Data Materi</div>
            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Belum ada materi yang cocok dengan pencarian atau filter kategori.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA MATERI / KITAB KUNING</th>
                <th>KATEGORI BIDANG</th>
                <th>TARGET CAPAIAN</th>
                <th>KETERANGAN / DESKRIPSI</th>
                <th className="td-center" style={{ width: '120px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, index) => {
                const badge = getBadgeStyle(item.kategori);
                return (
                  <tr key={item.id || index}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {index + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_materi}</div>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Kode: #{item.id}</div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {item.kategori || 'Kitab Kuning'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        🎯 {item.target_hafalan || 'Sesuai Kurikulum'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.74rem', color: '#334155', maxWidth: '300px' }}>
                        {item.deskripsi || '-'}
                      </div>
                    </td>
                    <td className="td-center">
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          className="btn-action btn-action-edit"
                          onClick={() => openEditForm(item)}
                          title="Edit Materi"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          onClick={() => handleDelete(item)}
                          title="Hapus Materi"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT MATERI HAFALAN */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    {formMode === 'add' ? 'Tambah Materi Hafalan / Kitab Baru' : 'Edit Master Materi Hafalan'}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#d1fae5', margin: '2px 0 0' }}>
                    Data tersimpan di tabel database dan langsung muncul di pilihan setoran
                  </p>
                </div>
              </div>
              <button
                onClick={closeForm}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Nama Materi / Kitab */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nama Materi / Kitab Kuning <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama_materi}
                    onChange={(e) => setFormData({ ...formData, nama_materi: e.target.value })}
                    placeholder="Contoh: Nadzom Al-Jurumiyah, Matan Taqrib, Juz 30..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Kategori Bidang */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Kategori Bidang Keilmuan <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <SearchableSelect
                    options={KATEGORI_OPTIONS}
                    value={formData.kategori}
                    onChange={(val) => setFormData({ ...formData, kategori: val })}
                    placeholder="-- Pilih Kategori Bidang --"
                    searchPlaceholder="Cari kategori..."
                  />
                </div>

                {/* Target Capaian (Bait / Halaman / Juz) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Target Hafalan / Satuan Capaian
                  </label>
                  <input
                    type="text"
                    value={formData.target_hafalan}
                    onChange={(e) => setFormData({ ...formData, target_hafalan: e.target.value })}
                    placeholder="Contoh: 60 Bait, 30 Juz, 42 Hadits, 1002 Bait..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Keterangan & Deskripsi */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Deskripsi & Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Catatan tambahan mengenai materi hafalan, jenjang kelas yang wajib menghafal, dll..."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 20px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>{formMode === 'add' ? 'Simpan ke Database' : 'Perbarui Data'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
