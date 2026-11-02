import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Save, 
  Check, 
  UserCheck, 
  RotateCw, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  Calendar,
  Copy,
  Info,
  Database
} from 'lucide-react';
import { showConfirm, showSuccess, showError, toastSuccess, toastError } from '../../utils/alert.util';

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

// Helper: Cek apakah kegiatan berjalan pada hari tertentu
const isKegiatanOnDay = (keg, targetDay) => {
  if (!targetDay || targetDay === 'semua') return true;
  const raw = (keg.hari_aktif || 'Setiap Hari').trim();
  const lower = raw.toLowerCase();

  if (lower === 'setiap hari' || lower === 'semua' || lower === 'semua hari') return true;
  
  if (lower === 'senin - jumat' || lower === 'senin-jumat') {
    return ['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(targetDay.toLowerCase());
  }
  if (lower === 'senin - sabtu' || lower === 'senin-sabtu') {
    return ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'].includes(targetDay.toLowerCase());
  }
  if (lower === 'sabtu - ahad' || lower === 'sabtu-ahad' || lower.includes('weekend')) {
    return ['sabtu', 'ahad'].includes(targetDay.toLowerCase());
  }

  const parts = raw.split(/[,/]+/).map(p => p.trim().toLowerCase());
  return parts.some(p => p === targetDay.toLowerCase() || p.includes(targetDay.toLowerCase()));
};

// Helper: Mengubah string hari_aktif menjadi array
const parseDaysToArray = (hariAktifStr) => {
  if (!hariAktifStr || hariAktifStr === 'Setiap Hari' || hariAktifStr === 'Semua' || hariAktifStr === 'Semua Hari') {
    return [...ALL_DAYS];
  }
  if (hariAktifStr === 'Senin - Jumat' || hariAktifStr === 'Senin-Jumat') {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  }
  if (hariAktifStr === 'Senin - Sabtu' || hariAktifStr === 'Senin-Sabtu') {
    return ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  }
  if (hariAktifStr === 'Sabtu - Ahad' || hariAktifStr === 'Sabtu-Ahad' || hariAktifStr === 'Weekend') {
    return ['Sabtu', 'Ahad'];
  }
  return ALL_DAYS.filter(d => isKegiatanOnDay({ hari_aktif: hariAktifStr }, d));
};

// Helper: Format array hari kembali menjadi string
const formatDaysToString = (daysArr) => {
  if (!daysArr || daysArr.length === 0) return 'Setiap Hari';
  if (daysArr.length === 7) return 'Setiap Hari';
  if (daysArr.length === 5 && ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].every(d => daysArr.includes(d))) {
    return 'Senin - Jumat';
  }
  if (daysArr.length === 6 && ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].every(d => daysArr.includes(d))) {
    return 'Senin - Sabtu';
  }
  if (daysArr.length === 2 && daysArr.includes('Sabtu') && daysArr.includes('Ahad')) {
    return 'Sabtu - Ahad';
  }
  return daysArr.join(', ');
};

export default function SettingKegiatanView() {
  // DATA MURNI DARI DATABASE (TANPA DATA FAKE / MOCK)
  const [kegiatanList, setKegiatanList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState('loading'); // 'connected' | 'error' | 'loading'

  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [filterTipePeserta, setFilterTipePeserta] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [selectedDayTab, setSelectedDayTab] = useState('semua');

  // Form Modal (Tambah / Edit Kegiatan)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    kode_sesi: '',
    nama_sesi: '',
    kategori: 'Shalat Berjamaah',
    tipe_peserta: 'Wajib Semua Santri',
    target_gender: 'Semua',
    target_tipe_santri: 'Semua',
    jam_mulai_presensi: '04:15',
    jam_target: '04:40',
    jam_toleransi_telat: '04:45',
    jam_tutup_presensi: '05:15',
    hari_aktif: 'Setiap Hari',
    selected_days: [...ALL_DAYS],
    is_active: 1,
    keterangan: '',
    peserta_santri_ids: []
  });

  // Modal Kelola Peserta Santri Tertentu
  const [isPesertaModalOpen, setIsPesertaModalOpen] = useState(false);
  const [activeKegiatanForPeserta, setActiveKegiatanForPeserta] = useState(null);
  const [tempPesertaIds, setTempPesertaIds] = useState([]);
  const [santriSearch, setSantriSearch] = useState('');
  const [santriGenderFilter, setSantriGenderFilter] = useState('Semua');

  // Load Data Kegiatan Asli dari Database MySQL
  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/absensi/sesi');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const normalized = res.data.data.map((item) => {
          let pIds = [];
          if (item.peserta_santri_ids) {
            try {
              pIds = typeof item.peserta_santri_ids === 'string' 
                ? JSON.parse(item.peserta_santri_ids) 
                : item.peserta_santri_ids;
            } catch {
              pIds = [];
            }
          }
          return {
            ...item,
            tipe_peserta: item.tipe_peserta || (item.kategori?.includes('Shalat') ? 'Wajib Semua Santri' : 'Santri Tertentu / Terpilih'),
            hari_aktif: item.hari_aktif || 'Setiap Hari',
            peserta_santri_ids: Array.isArray(pIds) ? pIds : []
          };
        });
        setKegiatanList(normalized);
        setDbStatus('connected');
      } else {
        setKegiatanList([]);
        setDbStatus('connected');
      }
    } catch (err) {
      console.error('Gagal mengambil data kegiatan dari database:', err);
      setDbStatus('error');
      setKegiatanList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Data Santri Asli dari Database MySQL
  const fetchSantri = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      } else {
        setSantriList([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data santri dari database:', err);
      setSantriList([]);
    }
  };

  useEffect(() => {
    fetchKegiatan();
    fetchSantri();
  }, []);

  // Filter Kegiatan berdasarkan Search, Kategori, Sifat, Status, dan TAB HARI
  const filteredKegiatan = kegiatanList.filter((item) => {
    if (selectedDayTab !== 'semua' && !isKegiatanOnDay(item, selectedDayTab)) {
      return false;
    }

    const q = search.toLowerCase();
    const matchSearch = !q || (
      item.nama_sesi?.toLowerCase().includes(q) ||
      item.kode_sesi?.toLowerCase().includes(q) ||
      item.kategori?.toLowerCase().includes(q) ||
      item.hari_aktif?.toLowerCase().includes(q)
    );
    if (!matchSearch) return false;

    if (filterKategori !== 'semua' && item.kategori !== filterKategori) return false;
    if (filterTipePeserta !== 'semua' && item.tipe_peserta !== filterTipePeserta) return false;
    if (filterStatus !== 'semua' && String(item.is_active) !== filterStatus) return false;

    return true;
  });

  // Hitung jumlah kegiatan per hari
  const getDayCount = (day) => {
    return kegiatanList.filter(k => isKegiatanOnDay(k, day)).length;
  };

  // Statistik Ringkas
  const totalKegiatan = kegiatanList.length;
  const totalWajib = kegiatanList.filter(x => x.tipe_peserta === 'Wajib Semua Santri').length;
  const totalKhusus = kegiatanList.filter(x => x.tipe_peserta !== 'Wajib Semua Santri').length;
  const totalAktif = kegiatanList.filter(x => x.is_active == 1).length;

  // Toggle Pilihan Hari di Form
  const toggleFormDay = (day) => {
    setFormData(prev => {
      const current = prev.selected_days || [];
      let updated;
      if (current.includes(day)) {
        updated = current.filter(d => d !== day);
      } else {
        updated = [...current, day];
      }
      return {
        ...prev,
        selected_days: updated,
        hari_aktif: formatDaysToString(updated)
      };
    });
  };

  // Preset Pilihan Hari di Form
  const setFormDaysPreset = (preset) => {
    let days = [];
    if (preset === 'all') days = [...ALL_DAYS];
    else if (preset === 'weekdays') days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    else if (preset === 'school') days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    else if (preset === 'weekend') days = ['Sabtu', 'Ahad'];
    else if (preset === 'clear') days = [];

    setFormData(prev => ({
      ...prev,
      selected_days: days,
      hari_aktif: formatDaysToString(days)
    }));
  };

  // 1. TAMBAH DATA: Buka Modal Form Tambah
  const openAddForm = (initialDay = null) => {
    setFormMode('add');
    const dayToUse = initialDay || (selectedDayTab !== 'semua' ? selectedDayTab : null);
    const defaultDays = dayToUse ? [dayToUse] : [...ALL_DAYS];
    
    setFormData({
      id: null,
      kode_sesi: `KEGIATAN-${Date.now().toString().slice(-4)}`,
      nama_sesi: '',
      kategori: 'Shalat Berjamaah',
      tipe_peserta: 'Wajib Semua Santri',
      target_gender: 'Semua',
      target_tipe_santri: 'Semua',
      jam_mulai_presensi: '04:15',
      jam_target: '04:40',
      jam_toleransi_telat: '04:45',
      jam_tutup_presensi: '05:15',
      hari_aktif: formatDaysToString(defaultDays),
      selected_days: defaultDays,
      is_active: 1,
      keterangan: '',
      peserta_santri_ids: []
    });
    setIsFormOpen(true);
  };

  // 2. EDIT DATA: Buka Modal Form Edit
  const openEditForm = (keg) => {
    setFormMode('edit');
    const daysArr = parseDaysToArray(keg.hari_aktif);
    setFormData({
      id: keg.id,
      kode_sesi: keg.kode_sesi || '',
      nama_sesi: keg.nama_sesi || '',
      kategori: keg.kategori || 'Shalat Berjamaah',
      tipe_peserta: keg.tipe_peserta || 'Wajib Semua Santri',
      target_gender: keg.target_gender || 'Semua',
      target_tipe_santri: keg.target_tipe_santri || 'Semua',
      jam_mulai_presensi: keg.jam_mulai_presensi ? keg.jam_mulai_presensi.slice(0, 5) : '04:15',
      jam_target: keg.jam_target ? keg.jam_target.slice(0, 5) : '04:40',
      jam_toleransi_telat: keg.jam_toleransi_telat ? keg.jam_toleransi_telat.slice(0, 5) : '04:45',
      jam_tutup_presensi: keg.jam_tutup_presensi ? keg.jam_tutup_presensi.slice(0, 5) : '05:15',
      hari_aktif: keg.hari_aktif || 'Setiap Hari',
      selected_days: daysArr.length > 0 ? daysArr : [...ALL_DAYS],
      is_active: keg.is_active !== undefined ? keg.is_active : 1,
      keterangan: keg.keterangan || '',
      peserta_santri_ids: keg.peserta_santri_ids || []
    });
    setIsFormOpen(true);
  };

  // DUPLIKASI DATA: Salin Kegiatan Cepat
  const duplicateKegiatan = (keg) => {
    setFormMode('add');
    const daysArr = parseDaysToArray(keg.hari_aktif);
    setFormData({
      id: null,
      kode_sesi: `${keg.kode_sesi || 'KEG'}-COPY-${Date.now().toString().slice(-3)}`,
      nama_sesi: `${keg.nama_sesi} (Salinan)`,
      kategori: keg.kategori || 'Shalat Berjamaah',
      tipe_peserta: keg.tipe_peserta || 'Wajib Semua Santri',
      target_gender: keg.target_gender || 'Semua',
      target_tipe_santri: keg.target_tipe_santri || 'Semua',
      jam_mulai_presensi: keg.jam_mulai_presensi ? keg.jam_mulai_presensi.slice(0, 5) : '04:15',
      jam_target: keg.jam_target ? keg.jam_target.slice(0, 5) : '04:40',
      jam_toleransi_telat: keg.jam_toleransi_telat ? keg.jam_toleransi_telat.slice(0, 5) : '04:45',
      jam_tutup_presensi: keg.jam_tutup_presensi ? keg.jam_tutup_presensi.slice(0, 5) : '05:15',
      hari_aktif: keg.hari_aktif || 'Setiap Hari',
      selected_days: daysArr.length > 0 ? daysArr : [...ALL_DAYS],
      is_active: 1,
      keterangan: keg.keterangan || '',
      peserta_santri_ids: [...(keg.peserta_santri_ids || [])]
    });
    setIsFormOpen(true);
  };

  // SIMPAN DATA KE DATABASE (TAMBAH / EDIT)
  const handleSaveKegiatan = async (e) => {
    e.preventDefault();
    if (!formData.nama_sesi.trim()) {
      showError('Validasi Gagal', 'Nama kegiatan santri tidak boleh kosong!');
      return;
    }

    if (!formData.selected_days || formData.selected_days.length === 0) {
      showError('Validasi Gagal', 'Pilih minimal satu hari pelaksanaan kegiatan!');
      return;
    }

    try {
      setSubmitting(true);
      const formattedDays = formatDaysToString(formData.selected_days);
      const payload = {
        ...formData,
        hari_aktif: formattedDays,
        jam_mulai_presensi: formData.jam_mulai_presensi.length === 5 ? `${formData.jam_mulai_presensi}:00` : formData.jam_mulai_presensi,
        jam_target: formData.jam_target.length === 5 ? `${formData.jam_target}:00` : formData.jam_target,
        jam_toleransi_telat: formData.jam_toleransi_telat.length === 5 ? `${formData.jam_toleransi_telat}:00` : formData.jam_toleransi_telat,
        jam_tutup_presensi: formData.jam_tutup_presensi.length === 5 ? `${formData.jam_tutup_presensi}:00` : formData.jam_tutup_presensi,
      };

      if (formMode === 'add') {
        const res = await axios.post('/api/absensi/sesi', payload);
        if (res.data?.success) {
          toastSuccess(`Kegiatan "${payload.nama_sesi}" berhasil disimpan ke database!`);
          setIsFormOpen(false);
          await fetchKegiatan();
        } else {
          showError('Gagal Menyimpan', res.data?.message || 'Gagal menyimpan kegiatan ke database');
        }
      } else {
        // Mode Edit
        const res = await axios.put(`/api/absensi/sesi/${formData.id}`, payload);
        if (res.data?.success) {
          toastSuccess(`Perubahan kegiatan "${payload.nama_sesi}" berhasil disimpan ke database!`);
          setIsFormOpen(false);
          await fetchKegiatan();
        } else {
          showError('Gagal Memperbarui', res.data?.message || 'Gagal memperbarui kegiatan di database');
        }
      }
    } catch (err) {
      console.error('Error simpan kegiatan:', err);
      showError('Gagal Menyimpan', err.response?.data?.message || err.message || 'Gagal menyimpan data kegiatan ke database');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. HAPUS DATA: Hapus dari Database MySQL
  const handleDeleteKegiatan = async (keg) => {
    const ok = await showConfirm(
      'Hapus Jadwal Kegiatan?', 
      `Apakah Anda yakin ingin menghapus kegiatan "${keg.nama_sesi}" dari database?`,
      'Ya, Hapus Kegiatan',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/absensi/sesi/${keg.id}`);
      if (res.data?.success) {
        toastSuccess(`Kegiatan "${keg.nama_sesi}" berhasil dihapus dari database.`);
        await fetchKegiatan();
      } else {
        toastError(res.data?.message || 'Gagal menghapus kegiatan dari database');
      }
    } catch (err) {
      console.error('Error hapus kegiatan:', err);
      toastError(err.response?.data?.message || 'Gagal menghapus kegiatan dari database');
    }
  };

  // TOGGLE STATUS (Aktif / Nonaktif Langsung ke Database)
  const handleToggleStatus = async (keg) => {
    const nextStatus = keg.is_active == 1 ? 0 : 1;
    const label = nextStatus === 1 ? 'Aktif' : 'Nonaktif';

    try {
      const res = await axios.put(`/api/absensi/sesi/${keg.id}`, { ...keg, is_active: nextStatus });
      if (res.data?.success) {
        toastSuccess(`Status "${keg.nama_sesi}" diubah menjadi ${label}`);
        await fetchKegiatan();
      }
    } catch (err) {
      console.error('Error ubah status:', err);
      toastError('Gagal mengubah status kegiatan di database');
    }
  };

  // MODAL KELOLA PESERTA SANTRI KHUSUS (Database)
  const openPesertaModal = (keg) => {
    setActiveKegiatanForPeserta(keg);
    setTempPesertaIds(keg.peserta_santri_ids || []);
    setSantriSearch('');
    setSantriGenderFilter('Semua');
    setIsPesertaModalOpen(true);
  };

  const toggleSantriPeserta = (santriId) => {
    setTempPesertaIds(prev => {
      if (prev.includes(santriId)) {
        return prev.filter(id => id !== santriId);
      } else {
        return [...prev, santriId];
      }
    });
  };

  const toggleSelectAllVisible = (visibleIds) => {
    const allSelected = visibleIds.every(id => tempPesertaIds.includes(id));
    if (allSelected) {
      setTempPesertaIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setTempPesertaIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSavePeserta = async () => {
    if (!activeKegiatanForPeserta) return;
    try {
      const updatedKeg = {
        ...activeKegiatanForPeserta,
        peserta_santri_ids: tempPesertaIds
      };

      const res = await axios.put(`/api/absensi/sesi/${activeKegiatanForPeserta.id}`, updatedKeg);
      if (res.data?.success) {
        toastSuccess(`Peserta "${activeKegiatanForPeserta.nama_sesi}" berhasil disimpan ke database (${tempPesertaIds.length} santri)!`);
        setIsPesertaModalOpen(false);
        await fetchKegiatan();
      } else {
        toastError(res.data?.message || 'Gagal menyimpan peserta ke database');
      }
    } catch (err) {
      console.error('Error simpan peserta:', err);
      toastError(err.response?.data?.message || 'Gagal menyimpan daftar santri peserta ke database');
    }
  };

  const filteredSantriList = santriList.filter(s => {
    const q = santriSearch.toLowerCase();
    const matchSearch = !q || (
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      s.kelas?.toLowerCase().includes(q)
    );
    if (!matchSearch) return false;

    if (santriGenderFilter === 'Ikhwan' && s.jk !== 'L') return false;
    if (santriGenderFilter === 'Akhwat' && s.jk !== 'P') return false;

    return true;
  });

  const visibleSantriIds = filteredSantriList.map(s => s.id);
  const isAllVisibleSelected = visibleSantriIds.length > 0 && visibleSantriIds.every(id => tempPesertaIds.includes(id));

  return (
    <div>
      {/* 1. TOP STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL KEGIATAN DATABASE</div>
            <div className="stat-colored-number">{totalKegiatan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CalendarCheck size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">WAJIB SEMUA SANTRI</div>
            <div className="stat-colored-number">{totalWajib}</div>
          </div>
          <div className="stat-colored-icon-box">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">SANTRI TERTENTU / KHUSUS</div>
            <div className="stat-colored-number">{totalKhusus}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">KEGIATAN AKTIF</div>
            <div className="stat-colored-number">{totalAktif}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP & UTAMA */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <CalendarCheck size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>Setting &amp; Jadwal Kegiatan Santri Per Hari</h2>
              <span className={`badge ${dbStatus === 'connected' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Database size={10} /> {dbStatus === 'connected' ? 'Database Realtime' : 'Database Offline'}
              </span>
            </div>
            <p>Data jadwal kegiatan presensi santri langsung dari database MySQL (tabel kegiatan_sesi)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchKegiatan} title="Segarkan Data Langsung dari Database">
            <RotateCw size={13} /> Refresh DB
          </button>
          <button className="btn btn-primary" onClick={() => openAddForm()} style={{ fontWeight: 700 }}>
            <Plus size={15} /> Tambah Kegiatan
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER HARI (SENIN, SELASA, DST) */}
      <div className="tab-filter-bar" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
        <button 
          className={`tab-btn ${selectedDayTab === 'semua' ? 'active' : ''}`}
          onClick={() => setSelectedDayTab('semua')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Calendar size={13} /> Semua Hari ({kegiatanList.length})
        </button>

        {ALL_DAYS.map(day => {
          const count = getDayCount(day);
          const isActive = selectedDayTab === day;
          return (
            <button 
              key={day}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedDayTab(day)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{day}</span>
              <span style={{ 
                background: isActive ? 'rgba(255,255,255,0.28)' : '#e2e8f0', 
                color: isActive ? '#ffffff' : '#0369a1',
                padding: '1px 6px', 
                borderRadius: '999px', 
                fontSize: '0.68rem', 
                fontWeight: 800
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* BANNER NOTIFIKASI HARI AKTIF & TOMBOL TAMBAH CEPAT PER HARI */}
      {selectedDayTab !== 'semua' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="#0284c7" />
            <div>
              <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.82rem' }}>
                Jadwal Kegiatan Hari {selectedDayTab}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#475569', marginLeft: '6px' }}>
                ({filteredKegiatan.length} kegiatan tersimpan di database)
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => openAddForm(selectedDayTab)}
            style={{ fontSize: '0.74rem', padding: '5px 10px', fontWeight: 700 }}
          >
            <Plus size={13} /> Tambah Kegiatan Hari {selectedDayTab}
          </button>
        </div>
      )}

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder={selectedDayTab !== 'semua' ? `Cari kegiatan hari ${selectedDayTab}...` : 'Cari nama kegiatan, kode, kategori...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* FILTER KATEGORI */}
        <select 
          className="filter-select"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option value="semua">Semua Kategori</option>
          <option value="Shalat Berjamaah">Shalat Berjamaah</option>
          <option value="Halaqah Qur'an">Halaqah Qur'an / Tahfidz</option>
          <option value="Pengajian / Taklim">Pengajian / Taklim</option>
          <option value="Kegiatan Asrama">Kegiatan Asrama</option>
        </select>

        {/* FILTER SIFAT PESERTA */}
        <select 
          className="filter-select"
          value={filterTipePeserta}
          onChange={(e) => setFilterTipePeserta(e.target.value)}
          style={{ fontWeight: 600, color: '#0369a1' }}
        >
          <option value="semua">Semua Sifat Peserta</option>
          <option value="Wajib Semua Santri">Wajib Semua Santri</option>
          <option value="Santri Tertentu / Terpilih">Santri Tertentu / Terpilih</option>
        </select>

        {/* FILTER STATUS */}
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="semua">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '35px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <div>Memuat data jadwal kegiatan dari database MySQL...</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA KEGIATAN &amp; KODE</th>
                <th>KATEGORI</th>
                <th>SIFAT KEPESERTAAN</th>
                <th className="td-center">JADWAL SCAN</th>
                <th>HARI AKTIF</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '190px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredKegiatan.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>
                      {selectedDayTab !== 'semua' 
                        ? `Belum ada kegiatan yang terdaftar untuk Hari ${selectedDayTab} di database.`
                        : 'Belum ada kegiatan yang terdaftar di database MySQL.'
                      }
                    </div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => openAddForm(selectedDayTab !== 'semua' ? selectedDayTab : null)}
                    >
                      <Plus size={13} /> Tambah Kegiatan Baru ke Database
                    </button>
                  </td>
                </tr>
              ) : (
                filteredKegiatan.map((keg, idx) => {
                  const isWajib = keg.tipe_peserta === 'Wajib Semua Santri';
                  const jumlahPeserta = (keg.peserta_santri_ids || []).length;
                  const daysArr = parseDaysToArray(keg.hari_aktif);

                  return (
                    <tr key={keg.id || idx}>
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{keg.nama_sesi}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                          KODE: {keg.kode_sesi}
                        </div>
                        {keg.keterangan && (
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px', maxWidth: '280px' }}>
                            {keg.keterangan}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          keg.kategori?.includes('Tahfidz') || keg.kategori?.includes('Halaqah') 
                            ? 'badge-purple' 
                            : keg.kategori?.includes('Shalat') 
                            ? 'badge-info' 
                            : 'badge-primary'
                        }`}>
                          {keg.kategori}
                        </span>
                      </td>
                      <td>
                        {isWajib ? (
                          <div>
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <ShieldCheck size={11} /> Wajib Semua Santri
                            </span>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                              Seluruh santri wajib hadir
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={11} /> Santri Tertentu
                            </span>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                              <strong style={{ color: '#7c3aed' }}>{jumlahPeserta} santri</strong> terdaftar
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="td-center">
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.78rem' }}>
                          {keg.jam_mulai_presensi?.slice(0, 5)} - {keg.jam_tutup_presensi?.slice(0, 5)}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#d97706' }}>
                          Target: {keg.jam_target?.slice(0, 5)} (Telat: &gt; {keg.jam_toleransi_telat?.slice(0, 5)})
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', maxWidth: '220px' }}>
                          {keg.hari_aktif === 'Setiap Hari' ? (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                              Setiap Hari (7 Hari)
                            </span>
                          ) : (
                            daysArr.map(d => (
                              <span 
                                key={d}
                                className={`badge ${selectedDayTab === d ? 'badge-primary' : 'badge-warning'}`}
                                style={{ fontSize: '0.65rem', padding: '1px 5px' }}
                              >
                                {d}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="td-center">
                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(keg)}
                          title="Klik untuk mengubah status aktif / nonaktif kegiatan ini"
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        >
                          <span className={`badge ${keg.is_active == 1 ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer' }}>
                            {keg.is_active == 1 ? '● Aktif' : '○ Nonaktif'}
                          </span>
                        </button>
                      </td>
                      <td className="td-center">
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {/* TOMBOL EDIT */}
                          <button 
                            className="btn btn-outline btn-sm" 
                            title="Edit Kegiatan Ini"
                            onClick={() => openEditForm(keg)}
                            style={{ padding: '3px 7px', color: '#0284c7', borderColor: '#bae6fd' }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>

                          {/* TOMBOL SALIN / DUPLIKASI */}
                          <button 
                            className="btn btn-outline btn-sm" 
                            title="Duplikasi Kegiatan Ini ke Jadwal Lain"
                            onClick={() => duplicateKegiatan(keg)}
                            style={{ padding: '3px 6px', color: '#d97706', borderColor: '#fde68a' }}
                          >
                            <Copy size={12} />
                          </button>

                          {/* TOMBOL HAPUS */}
                          <button 
                            className="btn btn-danger btn-sm" 
                            title="Hapus Kegiatan Ini"
                            onClick={() => handleDeleteKegiatan(keg)}
                            style={{ padding: '3px 6px' }}
                          >
                            <Trash2 size={12} />
                          </button>

                          {/* KELOLA PESERTA KHUSUS */}
                          {!isWajib && (
                            <button 
                              className="btn btn-outline btn-sm" 
                              title="Atur Santri yang Mengikuti Kegiatan"
                              onClick={() => openPesertaModal(keg)}
                              style={{ padding: '3px 6px', color: '#7c3aed', borderColor: '#c4b5fd', width: '100%', marginTop: '2px', fontSize: '0.68rem' }}
                            >
                              <UserCheck size={11} /> Peserta ({jumlahPeserta})
                            </button>
                          )}
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

      {/* 6. MODAL FORM TAMBAH / EDIT KEGIATAN */}
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
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarCheck size={18} />
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#ffffff' }}>
                  {formMode === 'add' ? 'Tambah Kegiatan Baru ke Database' : 'Edit Pengaturan Kegiatan'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKegiatan}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
                
                {/* KODE & NAMA KEGIATAN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                      Kode Sesi / Kegiatan *
                    </label>
                    <input 
                      type="text" 
                      className="filter-select"
                      style={{ width: '100%', textTransform: 'uppercase' }}
                      value={formData.kode_sesi}
                      onChange={(e) => setFormData({ ...formData, kode_sesi: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                      Nama Kegiatan Santri *
                    </label>
                    <input 
                      type="text" 
                      className="filter-select"
                      style={{ width: '100%', fontWeight: 600 }}
                      placeholder="Contoh: Shalat Shubuh, Mengaji Pagi, Apel Santri, dll"
                      value={formData.nama_sesi}
                      onChange={(e) => setFormData({ ...formData, nama_sesi: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* KATEGORI */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Kategori Kegiatan
                  </label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  >
                    <option value="Shalat Berjamaah">Shalat Berjamaah</option>
                    <option value="Halaqah Qur'an">Halaqah Qur'an / Tahfidz</option>
                    <option value="Pengajian / Taklim">Pengajian / Taklim</option>
                    <option value="Kegiatan Asrama">Kegiatan Asrama</option>
                  </select>
                </div>

                {/* SETTING HARI AKTIF MULTI-CHECK (JADWAL BERBEDA TIAP HARI) */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} color="#0284c7" /> Jadwal Hari Pelaksanaan Kegiatan *
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setFormDaysPreset('all')}
                        style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                      >
                        Semua Hari
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setFormDaysPreset('school')}
                        style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                      >
                        Senin-Sabtu
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setFormDaysPreset('weekdays')}
                        style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                      >
                        Senin-Jumat
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setFormDaysPreset('weekend')}
                        style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                      >
                        Weekend
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => setFormDaysPreset('clear')}
                        style={{ fontSize: '0.68rem', padding: '2px 7px', color: '#ef4444' }}
                      >
                        Kosongkan
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '10px' }}>
                    {ALL_DAYS.map(day => {
                      const isChecked = (formData.selected_days || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleFormDay(day)}
                          style={{
                            padding: '8px 2px',
                            borderRadius: '8px',
                            border: isChecked ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            background: isChecked ? '#e0f2fe' : '#ffffff',
                            color: isChecked ? '#0369a1' : '#64748b',
                            fontWeight: isChecked ? 800 : 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked && <Check size={11} style={{ marginRight: '2px', verticalAlign: 'middle' }} />}
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748b' }}>
                    Ringkasan Hari: <strong style={{ color: '#0369a1' }}>{formatDaysToString(formData.selected_days)}</strong> ({(formData.selected_days || []).length} hari aktif)
                  </div>
                </div>

                {/* SETTING SIFAT KEPESERTAAN */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="#0284c7" /> Sifat Kepesertaan Santri *
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                    {/* OPSI 1: WAJIB SEMUA SANTRI */}
                    <label 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        border: formData.tipe_peserta === 'Wajib Semua Santri' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        background: formData.tipe_peserta === 'Wajib Semua Santri' ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input 
                          type="radio" 
                          name="tipe_peserta" 
                          value="Wajib Semua Santri" 
                          checked={formData.tipe_peserta === 'Wajib Semua Santri'}
                          onChange={() => setFormData({ ...formData, tipe_peserta: 'Wajib Semua Santri' })}
                        />
                        <strong style={{ fontSize: '0.82rem', color: '#166534' }}>Wajib Semua Santri</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.3 }}>
                        Kegiatan massal, seluruh santri wajib hadir tanpa terkecuali (cth: Shalat 5 Waktu, Apel).
                      </span>
                    </label>

                    {/* OPSI 2: SANTRI TERTENTU */}
                    <label 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        border: formData.tipe_peserta === 'Santri Tertentu / Terpilih' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                        background: formData.tipe_peserta === 'Santri Tertentu / Terpilih' ? '#faf5ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <input 
                          type="radio" 
                          name="tipe_peserta" 
                          value="Santri Tertentu / Terpilih" 
                          checked={formData.tipe_peserta === 'Santri Tertentu / Terpilih'}
                          onChange={() => setFormData({ ...formData, tipe_peserta: 'Santri Tertentu / Terpilih' })}
                        />
                        <strong style={{ fontSize: '0.82rem', color: '#6b21a8' }}>Santri Tertentu</strong>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.3 }}>
                        Hanya santri-santri terpilih yang mengikuti kegiatan ini (cth: Halaqah Tahfidz, Kelas Khusus).
                      </span>
                    </label>
                  </div>

                  {formData.tipe_peserta === 'Santri Tertentu / Terpilih' && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: '#ffffff', borderRadius: '6px', border: '1px dashed #c4b5fd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#581c87', fontWeight: 600 }}>
                          Santri Terdaftar: {(formData.peserta_santri_ids || []).length} santri
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          *Dapat diatur lebih rinci via tombol "Peserta" di tabel
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* JAM PRESENSI */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={15} color="#0284c7" /> Jadwal Waktu Presensi
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '3px' }}>Buka Scan</label>
                      <input 
                        type="time" 
                        className="filter-select"
                        style={{ width: '100%' }}
                        value={formData.jam_mulai_presensi}
                        onChange={(e) => setFormData({ ...formData, jam_mulai_presensi: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '3px' }}>Pelaksanaan</label>
                      <input 
                        type="time" 
                        className="filter-select"
                        style={{ width: '100%' }}
                        value={formData.jam_target}
                        onChange={(e) => setFormData({ ...formData, jam_target: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '3px' }}>Batas Telat</label>
                      <input 
                        type="time" 
                        className="filter-select"
                        style={{ width: '100%', borderColor: '#f59e0b' }}
                        value={formData.jam_toleransi_telat}
                        onChange={(e) => setFormData({ ...formData, jam_toleransi_telat: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '3px' }}>Tutup Scan</label>
                      <input 
                        type="time" 
                        className="filter-select"
                        style={{ width: '100%' }}
                        value={formData.jam_tutup_presensi}
                        onChange={(e) => setFormData({ ...formData, jam_tutup_presensi: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* STATUS KEGIATAN */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Status Kegiatan
                  </label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                  >
                    <option value="1">Aktif (Berjalan sesuai jadwal)</option>
                    <option value="0">Nonaktif (Sementara diliburkan)</option>
                  </select>
                </div>

                {/* KETERANGAN */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>
                    Keterangan / Catatan Kegiatan
                  </label>
                  <textarea 
                    className="filter-select"
                    style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                    placeholder="Instruksi musyrif, lokasi khusus, ketentuan tata tertib..."
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  />
                </div>

              </div>

              <div className="modal-footer" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsFormOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {formMode === 'add' ? 'Simpan Kegiatan Baru ke Database' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL KELOLA PESERTA SANTRI TERTENTU */}
      {isPesertaModalOpen && activeKegiatanForPeserta && (
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
            borderRadius: '12px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#ffffff',
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} />
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#ffffff' }}>
                    Pilih Santri Peserta: {activeKegiatanForPeserta.nama_sesi}
                  </h3>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px' }}>
                  Tentukan santri mana saja yang wajib scan pada kegiatan khusus ini (Disimpan ke database)
                </div>
              </div>
              <button 
                onClick={() => setIsPesertaModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}>
              {/* FILTER & PENCARIAN SANTRI */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div className="filter-search-input" style={{ flex: 1, minWidth: '180px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px' }}>
                  <Search size={14} color="#94a3b8" />
                  <input 
                    type="text" 
                    placeholder="Cari nama santri, NIS, kelas..." 
                    value={santriSearch}
                    onChange={(e) => setSantriSearch(e.target.value)}
                  />
                </div>
                <select 
                  className="filter-select"
                  value={santriGenderFilter}
                  onChange={(e) => setSantriGenderFilter(e.target.value)}
                >
                  <option value="Semua">Semua Santri</option>
                  <option value="Ikhwan">Ikhwan (Putra)</option>
                  <option value="Akhwat">Akhwat (Putri)</option>
                </select>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => toggleSelectAllVisible(visibleSantriIds)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                >
                  {isAllVisibleSelected ? <Square size={12} /> : <CheckSquare size={12} />}
                  {isAllVisibleSelected ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>

              {/* LIST SANTRI PICKER */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                {filteredSantriList.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {santriList.length === 0 ? 'Sedang memuat atau belum ada data santri di database.' : 'Tidak ada santri yang cocok dengan filter.'}
                  </div>
                ) : (
                  filteredSantriList.map((santri) => {
                    const isSelected = tempPesertaIds.includes(santri.id);
                    return (
                      <div 
                        key={santri.id}
                        onClick={() => toggleSantriPeserta(santri.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: isSelected ? '#f5f3ff' : '#ffffff',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? '#6b21a8' : '#0f172a' }}>
                              {santri.nama_santri}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              NIS: {santri.nis} • {santri.kelas || 'Santri'} • {santri.nama_asrama || 'Asrama'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`badge ${santri.jk === 'L' ? 'badge-info' : 'badge-purple'}`} style={{ fontSize: '0.68rem' }}>
                            {santri.jk === 'L' ? 'Ikhwan' : 'Akhwat'}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                            {santri.status_santri || 'Mukim'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INFO TERPILIH */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem' }}>
                <span style={{ color: '#475569' }}>
                  Total Terpilih: <strong style={{ color: '#7c3aed' }}>{tempPesertaIds.length} santri</strong>
                </span>
                {tempPesertaIds.length > 0 && (
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={() => setTempPesertaIds([])}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    Kosongkan Pilihan
                  </button>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsPesertaModalOpen(false)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePeserta}>
                <Save size={13} /> Terapkan ke Database ({tempPesertaIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
