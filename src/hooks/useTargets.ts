import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MonthTarget {
    year: number;
    month: number; // 0-indexed, sesuai JavaScript Date.getMonth()
    targetProfit: number;
    targetQty: number;
    targetStock: number;
}

const LS_KEY = 'bp_monthly_targets';

function readLocalStorage(): MonthTarget[] {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function writeLocalStorage(targets: MonthTarget[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(targets)); } catch { }
}

export function useTargets() {
    const { user } = useAuth();
    const [targets, setTargets] = useState<MonthTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [useLocalFallback, setUseLocalFallback] = useState(false);

    // ── Fetch dari Supabase, fallback ke localStorage jika tabel belum ada ──
    const fetchTargets = useCallback(async () => {
        if (!user) { setTargets([]); setLoading(false); return; }

        const { data, error } = await supabase
            .from('monthly_targets')
            .select('year, month, target_profit, target_qty, target_stock')
            .eq('user_id', user.id)
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) {
            // Tabel belum ada (migrasi belum dijalankan) → pakai localStorage
            const isTableMissing =
                error.message?.includes('monthly_targets') ||
                error.message?.includes('schema cache') ||
                (error as any).code === 'PGRST200' ||
                (error as any).code === '42P01';

            if (isTableMissing) {
                setUseLocalFallback(true);
                setTargets(readLocalStorage());
            }
            setLoading(false);
            return;
        }

        setUseLocalFallback(false);
        setTargets(
            (data ?? []).map(r => ({
                year: r.year,
                month: r.month,
                targetProfit: r.target_profit,
                targetQty: r.target_qty,
                targetStock: r.target_stock,
            }))
        );
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchTargets(); }, [fetchTargets]);

    // ── Helpers ───────────────────────────────────────────────────
    const getTarget = useCallback(
        (year: number, month: number): MonthTarget | null =>
            targets.find(t => t.year === year && t.month === month) ?? null,
        [targets]
    );

    // ── Upsert ───────────────────────────────────────────────────
    const setTarget = useCallback(
        async (year: number, month: number, data: Omit<MonthTarget, 'year' | 'month'>) => {
            if (!user) return;

            // Optimistic update
            const updated = (prev: MonthTarget[]) => {
                const filtered = prev.filter(t => !(t.year === year && t.month === month));
                return [...filtered, { year, month, ...data }].sort(
                    (a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month
                );
            };
            setTargets(prev => updated(prev));

            if (useLocalFallback) {
                writeLocalStorage(updated(targets));
                return;
            }

            const { error } = await supabase
                .from('monthly_targets')
                .upsert(
                    {
                        user_id: user.id,
                        year,
                        month,
                        target_profit: data.targetProfit,
                        target_qty: data.targetQty,
                        target_stock: data.targetStock,
                    },
                    { onConflict: 'user_id,year,month' }
                );

            if (error) {
                console.error('useTargets upsert error:', error.message);
                fetchTargets();
            }
        },
        [user, fetchTargets, useLocalFallback, targets]
    );

    // ── Delete ────────────────────────────────────────────────────
    const deleteTarget = useCallback(
        async (year: number, month: number) => {
            if (!user) return;

            const updated = (prev: MonthTarget[]) =>
                prev.filter(t => !(t.year === year && t.month === month));
            setTargets(prev => updated(prev));

            if (useLocalFallback) {
                writeLocalStorage(updated(targets));
                return;
            }

            const { error } = await supabase
                .from('monthly_targets')
                .delete()
                .eq('user_id', user.id)
                .eq('year', year)
                .eq('month', month);

            if (error) {
                console.error('useTargets delete error:', error.message);
                fetchTargets();
            }
        },
        [user, fetchTargets, useLocalFallback, targets]
    );

    return { targets, loading, getTarget, setTarget, deleteTarget };
}
