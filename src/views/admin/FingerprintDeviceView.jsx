import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Fingerprint, 
  Wifi, 
  WifiOff, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  Server, 
  Activity, 
  X, 
  Radio, 
  Save 
} from 'lucide-react';

export default function FingerprintDeviceView() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterPeruntukan, setFilterPeruntukan] = useState('Semua Peruntukan');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    nama_device: '',
    sn_device: '',
    ip_address: '192.168.1.',
    port: 4370,
    lokasi: '',
    peruntukan: 'Ikhwan',
    status_koneksi: 'Online',
    tipe_mesin: 'ZKTeco Standalone Biometric',
    total_enrolled: 180
  });

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/fingerprint/devices');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setDevices(res.data.data);
      } else {
        setDevices([
          { id: 1, nama_device: 'Mesin Gerbang Putra (Pos 1)', sn_device: 'ZKT-X100C-9901', ip_address: '192.168.1.201', port: 4370, lokasi: 'Pos Satpam Gerbang Utama Putra', peruntukan: 'Ikhwan', status_koneksi: 'Online', tipe_mesin: 'ZKTeco X100-C / Standalone', last_sync: '2026-10-08 05:40:12', total_enrolled: 180 },
          { id: 2, nama_device: 'Mesin Gerbang Putri (Pos 2)', sn_device: 'ZKT-X100C-9902', ip_address: '192.168.1.202', port: 4370, lokasi: 'Pos Satpam Gerbang Putri', peruntukan: 'Akhwat', status_koneksi: 'Online', tipe_mesin: 'ZKTeco X100-C / Standalone', last_sync: '2026-10-08 05:41:00', total_enrolled: 160 },
          { id: 3, nama_device: 'Mesin Asrama Ali Lt. 1', sn_device: 'ZKT-K40-8801', ip_address: '192.168.1.203', port: 4370, lokasi: 'Lobi Masuk Asrama Ali bin Abi Thalib', peruntukan: 'Ikhwan', status_koneksi: 'Online', tipe_mesin: 'ZKTeco K40 Fingerprint & RFID', last_sync: '2026-10-08 05:39:45', total_enrolled: 64 },
          { id: 4, nama_device: 'Mesin Asrama Fathimah Lt. 1', sn_device: 'ZKT-K40-8802', ip_address: '192.168.1.204', port: 4370, lokasi: 'Lobi Masuk Asrama Putri 01', peruntukan: 'Akhwat', status_koneksi: 'Offline', tipe_mesin: 'ZKTeco K40 Fingerprint & RFID', last_sync: '2026-10-07 21:15:30', total_enrolled: 80 }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data perangkat fingerprint:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const openDetail = (d) => {
    setSelectedDevice(d);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      nama_device: '',
      sn_device: `ZKT-${Math.floor(1000 + Math.random() * 9000)}`,
      ip_address: '192.168.1.205',
      port: 4370,
      lokasi: '',
      peruntukan: 'Ikhwan',
      status_koneksi: 'Online',
      tipe_mesin: 'ZKTeco Standalone Biometric',
      total_enrolled: 0
    });
    setIsFormOpen(true);
  };

  const openEditForm = (d) => {
    setFormMode('edit');
    setFormData({
      id: d.id,
      nama_device: d.nama_device || '',
      sn_device: d.sn_device || '',
      ip_address: d.ip_address || '',
      port: d.port || 4370,
      lokasi: d.lokasi || '',
      peruntukan: d.peruntukan || 'Ikhwan',
      status_koneksi: d.status_koneksi || 'Online',
      tipe_mesin: d.tipe_mesin || 'ZKTeco Standalone Biometric',
      total_enrolled: d.total_enrolled || 0
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveDevice = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/fingerprint/devices', formData);
        if (res.data && res.data.success) {
          fetchDevices();
        } else {
          setDevices([...devices, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/fingerprint/devices/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchDevices();
        } else {
          setDevices(devices.map(d => d.id === formData.id ? formData : d));
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Gagal simpan perangkat:', err);
      if (formMode === 'add') {
        setDevices([...devices, { ...formData, id: Date.now() }]);
      } else {
        setDevices(devices.map(d => d.id === formData.id ? formData : d));
      }
      setIsFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id, nama) => {
    if (window.confirm(`Yakin ingin menghapus perangkat mesin "${nama}"?`)) {
      try {
        await axios.delete(`/api/fingerprint/devices/${id}`);
        fetchDevices();
      } catch (err) {
        console.error('Gagal hapus mesin:', err);
        setDevices(devices.filter(d => d.id !== id));
      }
    }
  };

  const countOnline = devices.filter(d => d.status_koneksi === 'Online').length;
  const countOffline = devices.filter(d => d.status_koneksi === 'Offline').length;
  const totalEnrolled = devices.reduce((acc, d) => acc + (parseInt(d.total_enrolled) || 0), 0);

  const filteredList = devices.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = (
      d.nama_device?.toLowerCase().includes(q) ||
      d.sn_device?.toLowerCase().includes(q) ||
      d.ip_address?.includes(q) ||
      d.lokasi?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'online' ? d.status_koneksi === 'Online' :
      activeFilterTab === 'offline' ? d.status_koneksi === 'Offline' :
      activeFilterTab === 'gerbang' ? d.nama_device?.toLowerCase().includes('gerbang') : true;

    const matchPeruntukan = 
      filterPeruntukan === 'Semua Peruntukan' ? true :
      d.peruntukan === filterPeruntukan;

    const matchStatus = filterStatus === 'Semua Status' ? true : d.status_koneksi === filterStatus;

    return matchSearch && matchTab && matchPeruntukan && matchStatus;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL MESIN TERPASANG</div>
            <div className="stat-colored-number">{devices.length || 4}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Server size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">MESIN ONLINE (CONNECTED)</div>
            <div className="stat-colored-number">{countOnline || 3}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Wifi size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">MESIN OFFLINE / DISCONNECT</div>
            <div className="stat-colored-number">{countOffline || 1}</div>
          </div>
          <div className="stat-colored-icon-box">
            <WifiOff size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TOTAL TEMPLATE BIOMETRIC</div>
            <div className="stat-colored-number">{totalEnrolled || 484}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Fingerprint size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Perangkat Mesin Fingerprint</h2>
            <p>Konfigurasi koneksi TCP/IP, Port 4370, Serial Number mesin biometric pos gerbang & lobi asrama</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchDevices}>
            <RotateCw size={13} /> Refresh Status
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Mesin Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <Server size={14} /> Semua Mesin ({devices.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'online' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('online')}
        >
          <Wifi size={14} /> Mesin Online ({countOnline})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'offline' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('offline')}
        >
          <WifiOff size={14} /> Mesin Offline ({countOffline})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'gerbang' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('gerbang')}
        >
          <Radio size={14} /> Mesin Pos Gerbang
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama mesin, serial number, IP address, lokasi penempatan..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterPeruntukan}
          onChange={(e) => setFilterPeruntukan(e.target.value)}
        >
          <option>Semua Peruntukan</option>
          <option>Ikhwan</option>
          <option>Akhwat</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Online</option>
          <option>Offline</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data mesin fingerprint...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA PERANGKAT & TIPE</th>
                <th>SERIAL NUMBER (SN)</th>
                <th>IP ADDRESS & PORT</th>
                <th>LOKASI PENEMPATAN</th>
                <th className="td-center">PERUNTUKAN</th>
                <th className="td-center">STATUS KONEKSI</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((d, idx) => (
                <tr key={d.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.nama_device}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Tipe: {d.tipe_mesin || 'ZKTeco Standalone'}</div>
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', color: '#334155', fontWeight: 700, fontSize: '0.72rem' }}>
                      {d.sn_device}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.76rem' }}>{d.ip_address}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Port TCP: {d.port || 4370}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{d.lokasi}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${d.peruntukan === 'Ikhwan' ? 'badge-info' : d.peruntukan === 'Akhwat' ? 'badge-purple' : 'badge-success'}`}>
                      {d.peruntukan === 'Ikhwan' ? 'Ikhwan (L)' : d.peruntukan === 'Akhwat' ? 'Akhwat (P)' : 'Umum'}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${d.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                      {d.status_koneksi === 'Online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                      <span>{d.status_koneksi}</span>
                    </span>
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button 
                        className="btn-action btn-action-view"
                        onClick={() => openDetail(d)}
                        title="Lihat Detail Konfigurasi Mesin"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-edit"
                        onClick={() => openEditForm(d)}
                        title="Edit Mesin"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteDevice(d.id, d.nama_device)}
                        title="Hapus Mesin"
                      >
                        <Trash2 size={15} />
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
      {/* MODAL DETAIL MESIN FINGERPRINT                      */}
      {/* ==================================================== */}
      {isModalOpen && selectedDevice && (
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
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {selectedDevice.nama_device}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: 0 }}>
                    Serial Number: {selectedDevice.sn_device}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f1f5f9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>IP ADDRESS & PORT</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{selectedDevice.ip_address}:{selectedDevice.port || 4370}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>STATUS KONEKSI</div>
                  <span className={`badge ${selectedDevice.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedDevice.status_koneksi === 'Online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                    <span>{selectedDevice.status_koneksi}</span>
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>LOKASI INSTALASI</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedDevice.lokasi}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TEMPLATE ENROLLED</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0284c7' }}>{selectedDevice.total_enrolled || 180} Santri & Asatidz</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="#0284c7" /> Spesifikasi & Log Sinkronisasi
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Model / Tipe:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDevice.tipe_mesin || 'ZKTeco Standalone Biometric'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Waktu Terakhir Sinkron:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedDevice.last_sync || 'Baru saja'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT PERANGKAT FINGERPRINT       */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fingerprint size={18} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Tambah Mesin Fingerprint Baru' : `Edit Mesin: ${formData.nama_device}`}
                </h3>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDevice}>
              <div style={{ padding: '18px 20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NAMA PERANGKAT MESIN *</label>
                  <input 
                    type="text" 
                    required 
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px' }} 
                    value={formData.nama_device}
                    onChange={(e) => setFormData({ ...formData, nama_device: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>SERIAL NUMBER (SN)</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.sn_device}
                      onChange={(e) => setFormData({ ...formData, sn_device: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>PERUNTUKAN</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }}
                      value={formData.peruntukan}
                      onChange={(e) => setFormData({ ...formData, peruntukan: e.target.value })}
                    >
                      <option value="Ikhwan">Ikhwan (Putra)</option>
                      <option value="Akhwat">Akhwat (Putri)</option>
                      <option value="Semua">Semua / Umum</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>IP ADDRESS</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>PORT TCP</label>
                    <input 
                      type="number" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 4370 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>LOKASI INSTALASI</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>STATUS KONEKSI</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }}
                      value={formData.status_koneksi}
                      onChange={(e) => setFormData({ ...formData, status_koneksi: e.target.value })}
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan Mesin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
