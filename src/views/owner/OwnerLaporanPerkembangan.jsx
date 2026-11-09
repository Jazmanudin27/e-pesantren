import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  RotateCw,
  Search,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function OwnerLaporanPerkembangan() {
  const [loading, setLoading] = useState(true);
  const [searchTable, setSearchTable] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(25);
  const [expandedId, setExpandedId] = useState(null);

  const [data, setData] = useState({
    totalLaporan: 0,
    totalSantriTerlapor: 0,
    laporanList: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/owner/perkembangan");
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat perkembangan owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setVisibleLimit(25);
  }, [searchTable]);

  const filteredList = (data.laporanList || []).filter((l) => {
    const q = searchTable.toLowerCase();
    return (
      (l.nama_santri || "").toLowerCase().includes(q) ||
      (l.nis || "").toLowerCase().includes(q) ||
      (l.nama_kelas || "").toLowerCase().includes(q) ||
      (l.periode || "").toLowerCase().includes(q) ||
      (l.nama_penulis || "").toLowerCase().includes(q)
    );
  });

  const displayedList = filteredList.slice(0, visibleLimit);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
      
      {/* 1. HERO SUMMARY CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(79, 70, 229, 0.35)",
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
            background: "rgba(199, 210, 254, 0.18)",
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
                color: "#c7d2fe",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              LAPORAN PERKEMBANGAN SANTRI
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                marginTop: "4px",
                textShadow: "0 2px 6px rgba(0,0,0,0.2)"
              }}
            >
              {(data.totalLaporan || 0).toLocaleString("id-ID")} <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Dokumen</span>
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
            <FileText size={20} color="#c7d2fe" />
          </div>
        </div>

        {/* Sub Mini Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)"
          }}
        >
          <div>
            <div style={{ fontSize: "0.6rem", color: "#c7d2fe", fontWeight: 700 }}>
              SANTRI TERLAPOR
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              {(data.totalSantriTerlapor || 0).toLocaleString("id-ID")} <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>Santri</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#c7d2fe", fontWeight: 700 }}>
              STATUS TERBIT
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              100% Sah
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH INPUT */}
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
          placeholder="Cari santri, periode, kelas, atau ustadz..."
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

      {/* 3. LIST LAPORAN PERKEMBANGAN */}
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
            <RotateCw size={24} className="animate-spin" color="#4f46e5" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              Memuat laporan perkembangan...
            </div>
          </div>
        ) : displayedList.length > 0 ? (
          <>
            {displayedList.map((item, idx) => {
              const isExpanded = expandedId === (item.id || idx);

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : (item.id || idx))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "12px",
                          background: "#eef2ff",
                          color: "#4f46e5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Award size={18} />
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
                          {item.nama_santri}
                        </div>
                        <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                          Periode: <strong>{item.periode || "Semester"}</strong> {item.nama_kelas ? `• ${item.nama_kelas}` : ""}
                        </div>
                        <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                          Tgl: {formatDate(item.tanggal_laporan)} • Asatidz: {item.nama_penulis || "Pengasuh"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "0.58rem",
                          fontWeight: 800,
                          padding: "3px 7px",
                          borderRadius: "6px",
                          background: "#eef2ff",
                          color: "#4338ca",
                          border: "1px solid #c7d2fe"
                        }}
                      >
                        Diterbitkan
                      </span>
                      {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                    </div>
                  </div>

                  {/* Catatan Singkat Ustadz */}
                  {item.catatan_ustadz && (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        fontSize: "0.68rem",
                        color: "#334155",
                        border: "1px solid #f1f5f9",
                        lineHeight: 1.4
                      }}
                    >
                      <strong style={{ color: "#4f46e5" }}>Evaluasi Pengasuh:</strong> {item.catatan_ustadz}
                    </div>
                  )}

                  {/* Expanded Detail Sections */}
                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        paddingTop: "6px",
                        borderTop: "1px solid #f1f5f9",
                        fontSize: "0.66rem"
                      }}
                    >
                      {item.catatan_perilaku && (
                        <div style={{ background: "#ecfdf5", padding: "6px 8px", borderRadius: "8px", border: "1px solid #a7f3d0", color: "#065f46" }}>
                          <strong>Karakter &amp; Kedisiplinan:</strong> {item.catatan_perilaku}
                        </div>
                      )}

                      {item.catatan_ibadah && (
                        <div style={{ background: "#eff6ff", padding: "6px 8px", borderRadius: "8px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                          <strong>Ibadah &amp; Shalat:</strong> {item.catatan_ibadah}
                        </div>
                      )}

                      {item.catatan_hafalan && (
                        <div style={{ background: "#fdf4ff", padding: "6px 8px", borderRadius: "8px", border: "1px solid #f0abfc", color: "#86198f" }}>
                          <strong>Capaian Hafalan:</strong> {item.catatan_hafalan}
                        </div>
                      )}

                      {item.catatan_akademik && (
                        <div style={{ background: "#fffbeb", padding: "6px 8px", borderRadius: "8px", border: "1px solid #fde68a", color: "#92400e" }}>
                          <strong>Akademik Kitab:</strong> {item.catatan_akademik}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredList.length > visibleLimit && (
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + 25)}
                style={{
                  padding: "10px 14px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "12px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  color: "#4f46e5",
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                  marginTop: "4px"
                }}
              >
                Tampilkan Lebih Banyak ({(filteredList.length - visibleLimit).toLocaleString("id-ID")} lagi)
              </button>
            )}
          </>
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
            <FileText size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
              Belum ada laporan perkembangan
            </div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
              Laporan evaluasi resmi dari asatidz akan tampil di sini.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

