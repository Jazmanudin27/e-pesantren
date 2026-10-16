import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  BookOpen, 
  DoorOpen, 
  ShieldAlert, 
  CalendarCheck, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Key, 
  User, 
  Phone, 
  Home, 
  Award, 
  Clock, 
  FileText, 
  Sparkles, 
  Save, 
  Eye, 
  EyeOff, 
  Building, 
  Calendar,
  Lock,
  ChevronRight,
  Fingerprint,
  QrCode
} from 'lucide-react';
import { showConfirm, toastSuccess, showError } from '../../utils/alert.util';

export default function PortalWaliSantri({ onLogout, customSantriId }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [data, setData] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [selectedSantriId, setSelectedSantriId] = useState(() => {
    try {
      const sess = JSON.parse(localStorage.getItem('desktop_session') || localStorage.getItem('mobile_session') || '{}');
      return customSantriId || sess.santri_id || sess.id || null;
    } catch (e) {
      return customSantriId || null;
    }
  });

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    username_baru: '',
    password_baru: '',
    konfirmasi_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Ambil data monitoring wali santri
  const fetchWaliData = async (targetId = selectedSantriId) => {
    try {
      setLoading(true);
      const url = targetId ? `/api/wali/santri?santri_id=${targetId}` : '/api/wali/santri';
      const res = await axios.get(url);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        if (res.data.data.santri?.id) {
          setSelectedSantriId(res.data.data.santri.id);
          setPasswordForm(prev => ({
            ...prev,
            username_baru: res.data.data.santri.username || res.data.data.santri.nis || ''
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data portal wali:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ambil daftar santri jika wali ingin berganti santri (misal wali punya lebih dari 1 anak)
  const fetchSantriList = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSantriList(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchWaliData();
    fetchSantriList();
  }, []);

  const handleSantriChange = (newId) => {
    setSelectedSantriId(newId);
    fetchWaliData(newId);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.password_baru) {
      showError('Validasi Gagal', 'Password baru wajib diisi.');
      return;
    }
    if (passwordForm.password_baru.length < 4) {
      showError('Validasi Gagal', 'Password minimal 4 karakter.');
      return;
    }
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      showError('Validasi Gagal', 'Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await axios.put('/api/wali/password', {
        santri_id: selectedSantriId,
        password_baru: passwordForm.password_baru,
        username_baru: passwordForm.username_baru
      });
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Kredensial login akun orang tua santri berhasil disimpan.');
        setPasswordForm({
          username_baru: passwordForm.username_baru,
          password_baru: '',
          konfirmasi_password: ''
        });
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengubah password');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleLogoutAction = () => {
    showConfirm('Keluar Akun?', 'Apakah Bapak/Ibu ingin keluar dari Portal Orang Tua Santri?', () => {
      localStorage.removeItem('desktop_session');
      localStorage.removeItem('mobile_session');
      sessionStorage.removeItem('desktop_session');
      if (onLogout) {
        onLogout();
      } else {
        window.location.hash = '#login';
        window.location.reload();
      }
    });
  };

  const santri = data?.santri || {};
  const tahfidz = data?.tahfidzSetoran || [];
  const praktek = data?.praktekIbadah || [];
  const presensi = data?.presensiJamaah || [];
  const perizinan = data?.perizinan || [];
  const pelanggaran = data?.pelanggaran || [];
  const stats = data?.statistik || {};

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'inherit' }}>
      
      {/* ==================================================== */}
      {/* 1. TOP NAVBAR ORANG TUA SANTRI                      */}
      {/* ==================================================== */}
      <header style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: '#ffffff',
        padding: '14px 24px',
        boxShadow: '0 4px 16px rgba(6, 78, 59, 0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <img src="/logo-pesantren.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <BookOpen size={22} color="#059669" />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Portal Orang Tua Santri</span>
                <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  WALI SANTRI
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#a7f3d0' }}>
                Pondok Pesantren Nurul Wafa Tasikmalaya
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {santriList.length > 1 && (
              <select
                value={selectedSantriId || ''}
                onChange={(e) => handleSantriChange(Number(e.target.value))}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id} style={{ color: '#0f172a' }}>
                    Santri: {s.nama_santri} (NIS: {s.nis})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => fetchWaliData(selectedSantriId)}
              title="Perbarui Data"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Segarkan</span>
            </button>

            <button
              onClick={handleLogoutAction}
              title="Keluar Akun"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              <span>Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* ==================================================== */}
      {/* 2. MAIN CONTAINER & HERO PROFILE                     */}
      {/* ==================================================== */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Hero Card Biodata Santri */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '22px 26px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
          marginBottom: '20px',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
                flexShrink: 0
              }}>
                {(santri.nama_santri || 'S').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  {santri.nama_santri || 'Memuat Data Santri...'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>NIS: <strong style={{ color: '#34d399' }}>{santri.nis || '-'}</strong></span>
                  <span>•</span>
                  <span>Kode: <strong>{santri.kode_santri || '-'}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{santri.jk === 'P' ? 'Akhwat (Putri)' : 'Ikhwan (Putra)'}</strong></span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
                  Orang Tua / Wali: <strong style={{ color: '#38bdf8' }}>{santri.nama_wali || 'Wali Santri'}</strong> ({santri.hubungan_wali || 'Orang Tua'})
                </div>
              </div>
            </div>

            {/* Asrama & Status Badge */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <span className={`badge ${santri.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
                Status: {santri.status || 'Aktif'} ({santri.status_santri || 'Mukim'})
              </span>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Kobong: <strong style={{ color: '#ffffff' }}>{santri.nama_asrama || 'Asrama'}</strong> - {santri.nama_kamar || 'Kamar'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Pembina: {santri.pembina_asrama || 'Ust. Pembina Kobong'}
              </div>
            </div>

          </div>
        </div>

        {/* 4 Colored Stat Cards */}
        <div className="top-stats-grid" style={{ marginBottom: '22px' }}>
          
          {/* Card 1: Tahfidz */}
          <div className="stat-card-colored stat-card-blue">
            <div>
              <div className="stat-colored-title">CAPAIAN TAHFIDZ QUR'AN</div>
              <div className="stat-colored-number">{santri.capaian_hafalan_juz || 0} Juz</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                {stats.totalSetoran || 0} Riwayat Setoran Tercatat
              </div>
            </div>
            <div className="stat-colored-icon-box">
              <Award size={24} />
            </div>
          </div>

          {/* Card 2: Praktek Ibadah */}
          <div className="stat-card-colored stat-card-green">
            <div>
              <div className="stat-colored-title">PRAKTEK IBADAH LULUS</div>
              <div className="stat-colored-number">{stats.totalPraktekLulus || 0} Bidang</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                {stats.totalPraktekMengulang > 0 ? `${stats.totalPraktekMengulang} Perlu Remedial` : 'Semua Kompetensi Tuntas'}
              </div>
            </div>
            <div className="stat-colored-icon-box">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Card 3: Kehadiran Jamaah */}
          <div className="stat-card-colored stat-card-amber">
            <div>
              <div className="stat-colored-title">LOG SHOLAT & MENGAJI</div>
              <div className="stat-colored-number">{presensi.length} Sesi</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                Monitoring Fingerprint Masjid
              </div>
            </div>
            <div className="stat-colored-icon-box">
              <Fingerprint size={24} />
            </div>
          </div>

          {/* Card 4: Perizinan */}
          <div className="stat-card-colored stat-card-purple">
            <div>
              <div className="stat-colored-title">STATUS KEDISIPLINAN & IZIN</div>
              <div className="stat-colored-number">
                {stats.izinAktif ? 'Izin Aktif' : 'Di Pondok'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                {stats.totalPelanggaran > 0 ? `${stats.totalPelanggaran} Catatan Kedisiplinan` : 'Tertib & Disiplin'}
              </div>
            </div>
            <div className="stat-colored-icon-box">
              <DoorOpen size={24} />
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* 3. TAB FILTER NAVIGATION                             */}
        {/* ==================================================== */}
        <div className="tab-filter-bar" style={{ marginBottom: '18px' }}>
          <button 
            className={`tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
            onClick={() => setActiveTab('ringkasan')}
          >
            <User size={14} /> Ringkasan & Profil
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tahfidz' ? 'active' : ''}`}
            onClick={() => setActiveTab('tahfidz')}
          >
            <BookOpen size={14} /> Tahfidz Qur'an ({tahfidz.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'praktek' ? 'active' : ''}`}
            onClick={() => setActiveTab('praktek')}
          >
            <CheckCircle2 size={14} /> Ujian Praktek Ibadah ({praktek.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'presensi' ? 'active' : ''}`}
            onClick={() => setActiveTab('presensi')}
          >
            <Fingerprint size={14} /> Presensi & Sholat ({presensi.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'perizinan' ? 'active' : ''}`}
            onClick={() => setActiveTab('perizinan')}
          >
            <DoorOpen size={14} /> Izin Pulang ({perizinan.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'disiplin' ? 'active' : ''}`}
            onClick={() => setActiveTab('disiplin')}
          >
            <ShieldAlert size={14} /> Catatan Disiplin ({pelanggaran.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'keamanan' ? 'active' : ''}`}
            onClick={() => setActiveTab('keamanan')}
          >
            <Key size={14} /> Pengaturan Akun Wali
          </button>
        </div>

        {/* ==================================================== */}
        {/* 4. TAB CONTENTS                                      */}
        {/* ==================================================== */}

        {/* TAB 1: RINGKASAN & BIODATA */}
        {activeTab === 'ringkasan' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            
            {/* Info Kobong & Asrama */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Home size={15} /> Penempatan Asrama & Kamar Kobong
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Nama Asrama:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{santri.nama_asrama || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Kamar Kobong:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{santri.nama_kamar || '-'} ({santri.kode_kamar || 'Kamar 01'})</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Asatidz Pembina Kobong:</span>
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>{santri.pembina_asrama || 'Ust. Pembina'}</div>
                  {santri.no_hp_pembina && santri.no_hp_pembina !== '-' && (
                    <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: '2px' }}>
                      Kontak: {santri.no_hp_pembina}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info Akademik & Diniyah */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={15} /> Capaian Diniyah & Tahfidz
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Tingkat Diniyah:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{santri.tingkat_diniyah || 'Wustho (Tingkat Menengah)'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Capaian Hafalan:</span>
                  <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.05rem' }}>{santri.capaian_hafalan_juz || 0} Juz Al-Qur'an</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Tahun Masuk:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Tahun Ajaran {santri.tahun_masuk || '2026/2027'}</div>
                </div>
              </div>
            </div>

            {/* Info Data Wali & Mahrom */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} /> Data Mahrom & Wali Santri
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Nama Orang Tua / Wali:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{santri.nama_wali || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Nomor WhatsApp Terdaftar:</span>
                  <div style={{ fontWeight: 700, color: '#059669' }}>{santri.no_wa_wali || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Alamat Asal / Rumah:</span>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{santri.alamat_asal || 'Tasikmalaya, Jawa Barat'}</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: TAHFIDZ AL-QUR'AN */}
        {activeTab === 'tahfidz' && (
          <div className="table-container-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>Riwayat Mutaba'ah & Setoran Tahfidz Qur'an</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Catatan harian ziyadah, sabqi, dan muroja'ah santri bersama asatidz</p>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.76rem' }}>
                Total Capaian: {santri.capaian_hafalan_juz || 0} Juz
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>TANGGAL SETORAN</th>
                  <th>JENIS SETORAN</th>
                  <th>JUZ & SURAT / AYAT</th>
                  <th className="td-center">NILAI / KELANCARAN</th>
                  <th>ASATIDZ PENYIMAK</th>
                  <th>CATATAN TAJWID & MAKHRAJ</th>
                </tr>
              </thead>
              <tbody>
                {tahfidz.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Belum ada catatan setoran tahfidz untuk santri ini.
                    </td>
                  </tr>
                ) : (
                  tahfidz.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {row.tanggal ? String(row.tanggal).split('T')[0] : '-'}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {row.jenis_setoran || 'Ziyadah'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0284c7' }}>Juz {row.juz || 1}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {row.surat_mulai || 'Surat Al-Baqarah'} s/d {row.surat_selesai || '-'}
                        </div>
                      </td>
                      <td className="td-center">
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          {row.nilai_akhir ? `Nilai: ${row.nilai_akhir}` : (row.predikat || 'Mumtaz')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.nama_penyimak || 'Ust. Pembina Tahfidz'}</div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                          {row.catatan || 'Bacaan lancar, tajwid tartil dan makhraj fasih.'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: UJIAN PRAKTEK IBADAH */}
        {activeTab === 'praktek' && (
          <div className="table-container-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>Ujian Praktek Ibadah Amaliyah Santri</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Hasil evaluasi sholat lima waktu, wudhu/tayammum, sholat jenazah, dan adzan</p>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>KATEGORI PRAKTEK</th>
                  <th>DESKRIPSI & EVALUASI</th>
                  <th>PENGUJI & TANGGAL</th>
                  <th className="td-center">STATUS KELULUSAN</th>
                </tr>
              </thead>
              <tbody>
                {praktek.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Belum ada data evaluasi ujian praktek ibadah santri.
                    </td>
                  </tr>
                ) : (
                  praktek.map((row, idx) => {
                    const isLulus = row.status === 'Lulus';
                    return (
                      <tr key={row.id || idx}>
                        <td className="td-center">{idx + 1}</td>
                        <td>
                          <span className="badge badge-purple" style={{ fontWeight: 700, fontSize: '0.78rem' }}>
                            {row.kategori || row.nama_praktek}
                          </span>
                        </td>
                        <td style={{ maxWidth: '340px' }}>
                          <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>
                            {row.deskripsi || row.catatan_perbaikan || 'Sesuai tata cara dan kaifiyah yang diajarkan di pondok.'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.nama_penguji || 'Ust. Penguji'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {row.tanggal_ujian ? String(row.tanggal_ujian).split('T')[0] : '-'}
                          </div>
                        </td>
                        <td className="td-center">
                          <span className={`badge ${isLulus ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                            {isLulus ? <CheckCircle2 size={13} /> : <RotateCw size={13} />}
                            {isLulus ? 'LULUS' : 'MENGULANG'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PRESENSI FINGERPRINT */}
        {activeTab === 'presensi' && (
          <div className="table-container-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>Presensi Sholat Berjamaah & Taklim Mengaji</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Rekam kehadiran harian mesin fingerprint santri di masjid pondok</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>TANGGAL & WAKTU SCAN</th>
                  <th>SESI KEGIATAN</th>
                  <th>KATEGORI</th>
                  <th className="td-center">STATUS KEHADIRAN</th>
                  <th>METODE</th>
                </tr>
              </thead>
              <tbody>
                {presensi.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Belum ada data scan presensi untuk santri ini.
                    </td>
                  </tr>
                ) : (
                  presensi.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {row.tanggal ? String(row.tanggal).split('T')[0] : '-'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                          Jam: {row.waktu_scan || 'Tepat Waktu'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.nama_sesi || 'Shalat Shubuh Berjamaah'}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{row.kategori_sesi || 'Shalat Berjamaah'}</span>
                      </td>
                      <td className="td-center">
                        <span className={`badge ${String(row.status).includes('Hadir') ? 'badge-success' : 'badge-warning'}`}>
                          {row.status || 'Hadir Tepat Waktu'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {row.metode_presensi || 'Fingerprint Masjid'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: PERIZINAN SANTRI */}
        {activeTab === 'perizinan' && (
          <div className="table-container-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>Riwayat Surat Izin Pulang & Keluar Pondok</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Monitoring kepulangan, jadwal rencana keluar vs kembali ke pondok</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>KODE & JENIS IZIN</th>
                  <th>JADWAL KELUAR RENCANA</th>
                  <th>JADWAL KEMBALI RENCANA</th>
                  <th>KEPERLUAN</th>
                  <th className="td-center">STATUS PERIZINAN</th>
                </tr>
              </thead>
              <tbody>
                {perizinan.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Santri belum pernah mengajukan izin keluar pondok.
                    </td>
                  </tr>
                ) : (
                  perizinan.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0284c7' }}>{row.kode_izin || 'IZN-001'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{row.jenis_izin || 'Izin Pulang'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                          {row.tgl_keluar_rencana ? String(row.tgl_keluar_rencana).replace('T', ' ').slice(0, 16) : '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                          {row.tgl_kembali_rencana ? String(row.tgl_kembali_rencana).replace('T', ' ').slice(0, 16) : '-'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.76rem', color: '#475569' }}>{row.keperluan || '-'}</div>
                      </td>
                      <td className="td-center">
                        <span className={`badge ${row.status === 'Kembali Tepat Waktu' ? 'badge-success' : (row.status === 'Aktif Keluar' ? 'badge-warning' : 'badge-info')}`}>
                          {row.status || 'Disetujui'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: DISIPLIN & TA'ZIR */}
        {activeTab === 'disiplin' && (
          <div className="table-container-card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800 }}>Catatan Kedisiplinan & Bimbingan Ta'zir</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>Perekaman pembinaan disiplin santri di lingkungan asrama dan madrasah</p>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="td-center" style={{ width: '40px' }}>NO</th>
                  <th>TANGGAL</th>
                  <th>KATEGORI</th>
                  <th>BENTUK TA'ZIR MENDIDIK</th>
                  <th className="td-center">STATUS</th>
                  <th>MUSYRIF PENCATAT</th>
                </tr>
              </thead>
              <tbody>
                {pelanggaran.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#059669', fontWeight: 700 }}>
                      Alhamdulillah! Santri memiliki catatan kedisiplinan yang bersih tanpa sanksi ta'zir.
                    </td>
                  </tr>
                ) : (
                  pelanggaran.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td className="td-center">{idx + 1}</td>
                      <td>{row.tanggal ? String(row.tanggal).split('T')[0] : '-'}</td>
                      <td>
                        <span className={`badge ${row.kategori === 'Berat' ? 'badge-danger' : 'badge-warning'}`}>
                          {row.kategori || 'Ringan'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                          {row.bentuk_tazir || 'Membaca Al-Qur\'an 1 Juz di Masjid'}
                        </div>
                      </td>
                      <td className="td-center">
                        <span className={`badge ${row.status_tazir === 'Selesai Ta\'zir' ? 'badge-success' : 'badge-warning'}`}>
                          {row.status_tazir || 'Selesai'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{row.musyrif_pencatat || 'Musyrif Keamanan'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 7: PENGATURAN AKUN WALI (UBAH PASSWORD) */}
        {activeTab === 'keamanan' && (
          <div style={{ maxWidth: '540px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Keamanan Akun Orang Tua
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Ubah username dan password untuk login ke portal orang tua
                </p>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
              📌 <strong>Informasi Kredensial:</strong><br />
              Username dan password default orang tua diambil dari data santri (default: <strong>Nomor Induk Santri / NIS</strong>). Bapak/Ibu dapat mengubahnya kapan saja di bawah ini.
            </div>

            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Username Akun Orang Tua
                </label>
                <input
                  type="text"
                  value={passwordForm.username_baru}
                  onChange={(e) => setPasswordForm({ ...passwordForm, username_baru: e.target.value })}
                  placeholder="Contoh: NIS atau username wali"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Password Baru
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passwordForm.password_baru}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                    placeholder="Masukkan password baru (min 4 karakter)"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      paddingRight: '40px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwordForm.konfirmasi_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                  placeholder="Ulangi password baru"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={updatingPass}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Save size={16} />
                {updatingPass ? 'Menyimpan...' : 'Simpan Kredensial Akun Orang Tua'}
              </button>
            </form>
          </div>
        )}

      </main>

    </div>
  );
}
