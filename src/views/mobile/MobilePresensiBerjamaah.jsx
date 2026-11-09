import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  Loader2,
  Users,
  Building,
  Volume2,
  VolumeX,
  ChevronDown,
  Check,
  History,
  ClipboardList,
  Filter,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  showSuccess,
  showError,
  toastSuccess,
  showConfirm,
} from "../../utils/alert.util";
import MobileLoadingState from "../../components/MobileLoadingState";

const DAFTAR_BERJAMAAH_DEFAULT = [
  { id: "s-1", nama: "Shalat Shubuh", kategori: "Shalat Berjamaah", tempat: "Masjid Jami", jam_target: "04:30:00" },
  { id: "s-2", nama: "Shalat Dzuhur", kategori: "Shalat Berjamaah", tempat: "Masjid Jami", jam_target: "12:00:00" },
  { id: "s-3", nama: "Shalat Ashar", kategori: "Shalat Berjamaah", tempat: "Masjid Jami", jam_target: "15:15:00" },
  { id: "s-4", nama: "Shalat Maghrib", kategori: "Shalat Berjamaah", tempat: "Masjid Jami", jam_target: "18:00:00" },
  { id: "s-5", nama: "Shalat Isya", kategori: "Shalat Berjamaah", tempat: "Masjid Jami", jam_target: "19:15:00" },
];

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateStr = (rawDate) => {
  if (!rawDate) return "";
  if (typeof rawDate === "string") return rawDate.split("T")[0].trim();
  if (rawDate instanceof Date) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, "0");
    const day = String(rawDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(rawDate).split("T")[0].trim();
};

const getInitials = (name) => {
  if (!name) return "S";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarTheme = (name = "") => {
  const themes = [
    { bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", color: "#166534", border: "#86efac", shadow: "0 4px 10px rgba(22, 101, 52, 0.12)" },
    { bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", color: "#075985", border: "#7dd3fc", shadow: "0 4px 10px rgba(7, 89, 133, 0.12)" },
    { bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", color: "#854d0e", border: "#fcd34d", shadow: "0 4px 10px rgba(133, 77, 14, 0.12)" },
    { bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)", color: "#6b21a8", border: "#d8b4fe", shadow: "0 4px 10px rgba(107, 33, 168, 0.12)" },
    { bg: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)", color: "#9f1239", border: "#fda4af", shadow: "0 4px 10px rgba(159, 18, 57, 0.12)" },
    { bg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)", color: "#115e59", border: "#5eead4", shadow: "0 4px 10px rgba(17, 94, 89, 0.12)" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % themes.length;
  return themes[idx];
};

export default function MobilePresensiBerjamaah() {
  // Hanya 2 Mode: 'manual' (Utama) | 'riwayat'
  const [activeMode, setActiveMode] = useState("manual");
  const [daftarBerjamaah, setDaftarBerjamaah] = useState(DAFTAR_BERJAMAAH_DEFAULT);
  const [selectedBerjamaah, setSelectedBerjamaah] = useState(DAFTAR_BERJAMAAH_DEFAULT[0]);

  // Dropdown Kelas (Lazy load santri per-kelas seperti Mengaji agar anti-lag)
  const [selectedBerjamaahKelas, setSelectedBerjamaahKelas] = useState("");
  const [loadingKelasSantri, setLoadingKelasSantri] = useState(false);

  const selectedBerjamaahKelasRef = useRef(selectedBerjamaahKelas);
  useEffect(() => {
    selectedBerjamaahKelasRef.current = selectedBerjamaahKelas;
  }, [selectedBerjamaahKelas]);

  // Data State
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [presensiLogs, setPresensiLogs] = useState([]);
  const [activeHaidIds, setActiveHaidIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter State
  const [searchManual, setSearchManual] = useState("");
  const [filterManualStatus, setFilterManualStatus] = useState("Semua"); // 'Semua' | 'Belum' | 'Hadir'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Otomatis deteksi sesi shalat sesuai jam saat ini
  const detectActiveBerjamaahBySchedule = (list = daftarBerjamaah) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const now = new Date();
    const curMin = now.getHours() * 60 + now.getMinutes();

    const toMin = (tStr) => {
      if (!tStr) return null;
      const parts = String(tStr).trim().split(":").map(Number);
      if (!parts.length || isNaN(parts[0])) return null;
      return (parts[0] || 0) * 60 + (parts[1] || 0);
    };

    const inRange = (val, start, end) => {
      if (start === null || end === null) return false;
      if (start <= end) return val >= start && val <= end;
      return val >= start || val <= end;
    };

    let matched = list.find((s) => {
      const start = toMin(s.jam_mulai_presensi);
      const end = toMin(s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target);
      return inRange(curMin, start, end);
    });

    if (!matched) {
      matched = list.find((s) => {
        const start = toMin(s.jam_mulai_presensi);
        const end = toMin(s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target);
        if (start === null || end === null) return false;
        return inRange(curMin, Math.max(0, start - 30), Math.min(1439, end + 45));
      });
    }

    if (!matched) {
      let bestDist = Infinity;
      for (const s of list) {
        const start = toMin(s.jam_mulai_presensi) ?? 0;
        const target = toMin(s.jam_target) ?? start;
        const end = toMin(s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target) ?? target;
        const distToWindow = curMin < start ? start - curMin : curMin > end ? curMin - end : 0;
        const dist = Math.min(distToWindow, Math.abs(curMin - target));
        if (dist < bestDist) {
          bestDist = dist;
          matched = s;
        }
      }
    }
    return matched || list[0];
  };

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const speakAttendance = (nama, status) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const text = `${nama}, ${status}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Load santri khusus berdasarkan kelas (Lazy load hemat memori & anti-lag)
  const loadSantriByKelas = async (targetKelas) => {
    if (!targetKelas || targetKelas === "Semua") {
      setSantriList([]);
      return;
    }
    setLoadingKelasSantri(true);
    try {
      const [res, resHaid] = await Promise.all([
        axios.get(`/api/santri/by-kelas/${encodeURIComponent(targetKelas)}`),
        axios.get("/api/haid/santriwati?tab=haid").catch(() => ({ data: { data: { santriwati: [] } } }))
      ]);
      const rows = res.data?.data || [];
      setSantriList(rows);
      const rawHaidList = resHaid.data?.data?.santriwati || [];
      const haidSet = new Set(rawHaidList.map((h) => String(h.id || h.santri_id)));
      // Tambahkan juga jika di object row ada is_haid = 1
      rows.forEach((r) => {
        if (Number(r.is_haid) === 1) haidSet.add(String(r.id));
      });
      setActiveHaidIds(haidSet);
    } catch (err) {
      console.warn("Gagal load santri by kelas:", err);
    } finally {
      setLoadingKelasSantri(false);
    }
  };

  // Fetch Santri, Presensi Logs & Shalat Berjamaah
  const fetchData = async () => {
    try {
      setLoading(true);

      let santriPromise;
      const savedKelas = selectedBerjamaahKelasRef.current || selectedBerjamaahKelas;
      if (savedKelas && savedKelas !== "Semua") {
        santriPromise = axios.get(`/api/santri/by-kelas/${encodeURIComponent(savedKelas)}`).catch(() => ({ data: { data: [] } }));
      } else {
        santriPromise = Promise.resolve({ data: { data: [] } });
      }

      const [resSantri, resAbs, resSesi, resKelas, resHaid] = await Promise.all([
        santriPromise,
        axios.get("/api/absensi/fingerprint?today=true&tipe=berjamaah").catch(() => ({ data: { data: [] } })),
        axios.get("/api/absensi/sesi").catch(() => ({ data: { data: [] } })),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
        axios.get("/api/haid/santriwati?tab=haid").catch(() => ({ data: { data: { santriwati: [] } } })),
      ]);

      const rawHaidList = resHaid.data?.data?.santriwati || [];
      const haidSet = new Set(rawHaidList.map((h) => String(h.id || h.santri_id)));

      const rawKelas = resKelas.data?.data || [];
      if (Array.isArray(rawKelas)) setKelasList(rawKelas);

      const isShalatWord = (str) =>
        /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(
          String(str || "")
        );

      const rawSesi = resSesi.data?.data || [];
      let listBerjamaah = [];
      if (Array.isArray(rawSesi) && rawSesi.length > 0) {
        rawSesi.forEach((s) => {
          if (isShalatWord(s.nama_sesi) || isShalatWord(s.kategori)) {
            listBerjamaah.push({
              id: s.id,
              nama: s.nama_sesi,
              kategori: s.kategori || "Shalat Berjamaah",
              tempat: s.keterangan || "Masjid Jami",
              tipe: "Berjamaah",
              jam_mulai_presensi: s.jam_mulai_presensi || null,
              jam_target: s.jam_target || null,
              jam_toleransi_telat: s.jam_toleransi_telat || null,
              jam_tutup_presensi: s.jam_tutup_presensi || null,
            });
          }
        });
      }
      if (listBerjamaah.length === 0) listBerjamaah = DAFTAR_BERJAMAAH_DEFAULT;
      setDaftarBerjamaah(listBerjamaah);

      const autoScheduled = detectActiveBerjamaahBySchedule(listBerjamaah);
      setSelectedBerjamaah((prev) => {
        if (autoScheduled) return autoScheduled;
        if (!prev || !listBerjamaah.some((k) => String(k.id) === String(prev.id))) {
          return listBerjamaah[0];
        }
        return prev;
      });

      if (resSantri.data && resSantri.data.data) {
        setSantriList(resSantri.data.data);
        resSantri.data.data.forEach((r) => {
          if (Number(r.is_haid) === 1) haidSet.add(String(r.id));
        });
      }
      setActiveHaidIds(haidSet);

      const serverLogs = resAbs.data && Array.isArray(resAbs.data.data) ? resAbs.data.data : [];
      setPresensiLogs(serverLogs);
    } catch (err) {
      console.warn("Gagal ambil data presensi berjamaah:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await axios.get("/api/absensi/fingerprint?today=true&tipe=berjamaah");
      if (res.data?.data && Array.isArray(res.data.data)) {
        setPresensiLogs(res.data.data);
      }
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem("epesantren_berjamaah_selected_kelas");
    } catch (e) {}
    fetchData();
  }, []);

  const getSantriKelasLabel = (s) => {
    if (!s) return "";
    return s.nama_kelas || s.tingkat_diniyah || "";
  };

  // Cek Log Presensi Khusus untuk Santri pada Sesi Shalat yang Aktif Hari Ini
  const getSantriCurrentLog = (santri) => {
    const today = getTodayDateStr();
    const activeShalatNama = (selectedBerjamaah?.nama || "").trim().toLowerCase();
    const activeShalatId = String(selectedBerjamaah?.id || "");

    return presensiLogs.find((l) => {
      const isToday = normalizeDateStr(l.tanggal) === today;
      const sameSantri =
        String(l.santri_id) === String(santri.id) ||
        (santri.nis && String(l.nis) === String(santri.nis));
      if (!isToday || !sameSantri) return false;

      // Filter ketat: Hanya cocok jika log tersebut adalah Shalat Berjamaah yang bersesuaian!
      const tipe = String(l.tipe_presensi || "").toLowerCase();
      const logKegiatan = String(l.kegiatan || l.nama_sesi || "").toLowerCase();

      // Tolak mentah-mentah jika log berasal dari Mengaji / Materi / bukan Shalat
      if (tipe === "kegiatan" && !logKegiatan.includes("shalat") && !logKegiatan.includes("sholat") && !logKegiatan.includes("subuh") && !logKegiatan.includes("dzuhur") && !logKegiatan.includes("ashar") && !logKegiatan.includes("maghrib") && !logKegiatan.includes("isya")) {
        return false;
      }

      // Harus cocok ID sesi atau nama shalat (contoh: "Shalat Ashar")
      const matchSesiId = String(l.sesi_id) === activeShalatId;
      const matchNama =
        logKegiatan === activeShalatNama ||
        (logKegiatan && activeShalatNama && (logKegiatan.includes(activeShalatNama) || activeShalatNama.includes(logKegiatan)));

      return matchSesiId || matchNama;
    });
  };

  const isSantriFemale = (santri) => {
    if (!santri) return false;
    const raw = String(santri.jk || santri.jenis_kelamin || "").trim().toLowerCase();
    return ["p", "perempuan", "putri", "akhwat", "female", "f"].includes(raw);
  };

  // Cek apakah santriwati sedang masa Haid (Udzur Syar'i)
  const isSantriInHaid = (santri) => {
    if (!santri || !isSantriFemale(santri)) return false;
    if (Number(santri.is_haid) === 1) return true;
    if (activeHaidIds.has(String(santri.id))) return true;
    return false;
  };

  // Cek Status Efektif (Otomatis 'Haid' jika sedang masa haid)
  const getSantriEffectiveStatus = (santri) => {
    const log = getSantriCurrentLog(santri);
    if (log) {
      return String(log.status_kehadiran || log.status || "").trim();
    }
    if (isSantriInHaid(santri)) {
      return "Haid";
    }
    return "";
  };

  // Catat Hadir Manual
  const recordAttendance = async (santri, status = "Hadir") => {
    if (!selectedBerjamaahKelas) {
      showError("Pilih Kelas", "Wajib memilih Kelas santri terlebih dahulu di dropdown atas sebelum mencatat presensi!");
      return;
    }

    // Proteksi Readonly: Santriwati haid terkunci, tidak bisa diubah ke Hadir/Sakit/Izin
    if (isSantriInHaid(santri) && status !== "Haid") {
      showError(
        "Terkunci: Santriwati Sedang Haid",
        `${santri.nama_santri} tercatat sedang dalam masa haid (udzur syar'i). Status otomatis Haid dan terkunci (readonly).`
      );
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const dateStr = getTodayDateStr();

    const targetKegiatan = selectedBerjamaah || daftarBerjamaah[0] || { id: "s-1", nama: "Shalat Berjamaah", tipe: "Berjamaah" };

    playBeep();
    speakAttendance(santri.nama_santri, status);

    const payload = {
      santri_id: santri.id,
      sesi_id: targetKegiatan.id,
      device_id: 1,
      tanggal: dateStr,
      waktu_scan: timeStr,
      status: status,
      status_kehadiran: status,
      metode_presensi: isSantriInHaid(santri) ? "Sistem Haid" : "Manual",
      metode_scan: isSantriInHaid(santri) ? "Sistem Haid" : "Manual",
      keterangan: selectedBerjamaahKelas ? `Kelas: ${selectedBerjamaahKelas}` : (santri.nama_kelas ? `Kelas: ${santri.nama_kelas}` : ""),
      nama_santri: santri.nama_santri,
      nama_kelas: santri.nama_kelas || selectedBerjamaahKelas || "",
      nama_sesi: targetKegiatan.nama,
      kegiatan: targetKegiatan.nama,
      tipe_presensi: "Berjamaah",
      tempat: targetKegiatan.tempat || "Masjid Jami",
    };

    const newRecord = { id: Date.now(), ...payload };
    setPresensiLogs((prev) => {
      const filtered = prev.filter((l) => {
        const sameSantri = String(l.santri_id) === String(santri.id) || (santri.nis && String(l.nis) === String(santri.nis));
        const sameDate = normalizeDateStr(l.tanggal) === dateStr;
        const sameKegiatan = !targetKegiatan?.id || String(l.sesi_id) === String(targetKegiatan.id) || String(l.kegiatan || l.nama_sesi || "").toLowerCase() === String(targetKegiatan.nama || "").toLowerCase();
        return !(sameSantri && sameDate && sameKegiatan);
      });
      return [newRecord, ...filtered];
    });

    axios.post("/api/absensi/fingerprint", payload).catch((err) => {
      console.warn("Gagal simpan presensi berjamaah ke server:", err);
    });
  };

  // Batalkan Presensi (Undo jika salah klik)
  const cancelAttendance = async (santri) => {
    if (isSantriInHaid(santri)) {
      showError(
        "Terkunci Udzur Haid",
        `Status haid ${santri.nama_santri} dikelola melalui menu Haid Santri. Tidak dapat dibatalkan manual dari presensi berjamaah.`
      );
      return;
    }
    const log = getSantriCurrentLog(santri);
    if (!log) return;

    setPresensiLogs((prev) => prev.filter((l) => l.id !== log.id));
    toastSuccess(`Presensi ${santri.nama_santri} dibatalkan`);

    if (log.id && typeof log.id === "number" && log.id < 1000000000000) {
      axios.delete(`/api/absensi/fingerprint/${log.id}`).catch(() => {});
    }
  };

  const hasFemaleInClass = santriList.some((s) => isSantriFemale(s));

  // Santri terfilter berdasarkan Pencarian & Status Efektif
  const filteredSantri = santriList.filter((s) => {
    const matchSearch =
      (s.nama_santri || "").toLowerCase().includes(searchManual.toLowerCase()) ||
      (s.nis || "").includes(searchManual);
    const effStatus = getSantriEffectiveStatus(s).toLowerCase();
    const hasRecord = !!getSantriCurrentLog(s) || isSantriInHaid(s);

    if (filterManualStatus === "Belum") return matchSearch && !hasRecord;
    if (filterManualStatus === "Hadir") return matchSearch && effStatus.includes("hadir");
    if (filterManualStatus === "Sakit") return matchSearch && effStatus.includes("sakit");
    if (filterManualStatus === "Izin") return matchSearch && effStatus.includes("izin");
    if (filterManualStatus === "Haid") return matchSearch && effStatus.includes("haid");
    return matchSearch;
  });

  const sessionTotal = santriList.length;
  const sessionHadirCount = santriList.filter((s) => {
    return getSantriEffectiveStatus(s).toLowerCase().includes("hadir");
  }).length;
  const sessionSakitCount = santriList.filter((s) => {
    return getSantriEffectiveStatus(s).toLowerCase().includes("sakit");
  }).length;
  const sessionIzinCount = santriList.filter((s) => {
    return getSantriEffectiveStatus(s).toLowerCase().includes("izin");
  }).length;
  const sessionHaidCount = santriList.filter((s) => {
    return getSantriEffectiveStatus(s).toLowerCase().includes("haid");
  }).length;

  const sessionSudahCount = santriList.filter((s) => !!getSantriCurrentLog(s) || isSantriInHaid(s)).length;
  const sessionBelumCount = sessionTotal - sessionSudahCount;
  const sessionPercent = sessionTotal > 0 ? Math.round((sessionHadirCount / sessionTotal) * 100) : 0;

  // Filter Riwayat Khusus Shalat Berjamaah Sesi Terpilih
  const filteredRiwayatLogs = React.useMemo(() => {
    const today = getTodayDateStr();
    const activeShalatNama = (selectedBerjamaah?.nama || "").trim().toLowerCase();
    const activeShalatId = String(selectedBerjamaah?.id || "");

    return presensiLogs.filter((log) => {
      // 1. Hari ini
      const isToday = normalizeDateStr(log.tanggal) === today;
      if (!isToday) return false;

      // 2. Wajib bertipe Berjamaah atau nama kegiatan mengandung shalat
      const tipe = String(log.tipe_presensi || "").toLowerCase();
      const logKegiatan = String(log.kegiatan || log.nama_sesi || "").toLowerCase();

      // Tolak jika bukan shalat
      if (tipe !== "berjamaah" && !logKegiatan.includes("shalat") && !logKegiatan.includes("sholat") && !logKegiatan.includes("subuh") && !logKegiatan.includes("dzuhur") && !logKegiatan.includes("ashar") && !logKegiatan.includes("maghrib") && !logKegiatan.includes("isya")) {
        return false;
      }

      // 3. Sesi Shalat yang Aktif
      if (selectedBerjamaah) {
        const matchId = String(log.sesi_id) === activeShalatId;
        const matchNama =
          logKegiatan === activeShalatNama ||
          (logKegiatan && activeShalatNama && (logKegiatan.includes(activeShalatNama) || activeShalatNama.includes(logKegiatan)));
        if (!matchId && !matchNama) return false;
      }

      // 4. Filter Kelas jika dipilih
      if (selectedBerjamaahKelas) {
        const targetKelas = selectedBerjamaahKelas.toLowerCase();
        const matchKet = String(log.keterangan || "").toLowerCase().includes(targetKelas);
        const matchKls = String(log.nama_kelas || "").toLowerCase().includes(targetKelas);
        const inSantriList = santriList.some(
          (s) =>
            (String(s.id) === String(log.santri_id) || (s.nis && String(s.nis) === String(log.nis))) &&
            getSantriKelasLabel(s).toLowerCase() === targetKelas
        );
        if (!inSantriList && !matchKet && !matchKls) return false;
      }

      return true;
    });
  }, [presensiLogs, selectedBerjamaah, selectedBerjamaahKelas, santriList]);

  if (loading) {
    return (
      <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
        <MobileLoadingState
          title="Menyiapkan Presensi Berjamaah..."
          subtitle="Sinkronisasi jadwal shalat & santri..."
          iconColor="#0284c7"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
      {/* Header Jadwal Shalat Berjamaah */}
      <div
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #075985 100%)",
          borderRadius: "18px",
          padding: "14px 16px",
          color: "#ffffff",
          marginBottom: "12px",
          boxShadow: "0 6px 18px -4px rgba(2, 132, 199, 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.86rem", fontWeight: 800 }}>🕌 Presensi Shalat Berjamaah</span>
          <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
            Manual Checklist
          </span>
        </div>

        {/* Dropdown Jadwal Shalat */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <select
            value={selectedBerjamaah?.id || ""}
            onChange={(e) => {
              const k = daftarBerjamaah.find((x) => String(x.id) === String(e.target.value));
              if (k) setSelectedBerjamaah(k);
            }}
            style={{
              width: "100%",
              padding: "9px 32px 9px 12px",
              borderRadius: "11px",
              border: "1px solid rgba(255, 255, 255, 0.32)",
              background: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              fontSize: "0.84rem",
              fontWeight: 800,
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            {daftarBerjamaah.map((k) => (
              <option key={k.id} value={k.id} style={{ color: "#0f172a", fontWeight: 700 }}>
                🕌 {k.nama} {k.jam_target ? `(${String(k.jam_target).substring(0, 5)})` : (k.jam_mulai_presensi ? `(${String(k.jam_mulai_presensi).substring(0, 5)})` : "")}
              </option>
            ))}
          </select>
          <ChevronDown size={15} color="#ffffff" style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* Dropdown Kelas Santri (Pilih Kelas Dulu Agar Loading Instan) */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <select
            value={selectedBerjamaahKelas}
            onChange={(e) => {
              const k = e.target.value;
              setSelectedBerjamaahKelas(k);
              loadSantriByKelas(k);
            }}
            style={{
              width: "100%",
              padding: "9px 32px 9px 12px",
              borderRadius: "11px",
              border: "1px solid rgba(255, 255, 255, 0.32)",
              background: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              fontSize: "0.84rem",
              fontWeight: 800,
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ color: "#0f172a", fontWeight: 700 }}>
              -- Pilih Kelas Santri --
            </option>
            {kelasList.map((k) => (
              <option key={k.id || k.nama_kelas} value={k.nama_kelas} style={{ color: "#0f172a", fontWeight: 700 }}>
                🏫 Kelas: {k.nama_kelas}
              </option>
            ))}
          </select>
          <ChevronDown size={15} color="#ffffff" style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* Progress Bar & Realtime Count */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "6px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", color: "#e0f2fe" }}>
            <span>
              📍 {selectedBerjamaah?.tempat || "Masjid Jami"}
              {selectedBerjamaahKelas ? ` • Kelas ${selectedBerjamaahKelas}` : ""}
            </span>
            <span style={{ fontWeight: 800, color: "#fef08a" }}>
              {selectedBerjamaahKelas ? `${sessionSudahCount} / ${sessionTotal} Santri Hadir (${sessionPercent}%)` : "Pilih Kelas Santri"}
            </span>
          </div>
          <div style={{ width: "100%", height: "4px", borderRadius: "999px", background: "rgba(255, 255, 255, 0.25)", overflow: "hidden" }}>
            <div style={{ width: `${sessionPercent}%`, height: "100%", borderRadius: "999px", background: "#22c55e", transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Tabs Mode (Hanya 2 Tab: Checklist Manual & Riwayat Shalat) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#ffffff", borderRadius: "13px", padding: "3.5px", marginBottom: "12px", gap: "6px", border: "1px solid #e2e8f0" }}>
        <button
          onClick={() => setActiveMode("manual")}
          style={{
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: activeMode === "manual" ? "#e0f2fe" : "transparent",
            color: activeMode === "manual" ? "#0284c7" : "#64748b",
            fontWeight: 800,
            fontSize: "0.74rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <ClipboardList size={15} /> Checklist Santri
        </button>

        <button
          onClick={() => {
            setActiveMode("riwayat");
            handleRefresh();
          }}
          style={{
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: activeMode === "riwayat" ? "#f3e8ff" : "transparent",
            color: activeMode === "riwayat" ? "#7c3aed" : "#64748b",
            fontWeight: 800,
            fontSize: "0.74rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <History size={15} /> Riwayat Shalat ({filteredRiwayatLogs.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CHECKLIST MANUAL SANTRI (UTAMA)
      ========================================================================= */}
      {activeMode === "manual" && (
        <div>
          {!selectedBerjamaahKelas ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1.5px dashed #cbd5e1",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "#0284c7",
                }}
              >
                <Building size={28} />
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", marginBottom: "6px" }}>
                Pilih Kelas Terlebih Dahulu
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5, maxWidth: "320px", margin: "0 auto" }}>
                Silakan pilih kelas santri pada dropdown di atas untuk memuat daftar santri secara instan dan melakukan presensi shalat.
              </div>
            </div>
          ) : loadingKelasSantri ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "36px 20px",
                textAlign: "center",
                border: "1px solid #e2e8f0",
              }}
            >
              <Loader2 size={30} className="animate-spin" color="#0284c7" style={{ margin: "0 auto 10px" }} />
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>
                Memuat Santri Kelas {selectedBerjamaahKelas}...
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                Hanya mengunduh data kelas ini (cepat & anti-lag)
              </div>
            </div>
          ) : (
            <div>
              {/* Modern Search Bar */}
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <input
                  type="text"
                  placeholder={`Cari nama santri atau NIS di Kelas ${selectedBerjamaahKelas || ""}...`}
                  value={searchManual}
                  onChange={(e) => setSearchManual(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 36px 10px 36px",
                    borderRadius: "14px",
                    border: "1.5px solid #e2e8f0",
                    background: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 8px -2px rgba(0,0,0,0.04)",
                    transition: "border 0.2s ease, box-shadow 0.2s ease",
                  }}
                />
                <Search size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                {searchManual && (
                  <button
                    onClick={() => setSearchManual("")}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "#f1f5f9",
                      color: "#64748b",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filter Status Kehadiran Chips (Horizontal Scrollable) */}
              <div
                style={{
                  display: "flex",
                  gap: "7px",
                  marginBottom: "12px",
                  overflowX: "auto",
                  paddingBottom: "4px",
                  scrollbarWidth: "none",
                }}
              >
                {[
                  { key: "Semua", label: "Semua", count: sessionTotal, color: "#0284c7" },
                  { key: "Belum", label: "Belum", count: sessionBelumCount, color: "#64748b" },
                  { key: "Hadir", label: "Hadir", count: sessionHadirCount, color: "#10b981" },
                  { key: "Sakit", label: "Sakit", count: sessionSakitCount, color: "#f59e0b" },
                  { key: "Izin", label: "Izin", count: sessionIzinCount, color: "#0284c7" },
                  ...(hasFemaleInClass ? [{ key: "Haid", label: "Haid", count: sessionHaidCount, color: "#ec4899" }] : []),
                ].map((st) => {
                  const isActive = filterManualStatus === st.key;
                  return (
                    <button
                      key={st.key}
                      onClick={() => setFilterManualStatus(st.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        border: isActive ? `1.5px solid ${st.color}` : "1px solid #e2e8f0",
                        background: isActive ? st.color : "#ffffff",
                        color: isActive ? "#ffffff" : "#475569",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: isActive ? `0 4px 12px -2px ${st.color}55` : "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <span>{st.label}</span>
                      <span
                        style={{
                          background: isActive ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                          color: isActive ? "#ffffff" : "#64748b",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          fontSize: "0.64rem",
                          fontWeight: 800,
                        }}
                      >
                        {st.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* List Santri Checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredSantri.map((s) => {
                  const log = getSantriCurrentLog(s);
                  const isFemale = isSantriFemale(s);
                  const inHaid = isSantriInHaid(s);
                  const curStatus = log 
                    ? String(log?.status_kehadiran || log?.status || "").trim() 
                    : (inHaid ? "Haid" : "");

                  const isHadir = !inHaid && /hadir/i.test(curStatus);
                  const isSakit = !inHaid && /sakit/i.test(curStatus);
                  const isIzin = !inHaid && /izin/i.test(curStatus);
                  const isHaid = inHaid || /haid/i.test(curStatus);

                  const avatarTheme = getAvatarTheme(s.nama_santri || "");

                  // Dynamic Card Border Accent & Background
                  let cardBorderLeft = "4px solid transparent";
                  let cardBg = "#ffffff";
                  let cardShadow = "0 3px 14px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)";

                  if (isHaid) {
                    cardBorderLeft = "4px solid #ec4899";
                    cardBg = "linear-gradient(to right, #fdf2f8 0%, #ffffff 40%)";
                    cardShadow = "0 4px 16px -2px rgba(236, 72, 153, 0.14)";
                  } else if (isHadir) {
                    cardBorderLeft = "4px solid #10b981";
                    cardBg = "linear-gradient(to right, #f0fdf4 0%, #ffffff 40%)";
                    cardShadow = "0 4px 16px -2px rgba(16, 185, 129, 0.12)";
                  } else if (isSakit) {
                    cardBorderLeft = "4px solid #f59e0b";
                    cardBg = "linear-gradient(to right, #fffbeb 0%, #ffffff 40%)";
                    cardShadow = "0 4px 16px -2px rgba(245, 158, 11, 0.12)";
                  } else if (isIzin) {
                    cardBorderLeft = "4px solid #0284c7";
                    cardBg = "linear-gradient(to right, #f0f9ff 0%, #ffffff 40%)";
                    cardShadow = "0 4px 16px -2px rgba(2, 132, 199, 0.12)";
                  }

                  return (
                    <div
                      key={s.id}
                      style={{
                        background: cardBg,
                        borderRadius: "16px",
                        padding: "12px 14px",
                        border: "1px solid #eef2f6",
                        borderLeft: cardBorderLeft,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        boxShadow: cardShadow,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Baris Atas: Avatar + Nama Santri + Badge Status */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                          {/* Avatar Inisial Elegan */}
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "13px",
                              background: inHaid ? "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)" : avatarTheme.bg,
                              color: inHaid ? "#be185d" : avatarTheme.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "0.85rem",
                              letterSpacing: "0.5px",
                              flexShrink: 0,
                              boxShadow: avatarTheme.shadow,
                              border: `1.5px solid ${inHaid ? "#f472b6" : avatarTheme.border}`,
                            }}
                          >
                            {inHaid ? "🌸" : getInitials(s.nama_santri)}
                          </div>

                          {/* Info Santri */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontWeight: 800,
                                  fontSize: "0.88rem",
                                  color: "#0f172a",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {s.nama_santri}
                              </span>
                              {isFemale && (
                                <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "1px 6px", borderRadius: "999px", background: inHaid ? "#fce7f3" : "#fdf2f8", color: inHaid ? "#be185d" : "#db2777", border: "1px solid #fbcfe8" }}>
                                  {inHaid ? "🌸 Udzur Haid" : "Akhwat"}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                              <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: "6px" }}>
                                NIS {s.nis || "-"}
                              </span>
                              <span style={{ fontSize: "0.66rem", color: "#94a3b8" }}>•</span>
                              <span style={{ fontSize: "0.66rem", color: "#64748b", fontWeight: 600 }}>
                                {getSantriKelasLabel(s) || selectedBerjamaahKelas || "Santri"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Pill Indicator */}
                        {curStatus ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "3px 9px",
                              borderRadius: "999px",
                              background: isHaid ? "#fce7f3" : isHadir ? "#dcfce7" : isSakit ? "#fef3c7" : "#e0f2fe",
                              color: isHaid ? "#be185d" : isHadir ? "#15803d" : isSakit ? "#b45309" : "#0369a1",
                              border: `1px solid ${isHaid ? "#fbcfe8" : isHadir ? "#86efac" : isSakit ? "#fde68a" : "#bae6fd"}`,
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: isHaid ? "#ec4899" : isHadir ? "#22c55e" : isSakit ? "#f59e0b" : "#0284c7",
                                boxShadow: `0 0 6px ${isHaid ? "#ec4899" : isHadir ? "#22c55e" : isSakit ? "#f59e0b" : "#0284c7"}`,
                              }}
                            />
                            {inHaid ? "🌸 Haid (Udzur)" : curStatus}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              color: "#94a3b8",
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              flexShrink: 0,
                            }}
                          >
                            Belum Presensi
                          </div>
                        )}
                      </div>

                      {/* Notifikasi Status Terkunci Khusus Haid */}
                      {inHaid && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 10px",
                            borderRadius: "10px",
                            background: "#fdf2f8",
                            border: "1px dashed #f472b6",
                            color: "#be185d",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ fontSize: "0.76rem" }}>🔒</span>
                          <span>Sedang masa Haid — Otomatis Haid, status lain readonly</span>
                        </div>
                      )}

                      {/* Baris Tombol Aksi Segmented Modern */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isFemale ? (log && !inHaid ? "repeat(4, 1fr) auto" : "repeat(4, 1fr)") : (log ? "repeat(3, 1fr) auto" : "repeat(3, 1fr)"),
                          gap: "6px",
                          marginTop: "2px",
                        }}
                      >
                        {/* Tombol Hadir: Terkunci (Readonly) saat Haid */}
                        <button
                          disabled={inHaid}
                          onClick={() => !inHaid && recordAttendance(s, "Hadir")}
                          title={inHaid ? "Terkunci: Santriwati sedang masa haid" : "Catat Hadir"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "8px 6px",
                            borderRadius: "10px",
                            border: isHadir ? "none" : "1px solid #e2e8f0",
                            background: isHadir ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#f8fafc",
                            color: isHadir ? "#ffffff" : inHaid ? "#94a3b8" : "#334155",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            cursor: inHaid ? "not-allowed" : "pointer",
                            opacity: inHaid ? 0.35 : 1,
                            pointerEvents: inHaid ? "none" : "auto",
                            filter: inHaid ? "grayscale(0.7)" : "none",
                            boxShadow: isHadir ? "0 4px 12px rgba(16, 185, 129, 0.35)" : "none",
                            transition: "all 0.18s ease",
                          }}
                        >
                          <CheckCircle2 size={13} strokeWidth={2.5} color={isHadir ? "#ffffff" : inHaid ? "#94a3b8" : "#10b981"} />
                          <span>Hadir</span>
                        </button>

                        {/* Tombol Sakit: Terkunci (Readonly) saat Haid */}
                        <button
                          disabled={inHaid}
                          onClick={() => !inHaid && recordAttendance(s, "Sakit")}
                          title={inHaid ? "Terkunci: Santriwati sedang masa haid" : "Catat Sakit"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "8px 6px",
                            borderRadius: "10px",
                            border: isSakit ? "none" : "1px solid #e2e8f0",
                            background: isSakit ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "#f8fafc",
                            color: isSakit ? "#ffffff" : inHaid ? "#94a3b8" : "#334155",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            cursor: inHaid ? "not-allowed" : "pointer",
                            opacity: inHaid ? 0.35 : 1,
                            pointerEvents: inHaid ? "none" : "auto",
                            filter: inHaid ? "grayscale(0.7)" : "none",
                            boxShadow: isSakit ? "0 4px 12px rgba(245, 158, 11, 0.35)" : "none",
                            transition: "all 0.18s ease",
                          }}
                        >
                          <AlertCircle size={13} strokeWidth={2.5} color={isSakit ? "#ffffff" : inHaid ? "#94a3b8" : "#f59e0b"} />
                          <span>Sakit</span>
                        </button>

                        {/* Tombol Izin: Terkunci (Readonly) saat Haid */}
                        <button
                          disabled={inHaid}
                          onClick={() => !inHaid && recordAttendance(s, "Izin")}
                          title={inHaid ? "Terkunci: Santriwati sedang masa haid" : "Catat Izin"}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "8px 6px",
                            borderRadius: "10px",
                            border: isIzin ? "none" : "1px solid #e2e8f0",
                            background: isIzin ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : "#f8fafc",
                            color: isIzin ? "#ffffff" : inHaid ? "#94a3b8" : "#334155",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            cursor: inHaid ? "not-allowed" : "pointer",
                            opacity: inHaid ? 0.35 : 1,
                            pointerEvents: inHaid ? "none" : "auto",
                            filter: inHaid ? "grayscale(0.7)" : "none",
                            boxShadow: isIzin ? "0 4px 12px rgba(2, 132, 199, 0.35)" : "none",
                            transition: "all 0.18s ease",
                          }}
                        >
                          <Clock size={13} strokeWidth={2.5} color={isIzin ? "#ffffff" : inHaid ? "#94a3b8" : "#0284c7"} />
                          <span>Izin</span>
                        </button>

                        {/* Pilihan Haid Khusus Santriwati: Otomatis Terpilih saat Haid */}
                        {isFemale && (
                          <button
                            onClick={() => recordAttendance(s, "Haid")}
                            title={inHaid ? "Otomatis Haid (Udzur Syar'i)" : "Catat Haid"}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "8px 6px",
                              borderRadius: "10px",
                              border: isHaid ? "none" : "1px solid #e2e8f0",
                              background: isHaid ? "linear-gradient(135deg, #ec4899 0%, #db2777 100%)" : "#f8fafc",
                              color: isHaid ? "#ffffff" : "#334155",
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              boxShadow: isHaid ? "0 4px 12px rgba(236, 72, 153, 0.35)" : "none",
                              transition: "all 0.18s ease",
                            }}
                          >
                            <Sparkles size={13} strokeWidth={2.5} color={isHaid ? "#ffffff" : "#ec4899"} />
                            <span>{inHaid ? "🌸 Haid" : "Haid"}</span>
                          </button>
                        )}

                        {/* Reset / Batal button: Disembunyikan saat santriwati sedang haid */}
                        {log && !inHaid && (
                          <button
                            onClick={() => cancelAttendance(s)}
                            title="Reset / Batalkan presensi"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "8px 10px",
                              borderRadius: "10px",
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#dc2626",
                              cursor: "pointer",
                              transition: "all 0.18s ease",
                            }}
                          >
                            <RotateCcw size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredSantri.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "36px 16px",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    Santri tidak ditemukan di kelas {selectedBerjamaahKelas} dengan filter ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: RIWAYAT SHALAT BERJAMAAH HARI INI
      ========================================================================= */}
      {activeMode === "riwayat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Header Ringkasan Riwayat */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a" }}>
                Riwayat: {selectedBerjamaah?.nama || "Shalat Berjamaah"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {selectedBerjamaahKelas ? `Kelas ${selectedBerjamaahKelas} • ` : ""}
                <strong>{filteredRiwayatLogs.length} Santri Hadir</strong>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: "#f1f5f9",
                border: "none",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#475569",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Memuat..." : "Segarkan"}
            </button>
          </div>

          {/* List Log Riwayat */}
          {filteredRiwayatLogs.map((log) => (
            <div
              key={log.id}
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#0f172a" }}>
                  {log.nama_santri}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                  <span style={{ color: "#0284c7", fontWeight: 700 }}>{log.kegiatan || selectedBerjamaah?.nama}</span>
                  {log.keterangan ? ` • ${log.keterangan}` : ""}
                  {" • "}
                  <span>{log.waktu_scan || "00:00"} WIB</span>
                </div>
              </div>
              {(() => {
                const st = String(log.status_kehadiran || log.status || "Hadir").trim();
                const isH = /hadir/i.test(st);
                const isS = /sakit/i.test(st);
                const isI = /izin/i.test(st);
                const isHd = /haid/i.test(st);
                return (
                  <span
                    style={{
                      background: isH ? "#ecfdf5" : isS ? "#fffbeb" : isI ? "#eff6ff" : isHd ? "#fdf2f8" : "#f1f5f9",
                      color: isH ? "#059669" : isS ? "#d97706" : isI ? "#0284c7" : isHd ? "#db2777" : "#475569",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                    }}
                  >
                    ✓ {st}
                  </span>
                );
              })()}
            </div>
          ))}

          {filteredRiwayatLogs.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                color: "#94a3b8",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <History size={32} color="#cbd5e1" style={{ marginBottom: "8px" }} />
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.86rem" }}>
                Belum Ada Kehadiran
              </div>
              <div style={{ fontSize: "0.72rem", marginTop: "4px" }}>
                Belum ada santri yang diabsen hadir untuk {selectedBerjamaah?.nama} hari ini.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
