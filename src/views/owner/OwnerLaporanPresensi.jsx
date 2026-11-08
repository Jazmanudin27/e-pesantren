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
  Smile,
  QrCode,
  Fingerprint
} from "lucide-react";

export default function OwnerLaporanPresensi() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("hari_ini");
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

  const filteredLogs = (data.logPresensi || []).filter((p) => {
    const q = searchTable.toLowerCase();
    return (
      (p.nama_santri || "").toLowerCase().includes(q) ||
      (p.nis || "").toLowerCase().includes(q) ||
      (p.nama_kelas || "").toLowerCase().includes(q) ||
      (p.nama_kegiatan || "").toLowerCase().includes(q)
    );
  });

  const s = data.summary || {};
  const totalPresensi = (s.hadir || 0) + (s.sakit || 0) + (s.izin || 0) + (s.alfa || 0);
  const hadirPct = totalPresensi > 0 ? Math.round(((s.hadir || 0) / totalPresensi) * 100) : 0;
  const sakitPct = totalPresensi > 0 ? Math.round(((s.sakit || 0) / totalPresensi) * 100) : 0;
  const izinPct = totalPresensi > 0 ? Math.round(((s.izin || 0) / totalPresensi) * 100) : 0;
  const alfaPct = totalPresensi > 0 ? Math.round(((s.alfa || 0) / totalPresensi) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* 1. VISUAL MULTI-COLOR ATTENDANCE GAUGE STRIP */}
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
              Tingkat Kehadiran Santri Berjamaah &amp; Mengaji ({periode === 'hari_ini' ? 'Hari Ini' : periode === 'tahun_ini' ? 'Tahun Ini' : 'Bulan Ini'})
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
              Total <strong>{totalPresensi} catatan absensi</strong> terekam kamera Wajah AI &amp; mesin Fingerprint
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "#10b981" }}>{hadirPct}%</span>
            <span style={{ fontSize: "0.74rem", color: "#64748b", marginLeft: "4px" }}>Hadir</span>
          </div>
        </div>

        {/* Multi-Segment Attendance Bar */}
        <div style={{ width: "100%", height: "12px", background: "#0f172a", borderRadius: "999px", overflow: "hidden", display: "flex", border: "1px solid rgba(51, 65, 85, 0.6)" }}>
          <div style={{ width: `${hadirPct}%`, height: "100%", background: "#10b981", boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)" }} title={`Hadir: ${s.hadir}`} />
          <div style={{ width: `${sakitPct}%`, height: "100%", background: "#f59e0b" }} title={`Sakit: ${s.sakit}`} />
          <div style={{ width: `${izinPct}%`, height: "100%", background: "#38bdf8" }} title={`Izin: ${s.izin}`} />
          <div style={{ width: `${alfaPct}%`, height: "100%", background: "#f43f5e" }} title={`Alfa: ${s.alfa}`} />
        </div>

        {/* Badges Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px", marginTop: "10px", fontSize: "0.72rem" }}>
          <span style={{ color: "#34d399", fontWeight: 700 }}>● Hadir: {s.hadir || 0} ({hadirPct}%)</span>
          <span style={{ color: "#facc15", fontWeight: 700 }}>● Sakit: {s.sakit || 0} ({sakitPct}%)</span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>● Izin: {s.izin || 0} ({izinPct}%)</span>
          <span style={{ color: "#fb7185", fontWeight: 700 }}>● Alfa: {s.alfa || 0} ({alfaPct}%)</span>
        </div>
      </div>

      {/* 2. 4 COLORED STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
        <div style={{ background: "linear-gradient(145deg, #132220 0%, #0c1a17 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>
            ✓ HADIR LENGKAP
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "6px" }}>
            {s.hadir || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#a7f3d0", marginTop: "4px" }}>
            Tepat waktu di saf &amp; halaqah
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #241c10 0%, #1a1309 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#facc15", textTransform: "uppercase" }}>
            ✚ SAKIT (RAWAT)
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "6px" }}>
            {s.sakit || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fef08a", marginTop: "4px" }}>
            Istirahat poskestren
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
            ✉ IZIN RESMI
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "6px" }}>
            {s.izin || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#bae6fd", marginTop: "4px" }}>
            Izin pulang / keluarga
          </div>
        </div>

        <div style={{ background: "linear-gradient(145deg, #251419 0%, #1a0b10 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase" }}>
            ⚠ ALFA / BELUM SCAN
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#ffffff", marginTop: "6px" }}>
            {s.alfa || 0} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#fecdd3", marginTop: "4px" }}>
            Evaluasi kedisiplinan
          </div>
        </div>
      </div>

      {/* 3. REKAP PER SESI SHALAT & MENGAJI */}
      <div
        style={{
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(51, 65, 85, 0.8)"
        }}
      >
        <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#ffffff", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={17} color="#38bdf8" />
          <span>Rekap Kehadiran per Kegiatan Shalat Berjamaah &amp; Mengaji</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          {(data.rekapPerSesi || []).map((sesi, idx) => {
            const sumRow = (sesi.jml_hadir || 0) + (sesi.jml_sakit || 0) + (sesi.jml_izin || 0) + (sesi.jml_alfa || 0);
            const rateRow = sumRow > 0 ? Math.round(((sesi.jml_hadir || 0) / sumRow) * 100) : 0;
            return (
              <div
                key={idx}
                style={{
                  background: "rgba(15, 23, 42, 0.85)",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  border: "1px solid rgba(51, 65, 85, 0.7)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "0.86rem" }}>{sesi.nama_kegiatan}</span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: sesi.tipe_presensi === "Kegiatan" ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.2)",
                      border: sesi.tipe_presensi === "Kegiatan" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(56, 189, 248, 0.4)",
                      color: sesi.tipe_presensi === "Kegiatan" ? "#34d399" : "#38bdf8",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontWeight: 800
                    }}
                  >
                    {sesi.tipe_presensi || "Berjamaah"}
                  </span>
                </div>

                {/* Progress bar per session */}
                <div style={{ width: "100%", height: "6px", background: "rgba(30, 41, 59, 0.9)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
                  <div style={{ width: `${rateRow}%`, height: "100%", background: rateRow > 80 ? "#10b981" : rateRow > 50 ? "#38bdf8" : "#f59e0b" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8" }}>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>Hadir: {sesi.jml_hadir} ({rateRow}%)</span>
                  <span>Sakit: {sesi.jml_sakit}</span>
                  <span>Izin: {sesi.jml_izin}</span>
                  <span style={{ color: "#fb7185" }}>Alfa: {sesi.jml_alfa}</span>
                </div>
              </div>
            );
          })}
          {(data.rekapPerSesi || []).length === 0 && (
            <div style={{ color: "#64748b", fontSize: "0.8rem", padding: "20px", textAlign: "center" }}>
              Belum ada kegiatan terekam pada filter periode ini.
            </div>
          )}
        </div>
      </div>

      {/* 4. DETAIL LOG PRESENSI SANTRI */}
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
            <Clock size={17} color="#10b981" />
            <span>Riwayat Scan Presensi Santri ({filteredLogs.length})</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(71, 85, 105, 0.8)",
                borderRadius: "10px",
                padding: "8px 14px",
                color: "#ffffff",
                fontSize: "0.78rem",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="hari_ini">Hari Ini</option>
              <option value="bulan_ini">Bulan Ini</option>
              <option value="tahun_ini">Tahun Ini</option>
            </select>

            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari santri..."
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
                  width: "180px"
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
            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Memuat catatan presensi...</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: "12px 14px" }}>No</th>
                  <th style={{ padding: "12px 14px" }}>Nama Santri</th>
                  <th style={{ padding: "12px 14px" }}>Kelas &amp; Asrama</th>
                  <th style={{ padding: "12px 14px" }}>Kegiatan</th>
                  <th style={{ padding: "12px 14px" }}>Waktu Scan</th>
                  <th style={{ padding: "12px 14px" }}>Metode</th>
                  <th style={{ padding: "12px 14px", textAlign: "center" }}>Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr 
                    key={log.id || idx} 
                    style={{ 
                      borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                      background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                    }}
                  >
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 800, color: "#ffffff" }}>{log.nama_santri}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>NIS: {log.nis || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                      <div>{log.nama_kelas ? `Kelas ${log.nama_kelas}` : "-"}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{log.nama_asrama || "-"}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontWeight: 800, color: "#38bdf8" }}>{log.nama_kegiatan}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>
                      <div>{log.tanggal}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{log.waktu_scan || "-"} WIB</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(71, 85, 105, 0.6)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700 }}>
                        {log.metode_presensi || "Fingerprint"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background:
                            log.status === "Hadir"
                              ? "rgba(16, 185, 129, 0.2)"
                              : log.status === "Sakit"
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(244, 63, 94, 0.2)",
                          border:
                            log.status === "Hadir"
                              ? "1px solid rgba(16, 185, 129, 0.4)"
                              : log.status === "Sakit"
                              ? "1px solid rgba(245, 158, 11, 0.4)"
                              : "1px solid rgba(244, 63, 94, 0.4)",
                          color:
                            log.status === "Hadir"
                              ? "#10b981"
                              : log.status === "Sakit"
                              ? "#f59e0b"
                              : "#f43f5e",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 800
                        }}
                      >
                        <span 
                          style={{ 
                            width: "5px", 
                            height: "5px", 
                            borderRadius: "50%", 
                            background: log.status === "Hadir" ? "#10b981" : log.status === "Sakit" ? "#f59e0b" : "#f43f5e" 
                          }} 
                        />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                      Tidak ada rekaman presensi pada periode ini.
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
