import React from 'react';
import { Eye, EyeOff, Receipt, ArrowRight, AlertTriangle, Wallet } from 'lucide-react';

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
          borderRadius: "22px",
          padding: "16px",
          boxShadow:
            "0 12px 28px -4px rgba(11, 107, 96, 0.18), 0 3px 10px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e6f0ed",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Header Row Kartu */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
              fontSize: "0.72rem",
              fontWeight: 700
            }}
          >
            {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showBalance ? "Sembunyikan" : "Tampilkan"}</span>
          </button>
        </div>

        {/* Saldo Utama */}
        <div
          onClick={onOpenDetailKas}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
          title="Klik untuk melihat rincian kas masuk"
        >
          <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#047857", letterSpacing: "-0.4px" }}>
            {showBalance ? formatRp(summary.total_kas_masuk_sah || 0) : "Rp •••••••••••"}
          </div>
          <span style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "#047857",
            background: "#ecfdf5",
            padding: "4px 10px",
            borderRadius: "10px",
            border: "1px solid #a7f3d0"
          }}>
            Lihat Rincian ›
          </span>
        </div>

        {/* Tombol Banner Rincian Kas */}
        <button
          onClick={onOpenDetailKas}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "12px",
            border: "1px solid #a7f3d0",
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            color: "#065f46",
            fontSize: "0.74rem",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 5px rgba(5, 150, 105, 0.08)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Receipt size={14} color="#059669" />
            <span>Rincian Transaksi Kas Masuk Sah ({allKasMasukTrx.length} Transaksi)</span>
          </div>
          <ArrowRight size={13} color="#059669" />
        </button>

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
              padding: "10px 12px",
              borderRadius: "14px",
              border: "1px solid #fee2e2",
              cursor: "pointer"
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#991b1b", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
              <AlertTriangle size={12} color="#dc2626" />
              <span>Piutang / Tunggakan</span>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#dc2626", marginTop: "3px" }}>
              {showBalance ? formatRp(summary.total_nominal_tertunggak || 0) : "Rp ••••••"}
            </div>
          </div>

          <div
            onClick={() => onChangeTab("tabungan")}
            style={{
              background: "#f0fdfa",
              padding: "10px 12px",
              borderRadius: "14px",
              border: "1px solid #ccfbf1",
              cursor: "pointer"
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#0f766e", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
              <Wallet size={12} color="#0d9488" />
              <span>Tabungan Santri</span>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#0d9488", marginTop: "3px" }}>
              {showBalance ? formatRp(saldoTabunganTotal || 0) : "Rp ••••••"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

