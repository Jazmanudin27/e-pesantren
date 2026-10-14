import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Fingerprint, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RotateCw, 
  Search, 
  Eye, 
  MapPin, 
  Users, 
  BookOpen, 
  Loader2,
  Calendar,
  CalendarCheck,
  X
} from 'lucide-react';

export default function AbsensiFingerprintView() {
  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKegiatan, setSelectedKegiatan] = useState('Presensi Santri');
  const [selectedSantri, setSelectedSantri] = useState('semua');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedStatus, setSelectedStatus] = useState('semua');
  const [selectedDetail, setSelectedDetail] = useState(null);

  const getNamaHari = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const days = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()];
  };

  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      let fetched = null;
      try {
        const res = await axios.get('/api/absensi/fingerprint');
        if (res.data && res.data.success && res.data.data) {
          fetched = res.data.data;
        }
      } catch {
        try {
          const res2 = await axios.get('/api/absensi-fingerprint');
          if (res2.data && res2.data.success && res2.data.data) {
            fetched = res2.data.data;
          }
        } catch {}
      }

      const todayStr = new Date().toISOString().split('T')[0];

      if (fetched && Array.isArray(fetched) && fetched.length > 0) {
        const normalized = fetched.map((item, idx) => {
          let keg = 'Presensi Santri';
          const kat = (item.kategori || item.nama_sesi || item.kegiatan || '').toLowerCase();
          if (kat.includes('tahfidz') || kat.includes('halaqah') || kat.includes('ngaji') || kat.includes('qur')) {
            keg = 'Absensi Halaqah Tahfidz';
          } else if (kat.includes('shalat') || kat.includes('jamaah') || kat.includes('subuh') || kat.includes('dzuhur') || kat.includes('ashar') || kat.includes('maghrib') || kat.includes('isya')) {
            keg = 'Shalat Berjamaah';
          }
          return {
            id: item.id || idx + 1,
            nama_santri: item.nama_santri || 'Santri',
            nis: item.nis || '-',
            kegiatan: item.kegiatan || keg,
            tanggal: item.tanggal ? (typeof item.tanggal === 'string' && item.tanggal.includes('T') ? item.tanggal.split('T')[0] : item.tanggal) : todayStr,
            jam_masuk: item.jam_masuk || item.waktu_scan || '04:42:15',
            jam_pulang: item.jam_pulang || 'Belum Scan',
            status: item.status || item.status_kehadiran || 'Hadir Tepat Waktu',
            nama_asrama: item.nama_asrama || '-',
            nama_kamar: item.nama_kamar || '-',
            tipe_santri: item.tipe_santri || item.status_santri || 'Santri Mukim',
            lat_lng: item.lat_lng || '-7.325374, 108.208331'
          };
        });
        setAbsensiList(normalized);
      } else {
        // Mock data default per tanggal hari ini
        setAbsensiList([
          { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', tanggal: todayStr, kegiatan: 'Presensi Santri', jam_masuk: '04:42:15', jam_pulang: '05:30:10', status: 'Terlambat', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 04', tipe_santri: 'Santri Mukim', lat_lng: '-7.325374, 108.208331' },
          { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', tanggal: todayStr, kegiatan: 'Presensi Santri', jam_masuk: '04:36:24', jam_pulang: '05:32:12', status: 'Hadir Tepat Waktu', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 02', tipe_santri: 'Santri Mukim', lat_lng: '-7.325593, 108.208196' },
          { id: 3, nama_santri: 'Muhammad Rifqi', nis: '2601003', tanggal: todayStr, kegiatan: 'Absensi Halaqah Tahfidz', jam_masuk: '05:25:08', jam_pulang: '06:30:00', status: 'Hadir Tepat Waktu', nama_asrama: 'Asrama Abu Bakar', nama_kamar: 'Kamar 06', tipe_santri: 'Santri Mukim', lat_lng: '-7.325100, 108.208406' },
          { id: 4, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', tanggal: todayStr, kegiatan: 'Shalat Berjamaah', jam_masuk: '04:35:07', jam_pulang: '05:15:17', status: 'Hadir Tepat Waktu', nama_asrama: 'Asrama Fathimah (Putri)', nama_kamar: 'Kamar 01', tipe_santri: 'Santri Mukim', lat_lng: '-7.325418, 108.208318' },
          { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', tanggal: todayStr, kegiatan: 'Absensi Halaqah Tahfidz', jam_masuk: '05:48:48', jam_pulang: 'Belum Scan', status: 'Terlambat', nama_asrama: 'Asrama Khadijah (Putri)', nama_kamar: 'Kamar 03', tipe_santri: 'Santri Kalong', lat_lng: '-7.325025, 108.208421' },
          { id: 6, nama_santri: 'Bilal Abdurrahman', nis: '2601004', tanggal: todayStr, kegiatan: 'Shalat Berjamaah', jam_masuk: '04:41:11', jam_pulang: 'Belum Scan', status: 'Terlambat', nama_asrama: 'Asrama Utsman', nama_kamar: 'Kamar 03', tipe_santri: 'Santri Mukim', lat_lng: '-7.325110, 108.208405' },
          { id: 7, nama_santri: 'Umar Faruq', nis: '2601005', tanggal: todayStr, kegiatan: 'Presensi Santri', jam_masuk: '04:30:00', jam_pulang: '05:30:00', status: 'Hadir Tepat Waktu', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 01', tipe_santri: 'Santri Kalong', lat_lng: '-7.325200, 108.208300' },
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data absensi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsensi();
  }, []);

  const filteredList = absensiList.filter((item) => {
    // 1. Filter Search
    const q = search.toLowerCase();
    if (q) {
      const matchSearch = (
        item.nama_santri?.toLowerCase().includes(q) ||
        item.nis?.toLowerCase().includes(q) ||
        item.nama_asrama?.toLowerCase().includes(q)
      );
      if (!matchSearch) return false;
    }

    // 2. Filter Kegiatan
    if (selectedKegiatan && selectedKegiatan !== 'semua') {
      const keg = (item.kegiatan || '').toLowerCase();
      if (selectedKegiatan === 'Presensi Santri') {
        const isSantri = keg.includes('santri') || keg.includes('harian') || (!keg.includes('tahfidz') && !keg.includes('halaqah') && !keg.includes('shalat'));
        if (!isSantri) return false;
      } else if (selectedKegiatan === 'Absensi Halaqah Tahfidz') {
        const isHalaqah = keg.includes('tahfidz') || keg.includes('halaqah') || keg.includes('ngaji') || keg.includes('qur');
        if (!isHalaqah) return false;
      } else if (selectedKegiatan === 'Shalat Berjamaah') {
        const isShalat = keg.includes('shalat') || keg.includes('jamaah');
        if (!isShalat) return false;
      }
    }

    // 3. Filter Tipe Santri
    if (selectedSantri && selectedSantri !== 'semua') {
      const tipe = (item.tipe_santri || '').toLowerCase();
      if (!tipe.includes(selectedSantri.toLowerCase().replace('santri ', ''))) return false;
    }

    // 4. Filter Per Tanggal
    if (selectedDate) {
      const itemDate = item.tanggal ? (typeof item.tanggal === 'string' && item.tanggal.includes('T') ? item.tanggal.split('T')[0] : item.tanggal) : '';
      if (itemDate && itemDate !== selectedDate) return false;
    }

    // 5. Filter Status
    if (selectedStatus && selectedStatus !== 'semua') {
      const st = (item.status || '').toLowerCase();
      if (selectedStatus === 'Hadir Tepat Waktu' && !st.includes('tepat')) return false;
      if (selectedStatus === 'Terlambat' && !st.includes('terlambat')) return false;
      if (selectedStatus === 'Belum Scan' && !st.includes('belum') && item.jam_pulang !== 'Belum Scan') return false;
    }

    return true;
  });

  const totalLog = filteredList.length;
  const presensiLengkap = filteredList.filter(x => x.jam_pulang && x.jam_pulang !== 'Belum Scan').length;
  const belumScan = filteredList.filter(x => !x.jam_pulang || x.jam_pulang === 'Belum Scan').length;
  const terlambat = filteredList.filter(x => (x.status || '').toLowerCase().includes('terlambat')).length;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL LOG PRESENSI</div>
            <div className="stat-colored-number">{totalLog}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">PRESENSI LENGKAP</div>
            <div className="stat-colored-number">{presensiLengkap}</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">BELUM SCAN PULANG</div>
            <div className="stat-colored-number">{belumScan}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TERLAMBAT</div>
            <div className="stat-colored-number">{terlambat}</div>
          </div>
          <div className="stat-colored-icon-box">
            <AlertCircle size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Fingerprint size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Presensi Kegiatan Santri</h2>
            <p>Pemantauan waktu check-in, check-out, geolocation, dan foto scan presensi per kegiatan &amp; tanggal</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchAbsensi}>
            <RotateCw size={13} /> Refresh
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => { window.location.hash = 'setting-kegiatan'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CalendarCheck size={13} /> Setting Kegiatan
          </button>
        </div>
      </div>

      {/* 3. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, asrama..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* SELECT OPTION KEGIATAN */}
        <select 
          className="filter-select"
          value={selectedKegiatan}
          onChange={(e) => setSelectedKegiatan(e.target.value)}
          title="Pilih Kegiatan Santri"
          style={{ fontWeight: 600, color: '#0369a1' }}
        >
          <option value="Presensi Santri">Presensi Santri</option>
          <option value="Absensi Halaqah Tahfidz">Absensi Halaqah Tahfidz</option>
          <option value="Shalat Berjamaah">Shalat Berjamaah</option>
          <option value="semua">Semua Kegiatan</option>
        </select>

        {/* SELECT SANTRI MUKIM / KALONG */}
        <select 
          className="filter-select"
          value={selectedSantri}
          onChange={(e) => setSelectedSantri(e.target.value)}
        >
          <option value="semua">Semua Santri</option>
          <option value="Santri Mukim">Santri Mukim</option>
          <option value="Santri Kalong">Santri Kalong</option>
        </select>

        {/* PER TANGGAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input 
            type="date" 
            className="filter-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            title="Filter Tanggal"
            style={{ cursor: 'pointer' }}
          />
          {selectedDate && (
            <>
              <span 
                className="badge badge-info" 
                style={{ 
                  padding: '5px 8px', 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  whiteSpace: 'nowrap',
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}
              >
                Hari {getNamaHari(selectedDate)}
              </span>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setSelectedDate('')}
                title="Tampilkan semua tanggal"
                style={{ padding: '4px 8px', fontSize: '0.72rem', height: '100%' }}
              >
                Semua Tgl
              </button>
            </>
          )}
        </div>

        {/* SELECT STATUS */}
        <select 
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="semua">Semua Status</option>
          <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
          <option value="Terlambat">Terlambat</option>
          <option value="Belum Scan">Belum Scan</option>
        </select>
      </div>

      {/* 4. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data presensi...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA SANTRI &amp; NIS</th>
                <th>KEGIATAN</th>
                <th className="td-center">TANGGAL</th>
                <th className="td-center">JAM MASUK</th>
                <th className="td-center">JAM PULANG</th>
                <th>LOKASI PRESENSI</th>
                <th className="td-center" style={{ width: '90px' }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    Tidak ada data presensi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        NIS: {row.nis} • <span style={{ color: '#0284c7' }}>{row.tipe_santri || 'Santri Mukim'}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={`badge ${
                          row.kegiatan?.includes('Tahfidz') || row.kegiatan?.includes('Halaqah') 
                            ? 'badge-purple' 
                            : row.kegiatan?.includes('Shalat') 
                            ? 'badge-info' 
                            : 'badge-primary'
                        }`}
                        style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      >
                        {row.kegiatan || 'Presensi Santri'}
                      </span>
                    </td>
                    <td className="td-center" style={{ color: '#0f172a', fontWeight: 500 }}>
                      {row.tanggal ? (typeof row.tanggal === 'string' && row.tanggal.includes('T') ? row.tanggal.split('T')[0] : row.tanggal) : '-'}
                    </td>
                    <td className="td-center">
                      <span style={{ fontWeight: 600, marginRight: '6px' }}>
                        {row.jam_masuk || row.waktu_scan || '-'}
                      </span>
                      <span className={`badge ${row.status === 'Hadir Tepat Waktu' || row.status?.includes('Tepat') ? 'badge-success' : 'badge-danger'}`}>
                        {row.status?.includes('Tepat') ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </td>
                    <td className="td-center">
                      {row.jam_pulang === 'Belum Scan' || !row.jam_pulang ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>Belum Scan</span>
                      ) : (
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>{row.jam_pulang}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontSize: '0.74rem' }}>
                        <MapPin size={13} />
                        <span>{row.lat_lng || '-7.325374, 108.208331'}</span>
                      </div>
                    </td>
                    <td className="td-center">
                      <button 
                        className="btn btn-success btn-sm" 
                        title="Detail Presensi"
                        onClick={() => setSelectedDetail(row)}
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DETAIL */}
      {selectedDetail && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Fingerprint size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Detail Presensi Santri</h3>
              </div>
              <button 
                className="btn-icon" 
                onClick={() => setSelectedDetail(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Nama Santri</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedDetail.nama_santri}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>NIS</span>
                <span style={{ fontWeight: 600 }}>{selectedDetail.nis}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Kegiatan</span>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{selectedDetail.kegiatan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Tanggal</span>
                <span style={{ fontWeight: 600 }}>{selectedDetail.tanggal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Jam Masuk / Scan</span>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>{selectedDetail.jam_masuk}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Jam Pulang</span>
                <span style={{ fontWeight: 600 }}>{selectedDetail.jam_pulang}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Status Kehadiran</span>
                <span className={`badge ${selectedDetail.status?.includes('Tepat') ? 'badge-success' : 'badge-danger'}`}>
                  {selectedDetail.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Asrama &amp; Kamar</span>
                <span>{selectedDetail.nama_asrama} - {selectedDetail.nama_kamar}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Lokasi / Geotag</span>
                <span style={{ color: '#0284c7', fontSize: '0.74rem' }}>{selectedDetail.lat_lng}</span>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn btn-outline" onClick={() => setSelectedDetail(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
