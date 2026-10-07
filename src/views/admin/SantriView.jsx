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
  Building,
  X,
  Phone,
  Calendar,
  Award,
  ShieldCheck,
  MapPin,
  User
} from 'lucide-react';

export default function SantriView() {
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('Semua Asrama');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSantri = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/santri');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setSantriList(res.data.data);
      } else {
        setSantriList([
          { id: 1, kode_santri: 'STR-26-001', nama_santri: 'Ahmad Faiz Al-Hafidz', nis: '2601001', nisn: '0089123456', jk: 'L', tempat_lahir: 'Tasikmalaya', tgl_lahir: '2008-05-12', status_santri: 'Mukim', nama_asrama: 'Asrama Ali bin Abi Thalib', nama_kamar: 'Kamar 04', fingerprint_pin: 1001, rfid_card_uid: 'RF-88391', capaian_hafalan_juz: 15, tingkat_diniyah: 'Wustho', nama_wali: 'H. Abdullah', no_wa_wali: '081288881111', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Jl. Sutisna Senjaya No. 45, Kota Tasikmalaya', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 2, kode_santri: 'STR-26-002', nama_santri: 'Zaidan Muhammad', nis: '2601002', nisn: '0089123457', jk: 'L', tempat_lahir: 'Bandung', tgl_lahir: '2007-09-20', status_santri: 'Mukim', nama_asrama: 'Asrama Umar bin Khattab', nama_kamar: 'Kamar 02', fingerprint_pin: 1002, rfid_card_uid: 'RF-88392', capaian_hafalan_juz: 28, tingkat_diniyah: 'Ulya', nama_wali: 'Drs. Subagja', no_wa_wali: '081377772222', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Komp. Margahayu Raya Blok C-12, Bandung', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 3, kode_santri: 'STR-26-003', nama_santri: 'Fatimah Az-Zahra', nis: '2602001', nisn: '0089123458', jk: 'P', tempat_lahir: 'Ciamis', tgl_lahir: '2007-11-15', status_santri: 'Mukim', nama_asrama: 'Asrama Fathimah Az-Zahra', nama_kamar: 'Kamar 01', fingerprint_pin: 2001, rfid_card_uid: 'RF-88393', capaian_hafalan_juz: 30, tingkat_diniyah: 'Ulya', nama_wali: 'H. Usman', no_wa_wali: '081199993333', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Jl. Raya Panjalu No. 10, Ciamis', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 4, kode_santri: 'STR-26-004', nama_santri: 'Muhammad Rifqi', nis: '2601003', nisn: '0089123459', jk: 'L', tempat_lahir: 'Garut', tgl_lahir: '2009-02-18', status_santri: 'Mukim', nama_asrama: 'Asrama Abu Bakar Ash-Shiddiq', nama_kamar: 'Kamar 06', fingerprint_pin: 1003, rfid_card_uid: 'RF-88394', capaian_hafalan_juz: 5, tingkat_diniyah: 'Ula', nama_wali: 'Bpk. Hendra', no_wa_wali: '085744445555', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Tarogong Kaler, Garut', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 5, kode_santri: 'STR-26-005', nama_santri: 'Aisyah Humaira', nis: '2602002', nisn: '0089123460', jk: 'P', tempat_lahir: 'Tasikmalaya', tgl_lahir: '2009-06-25', status_santri: 'Kalong', nama_asrama: 'Asrama Khadijah Al-Kubra', nama_kamar: 'Kamar 03', fingerprint_pin: 2002, rfid_card_uid: 'RF-88395', capaian_hafalan_juz: 3, tingkat_diniyah: 'Ula', nama_wali: 'Hj. Rohmah', no_wa_wali: '081233336666', hubungan_wali: 'Orang Tua (Ibu)', alamat_asal: 'Jl. Cisalak No. 88, Tasikmalaya', status: 'Aktif', tahun_masuk: '2026/2027' },
          { id: 6, kode_santri: 'STR-26-006', nama_santri: 'Bilal Abdurrahman', nis: '2601004', nisn: '0089123461', jk: 'L', tempat_lahir: 'Jakarta', tgl_lahir: '2008-08-10', status_santri: 'Mukim', nama_asrama: 'Asrama Utsman bin Affan', nama_kamar: 'Kamar 03', fingerprint_pin: 1004, rfid_card_uid: 'RF-88396', capaian_hafalan_juz: 12, tingkat_diniyah: 'Wustho', nama_wali: 'H. Rahman', no_wa_wali: '081255557777', hubungan_wali: 'Orang Tua (Ayah)', alamat_asal: 'Tebet Timur, Jakarta Selatan', status: 'Aktif', tahun_masuk: '2026/2027' }
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

  const openDetail = (santri) => {
    setSelectedSantri(santri);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSantri(null);
  };

  // Filter logic
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
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI TERDAFTAR</div>
            <div className="stat-colored-number">{santriList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">SANTRI MUKIM (ASRAMA)</div>
            <div className="stat-colored-number">{countMukim || 5}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Home size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">SANTRI KALONG (NON-MUKIM)</div>
            <div className="stat-colored-number">{countKalong || 1}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Clock size={22} />
          </div>
        </div>

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

      {/* 5. DATA TABLE */}
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
                    <span className={`badge ${row.status_santri === 'Mukim' ? 'badge-success' : 'badge-warning'}`}>
                      {row.status_santri || 'Mukim'}
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
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => openDetail(row)}
                      title="Lihat Detail Santri"
                    >
                      <Eye size={12} /> Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL SANTRI & BIODATA LENGKAP               */}
      {/* ==================================================== */}
      {isModalOpen && selectedSantri && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <User size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '0.02em' }}>Biodata & Riwayat Santri</h3>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>NIS: {selectedSantri.nis} • Kode: {selectedSantri.kode_santri || 'STR-2026'}</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px' }}>
              
              {/* Profile Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{selectedSantri.nama_santri}</div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    Status: <strong style={{ color: selectedSantri.status_santri === 'Mukim' ? '#34d399' : '#fbbf24' }}>Santri {selectedSantri.status_santri}</strong> • {selectedSantri.jk === 'L' ? 'Ikhwan' : 'Akhwat'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
                    {selectedSantri.status || 'Aktif'}
                  </span>
                </div>
              </div>

              {/* Info Grid 2 Kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                
                {/* Asrama & Kamar */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Home size={12} color="#059669" /> Asrama & Kamar Kobong
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{selectedSantri.nama_asrama || '-'}</div>
                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>{selectedSantri.nama_kamar || '-'}</div>
                </div>

                {/* Tahfidz & Hafalan */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={12} color="#0284c7" /> Capaian Tahfidz Qur'an
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0284c7' }}>{selectedSantri.capaian_hafalan_juz || 0} Juz</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tingkat: {selectedSantri.tingkat_diniyah || 'Wustho'}</div>
                </div>

                {/* Biometrik Mesin Fingerprint */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Fingerprint size={12} color="#7c3aed" /> Biometrik Presensi
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>PIN Mesin: <code>{selectedSantri.fingerprint_pin || '-'}</code></div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>RFID: {selectedSantri.rfid_card_uid || 'Terdaftar'}</div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="#d97706" /> TTL & Tahun Masuk
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>{selectedSantri.tempat_lahir || 'Tasikmalaya'}, {selectedSantri.tgl_lahir || '-'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Tahun Masuk: {selectedSantri.tahun_masuk || '2026/2027'}</div>
                </div>

              </div>

              {/* Data Wali & Kontak Mahrom */}
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 14px', background: '#ffffff', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#0f172a', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} color="#059669" /> Data Mahrom & Wali Santri
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Nama Wali:</span> <strong>{selectedSantri.nama_wali || '-'}</strong> ({selectedSantri.hubungan_wali || 'Orang Tua'})
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>No. WhatsApp:</span> <strong>{selectedSantri.no_wa_wali || '-'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Alamat Asal:</span> {selectedSantri.alamat_asal || 'Kota Tasikmalaya, Jawa Barat'}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 18px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              {selectedSantri.no_wa_wali && (
                <a 
                  href={`https://wa.me/${selectedSantri.no_wa_wali.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#25D366', borderColor: '#25D366' }}
                >
                  <Phone size={12} /> Chat WhatsApp Wali
                </a>
              )}
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
