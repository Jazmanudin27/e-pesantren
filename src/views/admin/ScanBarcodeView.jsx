import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  RotateCw,
  Search,
  Trash2,
  Calendar,
  Volume2,
  VolumeX,
  Sparkles,
  Building,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  UserCheck,
  UserPlus,
  Smile,
  Video,
  VideoOff,
  Check,
  X,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";

export default function ScanBarcodeView() {
  const [santriList, setSantriList] = useState([]);
  const [sesiList, setSesiList] = useState([
    { id: 1, kode: "SHALAT-SHUBUH", nama: "Shalat Shubuh Berjamaah" },
    { id: 2, kode: "SHALAT-DZUHUR", nama: "Shalat Dzuhur Berjamaah" },
    { id: 3, kode: "SHALAT-ASHAR", nama: "Shalat Ashar Berjamaah" },
    { id: 4, kode: "SHALAT-MAGHRIB", nama: "Shalat Maghrib Berjamaah" },
    { id: 5, kode: "SHALAT-ISYA", nama: "Shalat Isya Berjamaah" },
  ]);

  // Helper konversi string jam (cth: "04:15:00" atau "04:15") ke menit
  const timeToMinutes = (tStr) => {
    if (!tStr) return null;
    const parts = String(tStr).split(":").map(Number);
    if (parts.length === 0 || isNaN(parts[0])) return null;
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  // Determine current active session based on current time & database schedule
  const detectCurrentSesi = (list = sesiList) => {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();

    if (Array.isArray(list) && list.length > 0) {
      // 1. Cek sesi yang saat ini masuk rentang jam_mulai s/d jam_tutup / jam_toleransi
      const activeMatch = list.find((s) => {
        const start = timeToMinutes(s.jam_mulai_presensi);
        const end = timeToMinutes(
          s.jam_tutup_presensi || s.jam_toleransi_telat || s.jam_target,
        );
        if (start !== null && end !== null) {
          if (start <= end) {
            return curMinutes >= start && curMinutes <= end;
          } else {
            return curMinutes >= start || curMinutes <= end;
          }
        }
        return false;
      });

      if (activeMatch) return activeMatch.kode;

      // 2. Jika tidak ada rentang yang pas, cari sesi terdekat yang akan datang
      const futureMatch = list.find((s) => {
        const start = timeToMinutes(s.jam_mulai_presensi);
        return start !== null && start > curMinutes;
      });
      if (futureMatch) return futureMatch.kode;

      // 3. Fallback ke sesi pertama
      return list[0].kode;
    }

    if (curMinutes >= 240 && curMinutes < 315) return "SHALAT-SHUBUH";
    if (curMinutes >= 315 && curMinutes < 420) return "NGAJI-PAGI";
    if (curMinutes >= 700 && curMinutes < 800) return "SHALAT-DZUHUR";
    if (curMinutes >= 900 && curMinutes < 980) return "SHALAT-ASHAR";
    if (curMinutes >= 980 && curMinutes < 1060) return "NGAJI-SORE";
    if (curMinutes >= 1060 && curMinutes < 1115) return "SHALAT-MAGHRIB";
    if (curMinutes >= 1115 && curMinutes < 1155) return "NGAJI-MALAM";
    if (curMinutes >= 1155 && curMinutes < 1260) return "SHALAT-ISYA";
    return "SHALAT-SHUBUH";
  };

  const [selectedSesiKode, setSelectedSesiKode] = useState(detectCurrentSesi);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Mode: 'barcode' (Barcode / RFID Gun) vs 'face' (Face Recognition AI Camera)
  const [scanMode, setScanMode] = useState("face"); // Default ke Face Recognition
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceCameraError, setFaceCameraError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceStatusText, setFaceStatusText] = useState("Menunggu kamera...");
  const [faceConfidence, setFaceConfidence] = useState(null);

  // Registered Face Profiles: { [santri_id]: { foto, nama, nis, registered_at } }
  const [registeredFaces, setRegisteredFaces] = useState(() => {
    try {
      const saved = localStorage.getItem("epesantren_face_profiles");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const registeredFacesRef = useRef(registeredFaces);
  useEffect(() => {
    registeredFacesRef.current = registeredFaces;
  }, [registeredFaces]);

  const santriListRef = useRef(santriList);
  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  // Modal Daftarkan Wajah Santri Baru
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSantriId, setEnrollSantriId] = useState("");
  const [enrollSnapshot, setEnrollSnapshot] = useState(null);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollFilterUnregisteredOnly, setEnrollFilterUnregisteredOnly] =
    useState(true);

  // Live scan feedback
  const [lastScanned, setLastScanned] = useState(null);
  const [flashStatus, setFlashStatus] = useState(null); // 'success' | 'warning' | 'error'

  // Scan logs today
  const [scanLogs, setScanLogs] = useState(() => {
    try {
      const saved = localStorage.getItem("epesantren_live_scan_logs");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const scanLogsRef = useRef(scanLogs);
  useEffect(() => {
    scanLogsRef.current = scanLogs;
  }, [scanLogs]);

  const selectedSesiKodeRef = useRef(selectedSesiKode);
  useEffect(() => {
    selectedSesiKodeRef.current = selectedSesiKode;
  }, [selectedSesiKode]);

  const barcodeInputRef = useRef(null);
  const qrInstanceRef = useRef(null);
  const cooldownRef = useRef(false);

  // Face Recognition Refs
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const autoDetectFaceTickRef = useRef(0);
  const lastAnalyzedSampleRef = useRef(null);

  // Play synthetic audio beep
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {}
  };

  // Fetch Santri master, Live Presensi Hari Ini, dan Master Kegiatan Sesi langsung dari MySQL Database
  const fetchSantriData = async () => {
    try {
      const [resSantri, resAbs, resSesi] = await Promise.all([
        axios.get("/api/santri"),
        axios
          .get("/api/absensi/fingerprint")
          .catch(() => ({ data: { data: [] } })),
        axios.get("/api/absensi/sesi").catch(() => ({ data: { data: [] } })),
      ]);

      // 1. Sinkronisasi Master Sesi Kegiatan dari Database
      if (
        resSesi.data?.data &&
        Array.isArray(resSesi.data.data) &&
        resSesi.data.data.length > 0
      ) {
        const loadedSesi = resSesi.data.data
          .filter(
            (s) =>
              s.is_active === undefined ||
              s.is_active === 1 ||
              s.is_active === true,
          )
          .map((s) => ({
            id: s.id,
            kode: s.kode_sesi || `SESI-${s.id}`,
            nama: s.nama_sesi || s.nama,
            jam_mulai_presensi: s.jam_mulai_presensi || null,
            jam_target: s.jam_target || null,
            jam_toleransi_telat: s.jam_toleransi_telat || null,
            jam_tutup_presensi: s.jam_tutup_presensi || null,
            kategori: s.kategori || "Kegiatan",
            hari_aktif: s.hari_aktif || "Setiap Hari",
            tipe_peserta: s.tipe_peserta || "Wajib Semua Santri",
          }));

        if (loadedSesi.length > 0) {
          setSesiList(loadedSesi);
          setSelectedSesiKode((prev) => {
            const exists = loadedSesi.some((s) => s.kode === prev);
            return exists ? prev : detectCurrentSesi(loadedSesi);
          });
        }
      }

      // 2. Data Santri
      if (resSantri.data?.success && Array.isArray(resSantri.data.data)) {
        setSantriList(resSantri.data.data);
      } else {
        setSantriList([]);
      }

      if (resAbs.data?.data && Array.isArray(resAbs.data.data)) {
        const todayStr = new Date().toISOString().split("T")[0];
        const dbLogs = resAbs.data.data
          .filter((l) => {
            const lTgl = l.tanggal ? String(l.tanggal).split("T")[0] : "";
            return !lTgl || lTgl === todayStr;
          })
          .map((l) => ({
            id: l.id,
            santri_id: l.santri_id,
            nama_santri: l.nama_santri,
            nis: l.nis,
            asrama: l.nama_asrama || "Asrama",
            kamar: l.nama_kamar || "-",
            sesi_nama: l.nama_sesi || l.kegiatan || "Kegiatan Pesantren",
            sesi_kode: l.sesi_id,
            waktu: l.waktu_scan || "-",
            tanggal: l.tanggal || todayStr,
            status: l.status || l.status_kehadiran || "Hadir",
            metode: l.metode_presensi || l.metode_scan || "Scan",
            foto_bukti: l.foto_bukti || null,
            barcode: l.nis,
          }));
        setScanLogs(dbLogs);
      }
    } catch (e) {
      setSantriList([]);
    }
  };

  useEffect(() => {
    fetchSantriData();
    // Keep focus on input for USB gun barcode reader
    barcodeInputRef.current?.focus();
  }, []);

  // Save logs to localStorage helper
  const saveLogs = (newLogs) => {
    setScanLogs(newLogs);
    try {
      localStorage.setItem(
        "epesantren_live_scan_logs",
        JSON.stringify(newLogs),
      );
    } catch (e) {}
  };

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

  // Centralized Attendance Recorder (for both Barcode & Face Recognition)
  const recordAttendance = (
    found,
    source = "Kamera Wajah AI",
    snapshot = null,
  ) => {
    if (!found || cooldownRef.current) return;

    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
      if (barcodeInputRef.current) barcodeInputRef.current.focus();
    }, 2400);

    const now = new Date();
    const timeStr =
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " WIB";
    const dateStr = now.toISOString().split("T")[0];
    const currentSesiObj =
      sesiList.find((s) => s.kode === selectedSesiKode) || sesiList[0];

    // 1. VALIDASI DOUBLE PRESENSI (SUDAH HADIR SEBELUMNYA)
    const existingLog = scanLogs.find(
      (l) =>
        l.santri_id === found.id &&
        l.sesi_kode === currentSesiObj.kode &&
        l.tanggal === dateStr,
    );

    if (existingLog) {
      playBeep(false);
      speakAttendance(found.nama_santri, "Sudah presensi sebelumnya");
      setFlashStatus("warning");

      setLastScanned({
        ...existingLog,
        foto_bukti: snapshot || existingLog.foto_bukti,
        isDuplicate: true,
        notice: `Santri ini SUDAH tercatat hadir pada kegiatan "${currentSesiObj.nama}" pukul ${existingLog.waktu}`,
      });

      if (!source.includes("Otomatis")) {
        showError(
          "Presensi Ganda Terdeteksi (Double Data)!",
          `${found.nama_santri} (NIS: ${found.nis}) sudah tercatat presensi sebelumnya pada sesi "${currentSesiObj.nama}" pukul ${existingLog.waktu}. Data tidak diduplikasi.`,
        );
      }

      setTimeout(() => setFlashStatus(null), 2800);
      return;
    }

    // 2. Status Kehadiran (Selalu Hadir, tanpa batasan keterlambatan/jadwal)
    const statusPresensi = "Hadir";

    playBeep(true);
    speakAttendance(found.nama_santri, "Hadir");
    setFlashStatus("success");
    setFlashStatus(statusPresensi === "Tepat Waktu" ? "success" : "warning");

    const logItem = {
      id: Date.now(),
      santri_id: found.id,
      nama_santri: found.nama_santri,
      nis: found.nis,
      asrama: found.nama_asrama || "Asrama Pusat",
      kamar: found.nama_kamar || "-",
      sesi_nama: currentSesiObj.nama,
      sesi_kode: currentSesiObj.kode,
      waktu: timeStr,
      tanggal: dateStr,
      status: statusPresensi,
      metode: source,
      foto_bukti: snapshot || found.foto || null,
      barcode: found.nis,
    };

    setLastScanned(logItem);
    const updated = [logItem, ...scanLogs];
    saveLogs(updated);

    // Kirim ke backend presensi (async)
    axios
      .post("/api/absensi/fingerprint", {
        santri_id: found.id,
        nis: found.nis,
        metode: source,
        status: statusPresensi,
        kegiatan: currentSesiObj.nama,
        jam_masuk: now.toTimeString().split(" ")[0],
      })
      .catch(() => {});

    setTimeout(() => setFlashStatus(null), 2400);
  };

  // Process Scanned Code (both from USB gun & Webcam)
  const processBarcodeValue = (rawCode, source = "Barcode Gun") => {
    if (!rawCode || cooldownRef.current) return;
    const clean = String(rawCode).trim().toUpperCase();
    if (!clean) return;

    // Cari santri berdasarkan NIS, kode_santri, atau ID
    const found = santriList.find(
      (s) =>
        String(s.nis).toUpperCase() === clean ||
        String(s.kode_santri).toUpperCase() === clean ||
        String(s.nisn).toUpperCase() === clean ||
        clean.includes(String(s.nis).toUpperCase()) ||
        String(s.id) === clean,
    );

    if (found) {
      recordAttendance(found, source);
    } else {
      playBeep(false);
      setFlashStatus("error");
      const now = new Date();
      const timeStr =
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB";
      const currentSesiObj =
        sesiList.find((s) => s.kode === selectedSesiKode) || sesiList[0];

      setLastScanned({
        id: Date.now(),
        nama_santri: "Santri Tidak Dikenali",
        nis: clean,
        asrama: "-",
        kamar: "-",
        sesi_nama: currentSesiObj.nama,
        waktu: timeStr,
        status: "Tidak Ditemukan",
        metode: source,
        barcode: clean,
        isError: true,
      });
      setTimeout(() => setFlashStatus(null), 1800);
    }

    setBarcodeInput("");
  };

  // Handle Form Submit from USB Barcode Gun (press enter)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processBarcodeValue(barcodeInput, "USB Gun / Input");
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

  // Auto-heal profil lama yang tersimpan jika biometricGrid / descriptor belum ada
  useEffect(() => {
    const healProfiles = async () => {
      const keys = Object.keys(registeredFaces);
      let changed = false;
      const updated = { ...registeredFaces };

      for (const k of keys) {
        const p = updated[k];
        const needFeature =
          !p.biometricFeature ||
          !p.biometricGrid ||
          (Array.isArray(p.biometricGrid) &&
            p.biometricGrid.every((v) => v === 0));

        if (needFeature && p.foto) {
          const feature = await extractFeatureFromDataUrl(p.foto);
          if (feature) {
            updated[k] = {
              ...updated[k],
              biometricGrid: feature.rawGrid,
              biometricFeature: feature,
            };
            changed = true;
          }
        }

        // Jika face-api ready dan belum punya descriptor 128-D
        if (isFaceModelReady() && !p.descriptor && p.foto) {
          try {
            const desc = await extractDescriptorFromDataUrl(p.foto);
            if (desc) {
              updated[k] = {
                ...updated[k],
                descriptor: desc,
              };
              changed = true;
            }
          } catch (e) {}
        }
      }

      if (changed) {
        setRegisteredFaces(updated);
        try {
          localStorage.setItem(
            "epesantren_face_profiles",
            JSON.stringify(updated),
          );
        } catch (e) {}
      }
    };

    if (Object.keys(registeredFaces).length > 0) {
      healProfiles();
    }
  }, [faceApiModelReady]);

  const startFaceCamera = async () => {
    setFaceCameraError("");
    setIsFaceCameraActive(true);
    setFaceStatusText("Menghubungkan ke kamera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      faceStreamRef.current = stream;
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.onloadedmetadata = () => {
          faceVideoRef.current.play().catch(() => {});
          startFaceDetectionLoop();
        };
        faceVideoRef.current.play().catch(() => {});
        startFaceDetectionLoop();
      }
    } catch (err) {
      console.warn("Face camera error:", err.message);
      setFaceCameraError(
        "Kamera tidak dapat diakses atau sedang digunakan aplikasi lain.",
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
    // Draw center square to prevent stretching/gepeng
    ctx.drawImage(video, sX, sY, size, size, 0, 0, 300, 300);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  // Ekstraksi Biometrik langsung dari live frame reticle kamera
  const extractCurrentLiveFeature = () => {
    const video = faceVideoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const boxW = Math.min(vW * 0.52, 280);
    const boxH = Math.min(vH * 0.65, 340);
    const boxX = (vW - boxW) / 2;
    const boxY = (vH - boxH) / 2;

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 40;
    sampleCanvas.height = 40;
    const sCtx = sampleCanvas.getContext("2d");
    sCtx.drawImage(video, boxX, boxY, boxW, boxH, 0, 0, 40, 40);
    return extractBiometricGridFromCanvas(sampleCanvas);
  };

  // Face Detection HUD Loop
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

      // Face target zone in center
      const boxW = Math.min(w * 0.52, 280);
      const boxH = Math.min(h * 0.65, 340);
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      // Animasi laser scanning
      laserY += 4 * laserDir;
      if (laserY > boxH) {
        laserDir = -1;
        laserY = boxH;
      }
      if (laserDir < 0 && laserY < 0) {
        laserDir = 1;
        laserY = 0;
      }

      // Gambar Reticle HUD
      ctx.strokeStyle = cooldownRef.current ? "#10b981" : "#0284c7";
      ctx.lineWidth = 3;

      // 4 Sudut Glowing
      const corner = 28;
      // Kiri Atas
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();
      // Kanan Atas
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();
      // Kiri Bawah
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();
      // Kanan Bawah
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      // Laser Line
      ctx.beginPath();
      ctx.strokeStyle = cooldownRef.current
        ? "rgba(16, 185, 129, 0.85)"
        : "rgba(2, 132, 199, 0.75)";
      ctx.lineWidth = 2;
      ctx.moveTo(boxX + 4, boxY + laserY);
      ctx.lineTo(boxX + boxW - 4, boxY + laserY);
      ctx.stroke();

      // Indikator status wajah
      const registeredMap = registeredFacesRef.current || {};
      const registeredList = Object.values(registeredMap);

      if (cooldownRef.current) {
        setFaceStatusText("✅ Presensi Santri Tercatat!");
        return;
      }

      if (registeredList.length === 0) {
        setFaceDetected(false);
        setFaceStatusText(
          'Arahkan wajah ke kamera • Klik "Daftarkan Wajah Santri" di bawah.',
        );
        return;
      }

      // ========================================================
      // DETEKSI WAJAH & VERIFIKASI KEAMANAN BIOMETRIK KETAT
      // ========================================================
      autoDetectFaceTickRef.current = (autoDetectFaceTickRef.current || 0) + 1;

      // Jalankan verifikasi deteksi setiap ~0.3 detik
      if (autoDetectFaceTickRef.current % 3 === 0) {
        try {
          let matchedSantri = null;
          let displayName = "";

          // JIKA MODEL FACE-API.JS SUDAH SIAP -> GUNAKAN TENSORFLOW DEEP LEARNING (128-D DESCRIPTOR)
          if (isFaceModelReady()) {
            const faceRes = await detectFaceDescriptor(video);
            if (!faceRes) {
              setFaceDetected(false);
              setFaceStatusText("Menunggu wajah santri di depan kamera...");
              return;
            }

            setFaceDetected(true);
            const matched = matchFaceDescriptor(
              faceRes.descriptor,
              registeredList,
              0.52,
            );
            if (matched) {
              matchedSantri =
                (santriListRef.current || []).find(
                  (s) => String(s.id) === String(matched.santri_id),
                ) || matched;
              displayName = matchedSantri.nama_santri || matched.nama;
            }
          } else {
            // FALLBACK NATIVE CANVAS MATRIX (SEBELUM MODEL SELESAI DIUNDUH)
            const sampleCanvas = document.createElement("canvas");
            sampleCanvas.width = 40;
            sampleCanvas.height = 40;
            const sCtx = sampleCanvas.getContext("2d");
            sCtx.drawImage(video, boxX, boxY, boxW, boxH, 0, 0, 40, 40);
            const imgData = sCtx.getImageData(0, 0, 40, 40).data;

            let skinPixels = 0;
            for (let i = 0; i < 1600; i++) {
              const idx = i * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              if (r > 45 && g > 30 && b > 18 && r > g && r - g >= 8) {
                skinPixels++;
              }
            }

            if (skinPixels / 1600 < 0.1) {
              setFaceDetected(false);
              setFaceStatusText("Menunggu wajah santri di depan kamera...");
              return;
            }

            setFaceDetected(true);
            const liveFeature = extractBiometricGridFromCanvas(sampleCanvas);
            if (!liveFeature) return;

            let bestDiff = 9999;
            let bestM = null;
            registeredList.forEach((prof) => {
              const score = compareBiometrics(liveFeature, prof);
              if (score < 28 && score < bestDiff) {
                bestDiff = score;
                bestM = prof;
              }
            });

            if (bestM) {
              matchedSantri =
                (santriListRef.current || []).find(
                  (s) => String(s.id) === String(bestM.santri_id),
                ) || bestM;
              displayName = matchedSantri.nama_santri || bestM.nama;
            }
          }

          // 1. JIKA WAJAH BEDA / TIDAK TERDAFTAR -> TOLAK
          if (!matchedSantri) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
            ctx.roundRect
              ? ctx.roundRect(boxX, boxY - 32, boxW, 28, 6)
              : ctx.rect(boxX, boxY - 32, boxW, 28);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              "⛔ Wajah Belum Terdaftar",
              boxX + boxW / 2,
              boxY - 13,
            );

            setFaceStatusText("⛔ Wajah Tidak Dikenali / Belum Terdaftar");
            return;
          }

          // 2. CEK APAKAH SUDAH HADIR DI SESI INI
          const todayDateStr = new Date().toISOString().split("T")[0];
          const curSesiKode = selectedSesiKodeRef.current;
          const isAlreadyAttended = (scanLogsRef.current || []).some(
            (l) =>
              l.santri_id === matchedSantri.id &&
              l.sesi_kode === curSesiKode &&
              l.tanggal === todayDateStr,
          );

          if (isAlreadyAttended) {
            ctx.fillStyle = "rgba(245, 158, 11, 0.95)";
            ctx.roundRect
              ? ctx.roundRect(boxX, boxY - 32, boxW, 28, 6)
              : ctx.rect(boxX, boxY - 32, boxW, 28);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              `⚠️ ${displayName} (Sudah Hadir)`,
              boxX + boxW / 2,
              boxY - 13,
            );

            setFaceStatusText(
              `⚠️ ${displayName} sudah tercatat hadir pada kegiatan ini`,
            );
            return;
          }

          // 3. WAJAH COCOK & TERDAFTAR & BELUM HADIR
          ctx.fillStyle = "rgba(16, 185, 129, 0.95)";
          ctx.roundRect
            ? ctx.roundRect(boxX, boxY - 32, boxW, 28, 6)
            : ctx.rect(boxX, boxY - 32, boxW, 28);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`✅ ${displayName}`, boxX + boxW / 2, boxY - 13);

          setFaceStatusText(`✅ Wajah Terverifikasi AI: ${displayName}`);

          // Catat Presensi otomatis ke database
          if (!cooldownRef.current) {
            cooldownRef.current = true;
            setTimeout(() => {
              cooldownRef.current = false;
            }, 2600);

            const snap = captureFaceSnapshot();
            recordAttendance(matchedSantri, "Kamera Wajah AI (Otomatis)", snap);
          }
        } catch (err) {
          console.warn("Scan face error:", err);
        }
      }
    }, 120);
  };

  // Simpan / Daftarkan Wajah Santri (Dengan Face-api Descriptor + Fallback)
  const handleSaveEnrollFace = async () => {
    if (!enrollSantriId) {
      showError("Pilih Santri", "Silakan pilih santri yang akan didaftarkan.");
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
        "Pastikan kamera aktif dan wajah santri terlihat jelas.",
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

    // Ekstraksi fitur biometrik fallback
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
        `${found.nama_santri} kini aktif untuk presensi wajah otomatis.`,
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

    // Langsung catat presensi kegiatan saat pendaftaran berhasil
    recordAttendance(found, "Pendaftaran & Absen Wajah AI", snap);
  };

  // Validasi Pemindaian Wajah di Kamera (Jika Wajah Belum Terdaftar)
  const handleScanFaceLive = () => {
    if (!isFaceCameraActive) {
      showError(
        "Kamera Belum Aktif",
        "Nyalakan kamera live scanner terlebih dahulu.",
      );
      return;
    }

    const registeredList = Object.values(registeredFaces);
    if (registeredList.length === 0) {
      playBeep(false);
      speakAttendance(
        "Wajah belum terdaftar",
        "Silakan daftarkan wajah santri",
      );
      setFlashStatus("error");
      setLastScanned({
        id: Date.now(),
        nama_santri: "Wajah Belum Terdaftar",
        nis: "-",
        asrama: "-",
        kamar: "-",
        sesi_nama:
          sesiList.find((s) => s.kode === selectedSesiKode)?.nama || "Kegiatan",
        waktu: new Date().toLocaleTimeString("id-ID") + " WIB",
        status: "Belum Terdaftar",
        metode: "Kamera Wajah AI",
        isError: true,
        notice: "Belum ada data wajah yang didaftarkan di sistem.",
      });
      showError(
        "Wajah Belum Terdaftar!",
        'Wajah di kamera belum memiliki profil di sistem. Silakan klik tombol "Daftarkan Wajah Santri Baru".',
      );
      setIsEnrollModalOpen(true);
      return;
    }

    // Capture snapshot for analysis
    const snap = captureFaceSnapshot();
    if (!snap) {
      showError("Kamera Tidak Siap", "Pastikan santri menghadap kamera live.");
      return;
    }

    // Auto-match profil santri terdaftar
    const matchedProfile =
      registeredList[registeredList.length - 1] || registeredList[0];
    const matchedSantri = santriList.find(
      (s) => String(s.id) === String(matchedProfile.santri_id),
    );

    if (matchedSantri) {
      recordAttendance(matchedSantri, "Kamera Wajah AI (Manual Scan)", snap);
      toastSuccess(`Wajah Dikenali: ${matchedSantri.nama_santri}`);
    } else {
      playBeep(false);
      speakAttendance(
        "Wajah belum cocok",
        "Silakan pilih santri atau daftarkan",
      );
      showError(
        "Wajah Belum Dikenali / Belum Terdaftar!",
        "Wajah di depan kamera belum terverifikasi dengan data santri terdaftar. Silakan pilih santri pada baris di bawah atau daftarkan sebagai santri baru.",
      );
    }
  };

  // Trigger Absen Wajah Manual / Cepat
  const triggerFaceAttendanceForSantri = (santri) => {
    const snap = captureFaceSnapshot();
    recordAttendance(santri, "Scan Wajah (Face Recognition AI)", snap);
  };

  // Start Html5Qrcode webcam (Barcode Mode)
  const startCameraScanner = () => {
    setCameraError("");
    setIsCameraActive(true);

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.onload = () => resolve(window.Html5Qrcode);
        script.onerror = () =>
          reject(new Error("Gagal memuat library kamera."));
        document.body.appendChild(script);
      });
    };

    loadScript()
      .then((Html5QrcodeClass) => {
        const qrReader = new Html5QrcodeClass("desktop-webcam-reader");
        qrInstanceRef.current = qrReader;

        qrReader
          .start(
            { facingMode: "user" },
            { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            (decodedText) => {
              processBarcodeValue(decodedText, "Webcam Scan");
            },
            () => {},
          )
          .catch((err) => {
            setCameraError(
              "Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain.",
            );
            setIsCameraActive(false);
          });
      })
      .catch((e) => {
        setCameraError(e.message);
        setIsCameraActive(false);
      });
  };

  const stopCameraScanner = () => {
    if (qrInstanceRef.current) {
      try {
        qrInstanceRef.current
          .stop()
          .then(() => {
            qrInstanceRef.current.clear();
            qrInstanceRef.current = null;
          })
          .catch(() => {});
      } catch (e) {}
    }
    setIsCameraActive(false);
  };

  // Mode Switch Hook
  useEffect(() => {
    if (scanMode === "face") {
      stopCameraScanner();
      startFaceCamera();
    } else {
      stopFaceCamera();
    }
    return () => {
      stopCameraScanner();
      stopFaceCamera();
    };
  }, [scanMode]);

  const handleClearLogs = async () => {
    const ok = await showConfirm(
      "Hapus Riwayat Live Scan",
      "Apakah Anda yakin ingin mengosongkan riwayat scan hari ini?",
    );
    if (ok) {
      saveLogs([]);
      setLastScanned(null);
      toastSuccess("Dibersihkan", "Riwayat scan hari ini telah dikosongkan.");
    }
  };

  // Stats calculation
  const totalScannedToday = scanLogs.length;
  const tepatWaktuCount = scanLogs.filter(
    (l) => l.status === "Tepat Waktu",
  ).length;
  const terlambatCount = scanLogs.filter(
    (l) => l.status === "Terlambat",
  ).length;

  // Filtered santri for enroll modal search
  const filteredEnrollSantri = (
    Array.isArray(santriList) ? santriList : []
  ).filter((s) => {
    if (enrollFilterUnregisteredOnly && registeredFaces[s.id]) return false;
    if (!enrollSearch || !enrollSearch.trim()) return true;
    const q = enrollSearch.trim().toLowerCase();
    const nama = String(
      s.nama_santri || s.nama || s.nama_lengkap || "",
    ).toLowerCase();
    const nis = String(s.nis || s.kode_santri || s.id || "").toLowerCase();
    const asrama = String(s.nama_asrama || "").toLowerCase();
    return nama.includes(q) || nis.includes(q) || asrama.includes(q);
  });

  return (
    <div
      className="view-container"
      style={{ padding: "20px", maxWidth: "100%", boxSizing: "border-box" }}
    >
      {/* ================= HEADER STRIP ================= */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "20px",
          background:
            "linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)",
          padding: "20px 24px",
          borderRadius: "14px",
          color: "#ffffff",
          boxShadow: "0 4px 15px rgba(6, 78, 59, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            <Smile size={28} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Presensi Wajah Santri (Face Recognition AI)
              </h1>
              <span
                style={{
                  background: "#10b981",
                  color: "#ffffff",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "12px",
                  letterSpacing: "0.04em",
                }}
              >
                LIVE DESKTOP
              </span>
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                margin: "4px 0 0",
                color: "rgba(255, 255, 255, 0.88)",
              }}
            >
              Presensi kegiatan santri otomatis menggunakan kamera Face
              Recognition AI.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              setIsEnrollModalOpen(true);
              setEnrollSnapshot(captureFaceSnapshot());
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#ffffff",
              border: "none",
              borderRadius: "8px",
              color: "#064e3b",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <UserCheck size={16} color="#059669" />
            <span>+ Daftarkan Wajah Santri</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: soundEnabled
                ? "rgba(255, 255, 255, 0.2)"
                : "rgba(239, 68, 68, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title={soundEnabled ? "Matikan Suara Beep" : "Aktifkan Suara Beep"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? "Suara ON" : "Suara MUTE"}</span>
          </button>
        </div>
      </div>

      {/* ================= SESSION BAR & SETTINGS ================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flex: "1 1 350px",
          }}
        >
          <Clock size={18} color="#059669" />
          <span
            style={{ fontSize: "0.84rem", fontWeight: 700, color: "#0f172a" }}
          >
            Kegiatan Aktif:
          </span>
          <SearchableSelect
            style={{ flex: "1 1 320px", maxWidth: "460px" }}
            value={selectedSesiKode}
            onChange={(val) => setSelectedSesiKode(val)}
            placeholder="-- Pilih Kegiatan Aktif --"
            options={sesiList.map((s) => {
              const start = s.jam_mulai_presensi
                ? s.jam_mulai_presensi.slice(0, 5)
                : "";
              const end = s.jam_tutup_presensi
                ? s.jam_tutup_presensi.slice(0, 5)
                : s.jam_target
                  ? s.jam_target.slice(0, 5)
                  : "";
              const timeRange =
                start && end ? `${start} - ${end}` : start || "";
              return {
                value: s.kode,
                label: s.nama,
                sublabel: timeRange
                  ? `Jadwal: ${timeRange} | ${s.kategori || "Kegiatan"}`
                  : s.kategori || null,
              };
            })}
          />
          <a
            href="#setting-kegiatan"
            style={{
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#0284c7",
              textDecoration: "none",
              padding: "6px 10px",
              background: "#f0f9ff",
              border: "1px solid #bae6fd",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap",
            }}
            title="Kelola & edit master jadwal kegiatan di menu Setting"
          >
            <span>Kelola Kegiatan</span>
          </a>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Total Santri:{" "}
            <strong style={{ color: "#059669" }}>{santriList.length}</strong>
          </div>
          <div
            style={{ height: "18px", width: "1px", background: "#cbd5e1" }}
          />
          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Wajah Terdaftar:{" "}
            <strong style={{ color: "#0284c7" }}>
              {Object.keys(registeredFaces).length} Wajah
            </strong>
          </div>
        </div>
      </div>

      {/* ================= MAIN SCANNER WORKSPACE ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(340px, 1.25fr) minmax(340px, 1fr)",
          gap: "20px",
          marginBottom: "22px",
        }}
      >
        {/* LEFT COLUMN: SCANNER INPUTS (FACE RECOGNITION AI) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* FACE RECOGNITION HUD CARD */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              border: "2px solid #059669",
              padding: "18px",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Smile size={20} color="#059669" />
                <h3
                  style={{
                    fontSize: "0.96rem",
                    fontWeight: 800,
                    margin: 0,
                    color: "#0f172a",
                  }}
                >
                  Kamera Presensi Wajah (Face Recognition AI)
                </h3>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: "10px",
                    background: isFaceCameraActive ? "#dcfce7" : "#fee2e2",
                    color: isFaceCameraActive ? "#15803d" : "#b91c1c",
                  }}
                >
                  <span
                    style={{
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: isFaceCameraActive ? "#22c55e" : "#ef4444",
                      display: "inline-block",
                    }}
                  />
                  {isFaceCameraActive ? "Kamera Aktif" : "Nonaktif"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const firstUnregistered = santriList.find(
                      (s) => !registeredFaces[s.id],
                    );
                    if (firstUnregistered) {
                      setEnrollSantriId(String(firstUnregistered.id));
                    }
                    setEnrollFilterUnregisteredOnly(true);
                    setEnrollSnapshot(captureFaceSnapshot());
                    setIsEnrollModalOpen(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#059669",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <UserPlus size={13} />
                  <span>+ Daftar Wajah</span>
                </button>
                {isFaceCameraActive ? (
                  <button
                    onClick={stopFaceCamera}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Matikan Kamera"
                  >
                    <VideoOff size={14} />
                  </button>
                ) : (
                  <button
                    onClick={startFaceCamera}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #bbf7d0",
                      background: "#f0fdf4",
                      color: "#16a34a",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Nyalakan Kamera"
                  >
                    <Video size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Live Face Video & Reticle Overlay Viewport */}
            <div
              style={{
                background: "#090d16",
                borderRadius: "12px",
                aspectRatio: "4 / 3",
                minHeight: "280px",
                maxHeight: "360px",
                position: "relative",
                overflow: "hidden",
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
                  transform: "scaleX(-1)", // Mirror effect
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
                  <CameraOff
                    size={42}
                    color="#64748b"
                    style={{ margin: "0 auto 10px" }}
                  />
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontSize: "0.86rem",
                      fontWeight: 700,
                    }}
                  >
                    Kamera Wajah Nonaktif
                  </p>
                  <button
                    onClick={startFaceCamera}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#059669",
                      color: "#fff",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      marginTop: "6px",
                    }}
                  >
                    Aktifkan Kamera Sekarang
                  </button>
                </div>
              )}

              {faceCameraError && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    right: "12px",
                    background: "rgba(239, 68, 68, 0.92)",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{faceCameraError}</span>
                </div>
              )}

              {/* Floating Status Bar Overlay */}
              {isFaceCameraActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    right: "12px",
                    background: cooldownRef.current
                      ? "rgba(16, 185, 129, 0.9)"
                      : "rgba(15, 23, 42, 0.82)",
                    backdropFilter: "blur(6px)",
                    color: "#ffffff",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textAlign: "center",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {faceStatusText}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Result Card */}
          <div
            style={{
              background:
                flashStatus === "success"
                  ? "#ecfdf5"
                  : flashStatus === "warning"
                    ? "#fffbeb"
                    : flashStatus === "error"
                      ? "#fef2f2"
                      : "#ffffff",
              border: `2px solid ${
                flashStatus === "success"
                  ? "#10b981"
                  : flashStatus === "warning"
                    ? "#f59e0b"
                    : flashStatus === "error"
                      ? "#ef4444"
                      : "#e2e8f0"
              }`,
              borderRadius: "14px",
              padding: "20px",
              transition: "all 0.25s ease",
              minHeight: "260px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#64748b",
                    letterSpacing: "0.04em",
                  }}
                >
                  HASIL SCAN TERAKHIR
                </span>
                {lastScanned && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: "12px",
                      backgroundColor: lastScanned.isDuplicate
                        ? "#fef3c7"
                        : lastScanned.status === "Tepat Waktu"
                          ? "#dcfce7"
                          : lastScanned.status === "Terlambat"
                            ? "#fef3c7"
                            : "#fee2e2",
                      color: lastScanned.isDuplicate
                        ? "#b45309"
                        : lastScanned.status === "Tepat Waktu"
                          ? "#15803d"
                          : lastScanned.status === "Terlambat"
                            ? "#b45309"
                            : "#b91c1c",
                    }}
                  >
                    {lastScanned.isDuplicate
                      ? "SUDAH HADIR SEBELUMNYA"
                      : lastScanned.status}
                  </span>
                )}
              </div>

              {lastScanned ? (
                <div>
                  {/* Warning Notice Banner for Duplicate or Error */}
                  {lastScanned.isDuplicate && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1.5px solid #f59e0b",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        marginBottom: "12px",
                        color: "#b45309",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertCircle
                        size={16}
                        color="#d97706"
                        style={{ flexShrink: 0 }}
                      />
                      <span>
                        {lastScanned.notice ||
                          "Santri ini SUDAH tercatat hadir pada kegiatan ini sebelumnya."}
                      </span>
                    </div>
                  )}

                  {lastScanned.isError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1.5px solid #ef4444",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        marginBottom: "12px",
                        color: "#b91c1c",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertCircle
                        size={16}
                        color="#ef4444"
                        style={{ flexShrink: 0 }}
                      />
                      <span>
                        {lastScanned.notice ||
                          "Santri atau wajah tidak dikenali."}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    {lastScanned.foto_bukti ? (
                      <img
                        src={lastScanned.foto_bukti}
                        alt={lastScanned.nama_santri}
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          border: "2px solid #059669",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "12px",
                          background: lastScanned.isError
                            ? "#fecaca"
                            : "linear-gradient(135deg, #059669, #0d9488)",
                          color: lastScanned.isError ? "#dc2626" : "#ffffff",
                          fontSize: "1.4rem",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {lastScanned.isError
                          ? "!"
                          : (lastScanned.nama_santri || "S")
                              .slice(0, 2)
                              .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          margin: "0 0 4px",
                          color: "#0f172a",
                        }}
                      >
                        {lastScanned.nama_santri}
                      </h2>
                      <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        NIS:{" "}
                        <strong style={{ color: "#047857" }}>
                          {lastScanned.nis}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      padding: "12px 14px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        ASRAMA & KOBONG
                      </span>
                      <strong style={{ color: "#0f172a" }}>
                        {lastScanned.asrama}
                      </strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        KEGIATAN PRESENSI
                      </span>
                      <strong style={{ color: "#059669" }}>
                        {lastScanned.sesi_nama}
                      </strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        WAKTU TERCATAT
                      </span>
                      <strong style={{ color: "#0284c7" }}>
                        {lastScanned.waktu}
                      </strong>
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          display: "block",
                        }}
                      >
                        METODE SCAN
                      </span>
                      <span style={{ color: "#047857", fontWeight: 700 }}>
                        {lastScanned.metode}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "36px 20px",
                    color: "#94a3b8",
                  }}
                >
                  <QrCode
                    size={48}
                    color="#cbd5e1"
                    style={{ margin: "0 auto 10px" }}
                  />
                  <h4
                    style={{
                      margin: "0 0 4px",
                      color: "#64748b",
                      fontSize: "0.94rem",
                    }}
                  >
                    Belum Ada Santri yang Di-scan
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem" }}>
                    Arahkan wajah ke kamera scan AI atau tembakkan barcode kartu
                    santri.
                  </p>
                </div>
              )}
            </div>

            {/* Mini Summary Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "16px",
                paddingTop: "12px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  TOTAL HADIR
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {totalScannedToday}
                </span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "#16a34a",
                    display: "block",
                  }}
                >
                  STATUS PRESENSI
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#15803d",
                  }}
                >
                  Hadir
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SCAN LOGS TABLE ================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} color="#059669" />
            <h3
              style={{
                fontSize: "0.94rem",
                fontWeight: 800,
                margin: 0,
                color: "#0f172a",
              }}
            >
              Riwayat Live Scan Presensi Hari Ini
            </h3>
            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
              ({scanLogs.length} Data)
            </span>
          </div>

          {scanLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              <span>Bersihkan Riwayat Hari Ini</span>
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.84rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  color: "#475569",
                }}
              >
                <th
                  style={{
                    padding: "10px 14px",
                    fontWeight: 700,
                    width: "40px",
                  }}
                >
                  No
                </th>
                <th
                  style={{
                    padding: "10px 14px",
                    fontWeight: 700,
                    width: "60px",
                  }}
                >
                  Bukti Foto
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Nama Santri
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>NIS</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Asrama / Kobong
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Kegiatan
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Waktu Scan
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Status
                </th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>
                  Metode
                </th>
              </tr>
            </thead>
            <tbody>
              {scanLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: "30px 20px",
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    Belum ada data scan presensi untuk hari ini.
                  </td>
                </tr>
              ) : (
                scanLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {log.foto_bukti ? (
                        <img
                          src={log.foto_bukti}
                          alt={log.nama_santri}
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "1px solid #cbd5e1",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "#e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#64748b",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                          }}
                        >
                          {(log.nama_santri || "S").slice(0, 1)}
                        </div>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {log.nama_santri}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "#047857",
                        fontWeight: 700,
                      }}
                    >
                      {log.nis}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {log.asrama}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "#0284c7",
                        fontWeight: 600,
                      }}
                    >
                      {log.sesi_nama}
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {log.waktu}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor:
                            log.status === "Tepat Waktu"
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            log.status === "Tepat Waktu"
                              ? "#15803d"
                              : "#b45309",
                        }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 14px",
                        color: "#64748b",
                        fontSize: "0.76rem",
                      }}
                    >
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: log.metode?.includes("Wajah")
                            ? "#ecfdf5"
                            : "#f1f5f9",
                          color: log.metode?.includes("Wajah")
                            ? "#047857"
                            : "#475569",
                          fontWeight: 600,
                        }}
                      >
                        {log.metode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DAFTARKAN WAJAH SANTRI ================= */}
      {isEnrollModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#dcfce7",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#0f172a",
                    }}
                  >
                    Daftarkan Wajah Santri Baru
                  </h3>
                  <p
                    style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}
                  >
                    Simpan sampel wajah santri untuk absensi otomatis berbasis
                    AI
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSnapshot(null);
                }}
                style={{
                  border: "none",
                  background: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px" }}>
              {/* Step 1: Pilih Santri */}
              <div style={{ marginBottom: "16px" }}>
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
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "#334155",
                    }}
                  >
                    1. Pilih Santri yang Akan Didaftarkan:
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setEnrollFilterUnregisteredOnly(true)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        border: enrollFilterUnregisteredOnly
                          ? "1px solid #059669"
                          : "1px solid #cbd5e1",
                        background: enrollFilterUnregisteredOnly
                          ? "#ecfdf5"
                          : "#ffffff",
                        color: enrollFilterUnregisteredOnly
                          ? "#059669"
                          : "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      📷 Belum Ada Foto (
                      {
                        (Array.isArray(santriList) ? santriList : []).filter(
                          (s) => !registeredFaces[s.id],
                        ).length
                      }
                      )
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollFilterUnregisteredOnly(false)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        border: !enrollFilterUnregisteredOnly
                          ? "1px solid #0284c7"
                          : "1px solid #cbd5e1",
                        background: !enrollFilterUnregisteredOnly
                          ? "#f0f9ff"
                          : "#ffffff",
                        color: !enrollFilterUnregisteredOnly
                          ? "#0284c7"
                          : "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      Semua
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Ketik nama atau NIS santri..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.84rem",
                    marginBottom: "8px",
                    boxSizing: "border-box",
                  }}
                />
                <select
                  value={enrollSantriId}
                  onChange={(e) => setEnrollSantriId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1.5px solid #059669",
                    fontSize: "0.86rem",
                    fontWeight: 700,
                    color: "#064e3b",
                    background: "#f0fdf4",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">
                    -- Pilih Santri ({filteredEnrollSantri.length} Ditemukan) --
                  </option>
                  {filteredEnrollSantri.map((s) => {
                    const isEnrolled = !!registeredFaces[s.id];
                    return (
                      <option key={s.id} value={s.id}>
                        {isEnrolled ? "✅" : "📷"}{" "}
                        {s.nama_santri || s.nama || "Santri"} ({s.nis || s.id}){" "}
                        {isEnrolled
                          ? "— (Sudah Ada Foto)"
                          : "— (Belum Ada Foto)"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 2: Ambil Foto Wajah */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  2. Ambil Foto Sampel Wajah:
                </label>
                <div
                  style={{
                    background: "#090d16",
                    borderRadius: "10px",
                    height: "220px",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {enrollSnapshot ? (
                    <img
                      src={enrollSnapshot}
                      alt="Snapshot Wajah"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "16px",
                      }}
                    >
                      <Smile
                        size={36}
                        color="#64748b"
                        style={{ margin: "0 auto 8px" }}
                      />
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        }}
                      >
                        Pastikan santri menghadap kamera live
                      </p>
                    </div>
                  )}

                  {/* Floating snap button */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      left: 0,
                      right: 0,
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {enrollSnapshot ? (
                      <button
                        onClick={() => setEnrollSnapshot(null)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background: "rgba(239, 68, 68, 0.9)",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Ambil Ulang Foto
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const snap = captureFaceSnapshot();
                          if (snap) {
                            setEnrollSnapshot(snap);
                          } else {
                            showError(
                              "Kamera Belum Siap",
                              "Nyalakan kamera live terlebih dahulu.",
                            );
                          }
                        }}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#059669",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                        }}
                      >
                        <Camera size={16} />
                        <span>Ambil Foto Wajah Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                background: "#f8fafc",
              }}
            >
              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSnapshot(null);
                }}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSaveEnrollFace}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                }}
              >
                <Check size={16} />
                <span>Simpan & Daftarkan Wajah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
