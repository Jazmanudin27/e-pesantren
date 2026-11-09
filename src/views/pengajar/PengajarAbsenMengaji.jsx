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
  ListFilter,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { toastSuccess, toastError } from "../../utils/alert.util";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  matchFaceDescriptor,
  isFaceModelReady
} from "../../utils/faceApi.util";

export default function PengajarAbsenMengaji() {
  // Main Tab: 'scan' | 'manual' | 'histori'
  const [activeTab, setActiveTab] = useState("manual");

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

  // =========================================================================
  // GOOGLE MEDIAPIPE AI SCANNER STATES (TAB SCAN)
  // =========================================================================
  const [faceModelStatus, setFaceModelStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [facingMode, setFacingMode] = useState("environment");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [lastDetectedSantri, setLastDetectedSantri] = useState(null);
  const [recentScanLog, setRecentScanLog] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const recentDetectionsRef = useRef(new Map());

  // =========================================================================
  // HISTORI PRESENSI STATES (TAB HISTORI)
  // =========================================================================
  const [historiList, setHistoriList] = useState([]);
  const [loadingHistori, setLoadingHistori] = useState(false);
  const [historiTanggal, setHistoriTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [historiSearch, setHistoriSearch] = useState("");

  // Audio Chime feedback
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  };

  // 1. Ambil Sesi & Kelas Master
  const fetchSesiDanKelas = async () => {
    try {
      const [resDashboard, resKelas] = await Promise.all([
        axios.get("/api/pengajar/dashboard").catch(() => ({ data: {} })),
        axios.get("/api/kelas").catch(() => ({ data: {} }))
      ]);

      const list = resDashboard.data?.data?.daftarSesi;
      if (Array.isArray(list) && list.length > 0) {
        setSesiList(list);
        if (!selectedSesi) setSelectedSesi(String(list[0].id));
      }

      const kList = resKelas.data?.data || resKelas.data || [];
      if (Array.isArray(kList)) {
        setKelasList(kList);
      }
    } catch (e) {
      console.warn("Gagal inisialisasi sesi/kelas:", e);
    }
  };

  // 2. Ambil Data Santri & Status Presensi Mengaji
  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      const kParam = selectedKelas !== "Semua" ? selectedKelas : "";
      const res = await axios.get(
        `/api/pengajar/absen-mengaji?tanggal=${tanggal}&sesi_id=${selectedSesi}&kelas=${encodeURIComponent(kParam)}`
      );
      if (res.data?.success && res.data.data?.list) {
        setSantriList(res.data.data.list);

        // Ekstrak list kelas jika belum ada
        if (kelasList.length === 0) {
          const uniqueClasses = Array.from(
            new Set(res.data.data.list.map((s) => s.nama_kelas).filter(Boolean))
          ).map((c) => ({ nama_kelas: c }));
          if (uniqueClasses.length > 0) setKelasList(uniqueClasses);
        }
      }
    } catch (e) {
      toastError("Gagal memuat daftar santri untuk presensi");
    } finally {
      setLoading(false);
    }
  };

  // 3. Ambil Histori Presensi
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
  // AUTO-SAVE HANDLER (INSTANT ON CLICK / SCAN TANPA KLIK SIMPAN)
  // =========================================================================
  const autoSaveSingleStatus = async (santriId, newStatus, metode = "Manual_Ustadz") => {
    // 1. Optimistic UI update
    setSantriList((prev) =>
      prev.map((s) => {
        if (s.santri_id === santriId) {
          return { ...s, status: newStatus };
        }
        return s;
      })
    );

    setSavingId(santriId);
    try {
      const sesiObj = sesiList.find((s) => String(s.id) === String(selectedSesi));
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

  // Semua Hadir sekaligus (Auto-Save Batch)
  const handleMarkAllHadir = async () => {
    setSantriList((prev) => prev.map((s) => ({ ...s, status: "Hadir" })));
    try {
      const sesiObj = sesiList.find((s) => String(s.id) === String(selectedSesi));
      const payload = {
        tanggal,
        sesi_id: selectedSesi ? parseInt(selectedSesi, 10) : null,
        nama_sesi: sesiObj?.nama_sesi || "Mengaji & Kajian Kitab",
        nama_ustadz: "Ustadz Pengajar",
        metode_presensi: "Manual_Ustadz",
        items: santriList.map((s) => ({
          santri_id: s.santri_id,
          status: "Hadir",
          keterangan: "",
        })),
      };

      await axios.post("/api/pengajar/absen-mengaji", payload);
      toastSuccess(`Berhasil menandai Hadir untuk ${santriList.length} santri`);
    } catch (e) {
      toastError("Gagal menyimpan: " + e.message);
    }
  };

  // =========================================================================
  // GOOGLE MEDIAPIPE FACE AI CAMERA LOGIC (TAB SCAN)
  // =========================================================================
  const startCamera = async (mode = facingMode) => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }
    } catch (err) {
      setCameraError("Izin kamera ditolak atau kamera tidak tersedia.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startDetectionLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = setInterval(async () => {
      if (isDetectingRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        isDetectingRef.current = true;
        const descriptor = await detectFaceDescriptor(videoRef.current);

        if (descriptor && Array.isArray(descriptor) && descriptor.length > 0) {
          const candidates = santriList
            .filter((s) => s.face_descriptor)
            .map((s) => {
              let parsed = null;
              try {
                parsed = typeof s.face_descriptor === "string"
                  ? JSON.parse(s.face_descriptor)
                  : s.face_descriptor;
              } catch (e) {}
              return {
                id: s.santri_id,
                nama: s.nama_santri,
                descriptor: parsed,
              };
            })
            .filter((c) => Array.isArray(c.descriptor) && c.descriptor.length > 0);

          if (candidates.length > 0) {
            const match = matchFaceDescriptor(descriptor, candidates, 0.62);
            if (match && match.santri) {
              const matchedId = match.santri.id;
              const now = Date.now();
              const lastTime = recentDetectionsRef.current.get(matchedId) || 0;

              // Cooldown 4 detik
              if (now - lastTime > 4000) {
                recentDetectionsRef.current.set(matchedId, now);
                playSuccessChime();

                // OTOMATIS SIMPAN KE DATABASE HADIR (AI)
                autoSaveSingleStatus(matchedId, "Hadir", "Wajah_AI");

                const detectedInfo = {
                  nama: match.santri.nama,
                  confidence: Math.round((1 - match.distance) * 100),
                  waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                };

                setLastDetectedSantri(detectedInfo);
                setRecentScanLog((prev) => [detectedInfo, ...prev.slice(0, 4)]);
              }
            }
          }
        }
      } catch (err) {
      } finally {
        isDetectingRef.current = false;
      }
    }, 400);
  };

  useEffect(() => {
    if (activeTab === "scan") {
      setFaceModelStatus("loading");
      initFaceApiModels()
        .then(() => {
          setFaceModelStatus("ready");
          startCamera(facingMode);
          startDetectionLoop();
        })
        .catch(() => {
          setFaceModelStatus("error");
          setCameraError("Gagal memuat Google MediaPipe FaceMesh AI.");
        });
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const toggleFacingMode = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  // Stats Counters
  const countHadir = santriList.filter((s) => s.status === "Hadir").length;
  const countSakit = santriList.filter((s) => s.status === "Sakit").length;
  const countIzin = santriList.filter((s) => s.status === "Izin").length;
  const countAlfa = santriList.filter((s) => s.status === "Alfa").length;

  const filteredSantri = santriList.filter((s) => {
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
              SESI KEGIATAN
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
                  {s.nama_sesi} ({String(s.jam_mulai || "").slice(0, 5)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PILIHAN SANTRI PER KELAS (CHIPS / DROPDOWN) */}
        <div>
          <label style={{ display: "block", fontSize: "0.64rem", fontWeight: 800, color: "#334155", marginBottom: "5px" }}>
            PILIH KELAS SANTRI
          </label>
          <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "2px" }}>
            <button
              type="button"
              onClick={() => setSelectedKelas("Semua")}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                fontSize: "0.66rem",
                fontWeight: 800,
                border: selectedKelas === "Semua" ? "1.5px solid #0d766e" : "1px solid #cbd5e1",
                background: selectedKelas === "Semua" ? "#ecfdf5" : "#ffffff",
                color: selectedKelas === "Semua" ? "#047857" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              Semua Kelas ({santriList.length})
            </button>
            {kelasList.map((k, idx) => (
              <button
                key={k.id || idx}
                type="button"
                onClick={() => setSelectedKelas(k.nama_kelas)}
                style={{
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  border: selectedKelas === k.nama_kelas ? "1.5px solid #0d766e" : "1px solid #cbd5e1",
                  background: selectedKelas === k.nama_kelas ? "#ecfdf5" : "#ffffff",
                  color: selectedKelas === k.nama_kelas ? "#047857" : "#475569",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0
                }}
              >
                {k.nama_kelas}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. STATS BADGES COUNTER (IDENTIK OWNER STYLE) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
        <div style={{ background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#15803d" }}>{countHadir}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#166534" }}>Hadir</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)", border: "1px solid #fecaca", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b91c1c" }}>{countSakit}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#991b1b" }}>Sakit</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#b45309" }}>{countIzin}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#92400e" }}>Izin</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)", border: "1px solid #99f6e4", borderRadius: "12px", padding: "6px 2px", textAlign: "center" }}>
          <div style={{ fontSize: "1rem", fontWeight: 900, color: "#0f766e" }}>{countAlfa}</div>
          <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "#115e59" }}>Alfa</div>
        </div>
      </div>

      {/* 3. TABS PILIHAN MODE: SCAN WAJAH | MANUAL | HISTORI */}
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
        {/* Tab Scan */}
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
            transition: "all 0.15s ease",
          }}
        >
          <Camera size={13} /> Scan Wajah
        </button>

        {/* Tab Manual */}
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
            transition: "all 0.15s ease",
          }}
        >
          <Users size={13} /> Manual
        </button>

        {/* Tab Histori */}
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
            transition: "all 0.15s ease",
          }}
        >
          <History size={13} /> Histori
        </button>
      </div>

      {/* =====================================================================
          KONTEN TAB 1: MODE SCAN WAJAH (GOOGLE MEDIAPIPE AI AUTO-SAVE)
      ===================================================================== */}
      {activeTab === "scan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Kamera Viewfinder Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0f172a" }}>
                  Scanner AI Google MediaPipe
                </span>
              </div>
              <button
                type="button"
                onClick={toggleFacingMode}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "7px",
                  padding: "5px 8px",
                  fontSize: "0.64rem",
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <RotateCcw size={11} /> Putar Kamera
              </button>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                height: "270px",
                background: "#0f172a",
                borderRadius: "14px",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                }}
              />

              {/* Target Oval Face */}
              <div
                style={{
                  position: "absolute",
                  width: "150px",
                  height: "190px",
                  border: lastDetectedSantri ? "3.5px solid #10b981" : "2px dashed rgba(255, 255, 255, 0.75)",
                  borderRadius: "85px",
                  boxShadow: lastDetectedSantri ? "0 0 25px rgba(16, 185, 129, 0.7)" : "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                  pointerEvents: "none",
                  transition: "all 0.25s ease",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: "rgba(15, 23, 42, 0.75)",
                  color: "#ffffff",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Sparkles size={11} color="#34d399" />
                {faceModelStatus === "loading" && "Menyiapkan AI..."}
                {faceModelStatus === "ready" && "Otomatis Hadir Aktif"}
                {faceModelStatus === "error" && "Error Kamera"}
              </div>

              {cameraError && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#f87171", padding: "16px", textAlign: "center", fontSize: "0.75rem" }}>
                  <AlertCircle size={22} style={{ marginBottom: "6px" }} />
                  {cameraError}
                </div>
              )}
            </div>

            {/* Banner Hasil Deteksi Otomatis */}
            {lastDetectedSantri ? (
              <div
                style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                  border: "1.5px solid #a7f3d0",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#10b981", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#065f46" }}>
                      {lastDetectedSantri.nama}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#047857" }}>
                      Otomatis Tersimpan Hadir • {lastDetectedSantri.confidence}% Akurasi
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "#059669", color: "#ffffff", padding: "3px 8px", borderRadius: "6px" }}>
                  TERCATAT
                </span>
              </div>
            ) : (
              <div style={{ textAlign: "center", fontSize: "0.66rem", color: "#64748b" }}>
                Arahkan kamera ke santri. <strong>Otomatis tersimpan Hadir ke database</strong> saat wajah dikenali.
              </div>
            )}
          </div>

          {/* Riwayat Scan Real-time */}
          {recentScanLog.length > 0 && (
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "10px 12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.66rem", fontWeight: 800, color: "#334155", marginBottom: "6px" }}>
                Presensi Scan Terakhir:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {recentScanLog.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      background: "#f8fafc",
                      borderRadius: "7px",
                      fontSize: "0.64rem",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#0f172a" }}>✓ {log.nama}</span>
                    <span style={{ color: "#059669", fontWeight: 700 }}>{log.waktu} (Hadir)</span>
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
          {/* Toolbar Search & Tombol Semua Hadir */}
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
                flexShrink: 0
              }}
            >
              <Check size={13} strokeWidth={2.8} /> Semua Hadir
            </button>
          </div>

          <div style={{ fontSize: "0.62rem", color: "#64748b", padding: "0 2px" }}>
            * Klik status di bawah: <strong>otomatis langsung tersimpan ke database</strong> tanpa tombol simpan.
          </div>

          {/* List Santri Per Kelas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                <RotateCw size={22} className="animate-spin" color="#0d766e" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>Memuat daftar santri...</div>
              </div>
            ) : filteredSantri.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.78rem" }}>
                Tidak ada santri di kelas ini.
              </div>
            ) : (
              filteredSantri.map((s, idx) => {
                const isItemSaving = savingId === s.santri_id;

                return (
                  <div
                    key={s.santri_id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {idx + 1}. {s.nama_santri}
                        </span>
                        {isItemSaving && (
                          <span style={{ fontSize: "0.55rem", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                            <RotateCw size={9} className="animate-spin" /> Menyimpan...
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                        NIS: {s.nis || "-"} • {s.nama_kelas || "Santri"}
                      </div>
                    </div>

                    {/* Instant Status Button (Auto-Save on Click) */}
                    <div style={{ display: "flex", gap: "4px" }}>
                      {["Hadir", "Sakit", "Izin", "Alfa"].map((st) => {
                        const isActive = s.status === st;
                        const getColors = () => {
                          if (st === "Hadir") return { bg: "#dcfce7", text: "#15803d", border: "#86efac" };
                          if (st === "Sakit") return { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" };
                          if (st === "Izin") return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" };
                          return { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" };
                        };
                        const colors = getColors();

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => autoSaveSingleStatus(s.santri_id, st, "Manual_Ustadz")}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.65rem",
                              fontWeight: isActive ? 900 : 600,
                              cursor: "pointer",
                              border: isActive ? `1.5px solid ${colors.text}` : "1px solid #e2e8f0",
                              background: isActive ? colors.bg : "#ffffff",
                              color: isActive ? colors.text : "#64748b",
                              transition: "all 0.12s ease",
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
          KONTEN TAB 3: MENU HISTORI PRESENSI MENGAJI
      ===================================================================== */}
      {activeTab === "histori" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Filter Tanggal & Pencarian Histori */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "10px 12px",
              border: "1px solid #e2e8f0",
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <input
              type="date"
              value={historiTanggal}
              onChange={(e) => setHistoriTanggal(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.72rem",
                outline: "none"
              }}
            />

            <div style={{ position: "relative", flex: 1 }}>
              <Search size={13} style={{ position: "absolute", left: "9px", top: "8px", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Cari di riwayat..."
                value={historiSearch}
                onChange={(e) => setHistoriSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px 6px 28px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.72rem",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* List Data Riwayat Histori */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {loadingHistori ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                <RotateCw size={22} className="animate-spin" color="#475569" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>Memuat histori...</div>
              </div>
            ) : filteredHistori.length === 0 ? (
              <div style={{ textAlign: "center", padding: "26px", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", color: "#64748b", fontSize: "0.76rem" }}>
                Belum ada data riwayat presensi pada tanggal ini.
              </div>
            ) : (
              filteredHistori.map((h) => {
                const isScan = h.metode_presensi === "Wajah_AI";
                const isHadir = h.status === "Hadir";

                return (
                  <div
                    key={h.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px"
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
                        {h.nama_sesi} • Jam: {h.waktu_scan || "-"}
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
                          border: `1px solid ${isHadir ? "#a7f3d0" : "#fecaca"}`
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
    </div>
  );
}
