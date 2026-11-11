import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  Search,
  CheckCircle2,
  Calendar,
  User,
  RotateCw,
  MessageSquare,
  Check,
  ArrowLeft,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";
import MobileLoadingState from "../../components/MobileLoadingState";

const SEVERITY_CONFIG = {
  Ringan: {
    label: "Ringan",
    color: "#d97706",
    bg: "#fef3c7",
    softBg: "#fffbeb",
    border: "#fcd34d",
    accent: "#f59e0b",
    Icon: AlertCircle,
  },
  Sedang: {
    label: "Sedang",
    color: "#ea580c",
    bg: "#ffedd5",
    softBg: "#fff7ed",
    border: "#fdba74",
    accent: "#f97316",
    Icon: AlertTriangle,
  },
  Berat: {
    label: "Berat",
    color: "#be123c",
    bg: "#ffe4e6",
    softBg: "#fff1f2",
    border: "#fda4af",
    accent: "#e11d48",
    Icon: ShieldAlert,
  },
};

const STATUS_TAZIR_OPTIONS = [
  {
    value: "Belum Dikerjakan",
    label: "Belum Dikerjakan",
    color: "#be123c",
    bg: "#ffe4e6",
    border: "#fda4af",
  },
  {
    value: "Sedang Proses",
    label: "Sedang Proses",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fcd34d",
  },
  {
    value: "Selesai Ta'zir",
    label: "Selesai Ta'zir",
    color: "#047857",
    bg: "#d1fae5",
    border: "#6ee7b7",
  },
];

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getSessionActorName = () => {
  try {
    const sess = JSON.parse(
      localStorage.getItem("desktop_session") ||
        sessionStorage.getItem("desktop_session") ||
        localStorage.getItem("mobile_session") ||
        "{}",
    );
    return (
      sess?.nama ||
      sess?.nama_asatidz ||
      sess?.nama_lengkap ||
      sess?.username ||
      "Ustadz / Musyrif"
    );
  } catch (e) {
    return "Ustadz / Musyrif";
  }
};

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDateId = (val) => {
  if (!val) return "-";
  try {
    const clean = String(val).split("T")[0];
    const [y, m, d] = clean.split("-");
    if (!y || !m || !d) return clean;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return `${Number(d)} ${months[Number(m) - 1] || m} ${y}`;
  } catch (e) {
    return String(val);
  }
};

export default function MobileTataTertib() {
  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [submitting, setSubmitting] = useState(false);

  const actorName = useMemo(() => getSessionActorName(), []);

  const buildInitialForm = (defaultSantriId = "") => ({
    id: null,
    santri_id: defaultSantriId,
    tanggal: getTodayDateStr(),
    kategori: "Ringan",
    jenis_pelanggaran: "",
    poin_pelanggaran: 0,
    bentuk_tazir: "Membaca Surat Yasin & Istighfar",
    status_tazir: "Belum Dikerjakan",
    musyrif_pencatat: actorName,
    wa_notif_wali: 1,
  });

  const [formData, setFormData] = useState(() => buildInitialForm(""));

  const fetchSantriOptions = async () => {
    try {
      const resS = await axios
        .get("/api/santri/for-face-registration")
        .catch(() =>
          axios.get("/api/santri?all=true&compact=true&without_photo=true"),
        )
        .catch(() => ({ data: { data: [] } }));
      if (resS.data && Array.isArray(resS.data.data)) {
        setSantriOptions(resS.data.data);
      }
    } catch (e) {
      console.warn("Notice loading santri options:", e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const resP = await axios
        .get("/api/pelanggaran")
        .catch(() => ({ data: { data: [] } }));

      if (resP.data && Array.isArray(resP.data.data)) {
        setPelanggaranList(resP.data.data);
      } else {
        setPelanggaranList([]);
      }
    } catch (err) {
      console.warn("Gagal memuat pelanggaran dari server:", err);
      setPelanggaranList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSantriOptions();
  }, []);

  const summary = useMemo(() => {
    const total = pelanggaranList.length;
    const belum = pelanggaranList.filter(
      (i) => i.status_tazir !== "Selesai Ta'zir",
    ).length;
    const selesai = total - belum;
    const ringan = pelanggaranList.filter(
      (i) => (i.kategori || "Ringan") === "Ringan",
    ).length;
    const sedang = pelanggaranList.filter(
      (i) => i.kategori === "Sedang",
    ).length;
    const berat = pelanggaranList.filter((i) => i.kategori === "Berat").length;
    return { total, belum, selesai, ringan, sedang, berat };
  }, [pelanggaranList]);

  const handleOpenAdd = () => {
    if (!santriOptions.length) fetchSantriOptions();
    setFormMode("add");
    setFormData(buildInitialForm(""));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    if (!santriOptions.length) fetchSantriOptions();
    const kat = SEVERITY_CONFIG[item.kategori] ? item.kategori : "Ringan";
    setFormMode("edit");
    setFormData({
      id: item.id,
      santri_id: item.santri_id || "",
      tanggal: item.tanggal
        ? String(item.tanggal).split("T")[0]
        : getTodayDateStr(),
      kategori: kat,
      jenis_pelanggaran: item.jenis_pelanggaran || "",
      poin_pelanggaran: 0,
      bentuk_tazir: item.bentuk_tazir || "",
      status_tazir: item.status_tazir || "Belum Dikerjakan",
      musyrif_pencatat: item.musyrif_pencatat || actorName,
      wa_notif_wali:
        item.wa_notif_wali !== undefined ? Number(item.wa_notif_wali) : 1,
    });
    setIsModalOpen(true);
  };

  const handleSelectSeverity = (kat) => {
    setFormData((prev) => ({
      ...prev,
      kategori: kat,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.santri_id) {
      showError(
        "Santri Belum Dipilih",
        "Silakan pilih nama santri terlebih dahulu.",
      );
      return;
    }
    if (!String(formData.jenis_pelanggaran || "").trim()) {
      showError("Pelanggaran Kosong", "Silakan isi jenis pelanggaran santri.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        santri_id: Number(formData.santri_id),
        jenis_pelanggaran: String(formData.jenis_pelanggaran).trim(),
        poin_pelanggaran: Math.max(0, Number(formData.poin_pelanggaran) || 0),
        bentuk_tazir: String(formData.bentuk_tazir || "-").trim(),
        musyrif_pencatat: String(formData.musyrif_pencatat || actorName).trim(),
        wa_notif_wali: formData.wa_notif_wali ? 1 : 0,
      };

      const res =
        formMode === "add"
          ? await axios.post("/api/pelanggaran", payload)
          : await axios.put(`/api/pelanggaran/${formData.id}`, payload);

      if (res.data?.success) {
        toastSuccess(
          formMode === "add"
            ? "Catatan pelanggaran tersimpan"
            : "Catatan pelanggaran diperbarui",
        );
        setIsModalOpen(false);
        fetchData();
      } else {
        showError(
          "Gagal Menyimpan",
          res.data?.message || "Server menolak permintaan.",
        );
      }
    } catch (err) {
      showError(
        "Gagal Menyimpan",
        err.response?.data?.message ||
          err.message ||
          "Terjadi gangguan koneksi ke server.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      "Apakah Anda yakin ingin menghapus catatan pelanggaran ini?",
      "Ya, Hapus",
      "Batal",
    );
    if (!confirmed) return;
    try {
      await axios.delete(`/api/pelanggaran/${id}`);
      toastSuccess("Catatan pelanggaran dihapus");
      fetchData();
    } catch (err) {
      showError(
        "Gagal Menghapus",
        err.response?.data?.message || "Tidak dapat menghapus catatan.",
      );
    }
  };

  const handleMarkDone = async (id) => {
    try {
      await axios.post(`/api/pelanggaran/selesai/${id}`);
      toastSuccess("Ta'zir ditandai selesai");
      fetchData();
    } catch (err) {
      showError(
        "Gagal Memperbarui",
        "Tidak dapat menyelesaikan status ta'zir.",
      );
    }
  };

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return pelanggaranList.filter((item) => {
      if (
        activeFilter === "Belum Selesai" &&
        item.status_tazir === "Selesai Ta'zir"
      ) {
        return false;
      }
      if (
        activeFilter === "Selesai" &&
        item.status_tazir !== "Selesai Ta'zir"
      ) {
        return false;
      }
      if (
        (activeFilter === "Ringan" ||
          activeFilter === "Sedang" ||
          activeFilter === "Berat") &&
        (item.kategori || "Ringan") !== activeFilter
      ) {
        return false;
      }
      if (!q) return true;
      const fields = [
        item.nama_santri,
        item.nis,
        item.nama_asrama,
        item.jenis_pelanggaran,
        item.bentuk_tazir,
        item.musyrif_pencatat,
      ];
      return fields.some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(q),
      );
    });
  }, [pelanggaranList, searchQuery, activeFilter]);

  const selectedSantriObj = useMemo(
    () =>
      santriOptions.find((s) => Number(s.id) === Number(formData.santri_id)) ||
      null,
    [santriOptions, formData.santri_id],
  );

  const filterTabs = [
    { key: "Semua", label: "Semua", count: summary.total },
    { key: "Belum Selesai", label: "Belum Selesai", count: summary.belum },
    { key: "Ringan", label: "Ringan", count: summary.ringan },
    { key: "Sedang", label: "Sedang", count: summary.sedang },
    { key: "Berat", label: "Berat", count: summary.berat },
    { key: "Selesai", label: "Selesai", count: summary.selesai },
  ];

  return (
    <div
      style={{
        padding: "14px 14px 96px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* HERO SUMMARY & QUICK INPUT CTA */}
      <div
        style={{
          background: "linear-gradient(135deg, #be123c 0%, #881337 100%)",
          borderRadius: "20px",
          padding: "16px",
          color: "#ffffff",
          boxShadow: "0 10px 24px -6px rgba(190, 18, 60, 0.38)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-24px",
            top: "-24px",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
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
                borderRadius: "13px",
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={20} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                Kedisiplinan Santri
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  marginTop: "2px",
                }}
              >
                Catatan pelanggaran &amp; pembinaan ta'zir
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "9px 13px",
              background: "#ffffff",
              color: "#be123c",
              fontWeight: 800,
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
              flexShrink: 0,
            }}
          >
            <Plus size={15} strokeWidth={2.8} />
            <span>Catat</span>
          </button>
        </div>

        {/* 3 Stat Tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.13)",
              borderRadius: "12px",
              padding: "9px 8px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            <div
              style={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1.1 }}
            >
              {summary.total}
            </div>
            <div
              style={{
                fontSize: "0.64rem",
                opacity: 0.85,
                marginTop: "3px",
                fontWeight: 600,
              }}
            >
              Total Kasus
            </div>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.13)",
              borderRadius: "12px",
              padding: "9px 8px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#fde68a",
              }}
            >
              {summary.belum}
            </div>
            <div
              style={{
                fontSize: "0.64rem",
                opacity: 0.85,
                marginTop: "3px",
                fontWeight: 600,
              }}
            >
              Proses Ta'zir
            </div>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.13)",
              borderRadius: "12px",
              padding: "9px 8px",
              textAlign: "center",
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                lineHeight: 1.1,
                color: "#a7f3d0",
              }}
            >
              {summary.selesai}
            </div>
            <div
              style={{
                fontSize: "0.64rem",
                opacity: 0.85,
                marginTop: "3px",
                fontWeight: 600,
              }}
            >
              Selesai
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + REFRESH BAR */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "13px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Cari nama santri, pelanggaran, ta'zir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "11px 34px 11px 38px",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              fontSize: "0.82rem",
              background: "#ffffff",
              color: "#0f172a",
              boxSizing: "border-box",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "#f1f5f9",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={fetchData}
          title="Muat Ulang Data"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
          }}
        >
          <RotateCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* FILTER PILLS */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          paddingBottom: "2px",
          scrollbarWidth: "none",
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              style={{
                border: isActive ? "1px solid #be123c" : "1px solid #e2e8f0",
                background: isActive ? "#be123c" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "0.73rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: "999px",
                  background: isActive ? "rgba(255,255,255,0.22)" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LIST PELANGGARAN */}
      {loading ? (
        <MobileLoadingState
          title="Memuat Kedisiplinan..."
          subtitle="Mengambil catatan pelanggaran dan status ta'zir santri..."
          iconColor="#be123c"
        />
      ) : filteredList.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "36px 18px",
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              background: "#ecfdf5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <ShieldCheck size={28} color="#059669" />
          </div>
          <div
            style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}
          >
            {activeFilter === "Semua" && !searchQuery
              ? "Kedisiplinan Terjaga Baik"
              : "Tidak Ada Catatan Sesuai Filter"}
          </div>
          <div
            style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px" }}
          >
            {activeFilter === "Semua" && !searchQuery
              ? "Belum ada pelanggaran santri yang tercatat."
              : "Coba ubah kata kunci atau filter kategori."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredList.map((item) => {
            const sev =
              SEVERITY_CONFIG[item.kategori] || SEVERITY_CONFIG.Ringan;
            const SevIcon = sev.Icon;
            const isDone = item.status_tazir === "Selesai Ta'zir";

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${isDone ? "#10b981" : sev.accent}`,
                  boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)",
                }}
              >
                {/* Header Row: Avatar + Santri + Severity & Poin */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                    marginBottom: "10px",
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
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        background: sev.bg,
                        color: sev.color,
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(item.nama_santri)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.nama_santri || "Santri"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                          marginTop: "2px",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <Calendar size={11} />
                          {formatDateId(item.tanggal)}
                        </span>
                        {item.nama_asrama && <span>• {item.nama_asrama}</span>}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        background: sev.bg,
                        color: sev.color,
                        border: `1px solid ${sev.border}`,
                      }}
                    >
                      <SevIcon size={11} />
                      {item.kategori || "Ringan"}
                    </span>
                  </div>
                </div>

                {/* Jenis Pelanggaran Box */}
                {item.jenis_pelanggaran && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#1e293b",
                      marginBottom: "8px",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.jenis_pelanggaran}
                  </div>
                )}

                {/* Ta'zir Box */}
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "#334155",
                    background: isDone ? "#f0fdf4" : sev.softBg,
                    border: `1px solid ${isDone ? "#bbf7d0" : sev.border}`,
                    padding: "9px 11px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: isDone ? "#15803d" : sev.color,
                      }}
                    >
                      Pembinaan / Ta'zir
                    </span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: isDone ? "#dcfce7" : "#ffffff",
                        color: isDone ? "#15803d" : sev.color,
                        border: `1px solid ${isDone ? "#86efac" : sev.border}`,
                      }}
                    >
                      {item.status_tazir || "Belum Dikerjakan"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#0f172a",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.bentuk_tazir || "-"}
                  </div>
                  {item.musyrif_pencatat && (
                    <div
                      style={{
                        fontSize: "0.67rem",
                        color: "#64748b",
                        marginTop: "5px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <User size={11} />
                      <span>Pencatat: {item.musyrif_pencatat}</span>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div
                  style={{
                    display: "flex",
                    gap: "7px",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "9px",
                  }}
                >
                  {!isDone ? (
                    <button
                      type="button"
                      onClick={() => handleMarkDone(item.id)}
                      style={{
                        padding: "7px 11px",
                        borderRadius: "10px",
                        border: "1px solid #bbf7d0",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "0.73rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Selesai Ta'zir
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Check size={14} />
                      Ta'zir Tuntas
                    </span>
                  )}

                  <div
                    style={{ display: "flex", gap: "6px", marginLeft: "auto" }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      style={{
                        padding: "7px 11px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        color: "#334155",
                        fontSize: "0.73rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: "pointer",
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: "7px 11px",
                          borderRadius: "10px",
                          border: "1px solid #fecdd3",
                          background: "#fff1f2",
                          color: "#be123c",
                          fontSize: "0.73rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INPUT & EDIT PELANGGARAN (FULL SCREEN MODERN) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#f8fafc",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
          }}
        >
          {/* Sticky Full-Screen Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #be123c 0%, #881337 100%)",
              padding: "14px 16px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(136, 19, 55, 0.25)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "11px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div
                  style={{ fontSize: "0.65rem", opacity: 0.9, fontWeight: 700 }}
                >
                  {formMode === "add"
                    ? "FORM INPUT KEDISIPLINAN"
                    : "EDIT CATATAN KEDISIPLINAN"}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.98rem",
                    fontWeight: 900,
                  }}
                >
                  {formMode === "add"
                    ? "Catat Pelanggaran Santri"
                    : "Edit Catatan Pelanggaran"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "none",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
              }}
            >
              <X size={17} />
            </button>
          </div>
          <form
            onSubmit={handleSave}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              maxWidth: "640px",
              width: "100%",
              margin: "0 auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* 1. PILIH SANTRI */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "14px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                1. Pilih Santri *
              </label>
              <SearchableSelect
                options={santriOptions.map((s) => ({
                  value: s.id,
                  label: s.nama_santri,
                  sublabel:
                    [
                      s.nis ? `NIS: ${s.nis}` : null,
                      s.nama_kelas || null,
                      s.nama_asrama || null,
                    ]
                      .filter(Boolean)
                      .join(" • ") || null,
                }))}
                value={formData.santri_id}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    santri_id: val ? Number(val) : "",
                  })
                }
                placeholder="-- Cari & Pilih Nama Santri --"
                searchPlaceholder="Ketik nama santri atau NIS..."
                triggerStyle={{
                  width: "100%",
                  padding: "11px 12px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.84rem",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              />
              {selectedSantriObj && (
                <div
                  style={{
                    marginTop: "7px",
                    padding: "8px 11px",
                    borderRadius: "11px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "9px",
                      background: "#ffe4e6",
                      color: "#be123c",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(selectedSantriObj.nama_santri)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {selectedSantriObj.nama_santri}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      {[
                        selectedSantriObj.nis
                          ? `NIS ${selectedSantriObj.nis}`
                          : null,
                        selectedSantriObj.nama_kelas,
                        selectedSantriObj.nama_asrama,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Santri Aktif"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TINGKAT KATEGORI (INTERACTIVE CARDS TANPA POIN) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                2. Tingkat Pelanggaran
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                {Object.keys(SEVERITY_CONFIG).map((key) => {
                  const cfg = SEVERITY_CONFIG[key];
                  const Icon = cfg.Icon;
                  const selected = formData.kategori === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectSeverity(key)}
                      style={{
                        padding: "11px 6px",
                        borderRadius: "13px",
                        border: selected
                          ? `2px solid ${cfg.accent}`
                          : "1.5px solid #e2e8f0",
                        background: selected ? cfg.bg : "#ffffff",
                        color: selected ? cfg.color : "#64748b",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: "0.77rem", fontWeight: 800 }}>
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. JENIS PELANGGARAN */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                3. Jenis Pelanggaran *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Tulis detail pelanggaran santri..."
                value={formData.jenis_pelanggaran}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    jenis_pelanggaran: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.83rem",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* 4. BENTUK TA'ZIR */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                4. Bentuk Ta'zir / Pembinaan *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: Membaca Surat Yasin & Kebersihan Halaman"
                value={formData.bentuk_tazir}
                onChange={(e) =>
                  setFormData({ ...formData, bentuk_tazir: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.83rem",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
            </div>

            {/* 5. TANGGAL KEJADIAN */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                5. Tanggal Kejadian
              </label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px 11px",
                  borderRadius: "12px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 6. STATUS TA'ZIR SEGMENTED PILLS */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Status Pembinaan Ta'zir
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                }}
              >
                {STATUS_TAZIR_OPTIONS.map((opt) => {
                  const active = formData.status_tazir === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, status_tazir: opt.value })
                      }
                      style={{
                        padding: "8px 4px",
                        borderRadius: "11px",
                        border: active
                          ? `1.5px solid ${opt.border}`
                          : "1px solid #e2e8f0",
                        background: active ? opt.bg : "#ffffff",
                        color: active ? opt.color : "#64748b",
                        fontSize: "0.69rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. TOGGLE WA NOTIFIKASI WALI */}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  wa_notif_wali: formData.wa_notif_wali ? 0 : 1,
                })
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "11px 12px",
                borderRadius: "13px",
                border: formData.wa_notif_wali
                  ? "1.5px solid #86efac"
                  : "1px solid #e2e8f0",
                background: formData.wa_notif_wali ? "#f0fdf4" : "#f8fafc",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "9px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: formData.wa_notif_wali ? "#dcfce7" : "#e2e8f0",
                    color: formData.wa_notif_wali ? "#15803d" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    Kirim Notifikasi WA ke Wali
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#64748b" }}>
                    {formData.wa_notif_wali
                      ? "Aktif: orang tua langsung mendapat pemberitahuan"
                      : "Nonaktif: hanya tercatat di sistem"}
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "40px",
                  height: "22px",
                  borderRadius: "999px",
                  background: formData.wa_notif_wali ? "#10b981" : "#cbd5e1",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    position: "absolute",
                    top: "2px",
                    left: formData.wa_notif_wali ? "20px" : "2px",
                    transition: "left 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
            </button>

            {/* ACTION BUTTONS */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "4px",
                paddingBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "13px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: "0.84rem",
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
                  padding: "13px",
                  borderRadius: "13px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  cursor: submitting ? "wait" : "pointer",
                  boxShadow: "0 6px 16px rgba(190, 18, 60, 0.3)",
                }}
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                <span>{submitting ? "Menyimpan..." : "Simpan Catatan"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) */}
      <button
        type="button"
        onClick={handleOpenAdd}
        title="Catat Pelanggaran Santri Baru"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "84px",
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
          color: "#ffffff",
          border: "2px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 10px 24px rgba(190, 18, 60, 0.42)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 90,
        }}
      >
        <Plus size={26} />
      </button>
    </div>
  );
}
