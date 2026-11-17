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
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (PERSIS DATA MASTER SANTRI) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored" style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", border: "1px solid #e11d48" }}>
          <div>
            <div className="stat-colored-title">SEDANG HAID (UDZUR)</div>
            <div className="stat-colored-number">{summary.sedang_haid || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Heart size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SUCI / NORMAL</div>
            <div className="stat-colored-number">{summary.suci || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TOTAL SANTRIWATI</div>
            <div className="stat-colored-number">{summary.total_santriwati || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <User size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">RIWAYAT SIKLUS TERCATAT</div>
            <div className="stat-colored-number">{historyList.length || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <History size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Heart size={22} className="page-title-icon" style={{ color: "#e11d48" }} />
          <div>
            <h2>Manajemen Siklus Haid Santriwati</h2>
            <p>Otomatisasi dispensasi ibadah sholat berjamaah &amp; pencatatan siklus bulanan santriwati</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (activeTab === "riwayat") fetchRiwayat();
              else fetchData();
            }}
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenStartModal(null)}
            style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", borderColor: "#e11d48" }}
          >
            <Plus size={14} /> + Catat Haid Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button
          className={`tab-btn ${activeTab === "haid" ? "active" : ""}`}
          onClick={() => setActiveTab("haid")}
          style={activeTab === "haid" ? { background: "#e11d48", borderColor: "#e11d48", color: "#ffffff" } : {}}
        >
          <Heart size={14} /> Sedang Haid ({summary.sedang_haid || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "suci" ? "active" : ""}`}
          onClick={() => setActiveTab("suci")}
          style={activeTab === "suci" ? { background: "#10b981", borderColor: "#10b981", color: "#ffffff" } : {}}
        >
          <CheckCircle2 size={14} /> Suci / Normal ({summary.suci || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === "riwayat" ? "active" : ""}`}
          onClick={() => setActiveTab("riwayat")}
        >
          <History size={14} /> Riwayat Siklus
        </button>
      </div>

      {/* 4. FILTER SEARCH BOX */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder={activeTab === "riwayat" ? "Cari riwayat nama/nis..." : "Cari santriwati haid / nis..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {activeTab !== "riwayat" && (
          <SearchableSelect
            style={{ minWidth: "160px", flex: "1 1 150px", maxWidth: "240px" }}
            value={selectedKelas === "semua" ? "Semua Kelas" : selectedKelas}
            onChange={(val) => setSelectedKelas(val === "Semua Kelas" ? "semua" : val)}
            placeholder="Semua Kelas"
            options={[
              { value: "Semua Kelas", label: `Semua Kelas (${kelasList.length})` },
              ...kelasList.map((k) => ({ value: k, label: `Kelas ${k}` }))
            ]}
          />
        )}
      </div>

      {/* INFO BANNER OTOMATISASI */}
      <div style={{
        background: "#fff1f2",
        border: "1px solid #fecdd3",
        borderRadius: "8px",
        padding: "10px 14px",
        marginBottom: "14px",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <Sparkles size={18} color="#e11d48" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "0.78rem", color: "#9f1239", lineHeight: 1.5 }}>
          <strong>Otomatisasi Sistem Presensi:</strong> Selama status Haid <strong>ON</strong>, santriwati setiap hari otomatis tercatat berstatus <strong>Haid</strong> pada presensi sholat berjamaah tanpa terhitung alfa. Saat santriwati scan fingerprint / dideteksi presensi normal, status haid otomatis di-OFF-kan dan kembali <strong>Hadir</strong>.
        </div>
      </div>

      {/* 5. DATA TABLE (PERSIS DATA MASTER SANTRI) */}
      <div className="table-container-card">
        {activeTab !== "riwayat" ? (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: "45px" }}>NO</th>
                <th>SANTRIWATI &amp; NIS</th>
                <th>KELAS &amp; ASRAMA</th>
                <th className="td-center">STATUS SAAT INI</th>
                <th className="td-center">MULAI HAID</th>
                <th className="td-center">DURASI HARI</th>
                <th className="td-center" style={{ width: "160px" }}>AKSI</th>
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
                    <Heart size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, color: "#334155" }}>Tidak ada data santriwati yang sesuai kriteria</div>
                  </td>
                </tr>
              ) : (
                currentList.map((s, idx) => {
                  const isHaid = s.status_haid === "Haid" || s.is_haid;

                  return (
                    <tr
                      key={s.id}
                      className={isHaid ? "row-haid" : ""}
                    >
                      <td className="td-center" style={{ color: "#64748b", fontWeight: 700 }}>
                        {idx + 1}
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                          {s.nama_santri}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          NIS: {s.nis || "-"}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: "#334155" }}>
                          {s.nama_kelas || "-"}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                          {s.nama_asrama || "-"} {s.nama_kamar ? `• K. ${s.nama_kamar}` : ""}
                        </div>
                      </td>

                      <td className="td-center">
                        {isHaid ? (
                          <span className="badge" style={{
                            background: "#ffe4e6",
                            color: "#be123c",
                            border: "1px solid #fecdd3",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <Heart size={11} fill="#e11d48" /> SEDANG HAID
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{
                            fontSize: "0.7rem",
                            padding: "3px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <CheckCircle2 size={11} /> SUCI / NORMAL
                          </span>
                        )}
                      </td>

                      <td className="td-center" style={{ color: "#475569", fontWeight: 600 }}>
                        {s.tgl_mulai_haid ? new Date(s.tgl_mulai_haid).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>

                      <td className="td-center">
                        {isHaid && s.hari_ke ? (
                          <span className="badge" style={{
                            background: "#fff1f2",
                            border: "1px solid #fed7aa",
                            color: "#c2410c",
                            fontWeight: 900,
                            fontSize: "0.72rem",
                            padding: "3px 8px"
                          }}>
                            Hari ke-{s.hari_ke}
                          </span>
                        ) : "-"}
                      </td>

                      <td className="td-center">
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "center" }}>
                          {isHaid ? (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleSelesaiHaid(s)}
                              style={{
                                background: "#10b981",
                                color: "#ffffff",
                                border: "none",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title="Tandai telah selesai masa haid (suci)"
                            >
                              <Check size={12} /> Selesai
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => handleOpenStartModal(s)}
                              style={{
                                background: "#ffe4e6",
                                color: "#be123c",
                                border: "1px solid #fecdd3",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title="Catat santriwati mulai berstatus haid"
                            >
                              <Heart size={12} /> Mulai Haid
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-action btn-action-view"
                            onClick={() => handleOpenSantriHistory(s)}
                            title="Lihat riwayat siklus santriwati ini"
                          >
                            <History size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* TABEL RIWAYAT SIKLUS HAID */
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: "45px" }}>NO</th>
                <th>SANTRIWATI &amp; NIS</th>
                <th>KELAS &amp; ASRAMA</th>
                <th className="td-center">TANGGAL MULAI</th>
                <th className="td-center">TANGGAL SELESAI</th>
                <th className="td-center">TOTAL DURASI</th>
                <th className="td-center">STATUS SIKLUS</th>
                <th>KETERANGAN</th>
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
                    <History size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, color: "#334155" }}>Belum ada riwayat siklus haid yang tercatat</div>
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
                      <tr key={h.id || idx}>
                        <td className="td-center" style={{ color: "#64748b", fontWeight: 700 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: "#0f172a" }}>{h.nama_santri}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>NIS: {h.nis || "-"}</div>
                        </td>
                        <td>
                          <div>{h.nama_kelas || "-"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{h.nama_asrama || "-"}</div>
                        </td>
                        <td className="td-center" style={{ color: "#0f172a", fontWeight: 700 }}>
                          {h.tgl_mulai ? new Date(h.tgl_mulai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                        </td>
                        <td className="td-center" style={{ color: "#0f172a", fontWeight: 700 }}>
                          {h.tgl_selesai ? new Date(h.tgl_selesai).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-"}
                        </td>
                        <td className="td-center">
                          <span className="badge" style={{
                            fontWeight: 900,
                            color: isStillActive ? "#be123c" : "#047857",
                            background: isStillActive ? "#fff1f2" : "#ecfdf5",
                            padding: "2px 8px",
                            border: isStillActive ? "1px solid #fecdd3" : "1px solid #a7f3d0"
                          }}>
                            {h.durasi_hari ? `${h.durasi_hari} Hari` : isStillActive ? "Sedang Berjalan" : "-"}
                          </span>
                        </td>
                        <td className="td-center">
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
                        <td style={{ color: "#64748b", fontSize: "0.74rem" }}>
                          {h.keterangan || "Udzur Syar'i"}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
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

