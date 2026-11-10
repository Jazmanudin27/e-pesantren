import React from "react";
import MobilePraktek from "../mobile/MobilePraktek";

/**
 * Menu Evaluasi Praktek Ibadah (Portal Asatidz / Pengajar)
 * Menginduk langsung ke MobilePraktek (Mobile Admin)
 */
export default function PengajarPraktekView(props) {
  return <MobilePraktek {...props} />;
}
