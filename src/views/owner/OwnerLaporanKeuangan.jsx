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
  FileSpreadsheet
} from "lucide-react";

export default function OwnerLaporanKeuangan() {
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState("bulan_ini");
  const [activeSubTab, setActiveSubTab] = useState("transaksi"); // 'transaksi' | 'tunggakan' | 'infak'
  const [searchTable, setSearchTable] = useState("");

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
      const res = await axios.get(`/api/owner/keuangan?periode=${periode}`);
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
  }, [periode]);

  const filteredTransaksi = (data.transaksiTerakhir || []).filter((t) => {
    const q = searchTable.toLowerCase();
    return (
      (t.nama_santri || "").toLowerCase().includes(q) ||
      (t.nomor_transaksi || "").toLowerCase().includes(q) ||
      (t.metode_pembayaran || "").toLowerCase().includes(q)
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

  const totalObligasi = (data.kasPeriode || 0) + (data.totalPiutang || 0);
  const persenTerbayar = totalObligasi > 0 
    ? Math.round(((data.kasPeriode || 0) / totalObligasi) * 100) 
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* 1. VISUAL PROGRESS BAR RASIO KEUANGAN */}
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
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ffffff" }}>
              Tingkat Kolektibilitas Tagihan SPP &amp; Biaya Masuk ({periode === 'hari_ini' ? 'Hari Ini' : periode === 'tahun_ini' ? 'Tahun Ini' : 'Bulan Ini'})
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
              Perbandingan kas terbayar lunas terhadap total piutang yang masih tertahan
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#10b981" }}>{persenTerbayar}%</span>
            <span style={{ fontSize: "0.74rem", color: "#64748b", marginLeft: "4px" }}>Tercapai</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div style={{ width: "100%", height: "10px", background: "rgba(15, 23, 42, 0.9)", borderRadius: "999px", overflow: "hidden", display: "flex", border: "1px solid rgba(51, 65, 85, 0.6)" }}>
          <div 
            style={{ 
              width: `${Math.min(100, Math.max(0, persenTerbayar))}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #059669 0%, #10b981 100%)", 
              transition: "width 0.4s ease",
              boxShadow: "0 0 12px rgba(16, 185, 129, 0.6)"
            }} 
          />
          <div 
            style={{ 
              width: `${Math.min(100, Math.max(0, 100 - persenTerbayar))}%`, 
              height: "100%", 
              background: "rgba(244, 63, 94, 0.4)" 
            }} 
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.7rem", color: "#94a3b8" }}>
          <span style={{ color: "#34d399", fontWeight: 700 }}>● Kas Terbayar: Rp {Number(data.kasPeriode || 0).toLocaleString("id-ID")}</span>
          <span style={{ color: "#fb7185", fontWeight: 700 }}>● Piutang Tertahan: Rp {Number(data.totalPiutang || 0).toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* 2. 3 METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
        {/* Card 1 */}
        <div style={{ background: "linear-gradient(145deg, #132220 0%, #0c1a17 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>
              Penerimaan Kas ({periode === 'hari_ini' ? 'Hari Ini' : periode === 'tahun_ini' ? 'Tahun Ini' : 'Bulan Ini'})
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Rp {Number(data.kasPeriode || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "6px" }}>
            Total <strong>{data.transaksiPeriode} transaksi</strong> pembayaran sah
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ background: "linear-gradient(145deg, #251419 0%, #1a0b10 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#fb7185", textTransform: "uppercase" }}>
              Piutang Belum Tertagih
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={18} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Rp {Number(data.totalPiutang || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "6px" }}>
            Tertahan pada <strong>{data.totalSantriMenunggak} santri</strong>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ background: "linear-gradient(145deg, #112133 0%, #0a1522 100%)", borderRadius: "18px", padding: "18px", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
              Akumulasi Kas (Sepanjang Waktu)
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={18} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
            Rp {Number(data.totalSemuaKas || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "6px" }}>
            Saldo kas riil tervalidasi bendahara
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE CARD WITH MODERN TOOLBAR */}
      <div
        style={{
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(51, 65, 85, 0.8)",
          boxShadow: "0 8px 30px -5px rgba(0, 0, 0, 0.35)"
        }}
      >
        {/* Toolbar: Sub-tabs & Filter Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          
          {/* Sub-tab Pill Switcher */}
          <div style={{ display: "flex", gap: "6px", background: "rgba(15, 23, 42, 0.85)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(51, 65, 85, 0.8)" }}>
            <button
              onClick={() => setActiveSubTab("transaksi")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "transaksi" ? "#38bdf8" : "transparent",
                color: activeSubTab === "transaksi" ? "#0f172a" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Log Kas Masuk ({data.transaksiTerakhir?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("tunggakan")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "tunggakan" ? "#f43f5e" : "transparent",
                color: activeSubTab === "tunggakan" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Rekap Penunggak SPP ({data.tunggakanSantri?.length || 0})
            </button>

            <button
              onClick={() => setActiveSubTab("infak")}
              style={{
                padding: "8px 16px",
                borderRadius: "9px",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                background: activeSubTab === "infak" ? "#ec4899" : "transparent",
                color: activeSubTab === "infak" ? "#ffffff" : "#94a3b8",
                transition: "all 0.2s ease"
              }}
            >
              Infak &amp; Sedekah ({data.riwayatInfak?.length || 0})
            </button>
          </div>

          {/* Right Controls */}
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
                placeholder="Cari data..."
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

        {/* Content Table */}
        {loading ? (
          <div style={{ padding: "50px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={26} className="animate-spin" style={{ margin: "0 auto 10px", color: "#38bdf8" }} />
            <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>Memuat laporan keuangan resmi owner...</div>
          </div>
        ) : (
          <div>
            {/* 1. TABEL PENERIMAAN KAS */}
            {activeSubTab === "transaksi" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 14px" }}>No</th>
                      <th style={{ padding: "12px 14px" }}>No. Transaksi &amp; Kuitansi</th>
                      <th style={{ padding: "12px 14px" }}>Nama Santri &amp; Kelas</th>
                      <th style={{ padding: "12px 14px" }}>Waktu Bayar</th>
                      <th style={{ padding: "12px 14px" }}>Kanal Pembayaran</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Nominal Lunas</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransaksi.map((trx, idx) => (
                      <tr 
                        key={trx.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#38bdf8" }}>{trx.nomor_transaksi}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{trx.kuitansi_nomor || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#ffffff" }}>{trx.nama_santri}</div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{trx.nama_kelas ? `Kelas ${trx.nama_kelas}` : `NIS: ${trx.nis || "-"}`}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>{trx.tanggal_bayar || "-"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(71, 85, 105, 0.6)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", color: "#94a3b8", fontWeight: 700 }}>
                            {trx.metode_pembayaran || "Kasir"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, color: "#10b981", fontSize: "0.86rem" }}>
                          Rp {Number(trx.total_bayar || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#10b981", padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10b981" }} />
                            {trx.status_pembayaran || "Berhasil"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransaksi.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Tidak ada catatan transaksi kas pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. TABEL REKAP TUNGGAKAN */}
            {activeSubTab === "tunggakan" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 14px" }}>No</th>
                      <th style={{ padding: "12px 14px" }}>Nama Santri</th>
                      <th style={{ padding: "12px 14px" }}>NIS &amp; Kelas</th>
                      <th style={{ padding: "12px 14px" }}>Wali Santri &amp; No. WhatsApp</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Item Tagihan</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Total Tunggakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTunggakan.map((tg, idx) => (
                      <tr 
                        key={tg.santri_id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#ffffff" }}>
                          {tg.nama_santri}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>
                          <div>{tg.nama_kelas ? `Kelas ${tg.nama_kelas}` : "-"}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>NIS: {tg.nis || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>
                          <div>{tg.nama_wali || "-"}</div>
                          <div style={{ fontSize: "0.7rem", color: "#38bdf8", fontWeight: 700 }}>{tg.no_wa_wali || "-"}</div>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span style={{ background: "rgba(245, 158, 11, 0.18)", border: "1px solid rgba(245, 158, 11, 0.4)", color: "#facc15", padding: "2px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800 }}>
                            {tg.jumlah_tagihan} Tagihan
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, color: "#f43f5e", fontSize: "0.88rem" }}>
                          Rp {Number(tg.total_tunggakan || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                    {filteredTunggakan.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Alhamdulillah! Tidak ada santri yang menunggak SPP.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. TABEL INFAK & SEDEKAH */}
            {activeSubTab === "infak" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                  <thead>
                    <tr style={{ background: "rgba(15, 23, 42, 0.9)", color: "#94a3b8", textAlign: "left", borderBottom: "2px solid #334155" }}>
                      <th style={{ padding: "12px 14px" }}>No</th>
                      <th style={{ padding: "12px 14px" }}>Nama Donatur / Santri</th>
                      <th style={{ padding: "12px 14px" }}>Program Infak</th>
                      <th style={{ padding: "12px 14px" }}>Waktu Penerimaan</th>
                      <th style={{ padding: "12px 14px" }}>Kanal</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInfak.map((inf, idx) => (
                      <tr 
                        key={inf.id || idx} 
                        style={{ 
                          borderBottom: "1px solid rgba(51, 65, 85, 0.6)",
                          background: idx % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)"
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#ffffff" }}>
                          {inf.nama_donatur || "Hamba Allah"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#ec4899", fontWeight: 800 }}>
                          {inf.nama_program || "Infak Pengembangan Pesantren"}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#cbd5e1" }}>{inf.tanggal || "-"}</td>
                        <td style={{ padding: "12px 14px", color: "#94a3b8" }}>{inf.metode_pembayaran || "QRIS"}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 900, color: "#ec4899", fontSize: "0.86rem" }}>
                          Rp {Number(inf.nominal || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                    {filteredInfak.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                          Belum ada riwayat infak tercatat.
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
