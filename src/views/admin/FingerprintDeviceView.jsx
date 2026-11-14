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
  Save,
  Users,
  Send,
  AlertTriangle,
  AlertCircle,
  UserMinus,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { showConfirm, toastSuccess, showError, toastError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function FingerprintDeviceView() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterPeruntukan, setFilterPeruntukan] = useState('Semua Peruntukan');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('santri'); // 'santri' | 'spesifikasi'
  const [deviceUsers, setDeviceUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('Semua');
  const [deletingUserPin, setDeletingUserPin] = useState(null);
  const [deletingAlumni, setDeletingAlumni] = useState(false);
  const [registeringSantriId, setRegisteringSantriId] = useState(null);
  const [registeringAll, setRegisteringAll] = useState(false);
  const [userCounts, setUserCounts] = useState({ total: 0, enrolled: 0, not_enrolled: 0, aktif: 0, alumni: 0 });

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
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setDevices(res.data.data);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data perangkat fingerprint:', err);
      // Fallback jika API return error atau kosong
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDeviceUsers = async (sn) => {
    try {
      setLoadingUsers(true);
      const res = await axios.get(`/api/iclock/device-users?sn=${encodeURIComponent(sn || '')}`);
      if (res.data && res.data.success) {
        setDeviceUsers(res.data.data || []);
        setUserCounts(res.data.counts || { total: 0, enrolled: 0, not_enrolled: 0, aktif: 0, alumni: 0 });
      } else {
        setDeviceUsers([]);
      }
    } catch (err) {
      console.error('Gagal memuat santri di mesin:', err);
      setDeviceUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openDetail = (d) => {
    setSelectedDevice(d);
    setIsModalOpen(true);
    setDetailTab('santri');
    setUserSearch('');
    setUserStatusFilter('Semua');
    fetchDeviceUsers(d.sn_device);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDevice(null);
    setDeviceUsers([]);
  };

  const handleDeleteUserFromDevice = async (santri) => {
    const pin = santri.pin;
    const confirmed = await showConfirm(
      `Hapus Santri dari Mesin ${selectedDevice?.nama_device || ''}?`,
      `Perintah "DATA DELETE USER PIN=${pin}" akan diantrekan ke mesin. Data user ${santri.nama_santri} (PIN: ${pin}) akan terhapus dari mesin saat mesin tersinkron online.`,
      'Ya, Hapus dari Mesin',
      'Batal'
    );
    if (!confirmed) return;

    try {
      setDeletingUserPin(pin);
      const res = await axios.post('/api/iclock/delete-user', {
        sn_device: selectedDevice?.sn_device,
        pin: pin,
        santri_id: santri.id
      });
      toastSuccess(res.data?.message || `Perintah hapus santri ${santri.nama_santri} berhasil diantrekan.`);
      fetchDeviceUsers(selectedDevice?.sn_device);
      fetchDevices();
    } catch (err) {
      showError('Gagal Hapus User', err.response?.data?.message || err.message);
    } finally {
      setDeletingUserPin(null);
    }
  };

  const handleDeleteAlumniFromDevice = async () => {
    const confirmed = await showConfirm(
      `Hapus Seluruh Santri Alumni dari Mesin?`,
      `Sistem akan mencari seluruh santri berstatus 'Alumni' atau 'Boyong' (${userCounts.alumni} santri) dan mengirimkan perintah penghapusan massal ke mesin ${selectedDevice?.nama_device || ''}. Data sidik jari alumni di mesin akan dibersihkan.`,
      'Ya, Hapus Semua Alumni',
      'Batal'
    );
    if (!confirmed) return;

    try {
      setDeletingAlumni(true);
      const res = await axios.post('/api/iclock/delete-alumni', {
        sn_device: selectedDevice?.sn_device
      });
      toastSuccess(res.data?.message || 'Perintah hapus alumni berhasil diantrekan ke mesin.');
      fetchDeviceUsers(selectedDevice?.sn_device);
      fetchDevices();
    } catch (err) {
      showError('Gagal Hapus Alumni', err.response?.data?.message || err.message);
    } finally {
      setDeletingAlumni(false);
    }
  };

  const handleRegisterSingleSantri = async (santri) => {
    try {
      setRegisteringSantriId(santri.id);
      const res = await axios.post('/api/iclock/register-santri', {
        sn_device: selectedDevice?.sn_device,
        santri_id: santri.id
      });
      toastSuccess(res.data?.message || `Santri ${santri.nama_santri} berhasil didaftarkan ke mesin!`);
      fetchDeviceUsers(selectedDevice?.sn_device);
      fetchDevices();
    } catch (err) {
      showError('Gagal Mendaftarkan', err.response?.data?.message || err.message);
    } finally {
      setRegisteringSantriId(null);
    }
  };

  const handleRegisterAllUnregistered = async () => {
    const count = userCounts.not_enrolled || 0;
    const confirmed = await showConfirm(
      `Daftarkan Semua Santri yang Belum Ada ke Mesin?`,
      `Sistem akan mendaftarkan ${count} santri aktif yang belum terdaftar ke mesin "${selectedDevice?.nama_device || ''}". Perintah sinkronisasi akan langsung diantrekan ke mesin.`,
      'Ya, Daftarkan Semua',
      'Batal'
    );
    if (!confirmed) return;

    try {
      setRegisteringAll(true);
      const res = await axios.post('/api/iclock/register-all', {
        sn_device: selectedDevice?.sn_device
      });
      toastSuccess(res.data?.message || 'Seluruh santri yang belum ada berhasil diantrekan ke mesin!');
      fetchDeviceUsers(selectedDevice?.sn_device);
      fetchDevices();
    } catch (err) {
      showError('Gagal Mendaftarkan', err.response?.data?.message || err.message);
    } finally {
      setRegisteringAll(false);
    }
  };

  const handleSyncToThisDevice = async () => {
    if (!selectedDevice) return;
    const confirmed = await showConfirm(
      `Kirim Santri Aktif ke Mesin Ini?`,
      `Sistem akan mengirimkan data Nama dan NIS seluruh santri aktif (${selectedDevice.peruntukan}) ke antrean Cloud ADMS mesin "${selectedDevice.nama_device}".`
    );
    if (!confirmed) return;

    try {
      setSyncing(true);
      const res = await axios.post('/api/iclock/sync-santri', {
        sn_device: selectedDevice.sn_device,
        jk: selectedDevice.peruntukan === 'Ikhwan' ? 'L' : selectedDevice.peruntukan === 'Akhwat' ? 'P' : undefined
      });
      toastSuccess(res.data?.message || 'Data santri berhasil diantrekan ke mesin!');
      fetchDeviceUsers(selectedDevice.sn_device);
      fetchDevices();
    } catch (err) {
      showError('Gagal Kirim Data', err.response?.data?.message || err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSantriToDevice = async () => {
    const confirmed = await showConfirm(
      'Kirim Data Santri ke Mesin Fingerprint?',
      `Sistem akan mengirimkan data Nama dan NIS seluruh santri aktif ke antrean Cloud ADMS seluruh mesin yang terhubung (${devices.length} mesin).`
    );
    if (!confirmed) return;

    try {
      setSyncing(true);
      const res = await axios.post('/api/iclock/sync-santri');
      toastSuccess(res.data.message || 'Data santri berhasil diantrekan ke mesin!');
      fetchDevices();
    } catch (err) {
      alert('Gagal mengirim data santri: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleClearUsersFromDevice = async () => {
    const confirmed = await showConfirm(
      'Hapus Seluruh Data Santri di Mesin?',
      'PERINGATAN: Perintah ini akan menghapus seluruh data user dan template sidik jari/wajah di memori mesin fingerprint! Setelah bersih, Anda dapat menekan tombol "Kirim Santri ke Mesin" untuk push data baru dari aplikasi.',
      'Ya, Bersihkan Mesin',
      'Batal'
    );
    if (!confirmed) return;

    try {
      setClearing(true);
      const res = await axios.post('/api/iclock/clear-users');
      toastSuccess(res.data.message || 'Perintah hapus data user berhasil diantrekan ke mesin!');
      fetchDevices();
    } catch (err) {
      alert('Gagal mengantrekan hapus data: ' + (err.response?.data?.message || err.message));
    } finally {
      setClearing(false);
    }
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
          toastSuccess('Perangkat fingerprint berhasil ditambahkan');
          fetchDevices();
          setIsFormOpen(false);
        } else {
          showError('Gagal Menyimpan', res.data?.message || 'Gagal menyimpan perangkat');
        }
      } else {
        const res = await axios.put(`/api/fingerprint/devices/${formData.id}`, formData);
        if (res.data && res.data.success) {
          toastSuccess('Perangkat fingerprint berhasil diperbarui');
          fetchDevices();
          setIsFormOpen(false);
        } else {
          showError('Gagal Memperbarui', res.data?.message || 'Gagal memperbarui perangkat');
        }
      }
    } catch (err) {
      console.error('Gagal simpan perangkat:', err);
      showError('Gagal Simpan', err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = async (id, nama) => {
    const confirmed = await showConfirm('Konfirmasi Hapus', `Yakin ingin menghapus perangkat mesin "${nama}"?`);
    if (!confirmed) return;
    try {
      const res = await axios.delete(`/api/fingerprint/devices/${id}`);
      if (res.data && res.data.success) {
        toastSuccess(`Perangkat mesin "${nama}" berhasil dihapus`);
        fetchDevices();
      } else {
        showError('Gagal Hapus', res.data?.message || 'Gagal menghapus perangkat');
      }
    } catch (err) {
      console.error('Gagal hapus mesin:', err);
      showError('Gagal Hapus', err.response?.data?.message || err.message || 'Terjadi kesalahan saat menghapus data.');
    }
  };

  const countOnline = devices.filter(d => d.status_koneksi === 'Online').length;
  const countOffline = devices.filter(d => d.status_koneksi === 'Offline').length;
  const totalEnrolled = devices.reduce((acc, d) => acc + (parseInt(d.total_enrolled) || 0), 0);

  const filteredDeviceUsers = deviceUsers.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const matchSearch = 
      !q || 
      u.nama_santri?.toLowerCase().includes(q) ||
      u.nis?.toLowerCase().includes(q) ||
      String(u.pin)?.toLowerCase().includes(q) ||
      u.nama_kelas?.toLowerCase().includes(q);

    const matchStatus = 
      userStatusFilter === 'Semua' ? true :
      userStatusFilter === 'Enrolled' ? u.is_enrolled :
      userStatusFilter === 'NotEnrolled' ? !u.is_enrolled :
      userStatusFilter === 'Aktif' ? !u.is_alumni :
      userStatusFilter === 'Alumni' ? u.is_alumni : true;

    return matchSearch && matchStatus;
  });

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
            <div className="stat-colored-number">{devices.length}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Server size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">MESIN ONLINE (CONNECTED)</div>
            <div className="stat-colored-number">{countOnline}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Wifi size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">MESIN OFFLINE / DISCONNECT</div>
            <div className="stat-colored-number">{countOffline}</div>
          </div>
          <div className="stat-colored-icon-box">
            <WifiOff size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TOTAL TEMPLATE BIOMETRIC</div>
            <div className="stat-colored-number">{totalEnrolled}</div>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleClearUsersFromDevice} 
            disabled={clearing || syncing}
            style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}
            title="Kosongkan seluruh data santri/user di mesin fingerprint"
          >
            {clearing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {clearing ? ' Mengosongkan...' : ' Kosongkan User di Mesin'}
          </button>
          <button 
            className="btn btn-outline" 
            onClick={handleSyncSantriToDevice} 
            disabled={syncing || clearing}
            style={{ color: '#0284c7', borderColor: '#38bdf8' }}
            title="Kirim nama & NIS santri aktif ke mesin melalui koneksi Cloud ADMS"
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {syncing ? ' Mengirim...' : ' Kirim Santri ke Mesin (ADMS)'}
          </button>
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
        <SearchableSelect 
          style={{ minWidth: '150px', flex: '1 1 140px', maxWidth: '200px' }}
          value={filterPeruntukan}
          onChange={(val) => setFilterPeruntukan(val || 'Semua Peruntukan')}
          placeholder="Semua Peruntukan"
          options={['Semua Peruntukan', 'Ikhwan', 'Akhwat']}
        />
        <SearchableSelect 
          style={{ minWidth: '140px', flex: '1 1 130px', maxWidth: '180px' }}
          value={filterStatus}
          onChange={(val) => setFilterStatus(val || 'Semua Status')}
          placeholder="Semua Status"
          options={['Semua Status', 'Online', 'Offline']}
        />
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
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Server size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Belum ada mesin fingerprint di database</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Silakan daftarkan perangkat baru dengan klik tombol "Tambah Mesin Baru".</div>
                  </td>
                </tr>
              ) : (
                filteredList.map((d, idx) => (
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
                          style={{ background: '#e0f2fe', color: '#0284c7', borderColor: '#bae6fd' }}
                          onClick={() => openDetail(d)}
                          title="Lihat Rincian Santri di Mesin & Hapus User"
                        >
                          <Users size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-edit"
                          onClick={() => openEditForm(d)}
                          title="Edit Mesin"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-delete"
                          onClick={() => handleDeleteDevice(d.id, d.nama_device)}
                          title="Hapus Mesin"
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
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL MESIN FINGERPRINT & RINCIAN DATA SANTRI */}
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
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: 'min(1100px, 96vw)',
            height: 'min(860px, 94vh)',
            maxHeight: '94vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #cbd5e1'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                  <Fingerprint size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      {selectedDevice.nama_device}
                    </h3>
                    <span className={`badge ${selectedDevice.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {selectedDevice.status_koneksi === 'Online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                      <span>{selectedDevice.status_koneksi}</span>
                    </span>
                    <span className={`badge ${selectedDevice.peruntukan === 'Akhwat' ? 'badge-pink' : selectedDevice.peruntukan === 'Ikhwan' ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {selectedDevice.peruntukan === 'Akhwat' ? 'Akhwat (Putri)' : selectedDevice.peruntukan === 'Ikhwan' ? 'Ikhwan (Putra)' : 'Semua / Umum'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Serial Number: <strong style={{ color: '#e2e8f0' }}>{selectedDevice.sn_device}</strong> • IP: {selectedDevice.ip_address}:{selectedDevice.port || 4370} • Lokasi: {selectedDevice.lokasi}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-header Navigation Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              padding: '0 20px',
              gap: '8px',
              flexShrink: 0
            }}>
              <button
                onClick={() => setDetailTab('santri')}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: detailTab === 'santri' ? '3px solid #0284c7' : '3px solid transparent',
                  background: 'transparent',
                  color: detailTab === 'santri' ? '#0284c7' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Users size={16} />
                <span>Rincian Santri di Mesin</span>
                <span style={{
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  background: detailTab === 'santri' ? '#e0f2fe' : '#e2e8f0',
                  color: detailTab === 'santri' ? '#0284c7' : '#64748b'
                }}>
                  {userCounts.total}
                </span>
              </button>

              <button
                onClick={() => setDetailTab('spesifikasi')}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: 'none',
                  borderBottom: detailTab === 'spesifikasi' ? '3px solid #0284c7' : '3px solid transparent',
                  background: 'transparent',
                  color: detailTab === 'spesifikasi' ? '#0284c7' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Server size={16} />
                <span>Spesifikasi & Hardware Mesin</span>
              </button>
            </div>

            {/* Modal Body Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* TAB 1: RINCIAN DATA SANTRI DI MESIN */}
              {detailTab === 'santri' && (
                <>
                  {/* Top Summary Stat Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>TOTAL SANTRI APLIKASI</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{userCounts.total} <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8' }}>Santri</span></div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={18} />
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px 16px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>TERDAFTAR DI MESIN</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{userCounts.enrolled} <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#86efac' }}>Santri</span></div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={18} />
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px 16px', border: userCounts.not_enrolled > 0 ? '1px solid #fed7aa' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: userCounts.not_enrolled > 0 ? '#d97706' : '#64748b', textTransform: 'uppercase' }}>BELUM DI MESIN</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: userCounts.not_enrolled > 0 ? '#d97706' : '#0f172a' }}>{userCounts.not_enrolled} <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8' }}>Santri</span></div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: userCounts.not_enrolled > 0 ? '#ffedd5' : '#f1f5f9', color: userCounts.not_enrolled > 0 ? '#d97706' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={18} />
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px 16px', border: userCounts.alumni > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                      <div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: userCounts.alumni > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase' }}>SANTRI ALUMNI / LULUS</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: userCounts.alumni > 0 ? '#dc2626' : '#0f172a' }}>{userCounts.alumni} <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8' }}>Santri</span></div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: userCounts.alumni > 0 ? '#fee2e2' : '#f1f5f9', color: userCounts.alumni > 0 ? '#dc2626' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GraduationCap size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Banner Notif jika ada Santri Belum Terdaftar ke Mesin */}
                  {userCounts.not_enrolled > 0 && (
                    <div style={{
                      background: 'linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#1e40af', display: 'block' }}>
                            Terdapat {userCounts.not_enrolled} santri aktif yang belum didaftarkan ke mesin fingerprint ini!
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#2563eb' }}>
                            Daftarkan santri ke mesin agar sidik jari dan NIS ananda dapat langsung digunakan untuk presensi.
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 14px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                        }}
                        disabled={registeringAll}
                        onClick={handleRegisterAllUnregistered}
                      >
                        {registeringAll ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                        <span>Daftarkan Semua yang Belum Ada ({userCounts.not_enrolled})</span>
                      </button>
                    </div>
                  )}

                  {/* Warning Alert if Alumni users are detected */}
                  {userCounts.alumni > 0 && (
                    <div style={{
                      background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#92400e', display: 'block' }}>
                            Terdapat {userCounts.alumni} santri yang sudah lulus (Alumni/Boyong) di sistem!
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: '#b45309' }}>
                            Data santri yang sudah lulus dapat dibersihkan dari mesin untuk menjaga kapasitas memori sidik jari.
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm"
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 14px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap'
                        }}
                        disabled={deletingAlumni}
                        onClick={handleDeleteAlumniFromDevice}
                      >
                        {deletingAlumni ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        <span>Hapus Semua Santri Alumni ({userCounts.alumni})</span>
                      </button>
                    </div>
                  )}

                  {/* Controls Toolbar: Search & Action Buttons */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="text"
                          placeholder="Cari Nama Santri, NIS, atau PIN Mesin..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="filter-select"
                          style={{ width: '100%', paddingLeft: '32px', height: '36px', fontSize: '0.8rem' }}
                        />
                      </div>

                      {/* Status Filter Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
                        <button
                          onClick={() => setUserStatusFilter('Semua')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: userStatusFilter === 'Semua' ? '#0f172a' : '#f1f5f9',
                            color: userStatusFilter === 'Semua' ? '#ffffff' : '#64748b'
                          }}
                        >
                          Semua ({userCounts.total})
                        </button>
                        <button
                          onClick={() => setUserStatusFilter('Enrolled')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: userStatusFilter === 'Enrolled' ? '#16a34a' : '#dcfce7',
                            color: userStatusFilter === 'Enrolled' ? '#ffffff' : '#15803d'
                          }}
                        >
                          Sudah di Mesin ({userCounts.enrolled})
                        </button>
                        <button
                          onClick={() => setUserStatusFilter('NotEnrolled')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: userStatusFilter === 'NotEnrolled' ? '#d97706' : '#fef3c7',
                            color: userStatusFilter === 'NotEnrolled' ? '#ffffff' : '#b45309'
                          }}
                        >
                          Belum di Mesin ({userCounts.not_enrolled})
                        </button>
                        <button
                          onClick={() => setUserStatusFilter('Alumni')}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            background: userStatusFilter === 'Alumni' ? '#dc2626' : '#fee2e2',
                            color: userStatusFilter === 'Alumni' ? '#ffffff' : '#b91c1c'
                          }}
                        >
                          Alumni ({userCounts.alumni})
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => fetchDeviceUsers(selectedDevice.sn_device)}
                        disabled={loadingUsers}
                        title="Segarkan Data"
                      >
                        <RotateCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSyncToThisDevice}
                        disabled={syncing}
                        title="Kirim seluruh santri aktif ke mesin ini"
                      >
                        {syncing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>Push Semua Santri</span>
                      </button>
                    </div>
                  </div>

                  {/* Santri Data Table */}
                  <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    {loadingUsers ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0284c7' }} />
                        <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>Memuat data santri aplikasi vs mesin...</p>
                      </div>
                    ) : filteredDeviceUsers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <Users size={32} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
                        <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Tidak ada data santri ditemukan</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                          {userSearch ? 'Coba ubah kata kunci pencarian Anda.' : 'Silakan klik tombol "Push Semua Santri" untuk sinkronisasi.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
                        <table className="device-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 2 }}>
                            <tr>
                              <th style={{ width: '45px', textAlign: 'center' }}>NO</th>
                              <th style={{ width: '110px' }}>PIN MESIN</th>
                              <th>NAMA SANTRI & NIS</th>
                              <th>KELAS & ASRAMA</th>
                              <th style={{ width: '140px', textAlign: 'center' }}>STATUS DI MESIN</th>
                              <th style={{ width: '160px', textAlign: 'center' }}>AKSI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDeviceUsers.map((u, idx) => (
                              <tr key={u.id || idx} style={{ background: u.is_alumni ? '#fffbeb' : undefined }}>
                                <td style={{ textAlign: 'center', fontSize: '0.76rem', color: '#64748b' }}>
                                  {idx + 1}
                                </td>
                                <td>
                                  <span style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    background: '#f1f5f9',
                                    color: '#0f172a',
                                    padding: '3px 7px',
                                    borderRadius: '5px',
                                    border: '1px solid #cbd5e1'
                                  }}>
                                    #{u.pin}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '6px',
                                      background: u.jk === 'P' ? '#fce7f3' : '#e0f2fe',
                                      color: u.jk === 'P' ? '#ec4899' : '#0284c7',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.72rem',
                                      fontWeight: 800
                                    }}>
                                      {u.nama_santri?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                                        {u.nama_santri}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                        NIS: {u.nis || '-'} • {u.jk === 'P' ? 'Santriwati (P)' : 'Santri (L)'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                                    {u.nama_kelas}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    Asrama: {u.nama_asrama}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {u.is_enrolled ? (
                                    <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={11} />
                                      <span>Sudah di Mesin</span>
                                    </span>
                                  ) : (
                                    <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.68rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertCircle size={11} />
                                      <span>Belum di Mesin</span>
                                    </span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {u.is_enrolled ? (
                                    <button
                                      onClick={() => handleDeleteUserFromDevice(u)}
                                      disabled={deletingUserPin === u.pin}
                                      style={{
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: '1px solid #fecaca',
                                        borderRadius: '6px',
                                        padding: '5px 10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                      }}
                                      title={`Hapus ${u.nama_santri} dari memori mesin ${selectedDevice.nama_device}`}
                                    >
                                      {deletingUserPin === u.pin ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Menghapus...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 size={12} />
                                          <span>Hapus dari Mesin</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRegisterSingleSantri(u)}
                                      disabled={registeringSantriId === u.id}
                                      style={{
                                        background: '#0284c7',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '5px 10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: '0 1px 3px rgba(2,132,199,0.25)'
                                      }}
                                      title={`Daftarkan ${u.nama_santri} ke mesin ${selectedDevice.nama_device}`}
                                    >
                                      {registeringSantriId === u.id ? (
                                        <>
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Mendaftarkan...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} />
                                          <span>Daftarkan ke Mesin</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: SPESIFIKASI & HARDWARE MESIN */}
              {detailTab === 'spesifikasi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>IP ADDRESS & PORT</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedDevice.ip_address}:{selectedDevice.port || 4370}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>STATUS KONEKSI</div>
                      <div style={{ marginTop: '2px' }}>
                        <span className={`badge ${selectedDevice.status_koneksi === 'Online' ? 'badge-success' : 'badge-danger'}`}>
                          {selectedDevice.status_koneksi === 'Online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                          <span>{selectedDevice.status_koneksi}</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>LOKASI INSTALASI</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{selectedDevice.lokasi}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>TEMPLATE ENROLLED</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>{userCounts.total} Santri Terdaftar</div>
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '12px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={15} color="#0284c7" /> Spesifikasi & Log Sinkronisasi
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#64748b' }}>Model / Tipe:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.tipe_mesin || 'ZKTeco Standalone Biometric'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#64748b' }}>Serial Number:</span>
                        <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedDevice.sn_device}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#64748b' }}>Peruntukan Santri:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.peruntukan || 'Semua'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: '#64748b' }}>Waktu Terakhir Sinkron:</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.last_sync || 'Baru saja'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Mesin: <strong>{selectedDevice.nama_device}</strong> ({selectedDevice.sn_device})
              </div>
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
                    <SearchableSelect 
                      options={[
                        { value: 'Ikhwan', label: 'Ikhwan (Putra)' },
                        { value: 'Akhwat', label: 'Akhwat (Putri)' },
                        { value: 'Semua', label: 'Semua / Umum' }
                      ]}
                      value={formData.peruntukan}
                      onChange={(val) => setFormData({ ...formData, peruntukan: val })}
                      placeholder="-- Pilih Peruntukan --"
                    />
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
                    <SearchableSelect 
                      options={[
                        { value: 'Online', label: 'Online' },
                        { value: 'Offline', label: 'Offline' }
                      ]}
                      value={formData.status_koneksi}
                      onChange={(val) => setFormData({ ...formData, status_koneksi: val })}
                      placeholder="-- Pilih Status --"
                    />
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
