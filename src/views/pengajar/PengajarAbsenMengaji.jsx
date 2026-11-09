import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  Search,
  Save,
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
  Volume2
} from "lucide-react";
import { toastSuccess, toastError } from "../../utils/alert.util";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  matchFaceDescriptor,
  isFaceModelReady
} from "../../utils/faceApi.util";

export default function PengajarAbsenMengaji() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sesiList, setSesiList] = useState([]);
  const [selectedSesi, setSelectedSesi] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [search, setSearch] = useState("");
  const [santriList, setSantriList] = useState([]);

  // =========================================================================
  // GOOGLE MEDIAPIPE FACEMESH AI SCANNER STATES
  // =========================================================================
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModelStatus, setFaceModelStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' (back) | 'user' (front)
  const [cameraError, setCameraError] = useState("");
  const [lastDetectedSantri, setLastDetectedSantri] = useState(null);
  const [recentScanLog, setRecentScanLog] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const recentDetectionsRef = useRef(new Map()); // santriId -> timestamp cooldown

  // Audio Chime feedback
  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  };

  // Ambil sesi mengaji asli dari database
  const fetchSesi = async () => {
    try {
      const res = await axios.get("/api/pengajar/dashboard");
      const list = res.data?.data?.daftarSesi;
      if (Array.isArray(list) && list.length > 0) {
        setSesiList(list);
        if (!selectedSesi) setSelectedSesi(String(list[0].id));
        return;
      }
      const fpRes = await axios.get("/api/fingerprint/sesi");
      const fpList = fpRes.data?.data || fpRes.data;
      if (Array.isArray(fpList) && fpList.length > 0) {
        const mapped = fpList.map((s) => ({
          id: s.id,
          nama_sesi: s.nama_sesi,
          jam_mulai: s.jam_mulai_presensi || s.jam_target || "00:00",
        }));
        setSesiList(mapped);
        if (!selectedSesi) setSelectedSesi(String(mapped[0].id));
        return;
      }
      setSesiList([]);
    } catch (e) {
      console.warn("Gagal memuat sesi:", e);
      setSesiList([]);
    }
  };

  // Ambil data santri untuk presensi
  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/pengajar/absen-mengaji?tanggal=${tanggal}&sesi_id=${selectedSesi}&kelas=${kelasFilter}`
      );
      if (res.data?.success && res.data.data?.list) {
        setSantriList(res.data.data.list);
      }
    } catch (e) {
      toastError("Gagal memuat daftar santri untuk presensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSesi();
  }, []);

  useEffect(() => {
    if (selectedSesi) {
      fetchAbsensi();
    }
  }, [tanggal, selectedSesi, kelasFilter]);

  const handleStatusChange = (santriId, newStatus) => {
    setSantriList((prev) =>
      prev.map((s) => {
        if (s.santri_id === santriId) {
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
  };

  const handleMarkAll = (statusToSet) => {
    setSantriList((prev) => prev.map((s) => ({ ...s, status: statusToSet })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const sesiObj = sesiList.find((s) => String(s.id) === String(selectedSesi));
      const payload = {
        tanggal,
        sesi_id: selectedSesi ? parseInt(selectedSesi, 10) : null,
        nama_sesi: sesiObj?.nama_sesi || "Mengaji & Kajian Kitab",
        nama_ustadz: "Ustadz Pengajar",
        items: santriList.map((s) => ({
          santri_id: s.santri_id,
          status: s.status,
          keterangan: s.keterangan || "",
        })),
      };

      const res = await axios.post("/api/pengajar/absen-mengaji", payload);
      if (res.data?.success) {
        toastSuccess("Presensi mengaji berhasil disimpan ke database!");
        fetchAbsensi();
      }
    } catch (e) {
      toastError(
        "Gagal menyimpan presensi mengaji: " +
          (e.response?.data?.message || e.message)
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // LOGIKA SCAN WAJAH GOOGLE MEDIAPIPE AI
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
      }
    } catch (err) {
      setCameraError("Izin kamera ditolak atau kamera tidak tersedia.");
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
  };

  // Mulai loop deteksi Google MediaPipe FaceMesh
  const startDetectionLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    detectIntervalRef.current = setInterval(async () => {
      if (isDetectingRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        isDetectingRef.current = true;
        const descriptor = await detectFaceDescriptor(videoRef.current);

        if (descriptor && Array.isArray(descriptor) && descriptor.length > 0) {
          // Cari santri yang punya face_descriptor
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

              // Cooldown 4 detik agar tidak spam
              if (now - lastTime > 4000) {
                recentDetectionsRef.current.set(matchedId, now);
                playSuccessChime();

                // Tandai santri sebagai Hadir
                handleStatusChange(matchedId, "Hadir");

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
        // silent loop error
      } finally {
        isDetectingRef.current = false;
      }
    }, 400); // 400ms tick for optimal performance
  };

  useEffect(() => {
    if (showFaceModal) {
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
      setLastDetectedSantri(null);
    }
    return () => stopCamera();
  }, [showFaceModal]);

  const toggleFacingMode = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  // Hitung stats
  const countHadir = santriList.filter((s) => s.status === "Hadir").length;
  const countSakit = santriList.filter((s) => s.status === "Sakit").length;
  const countIzin = santriList.filter((s) => s.status === "Izin").length;
  const countAlfa = santriList.filter((s) => s.status === "Alfa").length;

  const filteredSantri = santriList.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.nama_santri || "").toLowerCase().includes(q) ||
      (s.nis || "").toLowerCase().includes(q) ||
      (s.nama_kelas || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* 1. KONTROL PILIHAN SESI & TANGGAL */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "14px 16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Pilih Sesi &amp; Waktu Mengaji
            </div>
            <div style={{ fontSize: "0.64rem", color: "#64748b" }}>
              Tentukan kegiatan halaqah / kajian yang akan diabsen
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#475569",
                marginBottom: "4px",
              }}
            >
              TANGGAL MENGAJI
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#475569",
                marginBottom: "4px",
              }}
            >
              SESI KEGIATAN
            </label>
            <select
              value={selectedSesi}
              onChange={(e) => setSelectedSesi(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
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
      </div>

      {/* 2. STATS BADGES COUNTER (LUXURY EXECUTIVE STYLE IDENTIK OWNER) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {/* Hadir */}
        <div
          style={{
            background: "linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(16, 185, 129, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#10b981",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Check size={14} strokeWidth={3} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#15803d",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {countHadir}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#166534",
              marginTop: "2px",
            }}
          >
            Hadir
          </div>
        </div>

        {/* Sakit */}
        <div
          style={{
            background: "linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)",
            border: "1px solid #fecaca",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(239, 68, 68, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#ef4444",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Building2 size={13} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#b91c1c",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {countSakit}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#991b1b",
              marginTop: "2px",
            }}
          >
            Sakit
          </div>
        </div>

        {/* Izin */}
        <div
          style={{
            background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)",
            border: "1px solid #fde68a",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(245, 158, 11, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#f59e0b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
            }}
          >
            <FileText size={13} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#b45309",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {countIzin}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#92400e",
              marginTop: "2px",
            }}
          >
            Izin
          </div>
        </div>

        {/* Alfa */}
        <div
          style={{
            background: "linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)",
            border: "1px solid #99f6e4",
            borderRadius: "14px",
            padding: "8px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(13, 148, 136, 0.08)",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              background: "#0d9488",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
            }}
          >
            <Clock size={13} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 900,
              color: "#0f766e",
              marginTop: "3px",
              lineHeight: 1,
            }}
          >
            {countAlfa}
          </div>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "#115e59",
              marginTop: "2px",
            }}
          >
            Alfa
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR PENCARIAN, TOMBOL CEPAT & SCAN WAJAH GOOGLE MEDIAPIPE */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "150px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "9px",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Cari santri / kelas..."
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

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {/* TOMBOL SCAN WAJAH AI (GOOGLE MEDIAPIPE) */}
          <button
            type="button"
            onClick={() => setShowFaceModal(true)}
            style={{
              padding: "7px 11px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 3px 8px rgba(13, 148, 136, 0.28)",
            }}
          >
            <Camera size={13} />
            <span>Scan Wajah</span>
            <Sparkles size={11} color="#a7f3d0" />
          </button>

          <button
            type="button"
            onClick={() => handleMarkAll("Hadir")}
            style={{
              padding: "7px 11px",
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
            }}
          >
            <Check size={13} strokeWidth={2.8} /> Semua Hadir
          </button>

          <button
            type="button"
            disabled={saving || santriList.length === 0}
            onClick={handleSave}
            style={{
              padding: "7px 14px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #0d766e 0%, #042f2e 100%)",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 800,
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(13, 118, 110, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Save size={13} /> {saving ? "Menyimpan..." : "Simpan Presensi"}
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODAL SCAN WAJAH GOOGLE MEDIAPIPE AI CAMERA
      ========================================================================= */}
      {showFaceModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
          }}
          onClick={() => setShowFaceModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              maxWidth: "440px",
              width: "100%",
              padding: "16px",
              boxShadow: "0 25px 40px -10px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #f1f5f9",
                paddingBottom: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a" }}>
                    Scan Wajah Santri (MediaPipe AI)
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#64748b" }}>
                    Deteksi 468 Landmark 3D Otomatis Hadir
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  title="Ganti Kamera Depan/Belakang"
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <RotateCcw size={12} /> Kamera
                </button>

                <button
                  onClick={() => setShowFaceModal(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Viewfinder Kamera */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "260px",
                background: "#0f172a",
                borderRadius: "16px",
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

              {/* Face Guide Target Overlay */}
              <div
                style={{
                  position: "absolute",
                  width: "160px",
                  height: "200px",
                  border: lastDetectedSantri ? "3px solid #10b981" : "2px dashed rgba(255, 255, 255, 0.7)",
                  borderRadius: "90px",
                  boxShadow: lastDetectedSantri ? "0 0 25px rgba(16, 185, 129, 0.6)" : "0 0 0 9999px rgba(0, 0, 0, 0.35)",
                  pointerEvents: "none",
                  transition: "all 0.25s ease",
                }}
              />

              {/* Status AI Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: "rgba(15, 23, 42, 0.75)",
                  color: "#ffffff",
                  padding: "4px 8px",
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
                {faceModelStatus === "loading" && "Memuat AI MediaPipe..."}
                {faceModelStatus === "ready" && "Google MediaPipe 3D Aktif"}
                {faceModelStatus === "error" && "Gagal Memuat AI"}
              </div>

              {cameraError && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.9)",
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
                </div>
              )}
            </div>

            {/* Banner Santri Terdeteksi */}
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
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "#10b981",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 900, color: "#065f46" }}>
                      {lastDetectedSantri.nama}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#047857" }}>
                      Terverifikasi Hadir • Akurasi: {lastDetectedSantri.confidence}%
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    background: "#059669",
                    color: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  HADIR
                </span>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.66rem",
                  color: "#64748b",
                  padding: "4px 0",
                }}
              >
                Arahkan kamera ke wajah santri. Sistem otomatis menandai <strong>Hadir</strong> saat wajah cocok.
              </div>
            )}

            {/* Log Terakhir */}
            {recentScanLog.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "0.64rem", fontWeight: 800, color: "#475569" }}>
                  Riwayat Scan Sesi Ini:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", maxHeight: "80px", overflowY: "auto" }}>
                  {recentScanLog.map((log, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "4px 8px",
                        background: "#f8fafc",
                        borderRadius: "6px",
                        fontSize: "0.62rem",
                        color: "#334155",
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>✓ {log.nama}</span>
                      <span style={{ color: "#64748b" }}>{log.waktu}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setShowFaceModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0d766e",
                  color: "#ffffff",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Selesai Scan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DAFTAR SANTRI DENGAN TOGGLE STATUS CEPAT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", padding: "30px", color: "#64748b" }}
          >
            <RotateCw
              size={22}
              className="animate-spin"
              color="#0d766e"
              style={{ margin: "0 auto 8px" }}
            />
            <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              Memuat daftar santri...
            </div>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              fontSize: "0.78rem",
            }}
          >
            Tidak ada santri yang cocok dengan pencarian.
          </div>
        ) : (
          filteredSantri.map((s, idx) => (
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
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {idx + 1}. {s.nama_santri}
                </div>
                <div style={{ fontSize: "0.62rem", color: "#64748b" }}>
                  NIS: {s.nis || "-"} • {s.nama_kelas || "Binaan"}
                </div>
              </div>

              {/* Quick Status Toggle */}
              <div style={{ display: "flex", gap: "4px" }}>
                {["Hadir", "Sakit", "Izin", "Alfa"].map((st) => {
                  const isActive = s.status === st;
                  const getColors = () => {
                    if (st === "Hadir")
                      return {
                        bg: "#dcfce7",
                        text: "#15803d",
                        border: "#86efac",
                      };
                    if (st === "Sakit")
                      return {
                        bg: "#fee2e2",
                        text: "#b91c1c",
                        border: "#fca5a5",
                      };
                    if (st === "Izin")
                      return {
                        bg: "#fef3c7",
                        text: "#b45309",
                        border: "#fcd34d",
                      };
                    return {
                      bg: "#ccfbf1",
                      text: "#0f766e",
                      border: "#5eead4",
                    };
                  };
                  const colors = getColors();

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(s.santri_id, st)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.65rem",
                        fontWeight: isActive ? 800 : 600,
                        cursor: "pointer",
                        border: isActive
                          ? `1.5px solid ${colors.text}`
                          : "1px solid #e2e8f0",
                        background: isActive ? colors.bg : "#ffffff",
                        color: isActive ? colors.text : "#64748b",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
