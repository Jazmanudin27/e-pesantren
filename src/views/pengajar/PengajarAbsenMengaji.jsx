import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Calendar, 
  Check, 
  Clock, 
  Search, 
  Save, 
  Users, 
  RotateCw, 
  CheckCircle2, 
  Building2, 
  FileText,
  Filter
} from 'lucide-react';
import { toastSuccess, toastError } from '../../utils/alert.util';

export default function PengajarAbsenMengaji() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [sesiList, setSesiList] = useState([]);
  const [selectedSesi, setSelectedSesi] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [search, setSearch] = useState('');
  const [santriList, setSantriList] = useState([]);

  // Ambil sesi mengaji
  const fetchSesi = async () => {
    try {
      const res = await axios.get('/api/pengajar/dashboard');
      if (res.data?.success && res.data.data?.daftarSesi) {
        setSesiList(res.data.data.daftarSesi);
        if (res.data.data.daftarSesi.length > 0 && !selectedSesi) {
          setSelectedSesi(String(res.data.data.daftarSesi[0].id));
        }
      }
    } catch (e) {
      console.warn('Gagal memuat sesi:', e);
    }
  };

  // Ambil data santri untuk presensi
  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/pengajar/absen-mengaji?tanggal=${tanggal}&sesi_id=${selectedSesi}&kelas=${kelasFilter}`);
      if (res.data?.success && res.data.data?.list) {
        setSantriList(res.data.data.list);
      }
    } catch (e) {
      toastError('Gagal memuat daftar santri untuk presensi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSesi();
  }, []);

  useEffect(() => {
    if (selectedSesi) {
      fetchAbsensi();
    }
  }, [tanggal, selectedSesi, kelasFilter]);

  const handleStatusChange = (santriId, newStatus) => {
    setSantriList(prev => prev.map(s => {
      if (s.santri_id === santriId) {
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  const handleMarkAll = (statusToSet) => {
    setSantriList(prev => prev.map(s => ({ ...s, status: statusToSet })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const sesiObj = sesiList.find(s => String(s.id) === String(selectedSesi));
      const payload = {
        tanggal,
        sesi_id: selectedSesi ? parseInt(selectedSesi, 10) : null,
        nama_sesi: sesiObj?.nama_sesi || 'Mengaji & Kajian Kitab',
        nama_ustadz: 'Ustadz Pengajar',
        items: santriList.map(s => ({
          santri_id: s.santri_id,
          status: s.status,
          keterangan: s.keterangan || ''
        }))
      };

      const res = await axios.post('/api/pengajar/absen-mengaji', payload);
      if (res.data?.success) {
        toastSuccess('Presensi mengaji berhasil disimpan ke database!');
        fetchAbsensi();
      }
    } catch (e) {
      toastError('Gagal menyimpan presensi mengaji: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(false);
    }
  };

  // Hitung stats
  const countHadir = santriList.filter(s => s.status === 'Hadir').length;
  const countSakit = santriList.filter(s => s.status === 'Sakit').length;
  const countIzin = santriList.filter(s => s.status === 'Izin').length;
  const countAlfa = santriList.filter(s => s.status === 'Alfa').length;

  const filteredSantri = santriList.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.nama_santri || '').toLowerCase().includes(q) ||
      (s.nis || '').toLowerCase().includes(q) ||
      (s.nama_kelas || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. KONTROL PILIHAN SESI & TANGGAL */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>Pilih Sesi &amp; Waktu Mengaji</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Tentukan kegiatan halaqah / kajian yang akan diabsen</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              TANGGAL MENGAJI
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
              SESI KEGIATAN
            </label>
            <select
              value={selectedSesi}
              onChange={(e) => setSelectedSesi(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            >
              {sesiList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nama_sesi} ({String(s.jam_mulai || '').slice(0,5)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. STATS BADGES COUNTER (IDENTIK OWNER STYLE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px'
        }}
      >
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#15803d' }}>{countHadir}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#166534' }}>Hadir</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#b91c1c' }}>{countSakit}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#991b1b' }}>Sakit</div>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#b45309' }}>{countIzin}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#92400e' }}>Izin</div>
        </div>
        <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f766e' }}>{countAlfa}</div>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#115e59' }}>Alfa</div>
        </div>
      </div>

      {/* 3. TOOLBAR PENCARIAN & TOMBOL CEPAT */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Cari santri / kelas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.74rem',
              outline: 'none',
              background: '#ffffff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleMarkAll('Hadir')}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              background: '#ecfdf5',
              color: '#047857',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ✓ Semua Hadir
          </button>

          <button
            type="button"
            disabled={saving || santriList.length === 0}
            onClick={handleSave}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#0d766e',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(13, 118, 110, 0.3)'
            }}
          >
            <Save size={14} />
            {saving ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
        </div>
      </div>

      {/* 4. DAFTAR SANTRI DENGAN TOGGLE STATUS CEPAT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            <RotateCw size={22} className="animate-spin" color="#0d766e" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Memuat daftar santri...</div>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.78rem' }}>
            Tidak ada santri yang cocok dengan pencarian.
          </div>
        ) : (
          filteredSantri.map((s, idx) => (
            <div
              key={s.santri_id}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idx + 1}. {s.nama_santri}
                </div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: '1px' }}>
                  NIS: {s.nis || '-'} • {s.nama_kelas || 'Santri'} {s.nama_asrama ? `• ${s.nama_asrama}` : ''}
                </div>
              </div>

              {/* Status Radio Pills */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {['Hadir', 'Sakit', 'Izin', 'Alfa'].map((st) => {
                  const isActive = s.status === st;
                  const colors = {
                    Hadir: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
                    Sakit: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
                    Izin: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
                    Alfa: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' }
                  }[st];

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(s.santri_id, st)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.65rem',
                        fontWeight: isActive ? 800 : 600,
                        cursor: 'pointer',
                        border: isActive ? `1.5px solid ${colors.text}` : '1px solid #e2e8f0',
                        background: isActive ? colors.bg : '#ffffff',
                        color: isActive ? colors.text : '#64748b',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

