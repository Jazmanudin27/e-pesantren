import express from 'express';
import { getProfilPesantren } from '../controllers/pesantren.controller.js';

const router = express.Router();

router.get('/profil', getProfilPesantren);

export default router;
