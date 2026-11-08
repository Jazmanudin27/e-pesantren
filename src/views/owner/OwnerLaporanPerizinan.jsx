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
  Users,
  ShieldAlert,
  ArrowRight
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* 1. GATE STATUS BANNER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
        <div style={{ background: "linear-gradient(145deg, #241c10 0%, #1a1309 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(245, 158, 11, 0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#facc15", textTransform: "uppercase" }}>
              SANTRI SEDANG IZIN DI LUAR
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DoorOpen size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.totalAktifKeluar} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fef08a", marginTop: "6px" }}>
            Monitoring gerbang &amp; barcode perizinan aktif
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
              TOTAL LOG PERIZINAN TEREKAM
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.riwayatIzin?.length || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Riwayat</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bae6fd", marginTop: "6px" }}>
            Kepatuhan jam kembali santri
          </div>
        </div>
      </div>

      {/* 2. MAIN TABLE CARD WITH SUB-TAB CONTROLS */}
      <div
        style={{
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(51, 65, 85, 0.8)"
        }}
      >
        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          
          <div style={{ display: "flex", gap: "6px", background: "rgba(15, 23, 42, 0.85)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
            <button
              onClick={() => setActiveSubTab("aktif")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "aktif" ? "#f59e0b" : "transparent",
                color: activeSubTab === "aktif" ? "#0f172a" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Sedang Izin Keluar ({data.totalAktifKeluar})
            </button>

            <button
              onClick={() => setActiveSubTab("riwayat")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "riwayat" ? "#38bdf8" : "transparent",
                color: activeSubTab === "riwayat" ? "#0f172a" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Riwayat Izin Kembali ({data.riwayatIzin?.length || 0})
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
                  border: "1px solid rgba(71, 85, 105, 0.8)",
                  borderRadius: "10px",
                  padding: "8px 12px 8px 32px",
                  fontSize: "0.78rem",
                  color: "#ffffff",
                  outline: "none",
                  width: "180px"
                }}
              />
              <Search size={14} color="#64748b" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            <button
              onClick={fetchData}
              title="Refresh Perizinan"
              style={{
                background: "#0f172a",
                border: "1px solid rgba(71, 85, 105, 0.8)",
                borderRadius: "10px",
                padding: "8px 12px",
                color: "#38bdf8",
                cursor: "pointer"
              }}
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#38bdf8" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Memuat status perizinan santri...</div>
          </div>
        ) : (
          <div>
            {/* 1. TABEL SANTRI SEDANG IZIN DI LUAR */}
            {activeSubTab === "aktif" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 14px" }}>No</th>
                      <th style={{ padding: "12px 14px" }}>Kode &amp; Nama Santri</th>
                      <th style={{ padding: "12px 14px" }}>Kelas &amp; Asrama</th>
                      <th style={{ padding: "12px 14px" }}>Jenis &amp; Keperluan</th>
                      <th style={{ padding: "12px 14px" }}>Waktu Keluar</th>
                      <th style={{ padding: "12px 14px" }}>Target Kembali</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Status Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAktif.map((iz, idx) => (
                      <tr 
                        key={iz.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#ffffff" }}>{iz.nama_santri}</div>
                          <div style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700 }}>{iz.kode_izin || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                          <div>{iz.nama_kelas ? `Kelas ${iz.nama_kelas}` : "-"}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{iz.nama_asrama || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#cbd5e1" }}>{iz.jenis_izin || "Izin Keluar"}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{iz.keperluan || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>
                          {iz.tgl_keluar_rencana || "-"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#facc15", fontWeight: 800 }}>
                          {iz.tgl_kembali_rencana || "-"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#facc15", padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#facc15" }} />
                            Sedang di Luar
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAktif.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Alhamdulillah! Tidak ada santri yang sedang izin keluar saat ini. Semua berada di komplek asrama pesantren.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. TABEL RIWAYAT IZIN KEMBALI */}
            {activeSubTab === "riwayat" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 14px" }}>No</th>
                      <th style={{ padding: "12px 14px" }}>Kode &amp; Nama Santri</th>
                      <th style={{ padding: "12px 14px" }}>Kelas</th>
                      <th style={{ padding: "12px 14px" }}>Keperluan</th>
                      <th style={{ padding: "12px 14px" }}>Waktu Keluar</th>
                      <th style={{ padding: "12px 14px" }}>Waktu Kembali</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiwayat.map((iz, idx) => (
                      <tr 
                        key={iz.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#ffffff" }}>{iz.nama_santri}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{iz.kode_izin || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                          {iz.nama_kelas ? `Kelas ${iz.nama_kelas}` : "-"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>
                          <div style={{ fontWeight: 700 }}>{iz.jenis_izin || "Izin"}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{iz.keperluan || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>{iz.tgl_keluar || "-"}</td>
                        <td style={{ padding: "12px 14px", color: "#10b981", fontWeight: 800 }}>
                          {iz.tgl_kembali_realisasi || iz.tgl_kembali_rencana || "-"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981" }} />
                            Kembali Tertib
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredRiwayat.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada riwayat perizinan yang tersimpan.
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
