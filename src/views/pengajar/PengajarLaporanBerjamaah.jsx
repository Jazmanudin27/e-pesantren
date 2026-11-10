import React from "react";
import OwnerLaporanPresensi from "../owner/OwnerLaporanPresensi";

/**
 * Laporan Presensi Shalat Berjamaah (Portal Asatidz / Pengajar)
 * Menginduk langsung ke OwnerLaporanPresensi dengan tipe="berjamaah"
 */
export default function PengajarLaporanBerjamaah(props) {
  return <OwnerLaporanPresensi {...props} tipe="berjamaah" />;
}
