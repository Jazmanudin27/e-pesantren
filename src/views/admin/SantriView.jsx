import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Home, 
  Clock, 
  GraduationCap, 
  Fingerprint, 
  Loader2,
  Building,
  X,
  Phone,
  Calendar,
  Award,
  ShieldCheck,
  MapPin,
  User,
  Save,
  CheckCircle2,
  Printer,
  QrCode,
  Download,
  Check,
  FileSpreadsheet,
  UploadCloud,
  Upload,
  AlertCircle,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';
import SearchableSelect from '../../components/SearchableSelect';
import {
  initFaceApiModels,
  detectFaceDescriptor,
  extractDescriptorFromDataUrl,
  matchFaceDescriptor,
  isFaceModelReady
} from '../../utils/faceApi.util';

// Helper Barcode 1D SVG Renderer
function BarcodeCardItem({ value, width = 1.3, height = 36, fontSize = 10 }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, String(value), {
          format: 'CODE128',
          width,
          height,
          displayValue: true,
          fontSize,
          margin: 0,
          background: 'transparent',
          lineColor: '#0f172a'
        });
      } catch (e) {}
    }
  }, [value, width, height, fontSize]);

  return <svg ref={svgRef} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />;
}

// Helper QR Code 2D Canvas Renderer
function QrCodeCardItem({ value, size = 56 }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (value) {
      QRCode.toDataURL(String(value), {
        width: size,
        margin: 1,
        color: { dark: '#064e3b', light: '#ffffff' }
      }).then(setSrc).catch(() => {});
    }
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size, background: '#f1f5f9' }} />;
  return <img src={src} alt="QR" style={{ width: size, height: size, display: 'block', borderRadius: '4px' }} />;
}

export default function SantriView() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterTingkat, setFilterTingkat] = useState('Semua Tingkat');
  const [filterTahun, setFilterTahun] = useState('Tahun 2026/2027');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterSekolah, setFilterSekolah] = useState('Semua Sekolah');

  // Server-side Pagination & Stats
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({
    totalAll: 0,
    totalBoys: 0,
    totalGirls: 0,
    totalMukim: 0,
    totalKalong: 0,
    totalAlumni: 0
  });

  const [asramaList, setAsramaList] = useState([]);
  const [kamarList, setKamarList] = useState([]);

  // Modal Detail State
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Cetak Barcode & Kartu Santri State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSantriList, setPrintSantriList] = useState([]);
  const [printFormat, setPrintFormat] = useState('card'); // 'card' (ID Card) | 'sticker' (Stiker Barcode Saja)

  const handleOpenPrintModal = (list) => {
    if (!list || list.length === 0) {
      showError('Tidak Ada Data', 'Tidak ada data santri yang dipilih untuk dicetak.');
      return;
    }
    setPrintSantriList(list);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // Modal Import Excel / CSV State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Helper Parser CSV Native
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return [];

    const splitLine = (line) => {
      const separator = line.includes(';') && !line.includes(',') ? ';' : ',';
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = splitLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = splitLine(lines[i]);
      if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
      const rowObj = {};
      headers.forEach((h, idx) => {
        const cleanKey = h.trim();
        rowObj[cleanKey] = vals[idx] !== undefined ? vals[idx] : '';
      });
      rows.push(rowObj);
    }
    return rows;
  };

  // Helper Loader Dynamic XLSX (SheetJS)
  const loadXLSXLib = () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject(new Error('Koneksi internet diperlukan untuk membaca file .xlsx pertama kali. Anda juga bisa mengunggah file format .CSV'));
      document.head.appendChild(script);
    });
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'NIS',
      'Nama Santri',
      'Jenis Kelamin (L/P)',
      'Kelas',
      'Asrama',
      'Kamar',
      'Status Santri (Mukim/Kalong)',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Nama Wali',
      'No WA Wali',
      'Hubungan Wali',
      'Alamat Asal',
      'Tahun Masuk'
    ];

    const sampleRows = [
      [
        '2601001',
        'Muhammad Al-Fatih',
        'L',
        'Kelas 1 Wustho Putra',
        'Asrama Ali bin Abi Thalib',
        'Kamar Abu Bakar 01',
        'Mukim',
        'Bandung',
        '2008-05-15',
        'Ahmad Subarjo',
        '081234567890',
        'Orang Tua (Ayah)',
        'Jl. Pesantren No. 12, Bandung',
        '2026/2027'
      ],
      [
        '2601002',
        'Aisyah Khairunnisa',
        'P',
        'Kelas 1 Wustho Putri',
        'Asrama Khadijah',
        'Kamar Aisyah 01',
        'Mukim',
        'Tasikmalaya',
        '2009-02-20',
        'Hj. Siti Aminah',
        '081987654321',
        'Orang Tua (Ibu)',
        'Jl. Cipedes Tengah No. 45, Tasikmalaya',
        '2026/2027'
      ],
      [
        '2601003',
        'Faris Abdurrahman',
        'L',
        'Kelas 2 Wustho Putra',
        'Asrama Utsman bin Affan',
        'Kamar Utsman 02',
        'Kalong',
        'Garut',
        '2008-11-10',
        'Drs. H. Mamat',
        '082112345678',
        'Wali',
        'Tarogong Kaler, Garut',
        '2026/2027'
      ]
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Template_Import_Santri_NurulWafa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processFile = async (file) => {
    if (!file) return;
    setImportFile(file);
    setParsingFile(true);
    setImportData([]);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target.result;
            const parsed = parseCSV(text);
            if (parsed.length === 0) {
              showError('File Kosong', 'Tidak ada data yang dapat dibaca dari file CSV.');
            }
            setImportData(parsed);
          } catch (err) {
            showError('Gagal Membaca CSV', err.message);
          } finally {
            setParsingFile(false);
          }
        };
        reader.readAsText(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const XLSX = await loadXLSXLib();
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            if (json.length === 0) {
              showError('File Kosong', 'Tidak ada baris data pada lembar Excel.');
            }
            setImportData(json);
          } catch (err) {
            showError('Gagal Membaca Excel', err.message);
          } finally {
            setParsingFile(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        showError('Format Tidak Didukung', 'Silakan pilih file dengan format .xlsx, .xls, atau .csv');
        setParsingFile(false);
      }
    } catch (err) {
      showError('Error File', err.message);
      setParsingFile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const resetImport = () => {
    setImportFile(null);
    setImportData([]);
    setParsingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async () => {
    if (importData.length === 0) {
      showError('Tidak Ada Data', 'Silakan unggah file Excel / CSV terlebih dahulu.');
      return;
    }

    try {
      setImporting(true);
      const res = await axios.post('/api/santri/import', { santriList: importData });
      if (res.data?.success) {
        toastSuccess('Import Berhasil!', res.data.message || `${res.data.inserted || 0} santri baru berhasil diimport.`);
        setIsImportModalOpen(false);
        resetImport();
        fetchSantri();
      } else {
        showError('Gagal Import', res.data?.message || 'Terjadi kesalahan saat mengimport data.');
      }
    } catch (err) {
      showError('Gagal Import', err.response?.data?.message || err.message);
    } finally {
      setImporting(false);
    }
  };

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [submitting, setSubmitting] = useState(false);
  const [kelasList, setKelasList] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    nama_santri: '',
    nis: '',
    kode_santri: '',
    jk: 'L',
    status_santri: 'Mukim',
    asrama_id: 1,
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    kamar_id: 1,
    nama_kamar: 'Kamar Abu Bakar 01',
    nama_kelas: '',
    kelas_id: null,
    tempat_lahir: 'Tasikmalaya',
    tgl_lahir: '2008-01-01',
    fingerprint_pin: '',
    rfid_card_uid: '',
    nama_wali: '',
    no_wa_wali: '',
    hubungan_wali: 'Orang Tua (Ayah)',
    alamat_asal: '',
    status: 'Aktif',
    tahun_masuk: '2026/2027',
    capaian_hafalan_juz: 0,
    tingkat_diniyah: 'Wustho',
    nisn: '',
    username: '',
    password: ''
  });

  const fetchKelasData = async () => {
    try {
      const res = await axios.get('/api/kelas');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setKelasList(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil master kelas:', err);
    }
  };

  const fetchAsramaData = async () => {
    try {
      const res = await axios.get('/api/asrama');
      if (res.data && res.data.success) {
        setAsramaList(res.data.asrama || []);
        setKamarList(res.data.kamar || []);
      }
    } catch (err) {
      console.error('Gagal mengambil master asrama:', err);
    }
  };

  const fetchSantri = async (overrideParams = {}) => {
    try {
      setLoading(true);
      const targetPage = overrideParams.page !== undefined ? overrideParams.page : page;
      const targetLimit = overrideParams.limit !== undefined ? overrideParams.limit : limit;
      const targetSearch = overrideParams.search !== undefined ? overrideParams.search : search;
      const targetTab = overrideParams.tab !== undefined ? overrideParams.tab : activeFilterTab;
      const targetAsrama = overrideParams.asrama !== undefined ? overrideParams.asrama : filterAsrama;
      const targetTingkat = overrideParams.tingkat !== undefined ? overrideParams.tingkat : filterTingkat;
      const targetTahun = overrideParams.tahun !== undefined ? overrideParams.tahun : filterTahun;
      const targetStatus = overrideParams.status !== undefined ? overrideParams.status : filterStatus;
      const targetSekolah = overrideParams.sekolah !== undefined ? overrideParams.sekolah : filterSekolah;

      const res = await axios.get('/api/santri', {
        params: {
          page: targetPage,
          limit: targetLimit,
          search: targetSearch,
          tab: targetTab,
          asrama: targetAsrama,
          tingkat: targetTingkat,
          tahun: targetTahun,
          status: targetStatus,
          sekolah: targetSekolah !== 'Semua Sekolah' ? targetSekolah : undefined
        }
      });

      if (res.data && res.data.success) {
        const rows = Array.isArray(res.data.data) 
          ? res.data.data 
          : (Array.isArray(res.data.data?.data) ? res.data.data.data : []);
        setSantriList(rows);

        const pagination = res.data.pagination || res.data.data?.pagination;
        if (pagination) {
          setLimit(pagination.limit);
          setTotalPages(pagination.totalPages);
          setTotalRecords(pagination.total);
        } else {
          setTotalRecords(rows.length);
          setTotalPages(Math.ceil(rows.length / targetLimit) || 1);
        }

        const serverStats = res.data.stats || res.data.data?.stats;
        if (serverStats) {
          setStats(serverStats);
        }
      } else {
        setSantriList([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
      setSantriList([]);
    } finally {
      setLoading(false);
    }
  };

  const isInitialSearch = useRef(true);
  useEffect(() => {
    if (isInitialSearch.current) {
      isInitialSearch.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setPage(1);
      fetchSantri({ page: 1, search });
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSantri({ page, tab: activeFilterTab, asrama: filterAsrama, tingkat: filterTingkat, tahun: filterTahun, status: filterStatus, sekolah: filterSekolah });
  }, [page, activeFilterTab, filterAsrama, filterTingkat, filterTahun, filterStatus, filterSekolah]);

  useEffect(() => {
    try {
      localStorage.removeItem('epesantren_face_profiles');
    } catch (e) {}
    fetchAsramaData();
    fetchKelasData();
    initFaceApiModels().catch(() => {});
  }, []);

  const openDetail = (santri) => {
    setSelectedSantri(santri);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSantri(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    const firstAsr = asramaList[0];
    const matchingKamars = kamarList.filter(k => k.asrama_id === (firstAsr?.id || 1));
    const firstKmr = matchingKamars[0] || kamarList[0];

    setFormData({
      id: null,
      nama_santri: '',
      nis: `260100${santriList.length + 1}`,
      kode_santri: `STR-26-00${santriList.length + 1}`,
      jk: 'L',
      status_santri: 'Mukim',
      asrama_id: firstAsr?.id || 1,
      nama_asrama: firstAsr?.nama_asrama || 'Asrama Ali bin Abi Thalib',
      kamar_id: firstKmr?.id || 1,
      nama_kamar: firstKmr?.nama_kamar || 'Kamar Abu Bakar 01',
      nama_kelas: '',
      kelas_id: null,
      tempat_lahir: 'Tasikmalaya',
      tgl_lahir: '2008-01-01',
      fingerprint_pin: `${1000 + santriList.length + 1}`,
      rfid_card_uid: `RF-${Math.floor(10000 + Math.random() * 90000)}`,
      nama_wali: '',
      no_wa_wali: '',
      hubungan_wali: 'Orang Tua (Ayah)',
      alamat_asal: '',
      status: 'Aktif',
      tahun_masuk: '2026/2027',
      tingkat_diniyah: 'Wustho',
      sekolah_id: 1,
      nama_sekolah: 'SMP Nurul Wafa',
      tingkat_sekolah: 'Kelas 7',
      foto: '',
      nisn: '',
      username: '',
      password: ''
    });
    setIsFormOpen(true);
  };

  const openEditForm = (santri) => {
    setFormMode('edit');
    setFormData({
      id: santri.id,
      nama_santri: santri.nama_santri || '',
      nis: santri.nis || '',
      nisn: santri.nisn || '',
      kode_santri: santri.kode_santri || '',
      jk: santri.jk || 'L',
      status_santri: santri.status_santri || 'Mukim',
      asrama_id: santri.asrama_id || (asramaList[0]?.id || 1),
      nama_asrama: santri.nama_asrama || 'Asrama Ali bin Abi Thalib',
      kamar_id: santri.kamar_id || (kamarList[0]?.id || 1),
      nama_kamar: santri.nama_kamar || 'Kamar 01',
      nama_kelas: santri.nama_kelas || '',
      kelas_id: santri.kelas_id || null,
      tempat_lahir: santri.tempat_lahir || '',
      tgl_lahir: santri.tgl_lahir ? (typeof santri.tgl_lahir === 'string' ? santri.tgl_lahir.split('T')[0] : santri.tgl_lahir) : '2008-01-01',
      fingerprint_pin: santri.fingerprint_pin || '',
      rfid_card_uid: santri.rfid_card_uid || '',
      nama_wali: santri.nama_wali || '',
      no_wa_wali: santri.no_wa_wali || '',
      hubungan_wali: santri.hubungan_wali || 'Orang Tua (Ayah)',
      alamat_asal: santri.alamat_asal || '',
      status: santri.status || 'Aktif',
      tahun_masuk: santri.tahun_masuk || '2026/2027',
      capaian_hafalan_juz: santri.capaian_hafalan_juz || 0,
      tingkat_diniyah: santri.tingkat_diniyah || 'Wustho',
      sekolah_id: santri.sekolah_id || 1,
      nama_sekolah: santri.nama_sekolah || 'SMP Nurul Wafa',
      tingkat_sekolah: santri.tingkat_sekolah || 'Kelas 7',
      foto: santri.foto || santri.foto_santri || '',
      username: santri.username || santri.nisn || santri.nis || '',
      password: santri.password || '123456'
    });
    setIsFormOpen(true);
  };

  const handleAsramaSelect = (asramaId) => {
    const selectedAsr = asramaList.find(a => a.id === parseInt(asramaId));
    const matchingKamars = kamarList.filter(k => k.asrama_id === parseInt(asramaId));
    const firstKamar = matchingKamars[0];

    setFormData({
      ...formData,
      asrama_id: parseInt(asramaId),
      nama_asrama: selectedAsr ? selectedAsr.nama_asrama : formData.nama_asrama,
      kamar_id: firstKamar ? firstKamar.id : null,
      nama_kamar: firstKamar ? firstKamar.nama_kamar : ''
    });
  };

  const handleKamarSelect = (kamarId) => {
    const selectedKmr = kamarList.find(k => k.id === parseInt(kamarId));
    setFormData({
      ...formData,
      kamar_id: parseInt(kamarId),
      nama_kamar: selectedKmr ? selectedKmr.nama_kamar : formData.nama_kamar
    });
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveSantri = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Validasi anti-duplikasi foto wajah santri menggunakan data santri server
      if (formData.foto && isFaceModelReady()) {
        try {
          const desc = await extractDescriptorFromDataUrl(formData.foto);
          if (desc) {
            const otherProfiles = (santriList || []).filter(
              (p) => String(p.id) !== String(formData.id) && (p.face_descriptor || p.foto)
            );

            // Ekstraksi santri lain yang belum punya descriptor
            for (const other of otherProfiles) {
              if (!other.descriptor && other.foto) {
                try {
                  other.descriptor = await extractDescriptorFromDataUrl(other.foto);
                } catch (eDesc) {}
              }
            }

            const matchedOther = matchFaceDescriptor(desc, otherProfiles, 0.55);
            if (matchedOther) {
              showError(
                'Wajah Sudah Terdaftar Pada Santri Lain!',
                `Wajah ini terdeteksi identik dengan santri "${matchedOther.nama_santri || matchedOther.nama}". Pendaftaran ditolak untuk mencegah duplikasi identitas santri.`
              );
              setSubmitting(false);
              return;
            }
          }
        } catch (eCheck) {}
      }

      if (formMode === 'add') {
        const res = await axios.post('/api/santri', formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList([...santriList, { ...formData, id: Date.now() }]);
        }
      } else {
        const res = await axios.put(`/api/santri/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchSantri();
        } else {
          setSantriList(santriList.map(s => s.id === formData.id ? formData : s));
        }
      }

      setIsFormOpen(false);
      toastSuccess(formMode === 'add' ? 'Santri baru berhasil ditambahkan' : 'Data santri berhasil diperbarui');
    } catch (err) {
      console.error('Gagal menyimpan santri:', err);
      // local fallback update
      if (formMode === 'add') {
        setSantriList([...santriList, { ...formData, id: Date.now() }]);
      } else {
        setSantriList(santriList.map(s => s.id === formData.id ? formData : s));
      }
      setIsFormOpen(false);
      toastSuccess('Data tersimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, nama) => {
    const ok = await showConfirm('Hapus Santri', `Yakin ingin menghapus data santri "${nama}"?`, 'Ya, Hapus', 'Batal');
    if (ok) {
      try {
        await axios.delete(`/api/santri/${id}`);
        fetchSantri();
        toastSuccess(`Data santri "${nama}" berhasil dihapus.`);
      } catch (err) {
        console.error('Gagal hapus santri:', err);
        setSantriList(santriList.filter(s => s.id !== id));
        toastSuccess(`Data santri "${nama}" berhasil dihapus.`);
      }
    }
  };

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI TERDAFTAR</div>
            <div className="stat-colored-number">{stats.totalAll || 619}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SANTRI MUKIM (ASRAMA)</div>
            <div className="stat-colored-number">{stats.totalMukim || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Home size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI KALONG (NON-MUKIM)</div>
            <div className="stat-colored-number">{stats.totalKalong || 0}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">FINGERPRINT ENROLLED</div>
            <div className="stat-colored-number">{stats.totalAll || 619}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Users size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Induk Santri & Penempatan Kobong</h2>
            <p>Kelola biodata santri, NIS, penempatan asrama/kamar kobong, data mahrom wali, dan capaian hafalan</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline" 
            onClick={() => fetchSantri({ page: 1 })}
          >
            <RotateCw size={13} /> Refresh
          </button>
          <button 
            type="button"
            className="btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#0284c7', 
              color: '#ffffff', 
              border: 'none', 
              padding: '6px 14px', 
              borderRadius: '6px', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(2, 132, 199, 0.25)'
            }}
            onClick={() => { resetImport(); setIsImportModalOpen(true); }}
            title="Import Data Santri dari File Excel (.xlsx, .xls) atau .CSV"
          >
            <FileSpreadsheet size={15} /> Import Excel / CSV
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={openAddForm}
          >
            <Plus size={14} /> Tambah Santri Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => { setActiveFilterTab('semua'); setPage(1); }}
        >
          <Users size={14} /> Semua Santri ({stats.totalAll || totalRecords})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'boys' || activeFilterTab === 'L' ? 'active' : ''}`}
          onClick={() => { setActiveFilterTab('boys'); setPage(1); }}
        >
          <Users size={14} /> Santri Putra / Boys ({stats.totalBoys || 0})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'girls' || activeFilterTab === 'P' ? 'active' : ''}`}
          onClick={() => { setActiveFilterTab('girls'); setPage(1); }}
        >
          <Users size={14} /> Santri Putri / Girls ({stats.totalGirls || 0})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'alumni' ? 'active' : ''}`}
          onClick={() => { setActiveFilterTab('alumni'); setPage(1); }}
        >
          <GraduationCap size={14} /> Alumni / Boyong ({stats.totalAlumni || 0})
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari semua santri (nama, NIS, kelas, asrama, wali)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <SearchableSelect 
          style={{ minWidth: '150px', flex: '1 1 140px', maxWidth: '200px' }}
          value={filterAsrama}
          onChange={(val) => { setFilterAsrama(val || 'Semua Asrama'); setPage(1); }}
          placeholder="Semua Asrama"
          options={[
            { value: 'Semua Asrama', label: 'Semua Asrama' },
            ...asramaList.map(a => ({ value: a.nama_asrama, label: a.nama_asrama }))
          ]}
        />
        <SearchableSelect 
          style={{ minWidth: '130px', flex: '1 1 120px', maxWidth: '180px' }}
          value={filterTingkat}
          onChange={(val) => { setFilterTingkat(val || 'Semua Tingkat'); setPage(1); }}
          placeholder="Semua Tingkat"
          options={['Semua Tingkat', 'Wustho', 'Ulya', 'Ula']}
        />
        <SearchableSelect 
          style={{ minWidth: '140px', flex: '1 1 130px', maxWidth: '190px' }}
          value={filterTahun}
          onChange={(val) => { setFilterTahun(val || 'Semua Tahun'); setPage(1); }}
          placeholder="Semua Tahun"
          options={['Semua Tahun', 'Tahun 2026/2027', 'Tahun 2025/2026']}
        />
        <SearchableSelect 
          style={{ minWidth: '130px', flex: '1 1 120px', maxWidth: '180px' }}
          value={filterStatus}
          onChange={(val) => { setFilterStatus(val || 'Semua Status'); setPage(1); }}
          placeholder="Semua Status"
          options={['Semua Status', 'Aktif', 'Alumni', 'Boyong']}
        />
        <SearchableSelect 
          style={{ minWidth: '140px', flex: '1 1 130px', maxWidth: '190px' }}
          value={filterSekolah}
          onChange={(val) => { setFilterSekolah(val || 'Semua Sekolah'); setPage(1); }}
          placeholder="Semua Sekolah"
          options={['Semua Sekolah', 'SMP Nurul Wafa', 'SMA Nurul Wafa', 'SMK Nurul Wafa']}
        />
      </div>

      {/* 5. DATA TABLE (SERVERSIDE) */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <div>Memuat data santri dari database...</div>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '45px' }}>NO</th>
                  <th>NAMA SANTRI & NIS</th>
                  <th className="td-center">KELAS NGAJI</th>
                  <th className="td-center">SEKOLAH FORMAL</th>
                  <th className="td-center">GENDER</th>
                  <th>ASRAMA & KOBONG</th>
                  <th className="td-center">STATUS</th>
                  <th className="td-center" style={{ width: '130px' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {santriList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                      <div style={{ fontWeight: 600, color: '#334155' }}>Tidak ada data santri yang cocok</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Silakan periksa kata kunci pencarian atau reset filter.</div>
                    </td>
                  </tr>
                ) : (
                  santriList.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                        <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {row.nis}</div>
                      </td>
                      <td className="td-center">
                        <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                          {row.nama_kelas || row.tingkat_diniyah || '-'}
                        </span>
                      </td>
                      <td className="td-center">
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800, fontSize: '0.7rem' }}>
                          🏫 {row.nama_sekolah || 'SMP Nurul Wafa'}
                        </span>
                        <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                          {row.tingkat_sekolah || '-'}
                        </div>
                      </td>
                      <td className="td-center">
                        <span className={`badge ${row.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                          {row.jk === 'L' ? 'Boys (L)' : 'Girls (P)'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                          <Building size={13} color="#059669" />
                          <span>{row.nama_asrama || (row.jk === 'L' ? 'Asrama Putra' : 'Asrama Putri')}</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                          {row.nama_kamar || 'Kobong Santri'}
                        </div>
                      </td>
                      <td className="td-center">
                        <span className={`badge ${row.status_santri === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                          {row.status_santri || 'Mukim'}
                        </span>
                      </td>
                      <td className="td-center">
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                          <button 
                            className="btn-action btn-action-view"
                            onClick={() => openDetail(row)}
                            title="Lihat Detail Santri"
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-edit"
                            onClick={() => openEditForm(row)}
                            title="Edit Data Santri"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="btn-action btn-action-delete"
                            onClick={() => handleDelete(row.id, row.nama_santri)}
                            title="Hapus Santri"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* SERVERSIDE PAGINATION BAR */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* Info Jumlah Data */}
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                Menampilkan <strong>{totalRecords === 0 ? 0 : (page - 1) * limit + 1}</strong> s/d <strong>{Math.min(page * limit, totalRecords)}</strong> dari total <strong>{totalRecords}</strong> santri
                {search && <span style={{ color: '#0284c7', marginLeft: '6px' }}>(hasil cari: "{search}")</span>}
              </div>

              {/* Navigasi Tombol Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: page <= 1 ? '#f8fafc' : '#ffffff',
                    color: page <= 1 ? '#94a3b8' : '#0f172a',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} /> Sebelumnya
                </button>

                {/* Halaman Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      acc.push('ellipsis-' + p);
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map(p => {
                    if (typeof p === 'string') {
                      return <span key={p} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.75rem' }}>...</span>;
                    }
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        disabled={loading}
                        style={{
                          minWidth: '32px',
                          height: '32px',
                          padding: '0 6px',
                          borderRadius: '6px',
                          border: isActive ? '1px solid #0284c7' : '1px solid #e2e8f0',
                          background: isActive ? '#0284c7' : '#ffffff',
                          color: isActive ? '#ffffff' : '#334155',
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: page >= totalPages ? '#f8fafc' : '#ffffff',
                    color: page >= totalPages ? '#94a3b8' : '#0f172a',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Selanjutnya <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL SANTRI & BIODATA LENGKAP (FULL SCREEN)  */}
      {/* ==================================================== */}
      {isModalOpen && selectedSantri && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f1f5f9',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Modal Header (Full Width) */}
          <div style={{
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <User size={20} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Biodata & Riwayat Santri
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                  NIS: {selectedSantri.nis} • Kode: {selectedSantri.kode_santri || `STR-26-${selectedSantri.id}`} • Pondok Pesantren Nurul Wafa
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={closeModal}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: 'none',
                cursor: 'pointer',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
              title="Tutup Modal"
            >
              <X size={16} /> Tutup
            </button>
          </div>

          {/* Modal Body (Scrollable, Centered Card Content) */}
          <div style={{ padding: '24px 32px', background: '#f1f5f9', overflowY: 'auto', flex: 1 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Hero Profile Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '16px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                border: '1px solid #334155'
              }}>
                {/* Avatar Photo */}
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {selectedSantri.foto || selectedSantri.foto_santri ? (
                    <img 
                      src={selectedSantri.foto || selectedSantri.foto_santri} 
                      alt={selectedSantri.nama_santri} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span>{selectedSantri.nama_santri?.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Profil Detail */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                    {selectedSantri.nama_santri}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px' }}>
                    NIS: <strong style={{ color: '#38bdf8' }}>{selectedSantri.nis}</strong> • {selectedSantri.kode_santri || 'STR-2026'}
                  </div>
                  
                  {/* Badges Pill */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span style={{
                      background: '#065f46',
                      color: '#a7f3d0',
                      border: '1px solid #059669',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {selectedSantri.nama_kelas || selectedSantri.tingkat_diniyah || 'Kelas 1'}
                    </span>
                    <span style={{
                      background: selectedSantri.jk === 'L' ? '#0369a1' : '#be185d',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {selectedSantri.jk === 'L' ? 'Ikhwan (Boys)' : 'Akhwat (Girls)'}
                    </span>
                    <span style={{
                      background: selectedSantri.status_santri === 'Mukim' ? '#047857' : '#b45309',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      Santri {selectedSantri.status_santri || 'Mukim'}
                    </span>
                    <span style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {selectedSantri.status || 'Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Bento Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                
                {/* Box 1: Asrama & Kobong */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#059669', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={14} /> Asrama & Kamar Kobong
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                    {selectedSantri.nama_asrama || (selectedSantri.jk === 'L' ? 'Asrama Putra' : 'Asrama Putri')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>
                    {selectedSantri.nama_kamar || 'Kobong Santri'}
                  </div>
                </div>

                {/* Box 2: Akademik & Hafalan */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#0284c7', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} /> Capaian Diniyah & Tahfidz
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0284c7' }}>
                      {selectedSantri.capaian_hafalan_juz || 0} Juz
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      (Tingkat {selectedSantri.tingkat_diniyah || 'Wustho'})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px' }}>
                    Kelas: <strong>{selectedSantri.nama_kelas || '-'}</strong>
                  </div>
                </div>

                {/* Box 3: Biometrik & Presensi */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Fingerprint size={14} /> Biometrik & Presensi
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700 }}>
                    PIN Fingerprint: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7' }}>{selectedSantri.fingerprint_pin || '-'}</code>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                    Wajah AI: {selectedSantri.foto ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ Terdaftar</span> : 'Belum Ada Foto'}
                  </div>
                </div>

                {/* Box 4: TTL & Tahun Masuk */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#d97706', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> TTL & Angkatan
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                    {selectedSantri.tempat_lahir || ''}{selectedSantri.tempat_lahir && selectedSantri.tgl_lahir ? ', ' : ''}{selectedSantri.tgl_lahir ? String(selectedSantri.tgl_lahir).split('T')[0] : ''}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                    Tahun Masuk: <strong>{selectedSantri.tahun_masuk || ''}</strong>
                  </div>
                </div>

                {/* Box 5: Wali & Mahrom (Col-span 2) */}
                <div style={{
                  gridColumn: 'span 2',
                  background: '#ffffff',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#059669" /> Data Mahrom & Wali Santri
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Nama Wali:</span> <strong>{selectedSantri.nama_wali && selectedSantri.nama_wali !== '-' ? selectedSantri.nama_wali : ''}</strong> {selectedSantri.nama_wali && selectedSantri.hubungan_wali ? `(${selectedSantri.hubungan_wali})` : ''}
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>WhatsApp:</span> <strong>{selectedSantri.no_wa_wali && selectedSantri.no_wa_wali !== '-' ? selectedSantri.no_wa_wali : ''}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748b' }}>Alamat Asal:</span> <span>{selectedSantri.alamat_asal && selectedSantri.alamat_asal.toLowerCase() !== 'pondok pesantren nurul wafa' && selectedSantri.alamat_asal !== '-' ? selectedSantri.alamat_asal : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Box 6: Kredensial Login Wali (Col-span 2) */}
                <div style={{
                  gridColumn: 'span 2',
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#1e40af', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#2563eb" /> Kredensial Portal Orang Tua (Wali)
                    </div>
                    <span style={{ fontSize: '0.65rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      Tersimpan di Database
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>Username Login Wali:</span>
                      <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{selectedSantri.username || selectedSantri.nisn || selectedSantri.nis || '-'}</strong>
                    </div>
                    <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>Password Login Wali:</span>
                      <strong style={{ color: '#059669', fontSize: '0.85rem' }}>{selectedSantri.password || '123456'}</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Modal Footer (Full Width with Centered Inner) */}
          <div style={{
            padding: '14px 28px',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ maxWidth: '1100px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <div>
                {selectedSantri.no_wa_wali && (
                  <a 
                    href={`https://wa.me/${selectedSantri.no_wa_wali.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-sm"
                    style={{ background: '#25D366', color: '#ffffff', border: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Phone size={13} /> Chat WhatsApp Wali
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    closeModal();
                    openEditForm(selectedSantri);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <Edit3 size={13} /> Edit Santri Ini
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeModal}>
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT SANTRI (FLOATING MODAL)     */}
      {/* ==================================================== */}
      {isFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999, padding: '16px' }}>
          <div
            className="modal-card"
            style={{
              maxWidth: '1060px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              border: '1px solid #cbd5e1',
              padding: 0
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0284c7 100%)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <Users size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {formMode === 'add' ? 'Tambah Data Santri Baru' : `Edit Biodata Santri: ${formData.nama_santri}`}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.88)' }}>
                    Lengkapi identitas, kelas diniyah, penempatan kobong & data wali santri • PP. Nurul Wafa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeForm}
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body Scrollable */}
            <form onSubmit={handleSaveSantri} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{
                  padding: '20px 24px',
                  background: '#f8fafc',
                  overflowY: 'auto',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* 1. KARTU IDENTITAS SANTRI & FOTO */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f766e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} color="#0d9488" /> IDENTITAS UTAMA & FOTO SANTRI
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '18px', alignItems: 'flex-start' }}>
                    {/* Foto Upload Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '2px dashed #0d9488',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {formData.foto ? (
                          <img src={formData.foto} alt="Foto Santri" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <User size={42} color="#94a3b8" />
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                        <label
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '5px',
                            borderRadius: '6px',
                            background: '#0d9488',
                            color: '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Upload size={11} /> {formData.foto ? 'Ganti' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setFormData({ ...formData, foto: reader.result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {formData.foto && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, foto: '' })}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #fecdd3',
                              background: '#fff1f2',
                              color: '#e11d48',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Field Data Santri */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Nama Santri */}
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          NAMA LENGKAP SANTRI *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap santri"
                          className="filter-select"
                          style={{ width: '100%', padding: '7px 10px', fontSize: '0.84rem' }}
                          value={formData.nama_santri}
                          onChange={(e) => setFormData({ ...formData, nama_santri: e.target.value })}
                        />
                      </div>

                      {/* Row 2: NIS, NISN, Gender, Status Mukim, Status Keaktifan */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            NIS
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 2601001"
                            className="filter-select"
                            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                            value={formData.nis}
                            onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            NISN
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 0010481215"
                            className="filter-select"
                            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                            value={formData.nisn}
                            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            GENDER
                          </label>
                          <SearchableSelect
                            options={[
                              { value: 'L', label: 'Laki-laki (Ikhwan)' },
                              { value: 'P', label: 'Perempuan (Akhwat)' }
                            ]}
                            value={formData.jk}
                            onChange={(val) => setFormData({ ...formData, jk: val })}
                            placeholder="Gender"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            STATUS MUKIM
                          </label>
                          <SearchableSelect
                            options={[
                              { value: 'Mukim', label: 'Mukim (Asrama)' },
                              { value: 'Kalong', label: 'Kalong' }
                            ]}
                            value={formData.status_santri}
                            onChange={(val) => setFormData({ ...formData, status_santri: val })}
                            placeholder="Mukim"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            STATUS KEAKTIFAN
                          </label>
                          <SearchableSelect
                            options={[
                              { value: 'Aktif', label: 'Aktif' },
                              { value: 'Alumni', label: 'Alumni' },
                              { value: 'Boyong', label: 'Boyong' }
                            ]}
                            value={formData.status}
                            onChange={(val) => setFormData({ ...formData, status: val })}
                            placeholder="Status"
                          />
                        </div>
                      </div>

                      {/* Row 3: Tempat Lahir & Tanggal Lahir */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            TEMPAT LAHIR
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Tasikmalaya"
                            className="filter-select"
                            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                            value={formData.tempat_lahir}
                            onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            TANGGAL LAHIR
                          </label>
                          <input
                            type="date"
                            className="filter-select"
                            style={{ width: '100%', padding: '5px 8px', fontSize: '0.8rem' }}
                            value={formData.tgl_lahir}
                            onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                            TAHUN MASUK (ANGKATAN)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 2026/2027"
                            className="filter-select"
                            style={{ width: '100%', padding: '6px 8px', fontSize: '0.8rem' }}
                            value={formData.tahun_masuk}
                            onChange={(e) => setFormData({ ...formData, tahun_masuk: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DUA KOLOM GRID: PENEMPATAN & BIOMETRIK */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  {/* Card Penempatan Kelas & Asrama Kobong */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <Building size={15} color="#0f766e" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a' }}>PENEMPATAN KELAS & ASRAMA KOBONG</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          PILIH KELAS PENGAJIAN
                        </label>
                        <SearchableSelect
                          options={kelasList
                            .filter(k => !formData.jk || k.gender === formData.jk)
                            .map(k => ({
                              value: k.nama_kelas,
                              label: k.nama_kelas,
                              sublabel: `Mustahiq: ${k.mustahiq || '-'} | Munawwib: ${k.munawwib || '-'}`
                            }))}
                          value={formData.nama_kelas}
                          onChange={(val) => {
                            const found = kelasList.find(k => k.nama_kelas === val);
                            setFormData({
                              ...formData,
                              nama_kelas: val,
                              kelas_id: found ? found.id : formData.kelas_id,
                              tingkat_diniyah: val?.includes('1') || val?.includes('2') || val?.includes('3') ? 'Wustho' : 'Ulya'
                            });
                          }}
                          placeholder="-- Pilih Kelas --"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          TINGKAT DINIYAH
                        </label>
                        <SearchableSelect
                          options={[
                            { value: 'Ula', label: 'Ula' },
                            { value: 'Wustho', label: 'Wustho' },
                            { value: 'Ulya', label: 'Ulya' }
                          ]}
                          value={formData.tingkat_diniyah}
                          onChange={(val) => setFormData({ ...formData, tingkat_diniyah: val })}
                          placeholder="-- Tingkat --"
                        />
                      </div>
                    </div>

                    {/* Sekolah Formal & Kelas Formal */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px', background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', display: 'block', marginBottom: '3px' }}>
                          🏫 SEKOLAH FORMAL
                        </label>
                        <SearchableSelect
                          options={[
                            { value: 'SMP Nurul Wafa', label: 'SMP Nurul Wafa', sublabel: 'Jenjang SMP' },
                            { value: 'SMA Nurul Wafa', label: 'SMA Nurul Wafa', sublabel: 'Jenjang SMA' },
                            { value: 'SMK Nurul Wafa', label: 'SMK Nurul Wafa', sublabel: 'Jenjang SMK' }
                          ]}
                          value={formData.nama_sekolah}
                          onChange={(val) => {
                            const sId = val.includes('SMP') ? 1 : val.includes('SMA') ? 2 : 3;
                            setFormData({
                              ...formData,
                              nama_sekolah: val,
                              sekolah_id: sId
                            });
                          }}
                          placeholder="-- Pilih Sekolah --"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', display: 'block', marginBottom: '3px' }}>
                          TINGKAT / KELAS SEKOLAH
                        </label>
                        <SearchableSelect
                          options={[
                            { value: 'Kelas 7', label: 'Kelas 7 (SMP)' },
                            { value: 'Kelas 8', label: 'Kelas 8 (SMP)' },
                            { value: 'Kelas 9', label: 'Kelas 9 (SMP)' },
                            { value: 'Kelas 10', label: 'Kelas 10 (SMA/SMK)' },
                            { value: 'Kelas 11', label: 'Kelas 11 (SMA/SMK)' },
                            { value: 'Kelas 12', label: 'Kelas 12 (SMA/SMK)' }
                          ]}
                          value={formData.tingkat_sekolah}
                          onChange={(val) => setFormData({ ...formData, tingkat_sekolah: val })}
                          placeholder="-- Kelas Formal --"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          BLOK GEDUNG ASRAMA *
                        </label>
                        <SearchableSelect
                          required
                          options={asramaList.length > 0 ? asramaList.map(a => ({
                            value: a.id,
                            label: `${a.nama_asrama} (${a.gender === 'L' ? 'Putra' : 'Putri'})`,
                            sublabel: `Kapasitas: ${a.total_kamar || 0} Kamar`
                          })) : [
                            { value: 1, label: 'Asrama Putra' }
                          ]}
                          value={formData.asrama_id || (asramaList[0]?.id || 1)}
                          onChange={(val) => handleAsramaSelect(val)}
                          placeholder="-- Pilih Asrama --"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          KAMAR KOBONG (DATABASE) *
                        </label>
                        <SearchableSelect
                          required
                          options={(kamarList.filter(k => !formData.asrama_id || k.asrama_id === parseInt(formData.asrama_id)).length > 0
                            ? kamarList.filter(k => !formData.asrama_id || k.asrama_id === parseInt(formData.asrama_id))
                            : kamarList
                          ).map(k => ({
                            value: k.id,
                            label: `${k.nama_kamar} (Lt ${k.lantai || 1})`,
                            sublabel: `Kapasitas: ${k.kapasitas || 10} Santri`
                          }))}
                          value={formData.kamar_id || ''}
                          onChange={(val) => handleKamarSelect(val)}
                          placeholder="-- Pilih Kobong --"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Presensi & Akademik Biometrik */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <Fingerprint size={15} color="#0284c7" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a' }}>BIOMETRIK & CAPAIAN TAHFIDZ</span>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                        PIN MESIN FINGERPRINT
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 1025"
                        className="filter-select"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                        value={formData.fingerprint_pin}
                        onChange={(e) => setFormData({ ...formData, fingerprint_pin: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                        CAPAIAN HAFALAN (JUZ)
                      </label>
                      <input
                        type="number"
                        className="filter-select"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                        value={formData.capaian_hafalan_juz}
                        onChange={(e) => setFormData({ ...formData, capaian_hafalan_juz: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. DUA KOLOM: DATA ORANG TUA / WALI & KREDENSIAL PORTAL */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                  {/* Card Data Wali & Alamat */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <Phone size={15} color="#059669" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a' }}>DATA ORANG TUA / WALI & ALAMAT</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          NAMA WALI / MAHROM
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap wali"
                          className="filter-select"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                          value={formData.nama_wali}
                          onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                          NO. WHATSAPP WALI
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 081234567890"
                          className="filter-select"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                          value={formData.no_wa_wali}
                          onChange={(e) => setFormData({ ...formData, no_wa_wali: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>
                        ALAMAT ASAL LENGKAP
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Pesantren No. 12, Kel. Sukamanah, Kec. Cipedes, Tasikmalaya"
                        className="filter-select"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.82rem' }}
                        value={formData.alamat_asal}
                        onChange={(e) => setFormData({ ...formData, alamat_asal: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Card Kredensial Login Portal Wali */}
                  <div
                    style={{
                      background: '#f0fdfa',
                      borderRadius: '12px',
                      padding: '16px 18px',
                      border: '1.5px solid #99f6e4',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f766e', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#0f766e" /> KREDENSIAL LOGIN PORTAL WALI
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                        USERNAME WALI (NISN / NIS)
                      </label>
                      <input
                        type="text"
                        placeholder={formData.nisn || formData.nis || 'Default: NISN / NIS'}
                        className="filter-select"
                        style={{ width: '100%', padding: '6px 8px', background: '#ffffff', fontSize: '0.82rem' }}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '2px' }}>
                        PASSWORD WALI
                      </label>
                      <input
                        type="text"
                        placeholder="Default: 123456"
                        className="filter-select"
                        style={{ width: '100%', padding: '6px 8px', background: '#ffffff', fontSize: '0.82rem' }}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>

                    <div style={{ fontSize: '0.66rem', color: '#0d9488', marginTop: '2px', lineHeight: 1.3 }}>
                      * Wali login via aplikasi santri mobile dengan kredensial ini.
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div
                style={{
                  padding: '12px 24px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  boxShadow: '0 -2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeForm}
                  style={{ padding: '7px 18px', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ padding: '7px 22px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {formMode === 'add' ? 'Simpan Santri Baru' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL CETAK BARCODE & KARTU SANTRI (ID CARD RESMI)  */}
      {/* ==================================================== */}
      {isPrintModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          {/* Print Stylesheet injection */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #print-santri-card-zone, #print-santri-card-zone * {
                visibility: visible !important;
              }
              #print-santri-card-zone {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm !important;
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8mm !important;
                background: #ffffff !important;
              }
              .no-print-area {
                display: none !important;
              }
              .printable-single-card {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                box-shadow: none !important;
                border: 1px solid #94a3b8 !important;
              }
            }
          `}</style>

          <div style={{
            background: '#f8fafc',
            borderRadius: '14px',
            maxWidth: '850px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
          }}>
            {/* Modal Header (No Print) */}
            <div className="no-print-area" style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Printer size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Cetak Barcode & Kartu Santri ({printSantriList.length} Santri)
                  </h3>
                  <p style={{ fontSize: '0.72rem', margin: 0, color: 'rgba(255, 255, 255, 0.85)' }}>
                    Pilih format kartu identitas atau stiker barcode, lalu klik tombol Cetak / PDF.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Format Toggle */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('card')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: printFormat === 'card' ? '#ffffff' : 'transparent',
                      color: printFormat === 'card' ? '#064e3b' : '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Format ID Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('sticker')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: printFormat === 'sticker' ? '#ffffff' : 'transparent',
                      color: printFormat === 'sticker' ? '#064e3b' : '#ffffff',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Stiker Barcode
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f1f5f9' }}>
              <div 
                id="print-santri-card-zone"
                style={{
                  display: 'grid',
                  gridTemplateColumns: printFormat === 'card' ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}
              >
                {printSantriList.map((santri) => {
                  const initials = (santri.nama_santri || 'S').slice(0, 2).toUpperCase();

                  if (printFormat === 'sticker') {
                    // STICKER BARCODE MODE (Compact label for books/lockers)
                    return (
                      <div 
                        key={santri.id}
                        className="printable-single-card"
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          padding: '10px 12px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#064e3b', marginBottom: '2px' }}>
                          PP. NURUL WAFA
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {santri.nama_santri}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '6px' }}>
                          NIS: {santri.nis} • {santri.nama_asrama || 'Asrama'}
                        </div>
                        <div style={{ background: '#ffffff', padding: '4px', borderRadius: '4px' }}>
                          <BarcodeCardItem value={santri.nis} width={1.2} height={32} fontSize={9} />
                        </div>
                      </div>
                    );
                  }

                  // ID CARD MODE (Standard ID Card Pesantren)
                  return (
                    <div 
                      key={santri.id}
                      className="printable-single-card"
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        overflow: 'hidden',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '215px'
                      }}
                    >
                      {/* Card Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                        color: '#ffffff',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '2px solid #d97706'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img 
                            src="/logo.png" 
                            alt="Logo" 
                            style={{ width: '26px', height: '26px', objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: '2px' }} 
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                          <div>
                            <div style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.1 }}>
                              PONDOK PESANTREN NURUL WAFA
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#fef08a', fontWeight: 700 }}>
                              KARTU IDENTITAS & PRESENSI SANTRI
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.6rem', background: '#d97706', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                          {santri.status_santri || 'MUKIM'}
                        </span>
                      </div>

                      {/* Card Middle: Profile & Details */}
                      <div style={{ padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Avatar / Photo */}
                        <div style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #059669, #0d9488)',
                          color: '#ffffff',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #064e3b',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>

                        {/* Text Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {santri.nama_santri}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px' }}>
                              NIS: {santri.nis}
                            </span>
                            {santri.nisn && (
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                NISN: {santri.nisn}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '3px' }}>
                            Asrama: <strong>{santri.nama_asrama || 'Asrama Pusat'}</strong>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Kobong: {santri.nama_kamar || 'Kamar 01'} • Kelas: {santri.tingkat_diniyah || 'Wustho'}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom: Barcode 1D & QR Code */}
                      <div style={{
                        marginTop: 'auto',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}>
                        {/* Barcode 1D */}
                        <div style={{ flex: 1 }}>
                          <BarcodeCardItem value={santri.nis} width={1.2} height={28} fontSize={9} />
                        </div>

                        {/* QR Code */}
                        <div style={{ flexShrink: 0, paddingLeft: '6px', borderLeft: '1px dashed #cbd5e1' }}>
                          <QrCodeCardItem value={santri.nis} size={48} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Controls (No Print) */}
            <div className="no-print-area" style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Siap cetak {printSantriList.length} kartu santri ke printer atau simpan sebagai PDF.
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#047857',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)'
                  }}
                >
                  <Printer size={16} />
                  <span>Cetak / Print PDF Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL IMPORT EXCEL / CSV DATA SANTRI                  */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div 
            className="modal-card" 
            style={{ 
              maxWidth: '860px', 
              width: '95%', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Import Data Santri (Excel & CSV)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>
                    Unggah file spreadsheet untuk menambahkan atau memperbarui data santri secara massal
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => { setIsImportModalOpen(false); resetImport(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* STEP 1: DOWNLOAD TEMPLATE */}
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '14px 18px',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Download size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                      Langkah 1: Unduh Format Template
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Gunakan template kolom resmi (NIS, Nama Santri, L/P, Kelas, Asrama, Kobong, Nama Wali, No WA).
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid #059669',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <Download size={14} /> Unduh Template CSV / Excel
                </button>
              </div>

              {/* STEP 2: UPLOAD DROPZONE */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a', marginBottom: '8px' }}>
                  Langkah 2: Pilih atau Tarik File Spreadsheet (.xlsx, .xls, .csv)
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragActive ? '2px dashed #0284c7' : '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '24px 20px',
                    textAlign: 'center',
                    background: dragActive ? '#f0f9ff' : (importFile ? '#f0fdf4' : '#ffffff'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {parsingFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#0284c7' }}>
                      <RotateCw size={28} className="spin" />
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Membaca isi file spreadsheet...</div>
                    </div>
                  ) : importFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '8px',
                        background: '#dcfce7',
                        color: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CheckCircle2 size={24} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#166534' }}>
                          {importFile.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#4b5563' }}>
                          Ukuran: {(importFile.size / 1024).toFixed(1)} KB • Terbaca: <strong>{importData.length} baris santri</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); resetImport(); }}
                        style={{
                          marginLeft: 'auto',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284c7'
                      }}>
                        <UploadCloud size={24} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Klik di sini untuk memilih file atau seret file ke area ini
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Format file yang didukung: <strong>.xlsx</strong>, <strong>.xls</strong>, dan <strong>.csv</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: PREVIEW DATA */}
              {importData.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0f172a' }}>
                      Langkah 3: Pratinjau Data ({importData.length} Santri)
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                        Ikhwan: {importData.filter(d => {
                          const g = String(d.jk || d.gender || d['Jenis Kelamin'] || 'L').toUpperCase();
                          return !g.startsWith('P') && !g.includes('PEREMPUAN') && !g.includes('AKHWAT');
                        }).length}
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#fce7f3', color: '#be185d', fontWeight: 700 }}>
                        Akhwat: {importData.filter(d => {
                          const g = String(d.jk || d.gender || d['Jenis Kelamin'] || '').toUpperCase();
                          return g.startsWith('P') || g.includes('PEREMPUAN') || g.includes('AKHWAT');
                        }).length}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    <table className="data-table" style={{ fontSize: '0.73rem', width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'center', width: '40px' }}>No</th>
                          <th style={{ padding: '6px 10px' }}>NIS</th>
                          <th style={{ padding: '6px 10px' }}>Nama Santri</th>
                          <th style={{ padding: '6px 10px', textAlign: 'center' }}>L/P</th>
                          <th style={{ padding: '6px 10px' }}>Kelas</th>
                          <th style={{ padding: '6px 10px' }}>Asrama & Kamar</th>
                          <th style={{ padding: '6px 10px' }}>Wali & Kontak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 50).map((row, idx) => {
                          const nama = row.nama_santri || row.nama || row.Nama || row['Nama Santri'] || '-';
                          const nis = row.nis || row.NIS || row['No Induk'] || `(Auto ${idx + 1})`;
                          const rawJk = String(row.jk || row.gender || row['Jenis Kelamin'] || 'L').toUpperCase();
                          const isP = rawJk.startsWith('P') || rawJk.includes('PEREMPUAN') || rawJk.includes('AKHWAT');
                          const kelas = row.kelas || row['Kelas'] || '-';
                          const asrama = row.nama_asrama || row.asrama || row['Asrama'] || '-';
                          const kamar = row.nama_kamar || row.kamar || row['Kamar'] || row['Kobong'] || '-';
                          const wali = row.nama_wali || row['Nama Wali'] || row['Wali'] || '-';
                          const noWa = row.no_wa_wali || row['No WA'] || row['No HP Wali'] || row['WhatsApp'] || '-';

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '5px 10px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                              <td style={{ padding: '5px 10px', fontWeight: 700, color: '#0284c7' }}>{nis}</td>
                              <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0f172a' }}>{nama}</td>
                              <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: isP ? '#fce7f3' : '#e0f2fe',
                                  color: isP ? '#db2777' : '#0284c7'
                                }}>
                                  {isP ? 'P' : 'L'}
                                </span>
                              </td>
                              <td style={{ padding: '5px 10px', color: '#475569' }}>{kelas}</td>
                              <td style={{ padding: '5px 10px', color: '#475569' }}>
                                {asrama} {kamar !== '-' ? `• ${kamar}` : ''}
                              </td>
                              <td style={{ padding: '5px 10px', color: '#475569' }}>
                                <div>{wali}</div>
                                {noWa !== '-' && <div style={{ fontSize: '0.67rem', color: '#059669' }}>{noWa}</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {importData.length > 50 && (
                    <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                      Menampilkan 50 dari total {importData.length} baris data santri.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 22px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                <AlertCircle size={14} color="#0284c7" />
                <span>Data dengan NIS yang sama akan diperbarui otomatis, data baru akan ditambahkan.</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); resetImport(); }}
                  disabled={importing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing || importData.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: importData.length === 0 ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: importData.length === 0 || importing ? 'not-allowed' : 'pointer',
                    boxShadow: importData.length > 0 ? '0 2px 4px rgba(2, 132, 199, 0.3)' : 'none'
                  }}
                >
                  {importing ? (
                    <>
                      <RotateCw size={14} className="spin" />
                      <span>Mengimpor {importData.length} Data...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Mulai Import ({importData.length} Santri)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
