import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CreditCard,
  Wallet,
  TrendingUp,
  AlertCircle,
  Search,
  RotateCw,
  Heart,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  User,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers
} from "lucide-react";
import LaporanPeriodeFilter, {
  createInitialPeriodeState,
  buildPeriodeQueryParams,
} from "./components/LaporanPeriodeFilter";

export default function OwnerLaporanKeuangan() {
  const [loading, setLoading] = useState(true);
  const [periodeFilter, setPeriodeFilter] = useState(() => createInitialPeriodeState("bulan"));
  const [activeSubTab, setActiveSubTab] = useState("transaksi"); // 'transaksi' | 'tunggakan' | 'infak'
  const [searchTable, setSearchTable] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(30);

  const [data, setData] = useState({
    kasPeriode: 0,
    transaksiPeriode: 0,
    totalSemuaKas: 0,
    totalPiutang: 0,
    totalSantriMenunggak: 0,
    transaksiTerakhir: [],
    tunggakanSantri: [],
    riwayatInfak: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/owner/keuangan?${buildPeriodeQueryParams(periodeFilter)}&limit=2000`);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn("Gagal mengambil data keuangan owner:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [periodeFilter]);

  useEffect(() => {
    setVisibleLimit(30);
  }, [periodeFilter, activeSubTab]);

  const formatMetode = (m) => {
    if (!m) return "Tunai";
    return String(m)
      .replace(/Virtual\s*Account/gi, "VA")
      .replace(/\s+/g, " ")
      .trim();
  };

  const filteredTransaksi = (data.transaksiTerakhir || []).filter((t) => {
    const q = searchTable.toLowerCase();
    return (
      (t.nama_santri || "").toLowerCase().includes(q) ||
      (t.nomor_transaksi || "").toLowerCase().includes(q) ||
      (t.metode_pembayaran || "").toLowerCase().includes(q) ||
      (t.nama_kelas || "").toLowerCase().includes(q)
    );
  });

  const filteredTunggakan = (data.tunggakanSantri || []).filter((t) => {
    const q = searchTable.toLowerCase();
    return (
      (t.nama_santri || "").toLowerCase().includes(q) ||
      (t.nis || "").toLowerCase().includes(q) ||
      (t.nama_kelas || "").toLowerCase().includes(q) ||
      (t.nama_wali || "").toLowerCase().includes(q)
    );
  });

  const filteredInfak = (data.riwayatInfak || []).filter((i) => {
    const q = searchTable.toLowerCase();
    return (
      (i.nama_donatur || "").toLowerCase().includes(q) ||
      (i.nama_program || "").toLowerCase().includes(q) ||
      (i.metode_pembayaran || "").toLowerCase().includes(q)
    );
  });

  const displayedTransaksi = filteredTransaksi.slice(0, visibleLimit);
  const displayedTunggakan = filteredTunggakan.slice(0, visibleLimit);
  const displayedInfak = filteredInfak.slice(0, visibleLimit);

  const totalObligasi = (data.kasPeriode || 0) + (data.totalPiutang || 0);
  const persenTerbayar = totalObligasi > 0
    ? Math.round(((data.kasPeriode || 0) / totalObligasi) * 100)
    : 0;

  const formatAngka = (n) => {
    if (n === null || n === undefined || n === "") return "0";
    const num = Math.round(Number(n) || 0);
    return num.toLocaleString("id-ID");
  };

  const formatRp = (n) => `Rp ${formatAngka(n)}`;

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
      
      {/* 1. PERIODE FILTER (HARI / BULAN / TAHUN) */}
      <LaporanPeriodeFilter value={periodeFilter} onChange={setPeriodeFilter} />

      {/* 2. HERO KAS MASUK CARD (MODERN LUXURY GREEN) */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)",
          borderRadius: "20px",
          padding: "16px 18px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -4px rgba(4, 120, 87, 0.35)",
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
              PENERIMAAN KAS PESANTREN
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.5px",
                marginTop: "4px",
                textShadow: "0 2px 6px rgba(0,0,0,0.2)"
              }}
            >
              {formatRp(data.kasPeriode)}
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
            <TrendingUp size={20} color="#a7f3d0" />
          </div>
        </div>

        {/* Progress Bar Kelancaran */}
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.66rem", fontWeight: 700, marginBottom: "5px" }}>
            <span style={{ color: "#a7f3d0" }}>Kelancaran Pembayaran</span>
            <span style={{ color: "#ffffff" }}>{persenTerbayar}% Tercapai</span>
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
                width: `${persenTerbayar}%`,
                background: "linear-gradient(90deg, #34d399 0%, #10b981 100%)",
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
            <div style={{ fontSize: "0.6rem", color: "#a7f3d0", fontWeight: 700 }}>
              TOTAL TRANSAKSI
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#ffffff", marginTop: "1px" }}>
              {(data.transaksiPeriode || 0).toLocaleString("id-ID")} <span style={{ fontSize: "0.65rem", fontWeight: 600 }}>Kuitansi</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#fecdd3", fontWeight: 700 }}>
              TOTAL TUNGGAKAN
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#fecdd3", marginTop: "1px" }}>
              {formatRp(data.totalPiutang)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL SUB SUMMARY STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {/* Card 1: Piutang / Tunggakan */}
        <div
          onClick={() => setActiveSubTab("tunggakan")}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: activeSubTab === "tunggakan" ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              SANTRI MENUNGGAK
            </span>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertCircle size={14} />
            </div>
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#b91c1c", marginTop: "6px" }}>
            {(data.totalSantriMenunggak || 0).toLocaleString("id-ID")} <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#64748b" }}>Santri</span>
          </div>
          <div style={{ fontSize: "0.64rem", color: "#991b1b", marginTop: "2px", fontWeight: 700 }}>
            {formatRp(data.totalPiutang)}
          </div>
        </div>

        {/* Card 2: Total Kas Akumulasi */}
        <div
          onClick={() => setActiveSubTab("transaksi")}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: activeSubTab === "transaksi" ? "1.5px solid #0d766e" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              TOTAL KAS SEMUA
            </span>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "8px",
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Wallet size={14} />
            </div>
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#065f46", marginTop: "6px" }}>
            {formatRp(data.totalSemuaKas)}
          </div>
          <div style={{ fontSize: "0.64rem", color: "#059669", marginTop: "2px", fontWeight: 700 }}>
            Seluruh saldo masuk
          </div>
        </div>
      </div>

      {/* 4. SUBTAB SWITCHER (TRANSAKSI / TUNGGAKAN / INFAK) */}
      <div
        style={{
          display: "flex",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "4px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          gap: "4px",
          marginTop: "4px"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab("transaksi")}
          style={{
            flex: 1,
            background: activeSubTab === "transaksi" ? "#ecfdf5" : "transparent",
            color: activeSubTab === "transaksi" ? "#065f46" : "#64748b",
            fontWeight: activeSubTab === "transaksi" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "transaksi" ? "1px solid #a7f3d0" : "1px solid transparent"
          }}
        >
          <Receipt size={14} />
          <span>Kas Masuk ({filteredTransaksi.length.toLocaleString("id-ID")})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("tunggakan")}
          style={{
            flex: 1,
            background: activeSubTab === "tunggakan" ? "#fef2f2" : "transparent",
            color: activeSubTab === "tunggakan" ? "#b91c1c" : "#64748b",
            fontWeight: activeSubTab === "tunggakan" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "tunggakan" ? "1px solid #fecaca" : "1px solid transparent"
          }}
        >
          <AlertCircle size={14} />
          <span>Tunggakan ({filteredTunggakan.length.toLocaleString("id-ID")})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("infak")}
          style={{
            flex: 1,
            background: activeSubTab === "infak" ? "#fff1f2" : "transparent",
            color: activeSubTab === "infak" ? "#be123c" : "#64748b",
            fontWeight: activeSubTab === "infak" ? 800 : 600,
            fontSize: "0.72rem",
            padding: "8px 4px",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            border: activeSubTab === "infak" ? "1px solid #fecdd3" : "1px solid transparent"
          }}
        >
          <Heart size={14} />
          <span>Infak ({filteredInfak.length.toLocaleString("id-ID")})</span>
        </button>
      </div>

      {/* 5. SEARCH INPUT */}
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
            activeSubTab === "transaksi"
              ? "Cari nama santri, kuitansi, atau kelas..."
              : activeSubTab === "tunggakan"
              ? "Cari santri menunggak / wali..."
              : "Cari nama donatur / program..."
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

      {/* 6. MOBILE CARD LIST (NO BULKY HORIZONTAL TABLES!) */}
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
              Memuat data keuangan...
            </div>
          </div>
        ) : activeSubTab === "transaksi" ? (
          /* LIST TRANSAKSI KAS MASUK */
          filteredTransaksi.length > 0 ? (
            <>
              {displayedTransaksi.map((item, idx) => (
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
                      <Receipt size={18} />
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
                        {item.nama_santri || "Santri"}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                        {item.nama_kelas ? `${item.nama_kelas} • ` : ""}{item.nomor_transaksi || "Kuitansi Sah"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                        {formatDate(item.tanggal_bayar || item.created_at || item.tanggal)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#059669" }}>
                      +{formatRp(item.total_bayar || item.nominal || 0)}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "3px",
                        fontSize: "0.58rem",
                        fontWeight: 800,
                        color: "#047857",
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        padding: "2px 6px",
                        borderRadius: "6px"
                      }}
                    >
                      {formatMetode(item.metode_pembayaran)}
                    </span>
                  </div>
                </div>
              ))}

              {filteredTransaksi.length > visibleLimit && (
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
                    color: "#0d766e",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    marginTop: "4px"
                  }}
                >
                  Tampilkan Lebih Banyak ({(filteredTransaksi.length - visibleLimit).toLocaleString("id-ID")} lagi)
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
              <Receipt size={32} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Tidak ada riwayat transaksi
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Belum ada kas masuk pada periode yang dipilih.
              </div>
            </div>
          )
        ) : activeSubTab === "tunggakan" ? (
          /* LIST TUNGGAKAN SANTRI */
          filteredTunggakan.length > 0 ? (
            <>
              {displayedTunggakan.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    border: "1px solid #fecaca",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.05)",
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
                        background: "#fef2f2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <AlertCircle size={18} />
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
                        NISN: {item.nis || "-"} • Kelas: {item.nama_kelas || "-"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                        Wali: {item.nama_wali || "Orang Tua"} {item.no_wa_wali || item.no_hp_wali ? `(${item.no_wa_wali || item.no_hp_wali})` : ""}
                      </div>
                      {item.rincian_bulan && (
                        <div
                          style={{
                            fontSize: "0.62rem",
                            color: "#dc2626",
                            fontWeight: 700,
                            marginTop: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          Bulan: {item.rincian_bulan}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#e11d48" }}>
                      -{formatRp(item.total_tunggakan || 0)}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "3px",
                        fontSize: "0.58rem",
                        fontWeight: 800,
                        color: "#b91c1c",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: "2px 6px",
                        borderRadius: "6px"
                      }}
                    >
                      {(item.jumlah_tagihan || 1).toLocaleString("id-ID")} Tagihan
                    </span>
                  </div>
                </div>
              ))}

              {filteredTunggakan.length > visibleLimit && (
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((v) => v + 50)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "12px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#b91c1c",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
                    }}
                  >
                    Tampilkan +50 ({(filteredTunggakan.length - visibleLimit).toLocaleString("id-ID")} lagi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(filteredTunggakan.length)}
                    style={{
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#b91c1c",
                      cursor: "pointer",
                      textAlign: "center",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Semua ({filteredTunggakan.length})
                  </button>
                </div>
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
              <CheckCircle2 size={32} color="#10b981" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#166534" }}>
                Luar Biasa, Tidak Ada Tunggakan!
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                Semua tagihan santri telah lunas terbayar.
              </div>
            </div>
          )
        ) : (
          /* LIST INFAK & WAKAF */
          filteredInfak.length > 0 ? (
            <>
              {displayedInfak.map((item, idx) => (
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
                        background: "#fff1f2",
                        color: "#e11d48",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <Heart size={18} />
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
                        {item.nama_donatur || "Hamba Allah"}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                        Program: {item.nama_program || "Pembangunan Pesantren"}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: "1px" }}>
                        {formatDate(item.tanggal || item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#be123c" }}>
                      +{formatRp(item.nominal || 0)}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "3px",
                        fontSize: "0.58rem",
                        fontWeight: 800,
                        color: "#be123c",
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        padding: "2px 6px",
                        borderRadius: "6px"
                      }}
                    >
                      {formatMetode(item.metode_pembayaran || "Infak Sah")}
                    </span>
                  </div>
                </div>
              ))}

              {filteredInfak.length > visibleLimit && (
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
                    color: "#be123c",
                    cursor: "pointer",
                    textAlign: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                    marginTop: "4px"
                  }}
                >
                  Tampilkan Lebih Banyak ({(filteredInfak.length - visibleLimit).toLocaleString("id-ID")} lagi)
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
              <Heart size={32} color="#f43f5e" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155" }}>
                Belum ada donasi infak
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px" }}>
                Riwayat sedekah sukarela akan muncul di sini.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
