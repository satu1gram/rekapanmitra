import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GeneralIncome {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  notes: string | null;
  incomeDate: string;
  createdAt: string;
}

export const INCOME_CATEGORIES = [
  { value: 'bonus', label: 'Bonus' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investasi' },
  { value: 'gift', label: 'Hadiah/Gift' },
  { value: 'refund', label: 'Refund/Pengembalian' },
  { value: 'other', label: 'Lainnya' },
] as const;

export function useGeneralIncome() {
  const { user } = useAuth();
  const [income, setIncome] = useState<GeneralIncome[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncome = useCallback(async () => {
    if (!user) {
      setIncome([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('general_income' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('income_date', { ascending: false });

    if (error) {
      console.error('Error fetching general income:', error);
    } else {
      setIncome((data || []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        name: e.name,
        amount: Number(e.amount),
        category: e.category || 'other',
        notes: e.notes,
        incomeDate: e.income_date,
        createdAt: e.created_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIncome();
  }, [fetchIncome]);

  const addIncome = useCallback(async (incomeData: {
    name: string;
    amount: number;
    category?: string;
    notes?: string;
    incomeDate?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('general_income' as any)
      .insert({
        user_id: user.id,
        name: incomeData.name,
        amount: incomeData.amount,
        category: incomeData.category || 'other',
        notes: incomeData.notes || null,
        income_date: incomeData.incomeDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    await fetchIncome();
    return data;
  }, [user, fetchIncome]);

  const updateIncome = useCallback(async (incomeId: string, incomeData: {
    name: string;
    amount: number;
    category?: string;
    notes?: string;
    incomeDate?: string;
  }) => {
    const { error } = await supabase
      .from('general_income' as any)
      .update({
        name: incomeData.name,
        amount: incomeData.amount,
        category: incomeData.category || 'other',
        notes: incomeData.notes || null,
        income_date: incomeData.incomeDate,
      })
      .eq('id', incomeId);

    if (error) throw error;
    await fetchIncome();
  }, [fetchIncome]);

  const deleteIncome = useCallback(async (incomeId: string) => {
    const { error } = await supabase
      .from('general_income' as any)
      .delete()
      .eq('id', incomeId);

    if (error) throw error;
    await fetchIncome();
  }, [fetchIncome]);

  const getIncomeByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return income.filter(i => {
      const d = new Date(i.incomeDate);
      return d >= startDate && d <= endDate;
    });
  }, [income]);

  const getTodayIncome = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return income.filter(i => i.incomeDate === today);
  }, [income]);

  const getMonthIncome = useCallback(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return getIncomeByDateRange(monthAgo, now);
  }, [getIncomeByDateRange]);

  const getTotalIncome = useCallback((list: GeneralIncome[]) => {
    return list.reduce((sum, i) => sum + i.amount, 0);
  }, []);

  return {
    income,
    loading,
    addIncome,
    updateIncome,
    deleteIncome,
    getIncomeByDateRange,
    getTodayIncome,
    getMonthIncome,
    getTotalIncome,
    refetch: fetchIncome,
  };
}
