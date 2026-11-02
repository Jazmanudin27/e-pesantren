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
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function LaporanPerkembanganAdminView() {
  const [loading, setLoading] = useState(true);
  const [laporanList, setLaporanList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formLaporan, setFormLaporan] = useState({
    santri_id: '',
    periode: 'Bulan Oktober 2026',
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
    nama_penulis: 'Ust. Hamdan S.Th.I (Musyrif Asrama)'
  });

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/laporan-perkembangan/admin');
      if (res.data?.success) {
        setLaporanList(res.data.data || []);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan admin:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSantri = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success) {
        setSantriList(res.data.data || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLaporan();
    fetchSantri();
  }, []);

  const handleSimpanLaporan = async (e) => {
    e.preventDefault();
    if (!formLaporan.santri_id || !formLaporan.periode || !formLaporan.catatan_ustadz) {
      showError('Validasi Gagal', 'Santri, Periode, dan Catatan Ustadz wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        santri_id: formLaporan.santri_id,
        periode: formLaporan.periode,
        tanggal_laporan: formLaporan.tanggal_laporan,
        nilai_akademik: {
          Nahwu: parseInt(formLaporan.nilai_nahwu) || 80,
          Sharaf: parseInt(formLaporan.nilai_sharaf) || 80,
          Fiqih: parseInt(formLaporan.nilai_fiqih) || 85,
          Tauhid: parseInt(formLaporan.nilai_tauhid) || 85,
          Tajwid: parseInt(formLaporan.nilai_tajwid) || 90
        },
        catatan_akademik: formLaporan.catatan_akademik,
        catatan_hafalan: formLaporan.catatan_hafalan,
        catatan_perilaku: formLaporan.catatan_perilaku,
        catatan_ibadah: formLaporan.catatan_ibadah,
        catatan_ustadz: formLaporan.catatan_ustadz,
        nama_penulis: formLaporan.nama_penulis,
        status_publikasi: 'Diterbitkan'
      };

      const res = await axios.post('/api/laporan-perkembangan/admin', payload);
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Laporan perkembangan santri berhasil diterbitkan ke Portal Wali Santri');
        setIsModalOpen(false);
        fetchLaporan();
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHapus = (id) => {
    showConfirm('Hapus Laporan?', 'Apakah yakin ingin menghapus laporan perkembangan santri ini?', async () => {
      try {
        await axios.delete(`/api/laporan-perkembangan/admin/${id}`);
        toastSuccess('Berhasil', 'Laporan berhasil dihapus');
        fetchLaporan();
      } catch (e) {
        showError('Gagal', e.message);
      }
    });
  };

  const filtered = (laporanList || []).filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.periode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-content-inner" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={26} color="#0284c7" />
            <span>Laporan Perkembangan Santri (Rapor Wali)</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Input dan publikasikan laporan perkembangan berkala (akademik, tahfidz, kedisiplinan, ibadah) ke orang tua
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchLaporan}
            className="btn-refresh" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <RotateCw size={15} /> Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} /> Buat Laporan Perkembangan
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Cari santri, NIS, atau periode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Total {filtered.length} laporan diterbitkan
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>SANTRI & NIS</th>
                <th style={{ padding: '12px 16px' }}>PERIODE</th>
                <th style={{ padding: '12px 16px' }}>TANGGAL</th>
                <th style={{ padding: '12px 16px' }}>CATATAN USTADZ / PENGASUH</th>
                <th style={{ padding: '12px 16px' }}>PENULIS</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>NIS: {item.nis} • {item.nama_asrama || 'Asrama'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0284c7' }}>
                    {item.periode}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>
                    {item.tanggal_laporan ? new Date(item.tanggal_laporan).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '320px', color: '#334155' }}>
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.catatan_ustadz}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.78rem' }}>
                    {item.nama_penulis}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ background: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800 }}>
                      Diterbitkan
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleHapus(item.id)}
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Hapus Laporan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data laporan perkembangan santri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT LAPORAN BARU */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px 20px', background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>Buat Laporan Perkembangan Santri</div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanLaporan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Pilih Santri *
                  </label>
                  <select
                    value={formLaporan.santri_id}
                    onChange={(e) => setFormLaporan({ ...formLaporan, santri_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Pilih Santri --</option>
                    {santriList.map(s => (
                      <option key={s.id} value={s.id}>{s.nama_santri} (NIS: {s.nis})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Periode Laporan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bulan Oktober 2026"
                    value={formLaporan.periode}
                    onChange={(e) => setFormLaporan({ ...formLaporan, periode: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Rincian Skor Nilai Mapel Diniyah */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                  NILAI AKADEMIK & DINIYAH (SKALA 0-100)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Nahwu</label>
                    <input type="number" value={formLaporan.nilai_nahwu} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_nahwu: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Sharaf</label>
                    <input type="number" value={formLaporan.nilai_sharaf} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_sharaf: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Fiqih</label>
                    <input type="number" value={formLaporan.nilai_fiqih} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_fiqih: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Tauhid</label>
                    <input type="number" value={formLaporan.nilai_tauhid} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_tauhid: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#64748b' }}>Tajwid</label>
                    <input type="number" value={formLaporan.nilai_tajwid} onChange={(e) => setFormLaporan({ ...formLaporan, nilai_tajwid: e.target.value })} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Catatan Hafalan & Tahfidz
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Hafalan bertambah 1 Juz mutqin (Juz 15), kelancaran tajwid Mumtaz."
                  value={formLaporan.catatan_hafalan}
                  onChange={(e) => setFormLaporan({ ...formLaporan, catatan_hafalan: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Catatan Kedisiplinan & Perilaku
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sangat sopan, rajin piket kamar kobong, tidak ada pelanggaran."
                  value={formLaporan.catatan_perilaku}
                  onChange={(e) => setFormLaporan({ ...formLaporan, catatan_perilaku: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Pesan Khusus Pengasuh / Musyrif untuk Orang Tua *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan pesan motivasi, nasihat, dan arahan perkembangan anak untuk orang tua..."
                  value={formLaporan.catatan_ustadz}
                  onChange={(e) => setFormLaporan({ ...formLaporan, catatan_ustadz: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

