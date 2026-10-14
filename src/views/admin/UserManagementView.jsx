import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldAlert, 
  Key, 
  Plus, 
  RotateCw, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Save, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Mail, 
  User, 
  Copy, 
  Check,
  ShieldCheck,
  Power
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';

const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Administrator Ponpes',
    username: 'admin',
    email: 'admin@nurulwafa.sch.id',
    role: 'Super Admin',
    status: 'Active',
    phone: '081288881111',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-10-12T14:30:00Z'
  },
  {
    id: 2,
    name: 'KH. M. Syukron Ma\'mun, Lc.',
    username: 'pengasuh',
    email: 'pengasuh@nurulwafa.sch.id',
    role: 'Pengasuh',
    status: 'Active',
    phone: '081288882222',
    created_at: '2026-01-12T09:15:00Z',
    updated_at: '2026-10-10T10:00:00Z'
  },
  {
    id: 3,
    name: 'Ust. Hamdan S.Pd.I',
    username: 'hamdan',
    email: 'hamdan@nurulwafa.sch.id',
    role: 'Ustadz',
    status: 'Active',
    phone: '081399993333',
    created_at: '2026-02-01T11:20:00Z',
    updated_at: '2026-10-11T16:45:00Z'
  },
  {
    id: 4,
    name: 'Ust. M. Huda Al-Hafidz',
    username: 'huda',
    email: 'huda@nurulwafa.sch.id',
    role: 'Musyrif',
    status: 'Active',
    phone: '085788884444',
    created_at: '2026-02-15T13:10:00Z',
    updated_at: '2026-10-09T08:20:00Z'
  },
  {
    id: 5,
    name: 'Ust. Bilal Mansur (Kamtib)',
    username: 'keamanan',
    email: 'kamtib@nurulwafa.sch.id',
    role: 'Keamanan',
    status: 'Active',
    phone: '087855667788',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-09-25T11:30:00Z'
  },
  {
    id: 6,
    name: 'H. Sudirman (Wali Santri)',
    username: 'wali.sudirman',
    email: 'sudirman@gmail.com',
    role: 'Wali Santri',
    status: 'Active',
    phone: '081912345678',
    created_at: '2026-03-20T14:40:00Z',
    updated_at: '2026-08-15T09:10:00Z'
  }
];

export default function UserManagementView() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal Detail State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal Form (Add & Edit) State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Ustadz',
    status: 'Active',
    password: '',
    confirmPassword: ''
  });

  // Modal Reset Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('123456');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load Users from API / Local Storage
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/users');
      if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setUsersList(res.data.data);
        localStorage.setItem('epesantren_users_cache', JSON.stringify(res.data.data));
      } else {
        loadFallbackUsers();
      }
    } catch (err) {
      loadFallbackUsers();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackUsers = () => {
    try {
      const cached = localStorage.getItem('epesantren_users_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsersList(parsed);
          return;
        }
      }
    } catch (e) {}
    setUsersList(DEFAULT_USERS);
    localStorage.setItem('epesantren_users_cache', JSON.stringify(DEFAULT_USERS));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Save to Cache helper (for offline / instant reactive feel)
  const syncCache = (updatedList) => {
    setUsersList(updatedList);
    try {
      localStorage.setItem('epesantren_users_cache', JSON.stringify(updatedList));
    } catch (e) {}
  };

  // Open Form: Add User
  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'Ustadz',
      status: 'Active',
      password: '',
      confirmPassword: ''
    });
    setIsFormOpen(true);
  };

  // Open Form: Edit User
  const openEditForm = (user) => {
    setFormMode('edit');
    setFormData({
      id: user.id,
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'Ustadz',
      status: user.status || 'Active',
      password: '',
      confirmPassword: ''
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      showError('Validasi Gagal', 'Nama lengkap dan Username wajib diisi!');
      return;
    }

    if (formMode === 'add') {
      if (!formData.password || formData.password.length < 5) {
        showError('Validasi Gagal', 'Password akun baru minimal 5 karakter!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showError('Validasi Gagal', 'Konfirmasi password tidak cocok!');
        return;
      }
    } else if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 5) {
        showError('Validasi Gagal', 'Password baru minimal 5 karakter!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showError('Validasi Gagal', 'Konfirmasi password baru tidak cocok!');
        return;
      }
    }

    try {
      setSubmitting(true);
      const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '');
      const cleanEmail = formData.email.trim() || `${cleanUsername}@nurulwafa.sch.id`;

      if (formMode === 'add') {
        let createdId = Date.now();
        try {
          const res = await axios.post('/api/users', {
            name: formData.name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: formData.phone.trim() || '-',
            role: formData.role,
            status: formData.status,
            password: formData.password
          });
          if (res.data?.data?.id) createdId = res.data.data.id;
        } catch (apiErr) {
          console.warn('[Offline User Fallback Add]', apiErr.message);
        }

        const newUser = {
          id: createdId,
          name: formData.name.trim(),
          username: cleanUsername,
          email: cleanEmail,
          phone: formData.phone.trim() || '-',
          role: formData.role,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        syncCache([newUser, ...usersList]);
        toastSuccess('Berhasil!', `Pengguna "${formData.name}" berhasil ditambahkan.`);
      } else {
        // Edit Mode
        try {
          await axios.put(`/api/users/${formData.id}`, {
            name: formData.name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: formData.phone.trim() || '-',
            role: formData.role,
            status: formData.status,
            password: formData.password || undefined
          });
        } catch (apiErr) {
          console.warn('[Offline User Fallback Edit]', apiErr.message);
        }

        const updated = usersList.map((u) => {
          if (u.id === formData.id) {
            return {
              ...u,
              name: formData.name.trim(),
              username: cleanUsername,
              email: cleanEmail,
              phone: formData.phone.trim() || '-',
              role: formData.role,
              status: formData.status,
              updated_at: new Date().toISOString()
            };
          }
          return u;
        });

        syncCache(updated);
        toastSuccess('Berhasil!', `Data pengguna "${formData.name}" berhasil diperbarui.`);
      }

      setIsFormOpen(false);
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user) => {
    if (user.id === 1 || user.username === 'admin') {
      showError('Akses Ditolak', 'Akun Administrator Utama tidak boleh dihapus demi keamanan!');
      return;
    }

    const confirmed = await showConfirm(
      'Hapus Pengguna?',
      `Apakah Anda yakin ingin menghapus pengguna "${user.name}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      try {
        await axios.delete(`/api/users/${user.id}`);
      } catch (e) {
        console.warn('[Offline User Fallback Delete]', e.message);
      }

      const filtered = usersList.filter((u) => u.id !== user.id);
      syncCache(filtered);
      toastSuccess('Dihapus!', `Akun "${user.name}" telah dihapus dari sistem.`);
    } catch (err) {
      showError('Gagal Menghapus', err.message);
    }
  };

  // Handle Toggle Status (Active <-> Inactive)
  const handleToggleStatus = async (user) => {
    if (user.id === 1 || user.username === 'admin') {
      showError('Akses Ditolak', 'Status Administrator Utama tidak dapat dinonaktifkan!');
      return;
    }

    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      try {
        await axios.patch(`/api/users/${user.id}/status`, { status: nextStatus });
      } catch (e) {}

      const updated = usersList.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u));
      syncCache(updated);
      toastSuccess('Status Diubah', `Pengguna @${user.username} sekarang ${nextStatus === 'Active' ? 'Aktif' : 'Nonaktif'}.`);
    } catch (err) {
      showError('Gagal Mengubah Status', err.message);
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (user) => {
    setResetTargetUser(user);
    setNewPasswordVal('123456');
    setCopied(false);
    setIsResetOpen(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!newPasswordVal || newPasswordVal.length < 5) {
      showError('Password Terlalu Pendek', 'Password baru minimal 5 karakter!');
      return;
    }

    try {
      setResetting(true);
      try {
        await axios.post(`/api/users/${resetTargetUser.id}/reset-password`, {
          new_password: newPasswordVal
        });
      } catch (e) {
        console.warn('[Offline User Fallback Reset Pass]', e.message);
      }

      toastSuccess(
        'Password Direset!',
        `Password untuk @${resetTargetUser.username} telah diubah menjadi: "${newPasswordVal}"`
      );
      setIsResetOpen(false);
    } catch (err) {
      showError('Gagal Reset Password', err.message);
    } finally {
      setResetting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordVal(res);
    setCopied(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtering
  const filteredUsers = usersList.filter((user) => {
    const s = search.toLowerCase();
    const matchSearch =
      (user.name && user.name.toLowerCase().includes(s)) ||
      (user.username && user.username.toLowerCase().includes(s)) ||
      (user.email && user.email.toLowerCase().includes(s)) ||
      (user.phone && user.phone.includes(s));

    const matchRole = filterRole === 'Semua' || user.role === filterRole;
    const matchStatus = filterStatus === 'Semua' || user.status === filterStatus;

    return matchSearch && matchRole && matchStatus;
  });

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return {
          bg: '#f3e8ff',
          color: '#7e22ce',
          border: '#d8b4fe',
          icon: <Shield size={12} style={{ marginRight: '4px' }} />
        };
      case 'Pengasuh':
        return {
          bg: '#ecfdf5',
          color: '#047857',
          border: '#a7f3d0',
          icon: <ShieldCheck size={12} style={{ marginRight: '4px' }} />
        };
      case 'Ustadz':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#bfdbfe',
          icon: <UserCheck size={12} style={{ marginRight: '4px' }} />
        };
      case 'Musyrif':
        return {
          bg: '#f0fdfa',
          color: '#0f766e',
          border: '#99f6e4',
          icon: <Users size={12} style={{ marginRight: '4px' }} />
        };
      case 'Keamanan':
        return {
          bg: '#fffbeb',
          color: '#b45309',
          border: '#fde68a',
          icon: <ShieldAlert size={12} style={{ marginRight: '4px' }} />
        };
      case 'Wali Santri':
        return {
          bg: '#f8fafc',
          color: '#475569',
          border: '#cbd5e1',
          icon: <User size={12} style={{ marginRight: '4px' }} />
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#e2e8f0',
          icon: <User size={12} style={{ marginRight: '4px' }} />
        };
    }
  };

  // Metrics calculation
  const totalCount = usersList.length;
  const adminPengasuhCount = usersList.filter((u) => u.role === 'Super Admin' || u.role === 'Pengasuh').length;
  const asatidzMusyrifCount = usersList.filter((u) => u.role === 'Ustadz' || u.role === 'Musyrif').length;
  const activeCount = usersList.filter((u) => u.status === 'Active').length;

  return (
    <div className="view-container" style={{ padding: '20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ================= PAGE HEADER ================= */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
        padding: '20px 24px',
        borderRadius: '14px',
        color: '#ffffff',
        boxShadow: '0 4px 15px rgba(6, 78, 59, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <Users size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Manajemen Pengguna & Hak Akses
            </h1>
            <p style={{ fontSize: '0.82rem', margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.88)' }}>
              Kelola data akun login administrator, pengasuh, ustadz, musyrif, dan wali santri.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Refresh Data Pengguna"
          >
            <RotateCw size={15} className={loading ? 'spin-animation' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={openAddForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.15s'
            }}
          >
            <Plus size={16} />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* ================= METRIC CARDS ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* Total Pengguna */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Akun Pengguna
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {totalCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
              Terdaftar dalam sistem
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={22} />
          </div>
        </div>

        {/* Super Admin & Pengasuh */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Admin & Pengasuh
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7e22ce', marginTop: '2px' }}>
              {adminPengasuhCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9333ea', marginTop: '4px' }}>
              Hak akses otoritas penuh
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#f3e8ff',
            color: '#7e22ce',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={22} />
          </div>
        </div>

        {/* Asatidz & Musyrif */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Ustadz & Musyrif
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
              {asatidzMusyrifCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '4px' }}>
              Akses presensi & pembinaan
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={22} />
          </div>
        </div>

        {/* Akun Aktif */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '16px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Akun Aktif (Status)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              {activeCount} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/ {totalCount}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '4px' }}>
              Siap login desktop & mobile
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Power size={22} />
          </div>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '14px 18px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '7px 12px',
          minWidth: '280px',
          flex: '1 1 300px'
        }}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '0.84rem',
              color: '#0f172a'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Semua">Semua Role</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Pengasuh">Pengasuh</option>
              <option value="Ustadz">Ustadz</option>
              <option value="Musyrif">Musyrif</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Wali Santri">Wali Santri</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                fontSize: '0.82rem',
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Active">Active (Aktif)</option>
              <option value="Inactive">Inactive (Nonaktif)</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= DATA TABLE CONTAINER ================= */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, width: '45px' }}>No</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Pengguna</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Username & Kontak</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Hak Akses / Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Terakhir Update</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center', width: '160px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <UserX size={32} color="#94a3b8" />
                      <span style={{ fontWeight: 600 }}>Tidak ada data pengguna yang cocok.</span>
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Coba periksa kata kunci pencarian atau ubah filter role/status.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isRoot = user.id === 1 || user.username === 'admin';
                  const initials = (user.name || user.username || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* Nama & Avatar */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: isRoot ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'linear-gradient(135deg, #059669, #0d9488)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.86rem' }}>
                              {user.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              ID Akun: #{user.id} {isRoot && <span style={{ color: '#7c3aed', fontWeight: 700 }}>• Sistem Induk</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username & Kontak */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#047857' }}>
                          <span>@{user.username}</span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          {user.email || '-'}
                        </div>
                        {user.phone && user.phone !== '-' && (
                          <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '1px' }}>
                            WA: {user.phone}
                          </div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: roleBadge.bg,
                          color: roleBadge.color,
                          border: `1px solid ${roleBadge.border}`
                        }}>
                          {roleBadge.icon}
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: user.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                          color: user.status === 'Active' ? '#047857' : '#b91c1c',
                          border: user.status === 'Active' ? '1px solid #a7f3d0' : '1px solid #fecaca'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: user.status === 'Active' ? '#10b981' : '#ef4444'
                          }} />
                          {user.status === 'Active' ? 'Aktif' : (user.status === 'Suspended' ? 'Suspended' : 'Nonaktif')}
                        </span>
                      </td>

                      {/* Update Time */}
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.76rem' }}>
                        {user.updated_at ? new Date(user.updated_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : '-'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* Detail */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDetailOpen(true);
                            }}
                            style={{
                              padding: '5px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                            title="Lihat Detail Profil Akun"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditForm(user)}
                            style={{
                              padding: '5px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#1d4ed8'
                            }}
                            title="Edit Data Pengguna"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            style={{
                              padding: '5px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: '#d97706'
                            }}
                            title="Reset Password Akun"
                          >
                            <Key size={14} />
                          </button>

                          {/* Toggle Active / Inactive */}
                          {!isRoot && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              style={{
                                padding: '5px',
                                background: user.status === 'Active' ? '#fef2f2' : '#ecfdf5',
                                border: user.status === 'Active' ? '1px solid #fecaca' : '1px solid #a7f3d0',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: user.status === 'Active' ? '#dc2626' : '#059669'
                              }}
                              title={user.status === 'Active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                            >
                              <Power size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          {!isRoot && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              style={{
                                padding: '5px',
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#b91c1c'
                              }}
                              title="Hapus Pengguna"
                            >
                              <Trash2 size={14} />
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
        </div>
      </div>

      {/* ================= MODAL TAMBAH / EDIT PENGGUNA ================= */}
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
            borderRadius: '14px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header Modal */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              color: '#ffffff',
              borderRadius: '14px 14px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {formMode === 'add' ? <Plus size={18} /> : <Edit3 size={18} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {formMode === 'add' ? 'Tambah Pengguna Sistem Baru' : `Edit Akun Pengguna: ${formData.name}`}
                  </h3>
                  <p style={{ fontSize: '0.72rem', margin: 0, color: 'rgba(255, 255, 255, 0.85)' }}>
                    Atur data login, username, kontak, dan hak akses otorisasi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleFormSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nama Lengkap */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Nama Lengkap Pengguna <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. M. Rasyid Al-Hafidz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Username & Role Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Username Login <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: rasyid"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Huruf kecil, tanpa spasi</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Hak Akses / Role <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Super Admin">Super Admin (Akses Penuh)</option>
                    <option value="Pengasuh">Pengasuh (Dewan Pengasuh)</option>
                    <option value="Ustadz">Ustadz (Guru & Pengajar)</option>
                    <option value="Musyrif">Musyrif (Pembina Asrama)</option>
                    <option value="Keamanan">Keamanan (Disiplin & Ta'zir)</option>
                    <option value="Wali Santri">Wali Santri (Monitoring)</option>
                  </select>
                </div>
              </div>

              {/* Email & No HP Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@pesantren.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Status Akun */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Status Akun
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {['Active', 'Inactive', 'Suspended'].map((st) => (
                    <label key={st} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === st}
                        onChange={() => setFormData({ ...formData, status: st })}
                      />
                      <span style={{
                        fontWeight: formData.status === st ? 700 : 400,
                        color: st === 'Active' ? '#059669' : (st === 'Suspended' ? '#b45309' : '#64748b')
                      }}>
                        {st === 'Active' ? 'Active (Aktif)' : (st === 'Inactive' ? 'Inactive (Nonaktif)' : 'Suspended')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Section */}
              <div style={{
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginTop: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0f172a' }}>
                  <Lock size={15} color="#059669" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {formMode === 'add' ? 'Atur Password Akun' : 'Ganti Password (Opsional)'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                      {formMode === 'add' ? 'Password Baru' : 'Password Baru (Kosongkan jika tetap)'}
                    </label>
                    <input
                      type="password"
                      placeholder={formMode === 'add' ? 'Minimal 5 karakter' : 'Biarkan kosong jika tidak diganti'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', marginBottom: '4px' }}>
                      Konfirmasi Password
                    </label>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        outline: 'none',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '10px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)'
                  }}
                >
                  <Save size={15} />
                  <span>{submitting ? 'Menyimpan...' : (formMode === 'add' ? 'Simpan Pengguna' : 'Perbarui Pengguna')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RESET PASSWORD CEPAT ================= */}
      {isResetOpen && resetTargetUser && (
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
            borderRadius: '14px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#d97706',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>
                  Reset Password Akun
                </h3>
              </div>
              <button
                onClick={() => setIsResetOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px 20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px'
                }}>
                  <Key size={22} />
                </div>
                <h4 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  {resetTargetUser.name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                  Username: <strong>@{resetTargetUser.username}</strong>
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Password Baru
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '1px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(newPasswordVal)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      color: '#334155'
                    }}
                    title="Salin Password ke Clipboard"
                  >
                    {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setNewPasswordVal('123456')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f1f5f9',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Set: 123456
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordVal('santri2026')}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f1f5f9',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Set: santri2026
                </button>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid #fed7aa',
                    background: '#fff7ed',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#c2410c',
                    cursor: 'pointer'
                  }}
                >
                  Acak Password
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setIsResetOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteResetPassword}
                  disabled={resetting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#d97706',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {resetting ? 'Memproses...' : 'Terapkan Password Baru'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL PENGGUNA ================= */}
      {isDetailOpen && selectedUser && (
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
            borderRadius: '14px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} />
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>
                  Informasi Profil Pengguna
                </h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  color: '#ffffff',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}>
                  {(selectedUser.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedUser.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}>
                    @{selectedUser.username}
                  </span>
                  <span>•</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: selectedUser.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                    color: selectedUser.status === 'Active' ? '#047857' : '#b91c1c'
                  }}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Hak Akses / Role:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedUser.role}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Email:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedUser.email || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>No. Handphone:</span>
                  <strong style={{ color: '#0284c7' }}>{selectedUser.phone || '-'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Tanggal Dibuat:</span>
                  <span style={{ color: '#334155' }}>
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openEditForm(selectedUser);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
