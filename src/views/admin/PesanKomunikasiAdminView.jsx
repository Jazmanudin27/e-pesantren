import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  MessageSquare,
  Search,
  RotateCw,
  Send,
  User,
  ShieldCheck,
  Clock,
  CheckCheck,
  HelpCircle,
  Inbox,
  Sparkles,
  PhoneCall
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
        // Jika belum ada thread aktif dan ada data, pilih yang pertama
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
      if (document.visibilityState === 'visible') {
        fetchThreads(true);
        if (activeSantriId) {
          fetchMessagesForSantri(activeSantriId, true);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeSantriId) {
      fetchMessagesForSantri(activeSantriId);
    }
  }, [activeSantriId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectThread = (th) => {
    setActiveSantriId(th.santri_id);
    setActiveThreadData(th);
    // Reset unread count lokal
    setThreads((prev) =>
      prev.map((item) => (item.santri_id === th.santri_id ? { ...item, unread_admin: 0 } : item))
    );
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    const cleanText = replyText.trim();
    if (!cleanText || sendingReply || !activeSantriId) return;

    try {
      setSendingReply(true);
      const res = await axios.post('/api/pesan/admin/reply', {
        santri_id: activeSantriId,
        admin_nama: 'Admin Pesantren Nurul Wafa',
        topik: replyTopik,
        isi_pesan: cleanText
      });

      if (res.data?.success) {
        setReplyText('');
        toastSuccess('Terkirim', 'Pesan balasan Anda telah terkirim dan ternotifikasi ke Orang Tua.');
        await fetchMessagesForSantri(activeSantriId, true);
        await fetchThreads(true);
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengirim balasan.');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message || 'Koneksi terganggu.');
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
    <div className="admin-content-inner" style={{ padding: '20px' }}>
      {/* 1. TOP HEADER (DISAMAKAN PERSIS DENGAN INFORMASI & TABUNGAN) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '18px 20px',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0d766e, #059669)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(13, 118, 110, 0.3)'
          }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Pusat Pesan &amp; Komunikasi Orang Tua</span>
              <span style={{ fontSize: '0.68rem', background: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Resmi Pesantren
              </span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '3px 0 0' }}>
              Kelola pertanyaan, konsultasi, dan komunikasi dua arah dengan wali santri dalam satu platform.
            </p>
          </div>
        </div>

        <button
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
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155'
          }}
          title="Segarkan Chat"
        >
          <RotateCw size={14} className={loadingThreads ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* 2. CHAT WORKSPACE (SPLIT 2 COLUMNS) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] max-h-[75vh]">
        {/* LEFT COLUMN: THREAD LIST (4 COLS) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchThread}
                onChange={(e) => setSearchThread(e.target.value)}
                placeholder="Cari santri / wali..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingThreads && threads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Memuat percakapan...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Inbox size={32} className="mx-auto mb-2 text-slate-300" />
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
                    className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                      isActive ? 'bg-teal-50 border-l-4 border-teal-600' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                      {String(th.nama_santri || 'S').substring(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="font-extrabold text-xs text-slate-800 truncate">
                          {th.nama_santri}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDate(th.last_time)}
                        </span>
                      </div>

                      <div className="text-[11px] font-semibold text-teal-700 truncate">
                        {th.nama_wali || 'Orang Tua'}
                      </div>

                      <div className="text-xs text-slate-500 truncate mt-1 leading-snug">
                        {th.last_pesan}
                      </div>
                    </div>

                    {hasUnread && (
                      <span className="bg-emerald-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
                        {th.unread_admin}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION + REPLY BOX (8 COLS) */}
        <div className="md:col-span-8 flex flex-col bg-slate-100 min-h-[500px]">
          {!activeSantriId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare size={48} className="text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">Pilih Percakapan Wali Santri</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Pilih salah satu kontak santri di kolom kiri untuk melihat riwayat pesan dan mengirimkan balasan.
              </p>
            </div>
          ) : (
            <>
              {/* Active Header */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-800 flex items-center gap-2">
                      <span>{activeThreadData?.nama_santri || 'Santri'}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                        NIS: {activeThreadData?.nis || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Wali: <span className="font-semibold text-slate-700">{activeThreadData?.nama_wali || 'Orang Tua'}</span>
                      {activeThreadData?.nama_kamar ? ` • Kamar ${activeThreadData.nama_kamar}` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                    Kanal Komunikasi Terhubung
                  </span>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    Memuat riwayat percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
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
                          <div className="text-center my-2">
                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full">
                              {formatDate(m.created_at)}
                            </span>
                          </div>
                        )}

                        <div className={`flex gap-2.5 items-end ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          {!isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                              {String(m.pengirim_nama || 'W').substring(0, 1)}
                            </div>
                          )}

                          <div
                            className={`max-w-[78%] p-3 rounded-2xl shadow-sm text-xs ${
                              isAdmin
                                ? 'bg-gradient-to-r from-teal-700 to-emerald-700 text-white rounded-br-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                            }`}
                          >
                            {/* Topik / Header Tag */}
                            {m.topik && (
                              <div
                                className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 ${
                                  isAdmin ? 'text-teal-200' : 'text-teal-700'
                                }`}
                              >
                                🏷️ {m.topik}
                              </div>
                            )}

                            {/* Sender Name */}
                            <div
                              className={`text-[11px] font-extrabold mb-1 ${
                                isAdmin ? 'text-emerald-100' : 'text-slate-900'
                              }`}
                            >
                              {m.pengirim_nama}
                            </div>

                            {/* Message Content */}
                            <div className="leading-relaxed whitespace-pre-wrap break-words">
                              {m.isi_pesan}
                            </div>

                            {/* Time & Double Check */}
                            <div
                              className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
                                isAdmin ? 'text-teal-200' : 'text-slate-400'
                              }`}
                            >
                              <span>{formatTime(m.created_at)}</span>
                              {isAdmin && <CheckCheck size={13} className="text-emerald-200" />}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Kategori Balasan:</span>
                  <select
                    value={replyTopik}
                    onChange={(e) => setReplyTopik(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 outline-none"
                  >
                    <option value="Tanggapan Admin">Tanggapan Admin</option>
                    <option value="Informasi Kesehatan">Informasi Kesehatan</option>
                    <option value="Persetujuan Izin">Persetujuan Izin</option>
                    <option value="Konfirmasi Keuangan">Konfirmasi Keuangan</option>
                    <option value="Laporan Belajar">Laporan Belajar</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Tulis balasan resmi untuk ${activeThreadData?.nama_wali || 'Orang Tua'}...`}
                    disabled={sendingReply}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-teal-600 font-medium"
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingReply}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md hover:from-teal-700 hover:to-emerald-800 disabled:opacity-50 transition"
                  >
                    <Send size={15} /> Balas
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

