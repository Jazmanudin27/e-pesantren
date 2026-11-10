import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  CreditCard,
  Wallet,
  BarChart3,
  FileText,
  AlertTriangle,
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  X,
  ChevronRight,
  ArrowLeft,
  RotateCw,
  Zap,
  Building,
  UserCheck,
  Check,
  Share2,
  DollarSign,
  Calendar,
  Users,
  Sparkles,
  Trash2
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import ModalGenerateTagihan from '../keuangan/components/ModalGenerateTagihan';
import PanelKantongDanBukuKas from '../keuangan/components/PanelKantongDanBukuKas';

export default function MobileKeuangan({ initialSubTab = 'kasir', onBackToHome }) {
  // Sub-tabs: 'kasir' | 'laporan'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialSubTab === 'keuangan-rekap' || initialSubTab === 'laporan' || initialSubTab === 'rekap') return 'laporan';
    return 'kasir';
  });

  // Data Global Keuangan
  const [loading, setLoading] = useState(false);
  const [rekapData, setRekapData] = useState({
    summary: {},
    transaksiTerakhir: [],
    tunggakanSantri: [],
    komponenBiaya: [],
    semuaTagihan: []
  });

  // State Santri & Kasir
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [santriSearch, setSantriSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [santriTagihan, setSantriTagihan] = useState({ bulanan: [], bebas: [], riwayat: [] });
  const [loadingTagihan, setLoadingTagihan] = useState(false);
  const [kasirSantriTab, setKasirSantriTab] = useState('tagihan'); // 'tagihan' | 'histori'

  // State Checklist Pembayaran Kasir: { [tagihan_id]: nominal_bayar }
  const [selectedPayMap, setSelectedPayMap] = useState({});
  const [metodeBayar, setMetodeBayar] = useState('Tunai / Kasir');
  const [processingPay, setProcessingPay] = useState(false);

  // Modal Kuitansi Sukses
  const [kuitansiModal, setKuitansiModal] = useState({
    isOpen: false,
    data: null
  });

  // Modal Pilih Metode Pembayaran (Cash, QRIS Midtrans, Transfer Bank)
  const [isMetodeModalOpen, setIsMetodeModalOpen] = useState(false);

  // Filter List SPP & Transaksi & Laporan
  const [sppFilter, setSppFilter] = useState('semua'); // 'semua' | 'nunggak' | 'lunas'
  const [sppSearch, setSppSearch] = useState('');
  const [filterTrxTab, setFilterTrxTab] = useState('Berhasil'); // 'Berhasil' | 'Pending'
  const [midtransFilter, setMidtransFilter] = useState('semua'); // 'semua' | 'Berhasil' | 'Pending' | 'Batal'
  const [checkingMidtransId, setCheckingMidtransId] = useState(null);
  const [laporanSearch, setLaporanSearch] = useState('');
  const [laporanFilterSekolah, setLaporanFilterSekolah] = useState('semua');
  const [kasirFilterSekolah, setKasirFilterSekolah] = useState('semua');
  const [kasirFilterKelas, setKasirFilterKelas] = useState('semua');
  const [santriDisplayLimit, setSantriDisplayLimit] = useState(50);

  // Reset limit tampilan ke 50 setiap ganti filter atau kata kunci
  useEffect(() => {
    setSantriDisplayLimit(50);
  }, [kasirFilterSekolah, kasirFilterKelas, santriSearch]);

  // Daftar filter kelas dinamis berdasarkan sekolah yang dipilih
  const availableKelasList = React.useMemo(() => {
    const list = [];
    if (kasirFilterSekolah === 'SMP') {
      list.push('Kelas 7', 'Kelas 8', 'Kelas 9');
    } else if (kasirFilterSekolah === 'SMA' || kasirFilterSekolah === 'SMK') {
      list.push('Kelas 10', 'Kelas 11', 'Kelas 12');
    } else {
      list.push('Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12');
    }
    (santriList || []).forEach(s => {
      const k = s.tingkat_sekolah || s.nama_kelas;
      if (k && !list.some(x => x.toLowerCase() === String(k).toLowerCase())) {
        list.push(k);
      }
    });
    return list;
  }, [kasirFilterSekolah, santriList]);

  // Filter santri komprehensif (sekolah, kelas, search) dari SELURUH data santri database
  const filteredKasirSantri = React.useMemo(() => {
    return (santriList || []).filter((s) => {
      if (kasirFilterSekolah !== 'semua') {
        const sk = String(s.nama_sekolah || s.sekolah_jenjang || s.tingkat_sekolah || '').toUpperCase();
        if (!sk.includes(kasirFilterSekolah.toUpperCase())) return false;
      }
      if (kasirFilterKelas !== 'semua') {
        const kl = String(s.tingkat_sekolah || s.nama_kelas || '').toLowerCase();
        if (!kl.includes(kasirFilterKelas.toLowerCase())) return false;
      }
      if (!santriSearch.trim()) return true;
      const q = santriSearch.toLowerCase().trim();
      return (
        (s.nama_santri || '').toLowerCase().includes(q) ||
        (s.nis || '').toLowerCase().includes(q) ||
        (s.nisn || '').toLowerCase().includes(q) ||
        (s.nama_asrama || '').toLowerCase().includes(q) ||
        (s.nama_sekolah || '').toLowerCase().includes(q) ||
        (s.nama_kelas || '').toLowerCase().includes(q)
      );
    });
  }, [santriList, kasirFilterSekolah, kasirFilterKelas, santriSearch]);

  // Santri yang ditampilkan di grid: 50 saat browsing, atau bertahap sesuai santriDisplayLimit
  const displayedSantri = React.useMemo(() => {
    return filteredKasirSantri.slice(0, santriDisplayLimit);
  }, [filteredKasirSantri, santriDisplayLimit]);

  // Sync initial tab jika berubah dari luar: hanya kasir atau laporan
  useEffect(() => {
    if (initialSubTab === 'keuangan-rekap' || initialSubTab === 'laporan' || initialSubTab === 'rekap') {
      setActiveTab('laporan');
    } else {
      setActiveTab('kasir');
    }
  }, [initialSubTab]);

  // 1. Fetch data santri kasir ultra cepat (< 50ms, tanpa payload foto base64 berat)
  const fetchSantriList = async () => {
    try {
      const res = await axios.get('/api/keuangan/kasir/santri-search');
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      }
    } catch (e) {
      console.warn('Fallback ambil santri standar:', e);
      try {
        const fallbackRes = await axios.get('/api/santri?limit=1000');
        if (fallbackRes?.data?.data && Array.isArray(fallbackRes.data.data)) {
          setSantriList(fallbackRes.data.data);
        }
      } catch (err) {}
    }
  };

  // 2. Fetch rekap keuangan admin
  const fetchRekapKeuangan = async () => {
    try {
      const resRekap = await axios.get('/api/keuangan/admin/rekap');
      if (resRekap?.data?.success && resRekap.data.data) {
        setRekapData(resRekap.data.data);
      }
    } catch (e) {
      console.warn('Gagal memuat rekap kas:', e);
    }
  };

  // Load Santri & Rekap secara non-blocking
  const fetchRekapAndSantri = () => {
    fetchSantriList();
    if (activeTab === 'laporan') {
      fetchRekapKeuangan();
    }
  };

  useEffect(() => {
    fetchSantriList();
  }, []);

  useEffect(() => {
    if (activeTab === 'laporan') {
      fetchRekapKeuangan();
    }
  }, [activeTab]);

  // Live search backend saat user mengetik kata kunci pencarian
  useEffect(() => {
    if (!santriSearch.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/keuangan/kasir/santri-search?q=${encodeURIComponent(santriSearch.trim())}&limit=150`);
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setSantriList((prev) => {
            const map = new Map((prev || []).map((item) => [item.id, item]));
            res.data.data.forEach((item) => map.set(item.id, item));
            return Array.from(map.values());
          });
        }
      } catch (e) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [santriSearch]);

  // Fetch Tagihan saat Santri dipilih
  const fetchTagihanSantri = async (santriId) => {
    if (!santriId) return;
    setLoadingTagihan(true);
    setSelectedPayMap({});
    try {
      let res = await axios.get(`/api/keuangan/tagihan/${santriId}`).catch(() => null);
      if (!res?.data?.success) {
        res = await axios.get(`/api/keuangan/wali/dashboard?santri_id=${santriId}`).catch(() => null);
      }
      if (res?.data?.success && res.data.data) {
        const d = res.data.data;
        const allBebas = [
          ...(d.biayaAwalMasuk || []),
          ...(d.tagihanLainnya || []),
          ...(d.tagihanBebas || [])
        ];
        const uniqueBebas = [];
        const seen = new Set();
        allBebas.forEach((b) => {
          if (b && b.id && !seen.has(b.id)) {
            seen.add(b.id);
            uniqueBebas.push(b);
          }
        });

        setSantriTagihan({
          bulanan: d.tagihanBulanan || [],
          bebas: uniqueBebas,
          riwayat: d.riwayatTransaksi || []
        });
      } else {
        setSantriTagihan({ bulanan: [], bebas: [], riwayat: [] });
      }
    } catch (err) {
      console.warn('Gagal memuat tagihan santri:', err);
      setSantriTagihan({ bulanan: [], bebas: [], riwayat: [] });
    } finally {
      setLoadingTagihan(false);
    }
  };

  const handleSelectSantri = (santri) => {
    setSelectedSantri(santri);
    setSantriSearch('');
    setIsSearching(false);
    setKasirSantriTab('tagihan');
    fetchTagihanSantri(santri.id);
  };

  // Cek apakah ada santri yang dipilih dari halaman Tunggakan
  useEffect(() => {
    const saved = localStorage.getItem('selected_kasir_santri');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        localStorage.removeItem('selected_kasir_santri');
        handleSelectSantri(s);
      } catch (_) {}
    }
  }, []);

  // Toggle Checkbox Tagihan
  const handleTogglePay = (tagihanId, sisaNominal) => {
    setSelectedPayMap((prev) => {
      const copy = { ...prev };
      if (copy[tagihanId] !== undefined) {
        delete copy[tagihanId];
      } else {
        copy[tagihanId] = sisaNominal;
      }
      return copy;
    });
  };

  // Toggle Seluruh Tagihan Bebas / Non-Bulanan
  const handleToggleAllBebas = () => {
    const unpaidList = (santriTagihan.bebas || []).filter((t) => t.status !== 'Lunas');
    if (unpaidList.length === 0) return;
    const isAllChecked = unpaidList.every((t) => selectedPayMap[t.id] !== undefined);

    setSelectedPayMap((prev) => {
      const next = { ...prev };
      unpaidList.forEach((t) => {
        const sisa = parseFloat(t.sisa_tagihan || t.total_tagihan || 0);
        if (isAllChecked) {
          delete next[t.id];
        } else {
          next[t.id] = sisa;
        }
      });
      return next;
    });
  };

  // Hapus Tagihan Tertentu (Belum Lunas) Langsung dari Kasir
  const handleDeleteTagihan = async (t) => {
    const ok = await showConfirm(
      'Hapus Tagihan',
      `Hapus tagihan "${t.judul_tagihan}" sebesar Rp ${Number(t.total_tagihan || 0).toLocaleString('id-ID')}?`,
      'Ya, Hapus',
      'Batal'
    );
    if (!ok) return;

    try {
      const res = await axios.delete(`/api/keuangan/admin/tagihan/${t.id}`);
      if (res.data?.success) {
        toastSuccess('Tagihan Dihapus', `"${t.judul_tagihan}" berhasil dihapus.`);
        setSelectedPayMap((prev) => {
          const next = { ...prev };
          delete next[t.id];
          return next;
        });
        if (selectedSantri) {
          fetchTagihanSantri(selectedSantri.id);
        }
        fetchRekapAndSantri();
      }
    } catch (err) {
      showError('Gagal Hapus Tagihan', err.response?.data?.message || err.message);
    }
  };

  // Hitung Total Bayar yang Dicentang
  const selectedIds = Object.keys(selectedPayMap);
  const totalBayar = selectedIds.reduce((sum, id) => sum + (parseFloat(selectedPayMap[id]) || 0), 0);

  // Helper parsing item dibayar string / array ke struktur objek itemized
  const parseRincianItems = (data) => {
    if (!data) return [];
    if (Array.isArray(data.items_detail) && data.items_detail.length > 0) return data.items_detail;
    if (Array.isArray(data.items) && data.items.length > 0 && typeof data.items[0] === 'object' && data.items[0].judul) return data.items;

    const rawStr = data.item_dibayar || data.judul_tagihan || '';
    if (!rawStr) return [];

    // Pisahkan tiap item yang berakhiran "... (Rp xxx)"
    const rawItems = rawStr.split(/,\s*(?=[^,]+?\s*\(Rp\s*[0-9.])/i);
    return rawItems.map((itemStr) => {
      let str = itemStr.trim();
      let nominal = 0;
      let title = str;
      let kategori = '';

      const nomMatch = str.match(/\((?:Rp\.?\s*)?([0-9.,]+)\)\s*$/i);
      if (nomMatch) {
        nominal = parseFloat(nomMatch[1].replace(/\./g, '').replace(/,/g, '.')) || 0;
        title = str.slice(0, nomMatch.index).trim();
      }

      const catMatch = title.match(/^(.*?)\s*\(([^)]+)\)$/);
      if (catMatch) {
        title = catMatch[1].trim();
        kategori = catMatch[2].trim();
      }

      return { judul: title, kategori, nominal };
    });
  };

  // 1. Proses Pembayaran Langsung Kasir (Cash langsung Sah; Transfer bisa Pending atau Sudah Masuk)
  const handleProsesBayarLangsung = async (metodePilihan = 'Cash', statusBayar = 'Berhasil') => {
    setIsMetodeModalOpen(false);
    setProcessingPay(true);
    const isTf = metodePilihan === 'TF' || metodePilihan === 'Transfer';
    const isPending = statusBayar === 'Pending';
    const labelMetode = isTf ? 'Transfer Bank (TF)' : 'Cash / Tunai';

    try {
      const itemsPayload = selectedIds.map((id) => ({
        tagihan_id: parseInt(id),
        nominal: parseFloat(selectedPayMap[id]) || 0
      }));

      // Kumpulkan detail item untuk kuitansi modern
      const allTagihan = [...(santriTagihan.bulanan || []), ...(santriTagihan.bebas || []), ...(santriTagihan.biayaMasuk || [])];
      const itemsDetail = selectedIds.map((id) => {
        const found = allTagihan.find((t) => String(t.id) === String(id));
        const nom = parseFloat(selectedPayMap[id]) || 0;
        let judul = found ? (found.periode_bulan || found.judul_tagihan || 'Tagihan') : 'Tagihan';
        let kategori = found ? (found.kategori || found.tipe || '') : '';
        const catMatch = judul.match(/^(.*?)\s*\(([^)]+)\)$/);
        if (catMatch) {
          judul = catMatch[1].trim();
          if (!kategori) kategori = catMatch[2].trim();
        }
        return {
          tagihan_id: parseInt(id),
          judul,
          kategori,
          nominal: nom
        };
      });

      const res = await axios.post('/api/keuangan/admin/bayar-langsung', {
        santri_id: parseInt(selectedSantri.id),
        metode_pembayaran: isTf ? 'Transfer' : 'Tunai',
        channel_pembayaran: labelMetode,
        status_pembayaran: isPending ? 'Pending' : 'Berhasil',
        items: itemsPayload
      });

      if (res.data?.success) {
        const actualStatus = res.data?.data?.status_pembayaran || (isPending ? 'Pending' : 'Berhasil');
        if (actualStatus === 'Pending') {
          toastSuccess('Menunggu Transfer!', 'Tercatat sebagai Pending. Belum masuk kas sebelum dikonfirmasi.');
        } else {
          toastSuccess('Pembayaran Berhasil!', `Kuitansi: ${res.data.data?.kuitansi_nomor || 'Lunas'}`);
          setKuitansiModal({
            isOpen: true,
            data: {
              ...res.data.data,
              nama_santri: selectedSantri.nama_santri,
              nis: selectedSantri.nis,
              no_wa_wali: selectedSantri.no_wa_wali,
              asrama: selectedSantri.nama_asrama || '-',
              total_bayar: totalBayar,
              items: itemsPayload,
              items_detail: itemsDetail,
              metode_bayar: labelMetode,
              tanggal: new Date()
            }
          });
        }

        setSelectedPayMap({});
        fetchTagihanSantri(selectedSantri.id);
        fetchRekapAndSantri();
      }
    } catch (err) {
      showError('Gagal Bayar', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const handleProsesBayarTunai = () => handleProsesBayarLangsung('Cash');

  // 2. Proses Pembayaran via Midtrans (QRIS Dinamis atau Virtual Account Bank)
  const handleProsesBayarMidtrans = async (metode = 'QRIS') => {
    setIsMetodeModalOpen(false);
    setProcessingPay(true);
    try {
      const itemsPayload = selectedIds.map((id) => ({
        tagihan_id: parseInt(id),
        nominal: parseFloat(selectedPayMap[id]) || 0
      }));

      const res = await axios.post('/api/keuangan/wali/bayar', {
        santri_id: parseInt(selectedSantri.id),
        items: itemsPayload,
        metode_pembayaran: metode,
        channel_pembayaran: metode === 'QRIS' ? 'QRIS Midtrans' : 'Virtual Account Midtrans'
      });

      if (res.data?.success && res.data.data?.snap_token) {
        const snapToken = res.data.data.snap_token;
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: function () {
              toastSuccess('Pembayaran Berhasil!', 'Pembayaran via Midtrans telah terverifikasi.');
              setSelectedPayMap({});
              fetchTagihanSantri(selectedSantri.id);
              fetchRekapAndSantri();
            },
            onPending: function () {
              toastSuccess('Menunggu Pembayaran', 'Transaksi Midtrans berhasil dibuat.');
              setSelectedPayMap({});
              fetchTagihanSantri(selectedSantri.id);
              fetchRekapAndSantri();
            },
            onError: function (result) {
              showError('Gagal Bayar', result?.status_message || 'Pembayaran via Midtrans gagal.');
            },
            onClose: function () {
              fetchTagihanSantri(selectedSantri.id);
              fetchRekapAndSantri();
            }
          });
        } else if (res.data.data?.payment_url) {
          window.open(res.data.data.payment_url, '_blank');
        } else {
          showError('Midtrans Belum Siap', 'Script Midtrans Snap belum siap di browser.');
        }
      } else {
        showError('Gagal Midtrans', res.data?.message || 'Gagal membuat transaksi Midtrans.');
      }
    } catch (err) {
      showError('Gagal Bayar Midtrans', err.response?.data?.message || err.message);
    } finally {
      setProcessingPay(false);
    }
  };

  // Kirim WhatsApp Kuitansi
  const handleSendWaKuitansi = (kData) => {
    if (!kData?.no_wa_wali) {
      showError('Nomor Tidak Ada', 'Nomor WhatsApp wali santri belum terdaftar di data santri.');
      return;
    }
    let phone = String(kData.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const items = parseRincianItems(kData);
    const rincianText = items.length > 0
      ? items.map((it, idx) => {
          const kat = it.kategori ? ` _(${it.kategori})_` : '';
          return `  ${idx + 1}. *${it.judul}*${kat}: Rp ${Number(it.nominal || 0).toLocaleString('id-ID')}`;
        }).join('\n')
      : `  • ${kData.item_dibayar || 'Pembayaran Tagihan'}`;

    const dateStr = kData.tanggal
      ? new Date(kData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const message = `*KUITANSI PEMBAYARAN RESMI PESANTREN NURUL WAFA*\n\n` +
      `Alhamdulillah, pembayaran telah diterima dan tercatat di sistem:\n\n` +
      `• *No. Kuitansi*: ${kData.kuitansi_nomor || '-'}\n` +
      `• *Santri*: ${kData.nama_santri} (NIS: ${kData.nis || '-'})\n` +
      `• *Tanggal*: ${dateStr}\n` +
      `• *Metode*: ${kData.metode_bayar || metodeBayar || 'Tunai / Kasir'}\n` +
      `• *Status*: LUNAS ✅\n\n` +
      `*RINCIAN ITEM DIBAYAR:*\n` +
      `${rincianText}\n\n` +
      `*TOTAL PEMBAYARAN*: *Rp ${Number(kData.total_bayar || 0).toLocaleString('id-ID')}*\n\n` +
      `Jazakumullah Khairan Katsiran atas kepercayaannya.\n_Sistem Keuangan E-Pesantren_`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Kirim WhatsApp Penagihan Santri Menunggak
  const handleSendWaTunggakan = (item) => {
    if (!item.no_wa_wali) {
      showError('Nomor Tidak Ada', 'Nomor WhatsApp wali santri belum terdaftar.');
      return;
    }
    let phone = String(item.no_wa_wali).replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    const message = `*INFORMASI TAGIHAN SYAHRIAH & BIAYA PESANTREN NURUL WAFA*\n\n` +
      `Assalamu'alaikum Wr. Wb.\n` +
      `Yth. Bapak/Ibu Wali dari Ananda *${item.nama_santri}* (NIS: ${item.nis || '-'}),\n\n` +
      `Kami menginformasikan rincian kewajiban administrasi pesantren yang saat ini tercatat:\n` +
      `• SPP Bulanan: Rp ${Number(item.tunggakan_bulanan || 0).toLocaleString('id-ID')}\n` +
      (item.tunggakan_biaya_masuk > 0 ? `• Biaya Masuk/Lainnya: Rp ${Number(item.tunggakan_biaya_masuk || 0).toLocaleString('id-ID')}\n` : '') +
      `• *Total Tunggakan*: *Rp ${Number(item.total_tunggakan || 0).toLocaleString('id-ID')}*\n\n` +
      `Pembayaran dapat dilakukan melalui loket Bendahara Pesantren atau transfer online melalui Portal Wali Santri.\n\n` +
      `Jazakumullah Khairan Katsiran.\n_Admin Keuangan E-Pesantren_`;

    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filter daftar santri saat pencarian di tab Kasir
  const filteredSearchSantri = santriSearch.trim()
    ? santriList.filter((s) => {
        const q = santriSearch.toLowerCase();
        return (
          (s.nama_santri || '').toLowerCase().includes(q) ||
          (s.nis || '').toLowerCase().includes(q) ||
          (s.nama_asrama || '').toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  // Cek Status Transaksi Langsung ke Gateway Midtrans
  const handleCekStatusMidtrans = async (trx) => {
    setCheckingMidtransId(trx.id);
    try {
      const res = await axios.post('/api/keuangan/admin/cek-status-midtrans', {
        nomor_transaksi: trx.nomor_transaksi,
        transaksi_id: trx.id
      });
      if (res.data?.success) {
        toastSuccess('Status Midtrans', res.data.message || 'Status berhasil diperbarui');
        fetchRekapAndSantri();
        if (selectedSantri) {
          fetchTagihanSantri(selectedSantri.id);
        }
      } else {
        showError('Midtrans Notice', res.data?.message || 'Gagal cek status');
      }
    } catch (e) {
      showError('Gagal Cek Status', e.response?.data?.message || e.message);
    } finally {
      setCheckingMidtransId(null);
    }
  };

  // Lanjutkan Pembayaran Midtrans yang Pending (Buka Kembali Popup Snap QRIS / VA)
  const handleLanjutkanBayarMidtrans = async (trx) => {
    setProcessingPay(true);
    try {
      let snapToken = trx.snap_token;
      if (!snapToken) {
        const res = await axios.post('/api/keuangan/wali/lanjutkan', {
          transaksi_id: trx.id,
          nomor_transaksi: trx.nomor_transaksi
        });
        if (res.data?.success && res.data.data?.snap_token) {
          snapToken = res.data.data.snap_token;
        } else {
          showError('Gagal Lanjut Bayar', res.data?.message || 'Token transaksi tidak ditemukan.');
          return;
        }
      }

      if (window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function () {
            toastSuccess('Pembayaran Berhasil!', 'Pembayaran via Midtrans telah terverifikasi.');
            if (selectedSantri) fetchTagihanSantri(selectedSantri.id);
            fetchRekapAndSantri();
          },
          onPending: function () {
            toastSuccess('Menunggu Pembayaran', 'Silakan selesaikan pembayaran sesuai instruksi QRIS/VA.');
            if (selectedSantri) fetchTagihanSantri(selectedSantri.id);
            fetchRekapAndSantri();
          },
          onError: function (result) {
            showError('Gagal Bayar', result?.status_message || 'Pembayaran via Midtrans gagal.');
          },
          onClose: function () {
            if (selectedSantri) fetchTagihanSantri(selectedSantri.id);
            fetchRekapAndSantri();
          }
        });
      } else {
        showError('Midtrans Belum Siap', 'Script Midtrans Snap belum siap di browser.');
      }
    } catch (e) {
      showError('Gagal Lanjut Bayar', e.response?.data?.message || e.message);
    } finally {
      setProcessingPay(false);
    }
  };

  // Konfirmasi Transfer Pending sudah masuk ke rekening -> Lunas & Masuk Kas Sah
  const handleKonfirmasiTransferPending = async (trx) => {
    const confirmed = await showConfirm(
      'Konfirmasi Transfer Masuk?',
      `Pastikan dana sebesar Rp ${Number(trx.total_bayar || 0).toLocaleString('id-ID')} dari ${trx.nama_santri || 'santri'} sudah masuk rekening. Tagihan akan dilunasi dan tercatat ke Kas Masuk Sah.`,
      'Ya, Sudah Masuk',
      'Batal'
    );
    if (!confirmed) return;

    try {
      setProcessingPay(true);
      const res = await axios.post('/api/keuangan/wali/verifikasi', {
        transaksi_id: trx.id,
        nomor_transaksi: trx.nomor_transaksi
      });
      if (res.data?.success) {
        toastSuccess('Transfer Terverifikasi!', 'Pembayaran masuk Kas Masuk Sah & tagihan diperbarui.');
        if (selectedSantri) fetchTagihanSantri(selectedSantri.id);
        fetchRekapAndSantri();
      } else {
        showError('Gagal Verifikasi', res.data?.message || 'Gagal mengonfirmasi transfer.');
      }
    } catch (e) {
      showError('Gagal Verifikasi', e.response?.data?.message || e.message);
    } finally {
      setProcessingPay(false);
    }
  };

  const formatMetodeBadge = (trx) => {
    const raw = `${trx?.channel_pembayaran || ''} ${trx?.metode_pembayaran || ''}`.toLowerCase();
    if (raw.includes('tunai') || raw.includes('cash') || raw.includes('kasir')) return 'Cash / Tunai';
    if (raw.includes('qris')) return 'QRIS';
    if (raw.includes('transfer') || /\btf\b/.test(raw)) return 'Transfer Bank';
    return trx?.channel_pembayaran || trx?.metode_pembayaran || 'Cash / Tunai';
  };

  // Batalkan transaksi pending agar tagihan bisa dibayar tunai / dibuat QRIS baru
  const handleBatalkanPending = async (trx) => {
    const confirmed = await showConfirm(
      'Batalkan Transaksi Pending?',
      `Batalkan ${trx.nomor_transaksi}? Tagihan akan kembali belum dibayar sehingga bisa dibayar tunai atau dibuat QRIS baru.`,
      'Ya, Batalkan',
      'Tidak'
    );
    if (!confirmed) return;

    try {
      const res = await axios.post('/api/keuangan/wali/batal', {
        transaksi_id: trx.id,
        nomor_transaksi: trx.nomor_transaksi
      });
      if (res.data?.success) {
        toastSuccess('Transaksi Dibatalkan', res.data.message || 'Transaksi berhasil dibatalkan.');
        if (selectedSantri) fetchTagihanSantri(selectedSantri.id);
        fetchRekapAndSantri();
      } else {
        showError('Gagal Batalkan', res.data?.message || 'Gagal membatalkan transaksi.');
      }
    } catch (e) {
      showError('Gagal Batalkan', e.response?.data?.message || e.message);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      paddingBottom: activeTab === 'kasir' && selectedSantri ? '100px' : '36px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Top Header Terpadu Emerald Green (Persis Header Ortu / Admin) */}
      <div style={{
        background: 'linear-gradient(180deg, #0b6b60 0%, #0d766e 70%, #095c53 100%)',
        padding: '14px 16px 36px',
        color: '#ffffff',
        borderBottomLeftRadius: '28px',
        borderBottomRightRadius: '28px',
        position: 'relative',
        boxShadow: '0 8px 20px rgba(11, 107, 96, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#ffffff' }}>
              {activeTab === 'laporan' ? 'Laporan Kas' : activeTab === 'tunggakan' ? 'Tunggakan Santri' : activeTab === 'transaksi' ? 'Histori Transaksi' : 'Kasir'}
            </h2>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: KASIR BAYAR MOBILE (POS MODERN)
      ========================================================================= */}
      {activeTab === 'kasir' && (
        <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          {/* Card Santri Selector */}
          <div style={{
            background: '#ffffff',
            borderRadius: '22px',
            padding: '14px',
            border: '1px solid #e6f0ed',
            boxShadow: '0 10px 24px -4px rgba(11, 107, 96, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                Daftar Santri
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '10px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.28)',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Sparkles size={12} />
                <span>Gen. Tagihan</span>
              </button>
            </div>

            {/* Input Search Santri */}
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '10px 14px'
              }}>
                <Search size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari Nama Santri / NIS / Asrama..."
                  value={santriSearch}
                  onChange={(e) => {
                    setSantriSearch(e.target.value);
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    width: '100%',
                    fontWeight: 600,
                    color: '#0f172a'
                  }}
                />
                {santriSearch && (
                  <button
                    onClick={() => {
                      setSantriSearch('');
                      setIsSearching(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Profil Santri Terpilih (Desain Modern & Elegan) */}
            {selectedSantri ? (
              <div style={{
                marginTop: '14px',
                padding: '14px 16px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                border: '1.5px solid #a7f3d0',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  {/* Foto / Avatar Santri */}
                  {(() => {
                    const sPhoto = selectedSantri.foto
                      ? (selectedSantri.foto.startsWith('http') || selectedSantri.foto.startsWith('/uploads') ? selectedSantri.foto : `/uploads/santri/${selectedSantri.foto}`)
                      : null;
                    return (
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(5, 150, 105, 0.25)',
                        border: '2px solid #ffffff',
                        flexShrink: 0
                      }}>
                        {sPhoto ? (
                          <img
                            src={sPhoto}
                            alt={selectedSantri.nama_santri}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          (selectedSantri.nama_santri || 'S').slice(0, 2).toUpperCase()
                        )}
                      </div>
                    );
                  })()}

                  {/* Info Lengkap Santri */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 900,
                      fontSize: '0.94rem',
                      color: '#0f172a',
                      letterSpacing: '-0.2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {selectedSantri.nama_santri}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexWrap: 'wrap',
                      marginTop: '3px'
                    }}>
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '5px',
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        NIS: {selectedSantri.nis || '-'}
                      </span>
                      {selectedSantri.nama_asrama && (
                        <span style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #bbf7d0'
                        }}>
                          {selectedSantri.nama_asrama}
                        </span>
                      )}
                      {(selectedSantri.nama_sekolah || selectedSantri.tingkat_sekolah) && (
                        <span style={{
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '5px',
                          background: '#e0f2fe',
                          color: '#0369a1'
                        }}>
                          {selectedSantri.nama_sekolah?.includes('SMA') ? 'SMA' : selectedSantri.nama_sekolah?.includes('SMK') ? 'SMK' : 'SMP'}
                          {selectedSantri.tingkat_sekolah ? ` (${selectedSantri.tingkat_sekolah})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Batal */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSantri(null);
                    setSantriTagihan({ bulanan: [], bebas: [], riwayat: [] });
                    setSelectedPayMap({});
                  }}
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                  title="Batalkan pilihan santri"
                >
                  <X size={13} strokeWidth={2.5} />
                  <span>Batal</span>
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '14px' }}>
                {!santriSearch.trim() ? (
                  /* State Awal Bersih: Tanpa render 50-600 santri, hanya petunjuk pencarian */
                  <div style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1.5px dashed #cbd5e1',
                    margin: '6px 0'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      boxShadow: '0 4px 10px rgba(5, 150, 105, 0.1)'
                    }}>
                      <Search size={22} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      Cari Santri untuk Memulai Kasir
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', maxWidth: '280px', margin: '4px auto 0', lineHeight: 1.3 }}>
                      Ketik nama santri atau NIS pada kolom pencarian di atas
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Info Jumlah Santri */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      padding: '0 2px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#64748b'
                    }}>
                      <span>{filteredKasirSantri.length} Santri Ditemukan</span>
                      <span
                        onClick={() => setSantriSearch('')}
                        style={{ color: '#ef4444', cursor: 'pointer', fontSize: '0.67rem', fontWeight: 700 }}
                      >
                        Reset Cari ✕
                      </span>
                    </div>

                    {/* Gridview Daftar Santri 2 Kolom (Card Modern) */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                      maxHeight: '58vh',
                      overflowY: 'auto',
                      padding: '2px'
                    }}>
                  {(() => {
                    if (displayedSantri.length === 0) {
                      return (
                        <div style={{
                          gridColumn: '1 / -1',
                          padding: '30px 16px',
                          textAlign: 'center',
                          background: '#f8fafc',
                          borderRadius: '16px',
                          border: '1px dashed #cbd5e1',
                          color: '#64748b'
                        }}>
                          <Users size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Santri Tidak Ditemukan</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                            Ubah kata kunci pencarian atau ganti filter sekolah &amp; kelas
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {displayedSantri.map((s) => {
                          const skLabel = s.nama_sekolah || (s.tingkat_sekolah ? `Kelas ${s.tingkat_sekolah}` : 'Santri NWF');
                          const klsLabel = (s.nama_kelas && s.nama_kelas !== '-') ? s.nama_kelas : (s.tingkat_sekolah || '-');
                          const isSMP = skLabel.toUpperCase().includes('SMP');
                          const isSMA = skLabel.toUpperCase().includes('SMA');
                          const isSMK = skLabel.toUpperCase().includes('SMK');

                          let badgeBg = '#f1f5f9';
                          let badgeColor = '#475569';
                          let cardAccent = '#059669';
                          if (isSMP) {
                            badgeBg = '#e0f2fe';
                            badgeColor = '#0369a1';
                            cardAccent = '#0284c7';
                          } else if (isSMA) {
                            badgeBg = '#fef3c7';
                            badgeColor = '#b45309';
                            cardAccent = '#d97706';
                          } else if (isSMK) {
                            badgeBg = '#f3e8ff';
                            badgeColor = '#7e22ce';
                            cardAccent = '#7c3aed';
                          }

                          const photoUrl = s.foto_url || (s.foto && typeof s.foto === 'string' && (s.foto.startsWith('http') || s.foto.startsWith('/uploads')) ? s.foto : null);

                          return (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSantri(s)}
                              style={{
                                background: '#ffffff',
                                borderRadius: '18px',
                                padding: '12px 10px 10px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                userSelect: 'none',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Top Badges: Sekolah & Kelas */}
                              <div style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                              }}>
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  background: badgeBg,
                                  color: badgeColor,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  letterSpacing: '0.2px'
                                }}>
                                  {isSMP ? 'SMP' : isSMA ? 'SMA' : isSMK ? 'SMK' : 'NWF'}
                                </span>

                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                  padding: '1px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {klsLabel}
                                </span>
                              </div>

                              {/* Foto Santri / Avatar Bulat Mewah */}
                              <div style={{
                                width: '54px',
                                height: '54px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '0.96rem',
                                marginBottom: '7px',
                                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                                border: '2.5px solid #ffffff'
                              }}>
                                {photoUrl ? (
                                  <img
                                    src={photoUrl}
                                    alt={s.nama_santri}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  (s.nama_santri || 'S').slice(0, 2).toUpperCase()
                                )}
                              </div>

                              {/* Nama Santri */}
                              <div style={{
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                color: '#0f172a',
                                lineHeight: 1.25,
                                maxHeight: '2.5em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                marginBottom: '4px'
                              }}>
                                {s.nama_santri}
                              </div>

                              {/* NISN / NIS */}
                              <div style={{
                                fontSize: '0.65rem',
                                color: '#64748b',
                                fontWeight: 600,
                                background: '#f8fafc',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid #f1f5f9',
                                width: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                NISN: {s.nisn || s.nis || '-'}
                              </div>
                            </div>
                          );
                        })}

                        {filteredKasirSantri.length > displayedSantri.length && (
                          <button
                            type="button"
                            onClick={() => setSantriDisplayLimit((prev) => prev + 50)}
                            style={{
                              gridColumn: '1 / -1',
                              padding: '12px 14px',
                              borderRadius: '14px',
                              background: '#f1f5f9',
                              border: '1.5px dashed #cbd5e1',
                              color: '#059669',
                              fontWeight: 800,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              margin: '6px 0 10px'
                            }}
                          >
                            <span>+ Muat Hasil Lainnya (Tersisa {filteredKasirSantri.length - displayedSantri.length})</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}
          </div>

          {/* Rincian Tagihan Santri */}
          {selectedSantri && (
            <>
              {loadingTagihan ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                  <RotateCw size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                  Memuat rincian tagihan santri...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* SEGMENTED 2 TABS: TAGIHAN vs HISTORI BAYAR */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    background: '#f1f5f9',
                    padding: '4px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <button
                      type="button"
                      onClick={() => setKasirSantriTab('tagihan')}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: kasirSantriTab === 'tagihan' ? '#ffffff' : 'transparent',
                        color: kasirSantriTab === 'tagihan' ? '#065f46' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: kasirSantriTab === 'tagihan' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <FileText size={15} />
                      <span>Tagihan</span>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: kasirSantriTab === 'tagihan' ? '#ecfdf5' : '#e2e8f0',
                        color: kasirSantriTab === 'tagihan' ? '#059669' : '#64748b',
                        fontWeight: 800
                      }}>
                        {santriTagihan.bulanan.length + santriTagihan.bebas.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKasirSantriTab('histori')}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: kasirSantriTab === 'histori' ? '#ffffff' : 'transparent',
                        color: kasirSantriTab === 'histori' ? '#065f46' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: kasirSantriTab === 'histori' ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Clock size={15} />
                      <span>Histori Bayar</span>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: kasirSantriTab === 'histori' ? '#ecfdf5' : '#e2e8f0',
                        color: kasirSantriTab === 'histori' ? '#059669' : '#64748b',
                        fontWeight: 800
                      }}>
                        {santriTagihan.riwayat.length}
                      </span>
                    </button>
                  </div>

                  {/* TAB 1: TAGIHAN SANTRI */}
                  {kasirSantriTab === 'tagihan' && (
                    <>
                      {/* 1. Tagihan SPP Bulanan */}
                      <div style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={16} color="#059669" />
                        <span>SPP Bulanan Rutin</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {santriTagihan.bulanan.filter((t) => t.status === 'Lunas').length} / {santriTagihan.bulanan.length} Lunas
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {santriTagihan.bulanan.map((t) => {
                        const isLunas = t.status === 'Lunas';
                        const isChecked = selectedPayMap[t.id] !== undefined;
                        const sisa = parseFloat(t.sisa_tagihan || t.total_tagihan || 0);

                        return (
                          <div
                            key={t.id}
                            onClick={() => !isLunas && handleTogglePay(t.id, sisa)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '11px',
                              border: isChecked ? '1.5px solid #059669' : '1px solid #e2e8f0',
                              background: isChecked ? '#f0fdf4' : isLunas ? '#f8fafc' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: isLunas ? 'default' : 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {!isLunas && (
                                <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '5px',
                                  border: isChecked ? 'none' : '1.5px solid #94a3b8',
                                  background: isChecked ? '#059669' : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff'
                                }}>
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isLunas ? '#64748b' : '#0f172a' }}>
                                  {t.periode_bulan || t.judul_tagihan}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                  Rp {Number(t.total_tagihan || 0).toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isLunas ? (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}>
                                  LUNAS
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: isChecked ? '#059669' : '#e11d48'
                                }}>
                                  Rp {sisa.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {santriTagihan.bulanan.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Tidak ada tagihan bulanan tercatat.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* State Jika Santri Belum Memiliki Tagihan Sama Sekali */}
                  {santriTagihan.bulanan.length === 0 && santriTagihan.bebas.length === 0 && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      border: '1.5px dashed #cbd5e1'
                    }}>
                      <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' }}>
                        Belum Ada Tagihan untuk Santri Ini
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '16px' }}>
                        Santri ini belum memiliki tagihan SPP maupun Biaya Awal Masuk. Anda dapat menerbitkan tagihan secara instan.
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGenerateModalOpen(true)}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Sparkles size={16} />
                        <span>+ Terbitkan Tagihan Sekarang</span>
                      </button>
                    </div>
                  )}

                  {/* 2. Biaya Masuk Satuan Dikelompokkan per Kategori (Adm Pesantren / Adm Sekolah) */}
                  {santriTagihan.bebas.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={16} color="#059669" />
                          <span>Biaya Masuk</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b' }}>
                            ({santriTagihan.bebas.filter((t) => t.status === 'Lunas').length} / {santriTagihan.bebas.length} Lunas)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleAllBebas}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#059669',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {santriTagihan.bebas.filter((t) => t.status !== 'Lunas').every((t) => selectedPayMap[t.id] !== undefined) && santriTagihan.bebas.some((t) => t.status !== 'Lunas')
                            ? 'Batal Semua'
                            : 'Pilih Semua'}
                        </button>
                      </div>

                      {/* Grouping Items by Category */}
                      {(() => {
                        const grouped = santriTagihan.bebas.reduce((acc, t) => {
                          const matchKat = t.judul_tagihan.match(/\(([^)]+)\)/);
                          const cat = matchKat ? matchKat[1].trim() : (t.kategori || 'Adm Pesantren');
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(t);
                          return acc;
                        }, {});

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(grouped).map(([kategoriName, itemsInCat]) => {
                              const lunasCount = itemsInCat.filter((t) => t.status === 'Lunas').length;

                              return (
                                <div key={kategoriName} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {/* Sub-header Kategori (Misal: Adm Pesantren / Adm Sekolah) */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    background: '#f8fafc',
                                    borderLeft: '3.5px solid #059669',
                                    marginBottom: '2px'
                                  }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a' }}>
                                      {kategoriName}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>
                                      {lunasCount} / {itemsInCat.length} Lunas
                                    </span>
                                  </div>

                                  {/* Daftar Item Rincian Bersih Tanpa Label Berulang */}
                                  {itemsInCat.map((t) => {
                                    const isLunas = t.status === 'Lunas';
                                    const isChecked = selectedPayMap[t.id] !== undefined;
                                    const sisa = parseFloat(t.sisa_tagihan || t.total_tagihan || 0);
                                    const cleanName = t.judul_tagihan.replace(/\s*\([^)]*\)/g, '').trim();

                                    return (
                                      <div
                                        key={t.id}
                                        onClick={() => !isLunas && handleTogglePay(t.id, sisa)}
                                        style={{
                                          padding: '7px 12px',
                                          borderRadius: '11px',
                                          border: isChecked ? '1.5px solid #059669' : '1px solid #f1f5f9',
                                          background: isChecked ? '#f0fdf4' : isLunas ? '#f8fafc' : '#ffffff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          cursor: isLunas ? 'default' : 'pointer',
                                          transition: 'all 0.15s ease',
                                          boxShadow: isChecked ? '0 2px 8px rgba(5, 150, 105, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          {!isLunas && (
                                            <div style={{
                                              width: '18px',
                                              height: '18px',
                                              borderRadius: '5px',
                                              border: isChecked ? 'none' : '1.5px solid #94a3b8',
                                              background: isChecked ? '#059669' : '#ffffff',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              color: '#ffffff',
                                              flexShrink: 0
                                            }}>
                                              {isChecked && <Check size={12} strokeWidth={3} />}
                                            </div>
                                          )}
                                          <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isLunas ? '#64748b' : '#0f172a', lineHeight: 1.2 }}>
                                              {cleanName}
                                            </div>
                                            <div style={{ fontSize: '0.64rem', color: '#94a3b8', marginTop: '1px', lineHeight: 1.1 }}>
                                              {t.periode_bulan || 'TA 2026/2027'}
                                            </div>
                                          </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                          {isLunas ? (
                                            <span style={{
                                              fontSize: '0.62rem',
                                              fontWeight: 800,
                                              background: '#dcfce7',
                                              color: '#15803d',
                                              padding: '2px 7px',
                                              borderRadius: '5px'
                                            }}>
                                              Lunas
                                            </span>
                                          ) : (
                                            <div>
                                              <div style={{ fontWeight: 800, fontSize: '0.82rem', color: isChecked ? '#059669' : '#0f172a' }}>
                                                Rp {sisa.toLocaleString('id-ID')}
                                              </div>
                                              {sisa < parseFloat(t.total_tagihan || 0) && (
                                                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                                                  dari Rp {Number(t.total_tagihan || 0).toLocaleString('id-ID')}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                    </>
                  )}

                  {/* ========================================================
                      TAB 2: HISTORI PEMBAYARAN KASIR SANTRI
                  ======================================================== */}
                  {kasirSantriTab === 'histori' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {santriTagihan.riwayat && santriTagihan.riwayat.length > 0 ? (
                        santriTagihan.riwayat.map((trx) => {
                          const isBerhasil = trx.status_pembayaran === 'Berhasil';
                          const isPending = trx.status_pembayaran === 'Pending';
                          const badgeBg = isBerhasil ? '#dcfce7' : isPending ? '#fef3c7' : '#fee2e2';
                          const badgeColor = isBerhasil ? '#15803d' : isPending ? '#b45309' : '#ef4444';

                          return (
                            <div
                              key={trx.id}
                              style={{
                                background: '#ffffff',
                                borderRadius: '18px',
                                padding: '14px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                                    {trx.kuitansi_nomor || trx.nomor_transaksi}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                                    {trx.created_at ? new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                  </div>
                                </div>
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: badgeBg,
                                  color: badgeColor
                                }}>
                                  {trx.status_pembayaran}
                                </span>
                              </div>

                              {/* Rincian Itemized Dibayar Modern */}
                              {(() => {
                                const parsedItems = parseRincianItems(trx);
                                return (
                                  <div style={{
                                    background: '#f8fafc',
                                    borderRadius: '12px',
                                    padding: '10px 12px',
                                    marginBottom: '10px',
                                    border: '1px solid #f1f5f9'
                                  }}>
                                    <div style={{
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      color: '#64748b',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.4px',
                                      marginBottom: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between'
                                    }}>
                                      <span>Item yang Dibayar</span>
                                      <span style={{ color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                                        {parsedItems.length} Pos
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      {parsedItems.map((it, idx) => (
                                        <div
                                          key={idx}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.74rem',
                                            padding: '4px 0',
                                            borderBottom: idx < parsedItems.length - 1 ? '1px dashed #e2e8f0' : 'none'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                            <div style={{
                                              width: '6px',
                                              height: '6px',
                                              borderRadius: '50%',
                                              background: '#059669',
                                              flexShrink: 0
                                            }} />
                                            <span style={{ fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                              {it.judul}
                                            </span>
                                            {it.kategori && (
                                              <span style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: '#f0fdf4',
                                                color: '#047857',
                                                border: '1px solid #bbf7d0',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {it.kategori}
                                              </span>
                                            )}
                                          </div>
                                          <span style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                                            Rp {Number(it.nominal || 0).toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                  <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Total Nominal</div>
                                  <div style={{ fontSize: '0.96rem', fontWeight: 900, color: isBerhasil ? '#059669' : isPending ? '#d97706' : '#64748b' }}>
                                    Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                                  </div>
                                  <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '1px' }}>
                                    Via {trx.channel_pembayaran || trx.metode_pembayaran || 'Kasir'}
                                  </div>
                                </div>

                                {isBerhasil && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const parsed = parseRincianItems(trx);
                                        setKuitansiModal({
                                          isOpen: true,
                                          data: {
                                            kuitansi_nomor: trx.kuitansi_nomor || trx.nomor_transaksi,
                                            nama_santri: selectedSantri.nama_santri,
                                            nis: selectedSantri.nis,
                                            no_wa_wali: selectedSantri.no_wa_wali,
                                            asrama: selectedSantri.nama_asrama || '-',
                                            total_bayar: trx.total_bayar,
                                            metode_bayar: trx.channel_pembayaran || trx.metode_pembayaran || 'Kasir',
                                            tanggal: trx.created_at ? new Date(trx.created_at) : new Date(),
                                            item_dibayar: trx.item_dibayar,
                                            items_detail: parsed
                                          }
                                        });
                                      }}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Receipt size={13} />
                                      <span>Kuitansi</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSendWaKuitansi({
                                        kuitansi_nomor: trx.kuitansi_nomor || trx.nomor_transaksi,
                                        nama_santri: selectedSantri.nama_santri,
                                        nis: selectedSantri.nis,
                                        no_wa_wali: selectedSantri.no_wa_wali,
                                        total_bayar: trx.total_bayar,
                                        metode_bayar: trx.channel_pembayaran || trx.metode_pembayaran || 'Kasir',
                                        tanggal: trx.created_at ? new Date(trx.created_at) : new Date(),
                                        item_dibayar: trx.item_dibayar
                                      })}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#22c55e',
                                        color: '#ffffff',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Send size={12} />
                                      <span>WA</span>
                                    </button>
                                  </div>
                                )}

                                {isPending && (
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleKonfirmasiTransferPending(trx)}
                                      disabled={processingPay}
                                      style={{
                                        padding: '6px 11px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                        color: '#ffffff',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        cursor: processingPay ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                      }}
                                      title="Konfirmasi dana transfer sudah masuk rekening & masukkan ke Kas"
                                    >
                                      <Check size={12} />
                                      <span>Konfirmasi Masuk</span>
                                    </button>

                                    {trx.snap_token && (
                                      <button
                                        type="button"
                                        onClick={() => handleLanjutkanBayarMidtrans(trx)}
                                        disabled={processingPay}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          border: '1px solid #a7f3d0',
                                          background: '#ecfdf5',
                                          color: '#047857',
                                          fontSize: '0.7rem',
                                          fontWeight: 800,
                                          cursor: processingPay ? 'not-allowed' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Buka kembali popup pembayaran QRIS / Virtual Account"
                                      >
                                        <Zap size={12} />
                                        <span>Midtrans</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleBatalkanPending(trx)}
                                      style={{
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        border: '1px solid #fecaca',
                                        background: '#fff1f2',
                                        color: '#e11d48',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px'
                                      }}
                                      title="Batalkan transaksi agar tagihan bisa dibayar tunai"
                                    >
                                      <X size={11} />
                                      <span>Batal</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{
                          background: '#ffffff',
                          borderRadius: '20px',
                          padding: '30px 16px',
                          textAlign: 'center',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b' }}>
                            Belum Ada Riwayat Pembayaran
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            Santri ini belum memiliki histori transaksi yang tercatat di kasir.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sticky Checkout Bottom Bar (Muncul Tepat di Atas Bottom Nav Bar saat Ada Tagihan Dicentang) */}
          {selectedSantri && kasirSantriTab === 'tagihan' && selectedIds.length > 0 && (
            <div style={{
              position: 'fixed',
              bottom: '60px',
              left: 0,
              right: 0,
              zIndex: 120,
              background: '#ffffff',
              borderTop: '1.5px solid #10b981',
              borderRadius: '18px 18px 0 0',
              padding: '11px 16px',
              boxShadow: '0 -6px 20px rgba(0,0,0,0.12)',
              maxWidth: '430px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 700 }}>
                  {selectedIds.length} Tagihan Dipilih
                </div>
                <div style={{ fontSize: '1.08rem', fontWeight: 900, color: '#059669' }}>
                  Rp {totalBayar.toLocaleString('id-ID')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMetodeModalOpen(true)}
                disabled={processingPay}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                }}
              >
                <span>Bayar Kasir</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: LAPORAN KAS & REKAP KEUANGAN
      ========================================================================= */}
      {activeTab === 'laporan' && (
        <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          {/* 3 Kantong Saldo, Pencairan Midtrans, Setor Tunai, dan Buku Kas Pengeluaran/Pemasukan */}
          <div style={{ marginBottom: '16px' }}>
            <PanelKantongDanBukuKas onDataChanged={fetchRekapKeuangan} />
          </div>

          {/* 3 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Kas Masuk Sah (Lunas)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#065f46', marginTop: '4px' }}>
                Rp {Number(rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #fecdd3'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#be123c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={13} /> Total Piutang / Tunggakan
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#9f1239', marginTop: '4px' }}>
                Rp {Number(rekapData.summary?.total_tunggakan || 0).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Realisasi Tagihan Bar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>Realisasi Penerimaan SPP</span>
              <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#059669' }}>
                {rekapData.summary?.total_nominal_tagihan > 0
                  ? `${Math.round(((rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0) / rekapData.summary.total_nominal_tagihan) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                width: rekapData.summary?.total_nominal_tagihan > 0
                  ? `${Math.min(100, Math.round(((rekapData.summary?.total_kas_masuk_sah || rekapData.summary?.total_terbayar || 0) / rekapData.summary.total_nominal_tagihan) * 100))}%`
                  : '0%'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b', marginTop: '8px' }}>
              <span>Lunas Terbayar: {rekapData.summary?.jumlah_tagihan_lunas || 0} Tagihan</span>
              <span>Sisa Tertunggak: {rekapData.summary?.jumlah_tagihan_tertunggak || 0} Tagihan</span>
            </div>

            {/* Catatan Transaksi Pending */}
            {(rekapData.transaksiPending || []).length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#fffbeb',
                borderRadius: '10px',
                border: '1px solid #fef3c7',
                fontSize: '0.7rem',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>⏳ {(rekapData.transaksiPending || []).length} transaksi online berstatus pending (belum transfer)</span>
                <button
                  onClick={() => {
                    setFilterTrxTab('Pending');
                    setActiveTab('transaksi');
                  }}
                  style={{ background: 'none', border: 'none', color: '#d97706', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Lihat &gt;
                </button>
              </div>
            )}
          </div>

          {/* Quick Action: Buka Kasir */}
          <button
            onClick={() => setActiveTab('kasir')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
              marginBottom: '20px'
            }}
          >
            <CreditCard size={18} />
            <span>Buka Loket Kasir Pembayaran</span>
          </button>

          {/* Rincian Transaksi Kas Masuk Sah */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Receipt size={18} color="#059669" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  Rincian Transaksi Kas Masuk Sah
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '2px 8px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                {(rekapData.transaksiTerakhir || []).length} Transaksi Sah
              </span>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '8px 12px',
              marginBottom: '10px'
            }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Cari santri, NIS, no kuitansi..."
                value={laporanSearch}
                onChange={(e) => setLaporanSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem' }}
              />
              {laporanSearch && (
                <button
                  onClick={() => setLaporanSearch('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Sekolah */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'semua', label: 'Semua Sekolah' },
                { id: 'SMP', label: 'SMP' },
                { id: 'SMA', label: 'SMA' },
                { id: 'SMK', label: 'SMK' }
              ].map((f) => {
                const active = laporanFilterSekolah === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setLaporanFilterSekolah(f.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: active ? '1px solid #059669' : '1px solid #e2e8f0',
                      background: active ? '#059669' : '#ffffff',
                      color: active ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {/* Daftar Transaksi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const list = (rekapData.transaksiTerakhir || []).filter((trx) => {
                  if (laporanFilterSekolah !== 'semua') {
                    const sk = String(trx.nama_sekolah || trx.tingkat_sekolah || '').toUpperCase();
                    if (!sk.includes(laporanFilterSekolah)) return false;
                  }
                  if (laporanSearch.trim()) {
                    const q = laporanSearch.toLowerCase();
                    const sName = String(trx.nama_santri || '').toLowerCase();
                    const sNis = String(trx.nis || '').toLowerCase();
                    const sNo = String(trx.nomor_transaksi || trx.nomor_kuitansi || '').toLowerCase();
                    const sItem = String(trx.rincian_item || trx.keterangan || '').toLowerCase();
                    return sName.includes(q) || sNis.includes(q) || sNo.includes(q) || sItem.includes(q);
                  }
                  return true;
                });

                if (list.length === 0) {
                  return (
                    <div style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                      fontSize: '0.8rem'
                    }}>
                      <Receipt size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                      <div>Belum ada transaksi kas masuk sah yang sesuai filter.</div>
                    </div>
                  );
                }

                return list.map((trx, idx) => {
                  const sekolahLabel = trx.nama_sekolah || (trx.tingkat_sekolah ? `Kelas ${trx.tingkat_sekolah}` : 'Santri NWF');
                  const isSMP = sekolahLabel.toUpperCase().includes('SMP');
                  const isSMA = sekolahLabel.toUpperCase().includes('SMA');
                  const isSMK = sekolahLabel.toUpperCase().includes('SMK');

                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#475569';
                  if (isSMP) { badgeBg = '#e0f2fe'; badgeColor = '#0369a1'; }
                  else if (isSMA) { badgeBg = '#fef3c7'; badgeColor = '#b45309'; }
                  else if (isSMK) { badgeBg = '#f3e8ff'; badgeColor = '#7e22ce'; }

                  return (
                    <div
                      key={trx.id || idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Top Bar Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          #{trx.nomor_transaksi || `TRX-${trx.id}`}
                        </span>
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <CheckCircle2 size={11} /> Sah / Lunas
                        </span>
                      </div>

                      {/* Info Santri & Nominal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                            {trx.nama_santri || 'Santri'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              NIS: {trx.nis || '-'}
                            </span>
                            <span style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              background: badgeBg,
                              color: badgeColor,
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {sekolahLabel}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#047857' }}>
                            Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                          </div>
                          <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '1px' }}>
                            {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Hari ini'}
                          </div>
                        </div>
                      </div>

                      {/* Rincian Tagihan */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        color: '#334155',
                        lineHeight: 1.4,
                        border: '1px solid #f1f5f9'
                      }}>
                        <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '2px', fontSize: '0.66rem' }}>
                          ITEM DIBAYAR:
                        </div>
                        <div>
                          {trx.rincian_item || trx.keterangan || 'Pembayaran Tagihan Santri'}
                        </div>
                      </div>

                      {/* Footer: Metode & Kuitansi */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={12} color="#059669" />
                          <span>{trx.metode_pembayaran || 'Kasir'} {trx.channel_pembayaran ? `(${trx.channel_pembayaran})` : ''}</span>
                        </div>

                        <button
                          onClick={() => setKuitansiModal({
                            isOpen: true,
                            data: {
                              ...trx,
                              kuitansi_nomor: trx.nomor_kuitansi || trx.nomor_transaksi || `KW-${trx.id}`,
                              total_dibayar: trx.total_bayar,
                              santri: { nama_santri: trx.nama_santri, nis: trx.nis, kelas: trx.nama_sekolah || trx.tingkat_sekolah },
                              items_dibayar: [{ judul: trx.rincian_item || trx.keterangan || 'Pembayaran Kasir', nominal: trx.total_bayar }]
                            }
                          })}
                          style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#047857',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Receipt size={12} />
                          <span>Lihat Kuitansi</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STATUS SPP BULANAN SANTRI
      ========================================================================= */}
      {activeTab === 'spp' && (
        <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '8px 12px'
            }}>
              <Search size={16} color="#64748b" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={sppSearch}
                onChange={(e) => setSppSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* List Santri SPP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(santriList || [])
              .filter((s) => {
                if (!sppSearch.trim()) return true;
                const q = sppSearch.toLowerCase();
                return (s.nama_santri || '').toLowerCase().includes(q) || (s.nis || '').includes(q);
              })
              .slice(0, 30)
              .map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                      {s.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      NIS: {s.nis || '-'} • Asrama: {s.nama_asrama || '-'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectSantri(s);
                      setActiveTab('kasir');
                    }}
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Bayar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REKAP TUNGGAKAN SANTRI
      ========================================================================= */}
      {activeTab === 'tunggakan' && (
        <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#be123c', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} />
            <span>Santri dengan Piutang / Tunggakan Aktif</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(rekapData.tunggakanSantri || []).map((t, idx) => (
              <div
                key={t.santri_id || idx}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 2px 6px rgba(190, 18, 60, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                      {t.nama_santri}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      NIS: {t.nis || '-'} • {t.nama_asrama || 'Asrama'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#be123c' }}>
                      Rp {Number(t.total_tunggakan || 0).toLocaleString('id-ID')}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#9f1239' }}>Total Belum Lunas</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    onClick={() => {
                      const found = santriList.find((s) => s.id === t.santri_id);
                      if (found) handleSelectSantri(found);
                      else handleSelectSantri({ id: t.santri_id, nama_santri: t.nama_santri, nis: t.nis, nama_asrama: t.nama_asrama });
                      setActiveTab('kasir');
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Bayar di Kasir</span>
                  </button>

                  <button
                    onClick={() => handleSendWaTunggakan(t)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #22c55e',
                      background: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    title="Kirim Tagihan via WhatsApp"
                  >
                    <Send size={13} />
                    <span>Tagih WA</span>
                  </button>
                </div>
              </div>
            ))}

            {(!rekapData.tunggakanSantri || rekapData.tunggakanSantri.length === 0) && (
              <div style={{ padding: '30px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.8rem' }}>
                🎉 Luar biasa! Tidak ada santri yang memiliki tunggakan saat ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Histori Pembayaran (Sah / Lunas & Pending Transfer) */}
      {activeTab === 'transaksi' && (
        <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '5px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setFilterTrxTab('Berhasil')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: 'none',
                background: filterTrxTab === 'Berhasil' ? '#059669' : 'transparent',
                color: filterTrxTab === 'Berhasil' ? '#ffffff' : '#64748b',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Sah / Masuk Kas ({(rekapData.transaksiTerakhir || []).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTrxTab('Pending')}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: '10px',
                border: 'none',
                background: filterTrxTab === 'Pending' ? '#d97706' : 'transparent',
                color: filterTrxTab === 'Pending' ? '#ffffff' : '#64748b',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Pending Transfer ({(rekapData.transaksiPending || []).length})
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filterTrxTab === 'Pending' ? (
              (!rekapData.transaksiPending || rekapData.transaksiPending.length === 0) ? (
                <div style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: '0.8rem'
                }}>
                  <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <div>Tidak ada transaksi transfer pending.</div>
                </div>
              ) : (
                rekapData.transaksiPending.map((trx, idx) => (
                  <div
                    key={trx.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      border: '1.5px dashed #fcd34d',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {trx.nama_santri || 'Santri'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                          NIS: {trx.nis || '-'} • #{trx.nomor_transaksi}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#d97706' }}>
                          Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          background: '#fef3c7',
                          color: '#b45309',
                          marginTop: '2px'
                        }}>
                          MENUNGGU TRANSFER (BELUM MASUK KAS)
                        </span>
                      </div>
                    </div>

                    {trx.rincian_item && (
                      <div style={{ fontSize: '0.7rem', color: '#475569', background: '#fffbeb', padding: '7px 9px', borderRadius: '8px' }}>
                        {trx.rincian_item}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px dashed #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={() => handleKonfirmasiTransferPending(trx)}
                        disabled={processingPay}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#059669',
                          color: '#ffffff',
                          fontSize: '0.73rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <Check size={14} />
                        <span>Konfirmasi Transfer Masuk</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatalkanPending(trx)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid #fecaca',
                          background: '#fff1f2',
                          color: '#e11d48',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (!rekapData.transaksiTerakhir || rekapData.transaksiTerakhir.length === 0) ? (
              <div style={{
                padding: '36px 16px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '0.8rem'
              }}>
                <Receipt size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <div>Belum ada transaksi kas masuk yang berstatus lunas/berhasil.</div>
              </div>
            ) : (
              rekapData.transaksiTerakhir.map((trx, idx) => (
                <div
                  key={trx.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                        {trx.nama_santri || 'Santri'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                        NIS: {trx.nis || '-'} • #{trx.nomor_transaksi}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#059669' }}>
                        Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                      </div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: '#dcfce7',
                        color: '#15803d',
                        marginTop: '2px'
                      }}>
                        ✓ SELESAI
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px dashed #f1f5f9',
                    fontSize: '0.68rem',
                    color: '#64748b'
                  }}>
                    <span style={{ background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      {formatMetodeBadge(trx)}
                    </span>
                    <span>
                      {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Histori Gateway Midtrans Lengkap (QRIS & VA - Selesai, Pending, Batal) */}
      {activeTab === 'midtrans' && (
        <div style={{ padding: '16px 14px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase' }}>
              Histori Gateway Midtrans (QRIS & VA)
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
              Status real-time seluruh transaksi pembayaran digital online
            </div>
          </div>

          {/* Filter Status Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '14px',
            scrollbarWidth: 'none'
          }}>
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'Berhasil', label: 'Selesai' },
              { id: 'Pending', label: 'Pending' },
              { id: 'Batal', label: 'Batal / Expire' }
            ].map(f => {
              const isSelected = midtransFilter === f.id;
              const count = (rekapData.transaksiMidtrans || []).filter(t => {
                if (f.id === 'semua') return true;
                if (f.id === 'Batal') return t.status_pembayaran === 'Batal' || t.status_pembayaran === 'Expired';
                return t.status_pembayaran === f.id;
              }).length;

              return (
                <button
                  key={f.id}
                  onClick={() => setMidtransFilter(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '0.72rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isSelected ? '#0891b2' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#64748b',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 2px 6px rgba(8, 145, 178, 0.3)' : 'none'
                  }}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          {/* List Transaksi Midtrans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              const filteredList = (rekapData.transaksiMidtrans || []).filter(t => {
                if (midtransFilter === 'semua') return true;
                if (midtransFilter === 'Batal') return t.status_pembayaran === 'Batal' || t.status_pembayaran === 'Expired';
                return t.status_pembayaran === midtransFilter;
              });

              if (filteredList.length === 0) {
                return (
                  <div style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontSize: '0.8rem'
                  }}>
                    <Zap size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div>Tidak ada histori transaksi Midtrans pada kategori ini.</div>
                  </div>
                );
              }

              return filteredList.map((trx, idx) => {
                const isSuccess = trx.status_pembayaran === 'Berhasil' || trx.status_pembayaran === 'settlement';
                const isPending = trx.status_pembayaran === 'Pending';
                const isChecking = checkingMidtransId === trx.id;

                let statusBg = '#fee2e2';
                let statusColor = '#991b1b';
                let statusText = trx.status_pembayaran || 'Batal';

                if (isSuccess) {
                  statusBg = '#dcfce7';
                  statusColor = '#15803d';
                  statusText = 'Selesai (Settled)';
                } else if (isPending) {
                  statusBg = '#fef3c7';
                  statusColor = '#b45309';
                  statusText = 'Pending (Menunggu)';
                }

                return (
                  <div
                    key={trx.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      border: isPending ? '1.5px dashed #fcd34d' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {trx.nama_santri || 'Santri'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                          #{trx.nomor_transaksi}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: isSuccess ? '#059669' : (isPending ? '#d97706' : '#64748b') }}>
                          Rp {Number(trx.total_bayar || 0).toLocaleString('id-ID')}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: statusBg,
                          color: statusColor,
                          marginTop: '2px'
                        }}>
                          {statusText}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px dashed #f1f5f9',
                      fontSize: '0.68rem',
                      color: '#64748b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#ecfeff', border: '1px solid #a5f3fc', color: '#0891b2', padding: '2px 6px', borderRadius: '5px', fontWeight: 700 }}>
                          ⚡ {trx.channel_pembayaran || trx.metode_pembayaran || 'Midtrans'}
                        </span>
                      </div>
                      <span>
                        {trx.created_at ? new Date(trx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>

                    {/* Action Khusus Transaksi Pending: Cek Status Langsung ke Midtrans */}
                    {isPending && (
                      <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
                        <button
                          onClick={() => handleCekStatusMidtrans(trx)}
                          disabled={isChecking}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #fed7aa',
                            background: '#fff7ed',
                            color: '#c2410c',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: isChecking ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <RotateCw size={13} className={isChecking ? 'spin' : ''} />
                          <span>{isChecking ? 'Mengecek ke Midtrans...' : 'Cek Status Pembayaran ke Midtrans'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL KUITANSI DIGITAL ELEGAN & MODERN
      ========================================================================= */}
      {kuitansiModal.isOpen && kuitansiModal.data && (() => {
        const kData = kuitansiModal.data;
        const items = parseRincianItems(kData);
        const tglStr = kData.tanggal
          ? new Date(kData.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
          : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        const metodeLabel = kData.metode_bayar || metodeBayar || 'Tunai / Kasir';

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '390px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}>
              {/* Header Kuitansi Emerald */}
              <div style={{
                background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
                color: '#ffffff',
                padding: '22px 20px 20px',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)'
              }}>
                <button
                  type="button"
                  onClick={() => setKuitansiModal({ isOpen: false, data: null })}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>

                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.2)'
                }}>
                  <CheckCircle2 size={34} strokeWidth={2.4} />
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  opacity: 0.9,
                  marginBottom: '2px'
                }}>
                  Kuitansi Pembayaran Sah
                </div>
                <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 900, letterSpacing: '-0.2px' }}>
                  Pesantren Nurul Wafa
                </h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.22)',
                  fontSize: '0.68rem',
                  fontWeight: 800
                }}>
                  <span>✓</span>
                  <span>TERCATAT & LUNAS</span>
                </div>
              </div>

              {/* Body Kuitansi (Scrollable jika item banyak) */}
              <div style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
                fontSize: '0.78rem'
              }}>
                {/* Info Transaksi & Santri */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>No. Kuitansi</span>
                    <span style={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}>
                      {kData.kuitansi_nomor || '-'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Waktu Bayar</span>
                    <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.72rem' }}>
                      {tglStr}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Nama Santri</span>
                    <span style={{ fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                      {kData.nama_santri}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Identitas</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                      NIS: {kData.nis || '-'} • {kData.asrama || 'Asrama'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Metode</span>
                    <span style={{
                      fontWeight: 800,
                      color: '#047857',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.68rem',
                      border: '1px solid #a7f3d0'
                    }}>
                      {metodeLabel}
                    </span>
                  </div>
                </div>

                {/* Perforation Divider Modern */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '12px 0 10px',
                  gap: '6px'
                }}>
                  <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }} />
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Rincian Item ({items.length})
                  </span>
                  <div style={{ flex: 1, borderTop: '2px dashed #cbd5e1' }} />
                </div>

                {/* Daftar Itemized Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '8px',
                        background: '#f8fafc'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.76rem', lineHeight: 1.2 }}>
                          {it.judul}
                        </div>
                        {it.kategori && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #bbf7d0'
                          }}>
                            {it.kategori}
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        Rp {Number(it.nominal || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Lunas Box Modern */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#047857', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Total Pembayaran
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#059669', fontWeight: 600 }}>
                      Status: Lunas (100%)
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.25rem', color: '#047857', letterSpacing: '-0.3px' }}>
                    Rp {Number(kData.total_bayar || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendWaKuitansi(kData)}
                    style={{
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    <Send size={16} />
                    <span>Kirim Kuitansi ke WA Wali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKuitansiModal({ isOpen: false, data: null })}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL PILIH METODE PEMBAYARAN KASIR (TUNAI / CASH, QRIS MIDTRANS, TRANSFER VA MIDTRANS) */}
      {isMetodeModalOpen && selectedSantri && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '430px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px 18px 30px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
          }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Pilih Metode Pembayaran
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                  {selectedSantri.nama_santri} • {selectedIds.length} Tagihan Dipilih
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMetodeModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Ringkasan Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1px solid #a7f3d0',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#065f46' }}>TOTAL TAGIHAN DIPILIH</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                  Rp {totalBayar.toLocaleString('id-ID')}
                </div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#059669', color: '#ffffff', padding: '3px 8px', borderRadius: '8px' }}>
                Kasir NWF
              </span>
            </div>

            {/* Pilihan Metode Pembayaran Kasir: Cash, Transfer Pending, Transfer Sudah Masuk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* 1. Cash / Tunai */}
              <button
                type="button"
                onClick={() => handleProsesBayarLangsung('Cash', 'Berhasil')}
                disabled={processingPay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1.5px solid #10b981',
                  background: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wallet size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      Cash / Tunai (Langsung Sah)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Uang tunai diterima di loket • Langsung masuk kas &amp; terbit kuitansi
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#059669" />
              </button>

              {/* 2. Transfer Bank (Belum Transfer / Pending) */}
              <button
                type="button"
                onClick={() => handleProsesBayarLangsung('TF', 'Pending')}
                disabled={processingPay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1.5px solid #f59e0b',
                  background: '#fffbeb',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      Transfer Bank (Menunggu Transfer)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '2px' }}>
                      Belum transfer / pending • TIDAK masuk kas sebelum dikonfirmasi
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#d97706" />
              </button>

              {/* 3. Transfer Bank (Sudah Masuk Rekening / Sah) */}
              <button
                type="button"
                onClick={() => handleProsesBayarLangsung('TF', 'Berhasil')}
                disabled={processingPay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1.5px solid #0284c7',
                  background: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                      Transfer Bank (Sudah Masuk Rekening)
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                      Bukti transfer / mutasi bank sudah valid • Langsung sah masuk kas
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} color="#0284c7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERATE TAGIHAN SESUAI SEKOLAH (PERSIS RINCIAN DOKUMEN 2026/2027 & SPP BULANAN) */}
      <ModalGenerateTagihan
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerated={() => {
          fetchRekapAndSantri();
          if (selectedSantri) {
            fetchTagihanSantri(selectedSantri.id);
          }
        }}
        initialSekolah={
          selectedSantri
            ? (selectedSantri.nama_sekolah?.includes('SMA') ? 'SMA' : selectedSantri.nama_sekolah?.includes('SMK') ? 'SMK' : 'SMP')
            : (kasirFilterSekolah !== 'semua' ? kasirFilterSekolah : 'SMP')
        }
        targetSantri={selectedSantri}
      />
    </div>
  );
}
