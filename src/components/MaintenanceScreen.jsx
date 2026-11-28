import React, { useState } from "react";
import axios from "axios";
import {
  Wrench,
  RotateCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function MaintenanceScreen({
  roleKey = "wali",
  message,
  estimatedTime,
  onRefresh,
}) {
  const [checking, setChecking] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  const defaultMsg =
    message ||
    "Mohon maaf, layanan aplikasi saat ini sedang dalam pemeliharaan atau peningkatan sistem. Kami sedang melakukan pembaruan berkala agar layanan semakin cepat, aman, dan nyaman digunakan.";

  const handleCheckStatus = async () => {
    try {
      setChecking(true);
      setStatusNotice(null);
      const res = await axios.get("/api/maintenance/status");
      if (res.data?.success && res.data.data) {
        const roleStatus = res.data.data[roleKey];
        if (!roleStatus || !roleStatus.is_maintenance) {
          setStatusNotice({
            type: "success",
            text: "Alhamdulillah, sistem sudah aktif kembali! Memuat halaman...",
          });
          setTimeout(() => {
            if (typeof onRefresh === "function") {
              onRefresh();
            } else {
              window.location.reload();
            }
          }, 1000);
          return;
        } else {
          setStatusNotice({
            type: "warning",
            text: "Pemeliharaan sistem masih berlangsung. Silakan cek kembali dalam beberapa saat.",
          });
        }
      }
    } catch (e) {
      setStatusNotice({
        type: "warning",
        text: "Sedang menghubungkan ke server. Silakan coba kembali.",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(ellipse at top, #064e3b 0%, #022c22 45%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Ambient Lighting Orbs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "520px",
          height: "520px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.08) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          animation: "pulseGlow 6s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "10%",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 60%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* Main Glass Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "32px",
          padding: "32px 24px 28px",
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.9)",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
          boxSizing: "border-box",
        }}
      >
        {/* Pesantren Brand Top Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            border: "1px solid #bbf7d0",
            padding: "4px 14px 4px 6px",
            borderRadius: "99px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <img
              src="/nwf.png"
              alt="Logo"
              style={{ width: "18px", height: "18px", objectFit: "contain" }}
            />
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 900,
              color: "#166534",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            PP. NURUL WAFA
          </span>
        </div>

        {/* 3D Elevated Center Animated Icon with Rotating Ring */}
        <div
          style={{
            position: "relative",
            width: "94px",
            height: "94px",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "floatSlow 4s ease-in-out infinite",
          }}
        >
          {/* Rotating Dashed Accent Ring */}
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              border: "2px dashed #f59e0b",
              opacity: 0.6,
              animation: "spinSlow 20s linear infinite",
            }}
          />

          {/* Soft Glow Layer */}
          <div
            style={{
              position: "absolute",
              inset: "4px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(239, 68, 68, 0.15) 60%, transparent 80%)",
              filter: "blur(8px)",
            }}
          />

          {/* Core Vibrant Icon Box */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "24px",
              background:
                "linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 14px 28px -6px rgba(234, 88, 12, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4)",
              position: "relative",
              zIndex: 2,
              transform: "rotate(-5deg)",
            }}
          >
            <Wrench
              size={34}
              strokeWidth={2.5}
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
            />
          </div>
        </div>

        {/* Live Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            color: "#b45309",
            padding: "5px 14px",
            borderRadius: "99px",
            fontSize: "0.72rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#f59e0b",
              boxShadow: "0 0 8px #f59e0b",
              animation: "pulse 1.4s infinite",
            }}
          />
          SISTEM SEDANG DIPERBAIKI
        </div>

        {/* Main Heading */}
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: "1.45rem",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.4px",
            lineHeight: 1.25,
          }}
        >
          Pemeliharaan Sistem
        </h2>
        <p
          style={{
            margin: "0 0 18px",
            fontSize: "0.78rem",
            color: "#64748b",
            lineHeight: 1.4,
          }}
        >
          Optimalisasi &amp; Pembaruan Server Berkala
        </p>

        {/* Dynamic Animated Progress Bar Shimmer */}
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "#f1f5f9",
            borderRadius: "99px",
            overflow: "hidden",
            position: "relative",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: "50%",
              borderRadius: "99px",
              background: "linear-gradient(90deg, #10b981, #059669, #f59e0b)",
              animation: "shimmerLine 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />
        </div>

        {/* Official Notice Box - Premium Glassmorphic Card */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(160deg, #ffffff 0%, #f8fafc 60%, #fffbeb 100%)",
            border: "1.5px solid #fed7aa",
            borderRadius: "22px",
            padding: "18px 20px",
            color: "#334155",
            textAlign: "left",
            marginBottom: "20px",
            boxShadow:
              "0 12px 28px -6px rgba(245, 158, 11, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
        >
          {/* Subtle Top Accent Glow Bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #f59e0b, #ea580c, #ef4444)",
            }}
          />

          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
                  border: "1px solid #fde68a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#d97706",
                  boxShadow: "0 2px 6px rgba(217, 119, 6, 0.15)",
                }}
              >
                <AlertTriangle size={15} />
              </div>
              <span
                style={{
                  fontWeight: 900,
                  color: "#0f172a",
                  fontSize: "0.84rem",
                  letterSpacing: "-0.2px",
                }}
              >
                Pemberitahuan Resmi
              </span>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                color: "#b45309",
                padding: "2px 8px",
                borderRadius: "99px",
                fontSize: "0.68rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              <Sparkles size={11} color="#d97706" />
              Info Sistem
            </span>
          </div>

          {/* Content Message */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              border: "1px solid #f1f5f9",
              borderRadius: "14px",
              padding: "12px 14px",
              color: "#334155",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            {defaultMsg}
          </div>

          {/* Estimated Completion Mini Card */}
          {estimatedTime && (
            <div
              style={{
                marginTop: "12px",
                background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                border: "1px solid #bbf7d0",
                borderRadius: "14px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "0.76rem",
                  color: "#065f46",
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669",
                  }}
                >
                  <Clock size={13} />
                </div>
                <span>Estimasi Selesai</span>
              </div>
              <span
                style={{
                  color: "#047857",
                  background: "#ffffff",
                  border: "1px solid #86efac",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  boxShadow: "0 1px 3px rgba(5, 150, 105, 0.1)",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                  }}
                />
                {estimatedTime}
              </span>
            </div>
          )}
        </div>

        {/* Realtime Status Notice saat klik tombol */}
        {statusNotice && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background:
                statusNotice.type === "success" ? "#ecfdf5" : "#fffbeb",
              color: statusNotice.type === "success" ? "#065f46" : "#92400e",
              border: `1px solid ${statusNotice.type === "success" ? "#a7f3d0" : "#fde68a"}`,
              animation: "fadeIn 0.2s ease",
            }}
          >
            {statusNotice.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <Clock size={16} />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Footer Brand */}
        <div
          style={{
            marginTop: "22px",
            fontSize: "0.7rem",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        ></div>
      </div>
    </div>
  );
}
