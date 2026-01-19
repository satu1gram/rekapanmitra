import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { TrendingUp, DollarSign, Calendar, ChevronLeft, Wallet } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, isSameDay, isSameWeek, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';
import type { GeneralExpense } from '@/hooks/useGeneralExpenses';

type Order = Tables<'orders'>;

type FilterType = 'daily' | 'weekly' | 'monthly';

interface EarningsHistoryProps {
  orders: Order[];
  expenses: GeneralExpense[];
  onBack: () => void;
}

interface EarningsSummary {
  date: Date;
  label: string;
  orderCount: number;
  totalBottles: number;
  revenue: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export function EarningsHistory({ orders, expenses, onBack }: EarningsHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('daily');

  const earningsData = useMemo(() => {
    const now = new Date();
    let intervals: Date[] = [];
    let summaries: EarningsSummary[] = [];

    if (filter === 'daily') {
      // Last 30 days
      const startDate = subDays(now, 30);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      
      summaries = intervals.map(day => {
        const dayOrders = orders.filter(order => 
          isSameDay(new Date(order.created_at), day)
        );
        const dayExpenses = expenses.filter(expense =>
          expense.expenseDate === format(day, 'yyyy-MM-dd')
        );
        
        const grossProfit = dayOrders.reduce((sum, o) => sum + Number(o.margin), 0);
        const expensesTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
          date: day,
          label: format(day, 'd MMM yyyy', { locale: id }),
          orderCount: dayOrders.length,
          totalBottles: dayOrders.reduce((sum, o) => sum + o.quantity, 0),
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
          grossProfit,
          expenses: expensesTotal,
          netProfit: grossProfit - expensesTotal,
        };
      });
    } else if (filter === 'weekly') {
      // Last 12 weeks
      const startDate = subWeeks(now, 12);
      intervals = eachWeekOfInterval({ start: startDate, end: now }, { weekStartsOn: 1 });
      
      summaries = intervals.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        const weekExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.expenseDate);
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });
        
        const grossProfit = weekOrders.reduce((sum, o) => sum + Number(o.margin), 0);
        const expensesTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
          date: weekStart,
          label: `${format(weekStart, 'd MMM', { locale: id })} - ${format(weekEnd, 'd MMM yyyy', { locale: id })}`,
          orderCount: weekOrders.length,
          totalBottles: weekOrders.reduce((sum, o) => sum + o.quantity, 0),
          revenue: weekOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
          grossProfit,
          expenses: expensesTotal,
          netProfit: grossProfit - expensesTotal,
        };
      });
    } else {
      // Last 12 months
      const startDate = subMonths(now, 12);
      intervals = eachMonthOfInterval({ start: startDate, end: now });
      
      summaries = intervals.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const monthOrders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.expenseDate);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        });
        
        const grossProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);
        const expensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        return {
          date: monthStart,
          label: format(monthStart, 'MMMM yyyy', { locale: id }),
          orderCount: monthOrders.length,
          totalBottles: monthOrders.reduce((sum, o) => sum + o.quantity, 0),
          revenue: monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
          grossProfit,
          expenses: expensesTotal,
          netProfit: grossProfit - expensesTotal,
        };
      });
    }

    // Sort by date descending (newest first)
    return summaries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders, expenses, filter]);

  // Calculate totals for the current filter period
  const totals = useMemo(() => {
    return earningsData.reduce((acc, item) => ({
      orderCount: acc.orderCount + item.orderCount,
      totalBottles: acc.totalBottles + item.totalBottles,
      revenue: acc.revenue + item.revenue,
      grossProfit: acc.grossProfit + item.grossProfit,
      expenses: acc.expenses + item.expenses,
      netProfit: acc.netProfit + item.netProfit,
    }), { orderCount: 0, totalBottles: 0, revenue: 0, grossProfit: 0, expenses: 0, netProfit: 0 });
  }, [earningsData]);

  const filterLabels: Record<FilterType, string> = {
    daily: 'Harian (30 hari)',
    weekly: 'Mingguan (12 minggu)',
    monthly: 'Bulanan (12 bulan)',
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">History Pendapatan</h1>
          <p className="text-sm text-muted-foreground">Rekap pendapatan & keuntungan bersih</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as FilterType[]).map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className="flex-1"
          >
            {type === 'daily' ? 'Harian' : type === 'weekly' ? 'Mingguan' : 'Bulanan'}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatShortCurrency(totals.revenue)}</p>
            <p className="text-xs text-muted-foreground">{totals.orderCount} order • {totals.totalBottles} botol</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Keuntungan Bersih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${totals.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatShortCurrency(totals.netProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Kotor: {formatShortCurrency(totals.grossProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Summary */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Total Pengeluaran</span>
          </div>
          <span className="font-bold text-destructive">-{formatShortCurrency(totals.expenses)}</span>
        </CardContent>
      </Card>

      {/* Period Label */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{filterLabels[filter]}</span>
      </div>

      {/* History List */}
      <ScrollArea className="h-[calc(100vh-480px)]">
        <div className="space-y-2">
          {earningsData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Belum ada data</p>
              </CardContent>
            </Card>
          ) : (
            earningsData.map((item, index) => (
              <Card key={index} className={item.orderCount === 0 && item.expenses === 0 ? 'opacity-50' : ''}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.orderCount} order • {item.totalBottles} botol
                      </p>
                      {item.expenses > 0 && (
                        <p className="text-xs text-destructive">
                          Biaya: -{formatShortCurrency(item.expenses)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatShortCurrency(item.revenue)}</p>
                      <p className={`text-xs font-medium ${item.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {item.netProfit >= 0 ? '+' : ''}{formatShortCurrency(item.netProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
