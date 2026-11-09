import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Settings,
  Cpu,
  Calendar,
  CreditCard,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Server,
  Wifi,
  WifiOff,
  Save,
  RotateCw,
  X,
  User,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { showSuccess, showError, showConfirm } from "../../utils/alert.util";

export default function OwnerSettingsView({ onLogout }) {
  const [activeSection, setActiveSection] = useState("spp"); // 'spp' | 'mesin' | 'akun'
  const [loading, setLoading] = useState(false);

  // 1. STATE SIKLUS SPP
  const [sppConfig, setSppConfig] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    keterangan: ""
  });
  const [applyToExisting, setApplyToExisting] = useState(true);
  const [savingSpp, setSavingSpp] = useState(false);

  // 2. STATE MESIN FINGERPRINT
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({
    nama_device: "",
    sn_device: "",
    ip_address: "192.168.1.201",
    port: 4370,
    lokasi: "Gerbang Utama",
    peruntukan: "Semua",
    status_koneksi: "Online"
  });

  // 3. STATE AKUN OWNER
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // FETCH SIKLUS SPP
  const fetchSiklusSpp = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/keuangan/siklus-spp");
      if (res.data?.success && res.data.data) {
        setSppConfig(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal mengambil siklus SPP:", err);
    } finally {
      setLoading(false);
    }
  };

  // FETCH PERANGKAT MESIN
  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await axios.get("/api/fingerprint/devices");
      const list = res.data?.data?.data || res.data?.data || [];
      setDevices(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn("Gagal mengambil data mesin:", err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchSiklusSpp();
    fetchDevices();
  }, []);

  // SUBMIT SIKLUS SPP
  const handleSaveSiklusSpp = async (e) => {
    e.preventDefault();
    try {
      setSavingSpp(true);
      const res = await axios.post("/api/keuangan/siklus-spp", {
        tgl_terbit_spp: parseInt(sppConfig.tgl_terbit_spp, 10),
        tgl_jatuh_tempo_spp: parseInt(sppConfig.tgl_jatuh_tempo_spp, 10),
        apply_to_existing: applyToExisting
      });
      if (res.data?.success) {
        showSuccess("Pengaturan SPP Disimpan", res.data.message || "Batas jatuh tempo tagihan SPP berhasil diperbarui.");
        fetchSiklusSpp();
      }
    } catch (err) {
      showError("Gagal Menyimpan", err.response?.data?.message || err.message);
    } finally {
      setSavingSpp(false);
    }
  };

  // OPEN MODAL TAMBAH/EDIT MESIN
  const handleOpenDeviceModal = (dev = null) => {
    if (dev) {
      setEditingDevice(dev);
      setDeviceForm({
        nama_device: dev.nama_device || "",
        sn_device: dev.sn_device || "",
        ip_address: dev.ip_address || "192.168.1.201",
        port: dev.port || 4370,
        lokasi: dev.lokasi || "Gerbang Utama",
        peruntukan: dev.peruntukan || "Semua",
        status_koneksi: dev.status_koneksi || "Online"
      });
    } else {
      setEditingDevice(null);
      setDeviceForm({
        nama_device: "",
        sn_device: "",
        ip_address: "192.168.1.201",
        port: 4370,
        lokasi: "Gerbang Utama",
        peruntukan: "Semua",
        status_koneksi: "Online"
      });
    }
    setDeviceModalOpen(true);
  };

  // SIMPAN MESIN
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    if (!deviceForm.nama_device || !deviceForm.sn_device) {
      showError("Validasi Gagal", "Nama perangkat dan Serial Number wajib diisi.");
      return;
    }

    try {
      if (editingDevice) {
        await axios.put(`/api/fingerprint/devices/${editingDevice.id}`, deviceForm);
        showSuccess("Berhasil", "Data mesin fingerprint berhasil diperbarui.");
      } else {
        await axios.post("/api/fingerprint/devices", deviceForm);
        showSuccess("Berhasil", "Mesin fingerprint baru berhasil ditambahkan.");
      }
      setDeviceModalOpen(false);
      fetchDevices();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  // HAPUS MESIN
  const handleDeleteDevice = async (id, nama) => {
    const ok = await showConfirm("Hapus Perangkat Mesin?", `Yakin ingin menghapus ${nama || "mesin ini"}?`);
    if (!ok) return;

    try {
      await axios.delete(`/api/fingerprint/devices/${id}`);
      showSuccess("Terhapus", "Perangkat mesin berhasil dihapus.");
      fetchDevices();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  // GANTI PASSWORD OWNER
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showError("Password Terlalu Pendek", "Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Tidak Cocok", "Konfirmasi password baru tidak sesuai.");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await axios.put("/api/users/profile", { password: newPassword }).catch(async () => {
        // Fallback endpoint jika users/profile butuh endpoint akun
        return axios.post("/api/auth/change-password", { newPassword });
      });
      showSuccess("Password Berhasil Diubah", "Password akun owner Anda telah diperbarui.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError("Gagal Mengubah Password", err.response?.data?.message || err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "32px" }}>
      
      {/* 1. HERO SETTINGS BANNER */}
      <div
        style={{
          background: "linear-gradient(135deg, #042f2e 0%, #0d766e 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(13, 118, 110, 0.35)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.64rem", fontWeight: 800, color: "#a7f3d0", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              PUSAT KONTROL &amp; PENGATURAN
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", marginTop: "3px" }}>
              Konfigurasi Sistem
            </div>
            <div style={{ fontSize: "0.68rem", color: "#a7f3d0", marginTop: "2px" }}>
              Kelola batas SPP, mesin presensi ADMS, dan akun yayasan
            </div>
          </div>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)"
            }}
          >
            <Settings size={22} color="#a7f3d0" />
          </div>
        </div>
      </div>

      {/* 2. SUBTAB SWITCHER (SPP / MESIN / AKUN) */}
      <div
        style={{
          display: "flex",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "4px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          gap: "4px"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSection("spp")}
          style={{
            flex: 1,
            background: activeSection === "spp" ? "#ecfdf5" : "transparent",
            color: activeSection === "spp" ? "#065f46" : "#64748b",
            fontWeight: activeSection === "spp" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSection === "spp" ? "1px solid #a7f3d0" : "1px solid transparent"
          }}
        >
          <CreditCard size={14} />
          <span>Batas SPP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("mesin")}
          style={{
            flex: 1,
            background: activeSection === "mesin" ? "#eff6ff" : "transparent",
            color: activeSection === "mesin" ? "#1d4ed8" : "#64748b",
            fontWeight: activeSection === "mesin" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSection === "mesin" ? "1px solid #bfdbfe" : "1px solid transparent"
          }}
        >
          <Cpu size={14} />
          <span>Mesin Presensi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("akun")}
          style={{
            flex: 1,
            background: activeSection === "akun" ? "#f8fafc" : "transparent",
            color: activeSection === "akun" ? "#0f172a" : "#64748b",
            fontWeight: activeSection === "akun" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSection === "akun" ? "1px solid #cbd5e1" : "1px solid transparent"
          }}
        >
          <User size={14} />
          <span>Akun &amp; Keluar</span>
        </button>
      </div>

      {/* 3. SECTION CONTENT */}
      {activeSection === "spp" ? (
        /* =========================================================================
            SECTION 1: PENGATURAN BATAS TAGIHAN SPP
        ========================================================================= */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={17} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0f172a" }}>
                Siklus &amp; Batas Jatuh Tempo SPP
              </div>
              <div style={{ fontSize: "0.64rem", color: "#64748b" }}>
                Atur jadwal terbit kuitansi dan tanggal batas tunggakan bulanan
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSiklusSpp} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                  Tanggal Terbit SPP
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={sppConfig.tgl_terbit_spp || 5}
                    onChange={(e) => setSppConfig({ ...sppConfig, tgl_terbit_spp: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "#0f172a"
                    }}
                    required
                  />
                </div>
                <div style={{ fontSize: "0.58rem", color: "#94a3b8", marginTop: "2px" }}>
                  Tagihan digenerate tiap tgl ini
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                  Batas Akhir (Jatuh Tempo)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Tgl</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={sppConfig.tgl_jatuh_tempo_spp || 10}
                    onChange={(e) => setSppConfig({ ...sppConfig, tgl_jatuh_tempo_spp: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "#b91c1c"
                    }}
                    required
                  />
                </div>
                <div style={{ fontSize: "0.58rem", color: "#94a3b8", marginTop: "2px" }}>
                  Lewat tgl ini masuk tunggakan
                </div>
              </div>
            </div>

            {/* Keterangan Sistem */}
            <div
              style={{
                background: "#f8fafc",
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                fontSize: "0.68rem",
                color: "#475569",
                lineHeight: 1.4
              }}
            >
              <strong>Aturan Berjalan:</strong> Tagihan SPP otomatis terbit setiap tanggal{" "}
              <strong>{sppConfig.tgl_terbit_spp || 5}</strong> setiap bulan, dan batas pelunasan sampai tanggal{" "}
              <strong>{sppConfig.tgl_jatuh_tempo_spp || 10}</strong>. Jika belum lunas setelah tanggal{" "}
              <strong>{sppConfig.tgl_jatuh_tempo_spp || 10}</strong>, sistem menandai sebagai tunggakan aktif dan mengirim pengingat ke wali santri.
            </div>

            {/* Checkbox Apply to Existing */}
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.72rem", color: "#334155", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={applyToExisting}
                onChange={(e) => setApplyToExisting(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#0d766e" }}
              />
              <span>Perbarui tanggal jatuh tempo tagihan yang belum lunas bulan ini</span>
            </label>

            <button
              type="submit"
              disabled={savingSpp}
              style={{
                padding: "11px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #0d766e 0%, #059669 100%)",
                color: "#ffffff",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(13, 118, 110, 0.35)",
                marginTop: "4px"
              }}
            >
              {savingSpp ? <RotateCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Simpan Pengaturan Batas SPP</span>
            </button>
          </form>
        </div>
      ) : activeSection === "mesin" ? (
        /* =========================================================================
            SECTION 2: PENGATURAN MESIN FINGERPRINT ADMS
        ========================================================================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "14px 16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0f172a" }}>
                Mesin Fingerprint &amp; ADMS
              </div>
              <div style={{ fontSize: "0.64rem", color: "#64748b" }}>
                Integrasi mesin absensi fisik MP340 / ZKTeco Cloud
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDeviceModal()}
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                borderRadius: "10px",
                padding: "6px 10px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <Plus size={14} />
              <span>Tambah Mesin</span>
            </button>
          </div>

          {/* List Perangkat */}
          {loadingDevices ? (
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <RotateCw size={24} className="animate-spin" color="#2563eb" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.74rem", color: "#64748b" }}>Memeriksa koneksi mesin...</div>
            </div>
          ) : devices.length > 0 ? (
            devices.map((dev) => {
              const isOnline = dev.status_koneksi === "Online";

              return (
                <div
                  key={dev.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "11px",
                        background: isOnline ? "#ecfdf5" : "#f1f5f9",
                        color: isOnline ? "#059669" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {dev.nama_device}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                        SN: {dev.sn_device} • Lokasi: {dev.lokasi || "Komplek Pesantren"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                        IP: {dev.ip_address || "DHCP"} • Port: {dev.port || 4370}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "3px 7px",
                        borderRadius: "6px",
                        background: isOnline ? "#ecfdf5" : "#fef2f2",
                        color: isOnline ? "#047857" : "#b91c1c",
                        border: isOnline ? "1px solid #a7f3d0" : "1px solid #fecaca"
                      }}
                    >
                      {dev.status_koneksi || "Offline"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenDeviceModal(dev)}
                      style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "5px", color: "#475569", cursor: "pointer" }}
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDevice(dev.id, dev.nama_device)}
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "5px", color: "#ef4444", cursor: "pointer" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
              <Server size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>Belum ada mesin terdaftar</div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Tambahkan Serial Number mesin fingerprint pesantren Anda.
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            SECTION 3: AKUN OWNER & KEAMANAN
        ========================================================================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Card Info Akun */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "1.1rem"
                }}
              >
                O
              </div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0f172a" }}>
                  Owner / Dewan Pembina
                </div>
                <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>
                  Akses Eksekutif Tertinggi (Read-Only Monitoring)
                </div>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.68rem", color: "#475569", lineHeight: 1.4 }}>
              <strong>Keamanan Terjamin:</strong> Sebagai Owner, Anda memegang hak pantau realtime atas seluruh transaksi kas, kehadiran santri, dan laporan pesantren tanpa risiko perubahan data oleh pihak luar.
            </div>
          </div>

          {/* Form Ganti Password */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 14px rgba(0,0,0,0.04)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Lock size={16} color="#0d766e" />
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                Ubah Password Login Owner
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                  Password Baru
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  placeholder="Ulangi password baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                style={{
                  padding: "9px",
                  borderRadius: "10px",
                  background: "#0d766e",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  marginTop: "4px"
                }}
              >
                {savingPassword ? "Menyimpan..." : "Perbarui Password"}
              </button>
            </form>
          </div>

          {/* Tombol Logout */}
          <button
            type="button"
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "14px",
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              fontSize: "0.8rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.35)",
              marginTop: "8px"
            }}
          >
            <LogOut size={16} />
            <span>Keluar dari Akun Owner</span>
          </button>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PERANGKAT MESIN FINGERPRINT */}
      {deviceModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "18px",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "#0f172a" }}>
                {editingDevice ? "Edit Perangkat Mesin" : "Tambah Mesin Fingerprint"}
              </div>
              <button
                type="button"
                onClick={() => setDeviceModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                  Nama Perangkat / Pos
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mesin Gerbang Utama"
                  value={deviceForm.nama_device}
                  onChange={(e) => setDeviceForm({ ...deviceForm, nama_device: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                  Serial Number (SN) Mesin
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BKK821480029"
                  value={deviceForm.sn_device}
                  onChange={(e) => setDeviceForm({ ...deviceForm, sn_device: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={deviceForm.ip_address}
                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                    Port
                  </label>
                  <input
                    type="number"
                    value={deviceForm.port}
                    onChange={(e) => setDeviceForm({ ...deviceForm, port: e.target.value })}
                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.66rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                  Lokasi Pemasangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pintu Asrama Putri"
                  value={deviceForm.lokasi}
                  onChange={(e) => setDeviceForm({ ...deviceForm, lokasi: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  style={{ flex: 1, padding: "9px", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "9px", borderRadius: "10px", background: "#0d766e", border: "none", color: "#ffffff", fontSize: "0.76rem", fontWeight: 800, cursor: "pointer" }}
                >
                  {editingDevice ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

