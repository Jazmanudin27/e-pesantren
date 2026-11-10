import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCw,
  Layers,
  Users,
  Check,
  ChevronRight,
  Clock
} from "lucide-react";
import LaporanPeriodeFilter, {
  createInitialPeriodeState,
  buildPeriodeQueryParams,
  getInitials,
} from "./components/LaporanPeriodeFilter";

export default function OwnerLaporanMengaji() {
  const [loading, setLoading] = useState(true);
  const [periodeFilter, setPeriodeFilter] = useState(() => createInitialPeriodeState("hari"));
  const [searchTable, setSearchTable] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(30);

  const [data, setData] = useState({
    summary: {
      total: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alfa: 0,
      persen: 0
    },
    rekapPerSesi: [],
    logPresensi: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/owner/presensi?${buildPeriodeQueryParams(periodeFilter)}&tipe=mengaji&limit=5000`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat presensi mengaji owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodeFilter]);

  useEffect(() => {
    setVisibleLimit(30);
  }, [periodeFilter, searchTable]);

  const s = data.summary || {};
  const totalPresensi = (s.hadir || 0) + (s.sakit || 0) + (s.izin || 0) + (s.alfa || 0);
  const hadirPct = totalPresensi > 0 ? Math.round(((s.hadir || 0) / totalPresensi) * 100) : 0;
  const sakitPct = totalPresensi > 0 ? Math.round(((s.sakit || 0) / totalPresensi) * 100) : 0;
  const izinPct = totalPresensi > 0 ? Math.round(((s.izin || 0) / totalPresensi) * 100) : 0;
  const alfaPct = totalPresensi > 0 ? Math.round(((s.alfa || 0) / totalPresensi) * 100) : 0;

  const filteredLogs = (data.logPresensi || []).filter((p) => {
    const q = searchTable.toLowerCase();
    return (
      (p.nama_santri || "").toLowerCase().includes(q) ||
      (p.nis || "").toLowerCase().includes(q) ||
      (p.nama_kelas || "").toLowerCase().includes(q) ||
      (p.nama_kegiatan || "").toLowerCase().includes(q)
    );
  });

  const displayedLogs = filteredLogs.slice(0, visibleLimit);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short"
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
      
      {/* 1. PERIODE FILTER (HARI / BULAN / TAHUN) */}
      <LaporanPeriodeFilter
        value={periodeFilter}
        onChange={setPeriodeFilter}
        accentGradient="linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
        accentColor="#0d9488"
      />

      {/* 2. HERO CARD REKAP PRESENSI MENGAJI */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #115e59 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(13, 148, 136, 0.35)",
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
            background: "rgba(167, 243, 208, 0.18)",
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
                color: "#a7f3d0",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              PRESENSI KEGIATAN MENGAJI
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
              {hadirPct}% <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Hadir</span>
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
            <BookOpen size={20} color="#a7f3d0" />
          </div>
        </div>

        {/* Multi-Segment Attendance Bar */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontWeight: 700, marginBottom: "5px" }}>
            <span style={{ color: "#a7f3d0" }}>Total {totalPresensi.toLocaleString("id-ID")} Kehadiran Terdata</span>
            <span style={{ color: "#ffffff" }}>{s.hadir || 0} Hadir</span>
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
            <div style={{ width: `${hadirPct}%`, background: "#34d399", borderRadius: "99px 0 0 99px" }} />
            <div style={{ width: `${sakitPct}%`, background: "#fbbf24" }} />
            <div style={{ width: `${izinPct}%`, background: "#38bdf8" }} />
            <div style={{ width: `${alfaPct}%`, background: "#f87171", borderRadius: "0 99px 99px 0" }} />
          </div>
        </div>

        {/* 4 Mini Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "#a7f3d0", fontWeight: 700 }}>HADIR</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              {(s.hadir || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "#fef08a", fontWeight: 700 }}>SAKIT</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#fef08a", marginTop: "1px" }}>
              {(s.sakit || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "#bae6fd", fontWeight: 700 }}>IZIN</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#bae6fd", marginTop: "1px" }}>
              {(s.izin || 0).toLocaleString("id-ID")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.58rem", color: "#fecdd3", fontWeight: 700 }}>ALFA</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#fecdd3", marginTop: "1px" }}>
              {(s.alfa || 0).toLocaleString("id-ID")}
            </div>
          </div>
        </div>
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
          placeholder="Cari santri, kelas, atau kegiatan mengaji..."
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

      {/* 5. LOG CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 4px",
          }}
        >
          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
            Daftar Presensi Mengaji
          </span>
          <span
            style={{
              fontSize: "0.66rem",
              fontWeight: 800,
              color: "#0f766e",
              background: "#f0fdfa",
              border: "1px solid #ccfbf1",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {filteredLogs.length.toLocaleString("id-ID")} Catatan
          </span>
        </div>

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
            <RotateCw size={24} className="animate-spin" color="#0d9488" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              Memuat data presensi mengaji...
            </div>
          </div>
        ) : displayedLogs.length > 0 ? (
          <>
            {displayedLogs.map((p, idx) => {
              const st = (p.status || "").toLowerCase();
              const isHadir = st.includes("hadir") || st.includes("tepat") || st.includes("masbuq");
              const isSakit = st.includes("sakit");
              const isIzin = st.includes("izin");

              const theme = isHadir
                ? { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0", accent: "#10b981", avatarBg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" }
                : isSakit
                ? { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", accent: "#ef4444", avatarBg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" }
                : isIzin
                ? { bg: "#fffbeb", color: "#d97706", border: "#fde68a", accent: "#f59e0b", avatarBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }
                : { bg: "#fff1f2", color: "#e11d48", border: "#fecdd3", accent: "#f43f5e", avatarBg: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)" };

              const StatusIcon = isHadir ? CheckCircle2 : AlertCircle;

              return (
                <div
                  key={p.id || idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "11px 12px",
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${theme.accent}`,
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "12px",
                          background: theme.avatarBg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.78rem",
                          fontWeight: 900,
                          letterSpacing: "-0.3px",
                          flexShrink: 0,
                          position: "relative",
                        }}
                      >
                        {getInitials(p.nama_santri)}
                        <span
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: theme.accent,
                            border: "2px solid #ffffff",
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "0.83rem",
                            fontWeight: 800,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.2,
                          }}
                        >
                          {p.nama_santri}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              color: "#475569",
                              background: "#f1f5f9",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.nama_kegiatan}
                          </span>
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              color: "#0f766e",
                              background: "#f0fdfa",
                              border: "1px solid #ccfbf1",
                              padding: "1.5px 6px",
                              borderRadius: "6px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.nama_kelas || "Semua Kelas"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        color: theme.color,
                        background: theme.bg,
                        border: `1px solid ${theme.border}`,
                        padding: "4px 8px",
                        borderRadius: "999px",
                        flexShrink: 0,
                      }}
                    >
                      <StatusIcon size={11} strokeWidth={2.6} />
                      <span>{p.status || "Hadir"}</span>
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "6px",
                      borderTop: "1px dashed #f1f5f9",
                      fontSize: "0.6rem",
                      color: "#64748b",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                      <Clock size={11} color="#94a3b8" />
                      <span>
                        {formatDate(p.tanggal)}
                        {p.waktu_scan && p.waktu_scan !== "-" ? ` • ${p.waktu_scan}` : ""}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: "#64748b",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        padding: "1.5px 6px",
                        borderRadius: "6px",
                      }}
                    >
                      {p.metode_presensi || "Sistem"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLogs.length > visibleLimit && (
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
                  color: "#0d9488",
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                  marginTop: "4px"
                }}
              >
                Tampilkan Lebih Banyak ({(filteredLogs.length - visibleLimit).toLocaleString("id-ID")} lagi)
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
            <BookOpen size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
              Tidak ada data presensi mengaji
            </div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
              Belum ada absensi mengaji pada periode yang dipilih.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

