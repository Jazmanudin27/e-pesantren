import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShieldAlert,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  RotateCw,
  User,
  AlertTriangle,
  X,
  Send,
  Calendar,
  Sparkles,
  Filter,
  Check,
  AlertCircle,
} from "lucide-react";
import { toastSuccess, toastError } from "../../utils/alert.util";

export default function PengajarTeguranView() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua"); // 'Semua' | 'Belum' | 'Selesai'
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    santri_id: "",
    tanggal: new Date().toISOString().split("T")[0],
    kategori: "Ringan",
    jenis_pelanggaran: "",
    poin_pelanggaran: 5,
    bentuk_tazir: "Membaca Surat Yasin & Istighfar",
    status_tazir: "Belum Dikerjakan",
    musyrif_pencatat: "Ustadz Pengajar",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resTeguran, resSantri] = await Promise.all([
        axios.get("/api/pengajar/teguran"),
        axios.get("/api/pengajar/santri"),
      ]);

      if (resTeguran.data?.success) {
        setList(resTeguran.data.data || []);
      }
      if (resSantri.data?.success) {
        setSantriList(resSantri.data.data || []);
      }
    } catch (e) {
      toastError("Gagal memuat catatan teguran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleKategoriChange = (kat) => {
    let poin = 5;
    let tazir = "Membaca Surat Yasin & Istighfar";
    if (kat === "Sedang") {
      poin = 10;
      tazir = "Membersihkan Masjid / Area Halaqah & Hafalan 1 Halaman";
    } else if (kat === "Berat") {
      poin = 25;
      tazir = "Pemanggilan Wali Santri & Ta'zir Khusus Dewan Asatidz";
    }
    setFormData((prev) => ({
      ...prev,
      kategori: kat,
      poin_pelanggaran: poin,
      bentuk_tazir: tazir,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.jenis_pelanggaran) {
      toastError("Pilih santri dan isi jenis pelanggaran!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/api/pengajar/teguran", formData);
      if (res.data?.success) {
        toastSuccess("Catatan teguran santri berhasil disimpan!");
        setShowForm(false);
        setFormData({
          santri_id: "",
          tanggal: new Date().toISOString().split("T")[0],
          kategori: "Ringan",
          jenis_pelanggaran: "",
          poin_pelanggaran: 5,
          bentuk_tazir: "Membaca Surat Yasin & Istighfar",
          status_tazir: "Belum Dikerjakan",
          musyrif_pencatat: "Ustadz Pengajar",
        });
        fetchData();
      }
    } catch (err) {
      toastError(
        "Gagal menyimpan teguran: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/pengajar/teguran/${id}/status`, {
        status_tazir: newStatus,
      });
      if (res.data?.success) {
        toastSuccess("Status ta'zir berhasil diperbarui!");
        setList((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status_tazir: newStatus } : item,
          ),
        );
      }
    } catch (e) {
      toastError("Gagal memperbarui status ta'zir");
    }
  };

  // Stats calculation
  const totalKasus = list.length;
  const belumSelesai = list.filter(
    (i) =>
      i.status_tazir !== "Selesai Dikerjakan" && i.status_tazir !== "Selesai",
  ).length;
  const selesai = list.filter(
    (i) =>
      i.status_tazir === "Selesai Dikerjakan" || i.status_tazir === "Selesai",
  ).length;
  const totalPoin = list.reduce(
    (acc, i) => acc + (parseInt(i.poin_pelanggaran, 10) || 0),
    0,
  );

  const filteredList = list.filter((item) => {
    const isDone =
      item.status_tazir === "Selesai Dikerjakan" ||
      item.status_tazir === "Selesai";
    if (statusFilter === "Belum" && isDone) return false;
    if (statusFilter === "Selesai" && !isDone) return false;

    const q = search.toLowerCase();
    return (
      (item.nama_santri || "").toLowerCase().includes(q) ||
      (item.jenis_pelanggaran || "").toLowerCase().includes(q) ||
      (item.nama_kelas || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* 1. TOP EXECUTIVE CARD: JUDUL & TOMBOL TAMBAH */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "14px 16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #fecaca",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.15)",
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.92rem",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.2px",
              }}
            >
              Catatan Teguran &amp; Ta'zir
            </div>
            <div style={{ fontSize: "0.64rem", color: "#64748b" }}>
              Kedisiplinan santri, adab asrama &amp; pembinaan
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
            border: "none",
            color: "#ffffff",
            padding: "7px 14px",
            borderRadius: "10px",
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.28)",
          }}
        >
          <Plus size={15} /> Catat Teguran
        </button>
      </div>

      {/* 2. STATS 4 BADGES COUNTER (LUXURY EXECUTIVE STYLE IDENTIK OWNER) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {/* Total Kasus */}
        <div
          onClick={() => setStatusFilter("Semua")}
          style={{
            background:
              statusFilter === "Semua"
                ? "linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)"
                : "#ffffff",
            border:
              statusFilter === "Semua"
                ? "1.5px solid #94a3b8"
                : "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#475569",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldAlert size={14} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#1e293b",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {totalKasus}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#64748b",
              marginTop: "2px",
            }}
          >
            Total Kasus
          </div>
        </div>

        {/* Belum Ta'zir */}
        <div
          onClick={() => setStatusFilter("Belum")}
          style={{
            background:
              statusFilter === "Belum"
                ? "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)"
                : "#fff7ed",
            border:
              statusFilter === "Belum"
                ? "1.5px solid #f87171"
                : "1px solid #fed7aa",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(239, 68, 68, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#ea580c",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(234, 88, 12, 0.3)",
            }}
          >
            <Clock size={13} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#c2410c",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {belumSelesai}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#9a3412",
              marginTop: "2px",
            }}
          >
            Proses
          </div>
        </div>

        {/* Selesai Ta'zir */}
        <div
          onClick={() => setStatusFilter("Selesai")}
          style={{
            background:
              statusFilter === "Selesai"
                ? "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)"
                : "#f0fdf4",
            border:
              statusFilter === "Selesai"
                ? "1.5px solid #4ade80"
                : "1px solid #bbf7d0",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
            }}
          >
            <CheckCircle2 size={14} strokeWidth={2.8} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#15803d",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {selesai}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#166534",
              marginTop: "2px",
            }}
          >
            Selesai
          </div>
        </div>

        {/* Total Poin */}
        <div
          style={{
            background: "linear-gradient(145deg, #fef2f2 0%, #ffe4e6 100%)",
            border: "1px solid #fecdd3",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(225, 29, 72, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#e11d48",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(225, 29, 72, 0.3)",
            }}
          >
            <AlertCircle size={14} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#be123c",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {totalPoin}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#9f1239",
              marginTop: "2px",
            }}
          >
            Total Poin
          </div>
        </div>
      </div>

      {/* 3. SEARCH BOX & FILTER STATUS */}
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "10px",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Cari santri / jenis teguran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
              fontSize: "0.75rem",
              outline: "none",
              background: "#ffffff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {statusFilter !== "Semua" && (
          <button
            type="button"
            onClick={() => setStatusFilter("Semua")}
            style={{
              background: "#e2e8f0",
              border: "none",
              borderRadius: "10px",
              padding: "0 10px",
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* 4. MODAL FORM INPUT TEGURAN (EXECUTIVE GLASS EFFECT) */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(5px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              boxShadow: "0 25px 35px -5px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShieldAlert size={16} />
                </div>
                <div
                  style={{
                    fontSize: "0.94rem",
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  Catat Teguran Santri
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "8px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  PILIH SANTRI *
                </label>
                <select
                  required
                  value={formData.santri_id}
                  onChange={(e) =>
                    setFormData({ ...formData, santri_id: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.78rem",
                    background: "#ffffff",
                    outline: "none",
                    fontWeight: 600,
                  }}
                >
                  <option value="">-- Pilih Santri Penerima Teguran --</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_santri} ({s.nama_kelas || "Santri"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori Pilihan (Pill Buttons) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  TINGKAT PELANGGARAN &amp; POIN
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "6px",
                  }}
                >
                  {[
                    {
                      label: "Ringan",
                      poin: "5 Poin",
                      color: "#10b981",
                      bg: "#ecfdf5",
                      border: "#a7f3d0",
                    },
                    {
                      label: "Sedang",
                      poin: "10 Poin",
                      color: "#f59e0b",
                      bg: "#fffbeb",
                      border: "#fde68a",
                    },
                    {
                      label: "Berat",
                      poin: "25 Poin",
                      color: "#dc2626",
                      bg: "#fef2f2",
                      border: "#fecaca",
                    },
                  ].map((k) => (
                    <button
                      key={k.label}
                      type="button"
                      onClick={() => handleKategoriChange(k.label)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "10px",
                        border:
                          formData.kategori === k.label
                            ? `2px solid ${k.color}`
                            : "1px solid #e2e8f0",
                        background:
                          formData.kategori === k.label ? k.bg : "#ffffff",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          color: k.color,
                        }}
                      >
                        {k.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.6rem",
                          color: "#64748b",
                          marginTop: "1px",
                        }}
                      >
                        +{k.poin}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  TANGGAL KEJADIAN
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.78rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  JENIS TEGURAN / PELANGGARAN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Terlambat halaqah subuh / tidak membawa kitab"
                  value={formData.jenis_pelanggaran}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jenis_pelanggaran: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.78rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  BENTUK TA'ZIR / SANKSI PEMBINAAN
                </label>
                <input
                  type="text"
                  value={formData.bentuk_tazir}
                  onChange={(e) =>
                    setFormData({ ...formData, bentuk_tazir: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.78rem",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.75rem",
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
                    padding: "8px 18px",
                    borderRadius: "10px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: submitting ? "wait" : "pointer",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Teguran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. LIST RIWAYAT TEGURAN (EXECUTIVE POLISHED CARD) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "30px", color: "#64748b" }}
          >
            <RotateCw
              size={22}
              className="animate-spin"
              color="#dc2626"
              style={{ margin: "0 auto 8px" }}
            />
            <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              Memuat catatan teguran...
            </div>
          </div>
        ) : filteredList.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "28px",
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "0.78rem",
            }}
          >
            Alhamdulillah, belum ada catatan teguran santri.
          </div>
        ) : (
          filteredList.map((item) => {
            const isDone =
              item.status_tazir === "Selesai Dikerjakan" ||
              item.status_tazir === "Selesai";
            const initial = (item.nama_santri || "S").charAt(0).toUpperCase();

            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "12px 14px",
                  border: isDone ? "1px solid #e2e8f0" : "1px solid #fed7aa",
                  boxShadow: isDone
                    ? "0 2px 6px rgba(0,0,0,0.02)"
                    : "0 4px 12px rgba(234, 88, 12, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Header Item: Avatar Monogram + Nama Santri + Poin */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: isDone ? "#ecfdf5" : "#fef2f2",
                        color: isDone ? "#059669" : "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "0.86rem",
                        border: isDone
                          ? "1px solid #a7f3d0"
                          : "1px solid #fecaca",
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>

                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 900,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.nama_santri}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                        {item.nama_kelas || "Santri Binaan"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "6px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                      }}
                    >
                      +{item.poin_pelanggaran || 5} Poin
                    </span>

                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "2px 7px",
                        borderRadius: "6px",
                        background: isDone ? "#ecfdf5" : "#fff7ed",
                        color: isDone ? "#059669" : "#c2410c",
                        border: isDone
                          ? "1px solid #a7f3d0"
                          : "1px solid #fed7aa",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      {isDone ? "Selesai" : "Belum"}
                    </span>
                  </div>
                </div>

                {/* Pelanggaran Detail */}
                <div
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    padding: "4px 0 2px",
                  }}
                >
                  {item.jenis_pelanggaran}
                </div>

                {/* Ta'zir Sanksi Box */}
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    border: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.64rem",
                      color: "#475569",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#0f172a" }}>
                      Bentuk Ta'zir:
                    </span>{" "}
                    {item.bentuk_tazir || "-"}
                  </div>

                  {!isDone && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(item.id, "Selesai Dikerjakan")
                      }
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        color: "#ffffff",
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                      }}
                    >
                      <Check size={11} strokeWidth={3} /> Selesai
                    </button>
                  )}
                </div>

                {/* Footer Card */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.58rem",
                    color: "#94a3b8",
                  }}
                >
                  <span>Tgl: {item.tanggal}</span>
                  <span>
                    Pencatat: {item.musyrif_pencatat || "Ustadz Pengajar"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
