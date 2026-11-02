import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Award, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  X, 
  User, 
  Building, 
  Calendar, 
  Save 
} from 'lucide-react';

import SearchableSelect from '../../components/SearchableSelect';
import { SURAH_LIST } from '../../utils/quranSurah.util';
import { showConfirm, showError, toastSuccess } from '../../utils/alert.util';

export default function TahfidzView() {
  const [setoranList, setSetoranList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [halaqahList, setHalaqahList] = useState([]);
  const [materiMasterList, setMateriMasterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterKelancaran, setFilterKelancaran] = useState('Semua Kelancaran');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    santri_id: '',
    asatidz_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    materi_hafalan: "Al-Qur'an",
    capaian_hafalan: '',
    nilai_kelancaran: 'Mumtaz (A)',
    status: 'Lulus',
    catatan: 'Hafalan lancar dan mutqin.'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSetoran, resSantri, resAsatidz, resHalaqah, resMateri] = await Promise.all([
        axios.get('/api/tahfidz/setoran'),
        axios.get('/api/santri'),
        axios.get('/api/asatidz'),
        axios.get('/api/tahfidz/halaqah'),
        axios.get('/api/materi-hafalan').catch(() => ({ data: { success: false } }))
      ]);

      if (resMateri.data && resMateri.data.success && resMateri.data.data) {
        setMateriMasterList(resMateri.data.data);
      } else {
        setMateriMasterList([]);
      }

      if (resSetoran.data && resSetoran.data.success && Array.isArray(resSetoran.data.data)) {
        setSetoranList(resSetoran.data.data);
      } else {
        setSetoranList([]);
      }

      if (resSantri.data && resSantri.data.success && Array.isArray(resSantri.data.data)) {
        setSantriList(resSantri.data.data);
      } else {
        setSantriList([]);
      }

      if (resAsatidz.data && resAsatidz.data.success && Array.isArray(resAsatidz.data.data)) {
        setAsatidzList(resAsatidz.data.data);
      } else {
        setAsatidzList([]);
      }

      if (resHalaqah.data && resHalaqah.data.success && Array.isArray(resHalaqah.data.data)) {
        setHalaqahList(resHalaqah.data.data);
      } else {
        setHalaqahList([]);
      }
    } catch (err) {
      console.error('Gagal memuat data tahfidz:', err);
      setSetoranList([]);
      setSantriList([]);
      setAsatidzList([]);
      setHalaqahList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDetail = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    const firstSantri = santriList[0];
    const firstAsatidz = asatidzList[0];
    setFormData({
      id: null,
      santri_id: firstSantri?.id || '',
      asatidz_id: firstAsatidz?.id || '',
      tanggal: new Date().toISOString().split('T')[0],
      materi_hafalan: "Al-Qur'an",
      capaian_hafalan: '',
      nilai_kelancaran: 'Mumtaz (A)',
      status: 'Lulus',
      catatan: 'Hafalan lancar dan mutqin.'
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      asatidz_id: item.asatidz_id || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
      materi_hafalan: item.materi_hafalan || (item.surat_mulai ? "Al-Qur'an" : 'Nadzom Al-Jurumiyah'),
      capaian_hafalan: item.capaian_hafalan || (item.surat_mulai ? `QS. ${item.surat_mulai} (${item.ayat_mulai || 1}) - QS. ${item.surat_selesai || item.surat_mulai} (${item.ayat_selesai || 10})` : ''),
      nilai_kelancaran: item.nilai_kelancaran || item.kualitas_tajwid || 'Mumtaz (A)',
      status: item.status || 'Lulus',
      catatan: item.catatan || ''
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      showError('Validasi Gagal', 'Pilih santri terlebih dahulu!');
      return;
    }
    if (!formData.materi_hafalan) {
      showError('Validasi Gagal', 'Isi atau pilih materi hafalan / kitab!');
      return;
    }
    if (!formData.capaian_hafalan) {
      showError('Validasi Gagal', 'Isi capaian / bagian hafalan yang disetorkan!');
      return;
    }

    const payload = {
      ...formData,
      jenis_setoran: formData.materi_hafalan,
      juz: 1,
      surat_mulai: formData.materi_hafalan,
      ayat_mulai: 1,
      surat_selesai: formData.capaian_hafalan,
      ayat_selesai: 1,
      kualitas_tajwid: formData.nilai_kelancaran
    };

    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/tahfidz/setoran', payload);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/tahfidz/setoran/${formData.id}`, payload);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
      toastSuccess(formMode === 'add' ? 'Setoran hafalan santri berhasil dicatat' : 'Data setoran hafalan berhasil diperbarui');
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await showConfirm('Hapus Setoran', `Yakin ingin menghapus riwayat setoran "${nama}"?`, 'Ya, Hapus', 'Batal');
    if (ok) {
      try {
        await axios.delete(`/api/tahfidz/setoran/${id}`);
        fetchData();
        toastSuccess(`Riwayat setoran "${nama}" berhasil dihapus.`);
      } catch (err) {
        showError('Gagal Menghapus', err.message);
      }
    }
  };

  // Stats calculation
  const totalSetoran = setoranList.length;
  const countQuran = setoranList.filter(s => {
    const mat = (s.materi_hafalan || s.surat_mulai || '').toLowerCase();
    return mat.includes('qur') || mat.includes('al-') || !!s.juz;
  }).length;
  const countKitab = setoranList.filter(s => {
    const mat = (s.materi_hafalan || '').toLowerCase();
    return mat && !mat.includes('qur');
  }).length;
  const countMumtaz = setoranList.filter(s => (s.nilai_kelancaran || s.kualitas_tajwid || '').includes('Mumtaz')).length;

  const filteredList = setoranList.filter((st) => {
    const q = search.toLowerCase();
    const mat = (st.materi_hafalan || st.surat_mulai || '').toLowerCase();
    const cap = (st.capaian_hafalan || st.surat_selesai || '').toLowerCase();
    const matchSearch = (
      st.nama_santri?.toLowerCase().includes(q) ||
      st.nis?.toLowerCase().includes(q) ||
      mat.includes(q) ||
      cap.includes(q) ||
      st.nama_asatidz?.toLowerCase().includes(q) ||
      st.nama_asrama?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'quran' ? (mat.includes('qur') || !!st.juz) :
      activeFilterTab === 'jurumiyah' ? mat.includes('jurumi') :
      activeFilterTab === 'imrithi' ? (mat.includes('imrithi') || mat.includes('alfi')) :
      activeFilterTab === 'kitab' ? (!mat.includes('qur') && !mat.includes('jurumi') && !mat.includes('imrithi') && !mat.includes('alfi')) : true;

    const kelancaran = st.nilai_kelancaran || st.kualitas_tajwid || '';
    const matchKelancaran = filterKelancaran === 'Semua Kelancaran' ? true : kelancaran.includes(filterKelancaran.split(' ')[0]);
    const matchStatus = filterStatus === 'Semua Status' ? true : st.status === filterStatus;

    return matchSearch && matchTab && matchKelancaran && matchStatus;
  });

  const santriOptions = santriList.map((s) => ({
    value: s.id,
    label: s.nama_santri,
    sublabel: s.nis ? `NIS: ${s.nis}${s.nama_asrama ? ' • ' + s.nama_asrama : ''}` : (s.nama_asrama || null)
  }));

  const asatidzOptions = asatidzList.map((a) => ({
    value: a.id,
    label: `${a.nama_asatidz} ${a.gelar || ''}`.trim(),
    sublabel: a.tugas_utama || 'Asatidz Penguji'
  }));

  const MATERI_HAFALAN_PRESETS = [
    "Al-Qur'an",
    "Nadzom Al-Jurumiyah",
    "Nadzom Al-Imrithi",
    "Nadzom Alfiyah Ibnu Malik",
    "Matan Al-Ghoyah wat Taqrib",
    "Aqidatul Awam",
    "Hadits Al-Arba'in An-Nawawiyyah",
    "Taisirul Khalaq",
    "Nadzom Maqsud",
    "Kajian Kitab Kuning Lainnya"
  ];

  const KELANCARAN_OPTIONS = [
    { value: 'Mumtaz (A)', label: 'Mumtaz (A - Sangat Lancar / Mumtaz)' },
    { value: 'Jayyid Jiddan (B+)', label: 'Jayyid Jiddan (B+ - Lancar Sekali)' },
    { value: 'Jayyid (B)', label: 'Jayyid (B - Cukup Lancar)' },
    { value: 'Maqbul (C)', label: 'Maqbul (C - Kurang Lancar)' },
    { value: "Dho'if (D)", label: "Dho'if (D - Perlu Mengulang)" }
  ];

  const statusOptions = [
    { value: 'Lulus', label: 'Lulus (Diterima)' },
    { value: 'Perlu Pengulangan', label: 'Perlu Pengulangan' },
    { value: 'Mengulang', label: 'Mengulang Penuh' }
  ];

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SETORAN HAFALAN</div>
            <div className="stat-colored-number">{totalSetoran}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">HAFALAN AL-QUR'AN</div>
            <div className="stat-colored-number">{countQuran}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">KITAB & NADZOM</div>
            <div className="stat-colored-number">{countKitab}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Layers size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">PREDIKAT MUMTAZ (A)</div>
            <div className="stat-colored-number">{countMumtaz}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Hafalan Santri (Tahfidz Qur'an & Kitab/Nadzom)</h2>
            <p>Pencatatan mutaba'ah setoran hafalan santri: Al-Qur'an, Nadzom Jurumiyah, Imrithi, Alfiyah, Hadits Arbain, dll.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> + Input Setoran Santri
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <BookOpen size={14} /> Semua Hafalan ({setoranList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'quran' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('quran')}
        >
          <Sparkles size={14} /> Al-Qur'an ({countQuran})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'jurumiyah' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('jurumiyah')}
        >
          <Layers size={14} /> Nadzom Jurumiyah
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'imrithi' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('imrithi')}
        >
          <Award size={14} /> Imrithi & Alfiyah
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'kitab' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('kitab')}
        >
          <CheckCircle2 size={14} /> Kitab Lainnya
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari santri, kitab, nadzom, capaian, atau ustadz..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ minWidth: '170px' }}>
          <SearchableSelect
            options={['Semua Kelancaran', 'Mumtaz (A)', 'Jayyid Jiddan (B+)', 'Jayyid (B)', 'Maqbul (C)', "Dho'if (D)"]}
            value={filterKelancaran}
            onChange={(val) => setFilterKelancaran(val || 'Semua Kelancaran')}
            placeholder="Semua Kelancaran"
          />
        </div>
        <div style={{ minWidth: '150px' }}>
          <SearchableSelect
            options={['Semua Status', 'Lulus', 'Perlu Pengulangan', 'Mengulang']}
            value={filterStatus}
            onChange={(val) => setFilterStatus(val || 'Semua Status')}
            placeholder="Semua Status"
          />
        </div>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data setoran tahfidz...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada data setoran tahfidz di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th className="td-center" style={{ width: '90px' }}>TANGGAL</th>
                <th>NAMA SANTRI & ASRAMA</th>
                <th className="td-center" style={{ width: '160px' }}>MATERI HAFALAN / KITAB</th>
                <th>CAPAIAN / BAGIAN HAFALAN</th>
                <th className="td-center" style={{ width: '120px' }}>KELANCARAN</th>
                <th className="td-center" style={{ width: '85px' }}>STATUS</th>
                <th>ASATIDZ PENGUJI</th>
                <th className="td-center" style={{ width: '110px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => {
                const materi = row.materi_hafalan || (row.surat_mulai ? "Al-Qur'an" : 'Hafalan');
                const capaian = row.capaian_hafalan || (row.surat_mulai ? `QS. ${row.surat_mulai} (${row.ayat_mulai || 1}) - QS. ${row.surat_selesai || row.surat_mulai} (${row.ayat_selesai || 10})` : '-');
                const kelancaran = row.nilai_kelancaran || row.kualitas_tajwid || 'Mumtaz (A)';

                return (
                  <tr key={row.id || idx}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td className="td-center" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                      {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                        NIS: {row.nis || '-'} • {row.nama_asrama || 'Asrama'} ({row.nama_kamar || '-'})
                      </div>
                    </td>
                    <td className="td-center">
                      <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                        {materi}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                        {capaian}
                      </div>
                    </td>
                    <td className="td-center">
                      <span className={`badge ${
                        kelancaran.includes('Mumtaz') ? 'badge-success' :
                        kelancaran.includes('Jayyid Jiddan') ? 'badge-info' :
                        kelancaran.includes('Jayyid') ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {kelancaran}
                      </span>
                    </td>
                    <td className="td-center">
                      <span className={`badge ${row.status === 'Lulus' ? 'badge-success' : 'badge-danger'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                        {row.nama_asatidz || 'Musyrif'}
                      </div>
                    </td>
                    <td className="td-center">
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <button 
                          className="btn-action btn-action-view"
                          onClick={() => openDetail(row)}
                          title="Lihat Detail Setoran"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-edit"
                          onClick={() => openEditForm(row)}
                          title="Edit Setoran"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-delete"
                          onClick={() => handleDelete(row.id, `${row.nama_santri} - ${materi}`)}
                          title="Hapus Setoran"
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

      {/* ==================================================== */}
      {/* MODAL DETAIL TAHFIDZ                                */}
      {/* ==================================================== */}
      {isModalOpen && selectedItem && (
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
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Detail Mutaba'ah Setoran Tahfidz</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'} • Jenis: {selectedItem.jenis_setoran}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px', background: '#f1f5f9' }}>
              {/* Profile Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #334155'
              }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{selectedItem.nama_santri}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    NIS: {selectedItem.nis || '-'} • {selectedItem.nama_asrama || 'Asrama'} ({selectedItem.nama_kamar || '-'})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedItem.status || 'Lulus'}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Materi Hafalan / Kitab
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#059669' }}>
                    {selectedItem.materi_hafalan || (selectedItem.surat_mulai ? "Al-Qur'an" : 'Hafalan')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Kelancaran & Penguji
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                    {selectedItem.nilai_kelancaran || selectedItem.kualitas_tajwid || 'Mumtaz (A)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                    Penguji: {selectedItem.nama_asatidz || 'Musyrif'}
                  </div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Capaian / Bagian Hafalan Yang Disetorkan
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {selectedItem.capaian_hafalan || (selectedItem.surat_mulai ? `QS. ${selectedItem.surat_mulai} (${selectedItem.ayat_mulai || 1}) s/d QS. ${selectedItem.surat_selesai || selectedItem.surat_mulai} (${selectedItem.ayat_selesai || 10})` : '-')}
                  </div>
                </div>
              </div>

              {/* Catatan Bimbingan */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                  Catatan Evaluasi / Bimbingan Ustadz
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  {selectedItem.catatan || 'Tidak ada catatan khusus.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #cbd5e1',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button className="btn btn-outline" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM (ADD & EDIT)                             */}
      {/* ==================================================== */}
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
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {formMode === 'add' ? 'Input Mutaba\'ah Hafalan Santri' : 'Edit Mutaba\'ah Hafalan Santri'}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                    Catat capaian hafalan santri: Al-Qur'an, Nadzom Al-Jurumiyah, Imrithi, Alfiyah, dll.
                  </p>
                </div>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '5px', borderRadius: '6px' }}
                title="Tutup Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding: '18px', background: '#f1f5f9' }}>
                
                {/* Santri & Musyrif Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#0284c7" /> SANTRI & ASATIDZ PENGUJI
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Pilih Santri *</label>
                      <SearchableSelect
                        options={santriOptions}
                        value={formData.santri_id}
                        onChange={(val) => setFormData({ ...formData, santri_id: val })}
                        placeholder="-- Cari & Pilih Santri dari Database --"
                        searchPlaceholder="Ketik nama santri atau NIS..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Asatidz Penguji *</label>
                      <SearchableSelect
                        options={asatidzOptions}
                        value={formData.asatidz_id}
                        onChange={(val) => setFormData({ ...formData, asatidz_id: val })}
                        placeholder="-- Cari & Pilih Asatidz --"
                        searchPlaceholder="Ketik nama ustadz..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Tanggal Setoran *</label>
                      <input 
                        type="date"
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Materi & Capaian Hafalan Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <BookOpen size={14} color="#059669" /> MATERI & CAPAIAN HAFALAN (AL-QUR'AN / KITAB / NADZOM)
                  </div>

                  {/* Preset Quick Chips */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Pilihan Cepat Materi:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(materiMasterList.length > 0 ? materiMasterList.slice(0, 8).map(m => m.nama_materi) : ["Al-Qur'an", "Nadzom Al-Jurumiyah", "Nadzom Al-Imrithi", "Nadzom Alfiyah", "Matan Taqrib", "Aqidatul Awam", "Hadits Arbain"]).map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFormData({ ...formData, materi_hafalan: item })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            border: formData.materi_hafalan === item ? '1px solid #059669' : '1px solid #cbd5e1',
                            background: formData.materi_hafalan === item ? '#ecfdf5' : '#f8fafc',
                            color: formData.materi_hafalan === item ? '#065f46' : '#475569',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Materi Hafalan / Nama Kitab *</label>
                      <SearchableSelect
                        options={(materiMasterList.length > 0 ? materiMasterList : MATERI_HAFALAN_PRESETS.map((m, idx) => ({ id: idx, nama_materi: m, kategori: 'Kitab' }))).map(m => ({
                          value: m.nama_materi,
                          label: m.nama_materi,
                          sublabel: m.kategori ? `${m.kategori}${m.target_hafalan ? ` • ${m.target_hafalan}` : ''}` : null
                        }))}
                        value={formData.materi_hafalan}
                        onChange={(val) => setFormData({ ...formData, materi_hafalan: val })}
                        placeholder="-- Cari & Pilih Materi / Kitab --"
                        searchPlaceholder="Ketik nama kitab, nadzom, surat..."
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Tingkat Kelancaran / Nilai *</label>
                      <SearchableSelect
                        options={KELANCARAN_OPTIONS}
                        value={formData.nilai_kelancaran}
                        onChange={(val) => setFormData({ ...formData, nilai_kelancaran: val })}
                        placeholder="-- Tingkat Kelancaran --"
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Capaian / Bagian Hafalan Yang Disetorkan *</label>
                      <input 
                        type="text"
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.capaian_hafalan}
                        onChange={(e) => setFormData({ ...formData, capaian_hafalan: e.target.value })}
                        placeholder="Contoh: Bait 1 - 25 (Bab Kalam & I'rab) / Juz 30 (An-Naba s/d An-Nas) / Bab Thaharah..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Catatan */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={14} color="#7c3aed" /> STATUS & CATATAN MUSYRIF
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Status Kelulusan *</label>
                    <SearchableSelect
                      options={statusOptions}
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      placeholder="-- Status Kelulusan --"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Catatan Bimbingan</label>
                    <textarea 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                      rows="2"
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      placeholder="Catatan kelebihan, makhraj, kelancaran, atau perbaikan hafalan..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '12px 18px',
                borderTop: '1px solid #cbd5e1',
                background: '#ffffff',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                <button type="button" className="btn btn-outline" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{formMode === 'add' ? 'Simpan Setoran' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
