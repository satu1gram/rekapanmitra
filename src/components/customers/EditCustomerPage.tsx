import { useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, Save, Loader2, ShoppingBag, Store, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TierType, TIER_PRICING } from '@/types';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface EditCustomerPageProps {
    customer: Customer;
    onBack: () => void;
    onSaved: (updated: Customer) => void;
}

type Status = 'konsumen' | 'mitra';

const MITRA_TIERS: { tier: TierType; label: string; desc: string; icon: React.ReactNode }[] = [
    {
        tier: 'reseller',
        label: 'Reseller',
        desc: 'Min. Order 3 Pcs',
        icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
        tier: 'agen',
        label: 'Agen',
        desc: 'Min. Order 5 Pcs',
        icon: <Store className="h-5 w-5" />,
    },
    {
        tier: 'agen_plus',
        label: 'Agen Plus',
        desc: 'Min. Order 10 Pcs',
        icon: <Store className="h-5 w-5" />,
    },
    {
        tier: 'sap',
        label: 'Spesial Agen Plus',
        desc: 'Min. Order 40 Pcs',
        icon: <Package className="h-5 w-5" />,
    },
    {
        tier: 'se',
        label: 'Special Entrepreneur',
        desc: 'Min. Order 200 Pcs',
        icon: <Package className="h-5 w-5" />,
    },
];

function isMitraTier(tier: string): boolean {
    return ['reseller', 'agen', 'agen_plus', 'sap', 'se'].includes(tier);
}

export function EditCustomerPage({ customer, onBack, onSaved }: EditCustomerPageProps) {
    const { user } = useAuth();
    const [name, setName] = useState(customer.name);
    const [phone, setPhone] = useState(customer.phone);
    const [address, setAddress] = useState(customer.address || '');
    const [status, setStatus] = useState<Status>(isMitraTier(customer.tier) ? 'mitra' : 'konsumen');
    const [tier, setTier] = useState<TierType>(customer.tier as TierType || 'satuan');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || !phone.trim()) {
            toast.error('Nama dan nomor WhatsApp wajib diisi');
            return;
        }
        if (!user) return;

        const finalTier: TierType = status === 'konsumen' ? 'satuan' : tier;

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .update({
                    name: name.trim(),
                    phone: phone.trim(),
                    address: address.trim() || null,
                    tier: finalTier,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', customer.id)
                .select()
                .single();

            if (error) throw error;
            toast.success('Data pelanggan berhasil diperbarui');
            onSaved(data);
        } catch (err: any) {
            toast.error('Gagal memperbarui: ' + (err.message || 'Terjadi kesalahan'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="px-4 pt-4 pb-3 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 active:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Ubah Detail Pelanggan</h1>
                </div>
            </header>

            <main className="flex-1 space-y-6 py-6 px-4 pb-6">
                {/* Name, Phone, Address */}
                <section className="space-y-3">
                    {/* Nama */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nama Pelanggan</label>
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                className="flex-1 text-sm font-bold text-slate-900 placeholder-slate-300 border-0 border-b border-slate-200 focus:border-emerald-600 focus:ring-0 py-1 bg-transparent outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">No. WhatsApp</label>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="08..."
                                type="tel"
                                className="flex-1 text-sm font-bold text-slate-900 placeholder-slate-300 border-0 border-b border-slate-200 focus:border-emerald-600 focus:ring-0 py-1 bg-transparent outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3.5 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <textarea
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Nama jalan, nomor rumah, kota..."
                                rows={2}
                                className="flex-1 text-sm font-bold text-slate-900 placeholder-slate-300 border-0 border-b border-slate-200 focus:border-emerald-600 focus:ring-0 py-1 bg-transparent outline-none resize-none transition-colors leading-relaxed"
                            />
                        </div>
                    </div>
                </section>

                {/* Status Pelanggan */}
                <section>
                    <h2 className="text-sm font-extrabold text-slate-800 mb-2.5 flex items-center gap-1.5">
                        <span className="text-slate-400">🪪</span>
                        Status Pelanggan
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setStatus('konsumen')}
                            className={cn(
                                'flex flex-col items-center justify-center py-4 rounded-xl border h-[72px] relative transition-all active:scale-[0.98]',
                                status === 'konsumen'
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            )}
                        >
                            {status === 'konsumen' && (
                                <div className="absolute top-1.5 right-1.5 bg-white text-emerald-600 rounded-full w-4 h-4 flex items-center justify-center">
                                    <span className="text-[10px] font-black">✓</span>
                                </div>
                            )}
                            <User className="h-5 w-5 mb-1" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Konsumen</span>
                        </button>
                        <button
                            onClick={() => { setStatus('mitra'); if (!isMitraTier(tier)) setTier('reseller'); }}
                            className={cn(
                                'flex flex-col items-center justify-center py-4 rounded-xl border h-[72px] relative transition-all active:scale-[0.98]',
                                status === 'mitra'
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            )}
                        >
                            {status === 'mitra' && (
                                <div className="absolute top-1.5 right-1.5 bg-white text-emerald-600 rounded-full w-4 h-4 flex items-center justify-center">
                                    <span className="text-[10px] font-black">✓</span>
                                </div>
                            )}
                            <Store className="h-5 w-5 mb-1" />
                            <span className="text-[11px] font-black uppercase tracking-wider">Mitra</span>
                        </button>
                    </div>
                </section>

                {/* Level Mitra (only if mitra) */}
                {status === 'mitra' && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-sm font-extrabold text-slate-800 mb-2.5 flex items-center gap-1.5">
                            <span className="text-amber-400">⭐</span>
                            Level Mitra
                        </h2>
                        <div className="space-y-2.5">
                            {MITRA_TIERS.map(t => {
                                const isActive = tier === t.tier;
                                return (
                                    <button
                                        key={t.tier}
                                        onClick={() => setTier(t.tier)}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98] border',
                                            isActive
                                                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                                                isActive ? 'bg-white text-emerald-600 shadow-sm' : 'bg-slate-100 text-slate-400'
                                            )}>
                                                {t.icon}
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-bold text-slate-900 text-sm leading-tight">{t.label}</h3>
                                                {isActive
                                                    ? <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Level Saat Ini</p>
                                                    : <p className="text-[10px] text-slate-500 font-medium mt-0.5">{t.desc}</p>
                                                }
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'w-5 h-5 rounded-full border flex items-center justify-center',
                                            isActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                                        )}>
                                            {isActive && <span className="text-[10px] font-black">✓</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            {/* Save button */}
            <div className="sticky bottom-[5.5rem] mt-auto max-w-md mx-auto p-4 bg-white/95 backdrop-blur-sm border-t border-slate-100 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-slate-300"
                >
                    {saving ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-base font-bold uppercase">Menyimpan...</span></>
                    ) : (
                        <><Save className="h-5 w-5" /><span className="text-base font-bold uppercase">Simpan Perubahan</span></>
                    )}
                </button>
            </div>
        </div>
    );
}
