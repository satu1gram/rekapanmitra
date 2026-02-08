import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderItem } from '@/types';
import { formatCurrency } from '@/lib/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Product } from '@/hooks/useProducts';

interface OrderItemRowProps {
  item: OrderItem;
  index: number;
  products: Product[];
  disabled?: boolean;
  canRemove: boolean;
  onUpdate: (index: number, updates: Partial<OrderItem>) => void;
  onRemove: (index: number) => void;
}

export function OrderItemRow({
  item,
  index,
  products,
  disabled,
  canRemove,
  onUpdate,
  onRemove,
}: OrderItemRowProps) {
  const handleProductChange = (productId: string) => {
    if (productId === '__custom__') {
      onUpdate(index, {
        productId: undefined,
        productName: '',
        pricePerBottle: 250000,
        subtotal: item.quantity * 250000,
      });
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
      onUpdate(index, {
        productId: product.id,
        productName: product.name,
        pricePerBottle: product.default_sell_price,
        subtotal: item.quantity * product.default_sell_price,
      });
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    onUpdate(index, {
      quantity: qty,
      subtotal: qty * item.pricePerBottle,
    });
  };

  const handlePriceChange = (newPrice: number) => {
    onUpdate(index, {
      pricePerBottle: newPrice,
      subtotal: item.quantity * newPrice,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        {/* Product selection */}
        <div className="flex-1">
          {products.length > 0 ? (
            <Select
              value={item.productId || '__custom__'}
              onValueChange={handleProductChange}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Pilih produk..." />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-medium">{p.name}</span>
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">
                  <span className="text-muted-foreground">Ketik manual...</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Nama produk"
              value={item.productName}
              onChange={(e) => onUpdate(index, { productName: e.target.value })}
              disabled={disabled}
              className="h-11 text-base"
            />
          )}
        </div>

        {/* Remove button */}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Custom product name input when "__custom__" selected */}
      {products.length > 0 && !item.productId && (
        <Input
          placeholder="Ketik nama produk..."
          value={item.productName}
          onChange={(e) => onUpdate(index, { productName: e.target.value })}
          disabled={disabled}
          className="h-11 text-base"
        />
      )}

      {/* Quantity + Price row */}
      <div className="flex items-center gap-3">
        {/* Quantity +/- */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={disabled || item.quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            disabled={disabled}
            className="h-10 w-14 text-center text-base font-bold px-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>@</span>
          <Input
            type="number"
            min={0}
            step={1000}
            value={item.pricePerBottle}
            onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0)}
            disabled={disabled}
            className="h-10 w-28 text-base text-right"
          />
        </div>

        {/* Subtotal */}
        <div className="ml-auto text-right shrink-0">
          <p className="text-sm font-bold">{formatCurrency(item.subtotal)}</p>
        </div>
      </div>
    </div>
  );
}
