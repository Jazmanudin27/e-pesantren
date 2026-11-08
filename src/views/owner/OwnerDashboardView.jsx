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
      persenHadir: 0,
    },
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
      "Batal",
    );
    if (confirmed) {
      localStorage.removeItem("token");
      localStorage.removeItem("desktop_session");
      sessionStorage.removeItem("desktop_session");
      if (onLogout) {
        onLogout();
      } else {
        window.location.hash = "";
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
    year: "numeric",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b132b",
        color: "#e2e8f0",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 1. TOP EXECUTIVE HEADER */}
      <header
        style={{
          background: "linear-gradient(90deg, #0f172a 0%, #1e293b 100%)",
          borderBottom: "1px solid #334155",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
            }}
          >
            <BarChart3 size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.12rem",
                  fontWeight: 900,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                }}
              >
                PORTAL EKSEKUTIF OWNER
              </h1>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  border: "1px solid #10b981",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                Laporan Saja (Read-Only)
              </span>
            </div>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "0.74rem",
                color: "#94a3b8",
              }}
            >
              NURUL WAFA BOARDING SCHOOL • {todayStrFormatted}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchSummary}
            title="Refresh Seluruh Data"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              padding: "7px 12px",
              borderRadius: "9px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RotateCw
              size={13}
              className={loadingSummary ? "animate-spin" : ""}
            />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handlePrint}
            title="Cetak / Export PDF"
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#38bdf8",
              padding: "7px 12px",
              borderRadius: "9px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Printer size={13} />
            <span>Cetak Laporan</span>
          </button>

          <button
            onClick={handleLogout}
            title="Keluar"
            style={{
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#f43f5e",
              padding: "7px 12px",
              borderRadius: "9px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main
        style={{
          flex: 1,
          padding: "20px 24px 40px",
          maxWidth: "1600px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top 4 KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          {/* Card 1: Pemasukan Kas & SPP */}
          <div
            style={{
              background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "18px",
              border: "1px solid #334155",
              position: "relative",
              overflow: "hidden",
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
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#10b981",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  TOTAL PEMASUKAN KAS &amp; SPP
                </span>
                <div
                  style={{
                    fontSize: "1.55rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginTop: "6px",
                  }}
                >
                  Rp{" "}
                  {Number(summary.totalKasMasuk || 0).toLocaleString("id-ID")}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} color="#10b981" />
              </div>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              Infak Masuk:{" "}
              <strong style={{ color: "#ec4899" }}>
                Rp {Number(summary.totalInfak || 0).toLocaleString("id-ID")}
              </strong>
            </div>
          </div>

          {/* Card 2: Piutang / Tunggakan */}
          <div
            style={{
              background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "18px",
              border: "1px solid #334155",
              position: "relative",
              overflow: "hidden",
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
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#f43f5e",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  PIUTANG / TUNGGAKAN SPP
                </span>
                <div
                  style={{
                    fontSize: "1.55rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginTop: "6px",
                  }}
                >
                  Rp {Number(summary.totalPiutang || 0).toLocaleString("id-ID")}
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(244, 63, 94, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={20} color="#f43f5e" />
              </div>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              Tagihan belum lunas dari seluruh santri
            </div>
          </div>

          {/* Card 3: Santri Aktif & Izin */}
          <div
            style={{
              background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "18px",
              border: "1px solid #334155",
              position: "relative",
              overflow: "hidden",
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
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#38bdf8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  TOTAL SANTRI AKTIF
                </span>
                <div
                  style={{
                    fontSize: "1.55rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginTop: "6px",
                  }}
                >
                  {summary.totalSantri}{" "}
                  <span
                    style={{
                      fontSize: "0.86rem",
                      color: "#94a3b8",
                      fontWeight: 500,
                    }}
                  >
                    Santri
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(56, 189, 248, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} color="#38bdf8" />
              </div>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              Putra: <strong>{summary.santriPutra}</strong> • Putri:{" "}
              <strong>{summary.santriPutri}</strong> • Izin:{" "}
              <strong style={{ color: "#f59e0b" }}>
                {summary.totalIzinAktif}
              </strong>
            </div>
          </div>

          {/* Card 4: Tingkat Kehadiran Presensi */}
          <div
            style={{
              background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
              borderRadius: "16px",
              padding: "18px",
              border: "1px solid #334155",
              position: "relative",
              overflow: "hidden",
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
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#a855f7",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  PRESENSI SHALAT &amp; MENGAJI
                </span>
                <div
                  style={{
                    fontSize: "1.55rem",
                    fontWeight: 900,
                    color: "#ffffff",
                    marginTop: "6px",
                  }}
                >
                  {summary.presensiHariIni?.persenHadir || 0}%{" "}
                  <span
                    style={{
                      fontSize: "0.86rem",
                      color: "#10b981",
                      fontWeight: 600,
                    }}
                  >
                    Hadir
                  </span>
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "rgba(168, 85, 247, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={20} color="#a855f7" />
              </div>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              Rata-rata Hafalan:{" "}
              <strong style={{ color: "#38bdf8" }}>{summary.avgJuz} Juz</strong>
            </div>
          </div>
        </div>

        {/* 3. MENU NAVIGATION TABS (5 SEPARATE MENUS) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "#1e293b",
            padding: "6px",
            borderRadius: "14px",
            border: "1px solid #334155",
            marginBottom: "18px",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("keuangan")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "keuangan" ? "#0f172a" : "transparent",
              color: activeTab === "keuangan" ? "#38bdf8" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                activeTab === "keuangan" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              borderBottom:
                activeTab === "keuangan" ? "2px solid #38bdf8" : "none",
            }}
          >
            <CreditCard size={15} />
            <span>Laporan Keuangan</span>
          </button>

          <button
            onClick={() => setActiveTab("presensi")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "presensi" ? "#0f172a" : "transparent",
              color: activeTab === "presensi" ? "#10b981" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                activeTab === "presensi" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              borderBottom:
                activeTab === "presensi" ? "2px solid #10b981" : "none",
            }}
          >
            <Clock size={15} />
            <span>Laporan Presensi</span>
          </button>

          <button
            onClick={() => setActiveTab("tahfidz")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "tahfidz" ? "#0f172a" : "transparent",
              color: activeTab === "tahfidz" ? "#a855f7" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                activeTab === "tahfidz" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              borderBottom:
                activeTab === "tahfidz" ? "2px solid #a855f7" : "none",
            }}
          >
            <BookOpen size={15} />
            <span>Laporan Tahfidz</span>
          </button>

          <button
            onClick={() => setActiveTab("perizinan")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "perizinan" ? "#0f172a" : "transparent",
              color: activeTab === "perizinan" ? "#f59e0b" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                activeTab === "perizinan"
                  ? "0 2px 8px rgba(0,0,0,0.3)"
                  : "none",
              borderBottom:
                activeTab === "perizinan" ? "2px solid #f59e0b" : "none",
            }}
          >
            <DoorOpen size={15} />
            <span>Laporan Perizinan</span>
          </button>

          <button
            onClick={() => setActiveTab("santri")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "santri" ? "#0f172a" : "transparent",
              color: activeTab === "santri" ? "#38bdf8" : "#94a3b8",
              fontWeight: 800,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                activeTab === "santri" ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
              borderBottom:
                activeTab === "santri" ? "2px solid #38bdf8" : "none",
            }}
          >
            <Building size={15} />
            <span>Demografi &amp; Rombel</span>
          </button>
        </div>

        {/* 4. RENDER DEDICATED SEPARATE VIEW COMPONENT */}
        <div>
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
