import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * 1. Mengambil Seluruh Kategori Perkembangan Santri (Laki-Laki / Perempuan) beserta Item Master
 * (Permasalahan, Penyebab, Tindakan)
 */
export const getMasterPerkembangan = async (req, res) => {
  try {
    const { gender } = req.query; // 'L' | 'P' | 'Semua'
    let sqlKat = `SELECT * FROM perkembangan_kategori `;
    const params = [];

    if (gender && gender !== 'Semua') {
      sqlKat += ` WHERE gender = ? OR gender = 'Semua' `;
      params.push(gender.toUpperCase());
    }
    sqlKat += ` ORDER BY urutan ASC, id ASC `;

    const [kategoriRows] = await pool.query(sqlKat, params);

    const [itemRows] = await pool.query(`
      SELECT * FROM perkembangan_master_item 
      ORDER BY urutan ASC, id ASC
    `);

    const result = (kategoriRows || []).map(kat => {
      const items = (itemRows || []).filter(it => it.kategori_id === kat.id);
      return {
        ...kat,
        permasalahan: items.filter(it => it.tipe === 'permasalahan'),
        penyebab: items.filter(it => it.tipe === 'penyebab'),
        tindakan: items.filter(it => it.tipe === 'tindakan')
      };
    });

    return sendSuccess(res, 'Master data perkembangan santri berhasil diambil', { data: result, kategori: result });
  } catch (err) {
    return sendError(res, `Gagal memuat master perkembangan: ${err.message}`, 500);
  }
};

/**
 * 2. Tambah Kategori Perkembangan Baru
 */
export const createKategori = async (req, res) => {
  try {
    const { nama_kategori, deskripsi, gender } = req.body;
    if (!nama_kategori) {
      return sendError(res, 'Nama kategori wajib diisi', 400);
    }

    const targetGender = ['L', 'P', 'Semua'].includes(gender) ? gender : 'L';

    const [resKat] = await pool.query(`
      INSERT INTO perkembangan_kategori (nama_kategori, deskripsi, gender)
      VALUES (?, ?, ?)
    `, [nama_kategori.trim(), deskripsi || null, targetGender]);

    return sendSuccess(res, 'Kategori perkembangan berhasil ditambahkan', { id: resKat.insertId });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 3. Update Kategori Perkembangan
 */
export const updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, deskripsi } = req.body;
    await pool.query(`
      UPDATE perkembangan_kategori SET nama_kategori = ?, deskripsi = ? WHERE id = ?
    `, [nama_kategori, deskripsi, id]);
    return sendSuccess(res, 'Kategori berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 4. Hapus Kategori Perkembangan
 */
export const deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM perkembangan_master_item WHERE kategori_id = ?', [id]);
    await pool.query('DELETE FROM perkembangan_kategori WHERE id = ?', [id]);
    return sendSuccess(res, 'Kategori dan item terkait berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 5. Tambah Item Master (Permasalahan / Penyebab / Tindakan)
 */
export const createMasterItem = async (req, res) => {
  try {
    const { kategori_id, tipe, teks, kode } = req.body;
    if (!kategori_id || !tipe || !teks) {
      return sendError(res, 'Kategori, tipe, dan teks item wajib diisi', 400);
    }

    const [maxOrder] = await pool.query(`
      SELECT COALESCE(MAX(urutan), 0) as max_u 
      FROM perkembangan_master_item 
      WHERE kategori_id = ? AND tipe = ?
    `, [kategori_id, tipe]);

    const nextOrder = (maxOrder[0]?.max_u || 0) + 1;
    const defaultKode = kode || String.fromCharCode(96 + nextOrder);

    const [result] = await pool.query(`
      INSERT INTO perkembangan_master_item (kategori_id, tipe, kode, teks, urutan)
      VALUES (?, ?, ?, ?, ?)
    `, [kategori_id, tipe, defaultKode, teks.trim(), nextOrder]);

    return sendSuccess(res, 'Item master berhasil ditambahkan', { id: result.insertId });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 6. Update Item Master (Edit Teks)
 */
export const updateMasterItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { teks, kode } = req.body;
    if (!teks) {
      return sendError(res, 'Teks item wajib diisi', 400);
    }

    await pool.query(`
      UPDATE perkembangan_master_item SET teks = ?, kode = COALESCE(?, kode) WHERE id = ?
    `, [teks.trim(), kode, id]);

    return sendSuccess(res, 'Item master berhasil diperbarui');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 7. Hapus Item Master
 */
export const deleteMasterItem = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM perkembangan_master_item WHERE id = ?', [id]);
    return sendSuccess(res, 'Item master berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 8. Mengambil Daftar Santri (Laki-Laki / Perempuan) Berdasarkan Kelas & Status Evaluasi pada Tanggal Tertentu
 */
export const getSantriIkhwanByKelas = async (req, res) => {
  try {
    const { kelas_id, kategori_id, tanggal, gender } = req.query;

    const tgl = tanggal || new Date().toISOString().slice(0, 10);
    const targetGender = (gender || 'L').toUpperCase();

    // Pastikan cek keberadaan kolom kelas di tabel santri secara dinamis
    let hasKelasCol = false;
    try {
      const [cols] = await pool.query("SHOW COLUMNS FROM santri LIKE 'kelas'");
      hasKelasCol = cols && cols.length > 0;
      if (!hasKelasCol) {
        await pool.query("ALTER TABLE santri ADD COLUMN kelas VARCHAR(100) NULL DEFAULT NULL");
        hasKelasCol = true;
      }
    } catch (e) {
      hasKelasCol = false;
    }

    let sql = `
      SELECT 
        s.id as santri_id,
        s.nis,
        s.kode_santri,
        s.nama_santri,
        s.jk,
        s.asrama_id,
        s.kamar_id,
        a.nama_asrama,
        k.nama_kamar,
        ev.id as evaluasi_id,
        ev.status_kelulusan,
        ev.permasalahan_ids,
        ev.penyebab_ids,
        ev.tindakan_ids,
        ev.catatan_tambahan,
        ev.tanggal as tanggal_evaluasi
      FROM santri s
      LEFT JOIN asrama a ON s.asrama_id = a.id
      LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
      LEFT JOIN perkembangan_evaluasi_santri ev 
        ON ev.santri_id = s.id 
        AND ev.kategori_id = ? 
        AND ev.tanggal = ?
      WHERE ${targetGender === 'P' ? "(s.jk = 'P' OR UPPER(s.jk) LIKE 'P%')" : "(s.jk = 'L' OR UPPER(s.jk) LIKE 'L%' OR s.jk IS NULL OR s.jk = '')"}
        AND (s.status IS NULL OR s.status = '' OR s.status = 'Aktif' OR s.status_santri = 'Mukim' OR s.status_santri = 'Kalong')
    `;
    const params = [kategori_id || 0, tgl];

    if (kelas_id && !kelas_id.toLowerCase().includes('semua')) {
      if (hasKelasCol) {
        sql += ` AND (s.kelas = ? OR a.nama_asrama LIKE ? OR a.id = ?) `;
        params.push(kelas_id, `%${kelas_id}%`, kelas_id);
      } else {
        sql += ` AND (a.nama_asrama LIKE ? OR a.id = ?) `;
        params.push(`%${kelas_id}%`, kelas_id);
      }
    }

    sql += ` ORDER BY s.nama_santri ASC `;

    let rows = [];
    try {
      const [r] = await pool.query(sql, params);
      rows = r;
    } catch (queryErr) {
      // Fail-safe: jika masih ada error field/kolom s.kelas, retry dengan query aman tanpa referensi s.kelas
      console.warn('[PERKEMBANGAN IKHWAN] Query santri fallback:', queryErr.message);
      const safeSql = `
        SELECT 
          s.id as santri_id,
          s.nis,
          s.kode_santri,
          s.nama_santri,
          s.jk,
          s.asrama_id,
          s.kamar_id,
          a.nama_asrama,
          k.nama_kamar,
          ev.id as evaluasi_id,
          ev.status_kelulusan,
          ev.permasalahan_ids,
          ev.penyebab_ids,
          ev.tindakan_ids,
          ev.catatan_tambahan,
          ev.tanggal as tanggal_evaluasi
        FROM santri s
        LEFT JOIN asrama a ON s.asrama_id = a.id
        LEFT JOIN kamar_kobong k ON s.kamar_id = k.id
        LEFT JOIN perkembangan_evaluasi_santri ev 
          ON ev.santri_id = s.id 
          AND ev.kategori_id = ? 
          AND ev.tanggal = ?
        WHERE ${targetGender === 'P' ? "(s.jk = 'P' OR UPPER(s.jk) LIKE 'P%')" : "(s.jk = 'L' OR UPPER(s.jk) LIKE 'L%' OR s.jk IS NULL OR s.jk = '')"}
          AND (s.status IS NULL OR s.status = '' OR s.status = 'Aktif' OR s.status_santri = 'Mukim' OR s.status_santri = 'Kalong')
        ORDER BY s.nama_santri ASC
      `;
      const [retryRows] = await pool.query(safeSql, [kategori_id || 0, tgl]);
      rows = retryRows;
    }

    // Parse JSON / Comma string into array
    const santriEvaluasi = (rows || []).map(r => ({
      ...r,
      status_kelulusan: r.status_kelulusan || 'Lulus',
      permasalahan_list: (() => {
        try {
          return r.permasalahan_ids ? (typeof r.permasalahan_ids === 'string' ? JSON.parse(r.permasalahan_ids) : r.permasalahan_ids) : [];
        } catch (e) { return []; }
      })(),
      penyebab_list: (() => {
        try {
          return r.penyebab_ids ? (typeof r.penyebab_ids === 'string' ? JSON.parse(r.penyebab_ids) : r.penyebab_ids) : [];
        } catch (e) { return []; }
      })(),
      tindakan_list: (() => {
        try {
          return r.tindakan_ids ? (typeof r.tindakan_ids === 'string' ? JSON.parse(r.tindakan_ids) : r.tindakan_ids) : [];
        } catch (e) { return []; }
      })()
    }));

    return sendSuccess(res, 'Daftar santri berhasil dimuat', {
      data: {
        tanggal: tgl,
        gender: targetGender,
        kategori_id: parseInt(kategori_id) || null,
        kelas_id: kelas_id || 'Semua',
        santri: santriEvaluasi
      },
      santri: santriEvaluasi
    });
  } catch (err) {
    return sendError(res, `Gagal memuat santri: ${err.message}`, 500);
  }
};

/**
 * 9. Simpan Evaluasi Perkembangan Batch (Satu Kelas)
 */
export const saveEvaluasiBatch = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { kategori_id, kelas_id, tanggal, evaluasi, asatidz_pencatat } = req.body;

    if (!kategori_id || !tanggal || !Array.isArray(evaluasi) || evaluasi.length === 0) {
      return sendError(res, 'Kategori, tanggal, dan data santri wajib diisi', 400);
    }

    await connection.beginTransaction();

    const author = asatidz_pencatat || (req.user?.nama || 'Musyrif Pembina Ikhwan');

    for (const item of evaluasi) {
      const {
        santri_id,
        status_kelulusan,
        permasalahan,
        penyebab,
        tindakan,
        catatan_tambahan
      } = item;

      const pJson = Array.isArray(permasalahan) ? JSON.stringify(permasalahan) : (permasalahan ? JSON.stringify([permasalahan]) : '[]');
      const cJson = Array.isArray(penyebab) ? JSON.stringify(penyebab) : (penyebab ? JSON.stringify([penyebab]) : '[]');
      const tJson = Array.isArray(tindakan) ? JSON.stringify(tindakan) : (tindakan ? JSON.stringify([tindakan]) : '[]');

      await connection.query(`
        INSERT INTO perkembangan_evaluasi_santri 
        (santri_id, kategori_id, kelas_id, tanggal, status_kelulusan, permasalahan_ids, penyebab_ids, tindakan_ids, catatan_tambahan, asatidz_pencatat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          status_kelulusan = VALUES(status_kelulusan),
          permasalahan_ids = VALUES(permasalahan_ids),
          penyebab_ids = VALUES(penyebab_ids),
          tindakan_ids = VALUES(tindakan_ids),
          catatan_tambahan = VALUES(catatan_tambahan),
          asatidz_pencatat = VALUES(asatidz_pencatat),
          updated_at = NOW()
      `, [santri_id, kategori_id, kelas_id || null, tanggal, status_kelulusan || 'Lulus', pJson, cJson, tJson, catatan_tambahan || null, author]);
    }

    await connection.commit();

    return sendSuccess(res, `Evaluasi perkembangan untuk ${evaluasi.length} santri berhasil disimpan!`);
  } catch (err) {
    await connection.rollback();
    return sendError(res, `Gagal menyimpan evaluasi: ${err.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * 10. Rekap Laporan & Riwayat Evaluasi Perkembangan
 */
export const getRekapEvaluasi = async (req, res) => {
  try {
    const { kategori_id, status, search, limit, gender, santri_id } = req.query;

    let sql = `
      SELECT 
        ev.*,
        s.nama_santri,
        s.nis,
        s.jk,
        s.kode_santri,
        s.nama_wali,
        s.no_wa_wali,
        a.nama_asrama,
        pk.nama_kategori,
        pk.gender as kategori_gender
      FROM perkembangan_evaluasi_santri ev
      JOIN santri s ON ev.santri_id = s.id
      JOIN perkembangan_kategori pk ON ev.kategori_id = pk.id
      LEFT JOIN asrama a ON s.asrama_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (santri_id) {
      sql += ` AND ev.santri_id = ? `;
      params.push(santri_id);
    } else if (gender && gender !== 'Semua') {
      if (gender.toUpperCase() === 'P') {
        sql += ` AND s.jk = 'P' `;
      } else {
        sql += ` AND (s.jk = 'L' OR s.jk IS NULL) `;
      }
    }

    if (kategori_id && !String(kategori_id).toLowerCase().includes('semua')) {
      sql += ` AND ev.kategori_id = ? `;
      params.push(kategori_id);
    }

    if (status && !String(status).toLowerCase().includes('semua')) {
      sql += ` AND ev.status_kelulusan = ? `;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (s.nama_santri LIKE ? OR s.nis LIKE ?) `;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ` ORDER BY ev.tanggal DESC, ev.id DESC LIMIT ${parseInt(limit) || 100} `;

    const [rows] = await pool.query(sql, params);

    const formatted = (rows || []).map(r => ({
      ...r,
      permasalahan_list: r.permasalahan_ids ? JSON.parse(r.permasalahan_ids) : [],
      penyebab_list: r.penyebab_ids ? JSON.parse(r.penyebab_ids) : [],
      tindakan_list: r.tindakan_ids ? JSON.parse(r.tindakan_ids) : []
    }));

    return sendSuccess(res, 'Rekap evaluasi perkembangan santri berhasil dimuat', { data: formatted, rekap: formatted });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};

/**
 * 11. Hapus Satu Data Evaluasi Perkembangan
 */
export const deleteEvaluasi = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM perkembangan_evaluasi_santri WHERE id = ?', [id]);
    return sendSuccess(res, 'Data evaluasi perkembangan berhasil dihapus');
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};


