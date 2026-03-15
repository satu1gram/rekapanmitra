import React from 'react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerChipsProps {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CustomerChips({ customers, selectedId, onSelect }: CustomerChipsProps) {
  if (customers.length === 0) return null;

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
      {customers.map((customer) => {
        const isSelected = selectedId === customer.id;
        const isFavorite = (customer as any).is_favorite;
        
        return (
          <button
            key={customer.id}
            onClick={() => onSelect(customer.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all active:scale-95",
              isSelected 
                ? "bg-[#F0FDF4] border-[#059669]" 
                : "bg-white border-slate-200"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-colors shrink-0",
              isSelected ? "bg-[#059669] text-white" : "bg-slate-100 text-slate-500"
            )}>
              {customer.name.substring(0, 1).toUpperCase()}
            </div>
            
            <div className="flex flex-col items-start leading-none">
              <span className={cn(
                "text-[13px] font-bold whitespace-nowrap",
                isSelected ? "text-[#059669]" : "text-slate-700"
              )}>
                {customer.name.split(' ')[0]}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  {(customer as any).customer_type || 'Mitra'}
                </span>
                {isFavorite && <div className="w-1 h-1 rounded-full bg-[#FBBF24]" />}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
