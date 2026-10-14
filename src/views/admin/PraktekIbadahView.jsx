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
  Check, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Building
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
    nilai_gerakan: 95,
    nilai_bacaan: 96,
    nilai_adab: 92,
    nilai_akhir: 94,
    predikat: 'Mumtaz (A)',
    status: 'Lulus',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    catatan_perbaikan: 'Makhraj huruf fashih, gerakan ruku dan sujud sempurna sesuai sunnah.',
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
    nilai_gerakan: 90,
    nilai_bacaan: 92,
    nilai_adab: 90,
    nilai_akhir: 91,
    predikat: 'Mumtaz (A)',
    status: 'Lulus',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    catatan_perbaikan: 'Rukun dan sunnah wudhu terlaksana tertib.',
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
    nilai_gerakan: 88,
    nilai_bacaan: 85,
    nilai_adab: 87,
    nilai_akhir: 87,
    predikat: 'Jayyid Jiddan (B+)',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    catatan_perbaikan: 'Tuma\'ninah ruku perlu sedikit diperpanjang.',
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
    nilai_gerakan: 92,
    nilai_bacaan: 90,
    nilai_adab: 94,
    nilai_akhir: 92,
    predikat: 'Mumtaz (A)',
    status: 'Lulus',
    nama_penguji: 'Usth. Salma M.Pd',
    catatan_perbaikan: 'Hafalan doa takbir ke-3 dan ke-4 sangat lancar.',
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
    nilai_gerakan: 65,
    nilai_bacaan: 60,
    nilai_adab: 62,
    nilai_akhir: 62,
    predikat: 'Maqbul (C)',
    status: 'Remedial',
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    catatan_perbaikan: 'Basuhan kedua telinga dan tertib rukun belum sempurna, remedial pekan depan.',
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
    nilai_gerakan: 86,
    nilai_bacaan: 88,
    nilai_adab: 85,
    nilai_akhir: 86,
    predikat: 'Jayyid Jiddan (B+)',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    catatan_perbaikan: 'Vokal lantang, tajwid lafadz adzan benar.',
    tanggal_ujian: '2026-10-07'
  }
];

const KATEGORI_OPTIONS = [
  'Semua Kategori',
  'Wudhu & Tayammum',
  'Sholat Fardhu',
  'Sholat Jenazah',
  'Adzan & Iqomah',
  'Dzikir & Doa',
  'Mandi Wajib',
  'Khutbah & Ceramah'
];

const PRESET_MATERI = {
  'Wudhu & Tayammum': [
    'Praktek Wudhu Sempurna & Doa',
    'Praktek Tayammum Sesuai Sunnah',
    'Praktek Rukun & Pembatal Wudhu'
  ],
  'Sholat Fardhu': [
    'Praktek Sholat Shubuh + Qunut',
    'Praktek Sholat Dzuhur 4 Rakaat',
    'Praktek Sholat Ashar 4 Rakaat',
    'Praktek Sholat Maghrib 3 Rakaat',
    'Praktek Sholat Isya & Witir',
    'Praktek Sholat Berjamaah & Masbuq'
  ],
  'Sholat Jenazah': [
    'Praktek Sholat Jenazah (4 Takbir)',
    'Praktek Doa Jenazah Laki-laki & Perempuan'
  ],
  'Adzan & Iqomah': [
    'Praktek Adzan Shubuh & Tarhim',
    'Praktek Adzan Fardhu & Iqomah'
  ],
  'Dzikir & Doa': [
    'Praktek Dzikir Ba\'da Sholat Fardhu',
    'Praktek Doa Harian & Ayat Kursi',
    'Praktek Wirid Rotib Al-Haddad'
  ],
  'Mandi Wajib': [
    'Praktek Rukun Mandi Janabat & Niat',
    'Praktek Thaharah dari Hadats Besar'
  ],
  'Khutbah & Ceramah': [
    'Praktek Rukun Khutbah Jum\'at',
    'Praktek Kultum Ba\'da Shubuh'
  ]
};

export default function PraktekIbadahView() {
  const [praktekList, setPraktekList] = useState([]);
  const [santriList, setSantriList] = useState([]);
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
    nama_praktek: 'Praktek Sholat Shubuh + Qunut',
    nilai_gerakan: 85,
    nilai_bacaan: 85,
    nilai_adab: 85,
    nama_penguji: 'Ust. Hamdan S.Pd.I',
    catatan_perbaikan: '',
    tanggal_ujian: new Date().toISOString().split('T')[0]
  });

  // Modal Detail / Syahadah Report
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPraktek, setSelectedPraktek] = useState(null);

  const fetchPraktek = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/praktek');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPraktekList(res.data.data);
        localStorage.setItem('epesantren_praktek_cache', JSON.stringify(res.data.data));
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
    localStorage.setItem('epesantren_praktek_cache', JSON.stringify(DEFAULT_PRAKTEK_DATA));
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
        { id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' },
        { id: 4, nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib' },
        { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra' },
        { id: 6, nama_santri: 'Bilal Abdurrahman', nis: '2601004', nama_asrama: 'Asrama Umar bin Khattab' }
      ]);
    }
  };

  useEffect(() => {
    fetchPraktek();
    fetchSantriMaster();
  }, []);

  const syncCache = (newList) => {
    setPraktekList(newList);
    try {
      localStorage.setItem('epesantren_praktek_cache', JSON.stringify(newList));
    } catch (e) {}
  };

  // Helper compute final score & predicate
  const calcScore = (gerakan, bacaan, adab) => {
    const avg = Math.round((Number(gerakan) + Number(bacaan) + Number(adab)) / 3);
    let predikat = 'Mumtaz (A)';
    let status = 'Lulus';

    if (avg >= 90) {
      predikat = 'Mumtaz (A)';
    } else if (avg >= 80) {
      predikat = 'Jayyid Jiddan (B+)';
    } else if (avg >= 70) {
      predikat = 'Jayyid (B)';
    } else if (avg >= 60) {
      predikat = 'Maqbul (C)';
    } else {
      predikat = 'Mengulang / Rasib';
      status = 'Remedial';
    }
    return { avg, predikat, status };
  };

  // Open Add Form
  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      santri_id: santriList[0]?.id || 1,
      kategori: 'Sholat Fardhu',
      nama_praktek: 'Praktek Sholat Shubuh + Qunut',
      nilai_gerakan: 85,
      nilai_bacaan: 85,
      nilai_adab: 85,
      nama_penguji: 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan: '',
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
      kategori: item.kategori,
      nama_praktek: item.nama_praktek,
      nilai_gerakan: item.nilai_gerakan,
      nilai_bacaan: item.nilai_bacaan,
      nilai_adab: item.nilai_adab,
      nama_penguji: item.nama_penguji || 'Ust. Hamdan S.Pd.I',
      catatan_perbaikan: item.catatan_perbaikan || '',
      tanggal_ujian: item.tanggal_ujian ? item.tanggal_ujian.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.nama_praktek) {
      showError('Validasi Gagal', 'Silakan pilih santri dan nama praktek ibadah.');
      return;
    }

    try {
      setSubmitting(true);
      const { avg, predikat, status } = calcScore(formData.nilai_gerakan, formData.nilai_bacaan, formData.nilai_adab);
      const selectedSantriObj = santriList.find((s) => s.id === Number(formData.santri_id));

      if (formMode === 'add') {
        let newId = Date.now();
        try {
          const res = await axios.post('/api/praktek', formData);
          if (res.data?.data?.id) newId = res.data.data.id;
        } catch (apiErr) {
          console.warn('[Offline Praktek Add]', apiErr.message);
        }

        const newRecord = {
          id: newId,
          santri_id: Number(formData.santri_id),
          nama_santri: selectedSantriObj?.nama_santri || 'Santri',
          nis: selectedSantriObj?.nis || '2601000',
          nama_asrama: selectedSantriObj?.nama_asrama || 'Asrama Pusat',
          kategori: formData.kategori,
          nama_praktek: formData.nama_praktek,
          nilai_gerakan: Number(formData.nilai_gerakan),
          nilai_bacaan: Number(formData.nilai_bacaan),
          nilai_adab: Number(formData.nilai_adab),
          nilai_akhir: avg,
          predikat,
          status,
          nama_penguji: formData.nama_penguji,
          catatan_perbaikan: formData.catatan_perbaikan || '-',
          tanggal_ujian: formData.tanggal_ujian
        };

        syncCache([newRecord, ...praktekList]);
        toastSuccess('Berhasil!', `Nilai praktek untuk ${newRecord.nama_santri} berhasil disimpan.`);
      } else {
        // Edit Mode
        try {
          await axios.put(`/api/praktek/${formData.id}`, formData);
        } catch (apiErr) {
          console.warn('[Offline Praktek Edit]', apiErr.message);
        }

        const updated = praktekList.map((item) => {
          if (item.id === formData.id) {
            return {
              ...item,
              santri_id: Number(formData.santri_id),
              nama_santri: selectedSantriObj?.nama_santri || item.nama_santri,
              nis: selectedSantriObj?.nis || item.nis,
              nama_asrama: selectedSantriObj?.nama_asrama || item.nama_asrama,
              kategori: formData.kategori,
              nama_praktek: formData.nama_praktek,
              nilai_gerakan: Number(formData.nilai_gerakan),
              nilai_bacaan: Number(formData.nilai_bacaan),
              nilai_adab: Number(formData.nilai_adab),
              nilai_akhir: avg,
              predikat,
              status,
              nama_penguji: formData.nama_penguji,
              catatan_perbaikan: formData.catatan_perbaikan || '-',
              tanggal_ujian: formData.tanggal_ujian
            };
          }
          return item;
        });

        syncCache(updated);
        toastSuccess('Berhasil!', `Penilaian praktek berhasil diperbarui.`);
      }

      setIsFormOpen(false);
    } catch (err) {
      showError('Gagal Menyimpan', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (item) => {
    const ok = await showConfirm(
      'Hapus Penilaian Praktek?',
      `Hapus data penilaian "${item.nama_praktek}" untuk santri ${item.nama_santri}?`
    );
    if (!ok) return;

    try {
      try {
        await axios.delete(`/api/praktek/${item.id}`);
      } catch (e) {}

      const filtered = praktekList.filter((p) => p.id !== item.id);
      syncCache(filtered);
      toastSuccess('Dihapus', 'Data penilaian praktek telah dihapus.');
    } catch (err) {
      showError('Gagal Menghapus', err.message);
    }
  };

  // Open Detail Syahadah
  const openDetail = (item) => {
    setSelectedPraktek(item);
    setIsDetailOpen(true);
  };

  // Filtered List
  const filteredList = praktekList.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.nama_santri && item.nama_santri.toLowerCase().includes(q)) ||
      (item.nis && item.nis.includes(q)) ||
      (item.nama_praktek && item.nama_praktek.toLowerCase().includes(q)) ||
      (item.nama_penguji && item.nama_penguji.toLowerCase().includes(q));

    const matchKat = filterKategori === 'Semua Kategori' || item.kategori === filterKategori;
    const matchSt = filterStatus === 'Semua Status' || item.status === filterStatus;

    return matchSearch && matchKat && matchSt;
  });

  // Predikat badge styling
  const getPredikatBadge = (predikat) => {
    if (predikat.includes('Mumtaz') || predikat.includes('(A)')) {
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    }
    if (predikat.includes('Jayyid Jiddan') || predikat.includes('(B+)')) {
      return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    }
    if (predikat.includes('Jayyid') || predikat.includes('(B)')) {
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    }
    if (predikat.includes('Maqbul') || predikat.includes('(C)')) {
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    }
    return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  };

  // Metrics
  const totalUjian = praktekList.length;
  const totalLulus = praktekList.filter((p) => p.status === 'Lulus').length;
  const totalMumtaz = praktekList.filter((p) => p.predikat.includes('Mumtaz')).length;
  const totalRemedial = praktekList.filter((p) => p.status === 'Remedial').length;

  // Live preview for modal form
  const currentFormCalc = calcScore(formData.nilai_gerakan, formData.nilai_bacaan, formData.nilai_adab);

  return (
    <div className="view-container" style={{ padding: '20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ================= PAGE HEADER ================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        padding: '20px 24px',
        borderRadius: '14px',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(6, 78, 59, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <BookOpen size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Praktek Ibadah & Amaliah Santri
              </h1>
              <span style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                UJIAN AMALIAH
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.88)' }}>
              Penilaian resmi praktek sholat fardhu, sholat jenazah, wudhu, tayammum, adzan, dzikir, dan thaharah.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchPraktek}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Refresh Data"
          >
            <RotateCw size={15} className={loading ? 'spin-animation' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={openAddForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Plus size={16} />
            <span>Catat Penilaian Baru</span>
          </button>
        </div>
      </div>

      {/* ================= METRIC CARDS ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Total Ujian */}
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
              Total Penilaian Praktek
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {totalUjian}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: '4px' }}>
              Tercatat dalam sistem
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
        </div>

        {/* Lulus Mumtaz (A) */}
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
              Predikat Mumtaz (A)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857', marginTop: '2px' }}>
              {totalMumtaz}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
              Nilai sempurna (&ge; 90)
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#d1fae5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
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
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
              {totalLulus}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px' }}>
              Memenuhi syarat amaliah
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Perlu Remedial */}
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
              Perlu Remedial
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
              {totalRemedial}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '4px' }}>
              Perlu bimbingan ulang
            </div>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={22} />
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
            placeholder="Cari nama santri, NIS, materi praktek, atau penguji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '0.84rem',
              color: '#0f172a'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Kategori:</span>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
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
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
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
              <option value="Remedial">Remedial (Mengulang)</option>
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
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Materi Praktek Ibadah</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Rincian Nilai (F/Q/A)</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Nilai Akhir & Predikat</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Penguji & Tanggal</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center', width: '130px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data penilaian praktek ibadah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const predBadge = getPredikatBadge(item.predikat);
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

                      {/* Materi */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          display: 'inline-block',
                          marginBottom: '3px'
                        }}>
                          {item.kategori}
                        </span>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                          {item.nama_praktek}
                        </div>
                        {item.catatan_perbaikan && item.catatan_perbaikan !== '-' && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                            "{item.catatan_perbaikan}"
                          </div>
                        )}
                      </td>

                      {/* Rincian Skor */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', fontSize: '0.74rem' }}>
                          <span title="Nilai Gerakan (Rukun Fi'li)" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                            G: <strong>{item.nilai_gerakan}</strong>
                          </span>
                          <span title="Nilai Bacaan (Rukun Qouli)" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                            B: <strong>{item.nilai_bacaan}</strong>
                          </span>
                          <span title="Nilai Adab & Tuma'ninah" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                            A: <strong>{item.nilai_adab}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Nilai Akhir & Predikat */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                          {item.nilai_akhir}
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: predBadge.bg,
                          color: predBadge.color,
                          border: `1px solid ${predBadge.border}`,
                          display: 'inline-block',
                          marginTop: '2px'
                        }}>
                          {item.predikat}
                        </span>
                      </td>

                      {/* Penguji & Tanggal */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                          {item.nama_penguji || 'Ust. Hamdan S.Pd.I'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {item.tanggal_ujian ? new Date(item.tanggal_ujian).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: item.status === 'Lulus' ? '#dcfce7' : '#fee2e2',
                          color: item.status === 'Lulus' ? '#15803d' : '#b91c1c',
                          border: item.status === 'Lulus' ? '1px solid #a7f3d0' : '1px solid #fecaca'
                        }}>
                          {item.status === 'Lulus' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => openDetail(item)}
                            style={{
                              padding: '5px',
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '6px',
                              color: '#15803d',
                              cursor: 'pointer'
                            }}
                            title="Lihat Syahadah / Rapor Capaian"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => openEditForm(item)}
                            style={{
                              padding: '5px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              color: '#1d4ed8',
                              cursor: 'pointer'
                            }}
                            title="Edit Nilai"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            style={{
                              padding: '5px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              color: '#b91c1c',
                              cursor: 'pointer'
                            }}
                            title="Hapus Nilai"
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

      {/* ================= MODAL FORM INPUT PENILAIAN ================= */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} />
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Catat Ujian Praktek Ibadah Baru' : 'Edit Penilaian Praktek Ibadah'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Santri */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Pilih Santri <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    background: '#ffffff'
                  }}
                >
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri} (NIS: {s.nis}) - {s.nama_asrama || 'Asrama'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori & Materi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Kategori Praktek
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => {
                      const newKat = e.target.value;
                      const presetFirst = PRESET_MATERI[newKat]?.[0] || 'Praktek Ibadah';
                      setFormData({ ...formData, kategori: newKat, nama_praktek: presetFirst });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    {KATEGORI_OPTIONS.filter((k) => k !== 'Semua Kategori').map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Pilihan Preset Materi
                  </label>
                  <select
                    value={formData.nama_praktek}
                    onChange={(e) => setFormData({ ...formData, nama_praktek: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  >
                    {(PRESET_MATERI[formData.kategori] || ['Praktek Ibadah']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nama Praktek Custom Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Judul Materi Lengkap
                </label>
                <input
                  type="text"
                  value={formData.nama_praktek}
                  onChange={(e) => setFormData({ ...formData, nama_praktek: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 3 ASPEK SKOR PENILAIAN */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '14px'
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                  ASPEK PENILAIAN PRAKTEK (SKALA 0 - 100)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                      Rukun Gerakan (Fi'li)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_gerakan}
                      onChange={(e) => setFormData({ ...formData, nilai_gerakan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                      Bacaan & Doa (Qouli)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_bacaan}
                      onChange={(e) => setFormData({ ...formData, nilai_bacaan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                      Adab & Tuma'ninah
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_adab}
                      onChange={(e) => setFormData({ ...formData, nilai_adab: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Live Preview Hasil */}
                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Skor Akhir Rata-rata: </span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{currentFormCalc.avg}</strong>
                  </div>
                  <div>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: currentFormCalc.status === 'Lulus' ? '#dcfce7' : '#fee2e2',
                      color: currentFormCalc.status === 'Lulus' ? '#15803d' : '#b91c1c'
                    }}>
                      {currentFormCalc.predikat} • {currentFormCalc.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Penguji & Tanggal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Asatidz Penguji
                  </label>
                  <input
                    type="text"
                    value={formData.nama_penguji}
                    onChange={(e) => setFormData({ ...formData, nama_penguji: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Tanggal Ujian
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_ujian}
                    onChange={(e) => setFormData({ ...formData, tanggal_ujian: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Catatan / Rekomendasi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Catatan / Evaluasi Pembinaan
                </label>
                <textarea
                  rows="2"
                  placeholder="Misal: Tuma'ninah ruku dan sujud sangat bagus, bacaan qunut lancar."
                  value={formData.catatan_perbaikan}
                  onChange={(e) => setFormData({ ...formData, catatan_perbaikan: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)'
                  }}
                >
                  <Save size={15} />
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Penilaian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SYAHADAH / RAPOR PRAKTEK ================= */}
      {isDetailOpen && selectedPraktek && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>
                  Syahadah Capaian Praktek Ibadah
                </h3>
              </div>
              <button onClick={() => setIsDetailOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                border: '2px solid #a7f3d0'
              }}>
                <Award size={32} />
              </div>

              <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 800, letterSpacing: '0.04em' }}>
                PONDOK PESANTREN NURUL WAFA
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
                {selectedPraktek.nama_santri}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                NIS: {selectedPraktek.nis} • {selectedPraktek.nama_asrama || 'Asrama Pusat'}
              </p>

              <div style={{
                margin: '18px 0',
                padding: '14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Materi Ujian:</span>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{selectedPraktek.nama_praktek}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Kategori:</span>
                  <strong style={{ fontSize: '0.82rem', color: '#047857' }}>{selectedPraktek.kategori}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Rukun Fi'li (Gerakan):</span>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{selectedPraktek.nilai_gerakan} / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Rukun Qouli (Bacaan/Doa):</span>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{selectedPraktek.nilai_bacaan} / 100</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Adab & Tuma'ninah:</span>
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>{selectedPraktek.nilai_adab} / 100</strong>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Nilai Akhir:</span>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857', marginRight: '6px' }}>
                      {selectedPraktek.nilai_akhir}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '8px' }}>
                      {selectedPraktek.predikat}
                    </span>
                  </div>
                </div>
              </div>

              {selectedPraktek.catatan_perbaikan && (
                <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic', marginBottom: '14px' }}>
                  Catatan Penguji: "{selectedPraktek.catatan_perbaikan}"
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={15} />
                  <span>Cetak Syahadah</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
