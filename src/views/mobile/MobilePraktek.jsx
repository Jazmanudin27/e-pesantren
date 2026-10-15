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
  RotateCw, 
  Award, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  Building,
  Filter,
  FolderPlus,
  Tag,
  AlertCircle
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const DEFAULT_KATEGORI = [
  'Sholat Fardhu',
  'Wudhu & Tayammum',
  'Sholat Jenazah',
  'Adzan & Iqomah',
  'Dzikir & Doa',
  'Mandi Wajib',
  'Khutbah & Ceramah'
];

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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 01',
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
    nama_kamar: 'Kamar 02',
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
    nama_kamar: 'Kamar 02',
    kategori: 'Adzan & Iqomah',
    nama_praktek: 'Praktek Adzan Shubuh & Tarhim',
    deskripsi: 'Vokal lantang, tajwid lafadz adzan benar dan intonasi indah.',
    status: 'Lulus',
    nama_penguji: 'Ust. M. Huda Al-Hafidz',
    tanggal_ujian: '2026-10-07'
  }
];

export default function MobilePraktek() {
  const [praktekList, setPraktekList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modal Form Input/Edit Penilaian
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  // Modal Kelola Kategori (Custom Master)
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKategoriName, setNewKategoriName] = useState('');
  const [newKategoriDesc, setNewKategoriDesc] = useState('');
  const [savingKategori, setSavingKategori] = useState(false);

  const session = JSON.parse(localStorage.getItem('mobile_session') || '{}');
  const currentPenguji = session?.nama || session?.nama_lengkap || 'Ust. Pembina Ibadah';

  const initialForm = {
    id: null,
    santri_id: '',
    kategori: 'Sholat Fardhu',
    deskripsi: '',
    status: 'Lulus',
    nama_penguji: currentPenguji,
    tanggal_ujian: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialForm);

  // Cek apakah santri yang dipilih sudah LULUS untuk kategori ini
  const isAlreadyPassed = Boolean(
    formData.santri_id &&
    formData.kategori &&
    praktekList.some(p => 
      String(p.santri_id) === String(formData.santri_id) &&
      p.kategori === formData.kategori &&
      p.status === 'Lulus' &&
      (formMode === 'add' || p.id !== formData.id)
    )
  );

  // Cek apakah santri memiliki riwayat mengulang untuk kategori ini
  const isRemedial = Boolean(
    formData.santri_id &&
    formData.kategori &&
    !isAlreadyPassed &&
    praktekList.some(p => 
      String(p.santri_id) === String(formData.santri_id) &&
      p.kategori === formData.kategori &&
      (p.status === 'Mengulang' || p.status === 'Remedial')
    )
  );

  const getKategoriSublabel = (katName) => {
    if (!formData.santri_id) return null;
    const history = praktekList.filter(
      p => String(p.santri_id) === String(formData.santri_id) && p.kategori === katName
    );
    if (history.some(h => h.status === 'Lulus')) {
      return '✔ Sudah Lulus (Tuntas)';
    }
    if (history.some(h => h.status === 'Mengulang' || h.status === 'Remedial')) {
      return '↺ Mengulang (Perlu Ujian Ulang)';
    }
    return 'Belum Diuji';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPraktek, resSantri, resKat] = await Promise.all([
        axios.get('/api/praktek').catch(() => ({ data: { data: [] } })),
        axios.get('/api/santri').catch(() => ({ data: { data: [] } })),
        axios.get('/api/praktek/kategori').catch(() => ({ data: { data: [] } }))
      ]);

      // 1. Data Praktek
      if (resPraktek.data && resPraktek.data.success && Array.isArray(resPraktek.data.data) && resPraktek.data.data.length > 0) {
        setPraktekList(resPraktek.data.data);
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_praktek_cache') || 'null');
        setPraktekList(saved || DEFAULT_PRAKTEK_DATA);
      }

      // 2. Data Santri
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

      // 3. Data Master Kategori
      if (resKat.data && resKat.data.success && Array.isArray(resKat.data.data) && resKat.data.data.length > 0) {
        setKategoriList(resKat.data.data);
      } else {
        const savedKat = JSON.parse(localStorage.getItem('mobile_kategori_cache') || 'null');
        const defaultObjs = (savedKat || DEFAULT_KATEGORI).map((k, idx) => 
          typeof k === 'string' ? { id: idx + 1, nama_kategori: k, deskripsi: '' } : k
        );
        setKategoriList(defaultObjs);
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
    const defaultKategori = kategoriList[0]?.nama_kategori || 'Sholat Fardhu';
    setFormData({
      ...initialForm,
      santri_id: defaultSantriId,
      kategori: defaultKategori,
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
      deskripsi: item.deskripsi || item.catatan_perbaikan || '',
      status: (item.status === 'Remedial' || item.status === 'Mengulang') ? 'Mengulang' : 'Lulus',
      nama_penguji: item.nama_penguji || currentPenguji,
      tanggal_ujian: item.tanggal_ujian ? String(item.tanggal_ujian).split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    showConfirm(
      'Hapus Nilai Ujian?',
      `Hapus penilaian ${item.kategori} untuk santri ${item.nama_santri}?`,
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

    if (formMode === 'add' && isAlreadyPassed) {
      showError(
        'Tidak Dapat Menginput',
        `Santri ini sudah dinyatakan LULUS pada kategori "${formData.kategori}". Hanya santri yang Mengulang yang dapat diuji ulang.`
      );
      return;
    }

    setSubmitting(true);
    const selectedSantri = santriList.find(s => String(s.id) === String(formData.santri_id));

    const payload = {
      ...formData,
      nama_praktek: formData.kategori,
      santri_id: Number(formData.santri_id),
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
        toastSuccess('Penilaian ujian berhasil disimpan');
      } else {
        await axios.put(`/api/praktek/${formData.id}`, payload).catch(() => null);
        const updated = praktekList.map(p => p.id === formData.id ? { ...p, ...payload } : p);
        setPraktekList(updated);
        localStorage.setItem('mobile_praktek_cache', JSON.stringify(updated));
        toastSuccess('Penilaian ujian berhasil diperbarui');
      }
      setIsModalOpen(false);
    } catch (err) {
      showError('Gagal menyimpan nilai ujian');
    } finally {
      setSubmitting(false);
    }
  };

  // Custom Kategori Management
  const handleAddKategori = async (e) => {
    e.preventDefault();
    if (!newKategoriName.trim()) {
      showError('Nama kategori wajib diisi');
      return;
    }

    setSavingKategori(true);
    try {
      const res = await axios.post('/api/praktek/kategori', {
        nama_kategori: newKategoriName.trim(),
        deskripsi: newKategoriDesc.trim()
      }).catch(() => null);

      const created = res?.data?.data || {
        id: Date.now(),
        nama_kategori: newKategoriName.trim(),
        deskripsi: newKategoriDesc.trim()
      };

      const updated = [...kategoriList, created];
      setKategoriList(updated);
      localStorage.setItem('mobile_kategori_cache', JSON.stringify(updated));
      setNewKategoriName('');
      setNewKategoriDesc('');
      toastSuccess('Kategori praktek baru berhasil ditambahkan');
    } catch (err) {
      showError('Gagal menambah kategori');
    } finally {
      setSavingKategori(false);
    }
  };

  const handleDeleteKategori = async (katItem) => {
    showConfirm(
      'Hapus Kategori?',
      `Hapus kategori "${katItem.nama_kategori}"?`,
      async () => {
        try {
          await axios.delete(`/api/praktek/kategori/${katItem.id}`).catch(() => null);
          const updated = kategoriList.filter(k => k.id !== katItem.id);
          setKategoriList(updated);
          localStorage.setItem('mobile_kategori_cache', JSON.stringify(updated));
          if (selectedKategori === katItem.nama_kategori) {
            setSelectedKategori('Semua');
          }
          toastSuccess('Kategori berhasil dihapus');
        } catch (err) {
          showError('Gagal menghapus kategori');
        }
      }
    );
  };

  // Filtered List
  const filteredList = praktekList.filter(item => {
    const matchSearch = (
      (item.nama_santri && item.nama_santri.toLowerCase().includes(search.toLowerCase())) ||
      (item.nis && item.nis.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_praktek && item.nama_praktek.toLowerCase().includes(search.toLowerCase())) ||
      (item.kategori && item.kategori.toLowerCase().includes(search.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_penguji && item.nama_penguji.toLowerCase().includes(search.toLowerCase()))
    );

    const matchKategori = selectedKategori === 'Semua' || item.kategori === selectedKategori;
    const itemStatus = (item.status === 'Remedial' || item.status === 'Mengulang') ? 'Mengulang' : 'Lulus';
    const matchStatus = selectedStatus === 'Semua' || itemStatus === selectedStatus;

    return matchSearch && matchKategori && matchStatus;
  });

  // Calculate Summary
  const totalDiuji = praktekList.length;
  const totalLulus = praktekList.filter(p => p.status === 'Lulus').length;
  const totalMengulang = praktekList.filter(p => p.status === 'Mengulang' || p.status === 'Remedial').length;
  const totalKategoriCount = kategoriList.length;

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
              Uji Kompetensi Ibadah
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
          Perekaman uji kelulusan ibadah amaliyah, sholat, wudhu, & thaharah santri.
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
            <div style={{ fontSize: '0.66rem', color: '#fca5a5', fontWeight: 600 }}>Mengulang</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>{totalMengulang}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 600 }}>Kategori</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>{totalKategoriCount}</div>
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
          placeholder="Cari santri, materi praktek, deskripsi..."
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

      {/* Header Bar Kategori + Tombol Kelola Kategori */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={13} color="#059669" /> Kategori Praktek
        </span>
        <button
          onClick={() => setIsKategoriModalOpen(true)}
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.72rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <FolderPlus size={13} />
          + Kelola Kategori
        </button>
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
        <button
          onClick={() => setSelectedKategori('Semua')}
          style={{
            flexShrink: 0,
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: selectedKategori === 'Semua' ? 700 : 500,
            border: selectedKategori === 'Semua' ? '1.5px solid #059669' : '1px solid #e2e8f0',
            background: selectedKategori === 'Semua' ? '#ecfdf5' : '#ffffff',
            color: selectedKategori === 'Semua' ? '#065f46' : '#64748b',
            boxShadow: selectedKategori === 'Semua' ? '0 2px 6px rgba(5, 150, 105, 0.15)' : 'none',
            cursor: 'pointer'
          }}
        >
          Semua
        </button>
        {kategoriList.map((kat) => {
          const katName = kat.nama_kategori || kat;
          const isActive = selectedKategori === katName;
          return (
            <button
              key={kat.id || katName}
              onClick={() => setSelectedKategori(katName)}
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
              {katName}
            </button>
          );
        })}
      </div>

      {/* Filter Status Pills: Semua, Lulus, Mengulang */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={12} /> Status:
        </span>
        {['Semua', 'Lulus', 'Mengulang'].map(st => {
          const isStActive = selectedStatus === st;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: isStActive ? 700 : 500,
                border: 'none',
                background: isStActive 
                  ? (st === 'Lulus' ? '#dcfce7' : st === 'Mengulang' ? '#fee2e2' : '#e0f2fe')
                  : '#f1f5f9',
                color: isStActive
                  ? (st === 'Lulus' ? '#166534' : st === 'Mengulang' ? '#991b1b' : '#0369a1')
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
          Nilai: Lulus & Mengulang
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
            Input Nilai Ujian
          </button>
        </div>
      ) : (
        /* Card Items */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((item) => {
            const isLulus = item.status === 'Lulus';

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

                {/* Top Row: Santri Name, Kategori & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
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

                  {/* Nilai Status: Lulus / Mengulang Badge */}
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: isLulus ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${isLulus ? '#bbf7d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isLulus ? (
                      <CheckCircle2 size={14} color="#15803d" />
                    ) : (
                      <RotateCw size={14} color="#b91c1c" />
                    )}
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: isLulus ? '#15803d' : '#b91c1c'
                    }}>
                      {isLulus ? 'LULUS' : 'MENGULANG'}
                    </span>
                  </div>
                </div>

                {/* Kategori Ujian Praktek Banner */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={14} color="#059669" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>
                    {item.kategori}
                  </span>
                </div>

                {/* Deskripsi & Keterangan Ujian */}
                {(item.deskripsi || item.catatan_perbaikan) && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#334155',
                    background: isLulus ? '#f0fdf4' : '#fffbeb',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    marginBottom: '12px',
                    borderLeft: `3px solid ${isLulus ? '#10b981' : '#f59e0b'}`,
                    lineHeight: 1.4
                  }}>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: isLulus ? '#047857' : '#b45309', marginBottom: '2px' }}>
                      Deskripsi & Catatan Evaluasi:
                    </strong>
                    {item.deskripsi || item.catatan_perbaikan}
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

      {/* Floating Action Button (FAB) - Hanya Icon + Bulat Saja Sesuai Permintaan */}
      <button
        onClick={handleOpenAdd}
        title="Input Nilai Ujian"
        style={{
          position: 'fixed',
          bottom: '75px',
          right: '18px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.45)',
          cursor: 'pointer',
          zIndex: 40,
          transition: 'transform 0.2s ease'
        }}
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

      {/* Modal / Bottom Sheet Form Input/Edit Penilaian */}
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
                  {formMode === 'add' ? 'Input Ujian Praktek' : 'Edit Ujian Praktek'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  Penilaian kelulusan kompetensi ibadah santri
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
              {/* Santri Selector dengan Search Realtime */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nama Santri Diuji *
                </label>
                <SearchableSelect
                  options={santriList.map((s) => ({
                    value: s.id,
                    label: s.nama_santri || s.nama || 'Santri',
                    sublabel: `NIS: ${s.nis || '-'} • ${s.nama_asrama || 'Asrama'}`
                  }))}
                  value={formData.santri_id}
                  onChange={(val) => setFormData({ ...formData, santri_id: val })}
                  placeholder="-- Pilih atau cari nama santri --"
                  searchPlaceholder="Ketik nama atau NIS santri..."
                  triggerStyle={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* Kategori Praktek dengan Search Realtime */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                    Kategori Ujian Ibadah *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsKategoriModalOpen(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#059669',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    + Kategori Baru
                  </button>
                </div>
                <SearchableSelect
                  options={kategoriList.map(k => {
                    const kName = k.nama_kategori || k;
                    const statusLabel = getKategoriSublabel(kName);
                    return {
                      value: kName,
                      label: kName,
                      sublabel: statusLabel || k.deskripsi || null
                    };
                  })}
                  value={formData.kategori}
                  onChange={(val) => setFormData({ ...formData, kategori: val })}
                  placeholder="-- Pilih atau cari kategori praktek --"
                  searchPlaceholder="Ketik kategori (sholat, wudhu, dll)..."
                  triggerStyle={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* Status Alert: Jika Santri Sudah Lulus atau Mengulang */}
              {isAlreadyPassed && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b', marginBottom: '2px' }}>
                      Santri Sudah Dinyatakan Lulus
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#b91c1c', lineHeight: 1.4 }}>
                      Santri ini sudah <strong>Lulus</strong> pada ujian praktek <strong>{formData.kategori}</strong>. Tidak dapat menginput ujian baru kecuali status sebelumnya Mengulang.
                    </div>
                  </div>
                </div>
              )}

              {isRemedial && (
                <div style={{
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <RotateCw size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600 }}>
                    Status sebelumnya: <strong>Mengulang</strong>. Diizinkan input penilaian ujian ulang / remedial.
                  </div>
                </div>
              )}

              {/* PILIHAN NILAI: HANYA LULUS & MENGULANG */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Hasil Nilai Ujian *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Lulus' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formData.status === 'Lulus' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: formData.status === 'Lulus' ? '#ecfdf5' : '#ffffff',
                      color: formData.status === 'Lulus' ? '#047857' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: formData.status === 'Lulus' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'none'
                    }}
                  >
                    <CheckCircle2 size={18} color={formData.status === 'Lulus' ? '#059669' : '#94a3b8'} />
                    Lulus
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'Mengulang' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: formData.status === 'Mengulang' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                      background: formData.status === 'Mengulang' ? '#fef2f2' : '#ffffff',
                      color: formData.status === 'Mengulang' ? '#b91c1c' : '#64748b',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: formData.status === 'Mengulang' ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none'
                    }}
                  >
                    <RotateCw size={18} color={formData.status === 'Mengulang' ? '#dc2626' : '#94a3b8'} />
                    Mengulang
                  </button>
                </div>
              </div>

              {/* DESKRIPSI & EVALUASI */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Deskripsi & Catatan Ujian
                </label>
                <textarea
                  rows="3"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan deskripsi ujian, evaluasi gerakan, bacaan, atau hal yang perlu diperbaiki..."
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Penguji & Tanggal Ujian */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
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
                  disabled={submitting || (formMode === 'add' && isAlreadyPassed)}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: (formMode === 'add' && isAlreadyPassed) ? '#cbd5e1' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: (formMode === 'add' && isAlreadyPassed) ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.3)',
                    cursor: (formMode === 'add' && isAlreadyPassed) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (formMode === 'add' && isAlreadyPassed) ? (
                    <>
                      <CheckCircle2 size={16} />
                      Sudah Lulus (Terkunci)
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan Penilaian
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Master Kategori Praktek (Custom Praktek) */}
      {isKategoriModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 110
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '480px',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Kelola Kategori Praktek
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  Atur atau tambahkan kategori praktek custom pondok
                </p>
              </div>
              <button
                onClick={() => setIsKategoriModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Tambah Kategori Baru */}
            <form onSubmit={handleAddKategori} style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                + Tambah Kategori Custom Baru
              </div>
              <input
                type="text"
                placeholder="Nama Kategori (contoh: Manasik Haji, Khutbah Jum'at)"
                value={newKategoriName}
                onChange={(e) => setNewKategoriName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  boxSizing: 'border-box',
                  marginBottom: '6px'
                }}
              />
              <input
                type="text"
                placeholder="Deskripsi singkat (opsional)"
                value={newKategoriDesc}
                onChange={(e) => setNewKategoriDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  boxSizing: 'border-box',
                  marginBottom: '8px'
                }}
              />
              <button
                type="submit"
                disabled={savingKategori}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {savingKategori ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Simpan Kategori Baru
              </button>
            </form>

            {/* List Tabel Kategori yang Ada */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
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
                        padding: '9px 12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px'
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
                          borderRadius: '8px',
                          color: '#dc2626',
                          padding: '6px 8px',
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

            {/* Modal Footer */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setIsKategoriModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Selesai
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
