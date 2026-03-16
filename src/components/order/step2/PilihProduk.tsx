import React, { useState } from 'react';
import { ShoppingCart, Plus, ArrowRight, User } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { Product } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Customer = Tables<'customers'>;

interface PilihProdukProps {
  selectedCustomer?: Customer;
  productCategories: Record<string, Product[]>;
  cart: Record<string, number>;
  onChangeQty: (categoryName: string, delta: number) => void;
  onToggleCustomerMode: () => void;
  cartItems: any[]; // The derived cart items with pricing info
  totalHarga: number;
  totalProfit: number;
  totalQty: number;
}

export function PilihProduk({
  selectedCustomer,
  productCategories,
  cart,
  onChangeQty,
  onToggleCustomerMode,
  cartItems,
  totalHarga,
  totalProfit,
  totalQty
}: PilihProdukProps) {
  const categories = Object.keys(productCategories);
  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold text-[#1E293B] leading-tight">Pilih Produk</h1>
      </div>

      {selectedCustomer && (
        <div className="px-6">
          <div className="bg-[#F0FDF4] border border-emerald-100 rounded-[18px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[14px] bg-[#059669] text-white flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-slate-800 leading-none">{selectedCustomer.name}</h4>
                <p className="text-[12px] text-emerald-600 font-bold mt-1 uppercase tracking-wider">
                  {(selectedCustomer as any).customer_type || 'Customer'}
                </p>
              </div>
            </div>
            <button 
              onClick={onToggleCustomerMode}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] font-bold text-slate-600 active:scale-95 transition-all shadow-sm"
            >
              Ganti
            </button>
          </div>
        </div>
      )}

      <div className="px-6 space-y-3 pb-64">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">Daftar Produk</span>
          <span className="text-[11px] font-bold text-[#059669]">{categories.length} Kategori</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {categories.map((categoryName) => {
            const itemsInCat = productCategories[categoryName];
            const cartInfo = cartItems.find(ci => ci.product.category === categoryName);
            const quantity = cart[categoryName] || 0;
            
            // Get default price from the smallest tier (usually the last in sorted list)
            const defaultProduct = itemsInCat[itemsInCat.length - 1];
            const defaultPrice = defaultProduct.default_sell_price / (defaultProduct.quantity_per_package || 1);

            return (
              <ProductCard
                key={categoryName}
                categoryName={categoryName}
                quantity={quantity}
                pricePerBottle={cartInfo?.pricePerBottle || defaultPrice}
                subtotal={cartInfo?.subtotal || 0}
                onChangeQty={onChangeQty}
              />
            );
          })}

        </div>
      </div>
    </div>
  );
}
