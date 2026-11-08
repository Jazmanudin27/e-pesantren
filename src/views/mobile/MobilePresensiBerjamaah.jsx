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

export default function MobilePresensiBerjamaah() {
  const [activeMode, setActiveMode] = useState("face");
  const [daftarBerjamaah, setDaftarBerjamaah] = useState(DAFTAR_BERJAMAAH_DEFAULT);
  const [selectedBerjamaah, setSelectedBerjamaah] = useState(DAFTAR_BERJAMAAH_DEFAULT[0]);

  const selectedKegiatan = selectedBerjamaah;
  const currentDaftarKegiatan = daftarBerjamaah;

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

  // Face Recognition Mobile State
  const [faceFacingMode, setFaceFacingMode] = useState("user");
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceCameraError, setFaceCameraError] = useState("");
  const [faceStatusText, setFaceStatusText] = useState("Arahkan wajah santri ke kamera");
  const [faceDetected, setFaceDetected] = useState(false);
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    try {
      const saved = localStorage.getItem("epesantren_face_profiles");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

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

  // Otomatis pilih sesi Shalat Berjamaah sesuai jam saat ini
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
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
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

  // Fetch Santri & Presensi Logs & Shalat Berjamaah
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSantri, resAbs, resIzin, resSesi, resKelas] = await Promise.all([
        axios.get("/api/santri/for-presensi").catch(() => axios.get("/api/santri?all=true")),
        axios.get("/api/absensi/fingerprint").catch(() => ({ data: { data: [] } })),
        axios.get("/api/perizinan").catch(() => ({ data: { data: [] } })),
        axios.get("/api/absensi/sesi").catch(() => ({ data: { data: [] } })),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
      ]);

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
              hari_aktif: s.hari_aktif || "Setiap Hari",
            });
          }
        });
      }
      if (listBerjamaah.length === 0) listBerjamaah = DAFTAR_BERJAMAAH_DEFAULT;
      setDaftarBerjamaah(listBerjamaah);
      daftarBerjamaahRef.current = listBerjamaah;
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
      }

      const serverIzin = resIzin.data && Array.isArray(resIzin.data.data) ? resIzin.data.data : [];
      setIzinList(serverIzin);

      const serverLogs = resAbs.data && Array.isArray(resAbs.data.data) ? resAbs.data.data : [];
      setPresensiLogs(serverLogs);
    } catch (err) {
      console.warn("Gagal ambil data presensi berjamaah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          if (qrInstanceRef.current.isScanning) await qrInstanceRef.current.stop();
        } catch (e) {}
        try {
          qrInstanceRef.current.clear();
        } catch (e) {}
        qrInstanceRef.current = null;
      }

      const html5QrCode = new Html5QrcodeClass("mobile-qr-reader");
      qrInstanceRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decodedText) => handleQrDecoded(decodedText),
        () => {}
      );
      setScannerActive(true);
    } catch (err) {
      setCameraError("Izin kamera belum aktif atau tidak ditemukan.");
      setScannerActive(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      if (qrInstanceRef.current) {
        const instance = qrInstanceRef.current;
        qrInstanceRef.current = null;
        try {
          if (instance.isScanning) await instance.stop();
        } catch (e) {}
        try {
          instance.clear();
        } catch (e) {}
      }
    } catch (e) {
    } finally {
      setScannerActive(false);
      isStoppingRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    initFaceApiModels((msg) => {
      if (isMounted) setFaceStatusText(`🤖 ${msg}`);
    })
      .then(() => {
        if (isMounted) setFaceStatusText("✅ Model AI MediaPipe Siap");
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const startFaceCamera = async (facing = faceFacingMode) => {
    setFaceCameraError("");
    setIsFaceCameraActive(true);
    setFaceStatusText("Membuka kamera...");

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
      setFaceCameraError("Kamera tidak dapat diakses atau izin belum diberikan.");
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
    ctx.drawImage(video, sX, sY, size, size, 0, 0, 300, 300);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const startFaceDetectionLoop = () => {
    if (faceLoopIntervalRef.current) clearInterval(faceLoopIntervalRef.current);

    faceLoopIntervalRef.current = setInterval(async () => {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      if (canvas.width !== vW || canvas.height !== vH) {
        canvas.width = vW;
        canvas.height = vH;
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, vW, vH);

      const boxW = Math.min(vW * 0.72, 280);
      const boxH = Math.min(vH * 0.78, 320);
      const boxX = (vW - boxW) / 2;
      const boxY = (vH - boxH) / 2;

      ctx.lineWidth = 3;
      ctx.strokeStyle = faceDetected ? "#10b981" : "rgba(255, 255, 255, 0.4)";
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      if (faceCooldownRef.current) {
        setFaceStatusText("✅ Presensi Shalat Tercatat!");
      } else {
        autoDetectFaceTickRef.current = (autoDetectFaceTickRef.current || 0) + 1;
        if (autoDetectFaceTickRef.current % 3 === 0) {
          if (isDetectingRef.current) return;
          isDetectingRef.current = true;
          try {
            const registeredList = [];
            (santriListRef.current || []).forEach((s) => {
              let desc = normalizeDescriptor(s.face_descriptor);
              if (desc) {
                registeredList.push({
                  santri_id: s.id,
                  id: s.id,
                  nama_santri: s.nama_santri,
                  nama: s.nama_santri,
                  nis: s.nis,
                  descriptor: desc,
                });
              }
            });

            if (registeredList.length === 0) {
              setFaceDetected(false);
              setFaceStatusText("⚠️ Belum Ada Biometrik Wajah di Sistem");
              return;
            }

            if (isFaceModelReady()) {
              const faceRes = await detectFaceDescriptor(video);
              if (!faceRes) {
                matchedStreakRef.current = { id: null, count: 0 };
                setFaceDetected(false);
                setFaceStatusText("Arahkan wajah santri ke kamera...");
                return;
              }

              setFaceDetected(true);
              const matched = matchFaceDescriptor(faceRes.descriptor, registeredList, 0.28);

              if (matched && !matched.error && (matched.santri_id || matched.id)) {
                const mId = String(matched.santri_id || matched.id);
                const dbSantri = (santriListRef.current || []).find((s) => String(s.id) === mId) || matched;
                const displayName = dbSantri?.nama_santri || "Santri";

                const autoBerjamaah = detectActiveBerjamaahBySchedule(daftarBerjamaahRef.current);
                const curKegiatan = autoBerjamaah || selectedKegiatanRef.current || daftarBerjamaah[0];

                const todayStr = getTodayDateStr();
                const isAlreadyAttended = (presensiLogsRef.current || []).some((item) => {
                  const sameSantri = String(item.santri_id) === String(dbSantri.id);
                  const sameSesi = String(item.sesi_id) === String(curKegiatan?.id) || item.kegiatan === curKegiatan?.nama;
                  const itemTgl = normalizeDateStr(item.tanggal);
                  return sameSantri && sameSesi && (!itemTgl || itemTgl === todayStr);
                });

                if (isAlreadyAttended) {
                  setFaceStatusText(`⚠️ ${displayName} sudah hadir shalat`);
                  return;
                }

                if (!faceCooldownRef.current) {
                  faceCooldownRef.current = true;
                  setTimeout(() => {
                    faceCooldownRef.current = false;
                  }, 2600);

                  const snap = captureFaceSnapshot();
                  recordAttendance(dbSantri, "Hadir", "Kamera Wajah AI (Otomatis)", "", snap);
                  setLastScannedSantri({ ...dbSantri, snapshot: snap });
                  toastSuccess(`Presensi Masuk: ${displayName} (${curKegiatan?.nama || "Shalat"})`);
                }
              } else {
                setFaceStatusText("⛔ Wajah Belum Terdaftar");
              }
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

  const handleScanFaceLive = async () => {
    if (!isFaceCameraActive) {
      showError("Kamera Belum Aktif", "Nyalakan kamera wajah terlebih dahulu.");
      return;
    }
    const registeredList = [];
    (santriListRef.current || []).forEach((s) => {
      let desc = normalizeDescriptor(s.face_descriptor);
      if (desc) {
        registeredList.push({
          santri_id: s.id,
          id: s.id,
          nama_santri: s.nama_santri,
          descriptor: desc,
        });
      }
    });

    const video = faceVideoRef.current;
    const snap = captureFaceSnapshot();
    if (!video || !snap) return;

    try {
      const faceRes = await detectFaceDescriptor(video);
      if (!faceRes) {
        showError("Wajah Tidak Terdeteksi", "Wajah santri tidak terdeteksi di kamera.");
        return;
      }
      const matched = matchFaceDescriptor(faceRes.descriptor, registeredList, 0.28);
      if (matched && !matched.error) {
        const dbSantri = (santriListRef.current || []).find((s) => String(s.id) === String(matched.santri_id || matched.id));
        if (dbSantri) {
          recordAttendance(dbSantri, "Hadir Tepat Waktu", "Kamera Wajah AI (Manual Scan)", "", snap);
          setLastScannedSantri({ ...dbSantri, snapshot: snap });
          toastSuccess(`Wajah Dikenali: ${dbSantri.nama_santri}`);
        }
      } else {
        showError("Tidak Cocok", "Wajah santri tidak cocok dengan data terdaftar.");
      }
    } catch (e) {
      showError("Error Scan", e.message);
    }
  };

  const handleQrDecoded = (decodedText) => {
    if (scanCooldown) return;
    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 2200);

    const raw = String(decodedText).trim();
    let matchedSantri = santriList.find((s) => String(s.nis).trim() === raw || String(s.id) === raw);
    if (!matchedSantri) {
      matchedSantri = santriList.find((s) => s.nama_santri.toLowerCase().includes(raw.toLowerCase()));
    }

    if (matchedSantri) {
      playBeep();
      setLastScannedSantri(matchedSantri);
      recordAttendance(matchedSantri, "Hadir Tepat Waktu", "QR Code");
      toastSuccess(`Presensi Masuk: ${matchedSantri.nama_santri}`);
    } else {
      showError("QR Code Tidak Dikenali", `Data santri tidak ditemukan.`);
    }
  };

  const recordAttendance = async (santri, status = "Hadir Tepat Waktu", metode = "QR Code", ket = "", snapshot = null) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const dateStr = getTodayDateStr();

    const autoBerjamaah = detectActiveBerjamaahBySchedule(daftarBerjamaahRef.current);
    const targetKegiatan = autoBerjamaah || selectedBerjamaah || daftarBerjamaah[0] || { id: 1, nama: "Shalat Berjamaah", tipe: "Berjamaah" };

    playBeep(true);
    speakAttendance(santri.nama_santri, status);

    const isFaceScan = typeof metode === "string" && (metode.includes("Wajah") || metode.includes("Face") || metode.includes("AI"));

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
      tipe_presensi: "Berjamaah",
      auto_jadwal_berjamaah: isFaceScan,
      tempat: targetKegiatan.tempat,
      foto_bukti: snapshot || santri.foto || null,
    };

    const newRecord = { id: Date.now(), ...payload };
    setPresensiLogs((prev) => [newRecord, ...prev]);

    axios.post("/api/absensi/fingerprint", payload).catch((err) => {
      console.warn("Gagal simpan presensi berjamaah ke server:", err);
    });
  };

  const handleSwitchTab = (tabMode) => {
    setActiveMode(tabMode);
    if (tabMode === "face") {
      stopScanner();
      setTimeout(() => startFaceCamera(faceFacingMode), 80);
    } else if (tabMode === "qr") {
      stopFaceCamera();
      setTimeout(startScanner, 80);
    } else {
      stopScanner();
      stopFaceCamera();
    }
  };

  useEffect(() => {
    if (activeMode === "face") {
      startFaceCamera(faceFacingMode);
    } else if (activeMode === "qr") {
      startScanner();
    }
    return () => {
      stopScanner();
      stopFaceCamera();
    };
  }, []);

  const getSantriKelasLabel = (s) => {
    if (!s) return "";
    return s.nama_kelas || s.tingkat_diniyah || "";
  };

  const getSantriCurrentLog = (santri) => {
    const today = getTodayDateStr();
    return presensiLogs.find((l) => {
      const isToday = normalizeDateStr(l.tanggal) === today;
      const sameSantri = String(l.santri_id) === String(santri.id) || String(l.nis) === String(santri.nis);
      return isToday && sameSantri;
    });
  };

  const availableKelasOptions = React.useMemo(() => {
    const setK = new Set();
    (kelasList || []).forEach((k) => {
      if (k.nama_kelas) setK.add(String(k.nama_kelas).trim());
    });
    return Array.from(setK);
  }, [kelasList]);

  const santriInSelectedKelas = santriList.filter((s) => {
    if (filterManualKelas === "Semua") return true;
    return getSantriKelasLabel(s).toLowerCase() === filterManualKelas.toLowerCase();
  });

  const filteredSantri = santriInSelectedKelas.filter((s) => {
    const matchSearch = (s.nama_santri || "").toLowerCase().includes(searchManual.toLowerCase()) || (s.nis || "").includes(searchManual);
    const log = getSantriCurrentLog(s);
    if (filterManualStatus === "Hadir") return matchSearch && log;
    if (filterManualStatus === "Belum") return matchSearch && !log;
    return matchSearch;
  });

  const sessionSudahCount = santriList.filter((s) => getSantriCurrentLog(s)).length;
  const sessionTotal = santriList.length;
  const sessionPercent = sessionTotal > 0 ? Math.round((sessionSudahCount / sessionTotal) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
        <MobileLoadingState
          title="Menyiapkan Shalat Berjamaah..."
          subtitle="Sinkronisasi jadwal & data santri..."
          iconColor="#0284c7"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
      {/* Header Sesi Shalat Berjamaah */}
      <div
        style={{
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 45%, #1e40af 100%)",
          borderRadius: "18px",
          padding: "12px 14px",
          color: "#ffffff",
          marginBottom: "10px",
          boxShadow: "0 6px 18px -4px rgba(2, 132, 199, 0.32)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.86rem", fontWeight: 800 }}>🕌 Presensi Shalat Berjamaah</span>
          <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
            Jadwal Shalat 5 Waktu
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
            {daftarBerjamaah.map((k) => (
              <option key={k.id} value={k.id} style={{ color: "#0f172a", fontWeight: 700 }}>
                {k.nama} {k.jam_mulai_presensi ? `(${String(k.jam_mulai_presensi).substring(0, 5)})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={15} color="#ffffff" style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>

        {/* Progress Bar */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "6px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", color: "#e0f2fe" }}>
            <span>📍 {selectedBerjamaah?.tempat || "Masjid Jami"}</span>
            <span style={{ fontWeight: 800, color: "#fef08a" }}>{sessionSudahCount} / {sessionTotal} Santri ({sessionPercent}%)</span>
          </div>
          <div style={{ width: "100%", height: "4px", borderRadius: "999px", background: "rgba(255, 255, 255, 0.25)", overflow: "hidden" }}>
            <div style={{ width: `${sessionPercent}%`, height: "100%", borderRadius: "999px", background: "#22c55e", transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Tabs Mode: Wajah AI, Scan QR, Manual, Riwayat */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#ffffff", borderRadius: "13px", padding: "3.5px", marginBottom: "12px", gap: "4px", border: "1px solid #e2e8f0" }}>
        <button onClick={() => handleSwitchTab("face")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "face" ? "#e0f2fe" : "transparent", color: activeMode === "face" ? "#0284c7" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <Smile size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Wajah AI
        </button>
        <button onClick={() => handleSwitchTab("qr")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "qr" ? "#e0f2fe" : "transparent", color: activeMode === "qr" ? "#0284c7" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <QrCode size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Scan QR
        </button>
        <button onClick={() => handleSwitchTab("manual")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "manual" ? "#e0f2fe" : "transparent", color: activeMode === "manual" ? "#0284c7" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <ClipboardList size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Manual
        </button>
        <button onClick={() => handleSwitchTab("riwayat")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "riwayat" ? "#f3e8ff" : "transparent", color: activeMode === "riwayat" ? "#7c3aed" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <History size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Riwayat
        </button>
      </div>

      {/* Mode 1: Wajah AI */}
      {activeMode === "face" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "14px", border: "1.5px solid #0284c7", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>Kamera Presensi Berjamaah</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={toggleFaceFacingMode} style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#0284c7", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                <RotateCcw size={12} style={{ verticalAlign: "middle", marginRight: "2px" }} /> Putar
              </button>
              <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: soundEnabled ? "#ecfdf5" : "#fef2f2", color: soundEnabled ? "#059669" : "#dc2626", cursor: "pointer" }}>
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          <div style={{ width: "100%", aspectRatio: "4/3", minHeight: "260px", borderRadius: "16px", overflow: "hidden", background: "#090d16", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <video ref={faceVideoRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", transform: faceFacingMode === "user" ? "scaleX(-1)" : "none", display: isFaceCameraActive ? "block" : "none" }} />
            <canvas ref={faceCanvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            {isFaceCameraActive && (
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", background: "rgba(15, 23, 42, 0.85)", color: "#fff", fontSize: "0.74rem", fontWeight: 700, padding: "7px 12px", borderRadius: "10px", textAlign: "center" }}>
                {faceStatusText}
              </div>
            )}
          </div>

          <button onClick={handleScanFaceLive} style={{ width: "100%", marginTop: "12px", padding: "10px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "#ffffff", borderRadius: "12px", border: "none", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer" }}>
            🔍 Pindai Manual (Ambil Foto)
          </button>
        </div>
      )}

      {/* Mode 2: Scan QR */}
      {activeMode === "qr" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "14px", border: "1.5px solid #0284c7", marginBottom: "14px" }}>
          <div id="mobile-qr-reader" style={{ width: "100%", minHeight: "260px", borderRadius: "16px", overflow: "hidden" }} />
          {cameraError && <div style={{ color: "#dc2626", fontSize: "0.74rem", marginTop: "8px" }}>{cameraError}</div>}
        </div>
      )}

      {/* Mode 3: Manual */}
      {activeMode === "manual" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Cari santri..."
              value={searchManual}
              onChange={(e) => setSearchManual(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "0.8rem", outline: "none" }}
            />
            <select
              value={filterManualKelas}
              onChange={(e) => setFilterManualKelas(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "0.8rem", outline: "none", background: "#fff" }}
            >
              <option value="Semua">Semua Kelas</option>
              {availableKelasOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredSantri.map((s) => {
              const log = getSantriCurrentLog(s);
              return (
                <div key={s.id} style={{ background: "#fff", borderRadius: "12px", padding: "10px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{s.nama_santri}</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>NIS: {s.nis || "-"} • {getSantriKelasLabel(s)}</div>
                  </div>
                  <div>
                    {log ? (
                      <span style={{ background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>✓ Hadir</span>
                    ) : (
                      <button onClick={() => recordAttendance(s, "Hadir")} style={{ padding: "5px 12px", borderRadius: "8px", border: "none", background: "#0284c7", color: "#fff", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>
                        Hadirkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 4: Riwayat */}
      {activeMode === "riwayat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {presensiLogs.filter((l) => String(l.tipe_presensi || "").toLowerCase() === "berjamaah" || /shalat|subuh|dzuhur|ashar|maghrib|isya/i.test(l.kegiatan || "")).map((log) => (
            <div key={log.id} style={{ background: "#fff", borderRadius: "12px", padding: "10px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{log.nama_santri}</div>
                <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{log.kegiatan} • {log.waktu_scan || "00:00"} WIB</div>
              </div>
              <span style={{ background: "#ecfdf5", color: "#059669", padding: "3px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>
                {log.status_kehadiran || log.status || "Hadir"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
