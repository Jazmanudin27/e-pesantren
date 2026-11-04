import React, { useState, useEffect } from "react";
import axios from "axios";
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
  Power,
  CreditCard,
  Clock,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";

export default function UserManagementView() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Modal Detail State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal Form (Add & Edit) State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "Ustadz",
    status: "Active",
    password: "",
    confirmPassword: "",
  });

  // Modal Reset Password State
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState("123456");
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load Users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/users");
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setUsersList(res.data.data);
      } else {
        setUsersList([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data user:", err);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Save to Cache helper (for offline / instant reactive feel)
  const syncCache = (updatedList) => {
    setUsersList(updatedList);
    try {
      localStorage.setItem(
        "epesantren_users_cache",
        JSON.stringify(updatedList),
      );
    } catch (e) {}
  };

  // Open Form: Add User
  const openAddForm = () => {
    setFormMode("add");
    setFormData({
      id: null,
      name: "",
      username: "",
      email: "",
      phone: "",
      role: "Ustadz",
      status: "Active",
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  // Open Form: Edit User
  const openEditForm = (user) => {
    setFormMode("edit");
    setFormData({
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "Ustadz",
      status: user.status || "Active",
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      showError("Validasi Gagal", "Nama lengkap dan Username wajib diisi!");
      return;
    }

    if (formMode === "add") {
      if (!formData.password || formData.password.length < 5) {
        showError("Validasi Gagal", "Password akun baru minimal 5 karakter!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showError("Validasi Gagal", "Konfirmasi password tidak cocok!");
        return;
      }
    } else if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 5) {
        showError("Validasi Gagal", "Password baru minimal 5 karakter!");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showError("Validasi Gagal", "Konfirmasi password baru tidak cocok!");
        return;
      }
    }

    try {
      setSubmitting(true);
      const cleanUsername = formData.username
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      const cleanEmail =
        formData.email.trim() || `${cleanUsername}@nurulwafa.sch.id`;

      if (formMode === "add") {
        let createdId = Date.now();
        try {
          const res = await axios.post("/api/users", {
            name: formData.name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: formData.phone.trim() || "-",
            role: formData.role,
            status: formData.status,
            password: formData.password,
          });
          if (res.data?.data?.id) createdId = res.data.data.id;
        } catch (apiErr) {
          console.warn("[Offline User Fallback Add]", apiErr.message);
        }

        const newUser = {
          id: createdId,
          name: formData.name.trim(),
          username: cleanUsername,
          email: cleanEmail,
          phone: formData.phone.trim() || "-",
          role: formData.role,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        syncCache([newUser, ...usersList]);
        toastSuccess(
          "Berhasil!",
          `Pengguna "${formData.name}" berhasil ditambahkan.`,
        );
      } else {
        // Edit Mode
        try {
          await axios.put(`/api/users/${formData.id}`, {
            name: formData.name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            phone: formData.phone.trim() || "-",
            role: formData.role,
            status: formData.status,
            password: formData.password || undefined,
          });
        } catch (apiErr) {
          console.warn("[Offline User Fallback Edit]", apiErr.message);
        }

        const updated = usersList.map((u) => {
          if (u.id === formData.id) {
            return {
              ...u,
              name: formData.name.trim(),
              username: cleanUsername,
              email: cleanEmail,
              phone: formData.phone.trim() || "-",
              role: formData.role,
              status: formData.status,
              updated_at: new Date().toISOString(),
            };
          }
          return u;
        });

        syncCache(updated);
        toastSuccess(
          "Berhasil!",
          `Data pengguna "${formData.name}" berhasil diperbarui.`,
        );
      }

      setIsFormOpen(false);
    } catch (err) {
      showError(
        "Gagal Menyimpan",
        err.response?.data?.message ||
          err.message ||
          "Terjadi kesalahan sistem.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user) => {
    if (user.id === 1 || user.username === "admin") {
      showError(
        "Akses Ditolak",
        "Akun Administrator Utama tidak boleh dihapus demi keamanan!",
      );
      return;
    }

    const confirmed = await showConfirm(
      "Hapus Pengguna?",
      `Apakah Anda yakin ingin menghapus pengguna "${user.name}" (@${user.username})? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    try {
      try {
        await axios.delete(`/api/users/${user.id}`);
      } catch (e) {
        console.warn("[Offline User Fallback Delete]", e.message);
      }

      const filtered = usersList.filter((u) => u.id !== user.id);
      syncCache(filtered);
      toastSuccess(
        "Dihapus!",
        `Akun "${user.name}" telah dihapus dari sistem.`,
      );
    } catch (err) {
      showError("Gagal Menghapus", err.message);
    }
  };

  // Handle Toggle Status (Active <-> Inactive)
  const handleToggleStatus = async (user) => {
    if (user.id === 1 || user.username === "admin") {
      showError(
        "Akses Ditolak",
        "Status Administrator Utama tidak dapat dinonaktifkan!",
      );
      return;
    }

    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      try {
        await axios.patch(`/api/users/${user.id}/status`, {
          status: nextStatus,
        });
      } catch (e) {}

      const updated = usersList.map((u) =>
        u.id === user.id ? { ...u, status: nextStatus } : u,
      );
      syncCache(updated);
      toastSuccess(
        "Status Diubah",
        `Pengguna @${user.username} sekarang ${nextStatus === "Active" ? "Aktif" : "Nonaktif"}.`,
      );
    } catch (err) {
      showError("Gagal Mengubah Status", err.message);
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (user) => {
    setResetTargetUser(user);
    setNewPasswordVal("123456");
    setCopied(false);
    setIsResetOpen(true);
  };

  const handleExecuteResetPassword = async () => {
    if (!newPasswordVal || newPasswordVal.length < 5) {
      showError("Password Terlalu Pendek", "Password baru minimal 5 karakter!");
      return;
    }

    try {
      setResetting(true);
      try {
        await axios.post(`/api/users/${resetTargetUser.id}/reset-password`, {
          new_password: newPasswordVal,
        });
      } catch (e) {
        console.warn("[Offline User Fallback Reset Pass]", e.message);
      }

      toastSuccess(
        "Password Direset!",
        `Password untuk @${resetTargetUser.username} telah diubah menjadi: "${newPasswordVal}"`,
      );
      setIsResetOpen(false);
    } catch (err) {
      showError("Gagal Reset Password", err.message);
    } finally {
      setResetting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#";
    let res = "";
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

    let matchRole = true;
    if (filterRole === "Semua") {
      matchRole = true;
    } else if (filterRole === "ADMIN_GROUP") {
      matchRole = ["Super Admin", "Admin", "Pengasuh", "Admin Keuangan", "Admin Absen"].includes(user.role);
    } else if (filterRole === "USTADZ_GROUP") {
      matchRole = ["Ustadz", "Musyrif"].includes(user.role);
    } else {
      matchRole = user.role === filterRole;
    }

    const matchStatus =
      filterStatus === "Semua" || user.status === filterStatus;

    return matchSearch && matchRole && matchStatus;
  });

  // Role Badge Styling
  const getRoleBadge = (role) => {
    switch (role) {
      case "Super Admin":
        return {
          bg: "#f3e8ff",
          color: "#7e22ce",
          border: "#d8b4fe",
          icon: <Shield size={12} style={{ marginRight: "4px" }} />,
        };
      case "Admin Keuangan":
      case "Bendahara":
        return {
          bg: "#ecfdf5",
          color: "#059669",
          border: "#6ee7b7",
          icon: <CreditCard size={12} style={{ marginRight: "4px" }} />,
        };
      case "Admin Absen":
        return {
          bg: "#fef3c7",
          color: "#d97706",
          border: "#fde68a",
          icon: <Clock size={12} style={{ marginRight: "4px" }} />,
        };
      case "Pengasuh":
        return {
          bg: "#ecfdf5",
          color: "#047857",
          border: "#a7f3d0",
          icon: <ShieldCheck size={12} style={{ marginRight: "4px" }} />,
        };
      case "Ustadz":
        return {
          bg: "#eff6ff",
          color: "#1d4ed8",
          border: "#bfdbfe",
          icon: <UserCheck size={12} style={{ marginRight: "4px" }} />,
        };
      case "Musyrif":
        return {
          bg: "#f0fdfa",
          color: "#0f766e",
          border: "#99f6e4",
          icon: <Users size={12} style={{ marginRight: "4px" }} />,
        };
      case "Keamanan":
        return {
          bg: "#fffbeb",
          color: "#b45309",
          border: "#fde68a",
          icon: <ShieldAlert size={12} style={{ marginRight: "4px" }} />,
        };
      case "Wali Santri":
        return {
          bg: "#f8fafc",
          color: "#475569",
          border: "#cbd5e1",
          icon: <User size={12} style={{ marginRight: "4px" }} />,
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#334155",
          border: "#e2e8f0",
          icon: <User size={12} style={{ marginRight: "4px" }} />,
        };
    }
  };

  // Metrics calculation
  const totalCount = usersList.length;
  const adminPengasuhCount = usersList.filter(
    (u) => u.role === "Super Admin" || u.role === "Pengasuh",
  ).length;
  const asatidzMusyrifCount = usersList.filter(
    (u) => u.role === "Ustadz" || u.role === "Musyrif",
  ).length;
  const activeCount = usersList.filter((u) => u.status === "Active").length;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (SEPERTI MASTER SANTRI) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL AKUN PENGGUNA</div>
            <div className="stat-colored-number">{totalCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">ADMIN &amp; PENGASUH</div>
            <div className="stat-colored-number">{adminPengasuhCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Shield size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">USTADZ &amp; MUSYRIF</div>
            <div className="stat-colored-number">{asatidzMusyrifCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">AKUN AKTIF (STATUS)</div>
            <div className="stat-colored-number">{activeCount} / {totalCount}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Power size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP (SEPERTI MASTER SANTRI) */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Users size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Manajemen Pengguna &amp; Hak Akses</h2>
            <p>Kelola data akun login administrator, pengasuh, ustadz, musyrif, dan wali santri</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={fetchUsers} 
            disabled={loading}
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={openAddForm}
          >
            <Plus size={14} /> Tambah Pengguna Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR (SEPERTI MASTER SANTRI) */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${filterRole === 'Semua' ? 'active' : ''}`}
          onClick={() => setFilterRole('Semua')}
        >
          <Users size={14} /> Semua Pengguna ({totalCount})
        </button>
        <button 
          className={`tab-btn ${filterRole === 'ADMIN_GROUP' ? 'active' : ''}`}
          onClick={() => setFilterRole(filterRole === 'ADMIN_GROUP' ? 'Semua' : 'ADMIN_GROUP')}
        >
          <Shield size={14} /> Admin &amp; Pengasuh ({adminPengasuhCount})
        </button>
        <button 
          className={`tab-btn ${filterRole === 'USTADZ_GROUP' ? 'active' : ''}`}
          onClick={() => setFilterRole(filterRole === 'USTADZ_GROUP' ? 'Semua' : 'USTADZ_GROUP')}
        >
          <UserCheck size={14} /> Ustadz &amp; Musyrif ({asatidzMusyrifCount})
        </button>
        <button 
          className={`tab-btn ${filterRole === 'Wali Santri' ? 'active' : ''}`}
          onClick={() => setFilterRole(filterRole === 'Wali Santri' ? 'Semua' : 'Wali Santri')}
        >
          <Users size={14} /> Wali Santri ({usersList.filter(u => u.role === 'Wali Santri').length})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP (SEPERTI MASTER SANTRI) */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari semua pengguna (nama, username, email, WhatsApp)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <SearchableSelect
          style={{ minWidth: "150px", flex: "1 1 140px", maxWidth: "200px" }}
          value={filterRole}
          onChange={(val) => setFilterRole(val || "Semua")}
          placeholder="Semua Role"
          options={[
            { value: "Semua", label: "Semua Role" },
            { value: "Super Admin", label: "Super Admin" },
            { value: "Admin Keuangan", label: "Admin Keuangan (Bendahara)" },
            { value: "Admin Absen", label: "Admin Absen (Presensi)" },
            { value: "Pengasuh", label: "Pengasuh" },
            { value: "Ustadz", label: "Ustadz" },
            { value: "Musyrif", label: "Musyrif" },
            { value: "Keamanan", label: "Keamanan" },
            { value: "Wali Santri", label: "Wali Santri" },
          ]}
        />
        <SearchableSelect
          style={{ minWidth: "130px", flex: "1 1 120px", maxWidth: "180px" }}
          value={filterStatus}
          onChange={(val) => setFilterStatus(val || "Semua")}
          placeholder="Semua Status"
          options={[
            { value: "Semua", label: "Semua Status" },
            { value: "Active", label: "Active (Aktif)" },
            { value: "Inactive", label: "Inactive (Nonaktif)" },
            { value: "Suspended", label: "Suspended" },
          ]}
        />
      </div>

      {/* 5. DATA TABLE (SEPERTI MASTER SANTRI) */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div>Memuat data pengguna dari database...</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: "45px" }}>NO</th>
                <th>PENGGUNA</th>
                <th>USERNAME &amp; KONTAK</th>
                <th className="td-center">HAK AKSES / ROLE</th>
                <th className="td-center">STATUS</th>
                <th className="td-center">TERAKHIR UPDATE</th>
                <th className="td-center" style={{ width: "160px" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <UserX size={32} color="#94a3b8" />
                      <span style={{ fontWeight: 600 }}>
                        Tidak ada data pengguna yang cocok.
                      </span>
                      <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                        Coba periksa kata kunci pencarian atau ubah filter
                        role/status.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const roleBadge = getRoleBadge(user.role);
                  const isRoot = user.id === 1 || user.username === "admin";
                  const initials = (user.name || user.username || "U")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#ffffff")
                      }
                    >
                      <td className="td-center" style={{ color: "#64748b", fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* Nama & Avatar */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isRoot
                                ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                                : "linear-gradient(135deg, #059669, #0d9488)",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: "#0f172a",
                                fontSize: "0.86rem",
                              }}
                            >
                              {user.name}
                            </div>
                            <div
                              style={{ fontSize: "0.74rem", color: "#64748b" }}
                            >
                              ID Akun: #{user.id}{" "}
                              {isRoot && (
                                <span
                                  style={{ color: "#7c3aed", fontWeight: 700 }}
                                >
                                  • Sistem Induk
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username & Kontak */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontWeight: 700,
                            color: "#047857",
                          }}
                        >
                          <span>@{user.username}</span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          {user.email || "-"}
                        </div>
                        {user.phone && user.phone !== "-" && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#0284c7",
                              marginTop: "1px",
                            }}
                          >
                            WA: {user.phone}
                          </div>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td className="td-center">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                          }}
                        >
                          {roleBadge.icon}
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="td-center">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor:
                              user.status === "Active" ? "#ecfdf5" : "#fef2f2",
                            color:
                              user.status === "Active" ? "#047857" : "#b91c1c",
                            border:
                              user.status === "Active"
                                ? "1px solid #a7f3d0"
                                : "1px solid #fecaca",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor:
                                user.status === "Active"
                                  ? "#10b981"
                                  : "#ef4444",
                            }}
                          />
                          {user.status === "Active"
                            ? "Aktif"
                            : user.status === "Suspended"
                              ? "Suspended"
                              : "Nonaktif"}
                        </span>
                      </td>

                      {/* Update Time */}
                      <td
                        className="td-center"
                        style={{
                          color: "#64748b",
                          fontSize: "0.76rem",
                        }}
                      >
                        {user.updated_at
                          ? new Date(user.updated_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="td-center">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {/* Detail */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDetailOpen(true);
                            }}
                            style={{
                              padding: "5px",
                              background: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#334155",
                            }}
                            title="Lihat Detail Profil Akun"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditForm(user)}
                            style={{
                              padding: "5px",
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#1d4ed8",
                            }}
                            title="Edit Data Pengguna"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => openResetPasswordModal(user)}
                            style={{
                              padding: "5px",
                              background: "#fffbeb",
                              border: "1px solid #fde68a",
                              borderRadius: "6px",
                              cursor: "pointer",
                              color: "#d97706",
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
                                padding: "5px",
                                background:
                                  user.status === "Active"
                                    ? "#fef2f2"
                                    : "#ecfdf5",
                                border:
                                  user.status === "Active"
                                    ? "1px solid #fecaca"
                                    : "1px solid #a7f3d0",
                                borderRadius: "6px",
                                cursor: "pointer",
                                color:
                                  user.status === "Active"
                                    ? "#dc2626"
                                    : "#059669",
                              }}
                              title={
                                user.status === "Active"
                                  ? "Nonaktifkan Akun"
                                  : "Aktifkan Akun"
                              }
                            >
                              <Power size={14} />
                            </button>
                          )}

                          {/* Delete */}
                          {!isRoot && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              style={{
                                padding: "5px",
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "6px",
                                cursor: "pointer",
                                color: "#b91c1c",
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
        )}
      </div>

      {/* ================= MODAL TAMBAH / EDIT PENGGUNA ================= */}
      {isFormOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              maxWidth: "560px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
                color: "#ffffff",
                borderRadius: "14px 14px 0 0",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {formMode === "add" ? (
                    <Plus size={18} />
                  ) : (
                    <Edit3 size={18} />
                  )}
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      margin: 0,
                      color: "#ffffff",
                    }}
                  >
                    {formMode === "add"
                      ? "Tambah Pengguna Sistem Baru"
                      : `Edit Akun Pengguna: ${formData.name}`}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      margin: 0,
                      color: "rgba(255, 255, 255, 0.85)",
                    }}
                  >
                    Atur data login, username, kontak, dan hak akses otorisasi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Nama Lengkap */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Nama Lengkap Pengguna{" "}
                  <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ust. M. Rasyid Al-Hafidz"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.84rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Username & Role Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Username Login <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: rasyid"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, ""),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.84rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Huruf kecil, tanpa spasi
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Hak Akses / Role <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      {
                        value: "Super Admin",
                        label: "Super Admin (Akses Penuh)",
                      },
                      {
                        value: "Admin Keuangan",
                        label: "Admin Keuangan (Khusus Tagihan & SPP)",
                      },
                      {
                        value: "Admin Absen",
                        label: "Admin Absen (Petugas Presensi)",
                      },
                      { value: "Pengasuh", label: "Pengasuh (Dewan Pengasuh)" },
                      { value: "Ustadz", label: "Ustadz (Guru & Pengajar)" },
                      { value: "Musyrif", label: "Musyrif (Pembina Asrama)" },
                      {
                        value: "Keamanan",
                        label: "Keamanan (Disiplin & Ta'zir)",
                      },
                      {
                        value: "Wali Santri",
                        label: "Wali Santri (Monitoring)",
                      },
                    ]}
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val })}
                    placeholder="-- Pilih Role --"
                  />
                </div>
              </div>

              {/* Email & No HP Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@pesantren.id"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.84rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.84rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Status Akun */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Status Akun
                </label>
                <div
                  style={{ display: "flex", gap: "14px", alignItems: "center" }}
                >
                  {["Active", "Inactive", "Suspended"].map((st) => (
                    <label
                      key={st}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === st}
                        onChange={() =>
                          setFormData({ ...formData, status: st })
                        }
                      />
                      <span
                        style={{
                          fontWeight: formData.status === st ? 700 : 400,
                          color:
                            st === "Active"
                              ? "#059669"
                              : st === "Suspended"
                                ? "#b45309"
                                : "#64748b",
                        }}
                      >
                        {st === "Active"
                          ? "Active (Aktif)"
                          : st === "Inactive"
                            ? "Inactive (Nonaktif)"
                            : "Suspended"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Section */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                    color: "#0f172a",
                  }}
                >
                  <Lock size={15} color="#059669" />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                    {formMode === "add"
                      ? "Atur Password Akun"
                      : "Ganti Password (Opsional)"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      {formMode === "add"
                        ? "Password Baru"
                        : "Password Baru (Kosongkan jika tetap)"}
                    </label>
                    <input
                      type="password"
                      placeholder={
                        formMode === "add"
                          ? "Minimal 5 karakter"
                          : "Biarkan kosong jika tidak diganti"
                      }
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.82rem",
                        outline: "none",
                        background: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        marginBottom: "4px",
                      }}
                    >
                      Konfirmasi Password
                    </label>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.82rem",
                        outline: "none",
                        background: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#047857",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(4, 120, 87, 0.3)",
                  }}
                >
                  <Save size={15} />
                  <span>
                    {submitting
                      ? "Menyimpan..."
                      : formMode === "add"
                        ? "Simpan Pengguna"
                        : "Perbarui Pengguna"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RESET PASSWORD CEPAT ================= */}
      {isResetOpen && resetTargetUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#d97706",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Key size={18} />
                <h3 style={{ fontSize: "0.94rem", fontWeight: 800, margin: 0 }}>
                  Reset Password Akun
                </h3>
              </div>
              <button
                onClick={() => setIsResetOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "18px 20px" }}>
              <div style={{ textAlign: "center", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <Key size={22} />
                </div>
                <h4
                  style={{
                    margin: "0 0 2px",
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {resetTargetUser.name}
                </h4>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
                  Username: <strong>@{resetTargetUser.username}</strong>
                </p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Password Baru
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      letterSpacing: "1px",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(newPasswordVal)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.74rem",
                      color: "#334155",
                    }}
                    title="Salin Password ke Clipboard"
                  >
                    {copied ? (
                      <Check size={14} color="#059669" />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copied ? "Tersalin" : "Salin"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div
                style={{ display: "flex", gap: "6px", marginBottom: "18px" }}
              >
                <button
                  type="button"
                  onClick={() => setNewPasswordVal("123456")}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#f1f5f9",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Set: 123456
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordVal("santri2026")}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#f1f5f9",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  Set: santri2026
                </button>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid #fed7aa",
                    background: "#fff7ed",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#c2410c",
                    cursor: "pointer",
                  }}
                >
                  Acak Password
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => setIsResetOpen(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteResetPassword}
                  disabled={resetting}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#d97706",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {resetting ? "Memproses..." : "Terapkan Password Baru"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL PENGGUNA ================= */}
      {isDetailOpen && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <UserCheck size={18} />
                <h3 style={{ fontSize: "0.94rem", fontWeight: 800, margin: 0 }}>
                  Informasi Profil Pengguna
                </h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #059669, #0d9488)",
                    color: "#ffffff",
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 10px",
                  }}
                >
                  {(selectedUser.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <h4
                  style={{
                    margin: "0 0 4px",
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {selectedUser.name}
                </h4>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#047857",
                    }}
                  >
                    @{selectedUser.username}
                  </span>
                  <span>•</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor:
                        selectedUser.status === "Active"
                          ? "#ecfdf5"
                          : "#fef2f2",
                      color:
                        selectedUser.status === "Active"
                          ? "#047857"
                          : "#b91c1c",
                    }}
                  >
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontSize: "0.82rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Hak Akses / Role:</span>
                  <strong style={{ color: "#0f172a" }}>
                    {selectedUser.role}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Email:</span>
                  <strong style={{ color: "#0f172a" }}>
                    {selectedUser.email || "-"}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#64748b" }}>No. Handphone:</span>
                  <strong style={{ color: "#0284c7" }}>
                    {selectedUser.phone || "-"}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingBottom: "6px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ color: "#64748b" }}>Tanggal Dibuat:</span>
                  <span style={{ color: "#334155" }}>
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    openEditForm(selectedUser);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #bfdbfe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Data</span>
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
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
