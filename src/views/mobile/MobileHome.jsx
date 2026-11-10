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
  Heart,
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

  // Kategori Tab Rekap Absensi Beranda & Modal: 'berjamaah' | 'kegiatan'
  const [activeKategoriRekap, setActiveKategoriRekap] = useState("berjamaah");

  // Modal State untuk Detail Absensi Hari Ini
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailCardOpen, setIsDetailCardOpen] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState("Hadir"); // 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [selectedKegiatan, setSelectedKegiatan] = useState("Semua"); // 'Semua' | nama_sesi
  const [sesiList, setSesiList] = useState([]);
  const [materiList, setMateriList] = useState([]);
  const [rawTodayLogs, setRawTodayLogs] = useState([]);
  const [rawActiveIzin, setRawActiveIzin] = useState([]);
  const [santriMasterList, setSantriMasterList] = useState([]);
  const [latestFeed, setLatestFeed] = useState([]);
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

  const cleanName = (name) => {
    if (!name) return "";
    let c = String(name).trim();
    if (c.includes("(Wali ")) {
      const m = c.match(/\(Wali\s+([^)]+)\)/i);
      if (m && m[1]) return m[1].trim();
    }
    if (c.toLowerCase().startsWith("wali santri "))
      return c.substring(12).trim();
    if (c.toLowerCase().startsWith("wali ")) return c.substring(5).trim();
    if (c.toLowerCase().startsWith("orang tua santri"))
      return c
        .replace(/^orang tua santri/i, "")
        .replace(/^[^\w]+/, "")
        .trim();
    return c;
  };

  const rawName = cleanName(
    sessionData.nama_santri ||
      sessionData.nama ||
      sessionData.username ||
      "Admin",
  );
  const displayName = rawName.includes(" ") ? rawName : rawName;

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

  // Lazy Load State
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailLoaded, setIsDetailLoaded] = useState(false);

  // Load Ringan Khusus Beranda (Hanya Ambil Rekap Ringkas & Feed Kegiatan, TANPA tarik santri/perizinan massal)
  const loadData = async () => {
    try {
      const [resStats, resFeed] = await Promise.allSettled([
        axios.get("/api/dashboard/stats"),
        axios.get("/api/informasi-kegiatan/feed?limit=6"),
      ]);

      if (resFeed.status === "fulfilled" && resFeed.value.data?.success) {
        setLatestFeed(resFeed.value.data.data?.feed || []);
      }

      if (resStats.status === "fulfilled" && resStats.value.data?.success) {
        const d = resStats.value.data.data || {};
        const s = d.stats || {};
        const totalSantri = s.total_santri || 0;
        setStats((prev) => ({
          ...prev,
          total_santri: totalSantri,
          total_halaqah: s.total_halaqah || 0,
          total_izin_aktif: s.total_izin_aktif || 0,
        }));

        if (d.rekap_absensi) {
          const hadir = d.rekap_absensi.hadir || 0;
          const sakit = d.rekap_absensi.sakit || 0;
          const izin = d.rekap_absensi.izin || 0;
          const belum = totalSantri > 0 ? Math.max(0, totalSantri - (hadir + sakit + izin)) : (d.rekap_absensi.alfa || 0);

          setRekapAbsensi({
            hadir,
            sakit,
            izin,
            alfa: belum,
            total: totalSantri,
          });
        }
      }
    } catch (err) {
      console.warn("Notice loading mobile home lightweight data:", err.message);
    }
  };

  // Lazy Load Data Detail (Hanya dipanggil saat user membuka modal rincian santri / absensi)
  const loadDetailData = async () => {
    if (isDetailLoaded || loadingDetail) return;
    setLoadingDetail(true);
    try {
      const [resSantri, resAbsensi, resIzin, resSesi, resMateri] =
        await Promise.allSettled([
          axios.get("/api/santri?all=true&compact=true&without_photo=true"),
          axios.get("/api/absensi/fingerprint"),
          axios.get("/api/perizinan"),
          axios.get("/api/absensi/sesi"),
          axios.get("/api/materi-hafalan"),
        ]);

      let allSantri = [];
      if (resSantri.status === "fulfilled" && resSantri.value.data?.success) {
        allSantri =
          resSantri.value.data.data?.data || resSantri.value.data.data || [];
        setSantriMasterList(allSantri);
      }

      if (resSesi.status === "fulfilled" && resSesi.value.data?.success) {
        setSesiList(
          resSesi.value.data.data?.data || resSesi.value.data.data || [],
        );
      }

      if (resMateri.status === "fulfilled" && resMateri.value.data?.success) {
        setMateriList(
          resMateri.value.data.data?.data || resMateri.value.data.data || [],
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
      setRawTodayLogs(todayLogs);

      // Sinkronkan perizinan aktif (keluar pondok)
      if (resIzin.status === "fulfilled" && resIzin.value.data?.success) {
        const izinArr =
          resIzin.value.data.data?.data || resIzin.value.data.data || [];
        const activeIzin = izinArr.filter((i) => {
          const st = String(i.status || "").toLowerCase();
          if (
            st.includes("tolak") ||
            st.includes("batal") ||
            st.includes("kembali")
          ) {
            return false;
          }
          return (
            st.includes("aktif") || st.includes("luar") || st.includes("setuju")
          );
        });

        setRawActiveIzin(activeIzin);
      }

      setIsDetailLoaded(true);
    } catch (err) {
      console.warn("Notice loading detail data:", err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper cek apakah log termasuk Berjamaah (Shalat) vs Kegiatan (Mengaji)
  const isLogBerjamaah = (log) => {
    const k = String(
      log?.nama_sesi || log?.kegiatan || log?.nama_kegiatan || "",
    ).toLowerCase();
    const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/.test(k);
    const tipe = String(log?.tipe_presensi || "").toLowerCase();
    return tipe === "berjamaah" || isShalat;
  };

  // Daftar opsi sesi sesuai tab kategori aktif ('berjamaah' vs 'kegiatan')
  const availableSesiOptions = React.useMemo(() => {
    const isShalatWord = (str) =>
      /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(String(str || ""));
    const list = [];
    const seen = new Set();

    if (activeKategoriRekap === "berjamaah") {
      (sesiList || []).forEach((s) => {
        if (isShalatWord(s.nama_sesi) || isShalatWord(s.kategori)) {
          const nm = (s.nama_sesi || "").trim();
          if (nm && !seen.has(nm.toLowerCase())) {
            seen.add(nm.toLowerCase());
            list.push(nm);
          }
        }
      });
    } else {
      (materiList || []).forEach((m) => {
        if (!isShalatWord(m.nama_materi) && !isShalatWord(m.kategori)) {
          const nm = (m.nama_materi || "").trim();
          if (nm && !seen.has(nm.toLowerCase())) {
            seen.add(nm.toLowerCase());
            list.push(nm);
          }
        }
      });
      (sesiList || []).forEach((s) => {
        if (!isShalatWord(s.nama_sesi) && !isShalatWord(s.kategori)) {
          const nm = (s.nama_sesi || "").trim();
          if (nm && !seen.has(nm.toLowerCase())) {
            seen.add(nm.toLowerCase());
            list.push(nm);
          }
        }
      });
    }
    return list;
  }, [activeKategoriRekap, sesiList, materiList]);

  // Perhitungan dinamis Rekap & Daftar Santri sesuai Tab Kategori ('berjamaah' vs 'kegiatan') & Sesi
  const { computedRekap, todayAbsensiList } = React.useMemo(() => {
    // 1. Filter log sesuai kategori aktif (Berjamaah vs Kegiatan) & sesi (jika dipilih)
    const categoryLogs = rawTodayLogs.filter((l) => {
      const matchKat =
        activeKategoriRekap === "berjamaah"
          ? isLogBerjamaah(l)
          : !isLogBerjamaah(l);
      if (!matchKat) return false;
      if (selectedKegiatan !== "Semua") {
        const sName = String(
          l.nama_sesi || l.kegiatan || l.nama_kegiatan || "",
        ).toLowerCase();
        if (sName !== selectedKegiatan.toLowerCase()) return false;
      }
      return true;
    });

    const loggedSantriMap = new Map();
    categoryLogs.forEach((l) => {
      const sid = l.santri_id || l.id;
      if (sid && !loggedSantriMap.has(String(sid))) {
        loggedSantriMap.set(String(sid), l);
      }
    });

    // 2. Sinkronkan santri yang sedang izin aktif (otomatis Sakit / Izin)
    rawActiveIzin.forEach((iz) => {
      const sid = iz.santri_id;
      if (sid && !loggedSantriMap.has(String(sid))) {
        const isSakit =
          String(iz.jenis_izin || "")
            .toLowerCase()
            .includes("sakit") ||
          String(iz.jenis_izin || "")
            .toLowerCase()
            .includes("berobat") ||
          String(iz.keperluan || "")
            .toLowerCase()
            .includes("sakit");
        const stIzin = isSakit ? "Sakit" : "Izin";
        loggedSantriMap.set(String(sid), {
          id: `izin-${iz.id}`,
          santri_id: sid,
          nama_santri: iz.nama_santri,
          nis: iz.nis,
          status: stIzin,
          status_kehadiran: stIzin,
          nama_sesi: iz.jenis_izin || "Izin Pulang",
          waktu_scan: iz.tgl_keluar_rencana
            ? String(iz.tgl_keluar_rencana).slice(11, 16)
            : "-",
        });
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

    const totalSantriCount = stats.total_santri || santriMasterList.length;
    const sudahInputCount = hadir + sakit + izin;
    const belumAbsen =
      totalSantriCount > 0
        ? Math.max(0, totalSantriCount - sudahInputCount)
        : 0;

    const mappedLogged = Array.from(loggedSantriMap.values()).map((l) => {
      const st = (l.status_kehadiran || l.status || "Hadir").toLowerCase();
      let cleanStatus = "Hadir";
      if (st.includes("sakit")) cleanStatus = "Sakit";
      else if (st.includes("izin")) cleanStatus = "Izin";

      const masterSantri = santriMasterList.find(
        (s) => String(s.id) === String(l.santri_id),
      );

      return {
        id: l.id || `log-${l.santri_id}`,
        santri_id: l.santri_id,
        nama_santri: l.nama_santri || masterSantri?.nama_santri,
        nis: l.nisn || l.nis || masterSantri?.nisn || masterSantri?.nis,
        nama_kelas:
          masterSantri?.nama_kelas || masterSantri?.tingkat_diniyah || "",
        nama_asrama: l.nama_asrama || masterSantri?.nama_asrama,
        nama_kamar: l.nama_kamar || masterSantri?.nama_kamar,
        nama_sesi: l.nama_sesi || l.kegiatan || "Presensi",
        status: cleanStatus,
        jam_absen: l.waktu_scan || l.waktu || "-",
      };
    });

    const mappedBelum = santriMasterList
      .filter((s) => !loggedSantriMap.has(String(s.id)))
      .map((s) => ({
        id: `belum-${s.id}`,
        santri_id: s.id,
        nama_santri: s.nama_santri,
        nis: s.nisn || s.nis,
        nama_kelas: s.nama_kelas || s.tingkat_diniyah || "",
        nama_asrama: s.nama_asrama,
        nama_kamar: s.nama_kamar,
        nama_sesi: "Semua Sesi",
        status: "Alfa",
        jam_absen: "Belum Absen",
      }));

    return {
      computedRekap: {
        hadir,
        sakit,
        izin,
        alfa: belumAbsen,
        total: totalSantriCount,
      },
      todayAbsensiList: [...mappedLogged, ...mappedBelum],
    };
  }, [
    rawTodayLogs,
    rawActiveIzin,
    santriMasterList,
    stats.total_santri,
    activeKategoriRekap,
    selectedKegiatan,
  ]);

  useEffect(() => {
    if (isDetailLoaded) {
      setRekapAbsensi(computedRekap);
    }
  }, [computedRekap, isDetailLoaded]);

  const handleOpenStatusModal = (statusKey) => {
    setSelectedStatusTab(statusKey);
    setIsDetailModalOpen(true);
    if (!isDetailLoaded) {
      loadDetailData();
    }
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
          {/* Brand Application: NWF Mobile dengan Emblem Logo Elegan (tidak mepet) */}
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
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "3px" }}
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
                  lineHeight: 1,
                }}
              >
                Pondok Pesantren Nurul Wafa
              </span>
            </div>
          </div>

          {/* Header Action: Single Logout Button */}
          <button
            onClick={async () => {
              const ok = await showConfirm(
                "Konfirmasi Keluar",
                "Apakah Anda yakin ingin keluar dari NWF Mobile?",
                "Ya, Keluar",
                "Batal",
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
          CARD 1: FLOATING WHITE CARD (TAB BERJAMAAH & KEGIATAN + PRESENSI & KONDISI)
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
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Segmented Tab: Berjamaah vs Kegiatan */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "13px",
              border: "1px solid #e2e8f0",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveKategoriRekap("berjamaah");
                setSelectedKegiatan("Semua");
              }}
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "7px 8px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                background:
                  activeKategoriRekap === "berjamaah"
                    ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                    : "transparent",
                color:
                  activeKategoriRekap === "berjamaah" ? "#ffffff" : "#64748b",
                boxShadow:
                  activeKategoriRekap === "berjamaah"
                    ? "0 3px 8px rgba(2, 132, 199, 0.28)"
                    : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <span>🕌</span>
              <span>Berjamaah</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveKategoriRekap("kegiatan");
                setSelectedKegiatan("Semua");
                if (!isDetailLoaded) {
                  loadDetailData();
                }
              }}
              style={{
                border: "none",
                borderRadius: "9px",
                padding: "7px 8px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                background:
                  activeKategoriRekap === "kegiatan"
                    ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                    : "transparent",
                color:
                  activeKategoriRekap === "kegiatan" ? "#ffffff" : "#64748b",
                boxShadow:
                  activeKategoriRekap === "kegiatan"
                    ? "0 3px 8px rgba(5, 150, 105, 0.28)"
                    : "none",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <span>📖</span>
              <span>Kegiatan</span>
            </button>
          </div>

          {/* 2-Column Grid: Presensi (Hadir & Belum) | Kondisi (Sakit & Izin) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            {/* Card 1: Hadir & Belum */}
            <div
              onClick={() => handleOpenStatusModal("Hadir")}
              style={{
                background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "14px",
                padding: "10px 12px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#16a34a",
                    boxShadow: "0 0 5px #16a34a",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: 800,
                    color: "#166534",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  Presensi
                </span>
              </div>

              {/* 2 Distinct Metric Columns */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1px 1fr",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "2px",
                }}
              >
                {/* Left: Hadir */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStatusModal("Hadir");
                  }}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      color: "#15803d",
                      lineHeight: 1,
                    }}
                  >
                    HADIR
                  </span>
                  <span
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 900,
                      color: "#14532d",
                      lineHeight: 1.2,
                    }}
                  >
                    {rekapAbsensi.hadir}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    background: "rgba(16, 185, 129, 0.3)",
                  }}
                />

                {/* Right: Belum */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStatusModal("Alfa");
                  }}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      color: "#dc2626",
                      lineHeight: 1,
                    }}
                  >
                    BELUM
                  </span>
                  <span
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 900,
                      color: "#991b1b",
                      lineHeight: 1.2,
                    }}
                  >
                    {rekapAbsensi.alfa}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Sakit & Izin */}
            <div
              onClick={() => handleOpenStatusModal("Izin")}
              style={{
                background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "14px",
                padding: "10px 12px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(245, 158, 11, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#d97706",
                    boxShadow: "0 0 5px #d97706",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.64rem",
                    fontWeight: 800,
                    color: "#92400e",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  Kondisi
                </span>
              </div>

              {/* 2 Distinct Metric Columns */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1px 1fr",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "2px",
                }}
              >
                {/* Left: Sakit */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStatusModal("Sakit");
                  }}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      color: "#d97706",
                      lineHeight: 1,
                    }}
                  >
                    SAKIT
                  </span>
                  <span
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 900,
                      color: "#78350f",
                      lineHeight: 1.2,
                    }}
                  >
                    {rekapAbsensi.sakit}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div
                  style={{
                    width: "1px",
                    height: "24px",
                    background: "rgba(245, 158, 11, 0.3)",
                  }}
                />

                {/* Right: Izin */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStatusModal("Izin");
                  }}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <span
                    style={{
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      color: "#6366f1",
                      lineHeight: 1,
                    }}
                  >
                    IZIN
                  </span>
                  <span
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 900,
                      color: "#3730a3",
                      lineHeight: 1.2,
                    }}
                  >
                    {rekapAbsensi.izin}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION: MENU (DIBUNGKUS CARD PUTIH & IKON SQUIRCLE BERWARNA SEPERTI PORTAL ORTU)
      ========================================================================= */}
      <div style={{ padding: "0 14px", marginTop: "12px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            padding: "12px 12px 14px",
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
            Menu Layanan Pesantren
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px 4px",
              justifyItems: "center",
            }}
          >
            {[
              {
                label: "Santri",
                tab: "master-santri",
                icon: Users,
                bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                shadow: "0 6px 16px -2px rgba(16, 185, 129, 0.38)",
              },
              {
                label: "Kelas",
                tab: "master-kelas",
                icon: GraduationCap,
                bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                shadow: "0 6px 16px -2px rgba(59, 130, 246, 0.38)",
              },
              {
                label: "Asrama",
                tab: "master-asrama",
                icon: Building,
                bg: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                shadow: "0 6px 16px -2px rgba(168, 85, 247, 0.38)",
              },
              {
                label: "Kegiatan",
                tab: "setting-shalat",
                icon: Calendar,
                bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                shadow: "0 6px 16px -2px rgba(245, 158, 11, 0.38)",
              },
              {
                label: "Perizinan",
                tab: "perizinan",
                icon: Clock,
                bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                shadow: "0 6px 16px -2px rgba(99, 102, 241, 0.38)",
              },
              {
                label: "Teguran",
                tab: "tata-tertib",
                icon: ShieldAlert,
                bg: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                shadow: "0 6px 16px -2px rgba(244, 63, 94, 0.38)",
              },
              {
                label: "Berjamaah",
                tab: "berjamaah",
                icon: Fingerprint,
                bg: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                shadow: "0 6px 16px -2px rgba(6, 182, 212, 0.38)",
              },
              {
                label: "Mengaji",
                tab: "mengaji",
                icon: BookOpen,
                bg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                shadow: "0 6px 16px -2px rgba(5, 150, 105, 0.38)",
              },
              {
                label: "Lap. Berjamaah",
                tab: "laporan-berjamaah",
                icon: Fingerprint,
                bg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                shadow: "0 6px 16px -2px rgba(2, 132, 199, 0.38)",
              },
              {
                label: "Lap. Mengaji",
                tab: "laporan-mengaji",
                icon: FileText,
                bg: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                shadow: "0 6px 16px -2px rgba(13, 148, 136, 0.38)",
              },
              {
                label: "Perkembangan",
                tab: "pengembangan",
                icon: Award,
                bg: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
                shadow: "0 6px 16px -2px rgba(2, 132, 199, 0.38)",
              },
              {
                label: "Praktek",
                tab: "praktek-ibadah",
                icon: BookOpen,
                bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                shadow: "0 6px 16px -2px rgba(249, 115, 22, 0.38)",
              },
              {
                label: "Daftar Wajah",
                tab: "daftar-wajah",
                icon: Smile,
                bg: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                shadow: "0 6px 16px -2px rgba(236, 72, 153, 0.38)",
              },
              {
                label: "Haid Santri",
                tab: "haid",
                icon: Heart,
                bg: "linear-gradient(135deg, #be185d 0%, #db2777 100%)",
                shadow: "0 6px 16px -2px rgba(219, 39, 119, 0.38)",
              },
              {
                label: "Tabungan",
                tab: "tabungan",
                icon: Wallet,
                bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                shadow: "0 6px 16px -2px rgba(20, 184, 166, 0.38)",
              },
              {
                label: "Mesin FP",
                tab: "master-device",
                icon: HardDrive,
                bg: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
                shadow: "0 6px 16px -2px rgba(71, 85, 105, 0.38)",
              },
            ].filter((item) => {
              const isAdmin = String(sessionData?.role || '').toLowerCase().includes('admin');
              if (isAdmin && item.tab === 'tabungan') return false;
              return true;
            }).map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.tab}
                  onClick={() => onChangeTab(item.tab)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    textAlign: "center",
                    width: "100%",
                    userSelect: "none",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "16px",
                      background: item.bg,
                      boxShadow: item.shadow,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "6px",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <IconComp size={23} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span
                    style={{
                      fontSize: "0.67rem",
                      fontWeight: 700,
                      color: "#334155",
                      lineHeight: 1.2,
                      maxWidth: "68px",
                      display: "block",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: SLIDER KEGIATAN & AGENDA PESANTREN (SAMA SEPERTI PORTAL ORTU)
      ========================================================================= */}
      <div style={{ padding: "12px 14px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
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
              letterSpacing: "-0.2px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "15px",
                background: "#059669",
                borderRadius: "4px",
              }}
            />
            Kegiatan Pesantren
          </div>
          <button
            type="button"
            onClick={() => onChangeTab("informasi")}
            style={{
              background: "transparent",
              border: "none",
              color: "#059669",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: 0,
            }}
          >
            Lihat Semua <ChevronRight size={13} />
          </button>
        </div>

        {/* Horizontal Scroll Carousel */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {(latestFeed && latestFeed.length > 0
            ? latestFeed
            : [
                {
                  id: "fb-1",
                  judul: "Kajian Kitab Kuning & Sorogan Santri",
                  kategori: "Pengajian",
                  konten:
                    "Kajian fiqih ibadah & nahwu ba'da Subuh dan Maghrib bersama dewan asatidz.",
                  tanggal_publikasi: "Harian",
                },
                {
                  id: "fb-2",
                  judul: "Setoran Tahfidz & Tasmi' Al-Qur'an",
                  kategori: "Tahfidz",
                  konten:
                    "Muroja'ah rutin santri dan evaluasi mutqin hafalan bersama musyrif asrama.",
                  tanggal_publikasi: "Mingguan",
                },
                {
                  id: "fb-3",
                  judul: "Muhadhoroh & Latihan Khitobah 3 Bahasa",
                  kategori: "Ekstrakurikuler",
                  konten:
                    "Pembinaan public speaking santri dalam Bahasa Arab, Inggris, dan Indonesia.",
                  tanggal_publikasi: "Kamis Malam",
                },
                {
                  id: "fb-4",
                  judul: "Disiplin Presensi Sholat Berjamaah",
                  kategori: "Ibadah",
                  konten:
                    "Pemantauan kehadiran sholat fardhu & tahajud di Masjid Jami' Pesantren.",
                  tanggal_publikasi: "Wajib",
                },
              ]
          ).map((item, idx) => {
            const kat = String(item.kategori || "").toLowerCase();
            let theme = {
              emoji: "✨",
              grad: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
            };
            if (
              kat.includes("ngaji") ||
              kat.includes("kitab") ||
              kat.includes("kajian")
            )
              theme = {
                emoji: "📖",
                grad: "linear-gradient(135deg, #059669 0%, #064e3b 100%)",
              };
            else if (kat.includes("tahfidz") || kat.includes("qur"))
              theme = {
                emoji: "🕌",
                grad: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
              };
            else if (kat.includes("ibadah") || kat.includes("sholat"))
              theme = {
                emoji: "🤲",
                grad: "linear-gradient(135deg, #0d9488 0%, #134e4a 100%)",
              };
            else if (kat.includes("ekstra") || kat.includes("lomba"))
              theme = {
                emoji: "🏆",
                grad: "linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)",
              };
            else if (kat.includes("umum") || kat.includes("info"))
              theme = {
                emoji: "📢",
                grad: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)",
              };
            else if (kat.includes("libur") || kat.includes("pulang"))
              theme = {
                emoji: "🏖️",
                grad: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
              };

            const foto = item.foto_url || item.lampiran_url || "";
            const tglLabel = item.tanggal_publikasi
              ? typeof item.tanggal_publikasi === "string" &&
                item.tanggal_publikasi.includes("-")
                ? new Date(item.tanggal_publikasi).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })
                : item.tanggal_publikasi
              : "Pesantren";

            return (
              <div
                key={item.id || idx}
                onClick={() => onChangeTab("informasi")}
                style={{
                  flex: "0 0 230px",
                  height: "158px",
                  scrollSnapAlign: "start",
                  position: "relative",
                  borderRadius: "18px",
                  overflow: "hidden",
                  cursor: "pointer",
                  background: foto
                    ? `url(${foto}) center/cover no-repeat`
                    : theme.grad,
                  boxShadow: "0 8px 20px -6px rgba(15, 23, 42, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: "#ffffff",
                }}
              >
                {/* Watermark emoji (tanpa foto) */}
                {!foto && (
                  <div
                    style={{
                      position: "absolute",
                      right: "-6px",
                      top: "-8px",
                      fontSize: "5.2rem",
                      opacity: 0.16,
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    {theme.emoji}
                  </div>
                )}

                {/* Overlay gelap bawah agar teks terbaca */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.78) 100%)",
                  }}
                />

                {/* Top Badges */}
                <div
                  style={{
                    position: "relative",
                    padding: "10px 10px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.22)",
                      backdropFilter: "blur(6px)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#ffffff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {theme.emoji} {item.kategori || "Kegiatan"}
                  </span>
                  {Number(item.is_pinned) === 1 ? (
                    <span
                      style={{
                        background: "#f59e0b",
                        color: "#ffffff",
                        fontSize: "0.56rem",
                        fontWeight: 900,
                        padding: "3px 7px",
                        borderRadius: "999px",
                      }}
                    >
                      📌 PIN
                    </span>
                  ) : (
                    <Sparkles size={14} style={{ opacity: 0.85 }} />
                  )}
                </div>

                {/* Bottom Info */}
                <div style={{ position: "relative", padding: "0 11px 10px" }}>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 900,
                      lineHeight: 1.25,
                      textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.judul}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "rgba(255,255,255,0.85)",
                      marginTop: "6px",
                    }}
                  >
                    <Calendar size={11} />
                    <span>{tglLabel}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        background: "#ffffff",
                        color: "#0f172a",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "0.6rem",
                        fontWeight: 800,
                      }}
                    >
                      Lihat →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
                  Santri{" "}
                  {selectedStatusTab === "Alfa"
                    ? "Belum Absen"
                    : selectedStatusTab}
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

          {/* 2 Tab Kategori di Modal: Berjamaah vs Kegiatan */}
          <div
            style={{
              background: "#ffffff",
              padding: "10px 14px 4px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
                background: "#f1f5f9",
                padding: "4px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveKategoriRekap("berjamaah");
                  setSelectedKegiatan("Semua");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  borderRadius: "9px",
                  border: "none",
                  background:
                    activeKategoriRekap === "berjamaah"
                      ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                      : "transparent",
                  color:
                    activeKategoriRekap === "berjamaah" ? "#ffffff" : "#64748b",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  cursor: "pointer",
                  boxShadow:
                    activeKategoriRekap === "berjamaah"
                      ? "0 3px 8px rgba(2, 132, 199, 0.28)"
                      : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>🕌</span>
                <span>Berjamaah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveKategoriRekap("kegiatan");
                  setSelectedKegiatan("Semua");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 10px",
                  borderRadius: "9px",
                  border: "none",
                  background:
                    activeKategoriRekap === "kegiatan"
                      ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                      : "transparent",
                  color:
                    activeKategoriRekap === "kegiatan" ? "#ffffff" : "#64748b",
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  cursor: "pointer",
                  boxShadow:
                    activeKategoriRekap === "kegiatan"
                      ? "0 3px 8px rgba(5, 150, 105, 0.28)"
                      : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>📖</span>
                <span>Kegiatan</span>
              </button>
            </div>
          </div>

          {/* Status Pills Selector inside modal */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              padding: "8px 14px 10px",
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
                    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
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
                placeholder="Cari nama santri, NISN, atau kelas..."
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

            {availableSesiOptions.length > 0 && (
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
                  maxWidth: "145px",
                }}
              >
                <option value="Semua">Semua Sesi</option>
                {availableSesiOptions.map((namaSesi) => (
                  <option key={namaSesi} value={namaSesi}>
                    {namaSesi}
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
            {loadingDetail ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "#64748b" }}>
                <RefreshCw size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#059669" }} />
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155" }}>
                  Memuat rincian data santri...
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "4px" }}>
                  Mengambil data absensi &amp; status santri
                </div>
              </div>
            ) : filteredModalList.length > 0 ? (
              filteredModalList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#ffffff",
                    borderRadius: "13px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 5px rgba(15, 23, 42, 0.03)",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.nama_santri || "Santri"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "1.5px 6px",
                          borderRadius: "5px",
                        }}
                      >
                        NISN: {item.nis || "-"}
                      </span>
                      {item.nama_kelas && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            color: "#1d4ed8",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            padding: "1.5px 7px",
                            borderRadius: "999px",
                          }}
                        >
                          {item.nama_kelas}
                        </span>
                      )}
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
                    {sessionData.nisn || sessionData.nis
                      ? `NISN: ${sessionData.nisn || sessionData.nis}`
                      : "ID: NWF-2026-ADM"}
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
