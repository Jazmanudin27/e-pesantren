import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCw,
  Calendar,
  Layers,
  Users,
  Fingerprint,
  Building2,
  FileText,
  User,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function OwnerLaporanPresensi({ initialStatus = "Semua" }) {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("hari_ini");
  const [statusFilter, setStatusFilter] = useState(initialStatus || "Semua");
  const [searchTable, setSearchTable] = useState("");

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

  // Sinkronisasi jika initialStatus berubah dari props
  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/owner/presensi?periode=${periode}`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat presensi owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periode]);

  const s = data.summary || {};
  const totalPresensi = (s.hadir || 0) + (s.sakit || 0) + (s.izin || 0) + (s.alfa || 0);
  const hadirPct = totalPresensi > 0 ? Math.round(((s.hadir || 0) / totalPresensi) * 100) : 0;
  const sakitPct = totalPresensi > 0 ? Math.round(((s.sakit || 0) / totalPresensi) * 100) : 0;
  const izinPct = totalPresensi > 0 ? Math.round(((s.izin || 0) / totalPresensi) * 100) : 0;
  const alfaPct = totalPresensi > 0 ? Math.round(((s.alfa || 0) / totalPresensi) * 100) : 0;

  const filteredLogs = (data.logPresensi || []).filter((p) => {
    const q = searchTable.toLowerCase();
    const matchQuery =
      (p.nama_santri || "").toLowerCase().includes(q) ||
      (p.nis || "").toLowerCase().includes(q) ||
      (p.nama_kelas || "").toLowerCase().includes(q) ||
      (p.nama_kegiatan || "").toLowerCase().includes(q);

    if (!matchQuery) return false;

    if (statusFilter === "Semua") return true;
    const st = (p.status || "").toLowerCase();
    const flt = statusFilter.toLowerCase();
    if (flt === "hadir") return st.includes("hadir") || st.includes("tepat") || st.includes("masbuq");
    if (flt === "alfa") return st.includes("alfa") || st.includes("alpha") || st.includes("absen");
    return st.includes(flt);
  });

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
      
      {/* 1. PERIODE FILTER PILLS */}
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
        {[
          { key: "hari_ini", label: "Hari Ini" },
          { key: "bulan_ini", label: "Bulan Ini" },
          { key: "tahun_ini", label: "Tahun Ini" }
        ].map((p) => {
          const isActive = periode === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriode(p.key)}
              style={{
                flex: 1,
                border: "none",
                background: isActive
                  ? "linear-gradient(135deg, #0d766e 0%, #059669 100%)"
                  : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: "0.74rem",
                padding: "8px 4px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 4px 10px rgba(13, 118, 110, 0.25)" : "none"
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 2. REKAP STATUS KEHADIRAN (4 PASTEL TOUCHABLE CARDS) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "14px 12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#0f172a" }}>
              Tingkat Kehadiran Santri
            </div>
            <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
              Total <strong>{totalPresensi} presensi</strong> terekam kamera &amp; fingerprint
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669" }}>{hadirPct}%</span>
            <span style={{ fontSize: "0.68rem", color: "#64748b", marginLeft: "4px" }}>Hadir</span>
          </div>
        </div>

        {/* Multi-segment colorful bar */}
        <div
          style={{
            width: "100%",
            height: "10px",
            background: "#f1f5f9",
            borderRadius: "99px",
            overflow: "hidden",
            display: "flex",
            marginBottom: "12px"
          }}
        >
          <div style={{ width: `${hadirPct}%`, background: "#10b981" }} />
          <div style={{ width: `${sakitPct}%`, background: "#ef4444" }} />
          <div style={{ width: `${izinPct}%`, background: "#f59e0b" }} />
          <div style={{ width: `${alfaPct}%`, background: "#0d9488" }} />
        </div>

        {/* 4 Interactive Status Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "6px"
          }}
        >
          {/* Hadir */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Hadir" ? "Semua" : "Hadir")}
            style={{
              background: statusFilter === "Hadir" ? "#dcfce7" : "#f0fdf4",
              borderRadius: "12px",
              padding: "8px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: statusFilter === "Hadir" ? "2px solid #16a34a" : "1px solid #bbf7d0",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              outline: "none"
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "#10b981",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Check size={15} strokeWidth={2.8} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#15803d", marginTop: "4px", lineHeight: 1 }}>
              {s.hadir || 0}
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#166534", marginTop: "2px" }}>
              Hadir
            </span>
          </button>

          {/* Sakit */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Sakit" ? "Semua" : "Sakit")}
            style={{
              background: statusFilter === "Sakit" ? "#fee2e2" : "#fef2f2",
              borderRadius: "12px",
              padding: "8px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: statusFilter === "Sakit" ? "2px solid #dc2626" : "1px solid #fecaca",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              outline: "none"
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "#ef4444",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Building2 size={15} strokeWidth={2.6} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b91c1c", marginTop: "4px", lineHeight: 1 }}>
              {s.sakit || 0}
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#991b1b", marginTop: "2px" }}>
              Sakit
            </span>
          </button>

          {/* Izin */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Izin" ? "Semua" : "Izin")}
            style={{
              background: statusFilter === "Izin" ? "#fef3c7" : "#fffbeb",
              borderRadius: "12px",
              padding: "8px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: statusFilter === "Izin" ? "2px solid #d97706" : "1px solid #fde68a",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              outline: "none"
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "#f59e0b",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <FileText size={15} strokeWidth={2.6} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b45309", marginTop: "4px", lineHeight: 1 }}>
              {s.izin || 0}
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#92400e", marginTop: "2px" }}>
              Izin
            </span>
          </button>

          {/* Alfa */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "Alfa" ? "Semua" : "Alfa")}
            style={{
              background: statusFilter === "Alfa" ? "#ccfbf1" : "#f0fdfa",
              borderRadius: "12px",
              padding: "8px 2px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: statusFilter === "Alfa" ? "2px solid #0f766e" : "1px solid #99f6e4",
              cursor: "pointer",
              transition: "transform 0.15s ease",
              outline: "none"
            }}
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "#0d9488",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Clock size={15} strokeWidth={2.6} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#0f766e", marginTop: "4px", lineHeight: 1 }}>
              {s.alfa || 0}
            </div>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#115e59", marginTop: "2px" }}>
              Alfa
            </span>
          </button>
        </div>
      </div>

      {/* 3. REKAP PER SESI SHALAT & MENGAJI (SCROLLABLE PILLS) */}
      {data.rekapPerSesi && data.rekapPerSesi.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Layers size={14} color="#0d766e" />
            <span>Rekap Sesi Shalat &amp; Mengaji</span>
          </div>

          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {data.rekapPerSesi.map((sesi, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  borderRadius: "12px",
                  padding: "8px 10px",
                  border: "1px solid #e2e8f0",
                  minWidth: "115px",
                  flexShrink: 0
                }}
              >
                <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                  {sesi.nama_sesi || sesi.nama_kegiatan || `Sesi ${idx + 1}`}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px", fontSize: "0.6rem" }}>
                  <span style={{ color: "#15803d", fontWeight: 700 }}>H: {sesi.hadir || 0}</span>
                  <span style={{ color: "#b91c1c", fontWeight: 700 }}>S/I: {(sesi.sakit || 0) + (sesi.izin || 0)}</span>
                  <span style={{ color: "#0f766e", fontWeight: 700 }}>A: {sesi.alfa || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SEARCH & STATUS FILTER BAR */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
            placeholder="Cari santri, sesi shalat, kelas..."
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

        {/* Status Filter Badges */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
          {["Semua", "Hadir", "Sakit", "Izin", "Alfa"].map((st) => {
            const isSel = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  border: isSel ? "1.5px solid #0d766e" : "1px solid #cbd5e1",
                  background: isSel ? "#0d766e" : "#ffffff",
                  color: isSel ? "#ffffff" : "#475569",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. MOBILE LIST CARDS: LOG PRESENSI REALTIME */}
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
            <RotateCw size={24} className="animate-spin" color="#0d766e" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              Memuat log absensi...
            </div>
          </div>
        ) : filteredLogs.length > 0 ? (
          filteredLogs.map((item, idx) => {
            const st = (item.status || "").toLowerCase();
            const isHaid = st.includes("haid");
            const isHadir = !isHaid && (st.includes("hadir") || st.includes("tepat") || st.includes("masbuq"));
            const isSakit = st.includes("sakit");
            const isIzin = st.includes("izin");
            const isAlfa = st.includes("alfa") || st.includes("alpha") || st.includes("absen");

            const badgeBg = isHaid
              ? "#fdf2f8"
              : isHadir
              ? "#ecfdf5"
              : isSakit
              ? "#fef2f2"
              : isIzin
              ? "#fffbeb"
              : "#f0fdfa";
            const badgeColor = isHaid
              ? "#be185d"
              : isHadir
              ? "#059669"
              : isSakit
              ? "#dc2626"
              : isIzin
              ? "#d97706"
              : "#0d9488";
            const badgeBorder = isHaid
              ? "#fbcfe8"
              : isHadir
              ? "#a7f3d0"
              : isSakit
              ? "#fecaca"
              : isIzin
              ? "#fde68a"
              : "#99f6e4";

            return (
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
                      background: badgeBg,
                      color: badgeColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Fingerprint size={18} />
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
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
                      {item.nama_kegiatan || item.nama_sesi || "Shalat Berjamaah"} {item.nama_kelas ? `• ${item.nama_kelas}` : ""}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                      {item.jam_absen || item.waktu || formatDate(item.tanggal)} • {item.metode || "Fingerprint / AI"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      color: badgeColor,
                      background: badgeBg,
                      border: `1px solid ${badgeBorder}`,
                      padding: "4px 8px",
                      borderRadius: "8px"
                    }}
                  >
                    {item.status || "Hadir"}
                  </span>
                </div>
              </div>
            );
          })
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
            <Clock size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
              Tidak ada catatan presensi
            </div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
              Belum ada data presensi sesuai filter yang dipilih.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
