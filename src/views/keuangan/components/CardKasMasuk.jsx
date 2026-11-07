import React from 'react';
import { Eye, EyeOff, AlertTriangle, Wallet } from 'lucide-react';

export default function CardKasMasuk({
  summary,
  allKasMasukTrx,
  saldoTabunganTotal,
  showBalance,
  setShowBalance,
  formatRp,
  onOpenDetailKas,
  onChangeTab
}) {
  return (
    <div
      style={{
        padding: "0 14px",
        marginTop: "-34px",
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "12px 14px",
          boxShadow:
            "0 10px 24px -4px rgba(11, 107, 96, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e6f0ed",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Header Row Kartu */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Total Kas Masuk Sah
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: 0
            }}
          >
            {showBalance ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>{showBalance ? "Sembunyikan" : "Tampilkan"}</span>
          </button>
        </div>

        {/* Saldo Utama (Klik untuk Lihat Rincian) */}
        <div
          onClick={onOpenDetailKas}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
          title="Klik untuk melihat rincian transaksi kas masuk"
        >
          <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#047857", letterSpacing: "-0.4px", lineHeight: 1.1 }}>
            {showBalance ? formatRp(summary.total_kas_masuk_sah || 0) : "Rp •••••••••••"}
          </div>
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#047857",
            background: "#ecfdf5",
            padding: "3px 8px",
            borderRadius: "8px",
            border: "1px solid #a7f3d0"
          }}>
            Rincian ›
          </span>
        </div>

        {/* 2 Kolom Sub-Statistik (Piutang & Tabungan) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          paddingTop: "6px",
          borderTop: "1px solid #f1f5f9"
        }}>
          <div
            onClick={() => onChangeTab("keuangan-tunggakan")}
            style={{
              background: "#fef2f2",
              padding: "8px 10px",
              borderRadius: "12px",
              border: "1px solid #fee2e2",
              cursor: "pointer"
            }}
          >
            <div style={{ fontSize: "0.64rem", color: "#991b1b", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={11} color="#dc2626" />
              <span>Piutang / Tunggakan</span>
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#dc2626", marginTop: "2px" }}>
              {showBalance ? formatRp(summary.total_nominal_tertunggak || 0) : "Rp ••••••"}
            </div>
          </div>

          <div
            onClick={() => onChangeTab("tabungan")}
            style={{
              background: "#f0fdfa",
              padding: "8px 10px",
              borderRadius: "12px",
              border: "1px solid #ccfbf1",
              cursor: "pointer"
            }}
          >
            <div style={{ fontSize: "0.64rem", color: "#0f766e", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={11} color="#0d9488" />
              <span>Tabungan Santri</span>
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0d9488", marginTop: "2px" }}>
              {showBalance ? formatRp(saldoTabunganTotal || 0) : "Rp ••••••"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
