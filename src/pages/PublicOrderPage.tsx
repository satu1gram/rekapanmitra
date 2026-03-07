import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchPublicStore, submitPublicOrder, PaymentInfo } from '@/hooks/useStoreSettings';
import { formatCurrency } from '@/lib/formatters';
import { TierType } from '@/types';
import {
    Store, ArrowRight, ArrowLeft, Check, Loader2, Copy, CheckCheck,
    User, Phone, MapPin, ShoppingBag, CreditCard, AlertCircle, Package, Plus, Minus, Info, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ── Types ───────────────────────────────────────────────────────
interface ProductItem {
    id: string; // Current applied product tier ID
    name: string; // The category name
    default_sell_price: number; // Base unit price
    quantity: number;
    pricePerBottle: number;
    subtotal: number;
}

// ── Types ───────────────────────────────────────────────────────
interface ProductItem {
    id: string;
    name: string;
    default_sell_price: number;
    quantity: number;
    pricePerBottle: number;
    subtotal: number;
}

type Step = 'products' | 'info' | 'summary' | 'success';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
    bank: 'Transfer Bank',
    ewallet: 'E-Wallet',
    cod: 'COD / Tunai',
};

const PRODUCT_DETAILS: Record<string, { desc: string; benefits: string[] }> = {
    'STEFFI': {
        desc: 'Skincare premium untuk perawatan kulit harian, menjaga kelembapan dan mencerahkan secara natural.',
        benefits: ['Mencerahkan kulit', 'Menyamarkan noda hitam', 'BPOM Approved']
    },
    'BELGIE': {
        desc: 'Serum anti-aging mutakhir dari Eropa untuk merawat keremajaan kulit Anda.',
        benefits: ['Mengurangi kerutan halus', 'Kulit tampak lebih kenyal', 'Aman khusus kulit sensitif']
    },
    'BP': {
        desc: 'British Propolis asli berkualitas tinggi, suplemen andalan untuk daya tahan tubuh keluarga.',
        benefits: ['Meningkatkan imunitas', 'Membantu proses pemulihan', 'Kaya antioksidan']
    },
    'BRO': {
        desc: 'Rangkaian perawatan khusus pria agar wajah dan tubuh  bebas kusam serta tampil penuh percaya diri.',
        benefits: ['Menyegarkan kulit wajah', 'Wangi maskulin tahan lama', 'Mencegah jerawat']
    },
    'BRE': {
        desc: 'Solusi menyeluruh dari alam untuk perawatan rambut rontok dan merangsang pertumbuhan alami.',
        benefits: ['Menguatkan akar rambut', 'Merangsang folikel baru', 'Bahan alami & aman']
    },
    'NORWAY': {
        desc: 'Minyak Ikan Salmon Norwegia premium yang kaya asupan nutrisi untuk masa depan.',
        benefits: ['Nutrisi kecerdasan anak', 'Menjaga kesehatan jantung', 'Bebas kontaminasi merkuri']
    }
};

// ── Compact copy button ─────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] font-bold text-[#059669] bg-[#059669]/10 rounded-lg px-2 py-1 active:scale-95 transition-all">
            {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Tersalin' : 'Salin'}
        </button>
    );
}

// ── Main Component ──────────────────────────────────────────────
export default function PublicOrderPage() {
    const { slug } = useParams<{ slug: string }>();

    const [storeLoading, setStoreLoading] = useState(true);
    const [storeData, setStoreData] = useState<{
        store_name: string;
        is_active: boolean;
        payment_info: PaymentInfo[];
        welcome_message: string | null;
        user_id: string;
    } | null>(null);
    const [items, setItems] = useState<ProductItem[]>([]);
    const [productCategories, setProductCategories] = useState<Record<string, any[]>>({});
    const [storeNotFound, setStoreNotFound] = useState(false);

    // Step & form
    const [step, setStep] = useState<Step>('products');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Product detail modal
    const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);

    useEffect(() => {
        if (!slug) { setStoreNotFound(true); setStoreLoading(false); return; }
        (async () => {
            const { store, products: prods } = await fetchPublicStore(slug);
            if (!store || !store.is_active) {
                setStoreNotFound(true);
            } else {
                setStoreData(store);

                // Group by category
                const categories: Record<string, typeof prods> = {};
                for (const p of prods) {
                    if (!p.category) continue;
                    if (!categories[p.category]) categories[p.category] = [];
                    categories[p.category].push(p);
                }
                // Sort by package size descending
                for (const cat of Object.keys(categories)) {
                    categories[cat].sort((a, b) => b.quantity_per_package - a.quantity_per_package);
                }
                setProductCategories(categories);

                setItems(Object.keys(categories).map(cat => {
                    let defaultPricePerBottle = 250000;
                    const smallestTier = categories[cat][categories[cat].length - 1];
                    if (smallestTier && smallestTier.quantity_per_package > 0) {
                        defaultPricePerBottle = smallestTier.default_sell_price / smallestTier.quantity_per_package;
                    }
                    return {
                        id: smallestTier?.id || cat,
                        name: cat,
                        default_sell_price: defaultPricePerBottle,
                        quantity: 0,
                        pricePerBottle: defaultPricePerBottle,
                        subtotal: 0,
                    };
                }));
            }
            setStoreLoading(false);
        })();
    }, [slug]);

    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => s + i.subtotal, 0);
    const activeItems = items.filter(i => i.quantity > 0);

    const recalcItems = (newItems: ProductItem[]): ProductItem[] => {
        const newTotalQuantity = newItems.reduce((s, i) => s + i.quantity, 0);
        return newItems.map(item => {
            const tiers = productCategories[item.name] || [];
            let pricePerBottle = item.default_sell_price;
            let productId = item.id;

            let applicableTier = tiers[tiers.length - 1];
            for (const tier of tiers) {
                if (newTotalQuantity >= tier.quantity_per_package) {
                    applicableTier = tier;
                    break;
                }
            }
            if (applicableTier && applicableTier.quantity_per_package > 0) {
                pricePerBottle = applicableTier.default_sell_price / applicableTier.quantity_per_package;
                productId = applicableTier.id;
            }

            return { ...item, id: productId, pricePerBottle, subtotal: item.quantity * pricePerBottle };
        });
    };

    const changeQty = (categoryId: string, delta: number) => {
        setItems(prev => {
            const updated = prev.map(item =>
                item.name !== categoryId ? item : { ...item, quantity: Math.max(0, item.quantity + delta) }
            );
            return recalcItems(updated);
        });
    };

    const setQty = (categoryId: string, qty: number) => {
        setItems(prev => {
            const updated = prev.map(item =>
                item.name !== categoryId ? item : { ...item, quantity: Math.max(0, qty) }
            );
            return recalcItems(updated);
        });
    };

    const handleSubmit = async () => {
        if (!storeData) return;
        setSubmitting(true);
        try {
            const result = await submitPublicOrder({
                slug: slug!,
                userId: storeData.user_id,
                customerName,
                customerPhone,
                customerAddress,
                items: activeItems.map(i => ({
                    productId: i.id,
                    productName: i.name,
                    quantity: i.quantity,
                    pricePerBottle: i.pricePerBottle,
                    subtotal: i.subtotal,
                })),
                totalPrice,
            });
            if (result.success) setStep('success');
            else alert('Terjadi kesalahan: ' + result.error);
        } catch {
            alert('Terjadi kesalahan, silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── LOADING ───────────────────────────────────────────────
    if (storeLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#059669]" />
                <p className="text-sm font-semibold text-slate-500">Memuat toko...</p>
            </div>
        </div>
    );

    if (storeNotFound || !storeData) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-5">
            <div className="text-center max-w-xs">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-9 w-9 text-slate-400" />
                </div>
                <h1 className="text-xl font-black text-slate-800 mb-2">Toko Tidak Ditemukan</h1>
                <p className="text-sm text-slate-500 font-medium leading-snug">
                    Link toko ini tidak aktif atau tidak tersedia.
                </p>
            </div>
        </div>
    );

    // ─── SUCCESS ───────────────────────────────────────────────
    if (step === 'success') return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-5">
            <div className="text-center max-w-xs">
                <div className="w-24 h-24 bg-[#059669]/10 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-[#059669]/10">
                    <div className="w-16 h-16 bg-[#059669] rounded-full flex items-center justify-center shadow-xl shadow-green-500/30">
                        <Check className="h-8 w-8 text-white" strokeWidth={3} />
                    </div>
                </div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">Pesanan Terkirim!</h1>
                <p className="text-sm text-slate-600 font-medium leading-relaxed mb-6">
                    Terima kasih, <strong>{customerName}</strong>! Pesananmu sudah masuk ke <strong>{storeData.store_name}</strong>.
                </p>
                {storeData.payment_info.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left mb-4 space-y-3">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Segera Transfer</p>
                        <div className="bg-[#059669]/5 rounded-xl p-3 border border-[#059669]/20">
                            <p className="text-xl font-black text-[#009624]">{formatCurrency(totalPrice)}</p>
                        </div>
                        <div className="space-y-2">
                            {storeData.payment_info.map((p, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                        <CreditCard className="h-3.5 w-3.5 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{PAYMENT_TYPE_LABELS[p.type] || p.type}</p>
                                        <p className="text-sm font-extrabold text-slate-800">{p.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs font-bold text-slate-600">{p.number}</p>
                                            <CopyButton text={p.number} />
                                        </div>
                                        <p className="text-xs text-slate-400">a/n {p.account_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <p className="text-xs text-slate-500 leading-relaxed">
                    Pesanan akan dikonfirmasi setelah penjual verifikasi pembayaranmu.
                </p>
            </div>
        </div>
    );



    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50/50 to-white">
            {/* Store Header */}
            <header className="bg-white border-b border-slate-100 px-4 py-3.5 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    <div className="w-9 h-9 bg-[#059669]/10 rounded-xl flex items-center justify-center">
                        <Store className="h-4.5 w-4.5 text-[#059669]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-extrabold text-slate-800 truncate">{storeData.store_name}</h1>
                        {storeData.welcome_message && (
                            <p className="text-xs text-slate-500 font-medium truncate">{storeData.welcome_message}</p>
                        )}
                    </div>
                    {totalQty > 0 && step !== 'summary' && (
                        <div className="shrink-0 bg-[#059669] text-white rounded-full px-2.5 py-1 text-xs font-black flex items-center gap-1">
                            <ShoppingBag className="h-3.5 w-3.5" /> {totalQty}
                        </div>
                    )}
                </div>
            </header>

            {/* Step Progress */}
            <div className="bg-white border-b border-slate-100 px-4 py-2.5">
                <div className="max-w-lg mx-auto">
                    <div className="flex items-center gap-1.5">
                        {(['products', 'info', 'summary'] as Step[]).map((s, idx) => {
                            const stepIdx = ['products', 'info', 'summary'].indexOf(step);
                            const isDone = stepIdx > idx;
                            const isActive = step === s;
                            return (
                                <div key={s} className="flex items-center flex-1">
                                    <div className={cn('h-1.5 flex-1 rounded-full transition-all duration-300', isDone || isActive ? 'bg-[#059669]' : 'bg-slate-100')} />
                                    {idx < 2 && <div className={cn('w-1.5 h-1.5 rounded-full mx-1', isDone ? 'bg-[#059669]' : 'bg-slate-200')} />}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        {['Pilih Produk', 'Data Diri', 'Konfirmasi'].map((label, idx) => {
                            const stepIdx = ['products', 'info', 'summary'].indexOf(step);
                            return (
                                <span key={label} className={cn('text-[10px] font-bold uppercase tracking-wide', stepIdx === idx ? 'text-[#059669]' : stepIdx > idx ? 'text-slate-400' : 'text-slate-300')}>
                                    {label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="px-4 py-4 max-w-lg mx-auto space-y-3">

                {/* ── STEP: PRODUCTS ──────────────────────────────── */}
                {step === 'products' && (
                    <div className="space-y-3">


                        {/* Product list */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-[#059669]" />
                                <h2 className="font-extrabold text-slate-800">Pilih Produk</h2>
                            </div>
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                    <p className="font-medium text-sm">Belum ada produk tersedia</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div key={item.id} className={cn(
                                            'rounded-2xl p-3 border transition-all',
                                            item.quantity > 0 ? 'border-[#059669]/30 bg-green-50/50' : 'border-slate-100 bg-slate-50'
                                        )}>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs font-semibold text-[#009624]">
                                                            {formatCurrency(item.quantity > 0 ? item.pricePerBottle : item.default_sell_price)}/btl
                                                        </p>
                                                        <button
                                                            onClick={() => setDetailProduct(item)}
                                                            className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"
                                                        >
                                                            <Info className="h-3 w-3 text-slate-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {item.quantity > 0 && (
                                                        <button onClick={() => changeQty(item.name, -1)}
                                                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                                                            <Minus className="h-3.5 w-3.5 text-slate-600" />
                                                        </button>
                                                    )}
                                                    {item.quantity > 0 && (
                                                        <span className="w-6 text-center font-extrabold text-slate-800 text-sm">{item.quantity}</span>
                                                    )}
                                                    <button onClick={() => changeQty(item.name, 1)}
                                                        className={cn(
                                                            'w-8 h-8 rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all',
                                                            item.quantity > 0
                                                                ? 'bg-[#059669] border border-[#059669] text-white'
                                                                : 'bg-white border border-slate-200 text-slate-600'
                                                        )}>
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            {item.quantity > 0 && (
                                                <div className="mt-2 pt-2 border-t border-[#059669]/20 flex justify-between items-center">
                                                    <span className="text-xs text-slate-500 font-medium">{item.quantity} × {formatCurrency(item.pricePerBottle)}</span>
                                                    <span className="text-xs font-extrabold text-[#009624]">{formatCurrency(item.subtotal)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart bar */}
                        {totalQty > 0 && (
                            <div className="bg-[#1A1F2C] rounded-2xl p-4 flex items-center gap-3 shadow-xl">
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-400">{totalQty} botol</p>
                                    <p className="text-lg font-black text-white">{formatCurrency(totalPrice)}</p>
                                </div>
                                <button onClick={() => setStep('info')}
                                    className="bg-[#059669] text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-green-500/40 active:scale-95 transition-all">
                                    Lanjut <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── STEP: INFO ──────────────────────────────────── */}
                {step === 'info' && (
                    <div className="space-y-3">
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-5 w-5 text-[#059669]" />
                                <h2 className="font-extrabold text-slate-800">Data Diri</h2>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" /> Nama Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <Input className="h-11 text-sm" placeholder="Masukkan nama lengkap"
                                    value={customerName} onChange={e => setCustomerName(e.target.value)} autoComplete="name" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" /> No. HP / WhatsApp <span className="text-red-500">*</span>
                                </Label>
                                <Input className="h-11 text-sm" placeholder="Contoh: 08123456789" type="tel"
                                    value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} autoComplete="tel" />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> Alamat Lengkap <span className="text-red-500">*</span>
                                </Label>
                                <textarea
                                    className="w-full border border-input rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#059669]/30 bg-white"
                                    placeholder="Nama jalan, no. rumah, kecamatan, kota..."
                                    rows={3} value={customerAddress}
                                    onChange={e => setCustomerAddress(e.target.value)} autoComplete="street-address" />
                            </div>

                            <button onClick={() => setStep('summary')}
                                disabled={!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()}
                                className="w-full py-3.5 bg-[#059669] text-white rounded-2xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                                Lanjut <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <button onClick={() => setStep('products')}
                            className="w-full py-3 border-2 border-slate-200 rounded-2xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Ubah Produk
                        </button>
                    </div>
                )}

                {/* ── STEP: SUMMARY ───────────────────────────────── */}
                {step === 'summary' && (
                    <div className="space-y-3">
                        {/* Order detail */}
                        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                            <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-[#059669]" /> Ringkasan Pesanan
                            </h2>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Pemesan</p>
                                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400 shrink-0" /><p className="text-sm font-bold text-slate-800">{customerName}</p></div>
                                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" /><p className="text-sm font-semibold text-slate-700">{customerPhone}</p></div>
                                <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" /><p className="text-sm font-semibold text-slate-700 leading-snug">{customerAddress}</p></div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk Dipesan</p>
                                {activeItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.quantity} botol × {formatCurrency(item.pricePerBottle)}</p>
                                        </div>
                                        <p className="text-sm font-extrabold text-slate-800">{formatCurrency(item.subtotal)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-[#059669]/5 rounded-2xl p-4 border border-[#059669]/20">
                                <div className="flex items-center justify-between">
                                    <p className="font-extrabold text-slate-700">Total Bayar</p>
                                    <p className="text-xl font-black text-[#009624]">{formatCurrency(totalPrice)}</p>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{totalQty} botol</p>
                            </div>
                        </div>

                        {/* Payment info with copy */}
                        {storeData.payment_info.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                                <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-[#059669]" /> Cara Pembayaran
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Transfer ke salah satu rekening berikut setelah order dikonfirmasi.</p>
                                <div className="space-y-2">
                                    {storeData.payment_info.map((p, i) => (
                                        <div key={i} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 flex items-start gap-3">
                                            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                                                <CreditCard className="h-4 w-4 text-[#059669]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{PAYMENT_TYPE_LABELS[p.type] || p.type}</p>
                                                <p className="font-extrabold text-slate-800 text-sm">{p.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-sm font-bold text-[#009624] tracking-wider">{p.number}</p>
                                                    <CopyButton text={p.number} />
                                                </div>
                                                <p className="text-xs text-slate-400">a/n {p.account_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={handleSubmit} disabled={submitting || activeItems.length === 0}
                            className="w-full py-4 bg-[#059669] text-white rounded-2xl font-black text-base disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xl shadow-green-500/30 active:scale-95 transition-all">
                            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Mengirim...</> : <><Check className="h-5 w-5" /> Kirim Pesanan</>}
                        </button>

                        <button onClick={() => setStep('info')} disabled={submitting}
                            className="w-full py-3 border-2 border-slate-200 rounded-2xl text-slate-600 font-bold text-sm flex items-center justify-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Ubah Data Diri
                        </button>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 px-5">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Powered by Rekapan Mitra</p>
            </footer>

            {/* Product Detail Modal */}
            {detailProduct && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-4"
                    onClick={() => setDetailProduct(null)}>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="h-32 bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center relative">
                            <Package className="h-14 w-14 text-[#059669]/30" />
                            <button onClick={() => setDetailProduct(null)}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                                <X className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-1">{detailProduct.name}</h3>
                                {PRODUCT_DETAILS[detailProduct.name] && (
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {PRODUCT_DETAILS[detailProduct.name].desc}
                                    </p>
                                )}
                            </div>

                            {PRODUCT_DETAILS[detailProduct.name] && (
                                <div className="bg-green-50/50 rounded-xl p-3 border border-green-100">
                                    <p className="text-[10px] font-black text-[#059669] uppercase tracking-widest mb-2">Manfaat Utama</p>
                                    <ul className="space-y-1.5">
                                        {PRODUCT_DETAILS[detailProduct.name].benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                                                <Check className="h-4 w-4 text-[#009624] shrink-0" />
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Berdasarkan Jumlah Total</p>
                                {(productCategories[detailProduct.name] || []).map((b: any) => {
                                    const price = b.default_sell_price / b.quantity_per_package;
                                    const isCurrentTier = b.id === detailProduct.id || (detailProduct.quantity === 0 && b === productCategories[detailProduct.name][productCategories[detailProduct.name].length - 1]);
                                    return (
                                        <div key={b.id} className={cn(
                                            'flex items-center justify-between px-3 py-2 rounded-xl border',
                                            isCurrentTier ? 'bg-[#059669]/5 border-[#059669]/30' : 'bg-slate-50 border-slate-100'
                                        )}>
                                            <div>
                                                <span className="text-sm font-bold text-slate-700">{b.quantity_per_package === 1 ? 'Satuan' : `Paket ${b.quantity_per_package} btl`}</span>
                                                {b.quantity_per_package > 1 && <span className="text-xs text-slate-400 ml-1">(min. {b.quantity_per_package} btl)</span>}
                                            </div>
                                            <div className="text-right">
                                                <span className={cn('text-sm font-extrabold', isCurrentTier ? 'text-[#009624]' : 'text-slate-600')}>{formatCurrency(price)}/btl</span>
                                                {b.quantity_per_package > 1 && <p className="text-[10px] text-slate-400">={formatCurrency(b.default_sell_price)} total</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                {detailProduct.quantity > 0 && (
                                    <button onClick={() => { changeQty(detailProduct.name, -1); setDetailProduct(prev => prev ? { ...prev, quantity: Math.max(0, prev.quantity - 1) } : null); }}
                                        className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center active:scale-95 transition-all">
                                        <Minus className="h-5 w-5 text-slate-600" />
                                    </button>
                                )}
                                {detailProduct.quantity > 0 && (
                                    <span className="text-xl font-black text-slate-800 w-10 text-center">{detailProduct.quantity}</span>
                                )}
                                <button onClick={() => { changeQty(detailProduct.name, 1); setDetailProduct(prev => prev ? { ...prev, quantity: (prev.quantity || 0) + 1 } : null); }}
                                    className="flex-1 h-12 rounded-xl bg-[#059669] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-green-500/30 active:scale-95">
                                    <Plus className="h-5 w-5" /> Tambah
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
