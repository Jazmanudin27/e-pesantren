import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Users, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Loader2, 
  GraduationCap, 
  Calendar, 
  Clock, 
  X, 
  UserCheck, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function KelasView() {
  const [halaqahList, setHalaqahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('Semua Gender');
  const [filterProgram, setFilterProgram] = useState('Semua Program');

  // Modal Detail State
  const [selectedHalaqah, setSelectedHalaqah] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHalaqah = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tahfidz/halaqah');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setHalaqahList(res.data.data);
      } else {
        // Fallback default sample data
        setHalaqahList([
          { id: 1, nama_halaqah: 'Halaqah Imam Nafi (Ikhwan A)', nama_asatidz: 'Ust. Abdullah Al-Hafidz', gender: 'L', target_program: 'Tahfidz 30 Juz & Mutqin', waktu_halaqah: 'Ba\'da Subuh & Ba\'da Maghrib', total_santri: 12, lokasi_halaqah: 'Masjid Utama Lantai 1', tingkat: 'Ulya' },
          { id: 2, nama_halaqah: 'Halaqah Imam Ashim (Ikhwan B)', nama_asatidz: 'Ust. Muhammad Zaki, Lc.', gender: 'L', target_program: 'Tahsin & Ziyadah 15 Juz', waktu_halaqah: 'Ba\'da Ashar & Ba\'da Isya', total_santri: 15, lokasi_halaqah: 'Gazebo Tahfidz Timur', tingkat: 'Wustho' },
          { id: 3, nama_halaqah: 'Halaqah Imam Hamzah (Ikhwan C)', nama_asatidz: 'Ust. Bilal Mansur, S.Pd.I', gender: 'L', target_program: 'Tahfidz Juz 30 & Diniyah Dasar', waktu_halaqah: 'Ba\'da Subuh & Ashar', total_santri: 14, lokasi_halaqah: 'Ruang Kelas Diniyah 01', tingkat: 'Ula' },
          { id: 4, nama_halaqah: 'Halaqah Hafshah binti Umar (Akhwat A)', nama_asatidz: 'Usth. Sarah Humaira, Al-Hafidzah', gender: 'P', target_program: 'Tahfidz 30 Juz & Sanad Jazariyah', waktu_halaqah: 'Ba\'da Subuh & Ba\'da Maghrib', total_santri: 12, lokasi_halaqah: 'Musholla Putri Lt. 2', tingkat: 'Ulya' },
          { id: 5, nama_halaqah: 'Halaqah Maryam Al-Adzra (Akhwat B)', nama_asatidz: 'Usth. Salma Fauziyah, M.Ag.', gender: 'P', target_program: 'Ziyadah 10 Juz & Tartil', waktu_halaqah: 'Ba\'da Ashar & Ba\'da Isya', total_santri: 16, lokasi_halaqah: 'Aula Asrama Putri', tingkat: 'Wustho' },
          { id: 6, nama_halaqah: 'Halaqah Asma binti Abi Bakar (Akhwat C)', nama_asatidz: 'Usth. Siti Rahmawati, S.Pd.', gender: 'P', target_program: 'Tahsin Al-Jazari & Juz Amma', waktu_halaqah: 'Ba\'da Subuh & Ashar', total_santri: 14, lokasi_halaqah: 'Ruang Belajar Putri 02', tingkat: 'Ula' }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data halaqah/kelas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalaqah();
  }, []);

  const openDetail = (h) => {
    setSelectedHalaqah(h);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHalaqah(null);
  };

  const totalSantriInHalaqah = halaqahList.reduce((acc, h) => acc + (parseInt(h.total_santri) || 0), 0);
  const countIkhwan = halaqahList.filter(h => h.gender === 'L').length;
  const countAkhwat = halaqahList.filter(h => h.gender === 'P').length;

  const filteredList = halaqahList.filter((h) => {
    const q = search.toLowerCase();
    const matchSearch = (
      h.nama_halaqah?.toLowerCase().includes(q) ||
      h.nama_asatidz?.toLowerCase().includes(q) ||
      h.target_program?.toLowerCase().includes(q) ||
      h.tingkat?.toLowerCase().includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ikhwan' ? h.gender === 'L' :
      activeFilterTab === 'akhwat' ? h.gender === 'P' :
      activeFilterTab === 'tahfidz' ? h.target_program?.toLowerCase().includes('tahfidz') : true;

    const matchGender = 
      filterGender === 'Semua Gender' ? true :
      filterGender === 'Ikhwan' ? h.gender === 'L' :
      filterGender === 'Akhwat' ? h.gender === 'P' : true;

    const matchProgram = 
      filterProgram === 'Semua Program' ? true :
      h.target_program?.toLowerCase().includes(filterProgram.toLowerCase());

    return matchSearch && matchTab && matchGender && matchProgram;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL KELOMPOK HALAQAH</div>
            <div className="stat-colored-number">{halaqahList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">HALAQAH IKHWAN (PUTRA)</div>
            <div className="stat-colored-number">{countIkhwan || 3}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">HALAQAH AKHWAT (PUTRI)</div>
            <div className="stat-colored-number">{countAkhwat || 3}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">TOTAL SANTRI AKTIF MENGAJI</div>
            <div className="stat-colored-number">{totalSantriInHalaqah || 83}</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <BookOpen size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Kelas & Halaqah Al-Qur'an</h2>
            <p>Kelola pembagian kelompok halaqah santri, asatidz pengampu setoran, jadwal halaqah, dan target mutqin</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchHalaqah}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary">
            <Plus size={14} /> Tambah Halaqah Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <BookOpen size={14} /> Semua Halaqah ({halaqahList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'ikhwan' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ikhwan')}
        >
          <Users size={14} /> Halaqah Ikhwan ({countIkhwan})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'akhwat' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('akhwat')}
        >
          <Sparkles size={14} /> Halaqah Akhwat ({countAkhwat})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'tahfidz' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('tahfidz')}
        >
          <GraduationCap size={14} /> Program 30 Juz Mutqin
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama halaqah, nama ustadz/musyrif, target program..." 
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
          <option>Ikhwan</option>
          <option>Akhwat</option>
        </select>
        <select 
          className="filter-select"
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          <option>Semua Program</option>
          <option>Tahfidz</option>
          <option>Tahsin</option>
          <option>Ziyadah</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data halaqah & kelas...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA HALAQAH & TINGKAT</th>
                <th>ASATIDZ / MUSYRIF PENGAMPU</th>
                <th>TARGET PEMBELAJARAN</th>
                <th>JADWAL HALAQAH</th>
                <th className="td-center">GENDER</th>
                <th className="td-center">TOTAL SANTRI</th>
                <th className="td-center" style={{ width: '90px' }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((h, idx) => (
                <tr key={h.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.nama_halaqah}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Tingkat: {h.tingkat || 'Wustho'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{h.nama_asatidz || 'Musyrif Halaqah'}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Lokasi: {h.lokasi_halaqah || 'Masjid Utama'}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.76rem' }}>{h.target_program}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.72rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#0284c7" />
                      <span>{h.waktu_halaqah}</span>
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${h.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {h.gender === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                    </span>
                  </td>
                  <td className="td-center">
                    <span className="badge badge-success">
                      {h.total_santri || 0} Santri
                    </span>
                  </td>
                  <td className="td-center">
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => openDetail(h)}
                      title="Lihat Detail Halaqah"
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
      {/* MODAL DETAIL HALAQAH / KELAS                        */}
      {/* ==================================================== */}
      {isModalOpen && selectedHalaqah && (
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
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {selectedHalaqah.nama_halaqah}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
                    Tingkat Diniyah: {selectedHalaqah.tingkat || 'Wustho'}
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
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>ASATIDZ / MUSYRIF</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669' }}>{selectedHalaqah.nama_asatidz}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>PERUNTUKAN GENDER</div>
                  <span className={`badge ${selectedHalaqah.gender === 'L' ? 'badge-info' : 'badge-purple'}`}>
                    {selectedHalaqah.gender === 'L' ? 'Ikhwan (Putra)' : 'Akhwat (Putri)'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>LOKASI HALAQAH</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{selectedHalaqah.lokasi_halaqah || 'Masjid Utama'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>TOTAL SANTRI AKTIF</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0284c7' }}>{selectedHalaqah.total_santri} Santri</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Target & Jadwal Rutin
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b' }}>Target Capaian:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedHalaqah.target_program}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b' }}>Waktu Setoran:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedHalaqah.waktu_halaqah}</strong>
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
