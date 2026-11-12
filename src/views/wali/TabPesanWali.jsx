import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Send, 
  RotateCw, 
  MessageSquare, 
  ShieldCheck, 
  Clock, 
  CheckCheck, 
  Sparkles,
  HelpCircle,
  Building2
} from 'lucide-react';
import { toastSuccess, showError } from '../../utils/alert.util';

const TOPIK_LIST = [
  'Pertanyaan Umum',
  'Kesehatan Santri',
  'Izin & Kepulangan',
  'Keuangan & SPP',
  'Pendidikan & Kitab'
];

export default function TabPesanWali({
  santriId,
  santriName = 'Santri',
  waliName = 'Orang Tua Santri',
  onBack
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedTopik, setSelectedTopik] = useState('Pertanyaan Umum');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (silent = false) => {
    if (!santriId) return;
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`/api/pesan/wali/${santriId}`);
      if (res.data?.success) {
        setMessages(res.data.data?.messages || []);
      }
    } catch (err) {
      console.warn('Gagal memuat percakapan pesan:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages(true);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [santriId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || sending) return;

    try {
      setSending(true);
      const res = await axios.post('/api/pesan/wali', {
        santri_id: santriId,
        nama_santri: santriName,
        nama_wali: waliName,
        topik: selectedTopik,
        isi_pesan: cleanText
      });

      if (res.data?.success) {
        setInputText('');
        await fetchMessages(true);
        toastSuccess('Terkirim', 'Pesan Anda telah diteruskan ke Admin Pesantren.');
      } else {
        showError('Gagal', res.data?.message || 'Gagal mengirim pesan.');
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message || 'Koneksi terganggu.');
    } finally {
      setSending(false);
    }
  };

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxHeight: '100vh',
      background: '#f1f5f9',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* 1. TOP HEADER (DISAMAKAN DENGAN TAB LAIN PORTAL WALI - COMPACT) */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        padding: '12px 14px 14px',
        color: '#ffffff',
        borderBottomLeftRadius: '18px',
        borderBottomRightRadius: '18px',
        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.2)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <div>
              <h2 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>Pesan &amp; Tanya Admin</span>
                <ShieldCheck size={14} color="#a7f3d0" />
              </h2>
              <div style={{ fontSize: '0.62rem', color: '#d1fae5', marginTop: '1px', fontWeight: 600 }}>
                Kanal Komunikasi Resmi Pondok Pesantren
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchMessages()}
            disabled={loading}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Segarkan Chat"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 2. QUICK TOPIC BAR - COMPACT */}
      <div style={{
        background: '#ffffff',
        padding: '6px 10px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        scrollbarWidth: 'none'
      }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', marginRight: '2px' }}>
          Topik:
        </span>
        {TOPIK_LIST.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopik(t)}
            style={{
              padding: '3px 8px',
              borderRadius: '999px',
              border: selectedTopik === t ? '1px solid #059669' : '1px solid #e2e8f0',
              background: selectedTopik === t ? '#ecfdf5' : '#f8fafc',
              color: selectedTopik === t ? '#065f46' : '#64748b',
              fontSize: '0.62rem',
              fontWeight: selectedTopik === t ? 800 : 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 3. MESSAGE CHAT AREA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Intro Greeting Card - Compact */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '9px 11px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(16, 185, 129, 0.08)',
          marginBottom: '4px'
        }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}>
            <Sparkles size={13} color="#059669" /> Layanan Konsultasi &amp; Tanya Jawab Orang Tua
          </div>
          <div style={{ fontSize: '0.64rem', color: '#166534', marginTop: '2px', lineHeight: 1.35 }}>
            Sampaikan pertanyaan, izin khusus, kendala santri, atau saran kepada Asatidz &amp; Pengurus.
          </div>
        </div>
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#059669',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px'
          }}>
            <MessageSquare size={16} />
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065f46' }}>
            Layanan Komunikasi Wali Santri & Pesantren
          </div>
          <div style={{ fontSize: '0.68rem', color: '#047857', marginTop: '2px', lineHeight: 1.35 }}>
            Sampaikan pertanyaan, izin, konfirmasi biaya, atau kendala seputar santri <b>{santriName}</b>. Admin pesantren akan membalas pesan Anda di sini.
          </div>
        </div>

        {loading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.78rem' }}>
            Memuat percakapan...
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 16px',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <HelpCircle size={36} color="#cbd5e1" />
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
              Belum Ada Percakapan
            </div>
            <div style={{ fontSize: '0.72rem', maxWidth: '280px', lineHeight: 1.4 }}>
              Ketik pertanyaan atau pesan pertama Anda di bawah untuk memulai percakapan langsung dengan admin pesantren.
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.pengirim_role === 'wali';
            const showDateHeader = idx === 0 || formatDate(msg.created_at) !== formatDate(messages[idx - 1].created_at);

            return (
              <React.Fragment key={msg.id || idx}>
                {showDateHeader && (
                  <div style={{ textAlign: 'center', margin: '6px 0' }}>
                    <span style={{
                      background: '#e2e8f0',
                      color: '#475569',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px'
                    }}>
                      {formatDate(msg.created_at)}
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  gap: '8px',
                  alignItems: 'flex-end'
                }}>
                  {!isMe && (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <img src="/nwf.png" alt="Admin" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                    </div>
                  )}

                  <div style={{
                    maxWidth: '82%',
                    background: isMe ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#ffffff',
                    color: isMe ? '#ffffff' : '#0f172a',
                    padding: '9px 12px',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: isMe ? '0 3px 10px rgba(5, 150, 105, 0.28)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: isMe ? 'none' : '1px solid #e2e8f0'
                  }}>
                    {/* Topik Badge */}
                    {msg.topik && (
                      <div style={{
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: isMe ? '#a7f3d0' : '#0d9488',
                        marginBottom: '3px'
                      }}>
                        🏷️ {msg.topik}
                      </div>
                    )}

                    {/* Sender Name if Admin */}
                    {!isMe && (
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', marginBottom: '2px' }}>
                        {msg.pengirim_nama || 'Admin Pesantren'}
                      </div>
                    )}

                    {/* Body Text */}
                    <div style={{
                      fontSize: '0.74rem',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {msg.isi_pesan}
                    </div>

                    {/* Meta Time & Check */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '3px',
                      marginTop: '3px',
                      fontSize: '0.54rem',
                      color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8'
                    }}>
                      <span>{formatTime(msg.created_at)}</span>
                      {isMe && <CheckCheck size={11} color="#a7f3d0" />}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. CHAT INPUT BAR - COMPACT */}
      <form
        onSubmit={handleSend}
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Tanya seputar ${selectedTopik.toLowerCase()}...`}
          disabled={sending}
          style={{
            flex: 1,
            background: '#f8fafc',
            border: '1.2px solid #cbd5e1',
            borderRadius: '20px',
            padding: '7px 12px',
            fontSize: '0.74rem',
            color: '#0f172a',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: inputText.trim() && !sending
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !sending ? 'pointer' : 'not-allowed',
            boxShadow: inputText.trim() && !sending ? '0 4px 12px rgba(5, 150, 105, 0.35)' : 'none',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

