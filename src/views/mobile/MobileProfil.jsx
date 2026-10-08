import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Award, 
  BookOpen, 
  Building2, 
  LogOut, 
  Lock, 
  HelpCircle, 
  Info,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function MobileProfil({ onChangeTab, onLogout }) {
  const sessionData = (() => {
    try {
      return JSON.parse(localStorage.getItem('mobile_session') || '{}');
    } catch (e) {
      return {};
    }
  })();

  const namaAsrama = sessionData.nama_asrama || 'Asrama Ali bin Abi Thalib';
  const pembina = sessionData.pembina || 'Ust. Ahmad Fauzi, S.Pd.I';
  const username = sessionData.username || 'asrama_ali';

  const handleLogoutClick = () => {
    localStorage.removeItem('mobile_session');
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '24px' }}>
      {/* Profile Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '20px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 800,
            border: '3px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {namaAsrama.slice(7, 9).toUpperCase() || 'AS'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, marginBottom: '4px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
              <UserCheck size={12} /> Akun Asrama Active
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
              {namaAsrama}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Pembina: {pembina} • User: {username}
            </div>
          </div>
        </div>

        {/* Notice for Mobile Access Rule */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '10px 12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          fontSize: '0.73rem',
          color: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={18} color="#34d399" style={{ flexShrink: 0 }} />
          <span>Akses Portal Mobile khusus Asatidz & Pengurus. Akun Santri tidak dapat diakses dari mobile.</span>
        </div>
      </div>

      {/* Account Info Details */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.04em' }}>
          Informasi Kepegawaian & Tugas
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Jabatan & Role</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Musyrif Kobong & Guru Tahfidz</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Halaqah & Kobong Binaan</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Halaqah Al-Jazari • Kobong Umar 02</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>No. WhatsApp / HP</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>+62 812-3456-7890</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Menu */}
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '8px 16px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: '12px 0 8px', letterSpacing: '0.04em' }}>
          Pengaturan Akun & Keamanan
        </div>

        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', border: 'none', background: 'transparent', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={18} color="#64748b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Ubah Password Akun</span>
          </div>
          <ChevronRight size={16} color="#94a3b8" />
        </button>

        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', border: 'none', background: 'transparent', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="#64748b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Hak Akses Admin / User</span>
          </div>
          <ChevronRight size={16} color="#94a3b8" />
        </button>

        <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={18} color="#64748b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Tentang E-Pesantren v2.4</span>
          </div>
          <ChevronRight size={16} color="#94a3b8" />
        </button>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogoutClick}
        style={{
          width: '100%',
          background: '#ffe4e6',
          border: '1px solid #fecdd3',
          color: '#e11d48',
          padding: '12px',
          borderRadius: '14px',
          fontSize: '0.88rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(225, 29, 72, 0.1)'
        }}
      >
        <LogOut size={18} /> Keluar dari Akun Mobile
      </button>
    </div>
  );
}
