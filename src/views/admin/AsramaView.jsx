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
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  UserCheck, 
  MapPin, 
  BedDouble 
} from 'lucide-react';

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

  const fetchAsrama = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asrama');
      if (res.data && res.data.success) {
        setData({
          asrama: res.data.asrama || [],
          kamar: res.data.kamar || []
        });
      } else {
        // Fallback default sample data
        setData({
          asrama: [
            { id: 1, nama_asrama: 'Asrama Ali bin Abi Thalib', kode_asrama: 'ASR-A', gender: 'L', lokasi_gedung: 'Gedung A Lantai 1-2', total_kamar: 8, total_santri: 64, pembina: 'Ust. Ahmad Fauzi, S.Pd.I' },
            { id: 2, nama_asrama: 'Asrama Umar bin Khattab', kode_asrama: 'ASR-B', gender: 'L', lokasi_gedung: 'Gedung B Lantai 1-2', total_kamar: 8, total_santri: 60, pembina: 'Ust. Ridwan Kamil, Lc.' },
            { id: 3, nama_asrama: 'Asrama Fathimah Az-Zahra', kode_asrama: 'ASR-C', gender: 'P', lokasi_gedung: 'Gedung Putri 1 Lantai 1-3', total_kamar: 10, total_santri: 80, pembina: 'Usth. Siti Maryam, M.Ag.' },
            { id: 4, nama_asrama: 'Asrama Khadijah Al-Kubra', kode_asrama: 'ASR-D', gender: 'P', lokasi_gedung: 'Gedung Putri 2 Lantai 1-2', total_kamar: 6, total_santri: 45, pembina: 'Usth. Nur Aini, S.Pd.' }
          ],
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
          <button className="btn btn-primary">
            <Plus size={14} /> Tambah Kamar / Asrama
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

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data asrama & kobong...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>KODE & NAMA KAMAR KOBONG</th>
                <th>BLOK GEDUNG ASRAMA</th>
                <th className="td-center">PERUNTUKAN</th>
                <th className="td-center">KAPASITAS</th>
                <th className="td-center">STATUS KETERISIAN</th>
                <th>KETUA KOBONG & PEMBINA</th>
                <th className="td-center" style={{ width: '90px' }}>DETAIL</th>
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
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => openDetail(k)}
                        title="Lihat Detail Kamar Kobong"
                      >
                        <Eye size={12} /> Detail
                      </button>
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
            maxWidth: '560px',
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
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BedDouble size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Detail Kamar Kobong: {selectedKamar.nama_kamar}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>
                    Kode Kamar: {selectedKamar.kode_kamar}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>GEDUNG ASRAMA</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{selectedKamar.nama_asrama}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>PERUNTUKAN GENDER</div>
                  <span className={`badge ${selectedKamar.asrama_gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                    {selectedKamar.asrama_gender === 'L' ? 'Ikhwan (Putra)' : 'Akhwat (Putri)'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>KAPASITAS SANTRI</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{selectedKamar.kapasitas} Tempat Tidur</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>JUMLAH TERISI</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669' }}>{selectedKamar.terisi} Santri Mukim</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Petugas Kobong & Pembina Asrama
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} color="#0284c7" /> Ketua Kamar / Rais:
                    </span>
                    <strong style={{ color: '#0f172a' }}>{selectedKamar.ketua_kamar}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ShieldCheck size={14} color="#059669" /> Musyrif / Pembina:
                    </span>
                    <strong style={{ color: '#0f172a' }}>{selectedKamar.pembina}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={closeModal}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
