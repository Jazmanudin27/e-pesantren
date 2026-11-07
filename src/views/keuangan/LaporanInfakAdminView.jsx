import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Heart,
  Search,
  Filter,
  Plus,
  RotateCw,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  TrendingUp,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function LaporanInfakAdminView() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_terkumpul: 0,
    total_transaksi_berhasil: 0,
    total_transaksi_pending: 0
  });
  const [programs, setPrograms] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal Tambah Program
  const [isModalProgramOpen, setIsModalProgramOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    kode_program: '',
    nama_program: '',
    kategori: 'Infak Pesantren',
    deskripsi: '',
    target_dana: '50000000'
  });
  const [submittingProgram, setSubmittingProgram] = useState(false);

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterProgram !== 'Semua') params.program_id = filterProgram;
      if (filterStatus !== 'Semua') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await axios.get('/api/infak/laporan', { params });
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data.summary || {});
        setPrograms(res.data.data.programs || []);
        setTransaksiList(res.data.data.transaksi || []);
      }
    } catch (err) {
      console.warn('Gagal memuat laporan infak:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [filterProgram, filterStatus]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    fetchLaporan();
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!programForm.nama_program.trim()) {
      showError('Gagal', 'Nama program infak wajib diisi!');
      return;
    }

    try {
      setSubmittingProgram(true);
      const res = await axios.post('/api/infak/program', {
        ...programForm,
        target_dana: parseFloat(programForm.target_dana) || 0
      });
      if (res.data?.success) {
        toastSuccess('Berhasil', 'Program infak & sedekah baru berhasil ditambahkan.');
        setIsModalProgramOpen(false);
        setProgramForm({
          kode_program: '',
          nama_program: '',
          kategori: 'Infak Pesantren',
          deskripsi: '',
          target_dana: '50000000'
        });
        fetchLaporan();
      } else {
        showError('Gagal', res.data?.message || 'Gagal menyimpan program.');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message || 'Terjadi kesalahan.');
    } finally {
      setSubmittingProgram(false);
    }
  };

  const handleDeleteTransaksi = async (id, kode) => {
    const ok = await showConfirm(
      'Hapus Catatan Infak?',
      `Hapus pencatatan transaksi ${kode}? Tindakan ini tidak dapat dibatalkan.`,
      'Ya, Hapus',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/infak/transaksi/${id}`);
      if (res.data?.success) {
        toastSuccess('Dihapus', 'Pencatatan transaksi infak berhasil dihapus.');
        fetchLaporan();
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || 'Gagal menghapus transaksi.');
    }
  };

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  return (
    <div className="admin-content-inner" style={{ padding: '20px' }}>
      {/* 1. TOP HEADER & CALL TO ACTION (DISAMAKAN PERSIS DENGAN INFORMASI & TABUNGAN) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)'
          }}>
            <Heart size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Laporan Penerimaan Infak &amp; Sedekah</span>
              <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Pencatatan Terpisah
              </span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '3px 0 0' }}>
              Fasilitas infak &amp; sedekah sukarela orang tua santri via QRIS / VA. Terpisah 100% dari tagihan administrasi SPP.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsModalProgramOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}
          >
            <Plus size={16} /> Tambah Program Infak
          </button>
          <button
            onClick={fetchLaporan}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#334155'
            }}
            title="Segarkan Data"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Terkumpul */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            Total Infak &amp; Sedekah Masuk
          </div>
          <div className="text-2xl md:text-3xl font-black tracking-tight mt-1">
            {formatRp(summary.total_terkumpul)}
          </div>
          <div className="text-xs text-emerald-100 mt-2 flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={14} /> {summary.total_transaksi_berhasil || 0} donasi terverifikasi masuk
          </div>
        </div>

        {/* Program Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Program Infak Aktif
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {programs.length} Program
          </div>
          <div className="text-xs text-teal-600 mt-2 font-semibold">
            Masjid, Beasiswa Yatim, Wakaf Qur'an, Konsumsi
          </div>
        </div>

        {/* Transaksi Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sesi Menunggu Pembayaran
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {summary.total_transaksi_pending || 0} Transaksi
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Sesi QRIS / VA yang belum diselesaikan orang tua
          </div>
        </div>
      </div>

      {/* 3. PROGRAM SUMMARY SLIDER CARDS */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600" />
          Progres Alokasi Program Infak
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {programs.map((p) => {
            const pct = p.target_dana > 0 ? Math.min(100, Math.round((p.terkumpul / p.target_dana) * 100)) : 0;
            return (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mb-1.5">
                    {p.kategori}
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-tight">
                    {p.nama_program}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
                    <span>{formatRp(p.terkumpul)}</span>
                    <span className="text-emerald-600 font-extrabold">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>Target: {formatRp(p.target_dana)}</span>
                    <span>{p.jumlah_donatur || 0} Donatur</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FILTER & TABEL PENERIMAAN INFAK */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama donatur, santri, kode transaksi..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none"
            >
              <option value="Semua">Semua Program Infak</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.nama_program}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Berhasil">Berhasil (Diterima)</option>
              <option value="Pending">Menunggu Pembayaran</option>
            </select>
          </div>
        </div>

        {/* Table Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                <th className="py-3 px-4">Tanggal &amp; Kode</th>
                <th className="py-3 px-4">Nama Donatur / Santri</th>
                <th className="py-3 px-4">Tujuan Program</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Doa / Hajat</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Memuat data penerimaan infak...
                  </td>
                </tr>
              ) : transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Heart size={32} className="mx-auto mb-2 text-slate-300" />
                    Belum ada transaksi infak dan sedekah yang tercatat.
                  </td>
                </tr>
              ) : (
                transaksiList.map((t) => {
                  const isSuccess = t.status === 'Berhasil';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800 text-xs">{t.kode_transaksi}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(t.tanggal_transaksi).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          {t.is_anonim ? (
                            <span className="text-slate-500 italic">Hamba Allah (Anonim)</span>
                          ) : (
                            <span>{t.nama_donatur}</span>
                          )}
                        </div>
                        {t.nama_santri && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Santri: <span className="font-semibold text-emerald-700">{t.nama_santri}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700">{t.nama_program}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-emerald-600 text-sm">
                          {formatRp(t.nominal)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {t.metode_pembayaran?.includes('QRIS') ? <QrCode size={12} /> : <CreditCard size={12} />}
                          <span>{t.metode_pembayaran || 'QRIS'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {t.doa_pesan ? (
                          <span className="text-[11px] text-slate-600 italic bg-amber-50 border border-amber-200 px-2 py-1 rounded block">
                            "{t.doa_pesan}"
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {isSuccess ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteTransaksi(t.id, t.kode_transaksi)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Catatan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL TAMBAH PROGRAM INFAK */}
      {isModalProgramOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base">Tambah Program Infak Baru</h3>
                <p className="text-xs text-emerald-100">Buat wadah tujuan infak / sedekah bagi orang tua</p>
              </div>
              <button
                onClick={() => setIsModalProgramOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program Infak *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Genset &amp; Pompa Air Asrama"
                  value={programForm.nama_program}
                  onChange={(e) => setProgramForm({ ...programForm, nama_program: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Program</label>
                <select
                  value={programForm.kategori}
                  onChange={(e) => setProgramForm({ ...programForm, kategori: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="Wakaf &amp; Pembangunan">Wakaf &amp; Pembangunan</option>
                  <option value="Beasiswa Pendidikan">Beasiswa Pendidikan &amp; Yatim</option>
                  <option value="Wakaf Ilmu">Wakaf Ilmu &amp; Kitab</option>
                  <option value="Sedekah Konsumsi">Sedekah Konsumsi / Berkah</option>
                  <option value="Infak Umum">Infak &amp; Sedekah Operasional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Dana (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 25000000"
                  value={programForm.target_dana}
                  onChange={(e) => setProgramForm({ ...programForm, target_dana: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan tujuan dan pemanfaatan infak ini..."
                  value={programForm.deskripsi}
                  onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalProgramOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProgram}
                  className="px-5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl shadow hover:from-emerald-700 hover:to-teal-800 transition"
                >
                  {submittingProgram ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

