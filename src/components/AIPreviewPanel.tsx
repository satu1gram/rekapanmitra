// src/components/AIPreviewPanel.tsx
// Panel kanan konsultasi AI dengan 3 state: default, chip selected, loading

import { useEffect, useState } from 'react';

// ── Tipe ─────────────────────────────────────────────────────────
interface Props {
    selectedChips: string[];   // chip keluhan yang sudah dipilih user
    manualText?: string;       // teks tambahan dari textarea
    isLoading: boolean;    // sedang loading API call
    hasResult: boolean;    // sudah ada hasil AI
}

// ── Data contoh hasil AI (untuk preview di state default) ────────
const PREVIEW_EXAMPLE = {
    keluhan: 'Susah Tidur & Kurang Stamina',
    tips: [
        { icon: '🌙', text: 'Hindari layar HP 1 jam sebelum tidur' },
        { icon: '🍵', text: 'Minum teh chamomile hangat sebelum tidur' },
        { icon: '🚶', text: 'Jalan kaki 15 menit setiap pagi hari' },
    ],
    produk: 'British Propolis + Brassic Pro',
};

// ── Counter statistik (HIDDEN FOR LAUNCH) ────────
/*
const STATS = [
    { value: '690+', label: 'Konsultasi selesai' },
    { value: '98%', label: 'Puas dengan saran' },
    { value: '<10s', label: 'Rata-rata respons' },
];
*/

// ── Rotating headline untuk state default ────────────────────────
const ROTATING_HEADLINES = [
    'Dapatkan panduan gaya hidup personal dalam 10 detik 🌿',
    'Ribuan keluarga sudah merasakan manfaatnya ✨',
    'Gratis. Tanpa daftar. Tanpa data pribadi. 🔒',
    'AI kami baca keluhanmu, bukan sekadar jual produk 💚',
];

// ═══════════════════════════════════════════
// Sub-komponen: Default State
// ═══════════════════════════════════════════
function DefaultState() {
    const [headlineIdx, setHeadlineIdx] = useState(0);
    const [fade, setFade] = useState(true);

    // Rotasi headline setiap 3 detik
    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setHeadlineIdx(i => (i + 1) % ROTATING_HEADLINES.length);
                setFade(true);
            }, 300);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-5 h-full pt-4">

            {/* ── Rotating headline persuasif ── */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p
                    className="text-sm font-medium text-[#2A5936] text-center leading-snug
                     transition-opacity duration-300"
                    style={{ opacity: fade ? 1 : 0 }}
                >
                    {ROTATING_HEADLINES[headlineIdx]}
                </p>
            </div>

            {/* ── Preview "Begini contoh hasilnya" ── */}
            <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    👀 Contoh hasil untuk:
                    <span className="text-[#3D7A4F] normal-case font-semibold ml-1">
                        "{PREVIEW_EXAMPLE.keluhan}"
                    </span>
                </p>

                {/* Preview tips gaya hidup */}
                <div className="space-y-2 mb-4">
                    {PREVIEW_EXAMPLE.tips.map((tip, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2.5 bg-white border border-green-100
                         rounded-xl p-3"
                        >
                            <span className="text-base flex-shrink-0">{tip.icon}</span>
                            <p className="text-xs text-gray-600 leading-relaxed">{tip.text}</p>
                        </div>
                    ))}
                </div>

                {/* Blur overlay — "ini cuma preview, hasilmu bisa berbeda" */}
                <div className="relative">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3
                          filter blur-[2px] select-none pointer-events-none">
                        <p className="text-xs font-semibold text-amber-700 mb-1">
                            🛍️ Rekomendasi Produk
                        </p>
                        <p className="text-xs text-gray-600">
                            {PREVIEW_EXAMPLE.produk}
                        </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white/90 text-xs font-semibold text-[#3D7A4F]
                             px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                            🔍 Analisis dulu untuk lihat rekomendasimu
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Stats social proof (HIDDEN FOR LAUNCH) ── */}
            {/*
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                {STATS.map((s, i) => (
                    <div key={i} className="text-center">
                        <p className="text-lg font-bold text-[#3D7A4F]">{s.value}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>
            */}

            <div className="pt-4 border-t border-gray-100 mb-4"></div>

            {/* ── Trust badges ── */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
                {['🔒 Privasi terjaga', '✅ Gratis', '⚡ < 10 detik'].map((badge, i) => (
                    <span
                        key={i}
                        className="text-[10px] font-medium text-gray-500
                       bg-gray-50 border border-gray-200
                       px-2.5 py-1 rounded-full"
                    >
                        {badge}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// Sub-komponen: Chip Selected State
// ═══════════════════════════════════════════
function ChipSelectedState({ chips, manualText }: { chips: string[], manualText?: string }) {
    const [pulse, setPulse] = useState(true);

    useEffect(() => {
        const t = setInterval(() => setPulse(p => !p), 1200);
        return () => clearInterval(t);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-10">

            {/* Animated "AI memperhatikan" indicator */}
            <div className="relative">
                {/* Outer pulse ring */}
                <div
                    className={`absolute inset-0 rounded-full bg-green-200
                      transition-all duration-700 ease-in-out
                      ${pulse ? 'scale-125 opacity-30' : 'scale-100 opacity-0'}`}
                />
                {/* Inner circle */}
                <div className="relative w-20 h-20 rounded-full bg-green-100
                        flex items-center justify-center">
                    <span className="text-3xl">🧬</span>
                </div>
            </div>

            <div>
                <p className="text-base font-bold text-[#2A5936] mb-1">
                    AI siap menganalisis
                </p>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                    Kamu memilih{' '}
                    <span className="font-semibold text-[#3D7A4F]">
                        {chips.length} keluhan
                    </span>
                    . Klik tombol untuk dapatkan panduan personalmu.
                </p>
            </div>

            {/* Chips yang dipilih — tampilkan ulang sebagai konfirmasi */}
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs scale-in">
                {chips.map((chip, i) => (
                    <span
                        key={i}
                        className="text-xs bg-green-100 text-[#2A5936] font-medium
                       px-3 py-1.5 rounded-full border border-green-200"
                    >
                        {chip}
                    </span>
                ))}
            </div>

            {/* Manual text display */}
            {manualText && manualText.trim() && (
                <div className="mt-2 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl max-w-xs w-full text-left scale-in">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">✍️ Catatan Tambahan:</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-3">
                        "{manualText}"
                    </p>
                </div>
            )}

        </div>
    );
}

// ═══════════════════════════════════════════
// Sub-komponen: Loading State
// ═══════════════════════════════════════════
const LOADING_STEPS = [
    { icon: '🔍', text: 'Membaca kondisimu...', duration: 2500 },
    { icon: '🧠', text: 'Menganalisis pola kesehatan...', duration: 2500 },
    { icon: '🌿', text: 'Menyiapkan panduan hidup sehat...', duration: 2000 },
    { icon: '💊', text: 'Mencocokkan produk yang tepat...', duration: 2000 },
    { icon: '✨', text: 'Hampir selesai...', duration: 99999 },
];

function LoadingState() {
    const [stepIdx, setStepIdx] = useState(0);
    const [progress, setProgress] = useState(0);

    // Step progression
    useEffect(() => {
        let acc = 0;
        const timers: ReturnType<typeof setTimeout>[] = [];

        LOADING_STEPS.forEach((step, i) => {
            if (i === 0) return;
            acc += LOADING_STEPS[i - 1].duration;
            timers.push(setTimeout(() => setStepIdx(i), acc));
        });

        return () => timers.forEach(clearTimeout);
    }, []);

    // Progress bar
    useEffect(() => {
        const totalDuration = LOADING_STEPS.slice(0, -1)
            .reduce((sum, s) => sum + s.duration, 0);

        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct = Math.min((elapsed / totalDuration) * 90, 90);
            setProgress(pct);
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const currentStep = LOADING_STEPS[stepIdx];

    return (
        <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-4 py-10">

            {/* Progress bar */}
            <div className="w-full">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Menganalisis</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#3D7A4F] to-[#52B788]
                       rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Step icon — animated */}
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-100
                        flex items-center justify-center">
                    <span
                        key={stepIdx}
                        className="text-4xl animate-bounce"
                        style={{ animationDuration: '1s' }}
                    >
                        {currentStep.icon}
                    </span>
                </div>
                {/* Spinning ring */}
                <div className="absolute inset-0 rounded-full border-2 border-transparent
                        border-t-[#3D7A4F] animate-spin" />
            </div>

            {/* Step text */}
            <div>
                <p
                    key={stepIdx}
                    className="text-base font-semibold text-[#2A5936] mb-1
                     transition-all duration-300"
                >
                    {currentStep.text}
                </p>
                <p className="text-xs text-gray-400">
                    Biasanya selesai dalam 5–10 detik
                </p>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2">
                {LOADING_STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={`rounded-full transition-all duration-500 ${i < stepIdx
                            ? 'w-2 h-2 bg-[#3D7A4F]'
                            : i === stepIdx
                                ? 'w-4 h-2 bg-[#3D7A4F]'
                                : 'w-2 h-2 bg-gray-200'
                            }`}
                    />
                ))}
            </div>

            {/* Fun fact saat loading — random & rotating */}
            <FunFact />
        </div>
    );
}

// ═══════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════
export function AIPreviewPanel({ selectedChips, manualText, isLoading, hasResult }: Props) {
    // Jika sudah ada hasil, panel ini tidak perlu dirender
    // (hasil ditangani oleh komponen hasil AI yang sudah ada)
    if (hasResult) return null;

    return (
        <div className="h-full min-h-[500px] flex flex-col">
            {isLoading ? (
                <LoadingState />
            ) : (selectedChips.length > 0 || (manualText && manualText.trim())) ? (
                <ChipSelectedState chips={selectedChips} manualText={manualText} />
            ) : (
                <DefaultState />
            )}
        </div>
    );
}
