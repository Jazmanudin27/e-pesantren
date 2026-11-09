import express from 'express';
import pool from '../config/database.js';
import { getAllSantri, createSantri, updateSantri, deleteSantri, importSantri } from '../controllers/santri.controller.js';

const router = express.Router();

// Cache kolom santri agar tidak SHOW COLUMNS berulang-ulang di setiap request
let santriColsCache = null;
const getSantriColumns = async () => {
  if (santriColsCache) return santriColsCache;
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM santri");
    santriColsCache = new Set((cols || []).map(c => c.Field));
  } catch (e) {
    santriColsCache = new Set(['id', 'nis', 'nama_santri', 'nama_kelas', 'kelas_id', 'asrama_id', 'kamar_id', 'face_descriptor']);
  }
  return santriColsCache;
};

router.get('/', getAllSantri);

// 1. Endpoint Cepat: Ambil semua santri yang memiliki face_descriptor di MySQL (Hanya Biometrik Vektor, Tanpa Base64 Foto)
router.get('/with-face', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(
      "SELECT id, nis, nama_santri, face_descriptor FROM santri WHERE face_descriptor IS NOT NULL AND face_descriptor != ''"
    );
    const cleaned = rows.map(r => {
      let desc = r.face_descriptor;
      if (typeof desc === 'string') {
        try { desc = JSON.parse(desc); } catch (e) {}
      }
      if (desc && typeof desc === 'string') {
        try { desc = JSON.parse(desc); } catch (e) {}
      }
      if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
        desc = Object.values(desc);
      }
      return {
        id: r.id,
        nis: r.nis,
        nama_santri: r.nama_santri,
        face_descriptor: desc,
        has_face: Array.isArray(desc) && desc.length === 128
      };
    });
    return res.json({ success: true, total: cleaned.length, data: cleaned });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Endpoint Super Ringan & Cepat untuk Halaman Daftar Wajah Mobile (Tanpa Base64 Raksasa)
router.get('/for-face-registration', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const colSet = await getSantriColumns();
    const hasNamaKelas = colSet.has('nama_kelas');
    const hasKelasId = colSet.has('kelas_id');
    const hasAsramaId = colSet.has('asrama_id');
    const hasFaceDesc = colSet.has('face_descriptor');
    const hasFoto = colSet.has('foto');

    const kelasSelect = hasNamaKelas
      ? "COALESCE(kl.nama_kelas, s.nama_kelas, '') as nama_kelas,"
      : "COALESCE(kl.nama_kelas, '') as nama_kelas,";
    const kelasJoin = hasKelasId
      ? "LEFT JOIN kelas kl ON s.kelas_id = kl.id"
      : (hasNamaKelas ? "LEFT JOIN kelas kl ON s.nama_kelas = kl.nama_kelas" : "");
    const asramaJoin = hasAsramaId
      ? "LEFT JOIN asrama a ON s.asrama_id = a.id"
      : "";

    const faceDescCase = hasFaceDesc
      ? "CASE WHEN (s.face_descriptor IS NOT NULL AND s.face_descriptor != '' AND s.face_descriptor != '[]') THEN 1 ELSE 0 END AS has_face_descriptor,"
      : "0 AS has_face_descriptor,";

    const photoCase = hasFoto
      ? "CASE WHEN (s.foto IS NOT NULL AND s.foto != '') THEN 1 ELSE 0 END AS has_photo"
      : "0 AS has_photo";

    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        ${hasKelasId ? 's.kelas_id,' : 'NULL as kelas_id,'}
        ${kelasSelect}
        ${hasAsramaId ? "COALESCE(a.nama_asrama, '') as nama_asrama," : "'' as nama_asrama,"}
        ${faceDescCase}
        ${photoCase}
      FROM santri s
      ${asramaJoin}
      ${kelasJoin}
      ORDER BY s.id ASC
    `);
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1b2. Ambil daftar santri yang memiliki foto tapi belum memiliki biometrik face_descriptor
router.get('/photos-without-descriptor', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        s.nama_kelas, 
        s.foto
      FROM santri s
      WHERE (s.foto IS NOT NULL AND s.foto != '')
        AND (s.face_descriptor IS NULL OR s.face_descriptor = '' OR s.face_descriptor = '[]')
      ORDER BY s.id ASC
    `);
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Endpoint Image Thumbnail Ringan & Ter-cache (Hanya kirim biner gambar saat card tampil di layar)
router.get('/:id/photo-thumb', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT foto FROM santri WHERE id = ?', [id]);
    if (!rows.length || !rows[0].foto) {
      return res.status(404).send('No photo');
    }
    const rawFoto = rows[0].foto;
    if (typeof rawFoto === 'string' && rawFoto.startsWith('data:image/')) {
      const parts = rawFoto.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const imgBuffer = Buffer.from(parts[1], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(imgBuffer);
    } else if (typeof rawFoto === 'string' && (rawFoto.startsWith('http://') || rawFoto.startsWith('https://'))) {
      return res.redirect(rawFoto);
    } else {
      return res.status(404).send('Invalid photo format');
    }
  } catch (err) {
    return res.status(500).send('Server error');
  }
});

// 1d. Endpoint Cepat & Ringan untuk Presensi Mobile (Super Ringan ~10 KB vs 5.5 MB, Tanpa Base64 Foto)
// Mendukung filter kelas via query: /api/santri/for-presensi?kelas=Kelas+1 atau ?kelas_id=1
router.get('/for-presensi', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { kelas, kelas_id } = req.query;

    const colSet = await getSantriColumns();
    const hasNamaKelas = colSet.has('nama_kelas');
    const hasKelasId = colSet.has('kelas_id');
    const hasAsramaId = colSet.has('asrama_id');
    const hasKamarId = colSet.has('kamar_id');
    const hasJk = colSet.has('jk');
    const hasJenisKelamin = colSet.has('jenis_kelamin');

    const jkSelect = hasJk ? 's.jk,' : (hasJenisKelamin ? 's.jenis_kelamin as jk,' : "'L' as jk,");

    const kelasSelect = hasNamaKelas
      ? "COALESCE(kl.nama_kelas, s.nama_kelas, '') as nama_kelas,"
      : "COALESCE(kl.nama_kelas, '') as nama_kelas,";

    const kelasJoin = hasKelasId
      ? "LEFT JOIN kelas kl ON s.kelas_id = kl.id"
      : (hasNamaKelas ? "LEFT JOIN kelas kl ON s.nama_kelas = kl.nama_kelas" : "");

    const asramaJoin = hasAsramaId
      ? "LEFT JOIN asrama a ON s.asrama_id = a.id"
      : "";

    const kamarJoin = hasKamarId
      ? "LEFT JOIN kamar_kobong k ON s.kamar_id = k.id"
      : "";

    let whereClause = "";
    const params = [];
    if (kelas_id) {
      if (hasKelasId) {
        whereClause = "WHERE s.kelas_id = ?";
        params.push(kelas_id);
      }
    } else if (kelas && kelas !== 'Semua' && String(kelas).trim() !== '') {
      const qKls = String(kelas).trim();
      const conds = [];
      if (hasNamaKelas) {
        conds.push("s.nama_kelas = ?");
        params.push(qKls);
      }
      if (kelasJoin) {
        conds.push("kl.nama_kelas = ?");
        params.push(qKls);
      }
      if (conds.length > 0) {
        whereClause = `WHERE (${conds.join(" OR ")})`;
      }
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        ${jkSelect}
        NULL as foto,
        ${hasKelasId ? 's.kelas_id,' : 'NULL as kelas_id,'}
        ${kelasSelect}
        ${hasAsramaId ? 's.asrama_id,' : 'NULL as asrama_id,'}
        COALESCE(a.nama_asrama, '') as nama_asrama,
        ${hasKamarId ? 's.kamar_id,' : 'NULL as kamar_id,'}
        COALESCE(k.nama_kamar, '') as nama_kamar,
        CASE WHEN (COALESCE(s.is_haid, 0) = 1 OR sh_haid.id IS NOT NULL) THEN 1 ELSE 0 END as is_haid,
        sh_haid.tgl_mulai as tgl_haid_mulai,
        s.face_descriptor
      FROM santri s
      LEFT JOIN santri_haid sh_haid ON s.id = sh_haid.santri_id AND sh_haid.status = 'aktif'
      ${asramaJoin}
      ${kamarJoin}
      ${kelasJoin}
      ${whereClause}
      ORDER BY s.id ASC
    `, params);
    return res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1e. Endpoint Baru: Ambil Santri Berdasarkan Kelas Tertentu (Ringan Khusus Presensi Mengaji, ~4 KB)
router.get('/by-kelas/:kelas', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { kelas } = req.params;
    const qKls = decodeURIComponent(kelas || '').trim();

    if (!qKls || qKls === 'Semua') {
      return res.redirect('/api/santri/for-presensi');
    }

    const colSet = await getSantriColumns();
    const hasNamaKelas = colSet.has('nama_kelas');
    const hasKelasId = colSet.has('kelas_id');
    const hasAsramaId = colSet.has('asrama_id');
    const hasKamarId = colSet.has('kamar_id');
    const hasJk = colSet.has('jk');
    const hasJenisKelamin = colSet.has('jenis_kelamin');

    const jkSelect = hasJk ? 's.jk,' : (hasJenisKelamin ? 's.jenis_kelamin as jk,' : "'L' as jk,");

    const kelasSelect = hasNamaKelas
      ? "COALESCE(kl.nama_kelas, s.nama_kelas, '') as nama_kelas,"
      : "COALESCE(kl.nama_kelas, '') as nama_kelas,";

    const kelasJoin = hasKelasId
      ? "LEFT JOIN kelas kl ON s.kelas_id = kl.id"
      : (hasNamaKelas ? "LEFT JOIN kelas kl ON s.nama_kelas = kl.nama_kelas" : "");

    const asramaJoin = hasAsramaId ? "LEFT JOIN asrama a ON s.asrama_id = a.id" : "";
    const kamarJoin = hasKamarId ? "LEFT JOIN kamar_kobong k ON s.kamar_id = k.id" : "";

    const isNumericId = /^\d+$/.test(qKls);
    let whereClause = "";
    const params = [];

    if (isNumericId && hasKelasId) {
      whereClause = "WHERE s.kelas_id = ?";
      params.push(Number(qKls));
    } else {
      const conds = [];
      if (hasNamaKelas) {
        conds.push("s.nama_kelas = ?");
        params.push(qKls);
      }
      if (kelasJoin) {
        conds.push("kl.nama_kelas = ?");
        params.push(qKls);
      }
      whereClause = conds.length > 0 ? `WHERE (${conds.join(" OR ")})` : "";
    }

    const [rows] = await pool.query(`
      SELECT 
        s.id, 
        s.nis, 
        s.nama_santri, 
        ${jkSelect}
        NULL as foto,
        ${hasKelasId ? 's.kelas_id,' : 'NULL as kelas_id,'}
        ${kelasSelect}
        ${hasAsramaId ? 's.asrama_id,' : 'NULL as asrama_id,'}
        COALESCE(a.nama_asrama, '') as nama_asrama,
        ${hasKamarId ? 's.kamar_id,' : 'NULL as kamar_id,'}
        COALESCE(k.nama_kamar, '') as nama_kamar,
        CASE WHEN (COALESCE(s.is_haid, 0) = 1 OR sh_haid.id IS NOT NULL) THEN 1 ELSE 0 END as is_haid,
        sh_haid.tgl_mulai as tgl_haid_mulai,
        s.face_descriptor
      FROM santri s
      LEFT JOIN santri_haid sh_haid ON s.id = sh_haid.santri_id AND sh_haid.status = 'aktif'
      ${asramaJoin}
      ${kamarJoin}
      ${kelasJoin}
      ${whereClause}
      ORDER BY s.id ASC
    `, params);

    return res.json({ success: true, total: rows.length, kelas: qKls, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Endpoint Cek Status Biometrik 1 Santri Tertentu
router.get('/:id/face-status', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, nis, nama_santri, foto, face_descriptor FROM santri WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Santri tidak ditemukan' });
    const r = rows[0];
    let desc = r.face_descriptor;
    if (typeof desc === 'string') {
      try { desc = JSON.parse(desc); } catch (e) {}
    }
    if (desc && typeof desc === 'string') {
      try { desc = JSON.parse(desc); } catch (e) {}
    }
    if (desc && typeof desc === 'object' && !Array.isArray(desc)) {
      desc = Object.values(desc);
    }
    const hasDesc = Array.isArray(desc) && desc.length === 128;
    return res.json({
      success: true,
      santri: {
        id: r.id,
        nis: r.nis,
        nama_santri: r.nama_santri,
        foto: r.foto,
        has_face: hasDesc,
        face_descriptor: hasDesc ? desc : null,
        descriptor_length: desc ? (desc.length || Object.keys(desc).length) : 0
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.post('/', createSantri);
router.post('/import', importSantri);
router.patch('/:id/foto', async (req, res) => {
  try {
    const { id } = req.params;
    const { foto, foto_santri, descriptor, face_descriptor, clear_face } = req.body || {};
    const finalFoto = foto !== undefined ? foto : (foto_santri !== undefined ? foto_santri : null);
    
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN foto LONGTEXT NULL AFTER nama_santri");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
    } catch (e) {}

    // Jika clear_face true atau foto dikirim null/kosong: hapus foto DAN biometrik sekaligus!
    if (clear_face || finalFoto === null || finalFoto === '') {
      await pool.query("UPDATE santri SET foto = NULL, face_descriptor = NULL WHERE id = ?", [id]).catch(async () => {
        await pool.query("UPDATE santri SET foto = NULL WHERE id = ?", [id]).catch(() => {});
      });
      return res.json({ 
        success: true, 
        message: 'Foto wajah dan biometrik santri berhasil dihapus dari database' 
      });
    }

    let rawDesc = face_descriptor || descriptor;
    let finalDescriptor = null;
    if (rawDesc) {
      finalDescriptor = typeof rawDesc === 'string' ? rawDesc : JSON.stringify(rawDesc);
    }

    if (finalDescriptor !== null) {
      await pool.query("UPDATE santri SET foto = COALESCE(?, foto), face_descriptor = ? WHERE id = ?", [finalFoto, finalDescriptor, id]);
    } else {
      await pool.query("UPDATE santri SET foto = ? WHERE id = ?", [finalFoto, id]);
    }

    return res.json({ 
      success: true, 
      message: 'Foto wajah & biometrik santri berhasil disimpan ke database' 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

// Endpoint Spesifik: Hapus Biometrik & Foto Wajah Santri
const deleteFaceHandler = async (req, res) => {
  try {
    const { id } = req.params;
    try {
      await pool.query("UPDATE santri SET face_descriptor = NULL, foto = NULL WHERE id = ?", [id]);
    } catch (eSql) {
      await pool.query("UPDATE santri SET foto = NULL WHERE id = ?", [id]).catch(() => {});
    }
    return res.json({ 
      success: true, 
      message: `Data biometrik & foto wajah santri ID ${id} berhasil dihapus dari database` 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.delete('/:id/face-descriptor', deleteFaceHandler);
router.delete('/:id/foto', deleteFaceHandler);
router.delete('/:id/face', deleteFaceHandler);

router.post('/:id/face-descriptor', async (req, res) => {
  try {
    const { id } = req.params;
    const { face_descriptor, descriptor, foto } = req.body;
    const desc = face_descriptor || descriptor;
    if (!desc && (!foto || foto === null)) {
      await pool.query("UPDATE santri SET face_descriptor = NULL, foto = NULL WHERE id = ?", [id]);
      return res.json({ success: true, message: 'Biometrik dan foto wajah berhasil dihapus' });
    }
    const strDesc = typeof desc === 'string' ? desc : JSON.stringify(desc);
    try {
      await pool.query("ALTER TABLE santri ADD COLUMN face_descriptor LONGTEXT NULL AFTER foto");
    } catch (e) {}
    if (foto) {
      await pool.query("UPDATE santri SET face_descriptor = ?, foto = COALESCE(?, foto) WHERE id = ?", [strDesc, foto, id]);
    } else {
      await pool.query("UPDATE santri SET face_descriptor = ? WHERE id = ?", [strDesc, id]);
    }
    const [rows] = await pool.query("SELECT id, nama_santri, nis, face_descriptor FROM santri WHERE id = ?", [id]);
    return res.json({ 
      success: true, 
      message: `Biometrik wajah santri ID ${id} (${rows[0]?.nama_santri || 'Santri'}) berhasil disimpan di database MySQL`, 
      santri: rows[0] 
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
router.put('/:id', updateSantri);
router.delete('/:id', deleteSantri);

export default router;
