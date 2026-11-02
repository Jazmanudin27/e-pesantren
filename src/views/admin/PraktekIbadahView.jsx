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
  FileText, 
  Building,
  FolderPlus,
  Tag,
  Home,
  User,
  Clock,
  CheckCircle
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function PraktekIbadahView() {
  const [praktekList, setPraktekList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPraktek, setSelectedPraktek] = useState(null);

  // Modal Form (Add & Edit) State
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

  // Modal Kelola Kategori Master
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false);
  const [newKatName, setNewKatName] = useState('');
  const [newKatDesc, setNewKatDesc] = useState('');
  const [savingKat, setSavingKat] = useState(false);
  const [editingKatId, setEditingKatId] = useState(null);

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

  const fetchPraktek = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/praktek');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPraktekList(res.data.data);
      } else {
        setPraktekList([]);
      }
    } catch (e) {
      console.error('Gagal mengambil data praktek ibadah:', e);
      setPraktekList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSantriMaster = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      } else {
        setSantriList([]);
      }
    } catch (e) {
      setSantriList([]);
    }
  };

  const fetchKategoriMaster = async () => {
    try {
      const res = await axios.get('/api/praktek/kategori');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setKategoriList(res.data.data);
      } else {
        setKategoriList([]);
      }
    } catch (e) {
      setKategoriList([]);
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

  // Open Detail Modal
  const openDetail = (item) => {
    setSelectedPraktek(item);
    setIsDetailOpen(true);
  };

  // Open Add Form
  const openAddForm = () => {
    setFormMode('add');
    const defaultKat = kategoriList[0]?.nama_kategori || 'Sholat Fardhu';
    setFormData({
      id: null,
      santri_id: santriList[0]?.id || '',
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

    if (formMode === 'add' && isAlreadyPassed) {
      showError(
        'Tidak Dapat Menginput',
        `Santri ini sudah dinyatakan LULUS pada kategori "${formData.kategori}". Hanya santri yang Mengulang yang dapat diuji ulang.`
      );
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
      `Hapus penilaian ${item.kategori || item.nama_praktek} untuk santri ${item.nama_santri}?`,
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

  // Handle Add & Edit Kategori Custom
  const handleStartEditKategori = (kat) => {
    setEditingKatId(kat.id);
    setNewKatName(kat.nama_kategori || kat);
    setNewKatDesc(kat.deskripsi || '');
  };

  const handleCancelEditKategori = () => {
    setEditingKatId(null);
    setNewKatName('');
    setNewKatDesc('');
  };

  const handleAddKategori = async (e) => {
    e.preventDefault();
    if (!newKatName.trim()) {
      showError('Validasi Gagal', 'Nama kategori wajib diisi.');
      return;
    }
    setSavingKat(true);
    try {
      if (editingKatId) {
        // Mode Update
        await axios.put(`/api/praktek/kategori/${editingKatId}`, {
          nama_kategori: newKatName.trim(),
          deskripsi: newKatDesc.trim()
        }).catch(() => null);

        const oldItem = kategoriList.find(k => k.id === editingKatId);
        const oldName = oldItem?.nama_kategori || '';

        const updated = kategoriList.map(k => {
          if (k.id === editingKatId) {
            return {
              ...k,
              nama_kategori: newKatName.trim(),
              deskripsi: newKatDesc.trim()
            };
          }
          return k;
        });

        setKategoriList(updated);

        // Cascade update in praktekList if category name changed
        if (oldName && oldName !== newKatName.trim()) {
          setPraktekList(prev => prev.map(p => p.kategori === oldName ? { ...p, kategori: newKatName.trim(), nama_praktek: newKatName.trim() } : p));
          if (filterKategori === oldName) {
            setFilterKategori(newKatName.trim());
          }
        }

        setEditingKatId(null);
        setNewKatName('');
        setNewKatDesc('');
        toastSuccess('Berhasil!', 'Kategori praktek berhasil diperbarui.');
      } else {
        // Mode Add
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
      }
    } catch (err) {
      showError('Gagal', 'Gagal menyimpan kategori.');
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
          if (editingKatId === kat.id) {
            handleCancelEditKategori();
          }
          if (filterKategori === kat.nama_kategori) {
            setFilterKategori('Semua Kategori');
          }
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
      (item.kategori && item.kategori.toLowerCase().includes(search.toLowerCase())) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
      (item.nama_penguji && item.nama_penguji.toLowerCase().includes(search.toLowerCase()));

    const matchKat = filterKategori === 'Semua Kategori' || item.kategori === filterKategori;
    const isItemLulus = item.status === 'Lulus';
    const itemStatus = isItemLulus ? 'Lulus' : 'Mengulang';
    const matchStatus = filterStatus === 'Semua Status' || itemStatus === filterStatus;

    const matchTab = 
      activeTab === 'semua' ? true :
      activeTab === 'lulus' ? isItemLulus :
      !isItemLulus;

    return matchSearch && matchKat && matchStatus && matchTab;
  });

  // Statistik
  const totalSantriDiuji = praktekList.length;
  const totalLulus = praktekList.filter((p) => p.status === 'Lulus').length;
  const totalMengulang = praktekList.filter((p) => p.status === 'Mengulang' || p.status === 'Remedial').length;
  const totalKategori = kategoriList.length;

  return (
    <div className="view-container">
      
      {/* 1. TOP STATS CARDS (4 COLORED CARDS LIKE SANTRI VIEW) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL PENILAIAN UJIAN</div>
            <div className="stat-colored-number">{totalSantriDiuji}</div>
          </div>
          <div className="stat-colored-icon-box">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SANTRI LULUS UJIAN</div>
            <div className="stat-colored-number">{totalLulus}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI MENGULANG</div>
            <div className="stat-colored-number">{totalMengulang}</div>
          </div>
          <div className="stat-colored-icon-box">
            <RotateCw size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">KATEGORI PRAKTEK</div>
            <div className="stat-colored-number">{totalKategori}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Tag size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Ujian Praktek Ibadah</h2>
            <p>Perekaman kelulusan ibadah amaliyah (sholat, wudhu, thaharah, jenazah, adzan) santri</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={fetchPraktek}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={() => setIsKategoriModalOpen(true)}
          >
            <FolderPlus size={14} color="#059669" /> Kelola Kategori
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={openAddForm}
          >
            <Plus size={14} /> Input Penilaian Ujian
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveTab('semua')}
        >
          <BookOpen size={14} /> Semua Ujian ({praktekList.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'lulus' ? 'active' : ''}`}
          onClick={() => setActiveTab('lulus')}
        >
          <CheckCircle2 size={14} /> Santri Lulus ({totalLulus})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mengulang' ? 'active' : ''}`}
          onClick={() => setActiveTab('mengulang')}
        >
          <RotateCw size={14} /> Santri Mengulang ({totalMengulang})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, penguji, materi praktek, evaluasi..." 
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

        <select 
          className="filter-select"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option value="Semua Kategori">Semua Kategori</option>
          {kategoriList.map(k => {
            const name = k.nama_kategori || k;
            return <option key={k.id || name} value={name}>{name}</option>;
          })}
        </select>

        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Lulus">Lulus</option>
          <option value="Mengulang">Mengulang</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <RotateCw size={24} className="animate-spin" /> Memuat data penilaian ujian...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th>KATEGORI PRAKTEK</th>
                <th>DESKRIPSI & EVALUASI</th>
                <th>PENGUJI & TANGGAL</th>
                <th className="td-center">STATUS NILAI</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data penilaian praktek ibadah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isLulus = item.status === 'Lulus';
                  const initials = (item.nama_santri || 'S').slice(0, 2).toUpperCase();

                  return (
                    <tr key={item.id || idx}>
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      {/* Santri Info */}
                      <td>
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
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                              {item.nama_santri}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              NIS: <strong style={{ color: '#047857' }}>{item.nis || '-'}</strong> • {item.nama_asrama || 'Asrama'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kategori Praktek */}
                      <td>
                        <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          {item.kategori}
                        </span>
                      </td>

                      {/* Deskripsi & Evaluasi */}
                      <td style={{ maxWidth: '320px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                          {item.deskripsi || item.catatan_perbaikan || '-'}
                        </div>
                      </td>

                      {/* Penguji & Tanggal */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 600, color: '#1e293b' }}>
                          <UserCheck size={13} color="#059669" />
                          <span>{item.nama_penguji || 'Ust. Penguji'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          <Calendar size={12} />
                          <span>{item.tanggal_ujian ? String(item.tanggal_ujian).split('T')[0] : '-'}</span>
                        </div>
                      </td>

                      {/* Nilai / Status Lulus vs Mengulang */}
                      <td className="td-center">
                        <span 
                          className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                        >
                          {isLulus ? <CheckCircle2 size={12} /> : <RotateCw size={12} />}
                          {isLulus ? 'LULUS' : 'MENGULANG'}
                        </span>
                      </td>

                      {/* Aksi Buttons */}
                      <td className="td-center">
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            className="btn-action btn-action-view"
                            onClick={() => openDetail(item)}
                            title="Lihat Detail Ujian"
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-edit"
                            onClick={() => openEditForm(item)}
                            title="Edit Penilaian"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-delete"
                            onClick={() => handleDelete(item)}
                            title="Hapus Penilaian"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL HASIL UJIAN PRAKTEK IBADAH              */}
      {/* ==================================================== */}
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
            borderRadius: '16px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Detail Ujian Praktek Ibadah</h3>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Kategori: {selectedPraktek.kategori} • Santri: {selectedPraktek.nama_santri}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', background: '#f8fafc' }}>
              
              {/* Profile Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                border: '1px solid #334155'
              }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{selectedPraktek.nama_santri}</div>
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                    NIS: <strong style={{ color: '#34d399' }}>{selectedPraktek.nis || '-'}</strong> • {selectedPraktek.nama_asrama || 'Asrama Pondok'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${selectedPraktek.status === 'Lulus' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {selectedPraktek.status === 'Lulus' ? <CheckCircle2 size={13} /> : <RotateCw size={13} />}
                    {selectedPraktek.status === 'Lulus' ? 'LULUS UJIAN' : 'MENGULANG'}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                
                {/* Kategori Praktek */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Tag size={13} color="#059669" /> Kategori Praktek
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#065f46' }}>{selectedPraktek.kategori}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Kompetensi Amaliyah</div>
                </div>

                {/* Penguji & Tanggal */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 14px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <UserCheck size={13} color="#0284c7" /> Asatidz Penguji
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{selectedPraktek.nama_penguji || 'Ust. Penguji'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Tanggal: {selectedPraktek.tanggal_ujian ? String(selectedPraktek.tanggal_ujian).split('T')[0] : '-'}
                  </div>
                </div>
              </div>

              {/* Deskripsi & Evaluasi */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px 16px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={13} color="#7c3aed" /> Catatan & Evaluasi Penguji
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  {selectedPraktek.deskripsi || selectedPraktek.catatan_perbaikan || 'Tidak ada catatan evaluasi khusus. Penilaian sesuai kriteria kelulusan amaliyah.'}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsDetailOpen(false);
                    openEditForm(selectedPraktek);
                  }}
                >
                  <Edit3 size={14} /> Edit Penilaian
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM INPUT / EDIT                             */}
      {/* ==================================================== */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
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
                type="button"
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.84rem'
                  }}
                />
              </div>

              {/* Status Alert */}
              {isAlreadyPassed && (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
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
                      Santri ini sudah <strong>Lulus</strong> pada ujian praktek <strong>{formData.kategori}</strong>. Tidak dapat menginput penilaian baru karena sudah tuntas lulus, kecuali santri yang berstatus Mengulang.
                    </div>
                  </div>
                </div>
              )}

              {isRemedial && (
                <div style={{
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '10px',
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

              {/* NILAI: LULUS & MENGULANG */}
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
                  className="btn btn-outline"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || (formMode === 'add' && isAlreadyPassed)}
                  className="btn btn-primary"
                  style={{
                    opacity: (formMode === 'add' && isAlreadyPassed) ? 0.6 : 1,
                    cursor: (formMode === 'add' && isAlreadyPassed) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {(formMode === 'add' && isAlreadyPassed) ? (
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

      {/* ==================================================== */}
      {/* MODAL KELOLA KATEGORI MASTER                         */}
      {/* ==================================================== */}
      {isKategoriModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
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
                type="button"
                onClick={() => setIsKategoriModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Tambah / Edit Kategori */}
            <form onSubmit={handleAddKategori} style={{ 
              background: editingKatId ? '#f0f9ff' : '#f8fafc', 
              padding: '12px', 
              borderRadius: '10px', 
              border: editingKatId ? '1.5px solid #0284c7' : '1px solid #e2e8f0', 
              marginBottom: '14px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: editingKatId ? '#0369a1' : '#1e293b' }}>
                  {editingKatId ? '✏️ Edit Kategori Praktek' : '+ Tambah Kategori Baru'}
                </div>
                {editingKatId && (
                  <button
                    type="button"
                    onClick={handleCancelEditKategori}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Batal Edit
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Nama Kategori (contoh: Manasik Haji, Khutbah, Mandi Wajib)"
                value={newKatName}
                onChange={(e) => setNewKatName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', marginBottom: '6px', background: '#ffffff' }}
              />
              <input
                type="text"
                placeholder="Deskripsi singkat (opsional)"
                value={newKatDesc}
                onChange={(e) => setNewKatDesc(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', marginBottom: '8px', background: '#ffffff' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                {editingKatId && (
                  <button
                    type="button"
                    onClick={handleCancelEditKategori}
                    className="btn btn-outline"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingKat}
                  className="btn btn-primary"
                  style={{
                    flex: editingKatId ? 2 : 1,
                    width: editingKatId ? 'auto' : '100%',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {editingKatId ? <Save size={14} /> : <Plus size={14} />}
                  {editingKatId ? 'Simpan Perubahan' : 'Simpan Kategori Baru'}
                </button>
              </div>
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
                  const isCurrentEditing = editingKatId === kat.id;
                  return (
                    <div
                      key={kat.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: isCurrentEditing ? '#f0f9ff' : '#ffffff',
                        border: isCurrentEditing ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditKategori(kat)}
                          title="Edit Kategori"
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            color: '#2563eb',
                            padding: '5px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKategori(kat)}
                          title="Hapus Kategori"
                          style={{
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
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
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => {
                  handleCancelEditKategori();
                  setIsKategoriModalOpen(false);
                }}
                className="btn btn-outline"
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
