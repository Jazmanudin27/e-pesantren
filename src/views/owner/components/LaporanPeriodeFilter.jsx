import React from "react";
import { Calendar, ChevronDown } from "lucide-react";

/**
 * Helper: Buat state awal filter periode laporan ('hari' | 'bulan' | 'tahun')
 */
export function createInitialPeriodeState(defaultMode = "hari") {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return {
    mode: defaultMode,
    tanggalDari: `${y}-${m}-${d}`,
    tanggalSampai: `${y}-${m}-${d}`,
    bulanDari: `${y}-${m}`,
    bulanSampai: `${y}-${m}`,
    tahun: String(y),
  };
}

/**
 * Helper: Konversi state filter periode ke query string API
 */
export function buildPeriodeQueryParams(filterState) {
  if (!filterState) return "periode=hari_ini";
  if (filterState.mode === "hari") {
    return `tanggal_dari=${encodeURIComponent(filterState.tanggalDari || "")}&tanggal_sampai=${encodeURIComponent(filterState.tanggalSampai || "")}`;
  }
  if (filterState.mode === "bulan") {
    return `bulan_dari=${encodeURIComponent(filterState.bulanDari || "")}&bulan_sampai=${encodeURIComponent(filterState.bulanSampai || "")}`;
  }
  return `tahun=${encodeURIComponent(filterState.tahun || String(new Date().getFullYear()))}`;
}

/**
 * Komponen reusable filter periode laporan: Hari (Dari-Sampai), Bulan (Dari-Sampai), Tahun (Select option)
 */
export default function LaporanPeriodeFilter({
  value,
  onChange,
  accentGradient = "linear-gradient(135deg, #0d766e 0%, #059669 100%)",
  accentColor = "#0d766e",
}) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => String(currentYear - 2 + i));
  if (value?.tahun && !yearOptions.includes(String(value.tahun))) {
    yearOptions.push(String(value.tahun));
    yearOptions.sort();
  }

  const updateField = (patch) => {
    if (onChange) {
      onChange({ ...value, ...patch });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "#ffffff",
        borderRadius: "16px",
        padding: "8px 10px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
      }}
    >
      {/* Tab Pills: Hari | Bulan | Tahun */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "#f1f5f9",
          borderRadius: "12px",
          padding: "3px",
        }}
      >
        {[
          { key: "hari", label: "Hari" },
          { key: "bulan", label: "Bulan" },
          { key: "tahun", label: "Tahun" },
        ].map((tab) => {
          const isActive = value?.mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => updateField({ mode: tab.key })}
              style={{
                flex: 1,
                border: "none",
                background: isActive ? accentGradient : "transparent",
                color: isActive ? "#ffffff" : "#64748b",
                fontWeight: isActive ? 800 : 600,
                fontSize: "0.74rem",
                padding: "7px 4px",
                borderRadius: "9px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 3px 8px rgba(13, 118, 110, 0.22)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Input Sesuai Mode Aktif */}
      {value?.mode === "hari" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div
            style={{
              minWidth: 0,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "5px 8px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              <Calendar size={11} color={accentColor} />
              <span>Dari Tanggal</span>
            </label>
            <input
              type="date"
              value={value.tanggalDari || ""}
              onChange={(e) => updateField({ tanggalDari: e.target.value })}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              minWidth: 0,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "5px 8px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              <Calendar size={11} color={accentColor} />
              <span>Sampai Tanggal</span>
            </label>
            <input
              type="date"
              value={value.tanggalSampai || ""}
              onChange={(e) => updateField({ tanggalSampai: e.target.value })}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {value?.mode === "bulan" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div
            style={{
              minWidth: 0,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "5px 8px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              <Calendar size={11} color={accentColor} />
              <span>Dari Bulan</span>
            </label>
            <input
              type="month"
              value={value.bulanDari || ""}
              onChange={(e) => updateField({ bulanDari: e.target.value })}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              minWidth: 0,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              padding: "5px 8px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "0.6rem",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "2px",
              }}
            >
              <Calendar size={11} color={accentColor} />
              <span>Sampai Bulan</span>
            </label>
            <input
              type="month"
              value={value.bulanSampai || ""}
              onChange={(e) => updateField({ bulanSampai: e.target.value })}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {value?.mode === "tahun" && (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "5px 10px",
            position: "relative",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.6rem",
              fontWeight: 700,
              color: "#64748b",
              marginBottom: "2px",
            }}
          >
            <Calendar size={11} color={accentColor} />
            <span>Pilih Tahun</span>
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={value.tahun || String(currentYear)}
              onChange={(e) => updateField({ tahun: e.target.value })}
              style={{
                width: "100%",
                appearance: "none",
                WebkitAppearance: "none",
                border: "none",
                background: "transparent",
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#0f172a",
                outline: "none",
                cursor: "pointer",
                padding: "2px 24px 2px 0",
              }}
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              color="#64748b"
              style={{
                position: "absolute",
                right: "2px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

