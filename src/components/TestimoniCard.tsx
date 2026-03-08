// src/components/TestimoniCard.tsx

import { ExpandableText } from './ExpandableText';
import { FotoBuktiGrid } from './FotoBuktiGrid';
import type { Testimoni } from '@/types/testimoni';
import { getDisplayName, getInitials } from '@/types/testimoni';

interface Props {
    testimoni: Testimoni;
}

export function TestimoniCard({ testimoni }: Props) {
    const nama = getDisplayName(testimoni);
    const inisial = getInitials(nama);
    const bintang = testimoni.bintang ?? 5;
    const fotos = testimoni.foto_url ? [testimoni.foto_url] : [];

    return (
        <article
            className="bg-white rounded-[2rem] p-8 h-full flex flex-col gap-y-7
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
            <div className="flex-1 relative pl-5 border-l-2 border-green-200/50">
                {/* Tanda kutip dekoratif */}
                <span
                    className="absolute -top-6 -left-4 text-7xl text-green-100/30
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
            <footer className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-3">
                {/* Avatar inisial */}
                <div
                    className="w-9 h-9 rounded-full bg-green-50 flex-shrink-0
                     flex items-center justify-center
                     border-2 border-green-100"
                >
                    <span className="text-green-700 text-xs font-bold select-none">
                        {inisial || '👤'}
                    </span>
                </div>

                {/* Info */}
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
