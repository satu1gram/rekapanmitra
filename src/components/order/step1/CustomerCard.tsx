import React from 'react';
import { cn } from '@/lib/utils';
import { Check, User } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerCardProps {
  customer: Customer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  tags?: ('Terakhir' | 'Favorit' | 'Agen' | 'Satuan')[];
}

export function CustomerCard({ customer, isSelected, onSelect, tags = [] }: CustomerCardProps) {
  return (
    <button
      onClick={() => onSelect(customer.id)}
      className={cn(
        "w-full bg-white rounded-[18px] p-4 border-2 transition-all text-left shadow-sm flex items-center gap-4 active:scale-[0.98]",
        isSelected ? "border-[#059669] bg-[#F0FDF4]" : "border-transparent"
      )}
    >
      <div className={cn(
        "w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shrink-0 transition-colors",
        isSelected ? "bg-[#059669] text-white" : "bg-slate-100 text-slate-400"
      )}>
        <User className="w-6 h-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-slate-800 truncate">{customer.name}</h4>
        <p className="text-[12px] text-slate-500 font-medium">
          {(customer as any).customer_type || 'Customer'} • {(customer as any).total_orders || 0} order
        </p>
        
        <div className="flex flex-wrap gap-1 mt-1.5">
          {tags.includes('Terakhir') && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">Terakhir</span>
          )}
          {tags.includes('Favorit') && (
            <span className="px-2 py-0.5 rounded-full bg-[#FEF9C3] text-[#A16207] text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
              <span>★</span> Favorit
            </span>
          )}
          {((customer as any).customer_type === 'Mitra' || (customer as any).customer_type === 'Agen') && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
              Agen
            </span>
          )}
          {((customer as any).customer_type === 'Konsumen' || (customer as any).customer_type === 'Satuan') && (
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-0.5">
              Satuan
            </span>
          )}
        </div>
      </div>
      
      <div className={cn(
        "w-6 h-6 rounded-full bg-[#059669] flex items-center justify-center transition-all",
        isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"
      )}>
        <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
      </div>
    </button>
  );
}
