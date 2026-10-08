import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Award, 
  CheckCircle, 
  X, 
  Save, 
  User, 
  Building, 
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function TahfidzView() {
  const [setoranList, setSetoranList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [halaqahList, setHalaqahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterTajwid, setFilterTajwid] = useState('Semua Kualitas');

  // Modal Detail
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    santri_id: '',
    halaqah_id: '',
    asatidz_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis_setoran: 'Ziyadah',
    juz: 1,
    surat_mulai: 'Al-Baqarah',
    ayat_mulai: 1,
    surat_selesai: 'Al-Baqarah',
    ayat_selesai: 20,
    kualitas_tajwid: 'Mumtaz (A)',
    status: 'Lulus',
    catatan: 'Bacaan tartil, makharijul huruf fasih, dengung tajwid tepat.'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSetoran, resSantri, resAsatidz, resHalaqah] = await Promise.all([
        axios.get('/api/tahfidz/setoran'),
        axios.get('/api/santri'),
        axios.get('/api/asatidz'),
        axios.get('/api/tahfidz/halaqah')
      ]);

      if (resSetoran.data && resSetoran.data.success) {
        setSetoranList(resSetoran.data.data || []);
      }
      if (resSantri.data && resSantri.data.success) {
        setSantriList(resSantri.data.data || []);
      }
      if (resAsatidz.data && resAsatidz.data.success) {
        setAsatidzList(resAsatidz.data.data || []);
      }
      if (resHalaqah.data && resHalaqah.data.success) {
        setHalaqahList(resHalaqah.data.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data tahfidz:', err);
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
    setFormData({
      id: null,
      santri_id: santriList.length > 0 ? santriList[0].id : '',
      halaqah_id: halaqahList.length > 0 ? halaqahList[0].id : '',
      asatidz_id: asatidzList.length > 0 ? asatidzList[0].id : '',
      tanggal: new Date().toISOString().split('T')[0],
      jenis_setoran: 'Ziyadah',
      juz: 1,
      surat_mulai: 'Al-Baqarah',
      ayat_mulai: 1,
      surat_selesai: 'Al-Baqarah',
      ayat_selesai: 20,
      kualitas_tajwid: 'Mumtaz (A)',
      status: 'Lulus',
      catatan: 'Bacaan tartil, makharijul huruf fasih, dengung tajwid tepat.'
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      halaqah_id: item.halaqah_id || '',
      asatidz_id: item.asatidz_id || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
      jenis_setoran: item.jenis_setoran || 'Ziyadah',
      juz: item.juz || 1,
      surat_mulai: item.surat_mulai || '',
      ayat_mulai: item.ayat_mulai || 1,
      surat_selesai: item.surat_selesai || '',
      ayat_selesai: item.ayat_selesai || 1,
      kualitas_tajwid: item.kualitas_tajwid || 'Mumtaz (A)',
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
      alert('Pilih santri terlebih dahulu!');
      return;
    }
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/tahfidz/setoran', formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/tahfidz/setoran/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan data setoran: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus riwayat setoran "${nama}"?`)) {
      try {
        await axios.delete(`/api/tahfidz/setoran/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  // Stats calculation
  const totalSetoran = setoranList.length;
  const countZiyadah = setoranList.filter(s => s.jenis_setoran === 'Ziyadah').length;
  const countMurojaah = setoranList.filter(s => s.jenis_setoran === 'Muroja\'ah').length;
  const countMumtaz = setoranList.filter(s => s.kualitas_tajwid?.includes('Mumtaz')).length;

  const filteredList = setoranList.filter((st) => {
    const q = search.toLowerCase();
    const matchSearch = (
      st.nama_santri?.toLowerCase().includes(q) ||
      st.nis?.toLowerCase().includes(q) ||
      st.surat_mulai?.toLowerCase().includes(q) ||
      st.surat_selesai?.toLowerCase().includes(q) ||
      st.nama_asatidz?.toLowerCase().includes(q) ||
      st.nama_halaqah?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ziyadah' ? st.jenis_setoran === 'Ziyadah' :
      activeFilterTab === 'murojaah' ? st.jenis_setoran === "Muroja'ah" :
      activeFilterTab === 'sabqi' ? st.jenis_setoran === 'Sabqi' :
      activeFilterTab === 'tasmi' ? st.jenis_setoran?.includes('Tasmi') : true;

    const matchTajwid = filterTajwid === 'Semua Kualitas' ? true : st.kualitas_tajwid === filterTajwid;

    return matchSearch && matchTab && matchTajwid;
  });

  return (
    <div className="tab-content-fade">
      {/* 4 TOP VIBRANT STAT CARDS */}
      <div className="stat-cards-grid">
        <div className="stat-vibrant-card stat-card-blue">
          <div className="stat-vibrant-header">
            <span>TOTAL MUTABA'AH SETORAN</span>
            <div className="stat-vibrant-icon"><BookOpen size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{totalSetoran}</div>
          <div className="stat-vibrant-sub">Riwayat setoran terdata di DB</div>
        </div>

        <div className="stat-vibrant-card stat-card-green">
          <div className="stat-vibrant-header">
            <span>SETORAN ZIYADAH</span>
            <div className="stat-vibrant-icon"><Sparkles size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countZiyadah}</div>
          <div className="stat-vibrant-sub">Penambahan hafalan baru</div>
        </div>

        <div className="stat-vibrant-card stat-card-amber">
          <div className="stat-vibrant-header">
            <span>SETORAN MUROJA'AH</span>
            <div className="stat-vibrant-icon"><Layers size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countMurojaah}</div>
          <div className="stat-vibrant-sub">Pengulangan hafalan mutqin</div>
        </div>

        <div className="stat-vibrant-card stat-card-purple">
          <div className="stat-vibrant-header">
            <span>PREDIKAT MUMTAZ (A)</span>
            <div className="stat-vibrant-icon"><Award size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countMumtaz}</div>
          <div className="stat-vibrant-sub">Kualitas tajwid & fashohah terbaik</div>
        </div>
      </div>

      {/* PAGE TITLE STRIP WITH ACTIONS */}
      <div className="page-title-strip">
        <div>
          <h2>Tahfidz & Muroja'ah Al-Qur'an</h2>
          <p>Pencatatan mutaba'ah setoran harian santri, penilaian tajwid, juz, dan riwayat bimbingan asatidz.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn btn-refresh" onClick={fetchData} title="Refresh Data">
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-add-primary" onClick={openAddForm}>
            <Plus size={14} />
            <span>+ Input Setoran Santri</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CARD */}
      <div className="main-data-card">
        {/* TABS & FILTER BAR */}
        <div className="toolbar-section">
          <div className="tab-pills-row">
            <button 
              className={`tab-pill-item ${activeFilterTab === 'semua' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('semua')}
            >
              Semua ({setoranList.length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'ziyadah' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('ziyadah')}
            >
              Ziyadah ({countZiyadah})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'murojaah' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('murojaah')}
            >
              Muroja'ah ({countMurojaah})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'sabqi' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('sabqi')}
            >
              Sabqi ({setoranList.filter(s => s.jenis_setoran === 'Sabqi').length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'tasmi' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('tasmi')}
            >
              Tasmi' Bil-Ghoib ({setoranList.filter(s => s.jenis_setoran?.includes('Tasmi')).length})
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-box">
              <Search size={14} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Cari santri, NIS, surat atau asatidz..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear-btn" onClick={() => setSearch('')}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="filter-dropdown-group">
              <select 
                className="filter-select-input"
                value={filterTajwid}
                onChange={(e) => setFilterTajwid(e.target.value)}
              >
                <option value="Semua Kualitas">Semua Tajwid</option>
                <option value="Mumtaz (A)">Mumtaz (A)</option>
                <option value="Jayyid Jiddan (B+)">Jayyid Jiddan (B+)</option>
                <option value="Jayyid (B)">Jayyid (B)</option>
                <option value="Maqbul (C)">Maqbul (C)</option>
                <option value="Rombak/Ulang">Rombak/Ulang</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={24} className="animate-spin text-blue" />
              <span>Memuat data setoran tahfidz...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={36} color="#cbd5e1" />
              <h4>Tidak ada riwayat setoran ditemukan</h4>
              <p>Silakan sesuaikan kata kunci pencarian atau buat setoran baru.</p>
            </div>
          ) : (
            <table className="custom-bordered-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>NO</th>
                  <th style={{ width: '95px' }}>TANGGAL</th>
                  <th>NAMA SANTRI & ASRAMA</th>
                  <th style={{ width: '110px' }}>JENIS SETORAN</th>
                  <th>CAPAIAN AYAT & SURAT</th>
                  <th style={{ width: '65px', textAlign: 'center' }}>JUZ</th>
                  <th style={{ width: '130px' }}>KUALITAS TAJWID</th>
                  <th style={{ width: '100px' }}>STATUS</th>
                  <th>ASATIDZ / MUSYRIF</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((st, idx) => (
                  <tr key={st.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.74rem' }}>
                        {st.tanggal ? new Date(st.tanggal).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                        {st.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.69rem', color: '#64748b' }}>
                        NIS: {st.nis || '-'} • {st.nama_asrama || 'Asrama'} ({st.nama_kamar || '-'})
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        st.jenis_setoran === 'Ziyadah' ? 'badge-success' :
                        st.jenis_setoran === "Muroja'ah" ? 'badge-info' :
                        st.jenis_setoran === 'Sabqi' ? 'badge-warning' : 'badge-purple'
                      }`}>
                        {st.jenis_setoran}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                        {st.surat_mulai} ({st.ayat_mulai}) s/d {st.surat_selesai} ({st.ayat_selesai})
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-info" style={{ fontWeight: 800 }}>
                        Juz {st.juz}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        st.kualitas_tajwid?.includes('Mumtaz') ? 'badge-success' :
                        st.kualitas_tajwid?.includes('Jayyid Jiddan') ? 'badge-info' :
                        st.kualitas_tajwid?.includes('Jayyid') ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {st.kualitas_tajwid}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${st.status === 'Lulus' ? 'badge-success' : 'badge-danger'}`}>
                        {st.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 600 }}>
                        {st.nama_asatidz || 'Musyrif'}
                      </div>
                      {st.nama_halaqah && (
                        <div style={{ fontSize: '0.68rem', color: '#059669' }}>
                          {st.nama_halaqah}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-action-icons">
                        <button 
                          className="icon-btn icon-btn-view" 
                          title="Lihat Detail"
                          onClick={() => openDetail(st)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-edit" 
                          title="Edit Setoran"
                          onClick={() => openEditForm(st)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-delete" 
                          title="Hapus Setoran"
                          onClick={() => handleDelete(st.id, `${st.nama_santri} - Juz ${st.juz}`)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DETAIL */}
      {isModalOpen && selectedItem && (
        <div className="modal-backdrop-custom" onClick={closeModal}>
          <div className="modal-box-custom modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)' }}>
              <div className="modal-header-content">
                <div className="modal-header-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <BookOpen size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Detail Mutaba'ah Setoran Tahfidz</h3>
                  <p style={{ color: '#d1fae5', margin: 0, fontSize: '0.72rem' }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'} • {selectedItem.jenis_setoran}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-slate">
              <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                <div className="detail-section-title">
                  <User size={14} className="text-blue" />
                  <span>IDENTITAS SANTRI & KELOMPOK</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Nama Santri</label>
                    <p style={{ fontWeight: 800, color: '#0f172a' }}>{selectedItem.nama_santri}</p>
                  </div>
                  <div className="detail-field">
                    <label>NIS Santri</label>
                    <p>{selectedItem.nis || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Asrama & Kamar</label>
                    <p>{selectedItem.nama_asrama || '-'} ({selectedItem.nama_kamar || '-'})</p>
                  </div>
                  <div className="detail-field">
                    <label>Halaqah & Asatidz</label>
                    <p>{selectedItem.nama_halaqah || 'Halaqah'} • {selectedItem.nama_asatidz || 'Musyrif'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                <div className="detail-section-title">
                  <Sparkles size={14} className="text-green" />
                  <span>RINCIAN CAPAIAN QUR'AN</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Jenis Setoran</label>
                    <span className="badge badge-success">{selectedItem.jenis_setoran}</span>
                  </div>
                  <div className="detail-field">
                    <label>Posisi Juz</label>
                    <span className="badge badge-info" style={{ fontWeight: 800 }}>Juz {selectedItem.juz}</span>
                  </div>
                  <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                    <label>Ayat & Surat Yang Disetorkan</label>
                    <p style={{ fontWeight: 700, color: '#065f46', fontSize: '0.88rem' }}>
                      QS. {selectedItem.surat_mulai} (Ayat {selectedItem.ayat_mulai}) s/d QS. {selectedItem.surat_selesai} (Ayat {selectedItem.ayat_selesai})
                    </p>
                  </div>
                </div>
              </div>

              <div className="detail-card-white">
                <div className="detail-section-title">
                  <Award size={14} className="text-amber" />
                  <span>EVALUASI TAJWID & CATATAN MUSYRIF</span>
                </div>
                <div className="detail-grid-2" style={{ marginBottom: '10px' }}>
                  <div className="detail-field">
                    <label>Kualitas Tajwid & Makhraj</label>
                    <span className="badge badge-success">{selectedItem.kualitas_tajwid}</span>
                  </div>
                  <div className="detail-field">
                    <label>Status Kelulusan</label>
                    <span className={`badge ${selectedItem.status === 'Lulus' ? 'badge-success' : 'badge-danger'}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
                <div className="detail-field">
                  <label>Catatan Pembinaan / Evaluasi</label>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '0.78rem' }}>
                    {selectedItem.catatan || 'Tidak ada catatan khusus.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-slate">
              <button className="btn btn-outline" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM (ADD & EDIT) */}
      {isFormOpen && (
        <div className="modal-backdrop-custom" onClick={closeForm}>
          <div className="modal-box-custom modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}>
              <div className="modal-header-content">
                <div className="modal-header-icon">
                  <BookOpen size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
                    {formMode === 'add' ? 'Input Setoran Tahfidz Santri' : 'Edit Riwayat Setoran Tahfidz'}
                  </h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.72rem' }}>
                    Catat capaian hafalan Al-Qur'an secara teliti dan akurat.
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeForm}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body-slate">
                <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                  <div className="detail-section-title">
                    <User size={14} className="text-blue" />
                    <span>SANTRI & ASATIDZ PENGUJI</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Pilih Santri *</label>
                      <select 
                        className="form-input-control"
                        value={formData.santri_id}
                        onChange={(e) => setFormData({ ...formData, santri_id: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih Santri dari Database --</option>
                        {santriList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nama_santri} (NIS: {s.nis}) - {s.nama_asrama || 'Asrama'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Asatidz / Musyrif Penguji *</label>
                      <select 
                        className="form-input-control"
                        value={formData.asatidz_id}
                        onChange={(e) => setFormData({ ...formData, asatidz_id: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih Asatidz --</option>
                        {asatidzList.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nama_asatidz} {a.gelar || ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kelompok Halaqah</label>
                      <select 
                        className="form-input-control"
                        value={formData.halaqah_id}
                        onChange={(e) => setFormData({ ...formData, halaqah_id: e.target.value })}
                      >
                        <option value="">-- Tanpa Kelompok Khusus --</option>
                        {halaqahList.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.nama_halaqah} ({h.gender === 'L' ? 'Ikhwan' : 'Akhwat'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                  <div className="detail-section-title">
                    <BookOpen size={14} className="text-green" />
                    <span>MUTABA'AH AYAT & JUZ</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Tanggal Setoran *</label>
                      <input 
                        type="date" 
                        className="form-input-control"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Jenis Setoran *</label>
                      <select 
                        className="form-input-control"
                        value={formData.jenis_setoran}
                        onChange={(e) => setFormData({ ...formData, jenis_setoran: e.target.value })}
                        required
                      >
                        <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                        <option value="Muroja'ah">Muroja'ah (Pengulangan)</option>
                        <option value="Sabqi">Sabqi (Sambung Hafalan)</option>
                        <option value="Tasmi' Bil-Ghoib">Tasmi' Bil-Ghoib (Ujian Sekali Duduk)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Juz Ke- *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="30" 
                        className="form-input-control"
                        value={formData.juz}
                        onChange={(e) => setFormData({ ...formData, juz: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kualitas Tajwid & Fashohah *</label>
                      <select 
                        className="form-input-control"
                        value={formData.kualitas_tajwid}
                        onChange={(e) => setFormData({ ...formData, kualitas_tajwid: e.target.value })}
                        required
                      >
                        <option value="Mumtaz (A)">Mumtaz (A - Sangat Baik)</option>
                        <option value="Jayyid Jiddan (B+)">Jayyid Jiddan (B+ - Baik Sekali)</option>
                        <option value="Jayyid (B)">Jayyid (B - Baik)</option>
                        <option value="Maqbul (C)">Maqbul (C - Cukup)</option>
                        <option value="Rombak/Ulang">Rombak/Ulang (Mengulang Tajwid)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Surat Mulai *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="Contoh: Al-Baqarah"
                        value={formData.surat_mulai}
                        onChange={(e) => setFormData({ ...formData, surat_mulai: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ayat Mulai *</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-input-control"
                        value={formData.ayat_mulai}
                        onChange={(e) => setFormData({ ...formData, ayat_mulai: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Surat Selesai *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="Contoh: Al-Baqarah"
                        value={formData.surat_selesai}
                        onChange={(e) => setFormData({ ...formData, surat_selesai: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ayat Selesai *</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="form-input-control"
                        value={formData.ayat_selesai}
                        onChange={(e) => setFormData({ ...formData, ayat_selesai: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="detail-card-white">
                  <div className="detail-section-title">
                    <Award size={14} className="text-purple" />
                    <span>STATUS & CATATAN MUSYRIF</span>
                  </div>
                  <div className="form-grid-2" style={{ marginBottom: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Status Kelulusan Setoran *</label>
                      <select 
                        className="form-input-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="Lulus">Lulus (Diterima)</option>
                        <option value="Perlu Pengulangan">Perlu Pengulangan</option>
                        <option value="Mengulang">Mengulang Penuh</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Bimbingan / Evaluasi</label>
                    <textarea 
                      className="form-input-control"
                      rows="2"
                      placeholder="Catatan tajwid, makhraj, atau kelancaran..."
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-slate">
                <button type="button" className="btn btn-outline" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-add-primary" disabled={submitting}>
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
