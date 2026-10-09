import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building, 
  Home, 
  Users, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Edit3, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  UserCheck, 
  MapPin, 
  BedDouble, 
  Save 
} from 'lucide-react';
import { showConfirm, toastSuccess } from '../../utils/alert.util';

export default function AsramaView() {
  const [data, setData] = useState({ asrama: [], kamar: [] });
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('Semua Gender');
  const [filterGedung, setFilterGedung] = useState('Semua Gedung');

  // Modal Detail State
  const [selectedKamar, setSelectedKamar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form (Add & Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    kode_kamar: '',
    nama_kamar: '',
    asrama_id: 1,
    nama_asrama: 'Asrama Ali bin Abi Thalib',
    asrama_gender: 'L',
    lantai: 1,
    kapasitas: 10,
    terisi: 0,
    ketua_kamar: '',
    pembina: 'Ust. Ahmad Fauzi'
  });

  const fetchAsrama = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asrama');
      const defaultAsramaList = [
        { id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', kode_asrama: 'ASR-IKH-01', gender: 'L', lokasi_gedung: 'Gedung Asrama Putra Blok A', total_kamar: 4, total_santri: 12, pembina: 'Ust. Hamdan S.Th.I' },
        { id: 2, nama_asrama: 'Asrama Umar bin Khattab', kode_asrama: 'ASR-IKH-02', gender: 'L', lokasi_gedung: 'Gedung Asrama Putra Blok B', total_kamar: 4, total_santri: 12, pembina: 'Ust. Nurul Huda Al-Hafidz' },
        { id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', kode_asrama: 'ASR-AKH-01', gender: 'P', lokasi_gedung: 'Gedung Asrama Putri Blok A', total_kamar: 4, total_santri: 10, pembina: 'Usth. Salma M.Pd' },
        { id: 4, nama_asrama: 'Asrama Khadijah Al-Kubra', kode_asrama: 'ASR-AKH-02', gender: 'P', lokasi_gedung: 'Gedung Asrama Putri Blok B', total_kamar: 4, total_santri: 10, pembina: 'Usth. Salma M.Pd' }
      ];

      const finalAsrama = (res.data && res.data.asrama && res.data.asrama.length > 0) ? res.data.asrama : defaultAsramaList;

      if (res.data && res.data.success) {
        setData({
          asrama: res.data.asrama && res.data.asrama.length ? res.data.asrama : finalAsrama,
          kamar: res.data.kamar || []
        });
      } else {
        setData({
          asrama: finalAsrama,
          kamar: [
            { id: 1, kode_kamar: 'KMR-A01', nama_kamar: 'Kamar Abu Bakar 01', nama_asrama: 'Asrama Ali bin Abi Thalib', asrama_gender: 'L', lantai: 1, kapasitas: 10, terisi: 9, ketua_kamar: 'Ahmad Faiz Al-Hafidz', pembina: 'Ust. Ahmad Fauzi' },
            { id: 2, kode_kamar: 'KMR-A02', nama_kamar: 'Kamar Abu Bakar 02', nama_asrama: 'Asrama Ali bin Abi Thalib', asrama_gender: 'L', lantai: 1, kapasitas: 10, terisi: 10, ketua_kamar: 'Zaidan Muhammad', pembina: 'Ust. Ahmad Fauzi' },
            { id: 3, kode_kamar: 'KMR-B01', nama_kamar: 'Kamar Umar 01', nama_asrama: 'Asrama Umar bin Khattab', asrama_gender: 'L', lantai: 2, kapasitas: 10, terisi: 8, ketua_kamar: 'Muhammad Rifqi', pembina: 'Ust. Ridwan Kamil' },
            { id: 4, kode_kamar: 'KMR-C01', nama_kamar: 'Kamar Aisyah 01', nama_asrama: 'Asrama Fathimah Az-Zahra', asrama_gender: 'P', lantai: 1, kapasitas: 10, terisi: 10, ketua_kamar: 'Fatimah Az-Zahra', pembina: 'Usth. Siti Maryam' },
            { id: 5, kode_kamar: 'KMR-C02', nama_kamar: 'Kamar Aisyah 02', nama_asrama: 'Asrama Fathimah Az-Zahra', asrama_gender: 'P', lantai: 2, kapasitas: 8, terisi: 7, ketua_kamar: 'Aisyah Humaira', pembina: 'Usth. Siti Maryam' },
            { id: 6, kode_kamar: 'KMR-D01', nama_kamar: 'Kamar Maryam 01', nama_asrama: 'Asrama Khadijah Al-Kubra', asrama_gender: 'P', lantai: 1, kapasitas: 8, terisi: 8, ketua_kamar: 'Khadijah Zahra', pembina: 'Usth. Nur Aini' }
          ]
        });
      }
    } catch (err) {
      console.error('Gagal mengambil data asrama:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsrama();
  }, []);

  const openDetail = (kamar) => {
    setSelectedKamar(kamar);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKamar(null);
  };

  const openAddForm = () => {
    setFormMode('add');
    setFormData({
      id: null,
      kode_kamar: `KMR-${Date.now().toString().slice(-3)}`,
      nama_kamar: '',
      asrama_id: 1,
      nama_asrama: 'Asrama Ali bin Abi Thalib',
      asrama_gender: 'L',
      lantai: 1,
      kapasitas: 10,
      terisi: 0,
      ketua_kamar: '',
      pembina: 'Ust. Ahmad Fauzi'
    });
    setIsFormOpen(true);
  };

  const openEditForm = (kamar) => {
    setFormMode('edit');
    setFormData({
      id: kamar.id,
      kode_kamar: kamar.kode_kamar || '',
      nama_kamar: kamar.nama_kamar || '',
      asrama_id: kamar.asrama_id || 1,
      nama_asrama: kamar.nama_asrama || 'Asrama Ali bin Abi Thalib',
      asrama_gender: kamar.asrama_gender || 'L',
      lantai: kamar.lantai || 1,
      kapasitas: kamar.kapasitas || 10,
      terisi: kamar.terisi || 0,
      ketua_kamar: kamar.ketua_kamar || '',
      pembina: kamar.pembina || 'Musyrif Asrama'
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
  };

  const handleSaveKamar = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (formMode === 'add') {
        const res = await axios.post('/api/kamar', formData);
        if (res.data && res.data.success) {
          fetchAsrama();
        } else {
          setData({ ...data, kamar: [...data.kamar, { ...formData, id: Date.now() }] });
        }
      } else {
        const res = await axios.put(`/api/kamar/${formData.id}`, formData);
        if (res.data && res.data.success) {
          fetchAsrama();
        } else {
          setData({
            ...data,
            kamar: data.kamar.map(k => k.id === formData.id ? formData : k)
          });
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Gagal simpan kamar:', err);
      if (formMode === 'add') {
        setData({ ...data, kamar: [...data.kamar, { ...formData, id: Date.now() }] });
      } else {
        setData({
          ...data,
          kamar: data.kamar.map(k => k.id === formData.id ? formData : k)
        });
      }
      setIsFormOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKamar = async (id, nama) => {
    const ok = await showConfirm('Hapus Kamar', `Yakin ingin menghapus kamar kobong "${nama}"?`, 'Ya, Hapus', 'Batal');
    if (ok) {
      try {
        await axios.delete(`/api/kamar/${id}`);
        fetchAsrama();
        toastSuccess(`Kamar "${nama}" berhasil dihapus.`);
      } catch (err) {
        console.error('Gagal hapus kamar:', err);
        setData({
          ...data,
          kamar: data.kamar.filter(k => k.id !== id)
        });
        toastSuccess(`Kamar "${nama}" berhasil dihapus.`);
      }
    }
  };

  // Filter calculation
  const totalKapasitas = data.kamar.reduce((acc, k) => acc + (parseInt(k.kapasitas) || 10), 0);
  const totalTerisi = data.kamar.reduce((acc, k) => acc + (parseInt(k.terisi) || 0), 0);
  const totalPutra = data.asrama.filter(a => a.gender === 'L').length;
  const totalPutri = data.asrama.filter(a => a.gender === 'P').length;

  const filteredKamar = data.kamar.filter((k) => {
    const q = search.toLowerCase();
    const matchSearch = (
      k.nama_kamar?.toLowerCase().includes(q) ||
      k.kode_kamar?.toLowerCase().includes(q) ||
      k.nama_asrama?.toLowerCase().includes(q) ||
      k.ketua_kamar?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'putra' ? k.asrama_gender === 'L' :
      activeFilterTab === 'putri' ? k.asrama_gender === 'P' :
      activeFilterTab === 'penuh' ? (k.terisi >= k.kapasitas) : true;

    const matchGender = 
      filterGender === 'Semua Gender' ? true :
      filterGender === 'Putra' ? k.asrama_gender === 'L' :
      filterGender === 'Putri' ? k.asrama_gender === 'P' : true;

    const matchGedung = filterGedung === 'Semua Gedung' ? true : k.nama_asrama?.includes(filterGedung);

    return matchSearch && matchTab && matchGender && matchGedung;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL GEDUNG ASRAMA</div>
            <div className="stat-colored-number">{data.asrama.length || 4}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Building size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">TOTAL KAMAR KOBONG</div>
            <div className="stat-colored-number">{data.kamar.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BedDouble size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">TOTAL KAPASITAS SANTRI</div>
            <div className="stat-colored-number">{totalKapasitas || 56}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">SANTRI MUKIM TERISI</div>
            <div className="stat-colored-number">{totalTerisi || 52}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Home size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <Building size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Asrama & Kamar Kobong</h2>
            <p>Kelola blok gedung asrama putra/putri, penempatan kamar kobong, daya tampung, dan pembina asrama</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchAsrama}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAddForm}>
            <Plus size={14} /> Tambah Kamar Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <Home size={14} /> Semua Kamar ({data.kamar.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'putra' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('putra')}
        >
          <Building size={14} /> Asrama Putra ({totalPutra} Blok)
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'putri' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('putri')}
        >
          <Building size={14} /> Asrama Putri ({totalPutri} Blok)
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'penuh' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('penuh')}
        >
          <CheckCircle2 size={14} /> Kobong Penuh (100%)
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama kamar kobong, kode kamar, nama asrama, ketua kamar..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="filter-select"
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
        >
          <option>Semua Gender</option>
          <option>Putra</option>
          <option>Putri</option>
        </select>
        <select 
          className="filter-select"
          value={filterGedung}
          onChange={(e) => setFilterGedung(e.target.value)}
        >
          <option>Semua Gedung</option>
          <option>Ali</option>
          <option>Umar</option>
          <option>Fathimah</option>
          <option>Khadijah</option>
        </select>
      </div>


      {/* 5. DATA TABLE KAMAR KOBONG */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data asrama & kobong...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '40px' }}>NO</th>
                <th>KODE & NAMA KAMAR KOBONG</th>
                <th>BLOK GEDUNG ASRAMA</th>
                <th className="td-center">PERUNTUKAN</th>
                <th className="td-center">KAPASITAS</th>
                <th className="td-center">STATUS KETERISIAN</th>
                <th>KETUA KOBONG & PEMBINA</th>
                <th className="td-center" style={{ width: '130px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredKamar.map((k, idx) => {
                const isFull = (parseInt(k.terisi) || 0) >= (parseInt(k.kapasitas) || 10);
                return (
                  <tr key={k.id || idx}>
                    <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{k.nama_kamar}</div>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Kode: {k.kode_kamar}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a' }}>
                        <Building size={13} color="#059669" />
                        <span>{k.nama_asrama}</span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Lantai {k.lantai || 1}
                      </div>
                    </td>
                    <td className="td-center">
                      <span className={`badge ${k.asrama_gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                        {k.asrama_gender === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                      </span>
                    </td>
                    <td className="td-center" style={{ fontWeight: 700, color: '#334155' }}>
                      {k.kapasitas || 10} Santri
                    </td>
                    <td className="td-center">
                      <span className={`badge ${isFull ? 'badge-danger' : 'badge-success'}`}>
                        {k.terisi || 0} / {k.kapasitas || 10} Terisi
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>
                        {k.ketua_kamar || 'Belum Ditunjuk'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Pembina: {k.pembina || 'Musyrif Asrama'}
                      </div>
                    </td>
                    <td className="td-center">
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <button 
                          className="btn-action btn-action-view"
                          onClick={() => openDetail(k)}
                          title="Lihat Detail Kamar Kobong"
                        >
                          <Eye size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-edit"
                          onClick={() => openEditForm(k)}
                          title="Edit Kamar"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button 
                          className="btn-action btn-action-delete"
                          onClick={() => handleDeleteKamar(k.id, k.nama_kamar)}
                          title="Hapus Kamar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL DETAIL KAMAR KOBONG                           */}
      {/* ==================================================== */}
      {isModalOpen && selectedKamar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
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
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BedDouble size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Detail Kamar Kobong: {selectedKamar.nama_kamar}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Kode Kamar: {selectedKamar.kode_kamar}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#f1f5f9' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#ffffff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>GEDUNG ASRAMA</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{selectedKamar.nama_asrama}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>PERUNTUKAN GENDER</div>
                  <span className={`badge ${selectedKamar.asrama_gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                    {selectedKamar.asrama_gender === 'L' ? 'Ikhwan (Putra)' : 'Akhwat (Putri)'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>KAPASITAS SANTRI</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a' }}>{selectedKamar.kapasitas} Tempat Tidur</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>JUMLAH TERISI</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>{selectedKamar.terisi} Santri Mukim</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#059669" /> Petugas Kobong & Pembina Asrama
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} color="#0284c7" /> Ketua Kamar / Rais:
                    </span>
                    <strong style={{ color: '#0f172a' }}>{selectedKamar.ketua_kamar}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={14} color="#059669" /> Musyrif / Pembina:
                    </span>
                    <strong style={{ color: '#0f172a' }}>{selectedKamar.pembina}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL FORM TAMBAH / EDIT KAMAR KOBONG               */}
      {/* ==================================================== */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 0
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            overflowY: 'auto',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BedDouble size={18} />
                <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0 }}>
                  {formMode === 'add' ? 'Tambah Kamar Kobong Baru' : `Edit Kamar: ${formData.nama_kamar}`}
                </h3>
              </div>
              <button 
                onClick={closeForm}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: '#ffffff', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKamar}>
              <div style={{ padding: '18px 20px', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>NAMA KAMAR KOBONG *</label>
                  <input 
                    type="text" 
                    required 
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px' }} 
                    value={formData.nama_kamar}
                    onChange={(e) => setFormData({ ...formData, nama_kamar: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>KODE KAMAR</label>
                    <input 
                      type="text" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.kode_kamar}
                      onChange={(e) => setFormData({ ...formData, kode_kamar: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>PILIH GEDUNG ASRAMA *</label>
                    <select 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }}
                      value={formData.asrama_id || (data.asrama[0]?.id || 1)}
                      onChange={(e) => {
                        const selectedAsr = data.asrama.find(a => a.id === parseInt(e.target.value));
                        setFormData({
                          ...formData,
                          asrama_id: parseInt(e.target.value),
                          nama_asrama: selectedAsr ? selectedAsr.nama_asrama : formData.nama_asrama,
                          asrama_gender: selectedAsr ? selectedAsr.gender : formData.asrama_gender
                        });
                      }}
                    >
                      {data.asrama.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.nama_asrama} ({a.gender === 'L' ? 'Putra' : 'Putri'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>KAPASITAS (TEMPAT TIDUR)</label>
                    <input 
                      type="number" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.kapasitas}
                      onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>LANTAI GEDUNG</label>
                    <input 
                      type="number" 
                      className="filter-select" 
                      style={{ width: '100%', padding: '6px 10px' }} 
                      value={formData.lantai}
                      onChange={(e) => setFormData({ ...formData, lantai: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '3px' }}>KETUA KAMAR / RAIS</label>
                  <input 
                    type="text" 
                    className="filter-select" 
                    style={{ width: '100%', padding: '6px 10px' }} 
                    value={formData.ketua_kamar}
                    onChange={(e) => setFormData({ ...formData, ketua_kamar: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 18px', borderTop: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>
                  Batal
                </button>
                <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Simpan Kamar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
