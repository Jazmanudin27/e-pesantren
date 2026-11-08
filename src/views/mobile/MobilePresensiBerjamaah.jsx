import React from 'react';
import MobilePresensi from './MobilePresensi';

/**
 * MobilePresensiBerjamaah
 * Khusus Presensi Shalat Berjamaah 5 Waktu
 */
export default function MobilePresensiBerjamaah(props) {
  return (
    <MobilePresensi 
      {...props} 
      defaultKategori="berjamaah" 
      hideCategorySwitcher={true} 
    />
  );
}

