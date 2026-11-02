import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  QrCode, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Plus, 
  Search, 
  RotateCw, 
  Layers, 
  Filter, 
  Calendar,
  Building,
  UserCheck,
  Send,
  Eye,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  FolderPlus,
  Tag
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';

export default function KeuanganAdminView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    transaksiTerakhir: [],
    tunggakanSantri: [],
    komponenBiaya: [],
    semuaTagihan: []
  });
  const [santriList, setSantriList] = useState([]);

  // Tab & Filter State (Sesuai Master Produk / Master Santri)
  const [activeTab, setActiveTab] = useState('tagihan'); // 'tagihan' | 'tunggakan' | 'transaksi' | 'komponen'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail Tagihan / Transaksi
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Modal Buat / Edit Tagihan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [modalFilterTipe, setModalFilterTipe] = useState('Semua'); // 'Semua' | 'Bulanan' | 'Sekali Bayar'
  const [skemaBayar, setSkemaBayar] = useState('belum'); // 'belum' | 'cicil' | 'lunas'
  const [metodeBayarForm, setMetodeBayarForm] = useState('Tunai / Kasir');
  const initialFormTagihan = {
    id: null,
    santri_id: '',
    komponen_id: '',
    judul_tagihan: '',
    total_tagihan: '',
    sudah_dibayar: '0',
    periode_bulan: 'November 2026',
    jatuh_tempo: new Date().toISOString().slice(0, 10),
    status: 'Belum Dibayar'
  };
  const [formTagihan, setFormTagihan] = useState(initialFormTagihan);

  // Modal Kelola Komponen Biaya (Master Produk Biaya)
  const [isKomponenModalOpen, setIsKomponenModalOpen] = useState(false);
  const [editingKompId, setEditingKompId] = useState(null);
  const [savingKomp, setSavingKomp] = useState(false);
  const [formKomponen, setFormKomponen] = useState({
    nama_komponen: '',
    kategori: 'Bulanan',
    nominal_default: '',
    deskripsi: ''
  });

  const formatRupiah = (val) => `Rp ${parseFloat(val || 0).toLocaleString('id-ID')}`;

  const fetchRekap = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/keuangan/admin/rekap');
      if (res.data?.success) {
        setData({
          summary: res.data.data.summary || {},
          transaksiTerakhir: res.data.data.transaksiTerakhir || [],
          tunggakanSantri: res.data.data.tunggakanSantri || [],
          komponenBiaya: res.data.data.komponenBiaya || [],
          semuaTagihan: res.data.data.semuaTagihan || []
        });
      }
    } catch (err) {
      console.warn('Gagal ambil data rekap keuangan:', err.message);
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
    fetchRekap();
    fetchSantri();
  }, []);

  // Handlers Tagihan
  const openAddTagihan = () => {
    const firstKomp = data.komponenBiaya?.[0];
    const isBulanan = !firstKomp || firstKomp.kategori === 'Bulanan';
    const defaultPeriode = isBulanan ? 'November 2026' : 'TA 2026/2027 (Satu Kali Bayar)';
    setFormMode('add');
    setModalFilterTipe('Semua');
    setSkemaBayar('belum');
    setMetodeBayarForm('Tunai / Kasir');
    setFormTagihan({
      ...initialFormTagihan,
      santri_id: santriList[0]?.id || '',
      komponen_id: firstKomp?.id ? String(firstKomp.id) : '',
      judul_tagihan: firstKomp ? `${firstKomp.nama_komponen} - ${defaultPeriode}` : '',
      periode_bulan: defaultPeriode,
      total_tagihan: firstKomp ? String(parseFloat(firstKomp.nominal_default || 0)) : '',
      sudah_dibayar: '0'
    });
    setIsModalOpen(true);
  };

  const openEditTagihan = (item) => {
    const tot = parseFloat(item.total_tagihan || 0);
    const dib = parseFloat(item.sudah_dibayar || 0);
    setFormMode('edit');
    setModalFilterTipe('Semua');
    setSkemaBayar(dib >= tot && tot > 0 ? 'lunas' : dib > 0 ? 'cicil' : 'belum');
    setMetodeBayarForm('Tunai / Kasir');
    setFormTagihan({
      id: item.id,
      santri_id: item.santri_id,
      komponen_id: item.komponen_id ? String(item.komponen_id) : '',
      judul_tagihan: item.judul_tagihan || '',
      total_tagihan: String(tot),
      sudah_dibayar: String(dib),
      periode_bulan: item.periode_bulan || 'November 2026',
      jatuh_tempo: item.jatuh_tempo ? String(item.jatuh_tempo).slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: item.status || 'Belum Dibayar'
    });
    setIsModalOpen(true);
  };

  const openDetailTagihan = (item) => {
    setSelectedDetail(item);
    setIsDetailOpen(true);
  };

  const handleSimpanTagihan = async (e) => {
    e.preventDefault();
    if (!formTagihan.santri_id || !formTagihan.komponen_id || !formTagihan.total_tagihan) {
      showError('Validasi Gagal', 'Santri, Komponen Biaya, dan Nominal wajib diisi');
      return;
    }

    const selKomp = (data.komponenBiaya || []).find(k => String(k.id) === String(formTagihan.komponen_id));
    const autoJudul = selKomp
      ? `${selKomp.nama_komponen}${formTagihan.periode_bulan ? ` - ${formTagihan.periode_bulan}` : ''}`
      : formTagihan.judul_tagihan;

    const totalNum = Math.max(0, parseFloat(formTagihan.total_tagihan) || 0);
    const dibayarNum =
      skemaBayar === 'lunas'
        ? totalNum
        : skemaBayar === 'belum'
        ? 0
        : Math.min(totalNum, Math.max(0, parseFloat(formTagihan.sudah_dibayar) || 0));

    const payload = {
      ...formTagihan,
      judul_tagihan: autoJudul,
      total_tagihan: totalNum,
      sudah_dibayar: dibayarNum,
      metode_pembayaran: metodeBayarForm
    };

    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/keuangan/admin/tagihan', payload);
        if (res.data?.success) {
          toastSuccess('Berhasil!', 'Tagihan & status pembayaran santri berhasil disimpan');
        }
      } else {
        const res = await axios.put(`/api/keuangan/admin/tagihan/${formTagihan.id}`, payload);
        if (res.data?.success) {
          toastSuccess('Berhasil!', 'Data tagihan & cicilan santri berhasil diperbarui');
        }
      }
      setIsModalOpen(false);
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTagihan = (item) => {
    showConfirm(
      'Hapus Tagihan Santri?',
      `Hapus tagihan "${item.judul_tagihan}" (${formatRupiah(item.total_tagihan)}) milik ${item.nama_santri}?`,
      async () => {
        try {
          await axios.delete(`/api/keuangan/admin/tagihan/${item.id}`);
          toastSuccess('Dihapus!', 'Tagihan berhasil dihapus dari database');
          await fetchRekap();
        } catch (err) {
          showError('Gagal', err.response?.data?.message || err.message);
        }
      }
    );
  };

  // Handlers Komponen Biaya (Master Produk Biaya)
  const handleStartEditKomp = (k) => {
    setEditingKompId(k.id);
    setFormKomponen({
      nama_komponen: k.nama_komponen || '',
      kategori: k.kategori || 'Bulanan',
      nominal_default: String(k.nominal_default || ''),
      deskripsi: k.deskripsi || ''
    });
    setIsKomponenModalOpen(true);
  };

  const handleResetKompForm = () => {
    setEditingKompId(null);
    setFormKomponen({
      nama_komponen: '',
      kategori: 'Bulanan',
      nominal_default: '',
      deskripsi: ''
    });
  };

  const handleSimpanKomponen = async (e) => {
    e.preventDefault();
    if (!formKomponen.nama_komponen.trim() || !formKomponen.nominal_default) {
      showError('Validasi Gagal', 'Nama komponen dan nominal wajib diisi');
      return;
    }
    try {
      setSavingKomp(true);
      if (editingKompId) {
        await axios.put(`/api/keuangan/admin/komponen/${editingKompId}`, formKomponen);
        toastSuccess('Berhasil!', 'Master komponen biaya berhasil diperbarui');
      } else {
        await axios.post('/api/keuangan/admin/komponen', formKomponen);
        toastSuccess('Berhasil!', 'Master komponen biaya baru berhasil ditambahkan');
      }
      handleResetKompForm();
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSavingKomp(false);
    }
  };

  const handleDeleteKomponen = (k) => {
    showConfirm(
      'Hapus Komponen Biaya?',
      `Hapus komponen "${k.nama_komponen}" (${formatRupiah(k.nominal_default)})?`,
      async () => {
        try {
          await axios.delete(`/api/keuangan/admin/komponen/${k.id}`);
          toastSuccess('Dihapus!', 'Komponen biaya berhasil dihapus');
          await fetchRekap();
        } catch (err) {
          showError('Gagal', err.response?.data?.message || err.message);
        }
      }
    );
  };

  // Unique Asrama List for Filter
  const uniqueAsramas = Array.from(
    new Set(
      [...(data.semuaTagihan || []), ...(data.tunggakanSantri || [])]
        .map(x => x.nama_asrama)
        .filter(Boolean)
    )
  );

  // Filtered Lists per Tab
  const q = searchQuery.toLowerCase();

  const filteredTagihan = (data.semuaTagihan || []).filter(item => {
    const matchQ =
      !q ||
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.kode_tagihan || '').toLowerCase().includes(q) ||
      (item.judul_tagihan || '').toLowerCase().includes(q);
    const matchKat = filterKategori === 'Semua Kategori' ? true : item.kategori === filterKategori;
    const matchAsr = filterAsrama === 'Semua Asrama' ? true : (item.nama_asrama || '').includes(filterAsrama);
    const matchSt = filterStatus === 'Semua Status' ? true : item.status === filterStatus;
    return matchQ && matchKat && matchAsr && matchSt;
  });

  const filteredTunggakan = (data.tunggakanSantri || []).filter(item => {
    const matchQ =
      !q ||
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.nama_wali || '').toLowerCase().includes(q);
    const matchAsr = filterAsrama === 'Semua Asrama' ? true : (item.nama_asrama || '').includes(filterAsrama);
    return matchQ && matchAsr;
  });

  const filteredTransaksi = (data.transaksiTerakhir || []).filter(trx => {
    const matchQ =
      !q ||
      (trx.nama_santri || '').toLowerCase().includes(q) ||
      (trx.nis || '').toLowerCase().includes(q) ||
      (trx.nomor_transaksi || '').toLowerCase().includes(q) ||
      (trx.kuitansi_nomor || '').toLowerCase().includes(q);
    const matchAsr = filterAsrama === 'Semua Asrama' ? true : (trx.nama_asrama || '').includes(filterAsrama);
    return matchQ && matchAsr;
  });

  const filteredKomponen = (data.komponenBiaya || []).filter(k => {
    const matchQ =
      !q ||
      (k.nama_komponen || '').toLowerCase().includes(q) ||
      (k.kode_komponen || '').toLowerCase().includes(q) ||
      (k.deskripsi || '').toLowerCase().includes(q);
    const matchKat = filterKategori === 'Semua Kategori' ? true : k.kategori === filterKategori;
    return matchQ && matchKat;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (Standar Master Produk / Master Santri) */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL TAGIHAN DITERBITKAN</div>
            <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
              {formatRupiah(data.summary?.total_nominal_tagihan)}
            </div>
          </div>
          <div className="stat-colored-icon-box">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">PEMBAYARAN TERVERIFIKASI</div>
            <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
              {formatRupiah(data.summary?.total_terbayar)}
            </div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">TOTAL SISA TUNGGAKAN</div>
            <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
              {formatRupiah(data.summary?.total_tunggakan)}
            </div>
          </div>
          <div className="stat-colored-icon-box">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">KOMPONEN BIAYA & METODE</div>
            <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
              {data.komponenBiaya?.length || 0} Item (QRIS/VA)
            </div>
          </div>
          <div className="stat-colored-icon-box">
            <QrCode size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <CreditCard size={22} className="page-title-icon" style={{ color: '#059669' }} />
          <div>
            <h2>Keuangan, Tagihan Santri & Pembayaran Digital (QRIS / VA)</h2>
            <p>Manajemen tagihan SPP bulanan, biaya awal masuk pesantren, master komponen biaya, dan kuitansi otomatis</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchRekap}
          >
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              handleResetKompForm();
              setIsKomponenModalOpen(true);
            }}
          >
            <FolderPlus size={14} color="#059669" /> Master Komponen Biaya
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddTagihan}
          >
            <Plus size={14} /> Buat Tagihan Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button
          className={`tab-btn ${activeTab === 'tagihan' ? 'active' : ''}`}
          onClick={() => setActiveTab('tagihan')}
        >
          <FileText size={14} /> Daftar Tagihan Santri ({data.semuaTagihan?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'tunggakan' ? 'active' : ''}`}
          onClick={() => setActiveTab('tunggakan')}
        >
          <AlertCircle size={14} /> Rekap Tunggakan Santri ({data.tunggakanSantri?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'transaksi' ? 'active' : ''}`}
          onClick={() => setActiveTab('transaksi')}
        >
          <QrCode size={14} /> Log Transaksi & Kuitansi ({data.transaksiTerakhir?.length || 0})
        </button>
        <button
          className={`tab-btn ${activeTab === 'komponen' ? 'active' : ''}`}
          onClick={() => setActiveTab('komponen')}
        >
          <Layers size={14} /> Master Komponen Biaya ({data.komponenBiaya?.length || 0})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari nama santri, NIS, kode tagihan, judul biaya, nomor kuitansi..."
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

        {(activeTab === 'tagihan' || activeTab === 'komponen') && (
          <select
            className="filter-select"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
          >
            <option value="Semua Kategori">Semua Kategori</option>
            <option value="Bulanan">Bulanan (SPP & Makan)</option>
            <option value="Biaya Masuk">Biaya Masuk</option>
            <option value="Tahunan">Tahunan</option>
            <option value="Insidental">Insidental</option>
          </select>
        )}

        {activeTab !== 'komponen' && (
          <select
            className="filter-select"
            value={filterAsrama}
            onChange={(e) => setFilterAsrama(e.target.value)}
          >
            <option value="Semua Asrama">Semua Asrama</option>
            {uniqueAsramas.map(asr => (
              <option key={asr} value={asr}>{asr}</option>
            ))}
          </select>
        )}

        {activeTab === 'tagihan' && (
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Semua Status">Semua Status</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Sebagian">Dicicil / Sebagian</option>
            <option value="Lunas">Lunas</option>
          </select>
        )}
      </div>

      {/* 5. DATA TABLE CARD */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block' }} />
            Memuat data keuangan & tagihan santri...
          </div>
        ) : activeTab === 'tagihan' ? (
          /* TAB 1: DAFTAR SEMUA TAGIHAN SANTRI */
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>KODE & JUDUL TAGIHAN</th>
                <th>NAMA SANTRI & NIS</th>
                <th className="td-center">KATEGORI</th>
                <th style={{ textAlign: 'right' }}>TOTAL TAGIHAN</th>
                <th style={{ textAlign: 'right' }}>TERBAYAR</th>
                <th style={{ textAlign: 'right' }}>SISA TAGIHAN</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredTagihan.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.judul_tagihan}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code style={{ color: '#0284c7', fontWeight: 700 }}>{item.kode_tagihan}</code>
                      {item.jatuh_tempo && (
                        <span>• Tempo: {new Date(item.jatuh_tempo).toLocaleDateString('id-ID')}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                      NIS: {item.nis} • {item.nama_asrama || 'Asrama'}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${item.kategori === 'Bulanan' ? 'badge-info' : item.kategori === 'Biaya Masuk' ? 'badge-purple' : 'badge-warning'}`}>
                      {item.kategori}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatRupiah(item.total_tagihan)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    {formatRupiah(item.sudah_dibayar)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: parseFloat(item.sisa_tagihan) > 0 ? '#dc2626' : '#64748b' }}>
                    {formatRupiah(item.sisa_tagihan)}
                  </td>
                  <td className="td-center">
                    <span className={`badge ${item.status === 'Lunas' ? 'badge-success' : item.status === 'Sebagian' ? 'badge-warning' : 'badge-danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-action btn-action-view"
                        onClick={() => openDetailTagihan(item)}
                        title="Lihat Detail Tagihan"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn-action btn-action-edit"
                        onClick={() => openEditTagihan(item)}
                        title="Edit Tagihan"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteTagihan(item)}
                        title="Hapus Tagihan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTagihan.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Tidak ada data tagihan santri yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : activeTab === 'tunggakan' ? (
          /* TAB 2: REKAP TUNGGAKAN SANTRI */
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th>ASRAMA & KOBONG</th>
                <th>WALI & KONTAK WA</th>
                <th style={{ textAlign: 'right' }}>TUNGGAKAN SPP BULANAN</th>
                <th style={{ textAlign: 'right' }}>SISA BIAYA MASUK</th>
                <th style={{ textAlign: 'right' }}>TOTAL KEWAJIBAN</th>
                <th className="td-center" style={{ width: '140px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredTunggakan.map((item, idx) => (
                <tr key={item.santri_id || idx}>
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
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{item.nama_kamar || 'Kamar 01'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.76rem' }}>{item.nama_wali || '-'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>{item.no_wa_wali || '-'}</div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                    {formatRupiah(item.tunggakan_bulanan)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                    {formatRupiah(item.tunggakan_biaya_masuk)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                    {formatRupiah(item.total_tunggakan)}
                  </td>
                  <td className="td-center">
                    <a
                      href={`https://wa.me/${(item.no_wa_wali || '').replace(/[^0-9]/g, '')}?text=Assalamu'alaikum%20Bpk/Ibu%20Wali%20Santri%20${encodeURIComponent(item.nama_santri)},%20informasi%20tagihan%20pesantren%20sebesar%20${encodeURIComponent(formatRupiah(item.total_tunggakan))}%20dapat%20dibayar%20via%20aplikasi%20Ruang%20Ponpes.`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}
                    >
                      <Send size={12} /> Tagih via WA
                    </a>
                  </td>
                </tr>
              ))}
              {filteredTunggakan.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Tidak ada data tunggakan santri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : activeTab === 'transaksi' ? (
          /* TAB 3: LOG TRANSAKSI & KUITANSI DIGITAL */
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>NOMOR TRANSAKSI</th>
                <th>NAMA SANTRI & NIS</th>
                <th className="td-center">METODE & CHANNEL</th>
                <th style={{ textAlign: 'right' }}>TOTAL BAYAR</th>
                <th className="td-center">STATUS</th>
                <th>NOMOR KUITANSI</th>
                <th>TANGGAL BAYAR</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransaksi.map((trx, idx) => (
                <tr key={trx.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', color: '#0f172a', fontWeight: 700, fontSize: '0.74rem' }}>
                      {trx.nomor_transaksi}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{trx.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {trx.nis}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${trx.metode_pembayaran === 'QRIS' ? 'badge-success' : 'badge-info'}`}>
                      {trx.channel_pembayaran || trx.metode_pembayaran}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    {formatRupiah(trx.total_bayar)}
                  </td>
                  <td className="td-center">
                    <span className={`badge ${trx.status_pembayaran === 'Berhasil' ? 'badge-success' : 'badge-warning'}`}>
                      {trx.status_pembayaran}
                    </span>
                  </td>
                  <td>
                    <code style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.76rem' }}>
                      {trx.kuitansi_nomor || '-'}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID') : '-'}
                  </td>
                </tr>
              ))}
              {filteredTransaksi.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada riwayat transaksi pembayaran.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* TAB 4: MASTER KOMPONEN BIAYA (Sama seperti Master Produk) */
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>KODE & NAMA KOMPONEN BIAYA</th>
                <th className="td-center">KATEGORI</th>
                <th style={{ textAlign: 'right' }}>NOMINAL DEFAULT</th>
                <th>DESKRIPSI & KETERANGAN</th>
                <th className="td-center" style={{ width: '110px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredKomponen.map((k, idx) => (
                <tr key={k.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{k.nama_komponen}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>
                      Kode: {k.kode_komponen || `KMP-0${k.id}`}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${k.kategori === 'Bulanan' ? 'badge-info' : k.kategori === 'Biaya Masuk' ? 'badge-purple' : 'badge-warning'}`}>
                      {k.kategori}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    {formatRupiah(k.nominal_default)}
                  </td>
                  <td style={{ color: '#475569', fontSize: '0.78rem' }}>
                    {k.deskripsi || '-'}
                  </td>
                  <td className="td-center">
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-action btn-action-edit"
                        onClick={() => handleStartEditKomp(k)}
                        title="Edit Komponen Biaya"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteKomponen(k)}
                        title="Hapus Komponen Biaya"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKomponen.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada master komponen biaya.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL TAGIHAN SANTRI                          */}
      {/* ==================================================== */}
      {isDetailOpen && selectedDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '560px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} />
                <span style={{ fontWeight: 800, fontSize: '0.96rem' }}>Rincian Tagihan Santri</span>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '5px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '18px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#0f172a', color: '#fff', padding: '14px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedDetail.nama_santri}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>NIS: {selectedDetail.nis} • {selectedDetail.nama_asrama || 'Asrama Pondok'}</div>
                </div>
                <span className={`badge ${selectedDetail.status === 'Lunas' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedDetail.status}
                </span>
              </div>

              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>JUDUL TAGIHAN</div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedDetail.judul_tagihan}</div>
                <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, marginTop: '4px' }}>
                  Kode: {selectedDetail.kode_tagihan} • Kategori: {selectedDetail.kategori}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TOTAL TAGIHAN</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{formatRupiah(selectedDetail.total_tagihan)}</div>
                </div>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>SUDAH DIBAYAR</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{formatRupiah(selectedDetail.sudah_dibayar)}</div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#b91c1c', fontWeight: 700 }}>SISA TAGIHAN</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{formatRupiah(selectedDetail.sisa_tagihan)}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setIsDetailOpen(false);
                  openEditTagihan(selectedDetail);
                }}
              >
                <Edit3 size={13} /> Edit Tagihan
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsDetailOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FULL-SCREEN / WIDE BUAT & EDIT TAGIHAN SANTRI  */}
      {/* ==================================================== */}
      {isModalOpen && (() => {
        const selectedSantriObj = santriList.find(s => String(s.id) === String(formTagihan.santri_id));
        const selectedKompObj = (data.komponenBiaya || []).find(k => String(k.id) === String(formTagihan.komponen_id));
        const isBulananKomp = !selectedKompObj || selectedKompObj.kategori === 'Bulanan';

        const filteredModalKomponen = (data.komponenBiaya || []).filter(k => {
          if (modalFilterTipe === 'Bulanan') return k.kategori === 'Bulanan';
          if (modalFilterTipe === 'Sekali Bayar') return k.kategori !== 'Bulanan';
          return true;
        });

        const totalNum = Math.max(0, parseFloat(formTagihan.total_tagihan) || 0);
        const dibayarNum =
          skemaBayar === 'lunas'
            ? totalNum
            : skemaBayar === 'belum'
            ? 0
            : Math.min(totalNum, Math.max(0, parseFloat(formTagihan.sudah_dibayar) || 0));
        const sisaNum = Math.max(0, totalNum - dibayarNum);
        const persenLunas = totalNum > 0 ? Math.min(100, Math.round((dibayarNum / totalNum) * 100)) : 0;

        const autoJudulPreview = selectedKompObj
          ? `${selectedKompObj.nama_komponen}${formTagihan.periode_bulan ? ` - ${formTagihan.periode_bulan}` : ''}`
          : (formTagihan.judul_tagihan || 'Pilih Komponen Biaya');

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '18px',
              width: '96vw',
              maxWidth: '1160px',
              minHeight: '82vh',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
              border: '1px solid #cbd5e1'
            }}>
              {/* Header Modal Fullscreen */}
              <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.01em' }}>
                      {formMode === 'add' ? 'Terbitkan Tagihan & Input Pembayaran Santri' : 'Kelola Tagihan & Pembayaran Cicilan Santri'}
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#d1fae5', marginTop: '2px' }}>
                      Mendukung tagihan rutin bulanan maupun biaya satu kali bayar (dapat dibayar lunas atau dicicil bertahap)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    fontSize: '0.78rem'
                  }}
                >
                  <X size={16} /> Tutup (ESC)
                </button>
              </div>

              {/* Body 2 Kolom Proporsional */}
              <form
                onSubmit={handleSimpanTagihan}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{
                  padding: '22px 24px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                  gap: '22px',
                  alignItems: 'start'
                }}>
                  {/* ==========================================================
                      KOLOM KIRI: DATA SANTRI, KATEGORI KOMPONEN & PERIODE
                  ========================================================== */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 1. Card Pilih Santri */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#0284c7', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>1</span>
                          Pilih Santri Penerima Tagihan *
                        </label>
                        {selectedSantriObj && (
                          <span className="badge badge-info">
                            NIS: {selectedSantriObj.nis}
                          </span>
                        )}
                      </div>

                      <SearchableSelect
                        options={santriList.map(s => ({
                          value: s.id,
                          label: s.nama_santri,
                          sublabel: `NIS: ${s.nis} • ${s.nama_asrama || 'Asrama'}`
                        }))}
                        value={formTagihan.santri_id}
                        onChange={(val) => setFormTagihan({ ...formTagihan, santri_id: val })}
                        placeholder="-- Pilih atau cari nama / NIS santri --"
                        searchPlaceholder="Ketik nama atau NIS santri..."
                      />

                      {selectedSantriObj && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          borderRadius: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0369a1' }}>
                              {selectedSantriObj.nama_santri}
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#475569' }}>
                              {selectedSantriObj.nama_asrama || 'Asrama Pondok'} • {selectedSantriObj.nama_kamar || 'Kobong'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                            Wali: {selectedSantriObj.nama_wali || '-'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Card Pilih Komponen Biaya (Bulanan vs Satu Kali Bayar) */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ background: '#0284c7', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>2</span>
                          Pilih Komponen Biaya *
                        </label>

                        {/* Filter Tipe Komponen: Semua / Bulanan / Satu Kali Bayar */}
                        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                          {[
                            { id: 'Semua', label: 'Semua' },
                            { id: 'Bulanan', label: 'Bulanan' },
                            { id: 'Sekali Bayar', label: 'Satu Kali Bayar' }
                          ].map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setModalFilterTipe(t.id)}
                              style={{
                                border: 'none',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: modalFilterTipe === t.id ? '#0284c7' : 'transparent',
                                color: modalFilterTipe === t.id ? '#ffffff' : '#64748b'
                              }}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grid Kartu Pilihan Komponen Biaya */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: '10px',
                        maxHeight: '240px',
                        overflowY: 'auto',
                        padding: '2px'
                      }}>
                        {filteredModalKomponen.map(k => {
                          const isSelected = String(formTagihan.komponen_id) === String(k.id);
                          const isBulan = k.kategori === 'Bulanan';
                          return (
                            <div
                              key={k.id}
                              onClick={() => {
                                const nextPeriode = isBulan
                                  ? (formTagihan.periode_bulan.includes('Satu Kali') ? 'November 2026' : formTagihan.periode_bulan || 'November 2026')
                                  : 'TA 2026/2027 (Satu Kali Bayar)';
                                const nextTotal = String(parseFloat(k.nominal_default || 0));
                                setFormTagihan({
                                  ...formTagihan,
                                  komponen_id: String(k.id),
                                  total_tagihan: nextTotal,
                                  sudah_dibayar: skemaBayar === 'lunas' ? nextTotal : formTagihan.sudah_dibayar,
                                  periode_bulan: nextPeriode,
                                  judul_tagihan: `${k.nama_komponen} - ${nextPeriode}`
                                });
                              }}
                              style={{
                                padding: '12px',
                                borderRadius: '10px',
                                border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                                background: isSelected ? '#ecfdf5' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '6px'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    background: isBulan ? '#e0f2fe' : '#f3e8ff',
                                    color: isBulan ? '#0369a1' : '#7e22ce'
                                  }}>
                                    {isBulan ? 'RUTIN BULANAN' : `SATU KALI BAYAR (${k.kategori.toUpperCase()})`}
                                  </span>
                                  {isSelected && <CheckCircle2 size={15} color="#059669" />}
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', marginTop: '6px', lineHeight: 1.3 }}>
                                  {k.nama_komponen}
                                </div>
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#059669' }}>
                                {formatRupiah(k.nominal_default)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Card Periode & Tanggal Jatuh Tempo (Tanpa Input Judul Tagihan Manual) */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ background: '#0284c7', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>3</span>
                        Periode Tagihan & Jatuh Tempo
                      </label>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                            {isBulananKomp ? 'Periode Bulan Tagihan' : 'Periode / Tahun Ajaran (Satu Kali Bayar)'}
                          </label>
                          {isBulananKomp ? (
                            <select
                              value={formTagihan.periode_bulan}
                              onChange={(e) => setFormTagihan({ ...formTagihan, periode_bulan: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}
                            >
                              {[
                                'Juli 2026', 'Agustus 2026', 'September 2026', 'Oktober 2026',
                                'November 2026', 'Desember 2026', 'Januari 2027', 'Februari 2027',
                                'Maret 2027', 'April 2027', 'Mei 2027', 'Juni 2027'
                              ].map(bln => (
                                <option key={bln} value={bln}>{bln}</option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={formTagihan.periode_bulan}
                              onChange={(e) => setFormTagihan({ ...formTagihan, periode_bulan: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}
                            >
                              <option value="TA 2026/2027 (Satu Kali Bayar)">TA 2026/2027 (Satu Kali Bayar)</option>
                              <option value="TA 2025/2026 (Satu Kali Bayar)">TA 2025/2026 (Satu Kali Bayar)</option>
                              <option value="Semester Ganjil 2026/2027">Semester Ganjil 2026/2027</option>
                              <option value="Semester Genap 2026/2027">Semester Genap 2026/2027</option>
                            </select>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                            Batas Jatuh Tempo
                          </label>
                          <input
                            type="date"
                            value={formTagihan.jatuh_tempo}
                            onChange={(e) => setFormTagihan({ ...formTagihan, jatuh_tempo: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box', fontWeight: 600 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==========================================================
                      KOLOM KANAN: NOMINAL, SKEMA CICILAN / LUNAS & KALKULASI
                  ========================================================== */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* 4. Nominal Total Tagihan */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ background: '#059669', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>4</span>
                        Total Nominal Tagihan (Rp) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontWeight: 800,
                          color: '#64748b',
                          fontSize: '0.95rem'
                        }}>
                          Rp
                        </span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="any"
                          value={formTagihan.total_tagihan}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormTagihan({
                              ...formTagihan,
                              total_tagihan: val,
                              sudah_dibayar: skemaBayar === 'lunas' ? val : formTagihan.sudah_dibayar
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                        Nominal otomatis mengikuti komponen biaya terpilih, dapat disesuaikan bila ada potongan/beasiswa.
                      </div>
                    </div>

                    {/* 5. Skema Pembayaran: Belum Bayar / Dicicil / Langsung Lunas */}
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ background: '#059669', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>5</span>
                        Skema Pembayaran (Bisa Dicicil / Angsuran)
                      </label>
                      <p style={{ fontSize: '0.73rem', color: '#64748b', margin: '0 0 12px' }}>
                        Baik tagihan <strong>Bulanan</strong> maupun <strong>Satu Kali Bayar</strong> dapat diterbitkan belum bayar, dicicil bertahap, atau langsung lunas.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: skemaBayar !== 'belum' ? '14px' : 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSkemaBayar('belum');
                            setFormTagihan({ ...formTagihan, sudah_dibayar: '0' });
                          }}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '10px',
                            border: skemaBayar === 'belum' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                            background: skemaBayar === 'belum' ? '#fef2f2' : '#ffffff',
                            color: skemaBayar === 'belum' ? '#b91c1c' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div>⏳ Belum Bayar</div>
                          <div style={{ fontSize: '0.66rem', fontWeight: 600, opacity: 0.85, marginTop: '2px' }}>Terbitkan Tagihan</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSkemaBayar('cicil');
                            const cur = parseFloat(formTagihan.sudah_dibayar || 0);
                            if (cur <= 0 || cur >= totalNum) {
                              setFormTagihan({ ...formTagihan, sudah_dibayar: String(Math.round(totalNum * 0.5)) });
                            }
                          }}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '10px',
                            border: skemaBayar === 'cicil' ? '2px solid #d97706' : '1px solid #cbd5e1',
                            background: skemaBayar === 'cicil' ? '#fffbeb' : '#ffffff',
                            color: skemaBayar === 'cicil' ? '#b45309' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div>💳 Bayar Cicilan</div>
                          <div style={{ fontSize: '0.66rem', fontWeight: 600, opacity: 0.85, marginTop: '2px' }}>DP / Angsuran</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSkemaBayar('lunas');
                            setFormTagihan({ ...formTagihan, sudah_dibayar: String(totalNum) });
                          }}
                          style={{
                            padding: '12px 10px',
                            borderRadius: '10px',
                            border: skemaBayar === 'lunas' ? '2px solid #059669' : '1px solid #cbd5e1',
                            background: skemaBayar === 'lunas' ? '#ecfdf5' : '#ffffff',
                            color: skemaBayar === 'lunas' ? '#047857' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          <div>✅ Langsung Lunas</div>
                          <div style={{ fontSize: '0.66rem', fontWeight: 600, opacity: 0.85, marginTop: '2px' }}>Bayar Penuh 100%</div>
                        </button>
                      </div>

                      {/* Input Nominal Cicilan & Metode Pembayaran */}
                      {skemaBayar === 'cicil' && (
                        <div style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '10px',
                          padding: '14px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#92400e' }}>
                              Nominal Sudah Dibayar / Cicilan Masuk (Rp) *
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {[
                                { label: '25%', pct: 0.25 },
                                { label: '50%', pct: 0.5 },
                                { label: '75%', pct: 0.75 }
                              ].map(btn => (
                                <button
                                  key={btn.label}
                                  type="button"
                                  onClick={() => setFormTagihan({ ...formTagihan, sudah_dibayar: String(Math.round(totalNum * btn.pct)) })}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid #f59e0b',
                                    color: '#b45309',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cicil {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            type="number"
                            min="0"
                            max={totalNum}
                            step="any"
                            value={formTagihan.sudah_dibayar}
                            onChange={(e) => setFormTagihan({ ...formTagihan, sudah_dibayar: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: '1.5px solid #f59e0b',
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: '#92400e',
                              background: '#ffffff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      )}

                      {skemaBayar !== 'belum' && (
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                            Metode Penerimaan Pembayaran
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {['Tunai / Kasir', 'Transfer Bank (VA)', 'QRIS Pesantren'].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setMetodeBayarForm(m)}
                                style={{
                                  padding: '8px',
                                  borderRadius: '8px',
                                  border: metodeBayarForm === m ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                                  background: metodeBayarForm === m ? '#e0f2fe' : '#ffffff',
                                  color: metodeBayarForm === m ? '#0369a1' : '#475569',
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 6. Kartu Ringkasan Tagihan & Kalkulasi Sisa Cicilan */}
                    <div style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '18px',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                            RINGKASAN TAGIHAN OTOMATIS
                          </div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                            {autoJudulPreview}
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: sisaNum <= 0 && totalNum > 0 ? '#10b981' : dibayarNum > 0 ? '#f59e0b' : '#ef4444',
                          color: '#ffffff'
                        }}>
                          {sisaNum <= 0 && totalNum > 0 ? 'LUNAS' : dibayarNum > 0 ? `CICILAN (${persenLunas}%)` : 'BELUM DIBAYAR'}
                        </span>
                      </div>

                      {/* Progress Bar Pelunasan */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                        <div style={{
                          width: `${persenLunas}%`,
                          height: '100%',
                          background: persenLunas >= 100 ? '#10b981' : '#38bdf8',
                          transition: 'width 0.25s ease'
                        }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total Tagihan</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                            {formatRupiah(totalNum)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sudah Dibayar / Dicicil</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                            {formatRupiah(dibayarNum)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sisa Tagihan / Cicilan</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: sisaNum > 0 ? '#f87171' : '#34d399', marginTop: '2px' }}>
                            {formatRupiah(sisaNum)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div style={{
                  padding: '14px 24px',
                  background: '#ffffff',
                  borderTop: '1px solid #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Kategori: <strong style={{ color: '#0f172a' }}>{selectedKompObj?.kategori || '-'}</strong> • Judul Tagihan dibuat otomatis dari komponen & periode.
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setIsModalOpen(false)}
                      style={{ padding: '9px 18px', fontSize: '0.82rem' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary"
                      style={{
                        padding: '9px 22px',
                        fontSize: '0.84rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        border: 'none'
                      }}
                    >
                      <Save size={15} />
                      {submitting
                        ? 'Menyimpan...'
                        : formMode === 'add'
                        ? (dibayarNum > 0 ? 'Terbitkan & Simpan Pembayaran' : 'Terbitkan Tagihan Santri')
                        : 'Simpan Perubahan & Cicilan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* MODAL KELOLA MASTER KOMPONEN BIAYA                   */}
      {/* ==================================================== */}
      {isKomponenModalOpen && (
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
            maxWidth: '580px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
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
                <Layers size={18} />
                <span style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                  Kelola Master Komponen Biaya Pesantren
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsKomponenModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSimpanKomponen} style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nama Komponen Biaya *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SPP & Makan Bulanan"
                    value={formKomponen.nama_komponen}
                    onChange={(e) => setFormKomponen({ ...formKomponen, nama_komponen: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Kategori *
                  </label>
                  <select
                    value={formKomponen.kategori}
                    onChange={(e) => setFormKomponen({ ...formKomponen, kategori: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  >
                    <option value="Bulanan">Bulanan</option>
                    <option value="Biaya Masuk">Biaya Masuk</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Insidental">Insidental</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Nominal Default (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={formKomponen.nominal_default}
                    onChange={(e) => setFormKomponen({ ...formKomponen, nominal_default: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Deskripsi singkat komponen biaya (opsional)..."
                  value={formKomponen.deskripsi}
                  onChange={(e) => setFormKomponen({ ...formKomponen, deskripsi: e.target.value })}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
                {editingKompId && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleResetKompForm}
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingKomp}
                  className="btn btn-primary"
                >
                  <Save size={14} />
                  {savingKomp ? 'Menyimpan...' : editingKompId ? 'Update' : 'Tambah'}
                </button>
              </div>
            </form>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>
                DAFTAR KOMPONEN BIAYA TERDAFTAR ({data.komponenBiaya?.length || 0})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data.komponenBiaya || []).map(k => (
                  <div
                    key={k.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: editingKompId === k.id ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                      background: editingKompId === k.id ? '#f0f9ff' : '#ffffff'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                        {k.nama_komponen}{' '}
                        <span className="badge badge-info" style={{ marginLeft: '6px' }}>{k.kategori}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                        {formatRupiah(k.nominal_default)} <span style={{ color: '#64748b', fontWeight: 400 }}>• {k.deskripsi || '-'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-action btn-action-edit"
                        onClick={() => handleStartEditKomp(k)}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-action-delete"
                        onClick={() => handleDeleteKomponen(k)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
