import { MITRA_LEVELS, MitraLevel } from '@/types';
import { OnboardingProductData } from '@/hooks/useOnboarding';
import { Trash2, Plus, ChevronRight, Tag, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProductsStepProps {
    mitraLevel: MitraLevel;
    products: OnboardingProductData[];
    onChange: (products: OnboardingProductData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

function formatRp(value: number): string {
    return 'Rp ' + value.toLocaleString('id-ID');
}

export function ProductsStep({ mitraLevel, products, onChange, onNext, onBack }: ProductsStepProps) {
    const buyPrice = MITRA_LEVELS[mitraLevel].buyPricePerBottle;
    const mitraLabel = MITRA_LEVELS[mitraLevel].label;
    const hasAtLeastOne = products.some(p => p.include && p.name.trim());

    const updateProduct = (index: number, field: keyof OnboardingProductData, value: string | number | boolean) => {
        onChange(products.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const removeProduct = (index: number) => {
        onChange(products.filter((_, i) => i !== index));
    };

    const addCustomProduct = () => {
        onChange([...products, { name: '', defaultSellPrice: 0, include: true }]);
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-extrabold text-slate-800">Produk & Harga Jual</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    Sesuaikan nama dan harga jual produk Anda.
                </p>
            </div>

            {/* Info harga modal */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#059669]/10 flex items-center justify-center shrink-0">
                    <Tag className="h-4.5 w-4.5 text-[#059669]" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Harga Modal Anda ({mitraLabel})</p>
                    <p className="text-base font-extrabold text-[#059669]">{formatRp(buyPrice)}<span className="text-xs font-semibold text-slate-500">/botol</span></p>
                </div>
            </div>

            {/* Daftar produk */}
            <div className="space-y-2.5">
                {products.map((product, index) => {
                    // Try to infer bottles count from product name for margin display
                    const margin = product.defaultSellPrice - buyPrice;
                    const showMargin = product.defaultSellPrice > 0;

                    return (
                        <div
                            key={index}
                            className={cn(
                                'rounded-2xl border p-3.5 space-y-2.5 transition-all',
                                product.include ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-50'
                            )}
                        >
                            {/* Header row */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={product.include}
                                    onChange={e => updateProduct(index, 'include', e.target.checked)}
                                    className="w-4 h-4 accent-[#059669] rounded cursor-pointer"
                                />
                                <input
                                    className="flex-1 text-sm font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-400"
                                    placeholder="Nama produk"
                                    value={product.name}
                                    onChange={e => updateProduct(index, 'name', e.target.value)}
                                    disabled={!product.include}
                                />
                                <button
                                    onClick={() => removeProduct(index)}
                                    className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center shrink-0"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Harga jual */}
                            <div className="flex items-center gap-2 pl-6">
                                <span className="text-xs text-slate-500 font-semibold shrink-0">Harga Jual:</span>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                                    <Input
                                        className="pl-9 h-9 text-sm font-bold"
                                        type="number"
                                        value={product.defaultSellPrice || ''}
                                        onChange={e => updateProduct(index, 'defaultSellPrice', Number(e.target.value))}
                                        disabled={!product.include}
                                    />
                                </div>
                            </div>

                            {/* Margin info */}
                            {showMargin && product.include && (
                                <div className="flex items-center gap-1.5 pl-6">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-600">
                                        Estimasi margin: {margin > 0 ? formatRp(margin) : '-'}/botol
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tambah custom */}
            <button
                onClick={addCustomProduct}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold text-sm flex items-center justify-center gap-2"
            >
                <Plus className="h-4 w-4" /> Tambah Produk Custom
            </button>

            {/* Navigasi */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={onBack}
                    className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-600 text-sm"
                >
                    Kembali
                </button>
                <button
                    onClick={onNext}
                    disabled={!hasAtLeastOne}
                    className="flex-[2] py-3.5 bg-[#059669] text-white rounded-2xl font-extrabold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                    Lanjut <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
