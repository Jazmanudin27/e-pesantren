import React, { useState } from "react";
import { ArrowLeft, Landmark, RotateCw } from "lucide-react";
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
      {/* Top Curved Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #064e3b 0%, #047857 55%, #0f766e 100%)",
          padding: "18px 16px 24px",
          color: "#ffffff",
          borderBottomLeftRadius: "26px",
          borderBottomRightRadius: "26px",
          boxShadow: "0 10px 28px -6px rgba(4, 120, 87, 0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-24px",
            top: "-24px",
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            background: "rgba(52, 211, 153, 0.14)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {onBackToHome ? (
              <button
                type="button"
                onClick={onBackToHome}
                style={{
                  background: "rgba(255, 255, 255, 0.16)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#ffffff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title="Kembali ke Beranda"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.16)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  color: "#ffffff",
                  width: "38px",
                  height: "38px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Landmark size={20} />
              </div>
            )}

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.16rem",
                  fontWeight: 900,
                  letterSpacing: "-0.3px",
                }}
              >
                Buku Kas &amp; 3 Kantong Saldo
              </h2>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#a7f3d0",
                  marginTop: "2px",
                  fontWeight: 600,
                }}
              >
                Kas Tunai, Rekening Bank, Pencairan Midtrans &amp; Pengeluaran
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            style={{
              background: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              color: "#ffffff",
              width: "36px",
              height: "36px",
              borderRadius: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Segarkan Buku Kas"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "14px", maxWidth: "1280px", margin: "0 auto" }}>
        <PanelKantongDanBukuKas key={refreshTick} />
      </div>
    </div>
  );
}

