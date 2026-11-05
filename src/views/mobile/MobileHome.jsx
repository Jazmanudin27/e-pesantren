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
          TOP BANNER HEADER (MODERN ROYAL BLUE myBCA BRANDED HEADER)
      ========================================================================= */}
      <div
        style={{
          background:
            "linear-gradient(180deg, #005baa 0%, #004b91 65%, #003870 100%)",
          padding: "16px 16px 42px",
          color: "#ffffff",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          position: "relative",
        }}
      >
        {/* Top App Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          {/* Brand Typography: NWF Mobile (Gaya myBCA Text Only) */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
            <span
              style={{
                fontWeight: 900,
                fontSize: "1.55rem",
                letterSpacing: "-0.6px",
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              NWF
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.3px",
                color: "rgba(255, 255, 255, 0.95)",
                lineHeight: 1,
              }}
            >
              Mobile
            </span>
          </div>

          {/* Top 3 Action Buttons (Settings, Bell, Logout) */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleOpenNotice}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "6px",
                position: "relative",
              }}
              title="Notifikasi"
            >
              <Bell size={21} />
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  border: "1.5px solid #005baa",
                }}
              />
            </button>

            <button
              onClick={handleOpenAccountInfo}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "50%",
                transition: "opacity 0.2s",
              }}
              title="Pengaturan & Akun"
            >
              <Settings size={21} />
            </button>

            <button
              onClick={onLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: "6px",
              }}
              title="Keluar"
            >
              <LogOut size={21} />
            </button>
          </div>
        </div>

        {/* Greeting Line: HALO, [DISPLAY_NAME] (myBCA style) */}
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "rgba(255, 255, 255, 0.92)",
            textTransform: "uppercase",
            marginBottom: "14px",
          }}
        >
          HALO, {displayName.toUpperCase()}
        </div>
      </div>

      {/* =========================================================================
          HERO CARD: PRESENSI SANTRI HARI INI (KHUSUS ADMIN)
      ========================================================================= */}
      <div
        style={{
          padding: "0 16px",
          marginTop: "-30px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {isBendahara ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "16px 18px",
              boxShadow:
                "0 10px 25px -4px rgba(0, 91, 170, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "#005baa",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                }}
                onClick={() => onChangeTab("keuangan-rekap")}
              >
                <span>Kas Rekening Operasional</span>
                <ChevronDown size={16} color="#005baa" />
              </div>

              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#16a34a",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }}
                />
                Online Realtime
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    color: "#0f172a",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {showBalanceEye
                    ? `IDR ${Number(keuanganData.summary?.total_terbayar || 0).toLocaleString("id-ID")}`
                    : "IDR ••••••••••"}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#64748b",
                    marginTop: "2px",
                    fontWeight: 500,
                  }}
                >
                  Penerimaan Kas & SPP Bulan Berjalan
                </div>
              </div>

              <button
                onClick={() => setShowBalanceEye(!showBalanceEye)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title={showBalanceEye ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
              >
                {showBalanceEye ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>
        ) : (
          /* Signature myBCA 2-Tone Hero Card */
          <div
            style={{
              borderRadius: "20px",
              boxShadow:
                "0 12px 28px -4px rgba(0, 91, 170, 0.22), 0 2px 8px rgba(0, 0, 0, 0.06)",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {/* Dark Top Half (Charcoal #1e293b / #0f172a) */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                padding: "12px 16px 13px",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255, 255, 255, 0.12)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    color: "#e2e8f0",
                    marginBottom: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#22c55e",
                    }}
                  />
                  <span>Online Realtime</span>
                </div>
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "#cbd5e1",
                    fontWeight: 600,
                  }}
                >
                  ID Pesantren: NWF-2026-ADM
                </div>
              </div>

              {/* Gold Privilege / Admin Badge */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #b45309 100%)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "0.65rem",
                  letterSpacing: "0.06em",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(217, 119, 6, 0.4)",
                  border: "1px solid #fef3c7",
                  textTransform: "uppercase",
                }}
              >
                ADMIN UTAMA
              </div>
            </div>

            {/* White Bottom Half */}
            <div
              style={{
                background: "#ffffff",
                padding: "16px",
              }}
            >
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
                      fontSize: "0.72rem",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Presensi Santri Hari Ini
                  </div>
                  <div
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      letterSpacing: "-0.5px",
                      marginTop: "2px",
                    }}
                  >
                    {showBalanceEye
                      ? `${rekapAbsensi.hadir || 0} Santri Hadir`
                      : "••••••••"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "4px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                    }}
                  >
                    <span style={{ color: "#15803d" }}>
                      ✓ Hadir {rekapAbsensi.hadir || 0}
                    </span>
                    <span style={{ color: "#b91c1c" }}>
                      • Sakit {rekapAbsensi.sakit || 0}
                    </span>
                    <span style={{ color: "#d97706" }}>
                      • Izin {rekapAbsensi.izin || 0}
                    </span>
                    <span style={{ color: "#64748b" }}>
                      • Belum {rekapAbsensi.alfa || 0}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBalanceEye(!showBalanceEye)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "34px",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                  title={showBalanceEye ? "Sembunyikan" : "Tampilkan"}
                >
                  {showBalanceEye ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>

              {/* Bottom Two Action Pills (myBCA Mutasi & Rekening Lain style) */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "14px",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                }}
              >
                <button
                  onClick={() => handleOpenStatusModal("Hadir")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#005baa",
                    cursor: "pointer",
                  }}
                >
                  <FileText size={14} color="#005baa" />
                  <span>Detail Presensi</span>
                </button>

                <button
                  onClick={() => onChangeTab("presensi")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#005baa",
                    cursor: "pointer",
                  }}
                >
                  <Clock size={14} color="#005baa" />
                  <span>Riwayat Scan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MYBCA STYLE PROMO BANNER (KHUSUS ADMIN)
      ========================================================================= */}
      {!isBendahara && (
        <div style={{ padding: "14px 16px 0" }}>
          <div
            onClick={() => onChangeTab("informasi")}
            style={{
              background:
                "linear-gradient(135deg, #005baa 0%, #0284c7 50%, #7c3aed 100%)",
              borderRadius: "14px",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#ffffff",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0, 91, 170, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} color="#fde047" />
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                Informasi & Pengumuman Pesantren
              </span>
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#e0f2fe",
              }}
            >
              Lihat &gt;
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          KONDISIONAL: TAMPILAN BENDAHARA VS TAMPILAN OPERASIONAL ASATIDZ
      ========================================================================= */}
      {isBendahara ? (
        <>
          {/* =========================================================================
              DIGITAL VAULT CARD: KAS UTAMA PESANTREN (SUPER ELEGAN & MEWAH)
          ========================================================================= */}
          <div style={{ padding: "0 16px", marginTop: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#005baa",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                KAS & KEUANGAN PESANTREN
              </span>
              <span
                onClick={() => onChangeTab("keuangan-rekap")}
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: "#005baa",
                  cursor: "pointer",
                }}
              >
                Selengkapnya &gt;
              </span>
            </div>
            <div
              style={{
                background:
                  "linear-gradient(145deg, #022c22 0%, #064e3b 50%, #065f46 100%)",
                borderRadius: "26px",
                border: "1.5px solid rgba(52, 211, 153, 0.35)",
                padding: "20px 18px",
                boxShadow:
                  "0 16px 36px -8px rgba(6, 78, 59, 0.45), 0 4px 12px rgba(0, 0, 0, 0.12)",
                position: "relative",
                zIndex: 10,
                color: "#ffffff",
                overflow: "hidden",
              }}
            >
              {/* Background Geometric Texture Glow */}
              <div
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "-40px",
                  width: "140px",
                  height: "140px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0) 70%)",
                  pointerEvents: "none",
                }}
              />

              {/* Card Top Row: Chip EMV Gold & Label Kas */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {/* Gold EMV Chip Simulation */}
                  <div
                    style={{
                      width: "36px",
                      height: "26px",
                      borderRadius: "6px",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)",
                      border: "1px solid #fef3c7",
                      boxShadow: "0 2px 6px rgba(217, 119, 6, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "1px",
                        background: "rgba(0,0,0,0.25)",
                      }}
                    />
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#a7f3d0",
                        textTransform: "uppercase",
                      }}
                    >
                      KAS UTAMA PESANTREN
                    </span>
                    <div
                      style={{
                        fontSize: "0.6rem",
                        color: "#6ee7b7",
                        opacity: 0.85,
                      }}
                    >
                      Rekening Operasional & SPP
                    </div>
                  </div>
                </div>

                {/* Badge Status Online */}
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(52, 211, 153, 0.4)",
                    color: "#34d399",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "0.65rem",
                    fontWeight: 800,
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
                      background: "#34d399",
                      boxShadow: "0 0 6px #34d399",
                    }}
                  />
                  REALTIME
                </div>
              </div>

              {/* Saldo Pemasukan Kas Masuk Utama */}
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "#d1fae5",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Total Penerimaan Kas (Pemasukan)</span>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      fontSize: "0.6rem",
                    }}
                  >
                    Bulan Berjalan
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: "#ffffff",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#34d399",
                    }}
                  >
                    Rp
                  </span>
                  <span>
                    {Number(
                      keuanganData.summary?.total_kas_masuk_sah ||
                        keuanganData.summary?.total_terbayar ||
                        0,
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Sub-Metrics Inside Card: Tunggakan & Status Tagihan */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  background: "rgba(0, 20, 15, 0.55)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "18px",
                  padding: "12px 14px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Tunggakan Piutang */}
                <div
                  onClick={() => onChangeTab("keuangan-tunggakan")}
                  style={{
                    cursor: "pointer",
                    borderRight: "1px solid rgba(255, 255, 255, 0.12)",
                    paddingRight: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.66rem",
                      color: "#fca5a5",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <AlertTriangle size={12} color="#f87171" />
                    <span>Total Piutang Santri</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "#fecdd3",
                      marginTop: "3px",
                    }}
                  >
                    Rp{" "}
                    {Number(
                      keuanganData.summary?.total_tunggakan || 0,
                    ).toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Progress Status Tagihan */}
                <div
                  onClick={() => onChangeTab("keuangan-rekap")}
                  style={{ cursor: "pointer", paddingLeft: "4px" }}
                >
                  <div
                    style={{
                      fontSize: "0.66rem",
                      color: "#93c5fd",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <CheckCircle2 size={12} color="#60a5fa" />
                    <span>Realisasi SPP</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "#ffffff",
                      marginTop: "3px",
                    }}
                  >
                    <span style={{ color: "#34d399" }}>
                      {keuanganData.summary?.jumlah_tagihan_lunas || 0} Lunas
                    </span>
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "0.72rem",
                        margin: "0 4px",
                      }}
                    >
                      •
                    </span>
                    <span style={{ color: "#f87171", fontSize: "0.75rem" }}>
                      {keuanganData.summary?.jumlah_tagihan_tertunggak || 0}{" "}
                      Nunggak
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 Action Buttons Integrated Inside Card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <button
                  onClick={() => onChangeTab("keuangan-kasir")}
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    color: "#ffffff",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <CreditCard size={15} />
                  <span>Buka Kasir Bayar &gt;</span>
                </button>

                <button
                  onClick={() => onChangeTab("keuangan-rekap")}
                  style={{
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    padding: "10px 12px",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    cursor: "pointer",
                  }}
                >
                  <BarChart3 size={15} color="#a7f3d0" />
                  <span>Laporan &gt;</span>
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              8 MENU KHUSUS KEUANGAN & BENDAHARA
          ========================================================================= */}
          <div style={{ padding: "18px 14px 6px" }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#334155",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "12px",
                paddingLeft: "4px",
              }}
            >
              Menu Layanan Keuangan
            </div>
            <div
              className="mobile-squircle-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px 8px",
              }}
            >
              {/* 1. Kasir & Pembayaran */}
              <div
                onClick={() => onChangeTab("keuangan-kasir")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #059669, #047857)",
                    boxShadow: "0 8px 16px -2px rgba(5, 150, 105, 0.35)",
                  }}
                >
                  <CreditCard size={26} />
                </div>
                <span style={menuLabelStyle}>Kasir Santri</span>
              </div>

              {/* 2. Laporan Rekap */}
              <div
                onClick={() => onChangeTab("keuangan-rekap")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #0284c7, #0369a1)",
                    boxShadow: "0 8px 16px -2px rgba(2, 132, 199, 0.35)",
                  }}
                >
                  <BarChart3 size={26} />
                </div>
                <span style={menuLabelStyle}>Laporan Kas</span>
              </div>

              {/* 3. Tagihan SPP */}
              <div
                onClick={() => onChangeTab("keuangan-spp")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    boxShadow: "0 8px 16px -2px rgba(124, 58, 237, 0.35)",
                  }}
                >
                  <FileText size={26} />
                </div>
                <span style={menuLabelStyle}>Tagihan SPP</span>
              </div>

              {/* 4. Biaya Awal Masuk */}
              <div
                onClick={() => onChangeTab("keuangan-masuk")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #d97706, #b45309)",
                    boxShadow: "0 8px 16px -2px rgba(217, 119, 6, 0.35)",
                  }}
                >
                  <Building2 size={26} />
                </div>
                <span style={menuLabelStyle}>Biaya Masuk</span>
              </div>

              {/* 5. Midtrans QRIS & VA */}
              <div
                onClick={() => onChangeTab("keuangan-midtrans")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #0891b2, #0e7490)",
                    boxShadow: "0 8px 16px -2px rgba(8, 145, 178, 0.35)",
                  }}
                >
                  <Zap size={26} />
                </div>
                <span style={menuLabelStyle}>QRIS & VA</span>
              </div>

              {/* 6. Daftar Tunggakan */}
              <div
                onClick={() => onChangeTab("keuangan-tunggakan")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    boxShadow: "0 8px 16px -2px rgba(225, 29, 72, 0.35)",
                  }}
                >
                  <AlertTriangle size={26} />
                </div>
                <span style={menuLabelStyle}>Tunggakan</span>
              </div>

              {/* 7. Tarif Komponen Biaya */}
              <div
                onClick={() => onChangeTab("keuangan-komponen")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                    boxShadow: "0 8px 16px -2px rgba(79, 70, 229, 0.35)",
                  }}
                >
                  <Layers size={26} />
                </div>
                <span style={menuLabelStyle}>Tarif Biaya</span>
              </div>

              {/* 8. Generate Tagihan */}
              <div
                onClick={() => onChangeTab("keuangan-generate")}
                className="mobile-menu-interactive"
              >
                <div
                  className="squircle-icon-animated"
                  style={{
                    background: "linear-gradient(135deg, #0f766e, #115e59)",
                    boxShadow: "0 8px 16px -2px rgba(15, 118, 110, 0.35)",
                  }}
                >
                  <RotateCw size={26} />
                </div>
                <span style={menuLabelStyle}>Generate SPP</span>
              </div>
            </div>
          </div>

          {/* Transaksi Pembayaran Terkini */}
          <div style={{ padding: "16px 16px 20px" }}>
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
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Transaksi Masuk Terakhir
              </div>
              <button
                onClick={() => onChangeTab("keuangan-transaksi")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#059669",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Lihat Semua
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {(keuanganData.transaksiTerakhir || [])
                .filter(
                  (trx) =>
                    trx.status_pembayaran === "Berhasil" ||
                    trx.status_pembayaran === "settlement",
                )
                .slice(0, 4)
                .map((trx, idx) => {
                  return (
                    <div
                      key={trx.id || idx}
                      onClick={() => onChangeTab("keuangan-transaksi")}
                      style={{
                        background: "#ffffff",
                        borderRadius: "14px",
                        padding: "12px 14px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.84rem",
                            color: "#0f172a",
                          }}
                        >
                          {trx.nama_santri || "Santri"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          #{trx.nomor_transaksi} •{" "}
                          {trx.metode_pembayaran || "Tunai"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.84rem",
                            color: "#059669",
                          }}
                        >
                          Rp{" "}
                          {Number(trx.total_bayar || 0).toLocaleString("id-ID")}
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            marginTop: "2px",
                            background: "#dcfce7",
                            color: "#15803d",
                          }}
                        >
                          Lunas
                        </span>
                      </div>
                    </div>
                  );
                })}

              {(!keuanganData.transaksiTerakhir ||
                keuanganData.transaksiTerakhir.filter(
                  (t) =>
                    t.status_pembayaran === "Berhasil" ||
                    t.status_pembayaran === "settlement",
                ).length === 0) && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px dashed #cbd5e1",
                    color: "#94a3b8",
                    fontSize: "0.78rem",
                  }}
                >
                  Belum ada pembayaran kas masuk yang lunas/berhasil
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* =========================================================================
              CARD MENU: GAYA PERSIS myBCA (DATA MASTER & TRANSAKSI)
          ========================================================================= */}
          <div style={{ padding: "0 16px", marginTop: "16px" }}>
            <div style={{ marginBottom: "10px" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  color: "#005baa",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                MENU
              </span>
            </div>

            <div
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                if (diff > 45) setMenuCardTab("transaksi");
                else if (diff < -45) setMenuCardTab("master");
                touchStartX.current = null;
              }}
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                boxShadow:
                  "0 10px 25px -4px rgba(0, 91, 170, 0.08), 0 2px 8px rgba(0, 0, 0, 0.03)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              {/* Top Banner myBCA Style */}
              <div
                style={{
                  background:
                    "linear-gradient(90deg, #005baa 0%, #0072ce 50%, #7c3aed 100%)",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#ffffff",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Sparkles size={14} color="#67e8f9" />
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {menuCardTab === "master"
                      ? "Kategori: Data Master"
                      : "Kategori: Transaksi Santri"}
                  </span>
                </div>
                <div
                  onClick={() =>
                    setMenuCardTab(
                      menuCardTab === "master" ? "transaksi" : "master",
                    )
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#e0f2fe",
                    cursor: "pointer",
                  }}
                >
                  <span>
                    {menuCardTab === "master" ? "Transaksi >" : "Data Master >"}
                  </span>
                </div>
              </div>

              {/* Card Body Grid with Smooth Transition */}
              <div style={{ padding: "18px 12px 14px", minHeight: "175px" }}>
                {menuCardTab === "master" ? (
                  /* PAGE 1: DATA MASTER (4 COLUMNS X 2 ROWS) */
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "16px 6px",
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(37, 99, 235, 0.12)",
                        }}
                      >
                        <Users size={23} />
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

                    {/* 2. Asrama */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                          border: "1px solid #fcd34d",
                          color: "#b45309",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(217, 119, 6, 0.12)",
                        }}
                      >
                        <Building size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Asrama
                      </span>
                    </div>

                    {/* 3. Kelas */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                          border: "1px solid #a5b4fc",
                          color: "#4338ca",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(79, 70, 229, 0.12)",
                        }}
                      >
                        <Layers size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Kelas
                      </span>
                    </div>

                    {/* 4. Asatidz */}
                    <div
                      onClick={() => onChangeTab("master-asatidz")}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
                          border: "1px solid #5eead4",
                          color: "#0f766e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(13, 148, 136, 0.12)",
                        }}
                      >
                        <UserCheck size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Asatidz
                      </span>
                    </div>

                    {/* 5. Tata Tertib */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)",
                          border: "1px solid #fda4af",
                          color: "#be123c",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(225, 29, 72, 0.12)",
                        }}
                      >
                        <ShieldAlert size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Tata Tertib
                      </span>
                    </div>

                    {/* 6. Daftar  */}
                    <div
                      onClick={() => onChangeTab("daftar-wajah")}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          border: "1px solid #7dd3fc",
                          color: "#0369a1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(2, 132, 199, 0.12)",
                        }}
                      >
                        <Smile size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Daftar Wajah
                      </span>
                    </div>
                  </div>
                ) : (
                  /* PAGE 2: TRANSAKSI (4 COLUMNS) */
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "16px 6px",
                    }}
                  >
                    {/* 1. Presensi (Royal Blue) */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
                          border: "1px solid #7dd3fc",
                          color: "#005baa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(0, 91, 170, 0.15)",
                        }}
                      >
                        <Fingerprint size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Presensi
                      </span>
                    </div>

                    {/* 2. Perizinan (Cyan) */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)",
                          border: "1px solid #67e8f9",
                          color: "#0e7490",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(6, 182, 212, 0.15)",
                        }}
                      >
                        <DoorOpen size={23} />
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

                    {/* 3. Perkembangan (Indigo / Purple) */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                          border: "1px solid #c4b5fd",
                          color: "#6d28d9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(124, 58, 237, 0.15)",
                        }}
                      >
                        <Award size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Perkembangan
                      </span>
                    </div>

                    {/* 4. Praktek (Emerald Green) */}
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
                          width: "50px",
                          height: "50px",
                          borderRadius: "17px",
                          background:
                            "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
                          border: "1px solid #86efac",
                          color: "#15803d",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 3px 10px rgba(16, 185, 129, 0.15)",
                        }}
                      >
                        <HeartHandshake size={23} />
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#334155",
                          textAlign: "center",
                        }}
                      >
                        Praktek
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* myBCA Style Pagination Dots Indicator (Clickable to switch page) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "6px",
                  paddingBottom: "14px",
                  cursor: "pointer",
                }}
              >
                <div
                  onClick={() => setMenuCardTab("master")}
                  title="Data Master"
                  style={{
                    width: menuCardTab === "master" ? "22px" : "6px",
                    height: "4px",
                    borderRadius: "4px",
                    background:
                      menuCardTab === "master" ? "#005baa" : "#cbd5e1",
                    transition: "all 0.25s ease",
                  }}
                />
                <div
                  onClick={() => setMenuCardTab("transaksi")}
                  title="Transaksi"
                  style={{
                    width: menuCardTab === "transaksi" ? "22px" : "6px",
                    height: "4px",
                    borderRadius: "4px",
                    background:
                      menuCardTab === "transaksi" ? "#005baa" : "#cbd5e1",
                    transition: "all 0.25s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL DETAIL PRESENSI SANTRI HARI INI (KHUSUS ASATIDZ / NON-BENDAHARA)
      ========================================================================= */}
      {!isBendahara && isDetailModalOpen && (
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
