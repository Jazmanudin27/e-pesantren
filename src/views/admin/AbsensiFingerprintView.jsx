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
  Loader2 
} from 'lucide-react';

export default function AbsensiFingerprintView() {
  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('santri');
  const [search, setSearch] = useState('');

  const fetchAbsensi = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/absensi-fingerprint');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setAbsensiList(res.data.data);
      } else {
        setAbsensiList([
          { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', tanggal: '2026-10-07', jam_masuk: '04:42:15', jam_pulang: '05:30:10', status: 'Terlambat', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 04', lat_lng: '-7.325374, 108.208331' },
          { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', tanggal: '2026-10-07', jam_masuk: '04:36:24', jam_pulang: '05:32:12', status: 'Tepat Waktu', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 02', lat_lng: '-7.325593, 108.208196' },
          { id: 3, nama_santri: 'Muhammad Rifqi', nis: '2601003', tanggal: '2026-10-07', jam_masuk: '04:50:08', jam_pulang: 'Belum Scan', status: 'Terlambat', nama_asrama: 'Asrama Abu Bakar', nama_kamar: 'Kamar 06', lat_lng: '-7.325100, 108.208406' },
          { id: 4, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', tanggal: '2026-10-07', jam_masuk: '04:35:07', jam_pulang: '05:30:17', status: 'Tepat Waktu', nama_asrama: 'Asrama Fathimah (Putri)', nama_kamar: 'Kamar 01', lat_lng: '-7.325418, 108.208318' },
          { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', tanggal: '2026-10-07', jam_masuk: '04:48:48', jam_pulang: 'Belum Scan', status: 'Terlambat', nama_asrama: 'Asrama Khadijah (Putri)', nama_kamar: 'Kamar 03', lat_lng: '-7.325025, 108.208421' },
          { id: 6, nama_santri: 'Bilal Abdurrahman', nis: '2601004', tanggal: '2026-10-07', jam_masuk: '04:41:11', jam_pulang: 'Belum Scan', status: 'Terlambat', nama_asrama: 'Asrama Utsman', nama_kamar: 'Kamar 03', lat_lng: '-7.325110, 108.208405' },
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
    const q = search.toLowerCase();
    return (
      item.nama_santri?.toLowerCase().includes(q) ||
      item.nis?.toLowerCase().includes(q) ||
      item.nama_asrama?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL LOG PRESENSI</div>
            <div className="stat-colored-number">90</div>
          </div>
          <div className="stat-colored-icon-box">
            <Fingerprint size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">PRESENSI LENGKAP</div>
            <div className="stat-colored-number">66</div>
          </div>
          <div className="stat-colored-icon-box">
            <CheckCircle size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">BELUM SCAN PULANG</div>
            <div className="stat-colored-number">24</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">TERLAMBAT (&gt; 04:45)</div>
            <div className="stat-colored-number">28</div>
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
            <h2>Log Presensi Harian Santri & Shalat Berjamaah</h2>
            <p>Pemantauan waktu check-in, check-out, geolocation, dan foto scan presensi fingerprint</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={fetchAbsensi}>
          <RotateCw size={13} /> Refresh
        </button>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeTab === 'santri' ? 'active' : ''}`}
          onClick={() => setActiveTab('santri')}
        >
          <Users size={14} /> Presensi Santri
        </button>
        <button 
          className={`tab-btn ${activeTab === 'halaqah' ? 'active' : ''}`}
          onClick={() => setActiveTab('halaqah')}
        >
          <BookOpen size={14} /> Absensi Halaqah Tahfidz
        </button>
        <button 
          className={`tab-btn ${activeTab === 'shalat' ? 'active' : ''}`}
          onClick={() => setActiveTab('shalat')}
        >
          <Clock size={14} /> Shalat Berjamaah
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, tanggal..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select">
          <option>Semua Santri</option>
          <option>Santri Mukim</option>
          <option>Santri Kalong</option>
        </select>
        <select className="filter-select">
          <option>Oktober</option>
          <option>November</option>
          <option>Desember</option>
        </select>
        <select className="filter-select">
          <option>Tahun 2026</option>
          <option>Tahun 2027</option>
        </select>
        <select className="filter-select">
          <option>Semua Status</option>
          <option>Hadir Tepat Waktu</option>
          <option>Terlambat</option>
          <option>Belum Scan</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data log presensi...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th className="td-center">TANGGAL</th>
                <th className="td-center">JAM MASUK</th>
                <th className="td-center">JAM PULANG</th>
                <th>LOKASI PRESENSI</th>
                <th className="td-center" style={{ width: '90px' }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.nama_santri}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>NIS: {row.nis}</div>
                  </td>
                  <td className="td-center" style={{ color: '#0f172a', fontWeight: 500 }}>
                    {row.tanggal ? (typeof row.tanggal === 'string' && row.tanggal.includes('T') ? row.tanggal.split('T')[0] : row.tanggal) : '2026-10-07'}
                  </td>
                  <td className="td-center">
                    <span style={{ fontWeight: 600, marginRight: '6px' }}>
                      {row.jam_masuk || row.waktu_scan || '04:42:15'}
                    </span>
                    <span className={`badge ${row.status === 'Tepat Waktu' || row.status?.includes('Tepat') ? 'badge-success' : 'badge-danger'}`}>
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
                    <button className="btn btn-success btn-sm">
                      <Eye size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
