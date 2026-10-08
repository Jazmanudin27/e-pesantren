import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Save, 
  Phone, 
  User, 
  Building, 
  Award, 
  Clock, 
  FileText 
} from 'lucide-react';

export default function TataTertibView() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');

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
    tanggal: new Date().toISOString().split('T')[0],
    kategori: 'Ringan',
    jenis_pelanggaran: 'Terlambat Shalat Berjamaah',
    poin_pelanggaran: 5,
    bentuk_tazir: 'Membaca Surat Yasin dan menyapu serambi masjid',
    status_tazir: 'Belum Dikerjakan',
    musyrif_pencatat: 'Ust. Bilal Mansur (Biro Keamanan)',
    wa_notif_wali: 1
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resPelanggaran, resSantri] = await Promise.all([
        axios.get('/api/pelanggaran'),
        axios.get('/api/santri')
      ]);

      if (resPelanggaran.data && resPelanggaran.data.success) {
        setPelanggaranList(resPelanggaran.data.data || []);
      }
      if (resSantri.data && resSantri.data.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data pelanggaran:', err);
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
      tanggal: new Date().toISOString().split('T')[0],
      kategori: 'Ringan',
      jenis_pelanggaran: 'Terlambat Shalat Berjamaah',
      poin_pelanggaran: 5,
      bentuk_tazir: 'Membaca Surat Yasin dan menyapu serambi masjid',
      status_tazir: 'Belum Dikerjakan',
      musyrif_pencatat: 'Ust. Bilal Mansur (Biro Keamanan)',
      wa_notif_wali: 1
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
      kategori: item.kategori || 'Ringan',
      jenis_pelanggaran: item.jenis_pelanggaran || '',
      poin_pelanggaran: item.poin_pelanggaran || 5,
      bentuk_tazir: item.bentuk_tazir || '',
      status_tazir: item.status_tazir || 'Belum Dikerjakan',
      musyrif_pencatat: item.musyrif_pencatat || '',
      wa_notif_wali: item.wa_notif_wali ? 1 : 0
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
        const res = await axios.post('/api/pelanggaran', formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/pelanggaran/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan data pelanggaran: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, jenis) => {
    if (window.confirm(`Yakin ingin menghapus catatan pelanggaran "${jenis}"?`)) {
      try {
        await axios.delete(`/api/pelanggaran/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleTazirSelesai = async (id) => {
    try {
      await axios.post(`/api/pelanggaran/selesai/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal update status ta\'zir: ' + err.message);
    }
  };

  // Stats calculation
  const totalPelanggaran = pelanggaranList.length;
  const countRingan = pelanggaranList.filter(p => p.kategori === 'Ringan').length;
  const countSedang = pelanggaranList.filter(p => p.kategori === 'Sedang').length;
  const countBelumTazir = pelanggaranList.filter(p => p.status_tazir === 'Belum Dikerjakan').length;

  const filteredList = pelanggaranList.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = (
      p.nama_santri?.toLowerCase().includes(q) ||
      p.nis?.toLowerCase().includes(q) ||
      p.jenis_pelanggaran?.toLowerCase().includes(q) ||
      p.musyrif_pencatat?.toLowerCase().includes(q) ||
      p.nama_asrama?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'belum' ? p.status_tazir === 'Belum Dikerjakan' :
      activeFilterTab === 'proses' ? p.status_tazir === 'Sedang Proses' :
      activeFilterTab === 'selesai' ? p.status_tazir === "Selesai Ta'zir" : true;

    const matchKategori = filterKategori === 'Semua Kategori' ? true : p.kategori === filterKategori;

    return matchSearch && matchTab && matchKategori;
  });

  return (
    <div className="tab-content-fade">
      {/* 4 TOP VIBRANT STAT CARDS */}
      <div className="stat-cards-grid">
        <div className="stat-vibrant-card stat-card-blue">
          <div className="stat-vibrant-header">
            <span>TOTAL PELANGGARAN</span>
            <div className="stat-vibrant-icon"><ShieldAlert size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{totalPelanggaran}</div>
          <div className="stat-vibrant-sub">Akumulasi catatan santri</div>
        </div>

        <div className="stat-vibrant-card stat-card-green">
          <div className="stat-vibrant-header">
            <span>KATEGORI RINGAN</span>
            <div className="stat-vibrant-icon"><FileText size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countRingan}</div>
          <div className="stat-vibrant-sub">Pelanggaran poin 1 - 10</div>
        </div>

        <div className="stat-vibrant-card stat-card-amber">
          <div className="stat-vibrant-header">
            <span>KATEGORI SEDANG & BERAT</span>
            <div className="stat-vibrant-icon"><AlertTriangle size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countSedang + (pelanggaranList.filter(p => p.kategori === 'Berat').length)}</div>
          <div className="stat-vibrant-sub">Perlu pembinaan khusus</div>
        </div>

        <div className="stat-vibrant-card stat-card-purple">
          <div className="stat-vibrant-header">
            <span>BELUM SELESAI TA'ZIR</span>
            <div className="stat-vibrant-icon"><Clock size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countBelumTazir}</div>
          <div className="stat-vibrant-sub">Menunggu eksekusi sanksi</div>
        </div>
      </div>

      {/* PAGE TITLE STRIP WITH ACTIONS */}
      <div className="page-title-strip">
        <div>
          <h2>Tata Tertib, Pelanggaran & Ta'zir Santri</h2>
          <p>Pencatatan kedisiplinan, poin pelanggaran, eksekusi ta'zir mendidik, dan notifikasi wali.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn btn-refresh" onClick={fetchData} title="Refresh Data">
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-add-primary" onClick={openAddForm}>
            <Plus size={14} />
            <span>+ Catat Pelanggaran</span>
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
              Semua ({pelanggaranList.length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'belum' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('belum')}
            >
              Belum Dikerjakan ({countBelumTazir})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'proses' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('proses')}
            >
              Sedang Proses ({pelanggaranList.filter(p => p.status_tazir === 'Sedang Proses').length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'selesai' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('selesai')}
            >
              Selesai Ta'zir ({pelanggaranList.filter(p => p.status_tazir === "Selesai Ta'zir").length})
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-box">
              <Search size={14} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Cari santri, NIS, atau jenis pelanggaran..." 
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
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
              >
                <option value="Semua Kategori">Semua Kategori</option>
                <option value="Ringan">Ringan</option>
                <option value="Sedang">Sedang</option>
                <option value="Berat">Berat</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={24} className="animate-spin text-blue" />
              <span>Memuat data tata tertib & ta'zir...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={36} color="#cbd5e1" />
              <h4>Tidak ada data pelanggaran ditemukan</h4>
              <p>Silakan sesuaikan pencarian filter atau catat pelanggaran baru.</p>
            </div>
          ) : (
            <table className="custom-bordered-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>NO</th>
                  <th style={{ width: '95px' }}>TANGGAL</th>
                  <th>NAMA SANTRI & ASRAMA</th>
                  <th style={{ width: '100px' }}>KATEGORI</th>
                  <th>JENIS PELANGGARAN</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>POIN</th>
                  <th>BENTUK TA'ZIR</th>
                  <th style={{ width: '120px' }}>STATUS TA'ZIR</th>
                  <th>MUSYRIF PENCATAT</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.74rem' }}>
                        {row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                        {row.nama_santri || 'Santri'}
                      </div>
                      <div style={{ fontSize: '0.69rem', color: '#64748b' }}>
                        NIS: {row.nis || '-'} • {row.nama_asrama || 'Asrama'} ({row.nama_kamar || '-'})
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.kategori === 'Berat' ? 'badge-danger' :
                        row.kategori === 'Sedang' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {row.kategori}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.78rem' }}>
                        {row.jenis_pelanggaran}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontWeight: 700, 
                        color: row.poin_pelanggaran >= 20 ? '#dc2626' : row.poin_pelanggaran >= 10 ? '#d97706' : '#2563eb',
                        fontSize: '0.78rem' 
                      }}>
                        +{row.poin_pelanggaran}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.73rem', color: '#475569', maxWidth: '240px', lineHeight: 1.3 }}>
                        {row.bentuk_tazir}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.status_tazir === "Selesai Ta'zir" ? 'badge-success' :
                        row.status_tazir === 'Sedang Proses' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {row.status_tazir}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 500 }}>
                        {row.musyrif_pencatat}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-action-icons">
                        <button 
                          className="icon-btn icon-btn-view" 
                          title="Lihat Detail"
                          onClick={() => openDetail(row)}
                        >
                          <Eye size={13} />
                        </button>

                        {row.status_tazir !== "Selesai Ta'zir" && (
                          <button 
                            className="icon-btn icon-btn-success" 
                            title="Tandai Selesai Ta'zir"
                            onClick={() => handleTazirSelesai(row.id)}
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}

                        <button 
                          className="icon-btn icon-btn-edit" 
                          title="Edit Pelanggaran"
                          onClick={() => openEditForm(row)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-delete" 
                          title="Hapus Data"
                          onClick={() => handleDelete(row.id, row.jenis_pelanggaran)}
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
            <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #b91c1c 100%)' }}>
              <div className="modal-header-content">
                <div className="modal-header-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <ShieldAlert size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Detail Pelanggaran & Ta'zir</h3>
                  <p style={{ color: '#fecaca', margin: 0, fontSize: '0.72rem' }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'} • Poin: +{selectedItem.poin_pelanggaran}
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
                  <span>IDENTITAS SANTRI</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Nama Lengkap Santri</label>
                    <p style={{ fontWeight: 800, color: '#0f172a' }}>{selectedItem.nama_santri}</p>
                  </div>
                  <div className="detail-field">
                    <label>NIS Santri</label>
                    <p>{selectedItem.nis || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Asrama & Kobong</label>
                    <p>{selectedItem.nama_asrama || '-'} ({selectedItem.nama_kamar || '-'})</p>
                  </div>
                  <div className="detail-field">
                    <label>No. WhatsApp Wali</label>
                    <p style={{ color: '#059669', fontWeight: 600 }}>{selectedItem.no_wa_wali || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                <div className="detail-section-title">
                  <AlertTriangle size={14} className="text-amber" />
                  <span>RINCIAN PELANGGARAN</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Kategori Pelanggaran</label>
                    <span className={`badge ${
                      selectedItem.kategori === 'Berat' ? 'badge-danger' :
                      selectedItem.kategori === 'Sedang' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {selectedItem.kategori}
                    </span>
                  </div>
                  <div className="detail-field">
                    <label>Poin Pelanggaran</label>
                    <p style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.9rem' }}>+{selectedItem.poin_pelanggaran} Poin</p>
                  </div>
                  <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                    <label>Deskripsi Pelanggaran</label>
                    <p style={{ fontWeight: 600, color: '#1e293b' }}>{selectedItem.jenis_pelanggaran}</p>
                  </div>
                  <div className="detail-field">
                    <label>Musyrif / Petugas Pencatat</label>
                    <p>{selectedItem.musyrif_pencatat}</p>
                  </div>
                  <div className="detail-field">
                    <label>Notifikasi WhatsApp Wali</label>
                    <span className={`badge ${selectedItem.wa_notif_wali ? 'badge-success' : 'badge-neutral'}`}>
                      {selectedItem.wa_notif_wali ? 'Terkirim ke Wali' : 'Tidak Dikirim'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-card-white">
                <div className="detail-section-title">
                  <Award size={14} className="text-green" />
                  <span>SANKSI & EKSEKUSI TA'ZIR</span>
                </div>
                <div className="detail-field" style={{ marginBottom: '10px' }}>
                  <label>Bentuk Ta'zir Mendidik</label>
                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                    {selectedItem.bentuk_tazir}
                  </div>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Status Ta'zir</label>
                    <span className={`badge ${
                      selectedItem.status_tazir === "Selesai Ta'zir" ? 'badge-success' :
                      selectedItem.status_tazir === 'Sedang Proses' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {selectedItem.status_tazir}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-slate">
              {selectedItem.status_tazir !== "Selesai Ta'zir" && (
                <button 
                  className="btn btn-add-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    handleTazirSelesai(selectedItem.id);
                    closeModal();
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Nyatakan Selesai Ta'zir</span>
                </button>
              )}
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
                  <ShieldAlert size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
                    {formMode === 'add' ? 'Catat Pelanggaran Santri Baru' : 'Edit Data Pelanggaran & Ta\'zir'}
                  </h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.72rem' }}>
                    Pastikan informasi pelanggaran dan bentuk ta'zir dicatat secara objektif.
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
                    <span>SANTRI & TANGGAL KEJADIAN</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Pilih Santri Pelanggar *</label>
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
                      <label className="form-label">Tanggal Pelanggaran *</label>
                      <input 
                        type="date" 
                        className="form-input-control"
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kategori Tingkat *</label>
                      <select 
                        className="form-input-control"
                        value={formData.kategori}
                        onChange={(e) => {
                          const kat = e.target.value;
                          const defaultPoin = kat === 'Berat' ? 30 : kat === 'Sedang' ? 15 : 5;
                          setFormData({ ...formData, kategori: kat, poin_pelanggaran: defaultPoin });
                        }}
                        required
                      >
                        <option value="Ringan">Ringan (Poin 1-10)</option>
                        <option value="Sedang">Sedang (Poin 11-25)</option>
                        <option value="Berat">Berat (Poin 26-100)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                  <div className="detail-section-title">
                    <AlertTriangle size={14} className="text-amber" />
                    <span>PELANGGARAN & POIN</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Jenis Pelanggaran *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="Contoh: Terlambat Shalat Berjamaah, Keluar Komplek Tanpa Izin..."
                        value={formData.jenis_pelanggaran}
                        onChange={(e) => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Poin Pelanggaran *</label>
                      <input 
                        type="number" 
                        className="form-input-control"
                        min="1"
                        max="100"
                        value={formData.poin_pelanggaran}
                        onChange={(e) => setFormData({ ...formData, poin_pelanggaran: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Musyrif / Petugas Pencatat *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="Nama Ustadz / Musyrif"
                        value={formData.musyrif_pencatat}
                        onChange={(e) => setFormData({ ...formData, musyrif_pencatat: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="detail-card-white">
                  <div className="detail-section-title">
                    <Award size={14} className="text-green" />
                    <span>BENTUK TA'ZIR & STATUS</span>
                  </div>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label">Bentuk Ta'zir Mendidik *</label>
                    <textarea 
                      className="form-input-control"
                      rows="2"
                      placeholder="Contoh: Membaca Surat Al-Mulk, membersihkan aula asrama, dll."
                      value={formData.bentuk_tazir}
                      onChange={(e) => setFormData({ ...formData, bentuk_tazir: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Status Ta'zir *</label>
                      <select 
                        className="form-input-control"
                        value={formData.status_tazir}
                        onChange={(e) => setFormData({ ...formData, status_tazir: e.target.value })}
                        required
                      >
                        <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                        <option value="Sedang Proses">Sedang Proses</option>
                        <option value="Selesai Ta'zir">Selesai Ta'zir</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Kirim Notifikasi WA Wali</label>
                      <select 
                        className="form-input-control"
                        value={formData.wa_notif_wali}
                        onChange={(e) => setFormData({ ...formData, wa_notif_wali: parseInt(e.target.value) })}
                      >
                        <option value={1}>Ya, Kirim Otomatis</option>
                        <option value={0}>Tidak Perlu</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer-slate">
                <button type="button" className="btn btn-outline" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-add-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{formMode === 'add' ? 'Simpan Catatan' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
