import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Building,
  GraduationCap,
  RotateCw,
  Search,
  PieChart,
  UserCheck
} from "lucide-react";

export default function OwnerLaporanSantri() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("kelas"); // 'kelas' | 'asrama'
  const [searchTable, setSearchTable] = useState("");

  const [data, setData] = useState({
    demografi: {
      total: 0,
      putra: 0,
      putri: 0
    },
    rombelKelas: [],
    sebaranAsrama: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/owner/santri");
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat demografi santri owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredKelas = (data.rombelKelas || []).filter((k) => {
    const q = searchTable.toLowerCase();
    return (
      (k.nama_kelas || "").toLowerCase().includes(q) ||
      (k.tingkat || "").toLowerCase().includes(q) ||
      (k.wali_kelas || "").toLowerCase().includes(q)
    );
  });

  const filteredAsrama = (data.sebaranAsrama || []).filter((a) => {
    const q = searchTable.toLowerCase();
    return (
      (a.nama_asrama || "").toLowerCase().includes(q) ||
      (a.pembina || "").toLowerCase().includes(q)
    );
  });

  const totalS = data.demografi?.total || 0;
  const putraS = data.demografi?.putra || 0;
  const putriS = data.demografi?.putri || 0;
  const putraPct = totalS > 0 ? Math.round((putraS / totalS) * 100) : 0;
  const putriPct = totalS > 0 ? Math.round((putriS / totalS) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* 1. VISUAL DEMOGRAPHY BREAKDOWN BANNER */}
      <div
        style={{
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)",
          border: "1px solid rgba(51, 65, 85, 0.8)",
          borderRadius: "18px",
          padding: "18px 24px",
          boxShadow: "0 6px 20px -4px rgba(0,0,0,0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#ffffff" }}>
              Sebaran Populasi Santri Mukim Pesantren
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
              Total <strong>{totalS} santri aktif</strong> di komplek asrama putra &amp; putri
            </div>
          </div>
          <div style={{ display: "flex", gap: "16px", textAlign: "right" }}>
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#38bdf8" }}>{putraPct}%</span>
              <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "4px" }}>Putra</span>
            </div>
            <div>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#ec4899" }}>{putriPct}%</span>
              <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "4px" }}>Putri</span>
            </div>
          </div>
        </div>

        {/* Gender Distribution Bar */}
        <div style={{ width: "100%", height: "12px", background: "#0f172a", borderRadius: "999px", overflow: "hidden", display: "flex", border: "1px solid rgba(51, 65, 85, 0.6)" }}>
          <div style={{ width: `${putraPct}%`, height: "100%", background: "#38bdf8", boxShadow: "0 0 10px rgba(56, 189, 248, 0.6)" }} title={`Putra: ${putraS}`} />
          <div style={{ width: `${putriPct}%`, height: "100%", background: "#ec4899", boxShadow: "0 0 10px rgba(236, 72, 153, 0.6)" }} title={`Putri: ${putriS}`} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.72rem" }}>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>● Santri Putra (Ikhwan): {putraS} Santri</span>
          <span style={{ color: "#ec4899", fontWeight: 700 }}>● Santri Putri (Akhwat): {putriS} Santri</span>
        </div>
      </div>

      {/* 2. 3 METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>TOTAL SANTRI AKTIF</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff" }}>
            {totalS} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bae6fd", marginTop: "6px" }}>
            Data resmi di database pesantren
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>SANTRI PUTRA (IKHWAN)</span>
            <UserCheck size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#38bdf8" }}>
            {putraS} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bae6fd", marginTop: "6px" }}>
            Asrama &amp; Komplek Putra
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #261122 0%, #1a0a17 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(236, 72, 153, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#ec4899", textTransform: "uppercase" }}>SANTRI PUTRI (AKHWAT)</span>
            <UserCheck size={18} color="#ec4899" />
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ec4899" }}>
            {putriS} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fbcfe8", marginTop: "6px" }}>
            Asrama &amp; Komplek Putri
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE CARD */}
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
              onClick={() => setActiveSubTab("kelas")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "kelas" ? "#38bdf8" : "transparent",
                color: activeSubTab === "kelas" ? "#0f172a" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Rombel Kelas ({data.rombelKelas?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("asrama")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "asrama" ? "#10b981" : "transparent",
                color: activeSubTab === "asrama" ? "#0f172a" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Sebaran Asrama ({data.sebaranAsrama?.length || 0})
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari kelas / asrama..."
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

        {/* Content Table */}
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#38bdf8" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Memuat demografi santri...</div>
          </div>
        ) : (
          <div>
            {/* 1. TABEL ROMBEL KELAS */}
            {activeSubTab === "kelas" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 16px" }}>No</th>
                      <th style={{ padding: "12px 16px" }}>Nama Kelas</th>
                      <th style={{ padding: "12px 16px" }}>Tingkat Pendidikan</th>
                      <th style={{ padding: "12px 16px" }}>Wali Kelas / Guru Pengampu</th>
                      <th style={{ padding: "12px 16px" }}>Keterangan</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Jumlah Santri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKelas.map((kls, idx) => (
                      <tr 
                        key={kls.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 900, color: "#ffffff", fontSize: "0.84rem" }}>
                          Kelas {kls.nama_kelas}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#38bdf8", fontWeight: 700 }}>
                          {kls.tingkat || "Reguler"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                          {kls.wali_kelas || "Ustadz Pengampu"}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                          {kls.keterangan || "Aktif"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "4px 12px", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 900 }}>
                            {kls.total_santri || 0} Santri
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredKelas.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data rombel kelas tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. TABEL SEBARAN ASRAMA */}
            {activeSubTab === "asrama" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 16px" }}>No</th>
                      <th style={{ padding: "12px 16px" }}>Nama Komplek Gedung Asrama</th>
                      <th style={{ padding: "12px 16px" }}>Pembina / Musyrif Asrama</th>
                      <th style={{ padding: "12px 16px", textAlign: "center" }}>Kapasitas Santri Mukim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAsrama.map((asr, idx) => (
                      <tr 
                        key={asr.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 900, color: "#ffffff", fontSize: "0.84rem" }}>
                          {asr.nama_asrama}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#cbd5e1" }}>
                          {asr.pembina || "Ustadz Pembina"}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(56, 189, 248, 0.2)", border: "1px solid rgba(56, 189, 248, 0.4)", color: "#38bdf8", padding: "4px 12px", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 900 }}>
                            {asr.total_santri || 0} Santri
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAsrama.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada data asrama tercatat.
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
