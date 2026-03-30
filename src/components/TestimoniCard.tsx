// src/components/TestimoniCard.tsx

import { ExpandableText } from './ExpandableText';
import { FotoBuktiGrid } from './FotoBuktiGrid';
import type { Testimoni } from '@/types/testimoni';
import { getDisplayName, getInitials } from '@/types/testimoni';

interface Props {
    testimoni: Testimoni;
    compact?: boolean;
}

export function TestimoniCard({ testimoni, compact = false }: Props) {
    const nama = getDisplayName(testimoni);
    const inisial = getInitials(nama);
    const bintang = testimoni.bintang ?? 5;
    const fotos = testimoni.foto_url ? [testimoni.foto_url] : [];

    if (compact) {
        // ── COMPACT VARIANT — untuk inline AI result ──
        return (
            <article
                className="bg-white rounded-2xl p-4 flex flex-col gap-y-3
                     border border-gray-100
                     shadow-[0_2px_12px_rgb(0,0,0,0.05)]
                     transition-all duration-300 hover:shadow-[0_8px_24px_rgb(45,106,79,0.10)]"
            >
                {/* Stars + produk in one row */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-0.5" aria-label={`Rating ${bintang} bintang`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-sm ${i < bintang ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                        ))}
                    </div>
                    {testimoni.produk && (
                        <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                            {testimoni.produk}
                        </span>
                    )}
                </div>

                {/* Quote text */}
                <div className="pl-3 border-l-2 border-green-200/60">
                    <ExpandableText
                        text={testimoni.content}
                        maxLines={fotos.length > 0 ? 3 : 5}
                        className="text-sm text-gray-700 leading-relaxed"
                    />
                </div>

                {/* Foto bukti (compact thumbnails) */}
                {fotos.length > 0 && (
                    <div className="rounded-xl overflow-hidden">
                        <FotoBuktiGrid urls={fotos} />
                    </div>
                )}

                {/* Pengirim footer */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <div className="w-7 h-7 rounded-full bg-green-50 flex-shrink-0 flex items-center justify-center border border-green-100">
                        <span className="text-green-700 text-[10px] font-bold select-none">{inisial || '?'}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{nama || 'Pelanggan'}</p>
                        {testimoni.kota && (
                            <p className="text-[10px] text-gray-400 truncate">{testimoni.kota}</p>
                        )}
                    </div>
                    <div className="ml-auto flex-shrink-0">
                        <span className="material-symbols-rounded text-green-500" style={{ fontSize: '16px' }}>verified</span>
                    </div>
                </div>
            </article>
        );
    }

    // ── STANDARD VARIANT — untuk halaman testimoni utama ──
    return (
        <article
            className="bg-white rounded-[2rem] p-6 h-full flex flex-col gap-y-4
                 border border-gray-100/50
                 shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                 transition-all duration-500 hover:shadow-[0_20px_40px_rgb(45,106,79,0.08)]"
        >
            {/* ── Rating bintang ── */}
            <div className="flex gap-0.5" aria-label={`Rating ${bintang} bintang`}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <span
                        key={i}
                        className={`text-base ${i < bintang ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                        ★
                    </span>
                ))}
            </div>

            {/* ── Teks dengan "Baca Selengkapnya" ── */}
            <div className="relative pl-5 border-l-2 border-green-200/50">
                <span
                    className="absolute -top-5 -left-4 text-6xl text-green-100/30
                     font-serif leading-none select-none italic pointer-events-none"
                    aria-hidden
                >
                    &ldquo;
                </span>
                <ExpandableText
                    text={testimoni.content}
                    maxLines={testimoni.foto_url ? 3 : 5}
                    className="pl-1"
                />
            </div>

            {/* ── Foto bukti (jika ada) ── */}
            {fotos.length > 0 && (
                <FotoBuktiGrid urls={fotos} />
            )}

            {/* ── Profil pengirim ── */}
            <footer className="pt-3 border-t border-gray-50 flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-full bg-green-50 flex-shrink-0
                     flex items-center justify-center
                     border-2 border-green-100"
                >
                    <span className="text-green-700 text-xs font-bold select-none">
                        {inisial || '👤'}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                        {nama || 'Pelanggan'}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate font-medium">
                        {[testimoni.kota, testimoni.produk]
                            .filter(Boolean)
                            .join(' · ') || 'Testimoni Terverifikasi'}
                    </p>
                </div>
            </footer>
        </article>
    );
}
