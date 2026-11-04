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
  MapPin,
  Users,
  BookOpen,
  Loader2,
  Calendar,
  CalendarCheck,
  X,
} from "lucide-react";

export default function AbsensiFingerprintView() {
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
          // Tampilkan nama kegiatan spesifik (contoh: Shalat Isya, Shalat Subuh, Halaqah, dll)
          const namaKegiatan = item.nama_sesi || item.kegiatan || item.kategori || "Shalat Berjamaah";

          return {
            id: item.id || idx + 1,
            nama_santri: item.nama_santri || "Santri",
            nis: item.nis || "-",
            kegiatan: namaKegiatan,
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
            metode_scan: item.metode_scan || item.metode_presensi || "Fingerprint",
            nama_device: item.nama_device || "Mesin MP340"
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

  useEffect(() => {
    fetchAbsensi();
  }, []);

  const filteredList = absensiList.filter((item) => {
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

  // Ambil daftar nama kegiatan unik untuk filter dropdown
  const distinctKegiatan = Array.from(
    new Set(absensiList.map((a) => a.kegiatan).filter(Boolean))
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
          <Fingerprint
            size={22}
            className="page-title-icon"
            style={{ color: "#0284c7" }}
          />
          <div>
            <h2>Presensi Kegiatan Santri</h2>
            <p>
              Pemantauan waktu check-in, check-out, geolocation, dan foto scan
              presensi per kegiatan &amp; tanggal
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline" onClick={fetchAbsensi}>
            <RotateCw size={13} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.location.hash = "setting-shalat";
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <CalendarCheck size={13} /> Setting Shalat
          </button>
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
                <th className="td-center" style={{ width: "90px" }}>
                  DETAIL
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
                      <button
                        className="btn btn-success btn-sm"
                        title="Detail Presensi"
                        onClick={() => setSelectedDetail(row)}
                      >
                        <Eye size={12} />
                      </button>
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
        <div className="modal-backdrop">
          <div
            className="modal-card"
            style={{ maxWidth: "480px", width: "90%" }}
          >
            <div className="modal-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Fingerprint size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                  Detail Presensi Santri
                </h3>
              </div>
              <button
                className="btn-icon"
                onClick={() => setSelectedDetail(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.82rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Nama Santri</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {selectedDetail.nama_santri}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>NIS</span>
                <span style={{ fontWeight: 600 }}>{selectedDetail.nis}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Kegiatan</span>
                <span
                  className="badge badge-primary"
                  style={{ fontSize: "0.72rem" }}
                >
                  {selectedDetail.kegiatan}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Tanggal</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedDetail.tanggal}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Jam Scan</span>
                <span style={{ fontWeight: 700, color: "#0284c7" }}>
                  {selectedDetail.jam_scan || selectedDetail.jam_masuk || "-"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Perangkat / Mesin</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>
                  {selectedDetail.nama_device || selectedDetail.metode_scan || "Mesin MP340"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Status Kehadiran</span>
                <span
                  className={`badge ${selectedDetail.status?.includes("Tepat") ? "badge-success" : "badge-danger"}`}
                >
                  {selectedDetail.status}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "6px",
                }}
              >
                <span style={{ color: "#64748b" }}>Asrama &amp; Kamar</span>
                <span>
                  {selectedDetail.nama_asrama} - {selectedDetail.nama_kamar}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Lokasi / Geotag</span>
                <span style={{ color: "#0284c7", fontSize: "0.74rem" }}>
                  {selectedDetail.lat_lng}
                </span>
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "10px 20px",
                display: "flex",
                justifyContent: "flex-end",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => setSelectedDetail(null)}
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
