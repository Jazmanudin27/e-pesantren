import express from 'express';
import { login, getProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/profile', verifyToken, getProfile);

export default router;
