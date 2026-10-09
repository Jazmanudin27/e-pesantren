import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle, 
  User, 
  Clock, 
  Tag, 
  ChevronRight, 
  X, 
  Save, 
  BookMarked,
  Sparkles,
  Layers
} from 'lucide-react';

const DEFAULT_KITAB_DATA = [
  {
    id: 1,
    judul: 'Fathul Qorib (Al-Ghayah wat Taqrib)',
    pengarang: 'Syaikh Ibnu Qosim Al-Ghazi',
    fan: 'Fiqih',
    asatidz: 'Ust. Hamdan S.Th.I',
    tingkat: 'Wustho',
    jadwal: "Ba'da Maghrib (Senin - Rabu)",
    bab_aktif: 'Bab Shalat Jamak & Qashar',
    jml_santri: 42,
    warna: '#059669'
  },
  {
    id: 2,
    judul: 'Matan Al-Ajurumiyyah',
    pengarang: 'Ibnu Ajurrum Ash-Shanhaji',
    fan: 'Nahwu / Shorof',
    asatidz: 'Ust. Muhammad Zaki, Lc.',
    tingkat: 'Ula (Tingkat Dasar)',
    jadwal: "Ba'da Subuh (Setiap Hari)",
    bab_aktif: "Bab I'rab & Tanda-tanda I'rab",
    jml_santri: 58,
    warna: '#2563eb'
  },
  {
    id: 3,
    judul: "Ta'limul Muta'allim Thoriqot Ta'allum",
    pengarang: 'Syaikh Az-Zarnuji',
    fan: 'Akhlaq & Adab',
    asatidz: 'Ust. Nurul Huda Al-Hafidz',
    tingkat: 'Semua Santri',
    jadwal: 'Malam Jumat (Aula Utama)',
    bab_aktif: 'Fasal Memilih Guru, Teman, & Keteguhan',
    jml_santri: 120,
    warna: '#d97706'
  },
  {
    id: 4,
    judul: 'Bulughul Maram Min Adillatil Ahkam',
    pengarang: 'Al-Hafizh Ibnu Hajar Al-Asqalani',
    fan: 'Hadits Ahkam',
    asatidz: 'Ust. Hamdan S.Th.I',
    tingkat: 'Wustho & Ulya',
    jadwal: "Ba'da Ashar (Selasa & Kamis)",
    bab_aktif: 'Kitab Thaharah - Bab Bejana & Air',
    jml_santri: 35,
    warna: '#7c3aed'
  },
  {
    id: 5,
    judul: 'Safinatun Najah fi Ushuliddin wal Fiqh',
    pengarang: 'Syaikh Salim bin Sumair Al-Hadhrami',
    fan: 'Fiqih',
    asatidz: 'Usth. Salma M.Pd',
    tingkat: 'Ula (Santri Putri)',
    jadwal: "Ba'da Ashar (Senin - Rabu)",
    bab_aktif: 'Pasal Rukun Islam & Rukun Iman',
    jml_santri: 48,
    warna: '#059669'
  },
  {
    id: 6,
    judul: 'Nadhom Al-Imrithi',
    pengarang: 'Syaikh Syarafuddin Yahya Al-Imrithi',
    fan: 'Nahwu / Shorof',
    asatidz: 'Ust. Muhammad Zaki, Lc.',
    tingkat: 'Wustho',
    jadwal: "Pukul 14.00 WIB (Sabtu - Ahad)",
    bab_aktif: 'Bab Kalam & Tanda-tanda Fiil',
    jml_santri: 28,
    warna: '#2563eb'
  },
  {
    id: 7,
    judul: 'Riyadhus Shalihin Min Kalami Sayyidil Mursalin',
    pengarang: 'Imam Abu Zakariya Yahya An-Nawawi',
    fan: 'Hadits & Targhib',
    asatidz: 'K.H. Nurul Wafa',
    tingkat: 'Umum & Santri Mukim',
    jadwal: 'Kajian Ahad Pagi (Masjid Jami)',
    bab_aktif: 'Bab Ikhlas & Menghadirkan Niat',
    jml_santri: 150,
    warna: '#e11d48'
  },
  {
    id: 8,
    judul: 'Tafsir Al-Jalalain',
    pengarang: 'Jalaluddin Al-Mahalli & Jalaluddin As-Suyuthi',
    fan: 'Tafsir',
    asatidz: 'Ust. Nurul Huda Al-Hafidz',
    tingkat: 'Ulya (Tingkat Tinggi)',
    jadwal: "Malam Rabu Ba'da Isya",
    bab_aktif: 'Surat Al-Baqarah Ayat 142 - 150',
    jml_santri: 24,
    warna: '#0d9488'
  }
];

export default function MobileKitab() {
  const [listKitab, setListKitab] = useState(() => {
    try {
      const saved = localStorage.getItem('pesantren_kitab_list');
      return saved ? JSON.parse(saved) : DEFAULT_KITAB_DATA;
    } catch (e) {
      return DEFAULT_KITAB_DATA;
    }
  });

  const [search, setSearch] = useState('');
  const [selectedFan, setSelectedFan] = useState('Semua');
  const [selectedKitab, setSelectedKitab] = useState(null);
  const [isModalAddOpen, setIsModalAddOpen] = useState(false);

  // Form tambah
  const [newJudul, setNewJudul] = useState('');
  const [newPengarang, setNewPengarang] = useState('');
  const [newFan, setNewFan] = useState('Fiqih');
  const [newAsatidz, setNewAsatidz] = useState('Ust. Hamdan S.Th.I');
  const [newTingkat, setNewTingkat] = useState('Wustho');
  const [newJadwal, setNewJadwal] = useState("Ba'da Maghrib");
  const [newBab, setNewBab] = useState('');

  const fans = ['Semua', 'Fiqih', 'Nahwu / Shorof', 'Hadits', 'Akhlaq & Adab', 'Tafsir'];

  const filtered = listKitab.filter(item => {
    const matchSearch = item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.asatidz.toLowerCase().includes(search.toLowerCase()) ||
      item.pengarang.toLowerCase().includes(search.toLowerCase());
    const matchFan = selectedFan === 'Semua' || item.fan.toLowerCase().includes(selectedFan.toLowerCase());
    return matchSearch && matchFan;
  });

  const handleSaveKitab = (e) => {
    e.preventDefault();
    if (!newJudul.trim()) return;

    const colors = {
      'Fiqih': '#059669',
      'Nahwu / Shorof': '#2563eb',
      'Hadits': '#7c3aed',
      'Akhlaq & Adab': '#d97706',
      'Tafsir': '#0d9488'
    };

    const newItem = {
      id: Date.now(),
      judul: newJudul,
      pengarang: newPengarang || 'Ulama Salaf',
      fan: newFan,
      asatidz: newAsatidz,
      tingkat: newTingkat,
      jadwal: newJadwal,
      bab_aktif: newBab || 'Muqaddimah Kitab',
      jml_santri: 30,
      warna: colors[newFan] || '#059669'
    };

    const updated = [newItem, ...listKitab];
    setListKitab(updated);
    try {
      localStorage.setItem('pesantren_kitab_list', JSON.stringify(updated));
    } catch (err) {}

    // Reset
    setNewJudul('');
    setNewPengarang('');
    setNewBab('');
    setIsModalAddOpen(false);
  };

  return (
    <div style={{
      padding: '16px',
      background: '#f8fafc',
      minHeight: '100%',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Banner Card */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%)',
        borderRadius: '20px',
        padding: '18px 16px',
        color: '#ffffff',
        marginBottom: '16px',
        boxShadow: '0 8px 24px -4px rgba(6, 78, 59, 0.35)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              letterSpacing: '0.04em'
            }}>
              KURIKULUM SALAFIYAH
            </span>
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
            Kajian Kitab Kuning
          </h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#d1fae5', lineHeight: 1.4 }}>
            Daftar kitab diniyah, mata pelajaran kepesantrenan, dan jadwal halaqah pengajian asatidz.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <div>
              <div style={{ fontSize: '1.18rem', fontWeight: 800 }}>{listKitab.length}</div>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>Total Kitab</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
            <div>
              <div style={{ fontSize: '1.18rem', fontWeight: 800 }}>6 Fan</div>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>Cabang Ilmu</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.25)' }} />
            <div>
              <div style={{ fontSize: '1.18rem', fontWeight: 800 }}>Aktif</div>
              <div style={{ fontSize: '0.68rem', color: '#a7f3d0' }}>Halaqah Rutin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip: Search + Tambah */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#ffffff',
          borderRadius: '14px',
          padding: '0 12px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}>
          <Search size={17} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cari kitab atau asatidz..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.85rem',
              padding: '10px 0',
              background: 'transparent'
            }}
          />
          {search && (
            <X size={15} color="#94a3b8" onClick={() => setSearch('')} style={{ cursor: 'pointer' }} />
          )}
        </div>

        <button
          onClick={() => setIsModalAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
          }}
        >
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </div>

      {/* Category Pills */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '12px',
        scrollbarWidth: 'none'
      }}>
        {fans.map((fan) => {
          const isActive = selectedFan === fan;
          return (
            <button
              key={fan}
              onClick={() => setSelectedFan(fan)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                background: isActive ? '#064e3b' : '#ffffff',
                color: isActive ? '#ffffff' : '#64748b',
                boxShadow: isActive ? '0 4px 10px rgba(6, 78, 59, 0.25)' : '0 1px 3px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {fan}
            </button>
          );
        })}
      </div>

      {/* Kitab Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedKitab(item)}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '14px',
              border: '1.5px solid #f1f5f9',
              boxShadow: '0 3px 10px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'transform 0.12s ease'
            }}
          >
            {/* Top row: badge fan & tingkat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: `${item.warna}15`,
                color: item.warna,
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Tag size={11} />
                {item.fan}
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                {item.tingkat}
              </span>
            </div>

            {/* Title */}
            <div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                {item.judul}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                Karya: {item.pengarang}
              </div>
            </div>

            {/* Bab yang sedang dibahas */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '10px',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: '#334155',
              border: '1px dashed #cbd5e1'
            }}>
              <BookOpen size={13} color="#059669" />
              <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.bab_aktif}
              </span>
            </div>

            {/* Bottom info: Asatidz & Jadwal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: '1px solid #f8fafc',
              fontSize: '0.74rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1e293b', fontWeight: 700 }}>
                <User size={13} color="#64748b" />
                <span>{item.asatidz}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontWeight: 500 }}>
                <Clock size={12} />
                <span>{item.jadwal.split('(')[0]}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '36px 16px',
            background: '#ffffff',
            borderRadius: '18px',
            color: '#94a3b8'
          }}>
            <BookMarked size={42} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#475569' }}>Kitab Tidak Ditemukan</div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Coba ubah kata kunci pencarian atau kategori fan.</div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL KITAB */}
      {selectedKitab && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '480px',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '20px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{
                background: `${selectedKitab.warna}15`,
                color: selectedKitab.warna,
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px'
              }}>
                {selectedKitab.fan} • {selectedKitab.tingkat}
              </span>
              <button
                onClick={() => setSelectedKitab(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <h3 style={{ margin: '0 0 6px', fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
              {selectedKitab.judul}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748b' }}>
              Pengarang: <strong style={{ color: '#334155' }}>{selectedKitab.pengarang}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>USTADZ PENGAMPU</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedKitab.asatidz}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>JADWAL & TEMPAT HALAQAH</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedKitab.jadwal}
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>MATERI / BAB AKTIF SAAT INI</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#064e3b', marginTop: '2px' }}>
                  {selectedKitab.bab_aktif}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>SANTRI TERDAFTAR</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {selectedKitab.jml_santri} Santri Mengikuti
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedKitab(null)}
              style={{
                width: '100%',
                background: '#064e3b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KITAB */}
      {isModalAddOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <form
            onSubmit={handleSaveKitab}
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '480px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '20px',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Tambah Kitab Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsModalAddOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Nama / Judul Kitab *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Fathul Qarib"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Pengarang / Muallif
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Syaikh Ibnu Qasim Al-Ghazi"
                  value={newPengarang}
                  onChange={(e) => setNewPengarang(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Fan / Bidang Ilmu
                  </label>
                  <select
                    value={newFan}
                    onChange={(e) => setNewFan(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Fiqih">Fiqih</option>
                    <option value="Nahwu / Shorof">Nahwu / Shorof</option>
                    <option value="Hadits">Hadits</option>
                    <option value="Akhlaq & Adab">Akhlaq & Adab</option>
                    <option value="Tafsir">Tafsir</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Jenjang / Tingkat
                  </label>
                  <select
                    value={newTingkat}
                    onChange={(e) => setNewTingkat(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.82rem',
                      background: '#ffffff'
                    }}
                  >
                    <option value="Ula (Dasar)">Ula (Dasar)</option>
                    <option value="Wustho">Wustho</option>
                    <option value="Ulya (Tinggi)">Ulya (Tinggi)</option>
                    <option value="Semua Tingkat">Semua Tingkat</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Ustadz Pengampu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ust. Hamdan S.Th.I"
                  value={newAsatidz}
                  onChange={(e) => setNewAsatidz(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Jadwal Halaqah
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ba'da Maghrib (Senin - Rabu)"
                  value={newJadwal}
                  onChange={(e) => setNewJadwal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Bab / Pasal Yang Sedang Dikaji
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bab Shalat Jamak & Qashar"
                  value={newBab}
                  onChange={(e) => setNewBab(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsModalAddOpen(false)}
                style={{
                  flex: 1,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Save size={16} />
                <span>Simpan Kitab</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
