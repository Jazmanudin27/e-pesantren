import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  ShieldAlert, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Key, 
  User, 
  Phone, 
  Home, 
  Award, 
  Clock, 
  FileText, 
  Sparkles, 
  Save, 
  Eye, 
  EyeOff, 
  Building, 
  Calendar,
  Lock,
  ChevronRight,
  Fingerprint,
  QrCode,
  Bell,
  Check,
  Building2,
  Layers,
  UserCheck,
  HeartHandshake,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  Shield,
  CheckCircle,
  MessageCircle,
  GraduationCap,
  CreditCard,
  Plus,
  XCircle,
  AlertTriangle,
  Settings,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import TabTagihanKeuangan from './TabTagihanKeuangan';
import TabLaporanPerkembangan from './TabLaporanPerkembangan';
import TabInformasiKegiatan from './TabInformasiKegiatan';
import { showConfirm, toastSuccess, showError, showSuccess } from '../../utils/alert.util';

export default function PortalWaliSantri({ onLogout, customSantriId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showBalanceEye, setShowBalanceEye] = useState(true);
  const [santriList, setSantriList] = useState([]);
  const [keuanganSummary, setKeuanganSummary] = useState(null);
  const [tabunganData, setTabunganData] = useState({
    saldo_saat_ini: 0,
    total_masuk: 0,
    total_keluar: 0,
    riwayat_transaksi: []
  });
  const [loadingTabungan, setLoadingTabungan] = useState(false);
  const [transaksiPending, setTransaksiPending] = useState(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(true);
  const [processingPending, setProcessingPending] = useState(false);
  const [latestFeed, setLatestFeed] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
      return customSantriId || sess.santri_id || sess.id || null;
    } catch (e) {
      return customSantriId || null;
    }
  });

  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  // Tab State: 'beranda' | 'tagihan' | 'laporan' | 'informasi' | 'perizinan' | 'absensi' | 'hafalan' | 'profile' | 'praktek' | 'pelanggaran' | 'notifikasi'
  const [currentTab, setCurrentTab] = useState('beranda');
  const [financeActiveTab, setFinanceActiveTab] = useState('tabungan'); // 'tabungan' | 'tagihan'
  const [absensiStatusFilter, setAbsensiStatusFilter] = useState('Semua'); // 'Semua' | 'Hadir' | 'Sakit' | 'Izin' | 'Alfa'
  const [absensiSubTab, setAbsensiSubTab] = useState('berjamaah'); // 'berjamaah' | 'mengaji'
  const [profileSection, setProfileSection] = useState('semua'); // 'semua' | 'biodata' | 'asrama' | 'diniyah' | 'kitab' | 'asatidz' | 'keamanan'

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    username_baru: '',
    password_baru: '',
    konfirmasi_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Form Pengajuan Izin Santri oleh Orang Tua / Wali
  const [isAjukanIzinOpen, setIsAjukanIzinOpen] = useState(false);
  const [submittingIzin, setSubmittingIzin] = useState(false);
  const [formIzin, setFormIzin] = useState({
    jenis_izin: 'Izin Pulang',
    tgl_keluar_rencana: '',
    tgl_kembali_rencana: '',
    keperluan: '',
    nama_penjemput_mahrom: '',
    no_hp_penjemput: '',
    hubungan_mahrom: 'Orang Tua (Wali)'
  });

  // Top Up Saldo Tabungan State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpNominal, setTopUpNominal] = useState('50.000');
  const [topUpKeterangan, setTopUpKeterangan] = useState('');

  // Live Clock & Greeting
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      
      let greet = 'Selamat Malam,';
      if (hours >= 4 && hours < 11) greet = 'Selamat Pagi,';
      else if (hours >= 11 && hours < 15) greet = 'Selamat Siang,';
      else if (hours >= 15 && hours < 18) greet = 'Selamat Sore,';
      setGreeting(greet);

      const dStr = new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(now);
      setCurrentDateStr(dStr);

      const timeFormatted = now.toTimeString().split(' ')[0] + ' WIB';
      setCurrentTimeStr(timeFormatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pastikan browser selalu mulai dari posisi paling atas saat reload / mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
    };
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Scroll ke atas saat ganti tab
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
  }, [currentTab]);

  // Ambil data monitoring wali santri
  const fetchWaliData = async (targetId = selectedSantriId) => {
    try {
      setLoading(true);
      let sessionNisn = '';
      let sessionNama = '';
      try {
        const sess = JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
        sessionNisn = sess.nisn || sess.username || '';
        sessionNama = cleanSantriName(sess.nama_santri || sess.nama || '');
      } catch (e) {}

      let url = '/api/wali/santri';
      const params = new URLSearchParams();
      if (sessionNisn) params.append('nisn', sessionNisn);
      if (sessionNama) params.append('nama', sessionNama);
      if (targetId) params.append('santri_id', targetId);
      const qStr = params.toString();
      if (qStr) url += `?${qStr}`;

      const res = await axios.get(url);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        if (res.data.data.santri?.id) {
          setSelectedSantriId(res.data.data.santri.id);
          setPasswordForm(prev => ({
            ...prev,
            username_baru: res.data.data.santri.username || res.data.data.santri.nis || ''
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data portal wali:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');

  const fetchKeuanganOverview = async (targetId = selectedSantriId) => {
    try {
      const url = targetId ? `/api/keuangan/wali/dashboard?santri_id=${targetId}` : '/api/keuangan/wali/dashboard';
      const res = await axios.get(url);
      if (res.data?.success) {
        setKeuanganSummary(res.data.data.summary);
        const pending = res.data.data.transaksiPending || null;
        setTransaksiPending(pending);
        if (pending) {
          setIsPendingModalOpen(true);
        }
      }
    } catch (e) {}
  };

  const handleLanjutkanBayar = async (pendingTrx) => {
    if (!pendingTrx) return;
    try {
      setProcessingPending(true);
      let snapToken = pendingTrx.snap_token;
      let paymentUrl = pendingTrx.payment_url;

      if (!snapToken) {
        const res = await axios.post('/api/keuangan/wali/lanjutkan', {
          nomor_transaksi: pendingTrx.nomor_transaksi,
          transaksi_id: pendingTrx.id
        });
        if (res.data?.success && res.data?.data?.snap_token) {
          snapToken = res.data.data.snap_token;
          paymentUrl = res.data.data.payment_url;
        } else {
          showError('Gagal Memuat Transaksi', res.data?.message || 'Token pembayaran tidak tersedia.');
          return;
        }
      }

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function () {
            toastSuccess('Pembayaran Berhasil!', 'Pembayaran via Midtrans berhasil diverifikasi.');
            fetchKeuanganOverview();
          },
          onPending: function () {
            toastSuccess('Menunggu Pembayaran', 'Selesaikan pembayaran sebelum batas waktu berakhir.');
            fetchKeuanganOverview();
          },
          onError: function (result) {
            showError('Pembayaran Gagal', result?.status_message || 'Transaksi gagal.');
          },
          onClose: function () {
            fetchKeuanganOverview();
          }
        });
      } else if (paymentUrl) {
        window.open(paymentUrl, '_blank');
      } else {
        showError('Gagal', 'Sistem pop-up Midtrans belum siap.');
      }
    } catch (err) {
      showError('Gagal Melanjutkan Pembayaran', err.response?.data?.message || err.message);
    } finally {
      setProcessingPending(false);
    }
  };

  const handleBatalkanTransaksi = async (pendingTrx) => {
    if (!pendingTrx) return;
    if (!window.confirm('Batalkan transaksi pending ini untuk mengganti metode pembayaran?')) return;
    try {
      setProcessingPending(true);
      const res = await axios.post('/api/keuangan/wali/batal', {
        nomor_transaksi: pendingTrx.nomor_transaksi,
        transaksi_id: pendingTrx.id
      });
      if (res.data?.success) {
        toastSuccess('Transaksi Dibatalkan', 'Silakan pilih tagihan dan bayar kembali.');
        setTransaksiPending(null);
        setIsPendingModalOpen(false);
        fetchKeuanganOverview();
      }
    } catch (err) {
      showError('Gagal Membatalkan', err.response?.data?.message || err.message);
    } finally {
      setProcessingPending(false);
    }
  };

  const fetchLatestFeed = async () => {
    try {
      const res = await axios.get('/api/informasi-kegiatan/feed?limit=6');
      if (res.data?.success) {
        setLatestFeed(res.data.data.feed || []);
      }
    } catch (e) {}
  };

  const fetchSantriTabungan = async (targetId = selectedSantriId) => {
    if (!targetId) return;
    try {
      setLoadingTabungan(true);
      const res = await axios.get(`/api/tabungan/santri/${targetId}`);
      if (res.data?.success && res.data.data) {
        setTabunganData(res.data.data);
      }
    } catch (e) {
      console.warn('Tabungan santri notice:', e.message);
    } finally {
      setLoadingTabungan(false);
    }
  };

  useEffect(() => {
    fetchWaliData();
    fetchKeuanganOverview();
    fetchLatestFeed();
    fetchSantriTabungan();
  }, [selectedSantriId]);

  const handleSantriChange = (newId) => {
    setSelectedSantriId(newId);
    fetchWaliData(newId);
    fetchKeuanganOverview(newId);
    fetchSantriTabungan(newId);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.password_baru) {
      showError('Validasi Gagal', 'Password baru wajib diisi.');
      return;
    }
    if (passwordForm.password_baru.length < 4) {
      showError('Validasi Gagal', 'Password minimal 4 karakter.');
      return;
    }
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      showError('Validasi Gagal', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await axios.put('/api/wali/password', {
        santri_id: selectedSantriId,
        password_baru: passwordForm.password_baru,
        username_baru: passwordForm.username_baru
      });
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Kredensial login akun orang tua santri berhasil disimpan.');
        setPasswordForm({
          username_baru: passwordForm.username_baru,
          password_baru: '',
          konfirmasi_password: ''
        });
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengubah password');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleLogoutAction = () => {
    showConfirm('Keluar Akun?', 'Apakah Bapak/Ibu ingin keluar dari Portal Orang Tua Santri?', () => {
      localStorage.removeItem('desktop_session');
      localStorage.removeItem('mobile_session');
      sessionStorage.removeItem('desktop_session');
      if (onLogout) {
        onLogout();
      } else {
        window.location.hash = '#login';
        window.location.reload();
      }
    });
  };

  const openModalAjukanIzin = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const returnDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const returnStr = `${returnDate.getFullYear()}-${pad(returnDate.getMonth() + 1)}-${pad(returnDate.getDate())}T17:00`;

    setFormIzin({
      jenis_izin: 'Izin Pulang',
      tgl_keluar_rencana: nowStr,
      tgl_kembali_rencana: returnStr,
      keperluan: '',
      nama_penjemput_mahrom: santri?.nama_wali || '',
      no_hp_penjemput: santri?.no_wa_wali || '',
      hubungan_mahrom: santri?.hubungan_wali || 'Orang Tua'
    });
    setIsAjukanIzinOpen(true);
  };

  const handleSubmitIzin = async (e) => {
    e.preventDefault();
    if (!formIzin.keperluan.trim()) {
      showError('Alasan Izin Wajib Diisi', 'Silakan cantumkan keperluan / alasan santri mengajukan izin.');
      return;
    }
    if (!formIzin.tgl_keluar_rencana || !formIzin.tgl_kembali_rencana) {
      showError('Jadwal Tidak Lengkap', 'Pilih perkiraan tanggal keluar dan tanggal kembali santri.');
      return;
    }
    try {
      setSubmittingIzin(true);
      const res = await axios.post('/api/perizinan', {
        ...formIzin,
        santri_id: selectedSantriId || santri?.id,
        status: 'Menunggu Persetujuan'
      });
      if (res.data?.success) {
        showSuccess('Pengajuan Terkirim!', 'Permohonan izin santri berhasil dikirim. Menunggu verifikasi dari pengasuh.');
        setIsAjukanIzinOpen(false);
        fetchWaliData(selectedSantriId || santri?.id);
      } else {
        showError('Gagal', res.data?.message || 'Terjadi kesalahan saat menyimpan pengajuan izin.');
      }
    } catch (err) {
      showError('Gagal Mengajukan Izin', err.response?.data?.message || err.message);
    } finally {
      setSubmittingIzin(false);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const rawNom = String(topUpNominal).replace(/[^0-9]/g, '');
    const nom = parseFloat(rawNom);
    if (!nom || isNaN(nom) || nom <= 0) {
      showError('Nominal Tidak Valid', 'Silakan masukkan nominal pengisian saldo yang benar.');
      return;
    }
    if (nom < 5000) {
      showError('Minimal Pengisian', 'Nominal pengisian saldo tabungan minimal Rp 5.000.');
      return;
    }

    const targetId = selectedSantriId || santri?.id;
    try {
      setSubmittingTopUp(true);

      // Request Snap Token Midtrans untuk Top Up Tabungan
      const res = await axios.post('/api/tabungan/topup-midtrans', {
        santri_id: targetId,
        nominal: nom,
        keterangan: (topUpKeterangan || '').trim() || 'Top Up Saldo Tabungan via Midtrans'
      });

      if (res.data?.success && res.data?.data?.snap_token) {
        const { snap_token, payment_url } = res.data.data;

        if (window.snap) {
          window.snap.pay(snap_token, {
            onSuccess: async function (result) {
              toastSuccess('Pembayaran Berhasil!', `Saldo tabungan ananda berhasil diisi sebesar Rp ${nom.toLocaleString('id-ID')}.`);
              setIsTopUpModalOpen(false);
              setTopUpNominal('');
              setTopUpKeterangan('');
              fetchSantriTabungan(targetId);
              fetchKeuanganOverview(targetId);
            },
            onPending: function (result) {
              toastSuccess('Menunggu Pembayaran', 'Selesaikan pembayaran via Midtrans sesuai instruksi.');
              setIsTopUpModalOpen(false);
            },
            onError: function (result) {
              showError('Pembayaran Gagal', result?.status_message || 'Transaksi pembayaran dibatalkan atau gagal.');
            },
            onClose: function () {
              fetchSantriTabungan(targetId);
            }
          });
        } else if (payment_url) {
          window.open(payment_url, '_blank');
        } else {
          showError('Gagal', 'Sistem pembayaran Midtrans Snap tidak dapat dimuat.');
        }
      } else {
        // Fallback langsung jika Midtrans offline
        const fallbackRes = await axios.post('/api/tabungan/setor', {
          santri_id: targetId,
          nominal: nom,
          keterangan: (topUpKeterangan || '').trim() || 'Pengisian Saldo via Wali Santri',
          admin_nama: `Wali (${rawSantriName})`
        });
        if (fallbackRes.data?.success) {
          toastSuccess('Pengisian Berhasil!', `Saldo tabungan ananda berhasil diisi sebesar Rp ${nom.toLocaleString('id-ID')}.`);
          setIsTopUpModalOpen(false);
          setTopUpNominal('');
          setTopUpKeterangan('');
          fetchSantriTabungan(targetId);
          fetchKeuanganOverview(targetId);
        } else {
          showError('Gagal', fallbackRes.data?.message || 'Gagal mengisi saldo tabungan.');
        }
      }
    } catch (err) {
      showError('Gagal Top Up Saldo', err.response?.data?.message || err.message);
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const santri = data?.santri || {};
  const tahfidz = data?.tahfidzSetoran || [];
  const praktek = data?.praktekIbadah || [];
  const presensi = data?.presensiJamaah || [];
  const perizinan = data?.perizinan || [];
  const pelanggaran = data?.pelanggaran || [];

  // Hitung status absensi santri
  const countHadir = presensi.filter(p => (p.status || '').toLowerCase().includes('hadir')).length;
  const countSakit = presensi.filter(p => (p.status || '').toLowerCase().includes('sakit')).length;
  const countIzin = perizinan.length || presensi.filter(p => (p.status || '').toLowerCase().includes('izin')).length;
  const countAlfa = presensi.filter(p => (p.status || '').toLowerCase().includes('alfa') || (p.status || '').toLowerCase().includes('absen')).length;

  const cleanSantriName = (name) => {
    if (!name) return '';
    let c = String(name).trim();
    if (c.includes('(Wali ')) {
      const m = c.match(/\(Wali\s+([^)]+)\)/i);
      if (m && m[1]) return m[1].trim();
    }
    if (c.toLowerCase().startsWith('wali santri ')) return c.substring(12).trim();
    if (c.toLowerCase().startsWith('wali ')) return c.substring(5).trim();
    if (c.toLowerCase().startsWith('orang tua santri')) return c.replace(/^orang tua santri/i, '').replace(/^[^\w]+/, '').trim();
    return c;
  };

  const getStoredSantriName = () => {
    try {
      const sess = JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
      return cleanSantriName(sess.nama_santri || sess.nama || sess.username || '');
    } catch (e) {
      return '';
    }
  };

  const rawSantriName = cleanSantriName(santri.nama_santri || data?.santri?.nama_santri) || getStoredSantriName() || 'Santri';
  const displayNisn = (santri.nisn && santri.nisn !== '-') 
    ? santri.nisn 
    : (santri.nis || sessionData.nisn || sessionData.nis || '-');
  const initial = rawSantriName.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'SN';

  const openAbsensiWithFilter = (status) => {
    setAbsensiStatusFilter(status);
    setCurrentTab('absensi');
  };

  // Kurikulum Kitab Kuning Berdasarkan Tingkat Diniyah
  const kitabList = santri.tingkat_diniyah ? [
    { judul: 'Safinatun Najah', bidang: 'Fiqih Ibadah', status: 'Aktif Belajar', badge: 'badge-success' },
    { judul: 'Jurumiyyah', bidang: 'Bahasa Arab & Nahwu', status: 'Aktif Belajar', badge: 'badge-info' }
  ] : [];

  // Dewan Asatidz Pembina (Real data santri)
  const asatidzList = [];
  if (santri.pembina_asrama) {
    asatidzList.push({
      nama: santri.pembina_asrama,
      peran: 'Pembina Kobong & Asrama',
      hp: santri.no_hp_pembina || ''
    });
  }
  if (santri.wali_kelas) {
    asatidzList.push({
      nama: santri.wali_kelas,
      peran: 'Wali Kelas Madrasah Diniyah',
      hp: ''
    });
  }

  return (
    <div id="wali" style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      display: 'flex',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Mobile Frame Container: 100% on phone, max 430px on desktop */}
      <div id="top-portal-wali" style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '100vh',
        background: '#f8fafc',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '80px',
        boxSizing: 'border-box'
      }}>

        {/* =========================================================================
            1. BERANDA TAB (HOME VIEW)
        ========================================================================= */}
        {currentTab === 'beranda' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Modern Teal Gradient Banner (Matched with Mobile Admin) */}
            <div style={{
              background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
              padding: '16px 16px 34px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              position: 'relative'
            }}>
              {/* Header Top Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Brand Logo: NWF Mobile dengan Emblem Logo Elegan (tidak mepet) */}
                <div 
                  onClick={() => setCurrentTab('profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '13px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
                    flexShrink: 0
                  }}>
                    <img 
                      src="/nwf.png" 
                      alt="NWF Logo" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain'
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span style={{
                        fontWeight: 900,
                        fontSize: '1.45rem',
                        letterSpacing: '-0.5px',
                        color: '#ffffff',
                        lineHeight: 1,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }}>
                        NWF
                      </span>
                      <span style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        fontStyle: 'italic',
                        letterSpacing: '-0.2px',
                        color: '#a7f3d0',
                        lineHeight: 1,
                        textShadow: '0 2px 6px rgba(11, 107, 96, 0.35)'
                      }}>
                        Mobile
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.85)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginTop: '2px',
                      lineHeight: 1
                    }}>
                      Portal Orang Tua Santri
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons (Bell, Logout) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setCurrentTab('notifikasi')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '7px',
                      borderRadius: '10px',
                      position: 'relative'
                    }}
                    title="Pemberitahuan Pesantren"
                  >
                    <Bell size={18} />
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#ef4444'
                    }} />
                  </button>

                  <button
                    onClick={handleLogoutAction}
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '7px',
                      borderRadius: '10px'
                    }}
                    title="Keluar Akun"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 1. REKAP STATUS KEHADIRAN & IBADAH (DESAIN MODERN LUXURY CARD) */}
            <div style={{ padding: '0 14px', marginTop: '-24px', position: 'relative', zIndex: 12 }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                padding: '12px 12px 10px',
                boxShadow: '0 10px 25px -4px rgba(13, 118, 110, 0.14), 0 2px 6px rgba(0, 0, 0, 0.04)'
              }}>
                {/* Header Mini Status: Ganti jadi Nama Santri */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <User size={15} strokeWidth={2.5} />
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {rawSantriName}
                      </div>
                      <div style={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        color: '#64748b',
                        lineHeight: 1.1,
                        marginTop: '1px'
                      }}>
                        NISN: {displayNisn} {santri.nama_kamar ? `• ${santri.nama_kamar}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('absensi')}
                    style={{
                      background: 'rgba(13, 148, 136, 0.08)',
                      border: '1px solid rgba(13, 148, 136, 0.2)',
                      borderRadius: '8px',
                      color: '#0d9488',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '4px 8px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Rincian <ChevronRight size={12} />
                  </button>
                </div>

                {/* 4 Cards Grid (Display Info Sahaja, Klik Rincian di Atas) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px'
                }}>
                  {/* Hadir */}
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #bbf7d0',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '10px',
                      background: '#10b981',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px -1px rgba(16, 185, 129, 0.35)'
                    }}>
                      <Check size={16} strokeWidth={2.8} />
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#15803d',
                      marginTop: '4px',
                      lineHeight: 1
                    }}>
                      {countHadir}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#166534', marginTop: '2px' }}>
                      Hadir
                    </span>
                  </div>

                  {/* Sakit */}
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #fef2f2 0%, #fee2e2 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #fecaca',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '10px',
                      background: '#ef4444',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px -1px rgba(239, 68, 68, 0.35)'
                    }}>
                      <Building2 size={16} strokeWidth={2.6} />
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#b91c1c',
                      marginTop: '4px',
                      lineHeight: 1
                    }}>
                      {countSakit}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', marginTop: '2px' }}>
                      Sakit
                    </span>
                  </div>

                  {/* Izin */}
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #fde68a',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '10px',
                      background: '#f59e0b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px -1px rgba(245, 158, 11, 0.35)'
                    }}>
                      <FileText size={16} strokeWidth={2.6} />
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#b45309',
                      marginTop: '4px',
                      lineHeight: 1
                    }}>
                      {countIzin}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', marginTop: '2px' }}>
                      Izin
                    </span>
                  </div>

                  {/* Alfa */}
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #f0fdfa 0%, #ccfbf1 100%)',
                      borderRadius: '14px',
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      border: '1px solid #99f6e4',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '10px',
                      background: '#0d9488',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 8px -1px rgba(13, 148, 136, 0.35)'
                    }}>
                      <Clock size={16} strokeWidth={2.6} />
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: 900,
                      color: '#0f766e',
                      marginTop: '4px',
                      lineHeight: 1
                    }}>
                      {countAlfa}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#115e59', marginTop: '2px' }}>
                      Alfa
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CARD TABUNGAN SANTRI & KEUANGAN SPP (DESAIN EMERALD TEAL LEBIH KOMPAK) */}
            <div style={{ padding: '8px 14px 0', position: 'relative', zIndex: 11 }}>
              <div
                style={{
                  background: financeActiveTab === 'tabungan' ? '#044e42' : '#0f3c5c',
                  borderRadius: '14px',
                  padding: '9px 12px 8px',
                  boxShadow: financeActiveTab === 'tabungan'
                    ? '0 6px 16px -4px rgba(4, 78, 66, 0.35)'
                    : '0 6px 16px -4px rgba(15, 60, 92, 0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  color: '#ffffff',
                  transition: 'background 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Tab Switcher: Tabungan & Tagihan (Kapsul Ramping) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '3px',
                  background: 'rgba(0, 0, 0, 0.22)',
                  padding: '2px',
                  borderRadius: '10px',
                  marginBottom: '8px'
                }}>
                  <button
                    type="button"
                    onClick={() => setFinanceActiveTab('tabungan')}
                    style={{
                      border: 'none',
                      background: financeActiveTab === 'tabungan' ? '#ffffff' : 'transparent',
                      color: financeActiveTab === 'tabungan' ? '#044e42' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '3px 6px',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: financeActiveTab === 'tabungan' ? '0 2px 5px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Wallet size={12} color={financeActiveTab === 'tabungan' ? '#044e42' : 'rgba(255, 255, 255, 0.8)'} />
                    <span>Tabungan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceActiveTab('tagihan')}
                    style={{
                      border: 'none',
                      background: financeActiveTab === 'tagihan' ? '#ffffff' : 'transparent',
                      color: financeActiveTab === 'tagihan' ? '#0f3c5c' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 700,
                      fontSize: '11px',
                      padding: '3px 6px',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: financeActiveTab === 'tagihan' ? '0 2px 5px rgba(0,0,0,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CreditCard size={12} color={financeActiveTab === 'tagihan' ? '#0f3c5c' : 'rgba(255, 255, 255, 0.8)'} />
                    <span>Tagihan</span>
                    {(keuanganSummary?.totalBelumBayar || 0) > 0 && (
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#ef4444'
                      }} />
                    )}
                  </button>
                </div>

                {/* KONTEN TAB 1: TABUNGAN SANTRI */}
                {financeActiveTab === 'tabungan' && (
                  <div>
                    {/* Header: Title + Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          color: '#5eead4',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          lineHeight: 1.1
                        }}>
                          SALDO TABUNGAN SANTRI
                        </div>
                        <div style={{
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          letterSpacing: '-0.3px',
                          lineHeight: 1.1,
                          marginTop: '2px'
                        }}>
                          {formatRp(tabunganData?.saldo_saat_ini || 0)}
                        </div>
                      </div>

                      <div
                        onClick={() => setCurrentTab('tabungan')}
                        title="Buka Buku Kas"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5eead4',
                          cursor: 'pointer',
                          flexShrink: 0,
                          marginLeft: '8px',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Wallet size={15} strokeWidth={2.4} />
                      </div>
                    </div>

                    {/* Garis Tipis Halus */}
                    <div style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      margin: '7px 0 6px'
                    }} />

                    {/* Sub Footer: TOTAL UANG MASUK & TOTAL PENGAMBILAN */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          color: '#99f6e4',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase'
                        }}>
                          TOTAL UANG MASUK
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          marginTop: '1px',
                          letterSpacing: '-0.2px'
                        }}>
                          +{formatRp(tabunganData?.total_masuk || 0)}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          color: '#fecdd3',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase'
                        }}>
                          TOTAL PENGAMBILAN
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          marginTop: '1px',
                          letterSpacing: '-0.2px'
                        }}>
                          -{formatRp(tabunganData?.total_keluar || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* KONTEN TAB 2: TAGIHAN KEUANGAN */}
                {financeActiveTab === 'tagihan' && (
                  <div>
                    {/* Header: Title + Icon */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          color: '#7dd3fc',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          lineHeight: 1.1
                        }}>
                          TOTAL TAGIHAN KEUANGAN
                        </div>
                        <div style={{
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          letterSpacing: '-0.3px',
                          lineHeight: 1.1,
                          marginTop: '2px'
                        }}>
                          {keuanganSummary?.formattedTotalBelumBayar || 'Rp 0'}
                        </div>
                      </div>

                      <div
                        onClick={() => setCurrentTab('tagihan')}
                        title="Buka Rincian Tagihan"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#7dd3fc',
                          cursor: 'pointer',
                          flexShrink: 0,
                          marginLeft: '8px',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <CreditCard size={15} strokeWidth={2.4} />
                      </div>
                    </div>

                    {/* Garis Tipis Halus */}
                    <div style={{
                      height: '1px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      margin: '7px 0 6px'
                    }} />

                    {/* Sub Footer: SPP BULANAN & BIAYA AWAL MASUK */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          color: '#bae6fd',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase'
                        }}>
                          SPP BULANAN
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          marginTop: '1px',
                          letterSpacing: '-0.2px'
                        }}>
                          {keuanganSummary?.formattedBulanan || 'Rp 0'}
                        </div>
                      </div>

                      <div>
                        <div style={{
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          color: '#bae6fd',
                          letterSpacing: '0.03em',
                          textTransform: 'uppercase'
                        }}>
                          SISA BIAYA MASUK
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          marginTop: '1px',
                          letterSpacing: '-0.2px'
                        }}>
                          {keuanganSummary?.formattedSisaBiayaMasuk || 'Rp 0'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION MENU: 9 ITEMS KLASIK, MODERN & ELEGAN (CARD PUTIH PERSIS MOBILE ADMIN) */}
            <div style={{ padding: '16px 14px 4px' }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '-0.2px'
              }}>
                <span style={{
                  width: '4px',
                  height: '15px',
                  background: '#0d766e',
                  borderRadius: '4px'
                }} />
                Menu Layanan Santri
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px 6px',
                justifyItems: 'center'
              }}>
                {/* 1. Tabungan Santri */}
                <div onClick={() => setCurrentTab('tabungan')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: '0 8px 18px -2px rgba(16, 185, 129, 0.45)'
                  }}>
                    <Wallet size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Tabungan</span>
                </div>

                {/* 2. Bayar SPP / Tagihan */}
                <div onClick={() => setCurrentTab('tagihan')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    boxShadow: '0 8px 18px -2px rgba(59, 130, 246, 0.45)'
                  }}>
                    <CreditCard size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Bayar SPP</span>
                </div>

                {/* 3. Presensi Sholat / Berjamaah */}
                <div onClick={() => setCurrentTab('absensi')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                    boxShadow: '0 8px 18px -2px rgba(6, 182, 212, 0.45)'
                  }}>
                    <Fingerprint size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Berjamaah</span>
                </div>

                {/* 4. Tahfidz */}
                <div onClick={() => setCurrentTab('hafalan')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    boxShadow: '0 8px 18px -2px rgba(168, 85, 247, 0.45)'
                  }}>
                    <BookOpen size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Tahfidz</span>
                </div>

                {/* 5. Perizinan Pulang */}
                <div onClick={() => setCurrentTab('perizinan')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    boxShadow: '0 8px 18px -2px rgba(249, 115, 22, 0.45)'
                  }}>
                    <Clock size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Perizinan</span>
                </div>

                {/* 6. Praktek Ibadah */}
                <div onClick={() => setCurrentTab('praktek')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    boxShadow: '0 8px 18px -2px rgba(20, 184, 166, 0.45)'
                  }}>
                    <HeartHandshake size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Praktek</span>
                </div>

                {/* 7. Perkembangan Santri (sebelumnya Rapor) */}
                <div onClick={() => setCurrentTab('laporan')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    boxShadow: '0 8px 18px -2px rgba(2, 132, 199, 0.45)'
                  }}>
                    <Award size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Perkembangan</span>
                </div>

                {/* 8. Tata Tertib */}
                <div onClick={() => setCurrentTab('pelanggaran')} style={menuCardStyle}>
                  <div style={{
                    ...squircleIconStyle,
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    boxShadow: '0 8px 18px -2px rgba(244, 63, 94, 0.45)'
                  }}>
                    <ShieldAlert size={26} strokeWidth={2.3} color="#ffffff" />
                  </div>
                  <span style={menuLabelStyle}>Tata Tertib</span>
                </div>
              </div>
            </div>

            {/* 3. SLIDER KEGIATAN & AGENDA PESANTREN */}
            <div style={{ padding: '12px 14px 4px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '-0.2px'
                }}>
                  <span style={{
                    width: '4px',
                    height: '15px',
                    background: '#059669',
                    borderRadius: '4px'
                  }} />
                  Kegiatan Pesantren
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('kegiatan')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: 0
                  }}
                >
                  Lihat Semua <ChevronRight size={13} />
                </button>
              </div>

              {/* Horizontal Scroll Carousel */}
              <div style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              }}>
                {(latestFeed && latestFeed.length > 0 ? latestFeed : [
                  {
                    id: 'fb-1',
                    judul: "Kajian Kitab Kuning & Sorogan Santri",
                    kategori: 'Pengajian',
                    konten: "Kajian fiqih ibadah & nahwu ba'da Subuh dan Maghrib bersama dewan asatidz.",
                    tanggal_publikasi: 'Harian'
                  },
                  {
                    id: 'fb-2',
                    judul: "Setoran Tahfidz & Tasmi' Al-Qur'an",
                    kategori: 'Tahfidz',
                    konten: "Muroja'ah rutin santri dan evaluasi mutqin hafalan bersama musyrif asrama.",
                    tanggal_publikasi: 'Mingguan'
                  },
                  {
                    id: 'fb-3',
                    judul: "Muhadhoroh & Latihan Khitobah 3 Bahasa",
                    kategori: 'Ekstrakurikuler',
                    konten: "Pembinaan public speaking santri dalam Bahasa Arab, Inggris, dan Indonesia.",
                    tanggal_publikasi: 'Kamis Malam'
                  },
                  {
                    id: 'fb-4',
                    judul: "Disiplin Presensi Sholat Berjamaah",
                    kategori: 'Ibadah',
                    konten: "Pemantauan kehadiran sholat fardhu & tahajud di Masjid Jami' Pesantren.",
                    tanggal_publikasi: 'Wajib'
                  }
                ]).map((item, idx) => {
                  const gradientList = [
                    'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                  ];
                  const bgGrad = gradientList[idx % gradientList.length];

                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => setCurrentTab('kegiatan')}
                      style={{
                        flex: '0 0 215px',
                        scrollSnapAlign: 'start',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 4px 14px -3px rgba(15, 23, 42, 0.08)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {/* Banner Visual */}
                      <div style={{
                        height: '75px',
                        background: item.lampiran_url ? `url(${item.lampiran_url}) center/cover no-repeat` : bgGrad,
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        position: 'relative',
                        color: '#ffffff'
                      }}>
                        <span style={{
                          background: 'rgba(0, 0, 0, 0.35)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '8px',
                          letterSpacing: '0.02em'
                        }}>
                          {item.kategori || 'Kegiatan'}
                        </span>
                        <Sparkles size={14} style={{ opacity: 0.8 }} />
                      </div>

                      {/* Info Body */}
                      <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <div>
                          <div style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: '#0f172a',
                            lineHeight: 1.25,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.judul}
                          </div>
                          <div style={{
                            fontSize: '0.66rem',
                            color: '#64748b',
                            marginTop: '4px',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.konten}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.62rem',
                          color: '#059669',
                          fontWeight: 700,
                          marginTop: '8px',
                          paddingTop: '6px',
                          borderTop: '1px solid #f8fafc'
                        }}>
                          <Calendar size={11} />
                          <span>{item.tanggal_publikasi ? (typeof item.tanggal_publikasi === 'string' && item.tanggal_publikasi.includes('-') ? new Date(item.tanggal_publikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : item.tanggal_publikasi) : 'Pesantren'}</span>
                          <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>Lihat &rarr;</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REMINDER PILL JIKA POPUP DITUTUP SEMENTARA */}
            {transaksiPending && !isPendingModalOpen && (
              <div style={{ padding: '8px 16px 0' }}>
                <button
                  type="button"
                  onClick={() => setIsPendingModalOpen(true)}
                  style={{
                    width: '100%',
                    background: '#fef3c7',
                    border: '1px solid #fcd34d',
                    color: '#b45309',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    boxShadow: '0 2px 6px rgba(180, 83, 9, 0.1)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> 1 Transaksi Menunggu Pembayaran
                  </span>
                  <span style={{ fontWeight: 800, color: '#92400e' }}>Buka Pop-up &gt;</span>
                </button>
              </div>
            )}

            {/* POPUP MODAL TRANSAKSI PENDING DI BERANDA */}
            {isPendingModalOpen && transaksiPending && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '16px'
              }}>
                <div style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  width: '100%',
                  maxWidth: '380px',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  {/* Header Popup */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                    color: '#fff',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="#f59e0b" />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Menunggu Pembayaran</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          #{transaksiPending.nomor_transaksi}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPendingModalOpen(false)}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        border: 'none',
                        color: '#fff',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 700
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Content Body */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      background: '#f8fafc',
                      borderRadius: '16px',
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px' }}>TOTAL YANG HARUS DIBAYAR</div>
                      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                        {formatRp(transaksiPending.total_bayar)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px', fontWeight: 600 }}>
                        {transaksiPending.item_dibayar || 'Tagihan Santri'}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', lineHeight: 1.4 }}>
                      Transaksi pembayaran ini masih aktif. Anda dapat melanjutkan pembayaran atau membatalkannya untuk memilih metode lain.
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleLanjutkanBayar(transaksiPending)}
                        disabled={processingPending}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: '#fff',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                          opacity: processingPending ? 0.7 : 1
                        }}
                      >
                        <CreditCard size={16} /> {processingPending ? 'Memproses...' : 'Lanjutkan Bayar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBatalkanTransaksi(transaksiPending)}
                        disabled={processingPending}
                        style={{
                          width: '100%',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          padding: '11px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: processingPending ? 0.7 : 1
                        }}
                      >
                        <RotateCw size={14} /> Ganti Metode / Batal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TABUNGAN SANTRI (BUKU TABUNGAN & RIWAYAT MUTASI UNTUK ORANG TUA)
        ========================================================================= */}
        {currentTab === 'tabungan' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green (Persis Absensi) */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Buku Tabungan Santri
                    </h2>
                  </div>
                </div>

                <button 
                  onClick={() => fetchSantriTabungan(selectedSantriId)}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Segarkan Saldo"
                >
                  <RotateCw size={17} className={loadingTabungan ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              {/* HERO STAT CARD TABUNGAN */}
              <div style={{
                background: 'linear-gradient(135deg, #0d766e 0%, #044e42 100%)',
                borderRadius: '20px',
                padding: '16px 16px 14px',
                color: '#ffffff',
                boxShadow: '0 8px 24px -4px rgba(13, 118, 110, 0.35)',
                marginBottom: '14px',
                transition: 'all 0.25s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: '#99f6e4',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      SALDO TABUNGAN SANTRI
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                      {formatRp(tabunganData?.saldo_saat_ini || 0)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                      Uang saku santri terkelola aman & amanah
                    </div>
                  </div>

                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.16)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '1.4rem'
                  }}>
                    💰
                  </div>
                </div>

                {/* 2 Mini Counters */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.22)',
                  padding: '10px 12px',
                  borderRadius: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ArrowDownLeft size={11} color="#4ade80" /> Total Uang Masuk
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4ade80', marginTop: '2px' }}>
                      +{formatRp(tabunganData?.total_masuk || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <ArrowUpRight size={11} color="#fca5a5" /> Total Pengambilan
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fca5a5', marginTop: '2px' }}>
                      -{formatRp(tabunganData?.total_keluar || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON: ISI SALDO TABUNGAN (TOP UP) */}
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                  cursor: 'pointer',
                  marginBottom: '14px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Plus size={18} strokeWidth={2.8} />
                <span>Isi Saldo Tabungan (Top Up)</span>
              </button>

              {/* Petunjuk Pengiriman Uang Saku */}
              <div style={{
                background: '#f0fdf4',
                borderRadius: '14px',
                border: '1px solid #bbf7d0',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
                  <strong>Informasi Tabungan Santri:</strong> Uang saku yang disetor dikelola oleh bendahara / wali asrama pondok. Santri dapat mengambil uang saku harian/mingguan untuk kebutuhan jajan, kitab, dan keperluan pesantren.
                </div>
              </div>

              {/* Riwayat Mutasi Transaksi */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                    Riwayat Mutasi Tabungan ({tabunganData?.riwayat_transaksi?.length || 0})
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Real-time
                  </span>
                </div>

                {loadingTabungan ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.8rem' }}>
                    Memuat riwayat mutasi...
                  </div>
                ) : tabunganData?.riwayat_transaksi?.length === 0 ? (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    border: '1px dashed #cbd5e1',
                    color: '#94a3b8',
                    fontSize: '0.78rem'
                  }}>
                    Belum ada transaksi tabungan yang tercatat untuk santri ini.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tabunganData.riwayat_transaksi.map((t) => {
                      const isMasuk = t.jenis_transaksi === 'masuk';
                      return (
                        <div
                          key={t.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: isMasuk ? '#ecfdf5' : '#fef2f2',
                              color: isMasuk ? '#059669' : '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {isMasuk ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {t.keterangan || (isMasuk ? 'Penambahan Saldo' : 'Pengambilan')}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                                {t.tanggal_transaksi} • Saldo: {formatRp(t.saldo_sebelum)} &rarr;{' '}
                                <span style={{ fontWeight: 700, color: '#0f766e' }}>{formatRp(t.saldo_sesudah)}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                            <div style={{
                              fontSize: '0.92rem',
                              fontWeight: 900,
                              color: isMasuk ? '#059669' : '#dc2626'
                            }}>
                              {isMasuk ? '+' : '-'}{formatRp(t.nominal)}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '1px' }}>
                              {t.kode_transaksi}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. PROFILE TAB (HALAMAN LENGKAP: BIODATA, ASRAMA, KELAS, KITAB, GURU, KEAMANAN)
        ========================================================================= */}
        {currentTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Profil Lengkap Santri
                    </h2>
                    <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                      Santri: {rawSantriName} (NISN: {displayNisn})
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleLogoutAction}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="Keluar Akun"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* Santri Profile Content */}

            {/* Profile Santri Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)',
              borderRadius: '24px',
              padding: '20px 18px',
              color: '#ffffff',
              boxShadow: '0 10px 24px -4px rgba(2, 132, 199, 0.4)',
              marginBottom: '16px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '24px',
                background: '#ffffff',
                color: '#0284c7',
                fontSize: '1.6rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)'
              }}>
                {initial}
              </div>

              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                {santri.nama_santri || rawSantriName}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#bae6fd' }}>
                NISN: <strong>{displayNisn}</strong>
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 10px', borderRadius: '999px' }}>
                  {santri.status || 'Aktif'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.22)', color: '#ffffff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                  {santri.status_santri || 'Mukim'}
                </span>
              </div>


            </div>

            {/* Quick Section Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '14px' }}>
              {[
                { id: 'semua', label: 'Semua Data' },
                { id: 'biodata', label: 'Biodata Santri' },
                { id: 'asrama', label: 'Asrama & Kobong' },
                { id: 'diniyah', label: 'Madrasah Diniyah' },
                { id: 'kitab', label: 'Kitab Kuning' },
                { id: 'asatidz', label: 'Dewan Asatidz' },
                { id: 'keamanan', label: 'Keamanan Akun' }
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setProfileSection(pill.id)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: profileSection === pill.id ? '#0284c7' : '#ffffff',
                    color: profileSection === pill.id ? '#ffffff' : '#64748b',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* ===================================================================
                SECTION 1: BIODATA SANTRI & WALI
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'biodata') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={15} /> Biodata Santri & Orang Tua / Wali
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Nama Lengkap:</span>
                  <span style={infoValue}>{santri.nama_santri || rawSantriName}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>NISN:</span>
                  <span style={{ ...infoValue, fontWeight: 800, color: '#0369a1' }}>{displayNisn}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Kode Santri:</span>
                  <span style={infoValue}>{santri.kode_santri || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Jenis Kelamin:</span>
                  <span style={infoValue}>{santri.jk === 'P' ? 'Akhwat (Perempuan)' : 'Ikhwan (Laki-laki)'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Tahun Masuk:</span>
                  <span style={infoValue}>Tahun Ajaran {santri.tahun_masuk || '2026/2027'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Nama Orang Tua / Wali:</span>
                  <span style={{ ...infoValue, color: '#0f172a', fontWeight: 800 }}>{santri.nama_wali || '-'} ({santri.hubungan_wali || 'Orang Tua'})</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>No. WhatsApp Wali:</span>
                  <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_wa_wali || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Alamat Rumah Asal:</span>
                  <span style={infoValue}>{santri.alamat_asal || '-'}</span>
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 2: PENEMPATAN ASRAMA & KOBONG
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'asrama') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} /> Penempatan Asrama & Kobong Santri
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Gedung Asrama:</span>
                  <span style={{ ...infoValue, fontWeight: 800 }}>{santri.nama_asrama || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Kamar Kobong:</span>
                  <span style={infoValue}>{santri.nama_kamar ? `${santri.nama_kamar} ${santri.kode_kamar ? `(${santri.kode_kamar})` : ''}` : '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Asatidz Pembina Kobong:</span>
                  <span style={{ ...infoValue, color: '#0284c7', fontWeight: 700 }}>{santri.pembina_asrama || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Kontak WhatsApp Pembina:</span>
                  <span style={{ ...infoValue, color: '#059669', fontWeight: 700 }}>{santri.no_hp_pembina || '-'}</span>
                </div>
                {/* Direct Action Button WhatsApp Pembina */}
                {santri.no_hp_pembina && (
                  <a
                    href={`https://wa.me/${String(santri.no_hp_pembina).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      marginTop: '4px'
                    }}
                  >
                    <MessageCircle size={15} /> Hubungi Pembina Kobong via WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* ===================================================================
                SECTION 3: TINGKAT MADRASAH DINIYAH & KELAS
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'diniyah') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={15} /> Jenjang Madrasah Diniyah & Kelas
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Tingkat Diniyah:</span>
                  <span style={{ ...infoValue, fontWeight: 800, color: '#d97706' }}>{santri.tingkat_diniyah || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Wali Kelas Diniyah:</span>
                  <span style={infoValue}>{santri.wali_kelas || '-'}</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Jadwal Taklim & Belajar:</span>
                  <span style={infoValue}>Bada Subuh & Bada Maghrib</span>
                </div>
                <div style={infoRow}>
                  <span style={infoLabel}>Target Hafalan:</span>
                  <span style={infoValue}>30 Juz & Mutun Ilmiyyah</span>
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 4: KURIKULUM & KAJIAN KITAB KUNING
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'kitab') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} /> Kurikulum & Kajian Kitab Kuning
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {kitabList.length === 0 ? (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                      Kurikulum kitab kuning mengikuti jenjang madrasah diniyah santri.
                    </div>
                  ) : (
                    kitabList.map((k, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{k.judul}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{k.bidang}</div>
                        </div>
                        <span className={`badge ${k.badge}`} style={{ fontSize: '0.66rem' }}>{k.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 5: DEWAN ASATIDZ & MUSYRIF PEMBINA
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'asatidz') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} /> Dewan Asatidz & Musyrif Pembina
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {asatidzList.length === 0 ? (
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                      Belum ada pembina yang ditugaskan untuk santri ini.
                    </div>
                  ) : (
                    asatidzList.map((g, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{g.nama}</div>
                          <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>{g.peran}</div>
                        </div>
                        {g.hp ? (
                          <a
                            href={`https://wa.me/${g.hp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#ecfdf5',
                              color: '#059669',
                              padding: '5px 9px',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <Phone size={12} /> Chat WA
                          </a>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ===================================================================
                SECTION 6: KEAMANAN & KREDENSIAL LOGIN WALI
            =================================================================== */}
            {(profileSection === 'semua' || profileSection === 'keamanan') && (
              <div style={{ ...infoCardBox, marginBottom: '14px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} /> Pengaturan Kredensial Login Wali Santri
                </div>

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 10px', fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
                    🔒 Ganti username dan password khusus untuk Bapak/Ibu Wali Santri agar login lebih mudah dan aman.
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Username Login Wali
                    </label>
                    <input
                      type="text"
                      value={passwordForm.username_baru}
                      onChange={(e) => setPasswordForm({ ...passwordForm, username_baru: e.target.value })}
                      style={inputFieldStyle}
                      placeholder="Contoh: waliahmad"
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Password Baru
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={passwordForm.password_baru}
                        onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                        style={inputFieldStyle}
                        placeholder="Minimal 4 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={passwordForm.konfirmasi_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                      style={inputFieldStyle}
                      placeholder="Ulangi password baru"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingPass}
                    style={{
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Save size={15} />
                    {updatingPass ? 'Menyimpan...' : 'Simpan Kredensial Akun'}
                  </button>
                </form>
              </div>
            )}

            {/* Logout Button in Profile */}
            <button
              onClick={handleLogoutAction}
              style={{
                width: '100%',
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Keluar dari Portal Wali Santri
            </button>

          </div>
        )}

        {/* =========================================================================
            3. PERIZINAN TAB
        ========================================================================= */}
        {currentTab === 'perizinan' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green (Persis Absensi) */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Perizinan Santri
                    </h2>
                  </div>
                </div>

                <button
                  onClick={openModalAjukanIzin}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ffffff',
                    color: '#047857',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                  }}
                >
                  <Plus size={15} strokeWidth={2.8} /> Ajukan Izin
                </button>
              </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              {/* HERO STAT CARD PERIZINAN */}
              {(() => {
                const countMenunggu = perizinan.filter(p => (p.status || '').toLowerCase().includes('menunggu')).length;
                const countDisetujui = perizinan.filter(p => (p.status || '').toLowerCase().includes('disetujui')).length;
                const countAktif = perizinan.filter(p => (p.status || '').toLowerCase().includes('aktif')).length;
                const isKeluar = countAktif > 0;

                return (
                  <div style={{
                    background: isKeluar 
                      ? 'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)' 
                      : 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
                    borderRadius: '20px',
                    padding: '16px 16px 14px',
                    color: '#ffffff',
                    boxShadow: isKeluar 
                      ? '0 8px 24px -4px rgba(124, 45, 18, 0.35)' 
                      : '0 8px 24px -4px rgba(67, 56, 202, 0.35)',
                    marginBottom: '14px',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: isKeluar ? '#fed7aa' : '#c7d2fe',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          STATUS KEBERADAAN SANTRI
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                          {isKeluar ? 'Sedang Izin Keluar' : 'Di Lingkungan Pesantren'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                          {isKeluar ? 'Santri sedang berada di luar lingkungan pondok' : 'Santri berada di asrama & mengikuti taklim pondok'}
                        </div>
                      </div>

                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.16)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '1.4rem'
                      }}>
                        🚪
                      </div>
                    </div>

                    {/* 4 Mini Counters */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      background: 'rgba(0, 0, 0, 0.22)',
                      padding: '8px',
                      borderRadius: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fbbf24' }}>{countMenunggu}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Menunggu</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#60a5fa' }}>{countDisetujui}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Disetujui</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#c084fc' }}>{countAktif}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Aktif Izin</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>{perizinan.length}</div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Total Izin</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Info Banner */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <Shield size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.74rem', color: '#166534', lineHeight: 1.45 }}>
                  <strong>Prosedur Perizinan:</strong> Pengajuan izin dari orang tua/wali santri akan diverifikasi oleh Dewan Pengasuh. Santri wajib lapor ke Pos Keamanan gerbang saat keluar dan kembali ke pondok.
                </div>
              </div>

            {/* List Perizinan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {perizinan.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '44px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <DoorOpen size={38} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Belum Ada Riwayat Izin</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', maxWidth: '300px', marginInline: 'auto' }}>
                    Santri saat ini berada di lingkungan pesantren. Klik tombol <strong>+ Ajukan Izin</strong> jika ingin mengajukan izin pulang atau berobat.
                  </div>
                  <button
                    onClick={openModalAjukanIzin}
                    style={{
                      marginTop: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} /> Ajukan Izin Sekarang
                  </button>
                </div>
              ) : (
                perizinan.map((row, idx) => {
                  const st = row.status || 'Menunggu Persetujuan';
                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#475569';
                  let badgeBorder = '#e2e8f0';
                  let badgeIcon = <Clock size={12} />;

                  if (st === 'Menunggu Persetujuan') {
                    badgeBg = '#fffbeb';
                    badgeColor = '#b45309';
                    badgeBorder = '#fde68a';
                    badgeIcon = <Clock size={12} />;
                  } else if (st === 'Disetujui Pengasuh') {
                    badgeBg = '#eff6ff';
                    badgeColor = '#1d4ed8';
                    badgeBorder = '#bfdbfe';
                    badgeIcon = <CheckCircle size={12} />;
                  } else if (st === 'Aktif Keluar') {
                    badgeBg = '#f5f3ff';
                    badgeColor = '#6d28d9';
                    badgeBorder = '#ddd6fe';
                    badgeIcon = <DoorOpen size={12} />;
                  } else if (st === 'Kembali Tepat Waktu') {
                    badgeBg = '#f0fdf4';
                    badgeColor = '#15803d';
                    badgeBorder = '#bbf7d0';
                    badgeIcon = <Check size={12} />;
                  } else if (st === 'Terlambat Kembali') {
                    badgeBg = '#fef2f2';
                    badgeColor = '#b91c1c';
                    badgeBorder = '#fecaca';
                    badgeIcon = <AlertTriangle size={12} />;
                  } else if (st === 'Ditolak') {
                    badgeBg = '#fef2f2';
                    badgeColor = '#991b1b';
                    badgeBorder = '#fecaca';
                    badgeIcon = <XCircle size={12} />;
                  }

                  const formatDateStr = (d) => {
                    if (!d) return '-';
                    try {
                      const dt = new Date(d);
                      if (isNaN(dt.getTime())) return String(d).split('T')[0];
                      return dt.toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    } catch (e) {
                      return String(d).split('T')[0];
                    }
                  };

                  return (
                    <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0284c7' }}>
                            {row.kode_izin || `IZN-${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                            {row.jenis_izin || 'Izin Pulang'}
                          </div>
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {badgeIcon}
                          {st}
                        </span>
                      </div>

                      {/* Keperluan */}
                      <div style={{ fontSize: '0.8rem', color: '#1e293b', marginBottom: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', borderLeft: '3px solid #0284c7' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Alasan / Keperluan:</div>
                        {row.keperluan || 'Keperluan keluarga'}
                      </div>

                      {/* Dates */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '8px 10px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Rencana Keluar:</div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            {formatDateStr(row.tgl_keluar_rencana)}
                          </div>
                        </div>
                        <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', padding: '8px 10px', borderRadius: '10px' }}>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Rencana Kembali:</div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                            {formatDateStr(row.tgl_kembali_rencana)}
                          </div>
                        </div>
                      </div>

                      {/* Penjemput & Petugas */}
                      <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                        <div>Penjemput: <strong style={{ color: '#334155' }}>{row.nama_penjemput_mahrom || santri?.nama_wali || 'Orang Tua / Wali'}</strong> ({row.hubungan_mahrom || 'Mahrom'})</div>
                        {row.no_hp_penjemput && (
                          <div>Kontak Penjemput: <strong style={{ color: '#334155' }}>{row.no_hp_penjemput}</strong></div>
                        )}
                        {row.disetujui_oleh && (
                          <div>Verifikator: <strong style={{ color: '#0284c7' }}>{row.disetujui_oleh}</strong></div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. ABSENSI TAB (FINGERPRINT PRESENSI SHOLAT)
        ========================================================================= */}
        {currentTab === 'absensi' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Absensi Berjamaah & Mengaji
                    </h2>
                  </div>
                </div>

                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Fingerprint size={18} />
                </div>
              </div>
            </div>

            {/* Santri Presensi View: Tab Berjamaah & Mengaji */}
            {(() => {
              const isMengaji = (r) => {
                const kat = String(r.kategori_sesi || '').toLowerCase();
                const name = String(r.nama_sesi || '').toLowerCase();
                return kat.includes('ngaji') || kat.includes('pengajian') || kat.includes('taklim') || kat.includes('halaqah') ||
                       name.includes('ngaji') || name.includes('kitab') || name.includes('sorogan') || name.includes('diniyah') || 
                       name.includes('bandongan') || name.includes('taklim') || name.includes('materi');
              };

              const listBerjamaah = presensi.filter(r => !isMengaji(r));
              const listMengaji = presensi.filter(r => isMengaji(r));

              const currentList = absensiSubTab === 'berjamaah' ? listBerjamaah : listMengaji;

              // Hitung statistik untuk subtab aktif
              const totalHadir = currentList.filter(r => (r.status || '').toLowerCase().includes('hadir') || (r.status || '').toLowerCase().includes('tepat')).length;
              const totalSakit = currentList.filter(r => (r.status || '').toLowerCase().includes('sakit')).length;
              const totalIzin = currentList.filter(r => (r.status || '').toLowerCase().includes('izin')).length;
              const totalAlfa = currentList.filter(r => (r.status || '').toLowerCase().includes('alfa') || (r.status || '').toLowerCase().includes('absen')).length;

              const filteredList = currentList.filter(row => {
                if (absensiStatusFilter === 'Semua') return true;
                return (row.status || '').toLowerCase().includes(absensiStatusFilter.toLowerCase());
              });

              return (
                <div style={{ padding: '0 16px' }}>
                  {/* HERO STAT CARD */}
                  <div style={{
                    background: absensiSubTab === 'berjamaah'
                      ? 'linear-gradient(135deg, #0d766e 0%, #044e42 100%)'
                      : 'linear-gradient(135deg, #0369a1 0%, #1e3a8a 100%)',
                    borderRadius: '20px',
                    padding: '16px 16px 14px',
                    color: '#ffffff',
                    boxShadow: absensiSubTab === 'berjamaah'
                      ? '0 8px 24px -4px rgba(13, 118, 110, 0.35)'
                      : '0 8px 24px -4px rgba(3, 105, 161, 0.35)',
                    marginBottom: '14px',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: absensiSubTab === 'berjamaah' ? '#99f6e4' : '#bae6fd',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {absensiSubTab === 'berjamaah' ? 'Presensi Berjamaah' : 'Presensi Mengaji'}
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                          {totalHadir} Sesi Hadir
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.82)', marginTop: '2px' }}>
                          Total {currentList.length} sesi presensi tercatat sistem
                        </div>
                      </div>

                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.16)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem'
                      }}>
                        {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
                      </div>
                    </div>

                    {/* 4 Mini Counters */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      background: 'rgba(0, 0, 0, 0.18)',
                      padding: '8px',
                      borderRadius: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4ade80' }}>{totalHadir}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Hadir</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f87171' }}>{totalSakit}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sakit</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fbbf24' }}>{totalIzin}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Izin</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#2dd4bf' }}>{totalAlfa}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Alfa</div>
                      </div>
                    </div>
                  </div>

                  {/* 2 SEGMENT TABS: BERJAMAAH & MENGAJI */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                    background: '#e2e8f0',
                    padding: '3px',
                    borderRadius: '14px',
                    marginBottom: '12px'
                  }}>
                    <button
                      type="button"
                      onClick={() => { setAbsensiSubTab('berjamaah'); setAbsensiStatusFilter('Semua'); }}
                      style={{
                        border: 'none',
                        background: absensiSubTab === 'berjamaah' ? '#ffffff' : 'transparent',
                        color: absensiSubTab === 'berjamaah' ? '#0d766e' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '9px 8px',
                        borderRadius: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: absensiSubTab === 'berjamaah' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🕌</span>
                      <span>Berjamaah</span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        background: absensiSubTab === 'berjamaah' ? '#ccfbf1' : 'rgba(0,0,0,0.06)',
                        color: absensiSubTab === 'berjamaah' ? '#0f766e' : '#64748b',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {listBerjamaah.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAbsensiSubTab('mengaji'); setAbsensiStatusFilter('Semua'); }}
                      style={{
                        border: 'none',
                        background: absensiSubTab === 'mengaji' ? '#ffffff' : 'transparent',
                        color: absensiSubTab === 'mengaji' ? '#0284c7' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        padding: '9px 8px',
                        borderRadius: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: absensiSubTab === 'mengaji' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>📖</span>
                      <span>Mengaji</span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        background: absensiSubTab === 'mengaji' ? '#e0f2fe' : 'rgba(0,0,0,0.06)',
                        color: absensiSubTab === 'mengaji' ? '#0369a1' : '#64748b',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {listMengaji.length}
                      </span>
                    </button>
                  </div>

                  {/* FILTER STATUS PILLS */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px' }}>
                    {[
                      { id: 'Semua', count: currentList.length, color: '#0d766e' },
                      { id: 'Hadir', count: totalHadir, color: '#16a34a' },
                      { id: 'Sakit', count: totalSakit, color: '#dc2626' },
                      { id: 'Izin', count: totalIzin, color: '#d97706' },
                      { id: 'Alfa', count: totalAlfa, color: '#0d9488' }
                    ].map(st => {
                      const isActive = absensiStatusFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setAbsensiStatusFilter(st.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '10px',
                            border: isActive ? `1.5px solid ${st.color}` : '1px solid #e2e8f0',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isActive ? st.color : '#ffffff',
                            color: isActive ? '#ffffff' : '#64748b',
                            boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          <span>{st.id}</span>
                          <span style={{
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            borderRadius: '8px',
                            background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                            color: isActive ? '#ffffff' : '#64748b'
                          }}>
                            {st.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* PRESENSI LIST ITEMS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredList.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ffffff', borderRadius: '18px', border: '1px dashed #cbd5e1' }}>
                        <div style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '16px',
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                          fontSize: '1.5rem'
                        }}>
                          {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                          {absensiStatusFilter !== 'Semua' 
                            ? `Tidak ada data dengan status "${absensiStatusFilter}"`
                            : absensiSubTab === 'berjamaah'
                              ? 'Belum Ada Riwayat Berjamaah'
                              : 'Belum Ada Riwayat Mengaji'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', maxWidth: '280px', marginInline: 'auto' }}>
                          {absensiSubTab === 'berjamaah'
                            ? 'Data scan sidik jari sholat fardhu & tahajud di Masjid Pesantren akan tercatat realtime di sini.'
                            : 'Data presensi halaqah Al-Qur\'an, sorogan kitab kuning & madrasah diniyah akan muncul di sini.'}
                        </div>
                      </div>
                    ) : (
                      filteredList.map((row, idx) => {
                        const st = (row.status || '').toLowerCase();
                        const isHadir = st.includes('hadir') || st.includes('tepat');
                        const isSakit = st.includes('sakit');
                        const isIzin = st.includes('izin');
                        const isTerlambat = st.includes('terlambat') || st.includes('masbuq');

                        let borderLeftColor = '#10b981';
                        let badgeBg = '#ecfdf5';
                        let badgeColor = '#065f46';
                        let badgeText = row.status || 'Hadir';

                        if (isSakit) {
                          borderLeftColor = '#ef4444';
                          badgeBg = '#fef2f2';
                          badgeColor = '#991b1b';
                        } else if (isIzin) {
                          borderLeftColor = '#f59e0b';
                          badgeBg = '#fffbeb';
                          badgeColor = '#92400e';
                        } else if (isTerlambat) {
                          borderLeftColor = '#f97316';
                          badgeBg = '#fff7ed';
                          badgeColor = '#9a3412';
                        } else if (!isHadir) {
                          borderLeftColor = '#0d9488';
                          badgeBg = '#f0fdfa';
                          badgeColor = '#115e59';
                        }

                        const formatDate = (tgl) => {
                          if (!tgl) return '-';
                          try {
                            const d = new Date(tgl);
                            if (isNaN(d.getTime())) return String(tgl).split('T')[0];
                            return d.toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                          } catch (e) {
                            return String(tgl).split('T')[0];
                          }
                        };

                        return (
                          <div
                            key={row.id || idx}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              border: '1px solid #f1f5f9',
                              borderLeft: `4px solid ${borderLeftColor}`,
                              padding: '12px 14px',
                              boxShadow: '0 3px 10px -2px rgba(15, 23, 42, 0.05)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '0.88rem' }}>
                                  {absensiSubTab === 'berjamaah' ? '🕌' : '📖'}
                                </span>
                                <div style={{
                                  fontWeight: 800,
                                  fontSize: '0.86rem',
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {row.nama_sesi || (absensiSubTab === 'berjamaah' ? 'Berjamaah' : 'Mengaji')}
                                </div>
                              </div>

                              <div style={{
                                fontSize: '0.7rem',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '4px'
                              }}>
                                <span>{formatDate(row.tanggal)}</span>
                                <span>•</span>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  color: '#0369a1',
                                  background: '#f0f9ff',
                                  padding: '1px 6px',
                                  borderRadius: '6px'
                                }}>
                                  {row.waktu_scan || row.jam_target || 'Tepat Waktu'}
                                </span>
                              </div>
                            </div>

                            <span style={{
                              background: badgeBg,
                              color: badgeColor,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '5px 10px',
                              borderRadius: '12px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {badgeText}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            5. TAHFIDZ TAB (HAFALAN AL-QUR'AN)
        ========================================================================= */}
        {currentTab === 'hafalan' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Capaian Tahfidz Al-Qur'an
                    </h2>
                    <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                      Santri: {rawSantriName} (NISN: {displayNisn})
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <BookOpen size={18} />
                </div>
              </div>
            </div>

            {/* Santri Profile Content */}

            {/* Total Capaian Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 20px rgba(139, 92, 246, 0.35)',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.74rem', opacity: 0.9 }}>TOTAL CAPAIAN HAFALAN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{santri.capaian_hafalan_juz || 0} Juz Al-Qur'an</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>Penyimak Pembina Tahfidz</div>
              </div>
              <Sparkles size={36} opacity={0.8} />
            </div>

            {/* Setoran List */}
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', marginBottom: '10px' }}>
              Riwayat Setoran Ziyadah & Muroja'ah:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tahfidz.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>Belum ada catatan setoran tahfidz untuk santri ini.</div>
                </div>
              ) : (
                tahfidz.map((row, idx) => (
                  <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-purple" style={{ fontWeight: 800 }}>Juz {row.juz || 1} • {row.jenis_setoran || 'Ziyadah'}</span>
                      <span className="badge badge-success" style={{ fontWeight: 800 }}>{row.nilai_akhir ? `Nilai: ${row.nilai_akhir}` : (row.predikat || 'Mumtaz')}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
                      {row.surat_mulai || 'Surat Al-Baqarah'} s/d {row.surat_selesai || '-'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                      Penyimak: {row.nama_penyimak || 'Ust. Pembina Tahfidz'} • {row.tanggal ? String(row.tanggal).split('T')[0] : '-'}
                    </div>
                    {row.catatan && (
                      <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', marginTop: '6px' }}>
                        "{row.catatan}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            6. PRAKTEK IBADAH TAB
        ========================================================================= */}
        {currentTab === 'praktek' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green (Persis Absensi) */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Ujian Praktek Ibadah
                    </h2>
                  </div>
                </div>

                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <HeartHandshake size={18} />
                </div>
              </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              {/* HERO STAT CARD PRAKTEK */}
              {(() => {
                const countLulus = praktek.filter(r => (r.status || '').toLowerCase().includes('lulus')).length;
                const countMengulang = praktek.filter(r => (r.status || '').toLowerCase().includes('ulang')).length;

                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
                    borderRadius: '20px',
                    padding: '16px 16px 14px',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px -4px rgba(194, 65, 12, 0.35)',
                    marginBottom: '14px',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#fed7aa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          EVALUASI KAIFIYAH IBADAH
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                          {countLulus} Materi Lulus
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                          Ujian wudhu, sholat fardhu, & doa harian pondok
                        </div>
                      </div>

                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.16)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '1.4rem'
                      }}>
                        🤲
                      </div>
                    </div>

                    {/* 3 Mini Counters */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.22)',
                      padding: '8px',
                      borderRadius: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4ade80' }}>{countLulus}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Lulus</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fca5a5' }}>{countMengulang}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Mengulang</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fed7aa' }}>{praktek.length}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Total Ujian</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* List Praktek */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {praktek.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <HeartHandshake size={36} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Belum Ada Hasil Ujian Praktek</div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Evaluasi wudhu, sholat, dan kaifiyah ibadah santri akan ditampilkan di sini.</div>
                  </div>
                ) : (
                  praktek.map((row, idx) => {
                    const isLulus = (row.status || '').toLowerCase().includes('lulus');
                    return (
                      <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{row.kategori || row.nama_praktek || 'Praktek Sholat Fardhu'}</span>
                          <span className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                            {isLulus ? 'LULUS' : 'MENGULANG'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                          {row.deskripsi || row.catatan_perbaikan || 'Sesuai kaifiyah dan sunnah yang diajarkan di pondok.'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f8fafc' }}>
                          Penguji: <strong style={{ color: '#0284c7' }}>{row.nama_penguji || 'Ust. Penguji'}</strong> • {row.tanggal_ujian ? String(row.tanggal_ujian).split('T')[0] : '-'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. PELANGGARAN TAB (KEDISIPLINAN)
        ========================================================================= */}
        {currentTab === 'pelanggaran' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Catatan Kedisiplinan & Tata Tertib
                    </h2>
                  </div>
                </div>

                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <ShieldAlert size={18} />
                </div>
              </div>
            </div>

            <div style={{ padding: '0 16px' }}>
              {/* HERO STAT CARD KEDISIPLINAN */}
              {(() => {
                const countRingan = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'ringan').length;
                const countSedang = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'sedang').length;
                const countBerat = pelanggaran.filter(r => (r.kategori || '').toLowerCase() === 'berat').length;
                const isClean = pelanggaran.length === 0;

                return (
                  <div style={{
                    background: isClean 
                      ? 'linear-gradient(135deg, #059669 0%, #064e3b 100%)' 
                      : 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
                    borderRadius: '20px',
                    padding: '16px 16px 14px',
                    color: '#ffffff',
                    boxShadow: isClean 
                      ? '0 8px 24px -4px rgba(5, 150, 105, 0.35)' 
                      : '0 8px 24px -4px rgba(225, 29, 72, 0.35)',
                    marginBottom: '14px',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: isClean ? '#a7f3d0' : '#fecdd3',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          STATUS KEDISIPLINAN SANTRI
                        </div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px', letterSpacing: '-0.3px' }}>
                          {isClean ? 'Catatan Disiplin Bersih' : `${pelanggaran.length} Catatan Ta'zir`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>
                          {isClean ? 'Alhamdulillah, santri tertib & taat aturan pondok' : 'Bimbingan akhlak & kepatuhan tata tertib pesantren'}
                        </div>
                      </div>

                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.16)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '1.4rem'
                      }}>
                        {isClean ? '🛡️' : '⚠️'}
                      </div>
                    </div>

                    {/* 3 Mini Counters */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.22)',
                      padding: '8px',
                      borderRadius: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countRingan > 0 ? '#fde047' : '#ffffff' }}>{countRingan}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Ringan</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countSedang > 0 ? '#fdba74' : '#ffffff' }}>{countSedang}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Sedang</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 900, color: countBerat > 0 ? '#fca5a5' : '#4ade80' }}>{countBerat}</div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Berat</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* List Pelanggaran */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pelanggaran.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', background: '#ecfdf5', borderRadius: '18px', border: '1px solid #a7f3d0' }}>
                    <CheckCircle size={40} color="#059669" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#065f46' }}>Alhamdulillah, Catatan Bersih!</div>
                    <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '4px' }}>Santri selalu tertib dan disiplin mengikuti tata tertib pesantren.</div>
                  </div>
                ) : (
                  pelanggaran.map((row, idx) => (
                    <div key={row.id || idx} style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className={`badge ${row.kategori === 'Berat' ? 'badge-danger' : 'badge-warning'}`}>
                          Kategori: {row.kategori || 'Ringan'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 700, marginBottom: '4px' }}>
                        Bentuk Ta'zir Mendidik:
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#475569', background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', marginBottom: '8px' }}>
                        {row.bentuk_tazir || 'Membaca Al-Qur\'an di Masjid pondok'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                        <span>Status: <strong style={{ color: '#059669' }}>{row.status_tazir || 'Selesai Ta\'zir'}</strong></span>
                        <span>Musyrif: {row.musyrif_pencatat || 'Musyrif Keamanan'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            8. NOTIFIKASI TAB (PEMBERITAHUAN PESANTREN)
        ========================================================================= */}
        {currentTab === 'notifikasi' && (
          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
            {/* Top Header Bar Terpadu Emerald Green */}
            <div style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              padding: '16px 16px 20px',
              color: '#ffffff',
              borderBottomLeftRadius: '24px',
              borderBottomRightRadius: '24px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentTab('beranda')}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                      Pemberitahuan Pesantren
                    </h2>
                    <div style={{ fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px' }}>
                      Santri: {rawSantriName} (NISN: {displayNisn})
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Bell size={18} />
                </div>
              </div>
            </div>

            {/* Santri Profile Content */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { judul: 'Presensi Subuh Berjamaah Terverifikasi', pesan: 'Alhamdulillah, presensi shalat Subuh berjamaah santri telah diverifikasi oleh musyrif kobong.', waktu: 'Hari ini • 05:15 WIB' },
                { judul: 'Maklumat Izin Kepulangan Santri', pesan: 'Bagi santri yang berencana izin kepulangan akhir bulan, mohon konfirmasi dan verifikasi melalui pembina asrama.', waktu: 'Kemarin • 14:00 WIB' },
                { judul: 'Capaian Ziyadah Tahfidz Qur\'an', pesan: 'Alhamdulillah, ananda berhasil menyelesaikan setoran hafalan Al-Qur\'an dengan predikat Mumtaz.', waktu: '2 hari lalu' }
              ].map((n, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{n.judul}</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{n.waktu}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.4 }}>
                    {n.pesan}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            9. TAB SISTEM PEMBAYARAN & ADMINISTRASI KEUANGAN DIGITAL (QRIS / VA)
        ========================================================================= */}
        {currentTab === 'tagihan' && (
          <TabTagihanKeuangan 
            santriId={selectedSantriId} 
            onBack={() => {
              setCurrentTab('beranda');
              fetchKeuanganOverview();
            }} 
          />
        )}

        {/* =========================================================================
            10. TAB LAPORAN PERKEMBANGAN SANTRI (RAPOR KOMPREHENSIF)
        ========================================================================= */}
        {currentTab === 'laporan' && (
          <TabLaporanPerkembangan 
            santriId={selectedSantriId} 
            onBack={() => setCurrentTab('beranda')} 
          />
        )}

        {/* =========================================================================
            11. TAB INFORMASI & KEGIATAN PESANTREN (LINIMASA / FEED)
        ========================================================================= */}
        {currentTab === 'informasi' && (
          <TabInformasiKegiatan 
            onBack={() => setCurrentTab('beranda')} 
          />
        )}

        {/* =========================================================================
            MODAL AJUKAN IZIN SANTRI (WALI SANTRI) - MODERN & INTERAKTIF
        ========================================================================= */}
        {isAjukanIzinOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}>
            <div style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              maxHeight: '94vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -12px 36px rgba(0,0,0,0.22)',
              animation: 'slideUp 0.25s ease-out'
            }}>
              {/* Drag Handle Bar */}
              <div style={{ width: '40px', height: '4px', background: '#cbd5e1', borderRadius: '4px', margin: '12px auto 2px' }} />

              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px 14px',
                borderBottom: '1px solid #f1f5f9',
                position: 'sticky',
                top: 0,
                background: '#ffffff',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
                  }}>
                    <DoorOpen size={20} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                      Ajukan Izin Santri
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                      Santri: <strong style={{ color: '#0284c7' }}>{santri?.nama_santri || rawSantriName}</strong> (NISN: {displayNisn})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAjukanIzinOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitIzin} style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. KATEGORI / JENIS IZIN DENGAN KARTU INTERAKTIF */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
                    <span>Pilih Kategori Izin</span>
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { key: 'Izin Pulang', label: 'Izin Pulang', sub: 'Keluarga & Liburan', icon: '🏡', color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
                      { key: 'Izin Berobat', label: 'Izin Berobat', sub: 'Klinik & Dokter', icon: '🏥', color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
                      { key: 'Izin Keluar Komplek', label: 'Keluar Komplek', sub: 'Keperluan Singkat', icon: '🚶‍♂️', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
                      { key: 'Izin Khusus', label: 'Izin Khusus', sub: 'Lomba & Acara Luar', icon: '🏆', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
                    ].map((kat) => {
                      const isSelected = formIzin.jenis_izin === kat.key;
                      return (
                        <div
                          key={kat.key}
                          onClick={() => setFormIzin({ ...formIzin, jenis_izin: kat.key })}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            border: isSelected ? `2px solid ${kat.color}` : '1.5px solid #e2e8f0',
                            background: isSelected ? kat.bg : '#ffffff',
                            boxShadow: isSelected ? `0 4px 14px ${kat.color}25` : '0 2px 4px rgba(0,0,0,0.02)',
                            transition: 'all 0.18s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            position: 'relative'
                          }}
                        >
                          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{kat.icon}</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isSelected ? kat.color : '#1e293b', lineHeight: 1.2 }}>
                              {kat.label}
                            </div>
                            <div style={{ fontSize: '0.66rem', color: isSelected ? kat.color : '#64748b', marginTop: '2px', lineHeight: 1.1 }}>
                              {kat.sub}
                            </div>
                          </div>
                          {isSelected && (
                            <span style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: kat.color,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 900
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. ESTIMASI DURASI & JADWAL KELUAR - KEMBALI */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      Jadwal Keluar & Rencana Kembali
                    </label>

                    {/* Quick Duration Buttons */}
                    <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0284c7' }}>
                      Pilih Cepat:
                    </span>
                  </div>

                  {/* 4 Chips Preset Durasi Cepat */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    {[
                      { label: 'Sore Ini', days: 0, hour: 17 },
                      { label: '1 Hari', days: 1, hour: 17 },
                      { label: '2 Hari', days: 2, hour: 17 },
                      { label: '3 Hari', days: 3, hour: 17 }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const pad = (n) => String(n).padStart(2, '0');
                          const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                          const ret = new Date(now.getTime() + p.days * 24 * 60 * 60 * 1000);
                          ret.setHours(p.hour, 0, 0, 0);
                          const retStr = `${ret.getFullYear()}-${pad(ret.getMonth() + 1)}-${pad(ret.getDate())}T${pad(ret.getHours())}:${pad(ret.getMinutes())}`;
                          setFormIzin({ ...formIzin, tgl_keluar_rencana: nowStr, tgl_kembali_rencana: retStr });
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center'
                        }}
                      >
                        ⏱️ {p.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Waktu Keluar <span style={{ color: '#ef4444' }}>*</span>
                      </span>
                      <input
                        type="datetime-local"
                        required
                        value={formIzin.tgl_keluar_rencana}
                        onChange={(e) => setFormIzin({ ...formIzin, tgl_keluar_rencana: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Rencana Kembali <span style={{ color: '#ef4444' }}>*</span>
                      </span>
                      <input
                        type="datetime-local"
                        required
                        value={formIzin.tgl_kembali_rencana}
                        onChange={(e) => setFormIzin({ ...formIzin, tgl_kembali_rencana: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Duration Badge */}
                  {(() => {
                    if (!formIzin.tgl_keluar_rencana || !formIzin.tgl_kembali_rencana) return null;
                    const st = new Date(formIzin.tgl_keluar_rencana);
                    const en = new Date(formIzin.tgl_kembali_rencana);
                    const diffMs = en - st;
                    if (isNaN(diffMs) || diffMs <= 0) {
                      return (
                        <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                          ⚠️ Waktu kembali harus lebih lambat dari waktu keluar.
                        </div>
                      );
                    }
                    const totalHours = Math.round(diffMs / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;
                    const durStr = days > 0 ? (hours > 0 ? `${days} Hari ${hours} Jam` : `${days} Hari`) : `${hours} Jam`;
                    return (
                      <div style={{
                        marginTop: '10px',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Clock size={13} color="#059669" />
                        <span>Estimasi Durasi Izin: <strong>{durStr}</strong> ({totalHours} Jam)</span>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. ALASAN / KEPERLUAN DENGAN TEMPLATE CEPAT */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      Alasan / Keperluan Izin <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.66rem', color: '#64748b' }}>Klik template untuk isi cepat:</span>
                  </div>

                  {/* Template Keperluan Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                    {[
                      'Pernikahan Saudara',
                      'Silaturahmi Keluarga',
                      'Periksa Dokter / Berobat',
                      'Keperluan Mendesak',
                      'Libur Terjadwal Pondok'
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormIzin({ ...formIzin, keperluan: tpl })}
                        style={{
                          padding: '4px 9px',
                          borderRadius: '8px',
                          border: formIzin.keperluan === tpl ? '1px solid #059669' : '1px solid #e2e8f0',
                          background: formIzin.keperluan === tpl ? '#ecfdf5' : '#f8fafc',
                          color: formIzin.keperluan === tpl ? '#047857' : '#475569',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan keterangan detail keperluan izin santri..."
                    value={formIzin.keperluan}
                    onChange={(e) => setFormIzin({ ...formIzin, keperluan: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      color: '#0f172a',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 4. PENJEMPUT & MAHROM (IDENTITAS PENDAMPING) */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.76rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      Identitas Penjemput (Mahrom)
                    </label>
                    {santri?.nama_wali && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormIzin({
                            ...formIzin,
                            nama_penjemput_mahrom: santri.nama_wali,
                            hubungan_mahrom: santri.hubungan_wali || 'Orang Tua',
                            no_hp_penjemput: santri.no_wa_wali || formIzin.no_hp_penjemput
                          });
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Gunakan Data Wali ↗
                      </button>
                    )}
                  </div>

                  {/* Quick Hubungan Mahrom Chips */}
                  <div>
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>
                      Pilih Hubungan Mahrom:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {['Orang Tua', 'Ayah Kandung', 'Ibu Kandung', 'Kakak Kandung', 'Paman / Bibi', 'Kakek / Nenek'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormIzin({ ...formIzin, hubungan_mahrom: m })}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: formIzin.hubungan_mahrom === m ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                            background: formIzin.hubungan_mahrom === m ? '#e0f2fe' : '#ffffff',
                            color: formIzin.hubungan_mahrom === m ? '#0369a1' : '#475569',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Nama Penjemput
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Bpk. Ridwan"
                        value={formIzin.nama_penjemput_mahrom}
                        onChange={(e) => setFormIzin({ ...formIzin, nama_penjemput_mahrom: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.78rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        No. WhatsApp
                      </span>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formIzin.no_hp_penjemput}
                        onChange={(e) => setFormIzin({ ...formIzin, no_hp_penjemput: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.78rem',
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Guidance Info Alert */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.72rem',
                  color: '#166534',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>🛡️</span>
                  <div>
                    Permohonan izin akan diverifikasi otomatis oleh Dewan Pengasuh. Santri wajib melapor ke Pos Keamanan saat keluar gerbang pesantren & kembali tepat waktu.
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAjukanIzinOpen(false)}
                    disabled={submittingIzin}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIzin}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 900,
                      cursor: submittingIzin ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                      opacity: submittingIzin ? 0.75 : 1
                    }}
                  >
                    {submittingIzin ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Check size={18} strokeWidth={2.8} />
                        Kirim Permohonan Izin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL TOP UP / ISI SALDO TABUNGAN SANTRI
        ========================================================================= */}
        {isTopUpModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.68)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: 0
          }}>
            <div style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '26px',
              borderTopRightRadius: '26px',
              maxHeight: '92vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.25s ease-out'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                position: 'sticky',
                top: 0,
                background: '#ffffff',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Wallet size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Isi Saldo Tabungan
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '2px 0 0' }}>
                      Santri: {rawSantriName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    color: '#64748b',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleTopUpSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Info Saldo Saat Ini */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #e6fffa 100%)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      Saldo Tabungan Saat Ini
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f766e', marginTop: '2px' }}>
                      {formatRp(tabunganData?.saldo_saat_ini || 0)}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '4px 8px', borderRadius: '8px' }}>
                    Terkelola Pondok
                  </span>
                </div>

                {/* Pilihan Nominal Cepat (Chips) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                    Pilih Nominal Cepat:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[20000, 50000, 100000, 200000, 500000, 1000000].map((nom) => {
                      const currentVal = Number(String(topUpNominal).replace(/[^0-9]/g, '') || 0);
                      const isSelected = currentVal === nom;
                      return (
                        <button
                          key={nom}
                          type="button"
                          onClick={() => setTopUpNominal(String(nom))}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                            background: isSelected ? '#ecfdf5' : '#ffffff',
                            color: isSelected ? '#047857' : '#334155',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Rp {nom.toLocaleString('id-ID')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Nominal Manual dengan Pemisah Ribuan & Posisi di Kanan */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Nominal Pengisian (Rp) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      fontWeight: 900,
                      color: '#059669',
                      fontSize: '1rem',
                      userSelect: 'none',
                      background: '#ecfdf5',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      border: '1px solid #a7f3d0'
                    }}>
                      Rp
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={(() => {
                        const clean = String(topUpNominal).replace(/[^0-9]/g, '');
                        return clean ? Number(clean).toLocaleString('id-ID') : '';
                      })()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setTopUpNominal(raw);
                      }}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 58px',
                        borderRadius: '12px',
                        border: '2px solid #059669',
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#0f172a',
                        textAlign: 'right',
                        outline: 'none',
                        boxSizing: 'border-box',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.1)'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '5px' }}>
                    <span>Minimal isi saldo: <strong>Rp 5.000</strong></span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>Pemisah ribuan aktif</span>
                  </div>
                </div>

                {/* Catatan / Keterangan (Dikosongkan Secara Default) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                    Catatan / Keperluan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={topUpKeterangan}
                    onChange={(e) => setTopUpKeterangan(e.target.value)}
                    placeholder="Tuliskan catatan jika ada (opsional)"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Info Note Midtrans Gateway */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.72rem',
                  color: '#166534',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>💳</span>
                  <div>
                    Pembayaran diproses via <strong>Midtrans Payment Gateway</strong> resmi. Mendukung <strong>QRIS (GoPay, OVO, ShopeePay, Dana)</strong> & <strong>Virtual Account (BCA, BNI, BRI, Mandiri)</strong> langsung masuk ke saldo santri.
                  </div>
                </div>

                {/* Submit buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(false)}
                    disabled={submittingTopUp}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTopUp}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 900,
                      cursor: submittingTopUp ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)',
                      opacity: submittingTopUp ? 0.75 : 1
                    }}
                  >
                    {submittingTopUp ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        Memproses Midtrans...
                      </>
                    ) : (
                      <>
                        <Check size={18} strokeWidth={2.8} />
                        Bayar via Midtrans
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            12. ELEVATED FLOATING WHITE BOTTOM NAVIGATION BAR
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          {/* 1. Beranda */}
          <button 
            className={`mobile-nav-item ${['beranda', 'praktek', 'pelanggaran', 'notifikasi'].includes(currentTab) ? 'active' : ''}`}
            onClick={() => {
              setCurrentTab('beranda');
              fetchKeuanganOverview();
            }}
          >
            <div className={`nav-icon-wrapper ${['beranda', 'praktek', 'pelanggaran', 'notifikasi'].includes(currentTab) ? 'active' : ''}`}>
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Tagihan & Bayar */}
          <button 
            className={`mobile-nav-item ${currentTab === 'tagihan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('tagihan')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'tagihan' ? 'active' : ''}`} style={{ position: 'relative' }}>
              <CreditCard size={20} />
              {keuanganSummary?.totalTagihanBelumBayar > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '1.5px solid #fff'
                }} />
              )}
            </div>
            <span>Tagihan</span>
          </button>

          {/* 3. Center Floating Fingerprint FAB (Presensi Sholat) */}
          <button 
            className="mobile-fab-center"
            onClick={() => setCurrentTab('absensi')}
            title="Presensi Sholat & Ibadah Santri"
          >
            <div className="fab-inner-glow">
              <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
            </div>
          </button>

          {/* 4. Tabungan Santri (Uang Saku) */}
          <button 
            className={`mobile-nav-item ${currentTab === 'tabungan' ? 'active' : ''}`}
            onClick={() => setCurrentTab('tabungan')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'tabungan' ? 'active' : ''}`}>
              <Wallet size={20} />
            </div>
            <span>Tabungan</span>
          </button>

          {/* 5. Profil & Pengaturan */}
          <button 
            className={`mobile-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <div className={`nav-icon-wrapper ${currentTab === 'profile' ? 'active' : ''}`}>
              <User size={20} />
            </div>
            <span>Profil</span>
          </button>
        </nav>

      </div>
    </div>
  );
}

// Inline Styles & Helpers
const countBadgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  background: '#ef4444',
  color: '#ffffff',
  fontSize: '0.66rem',
  fontWeight: 800,
  minWidth: '18px',
  height: '18px',
  borderRadius: '9px',
  padding: '0 4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ffffff',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
};

const menuCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  userSelect: 'none'
};

const squircleIconStyle = {
  width: '58px',
  height: '58px',
  borderRadius: '20px',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease'
};

const menuLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 700,
  color: '#334155',
  textAlign: 'center',
  lineHeight: 1.2,
  maxWidth: '82px',
  wordBreak: 'break-word',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
};

const infoCardBox = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
};

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.78rem',
  gap: '8px'
};

const infoLabel = {
  color: '#64748b',
  fontWeight: 500
};

const infoValue = {
  color: '#0f172a',
  fontWeight: 700,
  textAlign: 'right'
};

const inputFieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box'
};
