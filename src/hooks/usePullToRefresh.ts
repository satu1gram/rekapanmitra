import { useState, useRef, useCallback, useEffect } from 'react';

const PULL_THRESHOLD = 72; // px required to trigger refresh
const PULL_MAX = 100;      // max visual pull distance

function isPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone)
  );
}

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!isPWA() || window.scrollY > 0) return;
    startYRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPWA() || !startYRef.current || window.scrollY > 0) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      pullingRef.current = true;
      setPullY(Math.min(delta, PULL_MAX));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    const captured = pullY; // read from closure will be stale; use ref below
    pullingRef.current = false;
    startYRef.current = 0;

    // Read actual pullY via functional update pattern
    setPullY(prev => {
      if (prev >= PULL_THRESHOLD && !isRefreshing) {
        // Trigger refresh asynchronously
        setIsRefreshing(true);
        onRefresh().finally(() => setIsRefreshing(false));
      }
      return 0;
    });
    void captured; // suppress lint warning
  }, [onRefresh, isRefreshing]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullY, isRefreshing, PULL_THRESHOLD, PULL_MAX };
}
