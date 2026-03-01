import { ArrowLeft, Calendar, CheckCircle2, Clock, Plus } from 'lucide-react';
import { MonthTarget } from '@/hooks/useTargets';
import { formatShortCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface TargetListProps {
    year: number;
    targets: MonthTarget[];
    achievements: Record<string, { profit: number; qty: number }>;
    onBack: () => void;
    onCreate: (year: number, month: number) => void;
}

export function TargetList({ year, targets, achievements, onBack, onCreate }: TargetListProps) {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Show months of the selected year
    const months = Array.from({ length: 12 }, (_, i) => i).filter(m => {
        // Show all months up to 1 month in the future
        if (year < thisYear) return true;
        if (year === thisYear) return m <= thisMonth + 1;
        return false;
    }).reverse();

    const targetMap = new Map(targets.filter(t => t.year === year).map(t => [t.month, t]));

    const targetYears = [...new Set(targets.map(t => t.year))].sort((a, b) => b - a);
    if (!targetYears.includes(thisYear)) targetYears.unshift(thisYear);

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-30 bg-card border-b border-border px-5 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <ArrowLeft className="h-5 w-5 text-slate-900" />
                </button>
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rekapan Mitra</span>
                    <h1 className="text-lg font-black text-slate-900 leading-none">Daftar Target</h1>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 space-y-3 pb-8">
                {/* Year badge */}
                <div className="bg-slate-900 rounded-2xl px-5 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tahun Berjalan</p>
                        <p className="text-3xl font-black text-white">{year}</p>
                    </div>
                    {(() => {
                        const thisYearTargets = targets.filter(t => t.year === year);
                        if (thisYearTargets.length === 0) return null;
                        const totalTarget = thisYearTargets.reduce((s, t) => s + t.targetProfit, 0);
                        const totalAchieved = thisYearTargets.reduce((s, t) => {
                            const key = `${t.year}-${t.month}`;
                            return s + (achievements[key]?.profit ?? 0);
                        }, 0);
                        const pct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
                        return (
                            <div className="bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                                <span className="text-sm font-black text-emerald-400">+{pct}%</span>
                            </div>
                        );
                    })()}
                </div>

                {/* Monthly target cards */}
                {months.map(m => {
                    const target = targetMap.get(m);
                    const isCurrentMonth = m === thisMonth && year === thisYear;
                    const key = `${year}-${m}`;
                    const achieved = achievements[key] ?? { profit: 0, qty: 0 };
                    const profitPct = target && target.targetProfit > 0
                        ? Math.min(Math.round((achieved.profit / target.targetProfit) * 100), 100)
                        : 0;
                    const isAchieved = target !== undefined && achieved.profit >= target.targetProfit && target.targetProfit > 0;

                    if (!target) {
                        // No target card
                        return (
                            <div key={m} className="bg-white rounded-[1.75rem] px-5 py-4 border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">{MONTH_NAMES[m]}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Belum ada target.</p>
                                </div>
                                <button
                                    onClick={() => onCreate(year, m)}
                                    className="flex items-center gap-1.5 border-2 border-emerald-500 text-emerald-600 font-black text-sm px-4 py-2 rounded-2xl active:scale-95 transition-transform"
                                >
                                    <Plus className="h-4 w-4" />
                                    Buat
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div key={m} className="bg-white rounded-[1.75rem] px-5 py-5 border border-slate-100 shadow-sm">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-900">{MONTH_NAMES[m]}</h3>
                                    {isCurrentMonth && (
                                        <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase">
                                            Bulan Ini
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onCreate(year, m)}
                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                                    >
                                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                    </button>
                                    {isAchieved
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        : <Clock className="h-5 w-5 text-slate-300" />}
                                </div>
                            </div>

                            {/* Target vs Tercapai */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Target</p>
                                    <p className="text-xl font-black text-slate-900 leading-none">
                                        {formatShortCurrency(target.targetProfit)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tercapai</p>
                                    <p className={cn('text-xl font-black leading-none', achieved.profit >= target.targetProfit && target.targetProfit > 0 ? 'text-emerald-600' : 'text-slate-700')}>
                                        {formatShortCurrency(achieved.profit)}
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-700',
                                        profitPct >= 100 ? 'bg-emerald-500' : profitPct >= 60 ? 'bg-emerald-400' : 'bg-emerald-300'
                                    )}
                                    style={{ width: `${profitPct}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500">Prog. {profitPct}%</span>
                                {isAchieved ? (
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase">
                                        ✓ Tercapai
                                    </span>
                                ) : isCurrentMonth ? (
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full uppercase">
                                        On Track
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    );
                })}

                <p className="text-center text-[10px] text-slate-400 py-2 uppercase tracking-widest">Data tahun {year}</p>
            </main>
        </div>
    );
}
