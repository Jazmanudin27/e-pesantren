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
  Plus,
  MapPin,
  LayoutGrid,
  ArrowLeft,
  Copy,
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
  const [selectedStatusTab, setSelectedStatusTab] = useState("Hadir"); // 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [selectedKegiatan, setSelectedKegiatan] = useState("Semua"); // 'Semua' | nama_sesi
  const [sesiList, setSesiList] = useState([]);
  const [todayAbsensiList, setTodayAbsensiList] = useState([]);
  const [searchModalText, setSearchModalText] = useState("");
  const [menuCardTab, setMenuCardTab] = useState("master"); // 'master' | 'transaksi'
  const touchStartX = useRef(null);

  // Modal State untuk Desain Baru (Kesiswaan Bottom Sheet & Detail Kartu Slideover)
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("Kesiswaan");
  const [sheetCategory, setSheetCategory] = useState("kesiswaan"); // 'kesiswaan' | 'akademik' | 'master' | 'semua'
  const [isDetailCardOpen, setIsDetailCardOpen] = useState(false);
  const [selectedDetailMonth, setSelectedDetailMonth] = useState("Mei");

  // Khusus Akun Bendahara / Admin Keuangan
  const [keuanganData, setKeuanganData] = useState({
    summary: {
      total_nominal_tagihan: 0,
      total_terbayar: 0,
      total_tunggakan: 0,
      jumlah_tagihan_tertunggak: 0,
      jumlah_tagihan_lunas: 0,
    },
    transaksiTerakhir: [],
    tunggakanSantri: [],
  });
  const [loadingKeuangan, setLoadingKeuangan] = useState(false);

  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [greeting, setGreeting] = useState("Selamat Pagi,");

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem("mobile_session") || "{}");
    } catch (e) {
      return {};
    }
  })();

  const isBendahara = (() => {
    const role = String(sessionData?.role || "").toLowerCase();
    const uName = String(sessionData?.username || "").toLowerCase();
    return (
      role.includes("keuangan") ||
      role.includes("bendahara") ||
      uName === "bendahara" ||
      uName === "keuangan"
    );
  })();

  const rawName =
    sessionData.nama ||
    sessionData.username ||
    (isBendahara ? "Hj. Siti Fatimah (Bendahara)" : "Dina Saparinda, S.Kom");
  const displayName = rawName.includes("_")
    ? rawName.replace("_", " ")
    : rawName;
  const initial =
    displayName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() || (isBendahara ? "HJ" : "DS");

  // Live Clock & Greeting
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();

      let greet = "Selamat Malam,";
      if (hours >= 4 && hours < 11) greet = "Selamat Pagi,";
      else if (hours >= 11 && hours < 15) greet = "Selamat Siang,";
      else if (hours >= 15 && hours < 18) greet = "Selamat Sore,";
      setGreeting(greet);

      const dStr = new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now);
      setCurrentDateStr(dStr);

      const timeFormatted = now.toTimeString().split(" ")[0] + " WIB";
      setCurrentTimeStr(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const normalizeDateStr = (raw) => {
    if (!raw) return "";
    if (typeof raw === "string") {
      const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
    return "";
  };

  const simplifyStatus = (st) => {
    if (!st) return "Hadir";
    const s = String(st).toLowerCase();
    if (s.includes("hadir") || s.includes("tepat") || s.includes("terlambat"))
      return "Hadir";
    if (s.includes("sakit")) return "Sakit";
    if (s.includes("izin")) return "Izin";
    if (
      s.includes("alpa") ||
      s.includes("alfa") ||
      s.includes("tanpa") ||
      s.includes("teledor")
    )
      return "Alfa";
    return "Hadir";
  };

  // Fetch real data (Dashboard Stats & Absensi Hari Ini ATAU Rekap Keuangan untuk Bendahara)
  useEffect(() => {
    const loadData = async () => {
      // 1. Jika Akun Bendahara: Ambil Rekap Keuangan Spesifik
      if (isBendahara) {
        setLoadingKeuangan(true);
        try {
          const res = await axios.get("/api/keuangan/admin/rekap");
          if (res?.data?.success && res.data.data) {
            setKeuanganData({
              summary: res.data.data.summary || {},
              transaksiTerakhir: res.data.data.transaksiTerakhir || [],
              tunggakanSantri: res.data.data.tunggakanSantri || [],
            });
          }
        } catch (err) {
          console.warn("Gagal memuat rekap keuangan:", err);
        } finally {
          setLoadingKeuangan(false);
        }
        return;
      }

      // 2. Jika Akun Asatidz / Operator Umum: Ambil Absensi & Kegiatan Santri
      try {
        const [resStats, resAbs, resSesi, resIzin] = await Promise.all([
          axios.get("/api/dashboard/stats").catch(() => null),
          axios.get("/api/absensi/fingerprint").catch(() => null),
          axios.get("/api/absensi/sesi").catch(() => null),
          axios.get("/api/perizinan").catch(() => null),
        ]);

        if (resSesi?.data?.data && Array.isArray(resSesi.data.data)) {
          setSesiList(resSesi.data.data);
        }

        let combinedTodayLogs = [];
        const todayStr = getTodayDateStr();

        // 1. Data dari endpoint dashboard stats
        if (resStats?.data?.success) {
          if (resStats.data.stats) setStats(resStats.data.stats);
          if (Array.isArray(resStats.data.absensi_today_list)) {
            combinedTodayLogs = [...resStats.data.absensi_today_list];
          }
        }

        // 2. Data dari endpoint absensi fingerprint jika ada
        if (resAbs?.data?.data && Array.isArray(resAbs.data.data)) {
          const absToday = resAbs.data.data.filter(
            (l) => normalizeDateStr(l.tanggal) === todayStr,
          );
          absToday.forEach((item) => {
            const exists = combinedTodayLogs.some(
              (ex) =>
                (ex.id && ex.id === item.id) ||
                (ex.santri_id === item.santri_id &&
                  ex.sesi_id === item.sesi_id),
            );
            if (!exists) {
              combinedTodayLogs.push(item);
            }
          });
        }

        // 3. Gabung dengan localStorage jika offline/mock
        try {
          const localLogs = JSON.parse(
            localStorage.getItem("mobile_presensi_logs") || "[]",
          );
          const localToday = localLogs.filter(
            (l) => normalizeDateStr(l.tanggal) === todayStr,
          );
          localToday.forEach((item) => {
            const exists = combinedTodayLogs.some(
              (ex) =>
                (ex.id && ex.id === item.id) ||
                (ex.santri_id === item.santri_id &&
                  ex.sesi_id === item.sesi_id),
            );
            if (!exists) {
              combinedTodayLogs.push(item);
            }
          });
        } catch (e) {}

        // 4. Sinkronkan santri dengan izin aktif/kembali hari ini dari perizinan
        try {
          let izinItems = [];
          if (resIzin?.data?.data && Array.isArray(resIzin.data.data)) {
            izinItems = [...resIzin.data.data];
          }
          const localIzin = JSON.parse(
            localStorage.getItem("mobile_izin_list") || "[]",
          );
          if (Array.isArray(localIzin)) {
            localIzin.forEach((item) => {
              const exists = izinItems.some(
                (ex) =>
                  ex.id === item.id ||
                  (ex.santri_id === item.santri_id &&
                    ex.tgl_keluar_rencana === item.tgl_keluar_rencana),
              );
              if (!exists) izinItems.push(item);
            });
          }

          izinItems.forEach((sp) => {
            const st = String(sp.status || "").toLowerCase();
            if (st.includes("tolak") || st.includes("batal")) return;

            const tglMulai = normalizeDateStr(
              sp.tgl_keluar_aktual || sp.tgl_keluar_rencana,
            );
            const isReturned =
              st.includes("kembali") && !st.includes("terlambat");
            const tglSelesai = normalizeDateStr(
              isReturned && sp.tgl_kembali_aktual
                ? sp.tgl_kembali_aktual
                : sp.tgl_kembali_rencana || sp.tgl_kembali_aktual,
            );

            if (tglMulai && todayStr < tglMulai) return;
            if (
              tglSelesai &&
              todayStr > tglSelesai &&
              !st.includes("terlambat")
            )
              return;

            const isSakit =
              (sp.jenis_izin || "").toLowerCase().includes("sakit") ||
              (sp.jenis_izin || "").toLowerCase().includes("berobat") ||
              (sp.keperluan || "").toLowerCase().includes("sakit");
            const finalStatus = isSakit ? "Sakit" : "Izin";

            const existingIdx = combinedTodayLogs.findIndex(
              (l) =>
                (l.santri_id && l.santri_id === sp.santri_id) ||
                (l.nama_santri &&
                  sp.nama_santri &&
                  l.nama_santri.toLowerCase() === sp.nama_santri.toLowerCase()),
            );

            const izinObj = {
              id: `izin-${sp.id}`,
              santri_id: sp.santri_id,
              nama_santri: sp.nama_santri,
              nis: sp.nis,
              nama_asrama: sp.nama_asrama || "-",
              nama_kamar: sp.nama_kamar || "-",
              tanggal: todayStr,
              waktu_scan: "00:00:00",
              status_kehadiran: finalStatus,
              status: finalStatus,
              metode_scan: "Perizinan",
              metode_presensi: "Perizinan",
              keterangan: `Perizinan ${sp.jenis_izin || "Pulang"} (${sp.keperluan || sp.status || "Disetujui"})`,
              nama_sesi: "Semua Kegiatan (Perizinan Pulang/Sakit)",
              kategori: "Perizinan",
              is_perizinan_auto: true,
            };

            if (existingIdx === -1) {
              combinedTodayLogs.push(izinObj);
            } else {
              const cur = simplifyStatus(
                combinedTodayLogs[existingIdx].status_kehadiran ||
                  combinedTodayLogs[existingIdx].status,
              );
              if (cur !== "Izin" && cur !== "Sakit") {
                combinedTodayLogs[existingIdx] = {
                  ...combinedTodayLogs[existingIdx],
                  ...izinObj,
                };
              }
            }
          });
        } catch (e) {}

        setTodayAbsensiList(combinedTodayLogs);

        // Hitung count hari ini
        const hadirCount = combinedTodayLogs.filter(
          (l) => simplifyStatus(l.status_kehadiran || l.status) === "Hadir",
        ).length;
        const sakitCount = combinedTodayLogs.filter(
          (l) => simplifyStatus(l.status_kehadiran || l.status) === "Sakit",
        ).length;
        const izinCount = combinedTodayLogs.filter(
          (l) => simplifyStatus(l.status_kehadiran || l.status) === "Izin",
        ).length;
        const alfaCount = combinedTodayLogs.filter(
          (l) => simplifyStatus(l.status_kehadiran || l.status) === "Alfa",
        ).length;

        if (combinedTodayLogs.length > 0) {
          setRekapAbsensi({
            hadir: hadirCount,
            sakit: sakitCount,
            izin: izinCount,
            alfa: alfaCount,
            total: hadirCount + sakitCount + izinCount + alfaCount,
          });
        } else if (resStats?.data?.rekap_absensi) {
          setRekapAbsensi(resStats.data.rekap_absensi);
        }
      } catch (e) {
        console.warn("Dashboard loadData fallback:", e);
      }
    };
    loadData();
  }, []);

  const handleOpenStatusModal = (status) => {
    setSelectedStatusTab(status);
    setSelectedKegiatan("Semua");
    setSearchModalText("");
    setIsDetailModalOpen(true);
  };

  const handleOpenNotice = () => {
    showSuccess(
      "Pemberitahuan Pesantren",
      "Seluruh kegiatan santri terpantau realtime. Presensi jamaah Subuh telah ditutup otomatis.",
    );
  };

  const handleOpenAccountInfo = () => {
    showSuccess(
      "Informasi Akun",
      `Login: ${sessionData.username || "admin"} • Peran: ${sessionData.userType || "Ustadz / Guru"}`,
    );
  };

  // Daftar semua nama kegiatan yang tersedia hari ini
  const availableKegiatanList = Array.from(
    new Set([
      ...todayAbsensiList
        .map((item) => item.nama_sesi || item.kegiatan)
        .filter(Boolean),
      ...sesiList.map((s) => s.nama_sesi).filter(Boolean),
    ]),
  );

  // Data terfilter berdasarkan sesi kegiatan yang dipilih di modal
  const logsForSelectedKegiatan =
    selectedKegiatan === "Semua"
      ? todayAbsensiList
      : todayAbsensiList.filter(
          (item) =>
            (item.nama_sesi || item.kegiatan || "").toLowerCase() ===
            selectedKegiatan.toLowerCase(),
        );

  // Count dinamis pada tab status sesuai filter kegiatan
  const modalHadirCount = logsForSelectedKegiatan.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Hadir",
  ).length;
  const modalSakitCount = logsForSelectedKegiatan.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Sakit",
  ).length;
  const modalIzinCount = logsForSelectedKegiatan.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Izin",
  ).length;
  const modalAlfaCount = logsForSelectedKegiatan.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Alfa",
  ).length;

  // Filter daftar santri untuk modal berdasarkan status tab, kegiatan, dan search keyword
  const filteredModalList = logsForSelectedKegiatan.filter((item) => {
    const itemStatus = simplifyStatus(item.status_kehadiran || item.status);
    if (itemStatus.toLowerCase() !== selectedStatusTab.toLowerCase())
      return false;

    if (!searchModalText.trim()) return true;
    const q = searchModalText.toLowerCase();
    const nama = (item.nama_santri || "").toLowerCase();
    const nis = (item.nis || "").toLowerCase();
    const asrama = (item.nama_asrama || "").toLowerCase();
    const kamar = (item.nama_kamar || "").toLowerCase();
    const sesi = (item.nama_sesi || item.kegiatan || "").toLowerCase();
    return (
      nama.includes(q) ||
      nis.includes(q) ||
      asrama.includes(q) ||
      kamar.includes(q) ||
      sesi.includes(q)
    );
  });

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        paddingBottom: "28px",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* =========================================================================
          TOP BANNER HEADER (TEAL FOREST MODERN PESANTREN HEADER)
      ========================================================================= */}
      <div
        style={{
          background:
            "linear-gradient(180deg, #0b6b60 0%, #0d766e 70%, #08524a 100%)",
          padding: "16px 16px 48px",
          color: "#ffffff",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft decorative curved wave */}
        <svg
          style={{
            position: "absolute",
            right: "-20px",
            top: "-15px",
            width: "220px",
            height: "170px",
            opacity: 0.12,
            pointerEvents: "none",
          }}
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M40 80C90 10 160 30 200 10L200 200L0 200C0 140 10 130 40 80Z"
            fill="#ffffff"
          />
        </svg>

        {/* Top App Header: User Avatar & Name on Left, 3 Outline Circle Buttons on Right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* User profile left */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              onClick={() => setIsDetailCardOpen(true)}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                overflow: "hidden",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "1.1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            >
              {displayName ? displayName.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.96rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                {displayName || "Ibnu Arif"}
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#a7f3d0",
                  fontWeight: 600,
                  marginTop: "2px",
                }}
              >
                {sessionData?.role || (isBendahara ? "Bendahara Pesantren" : "Administrator Utama")}
              </div>
            </div>
          </div>

          {/* Top 3 Outline Circle Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setIsDetailCardOpen(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(4px)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Detail Kartu"
            >
              <CreditCard size={18} />
            </button>

            <button
              onClick={handleOpenAccountInfo}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(4px)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Bantuan & Layanan"
            >
              <Headphones size={18} />
            </button>

            <button
              onClick={handleOpenNotice}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                background: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(4px)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
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
          SECTION 3: INFORMASI PESANTREN (REPLACING TOKO ONLINE)
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
          BOTTOM SHEET MODAL (KESISWAAN / LIHAT SEMUA - LEFT PHONE REPLICA)
      ========================================================================= */}
      {isCategorySheetOpen && (
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
          }}
        >
          {/* Backdrop click to close */}
          <div
            onClick={() => setIsCategorySheetOpen(false)}
            style={{ position: "absolute", inset: 0 }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "430px",
              width: "100%",
              background: "#ffffff",
              borderTopLeftRadius: "26px",
              borderTopRightRadius: "26px",
              padding: "16px 18px 30px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
              animation: "slideUp 0.25s ease-out",
            }}
          >
            {/* Top Drag Indicator */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "4px",
                  background: "#cbd5e1",
                  borderRadius: "999px",
                }}
              />
            </div>

            {/* Header: Title & Close Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {sheetTitle}
              </h3>
              <button
                onClick={() => setIsCategorySheetOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid of Soft Lavender Squircles (Exact Left Phone Replica) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "18px 8px",
              }}
            >
              {/* 1. Prestasi */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("pengembangan");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Award size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Prestasi
                </span>
              </div>

              {/* 2. Pelanggaran */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("tata-tertib");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Pelanggaran
                </span>
              </div>

              {/* 3. Progres */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("pengembangan");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Progres
                </span>
              </div>

              {/* 4. Perizinan */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("perizinan");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Perizinan
                </span>
              </div>

              {/* 5. Kesehatan */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("pengembangan");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HeartPulse size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Kesehatan
                </span>
              </div>

              {/* 6. Perundungan */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("tata-tertib");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Perundungan
                </span>
              </div>

              {/* 7. Kunjungan */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("praktek-ibadah");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Kunjungan
                </span>
              </div>

              {/* 8. Santri */}
              <div
                onClick={() => {
                  setIsCategorySheetOpen(false);
                  onChangeTab("master-santri");
                }}
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
                    background: "#ede9fe",
                    color: "#6366f1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users size={26} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    textAlign: "center",
                  }}
                >
                  Santri
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DETAIL KARTU MODAL (RIGHT PHONE REPLICA)
      ========================================================================= */}
      {isDetailCardOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#ffffff",
            zIndex: 10000,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            fontFamily:
              "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
        >
          {/* Top Teal Curved Header */}
          <div
            style={{
              background:
                "linear-gradient(180deg, #0b6b60 0%, #0d766e 70%, #095c53 100%)",
              padding: "16px 16px 28px",
              color: "#ffffff",
              borderBottomLeftRadius: "28px",
              borderBottomRightRadius: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Soft decorative wave */}
            <svg
              style={{
                position: "absolute",
                right: "-20px",
                top: "-15px",
                width: "220px",
                height: "170px",
                opacity: 0.12,
                pointerEvents: "none",
              }}
              viewBox="0 0 200 200"
              fill="none"
            >
              <path
                d="M40 80C90 10 160 30 200 10L200 200L0 200C0 140 10 130 40 80Z"
                fill="#ffffff"
              />
            </svg>

            {/* Nav Row: Back Arrow, Title, Action Icons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <button
                onClick={() => setIsDetailCardOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                }}
              >
                <ArrowLeft size={22} />
              </button>

              <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                Detail Kartu
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CreditCard size={20} />
                <Settings size={20} />
              </div>
            </div>

            {/* Profile Section Inside Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                marginTop: "16px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "70px",
                  borderRadius: "8px",
                  background: "#dc2626",
                  border: "2px solid #ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                  marginBottom: "8px",
                }}
              >
                <User size={38} color="#ffffff" />
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                {displayName || "ICHA SYAHRIZATI"}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#a7f3d0",
                  marginTop: "2px",
                }}
              >
                Pondok Pesantren Nurul Wafa
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#e2e8f0",
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>1000 0051 4753 4906</span>
                <Copy size={13} style={{ cursor: "pointer", opacity: 0.8 }} />
              </div>
            </div>
          </div>

          {/* White Card: Saldo Uang Saku & 3 Round Quick Buttons */}
          <div style={{ padding: "0 16px", marginTop: "-20px", position: "relative", zIndex: 10 }}>
            <div
              style={{
                background: "#ffffff",
                borderRadius: "22px",
                padding: "18px 16px",
                boxShadow:
                  "0 10px 25px -4px rgba(11, 107, 96, 0.15), 0 3px 10px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
                Saldo Uang Saku
              </div>
              <div
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                  marginTop: "4px",
                }}
              >
                {showBalanceEye ? "Rp. 1.500.000,-" : "Rp ••••••••"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Tidak Ada Limit Harian
              </div>

              {/* 3 Round Quick Action Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  marginTop: "16px",
                  paddingTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                {/* 1. Isi Kartu */}
                <div
                  onClick={() => onChangeTab("keuangan-kasir")}
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
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#0d766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      boxShadow: "0 4px 10px rgba(13, 118, 110, 0.3)",
                    }}
                  >
                    <Plus size={20} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>
                    Isi Kartu
                  </span>
                </div>

                {/* 2. Rekap Keuangan */}
                <div
                  onClick={() => onChangeTab("keuangan-rekap")}
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
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#0d766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      boxShadow: "0 4px 10px rgba(13, 118, 110, 0.3)",
                    }}
                  >
                    <Receipt size={18} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>
                    Rekap Keuangan
                  </span>
                </div>

                {/* 3. Pindah */}
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
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#0d766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      boxShadow: "0 4px 10px rgba(13, 118, 110, 0.3)",
                    }}
                  >
                    <RotateCw size={18} />
                  </div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#334155" }}>
                    Pindah
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Riwayat Transaksi Section */}
          <div style={{ padding: "18px 16px 28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "#1e293b" }}>
                Riwayat Transaksi
              </span>
              <button
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <span>Filter</span>
                <Filter size={12} />
              </button>
            </div>

            {/* Month Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "8px",
                marginBottom: "12px",
              }}
            >
              {["Feb", "Mar", "Apr", "Mei", "Jun"].map((m) => {
                const isActive = selectedDetailMonth === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedDetailMonth(m)}
                    style={{
                      background: isActive ? "#0d766e" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#64748b",
                      border: "none",
                      borderRadius: "14px",
                      padding: "5px 14px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* List of Recent Transactions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Item 1 */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                    Isi Saldo Kartu Santri
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#64748b", marginTop: "2px" }}>
                    via CashPoint • 30 Mei 2025
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#16a34a" }}>
                  Rp. 1.500.000,-
                </div>
              </div>

              {/* Item 2 */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                    Beli Peci Hitam
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#64748b", marginTop: "2px" }}>
                    via Kantin • 29 Mei 2025
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ef4444" }}>
                  -Rp 75.000,-
                </div>
              </div>

              {/* Item 3 */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                    Beli Parfum Sholat
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#64748b", marginTop: "2px" }}>
                    via Kantin • 29 Mei 2025
                  </div>
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ef4444" }}>
                  -Rp 30.000,-
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  border: "#a7f3d0",
                },
                {
                  key: "Sakit",
                  count: modalSakitCount,
                  color: "#ef4444",
                  bg: "#fef2f2",
                  border: "#fecdd3",
                },
                {
                  key: "Izin",
                  count: modalIzinCount,
                  color: "#f59e0b",
                  bg: "#fffbeb",
                  border: "#fde68a",
                },
                {
                  key: "Alfa",
                  count: modalAlfaCount,
                  color: "#0d9488",
                  bg: "#f0fdfa",
                  border: "#99f6e4",
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
                    <span>{st.key}</span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        color: isActive ? st.color : "#0f172a",
                      }}
                    >
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Bar: Dropdown Filter Kegiatan & Search Input */}
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Dropdown Filter Sesi Kegiatan */}
              <div
                style={{
                  position: "relative",
                  background:
                    selectedKegiatan === "Semua" ? "#f8fafc" : "#eff6ff",
                  borderRadius: "12px",
                  border:
                    selectedKegiatan === "Semua"
                      ? "1.5px solid #e2e8f0"
                      : "1.5px solid #0284c7",
                  transition: "all 0.15s ease",
                }}
              >
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 34px 9px 12px",
                    border: "none",
                    background: "transparent",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: selectedKegiatan === "Semua" ? "#334155" : "#0369a1",
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="Semua">
                    🕌 Semua Sesi Kegiatan ({todayAbsensiList.length} Santri)
                  </option>
                  {availableKegiatanList.map((kg) => {
                    const countInKg = todayAbsensiList.filter(
                      (l) =>
                        (l.nama_sesi || l.kegiatan || "").toLowerCase() ===
                        kg.toLowerCase(),
                    ).length;
                    return (
                      <option key={kg} value={kg}>
                        {kg} ({countInKg} santri)
                      </option>
                    );
                  })}
                </select>
                <ChevronDown
                  size={15}
                  color={selectedKegiatan === "Semua" ? "#64748b" : "#0284c7"}
                  style={{
                    position: "absolute",
                    right: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              {/* Search Filter Input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  padding: "8px 12px",
                }}
              >
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder={`Cari nama, NIS, atau asrama santri ${selectedStatusTab}...`}
                  value={searchModalText}
                  onChange={(e) => setSearchModalText(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "0.78rem",
                    width: "100%",
                    color: "#0f172a",
                  }}
                />
                {searchModalText && (
                  <button
                    onClick={() => setSearchModalText("")}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <X size={14} color="#94a3b8" />
                  </button>
                )}
              </div>
            </div>

            {/* List Santri */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minHeight: "220px",
              }}
            >
              {filteredModalList.length === 0 ? (
                <div
                  style={{
                    padding: "36px 16px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "50%",
                      background: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      color: "#64748b",
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div
                    style={{
                      fontSize: "0.86rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "4px",
                    }}
                  >
                    Belum Ada Santri {selectedStatusTab} Hari Ini
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "#64748b",
                      maxWidth: "280px",
                      margin: "0 auto",
                    }}
                  >
                    Data presensi otomatis diperbarui saat musyrif mencatat
                    kehadiran santri.
                  </div>
                </div>
              ) : (
                filteredModalList.map((santri, idx) => {
                  const initial =
                    (santri.nama_santri || "Santri")
                      .replace(/[^a-zA-Z]/g, "")
                      .slice(0, 2)
                      .toUpperCase() || "ST";

                  const badgeColor =
                    selectedStatusTab === "Hadir"
                      ? "#059669"
                      : selectedStatusTab === "Sakit"
                        ? "#dc2626"
                        : selectedStatusTab === "Izin"
                          ? "#d97706"
                          : "#0f766e";

                  const badgeBg =
                    selectedStatusTab === "Hadir"
                      ? "#ecfdf5"
                      : selectedStatusTab === "Sakit"
                        ? "#fef2f2"
                        : selectedStatusTab === "Izin"
                          ? "#fffbeb"
                          : "#f0fdfa";

                  const badgeBorder =
                    selectedStatusTab === "Hadir"
                      ? "#a7f3d0"
                      : selectedStatusTab === "Sakit"
                        ? "#fecdd3"
                        : selectedStatusTab === "Izin"
                          ? "#fde68a"
                          : "#99f6e4";

                  return (
                    <div
                      key={santri.id || idx}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: badgeBg,
                            color: badgeColor,
                            border: `1.5px solid ${badgeBorder}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.84rem",
                            flexShrink: 0,
                          }}
                        >
                          {initial}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.86rem",
                              fontWeight: 800,
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {santri.nama_santri || "Nama Santri"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            {santri.nis && <span>NIS: {santri.nis}</span>}
                            {santri.nama_asrama && (
                              <>
                                <span>•</span>
                                <span>{santri.nama_asrama}</span>
                              </>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#94a3b8",
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Clock size={11} color="#94a3b8" />
                            <span>
                              {santri.nama_sesi ||
                                santri.kegiatan ||
                                "Sesi Terjadwal"}
                            </span>
                            {santri.waktu_scan && (
                              <span>• {santri.waktu_scan} WIB</span>
                            )}
                          </div>
                          {(santri.keterangan ||
                            santri.keteledoran_keterangan) && (
                            <div
                              style={{
                                fontSize: "0.68rem",
                                color: badgeColor,
                                background: badgeBg,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                marginTop: "4px",
                                display: "inline-block",
                              }}
                            >
                              Ket:{" "}
                              {santri.keterangan ||
                                santri.keteledoran_keterangan}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: "10px",
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          flexShrink: 0,
                        }}
                      >
                        {selectedStatusTab}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #f1f5f9",
                background: "#f8fafc",
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onChangeTab("presensi");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #0284c7, #0369a1)",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <span>Kelola di Menu Absensi</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Style Reusable Helpers
const countBadgeStyle = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "0.66rem",
  fontWeight: 800,
  minWidth: "18px",
  height: "18px",
  borderRadius: "9px",
  padding: "0 4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #ffffff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  animation: "badgePulse 2.5s infinite ease-in-out",
};

const menuCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  cursor: "pointer",
  userSelect: "none",
};

const squircleIconStyle = {
  width: "58px",
  height: "58px",
  borderRadius: "20px",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.15s ease",
};

const menuLabelStyle = {
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "#334155",
  textAlign: "center",
  lineHeight: 1.2,
  maxWidth: "74px",
  wordBreak: "break-word",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
