import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCustomers } from '@/hooks/useCustomersDb';
import { TIER_PRICING, TierType } from '@/types';
import { formatCurrency, formatDateTime, formatPhone } from '@/lib/formatters';
import { toast } from 'sonner';
import { 
  Users, 
  Phone,
  TrendingUp,
  ShoppingBag,
  Loader2,
  Pencil
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

export function CustomersPage() {
  const { customers, loading, updateCustomer } = useCustomers();
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    if (!editName.trim() || !editPhone.trim()) {
      toast.error('Nama dan nomor HP wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      toast.success('Data customer berhasil diperbarui');
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Gagal memperbarui data customer');
    } finally {
      setSaving(false);
    }
  };

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
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(customer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Badge variant={getTierColor(customer.tier)}>
                      {TIER_PRICING[customer.tier as TierType].label}
                    </Badge>
                  </div>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Nama</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={saving}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Nomor HP / WhatsApp</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                disabled={saving}
                className="h-12 text-base"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingCustomer(null)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
