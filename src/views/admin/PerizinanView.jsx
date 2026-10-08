import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DoorOpen, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  QrCode, 
  CheckCircle, 
  LogOut, 
  LogIn, 
  X, 
  Save, 
  User, 
  Phone, 
  Clock, 
  Calendar, 
  FileText, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function PerizinanView() {
  const [izinList, setIzinList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua Jenis');

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
    jenis_izin: 'Izin Pulang',
    keperluan: 'Kepentingan keluarga / libur semester',
    tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
    tgl_kembali_rencana: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    nama_penjemput_mahrom: '',
    no_hp_penjemput: '',
    hubungan_mahrom: 'Orang Tua (Ayah)',
    status: 'Disetujui Pengasuh',
    disetujui_oleh: 'KH. Ahmad Fauzan (Pengasuh)'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resIzin, resSantri] = await Promise.all([
        axios.get('/api/perizinan'),
        axios.get('/api/santri')
      ]);

      if (resIzin.data && resIzin.data.success) {
        setIzinList(resIzin.data.data || []);
      }
      if (resSantri.data && resSantri.data.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil data perizinan:', err);
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
    const firstSantri = santriList.length > 0 ? santriList[0] : null;
    setFormData({
      id: null,
      santri_id: firstSantri ? firstSantri.id : '',
      jenis_izin: 'Izin Pulang',
      keperluan: 'Kepentingan keluarga / libur semester',
      tgl_keluar_rencana: new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      nama_penjemput_mahrom: firstSantri ? firstSantri.nama_wali || '' : '',
      no_hp_penjemput: firstSantri ? firstSantri.no_wa_wali || '' : '',
      hubungan_mahrom: firstSantri ? firstSantri.hubungan_wali || 'Orang Tua (Ayah)' : 'Orang Tua (Ayah)',
      status: 'Disetujui Pengasuh',
      disetujui_oleh: 'KH. Ahmad Fauzan (Pengasuh)'
    });
    setIsFormOpen(true);
  };

  const handleSantriSelectChange = (santriId) => {
    const s = santriList.find(item => item.id.toString() === santriId.toString());
    if (s) {
      setFormData(prev => ({
        ...prev,
        santri_id: santriId,
        nama_penjemput_mahrom: s.nama_wali || prev.nama_penjemput_mahrom,
        no_hp_penjemput: s.no_wa_wali || prev.no_hp_penjemput,
        hubungan_mahrom: s.hubungan_wali || prev.hubungan_mahrom
      }));
    } else {
      setFormData(prev => ({ ...prev, santri_id: santriId }));
    }
  };

  const openEditForm = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || '',
      jenis_izin: item.jenis_izin || 'Izin Pulang',
      keperluan: item.keperluan || '',
      tgl_keluar_rencana: item.tgl_keluar_rencana ? item.tgl_keluar_rencana.slice(0, 16) : new Date().toISOString().slice(0, 16),
      tgl_kembali_rencana: item.tgl_kembali_rencana ? item.tgl_kembali_rencana.slice(0, 16) : new Date().toISOString().slice(0, 16),
      nama_penjemput_mahrom: item.nama_penjemput_mahrom || '',
      no_hp_penjemput: item.no_hp_penjemput || '',
      hubungan_mahrom: item.hubungan_mahrom || 'Orang Tua',
      status: item.status || 'Menunggu Persetujuan',
      disetujui_oleh: item.disetujui_oleh || 'Dewan Pengasuh'
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
        const res = await axios.post('/api/perizinan', formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      } else {
        const res = await axios.put(`/api/perizinan/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchData();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      alert('Gagal menyimpan perizinan: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, barcode) => {
    if (window.confirm(`Yakin ingin menghapus surat izin "${barcode}"?`)) {
      try {
        await axios.delete(`/api/perizinan/${id}`);
        fetchData();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const handleGateCheckout = async (id) => {
    if (window.confirm('Verifikasi santri keluar gerbang pondok sekarang?')) {
      try {
        await axios.post('/api/perizinan/checkout', { id, satpam: 'Petugas Pos Gerbang Utama' });
        fetchData();
      } catch (err) {
        alert('Gagal check-out: ' + err.message);
      }
    }
  };

  const handleGateCheckin = async (id) => {
    if (window.confirm('Verifikasi santri telah tiba dan masuk kembali ke pondok?')) {
      try {
        await axios.post('/api/perizinan/checkin', { id, satpam: 'Petugas Pos Gerbang Utama' });
        fetchData();
      } catch (err) {
        alert('Gagal check-in: ' + err.message);
      }
    }
  };

  // Stats calculation
  const totalIzin = izinList.length;
  const countAktifKeluar = izinList.filter(i => i.status === 'Aktif Keluar').length;
  const countTepatWaktu = izinList.filter(i => i.status === 'Kembali Tepat Waktu').length;
  const countTerlambat = izinList.filter(i => i.status === 'Terlambat Kembali').length;

  const filteredList = izinList.filter((row) => {
    const q = search.toLowerCase();
    const matchSearch = (
      row.nama_santri?.toLowerCase().includes(q) ||
      row.nis?.toLowerCase().includes(q) ||
      row.barcode?.toLowerCase().includes(q) ||
      row.kode_izin?.toLowerCase().includes(q) ||
      row.nama_penjemput_mahrom?.toLowerCase().includes(q) ||
      row.keperluan?.toLowerCase().includes(q) ||
      row.nama_asrama?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'menunggu' ? row.status === 'Menunggu Persetujuan' :
      activeFilterTab === 'disetujui' ? row.status === 'Disetujui Pengasuh' :
      activeFilterTab === 'keluar' ? row.status === 'Aktif Keluar' :
      activeFilterTab === 'selesai' ? (row.status === 'Kembali Tepat Waktu' || row.status === 'Terlambat Kembali') : true;

    const matchJenis = filterJenis === 'Semua Jenis' ? true : row.jenis_izin === filterJenis;

    return matchSearch && matchTab && matchJenis;
  });

  return (
    <div className="tab-content-fade">
      {/* 4 TOP VIBRANT STAT CARDS */}
      <div className="stat-cards-grid">
        <div className="stat-vibrant-card stat-card-blue">
          <div className="stat-vibrant-header">
            <span>TOTAL PENGAJUAN IZIN</span>
            <div className="stat-vibrant-icon"><DoorOpen size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{totalIzin}</div>
          <div className="stat-vibrant-sub">Surat perizinan santri terdata</div>
        </div>

        <div className="stat-vibrant-card stat-card-amber">
          <div className="stat-vibrant-header">
            <span>SANTRI AKTIF DI LUAR</span>
            <div className="stat-vibrant-icon"><LogOut size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countAktifKeluar}</div>
          <div className="stat-vibrant-sub">Sedang berada di luar komplek</div>
        </div>

        <div className="stat-vibrant-card stat-card-green">
          <div className="stat-vibrant-header">
            <span>KEMBALI TEPAT WAKTU</span>
            <div className="stat-vibrant-icon"><CheckCircle size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countTepatWaktu}</div>
          <div className="stat-vibrant-sub">Check-in sesuai jadwal izin</div>
        </div>

        <div className="stat-vibrant-card stat-card-purple">
          <div className="stat-vibrant-header">
            <span>TERLAMBAT KEMBALI</span>
            <div className="stat-vibrant-icon"><AlertTriangle size={16} /></div>
          </div>
          <div className="stat-vibrant-number">{countTerlambat}</div>
          <div className="stat-vibrant-sub">Melebihi estimasi batas jam</div>
        </div>
      </div>

      {/* PAGE TITLE STRIP WITH ACTIONS */}
      <div className="page-title-strip">
        <div>
          <h2>Perizinan Keluar & Validasi Gerbang Satpam</h2>
          <p>Manajemen perizinan pulang santri, verifikasi mahrom penjemput, barcode digital, dan monitoring pos gerbang.</p>
        </div>
        <div className="action-buttons-group">
          <button className="btn btn-refresh" onClick={fetchData} title="Refresh Data">
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-add-primary" onClick={openAddForm}>
            <Plus size={14} />
            <span>+ Buat Surat Izin Baru</span>
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
              Semua ({izinList.length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'disetujui' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('disetujui')}
            >
              Siap Keluar ({izinList.filter(i => i.status === 'Disetujui Pengasuh').length})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'keluar' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('keluar')}
            >
              Aktif Keluar ({countAktifKeluar})
            </button>
            <button 
              className={`tab-pill-item ${activeFilterTab === 'selesai' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('selesai')}
            >
              Selesai / Kembali ({countTepatWaktu + countTerlambat})
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-box">
              <Search size={14} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Cari santri, barcode, kode izin, atau penjemput..." 
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
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
              >
                <option value="Semua Jenis">Semua Jenis Izin</option>
                <option value="Izin Pulang">Izin Pulang</option>
                <option value="Izin Berobat">Izin Berobat</option>
                <option value="Izin Keluar Komplek">Izin Keluar Komplek</option>
                <option value="Izin Khusus">Izin Khusus</option>
              </select>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={24} className="animate-spin text-blue" />
              <span>Memuat data perizinan santri...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="empty-state">
              <DoorOpen size={36} color="#cbd5e1" />
              <h4>Tidak ada perizinan ditemukan</h4>
              <p>Silakan sesuaikan kata kunci pencarian atau buat surat izin baru.</p>
            </div>
          ) : (
            <table className="custom-bordered-table">
              <thead>
                <tr>
                  <th style={{ width: '45px', textAlign: 'center' }}>NO</th>
                  <th style={{ width: '135px' }}>BARCODE & KODE</th>
                  <th>NAMA SANTRI & ASRAMA</th>
                  <th style={{ width: '110px' }}>JENIS IZIN</th>
                  <th>RENCANA JADWAL</th>
                  <th>PENJEMPUT / MAHROM</th>
                  <th style={{ width: '125px' }}>STATUS</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>POS GERBANG</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((row, idx) => (
                  <tr key={row.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 700, fontSize: '0.74rem' }}>
                        <QrCode size={13} />
                        <span>{row.barcode || 'PSN-IZN'}</span>
                      </div>
                      <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                        {row.kode_izin}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                        {row.nama_santri}
                      </div>
                      <div style={{ fontSize: '0.69rem', color: '#64748b' }}>
                        NIS: {row.nis || '-'} • {row.nama_asrama || 'Asrama'} ({row.nama_kamar || '-'})
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.jenis_izin === 'Izin Pulang' ? 'badge-primary' :
                        row.jenis_izin === 'Izin Berobat' ? 'badge-danger' :
                        row.jenis_izin === 'Izin Keluar Komplek' ? 'badge-warning' : 'badge-purple'
                      }`}>
                        {row.jenis_izin}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.72rem', color: '#334155' }}>
                        <strong>Keluar:</strong> {row.tgl_keluar_rencana ? new Date(row.tgl_keluar_rencana).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>
                        <strong>Kembali:</strong> {row.tgl_kembali_rencana ? new Date(row.tgl_kembali_rencana).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.76rem' }}>
                        {row.nama_penjemput_mahrom || '-'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {row.hubungan_mahrom} {row.no_hp_penjemput ? `• ${row.no_hp_penjemput}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.status === 'Kembali Tepat Waktu' ? 'badge-success' :
                        row.status === 'Aktif Keluar' ? 'badge-danger' :
                        row.status === 'Disetujui Pengasuh' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.status === 'Disetujui Pengasuh' && (
                        <button 
                          className="btn btn-warning btn-sm"
                          style={{ fontSize: '0.68rem', padding: '3px 7px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => handleGateCheckout(row.id)}
                          title="Santri Keluar Gerbang"
                        >
                          <LogOut size={11} /> Keluar Gerbang
                        </button>
                      )}

                      {row.status === 'Aktif Keluar' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.68rem', padding: '3px 7px', background: '#059669', borderColor: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          onClick={() => handleGateCheckin(row.id)}
                          title="Santri Tiba / Masuk Kembali"
                        >
                          <LogIn size={11} /> Check-In Masuk
                        </button>
                      )}

                      {row.status === 'Kembali Tepat Waktu' && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle size={12} /> Tuntas
                        </span>
                      )}

                      {row.status === 'Menunggu Persetujuan' && (
                        <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 600 }}>
                          Menunggu ACC
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="table-action-icons">
                        <button 
                          className="icon-btn icon-btn-view" 
                          title="Lihat Pass Gerbang & Detail"
                          onClick={() => openDetail(row)}
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-edit" 
                          title="Edit Izin"
                          onClick={() => openEditForm(row)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="icon-btn icon-btn-delete" 
                          title="Hapus Izin"
                          onClick={() => handleDelete(row.id, row.barcode || row.kode_izin)}
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

      {/* MODAL DETAIL (PASS DIGITAL GERBANG) */}
      {isModalOpen && selectedItem && (
        <div className="modal-backdrop-custom" onClick={closeModal}>
          <div className="modal-box-custom modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-gradient" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)' }}>
              <div className="modal-header-content">
                <div className="modal-header-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <QrCode size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Digital Gate Pass & Surat Izin</h3>
                  <p style={{ color: '#bfdbfe', margin: 0, fontSize: '0.72rem' }}>
                    Kode: {selectedItem.kode_izin} • Barcode: {selectedItem.barcode}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-slate">
              {/* BARCODE BADGE CARD */}
              <div className="detail-card-white" style={{ textAlign: 'center', marginBottom: '10px', background: '#f8fafc', border: '2px dashed #93c5fd' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, letterSpacing: '1px' }}>VALIDASI DIGITAL GERBANG SANTRI</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e3a8a', margin: '4px 0', letterSpacing: '2px' }}>
                  {selectedItem.barcode}
                </div>
                <span className={`badge ${
                  selectedItem.status === 'Kembali Tepat Waktu' ? 'badge-success' :
                  selectedItem.status === 'Aktif Keluar' ? 'badge-danger' : 'badge-info'
                }`}>
                  Status: {selectedItem.status}
                </span>
              </div>

              <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                <div className="detail-section-title">
                  <User size={14} className="text-blue" />
                  <span>IDENTITAS SANTRI</span>
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
                    <label>Asrama & Kobong</label>
                    <p>{selectedItem.nama_asrama || '-'} ({selectedItem.nama_kamar || '-'})</p>
                  </div>
                  <div className="detail-field">
                    <label>Jenis Permohonan</label>
                    <span className="badge badge-primary">{selectedItem.jenis_izin}</span>
                  </div>
                  <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                    <label>Keperluan Izin</label>
                    <p style={{ color: '#334155', fontWeight: 500 }}>{selectedItem.keperluan}</p>
                  </div>
                </div>
              </div>

              <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                <div className="detail-section-title">
                  <Clock size={14} className="text-amber" />
                  <span>RENTANG WAKTU & AKTUAL GERBANG</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Rencana Keluar</label>
                    <p>{selectedItem.tgl_keluar_rencana ? new Date(selectedItem.tgl_keluar_rencana).toLocaleString('id-ID') : '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Rencana Kembali (Batas)</label>
                    <p style={{ color: '#dc2626', fontWeight: 700 }}>
                      {selectedItem.tgl_kembali_rencana ? new Date(selectedItem.tgl_kembali_rencana).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                  <div className="detail-field">
                    <label>Aktual Keluar Gerbang</label>
                    <p>{selectedItem.tgl_keluar_aktual ? new Date(selectedItem.tgl_keluar_aktual).toLocaleString('id-ID') : 'Belum tercatat keluar'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Aktual Kembali Gerbang</label>
                    <p>{selectedItem.tgl_kembali_aktual ? new Date(selectedItem.tgl_kembali_aktual).toLocaleString('id-ID') : 'Belum check-in'}</p>
                  </div>
                </div>
              </div>

              <div className="detail-card-white">
                <div className="detail-section-title">
                  <ShieldCheck size={14} className="text-green" />
                  <span>VERIFIKASI MAHROM & PENGASUH</span>
                </div>
                <div className="detail-grid-2">
                  <div className="detail-field">
                    <label>Nama Penjemput (Mahrom)</label>
                    <p style={{ fontWeight: 700, color: '#0f172a' }}>{selectedItem.nama_penjemput_mahrom || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Hubungan Mahrom</label>
                    <p>{selectedItem.hubungan_mahrom || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>No. HP / WA Penjemput</label>
                    <p style={{ color: '#059669', fontWeight: 600 }}>{selectedItem.no_hp_penjemput || '-'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Disetujui Oleh</label>
                    <p>{selectedItem.disetujui_oleh || 'Dewan Pengasuh'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-slate">
              {selectedItem.status === 'Disetujui Pengasuh' && (
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    handleGateCheckout(selectedItem.id);
                    closeModal();
                  }}
                >
                  <LogOut size={14} />
                  <span>Catat Santri Keluar Gerbang</span>
                </button>
              )}

              {selectedItem.status === 'Aktif Keluar' && (
                <button 
                  className="btn btn-add-primary"
                  style={{ background: '#059669', borderColor: '#059669' }}
                  onClick={() => {
                    handleGateCheckin(selectedItem.id);
                    closeModal();
                  }}
                >
                  <LogIn size={14} />
                  <span>Check-In Santri Kembali</span>
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
                  <DoorOpen size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ color: '#ffffff', margin: 0, fontSize: '0.98rem', fontWeight: 800 }}>
                    {formMode === 'add' ? 'Buat Surat Permohonan Izin Santri' : 'Edit Surat Izin Santri'}
                  </h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.72rem' }}>
                    Pastikan penjemput mahrom sah dan tanggal kepulangan tervalidasi.
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
                    <span>SANTRI & KEPERLUAN</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Pilih Santri Pemohon *</label>
                      <select 
                        className="form-input-control"
                        value={formData.santri_id}
                        onChange={(e) => handleSantriSelectChange(e.target.value)}
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
                      <label className="form-label">Jenis Izin *</label>
                      <select 
                        className="form-input-control"
                        value={formData.jenis_izin}
                        onChange={(e) => setFormData({ ...formData, jenis_izin: e.target.value })}
                        required
                      >
                        <option value="Izin Pulang">Izin Pulang</option>
                        <option value="Izin Berobat">Izin Berobat</option>
                        <option value="Izin Keluar Komplek">Izin Keluar Komplek</option>
                        <option value="Izin Khusus">Izin Khusus</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Status Persetujuan *</label>
                      <select 
                        className="form-input-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="Disetujui Pengasuh">Disetujui Pengasuh (Siap Keluar)</option>
                        <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                        <option value="Aktif Keluar">Aktif Keluar (Sudah di Luar)</option>
                        <option value="Kembali Tepat Waktu">Kembali Tepat Waktu</option>
                        <option value="Terlambat Kembali">Terlambat Kembali</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Keperluan / Alasan Izin *</label>
                      <textarea 
                        className="form-input-control"
                        rows="2"
                        placeholder="Contoh: Menghadiri pernikahan kakak kandung / periksa dokter gigi..."
                        value={formData.keperluan}
                        onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="detail-card-white" style={{ marginBottom: '10px' }}>
                  <div className="detail-section-title">
                    <Clock size={14} className="text-amber" />
                    <span>RENCANA WAKTU KELUAR & KEMBALI</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Rencana Tanggal & Jam Keluar *</label>
                      <input 
                        type="datetime-local" 
                        className="form-input-control"
                        value={formData.tgl_keluar_rencana}
                        onChange={(e) => setFormData({ ...formData, tgl_keluar_rencana: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rencana Tanggal & Jam Kembali *</label>
                      <input 
                        type="datetime-local" 
                        className="form-input-control"
                        value={formData.tgl_kembali_rencana}
                        onChange={(e) => setFormData({ ...formData, tgl_kembali_rencana: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="detail-card-white">
                  <div className="detail-section-title">
                    <ShieldCheck size={14} className="text-green" />
                    <span>PENJEMPUT MAHROM & APPROVAL</span>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Nama Penjemput Mahrom *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="Nama penjemput sesuai KTP"
                        value={formData.nama_penjemput_mahrom}
                        onChange={(e) => setFormData({ ...formData, nama_penjemput_mahrom: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hubungan Mahrom *</label>
                      <select 
                        className="form-input-control"
                        value={formData.hubungan_mahrom}
                        onChange={(e) => setFormData({ ...formData, hubungan_mahrom: e.target.value })}
                        required
                      >
                        <option value="Orang Tua (Ayah)">Orang Tua (Ayah)</option>
                        <option value="Orang Tua (Ibu)">Orang Tua (Ibu)</option>
                        <option value="Kakak Kandung">Kakak Kandung</option>
                        <option value="Paman / Bibi (Mahrom)">Paman / Bibi (Mahrom)</option>
                        <option value="Kakek / Nenek">Kakek / Nenek</option>
                        <option value="Wali Resmi">Wali Resmi</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">No. HP / WhatsApp Penjemput *</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="08123456789"
                        value={formData.no_hp_penjemput}
                        onChange={(e) => setFormData({ ...formData, no_hp_penjemput: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Disetujui Oleh</label>
                      <input 
                        type="text" 
                        className="form-input-control"
                        placeholder="KH. Ahmad Fauzan (Pengasuh)"
                        value={formData.disetujui_oleh}
                        onChange={(e) => setFormData({ ...formData, disetujui_oleh: e.target.value })}
                      />
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
                  <span>{formMode === 'add' ? 'Terbitkan Surat Izin' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
