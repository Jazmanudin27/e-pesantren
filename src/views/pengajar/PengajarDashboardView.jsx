import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  BookOpen,
  ShieldAlert,
  Award,
  FileText,
  LogOut,
  User,
  RefreshCw,
  Check,
  Clock,
  ChevronRight,
  ChevronLeft,
  Building2,
  Fingerprint,
  Settings,
} from "lucide-react";
import { showConfirm, toastSuccess } from "../../utils/alert.util";
import PengajarAbsenMengaji from "./PengajarAbsenMengaji";
import PengajarLaporanMengaji from "./PengajarLaporanMengaji";
import PengajarLaporanBerjamaah from "./PengajarLaporanBerjamaah";
import PengajarTeguranView from "./PengajarTeguranView";
import PengajarPraktekView from "./PengajarPraktekView";
import PengajarPerkembanganView from "./PengajarPerkembanganView";
import OwnerLaporanSantri from "../owner/OwnerLaporanSantri";
import MobileProfil from "../mobile/MobileProfil";
import MobileMasterPengembangan from "../mobile/MobileMasterPengembangan";

const squircleIconStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "6px",
  transition: "transform 0.15s ease",
  cursor: "pointer",
};

const menuCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
  userSelect: "none",
};

const menuLabelStyle = {
  fontSize: "0.56rem",
  fontWeight: 700,
  color: "#334155",
  lineHeight: 1.2,
  width: "100%",
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  letterSpacing: "-0.2px",
};

const PENGAJAR_TABS = new Set([
  "beranda",
  "absen-mengaji",
  "laporan-mengaji",
  "laporan-berjamaah",
  "teguran",
  "praktek",
  "perkembangan",
  "master-pengembangan",
  "setting-pengembangan",
  "santri",
  "settings",
  "profil",
]);

const getInitialPengajarTab = () => {
  try {
    const rawHash = (window.location.hash || "").replace(/^#/, "");
    if (rawHash.includes("/")) {
      const sub = rawHash.split("/")[1];
      if (sub && PENGAJAR_TABS.has(sub)) return sub;
    } else if (rawHash && rawHash !== "pengajar" && rawHash !== "ustadz" && PENGAJAR_TABS.has(rawHash)) {
      return rawHash;
    }
    const saved =
      sessionStorage.getItem("pengajar_active_tab") ||
      localStorage.getItem("pengajar_active_tab");
    if (saved && PENGAJAR_TABS.has(saved)) return saved;
  } catch (e) {}
  return "beranda";
};

export default function PengajarDashboardView({ onLogout }) {
  const [activeTab, setActiveTab] = useState(getInitialPengajarTab); // 'beranda' | 'absen-mengaji' | 'laporan-berjamaah' | 'teguran' | 'praktek' | 'perkembangan' | 'santri' | 'settings'
  const [loading, setLoading] = useState(true);
  const [presensiFilter, setPresensiFilter] = useState("Semua");
  const [rekapTipe, setRekapTipe] = useState("mengaji"); // 'mengaji' | 'berjamaah'
  const touchStartXRef = React.useRef(null);
  const [dashboardData, setDashboardData] = useState({
    totalSantri: 0,
    presensiHariIni: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persenHadir: 0,
    },
    presensiMengajiHariIni: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persenHadir: 0,
    },
    presensiBerjamaahHariIni: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persenHadir: 0,
    },
    totalTeguranBulanIni: 0,
    totalPraktekBulanIni: 0,
    totalPerkembangan: 0,
    daftarSesi: [],
  });

  const handleOpenPresensiWithStatus = (status = "Semua") => {
    setPresensiFilter(status);
    setActiveTab(rekapTipe === "mengaji" ? "laporan-mengaji" : "laporan-berjamaah");
  };

  const handleTouchStartRekap = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEndRekap = (e) => {
    if (touchStartXRef.current === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diffX > 45) setRekapTipe("mengaji");
    else if (diffX < -45) setRekapTipe("berjamaah");
    touchStartXRef.current = null;
  };

  const pengajarSession = (() => {
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
  })();

  const pengajarName =
    pengajarSession.nama ||
    pengajarSession.nama_asatidz ||
    pengajarSession.username ||
    "Ust. Pengajar";

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/pengajar/dashboard");
      if (res.data?.success && res.data.data) {
        setDashboardData(res.data.data);
      }
    } catch (e) {
      console.warn("Gagal memuat dashboard pengajar:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Persist activeTab ke sessionStorage/localStorage & URL hash agar saat reload tetap di menu aktif
  useEffect(() => {
    try {
      sessionStorage.setItem("pengajar_active_tab", activeTab);
      localStorage.setItem("pengajar_active_tab", activeTab);
      const curHash = window.location.hash || "";
      if (!curHash.toLowerCase().includes("login")) {
        const targetHash = activeTab === "beranda" ? "#pengajar" : `#pengajar/${activeTab}`;
        if (curHash !== targetHash) {
          window.history.replaceState(null, "", targetHash);
        }
      }
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const rawHash = (window.location.hash || "").replace(/^#/, "");
      if (rawHash.includes("/")) {
        const sub = rawHash.split("/")[1];
        if (sub && PENGAJAR_TABS.has(sub)) setActiveTab(sub);
      } else if (rawHash === "pengajar" || rawHash === "ustadz") {
        setActiveTab("beranda");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda ingin keluar dari Portal Ustadz / Pengajar?",
      "Ya, Keluar",
      "Batal",
    );
    if (confirmed) {
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
    }
  };

  const p =
    (rekapTipe === "mengaji"
      ? dashboardData.presensiMengajiHariIni
      : dashboardData.presensiBerjamaahHariIni) ||
    dashboardData.presensiHariIni || {
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persenHadir: 0,
    };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(13, 118, 110, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15, 23, 42, 0.06) 0px, transparent 50%)",
        fontFamily:
          "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 0,
        margin: 0,
      }}
    >
      {/* MOBILE CONTAINER WRAPPER (Max 440px desktop, full-width on mobile) */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.18)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "82px",
          boxSizing: "border-box",
        }}
      >
        {/* =========================================================================
            HEADER KONTEN SESUAI TAB (BERANDA vs SUBVIEW)
        ========================================================================= */}
        {activeTab === "beranda" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* 1. TOP MODERN TEAL GRADIENT BANNER (IDENTIK OWNER DASHBOARD) */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
                padding: "16px 16px 36px",
                color: "#ffffff",
                borderBottomLeftRadius: "24px",
                borderBottomRightRadius: "24px",
                position: "relative",
              }}
            >
              {/* Header Top Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Brand Logo: NWF Asatidz + Subtitle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "14px",
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(167,243,208,0.15) 100%)",
                      border: "1.5px solid rgba(255, 255, 255, 0.42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3.5px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "10px",
                        background: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4.5px",
                        boxSizing: "border-box",
                      }}
                    >
                      <img
                        src="/nwf.png"
                        alt="NWF Logo"
                        onError={(e) => {
                          e.target.src = "/logo.png";
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: "1.45rem",
                          letterSpacing: "-0.5px",
                          color: "#ffffff",
                          lineHeight: 1,
                          textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                        }}
                      >
                        NWF
                      </span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "1.15rem",
                          fontStyle: "italic",
                          letterSpacing: "-0.2px",
                          color: "#a7f3d0",
                          lineHeight: 1,
                          textShadow: "0 2px 6px rgba(11, 107, 96, 0.35)",
                        }}
                      >
                        Asatidz
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.85)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginTop: "2px",
                        lineHeight: 1,
                      }}
                    >
                      PORTAL USTADZ &amp; PENGAJAR
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons (Refresh & Logout) */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    type="button"
                    onClick={fetchDashboard}
                    title="Muat Ulang Data"
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "none",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "7px",
                      borderRadius: "10px",
                    }}
                  >
                    <RefreshCw
                      size={17}
                      className={loading ? "animate-spin" : ""}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Keluar Akun"
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "none",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "7px",
                      borderRadius: "10px",
                    }}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. OVERLAPPING WHITE CARD: PROFIL USTADZ & REKAP PASTEL BADGES (IDENTIK OWNER) */}
            <div
              style={{
                padding: "0 14px",
                marginTop: "-24px",
                position: "relative",
                zIndex: 12,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 12px 10px",
                  boxShadow:
                    "0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)",
                }}
              >
                {/* Header Profile Info: Nama Ustadz Pengajar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: 0,
                      flex: 1,
                      paddingRight: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: "0.84rem",
                          fontWeight: 900,
                          color: "#0f172a",
                          letterSpacing: "-0.2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pengajarName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 600,
                          color: "#64748b",
                          lineHeight: 1.1,
                          marginTop: "1px",
                        }}
                      >
                        Status: Asatidz Aktif •{" "}
                        {dashboardData.totalSantri || 613} Santri
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Semua")}
                    style={{
                      background: "rgba(13, 148, 136, 0.08)",
                      border: "1px solid rgba(13, 148, 136, 0.2)",
                      borderRadius: "8px",
                      color: "#0d9488",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      padding: "4px 8px",
                      flexShrink: 0,
                      transition: "all 0.15s ease",
                    }}
                  >
                    Rincian <ChevronRight size={12} />
                  </button>
                </div>

                {/* Slide Bar: Mengaji vs Shalat Berjamaah */}
                <div
                  style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    background: "#f1f5f9",
                    padding: "3.5px",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "10px",
                  }}
                >
                  {/* Animated Sliding Active Indicator Pill */}
                  <div
                    style={{
                      position: "absolute",
                      top: "3.5px",
                      bottom: "3.5px",
                      left: "3.5px",
                      width: "calc(50% - 3.5px)",
                      borderRadius: "9px",
                      background:
                        rekapTipe === "mengaji"
                          ? "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                          : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      boxShadow:
                        rekapTipe === "mengaji"
                          ? "0 2px 8px rgba(13, 148, 136, 0.35)"
                          : "0 2px 8px rgba(2, 132, 199, 0.35)",
                      transform:
                        rekapTipe === "mengaji"
                          ? "translateX(0%)"
                          : "translateX(100%)",
                      transition:
                        "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease",
                      pointerEvents: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setRekapTipe("mengaji")}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      border: "none",
                      background: "transparent",
                      color: rekapTipe === "mengaji" ? "#ffffff" : "#64748b",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      padding: "6px 4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Presensi Mengaji</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRekapTipe("berjamaah")}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      border: "none",
                      background: "transparent",
                      color: rekapTipe === "berjamaah" ? "#ffffff" : "#64748b",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      padding: "6px 4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <Fingerprint size={13} />
                    <span>Shalat Berjamaah</span>
                  </button>
                </div>

                {/* 4 Cards Grid (Pastel Touchable Badges Identik Owner) */}
                <div
                  onTouchStart={handleTouchStartRekap}
                  onTouchEnd={handleTouchEndRekap}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "6px",
                  }}
                >
                  {/* Hadir */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Hadir")}
                    style={{
                      background:
                        "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #bbf7d0",
                      cursor: "pointer",
                      outline: "none",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "10px",
                        background: "#10b981",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 8px -1px rgba(16, 185, 129, 0.35)",
                      }}
                    >
                      <Check size={16} strokeWidth={2.8} />
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "#15803d",
                        marginTop: "4px",
                        lineHeight: 1,
                      }}
                    >
                      {p.hadir}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#166534",
                        marginTop: "2px",
                      }}
                    >
                      Hadir
                    </span>
                  </button>

                  {/* Sakit */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Sakit")}
                    style={{
                      background:
                        "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #fecaca",
                      cursor: "pointer",
                      outline: "none",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "10px",
                        background: "#ef4444",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 8px -1px rgba(239, 68, 68, 0.35)",
                      }}
                    >
                      <Building2 size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "#b91c1c",
                        marginTop: "4px",
                        lineHeight: 1,
                      }}
                    >
                      {p.sakit}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#991b1b",
                        marginTop: "2px",
                      }}
                    >
                      Sakit
                    </span>
                  </button>

                  {/* Izin */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Izin")}
                    style={{
                      background:
                        "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #fde68a",
                      cursor: "pointer",
                      outline: "none",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "10px",
                        background: "#f59e0b",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 8px -1px rgba(245, 158, 11, 0.35)",
                      }}
                    >
                      <FileText size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "#b45309",
                        marginTop: "4px",
                        lineHeight: 1,
                      }}
                    >
                      {p.izin}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#92400e",
                        marginTop: "2px",
                      }}
                    >
                      Izin
                    </span>
                  </button>

                  {/* Alfa */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Alfa")}
                    style={{
                      background:
                        "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #99f6e4",
                      cursor: "pointer",
                      outline: "none",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "10px",
                        background: "#0d9488",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 3px 8px -1px rgba(13, 148, 136, 0.35)",
                      }}
                    >
                      <Clock size={16} strokeWidth={2.6} />
                    </div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "#0f766e",
                        marginTop: "4px",
                        lineHeight: 1,
                      }}
                    >
                      {p.alfa}
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#115e59",
                        marginTop: "2px",
                      }}
                    >
                      Alfa
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SECTION MENU LAYANAN ASATIDZ */}
            <div
              style={{
                padding: "0 14px",
                marginTop: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 10px 14px",
                  boxShadow:
                    "0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    letterSpacing: "-0.2px",
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "14px",
                      background: "#0d766e",
                      borderRadius: "4px",
                    }}
                  />
                  Menu Layanan Asatidz &amp; Pengajar
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "12px 2px",
                    justifyItems: "center",
                  }}
                >
                  {/* 1. Absen Mengaji */}
                  <div
                    onClick={() => setActiveTab("absen-mengaji")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                        boxShadow: "0 6px 16px -2px rgba(13, 148, 136, 0.38)",
                      }}
                    >
                      <BookOpen size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Mengaji</span>
                  </div>

                  {/* 1b. Laporan Mengaji */}
                  <div
                    onClick={() => setActiveTab("laporan-mengaji")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        boxShadow: "0 6px 16px -2px rgba(5, 150, 105, 0.38)",
                      }}
                    >
                      <FileText size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Lap. Mengaji</span>
                  </div>

                  {/* 2. Laporan Berjamaah */}
                  <div
                    onClick={() => setActiveTab("laporan-berjamaah")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                        boxShadow: "0 6px 16px -2px rgba(6, 182, 212, 0.38)",
                      }}
                    >
                      <Fingerprint
                        size={23}
                        strokeWidth={2.3}
                        color="#ffffff"
                      />
                    </div>
                    <span style={menuLabelStyle}>Lap. Berjamaah</span>
                  </div>

                  {/* 3. Catatan Teguran */}
                  <div
                    onClick={() => setActiveTab("teguran")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        boxShadow: "0 6px 16px -2px rgba(239, 68, 68, 0.38)",
                      }}
                    >
                      <ShieldAlert
                        size={23}
                        strokeWidth={2.3}
                        color="#ffffff"
                      />
                    </div>
                    <span style={menuLabelStyle}>Teguran</span>
                  </div>

                  {/* 4. Praktek Ibadah */}
                  <div
                    onClick={() => setActiveTab("praktek")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.38)",
                      }}
                    >
                      <Award size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Praktek</span>
                  </div>

                  {/* 5. Perkembangan / Karakter */}
                  <div
                    onClick={() => setActiveTab("perkembangan")}
                    style={menuCardStyle}
                  >
                    <div
                      style={{
                        ...squircleIconStyle,
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                        boxShadow: "0 6px 16px -2px rgba(139, 92, 246, 0.38)",
                      }}
                    >
                      <FileText size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Perkembangan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW SUB-TAB: HEADER SUBVIEW (IDENTIK HEADER SUBVIEW OWNER)
          ========================================================================= */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Mobile Header Subview Identik Owner */}
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 40,
                background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
                color: "#ffffff",
                padding: "12px 14px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 6px 18px rgba(0,0,0,0.16)",
                borderBottomLeftRadius: "18px",
                borderBottomRightRadius: "18px",
                marginBottom: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab("beranda")}
                aria-label="Kembali ke Beranda"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "#ffffff",
                  borderRadius: "12px",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.8} />
              </button>

              <div
                style={{
                  textAlign: "center",
                  flex: 1,
                  padding: "0 8px",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    letterSpacing: "-0.2px",
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#ffffff",
                    textShadow: "0 1px 3px rgba(0,0,0,0.25)",
                  }}
                >
                  {activeTab === "absen-mengaji" && "Presensi Mengaji Santri"}
                  {activeTab === "laporan-mengaji" &&
                    "Laporan Presensi Mengaji"}
                  {activeTab === "laporan-berjamaah" &&
                    "Laporan Presensi Berjamaah"}
                  {activeTab === "teguran" && "Catatan Pelanggaran & Ta'zir"}
                  {activeTab === "praktek" && "Evaluasi Praktek Ibadah"}
                  {activeTab === "perkembangan" &&
                    "Laporan Perkembangan Santri"}
                  {(activeTab === "master-pengembangan" ||
                    activeTab === "setting-pengembangan") &&
                    "Master Bidang & Penilaian Perkembangan"}
                  {activeTab === "santri" && "Data & Demografi Santri"}
                  {(activeTab === "settings" || activeTab === "profil") &&
                    "Pengaturan & Profil Pengajar"}
                </span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: "#a7f3d0",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "inline-block",
                    marginTop: "1px",
                  }}
                >
                  PORTAL ASATIDZ / PENGAJAR
                </span>
              </div>

              {/* Spacer kanan agar judul tetap di tengah simetris */}
              <div style={{ width: "36px", height: "36px", flexShrink: 0 }} />
            </div>

            {/* Subview Content Container */}
            <div
              style={{
                padding:
                  activeTab === "absen-mengaji" ||
                  activeTab === "perkembangan" ||
                  activeTab === "teguran" ||
                  activeTab === "praktek" ||
                  activeTab === "settings" ||
                  activeTab === "profil" ||
                  activeTab === "master-pengembangan" ||
                  activeTab === "setting-pengembangan"
                    ? 0
                    : "0 14px 20px",
                flex: 1,
              }}
            >
              {activeTab === "absen-mengaji" && <PengajarAbsenMengaji />}
              {activeTab === "laporan-mengaji" && (
                <PengajarLaporanMengaji initialStatus={presensiFilter} />
              )}
              {activeTab === "laporan-berjamaah" && (
                <PengajarLaporanBerjamaah initialStatus={presensiFilter} />
              )}
              {activeTab === "teguran" && <PengajarTeguranView />}
              {activeTab === "praktek" && <PengajarPraktekView />}
              {activeTab === "perkembangan" && <PengajarPerkembanganView />}
              {(activeTab === "master-pengembangan" ||
                activeTab === "setting-pengembangan") && (
                <MobileMasterPengembangan
                  onBack={() => setActiveTab("settings")}
                />
              )}
              {activeTab === "santri" && <OwnerLaporanSantri />}
              {(activeTab === "settings" || activeTab === "profil") && (
                <MobileProfil
                  onChangeTab={(tab) => {
                    if (tab === "home") setActiveTab("beranda");
                    else if (
                      tab === "master-pengembangan" ||
                      tab === "setting-pengembangan"
                    ) {
                      setActiveTab("master-pengembangan");
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  onLogout={onLogout}
                />
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            BOTTOM NAVIGATION BAR PORTAL PENGAJAR (IDENTIK DENGAN ADMIN MOBILE - 4 MENU)
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          {/* 1. Beranda */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "beranda" ? "active" : ""}`}
            onClick={() => setActiveTab("beranda")}
          >
            <div
              className={`nav-icon-wrapper ${activeTab === "beranda" ? "active" : ""}`}
            >
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Mengaji */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "absen-mengaji" || activeTab === "laporan-mengaji" ? "active" : ""}`}
            onClick={() => setActiveTab("absen-mengaji")}
          >
            <div
              className={`nav-icon-wrapper ${activeTab === "absen-mengaji" || activeTab === "laporan-mengaji" ? "active" : ""}`}
            >
              <BookOpen size={20} />
            </div>
            <span>Mengaji</span>
          </button>

          {/* 3. Perkembangan */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "perkembangan" || activeTab === "master-pengembangan" || activeTab === "setting-pengembangan" ? "active" : ""}`}
            onClick={() => setActiveTab("perkembangan")}
          >
            <div
              className={`nav-icon-wrapper ${activeTab === "perkembangan" || activeTab === "master-pengembangan" || activeTab === "setting-pengembangan" ? "active" : ""}`}
            >
              <Award size={20} />
            </div>
            <span>Perkembangan</span>
          </button>

          {/* 4. Settings */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "settings" || activeTab === "profil" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <div
              className={`nav-icon-wrapper ${activeTab === "settings" || activeTab === "profil" ? "active" : ""}`}
            >
              <Settings size={20} />
            </div>
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
