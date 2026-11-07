import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  MessageSquare,
  Settings,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Smartphone,
  Users,
  DollarSign,
  Search,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../utils/alert.util';

export default function WhatsAppGatewayView() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'settings' | 'logs'

  // Settings State
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState({
    provider: 'fonnte',
    api_token: '',
    server_url: 'https://api.fonnte.com/send',
    sender_number: '',
    is_active: 1,
    auto_sakit: 1,
    auto_izin: 1,
    auto_alfa: 1,
    auto_tazir: 1,
    auto_perizinan: 1,
    delay_seconds: 2,
    footer_text: 'Pondok Pesantren Nurul Wafa'
  });
  const [stats, setStats] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Test Send State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Broadcast Tagihan State
  const [loadingTunggakan, setLoadingTunggakan] = useState(false);
  const [tunggakanList, setTunggakanList] = useState([]);
  const [totalNominal, setTotalNominal] = useState(0);
  const [periodeList, setPeriodeList] = useState([]);
  const [filterPeriode, setFilterPeriode] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [searchTunggakan, setSearchTunggakan] = useState('');
  const [selectedSantriIds, setSelectedSantriIds] = useState([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [templatePesan, setTemplatePesan] = useState(
`Assalamu'alaikum Wr. Wb.

Yth. Bapak/Ibu Wali dari *{nama_santri}* (Kelas {nama_kelas})
Pondok Pesantren Nurul Wafa

Menginformasikan rekapitulasi kewajiban administrasi/SPP ananda yang tercatat pada sistem kami:

*Rincian Tagihan:*
{rincian_tagihan}

*Total Belum Lunas:* {total_tagihan}

Pembayaran dapat dilakukan melalui loket kantor pesantren atau via transfer/QRIS melalui aplikasi Portal Wali Santri.

Atas perhatian dan kerja samanya, kami haturkan terima kasih.
Wassalamu'alaikum Wr. Wb.
_Biro Administrasi & Keuangan Pesantren_`
  );

  // Logs State
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterKategoriLog, setFilterKategoriLog] = useState('semua');
  const [filterStatusLog, setFilterStatusLog] = useState('semua');
  const [pageLog, setPageLog] = useState(1);

  // Load Initial Settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await axios.get('/api/whatsapp/settings');
      if (res.data?.success && res.data.data) {
        const s = res.data.data.settings;
        setSettings({
          ...s,
          api_token: s.masked_token || ''
        });
        setStats(res.data.data.stats || {});
      }
    } catch (err) {
      console.warn('Gagal memuat pengaturan WA:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Load Tunggakan
  const fetchTunggakan = async () => {
    try {
      setLoadingTunggakan(true);
      const params = {};
      if (filterPeriode !== 'Semua') params.periode_bulan = filterPeriode;
      if (filterKelas !== 'Semua') params.kelas_id = filterKelas;
      if (searchTunggakan.trim()) params.search = searchTunggakan.trim();

      const res = await axios.get('/api/whatsapp/tunggakan', { params });
      if (res.data?.success && res.data.data) {
        const list = res.data.data.santri_list || [];
        setTunggakanList(list);
        setTotalNominal(res.data.data.total_nominal || 0);
        setPeriodeList(res.data.data.periode_list || []);
        
        // Auto select all valid numbers
        const validIds = list.filter(item => item.no_wa_wali && String(item.no_wa_wali).trim() !== '-' && String(item.no_wa_wali).trim() !== '').map(item => item.santri_id);
        setSelectedSantriIds(validIds);
      }
    } catch (err) {
      console.warn('Gagal memuat data tunggakan:', err);
    } finally {
      setLoadingTunggakan(false);
    }
  };

  // Load Logs
  const fetchLogs = async (p = 1) => {
    try {
      setLoadingLogs(true);
      const params = { page: p, limit: 30 };
      if (filterKategoriLog !== 'semua') params.kategori = filterKategoriLog;
      if (filterStatusLog !== 'semua') params.status = filterStatusLog;

      const res = await axios.get('/api/whatsapp/logs', { params });
      if (res.data?.success && res.data.data) {
        setLogs(res.data.data.logs || []);
        setTotalLogs(res.data.data.total || 0);
        setPageLog(p);
      }
    } catch (err) {
      console.warn('Gagal memuat log WA:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'broadcast') {
      fetchTunggakan();
    } else if (activeTab === 'logs') {
      fetchLogs(1);
    }
  }, [activeTab, filterPeriode, filterKelas]);

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await axios.post('/api/whatsapp/settings', settings);
      if (res.data?.success) {
        toastSuccess('Disimpan', 'Pengaturan WhatsApp Gateway berhasil diperbarui.');
        fetchSettings();
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Send Test
  const handleTestSend = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      showError('Perhatian', 'Masukkan nomor WhatsApp tujuan tes');
      return;
    }
    try {
      setSendingTest(true);
      const res = await axios.post('/api/whatsapp/test', {
        phone: testPhone.trim(),
        message: testMessage.trim() || undefined
      });
      if (res.data?.success) {
        toastSuccess('Terkirim!', 'Pesan WhatsApp tes berhasil terkirim.');
        fetchSettings();
      }
    } catch (err) {
      showError('Gagal Kirim Tes', err.response?.data?.message || 'Pastikan API Token valid dan nomor WA aktif.');
    } finally {
      setSendingTest(false);
    }
  };

  // Handle Selection
  const toggleSelectAll = () => {
    const validIds = tunggakanList
      .filter(item => item.no_wa_wali && String(item.no_wa_wali).trim() !== '-' && String(item.no_wa_wali).trim() !== '')
      .map(item => item.santri_id);

    if (selectedSantriIds.length === validIds.length) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(validIds);
    }
  };

  const toggleSelectSantri = (id) => {
    if (selectedSantriIds.includes(id)) {
      setSelectedSantriIds(selectedSantriIds.filter(i => i !== id));
    } else {
      setSelectedSantriIds([...selectedSantriIds, id]);
    }
  };

  // Handle Send Broadcast
  const handleSendBroadcast = async () => {
    if (selectedSantriIds.length === 0) {
      showError('Pilih Santri', 'Pilih minimal 1 santri untuk dikirimkan broadcast tagihan.');
      return;
    }

    const ok = await showConfirm(
      'Kirim Broadcast Tagihan?',
      `Sistem akan mengirimkan pesan WhatsApp rincian tagihan ke ${selectedSantriIds.length} wali santri terpilih dengan jeda aman anti-spam (${settings.delay_seconds || 2} detik per nomor). Lanjutkan?`
    );
    if (!ok) return;

    try {
      setSendingBroadcast(true);
      const res = await axios.post('/api/whatsapp/broadcast-tagihan', {
        santri_ids: selectedSantriIds,
        template_pesan: templatePesan,
        delay_seconds: settings.delay_seconds || 2
      });

      if (res.data?.success) {
        toastSuccess('Broadcast Diproses', res.data.message || 'Pengiriman sedang berlangsung di latar belakang.');
        setActiveTab('logs');
      }
    } catch (err) {
      showError('Gagal Broadcast', err.response?.data?.message || 'Terjadi kesalahan saat memproses broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  return (
    <div className="admin-content-inner" style={{ padding: '20px' }}>
      {/* 1. TOP HEADER */}
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
          }}>
            <Smartphone size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>WhatsApp Gateway &amp; Broadcast</span>
              <span style={{
                fontSize: '0.68rem',
                background: settings.is_active ? '#ecfdf5' : '#fef2f2',
                color: settings.is_active ? '#047857' : '#b91c1c',
                border: `1px solid ${settings.is_active ? '#a7f3d0' : '#fecaca'}`,
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 800
              }}>
                {settings.is_active ? '● GATEWAY AKTIF' : '○ NONAKTIF'}
              </span>
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0' }}>
              Broadcast tagihan SPP jatuh tempo ke wali santri &amp; pengiriman notifikasi otomatis santri sakit, izin, atau ta'zir via Fonnte / Wablas.
            </p>
          </div>
        </div>

        {/* Action Tabs Navigation */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('broadcast')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'broadcast' ? '#ffffff' : 'transparent',
              color: activeTab === 'broadcast' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'broadcast' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Send size={15} color={activeTab === 'broadcast' ? '#059669' : '#64748b'} />
            <span>Broadcast Tagihan</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'settings' ? '#ffffff' : 'transparent',
              color: activeTab === 'settings' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'settings' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={15} color={activeTab === 'settings' ? '#0284c7' : '#64748b'} />
            <span>Pengaturan Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'logs' ? '#ffffff' : 'transparent',
              color: activeTab === 'logs' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'logs' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={15} color={activeTab === 'logs' ? '#d97706' : '#64748b'} />
            <span>Riwayat Log ({stats.total_logs || 0})</span>
          </button>
        </div>
      </div>

      {/* 2. STATS BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
        marginBottom: '18px'
      }}>
        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Terkirim Hari Ini</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
            {stats.today_sent || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>pesan</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Pesan Sukses</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
            {stats.total_sent || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>pesan</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Pesan Gagal</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stats.total_failed > 0 ? '#ef4444' : '#64748b', marginTop: '4px' }}>
            {stats.total_failed || 0} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>pesan</span>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 18px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Provider Terpasang</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{settings.provider || 'FONNTE'}</span>
            <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '6px', color: '#475569' }}>
              Delay {settings.delay_seconds || 2}s
            </span>
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === 'broadcast' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '18px', alignItems: 'start' }}>
          {/* Left Column: Santri Table Selection */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Cari nama / NIS / no WA..."
                    value={searchTunggakan}
                    onChange={(e) => setSearchTunggakan(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTunggakan()}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      fontSize: '0.82rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Periode Bulan Filter */}
                <select
                  value={filterPeriode}
                  onChange={(e) => setFilterPeriode(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none',
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  <option value="Semua">Semua Periode Bulan</option>
                  {periodeList.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                <button
                  onClick={fetchTunggakan}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  <RotateCw size={14} className={loadingTunggakan ? 'animate-spin' : ''} />
                  <span>Segarkan</span>
                </button>
              </div>

              {/* Selection Summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {selectedSantriIds.length > 0 && selectedSantriIds.length === tunggakanList.filter(s => s.no_wa_wali && s.no_wa_wali !== '-').length ? (
                    <CheckSquare size={14} color="#059669" />
                  ) : (
                    <Square size={14} />
                  )}
                  <span>Pilih Semua Terfilter</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>
                      Pilih
                    </th>
                    <th style={{ padding: '12px 14px' }}>Nama Santri &amp; Kelas</th>
                    <th style={{ padding: '12px 14px' }}>Wali &amp; No. WhatsApp</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Tunggakan</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status WA</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTunggakan ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
                        <div>Memuat data santri berhutang...</div>
                      </td>
                    </tr>
                  ) : tunggakanList.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                        <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Alhamdulillah, Tidak Ada Tunggakan!</div>
                        <div style={{ fontSize: '0.78rem' }}>Semua santri pada filter ini telah melunasi tagihannya.</div>
                      </td>
                    </tr>
                  ) : (
                    tunggakanList.map((item) => {
                      const hasValidWa = item.no_wa_wali && String(item.no_wa_wali).trim() !== '-' && String(item.no_wa_wali).trim() !== '';
                      const isSelected = selectedSantriIds.includes(item.santri_id);

                      return (
                        <tr
                          key={item.santri_id}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isSelected ? '#f0fdf4' : 'transparent',
                            cursor: hasValidWa ? 'pointer' : 'not-allowed'
                          }}
                          onClick={() => hasValidWa && toggleSelectSantri(item.santri_id)}
                        >
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!hasValidWa}
                              onChange={() => toggleSelectSantri(item.santri_id)}
                              style={{ width: '16px', height: '16px', cursor: hasValidWa ? 'pointer' : 'not-allowed', accentColor: '#059669' }}
                            />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>NIS: {item.nis} • {item.nama_kelas || 'Kelas -'}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 600, color: '#334155' }}>{item.nama_wali || 'Wali Santri'}</div>
                            <div style={{ fontSize: '0.76rem', color: hasValidWa ? '#059669' : '#dc2626', fontWeight: 600 }}>
                              {hasValidWa ? item.no_wa_wali : 'Belum input No. WA'}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: '#b91c1c' }}>{formatRp(item.total_tunggakan)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.jumlah_tagihan} pos tagihan</div>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            {hasValidWa ? (
                              <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                Siap Kirim
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                Kosong
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Total Bar */}
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <div style={{ color: '#64748b' }}>
                Terpilih: <strong style={{ color: '#0f172a' }}>{selectedSantriIds.length}</strong> dari {tunggakanList.length} santri
              </div>
              <div style={{ color: '#64748b' }}>
                Total Piutang Terpilih: <strong style={{ color: '#b91c1c', fontSize: '1rem' }}>
                  {formatRp(
                    tunggakanList
                      .filter(s => selectedSantriIds.includes(s.santri_id))
                      .reduce((acc, cur) => acc + parseFloat(cur.total_tunggakan || 0), 0)
                  )}
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: Message Template & Action */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#059669" />
              <span>Format Pesan Broadcast</span>
            </h2>

            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <strong>Tag Otomatis:</strong><br />
              <code style={{ color: '#059669' }}>{'{nama_santri}'}</code>, <code style={{ color: '#059669' }}>{'{nama_kelas}'}</code>, <code style={{ color: '#059669' }}>{'{nama_wali}'}</code>,<br />
              <code style={{ color: '#059669' }}>{'{rincian_tagihan}'}</code>, <code style={{ color: '#059669' }}>{'{total_tagihan}'}</code>
            </div>

            <textarea
              rows={14}
              value={templatePesan}
              onChange={(e) => setTemplatePesan(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.82rem',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                background: '#fafafa'
              }}
            />

            <div style={{ marginTop: '16px' }}>
              <button
                onClick={handleSendBroadcast}
                disabled={sendingBroadcast || selectedSantriIds.length === 0}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: selectedSantriIds.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: selectedSantriIds.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: selectedSantriIds.length === 0 ? 'none' : '0 6px 16px rgba(16, 185, 129, 0.35)'
                }}
              >
                {sendingBroadcast ? (
                  <>
                    <RotateCw size={18} className="animate-spin" />
                    <span>Memproses Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Kirim ke {selectedSantriIds.length} Wali Santri</span>
                  </>
                )}
              </button>

              <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
                Pengiriman berjalan di background dengan jeda {settings.delay_seconds || 2} detik per nomor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGATURAN GATEWAY & TES KIRIM */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '18px', alignItems: 'start' }}>
          {/* Main Settings Form */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={20} color="#0284c7" />
              <span>Konfigurasi Akun WhatsApp Provider</span>
            </h2>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status Gateway Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: settings.is_active ? '#ecfdf5' : '#f8fafc',
                borderRadius: '12px',
                border: `1px solid ${settings.is_active ? '#a7f3d0' : '#e2e8f0'}`
              }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>Status Layanan WhatsApp Gateway</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Aktifkan untuk mengizinkan sistem mengirim notifikasi otomatis &amp; broadcast.</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px' }}>
                  <input
                    type="checkbox"
                    checked={!!settings.is_active}
                    onChange={(e) => setSettings({ ...settings, is_active: e.target.checked ? 1 : 0 })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.is_active ? '#059669' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: settings.is_active ? '24px' : '4px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>

              {/* Provider Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Pilih WhatsApp Gateway Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { id: 'fonnte', label: 'Fonnte (Rekomendasi)', desc: 'api.fonnte.com' },
                    { id: 'wablas', label: 'Wablas', desc: 'wablas.com' },
                    { id: 'custom', label: 'Custom Webhook', desc: 'Server Lokal / Gateway' }
                  ].map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        let newUrl = settings.server_url;
                        if (p.id === 'fonnte') newUrl = 'https://api.fonnte.com/send';
                        if (p.id === 'wablas') newUrl = 'https://kudus.wablas.com';
                        setSettings({ ...settings, provider: p.id, server_url: newUrl });
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: `2px solid ${settings.provider === p.id ? '#059669' : '#e2e8f0'}`,
                        background: settings.provider === p.id ? '#f0fdf4' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: '0.84rem', color: settings.provider === p.id ? '#047857' : '#1e293b' }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Token */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  API Token / Device Key ({settings.provider.toUpperCase()})
                </label>
                <input
                  type="text"
                  placeholder="Masukkan API Token dari Fonnte / Wablas..."
                  value={settings.api_token || ''}
                  onChange={(e) => setSettings({ ...settings, api_token: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  Dapatkan token di dashboard <a href="https://fonnte.com" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>fonnte.com</a> atau <a href="https://wablas.com" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>wablas.com</a>.
                </span>
              </div>

              {/* Server URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="https://api.fonnte.com/send"
                  value={settings.server_url || ''}
                  onChange={(e) => setSettings({ ...settings, server_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Delay & Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Jeda Antar Pesan Broadcast (Detik)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.delay_seconds || 2}
                    onChange={(e) => setSettings({ ...settings, delay_seconds: parseInt(e.target.value) || 2 })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Rekomendasi: 2 - 3 detik agar aman dari blokir spam WA.</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Label Footer Pesan
                  </label>
                  <input
                    type="text"
                    value={settings.footer_text || 'Pondok Pesantren Nurul Wafa'}
                    onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Triggers Section */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '6px' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                  Pemicu Otomatis Notifikasi WA (Real-time Event Triggers)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {[
                    { key: 'auto_sakit', label: 'Santri Sakit (Presensi)', desc: 'Kirim saat musyrif absen Sakit' },
                    { key: 'auto_izin', label: 'Santri Izin (Presensi)', desc: 'Kirim saat musyrif absen Izin' },
                    { key: 'auto_alfa', label: 'Santri Alfa / Belum Hadir', desc: 'Kirim saat musyrif absen Alfa' },
                    { key: 'auto_tazir', label: 'Ta\'zir & Pelanggaran', desc: 'Kirim saat biro input ta\'zir' },
                    { key: 'auto_perizinan', label: 'Persetujuan Perizinan', desc: 'Kirim saat izin disetujui pengasuh' }
                  ].map(t => (
                    <label
                      key={t.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!settings[t.key]}
                        onChange={(e) => setSettings({ ...settings, [t.key]: e.target.checked ? 1 : 0 })}
                        style={{ marginTop: '2px', accentColor: '#059669', width: '16px', height: '16px' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{t.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={savingSettings}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {savingSettings ? <RotateCw size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Simpan Konfigurasi Gateway</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test Send Card */}
          <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={18} color="#10b981" />
              <span>Tes Pengiriman WA</span>
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Kirim pesan tes ke nomor Anda untuk memastikan koneksi token Fonnte / Wablas sudah valid dan pesan berhasil sampai.
            </p>

            <form onSubmit={handleTestSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Nomor WhatsApp Penerima (Tes)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789 atau 6281234..."
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Isi Pesan Tes (Opsional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Ketik isi pesan khusus atau biarkan kosong untuk pesan default sistem..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest || !testPhone.trim()}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: !testPhone.trim() ? '#cbd5e1' : '#059669',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: !testPhone.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {sendingTest ? <RotateCw size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Kirim Pesan Tes Sekarang</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT LOG PESAN */}
      {activeTab === 'logs' && (
        <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={filterKategoriLog}
                onChange={(e) => setFilterKategoriLog(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="semua">Semua Kategori</option>
                <option value="tagihan">Tagihan SPP</option>
                <option value="sakit">Sakit</option>
                <option value="izin">Izin</option>
                <option value="alfa">Alfa</option>
                <option value="tazir">Ta'zir / Disiplin</option>
                <option value="perizinan">Perizinan Santri</option>
                <option value="test">Tes Gateway</option>
              </select>

              <select
                value={filterStatusLog}
                onChange={(e) => setFilterStatusLog(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <option value="semua">Semua Status</option>
                <option value="sent">Terkirim (Sent)</option>
                <option value="failed">Gagal (Failed)</option>
              </select>

              <button
                onClick={() => fetchLogs(1)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}
              >
                <RotateCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                <span>Segarkan Log</span>
              </button>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Total: <strong>{totalLogs}</strong> pesan tercatat
            </div>
          </div>

          {/* Table Logs */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                  <th style={{ padding: '12px 14px', width: '160px' }}>Waktu Kirim</th>
                  <th style={{ padding: '12px 14px' }}>Penerima &amp; No. WA</th>
                  <th style={{ padding: '12px 14px', width: '120px' }}>Kategori</th>
                  <th style={{ padding: '12px 14px' }}>Ringkasan Pesan</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '100px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingLogs ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
                      <div>Memuat log pesan...</div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                      Belum ada riwayat pengiriman pesan WhatsApp.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '0.78rem' }}>
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.target_nama || log.nama_santri || 'Wali Santri'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#059669', fontFamily: 'monospace' }}>{log.target_phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: log.kategori === 'tagihan' ? '#eff6ff' : log.kategori === 'sakit' ? '#fef3c7' : '#f1f5f9',
                          color: log.kategori === 'tagihan' ? '#1d4ed8' : log.kategori === 'sakit' ? '#b45309' : '#475569'
                        }}>
                          {log.kategori}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', maxWidth: '380px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#334155' }}>
                          {log.pesan}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {log.status === 'sent' ? (
                          <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                            SUKSES
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }} title={log.response_info}>
                            GAGAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

