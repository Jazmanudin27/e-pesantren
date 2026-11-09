import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  DoorOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RotateCw,
  Users,
  ShieldAlert,
  ArrowRight,
  UserCheck
} from "lucide-react";

export default function OwnerLaporanPerizinan() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("aktif"); // 'aktif' | 'riwayat'
  const [searchTable, setSearchTable] = useState("");

  const [data, setData] = useState({
    totalAktifKeluar: 0,
    santriAktifKeluar: [],
    riwayatIzin: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/owner/perizinan");
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal memuat perizinan owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAktif = (data.santriAktifKeluar || []).filter((iz) => {
    const q = searchTable.toLowerCase();
    return (
      (iz.nama_santri || "").toLowerCase().includes(q) ||
      (iz.kode_izin || "").toLowerCase().includes(q) ||
      (iz.nama_kelas || "").toLowerCase().includes(q) ||
      (iz.keperluan || "").toLowerCase().includes(q)
    );
  });

  const filteredRiwayat = (data.riwayatIzin || []).filter((iz) => {
    const q = searchTable.toLowerCase();
    return (
      (iz.nama_santri || "").toLowerCase().includes(q) ||
      (iz.kode_izin || "").toLowerCase().includes(q) ||
      (iz.nama_kelas || "").toLowerCase().includes(q) ||
      (iz.keperluan || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "24px" }}>
      
      {/* 1. HERO GATE CONTROL CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(234, 88, 12, 0.35)",
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
            background: "rgba(254, 215, 170, 0.18)",
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
                color: "#ffedd5",
                letterSpacing: "0.05em",
                textTransform: "uppercase"
              }}
            >
              MONITORING GERBANG &amp; POS SATPAM
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
              {data.totalAktifKeluar || 0} <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fed7aa" }}>Santri di Luar</span>
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
            <DoorOpen size={20} color="#ffedd5" />
          </div>
        </div>

        <div style={{ marginTop: "12px", fontSize: "0.68rem", color: "#ffedd5", lineHeight: 1.3 }}>
          Semua santri yang saat ini berada di luar area asrama pesantren dengan izin resmi wali santri.
        </div>
      </div>

      {/* 2. SUBTAB SWITCHER (AKTIF / RIWAYAT) */}
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
          onClick={() => setActiveSubTab("aktif")}
          style={{
            flex: 1,
            background: activeSubTab === "aktif" ? "#fff7ed" : "transparent",
            color: activeSubTab === "aktif" ? "#c2410c" : "#64748b",
            fontWeight: activeSubTab === "aktif" ? 800 : 600,
            fontSize: "0.74rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "aktif" ? "1px solid #fed7aa" : "1px solid transparent"
          }}
        >
          <DoorOpen size={14} />
          <span>Izin Aktif ({data.santriAktifKeluar?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("riwayat")}
          style={{
            flex: 1,
            background: activeSubTab === "riwayat" ? "#f8fafc" : "transparent",
            color: activeSubTab === "riwayat" ? "#0f172a" : "#64748b",
            fontWeight: activeSubTab === "riwayat" ? 800 : 600,
            fontSize: "0.74rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "riwayat" ? "1px solid #cbd5e1" : "1px solid transparent"
          }}
        >
          <Calendar size={14} />
          <span>Riwayat ({data.riwayatIzin?.length || 0})</span>
        </button>
      </div>

      {/* 3. SEARCH INPUT */}
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
          placeholder="Cari nama santri, kode izin, atau keperluan..."
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
            <RotateCw size={24} className="animate-spin" color="#ea580c" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>
              Memuat data perizinan...
            </div>
          </div>
        ) : activeSubTab === "aktif" ? (
          filteredAktif.length > 0 ? (
            filteredAktif.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  border: "1px solid #fed7aa",
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.05)",
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
                      background: "#fff7ed",
                      color: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <DoorOpen size={18} />
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
                      {item.keperluan || "Izin Pulang"} {item.nama_kelas ? `• ${item.nama_kelas}` : ""}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                      Penjemput: {item.nama_penjemput_mahrom || item.nama_penjemput || "Orang Tua"}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                      color: "#c2410c",
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      padding: "3px 8px",
                      borderRadius: "8px"
                    }}
                  >
                    Di Luar
                  </span>
                  <div style={{ fontSize: "0.58rem", color: "#94a3b8", marginTop: "3px" }}>
                    Kembali: {formatDate(item.tgl_kembali_rencana || item.tgl_kembali)}
                  </div>
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
              <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534" }}>
                Tidak Ada Santri di Luar
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                Seluruh santri berada di dalam lingkungan pesantren.
              </div>
            </div>
          )
        ) : (
          filteredRiwayat.length > 0 ? (
            filteredRiwayat.map((item, idx) => (
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
                    <UserCheck size={18} />
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
                      {item.keperluan || "Izin Resmi"} • {item.nama_kelas || "-"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                      {formatDate(item.tgl_keluar_real || item.tgl_keluar)} s/d {formatDate(item.tgl_kembali_real || item.tgl_kembali)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.64rem",
                      fontWeight: 800,
                      color: "#047857",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      padding: "3px 8px",
                      borderRadius: "8px"
                    }}
                  >
                    Selesai
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
              <Calendar size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Tidak ada riwayat perizinan
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Belum ada arsip izin pada sistem.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
