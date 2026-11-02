import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.util.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'epesantren_secret_key_2026';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;

  if (!token) {
    return sendError(res, 'Akses ditolak. Token autentikasi tidak ditemukan.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Token tidak valid atau telah kedaluwarsa.', 403);
  }
};
