/**
 * Hentikan MediaStream tracks secara paksa dan lepaskan srcObject dari elemen <video>
 */
export const stopStreamAndVideo = (streamRef, videoRef) => {
  try {
    if (streamRef?.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
  } catch (e) {}

  try {
    const videoEl = videoRef?.current;
    if (videoEl) {
      if (videoEl.srcObject && typeof videoEl.srcObject.getTracks === 'function') {
        videoEl.srcObject.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
      videoEl.pause?.();
      videoEl.srcObject = null;
    }
  } catch (e) {}
};

/**
 * Safety net: hentikan semua MediaStream kamera di dalam container atau seluruh dokumen
 */
export const stopAllActiveCameraStreams = (rootEl = null) => {
  try {
    const scope = rootEl || (typeof document !== 'undefined' ? document : null);
    if (!scope) return;
    const videos = scope.querySelectorAll('video');
    videos.forEach((v) => {
      try {
        if (v.srcObject && typeof v.srcObject.getTracks === 'function') {
          v.srcObject.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
        }
        v.pause?.();
        v.srcObject = null;
      } catch (e) {}
    });
  } catch (e) {}
};

