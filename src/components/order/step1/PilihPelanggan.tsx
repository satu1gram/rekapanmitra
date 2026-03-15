import React, { useState } from 'react';
import { Search, Plus, UserPlus } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { CustomerChips } from './CustomerChips';
import { CustomerCard } from './CustomerCard';
import { cn } from '@/lib/utils';

type Customer = Tables<'customers'>;

interface PilihPelangganProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelect: (customer: Customer) => void;
  onAddNew: () => void;
}

export function PilihPelanggan({ customers, selectedCustomerId, onSelect, onAddNew }: PilihPelangganProps) {
  const [search, setSearch] = useState('');

  const favoriteAndRecent = customers
    .filter((c, idx) => (c as any).is_favorite || idx < 5)
    .slice(0, 8);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div className="flex flex-col space-y-6">
      <div className="px-6">
        <h1 className="text-[28px] font-extrabold text-[#1E293B] leading-tight">Pilih Pelanggan</h1>
      </div>

      <div className="px-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white h-12 pl-11 pr-4 rounded-[14px] border border-slate-200 outline-none focus:border-[#059669] transition-all text-[15px] shadow-sm"
          />
        </div>
        <button 
          onClick={onAddNew}
          className="w-12 h-12 bg-[#059669] rounded-[14px] flex items-center justify-center text-white active:scale-95 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {!search && (
        <div className="flex flex-col space-y-3">
          <div className="px-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">Terakhir & Favorit</span>
          </div>
          <CustomerChips 
            customers={favoriteAndRecent} 
            selectedId={selectedCustomerId}
            onSelect={(id) => {
              const c = customers.find(x => x.id === id);
              if (c) onSelect(c);
            }} 
          />
        </div>
      )}

      <div className="flex flex-col space-y-3 px-6 pb-20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[1.5px]">
            {search ? 'Hasil Pencarian' : 'Semua Pelanggan'}
          </span>
          <span className="text-[11px] font-bold text-[#059669]">{filteredCustomers.length} Total</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer, idx) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                isSelected={selectedCustomerId === customer.id}
                onSelect={() => onSelect(customer)}
                tags={[
                  ...(idx === 0 && !search ? ['Terakhir'] as any : []),
                  ...((customer as any).is_favorite ? ['Favorit'] as any : []),
                  ...((customer as any).customer_type === 'Mitra' ? ['Agen'] as any : []),
                  ...((customer as any).customer_type === 'Konsumen' ? ['Satuan'] as any : [])
                ]}
              />
            ))
          ) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold text-sm">Tidak ada pelanggan</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan kata kunci lain atau tambah baru</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
