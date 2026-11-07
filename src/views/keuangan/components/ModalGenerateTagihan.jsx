import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  Sparkles,
  Calendar,
  Building,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  ShieldCheck,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toastSuccess, showError, showConfirm } from '../../../utils/alert.util';

const RINCIAN_MASTER = {
  SMK: {
    jenjang: 'SMK',
    nama_sekolah: 'SMK Nurul Wafa',
    total_adm_sekolah: 1400000,
    total_adm_pesantren: 1000000,
    nominal_spp: 565000,
    grand_total: 2965000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Almamater', biaya: 150000 },
      { uraian: 'Baju Praktek', biaya: 110000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Alat Praktek', biaya: 250000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 565000 }
  },
  SMA: {
    jenjang: 'SMA',
    nama_sekolah: 'SMA Nurul Wafa',
    total_adm_sekolah: 1040000,
    total_adm_pesantren: 1000000,
    nominal_spp: 565000,
    grand_total: 2605000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Almamater', biaya: 150000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 565000 }
  },
  SMP: {
    jenjang: 'SMP',
    nama_sekolah: 'SMP Nurul Wafa',
    total_adm_sekolah: 890000,
    total_adm_pesantren: 1000000,
    nominal_spp: 505000,
    grand_total: 2395000,
    adm_sekolah: [
      { uraian: 'Pendaftaran', biaya: 100000 },
      { uraian: 'Kartu Siswa', biaya: 15000 },
      { uraian: 'Logo', biaya: 25000 },
      { uraian: 'Kaos', biaya: 100000 },
      { uraian: 'Kemeja', biaya: 100000 },
      { uraian: 'Sampul Raport', biaya: 50000 },
      { uraian: 'Bangunan', biaya: 500000 }
    ],
    adm_pesantren: [
      { uraian: 'K. Mahrom', biaya: 15000 },
      { uraian: 'B. Raport', biaya: 60000 },
      { uraian: 'Tafrij', biaya: 50000 },
      { uraian: 'Mufrodat', biaya: 30000 },
      { uraian: 'Buku Muhafadoh', biaya: 20000 },
      { uraian: 'Nametag', biaya: 15000 },
      { uraian: 'Infaq', biaya: 500000 },
      { uraian: 'OPPN', biaya: 100000 },
      { uraian: 'Ziarah', biaya: 120000 },
      { uraian: 'Peralatan Dapur', biaya: 90000 }
    ],
    spp_juli: { uraian: 'Makan dan SPP Sekolah', biaya: 505000 }
  }
};

const NAMA_BULAN = [
  { id: '1', name: 'Januari' },
  { id: '2', name: 'Februari' },
  { id: '3', name: 'Maret' },
  { id: '4', name: 'April' },
  { id: '5', name: 'Mei' },
  { id: '6', name: 'Juni' },
  { id: '7', name: 'Juli' },
  { id: '8', name: 'Agustus' },
  { id: '9', name: 'September' },
  { id: '10', name: 'Oktober' },
  { id: '11', name: 'November' },
  { id: '12', name: 'Desember' }
];

export default function ModalGenerateTagihan({
  isOpen,
  onClose,
  onGenerated,
  initialSekolah = ''
}) {
  const [activeTab, setActiveTab] = useState('awal_masuk'); // 'awal_masuk' | 'spp_rutin'
  const [loading, setLoading] = useState(false);

  // Tab 1: Biaya Awal Masuk State
  const [jenjangMasuk, setJenjangMasuk] = useState('SMP'); // 'SMP' | 'SMA' | 'SMK' | 'SEMUA'
  const [modePaketMasuk, setModePaketMasuk] = useState('paket'); // 'paket' (3 rincian) | 'total' (1 tagihan)
  const [showItemBreakdown, setShowItemBreakdown] = useState(true);

  // Tab 2: SPP Bulanan State
  const [sekolahSpp, setSekolahSpp] = useState(initialSekolah || '');
  const [modeSpp, setModeSpp] = useState('single');
  const now = new Date();
  const [bulanMulai, setBulanMulai] = useState(String(now.getMonth() + 1));
  const [tahunMulai, setTahunMulai] = useState(String(now.getFullYear()));
  const [bulanSelesai, setBulanSelesai] = useState('6');
  const [tahunSelesai, setTahunSelesai] = useState(String(now.getFullYear() + 1));
  const [komponenList, setKomponenList] = useState([]);
  const [selectedKomponenId, setSelectedKomponenId] = useState('');

  // Sync initialSekolah
  useEffect(() => {
    if (initialSekolah && initialSekolah !== 'semua') {
      setJenjangMasuk(initialSekolah);
      setSekolahSpp(initialSekolah);
    }
  }, [initialSekolah]);

  // Load Komponen untuk SPP
  useEffect(() => {
    if (!isOpen) return;
    const fetchKomponen = async () => {
      try {
        const res = await axios.get('/api/keuangan/admin/rekap');
        if (res.data?.success && res.data.data?.komponenBiaya) {
          const list = res.data.data.komponenBiaya;
          setKomponenList(list);
          const defaultKomp = list.find((k) => k.kategori === 'Bulanan') || list[0];
          if (defaultKomp && !selectedKomponenId) {
            setSelectedKomponenId(String(defaultKomp.id));
          }
        }
      } catch (e) {
        console.warn('Gagal load komponen biaya:', e.message);
      }
    };
    fetchKomponen();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  const currentRincian = RINCIAN_MASTER[jenjangMasuk === 'SEMUA' ? 'SMP' : jenjangMasuk] || RINCIAN_MASTER.SMP;

  // Handler Generate Biaya Awal Masuk ke Database
  const handleGenerateAwalMasuk = async (e) => {
    e?.preventDefault();
    const jenjangLabel = jenjangMasuk === 'SEMUA' ? 'Seluruh Jenjang (SMP, SMA, SMK)' : `Jenjang ${jenjangMasuk}`;
    const nominalLabel =
      jenjangMasuk === 'SEMUA'
        ? 'sesuai tarif tiap sekolah (SMP 2.395jt, SMA 2.605jt, SMK 2.965jt)'
        : formatRp(currentRincian.grand_total);

    const ok = await showConfirm(
      'Konfirmasi Simpan Tagihan ke Database',
      `Terbitkan Tagihan Biaya Awal Masuk 2026/2027 untuk santri ${jenjangLabel} (${nominalLabel})?\n\nTagihan akan langsung disimpan ke database keuangan_tagihan. Santri yang sudah punya tagihan otomatis dilewati.`,
      'Ya, Simpan ke Database',
      'Batal'
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await axios.post('/api/sekolah/generate-tagihan-masuk', {
        jenjang: jenjangMasuk,
        tahun_ajaran: '2026/2027',
        mode: modePaketMasuk
      });

      if (res.data?.success) {
        toastSuccess('Berhasil!', res.data.message || 'Tagihan awal masuk berhasil disimpan ke database.');
        if (onGenerated) onGenerated();
        onClose();
      } else {
        showError('Gagal', res.data?.message || 'Gagal menyimpan tagihan.');
      }
    } catch (err) {
      showError('Gagal Simpan Tagihan', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler Generate SPP Bulanan ke Database
  const handleGenerateSpp = async (e) => {
    e?.preventDefault();
    if (!selectedKomponenId) {
      showError('Pilih Komponen', 'Pilih pos biaya terlebih dahulu.');
      return;
    }

    const selKomp = komponenList.find((k) => String(k.id) === String(selectedKomponenId));
    const namaBulanMulai = NAMA_BULAN.find((b) => b.id === String(bulanMulai))?.name || bulanMulai;
    const namaBulanSelesai = NAMA_BULAN.find((b) => b.id === String(bulanSelesai))?.name || bulanSelesai;
    const periodeLabel =
      modeSpp === 'single'
        ? `${namaBulanMulai} ${tahunMulai}`
        : `${namaBulanMulai} ${tahunMulai} s/d ${namaBulanSelesai} ${tahunSelesai}`;

    const ok = await showConfirm(
      'Konfirmasi Terbitkan SPP',
      `Terbitkan tagihan "${selKomp?.nama_komponen || 'SPP'}" untuk santri ${sekolahSpp ? `Sekolah ${sekolahSpp}` : 'Semua Sekolah'} periode ${periodeLabel}?\n\nTagihan akan langsung disimpan ke database.`,
      'Ya, Simpan ke Database',
      'Batal'
    );
    if (!ok) return;

    try {
      setLoading(true);
      const res = await axios.post('/api/keuangan/admin/generate-auto', {
        komponen_id: parseInt(selectedKomponenId),
        mode_generasi: modeSpp,
        bulan_mulai: parseInt(bulanMulai),
        tahun_mulai: parseInt(tahunMulai),
        bulan_selesai: parseInt(bulanSelesai),
        tahun_selesai: parseInt(tahunSelesai),
        filter_sekolah: sekolahSpp,
        filter_kamar: ''
      });

      if (res.data?.success) {
        toastSuccess('Berhasil!', res.data.message || 'Tagihan SPP berhasil disimpan ke database.');
        if (onGenerated) onGenerated();
        onClose();
      } else {
        showError('Gagal', res.data?.message || 'Gagal generate tagihan SPP.');
      }
    } catch (err) {
      showError('Gagal Generate', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          borderTopLeftRadius: '26px',
          borderTopRightRadius: '26px',
          overflowY: 'auto',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUpModal 0.24s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Modal */}
        <div style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0d766e 60%, #059669 100%)',
          padding: '16px 18px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} color="#a7f3d0" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', lineHeight: 1.2 }}>
                Generate Tagihan Sesuai Sekolah
              </div>
              <div style={{ fontSize: '0.67rem', color: '#a7f3d0' }}>
                Simpan data tagihan resmi langsung ke database pesantren
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: Awal Masuk (Gambar Dokumen) vs SPP Bulanan */}
        <div style={{ padding: '12px 16px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#e2e8f0', padding: '3px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('awal_masuk')}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                background: activeTab === 'awal_masuk' ? '#ffffff' : 'transparent',
                color: activeTab === 'awal_masuk' ? '#065f46' : '#64748b',
                boxShadow: activeTab === 'awal_masuk' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📄 Rincian Awal Masuk
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('spp_rutin')}
              style={{
                padding: '9px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.76rem',
                cursor: 'pointer',
                background: activeTab === 'spp_rutin' ? '#ffffff' : 'transparent',
                color: activeTab === 'spp_rutin' ? '#0369a1' : '#64748b',
                boxShadow: activeTab === 'spp_rutin' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📅 SPP Bulanan Rutin
            </button>
          </div>
        </div>

        {/* TAB 1: RINCIAN AWAL MASUK (PERSIS GAMBAR DOKUMEN 2026/2027) */}
        {activeTab === 'awal_masuk' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Pilihan Jenjang Sekolah */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                1. Pilih Jenjang Sekolah:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[
                  { id: 'SMP', label: 'SMP', nominal: '2.395 jt' },
                  { id: 'SMA', label: 'SMA', nominal: '2.605 jt' },
                  { id: 'SMK', label: 'SMK', nominal: '2.965 jt' },
                  { id: 'SEMUA', label: 'Semua', nominal: '3 Jenjang' }
                ].map((j) => {
                  const active = jenjangMasuk === j.id;
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setJenjangMasuk(j.id)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '12px',
                        border: active ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: active ? '#ecfdf5' : '#ffffff',
                        color: active ? '#065f46' : '#475569',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: active ? '0 3px 8px rgba(5, 150, 105, 0.2)' : 'none'
                      }}
                    >
                      <div>{j.label}</div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: active ? '#047857' : '#94a3b8' }}>
                        {j.nominal}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Tabel Rincian Resmi Sesuai Lampiran Gambar */}
            {jenjangMasuk !== 'SEMUA' && (
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '14px', overflow: 'hidden', background: '#ffffff' }}>
                {/* Header Strip Tabel */}
                <div style={{
                  padding: '9px 12px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a' }}>
                    RINCIAN AWAL MASUK 2026/2027 ({currentRincian.jenjang})
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowItemBreakdown(!showItemBreakdown)}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                  >
                    <span>{showItemBreakdown ? 'Kecilkan' : 'Lihat Detail'}</span>
                    {showItemBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Sub-Ringkasan 3 Komponen Utama */}
                <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: '#f1f5f9' }}>
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#7e22ce' }}>ADM SEKOLAH</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#6b21a8' }}>{formatRp(currentRincian.total_adm_sekolah)}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#15803d' }}>ADM PESANTREN</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#14532d' }}>{formatRp(currentRincian.total_adm_pesantren)}</div>
                  </div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#1d4ed8' }}>SPP JULI</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#1e3a8a' }}>{formatRp(currentRincian.nominal_spp)}</div>
                  </div>
                </div>

                {/* Detail Tabel Lengkap (Persis di Foto) */}
                {showItemBreakdown && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                          <th style={{ padding: '6px 10px', textAlign: 'left' }}>KOMPONEN / URAIAN</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>BIAYA</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ background: '#faf5ff', fontWeight: 800, color: '#7e22ce' }}>
                          <td colSpan={2} style={{ padding: '4px 10px' }}>Adm Sekolah ({currentRincian.adm_sekolah.length} Item)</td>
                        </tr>
                        {currentRincian.adm_sekolah.map((item, i) => (
                          <tr key={`as-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '4px 10px 4px 18px', color: '#334155' }}>• {item.uraian}</td>
                            <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600 }}>{formatRp(item.biaya)}</td>
                          </tr>
                        ))}

                        <tr style={{ background: '#f0fdf4', fontWeight: 800, color: '#15803d' }}>
                          <td colSpan={2} style={{ padding: '4px 10px' }}>Adm Pesantren (10 Item)</td>
                        </tr>
                        {currentRincian.adm_pesantren.map((item, i) => (
                          <tr key={`ap-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '4px 10px 4px 18px', color: '#334155' }}>• {item.uraian}</td>
                            <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 600 }}>{formatRp(item.biaya)}</td>
                          </tr>
                        ))}

                        <tr style={{ background: '#eff6ff', fontWeight: 800, color: '#1d4ed8' }}>
                          <td style={{ padding: '6px 10px' }}>SPP Juli (Makan & SPP Sekolah)</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatRp(currentRincian.nominal_spp)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer Total */}
                <div style={{
                  padding: '10px 14px',
                  background: '#064e3b',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.86rem'
                }}>
                  <span>TOTAL BIAYA AWAL MASUK:</span>
                  <span style={{ color: '#a7f3d0', fontSize: '0.98rem' }}>{formatRp(currentRincian.grand_total)}</span>
                </div>
              </div>
            )}

            {/* Pilihan Format Tagihan di Database */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                2. Format Penyimpanan Tagihan di Database:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label
                  onClick={() => setModePaketMasuk('paket')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '12px',
                    border: modePaketMasuk === 'paket' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: modePaketMasuk === 'paket' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input type="radio" checked={modePaketMasuk === 'paket'} onChange={() => {}} style={{ accentColor: '#059669', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>3 Pos Terpisah</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.2, marginTop: '2px' }}>
                      Adm Sekolah, Adm Pesantren, dan SPP Juli tersimpan rapi per pos
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setModePaketMasuk('total')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '12px',
                    border: modePaketMasuk === 'total' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: modePaketMasuk === 'total' ? '#ecfdf5' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input type="radio" checked={modePaketMasuk === 'total'} onChange={() => {}} style={{ accentColor: '#059669', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>1 Tagihan Total</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.2, marginTop: '2px' }}>
                      Gabungan total langsung lunas/dicicil dalam 1 tagihan paket
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Proteksi Notice */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.68rem', color: '#065f46', lineHeight: 1.3 }}>
                <strong>Aman Anti-Duplikat:</strong> Sistem memeriksa santri yang sudah memiliki tagihan awal masuk. Tagihan yang sudah ada dilewati otomatis.
              </div>
            </div>

            {/* Tombol Simpan Tagihan Awal Masuk ke Database */}
            <button
              type="button"
              onClick={handleGenerateAwalMasuk}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(5, 150, 105, 0.35)'
              }}
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Menyimpan Tagihan ke Database...' : 'Simpan & Terbitkan Tagihan Masuk'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: SPP BULANAN RUTIN */}
        {activeTab === 'spp_rutin' && (
          <form onSubmit={handleGenerateSpp} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Filter Sekolah SPP */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                1. Sekolah Target:
              </label>
              <select
                value={sekolahSpp}
                onChange={(e) => setSekolahSpp(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="">Semua Sekolah (SMP, SMA, SMK)</option>
                <option value="SMP">Hanya SMP Nurul Wafa (SPP: Rp 505.000)</option>
                <option value="SMA">Hanya SMA Nurul Wafa (SPP: Rp 565.000)</option>
                <option value="SMK">Hanya SMK Nurul Wafa (SPP: Rp 565.000)</option>
              </select>
            </div>

            {/* Pos Biaya */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                2. Pos Komponen Biaya:
              </label>
              <select
                value={selectedKomponenId}
                onChange={(e) => setSelectedKomponenId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                {komponenList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_komponen} ({k.kategori}) — {formatRp(k.nominal_default)}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode & Periode Bulan */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                  3. Periode Bulan:
                </label>
                <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setModeSpp('single')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: modeSpp === 'single' ? '#0284c7' : 'transparent',
                      color: modeSpp === 'single' ? '#ffffff' : '#64748b'
                    }}
                  >
                    1 Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeSpp('looping')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: modeSpp === 'looping' ? '#0284c7' : 'transparent',
                      color: modeSpp === 'looping' ? '#ffffff' : '#64748b'
                    }}
                  >
                    Full TA
                  </button>
                </div>
              </div>

              {modeSpp === 'single' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px' }}>
                  <select
                    value={bulanMulai}
                    onChange={(e) => setBulanMulai(e.target.value)}
                    style={{ padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {NAMA_BULAN.map((b) => (
                      <option key={b.id} value={b.id}>Bulan {b.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={tahunMulai}
                    onChange={(e) => setTahunMulai(e.target.value)}
                    style={{ padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}
                  />
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '6px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Mulai:</div>
                      <select
                        value={bulanMulai}
                        onChange={(e) => setBulanMulai(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        {NAMA_BULAN.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={tahunMulai}
                        onChange={(e) => setTahunMulai(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.72rem', textAlign: 'center' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8' }}>➔</span>
                    <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Sampai:</div>
                      <select
                        value={bulanSelesai}
                        onChange={(e) => setBulanSelesai(e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.72rem', fontWeight: 700 }}
                      >
                        {NAMA_BULAN.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={tahunSelesai}
                        onChange={(e) => setTahunSelesai(e.target.value)}
                        style={{ width: '100%', marginTop: '4px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.72rem', textAlign: 'center' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Proteksi Notice */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.68rem', color: '#065f46', lineHeight: 1.3 }}>
                <strong>Aman Anti-Duplikat:</strong> Tagihan SPP yang sudah terbit tidak akan digandakan.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)'
              }}
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Memproses Tagihan...' : 'Terbitkan Tagihan SPP'}</span>
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
