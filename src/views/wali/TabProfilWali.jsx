import React from 'react';
import { 
  ArrowLeft, 
  LogOut, 
  User, 
  Building, 
  MessageCircle, 
  GraduationCap, 
  UserCheck, 
  Phone, 
  Key, 
  Eye, 
  EyeOff, 
  Save 
} from 'lucide-react';

const infoCardBox = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
};

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.78rem',
  gap: '8px'
};

const infoLabel = {
  color: '#64748b',
  fontWeight: 500
};

const infoValue = {
  color: '#0f172a',
  fontWeight: 700,
  textAlign: 'right'
};

const inputFieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.82rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const cleanDbValue = (val, blacklist = []) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined') return '';
  const lower = str.toLowerCase();
  if (
    lower === 'pondok pesantren nurul wafa' ||
    lower === 'pp nurul wafa' ||
    lower === 'pp. nurul wafa' ||
    blacklist.some((b) => lower === String(b).toLowerCase())
  ) {
    return '';
  }
  return str;
};

const TabProfilWali = ({
  santri = {},
  rawSantriName = '',
  displayNisn = '',
  initial = 'S',
  profileSection = 'semua',
  setProfileSection,
  asatidzList = [],
  passwordForm = {},
  setPasswordForm,
  showPass = false,
  setShowPass,
  updatingPass = false,
  handleUpdatePassword,
  handleLogoutAction,
  onBack
}) => {
  const dbNama = cleanDbValue(santri.nama_santri) || cleanDbValue(rawSantriName);
  const dbNisn = cleanDbValue(santri.nisn) || cleanDbValue(santri.nis) || cleanDbValue(displayNisn);
  const dbJk = cleanDbValue(santri.jk);
  const dbStatusAktif = cleanDbValue(santri.status);
  const dbStatusSantri = cleanDbValue(santri.status_santri);
  const dbTahunMasuk = cleanDbValue(santri.tahun_masuk);
  const dbTempatLahir = cleanDbValue(santri.tempat_lahir);
  const dbTglLahir = cleanDbValue(
    santri.tgl_lahir ? String(santri.tgl_lahir).split('T')[0] : ''
  );
  const dbNamaWali = cleanDbValue(santri.nama_wali, ['wali santri']);
  const dbHubunganWali = cleanDbValue(santri.hubungan_wali);
  const dbNoWaWali = cleanDbValue(santri.no_wa_wali);
  const dbAlamatAsal = cleanDbValue(santri.alamat_asal);
  const dbNamaAsrama = cleanDbValue(santri.nama_asrama);
  const dbNamaKamar = cleanDbValue(santri.nama_kamar);
  const dbKodeKamar = cleanDbValue(santri.kode_kamar);
  const dbPembinaAsrama = cleanDbValue(santri.pembina_asrama);
  const dbNoHpPembina = cleanDbValue(santri.no_hp_pembina);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      {/* Top Header Bar Terpadu Emerald Green */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.25)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={onBack}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Profil Lengkap Santri
              </h2>
            </div>
          </div>

          <button 
            onClick={handleLogoutAction}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            title="Keluar Akun"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Container Body with Consistent 16px Padding */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* HERO ID CARD SANTRI (DESAIN LUXURY KARTU IDENTITAS DIGITAL) */}
        <div style={{
          background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
          borderRadius: '24px',
          padding: '20px 18px 16px',
          color: '#ffffff',
          boxShadow: '0 10px 28px -4px rgba(13, 118, 110, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Watermark Accent */}
          <div style={{
            position: 'absolute',
            right: '-15px',
            top: '-15px',
            fontSize: '7rem',
            opacity: 0.08,
            userSelect: 'none',
            pointerEvents: 'none'
          }}>
            🕌
          </div>

          {/* Top Badge Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#5eead4',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                KARTU SANTRI DIGITAL
              </span>
            </div>
            {dbStatusAktif && (
              <span style={{
                background: '#10b981',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '999px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
              }}>
                ● {dbStatusAktif}
              </span>
            )}
          </div>

          {/* Avatar & Main Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f0fdfa 100%)',
                color: '#0d766e',
                fontSize: '1.65rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.25)',
                border: '2.5px solid rgba(255, 255, 255, 0.85)'
              }}>
                {initial}
              </div>
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2.5px solid #0d766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
              </span>
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.2rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.25,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
              }}>
                {dbNama}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                {dbNisn && (
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.16)',
                    color: '#bae6fd',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}>
                    NISN: {dbNisn}
                  </span>
                )}
                {dbJk && (
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.16)',
                    color: '#99f6e4',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {dbJk === 'P' ? 'Akhwat' : dbJk === 'L' ? 'Ikhwan' : dbJk}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2 Quick Glass Counters: Asrama & Kamar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.22)',
            padding: '8px 10px',
            borderRadius: '14px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#99f6e4', fontWeight: 700, textTransform: 'uppercase' }}>Asrama</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ffffff', marginTop: '1px', minHeight: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dbNamaAsrama}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#99f6e4', fontWeight: 700, textTransform: 'uppercase' }}>Kamar / Kobong</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ffffff', marginTop: '1px', minHeight: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dbNamaKamar}
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Section Filter Pills (Horizontal Scroll) */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'semua', label: 'Semua Data', icon: '📋' },
            { id: 'biodata', label: 'Biodata Santri', icon: '👤' },
            { id: 'asrama', label: 'Asrama & Kobong', icon: '🏛️' },
            { id: 'asatidz', label: 'Dewan Asatidz', icon: '👨‍🏫' },
            { id: 'keamanan', label: 'Keamanan Akun', icon: '🔐' }
          ].map(pill => {
            const isActive = profileSection === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setProfileSection(pill.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: isActive ? '1.5px solid #059669' : '1px solid #e2e8f0',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: isActive ? '#ecfdf5' : '#ffffff',
                  color: isActive ? '#065f46' : '#64748b',
                  boxShadow: isActive ? '0 3px 8px rgba(5, 150, 105, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: BIODATA SANTRI & WALI */}
        {(profileSection === 'semua' || profileSection === 'biodata') && (
          <div style={infoCardBox}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0f766e', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={15} />
              </div>
              <span>Biodata Santri & Orang Tua / Wali</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '2px' }}>
              <div style={infoRow}>
                <span style={infoLabel}>Nama Lengkap:</span>
                <span style={{ ...infoValue, color: '#0f172a', fontWeight: 800 }}>{dbNama}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>NISN Santri:</span>
                <span style={{ ...infoValue, color: '#0284c7', fontWeight: 800, fontFamily: 'monospace' }}>{dbNisn}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Jenis Kelamin:</span>
                <span style={infoValue}>{dbJk === 'P' ? 'Akhwat (Perempuan)' : dbJk === 'L' ? 'Ikhwan (Laki-laki)' : dbJk}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Tempat, Tgl Lahir:</span>
                <span style={infoValue}>
                  {dbTempatLahir && dbTglLahir
                    ? `${dbTempatLahir}, ${dbTglLahir}`
                    : dbTempatLahir || dbTglLahir || ''}
                </span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Status Santri:</span>
                <span style={{ ...infoValue, color: '#059669', fontWeight: 800 }}>{dbStatusSantri}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Tahun Masuk:</span>
                <span style={infoValue}>{dbTahunMasuk}</span>
              </div>
              <div style={{ height: '1px', background: '#f1f5f9', margin: '2px 0' }} />
              <div style={infoRow}>
                <span style={infoLabel}>Nama Orang Tua / Wali:</span>
                <span style={{ ...infoValue, color: '#0f172a', fontWeight: 800 }}>
                  {dbNamaWali
                    ? `${dbNamaWali}${dbHubunganWali ? ` (${dbHubunganWali})` : ''}`
                    : ''}
                </span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>No. WhatsApp Wali:</span>
                <span style={{ ...infoValue, color: '#059669', fontWeight: 800 }}>{dbNoWaWali}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Alamat Rumah Asal:</span>
                <span style={{ ...infoValue, maxWidth: '60%', textAlign: 'right' }}>{dbAlamatAsal}</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: PENEMPATAN ASRAMA & KOBONG */}
        {(profileSection === 'semua' || profileSection === 'asrama') && (
          <div style={infoCardBox}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={15} />
              </div>
              <span>Penempatan Asrama & Kobong Santri</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '2px' }}>
              <div style={infoRow}>
                <span style={infoLabel}>Gedung Asrama:</span>
                <span style={{ ...infoValue, color: '#4338ca', fontWeight: 900 }}>{dbNamaAsrama}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Kamar / Kobong:</span>
                <span style={{ ...infoValue, fontWeight: 800 }}>
                  {dbNamaKamar ? `${dbNamaKamar}${dbKodeKamar ? ` (${dbKodeKamar})` : ''}` : ''}
                </span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Asatidz Pembina Kobong:</span>
                <span style={{ ...infoValue, color: '#0284c7', fontWeight: 800 }}>{dbPembinaAsrama}</span>
              </div>
              <div style={infoRow}>
                <span style={infoLabel}>Kontak WhatsApp Pembina:</span>
                <span style={{ ...infoValue, color: '#059669', fontWeight: 800 }}>{dbNoHpPembina}</span>
              </div>

              {dbNoHpPembina && (
                <a
                  href={`https://wa.me/${String(dbNoHpPembina).replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    marginTop: '4px',
                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.1)'
                  }}
                >
                  <MessageCircle size={16} color="#059669" /> Hubungi Pembina Kobong via WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: DEWAN ASATIDZ & MUSYRIF PEMBINA */}
        {(profileSection === 'semua' || profileSection === 'asatidz') && (
          <div style={infoCardBox}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0d9488', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#ccfbf1', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={15} />
              </div>
              <span>Dewan Asatidz & Musyrif Pembina</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {asatidzList.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                  Belum ada pembina yang ditugaskan untuk santri ini.
                </div>
              ) : (
                asatidzList.map((g, idx) => (
                  <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>{g.nama}</div>
                      <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>{g.peran}</div>
                    </div>
                    {g.hp ? (
                      <a
                        href={`https://wa.me/${g.hp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ecfdf5',
                          color: '#059669',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          textDecoration: 'none'
                        }}
                      >
                        <Phone size={13} /> Chat WA
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: KEAMANAN & KREDENSIAL LOGIN WALI */}
        {(profileSection === 'semua' || profileSection === 'keamanan') && (
          <div style={infoCardBox}>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={15} />
              </div>
              <span>Kredensial Login Orang Tua / Wali</span>
            </div>

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '10px 12px', fontSize: '0.72rem', color: '#166534', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span>🔒</span>
                <div>
                  Ganti username dan password khusus untuk Bapak/Ibu Wali Santri agar login ke portal mobile lebih mudah dan terjaga keamanannya.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Username Login Wali
                </label>
                <input
                  type="text"
                  value={passwordForm.username_baru}
                  onChange={(e) => setPasswordForm({ ...passwordForm, username_baru: e.target.value })}
                  style={{ ...inputFieldStyle, borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                  placeholder="Contoh: waliahmad"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Password Baru
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={passwordForm.password_baru}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_baru: e.target.value })}
                    style={{ ...inputFieldStyle, borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                    placeholder="Minimal 4 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwordForm.konfirmasi_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })}
                  style={{ ...inputFieldStyle, borderRadius: '12px', border: '1.5px solid #cbd5e1' }}
                  placeholder="Ulangi password baru"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPass}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontWeight: 900,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  opacity: updatingPass ? 0.75 : 1
                }}
              >
                <Save size={16} />
                {updatingPass ? 'Menyimpan...' : 'Simpan Kredensial Akun'}
              </button>
            </form>
          </div>
        )}

        {/* Logout Button in Profile */}
        <button
          onClick={handleLogoutAction}
          style={{
            width: '100%',
            background: '#fff1f2',
            color: '#e11d48',
            border: '1.5px solid #fecdd3',
            padding: '13px',
            borderRadius: '14px',
            fontSize: '0.84rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          <LogOut size={16} /> Keluar dari Akun Wali Santri
        </button>

      </div>
    </div>
  );
};

export default TabProfilWali;

