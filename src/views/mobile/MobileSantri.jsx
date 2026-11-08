import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  BookOpen,
  User,
  Phone,
  MapPin,
  Key,
  Fingerprint,
  Award,
  Calendar,
  School,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import MobileLoadingState from "../../components/MobileLoadingState";

export default function MobileSantri() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJk, setFilterJk] = useState("Semua"); // 'Semua' | 'L' | 'P'
  const [filterStatus, setFilterStatus] = useState("Semua"); // 'Semua' | 'Aktif' | 'Alumni' | 'Boyong'
  
  // Master Data Dropdown
  const [asramaList, setAsramaList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [kelasList, setKelasList] = useState([]);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' | 'edit'
  const [formTab, setFormTab] = useState("identitas"); // 'identitas' | 'asrama_kelas' | 'wali' | 'akun_device'
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    // 1. Identitas Pokok
    nama_santri: "",
    nis: "",
    nisn: "",
    kode_santri: "",
    jk: "L",
    tempat_lahir: "",
    tgl_lahir: "2010-01-01",
    status_santri: "Mukim",
    status: "Aktif",
    tahun_masuk: "2026/2027",

    // 2. Asrama, Kamar & Kelas
    asrama_id: "",
    nama_asrama: "",
    kamar_id: "",
    nama_kamar: "",
    kelas_id: "",
    nama_kelas: "",
    tingkat_diniyah: "Wustho",
    capaian_hafalan_juz: 0,

    // 3. Sekolah Formal
    nama_sekolah: "SMP Nurul Wafa",
    tingkat_sekolah: "Kelas 7",

    // 4. Data Wali / Orang Tua
    nama_wali: "",
    hubungan_wali: "Orang Tua (Ayah)",
    no_wa_wali: "",
    alamat_asal: "",

    // 5. Mesin Fingerprint & Akun Portal Wali
    fingerprint_pin: "",
    rfid_card_uid: "",
    username: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem("mobile_session") || "{}");
    } catch (e) {
      return {};
    }
  })();
  const userAsramaId = session?.asrama_id;
  const isAsramaUser =
    session?.role === "asrama" || session?.userType === "Asrama";

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const url =
        isAsramaUser && userAsramaId
          ? `/api/santri?all=true&asrama_id=${userAsramaId}`
          : "/api/santri?all=true";
      const res = await axios.get(url);
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        let list = res.data.data;
        if (isAsramaUser && userAsramaId) {
          list = list.filter(
            (s) =>
              String(s.asrama_id) === String(userAsramaId) ||
              (s.nama_asrama &&
                session.nama_asrama &&
                s.nama_asrama
                  .toLowerCase()
                  .includes(session.nama_asrama.toLowerCase())),
          );
        }
        setSantriList(list);
      } else {
        setSantriList([]);
      }
    } catch (err) {
      console.error("Gagal mengambil data santri:", err);
      setSantriList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [resAsrama, resKelas] = await Promise.all([
        axios.get("/api/asrama").catch(() => ({ data: { success: false } })),
        axios.get("/api/kelas").catch(() => ({ data: { success: false } })),
      ]);
      if (resAsrama.data?.success) {
        setAsramaList(resAsrama.data.asrama || []);
        setKamarList(resAsrama.data.kamar || []);
      }
      if (resKelas.data?.success && Array.isArray(resKelas.data.data)) {
        setKelasList(resKelas.data.data);
      }
    } catch (e) {
      console.warn("Gagal memuat master data asrama/kelas:", e);
    }
  };

  useEffect(() => {
    fetchSantri();
    fetchMasterData();
  }, []);

  const handleOpenAdd = () => {
    setFormMode("add");
    setFormTab("identitas");

    const firstAsr = asramaList[0];
    const matchingKamars = kamarList.filter(
      (k) => String(k.asrama_id) === String(firstAsr?.id || 1),
    );
    const firstKmr = matchingKamars[0] || kamarList[0];
    const firstKls = kelasList[0];
    const nextNum = santriList.length + 1;

    setFormData({
      ...initialForm,
      nis: `260100${nextNum}`,
      kode_santri: `STR-26-00${nextNum}`,
      fingerprint_pin: `${1000 + nextNum}`,
      asrama_id: firstAsr?.id || "",
      nama_asrama: firstAsr?.nama_asrama || "",
      kamar_id: firstKmr?.id || "",
      nama_kamar: firstKmr?.nama_kamar || "",
      kelas_id: firstKls?.id || "",
      nama_kelas: firstKls?.nama_kelas || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (santri) => {
    setFormMode("edit");
    setFormTab("identitas");

    const tgl = santri.tgl_lahir
      ? typeof santri.tgl_lahir === "string"
        ? santri.tgl_lahir.split("T")[0]
        : santri.tgl_lahir
      : "2010-01-01";

    setFormData({
      id: santri.id,
      nama_santri: santri.nama_santri || santri.nama || "",
      nis: santri.nis || "",
      nisn: santri.nisn || "",
      kode_santri: santri.kode_santri || `STR-${santri.id || Date.now()}`,
      jk: santri.jk || "L",
      tempat_lahir: santri.tempat_lahir || "Tasikmalaya",
      tgl_lahir: tgl,
      status_santri: santri.status_santri || "Mukim",
      status: santri.status || "Aktif",
      tahun_masuk: santri.tahun_masuk || "2026/2027",

      asrama_id: santri.asrama_id || "",
      nama_asrama: santri.nama_asrama || "",
      kamar_id: santri.kamar_id || "",
      nama_kamar: santri.nama_kamar || "",
      kelas_id: santri.kelas_id || "",
      nama_kelas: santri.nama_kelas || "",
      tingkat_diniyah: santri.tingkat_diniyah || "Wustho",
      capaian_hafalan_juz: santri.capaian_hafalan_juz || santri.juz || 0,

      nama_sekolah: santri.nama_sekolah || "SMP Nurul Wafa",
      tingkat_sekolah: santri.tingkat_sekolah || "Kelas 7",

      nama_wali: santri.nama_wali || santri.wali || "",
      hubungan_wali: santri.hubungan_wali || "Orang Tua (Ayah)",
      no_wa_wali: santri.no_wa_wali || "",
      alamat_asal: santri.alamat_asal || "",

      fingerprint_pin: santri.fingerprint_pin || "",
      rfid_card_uid: santri.rfid_card_uid || "",
      username: santri.username || santri.nisn || santri.nis || "",
      password: santri.password || "",
    });
    setIsModalOpen(true);
  };

  const handleAsramaChange = (asrId) => {
    const selectedAsr = asramaList.find((a) => String(a.id) === String(asrId));
    const matchingKamars = kamarList.filter(
      (k) => String(k.asrama_id) === String(asrId),
    );
    const firstKmr = matchingKamars[0];
    setFormData((prev) => ({
      ...prev,
      asrama_id: asrId,
      nama_asrama: selectedAsr ? selectedAsr.nama_asrama : prev.nama_asrama,
      kamar_id: firstKmr ? firstKmr.id : "",
      nama_kamar: firstKmr ? firstKmr.nama_kamar : "",
    }));
  };

  const handleKamarChange = (kmrId) => {
    const selectedKmr = kamarList.find((k) => String(k.id) === String(kmrId));
    setFormData((prev) => ({
      ...prev,
      kamar_id: kmrId,
      nama_kamar: selectedKmr ? selectedKmr.nama_kamar : prev.nama_kamar,
    }));
  };

  const handleKelasChange = (klsVal) => {
    const selectedKls = kelasList.find(
      (k) => String(k.id) === String(klsVal) || k.nama_kelas === klsVal,
    );
    setFormData((prev) => ({
      ...prev,
      kelas_id: selectedKls ? selectedKls.id : null,
      nama_kelas: selectedKls ? selectedKls.nama_kelas : klsVal,
    }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.nama_santri.trim()) {
      showError("Validasi Gagal", "Nama lengkap santri wajib diisi.");
      setFormTab("identitas");
      return;
    }
    if (!formData.nis.trim()) {
      showError("Validasi Gagal", "NIS santri wajib diisi.");
      setFormTab("identitas");
      return;
    }

    setSubmitting(true);
    const payload = {
      ...formData,
      asrama_id: formData.asrama_id ? parseInt(formData.asrama_id, 10) : null,
      kamar_id: formData.kamar_id ? parseInt(formData.kamar_id, 10) : null,
      kelas_id: formData.kelas_id ? parseInt(formData.kelas_id, 10) : null,
      fingerprint_pin:
        formData.fingerprint_pin && String(formData.fingerprint_pin).trim() !== ""
          ? parseInt(formData.fingerprint_pin, 10)
          : null,
      rfid_card_uid:
        formData.rfid_card_uid && String(formData.rfid_card_uid).trim() !== ""
          ? String(formData.rfid_card_uid).trim()
          : null,
      capaian_hafalan_juz: parseInt(formData.capaian_hafalan_juz, 10) || 0,
      nisn:
        formData.nisn && String(formData.nisn).trim() !== ""
          ? String(formData.nisn).trim()
          : null,
      tempat_lahir:
        formData.tempat_lahir && String(formData.tempat_lahir).trim() !== ""
          ? String(formData.tempat_lahir).trim()
          : null,
      tgl_lahir: formData.tgl_lahir || null,
      alamat_asal:
        formData.alamat_asal && String(formData.alamat_asal).trim() !== ""
          ? String(formData.alamat_asal).trim()
          : null,
      username:
        formData.username && String(formData.username).trim() !== ""
          ? String(formData.username).trim()
          : null,
      password:
        formData.password && String(formData.password).trim() !== ""
          ? String(formData.password).trim()
          : null,
    };

    try {
      if (formMode === "add") {
        const res = await axios.post("/api/santri", payload);
        if (res.data?.success) {
          toastSuccess("Berhasil!", "Data santri baru berhasil ditambahkan.");
          fetchSantri();
          setIsModalOpen(false);
        } else {
          showError("Gagal", res.data?.message || "Gagal menambah data santri.");
        }
      } else {
        const res = await axios.put(`/api/santri/${formData.id}`, payload);
        if (res.data?.success) {
          toastSuccess("Berhasil!", "Data santri berhasil diperbarui.");
          fetchSantri();
          setIsModalOpen(false);
        } else {
          showError("Gagal", res.data?.message || "Gagal memperbarui data santri.");
        }
      }
    } catch (err) {
      showError("Gagal Menyimpan", err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus data santri "${nama}"? Semua riwayat hafalan dan presensi terkait akan ikut terhapus.`,
    );
    if (!confirmed) return;
    try {
      await axios.delete(`/api/santri/${id}`);
      fetchSantri();
      toastSuccess(`Data santri "${nama}" berhasil dihapus.`);
    } catch (err) {
      showError("Gagal Menghapus", err.response?.data?.message || err.message);
    }
  };

  // Filter List
  const filtered = santriList.filter((s) => {
    const q = search.toLowerCase();
    const nameStr = (s.nama_santri || s.nama || "").toLowerCase();
    const nisStr = (s.nis || "").toString();
    const asramaStr = (s.nama_asrama || s.asrama || "").toLowerCase();
    const kelasStr = (s.nama_kelas || "").toLowerCase();
    const matchSearch =
      nameStr.includes(q) ||
      nisStr.includes(q) ||
      asramaStr.includes(q) ||
      kelasStr.includes(q);

    const sJk = String(s.jk || "L").toUpperCase();
    const matchJk =
      filterJk === "Semua" ||
      (filterJk === "L" && sJk.startsWith("L")) ||
      (filterJk === "P" && sJk.startsWith("P"));

    const sStatus = String(s.status || "Aktif").toLowerCase();
    const matchStatus =
      filterStatus === "Semua" ||
      sStatus === filterStatus.toLowerCase();

    return matchSearch && matchJk && matchStatus;
  });

  // Kamar yang sesuai dengan asrama terpilih di form
  const availableKamars = kamarList.filter(
    (k) => String(k.asrama_id) === String(formData.asrama_id),
  );

  return (
    <div style={{ padding: "14px", paddingBottom: "100px", background: "#f8fafc", minHeight: "100%" }}>
      {/* Header Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          borderRadius: "18px",
          padding: "16px",
          color: "#ffffff",
          marginBottom: "14px",
          boxShadow: "0 6px 18px -4px rgba(13, 148, 136, 0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.72rem", opacity: 0.9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              DATABASE SANTRI PESANTREN
            </div>
            <h2 style={{ margin: "2px 0 0", fontSize: "1.15rem", fontWeight: 800 }}>
              Kelola Data Santri
            </h2>
          </div>
          <button
            onClick={handleOpenAdd}
            style={{
              background: "#ffffff",
              color: "#0f766e",
              border: "none",
              padding: "8px 12px",
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> Tambah
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>{santriList.length}</div>
            <div style={{ fontSize: "0.64rem", opacity: 0.85 }}>Total Santri</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              {santriList.filter((s) => String(s.jk || "L").toUpperCase().startsWith("L")).length}
            </div>
            <div style={{ fontSize: "0.64rem", opacity: 0.85 }}>Ikhwan (L)</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "6px 8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>
              {santriList.filter((s) => String(s.jk || "").toUpperCase().startsWith("P")).length}
            </div>
            <div style={{ fontSize: "0.64rem", opacity: 0.85 }}>Akhwat (P)</div>
          </div>
        </div>
      </div>

      {/* Input Search & Filter Chips */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Cari nama, NIS, kelas, asrama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            fontSize: "0.82rem",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <Search
          size={16}
          color="#94a3b8"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      </div>

      {/* Gender & Status Chips */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "6px" }}>
        {["Semua", "L", "P"].map((g) => (
          <button
            key={g}
            onClick={() => setFilterJk(g)}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              border: filterJk === g ? "none" : "1px solid #cbd5e1",
              background: filterJk === g ? "#0f766e" : "#ffffff",
              color: filterJk === g ? "#ffffff" : "#475569",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {g === "Semua" ? "Semua Gender" : g === "L" ? "👨 Ikhwan" : "🧕 Akhwat"}
          </button>
        ))}
        {["Semua", "Aktif", "Boyong", "Alumni"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              border: filterStatus === st ? "none" : "1px solid #cbd5e1",
              background: filterStatus === st ? "#0284c7" : "#ffffff",
              color: filterStatus === st ? "#ffffff" : "#475569",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {st === "Semua" ? "Semua Status" : st}
          </button>
        ))}
      </div>

      {/* List Card Santri */}
      {loading ? (
        <MobileLoadingState
          title="Memuat Data Santri..."
          subtitle="Mohon tunggu sebentar, sedang mengambil data santri..."
          iconColor="#0d9488"
          cardCount={4}
        />
      ) : filtered.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "32px 16px",
            textAlign: "center",
            border: "1px dashed #cbd5e1",
            color: "#64748b",
          }}
        >
          <Users size={36} color="#94a3b8" style={{ marginBottom: "8px" }} />
          <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1e293b" }}>
            Tidak Ada Data Santri
          </div>
          <div style={{ fontSize: "0.74rem", marginTop: "4px" }}>
            Tidak ditemukan santri yang cocok dengan pencarian / filter ini.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((s) => {
            const nama = s.nama_santri || s.nama || "Tanpa Nama";
            const statusSantri = s.status_santri || "Mukim";
            const statusAktif = s.status || "Aktif";
            const isL = String(s.jk || "L").toUpperCase().startsWith("L");
            const asrama = s.nama_asrama || "Asrama";
            const kamar = s.nama_kamar || "Kamar";
            const kelas = s.nama_kelas || "-";
            const juz = s.capaian_hafalan_juz || 0;
            const wali = s.nama_wali || "-";

            return (
              <div
                key={s.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
                }}
              >
                {/* Header Card: Nama & Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "0.94rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>{nama}</span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: isL ? "#e0f2fe" : "#fce7f3",
                          color: isL ? "#0369a1" : "#be185d",
                          fontWeight: 700,
                        }}
                      >
                        {isL ? "L" : "P"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                      NIS: <strong>{s.nis || "-"}</strong> {s.nisn && `• NISN: ${s.nisn}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                    <span
                      style={{
                        fontSize: "0.64rem",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontWeight: 800,
                        background: statusAktif === "Aktif" ? "#dcfce7" : "#fee2e2",
                        color: statusAktif === "Aktif" ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {statusAktif}
                    </span>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: "#f1f5f9",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      {statusSantri}
                    </span>
                  </div>
                </div>

                {/* Detail Penempatan: Asrama, Kelas & Tahfidz */}
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "#334155",
                    margin: "8px 0",
                    padding: "8px 0",
                    borderTop: "1px solid #f1f5f9",
                    borderBottom: "1px solid #f1f5f9",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>🏫 Kelas &amp; Diniyah:</div>
                    <div style={{ fontWeight: 700 }}>{kelas} • {s.tingkat_diniyah || "Wustho"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>🏢 Asrama / Kobong:</div>
                    <div style={{ fontWeight: 700 }}>{asrama} ({kamar})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>📖 Capaian Tahfidz:</div>
                    <div style={{ fontWeight: 700, color: "#059669" }}>{juz} Juz Al-Qur'an</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#64748b" }}>🎓 Sekolah Formal:</div>
                    <div style={{ fontWeight: 700 }}>{s.nama_sekolah || "SMP NW"} ({s.tingkat_sekolah || "Kls 7"})</div>
                  </div>
                </div>

                {/* Footer: Wali & Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem" }}>
                  <div style={{ color: "#475569" }}>
                    Wali: <strong>{wali}</strong>{" "}
                    {s.no_wa_wali && (
                      <a
                        href={`https://wa.me/${String(s.no_wa_wali).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#059669",
                          fontWeight: 700,
                          textDecoration: "none",
                          marginLeft: "4px",
                        }}
                      >
                        📱 WA
                      </a>
                    )}
                  </div>

                  {/* Actions CRUD */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      style={{
                        background: "#e0f2fe",
                        color: "#0284c7",
                        border: "1px solid #bae6fd",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, nama)}
                      style={{
                        background: "#ffe4e6",
                        color: "#be123c",
                        border: "1px solid #fecdd3",
                        padding: "5px 8px",
                        borderRadius: "8px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (+) Tambah */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Data Santri"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "84px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
          color: "#ffffff",
          border: "3px solid #ffffff",
          boxShadow: "0 8px 24px rgba(13, 148, 136, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 90,
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* =========================================================================
          MODAL FORM TAMBAH / EDIT LENGKAP (SEGMENTED TABS)
      ========================================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 -10px 35px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(135deg, #0d9488, #0f766e)",
                color: "#ffffff",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                  {formMode === "add" ? "➕ Tambah Data Santri Baru" : "✏️ Edit Lengkap Data Santri"}
                </div>
                <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                  Formulir identitas, asrama, kelas, wali &amp; biometrik
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  padding: "6px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#ffffff",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Form Tabs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                background: "#f8fafc",
                padding: "6px 12px",
                gap: "4px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {[
                { key: "identitas", label: "1. Identitas", icon: User },
                { key: "asrama_kelas", label: "2. Kobong/Kls", icon: Building },
                { key: "wali", label: "3. Wali & Alamat", icon: MapPin },
                { key: "akun_device", label: "4. Mesin/Akun", icon: Fingerprint },
              ].map((tab) => {
                const isActive = formTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFormTab(tab.key)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: "10px",
                      border: "none",
                      background: isActive ? "#0d9488" : "transparent",
                      color: isActive ? "#ffffff" : "#64748b",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "3px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Body Form (Scrollable) */}
            <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* =========================================================================
                    TAB 1: DATA POKOK & IDENTITAS
                ========================================================================= */}
                {formTab === "identitas" && (
                  <>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        NAMA LENGKAP SANTRI *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Ali Fikri"
                        value={formData.nama_santri}
                        onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          NIS SANTRI *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nomor Induk Santri"
                          value={formData.nis}
                          onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          NISN (NASIONAL)
                        </label>
                        <input
                          type="text"
                          placeholder="NISN Kemdikbud"
                          value={formData.nisn}
                          onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    {/* Jenis Kelamin (Gender Toggle) */}
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        JENIS KELAMIN *
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, jk: "L" })}
                          style={{
                            padding: "9px",
                            borderRadius: "10px",
                            border: formData.jk === "L" ? "2px solid #0284c7" : "1px solid #cbd5e1",
                            background: formData.jk === "L" ? "#e0f2fe" : "#ffffff",
                            color: formData.jk === "L" ? "#0369a1" : "#475569",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          👨 Laki-laki (Ikhwan)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, jk: "P" })}
                          style={{
                            padding: "9px",
                            borderRadius: "10px",
                            border: formData.jk === "P" ? "2px solid #db2777" : "1px solid #cbd5e1",
                            background: formData.jk === "P" ? "#fce7f3" : "#ffffff",
                            color: formData.jk === "P" ? "#be185d" : "#475569",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          🧕 Perempuan (Akhwat)
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          TEMPAT LAHIR
                        </label>
                        <input
                          type="text"
                          placeholder="Kota lahir"
                          value={formData.tempat_lahir}
                          onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          TANGGAL LAHIR
                        </label>
                        <input
                          type="date"
                          value={formData.tgl_lahir}
                          onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                          style={{ width: "100%", padding: "9px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          STATUS KEBERADAAN
                        </label>
                        <select
                          value={formData.status_santri}
                          onChange={(e) => setFormData({ ...formData, status_santri: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="Mukim">Mukim (Tinggal di Pondok)</option>
                          <option value="Kalong">Kalong (Pulang-Pergi)</option>
                          <option value="Non-Mukim">Non-Mukim</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          STATUS AKTIF PONDOK
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Alumni">Alumni / Lulus</option>
                          <option value="Boyong">Boyong / Berhenti</option>
                          <option value="Mutasi">Mutasi / Pindah</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        TAHUN MASUK / ANGKATAN
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 2026/2027"
                        value={formData.tahun_masuk}
                        onChange={(e) => setFormData({ ...formData, tahun_masuk: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </>
                )}

                {/* =========================================================================
                    TAB 2: PENEMPATAN ASRAMA, KAMAR KOBONG & KELAS DINIAYAH
                ========================================================================= */}
                {formTab === "asrama_kelas" && (
                  <>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        ASRAMA (GEDUNG PONDOK) *
                      </label>
                      <select
                        value={formData.asrama_id}
                        onChange={(e) => handleAsramaChange(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      >
                        <option value="">-- Pilih Gedung Asrama --</option>
                        {asramaList.map((a) => (
                          <option key={a.id} value={a.id}>
                            🏢 {a.nama_asrama} ({a.gender === "L" ? "Ikhwan" : "Akhwat"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        KAMAR KOBONG *
                      </label>
                      <select
                        value={formData.kamar_id}
                        onChange={(e) => handleKamarChange(e.target.value)}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      >
                        <option value="">-- Pilih Kamar Kobong --</option>
                        {availableKamars.map((k) => (
                          <option key={k.id} value={k.id}>
                            🚪 {k.nama_kamar} {k.kapasitas ? `(Kapasitas: ${k.kapasitas})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          KELAS PENGAJIAN / HALAQAH *
                        </label>
                        <select
                          value={formData.kelas_id || formData.nama_kelas}
                          onChange={(e) => handleKelasChange(e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="">-- Pilih Kelas Santri --</option>
                          {kelasList.map((kls) => (
                            <option key={kls.id} value={kls.id}>
                              🏫 Kelas: {kls.nama_kelas}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          TINGKAT DINIYAH
                        </label>
                        <select
                          value={formData.tingkat_diniyah}
                          onChange={(e) => setFormData({ ...formData, tingkat_diniyah: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="Ula">Ula (Dasar)</option>
                          <option value="Wustho">Wustho (Menengah)</option>
                          <option value="Ulya">Ulya (Tinggi)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        CAPAIAN HAFALAN TAHFIDZ (JUZ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="Contoh: 5"
                        value={formData.capaian_hafalan_juz}
                        onChange={(e) => setFormData({ ...formData, capaian_hafalan_juz: parseInt(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </>
                )}

                {/* =========================================================================
                    TAB 3: DATA WALI & ALAMAT ASAL
                ========================================================================= */}
                {formTab === "wali" && (
                  <>
                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        NAMA LENGKAP WALI / ORANG TUA *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Ayah / Ibu / Wali"
                        value={formData.nama_wali}
                        onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          HUBUNGAN KELUARGA
                        </label>
                        <select
                          value={formData.hubungan_wali}
                          onChange={(e) => setFormData({ ...formData, hubungan_wali: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="Orang Tua (Ayah)">Ayah Kandung</option>
                          <option value="Orang Tua (Ibu)">Ibu Kandung</option>
                          <option value="Kakek / Nenek">Kakek / Nenek</option>
                          <option value="Paman / Bibi">Paman / Bibi</option>
                          <option value="Wali Santri">Wali Santri</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          NO. WHATSAPP WALI *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="08123456789"
                          value={formData.no_wa_wali}
                          onChange={(e) => setFormData({ ...formData, no_wa_wali: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                        ALAMAT LENGKAP ASAL SANTRI
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Kampung/Jalan, RT/RW, Desa/Kelurahan, Kecamatan, Kota/Kabupaten..."
                        value={formData.alamat_asal}
                        onChange={(e) => setFormData({ ...formData, alamat_asal: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box", resize: "none" }}
                      />
                    </div>
                  </>
                )}

                {/* =========================================================================
                    TAB 4: SEKOLAH FORMAL, MESIN FINGERPRINT & AKUN PORTAL WALI
                ========================================================================= */}
                {formTab === "akun_device" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          SEKOLAH FORMAL (OPSIONAL)
                        </label>
                        <select
                          value={formData.nama_sekolah}
                          onChange={(e) => setFormData({ ...formData, nama_sekolah: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="SMP Nurul Wafa">SMP Nurul Wafa</option>
                          <option value="SMA Nurul Wafa">SMA Nurul Wafa</option>
                          <option value="SMK Nurul Wafa">SMK Nurul Wafa</option>
                          <option value="Salafiyah (Murni)">Salafiyah (Murni)</option>
                          <option value="Sekolah Luar">Sekolah Luar</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          TINGKAT KELAS
                        </label>
                        <select
                          value={formData.tingkat_sekolah}
                          onChange={(e) => setFormData({ ...formData, tingkat_sekolah: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        >
                          <option value="Kelas 7">Kelas 7</option>
                          <option value="Kelas 8">Kelas 8</option>
                          <option value="Kelas 9">Kelas 9</option>
                          <option value="Kelas 10">Kelas 10</option>
                          <option value="Kelas 11">Kelas 11</option>
                          <option value="Kelas 12">Kelas 12</option>
                          <option value="-">-</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          PIN MESIN FINGERPRINT
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 1001"
                          value={formData.fingerprint_pin}
                          onChange={(e) => setFormData({ ...formData, fingerprint_pin: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                          UID KARTU RFID TAP
                        </label>
                        <input
                          type="text"
                          placeholder="Nomor UID Kartu"
                          value={formData.rfid_card_uid}
                          onChange={(e) => setFormData({ ...formData, rfid_card_uid: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "0.82rem", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        marginTop: "4px",
                      }}
                    >
                      <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#166534", marginBottom: "6px" }}>
                        🔑 Akun Login Portal Wali Santri
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "2px" }}>
                            USERNAME WALI
                          </label>
                          <input
                            type="text"
                            placeholder="Default: NIS santri"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "0.68rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "2px" }}>
                            PASSWORD
                          </label>
                          <input
                            type="text"
                            placeholder="Password login"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.78rem", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Navigasi Antar Tab Form & Tombol Simpan */}
                <div style={{ display: "flex", gap: "8px", marginTop: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  {formTab !== "identitas" && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ["identitas", "asrama_kelas", "wali", "akun_device"];
                        const curIdx = tabs.indexOf(formTab);
                        if (curIdx > 0) setFormTab(tabs[curIdx - 1]);
                      }}
                      style={{
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#475569",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      Kembali
                    </button>
                  )}

                  {formTab !== "akun_device" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ["identitas", "asrama_kelas", "wali", "akun_device"];
                        const curIdx = tabs.indexOf(formTab);
                        if (curIdx < tabs.length - 1) setFormTab(tabs[curIdx + 1]);
                      }}
                      style={{
                        flex: 1,
                        padding: "11px 16px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#0284c7",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Lanjut <ChevronRight size={16} />
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: formTab === "akun_device" ? 1 : undefined,
                      padding: "11px 18px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Simpan Data Santri
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
