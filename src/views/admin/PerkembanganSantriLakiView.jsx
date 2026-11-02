import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Home, 
  Clock, 
  GraduationCap, 
  Building, 
  X, 
  Calendar, 
  Award, 
  Save, 
  CheckCircle2, 
  Printer, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  Settings, 
  FileText, 
  XCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { showConfirm, toastSuccess, showError, showSuccess } from '../../utils/alert.util';

export default function PerkembanganSantriLakiView() {
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'master' | 'rekap'

  // Master Kategori & Items
  const [masterKategori, setMasterKategori] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Filter Bar State
  const [search, setSearch] = useState('');
  const [selectedKategoriId, setSelectedKategoriId] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [tanggalEvaluasi, setTanggalEvaluasi] = useState(new Date().toISOString().slice(0, 10));
  const [kelasList, setKelasList] = useState([]);

  // Data Santri Laki-Laki
  const [santriList, setSantriList] = useState([]);
  const [loadingSantri, setLoadingSantri] = useState(false);
  const [savingEvaluasi, setSavingEvaluasi] = useState(false);

  // Evaluasi Form State per Santri:
  // { [santri_id]: { status_kelulusan: 'Lulus' | 'Tidak Lulus', permasalahan: [...], penyebab: [...], tindakan: [...], catatan_tambahan: '' } }
  const [evaluasiMap, setEvaluasiMap] = useState({});

  // Modal Diagnostik Tidak Lulus
  const [diagnostikSantri, setDiagnostikSantri] = useState(null);
  const [isDiagnostikModalOpen, setIsDiagnostikModalOpen] = useState(false);

  // Master Management State (Edit Master)
  const [selectedMasterKat, setSelectedMasterKat] = useState(null);
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ id: null, tipe: 'permasalahan', teks: '', kode: '' });
  const [isModalKatOpen, setIsModalKatOpen] = useState(false);
  const [katForm, setKatForm] = useState({ id: null, nama_kategori: '', deskripsi: '', gender: 'L' });

  // Rekap Data
  const [rekapList, setRekapList] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  // 1. Fetch Master Kategori Khusus Ikhwan
  const fetchMaster = async () => {
    try {
      setLoadingMaster(true);
      const res = await axios.get('/api/perkembangan-ikhwan/master?gender=L');
      const data = res.data?.data || res.data?.kategori || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(data) && data.length > 0) {
        setMasterKategori(data);
        if (!selectedKategoriId || !data.some(k => String(k.id) === String(selectedKategoriId))) {
          setSelectedKategoriId(String(data[0].id));
          setSelectedMasterKat(data[0]);
        } else if (selectedMasterKat) {
          const updated = data.find(k => k.id === selectedMasterKat.id);
          if (updated) setSelectedMasterKat(updated);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat master perkembangan ikhwan:', err.message);
    } finally {
      setLoadingMaster(false);
    }
  };

  // 2. Fetch Daftar Kelas
  const fetchKelas = async () => {
    try {
      const res = await axios.get('/api/kelas');
      const data = res.data?.data || res.data?.kelas || [];
      if (Array.isArray(data) && data.length > 0) {
        setKelasList(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMaster();
    fetchKelas();
  }, []);

  // 3. Fetch Santri Laki-Laki Berdasarkan Kategori, Kelas & Tanggal
  const fetchSantriEvaluasi = async () => {
    try {
      setLoadingSantri(true);
      const katIdParam = selectedKategoriId || '1';
      const res = await axios.get(`/api/perkembangan-ikhwan/santri-kelas?kategori_id=${katIdParam}&kelas_id=${filterKelas}&tanggal=${tanggalEvaluasi}&gender=L`);
      const list = res.data?.data?.santri || res.data?.santri || (Array.isArray(res.data?.data) ? res.data.data : []);
      setSantriList(list || []);

      const map = {};
      (list || []).forEach(s => {
        map[s.santri_id] = {
          status_kelulusan: s.status_kelulusan || 'Lulus',
          permasalahan: s.permasalahan_list || [],
          penyebab: s.penyebab_list || [],
          tindakan: s.tindakan_list || [],
          catatan_tambahan: s.catatan_tambahan || ''
        };
      });
      setEvaluasiMap(map);
    } catch (err) {
      console.warn('Gagal memuat santri ikhwan:', err.message);
    } finally {
      setLoadingSantri(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'input') {
      fetchSantriEvaluasi();
    }
  }, [selectedKategoriId, filterKelas, tanggalEvaluasi, activeTab]);

  // 4. Fetch Rekap Data
  const fetchRekap = async () => {
    try {
      setLoadingRekap(true);
      const res = await axios.get(`/api/perkembangan-ikhwan/rekap?kategori_id=${selectedKategoriId || 'Semua'}&status=${filterStatus === 'Semua Status' ? 'Semua' : filterStatus}&search=${encodeURIComponent(search)}&gender=L`);
      const list = res.data?.data || res.data?.rekap || (Array.isArray(res.data) ? res.data : []);
      setRekapList(list || []);
    } catch (err) {
      console.warn('Gagal memuat rekap evaluasi:', err.message);
    } finally {
      setLoadingRekap(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rekap') {
      fetchRekap();
    }
  }, [selectedKategoriId, filterStatus, activeTab]);

  // Status Kelulusan Toggle
  const handleStatusChange = (santriId, newStatus, santriObj = null) => {
    setEvaluasiMap(prev => ({
      ...prev,
      [santriId]: {
        ...(prev[santriId] || { permasalahan: [], penyebab: [], tindakan: [], catatan_tambahan: '' }),
        status_kelulusan: newStatus
      }
    }));

    if (newStatus === 'Tidak Lulus' && santriObj) {
      setDiagnostikSantri(santriObj);
      setIsDiagnostikModalOpen(true);
    }
  };

  const handleOpenDiagnostik = (santriObj) => {
    setDiagnostikSantri(santriObj);
    setIsDiagnostikModalOpen(true);
  };

  // Toggle Checklist Item (Permasalahan, Penyebab, Tindakan)
  const handleToggleCheck = (santriId, tipe, teks) => {
    setEvaluasiMap(prev => {
      const currentArr = prev[santriId]?.[tipe] || [];
      const exists = currentArr.includes(teks);
      const updated = exists 
        ? currentArr.filter(t => t !== teks)
        : [...currentArr, teks];

      return {
        ...prev,
        [santriId]: {
          ...prev[santriId],
          [tipe]: updated
        }
      };
    });
  };

  // Set Semua Lulus
  const handleSetSemuaLulus = () => {
    setEvaluasiMap(prev => {
      const next = { ...prev };
      santriList.forEach(s => {
        next[s.santri_id] = {
          ...next[s.santri_id],
          status_kelulusan: 'Lulus'
        };
      });
      return next;
    });
    toastSuccess('Diperbarui', 'Semua santri diatur ke status Lulus.');
  };

  // Simpan Batch Evaluasi
  const handleSimpanEvaluasi = async () => {
    if (!selectedKategoriId || santriList.length === 0) {
      showError('Gagal', 'Tidak ada data santri untuk disimpan.');
      return;
    }

    try {
      setSavingEvaluasi(true);
      const payload = {
        kategori_id: parseInt(selectedKategoriId),
        kelas_id: filterKelas,
        tanggal: tanggalEvaluasi,
        evaluasi: santriList.map(s => {
          const evalData = evaluasiMap[s.santri_id] || { status_kelulusan: 'Lulus' };
          return {
            santri_id: s.santri_id,
            status_kelulusan: evalData.status_kelulusan,
            permasalahan: evalData.status_kelulusan === 'Tidak Lulus' ? evalData.permasalahan : [],
            penyebab: evalData.status_kelulusan === 'Tidak Lulus' ? evalData.penyebab : [],
            tindakan: evalData.status_kelulusan === 'Tidak Lulus' ? evalData.tindakan : [],
            catatan_tambahan: evalData.catatan_tambahan || ''
          };
        })
      };

      const res = await axios.post('/api/perkembangan-ikhwan/evaluasi-batch', payload);
      if (res.data?.success) {
        showSuccess('Berhasil!', `Evaluasi perkembangan ${santriList.length} santri ikhwan berhasil disimpan.`);
        fetchSantriEvaluasi();
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setSavingEvaluasi(false);
    }
  };

  // MASTER: Item Create/Update
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.teks.trim()) {
      showError('Validasi Gagal', 'Teks item wajib diisi');
      return;
    }

    try {
      if (itemForm.id) {
        await axios.put(`/api/perkembangan-ikhwan/item/${itemForm.id}`, { teks: itemForm.teks, kode: itemForm.kode });
        toastSuccess('Berhasil', 'Item master berhasil diperbarui');
      } else {
        await axios.post('/api/perkembangan-ikhwan/item', {
          kategori_id: selectedMasterKat.id,
          tipe: itemForm.tipe,
          teks: itemForm.teks,
          kode: itemForm.kode
        });
        toastSuccess('Berhasil', 'Item master berhasil ditambahkan');
      }
      setIsModalItemOpen(false);
      fetchMaster();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteItem = (id) => {
    showConfirm('Hapus Item?', 'Apakah Anda yakin ingin menghapus item master ini?', async () => {
      try {
        await axios.delete(`/api/perkembangan-ikhwan/item/${id}`);
        toastSuccess('Berhasil', 'Item berhasil dihapus');
        fetchMaster();
      } catch (e) {
        showError('Gagal', e.message);
      }
    });
  };

  // MASTER: Kategori Create/Update
  const handleSaveKategori = async (e) => {
    e.preventDefault();
    if (!katForm.nama_kategori.trim()) {
      showError('Validasi Gagal', 'Nama kategori wajib diisi');
      return;
    }
    try {
      const payload = { ...katForm, gender: 'L' };
      if (katForm.id) {
        await axios.put(`/api/perkembangan-ikhwan/kategori/${katForm.id}`, payload);
        toastSuccess('Berhasil', 'Kategori berhasil diperbarui');
      } else {
        await axios.post('/api/perkembangan-ikhwan/kategori', payload);
        toastSuccess('Berhasil', 'Kategori baru berhasil ditambahkan');
      }
      setIsModalKatOpen(false);
      fetchMaster();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteKategori = (id) => {
    showConfirm('Hapus Kategori?', 'Menghapus kategori akan menghapus seluruh butir permasalahan, penyebab, dan tindakan di dalamnya. Lanjutkan?', async () => {
      try {
        await axios.delete(`/api/perkembangan-ikhwan/kategori/${id}`);
        toastSuccess('Berhasil', 'Kategori berhasil dihapus');
        fetchMaster();
      } catch (e) {
        showError('Gagal', e.message);
      }
    });
  };

  const activeKategoriObj = masterKategori.find(k => String(k.id) === String(selectedKategoriId)) || masterKategori[0];

  // Hitung Metrik Ringkas
  const countTotal = santriList.length;
  const countLulus = Object.values(evaluasiMap).filter(e => e.status_kelulusan === 'Lulus').length;
  const countTidakLulus = Object.values(evaluasiMap).filter(e => e.status_kelulusan === 'Tidak Lulus').length;
  const countKategori = masterKategori.length;

  // Search Filter Local
  const filteredSantri = santriList.filter(s => {
    const matchSearch = s.nama_santri?.toLowerCase().includes(search.toLowerCase()) || 
                        s.nis?.toLowerCase().includes(search.toLowerCase()) ||
                        s.nama_asrama?.toLowerCase().includes(search.toLowerCase());
    const evalState = evaluasiMap[s.santri_id] || { status_kelulusan: 'Lulus' };
    const matchStatus = filterStatus === 'Semua' || evalState.status_kelulusan === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* 1. TOP STATS CARDS (Persis Seperti Data Santri) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI IKHWAN</div>
            <div className="stat-colored-number">{countTotal}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">LULUS / TUNTAS</div>
            <div className="stat-colored-number">{countLulus}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">PERLU PEMBINAAN</div>
            <div className="stat-colored-number">{countTidakLulus}</div>
          </div>
          <div className="stat-colored-icon-box">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">KATEGORI EVALUASI</div>
            <div className="stat-colored-number">{countKategori}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP (Persis Seperti Data Santri) */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Pengembangan Santri (Ikhwan)</h2>
            <p>Diagnostik berkala santri putra: Lulus vs Tidak Lulus (Permasalahan, Penyebab & Tindakan Solusi Asatidz)</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={() => { fetchMaster(); fetchSantriEvaluasi(); }}
          >
            <RotateCw size={13} /> Refresh
          </button>
          {activeTab === 'input' && (
            <>
              <button 
                type="button"
                className="btn" 
                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                onClick={handleSetSemuaLulus}
                title="Atur Semua Santri Lulus"
              >
                <Check size={14} /> Atur Semua Lulus
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleSimpanEvaluasi}
                disabled={savingEvaluasi || santriList.length === 0}
              >
                <Save size={14} /> {savingEvaluasi ? 'Menyimpan...' : 'Simpan Evaluasi Santri'}
              </button>
            </>
          )}
          {activeTab === 'master' && (
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => { setKatForm({ id: null, nama_kategori: '', deskripsi: '', gender: 'L' }); setIsModalKatOpen(true); }}
            >
              <Plus size={14} /> Tambah Kategori Baru
            </button>
          )}
          {activeTab === 'rekap' && (
            <button 
              type="button"
              className="btn btn-outline" 
              onClick={() => window.print()}
            >
              <Printer size={14} /> Cetak Rekap Evaluasi
            </button>
          )}
        </div>
      </div>

      {/* 3. TAB FILTER BAR (Persis Seperti Data Santri) */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          <Edit3 size={14} /> Input Evaluasi Santri ({countTotal})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'master' ? 'active' : ''}`}
          onClick={() => setActiveTab('master')}
        >
          <Settings size={14} /> Master Kustomisasi ({countKategori} Kategori)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rekap' ? 'active' : ''}`}
          onClick={() => setActiveTab('rekap')}
        >
          <FileText size={14} /> Rekap & Riwayat Evaluasi
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP (Persis Seperti Data Santri) */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, asrama..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Pilih Kategori */}
        <select 
          className="filter-select"
          value={selectedKategoriId}
          onChange={(e) => setSelectedKategoriId(e.target.value)}
          style={{ fontWeight: 700, color: '#0284c7', minWidth: '200px' }}
        >
          {masterKategori.length === 0 && <option value="">(Memuat Kategori...)</option>}
          {masterKategori.map(kat => (
            <option key={kat.id} value={kat.id}>{kat.nama_kategori}</option>
          ))}
        </select>

        {/* Pilih Kelas */}
        <select 
          className="filter-select"
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
        >
          <option value="Semua">Semua Kelas</option>
          {kelasList.map(k => (
            <option key={k.id} value={k.nama_kelas || k.id}>{k.nama_kelas} ({k.tingkat || 'Kelas'})</option>
          ))}
        </select>

        {/* Filter Status */}
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Semua">Semua Status</option>
          <option value="Lulus">Lulus</option>
          <option value="Tidak Lulus">Tidak Lulus</option>
        </select>

        {/* Tanggal Evaluasi */}
        <input 
          type="date"
          className="filter-select"
          value={tanggalEvaluasi}
          onChange={(e) => setTanggalEvaluasi(e.target.value)}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* ========================================================= */}
      {/* 5. TAB 1: INPUT DATA EVALUASI TABLE                      */}
      {/* ========================================================= */}
      {activeTab === 'input' && (
        <div className="table-container-card">
          {loadingSantri ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              <RotateCw size={24} className="spin" /> Memuat data evaluasi santri ikhwan...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th style={{ width: '220px' }}>NAMA SANTRI & NIS</th>
                  <th style={{ width: '180px' }}>ASRAMA & KOBONG</th>
                  <th className="td-center" style={{ width: '190px' }}>STATUS KELULUSAN</th>
                  <th>DIAGNOSTIK KENDALA & TINDAKAN ASATIDZ</th>
                </tr>
              </thead>
              <tbody>
                {filteredSantri.map((row, idx) => {
                  const evalState = evaluasiMap[row.santri_id] || { status_kelulusan: 'Lulus', permasalahan: [], penyebab: [], tindakan: [] };
                  const isTidakLulus = evalState.status_kelulusan === 'Tidak Lulus';

                  return (
                    <tr key={row.santri_id || idx} style={{ background: isTidakLulus ? '#fffbfb' : '#ffffff' }}>
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {row.nis}</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                          <Building size={13} color="#059669" />
                          <span>{row.nama_asrama || 'Asrama Ikhwan'}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {row.nama_kamar || 'Kobong 01'}
                        </div>
                      </td>

                      <td className="td-center">
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.santri_id, 'Lulus')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: evalState.status_kelulusan === 'Lulus' ? '2px solid #059669' : '1px solid #cbd5e1',
                              background: evalState.status_kelulusan === 'Lulus' ? '#10b981' : '#ffffff',
                              color: evalState.status_kelulusan === 'Lulus' ? '#ffffff' : '#64748b',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} /> LULUS
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(row.santri_id, 'Tidak Lulus', row)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: evalState.status_kelulusan === 'Tidak Lulus' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                              background: evalState.status_kelulusan === 'Tidak Lulus' ? '#ef4444' : '#ffffff',
                              color: evalState.status_kelulusan === 'Tidak Lulus' ? '#ffffff' : '#64748b',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={12} /> TIDAK LULUS
                          </button>
                        </div>
                      </td>

                      <td>
                        {!isTidakLulus ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-success">✓ Memenuhi Standar Kelulusan</span>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              Tidak ditemukan catatan kendala pada kategori ini.
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span className="badge badge-danger" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Perlu Pembinaan ({(evalState.permasalahan?.length || 0)} Masalah)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenDiagnostik(row)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #f87171',
                                background: '#ffffff',
                                color: '#b91c1c',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Edit3 size={11} /> Isi / Ubah Catatan Kendala
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSantri.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada data santri ikhwan yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAB 2: MASTER KUSTOMISASI KATEGORI                    */}
      {/* ========================================================= */}
      {activeTab === 'master' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>
          {/* Kolom Kiri: List Kategori */}
          <div className="card">
            <div className="card-header">
              <h3>Daftar Kategori Ikhwan</h3>
              <button 
                className="btn btn-primary"
                onClick={() => { setKatForm({ id: null, nama_kategori: '', deskripsi: '', gender: 'L' }); setIsModalKatOpen(true); }}
              >
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {masterKategori.map(kat => (
                <div
                  key={kat.id}
                  onClick={() => setSelectedMasterKat(kat)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: selectedMasterKat?.id === kat.id ? '#e0f2fe' : '#f8fafc',
                    border: selectedMasterKat?.id === kat.id ? '1px solid #0284c7' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedMasterKat?.id === kat.id ? '#0369a1' : '#0f172a' }}>
                      {kat.nama_kategori}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {(kat.permasalahan?.length || 0)} P • {(kat.penyebab?.length || 0)} F • {(kat.tindakan?.length || 0)} T
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn-action btn-action-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKatForm({ id: kat.id, nama_kategori: kat.nama_kategori, deskripsi: kat.deskripsi || '', gender: 'L' });
                        setIsModalKatOpen(true);
                      }}
                      title="Edit Kategori"
                    >
                      <Edit3 size={11} />
                    </button>
                    <button
                      className="btn-action btn-action-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKategori(kat.id);
                      }}
                      title="Hapus Kategori"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Rincian P, F, T Kategori Terpilih */}
          {selectedMasterKat && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedMasterKat.nama_kategori}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Kelola opsi butir permasalahan, penyebab, dan tindakan solusi asatidz
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {/* 1. Permasalahan */}
                <div className="card">
                  <div className="card-header">
                    <h3 style={{ color: '#b91c1c' }}>(A.) Permasalahan ({selectedMasterKat.permasalahan?.length || 0})</h3>
                    <button 
                      className="btn" 
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      onClick={() => { setItemForm({ id: null, tipe: 'permasalahan', teks: '', kode: '' }); setIsModalItemOpen(true); }}
                    >
                      <Plus size={11} /> Tambah
                    </button>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                    {(selectedMasterKat.permasalahan || []).map((it, idx) => (
                      <div key={it.id} style={{ background: '#f8fafc', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.35 }}>
                          <strong>{it.kode || String.fromCharCode(97 + idx)}.</strong> {it.teks}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-action btn-action-edit" onClick={() => { setItemForm({ id: it.id, tipe: 'permasalahan', teks: it.teks, kode: it.kode }); setIsModalItemOpen(true); }}><Edit3 size={11} /></button>
                          <button className="btn-action btn-action-delete" onClick={() => handleDeleteItem(it.id)}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Penyebab */}
                <div className="card">
                  <div className="card-header">
                    <h3 style={{ color: '#c2410c' }}>(B.) Penyebab ({selectedMasterKat.penyebab?.length || 0})</h3>
                    <button 
                      className="btn" 
                      style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' }}
                      onClick={() => { setItemForm({ id: null, tipe: 'penyebab', teks: '', kode: '' }); setIsModalItemOpen(true); }}
                    >
                      <Plus size={11} /> Tambah
                    </button>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                    {(selectedMasterKat.penyebab || []).map((it, idx) => (
                      <div key={it.id} style={{ background: '#f8fafc', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.35 }}>
                          <strong>{it.kode || String.fromCharCode(97 + idx)}.</strong> {it.teks}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-action btn-action-edit" onClick={() => { setItemForm({ id: it.id, tipe: 'penyebab', teks: it.teks, kode: it.kode }); setIsModalItemOpen(true); }}><Edit3 size={11} /></button>
                          <button className="btn-action btn-action-delete" onClick={() => handleDeleteItem(it.id)}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Tindakan */}
                <div className="card">
                  <div className="card-header">
                    <h3 style={{ color: '#047857' }}>(C.) Tindakan / Solusi ({selectedMasterKat.tindakan?.length || 0})</h3>
                    <button 
                      className="btn" 
                      style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                      onClick={() => { setItemForm({ id: null, tipe: 'tindakan', teks: '', kode: '' }); setIsModalItemOpen(true); }}
                    >
                      <Plus size={11} /> Tambah
                    </button>
                  </div>
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                    {(selectedMasterKat.tindakan || []).map((it, idx) => (
                      <div key={it.id} style={{ background: '#f8fafc', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div style={{ fontSize: '0.74rem', color: '#334155', lineHeight: 1.35 }}>
                          <strong>{it.kode || String.fromCharCode(97 + idx)}.</strong> {it.teks}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-action btn-action-edit" onClick={() => { setItemForm({ id: it.id, tipe: 'tindakan', teks: it.teks, kode: it.kode }); setIsModalItemOpen(true); }}><Edit3 size={11} /></button>
                          <button className="btn-action btn-action-delete" onClick={() => handleDeleteItem(it.id)}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. TAB 3: REKAP EVALUASI TABLE                           */}
      {/* ========================================================= */}
      {activeTab === 'rekap' && (
        <div className="table-container-card">
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th style={{ width: '90px' }}>TANGGAL</th>
                <th>NAMA SANTRI & NIS</th>
                <th>KATEGORI</th>
                <th className="td-center" style={{ width: '120px' }}>STATUS</th>
                <th>PERMASALAHAN</th>
                <th>PENYEBAB</th>
                <th>TINDAKAN / SOLUSI</th>
              </tr>
            </thead>
            <tbody>
              {rekapList.map((r, idx) => (
                <tr key={r.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    {new Date(r.tanggal).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>NIS: {r.nis}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#0284c7' }}>
                    {r.nama_kategori}
                  </td>
                  <td className="td-center">
                    <span className={`badge ${r.status_kelulusan === 'Lulus' ? 'badge-success' : 'badge-danger'}`}>
                      {r.status_kelulusan}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.74rem', color: '#b91c1c' }}>
                    {r.permasalahan_list?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '14px' }}>
                        {r.permasalahan_list.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: '0.74rem', color: '#c2410c' }}>
                    {r.penyebab_list?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '14px' }}>
                        {r.penyebab_list.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: '0.74rem', color: '#047857' }}>
                    {r.tindakan_list?.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '14px' }}>
                        {r.tindakan_list.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {rekapList.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada riwayat rekap evaluasi santri ikhwan yang tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT ITEM MASTER                          */}
      {/* ========================================================= */}
      {isModalItemOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '460px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '12px 16px', background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0 }}>
                {itemForm.id ? 'Edit Butir Item' : `Tambah ${itemForm.tipe.toUpperCase()}`}
              </h3>
              <button onClick={() => setIsModalItemOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveItem} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Tipe Butir *</label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={itemForm.tipe}
                  onChange={(e) => setItemForm({ ...itemForm, tipe: e.target.value })}
                >
                  <option value="permasalahan">Permasalahan</option>
                  <option value="penyebab">Penyebab</option>
                  <option value="tindakan">Tindakan / Solusi</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Deskripsi Butir *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tulis deskripsi kendala / tindakan..."
                  value={itemForm.teks}
                  onChange={(e) => setItemForm({ ...itemForm, teks: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalItemOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TAMBAH / EDIT KATEGORI                             */}
      {/* ========================================================= */}
      {isModalKatOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '440px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '12px 16px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0 }}>
                {katForm.id ? 'Edit Kategori Ikhwan' : 'Tambah Kategori Ikhwan'}
              </h3>
              <button onClick={() => setIsModalKatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveKategori} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Nama Kategori *</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Praktik Ibadah, Baca Qur'an..."
                  value={katForm.nama_kategori}
                  onChange={(e) => setKatForm({ ...katForm, nama_kategori: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi kategori..."
                  value={katForm.deskripsi}
                  onChange={(e) => setKatForm({ ...katForm, deskripsi: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.78rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalKatOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Kategori</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DIAGNOSTIK KENDALA SANTRI (TIDAK LULUS)            */}
      {/* ========================================================= */}
      {isDiagnostikModalOpen && diagnostikSantri && (() => {
        const modalEvalState = evaluasiMap[diagnostikSantri.santri_id] || { permasalahan: [], penyebab: [], tindakan: [], catatan_tambahan: '' };
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', width: '100%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', background: '#fff1f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#991b1b' }}>
                      Catatan Kendala: {diagnostikSantri.nama_santri}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.73rem', color: '#64748b' }}>
                      NIS: <strong>{diagnostikSantri.nis}</strong> • {diagnostikSantri.nama_asrama || 'Asrama'} ({diagnostikSantri.nama_kamar || 'Kobong'}) • Kategori: <strong style={{ color: '#0284c7' }}>{activeKategoriObj?.nama_kategori}</strong>
                    </p>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setIsDiagnostikModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* (A.) PERMASALAHAN */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b91c1c', marginBottom: '6px' }}>
                    (A.) Butir Permasalahan ({activeKategoriObj?.nama_kategori}):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '6px' }}>
                    {(activeKategoriObj?.permasalahan || []).map((p, pIdx) => {
                      const isChecked = (modalEvalState.permasalahan || []).includes(p.teks);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: isChecked ? '#fee2e2' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid #f87171' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            color: isChecked ? '#991b1b' : '#334155',
                            lineHeight: 1.4
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCheck(diagnostikSantri.santri_id, 'permasalahan', p.teks)}
                            style={{ accentColor: '#dc2626', marginTop: '2px' }}
                          />
                          <span><strong>{p.kode || String.fromCharCode(97 + pIdx)}.</strong> {p.teks}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* (B.) PENYEBAB */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c2410c', marginBottom: '6px' }}>
                    (B.) Faktor Penyebab / Kendala:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '6px' }}>
                    {(activeKategoriObj?.penyebab || []).map((c, cIdx) => {
                      const isChecked = (modalEvalState.penyebab || []).includes(c.teks);
                      return (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: isChecked ? '#ffedd5' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid #fb923c' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            color: isChecked ? '#9a3412' : '#334155',
                            lineHeight: 1.4
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCheck(diagnostikSantri.santri_id, 'penyebab', c.teks)}
                            style={{ accentColor: '#ea580c', marginTop: '2px' }}
                          />
                          <span><strong>{c.kode || String.fromCharCode(97 + cIdx)}.</strong> {c.teks}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* (C.) TINDAKAN / SOLUSI */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857', marginBottom: '6px' }}>
                    (C.) Tindakan / Solusi Pengajar:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '6px' }}>
                    {(activeKategoriObj?.tindakan || []).map((t, tIdx) => {
                      const isChecked = (modalEvalState.tindakan || []).includes(t.teks);
                      return (
                        <label
                          key={t.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: isChecked ? '#d1fae5' : '#ffffff',
                            padding: '7px 10px',
                            borderRadius: '6px',
                            border: isChecked ? '1px solid #34d399' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                            color: isChecked ? '#065f46' : '#334155',
                            lineHeight: 1.4
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCheck(diagnostikSantri.santri_id, 'tindakan', t.teks)}
                            style={{ accentColor: '#059669', marginTop: '2px' }}
                          />
                          <span><strong>{t.kode || String.fromCharCode(97 + tIdx)}.</strong> {t.teks}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Catatan Tambahan */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '4px' }}>
                    Catatan Tambahan Khusus Asatidz:
                  </div>
                  <textarea 
                    rows={2}
                    placeholder="Tuliskan catatan khusus perkembangan santri ini..."
                    value={modalEvalState.catatan_tambahan || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEvaluasiMap(prev => ({
                        ...prev,
                        [diagnostikSantri.santri_id]: {
                          ...prev[diagnostikSantri.santri_id],
                          catatan_tambahan: v
                        }
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.76rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(diagnostikSantri.santri_id, 'Lulus');
                    setIsDiagnostikModalOpen(false);
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Ubah Jadi Lulus
                </button>

                <button
                  type="button"
                  onClick={() => setIsDiagnostikModalOpen(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  <Check size={14} /> Selesai & Simpan Catatan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
