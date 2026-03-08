// src/hooks/useSwipe.ts
// Hook untuk deteksi swipe gesture di mobile

import { useRef, useCallback } from 'react';

interface UseSwipeOptions {
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    threshold?: number; // px minimum untuk dianggap swipe (default 50)
}

interface UseSwipeReturn {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
}

export function useSwipe({
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
}: UseSwipeOptions): UseSwipeReturn {
    const startX = useRef<number | null>(null);

    const handleStart = useCallback((x: number) => {
        startX.current = x;
    }, []);

    const handleEnd = useCallback((x: number) => {
        if (startX.current === null) return;

        const diff = startX.current - x;

        if (Math.abs(diff) >= threshold) {
            if (diff > 0) onSwipeLeft();
            else onSwipeRight();
        }

        startX.current = null;
    }, [onSwipeLeft, onSwipeRight, threshold]);

    return {
        onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].clientX),
        onTouchEnd: (e: React.TouchEvent) => handleEnd(e.changedTouches[0].clientX),
        onMouseDown: (e: React.MouseEvent) => handleStart(e.clientX),
        onMouseUp: (e: React.MouseEvent) => handleEnd(e.clientX),
    };
}
