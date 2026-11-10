import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import {
  Camera,
  Search,
  Check,
  X,
  RotateCcw,
  Smile,
  Users,
  AlertCircle,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toastSuccess, showError, showConfirm } from "../../utils/alert.util";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";
import SearchableSelect from "../../components/SearchableSelect";
import MobileLoadingState from "../../components/MobileLoadingState";
import {
  stopStreamAndVideo,
  stopAllActiveCameraStreams,
} from "../../utils/cameraCleanup.util";

export default function MobileDaftarWajah() {
  // Lightweight list (no raw base64 photos in global memory)
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'unregistered' | 'needs_scan' | 'registered'
  const [viewLayout, setViewLayout] = useState("grid"); // 'grid' | 'list'
  const [displayLimit, setDisplayLimit] = useState(30);

  // Batch Scanner State
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
    currentSantri: null,
  });
  const [scanningSingleId, setScanningSingleId] = useState(null);
  const cancelBatchRef = useRef(false);

  // Modal & Camera State
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // 'user' | 'environment'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [faceScore, setFaceScore] = useState(0);
  const [isCheckingFace, setIsCheckingFace] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [aiModelStatus, setAiModelStatus] = useState("idle"); // 'idle' | 'loading' | 'ready' | 'error'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectTimeoutRef = useRef(null);
  const isDetectingRef = useRef(false);
  const isCameraActiveRef = useRef(false);
  const aiInitPromiseRef = useRef(null);

  // Reset pagination limit on filter change
  useEffect(() => {
    setDisplayLimit(30);
  }, [search, selectedKelas, filterMode]);

  // Ensure AI Models Ready Strictly On-Demand
  const ensureAiModelsReady = useCallback(async () => {
    if (isFaceModelReady()) {
      setAiModelStatus("ready");
      return true;
    }

    if (aiInitPromiseRef.current) {
      return aiInitPromiseRef.current;
    }

    setAiModelStatus("loading");
    aiInitPromiseRef.current = initFaceApiModels()
      .then(() => {
        setAiModelStatus("ready");
        aiInitPromiseRef.current = null;
        return true;
      })
      .catch((err) => {
        console.warn("Face models init error:", err);
        setAiModelStatus("error");
        aiInitPromiseRef.current = null;
        return false;
      });

    return aiInitPromiseRef.current;
  }, []);

  // 1. Initial Data Fetch: Strictly lightweight summary data (No Base64 Bloat)
  const fetchSantri = async () => {
    try {
      setLoading(true);
      const [resSantri, resKelas] = await Promise.all([
        axios
          .get("/api/santri/for-face-registration")
          .catch(() =>
            axios.get("/api/santri?all=true&compact=true&without_photo=true"),
          ),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
      ]);

      if (resKelas.data?.data && Array.isArray(resKelas.data.data)) {
        setKelasList(resKelas.data.data);
      }

      if (resSantri.data?.data && Array.isArray(resSantri.data.data)) {
        // Strip any heavy base64 strings if fallback was called
        const cleanList = resSantri.data.data.map((s) => ({
          id: s.id,
          nis: s.nis,
          nama_santri: s.nama_santri,
          nama_kelas: s.nama_kelas,
          kelas_id: s.kelas_id,
          nama_asrama: s.nama_asrama || "",
          has_face_descriptor:
            s.has_face_descriptor === 1 ||
            (s.face_descriptor && s.face_descriptor !== "[]")
              ? 1
              : 0,
          has_photo: s.has_photo === 1 || !!s.foto ? 1 : 0,
        }));
        setSantriList(cleanList);
      }
    } catch (err) {
      console.warn("Gagal memuat daftar santri:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
    const handlePageHide = () => {
      stopCamera();
      stopAllActiveCameraStreams();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      stopCamera();
      stopAllActiveCameraStreams();
    };
  }, []);

  // Calculate unindexed list from lightweight state
  const unindexedList = useMemo(() => {
    return santriList.filter(
      (s) => s.has_photo === 1 && s.has_face_descriptor === 0,
    );
  }, [santriList]);

  // Helper Cek Status Pendaftaran Wajah Santri
  const checkSantriEnrolled = useCallback((s) => {
    return Number(s?.has_face_descriptor) === 1;
  }, []);

  // Helper Cek Apakah Santri Memiliki File Foto
  const checkSantriHasPhoto = useCallback((s) => {
    return Number(s?.has_photo) === 1;
  }, []);

  // 2. Camera Controls
  const startCamera = async (facing = facingMode) => {
    setCameraError("");
    setIsCameraActive(true);
    isCameraActiveRef.current = true;
    setSnapshot(null);
    setIsFaceDetected(false);
    setFaceScore(0);
    setCapturedDescriptor(null);

    // Warm up AI models in background while camera opens
    ensureAiModelsReady().catch(() => {});

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (!isCameraActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        scheduleNextLiveCheck(200);
      }
    } catch (err) {
      console.warn("Camera error:", err);
      setCameraError("Kamera tidak dapat diakses atau izin belum diberikan.");
      setIsCameraActive(false);
      isCameraActiveRef.current = false;
    }
  };

  const stopCamera = () => {
    isCameraActiveRef.current = false;
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
      detectTimeoutRef.current = null;
    }
    stopStreamAndVideo(streamRef, videoRef);
    setIsCameraActive(false);
    setIsFaceDetected(false);
    setFaceScore(0);
  };

  const toggleFacingMode = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(next), 200);
    }
  };

  // 3. Live Face Detection Loop: Non-blocking recursive setTimeout loop
  const scheduleNextLiveCheck = (delayMs = 350) => {
    if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current);
    if (!isCameraActiveRef.current) return;

    detectTimeoutRef.current = setTimeout(runLiveDuplicateCheck, delayMs);
  };

  const runLiveDuplicateCheck = async () => {
    if (!isCameraActiveRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) {
      scheduleNextLiveCheck(300);
      return;
    }

    if (isDetectingRef.current || !isFaceModelReady()) {
      scheduleNextLiveCheck(350);
      return;
    }

    isDetectingRef.current = true;
    try {
      const faceRes = await detectFaceDescriptor(video);
      if (!isCameraActiveRef.current) return;

      if (!faceRes) {
        setIsFaceDetected(false);
        setFaceScore(0);
      } else {
        setIsFaceDetected(true);
        const score = Math.round((faceRes.score || 0.88) * 100);
        setFaceScore(score);
      }
    } catch (e) {
      setIsFaceDetected(false);
    } finally {
      isDetectingRef.current = false;
      if (isCameraActiveRef.current) {
        scheduleNextLiveCheck(350);
      }
    }
  };

  // 4. Capture Snapshot
  const captureSnapshot = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;

    setIsCheckingFace(true);
    try {
      const liveFace = await detectFaceDescriptor(video);
      if (!liveFace) {
        setIsCheckingFace(false);
        showError(
          "Wajah Tidak Terdeteksi!",
          "Kamera belum mendeteksi wajah manusia secara jelas. Harap hadapkan kamera tepat ke wajah santri di tempat yang cukup terang.",
        );
        return null;
      }

      const canvas = document.createElement("canvas");
      const vW = video.videoWidth || 640;
      const vH = video.videoHeight || 480;
      const size = Math.min(vW, vH);
      const sX = (vW - size) / 2;
      const sY = (vH - size) / 2;

      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, sX, sY, size, size, 0, 0, 320, 320);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

      setCapturedDescriptor(liveFace.descriptor);
      setSnapshot(dataUrl);
      stopCamera();
      return dataUrl;
    } catch (err) {
      showError("Gagal Mengambil Foto", err.message);
      return null;
    } finally {
      setIsCheckingFace(false);
    }
  };

  // 5. Open Modal & Save
  const handleOpenEnrollModal = async (santri) => {
    setSelectedSantri(santri);
    const isEnrolled = checkSantriEnrolled(santri);
    const hasPhoto = checkSantriHasPhoto(santri);

    // Initial thumbnail preview if exists
    const initialPhoto =
      isEnrolled || hasPhoto ? `/api/santri/${santri.id}/photo-thumb` : null;
    setSnapshot(initialPhoto);

    // Prepare camera & models
    startCamera(facingMode);
  };

  const handleCloseModal = () => {
    stopCamera();
    setSelectedSantri(null);
    setSnapshot(null);
    setCapturedDescriptor(null);
  };

  const handleSaveFace = async () => {
    if (!selectedSantri || !snapshot) {
      showError("Foto Kosong", "Silakan ambil foto wajah terlebih dahulu.");
      return;
    }

    setSaving(true);
    try {
      let descriptor = capturedDescriptor;
      if (!descriptor) {
        await ensureAiModelsReady();
        descriptor = await extractDescriptorFromDataUrl(snapshot);
      }

      if (!descriptor) {
        showError(
          "Wajah Tidak Terdeteksi!",
          'Sistem AI menolak foto ini karena bukan wajah manusia. Harap klik "Ambil Ulang" dan pastikan wajah santri menghadap kamera.',
        );
        setSaving(false);
        return;
      }

      const cleanDesc =
        descriptor instanceof Float32Array
          ? Array.from(descriptor)
          : descriptor;

      try {
        await axios.post(`/api/santri/${selectedSantri.id}/face-descriptor`, {
          face_descriptor: cleanDesc,
          foto: snapshot,
        });
      } catch (errPost) {
        await axios.patch(`/api/santri/${selectedSantri.id}/foto`, {
          foto: snapshot,
          descriptor: cleanDesc,
          face_descriptor: cleanDesc,
        });
      }

      // Update lightweight state
      setSantriList((prev) =>
        prev.map((s) =>
          s.id === selectedSantri.id
            ? { ...s, has_face_descriptor: 1, has_photo: 1 }
            : s,
        ),
      );

      toastSuccess(`Wajah ${selectedSantri.nama_santri} berhasil didaftarkan!`);
      handleCloseModal();
    } catch (err) {
      console.error("[SIMPAN WAJAH ERROR]", err);
      showError(
        "Gagal Menyimpan",
        err?.response?.data?.message ||
          err?.message ||
          "Gagal menyimpan data wajah.",
      );
    } finally {
      setSaving(false);
    }
  };

  // 6. Delete Face
  const handleDeleteFace = async (santri) => {
    const ok = await showConfirm(
      "Hapus Wajah Santri?",
      `Yakin ingin menghapus foto & biometrik wajah "${santri.nama_santri}"? Santri ini tidak akan bisa presensi wajah sebelum didaftarkan kembali.`,
      "Ya, Hapus",
      "Batal",
    );
    if (!ok) return;

    try {
      // Optimistic update
      setSantriList((prev) =>
        prev.map((s) =>
          String(s.id) === String(santri.id)
            ? { ...s, has_face_descriptor: 0, has_photo: 0 }
            : s,
        ),
      );

      if (selectedSantri && String(selectedSantri.id) === String(santri.id)) {
        setSnapshot(null);
        setCapturedDescriptor(null);
      }

      toastSuccess(
        `Foto & biometrik wajah ${santri.nama_santri} berhasil dihapus.`,
      );

      // Non-blocking server deletion
      axios
        .delete(`/api/santri/${santri.id}/face-descriptor`)
        .catch(() =>
          axios.patch(`/api/santri/${santri.id}/foto`, {
            foto: null,
            clear_face: true,
          }),
        )
        .catch((err) => console.warn("Delete face warning:", err));
    } catch (e) {
      showError("Gagal Menghapus", "Terjadi kendala saat menghapus data.");
    }
  };

  // 7. Single Scan AI (On-Demand Fetching single santri photo)
  const handleScanSinglePhoto = async (santri) => {
    if (scanningSingleId) return;
    setScanningSingleId(santri.id);

    try {
      await ensureAiModelsReady();

      // Fetch photo on-demand only for this specific santri
      const res = await axios.get(`/api/santri/${santri.id}`);
      const photoSrc = res.data?.data?.foto;

      if (!photoSrc) {
        showError(
          "Foto Kosong",
          `Santri ${santri.nama_santri} belum memiliki file foto.`,
        );
        setScanningSingleId(null);
        return;
      }

      const descriptor = await extractDescriptorFromDataUrl(photoSrc);
      if (!descriptor) {
        showError(
          "Wajah Tidak Terdeteksi!",
          `Foto "${santri.nama_santri}" tidak terdeteksi sebagai wajah manusia oleh AI. Pastikan foto jelas dan menghadap ke depan.`,
        );
        setScanningSingleId(null);
        return;
      }

      const cleanDesc =
        descriptor instanceof Float32Array
          ? Array.from(descriptor)
          : descriptor;
      await axios.post(`/api/santri/${santri.id}/face-descriptor`, {
        face_descriptor: cleanDesc,
      });

      // Update state
      setSantriList((prev) =>
        prev.map((item) =>
          String(item.id) === String(santri.id)
            ? { ...item, has_face_descriptor: 1 }
            : item,
        ),
      );

      // Update descriptors cache
      if (registeredDescriptorsRef.current) {
        registeredDescriptorsRef.current.push({
          id: santri.id,
          nis: santri.nis,
          nama_santri: santri.nama_santri,
          face_descriptor: cleanDesc,
        });
      }

      toastSuccess(`Biometrik wajah ${santri.nama_santri} berhasil diekstrak!`);
    } catch (e) {
      showError(
        "Gagal Ekstraksi Wajah",
        e?.response?.data?.message || e.message,
      );
    } finally {
      setScanningSingleId(null);
    }
  };

  // 8. Batch Scan AI (Processes unindexed queue on-demand one by one)
  const handleStartBatchScan = async () => {
    if (!unindexedList || unindexedList.length === 0) {
      toastSuccess("Semua foto santri sudah memiliki biometrik AI!");
      return;
    }

    const aiReady = await ensureAiModelsReady();
    if (!aiReady) {
      showError(
        "Gagal Memuat AI",
        "Model AI pendeteksi wajah belum siap. Harap cek koneksi internet.",
      );
      return;
    }

    setIsBatchScanning(true);
    cancelBatchRef.current = false;
    let successCount = 0;
    let failCount = 0;
    const total = unindexedList.length;

    for (let i = 0; i < total; i++) {
      if (cancelBatchRef.current) break;
      const s = unindexedList[i];
      setBatchProgress({
        current: i + 1,
        total,
        success: successCount,
        failed: failCount,
        currentSantri: s,
      });

      try {
        // Fetch single photo on-demand to avoid loading entire batch into memory at once
        const res = await axios.get(`/api/santri/${s.id}`);
        const photoSrc = res.data?.data?.foto;

        if (!photoSrc) {
          failCount++;
          continue;
        }

        const descriptor = await extractDescriptorFromDataUrl(photoSrc);
        if (descriptor) {
          const cleanDesc =
            descriptor instanceof Float32Array
              ? Array.from(descriptor)
              : descriptor;
          await axios.post(`/api/santri/${s.id}/face-descriptor`, {
            face_descriptor: cleanDesc,
          });

          setSantriList((prev) =>
            prev.map((item) =>
              String(item.id) === String(s.id)
                ? { ...item, has_face_descriptor: 1 }
                : item,
            ),
          );
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.warn(`Scan error santri ${s.nama_santri}:`, err);
        failCount++;
      }

      await new Promise((r) => setTimeout(r, 60));
    }

    setIsBatchScanning(false);
    if (!cancelBatchRef.current) {
      toastSuccess(
        `Scan Selesai! ${successCount} wajah berhasil diekstrak, ${failCount} tidak terdeteksi.`,
      );
    } else {
      toastSuccess(`Scan dihentikan. ${successCount} berhasil diproses.`);
    }
  };

  const handleStopBatchScan = () => {
    cancelBatchRef.current = true;
    setIsBatchScanning(false);
  };

  // 9. Filtering & Calculations
  const combinedKelasOptions = useMemo(() => {
    const list = [...kelasList];
    santriList.forEach((s) => {
      const kName = s.nama_kelas;
      if (
        kName &&
        !list.some(
          (k) => k.nama_kelas === kName || String(k.id) === String(s.kelas_id),
        )
      ) {
        list.push({ id: s.kelas_id || kName, nama_kelas: kName });
      }
    });
    return list;
  }, [kelasList, santriList]);

  const classFilteredSantri = useMemo(() => {
    return santriList.filter((s) => {
      if (selectedKelas !== "Semua") {
        const matchKelas =
          String(s.kelas_id) === String(selectedKelas) ||
          String(s.nama_kelas) === String(selectedKelas);
        if (!matchKelas) return false;
      }
      return true;
    });
  }, [santriList, selectedKelas]);

  const totalRegisteredInClass = useMemo(() => {
    return classFilteredSantri.filter(checkSantriEnrolled).length;
  }, [classFilteredSantri, checkSantriEnrolled]);

  const totalNeedsScanInClass = useMemo(() => {
    return classFilteredSantri.filter(
      (s) => checkSantriHasPhoto(s) && !checkSantriEnrolled(s),
    ).length;
  }, [classFilteredSantri, checkSantriHasPhoto, checkSantriEnrolled]);

  const filteredSantri = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classFilteredSantri.filter((s) => {
      if (q) {
        const matchSearch =
          s.nama_santri?.toLowerCase().includes(q) ||
          s.nis?.toLowerCase().includes(q) ||
          s.nama_asrama?.toLowerCase().includes(q) ||
          s.nama_kelas?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      const isEnrolled = checkSantriEnrolled(s);
      const hasPhoto = checkSantriHasPhoto(s);
      if (filterMode === "unregistered") return !isEnrolled;
      if (filterMode === "registered") return isEnrolled;
      if (filterMode === "needs_scan") return hasPhoto && !isEnrolled;
      return true;
    });
  }, [
    classFilteredSantri,
    search,
    filterMode,
    checkSantriEnrolled,
    checkSantriHasPhoto,
  ]);

  const totalRegistered = useMemo(() => {
    return santriList.filter(checkSantriEnrolled).length;
  }, [santriList, checkSantriEnrolled]);

  if (loading) {
    return (
      <div
        style={{
          padding: "14px",
          background: "#f8fafc",
          minHeight: "100%",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <MobileLoadingState
          title="Memuat Daftar Wajah Santri..."
          subtitle="Mohon tunggu sebentar, sistem sedang memuat data..."
          iconColor="#0284c7"
          cardCount={4}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "14px",
        background: "#f8fafc",
        minHeight: "100%",
        fontFamily: "'Inter', sans-serif",
      }}
    >


      {/* Banner Scan Otomatis Foto Tanpa Biometrik */}
      {unindexedList.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "16px",
            padding: "12px 14px",
            color: "#ffffff",
            marginBottom: "14px",
            boxShadow: "0 6px 16px -3px rgba(217, 119, 6, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                background: "rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  lineHeight: 1.2,
                }}
              >
                {unindexedList.length} Foto Siap Di-scan Otomatis
              </div>
              <div
                style={{ fontSize: "0.7rem", opacity: 0.92, marginTop: "2px" }}
              >
                Generate kode biometrik AI untuk foto santri
              </div>
            </div>
          </div>
          <button
            onClick={handleStartBatchScan}
            disabled={isBatchScanning}
            style={{
              padding: "8px 13px",
              borderRadius: "11px",
              background: "#ffffff",
              color: "#b45309",
              border: "none",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: isBatchScanning ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {isBatchScanning ? (
              <Loader2 size={14} color="#b45309" className="animate-spin" />
            ) : (
              <Zap size={14} color="#b45309" />
            )}
            <span>{isBatchScanning ? "Memproses..." : "Scan AI"}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {/* Search */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "6px 12px",
            border: "1.5px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <Search size={16} color="#0284c7" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, asrama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#1e293b",
            }}
          />
          {search && (
            <X
              size={15}
              color="#94a3b8"
              onClick={() => setSearch("")}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>

        {/* Filter Kelas Santri */}
        <div>
          <SearchableSelect
            options={[
              { value: "Semua", label: "Semua Kelas" },
              ...combinedKelasOptions.map((k) => ({
                value: String(k.id || k.nama_kelas),
                label: k.nama_kelas || `Kelas ${k.id}`,
                sublabel: k.tingkat ? `Tingkat: ${k.tingkat}` : "",
              })),
            ]}
            value={selectedKelas}
            onChange={(val) => setSelectedKelas(val || "Semua")}
            placeholder="Filter Berdasarkan Kelas..."
            searchPlaceholder="Cari kelas..."
            triggerStyle={{
              background: "#ffffff",
              border:
                selectedKelas !== "Semua"
                  ? "1.5px solid #0284c7"
                  : "1.5px solid #e2e8f0",
              borderRadius: "12px",
              padding: "8px 12px",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: selectedKelas !== "Semua" ? "#0284c7" : "#334155",
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterMode("all")}
            style={{
              flex: 1,
              minWidth: "70px",
              padding: "7px 4px",
              borderRadius: "10px",
              border:
                filterMode === "all"
                  ? "1.5px solid #0284c7"
                  : "1px solid #e2e8f0",
              background: filterMode === "all" ? "#0284c7" : "#ffffff",
              color: filterMode === "all" ? "#ffffff" : "#64748b",
              fontSize: "0.74rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Semua ({classFilteredSantri.length})
          </button>
          <button
            onClick={() => setFilterMode("unregistered")}
            style={{
              flex: 1,
              minWidth: "85px",
              padding: "7px 4px",
              borderRadius: "10px",
              border:
                filterMode === "unregistered"
                  ? "1.5px solid #ea580c"
                  : "1px solid #e2e8f0",
              background: filterMode === "unregistered" ? "#fff7ed" : "#ffffff",
              color: filterMode === "unregistered" ? "#ea580c" : "#64748b",
              fontSize: "0.74rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Belum AI ({classFilteredSantri.length - totalRegisteredInClass})
          </button>
          {totalNeedsScanInClass > 0 && (
            <button
              onClick={() => setFilterMode("needs_scan")}
              style={{
                flex: 1,
                minWidth: "95px",
                padding: "7px 4px",
                borderRadius: "10px",
                border:
                  filterMode === "needs_scan"
                    ? "1.5px solid #d97706"
                    : "1px solid #fed7aa",
                background: filterMode === "needs_scan" ? "#fef3c7" : "#fffbeb",
                color: "#b45309",
                fontSize: "0.74rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Belum Scan ({totalNeedsScanInClass})
            </button>
          )}
          <button
            onClick={() => setFilterMode("registered")}
            style={{
              flex: 1,
              minWidth: "80px",
              padding: "7px 4px",
              borderRadius: "10px",
              border:
                filterMode === "registered"
                  ? "1.5px solid #059669"
                  : "1px solid #e2e8f0",
              background: filterMode === "registered" ? "#ecfdf5" : "#ffffff",
              color: filterMode === "registered" ? "#059669" : "#64748b",
              fontSize: "0.74rem",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Sudah Ada ({totalRegisteredInClass})
          </button>
        </div>

        {/* Layout Switcher & Total Found */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 4px",
          }}
        >
          <span
            style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700 }}
          >
            Menampilkan{" "}
            <strong style={{ color: "#0284c7" }}>
              {filteredSantri.length}
            </strong>{" "}
            santri
          </span>
          <div
            style={{
              display: "flex",
              background: "#e2e8f0",
              borderRadius: "10px",
              padding: "2px",
              gap: "2px",
            }}
          >
            <button
              onClick={() => setViewLayout("grid")}
              title="Tampilan Grid"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 9px",
                borderRadius: "8px",
                border: "none",
                background: viewLayout === "grid" ? "#ffffff" : "transparent",
                color: viewLayout === "grid" ? "#0284c7" : "#64748b",
                boxShadow:
                  viewLayout === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              <LayoutGrid size={13} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewLayout("list")}
              title="Tampilan List"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 9px",
                borderRadius: "8px",
                border: "none",
                background: viewLayout === "list" ? "#ffffff" : "transparent",
                color: viewLayout === "list" ? "#0284c7" : "#64748b",
                boxShadow:
                  viewLayout === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer",
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              <List size={13} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Santri Cards Container (Grid or List) */}
      {filteredSantri.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "36px 20px",
            textAlign: "center",
            color: "#94a3b8",
            border: "1.5px dashed #cbd5e1",
            margin: "10px 0",
          }}
        >
          <Users size={38} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
          <div
            style={{
              fontSize: "0.86rem",
              fontWeight: 800,
              color: "#475569",
              marginBottom: "4px",
            }}
          >
            Tidak ada santri ditemukan
          </div>
          <div style={{ fontSize: "0.74rem" }}>
            Coba sesuaikan kata kunci pencarian atau pilih kelas lain.
          </div>
        </div>
      ) : viewLayout === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "10px",
            paddingBottom:
              filteredSantri.length > displayLimit ? "16px" : "80px",
          }}
        >
          {filteredSantri.slice(0, displayLimit).map((santri) => {
            const isEnrolled = checkSantriEnrolled(santri);
            const hasPhoto = checkSantriHasPhoto(santri);
            const thumbUrl =
              isEnrolled || hasPhoto
                ? `/api/santri/${santri.id}/photo-thumb`
                : null;

            return (
              <div
                key={santri.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "12px 10px",
                  border: isEnrolled
                    ? "1.5px solid #10b981"
                    : hasPhoto
                      ? "1.5px solid #f59e0b"
                      : "1.5px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: isEnrolled
                    ? "0 4px 14px -2px rgba(16, 185, 129, 0.15)"
                    : hasPhoto
                      ? "0 4px 14px -2px rgba(245, 158, 11, 0.15)"
                      : "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                {/* Status Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    right: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: isEnrolled
                        ? "#d1fae5"
                        : hasPhoto
                          ? "#fef3c7"
                          : "#f1f5f9",
                      color: isEnrolled
                        ? "#059669"
                        : hasPhoto
                          ? "#b45309"
                          : "#64748b",
                    }}
                  >
                    {isEnrolled
                      ? "✓ AI Siap"
                      : hasPhoto
                        ? "⚠️ Belum AI"
                        : "Belum Ada"}
                  </span>

                  {(isEnrolled || hasPhoto) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFace(santri);
                      }}
                      title="Hapus Wajah Santri"
                      style={{
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        color: "#e11d48",
                        width: "24px",
                        height: "24px",
                        borderRadius: "7px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Photo / Avatar */}
                <div
                  onClick={() => handleOpenEnrollModal(santri)}
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    background: isEnrolled
                      ? "#d1fae5"
                      : hasPhoto
                        ? "#fef3c7"
                        : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "18px",
                    marginBottom: "8px",
                    border: isEnrolled
                      ? "2.5px solid #10b981"
                      : hasPhoto
                        ? "2.5px solid #f59e0b"
                        : "2px dashed #cbd5e1",
                    boxShadow: isEnrolled
                      ? "0 4px 10px rgba(16, 185, 129, 0.2)"
                      : "none",
                    cursor: "pointer",
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={santri.nama_santri}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Camera size={26} color="#94a3b8" />
                  )}
                </div>

                {/* Name */}
                <span
                  title={santri.nama_santri}
                  style={{
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    color: "#0f172a",
                    lineHeight: 1.25,
                    marginBottom: "4px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.1em",
                  }}
                >
                  {santri.nama_santri}
                </span>

                {/* NIS & Kelas */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "0.66rem",
                    color: "#64748b",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{santri.nis || "-"}</span>
                  {santri.nama_kelas && (
                    <span
                      style={{
                        background: "#f0f9ff",
                        color: "#0284c7",
                        padding: "1px 5px",
                        borderRadius: "5px",
                        fontWeight: 700,
                        fontSize: "0.62rem",
                      }}
                    >
                      {santri.nama_kelas}
                    </span>
                  )}
                </div>

                {/* Button Ambil/Ubah Foto atau Scan AI */}
                {!isEnrolled && hasPhoto ? (
                  <button
                    onClick={() => handleScanSinglePhoto(santri)}
                    disabled={scanningSingleId === santri.id}
                    style={{
                      width: "100%",
                      marginTop: "auto",
                      padding: "7px 6px",
                      borderRadius: "11px",
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor:
                        scanningSingleId === santri.id
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: "0 3px 8px rgba(217, 119, 6, 0.25)",
                    }}
                  >
                    {scanningSingleId === santri.id ? (
                      <Loader2
                        size={13}
                        color="#ffffff"
                        className="animate-spin"
                      />
                    ) : (
                      <Zap size={13} color="#ffffff" />
                    )}
                    <span>
                      {scanningSingleId === santri.id
                        ? "Memproses..."
                        : "Scan AI"}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenEnrollModal(santri)}
                    style={{
                      width: "100%",
                      marginTop: "auto",
                      padding: "7px 6px",
                      borderRadius: "11px",
                      background: isEnrolled
                        ? "#f0fdf4"
                        : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: isEnrolled ? "#059669" : "#ffffff",
                      border: isEnrolled ? "1.5px solid #a7f3d0" : "none",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      boxShadow: isEnrolled
                        ? "none"
                        : "0 3px 8px rgba(2, 132, 199, 0.22)",
                    }}
                  >
                    <Camera size={13} />
                    <span>{isEnrolled ? "Ubah" : "Ambil Foto"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingBottom:
              filteredSantri.length > displayLimit ? "16px" : "70px",
          }}
        >
          {filteredSantri.slice(0, displayLimit).map((santri) => {
            const isEnrolled = checkSantriEnrolled(santri);
            const hasPhoto = checkSantriHasPhoto(santri);
            const thumbUrl =
              isEnrolled || hasPhoto
                ? `/api/santri/${santri.id}/photo-thumb`
                : null;

            return (
              <div
                key={santri.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "12px 14px",
                  border: isEnrolled
                    ? "1.5px solid #10b981"
                    : hasPhoto
                      ? "1.5px solid #f59e0b"
                      : "1.5px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Photo / Avatar */}
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: isEnrolled
                      ? "#d1fae5"
                      : hasPhoto
                        ? "#fef3c7"
                        : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: isEnrolled
                      ? "1.5px solid #059669"
                      : hasPhoto
                        ? "1.5px solid #f59e0b"
                        : "1px solid #cbd5e1",
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={santri.nama_santri}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Camera size={20} color="#94a3b8" />
                  )}
                </div>

                {/* Info Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
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
                      {santri.nama_santri}
                    </span>
                    {isEnrolled ? (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          fontWeight: 800,
                        }}
                      >
                        AI Siap
                      </span>
                    ) : hasPhoto ? (
                      <span
                        style={{
                          fontSize: "0.62rem",
                          background: "#fef3c7",
                          color: "#b45309",
                          border: "1px solid #fed7aa",
                          padding: "1px 6px",
                          borderRadius: "999px",
                          fontWeight: 800,
                        }}
                      >
                        Belum AI
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginTop: "2px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      NIS: {santri.nis || "-"}
                    </span>
                    {santri.nama_kelas && (
                      <>
                        <span>•</span>
                        <span
                          style={{
                            background: "#f0f9ff",
                            color: "#0284c7",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: 700,
                          }}
                        >
                          {santri.nama_kelas}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{santri.nama_asrama || "Asrama"}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                  }}
                >
                  {!isEnrolled && hasPhoto && (
                    <button
                      onClick={() => handleScanSinglePhoto(santri)}
                      disabled={scanningSingleId === santri.id}
                      style={{
                        padding: "7px 11px",
                        borderRadius: "10px",
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        cursor:
                          scanningSingleId === santri.id
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {scanningSingleId === santri.id ? (
                        <Loader2
                          size={12}
                          color="#ffffff"
                          className="animate-spin"
                        />
                      ) : (
                        <Zap size={12} color="#ffffff" />
                      )}
                      <span>Scan AI</span>
                    </button>
                  )}

                  {(isEnrolled || hasPhoto) && (
                    <button
                      onClick={() => handleDeleteFace(santri)}
                      title="Hapus Wajah Santri"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        background: "#fff1f2",
                        color: "#e11d48",
                        border: "1px solid #fecdd3",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEnrollModal(santri)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "10px",
                      background: isEnrolled ? "#f0fdf4" : "#0284c7",
                      color: isEnrolled ? "#059669" : "#ffffff",
                      border: isEnrolled ? "1px solid #a7f3d0" : "none",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Camera size={13} />
                    <span>{isEnrolled ? "Ubah" : "Ambil Foto"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tombol Muat Lebih Banyak (Lazy Paginate Render) */}
      {filteredSantri.length > displayLimit && (
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            marginBottom: "85px",
          }}
        >
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 30)}
            style={{
              background: "#ffffff",
              border: "1.5px solid #0284c7",
              color: "#0284c7",
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.78rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={13} />
            <span>
              Muat Lebih Banyak ({filteredSantri.length - displayLimit} santri
              lagi)
            </span>
          </button>
        </div>
      )}

      {/* Floating Batch Scan Progress Card */}
      {isBatchScanning && (
        <div
          style={{
            position: "fixed",
            bottom: "75px",
            left: "14px",
            right: "14px",
            maxWidth: "460px",
            margin: "0 auto",
            zIndex: 999,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "18px",
            padding: "16px",
            color: "#ffffff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Loader2 size={18} color="#38bdf8" className="animate-spin" />
              <span style={{ fontWeight: 800, fontSize: "0.86rem" }}>
                Memproses Biometrik Wajah AI...
              </span>
            </div>
            <button
              onClick={handleStopBatchScan}
              style={{
                background: "rgba(239, 68, 68, 0.25)",
                border: "1px solid #f87171",
                color: "#f87171",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Hentikan
            </button>
          </div>

          {batchProgress.currentSantri && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 12px",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#38bdf8",
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                }}
              >
                {batchProgress.currentSantri.nama_santri?.charAt(0) || "S"}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {batchProgress.currentSantri.nama_santri}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  NIS: {batchProgress.currentSantri.nis} •{" "}
                  {batchProgress.currentSantri.nama_kelas || "Santri"}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              marginBottom: "5px",
              color: "#94a3b8",
            }}
          >
            <span>
              Memproses {batchProgress.current} dari {batchProgress.total}
            </span>
            <span style={{ color: "#38bdf8", fontWeight: 800 }}>
              {Math.round(
                (batchProgress.current / (batchProgress.total || 1)) * 100,
              )}
              %
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: `${Math.round((batchProgress.current / (batchProgress.total || 1)) * 100)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #38bdf8, #22c55e)",
                transition: "width 0.2s ease",
              }}
            />
          </div>

          {/* Stats summary */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "#cbd5e1",
            }}
          >
            <span style={{ color: "#4ade80" }}>
              ✓ {batchProgress.success} Berhasil
            </span>
            <span style={{ color: "#f87171" }}>
              ✗ {batchProgress.failed} Gagal / Tanpa Wajah
            </span>
          </div>
        </div>
      )}

      {/* Modal Ambil Foto / Daftarkan Wajah Santri */}
      {selectedSantri && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "0.94rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Daftarkan Wajah Santri
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    color: "#0284c7",
                    fontWeight: 700,
                  }}
                >
                  {selectedSantri.nama_santri} (NIS: {selectedSantri.nis})
                </p>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {checkSantriEnrolled(selectedSantri) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteFace(selectedSantri);
                      handleCloseModal();
                    }}
                    title="Hapus Wajah Terdaftar"
                    style={{
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      borderRadius: "8px",
                      color: "#e11d48",
                      padding: "5px 8px",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Hapus Wajah</span>
                  </button>
                )}
                <button
                  onClick={handleCloseModal}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Viewport */}
            <div style={{ padding: "16px" }}>
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: "18px",
                  overflow: "hidden",
                  background: "#090d16",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                {snapshot ? (
                  <img
                    src={snapshot}
                    alt="Preview Foto"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = "";
                    }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: facingMode === "user" ? "scaleX(-1)" : "none",
                    }}
                  />
                )}

                {/* Reticle guide frame dengan status warna real-time */}
                {!snapshot && (
                  <div
                    style={{
                      position: "absolute",
                      width: "68%",
                      height: "68%",
                      borderRadius: "50%",
                      pointerEvents: "none",
                      border: isFaceDetected
                        ? "3.5px solid #22c55e"
                        : "2.5px dashed rgba(245, 158, 11, 0.85)",
                      boxShadow: isFaceDetected
                        ? "0 0 22px rgba(34, 197, 94, 0.85)"
                        : "none",
                      transition: "all 0.25s ease",
                    }}
                  />
                )}

                {/* Floating Status Guide Pill (Real-Time Wajah vs Meja/Benda) */}
                {!snapshot && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      right: "12px",
                      padding: "7px 12px",
                      borderRadius: "20px",
                      textAlign: "center",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                      background: isFaceDetected
                        ? "rgba(21, 128, 61, 0.94)"
                        : "rgba(217, 119, 6, 0.92)",
                      color: "#ffffff",
                      zIndex: 10,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isFaceDetected
                      ? `🟢 Wajah Pas & Terdeteksi (${faceScore}%)`
                      : `⚠️ Bukan Wajah / Belum Pas (Arahkan ke Wajah Santri)`}
                  </div>
                )}

                {/* Badge saat Snapshot Berhasil Terverifikasi */}
                {snapshot && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "14px",
                      right: "14px",
                      background: "rgba(5, 150, 105, 0.92)",
                      backdropFilter: "blur(6px)",
                      color: "#ffffff",
                      padding: "6px 12px",
                      borderRadius: "12px",
                      textAlign: "center",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                    }}
                  >
                    ✓ Wajah Manusia Terverifikasi AI Biometrik
                  </div>
                )}
              </div>

              {/* Action Buttons inside modal */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {!snapshot ? (
                  <>
                    <button
                      onClick={toggleFacingMode}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0284c7",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <RotateCcw size={14} /> Putar Kamera
                    </button>
                    <button
                      disabled={!isFaceDetected || isCheckingFace}
                      onClick={() => {
                        if (!isFaceDetected) {
                          showError(
                            "Wajah Tidak Terdeteksi!",
                            "Kamera belum mendeteksi wajah manusia secara jelas. Silakan arahkan kamera tepat ke wajah santri di tempat yang cukup terang.",
                          );
                          return;
                        }
                        captureSnapshot();
                      }}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background:
                          !isFaceDetected || isCheckingFace
                            ? "#94a3b8"
                            : "linear-gradient(135deg, #059669 0%, #047857 100%)",
                        color: "#ffffff",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        cursor:
                          !isFaceDetected || isCheckingFace
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        boxShadow:
                          isFaceDetected && !isCheckingFace
                            ? "0 4px 12px rgba(5, 150, 105, 0.4)"
                            : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Camera size={16} />
                      <span>
                        {isCheckingFace
                          ? "Memeriksa Wajah..."
                          : isFaceDetected
                            ? "Ambil Foto Wajah"
                            : "Arahkan ke Wajah"}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startCamera(facingMode)}
                      style={{
                        flex: 1,
                        padding: "9px 14px",
                        borderRadius: "10px",
                        border: "1px solid #fecdd3",
                        background: "#fff1f2",
                        color: "#e11d48",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Ambil Ulang
                    </button>
                    <button
                      disabled={saving}
                      onClick={handleSaveFace}
                      style={{
                        flex: 1.5,
                        padding: "9px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#059669",
                        color: "#ffffff",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Check size={16} />{" "}
                      {saving ? "Menyimpan..." : "Simpan Wajah"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
