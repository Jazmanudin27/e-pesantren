import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Calendar,
  ChevronRight,
  UserCheck,
  KeyRound,
} from "lucide-react";
import ModalSiklusSpp from "./components/ModalSiklusSpp";
import { toastSuccess, toastError, showConfirm } from "../../utils/alert.util";

export default function MobileSettingsKeuangan({ onLogout }) {
  const getSession = () => {
    try {
      return JSON.parse(
        localStorage.getItem("mobile_session") ||
          localStorage.getItem("desktop_session") ||
          sessionStorage.getItem("desktop_session") ||
          "{}",
      );
    } catch (e) {
      return {};
    }
  };

  const sessionData = getSession();
  const rawName =
    sessionData.nama ||
    sessionData.nama_asatidz ||
    sessionData.username ||
    "Bendahara Keuangan";
  const displayName = rawName.includes("_")
    ? rawName.replace(/_/g, " ").toUpperCase()
    : rawName;
  const userRole =
    sessionData.userType ||
    (sessionData.role ? sessionData.role.toUpperCase() : "BENDAHARA");
  const initial =
    displayName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "BK";

  // 1. State Siklus & Jatuh Tempo SPP
  const [isSiklusModalOpen, setIsSiklusModalOpen] = useState(false);
  const [siklusForm, setSiklusForm] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    apply_to_existing: true,
  });
  const [savingSiklus, setSavingSiklus] = useState(false);

  useEffect(() => {
    const fetchSiklus = async () => {
      try {
        const res = await axios.get("/api/keuangan/admin/home-summary");
        if (res.data?.data?.siklusSpp) {
          const s = res.data.data.siklusSpp;
          setSiklusForm({
            tgl_terbit_spp: s.tgl_terbit_spp || 5,
            tgl_jatuh_tempo_spp: s.tgl_jatuh_tempo_spp || 10,
            apply_to_existing: true,
          });
        }
      } catch (e) {
        console.warn("Gagal load siklus spp:", e.message);
      }
    };
    fetchSiklus();
  }, []);

  const handleSaveSiklus = async (e) => {
    e?.preventDefault();
    try {
      setSavingSiklus(true);
      const res = await axios.post("/api/keuangan/siklus-spp", siklusForm);
      if (res.data?.success) {
        toastSuccess(
          "Siklus Disimpan",
          res.data.message || "Pengaturan siklus SPP berhasil disimpan.",
        );
        setIsSiklusModalOpen(false);
      }
    } catch (err) {
      toastError(
        err.response?.data?.message || "Gagal menyimpan pengaturan siklus SPP",
      );
    } finally {
      setSavingSiklus(false);
    }
  };

  // 2. State Ubah Password Akun
  const [currentUsername, setCurrentUsername] = useState(
    sessionData.username || "bendahara",
  );
  const [usernameBaru, setUsernameBaru] = useState(
    sessionData.username || "bendahara",
  );
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSavePassword = async (e) => {
    e?.preventDefault();
    const cleanUser = usernameBaru.trim() || currentUsername;
    const cleanOld = passwordLama.trim();
    const cleanNew = passwordBaru.trim();
    const cleanConf = konfirmasiPassword.trim();

    if (!cleanOld) {
      toastError("Password lama wajib diisi.");
      return;
    }
    if (!cleanNew || cleanNew.length < 4) {
      toastError("Password baru minimal 4 karakter.");
      return;
    }
    if (cleanNew !== cleanConf) {
      toastError("Konfirmasi password baru tidak cocok.");
      return;
    }

    try {
      setSavingPassword(true);
      const token = localStorage.getItem("token") || sessionData.token || "";
      const res = await axios.post(
        "/api/pengajar/account",
        {
          username_baru: cleanUser,
          password_lama: cleanOld,
          password_baru: cleanNew,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (res.data?.success) {
        const updatedUsername = res.data?.data?.username || cleanUser;
        const updatedToken = res.data?.data?.token || token;

        setCurrentUsername(updatedUsername);
        setUsernameBaru(updatedUsername);
        setPasswordLama("");
        setPasswordBaru("");
        setKonfirmasiPassword("");

        if (updatedToken) {
          localStorage.setItem("token", updatedToken);
        }

        const updateSessStorage = (key, storage) => {
          try {
            const raw = storage.getItem(key);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            parsed.username = updatedUsername;
            if (updatedToken) parsed.token = updatedToken;
            storage.setItem(key, JSON.stringify(parsed));
          } catch (err) {}
        };
        updateSessStorage("desktop_session", localStorage);
        updateSessStorage("desktop_session", sessionStorage);
        updateSessStorage("mobile_session", localStorage);

        toastSuccess(
          "Berhasil Disimpan",
          res.data?.message || "Password akun berhasil diperbarui.",
        );
      }
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal memperbarui password akun.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutClick = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari akun Keuangan?",
      "Ya, Keluar",
      "Batal",
    );
    if (!confirmed) return;

    localStorage.removeItem("mobile_session");
    localStorage.removeItem("desktop_session");
    localStorage.removeItem("token");
    sessionStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: "0 14px 28px" }}>
      {/* Header Profil Ringkas Bendahara */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
          borderRadius: "20px",
          padding: "18px",
          color: "#ffffff",
          boxShadow: "0 10px 24px -6px rgba(6, 78, 59, 0.3)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.16)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            fontWeight: 900,
            border: "2px solid rgba(255, 255, 255, 0.25)",
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(16, 185, 129, 0.25)",
              color: "#a7f3d0",
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "0.66rem",
              fontWeight: 800,
              marginBottom: "4px",
              border: "1px solid rgba(167, 243, 208, 0.3)",
            }}
          >
            <UserCheck size={12} /> {userRole}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.02rem",
              fontWeight: 800,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </h2>
          <div
            style={{
              fontSize: "0.74rem",
              color: "#d1fae5",
              marginTop: "2px",
            }}
          >
            Username: @{currentUsername}
          </div>
        </div>
      </div>

      {/* 1. Pengaturan Keuangan: Siklus & Jatuh Tempo SPP */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "12px 16px",
          border: "1px solid #e2e8f0",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div
          style={{
            fontSize: "0.76rem",
            fontWeight: 800,
            color: "#0f172a",
            textTransform: "uppercase",
            marginBottom: "8px",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Pengaturan Keuangan</span>
          <span
            style={{
              fontSize: "0.65rem",
              background: "#ecfdf5",
              color: "#059669",
              padding: "2px 8px",
              borderRadius: "6px",
              fontWeight: 800,
            }}
          >
            Bendahara
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsSiklusModalOpen(true)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0 4px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "11px",
                background: "#f0fdf4",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #bbf7d0",
                flexShrink: 0,
              }}
            >
              <Calendar size={19} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.86rem",
                  fontWeight: 800,
                  color: "#1e293b",
                }}
              >
                Siklus &amp; Jatuh Tempo SPP
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  marginTop: "2px",
                  fontWeight: 600,
                }}
              >
                Terbit Tgl {siklusForm.tgl_terbit_spp || 5} • Jatuh Tempo Tgl{" "}
                {siklusForm.tgl_jatuh_tempo_spp || 10} Tiap Bulan
              </div>
            </div>
          </div>
          <ChevronRight size={17} color="#94a3b8" />
        </button>
      </div>

      {/* 2. Ubah Password Akun */}
      <form
        onSubmit={handleSavePassword}
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "16px",
          border: "1px solid #e2e8f0",
          marginBottom: "16px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            paddingBottom: "10px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <KeyRound size={17} />
          </div>
          <div>
            <div
              style={{ fontSize: "0.86rem", fontWeight: 800, color: "#0f172a" }}
            >
              Ubah Password Akun
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              Perbarui password keamanan akun Keuangan
            </div>
          </div>
        </div>

        {/* Password Lama */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Password Lama
          </label>
          <div style={{ position: "relative" }}>
            <Lock
              size={15}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type={showOldPass ? "text" : "password"}
              value={passwordLama}
              onChange={(e) => setPasswordLama(e.target.value)}
              placeholder="Masukkan password saat ini..."
              style={{
                width: "100%",
                padding: "10px 36px 10px 34px",
                borderRadius: "11px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowOldPass((v) => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Baru */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Password Baru
          </label>
          <div style={{ position: "relative" }}>
            <Lock
              size={15}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type={showNewPass ? "text" : "password"}
              value={passwordBaru}
              onChange={(e) => setPasswordBaru(e.target.value)}
              placeholder="Minimal 4 karakter..."
              style={{
                width: "100%",
                padding: "10px 36px 10px 34px",
                borderRadius: "11px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPass((v) => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#64748b",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
              }}
            >
              {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Password Baru */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#334155",
              marginBottom: "4px",
            }}
          >
            Konfirmasi Password Baru
          </label>
          <div style={{ position: "relative" }}>
            <Lock
              size={15}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: "11px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type={showNewPass ? "text" : "password"}
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              placeholder="Ulangi password baru..."
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                borderRadius: "11px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#0f172a",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          style={{
            marginTop: "4px",
            width: "100%",
            border: "none",
            borderRadius: "12px",
            padding: "11px",
            background: savingPassword
              ? "#94a3b8"
              : "linear-gradient(135deg, #059669 0%, #047857 100%)",
            color: "#ffffff",
            fontSize: "0.84rem",
            fontWeight: 800,
            cursor: savingPassword ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: savingPassword
              ? "none"
              : "0 6px 14px rgba(5, 150, 105, 0.25)",
          }}
        >
          <Save size={16} />
          <span>{savingPassword ? "Menyimpan..." : "Simpan Password Baru"}</span>
        </button>
      </form>

      {/* Tombol Keluar */}
      <button
        type="button"
        onClick={handleLogoutClick}
        style={{
          width: "100%",
          background: "#ffe4e6",
          border: "1px solid #fecdd3",
          color: "#e11d48",
          padding: "12px",
          borderRadius: "14px",
          fontSize: "0.86rem",
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(225, 29, 72, 0.08)",
        }}
      >
        <LogOut size={17} />
        <span>Keluar dari Akun</span>
      </button>

      {/* Modal Atur Siklus SPP */}
      <ModalSiklusSpp
        isOpen={isSiklusModalOpen}
        onClose={() => setIsSiklusModalOpen(false)}
        siklusForm={siklusForm}
        setSiklusForm={setSiklusForm}
        savingSiklus={savingSiklus}
        onSaveSiklus={handleSaveSiklus}
      />
    </div>
  );
}

