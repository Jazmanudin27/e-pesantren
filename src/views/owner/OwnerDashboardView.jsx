import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CreditCard,
  Users,
  BookOpen,
  DoorOpen,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  RotateCw,
  LogOut,
  Wallet,
  TrendingUp,
  AlertCircle,
  Building,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  PieChart,
  ArrowUpRight,
  HeartHandshake
} from "lucide-react";
import { showConfirm, toastSuccess } from "../../utils/alert.util";
import OwnerLaporanKeuangan from "./OwnerLaporanKeuangan";
import OwnerLaporanPresensi from "./OwnerLaporanPresensi";
import OwnerLaporanTahfidz from "./OwnerLaporanTahfidz";
import OwnerLaporanPerizinan from "./OwnerLaporanPerizinan";
import OwnerLaporanSantri from "./OwnerLaporanSantri";

export default function OwnerDashboardView({ onLogout }) {
  // Active Tab Menu: 'keuangan' | 'presensi' | 'tahfidz' | 'perizinan' | 'santri'
  const [activeTab, setActiveTab] = useState("keuangan");
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Executive Top Summary KPIs
  const [summary, setSummary] = useState({
    totalSantri: 0,
    santriPutra: 0,
    santriPutri: 0,
    avgJuz: "0.0",
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

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari Halaman Laporan Eksekutif Owner?",
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

  const handlePrint = () => {
    window.print();
  };

  const todayStrFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Calculate financial collection rate percentage
  const totalFinancialObligation = (summary.totalKasMasuk || 0) + (summary.totalPiutang || 0);
  const collectionRate = totalFinancialObligation > 0 
    ? Math.round(((summary.totalKasMasuk || 0) / totalFinancialObligation) * 100) 
    : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        backgroundImage: "radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.08) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(139, 92, 246, 0.06) 0px, transparent 50%)",
        color: "#f1f5f9",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 1. TOP EXECUTIVE HEADER WITH GLASSMORPHISM */}
      <header
        style={{
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(51, 65, 85, 0.7)",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 8px 32px -4px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              position: "relative",
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px -3px rgba(16, 185, 129, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.25)"
            }}
          >
            <BarChart3 size={24} color="#ffffff" />
            <span
              style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #0f172a",
                boxShadow: "0 0 10px #22c55e"
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.025em" }}>
                PORTAL EKSEKUTIF OWNER
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.25) 100%)",
                  border: "1px solid rgba(250, 204, 21, 0.4)",
                  padding: "3px 10px",
                  borderRadius: "999px",
                  color: "#fde047",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.03em"
                }}
              >
                <Award size={12} color="#facc15" />
                <span>DEWAN PEMBINA &amp; YAYASAN</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px", fontSize: "0.76rem", color: "#94a3b8" }}>
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>NURUL WAFA BOARDING SCHOOL</span>
              <span>•</span>
              <span>{todayStrFormatted}</span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#10b981", fontWeight: 700 }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Live Sync
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchSummary}
            title="Refresh Seluruh Data"
            style={{
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(71, 85, 105, 0.6)",
              color: "#e2e8f0",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              transition: "all 0.2s"
            }}
          >
            <RotateCw size={13} className={loadingSummary ? "animate-spin" : ""} color="#38bdf8" />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handlePrint}
            title="Cetak Laporan / Export PDF"
            style={{
              background: "linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.15)"
            }}
          >
            <Printer size={14} color="#38bdf8" />
            <span>Cetak Dokumen</span>
          </button>

          <button
            onClick={handleLogout}
            title="Keluar dari Portal"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#f87171",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main style={{ flex: 1, padding: "24px 28px 48px", maxWidth: "1640px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* BANNER EKSEKUTIF DENGAN KALIGRAFI ISLAMI & HIGHLIGHT */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(15, 23, 42, 0.7) 50%, rgba(2, 132, 199, 0.16) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "20px",
            padding: "20px 24px",
            marginBottom: "22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.1rem", color: "#facc15", fontFamily: "'Amiri', 'Traditional Arabic', serif", fontWeight: 700 }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span style={{ background: "rgba(255, 255, 255, 0.1)", padding: "2px 8px", borderRadius: "6px", fontSize: "0.68rem", color: "#e2e8f0", fontWeight: 700 }}>
                Tahun Ajaran 2026 / 2027
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#ffffff" }}>
              Ringkasan Kinerja &amp; Laporan Eksekutif Pesantren
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#94a3b8", maxWidth: "620px" }}>
              Pantau arus kas SPP, piutang tagihan, tingkat kehadiran shalat &amp; mengaji, serta progres hafalan Quran santri dalam satu pintu terpadu khusus Yayasan.
            </p>
          </div>

          {/* Quick Metrics Badge Strip */}
          <div style={{ display: "flex", gap: "12px", zIndex: 2, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(51, 65, 85, 0.7)", borderRadius: "14px", padding: "10px 16px", minWidth: "120px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8" }}>KOLEKTIBILITAS KAS</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
                {collectionRate}%
              </div>
              <div style={{ fontSize: "0.64rem", color: "#64748b" }}>SPP Terbayar</div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(51, 65, 85, 0.7)", borderRadius: "14px", padding: "10px 16px", minWidth: "120px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8" }}>KEHADIRAN HARI INI</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
                {summary.presensiHariIni?.persenHadir || 0}%
              </div>
              <div style={{ fontSize: "0.64rem", color: "#64748b" }}>Shalat &amp; Mengaji</div>
            </div>

            <div style={{ background: "rgba(15, 23, 42, 0.75)", border: "1px solid rgba(51, 65, 85, 0.7)", borderRadius: "14px", padding: "10px 16px", minWidth: "120px" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8" }}>SANTRI AKTIF IZIN</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#f59e0b", marginTop: "2px" }}>
                {summary.totalIzinAktif} Santri
              </div>
              <div style={{ fontSize: "0.64rem", color: "#64748b" }}>Di Luar Asrama</div>
            </div>
          </div>
        </div>

        {/* 4 HERO KPI CARDS WITH MODERN CARD DESIGN */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          
          {/* Card 1: Pemasukan Kas & SPP */}
          <div
            style={{
              background: "linear-gradient(145deg, #0f1f1a 0%, #0d2822 50%, #0a1b17 100%)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  TOTAL PEMASUKAN KAS &amp; SPP
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "8px", letterSpacing: "-0.02em" }}>
                  Rp {Number(summary.totalKasMasuk || 0).toLocaleString("id-ID")}
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)"
                }}
              >
                <TrendingUp size={22} color="#ffffff" />
              </div>
            </div>
            
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(16, 185, 129, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#a7f3d0" }}>
              <span>Infak Masuk: <strong>Rp {Number(summary.totalInfak || 0).toLocaleString("id-ID")}</strong></span>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", padding: "2px 7px", borderRadius: "999px", fontWeight: 800 }}>
                Resmi
              </span>
            </div>
          </div>

          {/* Card 2: Piutang / Tunggakan SPP */}
          <div
            style={{
              background: "linear-gradient(145deg, #241217 0%, #2e151c 50%, #1a0b10 100%)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(244, 63, 94, 0.35)",
              boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  TOTAL PIUTANG / TUNGGAKAN
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "8px", letterSpacing: "-0.02em" }}>
                  Rp {Number(summary.totalPiutang || 0).toLocaleString("id-ID")}
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(244, 63, 94, 0.4)"
                }}
              >
                <AlertCircle size={22} color="#ffffff" />
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(244, 63, 94, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#fecdd3" }}>
              <span>Tagihan Belum Lunas</span>
              <span style={{ background: "rgba(244, 63, 94, 0.2)", padding: "2px 7px", borderRadius: "999px", fontWeight: 800 }}>
                Perlu Follow Up
              </span>
            </div>
          </div>

          {/* Card 3: Santri Aktif & Demografi */}
          <div
            style={{
              background: "linear-gradient(145deg, #0e1e2c 0%, #11283c 50%, #0a1520 100%)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              boxShadow: "0 10px 25px -5px rgba(56, 189, 248, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  SANTRI TERDAFTAR AKTIF
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "8px", letterSpacing: "-0.02em" }}>
                  {summary.totalSantri} <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>Santri</span>
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(2, 132, 199, 0.4)"
                }}
              >
                <Users size={22} color="#ffffff" />
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(56, 189, 248, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#bae6fd" }}>
              <span>Putra: <strong>{summary.santriPutra}</strong> • Putri: <strong>{summary.santriPutri}</strong></span>
              <span style={{ color: "#facc15", fontWeight: 700 }}>
                Izin: {summary.totalIzinAktif}
              </span>
            </div>
          </div>

          {/* Card 4: Presensi & Capaian Tahfidz */}
          <div
            style={{
              background: "linear-gradient(145deg, #1e1329 0%, #2a183d 50%, #150b1f 100%)",
              borderRadius: "20px",
              padding: "20px",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.15)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  KEHADIRAN &amp; CAPAIAN TAHFIDZ
                </span>
                <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "8px", letterSpacing: "-0.02em" }}>
                  {summary.presensiHariIni?.persenHadir || 0}% <span style={{ fontSize: "0.9rem", color: "#34d399", fontWeight: 600 }}>Hadir</span>
                </div>
              </div>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 16px rgba(139, 92, 246, 0.4)"
                }}
              >
                <Clock size={22} color="#ffffff" />
              </div>
            </div>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(168, 85, 247, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "#e9d5ff" }}>
              <span>Rata-Rata Juz: <strong style={{ color: "#38bdf8" }}>{summary.avgJuz} Juz</strong></span>
              <span style={{ background: "rgba(168, 85, 247, 0.2)", padding: "2px 7px", borderRadius: "999px", fontWeight: 800 }}>
                Tahfidz
              </span>
            </div>
          </div>
        </div>

        {/* 3. SEGMENTED EXECUTIVE TAB NAVIGATION (HIGH-END MODERN PILLS) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            padding: "6px",
            borderRadius: "18px",
            border: "1px solid rgba(51, 65, 85, 0.8)",
            marginBottom: "22px",
            boxShadow: "0 6px 20px -2px rgba(0, 0, 0, 0.35)",
            overflowX: "auto"
          }}
        >
          {/* Tab 1: Keuangan */}
          <button
            onClick={() => setActiveTab("keuangan")}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "14px",
              border: activeTab === "keuangan" ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid transparent",
              background: activeTab === "keuangan" 
                ? "linear-gradient(135deg, rgba(2, 132, 199, 0.3) 0%, rgba(14, 165, 233, 0.15) 100%)" 
                : "transparent",
              color: activeTab === "keuangan" ? "#38bdf8" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "keuangan" ? "0 4px 15px rgba(2, 132, 199, 0.2)" : "none",
              whiteSpace: "nowrap"
            }}
          >
            <CreditCard size={17} color={activeTab === "keuangan" ? "#38bdf8" : "#94a3b8"} />
            <span>Laporan Keuangan &amp; SPP</span>
          </button>

          {/* Tab 2: Presensi */}
          <button
            onClick={() => setActiveTab("presensi")}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "14px",
              border: activeTab === "presensi" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid transparent",
              background: activeTab === "presensi" 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.15) 100%)" 
                : "transparent",
              color: activeTab === "presensi" ? "#34d399" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "presensi" ? "0 4px 15px rgba(16, 185, 129, 0.2)" : "none",
              whiteSpace: "nowrap"
            }}
          >
            <Clock size={17} color={activeTab === "presensi" ? "#34d399" : "#94a3b8"} />
            <span>Laporan Presensi Shalat &amp; Ngaji</span>
          </button>

          {/* Tab 3: Tahfidz */}
          <button
            onClick={() => setActiveTab("tahfidz")}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "14px",
              border: activeTab === "tahfidz" ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid transparent",
              background: activeTab === "tahfidz" 
                ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.15) 100%)" 
                : "transparent",
              color: activeTab === "tahfidz" ? "#c084fc" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "tahfidz" ? "0 4px 15px rgba(168, 85, 247, 0.2)" : "none",
              whiteSpace: "nowrap"
            }}
          >
            <BookOpen size={17} color={activeTab === "tahfidz" ? "#c084fc" : "#94a3b8"} />
            <span>Laporan Tahfidz Qur'an</span>
          </button>

          {/* Tab 4: Perizinan */}
          <button
            onClick={() => setActiveTab("perizinan")}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "14px",
              border: activeTab === "perizinan" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
              background: activeTab === "perizinan" 
                ? "linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.15) 100%)" 
                : "transparent",
              color: activeTab === "perizinan" ? "#fcd34d" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "perizinan" ? "0 4px 15px rgba(245, 158, 11, 0.2)" : "none",
              whiteSpace: "nowrap"
            }}
          >
            <DoorOpen size={17} color={activeTab === "perizinan" ? "#fcd34d" : "#94a3b8"} />
            <span>Laporan Perizinan Santri</span>
          </button>

          {/* Tab 5: Demografi Santri */}
          <button
            onClick={() => setActiveTab("santri")}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "14px",
              border: activeTab === "santri" ? "1px solid rgba(236, 72, 153, 0.4)" : "1px solid transparent",
              background: activeTab === "santri" 
                ? "linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.15) 100%)" 
                : "transparent",
              color: activeTab === "santri" ? "#f472b6" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.84rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              transition: "all 0.2s ease",
              boxShadow: activeTab === "santri" ? "0 4px 15px rgba(236, 72, 153, 0.2)" : "none",
              whiteSpace: "nowrap"
            }}
          >
            <Building size={17} color={activeTab === "santri" ? "#f472b6" : "#94a3b8"} />
            <span>Demografi &amp; Rombel</span>
          </button>
        </div>

        {/* 4. RENDER DEDICATED SEPARATE VIEW COMPONENT */}
        <div style={{ animation: "fadeIn 0.25s ease-in-out" }}>
          {activeTab === "keuangan" && <OwnerLaporanKeuangan />}
          {activeTab === "presensi" && <OwnerLaporanPresensi />}
          {activeTab === "tahfidz" && <OwnerLaporanTahfidz />}
          {activeTab === "perizinan" && <OwnerLaporanPerizinan />}
          {activeTab === "santri" && <OwnerLaporanSantri />}
        </div>
      </main>
    </div>
  );
}
