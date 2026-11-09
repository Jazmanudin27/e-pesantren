import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Building,
  GraduationCap,
  RotateCw,
  Search,
  PieChart,
  UserCheck,
  User,
  ChevronRight,
  Sparkles
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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
      
      {/* 1. HERO DEMOGRAFI CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(37, 99, 235, 0.35)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "rgba(191, 219, 254, 0.18)",
            filter: "blur(20px)",
            pointerEvents: "none"
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontSize: "0.64rem",
                fontWeight: 800,
                color: "#bfdbfe",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              POPULASI SANTRI AKTIF
            </div>
            <div
              style={{
                fontSize: "1.65rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                marginTop: "4px"
              }}
            >
              {totalS} <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#bfdbfe" }}>Santri Terdaftar</span>
            </div>
          </div>

          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Users size={20} color="#bfdbfe" />
          </div>
        </div>

        {/* Multi-gender progress bar */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontWeight: 700, marginBottom: "5px" }}>
            <span style={{ color: "#93c5fd" }}>Putra: {putraS} ({putraPct}%)</span>
            <span style={{ color: "#fbcfe8" }}>Putri: {putriS} ({putriPct}%)</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              background: "rgba(0, 0, 0, 0.25)",
              borderRadius: "99px",
              overflow: "hidden",
              display: "flex"
            }}
          >
            <div style={{ width: `${putraPct}%`, background: "#60a5fa" }} />
            <div style={{ width: `${putriPct}%`, background: "#f472b6" }} />
          </div>
        </div>
      </div>

      {/* 2. DUAL GENDER MINI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: "1px solid #bfdbfe",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase" }}>
              SANTRI PUTRA (IKHWAN)
            </span>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "8px",
                background: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <User size={14} />
            </div>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1e3a8a", marginTop: "6px" }}>
            {putraS} <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b" }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#3b82f6", marginTop: "2px", fontWeight: 700 }}>
            {putraPct}% dari total
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: "1px solid #fbcfe8",
            boxShadow: "0 2px 8px rgba(236, 72, 153, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#be185d", textTransform: "uppercase" }}>
              SANTRI PUTRI (AKHWAT)
            </span>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "8px",
                background: "#fdf2f8",
                color: "#db2777",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <User size={14} />
            </div>
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#831843", marginTop: "6px" }}>
            {putriS} <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b" }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#ec4899", marginTop: "2px", fontWeight: 700 }}>
            {putriPct}% dari total
          </div>
        </div>
      </div>

      {/* 3. SUBTAB SWITCHER (ROMBEL KELAS / ASRAMA) */}
      <div
        style={{
          display: "flex",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "4px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          gap: "4px"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("kelas")}
          style={{
            flex: 1,
            background: activeSubTab === "kelas" ? "#eff6ff" : "transparent",
            color: activeSubTab === "kelas" ? "#1d4ed8" : "#64748b",
            fontWeight: activeSubTab === "kelas" ? 800 : 600,
            fontSize: "0.74rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "kelas" ? "1px solid #bfdbfe" : "1px solid transparent"
          }}
        >
          <GraduationCap size={14} />
          <span>Rombel Kelas ({data.rombelKelas?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("asrama")}
          style={{
            flex: 1,
            background: activeSubTab === "asrama" ? "#eff6ff" : "transparent",
            color: activeSubTab === "asrama" ? "#1d4ed8" : "#64748b",
            fontWeight: activeSubTab === "asrama" ? 800 : 600,
            fontSize: "0.74rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "asrama" ? "1px solid #bfdbfe" : "1px solid transparent"
          }}
        >
          <Building size={14} />
          <span>Kamar Asrama ({data.sebaranAsrama?.length || 0})</span>
        </button>
      </div>

      {/* 4. SEARCH BAR */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
        }}
      >
        <Search
          size={16}
          color="#94a3b8"
          style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
        />
        <input
          type="text"
          placeholder={activeSubTab === "kelas" ? "Cari nama kelas atau wali kelas..." : "Cari nama asrama atau pembina..."}
          value={searchTable}
          onChange={(e) => setSearchTable(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px 9px 36px",
            border: "none",
            outline: "none",
            borderRadius: "12px",
            fontSize: "0.75rem",
            color: "#0f172a",
            background: "transparent",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* 5. LIST CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              textAlign: "center",
              border: "1px solid #e2e8f0"
            }}
          >
            <RotateCw size={24} className="animate-spin" color="#2563eb" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              Memuat data santri...
            </div>
          </div>
        ) : activeSubTab === "kelas" ? (
          filteredKelas.length > 0 ? (
            filteredKelas.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "11px",
                      background: "#eff6ff",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <GraduationCap size={18} />
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.nama_kelas}
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                      Wali Kelas: {item.wali_kelas || "Asatidz Pembina"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                      Tingkat: {item.tingkat || "Reguler"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      color: "#1d4ed8",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      padding: "4px 8px",
                      borderRadius: "8px"
                    }}
                  >
                    {item.total_santri || 0} Santri
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid #e2e8f0"
              }}
            >
              <GraduationCap size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Tidak ada data kelas
              </div>
            </div>
          )
        ) : (
          filteredAsrama.length > 0 ? (
            filteredAsrama.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "11px",
                      background: "#ecfdf5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Building size={18} />
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.nama_asrama}
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                      Musyrif: {item.pembina || "Pengasuh Asrama"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.76rem",
                      fontWeight: 900,
                      color: "#047857",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      padding: "4px 8px",
                      borderRadius: "8px"
                    }}
                  >
                    {item.total_santri || 0} Santri
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid #e2e8f0"
              }}
            >
              <Building size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Tidak ada data kamar asrama
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
