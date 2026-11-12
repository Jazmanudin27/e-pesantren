import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Sparkles,
  Calendar,
  Building,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  ShieldCheck,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Plus,
  Save,
  Check
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../../utils/alert.util';

const NAMA_BULAN = [
  { id: '1', name: 'Januari' },
  { id: '2', name: 'Februari' },
  { id: '3', name: 'Maret' },
  { id: '4', name: 'April' },
  { id: '5', name: 'Mei' },
  { id: '6', name: 'Juni' },
  { id: '7', name: 'Juli' },
  { id: '8', name: 'Agustus' },
  { id: '9', name: 'September' },
  { id: '10', name: 'Oktober' },
  { id: '11', name: 'November' },
  { id: '12', name: 'Desember' }
];

export default function ModalGenerateTagihan({
  isOpen,
  onClose,
  onGenerated,
  initialSekolah = '',
  targetSantri = null
}) {
  const [activeTab, setActiveTab] = useState('awal_masuk'); // 'awal_masuk' | 'spp_rutin'
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Tab 1: Biaya Awal Masuk State
  const [jenjangMasuk, setJenjangMasuk] = useState('SMP'); // 'SMP' | 'SMA' | 'SMK' | 'SEMUA'
  const [kategoriMasuk, setKategoriMasuk] = useState('semua'); // 'semua' | 'sekolah' | 'pesantren'
  const [modePaketMasuk, setModePaketMasuk] = useState('rincian'); // 'rincian' (default per item detail) | 'paket' | 'total'
  const [scopeSantri, setScopeSantri] = useState(targetSantri ? 'single' : 'semua'); // 'single' | 'semua'
  const [showItemBreakdown, setShowItemBreakdown] = useState(true);

  // Live Database Items State (Per Jenjang)
  const [liveDbItems, setLiveDbItems] = useState([]);

  // State Edit Item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({ uraian: '', biaya: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // State Tambah Item Baru
  const [addingKategori, setAddingKategori] = useState(null); // 'Adm Sekolah' | 'Adm Pesantren' | null
  const [addForm, setAddForm] = useState({ uraian: '', biaya: '' });
  const [savingAdd, setSavingAdd] = useState(false);

  // Tab 2: SPP Bulanan State
  const [sekolahSpp, setSekolahSpp] = useState(initialSekolah || '');
  const [modeSpp, setModeSpp] = useState('single');
  const now = new Date();
  const [bulanMulai, setBulanMulai] = useState(String(now.getMonth() + 1));
  const [tahunMulai, setTahunMulai] = useState(String(now.getFullYear()));
  const [bulanSelesai, setBulanSelesai] = useState('6');
  const [tahunSelesai, setTahunSelesai] = useState(String(now.getFullYear() + 1));
  const [komponenList, setKomponenList] = useState([]);
  const [selectedKomponenId, setSelectedKomponenId] = useState('');

  // Sync initialSekolah & targetSantri
  useEffect(() => {
    if (targetSantri) {
      setScopeSantri('single');
      const sk = String(targetSantri.nama_sekolah || '').toUpperCase();
      if (sk.includes('SMA')) setJenjangMasuk('SMA');
      else if (sk.includes('SMK')) setJenjangMasuk('SMK');
      else setJenjangMasuk('SMP');
    } else if (initialSekolah && initialSekolah !== 'semua') {
      setJenjangMasuk(initialSekolah);
      setSekolahSpp(initialSekolah);
      setScopeSantri('semua');
    }
  }, [initialSekolah, targetSantri, isOpen]);

  // Fetch Live Rincian Biaya dari Database
  const fetchLiveRincian = async () => {
    try {
      setLoadingItems(true);
      const res = await axios.get('/api/sekolah/rincian-biaya');
      if (res.data?.success && res.data.data?.items) {
        setLiveDbItems(res.data.data.items);
      }
    } catch (e) {
      console.warn('Gagal memuat live rincian biaya:', e.message);
    } finally {
      setLoadingItems(false);
    }
  };

  // Load Initial Data
  useEffect(() => {
    if (!isOpen) return;
    fetchLiveRincian();

    const fetchKomponen = async () => {
      try {
        const res = await axios.get('/api/keuangan/admin/rekap');
        if (res.data?.success && res.data.data?.komponenBiaya) {
          const list = res.data.data.komponenBiaya;
          setKomponenList(list);
          const defaultKomp = list.find((k) => k.kategori === 'Bulanan') || list[0];
          if (defaultKomp && !selectedKomponenId) {
            setSelectedKomponenId(String(defaultKomp.id));
          }
        }
      } catch (e) {
        console.warn('Gagal load komponen biaya:', e.message);
      }
    };
    fetchKomponen();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatAngkaTitik = (val) => {
    const num = Math.round(Math.abs(Number(val) || 0));
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatRp = (num) => `Rp ${formatAngkaTitik(num)}`;

  const formatNumberInput = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return String(parseInt(clean, 10)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseNumberInput = (str) => {
    if (!str) return 0;
    const clean = String(str).replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Filter Items sesuai Jenjang yang dipilih
  const currentTargetJenjang = jenjangMasuk === 'SEMUA' ? 'SMP' : jenjangMasuk;
  const filteredItems = liveDbItems.filter((i) => i.jenjang === currentTargetJenjang);

  const admSekolahItems = filteredItems.filter((i) => i.kategori_komponen === 'Adm Sekolah');
  const admPesantrenItems = filteredItems.filter((i) => i.kategori_komponen === 'Adm Pesantren');

  const totalAdmSekolah = admSekolahItems.reduce((acc, i) => acc + (parseFloat(i.biaya) || 0), 0);
  const totalAdmPesantren = admPesantrenItems.reduce((acc, i) => acc + (parseFloat(i.biaya) || 0), 0);
  const grandTotalMasuk =
    kategoriMasuk === 'sekolah'
      ? totalAdmSekolah
      : kategoriMasuk === 'pesantren'
      ? totalAdmPesantren
      : totalAdmSekolah + totalAdmPesantren;

  // 1. Simpan Tambah Item Baru
  const handleSaveAdd = async (kategori) => {
    if (!addForm.uraian.trim()) {
      showError('Uraian Kosong', 'Silakan masukkan nama uraian item.');
      return;
    }
    const biayaNum = parseNumberInput(addForm.biaya);
    if (biayaNum <= 0) {
      showError('Biaya Tidak Valid', 'Masukkan nominal biaya lebih dari Rp 0.');
      return;
    }

    try {
      setSavingAdd(true);
      const res = await axios.post('/api/sekolah/rincian-biaya', {
        jenjang: currentTargetJenjang,
        kategori_komponen: kategori,
        uraian: addForm.uraian.trim(),
        biaya: biayaNum
      });

      if (res.data?.success) {
        toastSuccess('Item Ditambahkan!', `"${addForm.uraian}" berhasil disimpan ke database.`);
        setAddForm({ uraian: '', biaya: '' });
        setAddingKategori(null);
        await fetchLiveRincian();
        if (onGenerated) onGenerated();
      }
    } catch (err) {
      showError('Gagal Tambah Item', err.response?.data?.message || err.message);
    } finally {
      setSavingAdd(false);
    }
  };

  // 2. Simpan Edit Item
  const handleSaveEdit = async (item) => {
    if (!editForm.uraian.trim()) {
      showError('Uraian Kosong', 'Nama uraian tidak boleh kosong.');
      return;
    }
    try {
      setSavingEdit(true);
      const res = await axios.put(`/api/sekolah/rincian-biaya/${item.id}`, {
        uraian: editForm.uraian.trim(),
        biaya: parseNumberInput(editForm.biaya),
        kategori_komponen: item.kategori_komponen
      });

      if (res.data?.success) {
        toastSuccess('Item Diperbarui!', `Perubahan pada "${editForm.uraian}" disimpan ke database.`);
        setEditingItemId(null);
        await fetchLiveRincian();
        if (onGenerated) onGenerated();
      }
    } catch (err) {
      showError('Gagal Simpan Perubahan', err.response?.data?.message || err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // 3. Hapus Item
  const handleDeleteItem = async (item) => {
    const ok = await showConfirm(
      'Konfirmasi Hapus Item',
      `Hapus item "${item.uraian}" (${formatRp(item.biaya)}) dari database ${item.jenjang}?`,
      'Ya, Hapus Item',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/sekolah/rincian-biaya/${item.id}`);
      if (res.data?.success) {
        toastSuccess('Item Dihapus!', res.data.message || 'Item berhasil dihapus dari database.');
        await fetchLiveRincian();
        if (onGenerated) onGenerated();
      }
    } catch (err) {
      showError('Gagal Hapus Item', err.response?.data?.message || err.message);
    }
  };

  // 4. Generate Tagihan Awal Masuk ke Database
  const handleGenerateAwalMasuk = async (e) => {
    e?.preventDefault();
    const isSingle = scopeSantri === 'single' && targetSantri;
    const targetLabel = isSingle
      ? `Santri ${targetSantri.nama_santri} (${jenjangMasuk})`
      : jenjangMasuk === 'SEMUA'
      ? 'Seluruh Santri (SMP, SMA, SMK)'
      : `Seluruh Santri Jenjang ${jenjangMasuk}`;
    const katLabel =
      kategoriMasuk === 'sekolah'
        ? 'ADM SEKOLAH'
        : kategoriMasuk === 'pesantren'
        ? 'ADM PESANTREN'
        : 'ADM SEKOLAH & PESANTREN';
    const nominalLabel =
      !isSingle && jenjangMasuk === 'SEMUA'
        ? 'sesuai data rincian database tiap sekolah'
        : formatRp(grandTotalMasuk);

    const ok = await showConfirm(
      'Konfirmasi Simpan Tagihan ke Database',
      `Terbitkan Tagihan ${katLabel} 2026/2027 untuk ${targetLabel} (${nominalLabel})?\n\nTagihan akan langsung disimpan ke database keuangan_tagihan.`,
      'Ya, Simpan ke Database',
      'Batal'
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await axios.post('/api/sekolah/generate-tagihan-masuk', {
        jenjang: jenjangMasuk,
        tahun_ajaran: '2026/2027',
        mode: 'rincian',
        kategori: kategoriMasuk,
        santri_id: isSingle ? targetSantri.id : undefined
      });

      if (res.data?.success) {
        toastSuccess('Berhasil!', res.data.message || 'Tagihan awal masuk berhasil disimpan ke database.');
        if (onGenerated) onGenerated();
        onClose();
      } else {
        showError('Gagal', res.data?.message || 'Gagal menyimpan tagihan.');
      }
    } catch (err) {
      showError('Gagal Simpan Tagihan', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Generate SPP Bulanan ke Database
  const handleGenerateSpp = async (e) => {
    e?.preventDefault();
    const bulananKomp = komponenList.find((k) => k.kategori === 'Bulanan' || (k.nama_komponen && k.nama_komponen.toLowerCase().includes('spp'))) || komponenList[0];
    const targetKompId = selectedKomponenId || (bulananKomp ? String(bulananKomp.id) : '');

    const namaBulanMulai = NAMA_BULAN.find((b) => b.id === String(bulanMulai))?.name || bulanMulai;
    const namaBulanSelesai = NAMA_BULAN.find((b) => b.id === String(bulanSelesai))?.name || bulanSelesai;
    const periodeLabel =
      modeSpp === 'single'
        ? `${namaBulanMulai} ${tahunMulai}`
        : `${namaBulanMulai} ${tahunMulai} s/d ${namaBulanSelesai} ${tahunSelesai}`;

    const ok = await showConfirm(
      'Konfirmasi Terbitkan SPP',
      `Terbitkan tagihan SPP untuk santri ${sekolahSpp ? `Sekolah ${sekolahSpp}` : 'Semua Sekolah'} periode ${periodeLabel}?\n\nTagihan akan langsung disimpan ke database.`,
      'Ya, Simpan ke Database',
      'Batal'
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await axios.post('/api/keuangan/admin/generate-auto', {
        komponen_id: targetKompId ? parseInt(targetKompId) : null,
        mode_generasi: modeSpp,
        bulan_mulai: parseInt(bulanMulai),
        tahun_mulai: parseInt(tahunMulai),
        bulan_selesai: parseInt(bulanSelesai),
        tahun_selesai: parseInt(tahunSelesai),
        filter_sekolah: sekolahSpp,
        filter_kamar: ''
      });

      if (res.data?.success) {
        toastSuccess('Berhasil!', res.data.message || 'Tagihan SPP berhasil disimpan ke database.');
        if (onGenerated) onGenerated();
        onClose();
      } else {
        showError('Gagal', res.data?.message || 'Gagal generate tagihan SPP.');
      }
    } catch (err) {
      showError('Gagal Generate', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '540px',
          height: '100dvh',
          maxHeight: '100dvh',
          borderRadius: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpModal 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0d766e 60%, #059669 100%)',
          padding: '13px 16px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={16} color="#a7f3d0" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.86rem', lineHeight: 1.2 }}>
                Kelola & Generate Tagihan Sekolah
              </div>
              <div style={{ fontSize: '0.62rem', color: '#a7f3d0' }}>
                Bisa edit, tambah & hapus item rincian masuk langsung di database
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Switcher: Awal Masuk vs SPP Bulanan */}
        <div style={{ padding: '10px 14px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('awal_masuk')}
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.7rem',
                cursor: 'pointer',
                background: activeTab === 'awal_masuk' ? '#ffffff' : 'transparent',
                color: activeTab === 'awal_masuk' ? '#065f46' : '#64748b',
                boxShadow: activeTab === 'awal_masuk' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📄 Rincian Awal Masuk
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('spp_rutin')}
              style={{
                padding: '7px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.7rem',
                cursor: 'pointer',
                background: activeTab === 'spp_rutin' ? '#ffffff' : 'transparent',
                color: activeTab === 'spp_rutin' ? '#0369a1' : '#64748b',
                boxShadow: activeTab === 'spp_rutin' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📅 SPP Bulanan Rutin
            </button>
          </div>
        </div>

        {/* TAB 1: RINCIAN AWAL MASUK (INTERAKTIF: EDIT, TAMBAH, HAPUS DATABASE) */}
        {activeTab === 'awal_masuk' && (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
            
            {/* Target Penerima Tagihan (Khusus Santri Terpilih vs Semua Santri) */}
            {targetSantri && (
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '8px 10px'
              }}>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#0f172a', marginBottom: '5px' }}>
                  Target Penerima Tagihan:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setScopeSantri('single')}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: scopeSantri === 'single' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: scopeSantri === 'single' ? '#ecfdf5' : '#ffffff',
                      color: scopeSantri === 'single' ? '#065f46' : '#64748b',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>👤 Khusus Santri Ini:</div>
                    <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {targetSantri.nama_santri}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeSantri('semua')}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '8px',
                      border: scopeSantri === 'semua' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: scopeSantri === 'semua' ? '#ecfdf5' : '#ffffff',
                      color: scopeSantri === 'semua' ? '#065f46' : '#64748b',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>👥 Seluruh Santri:</div>
                    <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      Jenjang {jenjangMasuk}
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Pilihan Jenjang Sekolah */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a' }}>
                  1. Pilih Jenjang Sekolah:
                </span>
                {loadingItems && (
                  <span style={{ fontSize: '0.62rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <RotateCw size={10} className="animate-spin" /> Memuat data...
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {[
                  { id: 'SMP', label: 'SMP' },
                  { id: 'SMA', label: 'SMA' },
                  { id: 'SMK', label: 'SMK' },
                  { id: 'SEMUA', label: 'Semua' }
                ].map((j) => {
                  const active = jenjangMasuk === j.id;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => {
                        setJenjangMasuk(j.id);
                        setEditingItemId(null);
                        setAddingKategori(null);
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '10px',
                        border: active ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: active ? '#ecfdf5' : '#ffffff',
                        color: active ? '#065f46' : '#475569',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: active ? '0 3px 8px rgba(5, 150, 105, 0.2)' : 'none'
                      }}
                    >
                      {j.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Filter Kategori Biaya (Sekolah vs Pesantren) */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', marginBottom: '5px' }}>
                2. Filter Kategori Biaya:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                {[
                  { id: 'semua', label: 'Semua Kategori', sub: 'Sekolah & Ponpes', color: '#059669', bg: '#ecfdf5' },
                  { id: 'sekolah', label: 'Adm Sekolah', sub: 'Gedung, Kaos, dll', color: '#7e22ce', bg: '#faf5ff' },
                  { id: 'pesantren', label: 'Adm Pesantren', sub: 'Infaq, Dapur, dll', color: '#0284c7', bg: '#f0f9ff' }
                ].map((k) => {
                  const active = kategoriMasuk === k.id;
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => {
                        setKategoriMasuk(k.id);
                        setEditingItemId(null);
                        setAddingKategori(null);
                      }}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '10px',
                        border: active ? `2px solid ${k.color}` : '1px solid #cbd5e1',
                        background: active ? k.bg : '#ffffff',
                        color: active ? k.color : '#475569',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: active ? `0 3px 8px ${k.color}25` : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.66rem', fontWeight: 800 }}>{k.label}</div>
                      <div style={{ fontSize: '0.54rem', fontWeight: 600, opacity: 0.8, marginTop: '1px' }}>{k.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tabel Rincian Interaktif dengan Kemampuan Tambah, Edit, Hapus */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
              
              {/* Top Banner Tabel */}
              <div style={{
                padding: '8px 12px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.7rem', color: '#0f172a' }}>
                    RINCIAN AWAL MASUK 2026/2027 ({currentTargetJenjang})
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#64748b' }}>
                    Data tersimpan langsung di tabel <code>sekolah_rincian_biaya</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowItemBreakdown(!showItemBreakdown)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.64rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <span>{showItemBreakdown ? 'Tutup Rincian' : 'Buka Rincian'}</span>
                  {showItemBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Kotak Subtotal Otomatis Sesuai Filter Kategori */}
              <div style={{ padding: '8px 10px', display: 'grid', gridTemplateColumns: kategoriMasuk === 'semua' ? 'repeat(2, 1fr)' : '1fr', gap: '6px', background: '#f1f5f9' }}>
                {(kategoriMasuk === 'semua' || kategoriMasuk === 'sekolah') && (
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.56rem', fontWeight: 800, color: '#7e22ce' }}>ADM SEKOLAH</div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#6b21a8' }}>{formatRp(totalAdmSekolah)}</div>
                  </div>
                )}
                {(kategoriMasuk === 'semua' || kategoriMasuk === 'pesantren') && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.56rem', fontWeight: 800, color: '#15803d' }}>ADM PESANTREN</div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#14532d' }}>{formatRp(totalAdmPesantren)}</div>
                  </div>
                )}
              </div>

              {/* List Detail Items dengan Tombol Edit, Tambah & Hapus */}
              {showItemBreakdown && (
                <div style={{ maxHeight: '260px', overflowY: 'auto', padding: '8px 10px' }}>
                  
                  {/* SEKSI 1: ADM SEKOLAH */}
                  {(kategoriMasuk === 'semua' || kategoriMasuk === 'sekolah') && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#faf5ff',
                      padding: '5px 8px',
                      borderRadius: '7px',
                      marginBottom: '5px'
                    }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#7e22ce' }}>
                        1. Adm Sekolah ({admSekolahItems.length} Item)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingKategori(addingKategori === 'Adm Sekolah' ? null : 'Adm Sekolah');
                          setAddForm({ uraian: '', biaya: '' });
                        }}
                        style={{
                          background: '#7e22ce',
                          color: '#ffffff',
                          border: 'none',
                          padding: '3px 7px',
                          borderRadius: '5px',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Plus size={10} /> {addingKategori === 'Adm Sekolah' ? 'Batal' : '+ Tambah Item'}
                      </button>
                    </div>

                    {/* Form Tambah Item Adm Sekolah (Biaya di bawah Nama Item) */}
                    {addingKategori === 'Adm Sekolah' && (
                      <div style={{ background: '#f5f3ff', border: '1.5px dashed #c084fc', borderRadius: '8px', padding: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7e22ce' }}>
                          Tambah Item Baru di Adm Sekolah:
                        </div>
                        <input
                          type="text"
                          placeholder="Nama Item (cth: Seragam)"
                          value={addForm.uraian}
                          onChange={(e) => setAddForm({ ...addForm, uraian: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.68rem', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Biaya (Rp)"
                            value={formatNumberInput(addForm.biaya)}
                            onChange={(e) => setAddForm({ ...addForm, biaya: e.target.value.replace(/\D/g, '') })}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 700, boxSizing: 'border-box' }}
                          />
                          <button
                            type="button"
                            disabled={savingAdd}
                            onClick={() => handleSaveAdd('Adm Sekolah')}
                            style={{ background: '#7e22ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                          >
                            {savingAdd ? '...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List Items Adm Sekolah */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {admSekolahItems.map((item) => {
                        const isEditing = editingItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              background: isEditing ? '#fef3c7' : '#ffffff',
                              border: isEditing ? '1px solid #f59e0b' : '1px solid #f1f5f9',
                              fontSize: '0.66rem'
                            }}
                          >
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                                <input
                                  type="text"
                                  value={editForm.uraian}
                                  onChange={(e) => setEditForm({ ...editForm, uraian: e.target.value })}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.66rem', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumberInput(editForm.biaya)}
                                    onChange={(e) => setEditForm({ ...editForm, biaya: e.target.value.replace(/\D/g, '') })}
                                    style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.66rem', fontWeight: 700, boxSizing: 'border-box' }}
                                  />
                                  <button
                                    type="button"
                                    disabled={savingEdit}
                                    onClick={() => handleSaveEdit(item)}
                                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span style={{ color: '#334155', fontWeight: 600 }}>• {item.uraian}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRp(item.biaya)}</span>
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditForm({ uraian: item.uraian, biaya: String(item.biaya) });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '2px' }}
                                      title="Edit Item"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                      title="Hapus Item"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}

                  {/* SEKSI 2: ADM PESANTREN */}
                  {(kategoriMasuk === 'semua' || kategoriMasuk === 'pesantren') && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      padding: '5px 8px',
                      borderRadius: '7px',
                      marginBottom: '5px'
                    }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#15803d' }}>
                        {kategoriMasuk === 'pesantren' ? '1.' : '2.'} Adm Pesantren ({admPesantrenItems.length} Item)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingKategori(addingKategori === 'Adm Pesantren' ? null : 'Adm Pesantren');
                          setAddForm({ uraian: '', biaya: '' });
                        }}
                        style={{
                          background: '#15803d',
                          color: '#ffffff',
                          border: 'none',
                          padding: '3px 7px',
                          borderRadius: '5px',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Plus size={10} /> {addingKategori === 'Adm Pesantren' ? 'Batal' : '+ Tambah Item'}
                      </button>
                    </div>

                    {/* Form Tambah Item Adm Pesantren (Biaya di bawah Nama Item) */}
                    {addingKategori === 'Adm Pesantren' && (
                      <div style={{ background: '#ecfdf5', border: '1.5px dashed #86efac', borderRadius: '8px', padding: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#15803d' }}>
                          Tambah Item Baru di Adm Pesantren:
                        </div>
                        <input
                          type="text"
                          placeholder="Nama Item Pesantren"
                          value={addForm.uraian}
                          onChange={(e) => setAddForm({ ...addForm, uraian: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.68rem', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="Biaya (Rp)"
                            value={formatNumberInput(addForm.biaya)}
                            onChange={(e) => setAddForm({ ...addForm, biaya: e.target.value.replace(/\D/g, '') })}
                            style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 700, boxSizing: 'border-box' }}
                          />
                          <button
                            type="button"
                            disabled={savingAdd}
                            onClick={() => handleSaveAdd('Adm Pesantren')}
                            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
                          >
                            {savingAdd ? '...' : 'Simpan'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List Items Adm Pesantren */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {admPesantrenItems.map((item) => {
                        const isEditing = editingItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '4px 7px',
                              borderRadius: '6px',
                              background: isEditing ? '#fef3c7' : '#ffffff',
                              border: isEditing ? '1px solid #f59e0b' : '1px solid #f1f5f9',
                              fontSize: '0.66rem'
                            }}
                          >
                            {isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
                                <input
                                  type="text"
                                  value={editForm.uraian}
                                  onChange={(e) => setEditForm({ ...editForm, uraian: e.target.value })}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.66rem', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumberInput(editForm.biaya)}
                                    onChange={(e) => setEditForm({ ...editForm, biaya: e.target.value.replace(/\D/g, '') })}
                                    style={{ flex: 1, padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.66rem', fontWeight: 700, boxSizing: 'border-box' }}
                                  />
                                  <button
                                    type="button"
                                    disabled={savingEdit}
                                    onClick={() => handleSaveEdit(item)}
                                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItemId(null)}
                                    style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span style={{ color: '#334155', fontWeight: 600 }}>• {item.uraian}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatRp(item.biaya)}</span>
                                  <div style={{ display: 'flex', gap: '3px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditForm({ uraian: item.uraian, biaya: String(item.biaya) });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '2px' }}
                                      title="Edit Item"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(item)}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                      title="Hapus Item"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}

                </div>
              )}

              {/* Bottom Grand Total Strip */}
              <div style={{
                padding: '9px 12px',
                background: '#064e3b',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 800,
                fontSize: '0.76rem'
              }}>
                <span>
                  {kategoriMasuk === 'sekolah'
                    ? 'TOTAL ADM SEKOLAH:'
                    : kategoriMasuk === 'pesantren'
                    ? 'TOTAL ADM PESANTREN:'
                    : 'TOTAL RINCIAN:'}
                </span>
                <span style={{ color: '#a7f3d0', fontSize: '0.88rem' }}>{formatRp(grandTotalMasuk)}</span>
              </div>
            </div>

            {/* Proteksi Notice */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}>
              <ShieldCheck size={15} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.62rem', color: '#065f46', lineHeight: 1.3 }}>
                <strong>Aman Anti-Duplikat:</strong> Sistem memeriksa santri yang sudah memiliki tagihan. Tagihan yang sudah ada dilewati otomatis.
              </div>
            </div>

            {/* Tombol Simpan Tagihan Awal Masuk ke Database */}
            <button
              type="button"
              onClick={handleGenerateAwalMasuk}
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                border: 'none',
                background:
                  kategoriMasuk === 'sekolah'
                    ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)'
                    : kategoriMasuk === 'pesantren'
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
              }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>
                {loading
                  ? 'Menyimpan Tagihan ke Database...'
                  : kategoriMasuk === 'sekolah'
                  ? `Simpan & Terbitkan Adm Sekolah (${formatRp(grandTotalMasuk)})`
                  : kategoriMasuk === 'pesantren'
                  ? `Simpan & Terbitkan Adm Pesantren (${formatRp(grandTotalMasuk)})`
                  : `Simpan & Terbitkan Tagihan Masuk (${formatRp(grandTotalMasuk)})`}
              </span>
            </button>
          </div>
        )}

        {/* TAB 2: SPP BULANAN RUTIN */}
        {activeTab === 'spp_rutin' && (
          <form onSubmit={handleGenerateSpp} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Filter Sekolah SPP */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                1. Sekolah Target:
              </label>
              <select
                value={sekolahSpp}
                onChange={(e) => setSekolahSpp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="">Semua Sekolah (SMP, SMA, SMK)</option>
                <option value="SMP">Hanya SMP Nurul Wafa (SPP: Rp 505.000)</option>
                <option value="SMA">Hanya SMA Nurul Wafa (SPP: Rp 565.000)</option>
                <option value="SMK">Hanya SMK Nurul Wafa (SPP: Rp 565.000)</option>
              </select>
            </div>

            {/* Mode & Periode Bulan */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                  2. Periode Bulan:
                </label>
                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModeSpp('single')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: modeSpp === 'single' ? '#0284c7' : 'transparent',
                      color: modeSpp === 'single' ? '#ffffff' : '#64748b'
                    }}
                  >
                    1 Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeSpp('looping')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: modeSpp === 'looping' ? '#0284c7' : 'transparent',
                      color: modeSpp === 'looping' ? '#ffffff' : '#64748b'
                    }}
                  >
                    Full TA
                  </button>
                </div>
              </div>

              {modeSpp === 'single' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <select
                    value={bulanMulai}
                    onChange={(e) => setBulanMulai(e.target.value)}
                    style={{ padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {NAMA_BULAN.map((b) => (
                      <option key={b.id} value={b.id}>Bulan {b.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={tahunMulai}
                    onChange={(e) => setTahunMulai(e.target.value)}
                    style={{ padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Mulai:</div>
                      <select
                        value={bulanMulai}
                        onChange={(e) => setBulanMulai(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        {NAMA_BULAN.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={tahunMulai}
                        onChange={(e) => setTahunMulai(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.72rem', textAlign: 'center' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8' }}>➔</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Sampai:</div>
                      <select
                        value={bulanSelesai}
                        onChange={(e) => setBulanSelesai(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        {NAMA_BULAN.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={tahunSelesai}
                        onChange={(e) => setTahunSelesai(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.72rem', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Proteksi Notice */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.68rem', color: '#065f46', lineHeight: 1.3 }}>
                <strong>Aman Anti-Duplikat:</strong> Tagihan SPP yang sudah terbit tidak akan digandakan.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
              }}
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memproses Tagihan...' : 'Terbitkan Tagihan SPP'}</span>
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
