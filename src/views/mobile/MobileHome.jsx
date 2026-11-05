import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Fingerprint,
  BookOpen,
  DoorOpen,
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  Clock,
  Key,
  Bell,
  LogOut,
  Check,
  Building2,
  Calendar,
  Send,
  UserCheck,
  Award,
  Layers,
  Sparkles,
  PieChart,
  User,
  HeartPulse,
  AlertTriangle,
  HeartHandshake,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  Filter,
  Smile,
  CreditCard,
  DollarSign,
  Wallet,
  Zap,
  RotateCw,
  ArrowRight,
  Receipt,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Headphones,
} from "lucide-react";
import { showSuccess, showConfirm } from "../../utils/alert.util";

export default function MobileHome({ onChangeTab, onLogout }) {
  const [showBalanceEye, setShowBalanceEye] = useState(true);
  const [stats, setStats] = useState({
    total_santri: 0,
    total_halaqah: 0,
    total_izin_aktif: 0,
  });

  const [rekapAbsensi, setRekapAbsensi] = useState({
    hadir: 0,
    sakit: 0,
    izin: 0,
    alfa: 0,
    total: 0,
  });

  // Modal State untuk Detail Absensi Hari Ini
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailCardOpen, setIsDetailCardOpen] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState("Hadir"); // 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [selectedKegiatan, setSelectedKegiatan] = useState("Semua"); // 'Semua' | nama_sesi
  const [sesiList, setSesiList] = useState([]);
  const [todayAbsensiList, setTodayAbsensiList] = useState([]);
  const [searchModalText, setSearchModalText] = useState("");

  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem("mobile_session") || "{}");
    } catch (e) {
      return {};
    }
  })();

  const rawName =
    sessionData.nama ||
    sessionData.username ||
    "Admin";
  const displayName = rawName.split(" ")[0];

  // Auto reset scroll to top on mount (cegah header ketutup/terpotong saat refresh)
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    const container = document.querySelector(".mobile-content");
    if (container) {
      container.scrollTop = 0;
    }
  }, []);

  // Update clock & date
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Realtime Data: Santri & Rekap Absensi
  const loadData = async () => {
    try {
      const [resSantri, resRekap, resSesi, resAbsensi] = await Promise.allSettled([
        axios.get("/api/santri"),
        axios.get("/api/absensi/rekap-harian"),
        axios.get("/api/absensi/sesi"),
        axios.get("/api/absensi/hari-ini"),
      ]);

      if (resSantri.status === "fulfilled" && resSantri.value.data?.success) {
        const santriArr = resSantri.value.data.data || [];
        setStats((prev) => ({
          ...prev,
          total_santri: santriArr.length,
        }));
      }

      if (resRekap.status === "fulfilled" && resRekap.value.data?.success) {
        const r = resRekap.value.data.data;
        if (r) {
          setRekapAbsensi({
            hadir: Number(r.hadir || 0),
            sakit: Number(r.sakit || 0),
            izin: Number(r.izin || 0),
            alfa: Number(r.alfa || 0),
            total: Number(r.total || 0),
          });
        }
      }

      if (resSesi.status === "fulfilled" && resSesi.value.data?.success) {
        setSesiList(resSesi.value.data.data || []);
      }

      if (resAbsensi.status === "fulfilled" && resAbsensi.value.data?.success) {
        setTodayAbsensiList(resAbsensi.value.data.data || []);
      }
    } catch (err) {
      console.warn("Notice loading mobile home data:", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenStatusModal = (statusKey) => {
    setSelectedStatusTab(statusKey);
    setIsDetailModalOpen(true);
  };

  const handleOpenAccountInfo = () => {
    setIsDetailCardOpen(true);
  };

  // Filter santri list in modal
  const filteredModalList = todayAbsensiList.filter((item) => {
    const stMatch =
      !selectedStatusTab ||
      (item.status || "").toLowerCase() === selectedStatusTab.toLowerCase();
    const qMatch =
      !searchModalText ||
      (item.nama_santri || "").toLowerCase().includes(searchModalText.toLowerCase()) ||
      (item.nis || "").toLowerCase().includes(searchModalText.toLowerCase()) ||
      (item.nama_asrama || "").toLowerCase().includes(searchModalText.toLowerCase()) ||
      (item.nama_kamar || "").toLowerCase().includes(searchModalText.toLowerCase());
    const sesMatch =
      selectedKegiatan === "Semua" ||
      (item.nama_sesi || "").toLowerCase() === selectedKegiatan.toLowerCase();
    return stMatch && qMatch && sesMatch;
  });

  const modalHadirCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "hadir"
  ).length;
  const modalSakitCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "sakit"
  ).length;
  const modalIzinCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "izin"
  ).length;
  const modalAlfaCount = todayAbsensiList.filter(
    (x) =>
      (x.status || "").toLowerCase() === "alfa" ||
      (x.status || "").toLowerCase() === "belum"
  ).length;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        paddingBottom: "32px",
        fontFamily:
          "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* =========================================================================
          TOP BANNER HEADER (CURVED TEAL LUXURY HEADER)
      ========================================================================= */}
      <div
        style={{
          background:
            "linear-gradient(180deg, #0b6b60 0%, #0d766e 70%, #095c53 100%)",
          padding: "16px 16px 46px",
          color: "#ffffff",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          position: "relative",
        }}
      >
        {/* Top App Header Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Brand Application: NWF Mobile (Mobile Miring & Menarik) */}
          <div
            onClick={handleOpenAccountInfo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {/* Glossy Brand Emblem Icon */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.08) 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 16px -2px rgba(0, 0, 0, 0.18)",
                flexShrink: 0,
              }}
            >
              <img
                src="/nwf.png"
                alt="NWF"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "block";
                }}
                style={{ width: "26px", height: "26px", objectFit: "contain" }}
              />
              <span
                style={{
                  display: "none",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  color: "#ffffff",
                  letterSpacing: "-0.5px",
                }}
              >
                NWF
              </span>
            </div>

            {/* Typography NWF Mobile */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1.42rem",
                    letterSpacing: "-0.6px",
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
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    letterSpacing: "0.2px",
                    color: "#a7f3d0",
                    lineHeight: 1,
                    textShadow: "0 2px 6px rgba(11, 107, 96, 0.35)",
                  }}
                >
                  Mobile
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.8)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginTop: "3px",
                  lineHeight: 1,
                }}
              >
                Pondok Pesantren Nurul Wafa
              </span>
            </div>
          </div>

          {/* Top 3 Action Icons (Card / Support / Notification) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* 1. Detail Card Icon */}
            <button
              onClick={handleOpenAccountInfo}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
              title="Detail Kartu Pesantren"
            >
              <CreditCard size={18} />
            </button>

            {/* 2. Customer Care / Bantuan */}
            <button
              onClick={() => onChangeTab("informasi")}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
              title="Layanan Bantuan"
            >
              <Headphones size={18} />
            </button>

            {/* 3. Notifikasi Bell */}
            <button
              onClick={() => onChangeTab("informasi")}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                padding: 0,
              }}
              title="Notifikasi"
            >
              <Bell size={18} />
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "1.5px solid #0d766e",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 1: FLOATING WHITE CARD (ADMIN ID CARD + PRESENSI STATUS PILLS)
      ========================================================================= */}
      <div
        style={{
          padding: "0 14px",
          marginTop: "-34px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "22px",
            padding: "12px",
            boxShadow:
              "0 12px 28px -4px rgba(11, 107, 96, 0.18), 0 3px 10px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e6f0ed",
            display: "flex",
            gap: "10px",
            alignItems: "stretch",
          }}
        >
          {/* Left 58%: Mini Blue Smart ID Card */}
          <div
            onClick={handleOpenAccountInfo}
            style={{
              flex: "1 1 58%",
              background: "linear-gradient(135deg, #0284c7 0%, #1e40af 100%)",
              borderRadius: "16px",
              padding: "10px 12px",
              color: "#ffffff",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "92px",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            }}
          >
            {/* Top row: Brand & Star emblem */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    color: "#f0f9ff",
                    lineHeight: 1.1,
                  }}
                >
                  Pondok Pesantren
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "0.02em",
                  }}
                >
                  Nurul Wafa
                </div>
              </div>
              <span
                style={{
                  fontSize: "1.1rem",
                  lineHeight: 1,
                  color: "#ffffff",
                  opacity: 0.9,
                }}
              >
                ✱
              </span>
            </div>

            {/* Bottom row: Cardholder details */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "34px",
                  borderRadius: "5px",
                  background: "#dc2626",
                  border: "1.5px solid #ffffff",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <User size={20} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "#ffffff",
                  }}
                >
                  {displayName || sessionData.nama || "Admin Nurul Wafa"}
                </div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "#bae6fd",
                    fontWeight: 600,
                    letterSpacing: "0.03em",
                  }}
                >
                  NWF-2026-ADM
                </div>
              </div>
            </div>
          </div>

          {/* Right 42%: Info Stats Pills (Sudah Absen & Belum Absen) */}
          <div
            style={{
              flex: "1 1 42%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "6px",
            }}
          >
            {/* Pill 1: Sudah Absen */}
            <div
              onClick={() => handleOpenStatusModal("Hadir")}
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "6px 8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckCircle2 size={11} color="#16a34a" />
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#166534",
                  }}
                >
                  Sudah Absen
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  color: "#14532d",
                  marginTop: "2px",
                }}
              >
                {rekapAbsensi.hadir} <span style={{ fontSize: "0.62rem", fontWeight: 600 }}>Santri</span>
              </div>
            </div>

            {/* Pill 2: Belum Absen */}
            <div
              onClick={() => handleOpenStatusModal("Alfa")}
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "12px",
                padding: "6px 8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <AlertTriangle size={11} color="#e11d48" />
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#9f1239",
                  }}
                >
                  Belum Absen
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 900,
                  color: "#881337",
                  marginTop: "2px",
                }}
              >
                {rekapAbsensi.alfa} <span style={{ fontSize: "0.62rem", fontWeight: 600 }}>Santri</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 2: DARK TEAL PILL BAR (PRESENSI SANTRI HARI INI & QUICK STATUS PILLS)
      ========================================================================= */}
      <div style={{ padding: "0 14px", marginTop: "10px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #0d7a6e 0%, #095c53 100%)",
            borderRadius: "18px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#ffffff",
            boxShadow: "0 6px 18px rgba(13, 122, 110, 0.25)",
          }}
        >
          {/* Left: Total Presensi Santri */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  display: "inline-block",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
              <span
                style={{
                  fontSize: "0.66rem",
                  color: "#a7f3d0",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                Presensi Hari Ini
              </span>
            </div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.3px",
                marginTop: "1px",
                display: "flex",
                alignItems: "baseline",
                gap: "4px",
              }}
            >
              <span>{rekapAbsensi.hadir}</span>
              <span style={{ fontSize: "0.72rem", color: "#a7f3d0", fontWeight: 700 }}>
                / {rekapAbsensi.total || stats.total_santri || 0}
              </span>
            </div>
          </div>

          {/* Right: 4 Quick Status Badges for instant filtering */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* Hadir */}
            <div
              onClick={() => handleOpenStatusModal("Hadir")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.12)",
                padding: "4px 8px",
                borderRadius: "10px",
                minWidth: "38px",
              }}
              title="Lihat Santri Hadir"
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#86efac" }}>
                {rekapAbsensi.hadir}
              </span>
              <span style={{ fontSize: "0.54rem", color: "#e6fffa", fontWeight: 700 }}>
                Hadir
              </span>
            </div>

            {/* Izin */}
            <div
              onClick={() => handleOpenStatusModal("Izin")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.12)",
                padding: "4px 8px",
                borderRadius: "10px",
                minWidth: "38px",
              }}
              title="Lihat Santri Izin"
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#fde047" }}>
                {rekapAbsensi.izin}
              </span>
              <span style={{ fontSize: "0.54rem", color: "#e6fffa", fontWeight: 700 }}>
                Izin
              </span>
            </div>

            {/* Sakit */}
            <div
              onClick={() => handleOpenStatusModal("Sakit")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                background: "rgba(255, 255, 255, 0.12)",
                padding: "4px 8px",
                borderRadius: "10px",
                minWidth: "38px",
              }}
              title="Lihat Santri Sakit"
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#cbd5e1" }}>
                {rekapAbsensi.sakit}
              </span>
              <span style={{ fontSize: "0.54rem", color: "#e6fffa", fontWeight: 700 }}>
                Sakit
              </span>
            </div>

            {/* Belum / Alfa */}
            <div
              onClick={() => handleOpenStatusModal("Alfa")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                background: "rgba(239, 68, 68, 0.25)",
                padding: "4px 8px",
                borderRadius: "10px",
                minWidth: "38px",
                border: "1px solid rgba(239, 68, 68, 0.35)",
              }}
              title="Lihat Santri Belum Absen"
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 900, color: "#fca5a5" }}>
                {rekapAbsensi.alfa}
              </span>
              <span style={{ fontSize: "0.54rem", color: "#fef2f2", fontWeight: 700 }}>
                Belum
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: DATA MASTER (4 PRIMARY BIG SQUIRCLES)
      ========================================================================= */}
      <div style={{ padding: "16px 14px 4px" }}>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "#1e293b",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "4px",
              height: "14px",
              background: "#0d766e",
              borderRadius: "2px",
            }}
          />
          Data Master
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
          }}
        >
          {/* 1. Santri (Emerald Green) */}
          <div
            onClick={() => onChangeTab("master-santri")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                boxShadow: "0 8px 18px -2px rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Users size={26} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Santri
            </span>
          </div>

          {/* 2. Kelas (Sky Blue) */}
          <div
            onClick={() => onChangeTab("master-kelas")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                boxShadow: "0 8px 18px -2px rgba(14, 165, 233, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <GraduationCap size={26} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Kelas
            </span>
          </div>

          {/* 3. Asrama (Purple) */}
          <div
            onClick={() => onChangeTab("master-asrama")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                boxShadow: "0 8px 18px -2px rgba(139, 92, 246, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Building size={26} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Asrama
            </span>
          </div>

          {/* 4. Kegiatan (Amber / Gold) */}
          <div
            onClick={() => onChangeTab("setting-shalat")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                boxShadow: "0 8px 18px -2px rgba(245, 158, 11, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <Calendar size={26} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Kegiatan
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: TRANSAKSI SANTRI (5 SOFT PASTEL SQUIRCLES)
      ========================================================================= */}
      <div style={{ padding: "14px 14px 6px" }}>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "#1e293b",
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              width: "4px",
              height: "14px",
              background: "#6366f1",
              borderRadius: "2px",
            }}
          />
          Transaksi Santri
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "8px",
          }}
        >
          {/* 1. Perizinan */}
          <div
            onClick={() => onChangeTab("perizinan")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "#ede9fe",
                border: "1px solid #ddd6fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6366f1",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.12)",
              }}
            >
              <Clock size={22} />
            </div>
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Perizinan
            </span>
          </div>

          {/* 2. Teguran / Tata Tertib */}
          <div
            onClick={() => onChangeTab("tata-tertib")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "#ffe4e6",
                border: "1px solid #fecdd3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#e11d48",
                boxShadow: "0 2px 8px rgba(225, 29, 72, 0.12)",
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Teguran
            </span>
          </div>

          {/* 3. Absensi */}
          <div
            onClick={() => onChangeTab("presensi")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.12)",
              }}
            >
              <Fingerprint size={22} />
            </div>
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Absensi
            </span>
          </div>

          {/* 4. Perkembangan */}
          <div
            onClick={() => onChangeTab("pengembangan")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "#e0f2fe",
                border: "1px solid #bae6fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)",
              }}
            >
              <Award size={22} />
            </div>
            <span
              style={{
                fontSize: "0.64rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Perkembangan
            </span>
          </div>

          {/* 5. Praktek */}
          <div
            onClick={() => onChangeTab("praktek-ibadah")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.12)",
              }}
            >
              <BookOpen size={22} />
            </div>
            <span
              style={{
                fontSize: "0.66rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.1,
              }}
            >
              Praktek
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: INFORMASI PESANTREN
      ========================================================================= */}
      <div style={{ padding: "14px 14px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              fontSize: "0.84rem",
              fontWeight: 800,
              color: "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "14px",
                background: "#0ea5e9",
                borderRadius: "2px",
              }}
            />
            Informasi & Pengumuman
          </div>
          <button
            onClick={() => onChangeTab("informasi")}
            style={{
              background: "#0d766e",
              border: "none",
              color: "#ffffff",
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: "999px",
              cursor: "pointer",
            }}
          >
            Lihat Semua
          </button>
        </div>

        {/* 2 Realtime Information Cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Card 1 */}
          <div
            onClick={() => onChangeTab("informasi")}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "12px 14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  color: "#0d766e",
                  background: "#ccfbf1",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                Kedisiplinan & Presensi
              </span>
              <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                Hari ini
              </span>
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              Perekaman Fingerprint Jamaah & Penutupan Sesi Otomatis
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              Sesi presensi shalat ditutup tepat waktu. Santri yang belum hadir otomatis masuk daftar Belum Absen.
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onChangeTab("informasi")}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "12px 14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  color: "#6366f1",
                  background: "#ede9fe",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                Pengasuhan Santri
              </span>
              <span style={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                Kemarin
              </span>
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.3,
                marginBottom: "4px",
              }}
            >
              Alur Verifikasi Perizinan Pulang & Jam Kunjungan Santri
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#64748b",
                lineHeight: 1.4,
              }}
            >
              Perizinan santri wajib melalui persetujuan wali asrama dan tercatat dalam sistem perizinan.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DETAIL PRESENSI SANTRI HARI INI
      ========================================================================= */}
      {isDetailModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {/* Backdrop click to close */}
          <div
            onClick={() => setIsDetailModalOpen(false)}
            style={{ position: "absolute", inset: 0 }}
          />

          {/* Modal Bottom Sheet Container */}
          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "430px",
              width: "100%",
              maxHeight: "86vh",
              background: "#ffffff",
              borderTopLeftRadius: "26px",
              borderTopRightRadius: "26px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            {/* Top Drag Handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "10px 0 4px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "#cbd5e1",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 18px 12px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Santri {selectedStatusTab} Hari Ini
                </h3>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "#64748b",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={13} color="#0284c7" />
                  <span>{currentDateStr || "Hari ini"}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 700, color: "#0284c7" }}>
                    {filteredModalList.length} Santri
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#f1f5f9",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Status Pills Selector inside modal */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "6px",
                padding: "10px 16px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {[
                {
                  key: "Hadir",
                  count: modalHadirCount,
                  color: "#10b981",
                  bg: "#ecfdf5",
                },
                {
                  key: "Sakit",
                  count: modalSakitCount,
                  color: "#ef4444",
                  bg: "#fef2f2",
                },
                {
                  key: "Izin",
                  count: modalIzinCount,
                  color: "#f59e0b",
                  bg: "#fffbeb",
                },
                {
                  key: "Alfa",
                  label: "Belum",
                  count: modalAlfaCount,
                  color: "#0d9488",
                  bg: "#f0fdfa",
                },
              ].map((st) => {
                const isActive = selectedStatusTab === st.key;
                return (
                  <button
                    key={st.key}
                    onClick={() => setSelectedStatusTab(st.key)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "12px",
                      border: isActive
                        ? `2px solid ${st.color}`
                        : "1px solid #e2e8f0",
                      background: isActive ? st.bg : "#ffffff",
                      color: isActive ? st.color : "#64748b",
                      fontSize: "0.74rem",
                      fontWeight: isActive ? 800 : 600,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "0 2px 8px rgba(0,0,0,0.06)"
                        : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{st.label || st.key}</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 900,
                      }}
                    >
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Search & Sesi Kegiatan */}
            <div
              style={{
                padding: "10px 16px",
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  background: "#f1f5f9",
                  borderRadius: "10px",
                  padding: "0 10px",
                  gap: "6px",
                }}
              >
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari santri / NIS / asrama..."
                  value={searchModalText}
                  onChange={(e) => setSearchModalText(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "8px 0",
                    fontSize: "0.76rem",
                    color: "#0f172a",
                    outline: "none",
                    width: "100%",
                  }}
                />
              </div>

              {sesiList.length > 0 && (
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    outline: "none",
                    maxWidth: "130px",
                  }}
                >
                  <option value="Semua">Semua Sesi</option>
                  {sesiList.map((s) => (
                    <option key={s.id || s.kode_sesi} value={s.nama_sesi}>
                      {s.nama_sesi}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* List Santri */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {filteredModalList.length > 0 ? (
                filteredModalList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#e0f2fe",
                          color: "#0284c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                        }}
                      >
                        {(item.nama_santri || "S").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {item.nama_santri || "Santri"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          NIS: {item.nis || "-"} • {item.nama_asrama || "Asrama"} / {item.nama_kamar || "-"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background:
                            (item.status || "").toLowerCase() === "hadir"
                              ? "#dcfce7"
                              : (item.status || "").toLowerCase() === "izin"
                              ? "#fef3c7"
                              : (item.status || "").toLowerCase() === "sakit"
                              ? "#fee2e2"
                              : "#f1f5f9",
                          color:
                            (item.status || "").toLowerCase() === "hadir"
                              ? "#15803d"
                              : (item.status || "").toLowerCase() === "izin"
                              ? "#b45309"
                              : (item.status || "").toLowerCase() === "sakit"
                              ? "#b91c1c"
                              : "#64748b",
                        }}
                      >
                        {item.status || selectedStatusTab}
                      </span>
                      <div
                        style={{
                          fontSize: "0.62rem",
                          color: "#94a3b8",
                          marginTop: "3px",
                        }}
                      >
                        {item.jam_absen || item.waktu || "-"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "0.82rem",
                  }}
                >
                  Tidak ada data santri dengan status{" "}
                  <strong>{selectedStatusTab}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETAIL KARTU ID ADMIN
      ========================================================================= */}
      {isDetailCardOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 0,
          }}
        >
          <div
            onClick={() => setIsDetailCardOpen(false)}
            style={{ position: "absolute", inset: 0 }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "430px",
              width: "100%",
              maxHeight: "86vh",
              background: "#ffffff",
              borderTopLeftRadius: "26px",
              borderTopRightRadius: "26px",
              padding: "20px 18px 30px",
              overflowY: "auto",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={18} color="#0d766e" />
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "#0f172a",
                  }}
                >
                  Detail Kartu Digital Pesantren
                </span>
              </div>
              <button
                onClick={() => setIsDetailCardOpen(false)}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#f1f5f9",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Big Smart ID Card Preview */}
            <div
              style={{
                background: "linear-gradient(135deg, #0284c7 0%, #1e40af 100%)",
                borderRadius: "20px",
                padding: "20px",
                color: "#ffffff",
                boxShadow: "0 10px 25px -4px rgba(2, 132, 199, 0.4)",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#bae6fd", fontWeight: 700 }}>
                    Pondok Pesantren
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>
                    Nurul Wafa
                  </div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>✱</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "50px",
                    height: "60px",
                    borderRadius: "8px",
                    background: "#dc2626",
                    border: "2px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={34} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: "0.98rem", fontWeight: 900 }}>
                    {displayName || "Admin Nurul Wafa"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#bae6fd", marginTop: "2px" }}>
                    ID: NWF-2026-ADM
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: "6px",
                      background: "rgba(255, 255, 255, 0.2)",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                    }}
                  >
                    ADMINISTRATOR PORTAL
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  setIsDetailCardOpen(false);
                  onChangeTab("master-santri");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Kelola Data Santri</span>
                <ChevronRight size={16} color="#64748b" />
              </button>

              <button
                onClick={() => {
                  setIsDetailCardOpen(false);
                  onChangeTab("presensi");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Buka Presensi Fingerprint</span>
                <ChevronRight size={16} color="#64748b" />
              </button>

              <button
                onClick={() => {
                  setIsDetailCardOpen(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#dc2626",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginTop: "6px",
                }}
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
