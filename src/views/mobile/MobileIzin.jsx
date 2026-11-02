import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DoorOpen, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { showSuccess, showError, toastSuccess, showConfirm } from '../../utils/alert.util';

export default function MobileIzin() {
  const [izinList, setIzinList] = useState([]);
  const [santriOptions, setSantriOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Modal Form Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);

  // Modal Konfirmasi Kepulangan Santri
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningItem, setReturningItem] = useState(null);
  const [returnTime, setReturnTime] = useState('');

  const getNowLocalString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const getFutureLocalString = (days = 3) => {
    const future = new Date(Date.now() + 86400000 * days);
    const offset = future.getTimezoneOffset() * 60000;
    return new Date(future.getTime() - offset).toISOString().slice(0, 16);
  };

  const initialForm = {
    id: null,
    santri_id: 1,
    jenis_izin: 'Izin Pulang',
    keperluan: '',
    tgl_keluar_rencana: getNowLocalString(),
    tgl_kembali_rencana: getFutureLocalString(3),
    status: 'Aktif Keluar'
  };

  const [formData, setFormData] = useState(initialForm);

  const defaultIzin = [
    { 
      id: 1, 
      santri_id: 1, 
      nama_santri: 'Muhammad Al-Fatih', 
      nis: '2601001',
      jenis_izin: 'Izin Pulang', 
      status: 'Aktif Keluar', 
      keperluan: 'Acara Keluarga & Walimah', 
      tgl_keluar_rencana: '2026-10-10T08:00', 
      tgl_kembali_rencana: '2026-10-12T10:00',
      tgl_kembali_aktual: null
    },
    { 
      id: 2, 
      santri_id: 2, 
      nama_santri: 'Ahmad Dahlan', 
      nis: '2601002',
      jenis_izin: 'Izin Berobat', 
      status: 'Terlambat Kembali', 
      keperluan: 'Pemeriksaan Gigi ke RSUD', 
      tgl_keluar_rencana: '2026-10-08T09:00', 
      tgl_kembali_rencana: '2026-10-09T14:00',
      tgl_kembali_aktual: '2026-10-09T18:30'
    },
    { 
      id: 3, 
      santri_id: 3, 
      nama_santri: 'Zaidan Muhammad', 
      nis: '2601003',
      jenis_izin: 'Izin Khusus', 
      status: 'Kembali Tepat Waktu', 
      keperluan: 'Urusan Dokumen Kependudukan', 
      tgl_keluar_rencana: '2026-10-05T08:00', 
      tgl_kembali_rencana: '2026-10-06T17:00',
      tgl_kembali_aktual: '2026-10-06T15:15'
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resIzin, resSantri] = await Promise.all([
        axios.get('/api/perizinan').catch(() => ({ data: { data: [] } })),
        axios.get('/api/santri').catch(() => ({ data: { data: [] } }))
      ]);

      const sanitizeItems = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(i => {
          const { nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, ...rest } = i;
          return rest;
        });
      };

      if (resSantri.data && resSantri.data.data && resSantri.data.data.length > 0) {
        setSantriOptions(resSantri.data.data);
      }

      if (resIzin.data && resIzin.data.data && resIzin.data.data.length > 0) {
        const sanitized = sanitizeItems(resIzin.data.data);
        setIzinList(sanitized);
        localStorage.setItem('mobile_izin_list', JSON.stringify(sanitized));
      } else {
        const saved = JSON.parse(localStorage.getItem('mobile_izin_list') || 'null');
        const sanitized = sanitizeItems(saved || defaultIzin);
        setIzinList(sanitized);
        localStorage.setItem('mobile_izin_list', JSON.stringify(sanitized));
      }
    } catch (err) {
      console.warn('Fallback data izin lokal:', err);
      const saved = JSON.parse(localStorage.getItem('mobile_izin_list') || 'null');
      const sanitized = Array.isArray(saved) ? saved.map(i => {
        const { nama_penjemput_mahrom, no_hp_penjemput, hubungan_mahrom, ...rest } = i;
        return rest;
      }) : defaultIzin;
      setIzinList(sanitized);
      localStorage.setItem('mobile_izin_list', JSON.stringify(sanitized));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Helpers
  const getInitials = (name) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '-';
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt.getTime())) return String(dtStr).replace('T', ' ');
      const d = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const t = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
      return `${d}, ${t} WIB`;
    } catch (e) {
      return String(dtStr).replace('T', ' ');
    }
  };

  // Helper evaluasi status kepulangan & keterlambatan
  const evalLateness = (item) => {
    const st = String(item.status || '').toLowerCase();
    const isReturned = st.includes('kembali');
    const rencanaDate = item.tgl_kembali_rencana ? new Date(item.tgl_kembali_rencana) : null;
    
    // Waktu perbandingan: jika sudah kembali pakai tgl_kembali_aktual, jika belum pakai waktu sekarang
    const compareDate = isReturned 
      ? (item.tgl_kembali_aktual ? new Date(item.tgl_kembali_aktual) : new Date())
      : new Date();

    if (rencanaDate && compareDate > rencanaDate) {
      const diffMs = compareDate - rencanaDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;

      let lateDuration = '';
      if (diffDays > 0) {
        lateDuration = `${diffDays} hari ${remHours > 0 ? `${remHours} jam` : ''}`;
      } else if (diffHours > 0) {
        lateDuration = `${diffHours} jam ${diffMins % 60 > 0 ? `${diffMins % 60} mnt` : ''}`;
      } else {
        lateDuration = `${Math.max(1, diffMins)} menit`;
      }

      return {
        isLate: true,
        isReturned,
        lateDuration
      };
    }

    return {
      isLate: false,
      isReturned,
      lateDuration: null
    };
  };

  // Status klasifikasi
  const isIzinActive = (st) => {
    const s = String(st || '').toLowerCase();
    return s.includes('disetujui') || s.includes('keluar') || s.includes('luar');
  };

  // Modal handlers
  const handleOpenAdd = () => {
    setFormMode('add');
    setFormData({
      ...initialForm,
      santri_id: santriOptions[0]?.id || 1,
      tgl_keluar_rencana: getNowLocalString(),
      tgl_kembali_rencana: getFutureLocalString(3),
      status: 'Aktif Keluar'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setFormData({
      id: item.id,
      santri_id: item.santri_id || 1,
      jenis_izin: item.jenis_izin || 'Izin Pulang',
      keperluan: item.keperluan || '',
      tgl_keluar_rencana: item.tgl_keluar_rencana ? String(item.tgl_keluar_rencana).replace(' ', 'T').slice(0, 16) : getNowLocalString(),
      tgl_kembali_rencana: item.tgl_kembali_rencana ? String(item.tgl_kembali_rencana).replace(' ', 'T').slice(0, 16) : getFutureLocalString(3),
      status: item.status || 'Aktif Keluar'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: formData.status || 'Aktif Keluar'
      };

      if (formMode === 'add') {
        await axios.post('/api/perizinan', payload);
      } else {
        await axios.put(`/api/perizinan/${formData.id}`, payload);
      }

      toastSuccess(formMode === 'add' ? 'Izin disetujui & santri tercatat keluar' : 'Data perizinan diperbarui');
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.warn('API fallback local:', err);
      setIzinList(prev => {
        let next;
        const selectedSantri = santriOptions.find(s => s.id === parseInt(formData.santri_id));
        const itemObj = {
          ...formData,
          nama_santri: selectedSantri ? selectedSantri.nama_santri : 'Santri',
          nis: selectedSantri ? selectedSantri.nis : '260100' + (prev.length + 1),
          id: Date.now()
        };

        if (formMode === 'add') {
          next = [itemObj, ...prev];
        } else {
          next = prev.map(i => i.id === formData.id ? { ...i, ...itemObj } : i);
        }
        localStorage.setItem('mobile_izin_list', JSON.stringify(next));
        return next;
      });
      toastSuccess('Izin disetujui & disimpan');
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Konfirmasi Hapus', 'Hapus catatan perizinan ini?');
    if (!confirmed) return;
    try {
      await axios.delete(`/api/perizinan/${id}`);
      fetchData();
      toastSuccess('Perizinan dihapus');
    } catch (err) {
      setIzinList(prev => {
        const next = prev.filter(i => i.id !== id);
        localStorage.setItem('mobile_izin_list', JSON.stringify(next));
        return next;
      });
      toastSuccess('Perizinan dihapus');
    }
  };

  // Buka Modal Konfirmasi Kepulangan Santri
  const handleOpenReturnModal = (item) => {
    setReturningItem(item);
    setReturnTime(getNowLocalString());
    setIsReturnModalOpen(true);
  };

  // Submit Konfirmasi Kepulangan
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returningItem) return;

    const actualReturnDate = new Date(returnTime);
    const plannedReturnDate = new Date(returningItem.tgl_kembali_rencana);
    const isLate = actualReturnDate > plannedReturnDate;
    const finalStatus = isLate ? 'Terlambat Kembali' : 'Kembali Tepat Waktu';

    try {
      await axios.post('/api/perizinan/checkin', {
        id: returningItem.id,
        tgl_kembali_aktual: returnTime,
        satpam: 'Musyrif Mobile'
      });
      toastSuccess(isLate ? 'Santri tercatat: Terlambat Kembali' : 'Santri kembali tepat waktu');
      fetchData();
    } catch (err) {
      setIzinList(prev => {
        const next = prev.map(i => {
          if (i.id === returningItem.id) {
            return {
              ...i,
              status: finalStatus,
              tgl_kembali_aktual: returnTime
            };
          }
          return i;
        });
        localStorage.setItem('mobile_izin_list', JSON.stringify(next));
        return next;
      });
      toastSuccess(isLate ? 'Santri tercatat: Terlambat Kembali' : 'Santri kembali tepat waktu');
    } finally {
      setIsReturnModalOpen(false);
      setReturningItem(null);
    }
  };

  // Evaluasi Preview Keterlambatan saat input waktu kembali
  const previewLateness = () => {
    if (!returningItem || !returnTime) return null;
    const act = new Date(returnTime);
    const plan = new Date(returningItem.tgl_kembali_rencana);
    if (act > plan) {
      const diffMs = act - plan;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;

      if (diffDays > 0) return `${diffDays} hari ${remHours > 0 ? `${remHours} jam` : ''}`;
      if (diffHours > 0) return `${diffHours} jam ${diffMins % 60 > 0 ? `${diffMins % 60} menit` : ''}`;
      return `${Math.max(1, diffMins)} menit`;
    }
    return null;
  };

  // Perhitungan Statistik
  const countTotal = izinList.length;
  const countAktif = izinList.filter(i => isIzinActive(i.status)).length;
  const countTerlambat = izinList.filter(i => {
    const lateness = evalLateness(i);
    return lateness.isLate || String(i.status || '').toLowerCase().includes('terlambat');
  }).length;
  const countSelesai = izinList.filter(i => String(i.status || '').toLowerCase().includes('tepat')).length;

  // Filter Data
  const filteredList = izinList.filter(item => {
    const q = searchQuery.toLowerCase();
    const nama = (item.nama_santri || '').toLowerCase();
    const jenis = (item.jenis_izin || '').toLowerCase();
    const alasan = (item.keperluan || '').toLowerCase();
    const matchQuery = nama.includes(q) || jenis.includes(q) || alasan.includes(q);

    if (!matchQuery) return false;

    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Di Luar') return isIzinActive(item.status);
    if (activeFilter === 'Terlambat') {
      const lateness = evalLateness(item);
      return lateness.isLate || String(item.status || '').toLowerCase().includes('terlambat');
    }
    if (activeFilter === 'Kembali') {
      return String(item.status || '').toLowerCase().includes('kembali');
    }
    return true;
  });

  return (
    <div style={{
      minHeight: '100%',
      background: '#f8fafc',
      padding: '14px 14px 80px',
      fontFamily: "'Inter', sans-serif"
    }}>

      {/* 4 SUMMARY STATS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '14px'
      }}>
        <div style={{ background: '#ffffff', padding: '10px 4px', borderRadius: '14px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>{countTotal}</div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700 }}>Total</div>
        </div>
        <div style={{ background: '#fffbeb', padding: '10px 4px', borderRadius: '14px', textAlign: 'center', border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#d97706' }}>{countAktif}</div>
          <div style={{ fontSize: '0.66rem', color: '#b45309', fontWeight: 700 }}>Di Luar</div>
        </div>
        <div style={{ background: '#fef2f2', padding: '10px 4px', borderRadius: '14px', textAlign: 'center', border: '1px solid #fecdd3' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>{countTerlambat}</div>
          <div style={{ fontSize: '0.66rem', color: '#b91c1c', fontWeight: 700 }}>Terlambat</div>
        </div>
        <div style={{ background: '#ecfdf5', padding: '10px 4px', borderRadius: '14px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>{countSelesai}</div>
          <div style={{ fontSize: '0.66rem', color: '#047857', fontWeight: 700 }}>Tepat Waktu</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '4px 14px',
        border: '1.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <Search size={18} color="#0284c7" />
        <input
          type="text"
          placeholder="Cari nama santri, keperluan, atau jenis izin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 0',
            border: 'none',
            outline: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#1e293b'
          }}
        />
        {searchQuery && (
          <X size={16} color="#94a3b8" onClick={() => setSearchQuery('')} style={{ cursor: 'pointer' }} />
        )}
      </div>

      {/* FILTER CHIPS */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '4px',
        marginBottom: '14px'
      }}>
        {[
          { key: 'Semua', label: `Semua (${countTotal})` },
          { key: 'Di Luar', label: `Sedang di Luar (${countAktif})` },
          { key: 'Terlambat', label: `Terlambat (${countTerlambat})` },
          { key: 'Kembali', label: `Sudah Kembali (${countSelesai})` }
        ].map(f => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: active ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                background: active ? '#0284c7' : '#ffffff',
                color: active ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 3px 8px rgba(2, 132, 199, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* LIST KARTU PERIZINAN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px', color: '#0284c7' }} />
          <div style={{ fontSize: '0.85rem' }}>Memuat data perizinan santri...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '36px 16px',
          textAlign: 'center',
          color: '#94a3b8',
          border: '1.5px dashed #cbd5e1'
        }}>
          <DoorOpen size={40} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#334155' }}>
            Tidak Ada Data Perizinan
          </div>
          <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            {searchQuery ? 'Tidak ada izin yang cocok dengan kata kunci.' : 'Klik tombol (+) untuk input izin santri baru.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.map((item) => {
            const lateness = evalLateness(item);
            const isActive = isIzinActive(item.status);
            const isLate = lateness.isLate || String(item.status || '').toLowerCase().includes('terlambat');
            const isReturned = lateness.isReturned;

            // Border & theme color
            let cardBorder = '#e2e8f0';
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let badgeText = item.status;
            let avatarBg = '#e0f2fe';
            let avatarColor = '#0369a1';

            if (isLate) {
              cardBorder = '#fca5a5';
              badgeBg = '#fee2e2';
              badgeColor = '#dc2626';
              badgeText = isReturned ? 'Terlambat Kembali' : 'Melewati Batas Kembali';
              avatarBg = '#fee2e2';
              avatarColor = '#b91c1c';
            } else if (isActive) {
              cardBorder = '#fde68a';
              badgeBg = '#fef3c7';
              badgeColor = '#d97706';
              badgeText = 'Sedang di Luar';
              avatarBg = '#fef3c7';
              avatarColor = '#b45309';
            } else if (isReturned) {
              cardBorder = '#a7f3d0';
              badgeBg = '#ecfdf5';
              badgeColor = '#059669';
              badgeText = 'Kembali Tepat Waktu';
              avatarBg = '#d1fae5';
              avatarColor = '#047857';
            }

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  padding: '14px',
                  border: `1.5px solid ${cardBorder}`,
                  boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Top Row: Avatar, Name, Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '14px',
                    background: avatarBg,
                    color: avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    flexShrink: 0
                  }}>
                    {getInitials(item.nama_santri)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{
                        fontWeight: 800,
                        fontSize: '0.94rem',
                        color: '#0f172a',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.nama_santri || 'Santri'}
                      </div>

                      <span style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${cardBorder}`,
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: badgeColor }} />
                        {badgeText}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      <span style={{
                        background: '#f1f5f9',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        color: '#334155'
                      }}>
                        {item.jenis_izin}
                      </span>
                      <span>•</span>
                      <span>NIS: {item.nis || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Keperluan Details */}
                <div style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '0.74rem',
                  color: '#334155',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <span style={{ color: '#64748b', minWidth: '65px' }}>Keperluan:</span>
                    <strong style={{ color: '#0f172a' }}>{item.keperluan}</strong>
                  </div>
                </div>

                {/* Schedule Dates & Lateness Alert */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isLate ? '#fff1f2' : '#ffffff',
                  border: isLate ? '1px solid #fecdd3' : '1px solid #f1f5f9',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '0.72rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: '#64748b' }}>Keluar: {formatDateTime(item.tgl_keluar_rencana)}</span>
                    <span style={{ color: isLate ? '#b91c1c' : '#0f172a', fontWeight: isLate ? 800 : 600 }}>
                      Batas: {formatDateTime(item.tgl_kembali_rencana)}
                    </span>
                  </div>

                  {/* Lateness Tag if late */}
                  {isLate && lateness.lateDuration && (
                    <div style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)'
                    }}>
                      <AlertTriangle size={12} />
                      <span>+{lateness.lateDuration}</span>
                    </div>
                  )}

                  {!isLate && isReturned && (
                    <div style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Check size={12} />
                      <span>{formatDateTime(item.tgl_kembali_aktual || item.tgl_kembali_rencana)}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  {/* Button Konfirmasi Kembali (Hanya jika belum kembali) */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleOpenReturnModal(item)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={15} />
                      <span>Konfirmasi Kembali</span>
                    </button>
                  )}

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Edit Izin"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      color: '#e11d48',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Hapus Izin"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: FORM INPUT / EDIT PERIZINAN (AUTO-APPROVE)
      ========================================================================= */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 10000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxHeight: '90vh',
            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            padding: '20px', overflowY: 'auto', boxShadow: '0 -10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {formMode === 'add' ? '➕ Input Perizinan Santri' : '✏️ Edit Data Perizinan'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                  ✓ Otomatis disetujui setelah disimpan
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Pilih Santri */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Pilih Santri *</label>
                <select
                  value={formData.santri_id}
                  onChange={(e) => setFormData({ ...formData, santri_id: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', outline: 'none' }}
                >
                  {santriOptions.length > 0 ? (
                    santriOptions.map(s => <option key={s.id} value={s.id}>{s.nama_santri} (NIS: {s.nis})</option>)
                  ) : (
                    <option value={1}>Muhammad Al-Fatih</option>
                  )}
                </select>
              </div>

              {/* Jenis Izin */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Jenis Izin *</label>
                <select
                  value={formData.jenis_izin}
                  onChange={(e) => setFormData({ ...formData, jenis_izin: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', background: '#ffffff', outline: 'none' }}
                >
                  <option value="Izin Pulang">Izin Pulang (Keluarga / Liburan)</option>
                  <option value="Izin Berobat">Izin Berobat (Klinik / RS)</option>
                  <option value="Izin Keluar Komplek">Izin Keluar Komplek (Singkat)</option>
                  <option value="Izin Khusus">Izin Khusus (Mendesak / Takziyah)</option>
                </select>
              </div>

              {/* Keperluan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Keperluan / Alasan Izin *</label>
                <textarea
                  required 
                  rows={2} 
                  placeholder="Contoh: Menghadiri walimah pernikahan kakak kandung"
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>


              {/* Rencana Keluar & Rencana Kembali */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Rencana Keluar *</label>
                  <input
                    type="datetime-local" 
                    required
                    value={formData.tgl_keluar_rencana}
                    onChange={(e) => setFormData({ ...formData, tgl_keluar_rencana: e.target.value })}
                    style={{ width: '100%', padding: '10px 10px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Batas Kembali *</label>
                  <input
                    type="datetime-local" 
                    required
                    value={formData.tgl_kembali_rencana}
                    onChange={(e) => setFormData({ ...formData, tgl_kembali_rencana: e.target.value })}
                    style={{ width: '100%', padding: '10px 10px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Simpan & Approve</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: KONFIRMASI KEPULANGAN SANTRI (DETEKSI TERLAMBAT)
      ========================================================================= */}
      {isReturnModalOpen && returningItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '380px',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏡</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Konfirmasi Kepulangan
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => { setIsReturnModalOpen(false); setReturningItem(null); }} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Santri Card Summary */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                  {returningItem.nama_santri}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  {returningItem.jenis_izin} • {returningItem.keperluan}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 700, marginTop: '4px' }}>
                  📅 Batas Kembali: {formatDateTime(returningItem.tgl_kembali_rencana)}
                </div>
              </div>

              {/* Input Waktu Kembali Aktual */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Waktu Kembali Aktual ke Pesantren *
                </label>
                <input
                  type="datetime-local" 
                  required
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              {/* Live Detection Alert */}
              {previewLateness() ? (
                <div style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#be123c',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    Santri <strong>TERLAMBAT {previewLateness()}</strong> dari batas waktu rencana!
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#166534',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <div>
                    Santri kembali <strong>TEPAT WAKTU</strong> sesuai izin.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsReturnModalOpen(false); setReturningItem(null); }} 
                  style={{ flex: 1, padding: '11px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{
                    flex: 1.5,
                    padding: '11px',
                    borderRadius: '12px',
                    border: 'none',
                    background: previewLateness() ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                >
                  <Save size={15} />
                  <span>Simpan Kepulangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (FAB) (+) */}
      <button
        onClick={handleOpenAdd}
        title="Input Izin Santri Baru"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '80px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90
        }}
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
