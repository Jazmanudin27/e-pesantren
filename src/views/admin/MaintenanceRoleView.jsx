import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wrench, 
  Power, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Save, 
  Eye, 
  AlertTriangle, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Building, 
  Smartphone,
  X,
  Search,
  Edit3,
  Shield,
  Check,
  Info
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import MaintenanceScreen from '../../components/MaintenanceScreen';

export default function MaintenanceRoleView() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'maintenance' | 'normal'

  // Modal Preview State
  const [previewRole, setPreviewRole] = useState(null);

  // Modal Edit Detail State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    role_key: '',
    role_name: '',
    description: '',
    is_maintenance: false,
    message: '',
    estimated_time: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/maintenance/settings');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSettings(res.data.data);
      } else {
        const statusRes = await axios.get('/api/maintenance/status');
        if (statusRes.data?.success && statusRes.data.data) {
          const arr = Object.values(statusRes.data.data);
          setSettings(arr);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat setting maintenance:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (item) => {
    const nextState = !item.is_maintenance;
    const actionTitle = nextState ? 'Aktifkan Mode Maintenance?' : 'Buka Akses Normal?';
    const confirmMsg = nextState 
      ? `Yakin ingin mengaktifkan mode maintenance untuk "${item.role_name}"? Pengguna dengan role ini akan langsung dialihkan ke layar perbaikan dan tidak dapat mengakses fitur portal.`
      : `Buka kembali akses untuk "${item.role_name}"? Pengguna dapat login dan menggunakan portal kembali secara normal.`;

    const confirmed = await showConfirm(actionTitle, confirmMsg);
    if (!confirmed) return;

    try {
      setSavingKey(item.role_key);
      const res = await axios.post('/api/maintenance/toggle', {
        role_key: item.role_key,
        is_maintenance: nextState,
        message: item.message,
        estimated_time: item.estimated_time
      });

      if (res.data?.success) {
        toastSuccess(
          nextState ? 'Maintenance Diaktifkan!' : 'Akses Normal Dibuka!',
          res.data.message || `Status role ${item.role_name} berhasil diperbarui.`
        );
        setSettings(prev => prev.map(s => s.role_key === item.role_key ? { ...s, is_maintenance: nextState } : s));
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengubah status maintenance');
      }
    } catch (err) {
      showError('Gagal Mengubah Status', err.response?.data?.message || err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleOpenEditModal = (item) => {
    setEditFormData({
      role_key: item.role_key,
      role_name: item.role_name,
      description: item.description || '',
      is_maintenance: Boolean(item.is_maintenance),
      message: item.message || '',
      estimated_time: item.estimated_time || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditModal = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSubmittingEdit(true);
      const res = await axios.post('/api/maintenance/toggle', {
        role_key: editFormData.role_key,
        is_maintenance: editFormData.is_maintenance,
        message: editFormData.message,
        estimated_time: editFormData.estimated_time
      });

      if (res.data?.success) {
        toastSuccess('Berhasil Disimpan!', `Pengaturan maintenance untuk ${editFormData.role_name} berhasil disimpan.`);
        setSettings(prev => prev.map(s => s.role_key === editFormData.role_key ? {
          ...s,
          is_maintenance: editFormData.is_maintenance,
          message: editFormData.message,
          estimated_time: editFormData.estimated_time
        } : s));
        setIsEditModalOpen(false);
      } else {
        showError('Gagal', res.data?.message || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'wali':
        return <Users size={16} color="#0284c7" />;
      case 'pengajar':
        return <GraduationCap size={16} color="#059669" />;
      case 'keuangan':
        return <CreditCard size={16} color="#d97706" />;
      case 'asrama':
        return <Building size={16} color="#8b5cf6" />;
      case 'santri':
        return <Smartphone size={16} color="#0d9488" />;
      default:
        return <Wrench size={16} color="#64748b" />;
    }
  };

  // Filter List
  const filteredSettings = settings.filter(item => {
    const s = search.toLowerCase();
    const matchSearch = 
      (item.role_name && item.role_name.toLowerCase().includes(s)) ||
      (item.role_key && item.role_key.toLowerCase().includes(s)) ||
      (item.description && item.description.toLowerCase().includes(s)) ||
      (item.message && item.message.toLowerCase().includes(s));

    let matchFilter = true;
    if (filterMode === 'maintenance') matchFilter = Boolean(item.is_maintenance);
    if (filterMode === 'normal') matchFilter = !item.is_maintenance;

    return matchSearch && matchFilter;
  });

  const totalRoles = settings.length;
  const countMaintenance = settings.filter(s => s.is_maintenance).length;
  const countNormal = totalRoles - countMaintenance;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (SEPERTI DATA MASTER USER/SANTRI) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL ROLE SISTEM</div>
            <div className="stat-colored-number">{totalRoles} Role</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">OPERASIONAL NORMAL</div>
            <div className="stat-colored-number">{countNormal} Role</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className={`stat-card-colored ${countMaintenance > 0 ? 'stat-card-amber' : 'stat-card-purple'}`}>
          <div>
            <div className="stat-colored-title">SEDANG MAINTENANCE</div>
            <div className="stat-colored-number">{countMaintenance} Role</div>
          </div>
          <div className="stat-colored-icon-box">
            <Wrench size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">STATUS AKSES PORTAL</div>
            <div className="stat-colored-number" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
              {countMaintenance > 0 ? 'Sebagian Dibatasi' : 'Semua Normal'}
            </div>
          </div>
          <div className="stat-colored-icon-box">
            <Power size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP (SEPERTI DATA MASTER USER/SANTRI) */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Wrench size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Pengaturan Maintenance Per Role</h2>
            <p>Kendalikan izin akses dan status pemeliharaan portal sistem terpadu per modul &amp; hak akses pengguna</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => { window.location.hash = '#users'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={14} /> Data Pengguna
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={fetchSettings} 
            disabled={loading}
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR (SEPERTI DATA MASTER USER/SANTRI) */}
      <div className="tab-filter-bar">
        <button 
          type="button"
          className={`tab-btn ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          <Users size={14} /> Semua Role ({totalRoles})
        </button>
        <button 
          type="button"
          className={`tab-btn ${filterMode === 'normal' ? 'active' : ''}`}
          onClick={() => setFilterMode('normal')}
        >
          <CheckCircle2 size={14} /> Operasional Normal ({countNormal})
        </button>
        <button 
          type="button"
          className={`tab-btn ${filterMode === 'maintenance' ? 'active' : ''}`}
          onClick={() => setFilterMode('maintenance')}
          style={{
            color: filterMode === 'maintenance' ? '#ffffff' : (countMaintenance > 0 ? '#b91c1c' : undefined),
            backgroundColor: filterMode === 'maintenance' ? '#dc2626' : (countMaintenance > 0 ? '#fef2f2' : undefined),
            borderColor: countMaintenance > 0 ? '#fecaca' : undefined
          }}
        >
          <AlertTriangle size={14} /> Sedang Maintenance ({countMaintenance})
        </button>
      </div>

      {/* 4. FILTER SEARCH BOX (SEPERTI DATA MASTER USER/SANTRI) */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari role, key modul, cakupan portal, atau pesan maintenance..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
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
      </div>

      {/* 5. DATA TABLE (SEPERTI DATA MASTER USER/SANTRI) */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div>Memuat data konfigurasi maintenance...</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: "45px" }}>NO</th>
                <th style={{ width: "230px" }}>ROLE &amp; MODUL</th>
                <th style={{ width: "220px" }}>CAKUPAN AKSES / PORTAL</th>
                <th className="td-center" style={{ width: "170px" }}>STATUS OPERASIONAL</th>
                <th>PESAN NOTIFIKASI PENGGUNA</th>
                <th className="td-center" style={{ width: "170px" }}>ESTIMASI SELESAI</th>
                <th className="td-center" style={{ width: "130px" }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Wrench size={32} color="#94a3b8" />
                      <span style={{ fontWeight: 600 }}>Tidak ada data role yang sesuai pencarian.</span>
                      <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>Coba periksa kata kunci pencarian atau ubah filter tab.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSettings.map((item, idx) => {
                  const isMaint = Boolean(item.is_maintenance);
                  const isSaving = savingKey === item.role_key;

                  return (
                    <tr
                      key={item.role_key}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isMaint ? "#fef2f2" : "#ffffff",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => {
                        if (!isMaint) e.currentTarget.style.backgroundColor = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isMaint) e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                    >
                      {/* NO */}
                      <td className="td-center" style={{ color: "#64748b", fontWeight: 600 }}>
                        {idx + 1}
                      </td>

                      {/* ROLE & MODUL */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              background: isMaint ? "#fee2e2" : "#f1f5f9",
                              border: isMaint ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0
                            }}
                          >
                            {getRoleIcon(item.role_key)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: isMaint ? "#991b1b" : "#0f172a", fontSize: "0.86rem" }}>
                              {item.role_name}
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>Key:</span>
                              <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: "4px", fontWeight: 700, color: "#0f172a", fontSize: "0.7rem" }}>
                                {item.role_key}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CAKUPAN AKSES */}
                      <td>
                        <div style={{ fontSize: "0.78rem", color: "#334155", lineHeight: 1.4 }}>
                          {item.description || 'Layanan modul terpadu'}
                        </div>
                      </td>

                      {/* STATUS OPERASIONAL */}
                      <td className="td-center">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            backgroundColor: isMaint ? "#fee2e2" : "#ecfdf5",
                            color: isMaint ? "#b91c1c" : "#047857",
                            border: isMaint ? "1px solid #fca5a5" : "1px solid #a7f3d0"
                          }}
                        >
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              backgroundColor: isMaint ? "#ef4444" : "#10b981",
                              boxShadow: isMaint ? "0 0 6px rgba(239, 68, 68, 0.6)" : "0 0 6px rgba(16, 185, 129, 0.6)"
                            }}
                          />
                          {isMaint ? "SEDANG MAINTENANCE" : "OPERASIONAL NORMAL"}
                        </span>
                      </td>

                      {/* PESAN NOTIFIKASI PENGGUNA */}
                      <td>
                        <div style={{ fontSize: "0.76rem", color: isMaint ? "#b91c1c" : "#475569", lineHeight: 1.45, fontStyle: isMaint ? "normal" : "italic" }}>
                          "{item.message || '-'}"
                        </div>
                      </td>

                      {/* ESTIMASI SELESAI */}
                      <td className="td-center">
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            backgroundColor: "#f8fafc",
                            color: "#475569",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <Clock size={12} color="#64748b" />
                          {item.estimated_time || 'Segera normal'}
                        </span>
                      </td>

                      {/* AKSI */}
                      <td className="td-center">
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {/* Toggle Power Switch */}
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => handleToggle(item)}
                            disabled={isSaving}
                            style={{
                              backgroundColor: isMaint ? "#10b981" : "#ef4444",
                              opacity: isSaving ? 0.6 : 1
                            }}
                            title={isMaint ? "Buka Akses Kembali (Operasional Normal)" : "Aktifkan Mode Maintenance (Kunci Akses)"}
                          >
                            <Power size={13} />
                          </button>

                          {/* Edit Detail Modal */}
                          <button
                            type="button"
                            className="btn-action btn-action-edit"
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Pesan & Estimasi Maintenance"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Preview View */}
                          <button
                            type="button"
                            className="btn-action btn-action-view"
                            onClick={() => setPreviewRole(item)}
                            title="Lihat Pratinjau Layar Pemeliharaan"
                            style={{ backgroundColor: "#0284c7" }}
                          >
                            <Eye size={13} />
                          </button>
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

      {/* MODAL EDIT PENGATURAN MAINTENANCE (SEPERTI FORM MODAL MASTER DATA) */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div 
            className="modal-container" 
            style={{ maxWidth: "560px", width: "95%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                    Pengaturan Maintenance: {editFormData.role_name}
                  </h3>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    Modul Key: <code>{editFormData.role_key}</code>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditModal}>
              <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Status Toggle Box */}
                <div 
                  style={{ 
                    padding: "14px 16px", 
                    borderRadius: "12px", 
                    background: editFormData.is_maintenance ? "#fef2f2" : "#ecfdf5", 
                    border: editFormData.is_maintenance ? "1.5px solid #fecaca" : "1.5px solid #a7f3d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: editFormData.is_maintenance ? "#991b1b" : "#065f46" }}>
                      {editFormData.is_maintenance ? "MODE MAINTENANCE DIAKTIFKAN" : "OPERASIONAL NORMAL"}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: editFormData.is_maintenance ? "#b91c1c" : "#047857", marginTop: "2px" }}>
                      {editFormData.is_maintenance 
                        ? "Akses pengguna role ini DIBLOKIR sementara." 
                        : "Akses login dan fitur portal role ini terbuka normal."}
                    </div>
                  </div>

                  <label style={{ position: "relative", display: "inline-block", width: "48px", height: "26px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={editFormData.is_maintenance}
                      onChange={(e) => setEditFormData({ ...editFormData, is_maintenance: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: editFormData.is_maintenance ? "#ef4444" : "#cbd5e1",
                        transition: ".2s",
                        borderRadius: "34px"
                      }}
                    />
                    <span 
                      style={{
                        position: "absolute",
                        content: '""',
                        height: "20px",
                        width: "20px",
                        left: editFormData.is_maintenance ? "24px" : "3px",
                        bottom: "3px",
                        backgroundColor: "white",
                        transition: ".2s",
                        borderRadius: "50%",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}
                    />
                  </label>
                </div>

                {/* Pesan Notifikasi */}
                <div>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Pesan Pemberitahuan Resmi ke Pengguna <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={editFormData.message}
                    onChange={(e) => setEditFormData({ ...editFormData, message: e.target.value })}
                    placeholder="Tuliskan pesan penjelasan perbaikan sistem..."
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.8rem",
                      lineHeight: 1.45,
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical"
                    }}
                  />
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
                    Pesan ini akan tampil di kotak pengumuman saat pengguna membuka portal.
                  </div>
                </div>

                {/* Estimasi Selesai */}
                <div>
                  <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Estimasi Selesai (Opsional)
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <div style={{ position: "absolute", left: "10px", color: "#94a3b8" }}>
                      <Clock size={15} />
                    </div>
                    <input
                      type="text"
                      value={editFormData.estimated_time}
                      onChange={(e) => setEditFormData({ ...editFormData, estimated_time: e.target.value })}
                      placeholder="Contoh: Hari ini pukul 21:00 WIB / Segera kembali normal"
                      style={{
                        width: "100%",
                        padding: "9px 12px 9px 34px",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "0.8rem",
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px" }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmittingEdit}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmittingEdit}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Save size={14} />
                  <span>{isSubmittingEdit ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW NOTIFIKASI PENGGUNA */}
      {previewRole && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setPreviewRole(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              animation: 'slideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', color: '#ffffff' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} /> Pratinjau Tampilan Pengguna ({previewRole.role_name})
              </div>
              <button
                type="button"
                onClick={() => setPreviewRole(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <MaintenanceScreen
              roleKey={previewRole.role_key}
              roleName={previewRole.role_name}
              message={previewRole.message}
              estimatedTime={previewRole.estimated_time}
              onRefresh={() => setPreviewRole(null)}
              onLogout={() => setPreviewRole(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
