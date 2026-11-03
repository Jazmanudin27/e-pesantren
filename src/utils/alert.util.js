import Swal from 'sweetalert2';

// Custom SweetAlert2 configured for Pesantren Nurul Wafa theme
const customSwal = Swal.mixin({
  confirmButtonColor: '#059669',
  cancelButtonColor: '#ef4444',
  buttonsStyling: true,
  customClass: {
    container: 'swal2-topmost-container',
    popup: 'swal2-pesantren-popup',
    confirmButton: 'swal2-pesantren-btn',
    cancelButton: 'swal2-pesantren-btn-cancel'
  }
});

// Toast notification (top-end)
export const toastSuccess = (title) => {
  return Swal.fire({
    icon: 'success',
    title: title || 'Berhasil',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true
  });
};

export const toastError = (title) => {
  return Swal.fire({
    icon: 'error',
    title: title || 'Terjadi kesalahan',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });
};

// Modal Alert
export const showSuccess = (title, text = '') => {
  return customSwal.fire({
    icon: 'success',
    title: title || 'Berhasil!',
    text,
    confirmButtonText: 'Tutup'
  });
};

export const showError = (title, text = '') => {
  return customSwal.fire({
    icon: 'error',
    title: title || 'Gagal!',
    text,
    confirmButtonText: 'Mengerti'
  });
};

export const showWarning = (title, text = '') => {
  return customSwal.fire({
    icon: 'warning',
    title: title || 'Peringatan!',
    text,
    confirmButtonText: 'OK'
  });
};

// Confirmation Dialog (Supports both async boolean return and callback style)
export const showConfirm = async (title, text = '', confirmButtonText = 'Ya, Lanjutkan', cancelButtonText = 'Batal') => {
  let onConfirmCallback = null;
  let confirmBtnLabel = 'Ya, Lanjutkan';
  let cancelBtnLabel = 'Batal';

  if (typeof confirmButtonText === 'function') {
    onConfirmCallback = confirmButtonText;
    confirmBtnLabel = 'Ya, Lanjutkan';
  } else if (typeof confirmButtonText === 'string') {
    confirmBtnLabel = confirmButtonText;
  }

  if (typeof cancelButtonText === 'string') {
    cancelBtnLabel = cancelButtonText;
  }

  const result = await customSwal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmBtnLabel,
    cancelButtonText: cancelBtnLabel,
    reverseButtons: true
  });

  if (result.isConfirmed) {
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    return true;
  }
  return false;
};

export default customSwal;
