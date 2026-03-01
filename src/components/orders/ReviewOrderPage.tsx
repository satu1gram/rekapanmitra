import { Loader2, ArrowLeft, Pencil } from 'lucide-react';
import { TierType, TIER_PRICING, OrderItem } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ReviewOrderPageProps {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    tier: TierType;
    items: OrderItem[];
    orderDate: string;
    hasCustomPrice: boolean;
    submitting: boolean;
    onBack: () => void;
    onConfirm: () => void;
}

const TIER_LABEL: Record<TierType, string> = {
    satuan: 'Satuan',
    reseller: 'Reseller',
    agen: 'Agen',
    agen_plus: 'Agen Plus',
    sap: 'Spesial Agen Plus',
    se: 'Special Entrepreneur',
};

// Full retail price (price if buying 1 item, satuan)
const RETAIL_PRICE = 250000;

const formatDateID = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function ReviewOrderPage({
    customerName,
    customerPhone,
    customerAddress,
    tier,
    items,
    orderDate,
    hasCustomPrice,
    submitting,
    onBack,
    onConfirm,
}: ReviewOrderPageProps) {
    const activeItems = items.filter(i => i.quantity > 0);
    const totalPrice = activeItems.reduce((s, i) => s + i.subtotal, 0);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="px-4 pt-4 pb-3 bg-card z-10 sticky top-0 shadow-sm border-b border-border">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 active:bg-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">Tinjau Order</h1>
                        <p className="text-[10px] text-slate-400 font-medium">Rekapan Mitra</p>
                    </div>
                </div>
            </header>

            {/* pb-36 so content is never hidden behind fixed footer + navbar */}
            <main className="flex-1 px-4 py-4 space-y-3 pb-40">
                {/* Customer + date */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                        <div className="p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pelanggan</p>
                            <p className="text-sm font-bold text-slate-900 leading-snug truncate">{customerName}</p>
                            <p className="text-[11px] text-slate-500">{TIER_LABEL[tier]}</p>
                        </div>
                        <div className="p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                            <p className="text-sm font-bold text-slate-900">{formatDateID(orderDate)}</p>
                            {customerAddress && <p className="text-[11px] text-slate-500 truncate">{customerAddress}</p>}
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Produk Dipesan</h2>
                    </div>
                    {activeItems.map((item, idx) => {
                        // Show original retail price crossed out if the customer gets a
                        // lower price (paket/custom discount)
                        const showStrikethrough = item.pricePerBottle < RETAIL_PRICE;
                        return (
                            <div key={idx} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-b-0">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{item.productName}</p>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                                        <span>{item.quantity}x</span>
                                        <span className={cn("font-semibold", hasCustomPrice ? "text-amber-600" : "text-emerald-600")}>
                                            {formatCurrency(item.pricePerBottle)}
                                        </span>
                                        {hasCustomPrice && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">Custom</span>
                                        )}
                                    </p>
                                </div>
                                <div className="ml-3 shrink-0 text-right">
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
                                    {showStrikethrough && (
                                        <p className="text-[11px] text-slate-400 line-through">
                                            {formatCurrency(RETAIL_PRICE * item.quantity)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Edit produk link */}
                    <button
                        onClick={onBack}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-emerald-600 text-xs font-bold border-t border-slate-100 hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Produk
                    </button>
                </div>

                {/* Total summary */}
                <div className="bg-slate-800 text-white rounded-xl p-3 shadow-lg overflow-hidden">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">Total Pembayaran</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black">{formatCurrency(totalPrice)}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {activeItems.reduce((s, i) => s + i.quantity, 0)} pcs · {TIER_LABEL[tier]}
                    </p>
                </div>
            </main>

            {/* Confirm button — bottom-16 to clear the navbar + some breathing room */}
            <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 pb-3 pt-2 bg-card/95 backdrop-blur-sm border-t border-border z-20">
                <button
                    onClick={onConfirm}
                    disabled={submitting}
                    className={cn(
                        "w-full h-14 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-white font-black text-lg tracking-tight",
                        submitting
                            ? "bg-muted text-muted-foreground"
                            : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    )}
                >
                    {submitting ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Menyimpan...</>
                    ) : (
                        <>SIMPAN ORDER SEKARANG <span className="text-xl">✓</span></>
                    )}
                </button>
                <button
                    onClick={onBack}
                    className="w-full text-center text-sm text-slate-500 font-medium mt-2"
                >
                    Kembali, ubah order
                </button>
            </div>
        </div>
    );
}
