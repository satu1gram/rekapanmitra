// src/hooks/useCarousel.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCarouselOptions {
    total: number;          // jumlah total item
    visible: number;        // berapa yang tampil sekaligus
    autoPlay?: boolean;     // auto-slide otomatis
    autoPlayDelay?: number; // interval ms (default 5000)
    loop?: boolean;         // infinite loop
}

interface UseCarouselReturn {
    currentIndex: number;   // index item paling kiri yang sedang tampil
    canPrev: boolean;
    canNext: boolean;
    goTo: (index: number) => void;
    goNext: () => void;
    goPrev: () => void;
    isPaused: boolean;
    pause: () => void;
    resume: () => void;
    totalPages: number;     // total halaman (dots)
    currentPage: number;    // halaman aktif (0-based)
}

export function useCarousel({
    total,
    visible,
    autoPlay = false,
    autoPlayDelay = 5000,
    loop = true,
}: UseCarouselOptions): UseCarouselReturn {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const totalPages = Math.ceil(total / visible);
    const currentPage = Math.floor(currentIndex / visible);
    const maxIndex = loop ? total - 1 : Math.max(0, total - visible);

    const goTo = useCallback((index: number) => {
        if (loop) {
            setCurrentIndex(((index % total) + total) % total);
        } else {
            setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
        }
    }, [total, maxIndex, loop]);

    const goNext = useCallback(() => {
        setCurrentIndex(prev => {
            if (loop) return (prev + 1) % total;
            return Math.min(prev + visible, maxIndex);
        });
    }, [total, visible, maxIndex, loop]);

    const goPrev = useCallback(() => {
        setCurrentIndex(prev => {
            if (loop) return ((prev - 1) + total) % total;
            return Math.max(prev - visible, 0);
        });
    }, [total, visible, maxIndex, loop]);

    const canPrev = loop ? true : currentIndex > 0;
    const canNext = loop ? true : currentIndex < maxIndex;

    const pause = useCallback(() => setIsPaused(true), []);
    const resume = useCallback(() => setIsPaused(false), []);

    // Auto-play
    useEffect(() => {
        if (!autoPlay || isPaused || total <= visible) return;

        timerRef.current = setInterval(goNext, autoPlayDelay);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [autoPlay, isPaused, autoPlayDelay, goNext, total, visible]);

    return {
        currentIndex,
        canPrev,
        canNext,
        goTo,
        goNext,
        goPrev,
        isPaused,
        pause,
        resume,
        totalPages,
        currentPage,
    };
}
