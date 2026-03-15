import React, { useState } from 'react';
import { ShoppingCart, Plus, ArrowRight, User } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { Product } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Customer = Tables<'customers'>;

interface PilihProdukProps {
  selectedCustomer: Customer;
  products: Product[];
  cart: Record<string, number>;
  onChangeQty: (id: string, delta: number) => void;
  onDeleteProduct: (id: string) => void;
  onToggleCustomerMode: () => void;
  totalHarga: number;
  totalProfit: number;
  totalQty: number;
}

export function PilihProduk({
  selectedCustomer,
  products,
  cart,
  onChangeQty,
  onDeleteProduct,
  onToggleCustomerMode,
  totalHarga,
  totalProfit,
  totalQty
}: PilihProdukProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold text-[#1E293B] leading-tight">Pilih Produk</h1>
      </div>

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

      <div className="px-6 space-y-3 pb-32">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">Daftar Produk</span>
          <span className="text-[11px] font-bold text-[#059669]">{products.length} Tersedia</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cart[product.id] || 0}
              onChangeQty={onChangeQty}
              onDeleteItem={onDeleteProduct}
            />
          ))}

          <button className="w-full h-16 rounded-[20px] border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:border-[#059669] hover:text-[#059669] transition-all group">
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Tambah Produk Lain
          </button>
        </div>
      </div>
    </div>
  );
}
