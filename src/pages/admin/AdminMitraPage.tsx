import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Filter, MoreVertical, MapPin, Phone, ShieldCheck, Box, UserX, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PRICE_TABLE } from "@/lib/pricing";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/formatters";

export default function AdminMitraPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: mitras, isLoading } = useQuery({
    queryKey: ['admin-mitra-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          phone,
          location,
          mitra_level,
          created_at
        `)
        .eq('role', 'mitra')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(p => p.user_id);
        const { data: stocks } = await supabase
          .from('user_stock')
          .select('user_id, current_stock')
          .in('user_id', userIds);

        // Fetch last transaction per mitra
        const { data: orders } = await supabase
          .from('orders')
          .select('user_id, created_at, total_price')
          .in('user_id', userIds)
          .order('created_at', { ascending: false });

        // Group: latest order per user_id
        const lastOrderMap = new Map<string, { created_at: string; total_price: number }>();
        const orderCountMap = new Map<string, number>();
        if (orders) {
          for (const order of orders) {
            const uid = order.user_id;
            if (!lastOrderMap.has(uid)) {
              lastOrderMap.set(uid, {
                created_at: order.created_at,
                total_price: order.total_price,
              });
            }
            orderCountMap.set(uid, (orderCountMap.get(uid) || 0) + 1);
          }
        }

        return data.map(profile => {
          const stock = stocks?.find(s => s.user_id === profile.user_id);
          const lastOrder = lastOrderMap.get(profile.user_id);
          return {
            ...profile,
            user_stock: stock ? [stock] : [],
            last_transaction: lastOrder?.created_at || null,
            last_transaction_amount: lastOrder?.total_price || null,
            total_orders: orderCountMap.get(profile.user_id) || 0,
          };
        });
      }

      return data;
    }
  });

  const filteredMitras = mitras?.filter(mitra => 
    mitra.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    mitra.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'sap': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'se': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'distributor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'agen_plus': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'agen': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getLevelLabel = (level: string) => {
    if (level === 'agen_plus') return 'Agen Plus';
    if (level === 'sap') return 'SAP';
    if (level === 'se') return 'SE';
    return level?.charAt(0).toUpperCase() + level?.slice(1) || 'Reseller';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Mitra Network</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Kelola dan awasi aktivitas seluruh mitra aktif</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari nama atau kota..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-56"
            />
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Mitra Details</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Level & Area</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Inventory</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Transaksi Terakhir</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-8 bg-slate-100 rounded-lg w-40"></div></td>
                    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-md w-20"></div></td>
                    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-md w-12"></div></td>
                    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-md w-24"></div></td>
                    <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded-md w-20"></div></td>
                    <td className="px-4 py-3"><div className="h-6 bg-slate-100 rounded-lg w-6 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredMitras?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <UserX size={32} className="mb-2 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">Tidak ada mitra ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMitras?.map((mitra) => (
                  <tr key={mitra.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-[10px] uppercase shrink-0 border border-slate-200">
                          {mitra.name?.substring(0, 2) || 'UK'}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                            {mitra.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                            <Phone size={10} />
                            {mitra.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                          getLevelColor(mitra.mitra_level)
                        )}>
                          {getLevelLabel(mitra.mitra_level)}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <MapPin size={10} />
                            {mitra.location || 'Unknown'}
                          </div>
                          <p className="text-[9px] font-bold text-slate-400">
                            Modal: {formatCurrency(PRICE_TABLE[mitra.mitra_level || 'reseller']?.bp || 0)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1 rounded-md",
                          (mitra.user_stock?.[0]?.current_stock || 0) < 10 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
                        )}>
                          <Box size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 leading-none">
                            {mitra.user_stock?.[0]?.current_stock || 0}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Pcs</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {(mitra as any).last_transaction ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                            {formatRelativeTime((mitra as any).last_transaction)}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                            <Clock size={10} />
                            {formatDateTime((mitra as any).last_transaction)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-medium">Belum ada</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        {new Date(mitra.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && filteredMitras && filteredMitras.length > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <p className="text-slate-500 font-medium">Menampilkan <span className="font-bold text-slate-900">{filteredMitras.length}</span> mitra aktif</p>
            <div className="flex gap-2">
              <button className="px-2.5 py-1 border border-slate-200 rounded-md bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Prev</button>
              <button className="px-2.5 py-1 border border-slate-200 rounded-md bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
