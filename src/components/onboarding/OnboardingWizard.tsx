import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding, OnboardingData } from '@/hooks/useOnboarding';
import { MitraLevel } from '@/types';
import { PaymentInfo } from '@/hooks/useStoreSettings';
import { WelcomeStep } from './steps/WelcomeStep';
import { MitraLevelStep } from './steps/MitraLevelStep';
import { InitialStockStep } from './steps/InitialStockStep';
import { StoreSetupStep } from './steps/StoreSetupStep';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { CheckCircle2, LayoutDashboard, Package, ShoppingCart, Store, Sparkles } from 'lucide-react';

const DS = {
    primary: '#059669',
    navy: '#1E293B',
    gray: '#64748B',
};

const TOTAL_STEPS = 4;

const NEXT_ACTIONS = [
    { icon: ShoppingCart, title: 'Catat order pertama Anda', desc: 'Mulai rekap penjualan dari menu Riwayat' },
    { icon: Package, title: 'Cek & tambah stok', desc: 'Pantau stok botol Anda di menu Produk' },
    { icon: Store, title: 'Bagikan link toko', desc: 'Kirim link toko ke pelanggan agar bisa pesan sendiri' },
];

function SuccessScreen({ onEnter }: { onEnter: () => void }) {
    return (
        <div className="fixed inset-0 z-[110] overflow-y-auto" style={{ background: '#F8FAFC' }}>
            <div className="max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6 py-10 gap-6 text-center">
                {/* Ikon */}
                <div className="relative">
                    <div
                        className="w-28 h-28 rounded-3xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #059669, #34D399)',
                            boxShadow: '0 8px 32px rgba(5,150,105,0.30)',
                            animation: 'bounce 0.8s ease-in-out',
                        }}
                    >
                        <CheckCircle2 className="h-14 w-14 text-white" strokeWidth={1.5} />
                    </div>
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-pulse" />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-black leading-tight" style={{ color: DS.navy }}>
                        Setup Selesai! 🎉
                    </h1>
                    <p className="text-sm font-medium leading-relaxed max-w-xs mx-auto" style={{ color: DS.gray }}>
                        Toko Anda sudah siap. Selamat bergabung di{' '}
                        <span className="font-extrabold" style={{ color: DS.primary }}>Rekapan Mitra BP</span>!
                    </p>
                </div>

                {/* Langkah selanjutnya */}
                <div className="w-full rounded-3xl p-5 space-y-3 text-left" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
                    <p className="text-xs font-bold uppercase tracking-widest text-center mb-1" style={{ color: DS.gray }}>
                        Yang bisa Anda lakukan sekarang:
                    </p>
                    {NEXT_ACTIONS.map(({ icon: Icon, title, desc }, i) => (
                        <div key={i} className="flex items-start gap-4">
                            <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                <Icon className="h-4 w-4" style={{ color: DS.primary }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold" style={{ color: DS.navy }}>{title}</p>
                                <p className="text-xs font-medium" style={{ color: DS.gray }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onEnter}
                    className="w-full py-4 text-white rounded-2xl font-extrabold text-base active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ background: DS.primary, boxShadow: '0 4px 15px rgba(5,150,105,0.25)' }}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    Masuk ke Dashboard
                </button>
            </div>
        </div>
    );
}

export function OnboardingWizard() {
    const { profile } = useProfile();
    const { saving, completeOnboarding } = useOnboarding();

    const [currentStep, setCurrentStep] = useState(1);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [data, setData] = useState<OnboardingData>({
        name: (profile as any)?.name || '',
        phone: (profile as any)?.phone || '',
        mitraLevel: ((profile as any)?.mitra_level as MitraLevel) || 'reseller',
        customLevelName: '',
        customBuyPrice: 0,
        initialStock: 0,
        storeName: '',
        slug: '',
        paymentInfo: [],
        welcomeMessage: '',
    });

    const updateField = (field: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const next = () => setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS));
    const back = () => setCurrentStep(s => Math.max(s - 1, 1));

    const handleFinish = async () => {
        setError(null);
        try {
            await completeOnboarding(data);
            setDone(true);
        } catch (err: any) {
            setError(err?.message || 'Terjadi kesalahan. Coba lagi.');
        }
    };

    if (saving) {
        return (
            <div className="fixed inset-0 z-[100]" style={{ background: '#F8FAFC' }}>
                <LoadingScreen fullScreen />
                <p
                    className="fixed bottom-10 w-full text-center text-sm font-bold animate-pulse"
                    style={{ color: DS.primary }}
                >
                    Menyimpan data setup Anda…
                </p>
            </div>
        );
    }

    if (done) {
        return <SuccessScreen onEnter={() => window.location.reload()} />;
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" style={{ background: '#F8FAFC' }}>
            <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-white">
                {/* Progress bar */}
                {currentStep > 1 && (
                    <div className="sticky top-0 z-10 px-4 pt-4 pb-3 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DS.gray }}>
                                Langkah {currentStep - 1} dari {TOTAL_STEPS - 1}
                            </p>
                            <p className="text-xs font-bold" style={{ color: DS.primary }}>
                                {Math.round(((currentStep - 1) / (TOTAL_STEPS - 1)) * 100)}%
                            </p>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`,
                                    background: DS.primary,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Step content */}
                <div className="flex-1 px-4 py-6">
                    {currentStep === 1 && <WelcomeStep onNext={next} />}
                    {currentStep === 2 && (
                        <MitraLevelStep
                            name={data.name} phone={data.phone}
                            mitraLevel={data.mitraLevel as MitraLevel}
                            customLevelName={data.customLevelName}
                            customBuyPrice={data.customBuyPrice}
                            onChange={(field, value) => updateField(field as keyof OnboardingData, value)}
                            onNext={next} onBack={back}
                        />
                    )}
                    {currentStep === 3 && (
                        <InitialStockStep
                            mitraLevel={data.mitraLevel as MitraLevel}
                            customBuyPrice={data.customBuyPrice}
                            initialStock={data.initialStock}
                            onChange={qty => updateField('initialStock', qty)}
                            onNext={next} onBack={back}
                        />
                    )}
                    {currentStep === 4 && (
                        <>
                            {error && (
                                <div className="mb-4 rounded-2xl p-3 text-sm font-medium flex items-start gap-2"
                                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                                    ⚠️ {error}
                                </div>
                            )}
                            <StoreSetupStep
                                storeName={data.storeName} slug={data.slug}
                                paymentInfo={data.paymentInfo as PaymentInfo[]}
                                welcomeMessage={data.welcomeMessage}
                                saving={saving}
                                onChange={(field, value) => updateField(field as keyof OnboardingData, value)}
                                onFinish={handleFinish} onBack={back}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
