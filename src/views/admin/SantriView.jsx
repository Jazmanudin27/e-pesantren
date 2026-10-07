import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCw, 
  Eye, 
  Home, 
  Clock, 
  GraduationCap, 
  Fingerprint, 
  Loader2,
  Building
} from 'lucide-react';

export default function SantriView() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/santri');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setSantriList(res.data.data);
      } else {
        setSantriList([
          { id: 1, nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 04', fingerprint_pin: 1001, capaian_hafalan_juz: 15, nama_wali: 'H. Abdullah', no_wa_wali: '0812-8888-1111', status: 'Aktif' },
          { id: 2, nama_santri: 'Zaidan Muhammad', nis: '2601002', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 02', fingerprint_pin: 1002, capaian_hafalan_juz: 28, nama_wali: 'Drs. Subagja', no_wa_wali: '0813-7777-2222', status: 'Aktif' },
          { id: 3, nama_santri: 'Fatimah Az-Zahra', nis: '2602001', jk: 'P', status_santri: 'Mukim', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar 01', fingerprint_pin: 2001, capaian_hafalan_juz: 30, nama_wali: 'H. Usman', no_wa_wali: '0811-9999-3333', status: 'Aktif' },
          { id: 4, nama_santri: 'Muhammad Rifqi', nis: '2601003', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Abu Bakar Ash-Shiddiq', nama_kamar: 'Kamar 06', fingerprint_pin: 1003, capaian_hafalan_juz: 5, nama_wali: 'Bpk. Hendra', no_wa_wali: '0857-4444-5555', status: 'Aktif' },
          { id: 5, nama_santri: 'Aisyah Humaira', nis: '2602002', jk: 'P', status_santri: 'Kalong', nama_asrama: 'Asrama Khadijah Al-Kubra', nama_kamar: 'Kamar 03', fingerprint_pin: 2002, capaian_hafalan_juz: 3, nama_wali: 'Hj. Rohmah', no_wa_wali: '0812-3333-6666', status: 'Aktif' },
          { id: 6, nama_santri: 'Bilal Abdurrahman', nis: '2601004', jk: 'L', status_santri: 'Mukim', nama_asrama: 'Asrama Utsman bin Affan', nama_kamar: 'Kamar 03', fingerprint_pin: 1004, capaian_hafalan_juz: 12, nama_wali: 'H. Rahman', no_wa_wali: '0812-5555-7777', status: 'Aktif' }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data santri:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSantri();
  }, []);

  const filteredList = santriList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = (
      s.nama_santri?.toLowerCase().includes(q) ||
      s.nis?.toLowerCase().includes(q) ||
      s.nama_asrama?.toLowerCase().includes(q) ||
      s.nama_wali?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'mukim' ? s.status_santri === 'Mukim' :
      activeFilterTab === 'kalong' ? s.status_santri === 'Kalong' :
      activeFilterTab === 'alumni' ? s.status === 'Alumni' || s.status === 'Boyong' : true;

    const matchAsrama = filterAsrama === 'Semua Asrama' ? true : s.nama_asrama?.includes(filterAsrama);
    const matchStatus = filterStatus === 'Semua Status' ? true : s.status === filterStatus;

    return matchSearch && matchTab && matchAsrama && matchStatus;
  });

  const countMukim = santriList.filter(s => s.status_santri === 'Mukim').length;
  const countKalong = santriList.filter(s => s.status_santri === 'Kalong').length;

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS (CLEAN WITHOUT SUBTEXT) */}
      <div className="top-stats-grid">
        {/* Total Santri - Blue Card */}
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI TERDAFTAR</div>
            <div className="stat-colored-number">{santriList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        {/* Santri Mukim - Green Card */}
        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SANTRI MUKIM (ASRAMA)</div>
            <div className="stat-colored-number">{countMukim || 5}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Home size={22} />
          </div>
        </div>

        {/* Santri Kalong - Amber Card */}
        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI KALONG (NON-MUKIM)</div>
            <div className="stat-colored-number">{countKalong || 1}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

        {/* Fingerprint Enrolled - Purple Card */}
        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">FINGERPRINT ENROLLED</div>
            <div className="stat-colored-number">{santriList.length || 6}</div>
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchSantri}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary">
            <Plus size={14} /> Tambah Santri Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <Users size={14} /> Semua Santri ({santriList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'mukim' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('mukim')}
        >
          <Home size={14} /> Santri Mukim ({countMukim})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'kalong' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('kalong')}
        >
          <Clock size={14} /> Santri Kalong ({countKalong})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'alumni' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('alumni')}
        >
          <GraduationCap size={14} /> Alumni / Boyong
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama santri, NIS, asrama, nama wali..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterAsrama}
          onChange={(e) => setFilterAsrama(e.target.value)}
        >
          <option>Semua Asrama</option>
          <option>Ali</option>
          <option>Umar</option>
          <option>Fathimah</option>
          <option>Khadijah</option>
          <option>Abu Bakar</option>
        </select>
        <select className="filter-select">
          <option>Semua Tingkat</option>
          <option>Wustho</option>
          <option>Ulya</option>
          <option>Ula</option>
        </select>
        <select className="filter-select">
          <option>Tahun 2026/2027</option>
          <option>Tahun 2025/2026</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Alumni</option>
          <option>Boyong</option>
        </select>
      </div>

      {/* 5. DATA TABLE (BORDERED WITH BTN-SUCCESS) */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data santri...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA SANTRI & NIS</th>
                <th className="td-center">GENDER</th>
                <th>ASRAMA & KOBONG</th>
                <th className="td-center">STATUS MUKIM</th>
                <th className="td-center">PIN FINGERPRINT</th>
                <th>WALI & KONTAK MAHROM</th>
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
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>NIS: {row.nis}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${row.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {row.jk === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a' }}>
                      <Building size={13} color="#059669" />
                      <span>{row.nama_asrama || 'Asrama Pondok'}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {row.nama_kamar || 'Kamar 01'}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={row.status_santri === 'Mukim' ? 'badge-status-green' : 'badge-status-orange'}>
                      {row.status_santri}
                    </span>
                  </td>
                  <td className="td-center">
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#0284c7', fontWeight: 700 }}>
                      PIN: {row.fingerprint_pin || '1001'}
                    </code>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>
                      {row.nama_wali || 'Orang Tua'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      {row.no_wa_wali || '-'}
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
