/**
 * Utility untuk manajemen hak akses dan pemisahan peran (RBAC)
 * Khususnya memisahkan Admin Keuangan / Bendahara dari Admin Absensi / Musyrif / Ustadz
 */

export const isPureKeuangan = (user) => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  const userType = String(user.userType || '').toLowerCase().trim();
  const username = String(user.username || '').toLowerCase().trim();

  const isKeu =
    role.includes('keuangan') ||
    role.includes('bendahara') ||
    userType.includes('keuangan') ||
    userType.includes('bendahara') ||
    username.includes('keuangan') ||
    username.includes('bendahara');

  const isSuper =
    role.includes('super') ||
    userType.includes('super') ||
    role === 'pengasuh' ||
    username === 'admin';

  return isKeu && !isSuper;
};

export const isPureAbsen = (user) => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase().trim();
  const userType = String(user.userType || '').toLowerCase().trim();
  const username = String(user.username || '').toLowerCase().trim();

  const isAbs =
    role.includes('absen') ||
    userType.includes('absen') ||
    username.includes('absen');

  const isSuper =
    role.includes('super') ||
    userType.includes('super') ||
    role === 'pengasuh' ||
    username === 'admin';

  return isAbs && !isSuper;
};

export const canAccessKeuangan = (user) => {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase().trim();
  const userType = String(user.userType || '').toLowerCase().trim();
  const username = String(user.username || '').toLowerCase().trim();

  // 1. Jika teridentifikasi sebagai Admin Absen, Musyrif, Ustadz, Keamanan -> TOLAK AKSES KEUANGAN!
  if (
    role.includes('absen') ||
    role.includes('asatidz') ||
    role.includes('ustadz') ||
    role.includes('musyrif') ||
    role.includes('keamanan') ||
    role.includes('satpam') ||
    userType.includes('absen') ||
    userType.includes('asatidz') ||
    userType.includes('ustadz') ||
    userType.includes('musyrif') ||
    userType.includes('keamanan') ||
    username.includes('absen') ||
    username.includes('satpam') ||
    username.includes('hamdan')
  ) {
    return false;
  }

  // 2. Hanya izinkan Admin Keuangan, Bendahara, Super Admin, atau Pengasuh
  if (
    role.includes('keuangan') ||
    role.includes('bendahara') ||
    role.includes('super admin') ||
    role === 'pengasuh' ||
    userType.includes('keuangan') ||
    userType.includes('bendahara') ||
    userType.includes('super admin') ||
    username === 'bendahara' ||
    username === 'keuangan' ||
    username === 'admin_keuangan' ||
    username === 'admin'
  ) {
    return true;
  }

  return false;
};

export const canAccessAbsensi = (user) => {
  if (!user) return true;
  // Jika murni Admin Keuangan / Bendahara -> tolak akses Absensi
  if (isPureKeuangan(user)) {
    return false;
  }
  return true;
};


