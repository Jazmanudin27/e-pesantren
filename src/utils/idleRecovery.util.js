import { useEffect, useRef } from 'react';

/**
 * Jalankan callback refresh saat tab/PWA dibuka kembali setelah idle >= minIdleMs
 * atau dipulihkan dari browser bfcache (pageshow persisted).
 */
export function useIdleResumeRefresh(onResume, minIdleMs = 60000) {
  const onResumeRef = useRef(onResume);
  onResumeRef.current = onResume;

  useEffect(() => {
    let hiddenAt = 0;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= minIdleMs) {
        hiddenAt = 0;
        if (typeof onResumeRef.current === 'function') {
          onResumeRef.current();
        }
      }
    };

    const handlePageShow = (event) => {
      if (event.persisted && typeof onResumeRef.current === 'function') {
        onResumeRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [minIdleMs]);
}

