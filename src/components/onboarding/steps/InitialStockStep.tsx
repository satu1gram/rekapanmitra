import { MITRA_LEVELS, MitraLevel } from '@/types';
import { Package, ChevronRight, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DS = {
    primary: '#059669',
    navy: '#1E293B',
    gray: '#64748B',
};

interface InitialStockStepProps {
    mitraLevel: MitraLevel;
    customBuyPrice?: number;
    initialStock: number;
    onChange: (qty: number) => void;
    onNext: () => void;
    onBack: () => void;
}

function formatRp(value: number): string {
    return 'Rp ' + value.toLocaleString('id-ID');
}

export function InitialStockStep({ mitraLevel, customBuyPrice, initialStock, onChange, onNext, onBack }: InitialStockStepProps) {
    const buyPrice = mitraLevel === 'custom'
        ? (customBuyPrice ?? 0)
        : MITRA_LEVELS[mitraLevel].buyPricePerBottle;
    const totalValue = initialStock * buyPrice;

    const adjust = (delta: number) => {
        onChange(Math.max(0, initialStock + delta));
    };

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-xl font-extrabold" style={{ color: DS.navy }}>Stok Awal Anda</h2>
                <p className="text-sm font-medium mt-1" style={{ color: DS.gray }}>
                    Berapa botol stok yang Anda punya sekarang? Hitung semua yang ada di tangan, belum terjual.
                </p>
            </div>

            {/* Stepper card */}
            <div className="rounded-3xl p-6 flex flex-col items-center gap-5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center">
                    <Package className="h-8 w-8" style={{ color: DS.primary }} strokeWidth={1.5} />
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-3 w-full justify-center">
                    <button
                        onClick={() => adjust(-10)}
                        className="w-11 h-11 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-black active:scale-95 transition-all"
                        style={{ color: DS.navy }}
                    >
                        <span className="text-xs font-black">-10</span>
                    </button>
                    <button
                        onClick={() => adjust(-1)}
                        className="w-11 h-11 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center active:scale-95 transition-all"
                    >
                        <Minus className="h-4 w-4" style={{ color: DS.navy }} />
                    </button>

                    <Input
                        className="w-24 h-14 text-center text-2xl font-black rounded-2xl border-2"
                        style={{ borderColor: DS.primary }}
                        type="number"
                        min={0}
                        value={initialStock}
                        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                    />

                    <button
                        onClick={() => adjust(1)}
                        className="w-11 h-11 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" style={{ color: DS.navy }} />
                    </button>
                    <button
                        onClick={() => adjust(10)}
                        className="w-11 h-11 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center font-black active:scale-95 transition-all"
                        style={{ color: DS.navy }}
                    >
                        <span className="text-xs font-black">+10</span>
                    </button>
                </div>

                <p className="text-sm font-semibold" style={{ color: DS.gray }}>botol</p>
            </div>

            {/* Info nilai stok */}
            {initialStock > 0 ? (
                <div className="rounded-2xl p-4 text-center space-y-0.5" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <p className="text-xs font-bold" style={{ color: DS.gray }}>Total Nilai Stok Anda</p>
                    <p className="text-xl font-extrabold" style={{ color: DS.primary }}>{formatRp(totalValue)}</p>
                    <p className="text-[11px] font-medium" style={{ color: DS.gray }}>
                        {initialStock} botol × {formatRp(buyPrice)}/botol (harga modal level Anda)
                    </p>
                </div>
            ) : (
                <p className="text-center text-xs font-medium rounded-2xl py-3 px-4" style={{ color: DS.gray, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    Stok 0 tidak apa-apa — Anda bisa isi stok nanti di menu <strong style={{ color: DS.navy }}>Produk → Stok</strong>
                </p>
            )}

            {/* Navigasi */}
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
