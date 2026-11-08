import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DoorOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RotateCw,
  Users
} from "lucide-react";

export default function OwnerLaporanPerizinan() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("aktif"); // 'aktif' | 'riwayat'
  const [searchTable, setSearchTable] = useState("");

  const [data, setData] = useState({
    totalAktifKeluar: 0,
    santriAktifKeluar: [],
    riwayatIzin: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/owner/perizinan");
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat perizinan owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAktif = (data.santriAktifKeluar || []).filter((iz) => {
    const q = searchTable.toLowerCase();
    return (
      (iz.nama_santri || "").toLowerCase().includes(q) ||
      (iz.kode_izin || "").toLowerCase().includes(q) ||
      (iz.nama_kelas || "").toLowerCase().includes(q) ||
      (iz.keperluan || "").toLowerCase().includes(q)
    );
  });

  const filteredRiwayat = (data.riwayatIzin || []).filter((iz) => {
    const q = searchTable.toLowerCase();
    return (
      (iz.nama_santri || "").toLowerCase().includes(q) ||
      (iz.kode_izin || "").toLowerCase().includes(q) ||
      (iz.nama_kelas || "").toLowerCase().includes(q) ||
      (iz.keperluan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Mini Highlight Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Santri Sedang Berada di Luar</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DoorOpen size={16} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f59e0b" }}>
            {data.totalAktifKeluar} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Status aktif keluar izin resmi
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Total Riwayat Izin Terekam</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#38bdf8" }}>
            {data.riwayatIzin?.length || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Riwayat</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Log kepulangan dan kedisiplinan
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "6px", background: "#0f172a", padding: "4px", borderRadius: "10px", border: "1px solid #334155" }}>
            <button
              onClick={() => setActiveSubTab("aktif")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "aktif" ? "#f59e0b" : "transparent",
                color: activeSubTab === "aktif" ? "#0f172a" : "#94a3b8"
              }}
            >
              Sedang Izin Keluar ({data.totalAktifKeluar})
            </button>
            <button
              onClick={() => setActiveSubTab("riwayat")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "riwayat" ? "#38bdf8" : "transparent",
                color: activeSubTab === "riwayat" ? "#0f172a" : "#94a3b8"
              }}
            >
              Riwayat Izin Selesai ({data.riwayatIzin?.length || 0})
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
              title="Refresh Perizinan"
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

        {/* Content */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.8rem" }}>Memuat status perizinan santri...</div>
          </div>
        ) : (
          <div>
            {/* TABEL SANTRI AKTIF KELUAR */}
            {activeSubTab === "aktif" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>No</th>
                      <th style={{ padding: "10px 14px" }}>Kode &amp; Santri</th>
                      <th style={{ padding: "10px 14px" }}>Kelas &amp; Asrama</th>
                      <th style={{ padding: "10px 14px" }}>Keperluan</th>
                      <th style={{ padding: "10px 14px" }}>Waktu Keluar</th>
                      <th style={{ padding: "10px 14px" }}>Rencana Kembali</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAktif.map((iz, idx) => (
                      <tr key={iz.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#ffffff" }}>{iz.nama_santri}</div>
                          <div style={{ fontSize: "0.68rem", color: "#f59e0b" }}>{iz.kode_izin || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                          <div>{iz.nama_kelas ? `Kelas ${iz.nama_kelas}` : "-"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{iz.nama_asrama || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                          <div style={{ fontWeight: 700 }}>{iz.jenis_izin || "Izin Keluar"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{iz.keperluan || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                          {iz.tgl_keluar_rencana || "-"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#f59e0b", fontWeight: 700 }}>
                          {iz.tgl_kembali_rencana || "-"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", padding: "3px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700 }}>
                            ● Sedang di Luar
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAktif.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          Saat ini tidak ada santri yang sedang izin keluar. Semua berada di komplek pesantren.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABEL RIWAYAT IZIN SELESAI */}
            {activeSubTab === "riwayat" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>No</th>
                      <th style={{ padding: "10px 14px" }}>Nama Santri &amp; Kode</th>
                      <th style={{ padding: "10px 14px" }}>Kelas</th>
                      <th style={{ padding: "10px 14px" }}>Keperluan</th>
                      <th style={{ padding: "10px 14px" }}>Tgl Keluar</th>
                      <th style={{ padding: "10px 14px" }}>Realisasi Kembali</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiwayat.map((iz, idx) => (
                      <tr key={iz.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#ffffff" }}>{iz.nama_santri}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{iz.kode_izin || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                          {iz.nama_kelas ? `Kelas ${iz.nama_kelas}` : "-"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                          <div>{iz.jenis_izin || "Izin"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{iz.keperluan || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>{iz.tgl_keluar || "-"}</td>
                        <td style={{ padding: "10px 14px", color: "#10b981", fontWeight: 700 }}>
                          {iz.tgl_kembali_realisasi || iz.tgl_kembali_rencana || "-"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "3px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700 }}>
                            ✓ Kembali
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredRiwayat.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          Belum ada data riwayat izin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

