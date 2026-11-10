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
  ShieldCheck,
} from "lucide-react";
import { getInitials } from "./components/LaporanPeriodeFilter";

export default function OwnerLaporanPerkembangan() {
  const [loading, setLoading] = useState(true);
  const [searchTable, setSearchTable] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(25);
  const [expandedId, setExpandedId] = useState(null);

  const [data, setData] = useState({
    totalLaporan: 0,
    totalSantriTerlapor: 0,
    laporanList: [],
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
        year: "numeric",
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        paddingBottom: "24px",
      }}
    >
      {/* 1. HERO SUMMARY CARD */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(79, 70, 229, 0.35)",
          position: "relative",
          overflow: "hidden",
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
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.64rem",
                fontWeight: 800,
                color: "#c7d2fe",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
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
                textShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {(data.totalLaporan || 0).toLocaleString("id-ID")}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                Dokumen
              </span>
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
              flexShrink: 0,
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
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div>
            <div
              style={{ fontSize: "0.6rem", color: "#c7d2fe", fontWeight: 700 }}
            >
              SANTRI TERLAPOR
            </div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 900,
                color: "#ffffff",
                marginTop: "1px",
              }}
            >
              {(data.totalSantriTerlapor || 0).toLocaleString("id-ID")}{" "}
              <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>
                Santri
              </span>
            </div>
          </div>
          <div>
            <div
              style={{ fontSize: "0.6rem", color: "#c7d2fe", fontWeight: 700 }}
            >
              STATUS TERBIT
            </div>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 900,
                color: "#ffffff",
                marginTop: "1px",
              }}
            >
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
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        <Search
          size={16}
          color="#94a3b8"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
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
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 3. LIST LAPORAN PERKEMBANGAN */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 4px",
          }}
        >
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
            Daftar Evaluasi Santri
          </span>
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 800,
              color: "#4338ca",
              background: "#eef2ff",
              border: "1px solid #c7d2fe",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {filteredList.length.toLocaleString("id-ID")} Dokumen
          </span>
        </div>

        {loading ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <RotateCw
              size={24}
              className="animate-spin"
              color="#4f46e5"
              style={{ margin: "0 auto 8px" }}
            />
            <div
              style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}
            >
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
                    borderRadius: "16px",
                    padding: "12px 13px",
                    border: isExpanded ? "1px solid #a5b4fc" : "1px solid #e2e8f0",
                    borderLeft: "4px solid #6366f1",
                    boxShadow: isExpanded
                      ? "0 8px 20px -4px rgba(79, 70, 229, 0.16)"
                      : "0 2px 8px rgba(15, 23, 42, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.id || idx)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
                          color: "#4338ca",
                          border: "1px solid #c7d2fe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: 900,
                          letterSpacing: "-0.3px",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(item.nama_santri)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.84rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.2,
                          }}
                        >
                          {item.nama_santri}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              color: "#4338ca",
                              background: "#eef2ff",
                              border: "1px solid #c7d2fe",
                              padding: "1.5px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {item.periode || "Semester"}
                          </span>
                          {item.nama_kelas && (
                            <span
                              style={{
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                color: "#475569",
                                background: "#f1f5f9",
                                padding: "2px 6px",
                                borderRadius: "6px",
                              }}
                            >
                              {item.nama_kelas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          padding: "3px 7px",
                          borderRadius: "999px",
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        <ShieldCheck size={10} />
                        <span>Terbit</span>
                      </span>
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "8px",
                          background: isExpanded ? "#eef2ff" : "#f8fafc",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isExpanded ? "#4f46e5" : "#64748b",
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
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
                        border: "1px solid #e2e8f0",
                        borderLeft: "3px solid #6366f1",
                        lineHeight: 1.45,
                      }}
                    >
                      <strong style={{ color: "#4338ca" }}>Evaluasi:</strong>{" "}
                      {item.catatan_ustadz}
                    </div>
                  )}

                  {/* Meta Footer */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.6rem",
                      color: "#64748b",
                      paddingTop: "4px",
                      borderTop: "1px dashed #f1f5f9",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                      <Calendar size={11} color="#94a3b8" />
                      <span>{formatDate(item.tanggal_laporan)}</span>
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 700, color: "#475569" }}>
                      <User size={11} color="#94a3b8" />
                      <span>{item.nama_penulis || "Pengasuh"}</span>
                    </span>
                  </div>

                  {/* Expanded Detail Sections */}
                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        paddingTop: "6px",
                        borderTop: "1px solid #e2e8f0",
                        fontSize: "0.67rem",
                      }}
                    >
                      {item.catatan_perilaku && (
                        <div
                          style={{
                            background: "#ecfdf5",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "1px solid #a7f3d0",
                            color: "#065f46",
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 800, marginBottom: "2px" }}>
                            <ShieldCheck size={12} />
                            <span>Karakter &amp; Kedisiplinan</span>
                          </div>
                          <div>{item.catatan_perilaku}</div>
                        </div>
                      )}

                      {item.catatan_ibadah && (
                        <div
                          style={{
                            background: "#eff6ff",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "1px solid #bfdbfe",
                            color: "#1e40af",
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 800, marginBottom: "2px" }}>
                            <Sparkles size={12} />
                            <span>Ibadah &amp; Shalat</span>
                          </div>
                          <div>{item.catatan_ibadah}</div>
                        </div>
                      )}

                      {item.catatan_hafalan && (
                        <div
                          style={{
                            background: "#fdf4ff",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "1px solid #f0abfc",
                            color: "#86198f",
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 800, marginBottom: "2px" }}>
                            <Award size={12} />
                            <span>Capaian Hafalan</span>
                          </div>
                          <div>{item.catatan_hafalan}</div>
                        </div>
                      )}

                      {item.catatan_akademik && (
                        <div
                          style={{
                            background: "#fffbeb",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            lineHeight: 1.4,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 800, marginBottom: "2px" }}>
                            <BookOpen size={12} />
                            <span>Akademik Kitab</span>
                          </div>
                          <div>{item.catatan_akademik}</div>
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
                  marginTop: "4px",
                }}
              >
                Tampilkan Lebih Banyak (
                {(filteredList.length - visibleLimit).toLocaleString("id-ID")}{" "}
                lagi)
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
              border: "1px solid #e2e8f0",
            }}
          >
            <FileText
              size={32}
              color="#cbd5e1"
              style={{ margin: "0 auto 8px" }}
            />
            <div
              style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}
            >
              Belum ada laporan perkembangan
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "#94a3b8",
                marginTop: "2px",
              }}
            >
              Laporan evaluasi resmi dari asatidz akan tampil di sini.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
