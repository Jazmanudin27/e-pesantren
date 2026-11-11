import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Calendar,
  Search,
  Printer,
  Download,
  RotateCw,
  Filter,
  Wallet,
  X,
} from "lucide-react";

const formatAngkaTitik = (val) => {
  const num = Math.round(Number(val) || 0);
  const absStr = String(Math.abs(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return num < 0 ? `-${absStr}` : absStr;
};

const toDateYmd = (val) => {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.slice(0, 10);
  }
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateSlash = (val) => {
  const ymd = toDateYmd(val);
  if (!ymd) return "-";
  const [yyyy, mm, dd] = ymd.split("-");
  return `${dd}/${mm}/${yyyy}`;
};

export const getMutasiNominalForKantong = (item, kantongMode) => {
  const nominal = Number(item.nominal || 0);
  const biayaAdmin = Number(item.biaya_admin || 0);
  const jenis = String(item.jenis_transaksi || "");
  const sumber = String(item.kantong_sumber || "");
  const tujuan = String(item.kantong_tujuan || "");
  const isSantri = Boolean(item.is_pembayaran_santri);

  if (kantongMode === "tunai") {
    if (sumber !== "Kas Tunai" && tujuan !== "Kas Tunai") return null;
    if (isSantri && tujuan === "Kas Tunai") {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (jenis === "Pemasukan Lain" && tujuan === "Kas Tunai") {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (
      jenis === "Tarik Tunai dari Bank" ||
      (tujuan === "Kas Tunai" && sumber === "Rekening Bank")
    ) {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (
      jenis === "Setor Tunai ke Bank" ||
      (sumber === "Kas Tunai" && tujuan === "Rekening Bank")
    ) {
      return { penerimaan: 0, pengeluaran: nominal + biayaAdmin };
    }
    if (jenis === "Pengeluaran" && sumber === "Kas Tunai") {
      return { penerimaan: 0, pengeluaran: nominal + biayaAdmin };
    }
    return null;
  }

  if (kantongMode === "bank") {
    if (sumber !== "Rekening Bank" && tujuan !== "Rekening Bank") return null;
    if (isSantri && tujuan === "Rekening Bank") {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (jenis === "Pencairan Midtrans ke Bank") {
      return { penerimaan: nominal, pengeluaran: biayaAdmin };
    }
    if (jenis === "Pemasukan Lain" && tujuan === "Rekening Bank") {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (
      jenis === "Setor Tunai ke Bank" ||
      (tujuan === "Rekening Bank" && sumber === "Kas Tunai")
    ) {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (
      jenis === "Tarik Tunai dari Bank" ||
      (sumber === "Rekening Bank" && tujuan === "Kas Tunai")
    ) {
      return { penerimaan: 0, pengeluaran: nominal + biayaAdmin };
    }
    if (jenis === "Pengeluaran" && sumber === "Rekening Bank") {
      return { penerimaan: 0, pengeluaran: nominal + biayaAdmin };
    }
    return null;
  }

  if (kantongMode === "midtrans") {
    if (isSantri && (tujuan === "Midtrans" || sumber === "Midtrans")) {
      return { penerimaan: nominal, pengeluaran: 0 };
    }
    if (jenis === "Pencairan Midtrans ke Bank") {
      return { penerimaan: 0, pengeluaran: nominal };
    }
    return null;
  }

  // kantongMode === 'semua' (Gabungan Kas Tunai + Rekening Bank)
  if (isSantri && (tujuan === "Kas Tunai" || tujuan === "Rekening Bank")) {
    return { penerimaan: nominal, pengeluaran: 0 };
  }
  if (jenis === "Pencairan Midtrans ke Bank") {
    return { penerimaan: nominal, pengeluaran: biayaAdmin };
  }
  if (
    jenis === "Pemasukan Lain" &&
    (tujuan === "Kas Tunai" || tujuan === "Rekening Bank")
  ) {
    return { penerimaan: nominal, pengeluaran: 0 };
  }
  if (
    jenis === "Pengeluaran" &&
    (sumber === "Kas Tunai" || sumber === "Rekening Bank")
  ) {
    return { penerimaan: 0, pengeluaran: nominal + biayaAdmin };
  }
  if (
    (jenis === "Setor Tunai ke Bank" || jenis === "Tarik Tunai dari Bank") &&
    biayaAdmin > 0
  ) {
    return { penerimaan: 0, pengeluaran: biayaAdmin };
  }
  return null;
};

export default function LaporanBukuKasTable({
  externalBukuKas = null,
  defaultKantong = "tunai",
  onSelectRow = null,
}) {
  const todayYmd = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const firstDayOfMonthYmd = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  }, []);

  const [dariTanggal, setDariTanggal] = useState(firstDayOfMonthYmd);
  const [sampaiTanggal, setSampaiTanggal] = useState(todayYmd);
  const [kantongFilter, setKantongFilter] = useState(defaultKantong || "tunai");
  const [kategoriFilter, setKategoriFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalBukuKas, setInternalBukuKas] = useState([]);

  // Sync defaultKantong if changed from parent
  useEffect(() => {
    if (defaultKantong) {
      setKantongFilter(defaultKantong);
    }
  }, [defaultKantong]);

  const fetchFullBukuKas = useCallback(async () => {
    if (Array.isArray(externalBukuKas)) return;
    try {
      setLoading(true);
      const [res, resKasMasuk] = await Promise.all([
        axios.get("/api/keuangan/admin/buku-kas?limit=5000"),
        axios
          .get("/api/keuangan/admin/kas-masuk-sah?limit=5000")
          .catch(() => null),
      ]);
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        const baseBukuKas = Array.isArray(d.bukuKas) ? d.bukuKas : [];
        const existingIds = new Set(baseBukuKas.map((b) => String(b.id)));
        const rawTrx =
          resKasMasuk?.data?.data?.transaksi ||
          resKasMasuk?.data?.data?.transaksiTerakhir ||
          [];

        const mappedTrx = (Array.isArray(rawTrx) ? rawTrx : [])
          .filter((r) => !existingIds.has(`trx-${r.id}`))
          .map((r) => {
            const chLower = String(r.channel_pembayaran || "").toLowerCase();
            const isMidtrans =
              Boolean(r.snap_token) ||
              ["QRIS", "Virtual Account"].includes(r.metode_pembayaran) ||
              chLower.includes("midtrans") ||
              chLower.includes("qris") ||
              r.status_dana === "Mengendap di Midtrans";
            const isTransferBank =
              !isMidtrans &&
              (r.status_dana === "Di Rekening Bank" ||
                r.metode_pembayaran === "Transfer" ||
                chLower.includes("transfer"));

            const kantongTujuan = isMidtrans
              ? "Midtrans"
              : isTransferBank
                ? "Rekening Bank"
                : "Kas Tunai";

            const jenisLabel = isMidtrans
              ? r.status_dana === "Di Rekening Bank"
                ? "Pembayaran Midtrans (Sudah Cair)"
                : "Pembayaran Midtrans (Mengendap)"
              : isTransferBank
                ? "Kas Masuk Tagihan (Transfer)"
                : "Kas Masuk Tagihan (Tunai)";

            const rincianText =
              r.rincian_item || r.keterangan || "Pembayaran Tagihan";

            return {
              id: `trx-${r.id}`,
              transaksi_pembayaran_id: r.id,
              kode_mutasi:
                r.nomor_kuitansi ||
                r.kuitansi_nomor ||
                r.nomor_transaksi ||
                `TRX-${r.id}`,
              tanggal: r.tanggal_bayar || r.created_at,
              jenis_transaksi: jenisLabel,
              kategori: "Pembayaran Santri",
              kantong_sumber: isMidtrans ? "Midtrans" : null,
              kantong_tujuan: kantongTujuan,
              nominal: Number(r.nominal_pokok || r.total_bayar || 0),
              biaya_admin: 0,
              keterangan: `${r.nama_santri || "Santri"} — ${rincianText}`,
              penanggung_jawab: r.diterima_oleh || "Kasir",
              is_pembayaran_santri: true,
              status_dana: r.status_dana,
            };
          });

        setInternalBukuKas([...baseBukuKas, ...mappedTrx]);
      }
    } catch (err) {
      console.warn("Gagal memuat data laporan buku kas:", err);
    } finally {
      setLoading(false);
    }
  }, [externalBukuKas]);

  useEffect(() => {
    fetchFullBukuKas();
  }, [fetchFullBukuKas]);

  const rawList = Array.isArray(externalBukuKas)
    ? externalBukuKas
    : internalBukuKas;

  // Daftar kategori unik berdasarkan kantong yang dipilih
  const availableKategoriList = useMemo(() => {
    const setKat = new Set();
    (rawList || []).forEach((item) => {
      const mut = getMutasiNominalForKantong(item, kantongFilter);
      if (!mut) return;
      const kat = String(
        item.kategori || item.jenis_transaksi || "Lainnya",
      ).trim();
      if (kat) setKat.add(kat);
    });
    return Array.from(setKat);
  }, [rawList, kantongFilter]);

  // Perhitungan Saldo Awal, Baris Mutasi (Kronologis Terlama -> Terbaru), dan Total
  const reportData = useMemo(() => {
    const startYmd =
      dariTanggal && sampaiTanggal && dariTanggal > sampaiTanggal
        ? sampaiTanggal
        : dariTanggal;
    const endYmd =
      dariTanggal && sampaiTanggal && dariTanggal > sampaiTanggal
        ? dariTanggal
        : sampaiTanggal;

    // 1. Filter item yang masuk ke kantong & urutkan kronologis (tanggal ASC, id ASC)
    const validItems = [];
    (rawList || []).forEach((item) => {
      const mut = getMutasiNominalForKantong(item, kantongFilter);
      if (!mut) return;
      if (mut.penerimaan === 0 && mut.pengeluaran === 0) return;

      const kat = String(
        item.kategori || item.jenis_transaksi || "Lainnya",
      ).trim();
      if (kategoriFilter !== "semua" && kat !== kategoriFilter) {
        return;
      }

      const ymd = toDateYmd(item.tanggal || item.created_at);
      validItems.push({
        raw: item,
        ymd,
        timestamp: new Date(item.tanggal || item.created_at || 0).getTime() || 0,
        noBukti: item.kode_mutasi || `KAS-${item.id}`,
        kategori: kat,
        keterangan:
          item.keterangan &&
          !item.is_pembayaran_santri &&
          item.kategori &&
          !String(item.keterangan)
            .toLowerCase()
            .includes(String(item.kategori).toLowerCase())
            ? `${item.kategori} - ${item.keterangan}`
            : item.keterangan || item.kategori || item.jenis_transaksi || "-",
        penerimaan: mut.penerimaan,
        pengeluaran: mut.pengeluaran,
      });
    });

    validItems.sort((a, b) => {
      if (a.ymd !== b.ymd) return a.ymd.localeCompare(b.ymd);
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      return String(a.raw.id).localeCompare(String(b.raw.id));
    });

    // 2. Hitung SALDO AWAL (semua transaksi sebelum startYmd)
    let saldoAwal = 0;
    const rowsInPeriod = [];

    validItems.forEach((it) => {
      if (startYmd && it.ymd && it.ymd < startYmd) {
        saldoAwal += it.penerimaan - it.pengeluaran;
      } else if ((!startYmd || it.ymd >= startYmd) && (!endYmd || it.ymd <= endYmd)) {
        rowsInPeriod.push(it);
      }
    });

    // 3. Hitung Saldo Berjalan (Running Balance) & terapkan pencarian teks
    let runningSaldo = saldoAwal;
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;
    const q = searchQuery.trim().toLowerCase();

    const finalRows = [];
    rowsInPeriod.forEach((it) => {
      runningSaldo += it.penerimaan - it.pengeluaran;
      if (q) {
        const match =
          String(it.noBukti).toLowerCase().includes(q) ||
          String(it.keterangan).toLowerCase().includes(q) ||
          String(it.kategori).toLowerCase().includes(q);
        if (!match) return;
      }
      totalPenerimaan += it.penerimaan;
      totalPengeluaran += it.pengeluaran;
      finalRows.push({
        ...it,
        saldo: runningSaldo,
      });
    });

    return {
      saldoAwal,
      rows: finalRows,
      totalPenerimaan,
      totalPengeluaran,
      saldoAkhir: runningSaldo,
    };
  }, [
    rawList,
    kantongFilter,
    kategoriFilter,
    dariTanggal,
    sampaiTanggal,
    searchQuery,
  ]);

  const kantongLabelMap = {
    tunai: "Kas Tunai (Cash Bendahara)",
    bank: "Rekening Bank Pesantren",
    midtrans: "Kantong Midtrans (QRIS / VA)",
    semua: "Semua Kantong (Kas Tunai + Rek. Bank)",
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=960,height=700");
    if (!printWin) return;
    const rowsHtml = reportData.rows
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${formatDateSlash(r.ymd)}</td>
          <td>${r.noBukti}</td>
          <td>${r.keterangan}</td>
          <td style="text-align:right;color:#15803d;font-weight:600;">${
            r.penerimaan > 0 ? formatAngkaTitik(r.penerimaan) : ""
          }</td>
          <td style="text-align:right;color:#dc2626;font-weight:600;">${
            r.pengeluaran > 0 ? formatAngkaTitik(r.pengeluaran) : ""
          }</td>
          <td style="text-align:right;font-weight:700;">${formatAngkaTitik(
            r.saldo,
          )}</td>
        </tr>`,
      )
      .join("");

    printWin.document.write(`
      <html>
        <head>
          <title>Laporan Buku Kas - ${kantongLabelMap[kantongFilter] || "Buku Kas"}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            h2 { margin: 0 0 4px; font-size: 16px; }
            .meta { font-size: 12px; color: #475569; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #1e293b; padding: 5px 8px; }
            .thead-main th { background: #063954; color: #ffffff; font-weight: 700; text-align: center; }
            .row-saldo-awal td { background: #08415c; color: #ffffff; font-weight: 700; }
            .row-total td { background: #f1f5f9; font-weight: 800; }
          </style>
        </head>
        <body>
          <h2>LAPORAN MUTASI BUKU KAS — PONDOK PESANTREN NURUL WAFA</h2>
          <div class="meta">
            Kantong: <b>${kantongLabelMap[kantongFilter]}</b> &nbsp;|&nbsp;
            Periode: <b>${formatDateSlash(dariTanggal)} s/d ${formatDateSlash(sampaiTanggal)}</b>
            ${kategoriFilter !== "semua" ? `&nbsp;|&nbsp; Kategori: <b>${kategoriFilter}</b>` : ""}
          </div>
          <table>
            <thead>
              <tr class="thead-main">
                <th style="width:36px;">No</th>
                <th style="width:85px;">Tanggal</th>
                <th style="width:130px;">No. Bukti</th>
                <th>Keterangan</th>
                <th style="width:105px;">Penerimaan</th>
                <th style="width:105px;">Pengeluaran</th>
                <th style="width:115px;">Saldo</th>
              </tr>
              <tr class="row-saldo-awal">
                <td colspan="6" style="text-align:center;letter-spacing:0.5px;">SALDO AWAL</td>
                <td style="text-align:right;">${formatAngkaTitik(reportData.saldoAwal)}</td>
              </tr>
            </thead>
            <tbody>
              ${
                rowsHtml ||
                `<tr><td colspan="7" style="text-align:center;padding:16px;color:#64748b;">Tidak ada transaksi pada periode ini</td></tr>`
              }
              <tr class="row-total">
                <td colspan="4" style="text-align:center;">TOTAL MUTASI &amp; SALDO AKHIR</td>
                <td style="text-align:right;color:#15803d;">${formatAngkaTitik(
                  reportData.totalPenerimaan,
                )}</td>
                <td style="text-align:right;color:#dc2626;">${formatAngkaTitik(
                  reportData.totalPengeluaran,
                )}</td>
                <td style="text-align:right;">${formatAngkaTitik(
                  reportData.saldoAkhir,
                )}</td>
              </tr>
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleExportExcel = () => {
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <tr style="background:#063954;color:#ffffff;font-weight:bold;">
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Bukti</th>
            <th>Keterangan</th>
            <th>Penerimaan</th>
            <th>Pengeluaran</th>
            <th>Saldo</th>
          </tr>
          <tr style="background:#08415c;color:#ffffff;font-weight:bold;">
            <td colspan="6" align="center">SALDO AWAL</td>
            <td align="right">${Math.round(reportData.saldoAwal)}</td>
          </tr>
          ${reportData.rows
            .map(
              (r, i) => `
            <tr>
              <td align="center">${i + 1}</td>
              <td align="center">${formatDateSlash(r.ymd)}</td>
              <td>${r.noBukti}</td>
              <td>${r.keterangan}</td>
              <td align="right" style="color:#15803d;">${
                r.penerimaan > 0 ? Math.round(r.penerimaan) : ""
              }</td>
              <td align="right" style="color:#dc2626;">${
                r.pengeluaran > 0 ? Math.round(r.pengeluaran) : ""
              }</td>
              <td align="right">${Math.round(r.saldo)}</td>
            </tr>`,
            )
            .join("")}
          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="4" align="center">TOTAL MUTASI &amp; SALDO AKHIR</td>
            <td align="right" style="color:#15803d;">${Math.round(
              reportData.totalPenerimaan,
            )}</td>
            <td align="right" style="color:#dc2626;">${Math.round(
              reportData.totalPengeluaran,
            )}</td>
            <td align="right">${Math.round(reportData.saldoAkhir)}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Buku_Kas_${kantongFilter}_${dariTanggal}_sd_${sampaiTanggal}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* PANEL FILTER: DARI - SAMPAI, KATEGORI KANTONG, KATEGORI TRANSAKSI */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "12px 14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Row 1: Judul & Tombol Export / Cetak */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={15} color="#063954" />
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 900,
                color: "#0f172a",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              Filter Laporan Buku Kas
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {!Array.isArray(externalBukuKas) && (
              <button
                type="button"
                onClick={fetchFullBukuKas}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "5px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <RotateCw size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
                padding: "5px 9px",
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#047857",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <Download size={12} />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: "#063954",
                border: "none",
                borderRadius: "8px",
                padding: "5px 10px",
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <Printer size={12} />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Row 2: Dari Tanggal & Sampai Tanggal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#475569",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Dari Tanggal
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={dariTanggal}
                onChange={(e) => setDariTanggal(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  borderRadius: "9px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#475569",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Sampai Tanggal
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={sampaiTanggal}
                onChange={(e) => setSampaiTanggal(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 8px",
                  borderRadius: "9px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Filter Kategori Kantong & Kategori Transaksi */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#475569",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Kategori Kantong
            </label>
            <select
              value={kantongFilter}
              onChange={(e) => {
                setKantongFilter(e.target.value);
                setKategoriFilter("semua");
              }}
              style={{
                width: "100%",
                padding: "7px 9px",
                borderRadius: "9px",
                border: "1.5px solid #063954",
                fontSize: "0.74rem",
                fontWeight: 800,
                color: "#063954",
                background: "#f0f9ff",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="tunai">Kas Tunai (Cash)</option>
              <option value="bank">Rekening Bank</option>
              <option value="midtrans">Midtrans (QRIS/VA)</option>
              <option value="semua">Semua (Kas + Bank)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#475569",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Kategori Transaksi
            </label>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 9px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="semua">Semua Kategori</option>
              {availableKategoriList.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4: Search Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "9px",
            padding: "6px 10px",
          }}
        >
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Cari No. Bukti, Keterangan, atau Nama Santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "0.74rem",
              color: "#0f172a",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#94a3b8",
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TABEL LAPORAN BUKU KAS (PERSIS FORMAT AKUNTANSI GAMBAR) */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1.5px solid #063954",
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: "680px",
              borderCollapse: "collapse",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: "0.74rem",
            }}
          >
            <thead>
              {/* HEADER BARIS 1: KOLOM UTAMA */}
              <tr
                style={{
                  background: "#063954",
                  color: "#ffffff",
                }}
              >
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 6px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "36px",
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "84px",
                  }}
                >
                  Tanggal
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "125px",
                  }}
                >
                  No. Bukti
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 10px",
                    textAlign: "center",
                    fontWeight: 800,
                  }}
                >
                  Keterangan
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "96px",
                  }}
                >
                  Penerimaan
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "96px",
                  }}
                >
                  Pengeluaran
                </th>
                <th
                  style={{
                    border: "1px solid #334155",
                    padding: "7px 8px",
                    textAlign: "center",
                    fontWeight: 800,
                    width: "105px",
                  }}
                >
                  Saldo
                </th>
              </tr>

              {/* HEADER BARIS 2: SALDO AWAL */}
              <tr
                style={{
                  background: "#08415c",
                  color: "#ffffff",
                }}
              >
                <td
                  colSpan={6}
                  style={{
                    border: "1px solid #334155",
                    padding: "6px 10px",
                    textAlign: "center",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  SALDO AWAL
                </td>
                <td
                  style={{
                    border: "1px solid #334155",
                    padding: "6px 8px",
                    textAlign: "right",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAngkaTitik(reportData.saldoAwal)}
                </td>
              </tr>
            </thead>

            <tbody>
              {loading && rawList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#64748b",
                      border: "1px solid #94a3b8",
                    }}
                  >
                    Memuat data laporan buku kas...
                  </td>
                </tr>
              ) : reportData.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "24px 12px",
                      textAlign: "center",
                      color: "#64748b",
                      border: "1px solid #94a3b8",
                    }}
                  >
                    Tidak ada transaksi pada rentang tanggal &amp; kantong yang
                    dipilih.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, idx) => (
                  <tr
                    key={`${row.raw.id}-${idx}`}
                    onClick={() => onSelectRow && onSelectRow(row.raw)}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      cursor: onSelectRow ? "pointer" : "default",
                    }}
                  >
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 6px",
                        textAlign: "right",
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 7px",
                        textAlign: "center",
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDateSlash(row.ymd)}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 7px",
                        textAlign: "left",
                        color: "#0f172a",
                        whiteSpace: "nowrap",
                        fontSize: "0.7rem",
                      }}
                    >
                      {row.noBukti}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 8px",
                        textAlign: "left",
                        color: "#0f172a",
                      }}
                    >
                      {row.keterangan}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 8px",
                        textAlign: "right",
                        color: "#15803d",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.penerimaan > 0
                        ? formatAngkaTitik(row.penerimaan)
                        : ""}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 8px",
                        textAlign: "right",
                        color: "#dc2626",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.pengeluaran > 0
                        ? formatAngkaTitik(row.pengeluaran)
                        : ""}
                    </td>
                    <td
                      style={{
                        border: "1px solid #64748b",
                        padding: "5px 8px",
                        textAlign: "right",
                        color: "#0f172a",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatAngkaTitik(row.saldo)}
                    </td>
                  </tr>
                ))
              )}

              {/* FOOTER BARIS TOTAL & SALDO AKHIR */}
              <tr
                style={{
                  background: "#e2e8f0",
                  color: "#0f172a",
                  fontWeight: 900,
                }}
              >
                <td
                  colSpan={4}
                  style={{
                    border: "1px solid #475569",
                    padding: "7px 10px",
                    textAlign: "center",
                    fontWeight: 900,
                    letterSpacing: "0.03em",
                  }}
                >
                  TOTAL MUTASI &amp; SALDO AKHIR
                </td>
                <td
                  style={{
                    border: "1px solid #475569",
                    padding: "7px 8px",
                    textAlign: "right",
                    color: "#15803d",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAngkaTitik(reportData.totalPenerimaan)}
                </td>
                <td
                  style={{
                    border: "1px solid #475569",
                    padding: "7px 8px",
                    textAlign: "right",
                    color: "#dc2626",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAngkaTitik(reportData.totalPengeluaran)}
                </td>
                <td
                  style={{
                    border: "1px solid #475569",
                    padding: "7px 8px",
                    textAlign: "right",
                    color: "#063954",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatAngkaTitik(reportData.saldoAkhir)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

