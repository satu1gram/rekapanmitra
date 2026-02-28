import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, ShoppingBag, Box, CheckCircle2, Delete } from 'lucide-react';
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
    const [activeField, setActiveField] = useState<FieldId>('profit');
    const [rawValues, setRawValues] = useState<Record<FieldId, string>>({
        profit: '',
        qty: '',
        stock: '',
    });

    const parseRaw = (raw: string) => {
        const n = parseInt(raw.replace(/\D/g, ''), 10);
        return isNaN(n) ? 0 : n;
    };

    const handleKeypad = (key: string) => {
        setRawValues(prev => {
            const current = prev[activeField];
            if (key === 'del') return { ...prev, [activeField]: current.slice(0, -1) };
            if (key === '000') return { ...prev, [activeField]: current + '000' };
            return { ...prev, [activeField]: current + key };
        });
    };

    const profit = parseRaw(rawValues.profit);
    const qty = parseRaw(rawValues.qty);
    const stock = parseRaw(rawValues.stock);

    const canSave = profit > 0 || qty > 0 || stock > 0;

    const fields: { id: FieldId; label: string; icon: React.ReactNode; color: string; value: number; unit?: string }[] = [
        {
            id: 'profit',
            label: 'Target Keuntungan',
            icon: <TrendingUp className="h-5 w-5 text-emerald-700" />,
            color: 'emerald',
            value: profit,
        },
        {
            id: 'qty',
            label: 'Target Penjualan',
            icon: <ShoppingBag className="h-5 w-5 text-orange-600" />,
            color: 'orange',
            value: qty,
            unit: 'Pcs',
        },
        {
            id: 'stock',
            label: 'Target Restok',
            icon: <Box className="h-5 w-5 text-red-600" />,
            color: 'red',
            value: stock,
            unit: 'Item',
        },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-4">
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

            <p className="text-center text-sm text-slate-500 font-medium pt-4 px-5">
                Isi target bulanan usaha Anda di bawah ini.
            </p>

            {/* Input cards */}
            <main className="flex-1 px-5 py-4 flex flex-col gap-3 overflow-y-auto">
                {fields.map(field => {
                    const isActive = activeField === field.id;
                    return (
                        <button
                            key={field.id}
                            onClick={() => setActiveField(field.id)}
                            className={cn(
                                'w-full p-5 rounded-[1.5rem] border-2 transition-all text-left',
                                isActive
                                    ? field.color === 'emerald'
                                        ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
                                        : field.color === 'orange'
                                            ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                                            : 'border-red-400 bg-red-50 shadow-md shadow-red-100'
                                    : 'border-slate-100 bg-white hover:bg-slate-50'
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center',
                                    field.color === 'emerald' ? 'bg-emerald-100' : field.color === 'orange' ? 'bg-orange-100' : 'bg-red-100'
                                )}>
                                    {field.icon}
                                </div>
                                <span className={cn(
                                    'text-sm font-bold uppercase tracking-wider',
                                    isActive
                                        ? field.color === 'emerald' ? 'text-emerald-800'
                                            : field.color === 'orange' ? 'text-orange-800'
                                                : 'text-red-800'
                                        : 'text-slate-500'
                                )}>
                                    {field.label}
                                </span>
                            </div>
                            <div className="flex items-baseline justify-end gap-2 relative">
                                {field.id === 'profit' && (
                                    <span className={cn('text-xl font-bold', isActive ? 'text-emerald-600' : 'text-slate-300')}>Rp</span>
                                )}
                                <span className={cn(
                                    'text-4xl font-black tracking-tighter',
                                    isActive
                                        ? field.color === 'emerald' ? 'text-emerald-900'
                                            : field.color === 'orange' ? 'text-orange-900'
                                                : 'text-red-900'
                                        : field.value > 0 ? 'text-slate-800' : 'text-slate-300'
                                )}>
                                    {field.id === 'profit'
                                        ? field.value > 0
                                            ? field.value.toLocaleString('id-ID')
                                            : '0'
                                        : field.value > 0
                                            ? field.value.toLocaleString('id-ID')
                                            : '0'}
                                </span>
                                {field.unit && (
                                    <span className={cn('text-lg font-bold', isActive ? 'text-slate-500' : 'text-slate-300')}>
                                        {field.unit}
                                    </span>
                                )}
                                {isActive && (
                                    <div className="absolute right-0 bottom-1 w-0.5 h-8 bg-emerald-500 animate-pulse" />
                                )}
                            </div>
                            {/* Previous target hint */}
                            {previousTarget && (
                                <p className={cn('text-[10px] font-medium mt-1.5 text-right', isActive ? 'text-slate-500' : 'text-slate-400')}>
                                    Target bulan lalu:{' '}
                                    {field.id === 'profit'
                                        ? formatShortCurrency(previousTarget.targetProfit)
                                        : field.id === 'qty'
                                            ? `${previousTarget.targetQty} Pcs`
                                            : `${previousTarget.targetStock} Item`}
                                </p>
                            )}
                        </button>
                    );
                })}
            </main>

            {/* Keypad + Save */}
            <div className="bg-white border-t border-slate-200 p-4 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-40">
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(key => (
                        <button
                            key={key}
                            onPointerDown={e => { e.preventDefault(); handleKeypad(key); }}
                            className={cn(
                                'h-14 rounded-2xl font-bold text-xl flex items-center justify-center select-none active:scale-95 transition-all border-b-4',
                                key === 'del'
                                    ? 'bg-red-50 text-red-500 border-red-100'
                                    : key === '000'
                                        ? 'bg-slate-100 text-slate-700 border-slate-200 text-base'
                                        : 'bg-white text-slate-900 border-slate-200 shadow-sm'
                            )}
                        >
                            {key === 'del' ? <Delete className="h-5 w-5" /> : key}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onSave({ targetProfit: profit, targetQty: qty, targetStock: stock })}
                    disabled={!canSave}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] active:bg-emerald-800 disabled:opacity-40 transition-all text-white text-xl font-black py-5 px-6 rounded-[1.5rem] shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 border-b-4 border-emerald-800"
                >
                    <span>SIMPAN TARGET</span>
                    <CheckCircle2 className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
