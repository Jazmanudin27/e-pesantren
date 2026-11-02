import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  RotateCw, 
  Search, 
  GraduationCap, 
  BookOpen, 
  Award, 
  User, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Edit3,
  Building,
  X,
  Save,
  Loader2,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function LaporanPerkembanganAdminView() {
  const [loading, setLoading] = useState(true);
  const [laporanList, setLaporanList] = useState([]);
  const [santriList, setSantriList] = useState([]);

  // Filter & Tab State (Sesuai Master Santri)
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterPeriode, setFilterPeriode] = useState('Semua Periode');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedLaporan, setSelectedLaporan] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal Form (Add / Edit) State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    id: null,
    santri_id: '',
    periode: 'Bulan November 2026',
    tanggal_laporan: new Date().toISOString().slice(0, 10),
    nilai_nahwu: '85',
    nilai_sharaf: '82',
    nilai_fiqih: '90',
    nilai_tauhid: '88',
    nilai_tajwid: '92',
    catatan_akademik: '',
    catatan_hafalan: '',
    catatan_perilaku: '',
    catatan_ibadah: '',
    catatan_ustadz: '',
    nama_penulis: 'Ust. Hamdan S.Th.I (Musyrif Asrama)',
    status_publikasi: 'Diterbitkan'
  };

  const [formLaporan, setFormLaporan] = useState(initialForm);

  const parseNilaiAkademik = (raw) => {
    if (!raw) return { Nahwu: 85, Sharaf: 82, Fiqih: 90, Tauhid: 88, Tajwid: 92 };
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { Nahwu: 85, Sharaf: 82, Fiqih: 90, Tauhid: 88, Tajwid: 92 };
    }
  };

  const getAverageNilai = (raw) => {
    const obj = parseNilaiAkademik(raw);
    const vals = Object.values(obj).map(v => Number(v) || 0).filter(v => v > 0);
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round(sum / vals.length);
  };

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/laporan-perkembangan/admin');
      if (res.data?.success) {
        setLaporanList(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setLaporanList([]);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan admin:', err.message);
      setLaporanList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSantri = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLaporan();
    fetchSantri();
  }, []);

  const openAddModal = () => {
    setFormMode('add');
    setFormLaporan({
      ...initialForm,
      santri_id: santriList[0]?.id || '',
      tanggal_laporan: new Date().toISOString().slice(0, 10)
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    const nilai = parseNilaiAkademik(item.nilai_akademik);
    setFormMode('edit');
    setFormLaporan({
      id: item.id,
      santri_id: item.santri_id,
      periode: item.periode || 'Bulan November 2026',
      tanggal_laporan: item.tanggal_laporan ? String(item.tanggal_laporan).slice(0, 10) : new Date().toISOString().slice(0, 10),
      nilai_nahwu: String(nilai.Nahwu ?? 85),
      nilai_sharaf: String(nilai.Sharaf ?? 82),
      nilai_fiqih: String(nilai.Fiqih ?? 90),
      nilai_tauhid: String(nilai.Tauhid ?? 88),
      nilai_tajwid: String(nilai.Tajwid ?? 92),
      catatan_akademik: item.catatan_akademik || '',
      catatan_hafalan: item.catatan_hafalan || '',
      catatan_perilaku: item.catatan_perilaku || '',
      catatan_ibadah: item.catatan_ibadah || '',
      catatan_ustadz: item.catatan_ustadz || '',
      nama_penulis: item.nama_penulis || 'Ust. Hamdan S.Th.I (Musyrif Asrama)',
      status_publikasi: item.status_publikasi || 'Diterbitkan'
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (item) => {
    setSelectedLaporan(item);
    setIsDetailModalOpen(true);
  };

  const handleSimpanLaporan = async (e) => {
    e.preventDefault();
    if (!formLaporan.santri_id || !formLaporan.periode || !formLaporan.catatan_ustadz) {
      showError('Validasi Gagal', 'Santri, Periode, dan Catatan Ustadz wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        santri_id: Number(formLaporan.santri_id),
        periode: formLaporan.periode,
        tanggal_laporan: formLaporan.tanggal_laporan,
        nilai_akademik: {
          Nahwu: parseInt(formLaporan.nilai_nahwu, 10) || 80,
          Sharaf: parseInt(formLaporan.nilai_sharaf, 10) || 80,
          Fiqih: parseInt(formLaporan.nilai_fiqih, 10) || 85,
          Tauhid: parseInt(formLaporan.nilai_tauhid, 10) || 85,
          Tajwid: parseInt(formLaporan.nilai_tajwid, 10) || 90
        },
        catatan_akademik: formLaporan.catatan_akademik,
        catatan_hafalan: formLaporan.catatan_hafalan,
        catatan_perilaku: formLaporan.catatan_perilaku,
        catatan_ibadah: formLaporan.catatan_ibadah,
        catatan_ustadz: formLaporan.catatan_ustadz,
        nama_penulis: formLaporan.nama_penulis,
        status_publikasi: formLaporan.status_publikasi || 'Diterbitkan'
      };

      if (formMode === 'add') {
        const res = await axios.post('/api/laporan-perkembangan/admin', payload);
        if (res.data?.success) {
          toastSuccess('Berhasil!', 'Laporan perkembangan santri berhasil diterbitkan ke Portal Wali Santri');
        }
      } else {
        const res = await axios.put(`/api/laporan-perkembangan/admin/${formLaporan.id}`, payload);
        if (res.data?.success) {
          toastSuccess('Berhasil!', 'Laporan perkembangan santri berhasil diperbarui');
        }
      }

      setIsModalOpen(false);
      await fetchLaporan();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapus = (item) => {
    showConfirm(
      'Hapus Laporan Perkembangan?',
      `Hapus rapor perkembangan periode "${item.periode}" untuk santri ${item.nama_santri}?`,
      async () => {
        try {
          await axios.delete(`/api/laporan-perkembangan/admin/${item.id}`);
          toastSuccess('Berhasil', 'Laporan perkembangan berhasil dihapus dari database');
          await fetchLaporan();
        } catch (e) {
          showError('Gagal', e.response?.data?.message || e.message);
        }
      }
    );
  };

  // Unique options for filters
  const uniqueAsramas = Array.from(
    new Set(laporanList.map(l => l.nama_asrama).filter(Boolean))
  );
  const uniquePeriodes = Array.from(
    new Set(laporanList.map(l => l.periode).filter(Boolean))
  );

  // Filtered List
  const filteredList = (laporanList || []).filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.periode || '').toLowerCase().includes(q) ||
      (item.catatan_ustadz || '').toLowerCase().includes(q) ||
      (item.nama_penulis || '').toLowerCase().includes(q);

    const statusPub = item.status_publikasi || 'Diterbitkan';
    const matchTab =
      activeFilterTab === 'semua'
        ? true
        : activeFilterTab === 'diterbitkan'
        ? statusPub === 'Diterbitkan'
        : statusPub !== 'Diterbitkan';

    const matchAsrama =
      filterAsrama === 'Semua Asrama' ? true : (item.nama_asrama || '').includes(filterAsrama);

    const matchPeriode =
      filterPeriode === 'Semua Periode' ? true : item.periode === filterPeriode;

    const matchStatus =
      filterStatus === 'Semua Status' ? true : statusPub === filterStatus;

    return matchSearch && matchTab && matchAsrama && matchPeriode && matchStatus;
  });

  // Stats
  const totalLaporan = laporanList.length;
  const countDiterbitkan = laporanList.filter(l => (l.status_publikasi || 'Diterbitkan') === 'Diterbitkan').length;
  const countSantriUnik = new Set(laporanList.map(l => l.santri_id)).size;
  const overallAvg =
    totalLaporan > 0
      ? Math.round(laporanList.reduce((acc, l) => acc + getAverageNilai(l.nilai_akademik), 0) / totalLaporan)
      : 0;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (Sama seperti Master Santri) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL LAPORAN RAPOR</div>
            <div className="stat-colored-number">{totalLaporan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">DITERBITKAN KE WALI</div>
            <div className="stat-colored-number">{countDiterbitkan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI TERLAPOR</div>
            <div className="stat-colored-number">{countSantriUnik}</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">RATA-RATA SKOR DINIYAH</div>
            <div className="stat-colored-number">{overallAvg}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <FileText size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Laporan Perkembangan Santri (Rapor Wali)</h2>
            <p>Input dan publikasikan laporan perkembangan berkala (akademik, tahfidz, kedisiplinan, ibadah) ke orang tua</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchLaporan}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddModal}
          >
            <Plus size={14} /> Buat Laporan Perkembangan
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <FileText size={14} /> Semua Laporan ({totalLaporan})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'diterbitkan' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('diterbitkan')}
        >
          <CheckCircle2 size={14} /> Sudah Diterbitkan ({countDiterbitkan})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'draft' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('draft')}
        >
          <BookOpen size={14} /> Draft / Arsip ({totalLaporan - countDiterbitkan})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, periode, catatan ustadz, penulis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={filterAsrama}
          onChange={(e) => setFilterAsrama(e.target.value)}
        >
          <option value="Semua Asrama">Semua Asrama</option>
          {uniqueAsramas.map((asr) => (
            <option key={asr} value={asr}>{asr}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterPeriode}
          onChange={(e) => setFilterPeriode(e.target.value)}
        >
          <option value="Semua Periode">Semua Periode</option>
          {uniquePeriodes.map((per) => (
            <option key={per} value={per}>{per}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="Semua Status">Semua Status</option>
          <option value="Diterbitkan">Diterbitkan</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
            Memuat data laporan perkembangan santri...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th>ASRAMA & KOBONG</th>
                <th>PERIODE & TANGGAL</th>
                <th className="td-center">RATA-RATA DINIYAH</th>
                <th>CATATAN USTADZ / PENGASUH</th>
                <th>PENULIS</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, idx) => {
                const avg = getAverageNilai(item.nilai_akademik);
                const statusPub = item.status_publikasi || 'Diterbitkan';
                return (
                  <tr key={item.id || idx}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {item.nis}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                        <Building size={13} color="#059669" />
                        <span>{item.nama_asrama || 'Asrama Pondok'}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {item.nama_kamar || 'Kamar 01'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0284c7' }}>{item.periode}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        {item.tanggal_laporan ? new Date(item.tanggal_laporan).toLocaleDateString('id-ID') : '-'}
                      </div>
                    </td>
                    <td className="td-center">
                      <span className={`badge ${avg >= 85 ? 'badge-success' : avg >= 75 ? 'badge-info' : 'badge-warning'}`}>
                        Skor: {avg}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      <div style={{
                        fontSize: '0.78rem',
                        color: '#334155',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}>
                        {item.catatan_ustadz || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#0f172a' }}>
                        {item.nama_penulis || 'Ustadz Pembina'}
                      </div>
                    </td>
                    <td className="td-center">
                      <span className={`badge ${statusPub === 'Diterbitkan' ? 'badge-success' : 'badge-warning'}`}>
                        {statusPub}
                      </span>
                    </td>
                    <td className="td-center">
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                          className="btn-action btn-action-view"
                          onClick={() => openDetailModal(item)}
                          title="Lihat Detail Rapor Santri"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-edit"
                          onClick={() => openEditModal(item)}
                          title="Edit Laporan Perkembangan"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn-action btn-action-delete"
                          onClick={() => handleHapus(item)}
                          title="Hapus Laporan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data laporan perkembangan santri yang sesuai pencarian/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL LAPORAN PERKEMBANGAN SANTRI             */}
      {/* ==================================================== */}
      {isDetailModalOpen && selectedLaporan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Detail Rapor Perkembangan Santri
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Periode: {selectedLaporan.periode} • Tanggal: {selectedLaporan.tanggal_laporan ? new Date(selectedLaporan.tanggal_laporan).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '6px', borderRadius: '6px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Santri Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedLaporan.nama_santri}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    NIS: <strong style={{ color: '#38bdf8' }}>{selectedLaporan.nis}</strong> • {selectedLaporan.nama_asrama || 'Asrama Pondok'} ({selectedLaporan.nama_kamar || 'Kamar 01'})
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '4px 10px' }}>
                  {selectedLaporan.status_publikasi || 'Diterbitkan'}
                </span>
              </div>

              {/* Nilai Akademik & Diniyah Grid */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={15} color="#0284c7" /> Nilai Akademik & Diniyah
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {Object.entries(parseNilaiAkademik(selectedLaporan.nilai_akademik)).map(([mapel, skor]) => (
                    <div key={mapel} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{mapel}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>{skor}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rincian Evaluasi */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Catatan Tahfidz & Hafalan
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                    {selectedLaporan.catatan_hafalan || '-'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Catatan Ibadah & Kedisiplinan
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                    {selectedLaporan.catatan_ibadah || selectedLaporan.catatan_perilaku || '-'}
                  </div>
                </div>
              </div>

              {/* Catatan Ustadz / Wali Asrama */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Pesan & Evaluasi Ustadz / Pengasuh ({selectedLaporan.nama_penulis})
                </div>
                <div style={{ fontSize: '0.84rem', color: '#1e293b', lineHeight: 1.5 }}>
                  {selectedLaporan.catatan_ustadz || '-'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedLaporan);
                }}
              >
                <Edit3 size={13} /> Edit Laporan Ini
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL INPUT / EDIT LAPORAN PERKEMBANGAN SANTRI       */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '660px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '15px 20px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                  {formMode === 'add' ? 'Buat Laporan Perkembangan Santri' : 'Edit Laporan Perkembangan Santri'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSimpanLaporan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Pilih Santri *
                  </label>
                  <SearchableSelect
                    options={santriList.map(s => ({
                      value: s.id,
                      label: s.nama_santri,
                      sublabel: `NIS: ${s.nis} • ${s.nama_asrama || 'Asrama'}`
                    }))}
                    value={formLaporan.santri_id}
                    onChange={(val) => setFormLaporan({ ...formLaporan, santri_id: val })}
                    placeholder="-- Pilih atau cari santri --"
                    searchPlaceholder="Ketik nama atau NIS santri..."
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Periode Laporan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bulan November 2026"
                    value={formLaporan.periode}
                    onChange={(e) => setFormLaporan({ ...formLaporan, periode: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Rincian Skor Nilai Mapel Diniyah */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  NILAI AKADEMIK & DINIYAH (SKALA 0-100)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Nahwu</label>
                    <input type="number" value={formLaporan.nilai_nahwu} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_nahwu: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Sharaf</label>
                    <input type="number" value={formLaporan.nilai_sharaf} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_sharaf: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Fiqih</label>
                    <input type="number" value={formLaporan.nilai_fiqih} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_fiqih: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Tauhid</label>
                    <input type="number" value={formLaporan.nilai_tauhid} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_tauhid: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Tajwid</label>
                    <input type="number" value={formLaporan.nilai_tajwid} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_tajwid: e.target.value })} style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Catatan Hafalan & Tahfidz
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Hafalan bertambah 1 Juz mutqin..."
                    value={formLaporan.catatan_hafalan}
                    onChange={(e) => setFormLaporan({ ...formLaporan, catatan_hafalan: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Catatan Ibadah & Akhlak
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Disiplin sholat berjamaah & sopan..."
                    value={formLaporan.catatan_ibadah}
                    onChange={(e) => setFormLaporan({ ...formLaporan, catatan_ibadah: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Catatan & Evaluasi Lengkap Ustadz / Pengasuh *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan perkembangan komprehensif santri untuk ditampilkan di aplikasi orang tua..."
                  value={formLaporan.catatan_ustadz}
                  onChange={(e) => setFormLaporan({ ...formLaporan, catatan_ustadz: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Nama Penulis / Musyrif
                  </label>
                  <input
                    type="text"
                    value={formLaporan.nama_penulis}
                    onChange={(e) => setFormLaporan({ ...formLaporan, nama_penulis: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Tanggal Laporan
                  </label>
                  <input
                    type="date"
                    value={formLaporan.tanggal_laporan}
                    onChange={(e) => setFormLaporan({ ...formLaporan, tanggal_laporan: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Status Publikasi
                  </label>
                  <select
                    value={formLaporan.status_publikasi}
                    onChange={(e) => setFormLaporan({ ...formLaporan, status_publikasi: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  >
                    <option value="Diterbitkan">Diterbitkan ke Wali</option>
                    <option value="Draft">Simpan sebagai Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  <Save size={14} />
                  {submitting ? 'Menyimpan...' : formMode === 'add' ? 'Terbitkan Laporan' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
