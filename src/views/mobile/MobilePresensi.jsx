import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  QrCode,
  UserCheck,
  Search,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Trash2,
  Edit3,
  X,
  Save,
  Loader2,
  Sparkles,
  Users,
  Building,
  Volume2,
  VolumeX,
  ChevronDown,
  UploadCloud,
  FileCheck,
  Check,
  AlertTriangle,
  History,
  ClipboardList,
  Filter,
  Smile,
  Video,
  VideoOff,
  UserPlus,
  RotateCcw,
} from "lucide-react";
import {
  showSuccess,
  showError,
  toastSuccess,
  toastError,
  showConfirm,
} from "../../utils/alert.util";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  normalizeDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";
import MobileLoadingState from "../../components/MobileLoadingState";

const DAFTAR_BERJAMAAH_DEFAULT = [];

const DAFTAR_MENGAJI_DEFAULT = [];

const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return {
    dari: `${year}-${month}-01`,
    sampai: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
};

const normalizeDateStr = (rawDate) => {
  if (!rawDate) return "";
  if (typeof rawDate === "string") {
    return rawDate.split("T")[0].trim();
  }
  if (rawDate instanceof Date) {
    const year = rawDate.getFullYear();
    const month = String(rawDate.getMonth() + 1).padStart(2, "0");
    const day = String(rawDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(rawDate).split("T")[0].trim();
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

export default function MobilePresensi() {
  // Mode Utama: 'face' (Wajah AI), 'qr' (Scan Barcode/QR), 'manual', atau 'riwayat'
  const [activeMode, setActiveMode] = useState("face");

  // 2 Kategori Tab: 'berjamaah' (Shalat 5 Waktu) & 'mengaji' (Pegon & Master Kegiatan)
  const [activeKategori, setActiveKategori] = useState("berjamaah");
  const [daftarBerjamaah, setDaftarBerjamaah] = useState(
    DAFTAR_BERJAMAAH_DEFAULT,
  );
  const [daftarMengaji, setDaftarMengaji] = useState(DAFTAR_MENGAJI_DEFAULT);
  const [selectedBerjamaah, setSelectedBerjamaah] = useState(
    DAFTAR_BERJAMAAH_DEFAULT[0],
  );
  const [selectedMengaji, setSelectedMengaji] = useState(
    DAFTAR_MENGAJI_DEFAULT[0],
  );

  const selectedKegiatan =
    activeKategori === "berjamaah" ? selectedBerjamaah : selectedMengaji;
  const currentDaftarKegiatan =
    activeKategori === "berjamaah" ? daftarBerjamaah : daftarMengaji;

  // Data State
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [presensiLogs, setPresensiLogs] = useState([]);
  const [izinList, setIzinList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchManual, setSearchManual] = useState("");
  const [filterManualStatus, setFilterManualStatus] = useState("Semua");
  const [filterManualKelas, setFilterManualKelas] = useState("Semua");

  // Riwayat State
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [filterStatusRiwayat, setFilterStatusRiwayat] = useState("Semua");
  const defaultMonthRange = getCurrentMonthRange();
  const [filterTanggalDari, setFilterTanggalDari] = useState(defaultMonthRange.dari);
  const [filterTanggalSampai, setFilterTanggalSampai] = useState(defaultMonthRange.sampai);

  // Audio & Sound
  const [soundEnabled, setSoundEnabled] = useState(true);

  // QR Scanner State
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastScannedSantri, setLastScannedSantri] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const qrInstanceRef = useRef(null);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Face Recognition (Absen Wajah AI) Mobile State
  const [faceFacingMode, setFaceFacingMode] = useState("user"); // 'user' (depan) | 'environment' (belakang)
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceCameraError, setFaceCameraError] = useState("");
  const [faceStatusText, setFaceStatusText] = useState(
    "Arahkan wajah santri ke kamera",
  );
  const [faceDetected, setFaceDetected] = useState(false);
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    try {
      const saved = localStorage.getItem("epesantren_face_profiles");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Modal Daftarkan Wajah Santri Baru
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSantriId, setEnrollSantriId] = useState("");
  const [enrollSnapshot, setEnrollSnapshot] = useState(null);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollFilterUnregisteredOnly, setEnrollFilterUnregisteredOnly] =
    useState(true);

  // Face Recognition Refs
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const faceCooldownRef = useRef(false);
  const autoDetectFaceTickRef = useRef(0);
  const isDetectingRef = useRef(false);
  const matchedStreakRef = useRef({ id: null, count: 0 });

  const registeredFacesRef = useRef(registeredFaces);
  useEffect(() => {
    registeredFacesRef.current = registeredFaces;
  }, [registeredFaces]);

  const santriListRef = useRef(santriList);
  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  const presensiLogsRef = useRef(presensiLogs);
  useEffect(() => {
    presensiLogsRef.current = presensiLogs;
  }, [presensiLogs]);

  const selectedKegiatanRef = useRef(selectedKegiatan);
  useEffect(() => {
    selectedKegiatanRef.current = selectedKegiatan;
  }, [selectedKegiatan]);

  const daftarBerjamaahRef = useRef(daftarBerjamaah);
  useEffect(() => {
    daftarBerjamaahRef.current = daftarBerjamaah;
  }, [daftarBerjamaah]);

  const activeKategoriRef = useRef(activeKategori);
  useEffect(() => {
    activeKategoriRef.current = activeKategori;
  }, [activeKategori]);

  const selectedMengajiRef = useRef(selectedMengaji);
  useEffect(() => {
    selectedMengajiRef.current = selectedMengaji;
  }, [selectedMengaji]);

  // Helper: Otomatis pilih sesi Shalat Berjamaah sesuai jam saat ini & Setting Jadwal Shalat Berjamaah (kegiatan_sesi)
  const detectActiveBerjamaahBySchedule = (list = daftarBerjamaahRef.current) => {
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

    // 1. Prioritas Utama: Jam sekarang berada tepat di rentang jam_mulai_presensi s/d jam_tutup_presensi
    let matched = list.find((s) => {
      const start = toMin(s.jam_mulai_presensi);
      const end = toMin(
        s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target,
      );
      return inRange(curMin, start, end);
    });

    // 2. Prioritas Kedua: Buffer 30 menit sebelum jam_mulai s/d 45 menit setelah jam_tutup
    if (!matched) {
      matched = list.find((s) => {
        const start = toMin(s.jam_mulai_presensi);
        const end = toMin(
          s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target,
        );
        if (start === null || end === null) return false;
        return inRange(
          curMin,
          Math.max(0, start - 30),
          Math.min(1439, end + 45),
        );
      });
    }

    // 3. Prioritas Ketiga: Sesi Shalat Berjamaah dengan jarak waktu terdekat dari jam sekarang
    if (!matched) {
      let bestDist = Infinity;
      for (const s of list) {
        const start = toMin(s.jam_mulai_presensi) ?? 0;
        const target = toMin(s.jam_target) ?? start;
        const end =
          toMin(
            s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target,
          ) ?? target;
        const distToWindow =
          curMin < start ? start - curMin : curMin > end ? curMin - end : 0;
        const dist = Math.min(distToWindow, Math.abs(curMin - target));
        if (dist < bestDist) {
          bestDist = dist;
          matched = s;
        }
      }
    }

    return matched || list[0];
  };

  // Suppress harmless RenderedCameraImpl onabort warning from html5-qrcode
  useEffect(() => {
    const handleRejection = (e) => {
      const msg = String(e?.reason?.message || e?.reason || "");
      if (
        msg.includes("onabort") ||
        msg.includes("aborted") ||
        msg.includes("RenderedCameraImpl")
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  // Voice synthesizer announcement (Speech API)
  const speakAttendance = (nama, status) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const text = `${nama}, ${status}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Sound Beep Generator (Web Audio API)
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          1320,
          ctx.currentTime + 0.15,
        );
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {}
  };

  // Fetch Santri & Presensi Logs & Perizinan & Master Kegiatan
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSantri, resAbs, resIzin, resMateri, resSesi, resKelas] =
        await Promise.all([
          axios
            .get("/api/santri/for-presensi")
            .catch(() => axios.get("/api/santri?all=true")),
          axios
            .get("/api/absensi/fingerprint")
            .catch(() => ({ data: { data: [] } })),
          axios.get("/api/perizinan").catch(() => ({ data: { data: [] } })),
          axios
            .get("/api/materi-hafalan")
            .catch(() => ({ data: { data: [] } })),
          axios.get("/api/absensi/sesi").catch(() => ({ data: { data: [] } })),
          axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
        ]);

      const rawKelas = resKelas.data?.data || [];
      if (Array.isArray(rawKelas)) {
        setKelasList(rawKelas);
      }

      // Filter kata shalat untuk memisahkan Berjamaah vs Mengaji
      const isShalatWord = (str) =>
        /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(
          String(str || ""),
        );

      const rawMateri = resMateri.data?.data || [];
      const rawSesi = resSesi.data?.data || [];

      // 1. Kategori Berjamaah: Shalat 5 Waktu & Ibadah Berjamaah dari kegiatan_sesi (lengkap dengan jam jadwal)
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
              hari_aktif: s.hari_aktif || "Setiap Hari",
            });
          }
        });
      }
      if (listBerjamaah.length === 0) listBerjamaah = DAFTAR_BERJAMAAH_DEFAULT;
      setDaftarBerjamaah(listBerjamaah);
      daftarBerjamaahRef.current = listBerjamaah;
      const autoScheduledBerjamaah = detectActiveBerjamaahBySchedule(listBerjamaah);
      setSelectedBerjamaah((prev) => {
        if (autoScheduledBerjamaah) return autoScheduledBerjamaah;
        if (
          !prev ||
          !listBerjamaah.some((k) => String(k.id) === String(prev.id))
        ) {
          return listBerjamaah[0];
        }
        return prev;
      });

      // 2. Kategori Mengaji: Pegon & Master Kegiatan dari materi_hafalan
      let listMengaji = [];
      if (Array.isArray(rawMateri) && rawMateri.length > 0) {
        rawMateri.forEach((m, idx) => {
          if (!isShalatWord(m.nama_materi) && !isShalatWord(m.kategori)) {
            listMengaji.push({
              id: m.id || `m-${idx + 1}`,
              nama: m.nama_materi,
              kategori: m.kategori || "Kegiatan Mengaji",
              tempat:
                m.deskripsi || m.target_hafalan || "Gedung Madrasah & Aula",
              tipe: "Kegiatan",
            });
          }
        });
      }

      if (Array.isArray(rawSesi) && rawSesi.length > 0) {
        rawSesi.forEach((s, idx) => {
          if (!isShalatWord(s.nama_sesi) && !isShalatWord(s.kategori)) {
            const alreadyExists = listMengaji.some(
              (k) =>
                k.nama.trim().toLowerCase() ===
                (s.nama_sesi || "").trim().toLowerCase(),
            );
            if (!alreadyExists && s.nama_sesi) {
              listMengaji.push({
                id: s.id || `s-${idx + 1}`,
                nama: s.nama_sesi,
                kategori: s.kategori || "Kegiatan Sesi",
                tempat: s.keterangan || "Komplek Pesantren",
                tipe: "Kegiatan",
              });
            }
          }
        });
      }
      if (listMengaji.length === 0) listMengaji = DAFTAR_MENGAJI_DEFAULT;
      setDaftarMengaji(listMengaji);
      setSelectedMengaji((prev) => {
        if (
          !prev ||
          !listMengaji.some((k) => String(k.id) === String(prev.id))
        ) {
          return listMengaji[0];
        }
        return prev;
      });

      if (resSantri.data && resSantri.data.data) {
        const fetchedSantris = resSantri.data.data;
        setSantriList(fetchedSantris);

        // Sinkronisasi otomatis data foto santri dari database & bersihkan data dummy lawas
        try {
          const currentLocalProfiles = {
            ...(registeredFacesRef.current || {}),
          };
          const validIds = new Set(fetchedSantris.map((s) => String(s.id)));
          let profileChanged = false;

          for (const s of fetchedSantris) {
            const photoUrl = s.foto || s.foto_santri;
            const dbDesc = normalizeDescriptor(s.face_descriptor);
            if (photoUrl || dbDesc) {
              const existingDesc = currentLocalProfiles[s.id]?.descriptor;
              if (!currentLocalProfiles[s.id] || (!existingDesc && dbDesc)) {
                currentLocalProfiles[s.id] = {
                  santri_id: s.id,
                  id: s.id,
                  nama: s.nama_santri,
                  nama_santri: s.nama_santri,
                  nis: s.nis,
                  asrama: s.nama_asrama || "",
                  kamar: s.nama_kamar || "",
                  foto: photoUrl || currentLocalProfiles[s.id]?.foto || "",
                  descriptor: dbDesc || existingDesc || null,
                  registered_at: new Date().toISOString(),
                };
                profileChanged = true;
              }
            } else if (currentLocalProfiles[s.id] || currentLocalProfiles[String(s.id)]) {
              delete currentLocalProfiles[s.id];
              delete currentLocalProfiles[String(s.id)];
              profileChanged = true;
            }
          }

          if (profileChanged) {
            setRegisteredFaces(currentLocalProfiles);
            registeredFacesRef.current = currentLocalProfiles;
            try {
              const lightMap = {};
              Object.keys(currentLocalProfiles).forEach((k) => {
                const p = currentLocalProfiles[k];
                lightMap[k] = {
                  santri_id: p.santri_id,
                  id: p.santri_id,
                  nama: p.nama,
                  nama_santri: p.nama,
                  nis: p.nis,
                  asrama: p.asrama || "",
                  kamar: p.kamar || "",
                  descriptor: p.descriptor,
                  registered_at: p.registered_at,
                };
              });
              localStorage.setItem(
                "epesantren_face_profiles",
                JSON.stringify(lightMap),
              );
            } catch (eStorage) {}
          }
        } catch (eSync) {}
      }

      // 1. Data Izin dari MySQL Database
      const serverIzin =
        resIzin.data && Array.isArray(resIzin.data.data)
          ? resIzin.data.data
          : [];
      setIzinList(serverIzin);

      // 2. Data Presensi murni 100% dari MySQL Database (TANPA DUMMY/FAKE & TANPA RESURRECTION DARI LOCALSTORAGE)
      const serverLogs =
        resAbs.data && Array.isArray(resAbs.data.data) ? resAbs.data.data : [];
      setPresensiLogs(serverLogs);

      // Update cache lokal agar sama persis dengan MySQL database
      try {
        localStorage.setItem(
          "mobile_presensi_logs",
          JSON.stringify(serverLogs),
        );
        localStorage.setItem("mobile_izin_list", JSON.stringify(serverIzin));
      } catch (e) {}
    } catch (err) {
      console.warn("Gagal ambil data presensi dari MySQL:", err);
      // Fallback offline murni jika jaringan putus
      const saved = JSON.parse(
        localStorage.getItem("mobile_presensi_logs") || "[]",
      );
      setPresensiLogs(saved);
      try {
        const localIzin = JSON.parse(
          localStorage.getItem("mobile_izin_list") || "[]",
        );
        setIzinList(localIzin);
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Script Loader untuk Html5Qrcode
  const loadHtml5QrcodeScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
      const existing = document.getElementById("html5-qrcode-cdn");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Html5Qrcode));
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.id = "html5-qrcode-cdn";
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.async = true;
      script.onload = () => resolve(window.Html5Qrcode);
      script.onerror = () => reject(new Error("Gagal memuat library QR Code"));
      document.body.appendChild(script);
    });
  };

  // Start Camera QR Scanner
  const startScanner = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setCameraError("");

    try {
      const Html5QrcodeClass = await loadHtml5QrcodeScript();
      if (!Html5QrcodeClass) throw new Error("Library kamera tidak tersedia.");

      const container = document.getElementById("mobile-qr-reader");
      if (!container) return;

      if (qrInstanceRef.current) {
        try {
          if (qrInstanceRef.current.isScanning) {
            await qrInstanceRef.current.stop();
          }
        } catch (e) {}
        try {
          qrInstanceRef.current.clear();
        } catch (e) {}
        qrInstanceRef.current = null;
      }

      // Neutralize any old video abort listeners
      container.querySelectorAll("video").forEach((v) => {
        v.onabort = () => {};
        v.onerror = () => {};
      });

      const html5QrCode = new Html5QrcodeClass("mobile-qr-reader");
      qrInstanceRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => handleQrDecoded(decodedText),
        () => {}, // suppress frame drop errors
      );

      // Suppress onabort on video element generated by html5-qrcode
      setTimeout(() => {
        const vid = container.querySelector("video");
        if (vid) {
          vid.onabort = () => {};
          vid.onerror = () => {};
        }
      }, 100);

      setScannerActive(true);
    } catch (err) {
      const errStr = String(err?.message || err);
      if (errStr.includes("onabort") || errStr.includes("aborted")) {
        return;
      }
      console.warn("Kamera notice:", err);
      setCameraError(
        "Izin kamera belum aktif atau tidak ditemukan. Gunakan tombol upload QR atau presensi manual.",
      );
      setScannerActive(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  // Stop Camera Scanner gracefully (Release Hardware & Battery without onabort exception)
  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      const container = document.getElementById("mobile-qr-reader");
      if (container) {
        // Prevent onabort event from bubbling up to html5-qrcode
        container.querySelectorAll("video").forEach((v) => {
          v.onabort = () => {};
          v.onerror = () => {};
        });
      }

      if (qrInstanceRef.current) {
        const instance = qrInstanceRef.current;
        qrInstanceRef.current = null;

        try {
          if (instance.isScanning) {
            await instance.stop();
          }
        } catch (e) {}

        try {
          instance.clear();
        } catch (e) {}
      }

      if (container) {
        container.querySelectorAll("video").forEach((v) => {
          v.onabort = () => {};
          if (v.srcObject && typeof v.srcObject.getTracks === "function") {
            v.srcObject.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (e) {}
            });
            v.srcObject = null;
          }
        });
        container.innerHTML = "";
      }
    } catch (e) {
      // suppress
    } finally {
      setScannerActive(false);
      isStoppingRef.current = false;
    }
  };

  // ========================================================
  // FACE RECOGNITION (ABSEN WAJAH AI) ENGINE & HELPERS
  // ========================================================
  // Ekstraksi 16-Grid Biometrik Ter-Normalisasi (Tahan Variasi Cahaya / Shadow)
  const extractBiometricGridFromCanvas = (sourceCanvas) => {
    try {
      const c = document.createElement("canvas");
      c.width = 40;
      c.height = 40;
      const ctx = c.getContext("2d");
      ctx.drawImage(sourceCanvas, 0, 0, 40, 40);
      const imgData = ctx.getImageData(0, 0, 40, 40).data;

      let cells = [];
      let totalBrightness = 0;
      let totalR = 0,
        totalG = 0,
        totalB = 0;

      for (let gy = 0; gy < 4; gy++) {
        for (let gx = 0; gx < 4; gx++) {
          let bSum = 0;
          let rSum = 0,
            gSum = 0;
          for (let y = gy * 10; y < (gy + 1) * 10; y++) {
            for (let x = gx * 10; x < (gx + 1) * 10; x++) {
              const idx = (y * 40 + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              bSum += r * 0.299 + g * 0.587 + b * 0.114;
              rSum += r;
              gSum += g;
              totalR += r;
              totalG += g;
              totalB += b;
            }
          }
          const cellAvg = Math.round(bSum / 100);
          cells.push(cellAvg);
          totalBrightness += cellAvg;
        }
      }

      const meanBrightness = Math.round(totalBrightness / 16);
      const normalizedPattern = cells.map((v) => v - meanBrightness);

      const sumRGB = totalR + totalG + totalB || 1;
      const rRatio = Math.round((totalR / sumRGB) * 100);
      const gRatio = Math.round((totalG / sumRGB) * 100);

      return {
        rawGrid: cells,
        pattern: normalizedPattern,
        mean: meanBrightness,
        chroma: [rRatio, gRatio],
      };
    } catch (e) {
      return null;
    }
  };

  // Ekstraksi Asynchronous dari Snapshot / DataURL
  const extractFeatureFromDataUrl = (dataUrl) => {
    return new Promise((resolve) => {
      if (!dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          const iW = img.naturalWidth || img.width || 300;
          const iH = img.naturalHeight || img.height || 300;
          const fW = iW * 0.75;
          const fH = iH * 0.8;
          const fX = (iW - fW) / 2;
          const fY = (iH - fH) / 2;
          c.width = 100;
          c.height = 100;
          const ctx = c.getContext("2d");
          ctx.drawImage(img, fX, fY, fW, fH, 0, 0, 100, 100);
          resolve(extractBiometricGridFromCanvas(c));
        } catch (err) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };

  // Komparasi Skor Biometrik (Nilai kecil = identik, nilai besar = beda wajah)
  const compareBiometrics = (liveFeature, prof) => {
    if (!liveFeature || !prof) return 999;

    let profPattern = null;
    let profChroma = null;

    if (prof.biometricFeature?.pattern) {
      profPattern = prof.biometricFeature.pattern;
      profChroma = prof.biometricFeature.chroma;
    } else if (
      Array.isArray(prof.biometricGrid) &&
      prof.biometricGrid.length === 16
    ) {
      const raw = prof.biometricGrid;
      if (raw.every((v) => v === 0)) return 999;
      const mean = Math.round(raw.reduce((a, b) => a + b, 0) / 16);
      profPattern = raw.map((v) => v - mean);
    }

    if (!profPattern || profPattern.length !== 16) return 999;

    let patternDiff = 0;
    for (let i = 0; i < 16; i++) {
      patternDiff += Math.abs(liveFeature.pattern[i] - profPattern[i]);
    }
    const avgPatternDiff = patternDiff / 16;

    let chromaDiff = 0;
    if (liveFeature.chroma && profChroma) {
      chromaDiff =
        Math.abs(liveFeature.chroma[0] - profChroma[0]) +
        Math.abs(liveFeature.chroma[1] - profChroma[1]);
    }

    return avgPatternDiff + chromaDiff * 0.35;
  };

  // Inisialisasi Model AI face-api.js di latar belakang
  const [faceApiModelReady, setFaceApiModelReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    initFaceApiModels((msg) => {
      if (isMounted) setFaceStatusText(`🤖 ${msg}`);
    })
      .then(() => {
        if (isMounted) {
          setFaceApiModelReady(true);
          setFaceStatusText("✅ Model AI face-api Siap");
        }
      })
      .catch((err) => {
        console.warn("Face-api init error (fallback aktif):", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const startFaceCamera = async (facing = faceFacingMode) => {
    setFaceCameraError("");
    setIsFaceCameraActive(true);
    setFaceStatusText("Membuka kamera...");

    // 1. SINKRONISASI BIOMETRIK MYSQL DI BACKGROUND (PARALLEL, TIDAK MEMBLOKIR PEMBUKAAN KAMERA)
    axios
      .get(`/api/santri/with-face?_t=${Date.now()}`)
      .then((resFace) => {
        if (resFace.data?.data && Array.isArray(resFace.data.data)) {
          const freshList = resFace.data.data;
          const curMap = { ...(registeredFacesRef.current || {}) };
          const santriMap = {};
          (santriListRef.current || []).forEach((s) => {
            santriMap[s.id] = s;
          });

          freshList.forEach((s) => {
            const norm = normalizeDescriptor(s.face_descriptor);
            if (norm) {
              curMap[s.id] = {
                santri_id: s.id,
                id: s.id,
                nama: s.nama_santri,
                nama_santri: s.nama_santri,
                nis: s.nis,
                foto: s.foto,
                descriptor: norm,
              };
            }
            santriMap[s.id] = {
              ...(santriMap[s.id] || {}),
              ...s,
              face_descriptor: s.face_descriptor,
            };
          });

          setRegisteredFaces(curMap);
          registeredFacesRef.current = curMap;
          santriListRef.current = Object.values(santriMap);
        }
      })
      .catch(() => {});

    // 2. LANGSUNG AKSES HARDWARE KAMERA HP SECARA INSTAN TANPA MENUNGGU JARINGAN
    try {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach((track) => track.stop());
        faceStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 480, max: 640 },
          height: { ideal: 480, max: 640 },
          frameRate: { ideal: 24, max: 30 },
        },
        audio: false,
      });
      faceStreamRef.current = stream;

      let retries = 0;
      const attachVideo = () => {
        if (faceVideoRef.current) {
          faceVideoRef.current.srcObject = stream;
          faceVideoRef.current.onloadedmetadata = () => {
            faceVideoRef.current.play().catch(() => {});
            startFaceDetectionLoop();
          };
          faceVideoRef.current.play().catch(() => {});
          startFaceDetectionLoop();
        } else if (retries < 15) {
          retries++;
          setTimeout(attachVideo, 50);
        }
      };
      attachVideo();
    } catch (err) {
      console.warn("Mobile face camera error:", err.message);
      setFaceCameraError(
        "Kamera tidak dapat diakses atau izin belum diberikan.",
      );
      setIsFaceCameraActive(false);
    }
  };

  const stopFaceCamera = () => {
    if (faceLoopIntervalRef.current) {
      clearInterval(faceLoopIntervalRef.current);
      faceLoopIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((track) => track.stop());
      faceStreamRef.current = null;
    }
    setIsFaceCameraActive(false);
    setFaceStatusText("Kamera nonaktif");
    setFaceDetected(false);
  };

  const toggleFaceFacingMode = () => {
    const nextMode = faceFacingMode === "user" ? "environment" : "user";
    setFaceFacingMode(nextMode);
    if (activeMode === "face") {
      stopFaceCamera();
      setTimeout(() => startFaceCamera(nextMode), 200);
    }
  };

  // Capture current video frame to base64 snapshot (Preserves aspect ratio 1:1 square face crop)
  const captureFaceSnapshot = () => {
    const video = faceVideoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const size = Math.min(vW, vH);
    const sX = (vW - size) / 2;
    const sY = (vH - size) / 2;

    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (faceFacingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    // Crop center square to avoid stretched/gepeng image
    ctx.drawImage(video, sX, sY, size, size, 0, 0, 300, 300);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Ekstraksi Biometrik langsung dari live frame reticle kamera
  const extractCurrentLiveFeature = () => {
    const video = faceVideoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const boxW = Math.min(vW * 0.65, 260);
    const boxH = Math.min(vH * 0.72, 300);
    const boxX = (vW - boxW) / 2;
    const boxY = (vH - boxH) / 2;

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 40;
    sampleCanvas.height = 40;
    const sCtx = sampleCanvas.getContext("2d");
    sCtx.drawImage(video, boxX, boxY, boxW, boxH, 0, 0, 40, 40);
    return extractBiometricGridFromCanvas(sampleCanvas);
  };

  // Mobile Face Detection Reticle Loop
  const startFaceDetectionLoop = () => {
    if (faceLoopIntervalRef.current) clearInterval(faceLoopIntervalRef.current);

    let laserY = 0;
    let laserDir = 1;

    faceLoopIntervalRef.current = setInterval(async () => {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth)
        return;

      const ctx = canvas.getContext("2d");
      const w = (canvas.width = video.videoWidth || 640);
      const h = (canvas.height = video.videoHeight || 480);
      ctx.clearRect(0, 0, w, h);

      // Centered face box
      const boxW = Math.min(w * 0.65, 260);
      const boxH = Math.min(h * 0.72, 300);
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      // Scanning laser animation
      laserY += 4 * laserDir;
      if (laserY > boxH) {
        laserDir = -1;
        laserY = boxH;
      }
      if (laserDir < 0 && laserY < 0) {
        laserDir = 1;
        laserY = 0;
      }

      // HUD Reticle
      ctx.strokeStyle = faceCooldownRef.current ? "#10b981" : "#0284c7";
      ctx.lineWidth = 3;
      const corner = 24;

      // 4 Glowing Corners
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      // Laser Line
      ctx.beginPath();
      ctx.strokeStyle = faceCooldownRef.current
        ? "rgba(16, 185, 129, 0.85)"
        : "rgba(2, 132, 199, 0.75)";
      ctx.lineWidth = 2;
      ctx.moveTo(boxX + 4, boxY + laserY);
      ctx.lineTo(boxX + boxW - 4, boxY + laserY);
      ctx.stroke();

      if (faceCooldownRef.current) {
        setFaceStatusText("✅ Presensi Santri Tercatat!");
      } else {
        autoDetectFaceTickRef.current =
          (autoDetectFaceTickRef.current || 0) + 1;

        if (autoDetectFaceTickRef.current % 3 === 0) {
          if (isDetectingRef.current) return;
          isDetectingRef.current = true;
          try {
            let localMap = {};
            try {
              localMap = JSON.parse(
                localStorage.getItem("epesantren_face_profiles") || "{}",
              );
            } catch (e) {}

            const registeredList = [];
            const seenIds = new Set();

            (santriListRef.current || []).forEach((s) => {
              let desc =
                normalizeDescriptor(s.face_descriptor) ||
                normalizeDescriptor(localMap[s.id]?.descriptor) ||
                normalizeDescriptor(registeredFacesRef.current?.[s.id]?.descriptor);
              if (desc) {
                registeredList.push({
                  santri_id: s.id,
                  id: s.id,
                  nama_santri: s.nama_santri,
                  nama: s.nama_santri,
                  nis: s.nis,
                  descriptor: desc,
                  foto: s.foto || s.foto_santri,
                });
                seenIds.add(String(s.id));
              }
            });

            Object.values(registeredFacesRef.current || {}).forEach((p) => {
              const pId = String(p.santri_id || p.id || "");
              if (pId && !seenIds.has(pId)) {
                const desc = normalizeDescriptor(p.descriptor);
                if (desc) {
                  registeredList.push({ ...p, descriptor: desc });
                  seenIds.add(pId);
                }
              }
            });

            Object.values(localMap).forEach((p) => {
              const pId = String(p.santri_id || p.id || "");
              if (pId && !seenIds.has(pId)) {
                const desc = normalizeDescriptor(p.descriptor);
                if (desc) {
                  registeredList.push({ ...p, descriptor: desc });
                  seenIds.add(pId);
                }
              }
            });

            if (registeredList.length === 0) {
              setFaceDetected(false);
              setFaceStatusText("⚠️ Belum Ada Biometrik Wajah di Sistem (0 Profil)");
              return;
            }

            let matchedSantri = null;
            let displayName = "";

            if (isFaceModelReady()) {
              const faceRes = await detectFaceDescriptor(video);
              if (!faceRes) {
                matchedStreakRef.current = { id: null, count: 0 };
                setFaceDetected(false);
                setFaceStatusText("Arahkan wajah santri ke kamera...");
                return;
              }

              setFaceDetected(true);
              const matched = matchFaceDescriptor(
                faceRes.descriptor,
                registeredList,
                0.28,
              );

              if (matched && matched.error === "no_profiles") {
                matchedStreakRef.current = { id: null, count: 0 };
                setFaceStatusText("⚠️ Belum Ada Biometrik Wajah di Sistem (0 Profil)");
                return;
              }

              if (matched && !matched.error && (matched.santri_id || matched.id)) {
                const mId = String(matched.santri_id || matched.id);
                const dbSantri =
                  (santriListRef.current || []).find((s) => String(s.id) === mId) ||
                  matched;
                if (dbSantri) {
                  matchedSantri = dbSantri;
                  displayName =
                    dbSantri.nama_santri || dbSantri.nama || "Santri";
                }
              }

              // 1. TOLAK JIKA WAJAH BEDA / TIDAK COCOK DENGAN DATA SANTRI
              if (!matchedSantri) {
                if (matchedStreakRef.current.grace) {
                  matchedStreakRef.current = { id: null, count: 0, grace: false };
                } else if (matchedStreakRef.current.count > 0) {
                  matchedStreakRef.current.grace = true;
                }
                ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
                ctx.roundRect
                  ? ctx.roundRect(boxX, boxY - 30, boxW, 26, 6)
                  : ctx.rect(boxX, boxY - 30, boxW, 26);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(
                  "⛔ Wajah Belum Terdaftar",
                  boxX + boxW / 2,
                  boxY - 12,
                );

                const distInfo =
                  matched &&
                  typeof matched.bestDistance === "number" &&
                  matched.bestDistance < 900
                    ? ` (Jarak: ${matched.bestDistance.toFixed(2)} | Target: < ${matched.threshold?.toFixed(2) || "0.28"})`
                    : "";
                setFaceStatusText(`⛔ Belum Cocok${distInfo}`);
                return;
              }

              // Verifikasi frame konsekutif: jika skor meyakinkan (< 0.22), langsung diverifikasi
              if (matchedStreakRef.current.id === matchedSantri.id) {
                matchedStreakRef.current.count += 1;
                matchedStreakRef.current.grace = false;
              } else {
                matchedStreakRef.current = {
                  id: matchedSantri.id,
                  count: 1,
                  grace: false,
                };
              }

              const isSuperMatch =
                matched.distance && matched.distance < 0.22;
              if (matchedStreakRef.current.count < 2 && !isSuperMatch) {
                setFaceStatusText(`Memverifikasi: ${displayName}...`);
                return;
              }
            } else {
              setFaceDetected(false);
              setFaceStatusText("Memuat model pengenalan wajah AI...");
              return;
            }

              // 2. PILIH SESI KEGIATAN SESUAI KATEGORI AKTIF (BERJAMAAH VS MENGAJI)
              const todayStr = getTodayDateStr();
              const curKategori = activeKategoriRef.current || activeKategori;
              let curKegiatan = selectedKegiatanRef.current;

              if (curKategori === "berjamaah") {
                const autoBerjamaah = detectActiveBerjamaahBySchedule(
                  daftarBerjamaahRef.current,
                );
                if (autoBerjamaah) {
                  curKegiatan = autoBerjamaah;
                  setSelectedBerjamaah(autoBerjamaah);
                  selectedKegiatanRef.current = autoBerjamaah;
                }
              } else {
                // Kategori Mengaji: gunakan sesi kitab/materi mengaji yang dipilih user
                curKegiatan = selectedMengajiRef.current || selectedKegiatanRef.current || daftarMengaji[0];
              }

              const isAlreadyAttended = (presensiLogsRef.current || []).some(
                (item) => {
                  const sameSantri =
                    (item.santri_id != null &&
                      matchedSantri.id != null &&
                      String(item.santri_id) === String(matchedSantri.id)) ||
                    (item.nis &&
                      matchedSantri.nis &&
                      String(item.nis).trim() ===
                        String(matchedSantri.nis).trim()) ||
                    (item.nama_santri &&
                      item.nama_santri.trim().toLowerCase() ===
                        displayName.trim().toLowerCase());
                  const sameSesi =
                    (item.sesi_id != null &&
                      curKegiatan?.id != null &&
                      String(item.sesi_id) === String(curKegiatan.id)) ||
                    (item.kegiatan &&
                      curKegiatan?.nama &&
                      item.kegiatan.trim().toLowerCase() ===
                        curKegiatan.nama.trim().toLowerCase()) ||
                    (item.nama_sesi &&
                      curKegiatan?.nama &&
                      item.nama_sesi.trim().toLowerCase() ===
                        curKegiatan.nama.trim().toLowerCase());
                  const itemTgl = normalizeDateStr(item.tanggal);
                  const sameTgl = !itemTgl || itemTgl === todayStr;
                  return sameSantri && sameSesi && sameTgl;
                },
              );

              if (isAlreadyAttended) {
                ctx.fillStyle = "rgba(245, 158, 11, 0.95)";
                ctx.roundRect
                  ? ctx.roundRect(boxX, boxY - 30, boxW, 26, 6)
                  : ctx.rect(boxX, boxY - 30, boxW, 26);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(
                  `⚠️ ${displayName} (Sudah Hadir)`,
                  boxX + boxW / 2,
                  boxY - 12,
                );

                setFaceStatusText(
                  `⚠️ ${displayName} sudah tercatat hadir pada ${curKegiatan?.nama || "kegiatan ini"}`,
                );
                return;
              }

              // 3. WAJAH COCOK & BELUM HADIR -> CATAT PRESENSI OTOMATIS
              ctx.fillStyle = "rgba(16, 185, 129, 0.95)";
              ctx.roundRect
                ? ctx.roundRect(boxX, boxY - 30, boxW, 26, 6)
                : ctx.rect(boxX, boxY - 30, boxW, 26);
              ctx.fill();
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 12px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(`✅ ${displayName}`, boxX + boxW / 2, boxY - 12);

              setFaceStatusText(`✅ Wajah Terverifikasi AI: ${displayName} (${curKegiatan?.nama || "Presensi"})`);

              if (!faceCooldownRef.current) {
                faceCooldownRef.current = true;
                setTimeout(() => {
                  faceCooldownRef.current = false;
                }, 2600);

                const snap = captureFaceSnapshot();
                // Update ref logs langsung seketika (synchronous) agar frame berikutnya langsung tolak
                const instantRecord = {
                  id: Date.now(),
                  santri_id: matchedSantri.id,
                  nama_santri: matchedSantri.nama_santri || displayName,
                  nis: matchedSantri.nis,
                  sesi_id: curKategori === "berjamaah" ? curKegiatan?.id : null,
                  nama_sesi: curKegiatan?.nama,
                  kegiatan: curKegiatan?.nama,
                  tipe_presensi: curKategori === "mengaji" ? "Kegiatan" : "Berjamaah",
                  tanggal: todayStr,
                  waktu_scan: new Date().toTimeString().split(" ")[0],
                  status: "Hadir",
                  status_kehadiran: "Hadir",
                  metode_presensi: "Wajah AI",
                  metode_scan: "Wajah AI",
                };
                presensiLogsRef.current = [
                  instantRecord,
                  ...(presensiLogsRef.current || []),
                ];

                recordAttendance(
                  matchedSantri,
                  "Hadir",
                  "Kamera Wajah AI (Otomatis)",
                  "",
                  snap,
                );
                setLastScannedSantri({ ...matchedSantri, snapshot: snap });
                toastSuccess(`Presensi Wajah AI: ${displayName} (${curKegiatan?.nama || "Hadir"})`);
              }
            } catch (err) {
              console.warn("Face loop error:", err);
            } finally {
              isDetectingRef.current = false;
            }
          }
        }
      }, 150);
  };

  // Simpan / Daftarkan Wajah Santri Mobile (Dengan Face-api Descriptor + Fallback)
  const handleSaveEnrollFace = async () => {
    if (!enrollSantriId) {
      showError(
        "Pilih Santri",
        "Silakan pilih nama santri yang akan didaftarkan.",
      );
      return;
    }
    const found = santriList.find(
      (s) => String(s.id) === String(enrollSantriId),
    );
    if (!found) {
      showError(
        "Santri Tidak Ditemukan",
        "Data santri yang dipilih tidak valid.",
      );
      return;
    }

    const snap = enrollSnapshot || captureFaceSnapshot();
    if (!snap) {
      showError(
        "Gagal Mengambil Foto",
        "Nyalakan kamera live dan pastikan wajah santri terlihat jelas.",
      );
      return;
    }

    const isAlreadyEnrolled = !!registeredFaces[found.id];

    // Ekstraksi 128-D Deep Learning Descriptor via face-api.js
    let descriptor = null;
    if (isFaceModelReady()) {
      try {
        const liveRes = await detectFaceDescriptor(faceVideoRef.current);
        if (liveRes) descriptor = liveRes.descriptor;
      } catch (e) {}
      if (!descriptor && snap) {
        try {
          descriptor = await extractDescriptorFromDataUrl(snap);
        } catch (e) {}
      }
    }

    // Ekstraksi fitur biometrik fallback (matrix kontras)
    let feature = extractCurrentLiveFeature();
    if (!feature && snap) {
      feature = await extractFeatureFromDataUrl(snap);
    }

    const updatedProfiles = {
      ...registeredFaces,
      [found.id]: {
        santri_id: found.id,
        nama: found.nama_santri,
        nis: found.nis,
        asrama: found.nama_asrama || "",
        kamar: found.nama_kamar || "",
        foto: snap,
        descriptor: descriptor,
        biometricGrid: feature ? feature.rawGrid : [],
        biometricFeature: feature,
        registered_at: new Date().toISOString(),
      },
    };

    setRegisteredFaces(updatedProfiles);
    try {
      localStorage.setItem(
        "epesantren_face_profiles",
        JSON.stringify(updatedProfiles),
      );
    } catch (e) {}

    if (isAlreadyEnrolled) {
      toastSuccess(
        "Profil Wajah Diperbarui!",
        `Foto wajah ${found.nama_santri} berhasil diperbarui.`,
      );
    } else {
      toastSuccess(
        "Wajah Santri Berhasil Didaftarkan!",
        `${found.nama_santri} kini aktif untuk presensi wajah AI.`,
      );
    }

    setIsEnrollModalOpen(false);
    setEnrollSnapshot(null);

    // Cari santri berikutnya yang BELUM memiliki foto untuk memudahkan input beruntun
    const nextUnregistered = santriList.find(
      (s) => String(s.id) !== String(found.id) && !updatedProfiles[s.id],
    );
    if (nextUnregistered) {
      setEnrollSantriId(String(nextUnregistered.id));
    }

    // Catat presensi saat pendaftaran berhasil
    recordAttendance(found, "Hadir", "Pendaftaran & Absen Wajah AI", "", snap);
    setLastScannedSantri({ ...found, snapshot: snap });
  };

  // Validasi Pemindaian Wajah di Kamera HP (Model AI Face-api Ketat)
  const handleScanFaceLive = async () => {
    if (!isFaceCameraActive) {
      showError("Kamera Belum Aktif", "Nyalakan kamera wajah terlebih dahulu.");
      return;
    }

    let localMap = {};
    try {
      localMap = JSON.parse(
        localStorage.getItem("epesantren_face_profiles") || "{}",
      );
    } catch (e) {}

    const registeredList = [];
    const seenIds = new Set();

    (santriListRef.current || []).forEach((s) => {
      let desc =
        normalizeDescriptor(s.face_descriptor) ||
        normalizeDescriptor(localMap[s.id]?.descriptor) ||
        normalizeDescriptor(registeredFacesRef.current?.[s.id]?.descriptor);
      if (desc) {
        registeredList.push({
          santri_id: s.id,
          id: s.id,
          nama_santri: s.nama_santri,
          nama: s.nama_santri,
          nis: s.nis,
          descriptor: desc,
          foto: s.foto || s.foto_santri,
        });
        seenIds.add(String(s.id));
      }
    });

    Object.values(registeredFacesRef.current || {}).forEach((p) => {
      const pId = String(p.santri_id || p.id || "");
      if (pId && !seenIds.has(pId)) {
        const desc = normalizeDescriptor(p.descriptor);
        if (desc) {
          registeredList.push({ ...p, descriptor: desc });
          seenIds.add(pId);
        }
      }
    });

    Object.values(localMap).forEach((p) => {
      const pId = String(p.santri_id || p.id || "");
      if (pId && !seenIds.has(pId)) {
        const desc = normalizeDescriptor(p.descriptor);
        if (desc) {
          registeredList.push({ ...p, descriptor: desc });
          seenIds.add(pId);
        }
      }
    });

    if (registeredList.length === 0) {
      playBeep(false);
      speakAttendance(
        "Wajah belum terdaftar",
        "Silakan daftarkan wajah di Master Santri",
      );
      showError(
        "Wajah Belum Terdaftar!",
        "Belum ada data wajah santri yang didaftarkan. Silakan daftarkan foto wajah santri di menu Master Santri.",
      );
      return;
    }

    if (!isFaceModelReady()) {
      showError(
        "Model AI Memuat",
        "Model pengenalan wajah AI sedang diunduh, mohon tunggu sebentar...",
      );
      return;
    }

    const video = faceVideoRef.current;
    const snap = captureFaceSnapshot();
    if (!video || !snap) {
      showError("Kamera Tidak Siap", "Pastikan santri menghadap kamera live.");
      return;
    }

    try {
      const faceRes = await detectFaceDescriptor(video);
      if (!faceRes) {
        showError(
          "Wajah Tidak Terdeteksi",
          "Wajah santri tidak terdeteksi di kamera. Posisikan wajah tegak di dalam kotak pandu.",
        );
        return;
      }

      // Ambang batas optimal akurat 0.28
      const matched = matchFaceDescriptor(
        faceRes.descriptor,
        registeredList,
        0.28,
      );
      if (matched && !matched.error && (matched.santri_id || matched.id)) {
        const mId = String(matched.santri_id || matched.id);
        const matchedSantri = (santriListRef.current || []).find(
          (s) => String(s.id) === mId,
        ) || matched;
        if (matchedSantri) {
          recordAttendance(
            matchedSantri,
            "Hadir Tepat Waktu",
            "Kamera Wajah AI (Manual Scan)",
            "",
            snap,
          );
          setLastScannedSantri({ ...matchedSantri, snapshot: snap });
          toastSuccess(`Wajah Dikenali: ${matchedSantri.nama_santri || matchedSantri.nama}`);
          return;
        }
      }

      playBeep(false);
      speakAttendance("Wajah belum terdaftar", "Wajah tidak cocok");
      showError(
        "⛔ Wajah Belum Terdaftar / Tidak Cocok!",
        "Wajah di depan kamera tidak cocok dengan profil santri manapun yang terdaftar di sistem.",
      );
    } catch (err) {
      showError(
        "Gagal Memindai",
        err.message || "Terjadi kesalahan pemindaian wajah",
      );
    }
  };

  // Trigger Absen Wajah Santri Langsung / Cepat
  const triggerFaceAttendanceForSantri = (santri) => {
    if (faceCooldownRef.current) return;
    faceCooldownRef.current = true;
    setTimeout(() => {
      faceCooldownRef.current = false;
    }, 2400);

    const snap = captureFaceSnapshot();
    recordAttendance(santri, "Hadir Tepat Waktu", "Scan Wajah AI", "", snap);
    setLastScannedSantri({ ...santri, snapshot: snap });
    toastSuccess(`Presensi Wajah: ${santri.nama_santri}`);
  };

  // Switch Tab Helper with Immediate Camera Release
  const handleSwitchTab = async (newMode) => {
    if (newMode === activeMode) return;
    if (activeMode === "qr") {
      await stopScanner();
    } else if (activeMode === "face") {
      stopFaceCamera();
    }
    setActiveMode(newMode);
  };

  // Toggle mode tab & nyalakan kamera seketika setelah data siap
  useEffect(() => {
    if (loading) return; // Mencegah kamera dipicu saat elemen DOM video belum ter-render (anti blank hitam)

    if (activeMode === "qr") {
      stopFaceCamera();
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => clearTimeout(timer);
    } else if (activeMode === "face") {
      stopScanner();
      const timer = setTimeout(() => {
        startFaceCamera(faceFacingMode);
      }, 60);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      stopFaceCamera();
    }
  }, [activeMode, loading]);

  // Hemat baterai: Matikan hardware kamera saat aplikasi diminimalkan / layar mati
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopScanner();
        stopFaceCamera();
      } else if (activeMode === "qr") {
        startScanner();
      } else if (activeMode === "face") {
        startFaceCamera(faceFacingMode);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeMode, faceFacingMode]);

  // Clean up scanners on unmount
  useEffect(() => {
    return () => {
      stopScanner();
      stopFaceCamera();
    };
  }, []);

  // Process decoded QR text
  const handleQrDecoded = (decodedText) => {
    if (scanCooldown) return;

    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 2200);

    const raw = String(decodedText).trim();
    let matchedSantri = null;

    // 1. Coba cocokkan dengan NIS
    matchedSantri = santriList.find((s) => String(s.nis).trim() === raw);

    // 2. Coba cocokkan dengan ID jika format angka
    if (!matchedSantri) {
      matchedSantri = santriList.find((s) => String(s.id) === raw);
    }

    // 3. Coba parse JSON jika barcode bawa payload objek
    if (!matchedSantri && (raw.startsWith("{") || raw.includes("nis"))) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.nis)
          matchedSantri = santriList.find(
            (s) => String(s.nis).trim() === String(parsed.nis).trim(),
          );
        if (!matchedSantri && parsed.id)
          matchedSantri = santriList.find((s) => s.id === parsed.id);
      } catch (e) {}
    }

    // 4. Coba cocokkan dengan nama
    if (!matchedSantri) {
      matchedSantri = santriList.find((s) =>
        s.nama_santri.toLowerCase().includes(raw.toLowerCase()),
      );
    }

    if (matchedSantri) {
      playBeep();
      setLastScannedSantri(matchedSantri);
      recordAttendance(matchedSantri, "Hadir Tepat Waktu", "QR Code");
      toastSuccess(`Presensi Masuk: ${matchedSantri.nama_santri}`);
    } else {
      showError(
        "QR Code Tidak Dikenali",
        `Konten QR: "${raw}". Data santri tidak ditemukan.`,
      );
    }
  };

  // Simpan record presensi ke backend & localStorage (menggunakan tanggal berjalan)
  const recordAttendance = async (
    santri,
    status = "Hadir Tepat Waktu",
    metode = "QR Code",
    ket = "",
    snapshot = null,
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const dateStr = getTodayDateStr();

    // PILIH KATEGORI & JADWAL SESUAI TAB AKTIF (BERJAMAAH VS MENGAJI)
    const targetKategori = activeKategoriRef.current || activeKategori;
    let targetKegiatan = targetKategori === "berjamaah" ? selectedBerjamaah : (selectedMengajiRef.current || selectedMengaji);

    if (targetKategori === "berjamaah") {
      const autoBerjamaah = detectActiveBerjamaahBySchedule(
        daftarBerjamaahRef.current,
      );
      if (autoBerjamaah) {
        targetKegiatan = autoBerjamaah;
        setSelectedBerjamaah(autoBerjamaah);
        selectedKegiatanRef.current = autoBerjamaah;
      }
    } else {
      // Pastikan kategori Mengaji tetap utuh sesuai kegiatan mengaji yang dipilih user
      targetKegiatan = selectedMengajiRef.current || selectedMengaji || selectedKegiatan || daftarMengaji[0];
    }

    if (!targetKegiatan) {
      targetKegiatan = targetKategori === "mengaji"
        ? (daftarMengaji[0] || { id: "m-1", nama: "Kegiatan Mengaji", tipe: "Kegiatan" })
        : (daftarBerjamaah[0] || { id: 1, nama: "Shalat Berjamaah", tipe: "Berjamaah" });
    }

    // 1. VALIDASI DOUBLE PRESENSI: Cek apakah santri sudah tercatat di sesi & tanggal ini
    const existingLog = presensiLogs.find((item) => {
      const sameSantri =
        (item.santri_id != null &&
          santri.id != null &&
          String(item.santri_id) === String(santri.id)) ||
        (item.nis &&
          santri.nis &&
          String(item.nis).trim() === String(santri.nis).trim()) ||
        (item.nama_santri &&
          santri.nama_santri &&
          item.nama_santri.trim().toLowerCase() ===
            santri.nama_santri.trim().toLowerCase());
      const sameSesi =
        (item.sesi_id != null &&
          targetKegiatan.id != null &&
          String(item.sesi_id) === String(targetKegiatan.id)) ||
        (item.kegiatan &&
          targetKegiatan.nama &&
          item.kegiatan.trim().toLowerCase() ===
            targetKegiatan.nama.trim().toLowerCase()) ||
        (item.nama_sesi &&
          targetKegiatan.nama &&
          item.nama_sesi.trim().toLowerCase() ===
            targetKegiatan.nama.trim().toLowerCase());
      const itemTgl = normalizeDateStr(item.tanggal);
      const sameTgl = !itemTgl || itemTgl === dateStr;
      return sameSantri && sameSesi && sameTgl;
    });

    if (existingLog && !ket.includes("Override_Manual")) {
      playBeep(false);
      speakAttendance(santri.nama_santri, "Sudah presensi sebelumnya");

      setLastScannedSantri({
        ...santri,
        snapshot: snapshot || existingLog.foto_bukti,
        isDuplicate: true,
        waktu_scan: existingLog.waktu_scan,
        notice: `Santri ini SUDAH hadir pada kegiatan "${targetKegiatan.nama}" pukul ${formatCompactTime(existingLog.waktu_scan, existingLog.tanggal)}.`,
      });

      if (!metode.includes("Otomatis")) {
        showError(
          "Presensi Ganda (Double Data)!",
          `${santri.nama_santri} (NIS: ${santri.nis}) sudah tercatat hadir pada sesi "${targetKegiatan.nama}" pukul ${formatCompactTime(existingLog.waktu_scan, existingLog.tanggal)}. Data tidak diduplikasi.`,
        );
      }
      return;
    }

    playBeep(true);
    speakAttendance(santri.nama_santri, status);

    const isFaceScan = typeof metode === 'string' && (metode.includes('Wajah') || metode.includes('Face') || metode.includes('AI'));

    const payload = {
      santri_id: santri.id,
      sesi_id: targetKegiatan.id,
      device_id: 1,
      tanggal: dateStr,
      waktu_scan: timeStr,
      status: status,
      status_kehadiran: status,
      metode_presensi: metode,
      metode_scan: metode,
      keterangan: ket,
      nama_santri: santri.nama_santri,
      nama_sesi: targetKegiatan.nama,
      kegiatan: targetKegiatan.nama,
      tipe_presensi: targetKategori === "berjamaah" ? "Berjamaah" : "Kegiatan",
      auto_jadwal_berjamaah: isFaceScan && targetKategori === "berjamaah",
      tempat: targetKegiatan.tempat,
      foto_bukti: snapshot || santri.foto || null,
    };

    // Optimistic UI update dengan pencegahan duplikasi
    const newRecord = {
      id: Date.now(),
      ...payload,
    };

    setPresensiLogs((prev) => {
      // Cari apakah santri ini sudah tercatat pada hari & sesi kegiatan yang sama
      const existingIndex = prev.findIndex((item) => {
        const sameSantri =
          (item.santri_id != null &&
            santri.id != null &&
            String(item.santri_id) === String(santri.id)) ||
          (item.nis &&
            santri.nis &&
            String(item.nis).trim() === String(santri.nis).trim()) ||
          (item.nama_santri &&
            santri.nama_santri &&
            item.nama_santri.trim().toLowerCase() ===
              santri.nama_santri.trim().toLowerCase());
        const sameSesi =
          (item.sesi_id != null &&
            targetKegiatan.id != null &&
            String(item.sesi_id) === String(targetKegiatan.id)) ||
          (item.kegiatan &&
            targetKegiatan.nama &&
            item.kegiatan.trim().toLowerCase() ===
              targetKegiatan.nama.trim().toLowerCase()) ||
          (item.nama_sesi &&
            targetKegiatan.nama &&
            item.nama_sesi.trim().toLowerCase() ===
              targetKegiatan.nama.trim().toLowerCase());
        const itemTgl = normalizeDateStr(item.tanggal);
        const sameTgl = !itemTgl || itemTgl === dateStr;

        return sameSantri && sameSesi && sameTgl;
      });

      let updated;
      if (existingIndex !== -1) {
        // UPDATE status record yang ada di posisi yang sama (TIDAK DOUBLE)
        updated = prev.map((item, idx) => {
          if (idx === existingIndex) {
            return {
              ...item,
              ...payload,
              id: item.id, // pertahankan id sebelumnya
            };
          }
          return item;
        });
      } else {
        // Baru tambahkan jika belum pernah diabsen pada sesi ini
        updated = [newRecord, ...prev];
      }

      // Optimasi performa: hilangkan foto base64 berukuran besar di localStorage agar HP tidak patah-patah
      try {
        const compactLogs = updated
          .slice(0, 80)
          .map((log) => ({ ...log, foto_bukti: null }));
        localStorage.setItem(
          "mobile_presensi_logs",
          JSON.stringify(compactLogs),
        );
      } catch (err) {}

      presensiLogsRef.current = updated;
      return updated;
    });

    // Kirim asinkron tanpa menahan UI (non-blocking) & tanpa mengirim base64 berat ke endpoint absensi
    const { foto_bukti, ...apiPayload } = payload;
    axios.post("/api/absensi/fingerprint", apiPayload)
      .then((res) => {
        if (res.data?.data?.id) {
          setPresensiLogs((prev) =>
            prev.map((item) =>
              item.id === newRecord.id ? { ...item, id: res.data.data.id } : item
            )
          );
        }
      })
      .catch((err) => {
        console.error("[Presensi API Error]", err?.response?.data || err?.message);
        toastError(
          `Gagal simpan ke database: ${
            err?.response?.data?.message || err?.message || "Server Error"
          }`
        );
      });
  };

  // Quick Action Manual Presensi per Santri (Bisa ganti/update status jika salah klik)
  const handleQuickManualAction = (santri, status) => {
    playBeep();
    recordAttendance(santri, status, "Manual Musyrif", "Override_Manual");
    toastSuccess(`${santri.nama_santri}: ${status}`);
  };

  const getInitials = (name) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getActivityIcon = (kategori = "") => {
    const k = String(kategori).toLowerCase();
    if (k.includes("qur") || k.includes("tajwid")) return "📖";
    if (
      k.includes("kitab") ||
      k.includes("nahwu") ||
      k.includes("fiqih") ||
      k.includes("tafsir")
    )
      return "📚";
    if (k.includes("praktek") || k.includes("ubudiyah") || k.includes("ibadah"))
      return "🤲";
    if (k.includes("muhafadzoh") || k.includes("hafalan")) return "📜";
    if (k.includes("bahasa")) return "🗣️";
    if (k.includes("doa") || k.includes("wirid") || k.includes("sholawat"))
      return "📿";
    if (k.includes("diskusi") || k.includes("bahtsul")) return "👥";
    return "📌";
  };

  // Helper cek apakah santri memiliki izin aktif (Izin Pulang / Sakit) dari menu perizinan
  const getSantriActiveIzin = (santri, targetDate) => {
    if (!santri || !izinList || !izinList.length) return null;
    const dateToCheck = targetDate || getTodayDateStr();

    return izinList.find((sp) => {
      const matchSantri =
        (sp.santri_id && String(sp.santri_id) === String(santri.id)) ||
        (sp.nama_santri &&
          santri.nama_santri &&
          sp.nama_santri.trim().toLowerCase() ===
            santri.nama_santri.trim().toLowerCase());
      if (!matchSantri) return false;

      const st = String(sp.status || "").toLowerCase();
      // Jika sudah ditolak, dibatalkan, atau sudah kembali ke pondok, maka izin sudah selesai
      if (
        st.includes("tolak") ||
        st.includes("batal") ||
        st.includes("kembali")
      ) {
        return false;
      }

      const tglMulai = normalizeDateStr(
        sp.tgl_keluar_aktual || sp.tgl_keluar_rencana,
      );
      const tglSelesai = normalizeDateStr(
        sp.tgl_kembali_rencana || sp.tgl_kembali_aktual,
      );

      if (tglMulai && dateToCheck < tglMulai) return false;
      // Jika status 'Aktif Keluar' (belum check-in kembali), tetap dianggap sedang di luar
      if (tglSelesai && dateToCheck > tglSelesai && !st.includes("keluar")) {
        return false;
      }

      return true;
    });
  };

  // Mengambil status presensi santri KHUSUS tanggal berjalan (hari ini)
  const getSantriCurrentLog = (santri) => {
    if (!santri) return null;
    const today = getTodayDateStr();
    // 1. Cek langsung dari presensi logs (baik scan manual, fingerprint, maupun auto-sync backend)
    const directLog = presensiLogs.find((l) => {
      const itemTgl = normalizeDateStr(l.tanggal);
      const isToday = !itemTgl || itemTgl === today;
      const sameSantri =
        (l.santri_id != null &&
          santri.id != null &&
          String(l.santri_id) === String(santri.id)) ||
        (l.nis &&
          santri.nis &&
          String(l.nis).trim() === String(santri.nis).trim()) ||
        (l.nama_santri &&
          santri.nama_santri &&
          l.nama_santri.trim().toLowerCase() ===
            santri.nama_santri.trim().toLowerCase());
      const sameSesi =
        (l.sesi_id != null &&
          selectedKegiatan?.id != null &&
          String(l.sesi_id) === String(selectedKegiatan.id)) ||
        (l.kegiatan &&
          selectedKegiatan?.nama &&
          l.kegiatan.trim().toLowerCase() ===
            selectedKegiatan.nama.trim().toLowerCase()) ||
        (l.nama_sesi &&
          selectedKegiatan?.nama &&
          l.nama_sesi.trim().toLowerCase() ===
            selectedKegiatan.nama.trim().toLowerCase()) ||
        (l.is_perizinan_auto &&
          (l.status_kehadiran === "Izin" || l.status_kehadiran === "Sakit"));
      return isToday && sameSantri && sameSesi;
    });

    if (directLog) return directLog;

    // 2. Jika belum tercatat di log presensi, otomatis baca dari data perizinan aktif
    const activeIzin = getSantriActiveIzin(santri, today);
    if (activeIzin) {
      const isSakit =
        (activeIzin.jenis_izin || "").toLowerCase().includes("sakit") ||
        (activeIzin.jenis_izin || "").toLowerCase().includes("berobat") ||
        (activeIzin.keperluan || "").toLowerCase().includes("sakit");
      const st = isSakit ? "Sakit" : "Izin";
      return {
        id: `auto-izin-${activeIzin.id}`,
        santri_id: santri.id,
        nama_santri: santri.nama_santri,
        nis: santri.nis,
        sesi_id: selectedKegiatan?.id,
        nama_sesi: selectedKegiatan?.nama || "Kegiatan Pesantren",
        kegiatan: selectedKegiatan?.nama || "Kegiatan Pesantren",
        tanggal: today,
        waktu_scan: "00:00",
        status: st,
        status_kehadiran: st,
        metode_scan: "Perizinan",
        keterangan: `Perizinan: ${activeIzin.jenis_izin} (${activeIzin.keperluan || "Disetujui"})`,
        is_perizinan_auto: true,
      };
    }

    return null;
  };

  const simplifyStatus = (statusStr) => {
    if (!statusStr) return "Hadir";
    const s = String(statusStr).toLowerCase();
    if (s.includes("hadir")) return "Hadir";
    if (s.includes("sakit")) return "Sakit";
    if (s.includes("izin")) return "Izin";
    if (s.includes("alpa") || s.includes("alpha")) return "Alfa";
    return statusStr;
  };

  const formatCompactTime = (timeStr, dateStr) => {
    if (!timeStr && !dateStr) return "Barusan";
    const t = timeStr ? String(timeStr).substring(0, 5) : "";
    return t ? `${t} WIB` : "Hari ini";
  };

  const formatCompactActivity = (act) => {
    if (!act) return "Kegiatan";
    return String(act)
      .replace(" Berjamaah", "")
      .replace(" / Halaqah Pagi", "")
      .replace(" Malam", "");
  };

  const getSantriKelasLabel = (s) => {
    if (!s) return "";
    if (s.nama_kelas && String(s.nama_kelas).trim() !== "") {
      return String(s.nama_kelas).trim();
    }
    if (s.kelas_id && kelasList.length > 0) {
      const foundK = kelasList.find((k) => String(k.id) === String(s.kelas_id));
      if (foundK && foundK.nama_kelas) return String(foundK.nama_kelas).trim();
    }
    if (s.tingkat_diniyah && String(s.tingkat_diniyah).trim() !== "") {
      return String(s.tingkat_diniyah).trim();
    }
    return "";
  };

  // Daftar opsi kelas unik dari master kelas + data santri
  const availableKelasOptions = React.useMemo(() => {
    const setK = new Set();
    (kelasList || []).forEach((k) => {
      if (k.nama_kelas && String(k.nama_kelas).trim()) {
        setK.add(String(k.nama_kelas).trim());
      }
    });
    (santriList || []).forEach((s) => {
      const lbl = getSantriKelasLabel(s);
      if (lbl) setK.add(lbl);
    });
    return Array.from(setK);
  }, [kelasList, santriList]);

  // Santri yang sesuai dengan filter kelas aktif
  const santriInSelectedKelas = santriList.filter((s) => {
    if (filterManualKelas === "Semua") return true;
    const sKelas = getSantriKelasLabel(s);
    return (
      sKelas.toLowerCase() === filterManualKelas.toLowerCase() ||
      String(s.kelas_id) === String(filterManualKelas)
    );
  });

  const handleMarkAllRemainingHadir = () => {
    const unrecorded = santriInSelectedKelas.filter((s) => !getSantriCurrentLog(s));
    if (unrecorded.length === 0) {
      toastSuccess("Semua santri sudah diabsen");
      return;
    }
    unrecorded.forEach((s) => {
      recordAttendance(s, "Hadir", "Manual");
    });
    toastSuccess(`${unrecorded.length} santri ditandai Hadir`);
  };

  // Filter santri untuk tab manual (Cari + Kelas + Status)
  const filteredSantri = santriInSelectedKelas.filter((s) => {
    const q = searchManual.toLowerCase();
    const sKelas = getSantriKelasLabel(s).toLowerCase();
    const matchSearch =
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      sKelas.includes(q);

    if (!matchSearch) return false;
    if (filterManualStatus === "Semua") return true;
    const log = getSantriCurrentLog(s);
    if (filterManualStatus === "Belum") return !log;
    if (!log) return false;
    const st = simplifyStatus(log.status_kehadiran || log.status).toLowerCase();
    return st.includes(filterManualStatus.toLowerCase());
  });

  // Data riwayat murni 100% dari database MySQL (tanpa injeksi data fake/sintetis perizinan)
  const riwayatLogsCombined = presensiLogs;

  // Hapus log presensi langsung dari Mobile ke database MySQL
  const handleDeleteLog = async (log) => {
    if (!log || !log.id) return;
    const ok = await showConfirm(
      "Hapus Riwayat Presensi",
      `Yakin ingin menghapus riwayat presensi ${log.nama_santri || "santri"} (${log.kegiatan || "kegiatan"}) pada tanggal ${normalizeDateStr(log.tanggal)}? Data akan dihapus permanen dari MySQL.`,
      "Ya, Hapus",
      "Batal",
    );
    if (ok) {
      setPresensiLogs((prev) => {
        const next = prev.filter((l) => l.id !== log.id);
        try {
          localStorage.setItem("mobile_presensi_logs", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      try {
        await axios.delete(`/api/absensi/fingerprint/${log.id}`, {
          data: {
            santri_id: log.santri_id,
            tanggal: log.tanggal,
            waktu_scan: log.waktu_scan,
          },
        });
        toastSuccess("Riwayat presensi berhasil dihapus dari database");
        fetchData();
      } catch (err) {
        showError(
          "Gagal Menghapus",
          err.response?.data?.message || err.message,
        );
        fetchData();
      }
    }
  };

  // Helper pengecekan kategori log: Berjamaah vs Mengaji
  const isLogBerjamaah = (log) => {
    const k = String(log.kegiatan || log.nama_sesi || "").toLowerCase();
    const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya/.test(k);
    const tipe = String(log.tipe_presensi || "").toLowerCase();
    return tipe === "berjamaah" || isShalat;
  };

  // Filter riwayat untuk tab riwayat (Khusus Berjamaah vs Mengaji sesuai kategori aktif)
  const filteredRiwayat = riwayatLogsCombined.filter((log) => {
    // 1. Saring ketat berdasarkan Kategori Aktif (Berjamaah vs Mengaji)
    if (activeKategori === "berjamaah") {
      if (!isLogBerjamaah(log)) return false;
    } else if (activeKategori === "mengaji") {
      if (isLogBerjamaah(log)) return false;
    }

    const q = searchRiwayat.toLowerCase();
    const matchSearch =
      (log.nama_santri || "").toLowerCase().includes(q) ||
      (log.kegiatan || "").toLowerCase().includes(q) ||
      (log.nis || "").toLowerCase().includes(q);

    const cleanStatus = simplifyStatus(log.status_kehadiran || log.status);
    const matchStatus =
      filterStatusRiwayat === "Semua"
        ? true
        : cleanStatus.toLowerCase() === filterStatusRiwayat.toLowerCase();

    const itemTgl = normalizeDateStr(log.tanggal);
    const matchTanggal =
      (!filterTanggalDari || itemTgl >= filterTanggalDari) &&
      (!filterTanggalSampai || itemTgl <= filterTanggalSampai);

    return matchSearch && matchStatus && matchTanggal;
  });

  // Perhitungan statistik sesi kegiatan aktif (tanggal berjalan)
  const sessionSudahCount = santriList.filter((s) =>
    getSantriCurrentLog(s),
  ).length;
  const sessionTotal = santriList.length;
  const sessionPercent =
    sessionTotal > 0 ? Math.round((sessionSudahCount / sessionTotal) * 100) : 0;

  // Perhitungan statistik riwayat (sesuai tanggal filter & pencarian yang dipilih & Kategori Aktif murni dari database)
  const riwayatLogsForStats = riwayatLogsCombined.filter((l) => {
    if (activeKategori === "berjamaah") {
      if (!isLogBerjamaah(l)) return false;
    } else if (activeKategori === "mengaji") {
      if (isLogBerjamaah(l)) return false;
    }
    const q = searchRiwayat.toLowerCase();
    const matchSearch =
      !q ||
      (l.nama_santri || "").toLowerCase().includes(q) ||
      (l.kegiatan || "").toLowerCase().includes(q) ||
      (l.nis || "").toLowerCase().includes(q);
    const itemTgl = normalizeDateStr(l.tanggal);
    const matchTgl =
      (!filterTanggalDari || itemTgl >= filterTanggalDari) &&
      (!filterTanggalSampai || itemTgl <= filterTanggalSampai);
    return matchSearch && matchTgl;
  });

  const countTotalRiwayat = riwayatLogsForStats.length;
  const countHadir = riwayatLogsForStats.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Hadir",
  ).length;
  const countSakit = riwayatLogsForStats.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Sakit",
  ).length;
  const countIzin = riwayatLogsForStats.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Izin",
  ).length;
  const countAlpa = riwayatLogsForStats.filter(
    (l) => simplifyStatus(l.status_kehadiran || l.status) === "Alfa",
  ).length;

  // Badge notifikasi tab riwayat: sinkron dengan data tanggal aktif & kategori aktif
  const todayPresensiCount = riwayatLogsCombined.filter((l) => {
    if (activeKategori === "berjamaah") {
      if (!isLogBerjamaah(l)) return false;
    } else if (activeKategori === "mengaji") {
      if (isLogBerjamaah(l)) return false;
    }
    return normalizeDateStr(l.tanggal) === getTodayDateStr();
  }).length;
  const riwayatBadgeCount =
    activeMode === "riwayat" ? filteredRiwayat.length : todayPresensiCount;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100%",
          background: "#f8fafc",
          padding: "14px 14px 40px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <MobileLoadingState
          title="Menyiapkan Presensi..."
          subtitle="Mohon tunggu sebentar, sedang sinkronisasi jadwal & data santri..."
          iconColor="#059669"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#f8fafc",
        padding: "14px 14px 40px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* 2 TAB KATEGORI: BERJAMAAH (SHALAT 5 WAKTU) VS MENGAJI (PEGON & MASTER KEGIATAN) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          background: "#ffffff",
          padding: "4px",
          borderRadius: "14px",
          marginBottom: "10px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveKategori("berjamaah")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "7px 10px",
            borderRadius: "10px",
            border: "none",
            background:
              activeKategori === "berjamaah"
                ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                : "transparent",
            color: activeKategori === "berjamaah" ? "#ffffff" : "#64748b",
            fontWeight: 800,
            fontSize: "0.75rem",
            cursor: "pointer",
            boxShadow:
              activeKategori === "berjamaah"
                ? "0 3px 10px rgba(2, 132, 199, 0.3)"
                : "none",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>🕌</span>
          <span>Berjamaah</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveKategori("mengaji")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "7px 10px",
            borderRadius: "10px",
            border: "none",
            background:
              activeKategori === "mengaji"
                ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                : "transparent",
            color: activeKategori === "mengaji" ? "#ffffff" : "#64748b",
            fontWeight: 800,
            fontSize: "0.75rem",
            cursor: "pointer",
            boxShadow:
              activeKategori === "mengaji"
                ? "0 3px 10px rgba(5, 150, 105, 0.3)"
                : "none",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>📖</span>
          <span>Mengaji</span>
        </button>
      </div>

      {/* HEADER: Sesi Kegiatan Pesantren Modern Card (Compact) */}
      <div
        style={{
          background:
            activeKategori === "berjamaah"
              ? "linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #1e40af 100%)"
              : "linear-gradient(135deg, #059669 0%, #047857 45%, #064e3b 100%)",
          borderRadius: "18px",
          padding: "12px 14px",
          color: "#ffffff",
          marginBottom: "10px",
          boxShadow:
            activeKategori === "berjamaah"
              ? "0 6px 18px -4px rgba(2, 132, 199, 0.32)"
              : "0 6px 18px -4px rgba(5, 150, 105, 0.32)",
          position: "relative",
        }}
      >
        {/* Dropdown Kegiatan Stylized (Master Kegiatan Database) */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <select
            value={selectedKegiatan?.id || ""}
            onChange={(e) => {
              const k = currentDaftarKegiatan.find(
                (x) => String(x.id) === String(e.target.value),
              );
              if (k) {
                if (activeKategori === "berjamaah") setSelectedBerjamaah(k);
                else setSelectedMengaji(k);
              }
            }}
            style={{
              width: "100%",
              padding: "9px 32px 9px 12px",
              borderRadius: "11px",
              border: "1px solid rgba(255, 255, 255, 0.32)",
              background: "rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 800,
              outline: "none",
              appearance: "none",
              cursor: "pointer",
            }}
          >
            {currentDaftarKegiatan.map((k) => {
              const startJam = k.jam_mulai_presensi
                ? String(k.jam_mulai_presensi).substring(0, 5)
                : "";
              const endJam = k.jam_tutup_presensi
                ? String(k.jam_tutup_presensi).substring(0, 5)
                : "";
              const jadwalSuffix =
                startJam && endJam ? ` (${startJam} - ${endJam})` : "";
              return (
                <option
                  key={k.id}
                  value={k.id}
                  style={{ color: "#0f172a", fontWeight: 700 }}
                >
                  {k.nama}
                  {jadwalSuffix}
                </option>
              );
            })}
          </select>
          <ChevronDown
            size={15}
            color="#ffffff"
            style={{
              position: "absolute",
              right: "11px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Location & Progress Bar */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "10px",
            padding: "6px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.66rem",
              color: "#e0f2fe",
            }}
          >
            <span>📍 {selectedKegiatan?.tempat || "Komplek Pesantren"}</span>
            <span style={{ fontWeight: 800, color: "#fef08a" }}>
              {sessionSudahCount} / {sessionTotal} Santri ({sessionPercent}%)
            </span>
          </div>
          {/* Progress bar track */}
          <div
            style={{
              width: "100%",
              height: "4px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${sessionPercent}%`,
                height: "100%",
                borderRadius: "999px",
                background: "#22c55e",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* 4 OPSI MODE PRESENSI (TAB TOGGLE: WAJAH AI, SCAN QR, MANUAL, RIWAYAT) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          background: "#ffffff",
          borderRadius: "13px",
          padding: "3.5px",
          marginBottom: "12px",
          gap: "4px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        }}
      >
        {/* Tab 1: Wajah AI */}
        <button
          onClick={() => handleSwitchTab("face")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5px",
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background:
              activeMode === "face"
                ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                : "transparent",
            color: activeMode === "face" ? "#047857" : "#64748b",
            fontWeight: 800,
            fontSize: "0.68rem",
            cursor: "pointer",
            boxShadow:
              activeMode === "face"
                ? "inset 0 0 0 1px #6ee7b7, 0 2px 6px rgba(5, 150, 105, 0.12)"
                : "none",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Smile
            size={13}
            color={activeMode === "face" ? "#059669" : "#64748b"}
          />
          <span>Wajah AI</span>
        </button>

        {/* Tab 2: Scan QR */}
        <button
          onClick={() => handleSwitchTab("qr")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5px",
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background:
              activeMode === "qr"
                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                : "transparent",
            color: activeMode === "qr" ? "#0369a1" : "#64748b",
            fontWeight: 800,
            fontSize: "0.68rem",
            cursor: "pointer",
            boxShadow:
              activeMode === "qr"
                ? "inset 0 0 0 1px #7dd3fc, 0 2px 6px rgba(2, 132, 199, 0.12)"
                : "none",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <QrCode
            size={13}
            color={activeMode === "qr" ? "#0284c7" : "#64748b"}
          />
          <span>Scan QR</span>
        </button>

        {/* Tab 3: Manual */}
        <button
          onClick={() => handleSwitchTab("manual")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5px",
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background:
              activeMode === "manual"
                ? "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)"
                : "transparent",
            color: activeMode === "manual" ? "#0f766e" : "#64748b",
            fontWeight: 800,
            fontSize: "0.68rem",
            cursor: "pointer",
            boxShadow:
              activeMode === "manual"
                ? "inset 0 0 0 1px #5eead4, 0 2px 6px rgba(13, 148, 136, 0.12)"
                : "none",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <UserCheck
            size={13}
            color={activeMode === "manual" ? "#0d9488" : "#64748b"}
          />
          <span>Manual</span>
        </button>

        {/* Tab 4: Riwayat */}
        <button
          onClick={() => handleSwitchTab("riwayat")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background:
              activeMode === "riwayat"
                ? "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"
                : "transparent",
            color: activeMode === "riwayat" ? "#6d28d9" : "#64748b",
            fontWeight: 800,
            fontSize: "0.68rem",
            cursor: "pointer",
            boxShadow:
              activeMode === "riwayat"
                ? "inset 0 0 0 1px #c4b5fd, 0 2px 6px rgba(124, 58, 237, 0.12)"
                : "none",
            transition: "all 0.15s ease",
            position: "relative",
            whiteSpace: "nowrap",
          }}
        >
          <History
            size={13}
            color={activeMode === "riwayat" ? "#7c3aed" : "#64748b"}
          />
          <span>Riwayat</span>
          {riwayatBadgeCount > 0 && (
            <span
              style={{
                background: activeMode === "riwayat" ? "#7c3aed" : "#94a3b8",
                color: "#ffffff",
                fontSize: "0.54rem",
                fontWeight: 800,
                padding: "1px 4px",
                borderRadius: "999px",
                marginLeft: "1px",
              }}
            >
              {riwayatBadgeCount}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ABSEN WAJAH AI (FACE RECOGNITION MOBILE)
      ========================================================================= */}
      {activeMode === "face" && (
        <div>
          {/* Card Kamera Wajah */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "16px",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.06)",
              border: "1.5px solid #059669",
              marginBottom: "16px",
            }}
          >
            {/* Action Bar Kamera */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: isFaceCameraActive ? "#22c55e" : "#ef4444",
                    boxShadow: isFaceCameraActive ? "0 0 6px #22c55e" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {isFaceCameraActive
                    ? "Kamera Presensi Wajah AI"
                    : "Kamera Nonaktif"}
                </span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {/* Switch Kamera Depan / Belakang */}
                <button
                  type="button"
                  onClick={toggleFaceFacingMode}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 9px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0284c7",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                  title="Putar Kamera Depan / Belakang"
                >
                  <RotateCcw size={13} />
                  <span>
                    {faceFacingMode === "user"
                      ? "Kamera Belakang"
                      : "Kamera Depan"}
                  </span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  style={{
                    padding: "5px 8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: soundEnabled ? "#ecfdf5" : "#fef2f2",
                    color: soundEnabled ? "#059669" : "#dc2626",
                    cursor: "pointer",
                  }}
                  title={soundEnabled ? "Suara Aktif" : "Suara Mute"}
                >
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
            </div>

            {/* Video Viewport Container */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                minHeight: "260px",
                maxHeight: "340px",
                borderRadius: "18px",
                overflow: "hidden",
                background: "#090d16",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 25px rgba(0,0,0,0.6)",
              }}
            >
              <video
                ref={faceVideoRef}
                playsInline
                muted
                autoPlay
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: faceFacingMode === "user" ? "scaleX(-1)" : "none",
                  display: isFaceCameraActive ? "block" : "none",
                }}
              />
              <canvas
                ref={faceCanvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                  display: isFaceCameraActive ? "block" : "none",
                }}
              />

              {!isFaceCameraActive && (
                <div
                  style={{
                    textAlign: "center",
                    color: "#94a3b8",
                    padding: "20px",
                  }}
                >
                  <VideoOff
                    size={36}
                    color="#64748b"
                    style={{ margin: "0 auto 8px" }}
                  />
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    Kamera Wajah Nonaktif
                  </p>
                  <button
                    onClick={() => startFaceCamera(faceFacingMode)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#059669",
                      color: "#fff",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Nyalakan Kamera Sekarang
                  </button>
                </div>
              )}

              {faceCameraError && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "10px",
                    right: "10px",
                    background: "rgba(239, 68, 68, 0.92)",
                    color: "#ffffff",
                    fontSize: "0.72rem",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    textAlign: "left",
                  }}
                >
                  {faceCameraError}
                </div>
              )}

              {/* Status Floating Chip */}
              {isFaceCameraActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "10px",
                    right: "10px",
                    background: faceCooldownRef.current
                      ? "rgba(16, 185, 129, 0.92)"
                      : "rgba(15, 23, 42, 0.82)",
                    backdropFilter: "blur(6px)",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    padding: "7px 12px",
                    borderRadius: "10px",
                    textAlign: "center",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {faceStatusText}
                </div>
              )}
            </div>
          </div>

          {/* Last Scanned Santri Highlight Card */}
          {lastScannedSantri && (
            <div
              style={{
                background: lastScannedSantri.isDuplicate
                  ? "#fffbeb"
                  : lastScannedSantri.isError
                    ? "#fef2f2"
                    : "#ecfdf5",
                border: `2px solid ${lastScannedSantri.isDuplicate ? "#f59e0b" : lastScannedSantri.isError ? "#ef4444" : "#10b981"}`,
                borderRadius: "18px",
                padding: "14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: lastScannedSantri.isDuplicate
                  ? "0 6px 18px rgba(245, 158, 11, 0.2)"
                  : lastScannedSantri.isError
                    ? "0 6px 18px rgba(239, 68, 68, 0.2)"
                    : "0 6px 18px rgba(16, 185, 129, 0.2)",
              }}
            >
              {lastScannedSantri.snapshot ? (
                <img
                  src={lastScannedSantri.snapshot}
                  alt={lastScannedSantri.nama_santri}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    objectFit: "cover",
                    border: `2px solid ${lastScannedSantri.isDuplicate ? "#f59e0b" : lastScannedSantri.isError ? "#ef4444" : "#10b981"}`,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: lastScannedSantri.isDuplicate
                      ? "#f59e0b"
                      : lastScannedSantri.isError
                        ? "#ef4444"
                        : "#10b981",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {lastScannedSantri.isDuplicate ||
                  lastScannedSantri.isError ? (
                    <AlertCircle size={26} />
                  ) : (
                    <Check size={28} strokeWidth={3} />
                  )}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: lastScannedSantri.isDuplicate
                      ? "#b45309"
                      : lastScannedSantri.isError
                        ? "#b91c1c"
                        : "#047857",
                    letterSpacing: "0.04em",
                  }}
                >
                  {lastScannedSantri.isDuplicate
                    ? "SUDAH HADIR SEBELUMNYA (TIDAK DUPLIKAT)"
                    : lastScannedSantri.isError
                      ? "GAGAL / BELUM TERDAFTAR"
                      : "BERHASIL DIABSEN (SCAN WAJAH AI)"}
                </span>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: lastScannedSantri.isDuplicate
                      ? "#92400e"
                      : lastScannedSantri.isError
                        ? "#991b1b"
                        : "#064e3b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {lastScannedSantri.nama_santri}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: lastScannedSantri.isDuplicate
                      ? "#b45309"
                      : lastScannedSantri.isError
                        ? "#dc2626"
                        : "#059669",
                  }}
                >
                  {lastScannedSantri.notice ||
                    `NIS: ${lastScannedSantri.nis} • ${lastScannedSantri.nama_asrama || "Asrama Pusat"}`}
                </div>
              </div>
            </div>
          )}

          {/* Quick link ke tab riwayat */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button
              onClick={() => setActiveMode("riwayat")}
              style={{
                background: "transparent",
                border: "none",
                color: "#059669",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <History size={14} />
              <span>Lihat Rekap Presensi di Tab Riwayat &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: SCAN QR CODE SANTRI
      ========================================================================= */}
      {activeMode === "qr" && (
        <div>
          {/* Viewport Scanner Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              padding: "16px",
              boxShadow: "0 8px 24px -4px rgba(0,0,0,0.06)",
              border: "1.5px solid #e2e8f0",
              textAlign: "center",
              marginBottom: "16px",
            }}
          >
            {/* Video Container */}
            <div
              style={{
                width: "100%",
                minHeight: "260px",
                borderRadius: "18px",
                overflow: "hidden",
                background: "#0f172a",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div id="mobile-qr-reader" style={{ width: "100%" }} />

              {/* Laser overlay animation when active */}
              {scannerActive && (
                <div
                  style={{
                    position: "absolute",
                    top: "15%",
                    left: "10%",
                    right: "10%",
                    bottom: "15%",
                    border: "2px solid rgba(56, 189, 248, 0.65)",
                    borderRadius: "16px",
                    boxShadow: "0 0 15px rgba(56, 189, 248, 0.35)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            {cameraError && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#be123c",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginTop: "12px",
                  textAlign: "left",
                }}
              >
                {cameraError}
              </div>
            )}

            {/* Live Camera Status */}
            <div
              style={{
                marginTop: "14px",
                padding: "10px 14px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "0.78rem",
                color: "#166534",
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 6px #22c55e",
                }}
              />
              <span>
                Pemindai Otomatis Aktif • Membaca QR langsung mencatat kehadiran
              </span>
            </div>
          </div>

          {/* Last Scanned Santri Highlight Card */}
          {lastScannedSantri && (
            <div
              style={{
                background: lastScannedSantri.isDuplicate
                  ? "#fffbeb"
                  : "#ecfdf5",
                border: `2px solid ${lastScannedSantri.isDuplicate ? "#f59e0b" : "#10b981"}`,
                borderRadius: "18px",
                padding: "14px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: lastScannedSantri.isDuplicate
                  ? "0 6px 18px rgba(245, 158, 11, 0.2)"
                  : "0 6px 18px rgba(16, 185, 129, 0.2)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  background: lastScannedSantri.isDuplicate
                    ? "#f59e0b"
                    : "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {lastScannedSantri.isDuplicate ? (
                  <AlertCircle size={28} />
                ) : (
                  <Check size={28} strokeWidth={3} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: lastScannedSantri.isDuplicate
                      ? "#b45309"
                      : "#047857",
                    letterSpacing: "0.04em",
                  }}
                >
                  {lastScannedSantri.isDuplicate
                    ? "SUDAH HADIR SEBELUMNYA (TIDAK DUPLIKAT)"
                    : "BERHASIL DIABSEN (SCAN QR)"}
                </span>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: lastScannedSantri.isDuplicate
                      ? "#92400e"
                      : "#064e3b",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {lastScannedSantri.nama_santri}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: lastScannedSantri.isDuplicate
                      ? "#b45309"
                      : "#059669",
                  }}
                >
                  {lastScannedSantri.notice ||
                    `NIS: ${lastScannedSantri.nis} • ${lastScannedSantri.nama_asrama || "Asrama Pusat"}`}
                </div>
              </div>
            </div>
          )}

          {/* Quick link ke tab riwayat */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button
              onClick={() => setActiveMode("riwayat")}
              style={{
                background: "transparent",
                border: "none",
                color: "#0284c7",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <History size={14} />
              <span>Lihat Rekap Seluruh Presensi di Tab Riwayat &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRESENSI MANUAL SANTRI (CEPAT & CHECKLIST MODERN)
      ========================================================================= */}
      {activeMode === "manual" && (
        <div>
          {/* Search Bar & Filter Kelas Santri Modern */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            {/* Input Pencarian */}
            <div
              style={{
                flex: 1,
                background: "#ffffff",
                borderRadius: "16px",
                padding: "4px 12px",
                border: "1.5px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <Search size={17} color="#0284c7" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari nama santri, NISN, atau kelas..."
                value={searchManual}
                onChange={(e) => setSearchManual(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 0",
                  border: "none",
                  outline: "none",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1e293b",
                }}
              />
              {searchManual && (
                <X
                  size={15}
                  color="#94a3b8"
                  onClick={() => setSearchManual("")}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                />
              )}
            </div>

            {/* Dropdown Filter Kelas */}
            <div style={{ position: "relative", minWidth: "132px", maxWidth: "155px" }}>
              <select
                value={filterManualKelas}
                onChange={(e) => setFilterManualKelas(e.target.value)}
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "0 28px 0 11px",
                  borderRadius: "16px",
                  border:
                    filterManualKelas !== "Semua"
                      ? "1.5px solid #0284c7"
                      : "1.5px solid #e2e8f0",
                  background:
                    filterManualKelas !== "Semua" ? "#f0f9ff" : "#ffffff",
                  color:
                    filterManualKelas !== "Semua" ? "#0369a1" : "#334155",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <option value="Semua">Semua Kelas</option>
                {availableKelasOptions.map((namaKls) => (
                  <option key={namaKls} value={namaKls}>
                    {namaKls}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                color={filterManualKelas !== "Semua" ? "#0284c7" : "#64748b"}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Quick Filter Status Pills + Quick Action */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "12px",
              overflowX: "auto",
              paddingBottom: "2px",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              {(() => {
                const klsTotal = santriInSelectedKelas.length;
                const klsSudah = santriInSelectedKelas.filter((s) =>
                  getSantriCurrentLog(s)
                ).length;
                const klsBelum = Math.max(0, klsTotal - klsSudah);
                return [
                  { key: "Semua", label: `Semua (${klsTotal})` },
                  { key: "Belum", label: `Belum (${klsBelum})` },
                  { key: "Hadir", label: `Hadir (${klsSudah})` },
                ];
              })().map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterManualStatus(f.key)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    border:
                      filterManualStatus === f.key
                        ? "1.5px solid #0284c7"
                        : "1px solid #e2e8f0",
                    background:
                      filterManualStatus === f.key ? "#0284c7" : "#ffffff",
                    color: filterManualStatus === f.key ? "#ffffff" : "#64748b",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow:
                      filterManualStatus === f.key
                        ? "0 3px 8px rgba(2, 132, 199, 0.3)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Hadirkan Semua Yang Belum Button */}
            {sessionTotal - sessionSudahCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRemainingHadir}
                style={{
                  padding: "5px 11px",
                  borderRadius: "999px",
                  border: "1px solid #bbf7d0",
                  background: "#ecfdf5",
                  color: "#059669",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={13} />
                <span>Hadirkan Sisa</span>
              </button>
            )}
          </div>

          {/* List Santri Modern & Rapi (Hanya Nama Santri, NISN, dan Kelas) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {filteredSantri.map((santri) => {
              const activeIzin = getSantriActiveIzin(santri);
              const currentLog = getSantriCurrentLog(santri);
              const currentStatus = currentLog
                ? String(currentLog.status_kehadiran || currentLog.status || "")
                : "";
              const isHadir = currentStatus.toLowerCase().includes("hadir");
              const isSakit = currentStatus.toLowerCase().includes("sakit");
              const isIzin = currentStatus.toLowerCase().includes("izin");
              const isAlpa =
                currentStatus.toLowerCase().includes("alpa") ||
                currentStatus.toLowerCase().includes("alpha");
              const isAutoPerizinan =
                Boolean(activeIzin) ||
                Boolean(currentLog?.is_perizinan_auto) ||
                String(currentLog?.metode_scan || "").toLowerCase() === "perizinan";

              const kelasLabel = getSantriKelasLabel(santri) || "-";
              const nisnValue = santri.nisn || santri.nis || "-";

              // Color accents
              let cardBorder = "#e2e8f0";
              let accentBar = "#cbd5e1";
              let cardBg = "#ffffff";
              if (isHadir) {
                cardBorder = "#a7f3d0";
                accentBar = "#10b981";
                cardBg = "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)";
              } else if (isSakit) {
                cardBorder = "#ddd6fe";
                accentBar = "#8b5cf6";
                cardBg = "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)";
              } else if (isIzin) {
                cardBorder = "#fde68a";
                accentBar = "#f59e0b";
                cardBg = "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)";
              } else if (isAlpa) {
                cardBorder = "#fecdd3";
                accentBar = "#ef4444";
                cardBg = "linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)";
              }

              return (
                <div
                  key={santri.id}
                  style={{
                    background: cardBg,
                    borderRadius: "15px",
                    padding: "11px 12px 11px 15px",
                    border: `1.5px solid ${cardBorder}`,
                    boxShadow: currentLog
                      ? "0 4px 12px -2px rgba(15, 23, 42, 0.06)"
                      : "0 2px 6px rgba(15, 23, 42, 0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Garis Aksen Status di Sisi Kiri */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "4px",
                      background: accentBar,
                    }}
                  />

                  {/* Baris Atas: Nama Santri, NISN, dan Kelas */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.86rem",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {santri.nama_santri}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginTop: "3px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            color: "#475569",
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            padding: "1.5px 7px",
                            borderRadius: "6px",
                            letterSpacing: "0.02em",
                          }}
                        >
                          NISN: {nisnValue}
                        </span>
                      </div>
                    </div>

                    {/* Badge Kelas di Kanan */}
                    <span
                      style={{
                        background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: "0 1px 3px rgba(37, 99, 235, 0.08)",
                      }}
                    >
                      {kelasLabel}
                    </span>
                  </div>

                  {/* Jika Santri Sedang Izin Pulang / Sakit Aktif: Otomatis Tercatat & Tidak Perlu Input Absen */}
                  {isAutoPerizinan ? (
                    <div
                      style={{
                        background: isSakit ? "#f5f3ff" : "#fffbeb",
                        border: `1px dashed ${isSakit ? "#c4b5fd" : "#fcd34d"}`,
                        borderRadius: "10px",
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "7px",
                          minWidth: 0,
                        }}
                      >
                        <span style={{ fontSize: "0.95rem", flexShrink: 0 }}>
                          {isSakit ? "🏥" : "🏠"}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              color: isSakit ? "#5b21b6" : "#92400e",
                            }}
                          >
                            Sedang {activeIzin?.jenis_izin || "Izin Pulang"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.62rem",
                              color: isSakit ? "#6d28d9" : "#b45309",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Otomatis tercatat • Tidak perlu diabsen
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          background: isSakit ? "#7c3aed" : "#f59e0b",
                          color: "#ffffff",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          padding: "3.5px 8px",
                          borderRadius: "7px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        ✓ Otomatis {isSakit ? "Sakit" : "Izin"}
                      </span>
                    </div>
                  ) : (
                    /* 4 Tombol Status Modern & Ramping */
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "6px",
                      }}
                    >
                      {/* HADIR */}
                      <button
                        type="button"
                        onClick={() => handleQuickManualAction(santri, "Hadir")}
                        style={{
                          padding: "6.5px 2px",
                          borderRadius: "9px",
                          border: isHadir ? "none" : "1px solid #bbf7d0",
                          background: isHadir
                            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            : "#f0fdf4",
                          color: isHadir ? "#ffffff" : "#047857",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isHadir
                            ? "0 3px 8px rgba(16, 185, 129, 0.32)"
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isHadir && <Check size={11} strokeWidth={3} />}
                        <span>Hadir</span>
                      </button>

                      {/* SAKIT */}
                      <button
                        type="button"
                        onClick={() => handleQuickManualAction(santri, "Sakit")}
                        style={{
                          padding: "6.5px 2px",
                          borderRadius: "9px",
                          border: isSakit ? "none" : "1px solid #ddd6fe",
                          background: isSakit
                            ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                            : "#faf5ff",
                          color: isSakit ? "#ffffff" : "#6d28d9",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isSakit
                            ? "0 3px 8px rgba(139, 92, 246, 0.32)"
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isSakit && <Check size={11} strokeWidth={3} />}
                        <span>Sakit</span>
                      </button>

                      {/* IZIN */}
                      <button
                        type="button"
                        onClick={() => handleQuickManualAction(santri, "Izin")}
                        style={{
                          padding: "6.5px 2px",
                          borderRadius: "9px",
                          border: isIzin ? "none" : "1px solid #fde68a",
                          background: isIzin
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : "#fffbeb",
                          color: isIzin ? "#ffffff" : "#b45309",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isIzin
                            ? "0 3px 8px rgba(245, 158, 11, 0.32)"
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isIzin && <Check size={11} strokeWidth={3} />}
                        <span>Izin</span>
                      </button>

                      {/* ALFA */}
                      <button
                        type="button"
                        onClick={() => handleQuickManualAction(santri, "Alfa")}
                        style={{
                          padding: "6.5px 2px",
                          borderRadius: "9px",
                          border: isAlpa ? "none" : "1px solid #fecdd3",
                          background: isAlpa
                            ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                            : "#fff1f2",
                          color: isAlpa ? "#ffffff" : "#b91c1c",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "3px",
                          boxShadow: isAlpa
                            ? "0 3px 8px rgba(239, 68, 68, 0.32)"
                            : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {isAlpa && <Check size={11} strokeWidth={3} />}
                        <span>Alfa</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSantri.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#94a3b8",
                }}
              >
                Santri tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: RIWAYAT PRESENSI LENGKAP (FITUR BARU)
      ========================================================================= */}
      {activeMode === "riwayat" && (
        <div>
          {/* Filter Tanggal Riwayat (Dari - Sampai, Otomatis Per Bulan) */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "10px 12px",
              border: "1px solid #e2e8f0",
              marginBottom: "10px",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#6d28d9",
                }}
              >
                <Calendar size={14} />
                <span>Filter Tanggal</span>
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    const r = getCurrentMonthRange();
                    setFilterTanggalDari(r.dari);
                    setFilterTanggalSampai(r.sampai);
                  }}
                  style={{
                    background: "#f5f3ff",
                    border: "1px solid #ddd6fe",
                    color: "#7c3aed",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "3.5px 7px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = getTodayDateStr();
                    setFilterTanggalDari(today);
                    setFilterTanggalSampai(today);
                  }}
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                    color: "#059669",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "3.5px 7px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Hari Ini
                </button>
                {(filterTanggalDari || filterTanggalSampai) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterTanggalDari("");
                      setFilterTanggalSampai("");
                    }}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#64748b",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      padding: "3.5px 7px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Semua
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    fetchData();
                    toastSuccess("Sinkronisasi ulang dari MySQL...");
                  }}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "3.5px 7px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                  title="Refresh Riwayat Langsung dari Database MySQL"
                >
                  <RefreshCw size={10} /> Sync
                </button>
              </div>
            </div>

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
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: "2px",
                  }}
                >
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={filterTanggalDari}
                  onChange={(e) => setFilterTanggalDari(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    background: "#f8fafc",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: "2px",
                  }}
                >
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={filterTanggalSampai}
                  onChange={(e) => setFilterTanggalSampai(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    background: "#f8fafc",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Search Box Riwayat */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "2px 12px",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.02)",
            }}
          >
            <Search size={15} color="#7c3aed" />
            <input
              type="text"
              placeholder="Cari nama santri, NIS, atau kegiatan..."
              value={searchRiwayat}
              onChange={(e) => setSearchRiwayat(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 0",
                border: "none",
                outline: "none",
                fontSize: "0.76rem",
                fontWeight: 600,
                color: "#1e293b",
              }}
            />
            {searchRiwayat && (
              <X
                size={14}
                color="#94a3b8"
                onClick={() => setSearchRiwayat("")}
                style={{ cursor: "pointer" }}
              />
            )}
          </div>

          {/* Filter Pills Status dengan Badge Notifikasi Angka */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "5px",
              background: "#ffffff",
              padding: "4px",
              borderRadius: "13px",
              border: "1px solid #e2e8f0",
              marginBottom: "12px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
            }}
          >
            {[
              {
                label: "Semua",
                count: countTotalRiwayat,
                activeBg: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                activeShadow: "0 3px 8px rgba(2, 132, 199, 0.28)",
                badgeBg: "#e0f2fe",
                badgeColor: "#0369a1",
              },
              {
                label: "Hadir",
                count: countHadir,
                activeBg: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                activeShadow: "0 3px 8px rgba(5, 150, 105, 0.28)",
                badgeBg: "#ecfdf5",
                badgeColor: "#047857",
              },
              {
                label: "Sakit",
                count: countSakit,
                activeBg: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                activeShadow: "0 3px 8px rgba(124, 58, 237, 0.28)",
                badgeBg: "#f5f3ff",
                badgeColor: "#6d28d9",
              },
              {
                label: "Izin",
                count: countIzin,
                activeBg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                activeShadow: "0 3px 8px rgba(217, 119, 6, 0.28)",
                badgeBg: "#fffbeb",
                badgeColor: "#b45309",
              },
              {
                label: "Alfa",
                count: countAlpa,
                activeBg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                activeShadow: "0 3px 8px rgba(220, 38, 38, 0.28)",
                badgeBg: "#fef2f2",
                badgeColor: "#b91c1c",
              },
            ].map((tab) => {
              const active = filterStatusRiwayat === tab.label;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setFilterStatusRiwayat(tab.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3.5px",
                    padding: "6px 2px",
                    borderRadius: "9px",
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    border: "none",
                    background: active ? tab.activeBg : "transparent",
                    color: active ? "#ffffff" : "#475569",
                    cursor: "pointer",
                    boxShadow: active ? tab.activeShadow : "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: active
                        ? "rgba(255, 255, 255, 0.24)"
                        : tab.badgeBg,
                      color: active ? "#ffffff" : tab.badgeColor,
                      fontSize: "0.58rem",
                      fontWeight: 800,
                      padding: "1px 4.5px",
                      borderRadius: "999px",
                      lineHeight: 1.2,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List Kartu Riwayat Lebih Menarik, Luas & Rapi (Satu Baris Info) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {filteredRiwayat.map((log) => {
              const isWajah = (
                log.metode_scan ||
                log.metode_presensi ||
                log.keterangan ||
                ""
              )
                .toLowerCase()
                .includes("wajah");
              const isQr = String(log.metode_scan || log.metode_presensi || "")
                .toLowerCase()
                .includes("qr");
              const cleanStatus = simplifyStatus(
                log.status_kehadiran || log.status,
              );
              const isHadir = cleanStatus === "Hadir";
              const isSakit = cleanStatus === "Sakit";
              const isIzin = cleanStatus === "Izin";

              const statusColor = isHadir
                ? "#059669"
                : isSakit
                  ? "#7c3aed"
                  : isIzin
                    ? "#d97706"
                    : "#dc2626";
              const statusBg = isHadir
                ? "#ecfdf5"
                : isSakit
                  ? "#f5f3ff"
                  : isIzin
                    ? "#fffbeb"
                    : "#fef2f2";
              const statusBorder = isHadir
                ? "#a7f3d0"
                : isSakit
                  ? "#ddd6fe"
                  : isIzin
                    ? "#fde68a"
                    : "#fecdd3";

              const avatarBg = isHadir
                ? "#d1fae5"
                : isSakit
                  ? "#ede9fe"
                  : isIzin
                    ? "#fef3c7"
                    : "#fee2e2";
              const avatarColor = isHadir
                ? "#065f46"
                : isSakit
                  ? "#5b21b6"
                  : isIzin
                    ? "#92400e"
                    : "#991b1b";

              return (
                <div
                  key={log.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "12px 14px",
                    border: `1.5px solid ${statusBorder}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {/* Left: Avatar / Snapshot Foto */}
                  {log.foto_bukti ? (
                    <img
                      src={log.foto_bukti}
                      alt={log.nama_santri}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        objectFit: "cover",
                        border: "1.5px solid #059669",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "12px",
                        background: avatarBg,
                        color: avatarColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.84rem",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(log.nama_santri)}
                    </div>
                  )}

                  {/* Middle: Name + Status & Single Clean Info Row */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Row 1: Name + Status Badge (Horizontal, not wrapped!) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "3px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {log.nama_santri || "Santri"}
                      </span>

                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: statusColor,
                          background: statusBg,
                          border: `1px solid ${statusBorder}`,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: statusColor,
                          }}
                        />
                        {cleanStatus}
                      </span>
                    </div>

                    {/* Row 2: Clean single line info */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span>
                        {formatCompactActivity(
                          log.kegiatan || selectedKegiatan.nama,
                        )}
                      </span>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <span>
                        {formatCompactTime(log.waktu_scan, log.tanggal)}
                      </span>
                      <span style={{ color: "#cbd5e1" }}>•</span>
                      <span
                        style={{
                          color: (
                            log.metode_scan ||
                            log.metode_presensi ||
                            log.keterangan ||
                            ""
                          )
                            .toLowerCase()
                            .includes("wajah")
                            ? "#059669"
                            : isQr
                              ? "#0284c7"
                              : "#64748b",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                        }}
                      >
                        {(
                          log.metode_scan ||
                          log.metode_presensi ||
                          log.keterangan ||
                          ""
                        )
                          .toLowerCase()
                          .includes("wajah")
                          ? "Wajah AI"
                          : isQr
                            ? "QR"
                            : (log.metode_scan || log.metode_presensi || "")
                                  .toLowerCase()
                                  .includes("perizinan")
                              ? "Izin"
                              : "Manual"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Date Badge & Tombol Hapus */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      {normalizeDateStr(log.tanggal) || getTodayDateStr()}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(log)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Hapus Presensi"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredRiwayat.length === 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  border: "1.5px dashed #cbd5e1",
                }}
              >
                <ClipboardList
                  size={38}
                  style={{ margin: "0 auto 8px", opacity: 0.4 }}
                />
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "#475569",
                  }}
                >
                  Tidak Ada Data Riwayat
                </div>
                <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                  Belum ada presensi yang cocok dengan filter pencarian.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Riwayat */}
    </div>
  );
}
