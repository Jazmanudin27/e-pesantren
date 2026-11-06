import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  Search,
  RefreshCw,
  RotateCw,
  UserCheck,
  Building,
  Calendar,
  Award,
  Plus,
  Edit3,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Settings,
  FileText,
  User,
} from "lucide-react";
import {
  showConfirm,
  toastSuccess,
  showError,
  showSuccess,
} from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady,
} from "../../utils/faceApi.util";

export default function MobilePengembangan() {
  // Gender Tab: 'L' (Ikhwan) | 'P' (Akhwat)
  const [activeGender, setActiveGender] = useState("L");
  const [activeSubTab, setActiveSubTab] = useState("rekap"); // 'rekap' | 'master'

  // Master Kategori (beserta permasalahan, penyebab, tindakan)
  const [masterKategoriAll, setMasterKategoriAll] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedEvalKelas, setSelectedEvalKelas] = useState("");
  const [rekapList, setRekapList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Rekap
  const [search, setSearch] = useState("");
  const [filterKategoriId, setFilterKategoriId] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");

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

  // Modal Evaluasi (setelah Scan Wajah / Pilih Santri)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evalForm, setEvalForm] = useState({
    santri_id: "",
    santriObj: null,
    gender: "L",
    kategori_id: "",
    tanggal: new Date().toISOString().slice(0, 10),
    status_kelulusan: "Lulus", // 'Lulus' | 'Tidak Lulus'
    permasalahan: [],
    penyebab: [],
    tindakan: [],
    catatan_tambahan: "",
  });

  // Modal Master Kustomisasi (Tambah Kategori / Butir P-F-T)
  const [selectedMasterKatId, setSelectedMasterKatId] = useState("");
  const [isModalKatOpen, setIsModalKatOpen] = useState(false);
  const [katForm, setKatForm] = useState({
    id: null,
    nama_kategori: "",
    deskripsi: "",
    gender: "L",
  });
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null,
    tipe: "permasalahan",
    teks: "",
    kode: "",
  });

  // Face Scanner State & Refs
  const [isFaceScanOpen, setIsFaceScanOpen] = useState(false);
  const [scannerTab, setScannerTab] = useState("face"); // 'face' | 'manual'
  const [manualSearchQuery, setManualSearchQuery] = useState("");
  const [manualGenderFilter, setManualGenderFilter] = useState("Semua");
  const [faceFacingMode, setFaceFacingMode] = useState("environment");
  const [faceStatusText, setFaceStatusText] = useState(
    "Menghubungkan kamera...",
  );
  const [faceCameraError, setFaceCameraError] = useState("");
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [matchedSantriPreview, setMatchedSantriPreview] = useState(null);
  const [manualSantriIdInScanner, setManualSantriIdInScanner] = useState("");

  const faceVideoRef = useRef(null);
  const faceCanvasRef = useRef(null);
  const faceStreamRef = useRef(null);
  const faceLoopIntervalRef = useRef(null);
  const isDetectingRef = useRef(false);
  const santriListRef = useRef(santriList);
  const masterKategoriRef = useRef(masterKategoriAll);
  const isMatchedCooldownRef = useRef(false);
  const matchedStreakRef = useRef({ id: null, count: 0 });
  const [faceApiModelReady, setFaceApiModelReady] = useState(false);

  useEffect(() => {
    santriListRef.current = santriList;
  }, [santriList]);

  useEffect(() => {
    masterKategoriRef.current = masterKategoriAll;
  }, [masterKategoriAll]);

  useEffect(() => {
    let isMounted = true;
    initFaceApiModels()
      .then(() => {
        if (isMounted) setFaceApiModelReady(true);
      })
      .catch(() => {});
    fetchInitialData();
    return () => {
      isMounted = false;
      stopFaceCamera();
    };
  }, []);

  // Auto-sync & heal 128-D descriptor wajah santri dari database
  useEffect(() => {
    if (!santriList || santriList.length === 0) return;
    let isCancelled = false;

    const syncAndHealDescriptors = async () => {
      try {
        let currentProfiles = {};
        try {
          currentProfiles = JSON.parse(
            localStorage.getItem("epesantren_face_profiles") || "{}",
          );
        } catch (e) {}

        const validIds = new Set(santriList.map((s) => String(s.id)));
        let changed = false;

        Object.keys(currentProfiles).forEach((idKey) => {
          const prof = currentProfiles[idKey];
          const pId = String(prof?.santri_id || idKey);
          if (!validIds.has(pId)) {
            delete currentProfiles[idKey];
            changed = true;
          }
        });

        for (const s of santriList) {
          if (isCancelled) return;
          const photoUrl = s.foto || s.foto_santri;
          if (
            photoUrl &&
            (!currentProfiles[s.id] || !currentProfiles[s.id].foto)
          ) {
            currentProfiles[s.id] = {
              santri_id: s.id,
              nama: s.nama_santri,
              nis: s.nis,
              asrama: s.nama_asrama || "",
              kamar: s.nama_kamar || "",
              foto: photoUrl,
              descriptor: currentProfiles[s.id]?.descriptor || null,
              registered_at: new Date().toISOString(),
            };
            changed = true;
          }

          if (
            isFaceModelReady() &&
            currentProfiles[s.id] &&
            !currentProfiles[s.id].descriptor &&
            currentProfiles[s.id].foto
          ) {
            try {
              const desc = await extractDescriptorFromDataUrl(
                currentProfiles[s.id].foto,
              );
              if (desc && !isCancelled) {
                currentProfiles[s.id] = {
                  ...currentProfiles[s.id],
                  descriptor: desc,
                };
                changed = true;
              }
            } catch (e) {}
          }
        }

        if (changed && !isCancelled) {
          localStorage.setItem(
            "epesantren_face_profiles",
            JSON.stringify(currentProfiles),
          );
        }
      } catch (e) {}
    };

    syncAndHealDescriptors();
    return () => {
      isCancelled = true;
    };
  }, [santriList, faceApiModelReady]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resMaster, resSantri, resRekap, resKelas] = await Promise.all([
        axios
          .get("/api/perkembangan-ikhwan/master?gender=Semua")
          .catch(() => ({ data: { data: [] } })),
        axios.get("/api/santri?all=true").catch(() => ({ data: { data: [] } })),
        axios
          .get("/api/perkembangan-ikhwan/rekap?limit=200")
          .catch(() => ({ data: { data: [] } })),
        axios.get("/api/kelas").catch(() => ({ data: { data: [] } })),
      ]);

      const katData = resMaster.data?.data || resMaster.data?.kategori || [];
      setMasterKategoriAll(Array.isArray(katData) ? katData : []);

      const sData = resSantri.data?.data || [];
      setSantriList(Array.isArray(sData) ? sData : []);

      const kData = resKelas.data?.data || [];
      setKelasList(Array.isArray(kData) ? kData : []);

      const rData = resRekap.data?.data || resRekap.data?.rekap || [];
      setRekapList(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error("Gagal memuat data pengembangan mobile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRekapOnly = async () => {
    try {
      const res = await axios.get("/api/perkembangan-ikhwan/rekap?limit=200");
      const rData = res.data?.data || res.data?.rekap || [];
      setRekapList(Array.isArray(rData) ? rData : []);
    } catch (e) {}
  };

  // Filter kategori sesuai gender aktif
  const kategoriByActiveGender = masterKategoriAll.filter(
    (k) => !k.gender || k.gender === activeGender || k.gender === "Semua",
  );

  // Filter kategori sesuai gender santri pada modal evaluasi
  const kategoriForEvalModal = masterKategoriAll.filter(
    (k) => !k.gender || k.gender === evalForm.gender || k.gender === "Semua",
  );

  const activeEvalKategoriObj =
    kategoriForEvalModal.find(
      (k) => String(k.id) === String(evalForm.kategori_id),
    ) ||
    kategoriForEvalModal[0] ||
    null;

  // Daftar Kelas gabungan (dari API /api/kelas + fallback data santri)
  const combinedKelasOptions = React.useMemo(() => {
    const list = [...kelasList];
    (santriList || []).forEach((s) => {
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

  useEffect(() => {
    if (kategoriByActiveGender.length > 0 && !selectedMasterKatId) {
      setSelectedMasterKatId(String(kategoriByActiveGender[0].id));
    }
  }, [activeGender, masterKategoriAll]);

  const playSuccessSound = () => {
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
  // FACE SCANNER AI FUNCTIONS
  // =========================================================================
  const startFaceCamera = async (facing = faceFacingMode) => {
    setFaceCameraError("");
    setFaceStatusText("Menghubungkan ke kamera...");
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
      setFaceCameraError(
        "Kamera tidak dapat diakses atau izin ditolak. Anda dapat memilih santri secara manual di bawah.",
      );
      setFaceStatusText("Kamera gagal diakses");
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
    setIsFaceDetected(false);
  };

  const toggleFaceFacingMode = () => {
    const nextMode = faceFacingMode === "user" ? "environment" : "user";
    setFaceFacingMode(nextMode);
    stopFaceCamera();
    setTimeout(() => startFaceCamera(nextMode), 200);
  };

  const handleSwitchScannerTab = (tab) => {
    setScannerTab(tab);
    if (tab === "manual") {
      stopFaceCamera();
    } else {
      setTimeout(() => {
        startFaceCamera(faceFacingMode);
      }, 150);
    }
  };

  const openFaceScanner = () => {
    setScannerTab("face");
    setManualSearchQuery("");
    setManualGenderFilter("Semua");
    setManualSantriIdInScanner("");
    setIsFaceScanOpen(true);
    setTimeout(() => {
      startFaceCamera(faceFacingMode);
    }, 250);
  };

  const closeFaceScanner = () => {
    stopFaceCamera();
    setIsFaceScanOpen(false);
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
        const registeredList = Object.values(registeredMap);

        if (isFaceModelReady()) {
          const faceRes = await detectFaceDescriptor(video);
          if (!faceRes) {
            matchedStreakRef.current = { id: null, count: 0 };
            setIsFaceDetected(false);
            setFaceStatusText("Arahkan wajah santri ke kamera...");
            return;
          }

          setIsFaceDetected(true);
          // Ambang batas ketat 0.40
          const matched = matchFaceDescriptor(
            faceRes.descriptor,
            registeredList,
            0.4,
          );

          if (matched) {
            const fullSantri = (santriListRef.current || []).find(
              (s) => String(s.id) === String(matched.santri_id),
            );
            if (!fullSantri) {
              matchedStreakRef.current = { id: null, count: 0 };
              setFaceStatusText("⛔ Wajah Belum Terdaftar di Sistem");
              return;
            }
            const displayName = fullSantri.nama_santri;

            if (matchedStreakRef.current.id === fullSantri.id) {
              matchedStreakRef.current.count += 1;
            } else {
              matchedStreakRef.current = { id: fullSantri.id, count: 1 };
            }

            if (matchedStreakRef.current.count >= 2) {
              handleFaceRecognized(fullSantri, displayName);
            } else {
              setFaceStatusText(`Memverifikasi: ${displayName}...`);
            }
          } else {
            matchedStreakRef.current = { id: null, count: 0 };
            setFaceStatusText("⛔ Wajah Belum Terdaftar di Sistem");
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

  const openEvaluationForSantri = (santriObj) => {
    const rawJk = String(
      santriObj.jk || santriObj.jenis_kelamin || activeGender,
    ).toUpperCase();
    const detectedGender = rawJk.startsWith("P") ? "P" : "L";
    setActiveGender(detectedGender);

    const sKelas = santriObj.kelas_id
      ? String(santriObj.kelas_id)
      : santriObj.nama_kelas || "";
    setSelectedEvalKelas(sKelas);

    const availableKats = (masterKategoriRef.current || []).filter(
      (k) => !k.gender || k.gender === detectedGender || k.gender === "Semua",
    );
    const defaultKatId =
      filterKategoriId !== "Semua" &&
      availableKats.some((k) => String(k.id) === String(filterKategoriId))
        ? String(filterKategoriId)
        : availableKats[0]
          ? String(availableKats[0].id)
          : "";

    setEvalForm({
      santri_id: santriObj.id || santriObj.santri_id,
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

  const handleFaceRecognized = (matchedSantri, displayName) => {
    isMatchedCooldownRef.current = true;
    setMatchedSantriPreview(matchedSantri);
    setFaceStatusText(`✅ Santri Dikenali: ${displayName}`);
    playSuccessSound();

    setTimeout(() => {
      stopFaceCamera();
      setIsFaceScanOpen(false);
      openEvaluationForSantri(matchedSantri);
      toastSuccess(`Santri Dikenali: ${displayName}`);
    }, 650);
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
      showError(
        "Validasi Gagal",
        "Silakan scan wajah atau pilih santri terlebih dahulu.",
      );
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
          evalForm.santriObj?.nama_asrama ||
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
        toastSuccess(
          "Evaluasi pengembangan santri berhasil disimpan ke database",
        );
        setIsEvalModalOpen(false);
        fetchRekapOnly();
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
    const sKelas = sObj.kelas_id
      ? String(sObj.kelas_id)
      : sObj.nama_kelas || row.nama_kelas || "";
    setSelectedEvalKelas(sKelas);
    const g = String(row.jk || activeGender)
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

  // Master Kategori & Item CRUD
  const handleSaveKategori = async (e) => {
    e.preventDefault();
    if (!katForm.nama_kategori.trim()) return;
    try {
      const payload = { ...katForm, gender: activeGender };
      if (katForm.id) {
        await axios.put(
          `/api/perkembangan-ikhwan/kategori/${katForm.id}`,
          payload,
        );
      } else {
        await axios.post("/api/perkembangan-ikhwan/kategori", payload);
      }
      toastSuccess("Bidang pengembangan berhasil disimpan");
      setIsModalKatOpen(false);
      fetchInitialData();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  const handleSaveMasterItem = async (e) => {
    e.preventDefault();
    if (!itemForm.teks.trim() || !selectedMasterKatId) return;
    try {
      if (itemForm.id) {
        await axios.put(`/api/perkembangan-ikhwan/item/${itemForm.id}`, {
          teks: itemForm.teks,
          kode: itemForm.kode,
        });
      } else {
        await axios.post("/api/perkembangan-ikhwan/item", {
          kategori_id: parseInt(selectedMasterKatId),
          tipe: itemForm.tipe,
          teks: itemForm.teks,
          kode: itemForm.kode,
        });
      }
      toastSuccess("Butir diagnostik berhasil disimpan");
      setIsModalItemOpen(false);
      fetchInitialData();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteMasterItem = async (id) => {
    const ok = await showConfirm(
      "Hapus Butir?",
      "Hapus butir diagnostik ini dari database?",
      "Ya, Hapus",
      "Batal",
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/perkembangan-ikhwan/item/${id}`);
      toastSuccess("Butir dihapus");
      fetchInitialData();
    } catch (err) {
      showError("Gagal", err.message);
    }
  };

  // Filtered Rekap
  const filteredRekap = rekapList.filter((r) => {
    const rGender = String(r.jk || "L")
      .toUpperCase()
      .startsWith("P")
      ? "P"
      : "L";
    if (rGender !== activeGender) return false;
    if (
      filterKategoriId !== "Semua" &&
      String(r.kategori_id) !== String(filterKategoriId)
    )
      return false;
    if (filterStatus !== "Semua" && r.status_kelulusan !== filterStatus)
      return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNama = (r.nama_santri || "").toLowerCase().includes(q);
      const matchNis = (r.nis || "").toLowerCase().includes(q);
      const matchKat = (r.nama_kategori || "").toLowerCase().includes(q);
      if (!matchNama && !matchNis && !matchKat) return false;
    }
    return true;
  });

  const totalGenderRekap = rekapList.filter((r) => {
    const rGender = String(r.jk || "L")
      .toUpperCase()
      .startsWith("P")
      ? "P"
      : "L";
    return rGender === activeGender;
  });
  const countLulus = totalGenderRekap.filter(
    (r) => r.status_kelulusan === "Lulus",
  ).length;
  const countTidakLulus = totalGenderRekap.filter(
    (r) => r.status_kelulusan === "Tidak Lulus",
  ).length;

  const selectedMasterKatObj =
    kategoriByActiveGender.find(
      (k) => String(k.id) === String(selectedMasterKatId),
    ) ||
    kategoriByActiveGender[0] ||
    null;

  return (
    <div style={{ padding: "14px", paddingBottom: "95px" }}>
      {/* =========================================================================
          1. PILIH GENDER: IKHWAN (PUTRA) vs AKHWAT (PUTRI)
      ========================================================================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          background: "#e2e8f0",
          padding: "5px",
          borderRadius: "14px",
          marginBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveGender("L");
            setFilterKategoriId("Semua");
          }}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background: activeGender === "L" ? "#0284c7" : "transparent",
            color: activeGender === "L" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow:
              activeGender === "L" ? "0 4px 12px rgba(2,132,199,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          👦 Pengembangan Ikhwan
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveGender("P");
            setFilterKategoriId("Semua");
          }}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background: activeGender === "P" ? "#db2777" : "transparent",
            color: activeGender === "P" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow:
              activeGender === "P" ? "0 4px 12px rgba(219,39,119,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          🧕 Pengembangan Akhwat
        </button>
      </div>

      {/* =========================================================================
          2. HEADER BANNER & TOMBOL SCAN WAJAH UTAMA
      ========================================================================= */}
      <div
        style={{
          background:
            activeGender === "L"
              ? "linear-gradient(135deg, #0369a1 0%, #0284c7 60%, #0ea5e9 100%)"
              : "linear-gradient(135deg, #9d174d 0%, #db2777 60%, #ec4899 100%)",
          borderRadius: "20px",
          padding: "18px",
          color: "#ffffff",
          marginBottom: "14px",
          boxShadow:
            activeGender === "L"
              ? "0 10px 24px -6px rgba(2, 132, 199, 0.4)"
              : "0 10px 24px -6px rgba(219, 39, 119, 0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.72rem",
                opacity: 0.9,
                fontWeight: 700,
              }}
            >
              <Sparkles size={14} /> EVALUASI PENGEMBANGAN SANTRI
            </div>
            <h2
              style={{
                margin: "4px 0 2px",
                fontSize: "1.15rem",
                fontWeight: 800,
              }}
            >
              {activeGender === "L"
                ? "Bidang Pengembangan Ikhwan"
                : "Bidang Pengembangan Akhwat"}
            </h2>
            <p style={{ margin: 0, fontSize: "0.73rem", opacity: 0.9 }}>
              Alur: Scan Wajah ➔ Pilih Bidang ➔ Lulus / Tidak Lulus (Diagnostik)
            </p>
          </div>
        </div>

        {/* Statistik Ringkas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.16)",
              padding: "8px 10px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {kategoriByActiveGender.length}
            </div>
            <div style={{ fontSize: "0.66rem", opacity: 0.9 }}>Bidang Uji</div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.16)",
              padding: "8px 10px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {countLulus}
            </div>
            <div style={{ fontSize: "0.66rem", opacity: 0.9 }}>
              Santri Lulus
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.16)",
              padding: "8px 10px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
              {countTidakLulus}
            </div>
            <div style={{ fontSize: "0.66rem", opacity: 0.9 }}>Pembinaan</div>
          </div>
        </div>

        {/* Tombol Utama Scan Wajah + Input Manual */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={openFaceScanner}
            style={{
              background: "#ffffff",
              color: activeGender === "L" ? "#0369a1" : "#9d174d",
              border: "none",
              padding: "11px 14px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <Camera size={17} /> Mulai Scan Wajah
          </button>

          <button
            type="button"
            onClick={() => {
              const firstKat = kategoriByActiveGender[0]
                ? String(kategoriByActiveGender[0].id)
                : "";
              setSelectedEvalKelas("");
              setEvalForm({
                santri_id: "",
                santriObj: null,
                gender: activeGender,
                kategori_id: firstKat,
                tanggal: new Date().toISOString().slice(0, 10),
                status_kelulusan: "Lulus",
                permasalahan: [],
                penyebab: [],
                tindakan: [],
                catatan_tambahan: "",
              });
              setIsEvalModalOpen(true);
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.35)",
              padding: "11px 10px",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "0.76rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> Pilih Manual
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. SUB-TAB: RIWAYAT EVALUASI vs MASTER KUSTOMISASI BIDANG
      ========================================================================= */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("rekap")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "10px",
            border:
              activeSubTab === "rekap"
                ? "1.5px solid #0284c7"
                : "1px solid #cbd5e1",
            background: activeSubTab === "rekap" ? "#e0f2fe" : "#ffffff",
            color: activeSubTab === "rekap" ? "#0369a1" : "#64748b",
            fontWeight: 800,
            fontSize: "0.76rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <FileText size={14} /> Riwayat Evaluasi ({filteredRekap.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("master")}
          style={{
            flex: 1,
            padding: "9px",
            borderRadius: "10px",
            border:
              activeSubTab === "master"
                ? "1.5px solid #0284c7"
                : "1px solid #cbd5e1",
            background: activeSubTab === "master" ? "#e0f2fe" : "#ffffff",
            color: activeSubTab === "master" ? "#0369a1" : "#64748b",
            fontWeight: 800,
            fontSize: "0.76rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <Settings size={14} /> Master Bidang ({kategoriByActiveGender.length})
        </button>
      </div>

      {/* =========================================================================
          TAB A: RIWAYAT & REKAP EVALUASI PENGEMBANGAN
      ========================================================================= */}
      {activeSubTab === "rekap" && (
        <>
          {/* Filter Chips Bidang Pengembangan */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "8px",
              marginBottom: "8px",
            }}
          >
            <button
              type="button"
              onClick={() => setFilterKategoriId("Semua")}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border:
                  filterKategoriId === "Semua" ? "none" : "1px solid #cbd5e1",
                background:
                  filterKategoriId === "Semua" ? "#0f172a" : "#ffffff",
                color: filterKategoriId === "Semua" ? "#ffffff" : "#475569",
                fontSize: "0.72rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              Semua Bidang
            </button>
            {kategoriByActiveGender.map((kat) => (
              <button
                key={kat.id}
                type="button"
                onClick={() => setFilterKategoriId(String(kat.id))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border:
                    String(filterKategoriId) === String(kat.id)
                      ? "none"
                      : "1px solid #cbd5e1",
                  background:
                    String(filterKategoriId) === String(kat.id)
                      ? "#0284c7"
                      : "#ffffff",
                  color:
                    String(filterKategoriId) === String(kat.id)
                      ? "#ffffff"
                      : "#475569",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                {kat.nama_kategori}
              </button>
            ))}
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
                placeholder="Cari santri, NIS, bidang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              <option value="Semua">Semua</option>
              <option value="Lulus">Lulus</option>
              <option value="Tidak Lulus">Tidak Lulus</option>
            </select>
          </div>

          {/* Daftar Card Evaluasi */}
          {loading ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.82rem",
              }}
            >
              Memuat data pengembangan santri...
            </div>
          ) : filteredRekap.length === 0 ? (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "32px 20px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <Camera
                size={36}
                color="#0284c7"
                style={{ marginBottom: "8px", opacity: 0.8 }}
              />
              <div
                style={{
                  fontWeight: 800,
                  color: "#0f172a",
                  fontSize: "0.9rem",
                  marginBottom: "4px",
                }}
              >
                Belum Ada Data Evaluasi Pengembangan
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#64748b",
                  margin: "0 0 14px",
                }}
              >
                Klik tombol <strong>Mulai Scan Wajah</strong> di atas untuk
                memindai wajah santri dan menginput hasil Lulus / Tidak Lulus.
              </p>
              <button
                type="button"
                onClick={openFaceScanner}
                style={{
                  background: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Camera size={15} /> Scan Wajah Sekarang
              </button>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {filteredRekap.map((row) => {
                const isLulus = row.status_kelulusan === "Lulus";
                return (
                  <div
                    key={row.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "14px",
                      border: isLulus
                        ? "1px solid #e2e8f0"
                        : "1.5px solid #fecaca",
                      boxShadow: "0 2px 6px rgba(15,23,42,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "0.88rem",
                            color: "#0f172a",
                          }}
                        >
                          {row.nama_santri}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#64748b",
                            marginTop: "2px",
                          }}
                        >
                          NIS: <strong>{row.nis}</strong> •{" "}
                          {row.nama_asrama || "Asrama"}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          background: isLulus ? "#dcfce7" : "#fee2e2",
                          color: isLulus ? "#15803d" : "#b91c1c",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {isLulus ? (
                          <Check size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        {row.status_kelulusan}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f8fafc",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        marginBottom: !isLulus ? "10px" : "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "#0284c7",
                        }}
                      >
                        📘 {row.nama_kategori}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        {row.tanggal
                          ? new Date(row.tanggal).toLocaleDateString("id-ID")
                          : "-"}
                      </span>
                    </div>

                    {/* Rincian Diagnostik Jika Tidak Lulus */}
                    {!isLulus && (
                      <div
                        style={{
                          background: "#fff1f2",
                          border: "1px solid #fecdd3",
                          borderRadius: "10px",
                          padding: "10px",
                          marginBottom: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {row.permasalahan_list?.length > 0 && (
                          <div
                            style={{ fontSize: "0.72rem", color: "#991b1b" }}
                          >
                            <strong>Permasalahan:</strong>{" "}
                            {row.permasalahan_list.join(", ")}
                          </div>
                        )}
                        {row.penyebab_list?.length > 0 && (
                          <div
                            style={{ fontSize: "0.72rem", color: "#9a3412" }}
                          >
                            <strong>Penyebab:</strong>{" "}
                            {row.penyebab_list.join(", ")}
                          </div>
                        )}
                        {row.tindakan_list?.length > 0 && (
                          <div
                            style={{ fontSize: "0.72rem", color: "#065f46" }}
                          >
                            <strong>Tindakan:</strong>{" "}
                            {row.tindakan_list.join(", ")}
                          </div>
                        )}
                        {row.catatan_tambahan && (
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#334155",
                              fontStyle: "italic",
                            }}
                          >
                            "{row.catatan_tambahan}"
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "6px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                        Penguji:{" "}
                        <strong>
                          {row.asatidz_pencatat || currentPenguji}
                        </strong>
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => handleEditRekap(row)}
                          style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
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
                            borderRadius: "6px",
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
        </>
      )}

      {/* =========================================================================
          TAB B: MASTER KUSTOMISASI BIDANG & BUTIR DIAGNOSTIK (P / F / T)
      ========================================================================= */}
      {activeSubTab === "master" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a" }}
            >
              Pilih Bidang Pengembangan (
              {activeGender === "L" ? "Ikhwan" : "Akhwat"}):
            </span>
            <button
              type="button"
              onClick={() => {
                setKatForm({
                  id: null,
                  nama_kategori: "",
                  deskripsi: "",
                  gender: activeGender,
                });
                setIsModalKatOpen(true);
              }}
              style={{
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Plus size={13} /> Tambah Bidang
            </button>
          </div>

          <select
            value={selectedMasterKatId}
            onChange={(e) => setSelectedMasterKatId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1.5px solid #0284c7",
              fontWeight: 800,
              fontSize: "0.82rem",
              color: "#0369a1",
              background: "#ffffff",
            }}
          >
            {kategoriByActiveGender.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kategori}
              </option>
            ))}
          </select>

          {selectedMasterKatObj && (
            <>
              {[
                {
                  key: "permasalahan",
                  label: "(A.) Butir Permasalahan",
                  color: "#b91c1c",
                  bg: "#fef2f2",
                },
                {
                  key: "penyebab",
                  label: "(B.) Faktor Penyebab",
                  color: "#c2410c",
                  bg: "#fff7ed",
                },
                {
                  key: "tindakan",
                  label: "(C.) Tindakan / Solusi",
                  color: "#047857",
                  bg: "#ecfdf5",
                },
              ].map((sec) => (
                <div
                  key={sec.key}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: sec.color,
                      }}
                    >
                      {sec.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemForm({
                          id: null,
                          tipe: sec.key,
                          teks: "",
                          kode: "",
                        });
                        setIsModalItemOpen(true);
                      }}
                      style={{
                        background: sec.bg,
                        color: sec.color,
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      + Tambah
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {(selectedMasterKatObj[sec.key] || []).map((it, idx) => (
                      <div
                        key={it.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#f8fafc",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontSize: "0.74rem",
                          color: "#334155",
                        }}
                      >
                        <span>
                          <strong>
                            {it.kode || String.fromCharCode(97 + idx)}.
                          </strong>{" "}
                          {it.teks}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setItemForm({
                                id: it.id,
                                tipe: sec.key,
                                teks: it.teks,
                                kode: it.kode,
                              });
                              setIsModalItemOpen(true);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              padding: "2px",
                            }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(it.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                              padding: "2px",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          FLOATING CAMERA ACTION BUTTON (SCAN WAJAH CEPAT)
      ========================================================================= */}
      <button
        type="button"
        onClick={openFaceScanner}
        title="Scan Wajah Pengembangan"
        style={{
          position: "fixed",
          bottom: "84px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0284c7, #0369a1)",
          color: "#ffffff",
          border: "3px solid #ffffff",
          boxShadow: "0 8px 22px rgba(2, 132, 199, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 90,
        }}
      >
        <Camera size={24} />
      </button>

      {/* =========================================================================
          MODAL 1: SCAN WAJAH SANTRI (FULL SCREEN KAMERA AI)
      ========================================================================= */}
      {isFaceScanOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Top Bar Glass Translucent */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              background:
                "linear-gradient(to bottom, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0))",
              backdropFilter: "blur(8px)",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#ffffff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  background: "rgba(56, 189, 248, 0.2)",
                  border: "1.5px solid rgba(56, 189, 248, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                }}
              >
                <Camera size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.94rem",
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Scan Wajah Santri
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                  Arahkan kamera ke wajah santri diuji
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={toggleFaceFacingMode}
                title={
                  faceFacingMode === "user" ? "Kamera Belakang" : "Kamera Depan"
                }
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={17} />
              </button>

              <button
                type="button"
                onClick={closeFaceScanner}
                style={{
                  background: "rgba(239, 68, 68, 0.85)",
                  border: "none",
                  color: "#ffffff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                }}
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Viewport Kamera Imersif & Luas */}
          <div
            style={{
              position: "relative",
              flex: 1,
              width: "100%",
              minHeight: 0,
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <video
              ref={faceVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: faceFacingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            <canvas
              ref={faceCanvasRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />

            {/* Realtime Status Floating Pill */}
            <div
              style={{
                position: "absolute",
                bottom: "24px",
                left: "16px",
                right: "16px",
                zIndex: 10,
                background: matchedSantriPreview
                  ? "rgba(16, 185, 129, 0.95)"
                  : isFaceDetected
                    ? "rgba(2, 132, 199, 0.92)"
                    : "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "16px",
                fontSize: "0.84rem",
                fontWeight: 700,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                transition: "all 0.25s ease",
              }}
            >
              {faceCameraError || faceStatusText}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: FORM INPUT BIDANG PENGEMBANGAN -> LULUS / TIDAK LULUS (STEP 2 & 3)
      ========================================================================= */}
      {isEvalModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "430px",
              maxHeight: "92vh",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 -10px 35px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: "14px 18px",
                background: evalForm.gender === "P" ? "#9d174d" : "#0369a1",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                  Input Evaluasi Pengembangan (
                  {evalForm.gender === "P" ? "Akhwat" : "Ikhwan"})
                </h3>
                <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                  Pilih Bidang ➔ Lulus / Tidak Lulus ➔ Checklist Diagnostik
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Form */}
            <form
              onSubmit={handleSaveEvaluasi}
              style={{
                padding: "16px",
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Identitas Santri Terdeteksi / Pilih Santri Berdasarkan Kelas */}
              <div
                style={{
                  background: "#f0f9ff",
                  border: "1.5px solid #bae6fd",
                  borderRadius: "12px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#0369a1",
                    }}
                  >
                    1. DATA SANTRI YANG DIUJI
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEvalModalOpen(false);
                      openFaceScanner();
                    }}
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 9px",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <Camera size={12} /> Scan Wajah Ulang
                  </button>
                </div>

                {/* Pilih Kelas Terlebih Dahulu */}
                <div>
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#0369a1",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Pilih Kelas Santri *
                  </label>
                  <SearchableSelect
                    options={combinedKelasOptions.map((k) => ({
                      value: String(k.id || k.nama_kelas),
                      label: k.nama_kelas || `Kelas ${k.id}`,
                      sublabel: k.tingkat ? `Tingkat: ${k.tingkat}` : "",
                    }))}
                    value={selectedEvalKelas}
                    onChange={(val) => {
                      setSelectedEvalKelas(val);
                      // Jika kelas diganti, bersihkan santri jika santri lama bukan dari kelas ini
                      const currentSantri = santriList.find(
                        (s) => String(s.id) === String(evalForm.santri_id),
                      );
                      const matchCurrent =
                        currentSantri &&
                        (String(currentSantri.kelas_id) === String(val) ||
                          String(currentSantri.nama_kelas) === String(val));
                      if (!matchCurrent) {
                        setEvalForm((prev) => ({
                          ...prev,
                          santri_id: "",
                          santriObj: null,
                        }));
                      }
                    }}
                    placeholder="-- Pilih Kelas Terlebih Dahulu --"
                    searchPlaceholder="Cari kelas santri..."
                    triggerStyle={{
                      background: "#ffffff",
                      border: "1.5px solid #93c5fd",
                      borderRadius: "10px",
                      padding: "9px 12px",
                      fontSize: "0.82rem",
                    }}
                  />
                </div>

                {/* Pilih Santri (Hanya muncul / aktif setelah kelas dipilih) */}
                <div>
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "#0369a1",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    Pilih Santri di Kelas Terpilih *
                  </label>
                  {selectedEvalKelas ? (
                    <SearchableSelect
                      options={santriList
                        .filter((s) => {
                          const matchKelas =
                            String(s.kelas_id) === String(selectedEvalKelas) ||
                            String(s.nama_kelas) === String(selectedEvalKelas);
                          if (!matchKelas) return false;
                          if (evalForm.gender) {
                            const isP = String(s.jk || s.jenis_kelamin || "L")
                              .toUpperCase()
                              .startsWith("P");
                            if (evalForm.gender === "P" && !isP) return false;
                            if (evalForm.gender === "L" && isP) return false;
                          }
                          return true;
                        })
                        .map((s) => ({
                          value: s.id,
                          label: s.nama_santri,
                          sublabel: `NIS: ${s.nis || "-"} • ${
                            String(s.jk || "L")
                              .toUpperCase()
                              .startsWith("P")
                              ? "Akhwat"
                              : "Ikhwan"
                          } • ${s.nama_asrama || "Asrama"}`,
                        }))}
                      value={evalForm.santri_id}
                      onChange={(val) => {
                        const sObj = santriList.find(
                          (s) => String(s.id) === String(val),
                        );
                        if (sObj) {
                          const rawJk = String(sObj.jk || "L").toUpperCase();
                          const g = rawJk.startsWith("P") ? "P" : "L";
                          const avail = masterKategoriAll.filter(
                            (k) =>
                              !k.gender ||
                              k.gender === g ||
                              k.gender === "Semua",
                          );
                          setEvalForm((prev) => ({
                            ...prev,
                            santri_id: sObj.id,
                            santriObj: sObj,
                            gender: g,
                            kategori_id: avail[0]
                              ? String(avail[0].id)
                              : prev.kategori_id,
                          }));
                        }
                      }}
                      placeholder="Pilih santri yang diuji..."
                      searchPlaceholder="Ketik nama atau NIS santri..."
                      triggerStyle={{
                        background: "#ffffff",
                        border: "1.5px solid #0284c7",
                        borderRadius: "10px",
                        padding: "9px 12px",
                        fontSize: "0.82rem",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#ffffff",
                        borderRadius: "10px",
                        border: "1.5px dashed #93c5fd",
                        fontSize: "0.75rem",
                        color: "#0284c7",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      👆 Pilih kelas terlebih dahulu untuk memilih nama santri
                    </div>
                  )}
                </div>
              </div>

              {/* Pilih Bidang Pengembangan */}
              <div>
                <label
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  2. PILIH BIDANG PENGEMBANGAN *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "7px",
                  }}
                >
                  {kategoriForEvalModal.map((kat) => {
                    const isSelected =
                      String(evalForm.kategori_id) === String(kat.id);
                    return (
                      <button
                        key={kat.id}
                        type="button"
                        onClick={() =>
                          setEvalForm((prev) => ({
                            ...prev,
                            kategori_id: String(kat.id),
                            permasalahan: [],
                            penyebab: [],
                            tindakan: [],
                          }))
                        }
                        style={{
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: isSelected
                            ? "2px solid #0284c7"
                            : "1px solid #cbd5e1",
                          background: isSelected ? "#e0f2fe" : "#ffffff",
                          color: isSelected ? "#0369a1" : "#334155",
                          fontWeight: 800,
                          fontSize: "0.74rem",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{kat.nama_kategori}</span>
                        {isSelected && (
                          <CheckCircle2 size={14} color="#0284c7" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilih Status Kelulusan: LULUS vs TIDAK LULUS */}
              <div>
                <label
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  3. HASIL EVALUASI KELULUSAN *
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
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
                      padding: "12px",
                      borderRadius: "12px",
                      border:
                        evalForm.status_kelulusan === "Lulus"
                          ? "2px solid #059669"
                          : "1px solid #cbd5e1",
                      background:
                        evalForm.status_kelulusan === "Lulus"
                          ? "#10b981"
                          : "#ffffff",
                      color:
                        evalForm.status_kelulusan === "Lulus"
                          ? "#ffffff"
                          : "#475569",
                      fontWeight: 800,
                      fontSize: "0.84rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow:
                        evalForm.status_kelulusan === "Lulus"
                          ? "0 6px 14px rgba(16,185,129,0.35)"
                          : "none",
                    }}
                  >
                    <Check size={17} /> LULUS
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEvalForm((prev) => ({
                        ...prev,
                        status_kelulusan: "Tidak Lulus",
                      }))
                    }
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border:
                        evalForm.status_kelulusan === "Tidak Lulus"
                          ? "2px solid #dc2626"
                          : "1px solid #cbd5e1",
                      background:
                        evalForm.status_kelulusan === "Tidak Lulus"
                          ? "#ef4444"
                          : "#ffffff",
                      color:
                        evalForm.status_kelulusan === "Tidak Lulus"
                          ? "#ffffff"
                          : "#475569",
                      fontWeight: 800,
                      fontSize: "0.84rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow:
                        evalForm.status_kelulusan === "Tidak Lulus"
                          ? "0 6px 14px rgba(239,68,68,0.35)"
                          : "none",
                    }}
                  >
                    <X size={17} /> TIDAK LULUS
                  </button>
                </div>
              </div>

              {/* STEP 4: CHECKLIST DIAGNOSTIK OTOMATIS MUNCUL SAAT TIDAK LULUS */}
              {evalForm.status_kelulusan === "Tidak Lulus" &&
                activeEvalKategoriObj && (
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
                            const checked = evalForm.permasalahan.includes(
                              p.teks,
                            );
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
                                    handleToggleChecklist(
                                      "permasalahan",
                                      p.teks,
                                    )
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
                        {(activeEvalKategoriObj.penyebab || []).map(
                          (c, idx) => {
                            const checked = evalForm.penyebab.includes(c.teks);
                            return (
                              <label
                                key={c.id}
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
                                    handleToggleChecklist("penyebab", c.teks)
                                  }
                                  style={{
                                    accentColor: "#ea580c",
                                    marginTop: "2px",
                                  }}
                                />
                                <span>
                                  <strong>
                                    {c.kode || String.fromCharCode(97 + idx)}.
                                  </strong>{" "}
                                  {c.teks}
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </div>

                    {/* (C) Tindakan / Solusi */}
                    <div>
                      <div
                        style={{
                          fontSize: "0.73rem",
                          fontWeight: 800,
                          color: "#047857",
                          marginBottom: "5px",
                        }}
                      >
                        (C.) Tindakan / Solusi Pembinaan:
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        {(activeEvalKategoriObj.tindakan || []).map(
                          (t, idx) => {
                            const checked = evalForm.tindakan.includes(t.teks);
                            return (
                              <label
                                key={t.id}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  background: checked ? "#d1fae5" : "#ffffff",
                                  padding: "7px 9px",
                                  borderRadius: "8px",
                                  border: checked
                                    ? "1px solid #34d399"
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
                                    handleToggleChecklist("tindakan", t.teks)
                                  }
                                  style={{
                                    accentColor: "#059669",
                                    marginTop: "2px",
                                  }}
                                />
                                <span>
                                  <strong>
                                    {t.kode || String.fromCharCode(97 + idx)}.
                                  </strong>{" "}
                                  {t.teks}
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Catatan Tambahan */}
              <div>
                <label
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#334155",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Catatan Tambahan Asatidz (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tulis catatan perkembangan santri..."
                  value={evalForm.catatan_tambahan}
                  onChange={(e) =>
                    setEvalForm((prev) => ({
                      ...prev,
                      catatan_tambahan: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.76rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tombol Simpan */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
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
        </div>
      )}

      {/* MODAL TAMBAH BIDANG KATEGORI */}
      {isModalKatOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "380px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#0284c7",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>
                Tambah Bidang Pengembangan
              </span>
              <button
                onClick={() => setIsModalKatOpen(false)}
                style={{ background: "none", border: "none", color: "#fff" }}
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={handleSaveKategori}
              style={{
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <input
                type="text"
                required
                placeholder="Nama bidang (misal: Tahfidz / Muhadoroh)"
                value={katForm.nama_kategori}
                onChange={(e) =>
                  setKatForm({ ...katForm, nama_kategori: e.target.value })
                }
                style={{
                  padding: "9px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                }}
              />
              <textarea
                rows={2}
                placeholder="Deskripsi singkat..."
                value={katForm.deskripsi}
                onChange={(e) =>
                  setKatForm({ ...katForm, deskripsi: e.target.value })
                }
                style={{
                  padding: "9px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                }}
              >
                Simpan Bidang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BUTIR ITEM (P / F / T) */}
      {isModalItemOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "380px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "#0f172a",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>
                {itemForm.id
                  ? "Edit Butir Diagnostik"
                  : `Tambah ${itemForm.tipe.toUpperCase()}`}
              </span>
              <button
                onClick={() => setIsModalItemOpen(false)}
                style={{ background: "none", border: "none", color: "#fff" }}
              >
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={handleSaveMasterItem}
              style={{
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <textarea
                rows={3}
                required
                placeholder="Tulis teks butir..."
                value={itemForm.teks}
                onChange={(e) =>
                  setItemForm({ ...itemForm, teks: e.target.value })
                }
                style={{
                  padding: "9px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                }}
              >
                Simpan Butir
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
