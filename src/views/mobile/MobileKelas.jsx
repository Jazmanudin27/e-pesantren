import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  GraduationCap,
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  BookOpen,
  UserCheck,
  RotateCw,
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import SearchableSelect from "../../components/SearchableSelect";

export default function MobileKelas() {
  const [kelasList, setKelasList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    nama_kelas: "",
    kode_kelas: "",
    mustahiq: "",
    munawwib: "",
    tingkat: "Wustho",
    gender: "L",
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchAsatidz = async () => {
    try {
      const res = await axios.get("/api/asatidz");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setAsatidzList(res.data.data);
      }
    } catch (e) {
      console.warn("Gagal memuat daftar asatidz:", e);
    }
  };

  const fetchKelas = async () => {
    try {
      setLoading(true);
      const resKelas = await axios.get("/api/kelas");
      if (resKelas?.data?.data && Array.isArray(resKelas.data.data)) {
        setKelasList(resKelas.data.data);
      } else {
        setKelasList([]);
      }
    } catch (err) {
      console.warn("Gagal memuat data kelas:", err);
      setKelasList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchAsatidz();
  }, []);

  const handleOpenAdd = () => {
    setFormMode("add");
    const suffix = Date.now().toString().slice(-4);
    setFormData({
      ...initialForm,
      kode_kelas: `KLS-${suffix}`,
      mustahiq: asatidzList[0]?.nama_asatidz || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (k) => {
    setFormMode("edit");
    setFormData({
      id: k.id,
      nama_kelas: k.nama_kelas || "",
      kode_kelas: k.kode_kelas || `KLS-${k.id}`,
      mustahiq: k.mustahiq || "",
      munawwib: k.munawwib || "",
      tingkat: k.tingkat || "Wustho",
      gender: k.gender || "L",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim()) return;
    setSubmitting(true);
    try {
      if (formMode === "add") {
        const res = await axios.post("/api/kelas", formData);
        if (res.data?.success) {
          toastSuccess(`Kelas "${formData.nama_kelas}" berhasil ditambahkan`);
          fetchKelas();
          setIsModalOpen(false);
        } else {
          showError("Gagal", res.data?.message || "Gagal menambah kelas");
        }
      } else {
        const res = await axios.put(`/api/kelas/${formData.id}`, formData);
        if (res.data?.success) {
          toastSuccess(`Kelas "${formData.nama_kelas}" berhasil diperbarui`);
          fetchKelas();
          setIsModalOpen(false);
        } else {
          showError("Gagal", res.data?.message || "Gagal memperbarui kelas");
        }
      }
    } catch (err) {
      console.error("Gagal simpan kelas:", err);
      showError("Gagal", err.response?.data?.message || "Terjadi kesalahan saat menyimpan kelas");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const confirmed = await showConfirm(
      "Konfirmasi Hapus",
      `Yakin ingin menghapus kelas "${nama}"?`,
      "Ya, Hapus",
      "Batal"
    );
    if (!confirmed) return;
    try {
      const res = await axios.delete(`/api/kelas/${id}`);
      if (res.data?.success) {
        toastSuccess(`Kelas "${nama}" berhasil dihapus`);
        fetchKelas();
      } else {
        showError("Gagal", res.data?.message || "Gagal menghapus kelas");
      }
    } catch (err) {
      showError("Gagal", err.response?.data?.message || "Gagal menghapus kelas");
    }
  };

  const asatidzOptions = asatidzList.map((a) => {
    const gelar = a.gelar ? `, ${a.gelar}` : "";
    const label = `${a.nama_asatidz}${gelar}`;
    return {
      value: a.nama_asatidz,
      label: label,
      sublabel: a.tugas_utama || a.kategori_asatidz || "Asatidz",
    };
  });

  return (
    <div style={{ padding: "16px", paddingBottom: "90px" }}>
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
            Data Master Kelas
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
            Total {kelasList.length} Kelas Terdaftar
          </div>
        </div>
        <button
          onClick={fetchKelas}
          style={{
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#475569",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <RotateCw size={12} /> Segarkan
        </button>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#64748b",
            fontSize: "0.84rem",
          }}
        >
          <Loader2
            size={24}
            className="animate-spin"
            style={{ margin: "0 auto 8px", color: "#0284c7" }}
          />
          Memuat data kelas...
        </div>
      ) : kelasList.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1.5px dashed #cbd5e1",
            color: "#64748b",
          }}
        >
          <GraduationCap size={36} color="#cbd5e1" style={{ margin: "0 auto 8px" }} />
          <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#1e293b" }}>
            Belum Ada Data Kelas
          </div>
          <div style={{ fontSize: "0.74rem", marginTop: "4px" }}>
            Klik tombol tambah (+) di bawah untuk membuat kelas baru.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {kelasList.map((k) => {
            const nama = k.nama_kelas;
            const mustahiq = k.mustahiq || "-";
            const munawwib = k.munawwib || "-";
            const tingkat = k.tingkat || "-";
            const gender =
              k.gender === "P" || k.gender === "Akhwat" ? "Akhwat" : "Ikhwan";
            const total = k.total_santri || 0;

            return (
              <div
                key={k.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
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
                      background: gender === "Ikhwan" ? "#e0f2fe" : "#fdf2f8",
                      color: gender === "Ikhwan" ? "#0284c7" : "#db2777",
                      border: `1px solid ${gender === "Ikhwan" ? "#bae6fd" : "#fbcfe8"}`,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                    }}
                  >
                    {gender}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleOpenEdit(k)}
                      style={{
                        background: "#cffaff",
                        color: "#0891b2",
                        border: "1px solid #a5f3fc",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(k.id, nama)}
                      style={{
                        background: "#ffe4e6",
                        color: "#be123c",
                        border: "1px solid #fecdd3",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "0.96rem",
                    color: "#0f172a",
                    marginBottom: "4px",
                  }}
                >
                  {nama}
                </div>

                {/* Mustahiq (Pengampu) */}
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#059669",
                    fontWeight: 700,
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <UserCheck size={14} color="#059669" />
                  <span>Mustahiq: <strong>{mustahiq}</strong></span>
                </div>

                {/* Rincian: Tingkat, Munawwib & Total Santri */}
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "#334155",
                    background: "#f8fafc",
                    padding: "10px",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    🎓 <strong>Tingkat:</strong> {tingkat}
                  </div>
                  <div>
                    🔄 <strong>Munawwib:</strong> {munawwib}
                  </div>
                  <div>
                    👥 <strong>Total Santri:</strong> {total} Santri
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT KELAS */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "420px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <div
                style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}
              >
                {formMode === "add" ? "➕ Tambah Kelas" : `✏️ Edit Kelas: ${formData.nama_kelas}`}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  padding: "6px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {/* Nama Kelas */}
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
                  NAMA KELAS *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelas 1 Ula, 1 Wustho, dll"
                  value={formData.nama_kelas}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_kelas: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tingkat & Gender */}
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
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: "#334155",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    TINGKAT *
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "Ula", label: "Ula" },
                      { value: "Wustho", label: "Wustho" },
                      { value: "Ulya", label: "Ulya" },
                      { value: "Kelas 1", label: "Kelas 1" },
                      { value: "Kelas 2", label: "Kelas 2" },
                      { value: "Kelas 3", label: "Kelas 3" },
                      { value: "Kelas 4", label: "Kelas 4" },
                      { value: "Reguler", label: "Reguler" },
                    ]}
                    value={formData.tingkat}
                    onChange={(val) => setFormData({ ...formData, tingkat: val })}
                    placeholder="-- Pilih Tingkat --"
                    searchPlaceholder="Cari tingkat..."
                  />
                </div>

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
                    GENDER SANTRI *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      boxSizing: "border-box",
                      background: "#ffffff",
                    }}
                  >
                    <option value="L">Ikhwan (Putra)</option>
                    <option value="P">Akhwat (Putri)</option>
                    <option value="Semua">Semua (Campur)</option>
                  </select>
                </div>
              </div>

              {/* Mustahiq (Ambil dari Asatidz) */}
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
                  MUSTAHIQ (DARI ASATIDZ) *
                </label>
                <SearchableSelect
                  options={asatidzOptions}
                  value={formData.mustahiq}
                  onChange={(val) => setFormData({ ...formData, mustahiq: val })}
                  placeholder="-- Pilih Asatidz Mustahiq --"
                  searchPlaceholder="Cari nama asatidz..."
                />
              </div>

              {/* Munawwib (Guru Badal / Pengganti dari Asatidz) */}
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
                  MUNAWWIB (BADAL / ASATIDZ PENGGANTI)
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "-- Tidak Ada / Kosong --" },
                    ...asatidzOptions,
                  ]}
                  value={formData.munawwib}
                  onChange={(val) => setFormData({ ...formData, munawwib: val })}
                  placeholder="-- Pilih Asatidz Munawwib (Opsional) --"
                  searchPlaceholder="Cari nama asatidz munawwib..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background:
                    "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Save size={16} />{" "}
                {submitting ? "Menyimpan..." : "Simpan Data Kelas"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (+) */}
      <button
        onClick={handleOpenAdd}
        title="Tambah Kelas Baru"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "80px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 8px 24px rgba(2, 132, 199, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 90,
        }}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
