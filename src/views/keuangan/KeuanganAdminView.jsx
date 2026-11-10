import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  RotateCw,
  Layers,
  Calendar,
  Building,
  Send,
  Edit3,
  Trash2,
  X,
  Save,
  Zap,
  History,
  CheckSquare,
  Square
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';
import PanelKantongDanBukuKas from './components/PanelKantongDanBukuKas';

export default function KeuanganAdminView({ initialMode = 'kasir', initialRekapTab = 'semua' }) {
  // Mode Utama: 'kasir' (Tampilan Input Pembayaran per Santri seperti Artanita) | 'rekap' (Tabel Rekap Semua Santri & Master Pos Biaya)
  const [viewMode, setViewMode] = useState(initialMode);
  const [santriSubTab, setSantriSubTab] = useState('tagihan'); // 'tagihan' | 'riwayat'
  const [rekapTab, setRekapTab] = useState(initialRekapTab); // 'semua' | 'tunggakan' | 'transaksi' | 'komponen'

  useEffect(() => {
    if (initialMode) setViewMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialRekapTab) setRekapTab(initialRekapTab);
  }, [initialRekapTab]);

  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [santriSearchText, setSantriSearchText] = useState('');
  const [isSantriDropdownOpen, setIsSantriDropdownOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Data Tagihan & Riwayat untuk Santri Terpilih (Mode Kasir)
  const [loadingSantriBill, setLoadingSantriBill] = useState(false);
  const [santriProfile, setSantriProfile] = useState(null);
  const [tagihanBulanan, setTagihanBulanan] = useState([]);
  const [tagihanBebas, setTagihanBebas] = useState([]);
  const [riwayatSantri, setRiwayatSantri] = useState([]);

  // State Checklist Pembayaran: { [tagihan_id]: nominal_bayar }
  const [selectedPayMap, setSelectedPayMap] = useState({});
  const [metodeBayarKasir, setMetodeBayarKasir] = useState('Tunai / Kasir');
  const [processingPay, setProcessingPay] = useState(false);
  const [generatingAuto, setGeneratingAuto] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // State Form Auto-Generate Tagihan SPP Bulanan (Persis Artanita)
  const [autoGenForm, setAutoGenForm] = useState({
    komponen_id: '',
    mode_generasi: 'looping', // 'looping' | 'single'
    bulan_mulai: '7',
    tahun_mulai: '2026',
    bulan_selesai: '6',
    tahun_selesai: '2027',
    filter_kamar: '',
    filter_sekolah: ''
  });

  // Filter Sekolah & Modal Rincian Awal Masuk
  const [filterSekolahKasir, setFilterSekolahKasir] = useState('Semua');
  const [isRincianBiayaModalOpen, setIsRincianBiayaModalOpen] = useState(false);
  const [rincianBiayaTab, setRincianBiayaTab] = useState('SMP'); // 'SMP' | 'SMA' | 'SMK'

  const NAMA_BULAN_MAP = {
    '1': 'Januari',
    '2': 'Februari',
    '3': 'Maret',
    '4': 'April',
    '5': 'Mei',
    '6': 'Juni',
    '7': 'Juli',
    '8': 'Agustus',
    '9': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember'
  };

  // Data Rekap Global & Master Komponen
  const [loadingRekap, setLoadingRekap] = useState(false);
  const [dataRekap, setDataRekap] = useState({
    summary: {},
    transaksiTerakhir: [],
    tunggakanSantri: [],
    komponenBiaya: [],
    semuaTagihan: []
  });
  const [rekapSearch, setRekapSearch] = useState('');

  // Modal Tambah/Edit Tagihan Custom (Full Screen 2 Kolom)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [modalFilterTipe, setModalFilterTipe] = useState('Semua');
  const [skemaBayar, setSkemaBayar] = useState('belum');
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

  // Modal Master Komponen Biaya
  const [isKomponenModalOpen, setIsKomponenModalOpen] = useState(false);
  const [editingKompId, setEditingKompId] = useState(null);
  const [savingKomp, setSavingKomp] = useState(false);
  const [formKomponen, setFormKomponen] = useState({
    nama_komponen: '',
    kategori: 'Bulanan',
    nominal_default: '',
    deskripsi: ''
  });

  // Modal Siklus & Jatuh Tempo SPP Bulanan
  const [isSiklusModalOpen, setIsSiklusModalOpen] = useState(false);
  const [savingSiklus, setSavingSiklus] = useState(false);
  const [siklusData, setSiklusData] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    apply_to_existing: true
  });

  const formatRupiah = (val) => `Rp ${Math.round(parseFloat(val || 0)).toLocaleString('id-ID')}`;

  // Helper formatting angka ribuan (titik) untuk input nominal
  const formatNumberWithSeparator = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return parseInt(clean, 10).toLocaleString('id-ID');
  };

  const parseNumberFromFormatted = (formattedStr) => {
    if (!formattedStr) return 0;
    const clean = String(formattedStr).replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : 0;
  };

  // Tutup dropdown pencarian santri saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSantriDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Daftar Santri, Rekap Awal & Konfigurasi Siklus SPP
  const fetchInitialData = async () => {
    try {
      const [resSantri, resRekap, resSiklus] = await Promise.all([
        axios.get('/api/santri?all=true&limit=all').catch(() => ({ data: { data: [] } })),
        axios.get('/api/keuangan/admin/rekap').catch(() => ({ data: { data: {} } })),
        axios.get('/api/keuangan/admin/siklus-spp').catch(() => ({ data: { success: false } }))
      ]);

      const sList = resSantri.data?.data || [];
      setSantriList(sList);

      if (resRekap.data?.success && resRekap.data?.data) {
        setDataRekap({
          summary: resRekap.data.data.summary || {},
          transaksiTerakhir: resRekap.data.data.transaksiTerakhir || [],
          tunggakanSantri: resRekap.data.data.tunggakanSantri || [],
          komponenBiaya: resRekap.data.data.komponenBiaya || [],
          semuaTagihan: resRekap.data.data.semuaTagihan || []
        });
      }

      if (resSiklus.data?.success && resSiklus.data?.data) {
        setSiklusData({
          tgl_terbit_spp: resSiklus.data.data.tgl_terbit_spp || 5,
          tgl_jatuh_tempo_spp: resSiklus.data.data.tgl_jatuh_tempo_spp || 10,
          apply_to_existing: true
        });
      }
    } catch (err) {
      console.warn('Gagal memuat data awal keuangan:', err.message);
    }
  };

  const handleSimpanSiklus = async (e) => {
    e?.preventDefault();
    try {
      setSavingSiklus(true);
      const res = await axios.post('/api/keuangan/admin/siklus-spp', siklusData);
      if (res.data?.success) {
        toastSuccess('Siklus Tersimpan!', res.data.message || 'Konfigurasi siklus SPP diperbarui.');
        setIsSiklusModalOpen(false);
        if (selectedSantriId) await fetchSantriTagihan(selectedSantriId);
        await fetchRekap();
      }
    } catch (err) {
      showError('Gagal Menyimpan Siklus', err.response?.data?.message || err.message);
    } finally {
      setSavingSiklus(false);
    }
  };

  const fetchRekap = async () => {
    try {
      setLoadingRekap(true);
      const res = await axios.get('/api/keuangan/admin/rekap');
      if (res.data?.success) {
        setDataRekap({
          summary: res.data.data.summary || {},
          transaksiTerakhir: res.data.data.transaksiTerakhir || [],
          tunggakanSantri: res.data.data.tunggakanSantri || [],
          komponenBiaya: res.data.data.komponenBiaya || [],
          semuaTagihan: res.data.data.semuaTagihan || []
        });
      }
    } catch (e) {
    } finally {
      setLoadingRekap(false);
    }
  };

  // Fetch Tagihan & Riwayat untuk Santri Terpilih (Otomatis Generate Auto Tagihan bila santri belum punya tagihan)
  const fetchSantriTagihan = async (santriId) => {
    if (!santriId) return;
    try {
      setLoadingSantriBill(true);
      setSelectedPayMap({});
      const res = await axios.get(`/api/keuangan/wali/dashboard?santri_id=${santriId}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setSantriProfile(d.santri || null);

        // Hanya tampilkan yang belum lunas pada tab Tagihan Belum Lunas
        const bulananUnpaid = (d.tagihanBulanan || []).filter(
          (t) => t.status !== 'Lunas' && parseFloat(t.sisa_tagihan || 0) > 0
        );
        const bebasAll = [...(d.biayaAwalMasuk || []), ...(d.tagihanLainnya || [])].filter(
          (t) => t.status !== 'Lunas' && parseFloat(t.sisa_tagihan || 0) > 0
        );

        setTagihanBulanan(bulananUnpaid);
        setTagihanBebas(bebasAll);
        setRiwayatSantri(d.riwayatTransaksi || []);
      }
    } catch (err) {
      console.warn('Gagal memuat tagihan santri:', err.message);
    } finally {
      setLoadingSantriBill(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedSantriId) {
      fetchSantriTagihan(selectedSantriId);
    }
  }, [selectedSantriId]);

  // Handler Pilih Santri dari Search Bar
  const handleSelectSantri = (s) => {
    setSelectedSantriId(String(s.id));
    setSantriSearchText(`${s.nama_santri} (${s.nis || '-'})`);
    setIsSantriDropdownOpen(false);
  };

  // Cek apakah tagihan telah melewati jatuh tempo (Tunggakan)
  const isTunggakanBulanLalu = (periodeStr = '', jatuhTempo = null) => {
    if (jatuhTempo) {
      const jt = new Date(jatuhTempo);
      if (!isNaN(jt.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today > jt;
      }
    }
    const p = String(periodeStr).toLowerCase();
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const curDay = new Date().getDate();
    const dueDay = siklusData?.tgl_jatuh_tempo_spp || 10;

    const bulanIndexMap = {
      januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
      juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
    };

    for (const [namaBulan, idx] of Object.entries(bulanIndexMap)) {
      if (p.includes(namaBulan)) {
        if (idx < curMonth) return true; // Bulan lalu pasti tunggakan
        if (idx === curMonth && curDay > dueDay) return true; // Bulan ini jika lewat tanggal jatuh tempo
        return false;
      }
    }
    return p.includes('juli 2026') || p.includes('agustus 2026') || p.includes('september 2026') || p.includes('oktober 2026');
  };

  // Toggle Checkbox 1 Tagihan
  const handleToggleBill = (bill) => {
    setSelectedPayMap((prev) => {
      const next = { ...prev };
      if (next[bill.id] !== undefined) {
        delete next[bill.id];
      } else {
        next[bill.id] = Math.round(parseFloat(bill.sisa_tagihan || 0));
      }
      return next;
    });
  };

  // Ubah Nominal Bayar (Cicilan / Sebagian) pada Input Baris
  const handleChangeNominalBayar = (billId, maxSisa, rawVal) => {
    const parsed = typeof rawVal === 'string' ? parseNumberFromFormatted(rawVal) : (parseFloat(rawVal) || 0);
    const num = Math.max(0, Math.min(maxSisa, parsed));
    setSelectedPayMap((prev) => ({
      ...prev,
      [billId]: num
    }));
  };

  // Pilih Semua SPP Bulanan
  const allBulananSelected =
    tagihanBulanan.length > 0 && tagihanBulanan.every((b) => selectedPayMap[b.id] !== undefined);

  const handleToggleAllBulanan = () => {
    setSelectedPayMap((prev) => {
      const next = { ...prev };
      if (allBulananSelected) {
        tagihanBulanan.forEach((b) => delete next[b.id]);
      } else {
        tagihanBulanan.forEach((b) => {
          next[b.id] = Math.round(parseFloat(b.sisa_tagihan || 0));
        });
      }
      return next;
    });
  };

  // Pilih N Bulan Pertama / Kedepan SPP Bulanan (misal 3 bulan atau semua)
  const handleSelectMonthsCount = (count) => {
    setSelectedPayMap((prev) => {
      const next = { ...prev };
      // Bersihkan seleksi SPP bulanan dulu
      tagihanBulanan.forEach((b) => delete next[b.id]);
      const targetBills = count === 'all' ? tagihanBulanan : tagihanBulanan.slice(0, count);
      targetBills.forEach((b) => {
        next[b.id] = Math.round(parseFloat(b.sisa_tagihan || 0));
      });
      return next;
    });
  };

  // Pilih Semua Tagihan Bebas (Non-Bulanan)
  const allBebasSelected =
    tagihanBebas.length > 0 && tagihanBebas.every((b) => selectedPayMap[b.id] !== undefined);

  const handleToggleAllBebas = () => {
    setSelectedPayMap((prev) => {
      const next = { ...prev };
      if (allBebasSelected) {
        tagihanBebas.forEach((b) => delete next[b.id]);
      } else {
        tagihanBebas.forEach((b) => {
          next[b.id] = Math.round(parseFloat(b.sisa_tagihan || 0));
        });
      }
      return next;
    });
  };

  // Hitung Total Pembayaran yang Dicentang
  const selectedIds = Object.keys(selectedPayMap);
  const totalSelectedBayar = selectedIds.reduce((acc, id) => acc + (parseFloat(selectedPayMap[id]) || 0), 0);

  // Eksekusi Pembayaran Langsung (Kasir)
  const handleProsesPembayaranKasir = async () => {
    if (selectedIds.length === 0 || totalSelectedBayar <= 0) {
      showError('Pilih Tagihan', 'Centang minimal 1 tagihan dan pastikan nominal bayar lebih dari Rp 0.');
      return;
    }

    const isPendingTransfer = metodeBayarKasir === 'Transfer Bank (Pending)';
    const ok = await showConfirm(
      isPendingTransfer ? 'Catat Menunggu Transfer?' : 'Konfirmasi Pembayaran Santri',
      isPendingTransfer
        ? `Catat ${selectedIds.length} item tagihan sejumlah ${formatRupiah(totalSelectedBayar)} sebagai Pending Transfer? Tagihan belum lunas & belum masuk kas sebelum dikonfirmasi.`
        : `Proses pembayaran ${selectedIds.length} item tagihan sejumlah ${formatRupiah(totalSelectedBayar)} via ${metodeBayarKasir}?`,
      isPendingTransfer ? 'Ya, Catat Pending' : 'Ya, Proses Pembayaran',
      'Batal'
    );
    if (!ok) return;

    try {
      setProcessingPay(true);
      const itemsPayload = selectedIds.map((id) => ({
        tagihan_id: parseInt(id),
        nominal: parseFloat(selectedPayMap[id]) || 0
      }));

      const metodePayload = metodeBayarKasir.includes('QRIS')
        ? 'QRIS'
        : metodeBayarKasir.includes('Transfer')
        ? 'Transfer'
        : 'Tunai';

      const res = await axios.post('/api/keuangan/admin/bayar-langsung', {
        santri_id: parseInt(selectedSantriId),
        metode_pembayaran: metodePayload,
        channel_pembayaran: metodeBayarKasir,
        status_pembayaran: isPendingTransfer ? 'Pending' : 'Berhasil',
        items: itemsPayload
      });

      if (res.data?.success) {
        if (res.data?.data?.status_pembayaran === 'Pending') {
          toastSuccess('Transfer Pending Tercatat', 'Belum masuk kas sebelum dikonfirmasi masuk.');
        } else {
          toastSuccess('Pembayaran Berhasil!', `Kuitansi: ${res.data.data?.kuitansi_nomor || 'Tersimpan'}`);
        }
        setSelectedPayMap({});
        await fetchSantriTagihan(selectedSantriId);
        await fetchRekap();
      }
    } catch (err) {
      showError('Gagal Memproses Pembayaran', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleKonfirmasiTransferPendingAdmin = async (trx) => {
    const ok = await showConfirm(
      'Konfirmasi Transfer Masuk?',
      `Verifikasi transfer ${trx.nomor_transaksi} sebesar ${formatRupiah(trx.total_bayar)} atas nama ${trx.nama_santri}? Tagihan akan dilunasi dan tercatat di Kas Masuk Sah.`,
      'Ya, Sudah Masuk',
      'Batal'
    );
    if (!ok) return;

    try {
      setProcessingPay(true);
      const res = await axios.post('/api/keuangan/wali/verifikasi', {
        transaksi_id: trx.id,
        nomor_transaksi: trx.nomor_transaksi
      });
      if (res.data?.success) {
        toastSuccess('Transfer Dikonfirmasi!', 'Pembayaran sah masuk kas & kuitansi diterbitkan.');
        if (selectedSantriId) await fetchSantriTagihan(selectedSantriId);
        await fetchRekap();
      }
    } catch (err) {
      showError('Gagal Konfirmasi', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleBatalkanPendingAdmin = async (trx) => {
    const ok = await showConfirm(
      'Batalkan Transfer Pending?',
      `Batalkan ${trx.nomor_transaksi} atas nama ${trx.nama_santri}?`,
      'Ya, Batalkan',
      'Tidak'
    );
    if (!ok) return;

    try {
      setProcessingPay(true);
      const res = await axios.post('/api/keuangan/wali/batal', {
        transaksi_id: trx.id,
        nomor_transaksi: trx.nomor_transaksi
      });
      if (res.data?.success) {
        toastSuccess('Transaksi Dibatalkan', 'Transaksi pending berhasil dibatalkan.');
        if (selectedSantriId) await fetchSantriTagihan(selectedSantriId);
        await fetchRekap();
      }
    } catch (err) {
      showError('Gagal Batalkan', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  // Handler Buka Modal Generate Tagihan SPP Bulanan
  const openGenerateModal = () => {
    const defaultKomp =
      (dataRekap.komponenBiaya || []).find((k) => k.kategori === 'Bulanan') ||
      dataRekap.komponenBiaya?.[0];
    setAutoGenForm((prev) => ({
      ...prev,
      komponen_id: prev.komponen_id || (defaultKomp ? String(defaultKomp.id) : '')
    }));
    setIsGenerateModalOpen(true);
  };

  // Handler Submit Form Generate Tagihan SPP Bulanan
  const handleSubmitAutoGenerate = async (e) => {
    e.preventDefault();
    if (!autoGenForm.komponen_id) {
      showError('Pilih Pos & Tarif', 'Silakan pilih Pos & Tarif Pembayaran terlebih dahulu.');
      return;
    }

    const selKomp = (dataRekap.komponenBiaya || []).find(
      (k) => String(k.id) === String(autoGenForm.komponen_id)
    );
    const rentangLabel =
      autoGenForm.mode_generasi === 'single'
        ? `${NAMA_BULAN_MAP[autoGenForm.bulan_mulai]} ${autoGenForm.tahun_mulai}`
        : `${NAMA_BULAN_MAP[autoGenForm.bulan_mulai]} ${autoGenForm.tahun_mulai} s/d ${NAMA_BULAN_MAP[autoGenForm.bulan_selesai]} ${autoGenForm.tahun_selesai}`;

    const filterLabel = !autoGenForm.filter_kamar
      ? 'Seluruh Santri Aktif'
      : autoGenForm.filter_kamar.startsWith('SANTRI:')
      ? `Santri: ${activeSantriObj?.nama_santri || 'Terpilih'}`
      : `Kamar/Asrama: ${autoGenForm.filter_kamar}`;

    const ok = await showConfirm(
      'Konfirmasi Generate Tagihan',
      `Buat tagihan "${selKomp?.nama_komponen || 'SPP'}" (${formatRupiah(selKomp?.nominal_default || 0)}) periode ${rentangLabel} untuk ${filterLabel}? Tagihan yang sudah ada akan dilewati (tidak duplikat).`,
      'Ya, Generate Sekarang',
      'Batal'
    );
    if (!ok) return;

    try {
      setGeneratingAuto(true);
      const res = await axios.post('/api/keuangan/admin/generate-auto', {
        komponen_id: parseInt(autoGenForm.komponen_id),
        mode_generasi: autoGenForm.mode_generasi,
        bulan_mulai: parseInt(autoGenForm.bulan_mulai),
        tahun_mulai: parseInt(autoGenForm.tahun_mulai),
        bulan_selesai: parseInt(autoGenForm.bulan_selesai),
        tahun_selesai: parseInt(autoGenForm.tahun_selesai),
        filter_kamar: autoGenForm.filter_kamar,
        filter_sekolah: autoGenForm.filter_sekolah
      });

      if (res.data?.success) {
        toastSuccess('Generate Berhasil!', res.data.message);
        if (selectedSantriId) await fetchSantriTagihan(selectedSantriId);
        await fetchRekap();
        setIsGenerateModalOpen(false);
      }
    } catch (err) {
      showError('Gagal Generate Tagihan', err.response?.data?.message || err.message);
    } finally {
      setGeneratingAuto(false);
    }
  };

  // Handlers Modal Buat / Edit Tagihan Custom
  const openAddTagihan = () => {
    const firstKomp = dataRekap.komponenBiaya?.[0];
    const isBulanan = !firstKomp || firstKomp.kategori === 'Bulanan';
    const defaultPeriode = isBulanan ? 'November 2026' : 'TA 2026/2027 (Satu Kali Bayar)';
    setFormMode('add');
    setModalFilterTipe('Semua');
    setSkemaBayar('belum');
    setMetodeBayarForm('Tunai / Kasir');
    setFormTagihan({
      ...initialFormTagihan,
      santri_id: selectedSantriId || santriList[0]?.id || '',
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
      santri_id: item.santri_id || selectedSantriId,
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

  const handleSimpanTagihan = async (e) => {
    e.preventDefault();
    if (!formTagihan.santri_id || !formTagihan.komponen_id || !formTagihan.total_tagihan) {
      showError('Validasi Gagal', 'Santri, Komponen Biaya, dan Nominal wajib diisi');
      return;
    }

    const selKomp = (dataRekap.komponenBiaya || []).find((k) => String(k.id) === String(formTagihan.komponen_id));
    const autoJudul = selKomp ? selKomp.nama_komponen : formTagihan.judul_tagihan;

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
        await axios.post('/api/keuangan/admin/tagihan', payload);
        toastSuccess('Berhasil!', 'Tagihan baru berhasil diterbitkan');
      } else {
        await axios.put(`/api/keuangan/admin/tagihan/${formTagihan.id}`, payload);
        toastSuccess('Berhasil!', 'Data tagihan berhasil diperbarui');
      }
      setIsModalOpen(false);
      await fetchSantriTagihan(formTagihan.santri_id);
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTagihan = async (item) => {
    const ok = await showConfirm(
      'Hapus Tagihan?',
      `Hapus tagihan "${item.judul_tagihan}" (${ item.periode_bulan || '-' })?`,
      'Ya, Hapus'
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/keuangan/admin/tagihan/${item.id}`);
      toastSuccess('Dihapus!', 'Tagihan berhasil dihapus');
      await fetchSantriTagihan(selectedSantriId);
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    }
  };

  // Master Komponen Handlers
  const handleSimpanKomponen = async (e) => {
    e.preventDefault();
    if (!formKomponen.nama_komponen.trim() || !formKomponen.nominal_default) return;
    try {
      setSavingKomp(true);
      if (editingKompId) {
        await axios.put(`/api/keuangan/admin/komponen/${editingKompId}`, formKomponen);
        toastSuccess('Berhasil!', 'Komponen biaya diperbarui');
      } else {
        await axios.post('/api/keuangan/admin/komponen', formKomponen);
        toastSuccess('Berhasil!', 'Komponen biaya ditambahkan');
      }
      setEditingKompId(null);
      setFormKomponen({ nama_komponen: '', kategori: 'Bulanan', nominal_default: '', deskripsi: '' });
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSavingKomp(false);
    }
  };

  const handleDeleteKomponen = async (k) => {
    const ok = await showConfirm(
      'Hapus Pos Biaya?',
      `Hapus pos "${k.nama_komponen}"?`,
      'Ya, Hapus'
    );
    if (!ok) return;
    try {
      await axios.delete(`/api/keuangan/admin/komponen/${k.id}`);
      toastSuccess('Dihapus', 'Pos biaya dihapus');
      await fetchRekap();
    } catch (err) {
      showError('Gagal', err.message);
    }
  };

  // Filter santri untuk autocomplete search bar
  const filteredSantriDropdown = santriList.filter((s) => {
    if (filterSekolahKasir !== 'Semua') {
      const matchSekolah = String(s.nama_sekolah || '').toUpperCase().includes(filterSekolahKasir) ||
                           String(s.sekolah_jenjang || '').toUpperCase() === filterSekolahKasir;
      if (!matchSekolah) return false;
    }
    if (!santriSearchText.trim()) return true;
    const q = santriSearchText.toLowerCase();
    return (
      (s.nama_santri || '').toLowerCase().includes(q) ||
      (s.nis || '').toLowerCase().includes(q) ||
      (s.nama_asrama || '').toLowerCase().includes(q) ||
      (s.nama_sekolah || '').toLowerCase().includes(q) ||
      (s.tingkat_sekolah || '').toLowerCase().includes(q)
    );
  });

  const activeSantriObj =
    santriList.find((s) => String(s.id) === String(selectedSantriId)) || santriProfile || {};
  const totalUnpaidCount = tagihanBulanan.length + tagihanBebas.length;

  return (
    <div style={{ paddingBottom: selectedIds.length > 0 ? '96px' : '24px' }}>
      {/* 1. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <CreditCard size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Keuangan & Tagihan Santri</h2>
            <p>Kasir pembayaran SPP bulanan, tagihan bebas, auto-generate tagihan rutin, dan riwayat transaksi</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (selectedSantriId) fetchSantriTagihan(selectedSantriId);
              fetchRekap();
            }}
          >
            <RotateCw size={13} className={loadingRekap || loadingSantriBill ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={openGenerateModal}
          >
            <RotateCw size={14} /> Generate Tagihan
          </button>
          <button
            type="button"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => setIsKomponenModalOpen(true)}
          >
            <FileText size={14} /> Master Pos Biaya
          </button>
          <button
            type="button"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              color: '#0369a1',
              border: '1px solid #7dd3fc',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => setIsSiklusModalOpen(true)}
            title="Atur Tanggal Terbit Tagihan & Batas Jatuh Tempo SPP"
          >
            <Calendar size={14} /> Siklus & Jatuh Tempo SPP
          </button>
          <button
            type="button"
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #6ee7b7',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => setIsRincianBiayaModalOpen(true)}
            title="Lihat Rincian Biaya Awal Masuk 2026/2027 (SMP, SMA, SMK)"
          >
            <FileText size={14} /> 📋 Rincian Biaya Sekolah
          </button>
        </div>
      </div>

      {/* 2. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button
          className={`tab-btn ${viewMode === 'kasir' ? 'active' : ''}`}
          onClick={() => setViewMode('kasir')}
        >
          <CreditCard size={14} /> Pembayaran
        </button>
        <button
          className={`tab-btn ${viewMode === 'rekap' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('rekap');
            fetchRekap();
          }}
        >
          <Layers size={14} /> Rekap Tagihan
        </button>
      </div>

      {/* =========================================================================
          MODAL: GENERATE TAGIHAN SPP BULANAN (MODAL POPUP)
      ========================================================================= */}
      {isGenerateModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            style={{
              maxWidth: '660px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: 0,
              border: '1px solid #cbd5e1'
            }}
          >
            {/* Header Modal Gradient */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    padding: '8px',
                    display: 'flex'
                  }}
                >
                  <RotateCw size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    Generate Tagihan
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#e0f2fe' }}>
                    Terbitkan tagihan SPP serentak tanpa perlu input satu per satu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

          <form onSubmit={handleSubmitAutoGenerate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Pilih Pos Biaya */}
            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                <span>1. Pos & Tarif Pembayaran <span style={{ color: '#ef4444' }}>*</span></span>
                <button
                  type="button"
                  onClick={() => setIsKomponenModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  + Kelola Tarif
                </button>
              </label>
              <SearchableSelect
                options={(dataRekap.komponenBiaya || []).map((k) => ({
                  value: String(k.id),
                  label: k.nama_komponen,
                  sublabel: `${formatRupiah(k.nominal_default)} • ${k.kategori === 'Bulanan' ? 'Rutin Bulanan' : 'Satu Kali Bayar'}`
                }))}
                value={autoGenForm.komponen_id}
                onChange={(val) => setAutoGenForm({ ...autoGenForm, komponen_id: val })}
                placeholder="-- Pilih Pos Biaya (misal: SPP Bulanan) --"
              />
            </div>

            {/* 2. Pilihan Cepat / Preset Periode Ajaran */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                2. Periode Tagihan
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {[
                  {
                    id: 'preset_tahun',
                    label: '1 Tahun Penuh',
                    sub: 'Juli 2026 - Juni 2027',
                    fn: () => setAutoGenForm({ ...autoGenForm, mode_generasi: 'looping', bulan_mulai: '7', tahun_mulai: '2026', bulan_selesai: '6', tahun_selesai: '2027' })
                  },
                  {
                    id: 'preset_smt1',
                    label: 'Semester Ganjil',
                    sub: 'Juli - Des 2026',
                    fn: () => setAutoGenForm({ ...autoGenForm, mode_generasi: 'looping', bulan_mulai: '7', tahun_mulai: '2026', bulan_selesai: '12', tahun_selesai: '2026' })
                  },
                  {

                    id: 'preset_bln_ini',
                    label: 'Bulan Ini Saja',
                    sub: '1 Bulan Spesifik',
                    fn: () => setAutoGenForm({ ...autoGenForm, mode_generasi: 'single', bulan_mulai: '11', tahun_mulai: '2026' })
                  }
                ].map((p) => {
                  const isPresetActive =
                    p.id === 'preset_bln_ini'
                      ? autoGenForm.mode_generasi === 'single'
                      : autoGenForm.mode_generasi === 'looping' &&
                        (p.id === 'preset_tahun' ? autoGenForm.bulan_selesai === '6' && autoGenForm.tahun_selesai === '2027' : autoGenForm.bulan_selesai === '12');

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={p.fn}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isPresetActive ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: isPresetActive ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isPresetActive ? '#0369a1' : '#1e293b' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                        {p.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Input Rentang Sederhana & Kompak */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px 16px'
                }}
              >
                {autoGenForm.mode_generasi === 'looping' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Mulai Dari
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          value={autoGenForm.bulan_mulai}
                          onChange={(e) => setAutoGenForm({ ...autoGenForm, bulan_mulai: e.target.value })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                        >
                          {Object.entries(NAMA_BULAN_MAP).map(([num, nama]) => (
                            <option key={num} value={num}>{nama}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={autoGenForm.tahun_mulai}
                          onChange={(e) => setAutoGenForm({ ...autoGenForm, tahun_mulai: e.target.value })}
                          style={{ width: '68px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                        />
                      </div>
                    </div>

                    <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 800, paddingTop: '16px' }}>➔</span>

                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Sampai Dengan
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select
                          value={autoGenForm.bulan_selesai}
                          onChange={(e) => setAutoGenForm({ ...autoGenForm, bulan_selesai: e.target.value })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                        >
                          {Object.entries(NAMA_BULAN_MAP).map(([num, nama]) => (
                            <option key={num} value={num}>{nama}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={autoGenForm.tahun_selesai}
                          onChange={(e) => setAutoGenForm({ ...autoGenForm, tahun_selesai: e.target.value })}
                          style={{ width: '68px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Bulan & Tahun Tagihan
                    </label>
                    <div style={{ display: 'flex', gap: '8px', maxWidth: '320px' }}>
                      <select
                        value={autoGenForm.bulan_mulai}
                        onChange={(e) => setAutoGenForm({ ...autoGenForm, bulan_mulai: e.target.value })}
                        style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                      >
                        {Object.entries(NAMA_BULAN_MAP).map(([num, nama]) => (
                          <option key={num} value={num}>{nama}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={autoGenForm.tahun_mulai}
                        onChange={(e) => setAutoGenForm({ ...autoGenForm, tahun_mulai: e.target.value })}
                        style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600, background: '#fff' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: '#0369a1', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🛡️</span>
                  <span><strong>Aman anti-duplikat:</strong> Tagihan yang sudah ada pada santri tidak akan dibuat ganda.</span>
                </div>
              </div>
            </div>

            {/* 3. Filter Sasaran Santri */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                3. Sasaran Santri
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Santri Aktif (Massal)', sublabel: `${santriList.length} Santri` },
                  ...Array.from(
                    new Set(
                      santriList
                        .map((s) => s.nama_asrama || s.nama_kamar)
                        .filter(Boolean)
                    )
                  ).map((kmr) => ({
                    value: kmr,
                    label: `Kamar / Asrama: ${kmr}`,
                    sublabel: 'Filter kelompok asrama'
                  })),
                  ...(activeSantriObj?.id
                    ? [
                        {
                          value: `SANTRI:${activeSantriObj.id}`,
                          label: `Khusus Santri: ${activeSantriObj.nama_santri}`,
                          sublabel: `NIS: ${activeSantriObj.nis || '-'}`
                        }
                      ]
                    : [])
                ]}
                value={autoGenForm.filter_kamar}
                onChange={(val) => setAutoGenForm({ ...autoGenForm, filter_kamar: val })}
                placeholder="Pilih sasaran santri..."
              />
            </div>

            {/* 3b. Filter Berdasarkan Jenjang Sekolah */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                4. Filter Jenjang Sekolah
              </label>
              <select
                value={autoGenForm.filter_sekolah}
                onChange={(e) => setAutoGenForm({ ...autoGenForm, filter_sekolah: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, background: '#fff' }}
              >
                <option value="">Semua Sekolah (SMP, SMA, SMK)</option>
                <option value="SMP">Hanya SMP Nurul Wafa (Tarif SPP: Rp 505.000)</option>
                <option value="SMA">Hanya SMA Nurul Wafa (Tarif SPP: Rp 565.000)</option>
                <option value="SMK">Hanya SMK Nurul Wafa (Tarif SPP: Rp 565.000)</option>
              </select>
            </div>

            {/* 5. Tombol Aksi */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                disabled={generatingAuto}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                <RotateCw size={16} className={generatingAuto ? 'animate-spin' : ''} />
                {generatingAuto ? 'Memproses Tagihan...' : 'Terbitkan Tagihan Sekarang'}
              </button>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* =========================================================================
          VIEW 1: KASIR & INPUT PEMBAYARAN SANTRI (DATA TABLE CARD STANDAR MASTER SANTRI)
      ========================================================================= */}
      {viewMode === 'kasir' && (
        <div>
          {/* 1. FILTER SEARCH BAR STRIP (STANDAR MASTER SANTRI) */}
          <div className="filter-search-box" style={{ marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ minWidth: '150px' }}>
              <select
                value={filterSekolahKasir}
                onChange={(e) => setFilterSekolahKasir(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  background: '#f8fafc'
                }}
              >
                <option value="Semua">🏫 Semua Sekolah</option>
                <option value="SMP">SMP Nurul Wafa</option>
                <option value="SMA">SMA Nurul Wafa</option>
                <option value="SMK">SMK Nurul Wafa</option>
              </select>
            </div>

            <div className="filter-search-input" ref={searchBoxRef} style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                value={santriSearchText}
                onFocus={() => setIsSantriDropdownOpen(true)}
                onChange={(e) => {
                  setSantriSearchText(e.target.value);
                  setIsSantriDropdownOpen(true);
                }}
                placeholder="Cari nama santri, NIS, asrama, atau sekolah..."
              />
              {santriSearchText && (
                <button
                  type="button"
                  onClick={() => {
                    setSantriSearchText('');
                    setSelectedSantriId('');
                    setTagihanBulanan([]);
                    setTagihanBebas([]);
                    setRiwayatSantri([]);
                    setSelectedPayMap({});
                    setIsSantriDropdownOpen(true);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}

              {/* Dropdown Hasil Pencarian Santri */}
              {isSantriDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    maxHeight: '260px',
                    overflowY: 'auto',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                    zIndex: 100
                  }}
                >
                  {filteredSantriDropdown.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSantri(s)}
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        background: String(s.id) === String(selectedSantriId) ? '#f0f9ff' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>{s.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          NIS: {s.nis} • {s.nama_asrama || 'Asrama'} • <b style={{ color: '#0369a1' }}>{s.nama_sekolah || 'SMP Nurul Wafa'} ({s.tingkat_sekolah || '-'})</b>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7' }}>Pilih</span>
                    </div>
                  ))}
                  {filteredSantriDropdown.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.74rem' }}>
                      Santri tidak ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profil Ringkas Santri Aktif (Hanya jika santri sudah dipilih) */}
            {selectedSantriId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeSantriObj.nama_santri}
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                  NIS: {activeSantriObj.nis || '-'}
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                  {activeSantriObj.nama_asrama || 'Asrama Pondok'}
                </span>
                <span className="badge" style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 800 }}>
                  🏫 {activeSantriObj.nama_sekolah || 'SMP Nurul Wafa'} {activeSantriObj.tingkat_sekolah ? `(${activeSantriObj.tingkat_sekolah})` : ''}
                </span>
              </div>
            )}

            {/* Tab Sub: Tagihan vs Riwayat Bayar (Hanya jika santri sudah dipilih) */}
            {selectedSantriId && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${santriSubTab === 'tagihan' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSantriSubTab('tagihan')}
                  style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  Tagihan Belum Lunas ({totalUnpaidCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${santriSubTab === 'riwayat' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSantriSubTab('riwayat')}
                  style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  <History size={12} /> Riwayat ({riwayatSantri.length})
                </button>
              </div>
            )}
          </div>

          {!selectedSantriId ? (
            <div
              className="table-container-card"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f0f9ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px'
                }}
              >
                <Search size={26} />
              </div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                Cari & Pilih Nama Santri Terlebih Dahulu
              </h4>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', maxWidth: '420px', marginInline: 'auto' }}>
                Ketik nama atau NIS santri pada kolom pencarian di atas untuk memuat tagihan SPP bulanan, tunggakan, serta riwayat pembayarannya.
              </p>
            </div>
          ) : loadingSantriBill ? (
            <div className="table-container-card" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
              Memuat data tagihan santri...
            </div>
          ) : santriSubTab === 'tagihan' ? (
            <>
              {/* =================================================================
                  SECTION 1: TAGIHAN SPP RUTIN (BULANAN) - STANDAR DATA-TABLE MASTER SANTRI
              ================================================================= */}
              <div className="table-container-card" style={{ marginBottom: '14px' }}>
                {/* Header Strip SPP Rutin Bulanan */}
                <div
                  style={{
                    padding: '8px 14px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      📅 Tagihan SPP Rutin (Bulanan)
                    </span>

                    {tagihanBulanan.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectMonthsCount(3)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #93c5fd',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Pilih 3 Bulan SPP Pertama / Kedepan"
                        >
                          ⚡ Bayar 3 Bulan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectMonthsCount('all')}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid #86efac',
                            background: '#f0fdf4',
                            color: '#15803d',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Pilih Seluruh Bulan SPP yang Belum Lunas"
                        >
                          ⚡ Full Bulanan Kedepan
                        </button>

                        <label
                          onClick={handleToggleAllBulanan}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#334155',
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={allBulananSelected}
                            onChange={() => {}}
                            style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                          />
                          Pilih Semua
                        </label>
                      </div>
                    )}
                  </div>

                  <span className="badge badge-info" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                    {tagihanBulanan.length} Tagihan
                  </span>
                </div>

                {/* Tabel SPP Rutin Bulanan */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.76rem' }}>
                    <thead>
                      <tr>
                        <th className="td-center" style={{ width: '36px' }}>
                          <input
                            type="checkbox"
                            checked={allBulananSelected}
                            onChange={handleToggleAllBulanan}
                            style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ width: '220px' }}>POS PEMBAYARAN</th>
                        <th>TIPE & PERIODE TAGIHAN</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>NOMINAL TAGIHAN</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>SISA TAGIHAN</th>
                        <th style={{ width: '190px', textAlign: 'right' }}>NOMINAL BAYAR (RP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagihanBulanan.map((b) => {
                        const isChecked = selectedPayMap[b.id] !== undefined;
                        const isMenunggak = isTunggakanBulanLalu(b.periode_bulan, b.jatuh_tempo);
                        const sisa = Math.round(parseFloat(b.sisa_tagihan || 0));

                        return (
                          <tr
                            key={b.id}
                            style={{
                              background: isChecked ? '#f0f9ff' : undefined,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleBill(b)}
                          >
                            <td className="td-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleBill(b)}
                                style={{ accentColor: '#0284c7', cursor: 'pointer', width: '14px', height: '14px' }}
                              />
                            </td>

                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
                                {b.nama_komponen || b.judul_tagihan || 'SPP Bulanan'}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                Kode: {b.kode_tagihan}
                              </div>
                            </td>

                            <td>
                              {isMenunggak ? (
                                <div>
                                  <span className="badge badge-danger" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                    ⚠️ Tunggakan {b.periode_bulan}
                                  </span>
                                  <div style={{ fontSize: '0.65rem', color: '#ef4444', marginTop: '2px', fontWeight: 600 }}>
                                    Tagihan SPP Bulan Lalu (Menunggak)
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="badge badge-info" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                    📅 {b.periode_bulan}
                                  </span>
                                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                                    Tagihan SPP Rutin (Berjalan)
                                  </div>
                                </div>
                              )}
                            </td>

                            <td style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>
                              {formatRupiah(b.total_tagihan)}
                            </td>

                            <td style={{ fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>
                              {formatRupiah(sisa)}
                            </td>

                            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                              {isChecked ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%', maxWidth: '170px' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Rp</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumberWithSeparator(selectedPayMap[b.id])}
                                    onChange={(e) => handleChangeNominalBayar(b.id, sisa, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      border: '1.5px solid #0284c7',
                                      fontWeight: 800,
                                      fontSize: '0.78rem',
                                      color: '#0f172a',
                                      background: '#ffffff',
                                      textAlign: 'right'
                                    }}
                                  />
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {tagihanBulanan.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.76rem' }}>
                            Seluruh tagihan SPP Rutin Bulanan santri ini sudah Lunas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =================================================================
                  SECTION 2: TAGIHAN TIPE BEBAS (NON-BULANAN) - STANDAR DATA-TABLE MASTER SANTRI
              ================================================================= */}
              <div className="table-container-card">
                {/* Header Strip Tagihan Tipe Bebas */}
                <div
                  style={{
                    padding: '8px 14px',
                    background: '#fffbeb',
                    borderBottom: '1px solid #fde68a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      💰 Tagihan Tipe Bebas (Non-Bulanan)
                    </span>

                    {tagihanBebas.length > 0 && (
                      <label
                        onClick={handleToggleAllBebas}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={allBebasSelected}
                          onChange={() => {}}
                          style={{ accentColor: '#d97706', cursor: 'pointer' }}
                        />
                        Pilih Semua (Pelunasan Sekaligus)
                      </label>
                    )}
                  </div>

                  <span className="badge badge-warning" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                    {tagihanBebas.length} Tagihan
                  </span>
                </div>

                {/* Tabel Tagihan Tipe Bebas */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.76rem' }}>
                    <thead>
                      <tr>
                        <th className="td-center" style={{ width: '36px' }}>
                          <input
                            type="checkbox"
                            checked={allBebasSelected}
                            onChange={handleToggleAllBebas}
                            style={{ accentColor: '#d97706', cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ width: '220px' }}>POS PEMBAYARAN</th>
                        <th>TIPE & PERIODE TAGIHAN</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>NOMINAL TAGIHAN</th>
                        <th style={{ width: '140px', textAlign: 'right' }}>SISA TAGIHAN</th>
                        <th style={{ width: '190px', textAlign: 'right' }}>NOMINAL BAYAR (RP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tagihanBebas.map((b) => {
                        const isChecked = selectedPayMap[b.id] !== undefined;
                        const sisa = Math.round(parseFloat(b.sisa_tagihan || 0));
                        const sudah = Math.round(parseFloat(b.sudah_dibayar || 0));

                        return (
                          <tr
                            key={b.id}
                            style={{
                              background: isChecked ? '#fffbeb' : undefined,
                              cursor: 'pointer'
                            }}
                            onClick={() => handleToggleBill(b)}
                          >
                            <td className="td-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleBill(b)}
                                style={{ accentColor: '#d97706', cursor: 'pointer', width: '14px', height: '14px' }}
                              />
                            </td>

                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.78rem' }}>
                                {b.nama_komponen || b.judul_tagihan}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                Kode: {b.kode_tagihan}
                              </div>
                            </td>

                            <td>
                              <span className="badge badge-warning" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                💳 {b.periode_bulan || 'Satu Kali Bayar (Bebas / Bisa Dicicil)'}
                              </span>
                              <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                                {sudah > 0
                                  ? `Sudah Dicicil: ${formatRupiah(sudah)}`
                                  : 'Tagihan Tipe Bebas (Dapat Dicicil)'}
                              </div>
                            </td>

                            <td style={{ fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>
                              {formatRupiah(b.total_tagihan)}
                            </td>

                            <td style={{ fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>
                              {formatRupiah(sisa)}
                            </td>

                            <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right' }}>
                              {isChecked ? (
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%', maxWidth: '170px' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Rp</span>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={formatNumberWithSeparator(selectedPayMap[b.id])}
                                      onChange={(e) => handleChangeNominalBayar(b.id, sisa, e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        border: '1.5px solid #d97706',
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        color: '#0f172a',
                                        background: '#ffffff',
                                        textAlign: 'right'
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: '3px', marginTop: '3px', width: '100%', justifyContent: 'flex-end' }}>
                                    {[
                                      { label: '50%', val: Math.round(sisa * 0.5) },
                                      { label: 'Lunas', val: sisa }
                                    ].map((qBtn) => (
                                      <button
                                        key={qBtn.label}
                                        type="button"
                                        onClick={() => handleChangeNominalBayar(b.id, sisa, qBtn.val)}
                                        style={{
                                          flex: 1,
                                          fontSize: '0.62rem',
                                          fontWeight: 700,
                                          padding: '1px 3px',
                                          borderRadius: '3px',
                                          border: '1px solid #cbd5e1',
                                          background: '#f8fafc',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {qBtn.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {tagihanBebas.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.76rem' }}>
                            Tidak ada tagihan tipe bebas yang belum lunas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* =================================================================
               SUB-TAB RIWAYAT BAYAR SANTRI
            ================================================================= */
            <div className="table-container-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="td-center" style={{ width: '42px' }}>NO</th>
                    <th>NOMOR TRANSAKSI & KUITANSI</th>
                    <th>RINCIAN POS YANG DIBAYAR</th>
                    <th className="td-center">METODE</th>
                    <th style={{ textAlign: 'right' }}>TOTAL DIBAYAR</th>
                    <th className="td-center">STATUS</th>
                    <th>TANGGAL BAYAR</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatSantri.map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.nomor_transaksi}</div>
                        <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>
                          Kuitansi: {r.kuitansi_nomor || '-'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#334155' }}>
                        {r.item_dibayar || r.keterangan || '-'}
                      </td>
                      <td className="td-center">
                        <span className="badge badge-info">{r.channel_pembayaran || r.metode_pembayaran}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        {formatRupiah(r.total_bayar)}
                      </td>
                      <td className="td-center">
                        <span className="badge badge-success">{r.status_pembayaran}</span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {r.tanggal_bayar ? new Date(r.tanggal_bayar).toLocaleString('id-ID') : '-'}
                      </td>
                    </tr>
                  ))}
                  {riwayatSantri.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada riwayat transaksi pembayaran untuk santri ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =================================================================
              FLOATING STICKY CHECKOUT BAR SAAT ADA TAGIHAN YANG DICENTANG
          ================================================================= */}
          {selectedIds.length > 0 && (
            <div
              style={{
                position: 'fixed',
                bottom: '16px',
                left: '260px',
                right: '24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '14px',
                padding: '14px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.45)',
                border: '1px solid rgba(255,255,255,0.15)',
                zIndex: 900
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
                    TOTAL PEMBAYARAN ({selectedIds.length} TAGIHAN TERPILIH)
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                    {formatRupiah(totalSelectedBayar)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={metodeBayarKasir}
                  onChange={(e) => setMetodeBayarKasir(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="Tunai / Kasir" style={{ color: '#0f172a' }}>Cash / Tunai (Langsung Sah)</option>
                  <option value="Transfer Bank (Pending)" style={{ color: '#0f172a' }}>Transfer Bank (Belum Masuk / Pending)</option>
                  <option value="Transfer Bank (Sah)" style={{ color: '#0f172a' }}>Transfer Bank (Sudah Masuk Rekening)</option>
                  <option value="QRIS Pesantren" style={{ color: '#0f172a' }}>QRIS Pesantren (Langsung Sah)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSelectedPayMap({})}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'transparent',
                    color: '#cbd5e1',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Reset Pilihan
                </button>

                <button
                  type="button"
                  disabled={processingPay}
                  onClick={handleProsesPembayaranKasir}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <CheckCircle2 size={16} />
                  {processingPay ? 'Memproses...' : `Proses Pembayaran (${formatRupiah(totalSelectedBayar)})`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 2: REKAP TUNGGAKAN SEMUA SANTRI & LOG TRANSAKSI
      ========================================================================= */}
      {viewMode === 'rekap' && (
        <div>
          <div className="top-stats-grid">
            <div className="stat-card-colored stat-card-blue">
              <div>
                <div className="stat-colored-title">TOTAL TAGIHAN DITERBITKAN</div>
                <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
                  {formatRupiah(dataRekap.summary?.total_nominal_tagihan)}
                </div>
              </div>
              <div className="stat-colored-icon-box"><DollarSign size={22} /></div>
            </div>

            <div className="stat-card-colored stat-card-green">
              <div>
                <div className="stat-colored-title">PEMBAYARAN TERVERIFIKASI</div>
                <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
                  {formatRupiah(dataRekap.summary?.total_terbayar)}
                </div>
              </div>
              <div className="stat-colored-icon-box"><CheckCircle2 size={22} /></div>
            </div>

            <div className="stat-card-colored stat-card-amber">
              <div>
                <div className="stat-colored-title">TOTAL SISA TUNGGAKAN</div>
                <div className="stat-colored-number" style={{ fontSize: '1.35rem' }}>
                  {formatRupiah(dataRekap.summary?.total_tunggakan)}
                </div>
              </div>
              <div className="stat-colored-icon-box"><Clock size={22} /></div>
            </div>

            <div className="stat-card-colored stat-card-purple">
              <div>
                <div className="stat-colored-title">POS KOMPONEN BIAYA</div>
                <div className="stat-colored-number">{dataRekap.komponenBiaya?.length || 0} Pos</div>
              </div>
              <div className="stat-colored-icon-box"><Layers size={22} /></div>
            </div>
          </div>

          <div className="tab-filter-bar">
            <button className={`tab-btn ${rekapTab === 'buku_kas' ? 'active' : ''}`} onClick={() => setRekapTab('buku_kas')}>
              3 Kantong Saldo &amp; Buku Kas
            </button>
            <button className={`tab-btn ${rekapTab === 'semua' ? 'active' : ''}`} onClick={() => setRekapTab('semua')}>
              Daftar Semua Tagihan ({dataRekap.semuaTagihan?.length || 0})
            </button>
            <button className={`tab-btn ${rekapTab === 'tunggakan' ? 'active' : ''}`} onClick={() => setRekapTab('tunggakan')}>
              Rekap Tunggakan per Santri ({dataRekap.tunggakanSantri?.length || 0})
            </button>
            <button className={`tab-btn ${rekapTab === 'transaksi' ? 'active' : ''}`} onClick={() => setRekapTab('transaksi')}>
              Log Transaksi &amp; Kuitansi ({dataRekap.transaksiTerakhir?.length || 0})
            </button>
            <button className={`tab-btn ${rekapTab === 'pending' ? 'active' : ''}`} onClick={() => setRekapTab('pending')}>
              Pending Transfer ({dataRekap.transaksiPending?.length || 0})
            </button>
          </div>

          {rekapTab === 'buku_kas' ? (
            <div style={{ marginTop: '14px' }}>
              <PanelKantongDanBukuKas onDataChanged={fetchRekap} />
            </div>
          ) : (
            <>
          <div className="filter-search-box">
            <div className="filter-search-input">
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Cari santri, NIS, kode tagihan, atau nomor kuitansi..."
                value={rekapSearch}
                onChange={(e) => setRekapSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container-card">
            {rekapTab === 'semua' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="td-center" style={{ width: '40px' }}>NO</th>
                    <th>SANTRI & NIS</th>
                    <th>POS TAGIHAN & PERIODE</th>
                    <th className="td-center">KATEGORI</th>
                    <th style={{ textAlign: 'right' }}>TOTAL</th>
                    <th style={{ textAlign: 'right' }}>DIBAYAR</th>
                    <th style={{ textAlign: 'right' }}>SISA</th>
                    <th className="td-center">STATUS</th>
                    <th className="td-center" style={{ width: '110px' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataRekap.semuaTagihan || [])
                    .filter((t) => {
                      if (!rekapSearch.trim()) return true;
                      const q = rekapSearch.toLowerCase();
                      return (
                        (t.nama_santri || '').toLowerCase().includes(q) ||
                        (t.nis || '').toLowerCase().includes(q) ||
                        (t.judul_tagihan || '').toLowerCase().includes(q)
                      );
                    })
                    .map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="td-center">{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                          <div style={{ fontSize: '0.68rem', color: '#0284c7' }}>NIS: {item.nis}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.judul_tagihan}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {item.kode_tagihan} • {item.periode_bulan || '-'}
                          </div>
                        </td>
                        <td className="td-center">
                          <span className={`badge ${item.kategori === 'Bulanan' ? 'badge-info' : 'badge-purple'}`}>
                            {item.kategori}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatRupiah(item.total_tagihan)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{formatRupiah(item.sudah_dibayar)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{formatRupiah(item.sisa_tagihan)}</td>
                        <td className="td-center">
                          <span className={`badge ${item.status === 'Lunas' ? 'badge-success' : item.status === 'Cicilan' ? 'badge-warning' : 'badge-danger'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="td-center">
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn-action btn-action-edit" onClick={() => openEditTagihan(item)} title="Edit / Cicil">
                              <Edit3 size={13} />
                            </button>
                            <button className="btn-action btn-action-delete" onClick={() => handleDeleteTagihan(item)} title="Hapus">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {rekapTab === 'tunggakan' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="td-center" style={{ width: '40px' }}>NO</th>
                    <th>NAMA SANTRI & NIS</th>
                    <th>ASRAMA</th>
                    <th style={{ textAlign: 'right' }}>TUNGGAKAN BULANAN</th>
                    <th style={{ textAlign: 'right' }}>TUNGGAKAN BEBAS</th>
                    <th style={{ textAlign: 'right' }}>TOTAL TUNGGAKAN</th>
                    <th className="td-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataRekap.tunggakanSantri || []).map((item, idx) => (
                    <tr key={item.santri_id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#0284c7' }}>NIS: {item.nis}</div>
                      </td>
                      <td>{item.nama_asrama || '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatRupiah(item.tunggakan_bulanan)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>{formatRupiah(item.tunggakan_biaya_masuk)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>{formatRupiah(item.total_tunggakan)}</td>
                      <td className="td-center">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedSantriId(String(item.santri_id));
                            setSantriSearchText(`${item.nama_santri} (${item.nis})`);
                            setViewMode('kasir');
                          }}
                        >
                          Buka Kasir Santri
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {rekapTab === 'transaksi' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="td-center" style={{ width: '40px' }}>NO</th>
                    <th>NOMOR TRANSAKSI</th>
                    <th>NAMA SANTRI</th>
                    <th className="td-center">METODE</th>
                    <th style={{ textAlign: 'right' }}>TOTAL BAYAR</th>
                    <th>KUITANSI</th>
                    <th>TANGGAL BAYAR</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataRekap.transaksiTerakhir || []).map((trx, idx) => (
                    <tr key={trx.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td><code>{trx.nomor_transaksi}</code></td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{trx.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>NIS: {trx.nis}</div>
                      </td>
                      <td className="td-center"><span className="badge badge-info">{trx.channel_pembayaran || trx.metode_pembayaran}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#059669' }}>{formatRupiah(trx.total_bayar)}</td>
                      <td><code>{trx.kuitansi_nomor || '-'}</code></td>
                      <td>{trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {rekapTab === 'pending' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="td-center" style={{ width: '40px' }}>NO</th>
                    <th>NOMOR TRANSAKSI</th>
                    <th>NAMA SANTRI</th>
                    <th className="td-center">METODE</th>
                    <th style={{ textAlign: 'right' }}>NOMINAL</th>
                    <th className="td-center">STATUS</th>
                    <th className="td-center">AKSI VERIFIKASI</th>
                  </tr>
                </thead>
                <tbody>
                  {(dataRekap.transaksiPending || []).map((trx, idx) => (
                    <tr key={trx.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td><code>{trx.nomor_transaksi}</code></td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{trx.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          NIS: {trx.nis} {trx.rincian_item ? `• ${trx.rincian_item}` : ''}
                        </div>
                      </td>
                      <td className="td-center"><span className="badge badge-warning">{trx.channel_pembayaran || trx.metode_pembayaran || 'Transfer'}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#d97706' }}>{formatRupiah(trx.total_bayar)}</td>
                      <td className="td-center"><span className="badge badge-warning">Pending (Belum Masuk Kas)</span></td>
                      <td className="td-center">
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={processingPay}
                            onClick={() => handleKonfirmasiTransferPendingAdmin(trx)}
                            style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                          >
                            Konfirmasi Masuk
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled={processingPay}
                            onClick={() => handleBatalkanPendingAdmin(trx)}
                            style={{ padding: '5px 10px', fontSize: '0.72rem', color: '#dc2626', borderColor: '#fecaca' }}
                          >
                            Batal
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!dataRekap.transaksiPending || dataRekap.transaksiPending.length === 0) && (
                    <tr>
                      <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada transaksi transfer yang masih pending.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL TAMBAH / EDIT TAGIHAN CUSTOM (FULL-SCREEN 2 KOLOM TANPA JUDUL MANUAL)
      ========================================================================= */}
      {isModalOpen && (() => {
        const selectedSantriObj = santriList.find((s) => String(s.id) === String(formTagihan.santri_id));
        const selectedKompObj = (dataRekap.komponenBiaya || []).find((k) => String(k.id) === String(formTagihan.komponen_id));
        const isBulananKomp = !selectedKompObj || selectedKompObj.kategori === 'Bulanan';

        const filteredModalKomponen = (dataRekap.komponenBiaya || []).filter((k) => {
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
          : 'Pilih Komponen Biaya';

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
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
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CreditCard size={22} />
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                      {formMode === 'add' ? 'Tambah Tagihan Custom Santri' : 'Kelola Tagihan & Cicilan Santri'}
                    </h3>
                    <div style={{ fontSize: '0.74rem', color: '#d1fae5' }}>
                      Pilih Pos Biaya Bulanan atau Satu Kali Bayar (Bisa Dicicil)
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <X size={16} /> Tutup
                </button>
              </div>

              <form
                onSubmit={handleSimpanTagihan}
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div
                  style={{
                    padding: '22px 24px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                    gap: '22px',
                    alignItems: 'start'
                  }}
                >
                  {/* Kolom Kiri */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                        1. Pilih Santri *
                      </label>
                      <SearchableSelect
                        options={santriList.map((s) => ({
                          value: s.id,
                          label: s.nama_santri,
                          sublabel: `NIS: ${s.nis} • ${s.nama_asrama || 'Asrama'}`
                        }))}
                        value={formTagihan.santri_id}
                        onChange={(val) => setFormTagihan({ ...formTagihan, santri_id: val })}
                        placeholder="-- Pilih atau cari santri --"
                      />
                      {selectedSantriObj && (
                        <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#0369a1', fontWeight: 700 }}>
                          NIS: {selectedSantriObj.nis} • {selectedSantriObj.nama_asrama || 'Asrama'}
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>2. Pilih Komponen Pos Biaya *</label>
                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                          {['Semua', 'Bulanan', 'Sekali Bayar'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setModalFilterTipe(t)}
                              style={{
                                border: 'none',
                                padding: '4px 9px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: modalFilterTipe === t ? '#0284c7' : 'transparent',
                                color: modalFilterTipe === t ? '#fff' : '#64748b'
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                        {filteredModalKomponen.map((k) => {
                          const isSelected = String(formTagihan.komponen_id) === String(k.id);
                          const isBulan = k.kategori === 'Bulanan';
                          return (
                            <div
                              key={k.id}
                              onClick={() => {
                                const nextPeriode = isBulan ? 'November 2026' : 'TA 2026/2027 (Satu Kali Bayar)';
                                const nextTotal = String(parseFloat(k.nominal_default || 0));
                                setFormTagihan({
                                  ...formTagihan,
                                  komponen_id: String(k.id),
                                  total_tagihan: nextTotal,
                                  sudah_dibayar: skemaBayar === 'lunas' ? nextTotal : formTagihan.sudah_dibayar,
                                  periode_bulan: nextPeriode
                                });
                              }}
                              style={{
                                padding: '12px',
                                borderRadius: '10px',
                                border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                                background: isSelected ? '#ecfdf5' : '#ffffff',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: isBulan ? '#0284c7' : '#d97706' }}>
                                {isBulan ? 'SPP RUTIN BULANAN' : 'BEBAS / SATU KALI BAYAR'}
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a', margin: '4px 0' }}>
                                {k.nama_komponen}
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#059669' }}>
                                {formatRupiah(k.nominal_default)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                        3. Periode & Jatuh Tempo
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                            Periode Tagihan
                          </label>
                          {isBulananKomp ? (
                            <select
                              value={formTagihan.periode_bulan}
                              onChange={(e) => setFormTagihan({ ...formTagihan, periode_bulan: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                            >
                              {[
                                'Oktober 2026', 'November 2026', 'Desember 2026', 'Januari 2027',
                                'Februari 2027', 'Maret 2027', 'April 2027', 'Mei 2027', 'Juni 2027'
                              ].map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={formTagihan.periode_bulan}
                              onChange={(e) => setFormTagihan({ ...formTagihan, periode_bulan: e.target.value })}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                            />
                          )}
                        </div>
                        <div>
                          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                            Jatuh Tempo
                          </label>
                          <input
                            type="date"
                            value={formTagihan.jatuh_tempo}
                            onChange={(e) => setFormTagihan({ ...formTagihan, jatuh_tempo: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                        4. Nominal Total Tagihan (Rp) *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '14px', fontSize: '0.9rem', fontWeight: 700, color: '#64748b' }}>Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={formatNumberWithSeparator(formTagihan.total_tagihan)}
                          onChange={(e) => setFormTagihan({ ...formTagihan, total_tagihan: String(parseNumberFromFormatted(e.target.value)) })}
                          placeholder="0"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 44px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            boxSizing: 'border-box',
                            textAlign: 'right'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                        5. Skema Pembayaran (Belum Bayar / Cicilan / Lunas)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: skemaBayar === 'cicil' ? '12px' : 0 }}>
                        {[
                          { id: 'belum', label: '⏳ Belum Bayar' },
                          { id: 'cicil', label: '💳 Bayar Cicilan' },
                          { id: 'lunas', label: '✅ Langsung Lunas' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSkemaBayar(s.id);
                              if (s.id === 'belum') setFormTagihan({ ...formTagihan, sudah_dibayar: '0' });
                              if (s.id === 'lunas') setFormTagihan({ ...formTagihan, sudah_dibayar: String(totalNum) });
                              if (s.id === 'cicil') setFormTagihan({ ...formTagihan, sudah_dibayar: String(Math.round(totalNum * 0.5)) });
                            }}
                            style={{
                              padding: '10px',
                              borderRadius: '8px',
                              border: skemaBayar === s.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              background: skemaBayar === s.id ? '#e0f2fe' : '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              cursor: 'pointer'
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {skemaBayar === 'cicil' && (
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', display: 'block', marginBottom: '4px' }}>
                            Nominal Cicilan Dibayar (Rp)
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '12px', fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>Rp</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formatNumberWithSeparator(formTagihan.sudah_dibayar)}
                              onChange={(e) => setFormTagihan({ ...formTagihan, sudah_dibayar: String(parseNumberFromFormatted(e.target.value)) })}
                              style={{
                                width: '100%',
                                padding: '10px 12px 10px 42px',
                                borderRadius: '8px',
                                border: '1.5px solid #f59e0b',
                                fontWeight: 800,
                                boxSizing: 'border-box',
                                textAlign: 'right'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#0f172a', color: '#ffffff', borderRadius: '14px', padding: '18px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>RINGKASAN TAGIHAN</div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 800, margin: '4px 0 12px' }}>{autoJudulPreview}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Total</div>
                          <div style={{ fontWeight: 800 }}>{formatRupiah(totalNum)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dibayar</div>
                          <div style={{ fontWeight: 800, color: '#34d399' }}>{formatRupiah(dibayarNum)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Sisa</div>
                          <div style={{ fontWeight: 800, color: '#f87171' }}>{formatRupiah(sisaNum)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px 24px', background: '#ffffff', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Batal</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    <Save size={14} /> {submitting ? 'Menyimpan...' : 'Simpan Tagihan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL MASTER POS KOMPONEN BIAYA
      ========================================================================= */}
      {isKomponenModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div style={{ background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '620px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>Master Pos Komponen Biaya (SPP Bulanan & Bebas Non-Bulanan)</span>
              <button type="button" onClick={() => setIsKomponenModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSimpanKomponen} style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  required
                  placeholder="Nama Pos Biaya (misal: SPP Bulanan)"
                  value={formKomponen.nama_komponen}
                  onChange={(e) => setFormKomponen({ ...formKomponen, nama_komponen: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
                <select
                  value={formKomponen.kategori}
                  onChange={(e) => setFormKomponen({ ...formKomponen, kategori: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                >
                  <option value="Bulanan">SPP Rutin (Bulanan)</option>
                  <option value="Biaya Masuk">Tipe Bebas (Non-Bulanan)</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="Nominal Default (Rp)"
                  value={formKomponen.nominal_default}
                  onChange={(e) => setFormKomponen({ ...formKomponen, nominal_default: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="submit" disabled={savingKomp} className="btn btn-primary">
                  <Save size={14} /> {editingKompId ? 'Update Pos Biaya' : 'Tambah Pos Biaya'}
                </button>
              </div>
            </form>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(dataRekap.komponenBiaya || []).map((k) => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{k.nama_komponen}</div>
                    <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>
                      {k.kategori} • {formatRupiah(k.nominal_default)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-action btn-action-edit"
                      onClick={() => {
                        setEditingKompId(k.id);
                        setFormKomponen({
                          nama_komponen: k.nama_komponen,
                          kategori: k.kategori,
                          nominal_default: String(k.nominal_default),
                          deskripsi: k.deskripsi || ''
                        });
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button type="button" className="btn-action btn-action-delete" onClick={() => handleDeleteKomponen(k)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN SIKLUS & JATUH TEMPO SPP */}
      {isSiklusModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '480px', width: '92%', borderRadius: '14px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', background: '#0284c7', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem' }}>
                <Calendar size={18} /> Pengaturan Siklus & Jatuh Tempo SPP
              </div>
              <button
                type="button"
                onClick={() => setIsSiklusModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSimpanSiklus} style={{ padding: '20px' }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.5 }}>
                💡 <b>Aturan Otomatis:</b> Tagihan SPP terbit setiap <b>Tanggal Terbit</b>. Bila santri belum membayar melewati <b>Tanggal Jatuh Tempo</b>, tagihan otomatis berubah status menjadi <b>Tunggakan SPP</b>.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    📅 Tanggal Terbit Tagihan
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tgl</span>
                    <input
                      type="number"
                      min="1"
                      max="28"
                      required
                      value={siklusData.tgl_terbit_spp}
                      onChange={(e) => setSiklusData({ ...siklusData, tgl_terbit_spp: parseInt(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Default: Tanggal 5</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    ⏰ Batas Jatuh Tempo (Maks)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Tgl</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={siklusData.tgl_jatuh_tempo_spp}
                      onChange={(e) => setSiklusData({ ...siklusData, tgl_jatuh_tempo_spp: parseInt(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #f87171', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', color: '#b91c1c', background: '#fef2f2' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>Lewat tgl ini = Tunggakan</span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={siklusData.apply_to_existing}
                    onChange={(e) => setSiklusData({ ...siklusData, apply_to_existing: e.target.checked })}
                    style={{ accentColor: '#0284c7', width: '15px', height: '15px' }}
                  />
                  Terapkan perubahan tanggal jatuh tempo ini ke semua tagihan SPP yang belum lunas
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsSiklusModalOpen(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSiklus}
                  className="btn btn-primary"
                  style={{ background: '#0284c7', borderColor: '#0284c7', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <Save size={14} /> {savingSiklus ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RINCIAN BIAYA AWAL MASUK PER JENJANG SEKOLAH (SMP / SMA / SMK) */}
      {isRincianBiayaModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#0f766e', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem' }}>
                <FileText size={18} /> RINCIAN AWAL MASUK 2026/2027
              </div>
              <button
                type="button"
                onClick={() => setIsRincianBiayaModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Tab Pilihan Jenjang */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                {['SMP', 'SMA', 'SMK'].map((j) => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setRincianBiayaTab(j)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      background: rincianBiayaTab === j ? '#0f766e' : 'transparent',
                      color: rincianBiayaTab === j ? '#ffffff' : '#475569',
                      transition: 'all 0.2s'
                    }}
                  >
                    Jenjang {j} ({j === 'SMP' ? 'Rp 2.395.000' : j === 'SMA' ? 'Rp 2.605.000' : 'Rp 2.965.000'})
                  </button>
                ))}
              </div>

              {/* Tabel Rincian Resmi Sesuai Lampiran */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>KOMPONEN</th>
                      <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>URAIAN BIAYA</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>BIAYA</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Adm Sekolah */}
                    <tr style={{ background: '#faf5ff' }}>
                      <td rowSpan={rincianBiayaTab === 'SMK' ? 10 : rincianBiayaTab === 'SMA' ? 8 : 7} style={{ verticalAlign: 'top', padding: '8px 10px', fontWeight: 800, color: '#7e22ce', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        Adm Sekolah
                      </td>
                      <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1' }}>Pendaftaran</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 100.000</td>
                      <td rowSpan={rincianBiayaTab === 'SMK' ? 10 : rincianBiayaTab === 'SMA' ? 8 : 7} style={{ verticalAlign: 'middle', textAlign: 'right', padding: '8px 10px', fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>
                        {rincianBiayaTab === 'SMK' ? 'Rp 1.400.000' : rincianBiayaTab === 'SMA' ? 'Rp 1.040.000' : 'Rp 890.000'}
                      </td>
                    </tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Kartu Siswa</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 15.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Logo</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 25.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Kaos</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 100.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Kemeja</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 100.000</td></tr>
                    {(rincianBiayaTab === 'SMA' || rincianBiayaTab === 'SMK') && (
                      <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Almamater</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 150.000</td></tr>
                    )}
                    {rincianBiayaTab === 'SMK' && (
                      <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Baju Praktek</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 110.000</td></tr>
                    )}
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Sampul Raport</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 50.000</td></tr>
                    {rincianBiayaTab === 'SMK' && (
                      <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Alat Praktek</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 250.000</td></tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Bangunan</td>
                      <td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 500.000</td>
                    </tr>

                    {/* Adm Pesantren */}
                    <tr style={{ background: '#f0fdf4' }}>
                      <td rowSpan={10} style={{ verticalAlign: 'top', padding: '8px 10px', fontWeight: 800, color: '#15803d', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                        Adm Pesantren
                      </td>
                      <td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>K. Mahrom</td>
                      <td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 15.000</td>
                      <td rowSpan={10} style={{ verticalAlign: 'middle', textAlign: 'right', padding: '8px 10px', fontWeight: 800, fontSize: '0.85rem', color: '#15803d', borderBottom: '1px solid #cbd5e1' }}>
                        Rp 1.000.000
                      </td>
                    </tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>B. Raport</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 60.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Tafrij</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 50.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Mufrodat</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 30.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Buku Muhafadoh</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 20.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Nametag</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 15.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Infaq</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 500.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>OPPN</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 100.000</td></tr>
                    <tr><td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Ziarah</td><td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 120.000</td></tr>
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '4px 10px', borderRight: '1px solid #cbd5e1' }}>Peralatan Dapur</td>
                      <td style={{ padding: '4px 10px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rp 90.000</td>
                    </tr>

                    {/* SPP Juli */}
                    <tr style={{ background: '#eff6ff', borderBottom: '2px solid #0f766e' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#1d4ed8', borderRight: '1px solid #cbd5e1' }}>
                        SPP Rutin
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, borderRight: '1px solid #cbd5e1' }}>Makan dan SPP Sekolah (Juli)</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, borderRight: '1px solid #cbd5e1' }}>
                        {rincianBiayaTab === 'SMP' ? 'Rp 505.000' : 'Rp 565.000'}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#1d4ed8' }}>
                        {rincianBiayaTab === 'SMP' ? 'Rp 505.000' : 'Rp 565.000'}
                      </td>
                    </tr>

                    {/* Grand Total */}
                    <tr style={{ background: '#0f766e', color: '#ffffff', fontWeight: 800, fontSize: '0.88rem' }}>
                      <td colSpan={3} style={{ padding: '12px 14px', textAlign: 'right' }}>
                        TOTAL RINCIAN AWAL MASUK ({rincianBiayaTab}):
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        {rincianBiayaTab === 'SMK' ? 'Rp 2.965.000' : rincianBiayaTab === 'SMA' ? 'Rp 2.605.000' : 'Rp 2.395.000'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsRincianBiayaModalOpen(false)}
                  className="btn btn-primary"
                  style={{ background: '#0f766e', borderColor: '#0f766e', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}