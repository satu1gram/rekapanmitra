import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useProfile } from '@/hooks/useProfile';
import { useProducts } from '@/hooks/useProducts';
import { TierType, TIER_PRICING, MITRA_LEVELS, OrderItem } from '@/types';
import { formatCurrency, formatShortCurrency } from '@/lib/formatters';
import {
  Plus,
  Upload,
  X,
  Phone,
  User,
  Package,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { OrderItemRow } from './OrderItemRow';

type Customer = Tables<'customers'>;

interface OrderFormProps {
  customers: Customer[];
  currentStock: number;
  submitting: boolean;
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string;
    customerId?: string;
    createdAt?: string;
  }) => void;
  onCancel: () => void;
  // For edit mode
  initialData?: {
    customerName: string;
    customerPhone: string;
    tier: TierType;
    items: OrderItem[];
    transferProofUrl?: string | null;
    orderDate?: string;
  };
}

function createEmptyItem(products: { id: string; name: string; default_sell_price: number }[]): OrderItem {
  if (products.length > 0) {
    const p = products[0];
    return {
      productId: p.id,
      productName: p.name,
      quantity: 1,
      pricePerBottle: p.default_sell_price,
      subtotal: p.default_sell_price,
    };
  }
  return {
    productName: '',
    quantity: 1,
    pricePerBottle: 250000,
    subtotal: 250000,
  };
}

export function OrderForm({
  customers,
  currentStock,
  submitting,
  onSubmit,
  onCancel,
  initialData,
}: OrderFormProps) {
  const { uploadTransferProof } = useFileUpload();
  const { mitraLevel } = useProfile();
  const { products } = useProducts();

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierType>(initialData?.tier || 'satuan');
  const [items, setItems] = useState<OrderItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [createEmptyItem(products)]
  );
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(initialData?.transferProofUrl || null);
  const [transferProofPreview, setTransferProofPreview] = useState<string | null>(initialData?.transferProofUrl || null);
  const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mitraInfo = MITRA_LEVELS[mitraLevel];

  // Totals
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalSellPrice = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalBuyPrice = mitraInfo.buyPricePerBottle * totalQuantity;
  const estimatedMargin = totalSellPrice - totalBuyPrice;

  // Customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerName.trim() || customerName.length < 2) return [];
    const query = customerName.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query)
    ).slice(0, 5);
  }, [customerName, customers]);

  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setSelectedCustomerId(customer.id);
    if (customer.tier && TIER_PRICING[customer.tier as TierType]) {
      setSelectedTier(customer.tier as TierType);
    }
    setShowSuggestions(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem(products)]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setTransferProofPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadTransferProof(file);
      setTransferProofUrl(url);
      toast.success('Bukti transfer berhasil diupload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload bukti transfer');
      setTransferProofPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProof = () => {
    setTransferProofUrl(null);
    setTransferProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Nama dan nomor WhatsApp wajib diisi');
      return;
    }

    // Validate items
    const invalidItems = items.filter(item => !item.productName.trim());
    if (invalidItems.length > 0) {
      toast.error('Semua item harus memiliki nama produk');
      return;
    }

    if (totalQuantity > currentStock) {
      toast.error(`Stok tidak cukup. Tersisa ${currentStock} botol`);
      return;
    }

    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      tier: selectedTier,
      items,
      transferProofUrl: transferProofUrl || undefined,
      customerId: selectedCustomerId || undefined,
      createdAt: orderDate ? new Date(orderDate).toISOString() : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {initialData ? 'Edit Order' : 'Order Baru'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Name with Auto-suggest */}
          <div className="space-y-2 relative">
            <Label htmlFor="customerName" className="text-base font-medium">
              <User className="mr-1 inline h-4 w-4" />
              Nama Customer
            </Label>
            <Input
              id="customerName"
              placeholder="Ketik nama customer..."
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setSelectedCustomerId('');
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              required
              disabled={submitting}
              className="h-12 text-base"
            />
            {showSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
                {customerSuggestions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-lg last:rounded-b-lg"
                    onMouseDown={() => selectCustomer(c)}
                  >
                    <div>
                      <p className="font-medium text-base">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.phone}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {TIER_PRICING[c.tier as TierType]?.label || c.tier}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="text-base font-medium">
              <Phone className="mr-1 inline h-4 w-4" />
              Nomor WhatsApp
            </Label>
            <Input
              id="customerPhone"
              placeholder="08xxxxxxxxxx"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              disabled={submitting}
              className="h-12 text-base"
            />
          </div>

          {/* Tier Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              <Package className="mr-1 inline h-4 w-4" />
              Tier Customer
            </Label>
            <Select
              value={selectedTier}
              onValueChange={(v) => setSelectedTier(v as TierType)}
              disabled={submitting}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TIER_PRICING).map(tier => (
                  <SelectItem key={tier.tier} value={tier.tier}>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{tier.label}</span>
                      <span className="text-xs text-muted-foreground">
                        @ {formatShortCurrency(tier.pricePerBottle)}/btl
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Daftar Produk</Label>
            {items.map((item, index) => (
              <OrderItemRow
                key={index}
                item={item}
                index={index}
                products={products}
                disabled={submitting}
                canRemove={items.length > 1}
                onUpdate={handleUpdateItem}
                onRemove={handleRemoveItem}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-base gap-2"
              onClick={handleAddItem}
              disabled={submitting}
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </div>

          {/* Summary */}
          <Card className="bg-muted/50">
            <CardContent className="space-y-2 py-4">
              {items.length > 1 && items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">
                    {item.quantity} {item.productName || 'Produk'} @ {formatShortCurrency(item.pricePerBottle)}
                  </span>
                  <span className="shrink-0">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total Jual ({totalQuantity} btl)
                </span>
                <span className="font-semibold">{formatCurrency(totalSellPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Modal ({totalQuantity} btl × {formatShortCurrency(mitraInfo.buyPricePerBottle)})
                </span>
                <span>{formatCurrency(totalBuyPrice)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Estimasi Margin</span>
                  <span>{formatCurrency(estimatedMargin)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Stok tersedia: <span className="font-semibold">{currentStock}</span> botol
              </p>
            </CardContent>
          </Card>

          {/* Collapsible Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                Lainnya (Tanggal, Bukti Transfer)
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="orderDate" className="text-base font-medium">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Tanggal Order
                </Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={submitting}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Bukti Transfer</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                  disabled={submitting}
                />
                {transferProofPreview ? (
                  <div className="relative">
                    {uploading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    <img
                      src={transferProofPreview}
                      alt="Bukti transfer"
                      className="h-32 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={handleRemoveProof}
                      disabled={submitting || uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Bukti Transfer
                  </Button>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base"
              onClick={onCancel}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-semibold"
              disabled={totalQuantity > currentStock || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Order'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
