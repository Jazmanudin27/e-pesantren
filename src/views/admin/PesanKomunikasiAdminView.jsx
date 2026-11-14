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
  Paperclip
} from 'lucide-react';
import { toastSuccess, showError } from '../../utils/alert.util';

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
            nama_santri: res.data.data.santri.nama_santri,
            nama_wali: res.data.data.santri.nama_wali,
            nis: res.data.data.santri.nis,
            nama_asrama: res.data.data.santri.nama_asrama,
            nama_kamar: res.data.data.santri.nama_kamar
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
    }, 8000);
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

  const filteredThreads = threads.filter((th) => {
    if (!searchThread.trim()) return true;
    const q = searchThread.toLowerCase();
    return (
      (th.nama_santri || '').toLowerCase().includes(q) ||
      (th.nama_wali || '').toLowerCase().includes(q) ||
      (th.nis || '').toLowerCase().includes(q) ||
      (th.last_pesan || '').toLowerCase().includes(q)
    );
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
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', boxSizing: 'border-box' }}>
      {/* 1. TOP HEADER BANNER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0d766e, #059669)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(13, 118, 110, 0.28)'
          }}>
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Pusat Pesan &amp; Komunikasi Orang Tua</span>
              <span style={{ fontSize: '0.64rem', background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Resmi Pesantren
              </span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.74rem', margin: '2px 0 0' }}>
              Kelola pertanyaan, konsultasi, dan komunikasi dua arah dengan wali santri secara real-time.
            </p>
          </div>
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
            padding: '7px 13px',
            borderRadius: '10px',
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

      {/* 2. CHAT WORKSPACE (SPLIT 2 COLUMNS MODERN INLINE LAYOUT) */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        {/* ========================================================
            KOLOM KIRI: DAFTAR KONTAK / PERCAKAPAN (WIDTH: 320px)
        ======================================================== */}
        <div style={{
          width: '320px',
          minWidth: '280px',
          maxWidth: '360px',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          background: '#f8fafc'
        }}>
          {/* Search Box Kontak */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: '#f1f5f9',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '0 10px'
            }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                value={searchThread}
                onChange={(e) => setSearchThread(e.target.value)}
                placeholder="Cari santri / wali..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: '8px 8px',
                  fontSize: '0.74rem',
                  color: '#1e293b',
                  fontWeight: 600,
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* List Percakapan Kontak */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingThreads && threads.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
                Memuat percakapan...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.74rem' }}>
                <Inbox size={32} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                Tidak ada pesan komunikasi ditemukan.
              </div>
            ) : (
              filteredThreads.map((th) => {
                const isActive = th.santri_id === activeSantriId;
                const hasUnread = (th.unread_admin || 0) > 0;

                return (
                  <div
                    key={th.santri_id}
                    onClick={() => handleSelectThread(th)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      borderBottom: '1px solid #f1f5f9',
                      background: isActive ? '#f0fdfa' : 'transparent',
                      borderLeft: isActive ? '4px solid #0d766e' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Avatar Initials */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0d766e, #059669)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      boxShadow: '0 2px 6px rgba(13, 118, 110, 0.25)',
                      flexShrink: 0
                    }}>
                      {String(th.nama_santri || 'S').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Meta Santri & Pesan Terakhir */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {th.nama_santri}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', flexShrink: 0, marginLeft: '6px' }}>
                          {formatDate(th.last_time)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0d766e', marginBottom: '2px' }}>
                        {th.nama_wali || 'Orang Tua Santri'}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {th.last_pesan || 'Percakapan baru'}
                      </div>
                    </div>

                    {/* Unread Badge */}
                    {hasUnread && (
                      <span style={{
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.6rem',
                        fontWeight: 900,
                        padding: '2px 6px',
                        borderRadius: '10px',
                        flexShrink: 0
                      }}>
                        {th.unread_admin}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            KOLOM KANAN: CHAT ACTIVE STREAM & INPUT FORM
        ======================================================== */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f1f5f9',
          minWidth: 0
        }}>
          {!activeSantriId ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', color: '#94a3b8' }}>
              <MessageSquare size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#475569' }}>Pilih Percakapan Wali Santri</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', maxWidth: '340px', textAlign: 'center' }}>
                Pilih salah satu kontak santri di kolom kiri untuk melihat riwayat pesan dan mengirimkan balasan.
              </div>
            </div>
          ) : (
            <>
              {/* Header Kontak Aktif */}
              <div style={{
                padding: '12px 18px',
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#f0fdfa',
                    border: '1px solid #ccfbf1',
                    color: '#0d766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800
                  }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{activeThreadData?.nama_santri || 'Santri'}</span>
                      <span style={{ fontSize: '0.62rem', background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '6px', fontFamily: 'monospace' }}>
                        NIS: {activeThreadData?.nis || '-'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '1px' }}>
                      Wali: <strong style={{ color: '#334155' }}>{activeThreadData?.nama_wali || 'Orang Tua Santri'}</strong>
                      {activeThreadData?.nama_kamar ? ` • Kamar ${activeThreadData.nama_kamar}` : ''}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#059669',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '4px 10px',
                  borderRadius: '12px'
                }}>
                  ● Kanal Komunikasi Terhubung
                </span>
              </div>

              {/* Message Stream Area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundImage: 'radial-gradient(#cbd5e1 0.75px, transparent 0.75px)',
                backgroundSize: '16px 16px'
              }}>
                {loadingMessages && messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                    Memuat riwayat percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '0.76rem', color: '#94a3b8' }}>
                    Belum ada riwayat pesan untuk santri ini.
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isAdmin = m.pengirim_role === 'admin';
                    const showDateHeader =
                      idx === 0 || formatDate(m.created_at) !== formatDate(messages[idx - 1].created_at);

                    return (
                      <React.Fragment key={m.id || idx}>
                        {showDateHeader && (
                          <div style={{ textAlign: 'center', margin: '8px 0' }}>
                            <span style={{
                              background: '#e2e8f0',
                              color: '#475569',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '2px 10px',
                              borderRadius: '12px'
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
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#e2e8f0',
                              color: '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {String(m.pengirim_nama || 'W').substring(0, 1)}
                            </div>
                          )}

                          <div style={{
                            maxWidth: '72%',
                            padding: '10px 14px',
                            borderRadius: isAdmin ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            background: isAdmin
                              ? 'linear-gradient(135deg, #0d766e 0%, #047857 100%)'
                              : '#ffffff',
                            color: isAdmin ? '#ffffff' : '#0f172a',
                            border: isAdmin ? 'none' : '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            wordBreak: 'break-word'
                          }}>
                            {/* Topik Badge */}
                            {m.topik && (
                              <div style={{
                                fontSize: '0.62rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                marginBottom: '4px',
                                color: isAdmin ? '#a7f3d0' : '#0d766e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <span>🏷️</span>
                                <span>{m.topik}</span>
                              </div>
                            )}

                            {/* Nama Pengirim */}
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: isAdmin ? '#d1fae5' : '#1e293b',
                              marginBottom: '3px'
                            }}>
                              {m.pengirim_nama}
                            </div>

                            {/* Isi Pesan */}
                            <div style={{
                              fontSize: '0.78rem',
                              lineHeight: 1.45,
                              whiteSpace: 'pre-wrap'
                            }}>
                              {m.isi_pesan}
                            </div>

                            {/* Waktu Pesan */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px',
                              marginTop: '4px',
                              fontSize: '0.6rem',
                              color: isAdmin ? 'rgba(255,255,255,0.75)' : '#94a3b8'
                            }}>
                              <span>{formatTime(m.created_at)}</span>
                              {isAdmin && <CheckCheck size={12} color="#a7f3d0" />}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Balas Pesan */}
              <form
                onSubmit={handleSendReply}
                style={{
                  background: '#ffffff',
                  padding: '12px 18px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
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
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#334155',
                      outline: 'none'
                    }}
                  >
                    <option value="Tanggapan Admin">Tanggapan Admin</option>
                    <option value="Informasi Kesehatan">Informasi Kesehatan</option>
                    <option value="Persetujuan Izin">Persetujuan Izin</option>
                    <option value="Konfirmasi Keuangan">Konfirmasi Keuangan</option>
                    <option value="Laporan Belajar">Laporan Belajar</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Tulis balasan resmi untuk ${activeThreadData?.nama_wali || 'Orang Tua'}...`}
                    disabled={sendingReply}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '0.78rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingReply}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: !replyText.trim() || sendingReply
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #0d766e 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      cursor: !replyText.trim() || sendingReply ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 10px rgba(13, 118, 110, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Send size={14} />
                    <span>Balas</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
