import React, { useState } from "react";
import axios from "axios";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { toastSuccess, toastError, showConfirm } from "../../utils/alert.util";

export default function PengajarSettingsView({ onLogout }) {
  const getSession = () => {
    try {
      return JSON.parse(
        localStorage.getItem("desktop_session") ||
          sessionStorage.getItem("desktop_session") ||
          localStorage.getItem("mobile_session") ||
          "{}",
      );
    } catch (e) {
      return {};
    }
  };

  const initialSession = getSession();
  const displayName =
    initialSession.nama_asatidz ||
    initialSession.nama ||
    initialSession.username ||
    "Ustadz Pengajar";

  const [currentUsername, setCurrentUsername] = useState(
    initialSession.username || "",
  );
  const [usernameBaru, setUsernameBaru] = useState(
    initialSession.username || "",
  );
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const initials =
    displayName
      .replace(/[^a-zA-Z\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "AS";

  const handleSave = async (e) => {
    e?.preventDefault();
    const cleanUser = usernameBaru.trim();
    const cleanOld = passwordLama.trim();
    const cleanNew = passwordBaru.trim();
    const cleanConf = konfirmasiPassword.trim();

    if (!cleanUser) {
      toastError("Username tidak boleh kosong.");
      return;
    }
    if (cleanUser.length < 3) {
      toastError("Username minimal 3 karakter.");
      return;
    }

    if (cleanNew || cleanConf || cleanOld) {
      if (!cleanOld) {
        toastError("Password lama wajib diisi untuk mengubah password.");
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
    } else if (cleanUser === currentUsername) {
      toastError("Tidak ada perubahan username atau password.");
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("token") || initialSession.token || "";
      const res = await axios.post(
        "/api/pengajar/account",
        {
          username_baru: cleanUser,
          password_lama: cleanOld || undefined,
          password_baru: cleanNew || undefined,
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

        if (localStorage.getItem("pesantren_remember_me") === "true") {
          localStorage.setItem("pesantren_remember_username", updatedUsername);
        }

        toastSuccess(
          "Berhasil Disimpan",
          res.data?.message || "Username & password akun diperbarui.",
        );
      }
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Gagal memperbarui akun.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutClick = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda ingin keluar dari akun Pengajar?",
      "Ya, Keluar",
      "Batal",
    );
    if (!confirmed) return;

    localStorage.removeItem("token");
    localStorage.removeItem("desktop_session");
    localStorage.removeItem("mobile_session");
    localStorage.removeItem("pengajar_active_tab");
    sessionStorage.clear();
    if (onLogout) {
      onLogout();
    } else {
      window.location.hash = "#login";
      window.location.reload();
    }
    toastSuccess("Berhasil keluar");
  };

  return (
    <div
      style={{
        padding: "4px 14px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* Profile Summary Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "18px",
          padding: "16px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.25)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "54px",
            height: "54px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0d9488 0%, #10b981 100%)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            fontWeight: 900,
            border: "2px solid rgba(255, 255, 255, 0.25)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: "0.98rem",
              fontWeight: 800,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: "0.74rem",
              color: "#94a3b8",
              marginTop: "2px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CheckCircle2 size={12} color="#34d399" />
            <span>Username: @{currentUsername || "-"}</span>
          </div>
        </div>
      </div>

      {/* Form Ubah Username & Password */}
      <form
        onSubmit={handleSave}
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            paddingBottom: "8px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "9px",
              background: "#f0fdfa",
              border: "1px solid #ccfbf1",
              color: "#0d766e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <KeyRound size={16} />
          </div>
          <div>
            <div
              style={{ fontSize: "0.84rem", fontWeight: 800, color: "#0f172a" }}
            >
              Ubah Username &amp; Password
            </div>
            <div style={{ fontSize: "0.66rem", color: "#64748b" }}>
              Kosongkan kolom password jika hanya mengubah username
            </div>
          </div>
        </div>

        {/* Username Baru */}
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
            Username
          </label>
          <div style={{ position: "relative" }}>
            <User
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
              type="text"
              value={usernameBaru}
              onChange={(e) => setUsernameBaru(e.target.value)}
              placeholder="Masukkan username..."
              autoCapitalize="none"
              autoCorrect="off"
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
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
                padding: "9px 36px 9px 34px",
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
                padding: "9px 36px 9px 34px",
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
                padding: "9px 12px 9px 34px",
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
          disabled={saving}
          style={{
            marginTop: "4px",
            width: "100%",
            border: "none",
            borderRadius: "12px",
            padding: "11px",
            background: saving
              ? "#94a3b8"
              : "linear-gradient(135deg, #0d766e 0%, #059669 100%)",
            color: "#ffffff",
            fontSize: "0.84rem",
            fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: saving ? "none" : "0 6px 14px rgba(13, 118, 110, 0.28)",
          }}
        >
          <Save size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
      </form>

      {/* Logout Button */}
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
    </div>
  );
}
