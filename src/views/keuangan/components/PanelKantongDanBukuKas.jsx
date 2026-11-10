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
  Trash2,
  X,
  CheckSquare,
  Square,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Edit3,
  ArrowLeft,
  Calendar,
  User,
  Save,
  Sparkles,
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

const formatAngkaTitik = (val) => {
  const num = Math.round(Math.abs(Number(val) || 0));
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatRp = (val) => {
  const n = Number(val) || 0;
  return `${n < 0 ? "- " : ""}Rp ${formatAngkaTitik(n)}`;
};

const formatNumberInput = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return "";
  const normalized = String(parseInt(clean, 10));
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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

  // Tab Aktif: 'tunai' | 'bank' | 'midtrans'
  const [activeTab, setActiveTab] = useState("tunai");

  // Modal Form Buku Kas (Add & Edit)
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: "add",
    editId: null,
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

  const openFormModal = (jenis, defaultSumber = "Kas Tunai") => {
    setFormModal({
      isOpen: true,
      mode: "add",
      editId: null,
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
        jenis === "Tarik Tunai dari Bank" ? "Rekening Bank" : defaultSumber,
      kantong_tujuan:
        jenis === "Tarik Tunai dari Bank" || jenis === "Pemasukan Lain"
          ? "Kas Tunai"
          : "Rekening Bank",
      nominal: "",
      biaya_admin: "",
      keterangan:
        jenis === "Setor Tunai ke Bank"
          ? "Setor kas tunai ke Rekening Bank Pesantren"
          : jenis === "Tarik Tunai dari Bank"
            ? "Tarik tunai dari Rekening Bank ke Kas Tunai"
            : "",
      tanggal: new Date().toISOString().slice(0, 10),
      penanggung_jawab: "Bendahara",
    });
  };

  const openEditFormModal = (item) => {
    const tglStr = item.tanggal
      ? new Date(item.tanggal).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    setFormModal({
      isOpen: true,
      mode: "edit",
      editId: item.id,
      jenis_transaksi: item.jenis_transaksi || "Pengeluaran",
      kategori: item.kategori || KATEGORI_PENGELUARAN[0],
      kantong_sumber: item.kantong_sumber || "Kas Tunai",
      kantong_tujuan: item.kantong_tujuan || "Rekening Bank",
      nominal: String(Math.round(Number(item.nominal) || 0)),
      biaya_admin: item.biaya_admin ? String(Math.round(Number(item.biaya_admin) || 0)) : "",
      keterangan: item.keterangan || "",
      tanggal: tglStr,
      penanggung_jawab: item.penanggung_jawab || "Bendahara",
    });
  };

  const openCairMidtransModal = () => {
    const allIds = unsettledMidtrans.map((u) => u.id);
    setCairModal({
      isOpen: true,
      selectedIds: allIds,
      biaya_admin: "",
      keterangan: `Pencairan ${allIds.length} transaksi Midtrans ke Rekening Bank`,
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
        keterangan: `Pencairan ${nextIds.length} transaksi Midtrans ke Rekening Bank`,
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
      keterangan: `Pencairan ${nextIds.length} transaksi Midtrans ke Rekening Bank`,
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
      toastError("Masukkan nominal lebih dari Rp 0");
      return;
    }
    if (!String(formModal.keterangan || "").trim()) {
      toastError("Keterangan wajib diisi");
      return;
    }

    try {
      setSubmittingForm(true);
      const payload = {
        jenis_transaksi: formModal.jenis_transaksi,
        kategori: formModal.kategori,
        kantong_sumber: formModal.kantong_sumber,
        kantong_tujuan: formModal.kantong_tujuan,
        nominal: nominalVal,
        biaya_admin: biayaAdminVal,
        keterangan: formModal.keterangan,
        tanggal: formModal.tanggal,
        penanggung_jawab: formModal.penanggung_jawab,
      };

      const res =
        formModal.mode === "edit" && formModal.editId
          ? await axios.put(`/api/keuangan/admin/buku-kas/${formModal.editId}`, payload)
          : await axios.post("/api/keuangan/admin/buku-kas", payload);

      if (res.data?.success) {
        toastSuccess(
          res.data.message ||
            (formModal.mode === "edit" ? "Catatan diperbarui" : "Catatan Buku Kas tersimpan"),
        );
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
      toastError("Pilih minimal 1 transaksi Midtrans");
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
        toastSuccess(res.data.message || "Saldo Midtrans dicairkan ke Bank");
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
      "Hapus Catatan?",
      item.jenis_transaksi === "Pencairan Midtrans ke Bank"
        ? `Hapus pencairan ini? Transaksi (${formatRp(item.nominal)}) akan dikembalikan ke Mengendap di Midtrans.`
        : `Hapus "${item.keterangan}" (${formatRp(item.nominal)})?`,
      "Ya, Hapus",
    );
    if (!confirmed) return;

    try {
      const res = await axios.delete(`/api/keuangan/admin/buku-kas/${item.id}`);
      if (res.data?.success) {
        toastSuccess("Catatan dihapus");
        await fetchKantongAndBukuKas();
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menghapus catatan");
    }
  };

  // Filter mutasi sesuai kantong aktif
  const displayedMutasi = useMemo(() => {
    return (bukuKas || []).filter((item) => {
      if (activeTab === "tunai") {
        return (
          item.kantong_sumber === "Kas Tunai" ||
          item.kantong_tujuan === "Kas Tunai"
        );
      }
      if (activeTab === "bank") {
        return (
          item.kantong_sumber === "Rekening Bank" ||
          item.kantong_tujuan === "Rekening Bank"
        );
      }
      if (activeTab === "midtrans") {
        return (
          item.kantong_sumber === "Midtrans" ||
          item.jenis_transaksi === "Pencairan Midtrans ke Bank"
        );
      }
      return false;
    });
  }, [bukuKas, activeTab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 1. HERO CARD: SALDO SIAP PAKAI (MODERN & SIMPLE) */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #065f46 0%, #047857 55%, #0d9488 100%)",
          borderRadius: "22px",
          padding: "18px",
          color: "#ffffff",
          boxShadow: "0 12px 26px -8px rgba(4, 120, 87, 0.38)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-25px",
            top: "-25px",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.1)",
            pointerEvents: "none",
          }}
        />

        <div style={{ fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 700 }}>
          Saldo Aktif Siap Pakai (Tunai + Bank)
        </div>
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            letterSpacing: "-0.6px",
            marginTop: "2px",
          }}
        >
          {formatRp(kantong.saldo_siap_pakai)}
        </div>

        {/* 2 Mini Summary Pills: Total Masuk vs Total Keluar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingUp size={15} color="#a7f3d0" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.6rem", color: "#d1fae5" }}>Total Masuk</div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatRp(
                  Number(kantong.total_tagihan_pokok_sah || 0) +
                    Number(kantong.total_pemasukan_lain || 0),
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.14)",
              borderRadius: "12px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(254, 202, 202, 0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <TrendingDown size={15} color="#fecaca" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.6rem", color: "#fecaca" }}>Pengeluaran</div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatRp(kantong.total_pengeluaran)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SELECT OPTION PILIH KANTONG / BUKU KAS */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "11px 14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#334155",
            whiteSpace: "nowrap",
          }}
        >
          Kantong Kas
        </label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          style={{
            flex: 1,
            maxWidth: "220px",
            padding: "8px 12px",
            borderRadius: "11px",
            border: "1.5px solid #059669",
            background: "#ecfdf5",
            color: "#065f46",
            fontSize: "0.78rem",
            fontWeight: 800,
            cursor: "pointer",
            outline: "none",
            textAlign: "left",
            textAlignLast: "left",
          }}
        >
          <option value="tunai" style={{ textAlign: "left" }}>
            Kas Tunai
          </option>
          <option value="bank" style={{ textAlign: "left" }}>
            Rek. Bank
          </option>
          <option value="midtrans" style={{ textAlign: "left" }}>
            Midtrans
          </option>
        </select>
      </div>

      {/* 3. KARTU RINGKAS SESUAI PILIHAN SELECT */}
      {activeTab === "tunai" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "15px 16px",
            border: "1px solid #d1fae5",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Wallet size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#0f172a" }}>
                  Kas Tunai
                </div>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b" }}>
                  Uang Tunai di Bendahara
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b" }}>Saldo Tunai</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#059669", marginTop: "1px" }}>
                {formatRp(kantong.saldo_kas_tunai)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Masuk Cash</span>
              <span style={{ fontWeight: 800, color: "#059669", textAlign: "right" }}>
                + {formatRp(Number(kantong.masuk_tagihan_tunai || 0) + Number(kantong.pemasukan_lain_tunai || 0))}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Setor ke Bank</span>
              <span style={{ fontWeight: 800, color: "#0284c7", textAlign: "right" }}>
                - {formatRp(kantong.setor_tunai_ke_bank)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Keluar Tunai</span>
              <span style={{ fontWeight: 800, color: "#dc2626", textAlign: "right" }}>
                - {formatRp(kantong.pengeluaran_tunai)}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bank" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "15px 16px",
            border: "1px solid #bae6fd",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  background: "#f0f9ff",
                  color: "#0284c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#0f172a" }}>
                  Rekening Bank
                </div>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b" }}>
                  Rekening Resmi Pesantren
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b" }}>Saldo Bank</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0284c7", marginTop: "1px" }}>
                {formatRp(kantong.saldo_rekening_bank)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Transfer &amp; Pencairan Midtrans</span>
              <span style={{ fontWeight: 800, color: "#0284c7", textAlign: "right" }}>
                + {formatRp(Number(kantong.masuk_tagihan_transfer || 0) + Number(kantong.total_midtrans_sudah_cair || 0))}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Setoran dari Kas Tunai</span>
              <span style={{ fontWeight: 800, color: "#059669", textAlign: "right" }}>
                + {formatRp(kantong.setor_tunai_ke_bank)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Pengeluaran via Bank</span>
              <span style={{ fontWeight: 800, color: "#dc2626", textAlign: "right" }}>
                - {formatRp(kantong.pengeluaran_bank)}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "midtrans" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "15px 16px",
            border: "1px solid #ddd6fe",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <QrCode size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 900, color: "#0f172a" }}>
                  Saldo Midtrans
                </div>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b" }}>
                  QRIS &amp; Virtual Account
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "#64748b" }}>Mengendap</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#6d28d9", marginTop: "1px" }}>
                {formatRp(kantong.saldo_mengendap_midtrans)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Menunggu Pencairan</span>
              <span style={{ fontWeight: 800, color: "#6d28d9", textAlign: "right" }}>
                {kantong.jumlah_trx_mengendap_midtrans} Transaksi
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Sudah Cair ke Bank</span>
              <span style={{ fontWeight: 800, color: "#059669", textAlign: "right" }}>
                {formatRp(kantong.total_midtrans_sudah_cair)}
              </span>
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
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {unsettledMidtrans.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #ede9fe",
                    borderRadius: "9px",
                    padding: "7px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.7rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "#0f172a" }}>{u.nama_santri}</div>
                    <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                      {u.nomor_transaksi} • {formatDateId(u.tanggal_bayar)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: "#6d28d9" }}>
                    {formatRp(u.nominal_pokok || u.total_bayar)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. RIWAYAT MUTASI KAS (CLEAN LIST) */}
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
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#0f172a" }}>
            {activeTab === "tunai"
              ? "Riwayat Mutasi Kas Tunai"
              : activeTab === "bank"
                ? "Riwayat Mutasi Rekening Bank"
                : "Riwayat Pencairan Midtrans"}
          </div>
        </div>

        {loading && bukuKas.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", fontSize: "0.75rem", color: "#64748b" }}>
            Memuat data buku kas...
          </div>
        ) : displayedMutasi.length === 0 ? (
          <div
            style={{
              padding: "24px 14px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "12px",
              color: "#64748b",
              fontSize: "0.74rem",
            }}
          >
            Belum ada catatan mutasi pada kantong ini.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayedMutasi.map((item) => {
              const isOut = item.jenis_transaksi === "Pengeluaran";
              const isIn = item.jenis_transaksi === "Pemasukan Lain";
              const isCair = item.jenis_transaksi === "Pencairan Midtrans ke Bank";

              const color = isOut
                ? "#dc2626"
                : isIn
                  ? "#059669"
                  : isCair
                    ? "#7c3aed"
                    : "#0284c7";
              const bg = isOut
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "13px",
                    border: "1px solid #f1f5f9",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "10px",
                        background: bg,
                        color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isOut ? (
                        <ArrowDownRight size={17} />
                      ) : isIn ? (
                        <ArrowUpRight size={17} />
                      ) : (
                        <ArrowRightLeft size={15} />
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.keterangan}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "#64748b",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ color, fontWeight: 800 }}>{item.jenis_transaksi}</span>
                        <span>•</span>
                        <span>{formatDateId(item.tanggal)}</span>
                        {item.kantong_sumber && (
                          <>
                            <span>•</span>
                            <span>{item.kantong_sumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 900, color }}>
                        {isOut ? "-" : isIn ? "+" : ""}
                        {formatRp(item.nominal)}
                      </div>
                      {item.biaya_admin > 0 && (
                        <div style={{ fontSize: "0.58rem", color: "#dc2626" }}>
                          Admin: {formatRp(item.biaya_admin)}
                        </div>
                      )}
                    </div>

                    {!readOnly && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <button
                          type="button"
                          onClick={() => openEditFormModal(item)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e0f2fe",
                            color: "#0284c7",
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Edit Catatan"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBukuKas(item)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #fee2e2",
                            color: "#dc2626",
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: FULL SCREEN FORM INPUT & EDIT BUKU KAS */}
      {formModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#f8fafc",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
          }}
        >
          {/* Sticky Full-Screen Header */}
          <div
            style={{
              padding: "14px 16px",
              background:
                formModal.jenis_transaksi === "Pengeluaran"
                  ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
                  : formModal.jenis_transaksi === "Pemasukan Lain"
                    ? "linear-gradient(135deg, #065f46 0%, #059669 100%)"
                    : "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(15, 23, 42, 0.14)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setFormModal((p) => ({ ...p, isOpen: false }))}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "#ffffff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ fontSize: "0.65rem", opacity: 0.9, fontWeight: 700 }}>
                  {formModal.mode === "edit" ? "EDIT CATATAN BUKU KAS" : "INPUT TRANSAKSI BARU"}
                </div>
                <div style={{ fontWeight: 900, fontSize: "0.98rem", lineHeight: 1.2 }}>
                  {formModal.jenis_transaksi}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormModal((p) => ({ ...p, isOpen: false }))}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "none",
                color: "#ffffff",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form
            onSubmit={handleSubmitFormBukuKas}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              maxWidth: "640px",
              width: "100%",
              margin: "0 auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* 1. PILIH JENIS TRANSAKSI (4 TAB CARDS) */}
            {formModal.jenis_transaksi !== "Pencairan Midtrans ke Bank" && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#64748b",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Jenis Transaksi Buku Kas
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "7px",
                  }}
                >
                  {[
                    {
                      id: "Pengeluaran",
                      label: "Pengeluaran Kas",
                      Icon: TrendingDown,
                      color: "#dc2626",
                      bg: "#fef2f2",
                      border: "#fca5a5",
                    },
                    {
                      id: "Pemasukan Lain",
                      label: "Pemasukan Lain",
                      Icon: TrendingUp,
                      color: "#059669",
                      bg: "#ecfdf5",
                      border: "#6ee7b7",
                    },
                    {
                      id: "Setor Tunai ke Bank",
                      label: "Setor Tunai ke Bank",
                      Icon: ArrowRightLeft,
                      color: "#0284c7",
                      bg: "#f0f9ff",
                      border: "#7dd3fc",
                    },
                    {
                      id: "Tarik Tunai dari Bank",
                      label: "Tarik Tunai Bank",
                      Icon: Building2,
                      color: "#0369a1",
                      bg: "#f0f9ff",
                      border: "#7dd3fc",
                    },
                  ].map((j) => {
                    const active = formModal.jenis_transaksi === j.id;
                    const Icon = j.Icon;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() =>
                          setFormModal((p) => ({
                            ...p,
                            jenis_transaksi: j.id,
                            kategori:
                              j.id === "Pengeluaran"
                                ? KATEGORI_PENGELUARAN[0]
                                : j.id === "Pemasukan Lain"
                                  ? KATEGORI_PEMASUKAN_LAIN[0]
                                  : j.id === "Setor Tunai ke Bank"
                                    ? "Setoran Bank"
                                    : "Tarik Tunai Bank",
                            kantong_sumber:
                              j.id === "Tarik Tunai dari Bank"
                                ? "Rekening Bank"
                                : p.kantong_sumber || "Kas Tunai",
                            kantong_tujuan:
                              j.id === "Tarik Tunai dari Bank" || j.id === "Pemasukan Lain"
                                ? "Kas Tunai"
                                : "Rekening Bank",
                          }))
                        }
                        style={{
                          padding: "10px 11px",
                          borderRadius: "12px",
                          border: active ? `2px solid ${j.color}` : "1px solid #e2e8f0",
                          background: active ? j.bg : "#f8fafc",
                          color: active ? j.color : "#475569",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Icon size={16} />
                        <span style={{ fontSize: "0.74rem", fontWeight: 800 }}>{j.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tombol ke Pencairan Midtrans dari dalam Modal Satu Pintu */}
                {formModal.mode === "add" && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormModal((p) => ({ ...p, isOpen: false }));
                      openCairMidtransModal();
                    }}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: "1.5px solid #c4b5fd",
                      background: "#f5f3ff",
                      color: "#6d28d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <QrCode size={16} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>
                        Cairkan Saldo Midtrans ke Bank
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 900,
                        background: "#7c3aed",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: "999px",
                      }}
                    >
                      {unsettledMidtrans.length} Trx
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* 2. HERO CARD INPUT NOMINAL + QUICK CHIPS */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "18px",
                padding: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
              }}
            >
              <label
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#64748b",
                  display: "block",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Nominal Transaksi (Rp) *
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  background: "#f8fafc",
                  border: "2px solid #cbd5e1",
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 900,
                    flexShrink: 0,
                    color:
                      formModal.jenis_transaksi === "Pengeluaran"
                        ? "#dc2626"
                        : formModal.jenis_transaksi === "Pemasukan Lain"
                          ? "#059669"
                          : "#0284c7",
                  }}
                >
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumberInput(formModal.nominal)}
                  onChange={(e) =>
                    setFormModal((p) => ({
                      ...p,
                      nominal: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    color: "#0f172a",
                    textAlign: "right",
                    letterSpacing: "0.02em",
                  }}
                />
                {formModal.nominal && (
                  <button
                    type="button"
                    onClick={() => setFormModal((p) => ({ ...p, nominal: "" }))}
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#475569",
                      flexShrink: 0,
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Quick Nominal Add Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                {[
                  { label: "+50 Rb", add: 50000 },
                  { label: "+100 Rb", add: 100000 },
                  { label: "+250 Rb", add: 250000 },
                  { label: "+500 Rb", add: 500000 },
                  { label: "+1 Jt", add: 1000000 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      const cur = parseNumberInput(formModal.nominal);
                      setFormModal((p) => ({ ...p, nominal: String(cur + chip.add) }));
                    }}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      borderRadius: "999px",
                      padding: "5px 11px",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "#334155",
                      cursor: "pointer",
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. PILIH KANTONG SALDO (DENGAN INFO SALDO AKTUAL) */}
            {(formModal.jenis_transaksi === "Pengeluaran" ||
              formModal.jenis_transaksi === "Pemasukan Lain") && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#64748b",
                    display: "block",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {formModal.jenis_transaksi === "Pengeluaran"
                    ? "Diambil dari Kantong Mana?"
                    : "Masuk ke Kantong Mana?"}
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    {
                      id: "Kas Tunai",
                      label: "Kas Tunai",
                      sub: formatRp(kantong.saldo_kas_tunai),
                      Icon: Wallet,
                      color: "#059669",
                      bg: "#ecfdf5",
                    },
                    {
                      id: "Rekening Bank",
                      label: "Rekening Bank",
                      sub: formatRp(kantong.saldo_rekening_bank),
                      Icon: Building2,
                      color: "#0284c7",
                      bg: "#f0f9ff",
                    },
                  ].map((k) => {
                    const selected =
                      formModal.jenis_transaksi === "Pengeluaran"
                        ? formModal.kantong_sumber === k.id
                        : formModal.kantong_tujuan === k.id;
                    const Icon = k.Icon;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() =>
                          setFormModal((p) =>
                            p.jenis_transaksi === "Pengeluaran"
                              ? { ...p, kantong_sumber: k.id }
                              : { ...p, kantong_tujuan: k.id },
                          )
                        }
                        style={{
                          padding: "12px",
                          borderRadius: "14px",
                          border: selected ? `2px solid ${k.color}` : "1px solid #e2e8f0",
                          background: selected ? k.bg : "#f8fafc",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.78rem",
                              fontWeight: 900,
                              color: selected ? k.color : "#334155",
                            }}
                          >
                            {k.label}
                          </span>
                          <Icon size={16} color={selected ? k.color : "#94a3b8"} />
                        </div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>
                          Saldo: {k.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. KATEGORI (INTERACTIVE CHIPS) */}
            {(formModal.jenis_transaksi === "Pengeluaran" ||
              formModal.jenis_transaksi === "Pemasukan Lain") && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#64748b",
                    display: "block",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  Pilih Kategori
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {(formModal.jenis_transaksi === "Pengeluaran"
                    ? KATEGORI_PENGELUARAN
                    : KATEGORI_PEMASUKAN_LAIN
                  ).map((kat) => {
                    const active = formModal.kategori === kat;
                    const activeColor =
                      formModal.jenis_transaksi === "Pengeluaran" ? "#dc2626" : "#059669";
                    const activeBg =
                      formModal.jenis_transaksi === "Pengeluaran" ? "#fef2f2" : "#ecfdf5";
                    return (
                      <button
                        key={kat}
                        type="button"
                        onClick={() => setFormModal((p) => ({ ...p, kategori: kat }))}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: active ? `1.5px solid ${activeColor}` : "1px solid #e2e8f0",
                          background: active ? activeBg : "#f8fafc",
                          color: active ? activeColor : "#475569",
                          fontSize: "0.73rem",
                          fontWeight: active ? 800 : 700,
                          cursor: "pointer",
                        }}
                      >
                        {kat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. RINCIAN KETERANGAN, TANGGAL & PENANGGUNG JAWAB */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "14px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#334155",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Uraian / Keterangan Transaksi *
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Beli beras dapur 5 karung / Setor uang tunai SPP ke Bank"
                  value={formModal.keterangan}
                  onChange={(e) => setFormModal((p) => ({ ...p, keterangan: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.82rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    background: "#f8fafc",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "6px",
                    }}
                  >
                    <Calendar size={13} />
                    <span>Tanggal</span>
                  </label>
                  <input
                    type="date"
                    value={formModal.tanggal}
                    onChange={(e) => setFormModal((p) => ({ ...p, tanggal: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "11px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      background: "#f8fafc",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginBottom: "6px",
                    }}
                  >
                    <User size={13} />
                    <span>Petugas / PJ</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bendahara"
                    value={formModal.penanggung_jawab}
                    onChange={(e) =>
                      setFormModal((p) => ({ ...p, penanggung_jawab: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "11px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      background: "#f8fafc",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Bottom Submit Bar */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                paddingTop: "6px",
                paddingBottom: "20px",
              }}
            >
              <button
                type="button"
                onClick={() => setFormModal((p) => ({ ...p, isOpen: false }))}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "13px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingForm}
                style={{
                  flex: 2,
                  padding: "13px",
                  borderRadius: "13px",
                  border: "none",
                  background:
                    formModal.jenis_transaksi === "Pengeluaran"
                      ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
                      : formModal.jenis_transaksi === "Pemasukan Lain"
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.18)",
                }}
              >
                <Save size={16} />
                <span>
                  {submittingForm
                    ? "Menyimpan..."
                    : formModal.mode === "edit"
                      ? "Simpan Perubahan"
                      : "Simpan ke Buku Kas"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: FULL SCREEN PENCAIRAN SALDO MIDTRANS KE BANK */}
      {cairModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#f8fafc",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100dvh",
            overflow: "hidden",
          }}
        >
          {/* Sticky Full-Screen Header */}
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 16px rgba(109, 40, 217, 0.25)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setCairModal((p) => ({ ...p, isOpen: false }));
                  openFormModal("Pengeluaran", "Kas Tunai");
                }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ fontSize: "0.65rem", opacity: 0.9, fontWeight: 700 }}>
                  SETTLEMENT / PAYOUT MIDTRANS
                </div>
                <div style={{ fontWeight: 900, fontSize: "0.98rem" }}>
                  Cairkan Saldo Midtrans ke Bank
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCairModal((p) => ({ ...p, isOpen: false }))}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                color: "#fff",
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={17} />
            </button>
          </div>

          <form
            onSubmit={handleSubmitCairMidtrans}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              maxWidth: "640px",
              width: "100%",
              margin: "0 auto",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Ringkasan Total Cair */}
            <div
              style={{
                background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
                borderRadius: "18px",
                padding: "16px",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.7rem", color: "#ddd6fe", fontWeight: 700 }}>
                  Total Masuk ke Rekening Bank ({cairModal.selectedIds.length} Trx)
                </div>
                <div style={{ fontSize: "1.55rem", fontWeight: 900, marginTop: "2px" }}>
                  {formatRp(
                    Math.max(0, selectedMidtransTotal - parseNumberInput(cairModal.biaya_admin)),
                  )}
                </div>
              </div>
              <QrCode size={32} color="#ddd6fe" />
            </div>

            {/* Daftar Transaksi Midtrans */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "14px",
                border: "1px solid #e2e8f0",
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
                <span style={{ fontSize: "0.76rem", fontWeight: 900, color: "#0f172a" }}>
                  Pilih Transaksi ({cairModal.selectedIds.length}/{unsettledMidtrans.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleAllMidtrans}
                  style={{
                    border: "none",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {cairModal.selectedIds.length === unsettledMidtrans.length
                    ? "Batal Pilih Semua"
                    : "Pilih Semua"}
                </button>
              </div>

              <div
                style={{
                  maxHeight: "280px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {unsettledMidtrans.map((u) => {
                  const checked = cairModal.selectedIds.includes(u.id);
                  const pokok = Number(u.nominal_pokok || u.total_bayar || 0);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleSelectMidtrans(u.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "12px",
                        background: checked ? "#f5f3ff" : "#f8fafc",
                        border: checked ? "1.5px solid #8b5cf6" : "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {checked ? (
                          <CheckSquare size={17} color="#7c3aed" />
                        ) : (
                          <Square size={17} color="#94a3b8" />
                        )}
                        <div>
                          <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                            {u.nama_santri}
                          </div>
                          <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
                            {u.nomor_transaksi} • {formatDateId(u.tanggal_bayar)}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#6d28d9" }}>
                        {formatRp(pokok)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "14px",
                border: "1px solid #e2e8f0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#334155",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Potongan Admin Cair (Opsional)
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    background: "#f8fafc",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatNumberInput(cairModal.biaya_admin)}
                    onChange={(e) =>
                      setCairModal((p) => ({
                        ...p,
                        biaya_admin: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontSize: "0.84rem",
                      fontWeight: 900,
                      color: "#0f172a",
                      textAlign: "right",
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#334155",
                    display: "block",
                    marginBottom: "5px",
                  }}
                >
                  Tanggal Cair ke Bank
                </label>
                <input
                  type="date"
                  value={cairModal.tanggal}
                  onChange={(e) => setCairModal((p) => ({ ...p, tanggal: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    background: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", paddingBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setCairModal((p) => ({ ...p, isOpen: false }))}
                style={{
                  flex: 1,
                  padding: "13px",
                  borderRadius: "13px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submittingCair || cairModal.selectedIds.length === 0}
                style={{
                  flex: 2,
                  padding: "13px",
                  borderRadius: "13px",
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(109, 40, 217, 0.28)",
                }}
              >
                {submittingCair ? "Memproses..." : "Konfirmasi Cair ke Bank"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (+) SATU PINTU UNTUK SEMUA INPUT BUKU KAS */}
      {!readOnly && (
        <button
          type="button"
          onClick={() =>
            openFormModal(
              "Pengeluaran",
              activeTab === "bank" ? "Rekening Bank" : "Kas Tunai",
            )
          }
          title="Tambah Transaksi Buku Kas"
          style={{
            position: "fixed",
            right: "20px",
            bottom: "86px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            color: "#ffffff",
            border: "2px solid rgba(255, 255, 255, 0.35)",
            boxShadow: "0 10px 25px rgba(5, 150, 105, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 90,
          }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
