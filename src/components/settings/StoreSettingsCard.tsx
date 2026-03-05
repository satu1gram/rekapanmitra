import { useState, useEffect } from 'react';
import { useStoreSettings, PaymentInfo } from '@/hooks/useStoreSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Link2, Copy, Check, Loader2, Plus, Trash2, ToggleLeft, ToggleRight,
    Store, CreditCard, Edit2, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PAYMENT_TYPES = [
    { value: 'bank', label: 'Transfer Bank' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'cod', label: 'COD / Tunai' },
] as const;

export function StoreSettingsCard() {
    const { settings, loading, saveSettings, toggleActive, getStoreUrl } = useStoreSettings();

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    // Form state
    const [slug, setSlug] = useState('');
    const [storeName, setStoreName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);

    // Populate form when settings load
    useEffect(() => {
        if (settings) {
            setSlug(settings.slug);
            setStoreName(settings.store_name);
            setIsActive(settings.is_active);
            setWelcomeMessage(settings.welcome_message || '');
            setPaymentInfo(settings.payment_info || []);
        }
    }, [settings]);

    const handleCopyLink = async () => {
        const url = getStoreUrl();
        if (!url) return;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link toko disalin!');
    };

    const handleToggleActive = async () => {
        if (!settings) return;
        try {
            await toggleActive(!settings.is_active);
            toast.success(settings.is_active ? 'Link toko dinonaktifkan' : 'Link toko diaktifkan!');
        } catch {
            toast.error('Gagal mengubah status toko');
        }
    };

    const handleSave = async () => {
        if (!slug.trim()) { toast.error('Slug toko wajib diisi'); return; }
        if (!storeName.trim()) { toast.error('Nama toko wajib diisi'); return; }

        // Validate slug format
        const slugClean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slugClean) { toast.error('Slug tidak valid'); return; }

        setSaving(true);
        try {
            await saveSettings({
                slug: slugClean,
                store_name: storeName.trim(),
                is_active: isActive,
                payment_info: paymentInfo,
                welcome_message: welcomeMessage.trim() || undefined,
            });
            toast.success('Pengaturan toko disimpan!');
            setSlug(slugClean);
            setIsEditing(false);
        } catch (err: any) {
            if (err?.message?.includes('duplicate') || err?.message?.includes('unique')) {
                toast.error('Slug sudah digunakan, coba yang lain');
            } else {
                toast.error('Gagal menyimpan: ' + err?.message);
            }
        } finally {
            setSaving(false);
        }
    };

    const addPayment = () => {
        setPaymentInfo(p => [...p, { type: 'bank', name: '', account_name: '', number: '' }]);
    };

    const updatePayment = (idx: number, field: keyof PaymentInfo, value: string) => {
        setPaymentInfo(p => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const removePayment = (idx: number) => {
        setPaymentInfo(p => p.filter((_, i) => i !== idx));
    };

    const storeUrl = getStoreUrl();

    if (loading) {
        return (
            <section className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#00C853]" />
            </section>
        );
    }

    return (
        <section className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-green-50 flex items-center justify-center">
                        <Store className="h-5 w-5 text-[#00C853]" />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold text-slate-800">Link Toko</h2>
                        <p className="text-xs text-slate-500 font-medium italic">Link pemesanan publik</p>
                    </div>
                </div>
                {/* Toggle active/inactive */}
                {settings && (
                    <button
                        onClick={handleToggleActive}
                        className="flex items-center gap-1.5 text-xs font-bold"
                    >
                        {settings.is_active
                            ? <ToggleRight className="h-6 w-6 text-[#00C853]" />
                            : <ToggleLeft className="h-6 w-6 text-slate-400" />}
                        <span className={settings.is_active ? 'text-[#00C853]' : 'text-slate-400'}>
                            {settings.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </button>
                )}
            </div>

            {/* No settings yet — prompt to create */}
            {!settings && !isEditing && (
                <div className="relative bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-7 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-white shadow-md rounded-full flex items-center justify-center mb-3 text-[#00C853]">
                        <Link2 className="h-7 w-7" />
                    </div>
                    <p className="text-slate-700 font-bold mb-1">Buat Link Toko</p>
                    <p className="text-xs text-slate-500 text-center max-w-[200px] mb-5 font-medium leading-snug">
                        Bagikan link ke pelanggan agar bisa langsung pesan ke Anda!
                    </p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-[#00C853] text-white w-full py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all uppercase tracking-wide"
                    >
                        Buat Link Sekarang
                    </button>
                </div>
            )}

            {/* Show existing link */}
            {settings && !isEditing && (
                <div className="space-y-3">
                    {/* Link preview */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Link Toko Anda</p>
                        <div className="flex items-center gap-2">
                            <p className="flex-1 text-xs font-semibold text-slate-700 truncate">{storeUrl}</p>
                            <button
                                onClick={handleCopyLink}
                                className={cn(
                                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                    copied ? 'bg-green-100 text-[#00C853]' : 'bg-white border border-slate-200 text-slate-500'
                                )}
                            >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <a
                                href={storeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 flex items-center justify-center"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Store name & payment summary */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Nama Toko</p>
                            <p className="text-sm font-extrabold text-slate-800 truncate">{settings.store_name}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Pembayaran</p>
                            <p className="text-sm font-extrabold text-slate-800">
                                {settings.payment_info.length === 0
                                    ? '—'
                                    : `${settings.payment_info.length} Metode`}
                            </p>
                        </div>
                    </div>

                    {/* Edit button */}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <Edit2 className="h-4 w-4" /> Ubah Pengaturan Toko
                    </button>
                </div>
            )}

            {/* Edit / Create form */}
            {isEditing && (
                <div className="space-y-4">
                    {/* Slug */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-slate-700">Slug Toko <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                                /toko/
                            </span>
                            <Input
                                className="pl-14 h-10 text-sm font-bold"
                                placeholder="nama-toko-anda"
                                value={slug}
                                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                                disabled={saving}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                            Contoh: toko-budi → link: <span className="font-bold text-slate-600">{window.location.origin}/toko/toko-budi</span>
                        </p>
                    </div>

                    {/* Store name */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-slate-700">Nama Toko <span className="text-red-500">*</span></Label>
                        <Input
                            className="h-10 text-sm"
                            placeholder="Toko Budi Mitra BP"
                            value={storeName}
                            onChange={e => setStoreName(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    {/* Welcome message */}
                    <div className="space-y-1.5">
                        <Label className="text-sm font-bold text-slate-700">Pesan Sambutan <span className="text-slate-400 font-medium">(opsional)</span></Label>
                        <textarea
                            className="w-full border border-input rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00C853]/30 bg-white"
                            placeholder="Selamat datang! Pesanmu langsung kami proses ya 😊"
                            rows={2}
                            value={welcomeMessage}
                            onChange={e => setWelcomeMessage(e.target.value)}
                            disabled={saving}
                        />
                    </div>

                    {/* Payment info */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-[#00C853]" /> Info Pembayaran
                            </Label>
                            <button
                                onClick={addPayment}
                                disabled={saving}
                                className="text-xs font-bold text-[#00C853] flex items-center gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" /> Tambah
                            </button>
                        </div>

                        {paymentInfo.length === 0 && (
                            <p className="text-xs text-slate-400 font-medium text-center py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Belum ada info pembayaran. Klik "Tambah" untuk menambahkan.
                            </p>
                        )}

                        {paymentInfo.map((p, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <select
                                        value={p.type}
                                        onChange={e => updatePayment(i, 'type', e.target.value)}
                                        disabled={saving}
                                        className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C853]/40"
                                    >
                                        {PAYMENT_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => removePayment(i)}
                                        disabled={saving}
                                        className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Nama bank / e-wallet (cth: BCA, GoPay)"
                                    value={p.name}
                                    onChange={e => updatePayment(i, 'name', e.target.value)}
                                    disabled={saving}
                                />
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Nama pemilik rekening"
                                    value={p.account_name}
                                    onChange={e => updatePayment(i, 'account_name', e.target.value)}
                                    disabled={saving}
                                />
                                <Input
                                    className="h-8 text-xs"
                                    placeholder="Nomor rekening / HP"
                                    value={p.number}
                                    onChange={e => updatePayment(i, 'number', e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={() => { setIsEditing(false); }}
                            disabled={saving}
                            className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 text-sm"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !slug.trim() || !storeName.trim()}
                            className="flex-1 py-3 bg-[#00C853] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            Simpan
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
