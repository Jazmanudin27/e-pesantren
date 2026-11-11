import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Printer,
  Download,
  RotateCw,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";

const formatAngkaTitik = (val) => {
  const num = Math.round(Number(val) || 0);
  const absStr = String(Math.abs(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return num < 0 ? `-${absStr}` : absStr;
};

const formatRp = (val) => {
  const n = Number(val) || 0;
  return `${n < 0 ? "- " : ""}Rp ${formatAngkaTitik(Math.abs(n))}`;
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

const formatDateId = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [internalBukuKas, setInternalBukuKas] = useState([]);
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    row: null,
  });

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

    const validItems = [];
    (rawList || []).forEach((item) => {
      const mut = getMutasiNominalForKantong(item, kantongFilter);
      if (!mut) return;
      if (mut.penerimaan === 0 && mut.pengeluaran === 0) return;

      const kat = String(
        item.kategori || item.jenis_transaksi || "Lainnya",
      ).trim();

      const rawKet = String(item.keterangan || "-");
      const parts = rawKet.split(" — ");
      const shortTitle = item.is_pembayaran_santri
        ? parts[0] || item.nama_santri || "Pembayaran Santri"
        : item.kategori || item.jenis_transaksi || rawKet;

      const ymd = toDateYmd(item.tanggal || item.created_at);
      validItems.push({
        raw: item,
        ymd,
        timestamp:
          new Date(item.tanggal || item.created_at || 0).getTime() || 0,
        noBukti: item.kode_mutasi || `KAS-${item.id}`,
        kategori: kat,
        shortTitle,
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

    // Hitung SALDO AWAL (semua transaksi sebelum startYmd)
    let saldoAwal = 0;
    const rowsInPeriod = [];

    validItems.forEach((it) => {
      if (startYmd && it.ymd && it.ymd < startYmd) {
        saldoAwal += it.penerimaan - it.pengeluaran;
      } else if (
        (!startYmd || it.ymd >= startYmd) &&
        (!endYmd || it.ymd <= endYmd)
      ) {
        rowsInPeriod.push(it);
      }
    });

    // Hitung Saldo Berjalan (Running Balance) & terapkan pencarian teks
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
          String(it.shortTitle).toLowerCase().includes(q) ||
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
  }, [rawList, kantongFilter, dariTanggal, sampaiTanggal, searchQuery]);

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

  const handleRowClick = (row) => {
    if (onSelectRow) {
      onSelectRow(row.raw);
    } else {
      setDetailModal({ isOpen: true, row });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* 1. PANEL FILTER: DARI - SAMPAI & KATEGORI KANTONG */}
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

        {/* Row 3: Filter Kategori Kantong */}
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
            onChange={(e) => setKantongFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "9px",
              border: "1.5px solid #063954",
              fontSize: "0.76rem",
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
            <option value="semua">Semua (Kas Tunai + Rek. Bank)</option>
          </select>
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

      {/* 2. BARIS HEADER SALDO AWAL */}
      <div
        style={{
          background: "linear-gradient(135deg, #063954 0%, #084c6e 100%)",
          color: "#ffffff",
          borderRadius: "14px",
          padding: "11px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(6, 57, 84, 0.2)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 900,
              letterSpacing: "0.05em",
              color: "#bae6fd",
              textTransform: "uppercase",
            }}
          >
            SALDO AWAL
          </div>
          <div style={{ fontSize: "0.62rem", color: "#e0f2fe", marginTop: "1px" }}>
            Sebelum {formatDateSlash(dariTanggal)}
          </div>
        </div>
        <div style={{ fontSize: "1rem", fontWeight: 900, color: "#ffffff" }}>
          Rp {formatAngkaTitik(reportData.saldoAwal)}
        </div>
      </div>

      {/* 3. LISTVIEW MUTASI BUKU KAS (RINGKAS, KLIK UNTUK MODAL RINCIAN) */}
      {loading && rawList.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "24px 14px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.76rem",
            border: "1px solid #e2e8f0",
          }}
        >
          Memuat data laporan buku kas...
        </div>
      ) : reportData.rows.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "24px 14px",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.76rem",
            border: "1px dashed #cbd5e1",
          }}
        >
          Tidak ada transaksi pada rentang tanggal &amp; kantong yang dipilih.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reportData.rows.map((row, idx) => {
            const isMasuk = row.penerimaan > 0 && row.pengeluaran === 0;
            return (
              <div
                key={`${row.raw.id}-${idx}`}
                onClick={() => handleRowClick(row)}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "11px 13px",
                  border: "1px solid #e2e8f0",
                  borderLeft: `4px solid ${isMasuk ? "#15803d" : "#dc2626"}`,
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Baris Atas: No + Tanggal + No. Bukti */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "6px",
                    borderBottom: "1px dashed #f1f5f9",
                    paddingBottom: "5px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        background: "#063954",
                        color: "#ffffff",
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: "5px",
                        flexShrink: 0,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: "#334155",
                        flexShrink: 0,
                      }}
                    >
                      {formatDateSlash(row.ymd)}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.64rem",
                      fontWeight: 700,
                      color: "#475569",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "1px 6px",
                      borderRadius: "5px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "180px",
                    }}
                  >
                    {row.noBukti}
                  </span>
                </div>

                {/* Baris Tengah: Nama Santri / Judul Singkat (Tanpa Rincian Panjang) */}
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {row.shortTitle}
                </div>

                {/* Baris Bawah: Penerimaan / Pengeluaran & Saldo Berjalan */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    background: "#f8fafc",
                    padding: "6px 9px",
                    borderRadius: "9px",
                    marginTop: "1px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {row.penerimaan > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 800,
                            color: "#15803d",
                            textTransform: "uppercase",
                          }}
                        >
                          Penerimaan
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 900,
                            color: "#15803d",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          <ArrowUpRight size={13} />
                          <span>+ {formatAngkaTitik(row.penerimaan)}</span>
                        </div>
                      </div>
                    )}

                    {row.pengeluaran > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.58rem",
                            fontWeight: 800,
                            color: "#dc2626",
                            textTransform: "uppercase",
                          }}
                        >
                          Pengeluaran
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 900,
                            color: "#dc2626",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                        >
                          <ArrowDownRight size={13} />
                          <span>- {formatAngkaTitik(row.pengeluaran)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 800,
                        color: "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      Saldo
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 900,
                        color: "#063954",
                      }}
                    >
                      Rp {formatAngkaTitik(row.saldo)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. FOOTER TOTAL MUTASI & SALDO AKHIR */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "12px 14px",
          border: "1.5px solid #063954",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            paddingBottom: "8px",
            borderBottom: "1px dashed #cbd5e1",
          }}
        >
          <div
            style={{
              background: "#ecfdf5",
              padding: "7px 10px",
              borderRadius: "9px",
              border: "1px solid #bbf7d0",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: "#047857",
                textTransform: "uppercase",
              }}
            >
              Total Penerimaan
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 900,
                color: "#15803d",
                marginTop: "2px",
              }}
            >
              + Rp {formatAngkaTitik(reportData.totalPenerimaan)}
            </div>
          </div>

          <div
            style={{
              background: "#fff1f2",
              padding: "7px 10px",
              borderRadius: "9px",
              border: "1px solid #fecdd3",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: "#be123c",
                textTransform: "uppercase",
              }}
            >
              Total Pengeluaran
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 900,
                color: "#dc2626",
                marginTop: "2px",
              }}
            >
              - Rp {formatAngkaTitik(reportData.totalPengeluaran)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 900,
              color: "#063954",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            SALDO AKHIR
          </span>
          <span
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#063954",
            }}
          >
            Rp {formatAngkaTitik(reportData.saldoAkhir)}
          </span>
        </div>
      </div>

      {/* MODAL RINCIAN SAAT ITEM LISTVIEW DIKLIK */}
      {detailModal.isOpen && detailModal.row && (() => {
        const r = detailModal.row;
        const it = r.raw;
        const isOut = r.pengeluaran > 0 && r.penerimaan === 0;
        const isIn = r.penerimaan > 0;
        const isCair = it.jenis_transaksi === "Pencairan Midtrans ke Bank";

        const color = isOut
          ? "#be123c"
          : isIn
            ? "#047857"
            : isCair
              ? "#6d28d9"
              : "#0369a1";
        const bg = isOut
          ? "#fff1f2"
          : isIn
            ? "#ecfdf5"
            : isCair
              ? "#f5f3ff"
              : "#f0f9ff";
        const borderCol = isOut
          ? "#fecdd3"
          : isIn
            ? "#bbf7d0"
            : isCair
              ? "#ddd6fe"
              : "#bae6fd";

        const rawKet = String(it.keterangan || "-");
        const parts = rawKet.split(" — ");
        const titleName = it.is_pembayaran_santri
          ? parts[0] || "Pembayaran Santri"
          : it.kategori || it.jenis_transaksi;
        const detailBody = it.is_pembayaran_santri
          ? parts.slice(1).join(" — ") || rawKet
          : rawKet;
        const bulletItems = it.is_pembayaran_santri
          ? detailBody
              .split(/,\s*(?=[A-Za-z])/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        return (
          <div
            onClick={() => setDetailModal({ isOpen: false, row: null })}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "#ffffff",
                borderRadius: "22px",
                padding: "18px",
                boxShadow: "0 20px 40px rgba(15, 23, 42, 0.25)",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Modal Top Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 9px",
                      borderRadius: "999px",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      background: bg,
                      color,
                      border: `1px solid ${borderCol}`,
                      marginBottom: "6px",
                    }}
                  >
                    {it.jenis_transaksi === "Pemasukan Lain"
                      ? "Pemasukan"
                      : it.jenis_transaksi}
                  </span>
                  <div
                    style={{
                      fontSize: "0.98rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      lineHeight: 1.25,
                    }}
                  >
                    {titleName}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{formatDateId(it.tanggal)}</span>
                    {r.noBukti && <span>• #{r.noBukti}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModal({ isOpen: false, row: null })}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Nominal & Saldo Box */}
              <div
                style={{
                  background: bg,
                  border: `1px solid ${borderCol}`,
                  borderRadius: "14px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      color,
                      textTransform: "uppercase",
                    }}
                  >
                    Nominal Transaksi
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#475569",
                      marginTop: "2px",
                    }}
                  >
                    Saldo Setelah Mutasi: <b>{formatRp(r.saldo)}</b>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 900,
                    color,
                  }}
                >
                  {isOut ? `- ${formatRp(r.pengeluaran)}` : `+ ${formatRp(r.penerimaan)}`}
                </div>
              </div>

              {/* Rincian Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  maxHeight: "240px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "6px",
                  }}
                >
                  {it.is_pembayaran_santri
                    ? `Rincian Pembayaran (${bulletItems.length || 1} Item)`
                    : "Uraian / Keterangan"}
                </div>

                {bulletItems.length > 1 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {bulletItems.map((bItem, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          padding: "6px 9px",
                          background: "#ffffff",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: bg,
                            color,
                            fontSize: "0.64rem",
                            fontWeight: 900,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {bIdx + 1}
                        </span>
                        <span>{bItem}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.45,
                    }}
                  >
                    {detailBody}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, row: null })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
