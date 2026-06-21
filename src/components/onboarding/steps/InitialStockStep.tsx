import { useState } from 'react';
import { MITRA_LEVELS, MitraLevel } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { Package, ChevronRight, Minus, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const DS = {
    primary: '#059669',
    navy: '#1E293B',
    gray: '#64748B',
};

interface InitialStockStepProps {
    mitraLevel: MitraLevel;
    customBuyPrice?: number;
    initialStockProducts: Record<string, number>;
    onChange: (products: Record<string, number>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function InitialStockStep({
    mitraLevel, customBuyPrice,
    initialStockProducts, onChange,
    onNext, onBack
}: InitialStockStepProps) {
    const { products: availableProducts, loading: productsLoading } = useProducts();
    const buyPrice = mitraLevel === 'custom'
        ? (customBuyPrice ?? 0)
        : MITRA_LEVELS[mitraLevel].buyPricePerBottle;

    const totalQty = Object.values(initialStockProducts).reduce((s, q) => s + q, 0);
    const totalValue = totalQty * buyPrice;

    const adjustProduct = (productId: string, delta: number) => {
        const current = initialStockProducts[productId] || 0;
        onChange({
            ...initialStockProducts,
            [productId]: Math.max(0, current + delta),
        });
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-xl font-extrabold" style={{ color: DS.navy }}>Stok Awal Anda</h2>
                <p className="text-sm font-medium mt-1" style={{ color: DS.gray }}>
                    Hitung stok masing-masing produk yang Anda punya sekarang.
                </p>
            </div>

            {/* Product list */}
            <div className="rounded-3xl p-4 space-y-2.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {productsLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin" style={{ color: DS.primary }} />
                    </div>
                ) : availableProducts.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-sm font-semibold" style={{ color: DS.gray }}>Belum ada produk aktif.</p>
                        <p className="text-xs mt-1" style={{ color: DS.gray }}>Abi stok dulu nanti setelah setup.</p>
                    </div>
                ) : (
                    availableProducts.reduce<{category: string; name: string}[]>((acc, p) => {
                        if (!acc.find(a => a.category === p.category)) {
                            acc.push({ category: p.category, name: p.category });
                        }
                        return acc;
                    }, []).map((cat) => {
                        const qty = initialStockProducts[cat.category] || 0;
                        return (
                            <div key={cat.category} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-sm border" style={{ borderColor: '#E2E8F0' }}>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold" style={{ color: DS.navy }}>{cat.name}</p>
                                    <p className="text-[10px] font-medium uppercase" style={{ color: DS.gray }}>{cat.category}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => adjustProduct(cat.category, -1)}
                                        disabled={qty <= 0}
                                        className="w-8 h-8 rounded-xl bg-white border-2 flex items-center justify-center active:scale-95 transition-all disabled:opacity-30"
                                        style={{ borderColor: '#E2E8F0' }}
                                    >
                                        <Minus className="h-3.5 w-3.5" style={{ color: DS.navy }} />
                                    </button>
                                    <span className="w-8 text-center text-base font-black tabular-nums" style={{ color: DS.navy }}>{qty}</span>
                                    <button
                                        onClick={() => adjustProduct(cat.category, 1)}
                                        className="w-8 h-8 rounded-xl bg-white border-2 flex items-center justify-center active:scale-95 transition-all"
                                        style={{ borderColor: '#E2E8F0' }}
                                    >
                                        <Plus className="h-3.5 w-3.5" style={{ color: DS.primary }} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Total summary */}
            {totalQty > 0 ? (
                <div className="rounded-2xl p-4 text-center space-y-0.5" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <p className="text-xs font-bold" style={{ color: DS.gray }}>Total Stok</p>
                    <p className="text-2xl font-extrabold" style={{ color: DS.primary }}>{totalQty} botol</p>
                    <p className="text-[11px] font-medium" style={{ color: DS.gray }}>
                        {formatCurrency(totalValue)} — {formatCurrency(buyPrice)}/botol
                    </p>
                </div>
            ) : (
                <p className="text-center text-xs font-medium rounded-2xl py-3 px-4"
                    style={{ color: DS.gray, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    Biarkan kosong jika belum punya stok — bisa diisi nanti di menu <strong style={{ color: DS.navy }}>Stok</strong>
                </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={onBack}
                    className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-sm"
                    style={{ color: DS.navy }}
                >
                    Kembali
                </button>
                <button
                    onClick={onNext}
                    className="flex-[2] py-3.5 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: DS.primary, boxShadow: '0 4px 15px rgba(5,150,105,0.25)' }}
                >
                    Lanjut <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
