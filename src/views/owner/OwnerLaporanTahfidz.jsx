import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Award,
  Sparkles,
  Search,
  RotateCw,
  CheckCircle2,
  Calendar,
  Trophy,
  Flame,
  Star
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* 1. HERO MILESTONE HIGHLIGHT CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(234, 179, 8, 0.15) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.35)",
          borderRadius: "20px",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 8px 25px -4px rgba(0,0,0,0.35)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.1rem", color: "#facc15", fontFamily: "'Amiri', serif", fontWeight: 700 }}>
              وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ
            </span>
            <span style={{ background: "rgba(168, 85, 247, 0.25)", color: "#c084fc", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>
              Tahfidz Boarding
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#ffffff" }}>
            Capaian &amp; Progres Hafalan Al-Qur'an Santri
          </h2>
          <p style={{ margin: "3px 0 0", fontSize: "0.76rem", color: "#94a3b8" }}>
            Monitoring rutin setoran harian (Ziyadah &amp; Muroja'ah) bersama para Asatidz pengampu halaqah.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "14px", padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8" }}>RATA-RATA CAPAIAN</div>
            <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#c084fc", marginTop: "2px" }}>
              {data.avgJuz} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Juz</span>
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(234, 179, 8, 0.4)", borderRadius: "14px", padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fde047" }}>TELAH KHATAM 30 JUZ</div>
            <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#facc15", marginTop: "2px" }}>
              {data.sebaranJuz?.khatam_30 || 0} <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Santri</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4 SEBARAN KELOMPOK JUZ CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>JUZ 1 - 5</span>
            <BookOpen size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_1_5 || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bae6fd", marginTop: "6px" }}>
            Tahap awal &amp; tahsin bacaan
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #132220 0%, #0c1a17 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>JUZ 6 - 10</span>
            <Sparkles size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_6_10 || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#a7f3d0", marginTop: "6px" }}>
            Tahap pertengahan
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #241c10 0%, #1a1309 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#facc15", textTransform: "uppercase" }}>JUZ 11 - 20</span>
            <Award size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_11_20 || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fef08a", marginTop: "6px" }}>
            Tahap pemantapan &amp; muroja'ah
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #251419 0%, #1a0b10 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase" }}>JUZ 21 - 30 (KHATAM)</span>
            <Trophy size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {data.sebaranJuz?.juz_21_30 || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fecdd3", marginTop: "6px" }}>
            Target khatam 30 juz
          </div>
        </div>
      </div>

      {/* 3. LOG SETORAN TAHFIDZ TERBARU TABLE */}
      <div
        style={{
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(51, 65, 85, 0.8)"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={17} color="#10b981" />
            <span>Log Setoran Hafalan Santri Terverifikasi ({filteredSetoran.length})</span>
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
                  border: "1px solid rgba(71, 85, 105, 0.8)",
                  borderRadius: "10px",
                  padding: "8px 12px 8px 32px",
                  fontSize: "0.78rem",
                  color: "#ffffff",
                  outline: "none",
                  width: "190px"
                }}
              />
              <Search size={14} color="#64748b" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            <button
              onClick={fetchData}
              title="Refresh Data"
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

        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#38bdf8" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Memuat riwayat setoran tahfidz...</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: "12px 14px" }}>No</th>
                  <th style={{ padding: "12px 14px" }}>Santri &amp; Rombel</th>
                  <th style={{ padding: "12px 14px" }}>Tanggal Setoran</th>
                  <th style={{ padding: "12px 14px" }}>Juz &amp; Surat</th>
                  <th style={{ padding: "12px 14px" }}>Rentang Ayat</th>
                  <th style={{ padding: "12px 14px" }}>Ustadz Pengampu</th>
                  <th style={{ padding: "12px 14px", textAlign: "center" }}>Penilaian Tajwid</th>
                </tr>
              </thead>
              <tbody>
                {filteredSetoran.map((setor, idx) => (
                  <tr 
                    key={setor.id || idx} 
                    style={{ 
                      borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                      background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                    }}
                  >
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, color: "#ffffff" }}>{setor.nama_santri}</div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{setor.nama_kelas ? `Kelas ${setor.nama_kelas}` : "-"} • {setor.nama_asrama || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>{setor.tanggal || "-"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontWeight: 800, color: "#10b981", fontSize: "0.84rem" }}>Juz {setor.juz}</span>
                      <div style={{ fontSize: "0.7rem", color: "#cbd5e1", fontWeight: 600 }}>{setor.surat_mulai || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                      Ayat {setor.ayat_mulai || 1} s/d {setor.ayat_selesai || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#cbd5e1", fontWeight: 600 }}>
                      {setor.nama_asatidz || "-"}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background:
                            setor.kualitas_tajwid === "Mumtaz" || setor.kualitas_tajwid === "Sangat Baik"
                              ? "rgba(16, 185, 129, 0.2)"
                              : setor.kualitas_tajwid === "Jayyid Jiddan" || setor.kualitas_tajwid === "Baik"
                              ? "rgba(56, 189, 248, 0.2)"
                              : "rgba(245, 158, 11, 0.2)",
                          border:
                            setor.kualitas_tajwid === "Mumtaz" || setor.kualitas_tajwid === "Sangat Baik"
                              ? "1px solid rgba(16, 185, 129, 0.4)"
                              : setor.kualitas_tajwid === "Jayyid Jiddan" || setor.kualitas_tajwid === "Baik"
                              ? "1px solid rgba(56, 189, 248, 0.4)"
                              : "1px solid rgba(245, 158, 11, 0.4)",
                          color:
                            setor.kualitas_tajwid === "Mumtaz" || setor.kualitas_tajwid === "Sangat Baik"
                              ? "#10b981"
                              : setor.kualitas_tajwid === "Jayyid Jiddan" || setor.kualitas_tajwid === "Baik"
                              ? "#38bdf8"
                              : "#f59e0b",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 800
                        }}
                      >
                        <Star size={10} fill="currentColor" />
                        {setor.kualitas_tajwid || "Baik"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSetoran.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      Belum ada catatan setoran tahfidz.
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
