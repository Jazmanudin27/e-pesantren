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
  BookOpen,
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

export default function MobilePresensiMengaji() {
  const [activeMode, setActiveMode] = useState("manual");
  const [daftarMengaji, setDaftarMengaji] = useState([]);
  const [selectedMengaji, setSelectedMengaji] = useState(null);
  const [selectedMengajiKelas, setSelectedMengajiKelas] = useState("");

  const currentVerifikator = (() => {
    try {
      const u = JSON.parse(
        localStorage.getItem("desktop_session") ||
        sessionStorage.getItem("desktop_session") ||
        localStorage.getItem("mobile_session") ||
        sessionStorage.getItem("mobile_session") ||
        "{}"
      );
      return u.nama || u.nama_asatidz || u.nama_lengkap || u.username || "Ustadz Pengajar";
    } catch (e) {
      return "Ustadz Pengajar";
    }
  })();

  // Data State (Lazy load per kelas)
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [presensiLogs, setPresensiLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingKelasSantri, setLoadingKelasSantri] = useState(false);
  const [searchManual, setSearchManual] = useState("");
  const [filterManualStatus, setFilterManualStatus] = useState("Semua");
  const [searchRiwayat, setSearchRiwayat] = useState("");
  const [refreshingRiwayat, setRefreshingRiwayat] = useState(false);

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

  // Face Recognition State
  const [faceFacingMode, setFaceFacingMode] = useState("user");
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceCameraError, setFaceCameraError] = useState("");
  const [faceStatusText, setFaceStatusText] = useState("Arahkan wajah santri ke kamera");
  const [faceDetected, setFaceDetected] = useState(false);

  // Refs
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const faceCooldownRef = useRef(false);
  const autoDetectFaceTickRef = useRef(0);
  const isDetectingRef = useRef(false);
  const matchedStreakRef = useRef({ id: null, count: 0 });

  const santriListRef = useRef(santriList);
  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  const presensiLogsRef = useRef(presensiLogs);
  useEffect(() => {
    presensiLogsRef.current = presensiLogs;
  }, [presensiLogs]);

  const selectedMengajiRef = useRef(selectedMengaji);
  useEffect(() => {
    selectedMengajiRef.current = selectedMengaji;
  }, [selectedMengaji]);

  const selectedMengajiKelasRef = useRef(selectedMengajiKelas);
  useEffect(() => {
    selectedMengajiKelasRef.current = selectedMengajiKelas;
  }, [selectedMengajiKelas]);

  // Load santri khusus berdasarkan kelas (Lazy load hemat memori)
  const loadSantriByKelas = async (targetKelas) => {
    if (!targetKelas || targetKelas === "Semua") {
      setSantriList([]);
      return;
    }
    setLoadingKelasSantri(true);
    try {
      const res = await axios.get(`/api/santri/by-kelas/${encodeURIComponent(targetKelas)}`);
      const rows = res.data?.data || [];
      setSantriList(rows);
    } catch (err) {
      console.warn("Gagal load santri by kelas:", err);
    } finally {
      setLoadingKelasSantri(false);
    }
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

  // Initial Fetch: Ambil Kelas, Materi, Sesi & Log
  const fetchData = async () => {
    try {
      setLoading(true);

      let santriPromise;
      const savedKelas = selectedMengajiKelasRef.current || selectedMengajiKelas;
      if (savedKelas && savedKelas !== "Semua") {
        santriPromise = axios.get(`/api/santri/by-kelas/${encodeURIComponent(savedKelas)}`).catch(() => ({ data: { data: [] } }));
      } else {
        santriPromise = Promise.resolve({ data: { data: [] } });
      }

      const [resSantri, resAbs, resMateri, resSesi, resKelas] = await Promise.all([
        santriPromise,
        axios.get("/api/absensi/fingerprint?today=true&tipe=kegiatan").catch(() => ({ data: { data: [] } })),
        axios.get("/api/materi-hafalan").catch(() => ({ data: { data: [] } })),
        axios.get("/api/absensi/sesi").catch(() => ({ data: { data: [] } })),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
      ]);

      const rawKelas = resKelas.data?.data || [];
      if (Array.isArray(rawKelas)) setKelasList(rawKelas);

      const isShalatWord = (str) =>
        /shalat|sholat|subuh|shubuh|dzuhur|zuhur|ashar|asar|maghrib|magrib|isya|dhuha|berjamaah/i.test(
          String(str || "")
        );

      let listMengaji = [];
      const rawMateri = resMateri.data?.data || [];
      if (Array.isArray(rawMateri) && rawMateri.length > 0) {
        rawMateri.forEach((m, idx) => {
          if (!isShalatWord(m.nama_materi) && !isShalatWord(m.kategori)) {
            listMengaji.push({
              id: m.id ? Number(m.id) : (idx + 1),
              nama: m.nama_materi,
              kategori: m.kategori || "Kegiatan Mengaji",
              tempat: m.deskripsi || "Gedung Madrasah",
              tipe: "Kegiatan",
            });
          }
        });
      }

      const rawSesi = resSesi.data?.data || [];
      if (Array.isArray(rawSesi) && rawSesi.length > 0) {
        rawSesi.forEach((s, idx) => {
          if (!isShalatWord(s.nama_sesi) && !isShalatWord(s.kategori)) {
            const alreadyExists = listMengaji.some(
              (k) => k.nama.trim().toLowerCase() === (s.nama_sesi || "").trim().toLowerCase()
            );
            if (!alreadyExists && s.nama_sesi) {
              listMengaji.push({
                id: s.id ? Number(s.id) : (100 + idx + 1),
                nama: s.nama_sesi,
                kategori: s.kategori || "Kegiatan Sesi",
                tempat: s.keterangan || "Komplek Pesantren",
                tipe: "Kegiatan",
              });
            }
          }
        });
      }

      setDaftarMengaji(listMengaji);
      setSelectedMengaji((prev) => {
        if (prev && listMengaji.some((k) => String(k.id) === String(prev.id))) {
          return listMengaji.find((k) => String(k.id) === String(prev.id));
        }
        return null;
      });

      if (resSantri.data && resSantri.data.data) {
        setSantriList(resSantri.data.data);
      }

      setPresensiLogs(resAbs.data?.data || []);
    } catch (err) {
      console.warn("Gagal ambil data presensi mengaji:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem("epesantren_mengaji_selected_kegiatan");
      localStorage.removeItem("epesantren_mengaji_selected_kelas");
    } catch (e) {}
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
      const container = document.getElementById("mobile-qr-reader-mengaji");
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

      const html5QrCode = new Html5QrcodeClass("mobile-qr-reader-mengaji");
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

  // Lazy Load AI Models: Hanya muat MediaPipe saat Musyrif membuka tab Wajah AI
  useEffect(() => {
    if (activeMode !== "face") return;
    let isMounted = true;
    const timer = setTimeout(() => {
      initFaceApiModels((msg) => {
        if (isMounted) setFaceStatusText(`🤖 ${msg}`);
      })
        .then(() => {
          if (isMounted) setFaceStatusText("✅ Model AI MediaPipe Siap");
        })
        .catch(() => {});
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeMode]);

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
      ctx.strokeStyle = faceDetected ? "#059669" : "rgba(255, 255, 255, 0.4)";
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      if (faceCooldownRef.current) {
        setFaceStatusText("✅ Presensi Mengaji Tercatat!");
      } else {
        autoDetectFaceTickRef.current = (autoDetectFaceTickRef.current || 0) + 1;
        if (autoDetectFaceTickRef.current % 3 === 0) {
          if (isDetectingRef.current) return;
          isDetectingRef.current = true;
          try {
            // Wajib Kegiatan & Kelas Dipilih!
            const curKeg = selectedMengajiRef.current;
            const curKls = selectedMengajiKelasRef.current;
            if (!curKeg || !curKeg.id || !curKls) {
              setFaceDetected(false);
              setFaceStatusText("⚠️ Wajib pilih Kegiatan & Kelas terlebih dahulu");
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
                  nama: s.nama_santri,
                  nis: s.nis,
                  descriptor: desc,
                });
              }
            });

            if (registeredList.length === 0) {
              setFaceDetected(false);
              setFaceStatusText(`⚠️ Belum ada foto biometrik di Kelas "${curKls}"`);
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

                const todayStr = getTodayDateStr();
                const isAlreadyAttended = (presensiLogsRef.current || []).some((item) => {
                  const sameSantri = String(item.santri_id) === String(dbSantri.id);
                  const sameSesi = String(item.sesi_id) === String(curKeg.id) || item.kegiatan === curKeg.nama;
                  const itemTgl = normalizeDateStr(item.tanggal);
                  return sameSantri && sameSesi && (!itemTgl || itemTgl === todayStr);
                });

                if (isAlreadyAttended) {
                  setFaceStatusText(`⚠️ ${displayName} sudah hadir mengaji`);
                  return;
                }

                if (!faceCooldownRef.current) {
                  faceCooldownRef.current = true;
                  setTimeout(() => {
                    faceCooldownRef.current = false;
                  }, 2600);

                  const snap = captureFaceSnapshot();
                  recordAttendance(dbSantri, "Hadir", "Kamera Wajah AI (Otomatis)", `Kelas: ${curKls}`, snap);
                  setLastScannedSantri({ ...dbSantri, snapshot: snap });
                  toastSuccess(`Presensi Mengaji: ${displayName} (${curKeg.nama})`);
                }
              } else {
                setFaceStatusText("⛔ Wajah Tidak Dikenali di Kelas Ini");
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
    if (!selectedMengaji?.id || !selectedMengajiKelas) {
      showError("Pilih Kegiatan & Kelas", "Wajib pilih Kegiatan Mengaji dan Kelas santri di atas terlebih dahulu.");
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
          recordAttendance(dbSantri, "Hadir Tepat Waktu", "Kamera Wajah AI (Manual Scan)", `Kelas: ${selectedMengajiKelas}`, snap);
          setLastScannedSantri({ ...dbSantri, snapshot: snap });
          toastSuccess(`Wajah Dikenali: ${dbSantri.nama_santri}`);
        }
      } else {
        showError("Tidak Cocok", `Wajah tidak ditemukan pada santri Kelas ${selectedMengajiKelas}.`);
      }
    } catch (e) {
      showError("Error Scan", e.message);
    }
  };

  const handleQrDecoded = (decodedText) => {
    if (scanCooldown) return;
    setScanCooldown(true);
    setTimeout(() => setScanCooldown(false), 2200);

    if (!selectedMengaji?.id || !selectedMengajiKelas) {
      playBeep(false);
      showError("Pilih Kegiatan & Kelas", "Wajib pilih Kegiatan Mengaji dan Kelas santri di atas terlebih dahulu.");
      return;
    }

    const raw = String(decodedText).trim();
    let matchedSantri = santriList.find((s) => String(s.nis).trim() === raw || String(s.id) === raw);
    if (!matchedSantri) {
      matchedSantri = santriList.find((s) => s.nama_santri.toLowerCase().includes(raw.toLowerCase()));
    }

    if (matchedSantri) {
      playBeep();
      setLastScannedSantri(matchedSantri);
      recordAttendance(matchedSantri, "Hadir Tepat Waktu", "QR Code", `Kelas: ${selectedMengajiKelas}`);
      toastSuccess(`Presensi Masuk: ${matchedSantri.nama_santri}`);
    } else {
      showError("Santri Tidak Ditemukan", `Santri dengan QR tersebut tidak terdaftar di Kelas "${selectedMengajiKelas}".`);
    }
  };

  const recordAttendance = async (santri, status = "Hadir Tepat Waktu", metode = "QR Code", ket = "", snapshot = null) => {
    // 1. Wajib Pilih Kegiatan Mengaji Mutlak!
    if (!selectedMengaji || !selectedMengaji.nama || !String(selectedMengaji.nama).trim()) {
      showError("Pilih Kegiatan Mengaji", "Wajib memilih Kegiatan Mengaji terlebih dahulu di dropdown atas sebelum menyimpan presensi!");
      return;
    }

    // 2. Wajib Pilih Kelas Santri Mutlak!
    if (!selectedMengajiKelas || !String(selectedMengajiKelas).trim()) {
      showError("Pilih Kelas Santri", "Wajib memilih Kelas santri terlebih dahulu di dropdown atas sebelum menyimpan presensi!");
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const dateStr = getTodayDateStr();

    const targetKegiatan = selectedMengaji;

    playBeep(true);
    speakAttendance(santri.nama_santri, status);

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
      musyrif_verifikator: currentVerifikator,
      nama_ustadz: currentVerifikator,
      keterangan: ket || (selectedMengajiKelas ? `Kelas: ${selectedMengajiKelas}` : (santri.nama_kelas ? `Kelas: ${santri.nama_kelas}` : "")),
      nama_santri: santri.nama_santri,
      nama_kelas: santri.nama_kelas || selectedMengajiKelas || "",
      nama_sesi: targetKegiatan.nama,
      kegiatan: targetKegiatan.nama,
      nama_kegiatan: targetKegiatan.nama,
      tipe_presensi: "Kegiatan",
      tempat: targetKegiatan.tempat || "Gedung Madrasah",
      foto_bukti: snapshot || santri.foto || null,
    };

    const newRecord = { id: Date.now(), ...payload };
    setPresensiLogs((prev) => [newRecord, ...prev]);

    axios.post("/api/absensi/fingerprint", payload).catch((err) => {
      console.warn("Gagal simpan presensi mengaji ke server:", err);
    });
  };

  const handleRefreshRiwayat = async () => {
    setRefreshingRiwayat(true);
    try {
      const todayStr = getTodayDateStr();
      const res = await axios.get(`/api/absensi/fingerprint?tanggal=${todayStr}&tipe=kegiatan`);
      const serverLogs = res.data?.data;
      if (Array.isArray(serverLogs)) {
        setPresensiLogs((prev) => {
          const serverKeys = new Set(
            serverLogs.map(
              (l) => `${l.santri_id}__${normalizeDateStr(l.tanggal)}__${(l.kegiatan || l.nama_sesi || l.nama_kegiatan || "").toLowerCase()}`
            )
          );
          const pendingLogs = prev.filter((l) => {
            const key = `${l.santri_id}__${normalizeDateStr(l.tanggal)}__${(l.kegiatan || l.nama_sesi || l.nama_kegiatan || "").toLowerCase()}`;
            return !serverKeys.has(key);
          });
          return [...pendingLogs, ...serverLogs];
        });
      }
    } catch (e) {
      console.warn("Gagal refresh data presensi:", e);
    } finally {
      setRefreshingRiwayat(false);
    }
  };

  const handleSwitchTab = (tabMode) => {
    setActiveMode(tabMode);
    if (tabMode === "face") {
      stopScanner();
      setTimeout(() => startFaceCamera(faceFacingMode), 80);
    } else if (tabMode === "riwayat") {
      stopScanner();
      stopFaceCamera();
      handleRefreshRiwayat();
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

  const getSantriCurrentLog = (santri) => {
    const today = getTodayDateStr();
    return presensiLogs.find((l) => {
      const isToday = normalizeDateStr(l.tanggal) === today;
      const sameSantri = String(l.santri_id) === String(santri.id) || String(l.nis) === String(santri.nis);
      const sameKegiatan = selectedMengaji && (String(l.sesi_id) === String(selectedMengaji.id) || l.kegiatan === selectedMengaji.nama);
      return isToday && sameSantri && sameKegiatan;
    });
  };

  const availableKelasOptions = React.useMemo(() => {
    const setK = new Set();
    (kelasList || []).forEach((k) => {
      if (k.nama_kelas) setK.add(String(k.nama_kelas).trim());
    });
    return Array.from(setK);
  }, [kelasList]);

  const filteredSantri = santriList.filter((s) => {
    const matchSearch = (s.nama_santri || "").toLowerCase().includes(searchManual.toLowerCase()) || (s.nis || "").includes(searchManual);
    const log = getSantriCurrentLog(s);
    if (filterManualStatus === "Hadir") return matchSearch && log;
    if (filterManualStatus === "Belum") return matchSearch && !log;
    return matchSearch;
  });

  // Filter Riwayat khusus berdasarkan Kegiatan Mengaji & Kelas Terpilih
  const filteredRiwayatLogs = React.useMemo(() => {
    return presensiLogs.filter((log) => {
      // 1. Abaikan shalat
      const isShalat = /shalat|sholat|subuh|dzuhur|ashar|maghrib|isya|berjamaah/i.test(
        String(log.kegiatan || log.nama_sesi || "")
      );
      if (isShalat) return false;

      // 2. Filter Kategori / Kegiatan Mengaji
      if (selectedMengaji) {
        const targetKegiatan = String(selectedMengaji.nama || "").trim().toLowerCase();
        const logKegiatan = String(log.kegiatan || log.nama_sesi || log.nama_kegiatan || "").trim().toLowerCase();
        const matchId = log.sesi_id && String(log.sesi_id) === String(selectedMengaji.id);
        const matchNama =
          logKegiatan === targetKegiatan ||
          (logKegiatan && targetKegiatan && (logKegiatan.includes(targetKegiatan) || targetKegiatan.includes(logKegiatan)));
        if (!matchId && !matchNama) return false;
      }

      // 3. Filter Kelas Santri
      if (selectedMengajiKelas) {
        const targetKelas = String(selectedMengajiKelas).trim().toLowerCase();
        const ketStr = String(log.keterangan || "").toLowerCase();
        const klsStr = String(log.nama_kelas || log.kelas || "").toLowerCase();
        const inSantriList = santriList.length > 0 && santriList.some(
          (s) =>
            String(s.id) === String(log.santri_id) ||
            (s.nis && String(s.nis) === String(log.nis))
        );

        const matchKet = ketStr.includes(targetKelas);
        const matchKls = klsStr === targetKelas || klsStr.includes(targetKelas);

        if (!inSantriList && !matchKet && !matchKls) return false;
      }

      // 4. Filter Search teks riwayat jika user mengetik
      if (searchRiwayat && searchRiwayat.trim()) {
        const q = searchRiwayat.toLowerCase();
        const namaMatch = String(log.nama_santri || "").toLowerCase().includes(q);
        const nisMatch = String(log.nis || "").toLowerCase().includes(q);
        if (!namaMatch && !nisMatch) return false;
      }

      return true;
    });
  }, [presensiLogs, selectedMengaji, selectedMengajiKelas, santriList, searchRiwayat]);

  const sessionSudahCount = santriList.filter((s) => getSantriCurrentLog(s)).length;
  const sessionTotal = santriList.length;
  const sessionPercent = sessionTotal > 0 ? Math.round((sessionSudahCount / sessionTotal) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
        <MobileLoadingState
          title="Menyiapkan Presensi Mengaji..."
          subtitle="Sinkronisasi data kegiatan..."
          iconColor="#059669"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: "#f8fafc", padding: "14px 14px 40px", fontFamily: "'Inter', sans-serif" }}>
      {/* Header Kegiatan Mengaji (2 Dropdown Wajib: Kegiatan & Kelas) */}
      <div
        style={{
          background: "linear-gradient(135deg, #059669 0%, #047857 45%, #064e3b 100%)",
          borderRadius: "18px",
          padding: "12px 14px",
          color: "#ffffff",
          marginBottom: "10px",
          boxShadow: "0 6px 18px -4px rgba(5, 150, 105, 0.32)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "0.86rem", fontWeight: 800 }}>📖 Presensi Kegiatan Mengaji</span>
          <span style={{ fontSize: "0.68rem", background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
            Kajian & Halaqah
          </span>
        </div>

        {/* 2 Dropdown Bertingkat: Kegiatan & Kelas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "7px", marginBottom: "8px" }}>
          {/* Dropdown 1: Kegiatan Mengaji */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedMengaji?.id || ""}
              onChange={(e) => {
                const k = daftarMengaji.find((x) => String(x.id) === String(e.target.value));
                setSelectedMengaji(k || null);
              }}
              style={{
                width: "100%",
                padding: "9px 32px 9px 12px",
                borderRadius: "11px",
                border: !selectedMengaji?.id ? "2px solid #facc15" : "1px solid rgba(255, 255, 255, 0.32)",
                background: !selectedMengaji?.id ? "rgba(234, 179, 8, 0.28)" : "rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(10px)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 800,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="" style={{ color: "#0f172a", fontWeight: 700 }}>
                -- 1. Wajib Pilih Kegiatan Mengaji --
              </option>
              {daftarMengaji.map((k) => (
                <option key={k.id} value={k.id} style={{ color: "#0f172a", fontWeight: 700 }}>
                  📖 {k.nama}
                </option>
              ))}
            </select>
            <ChevronDown size={15} color="#ffffff" style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>

          {/* Dropdown 2: Kelas Santri (Lazy load data) */}
          <div style={{ position: "relative" }}>
            <select
              value={selectedMengajiKelas}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMengajiKelas(val);
                loadSantriByKelas(val);
              }}
              style={{
                width: "100%",
                padding: "9px 32px 9px 12px",
                borderRadius: "11px",
                border: !selectedMengajiKelas ? "2px solid #facc15" : "1px solid rgba(255, 255, 255, 0.32)",
                background: !selectedMengajiKelas ? "rgba(234, 179, 8, 0.28)" : "rgba(255, 255, 255, 0.16)",
                backdropFilter: "blur(10px)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 800,
                outline: "none",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="" style={{ color: "#0f172a", fontWeight: 700 }}>
                -- 2. Wajib Pilih Kelas Santri --
              </option>
              {availableKelasOptions.map((kls) => (
                <option key={kls} value={kls} style={{ color: "#0f172a", fontWeight: 700 }}>
                  🏫 Kelas: {kls}
                </option>
              ))}
            </select>
            <ChevronDown size={15} color="#ffffff" style={{ position: "absolute", right: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            {loadingKelasSantri && (
              <div style={{ position: "absolute", right: "32px", top: "50%", transform: "translateY(-50%)", fontSize: "0.66rem", color: "#fef08a", fontWeight: 700 }}>
                Memuat...
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "10px", padding: "6px 10px", display: "flex", flexDirection: "column", gap: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.66rem", color: "#e0f2fe" }}>
            <span>📍 {selectedMengaji?.tempat || "Gedung Madrasah"}</span>
            <span style={{ fontWeight: 800, color: "#fef08a" }}>
              {selectedMengajiKelas ? `${sessionSudahCount} / ${sessionTotal} Santri (${sessionPercent}%)` : "Pilih Kelas Terlebih Dahulu"}
            </span>
          </div>
          <div style={{ width: "100%", height: "4px", borderRadius: "999px", background: "rgba(255, 255, 255, 0.25)", overflow: "hidden" }}>
            <div style={{ width: `${sessionPercent}%`, height: "100%", borderRadius: "999px", background: "#22c55e", transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Tabs Mode (Wajah AI, Manual, Riwayat - Tanpa Scan QR) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#ffffff", borderRadius: "13px", padding: "3.5px", marginBottom: "12px", gap: "4px", border: "1px solid #e2e8f0" }}>
        <button onClick={() => handleSwitchTab("face")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "face" ? "#dcfce7" : "transparent", color: activeMode === "face" ? "#059669" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <Smile size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Wajah AI
        </button>
        <button onClick={() => handleSwitchTab("manual")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "manual" ? "#dcfce7" : "transparent", color: activeMode === "manual" ? "#059669" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <ClipboardList size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Manual
        </button>
        <button onClick={() => handleSwitchTab("riwayat")} style={{ padding: "7px 2px", borderRadius: "9px", border: "none", background: activeMode === "riwayat" ? "#f3e8ff" : "transparent", color: activeMode === "riwayat" ? "#7c3aed" : "#64748b", fontWeight: 800, fontSize: "0.68rem", cursor: "pointer" }}>
          <History size={13} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Riwayat ({filteredRiwayatLogs.length})
        </button>
      </div>

      {/* Mode 1: Wajah AI */}
      {activeMode === "face" && (
        <div style={{ background: "#ffffff", borderRadius: "20px", padding: "14px", border: "1.5px solid #059669", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f172a" }}>Kamera Presensi Mengaji</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={toggleFaceFacingMode} style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", color: "#059669", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}>
                <RotateCcw size={12} style={{ verticalAlign: "middle", marginRight: "2px" }} /> Putar
              </button>
              <button onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid #cbd5e1", background: soundEnabled ? "#ecfdf5" : "#fef2f2", color: soundEnabled ? "#059669" : "#dc2626", cursor: "pointer" }}>
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          {/* Banner Status Siap Scan */}
          {selectedMengaji?.id && selectedMengajiKelas && (
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "6px 12px", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, color: "#065f46" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span>📖 {selectedMengaji.nama}</span>
                <span style={{ color: "#9ca3af" }}>•</span>
                <span>🏫 Kelas: {selectedMengajiKelas}</span>
              </div>
              <span style={{ background: "#059669", color: "#ffffff", padding: "1.5px 7px", borderRadius: "999px", fontSize: "0.62rem" }}>
                Siap Scan
              </span>
            </div>
          )}

          {/* Video Container with Locked Overlay */}
          <div style={{ width: "100%", aspectRatio: "4/3", minHeight: "260px", borderRadius: "16px", overflow: "hidden", background: "#090d16", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(!selectedMengaji?.id || !selectedMengajiKelas) && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(6px)", zIndex: 15, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", color: "#ffffff" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.2)", border: "1.5px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                  <BookOpen size={24} color="#fbbf24" />
                </div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", marginBottom: "5px" }}>Pilih Kegiatan & Kelas Dahulu!</div>
                <div style={{ fontSize: "0.72rem", color: "#cbd5e1", maxWidth: "260px", lineHeight: 1.35, marginBottom: "12px" }}>
                  Tentukan <strong>Kegiatan Mengaji</strong> dan <strong>Kelas</strong> di dropdown atas sebelum scan wajah dimulai.
                </div>
              </div>
            )}

            <video ref={faceVideoRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", transform: faceFacingMode === "user" ? "scaleX(-1)" : "none", display: isFaceCameraActive ? "block" : "none" }} />
            <canvas ref={faceCanvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            {isFaceCameraActive && (
              <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", background: "rgba(15, 23, 42, 0.85)", color: "#fff", fontSize: "0.74rem", fontWeight: 700, padding: "7px 12px", borderRadius: "10px", textAlign: "center" }}>
                {faceStatusText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Manual */}
      {activeMode === "manual" && (
        <div>
          {(!selectedMengaji?.id || !selectedMengajiKelas) && (
            <div style={{ textAlign: "center", padding: "16px 14px", background: "#fefce8", borderRadius: "14px", border: "1.5px solid #fef08a", color: "#854d0e", fontSize: "0.78rem", fontWeight: 700, marginBottom: "12px" }}>
              ⚠️ Wajib pilih <strong>Kegiatan Mengaji</strong> dan <strong>Kelas</strong> di atas terlebih dahulu sebelum mencatat kehadiran.
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Cari santri..."
              value={searchManual}
              onChange={(e) => setSearchManual(e.target.value)}
              style={{ flex: 1, padding: "9px 12px", borderRadius: "12px", border: "1.5px solid #e2e8f0", fontSize: "0.8rem", outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredSantri.map((s) => {
              const log = getSantriCurrentLog(s);
              const isLocked = !selectedMengaji?.id || !selectedMengajiKelas;
              return (
                <div key={s.id} style={{ background: "#fff", borderRadius: "12px", padding: "10px 14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{s.nama_santri}</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>NIS: {s.nis || "-"} • Kelas: {selectedMengajiKelas || "-"}</div>
                  </div>
                  <div>
                    {log ? (
                      <span style={{ background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800 }}>✓ Hadir</span>
                    ) : (
                      <button 
                        onClick={() => recordAttendance(s, "Hadir", "Manual")} 
                        disabled={isLocked}
                        style={{ 
                          padding: "5px 12px", 
                          borderRadius: "8px", 
                          border: "none", 
                          background: isLocked ? "#cbd5e1" : "#059669", 
                          color: "#fff", 
                          fontSize: "0.72rem", 
                          fontWeight: 700, 
                          cursor: isLocked ? "not-allowed" : "pointer" 
                        }}
                      >
                        Hadirkan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredSantri.length === 0 && (
              <div style={{ textAlign: "center", padding: "30px 16px", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>
                {!selectedMengajiKelas ? "👆 Silakan pilih Kelas santri di atas terlebih dahulu untuk memuat daftar santri." : "Santri tidak ditemukan di kelas ini."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 4: Riwayat Khusus Kegiatan & Kelas Terpilih */}
      {activeMode === "riwayat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Header Info Riwayat Terfilter */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                Riwayat: {selectedMengaji?.nama || "Semua Kegiatan"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                {selectedMengajiKelas ? `Kelas: ${selectedMengajiKelas}` : "Semua Kelas"} • <strong>{filteredRiwayatLogs.length} Kehadiran</strong>
              </div>
            </div>
            <button
              onClick={handleRefreshRiwayat}
              disabled={refreshingRiwayat}
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
              <RefreshCw size={12} className={refreshingRiwayat ? "animate-spin" : ""} />
              {refreshingRiwayat ? "Memuat..." : "Segarkan"}
            </button>
          </div>

          {/* Search Box Riwayat */}
          {(filteredRiwayatLogs.length > 3 || searchRiwayat) && (
            <input
              type="text"
              placeholder="Cari santri di riwayat ini..."
              value={searchRiwayat}
              onChange={(e) => setSearchRiwayat(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1.5px solid #e2e8f0",
                fontSize: "0.78rem",
                outline: "none",
                marginBottom: "2px",
                background: "#ffffff",
              }}
            />
          )}

          {/* Warning jika belum pilih kegiatan atau kelas */}
          {(!selectedMengaji || !selectedMengajiKelas) && (
            <div
              style={{
                background: "#fefce8",
                border: "1px solid #fef08a",
                borderRadius: "12px",
                padding: "12px 14px",
                textAlign: "center",
                color: "#854d0e",
                fontSize: "0.76rem",
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: "3px" }}>
                ⚠️ Filter Belum Lengkap
              </div>
              <div>
                Pilih <strong>{!selectedMengaji ? "Kegiatan Mengaji" : "Kelas Santri"}</strong> di kotak atas untuk memfilter riwayat secara akurat.
              </div>
            </div>
          )}

          {/* List Kartu Riwayat */}
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
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#0f172a" }}>
                  {log.nama_santri}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "2px" }}>
                  <span style={{ color: "#059669", fontWeight: 700 }}>
                    {log.kegiatan || log.nama_sesi || log.nama_kegiatan || selectedMengaji?.nama || "Kegiatan Mengaji"}
                  </span>
                  {" • "}
                  <span>
                    {log.keterangan || (selectedMengajiKelas ? `Kelas: ${selectedMengajiKelas}` : (log.nama_kelas ? `Kelas: ${log.nama_kelas}` : ""))}
                  </span>
                  {" • "}
                  <span>{log.waktu_scan ? String(log.waktu_scan).substring(0, 8) : "00:00:00"} WIB</span>
                  {(log.musyrif_verifikator || log.nama_ustadz) && (
                    <>
                      {" • "}
                      <span style={{ color: "#4f46e5", fontWeight: 700 }}>
                        Musyrif: {log.musyrif_verifikator || log.nama_ustadz}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span
                style={{
                  background: "#ecfdf5",
                  color: "#059669",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                ✓ {log.status_kehadiran || log.status || "Hadir"}
              </span>
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
                Belum Ada Riwayat Presensi
              </div>
              <div style={{ fontSize: "0.72rem", marginTop: "4px" }}>
                {selectedMengaji && selectedMengajiKelas
                  ? `Belum ada santri yang presensi untuk kegiatan "${selectedMengaji.nama}" di kelas "${selectedMengajiKelas}".`
                  : "Silakan tentukan kegiatan dan kelas santri di atas."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
