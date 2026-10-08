import React from 'react';
import { 
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
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function MobileHome({ onChangeTab }) {
  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Mobile Header Card / Kartu Ustadz & Pengurus */}
      <div className="mobile-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600 }}>Assalamu'alaikum,</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ust. Ahmad Fauzi, S.Pd.I</div>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', color: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid rgba(255,255,255,0.4)' }}>
            AF
          </div>
        </div>

        {/* Digital Ustadz/Admin Card */}
        <div className="santri-digital-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Portal Asatidz & Pengurus Pesantren
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '2px' }}>
                NIP: AST-2024-001 • Musyrif & Pengajar
              </div>
            </div>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
              Aktif
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Binaan Halaqah & Kobong</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fef08a' }}>18 Santri Tahfidz</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#34d399" /> Admin / Guru
            </div>
          </div>
        </div>
      </div>

      {/* KATEGORI 1: DATA MASTER */}
      <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          DATA MASTER
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '18px' }}>
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
      </div>

      {/* KATEGORI 2: TRANSAKSI */}
      <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          TRANSAKSI
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '18px' }}>
        <button className="quick-menu-item" onClick={() => onChangeTab('presensi')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Fingerprint size={22} />
          </div>
          <span>Absensi</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('perizinan')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <DoorOpen size={22} />
          </div>
          <span>Perizinan</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('tahfidz')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <BookOpen size={22} />
          </div>
          <span>Setoran Hafidz</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('master-device')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}>
            <HardDrive size={22} />
          </div>
          <span>Fingerprint</span>
        </button>
      </div>

      {/* KATEGORI 3: LAPORAN & TATA TERTIB */}
      <div style={{ padding: '0 16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          LAPORAN
        </div>
      </div>

      <div className="quick-menu-grid" style={{ marginBottom: '18px' }}>
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
          <span>Lap. Tahfidz</span>
        </button>

        <button className="quick-menu-item" onClick={() => onChangeTab('tata-tertib')}>
          <div className="quick-icon-wrap" style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)' }}>
            <ShieldAlert size={22} />
          </div>
          <span>Ta'zir Santri</span>
        </button>
      </div>

      {/* Ringkasan Setoran Tahfidz Binaan */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
              <Sparkles size={16} color="#059669" /> Ringkasan Setoran Tahfidz Binaan
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>Halaqah Al-Jazari</span>
          </div>
          
          <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '999px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(90deg, #059669, #10b981)', width: '78%', height: '100%' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
            <span>Total Santri Setoran Hari Ini: <strong>14 / 18 Santri</strong></span>
            <span style={{ color: '#059669', fontWeight: 700 }}>78% Selesai</span>
          </div>
        </div>
      </div>
    </div>
  );
}
