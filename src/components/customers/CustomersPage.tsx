import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/hooks/useCustomersDb';
import { TIER_PRICING, TierType } from '@/types';
import { formatCurrency, formatDateTime, formatPhone } from '@/lib/formatters';
import { 
  Users, 
  Phone,
  TrendingUp,
  ShoppingBag,
  Loader2
} from 'lucide-react';

export function CustomersPage() {
  const { customers, loading } = useCustomers();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'sap': return 'default';
      case 'agen_plus': return 'default';
      case 'agen': return 'secondary';
      case 'reseller': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer</h1>
          <p className="text-sm text-muted-foreground">{customers.length} customer terdaftar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Total Customer</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.tier !== 'satuan').length}
              </p>
              <p className="text-xs text-muted-foreground">Mitra Aktif</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Belum ada customer</p>
              <p className="text-xs">Customer akan muncul setelah ada order</p>
            </CardContent>
          </Card>
        ) : (
          customers.map(customer => (
            <Card key={customer.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {formatPhone(customer.phone)}
                    </div>
                  </div>
                  <Badge variant={getTierColor(customer.tier)}>
                    {TIER_PRICING[customer.tier as TierType].label}
                  </Badge>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold">{customer.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Order</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">
                      {formatCurrency(Number(customer.total_spent)).replace('Rp', '').trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Belanja</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Bergabung</p>
                    <p className="text-xs">{formatDateTime(customer.created_at).split(',')[0]}</p>
                  </div>
                </div>

                {customer.tier !== 'satuan' && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span className="text-xs text-primary">
                      Eligible jual ulang dengan harga {TIER_PRICING[customer.tier as TierType].label}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
