import React, { useState } from "react";
import { ArrowLeft, Wallet, RotateCw } from "lucide-react";
import PanelKantongDanBukuKas from "./components/PanelKantongDanBukuKas";

export default function BukuKasView({ onBackToHome }) {
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <div
      style={{
        paddingBottom: onBackToHome ? "96px" : "36px",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Simple Sticky Top Bar (Desktop Only — Mobile uses Unified Owner Header) */}
      {!onBackToHome && (
        <div
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 16px",
            position: "sticky",
            top: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "#ecfdf5",
                color: "#059669",
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={18} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "#0f172a",
                  letterSpacing: "-0.2px",
                }}
              >
                Buku Kas &amp; Kantong Saldo
              </h2>
              <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
                Kas Tunai • Rekening Bank • Midtrans
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            style={{
              background: "#f1f5f9",
              border: "none",
              color: "#334155",
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Segarkan Data"
          >
            <RotateCw size={15} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: onBackToHome ? "0 14px 14px" : "14px", maxWidth: "1080px", margin: "0 auto" }}>
        <PanelKantongDanBukuKas key={refreshTick} />
      </div>
    </div>
  );
}
