import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCw,
  Calendar,
  Layers,
  Users
} from "lucide-react";

export default function OwnerLaporanPresensi() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("hari_ini");
  const [searchTable, setSearchTable] = useState("");

  const [data, setData] = useState({
    summary: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persen: 0
    },
    rekapPerSesi: [],
    logPresensi: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/owner/presensi?periode=${periode}`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat presensi owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periode]);

  const filteredLogs = (data.logPresensi || []).filter((p) => {
    const q = searchTable.toLowerCase();
    return (
      (p.nama_santri || "").toLowerCase().includes(q) ||
      (p.nis || "").toLowerCase().includes(q) ||
      (p.nama_kelas || "").toLowerCase().includes(q) ||
      (p.nama_kegiatan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 4 Attendance Status KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#10b981", marginBottom: "4px" }}>
            ✓ HADIR ({data.summary.persen}%)
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.summary.hadir} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Hadir tepat waktu & verifikasi
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f59e0b", marginBottom: "4px" }}>
            ✚ SAKIT
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.summary.sakit} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Istirahat / Poskestren
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}>
            ✉ IZIN PULANG / KELUAR
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.summary.izin} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Perizinan resmi tercatat
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f43f5e", marginBottom: "4px" }}>
            ⚠ ALFA / BELUM SCAN
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.summary.alfa} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Perlu pengawasan musyrif
          </div>
        </div>
      </div>

      {/* Grid: Rekap Per Sesi & Tabel Log Presensi */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
        {/* Rekap Per Sesi / Kegiatan Mengaji */}
        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#ffffff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="#38bdf8" />
            <span>Rekap Kehadiran per Kegiatan Shalat &amp; Mengaji ({periode === 'hari_ini' ? 'Hari Ini' : periode === 'tahun_ini' ? 'Tahun Ini' : 'Bulan Ini'})</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
            {(data.rekapPerSesi || []).map((sesi, idx) => (
              <div key={idx} style={{ background: "#0f172a", borderRadius: "12px", padding: "12px 14px", border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.82rem" }}>{sesi.nama_kegiatan}</span>
                  <span style={{ fontSize: "0.66rem", background: sesi.tipe_presensi === 'Kegiatan' ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.2)", color: sesi.tipe_presensi === 'Kegiatan' ? "#10b981" : "#38bdf8", padding: "2px 7px", borderRadius: "999px", fontWeight: 700 }}>
                    {sesi.tipe_presensi || "Berjamaah"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", fontSize: "0.72rem", color: "#94a3b8" }}>
                  <span style={{ color: "#10b981" }}>Hadir: <strong>{sesi.jml_hadir}</strong></span>
                  <span style={{ color: "#f59e0b" }}>Sakit: <strong>{sesi.jml_sakit}</strong></span>
                  <span style={{ color: "#38bdf8" }}>Izin: <strong>{sesi.jml_izin}</strong></span>
                  <span style={{ color: "#f43f5e" }}>Alfa: <strong>{sesi.jml_alfa}</strong></span>
                </div>
              </div>
            ))}
            {(data.rekapPerSesi || []).length === 0 && (
              <div style={{ color: "#64748b", fontSize: "0.78rem", padding: "12px", textAlign: "center" }}>
                Belum ada data presensi pada periode ini.
              </div>
            )}
          </div>
        </div>

        {/* Tabel Log Presensi Detail */}
        <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
          {/* Header & Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} color="#10b981" />
              <span>Log Presensi Santri ({filteredLogs.length})</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  color: "#ffffff",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="hari_ini">Hari Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
              </select>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Cari santri..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "6px 10px 6px 28px",
                    fontSize: "0.76rem",
                    color: "#ffffff",
                    outline: "none",
                    width: "160px"
                  }}
                />
                <Search size={13} color="#64748b" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }} />
              </div>

              <button
                onClick={fetchData}
                title="Refresh Presensi"
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  color: "#94a3b8",
                  cursor: "pointer"
                }}
              >
                <RotateCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              <RotateCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.8rem" }}>Memuat log presensi...</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px" }}>No</th>
                    <th style={{ padding: "10px 14px" }}>Nama Santri</th>
                    <th style={{ padding: "10px 14px" }}>Kelas &amp; Asrama</th>
                    <th style={{ padding: "10px 14px" }}>Kegiatan</th>
                    <th style={{ padding: "10px 14px" }}>Waktu Scan</th>
                    <th style={{ padding: "10px 14px" }}>Metode</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 800, color: "#ffffff" }}>
                        {log.nama_santri}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                        <div>{log.nama_kelas ? `Kelas ${log.nama_kelas}` : "-"}</div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{log.nama_asrama || "-"}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#38bdf8", fontWeight: 700 }}>
                        {log.nama_kegiatan}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                        <div>{log.tanggal}</div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{log.waktu_scan || "-"} WIB</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                        {log.metode_presensi || "Fingerprint"}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            background:
                              log.status === "Hadir"
                                ? "rgba(16, 185, 129, 0.2)"
                                : log.status === "Sakit"
                                ? "rgba(245, 158, 11, 0.2)"
                                : "rgba(244, 63, 94, 0.2)",
                            color:
                              log.status === "Hadir"
                                ? "#10b981"
                                : log.status === "Sakit"
                                ? "#f59e0b"
                                : "#f43f5e",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            fontSize: "0.68rem",
                            fontWeight: 700
                          }}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                        Tidak ada catatan log presensi pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

