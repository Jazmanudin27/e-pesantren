import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Receipt,
  Search,
  ArrowLeft,
  RotateCw,
  X,
  CheckCircle2,
  Calendar,
  Share2,
  SlidersHorizontal,
  Building2,
  GraduationCap,
  Wallet,
  CreditCard,
  QrCode,
  RotateCcw,
} from "lucide-react";
import ModalKuitansi from "./components/ModalKuitansi";
import MobileLoadingState from "../../components/MobileLoadingState";
import { toastError } from "../../utils/alert.util";

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getMethodMeta = (metode = "", channel = "") => {
  const combined = `${channel || ""} ${metode || ""}`.toLowerCase();
  if (combined.includes("tunai") || combined.includes("cash") || combined.includes("kasir")) {
    return {
      kind: "cash",
      label: "Cash / Tunai",
      color: "#047857",
      bg: "#ecfdf5",
      border: "#a7f3d0",
      accent: "#059669",
      Icon: Wallet,
    };
  }
  if (combined.includes("qris")) {
    return {
      kind: "digital",
      label: "QRIS",
      color: "#6d28d9",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      accent: "#7c3aed",
      Icon: QrCode,
    };
  }
  if (combined.includes("transfer") || /\btf\b/.test(combined)) {
    return {
      kind: "digital",
      label: "Transfer Bank",
      color: "#0369a1",
      bg: "#f0f9ff",
      border: "#bae6fd",
      accent: "#0284c7",
      Icon: CreditCard,
    };
  }
  if (combined.includes("va") || combined.includes("virtual")) {
    return {
      kind: "digital",
      label: "Virtual Account",
      color: "#0369a1",
      bg: "#f0f9ff",
      border: "#bae6fd",
      accent: "#0284c7",
      Icon: CreditCard,
    };
  }
  return {
    kind: "cash",
    label: String(channel || metode || "Cash / Tunai").trim(),
    color: "#047857",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    accent: "#059669",
    Icon: Wallet,
  };
};

const extractYmd = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export default function RincianKasMasukView({ onBackToHome, onChangeTab }) {
  const [activeSubMode, setActiveSubMode] = useState("penerimaan"); // 'penerimaan' | 'kantong_kas'
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_kas_masuk_sah: 0,
    total_transaksi: 0,
    saldo_kas_tunai: 0,
    saldo_rekening_bank: 0,
    saldo_mengendap_midtrans: 0,
    jumlah_trx_mengendap_midtrans: 0,
    saldo_siap_pakai: 0,
  });
  const [transaksiList, setTransaksiList] = useState([]);
  const [sekolahMaster, setSekolahMaster] = useState([]);
  const [kelasMaster, setKelasMaster] = useState([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [tanggalDari, setTanggalDari] = useState("");
  const [tanggalSampai, setTanggalSampai] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("semua");
  const [filterKelas, setFilterKelas] = useState("semua");
  const [filterKantongDana, setFilterKantongDana] = useState("semua");
  const [visibleLimit, setVisibleLimit] = useState(30);

  // Modal Kuitansi
  const [kuitansiModal, setKuitansiModal] = useState({
    isOpen: false,
    data: null,
  });

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString("id-ID")}`;

  // Fetch Master Sekolah & Kelas
  useEffect(() => {
    Promise.all([
      axios.get("/api/sekolah").catch(() => ({ data: { data: [] } })),
      axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
    ]).then(([resSekolah, resKelas]) => {
      const sRaw = resSekolah.data?.data || resSekolah.data || [];
      if (Array.isArray(sRaw)) setSekolahMaster(sRaw);

      const kRaw = resKelas.data?.data?.data || resKelas.data?.data || resKelas.data?.kelas || [];
      if (Array.isArray(kRaw)) setKelasMaster(kRaw);
    });
  }, []);

  const fetchKasMasuk = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "1500");
      if (tanggalDari) params.set("tanggal_dari", tanggalDari);
      if (tanggalSampai) params.set("tanggal_sampai", tanggalSampai);
      if (filterSekolah && filterSekolah !== "semua") params.set("sekolah", filterSekolah);
      if (filterKelas && filterKelas !== "semua") params.set("kelas", filterKelas);

      const res = await axios
        .get(`/api/keuangan/admin/kas-masuk-sah?${params.toString()}`)
        .catch(() => axios.get("/api/keuangan/admin/rekap"));

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.summary) {
          setSummary((prev) => ({
            ...prev,
            ...d.summary,
            ...(d.kantong || {}),
            total_kas_masuk_sah:
              d.summary.total_kas_masuk_sah ||
              d.summary.total_nominal_terbayar ||
              0,
            total_transaksi:
              d.summary.total_transaksi ||
              (d.transaksi || d.transaksiTerakhir || []).length,
          }));
        }
        setTransaksiList(d.transaksi || d.transaksiTerakhir || []);
      }
    } catch (err) {
      console.warn("Gagal memuat rincian kas masuk sah:", err);
      toastError("Gagal memuat data kas masuk");
    } finally {
      setLoading(false);
    }
  }, [tanggalDari, tanggalSampai, filterSekolah, filterKelas]);

  useEffect(() => {
    fetchKasMasuk();
  }, [fetchKasMasuk]);

  useEffect(() => {
    setVisibleLimit(30);
  }, [tanggalDari, tanggalSampai, filterSekolah, filterKelas, search]);

  // Opsi Select Sekolah & Kelas (gabung master + data transaksi riil)
  const sekolahOptions = useMemo(() => {
    const map = new Map();
    sekolahMaster.forEach((s) => {
      const label = String(s.nama_sekolah || s.jenjang || "").trim();
      if (label) map.set(label.toLowerCase(), label);
    });
    transaksiList.forEach((t) => {
      const label = String(t.nama_sekolah || "").trim();
      if (label && label !== "-") map.set(label.toLowerCase(), label);
    });
    if (map.size === 0) {
      ["SMP Nurul Wafa", "SMA Nurul Wafa", "SMK Nurul Wafa"].forEach((s) =>
        map.set(s.toLowerCase(), s),
      );
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [sekolahMaster, transaksiList]);

  const kelasOptions = useMemo(() => {
    const map = new Map();
    kelasMaster.forEach((k) => {
      const label = String(k.nama_kelas || "").trim();
      if (label) map.set(label.toLowerCase(), label);
    });
    transaksiList.forEach((t) => {
      const label = String(t.nama_kelas || "").trim();
      if (label && label !== "-") map.set(label.toLowerCase(), label);
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  }, [kelasMaster, transaksiList]);

  // Filter Client-side tambahan (instant search & fallback parity)
  const filteredTrx = useMemo(() => {
    const [dateStart, dateEnd] =
      tanggalDari && tanggalSampai
        ? tanggalDari <= tanggalSampai
          ? [tanggalDari, tanggalSampai]
          : [tanggalSampai, tanggalDari]
        : [tanggalDari, tanggalSampai];

    return (transaksiList || []).filter((trx) => {
      const trxDate = extractYmd(trx.tanggal_bayar || trx.created_at);
      if (dateStart && trxDate && trxDate < dateStart) return false;
      if (dateEnd && trxDate && trxDate > dateEnd) return false;

      if (filterSekolah !== "semua") {
        const sk = String(trx.nama_sekolah || "").toLowerCase();
        const tj = String(trx.tingkat_sekolah || "").toLowerCase();
        const target = filterSekolah.toLowerCase();
        if (sk !== target && !sk.includes(target) && tj !== target) return false;
      }

      if (filterKelas !== "semua") {
        const kl = String(trx.nama_kelas || "").trim().toLowerCase();
        if (kl !== filterKelas.trim().toLowerCase()) return false;
      }

      if (filterKantongDana !== "semua") {
        const sd = String(trx.status_dana || "");
        if (sd !== filterKantongDana) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const fields = [
          trx.nama_santri,
          trx.nis,
          trx.nama_kelas,
          trx.nama_sekolah,
          trx.nomor_transaksi,
          trx.nomor_kuitansi,
          trx.rincian_item,
          trx.keterangan,
        ];
        return fields.some((f) => String(f || "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [transaksiList, tanggalDari, tanggalSampai, filterSekolah, filterKelas, filterKantongDana, search]);

  const hasActiveFilter = Boolean(
    tanggalDari ||
      tanggalSampai ||
      filterSekolah !== "semua" ||
      filterKelas !== "semua" ||
      filterKantongDana !== "semua" ||
      search.trim(),
  );

  const handleResetFilters = () => {
    setTanggalDari("");
    setTanggalSampai("");
    setFilterSekolah("semua");
    setFilterKelas("semua");
    setFilterKantongDana("semua");
    setSearch("");
  };

  // Ringkasan sesuai daftar terfilter
  const liveTotals = useMemo(() => {
    let tunaiSum = 0;
    let bankSum = 0;
    let midtransMengendapSum = 0;
    let totalSum = 0;
    for (const trx of filteredTrx) {
      const amt = Number(trx.nominal_pokok || trx.total_bayar || 0);
      totalSum += amt;
      if (trx.status_dana === "Mengendap di Midtrans") {
        midtransMengendapSum += amt;
      } else if (trx.status_dana === "Di Rekening Bank") {
        bankSum += amt;
      } else if (trx.status_dana === "Di Kas Tunai") {
        tunaiSum += amt;
      } else {
        const meta = getMethodMeta(trx.metode_pembayaran, trx.channel_pembayaran, trx.status_dana);
        if (meta.kind === "midtrans_pending") midtransMengendapSum += amt;
        else if (meta.kind === "digital") bankSum += amt;
        else tunaiSum += amt;
      }
    }
    return {
      total: hasActiveFilter ? totalSum : Number(summary.total_kas_masuk_sah || totalSum),
      tunai: tunaiSum,
      bank: bankSum,
      midtransMengendap: midtransMengendapSum,
    };
  }, [filteredTrx, hasActiveFilter, summary.total_kas_masuk_sah]);

  const displayedTrx = useMemo(
    () => filteredTrx.slice(0, visibleLimit),
    [filteredTrx, visibleLimit],
  );

  const handleSendWaKuitansi = (kData) => {
    if (!kData?.no_wa_wali) {
      toastError("Nomor WhatsApp wali santri belum terdaftar.");
      return;
    }
    let phone = String(kData.no_wa_wali).replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);

    const dateStr = formatDateId(kData.tanggal_bayar || new Date());

    const text =
      `*KUITANSI PEMBAYARAN RESMI*\n` +
      `*Pondok Pesantren Nurul Wafa*\n` +
      `-----------------------------------------\n` +
      `*No. Kuitansi:* ${kData.nomor_kuitansi || kData.nomor_transaksi || `KW-${kData.id}`}\n` +
      `*Nama Santri:* ${kData.nama_santri}\n` +
      `*NIS:* ${kData.nis || "-"}\n` +
      `*Tanggal:* ${dateStr}\n` +
      `*Metode:* ${kData.metode_pembayaran || "Tunai / Kasir"}\n` +
      `*Status:* Lunas / Berhasil\n` +
      `-----------------------------------------\n` +
      `*Rincian Pembayaran:*\n` +
      `  • ${kData.rincian_item || kData.keterangan || "Pembayaran Administrasi"}\n` +
      `-----------------------------------------\n` +
      `*TOTAL DIBAYAR: ${formatRp(kData.total_bayar)}*\n\n` +
      `_Terima kasih atas pembayaran yang telah dilakukan. Syukron Katsiiron._\n` +
      `*Bendahara Pesantren Nurul Wafa*`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <div
      style={{
        paddingBottom: "96px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* 1. HERO SUMMARY CARD */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #047857 0%, #065f46 55%, #022c22 100%)",
          padding: onBackToHome ? "16px" : "18px 16px 26px",
          margin: onBackToHome ? "0 14px" : "0",
          color: "#ffffff",
          boxShadow: "0 10px 28px -6px rgba(4, 120, 87, 0.35)",
          borderRadius: onBackToHome ? "20px" : "0 0 26px 26px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-28px",
            top: "-28px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(52, 211, 153, 0.14)",
            pointerEvents: "none",
          }}
        />

        {/* Top Bar (Desktop Only — Mobile uses Unified Owner Header) */}
        {!onBackToHome && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.18rem",
                  fontWeight: 900,
                  letterSpacing: "-0.3px",
                }}
              >
                Rincian Kas Masuk Sah
              </h2>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#a7f3d0",
                  marginTop: "2px",
                  fontWeight: 600,
                }}
              >
                Penerimaan Pembayaran Lunas Terverifikasi
              </div>
            </div>

            <button
              type="button"
              onClick={fetchKasMasuk}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                width: "36px",
                height: "36px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Refresh Data"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}

        {/* Hero Glass Summary Card */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            borderRadius: "18px",
            padding: "14px 16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                color: "#a7f3d0",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {hasActiveFilter ? "Total Kas (Terfilter)" : "Total Kas Masuk Diterima"}
            </div>
            {onChangeTab && (
              <button
                type="button"
                onClick={() => onChangeTab("keuangan-kasir")}
                style={{
                  background: "#ffffff",
                  border: "none",
                  color: "#047857",
                  padding: "5px 10px",
                  borderRadius: "9px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                + Kasir
              </button>
            )}
          </div>

          <div
            style={{
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "#ffffff",
              marginTop: "4px",
              letterSpacing: "-0.5px",
            }}
          >
            {formatRp(liveTotals.total)}
          </div>

          {/* 3 Mini Metric Strip: 3 Kantong Dana */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "6px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            <div
              onClick={() =>
                setFilterKantongDana(filterKantongDana === "Di Kas Tunai" ? "semua" : "Di Kas Tunai")
              }
              style={{
                background: filterKantongDana === "Di Kas Tunai" ? "rgba(16, 185, 129, 0.35)" : "rgba(0, 0, 0, 0.16)",
                border: filterKantongDana === "Di Kas Tunai" ? "1px solid #6ee7b7" : "1px solid transparent",
                borderRadius: "10px",
                padding: "7px 8px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "0.58rem", color: "#a7f3d0", fontWeight: 700 }}>
                Cash / Tunai
              </div>
              <div style={{ fontSize: "0.73rem", fontWeight: 800, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatRp(liveTotals.tunai)}
              </div>
            </div>

            <div
              onClick={() =>
                setFilterKantongDana(filterKantongDana === "Di Rekening Bank" ? "semua" : "Di Rekening Bank")
              }
              style={{
                background: filterKantongDana === "Di Rekening Bank" ? "rgba(59, 130, 246, 0.35)" : "rgba(0, 0, 0, 0.16)",
                border: filterKantongDana === "Di Rekening Bank" ? "1px solid #93c5fd" : "1px solid transparent",
                borderRadius: "10px",
                padding: "7px 8px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "0.58rem", color: "#a7f3d0", fontWeight: 700 }}>
                Rekening Bank
              </div>
              <div style={{ fontSize: "0.73rem", fontWeight: 800, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatRp(liveTotals.bank)}
              </div>
            </div>

            <div
              onClick={() =>
                setFilterKantongDana(
                  filterKantongDana === "Mengendap di Midtrans" ? "semua" : "Mengendap di Midtrans",
                )
              }
              style={{
                background:
                  filterKantongDana === "Mengendap di Midtrans"
                    ? "rgba(245, 158, 11, 0.38)"
                    : "rgba(0, 0, 0, 0.16)",
                border:
                  filterKantongDana === "Mengendap di Midtrans"
                    ? "1px solid #fcd34d"
                    : "1px solid transparent",
                borderRadius: "10px",
                padding: "7px 8px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "0.58rem", color: "#fde68a", fontWeight: 700 }}>
                Midtrans (Tertahan)
              </div>
              <div style={{ fontSize: "0.73rem", fontWeight: 800, marginTop: "2px", color: "#fef3c7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatRp(liveTotals.midtransMengendap)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER PANEL */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "13px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.74rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              <SlidersHorizontal size={14} color="#059669" />
              <span>Filter &amp; Pencarian</span>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  border: "none",
                  background: "#fef2f2",
                  color: "#dc2626",
                  padding: "4px 9px",
                  borderRadius: "8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RotateCcw size={11} />
                Reset
              </button>
            )}
          </div>

          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              placeholder="Cari santri, NIS, no kuitansi, atau item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 32px 10px 36px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                outline: "none",
                fontSize: "0.8rem",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#e2e8f0",
                  border: "none",
                  borderRadius: "50%",
                  width: "19px",
                  height: "19px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Date Range: Dari - Sampai */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                <Calendar size={11} color="#059669" />
                <span>Dari Tanggal</span>
              </label>
              <input
                type="date"
                value={tanggalDari}
                onChange={(e) => setTanggalDari(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 9px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                <Calendar size={11} color="#059669" />
                <span>Sampai Tanggal</span>
              </label>
              <input
                type="date"
                value={tanggalSampai}
                onChange={(e) => setTanggalSampai(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 9px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Select Option: Sekolah & Kelas */}
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
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                <Building2 size={11} color="#059669" />
                <span>Sekolah</span>
              </label>
              <select
                value={filterSekolah}
                onChange={(e) => setFilterSekolah(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              >
                <option value="semua">Semua Sekolah</option>
                {sekolahOptions.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.67rem",
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                <GraduationCap size={11} color="#059669" />
                <span>Kelas</span>
              </label>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#f8fafc",
                  boxSizing: "border-box",
                }}
              >
                <option value="semua">Semua Kelas</option>
                {kelasOptions.map((kl) => (
                  <option key={kl} value={kl}>
                    {kl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Posisi Kantong Dana */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {[
              { id: "semua", label: "Semua Kantong" },
              { id: "Di Kas Tunai", label: "Di Kas Tunai" },
              { id: "Di Rekening Bank", label: "Di Rekening Bank" },
              { id: "Mengendap di Midtrans", label: "Mengendap di Midtrans" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterKantongDana(opt.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  border:
                    filterKantongDana === opt.id
                      ? "1px solid #059669"
                      : "1px solid #e2e8f0",
                  background:
                    filterKantongDana === opt.id ? "#ecfdf5" : "#f8fafc",
                  color:
                    filterKantongDana === opt.id ? "#047857" : "#475569",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. LIST KARTU TRANSAKSI KAS MASUK */}
      <div
        style={{
          padding: "0 14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {loading && transaksiList.length === 0 ? (
          <MobileLoadingState
            title="Memuat Kas Masuk Sah..."
            subtitle="Menghimpun kuitansi dan rincian pembayaran terverifikasi..."
            iconColor="#059669"
          />
        ) : filteredTrx.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              padding: "36px 20px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
              }}
            >
              <Receipt size={26} color="#94a3b8" />
            </div>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1e293b" }}>
              Tidak Ada Transaksi Ditemukan
            </div>
            <div
              style={{
                fontSize: "0.74rem",
                color: "#64748b",
                marginTop: "4px",
              }}
            >
              Coba sesuaikan rentang tanggal, sekolah, kelas, atau kata kunci.
            </div>
          </div>
        ) : (
          <>
            {displayedTrx.map((trx) => {
              const dateStr = formatDateId(trx.tanggal_bayar || trx.created_at);
              const methodMeta = getMethodMeta(
                trx.metode_pembayaran,
                trx.channel_pembayaran,
                trx.status_dana,
              );
              const MethodIcon = methodMeta.Icon;
              const nominalPokok = Number(trx.nominal_pokok || trx.total_bayar || 0);
              const nominalFee = Number(trx.nominal_fee_gateway || 0);

              return (
                <div
                  key={trx.id}
                  onClick={() => setKuitansiModal({ isOpen: true, data: trx })}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "13px 14px",
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${methodMeta.accent}`,
                    boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)",
                    cursor: "pointer",
                  }}
                >
                  {/* Header Row: Icon + Title/Date + Nominal & Badge (Persis Buku Kas) */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "12px",
                          background: methodMeta.bg,
                          color: methodMeta.color,
                          border: `1px solid ${methodMeta.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "0.82rem",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(trx.nama_santri)}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {trx.nama_santri}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            flexWrap: "wrap",
                            marginTop: "2px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Calendar size={11} />
                            {dateStr}
                          </span>
                          <span>• #{trx.nomor_transaksi || `TRX-${trx.id}`}</span>
                          {trx.nama_kelas && (
                            <span
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                padding: "1px 5px",
                                borderRadius: "5px",
                                fontWeight: 700,
                                fontSize: "0.62rem",
                              }}
                            >
                              {trx.nama_kelas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "3px",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 900,
                          color: "#047857",
                        }}
                      >
                        + {formatRp(nominalPokok)}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          background: methodMeta.bg,
                          color: methodMeta.color,
                          border: `1px solid ${methodMeta.border}`,
                        }}
                      >
                        <MethodIcon size={10} />
                        <span>{methodMeta.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTrx.length > visibleLimit && (
              <button
                type="button"
                onClick={() => setVisibleLimit((v) => v + 30)}
                style={{
                  padding: "11px 14px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "14px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#047857",
                  cursor: "pointer",
                  textAlign: "center",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                }}
              >
                Tampilkan Lebih Banyak (
                {(filteredTrx.length - visibleLimit).toLocaleString("id-ID")} lagi)
              </button>
            )}
          </>
        )}
      </div>

      {/* 4. MODAL KUITANSI DIGITAL */}
      <ModalKuitansi
        isOpen={kuitansiModal.isOpen}
        data={kuitansiModal.data}
        onClose={() => setKuitansiModal({ isOpen: false, data: null })}
        formatRp={formatRp}
      />
    </div>
  );
}
