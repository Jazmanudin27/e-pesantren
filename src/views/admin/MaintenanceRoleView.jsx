import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wrench, 
  Power, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Save, 
  Eye, 
  AlertTriangle, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Building, 
  Smartphone,
  X,
  Info
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';
import MaintenanceScreen from '../../components/MaintenanceScreen';

export default function MaintenanceRoleView() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [previewRole, setPreviewRole] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'maintenance' | 'normal'

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/maintenance/settings');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setSettings(res.data.data);
      } else {
        // Fallback default jika tabel baru
        const statusRes = await axios.get('/api/maintenance/status');
        if (statusRes.data?.success && statusRes.data.data) {
          const arr = Object.values(statusRes.data.data);
          setSettings(arr);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat setting maintenance:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (item) => {
    const nextState = !item.is_maintenance;
    const actionText = nextState ? 'MENGAKTIFKAN maintenance' : 'MENONAKTIFKAN maintenance (Buka kembali akses)';
    const confirmMsg = nextState 
      ? `Yakin ingin mengaktifkan mode maintenance untuk "${item.role_name}"? Semua pengguna dengan role ini TIDAK BISA menggunakan sistem dan akan diarahkan ke halaman perbaikan.`
      : `Buka kembali akses untuk "${item.role_name}"? Pengguna akan dapat login dan menggunakan portal kembali secara normal.`;

    const confirmed = await showConfirm(
      nextState ? 'Aktifkan Maintenance Role?' : 'Kembalikan Operasional Normal?',
      confirmMsg
    );
    if (!confirmed) return;

    try {
      setSavingKey(item.role_key);
      const res = await axios.post('/api/maintenance/toggle', {
        role_key: item.role_key,
        is_maintenance: nextState,
        message: item.message,
        estimated_time: item.estimated_time
      });

      if (res.data?.success) {
        toastSuccess(
          nextState ? 'Maintenance Aktif!' : 'Operasional Normal!',
          res.data.message
        );
        setSettings(prev => prev.map(s => s.role_key === item.role_key ? { ...s, is_maintenance: nextState } : s));
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengubah status');
      }
    } catch (err) {
      showError('Gagal Mengubah Status', err.response?.data?.message || err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveDetail = async (item) => {
    try {
      setSavingKey(item.role_key);
      const res = await axios.post('/api/maintenance/toggle', {
        role_key: item.role_key,
        is_maintenance: item.is_maintenance,
        message: item.message,
        estimated_time: item.estimated_time
      });

      if (res.data?.success) {
        toastSuccess('Tersimpan!', `Pesan & estimasi maintenance untuk ${item.role_name} berhasil disimpan.`);
      } else {
        showError('Gagal', res.data?.message || 'Gagal menyimpan data');
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.response?.data?.message || err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleChangeField = (roleKey, field, value) => {
    setSettings(prev => prev.map(s => s.role_key === roleKey ? { ...s, [field]: value } : s));
  };

  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'wali':
        return <Users size={20} color="#0284c7" />;
      case 'pengajar':
        return <GraduationCap size={20} color="#059669" />;
      case 'keuangan':
        return <CreditCard size={20} color="#d97706" />;
      case 'asrama':
        return <Building size={20} color="#8b5cf6" />;
      case 'santri':
        return <Smartphone size={20} color="#0d9488" />;
      default:
        return <Wrench size={20} color="#64748b" />;
    }
  };

  const filteredSettings = settings.filter(item => {
    if (filterMode === 'maintenance') return item.is_maintenance;
    if (filterMode === 'normal') return !item.is_maintenance;
    return true;
  });

  const countMaintenance = settings.filter(s => s.is_maintenance).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.12)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Wrench size={13} color="#f59e0b" /> Pusat Kontrol Pemeliharaan Sistem
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.4px' }}>
            Pengaturan Maintenance Per Role
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#94a3b8', maxWidth: '640px', lineHeight: 1.5 }}>
            Kendalikan akses per role. Jika role diaktifkan maintenance, pengguna role tersebut otomatis diblokir dan muncul pemberitahuan resmi sistem sedang diperbaiki.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchSettings}
            disabled={loading}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Status Highlights & Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: filterMode === 'all' ? 800 : 600,
              cursor: 'pointer',
              background: filterMode === 'all' ? '#ffffff' : 'transparent',
              color: filterMode === 'all' ? '#0f172a' : '#64748b',
              boxShadow: filterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Semua Role ({settings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('maintenance')}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: filterMode === 'maintenance' ? 800 : 600,
              cursor: 'pointer',
              background: filterMode === 'maintenance' ? '#fef2f2' : 'transparent',
              color: filterMode === 'maintenance' ? '#dc2626' : '#64748b',
              boxShadow: filterMode === 'maintenance' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Sedang Maintenance ({countMaintenance})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('normal')}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: filterMode === 'normal' ? 800 : 600,
              cursor: 'pointer',
              background: filterMode === 'normal' ? '#ecfdf5' : 'transparent',
              color: filterMode === 'normal' ? '#059669' : '#64748b',
              boxShadow: filterMode === 'normal' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            Operasional Normal ({settings.length - countMaintenance})
          </button>
        </div>

        {countMaintenance > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '10px', fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700 }}>
            <AlertTriangle size={16} />
            <span>Perhatian: Ada <strong>{countMaintenance} role</strong> dalam kondisi maintenance (akses ditutup).</span>
          </div>
        )}
      </div>

      {/* Role Maintenance Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredSettings.map((item) => {
          const isMaint = Boolean(item.is_maintenance);
          const isSaving = savingKey === item.role_key;

          return (
            <div
              key={item.role_key}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                border: isMaint ? '2px solid #ef4444' : '1px solid #e2e8f0',
                boxShadow: isMaint ? '0 10px 25px -5px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(0,0,0,0.04)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent Strip */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: isMaint ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #10b981, #059669)'
                }}
              />

              <div>
                {/* Header Role Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: isMaint ? '#fee2e2' : '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getRoleIcon(item.role_key)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        {item.role_name}
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        Key: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, color: '#0284c7' }}>{item.role_key}</code>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status Pill */}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: isMaint ? '#fee2e2' : '#dcfce7',
                      color: isMaint ? '#b91c1c' : '#15803d',
                      border: isMaint ? '1px solid #fca5a5' : '1px solid #86efac',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isMaint ? '#ef4444' : '#10b981' }} />
                    {isMaint ? 'Maintenance' : 'Aktif Normal'}
                  </span>
                </div>

                {/* Description */}
                {item.description && (
                  <div style={{ fontSize: '0.74rem', color: '#64748b', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', marginBottom: '14px', lineHeight: 1.4 }}>
                    {item.description}
                  </div>
                )}

                {/* Form Message & Estimasi */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Pesan Notifikasi Pengguna:
                  </label>
                  <textarea
                    rows={3}
                    value={item.message || ''}
                    onChange={(e) => handleChangeField(item.role_key, 'message', e.target.value)}
                    placeholder="Tuliskan pesan perbaikan untuk ditampilkan ke pengguna..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.78rem',
                      lineHeight: 1.45,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Estimasi Selesai (Opsional):
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: '10px', color: '#94a3b8' }}>
                      <Clock size={14} />
                    </div>
                    <input
                      type="text"
                      value={item.estimated_time || ''}
                      onChange={(e) => handleChangeField(item.role_key, 'estimated_time', e.target.value)}
                      placeholder="Contoh: Hari ini pukul 21:00 WIB"
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 30px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.78rem',
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Toggle Maintenance Main Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    disabled={isSaving}
                    style={{
                      flex: 2,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isMaint 
                        ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                        : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: isMaint ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    <Power size={14} />
                    <span>{isMaint ? 'Buka Akses (Normal)' : 'Aktifkan Maintenance'}</span>
                  </button>

                  {/* Simpan Pesan */}
                  <button
                    type="button"
                    onClick={() => handleSaveDetail(item)}
                    disabled={isSaving}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                    title="Simpan perubahan teks pesan & estimasi"
                  >
                    <Save size={14} />
                    <span>Simpan</span>
                  </button>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewRole(item)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Eye size={13} />
                  <span>Lihat Tampilan Notifikasi Pengguna (Preview)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PREVIEW NOTIFIKASI PENGGUNA */}
      {previewRole && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setPreviewRole(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              animation: 'slideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', color: '#ffffff' }}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} /> Pratinjau Tampilan Pengguna ({previewRole.role_name})
              </div>
              <button
                type="button"
                onClick={() => setPreviewRole(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <MaintenanceScreen
              roleKey={previewRole.role_key}
              roleName={previewRole.role_name}
              message={previewRole.message}
              estimatedTime={previewRole.estimated_time}
              onRefresh={() => setPreviewRole(null)}
              onLogout={() => setPreviewRole(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
