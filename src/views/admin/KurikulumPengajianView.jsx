import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Plus,
  RotateCw,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function KurikulumPengajianView() {
  const [loading, setLoading] = useState(false);

  // Data Matriks Kurikulum 1-6
  const [matrixData, setMatrixData] = useState([]);
  const [editingMatrix, setEditingMatrix] = useState(false);
  const [tempMatrix, setTempMatrix] = useState([]);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [masterKegiatanList, setMasterKegiatanList] = useState([]);

  // Fetch Matriks
  const fetchMatriks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/kurikulum/matriks');
      if (res.data?.success && res.data.data?.matrix) {
        setMatrixData(res.data.data.matrix);
        setTempMatrix(JSON.parse(JSON.stringify(res.data.data.matrix)));
      }
    } catch (err) {
      console.warn('Gagal fetch matriks kurikulum:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Master Kegiatan & Kitab
  const fetchMasterKegiatan = async () => {
    try {
      const res = await axios.get('/api/materi-hafalan');
      if (res.data?.success && res.data.data) {
        setMasterKegiatanList(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal fetch master kegiatan:', err.message);
    }
  };

  useEffect(() => {
    fetchMatriks();
    fetchMasterKegiatan();
  }, []);

  // Simpan Perubahan Matriks
  const handleSaveMatrix = async () => {
    try {
      setSavingMatrix(true);
      await axios.post('/api/kurikulum/matriks', { matrix: tempMatrix });
      toastSuccess('Berhasil!', 'Kurikulum pengajian berhasil disimpan');
      setMatrixData(tempMatrix);
      setEditingMatrix(false);
    } catch (err) {
      showError('Gagal Simpan', err.response?.data?.message || err.message);
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleCellChange = (rowIndex, colKey, val) => {
    const updated = [...tempMatrix];
    updated[rowIndex][colKey] = val;
    setTempMatrix(updated);
  };

  // Tambah Baris Kegiatan ke Bawah
  const handleAddRow = () => {
    const nextNo = tempMatrix.length + 1;
    const newRow = {
      no: nextNo,
      k1: '',
      k2: '',
      k3: '',
      k4: '',
      k5: '',
      k6: ''
    };
    setTempMatrix([...tempMatrix, newRow]);
  };

  // Hapus Baris
  const handleRemoveRow = (indexToRemove) => {
    if (tempMatrix.length <= 1) return;
    const filtered = tempMatrix.filter((_, idx) => idx !== indexToRemove).map((r, i) => ({
      ...r,
      no: i + 1
    }));
    setTempMatrix(filtered);
  };

  // Daftar Pilihan Kegiatan / Kitab
  const allMasterOptions = Array.from(
    new Set([
      ...masterKegiatanList.map((m) => m.nama_materi),
      ...matrixData.flatMap((r) => [r.k1, r.k2, r.k3, r.k4, r.k5, r.k6]).filter(Boolean)
    ])
  ).sort().map((k) => ({ value: k, label: k }));

  // Hitung Statistik
  const totalBaris = (editingMatrix ? tempMatrix : matrixData).length;
  const totalKegiatanTerisi = (editingMatrix ? tempMatrix : matrixData).reduce((acc, row) => {
    return acc + [row.k1, row.k2, row.k3, row.k4, row.k5, row.k6].filter(Boolean).length;
  }, 0);

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* 1. TOP STATS CARDS (PERSIS MASTER SANTRI) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">JENJANG KELAS</div>
            <div className="stat-colored-number">6 Tingkat</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL KEGIATAN TERISI</div>
            <div className="stat-colored-number">{totalKegiatanTerisi} Mata Pelajaran</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">JUMLAH BARIS MATRIKS</div>
            <div className="stat-colored-number">{totalBaris} Baris</div>
          </div>
          <div className="stat-colored-icon-box">
            <Layers size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">DATABASE MASTER KITAB</div>
            <div className="stat-colored-number">{allMasterOptions.length} Kitab</div>
          </div>
          <div className="stat-colored-icon-box">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Kurikulum Pengajian & Daftar Kitab</h2>
            <p>Jadwal dan Daftar Kitab / Mata Pelajaran Pondok Pesantren per Tingkat Kelas 1 s/d Kelas 6</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={fetchMatriks}
            disabled={loading || savingMatrix}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          {editingMatrix ? (
            <>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setTempMatrix(JSON.parse(JSON.stringify(matrixData)));
                  setEditingMatrix(false);
                }}
                disabled={savingMatrix}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleAddRow}
                className="btn"
                style={{
                  background: '#f0fdf4',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Tambah Kegiatan Ke Bawah
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={14} /> {savingMatrix ? 'Menyimpan...' : 'Simpan Kurikulum'}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setTempMatrix(JSON.parse(JSON.stringify(matrixData)));
                setEditingMatrix(true);
              }}
              style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={14} /> Edit Kurikulum Matriks
            </button>
          )}
        </div>
      </div>

      {/* 3. MATRIKS KURIKULUM PENGAJIAN CARD (MODERN GREEN SHADOW) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #d1fae5',
          overflow: 'hidden',
          boxShadow: '0 10px 30px -5px rgba(5, 150, 105, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header Banner Hijau Gradasi Elegan */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
            color: '#ffffff',
            padding: '20px 24px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '6px',
              color: '#d1fae5'
            }}
          >
            Pondok Pesantren Nurul Wafa
          </div>

          <h3
            style={{
              margin: '0',
              fontSize: '1.4rem',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            KURIKULUM PENGAJIAN
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              color: '#ecfdf5',
              opacity: 0.95
            }}
          >
            Jadwal dan Daftar Kitab / Mata Pelajaran Pondok Pesantren
          </p>
        </div>

        {editingMatrix && (
          <div
            style={{
              padding: '12px 20px',
              background: '#ecfdf5',
              borderBottom: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#059669" />
              <span>
                <strong>Mode Edit Aktif:</strong> Pilih kegiatan pada menu dropdown tiap kotak kelas, atau klik <strong>"+ Tambah Kegiatan Ke Bawah"</strong> untuk menambah mata pelajaran baru.
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <Plus size={14} /> Tambah Kegiatan Ke Bawah (+ Baris {tempMatrix.length + 1})
            </button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              minWidth: '850px'
            }}
          >
            <thead>
              <tr style={{ background: '#065f46', color: '#ffffff' }}>
                <th
                  style={{
                    width: '50px',
                    textAlign: 'center',
                    padding: '12px 8px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    borderRight: '1px solid #047857',
                    background: '#064e3b'
                  }}
                >
                  NO
                </th>
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <th
                    key={k}
                    style={{
                      textAlign: 'center',
                      padding: '12px 14px',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      borderRight: k < 6 ? '1px solid #047857' : 'none',
                      minWidth: '150px'
                    }}
                  >
                    KELAS {k}
                  </th>
                ))}
                {editingMatrix && (
                  <th
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      padding: '12px 8px',
                      fontWeight: 800,
                      background: '#064e3b'
                    }}
                  >
                    AKSI
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(editingMatrix ? tempMatrix : matrixData).map((row, idx) => (
                <tr
                  key={row.no || idx}
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Nomor Urut */}
                  <td
                    style={{
                      textAlign: 'center',
                      fontWeight: 800,
                      color: '#475569',
                      background: idx % 2 === 0 ? '#f8fafc' : '#f1f5f9',
                      borderRight: '1px solid #e5e7eb',
                      padding: '10px 8px'
                    }}
                  >
                    {row.no}
                  </td>

                  {/* 6 Kolom Kelas */}
                  {[1, 2, 3, 4, 5, 6].map((k) => {
                    const val = row[`k${k}`] || '';
                    return (
                      <td
                        key={k}
                        style={{
                          padding: editingMatrix ? '6px 8px' : '10px 14px',
                          borderRight: k < 6 ? '1px solid #e5e7eb' : 'none',
                          color: val ? '#0f172a' : '#94a3b8',
                          verticalAlign: 'middle'
                        }}
                      >
                        {editingMatrix ? (
                          <select
                            value={val}
                            onChange={(e) => handleCellChange(idx, `k${k}`, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              border: val ? '1.5px solid #059669' : '1px solid #cbd5e1',
                              fontSize: '0.8rem',
                              fontWeight: val ? 700 : 400,
                              color: val ? '#065f46' : '#94a3b8',
                              background: val ? '#f0fdf4' : '#ffffff',
                              cursor: 'pointer',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          >
                            <option value="">- Kosong -</option>
                            {allMasterOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : val ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: '#f0fdf4',
                              border: '1px solid #dcfce7',
                              fontWeight: 700,
                              color: '#065f46'
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#059669',
                                flexShrink: 0
                              }}
                            />
                            <span>{val}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.78rem' }}>
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Tombol Hapus Baris Saat Edit */}
                  {editingMatrix && (
                    <td
                      style={{
                        textAlign: 'center',
                        padding: '6px',
                        borderLeft: '1px solid #e5e7eb'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={tempMatrix.length <= 1}
                        title="Hapus baris ini"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: tempMatrix.length <= 1 ? '#cbd5e1' : '#ef4444',
                          cursor: tempMatrix.length <= 1 ? 'not-allowed' : 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Card Saat Mode Edit */}
        {editingMatrix && (
          <div
            style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <button
              type="button"
              onClick={handleAddRow}
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                border: '1.5px dashed #86efac',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Tambah Baris Kegiatan Ke Bawah (Baris {tempMatrix.length + 1})
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setTempMatrix(JSON.parse(JSON.stringify(matrixData)));
                  setEditingMatrix(false);
                }}
                disabled={savingMatrix}
                style={{
                  background: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: savingMatrix ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                }}
              >
                <Save size={16} />
                {savingMatrix ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
