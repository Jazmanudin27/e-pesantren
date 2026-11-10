import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Home,
  BookOpen,
  Wallet,
  DoorOpen,
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  LayoutDashboard,
  Fingerprint,
  Grid,
  X,
  ArrowLeft,
  User,
  HeartHandshake,
  Smile,
  Award,
  CreditCard,
  DollarSign,
  Zap,
  Layers,
  RotateCw,
  Calendar,
  Heart,
  MessageSquare,
  Smartphone,
  Send,
} from "lucide-react";
import { canAccessKeuangan } from "../utils/authRole.util";

// Safe Lazy Wrapper: Cegah Chunk Load Error saat ada rilis/build baru di server
const lazySafe = (importer) =>
  lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      console.warn("[SPA] Dynamic import chunk gagal dimuat, memuat ulang halaman...", err);
      window.location.reload();
      return new Promise(() => {});
    }
  });

// Code Splitting & Lazy Loading Semua View Komponen dengan Auto-Recovery
const MobileHome = lazySafe(() => import("../views/mobile/MobileHome"));
const MobileSyahriah = lazySafe(() => import("../views/mobile/MobileSyahriah"));
const KeuanganAdminView = lazySafe(
  () => import("../views/keuangan/KeuanganAdminView"),
);
const MobileKeuangan = lazySafe(() => import("../views/mobile/MobileKeuangan"));
const MobileIzin = lazySafe(() => import("../views/mobile/MobileIzin"));
const MobileDashboard = lazySafe(() => import("../views/mobile/MobileDashboard"));
const MobilePresensiBerjamaah = lazySafe(
  () => import("../views/mobile/MobilePresensiBerjamaah"),
);
const MobilePresensiMengaji = lazySafe(
  () => import("../views/mobile/MobilePresensiMengaji"),
);
const MobileSantri = lazySafe(() => import("../views/mobile/MobileSantri"));
const MobileAsrama = lazySafe(() => import("../views/mobile/MobileAsrama"));
const MobileKelas = lazySafe(() => import("../views/mobile/MobileKelas"));
const MobileAsatidz = lazySafe(() => import("../views/mobile/MobileAsatidz"));
const MobileDevice = lazySafe(() => import("../views/mobile/MobileDevice"));
const MobileTataTertib = lazySafe(() => import("../views/mobile/MobileTataTertib"));
const MobileLaporanPresensi = lazySafe(
  () => import("../views/mobile/MobileLaporanPresensi"),
);
const PengajarLaporanBerjamaah = lazySafe(
  () => import("../views/pengajar/PengajarLaporanBerjamaah"),
);
const PengajarLaporanMengaji = lazySafe(
  () => import("../views/pengajar/PengajarLaporanMengaji"),
);
const MobileKitab = lazySafe(() => import("../views/mobile/MobileKitab"));
const MobileProfil = lazySafe(() => import("../views/mobile/MobileProfil"));
const MobileDaftarWajah = lazySafe(
  () => import("../views/mobile/MobileDaftarWajah"),
);
const MobileLogin = lazySafe(() => import("../views/mobile/MobileLogin"));
const MobileOnboarding = lazySafe(() => import("../views/mobile/MobileOnboarding"));
const MobilePraktek = lazySafe(() => import("../views/mobile/MobilePraktek"));
const MobilePengembangan = lazySafe(
  () => import("../views/mobile/MobilePengembangan"),
);
const MobileMasterPengembangan = lazySafe(
  () => import("../views/mobile/MobileMasterPengembangan"),
);
const MobileMateriHafalan = lazySafe(
  () => import("../views/mobile/MobileMateriHafalan"),
);
const MobileKegiatan = lazySafe(() => import("../views/mobile/MobileKegiatan"));
const SettingKegiatanView = lazySafe(
  () => import("../views/admin/SettingKegiatanView"),
);
const InformasiKegiatanAdminView = lazySafe(
  () => import("../views/admin/InformasiKegiatanAdminView"),
);
const TabInformasiKegiatan = lazySafe(
  () => import("../views/wali/TabInformasiKegiatan"),
);
const PortalWaliSantri = lazySafe(() => import("../views/wali/PortalWaliSantri"));
const MobileTabungan = lazySafe(() => import("../views/mobile/MobileTabungan"));
const LaporanInfakAdminView = lazySafe(
  () => import("../views/keuangan/LaporanInfakAdminView"),
);
const PesanKomunikasiAdminView = lazySafe(
  () => import("../views/admin/PesanKomunikasiAdminView"),
);
const WhatsAppGatewayView = lazySafe(
  () => import("../views/admin/WhatsAppGatewayView"),
);
const MobileHomeKeuangan = lazySafe(
  () => import("../views/keuangan/MobileHomeKeuangan"),
);
const MobileKeuanganLayout = lazySafe(() => import("./MobileKeuanganLayout"));
const MobileMediaPipeTest = lazySafe(
  () => import("../views/mobile/MobileMediaPipeTest"),
);
const OwnerDashboardView = lazySafe(
  () => import("../views/owner/OwnerDashboardView"),
);
const MobileHaid = lazySafe(() => import("../views/mobile/MobileHaid"));

// Loading Fallback Komponen
const MobileLoadingFallback = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "45vh",
      padding: "36px 16px",
      color: "#059669",
    }}
  >
    <RotateCw
      size={28}
      className="animate-spin"
      color="#059669"
      style={{ marginBottom: "10px" }}
    />
    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }}>
      Memuat Halaman...
    </span>
  </div>
);

export default function MobileLayout() {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("mobile_session");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isMobileDomain =
    typeof window !== "undefined" &&
    (window.location.hostname === "mnurulwafa.ruangtech.com" ||
      window.location.hostname === "m.nurulwafa.ruangtech.com" ||
      window.location.hostname.startsWith("mnurulwafa.") ||
      window.location.hostname.startsWith("m.") ||
      window.location.hostname === "mpesantren.aspartech.com" ||
      window.location.hostname.startsWith("mpesantren.") ||
      window.location.hostname.includes("mpesantren"));

  const getInitialTab = () => {
    const hash = window.location.hash.replace("#", "");
    if (hash.includes("/")) {
      const sub = hash.split("/")[1];
      if (sub && sub !== "home") return sub;
    }
    if (hash && hash !== "mobile" && hash !== "home") {
      return hash;
    }
    // Jika user login sebagai Wali Santri / Santri, arahkan ke portal-wali
    try {
      const sess = JSON.parse(localStorage.getItem("mobile_session") || "{}");
      const r = String(sess.role || sess.userType || "").toLowerCase();
      if (r.includes("wali") || r.includes("santri")) {
        return "portal-wali";
      }
    } catch (e) {}
    // Jika buka domain utama tanpa hash tertentu, selalu buka Beranda (home)
    return "home";
  };

  const [mobileTab, setMobileTab] = useState(getInitialTab);
  const [authView, setAuthView] = useState(() => {
    const hash = (
      typeof window !== "undefined" ? window.location.hash : ""
    ).toLowerCase();
    if (hash.includes("login")) return "login";
    return "onboarding";
  });
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);

  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash.toLowerCase().includes("login")) {
        setAuthView("login");
      } else if (
        hash.toLowerCase().includes("welcome") ||
        hash.toLowerCase().includes("onboarding")
      ) {
        setAuthView("onboarding");
      }
      if (hash.includes("/")) {
        const sub = hash.split("/")[1];
        if (sub) {
          setMobileTab(sub);
          localStorage.setItem("mobileTab", sub);
        }
      } else if (hash && hash !== "mobile") {
        setMobileTab(hash);
        localStorage.setItem("mobileTab", hash);
      } else if (hash === "mobile" || (!hash && isMobileDomain)) {
        try {
          const sess = JSON.parse(
            localStorage.getItem("mobile_session") || "{}",
          );
          const r = String(sess.role || sess.userType || "").toLowerCase();
          const u = String(sess.username || "").toLowerCase();
          if (r.includes("wali") || r.includes("santri")) {
            setMobileTab("portal-wali");
            localStorage.setItem("mobileTab", "portal-wali");
            return;
          }
          if (
            r.includes("bendahara") ||
            r.includes("keuangan") ||
            u.includes("bendahara") ||
            u.includes("keuangan")
          ) {
            setMobileTab("home");
            localStorage.setItem("mobileTab", "home");
            return;
          }
        } catch (e) {}
        // Root domain mobile selalu buka Beranda
        setMobileTab("home");
        localStorage.setItem("mobileTab", "home");
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, [isMobileDomain]);

  // Scroll to top saat ganti tab atau refresh (Cegah header ketutup)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    const c = document.querySelector(".mobile-content");
    if (c) c.scrollTop = 0;
  }, [mobileTab]);

  const handleSelectTab = (tab) => {
    setMobileTab(tab);
    localStorage.setItem("mobileTab", tab);
    if (isMobileDomain) {
      window.location.hash = tab === "home" ? "" : tab;
    } else {
      window.location.hash = tab === "home" ? "mobile" : `mobile/${tab}`;
    }
    setIsMenuDrawerOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("mobile_session");
    setSession(null);
  };

  const handleLoginSuccess = (userSession) => {
    const role = String(userSession?.role || "").toLowerCase();
    const uName = String(userSession?.username || "").toLowerCase();
    if (role === "wali" || role === "wali santri") {
      window.location.hash = "#wali";
      window.location.reload();
      return;
    }
    if (
      role.includes("bendahara") ||
      role.includes("keuangan") ||
      uName.includes("bendahara") ||
      uName.includes("keuangan")
    ) {
      localStorage.setItem("mobileTab", "home");
      setMobileTab("home");
      if (isMobileDomain) {
        window.location.hash = "";
      } else {
        window.location.hash = "mobile";
      }
      setSession(userSession);
      return;
    }
    localStorage.setItem("mobileTab", "home");
    setMobileTab("home");
    if (isMobileDomain) {
      window.location.hash = "";
    } else {
      window.location.hash = "mobile";
    }
    setSession(userSession);
  };

  // If user is not logged in on mobile app, display MobileOnboarding or MobileLogin screen!
  if (!session) {
    return (
      <Suspense fallback={<MobileLoadingFallback />}>
        {authView === "login" ? (
          <MobileLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToOnboarding={() => setAuthView("onboarding")}
          />
        ) : (
          <MobileOnboarding onStart={() => setAuthView("login")} />
        )}
      </Suspense>
    );
  }

  const isBendahara = (() => {
    const role = String(session?.role || "").toLowerCase();
    const uName = String(session?.username || "").toLowerCase();
    const uType = String(session?.userType || "").toLowerCase();
    return (
      role.includes("keuangan") ||
      role.includes("bendahara") ||
      uName.includes("bendahara") ||
      uName.includes("keuangan") ||
      uType.includes("bendahara") ||
      uType.includes("keuangan")
    );
  })();

  // JIKA ROLE BENDAHARA / KEUANGAN: ALIKAN 100% KE LAYOUT KHUSUS MOBILE KEUANGAN
  if (isBendahara) {
    return <MobileKeuanganLayout />;
  }

  const getSubmenuTitle = () => {
    switch (mobileTab) {
      case "dashboard":
        return "Dashboard System";
      case "berjamaah":
        return "Presensi Shalat Berjamaah";
      case "mengaji":
        return "Presensi Kegiatan Mengaji";
      case "laporan-berjamaah":
        return "Laporan Presensi Berjamaah";
      case "laporan-mengaji":
        return "Laporan Presensi Mengaji";
      case "presensi":
        return "Presensi Barcode & Wajah";
      case "tahfidz":
        return "Tahfidz & Muroja'ah";
      case "praktek-ibadah":
      case "praktek":
        return "Praktek";
      case "pengembangan":
      case "perkembangan-ikhwan":
      case "perkembangan-akhwat":
        return "Pengembangan (Ikhwan & Akhwat)";
      case "master-pengembangan":
      case "setting-pengembangan":
        return "Master Bidang Pengembangan";
      case "perizinan":
      case "izin":
        return "Perizinan";
      case "master-santri":
        return "Data Santri";
      case "haid":
      case "haid-santriwati":
        return "Pencatatan Haid Santriwati";
      case "daftar-wajah":
      case "wajah":
        return "Daftar Wajah Santri";
      case "master-asrama":
        return "Data Asrama & Kobong";
      case "master-kelas":
        return "Data Kelas & Halaqah";
      case "master-asatidz":
        return "Data Asatidz & Musyrif";
      case "master-materi":
        return "Master Materi & Kitab";
      case "setting-shalat":
      case "setting-kegiatan":
      case "master-kegiatan":
      case "kegiatan":
        return "Master Kegiatan";
      case "informasi":
      case "informasi-kegiatan":
        return "Informasi & Pengumuman";
      case "kitab":
        return "Kajian Kitab Kuning";
      case "master-device":
        return "Data Mesin Fingerprint";
      case "tata-tertib":
        return "Tata Tertib & Ta'zir";
      case "laporan-presensi":
        return "Rekap Presensi Harian";
      case "laporan-tahfidz":
        return "Laporan Tahfidz & Tasmi'";
      case "syahriah":
      case "keuangan":
      case "keuangan-kasir":
        return "Kasir Pembayaran Santri";
      case "keuangan-rekap":
        return "Laporan Kas & Rekap SPP";
      case "keuangan-spp":
        return "Tagihan SPP Bulanan";
      case "keuangan-masuk":
        return "Biaya Awal Masuk";
      case "keuangan-transaksi":
        return "Transaksi QRIS & VA Midtrans";
      case "keuangan-tunggakan":
        return "Daftar Tunggakan Santri";
      case "keuangan-komponen":
        return "Tarif Komponen Biaya";
      case "keuangan-generate":
        return "Generate Tagihan SPP";
      case "tabungan":
        return "Saldo Tabungan Santri";
      case "laporan-infak":
      case "infak":
        return "Infak & Sedekah Pesantren";
      case "pesan-komunikasi":
      case "pesan-admin":
      case "pesan":
        return "Pesan & Komunikasi Wali";
      case "whatsapp-gateway":
      case "whatsapp":
      case "wa-broadcast":
        return "WhatsApp & Broadcast";
      case "profil":
        return isBendahara ? "Profil Bendahara" : "Profil Asatidz & Admin";
      case "portal-wali":
        return "Portal Orang Tua (Wali)";
      default:
        return "";
    }
  };

  const isOtherMenuActive = [
    "dashboard",
    "master-santri",
    "master-asrama",
    "master-kelas",
    "master-asatidz",
    "master-pengembangan",
    "setting-pengembangan",
    "master-materi",
    "kitab",
    "master-device",
    "tata-tertib",
    "laporan-presensi",
    "laporan-berjamaah",
    "laporan-mengaji",
    "laporan-tahfidz",
    "syahriah",
    "praktek-ibadah",
    "praktek",
    "portal-wali",
    "setting-shalat",
    "setting-kegiatan",
    "master-kegiatan",
    "kegiatan",
    "informasi",
    "informasi-kegiatan",
    "keuangan",
    "keuangan-kasir",
    "keuangan-rekap",
    "keuangan-spp",
    "keuangan-masuk",
    "keuangan-transaksi",
    "keuangan-tunggakan",
    "keuangan-komponen",
    "keuangan-generate",
    "tabungan",
  ].includes(mobileTab);

  const renderAksesDibatasi = () => (
    <div
      style={{
        padding: "36px 20px",
        textAlign: "center",
        background: "#fff",
        borderRadius: "20px",
        margin: "20px 14px",
        border: "1px solid #fee2e2",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#fef2f2",
          color: "#dc2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <ShieldAlert size={30} />
      </div>
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 6px",
        }}
      >
        Akses Dibatasi
      </h3>
      <p
        style={{
          fontSize: "0.8rem",
          color: "#64748b",
          margin: "0 0 16px",
          lineHeight: 1.4,
        }}
      >
        Menu Keuangan hanya dapat diakses oleh Admin Keuangan / Bendahara. Admin
        Absensi dan operasional tidak memiliki hak akses.
      </p>
      <button
        onClick={() => handleSelectTab("home")}
        style={{
          background: "#059669",
          color: "#fff",
          border: "none",
          padding: "9px 18px",
          borderRadius: "10px",
          fontSize: "0.8rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Kembali ke Beranda
      </button>
    </div>
  );

  const renderContent = () => {
    const isOwnerUser = (() => {
      try {
        const sess = JSON.parse(
          localStorage.getItem("mobile_session") ||
            localStorage.getItem("desktop_session") ||
            "{}",
        );
        const r = String(
          sess.role || sess.userType || sess.username || "",
        ).toLowerCase();
        return r.includes("owner");
      } catch (e) {
        return false;
      }
    })();

    if (isOwnerUser || mobileTab === "owner" || mobileTab === "laporan-owner") {
      return <OwnerDashboardView onLogout={handleLogout} />;
    }

    const isWaliUser = (() => {
      try {
        const sess = JSON.parse(localStorage.getItem("mobile_session") || "{}");
        const r = String(sess.role || sess.userType || "").toLowerCase();
        return r.includes("wali") || r.includes("santri");
      } catch (e) {
        return false;
      }
    })();

    switch (mobileTab) {
      case "home":
        if (isWaliUser) {
          return <PortalWaliSantri onLogout={handleLogout} />;
        }
        return (
          <MobileHome onChangeTab={handleSelectTab} onLogout={handleLogout} />
        );
      case "portal-wali":
        return <PortalWaliSantri onLogout={handleLogout} />;
      case "dashboard":
        return <MobileDashboard />;
      case "berjamaah":
        return <MobilePresensiBerjamaah />;
      case "mengaji":
        return <MobilePresensiMengaji />;
      case "laporan-berjamaah":
        return <PengajarLaporanBerjamaah />;
      case "laporan-mengaji":
        return <PengajarLaporanMengaji />;
      case "presensi":
        return <MobilePresensiBerjamaah />;
      case "praktek-ibadah":
      case "praktek":
        return <MobilePraktek />;
      case "pengembangan":
      case "perkembangan-ikhwan":
      case "perkembangan-akhwat":
        return <MobilePengembangan />;
      case "master-pengembangan":
      case "setting-pengembangan":
        return (
          <MobileMasterPengembangan onBack={() => handleSelectTab("home")} />
        );
      case "perizinan":
      case "izin":
        return <MobileIzin />;
      case "master-santri":
        return <MobileSantri />;
      case "daftar-wajah":
      case "wajah":
        return <MobileDaftarWajah />;
      case "master-asrama":
        return <MobileAsrama />;
      case "master-kelas":
        return <MobileKelas />;
      case "master-asatidz":
        return <MobileAsatidz />;
      case "master-materi":
        return <MobileMateriHafalan />;
      case "setting-shalat":
      case "setting-kegiatan":
      case "master-kegiatan":
      case "kegiatan":
        return <MobileKegiatan />;
      case "informasi":
      case "informasi-kegiatan":
        return <TabInformasiKegiatan onBack={() => handleSelectTab("home")} />;
      case "pengumuman":
      case "kelola-pengumuman":
        return <InformasiKegiatanAdminView />;
      case "kitab":
        return <MobileKitab />;
      case "master-device":
        return <MobileDevice />;
      case "tata-tertib":
        return <MobileTataTertib />;
      case "laporan-presensi":
        return <MobileLaporanPresensi />;
      case "syahriah":
      case "keuangan":
      case "keuangan-kasir":
      case "keuangan-rekap":
      case "keuangan-spp":
      case "keuangan-masuk":
      case "keuangan-transaksi":
      case "keuangan-midtrans":
      case "keuangan-tunggakan":
      case "keuangan-komponen":
      case "keuangan-generate":
        if (!canAccessKeuangan(session)) return renderAksesDibatasi();
        return (
          <MobileKeuangan
            initialSubTab={mobileTab}
            onBackToHome={() => handleSelectTab("home")}
          />
        );
      case "tabungan":
        return <MobileTabungan onBackToHome={() => handleSelectTab("home")} />;
      case "laporan-infak":
      case "infak":
        return <LaporanInfakAdminView />;
      case "pesan-komunikasi":
      case "pesan-admin":
      case "pesan":
        return <PesanKomunikasiAdminView />;
      case "whatsapp-gateway":
      case "whatsapp":
      case "wa-broadcast":
        return <WhatsAppGatewayView />;
      case "haid":
      case "haid-santriwati":
        return <MobileHaid />;
      case "profil":
        return (
          <MobileProfil onChangeTab={handleSelectTab} onLogout={handleLogout} />
        );
      case "test-mediapipe":
      case "mediapipe":
        return (
          <MobileMediaPipeTest onBackToHome={() => handleSelectTab("home")} />
        );
      default:
        if (isBendahara) {
          return (
            <MobileHomeKeuangan
              onChangeTab={handleSelectTab}
              onLogout={handleLogout}
            />
          );
        }
        return <MobileHome onChangeTab={handleSelectTab} />;
    }
  };

  const isFinancialTab =
    mobileTab === "syahriah" || mobileTab.startsWith("keuangan");
  const hasCustomHeader =
    isFinancialTab ||
    mobileTab === "informasi" ||
    mobileTab === "informasi-kegiatan" ||
    mobileTab === "test-mediapipe" ||
    mobileTab === "mediapipe";

  return (
    <div className="mobile-wrapper">
      <div className="mobile-app-container">
        {/* Sub-Menu Top Navigation Header (Excludes Beranda/Home and views with integrated header) */}
        {mobileTab !== "home" && !hasCustomHeader && (
          <div
            style={{
              background:
                "linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)",
              color: "#ffffff",
              padding: "15px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              borderBottomLeftRadius: "20px",
              borderBottomRightRadius: "20px",
              boxShadow: "0 8px 20px -4px rgba(6, 78, 59, 0.35)",
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
            <button
              onClick={() => handleSelectTab("home")}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#ffffff",
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={20} />
            </button>

            <span
              style={{
                fontWeight: 800,
                fontSize: "0.98rem",
                color: "#ffffff",
                textAlign: "center",
                flex: 1,
                margin: "0 12px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "0.01em",
              }}
            >
              {getSubmenuTitle()}
            </span>

            <div style={{ width: "38px" }} />
          </div>
        )}

        {/* Dynamic Mobile Content */}
        <div className="mobile-content">
          <Suspense fallback={<MobileLoadingFallback />}>
            {renderContent()}
          </Suspense>
        </div>

        {/* Mobile Menu Sheet Drawer */}
        {isMenuDrawerOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
            onClick={() => setIsMenuDrawerOpen(false)}
          >
            <div
              style={{
                background: "#ffffff",
                borderTopLeftRadius: "24px",
                borderTopRightRadius: "24px",
                padding: "20px 16px 30px",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 -10px 25px rgba(0,0,0,0.2)",
                width: "100%",
                maxWidth: "430px",
                boxSizing: "border-box",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "10px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Grid size={18} color="#059669" />
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "#0f172a",
                    }}
                  >
                    Daftar Semua Menu Mobile
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuDrawerOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    padding: "4px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Categories */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {isBendahara ? (
                  <div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "#059669",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      MENU KEUANGAN & KASIR
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "8px",
                      }}
                    >
                      <button
                        onClick={() => handleSelectTab("keuangan-kasir")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-kasir"
                              ? "#dcfce7"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-kasir"
                              ? "1px solid #059669"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <CreditCard size={16} color="#059669" /> Kasir Santri
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-rekap")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-rekap"
                              ? "#e0f2fe"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-rekap"
                              ? "1px solid #0284c7"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <BarChart3 size={16} color="#0284c7" /> Laporan Kas
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-spp")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-spp"
                              ? "#f3e8ff"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-spp"
                              ? "1px solid #7c3aed"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <FileText size={16} color="#7c3aed" /> Tagihan SPP
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-masuk")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-masuk"
                              ? "#fef3c7"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-masuk"
                              ? "1px solid #d97706"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <Building size={16} color="#d97706" /> Biaya Masuk
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-transaksi")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-transaksi"
                              ? "#cffaff"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-transaksi"
                              ? "1px solid #0891b2"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <Zap size={16} color="#0891b2" /> QRIS & VA Midtrans
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-tunggakan")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-tunggakan"
                              ? "#ffe4e6"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-tunggakan"
                              ? "1px solid #e11d48"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <ShieldAlert size={16} color="#e11d48" /> Rekap
                        Tunggakan
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-komponen")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-komponen"
                              ? "#e0e7ff"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-komponen"
                              ? "1px solid #4f46e5"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <Layers size={16} color="#4f46e5" /> Tarif Pos Biaya
                      </button>
                      <button
                        onClick={() => handleSelectTab("keuangan-generate")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "keuangan-generate"
                              ? "#ccfbf1"
                              : "#f8fafc",
                          border:
                            mobileTab === "keuangan-generate"
                              ? "1px solid #0f766e"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <RotateCw size={16} color="#0f766e" /> Generate SPP
                      </button>
                      <button
                        onClick={() => handleSelectTab("tabungan")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "tabungan" ? "#ccfbf1" : "#f8fafc",
                          border:
                            mobileTab === "tabungan"
                              ? "1px solid #0d9488"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <Wallet size={16} color="#0d9488" /> Tabungan Santri
                      </button>
                      <button
                        onClick={() => handleSelectTab("laporan-infak")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px",
                          background:
                            mobileTab === "laporan-infak" ||
                            mobileTab === "infak"
                              ? "#fce7f3"
                              : "#f8fafc",
                          border:
                            mobileTab === "laporan-infak" ||
                            mobileTab === "infak"
                              ? "1px solid #db2777"
                              : "1px solid #e2e8f0",
                          borderRadius: "10px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                        }}
                      >
                        <Heart size={16} color="#db2777" /> Infak &amp; Sedekah
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: "#059669",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        MAIN MENU
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleSelectTab("dashboard")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "dashboard" ? "#e0f2fe" : "#f8fafc",
                            border:
                              mobileTab === "dashboard"
                                ? "1px solid #0284c7"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <LayoutDashboard size={16} color="#0284c7" />{" "}
                          Dashboard
                        </button>
                        <button
                          onClick={() => handleSelectTab("berjamaah")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "berjamaah" ? "#cffafe" : "#f8fafc",
                            border:
                              mobileTab === "berjamaah"
                                ? "1px solid #0891b2"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Fingerprint size={16} color="#0891b2" /> Berjamaah
                        </button>
                        <button
                          onClick={() => handleSelectTab("mengaji")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "mengaji" ? "#dcfce7" : "#f8fafc",
                            border:
                              mobileTab === "mengaji"
                                ? "1px solid #059669"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <BookOpen size={16} color="#059669" /> Mengaji
                        </button>
                        <button
                          onClick={() => handleSelectTab("tahfidz")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "tahfidz" ? "#dcfce7" : "#f8fafc",
                            border:
                              mobileTab === "tahfidz"
                                ? "1px solid #059669"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <BookOpen size={16} color="#059669" /> Tahfidz & Kitab
                        </button>
                        <button
                          onClick={() => handleSelectTab("perizinan")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "perizinan" || mobileTab === "izin"
                                ? "#dbeafe"
                                : "#f8fafc",
                            border:
                              mobileTab === "perizinan" || mobileTab === "izin"
                                ? "1px solid #2563eb"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <DoorOpen size={16} color="#2563eb" /> Perizinan
                        </button>
                        <button
                          onClick={() => handleSelectTab("praktek-ibadah")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "praktek-ibadah" ||
                              mobileTab === "praktek"
                                ? "#d1fae5"
                                : "#f8fafc",
                            border:
                              mobileTab === "praktek-ibadah" ||
                              mobileTab === "praktek"
                                ? "1px solid #059669"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <HeartHandshake size={16} color="#059669" /> Praktek
                        </button>
                        <button
                          onClick={() => handleSelectTab("pengembangan")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "pengembangan"
                                ? "#e0f2fe"
                                : "#f8fafc",
                            border:
                              mobileTab === "pengembangan"
                                ? "1px solid #0284c7"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Award size={16} color="#0284c7" /> Pengembangan
                        </button>
                        {!String(session?.role || "")
                          .toLowerCase()
                          .includes("admin") && (
                          <button
                            onClick={() => handleSelectTab("tabungan")}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px",
                              background:
                                mobileTab === "tabungan"
                                  ? "#ccfbf1"
                                  : "#f8fafc",
                              border:
                                mobileTab === "tabungan"
                                  ? "1px solid #0d9488"
                                  : "1px solid #e2e8f0",
                              borderRadius: "10px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: "#1e293b",
                              cursor: "pointer",
                            }}
                          >
                            <Wallet size={16} color="#0d9488" /> Tabungan
                          </button>
                        )}
                        <button
                          onClick={() => handleSelectTab("pesan-komunikasi")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "pesan-komunikasi" ||
                              mobileTab === "pesan"
                                ? "#ccfbf1"
                                : "#f8fafc",
                            border:
                              mobileTab === "pesan-komunikasi" ||
                              mobileTab === "pesan"
                                ? "1px solid #0f766e"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <MessageSquare size={16} color="#0f766e" /> Pesan Wali
                        </button>
                        <button
                          onClick={() => handleSelectTab("whatsapp-gateway")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "whatsapp-gateway" ||
                              mobileTab === "whatsapp"
                                ? "#dcfce7"
                                : "#f8fafc",
                            border:
                              mobileTab === "whatsapp-gateway" ||
                              mobileTab === "whatsapp"
                                ? "1px solid #059669"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Smartphone size={16} color="#059669" /> WA Broadcast
                        </button>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: "#059669",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        DATA MASTER
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleSelectTab("master-santri")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-santri"
                                ? "#ccfbf1"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-santri"
                                ? "1px solid #0d9488"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Users size={16} color="#0d9488" /> Data Santri
                        </button>
                        <button
                          onClick={() => handleSelectTab("haid")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "haid" ? "#fdf2f8" : "#f8fafc",
                            border:
                              mobileTab === "haid"
                                ? "1px solid #db2777"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Heart size={16} color="#db2777" fill="#db2777" />{" "}
                          Haid Santri
                        </button>
                        <button
                          onClick={() => handleSelectTab("daftar-wajah")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "daftar-wajah"
                                ? "#e0f2fe"
                                : "#f8fafc",
                            border:
                              mobileTab === "daftar-wajah"
                                ? "1px solid #0284c7"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Smile size={16} color="#0284c7" /> Daftar Wajah
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-asrama")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-asrama"
                                ? "#fef3c7"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-asrama"
                                ? "1px solid #d97706"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Building size={16} color="#d97706" /> Data Asrama
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-kelas")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-kelas"
                                ? "#cffaff"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-kelas"
                                ? "1px solid #0891b2"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <GraduationCap size={16} color="#0891b2" /> Data Kelas
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-asatidz")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-asatidz"
                                ? "#f3e8ff"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-asatidz"
                                ? "1px solid #9333ea"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Users size={16} color="#9333ea" /> Data Asatidz
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-materi")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-materi"
                                ? "#ecfdf5"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-materi"
                                ? "1px solid #059669"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <BookOpen size={16} color="#059669" /> Materi & Kitab
                        </button>
                        <button
                          onClick={() => handleSelectTab("setting-shalat")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "setting-shalat" ||
                              mobileTab === "kegiatan"
                                ? "#fef3c7"
                                : "#f8fafc",
                            border:
                              mobileTab === "setting-shalat" ||
                              mobileTab === "kegiatan"
                                ? "1px solid #d97706"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Calendar size={16} color="#d97706" /> Master Kegiatan
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-device")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-device"
                                ? "#e2e8f0"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-device"
                                ? "1px solid #475569"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <HardDrive size={16} color="#475569" /> Fingerprint
                        </button>
                        <button
                          onClick={() => handleSelectTab("tata-tertib")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "tata-tertib"
                                ? "#ffe4e6"
                                : "#f8fafc",
                            border:
                              mobileTab === "tata-tertib"
                                ? "1px solid #be123c"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <ShieldAlert size={16} color="#be123c" /> Tata Tertib
                        </button>
                        <button
                          onClick={() => handleSelectTab("master-pengembangan")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "master-pengembangan" ||
                              mobileTab === "setting-pengembangan"
                                ? "#e0f2fe"
                                : "#f8fafc",
                            border:
                              mobileTab === "master-pengembangan" ||
                              mobileTab === "setting-pengembangan"
                                ? "1px solid #0284c7"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Award size={16} color="#0284c7" /> Master Pengembangan
                        </button>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: "#059669",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        LAPORAN REKAP
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleSelectTab("laporan-presensi")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "laporan-presensi"
                                ? "#ffedd5"
                                : "#f8fafc",
                            border:
                              mobileTab === "laporan-presensi"
                                ? "1px solid #ea580c"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <BarChart3 size={16} color="#ea580c" /> Rekap Absen
                        </button>
                        <button
                          onClick={() => handleSelectTab("laporan-tahfidz")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "laporan-tahfidz"
                                ? "#e0f2fe"
                                : "#f8fafc",
                            border:
                              mobileTab === "laporan-tahfidz"
                                ? "1px solid #0284c7"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <FileText size={16} color="#0284c7" /> Laporan Tahfidz
                        </button>
                        <button
                          onClick={() => handleSelectTab("laporan-berjamaah")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "laporan-berjamaah"
                                ? "#cffafe"
                                : "#f8fafc",
                            border:
                              mobileTab === "laporan-berjamaah"
                                ? "1px solid #0891b2"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <Fingerprint size={16} color="#0891b2" /> Lap. Berjamaah
                        </button>
                        <button
                          onClick={() => handleSelectTab("laporan-mengaji")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px",
                            background:
                              mobileTab === "laporan-mengaji"
                                ? "#ccfbf1"
                                : "#f8fafc",
                            border:
                              mobileTab === "laporan-mengaji"
                                ? "1px solid #0f766e"
                                : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <BookOpen size={16} color="#0f766e" /> Lap. Mengaji
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "14px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <a
                    href={
                      typeof window !== "undefined" &&
                      window.location.hostname.includes("ruangtech.com")
                        ? "https://nurulwafa.ruangtech.com"
                        : typeof window !== "undefined" &&
                            window.location.hostname.includes("aspartech.com")
                          ? "https://pesantren.aspartech.com"
                          : "#dashboard"
                    }
                    target={
                      typeof window !== "undefined" &&
                      (window.location.hostname.includes("ruangtech.com") ||
                        window.location.hostname.includes("aspartech.com"))
                        ? "_blank"
                        : "_self"
                    }
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      background: "linear-gradient(135deg, #0f172a, #1e293b)",
                      color: "#ffffff",
                      borderRadius: "10px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                    }}
                  >
                    🖥️ Buka Portal Desktop (Admin)
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Elevated Floating White Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav">
          <button
            className={`mobile-nav-item ${mobileTab === "home" ? "active" : ""}`}
            onClick={() => handleSelectTab("home")}
          >
            <div
              className={`nav-icon-wrapper ${mobileTab === "home" ? "active" : ""}`}
            >
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {isBendahara ? (
            <>
              <button
                className={`mobile-nav-item ${mobileTab === "keuangan-spp" || mobileTab === "keuangan-masuk" ? "active" : ""}`}
                onClick={() => handleSelectTab("keuangan-spp")}
              >
                <div
                  className={`nav-icon-wrapper ${mobileTab === "keuangan-spp" || mobileTab === "keuangan-masuk" ? "active" : ""}`}
                >
                  <FileText size={20} />
                </div>
                <span>SPP</span>
              </button>

              {/* Center Floating Action Button: Loket Kasir Bayar */}
              <button
                className="mobile-fab-center"
                onClick={() => handleSelectTab("keuangan-kasir")}
                title="Buka Loket Kasir Pembayaran"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                }}
              >
                <div
                  className="fab-inner-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                    boxShadow:
                      "0 10px 24px -2px rgba(5, 150, 105, 0.6), 0 0 16px rgba(16, 185, 129, 0.5)",
                    border: "4px solid #ffffff",
                  }}
                >
                  <CreditCard size={26} color="#ffffff" strokeWidth={2.4} />
                </div>
              </button>

              <button
                className={`mobile-nav-item ${mobileTab === "keuangan-rekap" || mobileTab === "keuangan-transaksi" || mobileTab === "keuangan-tunggakan" ? "active" : ""}`}
                onClick={() => handleSelectTab("keuangan-rekap")}
              >
                <div
                  className={`nav-icon-wrapper ${mobileTab === "keuangan-rekap" || mobileTab === "keuangan-transaksi" || mobileTab === "keuangan-tunggakan" ? "active" : ""}`}
                >
                  <BarChart3 size={20} />
                </div>
                <span>Laporan</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`mobile-nav-item ${mobileTab === "perizinan" || mobileTab === "izin" ? "active" : ""}`}
                onClick={() => handleSelectTab("perizinan")}
              >
                <div
                  className={`nav-icon-wrapper ${mobileTab === "perizinan" || mobileTab === "izin" ? "active" : ""}`}
                >
                  <DoorOpen size={20} />
                </div>
                <span>Izin</span>
              </button>

              {/* Prominent Center Floating Fingerprint Action Button */}
              <button
                className="mobile-fab-center"
                onClick={() => handleSelectTab("berjamaah")}
                title="Presensi Shalat Berjamaah"
              >
                <div className="fab-inner-glow">
                  <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
                </div>
              </button>

              <button
                className={`mobile-nav-item ${mobileTab === "daftar-wajah" || mobileTab === "wajah" ? "active" : ""}`}
                onClick={() => handleSelectTab("daftar-wajah")}
              >
                <div
                  className={`nav-icon-wrapper ${mobileTab === "daftar-wajah" || mobileTab === "wajah" ? "active" : ""}`}
                >
                  <Smile size={20} />
                </div>
                <span>Wajah AI</span>
              </button>
            </>
          )}

          <button
            className={`mobile-nav-item ${mobileTab === "profil" ? "active" : ""}`}
            onClick={() => handleSelectTab("profil")}
          >
            <div
              className={`nav-icon-wrapper ${mobileTab === "profil" ? "active" : ""}`}
            >
              <User size={20} />
            </div>
            <span>Profil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
