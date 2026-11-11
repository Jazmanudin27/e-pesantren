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

const DEFAULT_KATEGORI_PENGELUARAN = [
  "Konsumsi & Dapur Pesantren",
  "Listrik, Air & Internet",
  "Honor / Bisyoroh Pengajar & Staf",
  "ATK & Perlengkapan Pendidikan",
  "Pemeliharaan & Kebersihan Asrama",
  "Kesehatan Santri (Poskestren)",
  "Kegiatan & Acara Santri",
  "Setor Tunai ke Bank",
  "Operasional Lainnya",
];

const DEFAULT_KATEGORI_PEMASUKAN = [
  "Donasi / Hibah Operasional",
  "Unit Usaha / Koperasi Pesantren",
  "Tarik Tunai dari Bank",
  "Pemasukan Administrasi Lainnya",
];

const STORAGE_KEY_KAT_KELUAR = "epesantren_buku_kas_kat_keluar_v1";
const STORAGE_KEY_KAT_MASUK = "epesantren_buku_kas_kat_masuk_v1";

const loadSavedCategories = (key, defaults) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (_e) {
    // ignore storage errors
  }
  return defaults;
};

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

  // Daftar Kategori Dinamis (Bisa Ditambah, Diedit, Dihapus)
  const [kategoriPengeluaranList, setKategoriPengeluaranList] = useState(() =>
    loadSavedCategories(STORAGE_KEY_KAT_KELUAR, DEFAULT_KATEGORI_PENGELUARAN),
  );
  const [kategoriPemasukanList, setKategoriPemasukanList] = useState(() =>
    loadSavedCategories(STORAGE_KEY_KAT_MASUK, DEFAULT_KATEGORI_PEMASUKAN),
  );
  const [kategoriEditor, setKategoriEditor] = useState({
    mode: null, // null | 'add' | 'edit'
    value: "",
    originalValue: "",
  });

  const saveKategoriList = (isPengeluaran, nextList) => {
    if (isPengeluaran) {
      setKategoriPengeluaranList(nextList);
      try {
        localStorage.setItem(STORAGE_KEY_KAT_KELUAR, JSON.stringify(nextList));
      } catch (_e) {
        // ignore
      }
    } else {
      setKategoriPemasukanList(nextList);
      try {
        localStorage.setItem(STORAGE_KEY_KAT_MASUK, JSON.stringify(nextList));
      } catch (_e) {
        // ignore
      }
    }
  };

  // Modal Form Buku Kas (Add & Edit)
  const [formModal, setFormModal] = useState({
    isOpen: false,
    mode: "add",
    editId: null,
    kantong_aktif: "Kas Tunai",
    jenis_transaksi: "Pengeluaran",
    kategori: DEFAULT_KATEGORI_PENGELUARAN[0],
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
      const [res, resKasMasuk] = await Promise.all([
        axios.get("/api/keuangan/admin/buku-kas?limit=500"),
        axios.get("/api/keuangan/admin/kas-masuk-sah?limit=500").catch(() => null),
      ]);
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (d.kantong) setKantong(d.kantong);
        setUnsettledMidtrans(d.unsettledMidtrans || []);

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
              kode_mutasi: r.nomor_kuitansi || r.kuitansi_nomor || r.nomor_transaksi || `TRX-${r.id}`,
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

        const merged = [...baseBukuKas, ...mappedTrx].sort(
          (a, b) =>
            new Date(b.tanggal || 0).getTime() - new Date(a.tanggal || 0).getTime(),
        );
        setBukuKas(merged);
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

  const openFormModal = (jenis = "Pengeluaran", defaultKantong = "Kas Tunai") => {
    const isKeluar = jenis !== "Pemasukan Lain";
    const listKat = isKeluar ? kategoriPengeluaranList : kategoriPemasukanList;
    setKategoriEditor({ mode: null, value: "", originalValue: "" });
    setFormModal({
      isOpen: true,
      mode: "add",
      editId: null,
      kantong_aktif: defaultKantong,
      jenis_transaksi: isKeluar ? "Pengeluaran" : "Pemasukan Lain",
      kategori: listKat[0] || (isKeluar ? "Operasional Lainnya" : "Pemasukan Lainnya"),
      kantong_sumber: defaultKantong,
      kantong_tujuan: defaultKantong,
      nominal: "",
      biaya_admin: "",
      keterangan: "",
      tanggal: new Date().toISOString().slice(0, 10),
      penanggung_jawab: "Bendahara",
    });
  };

  const openEditFormModal = (item) => {
    const tglStr = item.tanggal
      ? new Date(item.tanggal).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const rawJenis = item.jenis_transaksi || "Pengeluaran";
    const isPemasukan = rawJenis === "Pemasukan Lain";
    const kantongAktif = isPemasukan
      ? item.kantong_tujuan || item.kantong_sumber || "Kas Tunai"
      : item.kantong_sumber || "Kas Tunai";
    const katItem =
      item.kategori ||
      (rawJenis === "Setor Tunai ke Bank"
        ? "Setor Tunai ke Bank"
        : rawJenis === "Tarik Tunai dari Bank"
          ? "Tarik Tunai dari Bank"
          : kategoriPengeluaranList[0] || "Operasional Lainnya");

    if (isPemasukan && katItem && !kategoriPemasukanList.includes(katItem)) {
      saveKategoriList(false, [...kategoriPemasukanList, katItem]);
    } else if (!isPemasukan && katItem && !kategoriPengeluaranList.includes(katItem)) {
      saveKategoriList(true, [...kategoriPengeluaranList, katItem]);
    }

    setKategoriEditor({ mode: null, value: "", originalValue: "" });
    setFormModal({
      isOpen: true,
      mode: "edit",
      editId: item.id,
      kantong_aktif: kantongAktif,
      jenis_transaksi: isPemasukan ? "Pemasukan Lain" : "Pengeluaran",
      kategori: katItem,
      kantong_sumber: item.kantong_sumber || kantongAktif,
      kantong_tujuan: item.kantong_tujuan || kantongAktif,
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

  const handleSaveKategoriEditor = () => {
    const trimmed = String(kategoriEditor.value || "").trim();
    if (!trimmed) {
      toastError("Nama kategori tidak boleh kosong");
      return;
    }
    const isPengeluaran = formModal.jenis_transaksi === "Pengeluaran";
    const currentList = isPengeluaran ? kategoriPengeluaranList : kategoriPemasukanList;

    if (kategoriEditor.mode === "add") {
      if (currentList.includes(trimmed)) {
        setFormModal((p) => ({ ...p, kategori: trimmed }));
        setKategoriEditor({ mode: null, value: "", originalValue: "" });
        return;
      }
      const nextList = [...currentList, trimmed];
      saveKategoriList(isPengeluaran, nextList);
      setFormModal((p) => ({ ...p, kategori: trimmed }));
      setKategoriEditor({ mode: null, value: "", originalValue: "" });
      toastSuccess("Kategori ditambahkan");
    } else if (kategoriEditor.mode === "edit") {
      const nextList = currentList.map((k) =>
        k === kategoriEditor.originalValue ? trimmed : k,
      );
      saveKategoriList(isPengeluaran, nextList);
      setFormModal((p) => ({ ...p, kategori: trimmed }));
      setKategoriEditor({ mode: null, value: "", originalValue: "" });
      toastSuccess("Kategori diperbarui");
    }
  };

  const handleDeleteSelectedKategori = () => {
    const isPengeluaran = formModal.jenis_transaksi === "Pengeluaran";
    const currentList = isPengeluaran ? kategoriPengeluaranList : kategoriPemasukanList;
    if (currentList.length <= 1) {
      toastError("Minimal harus ada 1 kategori");
      return;
    }
    const target = formModal.kategori;
    const nextList = currentList.filter((k) => k !== target);
    saveKategoriList(isPengeluaran, nextList);
    setFormModal((p) => ({ ...p, kategori: nextList[0] || "" }));
    setKategoriEditor({ mode: null, value: "", originalValue: "" });
    toastSuccess(`Kategori "${target}" dihapus`);
  };

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

    const katLower = String(formModal.kategori || "").toLowerCase();
    const kantongPilihan = formModal.kantong_aktif || "Kas Tunai";
    let finalJenis = formModal.jenis_transaksi;
    let finalSumber = kantongPilihan;
    let finalTujuan = kantongPilihan;

    if (katLower === "setor tunai ke bank" || katLower === "setoran bank") {
      finalJenis = "Setor Tunai ke Bank";
      finalSumber = "Kas Tunai";
      finalTujuan = "Rekening Bank";
    } else if (katLower === "tarik tunai dari bank" || katLower === "tarik tunai bank") {
      finalJenis = "Tarik Tunai dari Bank";
      finalSumber = "Rekening Bank";
      finalTujuan = "Kas Tunai";
    } else if (formModal.jenis_transaksi === "Pengeluaran") {
      finalJenis = "Pengeluaran";
      finalSumber = kantongPilihan;
      finalTujuan = "Rekening Bank";
    } else {
      finalJenis = "Pemasukan Lain";
      finalSumber = kantongPilihan;
      finalTujuan = kantongPilihan;
    }

    try {
      setSubmittingForm(true);
      const payload = {
        jenis_transaksi: finalJenis,
        kategori: formModal.kategori,
        kantong_sumber: finalSumber,
        kantong_tujuan: finalTujuan,
        nominal: nominalVal,
        biaya_admin: biayaAdminVal,
        keterangan: formModal.keterangan,
        tanggal: formModal.tanggal,
        penanggung_jawab: "Bendahara",
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

  // Filter mutasi sesuai kantong aktif (Limit 50)
  const displayedMutasi = useMemo(() => {
    return (bukuKas || [])
      .filter((item) => {
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
      })
      .slice(0, 50);
  }, [bukuKas, activeTab]);

  const heroInfo = useMemo(() => {
    if (activeTab === "bank") {
      return {
        title: "Saldo Rekening Bank Pesantren",
        saldo: kantong.saldo_rekening_bank,
        masukLabel: "Total Masuk Bank",
        masukVal: formatRp(
          Number(kantong.masuk_tagihan_transfer || 0) +
            Number(kantong.total_midtrans_sudah_cair || 0) +
            Number(kantong.setor_tunai_ke_bank || 0) +
            Number(kantong.pemasukan_lain_bank || 0),
        ),
        keluarLabel: "Pengeluaran Bank",
        keluarVal: formatRp(
          Number(kantong.pengeluaran_bank || 0) +
            Number(kantong.tarik_tunai_dari_bank || 0),
        ),
      };
    }
    if (activeTab === "midtrans") {
      return {
        title: "Saldo Mengendap Midtrans (QRIS/VA)",
        saldo: kantong.saldo_mengendap_midtrans,
        masukLabel: "Sudah Cair ke Bank",
        masukVal: formatRp(kantong.total_midtrans_sudah_cair),
        keluarLabel: "Menunggu Cair",
        keluarVal: `${kantong.jumlah_trx_mengendap_midtrans || 0} Trx`,
      };
    }
    return {
      title: "Saldo Kas Tunai (Bendahara)",
      saldo: kantong.saldo_kas_tunai,
      masukLabel: "Total Masuk Tunai",
      masukVal: formatRp(
        Number(kantong.masuk_tagihan_tunai || 0) +
          Number(kantong.pemasukan_lain_tunai || 0) +
          Number(kantong.tarik_tunai_dari_bank || 0),
      ),
      keluarLabel: "Keluar & Setor Bank",
      keluarVal: formatRp(
        Number(kantong.pengeluaran_tunai || 0) +
          Number(kantong.setor_tunai_ke_bank || 0),
      ),
    };
  }, [activeTab, kantong]);

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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 700 }}>
            {heroInfo.title}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              color: "#ecfdf5",
              background: "rgba(255, 255, 255, 0.16)",
              padding: "2px 8px",
              borderRadius: "999px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            Total Kas + Bank: {formatRp(kantong.saldo_siap_pakai)}
          </div>
        </div>
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            letterSpacing: "-0.6px",
            marginTop: "2px",
          }}
        >
          {formatRp(heroInfo.saldo)}
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
              <div style={{ fontSize: "0.6rem", color: "#d1fae5" }}>
                {heroInfo.masukLabel}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {heroInfo.masukVal}
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
              <div style={{ fontSize: "0.6rem", color: "#fecaca" }}>
                {heroInfo.keluarLabel}
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {heroInfo.keluarVal}
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

      {/* 3. RIWAYAT MUTASI KAS (LIMIT 50 - MODERN CARD LIST VIEW) */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
            padding: "0 2px",
          }}
        >
          <div
            style={{
              fontSize: "0.84rem",
              fontWeight: 900,
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "15px",
                background: "#0d766e",
                borderRadius: "4px",
              }}
            />
            <span>
              {activeTab === "tunai"
                ? "Riwayat Mutasi Kas Tunai"
                : activeTab === "bank"
                  ? "Riwayat Mutasi Rekening Bank"
                  : "Riwayat Pencairan Midtrans"}
            </span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              color: "#047857",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {displayedMutasi.length} Mutasi
          </span>
        </div>

        {loading && bukuKas.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "28px 16px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
              fontSize: "0.76rem",
              color: "#64748b",
            }}
          >
            Memuat data buku kas...
          </div>
        ) : displayedMutasi.length === 0 ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: "18px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "0.76rem",
            }}
          >
            Belum ada catatan mutasi pada kantong ini.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {displayedMutasi.map((item) => {
              const isOut = item.jenis_transaksi === "Pengeluaran";
              const isIn =
                item.jenis_transaksi === "Pemasukan Lain" ||
                Boolean(item.is_pembayaran_santri);
              const isCair = item.jenis_transaksi === "Pencairan Midtrans ke Bank";

              const color = isOut
                ? "#be123c"
                : isIn
                  ? "#047857"
                  : isCair
                    ? "#6d28d9"
                    : "#0369a1";
              const accent = isOut
                ? "#e11d48"
                : isIn
                  ? "#10b981"
                  : isCair
                    ? "#7c3aed"
                    : "#0284c7";
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

              const rawKeterangan = String(item.keterangan || "-");
              const parts = rawKeterangan.split(" — ");
              const mainTitle = item.is_pembayaran_santri
                ? parts[0] || "Pembayaran Santri"
                : item.kategori || item.jenis_transaksi;
              const detailText = item.is_pembayaran_santri
                ? parts.slice(1).join(" — ") || rawKeterangan
                : rawKeterangan;

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    borderLeft: `4px solid ${accent}`,
                    boxShadow: "0 4px 14px -4px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  {/* Header Row: Icon + Title/Date + Nominal & Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px",
                      marginBottom: "10px",
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
                          background: bg,
                          color,
                          border: `1px solid ${borderCol}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isOut ? (
                          <ArrowDownRight size={18} />
                        ) : isIn ? (
                          <ArrowUpRight size={18} />
                        ) : (
                          <ArrowRightLeft size={16} />
                        )}
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
                          {mainTitle}
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
                            {formatDateId(item.tanggal)}
                          </span>
                          {item.kode_mutasi && <span>• #{item.kode_mutasi}</span>}
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
                          color,
                        }}
                      >
                        {isOut ? "- " : isIn ? "+ " : ""}
                        {formatRp(item.nominal)}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          background: bg,
                          color,
                          border: `1px solid ${borderCol}`,
                        }}
                      >
                        {item.jenis_transaksi === "Pemasukan Lain"
                          ? "Pemasukan"
                          : item.jenis_transaksi}
                      </span>
                    </div>
                  </div>

                  {/* Detail / Uraian Box (Soft Tinted seperti Tata Tertib) */}
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#334155",
                      background: bg,
                      border: `1px solid ${borderCol}`,
                      padding: "9px 11px",
                      borderRadius: "12px",
                      marginBottom:
                        !readOnly && !item.is_pembayaran_santri ? "10px" : "0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.64rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color,
                        }}
                      >
                        {item.is_pembayaran_santri
                          ? "Rincian Pembayaran Tagihan"
                          : "Uraian / Keterangan"}
                      </span>
                      {(item.kantong_sumber || item.kantong_tujuan) && (
                        <span
                          style={{
                            fontSize: "0.63rem",
                            fontWeight: 800,
                            padding: "1px 7px",
                            borderRadius: "999px",
                            background: "#ffffff",
                            color,
                            border: `1px solid ${borderCol}`,
                          }}
                        >
                          {item.kantong_sumber && item.kantong_tujuan && item.kantong_sumber !== item.kantong_tujuan
                            ? `${item.kantong_sumber} → ${item.kantong_tujuan}`
                            : item.kantong_sumber || item.kantong_tujuan}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#0f172a",
                        lineHeight: 1.38,
                      }}
                    >
                      {detailText}
                    </div>
                    {item.biaya_admin > 0 && (
                      <div
                        style={{
                          fontSize: "0.66rem",
                          color: "#dc2626",
                          fontWeight: 700,
                          marginTop: "4px",
                        }}
                      >
                        Biaya Admin: {formatRp(item.biaya_admin)}
                      </div>
                    )}
                  </div>

                  {/* Action Footer untuk Catatan Buku Kas Manual */}
                  {!readOnly && !item.is_pembayaran_santri && (
                    <div
                      style={{
                        display: "flex",
                        gap: "7px",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "9px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={13} color={color} />
                        <span>Catatan Buku Kas</span>
                      </span>

                      <div
                        style={{ display: "flex", gap: "6px", marginLeft: "auto" }}
                      >
                        <button
                          type="button"
                          onClick={() => openEditFormModal(item)}
                          style={{
                            padding: "6px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            background: "#ffffff",
                            color: "#334155",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBukuKas(item)}
                          style={{
                            padding: "6px 11px",
                            borderRadius: "10px",
                            border: "1px solid #fecdd3",
                            background: "#fff1f2",
                            color: "#be123c",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} /> Hapus
                        </button>
                      </div>
                    </div>
                  )}
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
                  {formModal.jenis_transaksi === "Pemasukan Lain" ? "Pemasukan" : "Pengeluaran"} •{" "}
                  {formModal.kantong_aktif}
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
              gap: "12px",
            }}
          >
            {/* 1. TANGGAL DI PALING ATAS */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "11px 14px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                }}
              >
                <Calendar size={15} color="#059669" />
                <span>Tanggal Transaksi</span>
              </label>
              <input
                type="date"
                value={formModal.tanggal}
                onChange={(e) => setFormModal((p) => ({ ...p, tanggal: e.target.value }))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  background: "#f8fafc",
                  outline: "none",
                }}
              />
            </div>

            {/* 2. PILIH KANTONG KAS DULU */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "13px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#64748b",
                  display: "block",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                1. Pilih Kantong Kas
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
                    label: "Rek. Bank",
                    sub: formatRp(kantong.saldo_rekening_bank),
                    Icon: Building2,
                    color: "#0284c7",
                    bg: "#f0f9ff",
                  },
                ].map((k) => {
                  const selected = formModal.kantong_aktif === k.id;
                  const Icon = k.Icon;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() =>
                        setFormModal((p) => ({
                          ...p,
                          kantong_aktif: k.id,
                          kantong_sumber: k.id,
                          kantong_tujuan: k.id,
                        }))
                      }
                      style={{
                        padding: "11px 12px",
                        borderRadius: "13px",
                        border: selected ? `2px solid ${k.color}` : "1px solid #e2e8f0",
                        background: selected ? k.bg : "#f8fafc",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
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
                        <Icon size={15} color={selected ? k.color : "#94a3b8"} />
                      </div>
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b" }}>
                        {k.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formModal.mode === "add" && unsettledMidtrans.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormModal((p) => ({ ...p, isOpen: false }));
                    openCairMidtransModal();
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "11px",
                    border: "1.5px solid #c4b5fd",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <QrCode size={15} />
                    <span style={{ fontSize: "0.73rem", fontWeight: 800 }}>
                      Cairkan Saldo Midtrans ke Bank
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.66rem",
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

            {/* 3. PILIH PENGELUARAN ATAU PEMASUKAN */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "13px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#64748b",
                  display: "block",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                2. Pilih Jenis Transaksi ({formModal.kantong_aktif})
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  {
                    id: "Pengeluaran",
                    label: "Pengeluaran",
                    Icon: TrendingDown,
                    color: "#dc2626",
                    bg: "#fef2f2",
                  },
                  {
                    id: "Pemasukan Lain",
                    label: "Pemasukan",
                    Icon: TrendingUp,
                    color: "#059669",
                    bg: "#ecfdf5",
                  },
                ].map((j) => {
                  const active = formModal.jenis_transaksi === j.id;
                  const Icon = j.Icon;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        const nextList =
                          j.id === "Pengeluaran"
                            ? kategoriPengeluaranList
                            : kategoriPemasukanList;
                        setKategoriEditor({ mode: null, value: "", originalValue: "" });
                        setFormModal((p) => ({
                          ...p,
                          jenis_transaksi: j.id,
                          kategori: nextList[0] || "",
                        }));
                      }}
                      style={{
                        padding: "11px 12px",
                        borderRadius: "12px",
                        border: active ? `2px solid ${j.color}` : "1px solid #e2e8f0",
                        background: active ? j.bg : "#f8fafc",
                        color: active ? j.color : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "7px",
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={16} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 900 }}>{j.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. NOMINAL TRANSAKSI (RP) */}
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
                  fontSize: "0.7rem",
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
                  borderRadius: "13px",
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 900,
                    flexShrink: 0,
                    color:
                      formModal.jenis_transaksi === "Pengeluaran" ? "#dc2626" : "#059669",
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
                    fontSize: "1.45rem",
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

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  marginTop: "9px",
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
                      fontSize: "0.69rem",
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

            {/* 5. PILIH KATEGORI (BISA TAMBAH, KURANG/HAPUS, EDIT) */}
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
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "9px",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  Pilih Kategori
                </label>

                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setKategoriEditor({
                        mode: "add",
                        value: "",
                        originalValue: "",
                      })
                    }
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#059669",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={12} />
                    <span>Tambah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setKategoriEditor({
                        mode: "edit",
                        value: formModal.kategori,
                        originalValue: formModal.kategori,
                      })
                    }
                    style={{
                      background: "#f0f9ff",
                      border: "1px solid #bae6fd",
                      color: "#0284c7",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteSelectedKategori}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                    }}
                  >
                    <Trash2 size={11} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {kategoriEditor.mode && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "10px",
                    background: "#f8fafc",
                    padding: "8px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <input
                    type="text"
                    placeholder={
                      kategoriEditor.mode === "add"
                        ? "Nama kategori baru..."
                        : "Ubah nama kategori..."
                    }
                    value={kategoriEditor.value}
                    onChange={(e) =>
                      setKategoriEditor((p) => ({ ...p, value: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      outline: "none",
                      background: "#ffffff",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveKategoriEditor}
                    style={{
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 12px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setKategoriEditor({ mode: null, value: "", originalValue: "" })
                    }
                    style={{
                      background: "#e2e8f0",
                      color: "#475569",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 10px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                {(formModal.jenis_transaksi === "Pengeluaran"
                  ? kategoriPengeluaranList
                  : kategoriPemasukanList
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

            {/* 6. URAIAN / KETERANGAN TRANSAKSI */}
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
                  color: "#334155",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Uraian / Keterangan Transaksi *
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Beli beras dapur 5 karung / Donasi warga"
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
