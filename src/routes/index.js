import express from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import santriRoutes from './santri.routes.js';
import asramaRoutes from './asrama.routes.js';
import tahfidzRoutes from './tahfidz.routes.js';
import perizinanRoutes from './perizinan.routes.js';
import pelanggaranRoutes from './pelanggaran.routes.js';
import absensiRoutes from './absensi.routes.js';
import asatidzRoutes from './asatidz.routes.js';
import pesantrenRoutes from './pesantren.routes.js';

const router = express.Router();

router.use('/', authRoutes); // /api/login, /api/profile
router.use('/dashboard', dashboardRoutes); // /api/dashboard/stats
router.use('/santri', santriRoutes); // /api/santri
router.use('/', asramaRoutes); // /api/asrama, /api/kamar
router.use('/tahfidz', tahfidzRoutes); // /api/tahfidz/halaqah, /api/tahfidz/setoran
router.use('/perizinan', perizinanRoutes); // /api/perizinan
router.use('/pelanggaran', pelanggaranRoutes); // /api/pelanggaran
router.use('/absensi', absensiRoutes); // /api/absensi/fingerprint
router.use('/fingerprint', absensiRoutes); // /api/fingerprint/devices, /api/fingerprint/sesi
router.use('/asatidz', asatidzRoutes); // /api/asatidz
router.use('/pesantren', pesantrenRoutes); // /api/pesantren/profil

export default router;
