import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Heart,
  Calendar,
  Search,
  RotateCw,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  AlertTriangle,
  History,
  X,
  Check,
  Building2,
  GraduationCap,
  Plus,
  Loader2,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Filter,
  Eye,
  CheckCheck
} from "lucide-react";
import {
  showConfirm,
  showSuccess,
  showError,
  toastSuccess,
  toastError,
} from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";

export default function HaidSantriwatiAdminView() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("haid"); // 'haid' | 'suci' | 'riwayat'
  const [santriwati, setSantriwati] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("semua");
  const [search, setSearch] = useState("");

  const [summary, setSummary] = useState({
    total_santriwati: 0,
    sedang_haid: 0,
    suci: 0
  });

  // Modal State: Mulai Haid
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [targetSantri, setTargetSantri] = useState(null);
  const [startForm, setStartForm] = useState({
    santri_id: "",
    tgl_mulai: new Date().toISOString().split("T")[0],
    keterangan: "Mulai Haid (Udzur Syar'i)"
  });
  const [submitting, setSubmitting] = useState(false);

  // Riwayat Siklus State
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSantriHistory, setSelectedSantriHistory] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch Data Santriwati & KPI
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/haid/santriwati?search=${encodeURIComponent(search)}&tab=${activeTab === "riwayat" ? "semua" : activeTab}`
      );
      if (res.data?.success && res.data.data) {
        const list = res.data.data.santriwati || [];
        setSantriwati(list);
        setSummary(
          res.data.data.summary || {
            total_santriwati: 0,
            sedang_haid: 0,
            suci: 0
          }
        );

        const classes = Array.from(
          new Set(list.map((s) => s.nama_kelas).filter(Boolean))
        ).sort();
        setKelasList(classes);
      }
    } catch (err) {
      console.warn("Gagal memuat data haid:", err);
      toastError("Gagal memuat data santriwati");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Riwayat Siklus
  const fetchRiwayat = async (santriId = null) => {
    try {
      setLoadingHistory(true);
      const url = santriId
        ? `/api/haid/riwayat?santri_id=${santriId}`
        : `/api/haid/riwayat?limit=150`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.warn("Gagal memuat riwayat:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "riwayat") {
      fetchRiwayat();
    } else {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab !== "riwayat") {
        fetchData();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const currentList = santriwati.filter((s) => {
    if (selectedKelas !== "semua" && s.nama_kelas !== selectedKelas) {
      return false;
    }
    return true;
  });

  const handleOpenStartModal = (santri = null) => {
    setTargetSantri(santri);
    setStartForm({
      santri_id: santri ? String(santri.id) : "",
      tgl_mulai: new Date().toISOString().split("T")[0],
      keterangan: "Mulai Haid (Udzur Syar'i)"
    });
    setIsStartModalOpen(true);
  };

  const handleSubmitStartHaid = async (e) => {
    e.preventDefault();
    const finalSantriId = targetSantri ? targetSantri.id : startForm.santri_id;
    if (!finalSantriId) {
      toastError("Pilih santriwati terlebih dahulu!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/api/haid/mulai", {
        santri_id: finalSantriId,
        tgl_mulai: startForm.tgl_mulai,
        keterangan: startForm.keterangan
      });

      if (res.data?.success) {
        toastSuccess("Status Haid Aktif!", res.data.message || "Santriwati berhasil dicatat sedang Haid.");
        setIsStartModalOpen(false);
        fetchData();
      } else {
        showError("Gagal Mencatat", res.data?.message || "Terjadi kesalahan saat memproses status haid.");
      }
    } catch (err) {
      showError("Gagal Mencatat", err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelesaiHaid = async (santri) => {
    const confirmed = await showConfirm(
      "Konfirmasi Selesai Haid / Suci?",
      `Apakah ananda ${santri.nama_santri} telah selesai masa haid (suci/bersuci)? Status akan dikembalikan Normal dan kembali wajib sholat berjamaah.`,
      "Ya, Sudah Suci",
      "Batal"
    );

    if (!confirmed) return;

    try {
      const res = await axios.post("/api/haid/selesai", {
        santri_id: santri.id,
        tgl_selesai: new Date().toISOString().split("T")[0]
      });

      if (res.data?.success) {
        toastSuccess("Alhamdulillah Suci!", res.data.message || "Status santriwati telah kembali Normal.");
        fetchData();
      } else {
        showError("Gagal Memproses", res.data?.message || "Terjadi kesalahan sistem.");
      }
    } catch (err) {
      showError("Gagal Memproses", err.response?.data?.message || err.message);
    }
  };

  const handleOpenSantriHistory = (santri) => {
    setSelectedSantriHistory(santri);
    setIsHistoryModalOpen(true);
    fetchRiwayat(santri.id);
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* 1. TOP HEADER BANNER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "14px",
        background: "#ffffff",
        padding: "18px 22px",
        borderRadius: "18px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #e11d48, #be123c)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 16px rgba(225, 29, 72, 0.3)"
          }}>
            <Heart size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Manajemen Siklus Haid Santriwati</span>
              <span style={{ fontSize: "0.68rem", background: "#ffe4e6", color: "#be123c", border: "1px solid #fecdd3", padding: "2px 8px", borderRadius: "999px", fontWeight: 800 }}>
                Udzur Syar'i
              </span>
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "4px 0 0" }}>
              Otomatisasi dispensasi ibadah sholat berjamaah &amp; pencatatan siklus bulanan santriwati.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              if (activeTab === "riwayat") fetchRiwayat();
              else fetchData();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              padding: "9px 14px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#334155"
            }}
            title="Segarkan Data"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={() => handleOpenStartModal(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
              border: "none",
              color: "#ffffff",
              padding: "9px 18px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 800,
              boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
            }}
          >
            <Plus size={16} /> + Catat Haid Baru
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "14px",
        marginBottom: "20px"
      }}>
        {/* Card 1: Sedang Haid */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #fecdd3",
          borderLeft: "6px solid #e11d48",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(225, 29, 72, 0.05)"
        }}>
          <div>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#be123c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sedang Haid (Udzur)
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#9f1239", marginTop: "2px" }}>
              {summary.sedang_haid || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              Otomatis dispensasi sholat
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#ffe4e6", color: "#e11d48", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={24} />
          </div>
        </div>

        {/* Card 2: Suci / Normal */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #bbf7d0",
          borderLeft: "6px solid #10b981",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.05)"
        }}>
          <div>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Suci / Normal
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#065f46", marginTop: "2px" }}>
              {summary.suci || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              Wajib sholat berjamaah
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 3: Total Santriwati */}
        <div style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "16px 20px",
          border: "1px solid #e2e8f0",
          borderLeft: "6px solid #6366f1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <div>
            <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Santriwati
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1e1b4b", marginTop: "2px" }}>
              {summary.total_santriwati || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              Terdaftar di asrama putri
            </div>
          </div>
          <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={24} />
          </div>
        </div>
      </div>

      {/* 3. INFO BANNER OTOMATISASI */}
      <div style={{
        background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
        border: "1px solid #fecdd3",
        borderRadius: "14px",
        padding: "12px 18px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <Sparkles size={20} color="#e11d48" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "0.78rem", color: "#9f1239", lineHeight: 1.5 }}>
          <strong>Otomatisasi Sistem Presensi:</strong> Selama status Haid <strong>ON</strong>, santriwati setiap hari otomatis tercatat berstatus <strong>Haid</strong> pada presensi sholat berjamaah tanpa terhitung alfa. Saat santriwati scan fingerprint / dideteksi presensi normal, status haid otomatis di-OFF-kan dan kembali <strong>Hadir</strong>.
        </div>
      </div>

      {/* 4. MAIN CONTENT CONTAINER (CARD + TABLE) */}
      <div style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
        overflow: "hidden"
      }}>
        {/* TAB CONTROLLER & FILTER BAR */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fafafa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px"
        }}>
          {/* Sub-Tabs (Haid / Suci / Riwayat) */}
          <div style={{ display: "flex", gap: "6px", background: "#e2e8f0", padding: "4px", borderRadius: "12px" }}>
            <button
              onClick={() => setActiveTab("haid")}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "haid" ? "#e11d48" : "transparent",
                color: activeTab === "haid" ? "#ffffff" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              <Heart size={14} />
              <span>Sedang Haid ({summary.sedang_haid || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("suci")}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "suci" ? "#10b981" : "transparent",
                color: activeTab === "suci" ? "#ffffff" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              <CheckCircle2 size={14} />
              <span>Suci / Normal ({summary.suci || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("riwayat")}
              style={{
                padding: "8px 18px",
                borderRadius: "10px",
                border: "none",
                background: activeTab === "riwayat" ? "#475569" : "transparent",
                color: activeTab === "riwayat" ? "#ffffff" : "#475569",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              <History size={14} />
              <span>Riwayat Siklus</span>
            </button>
          </div>

          {/* Search & Filter Kelas */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, justifyContent: "flex-end", maxWidth: "560px" }}>
            <div style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "0 10px"
            }}>
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder={activeTab === "riwayat" ? "Cari riwayat nama/nis..." : "Cari santriwati haid / nis..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "8px 8px",
                  fontSize: "0.76rem",
                  width: "100%",
                  color: "#1e293b",
                  fontWeight: 600
                }}
              />
            </div>

            {activeTab !== "riwayat" && (
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "#334155",
                  outline: "none"
                }}
              >
                <option value="semua">Semua Kelas ({kelasList.length})</option>
                {kelasList.map((k) => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TABEL DATA SANTRIWATI / RIWAYAT */}
        {activeTab !== "riwayat" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 800 }}>
                  <th style={{ padding: "12px 16px", width: "50px", textAlign: "center" }}>No</th>
                  <th style={{ padding: "12px 16px" }}>Santriwati</th>
                  <th style={{ padding: "12px 16px" }}>Kelas &amp; Asrama</th>
                  <th style={{ padding: "12px 16px" }}>Status Saat Ini</th>
                  <th style={{ padding: "12px 16px" }}>Mulai Haid</th>
                  <th style={{ padding: "12px 16px" }}>Durasi Hari</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                      <div>Memuat data santriwati...</div>
                    </td>
                  </tr>
                ) : currentList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                      Tidak ada data santriwati yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  currentList.map((s, idx) => {
                    const isHaid = s.status_haid === "Haid" || s.is_haid;

                    return (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isHaid ? "rgba(255, 241, 242, 0.45)" : "#ffffff",
                          transition: "background 0.15s ease"
                        }}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                          {idx + 1}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isHaid ? "#ffe4e6" : "#ecfdf5",
                              color: isHaid ? "#e11d48" : "#059669",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.78rem"
                            }}>
                              {String(s.nama_santri || "S").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.82rem" }}>
                                {s.nama_santri}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                NIS: {s.nis || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 700, color: "#334155" }}>
                            {s.nama_kelas || "-"}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                            {s.nama_asrama || "-"} {s.nama_kamar ? `• K. ${s.nama_kamar}` : ""}
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {isHaid ? (
                            <span style={{
                              background: "#ffe4e6",
                              color: "#be123c",
                              border: "1px solid #fecdd3",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <Heart size={12} fill="#e11d48" /> SEDANG HAID
                            </span>
                          ) : (
                            <span style={{
                              background: "#ecfdf5",
                              color: "#047857",
                              border: "1px solid #a7f3d0",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <CheckCircle2 size={12} /> SUCI / NORMAL
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px", color: "#475569", fontWeight: 600 }}>
                          {s.tgl_mulai_haid ? new Date(s.tgl_mulai_haid).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {isHaid && s.hari_ke ? (
                            <span style={{
                              background: "#fff1f2",
                              border: "1px solid #fed7aa",
                              color: "#c2410c",
                              fontWeight: 900,
                              fontSize: "0.74rem",
                              padding: "3px 8px",
                              borderRadius: "8px"
                            }}>
                              Hari ke-{s.hari_ke}
                            </span>
                          ) : "-"}
                        </td>

                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            {isHaid ? (
                              <button
                                onClick={() => handleSelesaiHaid(s)}
                                style={{
                                  background: "#10b981",
                                  border: "none",
                                  color: "#ffffff",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "0.72rem",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)"
                                }}
                                title="Tandai telah selesai masa haid (suci)"
                              >
                                <Check size={13} /> Selesai / Suci
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenStartModal(s)}
                                style={{
                                  background: "#ffe4e6",
                                  border: "1px solid #fecdd3",
                                  color: "#be123c",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "0.72rem",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                                title="Catat santriwati mulai berstatus haid"
                              >
                                <Heart size={13} /> Mulai Haid
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenSantriHistory(s)}
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                color: "#475569",
                                padding: "6px 10px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title="Lihat riwayat siklus santriwati ini"
                            >
                              <History size={13} /> Riwayat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TABEL RIWAYAT SIKLUS HAID */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 800 }}>
                  <th style={{ padding: "12px 16px", width: "50px", textAlign: "center" }}>No</th>
                  <th style={{ padding: "12px 16px" }}>Santriwati</th>
                  <th style={{ padding: "12px 16px" }}>Kelas &amp; Asrama</th>
                  <th style={{ padding: "12px 16px" }}>Tanggal Mulai</th>
                  <th style={{ padding: "12px 16px" }}>Tanggal Selesai</th>
                  <th style={{ padding: "12px 16px" }}>Total Durasi</th>
                  <th style={{ padding: "12px 16px" }}>Status Siklus</th>
                  <th style={{ padding: "12px 16px" }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                      <div>Memuat riwayat siklus...</div>
                    </td>
                  </tr>
                ) : historyList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                      Belum ada riwayat siklus haid yang tercatat.
                    </td>
                  </tr>
                ) : (
                  historyList
                    .filter((h) => {
                      if (!search.trim()) return true;
                      const q = search.toLowerCase();
                      return (
                        (h.nama_santri || "").toLowerCase().includes(q) ||
                        (h.nis || "").toLowerCase().includes(q)
                      );
                    })
                    .map((h, idx) => {
                      const isStillActive = !h.tgl_selesai;

                      return (
                        <tr key={h.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{h.nama_santri}</div>
                            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>NIS: {h.nis || "-"}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>
                            <div>{h.nama_kelas || "-"}</div>
                            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{h.nama_asrama || "-"}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: 700 }}>
                            {h.tgl_mulai ? new Date(h.tgl_mulai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: 700 }}>
                            {h.tgl_selesai ? new Date(h.tgl_selesai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              fontWeight: 900,
                              color: isStillActive ? "#be123c" : "#047857",
                              background: isStillActive ? "#fff1f2" : "#ecfdf5",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: isStillActive ? "1px solid #fecdd3" : "1px solid #a7f3d0"
                            }}>
                              {h.durasi_hari ? `${h.durasi_hari} Hari` : isStillActive ? "Sedang Berjalan" : "-"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {isStillActive ? (
                              <span style={{ color: "#be123c", fontWeight: 800, fontSize: "0.72rem" }}>
                                ● Masih Haid
                              </span>
                            ) : (
                              <span style={{ color: "#059669", fontWeight: 800, fontSize: "0.72rem" }}>
                                ✓ Telah Selesai
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748b", fontSize: "0.74rem" }}>
                            {h.keterangan || "Udzur Syar'i"}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: CATAT MULAI HAID SANTRIWATI
      ======================================================== */}
      {isStartModalOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "460px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #e11d48, #be123c)",
              color: "#ffffff",
              padding: "18px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Heart size={20} />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                  Catat Mulai Haid Santriwati
                </h3>
              </div>
              <button
                onClick={() => setIsStartModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStartHaid} style={{ padding: "20px" }}>
              {targetSantri ? (
                <div style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "16px"
                }}>
                  <div style={{ fontWeight: 800, color: "#9f1239", fontSize: "0.86rem" }}>
                    {targetSantri.nama_santri}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#be123c", marginTop: "2px" }}>
                    NIS: {targetSantri.nis || "-"} • Kelas {targetSantri.nama_kelas || "-"}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                    Pilih Santriwati <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <SearchableSelect
                    options={santriwati.map((s) => ({
                      value: String(s.id),
                      label: `${s.nama_santri} (${s.nama_kelas || "Tanpa Kelas"} - NIS: ${s.nis || "-"})`
                    }))}
                    value={startForm.santri_id}
                    onChange={(val) => setStartForm({ ...startForm, santri_id: val })}
                    placeholder="Ketik nama atau NIS santriwati..."
                  />
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                  Tanggal Mulai Haid <span style={{ color: "#e11d48" }}>*</span>
                </label>
                <input
                  type="date"
                  value={startForm.tgl_mulai}
                  onChange={(e) => setStartForm({ ...startForm, tgl_mulai: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={startForm.keterangan}
                  onChange={(e) => setStartForm({ ...startForm, keterangan: e.target.value })}
                  placeholder="Keterangan kondisi santriwati..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #e11d48, #be123c)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 10px rgba(225, 29, 72, 0.25)"
                  }}
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Heart size={14} />}
                  <span>Simpan Status Haid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RIWAYAT SIKLUS PER SANTRIWATI
      ======================================================== */}
      {isHistoryModalOpen && selectedSantriHistory && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            overflow: "hidden",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              background: "#0f172a",
              color: "#ffffff",
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>
                  Riwayat Siklus: {selectedSantriHistory.nama_santri}
                </h3>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                  NIS: {selectedSantriHistory.nis || "-"} • Kelas {selectedSantriHistory.nama_kelas || "-"}
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                  <div>Memuat riwayat...</div>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "0.8rem" }}>
                  Belum ada riwayat siklus yang tercatat untuk santriwati ini.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {historyList.map((h, i) => (
                    <div
                      key={h.id || i}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        background: !h.tgl_selesai ? "#fff1f2" : "#f8fafc",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#0f172a" }}>
                          {h.tgl_mulai ? new Date(h.tgl_mulai).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-"}
                          {" s/d "}
                          {h.tgl_selesai ? new Date(h.tgl_selesai).toLocaleDateString("id-ID", { dateStyle: "long" }) : "(Masih Berjalan)"}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                          Catatan: {h.keterangan || "Udzur Syar'i"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{
                          fontWeight: 900,
                          fontSize: "0.78rem",
                          color: !h.tgl_selesai ? "#be123c" : "#059669"
                        }}>
                          {h.durasi_hari ? `${h.durasi_hari} Hari` : "Aktif"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

