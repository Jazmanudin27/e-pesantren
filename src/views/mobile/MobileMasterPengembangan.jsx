import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Award,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  RotateCw,
  Layers,
  Sparkles,
  AlertTriangle,
  Check,
  ChevronDown,
  ArrowLeft
} from "lucide-react";
import { showConfirm, toastSuccess, showError } from "../../utils/alert.util";
import MobileLoadingState from "../../components/MobileLoadingState";

export default function MobileMasterPengembangan({ onBack }) {
  // Gender: 'L' (Ikhwan Putra) | 'P' (Akhwat Putri)
  const [activeGender, setActiveGender] = useState("L");
  const [kategoriAll, setKategoriAll] = useState([]);
  const [selectedKatId, setSelectedKatId] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal Form Kategori
  const [isModalKatOpen, setIsModalKatOpen] = useState(false);
  const [katForm, setKatForm] = useState({
    id: null,
    nama_kategori: "",
    deskripsi: "",
    gender: "L"
  });

  // Modal Form Item (P-F-T)
  const [isModalItemOpen, setIsModalItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null,
    tipe: "permasalahan", // 'permasalahan' | 'penyebab' | 'tindakan'
    teks: "",
    kode: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/perkembangan-ikhwan/master?gender=Semua");
      if (res.data?.success && res.data.data) {
        const list = res.data.data.kategori || res.data.data || [];
        setKategoriAll(list);
      }
    } catch (err) {
      console.warn("Gagal memuat master perkembangan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter kategori berdasarkan gender yang aktif
  const kategoriByGender = kategoriAll.filter((k) => {
    const g = String(k.gender || "L").toUpperCase();
    return g === activeGender || g === "SEMUA";
  });

  // Auto-select kategori pertama saat switch gender
  useEffect(() => {
    if (kategoriByGender.length > 0) {
      const exists = kategoriByGender.some(
        (k) => String(k.id) === String(selectedKatId)
      );
      if (!exists) {
        setSelectedKatId(String(kategoriByGender[0].id));
      }
    } else {
      setSelectedKatId("");
    }
  }, [activeGender, kategoriAll]);

  const selectedKatObj =
    kategoriByGender.find((k) => String(k.id) === String(selectedKatId)) || null;

  // Handler Kategori
  const handleOpenAddKategori = () => {
    setKatForm({
      id: null,
      nama_kategori: "",
      deskripsi: "",
      gender: activeGender
    });
    setIsModalKatOpen(true);
  };

  const handleOpenEditKategori = (kat) => {
    setKatForm({
      id: kat.id,
      nama_kategori: kat.nama_kategori,
      deskripsi: kat.deskripsi || "",
      gender: kat.gender || activeGender
    });
    setIsModalKatOpen(true);
  };

  const handleSaveKategori = async (e) => {
    e.preventDefault();
    if (!katForm.nama_kategori.trim()) return;
    try {
      const payload = { ...katForm, gender: activeGender };
      if (katForm.id) {
        await axios.put(`/api/perkembangan-ikhwan/kategori/${katForm.id}`, payload);
        toastSuccess("Bidang berhasil diperbarui");
      } else {
        const res = await axios.post("/api/perkembangan-ikhwan/kategori", payload);
        toastSuccess("Bidang baru berhasil ditambahkan");
        if (res.data?.data?.id) {
          setSelectedKatId(String(res.data.data.id));
        }
      }
      setIsModalKatOpen(false);
      fetchData();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteKategori = async (id, nama) => {
    const ok = await showConfirm(
      "Hapus Bidang?",
      `Hapus bidang "${nama}" beserta seluruh butir diagnosanya?`,
      "Ya, Hapus",
      "Batal"
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/perkembangan-ikhwan/kategori/${id}`);
      toastSuccess("Bidang berhasil dihapus");
      fetchData();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  // Handler Item P-F-T
  const handleOpenAddItem = (tipe) => {
    if (!selectedKatId) return;
    setItemForm({
      id: null,
      tipe,
      teks: "",
      kode: ""
    });
    setIsModalItemOpen(true);
  };

  const handleOpenEditItem = (it, tipe) => {
    setItemForm({
      id: it.id,
      tipe,
      teks: it.teks,
      kode: it.kode || ""
    });
    setIsModalItemOpen(true);
  };

  const handleSaveMasterItem = async (e) => {
    e.preventDefault();
    if (!itemForm.teks.trim() || !selectedKatId) return;
    try {
      if (itemForm.id) {
        await axios.put(`/api/perkembangan-ikhwan/item/${itemForm.id}`, {
          teks: itemForm.teks,
          kode: itemForm.kode
        });
      } else {
        await axios.post("/api/perkembangan-ikhwan/item", {
          kategori_id: parseInt(selectedKatId),
          tipe: itemForm.tipe,
          teks: itemForm.teks,
          kode: itemForm.kode
        });
      }
      toastSuccess("Butir diagnostik berhasil disimpan");
      setIsModalItemOpen(false);
      fetchData();
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteMasterItem = async (id) => {
    const ok = await showConfirm(
      "Hapus Butir?",
      "Hapus butir diagnostik ini dari database?",
      "Ya, Hapus",
      "Batal"
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/perkembangan-ikhwan/item/${id}`);
      toastSuccess("Butir diagnostik dihapus");
      fetchData();
    } catch (err) {
      showError("Gagal", err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "14px", paddingBottom: "95px" }}>
        <MobileLoadingState
          title="Memuat Master Pengembangan..."
          subtitle="Sedang memuat bidang kategori & butir diagnostik..."
          iconColor="#0284c7"
          cardCount={3}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "14px", paddingBottom: "95px", display: "flex", flexDirection: "column", gap: "14px" }}>
      
      {/* 1. GENDER TOGGLE (IKHWAN PUTRA VS AKHWAT PUTRI) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          background: "#e2e8f0",
          padding: "5px",
          borderRadius: "14px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
        }}
      >
        <button
          type="button"
          onClick={() => setActiveGender("L")}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background:
              activeGender === "L"
                ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                : "transparent",
            color: activeGender === "L" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow:
              activeGender === "L"
                ? "0 4px 12px rgba(2, 132, 199, 0.35)"
                : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.15s ease"
          }}
        >
          <span>👦</span>
          <span>Ikhwan (Putra)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGender("P")}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background:
              activeGender === "P"
                ? "linear-gradient(135deg, #ec4899 0%, #be185d 100%)"
                : "transparent",
            color: activeGender === "P" ? "#ffffff" : "#475569",
            fontWeight: 800,
            fontSize: "0.8rem",
            cursor: "pointer",
            boxShadow:
              activeGender === "P"
                ? "0 4px 12px rgba(236, 72, 153, 0.35)"
                : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.15s ease"
          }}
        >
          <span>🧕</span>
          <span>Akhwat (Putri)</span>
        </button>
      </div>

      {/* 2. PILIH / KELOLA BIDANG KATEGORI */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "14px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>
              Bidang Pengembangan Santri
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              Pilih bidang untuk mengelola butir Permasalahan, Penyebab, dan Tindakan
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAddKategori}
            style={{
              background: activeGender === "L" ? "#0284c7" : "#db2777",
              color: "#ffffff",
              border: "none",
              padding: "7px 12px",
              borderRadius: "10px",
              fontSize: "0.72rem",
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
            }}
          >
            <Plus size={14} />
            <span>Tambah Bidang</span>
          </button>
        </div>

        {kategoriByGender.length === 0 ? (
          <div
            style={{
              padding: "24px 14px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1px dashed #cbd5e1"
            }}
          >
            <Layers size={32} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#475569" }}>
              Belum ada bidang untuk {activeGender === "L" ? "Ikhwan" : "Akhwat"}
            </div>
            <button
              type="button"
              onClick={handleOpenAddKategori}
              style={{
                marginTop: "10px",
                background: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              + Tambah Bidang Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <select
                value={selectedKatId}
                onChange={(e) => setSelectedKatId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1.5px solid ${activeGender === "L" ? "#0284c7" : "#db2777"}`,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "#0f172a",
                  background: "#ffffff",
                  outline: "none"
                }}
              >
                {kategoriByGender.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kategori}
                  </option>
                ))}
              </select>
            </div>

            {selectedKatObj && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => handleOpenEditKategori(selectedKatObj)}
                  title="Ubah Nama Bidang"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#2563eb",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    cursor: "pointer"
                  }}
                >
                  <Edit3 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteKategori(
                      selectedKatObj.id,
                      selectedKatObj.nama_kategori
                    )
                  }
                  title="Hapus Bidang"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    padding: "9px 10px",
                    borderRadius: "10px",
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. DAFTAR BUTIR DIAGNOSTIK P-F-T (PERMASALAHAN, PENYEBAB, TINDAKAN) */}
      {selectedKatObj && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              key: "permasalahan",
              title: "A. Butir Permasalahan",
              desc: "Kendala atau pelanggaran yang terjadi pada santri",
              color: "#b91c1c",
              bg: "#fef2f2",
              borderColor: "#fecaca",
              badgeBg: "#fee2e2"
            },
            {
              key: "penyebab",
              title: "B. Faktor Penyebab",
              desc: "Akar penyebab santri mengalami permasalahan ini",
              color: "#c2410c",
              bg: "#fff7ed",
              borderColor: "#fed7aa",
              badgeBg: "#ffedd5"
            },
            {
              key: "tindakan",
              title: "C. Tindakan / Solusi",
              desc: "Langkah bimbingan, hukuman pembinaan, atau solusinya",
              color: "#047857",
              bg: "#ecfdf5",
              borderColor: "#a7f3d0",
              badgeBg: "#dcfce7"
            }
          ].map((sec) => {
            const items = selectedKatObj[sec.key] || [];
            return (
              <div
                key={sec.key}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "14px",
                  border: `1px solid ${sec.borderColor}`,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 900,
                        color: sec.color,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <span>{sec.title}</span>
                      <span
                        style={{
                          fontSize: "0.62rem",
                          background: sec.badgeBg,
                          color: sec.color,
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontWeight: 800
                        }}
                      >
                        {items.length} Butir
                      </span>
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "#64748b", marginTop: "1px" }}>
                      {sec.desc}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddItem(sec.key)}
                    style={{
                      background: sec.bg,
                      color: sec.color,
                      border: `1px solid ${sec.borderColor}`,
                      padding: "6px 10px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Plus size={13} />
                    <span>Tambah</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div
                    style={{
                      padding: "14px",
                      textAlign: "center",
                      background: "#f8fafc",
                      borderRadius: "10px",
                      fontSize: "0.72rem",
                      color: "#94a3b8",
                      fontStyle: "italic"
                    }}
                  >
                    Belum ada butir {sec.title.toLowerCase()} untuk bidang ini.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {items.map((it, idx) => (
                      <div
                        key={it.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          background: "#f8fafc",
                          padding: "9px 11px",
                          borderRadius: "10px",
                          border: "1px solid #f1f5f9",
                          gap: "8px"
                        }}
                      >
                        <div style={{ flex: 1, fontSize: "0.75rem", color: "#1e293b", lineHeight: 1.35 }}>
                          <span
                            style={{
                              fontWeight: 900,
                              color: sec.color,
                              marginRight: "4px"
                            }}
                          >
                            {it.kode || String.fromCharCode(97 + idx)}.
                          </span>
                          <span>{it.teks}</span>
                        </div>

                        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(it, sec.key)}
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "#2563eb",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMasterItem(it.id)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              padding: "4px 6px",
                              borderRadius: "6px",
                              cursor: "pointer"
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: FORM TAMBAH / UBAH KATEGORI BIDANG
      ========================================================================= */}
      {isModalKatOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setIsModalKatOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "400px",
              padding: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px"
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>
                {katForm.id ? "Ubah Nama Bidang" : "Tambah Bidang Baru"}
              </div>
              <button
                type="button"
                onClick={() => setIsModalKatOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  padding: "4px",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveKategori} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Target Santri
                </label>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: activeGender === "L" ? "#0284c7" : "#db2777" }}>
                  {activeGender === "L" ? "👦 Ikhwan (Putra)" : "🧕 Akhwat (Putri)"}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Nama Bidang Pengembangan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Praktek Sholat Fardhu, Al-Qur'an, dll"
                  value={katForm.nama_kategori}
                  onChange={(e) => setKatForm({ ...katForm, nama_kategori: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat bidang pengembangan..."
                  value={katForm.deskripsi}
                  onChange={(e) => setKatForm({ ...katForm, deskripsi: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.75rem",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalKatOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "9px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: activeGender === "L" ? "#0284c7" : "#db2777",
                    color: "#ffffff",
                    border: "none",
                    padding: "9px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Simpan Bidang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: FORM TAMBAH / UBAH BUTIR DIAGNOSTIK (P / F / T)
      ========================================================================= */}
      {isModalItemOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setIsModalItemOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "420px",
              padding: "18px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px"
              }}
            >
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>
                {itemForm.id ? "Ubah Butir" : "Tambah Butir"}{" "}
                {itemForm.tipe === "permasalahan"
                  ? "Permasalahan (A)"
                  : itemForm.tipe === "penyebab"
                  ? "Faktor Penyebab (B)"
                  : "Tindakan / Solusi (C)"}
              </div>
              <button
                type="button"
                onClick={() => setIsModalItemOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  padding: "4px",
                  cursor: "pointer"
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveMasterItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ width: "90px" }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Kode Huruf
                  </label>
                  <input
                    type="text"
                    placeholder="a, b, c..."
                    value={itemForm.kode}
                    onChange={(e) => setItemForm({ ...itemForm, kode: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      textAlign: "center",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Tipe Butir
                  </label>
                  <select
                    value={itemForm.tipe}
                    onChange={(e) => setItemForm({ ...itemForm, tipe: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="permasalahan">A. Permasalahan</option>
                    <option value="penyebab">B. Faktor Penyebab</option>
                    <option value="tindakan">C. Tindakan / Solusi</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                  Teks Diagnostik Lengkap *
                </label>
                <textarea
                  rows={3}
                  placeholder="Tulis butir diagnostik..."
                  value={itemForm.teks}
                  onChange={(e) => setItemForm({ ...itemForm, teks: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.78rem",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalItemOpen(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "9px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "9px",
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Simpan Butir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

