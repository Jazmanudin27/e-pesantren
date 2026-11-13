import React from "react";
import MobileKeuangan from "../mobile/MobileKeuangan";

export default function OwnerLaporanKeuangan({ onBackToHome }) {
  return (
    <MobileKeuangan
      initialSubTab="laporan"
      onBackToHome={onBackToHome}
    />
  );
}
