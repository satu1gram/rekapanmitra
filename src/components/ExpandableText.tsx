import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    text: string;
    maxLines?: number;    // default 4
    className?: string;
}

export function ExpandableText({ text, maxLines = 4, className = '' }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [isClamped, setIsClamped] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    // Deteksi apakah teks benar-benar terpotong
    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        const checkClamp = () => {
            setIsClamped(el.scrollHeight > el.clientHeight + 2);
        };

        checkClamp();

        const observer = new ResizeObserver(checkClamp);
        observer.observe(el);
        return () => observer.disconnect();
    }, [text]);

    const lineClampClass = !expanded
        ? {
            1: 'line-clamp-1',
            2: 'line-clamp-2',
            3: 'line-clamp-3',
            4: 'line-clamp-4',
            5: 'line-clamp-5',
            6: 'line-clamp-6',
        }[maxLines] || 'line-clamp-4'
        : '';

    return (
        <>
            {/* Teks dengan clamp */}
            <div className="relative">
                <p
                    ref={textRef}
                    className={[
                        'text-gray-700 text-sm leading-relaxed italic',
                        lineClampClass,
                        className,
                    ].join(' ')}
                >
                    {text}
                </p>

                {/* Gradient fade yang lebih halus */}
                {isClamped && !expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-10
                          bg-gradient-to-t from-white via-white/80 to-transparent
                          pointer-events-none" />
                )}
            </div>

            {/* Tombol "Baca selengkapnya" */}
            {isClamped && (
                <button
                    onClick={() => setModalOpen(true)}
                    className="mt-3 text-[11px] font-bold text-[#3D7A4F] uppercase tracking-wider
                     hover:text-[#2A5936] transition-all duration-300
                     flex items-center gap-1.5 group/btn"
                    aria-label="Baca testimoni selengkapnya"
                >
                    <span>Baca selengkapnya</span>
                    <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                </button>
            )}

            {/* Modal untuk teks penuh - MENGGUNAKAN PORTAL AGAR SELALU DI TENGAH VIEWPORT */}
            {modalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md
                     flex items-center justify-center p-4"
                    onClick={() => setModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-[2.5rem] max-w-lg w-full max-h-[85vh]
                       flex flex-col shadow-2xl overflow-hidden animate-zoom-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header modal */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span key={i} className="text-amber-400 text-base">★</span>
                                ))}
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-gray-50 flex items-center
                           justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600
                           transition-all active:scale-90"
                                aria-label="Tutup"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Isi teks penuh */}
                        <div className="overflow-y-auto p-8 custom-scrollbar">
                            <p className="text-gray-700 text-lg leading-relaxed italic whitespace-pre-wrap font-serif">
                                &ldquo;{text}&rdquo;
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
