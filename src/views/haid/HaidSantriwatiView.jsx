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
  AlertCircle,
  HelpCircle,
  History,
  X,
  Check,
  Building2,
  GraduationCap
} from "lucide-react";
import { toastSuccess, toastError, showConfirm } from "../../utils/alert.util";

export default function HaidSantriwatiView() {
  const [loading, setLoading] = useState(true);
  const [santriwati, setSantriwati] = useState([]);
  const [summary, setSummary] = useState({
    total_santriwati: 0,
    sedang_haid: 0,
    suci: 0
  });

  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState("semua"); // 'semua' | 'haid' | 'suci'
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedSantriHistory, setSelectedSantriHistory] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal Mulai Haid
  const [showStartModal, setShowStartModal] = useState(false);
  const [targetSantri, setTargetSantri] = useState(null);
  const [startForm, setStartForm] = useState({
    tgl_mulai: new Date().toISOString().split("T")[0],
    keterangan: "Mulai Haid (Udzur Syar'i)"
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data Santriwati & KPI
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/haid/santriwati?search=${encodeURIComponent(search)}&tab=${tabFilter}`
      );
      if (res.data?.success && res.data.data) {
        setSantriwati(res.data.data.santriwati || []);
        setSummary(
          res.data.data.summary || {
            total_santriwati: 0,
            sedang_haid: 0,
            suci: 0
          }
        );
      }
    } catch (err) {
      console.warn("Gagal memuat data haid:", err);
      toastError("Gagal memuat data santriwati haid");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabFilter]);

  // Handle Search dengan debounce sederhana
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Buka Modal Mulai Haid
  const handleOpenStartModal = (santri) => {
    setTargetSantri(santri);
    setStartForm({
      tgl_mulai: new Date().toISOString().split("T")[0],
      keterangan: "Mulai Haid (Udzur Syar'i)"
    });
    setShowStartModal(true);
  };

  // Submit Mulai Haid
  const handleSubmitStartHaid = async (e) => {
    e.preventDefault();
    if (!targetSantri) return;
    try {
      setSubmitting(true);
      const res = await axios.post("/api/haid/mulai", {
        santri_id: targetSantri.id,
        tgl_mulai: startForm.tgl_mulai,
        keterangan: startForm.keterangan
      });
      if (res.data?.success) {
        toastSuccess(
          `Status Haid untuk ${targetSantri.nama_santri} berhasil diaktifkan. Absensi shalat berjamaah otomatis Haid.`
        );
        setShowStartModal(false);
        setTargetSantri(null);
        fetchData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mengaktifkan status haid");
    } finally {
      setSubmitting(false);
    }
  };

  // Selesai Haid (Manual Bersuci)
  const handleStopHaid = async (santri) => {
    const confirm = await showConfirm(
      "Konfirmasi Selesai Haid",
      `Apakah ananda ${santri.nama_santri} telah selesai masa haid & telah bersuci? Status absensi berjamaah akan kembali normal.`,
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
        toastSuccess(
          `Alhamdulillah, status haid ${santri.nama_santri} telah selesai (suci).`
        );
        fetchData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyelesaikan status haid");
    } finally {
      setLoading(false);
    }
  };

  // Buka Riwayat Siklus Haid
  const handleOpenHistory = async (santri = null) => {
    setSelectedSantriHistory(santri);
    setShowHistoryModal(true);
    try {
      setLoadingHistory(true);
      const url = santri
        ? `/api/haid/riwayat?santri_id=${santri.id}`
        : `/api/haid/riwayat?limit=50`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err) {
      console.warn("Gagal memuat riwayat haid:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "16px 14px 80px",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      {/* 1. Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #be185d 0%, #db2777 50%, #f43f5e 100%)",
          borderRadius: "20px",
          padding: "20px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(219, 39, 119, 0.4)",
          position: "relative",
          overflow: "hidden",
          marginBottom: "16px"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: "120px",
            height: "120px",
            background: "rgba(255, 255, 255, 0.12)",
            borderRadius: "50%",
            pointerEvents: "none"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 255, 255, 0.3)"
              }}
            >
              <Heart size={22} color="#ffffff" strokeWidth={2.4} fill="#ffffff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.18rem",
                  fontWeight: 900,
                  margin: 0,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.2
                }}
              >
                Pencatatan Haid Santriwati
              </h2>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "#fce7f3",
                  margin: "2px 0 0",
                  fontWeight: 500
                }}
              >
                Udzur Syar'i &amp; Otomasi Presensi Berjamaah
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenHistory(null)}
            title="Lihat Riwayat Siklus Haid"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              color: "#ffffff",
              padding: "7px 12px",
              borderRadius: "12px",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              backdropFilter: "blur(4px)"
            }}
          >
            <History size={14} />
            <span>Riwayat</span>
          </button>
        </div>

        {/* 3 KPI Cards Ringkasan */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginTop: "16px"
          }}
        >
          {/* Total Santriwati */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.16)",
              borderRadius: "14px",
              padding: "10px 8px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#fce7f3", fontWeight: 700, textTransform: "uppercase" }}>
              Total Akhwat
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, marginTop: "2px", lineHeight: 1.1 }}>
              {summary.total_santriwati}
            </div>
          </div>

          {/* Sedang Haid */}
          <div
            style={{
              background: "linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)",
              borderRadius: "14px",
              padding: "10px 8px",
              textAlign: "center",
              border: "1px solid #fecdd3",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#be123c", fontWeight: 800, textTransform: "uppercase" }}>
              Sedang Haid
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#e11d48", marginTop: "2px", lineHeight: 1.1 }}>
              {summary.sedang_haid}
            </div>
          </div>

          {/* Suci */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.16)",
              borderRadius: "14px",
              padding: "10px 8px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#fce7f3", fontWeight: 700, textTransform: "uppercase" }}>
              Suci / Normal
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, marginTop: "2px", lineHeight: 1.1 }}>
              {summary.suci}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banner Informasi Otomasi Sistem */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "10px 13px",
          marginBottom: "14px",
          display: "flex",
          gap: "9px",
          alignItems: "flex-start"
        }}
      >
        <Sparkles size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "0.71rem", color: "#166534", lineHeight: 1.45 }}>
          <strong>Otomatisasi Absensi Berjamaah:</strong> Selama status Haid <strong>AKTIF</strong>,
          santriwati setiap hari otomatis tercatat berstatus <strong>Haid</strong> pada absensi sholat berjamaah.
          Saat santriwati mulai hadir dan <strong>scan di mesin fingerprint atau aplikasi</strong>,
          status haid otomatis <strong>OFF (Selesai)</strong> dan presensi langsung tercatat <strong>Hadir</strong>!
        </div>
      </div>

      {/* 3. Search & Tab Filter */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
        {/* Search Input */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: "absolute", left: "14px", pointerEvents: "none" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama santriwati, NIS, kelas, asrama..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "0.8rem",
              color: "#0f172a",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8"
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tab Pills Filter */}
        <div
          style={{
            display: "flex",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "12px",
            gap: "4px"
          }}
        >
          {[
            { id: "semua", label: `Semua (${summary.total_santriwati})` },
            { id: "haid", label: `Sedang Haid (${summary.sedang_haid})` },
            { id: "suci", label: `Suci (${summary.suci})` }
          ].map((tb) => {
            const isActive = tabFilter === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setTabFilter(tb.id)}
                style={{
                  flex: 1,
                  padding: "7px 4px",
                  borderRadius: "9px",
                  border: "none",
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#be185d" : "#64748b",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {tb.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Daftar Santriwati List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <RotateCw size={24} className="animate-spin" color="#db2777" style={{ margin: "0 auto 8px" }} />
          <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Memuat data santriwati...</div>
        </div>
      ) : santriwati.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "36px 20px",
            textAlign: "center",
            border: "1px dashed #cbd5e1"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#fdf2f8",
              color: "#db2777",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px"
            }}
          >
            <Heart size={24} />
          </div>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginBottom: "4px" }}>
            Tidak Ada Santriwati
          </div>
          <p style={{ fontSize: "0.74rem", color: "#64748b", margin: 0 }}>
            {search
              ? "Tidak ditemukan santriwati yang sesuai dengan kata kunci pencarian."
              : "Belum ada santriwati dengan status yang dipilih."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {santriwati.map((s) => {
            const isHaid = Number(s.is_haid) === 1;

            return (
              <div
                key={s.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "13px 14px",
                  border: isHaid ? "1.5px solid #fbcfe8" : "1px solid #e2e8f0",
                  boxShadow: isHaid
                    ? "0 4px 14px -2px rgba(244, 63, 94, 0.12)"
                    : "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.15s ease"
                }}
              >
                {/* Header Row: Foto, Nama, Status Badge */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "13px",
                        background: isHaid ? "#ffe4e6" : "#f1f5f9",
                        color: isHaid ? "#e11d48" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        flexShrink: 0,
                        overflow: "hidden"
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

                    {/* Identitas Santri */}
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
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
                          flexWrap: "wrap"
                        }}
                      >
                        <span>NIS: {s.nis || "-"}</span>
                        {s.nama_kelas && <span>• {s.nama_kelas}</span>}
                        {s.nama_asrama && <span>• {s.nama_asrama}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Badge Status Haid */}
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
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "4px 8px",
                          borderRadius: "8px"
                        }}
                      >
                        <Heart size={11} fill="#e11d48" color="#e11d48" />
                        Sedang Haid {s.hari_ke ? `(Hari ke-${s.hari_ke})` : ""}
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
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "4px 8px",
                          borderRadius: "8px"
                        }}
                      >
                        <CheckCircle2 size={11} />
                        Suci
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Detail jika sedang Haid */}
                {isHaid && (
                  <div
                    style={{
                      background: "#fff5f7",
                      borderRadius: "10px",
                      padding: "8px 10px",
                      fontSize: "0.68rem",
                      color: "#9f1239",
                      border: "1px dashed #fecdd3",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Mulai: <strong>{s.tgl_mulai || "-"}</strong> {s.waktu_mulai ? `(${String(s.waktu_mulai).substring(0, 5)} WIB)` : ""}</span>
                      <span>Oleh: {s.dicatat_oleh || "Ustadzah"}</span>
                    </div>
                    {s.haid_keterangan && (
                      <div style={{ color: "#881337", fontStyle: "italic", marginTop: "2px" }}>
                        "{s.haid_keterangan}"
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "8px"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenHistory(s)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                      padding: "4px"
                    }}
                  >
                    <History size={13} />
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
                        padding: "7px 14px",
                        borderRadius: "10px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 3px 8px rgba(16, 185, 129, 0.25)"
                      }}
                    >
                      <Check size={14} strokeWidth={2.5} />
                      <span>Selesai Haid (Bersuci)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenStartModal(s)}
                      style={{
                        background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                        color: "#ffffff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "10px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 3px 8px rgba(219, 39, 119, 0.25)"
                      }}
                    >
                      <Heart size={14} strokeWidth={2.5} />
                      <span>Mulai Haid (Udzur)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: MULAI STATUS HAID
      ========================================================================= */}
      {showStartModal && targetSantri && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "400px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              animation: "scaleUp 0.15s ease"
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #be185d 0%, #db2777 100%)",
                padding: "16px 18px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
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
                onClick={() => setShowStartModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitStartHaid} style={{ padding: "18px" }}>
              <div
                style={{
                  background: "#fdf2f8",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  marginBottom: "14px",
                  border: "1px solid #fce7f3"
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
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  Catatan / Udzur:
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
                    boxSizing: "border-box"
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
                  lineHeight: 1.4
                }}
              >
                ✨ <strong>Catatan Otomasi:</strong> Seluruh jadwal sholat berjamaah harian akan otomatis berstatus <strong>Haid</strong>. Status akan otomatis mati begitu santriwati scan sholat berjamaah.
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "10px",
                    borderRadius: "10px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer"
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
                    boxShadow: "0 4px 10px rgba(219, 39, 119, 0.3)"
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
          MODAL: RIWAYAT SIKLUS HAID
      ========================================================================= */}
      {showHistoryModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "#0f172a",
                padding: "16px 18px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <History size={18} color="#f43f5e" />
                <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800 }}>
                  {selectedSantriHistory
                    ? `Riwayat Siklus: ${selectedSantriHistory.nama_santri}`
                    : "Riwayat Siklus Haid Keseluruhan"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <RotateCw size={22} className="animate-spin" color="#db2777" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Memuat riwayat siklus...</div>
                </div>
              ) : historyList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#64748b", fontSize: "0.78rem" }}>
                  Belum ada riwayat siklus haid yang tercatat.
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
                          borderRadius: "12px",
                          padding: "10px 12px",
                          border: isAktif ? "1px solid #fecdd3" : "1px solid #e2e8f0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
                            {h.nama_santri}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "6px",
                              background: isAktif ? "#e11d48" : "#64748b",
                              color: "#ffffff"
                            }}
                          >
                            {isAktif ? `Aktif (${h.durasi_hari} hari)` : `Selesai (${h.durasi_hari} hari)`}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.68rem", color: "#475569", marginTop: "2px" }}>
                          Mulai: <strong>{h.tgl_mulai}</strong> {h.tgl_selesai ? ` s/d ${h.tgl_selesai}` : " (Berjalan)"}
                        </div>

                        <div style={{ fontSize: "0.62rem", color: "#94a3b8", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                          <span>Dicatat: {h.dicatat_oleh || "-"}</span>
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
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer"
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

