import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  X, 
  User, 
  Building, 
  Award, 
  Clock, 
  Save, 
  Phone 
} from 'lucide-react';

export default function TataTertibView() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
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
      console.error('Gagal memuat data tata tertib:', err);
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
    setFormData({
      id: null,
      santri_id: firstSantri?.id || '',
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
      alert('Gagal menyimpan pelanggaran: ' + (err.response?.data?.error || err.message));
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
  const countSedang = pelanggaranList.filter(p => p.kategori === 'Sedang' || p.kategori === 'Berat').length;
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
    const matchStatus = filterStatus === 'Semua Status' ? true : p.status_tazir === filterStatus;

    return matchSearch && matchTab && matchKategori && matchStatus;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL PELANGGARAN</div>
            <div className="stat-colored-number">{totalPelanggaran}</div>
          </div>
          <div className="stat-colored-icon-box">
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">KATEGORI RINGAN</div>
            <div className="stat-colored-number">{countRingan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">KATEGORI SEDANG & BERAT</div>
            <div className="stat-colored-number">{countSedang}</div>
          </div>
          <div className="stat-colored-icon-box">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">BELUM SELESAI TA'ZIR</div>
            <div className="stat-colored-number">{countBelumTazir}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <ShieldAlert size={22} className="page-title-icon" style={{ color: '#dc2626' }} />
          <div>
            <h2>Tata Tertib, Kedisiplinan & Ta'zir Santri</h2>
            <p>Pencatatan pelanggaran santri, akumulasi poin kedisiplinan, sanksi ta'zir mendidik, dan notifikasi wali</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
            <Plus size={14} /> + Catat Pelanggaran Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <ShieldAlert size={14} /> Semua Catatan ({pelanggaranList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'belum' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('belum')}
        >
          <Clock size={14} /> Belum Dikerjakan ({countBelumTazir})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'proses' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('proses')}
        >
          <AlertTriangle size={14} /> Sedang Proses ({pelanggaranList.filter(p => p.status_tazir === 'Sedang Proses').length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'selesai' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('selesai')}
        >
          <CheckCircle2 size={14} /> Selesai Ta'zir ({pelanggaranList.filter(p => p.status_tazir === "Selesai Ta'zir").length})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari santri, NIS, jenis pelanggaran, atau musyrif..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
        >
          <option>Semua Kategori</option>
          <option>Ringan</option>
          <option>Sedang</option>
          <option>Berat</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Belum Dikerjakan</option>
          <option>Sedang Proses</option>
          <option>Selesai Ta'zir</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat catatan pelanggaran & ta'zir...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            Belum ada catatan pelanggaran santri di database.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th className="td-center" style={{ width: '90px' }}>TANGGAL</th>
                <th>NAMA SANTRI & ASRAMA</th>
                <th className="td-center">KATEGORI</th>
                <th>JENIS PELANGGARAN</th>
                <th className="td-center" style={{ width: '65px' }}>POIN</th>
                <th>BENTUK TA'ZIR</th>
                <th className="td-center">STATUS TA'ZIR</th>
                <th>MUSYRIF PENCATAT</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
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
                  <td className="td-center">
                    <span style={{ 
                      fontWeight: 700, 
                      color: row.poin_pelanggaran >= 20 ? '#dc2626' : row.poin_pelanggaran >= 10 ? '#d97706' : '#0284c7',
                      fontSize: '0.78rem' 
                    }}>
                      +{row.poin_pelanggaran}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', color: '#475569', maxWidth: '240px', lineHeight: 1.3 }}>
                      {row.bentuk_tazir}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${
                      row.status_tazir === "Selesai Ta'zir" ? 'badge-success' :
                      row.status_tazir === 'Sedang Proses' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {row.status_tazir}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a' }}>
                      {row.musyrif_pencatat}
                    </div>
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => openDetail(row)}
                        title="Lihat Detail"
                      >
                        <Eye size={12} />
                      </button>

                      {row.status_tazir !== "Selesai Ta'zir" && (
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ background: '#059669', borderColor: '#059669' }}
                          onClick={() => handleTazirSelesai(row.id)}
                          title="Tandai Selesai Ta'zir"
                        >
                          <CheckCircle2 size={12} />
                        </button>
                      )}

                      <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => openEditForm(row)}
                        title="Edit Pelanggaran"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(row.id, row.jenis_pelanggaran)}
                        title="Hapus Catatan"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL TATA TERTIB                            */}
      {/* ==================================================== */}
      {isModalOpen && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #cbd5e1',
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
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Detail Catatan Pelanggaran</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Tanggal: {selectedItem.tanggal ? new Date(selectedItem.tanggal).toLocaleDateString('id-ID') : '-'} • Poin: +{selectedItem.poin_pelanggaran}
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
                  <span className={`badge ${selectedItem.kategori === 'Berat' ? 'badge-danger' : selectedItem.kategori === 'Sedang' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                    Kategori {selectedItem.kategori}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Deskripsi Pelanggaran
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{selectedItem.jenis_pelanggaran}</div>
                  <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>Akumulasi Poin: +{selectedItem.poin_pelanggaran}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Musyrif / Biro Keamanan
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>{selectedItem.musyrif_pencatat}</div>
                </div>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>
                    Status Eksekusi Ta'zir
                  </div>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`badge ${selectedItem.status_tazir === "Selesai Ta'zir" ? 'badge-success' : selectedItem.status_tazir === 'Sedang Proses' ? 'badge-warning' : 'badge-danger'}`}>
                      {selectedItem.status_tazir}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sanksi Ta'zir Card */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', background: '#ffffff' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '6px' }}>
                  Bentuk Sanksi / Ta'zir Mendidik
                </div>
                <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600, background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  {selectedItem.bentuk_tazir}
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
              {selectedItem.status_tazir !== "Selesai Ta'zir" && (
                <button 
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    handleTazirSelesai(selectedItem.id);
                    closeModal();
                  }}
                >
                  <CheckCircle2 size={13} /> Selesaikan Ta'zir
                </button>
              )}
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
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #cbd5e1',
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
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {formMode === 'add' ? 'Catat Pelanggaran Santri Baru' : 'Edit Catatan Pelanggaran & Ta\'zir'}
                  </h3>
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                    Catat pelanggaran dan penentuan sanksi mendidik secara objektif.
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
                
                {/* Santri & Tanggal Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={14} color="#0284c7" /> SANTRI & TANGGAL
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Pilih Santri Pelanggar *</label>
                      <select 
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
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

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Tanggal Pelanggaran *</label>
                      <input 
                        type="date"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.tanggal}
                        onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Kategori Tingkat *</label>
                      <select 
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
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

                {/* Jenis & Poin Card */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertTriangle size={14} color="#d97706" /> PELANGGARAN & POIN
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Jenis Pelanggaran *</label>
                      <input 
                        type="text"
                        placeholder="Contoh: Terlambat Shalat Berjamaah, Membawa HP..."
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.jenis_pelanggaran}
                        onChange={(e) => setFormData({ ...formData, jenis_pelanggaran: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Poin Pelanggaran *</label>
                      <input 
                        type="number"
                        min="1"
                        max="100"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.poin_pelanggaran}
                        onChange={(e) => setFormData({ ...formData, poin_pelanggaran: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Musyrif Pencatat *</label>
                      <input 
                        type="text"
                        placeholder="Nama Ustadz / Musyrif"
                        style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.musyrif_pencatat}
                        onChange={(e) => setFormData({ ...formData, musyrif_pencatat: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sanksi & Status */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Award size={14} color="#059669" /> BENTUK TA'ZIR & STATUS
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Bentuk Ta'zir Mendidik *</label>
                    <textarea 
                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                      rows="2"
                      placeholder="Contoh: Membaca Surat Al-Mulk, membersihkan aula asrama..."
                      value={formData.bentuk_tazir}
                      onChange={(e) => setFormData({ ...formData, bentuk_tazir: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Status Ta'zir *</label>
                      <select 
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.status_tazir}
                        onChange={(e) => setFormData({ ...formData, status_tazir: e.target.value })}
                        required
                      >
                        <option value="Belum Dikerjakan">Belum Dikerjakan</option>
                        <option value="Sedang Proses">Sedang Proses</option>
                        <option value="Selesai Ta'zir">Selesai Ta'zir</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>Notif WA Wali</label>
                      <select 
                        style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem' }}
                        value={formData.wa_notif_wali}
                        onChange={(e) => setFormData({ ...formData, wa_notif_wali: parseInt(e.target.value) })}
                      >
                        <option value={1}>Ya, Kirim Notifikasi</option>
                        <option value={0}>Tidak Perlu</option>
                      </select>
                    </div>
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
                <button type="submit" className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} disabled={submitting}>
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
