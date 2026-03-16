import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  categoryName: string;
  quantity: number;
  pricePerBottle: number;
  subtotal: number;
  onChangeQty: (categoryName: string, delta: number) => void;
}

export function ProductCard({ categoryName, quantity, pricePerBottle, subtotal, onChangeQty }: ProductCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white p-5 border-2 transition-all rounded-[28px] group active:scale-[0.99]",
        quantity > 0 
          ? "border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-100" 
          : "border-slate-50 bg-white hover:border-slate-200 shadow-sm"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Product Image Placeholder/Icon */}
        <div className={cn(
          "w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-all",
          quantity > 0 ? "bg-emerald-100 scale-105" : "bg-slate-50"
        )}>
          <span className="text-3xl">📦</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[18px] font-black text-slate-800 truncate leading-tight">{categoryName}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[14px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
              {formatCurrency(pricePerBottle)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm">
          <button
            onClick={() => onChangeQty(categoryName, -1)}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              quantity > 0 ? "bg-slate-50 text-slate-600 active:bg-slate-200" : "text-slate-200 pointer-events-none"
            )}
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className={cn(
            "w-6 text-center text-[16px] font-black",
            quantity > 0 ? "text-slate-800" : "text-slate-300"
          )}>
            {quantity}
          </span>

          <button
            onClick={() => onChangeQty(categoryName, 1)}
            className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center active:scale-90 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {quantity > 0 && (
        <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subtotal</span>
            <span className="text-sm font-bold text-slate-500">
              {quantity} botol
            </span>
          </div>
          <span className="text-[18px] font-black text-emerald-600 bg-white border border-emerald-100 px-3 py-1 rounded-xl shadow-sm">
            {formatCurrency(subtotal)}
          </span>
        </div>
      )}
    </div>
  );
}
