import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  RotateCw, 
  Search, 
  Eye, 
  Loader2, 
  Phone, 
  Mail, 
  Award, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  BookOpen, 
  Building 
} from 'lucide-react';

export default function AsatidzView() {
  const [asatidzList, setAsatidzList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('Semua Gender');
  const [filterStatus, setFilterStatus] = useState('Semua Status');

  // Modal Detail State
  const [selectedAsatidz, setSelectedAsatidz] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAsatidz = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/asatidz');
      if (res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setAsatidzList(res.data.data);
      } else {
        // Fallback default sample data
        setAsatidzList([
          { id: 1, nama_asatidz: 'K.H. Abdullah Gymnastiar', gelar: 'Lc., M.Ag.', nik_niy: 'AST-2021-001', jk: 'L', tugas_utama: 'Pimpinan & Pengasuh Utama', no_hp: '08122334455', email: 'kh.abdullah@pesantren.id', alamat: 'Komp. Pondok Utama Blok A1', status: 'Aktif', tanggal_bergabung: '2021-01-01', bidang_keahlian: 'Tafsir & Akhlak Tasawuf' },
          { id: 2, nama_asatidz: 'Ust. Ahmad Fauzi', gelar: 'S.Pd.I, Al-Hafidz', nik_niy: 'AST-2022-004', jk: 'L', tugas_utama: 'Kepala Bagian Tahfidz & Musyrif Asrama Putra', no_hp: '081344556677', email: 'ahmad.fauzi@pesantren.id', alamat: 'Asrama Ali bin Abi Thalib Lt. 1', status: 'Aktif', tanggal_bergabung: '2022-06-15', bidang_keahlian: 'Tahfidz 30 Juz & Qiraat Ashim' },
          { id: 3, nama_asatidz: 'Ust. Muhammad Zaki', gelar: 'Lc.', nik_niy: 'AST-2023-008', jk: 'L', tugas_utama: 'Pengajar Kitab Kuning (Nahwu Shorof)', no_hp: '085711223344', email: 'zaki.lc@pesantren.id', alamat: 'Perum Gading Residence No. 12', status: 'Aktif', tanggal_bergabung: '2023-02-01', bidang_keahlian: 'Gramatika Arab & Fiqih Syafi\'i' },
          { id: 4, nama_asatidz: 'Usth. Sarah Humaira', gelar: 'S.Th.I, Al-Hafidzah', nik_niy: 'AST-2022-009', jk: 'P', tugas_utama: 'Koordinator Tahfidz Putri & Musy مشرفah', no_hp: '081299887766', email: 'sarah.humaira@pesantren.id', alamat: 'Gedung Asrama Putri 01', status: 'Aktif', tanggal_bergabung: '2022-08-01', bidang_keahlian: 'Tahfidz 30 Juz & Tajwid Jazariyah' },
          { id: 5, nama_asatidz: 'Usth. Siti Maryam', gelar: 'M.Ag.', nik_niy: 'AST-2021-003', jk: 'P', tugas_utama: 'Pengasuh Keputrian & Pengajar Sirah Nabawiyah', no_hp: '081322110099', email: 'siti.maryam@pesantren.id', alamat: 'Gedung Asrama Putri 02', status: 'Aktif', tanggal_bergabung: '2021-03-10', bidang_keahlian: 'Sirah Nabawiyah & Fiqih Wanita' },
          { id: 6, nama_asatidz: 'Ust. Bilal Mansur', gelar: 'S.Pd.I', nik_niy: 'AST-2024-012', jk: 'L', tugas_utama: 'Musyrif Disiplin & Pengasuh Santri Baru', no_hp: '087855667788', email: 'bilal.mansur@pesantren.id', alamat: 'Asrama Umar bin Khattab', status: 'Aktif', tanggal_bergabung: '2024-01-10', bidang_keahlian: 'Bimbingan Konseling Santri' }
        ]);
      }
    } catch (err) {
      console.error('Gagal mengambil data asatidz:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsatidz();
  }, []);

  const openDetail = (ast) => {
    setSelectedAsatidz(ast);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsatidz(null);
  };

  const countIkhwan = asatidzList.filter(a => a.jk === 'L').length;
  const countAkhwat = asatidzList.filter(a => a.jk === 'P').length;
  const countMusyrif = asatidzList.filter(a => a.tugas_utama?.toLowerCase().includes('musyrif') || a.tugas_utama?.toLowerCase().includes('asrama')).length;

  const filteredList = asatidzList.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = (
      a.nama_asatidz?.toLowerCase().includes(q) ||
      a.nik_niy?.toLowerCase().includes(q) ||
      a.tugas_utama?.toLowerCase().includes(q) ||
      a.bidang_keahlian?.toLowerCase().includes(q) ||
      a.no_hp?.includes(q)
    );

    const matchTab = 
      activeFilterTab === 'semua' ? true :
      activeFilterTab === 'ikhwan' ? a.jk === 'L' :
      activeFilterTab === 'akhwat' ? a.jk === 'P' :
      activeFilterTab === 'musyrif' ? (a.tugas_utama?.toLowerCase().includes('musyrif') || a.tugas_utama?.toLowerCase().includes('asrama')) : true;

    const matchGender = 
      filterGender === 'Semua Gender' ? true :
      filterGender === 'Ustadz' ? a.jk === 'L' :
      filterGender === 'Ustadzah' ? a.jk === 'P' : true;

    const matchStatus = filterStatus === 'Semua Status' ? true : a.status === filterStatus;

    return matchSearch && matchTab && matchGender && matchStatus;
  });

  return (
    <div>
      {/* 1. TOP 4 COLORED STATS CARDS */}
      <div className="top-stats-grid">
        <div className="stat-card-colored stat-card-blue">
          <div>
            <div className="stat-colored-title">TOTAL ASATIDZ & DEWAN GURU</div>
            <div className="stat-colored-number">{asatidzList.length || 6}</div>
          </div>
          <div className="stat-colored-icon-box">
            <GraduationCap size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-green">
          <div>
            <div className="stat-colored-title">ASATIDZ IKHWAN (USTADZ)</div>
            <div className="stat-colored-number">{countIkhwan || 4}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-purple">
          <div>
            <div className="stat-colored-title">USTADZAH (AKHWAT)</div>
            <div className="stat-colored-number">{countAkhwat || 2}</div>
          </div>
          <div className="stat-colored-icon-box">
            <Award size={22} />
          </div>
        </div>

        <div className="stat-card-colored stat-card-amber">
          <div>
            <div className="stat-colored-title">MUSYRIF ASRAMA & TAHFIDZ</div>
            <div className="stat-colored-number">{countMusyrif || 3}</div>
          </div>
          <div className="stat-colored-icon-box">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* 2. TITLE STRIP */}
      <div className="page-title-strip">
        <div className="page-title-left">
          <GraduationCap size={22} className="page-title-icon" style={{ color: '#0284c7' }} />
          <div>
            <h2>Data Master Asatidz, Ustadzah & Musyrif</h2>
            <p>Kelola data pendidik diniyah, pengampu halaqah tahfidz Qur'an, musyrif asrama, dan dewan pengasuh</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={fetchAsatidz}>
            <RotateCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary">
            <Plus size={14} /> Tambah Asatidz Baru
          </button>
        </div>
      </div>

      {/* 3. TAB FILTER BAR */}
      <div className="tab-filter-bar">
        <button 
          className={`tab-btn ${activeFilterTab === 'semua' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('semua')}
        >
          <GraduationCap size={14} /> Semua Asatidz ({asatidzList.length})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'ikhwan' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ikhwan')}
        >
          <Users size={14} /> Ustadz Ikhwan ({countIkhwan})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'akhwat' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('akhwat')}
        >
          <Award size={14} /> Ustadzah Akhwat ({countAkhwat})
        </button>
        <button 
          className={`tab-btn ${activeFilterTab === 'musyrif' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('musyrif')}
        >
          <ShieldCheck size={14} /> Musyrif Kobong & Pembina
        </button>
      </div>

      {/* 4. FILTER SEARCH BAR STRIP */}
      <div className="filter-search-box">
        <div className="filter-search-input">
          <Search size={15} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Cari nama asatidz, gelar, NIY, tugas utama, keahlian..." 
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
          <option>Ustadz</option>
          <option>Ustadzah</option>
        </select>
        <select 
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Cuti</option>
        </select>
      </div>

      {/* 5. DATA TABLE */}
      <div className="table-container-card">
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={24} className="animate-spin" /> Memuat data asatidz...
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="td-center" style={{ width: '45px' }}>NO</th>
                <th>NAMA ASATIDZ & GELAR</th>
                <th className="td-center">GENDER</th>
                <th>TUGAS UTAMA / AMANAH</th>
                <th>BIDANG KEAHLIAN / ILMU</th>
                <th>KONTAK WHATSAPP</th>
                <th className="td-center">STATUS</th>
                <th className="td-center" style={{ width: '90px' }}>DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((ast, idx) => (
                <tr key={ast.id || idx}>
                  <td className="td-center" style={{ fontWeight: 600, color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{ast.nama_asatidz}</div>
                    <div style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }}>Gelar: {ast.gelar || '-'} | NIY: {ast.nik_niy || '-'}</div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.jk === 'L' ? 'badge-info' : 'badge-purple'}`}>
                      {ast.jk === 'L' ? 'Ustadz (L)' : 'Ustadzah (P)'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#059669' }}>{ast.tugas_utama}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', color: '#334155' }}>{ast.bidang_keahlian || 'Kajian Kitab Diniyah'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0f172a' }}>
                      {ast.no_hp || '-'}
                    </div>
                  </td>
                  <td className="td-center">
                    <span className={`badge ${ast.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`}>
                      {ast.status}
                    </span>
                  </td>
                  <td className="td-center">
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => openDetail(ast)}
                      title="Lihat Detail Profil Asatidz"
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
      {/* MODAL DETAIL ASATIDZ                                */}
      {/* ==================================================== */}
      {isModalOpen && selectedAsatidz && (
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
                  <GraduationCap size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedAsatidz.nama_asatidz}, {selectedAsatidz.gelar}
                  </h3>
                  <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0 }}>
                    NIY / NIK: {selectedAsatidz.nik_niy}
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
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>TUGAS UTAMA / AMANAH</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#059669' }}>{selectedAsatidz.tugas_utama}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>STATUS KEPEGAWAIAN</div>
                  <span className="badge badge-success">
                    {selectedAsatidz.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>BIDANG ILMU / KEAHLIAN</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>{selectedAsatidz.bidang_keahlian || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>KONTAK WHATSAPP</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0284c7' }}>{selectedAsatidz.no_hp || '-'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Alamat & Informasi Domisili
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', fontSize: '0.76rem', color: '#334155' }}>
                  {selectedAsatidz.alamat || 'Komplek Perumahan Asatidz Pondok Pesantren'}
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
