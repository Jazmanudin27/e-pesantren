import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  QrCode, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Plus, 
  Search, 
  RotateCw, 
  Layers, 
  Filter, 
  Calendar,
  Building,
  UserCheck,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { toastSuccess, showError, showSuccess } from '../../utils/alert.util';

export default function KeuanganAdminView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: {},
    transaksiTerakhir: [],
    tunggakanSantri: [],
    komponenBiaya: []
  });
  const [activeTab, setActiveTab] = useState('tunggakan'); // 'tunggakan' | 'transaksi' | 'komponen'
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [santriList, setSantriList] = useState([]);
  const [formTagihan, setFormTagihan] = useState({
    santri_id: '',
    komponen_id: '',
    judul_tagihan: '',
    total_tagihan: '',
    periode_bulan: '',
    jatuh_tempo: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRekap = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/keuangan/admin/rekap');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal ambil data rekap keuangan:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSantri = async () => {
    try {
      const res = await axios.get('/api/santri');
      if (res.data?.success) {
        setSantriList(res.data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchRekap();
    fetchSantri();
  }, []);

  const handleSimpanTagihan = async (e) => {
    e.preventDefault();
    if (!formTagihan.santri_id || !formTagihan.komponen_id || !formTagihan.total_tagihan) {
      showError('Validasi Gagal', 'Semua kolom wajib diisi');
      return;
    }
    try {
      setSubmitting(true);
      const res = await axios.post('/api/keuangan/admin/tagihan', formTagihan);
      if (res.data?.success) {
        toastSuccess('Berhasil!', 'Tagihan baru berhasil diterbitkan untuk santri');
        setIsModalOpen(false);
        setFormTagihan({
          santri_id: '',
          komponen_id: '',
          judul_tagihan: '',
          total_tagihan: '',
          periode_bulan: '',
          jatuh_tempo: ''
        });
        fetchRekap();
      }
    } catch (err) {
      showError('Gagal', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTunggakan = (data.tunggakanSantri || []).filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.nama_santri || '').toLowerCase().includes(q) ||
      (item.nis || '').toLowerCase().includes(q) ||
      (item.nama_wali || '').toLowerCase().includes(q)
    );
  });

  const formatRupiah = (val) => `Rp ${parseFloat(val || 0).toLocaleString('id-ID')}`;

  return (
    <div className="admin-content-inner" style={{ padding: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={26} color="#059669" />
            <span>Administrasi Keuangan & Pembayaran Digital</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manajemen tagihan SPP bulanan, biaya awal masuk pesantren, QRIS & Virtual Account santri
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={fetchRekap}
            className="btn-refresh" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <RotateCw size={15} /> Refresh Data
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <Plus size={16} /> Buat Tagihan Baru
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TOTAL TAGIHAN DITERBITKAN</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            {formatRupiah(data.summary?.total_nominal_tagihan)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>Akumulasi SPP & Biaya Masuk</div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>PEMBAYARAN TERVERIFIKASI</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={20} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#059669', marginTop: '10px' }}>
            {formatRupiah(data.summary?.total_terbayar)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#059669', marginTop: '4px' }}>
            {data.summary?.jumlah_tagihan_lunas || 0} tagihan telah lunas
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>TOTAL SISA TUNGGAKAN</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={20} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#dc2626', marginTop: '10px' }}>
            {formatRupiah(data.summary?.total_tunggakan)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#dc2626', marginTop: '4px' }}>
            {data.summary?.jumlah_tagihan_tertunggak || 0} tagihan belum lunas
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>METODE DIGITAL AKTIF</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} color="#9333ea" />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7e22ce', marginTop: '10px' }}>
            QRIS & Virtual Account
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>BCA, Mandiri, BNI, BRI, BSI</div>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', gap: '8px' }}>
        <button
          onClick={() => setActiveTab('tunggakan')}
          style={{
            padding: '10px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'tunggakan' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'tunggakan' ? '#059669' : '#64748b',
            cursor: 'pointer'
          }}
        >
          Rekap Tunggakan Santri ({data.tunggakanSantri?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('transaksi')}
          style={{
            padding: '10px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'transaksi' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'transaksi' ? '#059669' : '#64748b',
            cursor: 'pointer'
          }}
        >
          Log Transaksi & Kuitansi Digital ({data.transaksiTerakhir?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('komponen')}
          style={{
            padding: '10px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'komponen' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'komponen' ? '#059669' : '#64748b',
            cursor: 'pointer'
          }}
        >
          Master Komponen Biaya ({data.komponenBiaya?.length || 0})
        </button>
      </div>

      {/* TAB 1: REKAP TUNGGAKAN SANTRI */}
      {activeTab === 'tunggakan' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input
                type="text"
                placeholder="Cari santri, NIS, atau nama wali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Menampilkan {filteredTunggakan.length} santri dengan kewajiban tagihan
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>NO</th>
                  <th style={{ padding: '12px 16px' }}>SANTRI & NIS</th>
                  <th style={{ padding: '12px 16px' }}>NAMA & NO. WA WALI</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>TUNGGAKAN SPP BULANAN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>SISA BIAYA MASUK</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL KEWAJIBAN</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredTunggakan.map((item, idx) => (
                  <tr key={item.santri_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_santri}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NIS: {item.nis}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.nama_wali}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0284c7' }}>📱 {item.no_wa_wali}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>
                      {formatRupiah(item.tunggakan_bulanan)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                      {formatRupiah(item.tunggakan_biaya_masuk)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                      {formatRupiah(item.total_tunggakan)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <a
                        href={`https://wa.me/${(item.no_wa_wali || '').replace(/[^0-9]/g, '')}?text=Assalamu'alaikum%20Bpk/Ibu%20Wali%20Santri%20${encodeURIComponent(item.nama_santri)},%20informasi%20tagihan%20pesantren%20sebesar%20${encodeURIComponent(formatRupiah(item.total_tunggakan))}%20dapat%20dibayar%20via%20aplikasi%20Ruang%20Ponpes.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: '0.74rem'
                        }}
                      >
                        <Send size={12} /> Kirim Info WA
                      </a>
                    </td>
                  </tr>
                ))}
                {filteredTunggakan.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      Tidak ada data tunggakan yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LOG TRANSAKSI & KUITANSI DIGITAL */}
      {activeTab === 'transaksi' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
            Riwayat Pembayaran Digital & Kuitansi Otomatis (QRIS / Virtual Account)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>NO. TRANSAKSI</th>
                  <th style={{ padding: '12px 16px' }}>SANTRI</th>
                  <th style={{ padding: '12px 16px' }}>METODE & CHANNEL</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>TOTAL BAYAR</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>STATUS</th>
                  <th style={{ padding: '12px 16px' }}>NO. KUITANSI</th>
                  <th style={{ padding: '12px 16px' }}>TANGGAL BAYAR</th>
                </tr>
              </thead>
              <tbody>
                {(data.transaksiTerakhir || []).map((trx) => (
                  <tr key={trx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                      {trx.nomor_transaksi}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{trx.nama_santri}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>NIS: {trx.nis}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: trx.metode_pembayaran === 'QRIS' ? '#f0fdf4' : '#eff6ff',
                        color: trx.metode_pembayaran === 'QRIS' ? '#166534' : '#1e40af',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700
                      }}>
                        {trx.channel_pembayaran || trx.metode_pembayaran}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                      {formatRupiah(trx.total_bayar)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        background: trx.status_pembayaran === 'Berhasil' ? '#10b981' : '#f59e0b',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        {trx.status_pembayaran}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
                      {trx.kuitansi_nomor || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {trx.tanggal_bayar ? new Date(trx.tanggal_bayar).toLocaleString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER KOMPONEN BIAYA */}
      {activeTab === 'komponen' && (
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>
            Daftar Komponen Biaya Santri (Biaya Awal Masuk & Administrasi Bulanan)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>KOMPONEN BIAYA</th>
                <th style={{ padding: '12px 16px' }}>KATEGORI</th>
                <th style={{ padding: '12px 16px' }}>JENJANG</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>NOMINAL DEFAULT</th>
                <th style={{ padding: '12px 16px' }}>DESKRIPSI / KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {(data.komponenBiaya || []).map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                    {k.nama_komponen}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: k.kategori === 'Bulanan' ? '#fef3c7' : '#e0f2fe',
                      color: k.kategori === 'Bulanan' ? '#92400e' : '#0369a1',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      {k.kategori}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{k.jenjang || 'Semua'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    {formatRupiah(k.nominal_default)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{k.deskripsi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL BUAT TAGIHAN BARU */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '16px 20px', background: '#059669', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>Buat Tagihan Baru Santri</div>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimpanTagihan} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Pilih Santri *
                </label>
                <select
                  value={formTagihan.santri_id}
                  onChange={(e) => setFormTagihan({ ...formTagihan, santri_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama_santri} (NIS: {s.nis})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Komponen Biaya *
                </label>
                <select
                  value={formTagihan.komponen_id}
                  onChange={(e) => {
                    const sel = (data.komponenBiaya || []).find(k => String(k.id) === e.target.value);
                    setFormTagihan({
                      ...formTagihan,
                      komponen_id: e.target.value,
                      total_tagihan: sel ? sel.nominal_default : '',
                      judul_tagihan: sel ? sel.nama_komponen : ''
                    });
                  }}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="">-- Pilih Komponen --</option>
                  {(data.komponenBiaya || []).map(k => (
                    <option key={k.id} value={k.id}>{k.nama_komponen} ({k.kategori} - {formatRupiah(k.nominal_default)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Judul Tagihan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Administrasi Bulanan (November 2026)"
                  value={formTagihan.judul_tagihan}
                  onChange={(e) => setFormTagihan({ ...formTagihan, judul_tagihan: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Nominal Tagihan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formTagihan.total_tagihan}
                    onChange={(e) => setFormTagihan({ ...formTagihan, total_tagihan: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={formTagihan.jatuh_tempo}
                    onChange={(e) => setFormTagihan({ ...formTagihan, jatuh_tempo: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {submitting ? 'Menyimpan...' : 'Terbitkan Tagihan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

