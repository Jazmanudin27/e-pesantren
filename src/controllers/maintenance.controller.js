import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * Inisialisasi tabel system_maintenance jika belum ada
 */
export const ensureMaintenanceTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_maintenance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_key VARCHAR(50) NOT NULL UNIQUE,
        role_name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        is_maintenance TINYINT(1) DEFAULT 0,
        message TEXT NULL,
        estimated_time VARCHAR(100) NULL,
        updated_by VARCHAR(100) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Inisialisasi role default jika masih kosong
    const defaultRoles = [
      {
        role_key: 'wali',
        role_name: 'Orang Tua / Wali Santri',
        description: 'Portal Orang Tua (Tagihan, Presensi, Tabungan, Perizinan, Tanya Admin)',
        is_maintenance: 0,
        message: 'Mohon maaf, layanan Portal Orang Tua (Wali Santri) saat ini sedang dalam pemeliharaan atau perbaikan sistem. Silakan coba beberapa saat lagi.',
        estimated_time: 'Segera kembali normal'
      },
      {
        role_key: 'pengajar',
        role_name: 'Ustadz / Pengajar',
        description: 'Portal Pengajar / Asatidz (Presensi Mengaji, Nilai Kitab, Pelanggaran & Tahfidz)',
        is_maintenance: 0,
        message: 'Portal Pengajar & Asatidz saat ini sedang dalam pemeliharaan sistem. Harap hubungi admin jika ada keperluan mendesak.',
        estimated_time: 'Segera kembali normal'
      },
      {
        role_key: 'keuangan',
        role_name: 'Keuangan & Bendahara',
        description: 'Layanan Kasir & Administrasi Keuangan (SPP, Tagihan, Kasir Pembayaran, Buku Kas)',
        is_maintenance: 0,
        message: 'Layanan Modul Keuangan & Pembayaran sedang dalam sinkronisasi data dan perbaikan sistem.',
        estimated_time: 'Segera kembali normal'
      },
      {
        role_key: 'asrama',
        role_name: 'Musyrif & Pembina Asrama',
        description: 'Portal Pembina Asrama & Pengasuhan (Mutasi Kamar, Izin Keluar, Cek Kamar)',
        is_maintenance: 0,
        message: 'Portal Asrama & Pengasuhan sedang dalam pemeliharaan berkala.',
        estimated_time: 'Segera kembali normal'
      },
      {
        role_key: 'santri',
        role_name: 'Portal Santri Mobile',
        description: 'Aplikasi Mobile Santri & Menu Umum Santri',
        is_maintenance: 0,
        message: 'Layanan Aplikasi Santri sedang dalam perbaikan sistem.',
        estimated_time: 'Segera kembali normal'
      }
    ];

    for (const r of defaultRoles) {
      await pool.query(
        `INSERT INTO system_maintenance (role_key, role_name, description, is_maintenance, message, estimated_time, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, 'Sistem')
         ON DUPLICATE KEY UPDATE 
           role_name = VALUES(role_name),
           description = COALESCE(system_maintenance.description, VALUES(description))`,
        [r.role_key, r.role_name, r.description, r.is_maintenance, r.message, r.estimated_time]
      );
    }
  } catch (err) {
    console.warn('[system_maintenance] Inisialisasi tabel:', err.message);
  }
};

/**
 * Public Endpoint: Ambil status maintenance semua role (Bisa diakses tanpa login)
 * GET /api/maintenance/status
 */
export const getMaintenanceStatus = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT role_key, role_name, is_maintenance, message, estimated_time, updated_at
      FROM system_maintenance
    `);

    const statusMap = {};
    (rows || []).forEach((row) => {
      statusMap[row.role_key] = {
        role_key: row.role_key,
        role_name: row.role_name,
        is_maintenance: Boolean(row.is_maintenance),
        message: row.message || 'Sistem sedang dalam perbaikan.',
        estimated_time: row.estimated_time || null,
        updated_at: row.updated_at
      };
    });

    return sendSuccess(res, 'Status maintenance berhasil diambil', statusMap);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * Admin Endpoint: Ambil list lengkap konfigurasi maintenance
 * GET /api/maintenance/settings
 */
export const getAllMaintenanceSettings = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT * FROM system_maintenance ORDER BY id ASC
    `);

    const formatted = (rows || []).map((r) => ({
      ...r,
      is_maintenance: Boolean(r.is_maintenance)
    }));

    return sendSuccess(res, 'Daftar pengaturan maintenance berhasil diambil', formatted);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * Admin Endpoint: Toggle atau perbarui status maintenance role tertentu
 * POST /api/maintenance/toggle
 */
export const updateMaintenanceSetting = async (req, res) => {
  try {
    const { role_key, is_maintenance, message, estimated_time } = req.body;

    if (!role_key) {
      return sendError(res, 'role_key wajib ditentukan', 400);
    }

    const updater = req.user?.username || req.body.updated_by || 'Admin';
    const maintenanceVal = is_maintenance === true || is_maintenance === 1 || is_maintenance === '1' ? 1 : 0;

    let updateFields = ['is_maintenance = ?', 'updated_by = ?'];
    let params = [maintenanceVal, updater];

    if (message !== undefined) {
      updateFields.push('message = ?');
      params.push(String(message).trim());
    }

    if (estimated_time !== undefined) {
      updateFields.push('estimated_time = ?');
      params.push(String(estimated_time).trim());
    }

    params.push(role_key);

    const [result] = await pool.query(
      `UPDATE system_maintenance SET ${updateFields.join(', ')} WHERE role_key = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return sendError(res, `Role key "${role_key}" tidak ditemukan`, 404);
    }

    const [updatedRow] = await pool.query(
      'SELECT * FROM system_maintenance WHERE role_key = ? LIMIT 1',
      [role_key]
    );

    const data = updatedRow[0] || {};
    data.is_maintenance = Boolean(data.is_maintenance);

    const actionText = maintenanceVal === 1 ? 'diaktifkan (Sedang Perbaikan)' : 'dinonaktifkan (Operasional Normal)';
    return sendSuccess(res, `Mode maintenance untuk ${data.role_name || role_key} berhasil ${actionText}`, data);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * Helper untuk query cepat status role maintenance di backend (digunakan auth controller / middleware)
 */
export const isRoleInMaintenance = async (roleKey) => {
  try {
    const [rows] = await pool.query(
      'SELECT is_maintenance, message, estimated_time FROM system_maintenance WHERE role_key = ? LIMIT 1',
      [roleKey]
    );
    if (rows && rows.length > 0 && rows[0].is_maintenance == 1) {
      return {
        active: true,
        message: rows[0].message || 'Layanan sedang dalam pemeliharaan sistem.',
        estimated_time: rows[0].estimated_time || null
      };
    }
  } catch (e) {}
  return { active: false };
};
