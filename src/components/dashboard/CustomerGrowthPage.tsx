import { useState, useMemo } from 'react';
import { ArrowLeft, Users, Medal, Download, TrendingUp, TrendingDown, User, Store, ChevronRight } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomersDb';
import { cn } from '@/lib/utils';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import type { Tables } from '@/integrations/supabase/types';
import { EditCustomerPage } from '@/components/customers/EditCustomerPage';

interface CustomerGrowthPageProps {
    onBack: () => void;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

export function CustomerGrowthPage({ onBack }: CustomerGrowthPageProps) {
    const { customers, loading } = useCustomers();

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedSegment, setSelectedSegment] = useState<'semua' | 'mitra' | 'konsumen'>('semua');
    const [editingCustomer, setEditingCustomer] = useState<Tables<'customers'> | null>(null);

    // Available Years
    const availableYears = useMemo(() => {
        const years = new Set(customers.map(c => new Date(c.created_at).getFullYear()));
        years.add(currentYear);
        years.add(currentYear + 1);
        years.add(currentYear + 2);
        return Array.from(years).sort((a, b) => a - b);
    }, [customers, currentYear]);

    // Ensure selected year is in viewable range, fallback logic if needed
    const yearOptions = availableYears.filter(y => y >= currentYear - 1 && y <= currentYear + 2).slice(0, 3);
    if (!yearOptions.includes(selectedYear)) {
        if (yearOptions.length > 0) setSelectedYear(yearOptions[0]);
    }

    // Filter customers based on segment
    const baseSegmentCustomers = useMemo(() => {
        if (selectedSegment === 'semua') return customers;
        if (selectedSegment === 'mitra') return customers.filter(c => c.tier !== 'satuan');
        return customers.filter(c => c.tier === 'satuan');
    }, [customers, selectedSegment]);

    // Statistics for Current Year vs Previous Year
    const currentYearData = useMemo(() => {
        const months = new Array(12).fill(0);
        let total = 0;

        baseSegmentCustomers.forEach(c => {
            const d = new Date(c.created_at);
            if (d.getFullYear() === selectedYear) {
                months[d.getMonth()]++;
                total++;
            }
        });

        return { months, total };
    }, [baseSegmentCustomers, selectedYear]);

    const previousYearData = useMemo(() => {
        let total = 0;
        baseSegmentCustomers.forEach(c => {
            const d = new Date(c.created_at);
            if (d.getFullYear() === selectedYear - 1) {
                total++;
            }
        });
        return { total };
    }, [baseSegmentCustomers, selectedYear]);

    // Growth calc
    const growthNumber = currentYearData.total - previousYearData.total;
    const growthPct = previousYearData.total > 0
        ? Math.round((growthNumber / previousYearData.total) * 100)
        : (currentYearData.total > 0 ? 100 : 0);
    const isPositiveGrowth = growthNumber >= 0;

    // Top 3 Months
    const topMonths = useMemo(() => {
        return currentYearData.months
            .map((val, idx) => ({ val, idx, monthName: MONTHS[idx] }))
            .filter(m => m.val > 0)
            .sort((a, b) => b.val - a.val)
            .slice(0, 3);
    }, [currentYearData.months]);

    const maxChartVal = Math.max(...currentYearData.months, 5); // Minimum scale of 5

    const getSegmentText = () => {
        if (selectedSegment === 'mitra') return 'Mitra';
        if (selectedSegment === 'konsumen') return 'Konsumen';
        return 'Pelanggan';
    };

    const tierBreakdown = useMemo(() => {
        const acc = { reseller: 0, agen: 0, agen_plus: 0, sap: 0, se: 0, satuan: 0 } as Record<string, number>;
        baseSegmentCustomers.forEach(c => {
            if (acc[c.tier] !== undefined) {
                acc[c.tier]++;
            } else {
                acc[c.tier] = 1;
            }
        });
        return acc;
    }, [baseSegmentCustomers]);

    if (loading) return <LoadingScreen />;

    if (editingCustomer) {
        return (
            <EditCustomerPage
                customer={editingCustomer}
                onBack={() => setEditingCustomer(null)}
                onSaved={(updatedCustomer) => {
                    // Update the local list or just rely on the subscription / refresh
                    // useCustomers hook doesn't currently expose a mutate, so we close and rely on real-time/refetch
                    setEditingCustomer(null);
                }}
            />
        );
    }

    return (
        <div className="bg-background min-h-screen pb-safe">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
                <button
                    onClick={onBack}
                    className="w-11 h-11 rounded-xl bg-muted border border-border text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-xl font-extrabold text-foreground tracking-tight">Grafik Pelanggan</h1>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">Pantau pertumbuhan bisnis</p>
                </div>
            </header>

            <main className="px-4 py-4 space-y-4">
                {/* Filters Top Bar */}
                <div className="bg-card rounded-2xl p-2 border-2 border-slate-100 shadow-sm flex items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 w-1/4">Pilih Tahun</span>
                    <div className="flex-1 flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        {yearOptions.map(y => (
                            <button
                                key={y}
                                onClick={() => setSelectedYear(y)}
                                className={cn(
                                    'flex-1 py-1.5 rounded-lg text-sm font-bold transition-all relative',
                                    selectedYear === y
                                        ? 'bg-red-600 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {y}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Segment Tabs */}
                <div className="bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100 flex shadow-sm">
                    {(['semua', 'mitra', 'konsumen'] as const).map(segment => (
                        <button
                            key={segment}
                            onClick={() => setSelectedSegment(segment)}
                            className={cn(
                                'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize',
                                selectedSegment === segment
                                    ? 'bg-white text-red-600 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-700'
                            )}
                        >
                            {segment}
                        </button>
                    ))}
                </div>

                {/* Total Growth Summary */}
                <div className="bg-white rounded-[2rem] border-2 border-red-50 p-6 text-center shadow-lg shadow-red-100/30 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>

                    <span className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-1">
                        Total Pertumbuhan {selectedYear}
                    </span>
                    <h2 className="text-4xl font-black text-red-600 tracking-tighter mb-4">
                        +{currentYearData.total} <span className="text-3xl">{getSegmentText()} Baru</span>
                    </h2>

                    <div className="inline-flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        {isPositiveGrowth ? (
                            <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                        ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <span className="text-xs font-bold text-red-600">
                            {growthPct > 0 ? '+' : ''}{growthPct}% dari {selectedYear - 1}
                        </span>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-[1.5rem] border-2 border-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Grafik Pertumbuhan</h3>
                        <button className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors active:scale-95">
                            <Download className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold">Simpan</span>
                        </button>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-1 mt-6 relative">
                        {MONTHS.map((month, i) => {
                            const val = currentYearData.months[i];
                            const heightPct = (val / maxChartVal) * 100;
                            const opacity = Math.max(0.4, val / maxChartVal);

                            return (
                                <div key={month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                                    {val > 0 && (
                                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                            {val}
                                        </div>
                                    )}
                                    <div
                                        className="w-full bg-red-600 rounded-t-sm transition-all duration-500 ease-out hover:brightness-90"
                                        style={{
                                            height: `${heightPct}%`,
                                            minHeight: val > 0 ? '4px' : '0',
                                            opacity: opacity
                                        }}
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top 3 Section */}
                <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-slate-900 px-1">3 Bulan Pertumbuhan Tertinggi</h3>

                    {topMonths.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center border-2 border-slate-50 border-dashed">
                            <p className="text-sm font-medium text-slate-400">Belum ada data pertumbuhan di tahun ini.</p>
                        </div>
                    ) : (
                        topMonths.map((m, i) => {
                            const medals = [
                                { bg: 'bg-amber-100 border-amber-200 text-amber-500', text: 'text-amber-500' },
                                { bg: 'bg-slate-100 border-slate-200 text-slate-500', text: 'text-slate-500' },
                                { bg: 'bg-orange-100 border-orange-200 text-orange-600', text: 'text-orange-600' }
                            ];
                            const style = medals[i];

                            return (
                                <div key={m.idx} className="bg-white rounded-[1.25rem] p-4 flex items-center justify-between border-2 border-slate-50 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", style.bg)}>
                                            <Medal className={cn("h-5 w-5", style.text)} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900">{MONTHS[m.idx]}</h4>
                                            <p className="text-red-600 font-bold text-sm">+{m.val} {getSegmentText()}</p>
                                        </div>
                                    </div>
                                    {i === 0 && (
                                        <div className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                                            Tertinggi
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Customer List Section */}
                <div className="space-y-3 pt-6">
                    {(selectedSegment === 'semua' || selectedSegment === 'mitra') && baseSegmentCustomers.length > 0 && (
                        <div className="mb-6 space-y-3">
                            <h3 className="font-bold text-slate-900 px-1">Statistik Level Mitra</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(tierBreakdown)
                                    .filter(([tier, count]) => tier !== 'satuan' && count > 0)
                                    .sort((a, b) => b[1] - a[1]) // Sort by count descending
                                    .map(([tier, count]) => {
                                        let label = tier;
                                        if (tier === 'agen_plus') label = 'Agen Plus';
                                        if (tier === 'sap') label = 'SAP';
                                        if (tier === 'se') label = 'Spesial Ent.';
                                        
                                        return (
                                            <div key={tier} className="bg-red-50/50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2">
                                                <Store className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-[11px] font-bold text-slate-700 capitalize">
                                                    {label.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs font-black text-red-600 bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                                                    {count}
                                                </span>
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-1">
                        <h3 className="font-bold text-slate-900">Daftar {getSegmentText()} ({baseSegmentCustomers.length})</h3>
                    </div>

                    {baseSegmentCustomers.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center border-2 border-slate-50 border-dashed">
                            <p className="text-sm font-medium text-slate-400">Belum ada {getSegmentText().toLowerCase()} yang terdaftar.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                            {baseSegmentCustomers
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((c) => {
                                    const isMitra = c.tier !== 'satuan';
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setEditingCustomer(c)}
                                            className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                                                    isMitra ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-50 border-slate-100 text-slate-500"
                                                )}>
                                                    {isMitra ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 leading-tight">{c.name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest",
                                                            isMitra ? "text-red-500" : "text-slate-400"
                                                        )}>
                                                            {isMitra ? c.tier.replace('_', ' ') : 'Konsumen'}
                                                        </span>
                                                        {c.city && (
                                                            <>
                                                                <span className="text-slate-300">•</span>
                                                                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                                                    {c.city}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300" />
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
