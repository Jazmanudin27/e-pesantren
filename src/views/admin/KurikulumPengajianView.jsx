import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  RotateCw,
  Search,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Users,
  Building,
  GraduationCap,
  Sparkles,
  Layers,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const TINGKAT_KELAS_OPTIONS = [
  { value: '1', label: 'KELAS 1', sublabel: 'Tingkat Awwaliyah / Dasar 1' },
  { value: '2', label: 'KELAS 2', sublabel: 'Tingkat Awwaliyah / Dasar 2' },
  { value: '3', label: 'KELAS 3', sublabel: 'Tingkat Wustho / Menengah 1' },
  { value: '4', label: 'KELAS 4', sublabel: 'Tingkat Wustho / Menengah 2' },
  { value: '5', label: 'KELAS 5', sublabel: 'Tingkat Ulya / Atas 1' },
  { value: '6', label: 'KELAS 6', sublabel: 'Tingkat Ulya / Atas 2' }
];

export default function KurikulumPengajianView() {
  const [activeTab, setActiveTab] = useState('matriks'); // 'matriks' | 'jadwal'
  const [loading, setLoading] = useState(false);

  // Data Matriks Kurikulum 1-6
  const [matrixData, setMatrixData] = useState([]);
  const [editingMatrix, setEditingMatrix] = useState(false);
  const [tempMatrix, setTempMatrix] = useState([]);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [masterKegiatanList, setMasterKegiatanList] = useState([]);

  // Data Jadwal Mengajar Asatidz
  const [jadwalList, setJadwalList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [filterTingkat, setFilterTingkat] = useState('semua');
  const [filterHari, setFilterHari] = useState('semua');
  const [filterAsatidz, setFilterAsatidz] = useState('semua');
  const [searchJadwal, setSearchJadwal] = useState('');

  // Modal Jadwal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [submittingJadwal, setSubmittingJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({
    id: null,
    tingkat_kelas: '1',
    asatidz_id: '',
    nama_asatidz: '',
    nama_kitab: '',
    hari: 'Senin',
    jam_mulai: '07:30',
    jam_selesai: '09:00',
    ruang: 'Masjid Utama / Kelas',
    keterangan: ''
  });

  // Fetch Matriks
  const fetchMatriks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/kurikulum/matriks');
      if (res.data?.success && res.data.data?.matrix) {
        setMatrixData(res.data.data.matrix);
        setTempMatrix(JSON.parse(JSON.stringify(res.data.data.matrix)));
      }
    } catch (err) {
      console.warn('Gagal fetch matriks kurikulum:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Jadwal
  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/kurikulum/jadwal');
      if (res.data?.success && res.data.data) {
        setJadwalList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch jadwal mengajar:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Asatidz untuk dropdown jadwal
  const fetchAsatidz = async () => {
    try {
      const res = await axios.get('/api/asatidz');
      if (res.data?.success && res.data.data) {
        setAsatidzList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch asatidz:', err.message);
    }
  };

  // Fetch Master Kegiatan & Kitab
  const fetchMasterKegiatan = async () => {
    try {
      const res = await axios.get('/api/materi-hafalan');
      if (res.data?.success && res.data.data) {
        setMasterKegiatanList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch master kegiatan:', err.message);
    }
  };

  useEffect(() => {
    fetchMatriks();
    fetchJadwal();
    fetchAsatidz();
    fetchMasterKegiatan();
  }, []);

  // Simpan Perubahan Matriks
  const handleSaveMatrix = async () => {
    try {
      setSavingMatrix(true);
      await axios.post('/api/kurikulum/matriks', { matrix: tempMatrix });
      toastSuccess('Berhasil!', 'Matriks kurikulum pengajian tersimpan');
      setMatrixData(tempMatrix);
      setEditingMatrix(false);
    } catch (err) {
      showError('Gagal Simpan', err.response?.data?.message || err.message);
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleCellChange = (rowIndex, colKey, val) => {
    const updated = [...tempMatrix];
    updated[rowIndex][colKey] = val;
    setTempMatrix(updated);
  };

  // Tambah Baris Kegiatan ke Bawah
  const handleAddRow = () => {
    const nextNo = tempMatrix.length + 1;
    const newRow = {
      no: nextNo,
      k1: '',
      k2: '',
      k3: '',
      k4: '',
      k5: '',
      k6: ''
    };
    setTempMatrix([...tempMatrix, newRow]);
  };

  // Hapus Baris Terbawah (Opsional)
  const handleRemoveRow = (indexToRemove) => {
    if (tempMatrix.length <= 1) return;
    const filtered = tempMatrix.filter((_, idx) => idx !== indexToRemove).map((r, i) => ({
      ...r,
      no: i + 1
    }));
    setTempMatrix(filtered);
  };

  // Form Modal Handler
  const openAddJadwal = () => {
    setFormMode('add');
    setFormJadwal({
      id: null,
      tingkat_kelas: filterTingkat !== 'semua' ? filterTingkat : '1',
      asatidz_id: '',
      nama_asatidz: '',
      nama_kitab: '',
      hari: filterHari !== 'semua' ? filterHari : 'Senin',
      jam_mulai: '07:30',
      jam_selesai: '09:00',
      ruang: 'Masjid Utama / Kelas',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const openEditJadwal = (item) => {
    setFormMode('edit');
    setFormJadwal({
      id: item.id,
      tingkat_kelas: String(item.tingkat_kelas || 1),
      asatidz_id: item.asatidz_id ? String(item.asatidz_id) : '',
      nama_asatidz: item.nama_asatidz || '',
      nama_kitab: item.nama_kitab || '',
      hari: item.hari || 'Senin',
      jam_mulai: item.jam_mulai || '07:30',
      jam_selesai: item.jam_selesai || '09:00',
      ruang: item.ruang || 'Masjid Utama / Kelas',
      keterangan: item.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveJadwal = async (e) => {
    e.preventDefault();
    if (!formJadwal.nama_kitab || !formJadwal.hari || !formJadwal.tingkat_kelas) {
      showError('Validasi Gagal', 'Tingkat Kelas, Nama Kitab / Pelajaran, dan Hari wajib diisi');
      return;
    }

    try {
      setSubmittingJadwal(true);
      if (formMode === 'add') {
        await axios.post('/api/kurikulum/jadwal', formJadwal);
        toastSuccess('Berhasil!', 'Jadwal mengajar berhasil ditambahkan');
      } else {
        await axios.put(`/api/kurikulum/jadwal/${formJadwal.id}`, formJadwal);
        toastSuccess('Berhasil!', 'Jadwal mengajar berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchJadwal();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmittingJadwal(false);
    }
  };

  const handleDeleteJadwal = (item) => {
    showConfirm(
      'Hapus Jadwal Mengajar?',
      `Hapus jadwal kitab "${item.nama_kitab}" (Kelas ${item.tingkat_kelas} - ${item.hari})?`,
      async () => {
        try {
          await axios.delete(`/api/kurikulum/jadwal/${item.id}`);
          toastSuccess('Dihapus', 'Jadwal berhasil dihapus');
          fetchJadwal();
        } catch (err) {
          showError('Gagal Hapus', err.message);
        }
      }
    );
  };

  // Filter Jadwal
  const filteredJadwal = jadwalList.filter((j) => {
    if (filterTingkat !== 'semua' && String(j.tingkat_kelas) !== String(filterTingkat)) return false;
    if (filterHari !== 'semua' && j.hari !== filterHari) return false;
    if (filterAsatidz !== 'semua' && String(j.asatidz_id) !== String(filterAsatidz)) return false;
    if (searchJadwal) {
      const q = searchJadwal.toLowerCase();
      const matchKitab = (j.nama_kitab || '').toLowerCase().includes(q);
      const matchGuru = (j.nama_asatidz || '').toLowerCase().includes(q);
      const matchRuang = (j.ruang || '').toLowerCase().includes(q);
      if (!matchKitab && !matchGuru && !matchRuang) return false;
    }
    return true;
  });

  // Daftar Pilihan Kegiatan / Kitab (Gabungan Master Kegiatan 39 + Nilai Eksisting)
  const allMasterOptions = Array.from(
    new Set([
      ...masterKegiatanList.map((m) => m.nama_materi),
      ...matrixData.flatMap((r) => [r.k1, r.k2, r.k3, r.k4, r.k5, r.k6]).filter(Boolean)
    ])
  ).sort().map((k) => ({ value: k, label: k }));

  // Kitab spesifik untuk tingkat kelas yang dipilih di form
  const classSpecificKitab = matrixData
    .map((r) => r[`k${formJadwal.tingkat_kelas}`])
    .filter(Boolean)
    .map((k) => ({ value: k, label: k, sublabel: `Kurikulum Resmi Kelas ${formJadwal.tingkat_kelas}` }));

  return (
    <div>
      {/* 1. TOP STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL TINGKAT KELAS</div>
            <div className="stat-colored-number">6 Kelas</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">MAPEL / KITAB PENGAJIAN</div>
            <div className="stat-colored-number">{allMasterOptions.length} Kitab</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">JADWAL MENGAJAR AKTIF</div>
            <div className="stat-colored-number">{jadwalList.length} Sesi</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TOTAL ASATIDZ PENGAJAR</div>
            <div className="stat-colored-number">{asatidzList.length} Guru</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Kurikulum Pengajian & Jadwal Mengajar</h2>
            <p>Jadwal dan Daftar Kitab / Mata Pelajaran Pondok Pesantren per Kelas 1 s/d Kelas 6</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              fetchMatriks();
              fetchJadwal();
            }}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {activeTab === 'matriks' ? (
            editingMatrix ? (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setTempMatrix(JSON.parse(JSON.stringify(matrixData)));
                    setEditingMatrix(false);
                  }}
                  disabled={savingMatrix}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveMatrix}
                  disabled={savingMatrix}
                  style={{ background: '#059669', borderColor: '#059669' }}
                >
                  <Save size={14} /> {savingMatrix ? 'Menyimpan...' : 'Simpan Kurikulum'}
                </button>
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setEditingMatrix(true)}
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                <Edit3 size={14} /> Edit Kurikulum Matriks
              </button>
            )
          ) : (
            <button
              className="btn btn-primary"
              onClick={openAddJadwal}
              style={{ background: '#059669', borderColor: '#059669' }}
            >
              <Plus size={14} /> Tambah Jadwal Mengajar
            </button>
          )}
        </div>
      </div>

      {/* 3. TAB FILTER BAR (MATRIKS vs JADWAL MENGAJAR) */}
      <div className="tab-filter-bar">
        <button
          className={`tab-btn ${activeTab === 'matriks' ? 'active' : ''}`}
          onClick={() => setActiveTab('matriks')}
        >
          <FileSpreadsheet size={14} /> Matriks Kurikulum (Kelas 1 - 6)
        </button>
        <button
          className={`tab-btn ${activeTab === 'jadwal' ? 'active' : ''}`}
          onClick={() => setActiveTab('jadwal')}
        >
          <Calendar size={14} /> Jadwal Mengajar Asatidz ({jadwalList.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MATRIKS KURIKULUM PENGAJIAN (PERSIS FORMAT GAMBAR USER)
      ========================================================================= */}
      {activeTab === 'matriks' && (
        <div className="table-container-card" style={{ overflow: 'hidden' }}>
          {/* Header Banner Hijau Gelap Sesuai Gambar User */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e4620 0%, #2e6930 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 900,
                letterSpacing: '1.5px',
                textTransform: 'uppercase'
              }}
            >
              KURIKULUM PENGAJIAN
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.82rem',
                fontStyle: 'italic',
                color: '#dcfce7'
              }}
            >
              Jadwal dan Daftar Kitab / Mata Pelajaran Pondok Pesantren
            </p>
          </div>

          {editingMatrix && (
            <div
              style={{
                padding: '10px 16px',
                background: '#fef3c7',
                borderBottom: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>
                  <strong>Mode Edit:</strong> Pilih kegiatan/kitab via <strong>Select Option</strong> pada tiap kelas. Tambah baris baru menggunakan tombol <strong>"+ Tambah Kegiatan Ke Bawah"</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="btn btn-sm"
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Tambah Kegiatan Ke Bawah (Baris {tempMatrix.length + 1})
              </button>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: '#2e6930', color: '#ffffff' }}>
                  <th
                    style={{
                      width: '45px',
                      textAlign: 'center',
                      background: '#1e4620',
                      color: '#ffffff',
                      fontWeight: 800,
                      border: '1px solid #4a844d'
                    }}
                  >
                    No
                  </th>
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <th
                      key={k}
                      style={{
                        textAlign: 'center',
                        background: '#245626',
                        color: '#ffffff',
                        fontWeight: 800,
                        border: '1px solid #4a844d',
                        minWidth: '150px'
                      }}
                    >
                      KELAS {k}
                    </th>
                  ))}
                  {editingMatrix && (
                    <th
                      style={{
                        width: '45px',
                        textAlign: 'center',
                        background: '#1e4620',
                        color: '#ffffff',
                        fontWeight: 800,
                        border: '1px solid #4a844d'
                      }}
                    >
                      AKSI
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(editingMatrix ? tempMatrix : matrixData).map((row, idx) => (
                  <tr
                    key={row.no || idx}
                    style={{
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 800,
                        color: '#475569',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      {row.no}
                    </td>

                    {[1, 2, 3, 4, 5, 6].map((k) => {
                      const val = row[`k${k}`] || '';
                      return (
                        <td
                          key={k}
                          style={{
                            padding: editingMatrix ? '4px' : '10px 14px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.82rem',
                            color: val ? '#0f172a' : '#94a3b8',
                            fontWeight: val ? 600 : 400
                          }}
                        >
                          {editingMatrix ? (
                            <select
                              value={val}
                              onChange={(e) => handleCellChange(idx, `k${k}`, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #94a3b8',
                                fontSize: '0.8rem',
                                fontWeight: val ? 700 : 400,
                                color: val ? '#0f172a' : '#94a3b8',
                                background: val ? '#ffffff' : '#f8fafc',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">- Kosong -</option>
                              {allMasterOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : val ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: '#059669'
                                }}
                              />
                              <span>{val}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
                          )}
                        </td>
                      );
                    })}

                    {editingMatrix && (
                      <td
                        style={{
                          textAlign: 'center',
                          border: '1px solid #cbd5e1',
                          padding: '4px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={tempMatrix.length <= 1}
                          title="Hapus baris ini"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: tempMatrix.length <= 1 ? '#cbd5e1' : '#ef4444',
                            cursor: tempMatrix.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingMatrix && (
            <div
              style={{
                padding: '12px 18px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px dashed #86efac',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Tambah Baris Kegiatan Ke Bawah (+ Baris {tempMatrix.length + 1})
              </button>

              <button
                type="button"
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                className="btn btn-primary"
                style={{ background: '#059669', borderColor: '#059669', padding: '8px 20px', fontWeight: 800 }}
              >
                <Save size={14} /> {savingMatrix ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: JADWAL MENGAJAR ASATIDZ
      ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div>
          {/* Filter Search Bar */}
          <div className="filter-search-box" style={{ marginBottom: '14px' }}>
            <div className="filter-search-input">
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Cari nama kitab, ustadz/guru, atau ruangan..."
                value={searchJadwal}
                onChange={(e) => setSearchJadwal(e.target.value)}
              />
              {searchJadwal && (
                <button
                  type="button"
                  onClick={() => setSearchJadwal('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tingkat Kelas */}
            <select
              className="filter-select"
              value={filterTingkat}
              onChange={(e) => setFilterTingkat(e.target.value)}
            >
              <option value="semua">Semua Tingkat Kelas</option>
              {[1, 2, 3, 4, 5, 6].map((k) => (
                <option key={k} value={String(k)}>
                  Kelas {k}
                </option>
              ))}
            </select>

            {/* Filter Hari */}
            <select
              className="filter-select"
              value={filterHari}
              onChange={(e) => setFilterHari(e.target.value)}
            >
              <option value="semua">Semua Hari</option>
              {HARI_LIST.map((h) => (
                <option key={h} value={h}>
                  Hari {h}
                </option>
              ))}
            </select>

            {/* Filter Asatidz */}
            <select
              className="filter-select"
              value={filterAsatidz}
              onChange={(e) => setFilterAsatidz(e.target.value)}
            >
              <option value="semua">Semua Asatidz Pengajar</option>
              {asatidzList.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nama_asatidz} ({a.kategori_asatidz || 'Asatidz'})
                </option>
              ))}
            </select>
          </div>

          {/* Table Jadwal */}
          <div className="table-container-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>HARI & WAKTU</th>
                  <th>TINGKAT KELAS</th>
                  <th>KITAB / MATA PELAJARAN</th>
                  <th>ASATIDZ / USTADZ PENGAJAR</th>
                  <th>LOKASI RUANGAN</th>
                  <th className="td-center" style={{ width: '110px' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredJadwal.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <Calendar size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                        Belum ada jadwal mengajar
                      </div>
                      <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>
                        Silakan klik tombol <strong>"Tambah Jadwal Mengajar"</strong> di atas untuk mengatur waktu dan guru pengajar.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJadwal.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="td-center" style={{ color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                          {item.hari}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Clock size={11} />
                          <span>{item.jam_mulai} - {item.jam_selesai} WIB</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: '#ecfdf5',
                            color: '#047857',
                            border: '1px solid #a7f3d0',
                            fontWeight: 800,
                            fontSize: '0.72rem'
                          }}
                        >
                          Kelas {item.tingkat_kelas}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                          {item.nama_kitab}
                        </div>
                        {item.keterangan && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                            {item.keterangan}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                          {item.nama_asatidz || item.master_asatidz || '-'}
                        </div>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.64rem',
                            marginTop: '2px',
                            background: item.kategori_asatidz === 'Mustahiq' ? '#f0fdf4' : '#eff6ff',
                            color: item.kategori_asatidz === 'Mustahiq' ? '#15803d' : '#1d4ed8'
                          }}
                        >
                          {item.kategori_asatidz || 'Asatidz Ponpes'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.76rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Building size={12} color="#94a3b8" />
                          <span>{item.ruang || 'Masjid Utama'}</span>
                        </div>
                      </td>
                      <td className="td-center">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            onClick={() => openEditJadwal(item)}
                            title="Edit Jadwal"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteJadwal(item)}
                            title="Hapus Jadwal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL TAMBAH / EDIT JADWAL MENGAJAR
      ========================================================================= */}
      {isModalOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '92%',
              margin: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                    {formMode === 'add' ? 'Tambah Jadwal Mengajar' : 'Edit Jadwal Mengajar'}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: '#d1fae5', margin: '2px 0 0' }}>
                    Tentukan waktu, kelas, kitab kajian, dan ustadz pengajar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveJadwal} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tingkat Kelas */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Tingkat Kelas <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formJadwal.tingkat_kelas}
                  onChange={(e) => setFormJadwal({ ...formJadwal, tingkat_kelas: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                >
                  {TINGKAT_KELAS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.sublabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Kitab / Pelajaran */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Kitab / Mata Pelajaran <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {classSpecificKitab.length > 0 ? (
                  <SearchableSelect
                    options={classSpecificKitab}
                    value={formJadwal.nama_kitab}
                    onChange={(val) => setFormJadwal({ ...formJadwal, nama_kitab: val })}
                    placeholder={`-- Pilih Kitab Kurikulum Kelas ${formJadwal.tingkat_kelas} --`}
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={formJadwal.nama_kitab}
                    onChange={(e) => setFormJadwal({ ...formJadwal, nama_kitab: e.target.value })}
                    placeholder="Contoh: Bajuri Jilid 1, Safinah, Jurumiyah..."
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                  />
                )}
              </div>

              {/* Asatidz / Pengajar */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Asatidz / Ustadz Pengajar <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <SearchableSelect
                  options={asatidzList.map((a) => ({
                    value: String(a.id),
                    label: a.nama_asatidz,
                    sublabel: `${a.kategori_asatidz || 'Asatidz'} • ${a.jk === 'L' ? 'Laki-laki' : 'Perempuan'}`
                  }))}
                  value={formJadwal.asatidz_id}
                  onChange={(val) => {
                    const sel = asatidzList.find((a) => String(a.id) === String(val));
                    setFormJadwal({
                      ...formJadwal,
                      asatidz_id: val,
                      nama_asatidz: sel ? sel.nama_asatidz : formJadwal.nama_asatidz
                    });
                  }}
                  placeholder="-- Pilih Guru / Asatidz Pengajar --"
                />
              </div>

              {/* Hari & Waktu */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Hari
                  </label>
                  <select
                    value={formJadwal.hari}
                    onChange={(e) => setFormJadwal({ ...formJadwal, hari: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  >
                    {HARI_LIST.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mulai
                  </label>
                  <input
                    type="time"
                    value={formJadwal.jam_mulai}
                    onChange={(e) => setFormJadwal({ ...formJadwal, jam_mulai: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Selesai
                  </label>
                  <input
                    type="time"
                    value={formJadwal.jam_selesai}
                    onChange={(e) => setFormJadwal({ ...formJadwal, jam_selesai: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Ruang & Keterangan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Lokasi / Ruang Belajar
                </label>
                <input
                  type="text"
                  value={formJadwal.ruang}
                  onChange={(e) => setFormJadwal({ ...formJadwal, ruang: e.target.value })}
                  placeholder="Contoh: Masjid Utama, Aula Lt 2, Kobong Ali..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Keterangan Tambahan
                </label>
                <input
                  type="text"
                  value={formJadwal.keterangan}
                  onChange={(e) => setFormJadwal({ ...formJadwal, keterangan: e.target.value })}
                  placeholder="Catatan target hafalan / bab pengajian..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
                />
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingJadwal}
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                >
                  {submittingJadwal ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

