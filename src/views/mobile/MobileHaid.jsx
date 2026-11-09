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
  ArrowRight
} from "lucide-react";
import {
  showConfirm,
  showSuccess,
  showError,
  toastSuccess,
  toastError,
} from "../../utils/alert.util";

export default function MobileHaid() {
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

        // Ekstrak daftar kelas unik untuk filter chips
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

  // Fetch Riwayat Siklus jika tab riwayat aktif
  const fetchRiwayat = async (santriId = null) => {
    try {
      setLoadingHistory(true);
      const url = santriId
        ? `/api/haid/riwayat?santri_id=${santriId}`
        : `/api/haid/riwayat?limit=100`;
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab !== "riwayat") {
        fetchData();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter santriwati berdasarkan kelas
  const currentList = santriwati.filter((s) => {
    if (selectedKelas !== "semua" && s.nama_kelas !== selectedKelas) {
      return false;
    }
    return true;
  });

  // Buka Modal Mulai Haid
  const handleOpenStartModal = (santri = null) => {
    setTargetSantri(santri);
    setStartForm({
      santri_id: santri ? String(santri.id) : "",
      tgl_mulai: new Date().toISOString().split("T")[0],
      keterangan: "Mulai Haid (Udzur Syar'i)"
    });
    setIsStartModalOpen(true);
  };

  // Submit Mulai Haid
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
        const santriName = targetSantri
          ? targetSantri.nama_santri
          : santriwati.find((s) => String(s.id) === String(finalSantriId))?.nama_santri || "Santriwati";

        toastSuccess(`Status Haid ${santriName} aktif. Presensi berjamaah otomatis Haid.`);
        setIsStartModalOpen(false);
        setTargetSantri(null);
        fetchData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengaktifkan status haid");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Selesai Haid (Bersuci Manual)
  const handleStopHaid = async (santri) => {
    const confirm = await showConfirm(
      "Konfirmasi Bersuci",
      `Apakah ananda ${santri.nama_santri} telah selesai haid & bersuci? Status absensi berjamaah akan kembali normal (Hadir saat berjamaah).`,
      "Ya, Telah Suci",
      "Batal"
    );
    if (!confirm) return;

    try {
      setLoading(true);
      const res = await axios.post("/api/haid/selesai", {
        santri_id: santri.id
      });
      if (res.data?.success) {
        toastSuccess(`Alhamdulillah, status haid ${santri.nama_santri} selesai (Suci).`);
        fetchData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyelesaikan status haid");
    } finally {
      setLoading(false);
    }
  };

  // Buka Modal Riwayat Per Santri
  const handleOpenSantriHistory = (santri) => {
    setSelectedSantriHistory(santri);
    setIsHistoryModalOpen(true);
    fetchRiwayat(santri.id);
  };

  return (
    <div
      style={{
        paddingBottom: "90px",
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      {/* =========================================================================
          1. TOP SEGMENTED TAB SWITCHER (PERSIS MASTER KEGIATAN)
      ========================================================================= */}
      <div
        style={{
          padding: "14px 14px 10px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "6px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "14px",
          }}
        >
          {/* Tab 1: Sedang Haid */}
          <button
            type="button"
            onClick={() => setActiveTab("haid")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "10px 4px",
              borderRadius: "11px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "haid" ? "#be185d" : "transparent",
              color: activeTab === "haid" ? "#ffffff" : "#475569",
              fontWeight: activeTab === "haid" ? 800 : 600,
              fontSize: "0.72rem",
              boxShadow:
                activeTab === "haid"
                  ? "0 4px 12px rgba(190, 24, 93, 0.35)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span>🩸</span>
            <span>Sedang Haid</span>
            <span
              style={{
                background:
                  activeTab === "haid"
                    ? "rgba(255,255,255,0.25)"
                    : "#e2e8f0",
                color: activeTab === "haid" ? "#ffffff" : "#64748b",
                fontSize: "0.6rem",
                padding: "2px 5px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {summary.sedang_haid}
            </span>
          </button>

          {/* Tab 2: Suci */}
          <button
            type="button"
            onClick={() => setActiveTab("suci")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "10px 4px",
              borderRadius: "11px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "suci" ? "#0d766e" : "transparent",
              color: activeTab === "suci" ? "#ffffff" : "#475569",
              fontWeight: activeTab === "suci" ? 800 : 600,
              fontSize: "0.72rem",
              boxShadow:
                activeTab === "suci"
                  ? "0 4px 12px rgba(13, 118, 110, 0.35)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span>✨</span>
            <span>Suci / Normal</span>
            <span
              style={{
                background:
                  activeTab === "suci"
                    ? "rgba(255,255,255,0.25)"
                    : "#e2e8f0",
                color: activeTab === "suci" ? "#ffffff" : "#64748b",
                fontSize: "0.6rem",
                padding: "2px 5px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {summary.suci}
            </span>
          </button>

          {/* Tab 3: Riwayat */}
          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "10px 4px",
              borderRadius: "11px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "riwayat" ? "#4338ca" : "transparent",
              color: activeTab === "riwayat" ? "#ffffff" : "#475569",
              fontWeight: activeTab === "riwayat" ? 800 : 600,
              fontSize: "0.72rem",
              boxShadow:
                activeTab === "riwayat"
                  ? "0 4px 12px rgba(67, 56, 202, 0.35)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            <History size={13} />
            <span>Riwayat</span>
          </button>
        </div>

        {/* Search Bar & Tombol Tambah (Persis Master Kegiatan) */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: "12px" }}
            />
            <input
              type="text"
              placeholder={
                activeTab === "haid"
                  ? "Cari santriwati sedang haid..."
                  : activeTab === "suci"
                  ? "Cari santriwati suci..."
                  : "Cari riwayat haid..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a"
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            onClick={() => handleOpenStartModal(null)}
            style={{
              background: "linear-gradient(135deg, #be185d, #db2777)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "0 13px",
              fontSize: "0.75rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(190, 24, 93, 0.25)",
              flexShrink: 0
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Catat Haid</span>
          </button>
        </div>

        {/* Filter Chips Kelas (Scrollable Horizontal) */}
        {activeTab !== "riwayat" && kelasList.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingTop: "10px",
              paddingBottom: "2px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {["semua", ...kelasList].map((k) => {
              const isSel = selectedKelas === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedKelas(k)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: isSel ? "none" : "1px solid #e2e8f0",
                    background: isSel
                      ? activeTab === "haid"
                        ? "#be185d"
                        : "#0d766e"
                      : "#ffffff",
                    color: isSel ? "#ffffff" : "#64748b",
                    fontSize: "0.68rem",
                    fontWeight: isSel ? 700 : 500,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {k === "semua" ? "Semua Kelas" : k}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          2. BANNER OTOMASI SISTEM (SOPAN, RINGKAS & INFORMATIF)
      ========================================================================= */}
      <div style={{ padding: "12px 14px 0" }}>
        <div
          style={{
            background: "linear-gradient(145deg, #fdf2f8 0%, #fff1f2 100%)",
            border: "1px solid #fbcfe8",
            borderRadius: "14px",
            padding: "10px 13px",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            boxShadow: "0 2px 6px rgba(219, 39, 119, 0.05)"
          }}
        >
          <Sparkles size={17} color="#db2777" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.71rem", color: "#9d174d", lineHeight: 1.45 }}>
            <strong>Otomatisasi Sistem:</strong> Selama status Haid <strong>ON</strong>, santriwati setiap hari otomatis tercatat berstatus <strong>Haid</strong> pada absensi sholat berjamaah. Saat santriwati <strong>scan di mesin fingerprint / aplikasi</strong>, status haid otomatis <strong>OFF</strong> dan langsung tercatat <strong>Hadir</strong>.
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. KONTEN DAFTAR KARTU SANTRIWATI (PERSIS LAYOUT MASTER KEGIATAN)
      ========================================================================= */}
      <div style={{ padding: "12px 14px" }}>
        {activeTab === "riwayat" ? (
          /* TAB RIWAYAT SIKLUS KESELURUHAN */
          loadingHistory ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 10px", color: "#4338ca" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 600 }}>Memuat riwayat siklus haid...</div>
            </div>
          ) : historyList.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <History size={32} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}>
                Belum Ada Riwayat
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "4px" }}>
                Riwayat siklus haid santriwati akan otomatis tercatat di sini.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {historyList.map((h) => {
                const isAktif = h.status === "aktif";
                return (
                  <div
                    key={h.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "16px",
                      padding: "13px 15px",
                      border: isAktif ? "1.5px solid #fbcfe8" : "1px solid #e2e8f0",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>
                          {h.nama_santri}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          NIS: {h.nis || "-"} {h.nama_kelas ? `• ${h.nama_kelas}` : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "8px",
                          background: isAktif ? "#ffe4e6" : "#f1f5f9",
                          color: isAktif ? "#be123c" : "#475569",
                          border: isAktif ? "1px solid #fecdd3" : "1px solid #e2e8f0",
                        }}
                      >
                        {isAktif ? `Aktif (${h.durasi_hari} hari)` : `Selesai (${h.durasi_hari} hari)`}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.68rem",
                        color: "#475569",
                        marginTop: "2px",
                      }}
                    >
                      <Calendar size={13} color="#94a3b8" />
                      <span>
                        Mulai: <strong>{h.tgl_mulai}</strong> {h.tgl_selesai ? ` s/d ${h.tgl_selesai}` : " (Sedang Berjalan)"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.62rem",
                        color: "#94a3b8",
                        borderTop: "1px solid #f8fafc",
                        paddingTop: "4px",
                        marginTop: "2px",
                      }}
                    >
                      <span>Dicatat: {h.dicatat_oleh || "Ustadzah"}</span>
                      {h.dinonaktifkan_oleh && <span>Selesai: {h.dinonaktifkan_oleh}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* TAB SEDANG HAID & TAB SUCI */
          loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <Loader2
                size={30}
                className="animate-spin"
                style={{
                  margin: "0 auto 10px",
                  color: activeTab === "haid" ? "#be185d" : "#0d766e",
                }}
              />
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Memuat data santriwati...</div>
            </div>
          ) : currentList.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: activeTab === "haid" ? "#fdf2f8" : "#f0fdf4",
                  color: activeTab === "haid" ? "#be185d" : "#0d766e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                {activeTab === "haid" ? <Heart size={26} fill="#be185d" /> : <CheckCircle2 size={26} />}
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}>
                Tidak Ada Santriwati
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "4px" }}>
                {search
                  ? `Tidak ada santriwati yang sesuai kata kunci "${search}"`
                  : activeTab === "haid"
                  ? "Tidak ada santriwati yang sedang berstatus haid."
                  : "Semua santriwati sedang berstatus normal/suci."}
              </div>
              {activeTab === "haid" && (
                <button
                  onClick={() => handleOpenStartModal(null)}
                  style={{
                    marginTop: "16px",
                    background: "linear-gradient(135deg, #be185d, #db2777)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Catat Haid Santriwati
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentList.map((s) => {
                const isHaid = Number(s.is_haid) === 1;

                return (
                  <div
                    key={s.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "18px",
                      padding: "14px 16px",
                      border: isHaid ? "1.5px solid #fbcfe8" : "1px solid #e2e8f0",
                      boxShadow: isHaid
                        ? "0 4px 14px -2px rgba(244, 63, 94, 0.12)"
                        : "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Top Row: Avatar, Info Santri, Badge Status */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "14px",
                            background: isHaid ? "#ffe4e6" : "#f1f5f9",
                            color: isHaid ? "#e11d48" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {s.foto ? (
                            <img
                              src={s.foto}
                              alt={s.nama_santri}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "";
                              }}
                            />
                          ) : (
                            s.nama_santri?.charAt(0)?.toUpperCase() || "S"
                          )}
                        </div>

                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: 800,
                              color: "#0f172a",
                              lineHeight: 1.25,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {s.nama_santri}
                          </div>
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "#64748b",
                              marginTop: "2px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span>NIS: {s.nis || "-"}</span>
                            {s.nama_kelas && <span>• {s.nama_kelas}</span>}
                            {s.nama_asrama && <span>• {s.nama_asrama}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge Pill */}
                      <div style={{ flexShrink: 0 }}>
                        {isHaid ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#fff1f2",
                              border: "1px solid #fecdd3",
                              color: "#be123c",
                              fontSize: "0.66rem",
                              fontWeight: 800,
                              padding: "4px 8px",
                              borderRadius: "999px",
                            }}
                          >
                            <Heart size={11} fill="#e11d48" color="#e11d48" />
                            <span>Sedang Haid {s.hari_ke ? `(${s.hari_ke}h)` : ""}</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#166534",
                              fontSize: "0.66rem",
                              fontWeight: 800,
                              padding: "4px 8px",
                              borderRadius: "999px",
                            }}
                          >
                            <CheckCircle2 size={11} />
                            <span>Suci</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Tambahan jika Haid (Tgl Mulai & Udzur) */}
                    {isHaid && (
                      <div
                        style={{
                          background: "#fff5f7",
                          borderRadius: "12px",
                          padding: "8px 11px",
                          fontSize: "0.68rem",
                          color: "#9f1239",
                          border: "1px dashed #fecdd3",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Mulai: <strong>{s.tgl_mulai || "-"}</strong> {s.waktu_mulai ? `(${String(s.waktu_mulai).substring(0, 5)} WIB)` : ""}</span>
                          <span>Oleh: {s.dicatat_oleh || "Ustadzah"}</span>
                        </div>
                        {s.haid_keterangan && (
                          <div style={{ color: "#881337", fontStyle: "italic", marginTop: "1px" }}>
                            "{s.haid_keterangan}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card Actions Footer Row (Identik Master Kegiatan) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "9px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenSantriHistory(s)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748b",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                      >
                        <History size={14} />
                        <span>Riwayat Siklus</span>
                      </button>

                      {isHaid ? (
                        <button
                          type="button"
                          onClick={() => handleStopHaid(s)}
                          style={{
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "11px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 3px 8px rgba(16, 185, 129, 0.25)",
                          }}
                        >
                          <Check size={14} strokeWidth={2.6} />
                          <span>Selesai Haid (Bersuci)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenStartModal(s)}
                          style={{
                            background: "linear-gradient(135deg, #be185d 0%, #db2777 100%)",
                            color: "#ffffff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "11px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 3px 8px rgba(190, 24, 93, 0.25)",
                          }}
                        >
                          <Heart size={14} strokeWidth={2.4} fill="#ffffff" />
                          <span>Mulai Haid (Udzur)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* =========================================================================
          MODAL: FORM CATAT / MULAI HAID SANTRIWATI
      ========================================================================= */}
      {isStartModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              maxWidth: "420px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                background: "linear-gradient(135deg, #be185d 0%, #db2777 100%)",
                padding: "16px 18px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Heart size={20} color="#ffffff" fill="#ffffff" />
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                  Aktivasi Status Haid
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStartModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStartHaid} style={{ padding: "18px" }}>
              {/* Santriwati Selector */}
              {targetSantri ? (
                <div
                  style={{
                    background: "#fdf2f8",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    marginBottom: "14px",
                    border: "1px solid #fce7f3",
                  }}
                >
                  <div style={{ fontSize: "0.68rem", color: "#9d174d", fontWeight: 700 }}>
                    Santriwati Terpilih:
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#831843", marginTop: "2px" }}>
                    {targetSantri.nama_santri}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#be185d", marginTop: "2px" }}>
                    NIS: {targetSantri.nis || "-"} • Kelas: {targetSantri.nama_kelas || "-"}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Pilih Santriwati (Akhwat):
                  </label>
                  <select
                    required
                    value={startForm.santri_id}
                    onChange={(e) => setStartForm({ ...startForm, santri_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#ffffff"
                    }}
                  >
                    <option value="">-- Pilih Santriwati --</option>
                    {santriwati.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_santri} ({s.nama_kelas || "Tanpa Kelas"}) {Number(s.is_haid) === 1 ? "- [Sedang Haid]" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tanggal Mulai */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Tanggal Mulai Haid:
                </label>
                <input
                  type="date"
                  required
                  value={startForm.tgl_mulai}
                  onChange={(e) => setStartForm({ ...startForm, tgl_mulai: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Catatan / Keterangan */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Catatan / Keterangan Udzur:
                </label>
                <input
                  type="text"
                  value={startForm.keterangan}
                  onChange={(e) => setStartForm({ ...startForm, keterangan: e.target.value })}
                  placeholder="Contoh: Mulai Haid (Udzur Syar'i)"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  fontSize: "0.68rem",
                  color: "#166534",
                  marginBottom: "16px",
                  border: "1px solid #bbf7d0",
                  lineHeight: 1.4,
                }}
              >
                ✨ <strong>Otomatisasi:</strong> Jadwal sholat berjamaah harian otomatis berstatus <strong>Haid</strong>. Saat santriwati scan berjamaah di mesin atau aplikasi, status otomatis dinonaktifkan (OFF).
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    background: "linear-gradient(135deg, #be185d 0%, #db2777 100%)",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 10px rgba(190, 24, 93, 0.3)",
                  }}
                >
                  {submitting ? "Menyimpan..." : "Aktifkan Status Haid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RIWAYAT SIKLUS PER SANTRI
      ========================================================================= */}
      {isHistoryModalOpen && selectedSantriHistory && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                background: "#0f172a",
                padding: "16px 18px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800 }}>
                  Riwayat Siklus: {selectedSantriHistory.nama_santri}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <Loader2 size={24} className="animate-spin" color="#db2777" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Memuat riwayat...</div>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b", fontSize: "0.78rem" }}>
                  Belum ada riwayat siklus yang tercatat untuk santriwati ini.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {historyList.map((h) => {
                    const isAktif = h.status === "aktif";
                    return (
                      <div
                        key={h.id}
                        style={{
                          background: isAktif ? "#fff1f2" : "#f8fafc",
                          borderRadius: "14px",
                          padding: "11px 13px",
                          border: isAktif ? "1px solid #fecdd3" : "1px solid #e2e8f0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f172a" }}>
                            {h.tgl_mulai} {h.tgl_selesai ? ` s/d ${h.tgl_selesai}` : " (Berjalan)"}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: "6px",
                              background: isAktif ? "#e11d48" : "#64748b",
                              color: "#ffffff",
                            }}
                          >
                            {isAktif ? `Aktif (${h.durasi_hari} hari)` : `Selesai (${h.durasi_hari} hari)`}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.64rem", color: "#64748b", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                          <span>Dicatat: {h.dicatat_oleh || "Ustadzah"}</span>
                          {h.dinonaktifkan_oleh && <span>Selesai: {h.dinonaktifkan_oleh}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
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

