import React from 'react';
import MobilePresensi from './MobilePresensi';

/**
 * MobilePresensiMengaji
 * Khusus Presensi Kegiatan Mengaji, Kajian Kitab, dan Halaqah
 */
export default function MobilePresensiMengaji(props) {
  return (
    <MobilePresensi 
      {...props} 
      defaultKategori="mengaji" 
      hideCategorySwitcher={true} 
    />
  );
}

