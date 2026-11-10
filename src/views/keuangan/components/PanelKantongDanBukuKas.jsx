import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Wallet,
  Building2,
  QrCode,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  RotateCw,
  X,
  CheckSquare,
  Square,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toastSuccess, toastError, showConfirm } from "../../../utils/alert.util";

const KATEGORI_PENGELUARAN = [
  "Konsumsi & Dapur Pesantren",
  "Listrik, Air & Internet",
  "Honor / Bisyoroh Pengajar & Staf",
  "ATK & Perlengkapan Pendidikan",
  "Pemeliharaan & Kebersihan Asrama",
  "Kesehatan Santri (Poskestren)",
  "Kegiatan & Acara Santri",
  "Operasional Lainnya",
];

const KATEGORI_PEMASUKAN_LAIN = [
  "Donasi / Hibah Operasional",
  "Unit Usaha / Koperasi Pesantren",
  "Pemasukan Administrasi Lainnya",
];

const formatRp = (val) => `Rp ${Math.round(Number(val) || 0).toLocaleString("id-ID")}`;

const formatNumberInput = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  return parseInt(clean, 10).toLocaleString("id-ID");
};

const parseNumberInput = (str) => {
  if (!str) return 0;
  const clean = String(str).replace(/\D/g, "");
  return clean ? parseInt(clean, 10) : 0;
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

export default function PanelKantongDanBukuKas({
  readOnly = false,
  onDataChanged,
  compact = false,
}) {
  const [loading, setLoading] = useState(true);
  const [kantong, setKantong] = useState({
    saldo_kas_tunai: 0,
    saldo_rekening_bank: 0,
    saldo_mengendap_midtrans: 0,
    jumlah_trx_mengendap_midtrans: 0,
    saldo_siap_pakai: 0,
    masuk_tagihan_tunai: 0,
    masuk_tagihan_transfer: 0,
    total_midtrans_sudah_cair: 0,
    total_tagihan_pokok_sah: 0,
    total_fee_midtrans: 0,
    pemasukan_lain_tunai: 0,
    pemasukan_lain_bank: 0,
    total_pemasukan_lain: 0,
    pengeluaran_tunai: 0,
    pengeluaran_bank: 0,
    total_pengeluaran: 0,
    setor_tunai_ke_bank: 0,
    tarik_tunai_dari_bank: 0,
  });
  const [unsettledMidtrans, setUnsettledMidtrans] = useState([]);
  const [bukuKas, setBukuKas] = useState([]);

  // Tab Aktif Kantong: 'tunai' | 'bank' | 'midtrans' | 'buku_kas'
  const [activeKantongTab, setActiveKantongTab] = useState("tunai");

  // Filter Buku Kas
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterKantong, setFilterKantong] = useState("Kas Tunai");

  const handleSelectKantongTab = (tab) => {
    setActiveKantongTab(tab);
    if (tab === "tunai") {
      setFilterKantong("Kas Tunai");
      setFilterJenis("semua");
    } else if (tab === "bank") {
      setFilterKantong("Rekening Bank");
      setFilterJenis("semua");
    } else if (tab === "midtrans") {
      setFilterKantong("Midtrans");
      setFilterJenis("semua");
    } else {
      setFilterKantong("semua");
      setFilterJenis("semua");
    }
  };

  // Modal Form Buku Kas (Pengeluaran, Pemasukan Lain, Setor Tunai, Tarik Tunai)
  const [formModal, setFormModal] = useState({
    isOpen: false,
    jenis_transaksi: "Pengeluaran",
    kategori: KATEGORI_PENGELUARAN[0],
    kantong_sumber: "Kas Tunai",
    kantong_tujuan: "Rekening Bank",
    nominal: "",
    biaya_admin: "",
    keterangan: "",
    tanggal: new Date().toISOString().slice(0, 10),
    penanggung_jawab: "Bendahara",
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  // Modal Pencairan Midtrans ke Bank
  const [cairModal, setCairModal] = useState({
    isOpen: false,
    selectedIds: [],
    biaya_admin: "",
    keterangan: "",
    tanggal: new Date().toISOString().slice(0, 10),
  });
  const [submittingCair, setSubmittingCair] = useState(false);

  const fetchKantongAndBukuKas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/keuangan/admin/buku-kas?limit=500");
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.kantong) setKantong(d.kantong);
        setUnsettledMidtrans(d.unsettledMidtrans || []);
        setBukuKas(d.bukuKas || []);
      }
    } catch (err) {
      console.warn("Gagal memuat data kantong & buku kas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKantongAndBukuKas();
  }, [fetchKantongAndBukuKas]);

  const openFormModal = (jenis) => {
    setFormModal({
      isOpen: true,
      jenis_transaksi: jenis,
      kategori:
        jenis === "Pengeluaran"
          ? KATEGORI_PENGELUARAN[0]
          : jenis === "Pemasukan Lain"
            ? KATEGORI_PEMASUKAN_LAIN[0]
            : jenis === "Setor Tunai ke Bank"
              ? "Setoran Bank"
              : "Tarik Tunai Bank",
      kantong_sumber:
        jenis === "Tarik Tunai dari Bank" ? "Rekening Bank" : "Kas Tunai",
      kantong_tujuan:
        jenis === "Tarik Tunai dari Bank" || jenis === "Pemasukan Lain"
          ? "Kas Tunai"
          : "Rekening Bank",
      nominal: "",
      biaya_admin: "",
      keterangan:
        jenis === "Setor Tunai ke Bank"
          ? "Setor uang kas tunai bendahara ke Rekening Bank Pesantren"
          : jenis === "Tarik Tunai dari Bank"
            ? "Tarik tunai dari Rekening Bank ke Kas Tunai bendahara"
            : "",
      tanggal: new Date().toISOString().slice(0, 10),
      penanggung_jawab: "Bendahara",
    });
  };

  const openCairMidtransModal = () => {
    const allIds = unsettledMidtrans.map((u) => u.id);
    setCairModal({
      isOpen: true,
      selectedIds: allIds,
      biaya_admin: "",
      keterangan: `Pencairan (Settlement) ${allIds.length} transaksi Midtrans ke Rekening Bank Pesantren`,
      tanggal: new Date().toISOString().slice(0, 10),
    });
  };

  const handleToggleSelectMidtrans = (id) => {
    setCairModal((prev) => {
      const exists = prev.selectedIds.includes(id);
      const nextIds = exists
        ? prev.selectedIds.filter((x) => x !== id)
        : [...prev.selectedIds, id];
      return {
        ...prev,
        selectedIds: nextIds,
        keterangan: `Pencairan (Settlement) ${nextIds.length} transaksi Midtrans ke Rekening Bank Pesantren`,
      };
    });
  };

  const handleToggleAllMidtrans = () => {
    const allIds = unsettledMidtrans.map((u) => u.id);
    const isAllSelected =
      allIds.length > 0 && cairModal.selectedIds.length === allIds.length;
    const nextIds = isAllSelected ? [] : allIds;
    setCairModal((prev) => ({
      ...prev,
      selectedIds: nextIds,
      keterangan: `Pencairan (Settlement) ${nextIds.length} transaksi Midtrans ke Rekening Bank Pesantren`,
    }));
  };

  const selectedMidtransTotal = useMemo(() => {
    const idSet = new Set(cairModal.selectedIds);
    return unsettledMidtrans
      .filter((u) => idSet.has(u.id))
      .reduce((sum, u) => sum + Number(u.nominal_pokok || u.total_bayar || 0), 0);
  }, [unsettledMidtrans, cairModal.selectedIds]);

  const handleSubmitFormBukuKas = async (e) => {
    e?.preventDefault();
    const nominalVal = parseNumberInput(formModal.nominal);
    const biayaAdminVal = parseNumberInput(formModal.biaya_admin);

    if (nominalVal <= 0) {
      toastError("Masukkan nominal yang valid (lebih dari Rp 0)");
      return;
    }
    if (!String(formModal.keterangan || "").trim()) {
      toastError("Keterangan / uraian wajib diisi");
      return;
    }

    try {
      setSubmittingForm(true);
      const res = await axios.post("/api/keuangan/admin/buku-kas", {
        jenis_transaksi: formModal.jenis_transaksi,
        kategori: formModal.kategori,
        kantong_sumber: formModal.kantong_sumber,
        kantong_tujuan: formModal.kantong_tujuan,
        nominal: nominalVal,
        biaya_admin: biayaAdminVal,
        keterangan: formModal.keterangan,
        tanggal: formModal.tanggal,
        penanggung_jawab: formModal.penanggung_jawab,
      });

      if (res.data?.success) {
        toastSuccess(res.data.message || "Catatan Buku Kas berhasil disimpan!");
        setFormModal((prev) => ({ ...prev, isOpen: false }));
        await fetchKantongAndBukuKas();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan buku kas");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSubmitCairMidtrans = async (e) => {
    e?.preventDefault();
    if (cairModal.selectedIds.length === 0) {
      toastError("Pilih minimal 1 transaksi Midtrans yang akan dicairkan");
      return;
    }

    try {
      setSubmittingCair(true);
      const res = await axios.post("/api/keuangan/admin/cairkan-midtrans", {
        transaksi_ids: cairModal.selectedIds,
        biaya_admin: parseNumberInput(cairModal.biaya_admin),
        keterangan: cairModal.keterangan,
        tanggal: cairModal.tanggal,
      });

      if (res.data?.success) {
        toastSuccess(res.data.message || "Saldo Midtrans berhasil dicairkan ke Bank!");
        setCairModal((prev) => ({ ...prev, isOpen: false }));
        await fetchKantongAndBukuKas();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal mencairkan saldo Midtrans");
    } finally {
      setSubmittingCair(false);
    }
  };

  const handleDeleteBukuKas = async (item) => {
    const confirmed = await showConfirm(
      "Hapus Catatan Buku Kas?",
      item.jenis_transaksi === "Pencairan Midtrans ke Bank"
        ? `Menghapus catatan ini akan mengembalikan ${item.jumlah_trx_dicairkan || ""} transaksi Midtrans (${formatRp(item.nominal)}) kembali ke status "Mengendap di Midtrans". Lanjutkan?`
        : `Hapus catatan "${item.keterangan}" (${formatRp(item.nominal)})? Saldo kantong terkait akan otomatis disesuaikan kembali.`,
      "Ya, Hapus",
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`/api/keuangan/admin/buku-kas/${item.id}`);
      if (res.data?.success) {
        toastSuccess("Catatan buku kas berhasil dihapus");
        await fetchKantongAndBukuKas();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus catatan");
    }
  };

  const filteredBukuKas = useMemo(() => {
    return (bukuKas || []).filter((item) => {
      if (filterJenis !== "semua" && item.jenis_transaksi !== filterJenis) {
        return false;
      }
      if (
        filterKantong !== "semua" &&
        item.kantong_sumber !== filterKantong &&
        item.kantong_tujuan !== filterKantong
      ) {
        return false;
      }
      return true;
    });
  }, [bukuKas, filterJenis, filterKantong]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 1. BANNER SALDO RIIL SIAP PAKAI VS MENGENDAP MIDTRANS */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "20px",
          padding: compact ? "14px 16px" : "18px 20px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -6px rgba(15, 23, 42, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(16, 185, 129, 0.2)",
                border: "1px solid rgba(52, 211, 153, 0.35)",
                color: "#6ee7b7",
                padding: "3px 9px",
                borderRadius: "999px",
                fontSize: "0.64rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <ShieldCheck size={12} />
              <span>Saldo Riil Siap Pakai (Tunai + Bank)</span>
            </div>
            <div
              style={{
                fontSize: compact ? "1.45rem" : "1.7rem",
                fontWeight: 900,
                color: "#ffffff",
                marginTop: "6px",
                letterSpacing: "-0.5px",
              }}
            >
              {formatRp(kantong.saldo_siap_pakai)}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "#94a3b8",
                marginTop: "3px",
              }}
            >
              Uang nyata di Kas Tunai Bendahara &amp; Rekening Bank (tidak termasuk dana yang masih mengendap di Midtrans)
            </div>
          </div>

          <button
            type="button"
            onClick={fetchKantongAndBukuKas}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "#ffffff",
              borderRadius: "10px",
              padding: "7px 11px",
              fontSize: "0.7rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <RotateCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Strip Ringkasan Total Masuk vs Pengeluaran */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "8px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700 }}>
              TOTAL HAK TAGIHAN LUNAS
            </div>
            <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#34d399", marginTop: "2px" }}>
              {formatRp(kantong.total_tagihan_pokok_sah)}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700 }}>
              PEMASUKAN LAINNYA
            </div>
            <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#60a5fa", marginTop: "2px" }}>
              +{formatRp(kantong.total_pemasukan_lain)}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              borderRadius: "12px",
              padding: "8px 10px",
            }}
          >
            <div style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 700 }}>
              TOTAL PENGELUARAN KAS
            </div>
            <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#f87171", marginTop: "2px" }}>
              -{formatRp(kantong.total_pengeluaran)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER KANTONG SALDO & BUKU KAS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "6px",
          background: "#ffffff",
          padding: "5px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
        }}
      >
        {[
          {
            id: "tunai",
            label: "Kas Tunai",
            sub: formatRp(kantong.saldo_kas_tunai),
            Icon: Wallet,
            activeBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            activeColor: "#ffffff",
            dotColor: "#10b981",
          },
          {
            id: "bank",
            label: "Rek. Bank",
            sub: formatRp(kantong.saldo_rekening_bank),
            Icon: Building2,
            activeBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            activeColor: "#ffffff",
            dotColor: "#0ea5e9",
          },
          {
            id: "midtrans",
            label: "Midtrans",
            sub: formatRp(kantong.saldo_mengendap_midtrans),
            badge: kantong.jumlah_trx_mengendap_midtrans,
            Icon: QrCode,
            activeBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
            activeColor: "#ffffff",
            dotColor: "#8b5cf6",
          },
          {
            id: "buku_kas",
            label: "Buku Kas",
            sub: `${bukuKas.length} Mutasi`,
            Icon: FileText,
            activeBg: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
            activeColor: "#ffffff",
            dotColor: "#475569",
          },
        ].map((tab) => {
          const isActive = activeKantongTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectKantongTab(tab.id)}
              style={{
                border: isActive ? "none" : "1px solid transparent",
                background: isActive ? tab.activeBg : "#f8fafc",
                color: isActive ? tab.activeColor : "#334155",
                borderRadius: "12px",
                padding: "9px 6px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
                position: "relative",
                transition: "all 0.16s ease",
                boxShadow: isActive ? "0 4px 12px rgba(15, 23, 42, 0.16)" : "none",
                minWidth: 0,
              }}
            >
              {tab.badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: isActive ? "#fef3c7" : "#7c3aed",
                    color: isActive ? "#6d28d9" : "#ffffff",
                    fontSize: "0.56rem",
                    fontWeight: 900,
                    padding: "1px 5px",
                    borderRadius: "999px",
                  }}
                >
                  {tab.badge}
                </span>
              )}
              <TabIcon size={16} color={isActive ? "#ffffff" : tab.dotColor} />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {tab.label}
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  opacity: isActive ? 0.92 : 0.75,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. DETAIL KANTONG SESUAI TAB AKTIF */}
      <div>
        {/* KANTONG 1: KAS TUNAI DI TANGAN */}
        {activeKantongTab === "tunai" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px",
            border: "1.5px solid #a7f3d0",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: "#047857",
                  background: "#ecfdf5",
                  padding: "3px 8px",
                  borderRadius: "8px",
                  textTransform: "uppercase",
                }}
              >
                Kantong 1 • Uang Fisik
              </span>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Wallet size={17} />
              </div>
            </div>

            <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginTop: "8px" }}>
              Kas Tunai di Tangan (Bendahara)
            </div>
            <div style={{ fontSize: "1.28rem", fontWeight: 900, color: "#047857", marginTop: "2px" }}>
              {formatRp(kantong.saldo_kas_tunai)}
            </div>

            <div
              style={{
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "0.68rem",
                color: "#64748b",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Bayar Tagihan Cash:</span>
                <strong style={{ color: "#059669" }}>+{formatRp(kantong.masuk_tagihan_tunai)}</strong>
              </div>
              {kantong.pemasukan_lain_tunai > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Pemasukan Lain (Tunai):</span>
                  <strong style={{ color: "#059669" }}>+{formatRp(kantong.pemasukan_lain_tunai)}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Disetor ke Bank:</span>
                <strong style={{ color: "#0284c7" }}>-{formatRp(kantong.setor_tunai_ke_bank)}</strong>
              </div>
              {kantong.tarik_tunai_dari_bank > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tarik Tunai dari Bank:</span>
                  <strong style={{ color: "#059669" }}>+{formatRp(kantong.tarik_tunai_dari_bank)}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pengeluaran Tunai:</span>
                <strong style={{ color: "#dc2626" }}>-{formatRp(kantong.pengeluaran_tunai)}</strong>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => openFormModal("Setor Tunai ke Bank")}
                style={{
                  flex: 1,
                  background: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                  color: "#047857",
                  borderRadius: "10px",
                  padding: "7px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <ArrowRightLeft size={12} />
                <span>Setor ke Bank</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openFormModal("Pengeluaran");
                  setFormModal((p) => ({ ...p, kantong_sumber: "Kas Tunai" }));
                }}
                style={{
                  flex: 1,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "7px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <TrendingDown size={12} />
                <span>Pakai Tunai</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* KANTONG 2: SALDO REKENING BANK PESANTREN */}
        {activeKantongTab === "bank" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px",
            border: "1.5px solid #bae6fd",
            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: "#0369a1",
                  background: "#f0f9ff",
                  padding: "3px 8px",
                  borderRadius: "8px",
                  textTransform: "uppercase",
                }}
              >
                Kantong 2 • Saldo Bank
              </span>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#f0f9ff",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={17} />
              </div>
            </div>

            <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginTop: "8px" }}>
              Rekening Bank Pesantren (Siap Pakai)
            </div>
            <div style={{ fontSize: "1.28rem", fontWeight: 900, color: "#0369a1", marginTop: "2px" }}>
              {formatRp(kantong.saldo_rekening_bank)}
            </div>

            <div
              style={{
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "0.68rem",
                color: "#64748b",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Transfer Manual Sah:</span>
                <strong style={{ color: "#0284c7" }}>+{formatRp(kantong.masuk_tagihan_transfer)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cair dari Midtrans:</span>
                <strong style={{ color: "#7c3aed" }}>+{formatRp(kantong.total_midtrans_sudah_cair)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Setoran Tunai Masuk:</span>
                <strong style={{ color: "#059669" }}>+{formatRp(kantong.setor_tunai_ke_bank)}</strong>
              </div>
              {kantong.tarik_tunai_dari_bank > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ditarik ke Tunai:</span>
                  <strong style={{ color: "#d97706" }}>-{formatRp(kantong.tarik_tunai_dari_bank)}</strong>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pengeluaran via Bank:</span>
                <strong style={{ color: "#dc2626" }}>-{formatRp(kantong.pengeluaran_bank)}</strong>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => openFormModal("Tarik Tunai dari Bank")}
                style={{
                  flex: 1,
                  background: "#f0f9ff",
                  border: "1px solid #7dd3fc",
                  color: "#0369a1",
                  borderRadius: "10px",
                  padding: "7px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <ArrowRightLeft size={12} />
                <span>Tarik Tunai</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  openFormModal("Pengeluaran");
                  setFormModal((p) => ({ ...p, kantong_sumber: "Rekening Bank" }));
                }}
                style={{
                  flex: 1,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "7px 8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                <TrendingDown size={12} />
                <span>Pakai Bank</span>
              </button>
            </div>
          )}
        </div>
        )}

        {/* KANTONG 3: SALDO MENGENDAP MIDTRANS (BELUM CAIR) */}
        {activeKantongTab === "midtrans" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "14px",
            border: "1.5px solid #ddd6fe",
            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  color: "#6d28d9",
                  background: "#f5f3ff",
                  padding: "3px 8px",
                  borderRadius: "8px",
                  textTransform: "uppercase",
                }}
              >
                Kantong 3 • Belum Cair
              </span>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QrCode size={17} />
              </div>
            </div>

            <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginTop: "8px" }}>
              Mengendap di Midtrans (QRIS / VA)
            </div>
            <div style={{ fontSize: "1.28rem", fontWeight: 900, color: "#6d28d9", marginTop: "2px" }}>
              {formatRp(kantong.saldo_mengendap_midtrans)}
            </div>

            <div
              style={{
                marginTop: "10px",
                paddingTop: "8px",
                borderTop: "1px dashed #e2e8f0",
                fontSize: "0.68rem",
                color: "#64748b",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Transaksi Belum Cair:</span>
                <strong style={{ color: "#6d28d9" }}>
                  {kantong.jumlah_trx_mengendap_midtrans} Transaksi
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sudah Dicairkan ke Bank:</span>
                <strong style={{ color: "#059669" }}>
                  {formatRp(kantong.total_midtrans_sudah_cair)}
                </strong>
              </div>
              <div style={{ fontSize: "0.64rem", color: "#7c3aed", marginTop: "2px" }}>
                * Tagihan santri sudah Lunas, namun dana baru masuk ke Saldo Bank setelah dicairkan (Settlement/Payout).
              </div>
            </div>
          </div>

          {unsettledMidtrans.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                background: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "220px",
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#6d28d9" }}>
                Daftar Transaksi Midtrans Menunggu Pencairan ({unsettledMidtrans.length}):
              </div>
              {unsettledMidtrans.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ede9fe",
                    borderRadius: "9px",
                    padding: "7px 9px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.68rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>
                      {u.nama_santri} ({u.nis || "-"})
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                      {u.nomor_transaksi} • {formatDateId(u.tanggal_bayar)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#6d28d9", whiteSpace: "nowrap" }}>
                    {formatRp(u.nominal_pokok || u.total_bayar)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={openCairMidtransModal}
              disabled={unsettledMidtrans.length === 0}
              style={{
                marginTop: "12px",
                width: "100%",
                background:
                  unsettledMidtrans.length > 0
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
                    : "#f1f5f9",
                border: "none",
                color: unsettledMidtrans.length > 0 ? "#ffffff" : "#94a3b8",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: unsettledMidtrans.length > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                boxShadow:
                  unsettledMidtrans.length > 0
                    ? "0 4px 12px rgba(124, 58, 237, 0.25)"
                    : "none",
              }}
            >
              <CheckCircle2 size={14} />
              <span>
                {unsettledMidtrans.length > 0
                  ? `Cairkan ke Bank (${unsettledMidtrans.length} Trx)`
                  : "Semua Saldo Midtrans Sudah Cair"}
              </span>
            </button>
          )}
        </div>
        )}
      </div>

      {/* 3. BAR AKSI BUKU KAS & MUTASI (KHUSUS TAB BUKU KAS) */}
      {!readOnly && activeKantongTab === "buku_kas" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "12px 14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#0f172a" }}>
            Input Buku Kas &amp; Mutasi Saldo:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
            <button
              type="button"
              onClick={() => openFormModal("Pengeluaran")}
              style={{
                background: "#dc2626",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <TrendingDown size={14} />
              <span>+ Catat Pengeluaran</span>
            </button>

            <button
              type="button"
              onClick={() => openFormModal("Pemasukan Lain")}
              style={{
                background: "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Plus size={14} />
              <span>+ Pemasukan Lain</span>
            </button>

            <button
              type="button"
              onClick={() => openFormModal("Setor Tunai ke Bank")}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 12px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ArrowRightLeft size={14} />
              <span>Setor Tunai ke Bank</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. DAFTAR BUKU KAS OPERASIONAL & RIWAYAT SETORAN/PENCAIRAN */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#0f172a" }}>
              Buku Kas Pengeluaran, Setoran &amp; Pencairan Midtrans
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              Log mutasi uang keluar, pemasukan non-tagihan, setor tunai, dan pencairan Midtrans
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                background: "#f8fafc",
              }}
            >
              <option value="semua">Semua Jenis Mutasi</option>
              <option value="Pengeluaran">Pengeluaran Kas</option>
              <option value="Pemasukan Lain">Pemasukan Lain</option>
              <option value="Setor Tunai ke Bank">Setor Tunai ke Bank</option>
              <option value="Tarik Tunai dari Bank">Tarik Tunai dari Bank</option>
              <option value="Pencairan Midtrans ke Bank">Pencairan Midtrans</option>
            </select>

            <select
              value={filterKantong}
              onChange={(e) => setFilterKantong(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                background: "#f8fafc",
              }}
            >
              <option value="semua">Semua Kantong</option>
              <option value="Kas Tunai">Kas Tunai</option>
              <option value="Rekening Bank">Rekening Bank</option>
              <option value="Midtrans">Midtrans</option>
            </select>
          </div>
        </div>

        {filteredBukuKas.length === 0 ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "14px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <FileText size={24} color="#94a3b8" style={{ margin: "0 auto 6px" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#334155" }}>
              Belum Ada Catatan Mutasi / Pengeluaran di Buku Kas
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
              Gunakan tombol di atas saat mencairkan Midtrans, menyetor uang tunai ke bank, atau mencatat pengeluaran.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredBukuKas.map((item) => {
              const isOut = item.jenis_transaksi === "Pengeluaran";
              const isIn = item.jenis_transaksi === "Pemasukan Lain";
              const isCair = item.jenis_transaksi === "Pencairan Midtrans ke Bank";

              const accentColor = isOut
                ? "#dc2626"
                : isIn
                  ? "#059669"
                  : isCair
                    ? "#7c3aed"
                    : "#0284c7";
              const bgBadge = isOut
                ? "#fef2f2"
                : isIn
                  ? "#ecfdf5"
                  : isCair
                    ? "#f5f3ff"
                    : "#f0f9ff";

              return (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${accentColor}`,
                    borderRadius: "14px",
                    padding: "11px 13px",
                    background: "#ffffff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          color: accentColor,
                          background: bgBadge,
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {item.jenis_transaksi}
                      </span>
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 700,
                          color: "#475569",
                          background: "#f1f5f9",
                          padding: "2px 7px",
                          borderRadius: "6px",
                        }}
                      >
                        {item.kategori || "Operasional"}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                        • {formatDateId(item.tanggal)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        marginTop: "5px",
                      }}
                    >
                      {item.keterangan}
                    </div>

                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "#64748b",
                        marginTop: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>Kode: <strong>{item.kode_mutasi}</strong></span>
                      {item.kantong_sumber && item.kantong_tujuan ? (
                        <span>
                          Alur: <strong>{item.kantong_sumber}</strong> → <strong>{item.kantong_tujuan}</strong>
                        </span>
                      ) : item.kantong_sumber ? (
                        <span>
                          Sumber Dana: <strong>{item.kantong_sumber}</strong>
                        </span>
                      ) : item.kantong_tujuan ? (
                        <span>
                          Masuk ke: <strong>{item.kantong_tujuan}</strong>
                        </span>
                      ) : null}
                      {item.biaya_admin > 0 && (
                        <span style={{ color: "#dc2626" }}>
                          Biaya Admin: {formatRp(item.biaya_admin)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 900,
                          color: accentColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "2px",
                        }}
                      >
                        {isOut ? (
                          <ArrowDownRight size={15} />
                        ) : isIn ? (
                          <ArrowUpRight size={15} />
                        ) : (
                          <ArrowRightLeft size={13} />
                        )}
                        <span>
                          {isOut ? "-" : isIn ? "+" : ""}
                          {formatRp(item.nominal)}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>
                        Oleh: {item.penanggung_jawab || "Bendahara"}
                      </div>
                    </div>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBukuKas(item)}
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#dc2626",
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Hapus Catatan"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: INPUT BUKU KAS (PENGELUARAN / PEMASUKAN LAIN / SETOR TUNAI / TARIK TUNAI) */}
      {formModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 900, color: "#0f172a" }}>
                {formModal.jenis_transaksi === "Pengeluaran"
                  ? "Catat Pengeluaran Kas"
                  : formModal.jenis_transaksi === "Pemasukan Lain"
                    ? "Catat Pemasukan Kas Lainnya"
                    : formModal.jenis_transaksi}
              </h3>
              <button
                type="button"
                onClick={() => setFormModal((p) => ({ ...p, isOpen: false }))}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#475569" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitFormBukuKas}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Pilihan Jenis Transaksi */}
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                  Jenis Pencatatan
                </label>
                <select
                  value={formModal.jenis_transaksi}
                  onChange={(e) => openFormModal(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    background: "#f8fafc",
                  }}
                >
                  <option value="Pengeluaran">Pengeluaran Operasional</option>
                  <option value="Pemasukan Lain">Pemasukan Lain (Non-Tagihan)</option>
                  <option value="Setor Tunai ke Bank">Setor Tunai ke Rekening Bank</option>
                  <option value="Tarik Tunai dari Bank">Tarik Tunai dari Bank ke Kas Tunai</option>
                </select>
              </div>

              {/* Pilih Kantong Sumber / Tujuan */}
              {formModal.jenis_transaksi === "Pengeluaran" && (
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Diambil dari Kantong Saldo Mana?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "5px" }}>
                    {["Kas Tunai", "Rekening Bank"].map((k) => {
                      const active = formModal.kantong_sumber === k;
                      const avail =
                        k === "Kas Tunai"
                          ? kantong.saldo_kas_tunai
                          : kantong.saldo_rekening_bank;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFormModal((p) => ({ ...p, kantong_sumber: k }))}
                          style={{
                            padding: "10px",
                            borderRadius: "12px",
                            border: active ? "2px solid #dc2626" : "1px solid #cbd5e1",
                            background: active ? "#fef2f2" : "#f8fafc",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>
                            {k}
                          </div>
                          <div style={{ fontSize: "0.66rem", color: "#64748b", marginTop: "2px" }}>
                            Saldo: {formatRp(avail)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {formModal.jenis_transaksi === "Pemasukan Lain" && (
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Masuk ke Kantong Saldo Mana?
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "5px" }}>
                    {["Kas Tunai", "Rekening Bank"].map((k) => {
                      const active = formModal.kantong_tujuan === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFormModal((p) => ({ ...p, kantong_tujuan: k }))}
                          style={{
                            padding: "10px",
                            borderRadius: "12px",
                            border: active ? "2px solid #059669" : "1px solid #cbd5e1",
                            background: active ? "#ecfdf5" : "#f8fafc",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>
                            {k}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(formModal.jenis_transaksi === "Pengeluaran" ||
                formModal.jenis_transaksi === "Pemasukan Lain") && (
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Kategori
                  </label>
                  <select
                    value={formModal.kategori}
                    onChange={(e) => setFormModal((p) => ({ ...p, kategori: e.target.value }))}
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: "#f8fafc",
                    }}
                  >
                    {(formModal.jenis_transaksi === "Pengeluaran"
                      ? KATEGORI_PENGELUARAN
                      : KATEGORI_PEMASUKAN_LAIN
                    ).map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Nominal (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 500.000"
                    value={formModal.nominal}
                    onChange={(e) =>
                      setFormModal((p) => ({
                        ...p,
                        nominal: formatNumberInput(e.target.value),
                      }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formModal.tanggal}
                    onChange={(e) =>
                      setFormModal((p) => ({ ...p, tanggal: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                  Keterangan / Uraian Lengkap
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pembayaran tagihan listrik asrama putra bulan November..."
                  value={formModal.keterangan}
                  onChange={(e) =>
                    setFormModal((p) => ({ ...p, keterangan: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setFormModal((p) => ({ ...p, isOpen: false }))}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "11px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  style={{
                    flex: 1.5,
                    padding: "11px",
                    borderRadius: "11px",
                    border: "none",
                    background: "#047857",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {submittingForm ? "Menyimpan..." : "Simpan ke Buku Kas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PENCAIRAN SALDO MIDTRANS (SETTLEMENT / PAYOUT KE BANK) */}
      {cairModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 900, color: "#0f172a" }}>
                  Cairkan Saldo Midtrans ke Rekening Bank
                </h3>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                  Pindahkan dana QRIS/VA yang sudah cair (Payout) dari Midtrans ke Saldo Bank Pesantren
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCairModal((p) => ({ ...p, isOpen: false }))}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} color="#475569" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitCairMidtrans}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Checklist Transaksi Mengendap */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleToggleAllMidtrans}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#6d28d9",
                      cursor: "pointer",
                    }}
                  >
                    {cairModal.selectedIds.length === unsettledMidtrans.length ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                    <span>
                      Pilih Semua ({cairModal.selectedIds.length}/{unsettledMidtrans.length} Transaksi)
                    </span>
                  </button>

                  <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#047857" }}>
                    Total Pokok: {formatRp(selectedMidtransTotal)}
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {unsettledMidtrans.map((u) => {
                    const checked = cairModal.selectedIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleSelectMidtrans(u.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          background: checked ? "#f5f3ff" : "#ffffff",
                          border: checked ? "1.5px solid #8b5cf6" : "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {checked ? (
                            <CheckSquare size={15} color="#6d28d9" />
                          ) : (
                            <Square size={15} color="#94a3b8" />
                          )}
                          <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a" }}>
                              {u.nama_santri}
                            </div>
                            <div style={{ fontSize: "0.64rem", color: "#64748b" }}>
                              {u.nomor_transaksi} • {formatDateId(u.tanggal_bayar)}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 900, color: "#6d28d9" }}>
                            {formatRp(u.nominal_pokok)}
                          </div>
                          {u.nominal_fee_gateway > 0 && (
                            <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>
                              +Fee {formatRp(u.nominal_fee_gateway)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Tanggal Cair ke Bank
                  </label>
                  <input
                    type="date"
                    value={cairModal.tanggal}
                    onChange={(e) =>
                      setCairModal((p) => ({ ...p, tanggal: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                    Biaya Admin Payout (Opsional)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={cairModal.biaya_admin}
                    onChange={(e) =>
                      setCairModal((p) => ({
                        ...p,
                        biaya_admin: formatNumberInput(e.target.value),
                      }))
                    }
                    style={{
                      width: "100%",
                      marginTop: "4px",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 800, color: "#334155" }}>
                  Keterangan Pencairan
                </label>
                <input
                  type="text"
                  value={cairModal.keterangan}
                  onChange={(e) =>
                    setCairModal((p) => ({ ...p, keterangan: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setCairModal((p) => ({ ...p, isOpen: false }))}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "11px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCair || cairModal.selectedIds.length === 0}
                  style={{
                    flex: 1.6,
                    padding: "11px",
                    borderRadius: "11px",
                    border: "none",
                    background: "#6d28d9",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  {submittingCair
                    ? "Memproses..."
                    : `Cairkan ${formatRp(selectedMidtransTotal)} ke Bank`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

