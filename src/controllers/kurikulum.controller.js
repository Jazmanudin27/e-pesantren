import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// Matriks Kurikulum 6 Kelas
export const DEFAULT_KURIKULUM = [
  { no: 1, k1: 'Pegon', k2: 'Bajuri Jilid 1', k3: 'Bajuri Jilid 2', k4: "I'anah Jilid 1", k5: "I'anah Jilid 2", k6: "I'anah Jilid 3" },
  { no: 2, k1: 'Tajwid', k2: 'Sulam Taufik', k3: "Riyadhul Badi'ah", k4: "I'mrithi", k5: 'Lathoif', k6: 'Tafsir' },
  { no: 3, k1: 'Safinah', k2: 'Jurumiyah', k3: 'Al - Kaelani', k4: 'Al - Burdah', k5: 'Mutammimah', k6: 'Muhafadzoh Alfiyah' },
  { no: 4, k1: "Ta'lim", k2: 'Tijan', k3: "Ta'lim", k4: "Ta'lim", k5: 'Bidayatul Hidayah', k6: 'Munadzoroh' },
  { no: 5, k1: 'Akhlaqul Banain jilid 1', k2: "Ta'lim", k3: 'Tafrijul qurob', k4: 'Waroqot', k5: 'Tafsir', k6: 'Baca Kosongan' },
  { no: 6, k1: 'Praktek Ibadah', k2: 'Yaqulu', k3: "Muhafadzoh I'mrithi", k4: 'Tafrijul qurob', k5: 'Muhafadzoh Alfiyah', k6: "Khataman Qur`an" },
  { no: 7, k1: "Al - Qur'an", k2: 'Tafrijul qurob', k3: 'Tasrifan', k4: 'Muhafadzoh Waroqot', k5: 'Munadzoroh', k6: '' },
  { no: 8, k1: 'Bahasa Inggris', k2: 'Muhafadzoh Jurumiyah', k3: 'Praktek Ibadah', k4: 'Baca Kosongan', k5: 'Baca Kosongan', k6: '' },
  { no: 9, k1: 'Penulisan Patokan', k2: 'Tasrifan', k3: "Al qur'an", k4: "Al qur'an", k5: 'Tafrijul qurob', k6: '' },
  { no: 10, k1: "Al - I'lal", k2: 'Praktek Ibadah', k3: 'Munadzoroh', k4: 'Tasrifan', k5: "Khataman Qur`an", k6: '' },
  { no: 11, k1: 'Mufrodatu alfadzi taqrib', k2: "Al qur'an", k3: '', k4: 'Munadzoroh', k5: '', k6: '' }
];

export const initKurikulumTable = async () => {
  try {
    // 1. Tabel Kurikulum & Mata Pelajaran per Kelas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kurikulum_pengajian (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tingkat_kelas INT NOT NULL, -- 1 s/d 6
        urutan INT NOT NULL DEFAULT 1,
        nama_kitab VARCHAR(191) NOT NULL,
        kategori VARCHAR(100) NULL,
        kitab_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tingkat (tingkat_kelas)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabel Jadwal Mengajar Asatidz
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jadwal_mengajar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tingkat_kelas INT NOT NULL, -- 1 s/d 6
        kelas_id INT NULL,
        asatidz_id INT NULL,
        nama_asatidz VARCHAR(191) NULL,
        nama_kitab VARCHAR(191) NOT NULL,
        hari VARCHAR(30) NOT NULL DEFAULT 'Senin',
        jam_mulai VARCHAR(10) DEFAULT '07:30',
        jam_selesai VARCHAR(10) DEFAULT '09:00',
        ruang VARCHAR(100) DEFAULT 'Masjid / Aula',
        keterangan VARCHAR(255) NULL,
        status VARCHAR(30) DEFAULT 'Aktif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_jadwal_tingkat (tingkat_kelas),
        INDEX idx_jadwal_hari (hari)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn('[KURIKULUM] Note init tables:', err.message);
  }
};

// GET /api/kurikulum/matriks
export const getKurikulumMatriks = async (req, res) => {
  try {
    await initKurikulumTable();

    const [rows] = await pool.query(`
      SELECT kp.*, mh.kategori as kategori_kitab, mh.deskripsi
      FROM kurikulum_pengajian kp
      LEFT JOIN materi_hafalan mh ON LOWER(TRIM(kp.nama_kitab)) = LOWER(TRIM(mh.nama_materi))
      ORDER BY kp.urutan ASC, kp.tingkat_kelas ASC
    `);

    // Format jadi matriks 1 s/d 11
    const matrix = [];
    for (let i = 1; i <= 11; i++) {
      const rowItem = { no: i, k1: '', k2: '', k3: '', k4: '', k5: '', k6: '' };
      for (let k = 1; k <= 6; k++) {
        const found = rows.find(r => r.urutan === i && r.tingkat_kelas === k);
        if (found) {
          rowItem[`k${k}`] = found.nama_kitab;
        }
      }
      matrix.push(rowItem);
    }

    return sendSuccess(res, 'Matriks kurikulum berhasil diambil', {
      matrix,
      raw: rows,
      totalKitab: rows.length
    });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// POST /api/kurikulum/matriks (Simpan seluruh matriks)
export const saveKurikulumMatriks = async (req, res) => {
  try {
    await initKurikulumTable();
    const { matrix } = req.body;
    if (!Array.isArray(matrix)) {
      return sendError(res, 'Format data matriks tidak valid', 400);
    }

    // Truncate dan isi ulang
    await pool.query('TRUNCATE TABLE kurikulum_pengajian');

    for (const row of matrix) {
      const urutan = row.no;
      for (let k = 1; k <= 6; k++) {
        const namaKitab = row[`k${k}`];
        if (namaKitab && String(namaKitab).trim()) {
          await pool.query(
            'INSERT INTO kurikulum_pengajian (tingkat_kelas, urutan, nama_kitab) VALUES (?, ?, ?)',
            [k, urutan, String(namaKitab).trim()]
          );
        }
      }
    }

    return sendSuccess(res, 'Kurikulum pengajian berhasil disimpan');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// GET /api/kurikulum/jadwal
export const getJadwalMengajar = async (req, res) => {
  try {
    await initKurikulumTable();
    const { tingkat_kelas, hari, asatidz_id } = req.query;

    let sql = `
      SELECT jm.*, a.nama_asatidz as master_asatidz, a.kategori_asatidz, a.jk, a.no_hp
      FROM jadwal_mengajar jm
      LEFT JOIN asatidz a ON jm.asatidz_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (tingkat_kelas && tingkat_kelas !== 'semua') {
      sql += ' AND jm.tingkat_kelas = ? ';
      params.push(tingkat_kelas);
    }
    if (hari && hari !== 'semua') {
      sql += ' AND jm.hari = ? ';
      params.push(hari);
    }
    if (asatidz_id && asatidz_id !== 'semua') {
      sql += ' AND jm.asatidz_id = ? ';
      params.push(asatidz_id);
    }

    sql += ' ORDER BY FIELD(jm.hari, "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"), jm.jam_mulai ASC, jm.tingkat_kelas ASC ';

    const [rows] = await pool.query(sql, params);
    return sendSuccess(res, 'Data jadwal mengajar asatidz berhasil diambil', { data: rows || [] });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// POST /api/kurikulum/jadwal
export const createJadwalMengajar = async (req, res) => {
  try {
    await initKurikulumTable();
    const { tingkat_kelas, asatidz_id, nama_asatidz, nama_kitab, hari, jam_mulai, jam_selesai, ruang, keterangan } = req.body;

    if (!tingkat_kelas || !nama_kitab || !hari) {
      return sendError(res, 'Tingkat Kelas, Nama Kitab / Pelajaran, dan Hari wajib diisi', 400);
    }

    let finalNamaAsatidz = nama_asatidz || '';
    if (asatidz_id) {
      const [aRow] = await pool.query('SELECT nama_asatidz FROM asatidz WHERE id = ?', [asatidz_id]);
      if (aRow.length > 0) finalNamaAsatidz = aRow[0].nama_asatidz;
    }

    const [resInsert] = await pool.query(`
      INSERT INTO jadwal_mengajar 
      (tingkat_kelas, asatidz_id, nama_asatidz, nama_kitab, hari, jam_mulai, jam_selesai, ruang, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tingkat_kelas,
      asatidz_id || null,
      finalNamaAsatidz,
      nama_kitab,
      hari,
      jam_mulai || '07:30',
      jam_selesai || '09:00',
      ruang || 'Masjid / Aula',
      keterangan || null
    ]);

    return sendSuccess(res, 'Jadwal mengajar berhasil ditambahkan', { id: resInsert.insertId }, 201);
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// PUT /api/kurikulum/jadwal/:id
export const updateJadwalMengajar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tingkat_kelas, asatidz_id, nama_asatidz, nama_kitab, hari, jam_mulai, jam_selesai, ruang, keterangan, status } = req.body;

    let finalNamaAsatidz = nama_asatidz || '';
    if (asatidz_id) {
      const [aRow] = await pool.query('SELECT nama_asatidz FROM asatidz WHERE id = ?', [asatidz_id]);
      if (aRow.length > 0) finalNamaAsatidz = aRow[0].nama_asatidz;
    }

    await pool.query(`
      UPDATE jadwal_mengajar 
      SET tingkat_kelas = ?, asatidz_id = ?, nama_asatidz = ?, nama_kitab = ?, hari = ?, jam_mulai = ?, jam_selesai = ?, ruang = ?, keterangan = ?, status = ?
      WHERE id = ?
    `, [
      tingkat_kelas,
      asatidz_id || null,
      finalNamaAsatidz,
      nama_kitab,
      hari,
      jam_mulai,
      jam_selesai,
      ruang,
      keterangan,
      status || 'Aktif',
      id
    ]);

    return sendSuccess(res, 'Jadwal mengajar berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

// DELETE /api/kurikulum/jadwal/:id
export const deleteJadwalMengajar = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM jadwal_mengajar WHERE id = ?', [id]);
    return sendSuccess(res, 'Jadwal mengajar berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

