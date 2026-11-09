import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  Search,
  Users,
  RotateCw,
  CheckCircle2,
  Building2,
  FileText,
  Filter,
  Camera,
  Sparkles,
  RotateCcw,
  X,
  Smile,
  AlertCircle,
  History,
  Volume2,
  VolumeX,
  ListFilter,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  QrCode,
  UserPlus,
  Video,
  VideoOff,
  UserCheck
} from "lucide-react";
import { toastSuccess, toastError, showConfirm, showError } from "../../utils/alert.util";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";

export default function PengajarAbsenMengaji() {
  // Main Tab: 'scan' | 'manual' | 'histori'
  const [activeTab, setActiveTab] = useState("scan");
  // Sub-mode Scan: 'face' | 'barcode'
  const [scanSubMode, setScanSubMode] = useState("face");

  const [loading, setLoading] = useState(false);
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sesiList, setSesiList] = useState([]);
  const [selectedSesi, setSelectedSesi] = useState("");
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [search, setSearch] = useState("");
  const [santriList, setSantriList] = useState([]);
  const [savingId, setSavingId] = useState(null); // id santri yang sedang auto-saving

  // Audio / Sound states
  const [soundEnabled, setSoundEnabled] = useState(true);

  // =========================================================================
  // REGISTERED FACE PROFILES (SINKRON DENGAN ADMIN SCAN)
  // =========================================================================
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

  // =========================================================================
  // FACE RECOGNITION (FACE AI) STATES & REFS
  // =========================================================================
  const [faceModelStatus, setFaceModelStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [faceStatusText, setFaceStatusText] = useState("Menyiapkan kamera pengenal wajah...");
  const [facingMode, setFacingMode] = useState("user");
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastDetectedSantri, setLastDetectedSantri] = useState(null);
  const [recentScanLog, setRecentScanLog] = useState([]);

  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const matchedStreakRef = useRef({ id: null, count: 0 });
  const cooldownRef = useRef(false);
  const autoDetectFaceTickRef = useRef(0);

  // =========================================================================
  // MODAL DAFTARKAN WAJAH SANTRI BARU (ENROLL FACE)
  // =========================================================================
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollSantriId, setEnrollSantriId] = useState("");
  const [enrollSnapshot, setEnrollSnapshot] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");

  // =========================================================================
  // BARCODE / QR SCANNER STATES & REFS
  // =========================================================================
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isQrCameraActive, setIsQrCameraActive] = useState(false);
  const barcodeInputRef = useRef(null);
  const qrInstanceRef = useRef(null);

  // =========================================================================
  // HISTORI PRESENSI STATES (TAB HISTORI)
  // =========================================================================
  const [historiList, setHistoriList] = useState([]);
  const [loadingHistori, setLoadingHistori] = useState(false);
  const [historiTanggal, setHistoriTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [historiSearch, setHistoriSearch] = useState("");

  // =========================================================================
  // SUARA & SPEECH SYNTHESIS (SAMA DENGAN ADMIN SCAN)
  // =========================================================================
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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);
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

  // =========================================================================
  // 1. AMBIL SESI & KELAS MASTER (KEGIATAN MENGAJI & KITAB KUNING)
  // =========================================================================
  const fetchSesiDanKelas = async () => {
    try {
      const [resSesi, resKelas] = await Promise.all([
        axios.get("/api/pengajar/sesi-mengaji").catch(() => ({ data: {} })),
        axios.get("/api/kelas").catch(() => ({ data: {} })),
      ]);

      let list = resSesi.data?.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        const resMateri = await axios.get("/api/materi-hafalan").catch(() => ({ data: {} }));
        const mList = resMateri.data?.data || [];
        if (Array.isArray(mList) && mList.length > 0) {
          list = mList.map((m) => ({
            id: m.id,
            nama_sesi: m.nama_materi,
            kategori: m.kategori || "Kitab Kuning",
          }));
        }
      }

      if (Array.isArray(list) && list.length > 0) {
        setSesiList(list);
        if (!selectedSesi) setSelectedSesi(String(list[0].id));
      }

      const kList =
        resKelas.data?.data?.data ||
        resKelas.data?.data?.kelas ||
        resKelas.data?.data ||
        [];
      if (Array.isArray(kList)) {
        setKelasList(kList);
      }
    } catch (e) {
      console.warn("Gagal inisialisasi sesi/kelas:", e);
    }
  };

  // =========================================================================
  // 2. AMBIL DATA SANTRI & SINKRONISASI PROFIL WAJAH DENGAN FOTO DATABASE
  // =========================================================================
  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      const kParam = selectedKelas !== "Semua" ? selectedKelas : "";
      const res = await axios.get(
        `/api/pengajar/absen-mengaji?tanggal=${tanggal}&sesi_id=${selectedSesi}&kelas=${encodeURIComponent(kParam)}`
      );

      if (res.data?.success && res.data.data?.list) {
        const list = res.data.data.list;
        setSantriList(list);

        // Ekstrak list kelas jika belum ada
        if (kelasList.length === 0) {
          const uniqueClasses = Array.from(
            new Set(list.map((s) => s.nama_kelas).filter(Boolean))
          ).map((c) => ({ nama_kelas: c }));
          if (uniqueClasses.length > 0) setKelasList(uniqueClasses);
        }

        // 1. Sinkronisasi Data Wajah dari Database MySQL (/api/santri/with-face)
        try {
          const resFaces = await axios.get("/api/santri/with-face").catch(() => ({ data: {} }));
          const dbFaces = resFaces.data?.data || [];
          const currentLocal = { ...(registeredFacesRef.current || {}) };
          let changed = false;

          if (Array.isArray(dbFaces) && dbFaces.length > 0) {
            for (const f of dbFaces) {
              if (f.face_descriptor && Array.isArray(f.face_descriptor)) {
                currentLocal[f.id] = {
                  ...(currentLocal[f.id] || {}),
                  santri_id: f.id,
                  id: f.id,
                  nama: f.nama_santri,
                  nama_santri: f.nama_santri,
                  nis: f.nis,
                  descriptor: f.face_descriptor,
                  face_descriptor: f.face_descriptor,
                };
                changed = true;
              }
            }
          }

          for (const s of list) {
            const photoUrl = s.foto_url || s.foto || s.foto_santri;
            const sId = s.santri_id || s.id;
            if (photoUrl && (!currentLocal[sId] || !currentLocal[sId].foto)) {
              currentLocal[sId] = {
                ...(currentLocal[sId] || {}),
                santri_id: sId,
                id: sId,
                nama: s.nama_santri,
                nama_santri: s.nama_santri,
                nis: s.nis,
                kelas: s.nama_kelas || "",
                foto: photoUrl,
                registered_at: new Date().toISOString(),
              };
              changed = true;
            }
          }

          if (changed) {
            setRegisteredFaces(currentLocal);
            localStorage.setItem("epesantren_face_profiles", JSON.stringify(currentLocal));
          }
        } catch (eSync) {}
      }
    } catch (e) {
      toastError("Gagal memuat daftar santri untuk presensi");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 3. AMBIL HISTORI PRESENSI
  // =========================================================================
  const fetchHistori = async () => {
    try {
      setLoadingHistori(true);
      const res = await axios.get(
        `/api/pengajar/absen-mengaji/history?tanggal=${historiTanggal}&sesi_id=${selectedSesi}`
      );
      if (res.data?.success) {
        setHistoriList(res.data.data || []);
      }
    } catch (e) {
      console.warn("Gagal memuat histori:", e);
    } finally {
      setLoadingHistori(false);
    }
  };

  useEffect(() => {
    fetchSesiDanKelas();
  }, []);

  useEffect(() => {
    if (selectedSesi) {
      fetchAbsensi();
    }
  }, [tanggal, selectedSesi, selectedKelas]);

  useEffect(() => {
    if (activeTab === "histori") {
      fetchHistori();
    }
  }, [activeTab, historiTanggal, selectedSesi]);

  // =========================================================================
  // AUTO-SAVE PRESENSI (INSTANT ON CLICK / SCAN TANPA TOMBOL SIMPAN)
  // SANTRI YANG SUDAH ABSEN OTOMATIS PINDAH KE HISTORI & HILANG DARI MANUAL
  // =========================================================================
  const autoSaveSingleStatus = async (santriId, newStatus, metode = "Manual_Ustadz") => {
    // 1. Optimistic UI update: tandai is_recorded = true agar santri langsung hilang dari Manual
    setSantriList((prev) =>
      prev.map((s) => {
        if ((s.santri_id || s.id) === santriId) {
          return { ...s, status: newStatus, is_recorded: true, metode_presensi: metode };
        }
        return s;
      })
    );

    // 2. Tambahkan langsung ke list Histori agar langsung muncul di tab Histori
    const sObj = santriList.find((s) => (s.santri_id || s.id) === santriId);
    const sesiObj = sesiList.find((s) => String(s.id) === String(selectedSesi));
    const newHistoriItem = {
      id: Date.now(),
      santri_id: santriId,
      nama_santri: sObj?.nama_santri || "Santri",
      nama_kelas: sObj?.nama_kelas || "-",
      nama_sesi: sesiObj?.nama_sesi || "Kajian Kitab",
      waktu_scan: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      status: newStatus,
      metode_presensi: metode,
    };
    setHistoriList((prev) => [newHistoriItem, ...prev.filter((h) => (h.santri_id || h.id) !== santriId)]);

    setSavingId(santriId);
    try {
      const payload = {
        tanggal,
        sesi_id: selectedSesi ? parseInt(selectedSesi, 10) : null,
        nama_sesi: sesiObj?.nama_sesi || "Mengaji & Kajian Kitab",
        nama_ustadz: "Ustadz Pengajar",
        metode_presensi: metode,
        items: [
          {
            santri_id: santriId,
            status: newStatus,
            metode_presensi: metode,
            keterangan: "",
          },
        ],
      };

      await axios.post("/api/pengajar/absen-mengaji", payload);
    } catch (err) {
      toastError("Gagal menyimpan otomatis: " + err.message);
    } finally {
      setTimeout(() => setSavingId(null), 600);
    }
  };

  const handleMarkAllHadir = async () => {
    const targetSantri = santriList.filter((s) => !s.is_recorded);
    if (targetSantri.length === 0) {
      toastSuccess("Semua santri pada kelas ini sudah diabsen.");
      return;
    }

    setSantriList((prev) =>
      prev.map((s) => (!s.is_recorded ? { ...s, status: "Hadir", is_recorded: true } : s))
    );

    try {
      const sesiObj = sesiList.find((s) => String(s.id) === String(selectedSesi));
      const payload = {
        tanggal,
        sesi_id: selectedSesi ? parseInt(selectedSesi, 10) : null,
        nama_sesi: sesiObj?.nama_sesi || "Mengaji & Kajian Kitab",
        nama_ustadz: "Ustadz Pengajar",
        metode_presensi: "Manual_Ustadz",
        items: targetSantri.map((s) => ({
          santri_id: s.santri_id || s.id,
          status: "Hadir",
          keterangan: "",
        })),
      };

      await axios.post("/api/pengajar/absen-mengaji", payload);
      playBeep(true);
      toastSuccess(`Berhasil menandai Hadir untuk ${targetSantri.length} santri`);
      fetchHistori();
    } catch (e) {
      toastError("Gagal menyimpan: " + e.message);
    }
  };

  // =========================================================================
  // CAMERA ENGINE & RETICLE HUD LOOP (FACE RECOGNITION AI)
  // =========================================================================
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
    ctx.drawImage(video, sX, sY, size, size, 0, 0, 300, 300);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const startFaceCamera = async (mode = facingMode) => {
    setCameraError("");
    setFaceStatusText("Menghubungkan ke kamera...");
    try {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach((t) => t.stop());
        faceStreamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
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
        setIsFaceCameraActive(true);
        startFaceDetectionLoop();
      }
    } catch (err) {
      setCameraError("Izin kamera ditolak atau kamera sedang digunakan aplikasi lain.");
      setIsFaceCameraActive(false);
      setFaceStatusText("Kamera tidak dapat diakses");
    }
  };

  const stopFaceCamera = () => {
    if (faceLoopIntervalRef.current) {
      clearInterval(faceLoopIntervalRef.current);
      faceLoopIntervalRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setIsFaceCameraActive(false);
    setFaceStatusText("Kamera nonaktif");
  };

  const startFaceDetectionLoop = () => {
    if (faceLoopIntervalRef.current) clearInterval(faceLoopIntervalRef.current);

    let laserY = 0;
    let laserDir = 1;

    faceLoopIntervalRef.current = setInterval(async () => {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      const ctx = canvas.getContext("2d");
      const w = (canvas.width = video.videoWidth || 640);
      const h = (canvas.height = video.videoHeight || 480);
      ctx.clearRect(0, 0, w, h);

      // Target box zone di tengah
      const boxW = Math.min(w * 0.52, 280);
      const boxH = Math.min(h * 0.65, 340);
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      // Laser animation
      laserY += 4 * laserDir;
      if (laserY > boxH) {
        laserDir = -1;
        laserY = boxH;
      }
      if (laserDir < 0 && laserY < 0) {
        laserDir = 1;
        laserY = 0;
      }

      // Draw Reticle HUD Corners
      ctx.strokeStyle = cooldownRef.current ? "#10b981" : "#0284c7";
      ctx.lineWidth = 3;
      const corner = 26;

      // Kiri Atas
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();
      // Kanan Atas
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();
      // Kiri Bawah
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();
      // Kanan Bawah
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      // Laser Line
      ctx.beginPath();
      ctx.strokeStyle = cooldownRef.current ? "rgba(16, 185, 129, 0.85)" : "rgba(2, 132, 199, 0.75)";
      ctx.lineWidth = 2;
      ctx.moveTo(boxX + 4, boxY + laserY);
      ctx.lineTo(boxX + boxW - 4, boxY + laserY);
      ctx.stroke();

      if (cooldownRef.current) {
        setFaceStatusText("✅ Presensi Berhasil Tercatat!");
        return;
      }

      const registeredMap = registeredFacesRef.current || {};
      const registeredList = Object.values(registeredMap);

      if (registeredList.length === 0) {
        setFaceStatusText('Arahkan wajah ke kamera • Klik "+ Daftar Wajah" jika belum terdaftar.');
        return;
      }

      autoDetectFaceTickRef.current = (autoDetectFaceTickRef.current || 0) + 1;

      // Jalankan verifikasi deteksi setiap ~240ms (2 ticks)
      if (autoDetectFaceTickRef.current % 2 === 0) {
        try {
          if (!isFaceModelReady()) {
            setFaceStatusText("Memuat Google MediaPipe Face AI...");
            return;
          }

          const faceRes = await detectFaceDescriptor(video);
          if (!faceRes) {
            matchedStreakRef.current = { id: null, count: 0 };
            setFaceStatusText("Menunggu wajah santri di depan kamera...");
            return;
          }

          // Pencocokan Vektor Biometrik (Threshold 0.35 akurat)
          const matched = matchFaceDescriptor(faceRes.descriptor, registeredList, 0.35);

          if (!matched || (!matched.santri_id && !matched.id)) {
            matchedStreakRef.current = { id: null, count: 0 };
            ctx.fillStyle = "rgba(239, 68, 68, 0.95)";
            ctx.roundRect
              ? ctx.roundRect(boxX, boxY - 32, boxW, 28, 6)
              : ctx.rect(boxX, boxY - 32, boxW, 28);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⛔ Wajah Belum Terdaftar", boxX + boxW / 2, boxY - 13);
            setFaceStatusText("⛔ Wajah Tidak Dikenali / Belum Terdaftar");
            return;
          }

          const matchedId = matched.santri_id || matched.id;
          const dbSantri = santriList.find(
            (s) => String(s.santri_id || s.id) === String(matchedId)
          ) || matched;

          const displayName = dbSantri.nama_santri || dbSantri.nama || matched.nama || "Santri";

          // Streak 2-frame konsekutif
          if (matchedStreakRef.current.id === matchedId) {
            matchedStreakRef.current.count += 1;
          } else {
            matchedStreakRef.current = { id: matchedId, count: 1 };
          }

          if (matchedStreakRef.current.count < 2) {
            setFaceStatusText(`Memverifikasi: ${displayName}...`);
            return;
          }

          // Cek apakah santri ini sudah Hadir
          const currentStatus = dbSantri.status;
          if (currentStatus === "Hadir") {
            ctx.fillStyle = "rgba(245, 158, 11, 0.95)";
            ctx.roundRect
              ? ctx.roundRect(boxX, boxY - 32, boxW, 28, 6)
              : ctx.rect(boxX, boxY - 32, boxW, 28);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`⚠️ ${displayName} (Sudah Hadir)`, boxX + boxW / 2, boxY - 13);
            setFaceStatusText(`⚠️ ${displayName} sudah tercatat Hadir`);
            return;
          }

          // SUCCESS MATCH & RECORD ATTENDANCE
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

          if (!cooldownRef.current) {
            cooldownRef.current = true;
            setTimeout(() => {
              cooldownRef.current = false;
            }, 3000);

            playBeep(true);
            speakAttendance(displayName, "Hadir");

            // SIMPAN OTOMATIS KE DATABASE
            autoSaveSingleStatus(matchedId, "Hadir", "Wajah_AI");

            const detectedInfo = {
              nama: displayName,
              santri_id: matchedId,
              kelas: dbSantri.nama_kelas || dbSantri.kelas || "-",
              confidence: matched.confidence || 98,
              waktu: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            };

            setLastDetectedSantri(detectedInfo);
            setRecentScanLog((prev) => [detectedInfo, ...prev.slice(0, 4)]);
          }
        } catch (eScan) {
          console.warn("Detection tick error:", eScan);
        }
      }
    }, 120);
  };

  // Toggle Camera Facing Mode (Depan vs Belakang)
  const toggleFacingMode = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startFaceCamera(next);
  };

  // =========================================================================
  // BARCODE & QR SCANNER (WEBCAM + USB GUN INPUT)
  // =========================================================================
  const processBarcodeValue = (rawCode, source = "Barcode Scan") => {
    if (!rawCode || cooldownRef.current) return;
    const clean = String(rawCode).trim().toUpperCase();
    if (!clean) return;

    const found = santriList.find(
      (s) =>
        String(s.nis || "").toUpperCase() === clean ||
        String(s.santri_id || s.id) === clean ||
        String(s.kode_santri || "").toUpperCase() === clean
    );

    if (found) {
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
        barcodeInputRef.current?.focus();
      }, 2500);

      playBeep(true);
      speakAttendance(found.nama_santri, "Hadir");
      autoSaveSingleStatus(found.santri_id || found.id, "Hadir", "Barcode_QR");

      const detectedInfo = {
        nama: found.nama_santri,
        santri_id: found.santri_id || found.id,
        kelas: found.nama_kelas || "-",
        confidence: 100,
        metode: source,
        waktu: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      setLastDetectedSantri(detectedInfo);
      setRecentScanLog((prev) => [detectedInfo, ...prev.slice(0, 4)]);
      toastSuccess(`Presensi Sukses: ${found.nama_santri} (Hadir)`);
    } else {
      playBeep(false);
      speakAttendance("Santri tidak ditemukan", "Cek NIS");
      toastError(`NIS/Barcode "${clean}" tidak ditemukan di daftar santri.`);
    }

    setBarcodeInput("");
  };

  const startQrScanner = () => {
    setCameraError("");
    setIsQrCameraActive(true);

    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Html5Qrcode) return resolve(window.Html5Qrcode);
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
        script.onload = () => resolve(window.Html5Qrcode);
        script.onerror = () => reject(new Error("Gagal memuat library kamera."));
        document.body.appendChild(script);
      });
    };

    loadScript()
      .then((Html5QrcodeClass) => {
        const qrReader = new Html5QrcodeClass("pengajar-qr-reader-viewport");
        qrInstanceRef.current = qrReader;

        qrReader
          .start(
            { facingMode: "environment" },
            { fps: 12, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
            (decodedText) => {
              processBarcodeValue(decodedText, "Kamera Barcode");
            },
            () => {}
          )
          .catch((err) => {
            setCameraError("Kamera Barcode tidak dapat diakses.");
            setIsQrCameraActive(false);
          });
      })
      .catch((e) => {
        setCameraError(e.message);
        setIsQrCameraActive(false);
      });
  };

  const stopQrScanner = () => {
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
    setIsQrCameraActive(false);
  };

  // Tab Scan Mode Switch Effect
  useEffect(() => {
    if (activeTab === "scan") {
      if (scanSubMode === "face") {
        stopQrScanner();
        setFaceModelStatus("loading");
        initFaceApiModels()
          .then(() => {
            setFaceModelStatus("ready");
            startFaceCamera(facingMode);
          })
          .catch(() => {
            setFaceModelStatus("error");
            setCameraError("Gagal menginisialisasi AI Pengenal Wajah.");
          });
      } else {
        stopFaceCamera();
        startQrScanner();
      }
    } else {
      stopFaceCamera();
      stopQrScanner();
    }

    return () => {
      stopFaceCamera();
      stopQrScanner();
    };
  }, [activeTab, scanSubMode]);

  // =========================================================================
  // SIMPAN & DAFTARKAN WAJAH SANTRI BARU (ENROLL MODAL HANDLER)
  // =========================================================================
  const handleSaveEnrollFace = async () => {
    if (!enrollSantriId) {
      showError("Pilih Santri", "Silakan pilih santri yang ingin didaftarkan wajahnya.");
      return;
    }

    const found = santriList.find(
      (s) => String(s.santri_id || s.id) === String(enrollSantriId)
    );
    if (!found) {
      showError("Santri Tidak Ditemukan", "Data santri yang dipilih tidak valid.");
      return;
    }

    const snap = enrollSnapshot || captureFaceSnapshot();
    if (!snap) {
      showError("Foto Wajah Kosong", "Pastikan santri menghadap kamera live atau ambil foto terlebih dahulu.");
      return;
    }

    setEnrollLoading(true);
    try {
      let descriptor = null;
      if (isFaceModelReady()) {
        try {
          if (faceVideoRef.current && faceVideoRef.current.readyState >= 2) {
            const liveRes = await detectFaceDescriptor(faceVideoRef.current);
            if (liveRes) descriptor = liveRes.descriptor;
          }
        } catch (e) {}
        if (!descriptor && snap) {
          try {
            descriptor = await extractDescriptorFromDataUrl(snap);
          } catch (e) {}
        }
      }

      const sId = found.santri_id || found.id;
      const updatedProfiles = {
        ...registeredFaces,
        [sId]: {
          santri_id: sId,
          id: sId,
          nama: found.nama_santri,
          nama_santri: found.nama_santri,
          nis: found.nis,
          kelas: found.nama_kelas || "",
          foto: snap,
          descriptor: descriptor,
          registered_at: new Date().toISOString(),
        },
      };

      setRegisteredFaces(updatedProfiles);
      localStorage.setItem("epesantren_face_profiles", JSON.stringify(updatedProfiles));

      // Simpan langsung ke database MySQL (tabel santri kolom foto & face_descriptor)
      axios.patch(`/api/santri/${sId}/foto`, {
        foto: snap,
        descriptor,
        face_descriptor: descriptor,
      }).catch(() => {});

      // Langsung tandai Hadir otomatis
      autoSaveSingleStatus(sId, "Hadir", "Wajah_AI");
      playBeep(true);
      speakAttendance(found.nama_santri, "Wajah Terdaftar & Hadir");

      toastSuccess(
        `Wajah ${found.nama_santri} Berhasil Didaftarkan! Santri kini otomatis tercatat Hadir.`
      );

      setIsEnrollModalOpen(false);
      setEnrollSnapshot(null);
    } catch (err) {
      toastError("Gagal mendaftarkan profil wajah: " + err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  // Stats Counters
  const countHadir = santriList.filter((s) => s.is_recorded && s.status === "Hadir").length;
  const countSakit = santriList.filter((s) => s.is_recorded && s.status === "Sakit").length;
  const countIzin = santriList.filter((s) => s.is_recorded && s.status === "Izin").length;
  const countAlfa = santriList.filter((s) => s.is_recorded && s.status === "Alfa").length;
  const countBelum = santriList.filter((s) => !s.is_recorded).length;

  // Di tab Manual: HANYA menampilkan santri yang BELUM presensi (!s.is_recorded)
  // Santri yang sudah scan otomatis hilang dari Manual & muncul di Histori
  const santriBelumAbsen = santriList.filter((s) => !s.is_recorded);

  const filteredSantri = santriBelumAbsen.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.nama_santri || "").toLowerCase().includes(q) ||
      (s.nis || "").toLowerCase().includes(q)
    );
  });

  const filteredHistori = historiList.filter((h) => {
    const q = historiSearch.toLowerCase();
    return (
      (h.nama_santri || "").toLowerCase().includes(q) ||
      (h.nama_kelas || "").toLowerCase().includes(q) ||
      (h.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 1. KONTROL SESI, TANGGAL & KELAS */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "12px 14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.64rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              TANGGAL MENGAJI
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                fontSize: "0.75rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.64rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
              KEGIATAN / KITAB MENGAJI
            </label>
            <select
              value={selectedSesi}
              onChange={(e) => setSelectedSesi(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                fontSize: "0.75rem",
                outline: "none",
                background: "#ffffff",
                boxSizing: "border-box",
              }}
            >
              {sesiList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_sesi} {s.kategori ? `(${s.kategori})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SELECT OPTION PILIH KELAS SANTRI (DENGAN OPSI SEMUA KELAS) */}
        <div>
          <label style={{ display: "block", fontSize: "0.64rem", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
            PILIH KELAS SANTRI
          </label>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 10px",
              borderRadius: "9px",
              border: "1px solid #cbd5e1",
              fontSize: "0.75rem",
              outline: "none",
              background: "#ffffff",
              boxSizing: "border-box",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            <option value="Semua">Semua Kelas ({santriList.length} Santri)</option>
            {kelasList.map((k, idx) => (
              <option key={k.id || idx} value={k.nama_kelas}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. STATS BADGES COUNTER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        <div style={{ background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#15803d" }}>{countHadir}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#166534" }}>Hadir</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)", border: "1px solid #fecaca", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b91c1c" }}>{countSakit + countIzin}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#991b1b" }}>Sakit / Izin</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)", border: "1px solid #99f6e4", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#0f766e" }}>{countAlfa}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#115e59" }}>Alfa</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b45309" }}>{countBelum}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#92400e" }}>Belum Absen</div>
        </div>
      </div>

      {/* 3. TABS NAVIGASI UTAMA */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "4px",
          border: "1px solid #e2e8f0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("scan")}
          style={{
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "scan" ? "linear-gradient(135deg, #059669 0%, #0d9488 100%)" : "transparent",
            color: activeTab === "scan" ? "#ffffff" : "#64748b",
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            boxShadow: activeTab === "scan" ? "0 2px 8px rgba(13, 148, 136, 0.28)" : "none",
          }}
        >
          <Camera size={13} /> Scan Otomatis
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          style={{
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "manual" ? "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)" : "transparent",
            color: activeTab === "manual" ? "#ffffff" : "#64748b",
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            boxShadow: activeTab === "manual" ? "0 2px 8px rgba(13, 118, 110, 0.25)" : "none",
          }}
        >
          <Users size={13} /> Manual
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("histori")}
          style={{
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: activeTab === "histori" ? "linear-gradient(135deg, #475569 0%, #1e293b 100%)" : "transparent",
            color: activeTab === "histori" ? "#ffffff" : "#64748b",
            fontSize: "0.72rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            boxShadow: activeTab === "histori" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
          }}
        >
          <History size={13} /> Histori
        </button>
      </div>

      {/* =====================================================================
          KONTEN TAB 1: MODE SCAN (FACE AI & BARCODE / QR SCANNER)
      ===================================================================== */}
      {activeTab === "scan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Sub-mode Pill Switcher & Voice/Sound Button */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "6px 10px",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setScanSubMode("face")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  border: "none",
                  background: scanSubMode === "face" ? "#ecfdf5" : "#f1f5f9",
                  color: scanSubMode === "face" ? "#047857" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Smile size={12} /> Scan Wajah AI
              </button>

              <button
                type="button"
                onClick={() => setScanSubMode("barcode")}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  border: "none",
                  background: scanSubMode === "barcode" ? "#eff6ff" : "#f1f5f9",
                  color: scanSubMode === "barcode" ? "#1d4ed8" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <QrCode size={12} /> Barcode / NIS
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setEnrollSnapshot(captureFaceSnapshot());
                  setIsEnrollModalOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "5px 9px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <UserPlus size={12} /> + Daftar Wajah
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  padding: "5px 8px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: soundEnabled ? "#ecfdf5" : "#fef2f2",
                  color: soundEnabled ? "#059669" : "#dc2626",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title={soundEnabled ? "Suara Aktif" : "Suara Mute"}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          {/* VIEWPORT KAMERA SCANNER */}
          {scanSubMode === "face" ? (
            /* KAMERA WAJAH AI DENGAN RETICLE CYBER HUD OVERLAY */
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: isFaceCameraActive ? "#10b981" : "#ef4444",
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f172a" }}>
                    Live Face AI Reticle Scanner
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "7px",
                    padding: "4px 8px",
                    fontSize: "0.64rem",
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RotateCcw size={11} /> Putar Kamera
                </button>
              </div>

              {/* Video Box + Canvas HUD */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "290px",
                  background: "#090d16",
                  borderRadius: "14px",
                  overflow: "hidden",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "inset 0 0 25px rgba(0,0,0,0.6)",
                }}
              >
                <video
                  ref={faceVideoRef}
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
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
                    transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  }}
                />

                {/* Status Bar Pill Top Left */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    background: "rgba(15, 23, 42, 0.8)",
                    color: "#ffffff",
                    padding: "4px 9px",
                    borderRadius: "8px",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Sparkles size={11} color="#34d399" />
                  {faceStatusText}
                </div>

                {cameraError && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(15, 23, 42, 0.92)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f87171",
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "0.75rem",
                    }}
                  >
                    <AlertCircle size={24} style={{ marginBottom: "6px" }} />
                    {cameraError}
                    <button
                      type="button"
                      onClick={() => startFaceCamera(facingMode)}
                      style={{
                        marginTop: "10px",
                        background: "#059669",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Coba Lagi
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* KAMERA SCANNER BARCODE / QR + INPUT NIS */
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (barcodeInput.trim()) processBarcodeValue(barcodeInput, "Input Manual NIS");
                }}
                style={{ display: "flex", gap: "6px" }}
              >
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Ketik/Scan NIS Santri (lalu tekan Enter)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.76rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Proses
                </button>
              </form>

              <div
                id="pengajar-qr-reader-viewport"
                style={{
                  width: "100%",
                  minHeight: "260px",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "#090d16",
                }}
              />
            </div>
          )}

          {/* BANNER HASIL SCAN TERAKHIR (CARD FEEDBACK) */}
          {lastDetectedSantri && (
            <div
              style={{
                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                border: "1.5px solid #a7f3d0",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#10b981",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#065f46" }}>
                    {lastDetectedSantri.nama}
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#047857" }}>
                    Kelas: {lastDetectedSantri.kelas} • Pukul {lastDetectedSantri.waktu} WIB
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    background: "#059669",
                    color: "#ffffff",
                    padding: "4px 9px",
                    borderRadius: "7px",
                  }}
                >
                  HADIR
                </span>
                <div style={{ fontSize: "0.58rem", color: "#047857", marginTop: "3px" }}>
                  Tersimpan Otomatis
                </div>
              </div>
            </div>
          )}

          {/* LOG SCAN REAL-TIME */}
          {recentScanLog.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#334155", marginBottom: "8px" }}>
                Riwayat Pemindaian Sesi Ini:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {recentScanLog.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      fontSize: "0.66rem",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#10b981", fontWeight: 900 }}>✓</span>
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>{log.nama}</span>
                      <span style={{ fontSize: "0.6rem", color: "#64748b" }}>({log.kelas})</span>
                    </div>
                    <span style={{ color: "#059669", fontWeight: 800 }}>{log.waktu} (Hadir)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          KONTEN TAB 2: MODE MANUAL (AUTO-SAVE PER KLIK TANPA TOMBOL SIMPAN)
      ===================================================================== */}
      {activeTab === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Cari santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.74rem",
                  outline: "none",
                  background: "#ffffff",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleMarkAllHadir}
              style={{
                padding: "7px 12px",
                borderRadius: "10px",
                border: "1px solid #a7f3d0",
                background: "#ecfdf5",
                color: "#047857",
                fontSize: "0.7rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
              }}
            >
              <CheckCircle2 size={13} />
              <span>Semua Hadir</span>
            </button>
          </div>

          {/* List Santri Presensi Cepat */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#0d766e" }}>
                <RotateCw size={22} className="animate-spin" color="#0d766e" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>Memuat daftar santri...</div>
              </div>
            ) : filteredSantri.length === 0 ? (
              santriBelumAbsen.length === 0 && santriList.length > 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "28px 16px",
                    background: "#f0fdf4",
                    borderRadius: "16px",
                    border: "1.5px dashed #86efac",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 900, color: "#166534" }}>
                    Semua Santri Sudah Melakukan Presensi!
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#475569", maxWidth: "320px", lineHeight: "1.4" }}>
                    Seluruh santri pada kelas ini ({santriList.length} santri) telah tercatat hadir/absen. Buka tab Histori untuk melihat daftar hadir lengkap.
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("histori")}
                    style={{
                      marginTop: "4px",
                      background: "#059669",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 14px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Lihat di Tab Histori →
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "24px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.76rem" }}>
                  Tidak ada santri yang cocok dengan pencarian.
                </div>
              )
            ) : (
              filteredSantri.map((s, idx) => {
                const sId = s.santri_id || s.id;
                const isSavingThis = savingId === sId;
                const status = s.status || "Hadir";

                return (
                  <div
                    key={sId || idx}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a" }}>
                          {s.nama_santri}
                        </span>
                        {isSavingThis && (
                          <span style={{ fontSize: "0.58rem", color: "#059669", fontWeight: 800 }}>
                            • Menyimpan...
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                        NIS: {s.nis || "-"} • Kelas: {s.nama_kelas || "-"}
                      </div>
                    </div>

                    {/* Toggle Status Auto-Save Buttons */}
                    <div style={{ display: "flex", gap: "3px" }}>
                      {["Hadir", "Sakit", "Izin", "Alfa"].map((st) => {
                        const isSelected = status === st;
                        let activeBg = "#059669";
                        let activeBorder = "#047857";
                        if (st === "Sakit") { activeBg = "#dc2626"; activeBorder = "#b91c1c"; }
                        if (st === "Izin") { activeBg = "#d97706"; activeBorder = "#b45309"; }
                        if (st === "Alfa") { activeBg = "#475569"; activeBorder = "#334155"; }

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => autoSaveSingleStatus(sId, st, "Manual_Ustadz")}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "7px",
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              border: isSelected ? `1.5px solid ${activeBorder}` : "1px solid #cbd5e1",
                              background: isSelected ? activeBg : "#f8fafc",
                              color: isSelected ? "#ffffff" : "#475569",
                              transition: "all 0.1s ease",
                            }}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          KONTEN TAB 3: HISTORI PRESENSI MENGAJI
      ===================================================================== */}
      {activeTab === "histori" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <input
                type="date"
                value={historiTanggal}
                onChange={(e) => setHistoriTanggal(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.74rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ position: "relative", flex: 1.5 }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "9px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Cari nama santri / kelas..."
                value={historiSearch}
                onChange={(e) => setHistoriSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px 7px 32px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.74rem",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {loadingHistori ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#475569" }}>
                <RotateCw size={22} className="animate-spin" color="#475569" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>Memuat riwayat...</div>
              </div>
            ) : filteredHistori.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.76rem" }}>
                Belum ada data riwayat presensi pada tanggal ini.
              </div>
            ) : (
              filteredHistori.map((h, idx) => {
                const isScan = h.metode_presensi === "Wajah_AI" || /wajah|scan/i.test(h.metode_presensi || "");
                const isHadir = h.status === "Hadir";

                return (
                  <div
                    key={h.id || idx}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a" }}>
                          {h.nama_santri}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "#64748b" }}>
                          ({h.nama_kelas || "Santri"})
                        </span>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#475569", marginTop: "2px" }}>
                        {h.nama_sesi || "Kajian Kitab"} • Jam: {h.waktu_scan || "-"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background: isHadir ? "#ecfdf5" : "#fef2f2",
                          color: isHadir ? "#059669" : "#dc2626",
                          border: `1px solid ${isHadir ? "#a7f3d0" : "#fecaca"}`,
                        }}
                      >
                        {h.status}
                      </span>
                      <div style={{ fontSize: "0.56rem", color: "#94a3b8", marginTop: "2px" }}>
                        {isScan ? "📷 AI Wajah" : "✍️ Manual"}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL DAFTARKAN WAJAH SANTRI (ENROLL PROFILE WAJAH)
      ===================================================================== */}
      {isEnrollModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
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
              borderRadius: "18px",
              padding: "18px",
              maxWidth: "420px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <UserCheck size={18} color="#059669" />
                <h3 style={{ margin: 0, fontSize: "0.94rem", fontWeight: 900, color: "#0f172a" }}>
                  Daftarkan Wajah Santri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSnapshot(null);
                }}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} color="#64748b" />
              </button>
            </div>

            {/* Pilih Santri */}
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                PILIH SANTRI:
              </label>
              <input
                type="text"
                placeholder="Ketik untuk filter nama santri..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.72rem",
                  marginBottom: "6px",
                  boxSizing: "border-box",
                }}
              />
              <select
                value={enrollSantriId}
                onChange={(e) => setEnrollSantriId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.76rem",
                  outline: "none",
                  boxSizing: "border-box",
                  background: "#ffffff",
                }}
              >
                <option value="">-- Pilih Santri --</option>
                {santriList
                  .filter((s) => (s.nama_santri || "").toLowerCase().includes(enrollSearch.toLowerCase()))
                  .map((s) => (
                    <option key={s.santri_id || s.id} value={s.santri_id || s.id}>
                      {s.nama_santri} ({s.nama_kelas || "Santri"}) - NIS: {s.nis || "-"}
                    </option>
                  ))}
              </select>
            </div>

            {/* Foto Preview / Snapshot */}
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "2px solid #059669",
                  margin: "0 auto 8px",
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {enrollSnapshot ? (
                  <img
                    src={enrollSnapshot}
                    alt="Snapshot Wajah"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "0.68rem", padding: "12px" }}>
                    Belum ada foto snapshot
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const snap = captureFaceSnapshot();
                  if (snap) {
                    setEnrollSnapshot(snap);
                    toastSuccess("Foto wajah berhasil diambil dari kamera!");
                  } else {
                    toastError("Pastikan kamera aktif dan wajah terlihat.");
                  }
                }}
                style={{
                  background: "#0d9488",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Camera size={13} /> Ambil Foto Sekarang
              </button>
            </div>

            {/* Tombol Simpan Profil Wajah */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setEnrollSnapshot(null);
                }}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>

              <button
                type="button"
                disabled={enrollLoading}
                onClick={handleSaveEnrollFace}
                style={{
                  flex: 2,
                  padding: "9px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  color: "#ffffff",
                  fontSize: "0.74rem",
                  fontWeight: 900,
                  cursor: enrollLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
                }}
              >
                {enrollLoading ? (
                  <>
                    <RotateCw size={13} className="animate-spin" /> Mendaftarkan...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Simpan &amp; Presensi Hadir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
