import React, { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BookOpen,
  HeartHandshake,
  GraduationCap,
  X,
  PhoneCall,
  Info,
  CheckCircle2,
} from "lucide-react";

export default function MobileOnboarding({ onStart }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        background: "#02151f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Mobile Device Frame Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "430px",
          height: "100%",
          maxHeight: "100dvh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#02151f",
        }}
      >
        {/* Fullscreen Hero Background Image */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url('/onboarding-santri.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center 6%",
            backgroundRepeat: "no-repeat",
            zIndex: 1,
          }}
        />

        {/* Subtle Dark Vignette & Top Gradient for Status Bar Legibility */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100px",
            background:
              "linear-gradient(to bottom, rgba(2, 21, 31, 0.6) 0%, rgba(2, 21, 31, 0.1) 60%, transparent 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* BOTTOM GRADIENT OVERLAY (Hanya di bagian bawah agar wajah & karakter santri tidak tertutup) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "42%",
            background:
              "linear-gradient(to bottom, rgba(2, 21, 31, 0) 0%, rgba(2, 25, 37, 0.45) 25%, rgba(2, 28, 42, 0.92) 55%, #021a27 80%, #01121b 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* ----------------- TOP BAR SECTION ----------------- */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "12px 16px 0",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Badges: Brand Pill (Left) & Status Badge (Right) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left Brand Badge: Disamakan dengan Header Beranda (NWF Mobile) */}
            <div
              style={{
                background: "rgba(13, 118, 110, 0.88)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(167, 243, 208, 0.35)",
                borderRadius: "14px",
                padding: "5px 12px 5px 7px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3px",
                }}
              >
                <img
                  src="/nwf.png"
                  alt="Logo Ponpes"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                <span
                  style={{
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "0.92rem",
                    letterSpacing: "-0.3px",
                    lineHeight: 1,
                  }}
                >
                  NWF
                </span>
                <span
                  style={{
                    color: "#a7f3d0",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    fontStyle: "italic",
                    letterSpacing: "-0.1px",
                    lineHeight: 1,
                  }}
                >
                  Mobile
                </span>
              </div>
            </div>

            {/* Right Status Pill */}
            <div
              style={{
                background: "rgba(9, 38, 59, 0.72)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "999px",
                padding: "5px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px #10b981",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  color: "#e2e8f0",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.03em",
                }}
              >
                PP. NURUL WAFA
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- BOTTOM CONTENT SHEET ----------------- */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "0 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            boxSizing: "border-box",
          }}
        >
          {/* Tag Pill */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                background: "rgba(6, 78, 59, 0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(52, 211, 153, 0.45)",
                borderRadius: "999px",
                padding: "2px 9px",
                color: "#34d399",
                fontSize: "0.64rem",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Sparkles size={11} color="#34d399" />
              <span>Santri Berakhlak & Terampil Digital</span>
            </span>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)",
            }}
          >
            Tumbuh Percaya Diri Bersama Santri
          </h1>

          {/* Subtitle / Tagline */}
          <div
            style={{
              color: "#6ee7b7",
              fontSize: "0.74rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <GraduationCap size={13} color="#34d399" />
            <span>Pendidikan Terpadu & Kualitas Terbaik</span>
          </div>

          {/* Description Paragraph */}
          <p
            style={{
              margin: "0 0 2px 0",
              fontSize: "0.68rem",
              color: "#cbd5e1",
              lineHeight: 1.35,
              fontWeight: 500,
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)",
            }}
          >
            Pantau presensi santri, setoran tahfidz Qur'an, mutaba'ah asrama,
            dan syahriah dengan mudah & transparan.
          </p>

          {/* Action Button: Hanya Mulai Sekarang */}
          <div style={{ marginTop: "4px" }}>
            <button
              id="btn-onboarding-start"
              onClick={onStart}
              style={{
                width: "100%",
                background: "#ffffff",
                color: "#064e3b",
                border: "none",
                padding: "12px 18px",
                borderRadius: "999px",
                fontSize: "0.92rem",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow:
                  "0 8px 20px -2px rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)",
                transition: "all 0.2s ease",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 24px -2px rgba(255, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px -2px rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)";
              }}
            >
              <span>Mulai Sekarang</span>
              <ArrowRight size={17} color="#064e3b" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
