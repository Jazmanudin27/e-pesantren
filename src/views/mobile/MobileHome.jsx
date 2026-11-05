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
  ArrowLeft,
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
  const [santriMasterList, setSantriMasterList] = useState([]);
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

  const rawName = sessionData.nama || sessionData.username || "Admin";
  const displayName = rawName.split(" ")[0];

  // Auto reset scroll to top on mount (cegah header ketutup/terpotong saat refresh)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
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
        }),
      );
      setCurrentDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Realtime Data: Santri & Rekap Absensi
  const loadData = async () => {
    try {
      const [resSantri, resAbsensi, resIzin, resSesi] =
        await Promise.allSettled([
          axios.get("/api/santri?all=true"),
          axios.get("/api/absensi/fingerprint"),
          axios.get("/api/perizinan"),
          axios.get("/api/absensi/sesi"),
        ]);

      let allSantri = [];
      if (resSantri.status === "fulfilled" && resSantri.value.data?.success) {
        allSantri =
          resSantri.value.data.data?.data ||
          resSantri.value.data.data ||
          [];
        const totalCount =
          resSantri.value.data.data?.total ||
          resSantri.value.data.total ||
          allSantri.length;

        setSantriMasterList(allSantri);
        setStats((prev) => ({
          ...prev,
          total_santri: totalCount || allSantri.length,
        }));
      }

      if (resSesi.status === "fulfilled" && resSesi.value.data?.success) {
        setSesiList(
          resSesi.value.data.data?.data ||
          resSesi.value.data.data ||
          []
        );
      }

      // Hitung log hari ini
      const now = new Date();
      const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const rawLogs =
        resAbsensi.status === "fulfilled" && resAbsensi.value.data?.success
          ? resAbsensi.value.data.data?.data || resAbsensi.value.data.data || []
          : [];

      // Filter presensi yang tanggal hari ini
      const todayLogs = rawLogs.filter((l) => {
        const tgl = (l.tanggal || "").split("T")[0];
        return !tgl || tgl === todayDateStr;
      });

      // Filter unik per santri
      const loggedSantriMap = new Map();
      todayLogs.forEach((l) => {
        const sid = l.santri_id || l.id;
        if (sid && !loggedSantriMap.has(sid)) {
          loggedSantriMap.set(sid, l);
        }
      });

      let hadir = 0;
      let sakit = 0;
      let izin = 0;

      loggedSantriMap.forEach((l) => {
        const st = (l.status_kehadiran || l.status || "").toLowerCase();
        if (st.includes("hadir")) hadir++;
        else if (st.includes("sakit")) sakit++;
        else if (st.includes("izin")) izin++;
      });

      // Sinkronkan perizinan aktif (keluar pondok)
      if (resIzin.status === "fulfilled" && resIzin.value.data?.success) {
        const izinArr =
          resIzin.value.data.data?.data || resIzin.value.data.data || [];
        const activeIzin = izinArr.filter((i) => {
          const st = String(i.status || "").toLowerCase();
          return st.includes("aktif") || st.includes("luar");
        });

        setStats((prev) => ({ ...prev, total_izin_aktif: activeIzin.length }));

        activeIzin.forEach((iz) => {
          const sid = iz.santri_id;
          if (sid && !loggedSantriMap.has(sid)) {
            izin++;
            loggedSantriMap.set(sid, {
              id: `izin-${iz.id}`,
              santri_id: sid,
              nama_santri: iz.nama_santri,
              nis: iz.nis,
              status: "Izin",
              status_kehadiran: "Izin",
              nama_sesi: "Izin Keluar / Pulang",
              waktu_scan: iz.tgl_keluar_rencana ? String(iz.tgl_keluar_rencana).slice(11, 16) : "-",
            });
          }
        });
      }

      // RUMUS: Total santri dikurangi yang sudah input/absen (Hadir + Sakit + Izin)
      const totalSantriCount =
        (resSantri.status === "fulfilled" &&
          (resSantri.value.data.data?.total || resSantri.value.data.total)) ||
        allSantri.length;
      const sudahInputCount = hadir + sakit + izin;
      const belumAbsen =
        totalSantriCount > 0
          ? Math.max(0, totalSantriCount - sudahInputCount)
          : 0;

      setRekapAbsensi({
        hadir,
        sakit,
        izin,
        alfa: belumAbsen,
        total: totalSantriCount,
      });

      // Siapkan list santri yang sudah presensi
      const mappedLogged = Array.from(loggedSantriMap.values()).map((l) => {
        const st = (l.status_kehadiran || l.status || "Hadir").toLowerCase();
        let cleanStatus = "Hadir";
        if (st.includes("sakit")) cleanStatus = "Sakit";
        else if (st.includes("izin")) cleanStatus = "Izin";

        return {
          id: l.id || `log-${l.santri_id}`,
          santri_id: l.santri_id,
          nama_santri: l.nama_santri,
          nis: l.nis,
          nama_asrama: l.nama_asrama,
          nama_kamar: l.nama_kamar,
          nama_sesi: l.nama_sesi || l.kegiatan || "Presensi",
          status: cleanStatus,
          jam_absen: l.waktu_scan || l.waktu || "-",
        };
      });

      // Siapkan list santri yang BELUM absen (belum input)
      const mappedBelum = allSantri
        .filter((s) => !loggedSantriMap.has(s.id))
        .map((s) => ({
          id: `belum-${s.id}`,
          santri_id: s.id,
          nama_santri: s.nama_santri,
          nis: s.nis,
          nama_asrama: s.nama_asrama,
          nama_kamar: s.nama_kamar,
          nama_sesi: "Semua Sesi",
          status: "Alfa",
          jam_absen: "Belum Absen",
        }));

      setTodayAbsensiList([...mappedLogged, ...mappedBelum]);
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
      (item.nama_santri || "")
        .toLowerCase()
        .includes(searchModalText.toLowerCase()) ||
      (item.nis || "").toLowerCase().includes(searchModalText.toLowerCase()) ||
      (item.nama_asrama || "")
        .toLowerCase()
        .includes(searchModalText.toLowerCase()) ||
      (item.nama_kamar || "")
        .toLowerCase()
        .includes(searchModalText.toLowerCase());
    const sesMatch =
      selectedKegiatan === "Semua" ||
      (item.nama_sesi || "").toLowerCase() === selectedKegiatan.toLowerCase();
    return stMatch && qMatch && sesMatch;
  });

  const modalHadirCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "hadir",
  ).length;
  const modalSakitCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "sakit",
  ).length;
  const modalIzinCount = todayAbsensiList.filter(
    (x) => (x.status || "").toLowerCase() === "izin",
  ).length;
  const modalAlfaCount = todayAbsensiList.filter(
    (x) =>
      (x.status || "").toLowerCase() === "alfa" ||
      (x.status || "").toLowerCase() === "belum",
  ).length;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#eaeff5",
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
          {/* Brand Application: NWFMobile (Logo hilang, teks disatukan) */}
          <div
            onClick={handleOpenAccountInfo}
            style={{
              display: "flex",
              flexDirection: "column",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: "1.55rem",
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
                  fontSize: "1.18rem",
                  fontStyle: "italic",
                  letterSpacing: "-0.2px",
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
              Ponpes Nurul Wafa
            </span>
          </div>

          {/* Header Action: Single Logout Button */}
          <button
            onClick={async () => {
              const ok = await showConfirm(
                "Konfirmasi Keluar",
                "Apakah Anda yakin ingin keluar dari NWF Mobile?",
                "Ya, Keluar",
                "Batal"
              );
              if (ok && onLogout) onLogout();
            }}
            style={{
              background: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.15s ease",
            }}
            title="Keluar / Logout"
          >
            <LogOut size={18} />
          </button>
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

          {/* Right 42%: Info Stats Pills (Hadir & Belum, Sakit & Izin) */}
          <div
            style={{
              flex: "1 1 42%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "6px",
            }}
          >
            {/* Pill 1: Hadir & Belum */}
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
                  Hadir & Belum
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "3px",
                }}
              >
                <span style={{ color: "#15803d" }}>{rekapAbsensi.hadir}</span>
                <span style={{ fontSize: "0.62rem", color: "#64748b" }}>/</span>
                <span style={{ color: "#b91c1c" }}>{rekapAbsensi.alfa}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b" }}>
                  Santri
                </span>
              </div>
            </div>

            {/* Pill 2: Sakit & Izin */}
            <div
              onClick={() => handleOpenStatusModal("Izin")}
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "12px",
                padding: "6px 8px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <AlertTriangle size={11} color="#d97706" />
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: "#92400e",
                  }}
                >
                  Sakit & Izin
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  marginTop: "2px",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "3px",
                }}
              >
                <span style={{ color: "#dc2626" }}>{rekapAbsensi.sakit}</span>
                <span style={{ fontSize: "0.62rem", color: "#64748b" }}>/</span>
                <span style={{ color: "#d97706" }}>{rekapAbsensi.izin}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b" }}>
                  Santri
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION: MENU (ALL 9 MENU ITEMS UNIFIED - KLASIK, MODERN & ELEGAN)
      ========================================================================= */}
      <div style={{ padding: "14px 14px 4px" }}>
        <div
          style={{
            fontSize: "0.85rem",
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
              height: "15px",
              background: "#0d766e",
              borderRadius: "4px",
            }}
          />
          Menu
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "14px 6px",
            justifyItems: "center",
          }}
        >
          {/* 1. Santri */}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Users size={27} strokeWidth={2.2} color="#059669" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Santri
            </span>
          </div>

          {/* 2. Kelas */}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <GraduationCap size={27} strokeWidth={2.2} color="#0284c7" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Kelas
            </span>
          </div>

          {/* 3. Asrama */}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Building size={27} strokeWidth={2.2} color="#7c3aed" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Asrama
            </span>
          </div>

          {/* 4. Kegiatan */}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Calendar size={27} strokeWidth={2.2} color="#d97706" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Kegiatan
            </span>
          </div>

          {/* 5. Perizinan */}
          <div
            onClick={() => onChangeTab("perizinan")}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Clock size={27} strokeWidth={2.2} color="#4f46e5" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Perizinan
            </span>
          </div>

          {/* 6. Teguran */}
          <div
            onClick={() => onChangeTab("tata-tertib")}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <ShieldAlert size={27} strokeWidth={2.2} color="#e11d48" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Teguran
            </span>
          </div>

          {/* 7. Absensi */}
          <div
            onClick={() => onChangeTab("presensi")}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Fingerprint size={27} strokeWidth={2.2} color="#0d9488" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Absensi
            </span>
          </div>

          {/* 8. Perkembangan */}
          <div
            onClick={() => onChangeTab("pengembangan")}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <Award size={27} strokeWidth={2.2} color="#0891b2" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              Perkembangan
            </span>
          </div>

          {/* 9. Praktek */}
          <div
            onClick={() => onChangeTab("praktek-ibadah")}
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
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow:
                  "0 8px 20px -3px rgba(15, 23, 42, 0.08), 0 3px 6px -1px rgba(0, 0, 0, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              <BookOpen size={27} strokeWidth={2.2} color="#ea580c" />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#334155",
                textAlign: "center",
                lineHeight: 1.2,
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
      <div style={{ padding: "8px 12px 20px" }}>
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
              Sesi presensi shalat ditutup tepat waktu. Santri yang belum hadir
              otomatis masuk daftar Belum Absen.
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
              Perizinan santri wajib melalui persetujuan wali asrama dan
              tercatat dalam sistem perizinan.
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DETAIL PRESENSI SANTRI HARI INI (FULL SCREEN)
      ========================================================================= */}
      {isDetailModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#f8fafc",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Full Screen Top App Bar */}
          <div
            style={{
              background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
              color: "#ffffff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.16)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
                title="Kembali"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.2px",
                  }}
                >
                  Santri {selectedStatusTab === "Alfa" ? "Belum Absen" : selectedStatusTab}
                </h3>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#a7f3d0",
                    marginTop: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={12} color="#a7f3d0" />
                  <span>{currentDateStr || "Hari ini"}</span>
                  <span>•</span>
                  <span style={{ fontWeight: 700, color: "#ffffff" }}>
                    {filteredModalList.length} Santri
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDetailModalOpen(false)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255, 255, 255, 0.16)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status Pills Selector inside modal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              padding: "10px 14px",
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              flexShrink: 0,
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
                          NIS: {item.nis || "-"} •{" "}
                          {item.nama_asrama || "Asrama"} /{" "}
                          {item.nama_kamar || "-"}
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
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
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
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#bae6fd",
                      fontWeight: 700,
                    }}
                  >
                    Pondok Pesantren
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900 }}>
                    Nurul Wafa
                  </div>
                </div>
                <span style={{ fontSize: "1.4rem" }}>✱</span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
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
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#bae6fd",
                      marginTop: "2px",
                    }}
                  >
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
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
