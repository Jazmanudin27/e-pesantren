import React from "react";
import { FileText, Award, Sparkles, BookOpen } from "lucide-react";

export default function MobileLaporanTahfidz() {
  const tasmiLogs = [];

  return (
    <div style={{ padding: "16px" }}>
      {/* List Ujian Tasmi Card */}
      <div
        style={{
          fontWeight: 800,
          fontSize: "0.92rem",
          marginBottom: "10px",
          color: "#0f172a",
        }}
      >
        📜 Sertifikasi & Riwayat Ujian Tasmi'
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {tasmiLogs.map((t, idx) => (
          <div
            key={idx}
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                {t.tgl}
              </span>
              <span className="badge badge-success">{t.predikat}</span>
            </div>
            <div
              style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}
            >
              {t.jenis}
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#0284c7",
                fontWeight: 700,
                margin: "4px 0",
              }}
            >
              Cakupan: {t.juz}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "8px",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "8px",
                fontSize: "0.76rem",
              }}
            >
              <span style={{ color: "#059669", fontWeight: 700 }}>
                Nilai: {t.nilai}
              </span>
              <span style={{ color: "#64748b" }}>Penguji: {t.ustadz}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
