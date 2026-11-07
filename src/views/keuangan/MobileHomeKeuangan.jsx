import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RotateCw,
  LogOut
} from 'lucide-react';
import { showConfirm, toastSuccess } from '../../utils/alert.util';
import CardKasMasuk from './components/CardKasMasuk';
import MenuLayananKeuangan from './components/MenuLayananKeuangan';
import RiwayatTrxTerbaru from './components/RiwayatTrxTerbaru';
import ModalKuitansi from './components/ModalKuitansi';
import ModalSiklusSpp from './components/ModalSiklusSpp';
import ModalDetailKasMasuk from './components/ModalDetailKasMasuk';

export default function MobileHomeKeuangan({ onChangeTab, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [summary, setSummary] = useState({
    total_kas_masuk_sah: 0,
    total_nominal_terbayar: 0,
    total_nominal_tertunggak: 0,
    jumlah_tagihan_lunas: 0,
    jumlah_tagihan_tertunggak: 0
  });
  const [recentTrx, setRecentTrx] = useState([]);
  const [allKasMasukTrx, setAllKasMasukTrx] = useState([]);
  const [saldoTabunganTotal, setSaldoTabunganTotal] = useState(0);

  // State Modal Detail Rincian Kas Masuk & Kuitansi
  const [isDetailKasModalOpen, setIsDetailKasModalOpen] = useState(false);
  const [kuitansiModal, setKuitansiModal] = useState({ isOpen: false, data: null });

  // State Pengaturan Siklus Tagihan SPP
  const [isSiklusModalOpen, setIsSiklusModalOpen] = useState(false);
  const [siklusForm, setSiklusForm] = useState({
    tgl_terbit_spp: 5,
    tgl_jatuh_tempo_spp: 10,
    apply_to_existing: true
  });
  const [savingSiklus, setSavingSiklus] = useState(false);

  const fetchKeuanganSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/keuangan/admin/rekap');
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data.summary || {});
        const listTrx = res.data.data.transaksiTerakhir || [];
        setAllKasMasukTrx(listTrx);
        setRecentTrx(listTrx.slice(0, 5));
        if (res.data.data.siklusSpp) {
          setSiklusForm({
            tgl_terbit_spp: res.data.data.siklusSpp.tgl_terbit_spp || 5,
            tgl_jatuh_tempo_spp: res.data.data.siklusSpp.tgl_jatuh_tempo_spp || 10,
            apply_to_existing: true
          });
        }
      }

      // Ambil total saldo tabungan jika ada
      try {
        const tabRes = await axios.get('/api/tabungan');
        if (tabRes.data?.success && tabRes.data.data) {
          const list = tabRes.data.data.santri_tabungan || tabRes.data.data || [];
          if (Array.isArray(list)) {
            const tot = list.reduce((acc, cur) => acc + (parseFloat(cur.saldo) || 0), 0);
            setSaldoTabunganTotal(tot);
          }
        }
      } catch (_) {}

    } catch (err) {
      console.warn('Gagal memuat rekap keuangan beranda:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSiklus = async (e) => {
    e?.preventDefault();
    try {
      setSavingSiklus(true);
      const res = await axios.post('/api/keuangan/siklus-spp', siklusForm);
      if (res.data?.success) {
        toastSuccess('Siklus Disimpan', res.data.message || 'Pengaturan siklus SPP berhasil disimpan.');
        setIsSiklusModalOpen(false);
        fetchKeuanganSummary();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan siklus SPP');
    } finally {
      setSavingSiklus(false);
    }
  };

  useEffect(() => {
    fetchKeuanganSummary();
  }, []);

  const formatRp = (num) => `Rp ${(Number(num) || 0).toLocaleString('id-ID')}`;

  const handleLogoutClick = async () => {
    const ok = await showConfirm(
      'Konfirmasi Keluar',
      'Keluar dari akun bendahara pesantren?',
      'Ya, Keluar',
      'Batal'
    );
    if (ok && onLogout) {
      onLogout();
    }
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* 1. TOP CURVED HEADER (PERSIS ADMIN: SINGKAT, ELEGAN, TIDAK PANJANG KE BAWAH) */}
      <div
        style={{
          background: "linear-gradient(180deg, #0b6b60 0%, #0d766e 70%, #095c53 100%)",
          padding: "16px 16px 46px",
          color: "#ffffff",
          borderBottomLeftRadius: "28px",
          borderBottomRightRadius: "28px",
          position: "relative",
          boxShadow: "0 10px 24px -4px rgba(11, 107, 96, 0.3)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Emblem Logo NWF & Brand Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.28) 0%, rgba(167,243,208,0.15) 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3.5px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.18)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "10px",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4.5px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src="/nwf.png"
                  alt="NWF Logo"
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "1.45rem",
                    letterSpacing: "-0.5px",
                    color: "#ffffff",
                    lineHeight: 1,
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  NWF
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    fontStyle: "italic",
                    letterSpacing: "-0.2px",
                    color: "#a7f3d0",
                    lineHeight: 1,
                    textShadow: "0 2px 6px rgba(11, 107, 96, 0.35)",
                  }}
                >
                  Finance
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.85)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginTop: "3px",
                  lineHeight: 1,
                }}
              >
                Pondok Pesantren Nurul Wafa
              </span>
            </div>
          </div>

          {/* Action Buttons: Segarkan & Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={fetchKeuanganSummary}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
              title="Segarkan Data"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleLogoutClick}
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                width: "36px",
                height: "36px",
                borderRadius: "12px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
              }}
              title="Keluar / Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CARD FLOATING KAS MASUK (PERSIS NIMPA HEADER SEPERTI DI ADMIN) */}
      <CardKasMasuk
        summary={summary}
        allKasMasukTrx={allKasMasukTrx}
        saldoTabunganTotal={saldoTabunganTotal}
        showBalance={showBalance}
        setShowBalance={setShowBalance}
        formatRp={formatRp}
        onOpenDetailKas={() => setIsDetailKasModalOpen(true)}
        onChangeTab={onChangeTab}
      />

      {/* 3. BODY CONTENT */}
      <div style={{ padding: '12px 14px 0' }}>
        {/* 4. MENU LAYANAN KEUANGAN (GRID 10 MENU) */}
        <MenuLayananKeuangan
          onChangeTab={onChangeTab}
          onOpenDetailKas={() => setIsDetailKasModalOpen(true)}
          onRefresh={fetchKeuanganSummary}
          loading={loading}
        />

        {/* 5. RIWAYAT TRANSAKSI KASIR TERBARU */}
        <RiwayatTrxTerbaru
          recentTrx={recentTrx}
          loading={loading}
          formatRp={formatRp}
          onOpenDetailKas={() => setIsDetailKasModalOpen(true)}
          onOpenKuitansi={(trx) => setKuitansiModal({ isOpen: true, data: trx })}
        />
      </div>

      {/* 6. MODAL ATUR SIKLUS TAGIHAN SPP & JATUH TEMPO */}
      <ModalSiklusSpp
        isOpen={isSiklusModalOpen}
        onClose={() => setIsSiklusModalOpen(false)}
        siklusForm={siklusForm}
        setSiklusForm={setSiklusForm}
        savingSiklus={savingSiklus}
        onSaveSiklus={handleSaveSiklus}
      />

      {/* 7. MODAL RINCIAN DETAIL KAS MASUK SAH */}
      <ModalDetailKasMasuk
        isOpen={isDetailKasModalOpen}
        onClose={() => setIsDetailKasModalOpen(false)}
        summary={summary}
        allKasMasukTrx={allKasMasukTrx}
        formatRp={formatRp}
        onOpenKuitansi={(trx) => setKuitansiModal({ isOpen: true, data: trx })}
      />

      {/* 8. MODAL KUITANSI DIGITAL ELEGAN & CETAK NOTA */}
      <ModalKuitansi
        isOpen={kuitansiModal.isOpen}
        data={kuitansiModal.data}
        onClose={() => setKuitansiModal({ isOpen: false, data: null })}
        formatRp={formatRp}
      />
    </div>
  );
}
