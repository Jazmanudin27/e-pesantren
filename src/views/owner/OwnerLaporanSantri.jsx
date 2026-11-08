import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Building,
  GraduationCap,
  RotateCw,
  Search
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 3 Metric Cards Demografi */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Total Santri Terdaftar Aktif</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff" }}>
            {data.demografi?.total || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Status aktif di database pesantren
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8" }}>Santri Putra (Ikhwan)</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#38bdf8" }}>
            {data.demografi?.putra || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Asrama &amp; Komplek Putra
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ec4899" }}>Santri Putri (Akhwat)</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(236, 72, 153, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#ec4899" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ec4899" }}>
            {data.demografi?.putri || 0} <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Asrama &amp; Komplek Putri
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "6px", background: "#0f172a", padding: "4px", borderRadius: "10px", border: "1px solid #334155" }}>
            <button
              onClick={() => setActiveSubTab("kelas")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "kelas" ? "#38bdf8" : "transparent",
                color: activeSubTab === "kelas" ? "#0f172a" : "#94a3b8"
              }}
            >
              Rombel Kelas ({data.rombelKelas?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab("asrama")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "asrama" ? "#10b981" : "transparent",
                color: activeSubTab === "asrama" ? "#0f172a" : "#94a3b8"
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
              title="Refresh Data"
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
            <div style={{ fontSize: "0.8rem" }}>Memuat demografi santri...</div>
          </div>
        ) : (
          <div>
            {/* TABEL ROMBEL KELAS */}
            {activeSubTab === "kelas" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 16px" }}>No</th>
                      <th style={{ padding: "10px 16px" }}>Nama Kelas</th>
                      <th style={{ padding: "10px 16px" }}>Tingkat</th>
                      <th style={{ padding: "10px 16px" }}>Wali Kelas</th>
                      <th style={{ padding: "10px 16px" }}>Keterangan</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Jumlah Santri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKelas.map((kls, idx) => (
                      <tr key={kls.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 800, color: "#ffffff" }}>
                          Kelas {kls.nama_kelas}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#38bdf8" }}>
                          {kls.tingkat || "Reguler"}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#cbd5e1" }}>
                          {kls.wali_kelas || "-"}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#94a3b8" }}>
                          {kls.keterangan || "Aktif"}
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 800, color: "#10b981" }}>
                          {kls.total_santri || 0} Santri
                        </td>
                      </tr>
                    ))}
                    {filteredKelas.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          Belum ada data rombel kelas tercatat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TABEL SEBARAN ASRAMA */}
            {activeSubTab === "asrama" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 16px" }}>No</th>
                      <th style={{ padding: "10px 16px" }}>Nama Gedung Asrama</th>
                      <th style={{ padding: "10px 16px" }}>Pembina / Musyrif</th>
                      <th style={{ padding: "10px 16px", textAlign: "center" }}>Penghuni Santri</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAsrama.map((asr, idx) => (
                      <tr key={asr.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 16px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 16px", fontWeight: 800, color: "#ffffff" }}>
                          {asr.nama_asrama}
                        </td>
                        <td style={{ padding: "10px 16px", color: "#cbd5e1" }}>
                          {asr.pembina || "Ustadz Pembina"}
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: 800, color: "#38bdf8" }}>
                          {asr.total_santri || 0} Santri
                        </td>
                      </tr>
                    ))}
                    {filteredAsrama.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
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

