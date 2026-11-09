import express from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import santriRoutes from './santri.routes.js';
import asramaRoutes from './asrama.routes.js';
import perizinanRoutes from './perizinan.routes.js';
import pelanggaranRoutes from './pelanggaran.routes.js';
import absensiRoutes from './absensi.routes.js';
import asatidzRoutes from './asatidz.routes.js';
import pesantrenRoutes from './pesantren.routes.js';
import kelasRoutes from './kelas.routes.js';
import userRoutes from './user.routes.js';
import praktekRoutes from './praktek.routes.js';
import materiHafalanRoutes from './materiHafalan.routes.js';
import waliRoutes from './wali.routes.js';
import keuanganRoutes from './keuangan.routes.js';
import laporanRoutes from './laporan.routes.js';
import informasiRoutes from './informasi.routes.js';
import perkembanganIkhwanRoutes from './perkembanganIkhwan.routes.js';
import kurikulumRoutes from './kurikulum.routes.js';
import admsRoutes from './adms.routes.js';
import tabunganRoutes from './tabungan.routes.js';
import infakRoutes from './infak.routes.js';
import pesanRoutes from './pesan.routes.js';
import whatsappRoutes from './whatsapp.routes.js';
import sekolahRoutes from './sekolah.routes.js';
import ownerRoutes from './owner.routes.js';

const router = express.Router();

router.use('/iclock', admsRoutes); // Endpoint Resmi ADMS Cloud Server Mesin Fingerprint (MP340/ZKTeco)
router.use('/', authRoutes); // /api/login, /api/profile
router.use('/dashboard', dashboardRoutes); // /api/dashboard/stats
router.use('/santri', santriRoutes); // /api/santri
router.use('/', asramaRoutes); // /api/asrama, /api/kamar
router.use('/kelas', kelasRoutes); // /api/kelas
router.use('/perizinan', perizinanRoutes); // /api/perizinan
router.use('/pelanggaran', pelanggaranRoutes); // /api/pelanggaran
router.use('/absensi', absensiRoutes); // /api/absensi/fingerprint
router.use('/fingerprint', absensiRoutes); // /api/fingerprint/devices, /api/fingerprint/sesi
router.use('/asatidz', asatidzRoutes); // /api/asatidz
router.use('/pesantren', pesantrenRoutes); // /api/pesantren/profil
router.use('/users', userRoutes); // /api/users
router.use('/praktek', praktekRoutes); // /api/praktek
router.use('/materi-hafalan', materiHafalanRoutes); // /api/materi-hafalan
router.use('/wali', waliRoutes); // /api/wali/santri, /api/wali/password
router.use('/keuangan', keuanganRoutes); // /api/keuangan/wali/dashboard, /api/keuangan/wali/bayar, dll
router.use('/tabungan', tabunganRoutes); // /api/tabungan, /api/tabungan/santri/:id, /api/tabungan/setor, /api/tabungan/tarik
router.use('/laporan-perkembangan', laporanRoutes); // /api/laporan-perkembangan/wali, dll
router.use('/informasi-kegiatan', informasiRoutes); // /api/informasi-kegiatan/feed, dll
router.use('/perkembangan-ikhwan', perkembanganIkhwanRoutes); // /api/perkembangan-ikhwan/master, santri-kelas, dll
router.use('/kurikulum', kurikulumRoutes); // /api/kurikulum/matriks, /api/kurikulum/jadwal
router.use('/infak', infakRoutes); // /api/infak/program, /api/infak/santri/:id, /api/infak/create-payment, /api/infak/laporan
router.use('/pesan', pesanRoutes); // /api/pesan/wali/:santri_id, /api/pesan/admin/threads, /api/pesan/admin/reply
router.use('/whatsapp', whatsappRoutes); // /api/whatsapp/settings, /api/whatsapp/tunggakan, /api/whatsapp/broadcast-tagihan, /api/whatsapp/logs
router.use('/sekolah', sekolahRoutes); // /api/sekolah, /api/sekolah/rincian-biaya, /api/sekolah/assign-santri
router.use('/owner', ownerRoutes); // /api/owner/summary, /api/owner/keuangan, /api/owner/presensi, dll

export default router;
