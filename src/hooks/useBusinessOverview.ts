import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { businessDate, shiftDate, type OverviewData } from '@/lib/businessOverview';

type QueryResult<T> = { data: T[] | null; error: { message: string } | null };

// Supabase defaults to 1,000 rows. Never silently return a truncated recap.
export async function readAllPages<T>(load: (from: number, to: number) => PromiseLike<QueryResult<T>>): Promise<T[]> {
  const records: T[] = [];
  for (let from = 0; from < 100_000; from += 1000) {
    const { data, error } = await load(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Data ringkasan tidak tersedia.');
    records.push(...data);
    if (data.length < 1000) return records;
  }
  throw new Error('Data terlalu besar. Ringkasan belum dapat dihitung secara lengkap.');
}

export function useBusinessOverview(demo: boolean) {
  const { user } = useAuth();
  const today = businessDate(new Date());
  return useQuery({
    queryKey: ['business-overview', user?.id, today],
    enabled: !!user && !demo,
    staleTime: 60_000,
    queryFn: async (): Promise<OverviewData> => {
      if (!user) throw new Error('Silakan masuk terlebih dahulu.');
      const start = shiftDate(today, -30);
      const end = shiftDate(today, 1);
      const [orders, expenses, income, stock] = await Promise.all([
        readAllPages((from, to) => supabase.from('orders')
          .select('id, created_at, quantity, total_price, margin, status').eq('user_id', user.id)
          .gte('created_at', `${start}T00:00:00+07:00`).lt('created_at', `${end}T00:00:00+07:00`)
          .order('id').range(from, to)),
        readAllPages((from, to) => supabase.from('general_expenses')
          .select('id, expense_date, amount').eq('user_id', user.id)
          .gte('expense_date', start).lt('expense_date', end).order('id').range(from, to)),
        readAllPages((from, to) => supabase.from('general_income')
          .select('id, income_date, amount').eq('user_id', user.id)
          .gte('income_date', start).lt('income_date', end).order('id').range(from, to)),
        supabase.from('user_stock').select('current_stock').eq('user_id', user.id).maybeSingle(),
      ]);
      if (stock.error) throw new Error(stock.error.message);
      return {
        orders,
        expenses: expenses.map(record => ({ date: record.expense_date, amount: Number(record.amount) })),
        income: income.map(record => ({ date: record.income_date, amount: Number(record.amount) })),
        currentStock: stock.data?.current_stock ?? null,
      };
    },
  });
}
