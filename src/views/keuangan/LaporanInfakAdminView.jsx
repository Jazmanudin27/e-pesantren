import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Heart,
  Search,
  Filter,
  Plus,
  RotateCw,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  TrendingUp,
  X,
  ArrowLeft,
  ChevronRight,
  User,
  MessageSquareQuote,
  Target,
  Users,
} from "lucide-react";
import { toastSuccess, toastError, showConfirm } from "../../utils/alert.util";

export default function LaporanInfakAdminView({ onBackToHome }) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_terkumpul: 0,
    total_transaksi_berhasil: 0,
    total_transaksi_pending: 0,
  });
  const [programs, setPrograms] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);

  // Sub-tab: 'program' | 'transaksi'
  const [activeTab, setActiveTab] = useState("program");

  // Filters
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // Modal Tambah Program
  const [isModalProgramOpen, setIsModalProgramOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    kode_program: "",
    nama_program: "",
    kategori: "Infak Pesantren",
    deskripsi: "",
    target_dana: "50.000.000",
  });
  const [submittingProgram, setSubmittingProgram] = useState(false);

  // Modal Detail Transaksi
  const [selectedTrx, setSelectedTrx] = useState(null);

  // Modal Input Infak (Bagian Keuangan)
  const [isInputInfakOpen, setIsInputInfakOpen] = useState(false);
  const [submittingInfak, setSubmittingInfak] = useState(false);
  const [infakForm, setInfakForm] = useState({
    program_id: "",
    nama_program: "",
    nama_donatur: "",
    is_anonim: false,
    nominal: "",
    metode_pembayaran: "Tunai",
    tanggal_transaksi: new Date().toISOString().slice(0, 10),
    doa_pesan: "",
  });

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString("id-ID")}`;

  const formatRibuanInput = (rawVal) => {
    const digits = String(rawVal || "").replace(/\D/g, "");
    if (!digits) return "";
    return Number(digits).toLocaleString("id-ID");
  };

  const parseRibuanInput = (val) => {
    const digits = String(val || "").replace(/\D/g, "");
    return digits ? Number(digits) : 0;
  };

  const handleOpenInputInfak = (preselectedProg = null) => {
    const defaultProg = preselectedProg || programs[0] || null;
    setInfakForm({
      program_id: defaultProg?.id ? String(defaultProg.id) : "",
      nama_program: defaultProg?.nama_program || "Infak Umum Pesantren",
      nama_donatur: "",
      is_anonim: false,
      nominal: "",
      metode_pembayaran: "Tunai",
      tanggal_transaksi: new Date().toISOString().slice(0, 10),
      doa_pesan: "",
    });
    setIsInputInfakOpen(true);
  };

  const handleSubmitInputInfak = async (e) => {
    e.preventDefault();
    const nom = parseRibuanInput(infakForm.nominal);
    if (!nom || nom <= 0) {
      toastError("Masukkan nominal infak yang valid!");
      return;
    }

    const selectedProgObj = programs.find(
      (p) => String(p.id) === String(infakForm.program_id),
    );
    const finalNamaProgram =
      selectedProgObj?.nama_program ||
      infakForm.nama_program ||
      "Infak Umum Pesantren";

    try {
      setSubmittingInfak(true);
      const res = await axios.post("/api/infak/input-admin", {
        program_id: selectedProgObj?.id || null,
        nama_program: finalNamaProgram,
        nama_donatur: infakForm.is_anonim
          ? "Hamba Allah"
          : infakForm.nama_donatur.trim() || "Hamba Allah",
        is_anonim: infakForm.is_anonim,
        nominal: nom,
        metode_pembayaran: infakForm.metode_pembayaran,
        tanggal_transaksi: infakForm.tanggal_transaksi,
        doa_pesan: infakForm.doa_pesan,
      });

      if (res.data?.success) {
        toastSuccess(
          `Berhasil mencatat infak ${formatRp(nom)} ke "${finalNamaProgram}"`,
        );
        setIsInputInfakOpen(false);
        fetchLaporan();
      } else {
        toastError(res.data?.message || "Gagal mencatat infak");
      }
    } catch (err) {
      toastError(
        err.response?.data?.message || err.message || "Gagal mencatat infak",
      );
    } finally {
      setSubmittingInfak(false);
    }
  };

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterProgram !== "Semua") params.program_id = filterProgram;
      if (filterStatus !== "Semua") params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await axios.get("/api/infak/laporan", { params });
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data.summary || {});
        setPrograms(res.data.data.programs || []);
        setTransaksiList(res.data.data.transaksi || []);
      }
    } catch (err) {
      console.warn("Gagal memuat laporan infak:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [filterProgram, filterStatus]);

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!programForm.nama_program.trim()) {
      toastError("Nama program infak wajib diisi!");
      return;
    }

    try {
      setSubmittingProgram(true);
      const res = await axios.post("/api/infak/program", {
        ...programForm,
        target_dana: parseRibuanInput(programForm.target_dana) || 0,
      });
      if (res.data?.success) {
        toastSuccess("Program infak baru berhasil ditambahkan.");
        setIsModalProgramOpen(false);
        setProgramForm({
          kode_program: "",
          nama_program: "",
          kategori: "Infak Pesantren",
          deskripsi: "",
          target_dana: "50.000.000",
        });
        fetchLaporan();
      } else {
        toastError(res.data?.message || "Gagal menyimpan program.");
      }
    } catch (err) {
      toastError(
        err.response?.data?.message || err.message || "Terjadi kesalahan.",
      );
    } finally {
      setSubmittingProgram(false);
    }
  };

  const handleDeleteTransaksi = async (id, kode) => {
    const ok = await showConfirm(
      "Hapus Catatan Infak?",
      `Hapus pencatatan transaksi ${kode}? Tindakan ini tidak dapat dibatalkan.`,
      "Ya, Hapus",
      "Batal",
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/infak/transaksi/${id}`);
      if (res.data?.success) {
        toastSuccess("Pencatatan transaksi infak berhasil dihapus.");
        if (selectedTrx?.id === id) setSelectedTrx(null);
        fetchLaporan();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus transaksi.");
    }
  };

  // Filter list transaksi berdasarkan search input
  const filteredTransaksi = React.useMemo(() => {
    if (!search.trim()) return transaksiList;
    const q = search.toLowerCase().trim();
    return (transaksiList || []).filter((t) => {
      return (
        (t.nama_donatur || "").toLowerCase().includes(q) ||
        (t.nama_santri || "").toLowerCase().includes(q) ||
        (t.nama_program || "").toLowerCase().includes(q) ||
        (t.kode_transaksi || "").toLowerCase().includes(q) ||
        (t.doa_pesan || "").toLowerCase().includes(q)
      );
    });
  }, [transaksiList, search]);

  // Filter programs berdasarkan search input
  const filteredPrograms = React.useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.toLowerCase().trim();
    return (programs || []).filter((p) => {
      return (
        (p.nama_program || "").toLowerCase().includes(q) ||
        (p.kategori || "").toLowerCase().includes(q) ||
        (p.deskripsi || "").toLowerCase().includes(q)
      );
    });
  }, [programs, search]);

  return (
    <div
      style={{
        paddingBottom: "90px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* 1. HERO SUMMARY CARD (PERSIS BUKU KAS: 1 CARD UTAMA TANPA NESTED CARD) */}
      <div style={{ padding: "0 14px" }}>
        <div
          style={{
            background:
              "linear-gradient(135deg, #065f46 0%, #047857 55%, #0d9488 100%)",
            borderRadius: "22px",
            padding: "18px",
            color: "#ffffff",
            boxShadow: "0 12px 26px -8px rgba(4, 120, 87, 0.38)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-25px",
              top: "-25px",
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              pointerEvents: "none",
            }}
          />

          {/* Header Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{ fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 700 }}
            >
              Total Donasi Infak &amp; Sedekah Masuk
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={fetchLaporan}
                style={{
                  background: "rgba(255, 255, 255, 0.16)",
                  border: "none",
                  color: "#ffffff",
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title="Refresh Data"
              >
                <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Saldo Nominal Besar */}
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: 900,
              letterSpacing: "-0.6px",
              marginTop: "2px",
            }}
          >
            {formatRp(summary.total_terkumpul)}
          </div>

          {/* 2 Mini Summary Pills: Donasi Berhasil vs Donasi Pending */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={15} color="#a7f3d0" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.6rem", color: "#d1fae5" }}>
                  Donasi Terverifikasi
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {summary.total_transaksi_berhasil || 0} Donatur
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(254, 240, 138, 0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Clock size={15} color="#fef08a" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.6rem", color: "#fef08a" }}>
                  Sesi Pending
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    color: "#fef9c3",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {summary.total_transaksi_pending || 0} Sesi
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR & SEGMENTED TABS */}
      <div style={{ padding: "14px 14px 6px" }}>
        {/* Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#ffffff",
            borderRadius: "11px",
            padding: "0 10px",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
            border: "1px solid #e2e8f0",
            marginBottom: "10px",
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari program, donatur, santri, kode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 8px",
              border: "none",
              outline: "none",
              fontSize: "0.76rem",
              color: "#1e293b",
              background: "transparent",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Segmented Tab Switcher (Program vs Riwayat) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5px",
            background: "#e2e8f0",
            padding: "3px",
            borderRadius: "11px",
            marginBottom: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("program")}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "program" ? "#ffffff" : "transparent",
              color: activeTab === "program" ? "#065f46" : "#64748b",
              fontWeight: 800,
              fontSize: "0.72rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow:
                activeTab === "program" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles
              size={13}
              color={activeTab === "program" ? "#059669" : "#64748b"}
            />
            <span>Program Infak</span>
            <span
              style={{
                fontSize: "0.58rem",
                padding: "1px 5px",
                borderRadius: "6px",
                background:
                  activeTab === "program"
                    ? "#ecfdf5"
                    : "rgba(100, 116, 139, 0.12)",
                color: activeTab === "program" ? "#059669" : "#64748b",
                fontWeight: 800,
              }}
            >
              {programs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transaksi")}
            style={{
              padding: "6px 10px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "transaksi" ? "#ffffff" : "transparent",
              color: activeTab === "transaksi" ? "#065f46" : "#64748b",
              fontWeight: 800,
              fontSize: "0.72rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow:
                activeTab === "transaksi"
                  ? "0 1px 4px rgba(0,0,0,0.08)"
                  : "none",
              transition: "all 0.15s ease",
            }}
          >
            <Heart
              size={13}
              color={activeTab === "transaksi" ? "#059669" : "#64748b"}
            />
            <span>Riwayat Donasi</span>
            <span
              style={{
                fontSize: "0.58rem",
                padding: "1px 5px",
                borderRadius: "6px",
                background:
                  activeTab === "transaksi"
                    ? "#ecfdf5"
                    : "rgba(100, 116, 139, 0.12)",
                color: activeTab === "transaksi" ? "#059669" : "#64748b",
                fontWeight: 800,
              }}
            >
              {transaksiList.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. BODY CONTENT SESUAI TAB */}
      <div style={{ padding: "0 14px" }}>
        {/* ================= TAB 1: DAFTAR PROGRAM INFAK ================= */}
        {activeTab === "program" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {filteredPrograms.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "36px 20px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Heart
                  size={36}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 8px", display: "block" }}
                />
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: "#1e293b",
                  }}
                >
                  Belum Ada Program Infak
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "4px",
                    marginBottom: "14px",
                  }}
                >
                  Buat wadah program baru untuk penggalangan dana sukarela.
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalProgramOpen(true)}
                  style={{
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  + Tambah Program
                </button>
              </div>
            ) : (
              filteredPrograms.map((p) => {
                const pct =
                  p.target_dana > 0
                    ? Math.min(
                        100,
                        Math.round((p.terkumpul / p.target_dana) * 100),
                      )
                    : 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "12px 14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                      position: "relative",
                      overflow: "hidden",
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
                          fontSize: "0.58rem",
                          fontWeight: 800,
                          color: "#047857",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {p.kategori || "Infak Pesantren"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.64rem",
                          color: "#64748b",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Users size={11} color="#059669" />
                        <span>{p.jumlah_donatur || 0} Donatur</span>
                      </span>
                    </div>

                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "0.86rem",
                        color: "#0f172a",
                        lineHeight: 1.25,
                        marginBottom: "4px",
                      }}
                    >
                      {p.nama_program}
                    </div>

                    {p.deskripsi && (
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          lineHeight: 1.3,
                          marginBottom: "8px",
                        }}
                      >
                        {p.deskripsi}
                      </div>
                    )}

                    {/* Progress Bar & Nominal */}
                    <div style={{ marginTop: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: "3px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              color: "#64748b",
                              fontWeight: 600,
                            }}
                          >
                            Terkumpul:{" "}
                          </span>
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 900,
                              color: "#047857",
                            }}
                          >
                            {formatRp(p.terkumpul)}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 900,
                            color: "#059669",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>

                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          background: "#f1f5f9",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                          paddingTop: "6px",
                          borderTop: "1px solid #f1f5f9",
                        }}
                      >
                        <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                          Target: {formatRp(p.target_dana)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenInputInfak(p)}
                          style={{
                            background:
                              "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "4px 9px",
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
                          }}
                        >
                          <span>Input Infak</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {filteredPrograms.length > 0 && (
              <button
                type="button"
                onClick={() => setIsModalProgramOpen(true)}
                style={{
                  background: "#ffffff",
                  color: "#0f766e",
                  border: "1.5px dashed #99f6e4",
                  borderRadius: "14px",
                  padding: "10px",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Plus size={15} />
                <span>Tambah Program Penyaluran Infak Baru</span>
              </button>
            )}
          </div>
        )}

        {/* ================= TAB 2: RIWAYAT TRANSAKSI DONASI ================= */}
        {activeTab === "transaksi" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Filter Status Selector */}
            <div
              style={{
                display: "flex",
                gap: "5px",
                overflowX: "auto",
                paddingBottom: "4px",
              }}
            >
              {["Semua", "Berhasil", "Pending"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "7px",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    border:
                      filterStatus === st
                        ? "1px solid #059669"
                        : "1px solid #cbd5e1",
                    background: filterStatus === st ? "#ecfdf5" : "#ffffff",
                    color: filterStatus === st ? "#059669" : "#64748b",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {st === "Semua"
                    ? "Semua Status"
                    : st === "Berhasil"
                      ? "✓ Berhasil"
                      : "⏳ Pending"}
                </button>
              ))}
            </div>

            {filteredTransaksi.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "36px 20px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                  marginTop: "6px",
                }}
              >
                <Heart
                  size={36}
                  color="#cbd5e1"
                  style={{ margin: "0 auto 8px", display: "block" }}
                />
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: "#1e293b",
                  }}
                >
                  Tidak Ada Transaksi Ditemukan
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "#64748b",
                    marginTop: "3px",
                  }}
                >
                  Belum ada catatan penerimaan donasi infak dengan filter ini.
                </div>
              </div>
            ) : (
              filteredTransaksi.map((t) => {
                const isSuccess = t.status === "Berhasil";
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrx(t)}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "12px 14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {/* Avatar / Icon Monogram */}
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: isSuccess ? "#ecfdf5" : "#fffbeb",
                            border: isSuccess
                              ? "1px solid #a7f3d0"
                              : "1px solid #fef08a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isSuccess ? "#059669" : "#d97706",
                            fontWeight: 900,
                            fontSize: "0.85rem",
                            flexShrink: 0,
                          }}
                        >
                          {t.is_anonim
                            ? "HA"
                            : (t.nama_donatur || "D").slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "0.86rem",
                              color: "#0f172a",
                            }}
                          >
                            {t.is_anonim
                              ? "Hamba Allah (Anonim)"
                              : t.nama_donatur}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#059669",
                              fontWeight: 700,
                              marginTop: "1px",
                            }}
                          >
                            {t.nama_program || "Infak Pesantren"}
                          </div>
                          {t.nama_santri && (
                            <div
                              style={{ fontSize: "0.66rem", color: "#64748b" }}
                            >
                              Santri:{" "}
                              <span
                                style={{ fontWeight: 700, color: "#334155" }}
                              >
                                {t.nama_santri}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nominal & Status Badge */}
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: "0.92rem",
                            color: isSuccess ? "#047857" : "#d97706",
                          }}
                        >
                          {formatRp(t.nominal)}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "4px",
                            marginTop: "3px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "1px 6px",
                              borderRadius: "6px",
                              background: isSuccess ? "#ecfdf5" : "#fffbeb",
                              color: isSuccess ? "#059669" : "#b45309",
                              border: isSuccess
                                ? "1px solid #a7f3d0"
                                : "1px solid #fde68a",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            {isSuccess ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <Clock size={10} />
                            )}
                            <span>{t.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Doa / Pesan Kutipan Singkat */}
                    {t.doa_pesan && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          border: "1px dashed #cbd5e1",
                          fontSize: "0.7rem",
                          color: "#475569",
                          fontStyle: "italic",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "5px",
                        }}
                      >
                        <MessageSquareQuote
                          size={13}
                          color="#059669"
                          style={{ flexShrink: 0, marginTop: "2px" }}
                        />
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          "{t.doa_pesan}"
                        </span>
                      </div>
                    )}

                    {/* Footer Info: Tanggal & Metode */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "8px",
                        paddingTop: "6px",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "0.66rem",
                        color: "#94a3b8",
                      }}
                    >
                      <span>
                        {t.kode_transaksi} •{" "}
                        {new Date(t.tanggal_transaksi).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          fontWeight: 700,
                          color: "#64748b",
                        }}
                      >
                        {t.metode_pembayaran?.includes("QRIS") ? (
                          <QrCode size={11} />
                        ) : (
                          <CreditCard size={11} />
                        )}
                        <span>{t.metode_pembayaran || "QRIS"}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL DETAIL TRANSAKSI DONASI */}
      {selectedTrx && (
        <div
          onClick={() => setSelectedTrx(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "380px",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d766e 0%, #064e3b 100%)",
                color: "#ffffff",
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 900 }}>
                  Rincian Infak &amp; Sedekah
                </h3>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#a7f3d0",
                    marginTop: "2px",
                  }}
                >
                  {selectedTrx.kode_transaksi}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Info */}
            <div style={{ padding: "18px 20px" }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: "16px",
                  paddingBottom: "14px",
                  borderBottom: "1px dashed #cbd5e1",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#64748b",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Nominal Donasi
                </div>
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 900,
                    color: "#047857",
                    marginTop: "2px",
                  }}
                >
                  {formatRp(selectedTrx.nominal)}
                </div>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background:
                      selectedTrx.status === "Berhasil" ? "#ecfdf5" : "#fffbeb",
                    color:
                      selectedTrx.status === "Berhasil" ? "#059669" : "#b45309",
                    border:
                      selectedTrx.status === "Berhasil"
                        ? "1px solid #a7f3d0"
                        : "1px solid #fde68a",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "6px",
                  }}
                >
                  {selectedTrx.status === "Berhasil" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  <span>
                    {selectedTrx.status === "Berhasil"
                      ? "Berhasil Terverifikasi"
                      : "Menunggu Pembayaran"}
                  </span>
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  fontSize: "0.78rem",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#64748b" }}>Nama Donatur:</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    {selectedTrx.is_anonim
                      ? "Hamba Allah (Anonim)"
                      : selectedTrx.nama_donatur}
                  </span>
                </div>

                {selectedTrx.nama_santri && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ color: "#64748b" }}>Santri Terkait:</span>
                    <span style={{ fontWeight: 700, color: "#059669" }}>
                      {selectedTrx.nama_santri}
                    </span>
                  </div>
                )}

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#64748b" }}>Program:</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    {selectedTrx.nama_program}
                  </span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#64748b" }}>Metode Bayar:</span>
                  <span style={{ fontWeight: 700, color: "#334155" }}>
                    {selectedTrx.metode_pembayaran || "QRIS Midtrans"}
                  </span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#64748b" }}>Waktu Donasi:</span>
                  <span style={{ fontWeight: 700, color: "#334155" }}>
                    {new Date(selectedTrx.tanggal_transaksi).toLocaleString(
                      "id-ID",
                      { dateStyle: "medium", timeStyle: "short" },
                    )}
                  </span>
                </div>

                {selectedTrx.doa_pesan && (
                  <div
                    style={{
                      marginTop: "8px",
                      background: "#f8fafc",
                      padding: "10px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "#059669",
                        marginBottom: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MessageSquareQuote size={13} />
                      <span>Doa &amp; Hajat Donatur:</span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#334155",
                        fontStyle: "italic",
                        lineHeight: 1.35,
                      }}
                    >
                      "{selectedTrx.doa_pesan}"
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: "18px", display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteTransaksi(
                      selectedTrx.id,
                      selectedTrx.kode_transaksi,
                    )
                  }
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTrx(null)}
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL TAMBAH PROGRAM INFAK */}
      {isModalProgramOpen && (
        <div
          onClick={() => setIsModalProgramOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "420px",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d766e 0%, #064e3b 100%)",
                color: "#ffffff",
                padding: "18px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 900 }}>
                  Tambah Program Infak
                </h3>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#a7f3d0",
                    marginTop: "2px",
                  }}
                >
                  Wadah donasi &amp; wakaf sukarela orang tua santri
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalProgramOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleCreateProgram}
              style={{
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Nama Program Infak *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembangunan &amp; Perluasan Masjid"
                  value={programForm.nama_program}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      nama_program: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Kategori Program
                </label>
                <select
                  value={programForm.kategori}
                  onChange={(e) =>
                    setProgramForm({ ...programForm, kategori: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontWeight: 700,
                    color: "#1e293b",
                  }}
                >
                  <option value="Wakaf &amp; Pembangunan">
                    Wakaf &amp; Pembangunan
                  </option>
                  <option value="Beasiswa Pendidikan">
                    Beasiswa Santri &amp; Yatim
                  </option>
                  <option value="Wakaf Qur'an &amp; Kitab">
                    Wakaf Qur'an &amp; Kitab
                  </option>
                  <option value="Sedekah Konsumsi">
                    Sedekah Konsumsi &amp; Berkah
                  </option>
                  <option value="Infak Umum Pesantren">
                    Infak Umum Pesantren
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Target Dana (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="50.000.000"
                  value={programForm.target_dana}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      target_dana: formatRibuanInput(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    textAlign: "right",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan tujuan dan pemanfaatan infak ini..."
                  value={programForm.deskripsi}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      deskripsi: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalProgramOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProgram}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: "12px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  {submittingProgram ? "Menyimpan..." : "Simpan Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL INPUT PENERIMAAN INFAK & SEDEKAH (SIMPLE) */}
      {isInputInfakOpen && (
        <div
          onClick={() => setIsInputInfakOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "24px 24px 0 0",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "15px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
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
                  }}
                >
                  <Heart size={18} />
                </div>
                <div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    Input Penerimaan Infak
                  </h4>
                  <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Pilih penyaluran program &amp; nominal infak
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInputInfakOpen(false)}
                style={{
                  background: "#e2e8f0",
                  border: "none",
                  padding: "6px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#475569",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleSubmitInputInfak}
              style={{
                padding: "16px 18px 22px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* 1. Disalurkan ke Program Infak Mana */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.73rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  Disalurkan ke Program Infak *
                </label>
                <select
                  required
                  value={infakForm.program_id}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const found = programs.find(
                      (p) => String(p.id) === String(pid),
                    );
                    setInfakForm({
                      ...infakForm,
                      program_id: pid,
                      nama_program:
                        found?.nama_program || "Infak Umum Pesantren",
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "11px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    background: "#ffffff",
                    outline: "none",
                  }}
                >
                  {programs.length === 0 ? (
                    <option value="">Infak Umum Pesantren</option>
                  ) : (
                    programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_program} ({p.kategori || "Infak"})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 2. Nama Donatur / Pemberi Infak */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#334155",
                    }}
                  >
                    Nama Donatur / Pemberi Infak
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#059669",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={infakForm.is_anonim}
                      onChange={(e) =>
                        setInfakForm({
                          ...infakForm,
                          is_anonim: e.target.checked,
                        })
                      }
                    />
                    <span>Hamba Allah (Anonim)</span>
                  </label>
                </div>
                <input
                  type="text"
                  disabled={infakForm.is_anonim}
                  placeholder={
                    infakForm.is_anonim
                      ? "Hamba Allah (Anonim)"
                      : "Contoh: H. Ahmad / Wali Santri"
                  }
                  value={
                    infakForm.is_anonim ? "Hamba Allah" : infakForm.nama_donatur
                  }
                  onChange={(e) =>
                    setInfakForm({ ...infakForm, nama_donatur: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "11px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    color: "#0f172a",
                    background: infakForm.is_anonim ? "#f1f5f9" : "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* 3. Nominal Infak (Rp) dengan Titik Ribuan */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#334155",
                    }}
                  >
                    Nominal Infak (Rp) *
                  </label>
                  {infakForm.nominal && (
                    <button
                      type="button"
                      onClick={() =>
                        setInfakForm({ ...infakForm, nominal: "" })
                      }
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "11px",
                    border: "1.5px solid #cbd5e1",
                    background: "#ffffff",
                    padding: "0 12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 900,
                      color: "#64748b",
                      marginRight: "6px",
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="0"
                    value={infakForm.nominal}
                    onChange={(e) =>
                      setInfakForm({
                        ...infakForm,
                        nominal: formatRibuanInput(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      border: "none",
                      fontSize: "1.05rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      outline: "none",
                      background: "transparent",
                      textAlign: "right",
                    }}
                  />
                </div>

                {/* Quick Chips */}
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginTop: "8px",
                  }}
                >
                  {[10000, 20000, 50000, 100000, 250000, 500000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const cur = parseRibuanInput(infakForm.nominal);
                        setInfakForm({
                          ...infakForm,
                          nominal: formatRibuanInput(cur + chip),
                        });
                      }}
                      style={{
                        background: "#f1f5f9",
                        color: "#0f766e",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "4px 9px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      +{chip / 1000} Rb
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Metode & Tanggal */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Metode Terima
                  </label>
                  <select
                    value={infakForm.metode_pembayaran}
                    onChange={(e) =>
                      setInfakForm({
                        ...infakForm,
                        metode_pembayaran: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="Tunai">Tunai (Cash)</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={infakForm.tanggal_transaksi}
                    onChange={(e) =>
                      setInfakForm({
                        ...infakForm,
                        tanggal_transaksi: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* 5. Doa / Catatan Singkat */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.73rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  Keterangan / Doa Hajat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Infak pembangunan masjid / Semoga berkah"
                  value={infakForm.doa_pesan}
                  onChange={(e) =>
                    setInfakForm({ ...infakForm, doa_pesan: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setIsInputInfakOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "11px",
                    border: "none",
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingInfak}
                  style={{
                    flex: 1,
                    padding: "10px 18px",
                    borderRadius: "11px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 900,
                    cursor: submittingInfak ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingInfak ? "Menyimpan..." : "Simpan Penerimaan Infak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
