import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  Wallet,
  CreditCard,
  Fingerprint,
  BookOpen,
  Clock,
  Users,
  GraduationCap,
  ShieldAlert,
  Bell,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  FileText,
  Megaphone,
  RotateCw,
  User,
  HeartHandshake,
  Award,
  Sparkles,
  RefreshCw,
  Calendar
} from "lucide-react";
import { showConfirm, toastSuccess } from "../../utils/alert.util";
import OwnerLaporanKeuangan from "./OwnerLaporanKeuangan";
import OwnerLaporanPresensi from "./OwnerLaporanPresensi";
import OwnerLaporanPerizinan from "./OwnerLaporanPerizinan";
import OwnerLaporanSantri from "./OwnerLaporanSantri";

const squircleIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "6px",
  transition: "transform 0.15s ease",
  cursor: "pointer"
};

const menuCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
  userSelect: "none"
};

const menuLabelStyle = {
  fontSize: "0.67rem",
  fontWeight: 700,
  color: "#334155",
  lineHeight: 1.2,
  maxWidth: "72px",
  display: "block"
};

export default function OwnerDashboardView({ onLogout }) {
  // Navigation: 'beranda' | 'keuangan' | 'presensi' | 'perizinan' | 'santri' | 'profil'
  const [activeTab, setActiveTab] = useState("beranda");
  const [financeActiveTab, setFinanceActiveTab] = useState("kas"); // 'kas' | 'tagihan'
  const [presensiFilter, setPresensiFilter] = useState("Semua");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [feedList, setFeedList] = useState([]);

  const handleOpenPresensiWithStatus = (status) => {
    setPresensiFilter(status);
    setActiveTab("presensi");
  };

  // Session Data for Owner
  const ownerSession = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("desktop_session") ||
        localStorage.getItem("mobile_session") ||
        "{}"
      );
    } catch (e) {
      return {};
    }
  })();

  const ownerName = ownerSession.nama || ownerSession.nama_lengkap || "Dewan Pembina / Yayasan";

  // Summary KPIs from API
  const [summary, setSummary] = useState({
    totalSantri: 0,
    santriPutra: 0,
    santriPutri: 0,
    totalIzinAktif: 0,
    totalKasMasuk: 0,
    totalPiutang: 0,
    totalInfak: 0,
    presensiHariIni: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persenHadir: 0
    }
  });

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await axios.get("/api/owner/summary");
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal mengambil summary owner:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await axios.get("/api/informasi-kegiatan/feed?active_only=1&limit=6");
      if (res.data?.success) {
        setFeedList(res.data.data.feed || []);
      }
    } catch (e) {
      // feed fallback
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchFeed();
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari Portal Eksekutif Owner?",
      "Ya, Keluar",
      "Batal"
    );
    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("desktop_session");
      localStorage.removeItem("mobile_session");
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

  const formatRp = (n) => `Rp ${(n || 0).toLocaleString("id-ID")}`;

  const countHadir = summary.presensiHariIni?.hadir || 0;
  const countSakit = summary.presensiHariIni?.sakit || 0;
  const countIzin = summary.presensiHariIni?.izin || 0;
  const countAlfa = summary.presensiHariIni?.alfa || 0;

  const totalFinancialObligation = (summary.totalKasMasuk || 0) + (summary.totalPiutang || 0);
  const collectionRate = totalFinancialObligation > 0
    ? Math.round(((summary.totalKasMasuk || 0) / totalFinancialObligation) * 100)
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#e2e8f0",
        backgroundImage: "radial-gradient(at 0% 0%, rgba(13, 118, 110, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(15, 23, 42, 0.06) 0px, transparent 50%)",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 0,
        margin: 0
      }}
    >
      {/* MOBILE CONTAINER WRAPPER (Max 440px on desktop, full-width on mobile) */}
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
          boxSizing: "border-box"
        }}
      >
        {/* =========================================================================
            VIEW 1: BERANDA EKSEKUTIF (EXACT DESIGN MATCHING SCREENSHOT)
        ========================================================================= */}
        {activeTab === "beranda" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Top Modern Teal Gradient Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
                padding: "16px 16px 34px",
                color: "#ffffff",
                borderBottomLeftRadius: "24px",
                borderBottomRightRadius: "24px",
                position: "relative"
              }}
            >
              {/* Header Top Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                {/* Brand Logo: NWF Mobile + Executive Subtitle */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", userSelect: "none" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "14px",
                      background: "linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(167,243,208,0.15) 100%)",
                      border: "1.5px solid rgba(255, 255, 255, 0.42)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3.5px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
                      flexShrink: 0
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
                        boxSizing: "border-box"
                      }}
                    >
                      <img
                        src="/nwf.png"
                        alt="NWF Logo"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentNode.innerHTML = '<span style="font-weight:900;color:#0d766e;font-size:14px">NWF</span>';
                        }}
                        style={{
                          width: "26px",
                          height: "26px",
                          objectFit: "contain",
                          display: "block"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                      <span
                        style={{
                          fontWeight: 900,
                          fontSize: "1.45rem",
                          letterSpacing: "-0.5px",
                          color: "#ffffff",
                          lineHeight: 1,
                          textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
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
                          textShadow: "0 2px 6px rgba(11, 107, 96, 0.35)"
                        }}
                      >
                        Mobile
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
                        lineHeight: 1
                      }}
                    >
                      Portal Eksekutif Owner
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons (Refresh, Notifikasi, Logout) */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={fetchSummary}
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
                      borderRadius: "10px"
                    }}
                  >
                    <RefreshCw size={17} className={loadingSummary ? "animate-spin" : ""} />
                  </button>

                  <button
                    onClick={() => setActiveTab("presensi")}
                    title="Presensi Berjamaah Realtime"
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
                      position: "relative"
                    }}
                  >
                    <Bell size={18} />
                    <span
                      style={{
                        position: "absolute",
                        top: "-3px",
                        right: "-3px",
                        minWidth: "16px",
                        height: "16px",
                        padding: "0 3px",
                        borderRadius: "99px",
                        background: "#ef4444",
                        color: "#ffffff",
                        fontSize: "0.58rem",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid #0d766e"
                      }}
                    >
                      {summary.totalIzinAktif > 0 ? summary.totalIzinAktif : "!"}
                    </span>
                  </button>

                  <button
                    onClick={handleLogout}
                    style={{
                      background: "rgba(255, 255, 255, 0.15)",
                      border: "none",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: "7px",
                      borderRadius: "10px"
                    }}
                    title="Keluar Akun"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. REKAP STATUS KEHADIRAN & IBADAH (OVERLAPPING WHITE CARD) */}
            <div style={{ padding: "0 14px", marginTop: "-24px", position: "relative", zIndex: 12 }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 12px 10px",
                  boxShadow: "0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)"
                }}
              >
                {/* Header Profile Info: Nama Owner / Yayasan */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #f1f5f9"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1, paddingRight: "8px" }}>
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
                        flexShrink: 0
                      }}
                    >
                      <User size={16} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 900,
                          color: "#0f172a",
                          letterSpacing: "-0.2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {ownerName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 600,
                          color: "#64748b",
                          lineHeight: 1.1,
                          marginTop: "1px"
                        }}
                      >
                        Status: Eksekutif Realtime • {summary.totalSantri || 0} Santri
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("presensi")}
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
                      transition: "all 0.15s ease"
                    }}
                  >
                    Rincian <ChevronRight size={12} />
                  </button>
                </div>

                {/* 4 Cards Grid (Pastel Touchable Badges) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "6px"
                  }}
                >
                  {/* Hadir */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Hadir")}
                    style={{
                      background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #bbf7d0",
                      cursor: "pointer",
                      outline: "none",
                      transition: "transform 0.15s ease",
                      userSelect: "none"
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
                        boxShadow: "0 3px 8px -1px rgba(16, 185, 129, 0.35)"
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
                        lineHeight: 1
                      }}
                    >
                      {countHadir}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#166534", marginTop: "2px" }}>
                      Hadir
                    </span>
                  </button>

                  {/* Sakit */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Sakit")}
                    style={{
                      background: "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #fecaca",
                      cursor: "pointer",
                      outline: "none",
                      transition: "transform 0.15s ease",
                      userSelect: "none"
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
                        boxShadow: "0 3px 8px -1px rgba(239, 68, 68, 0.35)"
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
                        lineHeight: 1
                      }}
                    >
                      {countSakit}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#991b1b", marginTop: "2px" }}>
                      Sakit
                    </span>
                  </button>

                  {/* Izin */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Izin")}
                    style={{
                      background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #fde68a",
                      cursor: "pointer",
                      outline: "none",
                      transition: "transform 0.15s ease",
                      userSelect: "none"
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
                        boxShadow: "0 3px 8px -1px rgba(245, 158, 11, 0.35)"
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
                        lineHeight: 1
                      }}
                    >
                      {countIzin}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#92400e", marginTop: "2px" }}>
                      Izin
                    </span>
                  </button>

                  {/* Alfa */}
                  <button
                    type="button"
                    onClick={() => handleOpenPresensiWithStatus("Alfa")}
                    style={{
                      background: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)",
                      borderRadius: "14px",
                      padding: "8px 4px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      border: "1px solid #99f6e4",
                      cursor: "pointer",
                      outline: "none",
                      transition: "transform 0.15s ease",
                      userSelect: "none"
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
                        boxShadow: "0 3px 8px -1px rgba(13, 148, 136, 0.35)"
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
                        lineHeight: 1
                      }}
                    >
                      {countAlfa}
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#115e59", marginTop: "2px" }}>
                      Alfa
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. CARD FINANSIAL KEUANGAN (EXACT LUXURY GREEN FINTECH GRADIENT) */}
            <div style={{ padding: "8px 14px 0", position: "relative", zIndex: 11 }}>
              <div
                style={{
                  background: financeActiveTab === "kas"
                    ? "linear-gradient(135deg, #059669 0%, #0d9488 45%, #064e3b 100%)"
                    : "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #0f172a 100%)",
                  borderRadius: "18px",
                  padding: "12px 14px 12px",
                  border: financeActiveTab === "kas"
                    ? "1px solid rgba(167, 243, 208, 0.45)"
                    : "1px solid rgba(191, 219, 254, 0.45)",
                  boxShadow: financeActiveTab === "kas"
                    ? "0 10px 25px -4px rgba(5, 150, 105, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)"
                    : "0 10px 25px -4px rgba(30, 58, 138, 0.42), 0 4px 10px rgba(0, 0, 0, 0.06)",
                  position: "relative",
                  overflow: "hidden",
                  color: "#ffffff",
                  transition: "all 0.25s ease"
                }}
              >
                {/* Ambient Glow Accent */}
                <div
                  style={{
                    position: "absolute",
                    top: "-30px",
                    right: "-30px",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    background: financeActiveTab === "kas" ? "rgba(110, 231, 183, 0.22)" : "rgba(147, 197, 253, 0.22)",
                    filter: "blur(25px)",
                    pointerEvents: "none"
                  }}
                />

                {/* Switcher Pill: Kas Masuk & Tagihan / Piutang */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                    background: "rgba(0, 0, 0, 0.25)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    padding: "3px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    position: "relative",
                    zIndex: 2
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFinanceActiveTab("kas")}
                    style={{
                      border: "none",
                      background: financeActiveTab === "kas" ? "#ffffff" : "transparent",
                      color: financeActiveTab === "kas" ? "#047857" : "rgba(255, 255, 255, 0.85)",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      padding: "4px 8px",
                      borderRadius: "9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      boxShadow: financeActiveTab === "kas" ? "0 2px 6px rgba(0,0,0,0.18)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Wallet size={13} strokeWidth={2.4} color={financeActiveTab === "kas" ? "#047857" : "rgba(255, 255, 255, 0.85)"} />
                    <span>Tabungan / Kas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceActiveTab("tagihan")}
                    style={{
                      border: "none",
                      background: financeActiveTab === "tagihan" ? "#ffffff" : "transparent",
                      color: financeActiveTab === "tagihan" ? "#1d4ed8" : "rgba(255, 255, 255, 0.85)",
                      fontWeight: 800,
                      fontSize: "11.5px",
                      padding: "4px 8px",
                      borderRadius: "9px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      boxShadow: financeActiveTab === "tagihan" ? "0 2px 6px rgba(0,0,0,0.18)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <CreditCard size={13} strokeWidth={2.4} color={financeActiveTab === "tagihan" ? "#1d4ed8" : "rgba(255, 255, 255, 0.85)"} />
                    <span>Tagihan / SPP</span>
                    {(summary.totalPiutang || 0) > 0 && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#ef4444",
                          boxShadow: "0 0 6px rgba(239, 68, 68, 0.8)"
                        }}
                      />
                    )}
                  </button>
                </div>

                {/* Kas Masuk Content */}
                {financeActiveTab === "kas" ? (
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            color: "#a7f3d0",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            lineHeight: 1.1
                          }}
                        >
                          SALDO KAS MASUK PESANTREN
                        </div>
                        <div
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 900,
                            color: "#ffffff",
                            letterSpacing: "-0.3px",
                            lineHeight: 1.15,
                            marginTop: "3px",
                            textShadow: "0 2px 8px rgba(0,0,0,0.18)"
                          }}
                        >
                          {formatRp(summary.totalKasMasuk)}
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("keuangan")}
                        title="Buka Laporan Keuangan Lengkap"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.2)",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: "8px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <Wallet size={16} strokeWidth={2.4} />
                      </div>
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255, 255, 255, 0.16)",
                        margin: "8px 0 7px"
                      }}
                    />

                    {/* Sub Metrics: Crisp White Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px"
                      }}
                    >
                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase"
                          }}
                        >
                          TOTAL UANG MASUK
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#059669",
                            marginTop: "2px",
                            letterSpacing: "-0.2px"
                          }}
                        >
                          +{formatRp(summary.totalKasMasuk)}
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase"
                          }}
                        >
                          TOTAL PIUTANG / TUNGGAKAN
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#e11d48",
                            marginTop: "2px",
                            letterSpacing: "-0.2px"
                          }}
                        >
                          -{formatRp(summary.totalPiutang)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tagihan SPP Content */
                  <div style={{ position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            color: "#bae6fd",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            lineHeight: 1.1
                          }}
                        >
                          TOTAL PIUTANG &amp; TUNGGAKAN
                        </div>
                        <div
                          style={{
                            fontSize: "1.35rem",
                            fontWeight: 900,
                            color: "#ffffff",
                            letterSpacing: "-0.3px",
                            lineHeight: 1.15,
                            marginTop: "3px",
                            textShadow: "0 2px 8px rgba(0,0,0,0.18)"
                          }}
                        >
                          {formatRp(summary.totalPiutang)}
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("keuangan")}
                        title="Buka Data Tunggakan"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.2)",
                          border: "1px solid rgba(255, 255, 255, 0.35)",
                          backdropFilter: "blur(4px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#ffffff",
                          cursor: "pointer",
                          flexShrink: 0,
                          marginLeft: "8px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <CreditCard size={16} strokeWidth={2.4} />
                      </div>
                    </div>

                    <div
                      style={{
                        height: "1px",
                        background: "rgba(255, 255, 255, 0.16)",
                        margin: "8px 0 7px"
                      }}
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px"
                      }}
                    >
                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase"
                          }}
                        >
                          SANTRI AKTIF
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: "#1d4ed8",
                            marginTop: "2px",
                            letterSpacing: "-0.2px"
                          }}
                        >
                          {summary.totalSantri || 0} Santri
                        </div>
                      </div>

                      <div
                        style={{
                          background: "#ffffff",
                          padding: "8px 11px",
                          borderRadius: "11px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.14)",
                          border: "1px solid rgba(255, 255, 255, 0.9)"
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.56rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase"
                          }}
                        >
                          TINGKAT PELUNASAN
                        </div>
                        <div
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 900,
                            color: collectionRate >= 70 ? "#059669" : "#d97706",
                            marginTop: "2px",
                            letterSpacing: "-0.2px"
                          }}
                        >
                          {collectionRate}% Tercapai
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SECTION MENU LAYANAN EKSEKUTIF (8 SQUIRCLE ICONS IN 2X4 GRID) */}
            <div style={{ padding: "0 14px", marginTop: "12px" }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  border: "1px solid #e2e8f0",
                  padding: "12px 12px 14px",
                  boxShadow: "0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)"
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
                    letterSpacing: "-0.2px"
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "14px",
                      background: "#0d766e",
                      borderRadius: "4px"
                    }}
                  />
                  Menu Layanan Eksekutif
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "14px 4px",
                    justifyItems: "center"
                  }}
                >
                  {/* 1. Kas & SPP */}
                  <div onClick={() => setActiveTab("keuangan")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        boxShadow: "0 6px 16px -2px rgba(16, 185, 129, 0.38)"
                      }}
                    >
                      <Wallet size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Kas &amp; SPP</span>
                  </div>

                  {/* 2. Tagihan SPP */}
                  <div onClick={() => setActiveTab("keuangan")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        boxShadow: "0 6px 16px -2px rgba(59, 130, 246, 0.38)"
                      }}
                    >
                      <CreditCard size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Tagihan SPP</span>
                  </div>

                  {/* 3. Berjamaah */}
                  <div onClick={() => setActiveTab("presensi")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                        boxShadow: "0 6px 16px -2px rgba(6, 182, 212, 0.38)"
                      }}
                    >
                      <Fingerprint size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Berjamaah</span>
                  </div>

                  {/* 4. Kamar Asrama */}
                  <div onClick={() => setActiveTab("santri")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                        boxShadow: "0 6px 16px -2px rgba(139, 92, 246, 0.38)"
                      }}
                    >
                      <Building2 size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Asrama</span>
                  </div>

                  {/* 5. Perizinan */}
                  <div onClick={() => setActiveTab("perizinan")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                        boxShadow: "0 6px 16px -2px rgba(249, 115, 22, 0.38)"
                      }}
                    >
                      <Clock size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Perizinan</span>
                  </div>

                  {/* 6. Data Santri */}
                  <div onClick={() => setActiveTab("santri")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        boxShadow: "0 6px 16px -2px rgba(99, 102, 241, 0.38)"
                      }}
                    >
                      <Users size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Data Santri</span>
                  </div>

                  {/* 7. Rombel Kelas */}
                  <div onClick={() => setActiveTab("santri")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                        boxShadow: "0 6px 16px -2px rgba(20, 184, 166, 0.38)"
                      }}
                    >
                      <GraduationCap size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Rombel Kelas</span>
                  </div>

                  {/* 8. Tata Tertib */}
                  <div onClick={() => setActiveTab("perizinan")} style={menuCardStyle}>
                    <div
                      style={{
                        ...squircleIconStyle,
                        background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                        boxShadow: "0 6px 16px -2px rgba(244, 63, 94, 0.38)"
                      }}
                    >
                      <ShieldAlert size={23} strokeWidth={2.3} color="#ffffff" />
                    </div>
                    <span style={menuLabelStyle}>Tata Tertib</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SECTION KEGIATAN PESANTREN */}
            <div style={{ padding: "12px 14px 4px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px"
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    letterSpacing: "-0.2px"
                  }}
                >
                  <span
                    style={{
                      width: "4px",
                      height: "15px",
                      background: "#0d766e",
                      borderRadius: "4px"
                    }}
                  />
                  Kegiatan Pesantren
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#0d766e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px"
                  }}
                >
                  Lihat Semua &gt;
                </span>
              </div>

              {/* Feed Card */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {feedList.length > 0 ? (
                  feedList.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        border: "1px solid #e2e8f0",
                        padding: "10px 12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#ecfdf5",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Megaphone size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {item.judul || "Agenda Resmi Pesantren"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.64rem",
                            color: "#64748b",
                            marginTop: "2px",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {item.deskripsi || item.isi || "Pengumuman dan kegiatan rutin santri terpadu."}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      padding: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "#ecfdf5",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#0f172a" }}>
                        Seluruh Program Berjalan Normal
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "2px" }}>
                        KBM, Kajian Kitab, dan Ibadah Berjamaah terpantau aktif realtime.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW 2: SUBVIEW LAPORAN SPESIFIK DENGAN HEADER MOBILE APP
          ========================================================================= */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Mobile Header Subview */}
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
                marginBottom: "12px"
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
                  flexShrink: 0
                }}
              >
                <ChevronLeft size={20} strokeWidth={2.8} />
              </button>

              <div style={{ textAlign: "center", flex: 1, padding: "0 8px", minWidth: 0 }}>
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
                    textShadow: "0 1px 3px rgba(0,0,0,0.25)"
                  }}
                >
                  {activeTab === "keuangan" && "Laporan Keuangan"}
                  {activeTab === "presensi" && "Laporan Presensi Berjamaah"}
                  {activeTab === "perizinan" && "Laporan Perizinan Santri"}
                  {activeTab === "santri" && "Data & Demografi Santri"}
                  {activeTab === "profil" && "Profil Dewan Pembina"}
                </span>
                <span
                  style={{
                    fontSize: "0.58rem",
                    color: "#a7f3d0",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "inline-block",
                    marginTop: "1px"
                  }}
                >
                  PANEL EKSEKUTIF OWNER
                </span>
              </div>

              {/* Invisible spacer for symmetrical center alignment */}
              <div style={{ width: "36px", height: "36px", flexShrink: 0 }} />
            </div>

            {/* Subview Container */}
            <div style={{ padding: "0 14px 20px" }}>
              {activeTab === "profil" ? (
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "20px 16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    textAlign: "center"
                  }}
                >
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "20px",
                      background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      boxShadow: "0 8px 20px -4px rgba(13, 118, 110, 0.4)"
                    }}
                  >
                    <User size={32} />
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 900, color: "#0f172a" }}>
                    {ownerName}
                  </h3>
                  <p style={{ margin: "0 0 16px", fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
                    Hak Akses: Yayasan / Dewan Pembina (View-Only)
                  </p>
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "12px",
                      padding: "12px",
                      textAlign: "left",
                      fontSize: "0.72rem",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                      marginBottom: "16px"
                    }}
                  >
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Peran:</strong> Pemantauan &amp; Laporan Eksekutif Realtime
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      <strong>Cakupan:</strong> Keuangan SPP, Presensi Sholat, Tahfidz, Perizinan, Data Santri
                    </div>
                    <div>
                      <strong>Aman &amp; Terlindungi:</strong> Hak akses Owner bersifat pemantauan / read-only tanpa risiko manipulasi data.
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "12px",
                      background: "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.35)"
                    }}
                  >
                    <LogOut size={16} /> Keluar Akun
                  </button>
                </div>
              ) : (
                <div>
                  {activeTab === "keuangan" && <OwnerLaporanKeuangan />}
                  {activeTab === "presensi" && <OwnerLaporanPresensi initialStatus={presensiFilter} />}
                  {activeTab === "perizinan" && <OwnerLaporanPerizinan />}
                  {activeTab === "santri" && <OwnerLaporanSantri />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ELEVATED FLOATING DARK TEAL BOTTOM NAVIGATION BAR (MATCHING SCREENSHOT)
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          {/* 1. Beranda */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "beranda" ? "active" : ""}`}
            onClick={() => setActiveTab("beranda")}
          >
            <div className={`nav-icon-wrapper ${activeTab === "beranda" ? "active" : ""}`}>
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Keuangan / Tagihan */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "keuangan" ? "active" : ""}`}
            onClick={() => setActiveTab("keuangan")}
          >
            <div className={`nav-icon-wrapper ${activeTab === "keuangan" ? "active" : ""}`}>
              <CreditCard size={20} />
            </div>
            <span>Keuangan</span>
          </button>

          {/* 3. Center Floating Fingerprint FAB (Presensi Berjamaah) */}
          <button
            type="button"
            className="mobile-fab-center"
            onClick={() => setActiveTab("presensi")}
            title="Presensi Berjamaah Realtime"
          >
            <div className="fab-inner-glow">
              <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
            </div>
          </button>

          {/* 4. Data Santri */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "santri" ? "active" : ""}`}
            onClick={() => setActiveTab("santri")}
          >
            <div className={`nav-icon-wrapper ${activeTab === "santri" ? "active" : ""}`}>
              <Users size={20} />
            </div>
            <span>Santri</span>
          </button>

          {/* 5. Profil */}
          <button
            type="button"
            className={`mobile-nav-item ${activeTab === "profil" ? "active" : ""}`}
            onClick={() => setActiveTab("profil")}
          >
            <div className={`nav-icon-wrapper ${activeTab === "profil" ? "active" : ""}`}>
              <User size={20} />
            </div>
            <span>Profil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
