import React from "react";
import OwnerLaporanPresensi from "../owner/OwnerLaporanPresensi";

/**
 * Laporan Presensi Kegiatan Mengaji (Portal Asatidz / Pengajar)
 * Menginduk langsung ke OwnerLaporanPresensi dengan tipe="mengaji"
 */
export default function PengajarLaporanMengaji(props) {
  return <OwnerLaporanPresensi {...props} tipe="mengaji" />;
}
