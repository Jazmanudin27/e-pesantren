import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Award,
  Sparkles,
  Search,
  RotateCw,
  CheckCircle2,
  Calendar
} from "lucide-react";

export default function OwnerLaporanTahfidz() {
  const [loading, setLoading] = useState(true);
  const [searchTable, setSearchTable] = useState("");

  const [data, setData] = useState({
    avgJuz: "0.0",
    sebaranJuz: {
      juz_1_5: 0,
      juz_6_10: 0,
      juz_11_20: 0,
      juz_21_30: 0,
      khatam_30: 0
    },
    setoranTerbaru: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/owner/tahfidz");
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat tahfidz owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSetoran = (data.setoranTerbaru || []).filter((s) => {
    const q = searchTable.toLowerCase();
    return (
      (s.nama_santri || "").toLowerCase().includes(q) ||
      (s.nis || "").toLowerCase().includes(q) ||
      (s.nama_kelas || "").toLowerCase().includes(q) ||
      (s.surat_mulai || "").toLowerCase().includes(q) ||
      (s.nama_asatidz || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 5 Milestone / Sebaran Juz Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#94a3b8", marginBottom: "4px" }}>
            RATA-RATA HAFALAN
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#10b981" }}>
            {data.avgJuz} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Juz / Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Capaian rata-rata santri aktif
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#38bdf8", marginBottom: "4px" }}>
            JUZ 1 - 5
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_1_5 || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Tahap awal & pembiasaan
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#a855f7", marginBottom: "4px" }}>
            JUZ 6 - 10
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_6_10 || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Tahap menengah
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f59e0b", marginBottom: "4px" }}>
            JUZ 11 - 20
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_11_20 || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            Tahap lanjutan
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f43f5e", marginBottom: "4px" }}>
            JUZ 21 - 30 (KHATAM)
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#f43f5e" }}>
            {data.sebaranJuz?.juz_21_30 || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
            {data.sebaranJuz?.khatam_30 || 0} Santri telah khatam 30 Juz
          </div>
        </div>
      </div>

      {/* Main Table: Log Setoran Tahfidz Terbaru */}
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <div style={{ fontSize: "0.86rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={16} color="#10b981" />
            <span>Log Setoran Hafalan Santri ({filteredSetoran.length})</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari santri / surat..."
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
                  width: "180px"
                }}
              />
              <Search size={13} color="#64748b" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            <button
              onClick={fetchData}
              title="Refresh Setoran"
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

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.8rem" }}>Memuat riwayat setoran tahfidz...</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>No</th>
                  <th style={{ padding: "10px 14px" }}>Santri &amp; Kelas</th>
                  <th style={{ padding: "10px 14px" }}>Tanggal</th>
                  <th style={{ padding: "10px 14px" }}>Juz &amp; Surat</th>
                  <th style={{ padding: "10px 14px" }}>Ayat</th>
                  <th style={{ padding: "10px 14px" }}>Pembimbing</th>
                  <th style={{ padding: "10px 14px", textAlign: "center" }}>Kualitas Tajwid</th>
                </tr>
              </thead>
              <tbody>
                {filteredSetoran.map((setor, idx) => (
                  <tr key={setor.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 800, color: "#ffffff" }}>{setor.nama_santri}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{setor.nama_kelas ? `Kelas ${setor.nama_kelas}` : "-"} • {setor.nama_asrama || "-"}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>{setor.tanggal || "-"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 800, color: "#10b981" }}>Juz {setor.juz}</span>
                      <div style={{ fontSize: "0.68rem", color: "#cbd5e1" }}>{setor.surat_mulai || "-"}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                      Ayat {setor.ayat_mulai || 1} - {setor.ayat_selesai || "-"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                      {setor.nama_asatidz || "-"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span
                        style={{
                          background:
                            setor.kualitas_tajwid === "Mumtaz" || setor.kualitas_tajwid === "Sangat Baik"
                              ? "rgba(16, 185, 129, 0.2)"
                              : setor.kualitas_tajwid === "Jayyid Jiddan" || setor.kualitas_tajwid === "Baik"
                              ? "rgba(56, 189, 248, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                          color:
                            setor.kualitas_tajwid === "Mumtaz" || setor.kualitas_tajwid === "Sangat Baik"
                              ? "#10b981"
                              : setor.kualitas_tajwid === "Jayyid Jiddan" || setor.kualitas_tajwid === "Baik"
                              ? "#38bdf8"
                              : "#f59e0b",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          fontSize: "0.68rem",
                          fontWeight: 700
                        }}
                      >
                        {setor.kualitas_tajwid || "Baik"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSetoran.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                      Belum ada riwayat setoran tahfidz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

