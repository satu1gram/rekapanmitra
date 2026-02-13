import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { ChevronLeft, ChevronRight, ShoppingCart, PackagePlus, DollarSign, TrendingUp, Wallet, CircleDollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import type { GeneralExpense } from '@/hooks/useGeneralExpenses';
import type { GeneralIncome } from '@/hooks/useGeneralIncome';

type Order = Tables<'orders'>;
type StockEntry = Tables<'stock_entries'>;

interface MonthlySummaryProps {
  orders: Order[];
  stockEntries: StockEntry[];
  expenses: GeneralExpense[];
  income: GeneralIncome[];
}

export function MonthlySummary({ orders, stockEntries, expenses, income }: MonthlySummaryProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const goToPrevMonth = () => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && selectedMonth.getFullYear() === now.getFullYear();
  }, [selectedMonth]);

  const summary = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);

    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= start && d <= end;
    });

    const monthRestocks = stockEntries.filter(e => {
      if (e.type !== 'in' && e.type !== 'initial') return false;
      const d = new Date(e.created_at);
      return d >= start && d <= end;
    });

    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.expenseDate);
      return d >= start && d <= end;
    });

    const monthIncome = income.filter(i => {
      const d = new Date(i.incomeDate);
      return d >= start && d <= end;
    });

    const restockBottles = monthRestocks.reduce((sum, e) => sum + e.quantity, 0);
    const restockCost = monthRestocks.reduce((sum, e) => sum + Number(e.total_buy_price || 0), 0);
    const orderBottles = monthOrders.reduce((sum, o) => sum + o.quantity, 0);
    const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    const grossProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
    const expensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const otherIncome = monthIncome.reduce((sum, i) => sum + i.amount, 0);
    const netProfit = grossProfit - expensesTotal + otherIncome;

    return {
      orderCount: monthOrders.length,
      restockBottles,
      restockCost,
      orderBottles,
      revenue,
      grossProfit,
      expensesTotal,
      otherIncome,
      netProfit,
    };
  }, [orders, stockEntries, expenses, income, selectedMonth]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Rekap Bulanan</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(selectedMonth, 'MMMM yyyy', { locale: localeId })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth} disabled={isCurrentMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bottles Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <PackagePlus className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Restok</p>
              <p className="text-lg font-bold">{summary.restockBottles} <span className="text-xs font-normal text-muted-foreground">botol</span></p>
              {summary.restockCost > 0 && (
                <p className="text-xs text-muted-foreground">Modal: {formatShortCurrency(summary.restockCost)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="text-lg font-bold">{summary.orderBottles} <span className="text-xs font-normal text-muted-foreground">botol</span></p>
              <p className="text-xs text-muted-foreground">{summary.orderCount} transaksi</p>
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Omset</span>
          </div>
          <span className="font-bold">{formatShortCurrency(summary.revenue)}</span>
        </div>

        {/* Profit */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium">Keuntungan Bersih</span>
              <p className="text-xs text-muted-foreground">
                Kotor: {formatShortCurrency(summary.grossProfit)}
              </p>
            </div>
          </div>
          <span className={`font-bold ${summary.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatShortCurrency(summary.netProfit)}
          </span>
        </div>

        {/* Expenses & Other Income breakdown */}
        {(summary.expensesTotal > 0 || summary.otherIncome > 0) && (
          <div className="space-y-1">
            {summary.otherIncome > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">Pemasukan Lain</span>
                </div>
                <span className="text-xs font-medium text-primary">+{formatShortCurrency(summary.otherIncome)}</span>
              </div>
            )}
            {summary.expensesTotal > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs">Pengeluaran</span>
                </div>
                <span className="text-xs font-medium text-destructive">-{formatShortCurrency(summary.expensesTotal)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
