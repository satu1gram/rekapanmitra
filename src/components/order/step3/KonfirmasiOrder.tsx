import React from 'react';
import { Calendar, User, Package, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { Tables } from '@/integrations/supabase/types';
import type { Product } from '@/hooks/useProducts';

type Customer = Tables<'customers'>;

interface KonfirmasiOrderProps {
  customer: Customer;
  date: string;
  cartItems: { product: Product; quantity: number }[];
  totalHarga: number;
  totalProfit: number;
}

export function KonfirmasiOrder({ customer, date, cartItems, totalHarga, totalProfit }: KonfirmasiOrderProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex flex-col space-y-6 pb-20">
      <div className="px-6">
        <h1 className="text-[28px] font-extrabold text-[#1E293B] leading-tight">Detail Order</h1>
      </div>

      <div className="px-6 space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">Info Pesanan</span>
        <div className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-500">Pelanggan</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{customer.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-500">Tanggal</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{formatDate(date)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Info className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-500">Status</span>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-md">BARU</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">Rincian Produk</span>
        <div className="space-y-3">
          {cartItems.map(({ product, quantity }) => (
            <div key={product.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[14px] bg-slate-50 flex items-center justify-center text-slate-300">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">{product.name}</h4>
                  <p className="text-[12px] text-slate-400 font-bold mt-1">
                    {quantity} × {formatCurrency(product.default_sell_price)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-bold text-slate-900">{formatCurrency(product.default_sell_price * quantity)}</p>
                <p className="text-[11px] font-black text-[#059669] mt-0.5">+{formatCurrency(70000 * quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-2">
        <div className="bg-[#1E293B] rounded-[22px] p-5 flex items-center justify-between shadow-lg shadow-slate-200">
          <div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Total Bayar</p>
            <p className="text-[22px] font-black text-white">{formatCurrency(totalHarga)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-emerald-400/80 font-bold uppercase tracking-widest">Profit Estimasi</p>
            <p className="text-[18px] font-black text-emerald-400 leading-none mt-1">+{formatCurrency(totalProfit)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
