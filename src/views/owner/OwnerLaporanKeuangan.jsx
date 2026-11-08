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
  DollarSign
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 3 Metric Mini Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Pemasukan Kas ({periode === 'hari_ini' ? 'Hari Ini' : periode === 'tahun_ini' ? 'Tahun Ini' : 'Bulan Ini'})</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#10b981" }}>
            Rp {Number(data.kasPeriode || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Total {data.transaksiPeriode} transaksi berhasil diverifikasi
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Total Piutang / Tunggakan SPP</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={16} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#f43f5e" }}>
            Rp {Number(data.totalPiutang || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Tertahan pada {data.totalSantriMenunggak} santri aktif
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: "14px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8" }}>Akumulasi Kas Masuk (All Time)</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#38bdf8" }}>
            Rp {Number(data.totalSemuaKas || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
            Total penerimaan kas resmi pesantren
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={{ background: "#1e293b", borderRadius: "16px", padding: "18px", border: "1px solid #334155" }}>
        {/* Toolbar: Sub-tabs & Filter Periode */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          {/* Sub-tab Pill Switcher */}
          <div style={{ display: "flex", gap: "6px", background: "#0f172a", padding: "4px", borderRadius: "10px", border: "1px solid #334155" }}>
            <button
              onClick={() => setActiveSubTab("transaksi")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "transaksi" ? "#38bdf8" : "transparent",
                color: activeSubTab === "transaksi" ? "#0f172a" : "#94a3b8"
              }}
            >
              Log Penerimaan Kas ({data.transaksiTerakhir?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab("tunggakan")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "tunggakan" ? "#f43f5e" : "transparent",
                color: activeSubTab === "tunggakan" ? "#ffffff" : "#94a3b8"
              }}
            >
              Rekap Penunggak SPP ({data.tunggakanSantri?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab("infak")}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
                background: activeSubTab === "infak" ? "#ec4899" : "transparent",
                color: activeSubTab === "infak" ? "#ffffff" : "#94a3b8"
              }}
            >
              Infak & Sedekah ({data.riwayatInfak?.length || 0})
            </button>
          </div>

          {/* Right Toolbar Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Periode Dropdown */}
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "6px 12px",
                color: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="hari_ini">Hari Ini</option>
              <option value="bulan_ini">Bulan Ini</option>
              <option value="tahun_ini">Tahun Ini</option>
            </select>

            {/* Quick Search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari data..."
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "6px 10px 6px 28px",
                  fontSize: "0.76rem",
                  color: "#ffffff",
                  outline: "none",
                  width: "160px"
                }}
              />
              <Search size={13} color="#64748b" style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            <button
              onClick={fetchData}
              title="Refresh Data"
              style={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "6px 10px",
                color: "#94a3b8",
                cursor: "pointer"
              }}
            >
              <RotateCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.8rem" }}>Memuat laporan keuangan resmi owner...</div>
          </div>
        ) : (
          <div>
            {/* 1. TABEL PENERIMAAN KAS */}
            {activeSubTab === "transaksi" && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>No</th>
                      <th style={{ padding: "10px 14px" }}>No. Transaksi / Kuitansi</th>
                      <th style={{ padding: "10px 14px" }}>Santri & Kelas</th>
                      <th style={{ padding: "10px 14px" }}>Tanggal Bayar</th>
                      <th style={{ padding: "10px 14px" }}>Metode</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Nominal</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransaksi.map((trx, idx) => (
                      <tr key={trx.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 800, color: "#38bdf8" }}>{trx.nomor_transaksi}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{trx.kuitansi_nomor || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 700, color: "#ffffff" }}>{trx.nama_santri}</div>
                          <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{trx.nama_kelas ? `Kelas ${trx.nama_kelas}` : `NIS: ${trx.nis || "-"}`}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>{trx.tanggal_bayar || "-"}</td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{trx.metode_pembayaran || "Kasir"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#10b981" }}>
                          Rp {Number(trx.total_bayar || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "3px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700 }}>
                            ✓ {trx.status_pembayaran || "Berhasil"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredTransaksi.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          Tidak ada data transaksi pembayaran kas.
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
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>No</th>
                      <th style={{ padding: "10px 14px" }}>Nama Santri</th>
                      <th style={{ padding: "10px 14px" }}>NIS & Kelas</th>
                      <th style={{ padding: "10px 14px" }}>Wali Santri / Kontak</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Item Tagihan</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Total Tunggakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTunggakan.map((tg, idx) => (
                      <tr key={tg.santri_id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "#ffffff" }}>
                          {tg.nama_santri}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>
                          <div>{tg.nama_kelas ? `Kelas ${tg.nama_kelas}` : "-"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#64748b" }}>NIS: {tg.nis || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>
                          <div>{tg.nama_wali || "-"}</div>
                          <div style={{ fontSize: "0.68rem", color: "#38bdf8" }}>{tg.no_wa_wali || "-"}</div>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#f59e0b", fontWeight: 700 }}>
                          {tg.jumlah_tagihan} Tagihan
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 900, color: "#f43f5e" }}>
                          Rp {Number(tg.total_tunggakan || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                    {filteredTunggakan.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                          Tidak ada data penunggak SPP.
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
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>
                      <th style={{ padding: "10px 14px" }}>No</th>
                      <th style={{ padding: "10px 14px" }}>Donatur / Hamba Allah</th>
                      <th style={{ padding: "10px 14px" }}>Program Infak</th>
                      <th style={{ padding: "10px 14px" }}>Waktu</th>
                      <th style={{ padding: "10px 14px" }}>Metode</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInfak.map((inf, idx) => (
                      <tr key={inf.id || idx} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "#ffffff" }}>
                          {inf.nama_donatur || "Hamba Allah"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#ec4899", fontWeight: 700 }}>
                          {inf.nama_program || "Infak Umum"}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#cbd5e1" }}>{inf.tanggal || "-"}</td>
                        <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{inf.metode_pembayaran || "QRIS"}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#ec4899" }}>
                          Rp {Number(inf.nominal || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                    {filteredInfak.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
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

