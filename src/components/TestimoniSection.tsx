// src/components/TestimoniSection.tsx

import { useRef, useEffect, useState } from 'react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { useCarousel } from '@/hooks/useCarousel';
import { useSwipe } from '@/hooks/useSwipe';
import { TestimoniCard } from '@/components/TestimoniCard';
import { KELUHAN_TAG_MAP } from '@/constants/keluhanConstants';

// ── Skeleton ───────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-5 h-full border border-gray-100 animate-pulse">
            <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-4 bg-gray-100 rounded" />)}
            </div>
            <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
                <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-4">
                <div className="aspect-square bg-gray-100 rounded-lg" />
                <div className="aspect-square bg-gray-100 rounded-lg" />
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                <div className="w-9 h-9 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-20" />
                    <div className="h-2 bg-gray-100 rounded w-28" />
                </div>
            </div>
        </div>
    );
}

// ── Tombol navigasi ─────────────────────────────────────────────
interface NavButtonProps {
    direction: 'prev' | 'next';
    onClick: () => void;
    disabled: boolean;
}

function NavButton({ direction, onClick, disabled }: NavButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={direction === 'prev' ? 'Testimoni sebelumnya' : 'Testimoni berikutnya'}
            className={[
                'w-10 h-10 rounded-full border-2 flex items-center justify-center',
                'text-lg font-bold transition-all duration-200',
                'select-none flex-shrink-0',
                disabled
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-[#3D7A4F] text-[#3D7A4F] hover:bg-[#3D7A4F] hover:text-white',
            ].join(' ')}
        >
            {direction === 'prev' ? (
                <span className="material-symbols-rounded">chevron_left</span>
            ) : (
                <span className="material-symbols-rounded">chevron_right</span>
            )}
        </button>
    );
}

// ── Pagination dots ──────────────────────────────────────────────
function PaginationDots({
    total,
    current,
    onDotClick,
}: {
    total: number;
    current: number;
    onDotClick: (i: number) => void;
}) {
    if (total <= 1) return null;

    return (
        <div className="flex justify-center gap-2 mt-6" role="tablist">
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Halaman testimoni ${i + 1}`}
                    onClick={() => onDotClick(i)}
                    className={[
                        'rounded-full transition-all duration-300',
                        i === current
                            ? 'w-6 h-2 bg-[#3D7A4F]'
                            : 'w-2 h-2 bg-gray-200 hover:bg-gray-300',
                    ].join(' ')}
                />
            ))}
        </div>
    );
}

// ── Komponen Utama ───────────────────────────────────────────────
export function TestimoniSection({ activeKeluhan = [], compact = false }: { activeKeluhan?: string[]; compact?: boolean }) {
    const { data: allTestimoni, loading, error, refetch } = useTestimonials({ limit: compact ? 6 : 12 });
    const [opacity, setOpacity] = useState(1);

    // Responsive: step 1 card per klik
    const VISIBLE_DESKTOP = 3;

    // ── Filter Logic ──
    const filtered = activeKeluhan.length === 0
        ? allTestimoni
        : allTestimoni.filter(t => {
            const tags = (t as any).tags || [];
            return tags.some((tag: string) =>
                activeKeluhan.some(k => {
                    // Normalisasi: hilangkan emoji (semua karakter non-alfanumerik di awal)
                    const normalizedKey = k.replace(/^[^a-zA-Z0-9]+\s*/, '');
                    return KELUHAN_TAG_MAP[normalizedKey]?.includes(tag);
                })
            );
        });

    const displayed = activeKeluhan.length > 0 ? filtered : allTestimoni;

    const carousel = useCarousel({
        total: displayed.length,
        visible: 1,
        autoPlay: false,
        loop: true,
    });

    // Reset carousel and animate on activeKeluhan change
    useEffect(() => {
        setOpacity(0);
        const timer = setTimeout(() => {
            carousel.goTo(0);
            setOpacity(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [activeKeluhan]);

    const swipe = useSwipe({
        onSwipeLeft: carousel.goNext,
        onSwipeRight: carousel.goPrev,
    });

    const trackRef = useRef<HTMLDivElement>(null);

    // Offset slide
    const getTranslate = () => {
        return `translateX(calc(-${carousel.currentIndex} * (100% / 3)))`;
    };

    const getMobileTranslate = () => {
        return `translateX(-${carousel.currentIndex * 100}%)`;
    };

    return (
        <section
            id={compact ? undefined : 'testimoni'}
            className={compact
                ? 'overflow-hidden'
                : 'py-16 bg-[#F8FBF9] overflow-hidden'
            }
            aria-labelledby="testimoni-heading"
            onMouseEnter={carousel.pause}
            onMouseLeave={carousel.resume}
        >
            <div className={compact ? '' : 'max-w-6xl mx-auto px-4'}>

                {/* ── Header — only shown in full mode ── */}
                {!compact && (
                <div className="text-center mb-10">
                    <p className="text-xs font-bold tracking-widest text-[#3D7A4F] uppercase mb-3">
                        TESTIMONI
                    </p>
                    <h2
                        id="testimoni-heading"
                        className="font-serif text-[clamp(2.5rem,5vw,3rem)] text-gray-800 leading-tight"
                    >
                        Kisah Nyata{' '}
                        <em className="italic text-[#3D7A4F] not-italic">Keluarga Sehat</em>
                    </h2>
                    <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm md:text-base">
                        Cerita nyata dari pengguna setia BP Group — bukan klaim kami 🌿
                    </p>

                    {/* ── Active Filter Badge ── */}
                    {activeKeluhan.length > 0 && (
                        <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-[#EBF7EF] text-[#3D7A4F] px-4 py-1.5 rounded-full text-sm font-semibold border border-[#D1EADC] flex items-center gap-2">
                                <span className={`flex h-2 w-2 rounded-full ${filtered.length > 0 ? 'bg-[#3D7A4F]' : 'bg-amber-400'}`} />
                                {filtered.length > 0
                                    ? `Menampilkan testimoni: ${activeKeluhan.join(' & ')}`
                                    : `Belum ada testimoni khusus untuk: ${activeKeluhan.join(' & ')}`
                                }
                            </div>
                        </div>
                    )}
                </div>
                )}

                {/* ── Compact filter indicator ── */}
                {compact && activeKeluhan.length > 0 && (
                    <div className="mb-3 flex items-center gap-2">
                        <span className={`flex h-2 w-2 rounded-full flex-shrink-0 ${filtered.length > 0 ? 'bg-[#3D7A4F]' : 'bg-amber-400'}`} />
                        <p className="text-xs text-gray-500">
                            {filtered.length > 0
                                ? `${filtered.length} testimoni untuk keluhan ini`
                                : 'Belum ada testimoni spesifik — menampilkan pilihan kami'
                            }
                        </p>
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="text-center py-8">
                        <p className="text-gray-400 text-sm mb-3">
                            Testimoni tidak dapat dimuat saat ini.
                        </p>
                        <button
                            onClick={refetch}
                            className="text-[#3D7A4F] text-sm underline hover:no-underline"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                )}

                {/* ── Carousel ── */}
                {!loading && !error && displayed.length > 0 && (
                    <div style={{ opacity, transition: 'opacity 300ms ease-in-out' }}>
                        <div className="flex items-center gap-2 md:gap-4">

                            {/* Tombol Prev */}
                            {!compact && (
                            <div className="hidden sm:block">
                                <NavButton
                                    direction="prev"
                                    onClick={carousel.goPrev}
                                    disabled={!carousel.canPrev}
                                />
                            </div>
                            )}

                            {/* Track container */}
                            <div
                                className="flex-1 overflow-hidden"
                                {...swipe}
                                style={{ cursor: 'grab' }}
                            >
                                {/* DESKTOP TRACK */}
                                <div
                                    ref={trackRef}
                                    className="hidden md:flex transition-transform duration-800 cubic-bezier(0.16, 1, 0.3, 1)"
                                    style={{ transform: getTranslate(), willChange: 'transform' }}
                                    aria-live="polite"
                                >
                                    {displayed.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className="w-1/3 flex-shrink-0 px-5 flex items-stretch"
                                            aria-hidden={
                                                i < carousel.currentIndex ||
                                                i >= carousel.currentIndex + VISIBLE_DESKTOP
                                            }
                                        >
                                            <TestimoniCard testimoni={t} compact={compact} />
                                        </div>
                                    ))}
                                </div>

                                {/* MOBILE TRACK */}
                                <div
                                    className="flex md:hidden transition-transform duration-800 cubic-bezier(0.16, 1, 0.3, 1)"
                                    style={{ transform: getMobileTranslate(), willChange: 'transform' }}
                                    aria-live="polite"
                                >
                                    {displayed.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className="w-full flex-shrink-0 px-3 flex items-stretch"
                                            aria-hidden={i !== carousel.currentIndex}
                                        >
                                            <TestimoniCard testimoni={t} compact={compact} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tombol Next */}
                            {!compact && (
                            <div className="hidden sm:block">
                                <NavButton
                                    direction="next"
                                    onClick={carousel.goNext}
                                    disabled={!carousel.canNext}
                                />
                            </div>
                            )}
                        </div>

                        {/* Pagination dots */}
                        <PaginationDots
                            total={displayed.length}
                            current={carousel.currentIndex}
                            onDotClick={i => carousel.goTo(i)}
                        />

                        {/* Counter mobile only */}
                        <p className="text-center text-xs text-gray-400 mt-4 sm:hidden">
                            {carousel.currentIndex + 1} dari {displayed.length} testimoni
                        </p>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !error && displayed.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-5xl mb-3">🌱</p>
                        <p className="text-gray-400 text-sm">Testimoni segera hadir</p>
                    </div>
                )}
            </div>
        </section>
    );
}
