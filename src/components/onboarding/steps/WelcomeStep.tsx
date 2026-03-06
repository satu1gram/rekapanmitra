import { Sparkles, CheckCircle2 } from 'lucide-react';

// Design System
const DS = {
    primary: '#059669',
    navy: '#1E293B',
    gray: '#64748B',
};

interface WelcomeStepProps {
    onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
    const highlights = [
        'Level mitra & harga modal Anda',
        'Stok botol yang Anda punya sekarang',
        'Link toko publik untuk pelanggan',
    ];

    return (
        <div className="flex flex-col items-center text-center px-2 py-4 gap-6">
            {/* Ikon utama */}
            <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #059669, #34D399)',
                    boxShadow: '0 8px 32px rgba(5,150,105,0.30)',
                }}
            >
                <Sparkles className="h-12 w-12 text-white" strokeWidth={1.5} />
            </div>

            {/* Heading */}
            <div className="space-y-2">
                <h1 className="text-2xl font-black leading-tight" style={{ color: DS.navy }}>
                    Selamat datang di<br />
                    <span style={{ color: DS.primary }}>Rekapan Mitra BP!</span> 🎉
                </h1>
                <p className="text-sm font-medium leading-relaxed max-w-xs mx-auto" style={{ color: DS.gray }}>
                    Kami akan bantu setup toko Anda dalam <strong style={{ color: DS.navy }}>3 langkah cepat</strong> — kurang dari 5 menit!
                </p>
            </div>

            {/* Yang akan dikonfigurasi */}
            <div className="w-full rounded-2xl p-4 space-y-2.5 text-left" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: DS.gray }}>Yang akan kita setup:</p>
                {highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: DS.primary }} />
                        <span className="text-sm font-semibold" style={{ color: DS.navy }}>{item}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <button
                onClick={onNext}
                className="w-full py-4 text-white rounded-2xl font-extrabold text-base active:scale-95 transition-all"
                style={{
                    background: DS.primary,
                    boxShadow: '0 4px 15px rgba(5,150,105,0.30)',
                }}
            >
                Mulai Setup →
            </button>
        </div>
    );
}
