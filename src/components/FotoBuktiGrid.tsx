// src/components/FotoBuktiGrid.tsx
// Menampilkan 1-4 foto dalam grid compact dengan lightbox

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    urls: string[];  // array URL foto (dari foto_url dan/atau foto tambahan)
}

export function FotoBuktiGrid({ urls }: Props) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const [errSet, setErrSet] = useState<Set<number>>(new Set());
    const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());

    // Filter URL yang valid (tidak error)
    const validUrls = urls.filter((_, i) => !errSet.has(i));

    if (!validUrls.length) return null;

    const handleErr = (i: number) =>
        setErrSet(prev => new Set([...prev, i]));

    const handleLoad = (i: number) =>
        setLoadedSet(prev => new Set([...prev, i]));

    // Layout berbeda tergantung jumlah foto
    const getGridClass = () => {
        switch (validUrls.length) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-2';
            default: return 'grid-cols-2';
        }
    };

    // Foto ke-4 tampilkan sebagai "+N lagi"
    const displayUrls = validUrls.slice(0, 4);
    const extraCount = validUrls.length - 4;

    return (
        <>
            {/* Label - Lebih subtle */}
            <div className="flex items-center gap-2 my-1 opacity-60">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                    Foto Bukti
                </span>
                <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* Grid foto */}
            <div className={`grid ${getGridClass()} gap-1.5`}>
                {displayUrls.map((url, i) => {
                    const isLast = i === 3;
                    const showExtra = isLast && extraCount > 0;

                    return (
                        <div
                            key={i}
                            className="relative overflow-hidden rounded-lg cursor-pointer group"
                            style={{ aspectRatio: '1' }}
                            onClick={() => setLightboxIdx(i)}
                            role="button"
                            aria-label={`Lihat foto bukti ${i + 1}`}
                        >
                            {/* Skeleton */}
                            {!loadedSet.has(i) && (
                                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                            )}

                            <img
                                src={url}
                                alt={`Foto bukti ${i + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover
                           transition-transform duration-300
                           group-hover:scale-110"
                                onLoad={() => handleLoad(i)}
                                onError={() => handleErr(i)}
                            />

                            {/* Overlay hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                               transition-all duration-300" />

                            {/* Badge "+N lagi" */}
                            {showExtra && (
                                <div className="absolute inset-0 bg-black/60
                                flex items-center justify-center">
                                    <span className="text-white text-lg font-bold">
                                        +{extraCount + 1}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Lightbox - MENGGUNAKAN PORTAL AGAR TERLEPAS DARI STACKING CONTEXT CAROUSEL */}
            {lightboxIdx !== null && createPortal(
                <div
                    className="fixed inset-0 z-[10000] bg-black/95
                     flex items-center justify-center p-4 backdrop-blur-lg"
                    onClick={() => setLightboxIdx(null)}
                >
                    {/* Tombol navigasi antar foto */}
                    {validUrls.length > 1 && (
                        <>
                            <button
                                className="absolute left-6 top-1/2 -translate-y-1/2
                           w-14 h-14 rounded-full bg-white/10 text-white text-3xl
                           flex items-center justify-center
                           hover:bg-white/20 transition-all active:scale-90 z-10"
                                onClick={e => {
                                    e.stopPropagation();
                                    setLightboxIdx(i =>
                                        i === null ? 0 : ((i - 1) + validUrls.length) % validUrls.length
                                    );
                                }}
                                aria-label="Foto sebelumnya"
                            >
                                ‹
                            </button>
                            <button
                                className="absolute right-6 top-1/2 -translate-y-1/2
                           w-14 h-14 rounded-full bg-white/10 text-white text-3xl
                           flex items-center justify-center
                           hover:bg-white/20 transition-all active:scale-90 z-10"
                                onClick={e => {
                                    e.stopPropagation();
                                    setLightboxIdx(i =>
                                        i === null ? 0 : (i + 1) % validUrls.length
                                    );
                                }}
                                aria-label="Foto berikutnya"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Foto aktif */}
                    <div
                        className="relative max-w-4xl w-full flex flex-col items-center"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={validUrls[lightboxIdx]}
                            alt={`Foto bukti ${lightboxIdx + 1}`}
                            className="w-full rounded-2xl max-h-[80vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-zoom-in"
                        />

                        {/* Counter */}
                        <p className="text-center text-white/50 text-sm mt-6 font-medium tracking-widest uppercase">
                            Foto {lightboxIdx + 1} <span className="mx-2">/</span> {validUrls.length}
                        </p>
                    </div>

                    {/* Tombol tutup */}
                    <button
                        className="absolute top-8 right-8 w-12 h-12 rounded-full
                       bg-white/10 text-white flex items-center justify-center
                       hover:bg-white/20 transition-all backdrop-blur-sm shadow-lg active:scale-90"
                        onClick={() => setLightboxIdx(null)}
                        aria-label="Tutup"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>,
                document.body
            )}
        </>
    );
}
