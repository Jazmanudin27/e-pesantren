import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  CalendarCheck,
  BookOpen,
  Plus,
  Search,
  Clock,
  Edit3,
  Trash2,
  Copy,
  Users,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import {
  showConfirm,
  showSuccess,
  showError,
  toastSuccess,
  toastError,
} from "../../utils/alert.util";

const ALL_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

// Helper: Cek apakah kegiatan berjalan pada hari tertentu
const isKegiatanOnDay = (keg, targetDay) => {
  if (!targetDay || targetDay === "semua") return true;
  const raw = (keg.hari_aktif || "Setiap Hari").trim();
  const lower = raw.toLowerCase();

  if (lower === "setiap hari" || lower === "semua" || lower === "semua hari")
    return true;

  if (lower === "senin - jumat" || lower === "senin-jumat") {
    return ["senin", "selasa", "rabu", "kamis", "jumat"].includes(
      targetDay.toLowerCase(),
    );
  }
  if (lower === "senin - sabtu" || lower === "senin-sabtu") {
    return ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"].includes(
      targetDay.toLowerCase(),
    );
  }
  if (
    lower === "sabtu - ahad" ||
    lower === "sabtu-ahad" ||
    lower.includes("weekend")
  ) {
    return ["sabtu", "ahad"].includes(targetDay.toLowerCase());
  }

  const parts = raw.split(/[,/]+/).map((p) => p.trim().toLowerCase());
  return parts.some(
    (p) => p === targetDay.toLowerCase() || p.includes(targetDay.toLowerCase()),
  );
};

// Helper: Format hari
const parseDaysToArray = (hariAktifStr) => {
  if (
    !hariAktifStr ||
    hariAktifStr === "Setiap Hari" ||
    hariAktifStr === "Semua" ||
    hariAktifStr === "Semua Hari"
  ) {
    return [...ALL_DAYS];
  }
  if (hariAktifStr === "Senin - Jumat" || hariAktifStr === "Senin-Jumat") {
    return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  }
  if (hariAktifStr === "Senin - Sabtu" || hariAktifStr === "Senin-Sabtu") {
    return ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  }
  if (
    hariAktifStr === "Sabtu - Ahad" ||
    hariAktifStr === "Sabtu-Ahad" ||
    hariAktifStr === "Weekend"
  ) {
    return ["Sabtu", "Ahad"];
  }
  return ALL_DAYS.filter((d) =>
    isKegiatanOnDay({ hari_aktif: hariAktifStr }, d),
  );
};

const formatDaysToString = (daysArr) => {
  if (!daysArr || daysArr.length === 0) return "Setiap Hari";
  if (daysArr.length === 7) return "Setiap Hari";
  if (
    daysArr.length === 5 &&
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].every((d) =>
      daysArr.includes(d),
    )
  ) {
    return "Senin - Jumat";
  }
  if (
    daysArr.length === 6 &&
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].every((d) =>
      daysArr.includes(d),
    )
  ) {
    return "Senin - Sabtu";
  }
  if (
    daysArr.length === 2 &&
    daysArr.includes("Sabtu") &&
    daysArr.includes("Ahad")
  ) {
    return "Sabtu - Ahad";
  }
  return daysArr.join(", ");
};

export default function MobileKegiatan() {
  // 2 Kategori Tab: 'berjamaah' (Shalat/Ibadah Berjamaah) vs 'mengaji' (Kajian/Kitab/Mengaji)
  const [activeTab, setActiveTab] = useState("berjamaah");

  const [kegiatanList, setKegiatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("semua");

  // Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    kode_sesi: "",
    nama_sesi: "",
    kategori: "Shalat Berjamaah",
    tipe_peserta: "Wajib Semua Santri",
    target_gender: "Semua",
    jam_mulai_presensi: "04:15",
    jam_target: "04:40",
    jam_toleransi_telat: "04:45",
    jam_tutup_presensi: "05:15",
    hari_aktif: "Setiap Hari",
    selected_days: [...ALL_DAYS],
    is_active: 1,
    keterangan: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // Default Fallback Kegiatan jika DB kosong
  const defaultSeeds = [
    // Kegiatan Berjamaah
    {
      id: 101,
      kode_sesi: "SHLT-SBH",
      nama_sesi: "Shalat Subuh Berjamaah",
      kategori: "Shalat Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "04:15",
      jam_target: "04:40",
      jam_toleransi_telat: "04:45",
      jam_tutup_presensi: "05:20",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 102,
      kode_sesi: "SHLT-DZH",
      nama_sesi: "Shalat Dzuhur Berjamaah",
      kategori: "Shalat Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "11:45",
      jam_target: "12:05",
      jam_toleransi_telat: "12:10",
      jam_tutup_presensi: "12:45",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 103,
      kode_sesi: "SHLT-ASH",
      nama_sesi: "Shalat Ashar Berjamaah",
      kategori: "Shalat Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "15:00",
      jam_target: "15:20",
      jam_toleransi_telat: "15:25",
      jam_tutup_presensi: "16:00",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 104,
      kode_sesi: "SHLT-MGB",
      nama_sesi: "Shalat Maghrib Berjamaah",
      kategori: "Shalat Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "17:45",
      jam_target: "18:05",
      jam_toleransi_telat: "18:10",
      jam_tutup_presensi: "18:40",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 105,
      kode_sesi: "SHLT-ISY",
      nama_sesi: "Shalat Isya Berjamaah",
      kategori: "Shalat Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "19:00",
      jam_target: "19:20",
      jam_toleransi_telat: "19:25",
      jam_tutup_presensi: "20:00",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 106,
      kode_sesi: "IBD-DHU",
      nama_sesi: "Shalat Dhuha Bersama",
      kategori: "Kegiatan Ibadah Berjamaah",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "06:45",
      jam_target: "07:00",
      jam_toleransi_telat: "07:05",
      jam_tutup_presensi: "07:30",
      hari_aktif: "Senin - Sabtu",
      is_active: 1,
    },

    // Kegiatan Mengaji
    {
      id: 201,
      kode_sesi: "KJN-SRG",
      nama_sesi: "Sorogan Kitab Fathul Qorib",
      kategori: "Pengajian / Mengaji",
      tipe_peserta: "Santri Tertentu / Terpilih",
      target_gender: "Semua",
      jam_mulai_presensi: "05:45",
      jam_target: "06:00",
      jam_toleransi_telat: "06:10",
      jam_tutup_presensi: "07:00",
      hari_aktif: "Senin - Jumat",
      is_active: 1,
    },
    {
      id: 202,
      kode_sesi: "KJN-BDG",
      nama_sesi: "Bandongan Kitab Ihya Ulumiddin",
      kategori: "Pengajian / Mengaji",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "18:30",
      jam_target: "18:45",
      jam_toleransi_telat: "18:50",
      jam_tutup_presensi: "19:15",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 203,
      kode_sesi: "KJN-THF",
      nama_sesi: "Halaqah Tahfidz & Tasmi Al-Qur'an",
      kategori: "Pengajian / Mengaji",
      tipe_peserta: "Wajib Semua Santri",
      target_gender: "Semua",
      jam_mulai_presensi: "05:30",
      jam_target: "05:45",
      jam_toleransi_telat: "05:50",
      jam_tutup_presensi: "06:30",
      hari_aktif: "Setiap Hari",
      is_active: 1,
    },
    {
      id: 204,
      kode_sesi: "KJN-TKL",
      nama_sesi: "Taklim Tafsir Jalalain Sore",
      kategori: "Pengajian / Mengaji",
      tipe_peserta: "Santri Tertentu / Terpilih",
      target_gender: "Semua",
      jam_mulai_presensi: "16:15",
      jam_target: "16:30",
      jam_toleransi_telat: "16:35",
      jam_tutup_presensi: "17:15",
      hari_aktif: "Senin - Kamis",
      is_active: 1,
    },
    {
      id: 205,
      kode_sesi: "KJN-JRM",
      nama_sesi: "Kajian Nahwu Jurumiyah & Tashrif",
      kategori: "Pengajian / Mengaji",
      tipe_peserta: "Santri Tertentu / Terpilih",
      target_gender: "Semua",
      jam_mulai_presensi: "20:15",
      jam_target: "20:30",
      jam_toleransi_telat: "20:35",
      jam_tutup_presensi: "21:30",
      hari_aktif: "Senin - Jumat",
      is_active: 1,
    },
  ];

  // Fetch kegiatan dari API
  const fetchKegiatan = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/absensi/sesi");
      if (
        res.data?.success &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        setKegiatanList(res.data.data);
      } else {
        const local = JSON.parse(
          localStorage.getItem("mobile_kegiatan_list") || "null",
        );
        setKegiatanList(local && local.length > 0 ? local : defaultSeeds);
      }
    } catch (e) {
      console.warn("Fallback kegiatan offline:", e);
      const local = JSON.parse(
        localStorage.getItem("mobile_kegiatan_list") || "null",
      );
      setKegiatanList(local && local.length > 0 ? local : defaultSeeds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKegiatan();
  }, []);

  // Helper Cek Kategori Tab
  const isBerjamaah = (keg) => {
    const kat = (keg.kategori || "").toLowerCase();
    const nama = (keg.nama_sesi || "").toLowerCase();
    return (
      kat.includes("shalat") ||
      kat.includes("berjamaah") ||
      kat.includes("ibadah") ||
      nama.includes("shalat") ||
      nama.includes("subuh") ||
      nama.includes("dzuhur") ||
      nama.includes("ashar") ||
      nama.includes("maghrib") ||
      nama.includes("isya") ||
      nama.includes("dhuha")
    );
  };

  // Filter List sesuai Tab Aktif, Hari, dan Search
  const listBerjamaah = kegiatanList.filter(isBerjamaah);
  const listMengaji = kegiatanList.filter((k) => !isBerjamaah(k));

  const currentList = (
    activeTab === "berjamaah" ? listBerjamaah : listMengaji
  ).filter((item) => {
    if (selectedDay !== "semua" && !isKegiatanOnDay(item, selectedDay))
      return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.nama_sesi?.toLowerCase().includes(q) ||
        item.kode_sesi?.toLowerCase().includes(q) ||
        item.hari_aktif?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Buka Form Tambah
  const handleOpenAdd = () => {
    setFormMode("add");
    const suffix = Date.now().toString().slice(-3);
    const isTabBerjamaah = activeTab === "berjamaah";
    setFormData({
      ...initialForm,
      kode_sesi: isTabBerjamaah ? `SHLT-${suffix}` : `KJN-${suffix}`,
      kategori: isTabBerjamaah ? "Shalat Berjamaah" : "Pengajian / Mengaji",
      nama_sesi: isTabBerjamaah ? "Shalat Berjamaah " : "Kajian Kitab ",
      jam_mulai_presensi: isTabBerjamaah ? "04:15" : "18:30",
      jam_target: isTabBerjamaah ? "04:35" : "18:50",
      jam_toleransi_telat: isTabBerjamaah ? "04:40" : "18:55",
      jam_tutup_presensi: isTabBerjamaah ? "05:15" : "19:30",
      hari_aktif: "Setiap Hari",
      selected_days: [...ALL_DAYS],
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  // Buka Form Edit
  const handleOpenEdit = (keg) => {
    setFormMode("edit");
    const daysArr = parseDaysToArray(keg.hari_aktif);
    setFormData({
      id: keg.id,
      kode_sesi: keg.kode_sesi || "",
      nama_sesi: keg.nama_sesi || "",
      kategori:
        keg.kategori ||
        (activeTab === "berjamaah"
          ? "Shalat Berjamaah"
          : "Pengajian / Mengaji"),
      tipe_peserta: keg.tipe_peserta || "Wajib Semua Santri",
      target_gender: keg.target_gender || "Semua",
      jam_mulai_presensi: keg.jam_mulai_presensi
        ? keg.jam_mulai_presensi.slice(0, 5)
        : "04:15",
      jam_target: keg.jam_target ? keg.jam_target.slice(0, 5) : "04:40",
      jam_toleransi_telat: keg.jam_toleransi_telat
        ? keg.jam_toleransi_telat.slice(0, 5)
        : "04:45",
      jam_tutup_presensi: keg.jam_tutup_presensi
        ? keg.jam_tutup_presensi.slice(0, 5)
        : "05:15",
      hari_aktif: keg.hari_aktif || "Setiap Hari",
      selected_days: daysArr.length > 0 ? daysArr : [...ALL_DAYS],
      is_active: keg.is_active !== undefined ? keg.is_active : 1,
      keterangan: keg.keterangan || "",
    });
    setIsModalOpen(true);
  };

  // Duplikasi Kegiatan Cepat
  const handleDuplicate = async (keg) => {
    const daysArr = parseDaysToArray(keg.hari_aktif);
    const newKeg = {
      ...keg,
      id: Date.now(),
      kode_sesi: `${keg.kode_sesi || "KEG"}-CPY`,
      nama_sesi: `${keg.nama_sesi} (Salinan)`,
      hari_aktif: keg.hari_aktif || "Setiap Hari",
      selected_days: daysArr,
    };

    try {
      await axios.post("/api/absensi/sesi", newKeg);
      toastSuccess(`Kegiatan "${newKeg.nama_sesi}" berhasil disalin!`);
      fetchKegiatan();
    } catch (e) {
      // Local fallback
      setKegiatanList((prev) => {
        const next = [newKeg, ...prev];
        localStorage.setItem("mobile_kegiatan_list", JSON.stringify(next));
        return next;
      });
      toastSuccess(`Kegiatan "${newKeg.nama_sesi}" disalin (offline).`);
    }
  };

  // Toggle Aktif / Nonaktif
  const handleToggleStatus = async (keg) => {
    const newStatus = keg.is_active == 1 ? 0 : 1;
    try {
      await axios.put(`/api/absensi/sesi/${keg.id}`, {
        ...keg,
        is_active: newStatus,
      });
      toastSuccess(
        `Status "${keg.nama_sesi}" berhasil diubah menjadi ${newStatus == 1 ? "Aktif" : "Nonaktif"}.`,
      );
      fetchKegiatan();
    } catch (e) {
      setKegiatanList((prev) => {
        const next = prev.map((item) =>
          item.id === keg.id ? { ...item, is_active: newStatus } : item,
        );
        localStorage.setItem("mobile_kegiatan_list", JSON.stringify(next));
        return next;
      });
      toastSuccess(`Status "${keg.nama_sesi}" diubah (offline).`);
    }
  };

  // Hapus Kegiatan
  const handleDelete = async (keg) => {
    const ok = await showConfirm(
      "Hapus Kegiatan?",
      `Yakin ingin menghapus kegiatan "${keg.nama_sesi}"? Data presensi terkait tetap tersimpan di riwayat.`,
      "Ya, Hapus",
      "Batal",
    );
    if (!ok) return;

    try {
      await axios.delete(`/api/absensi/sesi/${keg.id}`);
      toastSuccess(`Kegiatan "${keg.nama_sesi}" berhasil dihapus.`);
      fetchKegiatan();
    } catch (e) {
      setKegiatanList((prev) => {
        const next = prev.filter((item) => item.id !== keg.id);
        localStorage.setItem("mobile_kegiatan_list", JSON.stringify(next));
        return next;
      });
      toastSuccess(`Kegiatan "${keg.nama_sesi}" dihapus.`);
    }
  };

  // Toggle Pilihan Hari di Form
  const toggleFormDay = (day) => {
    setFormData((prev) => {
      const current = prev.selected_days || [];
      const updated = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return {
        ...prev,
        selected_days: updated,
        hari_aktif: formatDaysToString(updated),
      };
    });
  };

  // Simpan Data Form (Tambah / Edit)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama_sesi.trim()) {
      showError("Validasi Gagal", "Nama kegiatan santri wajib diisi!");
      return;
    }
    if (!formData.selected_days || formData.selected_days.length === 0) {
      showError(
        "Validasi Gagal",
        "Pilih minimal satu hari pelaksanaan kegiatan!",
      );
      return;
    }

    try {
      setSubmitting(true);
      const formattedDays = formatDaysToString(formData.selected_days);
      const payload = {
        ...formData,
        hari_aktif: formattedDays,
        jam_mulai_presensi:
          formData.jam_mulai_presensi.length === 5
            ? `${formData.jam_mulai_presensi}:00`
            : formData.jam_mulai_presensi,
        jam_target:
          formData.jam_target.length === 5
            ? `${formData.jam_target}:00`
            : formData.jam_target,
        jam_toleransi_telat:
          formData.jam_toleransi_telat.length === 5
            ? `${formData.jam_toleransi_telat}:00`
            : formData.jam_toleransi_telat,
        jam_tutup_presensi:
          formData.jam_tutup_presensi.length === 5
            ? `${formData.jam_tutup_presensi}:00`
            : formData.jam_tutup_presensi,
      };

      if (formMode === "add") {
        const res = await axios
          .post("/api/absensi/sesi", payload)
          .catch(() => null);
        if (res?.data?.success) {
          toastSuccess(`Kegiatan "${payload.nama_sesi}" berhasil ditambahkan!`);
        } else {
          // Local fallback
          setKegiatanList((prev) => {
            const next = [{ ...payload, id: Date.now() }, ...prev];
            localStorage.setItem("mobile_kegiatan_list", JSON.stringify(next));
            return next;
          });
          toastSuccess(`Kegiatan "${payload.nama_sesi}" disimpan!`);
        }
      } else {
        const res = await axios
          .put(`/api/absensi/sesi/${formData.id}`, payload)
          .catch(() => null);
        if (res?.data?.success) {
          toastSuccess(`Kegiatan "${payload.nama_sesi}" berhasil diperbarui!`);
        } else {
          setKegiatanList((prev) => {
            const next = prev.map((item) =>
              item.id === formData.id ? { ...item, ...payload } : item,
            );
            localStorage.setItem("mobile_kegiatan_list", JSON.stringify(next));
            return next;
          });
          toastSuccess(`Kegiatan "${payload.nama_sesi}" diperbarui!`);
        }
      }

      setIsModalOpen(false);
      fetchKegiatan();
    } catch (err) {
      showError("Gagal Menyimpan", err.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        paddingBottom: "90px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* 1. TOP SEGMENTED TAB SWITCHER (2 TAB KATEGORI UTAMA) */}
      <div
        style={{
          padding: "14px 14px 10px",
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "14px",
          }}
        >
          {/* Tab 1: Berjamaah */}
          <button
            type="button"
            onClick={() => setActiveTab("berjamaah")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "11px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "berjamaah" ? "#0d766e" : "transparent",
              color: activeTab === "berjamaah" ? "#ffffff" : "#475569",
              fontWeight: activeTab === "berjamaah" ? 800 : 600,
              fontSize: "0.76rem",
              boxShadow:
                activeTab === "berjamaah"
                  ? "0 4px 12px rgba(13, 118, 110, 0.3)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span>🕌</span>
            <span>Kegiatan Berjamaah</span>
            <span
              style={{
                background:
                  activeTab === "berjamaah"
                    ? "rgba(255,255,255,0.25)"
                    : "#e2e8f0",
                color: activeTab === "berjamaah" ? "#ffffff" : "#64748b",
                fontSize: "0.62rem",
                padding: "2px 6px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {listBerjamaah.length}
            </span>
          </button>

          {/* Tab 2: Mengaji */}
          <button
            type="button"
            onClick={() => setActiveTab("mengaji")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 8px",
              borderRadius: "11px",
              border: "none",
              cursor: "pointer",
              background: activeTab === "mengaji" ? "#0284c7" : "transparent",
              color: activeTab === "mengaji" ? "#ffffff" : "#475569",
              fontWeight: activeTab === "mengaji" ? 800 : 600,
              fontSize: "0.76rem",
              boxShadow:
                activeTab === "mengaji"
                  ? "0 4px 12px rgba(2, 132, 199, 0.3)"
                  : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span>📖</span>
            <span>Kegiatan Mengaji</span>
            <span
              style={{
                background:
                  activeTab === "mengaji"
                    ? "rgba(255,255,255,0.25)"
                    : "#e2e8f0",
                color: activeTab === "mengaji" ? "#ffffff" : "#64748b",
                fontSize: "0.62rem",
                padding: "2px 6px",
                borderRadius: "999px",
                fontWeight: 800,
              }}
            >
              {listMengaji.length}
            </span>
          </button>
        </div>

        {/* Search Bar & Tambah Button */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              color="#94a3b8"
              style={{ position: "absolute", left: "12px" }}
            />
            <input
              type="text"
              placeholder={
                activeTab === "berjamaah"
                  ? "Cari shalat berjamaah..."
                  : "Cari kitab / pengajian..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
                outline: "none",
                background: "#f8fafc",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            style={{
              background:
                activeTab === "berjamaah"
                  ? "linear-gradient(135deg, #0d766e, #059669)"
                  : "linear-gradient(135deg, #0284c7, #2563eb)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "0 14px",
              fontSize: "0.76rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
            }}
          >
            <Plus size={16} />
            <span>Tambah</span>
          </button>
        </div>

        {/* Day Filter Chips (Scrollable) */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            paddingTop: "10px",
            paddingBottom: "2px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {["semua", ...ALL_DAYS].map((day) => {
            const isSel = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  border: isSel ? "none" : "1px solid #e2e8f0",
                  background: isSel
                    ? activeTab === "berjamaah"
                      ? "#0d766e"
                      : "#0284c7"
                    : "#ffffff",
                  color: isSel ? "#ffffff" : "#64748b",
                  fontSize: "0.68rem",
                  fontWeight: isSel ? 700 : 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {day === "semua" ? "Semua Hari" : day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DAFTAR KARTU KEGIATAN */}
      <div style={{ padding: "14px" }}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#64748b",
            }}
          >
            <Loader2
              size={30}
              className="animate-spin"
              style={{
                margin: "0 auto 10px",
                color: activeTab === "berjamaah" ? "#0d766e" : "#0284c7",
              }}
            />
            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>
              Memuat jadwal kegiatan...
            </div>
          </div>
        ) : currentList.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              padding: "36px 20px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                background: activeTab === "berjamaah" ? "#f0fdfa" : "#f0f9ff",
                color: activeTab === "berjamaah" ? "#0d766e" : "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              {activeTab === "berjamaah" ? (
                <CalendarCheck size={26} />
              ) : (
                <BookOpen size={26} />
              )}
            </div>
            <div
              style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b" }}
            >
              Tidak Ada Kegiatan Ditemukan
            </div>
            <div
              style={{
                fontSize: "0.74rem",
                color: "#64748b",
                marginTop: "4px",
                lineHeight: 1.4,
              }}
            >
              {search
                ? `Tidak ada jadwal cocok dengan kata kunci "${search}"`
                : `Belum ada jadwal kegiatan untuk kategori ${activeTab === "berjamaah" ? "Berjamaah" : "Mengaji"}.`}
            </div>
            <button
              onClick={handleOpenAdd}
              style={{
                marginTop: "16px",
                background: activeTab === "berjamaah" ? "#0d766e" : "#0284c7",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Tambah Kegiatan Baru
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {currentList.map((keg) => {
              const isActive = keg.is_active == 1;
              return (
                <div
                  key={keg.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Left accent bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: "4px",
                      background: isActive
                        ? activeTab === "berjamaah"
                          ? "#0d766e"
                          : "#0284c7"
                        : "#cbd5e1",
                    }}
                  />

                  {/* Header Row: Title & Active Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginLeft: "6px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                            color:
                              activeTab === "berjamaah" ? "#0d766e" : "#0284c7",
                            background:
                              activeTab === "berjamaah" ? "#ccfbf1" : "#e0f2fe",
                            padding: "2px 6px",
                            borderRadius: "6px",
                          }}
                        >
                          {keg.kode_sesi || "KEG"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            color: "#64748b",
                            fontWeight: 600,
                          }}
                        >
                          • {keg.hari_aktif || "Setiap Hari"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginTop: "3px",
                        }}
                      >
                        {keg.nama_sesi}
                      </div>
                    </div>

                    {/* Status Pill Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(keg)}
                      style={{
                        background: isActive ? "#f0fdf4" : "#f8fafc",
                        border: `1px solid ${isActive ? "#bbf7d0" : "#e2e8f0"}`,
                        color: isActive ? "#16a34a" : "#94a3b8",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        fontSize: "0.64rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                      title="Klik untuk ubah status aktif/nonaktif"
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: isActive ? "#22c55e" : "#cbd5e1",
                        }}
                      />
                      {isActive ? "Aktif" : "Nonaktif"}
                    </button>
                  </div>

                  {/* 4 Jadwal Waktu Grid (Mulai, Target/Adzan, Toleransi, Tutup) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "6px",
                      background: "#f8fafc",
                      borderRadius: "12px",
                      padding: "8px 10px",
                      marginTop: "10px",
                      marginLeft: "6px",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    {/* 1. Buka */}
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "0.56rem",
                          color: "#64748b",
                          fontWeight: 600,
                        }}
                      >
                        Buka Presensi
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          marginTop: "1px",
                        }}
                      >
                        {keg.jam_mulai_presensi?.slice(0, 5) || "04:15"}
                      </div>
                    </div>

                    {/* 2. Target / Iqomah */}
                    <div
                      style={{
                        textAlign: "center",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.56rem",
                          color: "#0d766e",
                          fontWeight: 700,
                        }}
                      >
                        {activeTab === "berjamaah" ? "Iqomah" : "Mulai Masuk"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 900,
                          color: "#0d766e",
                          marginTop: "1px",
                        }}
                      >
                        {keg.jam_target?.slice(0, 5) || "04:40"}
                      </div>
                    </div>

                    {/* 3. Toleransi Telat */}
                    <div
                      style={{
                        textAlign: "center",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.56rem",
                          color: "#d97706",
                          fontWeight: 700,
                        }}
                      >
                        Batas Telat
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          color: "#b45309",
                          marginTop: "1px",
                        }}
                      >
                        {keg.jam_toleransi_telat?.slice(0, 5) || "04:45"}
                      </div>
                    </div>

                    {/* 4. Tutup Sesi */}
                    <div
                      style={{
                        textAlign: "center",
                        borderLeft: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.56rem",
                          color: "#e11d48",
                          fontWeight: 700,
                        }}
                      >
                        Tutup Presensi
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          color: "#e11d48",
                          marginTop: "1px",
                        }}
                      >
                        {keg.jam_tutup_presensi?.slice(0, 5) || "05:15"}
                      </div>
                    </div>
                  </div>

                  {/* Footer Meta & Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "10px",
                      marginLeft: "6px",
                      paddingTop: "8px",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.64rem",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Users size={12} color="#94a3b8" />
                      <span>{keg.tipe_peserta || "Wajib Semua Santri"}</span>
                    </div>

                    {/* Action Buttons: Duplikat, Edit, Hapus */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDuplicate(keg)}
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          color: "#475569",
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Salin Jadwal Kegiatan"
                      >
                        <Copy size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(keg)}
                        style={{
                          background:
                            activeTab === "berjamaah" ? "#f0fdfa" : "#f0f9ff",
                          border: `1px solid ${activeTab === "berjamaah" ? "#99f6e4" : "#bae6fd"}`,
                          color:
                            activeTab === "berjamaah" ? "#0d766e" : "#0284c7",
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Edit Jadwal Kegiatan"
                      >
                        <Edit3 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(keg)}
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecdd3",
                          color: "#dc2626",
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                        title="Hapus Jadwal Kegiatan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MODAL TAMBAH / EDIT KEGIATAN (SLIDE UP BOTTOM SHEET) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setIsModalOpen(false)}
            style={{ position: "absolute", inset: 0 }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "430px",
              width: "100%",
              maxHeight: "90vh",
              background: "#ffffff",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              boxShadow: "0 -10px 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 18px",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.02rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {formMode === "add"
                    ? "Tambah Kegiatan Baru"
                    : "Edit Jadwal Kegiatan"}
                </h3>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    marginTop: "2px",
                  }}
                >
                  Kategori:{" "}
                  {activeTab === "berjamaah"
                    ? "Kegiatan Berjamaah"
                    : "Kegiatan Mengaji"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#f1f5f9",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSave}
              style={{
                overflowY: "auto",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Nama Kegiatan */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "5px",
                  }}
                >
                  NAMA KEGIATAN <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    activeTab === "berjamaah"
                      ? "Contoh: Shalat Subuh Berjamaah"
                      : "Contoh: Kajian Kitab Fathul Qorib"
                  }
                  value={formData.nama_sesi}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_sesi: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Kode Sesi & Kategori */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.2fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    KODE SESI
                  </label>
                  <input
                    type="text"
                    value={formData.kode_sesi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kode_sesi: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SHLT-01"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.8rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    KATEGORI
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    {activeTab === "berjamaah" ? (
                      <>
                        <option value="Shalat Berjamaah">
                          Shalat Berjamaah
                        </option>
                        <option value="Kegiatan Ibadah Berjamaah">
                          Kegiatan Ibadah Berjamaah
                        </option>
                        <option value="Dzikir & Doa Bersama">
                          Dzikir & Doa Bersama
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="Pengajian / Mengaji">
                          Pengajian / Mengaji
                        </option>
                        <option value="Sorogan Kitab">Sorogan Kitab</option>
                        <option value="Bandongan Kitab">Bandongan Kitab</option>
                        <option value="Tahfidz Al-Qur'an">
                          Tahfidz Al-Qur'an
                        </option>
                        <option value="Madrasah Diniyah">
                          Madrasah Diniyah
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Grid 4 Waktu Pelaksanaan */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  WAKTU PRESENSI (FORMAT 24 JAM)
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "8px",
                  }}
                >
                  {/* Jam Mulai */}
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      1. Buka Presensi
                    </span>
                    <input
                      type="time"
                      required
                      value={formData.jam_mulai_presensi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jam_mulai_presensi: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.82rem",
                        marginTop: "4px",
                      }}
                    />
                  </div>

                  {/* Jam Target / Iqomah */}
                  <div
                    style={{
                      background: "#f0fdfa",
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #ccfbf1",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#0d766e",
                      }}
                    >
                      2.{" "}
                      {activeTab === "berjamaah"
                        ? "Target Iqomah"
                        : "Mulai Masuk"}
                    </span>
                    <input
                      type="time"
                      required
                      value={formData.jam_target}
                      onChange={(e) =>
                        setFormData({ ...formData, jam_target: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #99f6e4",
                        fontSize: "0.82rem",
                        marginTop: "4px",
                        color: "#0d766e",
                        fontWeight: 800,
                      }}
                    />
                  </div>

                  {/* Jam Toleransi Telat */}
                  <div
                    style={{
                      background: "#fffbeb",
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #fef3c7",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#b45309",
                      }}
                    >
                      3. Batas Terlambat
                    </span>
                    <input
                      type="time"
                      required
                      value={formData.jam_toleransi_telat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jam_toleransi_telat: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #fde68a",
                        fontSize: "0.82rem",
                        marginTop: "4px",
                        color: "#b45309",
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  {/* Jam Tutup Presensi */}
                  <div
                    style={{
                      background: "#fff1f2",
                      padding: "8px",
                      borderRadius: "10px",
                      border: "1px solid #ffe4e6",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#e11d48",
                      }}
                    >
                      4. Tutup Presensi
                    </span>
                    <input
                      type="time"
                      required
                      value={formData.jam_tutup_presensi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jam_tutup_presensi: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        borderRadius: "6px",
                        border: "1px solid #fecdd3",
                        fontSize: "0.82rem",
                        marginTop: "4px",
                        color: "#e11d48",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Hari Pelaksanaan */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#334155",
                    }}
                  >
                    HARI AKTIF KEGIATAN
                  </label>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#0d766e",
                      fontWeight: 700,
                    }}
                  >
                    {formatDaysToString(formData.selected_days)}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "6px",
                  }}
                >
                  {ALL_DAYS.map((day) => {
                    const isChecked = formData.selected_days?.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleFormDay(day)}
                        style={{
                          padding: "7px 4px",
                          borderRadius: "8px",
                          border: isChecked
                            ? "1px solid #0d766e"
                            : "1px solid #cbd5e1",
                          background: isChecked ? "#f0fdfa" : "#ffffff",
                          color: isChecked ? "#0d766e" : "#64748b",
                          fontSize: "0.7rem",
                          fontWeight: isChecked ? 800 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipe Peserta & Status Aktif */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: "10px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    PESERTA
                  </label>
                  <select
                    value={formData.tipe_peserta}
                    onChange={(e) =>
                      setFormData({ ...formData, tipe_peserta: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.74rem",
                      background: "#ffffff",
                    }}
                  >
                    <option value="Wajib Semua Santri">
                      Wajib Semua Santri
                    </option>
                    <option value="Santri Tertentu / Terpilih">
                      Santri Tertentu
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#334155",
                      marginBottom: "5px",
                    }}
                  >
                    STATUS
                  </label>
                  <select
                    value={formData.is_active}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_active: Number(e.target.value),
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.74rem",
                      background: "#ffffff",
                    }}
                  >
                    <option value={1}>Aktif Digunakan</option>
                    <option value={0}>Nonaktif (Libur)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "11px",
                    borderRadius: "12px",
                    border: "none",
                    background:
                      activeTab === "berjamaah"
                        ? "linear-gradient(135deg, #0d766e, #059669)"
                        : "linear-gradient(135deg, #0284c7, #2563eb)",
                    color: "#ffffff",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>
                    {formMode === "add"
                      ? "Simpan Kegiatan"
                      : "Simpan Perubahan"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
