import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Search,
  RotateCw,
  Send,
  User,
  Clock,
  CheckCheck,
  Inbox,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Smile,
  Paperclip,
  X,
  Phone,
  Info,
  Building,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Tag,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronLeft
} from 'lucide-react';
import { toastSuccess, showError } from '../../utils/alert.util';

const QUICK_REPLIES = [
  { label: 'Salam Resmi', text: "Wa'alaikumussalam Warahmatullahi Wabarakatuh. Ada yang bisa kami bantu Bapak/Ibu?", topik: 'Tanggapan Admin' },
  { label: 'Segera Ditindaklanjuti', text: "Baik Bapak/Ibu, pesan dan laporan telah kami terima dengan baik. Segera kami koordinasikan dengan pihak pengasuhan/asrama.", topik: 'Tanggapan Admin' },
  { label: 'Konfirmasi SPP Lunas', text: "Alhamdulillah, bukti transfer/pembayaran SPP & Syahriah telah kami verifikasi dan status pembayaran sudah tercatat LUNAS di sistem.", topik: 'Konfirmasi Keuangan' },
  { label: 'Izin Disetujui', text: "Permohonan perizinan santri telah disetujui oleh pengasuhan. Harap santri dijemput tepat waktu sesuai jadwal yang tertera pada aplikasi.", topik: 'Persetujuan Izin' },
  { label: 'Kondisi Santri Sehat', text: "Alhamdulillah ananda santri saat ini dalam keadaan sehat wal afiat, aktif mengikuti kegiatan ibadah dan pelajaran di pondok.", topik: 'Informasi Kesehatan' }
];

export default function PesanKomunikasiAdminView() {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeSantriId, setActiveSantriId] = useState(null);
  const [activeThreadData, setActiveThreadData] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyTopik, setReplyTopik] = useState('Tanggapan Admin');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchThread, setSearchThread] = useState('');
  const [filterCategory, setFilterCategory] = useState('semua'); // 'semua' | 'unread' | 'keuangan' | 'izin'
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThreads = async (silent = false) => {
    try {
      if (!silent) setLoadingThreads(true);
      const res = await axios.get('/api/pesan/admin/threads');
      if (res.data?.success && res.data.data) {
        const threadList = res.data.data.threads || [];
        setThreads(threadList);
        if (!activeSantriId && threadList.length > 0) {
          setActiveSantriId(threadList[0].santri_id);
          setActiveThreadData(threadList[0]);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat threads pesan:', err);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  const fetchMessagesForSantri = async (santriId, silent = false) => {
    if (!santriId) return;
    try {
      if (!silent) setLoadingMessages(true);
      const res = await axios.get(`/api/pesan/admin/messages/${santriId}`);
      if (res.data?.success && res.data.data) {
        setMessages(res.data.data.messages || []);
        if (res.data.data.santri) {
          setActiveThreadData((prev) => ({
            ...prev,
            ...res.data.data.santri
          }));
        }
      }
    } catch (err) {
      console.warn('Gagal memuat isi pesan santri:', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      fetchThreads(true);
      if (activeSantriId) {
        fetchMessagesForSantri(activeSantriId, true);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [activeSantriId]);

  useEffect(() => {
    if (activeSantriId) {
      fetchMessagesForSantri(activeSantriId);
    }
  }, [activeSantriId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectThread = (thread) => {
    setActiveSantriId(thread.santri_id);
    setActiveThreadData(thread);
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeSantriId) return;

    try {
      setSendingReply(true);
      const res = await axios.post('/api/pesan/admin/reply', {
        santri_id: activeSantriId,
        topik: replyTopik,
        isi_pesan: replyText.trim()
      });

      if (res.data?.success) {
        setReplyText('');
        fetchMessagesForSantri(activeSantriId, true);
        fetchThreads(true);
      } else {
        showError('Gagal Kirim', res.data?.message || 'Gagal mengirim balasan.');
      }
    } catch (err) {
      showError('Gagal Kirim', err.response?.data?.message || err.message);
    } finally {
      setSendingReply(false);
    }
  };

  const handleQuickReply = (qr) => {
    setReplyText(qr.text);
    if (qr.topik) setReplyTopik(qr.topik);
  };

  const totalUnreadCount = threads.reduce((acc, th) => acc + (parseInt(th.unread_count) || 0), 0);

  const filteredThreads = threads.filter((th) => {
    const q = searchThread.toLowerCase().trim();
    const matchSearch =
      !q ||
      (th.nama_santri || '').toLowerCase().includes(q) ||
      (th.nama_wali || '').toLowerCase().includes(q) ||
      (th.nis || '').toLowerCase().includes(q) ||
      (th.last_message || '').toLowerCase().includes(q) ||
      (th.last_topik || '').toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterCategory === 'unread') {
      return (parseInt(th.unread_count) || 0) > 0;
    }
    if (filterCategory === 'keuangan') {
      const top = (th.last_topik || '').toLowerCase();
      return top.includes('keuangan') || top.includes('spp');
    }
    if (filterCategory === 'izin') {
      const top = (th.last_topik || '').toLowerCase();
      return top.includes('izin');
    }
    return true;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const getTopikBadge = (topik) => {
    const t = (topik || '').toLowerCase();
    if (t.includes('keuangan') || t.includes('spp')) {
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', icon: '💰', label: topik || 'Keuangan & SPP' };
    }
    if (t.includes('izin')) {
      return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe', icon: '📋', label: topik || 'Perizinan Santri' };
    }
    if (t.includes('sehat') || t.includes('sakit') || t.includes('medis')) {
      return { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3', icon: '🩺', label: topik || 'Kesehatan' };
    }
    if (t.includes('belajar') || t.includes('akademik') || t.includes('tahfidz')) {
      return { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff', icon: '📖', label: topik || 'Laporan Belajar' };
    }
    return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', icon: '💬', label: topik || 'Tanggapan Admin' };
  };

  const cleanPhone = (activeThreadData?.no_hp_wali || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
    : null;

  return (
    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 75px)', boxSizing: 'border-box', gap: '10px' }}>
      
      {/* 1. TOP HEADER BANNER DENGAN LIVE STATS */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 18px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        flexShrink: 0,
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(5, 150, 105, 0.28)'
          }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Pusat Pesan &amp; Komunikasi Wali Santri
              </h1>
              <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Kanal Dua Arah Real-Time
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '2px 0 0 0' }}>
              Layanan konsultasi, konfirmasi pembayaran, perizinan, dan laporan perkembangan santri dengan orang tua.
            </p>
          </div>
        </div>

        {/* Live Counters & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <MessageSquare size={13} color="#059669" />
            <span>{threads.length} Percakapan</span>
          </div>

          <div style={{
            background: totalUnreadCount > 0 ? '#fef2f2' : '#f8fafc',
            border: totalUnreadCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0',
            padding: '5px 12px',
            borderRadius: '8px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: totalUnreadCount > 0 ? '#dc2626' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: totalUnreadCount > 0 ? '#ef4444' : '#94a3b8',
              display: 'inline-block'
            }} />
            <span>{totalUnreadCount} Belum Dibalas</span>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchThreads();
              if (activeSantriId) fetchMessagesForSantri(activeSantriId);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#334155'
            }}
            title="Segarkan Chat"
          >
            <RotateCw size={13} className={loadingThreads ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. CHAT WORKSPACE (SPLIT COLUMNS MODERN SAAS / WHATSAPP WEB STYLE) */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}>
        
        {/* ========================================================
            KOLOM KIRI: DAFTAR KONTAK / PERCAKAPAN (WIDTH: 330px)
        ======================================================== */}
        <div style={{
          width: '330px',
          minWidth: '300px',
          maxWidth: '360px',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc'
        }}>
          {/* Search Box Kontak */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '0 10px'
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                value={searchThread}
                onChange={(e) => setSearchThread(e.target.value)}
                placeholder="Cari santri, wali, NIS..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '7px 8px',
                  fontSize: '0.76rem',
                  color: '#1e293b',
                  fontWeight: 600,
                  width: '100%'
                }}
              />
              {searchThread && (
                <button
                  onClick={() => setSearchThread('')}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                onClick={() => setFilterCategory('semua')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterCategory === 'semua' ? '#0f172a' : '#f1f5f9',
                  color: filterCategory === 'semua' ? '#ffffff' : '#64748b',
                  whiteSpace: 'nowrap'
                }}
              >
                Semua ({threads.length})
              </button>
              <button
                onClick={() => setFilterCategory('unread')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterCategory === 'unread' ? '#ef4444' : '#fee2e2',
                  color: filterCategory === 'unread' ? '#ffffff' : '#b91c1c',
                  whiteSpace: 'nowrap'
                }}
              >
                Belum Balas ({totalUnreadCount})
              </button>
              <button
                onClick={() => setFilterCategory('keuangan')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterCategory === 'keuangan' ? '#d97706' : '#fef3c7',
                  color: filterCategory === 'keuangan' ? '#ffffff' : '#b45309',
                  whiteSpace: 'nowrap'
                }}
              >
                💰 Keuangan
              </button>
              <button
                onClick={() => setFilterCategory('izin')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterCategory === 'izin' ? '#0284c7' : '#e0f2fe',
                  color: filterCategory === 'izin' ? '#ffffff' : '#0369a1',
                  whiteSpace: 'nowrap'
                }}
              >
                📋 Izin
              </button>
            </div>
          </div>

          {/* List Percakapan Kontak */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingThreads && threads.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
                <RotateCw size={18} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
                Memuat percakapan...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.74rem' }}>
                <Inbox size={32} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                Tidak ada percakapan pada filter ini.
              </div>
            ) : (
              filteredThreads.map((th) => {
                const isActive = th.santri_id === activeSantriId;
                const unread = parseInt(th.unread_count) || 0;
                const badge = getTopikBadge(th.last_topik);
                const isSentByAdmin = th.last_sender_role === 'admin';

                return (
                  <div
                    key={th.santri_id}
                    onClick={() => handleSelectThread(th)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      borderBottom: '1px solid #f1f5f9',
                      background: isActive ? '#f0fdf4' : unread > 0 ? '#fefce8' : 'transparent',
                      borderLeft: isActive ? '4px solid #059669' : unread > 0 ? '4px solid #eab308' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Avatar Initials with Online Badge */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: th.jk === 'P'
                          ? 'linear-gradient(135deg, #ec4899, #be185d)'
                          : 'linear-gradient(135deg, #059669, #0f766e)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        {String(th.nama_santri || 'S').substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #ffffff'
                      }} />
                    </div>

                    {/* Meta Santri & Pesan Terakhir */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {th.nama_santri}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: unread > 0 ? '#15803d' : '#94a3b8', fontWeight: unread > 0 ? 800 : 500, flexShrink: 0, marginLeft: '6px' }}>
                          {formatDate(th.last_time)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.68rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#047857' }}>
                          {th.nama_wali || 'Orang Tua Santri'}
                        </span>
                        {th.nama_kelas && th.nama_kelas !== '-' && (
                          <span style={{ background: '#e2e8f0', color: '#475569', padding: '1px 5px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600 }}>
                            {th.nama_kelas}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ fontSize: '0.7rem', color: unread > 0 ? '#0f172a' : '#64748b', fontWeight: unread > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isSentByAdmin && <CheckCheck size={12} color="#059669" style={{ flexShrink: 0 }} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {th.last_message || 'Percakapan baru'}
                          </span>
                        </div>

                        {/* Unread Counter Badge */}
                        {unread > 0 && (
                          <span style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            fontSize: '0.6rem',
                            fontWeight: 900,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                          }}>
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            KOLOM TENGAH: CHAT ACTIVE STREAM & INPUT COMPOSER
        ======================================================== */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f1f5f9',
          minWidth: 0,
          position: 'relative'
        }}>
          {!activeSantriId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#94a3b8' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MessageSquare size={32} color="#64748b" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#334155' }}>Pilih Percakapan Wali Santri</div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '6px', maxWidth: '360px', textAlign: 'center', lineHeight: 1.5 }}>
                Pilih salah satu kontak di sebelah kiri untuk melihat pesan masuk, riwayat konsultasi, serta mengirimkan balasan langsung.
              </div>
            </div>
          ) : (
            <>
              {/* Header Kontak Aktif WhatsApp Style */}
              <div style={{
                padding: '10px 18px',
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                zIndex: 10,
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: activeThreadData?.jk === 'P'
                      ? 'linear-gradient(135deg, #ec4899, #be185d)'
                      : 'linear-gradient(135deg, #059669, #0f766e)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}>
                    {String(activeThreadData?.nama_santri || 'S').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{activeThreadData?.nama_santri || 'Santri'}</span>
                      <span style={{ fontSize: '0.64rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '5px', fontFamily: 'monospace', border: '1px solid #e2e8f0' }}>
                        NIS: {activeThreadData?.nis || '-'}
                      </span>
                      <span style={{ fontSize: '0.64rem', background: activeThreadData?.jk === 'P' ? '#fce7f3' : '#e0f2fe', color: activeThreadData?.jk === 'P' ? '#be185d' : '#0369a1', padding: '1px 7px', borderRadius: '5px', fontWeight: 700 }}>
                        {activeThreadData?.jk === 'P' ? 'Santriwati (P)' : 'Santri (L)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Wali: <strong style={{ color: '#047857' }}>{activeThreadData?.nama_wali || 'Orang Tua'}</strong></span>
                      {activeThreadData?.nama_kelas && activeThreadData?.nama_kelas !== '-' && <span>• Kelas {activeThreadData.nama_kelas}</span>}
                      {activeThreadData?.nama_asrama && activeThreadData?.nama_asrama !== '-' && <span>• {activeThreadData.nama_asrama}</span>}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                      title="Buka Chat WhatsApp Web dengan Wali Santri"
                    >
                      <Phone size={13} />
                      <span>Chat WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: showInfoDrawer ? '#0f172a' : '#f8fafc',
                      color: showInfoDrawer ? '#ffffff' : '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Buka Panel Informasi Santri & Wali"
                  >
                    <Info size={13} />
                    <span>Info Profil</span>
                  </button>
                </div>
              </div>

              {/* Message Stream Area - WhatsApp Texture Feel */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#e5ddd5',
                backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}>
                {loadingMessages && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '0.76rem', color: '#64748b' }}>
                    <RotateCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
                    Memuat percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    margin: 'auto',
                    maxWidth: '380px',
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <MessageSquare size={32} color="#059669" style={{ margin: '0 auto 8px' }} />
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>Kanal Percakapan Siap</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Kirim pesan atau informasi pertama Anda kepada orang tua santri melalui kolom di bawah.
                    </span>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isAdmin = m.pengirim_role === 'admin';
                    const showDateHeader =
                      idx === 0 || formatDate(m.created_at) !== formatDate(messages[idx - 1].created_at);
                    const tagInfo = getTopikBadge(m.topik);

                    return (
                      <React.Fragment key={m.id || idx}>
                        {showDateHeader && (
                          <div style={{ textAlign: 'center', margin: '8px 0' }}>
                            <span style={{
                              background: 'rgba(255, 255, 255, 0.85)',
                              color: '#475569',
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              padding: '3px 12px',
                              borderRadius: '12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                            }}>
                              {formatDate(m.created_at)}
                            </span>
                          </div>
                        )}

                        <div style={{
                          display: 'flex',
                          justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: '8px'
                        }}>
                          {!isAdmin && (
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              {String(m.pengirim_nama || 'W').substring(0, 1)}
                            </div>
                          )}

                          <div style={{
                            maxWidth: '72%',
                            padding: '10px 14px',
                            borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                            background: isAdmin
                              ? 'linear-gradient(135deg, #065e52 0%, #047857 100%)'
                              : '#ffffff',
                            color: isAdmin ? '#ffffff' : '#0f172a',
                            border: isAdmin ? 'none' : '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                            wordBreak: 'break-word',
                            position: 'relative'
                          }}>
                            {/* Kategori / Topik Badge */}
                            {m.topik && (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                marginBottom: '6px',
                                background: isAdmin ? 'rgba(255, 255, 255, 0.15)' : tagInfo.bg,
                                color: isAdmin ? '#a7f3d0' : tagInfo.text,
                                border: isAdmin ? '1px solid rgba(255, 255, 255, 0.2)' : `1px solid ${tagInfo.border}`
                              }}>
                                <span>{tagInfo.icon}</span>
                                <span>{m.topik}</span>
                              </div>
                            )}

                            {/* Nama Pengirim */}
                            <div style={{
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              color: isAdmin ? '#6ee7b7' : '#047857',
                              marginBottom: '3px'
                            }}>
                              {isAdmin ? '🛡️ Admin Pondok Pesantren' : `👤 ${m.pengirim_nama} (Wali Santri)`}
                            </div>

                            {/* Isi Pesan */}
                            <div style={{
                              fontSize: '0.82rem',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                              color: isAdmin ? '#f0fdf4' : '#1e293b'
                            }}>
                              {m.isi_pesan}
                            </div>

                            {/* Waktu Pesan & Checkmark */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px',
                              marginTop: '6px',
                              fontSize: '0.62rem',
                              color: isAdmin ? 'rgba(255,255,255,0.7)' : '#94a3b8'
                            }}>
                              <span>{formatTime(m.created_at)}</span>
                              {isAdmin && <CheckCheck size={13} color="#6ee7b7" />}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* QUICK REPLIES / TEMPLATE CHIPS BAR */}
              <div style={{
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '8px 18px 4px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} color="#059669" /> Template Balas:
                </span>
                {QUICK_REPLIES.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReply(qr)}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e0f2fe';
                      e.currentTarget.style.color = '#0284c7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9';
                      e.currentTarget.style.color = '#334155';
                    }}
                    title={qr.text}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* FORM BALAS PESAN / COMPOSER */}
              <form
                onSubmit={handleSendReply}
                style={{
                  background: '#ffffff',
                  padding: '10px 18px 14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>
                    Kategori Balasan:
                  </span>
                  <select
                    value={replyTopik}
                    onChange={(e) => setReplyTopik(e.target.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#334155',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Tanggapan Admin">💬 Tanggapan Umum Admin</option>
                    <option value="Konfirmasi Keuangan">💰 Konfirmasi Keuangan & SPP</option>
                    <option value="Persetujuan Izin">📋 Persetujuan Izin Santri</option>
                    <option value="Informasi Kesehatan">🩺 Informasi Kesehatan Santri</option>
                    <option value="Laporan Belajar">📖 Laporan Belajar & Tahfidz</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Tulis balasan resmi untuk ${activeThreadData?.nama_wali || 'Orang Tua Santri'}...`}
                    disabled={sendingReply}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '24px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '0.8rem',
                      outline: 'none',
                      color: '#0f172a',
                      transition: 'border 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#059669'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingReply}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '24px',
                      border: 'none',
                      background: !replyText.trim() || sendingReply
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: !replyText.trim() || sendingReply ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Send size={14} />
                    <span>Kirim Balasan</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* ========================================================
            KOLOM KANAN (DRAWER): INFO PROFIL SANTRI & WALI
        ======================================================== */}
        {showInfoDrawer && activeThreadData && (
          <div style={{
            width: '290px',
            borderLeft: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '16px',
            gap: '14px',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                Profil Santri &amp; Wali
              </div>
              <button
                onClick={() => setShowInfoDrawer(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar & Identitas */}
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: activeThreadData?.jk === 'P'
                  ? 'linear-gradient(135deg, #ec4899, #be185d)'
                  : 'linear-gradient(135deg, #059669, #0f766e)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                margin: '0 auto 8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
              }}>
                {String(activeThreadData?.nama_santri || 'S').substring(0, 2).toUpperCase()}
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                {activeThreadData?.nama_santri}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                NIS: <strong style={{ color: '#0f172a' }}>{activeThreadData?.nis || '-'}</strong>
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                background: '#dcfce7',
                color: '#15803d'
              }}>
                Status: {activeThreadData?.status || 'Aktif'}
              </span>
            </div>

            {/* Info Akademik */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                INFORMASI KELAS &amp; ASRAMA
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748b' }}>Kelas:</span>
                <strong style={{ color: '#0f172a' }}>{activeThreadData?.nama_kelas || '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748b' }}>Asrama:</span>
                <strong style={{ color: '#0f172a' }}>{activeThreadData?.nama_asrama || '-'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748b' }}>Kamar:</span>
                <strong style={{ color: '#0f172a' }}>{activeThreadData?.nama_kamar || '-'}</strong>
              </div>
            </div>

            {/* Info Wali & Kontak */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                KONTAK ORANG TUA / WALI
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748b' }}>Nama Wali:</span>
                <strong style={{ color: '#047857' }}>{activeThreadData?.nama_wali || 'Orang Tua'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748b' }}>No. Telepon:</span>
                <strong style={{ color: '#0f172a' }}>{activeThreadData?.no_hp_wali || '-'}</strong>
              </div>

              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#25d366',
                    color: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: '4px',
                    boxShadow: '0 2px 6px rgba(37, 211, 102, 0.25)'
                  }}
                >
                  <Phone size={13} />
                  <span>Buka WhatsApp Web</span>
                </a>
              )}
            </div>

            {/* Keamanan & Catatan */}
            <div style={{ fontSize: '0.66rem', color: '#94a3b8', lineHeight: 1.4, textAlign: 'center' }}>
              Seluruh riwayat percakapan tersimpan aman dan terenkripsi pada sistem database pesantren.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
