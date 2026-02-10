import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrdersDb';
import { useStock } from '@/hooks/useStockDb';
import { useGeneralExpenses } from '@/hooks/useGeneralExpenses';
import { useGeneralIncome } from '@/hooks/useGeneralIncome';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import { LOW_STOCK_THRESHOLD, TIER_PRICING, TierType } from '@/types';
import { EarningsHistory } from './EarningsHistory';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  Plus,
  PackagePlus,
  Loader2,
  History,
  Wallet
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: 'orders' | 'stock') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { orders, loading: ordersLoading, getTodayOrders, getWeekOrders, getMonthOrders } = useOrders();
  const { currentStock, isLowStock, loading: stockLoading } = useStock();
  const { expenses, loading: expensesLoading, getTodayExpenses, getMonthExpenses, getTotalExpenses } = useGeneralExpenses();
  const { income, loading: incomeLoading, getTodayIncome, getMonthIncome, getTotalIncome } = useGeneralIncome();

  const loading = ordersLoading || stockLoading || expensesLoading || incomeLoading;

  const todayOrders = getTodayOrders();
  const weekOrders = getWeekOrders();
  const monthOrders = getMonthOrders();

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const todayProfit = todayOrders.reduce((sum, o) => sum + Number(o.margin), 0);
  
  const weekRevenue = weekOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const weekProfit = weekOrders.reduce((sum, o) => sum + Number(o.margin), 0);

  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const monthProfit = monthOrders.reduce((sum, o) => sum + Number(o.margin), 0);

  // Calculate expenses
  const todayExpensesTotal = getTotalExpenses(getTodayExpenses());
  const monthExpensesTotal = getTotalExpenses(getMonthExpenses());

  // Calculate other income
  const todayIncomeTotal = getTotalIncome(getTodayIncome());
  const monthIncomeTotal = getTotalIncome(getMonthIncome());

  // Net profit = profit - expenses + other income
  const todayNetProfit = todayProfit - todayExpensesTotal + todayIncomeTotal;
  const monthNetProfit = monthProfit - monthExpensesTotal + monthIncomeTotal;

  const averageMargin = monthOrders.length > 0 
    ? Math.round(monthOrders.reduce((sum, o) => sum + (Number(o.margin) / o.quantity), 0) / monthOrders.length)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showHistory) {
    return <EarningsHistory orders={orders} expenses={expenses} income={income} onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan bisnis Anda</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {isLowStock && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Stok Rendah!</p>
              <p className="text-xs text-muted-foreground">
                Stok tersisa {currentStock} botol (minimal {LOW_STOCK_THRESHOLD})
              </p>
            </div>
            <Button size="sm" variant="destructive" onClick={() => onNavigate('stock')}>
              Restok
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-auto flex-col gap-2 py-4"
          onClick={() => onNavigate('orders')}
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Tambah Order</span>
        </Button>
        <Button 
          variant="secondary"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => onNavigate('stock')}
        >
          <PackagePlus className="h-6 w-6" />
          <span className="text-sm font-medium">Restok</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              Order Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
            <p className="text-xs text-muted-foreground">
              Minggu: {weekOrders.length} • Bulan: {monthOrders.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              Stok Tersisa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{currentStock}</p>
              {isLowStock && (
                <Badge variant="destructive" className="text-xs">Low</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">botol</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatShortCurrency(todayRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              Minggu: {formatShortCurrency(weekRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Bulan: {formatShortCurrency(monthRevenue)}
            </p>
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
            <p className={`text-xl font-bold ${todayNetProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatShortCurrency(todayNetProfit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Kotor: {formatShortCurrency(todayProfit)} • Biaya: -{formatShortCurrency(todayExpensesTotal)}
              {todayIncomeTotal > 0 && ` • Lain: +${formatShortCurrency(todayIncomeTotal)}`}
            </p>
            <p className={`text-xs ${monthNetProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              Bulan: {formatShortCurrency(monthNetProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Margin + History Button */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Margin Rata-rata/Botol</p>
            <p className="text-lg font-bold">{formatCurrency(averageMargin)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Order Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {orders.slice(0, 5).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada order
            </p>
          ) : (
            orders.slice(0, 5).map(order => (
              <div 
                key={order.id} 
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.quantity} botol • {formatShortCurrency(Number(order.total_price))}
                  </p>
                </div>
                <Badge 
                  variant={
                    order.status === 'selesai' ? 'default' : 
                    order.status === 'terkirim' ? 'secondary' : 'outline'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
