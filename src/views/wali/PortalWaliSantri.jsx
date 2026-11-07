import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Home,
  Wallet,
  CreditCard,
  Fingerprint,
  User,
  RotateCw,
  Check,
  X,
  Clock,
  DoorOpen,
} from "lucide-react";

// Modular Tab Components
import TabBerandaWali from "./TabBerandaWali";
import TabBukuTabunganWali from "./TabBukuTabunganWali";
import TabProfilWali from "./TabProfilWali";
import TabPerizinanWali from "./TabPerizinanWali";
import TabAbsensiWali from "./TabAbsensiWali";
import TabPraktekWali from "./TabPraktekWali";
import TabTataTertibWali from "./TabTataTertibWali";
import TabNotifikasiWali from "./TabNotifikasiWali";
import TabTagihanKeuangan from "./TabTagihanKeuangan";
import TabLaporanPerkembangan from "./TabLaporanPerkembangan";
import TabInformasiKegiatan from "./TabInformasiKegiatan";
import TabInfakSedekahWali from "./TabInfakSedekahWali";
import TabPesanWali from "./TabPesanWali";
import ModalTagihanJatuhTempo from "./ModalTagihanJatuhTempo";
import ModalPengumumanWali from "./ModalPengumumanWali";

import {
  showConfirm,
  toastSuccess,
  showError,
  showSuccess,
} from "../../utils/alert.util";

export default function PortalWaliSantri({ onLogout, customSantriId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [santriList, setSantriList] = useState([]);
  const [keuanganSummary, setKeuanganSummary] = useState(null);
  const [tabunganData, setTabunganData] = useState({
    saldo_saat_ini: 0,
    total_masuk: 0,
    total_keluar: 0,
    riwayat_transaksi: [],
  });
  const [loadingTabungan, setLoadingTabungan] = useState(false);
  const [transaksiPending, setTransaksiPending] = useState(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(true);
  const [processingPending, setProcessingPending] = useState(false);
  const [latestFeed, setLatestFeed] = useState([]);
  const [pengumumanAktifList, setPengumumanAktifList] = useState([]);
  const [isPengumumanModalOpen, setIsPengumumanModalOpen] = useState(false);
  const [tagihanJatuhTempo, setTagihanJatuhTempo] = useState([]);
  const [isJatuhTempoModalOpen, setIsJatuhTempoModalOpen] = useState(false);
  const [notifikasiList, setNotifikasiList] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [activeTopBannerNotif, setActiveTopBannerNotif] = useState(null);
  const [pushPermission, setPushPermission] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return window.Notification.permission;
    }
    return "default";
  });
  const [selectedSantriId, setSelectedSantriId] = useState(() => {
    try {
      const sess = JSON.parse(
        localStorage.getItem("desktop_session") ||
          localStorage.getItem("mobile_session") ||
          "{}",
      );
      return customSantriId || sess.santri_id || sess.id || null;
    } catch (e) {
      return customSantriId || null;
    }
  });

  const sessionData = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("desktop_session") ||
          localStorage.getItem("mobile_session") ||
          "{}",
      );
    } catch (e) {
      return {};
    }
  })();

  // Navigation Tab State
  const [currentTab, setCurrentTab] = useState("beranda");
  const [financeActiveTab, setFinanceActiveTab] = useState("tabungan");
  const [absensiStatusFilter, setAbsensiStatusFilter] = useState("Semua");
  const [absensiSubTab, setAbsensiSubTab] = useState("berjamaah");
  const [profileSection, setProfileSection] = useState("semua");

  // Helper rentang tanggal bulan berjalan (Awal bulan s/d Akhir bulan)
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      dari: `${year}-${month}-01`,
      sampai: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
    };
  };

  const initialMonthRange = getCurrentMonthRange();
  const [absensiTglDari, setAbsensiTglDari] = useState(initialMonthRange.dari);
  const [absensiTglSampai, setAbsensiTglSampai] = useState(
    initialMonthRange.sampai,
  );

  // Tahfidz Filter State
  const [tahfidzFilter, setTahfidzFilter] = useState("Semua");
  const [tahfidzSearch, setTahfidzSearch] = useState("");

  // Password Update Form State
  const [passwordForm, setPasswordForm] = useState({
    username_baru: "",
    password_baru: "",
    konfirmasi_password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [updatingPass, setUpdatingPass] = useState(false);

  // Form Pengajuan Izin Santri oleh Orang Tua / Wali
  const [isAjukanIzinOpen, setIsAjukanIzinOpen] = useState(false);
  const [submittingIzin, setSubmittingIzin] = useState(false);
  const [formIzin, setFormIzin] = useState({
    jenis_izin: "Izin Pulang",
    tgl_keluar_rencana: "",
    tgl_kembali_rencana: "",
    keperluan: "",
    nama_penjemput_mahrom: "",
    no_hp_penjemput: "",
    hubungan_mahrom: "Orang Tua (Wali)",
  });

  // Top Up Saldo Tabungan State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [submittingTopUp, setSubmittingTopUp] = useState(false);
  const [topUpNominal, setTopUpNominal] = useState("50.000");
  const [topUpKeterangan, setTopUpKeterangan] = useState("");

  // Pastikan browser selalu mulai dari posisi paling atas saat reload / mount
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.body) document.body.scrollTop = 0;
      if (document.documentElement) document.documentElement.scrollTop = 0;
    };
    scrollToTop();
    const t1 = setTimeout(scrollToTop, 50);
    const t2 = setTimeout(scrollToTop, 150);
    const t3 = setTimeout(scrollToTop, 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Scroll ke atas & segarkan data di latar belakang saat ganti tab
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (selectedSantriId && ["beranda", "absensi", "perizinan", "praktek", "pelanggaran"].includes(currentTab)) {
      fetchWaliData(selectedSantriId, true);
    }
  }, [currentTab]);

  // Ambil data monitoring wali santri
  const fetchWaliData = async (targetId = selectedSantriId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      let sessionNisn = "";
      let sessionNama = "";
      try {
        const sess = JSON.parse(
          localStorage.getItem("desktop_session") ||
            localStorage.getItem("mobile_session") ||
            "{}",
        );
        sessionNisn = sess.nisn || sess.username || "";
        sessionNama = cleanSantriName(sess.nama_santri || sess.nama || "");
      } catch (e) {}

      let url = "/api/wali/santri";
      const params = new URLSearchParams();
      if (sessionNisn) params.append("nisn", sessionNisn);
      if (sessionNama) params.append("nama", sessionNama);
      if (targetId) params.append("santri_id", targetId);
      if (absensiTglDari) params.append("tgl_dari", absensiTglDari);
      if (absensiTglSampai) params.append("tgl_sampai", absensiTglSampai);
      const qStr = params.toString();
      if (qStr) url += `?${qStr}`;

      const res = await axios.get(url);
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
        if (res.data.data.santri?.id) {
          setSelectedSantriId(res.data.data.santri.id);
          setPasswordForm((prev) => ({
            ...prev,
            username_baru:
              res.data.data.santri.username || res.data.data.santri.nis || "",
          }));
        }
      }
    } catch (err) {
      if (!silent) console.warn("Gagal memuat data portal wali:", err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString("id-ID");

  const fetchKeuanganOverview = async (targetId = selectedSantriId) => {
    try {
      const url = targetId
        ? `/api/keuangan/wali/dashboard?santri_id=${targetId}`
        : "/api/keuangan/wali/dashboard";
      const res = await axios.get(url);
      if (res.data?.success) {
        setKeuanganSummary(res.data.data.summary);
        const pending = res.data.data.transaksiPending || null;
        setTransaksiPending(pending);
        if (pending) {
          setIsPendingModalOpen(true);
        }

        // Deteksi tagihan lewat jatuh tempo (belum lunas & tanggal jatuh tempo < hari ini)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const semuaTagihan = [
          ...(res.data.data.tagihanBulanan || []),
          ...(res.data.data.biayaAwalMasuk || []),
          ...(res.data.data.tagihanLainnya || [])
        ];
        const overdue = semuaTagihan
          .filter(t => {
            if (parseFloat(t.sisa_tagihan || 0) <= 0 || t.status === 'Lunas' || !t.jatuh_tempo) return false;
            const jt = new Date(t.jatuh_tempo);
            if (isNaN(jt.getTime())) return false;
            jt.setHours(0, 0, 0, 0);
            return jt < today;
          })
          .sort((a, b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo));
        setTagihanJatuhTempo(overdue);

        // Tampilkan modal maksimal 1x per hari per santri (agar tidak mengganggu)
        if (overdue.length > 0) {
          const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
          const storageKey = `jatuh_tempo_notif_${targetId || 'default'}`;
          if (localStorage.getItem(storageKey) !== todayKey) {
            setIsJatuhTempoModalOpen(true);
          }
        }
      }
    } catch (e) {}
  };

  const handleLanjutkanBayar = async (pendingTrx) => {
    if (!pendingTrx) return;
    try {
      setProcessingPending(true);
      let snapToken = pendingTrx.snap_token;
      let paymentUrl = pendingTrx.payment_url;

      if (!snapToken) {
        const res = await axios.post("/api/keuangan/wali/lanjutkan", {
          nomor_transaksi: pendingTrx.nomor_transaksi,
          transaksi_id: pendingTrx.id,
        });
        if (res.data?.success && res.data?.data?.snap_token) {
          snapToken = res.data.data.snap_token;
          paymentUrl = res.data.data.payment_url;
        } else {
          showError(
            "Gagal Memuat Transaksi",
            res.data?.message || "Token pembayaran tidak tersedia.",
          );
          return;
        }
      }

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: function () {
            toastSuccess(
              "Pembayaran Berhasil!",
              "Pembayaran via Midtrans berhasil diverifikasi.",
            );
            fetchKeuanganOverview();
          },
          onPending: function () {
            toastSuccess(
              "Menunggu Pembayaran",
              "Selesaikan pembayaran sebelum batas waktu berakhir.",
            );
            fetchKeuanganOverview();
          },
          onError: function (result) {
            showError(
              "Pembayaran Gagal",
              result?.status_message || "Transaksi gagal.",
            );
          },
          onClose: function () {
            fetchKeuanganOverview();
          },
        });
      } else if (paymentUrl) {
        window.open(paymentUrl, "_blank");
      } else {
        showError("Gagal", "Sistem pop-up Midtrans belum siap.");
      }
    } catch (err) {
      showError(
        "Gagal Melanjutkan Pembayaran",
        err.response?.data?.message || err.message,
      );
    } finally {
      setProcessingPending(false);
    }
  };

  const handleBatalkanTransaksi = async (pendingTrx) => {
    if (!pendingTrx) return;
    if (
      !window.confirm(
        "Batalkan transaksi pending ini untuk mengganti metode pembayaran?",
      )
    )
      return;
    try {
      setProcessingPending(true);
      const res = await axios.post("/api/keuangan/wali/batal", {
        nomor_transaksi: pendingTrx.nomor_transaksi,
        transaksi_id: pendingTrx.id,
      });
      if (res.data?.success) {
        toastSuccess(
          "Transaksi Dibatalkan",
          "Silakan pilih tagihan dan bayar kembali.",
        );
        setTransaksiPending(null);
        setIsPendingModalOpen(false);
        fetchKeuanganOverview();
      }
    } catch (err) {
      showError(
        "Gagal Membatalkan",
        err.response?.data?.message || err.message,
      );
    } finally {
      setProcessingPending(false);
    }
  };

  const fetchLatestFeed = async () => {
    try {
      const res = await axios.get("/api/informasi-kegiatan/feed?active_only=1&limit=15");
      if (res.data?.success) {
        const rawFeed = res.data.data.feed || [];
        const todayStr = new Date().toISOString().slice(0, 10);

        // Filter pengumuman yang belum kadaluarsa (otomatis hilang sendiri jika lewat tgl_kadaluarsa)
        const validPengumuman = rawFeed.filter((item) => {
          if (!item.tgl_kadaluarsa) return true;
          const expStr = String(item.tgl_kadaluarsa).slice(0, 10);
          return expStr >= todayStr;
        });

        setLatestFeed(validPengumuman.slice(0, 6));
        setPengumumanAktifList(validPengumuman);

        if (validPengumuman.length > 0) {
          // Cek apakah halaman dibuka karena reload (refresh) atau awal buka aplikasi
          let isPageReload = false;
          try {
            const navEntries = window.performance?.getEntriesByType?.("navigation");
            if (navEntries && navEntries.length > 0 && navEntries[0].type === "reload") {
              isPageReload = true;
            } else if (window.performance?.navigation?.type === 1) {
              isPageReload = true;
            }
          } catch (e) {}

          const alreadyShownInSession = sessionStorage.getItem("nwf_wali_pengumuman_shown_session") === "true";
          const maxId = Math.max(...validPengumuman.map((p) => Number(p.id) || 0));
          const lastSeenMaxId = Number(localStorage.getItem("nwf_wali_last_pengumuman_id") || 0);

          // Munculkan modal hanya saat awal buka aplikasi (bukan saat reload), atau jika ada pengumuman baru dari Admin
          if ((!isPageReload && !alreadyShownInSession) || maxId > lastSeenMaxId) {
            sessionStorage.setItem("nwf_wali_pengumuman_shown_session", "true");
            if (maxId > 0) {
              localStorage.setItem("nwf_wali_last_pengumuman_id", String(maxId));
            }
            setIsPengumumanModalOpen(true);
          } else {
            sessionStorage.setItem("nwf_wali_pengumuman_shown_session", "true");
          }
        }
      }
    } catch (e) {}
  };

  const fetchSantriTabungan = async (targetId = selectedSantriId) => {
    if (!targetId) return;
    try {
      setLoadingTabungan(true);
      const res = await axios.get(`/api/tabungan/santri/${targetId}`);
      if (res.data?.success && res.data.data) {
        setTabunganData(res.data.data);
      }
    } catch (e) {
      console.warn("Tabungan santri notice:", e.message);
    } finally {
      setLoadingTabungan(false);
    }
  };

  // Helper memicu Native System Notification di Bar Atas HP (Ala Shopee)
  const triggerNativePhoneNotification = async (title, body, targetTab = "notifikasi", notifId = null) => {
    try {
      if (!("Notification" in window)) return;
      if (window.Notification.permission !== "granted") return;

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.active) {
          reg.active.postMessage({
            type: "SHOW_WALI_NOTIFICATION",
            payload: {
              title,
              body,
              targetTab,
              notifId,
              tag: `nwf-wali-${notifId || Date.now()}`,
            },
          });
          return;
        }
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: "/nwf.png",
            badge: "/nwf.png",
            vibrate: [200, 100, 200],
            data: { targetTab, notifId },
          });
          return;
        }
      }

      new window.Notification(title, {
        body,
        icon: "/nwf.png",
      });
    } catch (e) {
      console.warn("Push notification notice:", e.message);
    }
  };

  const handleRequestPushPermission = async () => {
    try {
      if (!("Notification" in window)) {
        showError("Tidak Didukung", "Browser HP Anda belum mendukung notifikasi sistem.");
        return;
      }
      const perm = await window.Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") {
        toastSuccess("Notifikasi Aktif!", "Notifikasi aktivitas santri kini aktif di layar HP Anda.");
      }
    } catch (e) {}
  };

  // Bunyi ting lembut (Web Audio API) & getar saat notifikasi masuk
  const playNotificationDing = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([180, 80, 180]);
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  };

  // Munculkan Floating Pop-Up Banner di Atas Layar (Heads-Up Ala Shopee) + Native OS Notification
  const showShopeeHeadsUpNotification = (notif) => {
    if (!notif) return;
    setActiveTopBannerNotif(notif);
    playNotificationDing();

    // Kirim juga ke OS Android/iOS Notification Bar jika diizinkan
    triggerNativePhoneNotification(
      notif.judul || "NWF Mobile • Info Santri",
      notif.pesan || "",
      notif.target_tab || "notifikasi",
      notif.id
    );
  };

  // Auto-hide banner atas layar setelah 6.5 detik
  useEffect(() => {
    if (!activeTopBannerNotif) return;
    const timer = setTimeout(() => {
      setActiveTopBannerNotif(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeTopBannerNotif]);

  const fetchNotifikasiWali = async (targetId = selectedSantriId, isBackgroundPoll = false) => {
    if (!targetId) return;
    try {
      const storageKey = `nwf_last_notif_id_${targetId}`;
      const lastSeenId = parseInt(localStorage.getItem(storageKey) || "0") || 0;

      const res = await axios.get(
        `/api/wali/notifikasi?santri_id=${targetId}&since_id=${lastSeenId}&limit=40`
      );
      if (res.data?.success && res.data.data) {
        const {
          notifications = [],
          new_notifications = [],
          unread_count = 0,
          latest_id = 0,
        } = res.data.data;

        setNotifikasiList(notifications);
        setUnreadNotifCount(unread_count);

        // Jika ada notifikasi baru yang belum pernah muncul di layar atas HP
        if (new_notifications.length > 0) {
          const newest = new_notifications[0];
          showShopeeHeadsUpNotification(newest);
          // Segarkan otomatis data presensi/perizinan/tahfidz saat notifikasi baru masuk
          fetchWaliData(targetId, true);
        } else if (lastSeenId === 0 && notifications.length > 0) {
          // Pertama kali buka & ada notifikasi yang belum dibaca -> munculkan 1x di atas layar
          const firstUnread = notifications.find((n) => Number(n.is_read) === 0);
          if (firstUnread) {
            showShopeeHeadsUpNotification(firstUnread);
          }
        }

        if (latest_id > lastSeenId) {
          localStorage.setItem(storageKey, String(latest_id));
        }
      }
    } catch (e) {
      if (!isBackgroundPoll) {
        console.warn("Notifikasi wali notice:", e.message);
      }
    }
  };

  const handleMarkAllNotifRead = async () => {
    if (!selectedSantriId) return;
    try {
      await axios.put("/api/wali/notifikasi/read", { santri_id: selectedSantriId });
      setNotifikasiList((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } catch (e) {}
  };

  const handleClearAllNotif = async () => {
    if (!selectedSantriId) return;
    try {
      await axios.delete(`/api/wali/notifikasi/clear?santri_id=${selectedSantriId}`);
      setNotifikasiList([]);
      setUnreadNotifCount(0);
      toastSuccess("Dibersihkan", "Riwayat notifikasi berhasil dihapus.");
    } catch (e) {}
  };

  const handleClickNotificationItem = async (notif) => {
    if (!notif) return;
    try {
      if (Number(notif.is_read) === 0) {
        await axios.put("/api/wali/notifikasi/read", { notif_id: notif.id });
        setNotifikasiList((prev) =>
          prev.map((item) => (item.id === notif.id ? { ...item, is_read: 1 } : item))
        );
        setUnreadNotifCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {}

    if (notif.target_tab === "pengumuman" || notif.kategori === "pengumuman") {
      await fetchLatestFeed();
      setIsPengumumanModalOpen(true);
      return;
    }

    if (
      notif.target_tab &&
      notif.target_tab !== "notifikasi" &&
      notif.target_tab !== "hafalan" &&
      notif.target_tab !== "tahfidz"
    ) {
      setCurrentTab(notif.target_tab);
    }
  };

  useEffect(() => {
    fetchWaliData();
    fetchKeuanganOverview();
    fetchLatestFeed();
    fetchSantriTabungan();
    fetchNotifikasiWali(selectedSantriId, false);
  }, [selectedSantriId]);

  // Smart Delta Polling Ringan (setiap 20 detik saat tab aktif) + Listener Klik Notifikasi Service Worker
  useEffect(() => {
    if (!selectedSantriId) return;

    // Minta izin notifikasi secara halus setelah 4 detik jika masih default
    let permTimer = null;
    if ("Notification" in window && window.Notification.permission === "default") {
      permTimer = setTimeout(() => {
        window.Notification.requestPermission().then((p) => setPushPermission(p)).catch(() => {});
      }, 4000);
    }

    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifikasiWali(selectedSantriId, true);
      }
    }, 8000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchNotifikasiWali(selectedSantriId, true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onSwMessage = (event) => {
      if (event.data && event.data.type === "NAVIGATE_FROM_NOTIFICATION") {
        const target = event.data.targetTab || "notifikasi";
        setCurrentTab(target);
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onSwMessage);
    }

    return () => {
      if (permTimer) clearTimeout(permTimer);
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onSwMessage);
      }
    };
  }, [selectedSantriId]);

  useEffect(() => {
    if (selectedSantriId) {
      fetchWaliData(selectedSantriId);
    }
  }, [absensiTglDari, absensiTglSampai]);

  const handleSantriChange = (newId) => {
    setSelectedSantriId(newId);
    fetchWaliData(newId);
    fetchKeuanganOverview(newId);
    fetchSantriTabungan(newId);
    fetchNotifikasiWali(newId, false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.password_baru) {
      showError("Validasi Gagal", "Password baru wajib diisi.");
      return;
    }
    if (passwordForm.password_baru.length < 4) {
      showError("Validasi Gagal", "Password minimal 4 karakter.");
      return;
    }
    if (passwordForm.password_baru !== passwordForm.konfirmasi_password) {
      showError("Validasi Gagal", "Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setUpdatingPass(true);
      const res = await axios.put("/api/wali/password", {
        santri_id: selectedSantriId,
        password_baru: passwordForm.password_baru,
        username_baru: passwordForm.username_baru,
      });
      if (res.data?.success) {
        toastSuccess(
          "Berhasil!",
          "Kredensial login akun orang tua santri berhasil disimpan.",
        );
        setPasswordForm({
          username_baru: passwordForm.username_baru,
          password_baru: "",
          konfirmasi_password: "",
        });
      } else {
        showError("Gagal", res.data?.message || "Gagal mengubah password");
      }
    } catch (err) {
      showError("Gagal", err.response?.data?.message || err.message);
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleLogoutAction = () => {
    showConfirm(
      "Keluar Akun?",
      "Apakah Bapak/Ibu ingin keluar dari Portal Orang Tua Santri?",
      () => {
        localStorage.removeItem("desktop_session");
        localStorage.removeItem("mobile_session");
        sessionStorage.removeItem("desktop_session");
        if (onLogout) {
          onLogout();
        } else {
          window.location.hash = "#login";
          window.location.reload();
        }
      },
    );
  };

  const openModalAjukanIzin = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const returnDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const returnStr = `${returnDate.getFullYear()}-${pad(returnDate.getMonth() + 1)}-${pad(returnDate.getDate())}T17:00`;

    setFormIzin({
      jenis_izin: "Izin Pulang",
      tgl_keluar_rencana: nowStr,
      tgl_kembali_rencana: returnStr,
      keperluan: "",
      nama_penjemput_mahrom: santri?.nama_wali || "",
      no_hp_penjemput: santri?.no_wa_wali || "",
      hubungan_mahrom: santri?.hubungan_wali || "Orang Tua",
    });
    setIsAjukanIzinOpen(true);
  };

  const handleSubmitIzin = async (e) => {
    e.preventDefault();
    if (!formIzin.keperluan.trim()) {
      showError(
        "Alasan Izin Wajib Diisi",
        "Silakan cantumkan keperluan / alasan santri mengajukan izin.",
      );
      return;
    }
    if (!formIzin.tgl_keluar_rencana || !formIzin.tgl_kembali_rencana) {
      showError(
        "Jadwal Tidak Lengkap",
        "Pilih perkiraan tanggal keluar dan tanggal kembali santri.",
      );
      return;
    }
    try {
      setSubmittingIzin(true);
      const res = await axios.post("/api/perizinan", {
        ...formIzin,
        santri_id: selectedSantriId || santri?.id,
        status: "Menunggu Persetujuan",
      });
      if (res.data?.success) {
        showSuccess(
          "Pengajuan Terkirim!",
          "Permohonan izin santri berhasil dikirim. Menunggu verifikasi dari pengasuh.",
        );
        setIsAjukanIzinOpen(false);
        fetchWaliData(selectedSantriId || santri?.id);
      } else {
        showError(
          "Gagal",
          res.data?.message ||
            "Terjadi kesalahan saat menyimpan pengajuan izin.",
        );
      }
    } catch (err) {
      showError(
        "Gagal Mengajukan Izin",
        err.response?.data?.message || err.message,
      );
    } finally {
      setSubmittingIzin(false);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const rawNom = String(topUpNominal).replace(/[^0-9]/g, "");
    const nom = parseFloat(rawNom);
    if (!nom || isNaN(nom) || nom <= 0) {
      showError(
        "Nominal Tidak Valid",
        "Silakan masukkan nominal pengisian saldo yang benar.",
      );
      return;
    }
    if (nom < 5000) {
      showError(
        "Minimal Pengisian",
        "Nominal pengisian saldo tabungan minimal Rp 5.000.",
      );
      return;
    }

    const targetId = selectedSantriId || santri?.id;
    try {
      setSubmittingTopUp(true);

      const res = await axios.post("/api/tabungan/topup-midtrans", {
        santri_id: targetId,
        nominal: nom,
        keterangan:
          (topUpKeterangan || "").trim() ||
          "Top Up Saldo Tabungan via Midtrans",
      });

      if (res.data?.success && res.data?.data?.snap_token) {
        const { snap_token, payment_url } = res.data.data;

        if (window.snap) {
          window.snap.pay(snap_token, {
            onSuccess: async function () {
              toastSuccess(
                "Pembayaran Berhasil!",
                `Saldo tabungan ananda berhasil diisi sebesar Rp ${nom.toLocaleString("id-ID")}.`,
              );
              setIsTopUpModalOpen(false);
              setTopUpNominal("");
              setTopUpKeterangan("");
              fetchSantriTabungan(targetId);
              fetchKeuanganOverview(targetId);
            },
            onPending: function () {
              toastSuccess(
                "Menunggu Pembayaran",
                "Selesaikan pembayaran via Midtrans sesuai instruksi.",
              );
              setIsTopUpModalOpen(false);
            },
            onError: function (result) {
              showError(
                "Pembayaran Gagal",
                result?.status_message ||
                  "Transaksi pembayaran dibatalkan atau gagal.",
              );
            },
            onClose: function () {
              fetchSantriTabungan(targetId);
            },
          });
        } else if (payment_url) {
          window.open(payment_url, "_blank");
        } else {
          showError(
            "Gagal",
            "Sistem pembayaran Midtrans Snap tidak dapat dimuat.",
          );
        }
      } else {
        const fallbackRes = await axios.post("/api/tabungan/setor", {
          santri_id: targetId,
          nominal: nom,
          keterangan:
            (topUpKeterangan || "").trim() || "Pengisian Saldo via Wali Santri",
          admin_nama: `Wali (${rawSantriName})`,
        });
        if (fallbackRes.data?.success) {
          toastSuccess(
            "Pengisian Berhasil!",
            `Saldo tabungan ananda berhasil diisi sebesar Rp ${nom.toLocaleString("id-ID")}.`,
          );
          setIsTopUpModalOpen(false);
          setTopUpNominal("");
          setTopUpKeterangan("");
          fetchSantriTabungan(targetId);
          fetchKeuanganOverview(targetId);
        } else {
          showError(
            "Gagal",
            fallbackRes.data?.message || "Gagal mengisi saldo tabungan.",
          );
        }
      }
    } catch (err) {
      showError(
        "Gagal Top Up Saldo",
        err.response?.data?.message || err.message,
      );
    } finally {
      setSubmittingTopUp(false);
    }
  };

  const santri = data?.santri || {};
  const tahfidz = data?.tahfidzSetoran || [];
  const praktek = data?.praktekIbadah || [];
  const presensi = data?.presensiJamaah || [];
  const perizinan = data?.perizinan || [];
  const pelanggaran = data?.pelanggaran || [];

  const cleanSantriName = (name) => {
    if (!name) return "";
    let c = String(name).trim();
    if (c.includes("(Wali ")) {
      const m = c.match(/\(Wali\s+([^)]+)\)/i);
      if (m && m[1]) return m[1].trim();
    }
    if (c.toLowerCase().startsWith("wali santri "))
      return c.substring(12).trim();
    if (c.toLowerCase().startsWith("wali ")) return c.substring(5).trim();
    if (c.toLowerCase().startsWith("orang tua santri"))
      return c
        .replace(/^orang tua santri/i, "")
        .replace(/^[^\w]+/, "")
        .trim();
    return c;
  };

  const getStoredSantriName = () => {
    try {
      const sess = JSON.parse(
        localStorage.getItem("desktop_session") ||
          localStorage.getItem("mobile_session") ||
          "{}",
      );
      return cleanSantriName(
        sess.nama_santri || sess.nama || sess.username || "",
      );
    } catch (e) {
      return "";
    }
  };

  const rawSantriName =
    cleanSantriName(santri.nama_santri || data?.santri?.nama_santri) ||
    getStoredSantriName() ||
    "Santri";
  const displayNisn =
    santri.nisn && santri.nisn !== "-"
      ? santri.nisn
      : santri.nis || sessionData.nisn || sessionData.nis || "-";
  const initial =
    rawSantriName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "SN";

  // Dewan Asatidz Pembina (Real data santri dari database)
  const asatidzList = [];
  if (santri.pembina_asrama && String(santri.pembina_asrama).trim() && santri.pembina_asrama !== "-") {
    asatidzList.push({
      nama: santri.pembina_asrama,
      peran: "Pembina Kobong & Asrama",
      hp: santri.no_hp_pembina && santri.no_hp_pembina !== "-" ? santri.no_hp_pembina : "",
    });
  }

  return (
    <div
      id="wali"
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        justifyContent: "center",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Mobile Frame Container: 100% on phone, max 430px on desktop */}
      <div
        id="top-portal-wali"
        style={{
          width: "100%",
          maxWidth: "430px",
          minHeight: "100vh",
          background: "#f8fafc",
          position: "relative",
          boxShadow: "0 0 40px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "80px",
          boxSizing: "border-box",
        }}
      >
        {/* FLOATING HEADS-UP NOTIFICATION BANNER DI ATAS LAYAR (ALA SHOPEE) */}
        {activeTopBannerNotif && (
          <div
            style={{
              position: "fixed",
              top: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "calc(100% - 24px)",
              maxWidth: "406px",
              zIndex: 999999,
              background: "rgba(15, 23, 42, 0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "18px",
              padding: "12px 14px",
              boxShadow:
                "0 18px 38px -6px rgba(0, 0, 0, 0.45), 0 0 0 1.5px rgba(16, 185, 129, 0.45)",
              color: "#ffffff",
              display: "flex",
              alignItems: "flex-start",
              gap: "11px",
              cursor: "pointer",
              animation: "slideDownShopeeNotif 0.32s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onClick={() => {
              const target = activeTopBannerNotif;
              setActiveTopBannerNotif(null);
              handleClickNotificationItem(target);
            }}
          >
            <style>{`
              @keyframes slideDownShopeeNotif {
                0% { opacity: 0; transform: translate(-50%, -28px) scale(0.95); }
                100% { opacity: 1; transform: translate(-50%, 0) scale(1); }
              }
            `}</style>

            {/* Logo NWF App Squircle */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "5px",
                flexShrink: 0,
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              }}
            >
              <img
                src="/nwf.png"
                alt="NWF"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>

            {/* Teks Notifikasi */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                  marginBottom: "2px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 900,
                      color: "#34d399",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    NWF MOBILE
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "#64748b" }}>•</span>
                  <span style={{ fontSize: "0.62rem", color: "#94a3b8", fontWeight: 600 }}>
                    Baru saja
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.25,
                }}
              >
                {activeTopBannerNotif.judul}
              </div>

              <div
                style={{
                  fontSize: "0.73rem",
                  color: "#cbd5e1",
                  lineHeight: 1.35,
                  marginTop: "2px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {activeTopBannerNotif.pesan}
              </div>
            </div>

            {/* Tombol Tutup X */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTopBannerNotif(null);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "none",
                color: "#94a3b8",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* 1. BERANDA TAB */}
        {currentTab === "beranda" && (
          <TabBerandaWali
            santri={santri}
            santriList={santriList}
            selectedSantriId={selectedSantriId}
            setSelectedSantriId={handleSantriChange}
            rawSantriName={rawSantriName}
            displayNisn={displayNisn}
            presensiList={presensi}
            tabunganData={tabunganData}
            keuanganSummary={keuanganSummary}
            financeActiveTab={financeActiveTab}
            setFinanceActiveTab={setFinanceActiveTab}
            latestFeed={latestFeed}
            transaksiPending={transaksiPending}
            isPendingModalOpen={isPendingModalOpen}
            setIsPendingModalOpen={setIsPendingModalOpen}
            processingPending={processingPending}
            handleLanjutkanBayar={handleLanjutkanBayar}
            handleBatalkanTransaksi={handleBatalkanTransaksi}
            formatRp={formatRp}
            unreadNotifCount={unreadNotifCount}
            activePengumumanCount={pengumumanAktifList.length}
            onOpenPengumumanModal={() => setIsPengumumanModalOpen(true)}
            onNavigateTab={setCurrentTab}
            handleLogoutAction={handleLogoutAction}
          />
        )}

        {/* MODAL SLIDER PENGUMUMAN RESMI PESANTREN (BISA DIGESER & OTOMATIS HILANG JIKA KADALUARSA) */}
        <ModalPengumumanWali
          isOpen={isPengumumanModalOpen}
          onClose={() => setIsPengumumanModalOpen(false)}
          pengumumanList={pengumumanAktifList}
        />

        {/* 2. BUKU TABUNGAN SANTRI TAB */}
        {currentTab === "tabungan" && (
          <TabBukuTabunganWali
            tabunganData={tabunganData}
            loadingTabungan={loadingTabungan}
            fetchSantriTabungan={fetchSantriTabungan}
            selectedSantriId={selectedSantriId}
            formatRp={formatRp}
            onOpenTopUp={() => setIsTopUpModalOpen(true)}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 3. PROFILE SANTRI TAB */}
        {currentTab === "profile" && (
          <TabProfilWali
            santri={santri}
            rawSantriName={rawSantriName}
            displayNisn={displayNisn}
            initial={initial}
            profileSection={profileSection}
            setProfileSection={setProfileSection}
            asatidzList={asatidzList}
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            showPass={showPass}
            setShowPass={setShowPass}
            updatingPass={updatingPass}
            handleUpdatePassword={handleUpdatePassword}
            handleLogoutAction={handleLogoutAction}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 4. PERIZINAN SANTRI TAB */}
        {currentTab === "perizinan" && (
          <TabPerizinanWali
            perizinan={perizinan}
            santri={santri}
            rawSantriName={rawSantriName}
            displayNisn={displayNisn}
            onOpenAjukanIzin={openModalAjukanIzin}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 5. ABSENSI & PRESENSI SHOLAT TAB */}
        {currentTab === "absensi" && (
          <TabAbsensiWali
            presensi={presensi}
            absensiStatusFilter={absensiStatusFilter}
            setAbsensiStatusFilter={setAbsensiStatusFilter}
            absensiSubTab={absensiSubTab}
            setAbsensiSubTab={setAbsensiSubTab}
            absensiTglDari={absensiTglDari}
            setAbsensiTglDari={setAbsensiTglDari}
            absensiTglSampai={absensiTglSampai}
            setAbsensiTglSampai={setAbsensiTglSampai}
            getCurrentMonthRange={getCurrentMonthRange}
            fetchWaliData={fetchWaliData}
            selectedSantriId={selectedSantriId}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 7. PRAKTEK IBADAH TAB */}
        {currentTab === "praktek" && (
          <TabPraktekWali
            praktek={praktek}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 8. TATA TERTIB & KEDISIPLINAN TAB */}
        {currentTab === "pelanggaran" && (
          <TabTataTertibWali
            pelanggaran={pelanggaran}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 9. NOTIFIKASI PEMBERITAHUAN PESANTREN TAB */}
        {currentTab === "notifikasi" && (
          <TabNotifikasiWali
            rawSantriName={rawSantriName}
            displayNisn={displayNisn}
            notifikasiList={notifikasiList}
            unreadCount={unreadNotifCount}
            pushPermission={pushPermission}
            onRequestPushPermission={handleRequestPushPermission}
            onMarkAllRead={handleMarkAllNotifRead}
            onClearAll={handleClearAllNotif}
            onClickNotification={handleClickNotificationItem}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 10. TAB SISTEM PEMBAYARAN & ADMINISTRASI KEUANGAN DIGITAL (QRIS / VA) */}
        {currentTab === "tagihan" && (
          <TabTagihanKeuangan
            santriId={selectedSantriId}
            onBack={() => {
              setCurrentTab("beranda");
              fetchKeuanganOverview();
            }}
          />
        )}

        {/* 11. TAB LAPORAN PERKEMBANGAN SANTRI (RAPOR KOMPREHENSIF) */}
        {currentTab === "laporan" && (
          <TabLaporanPerkembangan
            santriId={selectedSantriId}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 12. TAB INFORMASI & KEGIATAN PESANTREN (LINIMASA / FEED) */}
        {currentTab === "informasi" && (
          <TabInformasiKegiatan onBack={() => setCurrentTab("beranda")} />
        )}

        {/* 13. TAB INFAK & SEDEKAH (SUKARELA & TERPISAH DARI SPP) */}
        {currentTab === "infak" && (
          <TabInfakSedekahWali
            santriId={selectedSantriId}
            santriName={rawSantriName}
            waliName={santri?.nama_wali || "Orang Tua Santri"}
            formatRp={formatRp}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* 14. TAB PESAN & KOMUNIKASI (WALI SANTRI <-> ADMIN PESANTREN) */}
        {currentTab === "pesan" && (
          <TabPesanWali
            santriId={selectedSantriId}
            santriName={rawSantriName}
            waliName={santri?.nama_wali || "Orang Tua Santri"}
            onBack={() => setCurrentTab("beranda")}
          />
        )}

        {/* =========================================================================
            MODAL AJUKAN IZIN SANTRI (WALI SANTRI) - MODERN & INTERAKTIF
        ========================================================================= */}
        {isAjukanIzinOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(15, 23, 42, 0.72)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                width: "100%",
                maxWidth: "480px",
                borderTopLeftRadius: "28px",
                borderTopRightRadius: "28px",
                maxHeight: "94vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 -12px 36px rgba(0,0,0,0.22)",
                animation: "slideUp 0.25s ease-out",
              }}
            >
              {/* Drag Handle Bar */}
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "#cbd5e1",
                  borderRadius: "4px",
                  margin: "12px auto 2px",
                }}
              />

              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 20px 14px",
                  borderBottom: "1px solid #f1f5f9",
                  position: "sticky",
                  top: 0,
                  background: "#ffffff",
                  zIndex: 10,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "13px",
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                    }}
                  >
                    <DoorOpen size={20} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        letterSpacing: "-0.3px",
                      }}
                    >
                      Ajukan Izin Santri
                    </h3>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "0.72rem",
                        color: "#64748b",
                      }}
                    >
                      Santri:{" "}
                      <strong style={{ color: "#0284c7" }}>
                        {santri?.nama_santri || rawSantriName}
                      </strong>{" "}
                      (NISN: {displayNisn})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAjukanIzinOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              {/* Modal Form Body */}
              <form
                onSubmit={handleSubmitIzin}
                style={{
                  padding: "16px 20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* 1. PILIH JENIS IZIN */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      color: "#1e293b",
                      marginBottom: "6px",
                    }}
                  >
                    Jenis Izin <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {[
                      {
                        id: "Izin Pulang",
                        label: "Izin Pulang",
                        icon: "🏠",
                        desc: "Pulang ke rumah",
                      },
                      {
                        id: "Izin Keluar Komplek",
                        label: "Keluar Sebentar",
                        icon: "🚶",
                        desc: "Beli kitab/berobat",
                      },
                      {
                        id: "Izin Sakit",
                        label: "Sakit / Rawat",
                        icon: "🏥",
                        desc: "Klinik / RS",
                      },
                    ].map((item) => {
                      const isSel = formIzin.jenis_izin === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setFormIzin({ ...formIzin, jenis_izin: item.id })
                          }
                          style={{
                            padding: "10px 8px",
                            borderRadius: "14px",
                            border: isSel
                              ? "2px solid #059669"
                              : "1.5px solid #e2e8f0",
                            background: isSel ? "#ecfdf5" : "#ffffff",
                            cursor: "pointer",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: isSel
                              ? "0 4px 12px rgba(5, 150, 105, 0.15)"
                              : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ fontSize: "1.25rem" }}>
                            {item.icon}
                          </span>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 800,
                              color: isSel ? "#047857" : "#1e293b",
                            }}
                          >
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              color: isSel ? "#059669" : "#64748b",
                            }}
                          >
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. JADWAL KELUAR & KEMBALI */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 800,
                      color: "#1e293b",
                    }}
                  >
                    Jadwal Rencana Perizinan
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#059669",
                          marginBottom: "4px",
                        }}
                      >
                        Waktu Keluar
                      </span>
                      <input
                        type="datetime-local"
                        required
                        value={formIzin.tgl_keluar_rencana}
                        onChange={(e) =>
                          setFormIzin({
                            ...formIzin,
                            tgl_keluar_rencana: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.76rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#dc2626",
                          marginBottom: "4px",
                        }}
                      >
                        Waktu Kembali
                      </span>
                      <input
                        type="datetime-local"
                        required
                        value={formIzin.tgl_kembali_rencana}
                        onChange={(e) =>
                          setFormIzin({
                            ...formIzin,
                            tgl_kembali_rencana: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.76rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  {/* Kalkulasi Durasi Izin */}
                  {(() => {
                    if (
                      !formIzin.tgl_keluar_rencana ||
                      !formIzin.tgl_kembali_rencana
                    )
                      return null;
                    const diff =
                      new Date(formIzin.tgl_kembali_rencana) -
                      new Date(formIzin.tgl_keluar_rencana);
                    if (diff <= 0) {
                      return (
                        <div
                          style={{
                            color: "#dc2626",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}
                        >
                          ⚠️ Waktu kembali harus setelah waktu keluar santri.
                        </div>
                      );
                    }
                    const totalHours = Math.round(diff / (1000 * 60 * 60));
                    const days = Math.floor(totalHours / 24);
                    const hours = totalHours % 24;
                    const durStr =
                      days > 0
                        ? `${days} Hari ${hours > 0 ? `${hours} Jam` : ""}`
                        : `${totalHours} Jam`;

                    return (
                      <div
                        style={{
                          marginTop: "10px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "#ecfdf5",
                          border: "1px solid #a7f3d0",
                          color: "#065f46",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Clock size={13} color="#059669" />
                        <span>
                          Estimasi Durasi Izin: <strong>{durStr}</strong> (
                          {totalHours} Jam)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. ALASAN / KEPERLUAN DENGAN TEMPLATE CEPAT */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      Alasan / Keperluan Izin{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <span style={{ fontSize: "0.66rem", color: "#64748b" }}>
                      Klik template untuk isi cepat:
                    </span>
                  </div>

                  {/* Template Keperluan Chips */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "5px",
                      marginBottom: "8px",
                    }}
                  >
                    {[
                      "Pernikahan Saudara",
                      "Silaturahmi Keluarga",
                      "Periksa Dokter / Berobat",
                      "Keperluan Mendesak",
                      "Libur Terjadwal Pondok",
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setFormIzin({ ...formIzin, keperluan: tpl })
                        }
                        style={{
                          padding: "4px 9px",
                          borderRadius: "8px",
                          border:
                            formIzin.keperluan === tpl
                              ? "1px solid #059669"
                              : "1px solid #e2e8f0",
                          background:
                            formIzin.keperluan === tpl ? "#ecfdf5" : "#f8fafc",
                          color:
                            formIzin.keperluan === tpl ? "#047857" : "#475569",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        + {tpl}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan keterangan detail keperluan izin santri..."
                    value={formIzin.keperluan}
                    onChange={(e) =>
                      setFormIzin({ ...formIzin, keperluan: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.82rem",
                      color: "#0f172a",
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* 4. PENJEMPUT & MAHROM (IDENTITAS PENDAMPING) */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.76rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      Identitas Penjemput (Mahrom)
                    </label>
                    {santri?.nama_wali && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormIzin({
                            ...formIzin,
                            nama_penjemput_mahrom: santri.nama_wali,
                            hubungan_mahrom:
                              santri.hubungan_wali || "Orang Tua",
                            no_hp_penjemput:
                              santri.no_wa_wali || formIzin.no_hp_penjemput,
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0284c7",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Gunakan Data Wali ↗
                      </button>
                    )}
                  </div>

                  {/* Quick Hubungan Mahrom Chips */}
                  <div>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#64748b",
                        marginBottom: "5px",
                      }}
                    >
                      Pilih Hubungan Mahrom:
                    </span>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}
                    >
                      {[
                        "Orang Tua",
                        "Ayah Kandung",
                        "Ibu Kandung",
                        "Kakak Kandung",
                        "Paman / Bibi",
                        "Kakek / Nenek",
                      ].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() =>
                            setFormIzin({ ...formIzin, hubungan_mahrom: m })
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: "8px",
                            border:
                              formIzin.hubungan_mahrom === m
                                ? "1.5px solid #0284c7"
                                : "1px solid #cbd5e1",
                            background:
                              formIzin.hubungan_mahrom === m
                                ? "#e0f2fe"
                                : "#ffffff",
                            color:
                              formIzin.hubungan_mahrom === m
                                ? "#0369a1"
                                : "#475569",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#475569",
                          marginBottom: "4px",
                        }}
                      >
                        Nama Penjemput
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Bpk. Ridwan"
                        value={formIzin.nama_penjemput_mahrom}
                        onChange={(e) =>
                          setFormIzin({
                            ...formIzin,
                            nama_penjemput_mahrom: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.78rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#475569",
                          marginBottom: "4px",
                        }}
                      >
                        No. WhatsApp
                      </span>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        value={formIzin.no_hp_penjemput}
                        onChange={(e) =>
                          setFormIzin({
                            ...formIzin,
                            no_hp_penjemput: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid #cbd5e1",
                          fontSize: "0.78rem",
                          color: "#0f172a",
                          background: "#ffffff",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Guidance Info Alert */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    fontSize: "0.72rem",
                    color: "#166534",
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>🛡️</span>
                  <div>
                    Permohonan izin akan diverifikasi otomatis oleh Dewan
                    Pengasuh. Santri wajib melapor ke Pos Keamanan saat keluar
                    gerbang pesantren & kembali tepat waktu.
                  </div>
                </div>

                {/* Submit Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setIsAjukanIzinOpen(false)}
                    disabled={submittingIzin}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "14px",
                      border: "1.5px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIzin}
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "14px",
                      border: "none",
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#ffffff",
                      fontSize: "0.86rem",
                      fontWeight: 900,
                      cursor: submittingIzin ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                      opacity: submittingIzin ? 0.75 : 1,
                    }}
                  >
                    {submittingIzin ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <Check size={18} strokeWidth={2.8} />
                        Kirim Permohonan Izin
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL TOP UP / ISI SALDO TABUNGAN SANTRI
        ========================================================================= */}
        {isTopUpModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              backgroundColor: "rgba(15, 23, 42, 0.68)",
              backdropFilter: "blur(5px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                width: "100%",
                maxWidth: "480px",
                borderTopLeftRadius: "26px",
                borderTopRightRadius: "26px",
                maxHeight: "92vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 -10px 30px rgba(0,0,0,0.2)",
                animation: "slideUp 0.25s ease-out",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  position: "sticky",
                  top: 0,
                  background: "#ffffff",
                  zIndex: 10,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "12px",
                      background: "#ecfdf5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Wallet size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "0.98rem",
                        fontWeight: 800,
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      Isi Saldo Tabungan
                    </h3>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "#64748b",
                        margin: "2px 0 0",
                      }}
                    >
                      Santri: {rawSantriName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={handleTopUpSubmit}
                style={{
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Info Saldo Saat Ini */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #f0fdf4 0%, #e6fffa 100%)",
                    border: "1px solid #bbf7d0",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "#166534",
                        textTransform: "uppercase",
                      }}
                    >
                      Saldo Tabungan Saat Ini
                    </div>
                    <div
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 900,
                        color: "#0f766e",
                        marginTop: "2px",
                      }}
                    >
                      {formatRp(tabunganData?.saldo_saat_ini || 0)}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#15803d",
                      fontWeight: 700,
                      background: "#dcfce7",
                      padding: "4px 8px",
                      borderRadius: "8px",
                    }}
                  >
                    Terkelola Pondok
                  </span>
                </div>

                {/* Pilihan Nominal Cepat (Chips) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Pilih Nominal Cepat:
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {[20000, 50000, 100000, 200000, 500000, 1000000].map(
                      (nom) => {
                        const currentVal = Number(
                          String(topUpNominal).replace(/[^0-9]/g, "") || 0,
                        );
                        const isSelected = currentVal === nom;
                        return (
                          <button
                            key={nom}
                            type="button"
                            onClick={() => setTopUpNominal(String(nom))}
                            style={{
                              padding: "10px 6px",
                              borderRadius: "12px",
                              border: isSelected
                                ? "2px solid #059669"
                                : "1px solid #e2e8f0",
                              background: isSelected ? "#ecfdf5" : "#ffffff",
                              color: isSelected ? "#047857" : "#334155",
                              fontWeight: 800,
                              fontSize: "0.78rem",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Rp {nom.toLocaleString("id-ID")}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Input Nominal Manual dengan Pemisah Ribuan & Posisi di Kanan */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Nominal Pengisian (Rp){" "}
                    <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "12px",
                        fontWeight: 900,
                        color: "#059669",
                        fontSize: "1rem",
                        userSelect: "none",
                        background: "#ecfdf5",
                        padding: "3px 8px",
                        borderRadius: "8px",
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      Rp
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={(() => {
                        const clean = String(topUpNominal).replace(
                          /[^0-9]/g,
                          "",
                        );
                        return clean
                          ? Number(clean).toLocaleString("id-ID")
                          : "";
                      })()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setTopUpNominal(raw);
                      }}
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "12px 16px 12px 58px",
                        borderRadius: "12px",
                        border: "2px solid #059669",
                        fontSize: "1.25rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        textAlign: "right",
                        outline: "none",
                        boxSizing: "border-box",
                        letterSpacing: "0.5px",
                        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.1)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginTop: "5px",
                    }}
                  >
                    <span>
                      Minimal isi saldo: <strong>Rp 5.000</strong>
                    </span>
                    <span style={{ color: "#059669", fontWeight: 800 }}>
                      Pemisah ribuan aktif
                    </span>
                  </div>
                </div>

                {/* Catatan / Keterangan (Opsional) */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#334155",
                      marginBottom: "6px",
                    }}
                  >
                    Catatan / Keperluan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={topUpKeterangan}
                    onChange={(e) => setTopUpKeterangan(e.target.value)}
                    placeholder="Tuliskan catatan jika ada (opsional)"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      color: "#0f172a",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Info Note Midtrans Gateway */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    fontSize: "0.72rem",
                    color: "#166534",
                    lineHeight: 1.4,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>💳</span>
                  <div>
                    Pembayaran diproses via{" "}
                    <strong>Midtrans Payment Gateway</strong> resmi. Mendukung{" "}
                    <strong>QRIS (GoPay, OVO, ShopeePay, Dana)</strong> &{" "}
                    <strong>Virtual Account (BCA, BNI, BRI, Mandiri)</strong>{" "}
                    langsung masuk ke saldo santri.
                  </div>
                </div>

                {/* Submit buttons */}
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(false)}
                    disabled={submittingTopUp}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "14px",
                      border: "1.5px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTopUp}
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "14px",
                      border: "none",
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#ffffff",
                      fontSize: "0.86rem",
                      fontWeight: 900,
                      cursor: submittingTopUp ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 6px 18px rgba(5, 150, 105, 0.35)",
                      opacity: submittingTopUp ? 0.75 : 1,
                    }}
                  >
                    {submittingTopUp ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        Memproses Midtrans...
                      </>
                    ) : (
                      <>
                        <Check size={18} strokeWidth={2.8} />
                        Isi Saldo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL NOTIFIKASI TAGIHAN LEWAT JATUH TEMPO
        ========================================================================= */}
        <ModalTagihanJatuhTempo
          open={
            isJatuhTempoModalOpen &&
            currentTab !== "tagihan" &&
            !(isPendingModalOpen && transaksiPending)
          }
          tagihanList={tagihanJatuhTempo}
          santriNama={rawSantriName}
          formatRp={formatRp}
          onClose={() => {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            localStorage.setItem(`jatuh_tempo_notif_${selectedSantriId || "default"}`, todayKey);
            setIsJatuhTempoModalOpen(false);
          }}
          onBayar={() => {
            setIsJatuhTempoModalOpen(false);
            setCurrentTab("tagihan");
          }}
        />

        {/* =========================================================================
            ELEVATED FLOATING WHITE BOTTOM NAVIGATION BAR
        ========================================================================= */}
        <nav className="mobile-bottom-nav">
          {/* 1. Beranda */}
          <button
            className={`mobile-nav-item ${["beranda", "praktek", "pelanggaran", "notifikasi"].includes(currentTab) ? "active" : ""}`}
            onClick={() => {
              setCurrentTab("beranda");
              fetchKeuanganOverview();
            }}
          >
            <div
              className={`nav-icon-wrapper ${["beranda", "praktek", "pelanggaran", "notifikasi"].includes(currentTab) ? "active" : ""}`}
            >
              <Home size={20} />
            </div>
            <span>Beranda</span>
          </button>

          {/* 2. Tagihan & Bayar */}
          <button
            className={`mobile-nav-item ${currentTab === "tagihan" ? "active" : ""}`}
            onClick={() => setCurrentTab("tagihan")}
          >
            <div
              className={`nav-icon-wrapper ${currentTab === "tagihan" ? "active" : ""}`}
            >
              <CreditCard size={20} />
              {(keuanganSummary?.totalBelumBayar || 0) > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    right: "1px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    border: "1.5px solid #fff",
                  }}
                />
              )}
            </div>
            <span>Tagihan</span>
          </button>

          {/* 3. Center Floating Fingerprint FAB (Presensi Sholat) */}
          <button
            className="mobile-fab-center"
            onClick={() => setCurrentTab("absensi")}
            title="Presensi Sholat & Ibadah Santri"
          >
            <div className="fab-inner-glow">
              <Fingerprint size={28} color="#ffffff" strokeWidth={2.4} />
            </div>
          </button>

          {/* 4. Tabungan Santri (Uang Saku) */}
          <button
            className={`mobile-nav-item ${currentTab === "tabungan" ? "active" : ""}`}
            onClick={() => setCurrentTab("tabungan")}
          >
            <div
              className={`nav-icon-wrapper ${currentTab === "tabungan" ? "active" : ""}`}
            >
              <Wallet size={20} />
            </div>
            <span>Tabungan</span>
          </button>

          {/* 5. Profil & Pengaturan */}
          <button
            className={`mobile-nav-item ${currentTab === "profile" ? "active" : ""}`}
            onClick={() => setCurrentTab("profile")}
          >
            <div
              className={`nav-icon-wrapper ${currentTab === "profile" ? "active" : ""}`}
            >
              <User size={20} />
            </div>
            <span>Profil</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
