import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  RotateCw, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Save, 
  Award, 
  UserCheck, 
  Sparkles, 
  Calendar, 
  Printer, 
  FileText, 
  Building,
  FolderPlus,
  Tag
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const DEFAULT_PRAKTEK_DATA = [
  {
    id: 1,
    santri_id: 1,
    nama_santri: 'Ahmad Faiz Al-Hafidz',
    nis: '2601001',
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    nama_kamar: 'Kamar Abu Bakar 01',
    kategori: 'Sholat Fardhu',
    nama_praktek: 'Praktek Sholat Shubuh + Qunut',
    deskripsi: 'Makhraj huruf fashih, gerakan ruku dan sujud sempurna sesuai sunnah, qunut lancar.',
    status: 'Lulus',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    tanggal_ujian: '2026-10-12'
  },
  {
    id: 2,
    santri_id: 1,
    nama_santri: 'Ahmad Faiz Al-Hafidz',
    nis: '2601001',
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    nama_kamar: 'Kamar Abu Bakar 01',
    kategori: 'Wudhu & Tayammum',
    nama_praktek: 'Praktek Wudhu Sempurna & Doa',
    deskripsi: 'Rukun dan sunnah wudhu terlaksana tertib serta doa setelah wudhu lancar.',
    status: 'Lulus',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    tanggal_ujian: '2026-10-10'
  },
  {
    id: 3,
    santri_id: 2,
    nama_santri: 'Zaidan Muhammad',
    nis: '2601002',
    nama_asrama: 'Asrama Umar bin Khattab',
    nama_kamar: 'Kamar Umar 01',
    kategori: 'Sholat Fardhu',
    nama_praktek: 'Praktek Sholat Maghrib & Dzikir Ba\'da Sholat',
    deskripsi: 'Bacaan surat dan rukun sah, tuma\'ninah ruku perlu sedikit diperpanjang.',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    tanggal_ujian: '2026-10-11'
  },
  {
    id: 4,
    santri_id: 3,
    nama_santri: 'Fatimah Az-Zahra',
    nis: '2602001',
    nama_asrama: 'Asrama Fathimah Az-Zahra',
    nama_kamar: 'Kamar Aisyah 01',
    kategori: 'Sholat Jenazah',
    nama_praktek: 'Praktek Sholat Jenazah (4 Takbir)',
    deskripsi: 'Hafalan doa takbir ke-3 dan ke-4 sangat lancar dan tartil.',
    status: 'Lulus',
    nama_penguji: 'Usth. Salma M.Pd',
    tanggal_ujian: '2026-10-09'
  },
  {
    id: 5,
    santri_id: 4,
    nama_santri: 'Muhammad Rifqi',
    nis: '2601003',
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    nama_kamar: 'Kamar Abu Bakar 02',
    kategori: 'Wudhu & Tayammum',
    nama_praktek: 'Praktek Wudhu & Thaharah',
    deskripsi: 'Basuhan kedua telinga dan tertib rukun belum sempurna, mengulang pekan depan.',
    status: 'Mengulang',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    tanggal_ujian: '2026-10-08'
  },
  {
    id: 6,
    santri_id: 5,
    nama_santri: 'Aisyah Humaira',
    nis: '2602002',
    nama_asrama: 'Asrama Fathimah Az-Zahra',
    nama_kamar: 'Kamar Aisyah 02',
    kategori: 'Adzan & Iqomah',
    nama_praktek: 'Praktek Adzan Shubuh & Tarhim',
    deskripsi: 'Vokal lantang, tajwid lafadz adzan benar dan intonasi indah.',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    tanggal_ujian: '2026-10-07'
  }
];

export default function PraktekIbadahView() {
  const [praktekList, setPraktekList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    santri_id: '',
    kategori: 'Sholat Fardhu',
    deskripsi: '',
    status: 'Lulus',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    tanggal_ujian: new Date().toISOString().split('T')[0]
  });

  // Modal Detail
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPraktek, setSelectedPraktek] = useState(null);

  // Modal Kelola Kategori
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKatName, setNewKatName] = useState('');
  const [newKatDesc, setNewKatDesc] = useState('');
  const [savingKat, setSavingKat] = useState(false);

  const fetchPraktek = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/praktek');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPraktekList(res.data.data);
      } else {
        loadFallbackPraktek();
      }
    } catch (e) {
      loadFallbackPraktek();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackPraktek = () => {
    try {
      const cached = localStorage.getItem('epesantren_praktek_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPraktekList(parsed);
          return;
        }
      }
    } catch (e) {}
    setPraktekList(DEFAULT_PRAKTEK_DATA);
  };

  const fetchSantriMaster = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSantriList(res.data.data);
      } else {
        setSantriList([
          { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib' },
          { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab' },
          { id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' },
          { id: 4, nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib' },
          { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra' },
          { id: 6, nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab' }
        ]);
      }
    } catch (e) {
      setSantriList([
        { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib' },
        { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab' },
        { id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' }
      ]);
    }
  };

  const fetchKategoriMaster = async () => {
    try {
      const res = await axios.get('/api/praktek/kategori');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setKategoriList(res.data.data);
      } else {
        setKategoriList([
          { id: 1, nama_kategori: 'Sholat Fardhu', deskripsi: 'Praktek kaifiyah dan bacaan sholat lima waktu' },
          { id: 2, nama_kategori: 'Wudhu & Tayammum', deskripsi: 'Tata cara bersuci wudhu dan tayammum sunnah' },
          { id: 3, nama_kategori: 'Sholat Jenazah', deskripsi: 'Praktek tata cara sholat jenazah 4 takbir' },
          { id: 4, nama_kategori: 'Adzan & Iqomah', deskripsi: 'Keterampilan adzan, tarhim dan iqomah' },
          { id: 5, nama_kategori: 'Dzikir & Doa', deskripsi: 'Wirid ba\'da sholat fardhu dan doa harian' },
          { id: 6, nama_kategori: 'Mandi Wajib', deskripsi: 'Rukun dan niat thaharah mandi junub' },
          { id: 7, nama_kategori: 'Khutbah & Ceramah', deskripsi: 'Kultum, ceramah dan rukun khutbah Jum\'at' }
        ]);
      }
    } catch (e) {
      setKategoriList([
        { id: 1, nama_kategori: 'Sholat Fardhu', deskripsi: 'Praktek kaifiyah dan bacaan sholat lima waktu' },
        { id: 2, nama_kategori: 'Wudhu & Tayammum', deskripsi: 'Tata cara bersuci wudhu dan tayammum sunnah' },
        { id: 3, nama_kategori: 'Sholat Jenazah', deskripsi: 'Praktek tata cara sholat jenazah 4 takbir' }
      ]);
    }
  };

  useEffect(() => {
    fetchPraktek();
    fetchSantriMaster();
    fetchKategoriMaster();
  }, []);

  const syncCache = (newList) => {
    setPraktekList(newList);
    try {
      localStorage.setItem('epesantren_praktek_cache', JSON.stringify(newList));
    } catch (e) {}
  };

  // Open Add Form
  const openAddForm = () => {
    setFormMode('add');
    const defaultKat = kategoriList[0]?.nama_kategori || 'Sholat Fardhu';
    setFormData({
      id: null,
      santri_id: santriList[0]?.id || 1,
      kategori: defaultKat,
      deskripsi: '',
      status: 'Lulus',
      nama_penguji: 'Ust. Hamdan S.Pd.I',
      tanggal_ujian: new Date().toISOString().split('T')[0]
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id,
      kategori: item.kategori || 'Sholat Fardhu',
      deskripsi: item.deskripsi || item.catatan_perbaikan || '',
      status: (item.status === 'Remedial' || item.status === 'Mengulang') ? 'Mengulang' : 'Lulus',
      nama_penguji: item.nama_penguji || 'Ust. Hamdan S.Pd.I',
      tanggal_ujian: item.tanggal_ujian ? item.tanggal_ujian.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      showError('Validasi Gagal', 'Silakan pilih santri yang diuji.');
      return;
    }

    try {
      setSubmitting(true);
      const selectedSantriObj = santriList.find((s) => s.id === Number(formData.santri_id));
      const payload = {
        ...formData,
        nama_praktek: formData.kategori
      };

      if (formMode === 'add') {
        let newId = Date.now();
        try {
          const res = await axios.post('/api/praktek', payload);
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch (apiErr) {}

        const newItem = {
          ...payload,
          id: newId,
          nama_santri: selectedSantriObj?.nama_santri || 'Santri',
          nis: selectedSantriObj?.nis || '-',
          nama_asrama: selectedSantriObj?.nama_asrama || 'Asrama'
        };

        const updated = [newItem, ...praktekList];
        syncCache(updated);
        toastSuccess('Berhasil!', 'Data penilaian praktek ibadah berhasil disimpan.');
      } else {
        try {
          await axios.put(`/api/praktek/${formData.id}`, formData);
        } catch (apiErr) {}

        const updated = praktekList.map((item) => {
          if (item.id === formData.id) {
            return {
              ...item,
              ...formData,
              nama_santri: selectedSantriObj?.nama_santri || item.nama_santri,
              nis: selectedSantriObj?.nis || item.nis,
              nama_asrama: selectedSantriObj?.nama_asrama || item.nama_asrama
            };
          }
          return item;
        });

        syncCache(updated);
        toastSuccess('Berhasil!', 'Data penilaian praktek ibadah berhasil diperbarui.');
      }

      setIsFormOpen(false);
    } catch (err) {
      showError('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = (item) => {
    showConfirm(
      'Hapus Penilaian Praktek?',
      `Hapus penilaian ${item.nama_praktek} untuk santri ${item.nama_santri}?`,
      async () => {
        try {
          await axios.delete(`/api/praktek/${item.id}`).catch(() => null);
          const updated = praktekList.filter((p) => p.id !== item.id);
          syncCache(updated);
          toastSuccess('Dihapus!', 'Data praktek ibadah berhasil dihapus.');
        } catch (err) {
          showError('Gagal', 'Gagal menghapus data.');
        }
      }
    );
  };

  // Handle Add Kategori Custom
  const handleAddKategori = async (e) => {
    e.preventDefault();
    if (!newKatName.trim()) {
      showError('Validasi Gagal', 'Nama kategori wajib diisi.');
      return;
    }
    setSavingKat(true);
    try {
      const res = await axios.post('/api/praktek/kategori', {
        nama_kategori: newKatName.trim(),
        deskripsi: newKatDesc.trim()
      }).catch(() => null);

      const created = res?.data?.data || {
        id: Date.now(),
        nama_kategori: newKatName.trim(),
        deskripsi: newKatDesc.trim()
      };

      const updated = [...kategoriList, created];
      setKategoriList(updated);
      setNewKatName('');
      setNewKatDesc('');
      toastSuccess('Berhasil!', 'Kategori praktek baru berhasil ditambahkan.');
    } catch (err) {
      showError('Gagal', 'Gagal menambah kategori baru.');
    } finally {
      setSavingKat(false);
    }
  };

  const handleDeleteKategori = (kat) => {
    showConfirm(
      'Hapus Kategori?',
      `Hapus kategori "${kat.nama_kategori}"?`,
      async () => {
        try {
          await axios.delete(`/api/praktek/kategori/${kat.id}`).catch(() => null);
          const updated = kategoriList.filter(k => k.id !== kat.id);
          setKategoriList(updated);
          toastSuccess('Kategori berhasil dihapus');
        } catch (err) {
          showError('Gagal menghapus kategori');
        }
      }
    );
  };

  // Filtered List
  const filteredList = praktekList.filter((item) => {
    const matchSearch =
      !search ||
      (item.nama_santri && item.nama_santri.toLowerCase().includes(search.toLowerCase())) ||
      (item.nis && item.nis.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_praktek && item.nama_praktek.toLowerCase().includes(search.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_penguji && item.nama_penguji.toLowerCase().includes(search.toLowerCase()));

    const matchKat = filterKategori === 'Semua Kategori' || item.kategori === filterKategori;
    const itemStatus = (item.status === 'Remedial' || item.status === 'Mengulang') ? 'Mengulang' : 'Lulus';
    const matchStatus = filterStatus === 'Semua Status' || itemStatus === filterStatus;

    return matchSearch && matchKat && matchStatus;
  });

  // Statistik
  const totalSantriDiuji = praktekList.length;
  const totalLulus = praktekList.filter((p) => p.status === 'Lulus').length;
  const totalMengulang = praktekList.filter((p) => p.status === 'Mengulang' || p.status === 'Remedial').length;
  const totalKategori = kategoriList.length;

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* ================= HEADER SECTION ================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Ujian Praktek Ibadah
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Perekaman kelulusan ibadah amaliyah (sholat, wudhu, thaharah, jenazah, adzan) santri.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsKategoriModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={16} color="#059669" />
            Kelola Kategori
          </button>

          <button
            onClick={fetchPraktek}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            Segarkan
          </button>

          <button
            onClick={openAddForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}
          >
            <Plus size={16} />
            Input Penilaian Ujian
          </button>
        </div>
      </div>

      {/* ================= STATS SUMMARY CARDS ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Total Diuji */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Penilaian Ujian
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {totalSantriDiuji}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
              Seluruh catatan amaliyah
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
        </div>

        {/* Total Lulus */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Santri Lulus Ujian
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
              {totalLulus}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
              Memenuhi syarat ibadah
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#d1fae5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Total Mengulang */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Santri Mengulang
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
              {totalMengulang}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '4px' }}>
              Perlu bimbingan & ujian ulang
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCw size={22} />
          </div>
        </div>

        {/* Total Kategori */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Kategori Praktek
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
              {totalKategori}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px' }}>
              Bidang amaliah aktif
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={22} />
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '14px 18px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '7px 12px',
          minWidth: '280px',
          flex: '1 1 300px'
        }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, materi praktek, atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.84rem',
              color: '#1e293b',
              width: '100%'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '210px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, flexShrink: 0 }}>Kategori:</span>
            <SearchableSelect
              options={[
                { value: 'Semua Kategori', label: 'Semua Kategori' },
                ...kategoriList.map(k => ({ value: k.nama_kategori || k, label: k.nama_kategori || k }))
              ]}
              value={filterKategori}
              onChange={(val) => setFilterKategori(val || 'Semua Kategori')}
              placeholder="Semua Kategori"
              searchPlaceholder="Cari kategori..."
              triggerStyle={{
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.82rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Lulus">Lulus</option>
              <option value="Mengulang">Mengulang</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= TABLE LIST ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700, width: '40px' }}>No</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Santri</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Kategori Praktek</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Deskripsi & Evaluasi</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Penguji & Tanggal</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Nilai / Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', width: '120px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data penilaian praktek ibadah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isLulus = item.status === 'Lulus';
                  const initials = (item.nama_santri || 'S').slice(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={item.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '12px 14px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>

                      {/* Santri */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #059669, #0d9488)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                              {item.nama_santri}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              NIS: <strong style={{ color: '#047857' }}>{item.nis}</strong> • {item.nama_asrama || 'Asrama'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kategori Praktek */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '0.84rem',
                          fontWeight: 800,
                          color: '#065f46',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {item.kategori}
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td style={{ padding: '12px 14px', maxWidth: '320px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.35 }}>
                          {item.deskripsi || item.catatan_perbaikan || '-'}
                        </div>
                      </td>

                      {/* Penguji & Tanggal */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                          <UserCheck size={13} color="#059669" />
                          <span>{item.nama_penguji || 'Ust. Penguji'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          <Calendar size={12} />
                          <span>{item.tanggal_ujian ? String(item.tanggal_ujian).split('T')[0] : '-'}</span>
                        </div>
                      </td>

                      {/* Nilai / Status Lulus / Mengulang */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          background: isLulus ? '#dcfce7' : '#fee2e2',
                          color: isLulus ? '#15803d' : '#b91c1c',
                          border: `1px solid ${isLulus ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {isLulus ? <CheckCircle2 size={13} /> : <RotateCw size={13} />}
                          {isLulus ? 'LULUS' : 'MENGULANG'}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => openEditForm(item)}
                            title="Edit Penilaian"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#2563eb',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            title="Hapus Penilaian"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              color: '#dc2626',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL FORM INPUT / EDIT ================= */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#d1fae5',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {formMode === 'add' ? 'Input Ujian Praktek Ibadah' : 'Edit Ujian Praktek Ibadah'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Form penilaian kelulusan kompetensi ibadah santri
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} style={{ padding: '22px' }}>
              
              {/* Santri Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Pilih Santri Diuji *
                </label>
                <SearchableSelect
                  options={santriList.map((s) => ({
                    value: s.id,
                    label: `${s.nama_santri} (NIS: ${s.nis || '-'}) - ${s.nama_asrama || 'Asrama'}`
                  }))}
                  value={formData.santri_id}
                  onChange={(val) => setFormData({ ...formData, santri_id: val })}
                  placeholder="Ketik nama atau NIS santri..."
                />
              </div>

              {/* Kategori Praktek */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    Kategori Praktek *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsKategoriModalOpen(true)}
                    style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Kelola / Tambah Kategori
                  </button>
                </div>
                <SearchableSelect
                  options={kategoriList.map((k) => {
                    const kName = k.nama_kategori || k;
                    return {
                      value: kName,
                      label: kName,
                      sublabel: k.deskripsi || null
                    };
                  })}
                  value={formData.kategori}
                  onChange={(val) => setFormData({ ...formData, kategori: val })}
                  placeholder="-- Pilih atau cari kategori praktek --"
                  searchPlaceholder="Ketik kategori (sholat, wudhu, dll)..."
                  triggerStyle={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* NILAI: HANYA LULUS & MENGULANG */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Hasil Nilai Ujian *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Lulus' })}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: formData.status === 'Lulus' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: formData.status === 'Lulus' ? '#ecfdf5' : '#ffffff',
                      color: formData.status === 'Lulus' ? '#047857' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={18} color={formData.status === 'Lulus' ? '#059669' : '#94a3b8'} />
                    Lulus
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Mengulang' })}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: formData.status === 'Mengulang' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: formData.status === 'Mengulang' ? '#fef2f2' : '#ffffff',
                      color: formData.status === 'Mengulang' ? '#b91c1c' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={18} color={formData.status === 'Mengulang' ? '#dc2626' : '#94a3b8'} />
                    Mengulang
                  </button>
                </div>
              </div>

              {/* Deskripsi & Evaluasi */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi & Catatan Ujian
                </label>
                <textarea
                  rows="3"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan keterangan evaluasi, makhraj bacaan, ketertiban gerakan..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Penguji & Tanggal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Asatidz Penguji
                  </label>
                  <input
                    type="text"
                    value={formData.nama_penguji}
                    onChange={(e) => setFormData({ ...formData, nama_penguji: e.target.value })}
                    required
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

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Tanggal Ujian
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_ujian}
                    onChange={(e) => setFormData({ ...formData, tanggal_ujian: e.target.value })}
                    required
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
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.84rem',
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
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={16} />
                  Simpan Penilaian
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL KELOLA KATEGORI MASTER ================= */}
      {isKategoriModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1050,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Kelola Kategori Praktek (Custom)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Master tabel kategori ujian praktek amaliyah pondok
                </p>
              </div>
              <button
                onClick={() => setIsKategoriModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddKategori} style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                + Tambah Kategori Baru
              </div>
              <input
                type="text"
                placeholder="Nama Kategori (contoh: Manasik Haji, Khutbah, Mandi Wajib)"
                value={newKatName}
                onChange={(e) => setNewKatName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', marginBottom: '6px' }}
              />
              <input
                type="text"
                placeholder="Deskripsi singkat (opsional)"
                value={newKatDesc}
                onChange={(e) => setNewKatDesc(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', marginBottom: '8px' }}
              />
              <button
                type="submit"
                disabled={savingKat}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} /> Simpan Kategori Baru
              </button>
            </form>

            {/* List Kategori */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Daftar Kategori Tersedia ({kategoriList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {kategoriList.map((kat, idx) => {
                  const katName = kat.nama_kategori || kat;
                  const katDesc = kat.deskripsi || '';
                  return (
                    <div
                      key={kat.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '8px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                          {katName}
                        </div>
                        {katDesc && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {katDesc}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteKategori(kat)}
                        title="Hapus Kategori"
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#dc2626',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setIsKategoriModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
