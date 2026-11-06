import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  Fingerprint,
  Wallet,
  BookOpen,
  HeartHandshake,
  DoorOpen,
  ShieldAlert,
  CreditCard,
  Sparkles,
  ChevronRight,
  BellRing,
  CheckCircle2
} from 'lucide-react';

const KATEGORI_META = {
  absensi: {
    label: 'Presensi & Shalat',
    icon: Fingerprint,
    bg: '#ecfdf5',
    border: '#a7f3d0',
    color: '#059669'
  },
  tabungan: {
    label: 'Buku Tabungan',
    icon: Wallet,
    bg: '#f0fdf4',
    border: '#bbf7d0',
    color: '#16a34a'
  },
  tahfidz: {
    label: 'Tahfidz Al-Qur\'an',
    icon: BookOpen,
    bg: '#f5f3ff',
    border: '#ddd6fe',
    color: '#7c3aed'
  },
  praktek: {
    label: 'Praktek Ibadah',
    icon: HeartHandshake,
    bg: '#fff7ed',
    border: '#fed7aa',
    color: '#ea580c'
  },
  perizinan: {
    label: 'Perizinan Santri',
    icon: DoorOpen,
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#2563eb'
  },
  pelanggaran: {
    label: 'Kedisiplinan',
    icon: ShieldAlert,
    bg: '#fff1f2',
    border: '#fecdd3',
    color: '#e11d48'
  },
  keuangan: {
    label: 'Tagihan & SPP',
    icon: CreditCard,
    bg: '#f0f9ff',
    border: '#bae6fd',
    color: '#0284c7'
  },
  kegiatan: {
    label: 'Kegiatan Pondok',
    icon: Sparkles,
    bg: '#fefce8',
    border: '#fef08a',
    color: '#ca8a04'
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Baru saja';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) {
    return `Kemarin • ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
  }
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const TabNotifikasiWali = ({
  rawSantriName = '',
  displayNisn = '',
  notifikasiList = [],
  unreadCount = 0,
  pushPermission = 'default',
  onRequestPushPermission,
  onSendTestNotification,
  onMarkAllRead,
  onClearAll,
  onClickNotification,
  onBack
}) => {
  const [activeFilter, setActiveFilter] = useState('semua');

  const filterTabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'absensi', label: 'Absensi' },
    { id: 'tabungan', label: 'Tabungan' },
    { id: 'tahfidz', label: 'Tahfidz' },
    { id: 'perizinan', label: 'Izin' },
    { id: 'kegiatan', label: 'Kegiatan' }
  ];

  const filteredList = activeFilter === 'semua'
    ? notifikasiList
    : notifikasiList.filter(n => (n.kategori || '').toLowerCase() === activeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      {/* Top Header Bar Terpadu Emerald Green */}
      <div style={{
        background: 'linear-gradient(135deg, #0d766e 0%, #042f2e 100%)',
        padding: '16px 16px 20px',
        color: '#ffffff',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        boxShadow: '0 8px 20px rgba(13, 118, 110, 0.25)',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                  Notifikasi Aktivitas Santri
                </h2>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.64rem',
                    fontWeight: 900,
                    padding: '2px 7px',
                    borderRadius: '99px'
                  }}>
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '2px', fontWeight: 600 }}>
                {rawSantriName} • NISN: {displayNisn}
              </div>
            </div>
          </div>

          {notifikasiList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  title="Tandai Semua Dibaca"
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCheck size={14} /> Dibaca
                </button>
              )}
              <button
                onClick={onClearAll}
                title="Bersihkan Riwayat"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: '#fecdd3',
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner Status Izin Push Notification Layar HP (Ala Shopee) */}
      <div style={{ padding: '0 14px', marginBottom: '12px' }}>
        {pushPermission !== 'granted' ? (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '16px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <BellRing size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#92400e' }}>
                  Aktifkan Notifikasi Layar HP
                </div>
                <div style={{ fontSize: '0.68rem', color: '#b45309', lineHeight: 1.3, marginTop: '2px' }}>
                  Dapatkan bunyi & pop-up otomatis saat ananda scan absen, tabungan, atau kegiatan.
                </div>
              </div>
            </div>
            <button
              onClick={onRequestPushPermission}
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(217, 119, 6, 0.3)'
              }}
            >
              Aktifkan
            </button>
          </div>
        ) : (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '14px',
            padding: '9px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#065f46' }}>
              <CheckCircle2 size={16} color="#059669" />
              <span>Notifikasi Real-Time HP Aktif (Bunyi & Pop-Up Otomatis)</span>
            </div>
            {onSendTestNotification && (
              <button
                onClick={onSendTestNotification}
                style={{
                  background: '#ffffff',
                  color: '#059669',
                  border: '1px solid #6ee7b7',
                  padding: '4px 9px',
                  borderRadius: '8px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                Tes Notif HP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Kategori Pills */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '0 14px 10px',
        scrollbarWidth: 'none'
      }}>
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '6px 13px',
                borderRadius: '99px',
                fontSize: '0.72rem',
                fontWeight: 800,
                border: isActive ? 'none' : '1px solid #e2e8f0',
                background: isActive ? '#0d766e' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 3px 10px rgba(13, 118, 110, 0.25)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Daftar Notifikasi */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {filteredList.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px dashed #cbd5e1',
            padding: '36px 20px',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#f1f5f9',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              <Bell size={24} />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
              Belum Ada Notifikasi
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
              Setiap aktivitas {rawSantriName} (Scan Absensi, Setoran Tahfidz, Tabungan, Izin & Kegiatan) akan langsung muncul di sini dan di layar atas HP Anda.
            </div>
          </div>
        ) : (
          filteredList.map((n) => {
            const katKey = (n.kategori || 'info').toLowerCase();
            const meta = KATEGORI_META[katKey] || {
              label: 'Pemberitahuan',
              icon: Bell,
              bg: '#f1f5f9',
              border: '#cbd5e1',
              color: '#0f172a'
            };
            const IconComp = meta.icon;
            const isUnread = Number(n.is_read) === 0;

            return (
              <div
                key={n.id}
                onClick={() => onClickNotification && onClickNotification(n)}
                style={{
                  background: isUnread ? '#ffffff' : '#f8fafc',
                  border: isUnread ? `1.5px solid ${meta.border}` : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isUnread ? '0 4px 14px rgba(15, 23, 42, 0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Icon Kategori Squircle */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: meta.bg,
                  border: `1px solid ${meta.border}`,
                  color: meta.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <IconComp size={19} strokeWidth={2.3} />
                </div>

                {/* Konten Teks */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: meta.color,
                      background: meta.bg,
                      padding: '2px 7px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em'
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>

                  <div style={{
                    fontWeight: isUnread ? 900 : 700,
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    marginTop: '5px',
                    lineHeight: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isUnread && (
                      <span style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        flexShrink: 0
                      }} />
                    )}
                    <span>{n.judul}</span>
                  </div>

                  <div style={{
                    fontSize: '0.74rem',
                    color: '#475569',
                    lineHeight: 1.4,
                    marginTop: '3px'
                  }}>
                    {n.pesan}
                  </div>
                </div>

                <ChevronRight size={16} color="#cbd5e1" style={{ alignSelf: 'center', flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TabNotifikasiWali;
