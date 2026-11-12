import React from "react";
import {
  AlertTriangle,
  X,
  CreditCard,
  Calendar,
  Clock,
  BellRing,
  Sparkles,
} from "lucide-react";

/**
 * Modal Notifikasi Tagihan Lewat Jatuh Tempo (Portal Wali Santri)
 */
export default function ModalTagihanJatuhTempo({
  open = false,
  tagihanList = [],
  santriNama = "Santri",
  formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID"),
  onClose,
  onBayar,
}) {
  if (!open || tagihanList.length === 0) return null;

  const totalTunggakan = tagihanList.reduce(
    (acc, t) => acc + parseFloat(t.sisa_tagihan || 0),
    0,
  );

  const hitungTelat = (tgl) => {
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today - d) / 86400000));
  };

  const formatTgl = (tgl) => {
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "26px",
          width: "100%",
          maxWidth: "380px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px -12px rgba(220, 38, 38, 0.45)",
          animation: "slideUp 0.25s ease-out",
          border: "1.5px solid rgba(254, 202, 202, 0.7)",
        }}
      >
        {/* Header Premium Rose-Crimson Gradient */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #b91c1c 0%, #991b1b 50%, #450a0a 100%)",
            padding: "20px 20px 22px",
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient Glow Circles */}
          <div
            style={{
              position: "absolute",
              right: "-20px",
              top: "-20px",
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(254, 202, 202, 0.25) 0%, rgba(220, 38, 38, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 3,
            }}
          >
            <X size={16} />
          </button>

          {/* Row Icon Lonceng & Judul Tagihan SPP */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
              position: "relative",
              zIndex: 2,
              paddingRight: "36px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)",
                border: "1.5px solid rgba(255,255,255,0.45)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            >
              <BellRing size={22} color="#ffffff" strokeWidth={2.4} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.12rem",
                  fontWeight: 900,
                  letterSpacing: "-0.3px",
                  lineHeight: 1.25,
                  color: "#ffffff",
                }}
              >
                Tagihan SPP
              </div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#fecaca",
                  marginTop: "2px",
                  lineHeight: 1.3,
                }}
              >
                Lewat Batas Jatuh Tempo
              </div>
            </div>
          </div>

          {/* Total Tunggakan Glass Banner */}
          <div
            style={{
              marginTop: "10px",
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 100%)",
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              borderRadius: "14px",
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              zIndex: 2,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.58rem",
                  fontWeight: 800,
                  color: "#fca5a5",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total SPP Tertunggak
              </div>
              <div
                style={{
                  fontSize: "0.66rem",
                  color: "#fecaca",
                  marginTop: "1px",
                }}
              >
                {tagihanList.length} Bulan Belum Dibayar
              </div>
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.3px",
                textShadow: "0 2px 6px rgba(0,0,0,0.3)",
              }}
            >
              {formatRp(totalTunggakan)}
            </div>
          </div>
        </div>

        {/* Daftar Tagihan */}
        <div
          style={{
            padding: "14px 16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {tagihanList.map((t) => {
            const telat = hitungTelat(t.jatuh_tempo);
            return (
              <div
                key={t.id}
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "14px",
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.judul_tagihan || t.nama_komponen || "Tagihan Santri"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.66rem",
                      color: "#64748b",
                      marginTop: "2px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Calendar size={10} /> Jatuh tempo{" "}
                    {formatTgl(t.jatuh_tempo)}
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      marginTop: "4px",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "6px",
                    }}
                  >
                    <Clock size={9} /> Telat {telat} hari
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 900,
                    color: "#b91c1c",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatRp(t.sisa_tagihan)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={onBayar}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              color: "#ffffff",
              border: "none",
              padding: "12px",
              borderRadius: "14px",
              fontSize: "0.88rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: "0 6px 16px rgba(220, 38, 38, 0.35)",
            }}
          >
            <CreditCard size={17} /> Bayar Sekarang
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              background: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              padding: "10px",
              borderRadius: "14px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ingatkan Nanti
          </button>
        </div>
      </div>
    </div>
  );
}
