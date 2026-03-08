// src/components/TestimoniRelated.tsx
// Menampilkan 1 testimoni relevan di hasil konsultasi AI

import { useState } from 'react';
import { useTestimonials } from '@/hooks/useTestimonials';
import { getDisplayName } from '@/types/testimoni';

interface Props {
    namaProduk: string; // nama produk yang direkomendasikan AI
}

export function TestimoniRelated({ namaProduk }: Props) {
    const { data, loading } = useTestimonials({ produk: namaProduk, limit: 1 });
    const [fotoOpen, setFotoOpen] = useState(false);

    // Jangan render apapun saat loading atau tidak ada data
    if (loading || data.length === 0) return null;

    const t = data[0];
    const nama = getDisplayName(t);

    return (
        <>
            <div className="mt-4 bg-amber-50/50 border border-amber-100 rounded-2xl p-4 shadow-sm">
                {/* Label */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="text-[12px]">💬</span>
                    </div>
                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">
                        Review Pengguna {namaProduk}
                    </p>
                </div>

                {/* Kutipan */}
                <p className="text-[12px] text-gray-700 italic leading-relaxed line-clamp-3 pl-2 border-l-2 border-amber-200">
                    "{t.content}"
                </p>

                {/* Foto bukti kecil (jika ada) */}
                {t.foto_url && (
                    <button
                        onClick={() => setFotoOpen(true)}
                        className="mt-4 w-full overflow-hidden rounded-xl group relative ring-1 ring-amber-100"
                        aria-label="Lihat foto bukti"
                    >
                        <img
                            src={t.foto_url}
                            alt="Bukti testimoni"
                            loading="lazy"
                            className="w-full h-24 object-cover rounded-xl group-hover:brightness-90 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-xl flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition bg-black/50 px-3 py-1 rounded-full flex items-center gap-1">
                                <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>zoom_in</span>
                                Lihat Bukti
                            </span>
                        </div>
                    </button>
                )}

                {/* Nama + kota */}
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500 font-medium">
                        — {nama}{t.kota ? `, ${t.kota}` : ''}
                    </p>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-[10px]">⭐</span>)}
                    </div>
                </div>
            </div>

            {/* Lightbox foto */}
            {fotoOpen && t.foto_url && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
                    onClick={() => setFotoOpen(false)}
                >
                    <div
                        className="relative max-w-sm w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setFotoOpen(false)}
                            className="absolute -top-12 right-0 text-white text-xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
                        >
                            <span className="material-symbols-rounded">close</span>
                        </button>
                        <img
                            src={t.foto_url}
                            alt="Bukti testimoni"
                            className="w-full rounded-2xl shadow-2xl border border-white/10"
                        />
                        <div className="mt-4 text-center">
                            <p className="text-white text-sm font-bold">
                                {nama}{t.kota ? ` — ${t.kota}` : ''}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">Bukti pemakaian {namaProduk}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
