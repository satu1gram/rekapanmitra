import { useState } from 'react';
import { PaymentInfo } from '@/hooks/useStoreSettings';
import { Store, CreditCard, Plus, Trash2, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DS = {
    primary: '#059669',
    navy: '#1E293B',
    gray: '#64748B',
    red: '#DC2626',
};

interface StoreSetupStepProps {
    storeName: string;
    slug: string;
    paymentInfo: PaymentInfo[];
    welcomeMessage: string;
    saving: boolean;
    onChange: (field: 'storeName' | 'slug' | 'paymentInfo' | 'welcomeMessage', value: any) => void;
    onFinish: () => void;
    onBack: () => void;
}

const PAYMENT_TYPES = [
    { value: 'bank', label: 'Transfer Bank' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'cod', label: 'COD / Tunai' },
] as const;

function slugify(val: string): string {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function StoreSetupStep({ storeName, slug, paymentInfo, welcomeMessage, saving, onChange, onFinish, onBack }: StoreSetupStepProps) {
    const [origin] = useState(() => typeof window !== 'undefined' ? window.location.origin : '');
    const [copied, setCopied] = useState(false);
    const canFinish = storeName.trim() && slug.trim() && !saving;

    const handleCopy = () => {
        navigator.clipboard.writeText(`${origin}/toko/${slug}`).then(() => {
            setCopied(true);
            toast.success('URL toko disalin!');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleStoreNameChange = (val: string) => {
        onChange('storeName', val);
        onChange('slug', slugify(val));
    };

    const addPayment = () => {
        onChange('paymentInfo', [...paymentInfo, { type: 'bank', name: '', account_name: '', number: '' }]);
    };

    const updatePayment = (idx: number, field: keyof PaymentInfo, value: string) => {
        onChange('paymentInfo', paymentInfo.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };

    const removePayment = (idx: number) => {
        onChange('paymentInfo', paymentInfo.filter((_, i) => i !== idx));
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-extrabold" style={{ color: DS.navy }}>Toko Publik</h2>
                <p className="text-sm font-medium mt-1" style={{ color: DS.gray }}>
                    Buat link toko agar pelanggan bisa pesan sendiri tanpa WA dulu.
                </p>
            </div>

            {/* Nama Toko */}
            <div className="space-y-1.5">
                <Label className="text-sm font-bold flex items-center gap-1.5" style={{ color: DS.navy }}>
                    <Store className="h-3.5 w-3.5" style={{ color: DS.primary }} />
                    Nama Toko <span style={{ color: DS.red }}>*</span>
                </Label>
                <Input
                    className="h-11 text-sm font-medium placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Toko Mitra Barokah"
                    value={storeName}
                    onChange={e => handleStoreNameChange(e.target.value)}
                    disabled={saving}
                />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
                <Label className="text-sm font-bold" style={{ color: DS.navy }}>
                    URL Toko <span style={{ color: DS.red }}>*</span>
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: DS.gray }}>/toko/</span>
                    <Input
                        className="pl-[4.5rem] h-11 text-sm font-bold placeholder:text-slate-300 placeholder:font-normal"
                        placeholder="nama-toko-saya"
                        value={slug}
                        onChange={e => onChange('slug', slugify(e.target.value))}
                        disabled={saving}
                    />
                </div>
                {slug && (
                    <div className="flex items-center gap-2">
                        <p className="text-[11px] font-medium truncate flex-1" style={{ color: DS.gray }}>
                            🔗 <span style={{ color: DS.navy }}>{origin}/toko/{slug}</span>
                        </p>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={cn(
                                'shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-90',
                                copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                        >
                            {copied ? <><Check className="h-3 w-3" /> Disalin!</> : <><Copy className="h-3 w-3" /> Salin</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Info Pembayaran */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold flex items-center gap-1.5" style={{ color: DS.navy }}>
                        <CreditCard className="h-3.5 w-3.5" style={{ color: DS.primary }} />
                        Info Pembayaran
                    </Label>
                    <button
                        onClick={addPayment}
                        disabled={saving}
                        className="text-xs font-bold flex items-center gap-1"
                        style={{ color: DS.primary }}
                    >
                        <Plus className="h-3.5 w-3.5" /> Tambah
                    </button>
                </div>

                {paymentInfo.length === 0 && (
                    <p className="text-xs text-center py-3 rounded-xl border border-dashed border-slate-200 font-medium" style={{ color: DS.gray, background: '#F8FAFC' }}>
                        Tambahkan rekening / e-wallet untuk pelanggan Anda
                    </p>
                )}

                {paymentInfo.map((p, i) => (
                    <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div className="flex items-center justify-between">
                            <select
                                value={p.type}
                                onChange={e => updatePayment(i, 'type', e.target.value)}
                                disabled={saving}
                                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none"
                            >
                                {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <button
                                onClick={() => removePayment(i)}
                                disabled={saving}
                                className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: '#FEE2E2', color: DS.red }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <Input className="h-8 text-xs" placeholder="Nama bank / e-wallet (misal: BCA, GoPay)" value={p.name} onChange={e => updatePayment(i, 'name', e.target.value)} disabled={saving} />
                        <Input className="h-8 text-xs" placeholder="Nama pemilik rekening" value={p.account_name} onChange={e => updatePayment(i, 'account_name', e.target.value)} disabled={saving} />
                        <Input className="h-8 text-xs" placeholder="Nomor rekening / HP" value={p.number} onChange={e => updatePayment(i, 'number', e.target.value)} disabled={saving} />
                    </div>
                ))}
            </div>

            {/* Pesan sambutan */}
            <div className="space-y-1.5">
                <Label className="text-sm font-bold" style={{ color: DS.navy }}>
                    Pesan Sambutan <span className="font-normal text-sm" style={{ color: DS.gray }}>(opsional)</span>
                </Label>
                <textarea
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 bg-white"
                    style={{ '--tw-ring-color': DS.primary + '40' } as any}
                    placeholder="Halo! Pesananmu langsung kami proses ya 😊"
                    rows={2}
                    value={welcomeMessage}
                    onChange={e => onChange('welcomeMessage', e.target.value)}
                    disabled={saving}
                />
            </div>

            {/* Navigasi */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={onBack}
                    disabled={saving}
                    className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-sm disabled:opacity-40"
                    style={{ color: DS.navy }}
                >
                    Kembali
                </button>
                <button
                    onClick={onFinish}
                    disabled={!canFinish}
                    className="flex-[2] py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={canFinish
                        ? { background: DS.primary, color: '#fff', boxShadow: '0 4px 15px rgba(5,150,105,0.25)' }
                        : { background: '#E2E8F0', color: '#94A3B8' }
                    }
                >
                    {saving
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                        : <><CheckCircle2 className="h-4 w-4" /> Selesaikan Setup</>}
                </button>
            </div>
        </div>
    );
}
