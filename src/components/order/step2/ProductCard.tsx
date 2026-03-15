import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onChangeQty: (id: string, delta: number) => void;
  onDeleteItem: (id: string) => void;
}

export function ProductCard({ product, quantity, onChangeQty, onDeleteItem }: ProductCardProps) {
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [translateX, setTranslateX] = React.useState(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart;
    if (diff < 0) {
      setTranslateX(Math.max(diff, -100));
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      if (translateX < -minSwipeDistance) {
        setTranslateX(-80);
      } else {
        setTranslateX(0);
      }
      return;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      {/* Delete Action Behind */}
      <div 
        className="absolute inset-0 bg-red-50 flex items-center justify-end pr-6 transition-opacity"
        style={{ opacity: translateX < 0 ? 1 : 0 }}
      >
        <button 
          onClick={() => onDeleteItem(product.id)}
          className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div
        className={cn(
          "relative bg-white p-4 border-2 transition-all flex items-center gap-4 shadow-sm",
          quantity > 0 ? "border-[#059669] bg-[#F0FDF4]" : "border-transparent"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-[68px] h-[68px] rounded-[16px] bg-[#F0FDF4] flex items-center justify-center shrink-0">
          {(product as any).image_url ? (
            <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-cover rounded-[16px]" />
          ) : (
            <span className="text-2xl">📦</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-slate-800 truncate leading-tight">{product.name}</h4>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            {product.category || 'BP Series'}
          </p>
          <p className="text-[15px] font-bold text-[#059669] mt-1">{formatCurrency(product.default_sell_price)}</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-full border border-slate-100">
          <button
            onClick={() => onChangeQty(product.id, -1)}
            disabled={quantity === 0}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              quantity > 0 ? "bg-white text-slate-600 shadow-sm active:bg-slate-50" : "text-slate-300 pointer-events-none"
            )}
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className={cn(
            "w-6 text-center text-sm font-black",
            quantity > 0 ? "text-slate-800" : "text-slate-400"
          )}>
            {quantity}
          </span>

          <button
            onClick={() => onChangeQty(product.id, 1)}
            className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-sm active:scale-90 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
