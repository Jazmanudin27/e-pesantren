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
  onMarkAllRead,
  onClearAll,
  onClickNotification,
  onBack
}) => {
  const [activeFilter, setActiveFilter] = useState('semua');

  const filterTabs = [
    { id: 'semua', label: 'Semua', count: notifikasiList.length },
    { id: 'absensi', label: 'Absensi', count: notifikasiList.filter(n => (n.kategori || '').toLowerCase() === 'absensi').length },
    { id: 'tabungan', label: 'Tabungan', count: notifikasiList.filter(n => (n.kategori || '').toLowerCase() === 'tabungan').length },
    { id: 'tahfidz', label: 'Tahfidz', count: notifikasiList.filter(n => (n.kategori || '').toLowerCase() === 'tahfidz').length },
    { id: 'perizinan', label: 'Izin', count: notifikasiList.filter(n => (n.kategori || '').toLowerCase() === 'perizinan').length },
    { id: 'kegiatan', label: 'Kegiatan', count: notifikasiList.filter(n => (n.kategori || '').toLowerCase() === 'kegiatan').length }
  ];

  const filteredList = activeFilter === 'semua'
    ? notifikasiList
    : notifikasiList.filter(n => (n.kategori || '').toLowerCase() === activeFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '90px' }}>
      {/* Top Header Bar Terpadu Emerald Green Modern */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #065f46 100%)',
        padding: '16px 16px 18px',
        color: '#ffffff',
        borderBottomLeftRadius: '26px',
        borderBottomRightRadius: '26px',
        boxShadow: '0 10px 24px -4px rgba(5, 150, 105, 0.32)',
        marginBottom: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Dekorasi Cahaya Halus */}
        <div style={{
          position: 'absolute',
          top: '-35px',
          right: '-25px',
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          background: 'rgba(167, 243, 208, 0.18)',
          filter: 'blur(24px)',
          pointerEvents: 'none'
        }} />

        {/* Baris 1: Tombol Kembali, Judul & Hapus Riwayat */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#fff',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                backdropFilter: 'blur(8px)'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{
              fontSize: '1.08rem',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Notifikasi Aktivitas Santri
            </h2>
          </div>

          {notifikasiList.length > 0 && (
            <button
              onClick={onClearAll}
              title="Bersihkan Semua Riwayat"
              style={{
                background: 'rgba(255, 255, 255, 0.14)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffe4e6',
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                backdropFilter: 'blur(8px)'
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Baris 2: Glass Bar Status "Baru" & Tombol "Tandai Dibaca" */}
        <div style={{
          marginTop: '14px',
          background: 'rgba(255, 255, 255, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.24)',
          borderRadius: '14px',
          padding: '8px 10px 8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Kiri: Indikator Pesan Baru / Status Baca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '999px',
                boxShadow: '0 3px 10px rgba(244, 63, 94, 0.4)',
                letterSpacing: '0.02em'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 6px #ffffff'
                }} />
                <span>{unreadCount} Baru</span>
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ecfdf5',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px'
              }}>
                <CheckCircle2 size={13} color="#a7f3d0" />
                <span>Semua Terbaca</span>
              </div>
            )}

            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#d1fae5'
            }}>
              • {notifikasiList.length} Aktivitas
            </span>
          </div>

          {/* Kanan: Tombol Tandai Dibaca Lebih Menarik */}
          <button
            onClick={unreadCount > 0 ? onMarkAllRead : undefined}
            disabled={unreadCount === 0}
            style={{
              background: unreadCount > 0
                ? '#ffffff'
                : 'rgba(255, 255, 255, 0.12)',
              border: unreadCount > 0
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.18)',
              color: unreadCount > 0 ? '#047857' : 'rgba(255, 255, 255, 0.55)',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.68rem',
              fontWeight: 900,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: unreadCount > 0 ? 'pointer' : 'default',
              boxShadow: unreadCount > 0
                ? '0 4px 12px rgba(0, 0, 0, 0.12)'
                : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <CheckCheck size={14} strokeWidth={2.5} />
            <span>Tandai Dibaca</span>
          </button>
        </div>
      </div>

      {/* Banner Status Izin Push Notification Layar HP (Hanya tampil jika izin belum diberikan) */}
      {pushPermission !== 'granted' && (
        <div style={{ padding: '0 14px', marginBottom: '12px' }}>
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
        </div>
      )}

      {/* Filter Kategori Pills dengan Count Badge */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '0 14px 12px',
        scrollbarWidth: 'none'
      }}>
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '99px',
                fontSize: '0.7rem',
                fontWeight: 800,
                border: isActive ? 'none' : '1px solid #e2e8f0',
                background: isActive
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 4px 12px rgba(5, 150, 105, 0.28)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.24)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '999px',
                  lineHeight: 1.2
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Daftar Notifikasi */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                  background: isUnread
                    ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                    : '#ffffff',
                  border: isUnread ? `1.5px solid ${meta.border}` : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '12px 13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '11px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isUnread
                    ? '0 6px 16px -3px rgba(15, 23, 42, 0.07)'
                    : '0 2px 5px rgba(15, 23, 42, 0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Garis Aksen Kiri untuk Pesan Belum Dibaca */}
                {isUnread && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: meta.color
                  }} />
                )}

                {/* Icon Kategori Squircle */}
                <div style={{
                  width: '38px',
                  height: '38px',
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
                  <IconComp size={18} strokeWidth={2.3} />
                </div>

                {/* Konten Teks */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        color: meta.color,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        padding: '1.5px 6px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}>
                        {meta.label}
                      </span>
                      {isUnread && (
                        <span style={{
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          color: '#ffffff',
                          background: '#ef4444',
                          padding: '1px 5px',
                          borderRadius: '99px',
                          letterSpacing: '0.03em'
                        }}>
                          BARU
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>

                  <div style={{
                    fontWeight: isUnread ? 800 : 700,
                    fontSize: '0.8rem',
                    color: '#0f172a',
                    marginTop: '5px',
                    lineHeight: 1.3
                  }}>
                    {n.judul}
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color: isUnread ? '#334155' : '#64748b',
                    lineHeight: 1.42,
                    marginTop: '3px'
                  }}>
                    {n.pesan}
                  </div>
                </div>

                <ChevronRight size={15} color="#cbd5e1" style={{ alignSelf: 'center', flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TabNotifikasiWali;
