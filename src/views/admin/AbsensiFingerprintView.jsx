import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Fingerprint,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCw,
  Search,
  Eye,
  Trash2,
  MapPin,
  Users,
  BookOpen,
  Loader2,
  Calendar,
  CalendarCheck,
  X,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";

export default function AbsensiFingerprintView({ initialType }) {
  const getInitialTabType = () => {
    if (initialType) return initialType;
    const hash = (typeof window !== "undefined" ? window.location.hash : "").toLowerCase();
    if (hash.includes("kegiatan")) return "kegiatan";
    return "berjamaah";
  };

  const [activeTabType, setActiveTabType] = useState(getInitialTabType);
  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedKegiatan, setSelectedKegiatan] = useState("semua");
  const [selectedSantri, setSelectedSantri] = useState("semua");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedStatus, setSelectedStatus] = useState("semua");
  const [selectedDetail, setSelectedDetail] = useState(null);

  useEffect(() => {
    if (initialType) {
      setActiveTabType(initialType);
      setSelectedKegiatan("semua");
    }
  }, [initialType]);

  const getNamaHari = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return days[d.getDay()];
  };

  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      let fetched = null;
      try {
        const res = await axios.get("/api/absensi/fingerprint");
        if (res.data && res.data.success && res.data.data) {
          fetched = res.data.data;
        }
      } catch {
        try {
          const res2 = await axios.get("/api/absensi-fingerprint");
          if (res2.data && res2.data.success && res2.data.data) {
            fetched = res2.data.data;
          }
        } catch {}
      }

      const todayStr = new Date().toISOString().split("T")[0];

      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        const normalized = fetched.map((item, idx) => {
          // Tampilkan nama kegiatan spesifik (contoh: Shalat Shubuh vs Pegon)
          const namaKegiatan = item.nama_kegiatan || item.kegiatan || item.nama_sesi || item.kategori || "Shalat Berjamaah";
          const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/i.test(namaKegiatan);
          const rawTipe = item.tipe_presensi || (isShalat ? "Berjamaah" : "Kegiatan");
          const tipePresensi = rawTipe === "Semua" ? "Semua" : (isShalat ? "Berjamaah" : "Kegiatan");

          return {
            id: item.id || idx + 1,
            santri_id: item.santri_id || null,
            nama_santri: item.nama_santri || "Santri",
            nis: item.nis || "-",
            kegiatan: namaKegiatan,
            tipe_presensi: tipePresensi,
            tanggal: item.tanggal
              ? typeof item.tanggal === "string" && item.tanggal.includes("T")
                ? item.tanggal.split("T")[0]
                : item.tanggal
              : todayStr,
            jam_scan: item.waktu_scan || item.jam_masuk || "-",
            status: item.status || item.status_kehadiran || "Hadir",
            nama_asrama: item.nama_asrama || "-",
            nama_kamar: item.nama_kamar || "-",
            tipe_santri:
              item.tipe_santri || item.status_santri || "Santri Mukim",
            lat_lng: item.lat_lng || "-7.325374, 108.208331",
            metode_scan: item.metode_scan || item.metode_presensi || (tipePresensi === "Berjamaah" ? "Fingerprint" : "Wajah AI"),
            nama_device: item.nama_device || (tipePresensi === "Berjamaah" ? "Mesin MP340" : "NWF Mobile"),
            is_perizinan_auto: item.is_perizinan_auto || false,
          };
        });
        setAbsensiList(normalized);
      } else {
        setAbsensiList([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data absensi:", err);
      setAbsensiList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!row || !row.id) return;
    if (row.is_perizinan_auto || String(row.id).startsWith("izin-")) {
      showError(
        "Perizinan Otomatis",
        "Data presensi ini tersambung otomatis dari modul Perizinan. Hapus data pada menu Perizinan jika ingin membatalkannya."
      );
      return;
    }

    const ok = await showConfirm(
      "Hapus Data Presensi",
      `Yakin ingin menghapus riwayat presensi ${row.nama_santri || "santri"} (${row.kegiatan || "kegiatan"}) pada tanggal ${row.tanggal || "-"}?`,
      "Ya, Hapus",
      "Batal"
    );

    if (ok) {
      try {
        // Hapus langsung dari UI State secara optimistik
        setAbsensiList((prev) => prev.filter((item) => item.id !== row.id));
        if (selectedDetail && selectedDetail.id === row.id) {
          setSelectedDetail(null);
        }

        const res = await axios.delete(`/api/absensi/fingerprint/${row.id}`, {
          data: {
            santri_id: row.santri_id,
            tanggal: row.tanggal,
            waktu_scan: row.jam_scan,
          },
        });

        if (res.data?.success) {
          toastSuccess("Riwayat presensi berhasil dihapus");
          fetchAbsensi();
        } else {
          showError("Gagal", res.data?.message || "Gagal menghapus riwayat presensi");
          fetchAbsensi();
        }
      } catch (err) {
        showError(
          "Gagal Menghapus",
          err.response?.data?.message || err.message || "Terjadi kesalahan saat menghapus data"
        );
        fetchAbsensi();
      }
    }
  };

  useEffect(() => {
    fetchAbsensi();
  }, []);

  const filteredList = absensiList.filter((item) => {
    // 0. Filter Kategori Tab: Presensi Berjamaah (Shalat 5 Waktu) VS Presensi Kegiatan (NWF Mobile)
    if (activeTabType === "berjamaah") {
      if (item.tipe_presensi !== "Berjamaah" && item.tipe_presensi !== "Semua" && !item.is_perizinan_auto) return false;
    } else if (activeTabType === "kegiatan") {
      if (item.tipe_presensi !== "Kegiatan" && item.tipe_presensi !== "Semua" && !item.is_perizinan_auto) return false;
    }

    // 1. Filter Search
    const q = search.toLowerCase();
    if (q) {
      const matchSearch =
        item.nama_santri?.toLowerCase().includes(q) ||
        item.nis?.toLowerCase().includes(q) ||
        item.nama_asrama?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // 2. Filter Kegiatan
    if (selectedKegiatan && selectedKegiatan !== "semua") {
      const keg = (item.kegiatan || "").toLowerCase();
      if (!keg.includes(selectedKegiatan.toLowerCase())) {
        return false;
      }
    }

    // 3. Filter Tipe Santri
    if (selectedSantri && selectedSantri !== "semua") {
      const tipe = (item.tipe_santri || "").toLowerCase();
      if (!tipe.includes(selectedSantri.toLowerCase().replace("santri ", "")))
        return false;
    }

    // 4. Filter Per Tanggal
    if (selectedDate) {
      const itemDate = item.tanggal
        ? typeof item.tanggal === "string" && item.tanggal.includes("T")
          ? item.tanggal.split("T")[0]
          : item.tanggal
        : "";
      if (itemDate && itemDate !== selectedDate) return false;
    }

    // 5. Filter Status
    if (selectedStatus && selectedStatus !== "semua") {
      const st = (item.status || "").toLowerCase();
      if (selectedStatus === "Hadir Tepat Waktu" && st.includes("terlambat"))
        return false;
      if (selectedStatus === "Terlambat" && !st.includes("terlambat"))
        return false;
    }

    return true;
  });

  // Ambil daftar nama kegiatan unik untuk filter dropdown SESUAI TAB YANG AKTIF
  const listForActiveTab = absensiList.filter((item) => {
    if (activeTabType === "berjamaah") return item.tipe_presensi === "Berjamaah" || item.tipe_presensi === "Semua";
    if (activeTabType === "kegiatan") return item.tipe_presensi === "Kegiatan" || item.tipe_presensi === "Semua";
    return true;
  });

  const distinctKegiatan = Array.from(
    new Set(listForActiveTab.map((a) => a.kegiatan).filter(Boolean))
  );

  const totalLog = filteredList.length;
  const hadirTepat = filteredList.filter(
    (x) => !((x.status || "").toLowerCase().includes("terlambat")),
  ).length;
  const terlambat = filteredList.filter((x) =>
    (x.status || "").toLowerCase().includes("terlambat"),
  ).length;
  const totalSantriHadir = new Set(filteredList.map((x) => x.nis || x.nama_santri)).size;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL LOG PRESENSI</div>
            <div className="stat-colored-number">{totalLog}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">HADIR TEPAT WAKTU</div>
            <div className="stat-colored-number">{hadirTepat}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">TERLAMBAT</div>
            <div className="stat-colored-number">{terlambat}</div>
          </div>
          <div className="stat-colored-icon-box">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI HADIR</div>
            <div className="stat-colored-number">{totalSantriHadir}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          {activeTabType === "berjamaah" ? (
            <Fingerprint size={22} className="page-title-icon" style={{ color: "#0284c7" }} />
          ) : (
            <BookOpen size={22} className="page-title-icon" style={{ color: "#059669" }} />
          )}
          <div>
            <h2>
              {activeTabType === "berjamaah"
                ? "Absensi Berjamaah (Shalat 5 Waktu)"
                : "Absensi Mengaji (NWF Mobile)"}
            </h2>
            <p>
              {activeTabType === "berjamaah"
                ? "Pemantauan waktu scan shalat 5 waktu santri otomatis dari mesin fingerprint Solution MP340 & ADMS"
                : "Pemantauan presensi kegiatan santri (Pegon, Tahfidz, Sorogan, dll) dari scan Barcode & Wajah AI Mobile"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline" onClick={fetchAbsensi}>
            <RotateCw size={13} /> Refresh
          </button>
          {activeTabType === "berjamaah" ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                window.location.hash = "setting-shalat";
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <CalendarCheck size={13} /> Setting Shalat
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                window.location.hash = "master-materi";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "#059669",
                borderColor: "#059669"
              }}
            >
              <BookOpen size={13} /> Data Master Kegiatan
            </button>
          )}
        </div>
      </div>

      {/* 3. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, asrama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* SELECT OPTION KEGIATAN */}
        <select
          className="filter-select"
          value={selectedKegiatan}
          onChange={(e) => setSelectedKegiatan(e.target.value)}
          title="Pilih Kegiatan Santri"
          style={{ fontWeight: 600, color: "#0369a1" }}
        >
          <option value="semua">Semua Kegiatan</option>
          {distinctKegiatan.map((kegName) => (
            <option key={kegName} value={kegName}>
              {kegName}
            </option>
          ))}
        </select>

        {/* SELECT SANTRI MUKIM / KALONG */}
        <select
          className="filter-select"
          value={selectedSantri}
          onChange={(e) => setSelectedSantri(e.target.value)}
        >
          <option value="semua">Semua Santri</option>
          <option value="Santri Mukim">Santri Mukim</option>
          <option value="Santri Kalong">Santri Kalong</option>
        </select>

        {/* PER TANGGAL */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="date"
            className="filter-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            title="Filter Tanggal"
            style={{ cursor: "pointer" }}
          />
          {selectedDate && (
            <>
              <span
                className="badge badge-info"
                style={{
                  padding: "5px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  background: "#e0f2fe",
                  color: "#0369a1",
                  border: "1px solid #bae6fd",
                }}
              >
                Hari {getNamaHari(selectedDate)}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedDate("")}
                title="Tampilkan semua tanggal"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  height: "100%",
                }}
              >
                Semua Tgl
              </button>
            </>
          )}
        </div>

        {/* SELECT STATUS */}
        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="semua">Semua Status</option>
          <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
          <option value="Terlambat">Terlambat</option>
          <option value="Belum Scan">Belum Scan</option>
        </select>
      </div>

      {/* 4. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div
            style={{ padding: "30px", textAlign: "center", color: "#64748b" }}
          >
            <Loader2 size={24} className="animate-spin" /> Memuat data
            presensi...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: "45px" }}>
                  NO
                </th>
                <th>NAMA SANTRI &amp; NIS</th>
                <th>KEGIATAN</th>
                <th className="td-center">TANGGAL</th>
                <th className="td-center">JAM SCAN</th>
                <th>LOKASI / DEVICE</th>
                <th className="td-center" style={{ width: "95px" }}>
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "#94a3b8",
                    }}
                  >
                    Tidak ada data presensi yang cocok dengan filter yang
                    dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td
                      className="td-center"
                      style={{ fontWeight: 600, color: "#64748b" }}
                    >
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {row.nama_santri}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        NIS: {row.nis} •{" "}
                        <span style={{ color: "#0284c7" }}>
                          {row.tipe_santri || "Santri Mukim"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge badge-primary"
                        style={{
                          fontSize: "0.74rem",
                          padding: "4px 10px",
                          fontWeight: 700,
                          background: "#ecfdf5",
                          color: "#047857",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        {row.kegiatan || "Shalat Berjamaah"}
                      </span>
                    </td>
                    <td
                      className="td-center"
                      style={{ color: "#0f172a", fontWeight: 500 }}
                    >
                      {row.tanggal
                        ? typeof row.tanggal === "string" &&
                          row.tanggal.includes("T")
                          ? row.tanggal.split("T")[0]
                          : row.tanggal
                        : "-"}
                    </td>
                    <td className="td-center">
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "0.85rem",
                          }}
                        >
                          {row.jam_scan || "-"}
                        </span>
                        <span
                          className={`badge ${
                            (row.status || "").toLowerCase().includes("terlambat")
                              ? "badge-danger"
                              : "badge-success"
                          }`}
                          style={{ fontSize: "0.66rem", padding: "2px 6px" }}
                        >
                          {(row.status || "").toLowerCase().includes("terlambat")
                            ? "Terlambat"
                            : "Tepat Waktu"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#0284c7",
                          fontSize: "0.74rem",
                        }}
                      >
                        <MapPin size={13} />
                        <span>
                          {row.nama_device || row.metode_scan || "Mesin MP340"}
                        </span>
                      </div>
                    </td>
                    <td className="td-center">
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                      >
                        <button
                          className="btn-action btn-action-view"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #a7f3d0",
                            cursor: "pointer",
                          }}
                          title="Detail Presensi"
                          onClick={() => setSelectedDetail(row)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            cursor: "pointer",
                          }}
                          title="Hapus Presensi"
                          onClick={() => handleDelete(row)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selectedDetail && (
        <div 
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDetail(null);
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: "500px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #cbd5e1",
              overflow: "hidden"
            }}
          >
            <div 
              className="modal-header"
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: activeTabType === "berjamaah" 
                  ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" 
                  : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#ffffff"
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {activeTabType === "berjamaah" ? (
                  <Fingerprint size={20} color="#ffffff" />
                ) : (
                  <BookOpen size={20} color="#ffffff" />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 800, color: "#ffffff" }}>
                    Detail Presensi Santri
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.85)" }}>
                    {selectedDetail.kegiatan} • {selectedDetail.tanggal}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                style={{
                  border: "none",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "8px",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Nama Santri</span>
                <span style={{ fontWeight: 800, color: "#0f172a" }}>
                  {selectedDetail.nama_santri}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>NIS Santri</span>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>{selectedDetail.nis}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Kegiatan</span>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: "0.76rem", padding: "3px 8px" }}
                >
                  {selectedDetail.kegiatan}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Tanggal Presensi</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedDetail.tanggal}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Waktu / Jam Scan</span>
                <span style={{ fontWeight: 800, color: "#0284c7", fontSize: "0.95rem" }}>
                  {selectedDetail.jam_scan || selectedDetail.jam_masuk || "-"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Perangkat / Mesin</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {selectedDetail.nama_device || selectedDetail.metode_scan || "Mesin MP340"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Status Kehadiran</span>
                <span
                  className={`badge ${(selectedDetail.status || "").toLowerCase().includes("terlambat") ? "badge-danger" : "badge-success"}`}
                  style={{ fontSize: "0.76rem", padding: "3px 8px" }}
                >
                  {selectedDetail.status}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#64748b" }}>Asrama &amp; Kamar</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedDetail.nama_asrama} - {selectedDetail.nama_kamar}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Lokasi / Geotag</span>
                <span style={{ color: "#0284c7", fontSize: "0.76rem", fontWeight: 600 }}>
                  {selectedDetail.lat_lng}
                </span>
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "14px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #f1f5f9",
                background: "#f8fafc"
              }}
            >
              <button
                className="btn btn-outline"
                style={{
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "8px 14px",
                  borderRadius: "8px"
                }}
                onClick={() => handleDelete(selectedDetail)}
              >
                <Trash2 size={14} /> Hapus Data Presensi
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setSelectedDetail(null)}
                style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 600 }}
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
