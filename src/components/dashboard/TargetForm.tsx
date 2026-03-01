import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, ShoppingBag, Box, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type FieldId = 'profit' | 'qty' | 'stock';

interface TargetFormProps {
    year: number;
    month: number; // 0-indexed
    previousTarget?: { targetProfit: number; targetQty: number; targetStock: number } | null;
    onSave: (data: { targetProfit: number; targetQty: number; targetStock: number }) => void;
    onBack: () => void;
}

export function TargetForm({ year, month, previousTarget, onSave, onBack }: TargetFormProps) {
    const [rawValues, setRawValues] = useState<Record<FieldId, string>>({
        profit: '',
        qty: '',
        stock: '',
    });

    const parseRaw = (raw: string) => {
        const n = parseInt(raw.replace(/\D/g, ''), 10);
        return isNaN(n) ? 0 : n;
    };

    const handleInputChange = (field: FieldId, value: string) => {
        // Allow only numeric input
        const numericValue = value.replace(/\D/g, '');
        setRawValues(prev => ({ ...prev, [field]: numericValue }));
    };

    const profit = parseRaw(rawValues.profit);
    const qty = parseRaw(rawValues.qty);
    const stock = parseRaw(rawValues.stock);

    const canSave = profit > 0 || qty > 0 || stock > 0;

    const fields = [
        {
            id: 'profit' as FieldId,
            label: 'Target Keuntungan',
            icon: <TrendingUp className="h-5 w-5 text-emerald-700" />,
            color: 'emerald',
            value: rawValues.profit,
            placeholder: '0',
            prefix: 'Rp',
        },
        {
            id: 'qty' as FieldId,
            label: 'Target Penjualan',
            icon: <ShoppingBag className="h-5 w-5 text-orange-600" />,
            color: 'orange',
            value: rawValues.qty,
            placeholder: '0',
            unit: 'Pcs',
        },
        {
            id: 'stock' as FieldId,
            label: 'Target Restok',
            icon: <Box className="h-5 w-5 text-red-600" />,
            color: 'red',
            value: rawValues.stock,
            placeholder: '0',
            unit: 'Item',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-card border-b border-border px-5 py-4 flex items-center gap-4 shadow-sm">
                <button
                    onClick={onBack}
                    className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-900" />
                </button>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                        Periode
                    </span>
                    <h1 className="text-lg font-black text-slate-900 leading-none">Buat Target Baru</h1>
                </div>
                <div className="ml-auto text-right">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{MONTH_NAMES[month]}</span>
                    <p className="text-sm font-black text-slate-900">{year}</p>
                </div>
            </header>

            <p className="text-center text-sm text-slate-500 font-medium pt-6 px-5 pb-2">
                Isi target bulanan usaha Anda di bawah ini.
            </p>

            {/* Input cards */}
            <main className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto pb-32">
                {fields.map(field => {
                    const hasValue = field.value.length > 0;
                    return (
                        <label
                            key={field.id}
                            className={cn(
                                'w-full p-5 rounded-[1.5rem] border-2 transition-all block cursor-text text-left relative focus-within:ring-4',
                                field.color === 'emerald'
                                    ? 'border-emerald-200 bg-emerald-50 focus-within:ring-emerald-100 focus-within:border-emerald-500'
                                    : field.color === 'orange'
                                        ? 'border-orange-200 bg-orange-50 focus-within:ring-orange-100 focus-within:border-orange-500'
                                        : 'border-red-200 bg-red-50 focus-within:ring-red-100 focus-within:border-red-500'
                            )}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    field.color === 'emerald' ? 'bg-emerald-100' : field.color === 'orange' ? 'bg-orange-100' : 'bg-red-100'
                                )}>
                                    {field.icon}
                                </div>
                                <span className={cn(
                                    'text-sm font-bold uppercase tracking-wider',
                                    field.color === 'emerald' ? 'text-emerald-800'
                                        : field.color === 'orange' ? 'text-orange-800'
                                            : 'text-red-800'
                                )}>
                                    {field.label}
                                </span>
                            </div>

                            <div className="flex items-baseline justify-end gap-2 px-1">
                                {field.prefix && (
                                    <span className={cn('text-xl font-bold', hasValue ? 'text-emerald-700' : 'text-slate-400')}>
                                        {field.prefix}
                                    </span>
                                )}

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={field.value ? parseInt(field.value, 10).toLocaleString('id-ID') : ''}
                                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                    className={cn(
                                        'bg-transparent w-full text-right outline-none text-4xl font-black tracking-tighter mix-blend-multiply placeholder:text-slate-300',
                                        field.color === 'emerald' ? 'text-emerald-900'
                                            : field.color === 'orange' ? 'text-orange-900'
                                                : 'text-red-900'
                                    )}
                                />

                                {field.unit && (
                                    <span className={cn('text-lg font-bold', hasValue ? 'text-slate-600' : 'text-slate-400')}>
                                        {field.unit}
                                    </span>
                                )}
                            </div>

                            {/* Previous target hint */}
                            {previousTarget && (
                                <p className="text-[11px] font-semibold mt-2 text-right text-slate-500">
                                    Bulan lalu:{' '}
                                    {field.id === 'profit'
                                        ? formatShortCurrency(previousTarget.targetProfit)
                                        : field.id === 'qty'
                                            ? `${previousTarget.targetQty} Pcs`
                                            : `${previousTarget.targetStock} Item`}
                                </p>
                            )}
                        </label>
                    );
                })}
            </main>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-5 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-40 max-w-md mx-auto">
                <button
                    onClick={() => onSave({ targetProfit: profit, targetQty: qty, targetStock: stock })}
                    disabled={!canSave}
                    className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 transition-all text-primary-foreground text-xl font-black py-5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                >
                    <span>SIMPAN TARGET</span>
                    <CheckCircle2 className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
