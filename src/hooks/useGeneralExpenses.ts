import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GeneralExpense {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  notes: string | null;
  expenseDate: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  { value: 'transport', label: 'Transportasi' },
  { value: 'packaging', label: 'Kemasan/Packaging' },
  { value: 'marketing', label: 'Marketing/Promosi' },
  { value: 'operational', label: 'Operasional' },
  { value: 'salary', label: 'Gaji/Upah' },
  { value: 'other', label: 'Lainnya' },
] as const;

export function useGeneralExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<GeneralExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('general_expenses' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching general expenses:', error);
    } else {
      setExpenses((data || []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        name: e.name,
        amount: Number(e.amount),
        category: e.category || 'other',
        notes: e.notes,
        expenseDate: e.expense_date,
        createdAt: e.created_at,
      })));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = useCallback(async (expenseData: {
    name: string;
    amount: number;
    category?: string;
    notes?: string;
    expenseDate?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('general_expenses' as any)
      .insert({
        user_id: user.id,
        name: expenseData.name,
        amount: expenseData.amount,
        category: expenseData.category || 'other',
        notes: expenseData.notes || null,
        expense_date: expenseData.expenseDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    await fetchExpenses();
    return data;
  }, [user, fetchExpenses]);

  const updateExpense = useCallback(async (expenseId: string, expenseData: {
    name: string;
    amount: number;
    category?: string;
    notes?: string;
    expenseDate?: string;
  }) => {
    const { error } = await supabase
      .from('general_expenses' as any)
      .update({
        name: expenseData.name,
        amount: expenseData.amount,
        category: expenseData.category || 'other',
        notes: expenseData.notes || null,
        expense_date: expenseData.expenseDate,
      })
      .eq('id', expenseId);

    if (error) throw error;

    await fetchExpenses();
  }, [fetchExpenses]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    const { error } = await supabase
      .from('general_expenses' as any)
      .delete()
      .eq('id', expenseId);

    if (error) throw error;

    await fetchExpenses();
  }, [fetchExpenses]);

  const getExpensesByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [expenses]);

  const getTodayExpenses = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(e => e.expenseDate === today);
  }, [expenses]);

  const getMonthExpenses = useCallback(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return getExpensesByDateRange(monthAgo, now);
  }, [getExpensesByDateRange]);

  const getTotalExpenses = useCallback((expenseList: GeneralExpense[]) => {
    return expenseList.reduce((sum, e) => sum + e.amount, 0);
  }, []);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByDateRange,
    getTodayExpenses,
    getMonthExpenses,
    getTotalExpenses,
    refetch: fetchExpenses,
  };
}
