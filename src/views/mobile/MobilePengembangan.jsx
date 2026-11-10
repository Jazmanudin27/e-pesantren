import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Camera,
  UserCheck,
  History,
  Search,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Check,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Sparkles,
  ChevronDown,
  Award,
  BookOpen,
  Edit3,
  Trash2,
  User,
  Users,
  Volume2,
  VolumeX,
  FileCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  showConfirm,
  toastSuccess,
  showError,
  showSuccess,
} from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";
import MobileLoadingState from "../../components/MobileLoadingState";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  matchFaceDescriptor,
  normalizeDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";

const getInitials = (name) => {
  if (!name) return "S";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarTheme = (name = "") => {
  const themes = [
    {
      bg: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
      color: "#166534",
    },
    {
      bg: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
      color: "#075985",
    },
    {
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      color: "#854d0e",
    },
    {
      bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
      color: "#6b21a8",
    },
    {
      bg: "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)",
      color: "#9f1239",
    },
    {
      bg: "linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)",
      color: "#115e59",
    },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % themes.length;
  return themes[idx];
};

export default function MobilePengembangan() {
  // 3 Tabs Utama: 'scan' (Scan Wajah AI) | 'manual' (Pilih Santri) | 'histori' (Riwayat)
  const [activeTab, setActiveTab] = useState("manual");

  // State Dropdown Kelas & Bidang Utama
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState(() => {
    try {
      return (
        localStorage.getItem("epesantren_pengembangan_selected_kelas") || ""
      );
    } catch (e) {
      return "";
    }
  });

  const [selectedBidang, setSelectedBidang] = useState(() => {
    try {
      return (
        localStorage.getItem("epesantren_pengembangan_selected_bidang") || ""
      );
    } catch (e) {
      return "";
    }
  });

  const [santriList, setSantriList] = useState([]);
  const [loadingKelasSantri, setLoadingKelasSantri] = useState(false);
  const [masterKategoriAll, setMasterKategoriAll] = useState([]);
  const [rekapList, setRekapList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchManual, setSearchManual] = useState("");
  const [filterManualStatus, setFilterManualStatus] = useState("Semua");
  const [searchHistori, setSearchHistori] = useState("");
  const [filterHistoriKategori, setFilterHistoriKategori] = useState("Semua");
  const [filterHistoriStatus, setFilterHistoriStatus] = useState("Semua");

  // Sound
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Session Penguji
  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem("mobile_session") || "{}");
    } catch (e) {
      return {};
    }
  })();
  const currentPenguji =
    session?.nama || session?.nama_lengkap || "Musyrif Pembina";

  // Camera & Face Scanner AI State
  const [faceFacingMode, setFaceFacingMode] = useState("environment");
  const [isFaceCameraActive, setIsFaceCameraActive] = useState(false);
  const [faceStatusText, setFaceStatusText] = useState(
    "Arahkan wajah santri ke kamera",
  );
  const [faceCameraError, setFaceCameraError] = useState("");
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [matchedSantriPreview, setMatchedSantriPreview] = useState(null);
  const [faceApiModelReady, setFaceApiModelReady] = useState(false);

  // Refs
  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const isMatchedCooldownRef = useRef(false);
  const matchedStreakRef = useRef({ id: null, count: 0 });
  const santriListRef = useRef(santriList);
  const masterKategoriRef = useRef(masterKategoriAll);

  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  useEffect(() => {
    masterKategoriRef.current = masterKategoriAll;
  }, [masterKategoriAll]);

  // Modal Evaluasi (Popup Formulir Nilai)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evalForm, setEvalForm] = useState({
    santri_id: "",
    santriObj: null,
    gender: "L",
    kategori_id: "",
    tanggal: new Date().toISOString().slice(0, 10),
    status_kelulusan: "Lulus",
    permasalahan: [],
    penyebab: [],
    tindakan: [],
    catatan_tambahan: "",
  });

  // Simpan preferensi pilihan di localStorage
  useEffect(() => {
    if (selectedKelas) {
      try {
        localStorage.setItem(
          "epesantren_pengembangan_selected_kelas",
          selectedKelas,
        );
      } catch (e) {}
    }
  }, [selectedKelas]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "epesantren_pengembangan_selected_bidang",
        selectedBidang,
      );
    } catch (e) {}
  }, [selectedBidang]);

  // Load santri khusus per kelas
  const loadSantriByKelas = async (targetKelas) => {
    if (!targetKelas || targetKelas === "Semua") {
      setSantriList([]);
      return;
    }
    setLoadingKelasSantri(true);
    try {
      const res = await axios.get(
        `/api/santri/by-kelas/${encodeURIComponent(targetKelas)}`,
      );
      const rows = res.data?.data || [];
      setSantriList(rows);
    } catch (err) {
      console.warn("Gagal load santri by kelas:", err);
    } finally {
      setLoadingKelasSantri(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    return () => {
      stopFaceCamera();
    };
  }, []);

  // Inisialisasi AI model saat tab scan dibuka
  useEffect(() => {
    if (activeTab !== "scan") return;
    if (!faceApiModelReady && !isFaceModelReady()) {
      initFaceApiModels()
        .then(() => setFaceApiModelReady(true))
        .catch(() => {});
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resMaster, resRekap, resKelas] = await Promise.all([
        axios
          .get("/api/perkembangan-ikhwan/master?gender=Semua")
          .catch(() => ({ data: { data: [] } })),
        axios
          .get("/api/perkembangan-ikhwan/rekap?limit=250")
          .catch(() => ({ data: { data: [] } })),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
      ]);

      const katData = resMaster.data?.data || resMaster.data?.kategori || [];
      setMasterKategoriAll(Array.isArray(katData) ? katData : []);

      const kData = resKelas.data?.data || [];
      setKelasList(Array.isArray(kData) ? kData : []);

      const rData = resRekap.data?.data || resRekap.data?.rekap || [];
      setRekapList(Array.isArray(rData) ? rData : []);

      if (selectedKelas) {
        await loadSantriByKelas(selectedKelas);
      }
    } catch (err) {
      console.error("Gagal memuat data pengembangan:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRekapOnly = async () => {
    try {
      const res = await axios.get("/api/perkembangan-ikhwan/rekap?limit=250");
      const rData = res.data?.data || res.data?.rekap || [];
      setRekapList(Array.isArray(rData) ? rData : []);
    } catch (e) {}
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {}
  };

  // =========================================================================
  // FACE SCANNER AI FUNCTIONS (INLINE VIEWPORT)
  // =========================================================================
  const startFaceCamera = async (facing = faceFacingMode) => {
    if (!selectedKelas) {
      stopFaceCamera();
      return;
    }
    setFaceCameraError("");
    setFaceStatusText("Membuka kamera...");
    setMatchedSantriPreview(null);
    setIsFaceDetected(false);
    isMatchedCooldownRef.current = false;

    try {
      if (faceStreamRef.current) {
        faceStreamRef.current.getTracks().forEach((t) => t.stop());
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
      setIsFaceCameraActive(true);

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
      console.warn("Kamera gagal diakses:", err);
      setIsFaceCameraActive(false);
      setFaceCameraError(
        "Kamera tidak dapat diakses atau izin ditolak. Silakan gunakan tab 'Manual' untuk memilih santri.",
      );
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
    setIsFaceDetected(false);
  };

  const toggleFaceFacingMode = () => {
    const nextMode = faceFacingMode === "user" ? "environment" : "user";
    setFaceFacingMode(nextMode);
    stopFaceCamera();
    setTimeout(() => startFaceCamera(nextMode), 200);
  };

  const startFaceDetectionLoop = () => {
    if (faceLoopIntervalRef.current) clearInterval(faceLoopIntervalRef.current);

    let laserY = 0;
    let laserDir = 1;
    let tick = 0;

    faceLoopIntervalRef.current = setInterval(async () => {
      const video = faceVideoRef.current;
      const canvas = faceCanvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth)
        return;

      const ctx = canvas.getContext("2d");
      const w = (canvas.width = video.videoWidth || 640);
      const h = (canvas.height = video.videoHeight || 480);
      ctx.clearRect(0, 0, w, h);

      const boxW = Math.min(w * 0.65, 260);
      const boxH = Math.min(h * 0.72, 300);
      const boxX = (w - boxW) / 2;
      const boxY = (h - boxH) / 2;

      laserY += 4 * laserDir;
      if (laserY > boxH) {
        laserDir = -1;
        laserY = boxH;
      }
      if (laserDir < 0 && laserY < 0) {
        laserDir = 1;
        laserY = 0;
      }

      ctx.strokeStyle = isMatchedCooldownRef.current ? "#10b981" : "#0284c7";
      ctx.lineWidth = 3;
      const corner = 24;

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY);
      ctx.lineTo(boxX + boxW);
      ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH);
      ctx.lineTo(boxX + boxW);
      ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = isMatchedCooldownRef.current
        ? "rgba(16, 185, 129, 0.85)"
        : "rgba(2, 132, 199, 0.75)";
      ctx.lineWidth = 2;
      ctx.moveTo(boxX + 4, boxY + laserY);
      ctx.lineTo(boxX + boxW - 4, boxY + laserY);
      ctx.stroke();

      if (isMatchedCooldownRef.current) return;

      tick++;
      if (tick % 3 !== 0) return;
      if (isDetectingRef.current) return;

      isDetectingRef.current = true;
      try {
        let registeredMap = {};
        try {
          registeredMap = JSON.parse(
            localStorage.getItem("epesantren_face_profiles") || "{}",
          );
        } catch (e) {}

        const registeredList = [];
        const seenIds = new Set();

        (santriListRef.current || []).forEach((s) => {
          let desc =
            normalizeDescriptor(s.face_descriptor) ||
            normalizeDescriptor(registeredMap[s.id]?.descriptor);
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

        const allowedIds = new Set(
          (santriListRef.current || []).map((s) => String(s.id)),
        );
        Object.values(registeredMap).forEach((p) => {
          const pId = String(p.santri_id || p.id || "");
          if (pId && allowedIds.has(pId) && !seenIds.has(pId) && p.descriptor) {
            registeredList.push(p);
            seenIds.add(pId);
          }
        });

        if (isFaceModelReady()) {
          const faceRes = await detectFaceDescriptor(video);
          if (!faceRes) {
            matchedStreakRef.current = { id: null, count: 0 };
            setIsFaceDetected(false);
            setFaceStatusText("Arahkan wajah santri ke kamera...");
            return;
          }

          setIsFaceDetected(true);
          const matched = matchFaceDescriptor(
            faceRes.descriptor,
            registeredList,
            0.62,
          );

          if (matched && matched.error === "no_profiles") {
            matchedStreakRef.current = { id: null, count: 0 };
            setFaceStatusText(
              "⚠️ Belum Ada Biometrik Wajah Santri di Kelas Ini",
            );
            return;
          }

          if (matched && !matched.error && (matched.santri_id || matched.id)) {
            const mId = String(matched.santri_id || matched.id);
            const fullSantri =
              (santriListRef.current || []).find((s) => String(s.id) === mId) ||
              matched;
            const displayName =
              fullSantri.nama_santri || fullSantri.nama || "Santri";

            if (matchedStreakRef.current.id === mId) {
              matchedStreakRef.current.count += 1;
            } else {
              matchedStreakRef.current = { id: mId, count: 1 };
            }

            if (
              matchedStreakRef.current.count >= 2 ||
              (matched.distance && matched.distance < 0.55)
            ) {
              handleFaceRecognized(fullSantri, displayName);
            } else {
              setFaceStatusText(`Memverifikasi: ${displayName}...`);
            }
          } else {
            matchedStreakRef.current = { id: null, count: 0 };
            const distInfo =
              matched &&
              typeof matched.bestDistance === "number" &&
              matched.bestDistance < 900
                ? ` (Jarak: ${matched.bestDistance.toFixed(2)})`
                : "";
            setFaceStatusText(`⛔ Belum Cocok${distInfo}`);
          }
        } else {
          setFaceStatusText("Memuat model pengenalan wajah AI...");
        }
      } catch (err) {
      } finally {
        isDetectingRef.current = false;
      }
    }, 150);
  };

  const handleSnapshotVerify = async () => {
    const video = faceVideoRef.current;
    if (!video || video.readyState < 2) return;
    setFaceStatusText("📸 Memeriksa biometrik...");

    try {
      const snapCanvas = document.createElement("canvas");
      snapCanvas.width = video.videoWidth || 640;
      snapCanvas.height = video.videoHeight || 480;
      const ctx = snapCanvas.getContext("2d");
      if (faceFacingMode === "user") {
        ctx.translate(snapCanvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

      let registeredMap = {};
      try {
        registeredMap = JSON.parse(
          localStorage.getItem("epesantren_face_profiles") || "{}",
        );
      } catch (e) {}

      const registeredList = [];
      const seenIds = new Set();
      (santriListRef.current || []).forEach((s) => {
        let desc =
          normalizeDescriptor(s.face_descriptor) ||
          normalizeDescriptor(registeredMap[s.id]?.descriptor);
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

      if (registeredList.length === 0) {
        setFaceStatusText("⚠️ Belum Ada Biometrik Wajah Santri di Kelas Ini");
        return;
      }

      const faceRes = await detectFaceDescriptor(snapCanvas);
      if (!faceRes) {
        setFaceStatusText("❌ Wajah tidak terdeteksi. Posisikan wajah tegak.");
        return;
      }

      const matched = matchFaceDescriptor(
        faceRes.descriptor,
        registeredList,
        0.72,
      );
      if (matched && !matched.error && (matched.santri_id || matched.id)) {
        const mId = String(matched.santri_id || matched.id);
        const fullSantri =
          (santriListRef.current || []).find((s) => String(s.id) === mId) ||
          matched;
        const displayName =
          fullSantri.nama_santri || fullSantri.nama || "Santri";
        handleFaceRecognized(fullSantri, displayName);
      } else {
        setFaceStatusText("⛔ Wajah belum cocok dengan daftar santri");
      }
    } catch (e) {
      setFaceStatusText("❌ Gagal memproses foto");
    }
  };

  const handleFaceRecognized = (matchedSantri, displayName) => {
    isMatchedCooldownRef.current = true;
    setMatchedSantriPreview(matchedSantri);
    setFaceStatusText(`✅ Santri Dikenali: ${displayName}`);
    playSuccessSound();

    setTimeout(() => {
      stopFaceCamera();
      openEvaluationForSantri(matchedSantri);
      toastSuccess(`Santri Dikenali: ${displayName}`);
    }, 600);
  };

  // Switch Tab Handler
  const handleSwitchTab = (tabMode) => {
    setActiveTab(tabMode);
    if (tabMode === "scan") {
      if (selectedKelas) {
        setTimeout(() => startFaceCamera(faceFacingMode), 100);
      }
    } else {
      stopFaceCamera();
    }
    if (tabMode === "histori") {
      fetchRekapOnly();
    }
  };

  // Buka Modal Evaluasi Santri
  const openEvaluationForSantri = (santriObj) => {
    const rawJk = String(
      santriObj.jk || santriObj.jenis_kelamin || "L",
    ).toUpperCase();
    const detectedGender = rawJk.startsWith("P") ? "P" : "L";

    const availableKats = (masterKategoriRef.current || []).filter(
      (k) => !k.gender || k.gender === detectedGender || k.gender === "Semua",
    );
    // Prioritaskan kategori yang sedang dipilih di header, jika cocok
    const defaultKatId =
      selectedBidang &&
      availableKats.some((k) => String(k.id) === String(selectedBidang))
        ? String(selectedBidang)
        : availableKats[0]
          ? String(availableKats[0].id)
          : "";

    setEvalForm({
      santri_id: santriObj.id,
      santriObj: santriObj,
      gender: detectedGender,
      kategori_id: defaultKatId,
      tanggal: new Date().toISOString().slice(0, 10),
      status_kelulusan: "Lulus",
      permasalahan: [],
      penyebab: [],
      tindakan: [],
      catatan_tambahan: "",
    });
    setIsEvalModalOpen(true);
  };

  const handleCloseEvalModal = () => {
    setIsEvalModalOpen(false);
    if (activeTab === "scan" && selectedKelas) {
      setTimeout(() => startFaceCamera(faceFacingMode), 200);
    }
  };

  // Toggle Checklist Permasalahan / Penyebab / Tindakan
  const handleToggleChecklist = (tipe, teks) => {
    setEvalForm((prev) => {
      const currentArr = prev[tipe] || [];
      const exists = currentArr.includes(teks);
      return {
        ...prev,
        [tipe]: exists
          ? currentArr.filter((t) => t !== teks)
          : [...currentArr, teks],
      };
    });
  };

  // Simpan Evaluasi Pengembangan ke MySQL
  const handleSaveEvaluasi = async (e) => {
    e.preventDefault();
    if (!evalForm.santri_id) {
      showError("Validasi Gagal", "Pilih santri terlebih dahulu.");
      return;
    }
    if (!evalForm.kategori_id) {
      showError("Validasi Gagal", "Pilih bidang pengembangan terlebih dahulu.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        kategori_id: parseInt(evalForm.kategori_id),
        kelas_id:
          evalForm.santriObj?.kelas ||
          evalForm.santriObj?.nama_kelas ||
          selectedKelas ||
          "Semua",
        tanggal: evalForm.tanggal,
        asatidz_pencatat: currentPenguji,
        evaluasi: [
          {
            santri_id: evalForm.santri_id,
            status_kelulusan: evalForm.status_kelulusan,
            permasalahan:
              evalForm.status_kelulusan === "Tidak Lulus"
                ? evalForm.permasalahan
                : [],
            penyebab:
              evalForm.status_kelulusan === "Tidak Lulus"
                ? evalForm.penyebab
                : [],
            tindakan:
              evalForm.status_kelulusan === "Tidak Lulus"
                ? evalForm.tindakan
                : [],
            catatan_tambahan: evalForm.catatan_tambahan || "",
          },
        ],
      };

      const res = await axios.post(
        "/api/perkembangan-ikhwan/evaluasi-batch",
        payload,
      );
      if (res.data?.success) {
        toastSuccess("Evaluasi pengembangan santri berhasil disimpan");
        setIsEvalModalOpen(false);
        fetchRekapOnly();
        if (activeTab === "scan" && selectedKelas) {
          setTimeout(() => startFaceCamera(faceFacingMode), 300);
        }
      }
    } catch (err) {
      showError("Gagal Menyimpan", err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit dari Rekap
  const handleEditRekap = (row) => {
    const sObj = santriList.find(
      (s) => String(s.id) === String(row.santri_id),
    ) || {
      id: row.santri_id,
      nama_santri: row.nama_santri,
      nis: row.nis,
      jk: row.jk,
      nama_asrama: row.nama_asrama,
      nama_kelas: row.nama_kelas,
      kelas_id: row.kelas_id,
    };
    const g = String(row.jk || "L")
      .toUpperCase()
      .startsWith("P")
      ? "P"
      : "L";
    setEvalForm({
      santri_id: row.santri_id,
      santriObj: sObj,
      gender: g,
      kategori_id: String(row.kategori_id),
      tanggal: row.tanggal
        ? String(row.tanggal).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      status_kelulusan: row.status_kelulusan || "Lulus",
      permasalahan: Array.isArray(row.permasalahan_list)
        ? row.permasalahan_list
        : [],
      penyebab: Array.isArray(row.penyebab_list) ? row.penyebab_list : [],
      tindakan: Array.isArray(row.tindakan_list) ? row.tindakan_list : [],
      catatan_tambahan: row.catatan_tambahan || "",
    });
    setIsEvalModalOpen(true);
  };

  const handleDeleteRekap = async (id, nama) => {
    const ok = await showConfirm(
      "Hapus Evaluasi?",
      `Hapus data evaluasi pengembangan ${nama}?`,
      "Ya, Hapus",
      "Batal",
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/perkembangan-ikhwan/evaluasi/${id}`);
      toastSuccess("Evaluasi berhasil dihapus");
      fetchRekapOnly();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  // Filter Kategori untuk Modal Evaluasi (sesuai gender santri yang dinilai)
  const kategoriForEvalModal = masterKategoriAll.filter(
    (k) => !k.gender || k.gender === evalForm.gender || k.gender === "Semua",
  );
  const activeEvalKategoriObj =
    kategoriForEvalModal.find(
      (k) => String(k.id) === String(evalForm.kategori_id),
    ) ||
    kategoriForEvalModal[0] ||
    null;

  // Daftar Nama Kelas Unik
  const availableKelasOptions = React.useMemo(() => {
    const setK = new Set();
    (kelasList || []).forEach((k) => {
      if (k.nama_kelas) setK.add(String(k.nama_kelas).trim());
    });
    return Array.from(setK);
  }, [kelasList]);

  // Santri terfilter di tab Manual
  const filteredSantriManual = React.useMemo(() => {
    return santriList.filter((s) => {
      const matchSearch =
        (s.nama_santri || "")
          .toLowerCase()
          .includes(searchManual.toLowerCase()) ||
        (s.nis || "").includes(searchManual);
      if (!matchSearch) return false;

      if (filterManualStatus !== "Semua") {
        const lastEval = rekapList.find(
          (r) => String(r.santri_id) === String(s.id),
        );
        if (filterManualStatus === "Sudah Evaluasi" && !lastEval) return false;
        if (filterManualStatus === "Belum Evaluasi" && lastEval) return false;
        if (
          filterManualStatus === "Lulus" &&
          lastEval?.status_kelulusan !== "Lulus"
        )
          return false;
        if (
          filterManualStatus === "Belum Lulus" &&
          (lastEval?.status_kelulusan === "Lulus" || !lastEval)
        )
          return false;
      }
      return true;
    });
  }, [santriList, searchManual, filterManualStatus, rekapList]);

  // Histori terfilter di tab Histori
  const filteredHistori = React.useMemo(() => {
    return rekapList.filter((r) => {
      if (
        filterHistoriKategori !== "Semua" &&
        String(r.kategori_id) !== String(filterHistoriKategori)
      ) {
        return false;
      }
      if (filterHistoriStatus !== "Semua") {
        if (filterHistoriStatus === "Lulus" && r.status_kelulusan !== "Lulus") {
          return false;
        }
        if (
          filterHistoriStatus === "Belum Lulus" &&
          r.status_kelulusan === "Lulus"
        ) {
          return false;
        }
      }
      if (searchHistori.trim()) {
        const q = searchHistori.toLowerCase();
        const matchNama = (r.nama_santri || "").toLowerCase().includes(q);
        const matchNis = (r.nis || "").toLowerCase().includes(q);
        const matchKat = (r.nama_kategori || "").toLowerCase().includes(q);
        if (!matchNama && !matchNis && !matchKat) return false;
      }
      return true;
    });
  }, [rekapList, filterHistoriKategori, filterHistoriStatus, searchHistori]);

  // Statistik Global
  const countLulus = rekapList.filter(
    (r) => r.status_kelulusan === "Lulus",
  ).length;
  const countTidakLulus = rekapList.filter(
    (r) => r.status_kelulusan !== "Lulus",
  ).length;

  if (loading) {
    return (
      <div style={{ padding: "14px", paddingBottom: "95px" }}>
        <MobileLoadingState
          title="Memuat Perkembangan..."
          subtitle="Sinkronisasi data santri, kelas & bidang pengembangan..."
          iconColor="#0284c7"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 14px 95px" }}>
      {/* =========================================================================
          1. HEADER CARD DENGAN STATS LULUS & BINA YANG MENARIK + DUA DROPDOWN
      ========================================================================= */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)",
          borderRadius: "18px",
          padding: "12px 14px",
          color: "#ffffff",
          marginBottom: "10px",
          boxShadow: "0 8px 24px -4px rgba(2, 132, 199, 0.4)",
          position: "relative",
          zIndex: 40,
        }}
      >
        {/* Subtle Background Glow Accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "90px",
            height: "90px",
            borderTopRightRadius: "18px",
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Title Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.02rem",
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              Evaluasi Perkembangan
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "#e0f2fe",
                opacity: 0.92,
                marginTop: "1px",
              }}
            >
              Uji Kelulusan &amp; Pembinaan Karakter Santri
            </div>
          </div>
          <span
            style={{
              fontSize: "0.64rem",
              background: "rgba(255, 255, 255, 0.22)",
              backdropFilter: "blur(6px)",
              padding: "3px 9px",
              borderRadius: "999px",
              fontWeight: 800,
              border: "1px solid rgba(255, 255, 255, 0.35)",
            }}
          >
            {rekapList.length} Total Uji
          </span>
        </div>

        {/* DUA KARTU STATISTIK (LULUS & BELUM LULUS - COMPACT) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          {/* Card 1: Lulus (Vibrant Emerald Glow) */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.38) 100%)",
              border: "1.5px solid rgba(134, 239, 172, 0.55)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 8px rgba(16, 185, 129, 0.4)",
                flexShrink: 0,
              }}
            >
              <CheckCircle size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: "#ffffff",
                }}
              >
                {countLulus}
              </div>
              <div
                style={{
                  fontSize: "0.64rem",
                  color: "#bbf7d0",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Lulus
              </div>
            </div>
          </div>

          {/* Card 2: Belum Lulus (Vibrant Rose/Red Glow) */}
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.28) 0%, rgba(220, 38, 38, 0.38) 100%)",
              border: "1.5px solid rgba(254, 205, 211, 0.55)",
              backdropFilter: "blur(10px)",
              borderRadius: "12px",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 3px 10px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 8px rgba(239, 68, 68, 0.4)",
                flexShrink: 0,
              }}
            >
              <XCircle size={16} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: "#ffffff",
                }}
              >
                {countTidakLulus}
              </div>
              <div
                style={{
                  fontSize: "0.64rem",
                  color: "#fecdd3",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Belum Lulus
              </div>
            </div>
          </div>
        </div>

        {/* SELECT OPTION: KELAS SANTRI (WAJIB PILIH) */}
        <div style={{ position: "relative", zIndex: 45 }}>
          <SearchableSelect
            options={availableKelasOptions.map((kls) => ({
              value: kls,
              label: `🏫 Kelas: ${kls}`,
            }))}
            value={selectedKelas}
            onChange={(val) => {
              const target = val || "";
              setSelectedKelas(target);
              loadSantriByKelas(target);
              if (activeTab === "scan") {
                stopFaceCamera();
                if (target) {
                  setTimeout(() => startFaceCamera(faceFacingMode), 150);
                }
              }
            }}
            placeholder="-- Wajib Pilih Kelas Santri --"
            searchPlaceholder="Cari kelas santri..."
            dropdownStyle={{
              zIndex: 99999,
              boxShadow: "0 14px 36px rgba(0,0,0,0.25)",
            }}
            triggerStyle={{
              padding: "9px 12px",
              borderRadius: "12px",
              border: !selectedKelas
                ? "2px solid #facc15"
                : "1px solid rgba(255, 255, 255, 0.35)",
              background: !selectedKelas
                ? "rgba(234, 179, 8, 0.28)"
                : "rgba(255, 255, 255, 0.16)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 800,
            }}
          />
          {loadingKelasSantri && (
            <div
              style={{
                position: "absolute",
                right: "32px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.66rem",
                color: "#fef08a",
                fontWeight: 700,
                pointerEvents: "none",
              }}
            >
              Memuat santri...
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. TAB NAVIGASI: SCAN, MANUAL, HISTORI
      ========================================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          background: "#ffffff",
          borderRadius: "13px",
          padding: "3px",
          marginBottom: "10px",
          gap: "4px",
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => handleSwitchTab("scan")}
          style={{
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background: activeTab === "scan" ? "#e0f2fe" : "transparent",
            color: activeTab === "scan" ? "#0284c7" : "#64748b",
            fontWeight: 800,
            fontSize: "0.72rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <Camera size={14} /> Scan
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("manual")}
          style={{
            padding: "7px 2px",
            borderRadius: "9px",
            border: "none",
            background: activeTab === "manual" ? "#e0f2fe" : "transparent",
            color: activeTab === "manual" ? "#0284c7" : "#64748b",
            fontWeight: 800,
            fontSize: "0.72rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <UserCheck size={14} /> Manual
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab("histori")}
          style={{
            padding: "8px 2px",
            borderRadius: "9px",
            border: "none",
            background: activeTab === "histori" ? "#f3e8ff" : "transparent",
            color: activeTab === "histori" ? "#7c3aed" : "#64748b",
            fontWeight: 800,
            fontSize: "0.72rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          <History size={14} /> Histori ({rekapList.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SCAN WAJAH AI (KAMERA INLINE)
      ========================================================================= */}
      {activeTab === "scan" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "14px",
            border: "1.5px solid #0284c7",
            marginBottom: "14px",
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.08)",
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
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Kamera Scan Wajah Santri
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={toggleFaceFacingMode}
                disabled={!selectedKelas}
                style={{
                  padding: "4px 8px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0284c7",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  cursor: selectedKelas ? "pointer" : "not-allowed",
                  opacity: selectedKelas ? 1 : 0.6,
                }}
              >
                <RotateCcw
                  size={12}
                  style={{ verticalAlign: "middle", marginRight: "3px" }}
                />{" "}
                Putar
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: soundEnabled ? "#f0fdf4" : "#fef2f2",
                  color: soundEnabled ? "#16a34a" : "#dc2626",
                  cursor: "pointer",
                }}
              >
                {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              </button>
            </div>
          </div>

          {/* Banner Status Siap Scan */}
          {selectedKelas && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "6px 12px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#166534",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <span>🏫 Kelas: {selectedKelas}</span>
                <span style={{ color: "#9ca3af" }}>•</span>
                <span>👥 {santriList.length} Santri</span>
              </div>
              <span
                style={{
                  background: "#16a34a",
                  color: "#ffffff",
                  padding: "1.5px 7px",
                  borderRadius: "999px",
                  fontSize: "0.62rem",
                }}
              >
                Siap Scan
              </span>
            </div>
          )}

          {/* Video Container with Locked Overlay jika Kelas Belum Dipilih */}
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
              minHeight: "260px",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#090d16",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!selectedKelas && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.92)",
                  backdropFilter: "blur(6px)",
                  zIndex: 15,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  textAlign: "center",
                  color: "#ffffff",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "rgba(245, 158, 11, 0.2)",
                    border: "1.5px solid #f59e0b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <Award size={24} color="#fbbf24" />
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    marginBottom: "5px",
                  }}
                >
                  Pilih Kelas Terlebih Dahulu!
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#cbd5e1",
                    maxWidth: "260px",
                    lineHeight: 1.35,
                  }}
                >
                  Tentukan <strong>Kelas Santri</strong> di dropdown atas
                  sebelum scan wajah dimulai.
                </div>
              </div>
            )}

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
              }}
            />

            {isFaceCameraActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  left: "10px",
                  right: "10px",
                  background: matchedSantriPreview
                    ? "rgba(16, 185, 129, 0.92)"
                    : isFaceDetected
                      ? "rgba(2, 132, 199, 0.9)"
                      : "rgba(15, 23, 42, 0.85)",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "7px 12px",
                  borderRadius: "10px",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {faceCameraError || faceStatusText}
              </div>
            )}
          </div>

          {/* Action Cek Manual Foto */}
          {selectedKelas && (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={handleSnapshotVerify}
                style={{
                  flex: 1,
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                <Camera size={15} /> Verifikasi Sekarang
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab("manual")}
                style={{
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontWeight: 700,
                  fontSize: "0.76rem",
                  cursor: "pointer",
                }}
              >
                Pilih Manual
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MANUAL (PILIH SANTRI SESUAI KELAS)
      ========================================================================= */}
      {activeTab === "manual" && (
        <div>
          {!selectedKelas ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 16px",
                background: "#fefce8",
                borderRadius: "16px",
                border: "1.5px solid #fef08a",
                color: "#854d0e",
                marginBottom: "14px",
              }}
            >
              <AlertTriangle
                size={34}
                color="#eab308"
                style={{ marginBottom: "8px" }}
              />
              <div style={{ fontWeight: 800, fontSize: "0.92rem" }}>
                Pilih Kelas Terlebih Dahulu
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "#a16207",
                  marginTop: "4px",
                  lineHeight: 1.4,
                }}
              >
                Tombol input manual dinonaktifkan. Silakan pilih kelas santri
                pada dropdown di atas terlebih dahulu.
              </div>
            </div>
          ) : (
            <>
              {/* Search Bar & Filter Santri */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "9px 12px",
                  }}
                >
                  <Search size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder={`Cari nama/NIS di Kelas ${selectedKelas}...`}
                    value={searchManual}
                    onChange={(e) => setSearchManual(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "0.78rem",
                      color: "#0f172a",
                    }}
                  />
                  {searchManual && (
                    <button
                      type="button"
                      onClick={() => setSearchManual("")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <select
                  value={filterManualStatus}
                  onChange={(e) => setFilterManualStatus(e.target.value)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "#334155",
                    outline: "none",
                  }}
                >
                  <option value="Semua">Semua</option>
                  <option value="Belum Evaluasi">Belum Evaluasi</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Belum Lulus">Belum Lulus</option>
                </select>
              </div>

              {/* List Santri */}
              {santriList.length === 0 && !loadingKelasSantri ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 16px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "0.8rem",
                  }}
                >
                  Tidak ada santri ditemukan di Kelas {selectedKelas}.
                </div>
              ) : filteredSantriManual.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px 16px",
                    background: "#ffffff",
                    borderRadius: "16px",
                    border: "1px dashed #cbd5e1",
                    color: "#64748b",
                    fontSize: "0.8rem",
                  }}
                >
                  Santri tidak cocok dengan pencarian / filter.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {filteredSantriManual.map((santri) => {
                    const theme = getAvatarTheme(santri.nama_santri);
                    const lastEval = rekapList.find(
                      (r) => String(r.santri_id) === String(santri.id),
                    );
                    const isLulus = lastEval?.status_kelulusan === "Lulus";

                    return (
                      <div
                        key={santri.id}
                        style={{
                          background: "#ffffff",
                          borderRadius: "14px",
                          padding: "12px",
                          border: lastEval
                            ? isLulus
                              ? "1.5px solid #86efac"
                              : "1.5px solid #fca5a5"
                            : "1px solid #e2e8f0",
                          borderLeft: lastEval
                            ? isLulus
                              ? "4px solid #10b981"
                              : "4px solid #ef4444"
                            : "4px solid #94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {/* Avatar Foto / Inisial */}
                          {santri.foto || santri.foto_santri ? (
                            <img
                              src={santri.foto || santri.foto_santri}
                              alt={santri.nama_santri}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                objectFit: "cover",
                                border: "1.5px solid #e2e8f0",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "12px",
                                background: theme.bg,
                                color: theme.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(santri.nama_santri)}
                            </div>
                          )}

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "0.84rem",
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {santri.nama_santri}
                            </div>
                            <div
                              style={{
                                fontSize: "0.68rem",
                                color: "#64748b",
                                marginTop: "1px",
                              }}
                            >
                              NIS: <strong>{santri.nis}</strong> •{" "}
                              {santri.nama_asrama || "Asrama"}
                            </div>

                            {/* Status Terakhir Badge */}
                            {lastEval ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  marginTop: "4px",
                                  fontSize: "0.64rem",
                                  fontWeight: 800,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: isLulus ? "#dcfce7" : "#fee2e2",
                                  color: isLulus ? "#15803d" : "#b91c1c",
                                  border: isLulus
                                    ? "1px solid #86efac"
                                    : "1px solid #fca5a5",
                                }}
                              >
                                {isLulus ? (
                                  <>
                                    <CheckCircle size={11} /> Lulus
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={11} /> Belum Lulus
                                  </>
                                )}{" "}
                                • {lastEval.nama_kategori || "Bidang"}
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginTop: "4px",
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  padding: "1px 7px",
                                  borderRadius: "6px",
                                  background: "#f1f5f9",
                                  color: "#64748b",
                                }}
                              >
                                Belum Dievaluasi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tombol Evaluasi */}
                        <button
                          type="button"
                          onClick={() => openEvaluationForSantri(santri)}
                          style={{
                            background: "#0284c7",
                            color: "#ffffff",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                            marginLeft: "8px",
                            flexShrink: 0,
                          }}
                        >
                          <Edit3 size={13} /> Evaluasi
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: HISTORI (DAFTAR RIWAYAT EVALUASI LENGKAP - CARD LULUS & BINA KEREN)
      ========================================================================= */}
      {activeTab === "histori" && (
        <div>
          {/* SELECT OPTION BIDANG PENGEMBANGAN (PENGGANTI TAB/CHIPS) */}
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <select
              value={filterHistoriKategori}
              onChange={(e) => setFilterHistoriKategori(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 32px 10px 12px",
                borderRadius: "12px",
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "#0f172a",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              <option value="Semua">📘 Semua Bidang Pengembangan</option>
              {masterKategoriAll.map((kat) => (
                <option key={kat.id} value={String(kat.id)}>
                  📘 {kat.nama_kategori}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              color="#64748b"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                padding: "8px 12px",
              }}
            >
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Cari nama santri, NIS, bidang..."
                value={searchHistori}
                onChange={(e) => setSearchHistori(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "0.78rem",
                  color: "#0f172a",
                }}
              />
            </div>

            <select
              value={filterHistoriStatus}
              onChange={(e) => setFilterHistoriStatus(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#334155",
                outline: "none",
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Lulus">✅ Lulus</option>
              <option value="Belum Lulus">❌ Belum Lulus</option>
            </select>
          </div>

          {/* LIST CARD EVALUASI PERKEMBANGAN DENGAN DESAIN LULUS & BINA SANGAT MENARIK */}
          {filteredHistori.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "36px 16px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Award
                size={40}
                color="#cbd5e1"
                style={{ margin: "0 auto 10px" }}
              />
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: "#475569",
                }}
              >
                Belum Ada Riwayat Evaluasi
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                Gunakan tab "Scan" atau "Manual" untuk menginput evaluasi
                santri.
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {filteredHistori.map((row) => {
                const isLulus = row.status_kelulusan === "Lulus";
                const theme = getAvatarTheme(row.nama_santri);

                return (
                  <div
                    key={row.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "18px",
                      padding: "15px",
                      border: isLulus
                        ? "1.5px solid #bbf7d0"
                        : "1.5px solid #fecdd3",
                      borderLeft: isLulus
                        ? "6px solid #10b981"
                        : "6px solid #ef4444",
                      boxShadow: isLulus
                        ? "0 4px 16px rgba(16, 185, 129, 0.08)"
                        : "0 4px 16px rgba(239, 68, 68, 0.08)",
                      position: "relative",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    {/* Header Baris 1: Profil Santri & Badge Lulus / Bina */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "11px",
                            background: theme.bg,
                            color: theme.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "0.82rem",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(row.nama_santri)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "0.9rem",
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.nama_santri}
                          </div>
                          <div
                            style={{
                              fontSize: "0.68rem",
                              color: "#64748b",
                              marginTop: "1px",
                            }}
                          >
                            NIS: <strong>{row.nis}</strong> •{" "}
                            {row.nama_asrama || "Asrama"}
                          </div>
                        </div>
                      </div>

                      {/* BADGE LULUS / BINA MENARIK DENGAN GLOW */}
                      {isLulus ? (
                        <span
                          style={{
                            background:
                              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#ffffff",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 3px 10px rgba(16, 185, 129, 0.35)",
                            letterSpacing: "0.02em",
                            flexShrink: 0,
                          }}
                        >
                          <CheckCircle size={13} strokeWidth={2.5} /> LULUS
                        </span>
                      ) : (
                        <span
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                            color: "#ffffff",
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 3px 10px rgba(239, 68, 68, 0.35)",
                            letterSpacing: "0.02em",
                            flexShrink: 0,
                          }}
                        >
                          <XCircle size={13} strokeWidth={2.5} /> BELUM LULUS
                        </span>
                      )}
                    </div>

                    {/* Baris 2: Bidang Uji & Tanggal */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: isLulus ? "#f0fdf4" : "#fff1f2",
                        padding: "7px 12px",
                        borderRadius: "10px",
                        marginBottom: "10px",
                        border: isLulus
                          ? "1px solid #dcfce7"
                          : "1px solid #ffe4e6",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: isLulus ? "#15803d" : "#b91c1c",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <BookOpen size={14} /> {row.nama_kategori}
                      </div>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: isLulus ? "#166534" : "#991b1b",
                          fontWeight: 700,
                        }}
                      >
                        {row.tanggal
                          ? new Date(row.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </span>
                    </div>

                    {/* KONTEN JIKA LULUS: BANNER PRESTASI BERSIH */}
                    {isLulus && (
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1px dashed #86efac",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          marginBottom: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "0.72rem",
                          color: "#166534",
                          fontWeight: 700,
                        }}
                      >
                        <Sparkles size={16} color="#16a34a" />
                        <span>
                          Santri memenuhi kriteria kelulusan pada materi bidang
                          ini dengan baik.
                        </span>
                      </div>
                    )}

                    {/* KONTEN JIKA PEMBINAAN: KARTU RINCIAN DIAGNOSTIK LENGKAP & TERSTRUKTUR */}
                    {!isLulus && (
                      <div
                        style={{
                          background: "#fff5f5",
                          border: "1.5px solid #fecdd3",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          marginBottom: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {/* Permasalahan */}
                        {row.permasalahan_list?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                color: "#b91c1c",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: "#ef4444",
                                }}
                              />
                              Permasalahan Ditemukan:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              {row.permasalahan_list.map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    border: "1px solid #fca5a5",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Penyebab */}
                        {row.penyebab_list?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                color: "#c2410c",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: "#f97316",
                                }}
                              />
                              Faktor Penyebab:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              {row.penyebab_list.map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: "#ffedd5",
                                    color: "#9a3412",
                                    border: "1px solid #fdba74",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tindakan Pembinaan */}
                        {row.tindakan_list?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                color: "#047857",
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                                marginBottom: "4px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  background: "#10b981",
                                }}
                              />
                              Rekomendasi Tindakan:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "4px",
                              }}
                            >
                              {row.tindakan_list.map((t, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    background: "#dcfce7",
                                    color: "#166534",
                                    border: "1px solid #86efac",
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Catatan Khusus Penguji */}
                        {row.catatan_tambahan && (
                          <div
                            style={{
                              background: "#ffffff",
                              borderLeft: "3px solid #f43f5e",
                              borderRadius: "4px",
                              padding: "6px 10px",
                              fontSize: "0.7rem",
                              color: "#475569",
                              fontStyle: "italic",
                            }}
                          >
                            "{row.catatan_tambahan}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: Penguji & Tombol Aksi */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "8px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        Penguji:{" "}
                        <strong style={{ color: "#334155" }}>
                          {row.asatidz_pencatat || currentPenguji}
                        </strong>
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleEditRekap(row)}
                          style={{
                            background: "#eff6ff",
                            color: "#0284c7",
                            border: "1px solid #bae6fd",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Edit3 size={11} /> Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRekap(row.id, row.nama_santri)
                          }
                          style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==+=======================================================================
          MODAL EVALUASI SANTRI (FULL SCREEN - LULUS vs BELUM LULUS)
      ========================================================================= */}
      {isEvalModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#ffffff",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header Modal */}
          <div
            style={{
              padding: "14px 18px",
              background: "#0369a1",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                Input Evaluasi Perkembangan
              </h3>
              <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                Pilih Bidang ➔ Hasil Kelulusan ➔ Diagnostik
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseEvalModal}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                width: "32px",
                height: "32px",
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

          {/* Body Form Full Screen */}
          <form
            onSubmit={handleSaveEvaluasi}
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Santri Card */}
            <div
              style={{
                background: "#f8fafc",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#0284c7",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  flexShrink: 0,
                }}
              >
                {getInitials(evalForm.santriObj?.nama_santri)}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: "#0f172a",
                  }}
                >
                  {evalForm.santriObj?.nama_santri || "Santri"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  NIS: <strong>{evalForm.santriObj?.nis || "-"}</strong> •{" "}
                  Kelas: <strong>{selectedKelas || "-"}</strong>
                </div>
              </div>
            </div>

            {/* STEP 1: PILIH BIDANG PENGEMBANGAN */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                1. Pilih Bidang Uji Pengembangan:
              </label>
              <select
                value={evalForm.kategori_id}
                onChange={(e) =>
                  setEvalForm((prev) => ({
                    ...prev,
                    kategori_id: e.target.value,
                    permasalahan: [],
                    penyebab: [],
                    tindakan: [],
                  }))
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                }}
              >
                {kategoriForEvalModal.map((k) => (
                  <option key={k.id} value={k.id}>
                    📘 {k.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal & Penguji */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "4px",
                  }}
                >
                  Tanggal Uji:
                </label>
                <input
                  type="date"
                  value={evalForm.tanggal}
                  onChange={(e) =>
                    setEvalForm((prev) => ({
                      ...prev,
                      tanggal: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: "4px",
                  }}
                >
                  Ustadz Penguji:
                </label>
                <input
                  type="text"
                  disabled
                  value={currentPenguji}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    background: "#f1f5f9",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                />
              </div>
            </div>

            {/* STEP 2: STATUS KELULUSAN (LULUS vs BELUM LULUS - SMALL) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "5px",
                }}
              >
                2. Hasil Keputusan Kelulusan:
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setEvalForm((prev) => ({
                      ...prev,
                      status_kelulusan: "Lulus",
                    }))
                  }
                  style={{
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border:
                      evalForm.status_kelulusan === "Lulus"
                        ? "1.5px solid #059669"
                        : "1px solid #cbd5e1",
                    background:
                      evalForm.status_kelulusan === "Lulus"
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "#ffffff",
                    color:
                      evalForm.status_kelulusan === "Lulus"
                        ? "#ffffff"
                        : "#475569",
                    fontWeight: 800,
                    fontSize: "0.76rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    cursor: "pointer",
                    boxShadow:
                      evalForm.status_kelulusan === "Lulus"
                        ? "0 3px 8px rgba(16,185,129,0.3)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <CheckCircle size={15} /> LULUS
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEvalForm((prev) => ({
                      ...prev,
                      status_kelulusan: "Belum Lulus",
                    }))
                  }
                  style={{
                    height: "36px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border:
                      evalForm.status_kelulusan !== "Lulus"
                        ? "1.5px solid #dc2626"
                        : "1px solid #cbd5e1",
                    background:
                      evalForm.status_kelulusan !== "Lulus"
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "#ffffff",
                    color:
                      evalForm.status_kelulusan !== "Lulus"
                        ? "#ffffff"
                        : "#475569",
                    fontWeight: 800,
                    fontSize: "0.76rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    cursor: "pointer",
                    boxShadow:
                      evalForm.status_kelulusan !== "Lulus"
                        ? "0 3px 8px rgba(239,68,68,0.3)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <XCircle size={15} /> BELUM LULUS
                </button>
              </div>
            </div>

            {/* STEP 3: CHECKLIST DIAGNOSTIK SAAT BELUM LULUS */}
            {evalForm.status_kelulusan !== "Lulus" && activeEvalKategoriObj && (
              <div
                style={{
                  background: "#fff1f2",
                  border: "1.5px solid #fecdd3",
                  borderRadius: "14px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <AlertTriangle size={15} /> Checklist Diagnostik (
                  {activeEvalKategoriObj.nama_kategori})
                </div>

                {/* (A) Permasalahan */}
                <div>
                  <div
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#b91c1c",
                      marginBottom: "5px",
                    }}
                  >
                    (A.) Permasalahan yang Ditemukan:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {(activeEvalKategoriObj.permasalahan || []).map(
                      (p, idx) => {
                        const checked = evalForm.permasalahan.includes(p.teks);
                        return (
                          <label
                            key={p.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "8px",
                              background: checked ? "#fee2e2" : "#ffffff",
                              padding: "7px 9px",
                              borderRadius: "8px",
                              border: checked
                                ? "1px solid #f87171"
                                : "1px solid #e2e8f0",
                              fontSize: "0.73rem",
                              color: "#1e293b",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleToggleChecklist("permasalahan", p.teks)
                              }
                              style={{
                                accentColor: "#dc2626",
                                marginTop: "2px",
                              }}
                            />
                            <span>
                              <strong>
                                {p.kode || String.fromCharCode(97 + idx)}.
                              </strong>{" "}
                              {p.teks}
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* (B) Penyebab */}
                <div>
                  <div
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#c2410c",
                      marginBottom: "5px",
                    }}
                  >
                    (B.) Faktor Penyebab:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {(activeEvalKategoriObj.penyebab || []).map((p, idx) => {
                      const checked = evalForm.penyebab.includes(p.teks);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            background: checked ? "#ffedd5" : "#ffffff",
                            padding: "7px 9px",
                            borderRadius: "8px",
                            border: checked
                              ? "1px solid #fb923c"
                              : "1px solid #e2e8f0",
                            fontSize: "0.73rem",
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleToggleChecklist("penyebab", p.teks)
                            }
                            style={{
                              accentColor: "#ea580c",
                              marginTop: "2px",
                            }}
                          />
                          <span>
                            <strong>
                              {p.kode || String.fromCharCode(97 + idx)}.
                            </strong>{" "}
                            {p.teks}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* (C) Tindakan */}
                <div>
                  <div
                    style={{
                      fontSize: "0.73rem",
                      fontWeight: 800,
                      color: "#047857",
                      marginBottom: "5px",
                    }}
                  >
                    (C.) Rekomendasi Tindakan / Pembinaan:
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    {(activeEvalKategoriObj.tindakan || []).map((p, idx) => {
                      const checked = evalForm.tindakan.includes(p.teks);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            background: checked ? "#dcfce7" : "#ffffff",
                            padding: "7px 9px",
                            borderRadius: "8px",
                            border: checked
                              ? "1px solid #4ade80"
                              : "1px solid #e2e8f0",
                            fontSize: "0.73rem",
                            color: "#1e293b",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              handleToggleChecklist("tindakan", p.teks)
                            }
                            style={{
                              accentColor: "#16a34a",
                              marginTop: "2px",
                            }}
                          />
                          <span>
                            <strong>
                              {p.kode || String.fromCharCode(97 + idx)}.
                            </strong>{" "}
                            {p.teks}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Catatan Tambahan */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#475569",
                  marginBottom: "4px",
                }}
              >
                Catatan Tambahan Penguji (Opsional):
              </label>
              <textarea
                rows={2}
                value={evalForm.catatan_tambahan}
                onChange={(e) =>
                  setEvalForm((prev) => ({
                    ...prev,
                    catatan_tambahan: e.target.value,
                  }))
                }
                placeholder="Tuliskan catatan kemajuan santri di sini..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.78rem",
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                paddingTop: "6px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={handleCloseEvalModal}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: "0.8rem",
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
                  borderRadius: "10px",
                  border: "none",
                  background: "#0284c7",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Save size={15} />{" "}
                {submitting ? "Menyimpan..." : "Simpan Evaluasi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
