import React from 'react';
import { 
  LayoutDashboard,
  Fingerprint,
  BookOpen, 
  DoorOpen, 
  Users,
  Building,
  GraduationCap,
  ShieldAlert,
  HardDrive,
  BarChart3,
  FileText,
  Wallet,
  QrCode, 
  Sparkles,
  CalendarCheck,
  Grid,
  ChevronRight
} from 'lucide-react';

export default function MobileHome({ onChangeTab }) {
  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Mobile Header Card / Kartu Santri */}
      <div className="mobile-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>Assalamu'alaikum,</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ahmad Faiz Al-Hafidz</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', color: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            AF
          </div>
        </div>

        {/* Digital ID Card */}
        <div className="santri-digital-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#e2e8f0', textTransform: 'uppercase' }}>Kartu Santri Digital</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>NIS: 2601001 • Ali bin Abi Thalib / 04</div>
            </div>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}>
              Mukim
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Saldo Kartu Uang Saku</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fef08a' }}>Rp 350.000</div>
            </div>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <QrCode size={14} /> Scan Barcode
            </button>
          </div>
        </div>
      </div>

      {/* Main Menu Grid 1: Fitur & Modul Utama */}
      <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          MAIN MENU & KEPESANTRENAN
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '16px' }}>
        <button className="quick-menu-item" onClick={() => onChangeTab('dashboard')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <LayoutDashboard size={22} />
          </div>
          <span>Dashboard</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('presensi')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Fingerprint size={22} />
          </div>
          <span>Presensi</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('tahfidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <BookOpen size={22} />
          </div>
          <span>Tahfidz</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('perizinan')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <DoorOpen size={22} />
          </div>
          <span>Perizinan</span>
        </button>
      </div>

      {/* Main Menu Grid 2: Data Master */}
      <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          DATA MASTER SISTEM
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '16px' }}>
        <button className="quick-menu-item" onClick={() => onChangeTab('master-santri')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            <Users size={22} />
          </div>
          <span>Data Santri</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('master-asrama')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <Building size={22} />
          </div>
          <span>Data Asrama</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('master-kelas')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
            <GraduationCap size={22} />
          </div>
          <span>Data Kelas</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('master-asatidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #9333ea, #7e22ce)' }}>
            <Users size={22} />
          </div>
          <span>Data Asatidz</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('master-device')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}>
            <HardDrive size={22} />
          </div>
          <span>Fingerprint</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('tata-tertib')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
            <ShieldAlert size={22} />
          </div>
          <span>Tata Tertib</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('laporan-presensi')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #f97316, #c2410c)' }}>
            <BarChart3 size={22} />
          </div>
          <span>Rekap Absen</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('laporan-tahfidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #0284c7, #0284c7)' }}>
            <FileText size={22} />
          </div>
          <span>Laporan Tahfidz</span>
        </button>
      </div>

      {/* Target Tahfidz Hari Ini */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
              <Sparkles size={16} color="#059669" /> Progress Tahfidz Qur'an
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669' }}>15 / 30 Juz</span>
          </div>
          
          <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(90deg, #059669, #10b981)', width: '50%', height: '100%' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
            <span>Setoran Terakhir: <strong>QS. Al-Isra': 25</strong></span>
            <span style={{ color: '#059669', fontWeight: 700 }}>Mumtaz (A)</span>
          </div>
        </div>
      </div>

      {/* Jadwal Sholat & Kajian Kitab Hari Ini */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px' }}>
            📖 Jadwal Pengajian Kitab Kuning Hari Ini
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
              16:30 WIB
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Fathul Qorib (Bab Sholat)</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>KH. Ahmad Dahlan • Masjid Utama</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
              20:00 WIB
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Ta'lim Muta'allim (Adab Santri)</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Ust. Hamdan S.Th.I • Aula Asrama</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
