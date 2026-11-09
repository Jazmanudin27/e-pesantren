import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Building,
  RotateCw,
  Search,
  User,
  Phone,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function OwnerLaporanSantri() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("santri"); // 'santri' | 'asrama'
  const [searchTable, setSearchTable] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(30);

  const [data, setData] = useState({
    demografi: {
      total: 0,
      putra: 0,
      putri: 0
    },
    daftarSantri: [],
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
      console.warn("Gagal memuat data santri owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setVisibleLimit(30);
  }, [activeSubTab, searchTable]);

  const filteredSantri = (data.daftarSantri || []).filter((s) => {
    const q = searchTable.toLowerCase();
    return (
      (s.nama_santri || "").toLowerCase().includes(q) ||
      (s.nis || "").toLowerCase().includes(q) ||
      (s.nisn || "").toLowerCase().includes(q) ||
      (s.nama_kelas || "").toLowerCase().includes(q) ||
      (s.nama_asrama || "").toLowerCase().includes(q) ||
      (s.nama_kamar || "").toLowerCase().includes(q) ||
      (s.nama_wali || "").toLowerCase().includes(q)
    );
  });

  const filteredAsrama = (data.sebaranAsrama || []).filter((a) => {
    const q = searchTable.toLowerCase();
    return (
      (a.nama_asrama || "").toLowerCase().includes(q) ||
      (a.pembina || "").toLowerCase().includes(q)
    );
  });

  const displayedSantri = filteredSantri.slice(0, visibleLimit);

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
              TOTAL SANTRI AKTIF
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
              {totalS.toLocaleString("id-ID")} <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Santri</span>
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

        {/* Progress Bar Sebaran Gender */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontWeight: 700, marginBottom: "5px" }}>
            <span style={{ color: "#93c5fd" }}>Putra ({putraPct}%)</span>
            <span style={{ color: "#fbcfe8" }}>Putri ({putriPct}%)</span>
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
            <div
              style={{
                width: `${putraPct}%`,
                background: "linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)",
                borderRadius: "99px"
              }}
            />
            <div
              style={{
                width: `${putriPct}%`,
                background: "linear-gradient(90deg, #f472b6 0%, #ec4899 100%)",
                borderRadius: "99px"
              }}
            />
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
            <div style={{ fontSize: "0.6rem", color: "#bfdbfe", fontWeight: 700 }}>
              SANTRI PUTRA (IKHWAN)
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              {putraS.toLocaleString("id-ID")} <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>Santri</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#fbcfe8", fontWeight: 700 }}>
              SANTRI PUTRI (AKHWAT)
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              {putriS.toLocaleString("id-ID")} <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>Santri</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUBTAB SWITCHER (DAFTAR SANTRI / KAMAR ASRAMA) */}
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
          onClick={() => setActiveSubTab("santri")}
          style={{
            flex: 1,
            background: activeSubTab === "santri" ? "#eff6ff" : "transparent",
            color: activeSubTab === "santri" ? "#1d4ed8" : "#64748b",
            fontWeight: activeSubTab === "santri" ? 800 : 600,
            fontSize: "0.74rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "santri" ? "1px solid #bfdbfe" : "1px solid transparent"
          }}
        >
          <Users size={14} />
          <span>Daftar Santri ({filteredSantri.length.toLocaleString("id-ID")})</span>
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
          <span>Kamar Asrama ({filteredAsrama.length.toLocaleString("id-ID")})</span>
        </button>
      </div>

      {/* 3. SEARCH BAR */}
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
          placeholder={
            activeSubTab === "santri"
              ? "Cari nama santri, NIS, kelas, asrama, atau wali..."
              : "Cari nama asrama atau pembina..."
          }
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

      {/* 4. LIST CARDS */}
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
        ) : activeSubTab === "santri" ? (
          /* TAB 1: LIST DATA SANTRI */
          filteredSantri.length > 0 ? (
            <>
              {displayedSantri.map((item, idx) => {
                const isPutri = String(item.jenis_kelamin || "").toUpperCase().startsWith("P");
                const cleanPhone = (item.no_wa_wali || "").replace(/\D/g, "");
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone}` : null;

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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "12px",
                            background: isPutri ? "#fdf2f8" : "#eff6ff",
                            color: isPutri ? "#db2777" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontWeight: 900,
                            fontSize: "0.85rem"
                          }}
                        >
                          {item.nama_santri ? item.nama_santri.charAt(0).toUpperCase() : "S"}
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
                            NIS: {item.nis || "-"} {item.nisn ? `• NISN: ${item.nisn}` : ""}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "0.58rem",
                          fontWeight: 800,
                          padding: "3px 7px",
                          borderRadius: "6px",
                          background: isPutri ? "#fdf2f8" : "#eff6ff",
                          color: isPutri ? "#be185d" : "#1d4ed8",
                          border: isPutri ? "1px solid #fbcfe8" : "1px solid #bfdbfe",
                          flexShrink: 0
                        }}
                      >
                        {isPutri ? "Putri" : "Putra"}
                      </span>
                    </div>

                    {/* Metadata Badges: Kelas & Asrama */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                      {item.nama_kelas && (
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "#334155",
                            background: "#f1f5f9",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          Kelas: {item.nama_kelas}
                        </span>
                      )}

                      {(item.nama_asrama || item.nama_kamar) && (
                        <span
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "#0f766e",
                            background: "#ecfdf5",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            border: "1px solid #a7f3d0"
                          }}
                        >
                          {item.nama_asrama || "Asrama"} {item.nama_kamar ? `• ${item.nama_kamar}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Wali & Kontak WA */}
                    {item.nama_wali && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: "6px",
                          borderTop: "1px solid #f1f5f9",
                          fontSize: "0.64rem",
                          color: "#64748b"
                        }}
                      >
                        <div>
                          Wali: <strong style={{ color: "#334155" }}>{item.nama_wali}</strong>
                        </div>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "#059669",
                              fontWeight: 800,
                              textDecoration: "none",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              padding: "2px 6px",
                              borderRadius: "6px"
                            }}
                          >
                            <MessageCircle size={12} />
                            <span>WA Wali</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredSantri.length > visibleLimit && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((v) => v + 30)}
                  style={{
                    padding: "10px 14px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#2563eb",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    marginTop: "4px"
                  }}
                >
                  Tampilkan Lebih Banyak ({(filteredSantri.length - visibleLimit).toLocaleString("id-ID")} santri lagi)
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
              <Users size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Tidak ada santri ditemukan
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Coba sesuaikan kata kunci pencarian.
              </div>
            </div>
          )
        ) : (
          /* TAB 2: SEBARAN ASRAMA */
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
                      Musyrif / Pembina: {item.pembina || "Pengasuh Asrama"}
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
                    {(item.total_santri || 0).toLocaleString("id-ID")} Santri
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
