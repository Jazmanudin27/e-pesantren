import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { JWT_SECRET } from '../middleware/auth.middleware.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username dan Password wajib diisi.', 400);
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    let account = null;
    let userType = null;

    // 1. Query users table (Admin)
    try {
      const [uRows] = await pool.query(
        'SELECT * FROM users WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) OR LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1',
        [cleanUser, cleanUser]
      );
      if (uRows && uRows.length > 0) {
        account = uRows[0];
        userType = 'Admin';
      }
    } catch (e) {
      console.warn('Query users error:', e.message);
    }

    // 2. Query asrama table
    if (!account) {
      try {
        const [asrRows] = await pool.query(
          `SELECT a.*, ast.nama_asatidz as pembina 
           FROM asrama a 
           LEFT JOIN asatidz ast ON a.pembina_asatidz_id = ast.id 
           WHERE LOWER(TRIM(a.username)) = LOWER(TRIM(?)) 
              OR LOWER(TRIM(a.kode_asrama)) = LOWER(TRIM(?)) 
           LIMIT 1`,
          [cleanUser, cleanUser]
        );

        if (asrRows && asrRows.length > 0) {
          account = asrRows[0];
          userType = 'Asrama';
        } else {
          // Check aliased usernames (asrama1, asrama2, etc.) against real DB rows
          const [allAsrama] = await pool.query(
            `SELECT a.*, ast.nama_asatidz as pembina 
             FROM asrama a 
             LEFT JOIN asatidz ast ON a.pembina_asatidz_id = ast.id 
             ORDER BY a.id ASC`
          );

          const searchLow = cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '');
          const matched = allAsrama.find((a, index) => {
            const u = (a.username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const k = (a.kode_asrama || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const alias1 = `asrama${a.id}`;
            const alias2 = `asrama${index + 1}`;
            return (u && u === searchLow) || (k && k === searchLow) || alias1 === searchLow || alias2 === searchLow;
          });

          if (matched) {
            account = matched;
            userType = 'Asrama';
          }
        }
      } catch (e) {
        console.warn('Query asrama error:', e.message);
      }
    }

    // 3. Query asatidz table (Ustadz / Guru)
    if (!account) {
      try {
        let astRows = [];
        try {
          // Coba query dengan kolom username & join users
          const [resWithUser] = await pool.query(
            `SELECT ast.*, u.username as user_username, u.password as user_password 
             FROM asatidz ast 
             LEFT JOIN users u ON ast.user_id = u.id 
             WHERE LOWER(TRIM(COALESCE(ast.username, ''))) = LOWER(TRIM(?))
                OR (u.username IS NOT NULL AND LOWER(TRIM(u.username)) = LOWER(TRIM(?)))
                OR LOWER(TRIM(ast.nik_niy)) = LOWER(TRIM(?)) 
                OR LOWER(TRIM(ast.email)) = LOWER(TRIM(?)) 
                OR LOWER(TRIM(ast.no_hp)) = LOWER(TRIM(?))
                OR LOWER(TRIM(ast.nama_asatidz)) = LOWER(TRIM(?))
                OR LOWER(TRIM(ast.nama_asatidz)) LIKE LOWER(?)
             LIMIT 1`,
            [cleanUser, cleanUser, cleanUser, cleanUser, cleanUser, cleanUser, `%${cleanUser}%`]
          );
          astRows = resWithUser;
        } catch (colErr) {
          // Fallback jika kolom username belum ada di tabel asatidz
          const [resLegacy] = await pool.query(
            `SELECT ast.*, u.username as user_username, u.password as user_password 
             FROM asatidz ast 
             LEFT JOIN users u ON ast.user_id = u.id 
             WHERE LOWER(TRIM(ast.nik_niy)) = LOWER(TRIM(?)) 
                OR LOWER(TRIM(ast.email)) = LOWER(TRIM(?)) 
                OR LOWER(TRIM(ast.no_hp)) = LOWER(TRIM(?))
                OR LOWER(TRIM(ast.nama_asatidz)) = LOWER(TRIM(?))
                OR LOWER(TRIM(ast.nama_asatidz)) LIKE LOWER(?)
                OR (u.username IS NOT NULL AND LOWER(TRIM(u.username)) = LOWER(TRIM(?)))
             LIMIT 1`,
            [cleanUser, cleanUser, cleanUser, cleanUser, `%${cleanUser}%`, cleanUser]
          );
          astRows = resLegacy;
        }

        if (astRows && astRows.length > 0) {
          account = astRows[0];
          // Jika asatidz.password kosong, gunakan user_password dari tabel users
          if (!account.password && account.user_password) {
            account.password = account.user_password;
          }
          userType = 'Asatidz';
        }
      } catch (e) {
        console.warn('Query asatidz error:', e.message);
      }
    }

    // 4. Query santri table
    if (!account) {
      try {
        const [strRows] = await pool.query(
          `SELECT s.*, a.nama_asrama, k.nama_kamar 
           FROM santri s 
           LEFT JOIN asrama a ON s.asrama_id = a.id 
           LEFT JOIN kamar_kobong k ON s.kamar_id = k.id 
           WHERE LOWER(TRIM(s.nis)) = LOWER(TRIM(?)) 
              OR LOWER(TRIM(s.nisn)) = LOWER(TRIM(?)) 
              OR LOWER(TRIM(s.kode_santri)) = LOWER(TRIM(?)) 
           LIMIT 1`,
          [cleanUser, cleanUser, cleanUser]
        );
        if (strRows && strRows.length > 0) {
          account = strRows[0];
          userType = 'Santri';
        }
      } catch (e) {
        console.warn('Query santri error:', e.message);
      }
    }

    // STRICT CHECK: If username is NOT in database -> REJECT!
    if (!account) {
      return sendError(res, `Username "${cleanUser}" tidak terdaftar di database!`, 401);
    }

    // PASSWORD VERIFICATION FOR REAL DATABASE ACCOUNT
    let isMatch = false;
    const dbPassword = String(account.password || account.pass || '').trim();

    if (dbPassword) {
      // Bcrypt Compare ($2y$, $2a$, $2b$)
      if (dbPassword.startsWith('$2y$') || dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
        const hash = dbPassword.startsWith('$2y$') ? '$2a$' + dbPassword.substring(4) : dbPassword;
        try {
          isMatch = bcrypt.compareSync(cleanPass, hash);
        } catch (e) {
          console.warn('[Bcrypt Compare Error]', e.message);
        }
      }

      // Plain Text Compare
      if (!isMatch && (dbPassword === cleanPass || dbPassword.toLowerCase() === cleanPass.toLowerCase())) {
        isMatch = true;
      }

      // MD5 Compare (32 chars)
      if (!isMatch && dbPassword.length === 32) {
        const md5Hash = crypto.createHash('md5').update(cleanPass).digest('hex');
        if (dbPassword.toLowerCase() === md5Hash.toLowerCase()) {
          isMatch = true;
        }
      }

      // SHA1 Compare (40 chars)
      if (!isMatch && dbPassword.length === 40) {
        const sha1Hash = crypto.createHash('sha1').update(cleanPass).digest('hex');
        if (dbPassword.toLowerCase() === sha1Hash.toLowerCase()) {
          isMatch = true;
        }
      }
    }

    if (!isMatch) {
      return sendError(res, `Password untuk akun "${cleanUser}" salah!`, 401);
    }

    // Generate JWT Token (E-Sekolah Architecture)
    const tokenPayload = {
      id: account.id,
      username: account.username || account.kode_asrama || account.nik_niy || cleanUser,
      role: (account.role || (userType === 'Asatidz' ? 'asatidz' : userType) || 'asrama').toLowerCase(),
      userType: userType === 'Asatidz' ? 'Ustadz / Guru' : userType,
      asrama_id: account.asrama_id || account.id || 1
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Success response with JWT Token
    return sendSuccess(res, 'Login berhasil', {
      token,
      role: tokenPayload.role,
      userType: tokenPayload.userType,
      asrama_id: tokenPayload.asrama_id,
      nama: account.nama_asatidz || account.nama_asrama || account.nama_santri || account.name || cleanUser,
      nama_asatidz: account.nama_asatidz || '',
      nama_asrama: account.nama_asrama || account.nama_santri || account.nama_asatidz || account.name || 'Asrama',
      pembina: account.pembina || account.nama_asatidz || 'Musyrif Asrama',
      username: tokenPayload.username,
      user: {
        id: account.id,
        username: tokenPayload.username,
        role: tokenPayload.role,
        userType: tokenPayload.userType,
        nama: account.nama_asatidz || account.nama_asrama || account.name || cleanUser,
        ...account
      }
    });
  } catch (err) {
    return sendError(res, `Database Error: ${err.message}`, 500);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Profil user berhasil diambil', { user: req.user });
  } catch (err) {
    return sendError(res, err.message, 500);
  }
};
