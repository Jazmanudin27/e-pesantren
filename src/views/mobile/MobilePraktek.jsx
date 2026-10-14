import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  Building,
  RotateCw,
  Sliders,
  ChevronRight,
  Filter
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';

const DEFAULT_PRAKTEK_DATA = [
  {
    id: 1,
    santri_id: 1,
    nama_santri: 'Ahmad Faiz Al-Hafidz',
    nis: '2601001',
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    nama_kamar: 'Kamar 01',
    kategori: 'Sholat Fardhu',
    nama_praktek: 'Praktek Sholat Shubuh + Qunut',
    nilai_gerakan: 95,
    nilai_bacaan: 96,
    nilai_adab: 92,
    nilai_akhir: 95,
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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 02',
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
    nama_kamar: 'Kamar 02',
    kategori: 'Adzan & Iqomah',
    nama_praktek: 'Praktek Adzan Shubuh & Tarhim',
    nilai_gerakan: 86,
    nilai_bacaan: 88,
    nilai_adab: 85,
    nilai_akhir: 87,
    predikat: 'Jayyid Jiddan (B+)',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    catatan_perbaikan: 'Vokal lantang, tajwid lafadz adzan benar.',
    tanggal_ujian: '2026-10-07'
  }
];

const KATEGORI_OPTIONS = [
  'Semua',
  'Sholat Fardhu',
  'Wudhu & Tayammum',
  'Sholat Jenazah',
  'Adzan & Iqomah',
  'Dzikir & Doa',
  'Mandi Wajib',
  'Khutbah & Ceramah'
];

const PRESET_MATERI = {
  'Sholat Fardhu': [
    'Praktek Sholat Shubuh + Qunut',
    'Praktek Sholat Dzuhur 4 Rakaat',
    'Praktek Sholat Ashar 4 Rakaat',
    'Praktek Sholat Maghrib 3 Rakaat',
    'Praktek Sholat Isya & Witir',
    'Praktek Sholat Berjamaah & Masbuq'
  ],
  'Wudhu & Tayammum': [
    'Praktek Wudhu Sempurna & Doa',
    'Praktek Tayammum Sesuai Sunnah',
    'Praktek Rukun & Pembatal Wudhu'
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

export default function MobilePraktek() {
  const [praktekList, setPraktekList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modal Sheet State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const session = JSON.parse(localStorage.getItem('mobile_session') || '{}');
  const currentPenguji = session?.nama || session?.nama_lengkap || 'Ust. Pembina Ibadah';

  const initialForm = {
    id: null,
    santri_id: '',
    kategori: 'Sholat Fardhu',
    nama_praktek: 'Praktek Sholat Shubuh + Qunut',
    nilai_gerakan: 85,
    nilai_bacaan: 85,
    nilai_adab: 85,
    nama_penguji: currentPenguji,
    catatan_perbaikan: '',
    tanggal_ujian: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialForm);

  const calculateScore = (g, b, a) => {
    const numG = Number(g) || 0;
    const numB = Number(b) || 0;
    const numA = Number(a) || 0;
    const total = Math.round((numG * 0.4) + (numB * 0.4) + (numA * 0.2));
    
    let predikat = 'Maqbul (C)';
    let status = 'Remedial';

    if (total >= 90) {
      predikat = 'Mumtaz (A)';
      status = 'Lulus';
    } else if (total >= 80) {
      predikat = 'Jayyid Jiddan (B+)';
      status = 'Lulus';
    } else if (total >= 75) {
      predikat = 'Jayyid (B)';
      status = 'Lulus';
    } else {
      predikat = 'Maqbul (C)';
      status = 'Remedial';
    }

    return { total, predikat, status };
  };

  const liveResult = calculateScore(
    formData.nilai_gerakan,
    formData.nilai_bacaan,
    formData.nilai_adab
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPraktek, resSantri] = await Promise.all([
        axios.get('/api/praktek').catch(() => ({ data: { data: [] } })),
        axios.get('/api/santri').catch(() => ({ data: { data: [] } }))
      ]);

      if (resPraktek.data && resPraktek.data.success && Array.isArray(resPraktek.data.data) && resPraktek.data.data.length > 0) {
        setPraktekList(resPraktek.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_praktek_cache') || 'null');
        setPraktekList(saved || DEFAULT_PRAKTEK_DATA);
      }

      if (resSantri.data && resSantri.data.success && Array.isArray(resSantri.data.data)) {
        setSantriList(resSantri.data.data);
      } else {
        const fallbackSantri = [
          { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nama_asrama: 'Asrama Ali bin Abi Thalib' },
          { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', nama_asrama: 'Asrama Umar bin Khattab' },
          { id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nama_asrama: 'Asrama Fathimah Az-Zahra' },
          { id: 4, nama_santri: 'Muhammad Rifqi', nis: '2601003', nama_asrama: 'Asrama Ali bin Abi Thalib' },
          { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', nama_asrama: 'Asrama Fathimah Az-Zahra' }
        ];
        setSantriList(fallbackSantri);
      }
    } catch (err) {
      const saved = JSON.parse(localStorage.getItem('mobile_praktek_cache') || 'null');
      setPraktekList(saved || DEFAULT_PRAKTEK_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    const defaultSantriId = santriList[0]?.id || 1;
    setFormData({
      ...initialForm,
      santri_id: defaultSantriId,
      nama_penguji: currentPenguji,
      tanggal_ujian: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id,
      kategori: item.kategori || 'Sholat Fardhu',
      nama_praktek: item.nama_praktek || '',
      nilai_gerakan: item.nilai_gerakan ?? 80,
      nilai_bacaan: item.nilai_bacaan ?? 80,
      nilai_adab: item.nilai_adab ?? 80,
      nama_penguji: item.nama_penguji || currentPenguji,
      catatan_perbaikan: item.catatan_perbaikan || '',
      tanggal_ujian: item.tanggal_ujian ? String(item.tanggal_ujian).split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    showConfirm(
      'Hapus Nilai Ujian?',
      `Hapus ujian ${item.nama_praktek} untuk santri ${item.nama_santri}?`,
      async () => {
        try {
          await axios.delete(`/api/praktek/${item.id}`).catch(() => null);
          const updated = praktekList.filter(p => p.id !== item.id);
          setPraktekList(updated);
          localStorage.setItem('mobile_praktek_cache', JSON.stringify(updated));
          toastSuccess('Data ujian berhasil dihapus');
        } catch (err) {
          showError('Gagal menghapus data ujian');
        }
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      showError('Pilih santri terlebih dahulu');
      return;
    }
    if (!formData.nama_praktek.trim()) {
      showError('Nama materi praktek wajib diisi');
      return;
    }

    setSubmitting(true);
    const selectedSantri = santriList.find(s => String(s.id) === String(formData.santri_id));
    const { total, predikat, status } = liveResult;

    const payload = {
      ...formData,
      santri_id: Number(formData.santri_id),
      nilai_gerakan: Number(formData.nilai_gerakan),
      nilai_bacaan: Number(formData.nilai_bacaan),
      nilai_adab: Number(formData.nilai_adab),
      nilai_akhir: total,
      predikat,
      status,
      nama_santri: selectedSantri?.nama_santri || selectedSantri?.nama || 'Santri',
      nis: selectedSantri?.nis || '-',
      nama_asrama: selectedSantri?.nama_asrama || '-'
    };

    try {
      if (formMode === 'add') {
        const res = await axios.post('/api/praktek', payload).catch(() => null);
        const newItem = res?.data?.data ? res.data.data : { ...payload, id: Date.now() };
        const updated = [newItem, ...praktekList];
        setPraktekList(updated);
        localStorage.setItem('mobile_praktek_cache', JSON.stringify(updated));
        toastSuccess('Nilai ujian praktek berhasil disimpan');
      } else {
        await axios.put(`/api/praktek/${formData.id}`, payload).catch(() => null);
        const updated = praktekList.map(p => p.id === formData.id ? { ...p, ...payload } : p);
        setPraktekList(updated);
        localStorage.setItem('mobile_praktek_cache', JSON.stringify(updated));
        toastSuccess('Nilai ujian praktek berhasil diperbarui');
      }
      setIsModalOpen(false);
    } catch (err) {
      showError('Gagal menyimpan nilai ujian');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredList = praktekList.filter(item => {
    const matchSearch = (
      (item.nama_santri && item.nama_santri.toLowerCase().includes(search.toLowerCase())) ||
      (item.nis && item.nis.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_praktek && item.nama_praktek.toLowerCase().includes(search.toLowerCase())) ||
      (item.kategori && item.kategori.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_penguji && item.nama_penguji.toLowerCase().includes(search.toLowerCase()))
    );

    const matchKategori = selectedKategori === 'Semua' || item.kategori === selectedKategori;
    const matchStatus = selectedStatus === 'Semua' || item.status === selectedStatus;

    return matchSearch && matchKategori && matchStatus;
  });

  // Calculate Summary
  const totalDiuji = praktekList.length;
  const totalLulus = praktekList.filter(p => p.status === 'Lulus').length;
  const totalRemedial = praktekList.filter(p => p.status === 'Remedial').length;
  const avgScore = totalDiuji > 0 
    ? Math.round(praktekList.reduce((acc, curr) => acc + (Number(curr.nilai_akhir) || 0), 0) / totalDiuji) 
    : 0;

  return (
    <div style={{ padding: '16px 14px 100px 14px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'inherit' }}>
      
      {/* Hero Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        borderRadius: '20px',
        padding: '18px 16px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              padding: '6px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Award size={18} color="#34d399" />
            </span>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#a7f3d0' }}>
              Rubrik Penilaian Ibadah
            </span>
          </div>
          <button 
            onClick={fetchData}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              padding: '5px 8px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            Segarkan
          </button>
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', lineHeight: 1.25 }}>
          Ujian Praktek Ibadah
        </h2>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#d1fae5', lineHeight: 1.4 }}>
          Perekaman uji kompetensi ibadah amaliyah, sholat, wudhu, & thaharah santri.
        </p>

        {/* 4 Mini Stat Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#a7f3d0', fontWeight: 600 }}>Total Ujian</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{totalDiuji}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#6ee7b7', fontWeight: 600 }}>Lulus</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{totalLulus}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#fca5a5', fontWeight: 600 }}>Remedi</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{totalRemedial}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 600 }}>Rata-rata</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{avgScore}</div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '12px'
      }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} 
        />
        <input 
          type="text"
          placeholder="Cari santri, materi praktek, penguji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            fontSize: '0.86rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Kategori Chips */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '10px',
        marginBottom: '8px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {KATEGORI_OPTIONS.map((kat) => {
          const isActive = selectedKategori === kat;
          return (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                background: isActive ? '#ecfdf5' : '#ffffff',
                color: isActive ? '#065f46' : '#64748b',
                boxShadow: isActive ? '0 2px 6px rgba(5, 150, 105, 0.15)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {kat}
            </button>
          );
        })}
      </div>

      {/* Filter Status Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={12} /> Status:
        </span>
        {['Semua', 'Lulus', 'Remedial'].map(st => {
          const isStActive = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: isStActive ? 700 : 500,
                border: 'none',
                background: isStActive 
                  ? (st === 'Lulus' ? '#dcfce7' : st === 'Remedial' ? '#fee2e2' : '#e0f2fe')
                  : '#f1f5f9',
                color: isStActive
                  ? (st === 'Lulus' ? '#166534' : st === 'Remedial' ? '#991b1b' : '#0369a1')
                  : '#64748b',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* List Header Count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
          Daftar Penilaian ({filteredList.length})
        </span>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Pilar: Gerakan 40% • Bacaan 40% • Adab 20%
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#059669' }} />
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Memuat data ujian praktek...</p>
        </div>
      ) : filteredList.length === 0 ? (
        /* Empty State */
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          border: '1px dashed #cbd5e1'
        }}>
          <BookOpen size={42} style={{ color: '#94a3b8', margin: '0 auto 12px auto' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.96rem', color: '#1e293b' }}>Belum Ada Data Ujian</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
            Tidak ditemukan penilaian ibadah yang sesuai filter atau pencarian saat ini.
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            Input Nilai Ujian Baru
          </button>
        </div>
      ) : (
        /* Card Items */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((item) => {
            const isLulus = item.status === 'Lulus';
            const nilaiAkhir = Number(item.nilai_akhir) || 0;
            
            // Predikat color styling
            let badgeColor = { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
            if (!isLulus) {
              badgeColor = { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' };
            } else if (nilaiAkhir >= 90) {
              badgeColor = { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
            }

            return (
              <div 
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
                  border: '1px solid #f1f5f9',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Left Accent Bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '5px',
                  background: isLulus ? '#10b981' : '#ef4444'
                }} />

                {/* Top Row: Santri Name, Kategori & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 700
                      }}>
                        NIS: {item.nis || '-'}
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 600
                      }}>
                        {item.kategori}
                      </span>
                    </div>

                    <h3 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.nama_santri}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#64748b' }}>
                      <Building size={12} />
                      <span>{item.nama_asrama || 'Pondok Pesantren'}</span>
                    </div>
                  </div>

                  {/* Nilai Akhir Display Box */}
                  <div style={{
                    minWidth: '60px',
                    textAlign: 'center',
                    padding: '6px 10px',
                    borderRadius: '14px',
                    background: badgeColor.bg,
                    border: `1px solid ${badgeColor.border}`
                  }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: badgeColor.text, lineHeight: 1 }}>
                      {nilaiAkhir}
                    </div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: badgeColor.text, marginTop: '2px' }}>
                      {item.status}
                    </div>
                  </div>
                </div>

                {/* Materi Praktek Box */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Sparkles size={13} color="#059669" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                      {item.nama_praktek}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                    <Award size={12} color="#059669" />
                    <span>Predikat: <strong style={{ color: '#047857' }}>{item.predikat || 'Jayyid'}</strong></span>
                  </div>
                </div>

                {/* 3 Pillars Visual Progress Bars */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '12px',
                  background: '#fafafa',
                  padding: '8px 10px',
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '2px', color: '#475569' }}>
                      <span>Gerakan</span>
                      <strong>{item.nilai_gerakan ?? 0}</strong>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(item.nilai_gerakan ?? 0, 100)}%`,
                        height: '100%',
                        background: (item.nilai_gerakan ?? 0) >= 75 ? '#10b981' : '#f87171'
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '2px', color: '#475569' }}>
                      <span>Bacaan</span>
                      <strong>{item.nilai_bacaan ?? 0}</strong>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(item.nilai_bacaan ?? 0, 100)}%`,
                        height: '100%',
                        background: (item.nilai_bacaan ?? 0) >= 75 ? '#3b82f6' : '#f87171'
                      }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '2px', color: '#475569' }}>
                      <span>Adab</span>
                      <strong>{item.nilai_adab ?? 0}</strong>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(item.nilai_adab ?? 0, 100)}%`,
                        height: '100%',
                        background: (item.nilai_adab ?? 0) >= 75 ? '#8b5cf6' : '#f87171'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Catatan Perbaikan if any */}
                {item.catatan_perbaikan && (
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#475569',
                    fontStyle: 'italic',
                    background: '#fffbeb',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    borderLeft: '3px solid #f59e0b',
                    lineHeight: 1.35
                  }}>
                    "{item.catatan_perbaikan}"
                  </div>
                )}

                {/* Bottom Footer Info & Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                      <UserCheck size={12} color="#059669" />
                      <span>{item.nama_penguji || 'Ust. Penguji'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>{item.tanggal_ujian ? String(item.tanggal_ujian).split('T')[0] : '-'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) + Input Nilai */}
      <button
        onClick={handleOpenAdd}
        style={{
          position: 'fixed',
          bottom: '75px',
          right: '18px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.86rem',
          fontWeight: 800,
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)',
          cursor: 'pointer',
          zIndex: 40,
          transition: 'transform 0.2s ease'
        }}
      >
        <Plus size={20} />
        <span>+ Nilai Ujian</span>
      </button>

      {/* Modal / Bottom Sheet Form Input Nilai */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            overflowY: 'auto',
            padding: '20px 18px 24px 18px',
            boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            
            {/* Top Sheet Drag Indicator */}
            <div style={{
              width: '40px',
              height: '4px',
              background: '#cbd5e1',
              borderRadius: '2px',
              margin: '0 auto 14px auto'
            }} />

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                  {formMode === 'add' ? 'Input Nilai Ujian Praktek' : 'Edit Nilai Ujian Praktek'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  Form penilaian kompetensi ibadah amaliyah santri
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {/* Santri Selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nama Santri Diuji *
                </label>
                <select
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri || s.nama} (NIS: {s.nis || '-'}) - {s.nama_asrama || 'Asrama'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Praktek */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Kategori Ujian Ibadah *
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => {
                    const newKat = e.target.value;
                    const defaultMateri = PRESET_MATERI[newKat]?.[0] || '';
                    setFormData({ ...formData, kategori: newKat, nama_praktek: defaultMateri });
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  {KATEGORI_OPTIONS.filter(k => k !== 'Semua').map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* Materi Praktek + Preset Quick Pills */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Materi Ujian Praktek *
                </label>
                <input
                  type="text"
                  value={formData.nama_praktek}
                  onChange={(e) => setFormData({ ...formData, nama_praktek: e.target.value })}
                  placeholder="Contoh: Praktek Sholat Shubuh + Qunut"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    marginBottom: '8px'
                  }}
                />

                {/* Preset Chips for Current Category */}
                {PRESET_MATERI[formData.kategori] && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {PRESET_MATERI[formData.kategori].map(preset => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setFormData({ ...formData, nama_praktek: preset })}
                        style={{
                          background: formData.nama_praktek === preset ? '#dcfce7' : '#f1f5f9',
                          color: formData.nama_praktek === preset ? '#15803d' : '#475569',
                          border: formData.nama_praktek === preset ? '1px solid #86efac' : '1px solid #e2e8f0',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Scoring Controls (3 Pillars) */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={16} color="#059669" />
                    Penilaian 3 Pilar (Bobot %)
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    Geser slider atau ketik skor
                  </span>
                </div>

                {/* Pillar 1: Gerakan (40%) */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                      1. Gerakan, Kaifiyah & Tuma'ninah (40%)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_gerakan}
                      onChange={(e) => setFormData({ ...formData, nilai_gerakan: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        color: '#059669'
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.nilai_gerakan}
                    onChange={(e) => setFormData({ ...formData, nilai_gerakan: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#059669' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[70, 80, 85, 90, 95, 100].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setFormData({ ...formData, nilai_gerakan: val })}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '0.66rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: formData.nilai_gerakan === val ? '#059669' : '#ffffff',
                          color: formData.nilai_gerakan === val ? '#ffffff' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pillar 2: Bacaan (40%) */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                      2. Fashahah & Tajwid Bacaan (40%)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_bacaan}
                      onChange={(e) => setFormData({ ...formData, nilai_bacaan: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        color: '#2563eb'
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.nilai_bacaan}
                    onChange={(e) => setFormData({ ...formData, nilai_bacaan: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#2563eb' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[70, 80, 85, 90, 95, 100].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setFormData({ ...formData, nilai_bacaan: val })}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '0.66rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: formData.nilai_bacaan === val ? '#2563eb' : '#ffffff',
                          color: formData.nilai_bacaan === val ? '#ffffff' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pillar 3: Adab (20%) */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                      3. Adab, Khusyu' & Kerapian (20%)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.nilai_adab}
                      onChange={(e) => setFormData({ ...formData, nilai_adab: Math.min(100, Math.max(0, Number(e.target.value))) })}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        padding: '4px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        color: '#7c3aed'
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.nilai_adab}
                    onChange={(e) => setFormData({ ...formData, nilai_adab: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#7c3aed' }}
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {[70, 80, 85, 90, 95, 100].map(val => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setFormData({ ...formData, nilai_adab: val })}
                        style={{
                          flex: 1,
                          padding: '2px 0',
                          fontSize: '0.66rem',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          background: formData.nilai_adab === val ? '#7c3aed' : '#ffffff',
                          color: formData.nilai_adab === val ? '#ffffff' : '#64748b',
                          cursor: 'pointer'
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Realtime Result Summary Banner */}
                <div style={{
                  background: liveResult.status === 'Lulus' ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' : '#b91c1c',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>Kalkulasi Skor Otomatis</div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>
                      Predikat: {liveResult.predikat}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>
                      {liveResult.total}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: liveResult.status === 'Lulus' ? '#6ee7b7' : '#fca5a5' }}>
                      Status: {liveResult.status}
                    </div>
                  </div>
                </div>

              </div>

              {/* Penguji & Tanggal Ujian */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nama Penguji
                  </label>
                  <input
                    type="text"
                    value={formData.nama_penguji}
                    onChange={(e) => setFormData({ ...formData, nama_penguji: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tanggal Ujian
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal_ujian}
                    onChange={(e) => setFormData({ ...formData, tanggal_ujian: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Catatan / Evaluasi */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Catatan Evaluasi / Rekomendasi Perbaikan
                </label>
                <textarea
                  rows="2"
                  value={formData.catatan_perbaikan}
                  onChange={(e) => setFormData({ ...formData, catatan_perbaikan: e.target.value })}
                  placeholder="Contoh: Makhraj huruf fashih, gerakan ruku dan sujud sempurna..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan Nilai Ujian
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
